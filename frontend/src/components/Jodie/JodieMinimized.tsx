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
            title="Open Jjodie"
        >
            <i
                className="bi bi-chat-dots-fill"
                style={{ color: 'white', fontSize: '28px' }}
            />
            {hasUnread && <span className="jodie-unread-badge" />}
        </button>
    );
}

export default JodieMinimized;
