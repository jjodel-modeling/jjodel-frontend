/**
 * simCanvasState: what the canvas reads of a run, per node (S15, slice A1,
 * P-2026-09-27-1647; ratified 2026-09-27, C-2026-09-27-1437).
 *
 * Pure: no React, no store. The run-state singleton (simRunState.ts) calls it
 * per object; the node overlay (SimNodeRunState.tsx) paints what it returns.
 * The IR interpreter is not involved (R-SIM-3 pattern, R-SIM-4 untouched):
 * every node gets the same overlay whichever branch of ObjectNode paints it.
 *
 * Three readings of one committed configuration:
 * - the tokens of every place of the net, 0 included;
 * - the semantic σ of the element, stored then derived; the presentation
 *   space stays out, as it does in the panel's marking line (simBridge.ts);
 * - the elements a candidate transition was compiled from (`origin`), for ε
 *   and every event of the alphabet, while the run can move.
 *
 * Slice A2 adds a fourth, which is not a reading of the configuration: the
 * elements of the transitions the panel's open choice list offers.
 *
 * P-2026-10-03-0040 (R-SIM-102, R-SIM-107, R-SIM-109) adds, for the face and
 * the canvas that Lane C draws: the presentation rows of an element, apart from
 * σ; the nuXmv kind of every row; and, given the σ before the step that led to
 * the configuration, the values that step changed. `sigma` keeps its meaning,
 * so the overlay paints what it painted.
 */

import { candidates, presentationOf, terminated, tokens } from '../../../model/simulation/netStep';
import { netStcFromRoles } from '../../../model/simulation/netCompile';
import type { SimState, SimValue, StateAttributeDecl } from '../../../model/simulation/netTypes';
import type { SimRun } from './simRunState';

/** The part of a run the canvas reads. */
export type SimCanvasRun = Pick<SimRun, 'net' | 'config' | 'guards' | 'alphabet' | 'halt' | 'inputs'>;

/** The kind of a state attribute, named as nuXmv names it (R-SIM-102): stored, derived, input. */
export type SimStateKind = 'VAR' | 'DEFINE' | 'IVAR';

/**
 * R-SIM-102: an input is `IVAR` (asked at the press that reads it, never in σ), a
 * derived attribute `DEFINE` (never assigned), any other `VAR`. The order of
 * `declarationForm` (simInputs.ts), which the dialogs read from the rows.
 */
export function stateKindOf(decl: StateAttributeDecl): SimStateKind {
    return decl.input === true ? 'IVAR' : decl.equation !== undefined ? 'DEFINE' : 'VAR';
}

/** One attribute of an element in one space of σ, as text. */
export interface SimSigmaRow {
    readonly attr: string;
    readonly value: string;
    /** R-SIM-102: the kind of the declaration the run holds for the element; absent where none is declared. */
    readonly kind?: SimStateKind;
    /**
     * R-SIM-102, R-SIM-107: the value before the step that led to this configuration, as text, when that
     * step changed it; `null` when the element had no value before. Absent on an unchanged value, and on
     * every row when the reader gave no σ before (Reset).
     */
    readonly before?: string | null;
}

/** What one node shows of a run. */
export interface SimNodeState {
    /** The model whose run knows the element. */
    readonly modelId: string;
    /** The element's tokens when it is a place of the net, 0 included; `null` otherwise. */
    readonly tokens: number | null;
    /** The element's semantic σ, sorted by attribute. */
    readonly sigma: readonly SimSigmaRow[];
    /** A candidate transition of some input was compiled from the element. */
    readonly enabled: boolean;
    /** R-SIM-109: the element's presentation state (`node.[x]`), stored then derived, sorted; never in `sigma`. */
    readonly presentation?: readonly SimSigmaRow[];
}

/**
 * Per run record: a commit replaces the record (simRunState.ts), so a cache
 * keyed on it can never outlive the configuration it was computed from.
 */
const enabledCache = new WeakMap<SimCanvasRun, ReadonlySet<string>>();

/**
 * The elements the candidate transitions of ε and of every event were compiled
 * from. Empty on a halted run: `candidates` does not read the halt, the panel
 * gates on the status, and so must the canvas. A terminated configuration has
 * no candidate by definition (R-SIM-27).
 *
 * A transition waiting for an input counts too (R-SIM-88): its guards read no
 * value until the press asks it, so `candidates` never lists it. The rule is
 * `inputAsks`' (simBridge.ts), the one `runStatus` keeps a run Running by: an
 * input the run can give accepts it, its preset is marked, no inhibitor blocks
 * it, and its guards or actions read an input.
 */
