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
    badge: 'Collapsible' | 'Always Available';
}

const features: Feature[] = [
    {
        icon: 'bi-sliders',
        title: 'Advanced Properties',
        description: 'Access element properties like Final, Singleton, Rootable, and more.',
        badge: 'Collapsible'
    },
    {
        icon: 'bi-eye',
        title: 'Viewpoints & Templates',
        description: 'Create custom views with JSX templates and CSS styling.',
        badge: 'Collapsible'
    },
    {
        icon: 'bi-code-slash',
        title: 'OCL Console',
        description: 'Write Object Constraint Language queries for validation and analysis.',
        badge: 'Collapsible'
    },
    {
        icon: 'bi-graph-up',
        title: 'M2 Analytics',
        description: 'View metamodel metrics to understand structure and complexity.',
        badge: 'Collapsible'
    },
    {
        icon: 'bi-bug',
        title: 'Debug Tools',
        description: 'Enable loop debugging, integrity checking, and state inspection.',
        badge: 'Collapsible'
    },
    {
        icon: 'bi-layout-three-columns',
        title: 'Layout Management',
        description: 'Save and load custom layouts with auto-save settings.',
        badge: 'Always Available'
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
                        <i className="bi bi-lightning-fill" />
                    </div>
                    <h2 className="tutorial-header__title">Advanced Mode Enabled</h2>
                    <p className="tutorial-header__subtitle">
                        You now have access to all features. Features are organized in <strong>collapsible sections</strong> — expand only what you need.
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
                                <div className="tutorial-feature__header">
                                    <h3 className="tutorial-feature__title">{feature.title}</h3>
                                    <span className={`tutorial-feature__badge tutorial-feature__badge--${feature.badge === 'Collapsible' ? 'collapsible' : 'available'}`}>
                                        {feature.badge === 'Collapsible' ? '▶' : '✓'}
                                    </span>
                                </div>
                                <p className="tutorial-feature__description">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tip Box */}
                <div className="tutorial-tip">
                    <i className="bi bi-lightbulb" />
                    <div>
                        <strong>Tip:</strong> Most advanced features are <strong>collapsed by default</strong>.
                        Click section headers to expand them when you need more control.
                    </div>
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
