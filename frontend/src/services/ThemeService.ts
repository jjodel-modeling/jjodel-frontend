/**
 * ThemeService — Single source of truth for light/dark theme management.
 *
 * Writes to: document.documentElement[data-theme] + localStorage('theme').
 * Sync: fires 'jjodel:theme-changed' CustomEvent so all consumers stay in sync.
 *
 * Usage:
 *   import { ThemeService, useTheme } from '../services/ThemeService';
 *
 *   // Imperative
 *   ThemeService.set('dark');
 *   ThemeService.toggle();
 *   const current = ThemeService.get();
 *
 *   // React hook (re-renders on change)
 *   const [theme, setTheme] = useTheme();
 */

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const EVENT_NAME = 'jjodel:theme-changed';

function read(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
}

function apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: theme }));
}

export const ThemeService = {
    get: read,

    set(theme: Theme): void {
        apply(theme);
    },

    toggle(): Theme {
        const next: Theme = read() === 'dark' ? 'light' : 'dark';
        apply(next);
        return next;
    },
} as const;

/**
 * React hook — returns [theme, setTheme] and re-renders on any theme change.
 */
export function useTheme(): [Theme, (t: Theme) => void] {
    const [theme, setLocal] = useState<Theme>(read);

    useEffect(() => {
        const handler = (e: Event) => {
            setLocal((e as CustomEvent).detail as Theme);
        };
        window.addEventListener(EVENT_NAME, handler);
        return () => window.removeEventListener(EVENT_NAME, handler);
    }, []);

    const setTheme = useCallback((t: Theme) => {
        ThemeService.set(t);
    }, []);

    return [theme, setTheme];
}
