import { useSyncExternalStore } from 'react';
import {
    subscribe,
    getNodeProblemsSnapshot,
    getActiveOverlayProblemId,
    getIsHighlighted,
    type NodeProblem,
} from './registry';

export function useNodeProblems(nodeId: string): readonly NodeProblem[] {
    return useSyncExternalStore(
        subscribe,
        () => getNodeProblemsSnapshot(nodeId),
        () => getNodeProblemsSnapshot(nodeId),
    );
}

export function useActiveOverlayId(): string | null {
    return useSyncExternalStore(
        subscribe,
        getActiveOverlayProblemId,
        getActiveOverlayProblemId,
    );
}

export function useIsHighlighted(nodeId: string): boolean {
    return useSyncExternalStore(
        subscribe,
        () => getIsHighlighted(nodeId),
        () => getIsHighlighted(nodeId),
    );
}
