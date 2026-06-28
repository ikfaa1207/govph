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
        Schema::table('property_assignments', function (Blueprint $table) {
            $table->unsignedBigInteger('assigned_to')->nullable()->change();
            $table->string('non_system_name')->nullable();
            $table->string('non_system_department')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('property_assignments', function (Blueprint $table) {
            $table->unsignedBigInteger('assigned_to')->nullable(false)->change();
            $table->dropColumn(['non_system_name', 'non_system_department']);
        });
    }
};
