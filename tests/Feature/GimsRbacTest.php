<?php

use App\Models\Category;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Office;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Models\Unit;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthorized users are denied access and an audit log entry is created', function () {
    // Create direct employee with no special permissions
    $user = User::create([
        'name' => 'Normal Staff',
        'email' => 'staff@example.com',
        'password' => bcrypt('password'),
        'role' => 'employee'
    ]);

    $this->actingAs($user);

    // Try accessing reports list (which requires reports.view)
    $response = $this->get(route('inventory.reports.index'));

    // Expect 403 Forbidden
    $response->assertForbidden();

    // Verify audit log captured the unauthorized attempt
    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $user->id,
        'action' => 'UNAUTHORIZED_ACCESS_ATTEMPT',
        'permission' => 'reports.view',
        'module' => 'reports',
    ]);
});

test('users can access routes if assigned permission directly or via role', function () {
    // Setup permission
    $permission = Permission::create([
        'name' => 'reports.view',
        'module' => 'reports',
        'description' => 'View reports'
    ]);

    // User 1: Direct Permission
    $userDirect = User::create(['name' => 'Direct P', 'email' => 'direct@example.com', 'password' => bcrypt('password'), 'role' => 'employee']);
    $userDirect->givePermissionTo('reports.view');

    // User 2: Role Permission
    $role = Role::create(['name' => 'Report Viewer']);
    $role->permissions()->attach($permission->id);

    $userRole = User::create(['name' => 'Role P', 'email' => 'role@example.com', 'password' => bcrypt('password'), 'role' => 'employee']);
    $userRole->assignRole('Report Viewer');

    // Verify User 1
    $this->actingAs($userDirect);
    $this->get(route('inventory.reports.index'))->assertOk();

    // Verify User 2
    $this->actingAs($userRole);
    $this->get(route('inventory.reports.index'))->assertOk();
});

test('a creator cannot approve their own requisition request', function () {
    // Setup foundation records
    $office = Office::create(['code' => 'O-TEST', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST', 'name' => 'Test Dept']);
    $unit = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
    $category = Category::create(['name' => 'Office Supplies', 'code' => 'SUPP', 'is_ppe' => false]);

    $item = Item::create([
        'item_code' => 'ITEM-BOND-01',
        'name' => 'Bond Paper',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'unit_cost' => 100.00,
        'reorder_level' => 10,
        'maximum_stock' => 100,
    ]);

    // Creator Department Head (has request.create and request.approve)
    $headUser = User::create(['name' => 'Head', 'email' => 'head@example.com', 'password' => bcrypt('password'), 'role' => 'dept_head']);
    $head = Employee::create(['user_id' => $headUser->id, 'employee_id' => 'E01', 'name' => 'Head', 'position' => 'Head', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $permCreate = Permission::create(['name' => 'request.create', 'module' => 'requisitions']);
    $permApprove = Permission::create(['name' => 'request.approve', 'module' => 'requisitions']);

    $headUser->givePermissionTo($permCreate, $permApprove);

    // Step 1: Create Requisition (RIS)
    $this->actingAs($headUser);
    $requisition = Requisition::create([
        'ris_number' => 'RIS-TEST-01',
        'requesting_employee_id' => $head->id,
        'department_id' => $dept->id,
        'status' => 'pending_dept_head',
    ]);

    $requisitionItem = RequisitionItem::create([
        'requisition_id' => $requisition->id,
        'item_id' => $item->id,
        'quantity_requested' => 10,
    ]);

    // Step 2: Try to self-approve. Should fail with 403 Forbidden
    $response = $this->post(route('inventory.requisitions.approve', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_approved' => 10],
        ]
    ]);

    $response->assertForbidden();
});

test('users with password_change_required are redirected to settings', function () {
    $user = User::create([
        'name' => 'New Employee',
        'email' => 'new@example.com',
        'password' => bcrypt('password'),
        'role' => 'employee',
        'password_change_required' => true,
    ]);

    // Give user dashboard permission so the 403 is not from RBAC
    Permission::create(['name' => 'dashboard.view', 'module' => 'dashboard']);
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user);

    // Try to access dashboard — should redirect to password settings
    $response = $this->get(route('dashboard'));

    $response->assertRedirect(route('security.edit'));
});

test('audit log captures module, permission, and user role fields', function () {
    $role = Role::create(['name' => 'Supply Officer']);
    $permission = Permission::create(['name' => 'inventory.view', 'module' => 'inventory', 'description' => 'View inventory']);
    $role->permissions()->attach($permission->id);

    $user = User::create(['name' => 'SO User', 'email' => 'so@example.com', 'password' => bcrypt('password'), 'role' => 'supply_officer']);
    $user->assignRole('Supply Officer');

    $this->actingAs($user);

    // Log a mock audit entry via AuditLogger
    $unit = Unit::create(['name' => 'Box', 'abbreviation' => 'bx']);
    $category = Category::create(['name' => 'Test Cat', 'code' => 'TC', 'is_ppe' => false]);
    $item = Item::create(['item_code' => 'T-001', 'name' => 'Test Item', 'category_id' => $category->id, 'unit_id' => $unit->id, 'unit_cost' => 50, 'reorder_level' => 5, 'maximum_stock' => 50]);

    \App\Services\Audit\AuditLogger::log(
        'CREATE_ITEM',
        $item,
        null,
        $item->toArray(),
        'inventory',
        'inventory.create',
    );

    // Verify the audit log has all RBAC fields
    $log = AuditLog::latest()->first();

    expect($log->action)->toBe('CREATE_ITEM');
    expect($log->module)->toBe('inventory');
    expect($log->permission)->toBe('inventory.create');
    expect($log->user_role)->toBe('Supply Officer');
    expect($log->user_id)->toBe($user->id);
    expect($log->model_type)->toBe(Item::class);
    expect($log->model_id)->toBe($item->id);
    expect($log->ip_address)->not->toBeNull();
});

test('public registration route is disabled', function () {
    // Fortify registration should return 404 or redirect since it is disabled in features
    $response = $this->get('/register');
    $response->assertStatus(404);
});

test('password policy validation enforces complexity', function () {
    $rule = new \App\Rules\PasswordPolicyRule();

    $fails = false;
    $rule->validate('password', 'short', function ($message) use (&$fails) {
        $fails = true;
    });
    expect($fails)->toBeTrue();

    // Compliant password: 12+ chars, mixed case, number, special char
    $failsCompliant = false;
    $rule->validate('password', 'SecurePass123!', function ($message) use (&$failsCompliant) {
        $failsCompliant = true;
    });
    expect($failsCompliant)->toBeFalse();
});

test('password policy prevents reusing last 5 passwords', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'pw-test@example.com',
        'password' => bcrypt('password123'),
        'role' => 'employee',
    ]);

    // Initial password will automatically be saved to history by User's boot listener.
    // Let's verify history table has the hashed password
    $this->assertDatabaseHas('password_histories', [
        'user_id' => $user->id,
    ]);

    // The new password is 'password123' (which is the same as current/past password)
    $rule = new \App\Rules\PasswordPolicyRule($user);
    $fails = false;
    $rule->validate('password', 'password123', function ($message) use (&$fails) {
        $fails = true;
    });
    expect($fails)->toBeTrue();
});

