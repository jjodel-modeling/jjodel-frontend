/**
 * Script files in the megamodel view (S6b, R-JJD-5). Pure, so the bench can import it.
 *
 * A script is listed as a node of the transformation kind, the way `artifactTypeToKind` already
 * maps the `script` artifact type. It is linked to the model it runs on (`modelId`) only when that
 * model is a node of the view. Script nodes are placed after the layout of the other nodes, in a
 * row under them, so adding a script never moves an existing node.
 */

export interface MegamodelScriptInput {
    id: string;
    name: string;
    modelId?: string;
}

export interface MegamodelScriptLink {
    id: string;
    /** The model the script runs on. */
    from: string;
    /** The script. */
    to: string;
}

/** Gap between script nodes, and between the row and the nodes above it. */
export const SCRIPT_ROW_GAP = 40;

export function scriptLinkId(scriptId: string): string {
    return `script-runs-on:${scriptId}`;
}

/** The links of `scripts` to the models in `presentIds`; a script with no such model has none. */
export function scriptLinks(scripts: MegamodelScriptInput[], presentIds: Set<string>): MegamodelScriptLink[] {
    const links: MegamodelScriptLink[] = [];
    for (const s of scripts) {
        if (s.modelId && presentIds.has(s.modelId)) links.push({ id: scriptLinkId(s.id), from: s.modelId, to: s.id });
    }
    return links;
}

/**
 * Positions of the script nodes `scriptIds`, in order, on one row under the bounding box of
 * `placed` (the top-left corners of the other nodes, `nodeH` high), starting at its left edge.
 * With nothing placed the row starts at the origin.
 */
export function placeScriptNodes(
    placed: Array<{ x: number; y: number }>,
    scriptIds: string[],
    nodeW: number,
    nodeH: number,
    gap: number = SCRIPT_ROW_GAP,
): Map<string, { x: number; y: number }> {
    let minX = 0;
    let y = 0;
    if (placed.length > 0) {
        minX = Math.min(...placed.map(p => p.x));
        y = Math.max(...placed.map(p => p.y)) + nodeH + gap;
    }
    const out = new Map<string, { x: number; y: number }>();
    scriptIds.forEach((id, i) => out.set(id, { x: minX + i * (nodeW + gap), y }));
    return out;
}
