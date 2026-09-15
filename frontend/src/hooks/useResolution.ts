import { useState, useEffect } from 'react';

/**
 * Resolution breakpoints for adaptive Tree View sidebar
 */
export const RESOLUTION_BREAKPOINTS = {
    MONITOR: 2560,  // 27" Monitor or larger (2K/4K) - Tree View open by default
    DESKTOP: 1920,  // Desktop FHD - Tree View collapsed by default
    LAPTOP: 1920    // Below this - Tree View as floating overlay
};

/**
 * Resolution categories for adaptive UI behavior
 */
export type Resolution = 'laptop' | 'desktop' | 'monitor';

/**
 * Hook to detect current screen resolution category
 * - 'monitor': >= 2560px (27" or larger) - Tree View sidebar open by default
 * - 'desktop': 1920-2559px (FHD) - Tree View sidebar collapsed by default
 * - 'laptop': < 1920px - Tree View as floating overlay
 */
export function useResolution(): Resolution {
    const [resolution, setResolution] = useState<Resolution>(() => {
        if (typeof window === 'undefined') return 'desktop';
        const width = window.innerWidth;
        if (width >= RESOLUTION_BREAKPOINTS.MONITOR) return 'monitor';
        if (width >= RESOLUTION_BREAKPOINTS.DESKTOP) return 'desktop';
        return 'laptop';
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            let newResolution: Resolution;

            if (width >= RESOLUTION_BREAKPOINTS.MONITOR) {
                newResolution = 'monitor';
            } else if (width >= RESOLUTION_BREAKPOINTS.DESKTOP) {
                newResolution = 'desktop';
            } else {
                newResolution = 'laptop';
            }

            setResolution(prev => {
                // Only update if resolution category changed
                if (prev !== newResolution) {
                    return newResolution;
                }
                return prev;
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return resolution;
}

export default useResolution;
