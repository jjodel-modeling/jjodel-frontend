/**
 * Editor V3 — useConnectionValidation: validates edge connections before creation.
 *
 * Rules:
 * - No self-loops for inheritance
 * - No circular inheritance chains
 * - Valid source/target types per edge kind
 */

import { useCallback } from 'react';
import { useNodes, useEdges, type Connection } from '@xyflow/react';
import type { ModelNodeData, UnifiedEdgeData } from '../types';

export interface ConnectionValidationResult {
    valid: boolean;
    reason?: string;
}

/**
 * Check if a connection would create a cycle in the inheritance graph.
 */
function wouldCreateInheritanceCycle(
    sourceId: string,
    targetId: string,
    edges: Array<{ source: string; target: string; data?: Record<string, unknown> }>,
): boolean {
    // Build adjacency list from existing inheritance edges (child → parent)
    const parentMap = new Map<string, Set<string>>();
    for (const edge of edges) {
        const edgeData = edge.data as UnifiedEdgeData | undefined;
        if (edgeData?.edgeKind === 'inheritance') {
            if (!parentMap.has(edge.source)) parentMap.set(edge.source, new Set());
            parentMap.get(edge.source)!.add(edge.target);
        }
    }

    // The new edge goes sourceId → targetId (child → parent)
    // Cycle exists if targetId can reach sourceId through existing inheritance
    const visited = new Set<string>();
    const queue = [targetId];

    while (queue.length > 0) {
        const current = queue.pop()!;
        if (current === sourceId) return true;
        if (visited.has(current)) continue;
        visited.add(current);

        const parents = parentMap.get(current);
        if (parents) {
            for (const parent of parents) {
                queue.push(parent);
            }
        }
    }

    return false;
}

export function useConnectionValidation() {
    const nodes = useNodes();
    const edges = useEdges();

    const validateConnection = useCallback((
        connection: Connection,
        edgeKind: UnifiedEdgeData['edgeKind'],
    ): ConnectionValidationResult => {
        const { source, target } = connection;
        if (!source || !target) {
            return { valid: false, reason: 'Missing source or target' };
        }

        // No self-loops for inheritance
        if (source === target && edgeKind === 'inheritance') {
            return { valid: false, reason: 'A class cannot inherit from itself' };
        }

        // Get node data
        const sourceNode = nodes.find(n => n.id === source);
        const targetNode = nodes.find(n => n.id === target);
        if (!sourceNode || !targetNode) {
            return { valid: false, reason: 'Node not found' };
        }

        const sourceData = sourceNode.data as unknown as ModelNodeData;
        const targetData = targetNode.data as unknown as ModelNodeData;

        // Type-specific validation
        switch (edgeKind) {
            case 'inheritance': {
                // Both must be classes (or interfaces)
                if (sourceData.modelSnapshot.kind !== 'class' || targetData.modelSnapshot.kind !== 'class') {
                    return { valid: false, reason: 'Inheritance requires two classes' };
                }
                // No duplicate inheritance
                const alreadyInherits = edges.some(e => {
                    const d = e.data as unknown as UnifiedEdgeData | undefined;
                    return d?.edgeKind === 'inheritance' && e.source === source && e.target === target;
                });
                if (alreadyInherits) {
                    return { valid: false, reason: 'Inheritance already exists' };
                }
                // No cycles
                if (wouldCreateInheritanceCycle(source, target, edges)) {
                    return { valid: false, reason: 'Would create circular inheritance' };
                }
                break;
            }

            case 'reference':
            case 'composition':
            case 'aggregation': {
                // Both must be classes
                if (sourceData.modelSnapshot.kind !== 'class' || targetData.modelSnapshot.kind !== 'class') {
                    return { valid: false, reason: 'References require two classes' };
                }
                break;
            }

            case 'instanceLink': {
                // Source must be object, target must be class
                if (sourceData.modelSnapshot.kind !== 'object') {
                    return { valid: false, reason: 'Instance link source must be an object' };
                }
                if (targetData.modelSnapshot.kind !== 'class') {
                    return { valid: false, reason: 'Instance link target must be a class' };
                }
                break;
            }
        }

        return { valid: true };
    }, [nodes, edges]);

    return { validateConnection };
}
