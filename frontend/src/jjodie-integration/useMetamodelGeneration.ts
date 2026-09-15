/**
 * useMetamodelGeneration Hook
 * Manages the complete flow for generating metamodels via Jjodie
 */

import { useState, useCallback, useRef } from 'react';
import { JjScriptEvents } from '../events/registry';

// ============================================
// TYPES
// ============================================

export type GenerationPhase =
    | 'idle'
    | 'checking-state'
    | 'no-project'
    | 'no-metamodel'
    | 'select-metamodel'
    | 'confirm-non-empty'
    | 'ready-to-execute'
    | 'executing'
    | 'paused'
    | 'completed'
    | 'cancelled'
    | 'error';

export interface GenerationState {
    phase: GenerationPhase;
    suggestedProjectName?: string;
    suggestedMetamodelName?: string;
    script?: string;
    // All lines from the script (for display)
    allLines?: string[];
    // Only executable commands (filtered)
    commands?: string[];
    // Maps command index to original line number (1-based)
    commandToLineMap?: number[];
    // Set of line indices (0-based) that are executable
    executableIndices?: Set<number>;
    currentCommandIndex: number;
    executedCommands: string[];
    // Set of executed line numbers (1-based)
    executedLineNumbers: Set<number>;
    selectedProjectId?: string;
    selectedMetamodelId?: string;
    snapshotId?: string;
    error?: string;
    availableMetamodels?: Array<{ id: string; name: string }>;
}

export interface GenerationRequest {
    script: string;
    projectName?: string;
    metamodelName?: string;
}

export interface JjodieAPI {
    getOpenProject(): Promise<{ id: string; name: string } | null>;
    getOpenMetamodels(): Promise<Array<{ id: string; name: string; elementCount: number }>>;
    createProject(name: string): Promise<{ id: string }>;
    createMetamodel(projectId: string, name: string): Promise<{ id: string }>;
    openMetamodel(id: string): Promise<void>;
    saveSnapshot(): Promise<string>;
    restoreSnapshot(id: string): Promise<void>;
    discardSnapshot(id: string): Promise<void>;
    executeCommand(command: string): Promise<{ success: boolean; message: string }>;
}

export interface UseMetamodelGenerationOptions {
    api: JjodieAPI;
    onPhaseChange?: (phase: GenerationPhase) => void;
    onComplete?: () => void;
    onError?: (error: string) => void;
}

export interface UseMetamodelGenerationReturn {
    state: GenerationState;
    startGeneration: (request: GenerationRequest) => Promise<void>;
    confirmCreateProject: (confirm: boolean) => Promise<void>;
    confirmCreateMetamodel: (confirm: boolean) => Promise<void>;
    selectMetamodel: (id: string) => Promise<void>;
    confirmNonEmpty: (confirm: boolean) => Promise<void>;
    executeAll: () => Promise<void>;
    executeStep: () => Promise<void>;
    stop: () => Promise<void>;
    reset: () => void;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

const initialState: GenerationState = {
    phase: 'idle',
    currentCommandIndex: -1,
    executedCommands: [],
    executedLineNumbers: new Set<number>(),
};

export function useMetamodelGeneration(
    options: UseMetamodelGenerationOptions
): UseMetamodelGenerationReturn {
    const { api, onPhaseChange, onComplete, onError } = options;

    const [state, setState] = useState<GenerationState>(initialState);
    const pauseRef = useRef(false);

    const setPhase = useCallback((phase: GenerationPhase) => {
        // console.log('[Generation] setPhase:', phase);
        setState(prev => ({ ...prev, phase }));
        onPhaseChange?.(phase);
    }, [onPhaseChange]);

    // Parse script into commands and maintain line mapping
    const parseScript = (script: string): {
        allLines: string[],
        commands: string[],
        commandToLineMap: number[],
        executableIndices: Set<number>
    } => {
        const allLines = script.split('\n');
        const commands: string[] = [];
        const commandToLineMap: number[] = [];
        const executableIndices = new Set<number>();

        allLines.forEach((line, index) => {
            const trimmed = line.trim();
            // Only include non-empty, non-comment lines as executable commands
            if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#')) {
                commands.push(trimmed);
                commandToLineMap.push(index + 1); // 1-based line numbers
                executableIndices.add(index); // 0-based index
            }
        });

        return { allLines, commands, commandToLineMap, executableIndices };
    };

