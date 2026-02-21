/**
 * Features Panel Context
 * Manages the expand/collapse state of the Features sidebar
 *
 * Features:
 * - Expand/collapse state with localStorage persistence
 * - Auto-expand on JjScript metamodel creation events
 * - Smooth transition support via CSS
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'jjodel.features-panel.expanded';

interface FeaturesPanelContextType {
    /** Whether the panel is expanded */
    isExpanded: boolean;
    /** Expand the panel */
    expand: () => void;
    /** Collapse the panel */
    collapse: () => void;
    /** Toggle panel state */
    toggle: () => void;
    /** Set panel state */
    setExpanded: (expanded: boolean) => void;
}

const FeaturesPanelContext = createContext<FeaturesPanelContextType | undefined>(undefined);

export const FeaturesPanelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize from localStorage, default to expanded
    const [isExpanded, setIsExpandedState] = useState<boolean>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored !== null ? JSON.parse(stored) : true;
        } catch {
            return true;
        }
    });

    // Persist state changes to localStorage
    const setExpanded = useCallback((expanded: boolean) => {
        setIsExpandedState(expanded);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
        } catch (e) {
            console.warn('[FeaturesPanelContext] Failed to persist state:', e);
        }
    }, []);

    const expand = useCallback(() => {
        setExpanded(true);
    }, [setExpanded]);

    const collapse = useCallback(() => {
        setExpanded(false);
    }, [setExpanded]);

    const toggle = useCallback(() => {
        setExpanded(!isExpanded);
    }, [isExpanded, setExpanded]);

    // Listen for JjScript metamodel creation events
    useEffect(() => {
        const handleMetamodelCreated = (event: CustomEvent<{ elementsCreated: number }>) => {
            console.log('[FeaturesPanelContext] Metamodel elements created:', event.detail.elementsCreated);
            // Auto-expand the panel when elements are created
            if (event.detail.elementsCreated > 0) {
                expand();
            }
        };

        window.addEventListener('jjscript:metamodel-created', handleMetamodelCreated as EventListener);

        return () => {
            window.removeEventListener('jjscript:metamodel-created', handleMetamodelCreated as EventListener);
        };
    }, [expand]);

    return (
        <FeaturesPanelContext.Provider
            value={{
                isExpanded,
                expand,
                collapse,
                toggle,
                setExpanded,
            }}
        >
            {children}
        </FeaturesPanelContext.Provider>
    );
};

export const useFeaturesPanel = () => {
    const context = useContext(FeaturesPanelContext);
    if (!context) {
        throw new Error('useFeaturesPanel must be used within FeaturesPanelProvider');
    }
    return context;
};

/**
 * Hook that provides a safe version of useFeaturesPanel
 * Returns null if not within provider (useful for optional usage)
 */
export const useFeaturesPanelSafe = () => {
    return useContext(FeaturesPanelContext);
};
