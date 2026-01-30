/**
 * JjScript Console Component
 * A complete console for executing JjScript commands
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { JjScriptInput } from './JjScriptInput';
import { JjScriptOutput } from './JjScriptOutput';
import { executeCommand, ExecutionResult } from '../index';
import './JjScriptConsole.scss';

interface ConsoleEntry {
    id: string;
    command: string;
    result: ExecutionResult;
    timestamp: number;
}

interface JjScriptConsoleProps {
    projectId?: string;
    modelId?: string;
    onCommandExecuted?: (command: string, result: ExecutionResult) => void;
    className?: string;
}

export const JjScriptConsole: React.FC<JjScriptConsoleProps> = ({
    projectId,
    modelId,
    onCommandExecuted,
    className = ''
}) => {
    const [entries, setEntries] = useState<ConsoleEntry[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);
    const history = entries.map(e => e.command);

    // Auto-scroll to bottom when new entries added
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [entries]);

    // Execute command
    const handleExecute = useCallback(async (command: string) => {
        if (!command.trim()) return;

        setIsExecuting(true);

        try {
            const result = await executeCommand(command, projectId, modelId);

            // Handle clear command specially
            if (result.data?.action === 'clear_console') {
                setEntries([]);
            } else {
                const entry: ConsoleEntry = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    command,
                    result,
                    timestamp: Date.now()
                };

                setEntries(prev => [...prev, entry]);
            }

            onCommandExecuted?.(command, result);
        } catch (error) {
            const result: ExecutionResult = {
                success: false,
                command: 'help',
                message: `Unexpected error: ${(error as Error).message}`,
                errors: [{ code: 'UNEXPECTED_ERROR', message: (error as Error).message }]
            };

            const entry: ConsoleEntry = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                command,
                result,
                timestamp: Date.now()
            };

            setEntries(prev => [...prev, entry]);
        } finally {
            setIsExecuting(false);
        }
    }, [projectId, modelId, onCommandExecuted]);

    // Clear console
    const handleClear = useCallback(() => {
        setEntries([]);
    }, []);

    return (
        <div className={`jjscript-console ${className}`}>
            {/* Header */}
            <div className="jjscript-console-header">
                <div className="console-title">
                    <i className="bi bi-terminal" />
                    <span>JjScript Console</span>
                </div>
                <div className="console-actions">
                    <button
                        className="console-action"
                        onClick={handleClear}
                        title="Clear console"
                    >
                        <i className="bi bi-trash" />
                    </button>
                    <button
                        className="console-action"
                        onClick={() => handleExecute('help')}
                        title="Show help"
                    >
                        <i className="bi bi-question-circle" />
                    </button>
                </div>
            </div>

            {/* Output area */}
            <div className="jjscript-console-output" ref={outputRef}>
                {entries.length === 0 ? (
                    <div className="console-empty">
                        <p>Welcome to JjScript Console</p>
                        <p className="hint">Type a command or 'help' to get started</p>
                    </div>
                ) : (
                    entries.map(entry => (
                        <JjScriptOutput
                            key={entry.id}
                            result={entry.result}
                            command={entry.command}
                        />
                    ))
                )}
            </div>

            {/* Input area */}
            <div className="jjscript-console-input">
                <JjScriptInput
                    onExecute={handleExecute}
                    disabled={isExecuting}
                    history={history}
                    placeholder={isExecuting ? 'Executing...' : 'Enter JjScript command...'}
                />
            </div>
        </div>
    );
};

export default JjScriptConsole;
