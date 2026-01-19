/**
 * Jodie Header Component
 * Window title bar with controls
 */

import React from 'react';
import { ProviderSelector } from './ProviderSelector';
import { AIProvider, PROVIDER_INFO } from '../../types/jodie';

interface JodieHeaderProps {
    activeProvider: AIProvider;
    onProviderChange: (provider: AIProvider) => void;
    onMinimize: () => void;
    onClose: () => void;
    onOpenSettings: () => void;
    isWaiting?: boolean;
}

export function JodieHeader({
    activeProvider,
    onProviderChange,
    onMinimize,
    onClose,
    onOpenSettings,
    isWaiting,
}: JodieHeaderProps): JSX.Element {
    const providerInfo = PROVIDER_INFO[activeProvider];

    return (
        <div className="jodie-header">
            <div className="jodie-header-left">
                <div
                    className="jodie-avatar"
                    style={{ backgroundColor: providerInfo.color }}
                >
                    <span>{providerInfo.textIcon}</span>
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
                    title="Settings"
                >
                    <i className="bi bi-gear" />
                </button>
                <button
                    className="jodie-header-btn"
                    onClick={onMinimize}
                    title="Minimize"
                >
                    <i className="bi bi-dash-lg" />
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
