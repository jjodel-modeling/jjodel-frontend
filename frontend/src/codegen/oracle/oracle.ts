/**
 * oracle — the generated program against the simulator, step by step (slice S6, P-2026-10-10-2029; R-GEN-11,
 * R-GEN-15, spec §8, discovery §G).
 *
 * Differential testing between an interpreter and a compiler: the simulator is the reference semantics. A scenario
 * (R-SIM-139) is replayed by the simulator's core from Reset and, as the same `(event, selector, inputs)` sequence,
 * by the generated program, which exports `initial()`, `step(state, event, selector, inputs)` and `observe(state)`.
 * At step 0 (the initial state) and after every step the oracle compares the step's `kind` and `observe(next)`
 * with the same projection of the simulator's configuration (`observeSim`, observe.ts), and reports the first
 * divergence: its step, what differs, the transition the simulator fired there and, given the generation's map, the
 * first fragment whose origin is that transition. The scenario's `expect` is not read here: it is a predicate on the
 * final configuration, the simulator's own final check, and defines no equality (R-GEN-11, amending R-GEN-8).
 *
 * The simulator's side is the minimal replay of `configAt` (components/editor-v2/sim/simRunState.ts), rebuilt from
 * `netStep.step` over the run `compileModelRun` compiles (target/js/access.ts) and the core's oracle builders:
 * `configAt`, `withInputs` and the bridge's guard oracle live under `components/`, which this module does not
 * import; `withInputs` and `makeGuardOracle` are copied below, reduced.
 *
 * The program's side is one run of the runner (runner.ts): the module text with a driver appended that imports the
 * module itself (`import.meta.url`), calls `initial`, then `step` and `observe` per scenario step, and returns the
 * trace; a throw ends the trace with an `error` step. The runner's calls take fixed arguments, so the chaining of the
 * states happens in the driver, inside the worker.
 *
 * A hook for the probes, `window.__jjodelOracle`, is installed when this module loads with the experimental setting
 * on (setting.ts); it loads only with the code panel (the lazy chunk, R-GEN-2). No button calls it in this slice.
 *
 * Pure but for the hook: the simulator's core, the engine, the target profile and the runner.
 */

import type { JjelValue } from '../../jjel';
import { makeActionOracle } from '../../model/simulation/actionEvaluator';
import { buildGuardContext, toJjelStateAccess } from '../../model/simulation/guardContext';
import type { SimSnapshot } from '../../model/simulation/guardContext';
import { evaluateGuard } from '../../model/simulation/guardEvaluator';
import type { CompiledGuard, GuardOutcome } from '../../model/simulation/guardEvaluator';
import { step as coreStep } from '../../model/simulation/netStep';
import type {
    ActionOracle, CompiledNet, GuardOracle, NetConfiguration, SimStateAccess, SimValue,
} from '../../model/simulation/netTypes';
import { RUN_SCENARIOS_KEY, decodeScenarios } from '../../model/simulation/scenarioCodec';
import type { ScenarioInput, ScenarioRecord, ScenarioStepKind } from '../../model/simulation/scenarioCodec';
import { generate } from '../engine/generate';
import { readModelTemplates } from '../engine/templateCodec';
import type { Origin, TextMapEntry } from '../engine/text';
import { runInWorker } from '../runner/runner';
import type { RunRequest, RunResponse } from '../runner/protocol';
import { getCodegenEnabled } from '../setting';
import { compileModelRun } from '../target/js/access';
import type { ModelRun } from '../target/js/access';
import { observeSim } from './observe';
import type { Observation } from './observe';

type Lookup = Record<string, any>;

/** One step of a trace: step 0 is `initial`; a program that threw ends its trace with `error`. */
export interface TraceStep {
    readonly kind: ScenarioStepKind | 'inadmissible' | 'initial' | 'error';
    readonly observed?: Observation;
    /** The simulator's side: the transition the scenario fired there, `null` for none. */
    readonly transition?: string | null;
    /** The simulator's side: the candidates the step offered, in compile order. */
    readonly offered?: readonly string[];
    /** The program's side: its `reason`, or the message of what it threw. */
    readonly reason?: string;
    readonly message?: string;
}

/** The generated text a divergence points at: a range of the output and its fragment's origin. */
export interface OracleOrigin {
    readonly line: number;
    readonly start: number;
    readonly end: number;
    readonly origin: Origin;
}

/**
 * What differs first. `kind`: the step kinds; `observe`: the observations, at `path` (`marking.<place>`,
 * `attrs.<element>.<attr>`, `derived.<element>.<attr>`, an absent value `null`); `error`: the program threw;
 * `length`: the program's trace stops before the simulator's.
 */
export type Divergence = 'kind' | 'observe' | 'error' | 'length';

