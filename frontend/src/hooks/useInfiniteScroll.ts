import { useState, useEffect, useRef } from 'react';

/**
 * Hook for infinite scroll loading
 * Shows initial batch, then loads more as user scrolls to bottom
 *
 * @param items - Full array of items
 * @param initialCount - Number of items to show initially (default: 20)
 * @param loadMoreCount - Number of items to load on each trigger (default: 10)
 */
export function useInfiniteScroll<T>(
  items: T[],
  initialCount: number = 20,
  loadMoreCount: number = 10
) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const loaderRef = useRef<HTMLDivElement>(null);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount(prev => Math.min(prev + loadMoreCount, items.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, items.length, loadMoreCount]);

  // Reset when items change (e.g., filter applied)
  useEffect(() => {
    setVisibleCount(initialCount);
  }, [items, initialCount]);

  return { visibleItems, hasMore, loaderRef };
}
