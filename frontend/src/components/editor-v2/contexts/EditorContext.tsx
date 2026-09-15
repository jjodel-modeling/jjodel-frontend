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
    /** Whether the "Show edge labels" toggle is on (forces M1 edge labels visible without hover). */
    showEdgeLabels?: boolean;
    /** Whether the "Show singleton instances" toggle is on for THIS model. False is the state in
     *  which a reference row typed on a singleton-conforming class becomes a select (R-SGL-4):
     *  with the nodes hidden there is no arrow to draw. Mirror of the same channel as
     *  showEdgeLabels — never read from localStorage downstream. */
    showSingletons?: boolean;
    /** Ids of the metaclasses whose reference rows are singleton-conforming: a singleton class,
     *  or a class with at least one concrete subclass, all singleton (R-SGL-10(2)). Derived once
     *  from modeInfo so a row costs a Set lookup, never a getMetaclassInfo per render. */
    singletonConformTypeIds?: ReadonlySet<string>;
    /** For each conforming type, the singleton classes that satisfy it (the type itself when it is
     *  a singleton, plus its singleton concrete subclasses). Lets the row filter its candidate
     *  instances without importing getMetaclassInfo into viewpoint/ir. */
    singletonClassIdsByType?: ReadonlyMap<string, ReadonlySet<string>>;
    /** The M1 model being edited. Candidate instances are restricted to it: DClass.instances is
     *  flat over the whole project, so without this the select would offer other models' singletons. */
    modelId?: string;
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
