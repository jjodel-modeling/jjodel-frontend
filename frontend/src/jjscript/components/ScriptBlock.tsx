/**
 * ScriptBlock Component
 * Interactive JjScript code execution UI with Execute/Step functionality
 *
 * Design: "Understated Excellence" - subtle but precise, professional like VS Code/JetBrains
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ScriptBlock.scss';

// ============================================
// TYPES
// ============================================

/** Target metamodel for script execution */
export interface ScriptTarget {
    id: string;
    name: string;
}

export interface ScriptBlockProps {
    /** The JjScript code (formal or natural syntax) */
    code: string;
    /** Callback when code is executed */
    onExecute?: (commands: string[], targetId?: string) => Promise<ScriptLineResult[]>;
    /** Initial expanded state */
    defaultExpanded?: boolean;
    /** Whether execution is allowed */
    allowExecution?: boolean;
    /** Custom class name */
    className?: string;
    /** Available target metamodels for execution */
    availableTargets?: ScriptTarget[];
    /** Currently selected target ID */
    selectedTargetId?: string;
    /** Callback when target selection changes */
    onTargetChange?: (targetId: string) => void;
    /** Callback to open execution window */
    onOpenExecutionWindow?: (script: string, target: ScriptTarget) => void;
}

export interface ScriptLineResult {
    command: string;
    success: boolean;
    message: string;
    warnings?: string[];
}

/** @deprecated Use ScriptLineResult instead */
export type ExecutionResult = ScriptLineResult;

type ExecutionState = 'idle' | 'running' | 'stepping' | 'paused' | 'completed' | 'error';

interface LineState {
    index: number;
    command: string;
    status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
    result?: ScriptLineResult;
}

interface ExecutionStats {
    totalCommands: number;
    executedCommands: number;
    skippedLines: number;
    errors: number;
    duration: number;
    /** Number of successful retries during execution */
    successfulRetries?: number;
}

interface ExecutionErrorInfo {
    command: string;
    lineNumber: number;
    error: string;
    /** Whether a retry was attempted */
    wasRetried: boolean;
    /** Error message from retry attempt (if different) */
    retryError?: string;
}

// Utility function for delay between commands
const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Delay between commands in batch mode (ms)
const BATCH_DELAY_MS = 20;

// Retry delay when parent not found (ms)
const RETRY_DELAY_MS = 150;

// Maximum number of retries for parent not found errors
const MAX_RETRIES = 1;

// Error patterns that indicate "parent not found" - retryable errors
const RETRYABLE_ERROR_PATTERNS = [
    /class .* not found/i,
    /parent .* not found/i,
    /container .* not found/i,
    /package .* not found/i,
    /cannot find .* to add/i,
    /target .* does not exist/i,
    /element .* not found/i,
    /could not find parent/i,
    /no parent class/i,
    /unable to locate/i,
    /not found in/i,
];

/**
 * Check if an error message indicates a "parent not found" error that can be retried
 */
function isRetryableError(errorMessage: string): boolean {
    return RETRYABLE_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage));
}

// ============================================
// CUSTOM THEME (Light)
// ============================================

const scriptBlockTheme = {
    ...oneLight,
    'pre[class*="language-"]': {
        ...oneLight['pre[class*="language-"]'],
        background: 'transparent',
        margin: 0,
        padding: 0,
        fontSize: '13px',
        lineHeight: '1.6',
    },
    'code[class*="language-"]': {
        ...oneLight['code[class*="language-"]'],
        background: 'transparent',
        fontFamily: "'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'Consolas', monospace",
        fontSize: '13px',
    },
};

// ============================================
// COMPONENT
// ============================================

// Pattern to extract target command from script
const TARGET_PATTERN = /^target\s+(\S+)\s*$/im;

