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
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('property_number')->unique();
            $table->string('serial_number')->unique()->nullable();
            $table->string('model')->nullable();
            $table->string('brand')->nullable();
            $table->decimal('unit_cost', 15, 2);
            $table->date('date_acquired');
            $table->date('warranty_expiration')->nullable();
            $table->foreignId('category_id')->constrained();
            $table->enum('condition', ['new', 'good', 'fair', 'needs_repair', 'unserviceable', 'disposed'])->default('new');
            $table->enum('status', ['available', 'assigned', 'transferred', 'for_disposal', 'disposed'])->default('available');
            $table->timestamps();
        });

        Schema::create('property_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_to')->constrained('employees');
            $table->enum('document_type', ['ICS', 'PAR']);
            $table->string('document_number')->unique();
            $table->foreignId('assigned_by')->constrained('employees');
            $table->date('date_assigned');
            $table->date('returned_date')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('property_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('ptr_number')->unique();
            $table->date('transfer_date');
            $table->foreignId('from_employee_id')->constrained('employees');
            $table->foreignId('to_employee_id')->constrained('employees');
            $table->foreignId('office_id')->constrained();
            $table->text('reason');
            $table->foreignId('approved_by')->constrained('employees');
            $table->enum('status', ['pending', 'approved', 'declined'])->default('pending');
            $table->timestamps();
        });

        Schema::create('disposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('disposal_number')->unique();
            $table->enum('disposal_method', ['auction', 'transfer', 'donation', 'destruction']);
            $table->enum('reason', ['broken', 'obsolete', 'lost', 'expired', 'condemned']);
            $table->date('disposal_date');
            $table->decimal('appraised_value', 15, 2)->default(0.00);
            $table->decimal('proceeds', 15, 2)->default(0.00);
            $table->string('witness_by')->nullable();
            $table->foreignId('approved_by')->constrained('employees');
            $table->enum('status', ['pending', 'completed'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disposals');
        Schema::dropIfExists('property_transfers');
        Schema::dropIfExists('property_assignments');
        Schema::dropIfExists('properties');
    }
};