test('super admin account cannot be deactivated or have System Administrator role removed', function () {
    // Seed system administrator role
    $adminRole = Role::create(['name' => 'System Administrator']);
    
    // Create the protected user ID 1
    $superAdmin = new User([
        'name' => 'Super Admin',
        'email' => 'superadmin@example.com',
        'password' => bcrypt('password123456'),
        'role' => 'admin',
    ]);
    $superAdmin->id = 1;
    $superAdmin->save();
    
    $superAdmin->assignRole($adminRole);
    
    // Give permissions to manage users & super admin bypass
    $superAdmin->givePermissionTo(
        Permission::create(['name' => 'users.manage', 'module' => 'users']),
        Permission::create(['name' => 'admin.super', 'module' => 'admin'])
    );

    // Act as super admin
    $this->actingAs($superAdmin);

    // Try deactivating super admin — should return error in session
    $response = $this->post(route('inventory.admin.users.toggle', $superAdmin->id));
    $response->assertSessionHasErrors(['error']);
    expect($superAdmin->fresh()->is_active)->toBeTrue();

    // Try removing System Administrator role (posting with empty roles array)
    $responseUpdate = $this->post(route('inventory.admin.users.update', $superAdmin->id), [
        'name' => 'Super Admin Updated',
        'email' => 'superadmin@example.com',
        'roles' => [], // Empty roles
    ]);
    $responseUpdate->assertSessionHasErrors(['roles']);
    expect($superAdmin->fresh()->roles()->count())->toBe(1);
});

