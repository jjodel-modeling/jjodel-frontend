/**
 * writeCtxLproxy — the D-graph implementation of `jjform`'s `WriteCtx` (S4).
 *
 * Sibling of `irReadCtxLproxy.ts` and split from `jjform/writeCtx.ts` the same way
 * the read side is split from `irReadCtx.ts`: the INTERFACE has no import and stays
 * portable, the IMPLEMENTATION imports the joiner and lives out here, and the
 * dependency points inwards. That is the whole shape of this slice — by the time
 * `WriteResult` (S2) and by-id addressing (S3) had landed, what was left was a
 * rename, not a migration.
 *
 * ── This file COLLECTS, it does not rewrite ───────────────────────────────────
 *
 * Every method below is an existing function, and the delegation is declared next to
 * each one. Nothing here opens a TRANSACTION, changes an argument, adds a guard or
 * removes one: the writes are the ones the manager, the rail and the canvas have been
 * performing since 12b/12d, reached through one surface instead of four imports.
 *
 *   setValue / clearValue / appendValue  ->  formWrite.{setValue,clearValue,appendValue}
 *   setName                              ->  formWrite.setObjectName
 *   create                               ->  createAdapter.createInstance
 *   delete                               ->  deleteInstance, below
 *   validTargets                         ->  LValue.get_validTargets, below (S5)
 *
 * `delete` is the one primitive that had no function of its own: it was the body of
 * `deleteAdapter.runDeletes`'s loop, which counted rather than reporting. It lands
 * HERE rather than staying there so the dependency runs one way — `deleteAdapter`
 * imports this module, this module imports nothing of `deleteAdapter` — and
 * `runDeletes` now calls it, keeping its count exactly as it was.
 *
 * ── The model id, and why it is a construction argument ───────────────────────
 *
 * `WriteCtx.create` takes a metaclass by NAME, as the contract does everywhere: the
 * engine has a `MetamodelShape`, whose classes are keyed by name, and it has no id to
 * offer. Resolving that name to a D-layer class id needs a model, so the model is
 * bound when the ctx is built — the same choice `makeReadCtx(idlookup)` makes with the
 * store. A ctx built without one still writes, renames and deletes; only `create`
 * refuses, and it says why rather than throwing at the call site.
 */

import { LPointerTargetable, store } from '../../../joiner';
import { writeDone, writeRefused, writeUnchanged, type CreateResult, type TargetOption, type WriteCtx, type WriteResult } from '../../../jjform';
import { appendValue, clearValue, resolveSlot, setObjectName, setValue } from '../viewpoint/ir/formWrite';
import { createInstance } from './createAdapter';

/**
 * Delete one instance — the `delete` primitive.
 *
 * The body is `deleteAdapter.runDeletes`'s loop, one iteration of it, with its two
 * skips turned into verdicts instead of `continue`s:
 *
 *  - an id no longer in `idlookup` is `{ok: true, changed: false}` — already gone is
 *    not a failure, and it is the case a cascade hits whenever the core removed a
 *    child on its own;
 *  - an id that resolves to no proxy is a refusal with a reason, where the loop used
 *    to move on in silence.
 *
 * No outer TRANSACTION: `LPointerTargetable.get_delete` opens its own
 * (`joiner/classes.ts:2529`), and wrapping a cascade in one is the nesting hazard of
 * CLAUDE.md rule 12 / §3.3. The containment cascade is not here either — it is the
 * plan's (R-FORM-9), because this host's core does not cascade into a containment
 * slot at all.
 */
export function deleteInstance(id: string): WriteResult {
    if (!(store.getState() as any)?.idlookup?.[id]) return writeUnchanged();
    try {
        const proxy: any = LPointerTargetable.fromPointer(id);
        if (!proxy) return writeRefused(`instance ${id} does not resolve`);
        proxy.delete();
        return writeDone();
    } catch (err) {
        console.warn('[deleteAdapter] applyDelete failed', { id, err });
        const message = (err as { message?: unknown })?.message;
        return writeRefused(typeof message === 'string' ? message : undefined);
    }
}

