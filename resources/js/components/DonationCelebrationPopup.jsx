import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Heart, X, CheckCircle2 } from 'lucide-react';
import { useDonation } from '../context/DonationContext';

export default function DonationCelebrationPopup() {
  const { latestApprovedDonation, setLatestApprovedDonation } = useDonation();

  useEffect(() => {
    if (latestApprovedDonation) {
      // Trigger festive confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 250);
      } catch {
        // ignore
      }

      // Auto dismiss after 7 seconds
      const timer = setTimeout(() => {
        setLatestApprovedDonation(null);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [latestApprovedDonation, setLatestApprovedDonation]);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <AnimatePresence>
      {latestApprovedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop blur subtle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brutal/40 backdrop-blur-xs"
          />

          {/* Celebration Card */}
          <motion.div
            initial={{ scale: 0.8, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="relative pointer-events-auto max-w-md w-full bg-white border-[3.5px] border-brutal rounded-3xl p-6 sm:p-7 shadow-brutal-lg text-center overflow-hidden z-10"
          >
            {/* Confetti Decorative Badge */}
            <div className="inline-flex items-center gap-1.5 bg-comic-yellow text-brutal font-mono font-black text-xs px-3.5 py-1.5 rounded-full border-2 border-brutal mb-4 shadow-brutal-sm">
              <Sparkles className="w-4 h-4 fill-brutal" />
              <span>ALHAMDULILLAH! DONASI MASUK</span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setLatestApprovedDonation(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full border-2 border-brutal flex items-center justify-center hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Donor Name & Amount */}
            <div className="mb-4">
              <h3 className="font-display text-2xl sm:text-3xl text-forest tracking-wide leading-tight">
                {latestApprovedDonation.donorName || 'Hamba Allah'}
              </h3>
              <div className="font-mono text-3xl sm:text-4xl font-black text-forest mt-2">
                {formatRupiah(latestApprovedDonation.amount)}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="inline-block bg-lime text-brutal text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border border-brutal">
                  {latestApprovedDonation.paymentMethod === 'qris'
                    ? 'QRIS DANAMON'
                    : latestApprovedDonation.paymentMethod === 'cash'
                    ? 'TUNAI / CASH'
                    : 'ONLINE'}
                </span>
              </div>
            </div>

            {/* Prayer message if any */}
            {latestApprovedDonation.prayerMessage && (
              <div className="bg-mint/40 border-2 border-brutal rounded-2xl p-3 mb-4 text-xs italic text-gray-700">
                "{latestApprovedDonation.prayerMessage}"
              </div>
            )}

            <p className="text-xs text-gray-600 font-semibold mb-2">
              Jazakumullah Khairan Katsiran atas kebaikan dan kepedulian Anda.
            </p>

            {/* Dismiss CTA */}
            <button
              onClick={() => setLatestApprovedDonation(null)}
              className="w-full mt-2 bg-forest hover:bg-forest/90 text-white font-bold text-xs py-2.5 rounded-xl border-2 border-brutal shadow-brutal-sm cursor-pointer"
            >
              Tutup
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
