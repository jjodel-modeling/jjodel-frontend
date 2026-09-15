/**
 * ActionSuggestion Component
 * Displays multi-step action suggestions with interactive buttons
 */

import React from 'react';
import type { ActionSuggestion as ActionSuggestionType, JjodieAction, JjodieActionType } from '../../types/jjodieActions';
import './ActionSuggestion.css';

interface ActionSuggestionProps {
    suggestion: ActionSuggestionType;
    onAccept: (actions: JjodieAction[]) => void;
    onCustomize: (suggestion: ActionSuggestionType) => void;
    onCancel: () => void;
    disabled?: boolean;
}

// Get icon for action type
function getActionIcon(actionType: JjodieActionType): string {
    switch (actionType) {
        case 'CREATE_METACLASS':
            return 'bi-plus-square';
        case 'ADD_ATTRIBUTE':
            return 'bi-tag';
        case 'ADD_REFERENCE':
            return 'bi-arrow-right';
        case 'SET_SUPERCLASS':
            return 'bi-diagram-2';
        case 'DELETE_METACLASS':
            return 'bi-trash';
        case 'REMOVE_ATTRIBUTE':
        case 'REMOVE_REFERENCE':
        case 'REMOVE_INHERITANCE':
            return 'bi-x-circle';
        case 'ADD_CONSTRAINT':
            return 'bi-shield-check';
        case 'MODIFY_ATTRIBUTE':
        case 'MODIFY_REFERENCE':
            return 'bi-pencil';
        default:
            return 'bi-lightning';
    }
}

export function ActionSuggestion({
    suggestion,
    onAccept,
    onCustomize,
    onCancel,
    disabled = false,
}: ActionSuggestionProps): JSX.Element {
    return (
        <div className="action-suggestion">
            <div className="suggestion-header">
                {suggestion.icon && (
                    <span className="suggestion-icon">{suggestion.icon}</span>
                )}
                <div className="suggestion-info">
                    <h4 className="suggestion-title">{suggestion.title}</h4>
                    <p className="suggestion-description">{suggestion.description}</p>
                </div>
            </div>

            <div className="suggestion-actions">
                <div className="action-steps">
                    {suggestion.actions.map((action, index) => (
                        <div key={index} className="action-step">
                            <div className="step-number">{index + 1}</div>
                            <div className="step-content">
                                <i className={`step-icon bi ${getActionIcon(action.type)}`}></i>
                                <span className="step-text">{action.confirmationMessage}</span>
                            </div>
                            {index < suggestion.actions.length - 1 && (
                                <div className="step-connector">
                                    <i className="bi bi-arrow-down"></i>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="suggestion-buttons">
                <button
                    className="suggestion-btn accept"
                    onClick={() => onAccept(suggestion.actions)}
                    disabled={disabled}
                >
                    <i className="bi bi-check-lg"></i>
                    Create All
                </button>
                <button
                    className="suggestion-btn customize"
                    onClick={() => onCustomize(suggestion)}
                    disabled={disabled}
                >
                    <i className="bi bi-pencil"></i>
                    Customize
                </button>
                <button
                    className="suggestion-btn cancel"
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

export default ActionSuggestion;
