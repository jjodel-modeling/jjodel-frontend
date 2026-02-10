/**
 * JjtlStatusBar Component
 * Status bar showing parser status, cursor position, and execution info
 */

import React from 'react';

export interface JjtlStatusBarProps {
    // Parser status
    parserStatus: 'idle' | 'parsing' | 'valid' | 'error';
    errorCount?: number;
    warningCount?: number;

    // Cursor position
    cursorLine?: number;
    cursorColumn?: number;

    // Execution status
    executionStatus?: 'idle' | 'running' | 'success' | 'failed';
    lastExecutionTime?: number; // ms
    mappedElementsCount?: number;

    // File info
    encoding?: string;
    lineEnding?: 'LF' | 'CRLF';

    // Actions
    onErrorsClick?: () => void;
    onWarningsClick?: () => void;
}

const STATUS_CONFIG = {
    idle: { icon: 'bi-circle', color: 'white', label: 'Idle' },
    parsing: { icon: 'bi-arrow-repeat spinning', color: 'white', label: 'Parsing...' },
    valid: { icon: 'bi-check-circle-fill', color: 'white', label: 'Valid' },
    error: { icon: 'bi-x-circle-fill', color: '#ef4444', label: 'Errors' },
};

const EXECUTION_STATUS_CONFIG = {
    idle: { icon: 'bi-circle', color: 'white', label: 'Ready' },
    running: { icon: 'bi-arrow-repeat spinning', color: 'white', label: 'Running' },
    success: { icon: 'bi-check-circle-fill', color: 'white', label: 'Success' },
    failed: { icon: 'bi-x-circle-fill', color: '#ef4444', label: 'Failed' },
};

export const JjtlStatusBar: React.FC<JjtlStatusBarProps> = ({
    parserStatus,
    errorCount = 0,
    warningCount = 0,
    cursorLine,
    cursorColumn,
    executionStatus = 'idle',
    lastExecutionTime,
    mappedElementsCount,
    encoding = 'UTF-8',
    lineEnding = 'LF',
    onErrorsClick,
    onWarningsClick,
}) => {
    const statusConfig = STATUS_CONFIG[parserStatus];
    const execConfig = EXECUTION_STATUS_CONFIG[executionStatus];

    return (
        <div className="jjtl-statusbar">
            {/* Left section */}
            <div className="jjtl-statusbar-section jjtl-statusbar-section--left">
                {/* Parser status */}
                <div
                    className="jjtl-statusbar-item jjtl-statusbar-parser"
                    style={{ color: statusConfig.color }}
                >
                    <i className={`bi ${statusConfig.icon}`} />
                    <span>{statusConfig.label}</span>
                </div>

                {/* Errors */}
                {errorCount > 0 && (
                    <button
                        className="jjtl-statusbar-item jjtl-statusbar-errors"
                        onClick={onErrorsClick}
                    >
                        <i className="bi bi-x-circle-fill" />
                        <span>{errorCount} {errorCount === 1 ? 'Error' : 'Errors'}</span>
                    </button>
                )}

                {/* Warnings */}
                {warningCount > 0 && (
                    <button
                        className="jjtl-statusbar-item jjtl-statusbar-warnings"
                        onClick={onWarningsClick}
                    >
                        <i className="bi bi-exclamation-triangle-fill" />
                        <span>{warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}</span>
                    </button>
                )}

                {/* No issues indicator */}
                {errorCount === 0 && warningCount === 0 && parserStatus === 'valid' && (
                    <div className="jjtl-statusbar-item jjtl-statusbar-ok">
                        <i className="bi bi-check-lg" />
                        <span>No issues</span>
                    </div>
                )}
            </div>

            {/* Center section - Execution info */}
            <div className="jjtl-statusbar-section jjtl-statusbar-section--center">
                <div
                    className="jjtl-statusbar-item jjtl-statusbar-execution"
                    style={{ color: execConfig.color }}
                >
                    <i className={`bi ${execConfig.icon}`} />
                    <span>{execConfig.label}</span>
                </div>

                {lastExecutionTime !== undefined && executionStatus !== 'running' && (
                    <div className="jjtl-statusbar-item jjtl-statusbar-time">
                        <i className="bi bi-clock" />
                        <span>{lastExecutionTime}ms</span>
                    </div>
                )}

                {mappedElementsCount !== undefined && executionStatus === 'success' && (
                    <div className="jjtl-statusbar-item jjtl-statusbar-mapped">
                        <i className="bi bi-diagram-2" />
                        <span>{mappedElementsCount} mapped</span>
                    </div>
                )}
            </div>

            {/* Right section - Cursor position and file info */}
            <div className="jjtl-statusbar-section jjtl-statusbar-section--right">
                {/* Cursor position */}
                {cursorLine !== undefined && cursorColumn !== undefined && (
                    <div className="jjtl-statusbar-item jjtl-statusbar-cursor">
                        <span>Ln {cursorLine}, Col {cursorColumn}</span>
                    </div>
                )}

                {/* Line ending */}
                <div className="jjtl-statusbar-item jjtl-statusbar-line-ending">
                    <span>{lineEnding}</span>
                </div>

                {/* Encoding */}
                <div className="jjtl-statusbar-item jjtl-statusbar-encoding">
                    <span>{encoding}</span>
                </div>

                {/* Language indicator */}
                <div className="jjtl-statusbar-item jjtl-statusbar-language">
                    <span>JjTL</span>
                </div>
            </div>
        </div>
    );
};

export default JjtlStatusBar;
