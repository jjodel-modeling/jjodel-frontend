/**
 * MappingCard Component
 * Visual card for displaying a mapping suggestion with checkbox workflow
 *
 * - Checkbox: toggle between pending (unchecked) and toInsert (checked)
 * - X button: reject/remove from list
 * - Expand: show details
 */

import React, { useState } from 'react';
import { MappingSuggestion, SuggestionConfidence } from '../types/suggestions';
import './MappingCard.scss';

interface MappingCardProps {
    mapping: MappingSuggestion;
    isHovered: boolean;
    isSelected: boolean;
    onToggle: () => void;
    onReject: () => void;
    onHover: (id: string | null) => void;
    onSelect: (id: string | null) => void;
}

export const MappingCard: React.FC<MappingCardProps> = ({
    mapping,
    isHovered,
    isSelected,
    onToggle,
    onReject,
    onHover,
    onSelect,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Is this mapping checked (marked for insertion)?
    const isChecked = mapping.status === 'toInsert';

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

    // Determine card state classes
    const cardClass = [
        'mapping-card',
        isChecked ? 'checked' : '',
        isHovered ? 'hovered' : '',
        isSelected ? 'selected' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={cardClass}
            onMouseEnter={() => onHover(mapping.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(mapping.id)}
        >
            <div className="mapping-card-main">
                {/* Checkbox */}
                <button
                    className={`checkbox-btn ${isChecked ? 'checked' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                    title={isChecked ? 'Uncheck to move to pending' : 'Check to mark for insertion'}
                >
                    <i className={`bi ${isChecked ? 'bi-check-square-fill' : 'bi-square'}`} />
                </button>

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
                        className="action-btn reject"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReject();
                        }}
                        title="Remove mapping"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                    <button
                        className={`action-btn expand ${isExpanded ? 'expanded' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
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
