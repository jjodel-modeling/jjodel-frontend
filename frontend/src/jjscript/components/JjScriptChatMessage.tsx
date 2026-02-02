/**
 * JjScript Chat Message Component
 * Renders JjScript execution results in Jjodie chat style
 */

import React, { memo } from 'react';
import { ExecutionResult } from '../types';
import './JjScriptChatMessage.scss';

interface JjScriptChatMessageProps {
    command: string;
    result: ExecutionResult;
}

export const JjScriptChatMessage: React.FC<JjScriptChatMessageProps> = memo(({
    command,
    result
}) => {
    const { success, message, errors, warnings, data } = result;

    return (
        <div className={`jjscript-chat-result ${success ? 'jjscript-chat-result--success' : 'jjscript-chat-result--error'}`}>
            {/* Header with command echo */}
            <div className="jjscript-chat-header">
                <div className="jjscript-command-echo">
                    <span className="command-prefix">&gt;</span>
                    <code className="command-text">{command}</code>
                </div>
                <span className={`status-badge ${success ? 'status-badge--success' : 'status-badge--error'}`}>
                    {success ? (
                        <>
                            <i className="bi bi-check-circle-fill" />
                            <span>OK</span>
                        </>
                    ) : (
                        <>
                            <i className="bi bi-x-circle-fill" />
                            <span>Error</span>
                        </>
                    )}
                </span>
            </div>

            {/* Main message */}
            <div className="jjscript-chat-message">
                {formatMessageContent(message)}
            </div>

            {/* Errors */}
            {errors && errors.length > 0 && (
                <div className="jjscript-chat-errors">
                    {errors.map((error, i) => (
                        <div key={i} className="error-entry">
                            <span className="error-code">{error.code}</span>
                            <span className="error-message">{error.message}</span>
                            {error.suggestion && (
                                <div className="error-suggestion">
                                    <i className="bi bi-lightbulb-fill" />
                                    <span>{error.suggestion}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Warnings */}
            {warnings && warnings.length > 0 && (
                <div className="jjscript-chat-warnings">
                    {warnings.map((warning, i) => (
                        <div key={i} className="warning-entry">
                            <i className="bi bi-exclamation-triangle-fill" />
                            <span>{warning}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Tree output */}
            {data?.tree && (
                <div className="jjscript-chat-tree">
                    <pre>{data.tree.join('\n')}</pre>
                </div>
            )}

            {/* List output */}
            {data?.elements && Array.isArray(data.elements) && data.elements.length > 0 && (
                <div className="jjscript-chat-list">
                    {data.elements.map((item: string, i: number) => (
                        <div key={i} className="list-entry">{item}</div>
                    ))}
                </div>
            )}

            {/* Details output */}
            {data?.details && Array.isArray(data.details) && data.details.length > 0 && (
                <div className="jjscript-chat-details">
                    {data.details.map((item: string, i: number) => (
                        <div key={i} className="detail-entry">{item}</div>
                    ))}
                </div>
            )}

            {/* Affected elements */}
            {success && data?.affectedElements && data.affectedElements.length > 0 && (
                <div className="jjscript-chat-affected">
                    <span className="affected-label">Affected:</span>
                    <span className="affected-count">{data.affectedElements.length} element{data.affectedElements.length !== 1 ? 's' : ''}</span>
                </div>
            )}
        </div>
    );
});

/**
 * Format message content with line breaks
 */
function formatMessageContent(message: string): JSX.Element {
    const lines = message.split('\n');
    return (
        <>
            {lines.map((line, i) => (
                <div key={i} className="message-line">
                    {line || '\u00A0'}
                </div>
            ))}
        </>
    );
}

export default JjScriptChatMessage;
