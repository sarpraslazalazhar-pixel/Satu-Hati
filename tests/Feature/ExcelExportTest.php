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
        $this->assertStringContainsString('spreadsheetml.sheet', (string) $response->headers->get('content-type'));
        $this->assertStringContainsString('Rekap_Donasi_Satu_Hati_Palestina_', (string) $response->headers->get('content-disposition'));

        $file = $response->baseResponse->getFile()->getPathname();
        $parsed = (new ExcelImportService)->read($file);

        $this->assertSame('Rekap Donasi', $parsed['sheet']);
        $this->assertSame([
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
        ], array_column($parsed['headers'], 'label'));
        $this->assertCount(2, $parsed['rows']);

        // Baris 1: Siti Aminah (terbaru)
        $this->assertSame('1', (string) $parsed['rows'][0][0]);
        $this->assertSame('Siti Aminah', $parsed['rows'][0][1]);
        $this->assertSame('750000', (string) $parsed['rows'][0][4]);
        $this->assertSame('Komitmen - Belum Donasi', $parsed['rows'][0][5]);
        $this->assertSame('Komitmen', $parsed['rows'][0][6]);

        // Baris 2: Budi Santoso
        $this->assertSame('2', (string) $parsed['rows'][1][0]);
        $this->assertSame('Budi Santoso', $parsed['rows'][1][1]);
        $this->assertSame('1500000', (string) $parsed['rows'][1][4]);
        $this->assertSame('Verified', $parsed['rows'][1][5]);
        $this->assertSame('QRIS', $parsed['rows'][1][6]);
    }

    public function test_export_includes_styling_widths_and_autofilter(): void
    {
        $path = (new ExcelExportService(
            ['No', 'Nama', 'Nominal'],
            [[1, 'Budi', 50000]]
        ))
            ->setColumnWidths([5, 20, 15])
            ->setCurrencyColumns([2])
            ->writeToTempFile();

        $zip = new \ZipArchive;
        $this->assertTrue($zip->open($path));

        $stylesXml = $zip->getFromName('xl/styles.xml');
        $this->assertNotFalse($stylesXml);
        $this->assertStringContainsString('FFF5EDDF', $stylesXml);
        $this->assertStringContainsString('FFD5BEA1', $stylesXml);
        $this->assertStringContainsString('numFmtId="3"', $stylesXml);

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $this->assertNotFalse($sheetXml);
        $this->assertStringContainsString('<pane ySplit="1"', $sheetXml);
        $this->assertStringContainsString('state="frozen"', $sheetXml);
        $this->assertStringContainsString('<col min="1" max="1" width="5"', $sheetXml);
        $this->assertStringContainsString('<col min="2" max="2" width="20"', $sheetXml);
        $this->assertStringContainsString('<col min="3" max="3" width="15"', $sheetXml);
        $this->assertStringContainsString('s="1"', $sheetXml); // Header style
        $this->assertStringContainsString('s="2"', $sheetXml); // Currency style
        $this->assertStringContainsString('<autoFilter ref="A1:C2"/>', $sheetXml);

        $zip->close();
        @unlink($path);
    }
}
