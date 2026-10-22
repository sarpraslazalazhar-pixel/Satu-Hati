import React from 'react';
import useLoopingTicker from '../hooks/useLoopingTicker';

const DISPLAY_COUNT = 3;

/**
 * Komponen auto-scroll vertikal untuk Berita Terbaru di kiosk.
 *
 * ponytail: static 3-item viewport dengan fixed row height ratio. Ganti ke dynamic layout kalau item ada snippet teks panjang.
 */
export default function NewsFeedList({ news = [] }) {
  const { activeIndex, isResetting, extendedList, total } = useLoopingTicker(news, DISPLAY_COUNT);
  const L = extendedList.length;

  return (
    <div className="bg-white/95 rounded-2xl shadow-sm border border-[#E5DAC8] p-3 sm:p-4 flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-2">
        <h3 className="font-poster font-black text-xs sm:text-sm text-[#1C140E] text-center">
          Berita Terbaru
        </h3>
      </div>

      {/* 3-Item Viewport */}
      <div className="flex-grow relative overflow-hidden min-h-0 w-full select-none">
        {total === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <span className="text-xs text-stone-400">Belum ada berita</span>
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
            {extendedList.map((item, idx) => (
              <div
                key={`news-${item.id || idx}-${idx}`}
                className="w-full py-1 box-border flex items-center"
                style={{ height: `${(1 / L) * 100}%` }}
              >
                <div className="flex items-center gap-2.5 w-full">
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-2 border-t border-stone-100 mt-2 shrink-0">
        <span className="text-xs text-stone-500 font-medium hover:text-[#C66723] cursor-pointer">
          Baca Berita Lain
        </span>
      </div>
    </div>
  );
}
