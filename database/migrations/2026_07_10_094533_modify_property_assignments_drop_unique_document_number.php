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
        // Dropped unique constraint to support batch assignments where multiple properties share a single PAR/ICS document number
        Schema::table('property_assignments', function (Blueprint $table) {
            $table->dropUnique(['document_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('property_assignments', function (Blueprint $table) {
            $table->unique('document_number');
        });
    }
};
