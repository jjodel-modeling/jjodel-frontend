/**
 * ScriptExecutionWindow Component
 * Dedicated modal window for step-by-step script execution
 *
 * Features:
 * - Full code view with line status indicators
 * - Run/Step/Stop controls
 * - Output panel for execution results
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ScriptTarget, ScriptLineResult } from './ScriptBlock';
import './ScriptExecutionWindow.scss';

// ============================================
// RETRY CONFIGURATION
// ============================================

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 150;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if an error message indicates a retryable condition
 * (typically element/parent not found due to race conditions)
 */
function isRetryableError(error: string): boolean {
    const retryablePatterns = [
        /not found/i,
        /does not exist/i,
        /cannot find/i,
        /could not find/i,
        /unable to locate/i,
        /parent .* not found/i,
        /class .* not found/i,
        /element .* not found/i,
        /no such/i,
    ];

    return retryablePatterns.some(pattern => pattern.test(error));
}

// ============================================
// TYPES
// ============================================

export interface ScriptExecutionWindowProps {
    /** Whether the window is open */
    isOpen: boolean;
    /** Callback to close the window */
    onClose: () => void;
    /** The JjScript code to execute */
    script: string;
    /** The target metamodel */
    target: ScriptTarget;
    /** Execute callback */
    onExecute: (commands: string[], targetId?: string) => Promise<ScriptLineResult[]>;
}

type LineStatus = 'skip' | 'pending' | 'current' | 'running' | 'success' | 'error';

interface ParsedLine {
    index: number;
    text: string;
    isExecutable: boolean;
    status: LineStatus;
    result?: ScriptLineResult;
}

type ExecutionState = 'idle' | 'running' | 'stepping' | 'paused' | 'completed' | 'error';

// ============================================
// CUSTOM THEME (Light)
// ============================================

