/**
 * The fourth producer of the problems registry: the simulator's guard and action checks
 * (P-2026-09-27-1805, discovery_2026-09-27_sim_checker_gap.md §7 option A).
 *
 * ── ONE SET OF RULES FOR TWO CHANNELS ───────────────────────────────────────
 *
 * The registry does not check anything itself. It runs the bridge's own `startRun`, the
 * function the panel's Reset calls, and publishes the guard and action entries of its
 * `compileDefects`, plus the two `else` defects of the net. So the defects line and the
 * registry cannot disagree: one function makes both, and a rule the bridge gains reaches
 * the registry with no change here. `startRun` is pure over the lookup and never touches
 * the panel's run (`simRunState`): the run it builds is discarded.
 *
 * ── WHAT STAYS OUT ──────────────────────────────────────────────────────────
 *
 *   - Declarations' defects: they have no M1 element (report F10), and a metaclass anchor
 *     is a ticket of its own.
 *   - Warnings (W-*, T-*): R-SIM-61 keeps them off the defects line, and off the registry.
 *   - A parse error where conformance runs the same parser on the same text: a guard on a
 *     `Pointer_EXPRESSION` feature, an action on a `Pointer_ACTION` one
 *     (`ConformanceValidator.ts`, the `EXPRESSION_TYPE_ID` branch). One text, one dot. An
 *     EString feature (R-SIM-44) keeps it: nothing else reports it.
 *   - The net's structural defects: only `else-twice` and `else-position` are about a guard.
 *
 * ── ANCHORING AND OWNERSHIP ─────────────────────────────────────────────────
 *
 * Two entries per defect, under the DObject id (tree, rail) and the resolved DVertex id
 * (canvas dot), as `validationToProblems.ts` does and with the same resolver. A fused
 * fork/join transition `node#edge` is anchored on the node: the defects line names it so
 * (`simBridge.ts`, `defectSubject`), and the node is the element with a vertex.
 * Revoke through `getProblemIdsOwnedBy('simulation', modelId)`, then `markResolved`.
 *
 * Pure: it takes the lookup and the context builder, so it runs under the node test bench,
 * which cannot load the joiner. The store and `buildEvalContext` are the component's.
 */

import {
    clearProblem, getProblemIdsOwnedBy, markResolved, registerProblem,
    type NodeProblem,
} from './registry';
import type { VertexResolver } from './vertexResolver';
import { runSignature, startRun } from '../sim/simBridge';
import type { CompileDefect, ContextBuilder } from '../sim/simBridge';
import { netStcFromRoles, withDerivedEventRole } from '../../../model/simulation/netCompile';
import type { NetDefect, NetStc } from '../../../model/simulation/netTypes';

type Lookup = Record<string, any>;

const SIM_CHECK_KIND: NodeProblem['kind'] = 'simulation';

/** The primitive types whose values conformance parses (`ConformanceValidator.ts`). */
const EXPRESSION_TYPE_ID = 'Pointer_EXPRESSION';
const ACTION_TYPE_ID = 'Pointer_ACTION';

/** The four keys whose values the checks read; with none bound the producer is inert. */
const CHECKED_ROLE_KEYS = ['simGuard', 'simAction', 'simEntry', 'simExit'] as const;

export type SimCheckRole = 'guard' | 'action' | 'entry' | 'exit';

const ROLE_TITLE: Record<SimCheckRole, string> = { guard: 'Guard', action: 'Action', entry: 'Entry', exit: 'Exit' };

/** One registry entry before anchoring: the DObject it is about, its role, its texts. */
export interface SimCheckEntry {
    readonly element: string;
    readonly role: SimCheckRole;
    readonly title: string;
    readonly description: string;
}

/**
 * The id of an entry: `${kind}:${nodeId}:${role}:${n}`, `n` the ordinal among the entries of
 * one element and role, since one guard or one action list can carry several defects.
 */
export function simCheckProblemId(nodeId: string, role: SimCheckRole, n: number): string {
    return `${SIM_CHECK_KIND}:${nodeId}:${role}:${n}`;
}

/** The metamodel whose bag holds the roles: the open model's `instanceof`, or `null`. */
function configModelOf(lookup: Lookup, modelId: string): string | null {
    const mm = lookup[modelId]?.instanceof;
    return typeof mm === 'string' && mm ? mm : null;
}

/**
 * What the producer's selector keys on: `''` when the model binds no guard or action role
 * (no metamodel, a metamodel open, a bag without the four keys), so that the walk of
 * `runSignature` is paid only by a simulation-bound M1; otherwise the run's own signature
 * (R-SIM-34), which covers the bag, the model's slots and the metamodel.
 */
export function simCheckSignature(lookup: Lookup, modelId: string): string {
    const configModelId = configModelOf(lookup, modelId);
    const bag = configModelId ? lookup[configModelId]?._state : undefined;
    if (!bag || typeof bag !== 'object') return '';
    if (!CHECKED_ROLE_KEYS.some(k => typeof bag[k] === 'string' && bag[k])) return '';
    return runSignature(lookup, modelId, configModelId);
}

/**
 * The short form the defects line shows for a guard or action defect: `short` when the
 * bridge gives one, else the form of its private `defectShort` (`simBridge.ts`) for the
 * reasons a compile defect of these two roles carries.
 */