export function enabledElements(run: SimCanvasRun): ReadonlySet<string> {
    const cached = enabledCache.get(run);
    if (cached) return cached;
    const out = new Set<string>();
    if (run.halt === null) {
        const byId = new Map(run.net.transitions.map(t => [t.id, t]));
        for (const event of [null, ...run.alphabet]) {
            const cs = candidates(run.net, { state: run.config.state, event }, run.guards);
            for (const c of cs.candidates) for (const element of byId.get(c.transition)?.origin ?? []) out.add(element);
        }
        const state = run.config.state;
        if (run.inputs && !terminated(run.net, state)) {
            for (const t of run.net.transitions) {
                if (!(run.inputs.get(t.id)?.length)) continue;
                if (t.triggers.length > 0 && !t.triggers.some(e => run.alphabet.includes(e))) continue;
                if (!t.preset.every(a => tokens(state, a.place) >= a.weight)) continue;
                if (t.inhibitors.some(a => tokens(state, a.place) >= a.weight)) continue;
                for (const element of t.origin) out.add(element);
            }
        }
    }
    enabledCache.set(run, out);
    return out;
}

/**
 * The elements the transitions of an open choice list were compiled from
 * (slice A2, P-2026-09-27-2324): the same `origin` mapping as the enabled set,
 * over the listed transitions only. An id the net does not know marks nothing.
 */
export function choiceElements(net: SimCanvasRun['net'], transitions: readonly string[]): ReadonlySet<string> {
    const listed = new Set(transitions);
    const out = new Set<string>();
    for (const t of net.transitions) if (listed.has(t.id)) for (const element of t.origin) out.add(element);
    return out;
}

/** An element's value of one space of σ, stored then derived, as the engine reads it (`stateAccess`, `presentationOf`). */
export function stateValueOf(state: SimState, space: 'semantic' | 'presentation', element: string, attr: string): SimValue | undefined {
    return space === 'presentation'
        ? presentationOf(state, element, attr)
        : state.attrs.get(element)?.get(attr) ?? state.derived?.attrs.get(element)?.get(attr);
}

/**
 * The element's attributes of one σ map, `[]` when it has none: the kind from
 * the net's declarations, and `before` where `prev`, the σ before the step, holds
 * another value of the same space.
 */
function rowsOf(
    space: SimState['attrs'] | undefined, element: string, run: SimCanvasRun, presentation: boolean, prev?: SimState | null,
): SimSigmaRow[] {
    const values = space?.get(element);
    if (!values) return [];
    const declared = run.net.declared.get(element);
    return [...values].map(([attr, value]: [string, SimValue]) => {
        const decl = declared?.get(attr);
        const old = prev ? stateValueOf(prev, presentation ? 'presentation' : 'semantic', element, attr) : value;
        return {
            attr, value: String(value),
            ...(decl ? { kind: stateKindOf(decl) } : {}),
            ...(old !== value ? { before: old === undefined ? null : String(old) } : {}),
        };
    });
}

const byAttr = (a: SimSigmaRow, b: SimSigmaRow) => a.attr.localeCompare(b.attr);

/**
 * What the node of `objectId` shows of `run`: `null` when the run does not know
 * the element (not a place, not the origin of a candidate, no σ, no presentation).
 * The model's globals are keyed on the model id, which is never a node, so they
 * stay in the panel. `prev` is the σ before the step that led to the run's
 * configuration: given, a row that step changed says so (`before`); a value the
 * step removed has no row.
 */
export function nodeStateOf(run: SimCanvasRun, objectId: string, prev?: SimState | null): SimNodeState | null {
    const state = run.config.state;
    const isPlace = run.net.places.has(objectId);
    const enabled = enabledElements(run).has(objectId);
    const sigma = [...rowsOf(state.attrs, objectId, run, false, prev), ...rowsOf(state.derived?.attrs, objectId, run, false, prev)].sort(byAttr);
    const presentation = [
        ...rowsOf(state.presentation, objectId, run, true, prev), ...rowsOf(state.derived?.presentation, objectId, run, true, prev),
    ].sort(byAttr);
    if (!isPlace && !enabled && sigma.length === 0 && presentation.length === 0) return null;
    return { modelId: run.net.modelId, tokens: isPlace ? tokens(state, objectId) : null, sigma, enabled, presentation };
}

/**
 * The feature of the initial marking (R-SIM-9, `simInitialMarking`) of the
 * model's metamodel, read from the same bag the run was started from (the
 * panel's `configModelId`, the model's `instanceof`). `null` when the roles
 * cannot make a net.
 */
export function initialMarkingFeature(lookup: Record<string, any>, modelId: string): string | null {
    const metamodel = lookup[modelId]?.instanceof;
    const bag = typeof metamodel === 'string' ? lookup[metamodel]?._state : undefined;
    return netStcFromRoles(bag)?.initialMarking ?? null;
}

/**
 * True when the row of `rowId` shows the initial marking: a slot whose value
 * instantiates `feature`, or a lazy placeholder, whose id is the feature's own.
 */
export function isInitialMarkingRow(lookup: Record<string, any>, rowId: string, feature: string | null): boolean {
    if (feature === null) return false;
    return rowId === feature || lookup[rowId]?.instanceof === feature;
}
