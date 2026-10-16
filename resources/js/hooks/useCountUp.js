import { useEffect, useRef, useState } from 'react';

/**
 * Animasi angka naik menuju `target` saat nilainya berubah.
 * Dipakai untuk total donasi kiosk (angka besar) agar terasa "bertambah" real-time.
 *
 * ponytail: ease-out cubic manual, tanpa dependency. Ganti ke lib countup kalau
 * butuh spring physics / format custom.
 */
export default function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(target || 0);
  const fromRef = useRef(target || 0);
  const rafRef = useRef(null);

  useEffect(() => {
    const to = Number(target) || 0;
    const from = fromRef.current;

    if (to === from) {
      return;
    }

    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const next = Math.round(from + (to - from) * eased);
      setValue(next);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      fromRef.current = to;
    };
  }, [target, duration]);

  return value;
}
