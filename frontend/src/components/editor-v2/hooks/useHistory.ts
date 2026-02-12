import { useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface HistoryState {
    nodes: Node[];
    edges: Edge[];
}

interface UseHistoryReturn {
    takeSnapshot: () => void;
    undo: () => HistoryState | null;
    redo: () => HistoryState | null;
    canUndo: boolean;
    canRedo: boolean;
}

const MAX_HISTORY = 50;

/**
 * Hook for managing undo/redo history of nodes and edges.
 * Uses refs to avoid triggering re-renders on every snapshot.
 */
export function useHistory(
    getNodes: () => Node[],
    getEdges: () => Edge[]
): UseHistoryReturn {
    const past = useRef<HistoryState[]>([]);
    const future = useRef<HistoryState[]>([]);

    const takeSnapshot = useCallback(() => {
        const snapshot: HistoryState = {
            nodes: JSON.parse(JSON.stringify(getNodes())),
            edges: JSON.parse(JSON.stringify(getEdges())),
        };
        past.current.push(snapshot);
        // Limit history size
        if (past.current.length > MAX_HISTORY) {
            past.current.shift();
        }
        // Clear future on new action
        future.current = [];
    }, [getNodes, getEdges]);

    const undo = useCallback((): HistoryState | null => {
        if (past.current.length === 0) return null;

        // Save current state to future
        const current: HistoryState = {
            nodes: JSON.parse(JSON.stringify(getNodes())),
            edges: JSON.parse(JSON.stringify(getEdges())),
        };
        future.current.push(current);

        // Pop and return previous state
        const previous = past.current.pop()!;
        return previous;
    }, [getNodes, getEdges]);

    const redo = useCallback((): HistoryState | null => {
        if (future.current.length === 0) return null;

        // Save current state to past
        const current: HistoryState = {
            nodes: JSON.parse(JSON.stringify(getNodes())),
            edges: JSON.parse(JSON.stringify(getEdges())),
        };
        past.current.push(current);

        // Pop and return future state
        const next = future.current.pop()!;
        return next;
    }, [getNodes, getEdges]);

    return {
        takeSnapshot,
        undo,
        redo,
        canUndo: past.current.length > 0,
        canRedo: future.current.length > 0,
    };
}

export default useHistory;
