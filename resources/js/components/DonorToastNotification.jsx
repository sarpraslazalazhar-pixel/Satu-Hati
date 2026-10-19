import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X } from 'lucide-react';

export default function DonorToastNotification({ donations = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const donationsRef = useRef(donations);
  donationsRef.current = donations;

  useEffect(() => {
    if (!donations || donations.length <= 1) return;

    let timeoutId;
    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        const len = donationsRef.current?.length || 0;
        if (len > 1) {
          setCurrentIndex((prev) => {
            let next = prev;
            while (next === prev) {
              next = Math.floor(Math.random() * len);
            }
            return next;
          });
        }
        setIsDismissed(false);
        scheduleNext();
      }, 5000);
    };

    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, [donations && donations.length > 1]);

  if (!donations || donations.length === 0 || isDismissed) return null;

  const currentDonor = donations[currentIndex % donations.length];
  if (!currentDonor) return null;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:right-6 lg:right-8 z-40 pointer-events-none select-none w-72 sm:w-80 max-w-[85vw] hidden md:block">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDonor.id ? `${currentDonor.id}-${currentIndex}` : currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="pointer-events-auto bg-white/98 backdrop-blur-md border border-stone-200/90 rounded-2xl p-3 shadow-xl relative overflow-hidden"
        >
          {/* Header pill */}
          <div className="flex items-center justify-between pb-1.5 border-b border-stone-100 mb-2">
            <span className="bg-[#E51E25] text-white text-[9.5px] font-poster font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Donasi Masuk</span>
            </span>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer p-0.5 -mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Profile & Amount */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <h4 className="font-poster font-black text-xs sm:text-sm text-[#1C140E] truncate leading-tight">
                {currentDonor.donorName || 'Hamba Allah'}
              </h4>
              <span className="text-[9.5px] text-stone-400 block mt-0.5 truncate leading-none">
                {currentDonor.isCommitment ? 'Komitmen Donasi' : currentDonor.paymentMethod === 'cash' ? 'Infaq Tunai - Danamon LAZ Al Azhar' : 'Infaq QRIS - Danamon LAZ Al Azhar'}
              </span>
            </div>

            <div className="text-right shrink-0">
              <span className="font-mono font-bold text-xs sm:text-sm text-[#C66723] block leading-none">
                {formatRupiah(currentDonor.amount)}
              </span>
            </div>
          </div>

          {/* 5-second progress countdown bar */}
          <div className="relative w-full h-0.5 bg-stone-100 rounded-full overflow-hidden mt-2.5">
            <motion.div
              key={`line-${currentIndex}`}
              className="h-full bg-[#C66723] rounded-full"
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
