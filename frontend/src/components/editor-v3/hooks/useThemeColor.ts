/**
 * Editor V3 — Hook to read CSS custom property values reactively.
 *
 * Re-reads computed values when the `data-theme` attribute changes on <html>,
 * so React Flow component props that require JS color strings stay in sync.
 */
import { useState, useEffect, useCallback } from 'react';

export function useThemeColor(varName: string): string {
    const read = useCallback(
        () => getComputedStyle(document.documentElement).getPropertyValue(varName).trim(),
        [varName],
    );

    const [color, setColor] = useState(read);

    useEffect(() => {
        // Read once on mount / varName change
        setColor(read());

        const observer = new MutationObserver(() => setColor(read()));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
        return () => observer.disconnect();
    }, [read]);

    return color;
}
