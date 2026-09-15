/**
 * UpgradePrompt Component
 *
 * Displays a prompt to upgrade from Basic to Advanced mode.
 * Shows a list of features available in Advanced mode.
 */

import React from 'react';
import { useInterfaceMode } from '../../hooks/useInterfaceMode';
import './mode-system.scss';

interface UpgradePromptProps {
    /** Custom title */
    title?: string;
    /** Custom description */
    description?: string;
    /** Custom feature list */
    features?: string[];
    /** Callback after upgrade */
    onUpgrade?: () => void;
    /** Compact variant */
    compact?: boolean;
}

const DEFAULT_FEATURES = [
    'Custom viewpoints & templates',
    'Advanced properties (Final, Singleton, etc.)',
    'OCL constraints & validation',
    'JavaScript console',
    'Debug & analysis tools'
];

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
    title = 'Want more features?',
    description = 'Switch to Advanced Mode for:',
    features = DEFAULT_FEATURES,
    onUpgrade,
    compact = false
}) => {
    const { setMode, isAdvanced } = useInterfaceMode();

    // Don't show if already in advanced mode
    if (isAdvanced) return null;

    const handleUpgrade = () => {
        setMode('advanced');
        onUpgrade?.();
    };

    if (compact) {
        return (
            <div className="upgrade-prompt upgrade-prompt--compact">
                <i className="bi bi-lightbulb" />
                <span>More features available in Advanced Mode</span>
                <button
                    className="upgrade-prompt__link"
                    onClick={handleUpgrade}
                >
                    Enable
                </button>
            </div>
        );
    }

    return (
        <div className="upgrade-prompt upgrade-prompt--redesign">
            <div className="upgrade-prompt__icon-compact">
                <i className="bi bi-star" />
            </div>
            <div className="upgrade-prompt__content-compact">
                <strong>{title}</strong>
                <p>Enable Advanced Mode for extended properties, OCL constraints, and more.</p>
            </div>
            <button
                className="upgrade-prompt__button-compact"
                onClick={handleUpgrade}
            >
                <i className="bi bi-arrow-up-circle" />
                Enable
            </button>
        </div>
    );
};

export default UpgradePrompt;
