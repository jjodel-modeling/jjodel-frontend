import React, { createContext, useContext, useState, useCallback } from 'react';
import { AISettingsModal } from '../components/settings/AISettingsModal';

interface AISettingsContextType {
    openAISettings: () => void;
    closeAISettings: () => void;
    isOpen: boolean;
}

const AISettingsContext = createContext<AISettingsContextType | null>(null);

export function AISettingsProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openAISettings = useCallback(() => setIsOpen(true), []);
    const closeAISettings = useCallback(() => setIsOpen(false), []);

    return (
        <AISettingsContext.Provider value={{ openAISettings, closeAISettings, isOpen }}>
            {children}
            <AISettingsModal isOpen={isOpen} onClose={closeAISettings} />
        </AISettingsContext.Provider>
    );
}

export function useAISettings() {
    const context = useContext(AISettingsContext);
    if (!context) {
        throw new Error('useAISettings must be used within AISettingsProvider');
    }
    return context;
}

/**
 * Safe version that returns null if context is not available.
 * Use this in components that may be rendered outside the provider.
 */
export function useAISettingsSafe() {
    return useContext(AISettingsContext);
}
