/**
 * Jodie Minimized Component
 * Small floating button shown when chat is minimized
 */

import React from 'react';
import { AIProvider, PROVIDER_INFO } from '../../types/jodie';

interface JodieMinimizedProps {
    activeProvider: AIProvider;
    hasUnread: boolean;
    onClick: () => void;
}

export function JodieMinimized({ activeProvider, hasUnread, onClick }: JodieMinimizedProps): JSX.Element {
    const providerInfo = PROVIDER_INFO[activeProvider];

    return (
        <button
            className={`jodie-minimized ${hasUnread ? 'jodie-has-unread' : ''}`}
            onClick={onClick}
            title="Open Jodie"
            style={{ backgroundColor: providerInfo.color }}
        >
            <i className={`bi ${providerInfo.icon}`} />
            {hasUnread && <span className="jodie-unread-badge" />}
        </button>
    );
}

export default JodieMinimized;
