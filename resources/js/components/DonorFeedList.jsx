import React, { useState, useEffect } from 'react';
import { Heart, MessageSquareQuote } from 'lucide-react';

const DISPLAY_COUNT = 3;

export default function DonorFeedList({ donations = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const total = donations.length;

  useEffect(() => {
    if (total <= DISPLAY_COUNT) {
      setActiveIndex(0);
      return;
    }

    let resetTimer = null;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev + 1;
        if (next === total) {
          // Saat mencapai total (menampilkan duplikat item 0..4),
          // tunggu animasi 800ms selesai lalu snap kembali ke 0 secara mulus tanpa jeda
          resetTimer = setTimeout(() => {
            setIsResetting(true);
            setActiveIndex(0);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsResetting(false);
              });
            });
          }, 820);
        }
        return next;
      });
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(resetTimer);
    };
  }, [total]);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getInitials = (name) => {
    if (!name) return 'HA';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Buat list extended untuk seamless infinite scrolling jika donasi > 5
  const extendedList = total > DISPLAY_COUNT
    ? [...donations, ...donations.slice(0, DISPLAY_COUNT)]
    : donations;

  const L = extendedList.length;

  return (
    <div className="glass-card rounded-2xl p-2.5 sm:p-3 flex flex-col h-full min-h-0 relative overflow-hidden shadow-2xl border border-blue-400/30">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-blue-400/20 shrink-0 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-300 shadow-xs">
            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
          </div>
          <div>
            <span className="font-poster font-black text-xs sm:text-sm text-white tracking-wide uppercase block leading-none">
              DAFTAR DONATUR
            </span>
            <span className="text-[10px] font-semibold text-blue-200 block mt-0.5 leading-none">
              Tampil 3 Donatur • Auto-Scroll Real-time
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="bg-blue-500/25 text-blue-100 border border-blue-400/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
            {total} Donatur
          </span>
        </div>
      </div>

      {/* 5-Item Viewport Container (Auto-Scroll Ultra-Smooth & Presisi) */}
      <div className="flex-grow relative overflow-hidden min-h-0 w-full select-none">
        {total === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-red-400 mb-2">
              <Heart className="w-5 h-5 fill-red-500/20" />
            </div>
            <p className="text-xs font-bold text-stone-300">Belum Ada Donasi</p>
            <span className="text-[10px] text-stone-400 mt-0.5">
              Donasi Anda akan langsung tercatat dan tampil di sini!
            </span>
          </div>
        ) : (
          <div
            className="w-full flex flex-col will-change-transform"
            style={{
              height: `${(L / DISPLAY_COUNT) * 100}%`,
              transform: `translate3d(0, -${(activeIndex / L) * 100}%, 0)`,
              transition: isResetting ? 'none' : 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {extendedList.map((donor, idx) => (
              <div
                key={`donor-${donor.id || idx}-${idx}`}
                className="w-full px-0.5 py-1 box-border flex flex-col justify-center"
                style={{ height: `${(1 / L) * 100}%` }}
              >
                <div className="bg-[#0e1d3b]/85 hover:bg-[#162b54]/95 border border-blue-400/25 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-center h-full shadow-xs transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-300 flex items-center justify-center text-white font-poster font-black text-xs sm:text-sm shrink-0 shadow-xs">
                        {getInitials(donor.donorName)}
                      </div>
                      <div className="min-w-0 truncate">
                        <h5 className="font-poster font-black text-xs sm:text-sm text-white truncate leading-tight">
                          {donor.donorName || 'Hamba Allah'}
                        </h5>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="bg-blue-500/25 text-blue-200 border border-blue-400/40 font-mono text-[8px] font-black px-2 py-0.2 rounded uppercase">
                            {donor.isCommitment ? 'KOMITMEN' : donor.paymentMethod === 'cash' ? 'TUNAI' : donor.paymentMethod === 'qris' ? 'QRIS' : 'ONLINE'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-sm sm:text-base lg:text-lg text-emerald-300 tracking-tight block leading-tight drop-shadow-[0_2px_8px_rgba(52,211,153,0.55)]">
                        {formatRupiah(donor.amount)}
                      </span>
                    </div>
                  </div>

                  {donor.prayerMessage && (
                    <div className="mt-1.5 bg-blue-950/50 border border-blue-400/20 rounded-lg px-2 py-1 text-[10.5px] sm:text-xs text-blue-100 italic flex items-center gap-1.5 truncate">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">"{donor.prayerMessage}"</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
