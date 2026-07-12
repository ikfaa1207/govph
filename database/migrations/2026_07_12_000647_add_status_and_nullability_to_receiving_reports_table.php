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
        Schema::table('receiving_reports', function (Blueprint $table) {
            $table->string('iar_number')->nullable()->change();
            $table->string('delivery_receipt_number')->nullable()->change();
            $table->foreignId('received_by')->nullable()->change();
            $table->foreignId('inspected_by')->nullable()->change();
            $table->enum('status', ['draft', 'finalized'])->default('finalized')->after('remarks');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receiving_reports', function (Blueprint $table) {
            $table->string('iar_number')->nullable(false)->change();
            $table->string('delivery_receipt_number')->nullable(false)->change();
            $table->foreignId('received_by')->nullable(false)->change();
            $table->foreignId('inspected_by')->nullable(false)->change();
            $table->dropColumn('status');
        });
    }
};
