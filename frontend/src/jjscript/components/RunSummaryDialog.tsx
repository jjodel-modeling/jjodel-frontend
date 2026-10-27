/**
 * RunSummaryDialog
 * The one modal that closes every Run of a ScriptBlock (R-JS-6).
 *
 * Two states, one layout: `Script executed` and `Script executed with n errors`. Both show
 * what the run changed in the model (before, after, delta, per model that changed), the
 * commands executed, the commands resolved on retry and the duration; the second lists every
 * final error with its editor line, command, message, suggestion and recovery actions. A
 * script refused before command 1 uses the second state, titled `Script not executed`.
 * Superseded `set` lines (R-JS-3) are listed apart and are not errors.
 *
 * "Before" is a snapshot taken when the run started; "after" is read live from the store, so
 * the last command of the run counts even if its write lands after the run returned.
 *
 * Visual language of `ExecutionErrorDialog`, whose shell classes it reuses. Light theme only.
 */

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import './ExecutionErrorDialog.scss';
import './RunSummaryDialog.scss';
import { Keystrokes } from '../../common/U';
import type { RecoveryAction } from '../recovery';
import { changedModels, figuresEqual, type FigureRow, type ProjectFigures } from './runFigures';

// ============================================
// TYPES
// ============================================

export interface RunSummaryErrorRow {
    /** Index in the command list; -1 for a refusal before command 1. */
    commandIndex: number;
    /** Line as numbered in the editor. */
    line: number;
    command: string;
    message: string;
    suggestion?: string;
    actions: RecoveryAction[];
}

export interface RunSummarySupersededRow {
    line: number;
    command: string;
    /** Editor line of the later `set` that made this one pointless. */
    byLine: number;
}

export interface RunSummaryData {
    /** Refused before command 1 (a malformed script): nothing ran. */
    refused: boolean;
    executedCount: number;
    totalCommands: number;
    /** Editor lines of the commands that succeeded on a retry pass. */
    resolvedOnRetryLines: number[];
    durationMs: number;
    errors: RunSummaryErrorRow[];
    superseded: RunSummarySupersededRow[];
}

