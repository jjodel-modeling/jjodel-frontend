/**
 * Step T6 of the textual notation, part 5 (P-2026-11-02-2327; R-TXT-19, R-TXT-21 (6), R-TXT-26): what the model gives
 * the diff besides its objects, read off the lookup, and the run of a plan's lines on the model, as one undo step,
 * through the path «New model from text» uses (ui/openTextualTab.tsx `createModelFromText`: `EXECUTION_START`, then
 * PreviewBar.tsx `applyAsOneStep`). No editor wiring: that is step T6b.
 *
 * The run's handles are registered after `EXECUTION_START`, which clears the registry, and before the first line, so
 * that each line addresses its model object by id (`executor/handleRegistry.ts`, consulted before any name).
 *
 * The app modules are imported when the run starts, so the readers test on a plain lookup, and the module stays in
 * the textual chunk (R-GEN-2).
 */

import { JjScriptEvents } from '../../events/registry';
import { registerHandle } from '../../jjscript/executor/handleRegistry';
import type { TextObject } from './metamodel';
import type { ApplyRefusal, TextEditPlan } from './textDiff';

type Lookup = Readonly<Record<string, any>>;

const pointers = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const isEmptyValue = (v: unknown): boolean => v === undefined || v === null || v === '';

/**
 * The attribute slots the eval context reads through a default (eval.ts `emptyAttributeDefault`): the object's
 * D-layer value of the feature holds nothing, and the slot of `objects` holds a value. Object id to feature names.
 */
export function defaultedSlots(lookup: Lookup, objects: readonly TextObject[]): Map<string, Set<string>> {
    const out = new Map<string, Set<string>>();
    for (const o of objects) {
        for (const vid of pointers(lookup[o.id]?.features)) {
            const value = lookup[vid];
            const name = lookup[value?.instanceof]?.name;
            if (typeof name !== 'string' || lookup[value.instanceof]?.className !== 'DAttribute') continue;
            if ((Array.isArray(value.values) ? value.values : []).some((v: unknown) => !isEmptyValue(v))) continue;
            const read = o.slots[name];
            if (isEmptyValue(read) || (Array.isArray(read) && read.length === 0)) continue;
            out.set(o.id, (out.get(o.id) ?? new Set()).add(name));
        }
    }
    return out;
}

/** The model a D-layer element belongs to: up its `father` chain to the first DModel. */
function modelOf(lookup: Lookup, id: string): string | undefined {
    let at: any = lookup[id];
    for (let hops = 0; at && hops < 64; hops++) {
        if (at.className === 'DModel') return at.id;
        at = lookup[at.father];
    }
    return undefined;
}

/** The objects of `modelId` that a value of another model points to (R-TXT-19, R-TXT-26). */
export function referencedElsewhere(lookup: Lookup, modelId: string): Set<string> {
    const out = new Set<string>();
    const mine = (id: string): boolean => lookup[id]?.className === 'DObject' && modelOf(lookup, id) === modelId;
    for (const v of Object.values(lookup)) {
        if (v?.className !== 'DValue') continue;
        const targets = pointers(v.values).filter(mine);
        if (targets.length && modelOf(lookup, v.id) !== modelId) targets.forEach(t => out.add(t));
    }
    return out;
}

export interface TextApplyOutcome {
    readonly applied: number;
    readonly failed: number;
    /** Set when the plan was refused: nothing ran. */
    readonly refused?: readonly ApplyRefusal[];
}

/** Runs a plan on the model `modelId` as one undo step; a refused plan runs nothing, an empty one too. */
export async function applyTextEdit(modelId: string, plan: TextEditPlan): Promise<TextApplyOutcome> {
    if (!plan.lines) return { applied: 0, failed: 0, refused: plan.refusals };
    if (plan.lines.length === 0) return { applied: 0, failed: 0 };
    const [{ applyAsOneStep }, { buildPlanWorld }, { U, store }] = await Promise.all([
        import('../../components/editor-v2/preview/PreviewBar'),
        import('../../jjscript/executor/planWorld'),
        import('../../joiner'),
    ]);
    const script = plan.lines.join('\n');
    window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_START, {
        detail: { script, commandCount: plan.lines.length, mode: 'textual' },
    }));
    for (const [handle, id] of plan.handles) registerHandle(handle, id);
    // The user's gesture opens the D-layer history (R-UNDO-2), as createModelFromText does.
    U.userHasInteracted = true;
    let outcome = { applied: 0, failed: 0 };
    try {
        outcome = await applyAsOneStep({ script, modelId, world: buildPlanWorld((store.getState() as any)?.idlookup ?? {}, modelId) });
    } finally {
        window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
            detail: { status: outcome.failed === 0 ? 'completed' : 'error' },
        }));
    }
    U.isProjectModified = true;
    return outcome;
}
