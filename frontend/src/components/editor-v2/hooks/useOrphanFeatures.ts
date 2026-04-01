/**
 * useOrphanFeatures — Soft-delete co-evolution for M1 instance features.
 *
 * When a metamodel attribute is removed, existing instance feature values
 * are saved locally (OrphanStore). If an attribute with the same name is
 * later re-added, the values are automatically restored.
 *
 * The store is a session-local useRef — no Redux, no persistence.
 * Clears when the modelid changes or the component unmounts.
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { Node } from '@xyflow/react';
import type { ObjectNodeData } from '../types';
import { store, LPointerTargetable, SetFieldAction, TRANSACTION } from '../../../joiner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrphanFeature {
    vertexId: string;   // RF node ID (DVertex)
    value: string;      // display value at time of removal
}

/** Map: attributeName → list of orphaned feature values per instance */
type OrphanStore = Map<string, OrphanFeature[]>;

// ---------------------------------------------------------------------------
// Selector: per-class attribute name sets
// ---------------------------------------------------------------------------

/**
 * Builds a serialized signature of every class's attribute names.
 * Format: "classId1=attr1,attr2|classId2=attr3"
 * Only includes classes that have at least one DObject instance on the canvas.
 */
function useClassAttrSig(classIds: Set<string>): string {
    return useSelector((state: any) => {
        const lookup = state.idlookup;
        if (!lookup || classIds.size === 0) return '';
        const parts: string[] = [];
        for (const classId of classIds) {
            const dClass = lookup[classId] as any;
            if (!dClass?.attributes) continue;
            const names: string[] = [];
            for (const attrId of dClass.attributes) {
                if (typeof attrId !== 'string') continue;
                const dAttr = lookup[attrId] as any;
                if (dAttr?.name) names.push(dAttr.name);
            }
            parts.push(`${classId}=${names.join(',')}`);
        }
        return parts.join('|');
    });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// DIAGNOSTIC: OrphanStore temporarily disabled to isolate undo/attr_0 bug
export function useOrphanFeatures(
    _modelid: string | undefined,
    _nodes: Node[],
): void {
    return; // no-op
}
