/**
 * Generation Flow UI Components
 */

import React from 'react';
import { GenerationState, GenerationPhase } from './useMetamodelGeneration';

// ============================================
// CONFIRMATION MESSAGE
// ============================================

interface ConfirmationMessageProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    disabled?: boolean;
}

export const ConfirmationMessage: React.FC<ConfirmationMessageProps> = ({
    title, message, confirmText = 'Yes', cancelText = 'No',
    onConfirm, onCancel, disabled = false,
}) => (
    <div className="jjodie-confirmation">
        <div className="jjodie-confirmation-icon">
            <i className="bi bi-question-circle" />
        </div>
        <div className="jjodie-confirmation-content">
            <div className="jjodie-confirmation-title">{title}</div>
            <div className="jjodie-confirmation-message">{message}</div>
            <div className="jjodie-confirmation-actions">
                <button className="jjodie-btn jjodie-btn-primary" onClick={onConfirm} disabled={disabled}>
                    {confirmText}
                </button>
                <button className="jjodie-btn jjodie-btn-secondary" onClick={onCancel} disabled={disabled}>
                    {cancelText}
                </button>
            </div>
        </div>
    </div>
);

// ============================================
// METAMODEL SELECTOR
// ============================================

interface MetamodelSelectorProps {
    metamodels: Array<{ id: string; name: string }>;
    onSelect: (id: string) => void;
    onCancel: () => void;
    disabled?: boolean;
}

