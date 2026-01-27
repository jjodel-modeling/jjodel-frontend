/**
 * Jodie Minimized Component
 * Small floating button shown when chat is minimized
 */

import React from 'react';
import { AIProvider } from '../../types/jodie';

interface JodieMinimizedProps {
    activeProvider?: AIProvider;
    hasUnread?: boolean;
    onClick: () => void;
}

export function JodieMinimized({ hasUnread, onClick }: JodieMinimizedProps): JSX.Element {
    return (
        <button
            className={`jodie-minimized ${hasUnread ? 'jodie-has-unread' : ''}`}
            onClick={onClick}
            title="Open Jjodie"
        >
            <i className="bi bi-robot" />
            {hasUnread && <span className="jodie-unread-badge" />}
        </button>
    );
}

export default JodieMinimized;
