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
        Schema::table('donations', function (Blueprint $table) {
            $table->string('payment_method', 30)->default('online')->after('amount');
            $table->string('reference_no', 100)->nullable()->index()->after('payment_method');
            $table->boolean('is_commitment')->default(false)->after('is_anonymous');
            $table->timestamp('donated_at')->nullable()->after('verified_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropIndex(['reference_no']);
            $table->dropColumn(['payment_method', 'reference_no', 'is_commitment', 'donated_at']);
        });
    }
};
