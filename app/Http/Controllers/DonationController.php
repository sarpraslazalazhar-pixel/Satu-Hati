<?php

namespace App\Http\Controllers;

use App\Events\DonationCreated;
use App\Events\DonationStatusUpdated;
use App\Models\Donation;
use App\Services\ExcelExportService;
use App\Services\ExcelImportService;
use App\Services\QrisPdfParserService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

class DonationController extends Controller
{
    private int $targetAmount = 500000000; // Rp 500.000.000 (Target 500 Juta)

    /**
     * Data publik untuk landing page (Progress bar & Dinding Doa).
     */
    public function index()
    {
        $counted = fn () => Donation::where('status', 'verified');

        $currentAmount = (int) $counted()->sum('amount');
        $raw = ($currentAmount / $this->targetAmount) * 100;
        $progressPercentage = $raw > 0 && $raw < 1 ? round($raw, 1) : (float) min(100, round($raw, 1));
        $verifiedCount = $counted()->count();
        $qrisAmount = (int) $counted()->where('payment_method', 'qris')->sum('amount');
        $qrisCount = $counted()->where('payment_method', 'qris')->count();
        $cashAmount = (int) $counted()->where('payment_method', 'cash')->where('is_commitment', false)->sum('amount');
        $cashCount = $counted()->where('payment_method', 'cash')->where('is_commitment', false)->count();
        $committedAmount = (int) $counted()->where('is_commitment', true)->sum('amount');
        $committedPendingAmount = (int) Donation::where('is_commitment', true)->where('status', 'pending')->sum('amount');
        $committedPendingCount = Donation::where('is_commitment', true)->where('status', 'pending')->count();

        $verifiedDonations = $counted()->latest()->get()->map(function (Donation $donation) {
            return $donation->toPublicArray();
        });

        return response()->json([
            'campaign' => [
                'id' => 1,
                'title' => 'Satu Hati untuk Palestina',
                'subtitle' => 'Lembaga Amil Zakat (LAZ) Al Azhar Peduli',
                'targetAmount' => $this->targetAmount,
                'currentAmount' => $currentAmount,
                'progressPercentage' => $progressPercentage,
                'verifiedCount' => $verifiedCount,
                'qrisAmount' => $qrisAmount,
                'qrisCount' => $qrisCount,
                'cashAmount' => $cashAmount,
                'cashCount' => $cashCount,
                'committedAmount' => $committedAmount,
                'committedPendingAmount' => $committedPendingAmount,
                'committedPendingCount' => $committedPendingCount,
            ],
            'donations' => $verifiedDonations,
        ]);
    }

