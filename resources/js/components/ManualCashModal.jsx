import React, { useState } from 'react';
import { X, DollarSign, Calendar, Phone, User, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDonation } from '../context/DonationContext';

export default function ManualCashModal({ isOpen, onClose }) {
  const { submitManualCash } = useDonation();

  const getTodayDateTime = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [donatedAt, setDonatedAt] = useState(getTodayDateTime());
  const [isCommitment, setIsCommitment] = useState(false);
  const [prayerMessage, setPrayerMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

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
    const res = await submitManualCash({
      donorName: donorName.trim(),
      donorPhone: donorPhone.trim(),
      amount: Number(amount),
      donatedAt,
      isCommitment,
      prayerMessage: prayerMessage.trim()
    });
    setIsSubmitting(false);

    if (res.success) {
      setDonorName('');
      setDonorPhone('');
      setAmount('');
      setIsCommitment(false);
      setPrayerMessage('');
      setErrorMsg('');
      setSuccessMsg('');
      onClose();
    } else {
      setErrorMsg(res.message || 'Gagal menyimpan donasi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1C140E]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF7F2] border-2 border-[#D88A3E]/40 rounded-3xl p-4 sm:p-7 max-w-lg w-full shadow-2xl animate-in zoom-in-95 my-6 sm:my-8 text-[#1C140E]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DDCD] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#C66723] text-white flex items-center justify-center font-bold text-lg shadow-2xs">
              💵
            </div>
            <div>
              <h3 className="font-poster font-black text-xl sm:text-2xl text-[#1C140E] leading-none">
                INPUT DONASI
              </h3>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Checkbox: Komitmen / Book */}
          <div className="bg-[#FAF6F0] border border-[#E8DDCD] rounded-2xl p-3.5 flex items-start gap-3">
            <input
              type="checkbox"
              id="isCommitment"
              checked={isCommitment}
              onChange={(e) => setIsCommitment(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border border-[#D5BEA1] text-[#C66723] focus:ring-[#C66723] cursor-pointer accent-[#C66723]"
            />
            <label htmlFor="isCommitment" className="text-sm sm:text-xs font-bold text-[#1C140E] cursor-pointer select-none">
              <span className="block text-sm font-poster font-bold text-[#C66723]">
                Akan Berdonasi / Komitmen / Book
              </span>
              <span className="text-[#7A6855] font-medium block mt-0.5">
                Centang jika donatur baru berjanji/komitmen (belum bayar tunai sekarang). Nomor telepon wajib diisi untuk follow-up.
              </span>
            </label>
          </div>
          {/* Nama / Sumber */}
          <div>
            <label className="block text-sm sm:text-xs font-bold text-[#1C140E] mb-1">
              Nama / Sumber Donatur *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-[#7A6855]" />
              <input
                type="text"
                placeholder="cth: Bpk. H. Rahmat / Hamba Allah / Siswa Kelas 9A"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                autoComplete="name"
                enterkeyhint="next"
                className="w-full pl-9 pr-3 py-3 sm:py-2.5 bg-white border border-[#D5BEA1] rounded-xl text-base sm:text-sm font-semibold outline-none focus:border-[#C66723] focus:ring-1 focus:ring-[#C66723]"
                required
              />
            </div>
          </div>

          {/* Tanggal & Waktu */}
          <div>
            <label className="block text-sm sm:text-xs font-bold text-[#1C140E] mb-1">
              Tanggal & Waktu Transaksi *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-[#7A6855]" />
              <input
                type="datetime-local"
                value={donatedAt}
                onChange={(e) => setDonatedAt(e.target.value)}
                className="w-full pl-9 pr-3 py-3 sm:py-2.5 bg-white border border-[#D5BEA1] rounded-xl text-base sm:text-sm font-mono font-semibold outline-none focus:border-[#C66723] focus:ring-1 focus:ring-[#C66723]"
                required
              />
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-sm sm:text-xs font-bold text-[#1C140E] mb-1">
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
                enterkeyhint="next"
                className="w-full pl-11 pr-3 py-3 sm:py-2.5 bg-white border border-[#D5BEA1] rounded-xl text-base font-mono font-extrabold outline-none focus:border-[#C66723] focus:ring-1 focus:ring-[#C66723]"
                required
              />
            </div>
            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-2 sm:gap-1.5">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className="text-sm sm:text-[11px] font-mono font-bold px-3 py-2.5 sm:px-2 sm:py-1 min-h-[40px] sm:min-h-0 bg-[#FAF6F0] hover:bg-[#F5EFE6] text-[#1C140E] border border-[#D5BEA1] rounded-lg cursor-pointer transition-colors"
                >
                  {(q / 1000).toLocaleString('id-ID')}rb
                </button>
              ))}
            </div>
          </div>

          {/* Nomor HP */}
          <div>
            <label className="block text-sm sm:text-xs font-bold text-[#1C140E] mb-1">
              Nomor WhatsApp / HP {isCommitment ? <span className="text-red-600 font-extrabold">(Wajib untuk Komitmen) *</span> : <span className="text-[#7A6855] font-normal">(Opsional)</span>}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-[#7A6855]" />
              <input
                type="tel"
                placeholder="cth: 081234567890"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                autoComplete="tel"
                enterkeyhint="next"
                className={`w-full pl-9 pr-3 py-3 sm:py-2.5 bg-white border border-[#D5BEA1] rounded-xl text-base sm:text-sm font-mono font-semibold outline-none focus:border-[#C66723] focus:ring-1 focus:ring-[#C66723] ${
                  isCommitment ? 'border-[#C66723] bg-[#C66723]/5' : ''
                }`}
                required={isCommitment}
              />
            </div>
          </div>

          {/* Doa / Pesan */}
          <div>
            <label className="block text-sm sm:text-xs font-bold text-[#1C140E] mb-1">
              Doa / Catatan <span className="text-[#7A6855] font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-[#7A6855]" />
              <textarea
                rows="2"
                placeholder="Semoga berkah dan menjadi amal jariyah terbaik..."
                value={prayerMessage}
                onChange={(e) => setPrayerMessage(e.target.value)}
                className="w-full pl-9 pr-3 py-3 sm:py-2 bg-white border border-[#D5BEA1] rounded-xl text-base sm:text-xs outline-none focus:border-[#C66723] focus:ring-1 focus:ring-[#C66723]"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 border-t border-[#E8DDCD]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 sm:px-4 py-3.5 sm:py-2.5 border border-[#D5BEA1] bg-white hover:bg-amber-50/50 rounded-xl text-sm sm:text-xs font-bold text-[#7A6855] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 sm:px-5 py-3.5 sm:py-2.5 bg-[#C66723] hover:bg-[#b0581a] text-white font-poster font-bold rounded-xl shadow-sm text-sm sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? 'Menyimpan...' : isCommitment ? 'Simpan Komitmen' : 'Simpan & Verifikasi'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
