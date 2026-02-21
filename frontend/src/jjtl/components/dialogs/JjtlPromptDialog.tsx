/**
 * JjTL Prompt Dialog Component
 * Displays a dialog asking for text input
 */

import React, { useState, useRef, useEffect } from 'react';
import { InputResult } from '../../executor/UIBridge';

interface JjtlPromptDialogProps {
    message: string;
    defaultValue?: string;
    onSubmit: (result: InputResult<string>) => void;
}

export const JjtlPromptDialog: React.FC<JjtlPromptDialogProps> = ({
    message,
    defaultValue = '',
    onSubmit,
}) => {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleSubmit = () => {
        onSubmit({ value, cancelled: false });
    };

    const handleCancel = () => {
        onSubmit({ value: '', cancelled: true });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div
            className="jjtl-dialog-overlay"
            onClick={handleCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-title"
        >
            <div className="jjtl-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="jjtl-dialog__header">
                    <div className="jjtl-dialog__header-icon jjtl-dialog__header-icon--prompt">
                        <i className="bi bi-chat-left-text" />
                    </div>
                    <h3 id="prompt-title" className="jjtl-dialog__header-title">
                        Input Required
                    </h3>
                </div>
                <div className="jjtl-dialog__body">
                    <p className="jjtl-dialog__body-message">{message}</p>
                    <input
                        ref={inputRef}
                        type="text"
                        className="jjtl-dialog__input"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your response..."
                    />
                </div>
                <div className="jjtl-dialog__footer">
                    <button
                        className="jjtl-dialog__btn jjtl-dialog__btn--secondary"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="jjtl-dialog__btn jjtl-dialog__btn--primary"
                        onClick={handleSubmit}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JjtlPromptDialog;
