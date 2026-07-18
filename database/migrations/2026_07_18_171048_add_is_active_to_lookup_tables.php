<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = ['units', 'categories', 'locations', 'warehouses', 'suppliers'];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->boolean('is_active')->default(true)->after('id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['units', 'categories', 'locations', 'warehouses', 'suppliers'];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('is_active');
            });
        }
    }
};