export interface RunSummaryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    data: RunSummaryData | null;
    /** The project's figures when the run started; null when nothing ran. */
    before: ProjectFigures | null;
    /** Reads the project's figures now. */
    readAfter: () => ProjectFigures | null;
    onRecoveryAction?: (action: RecoveryAction, row: RunSummaryErrorRow) => void;
    /** True while a recovery action runs: the actions are disabled. */
    busy?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const RunSummaryDialog: React.FC<RunSummaryDialogProps> = ({
    isOpen,
    onClose,
    data,
    before,
    readAfter,
    onRecoveryAction,
    busy = false,
}) => {
    // Live while open, compared by value, as the status bar reads its counts.
    const after = useSelector(() => (isOpen && before ? readAfter() : null), figuresEqual);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === Keystrokes.escape) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !data) return null;

    const errorCount = data.errors.length;
    const { icon, iconClass, title } = headerOf(data);
    const changes = changedModels(before, after);

    return (
        <div className="exec-error-overlay" onClick={onClose}>
            <div
                className="exec-error-dialog run-summary"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-labelledby="run-summary-title"
            >
                <div className={`exec-error-header exec-error-header--${iconClass}`}>
                    <i className={`bi ${icon}`} />
                    <h2 id="run-summary-title">{title}</h2>
                </div>

                <div className="exec-error-content run-summary__content">
                    {/* What the run changed */}
                    <div className="exec-error-section">
                        <label className="exec-error-label">Model</label>
                        {data.refused ? (
                            <div className="run-summary__none">Nothing was executed.</div>
                        ) : changes.length === 0 ? (
                            <div className="run-summary__none">No change to the model.</div>
                        ) : (
                            changes.map(change => (
                                <div className="run-summary__model" key={change.id}>
                                    <div className="run-summary__model-name">
                                        <i className={`bi ${change.isMetamodel ? 'bi-diagram-3' : 'bi-box'}`} />
                                        {change.name}
                                    </div>
                                    <table className="run-summary__figures">
                                        <thead>
                                            <tr>
                                                <th />
                                                <th>Before</th>
                                                <th>After</th>
                                                <th>Change</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {change.rows.map(row => (
                                                <tr key={row.label} className={row.delta !== 0 ? 'run-summary__row--changed' : ''}>
                                                    <th>{row.label}</th>
                                                    <td>{figure(row, 'before')}</td>
                                                    <td>{figure(row, 'after')}</td>
                                                    <td className={deltaClass(row.delta)}>{formatDelta(row.delta)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Every final error, at the end of the run */}
                    {errorCount > 0 && (
                        <div className="exec-error-section">
                            <label className="exec-error-label">Errors ({errorCount})</label>
                            <div className="run-summary__rows">
                                {data.errors.map((row, i) => (
                                    <div className="run-summary__error" key={`${row.line}-${i}`}>
                                        <div className="run-summary__row-head">
                                            <span className="run-summary__line">Line {row.line}</span>
                                            <code className="run-summary__command">{row.command}</code>
                                        </div>
                                        <div className="run-summary__message">{row.message}</div>
                                        {row.suggestion && (
                                            <div className="run-summary__suggestion">
                                                <i className="bi bi-lightbulb" />
                                                <span>{row.suggestion}</span>
                                            </div>
                                        )}
                                        {row.actions.length > 0 && onRecoveryAction && (
                                            <div className="run-summary__actions">
                                                {row.actions.map(action => (
                                                    <button
                                                        key={action.id}
                                                        className="exec-error-btn exec-error-btn--secondary run-summary__action"
                                                        onClick={() => onRecoveryAction(action, row)}
                                                        disabled={busy}
                                                    >
                                                        {action.icon && <i className={`bi bi-${action.icon}`} />}
                                                        {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Superseded `set` lines: not errors, listed apart */}
                    {data.superseded.length > 0 && (
                        <div className="exec-error-section">
                            <label className="exec-error-label">Superseded ({data.superseded.length})</label>
                            <div className="run-summary__rows">
                                {data.superseded.map((row, i) => (
                                    <div className="run-summary__superseded" key={`${row.line}-${i}`}>
                                        <div className="run-summary__row-head">
                                            <span className="run-summary__line">Line {row.line}</span>
                                            <code className="run-summary__command">{row.command}</code>
                                        </div>
                                        <div className="run-summary__note">superseded by line {row.byLine}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Figures of the run itself */}
                <div className="exec-error-stats">
                    <span>{data.executedCount} {data.executedCount === 1 ? 'command' : 'commands'} executed</span>
                    {data.resolvedOnRetryLines.length > 0 && (
                        <>
                            <span className="exec-error-stats-dot">•</span>
                            <span>
                                {data.resolvedOnRetryLines.length} resolved on retry
                                {' '}({data.resolvedOnRetryLines.length === 1 ? 'line' : 'lines'} {data.resolvedOnRetryLines.join(', ')})
                            </span>
                        </>
                    )}
                    <span className="exec-error-stats-dot">•</span>
                    <span>{formatDuration(data.durationMs)}</span>
                </div>

                <div className="exec-error-actions">
                    <button className="exec-error-btn exec-error-btn--primary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// UTILITIES
// ============================================

function headerOf(data: RunSummaryData): { icon: string; iconClass: string; title: string } {
    const n = data.errors.length;
    const errors = `${n} ${n === 1 ? 'error' : 'errors'}`;
    if (data.refused) return { icon: 'bi-x-circle', iconClass: 'error', title: `Script not executed: ${errors}` };
    if (n > 0) return { icon: 'bi-exclamation-circle', iconClass: 'warning', title: `Script executed with ${errors}` };
    return { icon: 'bi-check-circle', iconClass: 'success', title: 'Script executed' };
}

/** `7`, or `7 (2 abstract)` on the classes row when some are abstract. */
function figure(row: FigureRow, side: 'before' | 'after'): string {
    const value = row[side];
    const abstract = row.abstract?.[side] ?? 0;
    return abstract > 0 ? `${value} (${abstract} abstract)` : String(value);
}

function formatDelta(delta: number): string {
    if (delta > 0) return `+${delta}`;
    if (delta < 0) return `−${Math.abs(delta)}`;
    return '0';
}

function deltaClass(delta: number): string {
    if (delta > 0) return 'run-summary__delta run-summary__delta--up';
    if (delta < 0) return 'run-summary__delta run-summary__delta--down';
    return 'run-summary__delta';
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

export default RunSummaryDialog;
