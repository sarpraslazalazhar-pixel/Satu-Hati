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
      setSuccessMsg(res.message || 'Donasi berhasil dicatat!');
      setTimeout(() => {
        setDonorName('');
        setDonorPhone('');
        setAmount('');
        setIsCommitment(false);
        setPrayerMessage('');
        setSuccessMsg('');
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message || 'Gagal menyimpan donasi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-brutal/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-[3px] border-brutal rounded-3xl p-4 sm:p-7 max-w-lg w-full shadow-brutal-lg animate-in zoom-in-95 my-6 sm:my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-brutal mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-lime border-2 border-brutal flex items-center justify-center font-bold text-lg shadow-brutal-sm">
              💵
            </div>
            <div>
              <h3 className="font-display text-xl sm:text-2xl text-forest leading-none">
                INPUT DONASI CASH / MANUAL
              </h3>
              <p className="text-xs text-gray-600 font-semibold mt-1">
                Penerimaan tunai langsung atau komitmen donatur • Amil LAZ Al Azhar Peduli
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 sm:w-8 sm:h-8 shrink-0 rounded-full border-2 border-brutal flex items-center justify-center hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mb-4 bg-error/10 border-2 border-error text-error text-xs font-bold rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 bg-lime/20 border-2 border-forest text-forest text-xs font-bold rounded-xl p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Checkbox: Komitmen / Book */}
          <div className="bg-comic-yellow/20 border-2 border-brutal rounded-2xl p-3.5 flex items-start gap-3">
            <input
              type="checkbox"
              id="isCommitment"
              checked={isCommitment}
              onChange={(e) => setIsCommitment(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-2 border-brutal text-forest focus:ring-forest cursor-pointer accent-forest"
            />
            <label htmlFor="isCommitment" className="text-sm sm:text-xs font-bold text-brutal cursor-pointer select-none">
              <span className="block text-sm font-extrabold text-forest">
                Akan Berdonasi / Komitmen / Book
              </span>
              <span className="text-gray-600 font-medium block mt-0.5">
                Centang jika donatur baru berjanji/komitmen (belum bayar tunai sekarang). Nomor telepon wajib diisi untuk follow-up.
              </span>
            </label>
          </div>

          {/* Nama / Sumber */}
          <div>
            <label className="block text-sm sm:text-xs font-bold text-brutal mb-1">
              Nama / Sumber Donatur *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                placeholder="cth: Bpk. H. Rahmat / Hamba Allah / Siswa Kelas 9A"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                autoComplete="name"
                enterkeyhint="next"
                className="w-full pl-9 pr-3 py-3 sm:py-2.5 border-2 border-brutal rounded-xl text-base sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-forest"
                required
              />
            </div>
          </div>

          {/* Tanggal & Waktu */}
          <div>
            <label className="block text-sm sm:text-xs font-bold text-brutal mb-1">
              Tanggal & Waktu Transaksi *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="datetime-local"
                value={donatedAt}
                onChange={(e) => setDonatedAt(e.target.value)}
                className="w-full pl-9 pr-3 py-3 sm:py-2.5 border-2 border-brutal rounded-xl text-base sm:text-sm font-mono font-semibold outline-none focus:ring-2 focus:ring-forest"
                required
              />
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-sm sm:text-xs font-bold text-brutal mb-1">
              Nominal Donasi (Rp) *
            </label>
            <div className="relative mb-2">
              <span className="absolute left-3.5 top-2.5 font-mono font-bold text-sm text-gray-500">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="100.000"
                value={amount ? Number(amount).toLocaleString('id-ID') : ''}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                enterkeyhint="next"
                className="w-full pl-11 pr-3 py-3 sm:py-2.5 border-2 border-brutal rounded-xl text-base font-mono font-extrabold outline-none focus:ring-2 focus:ring-forest"
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
                  className="text-sm sm:text-[11px] font-mono font-bold px-3 py-2.5 sm:px-2 sm:py-1 min-h-[40px] sm:min-h-0 bg-mint/50 hover:bg-comic-yellow border border-brutal rounded-lg cursor-pointer transition-colors"
                >
                  {(q / 1000).toLocaleString('id-ID')}rb
                </button>
              ))}
            </div>
          </div>

          {/* Nomor HP */}
          <div>
            <label className="block text-sm sm:text-xs font-bold text-brutal mb-1">
              Nomor WhatsApp / HP {isCommitment ? <span className="text-error font-extrabold">(Wajib untuk Komitmen) *</span> : <span className="text-gray-500 font-normal">(Opsional)</span>}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="tel"
                placeholder="cth: 081234567890"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                autoComplete="tel"
                enterkeyhint="next"
                className={`w-full pl-9 pr-3 py-3 sm:py-2.5 border-2 border-brutal rounded-xl text-base sm:text-sm font-mono font-semibold outline-none focus:ring-2 ${
                  isCommitment ? 'border-comic-yellow focus:ring-comic-yellow bg-comic-yellow/5' : 'focus:ring-forest'
                }`}
                required={isCommitment}
              />
            </div>
          </div>

          {/* Doa / Pesan */}
          <div>
            <label className="block text-sm sm:text-xs font-bold text-brutal mb-1">
              Doa / Catatan <span className="text-gray-500 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <textarea
                rows="2"
                placeholder="Semoga berkah dan menjadi amal jariyah terbaik..."
                value={prayerMessage}
                onChange={(e) => setPrayerMessage(e.target.value)}
                className="w-full pl-9 pr-3 py-3 sm:py-2 border-2 border-brutal rounded-xl text-base sm:text-xs outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 sm:px-4 py-3.5 sm:py-2.5 border-2 border-brutal rounded-xl text-sm sm:text-xs font-bold hover:bg-gray-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-5 sm:px-5 py-3.5 sm:py-2.5 border-2 border-brutal rounded-xl text-sm sm:text-xs font-extrabold text-white shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isCommitment ? 'bg-forest hover:bg-forest/90' : 'bg-forest hover:bg-forest/90'
              }`}
            >
              {isSubmitting ? 'Menyimpan...' : isCommitment ? 'Simpan Komitmen' : 'Simpan & Verifikasi'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
