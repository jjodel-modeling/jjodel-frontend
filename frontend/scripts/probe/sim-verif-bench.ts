/**
 * sim-verif-bench probe (P-2026-10-05-1655, the discovery of R-SIM-137..140: watches, step back, scenarios,
 * coverage; docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md).
 *
 * Node only: no dev server, no browser, no port. The four demo scenes are the committed fixtures
 * `fixtures/scene_*.jjodel` (byte copies of `~/jjodel-demo-exports/`), decompressed into a raw idlookup; each scene's
 * preset is applied as the panel's Apply writes it (`profileBindings`, `profilePatch`, the Bound proposal), ESM and
 * Flow B get the script's globals in the model bag (docs/demo/models_2026_simulator_demo.md §2.3, §2.4); the run is
 * started with `startRun` and every press goes through `pressInput`/`pressStep`, the panel's own functions. The JjEL
 * context is a stand-in of `buildEvalContext`'s record (the pool, unique names bound, reference slots resolved), the
 * one the 2026-10-02 state UI discovery used; it is the only part that is not the app's.
 *
 * Questions, each printed as MEAS lines and PASS/FAIL checks:
 *   S  step back: a pop of the run record (trace, kept configurations, configuration, halt) equals the record the
 *      run had one step earlier, on every step of the four paths and past the cap of 1000 kept configurations;
 *      the cost of a pop that must replay; what a Random re-draw does with and without rewinding `draws`.
 *   M  memory: the kept configurations and the trace per step, at 1000 steps, on the four scenes (--expose-gc).
 *   W  watches: `compileOutput`/`evaluateOutput` (boardOutputs.ts) as a watch's compiler and evaluator, with and
 *      without the run's snapshot; first violation or hit along each path; cost; Play under Random stopped by a
 *      watch, reproducible from the seed.
 *   C  scenarios: the trace projected to inputs, replayed from Reset with divergence checks; three tamperings;
 *      a renamed event; a final watch.
 *   V  coverage: visits and firings from each committed step's label, against the same counts recomputed from
 *      the trace; never visited and never fired elements on the demo paths.
 *   K  keys: whether a `sim*` key, `watches` or `scenarios` in the model bag moves `runSignature`.
 *
 * Run (from frontend/): npx --no-install tsx --expose-gc scripts/probe/sim-verif-bench.ts
 */
import { readFileSync } from 'node:fs';
import lz from 'async-lz-string';
import {
    collectModelObjectIds, makeNetModelView, markingLine, panelInputs, playTick, pressInput, pressStep, runBag, runSignature, runStatus, startRun,
} from '../../src/components/editor-v2/sim/simBridge.ts';
import type { ContextBuilder, InputValue } from '../../src/components/editor-v2/sim/simBridge.ts';
import {
    __resetSimRunsForTests, configAt, getSimPolicy, getSimRun, setSimPolicy, simReset, SIM_KEEP_CONFIGS,
} from '../../src/components/editor-v2/sim/simRunState.ts';
import type { SimRun, SimTraceStep } from '../../src/components/editor-v2/sim/simRunState.ts';
import { profileBindings, profilePatch } from '../../src/components/editor-v2/sim/simRoleStatus.ts';
import { sketchOfMetamodel } from '../../src/components/editor-v2/sim/metamodelSketch.ts';
import { boundEstimate } from '../../src/components/editor-v2/sim/modelMarkings.ts';
import { systemProfile } from '../../src/model/simulation/simProfiles.ts';
import { eventAlphabet, netStcFromRoles } from '../../src/model/simulation/netCompile.ts';
import { candidates, structuralInputs } from '../../src/model/simulation/netStep.ts';
import { compileOutput, evaluateOutput } from '../../src/model/simulation/boardOutputs.ts';
import type { NetConfiguration, SimState } from '../../src/model/simulation/netTypes.ts';

const decompressFromUTF16: (s: string) => Promise<string> = (lz as any).decompressFromUTF16 ?? (lz as any).default?.decompressFromUTF16;
const gc = (globalThis as any).gc as (() => void) | undefined;

type Lookup = Record<string, any>;
interface Scene { name: string; lookup: Lookup; projectId: string; mmId: string; m1Id: string }

let failures = 0;
const check = (label: string, ok: boolean, detail = ''): void => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
};
const note = (label: string, d: unknown): void => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);