export type OracleVerdict =
    | { readonly ok: true }
    | {
        readonly ok: false;
        readonly step: number;
        readonly kind: Divergence;
        readonly expected: unknown;
        readonly actual: unknown;
        readonly path?: string;
        readonly transitionId?: string;
        readonly origin?: OracleOrigin;
    };

/** Why no comparison could be made: the model has no run, the simulator refuses the scenario, the program did not run. */
export interface OracleFailure {
    readonly ok: false;
    readonly kind: 'model' | 'scenario' | 'run';
    readonly step: number;
    readonly message: string;
    /** For `run`: the line of the generated text the runner placed the error on. */
    readonly line?: number | null;
}

export type OracleResult = (OracleVerdict | OracleFailure) & {
    readonly sim: readonly TraceStep[];
    readonly gen: readonly TraceStep[];
};

// ── the comparison ───────────────────────────────────────────────────────────

const isPlainObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/** The first path where `a` and `b` differ, keys in sorted order at every level; `null` when they are equal. */
function firstDifference(a: unknown, b: unknown, path: string): { path: string; expected: unknown; actual: unknown } | null {
    if (isPlainObject(a) && isPlainObject(b)) {
        const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
        for (const k of keys) {
            const d = firstDifference(
                Object.prototype.hasOwnProperty.call(a, k) ? a[k] : undefined,
                Object.prototype.hasOwnProperty.call(b, k) ? b[k] : undefined,
                path === '' ? k : `${path}.${k}`,
            );
            if (d) return d;
        }
        return null;
    }
    if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
        for (let i = 0; i < a.length; i++) {
            const d = firstDifference(a[i], b[i], `${path}.${i}`);
            if (d) return d;
        }
        return null;
    }
    if (Object.is(a, b)) return null;
    return { path, expected: a === undefined ? null : a, actual: b === undefined ? null : b };
}

/** The first range of the text whose origin is `elementId`: a model fragment, else a computed one that read it. */
function originOf(map: readonly TextMapEntry[] | undefined, elementId: string): OracleOrigin | undefined {
    if (!map) return undefined;
    const at = (e: TextMapEntry): OracleOrigin => ({ line: e.line, start: e.start, end: e.end, origin: e.origin });
    const model = map.find(e => e.end > e.start && e.origin.kind === 'model' && e.origin.elementId === elementId);
    if (model) return at(model);
    const opaque = map.find(e => e.end > e.start && e.origin.kind === 'opaque' && e.origin.reads.some(r => r.elementId === elementId));
    return opaque ? at(opaque) : undefined;
}

/**
 * The simulator's trace against the program's, step 0 the initial state: the first step whose kind or observation
 * differs, with the transition the simulator fired there and, given `map`, the text that transition generated.
 */
export function compareTraces(simSteps: readonly TraceStep[], genSteps: readonly TraceStep[], map?: readonly TextMapEntry[]): OracleVerdict {
    for (let k = 0; k < simSteps.length; k++) {
        const s = simSteps[k];
        const g = genSteps[k];
        const transitionId = typeof s.transition === 'string' ? s.transition : undefined;
        const origin = transitionId !== undefined ? originOf(map, transitionId) : undefined;
        const where = { ...(transitionId !== undefined ? { transitionId } : {}), ...(origin ? { origin } : {}) };
        if (g === undefined) return { ok: false, step: k, kind: 'length', expected: s.kind, actual: null, ...where };
        if (g.kind === 'error') return { ok: false, step: k, kind: 'error', expected: s.kind, actual: g.message ?? '', ...where };
        if (g.kind !== s.kind) return { ok: false, step: k, kind: 'kind', expected: s.kind, actual: g.kind, ...where };
        const d = firstDifference(s.observed ?? null, g.observed ?? null, '');
        if (d) return { ok: false, step: k, kind: 'observe', path: d.path, expected: d.expected, actual: d.actual, ...where };
    }
    if (genSteps.length > simSteps.length) {
        return { ok: false, step: simSteps.length, kind: 'length', expected: null, actual: genSteps[simSteps.length].kind };
    }
    return { ok: true };
}

// ── the simulator's side ─────────────────────────────────────────────────────

/** Copy of simBridge.ts `makeGuardOracle`: a site's guards conjoined, a defect winning, then false; none is true. */
function guardOracle(snapshot: SimSnapshot, guards: ReadonlyMap<string, readonly CompiledGuard[]>, places: ReadonlySet<string>): GuardOracle {
    return (site, event, state) => {
        const list = guards.get(site) ?? [];
        if (list.length === 0) return { kind: 'true' };
        const ctx = buildGuardContext(snapshot, { transitionId: site }, { event }, toJjelStateAccess(state, places));
        let result: GuardOutcome = { kind: 'true' };
        for (const g of list) {
            const outcome = evaluateGuard(g, ctx);
            if (outcome.kind === 'defect') return outcome;
            if (outcome.kind === 'false') result = outcome;
        }
        return result;
    };
}

