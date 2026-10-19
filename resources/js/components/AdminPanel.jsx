import React, { useState } from 'react';
import { useDonation } from '../context/DonationContext';
import { Check, X, Download, PlusCircle, AlertCircle, Phone, RefreshCw, ShieldAlert, ArrowLeft, LogOut, UserCheck, FileText, DollarSign, Calendar, Image as ImageIcon, Printer, Search, FileSpreadsheet } from 'lucide-react';
import ManualCashModal from './ManualCashModal';
import QrisImportModal from './QrisImportModal';
import ExcelImportModal from './ExcelImportModal';
import SlideManagerModal from './SlideManagerModal';
import DonationReportPrintModal from './DonationReportPrintModal';
export default function AdminPanel() {
  const {
    donations,
    pendingDonations,
    adminVerifiedDonations,
    rejectedDonations,
    currentAmount,
    campaign,
    approveDonation,
    rejectDonation,
    currentUser,
    logoutAdmin,
    refetchAdmin
  } = useDonation();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'qris' | 'cash' | 'committed' | 'pending' | 'verified' | 'rejected'
  const [showManualModal, setShowManualModal] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isCommittedPaid = (d) => d.isCommitment && d.status === 'verified';

  const qrisList = donations.filter((d) => d.paymentMethod === 'qris');
  const cashList = donations.filter((d) => d.paymentMethod === 'cash' && !d.isCommitment);
  const committedList = donations.filter((d) => d.isCommitment);
  const committedPaidList = committedList.filter(isCommittedPaid);
  const committedUnpaidList = committedList.filter((d) => !isCommittedPaid(d));

  const qrisTotal = qrisList.filter((d) => d.status === 'verified').reduce((acc, d) => acc + (d.amount || 0), 0);
  const cashTotal = cashList.filter((d) => d.status === 'verified').reduce((acc, d) => acc + (d.amount || 0), 0);
  const committedTotal = committedList.reduce((acc, d) => acc + (d.amount || 0), 0);
  const committedPaidTotal = committedPaidList.reduce((acc, d) => acc + (d.amount || 0), 0);

  const filteredList = donations.filter((d) => {
    if (activeFilter === 'qris' && d.paymentMethod !== 'qris') return false;
    if (activeFilter === 'cash' && (d.paymentMethod !== 'cash' || d.isCommitment)) return false;
    if (activeFilter === 'committed' && !d.isCommitment) return false;
    if (['pending', 'verified', 'rejected'].includes(activeFilter) && d.status !== activeFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        (d.donorName || '').toLowerCase().includes(q) ||
        (d.donorPhone || '').toLowerCase().includes(q) ||
        (d.referenceNo || '').toLowerCase().includes(q) ||
        (d.sourceFile || '').toLowerCase().includes(q)
      );
    }
    return true;
  });
  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <section className="w-full py-6 px-4 sm:px-6 max-w-6xl mx-auto">

      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C66723] hover:underline mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Ke Layar Kiosk Publik
          </button>
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-al-azhar.png"
              alt="LAZ Al Azhar"
              className="h-9 sm:h-10 w-auto object-contain"
            />
            <div>
              <h1 className="font-poster font-black text-2xl sm:text-3xl text-[#1C140E] tracking-tight leading-none">
                PANEL AMIL &amp; VERIFIKASI DONASI
              </h1>
              <p className="text-xs text-[#7A6855] font-medium mt-0.5">
                Lembaga Amil Zakat (LAZ) Al Azhar Peduli • Realtime Database Auto-Sync
              </p>
            </div>
          </div>
        </div>

        {/* Global Admin Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 bg-[#C66723] hover:bg-[#b0581a] text-white font-bold text-sm sm:text-xs px-3.5 py-3 sm:py-2.5 rounded-xl shadow-sm border border-[#A85215] cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Input Cash / Komitmen</span>
          </button>

          <button
            onClick={() => setShowQrisModal(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-[#FDF9F5] text-[#C66723] font-bold text-sm sm:text-xs px-3.5 py-3 sm:py-2.5 rounded-xl border border-[#D5BEA1] shadow-2xs cursor-pointer transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>📄 Impor QRIS (PDF)</span>
          </button>

          <button
            onClick={() => setShowExcelModal(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-[#FDF9F5] text-emerald-800 font-bold text-sm sm:text-xs px-3.5 py-3 sm:py-2.5 rounded-xl border border-[#D5BEA1] shadow-2xs cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📊 Impor Excel</span>
          </button>

          <button
            onClick={() => setShowSlideModal(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-[#FDF9F5] text-stone-800 font-bold text-sm sm:text-xs px-3.5 py-3 sm:py-2.5 rounded-xl border border-[#D5BEA1] shadow-2xs cursor-pointer transition-all"
          >
            <ImageIcon className="w-4 h-4 text-[#C66723]" />
            <span>📸 Slide Kegiatan</span>
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 bg-[#E51E25] hover:bg-red-700 text-white font-bold text-sm sm:text-xs px-3.5 py-3 sm:py-2.5 rounded-xl shadow-2xs cursor-pointer transition-all"
            title="Rekapitulasi Donasi & Cetak / Simpan PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Rekap PDF Laporan</span>
          </button>

          <button
            onClick={() => { window.location.href = '/api/admin/donations/export-excel'; }}
            className="flex items-center gap-1.5 bg-white hover:bg-amber-50 text-stone-800 font-bold text-sm sm:text-xs px-3.5 py-3 sm:py-2.5 rounded-xl border border-[#D5BEA1] cursor-pointer"
            title="Unduh seluruh donasi sebagai file Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={refetchAdmin}
            className="flex items-center gap-1 bg-white hover:bg-amber-50 text-stone-700 font-semibold text-xs px-2.5 py-2 rounded-xl border border-[#D5BEA1] shadow-2xs cursor-pointer"
            title="Muat ulang data dari database"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={logoutAdmin}
            className="flex items-center gap-1.5 bg-[#1C140E] hover:bg-stone-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xs cursor-pointer"
            title="Kembali ke layar Kiosk utama"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Ke Kiosk</span>
          </button>
        </div>
      </div>
      {/* KPI Cards (Dibagi Rapi Berdasarkan Jenis Transaksi) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-white/95 border border-[#E5DAC8] rounded-2xl p-4 shadow-sm backdrop-blur-xs">
          <span className="text-[11px] font-bold text-[#7A6855] uppercase block mb-1">
            Total Dana Terverifikasi
          </span>
          <span className="font-poster font-black text-2xl text-[#C66723] block">
            {formatRupiah(currentAmount)}
          </span>
          <span className="text-[11px] font-semibold text-[#7A6855]">
            Target {formatRupiah(campaign.targetAmount || 500000000)}
          </span>
        </div>

        <div className="bg-white/95 border border-[#E5DAC8] rounded-2xl p-4 shadow-sm backdrop-blur-xs">
          <span className="text-[11px] font-bold text-[#7A6855] uppercase block mb-1">
            📄 Total QRIS (PDF)
          </span>
          <span className="font-poster font-black text-2xl text-[#C66723] block">
            {formatRupiah(qrisTotal)}
          </span>
          <span className="text-[11px] font-semibold text-[#7A6855]">
            {qrisList.length} Transaksi QRIS
          </span>
        </div>

        <div className="bg-white/95 border border-[#E5DAC8] rounded-2xl p-4 shadow-sm backdrop-blur-xs">
          <span className="text-[11px] font-bold text-[#7A6855] uppercase block mb-1">
            💵 Total Cash / Tunai
          </span>
          <span className="font-poster font-black text-2xl text-[#C66723] block">
            {formatRupiah(cashTotal)}
          </span>
          <span className="text-[11px] font-semibold text-[#7A6855]">
            {cashList.length} Donasi Tunai
          </span>
        </div>

        <div className="bg-white/95 border border-[#E5DAC8] rounded-2xl p-4 shadow-sm backdrop-blur-xs">
          <span className="text-[11px] font-bold text-[#7A6855] uppercase block mb-1">
            🤝 Komitmen / Book
          </span>
          <span className="font-poster font-black text-2xl text-[#C66723] block">
            {formatRupiah(committedTotal)}
          </span>
          <span className="text-[11px] font-semibold text-[#7A6855] block">
            {committedList.length} Donatur Komitmen
          </span>
          <span className="text-[11px] font-semibold block mt-0.5">
            <span className="text-emerald-700">💰 {formatRupiah(committedPaidTotal)} sudah donasi ({committedPaidList.length})</span>
            <span className="text-[#D5BEA1]"> • </span>
            <span className="text-amber-700">⏳ {committedUnpaidList.length} belum</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs Jenis Transaksi & Kotak Pencarian Audit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2.5 sm:py-1.5 rounded-full text-sm sm:text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#C66723] text-white shadow-2xs border border-[#C66723]'
              : 'bg-white/90 text-[#7A6855] border border-[#E5DAC8] hover:bg-amber-50/50'
          }`}
        >
          Semua ({donations.length})
        </button>

        <button
          onClick={() => setActiveFilter('qris')}
          className={`px-4 py-2.5 sm:py-1.5 rounded-full text-sm sm:text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'qris'
              ? 'bg-[#C66723] text-white shadow-2xs border border-[#C66723]'
              : 'bg-white/90 text-[#7A6855] border border-[#E5DAC8] hover:bg-amber-50/50'
          }`}
        >
          📄 QRIS PDF ({qrisList.length})
        </button>

        <button
          onClick={() => setActiveFilter('cash')}
          className={`px-4 py-2.5 sm:py-1.5 rounded-full text-sm sm:text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'cash'
              ? 'bg-[#C66723] text-white shadow-2xs border border-[#C66723]'
              : 'bg-white/90 text-[#7A6855] border border-[#E5DAC8] hover:bg-amber-50/50'
          }`}
        >
          💵 Cash / Tunai ({cashList.length})
        </button>

        <button
          onClick={() => setActiveFilter('committed')}
          className={`px-4 py-2.5 sm:py-1.5 rounded-full text-sm sm:text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'committed'
              ? 'bg-[#C66723] text-white shadow-2xs border border-[#C66723]'
              : 'bg-white/90 text-[#7A6855] border border-[#E5DAC8] hover:bg-amber-50/50'
          }`}
        >
          🤝 Komitmen / Book ({committedList.length})
        </button>

        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-4 py-2.5 sm:py-1.5 rounded-full text-sm sm:text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'pending'
              ? 'bg-[#C66723] text-white shadow-2xs border border-[#C66723]'
              : 'bg-white/90 text-[#7A6855] border border-[#E5DAC8] hover:bg-amber-50/50'
          }`}
        >
          ⏳ Pending ({pendingDonations.length})
        </button>

        <button
          onClick={() => setActiveFilter('verified')}
          className={`px-4 py-2.5 sm:py-1.5 rounded-full text-sm sm:text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'verified'
              ? 'bg-[#C66723] text-white shadow-2xs border border-[#C66723]'
              : 'bg-white/90 text-[#7A6855] border border-[#E5DAC8] hover:bg-amber-50/50'
          }`}
        >
          ✅ Terverifikasi ({adminVerifiedDonations.length})
        </button>

        <button
          onClick={() => setActiveFilter('rejected')}
          className={`px-4 py-2.5 sm:py-1.5 rounded-full text-sm sm:text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'rejected'
              ? 'bg-[#C66723] text-white shadow-2xs border border-[#C66723]'
              : 'bg-white/90 text-[#7A6855] border border-[#E5DAC8] hover:bg-amber-50/50'
          }`}
        >
          ❌ Ditolak ({rejectedDonations.length})
        </button>
        </div>
        {/* Search Input for Audit & Filter */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#7A6855]" />
          <input
            type="text"
            placeholder="Cari donatur / ref / file PDF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-3 sm:py-1.5 bg-white/95 border border-[#E5DAC8] rounded-xl text-stone-800 placeholder-stone-400 focus:border-[#C66723] text-base sm:text-xs font-semibold outline-none"
          />
        </div>
      </div>

      {/* Donations List / Table */}
      <div className="bg-white/95 border border-[#E5DAC8] rounded-3xl p-4 sm:p-6 shadow-sm">
        {filteredList.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-bold text-[#7A6855] text-sm">
              Tidak ada donasi dalam kategori ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className="bg-[#FAF6F0] hover:bg-[#F5EFE6] border border-[#E8DDCD] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-poster font-bold text-sm text-stone-900" title="Nama asli pengirim dari rekening/aplikasi">
                      {item.donorName}
                    </span>
                    {item.isAnonymous && (
                      <span className="bg-amber-50 text-[#C66723] font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#D5BEA1]" title="Nama asli tersimpan untuk mutasi. Di publik tampil sebagai Hamba Allah">
                        🔒 Publik: Hamba Allah
                      </span>
                    )}
                    <span
                      className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : item.status === 'rejected'
                          ? 'bg-red-100 text-red-900 border border-red-300'
                          : item.isCommitment
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {item.isCommitment ? 'KOMITMEN / BOOK' : item.status.toUpperCase()}
                    </span>
                    {item.isCommitment && (
                      isCommittedPaid(item) ? (
                        <span className="bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1" title="Komitmen sudah dibayar/donasi — masuk total progres">
                          💰 SUDAH DONASI
                        </span>
                      ) : item.status === 'rejected' ? (
                        <span className="bg-stone-200 text-stone-600 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-stone-300" title="Komitmen ini ditolak/dibatalkan">
                          ⛔ DIBATALKAN
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-900 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1" title="Komitmen belum dibayar — belum masuk total progres">
                          ⏳ BELUM DONASI
                        </span>
                      )
                    )}
                    {item.paymentMethod && (
                      <span className="bg-white text-stone-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#E5DAC8]">
                        {item.paymentMethod.toUpperCase()}
                      </span>
                    )}
                    {item.referenceNo && (
                      <span className="font-mono text-[10px] text-[#7A6855]">
                        Ref: {item.referenceNo}
                      </span>
                    )}
                    {item.sourceFile && (
                      <span className="bg-[#FDF9F5] text-stone-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#D5BEA1] flex items-center gap-1" title={`Audit Log: Berasal dari dokumen ${item.sourceFile}`}>
                        <FileText className="w-2.5 h-2.5 text-[#C66723]" />
                        <span className="truncate max-w-[170px]">{item.sourceFile}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#7A6855]">
                    <span className="flex items-center gap-1 font-mono font-semibold">
                      <Phone className="w-3.5 h-3.5 text-[#C66723]" />
                      {item.donorPhone}
                    </span>
                    <span>•</span>
                    <span>{item.createdAt}</span>
                  </div>

                  {item.prayerMessage && (
                    <p className="text-xs text-stone-700 italic bg-white/90 border border-stone-200 rounded-xl p-2.5 mt-1">
                      "{item.prayerMessage}"
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                  <span className="font-poster font-black text-lg text-[#C66723]">
                    {formatRupiah(item.amount)}
                  </span>

                  {item.status === 'pending' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => approveDonation(item.id)}
                        className="flex items-center gap-1 bg-[#C66723] hover:bg-[#b0581a] text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer"
                        title="Setujui donasi dan tambahkan ke progress bar"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => rejectDonation(item.id)}
                        className="flex items-center gap-1 bg-white hover:bg-red-50 text-red-600 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-red-200 cursor-pointer"
                        title="Tolak donasi jika tidak ada di mutasi"
                      >
                        <X className="w-3.5 h-3.5" /> Tolak
                      </button>
                    </div>
                  )}

                  {item.isCommitment && !isCommittedPaid(item) && item.status !== 'rejected' && (
                    <button
                      onClick={() => approveDonation(item.id)}
                      className="flex items-center gap-1 bg-[#C66723] hover:bg-[#b0581a] text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer"
                      title="Tandai komitmen ini sudah dibayar/donasi — akan masuk total progres & tampil di kiosk"
                    >
                      <Check className="w-3.5 h-3.5" /> Tandai Sudah Donasi
                    </button>
                  )}
                  {!item.isCommitment && item.status === 'verified' && (
                    <span className="text-[10px] font-mono text-[#7A6855]">
                      Disetujui: {item.verifiedAt || 'Sudah aktif'}
                    </span>
                  )}
                  {isCommittedPaid(item) && (
                    <span className="text-[10px] font-mono text-[#7A6855]">
                      Sudah donasi: {item.verifiedAt || 'Sudah aktif'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ManualCashModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
      />

      <QrisImportModal
        isOpen={showQrisModal}
        onClose={() => setShowQrisModal(false)}
      />

      <ExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
      />

      <SlideManagerModal
        isOpen={showSlideModal}
        onClose={() => setShowSlideModal(false)}
      />

      <DonationReportPrintModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        donations={donations}
        currentAmount={currentAmount}
        campaign={campaign}
      />
    </section>
  );
}
