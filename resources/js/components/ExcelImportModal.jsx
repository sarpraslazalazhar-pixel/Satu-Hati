import React, { useState, useRef } from 'react';
import {
  X, Upload, FileSpreadsheet, Check, Search, Trash2, Loader2,
  AlertTriangle, CheckCircle2, Table2
} from 'lucide-react';
import { useDonation } from '../context/DonationContext';

const STATUS_OPTIONS = [
  { value: 'verified', label: 'Verified', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { value: 'pending', label: 'Pending', cls: 'bg-amber-100 text-amber-900 border-amber-300' },
  { value: 'rejected', label: 'Ditolak', cls: 'bg-red-100 text-red-900 border-red-300' }
];
const METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'qris', label: 'QRIS' },
  { value: 'transfer', label: 'Transfer' }
];

export default function ExcelImportModal({ isOpen, onClose }) {
  const { parseExcel, importExcelBatch } = useDonation();

  const [file, setFile] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload' | 'review' | 'success'
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [items, setItems] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [sheetName, setSheetName] = useState('');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);

  const selectedItems = items.filter((it) => it.selected);
  const selectedTotal = selectedItems.reduce((acc, it) => acc + (it.amount || 0), 0);
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const duplicateCount = items.filter((it) => it.is_duplicate).length;

  const filteredItems = items.filter((it) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (it.name || '').toLowerCase().includes(q) ||
      (it.ref || '').toLowerCase().includes(q) ||
      (it.method || '').toLowerCase().includes(q) ||
      (it.status || '').toLowerCase().includes(q) ||
      (it.date || '').toLowerCase().includes(q)
    );
  });

  const reset = () => {
    setFile(null);
    setItems([]);
    setHeaders([]);
    setSheetName('');
    setSearch('');
    setResult(null);
    setErrorMsg('');
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    const ok = /\.(xlsx|xlsm)$/i.test(picked.name);
    if (!ok) {
      setErrorMsg('Format harus .xlsx (Excel 2007+). Simpan ulang file .xls ke .xlsx.');
      return;
    }
    setFile(picked);
    setErrorMsg('');
  };

  const handleParse = async () => {
    if (!file) {
      setErrorMsg('Pilih file Excel terlebih dahulu.');
      return;
    }
    setIsParsing(true);
    setErrorMsg('');

    const res = await parseExcel(file);
    setIsParsing(false);

    if (res.success) {
      setItems(res.items || []);
      setHeaders(res.headers || []);
      setSheetName(res.sheet || '');
      setStep('review');
    } else {
      setErrorMsg(res.message || 'Gagal memproses file Excel.');
    }
  };

  const toggleRow = (index) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, selected: !it.selected } : it)));

  const toggleAll = (checked) => setItems((prev) => prev.map((it) => ({ ...it, selected: checked })));

  const updateRow = (index, patch) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const removeRow = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleImport = async () => {
    if (selectedItems.length === 0) {
      setErrorMsg('Pilih minimal satu baris untuk diimpor.');
      return;
    }
    setIsImporting(true);
    setErrorMsg('');

    const res = await importExcelBatch(selectedItems);
    setIsImporting(false);

    if (res.success) {
      setResult(res);
      setStep('success');
    } else {
      setErrorMsg(res.message || 'Gagal mengimpor data Excel.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#1C140E]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF7F2] border-2 border-[#D88A3E]/40 rounded-3xl p-5 sm:p-6 w-full max-w-5xl shadow-2xl my-6 text-[#1C140E] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8DDCD] mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#C66723] text-white flex items-center justify-center shadow-2xs">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-poster font-black text-xl sm:text-2xl text-[#1C140E] leading-none">
                IMPOR DATA EXCEL
              </h3>
              <p className="text-xs text-[#7A6855] font-semibold mt-0.5">
                Rekap donasi dari file .xlsx • Kolom: Nama, Nominal, Status, Metode, Tanggal, Ref
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full border border-[#D5BEA1] flex items-center justify-center hover:bg-amber-50 cursor-pointer text-[#7A6855] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold rounded-xl p-2.5 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="flex flex-col gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D5BEA1] hover:border-[#C66723] rounded-2xl p-8 text-center cursor-pointer bg-white/70 hover:bg-[#FAF6F0] transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFile}
                className="hidden"
              />
              <FileSpreadsheet className="w-10 h-10 text-[#C66723] mx-auto mb-2" />
              {file ? (
                <div>
                  <span className="text-sm font-poster font-bold text-[#C66723] block">{file.name}</span>
                  <span className="text-[11px] text-[#7A6855]">Klik untuk ganti file</span>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-poster font-bold text-[#1C140E] block">Pilih file Excel (.xlsx)</span>
                  <span className="text-[11px] text-[#7A6855]">Maks 20 MB • hanya sheet pertama</span>
                </div>
              )}
            </div>

            <div className="bg-white/80 border border-[#E5DAC8] rounded-2xl p-3.5 text-[11px] text-[#1C140E] leading-relaxed">
              <span className="font-poster font-bold text-[#C66723] block mb-1">Susunan kolom yang dikenali</span>
              <span className="font-mono block text-[#7A6855]">Nama · Nominal · Status · Metode · Tanggal · Ref · Pesan</span>
              Status: <span className="font-bold">verified</span> / <span className="font-bold">pending</span> (komitmen) / <span className="font-bold">ditolak</span>.
              {' '}Metode: <span className="font-bold">cash</span> / <span className="font-bold">qris</span> / <span className="font-bold">transfer</span>.
              Urutan kolom bebas; baris judul dicari otomatis.
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleParse}
                disabled={isParsing || !file}
                className="px-5 py-2.5 bg-[#C66723] hover:bg-[#b0581a] text-white font-poster font-bold rounded-xl text-xs shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Membaca file...
                  </>
                ) : (
                  <>
                    <Table2 className="w-3.5 h-3.5" /> Baca &amp; Pratinjau
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW */}
        {step === 'review' && (
          <div className="flex flex-col min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3 shrink-0">
              <div className="border border-[#E5DAC8] rounded-xl p-2.5 bg-white/90 shadow-2xs">
                <span className="text-[10px] font-bold text-[#7A6855] uppercase block">Sheet</span>
                <span className="text-xs font-poster font-bold text-[#C66723] truncate block">{sheetName || '-'}</span>
              </div>
              <div className="border border-[#E5DAC8] rounded-xl p-2.5 bg-white/90 shadow-2xs">
                <span className="text-[10px] font-bold text-[#7A6855] uppercase block">Terbaca</span>
                <span className="text-sm font-poster font-black text-[#1C140E]">{items.length} baris</span>
              </div>
              <div className="border border-[#E5DAC8] rounded-xl p-2.5 bg-white/90 shadow-2xs">
                <span className="text-[10px] font-bold text-[#7A6855] uppercase block">Duplikat Ref</span>
                <span className="text-sm font-poster font-black text-amber-600">{duplicateCount}</span>
              </div>
              <div className="border border-[#E5DAC8] rounded-xl p-2.5 bg-white/90 shadow-2xs">
                <span className="text-[10px] font-bold text-[#7A6855] uppercase block">Terpilih</span>
                <span className="text-sm font-poster font-black text-[#C66723]">{formatRupiah(selectedTotal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#7A6855]" />
                <input
                  placeholder="Cari nama / ref / metode / tanggal..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 sm:py-1.5 border border-[#D5BEA1] rounded-xl text-base sm:text-xs font-semibold outline-none focus:border-[#C66723] bg-white text-stone-900"
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs sm:text-[11px] font-bold cursor-pointer px-3 py-2.5 sm:px-2.5 sm:py-1.5 border border-[#D5BEA1] rounded-xl bg-white text-[#7A6855]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#C66723] cursor-pointer"
                />
                Pilih semua
              </label>
            </div>

            <div className="overflow-auto border border-[#E5DAC8] rounded-2xl min-h-0 flex-1 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#FAF6F0] sticky top-0 z-10 border-b border-[#E8DDCD]">
                  <tr className="font-bold text-[10px] uppercase text-[#1C140E]">
                    <th className="p-2 w-8 text-center border-b border-[#E8DDCD]">✓</th>
                    <th className="p-2 w-8 text-center border-b border-[#E8DDCD]">#</th>
                    <th className="p-2 border-b border-[#E8DDCD]">Nama</th>
                    <th className="p-2 text-right border-b border-[#E8DDCD]">Nominal</th>
                    <th className="p-2 border-b border-[#E8DDCD]">Status</th>
                    <th className="p-2 border-b border-[#E8DDCD]">Metode</th>
                    <th className="p-2 border-b border-[#E8DDCD]">Tanggal</th>
                    <th className="p-2 border-b border-[#E8DDCD]">Ref</th>
                    <th className="p-2 w-8 border-b border-[#E8DDCD]"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-gray-500 font-bold">
                      </td>
                    </tr>
                  )}
                  {filteredItems.map((it) => {
                    const realIndex = items.indexOf(it);
                    const statusCls = STATUS_OPTIONS.find((s) => s.value === it.status)?.cls || 'bg-white';
                    return (
                      <tr
                        key={realIndex}
                        className={`border-b border-[#E8DDCD] ${it.is_duplicate ? 'bg-amber-50/60' : 'hover:bg-amber-50/30'}`}
                      >
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={it.selected}
                            onChange={() => toggleRow(realIndex)}
                            className="w-3.5 h-3.5 accent-[#C66723] cursor-pointer"
                          />
                        </td>
                        <td className="p-2 text-center font-mono text-[10px] text-[#7A6855]">{it.no}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={it.name || ''}
                            onChange={(e) => updateRow(realIndex, { name: e.target.value })}
                            className="w-full min-w-[140px] px-1.5 py-1 border border-[#D5BEA1] rounded-md text-xs font-bold outline-none focus:border-[#C66723] bg-white text-stone-900"
                          />
                          {it.is_duplicate && (
                            <span className="text-[9px] font-bold text-amber-700 flex items-center gap-0.5 mt-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Ref sudah ada di database
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          <span className="font-poster font-black text-[#C66723] whitespace-nowrap">
                            {formatRupiah(it.amount)}
                          </span>
                        </td>
                        <td className="p-2">
                          <select
                            value={it.status}
                            onChange={(e) => updateRow(realIndex, { status: e.target.value })}
                            className={`px-1.5 py-1 rounded-md border text-[10px] font-bold cursor-pointer outline-none ${statusCls}`}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            value={it.method}
                            onChange={(e) => updateRow(realIndex, { method: e.target.value })}
                            className="px-1.5 py-1 rounded-md border border-[#D5BEA1] text-[10px] font-bold bg-white text-stone-800 cursor-pointer outline-none focus:border-[#C66723]"
                          >
                            {METHOD_OPTIONS.map((m) => (
                              <option key={m.value} value={m.value}>
                                {m.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 font-mono text-[10px] text-stone-700 whitespace-nowrap">
                          {it.date || <span className="text-[#7A6855] italic">hari ini</span>}
                        </td>
                        <td className="p-2 font-mono text-[10px] text-[#7A6855] max-w-[120px] truncate" title={it.ref || ''}>
                          {it.ref || '-'}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => removeRow(realIndex)}
                            className="text-red-600 hover:bg-red-50 rounded-md p-1 cursor-pointer"
                            title="Hapus baris ini dari impor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pt-3 mt-1 border-t border-[#E8DDCD] shrink-0">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-3 sm:py-2 border border-[#D5BEA1] bg-white hover:bg-amber-50/50 rounded-xl text-sm sm:text-xs font-bold text-[#7A6855] cursor-pointer"
              >
                ← Ganti File
              </button>
              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-xs sm:text-[11px] font-bold text-[#7A6855]">
                  {selectedItems.length} baris • {formatRupiah(selectedTotal)}
                </span>
                <button
                  onClick={handleImport}
                  disabled={isImporting || selectedItems.length === 0}
                  className="px-5 py-3 sm:py-2.5 bg-[#C66723] hover:bg-[#b0581a] text-white font-poster font-bold rounded-xl text-sm sm:text-xs shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Impor {selectedItems.length} Baris
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && result && (
          <div className="text-center py-6">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
            <h4 className="font-poster font-black text-2xl text-[#C66723] mb-1">Impor Berhasil</h4>
            <p className="text-xs text-[#7A6855] font-semibold mb-4">{result.message}</p>
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-5">
              <div className="border border-[#E5DAC8] rounded-xl p-2.5 bg-white/90">
                <span className="text-[10px] font-bold text-[#7A6855] uppercase block">Diimpor</span>
                <span className="text-lg font-poster font-black text-emerald-700">{result.imported_count}</span>
              </div>
              <div className="border border-[#E5DAC8] rounded-xl p-2.5 bg-white/90">
                <span className="text-[10px] font-bold text-[#7A6855] uppercase block">Dilewati</span>
                <span className="text-lg font-poster font-black text-amber-600">{result.skipped_count}</span>
              </div>
              <div className="border border-[#E5DAC8] rounded-xl p-2.5 bg-white/90">
                <span className="text-[10px] font-bold text-[#7A6855] uppercase block">Total</span>
                <span className="text-sm font-poster font-black text-[#C66723]">{formatRupiah(result.total_imported_amount)}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={reset}
                className="px-4 py-2.5 border border-[#D5BEA1] bg-white hover:bg-amber-50/50 rounded-xl text-xs font-bold text-[#7A6855] cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Impor File Lain
              </button>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-[#C66723] hover:bg-[#b0581a] text-white font-poster font-bold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
