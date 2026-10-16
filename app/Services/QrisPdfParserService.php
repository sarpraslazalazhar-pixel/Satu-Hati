<?php

namespace App\Services;

use App\Models\Donation;
use Illuminate\Support\Facades\Process;
use Smalot\PdfParser\Parser;

class QrisPdfParserService
{
    /**
     * Parse laporan transaksi merchant QR Danamon / LAZ Al Azhar dari file PDF.
     *
     * @return array{
     *     success: bool,
     *     total_detected_rows: int,
     *     total_detected_amount: int,
     *     duplicate_count: int,
     *     items: array<int, array{
     *         no: int,
     *         date: ?string,
     *         ref: ?string,
     *         amount: int,
     *         name: string,
     *         is_duplicate: bool
     *     }>
     * }
     */
    public function parse(string $pdfPath): array
    {
        $text = $this->extractText($pdfPath);

        if (empty($text)) {
            return [
                'success' => false,
                'message' => 'Gagal membaca isi dokumen PDF.',
                'total_detected_rows' => 0,
                'total_detected_amount' => 0,
                'duplicate_count' => 0,
                'items' => [],
            ];
        }

        // Split berdasarkan nomor urut baris + tanggal transaksi: e.g. '1 2026-10-09'
        $pattern = '/(?:^|\n)\s*(\d+)\s+(\d{4}-\d{2}-\d{2}[\s\S]*?)(?=(?:\n\s*\d+\s+\d{4}-\d{2}-\d{2})|$)/';
        preg_match_all($pattern, $text, $matches, PREG_SET_ORDER);

        $items = [];
        $totalAmount = 0;
        $refs = [];

        foreach ($matches as $m) {
            $no = (int) $m[1];
            $body = $m[2];

            // 1. Tanggal & Jam
            $date = null;
            if (preg_match('/(\d{4}-\d{2}-\d{2})\s*(\d{2}:\d{2})/', $body, $dm)) {
                $date = $dm[1].' '.$dm[2];
            }

            // 2. Ref No (e.g. MW2610099490997)
            $ref = null;
            if (preg_match('/(MW\w+)/', $body, $rm)) {
                $ref = $rm[1];
                $refs[] = $ref;
            }

            // 3. Amount
            $amount = 0;
            if (preg_match('/([\d.]+),-/', $body, $am)) {
                $amount = (int) str_replace('.', '', $am[1]);
            }

            // 4. Nama Donatur (teks setelah 16-19 digit nomor PAN)
            $name = 'Hamba Allah';
            if (preg_match('/\d{16,19}\s*([^\n\r]+(?:\s+[^\n\r]+)*)/', $body, $nm)) {
                $rawName = trim($nm[1]);
                $cleanName = trim(preg_replace('/\s+/', ' ', $rawName));
                if (! empty($cleanName)) {
                    $name = $cleanName;
                }
            }

            $items[] = [
                'no' => $no,
                'date' => $date,
                'ref' => $ref,
                'amount' => $amount,
                'name' => $name,
                'is_duplicate' => false,
            ];

            $totalAmount += $amount;
        }

        // Cek duplikasi referensi di database
        $existingRefs = ! empty($refs)
            ? Donation::whereIn('reference_no', array_filter($refs))->pluck('reference_no')->all()
            : [];
        $existingLookup = array_flip($existingRefs);

        $duplicateCount = 0;
        foreach ($items as &$item) {
            if ($item['ref'] && isset($existingLookup[$item['ref']])) {
                $item['is_duplicate'] = true;
                $duplicateCount++;
            }
        }
        unset($item);

        return [
            'success' => true,
            'total_detected_rows' => count($items),
            'total_detected_amount' => $totalAmount,
            'duplicate_count' => $duplicateCount,
            'items' => $items,
        ];
    }

    /**
     * Ekstraksi teks dari PDF menggunakan smalot/pdfparser dengan fallback ke pdftotext CLI jika tersedia.
     */
    protected function extractText(string $pdfPath): string
    {
        // 1. Coba smalot/pdfparser terlebih dahulu
        try {
            $parser = new Parser;
            $pdf = $parser->parseFile($pdfPath);
            $text = $pdf->getText();
            if (! empty(trim($text))) {
                return $text;
            }
        } catch (\Throwable $e) {
            // fallback
        }

        // 2. Fallback ke pdftotext CLI
        try {
            $process = Process::run(['pdftotext', '-table', $pdfPath, '-']);
            if ($process->successful()) {
                return $process->output();
            }
        } catch (\Throwable $e) {
            // abaikan
        }

        return '';
    }
}