export const MetamodelSelector: React.FC<MetamodelSelectorProps> = ({
    metamodels, onSelect, onCancel, disabled = false,
}) => (
    <div className="jjodie-selector">
        <div className="jjodie-selector-icon">
            <i className="bi bi-diagram-3" />
        </div>
        <div className="jjodie-selector-content">
            <div className="jjodie-selector-title">Select Metamodel</div>
            <div className="jjodie-selector-message">
                Multiple metamodels are open. Which one should I use?
            </div>
            <div className="jjodie-selector-options">
                {metamodels.map(mm => (
                    <button key={mm.id} className="jjodie-selector-option"
                        onClick={() => onSelect(mm.id)} disabled={disabled}>
                        <i className="bi bi-file-earmark-code" />
                        <span>{mm.name}</span>
                    </button>
                ))}
            </div>
            <div className="jjodie-selector-footer">
                <button className="jjodie-btn jjodie-btn-ghost" onClick={onCancel} disabled={disabled}>
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

// ============================================
// SCRIPT EXECUTION BLOCK
// ============================================

interface ScriptExecutionBlockProps {
    // All lines from original script (for display)
    allLines: string[];
    // Only executable commands
    commands: string[];
    // Maps command index to original line number (1-based)
    commandToLineMap: number[];
    // Set of line indices (0-based) that are executable
    executableIndices: Set<number>;
    // Set of executed line numbers (1-based)
    executedLineNumbers: Set<number>;
    currentCommandIndex: number;
    phase: GenerationPhase;
    error?: string;
    onRun: () => void;
    onStep: () => void;
    onStop: () => void;
    onClose: () => void;
}

export const ScriptExecutionBlock: React.FC<ScriptExecutionBlockProps> = ({
    allLines, commands, commandToLineMap, executableIndices, executedLineNumbers,
    currentCommandIndex, phase, error, onRun, onStep, onStop, onClose,
}) => {
    const executedCount = executedLineNumbers.size;
    const totalCount = commands.length;

    // Get the current line number being executed (1-based)
    const currentLineNumber = currentCommandIndex >= 0 && commandToLineMap[currentCommandIndex]
        ? commandToLineMap[currentCommandIndex]
        : -1;

    // Determine line state based on line index (0-based) and content
    type LineState = 'empty' | 'comment' | 'pending' | 'current' | 'executed' | 'error';

    const getLineState = (lineIndex: number, lineContent: string): LineState => {
        const trimmed = lineContent.trim();
        const lineNumber = lineIndex + 1; // Convert to 1-based for comparison

        // Empty line
        if (!trimmed) {
            return 'empty';
        }

        // Comment line
        if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
            return 'comment';
        }

        // Check if this is an executable line
        if (!executableIndices.has(lineIndex)) {
            return 'comment'; // Treat as comment if not executable
        }

        // Check if this line has an error
        if (error && lineNumber === currentLineNumber) {
            return 'error';
        }

        // Check if currently executing this line
        if (lineNumber === currentLineNumber && phase === 'executing') {
            return 'current';
        }

        // Check if paused at this line
        if (lineNumber === currentLineNumber && phase === 'paused') {
            return 'current';
        }

        // Check if executed
        if (executedLineNumbers.has(lineNumber)) {
            return 'executed';
        }

        return 'pending';
    };

    // Convert state to CSS class
    const getLineClass = (state: LineState): string => {
        switch (state) {
            case 'empty': return 'jjs-line-empty';
            case 'comment': return 'jjs-line-comment';
            case 'pending': return 'jjs-line-pending';
            case 'current': return 'jjs-line-current';
            case 'executed': return 'jjs-line-executed';
            case 'error': return 'jjs-line-error';
            default: return 'jjs-line-pending';
        }
    };

    const getStatusText = (): string => {
        switch (phase) {
            case 'ready-to-execute': return 'Ready';
            case 'executing': return 'Executing...';
            case 'paused': return 'Paused';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            case 'error': return 'Error';
            default: return '';
        }
    };

    const isRunning = phase === 'executing';
    const isPaused = phase === 'paused';
    const isReady = phase === 'ready-to-execute';
    const isFinished = phase === 'completed' || phase === 'cancelled' || phase === 'error';

    return (
        <div className="jjs-execution-block">
            <div className="jjs-execution-header">
                <div className="jjs-execution-title">
                    <i className="bi bi-terminal" /> JJSCRIPT
                </div>
                <div className="jjs-execution-header-right">
                    <span className="jjs-execution-meta">{totalCount} commands</span>
                    <button className="jjs-close-btn" onClick={onClose} title="Close">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>
            </div>

            <div className="jjs-execution-code">
                {allLines.map((line, idx) => {
                    const lineNumber = idx + 1; // 1-based
                    const state = getLineState(idx, line);
                    const lineClass = getLineClass(state);

                    return (
                        <div key={idx} className={`jjs-execution-line ${lineClass}`}>
                            <span className="jjs-line-number">{lineNumber}</span>
                            <span className="jjs-line-content">
                                {line || '\u00A0'}
                            </span>
                            <span className="jjs-line-status">
                                {state === 'executed' && <i className="bi bi-check jjs-icon-success" />}
                                {state === 'current' && phase === 'executing' && <i className="bi bi-arrow-right jjs-icon-current" />}
                                {state === 'current' && phase === 'paused' && <i className="bi bi-pause-fill jjs-icon-paused" />}
                                {state === 'error' && <i className="bi bi-x jjs-icon-error" />}
                            </span>
                        </div>
                    );
                })}
            </div>

            {!isReady && (
                <div className="jjs-execution-progress">
                    <div className="jjs-progress-bar" style={{ width: `${(executedCount / totalCount) * 100}%` }} />
                </div>
            )}

            {error && (
                <div className="jjs-execution-error">
                    <i className="bi bi-exclamation-circle" />
                    <span>{error}</span>
                </div>
            )}

            <div className="jjs-execution-actions">
                {isReady && (
                    <>
                        <button className="jjs-btn jjs-btn-primary" onClick={onRun}>
                            <i className="bi bi-play-fill" /> Run All
                        </button>
                        <button className="jjs-btn jjs-btn-secondary" onClick={onStep}>
                            <i className="bi bi-skip-forward" /> Step
                        </button>
                    </>
                )}

                {isPaused && (
                    <>
                        <button className="jjs-btn jjs-btn-primary" onClick={onRun}>
                            <i className="bi bi-play-fill" /> Continue
                        </button>
                        <button className="jjs-btn jjs-btn-secondary" onClick={onStep}>
                            <i className="bi bi-skip-forward" /> Step
                        </button>
                        <button className="jjs-btn jjs-btn-danger" onClick={onStop}>
                            <i className="bi bi-stop-fill" /> Stop & Undo
                        </button>
                    </>
                )}

                {isRunning && (
                    <button className="jjs-btn jjs-btn-danger" onClick={onStop}>
                        <i className="bi bi-stop-fill" /> Stop & Undo
                    </button>
                )}

                {phase === 'completed' && (
                    <div className="jjs-execution-complete">
                        <i className="bi bi-check-circle-fill" /> Metamodel created successfully!
                    </div>
                )}

                {phase === 'cancelled' && (
                    <div className="jjs-execution-cancelled">
                        <i className="bi bi-x-circle" /> Generation cancelled. Changes undone.
                    </div>
                )}
            </div>

            <div className="jjs-execution-footer">
                <div className="jjs-status">
                    <span className={`jjs-status-dot jjs-${phase}`} />
                    {getStatusText()}
                </div>
                {!isReady && !isFinished && (
                    <div className="jjs-counter">{executedCount} / {totalCount}</div>
                )}
            </div>
        </div>
    );
};