export const ScriptBlock: React.FC<ScriptBlockProps> = ({
    code,
    onExecute,
    defaultExpanded = true,
    allowExecution = true,
    className = '',
    availableTargets = [],
    selectedTargetId,
    onTargetChange,
    onOpenExecutionWindow,
}) => {
    // State
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [executionState, setExecutionState] = useState<ExecutionState>('idle');
    const [lineStates, setLineStates] = useState<LineState[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [localTargetId, setLocalTargetId] = useState(selectedTargetId || '');

    // Execution completion modal state
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [executionStats, setExecutionStats] = useState<ExecutionStats | null>(null);
    const [executionErrorInfo, setExecutionErrorInfo] = useState<ExecutionErrorInfo | null>(null);

    // Refs
    const abortRef = useRef(false);
    const startTimeRef = useRef<number>(0);
    const successfulRetriesRef = useRef<number>(0);

    // Memoized values - always use original code (normalized internally if needed)
    const displayCode = code;

    // Extract target from script if present
    const scriptTarget = useMemo(() => {
        const match = code.match(TARGET_PATTERN);
        return match ? match[1] : null;
    }, [code]);

    // Resolve target from script command or selection
    const resolvedTarget = useMemo((): ScriptTarget | null => {
        if (scriptTarget) {
            // Find by name from script
            const found = availableTargets.find(t =>
                t.name.toLowerCase() === scriptTarget.toLowerCase()
            );
            return found || { id: '', name: scriptTarget }; // Return even if not found (for error display)
        }
        // Use selected target
        const selected = localTargetId || selectedTargetId;
        if (selected) {
            return availableTargets.find(t => t.id === selected) || null;
        }
        return null;
    }, [scriptTarget, availableTargets, localTargetId, selectedTargetId]);

    // Check if target is valid
    const hasValidTarget = resolvedTarget && resolvedTarget.id !== '';
    const targetError = scriptTarget && !hasValidTarget
        ? `Metamodel "${scriptTarget}" not found`
        : (!hasValidTarget && availableTargets.length > 0 ? 'Select a target metamodel' : null);

    const commands = useMemo(() => {
        return code
            .split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('//') && !l.startsWith('#') && !l.toLowerCase().startsWith('target '));
    }, [code]);

    const lineCount = displayCode.split('\n').length;

    // Initialize line states
    useEffect(() => {
        setLineStates(
            commands.map((cmd, idx) => ({
                index: idx,
                command: cmd,
                status: 'pending',
            }))
        );
        setCurrentLineIndex(-1);
        setExecutionState('idle');
    }, [commands]);

    // Copy handler
    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(displayCode);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [displayCode]);

    // Handle target change
    const handleTargetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTargetId = e.target.value;
        setLocalTargetId(newTargetId);
        onTargetChange?.(newTargetId);
    }, [onTargetChange]);

    // Open execution window
    const handleOpenWindow = useCallback(() => {
        if (onOpenExecutionWindow && resolvedTarget && hasValidTarget) {
            onOpenExecutionWindow(code, resolvedTarget);
        }
    }, [onOpenExecutionWindow, code, resolvedTarget, hasValidTarget]);

    /**
     * Execute a single command with retry logic for "parent not found" errors
     */
    const executeWithRetry = useCallback(async (
        command: string,
        lineNumber: number,
        executor: (cmd: string) => Promise<ScriptLineResult>
    ): Promise<{ success: boolean; result: ScriptLineResult; wasRetried: boolean; retryError?: string }> => {
        // First attempt
        const firstResult = await executor(command);

        if (firstResult.success) {
            return { success: true, result: firstResult, wasRetried: false };
        }

        // Check if error is retryable (parent not found)
        const errorMessage = firstResult.message || '';
        if (!isRetryableError(errorMessage)) {
            // Non-retryable error, fail immediately
            return { success: false, result: firstResult, wasRetried: false };
        }

        console.log(`[JjScript] Line ${lineNumber}: Parent not found, waiting ${RETRY_DELAY_MS}ms and retrying...`);
        console.log(`[JjScript] Command: ${command}`);
        console.log(`[JjScript] First error: ${errorMessage}`);

        // Wait and retry
        await sleep(RETRY_DELAY_MS);

        const retryResult = await executor(command);

        if (retryResult.success) {
            console.log(`[JjScript] Line ${lineNumber}: Retry successful!`);
            successfulRetriesRef.current++;
            return { success: true, result: retryResult, wasRetried: true };
        }

        // Retry also failed
        console.error(`[JjScript] Line ${lineNumber}: Retry failed!`);
        return {
            success: false,
            result: firstResult,
            wasRetried: true,
            retryError: retryResult.message
        };
    }, []);

    // Execute all commands (or continue from where stepping left off)
    const handleExecute = useCallback(async () => {
        if (!onExecute || commands.length === 0) return;
        if (!hasValidTarget && availableTargets.length > 0) {
            console.warn('[ScriptBlock] No target selected');
            return;
        }

        abortRef.current = false;
        startTimeRef.current = Date.now();
        successfulRetriesRef.current = 0;
        setExecutionState('running');
        setExecutionErrorInfo(null);

        // If we were stepping/paused, continue from current position
        // Otherwise start from the beginning
        const startIndex = (executionState === 'paused' || executionState === 'stepping')
            ? currentLineIndex
            : 0;

        // Reset only lines from startIndex onwards
        if (startIndex === 0) {
            setLineStates(prev =>
                prev.map(ls => ({ ...ls, status: 'pending', result: undefined }))
            );
        } else {
            // Keep already-executed lines as is, reset only remaining ones
            setLineStates(prev =>
                prev.map((ls, idx) =>
                    idx >= startIndex ? { ...ls, status: 'pending', result: undefined } : ls
                )
            );
        }

        let executedCount = startIndex; // Count already executed if resuming
        let errorCount = 0;
        const results: ScriptLineResult[] = [];

        for (let i = startIndex; i < commands.length; i++) {
            if (abortRef.current) break;

            setCurrentLineIndex(i);
            setLineStates(prev =>
                prev.map((ls, idx) =>
                    idx === i ? { ...ls, status: 'running' } : ls
                )
            );

            try {
                // Execute with retry for parent not found errors
                const { success, result, wasRetried, retryError } = await executeWithRetry(
                    commands[i],
                    i + 1, // 1-based line number
                    async (cmd) => {
                        const [res] = await onExecute([cmd], resolvedTarget?.id);
                        return res;
                    }
                );

                results.push(result);

                setLineStates(prev =>
                    prev.map((ls, idx) =>
                        idx === i
                            ? { ...ls, status: success ? 'success' : 'error', result }
                            : ls
                    )
                );

                if (success) {
                    executedCount++;
                } else {
                    errorCount++;
                    // Store detailed error info for the modal
                    setExecutionErrorInfo({
                        command: commands[i],
                        lineNumber: i + 1,
                        error: result.message || 'Unknown error',
                        wasRetried,
                        retryError,
                    });
                    // Show completion modal with error stats
                    const duration = Date.now() - startTimeRef.current;
                    setExecutionStats({
                        totalCommands: commands.length,
                        executedCommands: executedCount,
                        skippedLines: 0,
                        errors: errorCount,
                        duration,
                        successfulRetries: successfulRetriesRef.current,
                    });
                    setExecutionState('error');
                    setShowCompleteModal(true);
                    return;
                }

                // Add delay between commands for proper processing
                if (i < commands.length - 1 && !abortRef.current) {
                    await sleep(BATCH_DELAY_MS);
                }
            } catch (err) {
                errorCount++;
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setLineStates(prev =>
                    prev.map((ls, idx) =>
                        idx === i
                            ? {
                                  ...ls,
                                  status: 'error',
                                  result: {
                                      command: commands[i],
                                      success: false,
                                      message: errorMessage,
                                  },
                              }
                            : ls
                    )
                );
                // Store detailed error info for the modal
                setExecutionErrorInfo({
                    command: commands[i],
                    lineNumber: i + 1,
                    error: errorMessage,
                    wasRetried: false,
                });
                // Show completion modal with error stats
                const duration = Date.now() - startTimeRef.current;
                setExecutionStats({
                    totalCommands: commands.length,
                    executedCommands: executedCount,
                    skippedLines: 0,
                    errors: errorCount,
                    duration,
                    successfulRetries: successfulRetriesRef.current,
                });
                setExecutionState('error');
                setShowCompleteModal(true);
                return;
            }
        }

        // Execution completed successfully
        const duration = Date.now() - startTimeRef.current;
        setExecutionStats({
            totalCommands: commands.length,
            executedCommands: executedCount,
            skippedLines: 0,
            errors: 0,
            duration,
            successfulRetries: successfulRetriesRef.current,
        });
        setExecutionState('completed');
        setCurrentLineIndex(-1);
        setShowCompleteModal(true);
    }, [commands, onExecute, executionState, currentLineIndex, hasValidTarget, availableTargets.length, resolvedTarget, executeWithRetry]);

    // Step through commands one by one
    const handleStep = useCallback(async () => {
        if (!onExecute || commands.length === 0) return;
        if (!hasValidTarget && availableTargets.length > 0) {
            console.warn('[ScriptBlock] No target selected');
            return;
        }

        // If starting fresh or resuming from completed
        if (executionState === 'idle' || executionState === 'completed') {
            // Reset all states
            setLineStates(prev =>
                prev.map(ls => ({ ...ls, status: 'pending', result: undefined }))
            );
            setCurrentLineIndex(0);
            setExecutionState('stepping');
            startTimeRef.current = Date.now(); // Start timing
            successfulRetriesRef.current = 0;
            setExecutionErrorInfo(null);
        }

        const nextIndex = executionState === 'paused' ? currentLineIndex : 0;

        if (nextIndex >= commands.length) {
            // Show completion modal
            const duration = Date.now() - startTimeRef.current;
            setExecutionStats({
                totalCommands: commands.length,
                executedCommands: commands.length,
                skippedLines: 0,
                errors: 0,
                duration,
                successfulRetries: successfulRetriesRef.current,
            });
            setExecutionState('completed');
            setShowCompleteModal(true);
            return;
        }

        abortRef.current = false;
        setExecutionState('stepping');
        setCurrentLineIndex(nextIndex);

        // Mark current as running
        setLineStates(prev =>
            prev.map((ls, idx) =>
                idx === nextIndex ? { ...ls, status: 'running' } : ls
            )
        );

        try {
            // Execute with retry for parent not found errors
            const { success, result, wasRetried, retryError } = await executeWithRetry(
                commands[nextIndex],
                nextIndex + 1, // 1-based line number
                async (cmd) => {
                    const [res] = await onExecute([cmd], resolvedTarget?.id);
                    return res;
                }
            );

            setLineStates(prev =>
                prev.map((ls, idx) =>
                    idx === nextIndex
                        ? { ...ls, status: success ? 'success' : 'error', result }
                        : ls
                )
            );

            if (success && nextIndex < commands.length - 1) {
                setCurrentLineIndex(nextIndex + 1);
                setExecutionState('paused');
            } else if (success) {
                // Last step completed - show modal
                const duration = Date.now() - startTimeRef.current;
                setExecutionStats({
                    totalCommands: commands.length,
                    executedCommands: nextIndex + 1,
                    skippedLines: 0,
                    errors: 0,
                    duration,
                    successfulRetries: successfulRetriesRef.current,
                });
                setExecutionState('completed');
                setCurrentLineIndex(-1);
                setShowCompleteModal(true);
            } else {
                // Error - store detailed info and show modal
                setExecutionErrorInfo({
                    command: commands[nextIndex],
                    lineNumber: nextIndex + 1,
                    error: result.message || 'Unknown error',
                    wasRetried,
                    retryError,
                });
                const duration = Date.now() - startTimeRef.current;
                setExecutionStats({
                    totalCommands: commands.length,
                    executedCommands: nextIndex,
                    skippedLines: 0,
                    errors: 1,
                    duration,
                    successfulRetries: successfulRetriesRef.current,
                });
                setExecutionState('error');
                setShowCompleteModal(true);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setLineStates(prev =>
                prev.map((ls, idx) =>
                    idx === nextIndex
                        ? {
                              ...ls,
                              status: 'error',
                              result: {
                                  command: commands[nextIndex],
                                  success: false,
                                  message: errorMessage,
                              },
                          }
                        : ls
                )
            );
            // Store error info for the modal
            setExecutionErrorInfo({
                command: commands[nextIndex],
                lineNumber: nextIndex + 1,
                error: errorMessage,
                wasRetried: false,
            });
            // Show error modal
            const duration = Date.now() - startTimeRef.current;
            setExecutionStats({
                totalCommands: commands.length,
                executedCommands: nextIndex,
                skippedLines: 0,
                errors: 1,
                duration,
                successfulRetries: successfulRetriesRef.current,
            });
            setExecutionState('error');
            setShowCompleteModal(true);
        }
    }, [commands, currentLineIndex, executionState, onExecute, hasValidTarget, availableTargets.length, resolvedTarget, executeWithRetry]);

    // Stop execution
    const handleStop = useCallback(() => {
        abortRef.current = true;
        setExecutionState('idle');
        setCurrentLineIndex(-1);
        setLineStates(prev => prev.map(ls => ({ ...ls, status: 'pending', result: undefined })));
    }, []);

    // Get status icon for a line
    const getLineStatusIcon = (status: LineState['status']) => {
        switch (status) {
            case 'running':
                return <span className="line-status line-status--running" />;
            case 'success':
                return <i className="bi bi-check-lg line-status line-status--success" />;
            case 'error':
                return <i className="bi bi-x-lg line-status line-status--error" />;
            case 'pending':
            default:
                return <span className="line-status line-status--pending" />;
        }
    };

    // Render line numbers with status
    const renderLineNumbers = () => {
        const lines = displayCode.split('\n');
        return (
            <div className="script-block__line-numbers">
                {lines.map((_, idx) => {
                    const lineState = lineStates[idx];
                    const isCurrentLine = idx === currentLineIndex;
                    return (
                        <div
                            key={idx}
                            className={`line-number ${isCurrentLine ? 'line-number--current' : ''}`}
                        >
                            {lineState && executionState !== 'idle' ? (
                                getLineStatusIcon(lineState.status)
                            ) : (
                                <span className="line-number__num">{idx + 1}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Get execution state label
    const getStateLabel = () => {
        switch (executionState) {
            case 'running':
                return 'Running...';
            case 'stepping':
                return 'Stepping...';
            case 'paused':
                return `Paused at line ${currentLineIndex + 1}`;
            case 'completed':
                return 'Completed';
            case 'error':
                return 'Error';
            default:
                return null;
        }
    };

    // Check if execution buttons should be disabled
    const canExecute = commands.length > 0 && (hasValidTarget || availableTargets.length === 0);

    return (
        <div className={`script-block ${className} ${!isExpanded ? 'script-block--collapsed' : ''}`}>
            {/* Header */}
            <div className="script-block__header">
                <div className="script-block__header-left">
                    <button
                        className="script-block__expand-btn"
                        onClick={() => setIsExpanded(!isExpanded)}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                    </button>
                    <span className="script-block__label">JjScript</span>
                    {lineCount > 1 && (
                        <span className="script-block__line-count">{lineCount} lines</span>
                    )}
                </div>

                <div className="script-block__header-right">
                    {/* Target selector */}
                    {availableTargets.length > 0 && (
                        <div className="script-block__target">
                            <span className="script-block__target-label">Target:</span>
                            {scriptTarget ? (
                                // Target defined in script - show as locked
                                <span
                                    className={`script-block__target-locked ${!hasValidTarget ? 'script-block__target-locked--error' : ''}`}
                                    title={hasValidTarget ? 'Defined in script' : targetError || 'Metamodel not found'}
                                >
                                    <i className={`bi ${hasValidTarget ? 'bi-lock' : 'bi-exclamation-triangle'}`} />
                                    {scriptTarget}
                                </span>
                            ) : (
                                // Dropdown for manual selection
                                <select
                                    className="script-block__target-select"
                                    value={localTargetId || selectedTargetId || ''}
                                    onChange={handleTargetChange}
                                >
                                    <option value="">Select metamodel...</option>
                                    {availableTargets.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* State indicator */}
                    {getStateLabel() && (
                        <span className={`script-block__state script-block__state--${executionState}`}>
                            {executionState === 'running' || executionState === 'stepping' ? (
                                <span className="script-block__spinner" />
                            ) : null}
                            {getStateLabel()}
                        </span>
                    )}

                    {/* Copy button */}
                    <button
                        className={`script-block__btn script-block__btn--icon ${copyStatus === 'copied' ? 'script-block__btn--copied' : ''}`}
                        onClick={handleCopy}
                        title={copyStatus === 'copied' ? 'Copied!' : 'Copy code'}
                    >
                        <i className={`bi ${copyStatus === 'copied' ? 'bi-check2' : 'bi-clipboard'}`} />
                    </button>

                    {/* Open in execution window */}
                    {onOpenExecutionWindow && (
                        <button
                            className="script-block__btn script-block__btn--icon"
                            onClick={handleOpenWindow}
                            disabled={!canExecute}
                            title="Open execution window"
                        >
                            <i className="bi bi-box-arrow-up-right" />
                        </button>
                    )}

                    {/* Execution controls */}
                    {allowExecution && onExecute && (
                        <>
                            {executionState === 'running' || executionState === 'stepping' ? (
                                <button
                                    className="script-block__btn script-block__btn--stop"
                                    onClick={handleStop}
                                    title="Stop"
                                >
                                    <i className="bi bi-stop-fill" />
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="script-block__btn script-block__btn--step"
                                        onClick={handleStep}
                                        title={executionState === 'paused' ? 'Next step' : 'Step through'}
                                        disabled={!canExecute}
                                    >
                                        <i className="bi bi-skip-forward" />
                                        <span>Step</span>
                                    </button>
                                    <button
                                        className="script-block__btn script-block__btn--run"
                                        onClick={handleExecute}
                                        title={!canExecute && targetError ? targetError : 'Execute all'}
                                        disabled={!canExecute}
                                    >
                                        <i className="bi bi-play-fill" />
                                        <span>Run</span>
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Code content */}
            {isExpanded && (
                <div className="script-block__content">
                    {renderLineNumbers()}
                    <div className="script-block__code">
                        <SyntaxHighlighter
                            language="bash"
                            style={scriptBlockTheme}
                            showLineNumbers={false}
                            wrapLines={true}
                            lineProps={(lineNumber) => {
                                const idx = lineNumber - 1;
                                const lineState = lineStates[idx];
                                const isCurrentLine = idx === currentLineIndex;
                                return {
                                    className: `code-line ${isCurrentLine ? 'code-line--current' : ''} ${lineState ? `code-line--${lineState.status}` : ''}`,
                                };
                            }}
                        >
                            {displayCode}
                        </SyntaxHighlighter>
                    </div>
                </div>
            )}

            {/* Error/Result message */}
            {executionState === 'error' && lineStates.some(ls => ls.status === 'error') && (
                <div className="script-block__error">
                    <i className="bi bi-exclamation-triangle" />
                    <span>
                        {lineStates.find(ls => ls.status === 'error')?.result?.message || 'Execution failed'}
                    </span>
                </div>
            )}

            {/* Success message */}
            {executionState === 'completed' && (
                <div className="script-block__success">
                    <i className="bi bi-check-circle" />
                    <span>All {commands.length} commands executed successfully</span>
                </div>
            )}

            {/* Execution Complete Modal */}
            {showCompleteModal && executionStats && (
                <div className="execution-complete-overlay" onClick={() => setShowCompleteModal(false)}>
                    <div className={`execution-complete-modal ${executionStats.errors > 0 ? 'has-error' : ''}`} onClick={e => e.stopPropagation()}>
                        <div className={`modal-icon ${executionStats.errors === 0 ? 'success' : 'error'}`}>
                            {executionStats.errors === 0 ? (
                                <i className="bi bi-check-circle-fill" />
                            ) : (
                                <i className="bi bi-exclamation-circle-fill" />
                            )}
                        </div>

                        <h2>{executionStats.errors === 0 ? 'Execution Complete' : 'Execution Failed'}</h2>

                        {/* Error details section */}
                        {executionStats.errors > 0 && executionErrorInfo && (
                            <div className="error-details">
                                <div className="error-row">
                                    <span className="error-label">Line:</span>
                                    <span className="error-value">{executionErrorInfo.lineNumber}</span>
                                </div>
                                <div className="error-row">
                                    <span className="error-label">Command:</span>
                                    <code className="error-command">{executionErrorInfo.command}</code>
                                </div>
                                <div className="error-row">
                                    <span className="error-label">Error:</span>
                                    <span className="error-message">{executionErrorInfo.error}</span>
                                </div>

                                {executionErrorInfo.wasRetried && (
                                    <>
                                        <div className="retry-info">
                                            <i className="bi bi-arrow-repeat" />
                                            Retry attempted after {RETRY_DELAY_MS}ms
                                        </div>
                                        {executionErrorInfo.retryError && executionErrorInfo.retryError !== executionErrorInfo.error && (
                                            <div className="error-row">
                                                <span className="error-label">Retry error:</span>
                                                <span className="error-message">{executionErrorInfo.retryError}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Error hint */}
                        {executionStats.errors > 0 && executionErrorInfo && (
                            <div className="error-hint">
                                <i className="bi bi-lightbulb" />
                                <span>
                                    {executionErrorInfo.wasRetried
                                        ? 'The parent element was not found even after waiting. Check that the parent exists and is spelled correctly.'
                                        : 'Check the command syntax and ensure all referenced elements exist.'}
                                </span>
                            </div>
                        )}

                        <div className="execution-stats">
                            <div className="stat">
                                <span className="stat-value">{executionStats.executedCommands}</span>
                                <span className="stat-label">commands executed</span>
                            </div>
                            {executionStats.skippedLines > 0 && (
                                <div className="stat">
                                    <span className="stat-value">{executionStats.skippedLines}</span>
                                    <span className="stat-label">lines skipped</span>
                                </div>
                            )}
                            {executionStats.errors > 0 && (
                                <div className="stat error">
                                    <span className="stat-value">{executionStats.errors}</span>
                                    <span className="stat-label">errors</span>
                                </div>
                            )}
                            {(executionStats.successfulRetries ?? 0) > 0 && (
                                <div className="stat retry">
                                    <span className="stat-value">{executionStats.successfulRetries}</span>
                                    <span className="stat-label">successful retries</span>
                                </div>
                            )}
                            <div className="stat">
                                <span className="stat-value">{(executionStats.duration / 1000).toFixed(2)}s</span>
                                <span className="stat-label">duration</span>
                            </div>
                        </div>

                        <button className="modal-close-btn" onClick={() => setShowCompleteModal(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScriptBlock;