async function loadScene(file: string): Promise<Scene> {
    const project = JSON.parse(readFileSync(new URL(`./fixtures/${file}`, import.meta.url), 'utf8'));
    const state = JSON.parse(await decompressFromUTF16(project.state));
    const lookup: Lookup = state.idlookup ?? state;
    return { name: file, lookup, projectId: project.id, mmId: project.metamodels[0], m1Id: project.models[0] };
}

/** A stand-in of buildEvalContext's record: the pool, unique names bound, reference slots resolved to handles. */
function recordOf(lookup: Lookup, modelId: string): ContextBuilder {
    return () => {
        const ids = collectModelObjectIds(lookup, modelId);
        const h: Record<string, any> = {};
        for (const id of ids) h[id] = { id, __type: 'Object', name: lookup[id]?.name ?? id };
        for (const id of ids) {
            for (const vid of lookup[id]?.features ?? []) {
                const v = lookup[vid];
                const feat = lookup[v?.instanceof];
                if (!feat?.name) continue;
                const vals = (v.values ?? []).map((x: any) => (typeof x === 'string' && h[x] ? h[x] : x));
                h[id][feat.name] = (feat.upperBound === 1 || feat.upperBound === undefined) && vals.length <= 1 ? (vals[0] ?? null) : vals;
            }
        }
        const rec: Record<string, any> = { instances: Object.values(h), classes: [] };
        const count = new Map<string, number>();
        for (const x of Object.values(h)) count.set(x.name, (count.get(x.name) ?? 0) + 1);
        for (const x of Object.values(h)) if (count.get(x.name) === 1) rec[x.name] = x;
        return rec;
    };
}

/** The preset as the panel's Apply writes it, with the Bound proposal; the model's globals when given. */
function configure(s: Scene, preset: string, m1Decls?: unknown[]): void {
    const mm = s.lookup[s.mmId];
    mm._state = { ...(mm._state ?? {}) };
    const profile = systemProfile(preset as any)!;
    const sketch = sketchOfMetamodel(s.lookup, s.mmId);
    const bindings = profileBindings(profile, sketch, mm._state)!;
    const classIds = Object.keys(s.lookup).filter(id => s.lookup[id]?.className === 'DClass' && !s.lookup[id].abstract);
    const first = profilePatch(profile, mm._state, bindings, s.lookup, classIds);
    if (first.kind !== 'write') throw new Error(`${s.name}: refused`);
    let bag = { ...mm._state, ...first.patch };
    const again = profilePatch(profile, mm._state, bindings, s.lookup, classIds, boundEstimate(s.lookup, s.mmId, bag));
    if (again.kind === 'write') bag = { ...mm._state, ...again.patch };
    mm._state = { ...bag, simEnabled: true };
    if (m1Decls) s.lookup[s.m1Id]._state = { simStateAttributes: JSON.stringify({ v: 1, attrs: m1Decls }) };
}

function reset(s: Scene, seed = 12345): SimRun {
    const r = startRun(s.lookup, s.m1Id, s.mmId, s.projectId, recordOf(s.lookup, s.m1Id), seed);
    if (r.kind !== 'started') throw new Error(`${s.name}: ${r.reason}`);
    simReset(s.m1Id, r.run);
    return r.run;
}

function eventId(s: Scene, label: string): string {
    const stc = netStcFromRoles(runBag(s.lookup[s.mmId]._state, s.lookup))!;
    const hit = eventAlphabet(stc, makeNetModelView(s.lookup, stc.eventIdentifier), collectModelObjectIds(s.lookup, s.m1Id)).find(e => e.label === label);
    if (!hit) throw new Error(`no event ${label}`);
    return hit.id;
}

function transitionId(s: Scene, name: string): string {
    const t = getSimRun(s.m1Id)!.net.transitions.find(x => x.origin.some(o => s.lookup[o]?.name === name));
    if (!t) throw new Error(`no transition ${name}`);
    return t.id;
}

const nameOf = (s: Scene) => (id: string): string => s.lookup[id]?.name ?? id;

/** One press; the records after each committed step are collected in `snaps` (index = steps committed). */
function press(s: Scene, event: string | null, selector: string | undefined, snaps: SimRun[] | null, values?: readonly InputValue[]): string {
    const before = getSimRun(s.m1Id)!.trace?.length ?? 0;
    const p = pressInput(s.m1Id, event, selector, s.lookup, event === null ? 'ε' : s.lookup[event]?.name ?? event, values);
    const run = getSimRun(s.m1Id)!;
    if (snaps && (run.trace?.length ?? 0) > before) snaps.push(run);
    return p.lastStep ?? (p.pending ? `pending ${p.pending.length}` : 'nothing');
}