const executionWindowTheme = {
    ...oneLight,
    'pre[class*="language-"]': {
        ...oneLight['pre[class*="language-"]'],
        background: 'transparent',
        margin: 0,
        padding: 0,
        fontSize: '13px',
        lineHeight: '1.7',
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

export const ScriptExecutionWindow: React.FC<ScriptExecutionWindowProps> = ({
    isOpen,
    onClose,
    script,
    target,
    onExecute,
}) => {
    // State
    const [executionState, setExecutionState] = useState<ExecutionState>('idle');
    const [parsedLines, setParsedLines] = useState<ParsedLine[]>([]);
    const [currentExecutableIndex, setCurrentExecutableIndex] = useState(-1);
    const [outputMessages, setOutputMessages] = useState<string[]>([]);

    // Refs
    const abortRef = useRef(false);
    const codeContainerRef = useRef<HTMLDivElement>(null);

    // Parse script into lines
    useEffect(() => {
        if (!isOpen) return;

        const lines = script.split('\n');
        const parsed: ParsedLine[] = lines.map((text, index) => {
            const trimmed = text.trim();
            const isComment = trimmed.startsWith('//') || trimmed.startsWith('#');
            const isTargetCommand = trimmed.toLowerCase().startsWith('target ');
            const isEmpty = trimmed === '';
            const isExecutable = !isComment && !isTargetCommand && !isEmpty;

            return {
                index,
                text,
                isExecutable,
                status: isExecutable ? 'pending' : 'skip',
            };
        });

        setParsedLines(parsed);
        setCurrentExecutableIndex(-1);
        setExecutionState('idle');
        setOutputMessages([]);
        abortRef.current = false;
    }, [script, isOpen]);

    // Get executable lines
    const executableLines = useMemo(() => {
        return parsedLines.filter(l => l.isExecutable);
    }, [parsedLines]);

    // Scroll to current line
    const scrollToLine = useCallback((lineIndex: number) => {
        if (codeContainerRef.current) {
            const lineElement = codeContainerRef.current.querySelector(
                `[data-line-index="${lineIndex}"]`
            );
            if (lineElement) {
                lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, []);

    // Execute single command with retry mechanism
    const executeCommand = useCallback(async (line: ParsedLine): Promise<boolean> => {
        const command = line.text.trim();
        let lastError = '';
        let attempts = 0;

        while (attempts < MAX_RETRIES) {
            attempts++;

            try {
                const [result] = await onExecute([command], target.id);

                if (result.success) {
                    // Success - update line status
                    setParsedLines(prev =>
                        prev.map(l =>
                            l.index === line.index
                                ? { ...l, status: 'success', result }
                                : l
                        )
                    );

                    // Log success with retry info if needed
                    if (attempts > 1) {
                        setOutputMessages(prev => [
                            ...prev,
                            `✓ ${result.message || command} (succeeded on attempt ${attempts})`
                        ]);
                    } else {
                        setOutputMessages(prev => [...prev, `✓ ${result.message || command}`]);
                    }

                    return true;
                }

                // Command failed - check if retryable
                lastError = result.message || 'Unknown error';

                if (!isRetryableError(lastError)) {
                    // Non-retryable error - fail immediately
                    setParsedLines(prev =>
                        prev.map(l =>
                            l.index === line.index
                                ? { ...l, status: 'error', result }
                                : l
                        )
                    );
                    setOutputMessages(prev => [...prev, `✗ ${lastError}`]);
                    return false;
                }

                // Retryable error - wait and retry if we have attempts left
                if (attempts < MAX_RETRIES) {
                    console.log(`[JjScript] Attempt ${attempts}/${MAX_RETRIES} failed: ${lastError}, retrying in ${RETRY_DELAY_MS}ms...`);
                    await sleep(RETRY_DELAY_MS);
                }
            } catch (err) {
                lastError = err instanceof Error ? err.message : 'Unknown error';

                if (!isRetryableError(lastError)) {
                    // Non-retryable exception - fail immediately
                    setParsedLines(prev =>
                        prev.map(l =>
                            l.index === line.index
                                ? {
                                      ...l,
                                      status: 'error',
                                      result: { command, success: false, message: lastError },
                                  }
                                : l
                        )
                    );
                    setOutputMessages(prev => [...prev, `✗ ${lastError}`]);
                    return false;
                }

                // Retryable exception - wait and retry if we have attempts left
                if (attempts < MAX_RETRIES) {
                    console.log(`[JjScript] Attempt ${attempts}/${MAX_RETRIES} exception: ${lastError}, retrying in ${RETRY_DELAY_MS}ms...`);
                    await sleep(RETRY_DELAY_MS);
                }
            }
        }

        // All retries exhausted
        const totalWaitTime = (MAX_RETRIES - 1) * RETRY_DELAY_MS;
        console.error(`[JjScript] All ${MAX_RETRIES} attempts failed for: ${command}`);

        setParsedLines(prev =>
            prev.map(l =>
                l.index === line.index
                    ? {
                          ...l,
                          status: 'error',
                          result: {
                              command,
                              success: false,
                              message: lastError,
                              warnings: [`Retried ${MAX_RETRIES} times (waited ${totalWaitTime}ms total)`]
                          },
                      }
                    : l
            )
        );
        setOutputMessages(prev => [
            ...prev,
            `✗ ${lastError}`,
            `  ↳ Retried ${MAX_RETRIES} times (waited ${totalWaitTime}ms total)`
        ]);

        return false;
    }, [onExecute, target.id]);

    // Run all commands
    const handleRunAll = useCallback(async () => {
        if (executableLines.length === 0) return;

        abortRef.current = false;
        setExecutionState('running');
        setOutputMessages([`Executing on ${target.name}...`]);

        // Reset all executable lines to pending
        setParsedLines(prev =>
            prev.map(l => ({
                ...l,
                status: l.isExecutable ? 'pending' : 'skip',
                result: undefined,
            }))
        );

        for (let i = 0; i < executableLines.length; i++) {
            if (abortRef.current) {
                setOutputMessages(prev => [...prev, '⚠ Execution stopped']);
                break;
            }

            const line = executableLines[i];
            setCurrentExecutableIndex(i);
            scrollToLine(line.index);

            // Mark as running
            setParsedLines(prev =>
                prev.map(l =>
                    l.index === line.index ? { ...l, status: 'running' } : l
                )
            );

            const success = await executeCommand(line);

            if (!success) {
                setExecutionState('error');
                return;
            }
        }

        if (!abortRef.current) {
            setExecutionState('completed');
            setOutputMessages(prev => [...prev, `✓ All ${executableLines.length} commands executed successfully`]);
        }
        setCurrentExecutableIndex(-1);
    }, [executableLines, target.name, executeCommand, scrollToLine]);

    // Step through commands
    const handleStep = useCallback(async () => {
        if (executableLines.length === 0) return;

        // If starting fresh or completed, reset
        if (executionState === 'idle' || executionState === 'completed' || executionState === 'error') {
            setParsedLines(prev =>
                prev.map(l => ({
                    ...l,
                    status: l.isExecutable ? 'pending' : 'skip',
                    result: undefined,
                }))
            );
            setCurrentExecutableIndex(0);
            setOutputMessages([`Stepping through on ${target.name}...`]);
        }

        const nextIndex = executionState === 'paused'
            ? currentExecutableIndex
            : (executionState === 'stepping' ? currentExecutableIndex : 0);

        if (nextIndex >= executableLines.length) {
            setExecutionState('completed');
            setOutputMessages(prev => [...prev, `✓ All ${executableLines.length} commands executed successfully`]);
            return;
        }

        const line = executableLines[nextIndex];
        setExecutionState('stepping');
        setCurrentExecutableIndex(nextIndex);
        scrollToLine(line.index);

        // Mark as running
        setParsedLines(prev =>
            prev.map(l =>
                l.index === line.index ? { ...l, status: 'running' } : l
            )
        );

        const success = await executeCommand(line);

        if (success) {
            if (nextIndex < executableLines.length - 1) {
                setCurrentExecutableIndex(nextIndex + 1);
                setExecutionState('paused');
            } else {
                setExecutionState('completed');
                setOutputMessages(prev => [...prev, `✓ All ${executableLines.length} commands executed successfully`]);
                setCurrentExecutableIndex(-1);
            }
        } else {
            setExecutionState('error');
        }
    }, [executionState, executableLines, currentExecutableIndex, target.name, executeCommand, scrollToLine]);

    // Stop execution
    const handleStop = useCallback(() => {
        abortRef.current = true;
        setExecutionState('idle');
        setCurrentExecutableIndex(-1);
        setParsedLines(prev =>
            prev.map(l => ({
                ...l,
                status: l.isExecutable ? 'pending' : 'skip',
                result: undefined,
            }))
        );
        setOutputMessages(prev => [...prev, '⚠ Execution stopped']);
    }, []);

    // Handle close
    const handleClose = useCallback(() => {
        if (executionState === 'running' || executionState === 'stepping') {
            abortRef.current = true;
        }
        onClose();
    }, [executionState, onClose]);

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
            if (e.key === 'F5' || (e.metaKey && e.key === 'Enter')) {
                e.preventDefault();
                if (executionState !== 'running' && executionState !== 'stepping') {
                    handleRunAll();
                }
            }
            if (e.key === 'F10' || (e.metaKey && e.shiftKey && e.key === 'Enter')) {
                e.preventDefault();
                if (executionState !== 'running') {
                    handleStep();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, executionState, handleClose, handleRunAll, handleStep]);

    // Get status icon for a line
    const getLineStatusIcon = (status: LineStatus) => {
        switch (status) {
            case 'skip':
                return <span className="exec-line-status exec-line-status--skip">—</span>;
            case 'pending':
                return <span className="exec-line-status exec-line-status--pending" />;
            case 'current':
            case 'running':
                return <span className="exec-line-status exec-line-status--running" />;
            case 'success':
                return <i className="bi bi-check-lg exec-line-status exec-line-status--success" />;
            case 'error':
                return <i className="bi bi-x-lg exec-line-status exec-line-status--error" />;
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    const isRunning = executionState === 'running' || executionState === 'stepping';

    return (
        <div className="script-execution-overlay" onClick={handleClose}>
            <div className="script-execution-window" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="exec-window__header">
                    <div className="exec-window__header-left">
                        <i className="bi bi-terminal" />
                        <span className="exec-window__title">Script Execution</span>
                        <span className="exec-window__target">
                            <i className="bi bi-arrow-right" />
                            {target.name}
                        </span>
                    </div>
                    <div className="exec-window__header-right">
                        <span className={`exec-window__state exec-window__state--${executionState}`}>
                            {executionState === 'running' && 'Running...'}
                            {executionState === 'stepping' && 'Stepping...'}
                            {executionState === 'paused' && `Paused at line ${executableLines[currentExecutableIndex]?.index + 1 || '?'}`}
                            {executionState === 'completed' && 'Completed'}
                            {executionState === 'error' && 'Error'}
                            {executionState === 'idle' && 'Ready'}
                        </span>
                        <button className="exec-window__close-btn" onClick={handleClose} title="Close (Esc)">
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="exec-window__toolbar">
                    {isRunning ? (
                        <button className="exec-toolbar-btn exec-toolbar-btn--stop" onClick={handleStop}>
                            <i className="bi bi-stop-fill" />
                            Stop
                        </button>
                    ) : (
                        <>
                            <button
                                className="exec-toolbar-btn exec-toolbar-btn--step"
                                onClick={handleStep}
                                title="Step (F10)"
                            >
                                <i className="bi bi-skip-forward" />
                                Step
                            </button>
                            <button
                                className="exec-toolbar-btn exec-toolbar-btn--run"
                                onClick={handleRunAll}
                                title="Run All (F5)"
                            >
                                <i className="bi bi-play-fill" />
                                Run All
                            </button>
                        </>
                    )}
                    <div className="exec-toolbar-divider" />
                    <span className="exec-toolbar-info">
                        {executableLines.length} commands • {parsedLines.length} lines
                    </span>
                </div>

                {/* Main content area */}
                <div className="exec-window__content">
                    {/* Code area */}
                    <div className="exec-window__code-area" ref={codeContainerRef}>
                        <div className="exec-code__lines">
                            {parsedLines.map((line) => (
                                <div
                                    key={line.index}
                                    data-line-index={line.index}
                                    className={`exec-code__line exec-code__line--${line.status}`}
                                >
                                    <div className="exec-code__gutter">
                                        <span className="exec-code__line-num">{line.index + 1}</span>
                                        {getLineStatusIcon(line.status)}
                                    </div>
                                    <div className="exec-code__content">
                                        <SyntaxHighlighter
                                            language="bash"
                                            style={executionWindowTheme}
                                            PreTag="span"
                                            CodeTag="span"
                                        >
                                            {line.text || ' '}
                                        </SyntaxHighlighter>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Output panel */}
                    <div className="exec-window__output">
                        <div className="exec-output__header">
                            <i className="bi bi-terminal" />
                            Output
                        </div>
                        <div className="exec-output__content">
                            {outputMessages.length === 0 ? (
                                <span className="exec-output__empty">No output yet. Press Run All or Step to execute.</span>
                            ) : (
                                outputMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`exec-output__line ${
                                            msg.startsWith('✓') ? 'exec-output__line--success' :
                                            msg.startsWith('✗') ? 'exec-output__line--error' :
                                            msg.startsWith('⚠') ? 'exec-output__line--warning' : ''
                                        }`}
                                    >
                                        {msg}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Status bar */}
                <div className="exec-window__statusbar">
                    <span className="exec-statusbar__item">
                        <i className="bi bi-bullseye" />
                        Target: {target.name}
                    </span>
                    <span className="exec-statusbar__item">
                        <i className="bi bi-list-ol" />
                        {currentExecutableIndex >= 0 ? `${currentExecutableIndex + 1}/${executableLines.length}` : `0/${executableLines.length}`}
                    </span>
                    <div className="exec-statusbar__spacer" />
                    <span className="exec-statusbar__hint">
                        F5: Run All • F10: Step • Esc: Close
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ScriptExecutionWindow;
