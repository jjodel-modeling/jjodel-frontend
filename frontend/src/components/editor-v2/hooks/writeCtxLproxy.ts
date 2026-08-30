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
import { writeDone, writeRefused, writeUnchanged, type CreateResult, type WriteCtx, type WriteResult } from '../../../jjform';
import { appendValue, clearValue, setObjectName, setValue } from '../viewpoint/ir/formWrite';
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

        create(cls, ownerId, childKey, seed): CreateResult {
            if (!modelId) return { ok: false, id: null, reason: 'this write context has no model to create in' };
            return createInstance(modelId, cls, ownerId, childKey, seed);
        },
        delete: deleteInstance,
    };
}
