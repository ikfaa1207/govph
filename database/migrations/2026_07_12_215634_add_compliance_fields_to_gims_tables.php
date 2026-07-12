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
        Schema::table('disposals', function (Blueprint $table) {
            $table->foreignId('inspected_by')->nullable()->constrained('employees')->nullOnDelete();
            $table->string('jev_reference')->nullable();
        });

        Schema::table('physical_counts', function (Blueprint $table) {
            $table->foreignId('coa_representative_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->string('coa_representative_absent_reason')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('physical_counts', function (Blueprint $table) {
            $table->dropForeign(['coa_representative_id']);
            $table->dropColumn(['coa_representative_id', 'coa_representative_absent_reason']);
        });

        Schema::table('disposals', function (Blueprint $table) {
            $table->dropForeign(['inspected_by']);
            $table->dropColumn(['inspected_by', 'jev_reference']);
        });
    }
};
