/**
 * ScriptBlock Component
 * Interactive JjScript code execution UI with Execute/Step functionality
 *
 * Design: "Understated Excellence" - subtle but precise, professional like VS Code/JetBrains
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { JjScriptEvents } from '../../events/registry';
import './ScriptBlock.scss';
import { ExecutionErrorDialog } from './ExecutionErrorDialog';
import {parseError, ExecutionPauseInfo, ExecutionSummary, JjScriptError, ExecutionErrorInfo} from '../executor/errors';
import { validateScriptIntegrity } from '../executor/scriptValidator';
import { AIDisclaimer } from '../../components/common/AIDisclaimer';
import {TransformationAST} from "../../jjtl";
import {ExecutionContext} from "../../jjtl/executor";
import {
    findRecoveryActions,
    isCreateLiteralInTarget,
    type RecoveryAction,
} from '../recovery';
import { LPointerTargetable, LModel } from '../../joiner';

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
    /** Optional close callback (shows X button in header - used for JjScript mode exit) */
    onClose?: () => void;
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

/**
 * Terminal outcome shown as a thin inline strip below the code content (replaces the
 * former completion modal). Persists as component state per-message: scrolling back
 * through the chat shows the last outcome. The Skip/recovery ExecutionErrorDialog is
 * unchanged and owns the interactive error flow; this strip is the passive summary.
 */
type ScriptOutcome =
    | { kind: 'success'; count: number }
    | { kind: 'runtime-error'; line: number; message: string }
    | { kind: 'syntax-error'; line: number; message: string };

export class ExecutionStats {
    totalCommands: number = 0;
    executedCommands: number = 0;
    skippedLines: number = 0;
    errors: number = 0;
    duration: number = 0;
}


