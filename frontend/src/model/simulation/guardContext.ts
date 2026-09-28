/**
 * guardContext — the context guards are evaluated in (step 2, R-SIM-14, R-SIM-18).
 *
 * Two lifetimes. `freezeSnapshot` runs once per run over the model M: the
 * record `buildEvalContext` builds (the class shells, the instance pool, the
 * names), without `data` and `node`, deep-frozen, and wrapped in one
 * `EvaluationContext`. `buildGuardContext` runs per guard evaluation and binds
 * only the roots, in a child scope of that base: `self` (the transition's pool
 * handle), `event` (the event instance's pool handle, `null` for ε) and `model`.
 * `node` is never bound here: a guard does not read presentation (R-SIM-18),
 * and the subset checker rejects it.
 *
 * ── Why the snapshot is a copy of `buildEvalContext`'s output ─────────────────
 *
 * `buildEvalContext` is the one builder of JjEL contexts over a model
 * (validationContext.ts explains why no second copy may exist). It imports the
 * joiner, so the pure core cannot call it: the panel will, at step 3, and hand
 * its record here. Its snapshot is plain objects except `data` and `node`, which
 * copy the live L-getter values of the selected element
 * (`jjscript/executor/commands/eval.ts`, `wrapSelectedElement`). Those two are
 * dropped before anything else, and the freeze refuses any L proxy it still
 * meets: `joiner/proxy.ts` has no `preventExtensions` or `defineProperty` trap,
 * so `Object.freeze` on a proxy would freeze the D-layer object behind it
 * (discovery_2026-09-24_sim_step2_eval_context.md §0, R1).
 *
 * ── What the freeze guarantees, and what it does not ─────────────────────────
 *
 * JjEL has no assignment, and the evaluator writes only to the child scopes it
 * creates (lambda, forall, exists). The freeze turns that de facto read-only
 * into an enforced one: a write on M throws `TypeError`. The only JjEL path
 * that could write is a caller-bound `JjelFunction`, and the snapshot refuses
 * those too. `Object.freeze` does not stop `Map.set`: the ambiguity map of
 * `buildEvalContext` stays a mutable `Map` with frozen entries. No expression
 * can reach it; it is named here so that nobody counts on it.
 *
 * Pure: the only dependency is JjEL.
 */

import { EvaluationContext, isJjelFunction } from '../../jjel/evaluator';
import type { JjelValue } from '../../jjel/evaluator';
import type { JjelStateAccess } from '../../jjel/evaluator/context';
import { STATE_RESERVED } from '../../jjel/stateReserved';
import type { SimStateAccess } from './netTypes';

/** M, frozen once per run (R-SIM-14). */
export interface SimSnapshot {
    readonly modelId: string;
    /** One context over the frozen globals, without `data`/`node`. Never evaluated on directly. */
    readonly base: EvaluationContext;
    /** Pool handle by DObject id: `self` and `event` are looked up here. */
    readonly handleById: ReadonlyMap<string, JjelValue>;
    /** The `model` root: a frozen `{ __type: 'Model', id, name }` until `model.[i]` exists. */
    readonly model: JjelValue;
}

/** The snapshot cannot be built: it would freeze an L proxy or expose a bound function. */
export class SimSnapshotError extends Error {
    constructor(message: string, readonly path: string) {
        super(message);
        this.name = 'SimSnapshotError';
    }
}

/**
 * σ as a guard or an action will read it (R-SIM-11, R-SIM-18, R-SIM-19). Type
 * only in step 2: nothing reads it before the `.[x]` operator exists, and how
 * `e.[x]` reaches it belongs to the lane that brings the operator (R-SIM-17).
 */
export interface SimStateReader {
    /** Semantic attribute `attr` of `elementId`; `undefined` when not declared. */
    read(elementId: string, attr: string): JjelValue | undefined;
    /** Presentation attribute of the site element only (locality, R-SIM-18). */
    readPresentation(attr: string): JjelValue | undefined;
    /** The derived boolean view of the marking (R-SIM-11). */
    isMarked(elementId: string): boolean;
}

/** The keys of `buildEvalContext` that never enter a guard: the selection, as live L values. */
const STRIPPED_KEYS: ReadonlySet<string> = new Set(['data', 'node']);

/**
 * Collects every object reachable from `value` (objects, arrays, Map values),
 * refusing an L proxy or a `JjelFunction`. Nothing is frozen here: the caller
 * freezes only when the whole walk passed, so a refusal leaves the input as it
 * was. A worklist, not recursion: a chain of references through the pool is as
 * deep as the model is large.
 */
