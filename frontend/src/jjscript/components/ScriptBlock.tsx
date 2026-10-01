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
import { skippedLinesAsEditorLines } from './summaryLines';
import {parseError, errorFromResult, ExecutionPauseInfo, ExecutionSummary, JjScriptError, ExecutionErrorInfo} from '../executor/errors';
import type { ExecutionError } from '../types';
import { collectClassifierNames, validateScriptIntegrity } from '../executor/scriptValidator';
import { runPasses, isDeferrable } from '../executor/runPasses';
import { AIDisclaimer } from '../../components/common/AIDisclaimer';
import {TransformationAST} from "../../jjtl";
import {ExecutionContext} from "../../jjtl/executor";
import {
    findRecoveryActions,
    isCreateLiteralInTarget,
    type RecoveryAction,
} from '../recovery';
import { DUser, L, LPointerTargetable, LModel, LProject, LUser } from '../../joiner';

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
    /**
     * The executor's own structured errors, when the host passes them through. Present, the
     * dialog shows the handler's sentence and suggestion; absent, it falls back to parsing
     * `message` (see `errorFromResult`).
     */
    errors?: ExecutionError[];
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
    | { kind: 'syntax-error'; line: number; message: string }
    /** Refused before command 1 for a reason that is not a syntax problem. */
    | { kind: 'refused'; line: number; message: string };

export class ExecutionStats {
    totalCommands: number = 0;
    executedCommands: number = 0;
    skippedLines: number = 0;
    errors: number = 0;
    duration: number = 0;
}


/**
 * The classifier names already present in the project, for the forward-reference pass of
 * `validateScriptIntegrity`. Returns undefined when the project cannot be read: the pass
 * then stands down, which is the only safe reading of "we do not know what exists".
 *
 * Every metamodel is swept, not only the run's target, because an unbound reference also
 * resolves project-wide, so a name living in a sibling metamodel makes the reference
 * succeed and refusing the script would be a false positive.
 *
 * TODO: cleanup — no caller since R-JS-4: Run no longer refuses a forward reference, it
 * completes it on pass 2 (`runPasses`).
 */
