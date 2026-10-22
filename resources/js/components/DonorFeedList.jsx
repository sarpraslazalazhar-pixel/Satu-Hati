import React from 'react';
import { Heart } from 'lucide-react';
import useLoopingTicker from '../hooks/useLoopingTicker';

const DISPLAY_COUNT = 3;

export default function DonorFeedList({ donations = [] }) {
  const { activeIndex, isResetting, extendedList, total } = useLoopingTicker(donations, DISPLAY_COUNT);
  const L = extendedList.length;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="bg-white/95 rounded-2xl shadow-sm border border-[#E5DAC8] p-3 sm:p-4 flex flex-col h-full min-h-0 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-100 shrink-0 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-50 border border-red-200/60 flex items-center justify-center text-red-500 shadow-2xs">
            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
          </div>
          <div>
            <span className="font-poster font-black text-xs sm:text-sm text-[#C66723] tracking-wide uppercase block leading-none">
              Daftar Donatur
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5 leading-none">
              Donasi Real-time
            </span>
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-stone-500 font-mono">
            {total} Donatur
          </span>
        </div>
      </div>

      {/* 3-Item Viewport Container (Auto-Scroll Ultra-Smooth) */}
      <div className="flex-grow relative overflow-hidden min-h-0 w-full select-none">
        {total === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-2">
              <Heart className="w-5 h-5 fill-stone-300" />
            </div>
            <p className="text-xs font-bold text-stone-700">Belum Ada Donasi</p>
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
                <div className="bg-[#FAF7F2] hover:bg-stone-50 border border-[#EFE8DC] rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 h-full shadow-2xs transition-colors">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-poster font-black text-xs sm:text-sm text-[#1C140E] truncate leading-tight">
                      {donor.donorName || 'Hamba Allah'}
                    </h5>
                    <span className="text-[9.5px] text-stone-400 block mt-0.5 truncate leading-none">
                      {donor.isCommitment ? 'Komitmen Donasi' : donor.paymentMethod === 'cash' ? 'Infaq Tunai - Danamon LAZ Al Azhar' : 'Infaq QRIS - Danamon LAZ Al Azhar'}
                    </span>
                  </div>

                  <div className="text-right shrink-0 flex flex-col justify-center">
                    <span className="font-mono font-bold text-xs sm:text-sm text-[#C66723] tracking-tight block leading-tight">
                      {formatRupiah(donor.amount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
