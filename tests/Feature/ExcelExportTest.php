<?php

namespace Tests\Feature;

use App\Models\Donation;
use App\Models\User;
use App\Services\ExcelExportService;
use App\Services\ExcelImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExcelExportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['email' => 'admin@zecrus.test']);
    }

    public function test_export_produces_readable_xlsx_with_all_columns(): void
    {
        Donation::create([
            'donor_name' => 'Budi Santoso',
            'donor_phone' => '08123456789',
            'amount' => 1500000,
            'payment_method' => 'qris',
            'reference_no' => 'REF-001',
            'status' => 'verified',
            'donated_at' => '2026-10-15 10:00:00',
            'verified_at' => '2026-10-15 10:05:00',
            'prayer_message' => 'Semoga berkah',
        ]);

        Donation::create([
            'donor_name' => 'Siti Aminah',
            'donor_phone' => '0812',
            'amount' => 750000,
            'payment_method' => 'cash',
            'is_commitment' => true,
            'status' => 'pending',
        ]);

        $path = (new ExcelExportService(
            ['Nama', 'Nominal', 'Status'],
            [['Uji', 1000, 'verified']]
        ))->setSheetName('Rekap')->writeToTempFile();

        $parsed = (new ExcelImportService)->read($path);
        @unlink($path);

        $this->assertSame('Rekap', $parsed['sheet']);
        $this->assertSame(['Nama', 'Nominal', 'Status'], array_column($parsed['headers'], 'label'));
        $this->assertCount(1, $parsed['rows']);
    }

    public function test_export_endpoint_streams_valid_xlsx(): void
    {
        Donation::create([
            'donor_name' => 'Budi Santoso',
            'donor_phone' => '08123456789',
            'amount' => 1500000,
            'payment_method' => 'qris',
            'status' => 'verified',
            'donated_at' => '2026-10-15 10:00:00',
        ]);

        Donation::create([
            'donor_name' => 'Siti Aminah',
            'donor_phone' => '0812',
            'amount' => 750000,
            'payment_method' => 'cash',
            'is_commitment' => true,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)->get('/api/admin/donations/export-excel');

        $response->assertOk();
        $this->assertStringContainsString('spreadsheetml.sheet', $response->headers->get('content-type'));

        $file = $response->baseResponse->getFile()->getPathname();
        $parsed = (new ExcelImportService)->read($file);

        $this->assertSame('Rekap Donasi', $parsed['sheet']);
        $this->assertSame('Nama Donatur', $parsed['headers'][0]['label']);
        // Header + 2 baris data (urut terbaru dulu dari ->latest()).
        $this->assertCount(2, $parsed['rows']);
        // Kolom: 0=Nama, 3=Nominal, 4=Status, 5=Metode.
        $this->assertSame('Siti Aminah', $parsed['rows'][0][0]);
        $this->assertSame('Komitmen - Belum Donasi', $parsed['rows'][0][4]);
        $this->assertSame('Komitmen', $parsed['rows'][0][5]);
        $this->assertSame('Budi Santoso', $parsed['rows'][1][0]);
        $this->assertSame('1500000', $parsed['rows'][1][3]);
        $this->assertSame('Verified', $parsed['rows'][1][4]);
    }
}
