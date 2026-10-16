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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:underline mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Ke Layar Kiosk Publik
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-comic-yellow border-2 border-brutal flex items-center justify-center font-bold text-base shadow-brutal-sm">
              🛡️
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-forest tracking-wide leading-none">
                PANEL AMIL &amp; VERIFIKASI DONASI
              </h1>
              <p className="text-xs text-gray-600 font-medium mt-0.5">
                Lembaga Amil Zakat (LAZ) Al Azhar Peduli • Realtime Database Auto-Sync
              </p>
            </div>
          </div>
        </div>

        {/* Global Admin Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 bg-lime hover:bg-lime/80 text-brutal font-extrabold text-xs px-3.5 py-2.5 rounded-xl border-2 border-brutal shadow-brutal-sm cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Input Cash / Komitmen</span>
          </button>

          <button
            onClick={() => setShowQrisModal(true)}
            className="flex items-center gap-1.5 bg-comic-yellow hover:bg-comic-yellow/80 text-brutal font-extrabold text-xs px-3.5 py-2.5 rounded-xl border-2 border-brutal shadow-brutal-sm cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>📄 Impor QRIS (PDF)</span>
          </button>

          <button
            onClick={() => setShowExcelModal(true)}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl border-2 border-brutal shadow-brutal-sm cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📊 Impor Excel</span>
          </button>

          <button
            onClick={() => setShowSlideModal(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-stone-100 text-stone-900 font-extrabold text-xs px-3.5 py-2.5 rounded-xl border-2 border-brutal shadow-brutal-sm cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
          >
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            <span>📸 Slide Kegiatan</span>
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl border-2 border-brutal shadow-brutal-sm cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
            title="Rekapitulasi Donasi & Cetak / Simpan PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Rekap PDF Laporan</span>
          </button>

          <button
            onClick={() => { window.location.href = '/api/admin/donations/export-excel'; }}
            className="flex items-center gap-1.5 bg-white hover:bg-lime/20 text-brutal font-bold text-xs px-3.5 py-2.5 rounded-xl border-2 border-brutal shadow-brutal-sm cursor-pointer"
            title="Unduh seluruh donasi sebagai file Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={refetchAdmin}
            className="flex items-center gap-1 bg-white hover:bg-gray-100 text-gray-600 font-semibold text-xs px-2.5 py-2 rounded-xl border-2 border-brutal cursor-pointer"
            title="Muat ulang data dari database"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={logoutAdmin}
            className="flex items-center gap-1.5 bg-forest hover:bg-forest/90 text-white font-bold text-xs px-3.5 py-2 rounded-xl border-2 border-brutal shadow-brutal-sm cursor-pointer"
            title="Kembali ke layar Kiosk utama"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Ke Kiosk</span>
          </button>
        </div>
      </div>
      {/* KPI Cards (Dibagi Rapi Berdasarkan Jenis Transaksi) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-white border-2 border-brutal rounded-2xl p-4 shadow-brutal">
          <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
            Total Dana Terverifikasi
          </span>
          <span className="font-mono text-2xl font-black text-forest block">
            {formatRupiah(currentAmount)}
          </span>
          <span className="text-[11px] font-semibold text-gray-600">
            Target {formatRupiah(campaign.targetAmount || 500000000)}
          </span>
        </div>

        <div className="bg-white border-2 border-brutal rounded-2xl p-4 shadow-brutal">
          <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
            📄 Total QRIS (PDF)
          </span>
          <span className="font-mono text-2xl font-black text-forest block">
            {formatRupiah(qrisTotal)}
          </span>
          <span className="text-[11px] font-semibold text-gray-600">
            {qrisList.length} Transaksi QRIS
          </span>
        </div>

        <div className="bg-white border-2 border-brutal rounded-2xl p-4 shadow-brutal">
          <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
            💵 Total Cash / Tunai
          </span>
          <span className="font-mono text-2xl font-black text-forest block">
            {formatRupiah(cashTotal)}
          </span>
          <span className="text-[11px] font-semibold text-gray-600">
            {cashList.length} Donasi Tunai
          </span>
        </div>

        <div className="bg-white border-2 border-brutal rounded-2xl p-4 shadow-brutal">
          <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
            🤝 Komitmen / Book
          </span>
          <span className="font-mono text-2xl font-black text-comic-yellow block">
            {formatRupiah(committedTotal)}
          </span>
          <span className="text-[11px] font-semibold text-gray-600 block">
            {committedList.length} Donatur Komitmen
          </span>
          <span className="text-[11px] font-semibold block mt-0.5">
            <span className="text-forest">💰 {formatRupiah(committedPaidTotal)} sudah donasi ({committedPaidList.length})</span>
            <span className="text-gray-400"> • </span>
            <span className="text-amber-600">⏳ {committedUnpaidList.length} belum</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs Jenis Transaksi & Kotak Pencarian Audit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 border-brutal transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-forest text-white shadow-brutal-sm'
              : 'bg-white text-gray-700'
          }`}
        >
          Semua ({donations.length})
        </button>

        <button
          onClick={() => setActiveFilter('qris')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 border-brutal transition-all cursor-pointer ${
            activeFilter === 'qris'
              ? 'bg-comic-yellow text-brutal shadow-brutal-sm'
              : 'bg-white text-gray-700'
          }`}
        >
          📄 QRIS PDF ({qrisList.length})
        </button>

        <button
          onClick={() => setActiveFilter('cash')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 border-brutal transition-all cursor-pointer ${
            activeFilter === 'cash'
              ? 'bg-lime text-brutal shadow-brutal-sm'
              : 'bg-white text-gray-700'
          }`}
        >
          💵 Cash / Tunai ({cashList.length})
        </button>

        <button
          onClick={() => setActiveFilter('committed')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 border-brutal transition-all cursor-pointer ${
            activeFilter === 'committed'
              ? 'bg-amber-300 text-brutal shadow-brutal-sm'
              : 'bg-white text-gray-700'
          }`}
        >
          🤝 Komitmen / Book ({committedList.length})
        </button>

        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 border-brutal transition-all cursor-pointer ${
            activeFilter === 'pending'
              ? 'bg-stone-800 text-white shadow-brutal-sm'
              : 'bg-white text-gray-700'
          }`}
        >
          ⏳ Pending ({pendingDonations.length})
        </button>

        <button
          onClick={() => setActiveFilter('verified')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 border-brutal transition-all cursor-pointer ${
            activeFilter === 'verified'
              ? 'bg-lime text-brutal shadow-brutal-sm'
              : 'bg-white text-gray-700'
          }`}
        >
          ✅ Terverifikasi ({adminVerifiedDonations.length})
        </button>

        <button
          onClick={() => setActiveFilter('rejected')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 border-brutal transition-all cursor-pointer ${
            activeFilter === 'rejected'
              ? 'bg-error text-white shadow-brutal-sm'
              : 'bg-white text-gray-700'
          }`}
        >
          ❌ Ditolak ({rejectedDonations.length})
        </button>
        </div>
        {/* Search Input for Audit & Filter */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari donatur / ref / file PDF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-brutal rounded-xl text-xs font-semibold outline-none focus:border-forest"
          />
        </div>
      </div>

      {/* Donations List / Table */}
      <div className="bg-white border-[2.5px] border-brutal rounded-3xl p-4 sm:p-6 shadow-brutal">
        {filteredList.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-bold text-gray-500 text-sm">
              Tidak ada donasi dalam kategori ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className="bg-mint/40 border-2 border-brutal rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-brutal" title="Nama asli pengirim dari rekening/aplikasi">
                      {item.donorName}
                    </span>
                    {item.isAnonymous && (
                      <span className="bg-bubble text-forest font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-forest" title="Nama asli tersimpan untuk mutasi. Di publik tampil sebagai Hamba Allah">
                        🔒 Publik: Hamba Allah
                      </span>
                    )}
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-brutal ${
                        item.status === 'verified'
                          ? 'bg-lime text-brutal'
                          : item.status === 'rejected'
                          ? 'bg-error text-white'
                          : item.isCommitment
                          ? 'bg-comic-yellow text-brutal'
                          : 'bg-amber-200 text-brutal'
                      }`}
                    >
                      {item.isCommitment ? 'KOMITMEN / BOOK' : item.status.toUpperCase()}
                    </span>
                    {item.isCommitment && (
                      isCommittedPaid(item) ? (
                        <span className="bg-forest text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-brutal flex items-center gap-1" title="Komitmen sudah dibayar/donasi — masuk total progres">
                          💰 SUDAH DONASI
                        </span>
                      ) : item.status === 'rejected' ? (
                        <span className="bg-gray-200 text-gray-600 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-brutal" title="Komitmen ini ditolak/dibatalkan">
                          ⛔ DIBATALKAN
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-400 flex items-center gap-1" title="Komitmen belum dibayar — belum masuk total progres">
                          ⏳ BELUM DONASI
                        </span>
                      )
                    )}
                    {item.paymentMethod && (
                      <span className="bg-gray-100 text-gray-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-300">
                        {item.paymentMethod.toUpperCase()}
                      </span>
                    )}
                    {item.referenceNo && (
                      <span className="font-mono text-[10px] text-gray-500">
                        Ref: {item.referenceNo}
                      </span>
                    )}
                    {item.sourceFile && (
                      <span className="bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1" title={`Audit Log: Berasal dari dokumen ${item.sourceFile}`}>
                        <FileText className="w-2.5 h-2.5 text-emerald-700" />
                        <span className="truncate max-w-[170px]">{item.sourceFile}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1 font-mono font-semibold">
                      <Phone className="w-3.5 h-3.5 text-forest" />
                      {item.donorPhone}
                    </span>
                    <span>•</span>
                    <span>{item.createdAt}</span>
                  </div>

                  {item.prayerMessage && (
                    <p className="text-xs text-gray-700 italic bg-white/80 p-2 rounded-xl border border-brutal/20 mt-1">
                      "{item.prayerMessage}"
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                  <span className="font-mono text-lg font-black text-forest">
                    {formatRupiah(item.amount)}
                  </span>

                  {item.status === 'pending' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => approveDonation(item.id)}
                        className="flex items-center gap-1 bg-forest hover:bg-forest-dark text-white font-bold text-xs px-3 py-1.5 rounded-xl border-2 border-brutal shadow-brutal-sm cursor-pointer"
                        title="Setujui donasi dan tambahkan ke progress bar"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => rejectDonation(item.id)}
                        className="flex items-center gap-1 bg-white hover:bg-red-50 text-error font-bold text-xs px-2.5 py-1.5 rounded-xl border-2 border-brutal cursor-pointer"
                        title="Tolak donasi jika tidak ada di mutasi"
                      >
                        <X className="w-3.5 h-3.5" /> Tolak
                      </button>
                    </div>
                  )}

                  {item.isCommitment && !isCommittedPaid(item) && item.status !== 'rejected' && (
                    <button
                      onClick={() => approveDonation(item.id)}
                      className="flex items-center gap-1 bg-forest hover:bg-forest-dark text-white font-bold text-xs px-3 py-1.5 rounded-xl border-2 border-brutal shadow-brutal-sm cursor-pointer"
                      title="Tandai komitmen ini sudah dibayar/donasi — akan masuk total progres & tampil di kiosk"
                    >
                      <Check className="w-3.5 h-3.5" /> Tandai Sudah Donasi
                    </button>
                  )}
                  {!item.isCommitment && item.status === 'verified' && (
                    <span className="text-[10px] font-mono text-gray-500">
                      Disetujui: {item.verifiedAt || 'Sudah aktif'}
                    </span>
                  )}
                  {isCommittedPaid(item) && (
                    <span className="text-[10px] font-mono text-gray-500">
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
