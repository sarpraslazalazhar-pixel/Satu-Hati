<?php

namespace App\Services;

use Illuminate\Support\Carbon;

/**
 * Pembaca file .xlsx (Excel 2007+) tanpa dependency eksternal.
 *
 * .xlsx adalah arsip ZIP berisi XML (OOXML). Cukup ZipArchive + SimpleXML.
 * ponytail: hanya baca sheet pertama, nilai sel (inline/shared string/number/date),
 * tanpa formula engine & tanpa styling. Kalau butuh multi-sheet/rumus, ganti ke
 * PhpSpreadsheet.
 */
class ExcelImportService
{
    /** Kolom yang dikenali (lowercase, tanpa spasi/underscore). */
    private const FIELD_ALIASES = [
        'nama' => 'name',
        'namadonatur' => 'name',
        'donatur' => 'name',
        'donorname' => 'name',
        'name' => 'name',

        'nominal' => 'amount',
        'jumlah' => 'amount',
        'amount' => 'amount',
        'nilai' => 'amount',
        'total' => 'amount',
        'nominalrp' => 'amount',

        'status' => 'status',
        'metode' => 'method',
        'metodepembayaran' => 'method',
        'metodebayar' => 'method',
        'paymentmethod' => 'method',
        'channel' => 'method',

        'tanggal' => 'date',
        'tanggaltransaksi' => 'date',
        'date' => 'date',
        'waktu' => 'date',

        'ref' => 'ref',
        'referensi' => 'ref',
        'noreferensi' => 'ref',
        'noref' => 'ref',
        'referenceno' => 'ref',
        'reference' => 'ref',
        'idtransaksi' => 'ref',
        'transactionid' => 'ref',

        'pesan' => 'message',
        'doa' => 'message',
        'catatan' => 'message',
        'keterangan' => 'message',
        'message' => 'message',
        'pesandoa' => 'message',
    ];

    private const HEADER_SCAN_ROWS = 10;

    /**
     * @return array{headers: array<int,string>, rows: array<int, array<int, mixed>>, sheet: string}
     */
    public function read(string $path): array
    {
        $zip = new \ZipArchive;
        if ($zip->open($path) !== true) {
            throw new \RuntimeException('File bukan arsip .xlsx yang valid.');
        }

        $sharedStrings = $this->readSharedStrings($zip);
        $sheetPath = $this->firstSheetPath($zip);
        $sheetName = $this->sheetName($zip, $sheetPath);
        $xml = $zip->getFromName($sheetPath);
        $zip->close();

        if ($xml === false) {
            throw new \RuntimeException('Sheet tidak dapat dibaca dari file .xlsx.');
        }

        $rows = $this->parseSheet($xml, $sharedStrings);
        [$headers, $dataRows] = $this->splitHeader($rows);

        return ['headers' => $headers, 'rows' => $dataRows, 'sheet' => $sheetName];
    }

    /**
     * Deteksi baris header (baris pertama yang paling banyak cocok alias)
     * dalam HEADER_SCAN_ROWS baris awal, lalu map data di bawahnya.
     *
     * @return array{0: array<int,array{index:int,label:string,field:?string}>, 1: array<int,array<int,mixed>>}
     */
    private function splitHeader(array $rows): array
    {
        $bestIndex = 0;
        $bestScore = -1;

        foreach (array_slice($rows, 0, self::HEADER_SCAN_ROWS, true) as $rowIndex => $row) {
            $score = 0;
            foreach ($row as $cell) {
                if ($this->matchField((string) $cell['value']) !== null) {
                    $score++;
                }
            }
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestIndex = $rowIndex;
            }
        }

        $headerRow = $rows[$bestIndex] ?? [];
        $headers = [];
        foreach ($headerRow as $cell) {
            $label = trim((string) $cell['value']);
            $headers[$cell['col']] = [
                'index' => $cell['col'],
                'label' => $label,
                'field' => $this->matchField($label),
            ];
        }

