/**
 * Global Drawer Context
 * Manages the state of global slide-in drawers (Settings, Account, Help)
 * This allows drawers to open without navigation, preserving current project state
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

export type DrawerType = 'settings' | 'account' | 'help' | null;

interface GlobalDrawerContextType {
    activeDrawer: DrawerType;
    openDrawer: (drawer: DrawerType) => void;
    closeDrawer: () => void;
    isDrawerOpen: (drawer?: DrawerType) => boolean;
}

const GlobalDrawerContext = createContext<GlobalDrawerContextType | undefined>(undefined);

export const GlobalDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);

    const openDrawer = useCallback((drawer: DrawerType) => {
        setActiveDrawer(drawer);
    }, []);

    const closeDrawer = useCallback(() => {
        setActiveDrawer(null);
    }, []);

    const isDrawerOpen = useCallback((drawer?: DrawerType) => {
        if (drawer) {
            return activeDrawer === drawer;
        }
        return activeDrawer !== null;
    }, [activeDrawer]);

    return (
        <GlobalDrawerContext.Provider
            value={{
                activeDrawer,
                openDrawer,
                closeDrawer,
                isDrawerOpen,
            }}
        >
            {children}
        </GlobalDrawerContext.Provider>
    );
};

export const useGlobalDrawer = () => {
    const context = useContext(GlobalDrawerContext);
    if (!context) {
        throw new Error('useGlobalDrawer must be used within GlobalDrawerProvider');
    }
    return context;
};
