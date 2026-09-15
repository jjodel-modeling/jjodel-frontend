/**
 * Action Confirmation Component
 * Compact design for confirming AI-proposed actions
 */

import React from 'react';
import {
    JjodieAction,
    getActionCategory,
    ACTION_NAMES,
    ActionValidationResult,
} from '../../types/jjodieActions';
import './ActionConfirmation.css';

interface ActionConfirmationProps {
    action: JjodieAction;
    validation: ActionValidationResult;
    onConfirm: () => void;
    onCancel: () => void;
    isExecuting?: boolean;
}

/**
 * Determine if action should use compact display
 */
function isSimpleAction(action: JjodieAction): boolean {
    switch (action.type) {
        case 'CREATE_METACLASS':
            return !action.data.attributes || action.data.attributes.length === 0;
        case 'DELETE_METACLASS':
        case 'ADD_ATTRIBUTE':
        case 'REMOVE_ATTRIBUTE':
        case 'MODIFY_ATTRIBUTE':
        case 'MODIFY_REFERENCE':
        case 'SET_SUPERCLASS':
        case 'REMOVE_INHERITANCE':
            return true;
        case 'ADD_REFERENCE':
        case 'REMOVE_REFERENCE':
        case 'ADD_CONSTRAINT':
            return false;
        default:
            return true;
    }
}

/**
 * Get compact details string for simple actions
 */
function getCompactDetails(action: JjodieAction): string {
    switch (action.type) {
        case 'CREATE_METACLASS':
            return `Name: ${action.data.name}`;
        case 'DELETE_METACLASS':
            return `Delete "${action.data.name}"`;
        case 'ADD_ATTRIBUTE':
            return `${action.data.attribute.name}: ${action.data.attribute.type} → ${action.data.metaclassName}`;
        case 'REMOVE_ATTRIBUTE':
            return `Remove "${action.data.attributeName}" from ${action.data.metaclassName}`;
        case 'MODIFY_ATTRIBUTE': {
            const changes = Object.entries(action.data.changes)
                .filter(([, value]) => value !== undefined)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            return `${action.data.attributeName} (${changes})`;
        }
        case 'MODIFY_REFERENCE': {
            const refChanges = Object.entries(action.data.changes)
                .filter(([, value]) => value !== undefined)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            return `${action.data.referenceName} (${refChanges})`;
        }
        case 'SET_SUPERCLASS':
            return `${action.data.metaclassName} extends ${action.data.superclassName}`;
        case 'REMOVE_INHERITANCE':
            return `Remove inheritance from ${action.data.metaclassName}`;
        default:
            return action.confirmationMessage;
    }
}

export function ActionConfirmation({
    action,
    validation,
    onConfirm,
    onCancel,
    isExecuting = false,
}: ActionConfirmationProps): JSX.Element {
    const category = getActionCategory(action.type);
    const actionName = ACTION_NAMES[action.type];
    const isDestructive = category === 'delete';
    const showCompact = isSimpleAction(action);

    // Compact confirmation for simple actions
    if (showCompact) {
        return (
            <div className={`jodie-action-confirmation compact ${category}`}>
                <div className="action-info">
                    <span className="action-title">{actionName}</span>
                </div>

                <div className="action-details">{getCompactDetails(action)}</div>

                {validation.warnings && validation.warnings.length > 0 && (
                    <div className="action-warning-inline">
                        <i className="bi bi-exclamation-triangle" />
                    </div>
                )}

                <div className="action-buttons">
                    <button
                        className="action-btn cancel"
                        onClick={onCancel}
                        disabled={isExecuting}
                        title="Cancel"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                    <button
                        className={`action-btn confirm ${isDestructive ? 'destructive' : ''}`}
                        onClick={onConfirm}
                        disabled={isExecuting || !validation.valid}
                        title={isDestructive ? 'Confirm Delete' : 'Confirm'}
                    >
                        {isExecuting ? (
                            <span className="action-spinner" />
                        ) : (
                            <i className={`bi ${isDestructive ? 'bi-trash' : 'bi-check-lg'}`} />
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Detailed confirmation for complex actions
    return (
        <div className={`jodie-action-confirmation detailed ${category}`}>
            <div className="action-header">
                <span className="action-title">{actionName}</span>
            </div>

            <div className="action-body">
                {action.type === 'CREATE_METACLASS' && action.data.attributes && action.data.attributes.length > 0 && (
                    <>
                        <div className="action-field">
                            <span className="field-label">Name:</span>
                            <span className="field-value">{action.data.name}</span>
                        </div>
                        <div className="action-field">
                            <span className="field-label">Attributes:</span>
                            <div className="field-list">
                                {action.data.attributes.map((attr, idx) => (
                                    <div key={idx} className="field-item">
                                        {attr.name}: {attr.type}{attr.multiplicity ? ` [${attr.multiplicity}]` : ''}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {action.type === 'ADD_REFERENCE' && (
                    <>
                        <div className="action-field">
                            <span className="field-label">From:</span>
                            <span className="field-value">{action.data.sourceMetaclass}</span>
                        </div>
                        <div className="action-field">
                            <span className="field-label">To:</span>
                            <span className="field-value">{action.data.reference.targetMetaclass}</span>
                        </div>
                        <div className="action-field">
                            <span className="field-label">Name:</span>
                            <span className="field-value">{action.data.reference.name}</span>
                        </div>
                        {action.data.reference.multiplicity && (
                            <div className="action-field">
                                <span className="field-label">Multiplicity:</span>
                                <span className="field-value">{action.data.reference.multiplicity}</span>
                            </div>
                        )}
                    </>
                )}

                {action.type === 'REMOVE_REFERENCE' && (
                    <>
                        <div className="action-field">
                            <span className="field-label">Metaclass:</span>
                            <span className="field-value">{action.data.metaclassName}</span>
                        </div>
                        <div className="action-field">
                            <span className="field-label">Reference:</span>
                            <span className="field-value">{action.data.referenceName}</span>
                        </div>
                    </>
                )}

                {action.type === 'ADD_CONSTRAINT' && (
                    <>
                        <div className="action-field">
                            <span className="field-label">Metaclass:</span>
                            <span className="field-value">{action.data.metaclassName}</span>
                        </div>
                        <div className="action-field">
                            <span className="field-label">Constraint:</span>
                            <span className="field-value">{action.data.constraint.name}</span>
                        </div>
                        <div className="action-field">
                            <span className="field-label">Expression:</span>
                            <pre className="field-code">{action.data.constraint.expression}</pre>
                        </div>
                    </>
                )}

                {validation.warnings && validation.warnings.length > 0 && (
                    <div className="action-warnings">
                        {validation.warnings.map((warning, index) => (
                            <div key={index} className="action-warning">
                                <i className="bi bi-exclamation-triangle" />
                                <span>{warning}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="action-footer">
                <button
                    className="action-btn cancel text"
                    onClick={onCancel}
                    disabled={isExecuting}
                >
                    <i className="bi bi-x-lg" />
                    Cancel
                </button>
                <button
                    className={`action-btn confirm text ${isDestructive ? 'destructive' : ''}`}
                    onClick={onConfirm}
                    disabled={isExecuting || !validation.valid}
                >
                    {isExecuting ? (
                        <>
                            <span className="action-spinner" />
                            Executing...
                        </>
                    ) : (
                        <>
                            <i className={`bi ${isDestructive ? 'bi-trash' : 'bi-check-lg'}`} />
                            {isDestructive ? 'Confirm Delete' : 'Confirm'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default ActionConfirmation;