    /**
     * Submit formulir donasi baru oleh donatur (Status: pending).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'donor_name' => ['required', 'string', 'max:150'],
            'donor_phone' => ['required', 'string', 'min:9', 'max:25'],
            'donor_email' => ['nullable', 'email'],
            'amount' => ['required', 'integer', 'min:10000'],
            'is_anonymous' => ['boolean'],
            'prayer_message' => ['nullable', 'string', 'max:300'],
        ]);

        $donation = Donation::create([
            'donor_name' => trim($validated['donor_name']),
            'donor_phone' => trim($validated['donor_phone']),
            'donor_email' => $validated['donor_email'] ?? null,
            'amount' => $validated['amount'],
            'is_anonymous' => $validated['is_anonymous'] ?? false,
            'prayer_message' => isset($validated['prayer_message']) ? trim($validated['prayer_message']) : null,
            'status' => 'pending',
            'verified_at' => null,
        ]);

        $paymentUrl = null;
        $mayarApiKey = config('services.mayar.api_key');

        if (! empty($mayarApiKey)) {
            $phoneDigits = preg_replace('/[^0-9]/', '', $validated['donor_phone']);
            $email = ! empty($validated['donor_email']) ? $validated['donor_email'] : ($phoneDigits.'@donasi.lazalazhar.org');
            $baseUrl = rtrim(config('services.mayar.base_url', 'https://api.mayar.id'), '/');

            try {
                $response = Http::timeout(10)->withHeaders([
                    'Authorization' => 'Bearer '.$mayarApiKey,
                    'User-Agent' => 'LAZAlAzharPeduli/1.0',
                    'Content-Type' => 'application/json',
                ])->post($baseUrl.'/hl/v2/payments/create', [
                    'name' => 'Donasi LAZ Al Azhar - '.trim($validated['donor_name']),
                    'amount' => (int) $validated['amount'],
                    'email' => $email,
                    'mobile' => $phoneDigits,
                    'description' => $validated['prayer_message'] ?? 'Donasi LAZ Al Azhar Peduli Palestina',
                    'extraData' => [
                        'donation_id' => $donation->id,
                    ],
                ]);

                if ($response->successful()) {
                    $result = $response->json('data') ?? [];
                    $paymentUrl = $result['link'] ?? $result['linkPayment'] ?? $result['linkUrl'] ?? null;
                    $donation->update([
                        'mayar_payment_id' => $result['id'] ?? null,
                        'mayar_transaction_id' => $result['transactionId'] ?? null,
                        'payment_url' => $paymentUrl,
                    ]);
                } else {
                    report(new \Exception('Mayar API Error: '.$response->body()));
                }
            } catch (\Throwable $e) {
                report($e);
            }
        } elseif (! empty(config('services.tako.api_key')) && ! empty(config('services.tako.username'))) {
            $phoneDigits = preg_replace('/[^0-9]/', '', $validated['donor_phone']);
            $email = ! empty($validated['donor_email']) ? $validated['donor_email'] : ($phoneDigits.'@donasi.lazalazhar.org');

            try {
                $baseUrl = rtrim(config('services.tako.base_url', 'https://tako.id'), '/');
                $response = Http::timeout(10)->withHeaders([
                    'Authorization' => 'Bearer '.config('services.tako.api_key'),
                    'User-Agent' => 'LAZAlAzharPeduli/1.0',
                    'Content-Type' => 'application/json',
                ])->post($baseUrl.'/api/v1/gift/'.config('services.tako.username'), [
                    'name' => trim($validated['donor_name']),
                    'email' => $email,
                    'amount' => (int) $validated['amount'],
                    'paymentMethod' => 'qris',
                    'message' => $validated['prayer_message'] ?? 'Donasi LAZ Al Azhar Peduli',
                ]);

                if ($response->status() === 206 || $response->successful()) {
                    $result = $response->json('result') ?? [];
                    $paymentUrl = $result['paymentUrl'] ?? null;
                    $donation->update([
                        'tako_gift_id' => $result['giftId'] ?? null,
                        'tako_transaction_id' => $result['transactionId'] ?? null,
                        'payment_url' => $paymentUrl,
                    ]);
                } else {
                    report(new \Exception('Tako API Error: '.$response->body()));
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        try {
            broadcast(new DonationCreated($donation));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Donasi berhasil dicatat.',
            'donation' => $donation->toPublicArray(),
            'paymentUrl' => $paymentUrl,
        ], 201);
    }

    /**
     * Callback webhook resmi dari Tako (otomatis update status).
     */
    public function mayarWebhook(Request $request)
    {
        $token = config('services.mayar.webhook_token');
        if (! empty($token)) {
            $headerToken = $request->bearerToken()
                ?: $request->header('X-Mayar-Token')
                ?: $request->query('token');

            if ($headerToken !== $token) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
        }

        $payload = $request->all();
        if ($request->has('payload') && is_string($request->input('payload'))) {
            $decoded = json_decode($request->input('payload'), true);
            if (is_array($decoded)) {
                $payload = $decoded;
            }
        }

        $event = $payload['event'] ?? $payload['type'] ?? null;
        $data = $payload['data'] ?? $payload;

        $statusStr = strtolower((string) ($data['status'] ?? $data['transactionStatus'] ?? ''));
        $isPaid = in_array($event, ['payment.received', 'payment.success'], true)
            || in_array($statusStr, ['success', 'paid', 'settled'], true);

        $takoSecret = config('services.tako.webhook_secret');
        if (! empty($takoSecret) && $request->hasHeader('X-Tako-Signature')) {
            $expected = hash_hmac('sha256', $request->getContent(), $takoSecret);
            if (! hash_equals($expected, (string) $request->header('X-Tako-Signature'))) {
                return response()->json(['error' => 'Invalid signature'], 401);
            }
            $isPaid = true;
        }

        if (! $isPaid) {
            return response()->json(['success' => true, 'message' => 'Event ignored: '.($event ?? 'unknown')]);
        }

        $extraData = $data['extraData'] ?? $data['extra_data'] ?? [];
        if (is_string($extraData)) {
            $extraData = json_decode($extraData, true) ?? [];
        }

        $donationId = $extraData['donation_id'] ?? null;
        $mayarPaymentId = $data['paymentLinkId'] ?? $data['productId'] ?? $data['id'] ?? null;
        $txId = $data['transactionId'] ?? $data['paymentLinkTransactionId'] ?? $data['id'] ?? null;
        $takoGiftId = $data['relatedGiftId'] ?? null;

        $donation = null;
        if ($donationId) {
            $donation = Donation::find($donationId);
        }
        if (! $donation && $mayarPaymentId) {
            $donation = Donation::where('mayar_payment_id', $mayarPaymentId)->first();
        }
        if (! $donation && $txId) {
            $donation = Donation::where('mayar_transaction_id', $txId)->first();
        }
        if (! $donation && $takoGiftId) {
            $donation = Donation::where('tako_gift_id', $takoGiftId)->first();
        }

        if ($donation) {
            if ($donation->status === 'pending') {
                $donation->update([
                    'status' => 'verified',
                    'mayar_transaction_id' => $txId ?: $donation->mayar_transaction_id,
                    'verified_at' => now(),
                ]);

                try {
                    broadcast(new DonationStatusUpdated($donation, 'approved'));
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        } else {
            $donorName = trim((string) ($data['customerName'] ?? $data['merchantName'] ?? 'Donatur Mayar'));
            $donorPhone = trim((string) ($data['customerMobile'] ?? '-'));
            $donorEmail = trim((string) ($data['customerEmail'] ?? ''));
            $amount = (int) ($data['amount'] ?? 0);
            $message = $data['productName'] ?? 'Donasi via Mayar';

            if ($amount > 0) {
                $donation = Donation::create([
                    'donor_name' => $donorName ?: 'Donatur Mayar',
                    'donor_phone' => $donorPhone ?: '-',
                    'donor_email' => $donorEmail ?: null,
                    'amount' => $amount,
                    'is_anonymous' => false,
                    'prayer_message' => $message,
                    'status' => 'verified',
                    'mayar_payment_id' => $mayarPaymentId,
                    'mayar_transaction_id' => $txId,
                    'payment_url' => $data['paymentUrl'] ?? null,
                    'verified_at' => now(),
                ]);

                try {
                    broadcast(new DonationCreated($donation));
                    broadcast(new DonationStatusUpdated($donation, 'approved'));
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Callback webhook resmi dari Tako (otomatis update status).
     */
    public function takoWebhook(Request $request)
    {
        return $this->mayarWebhook($request);
    }

    /**
     * Cek status donasi ke server / Tako API.
     */
    public function checkStatus($id)
    {
        $donation = Donation::findOrFail($id);

        if ($donation->status === 'verified') {
            return response()->json([
                'success' => true,
                'status' => 'verified',
                'donation' => $donation->toPublicArray(),
            ]);
        }

        $mayarApiKey = config('services.mayar.api_key');
        if ($donation->mayar_payment_id && ! empty($mayarApiKey)) {
            try {
                $baseUrl = rtrim(config('services.mayar.base_url', 'https://api.mayar.id'), '/');
                $response = Http::timeout(8)->withHeaders([
                    'Authorization' => 'Bearer '.$mayarApiKey,
                    'User-Agent' => 'Zecrus/1.0',
                ])->get($baseUrl.'/hl/v2/payments/'.$donation->mayar_payment_id);

                if ($response->successful()) {
                    $status = strtolower((string) ($response->json('data.status') ?? ''));
                    if (in_array($status, ['paid', 'settled', 'success'], true)) {
                        $donation->update([
                            'status' => 'verified',
                            'verified_at' => now(),
                        ]);

                        try {
                            broadcast(new DonationStatusUpdated($donation, 'approved'));
                        } catch (\Throwable $e) {
                            report($e);
                        }
                    }
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        if ($donation->status !== 'verified' && $donation->tako_gift_id && config('services.tako.api_key')) {
            try {
                $baseUrl = rtrim(config('services.tako.base_url', 'https://tako.id'), '/');
                $response = Http::timeout(8)->withHeaders([
                    'Authorization' => 'Bearer '.config('services.tako.api_key'),
                    'User-Agent' => 'Zecrus/1.0',
                ])->get($baseUrl.'/api/v1/gift/'.$donation->tako_gift_id);

                if ($response->successful()) {
                    $takoStatus = $response->json('result.status');
                    if ($takoStatus === 'success' || $takoStatus === 'paid') {
                        $donation->update([
                            'status' => 'verified',
                            'verified_at' => now(),
                        ]);

                        try {
                            broadcast(new DonationStatusUpdated($donation, 'approved'));
                        } catch (\Throwable $e) {
                            report($e);
                        }
                    }
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'success' => true,
            'status' => $donation->status,
            'donation' => $donation->toPublicArray(),
        ]);
    }

    /**
     * Data lengkap donasi untuk panel admin (Pending, Verified, Rejected).
     */
    public function adminList()
    {
        $all = Donation::latest()->get()->map(function (Donation $d) {
            return $d->toAdminArray();
        });

        $counted = fn () => Donation::where('status', 'verified');

        $currentAmount = (int) $counted()->sum('amount');
        $qrisAmount = (int) $counted()->where('payment_method', 'qris')->sum('amount');
        $qrisCount = $counted()->where('payment_method', 'qris')->count();
        $cashAmount = (int) $counted()->where('payment_method', 'cash')->where('is_commitment', false)->sum('amount');
        $cashCount = $counted()->where('payment_method', 'cash')->where('is_commitment', false)->count();
        $committedAmount = (int) Donation::where('is_commitment', true)->sum('amount');
        $committedCount = Donation::where('is_commitment', true)->count();
        $committedPaidAmount = (int) $counted()->where('is_commitment', true)->sum('amount');
        $committedPaidCount = $counted()->where('is_commitment', true)->count();
        $raw = ($currentAmount / $this->targetAmount) * 100;
        $progressPercentage = $raw > 0 && $raw < 1 ? round($raw, 1) : (float) min(100, round($raw, 1));

        return response()->json([
            'donations' => $all,
            'currentAmount' => $currentAmount,
            'qrisAmount' => $qrisAmount,
            'qrisCount' => $qrisCount,
            'cashAmount' => $cashAmount,
            'cashCount' => $cashCount,
            'committedAmount' => $committedAmount,
            'committedCount' => $committedCount,
            'committedPaidAmount' => $committedPaidAmount,
            'committedPaidCount' => $committedPaidCount,
            'progressPercentage' => $progressPercentage,
            'targetAmount' => $this->targetAmount,
        ]);
    }

    /**
     * Approve donasi oleh  (Status: verified).
     */
    public function approve($id)
    {
        $donation = Donation::findOrFail($id);
        $donation->update([
            'status' => 'verified',
            'verified_at' => now(),
        ]);

        // Broadcast realtime ke channel public-donations
        try {
            broadcast(new DonationStatusUpdated($donation, 'approved'));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Donasi berhasil diverifikasi.',
            'donation' => $donation->toAdminArray(),
        ]);
    }

    /**
     * Tolak donasi oleh  (Status: rejected).
     */
    public function reject($id)
    {
        $donation = Donation::findOrFail($id);
        $donation->update([
            'status' => 'rejected',
        ]);

        // Broadcast realtime ke channel public-donations
        try {
            broadcast(new DonationStatusUpdated($donation, 'rejected'));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Donasi ditolak.',
            'donation' => $donation->toAdminArray(),
        ]);
    }

    /**
     * Perbarui data donasi oleh admin.
     */
    public function update(Request $request, int|string $id)
    {
        $donation = Donation::findOrFail($id);

        $isCommitment = $request->boolean('is_commitment');

        $validated = $request->validate([
            'donor_name' => ['required', 'string', 'max:150'],
            'donor_phone' => [$isCommitment ? 'required' : 'nullable', 'string', 'max:30'],
            'donor_email' => ['nullable', 'email', 'max:150'],
            'amount' => ['required', 'integer', 'min:1000'],
            'payment_method' => ['nullable', 'string', 'max:30'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'is_commitment' => ['nullable', 'boolean'],
            'is_anonymous' => ['nullable', 'boolean'],
            'prayer_message' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'string', 'in:pending,verified,rejected'],
            'donated_at' => ['nullable', 'date'],
        ]);

        $newStatus = $validated['status'];
        $verifiedAt = $donation->verified_at;

        if ($newStatus === 'verified' && ! $verifiedAt) {
            $verifiedAt = now();
        } elseif ($newStatus !== 'verified') {
            $verifiedAt = null;
        }

        $donatedAt = ! empty($validated['donated_at'])
            ? Carbon::parse($validated['donated_at'])
            : $donation->donated_at;

        $donation->update([
            'donor_name' => trim($validated['donor_name']),
            'donor_phone' => ! empty($validated['donor_phone']) ? trim($validated['donor_phone']) : ($donation->donor_phone ?: '-'),
            'donor_email' => ! empty($validated['donor_email']) ? trim($validated['donor_email']) : null,
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'] ?? $donation->payment_method ?? 'online',
            'reference_no' => ! empty($validated['reference_no']) ? trim($validated['reference_no']) : null,
            'is_commitment' => $isCommitment,
            'is_anonymous' => $request->boolean('is_anonymous'),
            'prayer_message' => ! empty($validated['prayer_message']) ? trim($validated['prayer_message']) : null,
            'status' => $newStatus,
            'donated_at' => $donatedAt,
            'verified_at' => $verifiedAt,
        ]);

        try {
            $action = $donation->status === 'verified' ? 'approved' : 'rejected';
            broadcast(new DonationStatusUpdated($donation, $action));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data donasi berhasil diperbarui.',
            'donation' => $donation->toAdminArray(),
        ]);
    }

    /**
     * Hapus data donasi oleh admin.
     */
    public function destroy(int|string $id)
    {
        $donation = Donation::findOrFail($id);
        $clone = clone $donation;
        $donation->delete();

        if ($clone->status === 'verified') {
            try {
                broadcast(new DonationStatusUpdated($clone, 'rejected'));
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Donasi berhasil dihapus.',
        ]);
    }

    /**
     * Ringkasan daftar file yang pernah diimpor (PDF / Excel).
     */
    public function importedFilesSummary()
    {
        $files = Donation::whereNotNull('source_file')
            ->where('source_file', '!=', '')
            ->selectRaw('source_file, count(*) as total_records, sum(amount) as total_amount, sum(case when status = "verified" then amount else 0 end) as verified_amount, min(created_at) as first_imported_at, max(created_at) as last_imported_at')
            ->groupBy('source_file')
            ->orderByDesc('last_imported_at')
            ->get()
            ->map(function ($row) {
                return [
                    'sourceFile' => $row->source_file,
                    'totalRecords' => (int) $row->total_records,
                    'totalAmount' => (int) $row->total_amount,
                    'verifiedAmount' => (int) $row->verified_amount,
                    'firstImportedAt' => $row->first_imported_at ? Carbon::parse($row->first_imported_at)->format('d M Y H:i') : null,
                    'lastImportedAt' => $row->last_imported_at ? Carbon::parse($row->last_imported_at)->format('d M Y H:i') : null,
                ];
            });

        return response()->json([
            'success' => true,
            'files' => $files,
        ]);
    }

    /**
     * Rollback / Hapus seluruh data donasi dari suatu file sumber (misal salah impor PDF/Excel).
     */
    public function rollbackSourceFile(Request $request)
    {
        $validated = $request->validate([
            'source_file' => ['required', 'string'],
        ]);

        $sourceFile = trim($validated['source_file']);
        $query = Donation::where('source_file', $sourceFile);
        $count = $query->count();

        if ($count === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ditemukan data donasi dengan file sumber tersebut.',
            ], 404);
        }

        $hasVerified = (clone $query)->where('status', 'verified')->exists();
        $query->delete();

        if ($hasVerified) {
            try {
                $dummy = new Donation(['status' => 'rejected', 'donor_name' => 'System', 'amount' => 0]);
                broadcast(new DonationStatusUpdated($dummy, 'rejected'));
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'success' => true,
            'message' => sprintf('Berhasil membatalkan impor. %d transaksi dari file "%s" telah dihapus.', $count, $sourceFile),
            'deleted_count' => $count,
        ]);
    }

    /**
     * Input donasi tunai / offline langsung verified oleh panitia.
     */
    public function offline(Request $request)
    {
        $validated = $request->validate([
            'donor_name' => ['nullable', 'string', 'max:150'],
            'donor_phone' => ['nullable', 'string', 'max:25'],
            'amount' => ['required', 'integer', 'min:1000'],
            'prayer_message' => ['nullable', 'string', 'max:300'],
        ]);

        $donation = Donation::create([
            'donor_name' => ! empty($validated['donor_name']) ? trim($validated['donor_name']) : 'Kotak Infak Venue / Offline',
            'donor_phone' => ! empty($validated['donor_phone']) ? trim($validated['donor_phone']) : 'OFFLINE-CASH',
            'amount' => $validated['amount'],
            'is_anonymous' => false,
            'prayer_message' => ! empty($validated['prayer_message']) ? trim($validated['prayer_message']) : 'Donasi Tunai Melalui Amil LAZ Al Azhar Peduli',
            'status' => 'verified',
            'verified_at' => now(),
        ]);

        try {
            broadcast(new DonationStatusUpdated($donation, 'approved'));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Donasi offline berhasil dicatat.',
            'donation' => $donation->toAdminArray(),
        ], 201);
    }

    /**
     * Input donasi manual tunai / cash oleh panitia atau komitmen/book.
     */
    public function manualCash(Request $request)
    {
        $isCommitment = $request->boolean('is_commitment');

        $rules = [
            'donor_name' => ['required', 'string', 'max:150'],
            'amount' => ['required', 'integer', 'min:1000'],
            'donated_at' => ['nullable', 'date'],
            'is_commitment' => ['nullable', 'boolean'],
            'prayer_message' => ['nullable', 'string', 'max:500'],
        ];

        if ($isCommitment) {
            $rules['donor_phone'] = ['required', 'string', 'max:30'];
        } else {
            $rules['donor_phone'] = ['nullable', 'string', 'max:30'];
        }

        $validated = $request->validate($rules, [
            'donor_phone.required' => 'Nomor telepon wajib diisi untuk donasi berstatus komitmen / book.',
            'donor_name.required' => 'Nama atau sumber donasi wajib diisi.',
            'amount.required' => 'Nominal donasi wajib diisi.',
        ]);

        $donatedAt = ! empty($validated['donated_at'])
            ? Carbon::parse($validated['donated_at'])
            : now();

        $status = $isCommitment ? 'pending' : 'verified';
        $verifiedAt = $isCommitment ? null : now();

        $donation = Donation::create([
            'donor_name' => trim($validated['donor_name']),
            'donor_phone' => ! empty($validated['donor_phone']) ? trim($validated['donor_phone']) : 'OFFLINE-CASH',
            'amount' => $validated['amount'],
            'payment_method' => 'cash',
            'is_commitment' => $isCommitment,
            'is_anonymous' => false,
            'prayer_message' => ! empty($validated['prayer_message']) ? trim($validated['prayer_message']) : ($isCommitment ? 'Komitmen / Book Donasi Konser' : 'Donasi Tunai Langsung'),
            'status' => $status,
            'donated_at' => $donatedAt,
            'verified_at' => $verifiedAt,
        ]);

        try {
            broadcast(new DonationStatusUpdated($donation, 'approved'));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => $isCommitment ? 'Komitmen donasi berhasil dicatat.' : 'Donasi tunai berhasil dicatat dan diverifikasi.',
            'donation' => $donation->toAdminArray(),
        ], 201);
    }

    /**
     * Parse file PDF laporan QRIS Danamon untuk proses review admin.
     */
    public function parsePdf(Request $request, QrisPdfParserService $parser)
    {
        // Support both single file 'pdf' and multiple files 'pdfs'
        $files = [];
        if ($request->hasFile('pdfs')) {
            $files = is_array($request->file('pdfs')) ? $request->file('pdfs') : [$request->file('pdfs')];
        } elseif ($request->hasFile('pdf')) {
            $files = [$request->file('pdf')];
        }

        if (empty($files)) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan unggah minimal satu file PDF laporan QRIS.',
            ], 422);
        }

        $allTransactions = [];
        $fileSummaries = [];
        $totalDetectedAmount = 0;
        $totalDuplicateCount = 0;

        foreach ($files as $file) {
            $parsed = $parser->parse($file->getRealPath());
            $items = $parsed['items'] ?? [];
            $fileName = $file->getClientOriginalName();
            $fileAmount = (int) ($parsed['total_detected_amount'] ?? 0);
            $fileDuplicates = (int) ($parsed['duplicate_count'] ?? 0);

            $fileSummaries[] = [
                'file_name' => $fileName,
                'transaction_count' => count($items),
                'total_amount' => $fileAmount,
                'duplicate_count' => $fileDuplicates,
            ];

            foreach ($items as $item) {
                $item['source_file'] = $fileName;
                $allTransactions[] = $item;
            }

            $totalDetectedAmount += $fileAmount;
            $totalDuplicateCount += $fileDuplicates;
        }

        // Deduplikasi transaksi jika ada nomor referensi yang sama di antara file yang diunggah
        $uniqueTransactions = [];
        $seenRefs = [];
        foreach ($allTransactions as $tx) {
            $ref = ! empty($tx['ref']) ? trim($tx['ref']) : null;
            if ($ref) {
                if (isset($seenRefs[$ref])) {
                    if (! ($tx['is_duplicate'] ?? false)) {
                        $tx['is_duplicate'] = true;
                        $totalDuplicateCount++;
                    }
                } else {
                    $seenRefs[$ref] = true;
                }
            }
            $uniqueTransactions[] = $tx;
        }

        return response()->json([
            'success' => true,
            'file_count' => count($files),
            'files' => $fileSummaries,
            'total_detected_rows' => count($uniqueTransactions),
            'total_detected_amount' => $totalDetectedAmount,
            'duplicate_count' => $totalDuplicateCount,
            'items' => $uniqueTransactions,
            'message' => count($files) > 1
                ? 'Berhasil memproses '.count($files).' file PDF laporan QRIS.'
                : 'Berhasil memproses file PDF.',
        ]);
    }

