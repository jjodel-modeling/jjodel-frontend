/**
 * MappingCard Component
 * Visual card for displaying a mapping suggestion with expand/collapse functionality
 */

import React, { useState } from 'react';
import { MappingSuggestion, SuggestionConfidence } from '../types/suggestions';
import './MappingCard.scss';

interface MappingCardProps {
    mapping: MappingSuggestion;
    onAccept: () => void;
    onReject: () => void;
}

export const MappingCard: React.FC<MappingCardProps> = ({
    mapping,
    onAccept,
    onReject,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Determine mapping type
    const mappingType = mapping.sourceAttribute ? 'attribute' : 'class';
    const typeIcon = mappingType === 'class' ? 'C' : 'A';

    // Build type label for subtitle
    const typeLabel = mappingType === 'class'
        ? 'Class mapping'
        : mapping.sourceType && mapping.targetType
            ? `${mapping.sourceType} → ${mapping.targetType}`
            : 'Attribute mapping';

    // Confidence styling configuration
    const confidenceConfig: Record<SuggestionConfidence, { color: string; bgColor: string; icon: string; label: string }> = {
        high: { color: '#059669', bgColor: '#d1fae5', icon: '●', label: 'high' },
        medium: { color: '#d97706', bgColor: '#fef3c7', icon: '○', label: 'med' },
        low: { color: '#dc2626', bgColor: '#fee2e2', icon: '○', label: 'low' },
    };
    const conf = confidenceConfig[mapping.confidence] || confidenceConfig.medium;

    // Build full names for the mapping
    const sourceName = mapping.sourceAttribute
        ? `${mapping.sourceClass}.${mapping.sourceAttribute}`
        : mapping.sourceClass;
    const targetName = mapping.targetAttribute
        ? `${mapping.targetClass}.${mapping.targetAttribute}`
        : mapping.targetClass;

    // Check if type conversion is needed
    const needsConversion = mapping.sourceType && mapping.targetType &&
        mapping.sourceType.toLowerCase() !== mapping.targetType.toLowerCase();

    // Determine card state
    const cardClass = [
        'mapping-card',
        mapping.accepted ? 'accepted' : '',
        mapping.rejected ? 'rejected' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={cardClass}>
            <div className="mapping-card-main">
                {/* Type badge */}
                <div className={`mapping-type-badge ${mappingType}`}>
                    {typeIcon}
                </div>

                {/* Content */}
                <div className="mapping-content">
                    <div className="mapping-names">
                        <span className="source-name" title={sourceName}>{sourceName}</span>
                        <span className="arrow">→</span>
                        <span className="target-name" title={targetName}>{targetName}</span>
                    </div>
                    <div className="mapping-subtitle">
                        <span>{typeLabel}</span>
                        {needsConversion && <span className="conversion-badge">conversion needed</span>}
                    </div>
                </div>

                {/* Confidence badge */}
                <div
                    className="mapping-confidence"
                    style={{ color: conf.color, backgroundColor: conf.bgColor }}
                >
                    <span className="confidence-icon">{conf.icon}</span>
                    <span className="confidence-label">{conf.label}</span>
                </div>

                {/* Actions */}
                <div className="mapping-actions">
                    <button
                        className={`action-btn accept ${mapping.accepted ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onAccept(); }}
                        title="Accept mapping"
                    >
                        <i className="bi bi-check-lg" />
                    </button>
                    <button
                        className={`action-btn reject ${mapping.rejected ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onReject(); }}
                        title="Reject mapping"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                    <button
                        className={`action-btn expand ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                        title={isExpanded ? 'Collapse' : 'Show details'}
                    >
                        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`} />
                    </button>
                </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
                <div className="mapping-details">
                    <div className="details-grid">
                        <div className="detail-column">
                            <div className="detail-header">Source</div>
                            <div className="detail-row">
                                <span className="detail-label">Class:</span>
                                <span className="detail-value">{mapping.sourceClass}</span>
                            </div>
                            {mapping.sourceAttribute && (
                                <div className="detail-row">
                                    <span className="detail-label">Attribute:</span>
                                    <span className="detail-value">{mapping.sourceAttribute}</span>
                                </div>
                            )}
                            {mapping.sourceType && (
                                <div className="detail-row">
                                    <span className="detail-label">Type:</span>
                                    <span className="detail-value type">{mapping.sourceType}</span>
                                </div>
                            )}
                        </div>

                        <div className="detail-column">
                            <div className="detail-header">Target</div>
                            <div className="detail-row">
                                <span className="detail-label">Class:</span>
                                <span className="detail-value">{mapping.targetClass}</span>
                            </div>
                            {mapping.targetAttribute && (
                                <div className="detail-row">
                                    <span className="detail-label">Attribute:</span>
                                    <span className="detail-value">{mapping.targetAttribute}</span>
                                </div>
                            )}
                            {mapping.targetType && (
                                <div className="detail-row">
                                    <span className="detail-label">Type:</span>
                                    <span className="detail-value type">{mapping.targetType}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {mapping.conversionHint && (
                        <div className="conversion-hint">
                            <i className="bi bi-lightbulb" />
                            <div>
                                <div className="hint-label">Conversion hint:</div>
                                <code className="hint-code">{mapping.conversionHint}</code>
                            </div>
                        </div>
                    )}

                    {mapping.reasonText && (
                        <div className="mapping-reason">
                            <span className="reason-label">Reason:</span>
                            <span className="reason-text">{mapping.reasonText}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MappingCard;