/** The oracle of a run with no action role bound (R-SIM-69): a step moves the marking only. */
const NO_ACTIONS: ActionOracle = () => ({ kind: 'ok', assignments: [] });

/** Copy of simRunState.ts `withInputs`: the oracles reading the values given to the declared inputs, σ for the rest. */
function withInputs(net: CompiledNet, guards: GuardOracle, actions: ActionOracle, values: readonly ScenarioInput[]): { guards: GuardOracle; actions: ActionOracle } {
    const given = new Map<string, SimValue>();
    for (const v of values) {
        if (net.declared.get(v.element)?.get(v.attr)?.input === true) given.set(`${v.element}\u0000${v.attr}`, v.value);
    }
    if (given.size === 0) return { guards, actions };
    const over = (s: SimStateAccess): SimStateAccess => ({
        ...s,
        read: (element, attr) => {
            const key = `${element}\u0000${attr}`;
            return given.has(key) ? given.get(key) : s.read(element, attr);
        },
    });
    return { guards: (site, e, s) => guards(site, e, over(s)), actions: (site, e, s) => actions(site, e, over(s)) };
}

/**
 * The scenario replayed by the simulator's core from the initial σ, as `configAt` replays a trace: per step its
 * event, selector and inputs; the trace of observations, or the first step the core refuses or takes as another
 * kind than the scenario recorded.
 */
export function simulate(run: ModelRun, scenario: ScenarioRecord): { trace: TraceStep[]; failure: { step: number; message: string } | null } {
    const guards = guardOracle(run.snapshot, run.guards, run.net.places);
    const actions = run.actionRoles ? makeActionOracle(run.snapshot, run.net, run.actions) : NO_ACTIONS;
    let cfg: NetConfiguration = { state: run.net.initial, event: null };
    const trace: TraceStep[] = [{ kind: 'initial', observed: observeSim(cfg.state) }];
    for (let i = 0; i < scenario.steps.length; i++) {
        const s = scenario.steps[i];
        const given = withInputs(run.net, guards, actions, s.inputs ?? []);
        const o = coreStep(run.net, { state: cfg.state, event: s.event }, s.selector, given.guards, given.actions, run.derived);
        if (o.kind === 'inadmissible') {
            return { trace, failure: { step: i + 1, message: `the simulator refuses step ${i + 1}: ${s.selector === null ? 'a candidate exists where the scenario had none' : `${s.selector} is not a candidate`}` } };
        }
        if (o.kind !== s.kind) {
            return { trace, failure: { step: i + 1, message: `the simulator's step ${i + 1} is ${o.kind}, the scenario recorded ${s.kind}` } };
        }
        trace.push({ kind: o.kind, observed: observeSim(o.next.state), transition: s.selector, offered: [...o.label.candidates] });
        cfg = o.next;
    }
    return { trace, failure: null };
}

// ── the program's side ───────────────────────────────────────────────────────

/** The export the driver adds to the generated module: not a name the identifier policy hands out (no `$`, two `_`). */
export const ORACLE_DRIVER = '__jjodelOracleTrace';

/** The oracle's run: the worker's load time counts against it (runner.ts), so it is longer than a «Run». */
export const ORACLE_TIMEOUT_MS = 10000;

/** The driver, appended after the generated text: its lines come after the program's, which keep their numbers. */
const DRIVER = `

// ── The oracle's driver (codegen/oracle/oracle.ts), appended for its run; not part of the generated program. ──
export async function ${ORACLE_DRIVER}(steps) {
  const program = await import(import.meta.url);
  const message = e => String(e !== null && typeof e === 'object' && 'message' in e ? e.message : e);
  const out = [];
  let state;
  try {
    state = program.initial();
    out.push({ kind: 'initial', observed: program.observe(state) });
  } catch (e) {
    out.push({ kind: 'error', message: message(e) });
    return out;
  }
  for (const s of steps) {
    try {
      const r = program.step(state, s.event, s.selector, s.inputs);
      const observed = program.observe(r.next);
      out.push(r.reason === undefined ? { kind: r.kind, observed } : { kind: r.kind, observed, reason: String(r.reason) });
      state = r.next;
    } catch (e) {
      out.push({ kind: 'error', message: message(e) });
      return out;
    }
  }
  return out;
}
`;

export interface OracleInput {
    readonly lookup: Lookup;
    readonly modelId: string;
    /** The record `buildEvalContext` returns for the model (its objects are frozen, as at Reset). */
    readonly globals: Record<string, JjelValue>;
    readonly scenario: ScenarioRecord;
    /** The generated program. */
    readonly code: string;
    /** The generation's map, for the origin of a divergence. */
    readonly map?: readonly TextMapEntry[];
    /** The runner: `runInWorker` unless given (the tests pass the in-process path). */
    readonly run?: (request: RunRequest) => Promise<RunResponse>;
    readonly timeoutMs?: number;
}

