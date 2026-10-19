import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, HandHeart, BookOpen } from 'lucide-react';
import { useDonation } from '../context/DonationContext';
import useCountUp from '../hooks/useCountUp';
import ActivitySlideshow from './ActivitySlideshow';
import DonorFeedList from './DonorFeedList';
import DonorToastNotification from './DonorToastNotification';
import DonationCelebrationPopup from './DonationCelebrationPopup';

export default function SinglePageKiosk() {
  const { campaign, currentAmount, verifiedDonations } = useDonation();
  const animatedAmount = useCountUp(currentAmount, 1400);
  const [isBumping, setIsBumping] = useState(false);
  const prevAmountRef = useRef(currentAmount);

  // Saat total naik: tampilkan efek pop + glow sementara.
  useEffect(() => {
    if (currentAmount > prevAmountRef.current) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 1400);
      prevAmountRef.current = currentAmount;
      return () => clearTimeout(timer);
    }
    prevAmountRef.current = currentAmount;
  }, [currentAmount]);

  const targetAmt = campaign.targetAmount || 500000000;
  const pct = Math.min(100, Math.max(0, (currentAmount / targetAmt) * 100));
  const displayPercentage = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const amountText = formatRupiah(animatedAmount);

  // Auto-fit nominal: ukuran huruf = lebar kartu / panjang teks.
  // Selalu sebesar mungkin tanpa pernah keluar kartu, di layar berapapun.
  // Faktor 0.64 = lebar karakter monospace (0.6) + 6% cadangan untuk efek pop.
  const amountWrapRef = useRef(null);
  const [amountFontSize, setAmountFontSize] = useState(96);

  useLayoutEffect(() => {
    const wrap = amountWrapRef.current;
    if (!wrap) return undefined;

    const calc = () => {
      const avail = wrap.clientWidth;
      if (!avail) return;
      const size = Math.min(148, Math.floor(avail / (amountText.length * 0.64)));
      setAmountFontSize(Math.max(40, size));
    };

    calc();
    window.addEventListener('resize', calc);

    return () => window.removeEventListener('resize', calc);
  }, [amountText]);

  return (
    <div
      className="kiosk-bg w-full min-h-screen md:h-screen md:max-h-screen md:overflow-hidden relative select-none font-sans text-white bg-black"
      style={{
        backgroundImage: "url('/images/bg-palestina.webp?v=7')"
      }}
    >
      {/* 1. ANIMATED FIRE EMBERS SVG OVERLAY */}
      <img
        src="/images/fire-embers.svg"
        alt="Fire embers animation"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0 opacity-60"
      />

      {/* 2. AMBIENT LIGHTING GLOWS (Menghilangkan kesan gelap gulita) */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-emerald-500/15 rounded-full blur-[110px] pointer-events-none z-0" />
      <div className="absolute top-[42%] right-[18%] w-[400px] h-[300px] bg-red-600/12 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] left-[20%] w-[420px] h-[280px] bg-emerald-600/15 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* 2. CALLOUT PADA BADAN ANAK (Di Atas Dokumen Kegiatan) */}
      <div className="absolute left-[3%] top-[51%] z-10 pointer-events-none select-none max-w-[22%] hidden md:block">
        <h3 className="font-script text-2xl sm:text-3xl lg:text-[34px] text-white tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] leading-tight transform -rotate-3">
          Palestina Menangis,
        </h3>
        <div className="font-marker text-2xl sm:text-3xl lg:text-[34px] text-red-500 tracking-wider drop-shadow-[0_2px_14px_rgba(239,68,68,0.9)] leading-tight transform -rotate-2 -mt-1">
          Kita Peduli
          <div className="h-1 sm:h-1.5 w-32 bg-gradient-to-r from-red-500 via-rose-500 to-transparent rounded-full mt-1" />
        </div>
      </div>

      {/* 3. DOKUMEN KEGIATAN DI BAWAH BADAN ANAK */}
      <div className="absolute left-[2.5%] bottom-[3.5%] z-20 w-[22%] max-w-[320px] h-[34%] max-h-[250px] hidden md:block">
        <ActivitySlideshow />
      </div>

      {/* 4. CENTER CONTENT CONTAINER (Diposisikan Ditengah Sempurna & Lebar Maksimal) */}
      <div className="relative z-10 w-[98%] md:w-[62%] lg:w-[60%] max-w-[1100px] md:h-full flex flex-col justify-center py-4 md:py-2 my-auto mx-auto">
        {/* ========================================================
            MAIN CONTENT: ROW 1 (TOTAL DONASI MAKSIMAL) + ROW 2 (2 KOLOM BESAR & LEGA)
        ======================================================== */}
        <main className="w-full flex flex-col justify-center gap-3 sm:gap-4 my-auto">
          
          {/* ROW 1: CARD TOTAL DONASI (NOMINAL SUPER RAKSASA & DI KETENGAH) */}
          <div className="w-full glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 flex flex-col items-center justify-center relative overflow-hidden shrink-0 shadow-2xl border border-blue-400/40 text-center">
            
            {/* Header Badges Centered */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-poster font-black px-3 py-0.5 rounded-full shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>LIVE MONITOR</span>
              </div>
              <span className="text-[11px] font-bold text-blue-100">
                Donasi Masuk Secara Real-time
              </span>
              <span className="text-blue-300/40 hidden sm:inline">•</span>
              <span className="bg-blue-500/25 text-blue-100 border border-blue-400/40 px-3.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{campaign.verifiedCount || 0} Donatur Terverifikasi</span>
              </span>
            </div>

            {/* Total Donasi Label & Amount (Nominal Raksasa Panggung) */}
            <div className="w-full flex flex-col items-center justify-center text-center my-1 sm:my-2">
              <div className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-black uppercase text-blue-200 tracking-widest">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <span>TOTAL DONASI TERKUMPUL</span>
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              </div>
              <div ref={amountWrapRef} className="w-full flex items-center justify-center text-center my-1 overflow-hidden">
                <span
                  style={{ fontSize: `${amountFontSize}px` }}
                  className={`font-mono font-black text-emerald-300 tracking-tight leading-none text-center whitespace-nowrap transition-[transform,filter,text-shadow] duration-500 ${
                    isBumping
                      ? 'scale-[1.06] drop-shadow-[0_0_70px_rgba(52,211,153,1)]'
                      : 'scale-100 drop-shadow-[0_10px_60px_rgba(52,211,153,1)]'
                  }`}
                >
                  {formatRupiah(animatedAmount)}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-1 sm:mt-2">
                <span className="text-xs sm:text-sm font-bold text-blue-100 bg-blue-950/85 border border-blue-400/40 px-4 py-1 rounded-full shadow-sm">
                  Target Donasi: <strong className="text-white font-mono font-black">{formatRupiah(targetAmt)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* ROW 2: 2 KOLOM SEJAJAR (DIPERBESAR & LEGA UNTUK LAYAR PANGGUNG) */}
          {/* HP: menumpuk vertikal, tinggi mengikuti isi. md+: grid 2 kolom seperti sebelumnya. */}
          <div className="w-full flex flex-col md:grid md:grid-cols-12 gap-3 sm:gap-4 items-stretch shrink-0 md:h-[365px] lg:h-[390px]">
            
            {/* KOLOM KIRI (6/12): LIST DONATUR (3 NAMA LEGA & AUTO-SCROLL) */}
            <div className="md:col-span-6 flex flex-col h-[38vh] md:h-full min-h-0">
              <DonorFeedList donations={verifiedDonations} />
            </div>

            {/* KOLOM KANAN (6/12): SCAN QRIS (BESAR & SEJAJAR DENGAN LIST DONATUR) */}
            <div className="md:col-span-6 flex flex-col h-auto md:h-full min-h-0">
              <div className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col justify-between h-full min-h-0 relative overflow-hidden shadow-2xl border border-blue-400/35">
                
                {/* Header Title with Heart Icon */}
                <div className="flex items-center justify-between mb-1.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-300 shadow-sm">
                      <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    </div>
                    <div>
                      <h3 className="font-poster font-black text-xs sm:text-sm text-white leading-tight">
                        Scan QRIS Donasi
                      </h3>
                      <span className="text-[9px] text-emerald-400 font-bold block leading-tight">
                        Bebas Nominal • Tanpa Struk
                      </span>
                    </div>
                  </div>
                  <span className="bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-md">
                    INSTANT
                  </span>
                </div>

                {/* QR CONTAINER (BESAR, JELAS, TINGGI SEJAJAR) */}
                <div className="flex-grow flex flex-col items-center justify-center my-auto min-h-0 py-1">
                  <div className="w-full max-w-[210px] sm:max-w-[240px] lg:max-w-[265px] aspect-square bg-white rounded-2xl sm:rounded-3xl p-3 shadow-[0_16px_48px_rgba(0,0,0,0.85),0_0_0_3px_rgba(96,165,250,0.5)] flex items-center justify-center">
                    <img
                      src="/images/qris-vector-sharp.png"
                      alt="QRIS Donasi Satu Hati Untuk Palestina"
                      className="w-full h-full object-contain"
                      loading="eager"
                    />
                  </div>
                  <div className="mt-2 text-center shrink-0 w-full px-1">
                    <span className="font-poster font-black text-xs sm:text-sm text-blue-100 tracking-wide block leading-none">
                      QRIS PEMBAYARAN
                    </span>
                    <span className="text-[9.5px] font-semibold text-blue-200/80 block mt-0.5 leading-none">
                      Satu Hati untuk Palestina • NMID: ID2025381135032
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
        <div className="h-4 sm:h-5 shrink-0" />

      </div>

      {/* 4. FLOATING POP-UP DONATUR TERBARU (5 DETIK BERGANTI - Sesuai Instruksi User) */}
      <DonorToastNotification donations={verifiedDonations} />

      {/* 5. SELEBRASI POPUP CONFETTI REALTIME SAAT AMIL INPUT DONASI */}
      <DonationCelebrationPopup />

    </div>
  );
}