// ============================================
// MAIN FLOW MESSAGE RENDERER
// ============================================

interface GenerationFlowMessageProps {
    state: GenerationState;
    onConfirmProject: (confirm: boolean) => void;
    onConfirmMetamodel: (confirm: boolean) => void;
    onSelectMetamodel: (id: string) => void;
    onConfirmNonEmpty: (confirm: boolean) => void;
    onRun: () => void;
    onStep: () => void;
    onStop: () => void;
    onClose: () => void;
}

export const GenerationFlowMessage: React.FC<GenerationFlowMessageProps> = ({
    state, onConfirmProject, onConfirmMetamodel, onSelectMetamodel,
    onConfirmNonEmpty, onRun, onStep, onStop, onClose,
}) => {
    const { phase } = state;

    if (phase === 'no-project') {
        return (
            <div className="jjodie-info-message">
                <i className="bi bi-info-circle" />
                <span>Open a project to run this script</span>
                <button className="jjodie-info-close" onClick={onClose} title="Close">
                    <i className="bi bi-x-lg" />
                </button>
            </div>
        );
    }

    if (phase === 'no-metamodel') {
        return (
            <div className="jjodie-info-message">
                <i className="bi bi-info-circle" />
                <span>Open a metamodel to run this script</span>
                <button className="jjodie-info-close" onClick={onClose} title="Close">
                    <i className="bi bi-x-lg" />
                </button>
            </div>
        );
    }

    if (phase === 'confirm-non-empty') {
        return (
            <ConfirmationMessage
                title="Metamodel Has Existing Elements"
                message="The selected metamodel already contains elements. Do you want to add the generated elements to it?"
                confirmText="Yes, proceed"
                cancelText="No, cancel"
                onConfirm={() => onConfirmNonEmpty(true)}
                onCancel={() => onConfirmNonEmpty(false)}
            />
        );
    }

    if (['ready-to-execute', 'executing', 'paused', 'completed', 'cancelled', 'error'].includes(phase)) {
        return (
            <ScriptExecutionBlock
                allLines={state.allLines || []}
                commands={state.commands || []}
                commandToLineMap={state.commandToLineMap || []}
                executableIndices={state.executableIndices || new Set<number>()}
                executedLineNumbers={state.executedLineNumbers}
                currentCommandIndex={state.currentCommandIndex}
                phase={phase}
                error={state.error}
                onRun={onRun}
                onStep={onStep}
                onStop={onStop}
                onClose={onClose}
            />
        );
    }

    if (phase === 'checking-state') {
        return (
            <div className="jjodie-loading">
                <i className="bi bi-hourglass-split" />
                <span>Checking project state...</span>
            </div>
        );
    }

    return null;
};
