import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Loader2, ArrowRight, Check, Search, Edit3, Trash2, Plus } from 'lucide-react';
import { useDonation } from '../context/DonationContext';

export default function QrisImportModal({ isOpen, onClose }) {
  const { parseQrisPdf, importPdfBatch } = useDonation();

  const [files, setFiles] = useState([]);
  const [fileSummaries, setFileSummaries] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' | 'review' | 'success'
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Review state
  const [items, setItems] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedFileFilter, setSelectedFileFilter] = useState('all');
  const [totalDetectedAmount, setTotalDetectedAmount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const validPdfs = selected.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (validPdfs.length === 0) {
      setErrorMsg('Semua file yang dipilih harus berformat PDF laporan transaksi QRIS.');
      return;
    }

    setFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const newItems = validPdfs.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));
      return [...prev, ...newItems];
    });
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleParse = async () => {
    if (files.length === 0) {
      setErrorMsg('Silakan pilih minimal satu file PDF terlebih dahulu.');
      return;
    }

    setIsParsing(true);
    setErrorMsg('');

    const res = await parseQrisPdf(files);
    setIsParsing(false);

    if (res.success) {
      const mapped = (res.items || []).map((it, idx) => ({
        ...it,
        no: idx + 1,
        selected: !it.is_duplicate
      }));
      setItems(mapped);
      setFileSummaries(res.files || []);
      setTotalDetectedAmount(res.total_detected_amount || 0);
      setDuplicateCount(res.duplicate_count || 0);
      setStep('review');
    } else {
      setErrorMsg(res.message || 'Gagal memproses file PDF.');
    }
  };

  const handleToggleSelectAll = (checked) => {
    setItems((prev) => prev.map((it) => ({ ...it, selected: checked })));
  };

  const handleToggleRow = (index) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, selected: !it.selected } : it))
    );
  };

  const handleNameChange = (index, newName) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, name: newName } : it))
    );
  };

  const selectedItems = items.filter((it) => it.selected);
  const selectedTotalAmount = selectedItems.reduce((acc, it) => acc + (it.amount || 0), 0);
  const isAllSelected = items.length > 0 && selectedItems.length === items.length;

  const filteredItems = items.filter((it) => {
    if (selectedFileFilter !== 'all' && it.source_file !== selectedFileFilter) {
      return false;
    }
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (it.name || '').toLowerCase().includes(q) ||
      (it.ref || '').toLowerCase().includes(q) ||
      (it.date || '').toLowerCase().includes(q) ||
      (it.source_file || '').toLowerCase().includes(q)
    );
  });

  const handleConfirmImport = async () => {
    if (selectedItems.length === 0) {
      setErrorMsg('Pilih minimal satu transaksi untuk diimpor.');
      return;
    }

    setIsImporting(true);
    setErrorMsg('');

    const res = await importPdfBatch(selectedItems);
    setIsImporting(false);

    if (res.success) {
      setSuccessData(res);
      setStep('success');
    } else {
      setErrorMsg(res.message || 'Gagal menyimpan batch transaksi QRIS.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setFileSummaries([]);
    setItems([]);
    setStep('upload');
    setErrorMsg('');
    setSuccessData(null);
    setSelectedFileFilter('all');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className={`bg-white border-[3px] border-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl my-6 w-full ${
        step === 'review' ? 'max-w-5xl' : 'max-w-xl'
      }`}>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border-2 border-slate-900 flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Impor &amp; Rekap PDF QRIS Danamon
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Dukungan multi-file PDF sekaligus dengan rekapitulasi otomatis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center hover:bg-slate-100 cursor-pointer text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="mb-4 bg-red-50 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD MULTIPLE PDF */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-3 border-dashed border-emerald-600/70 hover:border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-6 sm:p-7 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 mx-auto rounded-2xl bg-white border-2 border-slate-900 flex items-center justify-center shadow-md mb-3 text-emerald-700">
                <Upload className="w-7 h-7" />
              </div>

              <div>
                <span className="font-black text-sm sm:text-base text-slate-900 block">
                  Pilih Satu atau BANYAK File PDF Laporan Sekaligus
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  Format: Merchant_Report-LAZ_AL_AZHAR-*.pdf (Multi-file upload)
                </span>
                <span className="inline-block mt-2 bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl border border-emerald-800 shadow-xs">
                  + Klik untuk Memilih File PDF
                </span>
              </div>
            </div>

            {/* List of Selected Files */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                  <span>File PDF Terpilih ({files.length} Dokumen):</span>
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-red-600 hover:underline text-[11px] font-semibold cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {files.map((f, idx) => (
                    <div
                      key={`${f.name}-${idx}`}
                      className="bg-white border-2 border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-red-100 border border-red-300 text-red-600 flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                          PDF
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate">
                            {f.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {(f.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Hapus file ini"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-emerald-50 border-2 border-emerald-700/40 rounded-2xl p-3.5 text-xs text-slate-800">
              <span className="font-bold block mb-1 text-emerald-800">ℹ️ Rekapitulasi Otomatis &amp; Anti-Duplikasi:</span>
              <span>
                Sistem akan membedah seluruh file PDF yang Anda unggah secara otomatis, menggabungkan data transaksinya, menampilkan rekapitulasi per dokumen, dan menandai transaksi duplikat agar tidak terhitung ganda.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t-2 border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border-2 border-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={files.length === 0 || isParsing}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white border-2 border-slate-900 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengekstrak {files.length} File PDF...</span>
                  </>
                ) : (
                  <>
                    <span>Ekstrak &amp; Rekap {files.length > 0 ? `(${files.length} File)` : ''}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW TABLE & MULTI-FILE RECAP */}
        {step === 'review' && (
          <div className="space-y-4">
            
            {/* KPI Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-50 border-2 border-slate-800 rounded-xl p-3 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total PDF</span>
                <span className="font-mono text-base sm:text-lg font-black text-slate-900 block">
                  {fileSummaries.length || files.length} Dokumen
                </span>
                <span className="text-[10px] text-slate-500">Laporan QRIS Danamon</span>
              </div>
              <div className="bg-slate-50 border-2 border-slate-800 rounded-xl p-3 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Terdeteksi</span>
                <span className="font-mono text-base sm:text-lg font-black text-emerald-700 block">
                  {items.length} Transaksi
                </span>
                <span className="text-[10px] text-slate-600 font-bold block">{formatRupiah(totalDetectedAmount)}</span>
              </div>
              <div className="bg-slate-50 border-2 border-slate-800 rounded-xl p-3 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Siap Diimpor</span>
                <span className="font-mono text-base sm:text-lg font-black text-emerald-700 block">
                  {selectedItems.length} Transaksi
                </span>
                <span className="text-[10px] font-bold text-emerald-800 block">{formatRupiah(selectedTotalAmount)}</span>
              </div>
              <div className="bg-slate-50 border-2 border-slate-800 rounded-xl p-3 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Duplikat Terdeteksi</span>
                <span className={`font-mono text-base sm:text-lg font-black ${duplicateCount > 0 ? 'text-amber-700' : 'text-slate-400'} block`}>
                  {duplicateCount} Transaksi
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {duplicateCount > 0 ? 'Dilewati otomatis' : 'Nol duplikasi'}
                </span>
              </div>
            </div>

            {/* Rekap Rincian per Dokumen PDF (Jika ada lebih dari 1 file) */}
            {fileSummaries.length > 1 && (
              <div className="bg-slate-50 border-2 border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Rekap Rincian Tiap File PDF (Klik untuk filter tabel):</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {fileSummaries.length} File Diproses
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedFileFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      selectedFileFilter === 'all'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    Semua File ({items.length})
                  </button>
                  {fileSummaries.map((f, idx) => (
                    <button
                      key={`sum-${idx}`}
                      type="button"
                      onClick={() => setSelectedFileFilter(f.file_name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedFileFilter === f.file_name
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                      title={f.file_name}
                    >
                      <span className="truncate max-w-[130px] font-bold">{f.file_name}</span>
                      <span className="font-mono text-[10px] opacity-85 font-black">
                        ({f.transaction_count} tx • {formatRupiah(f.total_amount)})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filter & Selection Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleSelectAll(!isAllSelected)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isAllSelected ? 'Lepas Semua' : 'Pilih Semua'}
                </button>
                <span className="text-xs text-slate-600 font-medium">
                  {selectedItems.length} dari {filteredItems.length} terpilih
                </span>
              </div>

              {/* Search filter */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama / ref / file..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border-2 border-slate-900 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* Interactive Review Table */}
            <div className="border-2 border-slate-900 rounded-2xl overflow-hidden max-h-[360px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 border-b-2 border-slate-900 sticky top-0 z-10 font-bold text-slate-900">
                  <tr>
                    <th className="p-2.5 text-center w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => handleToggleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-2 border-slate-900 accent-emerald-600 cursor-pointer"
                      />
                    </th>
                    <th className="p-2.5 w-10 text-center">No</th>
                    <th className="p-2.5">Tanggal</th>
                    {fileSummaries.length > 1 && (
                      <th className="p-2.5">Asal File PDF</th>
                    )}
                    <th className="p-2.5">No Ref</th>
                    <th className="p-2.5 min-w-[180px]">
                      <span className="flex items-center gap-1">
                        Nama Donatur <Edit3 className="w-3 h-3 text-slate-500" />
                      </span>
                    </th>
                    <th className="p-2.5 text-right">Nominal (Rp)</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredItems.map((item) => {
                    const originalIdx = items.findIndex((it) => it.no === item.no);
                    return (
                      <tr
                        key={item.no}
                        className={`hover:bg-emerald-50/50 transition-colors ${
                          !item.selected ? 'opacity-50 bg-slate-50' : item.is_duplicate ? 'bg-amber-50/60' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleToggleRow(originalIdx)}
                            className="w-4 h-4 rounded border-2 border-slate-900 accent-emerald-600 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                          {item.no}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700 whitespace-nowrap">
                          {item.date || '-'}
                        </td>
                        {fileSummaries.length > 1 && (
                          <td className="p-2.5 whitespace-nowrap text-[11px] font-mono text-slate-500">
                            <span className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 truncate max-w-[120px] inline-block" title={item.source_file}>
                              {item.source_file || '-'}
                            </span>
                          </td>
                        )}
                        <td className="p-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {item.ref || '-'}
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleNameChange(originalIdx, e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 hover:border-slate-800 focus:border-emerald-600 outline-none bg-white"
                            title="Klik untuk koreksi nama donatur"
                          />
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-emerald-700 whitespace-nowrap">
                          {formatRupiah(item.amount)}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          {item.is_duplicate ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Duplikat
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Baru
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t-2 border-slate-100">
              <button
                type="button"
                onClick={handleReset}
                disabled={isImporting}
                className="px-4 py-2 border-2 border-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Pilih Ulang PDF
              </button>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isImporting}
                  className="px-4 py-2 border-2 border-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={selectedItems.length === 0 || isImporting}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white border-2 border-slate-900 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Konfirmasi &amp; Simpan ({selectedItems.length} Transaksi • {formatRupiah(selectedTotalAmount)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* STEP 3: SUCCESS FEEDBACK */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border-3 border-slate-900 flex items-center justify-center shadow-md text-emerald-700">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="font-extrabold text-2xl text-emerald-800 uppercase">
                ALHAMDULILLAH, IMPOR &amp; REKAP BERHASIL!
              </h4>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                {successData?.message}
              </p>
            </div>

            <div className="bg-emerald-50 border-2 border-slate-900 rounded-2xl p-4 max-w-sm mx-auto text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Total Dokumen PDF:</span>
                <span className="font-bold text-slate-900">{files.length} File</span>
              </div>
              <div className="flex justify-between">
                <span>Berhasil diimpor:</span>
                <span className="font-bold text-emerald-700">{successData?.imported_count || 0} transaksi</span>
              </div>
              <div className="flex justify-between">
                <span>Total nominal masuk:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(successData?.total_imported_amount || 0)}</span>
              </div>
              {successData?.skipped_count > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Duplikat dilewati:</span>
                  <span>{successData?.skipped_count} transaksi</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white border-2 border-slate-900 rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
