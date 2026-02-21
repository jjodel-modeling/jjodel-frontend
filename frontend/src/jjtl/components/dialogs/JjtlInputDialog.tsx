/**
 * JjTL Input Dialog Component
 * Displays a dialog for typed input (string, number, boolean, date, select)
 */

import React, { useState, useRef, useEffect } from 'react';
import { InputType } from '../../types';
import { InputResult, SelectOption } from '../../executor/UIBridge';

interface JjtlInputDialogProps {
    message: string;
    inputType: InputType;
    defaultValue?: unknown;
    options?: SelectOption[] | string[];
    onSubmit: (result: InputResult<unknown>) => void;
}

export const JjtlInputDialog: React.FC<JjtlInputDialogProps> = ({
    message,
    inputType,
    defaultValue,
    options = [],
    onSubmit,
}) => {
    const [value, setValue] = useState<unknown>(() => {
        if (defaultValue !== undefined) return defaultValue;
        switch (inputType) {
            case 'string':
                return '';
            case 'number':
                return 0;
            case 'boolean':
                return false;
            case 'date':
                return new Date().toISOString().split('T')[0];
            case 'select':
                if (options.length > 0) {
                    const first = options[0];
                    return typeof first === 'string' ? first : first.value;
                }
                return '';
            default:
                return '';
        }
    });

    const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        if (inputRef.current && 'select' in inputRef.current) {
            inputRef.current.select?.();
        }
    }, []);

    const handleSubmit = () => {
        onSubmit({ value, cancelled: false });
    };

    const handleCancel = () => {
        onSubmit({ value: null, cancelled: true });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputType !== 'select') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const normalizedOptions: SelectOption[] = options.map((opt) =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const renderInput = () => {
        switch (inputType) {
            case 'string':
                return (
                    <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type="text"
                        className="jjtl-dialog__input"
                        value={value as string}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter text..."
                    />
                );

            case 'number':
                return (
                    <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type="number"
                        className="jjtl-dialog__input"
                        value={value as number}
                        onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter number..."
                    />
                );

            case 'boolean':
                return (
                    <div className="jjtl-dialog__toggle">
                        <div
                            className={`jjtl-dialog__toggle-switch ${value ? 'active' : ''}`}
                            onClick={() => setValue(!value)}
                            role="switch"
                            aria-checked={value as boolean}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                    e.preventDefault();
                                    setValue(!value);
                                } else if (e.key === 'Escape') {
                                    handleCancel();
                                }
                            }}
                        >
                            <div className="jjtl-dialog__toggle-thumb" />
                        </div>
                        <span className="jjtl-dialog__toggle-label">
                            {value ? 'Yes' : 'No'}
                        </span>
                    </div>
                );

            case 'date':
                return (
                    <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type="date"
                        className="jjtl-dialog__input"
                        value={value as string}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                );

            case 'select':
                return (
                    <select
                        ref={inputRef as React.RefObject<HTMLSelectElement>}
                        className="jjtl-dialog__select"
                        value={value as string}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                handleCancel();
                            }
                        }}
                    >
                        {normalizedOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );

            default:
                return null;
        }
    };

    const getTitle = () => {
        switch (inputType) {
            case 'string':
                return 'Enter Text';
            case 'number':
                return 'Enter Number';
            case 'boolean':
                return 'Yes or No';
            case 'date':
                return 'Select Date';
            case 'select':
                return 'Select Option';
            default:
                return 'Input';
        }
    };

    const getIcon = () => {
        switch (inputType) {
            case 'string':
                return 'bi-fonts';
            case 'number':
                return 'bi-123';
            case 'boolean':
                return 'bi-toggle-on';
            case 'date':
                return 'bi-calendar';
            case 'select':
                return 'bi-list-ul';
            default:
                return 'bi-input-cursor-text';
        }
    };

    return (
        <div
            className="jjtl-dialog-overlay"
            onClick={handleCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="input-title"
        >
            <div className="jjtl-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="jjtl-dialog__header">
                    <div className="jjtl-dialog__header-icon jjtl-dialog__header-icon--prompt">
                        <i className={`bi ${getIcon()}`} />
                    </div>
                    <h3 id="input-title" className="jjtl-dialog__header-title">
                        {getTitle()}
                    </h3>
                </div>
                <div className="jjtl-dialog__body">
                    <p className="jjtl-dialog__body-message">{message}</p>
                    {renderInput()}
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

export default JjtlInputDialog;
