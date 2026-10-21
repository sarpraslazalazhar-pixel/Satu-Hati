<?php

namespace Tests\Feature;

use App\Models\Donation;
use App\Models\User;
use App\Services\ExcelImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;
use ZipArchive;

class ExcelImportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['email' => 'admin@zecrus.test']);
    }

    /**
     * Bangun .xlsx minimal (OOXML) berisi header + baris data.
     *
     * @param  array<int, array<int, string>>  $rows
     */
    private function makeXlsx(array $rows): string
    {
        $strings = [];
        foreach ($rows as $row) {
            foreach ($row as $cell) {
                $strings[] = (string) $cell;
            }
        }

        $sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
        $index = 0;
        foreach ($rows as $r => $row) {
            $sheet .= '<row r="'.($r + 1).'">';
            foreach ($row as $c => $cell) {
                $col = chr(65 + $c);
                $sheet .= '<c r="'.$col.($r + 1).'" t="s"><v>'.$index.'</v></c>';
                $index++;
            }
            $sheet .= '</row>';
        }
        $sheet .= '</sheetData></worksheet>';

        $shared = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="'.count($strings).'" uniqueCount="'.count($strings).'">'
            .implode('', array_map(fn ($s) => '<si><t>'.$s.'</t></si>', $strings))
            .'</sst>';

        $path = tempnam(sys_get_temp_dir(), 'xlsx').'.xlsx';
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
            .'</Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>');
        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets><sheet name="Rekap" sheetId="1" r:id="rId1"/></sheets></workbook>');
        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>'
            .'</Relationships>');
        $zip->addFromString('xl/sharedStrings.xml', $shared);
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheet);
        $zip->close();

        return $path;
    }

    public function test_amount_parsing_handles_indonesian_and_us_formats(): void
    {
        foreach ([
            '1.500.000' => 1500000,
            'Rp 750.000' => 750000,
            '2500000' => 2500000,
            '300.000' => 300000,
            '1,500,000.50' => 1500001,
            '1.500.000,50' => 1500001,
        ] as $raw => $expected) {
            $this->assertSame(
                $expected,
                ExcelImportService::parseAmount($raw),
                "Nominal '{$raw}' seharusnya {$expected}"
            );
        }
    }

    public function test_date_parsing_rejects_overflow_and_accepts_indonesian_months(): void
    {
        $this->assertSame('2026-10-15', ExcelImportService::parseDate('15/10/2026'));
        $this->assertSame('2026-10-15', ExcelImportService::parseDate('15 Oktober 2026'));
        $this->assertSame('2025-01-21', ExcelImportService::parseDate('45678'));
        // Tanggal meluber harus ditolak, bukan digeser ke bulan berikutnya.
        $this->assertNull(ExcelImportService::parseDate('31/02/2026'));
        $this->assertNull(ExcelImportService::parseDate('2026-13-45'));
        $this->assertNull(ExcelImportService::parseDate('abc'));
        $this->assertNull(ExcelImportService::parseDate(''));
    }

    public function test_header_detected_after_leading_junk_rows(): void
    {
        $path = $this->makeXlsx([
            ['Laporan Donasi Zecrus 11th', '', ''],
            ['Dicetak', '16/10/2026', ''],
            ['Nama Donatur', 'Nominal', 'Status'],
            ['Budi', '1.500.000', 'Paid'],
        ]);

        $parsed = (new ExcelImportService)->read($path);
        @unlink($path);

        $this->assertSame('Rekap', $parsed['sheet']);
        $this->assertSame(['name', 'amount', 'status'], array_column($parsed['headers'], 'field'));
        $this->assertCount(1, $parsed['rows']);
    }

    public function test_parse_endpoint_normalizes_columns_without_error(): void
    {
        $path = $this->makeXlsx([
            ['Nama', 'Nominal', 'Status', 'Metode', 'Tanggal', 'Ref'],
            ['Budi', '1.500.000', 'Paid', 'QRIS', '15/10/2026', 'X-001'],
            ['Siti', 'Rp 750.000', 'Komitmen', 'Cash', '31/02/2026', 'X-002'], // tanggal meluber
            ['Ahmad', 'abc', 'Paid', 'Cash', '2026-10-15', 'X-003'],            // nominal rusak
        ]);

        $response = $this->actingAs($this->admin)->post('/api/admin/donations/parse-excel', [
            'file' => new UploadedFile($path, 'rekap.xlsx', null, null, true),
        ]);

        $response->assertOk()->assertJson([
            'success' => true,
            'total_detected_rows' => 2,
            'total_detected_amount' => 2250000,
        ]);

        $items = $response->json('items');

        $this->assertSame('verified', $items[0]['status']);
        $this->assertSame('qris', $items[0]['method']);
        $this->assertSame('2026-10-15', $items[0]['date']);

        // Komitmen -> pending + is_commitment; tanggal meluber ditolak jadi null, bukan 03/03.
        $this->assertSame('pending', $items[1]['status']);
        $this->assertTrue($items[1]['is_commitment']);
        $this->assertNull($items[1]['date']);
    }

    public function test_import_batch_marks_duplicates_and_stores_rows(): void
    {
        Event::fake();

        Donation::create([
            'donor_name' => 'Existing',
            'donor_phone' => 'QRIS-MERCHANT',
            'amount' => 100000,
            'payment_method' => 'qris',
            'reference_no' => 'X-DUP',
            'status' => 'verified',
        ]);

        $response = $this->actingAs($this->admin)->postJson('/api/admin/donations/import-excel-batch', [
            'items' => [
                ['name' => 'Baru', 'amount' => 250000, 'status' => 'verified', 'method' => 'cash', 'date' => '2026-10-15', 'ref' => 'X-NEW', 'selected' => true],
                ['name' => 'Duplikat', 'amount' => 100000, 'status' => 'verified', 'method' => 'qris', 'ref' => 'X-DUP', 'selected' => true],
            ],
        ]);

        $response->assertOk()->assertJson([
            'success' => true,
            'imported_count' => 1,
            'skipped_count' => 1,
        ]);

        $this->assertDatabaseHas('donations', ['reference_no' => 'X-NEW', 'amount' => 250000, 'donor_phone' => 'IMPORT-EXCEL']);
    }

    public function test_total_amount_is_consistent_across_public_and_admin_endpoints(): void
    {
        Donation::create(['donor_name' => 'A', 'donor_phone' => 'x', 'amount' => 100000, 'status' => 'verified', 'payment_method' => 'qris']);
        Donation::create(['donor_name' => 'B', 'donor_phone' => 'x', 'amount' => 200000, 'status' => 'verified', 'payment_method' => 'cash']);
        // Komitmen aktif: langsung tampil dan masuk total capaian.
        Donation::create(['donor_name' => 'C', 'donor_phone' => 'x', 'amount' => 50000, 'status' => 'pending', 'payment_method' => 'cash', 'is_commitment' => true]);
        // Ditolak: tidak masuk total capaian.
        Donation::create(['donor_name' => 'D', 'donor_phone' => 'x', 'amount' => 90000, 'status' => 'rejected', 'payment_method' => 'qris']);

        $public = $this->getJson('/api/donations')->json('campaign');
        $admin = $this->actingAs($this->admin)->getJson('/api/admin/donations')->json();
        $dbSum = (int) Donation::countedForPublic()->sum('amount');

        $this->assertSame(350000, $public['currentAmount']);
        $this->assertSame($dbSum, $public['currentAmount']);
        $this->assertSame($dbSum, $admin['currentAmount']);
    }
}
