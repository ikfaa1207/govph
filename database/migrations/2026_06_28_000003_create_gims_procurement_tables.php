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
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->string('pr_number')->unique();
            $table->foreignId('requested_by')->constrained('employees');
            $table->foreignId('department_id')->constrained();
            $table->text('purpose');
            $table->enum('status', ['pending', 'approved', 'rejected', 'ordered'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->nullable()->constrained()->nullOnDelete();
            $table->string('po_number')->unique();
            $table->foreignId('supplier_id')->constrained();
            $table->date('po_date');
            $table->date('delivery_date')->nullable();
            $table->enum('status', ['draft', 'sent', 'partially_received', 'received', 'cancelled'])->default('draft');
            $table->timestamps();
        });

        Schema::create('receiving_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained();
            $table->string('iar_number')->unique();
            $table->string('invoice_number')->nullable();
            $table->string('delivery_receipt_number');
            $table->date('received_date');
            $table->foreignId('received_by')->constrained('employees');
            $table->foreignId('inspected_by')->constrained('employees');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('receiving_report_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('receiving_report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained();
            $table->integer('quantity_received');
            $table->integer('quantity_accepted');
            $table->integer('quantity_rejected')->default(0);
            $table->decimal('unit_cost', 15, 2);
            $table->string('batch_number')->nullable();
            $table->date('expiration_date')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receiving_report_items');
        Schema::dropIfExists('receiving_reports');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('purchase_requests');
    }
};
