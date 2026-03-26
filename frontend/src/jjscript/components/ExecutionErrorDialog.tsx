/**
 * ExecutionErrorDialog
 * Professional error dialog with clear messaging and actionable options
 *
 * Two modes:
 * 1. Paused: Execution stopped on error, user can Skip or Stop
 * 2. Completed: Shows final execution summary with skipped lines
 */

import React, { useEffect, useCallback } from 'react';
import {JjScriptError, ExecutionPauseInfo, ExecutionSummary, ExecutionErrorInfo} from '../executor/errors';
import './ExecutionErrorDialog.scss';
import {ExecutionError} from "../types";
import {ExecutionStats} from "./ScriptBlock";
import {Keystrokes} from "../../common/U";

// ============================================
// TYPES
// ============================================

export interface ExecutionErrorDialogProps {
    isOpen: boolean;
    onClose?: () => void;

    /** Current error info (when paused) */
    pauseInfo?: ExecutionPauseInfo;

    /** Final summary (when completed) */
    summary?: ExecutionSummary;

    /** Skip current line and continue */
    onSkip?: () => void;

    /** Retry current command */
    onRetry?: () => void;
    error?: ExecutionErrorInfo;
    stats?: ExecutionStats;
    onReEvaluate?: (cmd: string) => Promise<boolean>;
    onStop?: () => void;
    onContinue?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const ExecutionErrorDialog: React.FC<ExecutionErrorDialogProps> = ({
    isOpen,
    onClose,
    pauseInfo,
    summary,
    onSkip,
    onRetry,
}) => {
    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === Keystrokes.escape) { onClose?.(); }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Determine dialog mode
    const isPaused = !!pauseInfo;
    const isCompleted = !!summary;
    const hasErrors = summary && summary.errorCount > 0;
    const hasSkipped = summary && summary.skippedCount > 0;

    // Determine icon and title
    const getHeaderInfo = () => {
        if (isPaused) {
            return {
                icon: 'bi-exclamation-circle',
                iconClass: 'warning',
                title: `Execution stopped at line ${pauseInfo!.lineNumber}`,
            };
        }
        if (isCompleted && hasErrors && summary.executedCount === 0) {
            return {
                icon: 'bi-x-circle',
                iconClass: 'error',
                title: 'Execution failed',
            };
        }
        if (isCompleted && hasSkipped) {
            return {
                icon: 'bi-check-circle',
                iconClass: 'warning',
                title: 'Execution completed with warnings',
            };
        }
        return {
            icon: 'bi-check-circle',
            iconClass: 'success',
            title: 'Execution completed',
        };
    };

    const { icon, iconClass, title } = getHeaderInfo();

    return (
        <div className="exec-error-overlay" onClick={onClose}>
            <div
                className="exec-error-dialog"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-labelledby="exec-error-title"
            >
                {/* Header */}
                <div className={`exec-error-header exec-error-header--${iconClass}`}>
                    <i className={`bi ${icon}`} />
                    <h2 id="exec-error-title">{title}</h2>
                </div>

                {/* Content */}
                <div className="exec-error-content">
                    {/* Paused state: show current error */}
                    {isPaused && pauseInfo && (
                        <PausedContent pauseInfo={pauseInfo} />
                    )}

                    {/* Completed state: show summary */}
                    {isCompleted && summary && (
                        <CompletedContent summary={summary} />
                    )}
                </div>

                {/* Stats bar */}
                <div className="exec-error-stats">
                    {isPaused && pauseInfo && (
                        <>
                            <span>{pauseInfo.executedSoFar} commands executed</span>
                            <span className="exec-error-stats-dot">•</span>
                            <span>1 error</span>
                            <span className="exec-error-stats-dot">•</span>
                            <span>{formatDuration(pauseInfo.elapsedMs)}</span>
                        </>
                    )}
                    {isCompleted && summary && (
                        <>
                            <span>{summary.executedCount} commands executed</span>
                            {summary.skippedCount > 0 && (
                                <>
                                    <span className="exec-error-stats-dot">•</span>
                                    <span className="exec-error-stats-skipped">{summary.skippedCount} skipped</span>
                                </>
                            )}
                            <span className="exec-error-stats-dot">•</span>
                            <span>{formatDuration(summary.duration)}</span>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="exec-error-actions">
                    {isPaused && (pauseInfo?.error as JjScriptError)?.skippable && onSkip && (
                        <button
                            className="exec-error-btn exec-error-btn--secondary"
                            onClick={onSkip}
                        >
                            <i className="bi bi-skip-forward" />
                            Skip Line
                        </button>
                    )}
                    <button
                        className="exec-error-btn exec-error-btn--primary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// SUB-COMPONENTS
// ============================================

interface PausedContentProps {
    pauseInfo: ExecutionPauseInfo;
}

const PausedContent: React.FC<PausedContentProps> = ({ pauseInfo }) => {
    const { command, error } = pauseInfo;

    return (
        <>
            {/* Command display */}
            <div className="exec-error-section">
                <label className="exec-error-label">Command:</label>
                <div className="exec-error-command">
                    <code>{command}</code>
                </div>
            </div>

            {/* Error message */}
            <div className="exec-error-section">
                <label className="exec-error-label">Error:</label>
                <div className="exec-error-message">
                    {(error as JjScriptError)?.message ? (error as JjScriptError).message.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                    )) : error.toString()}
                </div>
            </div>

            {/* Suggestion (if any) */}
            {(error as JjScriptError)?.suggestion && (
                <div className="exec-error-suggestion">
                    <i className="bi bi-lightbulb" />
                    <span>{(error as JjScriptError)!.suggestion}</span>
                </div>
            )}
        </>
    );
};

interface CompletedContentProps {
    summary: ExecutionSummary;
}

const CompletedContent: React.FC<CompletedContentProps> = ({ summary }) => {
    const { skippedLines, errors, executedCount, totalCommands } = summary;

    // No issues - full success
    if (skippedLines.length === 0 && errors.length === 0) {
        return (
            <div className="exec-error-success">
                <i className="bi bi-check-lg" />
                <p>All {executedCount} commands executed successfully.</p>
            </div>
        );
    }

    return (
        <>
            {/* Skipped lines */}
            {skippedLines.length > 0 && (
                <div className="exec-error-section">
                    <label className="exec-error-label">Skipped lines:</label>
                    <div className="exec-error-skipped-lines">
                        {skippedLines.join(', ')}
                    </div>
                </div>
            )}

            {/* Error list (collapsed by default if many) */}
            {errors.length > 0 && (
                <div className="exec-error-section">
                    <label className="exec-error-label">
                        Errors ({errors.length}):
                    </label>
                    <div className="exec-error-list">
                        {errors.slice(0, 3).map((err, i) => (
                            <div key={i} className="exec-error-list-item">
                                <span className="exec-error-list-line">
                                    Line {err.line}:
                                </span>
                                <span className="exec-error-list-message">
                                    {err.error.message.split('\n')[0]}
                                </span>
                            </div>
                        ))}
                        {errors.length > 3 && (
                            <div className="exec-error-list-more">
                                +{errors.length - 3} more errors
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

// ============================================
// UTILITIES
// ============================================

function formatDuration(ms: number): string {
    if (ms < 1000) {
        return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
}

export default ExecutionErrorDialog;
