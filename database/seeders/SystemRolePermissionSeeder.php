<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class SystemRolePermissionSeeder extends Seeder
{
    public function run(): void
    {
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
            $permissionModels[$p['name']] = Permission::firstOrCreate(['name' => $p['name']], $p);
        }

        // 2. Seed Roles & Assign Permissions
        $roleAdmin = Role::firstOrCreate(['name' => 'System Administrator'], ['description' => 'Manages system structure and user rights.']);
        $roleSupply = Role::firstOrCreate(['name' => 'Supply Officer'], ['description' => 'Controls catalog, warehouse items, and stock movement.']);
        $roleCustodian = Role::firstOrCreate(['name' => 'Property Custodian'], ['description' => 'Monitors capitalized assets and physical assignments.']);
        $roleHead = Role::firstOrCreate(['name' => 'Department Head'], ['description' => 'Authorizes departmental requisitions and requests.']);
        $roleEmployee = Role::firstOrCreate(['name' => 'Requesting Employee'], ['description' => 'Submits personal requisitions and tracks accountability.']);
        $roleAuditor = Role::firstOrCreate(['name' => 'Auditor'], ['description' => 'Inspects ledgers, transaction cards, and audit logs.']);
        $roleInspector = Role::firstOrCreate(['name' => 'Inspection Officer'], ['description' => 'Inspects and verifies incoming deliveries and items.']);

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
        $roleInspector->permissions()->sync(array_map(fn ($name) => $permissionModels[$name]->id, [
            'dashboard.view', 'inventory.view', 'warehouse.view', 'warehouse.receive',
        ]));
    }
}