    /**
     * Ekspor seluruh donasi ke file Excel (.xlsx).
     */
    public function exportExcel()
    {
        $donations = Donation::latest()->get();

        $no = 1;
        $rows = $donations->map(function (Donation $d) use (&$no) {
            return [
                $no++,
                $d->donor_name,
                $d->donor_phone,
                $d->donor_email,
                $d->amount,
                $this->statusLabel($d),
                $this->methodLabel($d),
                $d->donated_at?->format('d/m/Y H:i') ?? $d->created_at?->format('d/m/Y H:i'),
                $d->reference_no,
                $d->source_file,
                $d->prayer_message,
                $d->verified_at?->format('d/m/Y H:i'),
            ];
        })->all();

        $exporter = (new ExcelExportService([
            'No',
            'Nama Donatur',
            'No HP',
            'Email',
            'Nominal (Rp)',
            'Status',
            'Metode',
            'Tanggal',
            'No Referensi',
            'Sumber File',
            'Pesan / Doa',
            'Diverifikasi',
        ], $rows))
            ->setSheetName('Rekap Donasi')
            ->setColumnWidths([5, 28, 18, 25, 18, 22, 12, 18, 20, 35, 40, 18])
            ->setCurrencyColumns([4]);

        return $exporter->download('Rekap_Donasi_Satu_Hati_Palestina_'.now()->format('Ymd_His').'.xlsx');
    }

