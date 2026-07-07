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
        Schema::create('property_sub_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('issued_to')->nullable()->constrained('employees');
            $table->string('non_system_name')->nullable();
            $table->string('non_system_department')->nullable();
            $table->string('mr_number')->unique();
            $table->foreignId('issued_by')->constrained('employees');
            $table->date('date_issued');
            $table->date('returned_date')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_sub_assignments');
    }
};
