<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Office;
use Illuminate\Database\Seeder;

class AgencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Central Office
        $co = Office::create([
            'code' => 'CO',
            'name' => 'Central Office',
        ]);

        $coDepartments = [
            ['code' => 'HRMD', 'name' => 'Human Resource Management Department'],
            ['code' => 'ITD', 'name' => 'Information Technology Division'],
            ['code' => 'FAD', 'name' => 'Finance & Accounting Division'],
            ['code' => 'GSD', 'name' => 'General Services Division'],
            ['code' => 'PMD', 'name' => 'Procurement Management Division'],
            ['code' => 'PRD', 'name' => 'Planning & Research Division'],
        ];

        foreach ($coDepartments as $dept) {
            Department::create(array_merge($dept, ['office_id' => $co->id]));
        }

        // NCR Regional Office
        $ncr = Office::create([
            'code' => 'NCR',
            'name' => 'National Capital Region Office',
        ]);

        $ncrDepartments = [
            ['code' => 'NCR-ADMIN', 'name' => 'NCR Administrative Division'],
            ['code' => 'NCR-OPS', 'name' => 'NCR Operations Division'],
        ];

        foreach ($ncrDepartments as $dept) {
            Department::create(array_merge($dept, ['office_id' => $ncr->id]));
        }

        // Region 1 Office
        $ro1 = Office::create([
            'code' => 'RO-I',
            'name' => 'Regional Office I - Ilocos Region',
        ]);

        $ro1Departments = [
            ['code' => 'RO1-ADMIN', 'name' => 'RO-I Administrative Division'],
            ['code' => 'RO1-OPS', 'name' => 'RO-I Operations Division'],
        ];

        foreach ($ro1Departments as $dept) {
            Department::create(array_merge($dept, ['office_id' => $ro1->id]));
        }
    }
}