/** The scenario through the simulator and through the program, compared step by step. Never rejects. */
export async function runOracle(input: OracleInput): Promise<OracleResult> {
    const compiled = compileModelRun(input.lookup, input.modelId, input.globals);
    if (compiled.kind !== 'ok') return { ok: false, kind: 'model', step: 0, message: compiled.reason, sim: [], gen: [] };
    const sim = simulate(compiled.run, input.scenario);
    if (sim.failure) return { ok: false, kind: 'scenario', ...sim.failure, sim: sim.trace, gen: [] };
    const steps = input.scenario.steps.map(s => ({ event: s.event, selector: s.selector, inputs: s.inputs ?? [] }));
    const run = input.run ?? (request => runInWorker(request));
    const response = await run({ code: input.code + DRIVER, calls: [{ fn: ORACLE_DRIVER, args: [steps] }], timeoutMs: input.timeoutMs ?? ORACLE_TIMEOUT_MS });
    if (!response.ok) {
        return { ok: false, kind: 'run', step: 0, message: `${response.error.kind}: ${response.error.message}`, line: response.error.line, sim: sim.trace, gen: [] };
    }
    const gen = (Array.isArray(response.results[0]) ? response.results[0] : []) as TraceStep[];
    return { ...compareTraces(sim.trace, gen, input.map), sim: sim.trace, gen };
}

// ── the probes' hook ─────────────────────────────────────────────────────────

export interface OracleHookOptions {
    readonly modelId: string;
    /** A scenario, or the name of one stored on the model (`runScenarios`); the first stored one when absent. */
    readonly scenario?: ScenarioRecord | string;
    /** The entry template, `main` by default. */
    readonly entry?: string;
    /** A change to the generated text before it runs: the mutation bench of the probes. */
    readonly mutate?: (code: string) => string;
    readonly timeoutMs?: number;
}

export type OracleHookResult =
    | (OracleResult & { readonly code: string })
    | { readonly ok: false; readonly kind: 'generate' | 'no-scenario'; readonly message: string };

/**
 * Generates the model's program with its metamodel's templates, over the record the code panel passes to `generate`
 * (`buildEvalContext`, CodePanel.tsx), and runs the oracle on it in a worker.
 */
async function hookRun(options: OracleHookOptions): Promise<OracleHookResult> {
    const [{ store, DUser, LPointerTargetable }, { buildEvalContext }] = await Promise.all([import('../../joiner'), import('../../jjscript')]);
    const lookup: Lookup = (store.getState() as any).idlookup ?? {};
    const { modelId } = options;
    let projectId = '';
    try {
        projectId = (LPointerTargetable.fromPointer(DUser.current as any) as any)?.project?.id ?? '';
    } catch {
        projectId = '';
    }
    const metamodel = lookup[modelId]?.instanceof;
    // Copy of simBridge.ts `evalContextFor`, the context the code panel and the simulator build the record from.
    const globals = () => buildEvalContext({
        projectId, modelId, level: 'M1', targetMetamodelId: typeof metamodel === 'string' && metamodel ? metamodel : undefined,
        scopeBound: true, history: [], variables: new Map(),
    } as any, { extentModelId: modelId });
    const gen = generate(globals(), lookup, modelId, readModelTemplates(lookup, modelId).templates, options.entry ?? 'main');
    if (gen.hasErrors) return { ok: false, kind: 'generate', message: gen.errors.map(e => `${e.template}:${e.line}:${e.column} ${e.message}`).join('\n') };
    let scenario: ScenarioRecord | undefined;
    if (typeof options.scenario === 'object') scenario = options.scenario;
    else {
        const raw = lookup[modelId]?._state?.[RUN_SCENARIOS_KEY];
        const stored = decodeScenarios(typeof raw === 'string' ? raw : undefined).scenarios;
        scenario = options.scenario === undefined ? stored[0] : stored.find(s => s.name === options.scenario);
    }
    if (!scenario) return { ok: false, kind: 'no-scenario', message: `No scenario ${options.scenario ?? ''} on the model.` };
    const code = options.mutate ? options.mutate(gen.code) : gen.code;
    const result = await runOracle({ lookup, modelId, globals: globals(), scenario, code, map: gen.map, ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}) });
    return { ...result, code };
}

/** `window.__jjodelOracle`: `run(options)`, for the probes; installed only with the experimental setting on. */
export function installOracleHook(): void {
    if (typeof window === 'undefined' || !getCodegenEnabled()) return;
    (window as any).__jjodelOracle = Object.freeze({ run: hookRun });
}

installOracleHook();
