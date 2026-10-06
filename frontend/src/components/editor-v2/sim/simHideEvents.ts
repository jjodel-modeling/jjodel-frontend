/**
 * simHideEvents: the canvas without the run's events (P-2026-10-04-0935).
 *
 * Events are M1 instances of the model (R-SIM-16), drawn as ordinary nodes and
 * linked to their transitions by the trigger reference. While a run of the model
 * exists (Running, Terminated, Deadlock or Halted, R-SIM-29) the user fires them
 * from the panel or the I/O board, so the canvas does not draw them, nor any
 * edge incident to them. Not started, after Stop, and without a panel, nothing
 * is hidden.
 *
 * Pure, and view-only by construction: it decorates the arrays EditorV2 hands
 * to React Flow, never the editor's own state, so nothing is written, laid out,
 * persisted or put on the undo stack. Hidden, never removed (the pattern of the
 * IR row suppression, useIRContainment.ts): React Flow keeps the elements in its
 * store, so every handle keeps its place (DynamicHandles counts a node's edges
 * hidden or not). Unlike a node the IR suppresses, a node the run hides keeps
 * its box as an obstacle (`occupiesCanvas`): the routes and the lanes of the
 * other edges read the same boxes as before the run, so nothing else moves, and
 * Stop gives back the canvas of before.
 *
 * An edge lifted onto a collapsed IR container stays: it may stand for a bundle
 * of edges of which only one reaches an event.
 */

import type { Edge, Node } from '@xyflow/react';

/** The nodes and edges handed to React Flow. */
export interface SimCanvasElements {
    readonly nodes: Node[];
    readonly edges: Edge[];
}

/** A node as React Flow holds it, with the mark of a node the run hides. */
type RunHiddenNode = Node & { readonly simRunHidden?: true };

/**
 * True when a node takes its place on the canvas: drawn, or hidden by the run,
 * whose box stays an obstacle for the routes and the lanes of the other edges.
 * A node hidden otherwise (an IR row, a collapsed hull) takes none.
 */
export function occupiesCanvas(node: Node): boolean {
    return !node.hidden || (node as RunHiddenNode).simRunHidden === true;
}

/** `items` with the ones `hide` names flagged hidden, copied with `mark`; the same array when there is none to flag. */
function flagHidden<T extends { hidden?: boolean }>(items: T[], hide: (item: T) => boolean, mark: object = {}): T[] {
    let out: T[] | null = null;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.hidden || !hide(item)) continue;
        out ??= items.slice();
        out[i] = { ...item, ...mark, hidden: true };
    }
    return out ?? items;
}

/**
 * The canvas while a run exists: every node whose object is one of `events`
 * (the run's alphabet, the event instance ids at Reset), flagged hidden and
 * marked as the run's, and every edge with such a node at either end, flagged
 * hidden; one already hidden is left as it is. `events` undefined (no run) or
 * empty (no event role): the same arrays, so the canvas is today's. `objectOf`
 * maps a node id, a DVertex, to its object (`idlookup[vertex].model`).
 */
export function hideRunEvents(
    nodes: Node[], edges: Edge[], events: readonly string[] | undefined, objectOf: (nodeId: string) => unknown,
): SimCanvasElements {
    if (!events || events.length === 0) return { nodes, edges };
    const eventIds = new Set(events);
    const eventNodes = new Set<string>();
    for (const n of nodes) {
        const object = objectOf(n.id);
        if (typeof object === 'string' && eventIds.has(object)) eventNodes.add(n.id);
    }
    if (eventNodes.size === 0) return { nodes, edges };
    return {
        nodes: flagHidden(nodes, n => eventNodes.has(n.id), { simRunHidden: true }),
        edges: flagHidden(edges, e => eventNodes.has(e.source) || eventNodes.has(e.target)),
    };
}