// Utility function for delay between commands
const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Delay between commands in batch mode (ms) - for visual pacing
const BATCH_DELAY_MS = 20;

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
    onClose,
}) => {
    // State
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [executionState, setExecutionState] = useState<ExecutionState>('idle');
    const [lineStates, setLineStates] = useState<LineState[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [localTargetId, setLocalTargetId] = useState(selectedTargetId || '');

    // Terminal outcome for the inline result strip (idle -> running -> success | error).
    const [outcome, setOutcome] = useState<ScriptOutcome | null>(null);

    // Execution completion stats. The completion modal that read these was replaced by the
    // inline outcome strip; the fields are still populated because they are a plausible seam
    // for the upcoming snapshot/breakpoint prompts (execution summary + per-run stats).
    // TODO: cleanup — remove executionStats/executionErrorInfo if the later prompts don't consume them.
    const [executionStats, setExecutionStats] = useState<ExecutionStats | null>(null);
    const [executionErrorInfo, setExecutionErrorInfo] = useState<ExecutionErrorInfo | null>(null);

    // New error dialog state (for Skip functionality)
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [pauseInfo, setPauseInfo] = useState<ExecutionPauseInfo | null>(null);
    const [executionSummary, setExecutionSummary] = useState<ExecutionSummary | null>(null);
    const [skippedLinesSet, setSkippedLinesSet] = useState<Set<number>>(new Set());
    const [errorsList, setErrorsList] = useState<Array<{ line: number; command: string; error: JjScriptError }>>([]);
    // Contextual recovery actions proposed by the rule registry for the current pause.
    // Recomputed reactively from pauseInfo — rule matchers are pure.
    const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);

    // Refs
    const abortRef = useRef(false);
    const startTimeRef = useRef<number>(0);

    // DEBUG: Log execution stats when modal is shown
    // useEffect(() => {
        // if (showCompleteModal && executionStats) {
        //     // console.log('[ScriptBlock] Modal shown with stats:', {
        //         executedCommands: executionStats.executedCommands,
        //         duration: executionStats.duration,
        //         errors: executionStats.errors,
        //         totalCommands: executionStats.totalCommands,
        //         skippedLines: executionStats.skippedLines,
        //     });
        // }
    // }, [showCompleteModal, executionStats]);

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

    // Map each raw (0-based) script line to its index in `commands`, or null for non-executable
    // lines (blank, `//`/`#` comments, `target …`). Uses the exact predicate of the `commands`
    // filter above, so the two stay in lock-step. Drives the gutter markers and code-line
    // highlighting so ✓/✗ land on the right rows even when comments/blank lines are interleaved.
    const lineToCommandIndex = useMemo(() => {
        const map: (number | null)[] = [];
        let cmd = 0;
        for (const raw of displayCode.split('\n')) {
            const l = raw.trim();
            const isCommand = !!l && !l.startsWith('//') && !l.startsWith('#') && !l.toLowerCase().startsWith('target ');
            if (isCommand) { map.push(cmd); cmd++; }
            else map.push(null);
        }
        return map;
    }, [displayCode]);

    // Real 1-based script line for a command index (where its ✓/✗ marker is drawn). Falls back
    // to command-index+1 if the command is not found (defensive; should not happen).
    const getScriptLine = useCallback((commandIndex: number): number => {
        const idx = lineToCommandIndex.findIndex(x => x === commandIndex);
        return idx >= 0 ? idx + 1 : commandIndex + 1;
    }, [lineToCommandIndex]);

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
        setOutcome(null);
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

    // Execute all commands (or continue from where stepping left off)
    const handleExecute = useCallback(async () => {
        if (!onExecute || commands.length === 0) return;
        if (!hasValidTarget && availableTargets.length > 0) {
            console.warn('[ScriptBlock] No target selected');
            return;
        }

        // Integrity guard: refuse a truncated/malformed script before running ANY command.
        // Shares the executor's parser, so it never rejects a script that would execute
        // cleanly; it only fails fast (0 commands executed) instead of leaving a half-built
        // model, e.g. when AI-generated output was cut off mid-script. No events are emitted
        // and no execution state is entered — the run simply never starts.
        const integrity = validateScriptIntegrity(code);
        if (!integrity.valid && integrity.issue) {
            const { line, command, reason } = integrity.issue;
            setShowErrorDialog(false);
            setExecutionErrorInfo({
                lineNumber: line,
                command,
                error: `Script appears truncated or malformed at line ${line} (${reason}) — nothing was executed.`,
                executedSoFar: 0,
                totalCommands: commands.length,
                elapsedMs: 0,
            });
            setExecutionStats({
                totalCommands: commands.length,
                executedCommands: 0,
                skippedLines: 0,
                errors: 1,
                duration: 0,
            });
            setExecutionState('error');
            setOutcome({ kind: 'syntax-error', line, message: reason });
            return;
        }

        // Emit execution start event for Tree View auto-expand
        window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_START, {
            detail: {
                script: code,
                target: resolvedTarget?.name,
                commandCount: commands.length,
                mode: 'run-all',
            }
        }));

        abortRef.current = false;
        startTimeRef.current = Date.now();
        setExecutionState('running');
        setExecutionErrorInfo(null);
        setOutcome(null);

        // Reset new error dialog state
        setShowErrorDialog(false);
        setPauseInfo(null);
        setExecutionSummary(null);
        setSkippedLinesSet(new Set());
        setErrorsList([]);

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

            const _iterStart = performance.now(); // TEMP-DISCOVERY

            setCurrentLineIndex(i);
            setLineStates(prev =>
                prev.map((ls, idx) =>
                    idx === i ? { ...ls, status: 'running' } : ls
                )
            );

            try {
                // Execute command directly (dependencies are handled by executor pre-check)
                const [result] = await onExecute([commands[i]], resolvedTarget?.id);
                const success = result.success;

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
                    // Parse the error for better messaging
                    const parsedError = parseError(result.message || 'Unknown error', commands[i]);
                    const currentElapsed = Date.now() - startTimeRef.current;

                    const info = {
                        lineNumber: i + 1,
                        command: commands[i],
                        error: parsedError,
                        executedSoFar: executedCount,
                        totalCommands: commands.length,
                        elapsedMs: currentElapsed,
                    };
                    // Store detailed error info
                    setExecutionErrorInfo(info);
                    setPauseInfo(info);

                    // Store error in list for final summary
                    setErrorsList(prev => [...prev, { line: i + 1, command: commands[i], error: parsedError }]);

                    // Persistent inline outcome strip (the Skip/recovery dialog below is preserved
                    // and owns the interactive flow; this strip is the passive summary that remains
                    // after the dialog is dismissed).
                    setOutcome({ kind: 'runtime-error', line: getScriptLine(i), message: parsedError.message });

                    // Show error dialog with Skip option
                    setExecutionState('paused');
                    setShowErrorDialog(true);

                    // Emit execution paused event
                    window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_PAUSED, {
                        detail: {
                            line: i + 1,
                            command: commands[i],
                            error: result.message,
                        }
                    }));
                    return;
                }

                // Add delay between commands for proper processing
                if (i < commands.length - 1 && !abortRef.current) {
                    await sleep(BATCH_DELAY_MS);
                }

                // TEMP-DISCOVERY: full per-command wall-clock (onExecute apply + async React re-render/settle absorbed during sleep + BATCH_DELAY_MS). settle ≈ iter − executor.total − BATCH_DELAY_MS.
                console.log(`[JjScript-TIMING] line=${i + 1} iter=${(performance.now() - _iterStart).toFixed(1)} cmd="${commands[i].slice(0, 60)}"`); // TEMP-DISCOVERY
            } catch (err) {
                errorCount++;
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                const parsedError = parseError(errorMessage, commands[i]);

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

                // Set pause info for the error dialog
                const currentElapsed = Date.now() - startTimeRef.current;
                const info = {
                    lineNumber: i + 1,
                    command: commands[i],
                    error: errorMessage,
                    executedSoFar: executedCount,
                    totalCommands: commands.length,
                    elapsedMs: currentElapsed,
                };
                // Store detailed error info for the modal
                setExecutionErrorInfo(info);
                setPauseInfo(info);

                // Store error in list for final summary
                setErrorsList(prev => [...prev, { line: i + 1, command: commands[i], error: parsedError }]);

                // Persistent inline outcome strip (dialog preserved, see !success branch above).
                setOutcome({ kind: 'runtime-error', line: getScriptLine(i), message: parsedError.message });

                // Show error dialog with Skip option
                setExecutionState('paused');
                setShowErrorDialog(true);

                // Emit execution paused event
                window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_PAUSED, {
                    detail: {
                        line: i + 1,
                        command: commands[i],
                        error: errorMessage,
                    }
                }));
                return;
            }
        }

        // Execution completed successfully
        const duration = Date.now() - startTimeRef.current;
        const stats = {
            totalCommands: commands.length,
            executedCommands: executedCount,
            skippedLines: 0,
            errors: 0,
            duration: duration > 0 ? duration : 0,
        };
        // console.log('[ScriptBlock] Setting execution stats (handleExecute):', stats);
        setExecutionStats(stats);
        setExecutionState('completed');
        setCurrentLineIndex(-1);
        setOutcome({ kind: 'success', count: executedCount });

        // Dispatch event for auto-expand of Features panel
        if (executedCount > 0) {
            window.dispatchEvent(new CustomEvent(JjScriptEvents.METAMODEL_CREATED, {
                detail: { elementsCreated: executedCount }
            }));
        }

        // Emit execution end event
        window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
            detail: {
                status: 'completed',
                executedCount,
                totalCommands: commands.length,
            }
        }));
    }, [code, commands, onExecute, executionState, currentLineIndex, hasValidTarget, availableTargets.length, resolvedTarget, getScriptLine]);

    // Step through commands one by one
    const handleStep = useCallback(async () => {
        if (!onExecute || commands.length === 0) return;
        if (!hasValidTarget && availableTargets.length > 0) {
            console.warn('[ScriptBlock] No target selected');
            return;
        }

        // If starting fresh or resuming from completed
        if (executionState === 'idle' || executionState === 'completed') {
            // Emit execution start event for Tree View auto-expand
            window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_START, {
                detail: {
                    script: code,
                    target: resolvedTarget?.name,
                    commandCount: commands.length,
                    mode: 'step',
                }
            }));

            // Reset all states
            setLineStates(prev =>
                prev.map(ls => ({ ...ls, status: 'pending', result: undefined }))
            );
            setCurrentLineIndex(0);
            setExecutionState('stepping');
            startTimeRef.current = Date.now(); // Start timing
            setExecutionErrorInfo(null);
            setOutcome(null);

            // Reset new error dialog state
            setShowErrorDialog(false);
            setPauseInfo(null);
            setExecutionSummary(null);
            setSkippedLinesSet(new Set());
            setErrorsList([]);
        }

        const nextIndex = executionState === 'paused' ? currentLineIndex : 0;

        if (nextIndex >= commands.length) {
            // Show completion modal
            const duration = Date.now() - startTimeRef.current;
            const stats = {
                totalCommands: commands.length,
                executedCommands: commands.length,
                skippedLines: 0,
                errors: 0,
                duration: duration > 0 ? duration : 0,
            };
            // console.log('[ScriptBlock] Setting execution stats (handleStep start):', stats);
            setExecutionStats(stats);
            setExecutionState('completed');
            setOutcome({ kind: 'success', count: commands.length });
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
            // Execute command directly (dependencies are handled by executor pre-check)
            const [result] = await onExecute([commands[nextIndex]], resolvedTarget?.id);
            const success = result.success;

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

                // Dispatch event for each successful step (expands Features panel)
                window.dispatchEvent(new CustomEvent(JjScriptEvents.METAMODEL_CREATED, {
                    detail: { elementsCreated: 1 }
                }));
            } else if (success) {
                // Last step completed - show modal
                const duration = Date.now() - startTimeRef.current;
                const stats = {
                    totalCommands: commands.length,
                    executedCommands: nextIndex + 1,
                    skippedLines: 0,
                    errors: 0,
                    duration: duration > 0 ? duration : 0,
                };
                // console.log('[ScriptBlock] Setting execution stats (handleStep success):', stats);
                setExecutionStats(stats);
                setExecutionState('completed');
                setCurrentLineIndex(-1);
                setOutcome({ kind: 'success', count: nextIndex + 1 });

                // Dispatch event for last step
                window.dispatchEvent(new CustomEvent(JjScriptEvents.METAMODEL_CREATED, {
                    detail: { elementsCreated: 1 }
                }));

                // Emit execution end event
                window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
                    detail: {
                        status: 'completed',
                        executedCount: nextIndex + 1,
                        totalCommands: commands.length,
                    }
                }));
            } else {
                // Error - store detailed info and show modal
                const elapsedMs = Date.now() - startTimeRef.current;
                const info = {
                    lineNumber: nextIndex + 1,
                    command: commands[nextIndex],
                    error: result.message || 'Unknown error',
                    executedSoFar: nextIndex - 1,
                    totalCommands: commands.length,
                    elapsedMs,
                }
                setExecutionErrorInfo(info);
                const duration = Date.now() - startTimeRef.current;
                const stats = {
                    totalCommands: commands.length,
                    executedCommands: nextIndex,
                    skippedLines: 0,
                    errors: 1,
                    duration: duration > 0 ? duration : 0,
                };
                // console.log('[ScriptBlock] Setting execution stats (handleStep error):', stats);
                setExecutionStats(stats);
                setExecutionState('error');
                setOutcome({ kind: 'runtime-error', line: getScriptLine(nextIndex), message: result.message || 'Unknown error' });

                // Emit execution end event with error
                window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
                    detail: {
                        status: 'error',
                        executedCount: nextIndex,
                        totalCommands: commands.length,
                        error: result.message,
                    }
                }));
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
            const elapsedMs = Date.now() - startTimeRef.current;
            let info  = {
                command: commands[nextIndex],
                lineNumber: nextIndex + 1,
                error: errorMessage,
                executedSoFar: nextIndex - 1,
                totalCommands: commands.length,
                elapsedMs,
            }
            setExecutionErrorInfo(info);
            const stats = {
                totalCommands: commands.length,
                executedCommands: nextIndex,
                skippedLines: 0,
                errors: 1,
                duration: elapsedMs,
            };
            // console.log('[ScriptBlock] Setting execution stats (handleStep catch):', stats);
            setExecutionStats(stats);
            setExecutionState('error');
            setOutcome({ kind: 'runtime-error', line: getScriptLine(nextIndex), message: errorMessage });

            // Emit execution end event with error
            window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
                detail: {
                    status: 'error',
                    executedCount: nextIndex,
                    totalCommands: commands.length,
                    error: errorMessage,
                }
            }));
        }
    }, [code, commands, currentLineIndex, executionState, onExecute, hasValidTarget, availableTargets.length, resolvedTarget, getScriptLine]);

    // Stop execution
    const handleStop = useCallback(() => {
        abortRef.current = true;
        setExecutionState('idle');
        setCurrentLineIndex(-1);
        setOutcome(null);
        setLineStates(prev => prev.map(ls => ({ ...ls, status: 'pending', result: undefined })));

        // Emit execution end event (cancelled)
        window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
            detail: {
                status: 'cancelled',
            }
        }));
    }, []);

    // Skip current error and continue execution
    const handleSkipAndContinue = useCallback(async () => {
        if (!pauseInfo || !onExecute) return;

        // Once the interactive Skip/recovery flow takes over, its dialog summary is the
        // outcome UX — clear the passive strip so the two don't disagree.
        setOutcome(null);

        const skipLineIndex = pauseInfo.lineNumber - 1; // Convert to 0-based

        // Mark line as skipped
        setLineStates(prev =>
            prev.map((ls, idx) =>
                idx === skipLineIndex ? { ...ls, status: 'skipped' } : ls
            )
        );

        // Add to skipped set
        setSkippedLinesSet(prev => new Set([...prev, pauseInfo.lineNumber]));

        // Close error dialog
        setShowErrorDialog(false);
        setPauseInfo(null);

        // Continue execution from next line
        const nextIndex = skipLineIndex + 1;

        if (nextIndex >= commands.length) {
            // All done - show completion summary
            const duration = Date.now() - startTimeRef.current;
            const skippedLines = [...skippedLinesSet, pauseInfo.lineNumber];
            setExecutionSummary({
                totalCommands: commands.length,
                executedCount: lineStates.filter(ls => ls.status === 'success').length,
                skippedCount: skippedLines.length,
                skippedLines,
                errors: errorsList,
                duration,
                errorCount: errorsList.length,
            });
            setExecutionState('completed');
            setShowErrorDialog(true);
            return;
        }

        // Continue running from next line
        setExecutionState('running');
        setCurrentLineIndex(nextIndex);

        // Execute remaining commands
        let executedCount = lineStates.filter(ls => ls.status === 'success').length;
        let errorCount = errorsList.length;

        for (let i = nextIndex; i < commands.length; i++) {
            if (abortRef.current) break;

            setCurrentLineIndex(i);
            setLineStates(prev =>
                prev.map((ls, idx) =>
                    idx === i ? { ...ls, status: 'running' } : ls
                )
            );

            try {
                // Execute command directly (dependencies are handled by executor pre-check)
                const [result] = await onExecute([commands[i]], resolvedTarget?.id);
                const success = result.success;

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
                    const parsedError = parseError(result.message || 'Unknown error', commands[i]);
                    setErrorsList(prev => [...prev, { line: i + 1, command: commands[i], error: parsedError }]);

                    // Set pause info for the error dialog
                    const currentElapsed = Date.now() - startTimeRef.current;
                    setPauseInfo({
                        lineNumber: i + 1,
                        command: commands[i],
                        error: parsedError,
                        executedSoFar: executedCount,
                        totalCommands: commands.length,
                        elapsedMs: currentElapsed,
                    });

                    setExecutionState('paused');
                    setShowErrorDialog(true);
                    return;
                }

                // Add delay between commands
                if (i < commands.length - 1 && !abortRef.current) {
                    await sleep(BATCH_DELAY_MS);
                }
            } catch (err) {
                errorCount++;
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                const parsedError = parseError(errorMessage, commands[i]);
                setErrorsList(prev => [...prev, { line: i + 1, command: commands[i], error: parsedError }]);

                setLineStates(prev =>
                    prev.map((ls, idx) =>
                        idx === i
                            ? { ...ls, status: 'error', result: { command: commands[i], success: false, message: errorMessage } }
                            : ls
                    )
                );

                const currentElapsed = Date.now() - startTimeRef.current;
                setPauseInfo({
                    lineNumber: i + 1,
                    command: commands[i],
                    error: parsedError,
                    executedSoFar: executedCount,
                    totalCommands: commands.length,
                    elapsedMs: currentElapsed,
                });

                setExecutionState('paused');
                setShowErrorDialog(true);
                return;
            }
        }

        // Completed after skipping
        const duration = Date.now() - startTimeRef.current;
        const allSkippedLines = [...skippedLinesSet, pauseInfo.lineNumber];
        setExecutionSummary({
            totalCommands: commands.length,
            executedCount,
            skippedCount: allSkippedLines.length,
            skippedLines: allSkippedLines,
            errors: errorsList,
            duration,
            errorCount: errorsList.length,
        });
        setExecutionState('completed');
        setShowErrorDialog(true);

        // Emit execution end event
        window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
            detail: {
                status: 'completed',
                executedCount,
                totalCommands: commands.length,
                skippedCount: allSkippedLines.length,
            }
        }));
    }, [pauseInfo, onExecute, commands, lineStates, skippedLinesSet, errorsList, resolvedTarget]);

    // ============================================
    // RECOVERY ACTIONS — contextual one-click fixes
    // ============================================
    // Recompute the proposed actions whenever the pause state changes. Rule matchers
    // are pure, so this is safe to call on every pauseInfo transition.
    useEffect(() => {
        if (!pauseInfo) {
            setRecoveryActions([]);
            return;
        }
        const errAny = pauseInfo.error as any;
        const errorMessage: string = (errAny && typeof errAny === 'object' && typeof errAny.message === 'string')
            ? errAny.message
            : (typeof errAny === 'string' ? errAny : '');
        const metamodel = resolvedTarget?.id
            ? (LPointerTargetable.fromPointer(resolvedTarget.id) as LModel | null)
            : null;
        const actions = findRecoveryActions({
            command: pauseInfo.command,
            lineNumber: pauseInfo.lineNumber,
            allCommands: commands,
            errorMessage,
            metamodel,
        });
        setRecoveryActions(actions);
    }, [pauseInfo, commands, resolvedTarget]);

    /**
     * Resume execution from a given 0-based index, optionally honouring a skip set.
     * Duplicates the loop used by handleSkipAndContinue (intentionally: we're asked
     * not to refactor that handler). Used by recovery dispatchers below.
     */
    const runCommandsFromIndex = useCallback(async (startIdx: number, skipSet: Set<number>) => {
        if (!onExecute) return;
        setExecutionState('running');
        setOutcome(null);
        let executedCount = lineStates.filter(ls => ls.status === 'success').length;
        const localErrors = [...errorsList];

        for (let i = startIdx; i < commands.length; i++) {
            if (abortRef.current) break;
            if (skipSet.has(i + 1)) continue;

            setCurrentLineIndex(i);
            setLineStates(prev =>
                prev.map((ls, idx) => idx === i ? { ...ls, status: 'running' } : ls)
            );

            try {
                const [result] = await onExecute([commands[i]], resolvedTarget?.id);
                const success = result.success;
                setLineStates(prev =>
                    prev.map((ls, idx) => idx === i
                        ? { ...ls, status: success ? 'success' : 'error', result }
                        : ls
                    )
                );

                if (success) {
                    executedCount++;
                } else {
                    const parsedError = parseError(result.message || 'Unknown error', commands[i]);
                    localErrors.push({ line: i + 1, command: commands[i], error: parsedError });
                    setErrorsList(localErrors);
                    const currentElapsed = Date.now() - startTimeRef.current;
                    setPauseInfo({
                        lineNumber: i + 1,
                        command: commands[i],
                        error: parsedError,
                        executedSoFar: executedCount,
                        totalCommands: commands.length,
                        elapsedMs: currentElapsed,
                    });
                    setExecutionState('paused');
                    setShowErrorDialog(true);
                    return;
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                const parsedError = parseError(errorMessage, commands[i]);
                localErrors.push({ line: i + 1, command: commands[i], error: parsedError });
                setErrorsList(localErrors);
                setLineStates(prev =>
                    prev.map((ls, idx) => idx === i
                        ? { ...ls, status: 'error', result: { command: commands[i], success: false, message: errorMessage } }
                        : ls
                    )
                );
                const currentElapsed = Date.now() - startTimeRef.current;
                setPauseInfo({
                    lineNumber: i + 1,
                    command: commands[i],
                    error: parsedError,
                    executedSoFar: executedCount,
                    totalCommands: commands.length,
                    elapsedMs: currentElapsed,
                });
                setExecutionState('paused');
                setShowErrorDialog(true);
                return;
            }
        }

        // Completed — show summary
        const duration = Date.now() - startTimeRef.current;
        const allSkippedLines = Array.from(skipSet).sort((a, b) => a - b);
        setExecutionSummary({
            totalCommands: commands.length,
            executedCount,
            skippedCount: allSkippedLines.length,
            skippedLines: allSkippedLines,
            errors: localErrors,
            duration,
            errorCount: localErrors.length,
        });
        setExecutionState('completed');
        setShowErrorDialog(true);
    }, [commands, lineStates, onExecute, resolvedTarget, errorsList]);

    /**
     * Dispatcher for recovery-action clicks. Handlers live here (not in the rule
     * registry) because they need to manipulate component-local state (lineStates,
     * pauseInfo, skippedLinesSet) and call onExecute. Rules stay data-only.
     */
    const handleRecoveryAction = useCallback(async (action: RecoveryAction) => {
        if (!pauseInfo || !onExecute) return;

        switch (action.kind) {
            case 'createEnumAndRetry': {
                const enumName = action.enumName;
                const retryIndex = pauseInfo.lineNumber - 1;

                // Close the modal + clear pause state before running any commands.
                setShowErrorDialog(false);
                setPauseInfo(null);
                setExecutionErrorInfo(null);

                // Side-effect: create the enum. This path reuses the same executor that
                // handles a normal `create enum Y` line, so validation/duplication checks
                // are consistent with scripted creation.
                const [createResult] = await onExecute([`create enum ${enumName}`], resolvedTarget?.id);
                if (!createResult?.success) {
                    // Surface the enum-creation failure as a fresh pause so the user can
                    // see what went wrong (e.g. name collision with an existing class).
                    const parsedError = parseError(
                        createResult?.message || 'Enum creation failed',
                        `create enum ${enumName}`
                    );
                    const currentElapsed = Date.now() - startTimeRef.current;
                    setPauseInfo({
                        lineNumber: pauseInfo.lineNumber,
                        command: `create enum ${enumName}`,
                        error: parsedError,
                        executedSoFar: lineStates.filter(ls => ls.status === 'success').length,
                        totalCommands: commands.length,
                        elapsedMs: currentElapsed,
                    });
                    setExecutionState('paused');
                    setShowErrorDialog(true);
                    return;
                }

                // Log the auto-recovery step so the execution log reflects what happened.
                // We reuse JjScriptEvents.EXECUTED with a marker tag so downstream console
                // listeners can render it distinctly if they choose.
                window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTED, {
                    detail: {
                        recovery: true,
                        command: `create enum ${enumName}`,
                        success: true,
                        note: `Auto-created via recovery rule "literal-in-attribute" before retrying line ${pauseInfo.lineNumber}`,
                    },
                }));
                // Also a visible console line — useful in dev, harmless in prod.
                // eslint-disable-next-line no-console
                console.log(`[jjscript recovery] auto-created enum "${enumName}", retrying line ${pauseInfo.lineNumber}`);

                // Reset the failed line to "running" state before retrying.
                setLineStates(prev =>
                    prev.map((ls, idx) => idx === retryIndex ? { ...ls, status: 'running' } : ls)
                );

                // Retry FROM the failed line (inclusive), not the next one.
                await runCommandsFromIndex(retryIndex, skippedLinesSet);
                return;
            }

            case 'skipMatchingCreateLiteral': {
                const targetName = action.targetName;

                // Collect every remaining line that matches `create literal ... in <targetName>`
                // starting from the currently-failed line. These become the new skip set.
                const newSkippedLines = new Set(skippedLinesSet);
                for (let i = pauseInfo.lineNumber - 1; i < commands.length; i++) {
                    if (isCreateLiteralInTarget(commands[i], targetName)) {
                        newSkippedLines.add(i + 1);
                    }
                }
                setSkippedLinesSet(newSkippedLines);
                setLineStates(prev =>
                    prev.map((ls, idx) => newSkippedLines.has(idx + 1) ? { ...ls, status: 'skipped' } : ls)
                );

                // Close modal + clear pause.
                setShowErrorDialog(false);
                setPauseInfo(null);
                setExecutionErrorInfo(null);

                // Resume from the first non-skipped line at or after the failed line.
                let resumeIdx = pauseInfo.lineNumber - 1;
                while (resumeIdx < commands.length && newSkippedLines.has(resumeIdx + 1)) {
                    resumeIdx++;
                }

                // If everything from here is skipped, jump straight to summary.
                if (resumeIdx >= commands.length) {
                    const duration = Date.now() - startTimeRef.current;
                    const executedCount = lineStates.filter(ls => ls.status === 'success').length;
                    setExecutionSummary({
                        totalCommands: commands.length,
                        executedCount,
                        skippedCount: newSkippedLines.size,
                        skippedLines: Array.from(newSkippedLines).sort((a, b) => a - b),
                        errors: errorsList,
                        duration,
                        errorCount: errorsList.length,
                    });
                    setExecutionState('completed');
                    setShowErrorDialog(true);
                    return;
                }

                await runCommandsFromIndex(resumeIdx, newSkippedLines);
                return;
            }

            default: {
                // Exhaustiveness guard: TypeScript will flag missing cases at compile time.
                const _exhaustive: never = action;
                void _exhaustive;
            }
        }
    }, [pauseInfo, commands, lineStates, onExecute, resolvedTarget, skippedLinesSet, errorsList, runCommandsFromIndex]);

    // Close error dialog (stop execution and show summary)
    const handleCloseErrorDialog = useCallback(() => {
        if (executionSummary) {
            // Was showing summary - close completely
            setShowErrorDialog(false);
            setExecutionSummary(null);
            setErrorsList([]);
            setSkippedLinesSet(new Set());
            return;
        }

        if (pauseInfo) {
            // Was paused on error - show final summary
            const duration = Date.now() - startTimeRef.current;
            const allSkippedLines = [...skippedLinesSet];
            const executedCount = lineStates.filter(ls => ls.status === 'success').length;

            setExecutionSummary({
                totalCommands: commands.length,
                executedCount,
                skippedCount: allSkippedLines.length,
                skippedLines: allSkippedLines,
                errors: errorsList,
                duration,
                errorCount: errorsList.length,
            });
            setPauseInfo(null);
            setExecutionState('error');

            // Emit execution end event
            window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
                detail: {
                    status: 'stopped',
                    executedCount,
                    totalCommands: commands.length,
                }
            }));
        } else {
            setShowErrorDialog(false);
        }
    }, [executionSummary, pauseInfo, skippedLinesSet, lineStates, commands.length, errorsList]);

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
                    // Non-command rows (blank, comment, `target …`) map to null → always show the
                    // plain line number, never a ✓/✗ marker.
                    const cmdIdx = lineToCommandIndex[idx];
                    const lineState = cmdIdx !== null ? lineStates[cmdIdx] : undefined;
                    const isCurrentLine = cmdIdx !== null && cmdIdx === currentLineIndex;
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
                                <>
                                    {/* Run stays in place, disabled, with a spinner replacing the
                                        play icon — no header layout shift. Stop preserves abort. */}
                                    <button
                                        className="script-block__btn script-block__btn--run"
                                        disabled
                                        title="Running…"
                                    >
                                        <span className="script-block__spinner" />
                                        <span>Run</span>
                                    </button>
                                    <button
                                        className="script-block__btn script-block__btn--stop"
                                        onClick={handleStop}
                                        title="Stop"
                                    >
                                        <i className="bi bi-stop-fill" />
                                    </button>
                                </>
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

                    {/* Close button (for JjScript mode exit) */}
                    {onClose && (
                        <button
                            className="script-block__btn script-block__btn--close"
                            onClick={onClose}
                            title="Exit JjScript mode"
                        >
                            <i className="bi bi-x-lg" />
                        </button>
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
                                const cmdIdx = lineToCommandIndex[lineNumber - 1];
                                const lineState = cmdIdx !== null ? lineStates[cmdIdx] : undefined;
                                const isCurrentLine = cmdIdx !== null && cmdIdx === currentLineIndex;
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

            {/* Outcome strip — thin inline result below the code content (replaces the former
                completion modal). Persists per-message; the Skip/recovery dialog below owns the
                interactive error flow. */}
            {outcome?.kind === 'success' && (
                <div className="script-block__success script-block__success--strip">
                    <i className="bi bi-check-circle" />
                    <span>{outcome.count} commands applied</span>
                </div>
            )}
            {(outcome?.kind === 'runtime-error' || outcome?.kind === 'syntax-error') && (
                <div className="script-block__error">
                    <i className="bi bi-exclamation-triangle" />
                    <span>
                        {outcome.kind === 'syntax-error'
                            ? `Syntax error at line ${outcome.line}: ${outcome.message}`
                            : `Error at line ${outcome.line}: ${outcome.message}`}
                    </span>
                </div>
            )}

            {/* New Error Dialog with Skip functionality + contextual recovery actions */}
            <ExecutionErrorDialog
                isOpen={showErrorDialog}
                onClose={handleCloseErrorDialog}
                pauseInfo={pauseInfo || undefined}
                summary={executionSummary || undefined}
                onSkip={(pauseInfo?.error as JjScriptError)?.skippable ? handleSkipAndContinue : undefined}
                recoveryActions={recoveryActions}
                onRecoveryAction={handleRecoveryAction}
            />

            {/* Completion modal removed — the terminal outcome is now the inline strip above.
                The Skip/recovery ExecutionErrorDialog remains the interactive error surface. */}
        </div>
    );
};

export default ScriptBlock;
