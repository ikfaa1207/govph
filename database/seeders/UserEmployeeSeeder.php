<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Office;
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

        // 1. Seed Roles & Permissions via baseline seeder
        $this->call(SystemRolePermissionSeeder::class);

        $roleAdmin = Role::where('name', 'System Administrator')->first();
        $roleSupply = Role::where('name', 'Supply Officer')->first();
        $roleCustodian = Role::where('name', 'Property Custodian')->first();
        $roleHead = Role::where('name', 'Department Head')->first();
        $roleEmployee = Role::where('name', 'Requesting Employee')->first();
        $roleAuditor = Role::where('name', 'Auditor')->first();

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
