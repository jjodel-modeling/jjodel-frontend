/**
 * LockedFeature Component
 *
 * Displays a locked feature placeholder for Basic mode users.
 * Shows what's available in Advanced mode and provides unlock option.
 */

import React from 'react';
import { useInterfaceMode } from '../../hooks/useInterfaceMode';
import './mode-system.scss';

interface LockedFeatureProps {
    /** Icon class (Bootstrap Icons without 'bi-' prefix) */
    icon: string;
    /** Feature title */
    title: string;
    /** Feature description */
    description: string;
    /** List of features available when unlocked */
    features: string[];
    /** Callback after unlock */
    onUnlock?: () => void;
}

export const LockedFeature: React.FC<LockedFeatureProps> = ({
    icon,
    title,
    description,
    features,
    onUnlock
}) => {
    const { setMode, isAdvanced } = useInterfaceMode();

    // Don't show if already in advanced mode
    if (isAdvanced) return null;

    const handleUnlock = () => {
        setMode('advanced');
        onUnlock?.();
    };

    return (
        <div className="locked-feature">
            <div className="locked-feature__icon">
                <i className={`bi bi-${icon}`} />
                <div className="locked-feature__lock">
                    <i className="bi bi-lock-fill" />
                </div>
            </div>

            <h2>{title}</h2>
            <p className="locked-feature__description">{description}</p>

            <div className="locked-feature__features">
                <h3>Available in Advanced Mode:</h3>
                <ul>
                    {features.map((feature, i) => (
                        <li key={i}>
                            <i className="bi bi-check-circle" />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>

            <button
                className="locked-feature__button"
                onClick={handleUnlock}
            >
                <i className="bi bi-unlock" />
                Unlock Advanced Mode
            </button>
        </div>
    );
};

export default LockedFeature;
