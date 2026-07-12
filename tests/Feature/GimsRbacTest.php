<?php

use App\Enums\RequisitionStatus;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Office;
use App\Models\Permission;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use App\Rules\PasswordPolicyRule;
use App\Services\Audit\AuditLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

test('unauthorized users are denied access and an audit log entry is created', function () {
    // Create direct employee with no special permissions
    $user = User::factory()->employee()->create([
        'name' => 'Normal Staff',
        'email' => 'staff@example.com',
        'password' => bcrypt('password'),
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
        'description' => 'View reports',
    ]);

    // User 1: Direct Permission
    $userDirect = User::factory()->employee()->create(['name' => 'Direct P', 'email' => 'direct@example.com', 'password' => bcrypt('password')]);
    $userDirect->givePermissionTo('reports.view');

    // User 2: Role Permission
    $role = Role::create(['name' => 'Report Viewer']);
    $role->permissions()->attach($permission->id);

    $userRole = User::factory()->employee()->create(['name' => 'Role P', 'email' => 'role@example.com', 'password' => bcrypt('password')]);
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
    $headUser = User::factory()->deptHead()->create(['name' => 'Head', 'email' => 'head@example.com', 'password' => bcrypt('password')]);
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
        ],
    ]);

    $response->assertForbidden();
});

