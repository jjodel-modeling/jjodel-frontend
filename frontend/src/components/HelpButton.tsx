import React, { useCallback } from 'react';
import { JjodelEvents } from '../events/registry';
import './HelpButton.scss';

interface HelpButtonProps {
    helpKey: string;
}

/**
 * Small contextual help trigger button.
 * Dispatches a custom DOM event that HelpDrawer listens to.
 */
const HelpButton: React.FC<HelpButtonProps> = ({ helpKey }) => {
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        window.dispatchEvent(
            new CustomEvent(JjodelEvents.HELP_OPEN, { detail: { helpKey } })
        );
    }, [helpKey]);

    return (
        <button
            className="jj-help-button"
            onClick={handleClick}
            title="Help"
            aria-label="Open contextual help"
            type="button"
        >
            <i className="bi bi-question-circle" />
        </button>
    );
};

export default HelpButton;