        $dataRows = [];
        foreach (array_slice($rows, $bestIndex + 1, null, true) as $row) {
            $values = [];
            foreach ($row as $cell) {
                $values[$cell['col']] = $cell['value'];
            }
            if (collect($values)->every(fn ($v) => trim((string) $v) === '')) {
                continue;
            }
            $dataRows[] = $values;
        }

        return [array_values($headers), $dataRows];
    }

    private function matchField(string $label): ?string
    {
        $key = strtolower(preg_replace('/[^a-z0-9]/i', '', $label) ?? '');
        if ($key === '') {
            return null;
        }

        return self::FIELD_ALIASES[$key] ?? null;
    }

    /**
     * @return array<int, string>
     */
    private function readSharedStrings(\ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');
        if ($xml === false) {
            return [];
        }

        $strings = [];
        $doc = @simplexml_load_string($xml);
        if ($doc === false) {
            return [];
        }

        foreach ($doc->si as $si) {
            // Gabungkan seluruh <t> di dalam <si> (mendukung rich text <r><t>).
            $text = '';
            foreach ($si->xpath('.//*[local-name()="t"]') ?: [] as $t) {
                $text .= (string) $t;
            }
            $strings[] = $text;
        }

        return $strings;
    }

    private function firstSheetPath(\ZipArchive $zip): string
    {
        $workbook = $zip->getFromName('xl/workbook.xml');
        $rels = $zip->getFromName('xl/_rels/workbook.xml.rels');

        if ($workbook !== false && $rels !== false) {
            $wb = @simplexml_load_string($workbook);
            $relDoc = @simplexml_load_string($rels);
            if ($wb !== false && $relDoc !== false) {
                $relsNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
                $first = $wb->sheets->sheet[0] ?? null;
                if ($first !== null) {
                    $rid = (string) ($first->attributes($relsNs)['id'] ?? '');
                    foreach ($relDoc->Relationship as $rel) {
                        if ((string) $rel['Id'] === $rid) {
                            $target = ltrim((string) $rel['Target'], '/');
                            if (! str_starts_with($target, 'xl/')) {
                                $target = 'xl/'.$target;
                            }

                            return $target;
                        }
                    }
                }
            }
        }

        return 'xl/worksheets/sheet1.xml';
    }

    private function sheetName(\ZipArchive $zip, string $path): string
    {
        $workbook = $zip->getFromName('xl/workbook.xml');
        if ($workbook !== false) {
            $wb = @simplexml_load_string($workbook);
            if ($wb !== false && isset($wb->sheets->sheet[0])) {
                return (string) $wb->sheets->sheet[0]['name'];
            }
        }

        return 'Sheet1';
    }

    /**
     * @return array<int, array<int, array{col:int, value:mixed}>>
     */
    private function parseSheet(string $xml, array $sharedStrings): array
    {
        $doc = @simplexml_load_string($xml);
        if ($doc === false) {
            return [];
        }

        $rows = [];
        $rowIndex = 0;

        foreach ($doc->sheetData->row as $row) {
            $cells = [];
            foreach ($row->c as $c) {
                $ref = (string) $c['r'];
                $col = $this->columnIndex($ref);
                $type = (string) $c['t'];

                if ($type === 'inlineStr') {
                    $value = '';
                    foreach ($c->is->xpath('.//*[local-name()="t"]') ?: [] as $t) {
                        $value .= (string) $t;
                    }
                } else {
                    $raw = (string) $c->v;
                    $value = match ($type) {
                        's' => $sharedStrings[(int) $raw] ?? '',
                        'b' => $raw === '1' ? 'TRUE' : 'FALSE',
                        default => $raw,
                    };
                }

                $cells[] = ['col' => $col, 'value' => $this->normalizeValue($value)];
            }

            $rows[$rowIndex++] = $cells;
        }

        return $rows;
    }

    private function normalizeValue(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $trimmed = trim($value);
        // Buang apostrof escape Excel di awal string.
        if (str_starts_with($trimmed, "'")) {
            $trimmed = substr($trimmed, 1);
        }

        return $trimmed;
    }

    /**
     * Konversi "B12" / "AA3" menjadi indeks kolom 0-based (A=0).
     */
    private function columnIndex(string $ref): int
    {
        if (! preg_match('/^([A-Z]+)/i', $ref, $m)) {
            return 0;
        }

        $letters = strtoupper($m[1]);
        $index = 0;
        for ($i = 0, $len = strlen($letters); $i < $len; $i++) {
            $index = $index * 26 + (ord($letters[$i]) - 64);
        }

        return $index - 1;
    }

    /**
     * Ubah nomor seri tanggal Excel (1900 date system) menjadi string tanggal.
     */
    public static function excelSerialToDate(float $serial): ?string
    {
        if ($serial < 1) {
            return null;
        }
        // Excel menganggap 1900-02-29 ada (bug historis) -> geser 1 hari untuk serial >= 60.
        $days = (int) floor($serial);
        if ($days >= 60) {
            $days--;
        }

        return Carbon::create(1899, 12, 31)->addDays($days)->format('Y-m-d');
    }

    /**
     * Parse nominal dari teks bebas: "1.500.000", "Rp 750.000", "1,500,000.50".
     * Mengembalikan null bila tidak ada digit yang bisa dibaca.
     */
    public static function parseAmount(?string $raw): ?int
    {
        if ($raw === null) {
            return null;
        }

        $clean = preg_replace('/[^0-9,.\-]/', '', $raw);
        if ($clean === '' || $clean === null) {
            return null;
        }

        $hasComma = str_contains($clean, ',');
        $hasDot = str_contains($clean, '.');

        if ($hasComma && $hasDot) {
            // Pemisah paling akhir = desimal.
            if (strrpos($clean, ',') > strrpos($clean, '.')) {
                $clean = str_replace('.', '', $clean);
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasComma) {
            // Hanya koma: "1,500" (ribuan) vs "1,5" (desimal).
            $clean = preg_match('/,\d{3}(?:\D|$)/', $clean)
                ? str_replace(',', '', $clean)
                : str_replace(',', '.', $clean);
        } elseif ($hasDot) {
            // Hanya titik: "1.500.000" (ribuan) vs "1.5" (desimal).
            if (preg_match('/\.\d{3}(?:\.|$)/', $clean) || substr_count($clean, '.') > 1) {
                $clean = str_replace('.', '', $clean);
            }
        }

        return (int) round((float) $clean);
    }

    /**
     * Normalisasi tanggal bebas menjadi Y-m-d; null bila tidak valid.
     */
    public static function parseDate(?string $raw): ?string
    {
        if ($raw === null || trim($raw) === '') {
            return null;
        }

        $raw = trim($raw);

        // Nomor seri tanggal Excel (mis. 45678).
        if (preg_match('/^\d{5}(\.\d+)?$/', $raw)) {
            return self::excelSerialToDate((float) $raw);
        }

        // Nama bulan Indonesia -> Inggris agar bisa di-parse.
        $raw = str_ireplace(
            ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember', 'agu', 'okt', 'des', 'peb', 'nop'],
            ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Aug', 'Oct', 'Dec', 'Feb', 'Nov'],
            $raw
        );

        foreach (['d/m/Y H:i', 'd/m/Y', 'd-m-Y H:i', 'd-m-Y', 'Y-m-d H:i', 'Y-m-d', 'd M Y', 'd M Y H:i'] as $format) {
            try {
                $date = Carbon::createFromFormat('!'.$format, $raw);
            } catch (\Throwable) {
                continue;
            }

            $errors = Carbon::getLastErrors();
            // Tolak tanggal meluber (31/02 -> bukan 03/03).
            if ($errors === false || (($errors['warning_count'] ?? 0) === 0 && ($errors['error_count'] ?? 0) === 0)) {
                return $date->format('Y-m-d');
            }
        }

        try {
            return Carbon::parse($raw)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }
}
