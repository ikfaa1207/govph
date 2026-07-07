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
        Schema::create('requisitions', function (Blueprint $table) {
            $table->id();
            $table->string('ris_number')->unique();
            $table->foreignId('requesting_employee_id')->constrained('employees');
            $table->foreignId('department_id')->constrained();
            $table->enum('status', [
                'pending_dept_head',
                'rejected_dept_head',
                'pending_supply',
                'issued',
                'partially_issued',
                'cancelled',
            ])->default('pending_dept_head');
            $table->foreignId('department_head_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('requisition_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requisition_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained();
            $table->integer('quantity_requested');
            $table->integer('quantity_approved')->default(0);
            $table->integer('quantity_issued')->default(0);
            $table->timestamps();
        });

        Schema::create('issuances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requisition_id')->nullable()->constrained()->nullOnDelete();
            $table->string('issue_number')->unique();
            $table->date('issued_date');
            $table->foreignId('issued_by')->constrained('employees');
            $table->foreignId('received_by')->constrained('employees');
            $table->text('purpose')->nullable();
            $table->timestamps();
        });

        Schema::create('issuance_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('issuance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained();
            $table->integer('quantity_issued');
            $table->decimal('unit_cost', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issuance_items');
        Schema::dropIfExists('issuances');
        Schema::dropIfExists('requisition_items');
        Schema::dropIfExists('requisitions');
    }
};
