import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Phone, Mail, User, MessageSquare, AlertCircle, CheckCircle2, ShieldCheck, Tag, FileText, Check } from 'lucide-react';
import { useDonation } from '../context/DonationContext';

export default function EditDonationModal({ isOpen, onClose, donation }) {
  const { updateDonation } = useDonation();

  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [status, setStatus] = useState('verified');
  const [donatedAt, setDonatedAt] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [isCommitment, setIsCommitment] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [prayerMessage, setPrayerMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (donation) {
      setDonorName(donation.donorName || '');
      setDonorPhone(donation.donorPhone || '');
      setDonorEmail(donation.donorEmail || '');
      setAmount(donation.amount ? String(donation.amount) : '');
      setPaymentMethod(donation.paymentMethod || 'cash');
      setStatus(donation.status || 'verified');
      setReferenceNo(donation.referenceNo || '');
      setIsCommitment(Boolean(donation.isCommitment));
      setIsAnonymous(Boolean(donation.isAnonymous));
      setPrayerMessage(donation.prayerMessage || '');

      // Format donatedAt to YYYY-MM-DDTHH:mm if exists
      if (donation.donatedAt) {
        // e.g. "2026-10-16 10:00" -> "2026-10-16T10:00"
        const formatted = donation.donatedAt.replace(' ', 'T').slice(0, 16);
        setDonatedAt(formatted);
      } else {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        setDonatedAt(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
      }

      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [donation, isOpen]);

  if (!isOpen || !donation) return null;

  const quickAmounts = [25000, 50000, 100000, 250000, 500000, 1000000, 5000000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!donorName.trim()) {
      setErrorMsg('Nama atau sumber donasi wajib diisi.');
      return;
    }

    if (!amount || Number(amount) < 1000) {
      setErrorMsg('Nominal minimal Rp 1.000.');
      return;
    }

    if (isCommitment && !donorPhone.trim()) {
      setErrorMsg('Nomor telepon wajib diisi untuk donasi berstatus Komitmen / Book.');
      return;
    }

    setIsSubmitting(true);
    const res = await updateDonation(donation.id, {
      donorName: donorName.trim(),
      donorPhone: donorPhone.trim(),
      donorEmail: donorEmail.trim(),
      amount: Number(amount),
      paymentMethod,
      status,
      donatedAt,
      referenceNo: referenceNo.trim(),
      isCommitment,
      isAnonymous,
      prayerMessage: prayerMessage.trim()
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Data donasi berhasil diperbarui!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMsg(res.message || 'Gagal menyimpan perubahan donasi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1C140E]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF7F2] border-2 border-[#D88A3E]/40 rounded-3xl p-4 sm:p-7 max-w-lg w-full shadow-2xl animate-in zoom-in-95 my-6 sm:my-8 text-[#1C140E] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DDCD] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#C66723] text-white flex items-center justify-center font-bold text-lg shadow-2xs">
              ✏️
            </div>
            <div>
              <h3 className="font-poster font-black text-xl sm:text-2xl text-[#1C140E] leading-none">
                EDIT DATA DONASI
              </h3>
              <p className="text-xs text-[#7A6855] font-semibold mt-0.5">
                ID #{donation.id} {donation.referenceNo ? `• Ref: ${donation.referenceNo}` : ''}
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

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-700 text-xs font-bold rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Source file info badge if exists */}
        {donation.sourceFile && (
          <div className="mb-4 bg-amber-50/70 border border-[#D5BEA1] rounded-xl p-2.5 flex items-center gap-2 text-xs text-[#7A6855]">
            <FileText className="w-4 h-4 text-[#C66723] shrink-0" />
            <div className="truncate">
              <span className="font-bold text-[#1C140E]">File Impor: </span>
              <span className="font-mono">{donation.sourceFile}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Status Donasi Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1C140E] mb-1.5">
              Status Donasi *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('verified')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  status === 'verified'
                    ? 'bg-[#E8F8F0] text-[#1E8E5A] border-[#A6E5C5] shadow-xs'
                    : 'bg-white text-[#7A6855] border-[#E5DAC8] hover:bg-stone-50'
                }`}
              >
                <Check className="w-3.5 h-3.5" /> VERIFIED
              </button>
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
                    : 'bg-white text-[#7A6855] border-[#E5DAC8] hover:bg-stone-50'
                }`}
              >
                ⏳ PENDING
              </button>
              <button
                type="button"
                onClick={() => setStatus('rejected')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  status === 'rejected'
                    ? 'bg-red-50 text-red-600 border-red-300 shadow-xs'
                    : 'bg-white text-[#7A6855] border-[#E5DAC8] hover:bg-stone-50'
                }`}
              >
                ⛔ DITOLAK
              </button>
            </div>
            <p className="text-[11px] text-[#8C7A6B] mt-1 font-medium">
              {status === 'verified' && 'Donasi aktif di total progres dan dinding doa publik.'}
              {status === 'pending' && 'Donasi masuk antrean verifikasi panitia.'}
              {status === 'rejected' && 'Donasi ditolak dan tidak dihitung dalam capaian progres.'}
            </p>
          </div>

          {/* Nama Donatur */}
          <div>
            <label className="block text-xs font-bold text-[#1C140E] mb-1">
              Nama / Sumber Donatur *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-[#7A6855]" />
              <input
                type="text"
                placeholder="Nama donatur"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D5BEA1] rounded-xl text-sm font-semibold outline-none focus:border-[#C66723] focus:ring-1 focus:ring-[#C66723]"
                required
              />
            </div>
          </div>

          {/* Nominal Donasi */}
          <div>
            <label className="block text-xs font-bold text-[#1C140E] mb-1">
              Nominal Donasi (Rp) *
            </label>
            <div className="relative mb-2">
              <span className="absolute left-3.5 top-2.5 font-mono font-bold text-sm text-[#7A6855]">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="100.000"
                value={amount ? Number(amount).toLocaleString('id-ID') : ''}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-11 pr-3 py-2.5 bg-white border border-[#D5BEA1] rounded-xl text-base font-sans font-black text-[#C66723] outline-none focus:border-[#C66723] focus:ring-1 focus:ring-[#C66723]"
                required
              />
            </div>

            {/* Quick nominal buttons */}
            <div className="flex flex-wrap gap-1.5">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-white hover:bg-amber-50 border border-[#D5BEA1] text-[#7A6855] hover:text-[#C66723] rounded-lg transition-colors cursor-pointer"
                >
                  {(q / 1000).toLocaleString('id-ID')}k
                </button>
              ))}
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-xs font-bold text-[#1C140E] mb-1">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'cash', label: '💵 Cash / Tunai' },
                { key: 'qris', label: '📱 QRIS' },
                { key: 'online', label: '🌐 Online / Transfer' }
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    paymentMethod === m.key
                      ? 'bg-[#C66723] text-white border-[#C66723] shadow-xs'
                      : 'bg-white text-[#7A6855] border-[#E5DAC8] hover:bg-amber-50/50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nomor WhatsApp & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1C140E] mb-1">
                No. HP / WhatsApp {isCommitment && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-[#7A6855]" />
                <input
                  type="tel"
                  placeholder="0812xxxx"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D5BEA1] rounded-xl text-sm font-semibold outline-none focus:border-[#C66723] focus:ring-1 focus:ring-[#C66723]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C140E] mb-1">
                Email Donatur (Opsional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-[#7A6855]" />
                <input
                  type="email"
                  placeholder="donatur@email.com"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D5BEA1] rounded-xl text-sm font-semibold outline-none focus:border-[#C66723] focus:ring-1 focus:ring-[#C66723]"
                />
              </div>
            </div>
          </div>

          {/* Tanggal & Waktu & No Referensi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1C140E] mb-1">
                Tanggal & Waktu Transaksi
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-[#7A6855]" />
                <input
                  type="datetime-local"
                  value={donatedAt}
                  onChange={(e) => setDonatedAt(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D5BEA1] rounded-xl text-xs font-mono font-semibold outline-none focus:border-[#C66723] focus:ring-1 focus:ring-[#C66723]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C140E] mb-1">
                Nomor Referensi Transaksi
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-3 text-[#7A6855]" />
                <input
                  type="text"
                  placeholder="cth: QRIS-982348"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D5BEA1] rounded-xl text-xs font-mono font-semibold outline-none focus:border-[#C66723] focus:ring-1 focus:ring-[#C66723]"
                />
              </div>
            </div>
          </div>

          {/* Checkboxes: Komitmen & Anonim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-[#FAF6F0] border border-[#E8DDCD] rounded-2xl p-3 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="editIsCommitment"
                checked={isCommitment}
                onChange={(e) => setIsCommitment(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border border-[#D5BEA1] text-[#C66723] focus:ring-[#C66723] cursor-pointer accent-[#C66723]"
              />
              <label htmlFor="editIsCommitment" className="text-xs font-bold text-[#1C140E] cursor-pointer select-none">
                <span className="block text-[#C66723]">Komitmen / Book</span>
                <span className="text-[11px] text-[#7A6855] font-normal block mt-0.5">
                  Berjanji berdonasi (belum lunas)
                </span>
              </label>
            </div>

            <div className="bg-[#FAF6F0] border border-[#E8DDCD] rounded-2xl p-3 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="editIsAnonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border border-[#D5BEA1] text-[#C66723] focus:ring-[#C66723] cursor-pointer accent-[#C66723]"
              />
              <label htmlFor="editIsAnonymous" className="text-xs font-bold text-[#1C140E] cursor-pointer select-none">
                <span className="block text-[#1C140E]">Samarkan Nama</span>
                <span className="text-[11px] text-[#7A6855] font-normal block mt-0.5">
                  Tampil 'Hamba Allah' di Kiosk
                </span>
              </label>
            </div>
          </div>

          {/* Pesan Doa / Catatan Amil */}
          <div>
            <label className="block text-xs font-bold text-[#1C140E] mb-1">
              Pesan Doa / Catatan Amil
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-[#7A6855]" />
              <textarea
                placeholder="Pesan doa untuk Palestina / catatan transaksi..."
                value={prayerMessage}
                onChange={(e) => setPrayerMessage(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D5BEA1] rounded-xl text-xs font-medium outline-none focus:border-[#C66723] focus:ring-1 focus:ring-[#C66723] resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E8DDCD]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-[#D5BEA1] text-xs font-bold text-[#7A6855] hover:bg-stone-100 cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#C66723] hover:bg-[#b0581a] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