/**
 * The legal arguments of a write on `(objectId, featureKey)` — the `validTargets`
 * primitive (S5).
 *
 * DELEGATION, not a reimplementation. The whole answer is `LValue.get_validTargets`
 * (`LModelElement.tsx:7883`), read through `validTargetOptions` (`:7871`) because that
 * overload is the one that carries the GROUP headings ('Free Objects', 'Bound Objects',
 * 'Literals of Tint') the picker renders as secondary text; the bare `validTargets`
 * returns the proxies without them. The containment-loop filter of R-FORM-13 lives
 * inside that method, behind `if (isContainment)`, and it is the reason this primitive
 * cannot be derived from a `MetamodelShape`: it subtracts the instance's own
 * `fatherList`, and a metaclass has no fathers. Moving the filter here would be trading
 * a verified guarantee for one of ours.
 *
 * Resolved at the moment it is ASKED, by `(objectId, featureKey)`, through the same
 * `resolveSlot` the writes use — never from a slot held across time (S3).
 *
 * TOTAL, as the contract declares: a missing object, a feature the metaclass no longer
 * has, an offer that throws on a half-built model (the case
 * `useFormWidgets.readOptions` carried a `try` for, since 1a) all answer `[]`. There is
 * no verdict to return here: an empty offer is an answer, and the picker renders it as
 * "no candidates".
 */
export function validTargetsFor(objectId: string, featureKey: string): TargetOption[] {
    let groups: any;
    try {
        const slot: any = resolveSlot(objectId, featureKey);
        if (!slot) return [];
        groups = slot.validTargetOptions;
    } catch (err) {
        console.warn('[writeCtxLproxy] validTargets failed', { objectId, featureKey, err });
        return [];
    }
    if (!Array.isArray(groups)) return [];
    const out: TargetOption[] = [];
    for (const g of groups) {
        if (!g || !Array.isArray(g.options)) continue;
        const group = typeof g.label === 'string' ? g.label.trim() : '';
        for (const o of g.options) {
            // The core's option is `{value, label, title}` (`LModelElement.tsx:7897`).
            // `value` is the id the write takes back, so an option without one is not a
            // candidate; the label falls back to it rather than leaving a blank row.
            if (!o || typeof o.value !== 'string' || !o.value) continue;
            const opt: TargetOption = { id: o.value, label: typeof o.label === 'string' && o.label ? o.label : o.value };
            if (group) opt.group = group;
            out.push(opt);
        }
    }
    return out;
}

/**
 * The `WriteCtx` of this host.
 *
 * `modelId` is needed by `create` alone (see the header). Everything else addresses
 * by instance id, which resolves against the whole store.
 */
export function makeWriteCtx(modelId: string = ''): WriteCtx {
    return {
        // The four form writes, verbatim: `formWrite` already addresses by
        // `(objectId, featureKey)` since S3 and already returns `WriteResult` since S2,
        // so these are the same functions under the contract's names.
        setValue: (id, key, index, value, isPtr) => setValue(id, key, index, value, isPtr),
        clearValue: (id, key, index, isPtr) => clearValue(id, key, index, isPtr),
        appendValue: (id, key, value, isPtr) => appendValue(id, key, value, isPtr),
        // A primitive of its own, and it has to stay one: the L setter writes both
        // halves of the identity binding (CLAUDE.md §3.12), which `setValue(id,'name',…)`
        // would not.
        setName: (id, name) => setObjectName(id, name),

        // The offer, and it is on this interface for the reason the header of
        // `jjform/writeCtx.ts` gives: what it enumerates are the legal arguments of the
        // two writes above, so a host cannot implement one half and not the other.
        validTargets: (id, key) => validTargetsFor(id, key),

        create(cls, ownerId, childKey, seed): CreateResult {
            if (!modelId) return { ok: false, id: null, reason: 'this write context has no model to create in' };
            return createInstance(modelId, cls, ownerId, childKey, seed);
        },
        delete: deleteInstance,
    };
}
