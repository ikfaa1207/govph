<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Office;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use App\Services\DocumentSequenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function __construct(protected DocumentSequenceService $sequences) {}

    /**
     * Display a listing of users, their roles, and offices/departments.
     */
    public function usersIndex(Request $request): Response
    {
        Gate::authorize('users.manage');

        $query = User::select(['id', 'name', 'email', 'is_active', 'created_at']);

        if ($request->filled('role_id')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('roles.id', $request->integer('role_id'));
            });
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Paginate users and limit selected columns to reduce payload
        $users = $query->with([
            'employee' => function ($q) {
                $q->select('id', 'user_id', 'office_id', 'department_id', 'position');
            },
            'employee.office' => function ($q) {
                $q->select('id', 'name');
            },
            'employee.department' => function ($q) {
                $q->select('id', 'name');
            },
            'roles' => function ($q) {
                // Qualify columns to avoid ambiguous column name errors (SQLite joins)
                $q->select('roles.id', 'roles.name');
            },
        ])
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString();

        $roles = Role::select('id', 'name')->get();
        $offices = Office::select('id', 'name')->get();
        $departments = Department::select('id', 'name')->get();

        return Inertia::render('inventory/admin/users', [
            'users' => $users,
            'roles' => $roles,
            'offices' => $offices,
            'departments' => $departments,
            'filters' => [
                'role_id' => $request->input('role_id'),
                'search' => $request->input('search'),
            ],
        ]);
    }

    /**
     * Update user details and roles.
     */
    public function updateUser(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('users.manage');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'roles' => ['required', 'array'],
            'roles.*' => ['exists:roles,id'],
            'office_id' => ['nullable', 'exists:offices,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'position' => ['nullable', 'string', 'max:100'],
        ]);

        if ($user->id === 1) {
            $adminRole = Role::where('name', 'System Administrator')->first();
            if ($adminRole && ! in_array($adminRole->id, $validated['roles'])) {
                return redirect()->back()->withErrors(['roles' => 'The System Administrator role cannot be removed from the protected Super Admin account.']);
            }
        }

        $oldUser = $user->toArray();

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        // Sync roles
        $user->roles()->sync($validated['roles']);

        // Update employee details if exists
        $employee = $user->employee;
        if ($employee) {
            $employee->update([
                'name' => $validated['name'],
                'position' => $validated['position'] ?? $employee->position,
                'office_id' => $validated['office_id'] ?? $employee->office_id,
                'department_id' => $validated['department_id'] ?? $employee->department_id,
            ]);
        }

        AuditLogger::log('UPDATE_USER_ROLES', $user, $oldUser, $user->load('roles')->toArray());

        return redirect()->back()->with('success', 'User information and roles updated.');
    }

    /**
     * Store a newly created user account.
     */
    public function storeUser(Request $request): RedirectResponse
    {
        Gate::authorize('users.manage');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string'],
            'roles' => ['required', 'array'],
            'roles.*' => ['exists:roles,id'],
            'office_id' => ['required', 'exists:offices,id'],
            'department_id' => ['required', 'exists:departments,id'],
            'position' => ['nullable', 'string', 'max:100'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => true,
            'password_change_required' => true,
        ]);

        $user->roles()->sync($validated['roles']);

        Employee::create([
            'user_id' => $user->id,
            'employee_id' => $this->sequences->next('EMP'),
            'name' => $validated['name'],
            'position' => $validated['position'] ?? 'Staff',
            'office_id' => $validated['office_id'],
            'department_id' => $validated['department_id'],
        ]);

        AuditLogger::log('CREATE_USER', $user, null, $user->load('roles')->toArray());

        return redirect()->back()->with('success', 'User account created successfully.');
    }

    /**
     * Toggle active status of a user.
     */
    public function toggleUserStatus(User $user): RedirectResponse
    {
        Gate::authorize('users.manage');

        if ($user->id === 1) {
            return redirect()->back()->withErrors(['error' => 'The protected Super Admin account cannot be deactivated.']);
        }

        $oldUser = $user->toArray();
        $user->is_active = ! $user->is_active;
        $user->save();

        AuditLogger::log('TOGGLE_USER_STATUS', $user, $oldUser, $user->toArray());

        return redirect()->back()->with('success', 'User status updated successfully.');
    }

    /**
     * Unlock a locked user account.
     */
    public function unlockUser(User $user): RedirectResponse
    {
        Gate::authorize('users.manage');

        $oldUser = $user->toArray();
        $user->failed_login_attempts = 0;
        $user->locked_until = null;
        $user->save();

        AuditLogger::log('UNLOCK_USER', $user, $oldUser, $user->toArray());

        return redirect()->back()->with('success', 'User account unlocked successfully.');
    }

    /**
     * Reset user's password.
     */
    public function resetUserPassword(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('users.manage');

        if ($user->id === 1 && auth()->id() !== 1) {
            return redirect()->back()->withErrors(['error' => 'Only the Super Admin can reset their own password.']);
        }

        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $oldUser = $user->toArray();
        $user->password = Hash::make($validated['password']);
        $user->password_change_required = true;
        // Reset failed login attempts and lockout when admin resets password
        $user->failed_login_attempts = 0;
        $user->locked_until = null;
        $user->save();

        AuditLogger::log('RESET_USER_PASSWORD', $user, $oldUser, ['password_reset' => true]);

        return redirect()->back()->with('success', 'User password reset successfully.');
    }

    /**
     * Display a listing of custom roles and all system permissions.
     */
    public function rolesIndex(Request $request): Response
    {
        Gate::authorize('roles.manage');

        $roles = Role::with(['permissions', 'users'])->get();
        $permissions = Permission::all()->groupBy('module');

        return Inertia::render('inventory/admin/roles', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function storeRole(Request $request): RedirectResponse
    {
        Gate::authorize('roles.manage');

        $validated = $request->validate([
            'name' => ['required', 'string', 'unique:roles,name', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
        ]);

        if (! empty($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        AuditLogger::log('CREATE_ROLE', $role, null, $role->load('permissions')->toArray());

        return redirect()->back()->with('success', 'Role created successfully.');
    }

    /**
     * Update role details and permission mapping.
     */
    public function updateRole(Request $request, Role $role): RedirectResponse
    {
        Gate::authorize('roles.manage');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:roles,name,'.$role->id],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['required', 'array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        $oldRole = $role->load('permissions')->toArray();

        $role->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
        ]);

        $role->permissions()->sync($validated['permissions']);

        AuditLogger::log('UPDATE_ROLE', $role, $oldRole, $role->load('permissions')->toArray());

        return redirect()->back()->with('success', 'Role permissions updated.');
    }

    /**
     * Clone an existing role's permissions.
     */
    public function cloneRole(Request $request, Role $role): RedirectResponse
    {
        Gate::authorize('roles.manage');

        $validated = $request->validate([
            'name' => ['required', 'string', 'unique:roles,name', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $newRole = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? "Clone of {$role->name}",
        ]);

        // Copy permissions
        $permissions = $role->permissions()->pluck('id')->toArray();
        $newRole->permissions()->sync($permissions);

        AuditLogger::log('CLONE_ROLE', $newRole, null, $newRole->load('permissions')->toArray());

        return redirect()->back()->with('success', "Role cloned successfully as {$newRole->name}.");
    }

    /**
     * Delete a role.
     */
    public function deleteRole(Role $role): RedirectResponse
    {
        Gate::authorize('roles.manage');

        if ($role->users()->exists()) {
            return redirect()->back()->withErrors(['error' => 'Cannot delete role because it is currently assigned to users.']);
        }

        $oldRole = $role->toArray();
        $role->delete();

        AuditLogger::log('DELETE_ROLE', $role, $oldRole, null);

        return redirect()->back()->with('success', 'Role deleted successfully.');
    }

    /**
     * Store a newly created office.
     */
    public function storeOffice(Request $request): JsonResponse
    {
        Gate::authorize('users.manage');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:offices,code'],
        ]);

        $office = Office::create($validated);

        AuditLogger::log('CREATE_OFFICE', $office, null, $office->toArray());

        return response()->json($office);
    }

    /**
     * Store a newly created department.
     */
    public function storeDepartment(Request $request): JsonResponse
    {
        Gate::authorize('users.manage');

        $validated = $request->validate([
            'office_id' => ['required', 'exists:offices,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:departments,code'],
        ]);

        $department = Department::create($validated);
        $department->load('office');

        AuditLogger::log('CREATE_DEPARTMENT', $department, null, $department->toArray());

        return response()->json($department);
    }
}
