/**
 * useJjtlExecutor Hook
 * React hook for executing JjTL transformations
 */

import { useState, useCallback, useRef } from 'react';
import { execute, ExecutionResult } from '../executor';
import { TransformationAST } from '../types';
import { TraceEntry } from '../views/MappingTraceView';

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'failed';

export interface UseJjtlExecutorResult {
    execute: (ast: TransformationAST, sourceModel: any) => Promise<ExecutionResult>;
    /** Update state from an externally-provided ExecutionResult (no re-execution) */
    setResultFromExternal: (result: ExecutionResult, executionTimeMs?: number) => void;
    isExecuting: boolean;
    executionStatus: ExecutionStatus;
    lastResult: ExecutionResult | null;
    lastExecutionTime: number | undefined;
    trace: TraceEntry[];
    clearTrace: () => void;
    errors: string[];
}

export interface UseJjtlExecutorOptions {
    onExecutionStart?: () => void;
    onExecutionComplete?: (result: ExecutionResult) => void;
    onExecutionError?: (error: Error) => void;
}

/**
 * Hook for executing JjTL transformations
 */
export function useJjtlExecutor(options: UseJjtlExecutorOptions = {}): UseJjtlExecutorResult {
    const { onExecutionStart, onExecutionComplete, onExecutionError } = options;

    const [isExecuting, setIsExecuting] = useState(false);
    const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
    const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);
    const [lastExecutionTime, setLastExecutionTime] = useState<number | undefined>();
    const [trace, setTrace] = useState<TraceEntry[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const executionIdRef = useRef(0);

    // Execute transformation
    const executeTransformation = useCallback(async (
        ast: TransformationAST,
        sourceModel: any
    ): Promise<ExecutionResult> => {
        const executionId = ++executionIdRef.current;
        const startTime = performance.now();

        setIsExecuting(true);
        setExecutionStatus('running');
        setErrors([]);
        onExecutionStart?.();

        try {
            // Execute the transformation
            const result = await execute(ast, sourceModel);

            // Check if this execution is still the current one
            if (executionId !== executionIdRef.current) {
                return result; // Stale execution, ignore
            }

            const endTime = performance.now();
            setLastExecutionTime(Math.round(endTime - startTime));

            setLastResult(result);

            if (result.success) {
                setExecutionStatus('success');

                // Prefer structured traceModel if available
                if (result.traceModel && result.traceModel.links.length > 0) {
                    const traceEntries: TraceEntry[] = result.traceModel.links.map((link, index) => ({
                        id: `trace-${index}`,
                        timestamp: result.traceModel!.executedAt,
                        sourceElement: {
                            id: link.sourceElement.elementName,
                            className: link.sourceElement.className,
                            name: link.sourceElement.elementName,
                        },
                        targetElement: {
                            id: link.targetElements[0]?.elementName || 'unknown',
                            className: link.targetElements[0]?.className || 'Unknown',
                            name: link.targetElements[0]?.elementName,
                        },
                        mappingRule: link.rule,
                        status: 'success',
                        attributeMappings: link.bindings.map(b => ({
                            sourceAttr: b.sourceAttribute || '(derived)',
                            targetAttr: b.targetAttribute,
                            sourceValue: b.sourceValue,
                            targetValue: b.targetValue,
                            invertible: b.invertible,
                            expression: b.expression,
                            userProvided: b.userProvided,
                        })),
                    }));
                    setTrace(traceEntries);
                }
                // Fallback to legacy trace if no traceModel
                else if (result.trace) {
                    const traceEntries: TraceEntry[] = [];
                    let traceIndex = 0;

                    result.trace.forEach((targetObj, sourceObj) => {
                        traceEntries.push({
                            id: `trace-${traceIndex++}`,
                            timestamp: Date.now(),
                            sourceElement: {
                                id: sourceObj.id || `source-${traceIndex}`,
                                className: sourceObj.className || 'Unknown',
                                name: sourceObj.name,
                            },
                            targetElement: {
                                id: targetObj.id || `target-${traceIndex}`,
                                className: targetObj.className || 'Unknown',
                                name: targetObj.name,
                            },
                            mappingRule: `${sourceObj.className} -> ${targetObj.className}`,
                            status: 'success',
                        });
                    });

                    setTrace(traceEntries);
                }
            } else {
                setExecutionStatus('failed');
                setErrors(result.errors);

                // Add failed trace entries
                setTrace([{
                    id: 'trace-failed',
                    timestamp: Date.now(),
                    sourceElement: {
                        id: 'error',
                        className: 'Error',
                    },
                    targetElement: {
                        id: 'error',
                        className: 'Error',
                    },
                    mappingRule: 'Execution failed',
                    status: 'failed',
                    details: result.errors.join('; '),
                }]);
            }

            onExecutionComplete?.(result);
            return result;

        } catch (error) {
            // Check if this execution is still the current one
            if (executionId !== executionIdRef.current) {
                throw error;
            }

            const endTime = performance.now();
            setLastExecutionTime(Math.round(endTime - startTime));

            setExecutionStatus('failed');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setErrors([errorMessage]);

            const failedResult: ExecutionResult = {
                success: false,
                errors: [errorMessage],
                warnings: [],
            };

            setLastResult(failedResult);
            onExecutionError?.(error instanceof Error ? error : new Error(errorMessage));

            return failedResult;

        } finally {
            if (executionId === executionIdRef.current) {
                setIsExecuting(false);
            }
        }
    }, [onExecutionStart, onExecutionComplete, onExecutionError]);

    // Clear trace
    const clearTrace = useCallback(() => {
        setTrace([]);
        setLastResult(null);
        setLastExecutionTime(undefined);
        setExecutionStatus('idle');
        setErrors([]);
    }, []);

    // Set result from external source (e.g., from ProjectEditor execution)
    // This updates the trace display without re-executing
    const setResultFromExternal = useCallback((result: ExecutionResult, executionTimeMs?: number) => {
        setLastResult(result);
        if (executionTimeMs !== undefined) {
            setLastExecutionTime(executionTimeMs);
        }

        if (result.success) {
            setExecutionStatus('success');
            setErrors([]);

            // Prefer structured traceModel if available
            if (result.traceModel && result.traceModel.links.length > 0) {
                const traceEntries: TraceEntry[] = result.traceModel.links.map((link, index) => ({
                    id: `trace-${index}`,
                    timestamp: result.traceModel!.executedAt,
                    sourceElement: {
                        id: link.sourceElement.elementName,
                        className: link.sourceElement.className,
                        name: link.sourceElement.elementName,
                    },
                    targetElement: {
                        id: link.targetElements[0]?.elementName || 'unknown',
                        className: link.targetElements[0]?.className || 'Unknown',
                        name: link.targetElements[0]?.elementName,
                    },
                    mappingRule: link.rule,
                    status: 'success',
                    attributeMappings: link.bindings.map(b => ({
                        sourceAttr: b.sourceAttribute || '(derived)',
                        targetAttr: b.targetAttribute,
                        sourceValue: b.sourceValue,
                        targetValue: b.targetValue,
                        invertible: b.invertible,
                        expression: b.expression,
                        userProvided: b.userProvided,
                    })),
                }));
                setTrace(traceEntries);
            }
            // Fallback to legacy trace if no traceModel
            else if (result.trace) {
                const traceEntries: TraceEntry[] = [];
                let traceIndex = 0;

                result.trace.forEach((targetObj, sourceObj) => {
                    traceEntries.push({
                        id: `trace-${traceIndex++}`,
                        timestamp: Date.now(),
                        sourceElement: {
                            id: sourceObj.id || `source-${traceIndex}`,
                            className: sourceObj.className || 'Unknown',
                            name: sourceObj.name,
                        },
                        targetElement: {
                            id: targetObj.id || `target-${traceIndex}`,
                            className: targetObj.className || 'Unknown',
                            name: targetObj.name,
                        },
                        mappingRule: `${sourceObj.className} -> ${targetObj.className}`,
                        status: 'success',
                    });
                });

                setTrace(traceEntries);
            }
        } else {
            setExecutionStatus('failed');
            setErrors(result.errors);

            // Add failed trace entries
            setTrace([{
                id: 'trace-failed',
                timestamp: Date.now(),
                sourceElement: {
                    id: 'error',
                    className: 'Error',
                },
                targetElement: {
                    id: 'error',
                    className: 'Error',
                },
                mappingRule: 'Execution failed',
                status: 'failed',
                details: result.errors.join('; '),
            }]);
        }
    }, []);

    return {
        execute: executeTransformation,
        setResultFromExternal,
        isExecuting,
        executionStatus,
        lastResult,
        lastExecutionTime,
        trace,
        clearTrace,
        errors,
    };
}

export default useJjtlExecutor;
