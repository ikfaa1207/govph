<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Baseline roles & permissions are always seeded
        $this->call([
            SystemRolePermissionSeeder::class,
        ]);

        // Demo data is only seeded in local or testing environments
        if (app()->environment('local', 'testing')) {
            $this->call([
                AgencySeeder::class,
                UserEmployeeSeeder::class,
            ]);
        }
    }
}