    // Prepare execution (save snapshot)
    const prepareExecution = useCallback(async () => {
        try {
            const snapshotId = await api.saveSnapshot();
            setState(prev => ({ ...prev, snapshotId }));
            setPhase('ready-to-execute');
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to save snapshot';
            setState(prev => ({ ...prev, error: msg }));
            setPhase('error');
            onError?.(msg);
        }
    }, [api, setPhase, onError]);

    // Start generation flow
    const startGeneration = useCallback(async (request: GenerationRequest) => {
        // console.log('[Generation] startGeneration called');
        // console.log('[Generation] Script preview:', request.script?.substring(0, 100));

        const parsed = parseScript(request.script);

        setState({
            ...initialState,
            phase: 'checking-state',
            script: request.script,
            allLines: parsed.allLines,
            commands: parsed.commands,
            commandToLineMap: parsed.commandToLineMap,
            executableIndices: parsed.executableIndices,
            suggestedProjectName: request.projectName,
            suggestedMetamodelName: request.metamodelName,
        });

        // console.log('[Generation] State set to checking-state');

        try {
            // console.log('[Generation] Calling api.getOpenProject()...');
            const project = await api.getOpenProject();
            // console.log('[Generation] Project result:', project);

            if (!project) {
                // No project - show info message, don't ask to create
                // console.log('[Generation] No project - showing info message');
                setState(prev => ({
                    ...prev,
                    phase: 'no-project',
                    error: 'Open a project to run this script'
                }));
                return;
            }

            setState(prev => ({ ...prev, selectedProjectId: project.id }));

            const metamodels = await api.getOpenMetamodels();

            if (metamodels.length === 0) {
                // No metamodel - show info message, don't ask to create
                // console.log('[Generation] No metamodel - showing info message');
                setState(prev => ({
                    ...prev,
                    phase: 'no-metamodel',
                    error: 'Open a metamodel to run this script'
                }));
                return;
            }

            // Has project and metamodel - ready to execute
            const mm = metamodels[0]; // Use first open metamodel
            setState(prev => ({ ...prev, selectedMetamodelId: mm.id }));

            if (mm.elementCount > 0) {
                setPhase('confirm-non-empty');
            } else {
                await prepareExecution();
            }

        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            setState(prev => ({ ...prev, error: msg, phase: 'error' }));
            onError?.(msg);
        }
    }, [api, setPhase, onError, prepareExecution]);

    // Confirm create project
    const confirmCreateProject = useCallback(async (confirm: boolean) => {
        if (!confirm) {
            setPhase('cancelled');
            return;
        }

        try {
            const name = state.suggestedProjectName || 'New Project';
            const project = await api.createProject(name);
            setState(prev => ({ ...prev, selectedProjectId: project.id }));
            setPhase('no-metamodel');
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to create project';
            setState(prev => ({ ...prev, error: msg }));
            setPhase('error');
            onError?.(msg);
        }
    }, [api, state.suggestedProjectName, setPhase, onError]);

    // Confirm create metamodel
    const confirmCreateMetamodel = useCallback(async (confirm: boolean) => {
        if (!confirm) {
            setPhase('cancelled');
            return;
        }

        try {
            const name = state.suggestedMetamodelName || 'NewMetamodel';
            const mm = await api.createMetamodel(state.selectedProjectId!, name);
            await api.openMetamodel(mm.id);
            setState(prev => ({ ...prev, selectedMetamodelId: mm.id }));
            await prepareExecution();
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to create metamodel';
            setState(prev => ({ ...prev, error: msg }));
            setPhase('error');
            onError?.(msg);
        }
    }, [api, state.selectedProjectId, state.suggestedMetamodelName, setPhase, onError, prepareExecution]);

