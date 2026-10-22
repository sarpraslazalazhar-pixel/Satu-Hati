import { useState, useEffect } from 'react';

/**
 * Hook auto-scroll vertikal loop mulus untuk list n-item dengan viewport k-item.
 *
 * ponytail: ticker CSS transform translate3d dengan cloning head. Ganti ke virtualized list kalau data > 100 item.
 */
export default function useLoopingTicker(items = [], displayCount = 3, intervalMs = 3500) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const total = items.length;

  useEffect(() => {
    if (total <= displayCount) {
      setActiveIndex(0);
      return;
    }

    let resetTimer = null;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev + 1;
        if (next === total) {
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
    }, intervalMs);

    return () => {
      clearInterval(interval);
      clearTimeout(resetTimer);
    };
  }, [total, displayCount, intervalMs]);

  const extendedList = total > displayCount
    ? [...items, ...items.slice(0, displayCount)]
    : items;

  return { activeIndex, isResetting, extendedList, total };
}
