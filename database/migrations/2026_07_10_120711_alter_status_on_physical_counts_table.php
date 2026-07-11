<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('physical_counts', function (Blueprint $table) {
            $table->string('status')->default('draft')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert any status that is not supported by the old enum back to 'draft'
        DB::table('physical_counts')
            ->whereNotIn('status', ['draft', 'finalized'])
            ->update(['status' => 'draft']);

        Schema::table('physical_counts', function (Blueprint $table) {
            $table->enum('status', ['draft', 'finalized'])->default('draft')->change();
        });
    }
};