function projectClassifierNames(): Set<string> | undefined {
    try {
        const user: LUser = L.fromPointer(DUser.current);
        const project = user?.project as LProject | undefined;
        const metamodels = (project as any)?.metamodels;
        if (Array.isArray(metamodels) && metamodels.length > 0) return collectClassifierNames(metamodels);
    } catch (err) {
        // A partial set would be worse than none: a name we failed to read looks absent,
        // and an absent name is what the pass refuses on.
        console.warn('[ScriptBlock] Forward-reference check stood down: reading the project classifier names threw, so a forward reference will not be refused before the run.', err);
        return undefined;
    }
    console.warn('[ScriptBlock] Forward-reference check stood down: no metamodel could be read from the project, so a forward reference will not be refused before the run.');
    return undefined;
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

    // Summary dialog state. Run never pauses (R-JS-5): the dialog opens once, on a finished run.
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [executionSummary, setExecutionSummary] = useState<ExecutionSummary | null>(null);

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

    /**
     * The warnings the run produced, one row per (line, warning), in EDITOR numbering.
     *
     * Derived from `lineStates` instead of accumulated in a state of its own: every branch that
     * finishes a command already stores its `result` there, so there is no writer to keep in
     * step and nothing to reset — the `useEffect` that rebuilds `lineStates` on a new script
     * clears these with it.
     */
    const warningLines = useMemo(
        () => lineStates.flatMap((ls, idx) =>
            (ls.result?.warnings ?? []).map(text => ({ line: getScriptLine(idx), text }))),
        [lineStates, getScriptLine]
    );

    /**
     * The summary the dialog renders, with the skipped lines translated to editor numbering
     * at the last moment. `ExecutionSummary.skippedLines` itself stays in command-index
     * space: every writer stores `i + 1` there and the run's control state reads it back
     * that way. Only this render-side copy is mapped, so the skipped rows finally agree
     * with the errors rows beside them, which were already in editor numbering.
     */
    const summaryForDialog = useMemo(() => {
        if (!executionSummary) return undefined;
        return {
            ...executionSummary,
            skippedLines: skippedLinesAsEditorLines(executionSummary.skippedLines, lineToCommandIndex),
        };
    }, [executionSummary, lineToCommandIndex]);

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
        // No name set (R-JS-4): a forward reference is not refused any more. Its line fails on
        // pass 1 and completes on pass 2 of `runPasses`, once the line that creates its target
        // has run.
        const integrity = validateScriptIntegrity(code);
        if (!integrity.valid && integrity.issue) {
            const { line, command, reason, kind } = integrity.issue;
            const isForwardReference = kind === 'forward-reference';
            setShowErrorDialog(false);
            setExecutionErrorInfo({
                // Here `line` is already the editor line: the validator reads the raw script,
                // not the command list. Stated as `scriptLine` too so the dialog does not have
                // to know that this one path numbers differently from the run loops.
                lineNumber: line,
                scriptLine: line,
                command,
                error: isForwardReference
                    ? `Script refused before command 1: ${reason} Nothing was executed.`
                    : `Script appears truncated or malformed at line ${line} (${reason}) — nothing was executed.`,
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
            setOutcome({ kind: isForwardReference ? 'refused' : 'syntax-error', line, message: reason });
            return;
        }

        // Emit execution start event for Tree View auto-expand. Once per Run, never per pass:
        // `handleRegistry.ts` clears the M1 instance handles on it.
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

        // Reset the summary dialog state
        setShowErrorDialog(false);
        setExecutionSummary(null);

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

        // One command, as the old loop ran it. Never throws: a thrown command becomes a failed
        // result without executor codes, which `runPasses` keeps final.
        const execOne = async (i: number): Promise<ScriptLineResult> => {
            const _iterStart = performance.now(); // TEMP-DISCOVERY

            setCurrentLineIndex(i);
            setLineStates(prev =>
                prev.map((ls, idx) =>
                    idx === i ? { ...ls, status: 'running' } : ls
                )
            );

            let result: ScriptLineResult;
            try {
                // Execute command directly (dependencies are handled by executor pre-check)
                const [first] = await onExecute([commands[i]], resolvedTarget?.id);
                result = first ?? { command: commands[i], success: false, message: 'No result' };
            } catch (err) {
                result = {
                    command: commands[i],
                    success: false,
                    message: err instanceof Error ? err.message : 'Unknown error',
                };
            }

            setLineStates(prev =>
                prev.map((ls, idx) =>
                    idx === i
                        ? { ...ls, status: result.success ? 'success' : 'error', result }
                        : ls
                )
            );

            // Add delay between commands for proper processing
            if (!abortRef.current) {
                await sleep(BATCH_DELAY_MS);
            }

            // TEMP-DISCOVERY: full per-command wall-clock (onExecute apply + async React re-render/settle absorbed during sleep + BATCH_DELAY_MS). settle ≈ iter − executor.total − BATCH_DELAY_MS.
            console.log(`[JjScript-TIMING] line=${i + 1} iter=${(performance.now() - _iterStart).toFixed(1)} cmd="${commands[i].slice(0, 60)}"`); // TEMP-DISCOVERY
            return result;
        };

        // R-JS-3: pass 1 runs every command and never pauses (R-JS-5); the commands that failed
        // on a name a later line creates run again, pass after pass.
        const indices = commands.map((_, i) => i).filter(i => i >= startIndex);
        const run = await runPasses(commands, execOne, isDeferrable, {
            indices,
            shouldStop: () => abortRef.current,
        });

        // Stop already reset the block and announced the end of the run.
        if (run.stopped) return;

        const duration = Math.max(0, Date.now() - startTimeRef.current);
        const failed = run.outcomes.filter(o => o.status === 'failed');
        const superseded = run.outcomes.filter(o => o.status === 'superseded');
        const executedCount = startIndex + run.outcomes.filter(o => o.status === 'success').length;

        // A superseded `set` never ran to a write: its line settles as skipped.
        if (superseded.length > 0) {
            const supersededIndices = new Set(superseded.map(o => o.index));
            setLineStates(prev =>
                prev.map((ls, idx) => supersededIndices.has(idx) ? { ...ls, status: 'skipped' } : ls)
            );
        }

        setExecutionStats({
            totalCommands: commands.length,
            executedCommands: executedCount,
            skippedLines: superseded.length,
            errors: failed.length,
            duration,
        });
        setExecutionState('completed');
        setCurrentLineIndex(-1);

        if (failed.length === 0) {
            setOutcome({ kind: 'success', count: executedCount });
        } else {
            const first = failed[0];
            const more = failed.length > 1 ? ` (+${failed.length - 1} more)` : '';
            setOutcome({
                kind: 'runtime-error',
                line: getScriptLine(first.index),
                message: errorFromResult(first.result, commands[first.index]).message + more,
            });
        }

        // Every final error at once, at the end (R-JS-5). A superseded line is listed apart,
        // in the skipped row: it is not an error.
        if (failed.length > 0 || superseded.length > 0) {
            setExecutionSummary({
                totalCommands: commands.length,
                executedCount,
                skippedCount: superseded.length,
                // Command-index space, 1-based, as every writer of this field stores it;
                // `summaryForDialog` maps it to editor lines.
                skippedLines: superseded.map(o => o.index + 1),
                errors: failed.map(o => ({
                    line: getScriptLine(o.index),
                    command: commands[o.index],
                    error: errorFromResult(o.result, commands[o.index]),
                })),
                duration,
                errorCount: failed.length,
            });
            setShowErrorDialog(true);
        }

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
                errorCount: failed.length,
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

            // Reset the summary dialog state
            setShowErrorDialog(false);
            setExecutionSummary(null);
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
                    scriptLine: getScriptLine(nextIndex),
                    command: commands[nextIndex],
                    error: errorFromResult(result, commands[nextIndex]),
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
                scriptLine: getScriptLine(nextIndex),
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

    // Close the summary dialog. Run never pauses (R-JS-5), so there is no paused state to
    // turn into a summary here any more: the dialog only ever shows a finished run.
    const handleCloseErrorDialog = useCallback(() => {
        setShowErrorDialog(false);
        setExecutionSummary(null);
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
            {(outcome?.kind === 'runtime-error' || outcome?.kind === 'syntax-error' || outcome?.kind === 'refused') && (
                <div className="script-block__error">
                    <i className="bi bi-exclamation-triangle" />
                    <span>
                        {outcome.kind === 'syntax-error'
                            ? `Syntax error at line ${outcome.line}: ${outcome.message}`
                            : outcome.kind === 'refused'
                                ? `Nothing was executed: ${outcome.message}`
                                : `Error at line ${outcome.line}: ${outcome.message}`}
                    </span>
                </div>
            )}

            {/* Warnings strip — non-blocking, one row per line that produced one. A warning is
                not an error: the command ran and its write happened, so this never pauses the
                run and never enters the error dialog. It exists because R-M2U-1 makes a
                near-homonym LEGAL on condition that the write announces it, and a warning that
                nothing renders is not an announcement. Numbered like every other line the user
                reads, in editor space. */}
            {warningLines.length > 0 && (
                <div className="script-block__warnings">
                    {warningLines.map((w, i) => (
                        <div className="script-block__warning" key={i}>
                            <i className="bi bi-exclamation-triangle" />
                            <span>Line {w.line}: {w.text}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary of a finished run with errors or superseded lines. Run never pauses
                (R-JS-5), so the dialog has no Skip and no paused state here. */}
            <ExecutionErrorDialog
                isOpen={showErrorDialog}
                onClose={handleCloseErrorDialog}
                summary={summaryForDialog}
            />

            {/* Completion modal removed — the terminal outcome is now the inline strip above.
                The Skip/recovery ExecutionErrorDialog remains the interactive error surface. */}
        </div>
    );
};

export default ScriptBlock;
