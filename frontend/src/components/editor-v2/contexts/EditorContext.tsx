import { createContext, useContext } from 'react';
import type { Edge } from '@xyflow/react';
import type { NotationMode } from '../types';

interface EditorContextValue {
    takeSnapshot: () => void;
    notation: NotationMode;
    onEdgeDataChange?: (edgeId: string, data: Partial<Edge>) => void;
    /** Recalculate auto-anchors for a specific edge (e.g. after segment handle drag). */
    recalculateAnchors?: (edgeId: string) => void;
    /** Update Properties panel to show a child element (attr/op/literal) without changing graph selection. */
    selectChildElement?: (childModelElementId: string) => void;
    /** Select a graph edge (e.g. a DReference) from a non-RF gesture, mirroring onEdgeClick. */
    selectEdge?: (edgeId: string) => void;
}

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditorContext() {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditorContext must be used within EditorContext.Provider');
    }
    return context;
}

export function useEditorContextSafe() {
    return useContext(EditorContext);
}
