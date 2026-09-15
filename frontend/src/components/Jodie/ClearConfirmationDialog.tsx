/**
 * Clear Confirmation Dialog Component
 * Modal dialog for confirming metamodel clear operation
 */

import React from 'react';
import './ClearConfirmationDialog.css';

export type ClearOption = 'clear_all' | 'keep_context' | 'cancel';

interface ClearConfirmationDialogProps {
    isOpen: boolean;
    onConfirm: (option: ClearOption) => void;
}

export const ClearConfirmationDialog: React.FC<ClearConfirmationDialogProps> = ({
    isOpen,
    onConfirm,
}) => {
    if (!isOpen) return null;

    // Close on overlay click (cancel)
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onConfirm('cancel');
        }
    };

    // Handle keyboard
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onConfirm('cancel');
        }
    };

    return (
        <div
            className="clear-dialog-overlay"
            onClick={handleOverlayClick}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-dialog-title"
        >
            <div className="clear-dialog">
                {/* Warning Icon */}
                <div className="clear-dialog-icon">
                    <i className="bi bi-exclamation-triangle"></i>
                </div>

                {/* Title */}
                <h2 id="clear-dialog-title" className="clear-dialog-title">
                    Clear Metamodel
                </h2>

                {/* Message */}
                <p className="clear-dialog-message">
                    You're about to clear the entire metamodel. What would you like to do
                    with the conversation history?
                </p>

                {/* Options */}
                <div className="clear-dialog-options">
                    {/* Clear Everything */}
                    <button
                        className="clear-option danger"
                        onClick={() => onConfirm('clear_all')}
                    >
                        <div className="option-icon">
                            <i className="bi bi-trash3"></i>
                        </div>
                        <div className="option-content">
                            <div className="option-label">Clear Everything</div>
                            <div className="option-description">
                                Delete metamodel and clear all conversation history
                            </div>
                        </div>
                    </button>

                    {/* Keep Context */}
                    <button
                        className="clear-option primary"
                        onClick={() => onConfirm('keep_context')}
                    >
                        <div className="option-icon">
                            <i className="bi bi-chat-left-text"></i>
                        </div>
                        <div className="option-content">
                            <div className="option-label">Keep Context</div>
                            <div className="option-description">
                                Clear metamodel but preserve conversation for reference
                            </div>
                        </div>
                    </button>

                    {/* Cancel */}
                    <button
                        className="clear-option secondary"
                        onClick={() => onConfirm('cancel')}
                    >
                        <div className="option-icon">
                            <i className="bi bi-x-lg"></i>
                        </div>
                        <div className="option-content">
                            <div className="option-label">Cancel</div>
                            <div className="option-description">Keep everything as is</div>
                        </div>
                    </button>
                </div>

                {/* Keyboard hint */}
                <div className="clear-dialog-hint">
                    Press <kbd>Esc</kbd> to cancel
                </div>
            </div>
        </div>
    );
};

export default ClearConfirmationDialog;
