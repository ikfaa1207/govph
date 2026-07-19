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
        // Main Campus
        $co = Office::create([
            'code' => 'MC',
            'name' => 'Main Campus',
        ]);

        $coDepartments = [
            ['code' => 'HRMD', 'name' => 'Human Resource Management Office'],
            ['code' => 'ITD', 'name' => 'College of Computer Studies'],
            ['code' => 'FAD', 'name' => 'Finance & Accounting Office'],
            ['code' => 'GSD', 'name' => 'General Services Office'],
            ['code' => 'PMD', 'name' => 'Procurement & Supply Office'],
            ['code' => 'PRD', 'name' => 'Planning & Development Office'],
            ['code' => 'COE', 'name' => 'College of Engineering'],
            ['code' => 'COED', 'name' => 'College of Education'],
        ];

        foreach ($coDepartments as $dept) {
            Department::create(array_merge($dept, ['office_id' => $co->id]));
        }

        // North Campus
        $ncr = Office::create([
            'code' => 'NC',
            'name' => 'North Campus',
        ]);

        $ncrDepartments = [
            ['code' => 'NC-ADMIN', 'name' => 'North Campus Administrative Division'],
            ['code' => 'NC-COA', 'name' => 'College of Agriculture'],
        ];

        foreach ($ncrDepartments as $dept) {
            Department::create(array_merge($dept, ['office_id' => $ncr->id]));
        }

        // South Campus
        $ro1 = Office::create([
            'code' => 'SC',
            'name' => 'South Campus',
        ]);

        $ro1Departments = [
            ['code' => 'SC-ADMIN', 'name' => 'South Campus Administrative Division'],
            ['code' => 'SC-COFI', 'name' => 'College of Fisheries'],
        ];

        foreach ($ro1Departments as $dept) {
            Department::create(array_merge($dept, ['office_id' => $ro1->id]));
        }
    }
}
