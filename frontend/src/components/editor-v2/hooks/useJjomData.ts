/**
 * useJjomData — React hook that reads JjOM graph data from Redux
 * and transforms it into React Flow nodes and edges.
 *
 * Phase 2: read-only bridge. Subscribes to Redux via useSelector
 * and re-computes React Flow nodes/edges when the store changes.
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Node, Edge } from '@xyflow/react';
import {
    DState,
    DGraph,
    LGraph,
} from '../../../joiner';
import { transformJjomGraph } from '../utils/jjomTransformers';

interface JjomDataResult {
    /** React Flow nodes derived from JjOM vertices. */
    nodes: Node[];
    /** React Flow edges derived from JjOM edges. */
    edges: Edge[];
    /** Whether a matching graph was found for the modelid. */
    hasGraph: boolean;
}

/**
 * Reads the JjOM graph for the given modelid from Redux
 * and returns React Flow–compatible nodes and edges.
 *
 * When modelid is undefined, returns empty arrays.
 */
export function useJjomData(modelid: string | undefined): JjomDataResult {
    // Subscribe to the graph pointers array and idlookup version.
    // We need idlookup to detect changes in vertices/edges within the graph.
    const graphPointers = useSelector((state: DState) => state.graphs);
    const idlookup = useSelector((state: DState) => state.idlookup);

    return useMemo(() => {
        if (!modelid) {
            return { nodes: [], edges: [], hasGraph: false };
        }

        try {
            // Find the DGraph matching this modelid
            const dGraphs: DGraph[] = DGraph.fromPointer(graphPointers);
            const matchingGraph = dGraphs.find(g => g?.model === modelid);

            if (!matchingGraph) {
                return { nodes: [], edges: [], hasGraph: false };
            }

            // Get the L-proxy for the graph.
            // L-proxies use runtime magic getters so we cast to `any`.
            const lGraph: any = LGraph.fromPointer(matchingGraph.id);
            if (!lGraph) {
                return { nodes: [], edges: [], hasGraph: false };
            }

            // Extract vertices (nodes) and edges via L-proxy
            const vertices: any[] = lGraph.nodes ?? [];   // LVertex[]
            const edges: any[] = lGraph.edges ?? [];       // LEdge[]

            // Transform to React Flow format
            const { nodes: rfNodes, edges: rfEdges } = transformJjomGraph(vertices, edges);

            return { nodes: rfNodes, edges: rfEdges, hasGraph: true };
        } catch (err) {
            console.warn('[useJjomData] Error reading JjOM graph:', err);
            return { nodes: [], edges: [], hasGraph: false };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelid, graphPointers, idlookup]);
}