type Path = (s: Scene, snaps: SimRun[] | null) => string[];

const PEST: Path = (s, snaps) => ['push', 'coin', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'push', 'stop'].map(e => press(s, eventId(s, e), undefined, snaps));
const PETRI: Path = (s, snaps) => [
    press(s, null, transitionId(s, 't1'), snaps), press(s, null, transitionId(s, 't3'), snaps),
    press(s, null, transitionId(s, 't2'), snaps), press(s, null, undefined, snaps),
];
const ESM: Path = (s, snaps) => ['push', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'coin', 'coin', 'coin'].map(e => press(s, eventId(s, e), undefined, snaps));
const FLOWB: Path = (s, snaps) => Array.from({ length: 6 }, () => press(s, null, undefined, snaps));

const ESM_DECLS = [
    { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
    { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, equation: 'model.[coins] >= 2' },
];
const FLOWB_DECLS = [{ name: 'count', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' }];

interface WatchDef { readonly name: string; readonly kind: 'invariant' | 'breakpoint'; readonly text: string }
interface SceneDef {
    file: string; which: string; preset: string; path: Path; decls?: unknown[];
    /** A Last step line of the script, by step (1-based): the positive control that the bench runs the subject. */
    control: { step: number; text: string };
    watches: WatchDef[];
}

const SCENES: SceneDef[] = [
    {
        file: 'scene_1_DemoPEST.jjodel', which: 'PEST', preset: 'stateMachine', path: PEST,
        control: { step: 2, text: 'coin: t1 (locked → unlocked) fired' },
        watches: [
            { name: 'oneState', kind: 'invariant', text: 'locked.[marked] or unlocked.[marked] or off.[marked]' },
            { name: 'open', kind: 'breakpoint', text: 'unlocked.[marked]' },
            { name: 'reachesOff', kind: 'breakpoint', text: 'off.[marked]' },
            { name: 'readsNode', kind: 'invariant', text: 'node.[shade] == 1' },
            { name: 'undeclared', kind: 'invariant', text: 'model.[coins] <= 3' },
            { name: 'notBoolean', kind: 'invariant', text: '1 + 1' },
            { name: 'readsEvent', kind: 'breakpoint', text: 'event == null' },
        ],
    },
    {
        file: 'scene_2_DemoPetri.jjodel', which: 'Petri', preset: 'petri', path: PETRI,
        control: { step: 4, text: 'ε: t1 (p1 → p2 ×2) fired' },
        watches: [
            { name: 'lockSafe', kind: 'invariant', text: 'lock.[tokens] <= 1' },
            { name: 'p3Reached', kind: 'breakpoint', text: 'p3.[marked]' },
            { name: 'p2Low', kind: 'invariant', text: 'p2.[tokens] < 2' },
        ],
    },
    {
        file: 'scene_3_DemoESM.jjodel', which: 'ESM', preset: 'extendedStateMachine', path: ESM, decls: ESM_DECLS,
        control: { step: 10, text: 'coin: tc (locked → locked) halted the run' },
        watches: [
            { name: 'coinsBelow3', kind: 'invariant', text: 'model.[coins] <= 2' },
            { name: 'paid', kind: 'breakpoint', text: 'model.[paid]' },
            { name: 'selfIsModel', kind: 'invariant', text: 'self.[coins] == model.[coins]' },
        ],
    },
    {
        file: 'scene_4_DemoFlowB.jjodel', which: 'FlowB', preset: 'flowchart', path: FLOWB, decls: FLOWB_DECLS,
        control: { step: 2, text: 'ε: f2 (work → d1) fired' },
        watches: [
            { name: 'countLow', kind: 'invariant', text: 'model.[count] <= 1' },
            { name: 'forked', kind: 'breakpoint', text: 'left.[marked] and right.[marked]' },
        ],
    },
];

// ── helpers over σ and run records ──────────────────────────────────────────────────────────────────────────────

const pairs = (m: ReadonlyMap<string, ReadonlyMap<string, unknown>> | undefined) => [...(m ?? [])].map(([k, v]) => [k, [...v].sort()]).sort();
function ser(st: SimState): string {
    return JSON.stringify({ m: [...st.marking].sort(), a: pairs(st.attrs), p: pairs(st.presentation), d: st.derived ? pairs(st.derived.attrs) : null });
}
const serCfg = (c: NetConfiguration | null): string => (c ? `${ser(c.state)}|${c.event}` : 'null');

/**
 * What the panel and the canvas read of a record; equal records read the same. `withKept` adds the kept list itself,
 * a cache: past the cap a pop keeps one configuration fewer, which `configAt` rebuilds by replay.
 */
function readOf(run: SimRun, withKept = true): string {
    const m = run.trace?.length ?? 0;
    const cands = [null, ...run.alphabet].map(e => candidates(run.net, { state: run.config.state, event: e }, run.guards).candidates.map(c => c.transition));
    const configs = Array.from({ length: m + 1 }, (_, n) => serCfg(configAt(run, n)));
    return JSON.stringify({
        config: serCfg(run.config), halt: run.halt, trace: run.trace, ...(withKept ? { kept: (run.keptConfigs ?? []).map(serCfg) } : {}), draws: run.draws,
        status: runStatus(run), cands, configs, inputs: panelInputs(runStatus(run), structuralInputs(run.net, run.config.state)).epsilon,
    });
}

/**
 * The step-back primitive the report proposes: the record one step earlier, from the record alone. The configuration
 * is `configAt(m - 1)` (kept, or the initial σ, or a replay); the last kept configuration and trace entry go; a halt
 * goes with the step that set it; `draws` is kept or rewound by one for a drawn step, as `rewind` says.
 */
function popRun(run: SimRun, rewind: boolean): SimRun | null {
    const trace = run.trace ?? [];
    const m = trace.length;
    if (m === 0) return null;
    const config = configAt(run, m - 1);
    if (!config) return null;
    const last = trace[m - 1];
    return {
        ...run, config, halt: last.kind === 'halted' ? null : run.halt, trace: trace.slice(0, -1),
        keptConfigs: (run.keptConfigs ?? []).slice(0, -1),
        draws: rewind && last.origin === 'random' ? (run.draws ?? 0) - 1 : run.draws,
    };
}

function heap(): number { gc!(); gc!(); return process.memoryUsage().heapUsed; }

// ── W: a watch, compiled and evaluated as a board output is, with a boolean check ───────────────────────────────

type WatchReading = { kind: 'defect'; detail: string } | { kind: 'value'; value: boolean };
function readWatch(run: SimRun, s: Scene, text: string, state: SimState): WatchReading {
    const c = compileOutput(text, { net: run.net, snapshot: run.snapshot, nameOf: nameOf(s) });
    if (c.defect) return { kind: 'defect', detail: `${c.defect.code}: ${c.defect.short}` };
    const r = evaluateOutput(c, run.snapshot!, run.net, state);
    if (r.kind === 'defect') return { kind: 'defect', detail: `evaluation: ${r.detail}` };
    return typeof r.value === 'boolean' ? { kind: 'value', value: r.value } : { kind: 'defect', detail: `non-boolean: ${typeof r.value}` };
}
const hits = (w: WatchDef, r: WatchReading): boolean => r.kind === 'value' && (w.kind === 'invariant' ? !r.value : r.value);

// ── C: a scenario, the trace projected to the inputs, replayed with divergence checks ───────────────────────────

interface ScenarioStep { event: string | null; selector: string | null; kind: SimTraceStep['kind']; inputs?: readonly InputValue[] }
const scenarioOf = (run: SimRun): ScenarioStep[] =>
    (run.trace ?? []).map(t => ({ event: t.event, selector: t.selector, kind: t.kind, ...(t.inputs ? { inputs: t.inputs } : {}) }));

/** Replays from a fresh Reset; stops at the first step that diverges and says why. */
function replay(s: Scene, steps: readonly ScenarioStep[]): { ok: boolean; at: number; why: string; run: SimRun } {
    reset(s);
    for (let i = 0; i < steps.length; i++) {
        const st = steps[i];
        const run = getSimRun(s.m1Id)!;
        const status = runStatus(run);
        if (status !== 'Running') return { ok: false, at: i + 1, why: `the run is ${status}`, run };
        if (st.event !== null && !run.alphabet.includes(st.event)) return { ok: false, at: i + 1, why: 'event not in the model', run };
        const on = panelInputs(status, structuralInputs(run.net, run.config.state));
        if (st.event === null ? !on.epsilon : !on.events.has(st.event)) return { ok: false, at: i + 1, why: 'input not enabled', run };
        const cs = candidates(run.net, { state: run.config.state, event: st.event }, run.guards).candidates.map(c => c.transition);
        if (st.selector !== null && !cs.includes(st.selector)) return { ok: false, at: i + 1, why: 'choice not offered', run };
        if (st.selector === null && cs.length > 0) return { ok: false, at: i + 1, why: 'a candidate where none was', run };
        press(s, st.event, st.selector ?? undefined, null, st.inputs);
        const after = getSimRun(s.m1Id)!;
        const got = after.trace?.[i]?.kind;
        if (got !== st.kind) return { ok: false, at: i + 1, why: `step was ${got ?? 'not committed'}, not ${st.kind}`, run: after };
    }
    return { ok: true, at: steps.length, why: '', run: getSimRun(s.m1Id)! };
}

// ── V: coverage from the labels ─────────────────────────────────────────────────────────────────────────────────

interface Coverage { visits: Map<string, number>; firings: Map<string, number> }
const bump = (m: Map<string, number>, k: string, by = 1) => m.set(k, (m.get(k) ?? 0) + by);
function coverageOf(run: SimRun, into: Coverage = { visits: new Map(), firings: new Map() }): Coverage {
    for (const [place, n] of run.net.initial.marking) if (n > 0) bump(into.visits, place);
    for (const t of run.trace ?? []) {
        if (t.kind !== 'fired' || t.selector === null) continue;
        bump(into.firings, t.selector);
        for (const a of run.net.transitions.find(x => x.id === t.selector)?.postset ?? []) bump(into.visits, a.place);
    }
    return into;
}

// ── the scenes ──────────────────────────────────────────────────────────────────────────────────────────────────

for (const def of SCENES) {
    __resetSimRunsForTests();
    const s = await loadScene(def.file);
    const ownBag = Object.keys(s.lookup[s.m1Id]?._state ?? {});
    note(`${def.which} model bag keys in the export`, ownBag);
    check(`${def.which} K: the export's model bag has no watches or scenarios key`, !ownBag.includes('watches') && !ownBag.includes('scenarios'));
    configure(s, def.preset, def.decls);
    const run0 = reset(s);
    const snaps: SimRun[] = [run0];
    const lines = def.path(s, snaps);
    check(`${def.which} control: Last step ${def.control.step}`, lines[def.control.step - 1] === def.control.text, `«${lines[def.control.step - 1]}»`);
    const live = getSimRun(s.m1Id)!;
    note(`${def.which} path`, { steps: live.trace?.length, status: runStatus(live), marking: markingLine(live.config.state, live.net, s.lookup).line });

    // S: every pop equals the record one step earlier.
    let equal = 0;
    for (let m = snaps.length - 1; m >= 1; m--) {
        const popped = popRun(snaps[m], false);
        if (popped && readOf(popped) === readOf(snaps[m - 1])) equal++;
        else console.log(`  pop at ${m} differs`);
    }
    check(`${def.which} S: pop equals the record one step earlier`, equal === snaps.length - 1, `${equal}/${snaps.length - 1}`);
    // S: Reset-to-Running from a stopped status, and the same input again gives the same record (redo, no draw).
    const lastSnap = snaps[snaps.length - 1];
    const back = popRun(lastSnap, false)!;
    simReset(s.m1Id, back);
    note(`${def.which} S: status before and after one pop`, `${runStatus(lastSnap)} → ${runStatus(back)}`);
    const t = lastSnap.trace![lastSnap.trace!.length - 1];
    press(s, t.event, t.selector ?? undefined, null, t.inputs);
    const redo = getSimRun(s.m1Id)!;
    check(`${def.which} S: pop then the same input gives the record back`, readOf({ ...redo, seed: lastSnap.seed }) === readOf(lastSnap));

    // W: compile before Reset (no snapshot) and with the run's; evaluate on every configuration of the path.
    const noSnap: SimRun = { ...live, snapshot: undefined };
    for (const w of def.watches) {
        const pre = compileOutput(w.text, { net: noSnap.net, nameOf: nameOf(s) });
        const timeline = Array.from({ length: (live.trace?.length ?? 0) + 1 }, (_, n) => readWatch(live, s, w.text, configAt(live, n)!.state));
        const first = timeline.findIndex(r => hits(w, r));
        const r0 = timeline.find(r => r.kind === 'defect');
        note(`${def.which} W ${w.kind} ${w.name}`, {
            text: w.text, beforeReset: pre.defect ? `${pre.defect.code}: ${pre.defect.short}` : 'ok',
            atRun: r0 ? (r0 as any).detail : 'ok', values: timeline.map(r => (r.kind === 'value' ? (r.value ? 'T' : 'F') : 'D')).join(''),
            firstHit: first < 0 ? null : first,
        });
    }
    // W: cost of evaluating every watch of the scene on one configuration, the compile once per run.
    const compiled = def.watches.map(w => compileOutput(w.text, { net: live.net, snapshot: live.snapshot, nameOf: nameOf(s) }));
    const REPS = 2000;
    const t0 = performance.now();
    for (let i = 0; i < REPS; i++) for (const c of compiled) if (!c.defect) evaluateOutput(c, live.snapshot!, live.net, live.config.state);
    const evals = REPS * compiled.filter(c => !c.defect).length;
    note(`${def.which} W cost`, `${((performance.now() - t0) * 1000 / Math.max(1, evals)).toFixed(2)} µs per watch evaluation (${evals} evaluations)`);
    const tc0 = performance.now();
    for (let i = 0; i < 200; i++) for (const w of def.watches) compileOutput(w.text, { net: live.net, snapshot: live.snapshot, nameOf: nameOf(s) });
    note(`${def.which} W compile cost`, `${((performance.now() - tc0) * 1000 / (200 * def.watches.length)).toFixed(1)} µs per watch compile`);

    // C: the scenario of the path, replayed from Reset.
    const scenario = scenarioOf(live);
    const finalLive = ser(live.config.state);
    const tr0 = performance.now();
    const rep = replay(s, scenario);
    const repMs = performance.now() - tr0;
    const sameTrace = JSON.stringify(scenarioOf(rep.run)) === JSON.stringify(scenario);
    check(`${def.which} C: replay of the recorded scenario`, rep.ok && sameTrace && ser(rep.run.config.state) === finalLive, `${rep.ok ? 'ok' : `diverged at ${rep.at}: ${rep.why}`}, ${repMs.toFixed(1)} ms with the Reset`);
    note(`${def.which} C scenario bytes`, JSON.stringify(scenario).length);
    // C: tamperings; each must diverge at the step named.
    if (scenario.length > 2) {
        const dropped = [...scenario.slice(0, 1), ...scenario.slice(2)];
        const d = replay(s, dropped);
        note(`${def.which} C step 2 dropped`, d.ok ? 'no divergence' : `diverged at ${d.at}: ${d.why}`);
    }
    // C: a final watch, read on the replayed run's last configuration (the scene's first watch).
    const fin = def.watches[0];
    const finR = readWatch(rep.run, s, fin.text, rep.run.config.state);
    note(`${def.which} C final watch ${fin.name}`, finR.kind === 'value' ? (finR.value ? 'holds: the scenario passes' : 'false: the scenario fails') : finR.detail);
    // C: every event renamed (instance name and identifier slot); the scenario names events by id, so it still replays.
    const evIds = live.alphabet;
    if (evIds.length > 0) {
        const stc = netStcFromRoles(runBag(s.lookup[s.mmId]._state, s.lookup))!;
        const saved = evIds.map(id => ({ id, name: s.lookup[id].name, slots: (s.lookup[id].features ?? []).map((v: string) => [v, s.lookup[v]?.values]) }));
        for (const id of evIds) {
            s.lookup[id] = { ...s.lookup[id], name: `${s.lookup[id].name}Renamed` };
            for (const v of s.lookup[id].features ?? []) {
                if (s.lookup[v]?.instanceof === stc.eventIdentifier) s.lookup[v] = { ...s.lookup[v], values: (s.lookup[v].values ?? []).map((x: unknown) => `${String(x)}Renamed`) };
            }
        }
        const renamed = replay(s, scenario);
        const labels = eventAlphabet(stc, makeNetModelView(s.lookup, stc.eventIdentifier), collectModelObjectIds(s.lookup, s.m1Id)).map(e => e.label);
        check(`${def.which} C: the scenario replays after every event is renamed`, renamed.ok, `${renamed.ok ? 'ok' : `${renamed.at}: ${renamed.why}`}; labels now ${labels.join(', ')}`);
        for (const x of saved) {
            s.lookup[x.id] = { ...s.lookup[x.id], name: x.name };
            for (const [v, values] of x.slots) if (s.lookup[v]) s.lookup[v] = { ...s.lookup[v], values };
        }
    }
    const foreign = live.net.transitions.find(x => !scenario.some(st => st.selector === x.id));
    if (foreign && scenario.length > 0) {
        const swapped = [{ ...scenario[0], selector: foreign.id }, ...scenario.slice(1)];
        const d = replay(s, swapped);
        check(`${def.which} C a selector never offered diverges at step 1`, !d.ok && d.at === 1, d.ok ? 'no divergence' : `${d.at}: ${d.why}`);
    }

    // V: coverage from the trace; the same counts gathered step by step from each record's last label.
    const cov = coverageOf(live);
    const inc: Coverage = { visits: new Map(), firings: new Map() };
    for (const [place, n] of live.net.initial.marking) if (n > 0) bump(inc.visits, place);
    for (let m = 1; m < snaps.length; m++) {
        const step = snaps[m].trace![m - 1];
        if (step.kind !== 'fired' || step.selector === null) continue;
        bump(inc.firings, step.selector);
        for (const a of snaps[m].net.transitions.find(x => x.id === step.selector)!.postset) bump(inc.visits, a.place);
    }
    const asText = (c: Coverage) => JSON.stringify([[...c.visits].sort(), [...c.firings].sort()]);
    check(`${def.which} V: counts step by step equal counts from the trace`, asText(cov) === asText(inc));
    const neverVisited = [...live.net.places].filter(p => !cov.visits.has(p)).map(nameOf(s));
    const neverFired = live.net.transitions.filter(x => !cov.firings.has(x.id)).map(x => x.origin.map(nameOf(s)).join('+'));
    note(`${def.which} V coverage of the path`, {
        places: `${live.net.places.size - neverVisited.length}/${live.net.places.size}`, neverVisited,
        transitions: `${live.net.transitions.length - neverFired.length}/${live.net.transitions.length}`, neverFired,
        originKinds: [...new Set(live.net.transitions.flatMap(x => x.origin).map(o => s.lookup[o]?.className))],
    });

    // K: which bag keys move the run's signature.
    const base = runSignature(s.lookup, s.m1Id, s.mmId);
    const bag = s.lookup[s.m1Id]._state ?? {};
    const moves = (key: string) => {
        s.lookup[s.m1Id]._state = { ...bag, [key]: '{"v":1,"watches":[]}' };
        const moved = runSignature(s.lookup, s.m1Id, s.mmId) !== base;
        s.lookup[s.m1Id]._state = bag;
        return moved;
    };
    const k = {
        simWatches: moves('simWatches'), simScenarios: moves('simScenarios'), watches: moves('watches'), scenarios: moves('scenarios'),
        runWatches: moves('runWatches'), runScenarios: moves('runScenarios'),
    };
    note(`${def.which} K runSignature moved by`, k);
    check(`${def.which} K: runWatches, runScenarios, watches and scenarios leave runSignature, sim* keys move it`,
        !k.watches && !k.scenarios && !k.runWatches && !k.runScenarios && k.simWatches && k.simScenarios);

    // M: memory of the kept configurations and of the trace, 1000 steps (PEST cycles coin and push, both firings; the
    // other three repeat Reset and the script's path, so their records are summed over the runs).
    if (gc) {
        const N = SIM_KEEP_CONFIGS;
        const sample = (): { kept: number; trace: number } => {
            const runs: SimRun[] = [];
            reset(s);
            let steps = 0;
            while (steps < N) {
                if (def.which === 'PEST') {
                    for (const e of ['coin', 'push']) { press(s, eventId(s, e), undefined, null); steps++; }
                } else {
                    runs.push(getSimRun(s.m1Id)!);
                    reset(s);
                    steps += def.path(s, null).length;
                }
            }
            runs.push(getSimRun(s.m1Id)!);
            const keptLists = runs.map(r => r.keptConfigs ?? []);
            const traces = runs.map(r => r.trace ?? []);
            __resetSimRunsForTests();
            runs.length = 0;
            const withBoth = heap();
            keptLists.length = 0;
            const withTrace = heap();
            traces.length = 0;
            const none = heap();
            return { kept: (withBoth - withTrace) / N, trace: (withTrace - none) / N };
        };
        const xs = [sample(), sample(), sample()].sort((a, b) => a.kept - b.kept);
        note(`${def.which} M per step at ${N}`, `kept configuration ${xs[1].kept.toFixed(0)} B, trace entry ${xs[1].trace.toFixed(0)} B (median of 3; samples ${xs.map(x => x.kept.toFixed(0)).join('/')} B)`);
    }
}

// ── S past the cap, and the cost of a pop that replays (PEST) ───────────────────────────────────────────────────
{
    __resetSimRunsForTests();
    const s = await loadScene('scene_1_DemoPEST.jjodel');
    configure(s, 'stateMachine');
    reset(s);
    const coin = eventId(s, 'coin');
    const push = eventId(s, 'push');
    const snaps: SimRun[] = [];
    const M = SIM_KEEP_CONFIGS + 5;
    for (let i = 0; i < M; i++) {
        press(s, i % 2 === 0 ? coin : push, undefined, null);
        if (i >= M - 7) snaps.push(getSimRun(s.m1Id)!);
    }
    let equal = 0;
    let equalWithKept = 0;
    for (let j = snaps.length - 1; j >= 1; j--) {
        const popped = popRun(snaps[j], false)!;
        if (readOf(popped, false) === readOf(snaps[j - 1], false)) equal++;
        if (readOf(popped) === readOf(snaps[j - 1])) equalWithKept++;
    }
    check('PEST S: pop past the cap of kept configurations, every reading', equal === snaps.length - 1, `${equal}/${snaps.length - 1}, kept ${snaps[snaps.length - 1].keptConfigs?.length} at step ${snaps[snaps.length - 1].trace?.length}`);
    note('PEST S past the cap, the kept list itself equal', `${equalWithKept}/${snaps.length - 1} (a pop keeps ${(snaps[snaps.length - 1].keptConfigs?.length ?? 0) - 1}, the record one step earlier ${snaps[snaps.length - 2].keptConfigs?.length})`);
    // The worst pop: no configuration kept, so configAt replays every step before it.
    const last = snaps[snaps.length - 1];
    const bare: SimRun = { ...last, keptConfigs: [] };
    const tp = performance.now();
    const popped = popRun(bare, false);
    const ms = performance.now() - tp;
    check('PEST S: a pop with nothing kept replays to the same configuration', !!popped && serCfg(popped.config) === serCfg(snaps[snaps.length - 2].config));
    note('PEST S worst pop', `${ms.toFixed(1)} ms for a replay of ${(last.trace?.length ?? 1) - 1} steps`);
}

// ── S and W under Random (Petri): rewinding draws, and Play stopped by a watch, from the seed ───────────────────
{
    __resetSimRunsForTests();
    const s = await loadScene('scene_2_DemoPetri.jjodel');
    configure(s, 'petri');
    setSimPolicy(s.m1Id, { choices: 'random' });
    let sameRewound = 0;
    let sameKept = 0;
    let tried = 0;
    for (let seed = 1; seed <= 200; seed++) {
        reset(s, seed);
        pressStep(s.m1Id, s.lookup);
        const one = getSimRun(s.m1Id)!;
        if (one.trace?.[0]?.origin !== 'random') continue;
        tried++;
        for (const rewind of [true, false]) {
            simReset(s.m1Id, popRun(one, rewind)!);
            pressStep(s.m1Id, s.lookup);
            const again = getSimRun(s.m1Id)!.trace![0].selector;
            if (again === one.trace![0].selector) { if (rewind) sameRewound++; else sameKept++; }
        }
    }
    note('Petri S Random re-draw after one pop, step 1', { seedsWithADraw: tried, sameChoiceDrawsRewound: sameRewound, sameChoiceDrawsKept: sameKept });
    check('Petri S: rewinding draws redraws the same transition', sameRewound === tried);

    // Play, as the panel's timer runs it (playTick then pressStep), with the watches read after every committed step
    // and never on the configuration Play starts from.
    const watches: WatchDef[] = [{ name: 'p3Reached', kind: 'breakpoint', text: 'p3.[marked]' }];
    const play = (seed: number) => {
        reset(s, seed);
        let steps = 0;
        for (;;) {
            const run = getSimRun(s.m1Id)!;
            const tick = playTick(run, getSimPolicy(s.m1Id), steps);
            if (tick.kind === 'stop') return { stop: tick.reason, steps };
            const p = pressStep(s.m1Id, s.lookup);
            if (p.outcome === null) return { stop: 'nothing', steps };
            steps++;
            const after = getSimRun(s.m1Id)!;
            const hit = watches.find(w => hits(w, readWatch(after, s, w.text, after.config.state)));
            if (hit) return { stop: `watch ${hit.name}`, steps, trace: after.trace!.map(x => x.selector && nameOf(s)(x.selector)).join(',') };
        }
    };
    const runs = [1, 2, 3, 4, 5].map(seed => ({ seed, a: play(seed), b: play(seed) }));
    for (const r of runs) note(`Petri W Play under Random, seed ${r.seed}`, r.a);
    check('Petri W: the same seed stops Play at the same step', runs.every(r => JSON.stringify(r.a) === JSON.stringify(r.b)));
}

console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