function shortOf(d: CompileDefect): string {
    if (d.short) return d.short;
    if (d.reason === 'parse-error') return `parse error ${d.detail}`;
    if (d.reason === 'subset') return d.detail.split(':')[0];
    return d.detail;
}

/** The feature a site role reads its value from, for the dedup; `undefined` when unbound. */
function featureOf(stc: NetStc | null, role: SimCheckRole): string | undefined {
    if (!stc) return undefined;
    return role === 'guard' ? stc.guard : role === 'action' ? stc.action : role === 'entry' ? stc.entry : stc.exit;
}

/** Whether conformance already reports this parse error: the same parser on the same feature. */
function conformanceReports(lookup: Lookup, stc: NetStc | null, role: SimCheckRole): boolean {
    const feature = featureOf(stc, role);
    const type = feature ? lookup[feature]?.type : undefined;
    return role === 'guard' ? type === EXPRESSION_TYPE_ID : type === ACTION_TYPE_ID;
}

/**
 * The entries of a Reset, before anchoring. Pure mapping: declarations dropped, the parse
 * errors conformance already reports dropped, `node#edge` sent to the node, of the net's
 * defects only the two `else` ones kept.
 */
export function simCheckEntries(
    compileDefects: readonly CompileDefect[],
    netDefects: readonly NetDefect[],
    lookup: Lookup,
    configModelId: string | null,
): SimCheckEntry[] {
    const bag = configModelId ? lookup[configModelId]?._state : undefined;
    const stc = bag ? netStcFromRoles(withDerivedEventRole(bag, lookup)) : null;
    const out: SimCheckEntry[] = [];
    for (const d of compileDefects) {
        if (d.role === 'declaration') continue;
        const role: SimCheckRole = d.role === 'guard' ? 'guard' : !d.site || d.site.role === 'transition' ? 'action' : d.site.role;
        if (d.reason === 'parse-error' && conformanceReports(lookup, stc, role)) continue;
        out.push({
            element: (d.site?.element ?? d.element).split('#')[0],
            role,
            title: `${ROLE_TITLE[role]}: ${shortOf(d)}`,
            description: `${d.detail}${d.source === '' ? '' : ` [${d.source}]`}`,
        });
    }
    for (const d of netDefects) {
        if (d.code !== 'else-twice' && d.code !== 'else-position') continue;
        out.push({ element: d.element.split('#')[0], role: 'guard', title: `Guard: ${d.message}`, description: d.message });
    }
    return out;
}

/**
 * The body of the producer's effect, exported for the test as `reconcileDuplicateProblems`
 * is: run `startRun` on the lookup, register the entries under the DObject and the resolved
 * vertex, mark resolved the entries of this model it no longer wants. A refused run, or one
 * that throws, publishes nothing and so revokes everything the model owns (R-SIM-17: no STC,
 * no contextual check).
 *
 * @returns how many entries were registered, both anchors counted.
 */
export function reconcileSimCheckProblems(
    lookup: Lookup,
    modelId: string,
    projectId: string,
    build: ContextBuilder,
    resolveVertex?: VertexResolver,
): number {
    const configModelId = configModelOf(lookup, modelId);
    let entries: SimCheckEntry[] = [];
    try {
        const started = startRun(lookup, modelId, configModelId, projectId, build);
        if (started.kind === 'started') {
            entries = simCheckEntries(started.compileDefects ?? [], started.run.net.defects, lookup, configModelId);
        }
    } catch {
        // `startRun` rethrows anything but a snapshot error; for a background producer that
        // is a refused run: the panel's Reset shows the error when the user presses it.
        entries = [];
    }

    const desired = new Set<string>();
    const ordinal = new Map<string, number>();
    const register = (nodeId: string, e: SimCheckEntry, n: number): void => {
        const id = simCheckProblemId(nodeId, e.role, n);
        desired.add(id);
        registerProblem({
            id,
            nodeId,
            kind: SIM_CHECK_KIND,
            // A defective guard takes its transition out of the candidates (R-SIM-17), a
            // defective action halts the run when it fires (R-SIM-70): both are errors.
            severity: 'error',
            title: e.title,
            description: e.description,
            relatedNodeIds: [],
            ownerModelId: modelId,
            createdAt: Date.now(),
        });
    };
    for (const e of entries) {
        const key = `${e.element}\u0000${e.role}`;
        const n = ordinal.get(key) ?? 0;
        ordinal.set(key, n + 1);
        register(e.element, e, n);
        const vertexId = resolveVertex?.(e.element) ?? null;
        if (vertexId && vertexId !== e.element) register(vertexId, e, n);
    }

    for (const id of getProblemIdsOwnedBy(SIM_CHECK_KIND, modelId)) {
        if (!desired.has(id)) markResolved(id);
    }
    return desired.size;
}

/**
 * Mark resolved every entry of a model, with no run: the model no longer binds a guard or
 * action role (its signature went to `''`), so nothing is checked and nothing stands.
 */
export function resolveSimCheckProblems(ownerModelId: string): void {
    for (const id of getProblemIdsOwnedBy(SIM_CHECK_KIND, ownerModelId)) markResolved(id);
}

/** Remove every entry of a model outright, with no resolved transient: the editor closed. */
export function clearSimCheckProblems(ownerModelId: string): void {
    for (const id of getProblemIdsOwnedBy(SIM_CHECK_KIND, ownerModelId)) clearProblem(id);
}
