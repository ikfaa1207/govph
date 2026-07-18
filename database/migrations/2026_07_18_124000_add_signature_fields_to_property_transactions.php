<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_assignments', function (Blueprint $table) {
            $table->text('digital_signature')->nullable()->after('remarks');
            $table->timestamp('acknowledged_at')->nullable()->after('digital_signature');
        });

        Schema::table('property_transfers', function (Blueprint $table) {
            $table->text('digital_signature')->nullable()->after('status');
            $table->timestamp('transferred_at')->nullable()->after('digital_signature');
            $table->timestamp('acknowledged_at')->nullable()->after('transferred_at');
        });
    }

    public function down(): void
    {
        Schema::table('property_assignments', function (Blueprint $table) {
            $table->dropColumn(['digital_signature', 'acknowledged_at']);
        });

        Schema::table('property_transfers', function (Blueprint $table) {
            $table->dropColumn(['digital_signature', 'transferred_at', 'acknowledged_at']);
        });
    }
};
