<?php

namespace Tests\Feature;

use App\Events\DonationStatusUpdated;
use App\Models\Donation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class AdminDonationEditAndRollbackTest extends TestCase
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

    public function test_admin_can_update_donation_details_and_broadcasts(): void
    {
        Event::fake();

        $donation = Donation::create([
            'donor_name' => 'Fulan bin Fulan',
            'donor_phone' => '081234567890',
            'amount' => 50000,
            'payment_method' => 'cash',
            'is_anonymous' => false,
            'is_commitment' => false,
            'status' => 'pending',
            'prayer_message' => 'Doa awal',
        ]);

        $response = $this->actingAs($this->admin)->putJson("/api/admin/donations/{$donation->id}", [
            'donor_name' => 'H. Ahmad Syahid',
            'donor_phone' => '081987654321',
            'donor_email' => 'ahmad@example.com',
            'amount' => 150000,
            'payment_method' => 'qris',
            'status' => 'verified',
            'is_commitment' => false,
            'is_anonymous' => true,
            'prayer_message' => 'Semoga Palestina merdeka dan berkah',
            'donated_at' => '2026-10-18 14:30:00',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Data donasi berhasil diperbarui.',
                'donation' => [
                    'id' => $donation->id,
                    'donorName' => 'H. Ahmad Syahid',
                    'donorPhone' => '081987654321',
                    'amount' => 150000,
                    'paymentMethod' => 'qris',
                    'status' => 'verified',
                    'isAnonymous' => true,
                ],
            ]);

        $this->assertDatabaseHas('donations', [
            'id' => $donation->id,
            'donor_name' => 'H. Ahmad Syahid',
            'amount' => 150000,
            'payment_method' => 'qris',
            'status' => 'verified',
            'is_anonymous' => true,
            'prayer_message' => 'Semoga Palestina merdeka dan berkah',
        ]);

        $this->assertNotNull($donation->fresh()->verified_at);

        Event::assertDispatched(DonationStatusUpdated::class, function ($event) use ($donation) {
            return $event->action === 'approved' && $event->donation['id'] === $donation->id;
        });
    }

    public function test_update_status_from_verified_to_rejected_clears_verified_at(): void
    {
        Event::fake();

        $donation = Donation::create([
            'donor_name' => 'Donatur Test',
            'donor_phone' => '08123456789',
            'amount' => 100000,
            'status' => 'verified',
            'verified_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->putJson("/api/admin/donations/{$donation->id}", [
            'donor_name' => 'Donatur Test',
            'amount' => 100000,
            'status' => 'rejected',
        ]);

        $response->assertStatus(200);

        $fresh = $donation->fresh();
        $this->assertEquals('rejected', $fresh->status);
        $this->assertNull($fresh->verified_at);

        Event::assertDispatched(DonationStatusUpdated::class, function ($event) {
            return $event->action === 'rejected';
        });
    }

    public function test_update_commitment_requires_phone_number(): void
    {
        $donation = Donation::create([
            'donor_name' => 'Bapak Komitmen',
            'donor_phone' => '08123456789',
            'amount' => 200000,
            'status' => 'pending',
            'is_commitment' => false,
        ]);

        $response = $this->actingAs($this->admin)->putJson("/api/admin/donations/{$donation->id}", [
            'donor_name' => 'Bapak Komitmen',
            'amount' => 200000,
            'is_commitment' => true,
            'donor_phone' => '',
            'status' => 'pending',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['donor_phone']);
    }

    public function test_admin_can_delete_single_donation(): void
    {
        Event::fake();

        $donation = Donation::create([
            'donor_name' => 'Hapus Saya',
            'donor_phone' => '08123456789',
            'amount' => 75000,
            'status' => 'verified',
            'verified_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->deleteJson("/api/admin/donations/{$donation->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Donasi berhasil dihapus.',
            ]);

        $this->assertDatabaseMissing('donations', [
            'id' => $donation->id,
        ]);

        Event::assertDispatched(DonationStatusUpdated::class, function ($event) use ($donation) {
            return $event->action === 'rejected' && $event->donation['id'] === $donation->id;
        });
    }

    public function test_imported_files_summary_lists_distinct_source_files(): void
    {
        Donation::create([
            'donor_name' => 'Donatur QRIS 1',
            'donor_phone' => 'QRIS-MERCHANT',
            'amount' => 50000,
            'status' => 'verified',
            'source_file' => 'Laporan_QRIS_15Okt.pdf',
        ]);
        Donation::create([
            'donor_name' => 'Donatur QRIS 2',
            'donor_phone' => 'QRIS-MERCHANT',
            'amount' => 75000,
            'status' => 'verified',
            'source_file' => 'Laporan_QRIS_15Okt.pdf',
        ]);
        Donation::create([
            'donor_name' => 'Donatur Excel',
            'donor_phone' => 'IMPORT-EXCEL',
            'amount' => 200000,
            'status' => 'verified',
            'source_file' => 'Data_Konser_16Okt.xlsx',
        ]);
        $response = $this->actingAs($this->admin)->getJson('/api/admin/donations/imported-files');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $files = $response->json('files');
        $this->assertCount(2, $files);

        $qrisEntry = collect($files)->firstWhere('sourceFile', 'Laporan_QRIS_15Okt.pdf');
        $this->assertNotNull($qrisEntry);
        $this->assertEquals(2, $qrisEntry['totalRecords']);
        $this->assertEquals(125000, $qrisEntry['totalAmount']);
    }

    public function test_admin_can_rollback_all_donations_from_source_file(): void
    {
        Event::fake();

        // 3 donasi dari file yang salah tarik
        Donation::create([
            'donor_name' => 'Salah 1',
            'donor_phone' => 'QRIS-MERCHANT',
            'amount' => 100000,
            'status' => 'verified',
            'source_file' => 'PDF_Salah_Tarik.pdf',
        ]);
        Donation::create([
            'donor_name' => 'Salah 2',
            'donor_phone' => 'QRIS-MERCHANT',
            'amount' => 150000,
            'status' => 'verified',
            'source_file' => 'PDF_Salah_Tarik.pdf',
        ]);
        Donation::create([
            'donor_name' => 'Salah 3',
            'donor_phone' => 'QRIS-MERCHANT',
            'amount' => 50000,
            'status' => 'pending',
            'source_file' => 'PDF_Salah_Tarik.pdf',
        ]);

        // 1 donasi dari file yang benar (tidak boleh ikut terhapus)
        Donation::create([
            'donor_name' => 'Benar 1',
            'donor_phone' => 'QRIS-MERCHANT',
            'amount' => 500000,
            'status' => 'verified',
            'source_file' => 'File_Benar.pdf',
        ]);
        $response = $this->actingAs($this->admin)->postJson('/api/admin/donations/rollback-file', [
            'source_file' => 'PDF_Salah_Tarik.pdf',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'deleted_count' => 3,
            ]);

        // Pastikan ke-3 donasi dari file salah sudah terhapus
        $this->assertEquals(0, Donation::where('source_file', 'PDF_Salah_Tarik.pdf')->count());

        // Pastikan file yang benar tetap ada
        $this->assertEquals(1, Donation::where('source_file', 'File_Benar.pdf')->count());

        // Event status updated harus di-dispatch
        Event::assertDispatched(DonationStatusUpdated::class);
    }
}
