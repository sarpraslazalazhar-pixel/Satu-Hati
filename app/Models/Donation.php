<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Donation extends Model
{
    use HasFactory;

    protected $fillable = [
        'donor_name',
        'donor_phone',
        'donor_email',
        'amount',
        'payment_method',
        'reference_no',
        'source_file',
        'is_commitment',
        'is_anonymous',
        'prayer_message',
        'status',
        'tako_gift_id',
        'tako_transaction_id',
        'mayar_payment_id',
        'mayar_transaction_id',
        'payment_url',
        'verified_at',
        'donated_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'is_anonymous' => 'boolean',
        'is_commitment' => 'boolean',
        'verified_at' => 'datetime',
        'donated_at' => 'datetime',
    ];

    /**
     * Scope query untuk donasi yang terverifikasi (tampil di dinding doa & progress)
     */
    public function scopeVerified($query)
    {
        return $query->where('status', 'verified');
    }

    /**
     * Scope query untuk donasi yang aktif dihitung dan tampil di publik (kiosk / page donasi).
     * Termasuk donasi verified dan donasi komitmen aktif (selama belum ditolak).
     */
    public function scopeCountedForPublic($query)
    {
        return $query->where(function ($q) {
            $q->where('status', 'verified')
                ->orWhere(function ($sub) {
                    $sub->where('is_commitment', true)
                        ->where('status', '!=', 'rejected');
                });
        });
    }

    /**
     * Scope query untuk donasi yang pending (antrean)
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Nama tampilan publik: jika anonim, tampilkan 'Hamba Allah'
     */
    public function getPublicDonorNameAttribute(): string
    {
        return $this->is_anonymous ? 'Hamba Allah' : $this->donor_name;
    }

    /**
     * Format payload untuk feed publik (dinding doa)
     */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'donorName' => $this->public_donor_name,
            'amount' => $this->amount,
            'paymentMethod' => $this->payment_method ?? 'online',
            'isAnonymous' => $this->is_anonymous,
            'isCommitment' => (bool) $this->is_commitment,
            'prayerMessage' => $this->prayer_message,
            'paymentUrl' => $this->payment_url,
            'status' => $this->status,
            'donatedAt' => $this->donated_at ? $this->donated_at->format('Y-m-d H:i') : null,
            'createdAt' => $this->created_at ? $this->created_at->diffForHumans() : 'Baru saja',
        ];
    }

    /**
     * Format payload lengkap untuk panel admin
     */
    public function toAdminArray(): array
    {
        return [
            'id' => $this->id,
            'donorName' => $this->donor_name,
            'donorPhone' => $this->donor_phone,
            'donorEmail' => $this->donor_email,
            'amount' => $this->amount,
            'paymentMethod' => $this->payment_method ?? 'online',
            'referenceNo' => $this->reference_no,
            'sourceFile' => $this->source_file,
            'isCommitment' => (bool) $this->is_commitment,
            'isAnonymous' => $this->is_anonymous,
            'prayerMessage' => $this->prayer_message,
            'status' => $this->status,
            'takoGiftId' => $this->tako_gift_id,
            'mayarPaymentId' => $this->mayar_payment_id,
            'mayarTransactionId' => $this->mayar_transaction_id,
            'paymentUrl' => $this->payment_url,
            'donatedAt' => $this->donated_at ? $this->donated_at->format('Y-m-d H:i') : null,
            'verifiedAt' => $this->verified_at ? $this->verified_at->format('Y-m-d H:i:s') : null,
            'createdAt' => $this->created_at ? $this->created_at->diffForHumans() : 'Baru saja',
        ];
    }
}
