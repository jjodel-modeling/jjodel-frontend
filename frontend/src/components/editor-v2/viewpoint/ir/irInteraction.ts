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
import type { MetaclassInfo, MetaclassReference } from '../../hooks/useEditorMode';

export interface IRConnectRule {
    edgeMetaclass: string;
    sourceFeature: string | null;
    targetFeature: string | null;
}

/** A connect rule applicable to a concrete (source, target) metaclass pair. */
export interface IRConnectRuleMatch {
    rule: IRConnectRule;
    /** Concrete metaclass of the edge-object to instantiate. */
    edgeClass: MetaclassInfo;
    /** Resolved source/target references of the edge metaclass (non-null names). */
    sourceRef: MetaclassReference;
    targetRef: MetaclassReference;
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

/**
 * Palette filter with normative fallback (spec v1.2 sez. 6): intersect the
 * rootable classes with the IR-declared palette metaclasses. If the
 * intersection is empty, the full rootable palette is returned with
 * `fallback: true` — the derived filter is a focusing aid, not a restriction;
 * only an explicit `interaction.palette` may restrict down to empty.
 * `fallback` stays false when there are no rootable classes at all (nothing
 * to show either way — the empty state is not a fallback).
 */
/** True when `classId` conforms to the reference's declared target (direct or concrete descendant). */
function conformsToRefTarget(ref: MetaclassReference, classId: string, classById: Map<string, MetaclassInfo>): boolean {
    if (ref.targetClassId === classId) return true;
    const declared = classById.get(ref.targetClassId);
    return !!declared && declared.concreteSubclasses.some(sub => sub.id === classId);
}

/**
 * Connect rules applicable to a gesture from an instance of `sourceClassId` to
 * an instance of `targetClassId` (wiring cantiere 2026-07-20). A rule matches
 * when its edge metaclass resolves to a concrete class whose source/target
 * references (by name) accept the two endpoint metaclasses, with the same
 * conformance used by getCompatibleReferences (direct match or concrete
 * descendant). Malformed rules (unknown metaclass, missing feature) are
 * skipped. Cross-MM targets absent from `allClasses` do not match (declared
 * v1 limit, same as getCompatibleContainmentRefs).
 */
export function matchConnectRules(
    plan: IRInteractionPlan | null,
    sourceClassId: string,
    targetClassId: string,
    allClasses: MetaclassInfo[],
): IRConnectRuleMatch[] {
    if (!plan || plan.connectRules.length === 0) return [];
    const classById = new Map(allClasses.map(c => [c.id, c]));
    const classByName = new Map(allClasses.map(c => [c.name, c]));
    const out: IRConnectRuleMatch[] = [];
    for (const rule of plan.connectRules) {
        if (!rule.sourceFeature || !rule.targetFeature) continue;
        const edgeClass = classByName.get(rule.edgeMetaclass);
        if (!edgeClass || edgeClass.isAbstract) continue;
        const sourceRef = edgeClass.references.find(r => r.name === rule.sourceFeature);
        const targetRef = edgeClass.references.find(r => r.name === rule.targetFeature);
        if (!sourceRef || !targetRef) continue;
        if (!conformsToRefTarget(sourceRef, sourceClassId, classById)) continue;
        if (!conformsToRefTarget(targetRef, targetClassId, classById)) continue;
        out.push({ rule, edgeClass, sourceRef, targetRef });
    }
    return out;
}

/**
 * Names of the concrete metaclasses droppable inside the plan's drop
 * containers (containment-reference targets + their concrete descendants).
 * Used to extend the IR palette beyond the rootable classes (decision D4,
 * discovery 2026-07-20): without it, contained-only classes (e.g. State in a
 * Machine) have no palette entry and the containment drop gesture cannot be
 * exercised. Cross-MM targets absent from `allClasses` are skipped (v1 limit).
 */
export function deriveDroppableChildMetaclasses(
    plan: IRInteractionPlan | null,
    allClasses: MetaclassInfo[],
): Set<string> {
    const out = new Set<string>();
    if (!plan || plan.dropContainers.length === 0) return out;
    const classById = new Map(allClasses.map(c => [c.id, c]));
    const classByName = new Map(allClasses.map(c => [c.name, c]));
    for (const containerName of plan.dropContainers) {
        const container = classByName.get(containerName);
        if (!container) continue;
        for (const ref of container.references) {
            if (!ref.containment) continue;
            const target = classById.get(ref.targetClassId);
            if (!target) continue;
            if (!target.isAbstract) out.add(target.name);
            for (const sub of target.concreteSubclasses) out.add(sub.name);
        }
    }
    return out;
}

export function applyIRPaletteFilter<T extends { name: string }>(
    rootable: T[],
    plan: IRInteractionPlan | null,
): { classes: T[]; fallback: boolean } {
    if (!plan?.paletteMetaclasses) return { classes: rootable, fallback: false };
    const filtered = rootable.filter(c => plan.paletteMetaclasses!.includes(c.name));
    if (filtered.length > 0) return { classes: filtered, fallback: false };
    return { classes: rootable, fallback: rootable.length > 0 };
}