test('users with password_change_required are redirected to settings', function () {
    $user = User::factory()->employee()->create([
        'name' => 'New Employee',
        'email' => 'new@example.com',
        'password' => bcrypt('password'),
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

    $user = User::factory()->supplyOfficer()->create(['name' => 'SO User', 'email' => 'so@example.com', 'password' => bcrypt('password')]);
    $user->assignRole('Supply Officer');

    $this->actingAs($user);

    // Log a mock audit entry via AuditLogger
    $unit = Unit::create(['name' => 'Box', 'abbreviation' => 'bx']);
    $category = Category::create(['name' => 'Test Cat', 'code' => 'TC', 'is_ppe' => false]);
    $item = Item::create(['item_code' => 'T-001', 'name' => 'Test Item', 'category_id' => $category->id, 'unit_id' => $unit->id, 'unit_cost' => 50, 'reorder_level' => 5, 'maximum_stock' => 50]);

    AuditLogger::log(
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
    $rule = new PasswordPolicyRule;

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
    $user = User::factory()->employee()->create([
        'name' => 'Test User',
        'email' => 'pw-test@example.com',
        'password' => bcrypt('password123'),
    ]);

    // Initial password will automatically be saved to history by User's boot listener.
    // Let's verify history table has the hashed password
    $this->assertDatabaseHas('password_histories', [
        'user_id' => $user->id,
    ]);

    // The new password is 'password123' (which is the same as current/past password)
    $rule = new PasswordPolicyRule($user);
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
    $user = User::factory()->employee()->create([
        'name' => 'Lockout User',
        'email' => 'lockout@example.com',
        'password' => bcrypt('SecurePass123!'),
        'is_active' => true,
    ]);

    // Simulating 5 failed login attempts and clearing rate limiter each time
    for ($i = 0; $i < 5; $i++) {
        Cache::flush();
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
    Cache::flush();

    $response = $this->post('/login', [
        'email' => 'lockout@example.com',
        'password' => 'SecurePass123!',
    ]);
    $response->assertSessionHasErrors('email');
});

test('admin can unlock a locked out account', function () {
    $admin = User::factory()->admin()->create([
        'name' => 'Admin',
        'email' => 'admin-lock@example.com',
        'password' => bcrypt('password123456'),
    ]);
    // Give permissions to manage users
    $admin->givePermissionTo(Permission::create(['name' => 'users.manage', 'module' => 'users']));

    $user = User::factory()->employee()->create([
        'name' => 'Locked User',
        'email' => 'locked@example.com',
        'password' => bcrypt('SecurePass123!'),
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
    $user = User::factory()->employee()->create([
        'name' => 'Expired User',
        'email' => 'expired@example.com',
        'password' => bcrypt('SecurePass123!'),
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
    $user = User::factory()->employee()->create([
        'name' => 'Warning User',
        'email' => 'warning-pw@example.com',
        'password' => bcrypt('SecurePass123!'),
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
    $user = User::factory()->employee()->create([
        'name' => 'No 2FA User',
        'email' => 'no-2fa@example.com',
        'password' => bcrypt('SecurePass123!'),
        'password_changed_at' => now(),
    ]);

    // Give dashboard permission
    $user->givePermissionTo(Permission::create(['name' => 'dashboard.view', 'module' => 'dashboard']));

    $this->actingAs($user);

    $response = $this->get(route('dashboard').'?enforce_2fa=1');
    $response->assertRedirect(route('security.edit'));
    $response->assertSessionHas('warning', 'Two-factor authentication is required. Please set it up to continue.');
});

test('single active session policy invalidates old sessions', function () {
    $user = User::factory()->employee()->create([
        'name' => 'Single Session User',
        'email' => 'single-session@example.com',
        'password' => bcrypt('SecurePass123!'),
        'is_active' => true,
    ]);

    // Insert mock sessions into database sessions table
    DB::table('sessions')->insert([
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
    expect(DB::table('sessions')->where('user_id', $user->id)->count())->toBe(2);

    // Simulate login
    $response = $this->post('/login', [
        'email' => 'single-session@example.com',
        'password' => 'SecurePass123!',
    ]);

    // Verify all old sessions were deleted
    expect(DB::table('sessions')->where('user_id', $user->id)->count())->toBe(0);
});

test('requisition automatically resolves and sets correct department_head_id on creation', function () {
    $office = Office::create(['code' => 'O-TEST-1', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-1', 'name' => 'Test Dept']);
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

    // Create staff employee and head employee in the same department
    $employeeUser = User::factory()->employee()->create(['name' => 'Staff', 'email' => 'staff1@example.com', 'password' => bcrypt('password')]);
    $employee = Employee::create(['user_id' => $employeeUser->id, 'employee_id' => 'E10', 'name' => 'Staff', 'position' => 'Staff', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $headUser = User::factory()->deptHead()->create(['name' => 'Head', 'email' => 'head1@example.com', 'password' => bcrypt('password')]);
    $head = Employee::create(['user_id' => $headUser->id, 'employee_id' => 'E11', 'name' => 'Head', 'position' => 'Head', 'office_id' => $office->id, 'department_id' => $dept->id]);

    Permission::create(['name' => 'request.create', 'module' => 'requisition']);
    $employeeUser->givePermissionTo('request.create');

    $this->actingAs($employeeUser);
    $response = $this->post(route('inventory.requisitions.store'), [
        'items' => [
            ['item_id' => $item->id, 'quantity' => 5],
        ],
        'purpose' => 'Office printing',
    ]);

    $response->assertRedirect();
    $requisition = Requisition::first();
    expect($requisition->department_head_id)->toBe($head->id);
});

test('a department head cannot approve a requisition routed to a different department head', function () {
    $office = Office::create(['code' => 'O-TEST-2', 'name' => 'Test Office']);
    $deptA = Department::create(['office_id' => $office->id, 'code' => 'D-A', 'name' => 'Dept A']);
    $deptB = Department::create(['office_id' => $office->id, 'code' => 'D-B', 'name' => 'Dept B']);
    $unit = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
    $category = Category::create(['name' => 'Office Supplies', 'code' => 'SUPP', 'is_ppe' => false]);
    $item = Item::create([
        'item_code' => 'ITEM-BOND-02',
        'name' => 'Bond Paper',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'unit_cost' => 100.00,
        'reorder_level' => 10,
        'maximum_stock' => 100,
    ]);

    // Dept A Staff and Head
    $staffAUser = User::factory()->employee()->create(['name' => 'Staff A', 'email' => 'staffa@example.com', 'password' => bcrypt('password')]);
    $staffA = Employee::create(['user_id' => $staffAUser->id, 'employee_id' => 'EA1', 'name' => 'Staff A', 'position' => 'Staff A', 'office_id' => $office->id, 'department_id' => $deptA->id]);

    $headAUser = User::factory()->deptHead()->create(['name' => 'Head A', 'email' => 'heada@example.com', 'password' => bcrypt('password')]);
    $headA = Employee::create(['user_id' => $headAUser->id, 'employee_id' => 'EA2', 'name' => 'Head A', 'position' => 'Head A', 'office_id' => $office->id, 'department_id' => $deptA->id]);

    // Dept B Head
    $headBUser = User::factory()->deptHead()->create(['name' => 'Head B', 'email' => 'headb@example.com', 'password' => bcrypt('password')]);
    $headB = Employee::create(['user_id' => $headBUser->id, 'employee_id' => 'EB2', 'name' => 'Head B', 'position' => 'Head B', 'office_id' => $office->id, 'department_id' => $deptB->id]);

    $permCreate = Permission::create(['name' => 'request.create', 'module' => 'requisition']);
    $permApprove = Permission::create(['name' => 'request.approve', 'module' => 'requisition']);

    $staffAUser->givePermissionTo($permCreate);
    $headAUser->givePermissionTo($permApprove);
    $headBUser->givePermissionTo($permApprove);

    // Create requisition for Dept A
    $this->actingAs($staffAUser);
    $this->post(route('inventory.requisitions.store'), [
        'items' => [
            ['item_id' => $item->id, 'quantity' => 5],
        ],
    ]);

    $requisition = Requisition::first();
    $requisitionItem = RequisitionItem::first();

    // Head B tries to approve it - should fail (403)
    $this->actingAs($headBUser);
    $response = $this->post(route('inventory.requisitions.approve', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_approved' => 5],
        ],
    ]);
    $response->assertForbidden();

    // Head A can approve it
    $this->actingAs($headAUser);
    $responseSuccess = $this->post(route('inventory.requisitions.approve', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_approved' => 5],
        ],
    ]);
    $responseSuccess->assertRedirect();
});

test('system administrators can approve any requisition (override/bypass)', function () {
    $office = Office::create(['code' => 'O-TEST-3', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-3', 'name' => 'Test Dept']);
    $unit = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
    $category = Category::create(['name' => 'Office Supplies', 'code' => 'SUPP', 'is_ppe' => false]);
    $item = Item::create([
        'item_code' => 'ITEM-BOND-03',
        'name' => 'Bond Paper',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'unit_cost' => 100.00,
        'reorder_level' => 10,
        'maximum_stock' => 100,
    ]);

    $employeeUser = User::factory()->employee()->create(['name' => 'Staff', 'email' => 'staff3@example.com', 'password' => bcrypt('password')]);
    $employee = Employee::create(['user_id' => $employeeUser->id, 'employee_id' => 'E30', 'name' => 'Staff', 'position' => 'Staff', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $headUser = User::factory()->deptHead()->create(['name' => 'Head', 'email' => 'head3@example.com', 'password' => bcrypt('password')]);
    $head = Employee::create(['user_id' => $headUser->id, 'employee_id' => 'E31', 'name' => 'Head', 'position' => 'Head', 'office_id' => $office->id, 'department_id' => $dept->id]);

    // Admin user (role admin, has System Administrator role)
    $adminRole = Role::create(['name' => 'System Administrator']);
    $adminUser = User::factory()->admin()->create(['name' => 'Admin User', 'email' => 'admin3@example.com', 'password' => bcrypt('password')]);
    $adminUser->assignRole($adminRole);

    $permCreate = Permission::create(['name' => 'request.create', 'module' => 'requisition']);
    $permApprove = Permission::create(['name' => 'request.approve', 'module' => 'requisition']);
    $permSuper = Permission::create(['name' => 'admin.super', 'module' => 'admin']);
    $adminRole->permissions()->attach($permSuper->id);

    $employeeUser->givePermissionTo($permCreate);

    $this->actingAs($employeeUser);
    $this->post(route('inventory.requisitions.store'), [
        'items' => [
            ['item_id' => $item->id, 'quantity' => 5],
        ],
    ]);

    $requisition = Requisition::first();
    $requisitionItem = RequisitionItem::first();

    // Admin can approve it directly
    $this->actingAs($adminUser);
    $response = $this->post(route('inventory.requisitions.approve', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_approved' => 5],
        ],
    ]);
    $response->assertRedirect();
});

test('system administrators can approve a requisition with no designated department head (fallback)', function () {
    $office = Office::create(['code' => 'O-TEST-4', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-4', 'name' => 'Test Dept']);
    $unit = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
    $category = Category::create(['name' => 'Office Supplies', 'code' => 'SUPP', 'is_ppe' => false]);
    $item = Item::create([
        'item_code' => 'ITEM-BOND-04',
        'name' => 'Bond Paper',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'unit_cost' => 100.00,
        'reorder_level' => 10,
        'maximum_stock' => 100,
    ]);

    $employeeUser = User::factory()->employee()->create(['name' => 'Staff', 'email' => 'staff4@example.com', 'password' => bcrypt('password')]);
    $employee = Employee::create(['user_id' => $employeeUser->id, 'employee_id' => 'E40', 'name' => 'Staff', 'position' => 'Staff', 'office_id' => $office->id, 'department_id' => $dept->id]);

    // Admin user
    $adminRole = Role::create(['name' => 'System Administrator']);
    $adminUser = User::factory()->admin()->create(['name' => 'Admin User', 'email' => 'admin4@example.com', 'password' => bcrypt('password')]);
    $adminUser->assignRole($adminRole);

    $permCreate = Permission::create(['name' => 'request.create', 'module' => 'requisition']);
    $permApprove = Permission::create(['name' => 'request.approve', 'module' => 'requisition']);
    $permSuper = Permission::firstOrCreate(['name' => 'admin.super', 'module' => 'admin']);
    $adminRole->permissions()->attach($permSuper->id);

    $employeeUser->givePermissionTo($permCreate);

    // Create requisition when no department head exists
    $this->actingAs($employeeUser);
    $this->post(route('inventory.requisitions.store'), [
        'items' => [
            ['item_id' => $item->id, 'quantity' => 5],
        ],
    ]);

    $requisition = Requisition::first();
    expect($requisition->department_head_id)->toBeNull();
    $requisitionItem = RequisitionItem::first();

    // Admin can approve it directly
    $this->actingAs($adminUser);
    $response = $this->post(route('inventory.requisitions.approve', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_approved' => 5],
        ],
    ]);
    $response->assertRedirect();
});

test('dashboard stats and pending feed are correctly scoped based on role', function () {
    $office = Office::create(['code' => 'O-TEST-5', 'name' => 'Test Office']);
    $deptA = Department::create(['office_id' => $office->id, 'code' => 'D-A5', 'name' => 'Dept A']);
    $deptB = Department::create(['office_id' => $office->id, 'code' => 'D-B5', 'name' => 'Dept B']);

    $staffAUser = User::factory()->employee()->create(['name' => 'Staff A', 'email' => 'staffa5@example.com', 'password' => bcrypt('password')]);
    $staffA = Employee::create(['user_id' => $staffAUser->id, 'employee_id' => 'EA5', 'name' => 'Staff A', 'position' => 'Staff A', 'office_id' => $office->id, 'department_id' => $deptA->id]);

    $staffBUser = User::factory()->employee()->create(['name' => 'Staff B', 'email' => 'staffb5@example.com', 'password' => bcrypt('password')]);
    $staffB = Employee::create(['user_id' => $staffBUser->id, 'employee_id' => 'EB5', 'name' => 'Staff B', 'position' => 'Staff B', 'office_id' => $office->id, 'department_id' => $deptB->id]);

    $headAUser = User::factory()->deptHead()->create(['name' => 'Head A', 'email' => 'heada5@example.com', 'password' => bcrypt('password')]);
    $headA = Employee::create(['user_id' => $headAUser->id, 'employee_id' => 'EHA5', 'name' => 'Head A', 'position' => 'Head A', 'office_id' => $office->id, 'department_id' => $deptA->id]);

    $headBUser = User::factory()->deptHead()->create(['name' => 'Head B', 'email' => 'headb5@example.com', 'password' => bcrypt('password')]);
    $headB = Employee::create(['user_id' => $headBUser->id, 'employee_id' => 'EHB5', 'name' => 'Head B', 'position' => 'Head B', 'office_id' => $office->id, 'department_id' => $deptB->id]);

    Permission::create(['name' => 'dashboard.view', 'module' => 'dashboard']);
    Permission::create(['name' => 'request.approve', 'module' => 'requisition']);

    $staffAUser->givePermissionTo('dashboard.view');
    $staffBUser->givePermissionTo('dashboard.view');
    $headAUser->givePermissionTo('dashboard.view', 'request.approve');
    $headBUser->givePermissionTo('dashboard.view', 'request.approve');

    // Create 1 pending requisition for Dept A, and 1 for Dept B
    Requisition::create([
        'ris_number' => 'RIS-A',
        'requesting_employee_id' => $staffA->id,
        'department_id' => $deptA->id,
        'status' => 'pending_dept_head',
        'department_head_id' => $headA->id,
    ]);

    Requisition::create([
        'ris_number' => 'RIS-B',
        'requesting_employee_id' => $staffB->id,
        'department_id' => $deptB->id,
        'status' => 'pending_dept_head',
        'department_head_id' => $headB->id,
    ]);

    // 1. Regular employee Staff A dashboard - should only see 1 pending requisition (their own)
    $this->actingAs($staffAUser);
    $response = $this->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('stats.pendingRequests', 1)
        ->has('pendingRequests', 1)
        ->where('pendingRequests.0.ris_number', 'RIS-A')
    );

    // 2. Department Head A dashboard - should only see 1 pending requisition (within their department)
    $this->actingAs($headAUser);
    $response = $this->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('stats.pendingRequests', 1)
        ->has('pendingRequests', 1)
        ->where('pendingRequests.0.ris_number', 'RIS-A')
    );
});

test('2fa enforcement is optional and can be toggled via configuration', function () {
    $user = User::factory()->employee()->create([
        'name' => 'Optional 2FA User',
        'email' => 'optional-2fa@example.com',
        'password' => bcrypt('SecurePass123!'),
        'password_changed_at' => now(),
    ]);

    // Give dashboard permission
    $user->givePermissionTo(Permission::create(['name' => 'dashboard.view', 'module' => 'dashboard']));

    $this->actingAs($user);

    // 1. By default config('fortify.two_factor_enforced') is false, navigation should succeed (200 OK)
    config(['fortify.two_factor_enforced' => false]);
    $response = $this->get(route('dashboard'));
    $response->assertOk();

    // 2. When config('fortify.two_factor_enforced') is true, it should redirect to security page
    config(['fortify.two_factor_enforced' => true]);
    $responseRedirect = $this->get(route('dashboard'));
    $responseRedirect->assertRedirect(route('security.edit'));
    $responseRedirect->assertSessionHas('warning', 'Two-factor authentication is required. Please set it up to continue.');
});

test('admin users can create offices and departments inline', function () {
    $admin = User::factory()->admin()->create([
        'name' => 'Admin User',
        'email' => 'admin-offices@example.com',
        'password' => bcrypt('password'),
    ]);
    $admin->givePermissionTo(Permission::create(['name' => 'users.manage', 'module' => 'users']));

    $this->actingAs($admin);

    // Create office
    $responseOffice = $this->post(route('inventory.offices.store'), [
        'name' => 'Office of the Governor',
        'code' => 'GOV',
    ]);

    $responseOffice->assertOk();
    $this->assertDatabaseHas('offices', [
        'code' => 'GOV',
        'name' => 'Office of the Governor',
    ]);

    $officeId = $responseOffice->json('id');

    // Create department under governor office
    $responseDept = $this->post(route('inventory.departments.store'), [
        'office_id' => $officeId,
        'name' => 'Public Information Division',
        'code' => 'PID',
    ]);

    $responseDept->assertOk();
    $this->assertDatabaseHas('departments', [
        'office_id' => $officeId,
        'code' => 'PID',
        'name' => 'Public Information Division',
    ]);
});

test('inline office and department creation enforces uniqueness and authorization constraints', function () {
    $office = Office::create(['code' => 'OFF-1', 'name' => 'Office 1']);

    // Create unauthorized user
    $staff = User::factory()->employee()->create([
        'name' => 'Staff User',
        'email' => 'staff-offices@example.com',
        'password' => bcrypt('password'),
    ]);

    // 1. Unauthorized user cannot create office
    $this->actingAs($staff);
    $responseAuth = $this->post(route('inventory.offices.store'), [
        'name' => 'Office 2',
        'code' => 'OFF-2',
    ]);
    $responseAuth->assertForbidden();

    // 2. Admin cannot create office with duplicate code
    $admin = User::factory()->admin()->create([
        'name' => 'Admin User',
        'email' => 'admin-offices2@example.com',
        'password' => bcrypt('password'),
    ]);
    $admin->givePermissionTo(Permission::create(['name' => 'users.manage', 'module' => 'users']));

    $this->actingAs($admin);
    $responseDuplicate = $this->post(route('inventory.offices.store'), [
        'name' => 'Office Duplicate',
        'code' => 'OFF-1', // duplicate
    ]);
    $responseDuplicate->assertSessionHasErrors('code');
});

test('users with inventory.create permission can create units of measurement inline', function () {
    $user = User::factory()->supplyOfficer()->create([
        'name' => 'Supply Officer',
        'email' => 'supply-units@example.com',
        'password' => bcrypt('password'),
    ]);
    $user->givePermissionTo(Permission::create(['name' => 'inventory.create', 'module' => 'inventory']));

    $this->actingAs($user);

    $response = $this->post(route('inventory.units.store'), [
        'name' => 'Metric Ton',
        'abbreviation' => 'mt',
    ]);

    $response->assertOk();
    $this->assertDatabaseHas('units', [
        'name' => 'Metric Ton',
        'abbreviation' => 'mt',
    ]);

    // Validation duplicate checks
    $responseDup = $this->post(route('inventory.units.store'), [
        'name' => 'Metric Ton',
        'abbreviation' => 'mt',
    ]);
    $responseDup->assertSessionHasErrors(['name', 'abbreviation']);
});

test('requisition approved quantity cannot exceed requested quantity', function () {
    $office = Office::create(['code' => 'O-TEST-REQ', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-REQ', 'name' => 'Test Dept']);
    $unit = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
    $category = Category::create(['name' => 'Office Supplies', 'code' => 'SUPP', 'is_ppe' => false]);
    $item = Item::create([
        'item_code' => 'ITEM-BOND-99',
        'name' => 'Bond Paper',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'unit_cost' => 100.00,
        'reorder_level' => 10,
        'maximum_stock' => 100,
    ]);

    $employeeUser = User::factory()->employee()->create(['name' => 'Staff', 'email' => 'staff99@example.com']);
    $employee = Employee::create(['user_id' => $employeeUser->id, 'employee_id' => 'E99', 'name' => 'Staff', 'position' => 'Staff', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $headUser = User::factory()->deptHead()->create(['name' => 'Head', 'email' => 'head99@example.com']);
    $head = Employee::create(['user_id' => $headUser->id, 'employee_id' => 'E98', 'name' => 'Head', 'position' => 'Head', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $permCreate = Permission::create(['name' => 'request.create', 'module' => 'requisition']);
    $permApprove = Permission::create(['name' => 'request.approve', 'module' => 'requisition']);
    $headUser->givePermissionTo($permApprove);

    // Create requisition requesting 5 items
    $requisition = Requisition::create([
        'ris_number' => 'RIS-TEST-OVERAPP',
        'requesting_employee_id' => $employee->id,
        'department_id' => $dept->id,
        'status' => RequisitionStatus::PendingDeptHead,
        'department_head_id' => $head->id,
    ]);
    $requisitionItem = RequisitionItem::create([
        'requisition_id' => $requisition->id,
        'item_id' => $item->id,
        'quantity_requested' => 5,
        'quantity_approved' => 0,
        'quantity_issued' => 0,
    ]);

    $this->actingAs($headUser);

    // Try approving 10 (exceeds 5 requested)
    $response = $this->post(route('inventory.requisitions.approve', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_approved' => 10],
        ],
    ]);

    $response->assertSessionHasErrors(['items.0.quantity_approved']);

    // Approve 5 (valid)
    $responseOk = $this->post(route('inventory.requisitions.approve', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_approved' => 5],
        ],
    ]);
    $responseOk->assertRedirect();
    expect($requisitionItem->fresh()->quantity_approved)->toBe(5);
});

test('requisition issued quantity cannot exceed approved quantity', function () {
    $office = Office::create(['code' => 'O-TEST-ISS', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-ISS', 'name' => 'Test Dept']);
    $unit = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
    $category = Category::create(['name' => 'Office Supplies', 'code' => 'SUPP', 'is_ppe' => false]);
    $item = Item::create([
        'item_code' => 'ITEM-BOND-88',
        'name' => 'Bond Paper',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'unit_cost' => 100.00,
        'reorder_level' => 10,
        'maximum_stock' => 100,
    ]);
    $item->current_stock = 50;
    $item->save();

    $employeeUser = User::factory()->employee()->create(['name' => 'Staff', 'email' => 'staff88@example.com']);
    $employee = Employee::create(['user_id' => $employeeUser->id, 'employee_id' => 'E88', 'name' => 'Staff', 'position' => 'Staff', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $supplyUser = User::factory()->supplyOfficer()->create(['name' => 'Supply', 'email' => 'supply88@example.com']);
    $supply = Employee::create(['user_id' => $supplyUser->id, 'employee_id' => 'E87', 'name' => 'Supply', 'position' => 'Supply', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $permIssue = Permission::create(['name' => 'warehouse.issue', 'module' => 'requisition']);
    $supplyUser->givePermissionTo($permIssue);

    $requisition = Requisition::create([
        'ris_number' => 'RIS-TEST-OVERISS',
        'requesting_employee_id' => $employee->id,
        'department_id' => $dept->id,
        'status' => RequisitionStatus::PendingSupply,
    ]);
    $requisitionItem = RequisitionItem::create([
        'requisition_id' => $requisition->id,
        'item_id' => $item->id,
        'quantity_requested' => 5,
        'quantity_approved' => 3,
        'quantity_issued' => 0,
    ]);

    $this->actingAs($supplyUser);

    // Try issuing 4 (exceeds 3 approved)
    $response = $this->post(route('inventory.requisitions.issue', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_issued' => 4],
        ],
    ]);

    $response->assertSessionHasErrors(['items.0.quantity_issued']);

    // Issue 2 (valid)
    $responseOk = $this->post(route('inventory.requisitions.issue', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_issued' => 2],
        ],
    ]);
    $responseOk->assertRedirect();
    expect($requisitionItem->fresh()->quantity_issued)->toBe(2);
});

test('requisition can be rejected by department head', function () {
    $office = Office::create(['code' => 'O-TEST-REJ', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-REJ', 'name' => 'Test Dept']);

    $employeeUser = User::factory()->employee()->create(['name' => 'Staff', 'email' => 'staff77@example.com']);
    $employee = Employee::create(['user_id' => $employeeUser->id, 'employee_id' => 'E77', 'name' => 'Staff', 'position' => 'Staff', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $headUser = User::factory()->deptHead()->create(['name' => 'Head', 'email' => 'head77@example.com']);
    $head = Employee::create(['user_id' => $headUser->id, 'employee_id' => 'E76', 'name' => 'Head', 'position' => 'Head', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $permApprove = Permission::create(['name' => 'request.approve', 'module' => 'requisition']);
    $headUser->givePermissionTo($permApprove);

    $requisition = Requisition::create([
        'ris_number' => 'RIS-TEST-REJ',
        'requesting_employee_id' => $employee->id,
        'department_id' => $dept->id,
        'status' => RequisitionStatus::PendingDeptHead,
        'department_head_id' => $head->id,
    ]);

    $this->actingAs($headUser);

    $response = $this->post(route('inventory.requisitions.reject', $requisition->id), [
        'remarks' => 'Not enough budget for this request.',
    ]);

    $response->assertRedirect();
    $requisition->refresh();
    expect($requisition->status)->toBe(RequisitionStatus::RejectedDeptHead);
    expect($requisition->remarks)->toBe('Not enough budget for this request.');
});
