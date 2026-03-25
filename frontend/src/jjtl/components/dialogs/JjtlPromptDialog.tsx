/**
 * JjTL Prompt Dialog Component
 * Displays a dialog asking for text input
 */

import React, { useState, useRef, useEffect } from 'react';
import { InputResult } from '../../executor/UIBridge';

interface JjtlPromptDialogProps {
    message: string;
    typeRef?: string;
    defaultValue?: string;
    executionContext?: string;
    onSubmit: (result: InputResult<string>) => void;
}

const getInputType = (typeRef?: string): string => {
    switch (typeRef) {
        case 'EInt':
        case 'EFloat':
            return 'number';
        case 'EDate':
            return 'date';
        default:
            return 'text';
    }
};

export const JjtlPromptDialog: React.FC<JjtlPromptDialogProps> = ({
    message,
    typeRef,
    defaultValue = '',
    executionContext,
    onSubmit,
}) => {
    const isBoolean = typeRef === 'EBoolean';
    const [value, setValue] = useState(defaultValue);
    const [checked, setChecked] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isBoolean) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isBoolean]);

    const handleSubmit = () => {
        if (typeRef === 'EInt') {
            const n = parseInt(value);
            if (isNaN(n)) { setError('Please enter a valid integer'); return; }
        }
        if (typeRef === 'EFloat') {
            const n = parseFloat(value);
            if (isNaN(n)) { setError('Please enter a valid number'); return; }
        }
        setError(null);
        const finalValue = isBoolean ? String(checked) : value;
        onSubmit({ value: finalValue, cancelled: false });
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

    const inputType = getInputType(typeRef);
    const errorStyle: React.CSSProperties = { borderColor: '#ef4444' };

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
                    {executionContext && (
                        <div className="jjtl-dialog-context">{executionContext}</div>
                    )}
                    {isBoolean ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => setChecked(e.target.checked)}
                                onKeyDown={handleKeyDown}
                            />
                            <span>{checked ? 'true' : 'false'}</span>
                        </label>
                    ) : (
                        <input
                            ref={inputRef}
                            type={inputType}
                            className="jjtl-dialog__input"
                            value={value}
                            onChange={(e) => { setValue(e.target.value); setError(null); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your response..."
                            style={error ? errorStyle : undefined}
                        />
                    )}
                    {error && (
                        <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{error}</p>
                    )}
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