    // Select metamodel
    const selectMetamodel = useCallback(async (id: string) => {
        try {
            const metamodels = await api.getOpenMetamodels();
            const selected = metamodels.find(m => m.id === id);

            if (!selected) throw new Error('Metamodel not found');

            await api.openMetamodel(id);
            setState(prev => ({ ...prev, selectedMetamodelId: id }));

            if (selected.elementCount > 0) {
                setPhase('confirm-non-empty');
            } else {
                await prepareExecution();
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to select metamodel';
            setState(prev => ({ ...prev, error: msg }));
            setPhase('error');
            onError?.(msg);
        }
    }, [api, setPhase, onError, prepareExecution]);

    // Confirm non-empty
    const confirmNonEmpty = useCallback(async (confirm: boolean) => {
        if (!confirm) {
            setPhase('cancelled');
            return;
        }
        await prepareExecution();
    }, [setPhase, prepareExecution]);

    // Execute single command
    const executeCommandAtIndex = useCallback(async (index: number): Promise<boolean> => {
        const command = state.commands?.[index];
        const lineNumber = state.commandToLineMap?.[index];
        if (!command) return false;

        // Emit event before executing
        window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTING, {
            detail: {
                command,
                lineNumber,
                index,
                total: state.commands?.length
            }
        }));

        try {
            const result = await api.executeCommand(command);

            if (result.success) {
                setState(prev => {
                    const newExecutedLineNumbers = new Set(prev.executedLineNumbers);
                    if (lineNumber) newExecutedLineNumbers.add(lineNumber);
                    return {
                        ...prev,
                        executedCommands: [...prev.executedCommands, command],
                        executedLineNumbers: newExecutedLineNumbers,
                        currentCommandIndex: index,
                    };
                });
                return true;
            } else {
                setState(prev => ({ ...prev, error: result.message }));
                // Emit execution end event on error
                window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
                    detail: { status: 'error', error: result.message }
                }));
                setPhase('error');
                onError?.(result.message);
                return false;
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Execution error';
            setState(prev => ({ ...prev, error: msg }));
            // Emit execution end event on error
            window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
                detail: { status: 'error', error: msg }
            }));
            setPhase('error');
            onError?.(msg);
            return false;
        }
    }, [api, state.commands, state.commandToLineMap, setPhase, onError]);

    // Execute all
    const executeAll = useCallback(async () => {
        if (!state.commands) return;

        setPhase('executing');
        pauseRef.current = false;

        const startIndex = state.currentCommandIndex + 1;

        for (let i = startIndex; i < state.commands.length; i++) {
            if (pauseRef.current) {
                setPhase('paused');
                return;
            }

            setState(prev => ({ ...prev, currentCommandIndex: i }));

            const success = await executeCommandAtIndex(i);
            if (!success) return;

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (state.snapshotId) {
            try { await api.discardSnapshot(state.snapshotId); } catch (e) { /* ignore */ }
        }

        // Emit execution end event
        window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
            detail: { status: 'completed', executedCount: state.commands?.length }
        }));

        setPhase('completed');
        onComplete?.();
    }, [api, state.commands, state.currentCommandIndex, state.snapshotId, executeCommandAtIndex, setPhase, onComplete]);

    // Execute step
    const executeStep = useCallback(async () => {
        if (!state.commands) return;

        const nextIndex = state.currentCommandIndex + 1;

        if (nextIndex >= state.commands.length) {
            if (state.snapshotId) {
                try { await api.discardSnapshot(state.snapshotId); } catch (e) { /* ignore */ }
            }
            setPhase('completed');
            onComplete?.();
            return;
        }

        setPhase('executing');
        setState(prev => ({ ...prev, currentCommandIndex: nextIndex }));

        const success = await executeCommandAtIndex(nextIndex);
        if (success) setPhase('paused');
    }, [api, state.commands, state.currentCommandIndex, state.snapshotId, executeCommandAtIndex, setPhase, onComplete]);

    // Stop and undo
    const stop = useCallback(async () => {
        pauseRef.current = true;

        if (state.snapshotId) {
            try { await api.restoreSnapshot(state.snapshotId); } catch (e) { /* ignore */ }
        }

        // Emit execution end event
        window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
            detail: { status: 'cancelled', executedCount: state.executedCommands.length }
        }));

        setPhase('cancelled');
    }, [api, state.snapshotId, state.executedCommands.length, setPhase]);

    // Reset
    const reset = useCallback(() => {
        pauseRef.current = false;

        // Emit execution end event
        window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
            detail: { status: 'reset' }
        }));

        setState(initialState);
    }, []);

    return {
        state,
        startGeneration,
        confirmCreateProject,
        confirmCreateMetamodel,
        selectMetamodel,
        confirmNonEmpty,
        executeAll,
        executeStep,
        stop,
        reset,
    };
}
