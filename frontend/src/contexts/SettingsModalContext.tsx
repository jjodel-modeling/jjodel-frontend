/**
 * SettingsModalContext
 * Global context for managing the unified settings modal state
 * Allows opening settings from anywhere in the app (keyboard shortcuts, menu, etc.)
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { UnifiedSettingsModal, SettingsSection } from '../components/settings/UnifiedSettingsModal';

interface SettingsModalContextType {
    isOpen: boolean;
    openSettings: (section?: SettingsSection) => void;
    closeSettings: () => void;
    toggleSettings: () => void;
    currentSection: SettingsSection;
    setSection: (section: SettingsSection) => void;
}

const SettingsModalContext = createContext<SettingsModalContextType | undefined>(undefined);

interface SettingsModalProviderProps {
    children: ReactNode;
}

export function SettingsModalProvider({ children }: SettingsModalProviderProps): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState<SettingsSection>('profile');

    // Open settings, optionally to a specific section
    const openSettings = useCallback((section?: SettingsSection) => {
        if (section) {
            setCurrentSection(section);
        }
        setIsOpen(true);
    }, []);

    // Close settings
    const closeSettings = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Toggle settings open/closed
    const toggleSettings = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    // Change section while open
    const setSection = useCallback((section: SettingsSection) => {
        setCurrentSection(section);
    }, []);

    // Global keyboard shortcut: Cmd+, (Mac) or Ctrl+, (Windows)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Cmd+, or Ctrl+,
            if ((e.metaKey || e.ctrlKey) && e.key === ',') {
                e.preventDefault();
                toggleSettings();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [toggleSettings]);

    const contextValue: SettingsModalContextType = {
        isOpen,
        openSettings,
        closeSettings,
        toggleSettings,
        currentSection,
        setSection,
    };

    return (
        <SettingsModalContext.Provider value={contextValue}>
            {children}
            <UnifiedSettingsModal
                isOpen={isOpen}
                onClose={closeSettings}
                initialSection={currentSection}
            />
        </SettingsModalContext.Provider>
    );
}

/**
 * Hook to access settings modal controls
 * @throws Error if used outside of SettingsModalProvider
 */
export function useSettingsModal(): SettingsModalContextType {
    const context = useContext(SettingsModalContext);
    if (context === undefined) {
        throw new Error('useSettingsModal must be used within a SettingsModalProvider');
    }
    return context;
}

/**
 * Hook that returns just the openSettings function (for components that only need to trigger open)
 */
export function useOpenSettings(): (section?: SettingsSection) => void {
    const { openSettings } = useSettingsModal();
    return openSettings;
}

/**
 * Safe version that returns null if context is not available.
 * Use this in components that may be rendered outside the provider.
 */
export function useSettingsModalSafe(): SettingsModalContextType | null {
    return useContext(SettingsModalContext) ?? null;
}

export default SettingsModalContext;
