<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Office;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserEmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('en_PH');

        // 1. Seed Permissions
        $permissions = [
            ['name' => 'dashboard.view', 'module' => 'dashboard', 'description' => 'View main dashboard metrics'],
            ['name' => 'inventory.view', 'module' => 'inventory', 'description' => 'View supplies and items list'],
            ['name' => 'inventory.create', 'module' => 'inventory', 'description' => 'Add new items to catalog'],
            ['name' => 'inventory.update', 'module' => 'inventory', 'description' => 'Update item specifications'],
            ['name' => 'inventory.delete', 'module' => 'inventory', 'description' => 'Archive or delete catalog items'],
            ['name' => 'warehouse.view', 'module' => 'warehouse', 'description' => 'View stock balances and locations'],
            ['name' => 'warehouse.issue', 'module' => 'warehouse', 'description' => 'Authorize and issue items to employees'],
            ['name' => 'warehouse.receive', 'module' => 'warehouse', 'description' => 'Inspect and accept deliveries'],
            ['name' => 'warehouse.transfer', 'module' => 'warehouse', 'description' => 'Move items between storage sections'],
            ['name' => 'warehouse.adjust', 'module' => 'warehouse', 'description' => 'Perform stock count corrections'],
            ['name' => 'procurement.view', 'module' => 'procurement', 'description' => 'View purchase requests/orders'],
            ['name' => 'procurement.create', 'module' => 'procurement', 'description' => 'Request purchases or draft orders'],
            ['name' => 'procurement.receive', 'module' => 'procurement', 'description' => 'Mark delivery logs as received'],
            ['name' => 'procurement.approve', 'module' => 'procurement', 'description' => 'Approve/Sign purchasing documents'],
            ['name' => 'request.create', 'module' => 'requisition', 'description' => 'Submit a new requisition request (RIS)'],
            ['name' => 'request.approve', 'module' => 'requisition', 'description' => 'Approve department requisitions'],
            ['name' => 'request.reject', 'module' => 'requisition', 'description' => 'Reject department requisitions'],
            ['name' => 'property.view', 'module' => 'property', 'description' => 'View asset registry (PPE)'],
            ['name' => 'property.assign', 'module' => 'property', 'description' => 'Handover equipment (generate PAR/ICS)'],
            ['name' => 'property.transfer', 'module' => 'property', 'description' => 'Approve equipment re-assignment (PTR)'],
            ['name' => 'property.dispose', 'module' => 'property', 'description' => 'Dispose of unserviceable property (IIRUP)'],
            ['name' => 'reports.view', 'module' => 'reports', 'description' => 'View physical count and ledger reports'],
            ['name' => 'reports.export', 'module' => 'reports', 'description' => 'Export compilations to spreadsheet format'],
            ['name' => 'reports.print', 'module' => 'reports', 'description' => 'Print formal government formats'],
            ['name' => 'users.manage', 'module' => 'administration', 'description' => 'Manage user accounts and details'],
            ['name' => 'roles.manage', 'module' => 'administration', 'description' => 'Manage custom roles and access levels'],
            ['name' => 'permissions.manage', 'module' => 'administration', 'description' => 'Manage direct permission lists'],
            ['name' => 'settings.manage', 'module' => 'administration', 'description' => 'Manage system-wide parameters'],
            ['name' => 'admin.super', 'module' => 'administration', 'description' => 'Super Administrator Bypass'],
            ['name' => 'audit.view', 'module' => 'audit', 'description' => 'View audit trails for inspection'],
        ];

        $permissionModels = [];
        foreach ($permissions as $p) {
            $permissionModels[$p['name']] = Permission::create($p);
        }

        // 2. Seed Roles & Assign Permissions
        $roleAdmin = Role::create(['name' => 'System Administrator', 'description' => 'Manages system structure and user rights.']);
        $roleSupply = Role::create(['name' => 'Supply Officer', 'description' => 'Controls catalog, warehouse items, and stock movement.']);
        $roleCustodian = Role::create(['name' => 'Property Custodian', 'description' => 'Monitors capitalized assets and physical assignments.']);
        $roleHead = Role::create(['name' => 'Department Head', 'description' => 'Authorizes departmental requisitions and requests.']);
        $roleEmployee = Role::create(['name' => 'Requesting Employee', 'description' => 'Submits personal requisitions and tracks accountability.']);
        $roleAuditor = Role::create(['name' => 'Auditor', 'description' => 'Inspects ledgers, transaction cards, and audit logs.']);

        $roleAdmin->permissions()->sync(array_values(array_map(fn ($m) => $m->id, $permissionModels)));
        $roleSupply->permissions()->sync(array_map(fn ($name) => $permissionModels[$name]->id, [
            'dashboard.view', 'inventory.view', 'inventory.create', 'inventory.update', 'inventory.delete', 'warehouse.view', 'warehouse.issue', 'warehouse.receive', 'warehouse.transfer', 'warehouse.adjust', 'procurement.view', 'procurement.create', 'procurement.receive', 'property.view', 'property.assign', 'property.transfer', 'property.dispose', 'reports.view', 'reports.export', 'reports.print', 'request.create',
        ]));
        $roleCustodian->permissions()->sync(array_map(fn ($name) => $permissionModels[$name]->id, [
            'dashboard.view', 'inventory.view', 'warehouse.view', 'procurement.view', 'property.view', 'property.assign', 'property.transfer', 'property.dispose', 'reports.view', 'reports.export', 'reports.print',
        ]));
        $roleHead->permissions()->sync(array_map(fn ($name) => $permissionModels[$name]->id, [
            'dashboard.view', 'inventory.view', 'warehouse.view', 'procurement.view', 'property.view', 'reports.view', 'reports.print', 'request.create', 'request.approve', 'request.reject',
        ]));
        $roleEmployee->permissions()->sync(array_map(fn ($name) => $permissionModels[$name]->id, [
            'dashboard.view', 'inventory.view', 'property.view', 'request.create',
        ]));
        $roleAuditor->permissions()->sync(array_map(fn ($name) => $permissionModels[$name]->id, [
            'dashboard.view', 'inventory.view', 'warehouse.view', 'procurement.view', 'property.view', 'reports.view', 'reports.print', 'audit.view',
        ]));

        $co = Office::where('code', 'MC')->first() ?? Office::where('code', 'CO')->first() ?? Office::first();
        $deptIt = Department::where('code', 'ITD')->first() ?? Department::first();
        $deptHr = Department::where('code', 'HRMD')->first() ?? Department::first();
        $deptFinance = Department::where('code', 'FAD')->first() ?? Department::first();

        // 3. Create Fixed Core Users
        $usersData = [
            ['name' => 'Admin User', 'email' => 'admin@example.com', 'role' => $roleAdmin, 'employee_id' => 'EMP-ADMIN-01', 'position' => 'Super Administrator', 'dept' => $deptIt, 'office' => $co],
            ['name' => 'Supply Officer', 'email' => 'supply@example.com', 'role' => $roleSupply, 'employee_id' => 'EMP-SUPPLY-02', 'position' => 'Chief Supply Officer', 'dept' => $deptFinance, 'office' => $co],
            ['name' => 'Property Custodian', 'email' => 'custodian@example.com', 'role' => $roleCustodian, 'employee_id' => 'EMP-CUST-03', 'position' => 'Property Custodian II', 'dept' => $deptFinance, 'office' => $co],
            ['name' => 'Department Head', 'email' => 'head@example.com', 'role' => $roleHead, 'employee_id' => 'EMP-HEAD-04', 'position' => 'HR Director', 'dept' => $deptHr, 'office' => $co],
            ['name' => 'Requesting Employee', 'email' => 'employee@example.com', 'role' => $roleEmployee, 'employee_id' => 'EMP-STAFF-05', 'position' => 'HR Specialist', 'dept' => $deptHr, 'office' => $co],
            ['name' => 'COA Auditor', 'email' => 'auditor@example.com', 'role' => $roleAuditor, 'employee_id' => 'EMP-AUDIT-06', 'position' => 'State Auditor III', 'dept' => $deptFinance, 'office' => $co],
        ];

        foreach ($usersData as $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password'),
            ]);
            $user->assignRole($data['role']);

            Employee::create([
                'user_id' => $user->id,
                'employee_id' => $data['employee_id'],
                'name' => $data['name'],
                'position' => $data['position'],
                'office_id' => $data['office']->id,
                'department_id' => $data['dept']->id,
            ]);
        }

        // 4. Generate 44 Realistic Employees
        $departments = Department::all();
        $positions = ['Administrative Assistant I', 'Administrative Officer II', 'Project Development Officer', 'Information Systems Analyst', 'Accountant I', 'Records Officer'];

        for ($i = 1; $i <= 44; $i++) {
            $firstName = $faker->firstName();
            $lastName = $faker->lastName();
            $fullName = $firstName.' '.$lastName;
            $email = strtolower(substr($firstName, 0, 1).$lastName).$i.'@example.com';

            $user = User::create([
                'name' => $fullName,
                'email' => $email,
                'password' => Hash::make('password'),
            ]);

            // Assign 90% as Requesting Employee, 10% as Department Head
            $role = ($i % 10 === 0) ? $roleHead : $roleEmployee;
            $user->assignRole($role);

            $randomDept = $departments->random();
            $position = ($role->id === $roleHead->id) ? 'Division Chief' : $faker->randomElement($positions);

            Employee::create([
                'user_id' => $user->id,
                'employee_id' => 'EMP-GEN-'.str_pad((string) ($i + 6), 3, '0', STR_PAD_LEFT),
                'name' => $fullName,
                'position' => $position,
                'office_id' => $randomDept->office_id,
                'department_id' => $randomDept->id,
            ]);
        }
    }
}
