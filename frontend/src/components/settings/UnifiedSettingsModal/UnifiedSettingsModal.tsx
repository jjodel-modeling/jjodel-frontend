/**
 * UnifiedSettingsModal Component
 * Unified modal overlay for all settings (Profile, Security, AI, Appearance, Advanced)
 * Opens as overlay without changing routes - editor/canvas stays alive underneath
 */

import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ProfileSection } from './sections/ProfileSection';
import { SecuritySection } from './sections/SecuritySection';
import { ProvidersSection } from './sections/ProvidersSection';
import { PromptsSection } from './sections/PromptsSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { AdvancedSection } from './sections/AdvancedSection';
import './UnifiedSettingsModal.scss';

export type SettingsSection = 'profile' | 'security' | 'providers' | 'prompts' | 'appearance' | 'advanced';

interface UnifiedSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialSection?: SettingsSection;
}

interface NavGroup {
    label: string;
    items: Array<{
        id: SettingsSection;
        label: string;
        icon: string;
    }>;
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'GENERAL',
        items: [
            { id: 'profile', label: 'Profile', icon: 'bi-person' },
            { id: 'security', label: 'Security', icon: 'bi-shield-lock' },
        ],
    },
    {
        label: 'AI',
        items: [
            { id: 'providers', label: 'Providers', icon: 'bi-robot' },
            { id: 'prompts', label: 'Prompts', icon: 'bi-chat-left-text' },
        ],
    },
    {
        label: 'DISPLAY',
        items: [
            { id: 'appearance', label: 'Appearance', icon: 'bi-palette' },
        ],
    },
    {
        label: 'DEVELOPER',
        items: [
            { id: 'advanced', label: 'Advanced', icon: 'bi-gear' },
        ],
    },
];

export const UnifiedSettingsModal: React.FC<UnifiedSettingsModalProps> = ({
    isOpen,
    onClose,
    initialSection = 'profile',
}) => {
    const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle open/close animations
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Reset to initial section when opening
            setActiveSection(initialSection);
            requestAnimationFrame(() => {
                setIsAnimating(true);
            });
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen, initialSection]);

    // Handle Escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Handle backdrop click
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    // Render section content
    const renderSectionContent = () => {
        switch (activeSection) {
            case 'profile':
                return <ProfileSection />;
            case 'security':
                return <SecuritySection />;
            case 'providers':
                return <ProvidersSection />;
            case 'prompts':
                return <PromptsSection />;
            case 'appearance':
                return <AppearanceSection />;
            case 'advanced':
                return <AdvancedSection />;
            default:
                return <ProfileSection />;
        }
    };

    if (!isVisible) return null;

    return ReactDOM.createPortal(
        <div
            className={`unified-settings-backdrop ${isAnimating ? 'visible' : ''}`}
            onClick={handleBackdropClick}
        >
            <div
                className={`unified-settings-modal ${isAnimating ? 'visible' : ''}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-modal-title"
            >
                {/* Header */}
                <div className="unified-settings-header">
                    <h2 id="settings-modal-title">
                        <i className="bi bi-gear" />
                        Settings
                    </h2>
                    <button
                        className="unified-settings-close"
                        onClick={onClose}
                        aria-label="Close settings"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <div className="unified-settings-body">
                    {/* Sidebar Navigation */}
                    <nav className="unified-settings-sidebar" aria-label="Settings navigation">
                        {NAV_GROUPS.map((group) => (
                            <div key={group.label} className="settings-nav-group">
                                <span className="settings-nav-group-label">{group.label}</span>
                                {group.items.map((item) => (
                                    <button
                                        key={item.id}
                                        className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
                                        onClick={() => setActiveSection(item.id)}
                                        aria-current={activeSection === item.id ? 'page' : undefined}
                                    >
                                        <i className={`bi ${item.icon}`} />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </nav>

                    {/* Content Area */}
                    <div className="unified-settings-content">
                        {renderSectionContent()}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UnifiedSettingsModal;
