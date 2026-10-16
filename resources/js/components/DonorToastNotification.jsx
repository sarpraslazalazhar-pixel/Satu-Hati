import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, MessageSquareQuote } from 'lucide-react';

export default function DonorToastNotification({ donations = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const donationsRef = useRef(donations);
  donationsRef.current = donations;

  // Cycle every 5 seconds per donor
  useEffect(() => {
    if (!donations || donations.length <= 1) return;

    let timeoutId;
    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        const len = donationsRef.current?.length || 0;
        if (len > 1) {
          setCurrentIndex((prev) => (prev + 1) % len);
        }
        scheduleNext();
      }, 5000);
    };

    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, [donations && donations.length > 1]);
  if (!donations || donations.length === 0) return null;

  const currentDonor = donations[currentIndex % donations.length];
  if (!currentDonor) return null;

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

  return (
    /* Posisi: Di sebelah kanan di bawah gambar masjid (Sesuai Permintaan User) */
    <div className="fixed bottom-7 sm:bottom-10 right-3 sm:right-6 lg:right-8 z-40 pointer-events-none select-none w-72 sm:w-80 max-w-[85vw]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDonor.id ? `${currentDonor.id}-${currentIndex}` : currentIndex}
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30, scale: 0.95 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="pointer-events-auto bg-[#0c1932]/95 backdrop-blur-2xl border-2 border-blue-400/80 rounded-2xl p-3 shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(96,165,250,0.35)] relative overflow-hidden"
        >
            {/* Top ambient highlight */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-amber-400 to-emerald-400" />

            {/* Header info bar (Tanpa waktu masuk) */}
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 fill-red-400" />
                  <span>Donatur Masuk</span>
                </span>
              </div>
            </div>

            {/* Donor profile & Amount */}
            <div className="flex items-start justify-between gap-2.5 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-green-800 border border-emerald-400 flex items-center justify-center text-white font-poster font-black text-[10px] shadow-md shrink-0">
                  {getInitials(currentDonor.donorName)}
                </div>
                <div className="truncate">
                  <h4 className="font-poster font-black text-xs sm:text-sm text-white truncate leading-tight">
                    {currentDonor.donorName || 'Hamba Allah'}
                  </h4>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono text-[8px] font-black px-1.5 py-0.2 rounded uppercase inline-block mt-0.5">
                    {currentDonor.paymentMethod === 'qris'
                      ? 'QRIS'
                      : currentDonor.paymentMethod === 'cash'
                      ? 'TUNAI'
                      : 'ONLINE'}
                  </span>
                </div>
              </div>

              {/* Glowing Amount */}
              <div className="text-right shrink-0">
                <span className="font-mono font-black text-sm sm:text-base text-emerald-300 drop-shadow-[0_2px_12px_rgba(52,211,153,0.5)] block leading-none">
                  {formatRupiah(currentDonor.amount)}
                </span>
              </div>
            </div>

            {/* Prayer message if present */}
            {currentDonor.prayerMessage && (
              <div className="bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-[10px] text-stone-200 italic truncate mt-1 flex items-center gap-1">
                <MessageSquareQuote className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">"{currentDonor.prayerMessage}"</span>
              </div>
            )}

            {/* 5-second progress countdown bar */}
            <div className="relative w-full h-0.5 bg-stone-800 rounded-full overflow-hidden mt-2">
              <motion.div
                key={`line-${currentIndex}`}
                className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            </div>

          </motion.div>
      </AnimatePresence>
    </div>
  );
}
