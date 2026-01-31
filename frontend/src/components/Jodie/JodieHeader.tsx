/**
 * Jodie Header Component
 * Window title bar with controls
 */

import React from 'react';
import { ProviderSelector } from './ProviderSelector';
import { AIProvider } from '../../types/jodie';

interface JodieHeaderProps {
    activeProvider: AIProvider;
    onProviderChange: (provider: AIProvider) => void;
    onClose: () => void;
    onOpenSettings: () => void;
    isWaiting?: boolean;
}

export function JodieHeader({
    activeProvider,
    onProviderChange,
    onClose,
    onOpenSettings,
    isWaiting,
}: JodieHeaderProps): JSX.Element {
    return (
        <div className="jodie-header">
            <div className="jodie-header-left">
                <div className="jodie-avatar">
                    <i className="bi bi-robot" />
                </div>
                <div className="jodie-title">
                    <span className="jodie-name">Jjodie</span>
                    <ProviderSelector
                        activeProvider={activeProvider}
                        onProviderChange={onProviderChange}
                        disabled={isWaiting}
                    />
                </div>
            </div>
            <div className="jodie-header-right">
                <button
                    className="jodie-header-btn"
                    onClick={onOpenSettings}
                    title="AI Settings"
                >
                    <i className="bi bi-gear" />
                </button>
                <button
                    className="jodie-header-btn jodie-close-btn"
                    onClick={onClose}
                    title="Close"
                >
                    <i className="bi bi-x-lg" />
                </button>
            </div>
        </div>
    );
}

export default JodieHeader;
