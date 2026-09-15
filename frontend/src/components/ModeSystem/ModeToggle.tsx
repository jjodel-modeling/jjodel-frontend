/**
 * ModeToggle Component
 *
 * Toggle button for switching between Basic and Advanced modes.
 * Displays current mode with visual indication.
 */

import React from 'react';
import { useInterfaceMode } from '../../hooks/useInterfaceMode';
import './mode-system.scss';

interface ModeToggleProps {
    /** Compact mode - shows only icons */
    compact?: boolean;
    /** Show tooltip on hover */
    showTooltip?: boolean;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
    compact = false,
    showTooltip = true
}) => {
    const { mode, isBasic, isAdvanced, toggleMode } = useInterfaceMode();

    return (
        <div className={`mode-toggle ${compact ? 'mode-toggle--compact' : ''}`}>
            <button
                className={`mode-toggle__button ${isBasic ? 'mode-toggle__button--active' : ''}`}
                onClick={isAdvanced ? toggleMode : undefined}
                disabled={isBasic}
                title={showTooltip ? (isBasic ? "You're in Basic Mode" : "Switch to Basic Mode") : undefined}
                aria-label="Basic Mode"
            >
                <i className="bi bi-mortarboard" />
                {!compact && <span>Basic</span>}
            </button>

            <button
                className={`mode-toggle__button ${isAdvanced ? 'mode-toggle__button--active' : ''}`}
                onClick={isBasic ? toggleMode : undefined}
                disabled={isAdvanced}
                title={showTooltip ? (isAdvanced ? "You're in Advanced Mode" : "Switch to Advanced Mode") : undefined}
                aria-label="Advanced Mode"
            >
                <i className="bi bi-gear-wide-connected" />
                {!compact && <span>Advanced</span>}
            </button>
        </div>
    );
};

export default ModeToggle;
