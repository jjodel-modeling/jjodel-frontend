import React, { useEffect, useState } from 'react';
import './m2-analytics-modal.scss';

export interface M2AnalyticsData {
    metamodelName: string;
    classification: {
        score: number;  // 0-100
        category: 'small' | 'medium' | 'large';
    };
    metrics: {
        PKG: number;      // # Packages
        MC: number;       // # Metaclasses
        AMC: number;      // # Abstract Metaclasses
        CMC: number;      // # Concrete Metaclasses
        IFLMC: number;    // # Concrete Featureless Metaclasses
        MCWS: number;     // # Metaclasses with Superclass
        LMC: number | null;  // % Isolated Metaclasses (can be NaN)
        SF: number;       // # Structural Features
        ASF: number | null;  // Avg # Structural Features (can be NaN)
        EN: number;       // # Enumerations
        LIT: number;      // # Literals
    };
}

interface M2AnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: M2AnalyticsData;
}

export const M2AnalyticsModal: React.FC<M2AnalyticsModalProps> = ({
    isOpen,
    onClose,
    data
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showScoreExplanation, setShowScoreExplanation] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            requestAnimationFrame(() => {
                setIsAnimating(true);
            });
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    const { metamodelName, classification, metrics } = data;

    // Format value: show N/A for null/NaN, otherwise show number
    const formatValue = (value: number | null): string => {
        if (value === null || (typeof value === 'number' && isNaN(value))) return 'N/A';
        return value.toString();
    };

    // Format percentage: show N/A for null/NaN
    const formatPercentage = (value: number | null): string => {
        if (value === null || (typeof value === 'number' && isNaN(value))) return 'N/A';
        return `${value.toFixed(1)}%`;
    };

    return (
        <div className={`m2-analytics-overlay ${isAnimating ? 'visible' : ''}`} onClick={onClose}>
            <div
                className={`m2-analytics-modal ${isAnimating ? 'visible' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="m2-analytics-modal__header">
                    <h2 className="m2-analytics-modal__title">
                        Metamodel Analytics
                    </h2>
                    <button
                        className="m2-analytics-modal__close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Content */}
                <div className="m2-analytics-modal__content">

                    {/* EMF Classification Section */}
                    <div className="classification-section">
                        <div className="classification-section__header">
                            <i className="bi bi-info-circle" />
                            <span>Metamodel classification as EMF-based</span>
                        </div>

                        {/* Classification Gauge */}
                        <div className="classification-gauge">
                            {/* Labels */}
                            <div className="classification-gauge__labels">
                                <span>small</span>
                                <span>medium</span>
                                <span>large</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="classification-gauge__bar">
                                <div
                                    className="classification-gauge__marker"
                                    style={{ left: `${Math.min(100, Math.max(0, classification.score))}%` }}
                                >
                                    <span>{classification.score}</span>
                                </div>
                            </div>

                            {/* Thresholds */}
                            <div className="classification-gauge__thresholds">
                                <span>30</span>
                                <span>50</span>
                                <span>80</span>
                            </div>

                            {/* Bottom Info */}
                            <div className="classification-gauge__info">
                                <span>0</span>
                                <span className="classification-gauge__metamodel-name">
                                    {metamodelName}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Section */}
                    <div className="metrics-section">
                        <h3 className="metrics-section__title">Metrics</h3>

                        <div className="metrics-table">
                            <div className="metrics-row">
                                <span className="metrics-row__acronym">PKG</span>
                                <span className="metrics-row__label"># Packages</span>
                                <span className="metrics-row__value">{metrics.PKG}</span>
                            </div>

                            <div className="metrics-row">
                                <span className="metrics-row__acronym">MC</span>
                                <span className="metrics-row__label"># Metaclasses</span>
                                <span className="metrics-row__value">{metrics.MC}</span>
                            </div>

                            <div className="metrics-row">
                                <span className="metrics-row__acronym">AMC</span>
                                <span className="metrics-row__label"># Abstract Metaclasses</span>
                                <span className="metrics-row__value">{metrics.AMC}</span>
                            </div>

                            <div className="metrics-row">
                                <span className="metrics-row__acronym">CMC</span>
                                <span className="metrics-row__label"># Concrete Metaclasses</span>
                                <span className="metrics-row__value">{metrics.CMC}</span>
                            </div>

                            <div className="metrics-row">
                                <span className="metrics-row__acronym">IFLMC</span>
                                <span className="metrics-row__label"># Concrete Featureless Metaclasses</span>
                                <span className="metrics-row__value">{metrics.IFLMC}</span>
                            </div>

                            <div className="metrics-row">
                                <span className="metrics-row__acronym">MCWS</span>
                                <span className="metrics-row__label"># Metaclasses with Superclass</span>
                                <span className="metrics-row__value">{metrics.MCWS}</span>
                            </div>

                            <div className="metrics-row">
                                <span className="metrics-row__acronym">LMC</span>
                                <span className="metrics-row__label">% Isolated Metaclasses</span>
                                <span className={`metrics-row__value ${metrics.LMC === null ? 'metrics-row__value--na' : ''}`}>
                                    {formatPercentage(metrics.LMC)}
                                </span>
                            </div>

                            <div className="metrics-row">
                                <span className="metrics-row__acronym">SF</span>
                                <span className="metrics-row__label"># Structural Features</span>
                                <span className="metrics-row__value">{metrics.SF}</span>
                            </div>

                            <div className="metrics-row">
                                <span className="metrics-row__acronym">ASF</span>
                                <span className="metrics-row__label">Avg # Structural Features</span>
                                <span className={`metrics-row__value ${metrics.ASF === null ? 'metrics-row__value--na' : ''}`}>
                                    {formatValue(metrics.ASF)}
                                </span>
                            </div>

                            <div className="metrics-row">
                                <span className="metrics-row__acronym">EN/LIT</span>
                                <span className="metrics-row__label"># Enumeration/Literals</span>
                                <span className="metrics-row__value">
                                    {metrics.EN}/{metrics.LIT}
                                </span>
                            </div>

                            {/* Divider before score */}
                            <div className="metrics-table__divider" />

                            {/* Score row - highlighted */}
                            <div className="metrics-row metrics-row--score">
                                <span className="metrics-row__acronym">SCORE</span>
                                <span className="metrics-row__label">
                                    Metamodel Complexity Score
                                    <button
                                        className="metrics-row__info-btn"
                                        onClick={() => setShowScoreExplanation(true)}
                                        title="How is this calculated?"
                                    >
                                        <i className="bi bi-info-circle" />
                                    </button>
                                </span>
                                <span className="metrics-row__value metrics-row__value--score">
                                    {classification.score}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score Explanation Modal */}
                {showScoreExplanation && (
                    <div className="score-explanation-overlay" onClick={() => setShowScoreExplanation(false)}>
                        <div className="score-explanation-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="score-explanation-modal__header">
                                <h3>Complexity Score Calculation</h3>
                                <button onClick={() => setShowScoreExplanation(false)}>
                                    <i className="bi bi-x-lg" />
                                </button>
                            </div>

                            <div className="score-explanation-modal__content">
                                <p>
                                    The <strong>Metamodel Complexity Score</strong> is calculated based on
                                    multiple structural metrics:
                                </p>

                                <div className="score-formula">
                                    <div className="score-component">
                                        <span className="score-component__label">Metaclasses (MC)</span>
                                        <span className="score-component__formula">MC × 2</span>
                                        <span className="score-component__max">max 40 pts</span>
                                    </div>

                                    <div className="score-component">
                                        <span className="score-component__label">Structural Features (SF)</span>
                                        <span className="score-component__formula">SF × 0.5</span>
                                        <span className="score-component__max">max 30 pts</span>
                                    </div>

                                    <div className="score-component">
                                        <span className="score-component__label">Hierarchy (MCWS)</span>
                                        <span className="score-component__formula">MCWS × 1.5</span>
                                        <span className="score-component__max">max 20 pts</span>
                                    </div>

                                    <div className="score-component">
                                        <span className="score-component__label">Enumerations (EN)</span>
                                        <span className="score-component__formula">EN × 2</span>
                                        <span className="score-component__max">max 10 pts</span>
                                    </div>

                                    <div className="score-total">
                                        <span>Total Score</span>
                                        <span>0 - 100</span>
                                    </div>
                                </div>

                                <div className="score-ranges">
                                    <h4>Score Ranges (EMF-based Classification):</h4>
                                    <ul>
                                        <li><strong>0-29:</strong> Small metamodel</li>
                                        <li><strong>30-79:</strong> Medium metamodel</li>
                                        <li><strong>80-100:</strong> Large metamodel</li>
                                    </ul>
                                </div>

                                <div className="score-note">
                                    <i className="bi bi-lightbulb" />
                                    <p>
                                        Higher scores indicate more complex metamodels with more classes,
                                        features, and hierarchical relationships.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="m2-analytics-modal__footer">
                    <button
                        className="m2-analytics-btn m2-analytics-btn--primary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default M2AnalyticsModal;