test('account lockout occurs after 5 failed login attempts', function () {
    $user = User::create([
        'name' => 'Lockout User',
        'email' => 'lockout@example.com',
        'password' => bcrypt('SecurePass123!'),
        'role' => 'employee',
        'is_active' => true,
    ]);

    // Simulating 5 failed login attempts and clearing rate limiter each time
    for ($i = 0; $i < 5; $i++) {
        \Illuminate\Support\Facades\Cache::flush();
        $response = $this->post('/login', [
            'email' => 'lockout@example.com',
            'password' => 'wrongpassword',
        ]);
    }

    // User should be locked out
    $user = $user->fresh();
    expect($user->locked_until)->not->toBeNull();
    expect($user->locked_until->isFuture())->toBeTrue();

    // Trying to log in again should throw validation exception
    \Illuminate\Support\Facades\Cache::flush();
    
    $response = $this->post('/login', [
        'email' => 'lockout@example.com',
        'password' => 'SecurePass123!',
    ]);
    $response->assertSessionHasErrors('email');
});

test('admin can unlock a locked out account', function () {
    $admin = User::create([
        'name' => 'Admin',
        'email' => 'admin-lock@example.com',
        'password' => bcrypt('password123456'),
        'role' => 'admin',
    ]);
    // Give permissions to manage users
    $admin->givePermissionTo(Permission::create(['name' => 'users.manage', 'module' => 'users']));

    $user = User::create([
        'name' => 'Locked User',
        'email' => 'locked@example.com',
        'password' => bcrypt('SecurePass123!'),
        'role' => 'employee',
        'locked_until' => now()->addMinutes(30),
        'failed_login_attempts' => 5,
    ]);

    $this->actingAs($admin);

    // Call unlock route
    $response = $this->post(route('inventory.admin.users.unlock', $user->id));
    $response->assertSessionHasNoErrors();

    $user = $user->fresh();
    expect($user->failed_login_attempts)->toBe(0);
    expect($user->locked_until)->toBeNull();
});

test('password expires after 60 days', function () {
    $user = User::create([
        'name' => 'Expired User',
        'email' => 'expired@example.com',
        'password' => bcrypt('SecurePass123!'),
        'role' => 'employee',
    ]);
    $user->password_changed_at = now()->subDays(61);
    $user->saveQuietly();

    // Give dashboard permission
    $user->givePermissionTo(Permission::create(['name' => 'dashboard.view', 'module' => 'dashboard']));

    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('security.edit'));
    $response->assertSessionHas('warning', 'Your password has expired. You must change your password before continuing.');
});

test('password expiry warning appears 7 days prior', function () {
    $user = User::create([
        'name' => 'Warning User',
        'email' => 'warning-pw@example.com',
        'password' => bcrypt('SecurePass123!'),
        'role' => 'employee',
    ]);
    $user->password_changed_at = now()->subDays(55);
    $user->saveQuietly();

    // Give dashboard permission
    $user->givePermissionTo(Permission::create(['name' => 'dashboard.view', 'module' => 'dashboard']));

    // Enable 2FA for this user so they don't get redirected by EnsureTwoFactorEnabled middleware
    $user->update(['two_factor_secret' => 'secret_key']);

    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk(); // No redirect, but warning in session
    $response->assertSessionHas('warning');
});

test('mandatory 2fa redirects users without 2fa', function () {
    $user = User::create([
        'name' => 'No 2FA User',
        'email' => 'no-2fa@example.com',
        'password' => bcrypt('SecurePass123!'),
        'role' => 'employee',
        'password_changed_at' => now(),
    ]);

    // Give dashboard permission
    $user->givePermissionTo(Permission::create(['name' => 'dashboard.view', 'module' => 'dashboard']));

    $this->actingAs($user);

    $response = $this->get(route('dashboard') . '?enforce_2fa=1');
    $response->assertRedirect(route('security.edit'));
    $response->assertSessionHas('warning', 'Two-factor authentication is required. Please set it up to continue.');
});

test('single active session policy invalidates old sessions', function () {
    $user = User::create([
        'name' => 'Single Session User',
        'email' => 'single-session@example.com',
        'password' => bcrypt('SecurePass123!'),
        'role' => 'employee',
        'is_active' => true,
    ]);

    // Insert mock sessions into database sessions table
    \Illuminate\Support\Facades\DB::table('sessions')->insert([
        [
            'id' => 'session_old_1',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla',
            'payload' => 'payload',
            'last_activity' => time(),
        ],
        [
            'id' => 'session_old_2',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla',
            'payload' => 'payload',
            'last_activity' => time(),
        ],
    ]);

    // Verify sessions count is 2
    expect(\Illuminate\Support\Facades\DB::table('sessions')->where('user_id', $user->id)->count())->toBe(2);

    // Simulate login
    $response = $this->post('/login', [
        'email' => 'single-session@example.com',
        'password' => 'SecurePass123!',
    ]);

    // Verify all old sessions were deleted
    expect(\Illuminate\Support\Facades\DB::table('sessions')->where('user_id', $user->id)->count())->toBe(0);
});

