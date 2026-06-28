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
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('item_code')->unique();
            $table->string('stock_number')->unique()->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('category_id')->constrained();
            $table->foreignId('unit_id')->constrained();
            $table->decimal('unit_cost', 15, 2)->default(0.00);
            $table->integer('reorder_level')->default(0);
            $table->integer('maximum_stock')->default(0);
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->date('expiration_date')->nullable();
            $table->string('barcode')->unique()->nullable();
            $table->string('image_path')->nullable();
            $table->enum('status', ['active', 'inactive', 'obsolete'])->default('active');
            $table->timestamps();
        });

        Schema::create('stock_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->enum('transaction_type', ['in', 'out', 'adjustment', 'transfer_in', 'transfer_out']);
            $table->integer('quantity');
            $table->decimal('unit_cost', 15, 2);
            $table->string('reference_type');
            $table->unsignedBigInteger('reference_id');
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transactions');
        Schema::dropIfExists('items');
    }
};
