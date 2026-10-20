import React, { useState } from 'react';
import { useDonation } from '../context/DonationContext';
import { Check, X, Download, PlusCircle, AlertCircle, Phone, RefreshCw, ShieldAlert, ArrowLeft, UserCheck, FileText, DollarSign, Calendar, Image as ImageIcon, Printer, Search, FileSpreadsheet, Wallet, Heart } from 'lucide-react';
import ManualCashModal from './ManualCashModal';
import QrisImportModal from './QrisImportModal';
import ExcelImportModal from './ExcelImportModal';
import SlideManagerModal from './SlideManagerModal';
import DonationReportPrintModal from './DonationReportPrintModal';
export default function AdminPanel() {
  const {
    donations,
    currentAmount,
    campaign,
    approveDonation,
    rejectDonation,
    currentUser,
    refetchAdmin
  } = useDonation();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'qris' | 'cash' | 'committed'
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

      {/* Top Bar Header */}
      <div className="mb-8">
        {/* First Row: Logo Satu Hati + Logo Al Azhar + Vertical Separator Line + Title Block */}
        <div className="flex flex-wrap items-center gap-y-3">
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <img
              src="/images/logo-satu-hati.png"
              alt="Satu Hati untuk Palestina"
              className="h-10 sm:h-12 w-auto object-contain shrink-0"
            />
            <div className="h-7 sm:h-9 w-[1.5px] bg-[#D5BEA1]/60 shrink-0" />
            <img
              src="/images/logo-al-azhar.png"
              alt="LAZ Al Azhar"
              className="h-9 sm:h-11 w-auto object-contain shrink-0"
            />
          </div>
          <div className="hidden sm:block h-10 sm:h-12 w-[1.5px] bg-[#D5BEA1] mx-4 sm:mx-5 shrink-0" />
          <div className="flex flex-col justify-center">
            <h1 className="font-sans font-black text-2xl sm:text-3xl text-[#1C140E] tracking-tight leading-none">
              Verifikasi Data Donatur
            </h1>
          </div>
        </div>

        {/* Second Row: Action Buttons directly below Title */}
        <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="bg-[#C66723] hover:bg-[#b0581a] text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
          >
            <span>+ Input Cash / Komitmen</span>
          </button>

          <button
            onClick={() => setShowQrisModal(true)}
            className="bg-white hover:bg-[#FDF9F5] text-[#C66723] border border-[#D5BEA1] font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
          >
            <span>📄 Impor QRIS (PDF)</span>
          </button>

          <button
            onClick={() => setShowExcelModal(true)}
            className="bg-white hover:bg-[#FDF9F5] text-emerald-700 border border-[#D5BEA1] font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
          >
            <span>📊 Impor Excel</span>
          </button>

          <button
            onClick={() => setShowSlideModal(true)}
            className="bg-white hover:bg-[#FDF9F5] text-stone-700 border border-[#D5BEA1] font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
          >
            <span>🖼️ Slide Kegiatan</span>
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="bg-[#E51E25] hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
            title="Rekapitulasi Donasi & Cetak / Simpan PDF"
          >
            <span>🖨️ Rekap PDF Laporan</span>
          </button>

          <button
            onClick={() => { window.location.href = '/api/admin/donations/export-excel'; }}
            className="bg-white hover:bg-amber-50 text-emerald-700 border border-[#D5BEA1] font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
            title="Unduh seluruh donasi sebagai file Excel (.xlsx)"
          >
            <span>📥 Ekspor Excel</span>
          </button>

          <button
            onClick={refetchAdmin}
            className="bg-white hover:bg-amber-50 text-stone-700 border border-[#D5BEA1] p-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center"
            title="Muat ulang data dari database"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI / Stat Cards (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#FDFBF7] border border-[#ECE2D2] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="w-3.5 h-3.5 text-[#8C7A6B]" />
              <span className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider block">
                TOTAL DANA TERVERIFIKASI
              </span>
            </div>
            <span className="font-sans font-black text-2xl sm:text-3xl text-[#C66723] block leading-tight">
              {formatRupiah(currentAmount)}
            </span>
          </div>
          <span className="text-xs font-semibold text-[#8C7A6B] mt-1 block">
            Target {formatRupiah(campaign.targetAmount || 500000000)}
          </span>
        </div>

        <div className="bg-[#FDFBF7] border border-[#ECE2D2] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-[#8C7A6B]" />
              <span className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider block">
                TOTAL QRIS (PDF)
              </span>
            </div>
            <span className="font-sans font-black text-2xl sm:text-3xl text-[#C66723] block leading-tight">
              {formatRupiah(qrisTotal)}
            </span>
          </div>
          <span className="text-xs font-semibold text-[#8C7A6B] mt-1 block">
            {qrisList.length} Transaksi QRIS
          </span>
        </div>

        <div className="bg-[#FDFBF7] border border-[#ECE2D2] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-[#8C7A6B]" />
              <span className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider block">
                TOTAL CASH / TUNAI
              </span>
            </div>
            <span className="font-sans font-black text-2xl sm:text-3xl text-[#C66723] block leading-tight">
              {formatRupiah(cashTotal)}
            </span>
          </div>
          <span className="text-xs font-semibold text-[#8C7A6B] mt-1 block">
            {cashList.length} Donasi Tunai
          </span>
        </div>

        <div className="bg-[#FDFBF7] border border-[#ECE2D2] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-3.5 h-3.5 text-[#8C7A6B]" />
              <span className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider block">
                KOMITMEN / BOOK
              </span>
            </div>
            <span className="font-sans font-black text-2xl sm:text-3xl text-[#C66723] block leading-tight">
              {formatRupiah(committedTotal)}
            </span>
          </div>
          <div className="mt-1">
            <span className="text-xs font-semibold text-[#8C7A6B] block">
              {committedList.length} Donatur Komitmen
            </span>
            <span className="text-xs font-semibold block mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1 align-middle"></span>
              <span className="text-emerald-700">{formatRupiah(committedPaidTotal)} sudah donasi ({committedPaidList.length})</span>
              <span className="text-[#D5BEA1]"> • </span>
              <span className="text-amber-700">⏳ {committedUnpaidList.length} belum</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-[#C66723] text-white shadow-xs border border-[#C66723]'
                : 'bg-white/90 text-[#7A6855] border border-[#E5DAC8] hover:bg-amber-50/50'
            }`}
          >
            Semua ({donations.length})
          </button>

          <button
            onClick={() => setActiveFilter('qris')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'qris'
                ? 'bg-[#C66723] text-white shadow-xs border border-[#C66723]'
                : 'bg-white/90 text-[#7A6855] border border-[#E5DAC8] hover:bg-amber-50/50'
            }`}
          >
            📄 QRIS PDF ({qrisList.length})
          </button>

          <button
            onClick={() => setActiveFilter('cash')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'cash'
                ? 'bg-[#C66723] text-white shadow-xs border border-[#C66723]'
                : 'bg-white/90 text-[#7A6855] border border-[#E5DAC8] hover:bg-amber-50/50'
            }`}
          >
            💵 Cash / Tunai ({cashList.length})
          </button>

          <button
            onClick={() => setActiveFilter('committed')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'committed'
                ? 'bg-[#C66723] text-white shadow-xs border border-[#C66723]'
                : 'bg-white/90 text-[#7A6855] border border-[#E5DAC8] hover:bg-amber-50/50'
            }`}
          >
            🤝 Komitmen / Book ({committedList.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#8C7A6B]" />
          <input
            type="text"
            placeholder="Cari donatur / ref / file PDF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5DAC8] rounded-full text-stone-800 placeholder-stone-400 focus:border-[#C66723] text-xs font-semibold outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Donations List Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ECE2D2] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {filteredList.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-bold text-[#8C7A6B] text-sm">
              Tidak ada donasi dalam kategori ini.
            </p>
          </div>
        ) : (
          <div>
            {filteredList.map((item) => (
              <div
                key={item.id}
                className="border-b border-[#F4EFE6] py-4 first:pt-0 last:border-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                <div className="space-y-1.5 max-w-2xl">
                  {/* Row 1 */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans font-black text-sm text-[#1C140E] uppercase tracking-wide">
                      {item.donorName}
                    </span>

                    {item.isAnonymous && (
                      <span className="bg-amber-50 text-[#C66723] font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#D5BEA1]" title="Nama asli tersimpan untuk mutasi. Di publik tampil sebagai Hamba Allah">
                        🔒 Publik: Hamba Allah
                      </span>
                    )}

                    {/* Badge VERIFIED / status */}
                    {item.status === 'verified' && (
                      <span className="bg-[#E8F8F0] text-[#1E8E5A] border border-[#A6E5C5] font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                        VERIFIED
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="bg-red-50 text-red-600 border border-red-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                        DITOLAK
                      </span>
                    )}
                    {item.status === 'pending' && !item.isCommitment && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                        PENDING
                      </span>
                    )}
                    {item.isCommitment && (
                      isCommittedPaid(item) ? (
                        <span className="bg-[#E8F8F0] text-[#1E8E5A] border border-[#A6E5C5] font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          💰 SUDAH DONASI
                        </span>
                      ) : item.status === 'rejected' ? (
                        <span className="bg-stone-100 text-stone-500 border border-stone-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                          ⛔ DIBATALKAN
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          ⏳ KOMITMEN (BELUM)
                        </span>
                      )
                    )}

                    {/* Payment method badge */}
                    {item.paymentMethod && (
                      <span className="bg-[#F4EFE6] text-[#7A6855] border border-[#DFD5C6] font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {item.paymentMethod.toUpperCase()}
                      </span>
                    )}

                    {/* Ref text */}
                    {item.referenceNo && (
                      <span className="font-mono text-[11px] text-[#8C7A6B]">
                        Ref: {item.referenceNo}
                      </span>
                    )}
                  </div>

                  {/* Row 2 */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#8C7A6B] font-medium">
                    {item.sourceFile && (
                      <span
                        className="bg-[#FAF6F0] text-stone-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#D5BEA1] flex items-center gap-1"
                        title={`Audit Log: Berasal dari dokumen ${item.sourceFile}`}
                      >
                        <FileText className="w-2.5 h-2.5 text-[#C66723]" />
                        <span className="truncate max-w-[200px] sm:max-w-xs">{item.sourceFile}</span>
                      </span>
                    )}

                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#C66723]" />
                      <span>{item.donorPhone || 'QRIS-MERCHANT'}</span>
                    </span>

                    <span>•</span>

                    <span>{item.createdAt}</span>
                  </div>

                  {/* Row 3: Note / prayer message in rounded-full container */}
                  {item.prayerMessage && (
                    <div className="pt-0.5">
                      <span className="bg-[#FDFBF7] border border-[#ECE2D2] rounded-full px-4 py-1 text-xs text-stone-600 italic inline-block max-w-2xl">
                        "{item.prayerMessage}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Right side: Amount & approval/verification time */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0">
                  <span className="font-sans font-black text-xl text-[#C66723]">
                    {formatRupiah(item.amount)}
                  </span>

                  {item.status === 'pending' && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        onClick={() => approveDonation(item.id)}
                        className="flex items-center gap-1 bg-[#C66723] hover:bg-[#b0581a] text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer transition-colors"
                        title="Setujui donasi dan tambahkan ke progress bar"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => rejectDonation(item.id)}
                        className="flex items-center gap-1 bg-white hover:bg-red-50 text-red-600 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-red-200 cursor-pointer transition-colors"
                        title="Tolak donasi jika tidak ada di mutasi"
                      >
                        <X className="w-3.5 h-3.5" /> Tolak
                      </button>
                    </div>
                  )}

                  {item.isCommitment && !isCommittedPaid(item) && item.status !== 'rejected' && (
                    <button
                      onClick={() => approveDonation(item.id)}
                      className="flex items-center gap-1 bg-[#C66723] hover:bg-[#b0581a] text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer transition-colors mt-1"
                      title="Tandai komitmen ini sudah dibayar/donasi — akan masuk total progres & tampil di kiosk"
                    >
                      <Check className="w-3.5 h-3.5" /> Tandai Sudah Donasi
                    </button>
                  )}

                  {!item.isCommitment && item.status === 'verified' && (
                    <span className="text-[11px] text-[#8C7A6B] font-medium">
                      Disetujui: {item.verifiedAt || 'Sudah aktif'}
                    </span>
                  )}

                  {isCommittedPaid(item) && (
                    <span className="text-[11px] text-[#8C7A6B] font-medium">
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
