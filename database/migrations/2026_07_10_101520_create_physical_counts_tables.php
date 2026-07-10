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
        Schema::create('physical_counts', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['RPCPPE', 'RPCI']);
            $table->date('as_of_date');
            $table->enum('status', ['draft', 'finalized'])->default('draft');
            $table->foreignId('created_by')->constrained('employees')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('physical_count_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('physical_count_id')->constrained()->cascadeOnDelete();
            $table->foreignId('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->foreignId('item_id')->nullable()->constrained('items')->nullOnDelete();
            $table->decimal('recorded_qty', 10, 2);
            $table->decimal('actual_qty', 10, 2)->nullable();
            $table->decimal('shortage_qty', 10, 2)->nullable();
            $table->decimal('overage_qty', 10, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('physical_count_items');
        Schema::dropIfExists('physical_counts');
    }
};