function collect(root: unknown, rootPath: string, seen: Set<object>): void {
    const work: Array<[unknown, string]> = [[root, rootPath]];
    while (work.length > 0) {
        const [value, path] = work.pop()!;
        if (value === null || typeof value !== 'object') continue;
        if (seen.has(value)) continue;
        if ((value as any).__isProxy) {
            throw new SimSnapshotError(`an L proxy at ${path}: freezing it would freeze the model behind it`, path);
        }
        if (isJjelFunction(value as JjelValue)) {
            throw new SimSnapshotError(`a bound function at ${path}: a guard must not be able to call one`, path);
        }
        seen.add(value);
        if (value instanceof Map) {
            for (const [k, v] of value) work.push([v, `${path}<${String(k)}>`]);
        }
        for (const key of Reflect.ownKeys(value)) {
            work.push([(value as any)[key], `${path}.${String(key)}`]);
        }
    }
}

/**
 * Once per run: the globals of `buildEvalContext` without `data`/`node`,
 * deep-frozen in place, and the pool indexed by id. Throws `SimSnapshotError`,
 * freezing nothing, when the record holds an L proxy or a bound function.
 */
export function freezeSnapshot(
    globals: Record<string, JjelValue>,
    model: { id: string; name: string },
): SimSnapshot {
    const record: Record<string, JjelValue> = {};
    for (const key of Object.keys(globals)) {
        if (STRIPPED_KEYS.has(key)) continue;
        record[key] = globals[key];
    }

    const seen = new Set<object>();
    collect(record, 'globals', seen);
    for (const o of seen) Object.freeze(o);

    const handleById = new Map<string, JjelValue>();
    const pool = record.instances;
    if (Array.isArray(pool)) {
        for (const h of pool) {
            const id = (h as any)?.id;
            if (typeof id === 'string' && id) handleById.set(id, h);
        }
    }

    return Object.freeze({
        modelId: model.id,
        base: new EvaluationContext(record),
        handleById,
        model: Object.freeze({ __type: 'Model', id: model.id, name: model.name }) as JjelValue,
    });
}

/**
 * Per guard evaluation: a child scope of the base with the three roots. The
 * roots sit above the globals, so a metaclass or an instance named `self`,
 * `event` or `model` is hidden by them. Features are not flattened into bare
 * names: a guard reaches them through `self.f` only.
 *
 * `state`, when given, is what `x.[a]` reads (R-SIM-43): set on this scope,
 * so the scopes of `forall` and of lambdas inherit it and the base never has
 * it. Without it `.[a]` throws, as it does outside the simulator.
 *
 * `null` when the transition, or the current event, has no handle in the
 * snapshot; the guard evaluator reports it as a defect.
 */
export function buildGuardContext(
    snapshot: SimSnapshot,
    site: { transitionId: string },
    step: { event: string | null },
    state?: JjelStateAccess,
): EvaluationContext | null {
    const self = snapshot.handleById.get(site.transitionId);
    if (self === undefined) return null;
    let event: JjelValue = null;
    if (step.event !== null) {
        const handle = snapshot.handleById.get(step.event);
        if (handle === undefined) return null;
        event = handle;
    }
    const ctx = snapshot.base.child({ self, event, model: snapshot.model });
    if (state) ctx.stateAccess = state;
    return ctx;
}

/** The two read-only attributes, from the one reserved list (R-SIM-42): `marked`, then `tokens`. */
const [MARKED, TOKENS] = STATE_RESERVED.readOnlyAttributes;

/**
 * σ as JjEL reads it (R-SIM-30, R-SIM-43). `marked` and `tokens` are answered
 * from the marking, and only on a place of the compiled net: on any other
 * element they are `undefined`, so `t.[tokens]` on a transition throws and the
 * guard is a defect. Every other attribute is `read`, whose `undefined` for an
 * undeclared one throws the same way; the presentation is the accessor's own,
 * local to its site.
 */
export function toJjelStateAccess(access: SimStateAccess, places: ReadonlySet<string>): JjelStateAccess {
    return {
        read: (elementId, attr) => {
            if (attr === MARKED) return places.has(elementId) ? access.isMarked(elementId) : undefined;
            if (attr === TOKENS) return places.has(elementId) ? access.tokens(elementId) : undefined;
            return access.read(elementId, attr);
        },
        readPresentation: attr => access.readPresentation(attr),
    };
}
