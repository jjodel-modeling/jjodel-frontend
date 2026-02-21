/**
 * Global Drawer Component
 * Slide-in drawer panel for Settings, Account, Help without navigation
 * Preserves current project state when opened
 */

import React, { useEffect, useCallback } from 'react';
import { useGlobalDrawer, DrawerType } from '../../contexts/GlobalDrawerContext';
import { SettingsDrawerContent } from './SettingsDrawerContent';
import './GlobalDrawer.scss';

interface DrawerConfig {
    title: string;
    icon: string;
    component: React.FC;
}

const DRAWER_CONFIGS: Record<Exclude<DrawerType, null>, DrawerConfig> = {
    settings: {
        title: 'Settings',
        icon: 'bi-gear',
        component: SettingsDrawerContent,
    },
    account: {
        title: 'Account',
        icon: 'bi-person-circle',
        component: () => <div className="drawer-placeholder">Account settings coming soon</div>,
    },
    help: {
        title: 'Help',
        icon: 'bi-question-circle',
        component: () => <div className="drawer-placeholder">Help content coming soon</div>,
    },
};

export const GlobalDrawer: React.FC = () => {
    const { activeDrawer, closeDrawer, isDrawerOpen } = useGlobalDrawer();

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isDrawerOpen()) {
                closeDrawer();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isDrawerOpen, closeDrawer]);

    // Handle click outside (on overlay)
    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeDrawer();
        }
    }, [closeDrawer]);

    if (!activeDrawer) return null;

    const config = DRAWER_CONFIGS[activeDrawer];
    const ContentComponent = config.component;

    return (
        <div className="global-drawer-overlay" onClick={handleOverlayClick}>
            <div className="global-drawer">
                {/* Drawer Header */}
                <div className="global-drawer-header">
                    <div className="drawer-header-title">
                        <i className={`bi ${config.icon}`} />
                        <h2>{config.title}</h2>
                    </div>
                    <button
                        className="drawer-close-btn"
                        onClick={closeDrawer}
                        aria-label="Close drawer"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Drawer Content */}
                <div className="global-drawer-content">
                    <ContentComponent />
                </div>
            </div>
        </div>
    );
};

export default GlobalDrawer;
