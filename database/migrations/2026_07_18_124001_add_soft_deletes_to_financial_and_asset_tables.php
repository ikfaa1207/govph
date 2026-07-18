<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'properties',
            'items',
            'property_assignments',
            'property_transfers',
            'physical_counts',
            'physical_count_items',
            'purchase_orders',
            'purchase_requests',
            'receiving_reports',
            'requisitions',
            'stock_transactions',
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->softDeletes();
                });
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'properties',
            'items',
            'property_assignments',
            'property_transfers',
            'physical_counts',
            'physical_count_items',
            'purchase_orders',
            'purchase_requests',
            'receiving_reports',
            'requisitions',
            'stock_transactions',
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropSoftDeletes();
                });
            }
        }
    }
};
