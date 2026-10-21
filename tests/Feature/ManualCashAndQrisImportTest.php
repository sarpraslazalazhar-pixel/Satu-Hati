<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ManualCashAndQrisImportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create([
            'email' => 'admin@zecrus.test',
        ]);
    }

    public function test_manual_cash_creates_verified_donation_and_broadcasts(): void
    {
        Event::fake();

        $response = $this->actingAs($this->admin)->postJson('/api/admin/donations/manual-cash', [
            'donor_name' => 'H. Ahmad Subarjo',
            'amount' => 500000,
            'is_commitment' => false,
            'donated_at' => '2026-10-16 10:00:00',
            'prayer_message' => 'Infak langsung konser Zecrus',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'donation' => [
                    'donorName' => 'H. Ahmad Subarjo',
                    'amount' => 500000,
                    'status' => 'verified',
                    'paymentMethod' => 'cash',
                    'isCommitment' => false,
                ],
            ]);

        $this->assertDatabaseHas('donations', [
            'donor_name' => 'H. Ahmad Subarjo',
            'amount' => 500000,
            'status' => 'verified',
            'payment_method' => 'cash',
            'is_commitment' => false,
        ]);
    }

    public function test_manual_commitment_requires_phone_number(): void
    {
        // Tanpa nomor HP -> harus gagal validasi
        $response = $this->actingAs($this->admin)->postJson('/api/admin/donations/manual-cash', [
            'donor_name' => 'Ibu Siti Komitmen',
            'amount' => 1000000,
            'is_commitment' => true,
            'donor_phone' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['donor_phone']);

        // Dengan nomor HP -> berhasil dengan status committed
        $successResponse = $this->actingAs($this->admin)->postJson('/api/admin/donations/manual-cash', [
            'donor_name' => 'Ibu Siti Komitmen',
            'donor_phone' => '081234567899',
            'amount' => 1000000,
            'is_commitment' => true,
            'prayer_message' => 'Insya Allah transfer besok pagi',
        ]);

        $successResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'donation' => [
                    'donorName' => 'Ibu Siti Komitmen',
                    'donorPhone' => '081234567899',
                    'amount' => 1000000,
                    'status' => 'pending',
                    'isCommitment' => true,
                ],
            ]);

        $this->assertDatabaseHas('donations', [
            'donor_name' => 'Ibu Siti Komitmen',
            'status' => 'pending',
            'is_commitment' => true,
        ]);

        // Komitmen langsung tampil di endpoint donasi publik
        $public = $this->getJson('/api/donations');
        $public->assertOk();
        $this->assertSame(1000000, $public->json('campaign.currentAmount'));
        $this->assertCount(1, $public->json('donations'));
        $this->assertSame('Ibu Siti Komitmen', $public->json('donations.0.donorName'));
        $this->assertTrue($public->json('donations.0.isCommitment'));
    }

    public function test_import_pdf_batch_creates_verified_donations_and_skips_duplicates(): void
    {
        Event::fake();

        $batchData = [
            'items' => [
                [
                    'name' => 'EMA RAHMAWATI',
                    'amount' => 500000,
                    'date' => '2026-10-09 09:35',
                    'ref' => 'MW2610099490997',
                    'selected' => true,
                ],
                [
                    'name' => 'WITA LESTARI',
                    'amount' => 5000000,
                    'date' => '2026-10-09 09:34',
                    'ref' => 'MW2610099490911',
                    'selected' => true,
                ],
                [
                    'name' => 'UNSELECTED DONOR',
                    'amount' => 100000,
                    'date' => '2026-10-09 09:30',
                    'ref' => 'MW2610099490000',
                    'selected' => false,
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/admin/donations/import-pdf-batch', $batchData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'imported_count' => 2,
                'skipped_count' => 0,
                'total_imported_amount' => 5500000,
            ]);

        $this->assertDatabaseHas('donations', [
            'donor_name' => 'EMA RAHMAWATI',
            'amount' => 500000,
            'reference_no' => 'MW2610099490997',
            'payment_method' => 'qris',
            'status' => 'verified',
        ]);

        $this->assertDatabaseMissing('donations', [
            'donor_name' => 'UNSELECTED DONOR',
        ]);

        // Uji coba impor ulang batch yang sama -> harus di-skip karena duplikat reference_no
        $secondResponse = $this->actingAs($this->admin)->postJson('/api/admin/donations/import-pdf-batch', $batchData);
        $secondResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'imported_count' => 0,
                'skipped_count' => 2,
            ]);
    }

    public function test_pdf_parsing_endpoint_works_with_real_pdf(): void
    {
        $realPdfPath = 'C:\\Users\\IT Dev\\Downloads\\Gibran\\Merchant_Report-LAZ_AL_AZHAR-0001087326-11_10_2026_5_56_34.pdf';

        if (! file_exists($realPdfPath)) {
            $this->markTestSkipped('Sample PDF file not found at test path.');
        }

        $uploadedFile = new UploadedFile(
            $realPdfPath,
            'Merchant_Report-LAZ_AL_AZHAR-0001087326-11_10_2026_5_56_34.pdf',
            'application/pdf',
            null,
            true
        );

        $response = $this->actingAs($this->admin)->postJson('/api/admin/donations/parse-pdf', [
            'pdf' => $uploadedFile,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'total_detected_rows' => 48,
                'total_detected_amount' => 9495000,
                'duplicate_count' => 0,
            ]);
    }
}
