import React, { useEffect, useState } from 'react';
import './advanced-mode-tutorial.scss';

const STORAGE_KEY = 'jjodel_advanced_mode_tutorial_seen';

interface AdvancedModeTutorialProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Feature {
    icon: string;
    title: string;
    description: string;
}

const features: Feature[] = [
    {
        icon: 'bi-sliders',
        title: 'Extended Properties',
        description: 'Access all element properties including constraints, documentation, and advanced type options.'
    },
    {
        icon: 'bi-tools',
        title: 'Developer Tools',
        description: 'Enable debug mode, loop debugging, and integrity checking for development workflows.'
    },
    {
        icon: 'bi-graph-up',
        title: 'M2 Analytics',
        description: 'View metamodel analytics and metrics to understand your model\'s structure and complexity.'
    },
    {
        icon: 'bi-code-slash',
        title: 'OCL Console',
        description: 'Write and execute Object Constraint Language queries for model validation.'
    },
    {
        icon: 'bi-braces',
        title: 'JSX Templates',
        description: 'Create custom view templates using JSX for advanced visualization.'
    },
    {
        icon: 'bi-grid-3x3',
        title: 'Layout Management',
        description: 'Save and load custom layouts, manage layout auto-save settings.'
    }
];

export function AdvancedModeTutorial({ isOpen, onClose }: AdvancedModeTutorialProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Trigger entrance animation
            requestAnimationFrame(() => {
                setIsAnimating(true);
            });
        } else {
            setIsAnimating(false);
            // Wait for exit animation to complete
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleClose = () => {
        // Mark as seen
        localStorage.setItem(STORAGE_KEY, 'true');
        onClose();
    };

    const handleDontShowAgain = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        onClose();
    };

    if (!isVisible) return null;

    return (
        <div className={`advanced-mode-tutorial-overlay ${isAnimating ? 'visible' : ''}`} onClick={handleClose}>
            <div className={`advanced-mode-tutorial-modal ${isAnimating ? 'visible' : ''}`} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="tutorial-header">
                    <div className="tutorial-header__icon">
                        <i className="bi bi-lightning-charge-fill" />
                    </div>
                    <h2 className="tutorial-header__title">Advanced Mode Enabled</h2>
                    <p className="tutorial-header__subtitle">
                        You now have access to all features and expert tools
                    </p>
                </div>

                {/* Features Grid */}
                <div className="tutorial-features">
                    {features.map((feature, index) => (
                        <div key={index} className="tutorial-feature">
                            <div className="tutorial-feature__icon">
                                <i className={`bi ${feature.icon}`} />
                            </div>
                            <div className="tutorial-feature__content">
                                <h3 className="tutorial-feature__title">{feature.title}</h3>
                                <p className="tutorial-feature__description">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="tutorial-footer">
                    <button className="tutorial-btn tutorial-btn--secondary" onClick={handleDontShowAgain}>
                        Don't show again
                    </button>
                    <button className="tutorial-btn tutorial-btn--primary" onClick={handleClose}>
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Check if the tutorial should be shown (first time enabling Advanced Mode)
 */
export function shouldShowAdvancedModeTutorial(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== 'true';
}

/**
 * Reset the tutorial seen state (for testing or user preference)
 */
export function resetAdvancedModeTutorial(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export default AdvancedModeTutorial;
