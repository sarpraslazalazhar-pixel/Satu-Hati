<?php

namespace App\Services;

use Symfony\Component\HttpFoundation\BinaryFileResponse;
use ZipArchive;

/**
 * Penulis file .xlsx (Excel 2007+) tanpa dependency eksternal.
 *
 * .xlsx = ZIP berisi XML (OOXML). Cukup ZipArchive; string ditulis sebagai
 * inlineStr agar tidak perlu tabel sharedStrings.
 * ponytail: satu sheet, styling dasar (header + currency), tanpa formula.
 */
class ExcelExportService
{
    /** Baris yang ditulis ke sheet. */
    private array $rows = [];

    private string $sheetName = 'Sheet1';

    /** @var array<int, float|int> */
    private array $columnWidths = [];

    /** @var array<int, int> */
    private array $currencyColumns = [];

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
     * @param  array<int, float|int>  $widths
     */
    public function setColumnWidths(array $widths): static
    {
        $this->columnWidths = array_values($widths);

        return $this;
    }

    /**
     * @param  array<int, int>  $columns
     */
    public function setCurrencyColumns(array $columns): static
    {
        $this->currencyColumns = array_values($columns);

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
        $zip->addFromString('xl/styles.xml', $this->styles());
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
            .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
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
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            .'</Relationships>';
    }

    private function styles(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<fonts count="2">'
            .'<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>'
            .'<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font>'
            .'</fonts>'
            .'<fills count="3">'
            .'<fill><patternFill patternType="none"/></fill>'
            .'<fill><patternFill patternType="gray125"/></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FFF5EDDF"/><bgColor indexed="64"/></patternFill></fill>'
            .'</fills>'
            .'<borders count="2">'
            .'<border><left/><right/><top/><bottom/><diagonal/></border>'
            .'<border><left/><right/><top/><bottom style="thin"><color rgb="FFD5BEA1"/></bottom><diagonal/></border>'
            .'</borders>'
            .'<cellStyleXfs count="1">'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>'
            .'</cellStyleXfs>'
            .'<cellXfs count="3">'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            .'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>'
            .'<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>'
            .'</cellXfs>'
            .'<cellStyles count="1">'
            .'<cellStyle name="Normal" xfId="0" builtinId="0"/>'
            .'</cellStyles>'
            .'</styleSheet>';
    }

    private function sheet(): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';

        if ($this->headers !== []) {
            $xml .= '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
        }

        if ($this->columnWidths !== []) {
            $xml .= '<cols>';
            foreach ($this->columnWidths as $idx => $width) {
                $colNum = $idx + 1;
                $xml .= '<col min="'.$colNum.'" max="'.$colNum.'" width="'.$width.'" customWidth="1"/>';
            }
            $xml .= '</cols>';
        }

        $xml .= '<sheetData>';

        $rowNumber = 1;
        if ($this->headers !== []) {
            $xml .= $this->rowXml($rowNumber, $this->headers, 1);
            $rowNumber++;
        }

        foreach ($this->rows as $row) {
            $xml .= $this->rowXml($rowNumber, $row, 0);
            $rowNumber++;
        }

        $xml .= '</sheetData>';

        if ($this->headers !== []) {
            $lastCol = $this->columnLetter(count($this->headers) - 1);
            $rowCount = max(1, $rowNumber - 1);
            $xml .= '<autoFilter ref="A1:'.$lastCol.$rowCount.'"/>';
        }

        $xml .= '</worksheet>';

        return $xml;
    }

    /**
     * @param  array<int, mixed>  $row
     */
    private function rowXml(int $rowNumber, array $row, int $defaultStyle = 0): string
    {
        $xml = '<row r="'.$rowNumber.'">';
        $colIndex = 0;

        foreach ($row as $value) {
            $ref = $this->columnLetter($colIndex).$rowNumber;
            $style = $defaultStyle;

            if ($style === 0 && in_array($colIndex, $this->currencyColumns, true)) {
                $style = 2;
            }

            $sAttr = $style > 0 ? ' s="'.$style.'"' : '';

            if (is_int($value) || is_float($value)) {
                $xml .= '<c r="'.$ref.'"'.$sAttr.'><v>'.$value.'</v></c>';
            } elseif (is_numeric($value) && in_array($colIndex, $this->currencyColumns, true)) {
                $xml .= '<c r="'.$ref.'"'.$sAttr.'><v>'.$value.'</v></c>';
            } elseif ($value !== null && $value !== '') {
                $xml .= '<c r="'.$ref.'"'.$sAttr.' t="inlineStr"><is><t xml:space="preserve">'.$this->escape((string) $value).'</t></is></c>';
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
