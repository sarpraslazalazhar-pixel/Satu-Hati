import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';

const FALLBACK_SLIDES = [
  {
    id: 'f1',
    title: 'Konser Amal Zecrus 11th Peduli Palestina',
    description: 'Pentas seni solidaritas kemanusiaan bersama siswa-siswi SMP Islam Al Azhar 16 Cikarang.',
    image_path: '/uploads/slides/slide_konser.jpg',
    badge_text: 'KONSER AMAL 2026',
  },
  {
    id: 'f2',
    title: 'Penyaluran Bantuan Kemanusiaan LAZ Al Azhar',
    description: 'Distribusi paket pangan darurat dan air bersih untuk warga terdampak di Gaza, Palestina.',
    image_path: '/uploads/slides/slide_palestina.jpg',
    badge_text: 'AKSI KEMANUSIAAN',
  },
  {
    id: 'f3',
    title: 'Dukungan Pendidikan & Beasiswa Anak Palestina',
    description: 'Menghadirkan senyum dan fasilitas belajar darurat untuk anak-anak Palestina dan Indonesia.',
    image_path: '/uploads/slides/slide_pendidikan.jpg',
    badge_text: 'PROGRAM PENDIDIKAN',
  }
];

export default function ActivitySlideshow() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch activity slides from API (bisa diatur di admin)
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/activity-slides', {
          headers: { Accept: 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.slides && data.slides.length > 0) {
            setSlides(data.slides);
          }
        }
      } catch {
        // use fallback
      }
    };

    fetchSlides();
    const interval = setInterval(fetchSlides, 10000); // Polling sync from admin every 10s
    return () => clearInterval(interval);
  }, []);

  // Auto-play slideshow every 5 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, currentIndex]);

  const slide = slides[currentIndex % slides.length];

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden relative flex flex-col justify-between h-full min-h-[140px] shadow-2xl border border-blue-400/30">
      
      {/* Slide Image & Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id || currentIndex}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="relative w-full h-full flex flex-col justify-between overflow-hidden"
        >
          {/* Background Real Activity Image */}
          {slide.image_path ? (
            <img
              src={slide.image_path}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-stone-900 to-red-950" />
          )}

          {/* Vignette Gradients for Legibility without turning photo black */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent pointer-events-none" />
          {/* Top Tag & Indicator */}
          <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 relative z-10 shrink-0">
            <span className="text-[9px] font-poster font-black px-2.5 py-0.5 rounded-full bg-red-600/90 text-white border border-red-500/60 shadow-sm uppercase flex items-center gap-1 backdrop-blur-xs">
              <Sparkles className="w-2.5 h-2.5 fill-white" />
              <span>{slide.badge_text || 'INFORMASI KEGIATAN'}</span>
            </span>

            <span className="text-[9px] font-mono text-white/80 font-bold bg-black/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-xs">
              {currentIndex + 1} / {slides.length}
            </span>
          </div>

          {/* Slide Title & Description at Bottom */}
          <div className="p-2.5 sm:p-3.5 relative z-10 mt-auto">
            <h4 className="font-poster font-black text-xs sm:text-sm text-white tracking-tight leading-snug drop-shadow-md">
              {slide.title}
            </h4>
            {slide.description && (
              <p className="text-[10px] sm:text-[11px] text-stone-200 font-medium leading-tight mt-0.5 line-clamp-2 drop-shadow-sm">
                {slide.description}
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls Bar */}
      <div className="bg-[#0b172e]/90 backdrop-blur-md text-blue-200 px-3 py-1 flex items-center justify-between border-t border-blue-400/20 shrink-0 relative z-20">
        <button
          onClick={handlePrev}
          className="p-0.5 hover:text-emerald-400 transition-colors cursor-pointer"
          title="Slide Sebelumnya"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Indicator Dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id || idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'w-5 bg-emerald-400' : 'w-1.5 bg-stone-600 hover:bg-stone-400'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-0.5 hover:text-emerald-400 transition-colors cursor-pointer"
          title="Slide Berikutnya"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
