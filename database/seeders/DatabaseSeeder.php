<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Location;
use App\Models\Office;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Offices
        $office = Office::create([
            'code' => 'O-CO-01',
            'name' => 'Central Office',
        ]);

        // 2. Create Departments
        $deptHr = Department::create([
            'office_id' => $office->id,
            'code' => 'D-HR-01',
            'name' => 'Human Resource Management Department',
        ]);

        $deptIt = Department::create([
            'office_id' => $office->id,
            'code' => 'D-IT-02',
            'name' => 'Information Technology Division',
        ]);

        $deptFinance = Department::create([
            'office_id' => $office->id,
            'code' => 'D-FIN-03',
            'name' => 'Finance & Accounting Division',
        ]);

        // 3. Create Suppliers
        Supplier::create([
            'name' => 'GovSupply Co. Ltd.',
            'address' => '123 Quezon Ave, Quezon City',
            'contact_person' => 'Juan Dela Cruz',
            'contact_number' => '+63 912 345 6789',
            'tin' => '123-456-789-000',
        ]);

        Supplier::create([
            'name' => 'IT Solution Experts Corp.',
            'address' => '456 Ayala Ave, Makati City',
            'contact_person' => 'Maria Santos',
            'contact_number' => '+63 998 765 4321',
            'tin' => '987-654-321-000',
        ]);

        // 4. Create Categories
        $catSupplies = Category::create([
            'name' => 'Office Supplies',
            'code' => 'OFF-SUPP',
            'is_ppe' => false,
        ]);

        $catItEqp = Category::create([
            'name' => 'IT Equipment',
            'code' => 'IT-EQP',
            'is_ppe' => true,
        ]);

        // 5. Create Units
        $unitPc = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
        $unitBox = Unit::create(['name' => 'Box', 'abbreviation' => 'box']);
        $unitReam = Unit::create(['name' => 'Ream', 'abbreviation' => 'ream']);

        // 6. Create Warehouses & Locations
        $wh = Warehouse::create([
            'name' => 'Warehouse A',
            'address' => 'Central Office Ground Floor',
        ]);

        Location::create([
            'warehouse_id' => $wh->id,
            'code' => 'SHELF-A-01',
            'description' => 'Top Shelf, Row A',
        ]);

        Location::create([
            'warehouse_id' => $wh->id,
            'code' => 'SHELF-B-02',
            'description' => 'Middle Shelf, Row B',
        ]);

        // 7. Seed Permissions
        $permissions = [
            // Dashboard
            ['name' => 'dashboard.view', 'module' => 'dashboard', 'description' => 'View main dashboard metrics'],

            // Inventory Module
            ['name' => 'inventory.view', 'module' => 'inventory', 'description' => 'View supplies and items list'],
            ['name' => 'inventory.create', 'module' => 'inventory', 'description' => 'Add new items to catalog'],
            ['name' => 'inventory.update', 'module' => 'inventory', 'description' => 'Update item specifications'],
            ['name' => 'inventory.delete', 'module' => 'inventory', 'description' => 'Archive or delete catalog items'],

            // Warehouse Module
            ['name' => 'warehouse.view', 'module' => 'warehouse', 'description' => 'View stock balances and locations'],
            ['name' => 'warehouse.issue', 'module' => 'warehouse', 'description' => 'Authorize and issue items to employees'],
            ['name' => 'warehouse.receive', 'module' => 'warehouse', 'description' => 'Inspect and accept deliveries'],
            ['name' => 'warehouse.transfer', 'module' => 'warehouse', 'description' => 'Move items between storage sections'],
            ['name' => 'warehouse.adjust', 'module' => 'warehouse', 'description' => 'Perform stock count corrections'],

            // Procurement Module
            ['name' => 'procurement.view', 'module' => 'procurement', 'description' => 'View purchase requests/orders'],
            ['name' => 'procurement.create', 'module' => 'procurement', 'description' => 'Request purchases or draft orders'],
            ['name' => 'procurement.receive', 'module' => 'procurement', 'description' => 'Mark delivery logs as received'],
            ['name' => 'procurement.approve', 'module' => 'procurement', 'description' => 'Approve/Sign purchasing documents'],

            // Requisitions Module
            ['name' => 'request.create', 'module' => 'requisition', 'description' => 'Submit a new requisition request (RIS)'],
            ['name' => 'request.approve', 'module' => 'requisition', 'description' => 'Approve department requisitions'],
            ['name' => 'request.reject', 'module' => 'requisition', 'description' => 'Reject department requisitions'],

            // Property Module
            ['name' => 'property.view', 'module' => 'property', 'description' => 'View asset registry (PPE)'],
            ['name' => 'property.assign', 'module' => 'property', 'description' => 'Handover equipment (generate PAR/ICS)'],
            ['name' => 'property.transfer', 'module' => 'property', 'description' => 'Approve equipment re-assignment (PTR)'],
            ['name' => 'property.dispose', 'module' => 'property', 'description' => 'Dispose of unserviceable property (IIRUP)'],

            // Reports Module
            ['name' => 'reports.view', 'module' => 'reports', 'description' => 'View physical count and ledger reports'],
            ['name' => 'reports.export', 'module' => 'reports', 'description' => 'Export compilations to spreadsheet format'],
            ['name' => 'reports.print', 'module' => 'reports', 'description' => 'Print formal government formats'],

            // Administration Module
            ['name' => 'users.manage', 'module' => 'administration', 'description' => 'Manage user accounts and details'],
            ['name' => 'roles.manage', 'module' => 'administration', 'description' => 'Manage custom roles and access levels'],
            ['name' => 'permissions.manage', 'module' => 'administration', 'description' => 'Manage direct permission lists'],
            ['name' => 'settings.manage', 'module' => 'administration', 'description' => 'Manage system-wide parameters'],
            ['name' => 'admin.super', 'module' => 'administration', 'description' => 'Super Administrator Bypass'],

            // Audit Module
            ['name' => 'audit.view', 'module' => 'audit', 'description' => 'View audit trails for inspection'],
        ];

        $permissionModels = [];
        foreach ($permissions as $p) {
            $permissionModels[$p['name']] = Permission::create($p);
        }

        // 8. Seed Roles & Assign Permissions
        $roleAdmin = Role::create(['name' => 'System Administrator', 'description' => 'Manages system structure and user rights.']);
        $roleSupply = Role::create(['name' => 'Supply Officer', 'description' => 'Controls catalog, warehouse items, and stock movement.']);
        $roleCustodian = Role::create(['name' => 'Property Custodian', 'description' => 'Monitors capitalized assets and physical assignments.']);
        $roleHead = Role::create(['name' => 'Department Head', 'description' => 'Authorizes departmental requisitions and requests.']);
        $roleEmployee = Role::create(['name' => 'Requesting Employee', 'description' => 'Submits personal requisitions and tracks accountability.']);
        $roleAuditor = Role::create(['name' => 'Auditor', 'description' => 'Inspects ledgers, transaction cards, and audit logs.']);

        // Admin gets all permissions
        $roleAdmin->permissions()->sync(array_values(array_map(fn ($m) => $m->id, $permissionModels)));

        // Supply Officer permissions
        $roleSupply->permissions()->sync(array_map(fn ($name) => $permissionModels[$name]->id, [
            'dashboard.view',
            'inventory.view', 'inventory.create', 'inventory.update', 'inventory.delete',
            'warehouse.view', 'warehouse.issue', 'warehouse.receive', 'warehouse.transfer', 'warehouse.adjust',
            'procurement.view', 'procurement.create', 'procurement.receive',
            'property.view', 'property.assign', 'property.transfer', 'property.dispose',
            'reports.view', 'reports.export', 'reports.print',
            'request.create',
        ]));

        // Property Custodian permissions
        $roleCustodian->permissions()->sync(array_map(fn ($name) => $permissionModels[$name]->id, [
            'dashboard.view',
            'inventory.view',
            'warehouse.view',
            'procurement.view',
            'property.view', 'property.assign', 'property.transfer', 'property.dispose',
            'reports.view', 'reports.export', 'reports.print',
        ]));

        // Department Head permissions
        $roleHead->permissions()->sync(array_map(fn ($name) => $permissionModels[$name]->id, [
            'dashboard.view',
            'inventory.view',
            'warehouse.view',
            'procurement.view',
            'property.view',
            'reports.view', 'reports.print',
            'request.create', 'request.approve', 'request.reject',
        ]));

        // Requesting Employee permissions
        $roleEmployee->permissions()->sync(array_map(fn ($name) => $permissionModels[$name]->id, [
            'dashboard.view',
            'inventory.view',
            'property.view',
            'request.create',
        ]));

        // Auditor permissions
        $roleAuditor->permissions()->sync(array_map(fn ($name) => $permissionModels[$name]->id, [
            'dashboard.view',
            'inventory.view',
            'warehouse.view',
            'procurement.view',
            'property.view',
            'reports.view', 'reports.print',
            'audit.view',
        ]));

        // 9. Create Users and Assign Roles
        $usersData = [
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'role_to_assign' => $roleAdmin,
                'employee_id' => 'EMP-ADMIN-01',
                'position' => 'Super Administrator',
                'dept' => $deptIt,
            ],
            [
                'name' => 'Supply Officer',
                'email' => 'supply@example.com',
                'role_to_assign' => $roleSupply,
                'employee_id' => 'EMP-SUPPLY-02',
                'position' => 'Chief Supply Officer',
                'dept' => $deptFinance,
            ],
            [
                'name' => 'Property Custodian',
                'email' => 'custodian@example.com',
                'role_to_assign' => $roleCustodian,
                'employee_id' => 'EMP-CUST-03',
                'position' => 'Property Custodian II',
                'dept' => $deptFinance,
            ],
            [
                'name' => 'Department Head',
                'email' => 'head@example.com',
                'role_to_assign' => $roleHead,
                'employee_id' => 'EMP-HEAD-04',
                'position' => 'HR Director',
                'dept' => $deptHr,
            ],
            [
                'name' => 'Requesting Employee',
                'email' => 'employee@example.com',
                'role_to_assign' => $roleEmployee,
                'employee_id' => 'EMP-STAFF-05',
                'position' => 'HR Specialist',
                'dept' => $deptHr,
            ],
            [
                'name' => 'COA Auditor',
                'email' => 'auditor@example.com',
                'role_to_assign' => $roleAuditor,
                'employee_id' => 'EMP-AUDIT-06',
                'position' => 'State Auditor III',
                'dept' => $deptFinance,
            ],
        ];

        foreach ($usersData as $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password'),
            ]);

            // Assign role using our new HasPermissions trait helper
            $user->assignRole($data['role_to_assign']);

            Employee::create([
                'user_id' => $user->id,
                'employee_id' => $data['employee_id'],
                'name' => $data['name'],
                'position' => $data['position'],
                'office_id' => $office->id,
                'department_id' => $data['dept']->id,
            ]);
        }
    }
}
