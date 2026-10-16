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
            $table->string('donor_email')->nullable()->after('donor_phone');
            $table->string('tako_gift_id')->nullable()->index()->after('status');
            $table->string('tako_transaction_id')->nullable()->after('tako_gift_id');
            $table->string('payment_url')->nullable()->after('tako_transaction_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropColumn([
                'donor_email',
                'tako_gift_id',
                'tako_transaction_id',
                'payment_url',
            ]);
        });
    }
};
