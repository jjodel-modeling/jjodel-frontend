/**
 * exprFoldViews — what a fold viewpoint needs beyond the batch (R-EXP-4, R-EXP-12): the term of the hidden union, the
 * IR documents, one per owner class, and what authoring says about the metamodel's binding. Pure: the node bench
 * loads it, while the hook that joins the union and the function that creates the viewpoint cannot.
 */

import { EXPR_BINDING_KEY, decodeExprBinding, type ExprBinding } from './exprBinding';
import { EXPR_SHARED_SLOT, exprFoldDep, exprFoldedObjects, type ExprLookup } from './exprBatch';
import type { LabelSpec, VertexViewIR } from '../../components/editor-v2/viewpoint/ir/irTypes';

const IR_VERSION = 'ir-1.2';
/** Wide enough for a formula to wrap at its operators rather than at every token. */
const FOLD_VIEW_WIDTH = 460;
const NOTHING_HIDDEN: ReadonlySet<string> = new Set<string>();

/** A `MetamodelSketch` is assignable to it. */
export interface ExprFoldSketch {
    classes: ReadonlyArray<{ id: string; name: string; abstract: boolean; supers: readonly string[] }>;
    attributes: ReadonlyArray<{ id: string; name: string }>;
    references: ReadonlyArray<{ id: string; name: string }>;
}

export interface ExprFoldView {
    classId: string;
    className: string;
    ir: VertexViewIR;
}

export interface ExprFoldStatus {
    /** True when a fold viewpoint can be derived from the binding. */
    ok: boolean;
    text: string;
}

/**
 * The objects the fold hides on the canvas of `viewpointId` over `modelId`. Empty when the viewpoint does not activate
 * the fold or the metamodel has no valid binding, so the objects stay nodes (R-EXP-12).
 */
export function exprFoldHidden(lookup: ExprLookup, viewpointId: string | null | undefined, modelId: string | null | undefined): ReadonlySet<string> {
    if (!viewpointId || !modelId || !exprFoldDep(lookup, viewpointId, modelId)) return NOTHING_HIDDEN;
    return exprFoldedObjects(lookup, modelId);
}

/** A class and everything it inherits from, the class first. */
function lineageOf(classes: ExprFoldSketch['classes'], classId: string): Set<string> {
    const byId = new Map(classes.map(c => [c.id, c]));
    const seen = new Set<string>();
    const pending = [classId];
    while (pending.length > 0) {
        const id = pending.pop() as string;
        if (seen.has(id)) continue;
        seen.add(id);
        pending.push(...(byId.get(id)?.supers ?? []));
    }
    return seen;
}

/**
 * One vertex document per concrete class that owns a slot through its lineage, or that hosts the shared definitions:
 * the name on top, then one stacked label per slot, captioned, in the order of the binding.
 */
export function exprFoldViews(binding: ExprBinding, sketch: ExprFoldSketch): ExprFoldView[] {
    const featureName = new Map([...sketch.attributes, ...sketch.references].map(f => [f.id, f.name]));
    const host = binding.sharing?.host;
    const views: ExprFoldView[] = [];
    for (const c of sketch.classes) {
        if (c.abstract) continue;
        const lineage = lineageOf(sketch.classes, c.id);
        const slots = binding.slots.filter(s => lineage.has(s.class) && featureName.has(s.feature));
        const hosts = host !== undefined && lineage.has(host);
        if (slots.length === 0 && !hosts) continue;
        const labels: LabelSpec[] = [{ position: 'top', source: { from: 'intrinsic', prop: 'name' } }];
        for (const s of slots) {
            const slot = featureName.get(s.feature) as string;
            labels.push({ position: 'inside', source: { from: 'expression', slot, caption: s.caption ?? slot } });
        }
        if (hosts) labels.push({ position: 'inside', source: { from: 'expression', slot: EXPR_SHARED_SLOT } });
        views.push({
            classId: c.id,
            className: c.name,
            ir: {
                irVersion: IR_VERSION, kind: 'vertex', metaclasses: [c.name], authoringMetaclassPins: { [c.name]: c.id }, exclusive: true,
                label: c.name, defaultSize: { width: FOLD_VIEW_WIDTH }, shape: { form: 'rect', labels },
            },
        });
    }
    return views;
}

const plural = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`;

/** What authoring says about the binding of the metamodel `metamodelId` (R-EXP-12). */
export function exprFoldStatus(lookup: ExprLookup, metamodelId: string): ExprFoldStatus {
    const decoded = decodeExprBinding((lookup as Record<string, any>)[metamodelId]?._state?.[EXPR_BINDING_KEY]);
    if (!decoded.ok) return { ok: false, text: `Invalid expression binding: the objects stay nodes. ${decoded.errors.join('; ')}` };
    if (!decoded.value) return { ok: false, text: 'No expression binding: the objects stay nodes. Import one to fold the expressions.' };
    return { ok: true, text: `Expression binding: ${plural(decoded.value.slots.length, 'slot')}, ${plural(decoded.value.roles.length, 'role')}.` };
}
