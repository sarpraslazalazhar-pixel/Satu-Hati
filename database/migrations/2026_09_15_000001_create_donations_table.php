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
        Schema::create('donations', function (Blueprint $table) {
            $table->id();
            $table->string('donor_name'); // Nama lengkap asli pengirim
            $table->string('donor_phone'); // Nomor WhatsApp
            $table->unsignedBigInteger('amount'); // Nominal donasi dalam Rupiah
            $table->boolean('is_anonymous')->default(false); // Disamarkan di publik
            $table->text('prayer_message')->nullable(); // Pesan doa
            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};
