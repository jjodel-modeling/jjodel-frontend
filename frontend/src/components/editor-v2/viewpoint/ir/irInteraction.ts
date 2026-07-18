/**
 * irInteraction — interaction plan derived from the IR viewpoint (Fase 3,
 * spec v1.2 sez. 6).
 *
 * Normative default: a viewpoint without an explicit `interaction` spec is
 * fully editable with gestures DERIVED from its views:
 * - palette: metaclasses declared by vertex/graphVertex views (wildcard views
 *   contribute nothing — they follow whatever the model allows);
 * - connect: object-as-edge views yield {edgeMetaclass, sourceFeature,
 *   targetFeature} (the reference the connect gesture writes);
 * - containment drop: graphVertex views yield the container metaclasses whose
 *   composition references accept dropped children.
 *
 * Consumers filter the existing surfaces (PalettePanel rootable list,
 * connect popup, drop targets) — the write path stays the canonical
 * canvasToJjom API. Pure module; unit-tested.
 */

import type { IRViewpointIndex } from './irResolveCore';

export interface IRConnectRule {
    edgeMetaclass: string;
    sourceFeature: string | null;
    targetFeature: string | null;
}

export interface IRInteractionPlan {
    /** Metaclass names creatable from the palette; null = no IR restriction (no metaclass-declared node views). */
    paletteMetaclasses: string[] | null;
    /** Connect gestures derivable from object-as-edge views. */
    connectRules: IRConnectRule[];
    /** Container metaclass names accepting containment drops (graphVertex views). */
    dropContainers: string[];
}

function firstFeatureOf(expr: string | undefined): string | null {
    if (!expr) return null;
    const m = expr.match(/^\$([A-Za-z_][A-Za-z0-9_]*)/);
    return m ? m[1] : null;
}

export function deriveIRInteraction(index: IRViewpointIndex): IRInteractionPlan {
    const palette = new Set<string>();
    const dropContainers = new Set<string>();
    for (const [mc, entries] of index.byMetaclass) {
        for (const e of entries) {
            palette.add(mc);
            if (e.compiled.kind === 'graphVertex') dropContainers.add(mc);
        }
    }
    const connectRules: IRConnectRule[] = [];
    const seen = new Set<string>();
    for (const [mc, entries] of index.objectAsEdgeByMetaclass) {
        for (const e of entries) {
            const key = `${mc}:${e.compiled.viewId}`;
            if (seen.has(key)) continue;
            seen.add(key);
            // object-as-edge metaclasses are creatable via the connect gesture,
            // not the palette (their node is hidden).
            palette.add(mc);
            connectRules.push({
                edgeMetaclass: mc,
                sourceFeature: firstFeatureOf(e.compiled.ir.edge?.source),
                targetFeature: firstFeatureOf(e.compiled.ir.edge?.target),
            });
        }
    }
    return {
        paletteMetaclasses: palette.size > 0 ? Array.from(palette) : null,
        connectRules,
        dropContainers: Array.from(dropContainers),
    };
}
