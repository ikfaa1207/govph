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
        $this->call([
            AgencySeeder::class,
            InventorySeeder::class,
            UserEmployeeSeeder::class,
            TransactionSeeder::class,
        ]);
    }
}
