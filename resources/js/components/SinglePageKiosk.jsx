import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { useDonation } from '../context/DonationContext';
import useCountUp from '../hooks/useCountUp';
import SandParticleOverlay from './SandParticleOverlay';
import DonorFeedList from './DonorFeedList';
import DonorToastNotification from './DonorToastNotification';
import DonationCelebrationPopup from './DonationCelebrationPopup';

const DEFAULT_NEWS = [
  {
    id: 'd1',
    badge_text: 'AKSI KEMANUSIAAN',
    title: 'Penyaluran Bantuan Kemanusiaan LAZ Al Azhar',
    image_path: '/images/hero-figure.webp'
  },
  {
    id: 'd2',
    badge_text: 'AKSI KEMANUSIAAN',
    title: 'Distribusi Pangan Darurat & Air Bersih di Gaza',
    image_path: '/images/bg-desert.webp'
  },
  {
    id: 'd3',
    badge_text: 'AKSI KEMANUSIAAN',
    title: 'Dukungan Fasilitas Medis & Relawan Kemanusiaan',
    image_path: '/images/hero-figure.webp'
  }
];

export default function SinglePageKiosk() {
  const { campaign, currentAmount, verifiedDonations } = useDonation();
  const animatedAmount = useCountUp(currentAmount, 1400);
  const [isBumping, setIsBumping] = useState(false);
  const prevAmountRef = useRef(currentAmount);
  const [newsList, setNewsList] = useState(DEFAULT_NEWS);

  useEffect(() => {
    fetch('/api/activity-slides', { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((data) => {
        const slides = data.slides || (Array.isArray(data) ? data : data.data || []);
        if (slides.length > 0) setNewsList(slides.slice(0, 3));
      })
      .catch(() => {});
  }, []);

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

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const amountText = formatRupiah(animatedAmount);

  const amountWrapRef = useRef(null);
  const [amountFontSize, setAmountFontSize] = useState(72);

  useLayoutEffect(() => {
    const wrap = amountWrapRef.current;
    if (!wrap) return undefined;

    const calc = () => {
      const avail = wrap.clientWidth;
      if (!avail) return;
      const size = Math.min(76, Math.floor(avail / (amountText.length * 0.58)));
      setAmountFontSize(Math.max(32, size));
    };

    calc();
    window.addEventListener('resize', calc);

    return () => window.removeEventListener('resize', calc);
  }, [amountText]);

  return (
    <div
      className="kiosk-bg w-full min-h-screen relative select-none font-sans text-[#1C140E] bg-[#EFE8DD] flex flex-col justify-between pt-2 sm:pt-3 pb-3 sm:pb-5 px-3 sm:px-5 lg:px-6"
      style={{
        backgroundImage: "url('/images/bg-desert.webp')",
        backgroundPosition: 'center bottom'
      }}
    >
      {/* Light warm desert wash overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EFE8DD]/25 via-transparent to-transparent pointer-events-none z-0" />

      {/* 1. Animated Sand Particle Overlay */}
      <SandParticleOverlay />

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-[1120px] mx-auto flex flex-col my-auto pt-0 pb-1">
        
        {/* HEADER: LOGO AL AZHAR & SATU HATI UNTUK PALESTINA */}
        <header className="flex items-center justify-center gap-5 sm:gap-7 mb-2.5 sm:mb-3 -mt-1 sm:-mt-2">
          <img
            src="/images/logo-satu-hati.png"
            alt="Satu Hati untuk Palestina"
            className="h-16 sm:h-20 lg:h-22 w-auto object-contain"
          />
          <div className="w-[1.5px] h-9 sm:h-11 lg:h-14 bg-[#8C7A65]/60" />
          <img
            src="/images/logo-al-azhar.png"
            alt="Lembaga Amil Zakat Al Azhar"
            className="h-13 sm:h-16 lg:h-20 w-auto object-contain"
          />
        </header>

        {/* ROW 1: CARD TOTAL DONASI PALESTINA */}
        <section className="relative w-full mb-3 sm:mb-4">
          <div className="w-full relative overflow-hidden bg-[#EBDCB9] border border-[#DFCAA8] rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 lg:py-4.5 lg:px-6 shadow-xs flex flex-row items-center">

            {/* Left figure integrated inside card */}
            <div className="absolute left-0 top-0 bottom-0 h-full w-[260px] sm:w-[320px] md:w-[380px] lg:w-[440px] pointer-events-none overflow-hidden select-none z-0">
              <img
                src="/images/hero-figure-card.webp"
                alt="Pejuang Palestina"
                className="h-full w-full object-cover"
                style={{ objectPosition: 'left 20%' }}
              />
            </div>

            {/* Konten Nominal & Progress */}
            <div className="relative z-10 w-full flex flex-col justify-between min-w-0 pl-16 sm:pl-28 md:pl-36 lg:pl-44">

              {/* Top row badges */}
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="bg-[#C4000B] text-white text-[10.5px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>Live Monitor</span>
                  </span>
                  <h2 className="text-xs sm:text-sm lg:text-base font-bold text-[#1C140E]">
                    Total Donasi Palestina
                  </h2>
                </div>
                <span className="text-xs sm:text-sm font-medium text-[#8C7A65]">
                  {Number(campaign.verifiedCount || 5345).toLocaleString('id-ID')} Donatur Terverifikasi
                </span>
              </div>

              {/* Nominal Besar */}
              <div ref={amountWrapRef} className="w-full my-0.5 sm:my-1 overflow-hidden text-left">
                <span
                  style={{ fontSize: `${amountFontSize}px` }}
                  className={`font-poster font-black text-[#331D0C] tracking-tight leading-none block whitespace-nowrap transition-transform duration-300 ${
                    isBumping ? 'scale-[1.02]' : 'scale-100'
                  }`}
                >
                  {formatRupiah(animatedAmount)}
                </span>
              </div>

              {/* Progress Bar & Target */}
              <div className="w-full flex justify-end mt-1.5 sm:mt-2">
                <div className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[520px]">
                  <div className="w-full bg-[#FAF0E6] border border-[#DECAAB] h-3.5 sm:h-4 lg:h-4.5 rounded-full overflow-hidden p-0.5 sm:p-1 shadow-inner mb-1.5">
                    <div
                      className="bg-gradient-to-r from-[#C66723] via-[#D8782E] to-[#F18938] h-full rounded-full transition-all duration-700 ease-out shadow-xs"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#8C7A65] font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#7A6855]">Target Donasi</span>
                      <span className="bg-[#FAF0E6] text-[#C66723] text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#DECAAB]/80">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-[#331D0C] font-bold font-poster text-xs sm:text-sm">
                      {formatRupiah(targetAmt)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* ROW 2: 3 KOLOM SEJAJAR (DAFTAR DONATUR | IKUT DONASI | BERITA TERBARU) */}
        <section className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch md:h-[350px] lg:h-[370px]">
          
          {/* KOLOM 1: DAFTAR DONATUR (5/12) */}
          <div className="md:col-span-5 flex flex-col h-[320px] md:h-full min-h-0">
            <DonorFeedList donations={verifiedDonations} />
          </div>

          {/* KOLOM 2: IKUT DONASI QRIS (3/12) */}
          <div className="md:col-span-3 flex flex-col h-auto md:h-full min-h-0">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5DAC8] overflow-hidden flex flex-col h-full justify-between">
              
              {/* Header Banner Oranye */}
              <div className="bg-[#C66723] text-white p-2.5 sm:p-3 text-center shrink-0">
                <h3 className="font-poster font-black text-xs sm:text-sm tracking-wider uppercase leading-none">
                  IKUT DONASI
                </h3>
                <span className="text-[9.5px] text-orange-100 italic block mt-1 leading-none">
                  *Tanpa Minimal Transaksi
                </span>
              </div>

              {/* QRIS Body */}
              <div className="p-2 sm:p-3 flex flex-col items-center justify-center flex-1 my-auto">
                <div className="w-full max-w-[240px] sm:max-w-[260px] aspect-square flex items-center justify-center p-1 bg-white rounded-xl shadow-2xs">
                  <img
                    src="/images/qris-code.png"
                    alt="QRIS Donasi"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* KOLOM 3: BERITA TERBARU (4/12) */}
          <div className="md:col-span-4 flex flex-col h-auto md:h-full min-h-0">
            <div className="bg-white/95 rounded-2xl shadow-sm border border-[#E5DAC8] p-3 sm:p-4 flex flex-col justify-between h-full">
              <div>
                <h3 className="font-poster font-black text-xs sm:text-sm text-[#1C140E] mb-2.5 text-center">
                  Berita Terbaru
                </h3>
                <div className="flex flex-col gap-2">
                  {newsList.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center gap-2.5">
                      <img
                        src={item.image_path || '/images/hero-figure.webp'}
                        alt=""
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover shrink-0 border border-stone-200"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[8.5px] font-bold text-red-600 block uppercase tracking-wide leading-none">
                          {item.badge_text || 'AKSI KEMANUSIAAN'}
                        </span>
                        <h4 className="text-[11.5px] sm:text-xs font-bold text-[#1C140E] leading-snug line-clamp-2 mt-0.5">
                          {item.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center pt-2 border-t border-stone-100 mt-2">
                <span className="text-xs text-stone-500 font-medium hover:text-[#C66723] cursor-pointer">
                  Baca Berita Lain
                </span>
              </div>
            </div>
          </div>

        </section>

      </div>

      {/* Floating Pop-Up Donatur Terbaru */}
      <DonorToastNotification donations={verifiedDonations} />

      {/* Selebrasi Pop-up Real-time */}
      <DonationCelebrationPopup />

    </div>
  );
}
