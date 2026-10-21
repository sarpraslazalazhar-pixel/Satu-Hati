import React, { useState, useEffect } from 'react';
import { X, FileText, Trash2, AlertTriangle, CheckCircle2, RefreshCw, FileSpreadsheet, ShieldAlert, AlertCircle } from 'lucide-react';
import { useDonation } from '../context/DonationContext';

export default function ImportRollbackModal({ isOpen, onClose }) {
  const { fetchImportedFiles, rollbackImportedFile } = useDonation();

  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFileToRollback, setSelectedFileToRollback] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadFiles = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const res = await fetchImportedFiles();
    setIsLoading(false);
    if (res.success) {
      setFiles(res.files || []);
    } else {
      setErrorMsg(res.message || 'Gagal memuat daftar file impor.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedFileToRollback(null);
      setErrorMsg('');
      setSuccessMsg('');
      loadFiles();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleRollbackConfirm = async () => {
    if (!selectedFileToRollback) return;

    setIsDeleting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await rollbackImportedFile(selectedFileToRollback.sourceFile);
    setIsDeleting(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Berhasil membatalkan impor dan menghapus data.');
      setSelectedFileToRollback(null);
      // Reload the files list
      loadFiles();
    } else {
      setErrorMsg(res.message || 'Gagal membatalkan impor file.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1C140E]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF7F2] border-2 border-[#D88A3E]/40 rounded-3xl p-4 sm:p-7 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 my-6 sm:my-8 text-[#1C140E] max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DDCD] mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#C66723] text-white flex items-center justify-center font-bold text-lg shadow-2xs">
              📄
            </div>
            <div>
              <h3 className="font-poster font-black text-xl sm:text-2xl text-[#1C140E] leading-none">
                KELOLA & ROLLBACK FILE IMPOR
              </h3>
              <p className="text-xs text-[#7A6855] font-semibold mt-0.5">
                Batalkan data donasi jika salah upload/tarik file PDF QRIS atau Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 sm:w-8 sm:h-8 shrink-0 rounded-full border border-[#D5BEA1] flex items-center justify-center hover:bg-amber-50 cursor-pointer text-[#7A6855]"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold rounded-xl p-3 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl p-3 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Confirmation Banner if a file is selected for rollback */}
        {selectedFileToRollback && (
          <div className="mb-4 bg-red-50/90 border-2 border-red-300 rounded-2xl p-4 shrink-0 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-sm text-red-900 leading-tight">
                  Konfirmasi Hapus Seluruh Data File Ini?
                </h4>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  Anda akan menghapus <span className="font-bold font-mono text-red-900">{selectedFileToRollback.totalRecords} transaksi</span> dari file{' '}
                  <span className="font-mono font-bold text-red-900">"{selectedFileToRollback.sourceFile}"</span> dengan total nominal{' '}
                  <span className="font-bold text-red-900">{formatRupiah(selectedFileToRollback.totalAmount)}</span>.
                  Total progres kampanye akan otomatis dikalkulasi ulang dan disinkronkan ke kiosk.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleRollbackConfirm}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menghapus Data...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Ya, Hapus Semua ({selectedFileToRollback.totalRecords} Donasi)</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedFileToRollback(null)}
                    disabled={isDeleting}
                    className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Files List Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#8C7A6B] gap-2">
              <div className="w-6 h-6 border-2 border-[#C66723] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Memeriksa riwayat file impor...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="py-12 text-center bg-white/70 border border-[#ECE2D2] rounded-2xl p-6">
              <FileText className="w-8 h-8 text-[#C66723]/60 mx-auto mb-2" />
              <p className="font-bold text-sm text-[#1C140E]">Belum Ada File yang Diimpor</p>
              <p className="text-xs text-[#8C7A6B] mt-1">
                Data donasi dari impor PDF QRIS atau Excel akan tercatat di sini dan dapat dibatalkan jika salah tarik file.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {files.map((fileItem, idx) => {
                const isSelected = selectedFileToRollback?.sourceFile === fileItem.sourceFile;
                const isPdf = fileItem.sourceFile.toLowerCase().endsWith('.pdf');

                return (
                  <div
                    key={idx}
                    className={`bg-white border rounded-2xl p-3.5 sm:p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-red-400 bg-red-50/30 shadow-xs'
                        : 'border-[#ECE2D2] hover:border-[#D5BEA1]'
                    }`}
                  >
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        {isPdf ? (
                          <span className="bg-red-50 text-red-700 font-bold text-[10px] px-2 py-0.5 rounded-md border border-red-200">
                            PDF QRIS
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-md border border-emerald-200">
                            EXCEL
                          </span>
                        )}
                        <span className="font-mono font-bold text-xs text-[#1C140E] truncate max-w-[280px] sm:max-w-sm" title={fileItem.sourceFile}>
                          {fileItem.sourceFile}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#8C7A6B] font-medium pt-0.5">
                        <span className="font-bold text-[#1C140E]">
                          {fileItem.totalRecords} Transaksi
                        </span>
                        <span>•</span>
                        <span className="font-bold text-[#C66723]">
                          {formatRupiah(fileItem.totalAmount)}
                        </span>
                        {fileItem.lastImportedAt && (
                          <>
                            <span>•</span>
                            <span className="text-[11px] text-[#A08E7D]">
                              Impor: {fileItem.lastImportedAt}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => setSelectedFileToRollback(fileItem)}
                        disabled={isDeleting}
                        className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:border-red-300"
                        title="Hapus semua data donasi yang berasal dari file ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Rollback / Hapus File</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#E8DDCD] flex items-center justify-between shrink-0">
          <p className="text-[11px] text-[#8C7A6B]">
            Total {files.length} dokumen tercatat di sistem
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#D5BEA1] text-xs font-bold text-[#7A6855] hover:bg-stone-100 cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
