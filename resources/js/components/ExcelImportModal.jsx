import React, { useState, useRef } from 'react';
import {
  X, Upload, FileSpreadsheet, Check, Search, Trash2, Loader2,
  AlertTriangle, CheckCircle2, Table2
} from 'lucide-react';
import { useDonation } from '../context/DonationContext';

const STATUS_OPTIONS = [
  { value: 'verified', label: 'Verified', cls: 'bg-lime text-brutal border-brutal' },
  { value: 'pending', label: 'Pending', cls: 'bg-amber-200 text-brutal border-brutal' },
  { value: 'rejected', label: 'Ditolak', cls: 'bg-error text-white border-brutal' }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-[3px] border-brutal rounded-3xl p-5 sm:p-6 w-full max-w-5xl shadow-brutal-lg my-6 text-brutal max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-brutal mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 border-2 border-brutal flex items-center justify-center shadow-brutal-sm">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-xl sm:text-2xl text-forest leading-none">
                IMPOR DATA EXCEL
              </h3>
              <p className="text-xs text-gray-600 font-semibold mt-0.5">
                Rekap donasi dari file .xlsx • Kolom: Nama, Nominal, Status, Metode, Tanggal, Ref
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full border-2 border-brutal flex items-center justify-center hover:bg-gray-100 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 bg-error/10 border-2 border-error text-error text-xs font-bold rounded-xl p-2.5 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="flex flex-col gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-[3px] border-dashed border-stone-400 hover:border-forest rounded-2xl p-8 text-center cursor-pointer bg-stone-50 hover:bg-lime/10 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFile}
                className="hidden"
              />
              <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              {file ? (
                <div>
                  <span className="text-sm font-extrabold text-forest block">{file.name}</span>
                  <span className="text-[11px] text-gray-500">Klik untuk ganti file</span>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-bold text-brutal block">Pilih file Excel (.xlsx)</span>
                  <span className="text-[11px] text-gray-500">Maks 20 MB • hanya sheet pertama</span>
                </div>
              )}
            </div>

            <div className="bg-lime/15 border-2 border-brutal rounded-2xl p-3.5 text-[11px] text-gray-700 leading-relaxed">
              <span className="font-extrabold text-forest block mb-1">Susunan kolom yang dikenali</span>
              <span className="font-mono block">Nama · Nominal · Status · Metode · Tanggal · Ref · Pesan</span>
              Status: <span className="font-bold">verified</span> / <span className="font-bold">pending</span> (komitmen) / <span className="font-bold">ditolak</span>.
              {' '}Metode: <span className="font-bold">cash</span> / <span className="font-bold">qris</span> / <span className="font-bold">transfer</span>.
              Urutan kolom bebas; baris judul dicari otomatis.
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleParse}
                disabled={isParsing || !file}
                className="px-5 py-2.5 bg-forest hover:bg-forest-dark text-white border-2 border-brutal rounded-xl text-xs font-extrabold shadow-brutal-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="border-2 border-brutal rounded-xl p-2.5 bg-stone-50">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Sheet</span>
                <span className="text-xs font-extrabold text-forest truncate block">{sheetName || '-'}</span>
              </div>
              <div className="border-2 border-brutal rounded-xl p-2.5 bg-stone-50">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Terbaca</span>
                <span className="text-sm font-black text-brutal">{items.length} baris</span>
              </div>
              <div className="border-2 border-brutal rounded-xl p-2.5 bg-stone-50">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Duplikat Ref</span>
                <span className="text-sm font-black text-amber-600">{duplicateCount}</span>
              </div>
              <div className="border-2 border-brutal rounded-xl p-2.5 bg-lime/20">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Terpilih</span>
                <span className="text-sm font-black text-forest">{formatRupiah(selectedTotal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama / ref / metode / tanggal..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 sm:py-1.5 border-2 border-brutal rounded-xl text-base sm:text-xs font-semibold outline-none focus:border-forest"
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs sm:text-[11px] font-bold cursor-pointer px-3 py-2.5 sm:px-2.5 sm:py-1.5 border-2 border-brutal rounded-xl bg-white">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="w-3.5 h-3.5 accent-forest cursor-pointer"
                />
                Pilih semua
              </label>
            </div>

            <div className="overflow-auto border-2 border-brutal rounded-2xl min-h-0 flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-stone-100 sticky top-0 z-10">
                  <tr className="font-black text-[10px] uppercase text-stone-700">
                    <th className="p-2 w-8 text-center border-b-2 border-brutal">✓</th>
                    <th className="p-2 w-8 text-center border-b-2 border-brutal">#</th>
                    <th className="p-2 border-b-2 border-brutal">Nama</th>
                    <th className="p-2 text-right border-b-2 border-brutal">Nominal</th>
                    <th className="p-2 border-b-2 border-brutal">Status</th>
                    <th className="p-2 border-b-2 border-brutal">Metode</th>
                    <th className="p-2 border-b-2 border-brutal">Tanggal</th>
                    <th className="p-2 border-b-2 border-brutal">Ref</th>
                    <th className="p-2 w-8 border-b-2 border-brutal"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-gray-500 font-bold">
                        Tidak ada baris yang cocok.
                      </td>
                    </tr>
                  )}
                  {filteredItems.map((it) => {
                    const realIndex = items.indexOf(it);
                    const statusCls = STATUS_OPTIONS.find((s) => s.value === it.status)?.cls || 'bg-white';
                    return (
                      <tr
                        key={realIndex}
                        className={`border-b border-stone-200 ${it.is_duplicate ? 'bg-amber-50' : 'hover:bg-lime/10'}`}
                      >
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={it.selected}
                            onChange={() => toggleRow(realIndex)}
                            className="w-3.5 h-3.5 accent-forest cursor-pointer"
                          />
                        </td>
                        <td className="p-2 text-center font-mono text-[10px] text-gray-500">{it.no}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={it.name || ''}
                            onChange={(e) => updateRow(realIndex, { name: e.target.value })}
                            className="w-full min-w-[140px] px-1.5 py-1 border border-stone-300 rounded-md text-xs font-bold outline-none focus:border-forest"
                          />
                          {it.is_duplicate && (
                            <span className="text-[9px] font-bold text-amber-700 flex items-center gap-0.5 mt-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Ref sudah ada di database
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          <span className="font-mono font-black text-forest whitespace-nowrap">
                            {formatRupiah(it.amount)}
                          </span>
                        </td>
                        <td className="p-2">
                          <select
                            value={it.status}
                            onChange={(e) => updateRow(realIndex, { status: e.target.value })}
                            className={`px-1.5 py-1 rounded-md border-2 text-[10px] font-black cursor-pointer outline-none ${statusCls}`}
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
                            className="px-1.5 py-1 rounded-md border-2 border-brutal text-[10px] font-bold bg-white cursor-pointer outline-none"
                          >
                            {METHOD_OPTIONS.map((m) => (
                              <option key={m.value} value={m.value}>
                                {m.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 font-mono text-[10px] text-gray-700 whitespace-nowrap">
                          {it.date || <span className="text-gray-400 italic">hari ini</span>}
                        </td>
                        <td className="p-2 font-mono text-[10px] text-gray-500 max-w-[120px] truncate" title={it.ref || ''}>
                          {it.ref || '-'}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => removeRow(realIndex)}
                            className="text-error hover:bg-red-50 rounded-md p-1 cursor-pointer"
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

            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pt-3 mt-1 border-t-2 border-stone-200 shrink-0">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-3 sm:py-2 border-2 border-brutal rounded-xl text-sm sm:text-xs font-bold hover:bg-gray-100 cursor-pointer"
              >
                ← Ganti File
              </button>
              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-xs sm:text-[11px] font-bold text-gray-600">
                  {selectedItems.length} baris • {formatRupiah(selectedTotal)}
                </span>
                <button
                  onClick={handleImport}
                  disabled={isImporting || selectedItems.length === 0}
                  className="px-5 py-3 sm:py-2.5 bg-forest hover:bg-forest-dark text-white border-2 border-brutal rounded-xl text-sm sm:text-xs font-extrabold shadow-brutal-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h4 className="font-display text-2xl text-forest mb-1">Impor Berhasil</h4>
            <p className="text-xs text-gray-600 font-semibold mb-4">{result.message}</p>
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-5">
              <div className="border-2 border-brutal rounded-xl p-2.5 bg-lime/20">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Diimpor</span>
                <span className="text-lg font-black text-forest">{result.imported_count}</span>
              </div>
              <div className="border-2 border-brutal rounded-xl p-2.5 bg-amber-50">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Dilewati</span>
                <span className="text-lg font-black text-amber-600">{result.skipped_count}</span>
              </div>
              <div className="border-2 border-brutal rounded-xl p-2.5 bg-stone-50">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Total</span>
                <span className="text-sm font-black text-brutal">{formatRupiah(result.total_imported_amount)}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={reset}
                className="px-4 py-2.5 border-2 border-brutal rounded-xl text-xs font-bold hover:bg-gray-100 cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Impor File Lain
              </button>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-forest hover:bg-forest-dark text-white border-2 border-brutal rounded-xl text-xs font-extrabold shadow-brutal-sm cursor-pointer"
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
