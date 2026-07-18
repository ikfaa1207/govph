<?php

namespace App\Console\Commands;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Office;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class MakeAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:admin';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a super administrator user and associated employee profile';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Creating a new Super Administrator user...');

        $name = $this->ask('Enter admin name', 'Admin User');

        // Email prompt with loop for validation
        do {
            $email = $this->ask('Enter admin email');
            $validator = Validator::make(['email' => $email], [
                'email' => ['required', 'email', 'unique:users,email'],
            ]);

            if ($validator->fails()) {
                $this->error($validator->errors()->first('email'));
                $email = null;
            }
        } while (! $email);

        // Password prompt with loop for validation
        do {
            $password = $this->secret('Enter admin password');
            $validator = Validator::make(['password' => $password], [
                'password' => ['required', 'string', 'min:8'],
            ]);

            if ($validator->fails()) {
                $this->error($validator->errors()->first('password'));
                $password = null;
            }
        } while (! $password);

        // Retrieve or create standard role
        $role = Role::where('name', 'System Administrator')->first();
        if (! $role) {
            $role = Role::create([
                'name' => 'System Administrator',
                'description' => 'Manages system structure and user rights.',
            ]);
            $this->warn('System Administrator role was not found, created it.');
        }

        // Seed all baseline permissions
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

        $permissionIds = [];
        foreach ($permissions as $p) {
            $perm = Permission::firstOrCreate(['name' => $p['name']], $p);
            $permissionIds[] = $perm->id;
        }

        // Sync all permissions to System Administrator role
        $role->permissions()->sync($permissionIds);

        // Retrieve or create dependencies for Employee profile
        $office = Office::where('code', 'CO')->first()
            ?? Office::first()
            ?? Office::create(['code' => 'CO', 'name' => 'Central Office']);

        $department = Department::where('code', 'ITD')->first()
            ?? Department::first()
            ?? Department::create([
                'office_id' => $office->id,
                'code' => 'ITD',
                'name' => 'Information Technology Division',
            ]);

        // Create User
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        $user->assignRole($role);

        // Create associated Employee profile
        $employeeId = 'EMP-ADMIN-'.str_pad(strval(User::count()), 2, '0', STR_PAD_LEFT);
        Employee::create([
            'user_id' => $user->id,
            'employee_id' => $employeeId,
            'name' => $name,
            'position' => 'Super Administrator',
            'office_id' => $office->id,
            'department_id' => $department->id,
        ]);

        $this->info("Super Administrator '{$email}' created successfully!");

        return self::SUCCESS;
    }
}
