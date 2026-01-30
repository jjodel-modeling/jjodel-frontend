/**
 * ScriptBlock Component
 * Interactive JjScript code execution UI with Execute/Step functionality
 *
 * Design: "Understated Excellence" - subtle but precise, professional like VS Code/JetBrains
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { normalize, normalizeWithDetails, detectSyntaxType } from '../normalizer';
import './ScriptBlock.scss';

// ============================================
// TYPES
// ============================================

export interface ScriptBlockProps {
    /** The JjScript code (formal or natural syntax) */
    code: string;
    /** Callback when code is executed */
    onExecute?: (commands: string[]) => Promise<ScriptLineResult[]>;
    /** Whether to show the normalize toggle */
    showNormalizeToggle?: boolean;
    /** Initial expanded state */
    defaultExpanded?: boolean;
    /** Whether execution is allowed */
    allowExecution?: boolean;
    /** Custom class name */
    className?: string;
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

export const ScriptBlock: React.FC<ScriptBlockProps> = ({
    code,
    onExecute,
    showNormalizeToggle = true,
    defaultExpanded = true,
    allowExecution = true,
    className = '',
}) => {
    // State
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [showNormalized, setShowNormalized] = useState(false);
    const [executionState, setExecutionState] = useState<ExecutionState>('idle');
    const [lineStates, setLineStates] = useState<LineState[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    // Refs
    const stepResolveRef = useRef<(() => void) | null>(null);
    const abortRef = useRef(false);

    // Memoized values
    const syntaxType = useMemo(() => detectSyntaxType(code), [code]);
    const normalizedCode = useMemo(() => normalize(code), [code]);
    const displayCode = showNormalized ? normalizedCode : code;

    const commands = useMemo(() => {
        const source = showNormalized ? normalizedCode : code;
        return source
            .split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('//') && !l.startsWith('#'));
    }, [code, normalizedCode, showNormalized]);

    const lineCount = displayCode.split('\n').length;
    const hasNaturalSyntax = syntaxType === 'natural' || syntaxType === 'mixed';

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

    // Execute all commands (or continue from where stepping left off)
    const handleExecute = useCallback(async () => {
        if (!onExecute || commands.length === 0) return;

        abortRef.current = false;
        setExecutionState('running');

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
                const [result] = await onExecute([commands[i]]);
                results.push(result);

                setLineStates(prev =>
                    prev.map((ls, idx) =>
                        idx === i
                            ? { ...ls, status: result.success ? 'success' : 'error', result }
                            : ls
                    )
                );

                if (!result.success) {
                    setExecutionState('error');
                    return;
                }
            } catch (err) {
                setLineStates(prev =>
                    prev.map((ls, idx) =>
                        idx === i
                            ? {
                                  ...ls,
                                  status: 'error',
                                  result: {
                                      command: commands[i],
                                      success: false,
                                      message: err instanceof Error ? err.message : 'Unknown error',
                                  },
                              }
                            : ls
                    )
                );
                setExecutionState('error');
                return;
            }
        }

        setExecutionState('completed');
        setCurrentLineIndex(-1);
    }, [commands, onExecute, executionState, currentLineIndex]);

    // Step through commands one by one
    const handleStep = useCallback(async () => {
        if (!onExecute || commands.length === 0) return;

        // If starting fresh or resuming
        if (executionState === 'idle' || executionState === 'completed') {
            // Reset all states
            setLineStates(prev =>
                prev.map(ls => ({ ...ls, status: 'pending', result: undefined }))
            );
            setCurrentLineIndex(0);
            setExecutionState('stepping');
        }

        const nextIndex = executionState === 'paused' ? currentLineIndex : 0;

        if (nextIndex >= commands.length) {
            setExecutionState('completed');
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
            const [result] = await onExecute([commands[nextIndex]]);

            setLineStates(prev =>
                prev.map((ls, idx) =>
                    idx === nextIndex
                        ? { ...ls, status: result.success ? 'success' : 'error', result }
                        : ls
                )
            );

            if (result.success && nextIndex < commands.length - 1) {
                setCurrentLineIndex(nextIndex + 1);
                setExecutionState('paused');
            } else if (result.success) {
                setExecutionState('completed');
                setCurrentLineIndex(-1);
            } else {
                setExecutionState('error');
            }
        } catch (err) {
            setLineStates(prev =>
                prev.map((ls, idx) =>
                    idx === nextIndex
                        ? {
                              ...ls,
                              status: 'error',
                              result: {
                                  command: commands[nextIndex],
                                  success: false,
                                  message: err instanceof Error ? err.message : 'Unknown error',
                              },
                          }
                        : ls
                )
            );
            setExecutionState('error');
        }
    }, [commands, currentLineIndex, executionState, onExecute]);

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
                    {hasNaturalSyntax && showNormalizeToggle && (
                        <span className="script-block__syntax-badge">
                            {syntaxType === 'natural' ? 'Natural' : 'Mixed'}
                        </span>
                    )}
                    {lineCount > 1 && (
                        <span className="script-block__line-count">{lineCount} lines</span>
                    )}
                </div>

                <div className="script-block__header-right">
                    {/* State indicator */}
                    {getStateLabel() && (
                        <span className={`script-block__state script-block__state--${executionState}`}>
                            {executionState === 'running' || executionState === 'stepping' ? (
                                <span className="script-block__spinner" />
                            ) : null}
                            {getStateLabel()}
                        </span>
                    )}

                    {/* Normalize toggle */}
                    {hasNaturalSyntax && showNormalizeToggle && (
                        <button
                            className={`script-block__toggle ${showNormalized ? 'script-block__toggle--active' : ''}`}
                            onClick={() => setShowNormalized(!showNormalized)}
                            title={showNormalized ? 'Show original' : 'Show normalized'}
                        >
                            <i className="bi bi-arrow-repeat" />
                            <span>{showNormalized ? 'Original' : 'Normalized'}</span>
                        </button>
                    )}

                    {/* Copy button */}
                    <button
                        className={`script-block__btn script-block__btn--icon ${copyStatus === 'copied' ? 'script-block__btn--copied' : ''}`}
                        onClick={handleCopy}
                        title={copyStatus === 'copied' ? 'Copied!' : 'Copy code'}
                    >
                        <i className={`bi ${copyStatus === 'copied' ? 'bi-check2' : 'bi-clipboard'}`} />
                    </button>

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
                                        disabled={commands.length === 0}
                                    >
                                        <i className="bi bi-skip-forward" />
                                        <span>Step</span>
                                    </button>
                                    <button
                                        className="script-block__btn script-block__btn--run"
                                        onClick={handleExecute}
                                        title="Execute all"
                                        disabled={commands.length === 0}
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
        </div>
    );
};

export default ScriptBlock;
