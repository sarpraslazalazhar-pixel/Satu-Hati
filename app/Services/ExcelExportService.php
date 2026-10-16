<?php

namespace App\Services;

use Symfony\Component\HttpFoundation\BinaryFileResponse;
use ZipArchive;

/**
 * Penulis file .xlsx (Excel 2007+) tanpa dependency eksternal.
 *
 * .xlsx = ZIP berisi XML (OOXML). Cukup ZipArchive; string ditulis sebagai
 * inlineStr agar tidak perlu tabel sharedStrings.
 * ponytail: satu sheet, tanpa styling/format angka, tanpa formula.
 */
class ExcelExportService
{
    /** Baris yang ditulis ke sheet. */
    private array $rows = [];

    private string $sheetName = 'Sheet1';

    /**
     * @param  array<int, string>  $headers
     * @param  array<int, array<int, mixed>>  $rows
     */
    public function __construct(private array $headers = [], array $rows = [])
    {
        $this->rows = $rows;
    }

    public function setSheetName(string $name): static
    {
        // Excel membatasi 31 karakter & melarang karakter tertentu.
        $name = preg_replace('/[\\\\\/\?\*\[\]:]/', '', $name) ?? $name;

        $this->sheetName = mb_substr($name, 0, 31) ?: 'Sheet1';

        return $this;
    }

    /**
     * @param  array<int, array<int, mixed>>  $rows
     */
    public function addRows(array $rows): static
    {
        foreach ($rows as $row) {
            $this->rows[] = $row;
        }

        return $this;
    }

    public function download(string $filename): BinaryFileResponse
    {
        $path = $this->writeToTempFile();

        return response()->download($path, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function writeToTempFile(): string
    {
        $path = tempnam(sys_get_temp_dir(), 'xlsx').'.xlsx';

        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', $this->contentTypes());
        $zip->addFromString('_rels/.rels', $this->rootRels());
        $zip->addFromString('xl/workbook.xml', $this->workbook());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->workbookRels());
        $zip->addFromString('xl/worksheets/sheet1.xml', $this->sheet());
        $zip->close();

        return $path;
    }

    private function contentTypes(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'</Types>';
    }

    private function rootRels(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>';
    }

    private function workbook(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets><sheet name="'.$this->escape($this->sheetName).'" sheetId="1" r:id="rId1"/></sheets>'
            .'</workbook>';
    }

    private function workbookRels(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'</Relationships>';
    }

    private function sheet(): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<sheetData>';

        $allRows = $this->headers !== []
            ? array_merge([$this->headers], $this->rows)
            : $this->rows;

        $rowNumber = 1;
        foreach ($allRows as $row) {
            $xml .= $this->rowXml($rowNumber, $row);
            $rowNumber++;
        }

        return $xml.'</sheetData></worksheet>';
    }

    /**
     * @param  array<int, mixed>  $row
     */
    private function rowXml(int $rowNumber, array $row): string
    {
        $xml = '<row r="'.$rowNumber.'">';
        $colIndex = 0;

        foreach ($row as $value) {
            $ref = $this->columnLetter($colIndex).$rowNumber;

            if (is_int($value) || is_float($value)) {
                $xml .= '<c r="'.$ref.'"><v>'.$value.'</v></c>';
            } elseif ($value !== null && $value !== '') {
                $xml .= '<c r="'.$ref.'" t="inlineStr"><is><t xml:space="preserve">'.$this->escape((string) $value).'</t></is></c>';
            }

            $colIndex++;
        }

        return $xml.'</row>';
    }

    private function columnLetter(int $index): string
    {
        $letters = '';
        $index++;
        while ($index > 0) {
            $index--;
            $letters = chr(65 + ($index % 26)).$letters;
            $index = intdiv($index, 26);
        }

        return $letters;
    }

    private function escape(string $value): string
    {
        // Buang karakter kontrol yang ilegal di XML 1.0.
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $value) ?? $value;

        return htmlspecialchars($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
}
