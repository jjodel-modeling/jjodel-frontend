/**
 * useInterfaceMode Hook
 *
 * Manages the Basic/Advanced interface mode toggle.
 * - Basic mode: Shows essential features only
 * - Advanced mode: Reveals all features and options
 *
 * Persists to localStorage and provides global access via U class.
 */

import { useState, useEffect, useCallback } from 'react';
import { U } from '../joiner';

export type InterfaceMode = 'basic' | 'advanced';

const STORAGE_KEY = 'jjodel.interfaceMode';

/**
 * Get the current interface mode from localStorage or default
 */
export function getInterfaceMode(): InterfaceMode {
    if (typeof window === 'undefined') return 'basic';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'basic' || stored === 'advanced') {
        return stored;
    }
    return 'basic'; // Default to basic mode
}

/**
 * Set the interface mode in localStorage
 */
export function setInterfaceMode(mode: InterfaceMode): void {
    localStorage.setItem(STORAGE_KEY, mode);
    // Also update U class for global access
    U.interfaceMode = mode;
}

/**
 * Check if currently in advanced mode
 */
export function isAdvancedMode(): boolean {
    return getInterfaceMode() === 'advanced';
}

/**
 * Check if currently in basic mode
 */
export function isBasicMode(): boolean {
    return getInterfaceMode() === 'basic';
}

/**
 * React hook for interface mode with state management
 */
export function useInterfaceMode() {
    const [mode, setMode] = useState<InterfaceMode>(getInterfaceMode);

    // Sync with localStorage on mount
    useEffect(() => {
        const stored = getInterfaceMode();
        setMode(stored);
        U.interfaceMode = stored;
    }, []);

    // Listen for storage changes from other tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && (e.newValue === 'basic' || e.newValue === 'advanced')) {
                setMode(e.newValue);
                U.interfaceMode = e.newValue;
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Toggle between modes
    const toggleMode = useCallback(() => {
        const newMode: InterfaceMode = mode === 'basic' ? 'advanced' : 'basic';
        setMode(newMode);
        setInterfaceMode(newMode);

        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('interfaceModeChange', { detail: { mode: newMode } }));

        return newMode;
    }, [mode]);

    // Set specific mode
    const updateMode = useCallback((newMode: InterfaceMode) => {
        setMode(newMode);
        setInterfaceMode(newMode);
        window.dispatchEvent(new CustomEvent('interfaceModeChange', { detail: { mode: newMode } }));
    }, []);

    return {
        mode,
        isBasic: mode === 'basic',
        isAdvanced: mode === 'advanced',
        toggleMode,
        setMode: updateMode,
    };
}

export default useInterfaceMode;