    private function statusLabel(Donation $d): string
    {
        if ($d->is_commitment && $d->status === 'verified') {
            return 'Komitmen - Sudah Donasi';
        }
        if ($d->is_commitment && $d->status === 'pending') {
            return 'Komitmen - Belum Donasi';
        }
        if ($d->is_commitment && $d->status === 'rejected') {
            return 'Komitmen - Dibatalkan';
        }

        return ucfirst($d->status);
    }

    private function methodLabel(Donation $d): string
    {
        return match ($d->payment_method) {
            'qris' => 'QRIS',
            'transfer' => 'Transfer',
            'cash' => $d->is_commitment ? 'Komitmen' : 'Cash',
            default => ucfirst((string) ($d->payment_method ?? 'online')),
        };
    }

    /**
     * Parse file Excel (.xlsx) rekap donasi untuk proses review admin.
     * Kolom dikenali: Nama, Nominal, Status, Metode, Tanggal, Ref, Pesan/Doa.
     */
    public function parseExcel(Request $request, ExcelImportService $excel)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:20480'],
        ], [
            'file.required' => 'Silakan unggah file Excel (.xlsx).',
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        if (! in_array($ext, ['xlsx', 'xlsm'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Format harus .xlsx (Excel 2007+). Simpan ulang file .xls lama ke .xlsx terlebih dahulu.',
            ], 422);
        }

        try {
            $parsed = $excel->read($file->getRealPath());
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membaca file Excel: '.$e->getMessage(),
            ], 422);
        }

        if (empty($parsed['rows'])) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada baris data yang terdeteksi di file Excel.',
            ], 422);
        }

        $fileName = $file->getClientOriginalName();
        $items = [];
        $no = 0;

        foreach ($parsed['rows'] as $values) {
            $mapped = $this->mapExcelRow($parsed['headers'], $values);
            if ($mapped === null) {
                continue; // baris tanpa nominal / nama kosong
            }

            $no++;
            $ref = $mapped['ref'];
            $mapped['no'] = $no;
            $mapped['source_file'] = $fileName;
            $mapped['is_duplicate'] = $ref ? Donation::where('reference_no', $ref)->exists() : false;
            $mapped['selected'] = ! $mapped['is_duplicate'];
            $items[] = $mapped;
        }

        if (empty($items)) {
            return response()->json([
                'success' => false,
                'message' => 'Baris terbaca, tetapi tidak ada nama + nominal yang valid. Cek header kolom (Nama, Nominal, Status, Metode, Tanggal).',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'sheet' => $parsed['sheet'],
            'headers' => array_map(fn ($h) => $h['label'], $parsed['headers']),
            'total_detected_rows' => count($items),
            'total_detected_amount' => array_sum(array_column($items, 'amount')),
            'duplicate_count' => count(array_filter($items, fn ($i) => $i['is_duplicate'])),
            'items' => $items,
            'message' => 'Berhasil memproses file Excel "'.$fileName.'".',
        ]);
    }

    /**
     * Normalisasi satu baris Excel menjadi payload donasi.
     *
     * @param  array<int, array{index:int,label:string,field:?string}>  $headers
     * @param  array<int, mixed>  $values
     * @return array<string, mixed>|null
     */
    private function mapExcelRow(array $headers, array $values): ?array
    {
        $byField = [];
        $unknown = [];

        foreach ($headers as $header) {
            if ($header['field'] === null) {
                continue;
            }
            $raw = $values[$header['index']] ?? null;
            if ($raw === null || trim((string) $raw) === '') {
                continue;
            }
            $byField[$header['field']] = trim((string) $raw);
        }

        // Simpan kolom tambahan tanpa nama dikenal agar tidak hilang saat ekspor.
        foreach ($headers as $header) {
            if ($header['field'] !== null || $header['label'] === '') {
                continue;
            }
            $raw = $values[$header['index']] ?? null;
            if ($raw !== null && trim((string) $raw) !== '') {
                $unknown[$header['label']] = trim((string) $raw);
            }
        }

        $amount = ExcelImportService::parseAmount($byField['amount'] ?? null);
        $name = $byField['name'] ?? null;

        if ($amount === null || $amount < 1000 || $name === null) {
            return null;
        }

        $status = $this->normalizeStatus($byField['status'] ?? null);
        $method = $this->normalizeMethod($byField['method'] ?? null);
        $isCommitment = $status === 'pending' || $method === 'commitment';

        return [
            'name' => $name,
            'amount' => $amount,
            'status' => $isCommitment ? 'pending' : $status,
            'method' => $method === 'commitment' ? 'cash' : $method,
            'is_commitment' => $isCommitment,
            'date' => ExcelImportService::parseDate($byField['date'] ?? null),
            'ref' => $byField['ref'] ?? null,
            'message' => $byField['message'] ?? null,
            'extra' => $unknown ?: null,
        ];
    }

    /**
     * Parse tanggal dari input bebas; null bila tidak valid (tidak melempar).
     */
    private function safeParseDate(?string $raw): ?Carbon
    {
        if ($raw === null || trim($raw) === '') {
            return null;
        }

        try {
            return Carbon::parse($raw);
        } catch (\Throwable) {
            return null;
        }
    }

    private function normalizeStatus(?string $raw): string
    {
        $key = strtolower(trim((string) $raw));

        return match (true) {
            $key === '' => 'verified',
            str_contains($key, 'pend') || str_contains($key, 'book') || str_contains($key, 'komit') || str_contains($key, 'janji') => 'pending',
            str_contains($key, 'reject') || str_contains($key, 'tolak') || str_contains($key, 'batal') || str_contains($key, 'cancel') => 'rejected',
            default => 'verified',
        };
    }

    private function normalizeMethod(?string $raw): string
    {
        $key = strtolower(trim((string) $raw));

        return match (true) {
            $key === '' => 'cash',
            str_contains($key, 'qris') || str_contains($key, 'qr') => 'qris',
            str_contains($key, 'transfer') || str_contains($key, 'bank') || str_contains($key, 'bsi') => 'transfer',
            str_contains($key, 'komit') || str_contains($key, 'book') || str_contains($key, 'janji') => 'commitment',
            default => 'cash',
        };
    }

    /**
     * Impor batch hasil review Excel ke database.
     */
    public function importExcelBatch(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.name' => ['required', 'string', 'max:150'],
            'items.*.amount' => ['required', 'integer', 'min:1000'],
            'items.*.status' => ['nullable', 'in:pending,verified,rejected'],
            'items.*.method' => ['nullable', 'in:cash,qris,transfer'],
            'items.*.is_commitment' => ['nullable', 'boolean'],
            'items.*.date' => ['nullable', 'string'],
            'items.*.ref' => ['nullable', 'string', 'max:100'],
            'items.*.message' => ['nullable', 'string', 'max:500'],
            'items.*.source_file' => ['nullable', 'string', 'max:255'],
            'items.*.selected' => ['nullable', 'boolean'],
        ], [
            'items.required' => 'Tidak ada baris yang dikirim untuk diimpor.',
        ]);

        $selected = array_filter($validated['items'], fn ($item) => ($item['selected'] ?? true) === true);

        if (empty($selected)) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada baris yang dipilih untuk diimpor.',
            ], 422);
        }

        $imported = 0;
        $skipped = 0;
        $totalImported = 0;
        $last = null;

        foreach ($selected as $item) {
            $ref = ! empty($item['ref']) ? trim($item['ref']) : null;

            if ($ref && Donation::where('reference_no', $ref)->exists()) {
                $skipped++;

                continue;
            }

            $status = $item['status'] ?? 'verified';
            $donatedAt = $this->safeParseDate($item['date'] ?? null) ?? now();

            $last = Donation::create([
                'donor_name' => trim($item['name']),
                'donor_phone' => 'IMPORT-EXCEL',
                'amount' => $item['amount'],
                'payment_method' => $item['method'] ?? 'cash',
                'reference_no' => $ref,
                'source_file' => ! empty($item['source_file']) ? trim($item['source_file']) : null,
                'is_commitment' => (bool) ($item['is_commitment'] ?? false),
                'is_anonymous' => false,
                'prayer_message' => ! empty($item['message']) ? trim($item['message']) : 'Impor Excel',
                'status' => $status,
                'donated_at' => $donatedAt,
                'verified_at' => $status === 'verified' ? now() : null,
            ]);

            $imported++;
            $totalImported += $item['amount'];
        }

        if ($last && $last->status === 'verified') {
            try {
                broadcast(new DonationStatusUpdated($last, 'approved'));
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'success' => true,
            'message' => sprintf('Berhasil mengimpor %d baris Excel (%d duplikat dilewati).', $imported, $skipped),
            'imported_count' => $imported,
            'skipped_count' => $skipped,
            'total_imported_amount' => $totalImported,
        ]);
    }

    /**
     * Konfirmasi dan simpan batch donasi QRIS hasil review ke database.
     */
    public function importPdfBatch(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.name' => ['nullable', 'string', 'max:150'],
            'items.*.amount' => ['required', 'integer', 'min:1000'],
            'items.*.date' => ['nullable', 'string'],
            'items.*.ref' => ['nullable', 'string', 'max:100'],
            'items.*.source_file' => ['nullable', 'string', 'max:255'],
            'items.*.selected' => ['nullable', 'boolean'],
        ]);

        $selectedItems = array_filter($validated['items'], function ($item) {
            return ($item['selected'] ?? true) === true;
        });

        if (empty($selectedItems)) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada transaksi yang dipilih untuk diimpor.',
            ], 422);
        }

        $imported = [];
        $skipped = 0;
        $lastDonation = null;

        foreach ($selectedItems as $item) {
            $ref = ! empty($item['ref']) ? trim($item['ref']) : null;

            // Cek duplikasi No Ref
            if ($ref && Donation::where('reference_no', $ref)->exists()) {
                $skipped++;

                continue;
            }

            $donatedAt = $this->safeParseDate($item['date'] ?? null) ?? now();

            $donation = Donation::create([
                'donor_name' => ! empty($item['name']) ? trim($item['name']) : 'Hamba Allah',
                'donor_phone' => 'QRIS-MERCHANT',
                'amount' => $item['amount'],
                'payment_method' => 'qris',
                'reference_no' => $ref,
                'source_file' => ! empty($item['source_file']) ? trim($item['source_file']) : null,
                'is_commitment' => false,
                'is_anonymous' => false,
                'prayer_message' => 'Infaq QRIS - Danamon LAZ Al Azhar',
                'status' => 'verified',
                'donated_at' => $donatedAt,
                'verified_at' => now(),
            ]);

            $imported[] = $donation;
            $lastDonation = $donation;
        }

        if ($lastDonation) {
            try {
                broadcast(new DonationStatusUpdated($lastDonation, 'approved'));
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'success' => true,
            'message' => sprintf('Berhasil mengimpor %d transaksi QRIS (%d duplikat dilewati).', count($imported), $skipped),
            'imported_count' => count($imported),
            'skipped_count' => $skipped,
            'total_imported_amount' => array_sum(array_map(fn ($d) => $d->amount, $imported)),
        ]);
    }
}
