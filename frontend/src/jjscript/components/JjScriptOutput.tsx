/**
 * JjScript Output Component
 * Displays command execution results
 */

import React, { memo, useMemo } from 'react';
import { ExecutionResult } from '../types';
import { JjScriptSuccessNotification, parseExecutionResult } from './JjScriptSuccessNotification';
import './JjScriptOutput.scss';

interface JjScriptOutputProps {
    result: ExecutionResult;
    command?: string;
    className?: string;
    /** Use beautiful notification style for success (default: true) */
    useBeautifulNotification?: boolean;
}

export const JjScriptOutput: React.FC<JjScriptOutputProps> = memo(({
    result,
    command,
    className = '',
    useBeautifulNotification = true
}) => {
    const { success, message, errors, warnings, data } = result;

    // Parse result for beautiful notification
    const parsedNotification = useMemo(() => {
        if (success && useBeautifulNotification) {
            return parseExecutionResult(result.command, message, data);
        }
        return null;
    }, [success, useBeautifulNotification, result.command, message, data]);

    // Check if this is a display-only command (list, show, help)
    const isDisplayCommand = ['list', 'show', 'help'].includes(result.command);

    return (
        <div className={`jjscript-output ${success ? 'jjscript-output--success' : 'jjscript-output--error'} ${className}`}>
            {/* Command echo */}
            {command && (
                <div className="jjscript-output-command">
                    <span className="prompt">&gt;</span>
                    <span className="command">{command}</span>
                </div>
            )}

            {/* Success: Beautiful notification for action commands */}
            {success && parsedNotification && !isDisplayCommand ? (
                <JjScriptSuccessNotification
                    operation={parsedNotification.operation}
                    target={parsedNotification.target}
                    secondary={parsedNotification.secondary}
                    connector={parsedNotification.connector}
                    details={parsedNotification.details}
                />
            ) : (
                <>
                    {/* Error or display command: Show classic status indicator */}
                    <div className="jjscript-output-status">
                        <span className={`status-icon ${success ? 'status-icon--success' : 'status-icon--error'}`}>
                            {success ? (
                                <i className="bi bi-check-circle-fill" />
                            ) : (
                                <i className="bi bi-x-circle-fill" />
                            )}
                        </span>
                        <span className="status-text">
                            {success ? 'Success' : 'Error'}
                        </span>
                    </div>

                    {/* Main message */}
                    <div className="jjscript-output-message">
                        {formatMessage(message)}
                    </div>
                </>
            )}

            {/* Errors */}
            {errors && errors.length > 0 && (
                <div className="jjscript-output-errors">
                    {errors.map((error, i) => (
                        <div key={i} className="error-item">
                            <span className="error-code">[{error.code}]</span>
                            <span className="error-message">{error.message}</span>
                            {error.suggestion && (
                                <div className="error-suggestion">
                                    <i className="bi bi-lightbulb" />
                                    {error.suggestion}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Warnings */}
            {warnings && warnings.length > 0 && (
                <div className="jjscript-output-warnings">
                    {warnings.map((warning, i) => (
                        <div key={i} className="warning-item">
                            <i className="bi bi-exclamation-triangle" />
                            {warning}
                        </div>
                    ))}
                </div>
            )}

            {/* Data details (if tree or list) */}
            {data?.tree && (
                <div className="jjscript-output-tree">
                    {data.tree.map((line: string, i: number) => (
                        <div key={i} className="tree-line">{line}</div>
                    ))}
                </div>
            )}

            {data?.details && Array.isArray(data.details) && data.details.length > 0 && (
                <div className="jjscript-output-details">
                    {data.details.map((line: string, i: number) => (
                        <div key={i} className="detail-line">{line}</div>
                    ))}
                </div>
            )}

            {data?.elements && Array.isArray(data.elements) && data.elements.length > 0 && (
                <div className="jjscript-output-list">
                    {data.elements.map((item: string, i: number) => (
                        <div key={i} className="list-item">{item}</div>
                    ))}
                </div>
            )}
        </div>
    );
});

/**
 * Format message with proper line breaks and indentation
 */
function formatMessage(message: string): JSX.Element[] {
    return message.split('\n').map((line, i) => (
        <div key={i} className="message-line">
            {line}
        </div>
    ));
}

/**
 * Compact output for inline display
 */
export const JjScriptInlineOutput: React.FC<JjScriptOutputProps> = memo(({
    result,
    className = '',
    useBeautifulNotification = true
}) => {
    const { success, message, data } = result;

    // Parse result for beautiful notification
    const parsedNotification = useMemo(() => {
        if (success && useBeautifulNotification) {
            return parseExecutionResult(result.command, message, data);
        }
        return null;
    }, [success, useBeautifulNotification, result.command, message, data]);

    // Check if this is a display-only command (list, show, help)
    const isDisplayCommand = ['list', 'show', 'help'].includes(result.command);

    // Use beautiful notification for success action commands
    if (success && parsedNotification && !isDisplayCommand) {
        return (
            <JjScriptSuccessNotification
                operation={parsedNotification.operation}
                target={parsedNotification.target}
                secondary={parsedNotification.secondary}
                connector={parsedNotification.connector}
                compact={true}
            />
        );
    }

    return (
        <span className={`jjscript-inline-output ${success ? 'success' : 'error'} ${className}`}>
            {success ? (
                <i className="bi bi-check" />
            ) : (
                <i className="bi bi-x" />
            )}
            {message.split('\n')[0]}
        </span>
    );
});

export default JjScriptOutput;
