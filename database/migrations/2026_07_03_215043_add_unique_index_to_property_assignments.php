<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite' || DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('CREATE UNIQUE INDEX active_assignment_unique ON property_assignments(property_id) WHERE returned_date IS NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS active_assignment_unique');
    }
};
