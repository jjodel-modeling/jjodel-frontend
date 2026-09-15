/**
 * Metamodel Preview Component
 * Shows detailed preview of classes and relationships before creating a metamodel
 */

import React, { useState } from 'react';
import type { JjodieAction } from '../../types/jjodieActions';
import './MetamodelPreview.css';

interface MetamodelPreviewProps {
    actions: JjodieAction[];
    confirmationMessage: string;
    onConfirm: () => void;
    onCancel: () => void;
    disabled?: boolean;
}

interface ClassPreview {
    name: string;
    isAbstract?: boolean;
    attributeCount: number;
    superclass?: string;
}

interface ReferencePreview {
    source: string;
    target: string;
    name: string;
    type: 'composition' | 'aggregation' | 'association';
    multiplicity?: string;
}

/**
 * Get symbol for reference type
 */
function getReferenceSymbol(containment?: boolean): { symbol: string; type: ReferencePreview['type'] } {
    if (containment) {
        return { symbol: '◆→', type: 'composition' };
    }
    return { symbol: '→', type: 'association' };
}

/**
 * Build preview from actions
 */
function buildMetamodelPreview(actions: JjodieAction[]): {
    classes: ClassPreview[];
    references: ReferencePreview[];
    totalActions: number;
} {
    const classes: ClassPreview[] = [];
    const references: ReferencePreview[] = [];

    actions.forEach(action => {
        if (action.type === 'CREATE_METACLASS') {
            classes.push({
                name: action.data.name,
                isAbstract: action.data.isAbstract,
                attributeCount: action.data.attributes?.length || 0,
                superclass: action.data.superclass,
            });
        } else if (action.type === 'ADD_REFERENCE') {
            const ref = action.data.reference;
            const { symbol, type } = getReferenceSymbol(ref.containment);
            references.push({
                source: action.data.sourceMetaclass,
                target: ref.targetMetaclass,
                name: ref.name,
                type,
                multiplicity: ref.multiplicity,
            });
        }
    });

    return {
        classes,
        references,
        totalActions: actions.length,
    };
}

/**
 * Get display name for reference type
 */
function getTypeLabel(type: ReferencePreview['type']): string {
    switch (type) {
        case 'composition':
            return 'composition';
        case 'aggregation':
            return 'aggregation';
        case 'association':
            return 'association';
        default:
            return 'association';
    }
}

const MAX_CLASSES_DISPLAY = 8;
const MAX_REFS_DISPLAY = 6;

export function MetamodelPreview({
    actions,
    confirmationMessage,
    onConfirm,
    onCancel,
    disabled = false,
}: MetamodelPreviewProps): JSX.Element {
    const [showAllRefs, setShowAllRefs] = useState(false);
    const preview = buildMetamodelPreview(actions);

    const displayClasses = preview.classes.slice(0, MAX_CLASSES_DISPLAY);
    const remainingClasses = preview.classes.length - MAX_CLASSES_DISPLAY;

    const displayRefs = showAllRefs
        ? preview.references
        : preview.references.slice(0, MAX_REFS_DISPLAY);
    const remainingRefs = preview.references.length - MAX_REFS_DISPLAY;

    return (
        <div className="metamodel-preview">
            {/* Header */}
            <div className="mp-header">
                <i className="bi bi-diagram-3"></i>
                <span className="mp-title">{confirmationMessage}</span>
            </div>

            {/* Classes Section */}
            <div className="mp-section">
                <div className="mp-section-header">
                    <i className="bi bi-box"></i>
                    <span>Classes ({preview.classes.length})</span>
                </div>
                <div className="mp-class-list">
                    {displayClasses.map((cls, idx) => (
                        <div key={idx} className="mp-class-item">
                            <span className="mp-class-name">
                                {cls.isAbstract && <em className="mp-abstract">abstract </em>}
                                {cls.name}
                            </span>
                            {cls.attributeCount > 0 && (
                                <span className="mp-attr-count">{cls.attributeCount} attrs</span>
                            )}
                            {cls.superclass && (
                                <span className="mp-extends">extends {cls.superclass}</span>
                            )}
                        </div>
                    ))}
                    {remainingClasses > 0 && (
                        <div className="mp-more">
                            +{remainingClasses} more...
                        </div>
                    )}
                </div>
            </div>

            {/* Relationships Section */}
            {preview.references.length > 0 && (
                <div className="mp-section">
                    <div className="mp-section-header">
                        <i className="bi bi-arrow-left-right"></i>
                        <span>Relationships ({preview.references.length})</span>
                    </div>
                    <div className="mp-ref-list">
                        {displayRefs.map((ref, idx) => (
                            <div key={idx} className="mp-ref-item">
                                <span className="mp-ref-source">{ref.source}</span>
                                <span className={`mp-ref-arrow ${ref.type}`}>
                                    {ref.type === 'composition' ? '◆→' : '→'}
                                </span>
                                <span className="mp-ref-target">{ref.target}</span>
                                <span className="mp-ref-name">({ref.name})</span>
                                {ref.multiplicity && (
                                    <span className="mp-ref-mult">[{ref.multiplicity}]</span>
                                )}
                            </div>
                        ))}
                        {!showAllRefs && remainingRefs > 0 && (
                            <button
                                className="mp-show-more"
                                onClick={() => setShowAllRefs(true)}
                            >
                                Show {remainingRefs} more...
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="mp-summary">
                <i className="bi bi-check-circle"></i>
                <span>Total: {preview.totalActions} actions</span>
            </div>

            {/* Action Buttons */}
            <div className="mp-buttons">
                <button
                    className="mp-btn mp-btn-confirm"
                    onClick={onConfirm}
                    disabled={disabled}
                >
                    <i className="bi bi-check-lg"></i>
                    Create Metamodel
                </button>
                <button
                    className="mp-btn mp-btn-cancel"
                    onClick={onCancel}
                    disabled={disabled}
                >
                    <i className="bi bi-x-lg"></i>
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default MetamodelPreview;
