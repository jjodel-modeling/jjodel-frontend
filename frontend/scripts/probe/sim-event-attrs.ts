/**
 * sim-event-attrs probe (P-2026-10-10-1630, the discovery of the memo «event attributes readable from guards and
 * actions»; docs/discovery/discovery_2026-10-10_sim_event_attributes.md).
 *
 * Node only: no dev server, no browser, no port. The model is built here as a raw idlookup, in the D-layer shape the
 * bridge reads (DClass, DAttribute, DReference, DEnumerator, DEnumLiteral, DModel, DObject, DValue): a vending machine
 * whose event class `Coin` declares `amount: EInt`, `hot: EBoolean`, `size: Size` (an enumeration), `label: EString`,
 * `home -> State`, `tags: EInt [0..*]` and `need: EInt [1..1]`; a subclass `BigCoin` adds `bonus: EInt`. Four
 * instances: `coin10`, `coin20`, `coin50` (a BigCoin), and `coinX`, whose slots exist and are all empty. The model
 * declares the globals `credit` (0..200, initial 0) and `last`, `seen` (0..200), the metaclass Coin the attribute
 * `x` (0..5). The roles are the Extended state machine preset (`simProfile` written as the panel's Apply writes it);
 * the fused (fork) and Petri cells use a Custom profile, the only one that turns on both a trigger and fork/join, or
 * a trigger in the Petri shape (simProfiles.ts SYSTEM_ROWS).
 *
 * The run is started with `startRun` and every press goes through `pressInput`, the panel's own functions; a guard
 * outcome is read through `run.guards`, the oracle the core calls. The JjEL context is the stand-in of
 * `buildEvalContext`'s record used by `sim-verif-bench.ts` (raw slot values, unique names bound, reference slots
 * resolved to the pool handles): it is the only part that is not the app's, and it reads raw values where the app
 * coerces (report §1.3); the browser check `sim-event-attrs-browser.ts` measures the app's.
 *
 * Every cell prints MEAS lines: the value read, the Reset defect line, the Last step line, the halt line, the status.
 * PASS/FAIL lines are the positive controls that the bench runs the subject (a known fire, a known discard).
 *
 * Run (from frontend/): npx --no-install tsx scripts/probe/sim-event-attrs.ts
 */
import {
    defectsLine, haltMessage, pressInput, runStatus, startRun, stopReason,
} from '../../src/components/editor-v2/sim/simBridge.ts';
import type { ContextBuilder } from '../../src/components/editor-v2/sim/simBridge.ts';
import { collectModelObjectIds } from '../../src/components/editor-v2/sim/simBridge.ts';
import { __resetSimRunsForTests, getSimRun, simReset } from '../../src/components/editor-v2/sim/simRunState.ts';
import { readFileSync } from 'node:fs';
import lz from 'async-lz-string';
import { makeNetModelView, runBag } from '../../src/components/editor-v2/sim/simBridge.ts';
import { profileBindings, profilePatch } from '../../src/components/editor-v2/sim/simRoleStatus.ts';
import { sketchOfMetamodel } from '../../src/components/editor-v2/sim/metamodelSketch.ts';
import { boundEstimate } from '../../src/components/editor-v2/sim/modelMarkings.ts';
import { eventAlphabet, netStcFromRoles } from '../../src/model/simulation/netCompile.ts';
import { candidates } from '../../src/model/simulation/netStep.ts';
import type { SimRun } from '../../src/components/editor-v2/sim/simRunState.ts';
import { encodeProfile } from '../../src/model/simulation/profileCodec.ts';
import { systemProfile } from '../../src/model/simulation/simProfiles.ts';
import { stateAccess } from '../../src/model/simulation/netStep.ts';
import { buildGuardContext } from '../../src/model/simulation/guardContext.ts';
import { compileGuard, evaluateGuard } from '../../src/model/simulation/guardEvaluator.ts';
import { compileAction } from '../../src/model/simulation/actionEvaluator.ts';
import { parseAction, parseExpressionStrict } from '../../src/jjel/parser/index.ts';
import { JjelEvaluator } from '../../src/jjel/evaluator/index.ts';
import { checkGuardSubset } from '../../src/model/simulation/subsetChecker.ts';

const EV = new JjelEvaluator();

type Lookup = Record<string, any>;

let failures = 0;
const check = (label: string, ok: boolean, detail = ''): void => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
};
const note = (label: string, d: unknown): void => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);

// ── the stand-in of buildEvalContext's record (sim-verif-bench.ts `recordOf`, unchanged) ─────────────────────────

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

// ── the model, as a raw idlookup ────────────────────────────────────────────────────────────────────────────────

const PRIMS = ['EINT', 'EBOOLEAN', 'ESTRING', 'EXPRESSION', 'ACTION'] as const;
const P = (n: typeof PRIMS[number]) => `Pointer_${n}`;

interface TransSpec {
    name: string; from: string; to: string;
    triggers?: string[]; guard?: string; effects?: string[];
    /** The arc's own feature named `event` (memo question 1). */
    eventFeature?: string;
}
interface StateSpec { name: string; kind: 'Initial' | 'State' | 'Final' | 'Fork'; entry?: string[]; exit?: string[] }
interface PetriSpec { trans: { name: string; triggers?: string[]; guard?: string; effects?: string[] } }
interface SceneSpec {
    states?: StateSpec[];
    trans?: TransSpec[];
    petri?: PetriSpec;
    /** `esm`: the Extended state machine preset; `custom`: no `simProfile`, the profile inferred from the keys. */
    profile: 'esm' | 'custom';
    fork?: boolean;
    /** Rename an instance (memo question 1: an instance named `event`). */
    rename?: Record<string, string>;
}

interface Built {
    L: Lookup; mmId: string; m1Id: string; projectId: string;
    id: (name: string) => string;
}

const COINS: Array<{ name: string; cls: 'Coin' | 'BigCoin'; amount?: number; hot?: boolean; size?: 'S' | 'M' | 'L'; label?: string; home?: string; tags?: number[]; need?: number; bonus?: number }> = [
    { name: 'coin10', cls: 'Coin', amount: 10, hot: true, size: 'S', label: 'ten', home: 'idle', tags: [1, 2], need: 1 },
    { name: 'coin20', cls: 'Coin', amount: 20, hot: false, size: 'M', label: 'twenty', home: 'ready', tags: [], need: 2 },
    { name: 'coin50', cls: 'BigCoin', amount: 50, hot: true, size: 'L', label: 'fifty', home: 'done', tags: [5], need: 5, bonus: 7 },
    { name: 'coinX', cls: 'Coin' },
];
const ALL_COINS = COINS.map(c => c.name);

function build(spec: SceneSpec): Built {
    const L: Lookup = {};
    const names = new Map<string, string>();
    const id = (n: string): string => {
        const x = names.get(n);
        if (!x) throw new Error(`no element ${n}`);
        return x;
    };
    let seq = 0;
    const fresh = (tag: string) => `Pointer_probe_${tag}_${++seq}`;
    const mmId = 'Pointer_probe_mm';
    const m1Id = 'Pointer_probe_m1';
    for (const p of PRIMS) L[P(p)] = { className: 'DClass', id: P(p), name: p[0] + p.slice(1).toLowerCase(), isPrimitive: true, attributes: [], references: [], extends: [] };

    const cls = (n: string, ext: string[] = [], abstract = false) => {
        const cid = fresh(`c_${n}`);
        names.set(`C:${n}`, cid);
        L[cid] = { className: 'DClass', id: cid, name: n, abstract, isPrimitive: false, attributes: [], references: [], extends: ext.map(e => id(`C:${e}`)), father: mmId };
        return cid;
    };
    const attr = (c: string, n: string, type: string, lb = 0, ub = 1) => {
        const aid = fresh(`a_${c}_${n}`);
        names.set(`A:${c}.${n}`, aid);
        L[aid] = { className: 'DAttribute', id: aid, name: n, type, lowerBound: lb, upperBound: ub, father: id(`C:${c}`) };
        L[id(`C:${c}`)].attributes.push(aid);
        return aid;
    };
    const ref = (c: string, n: string, type: string, ub = 1, containment = false) => {
        const rid = fresh(`r_${c}_${n}`);
        names.set(`R:${c}.${n}`, rid);
        L[rid] = { className: 'DReference', id: rid, name: n, type: id(`C:${type}`), lowerBound: 0, upperBound: ub, containment, father: id(`C:${c}`) };
        L[id(`C:${c}`)].references.push(rid);
        return rid;
    };

    // The enumeration Size {S, M, L}: a DEnumerator and its literals (the slot holds the literal's pointer).
    const enumId = fresh('e_Size');
    names.set('E:Size', enumId);
    L[enumId] = { className: 'DEnumerator', id: enumId, name: 'Size', literals: [] as string[], father: mmId };
    for (const lit of ['S', 'M', 'L']) {
        const lid = fresh(`l_${lit}`);
        names.set(`EL:${lit}`, lid);
        L[lid] = { className: 'DEnumLiteral', id: lid, name: lit, father: enumId };
        L[enumId].literals.push(lid);
    }

    // Control flow: State and its subclasses, Transition. Petri: Place, PTrans, Arc. One Coin hierarchy for both.
    cls('State'); cls('Initial', ['State']); cls('Final', ['State']); cls('Fork', ['State']);
    cls('Transition');
    cls('Coin'); cls('BigCoin', ['Coin']);
    cls('PNode', [], true); cls('Place', ['PNode']); cls('PTrans', ['PNode']); cls('Arc');
    attr('State', 'entry', P('ACTION'), 0, -1); attr('State', 'exit', P('ACTION'), 0, -1);
    ref('State', 'transitions', 'Transition', -1, true);
    attr('Transition', 'guard', P('EXPRESSION')); attr('Transition', 'effect', P('ACTION'), 0, -1);
    attr('Transition', 'event', P('ESTRING'));
    ref('Transition', 'nextState', 'State'); ref('Transition', 'trigger', 'Coin', -1);
    attr('Coin', 'amount', P('EINT')); attr('Coin', 'hot', P('EBOOLEAN')); attr('Coin', 'size', enumId);
    attr('Coin', 'label', P('ESTRING')); ref('Coin', 'home', 'State'); attr('Coin', 'tags', P('EINT'), 0, -1);
    attr('Coin', 'need', P('EINT'), 1, 1); attr('BigCoin', 'bonus', P('EINT'));
    attr('Place', 'init', P('EINT'));
    attr('PTrans', 'guard', P('EXPRESSION')); attr('PTrans', 'act', P('ACTION'), 0, -1); ref('PTrans', 'trigger', 'Coin', -1);
    ref('Arc', 'src', 'PNode'); ref('Arc', 'tgt', 'PNode');

    // M1 objects.
    const obj = (n: string, c: string, father = m1Id) => {
        const oid = fresh(`o_${n}`);
        names.set(n, oid);
        L[oid] = { className: 'DObject', id: oid, name: n, instanceof: id(`C:${c}`), father, features: [] as string[] };
        return oid;
    };
    const slot = (o: string, feature: string, values: unknown[]) => {
        const vid = fresh('v');
        L[vid] = { className: 'DValue', id: vid, instanceof: feature, values, father: id(o) };
        L[id(o)].features.push(vid);
        return vid;
    };
    const featuresOfClass = (c: string): string[] => {
        const out: string[] = [];
        const walk = (cid: string) => {
            for (const s of L[cid].extends ?? []) walk(s);
            out.push(...L[cid].attributes, ...L[cid].references);
        };
        walk(id(`C:${c}`));
        return out;
    };

    for (const s of spec.states ?? []) obj(s.name, s.kind);
    for (const c of COINS) obj(c.name, c.cls);
    for (const t of spec.trans ?? []) obj(t.name, 'Transition', 'pending');
    // Containment: a transition's father is the DValue of its source's `transitions` slot.
    for (const s of spec.states ?? []) {
        const own = (spec.trans ?? []).filter(t => t.from === s.name).map(t => id(t.name));
        for (const f of featuresOfClass(s.kind)) {
            const fname = L[f].name;
            const values = fname === 'entry' ? (s.entry ?? []) : fname === 'exit' ? (s.exit ?? []) : fname === 'transitions' ? own : [];
            const vid = slot(s.name, f, values);
            if (fname === 'transitions') for (const t of own) L[t].father = vid;
        }
    }
    for (const t of spec.trans ?? []) {
        for (const f of featuresOfClass('Transition')) {
            const fname = L[f].name;
            const values = fname === 'guard' ? (t.guard === undefined ? [] : [t.guard])
                : fname === 'effect' ? (t.effects ?? [])
                    : fname === 'nextState' ? [id(t.to)]
                        : fname === 'trigger' ? (t.triggers ?? []).map(id)
                            : fname === 'event' ? (t.eventFeature === undefined ? [] : [t.eventFeature]) : [];
            slot(t.name, f, values);
        }
    }
    for (const c of COINS) {
        for (const f of featuresOfClass(c.cls)) {
            const fname = L[f].name;
            const v = (c as any)[fname];
            const values = v === undefined ? []
                : fname === 'size' ? [id(`EL:${v}`)]
                    : fname === 'home' ? (names.has(v) ? [id(v)] : [])
                        : Array.isArray(v) ? v : [v];
            slot(c.name, f, values);
        }
    }
    if (spec.petri) {
        const t = spec.petri.trans;
        obj('p1', 'Place'); obj('p2', 'Place'); obj(t.name, 'PTrans'); obj('a1', 'Arc'); obj('a2', 'Arc');
        slot('p1', id('A:Place.init'), [1]); slot('p2', id('A:Place.init'), [0]);
        slot(t.name, id('A:PTrans.guard'), t.guard === undefined ? [] : [t.guard]);
        slot(t.name, id('A:PTrans.act'), t.effects ?? []);
        slot(t.name, id('R:PTrans.trigger'), (t.triggers ?? []).map(id));
        slot('a1', id('R:Arc.src'), [id('p1')]); slot('a1', id('R:Arc.tgt'), [id(t.name)]);
        slot('a2', id('R:Arc.src'), [id(t.name)]); slot('a2', id('R:Arc.tgt'), [id('p2')]);
    }
    for (const [from, to] of Object.entries(spec.rename ?? {})) L[id(from)].name = to;

    const decl = (name: string, metaclass: string | null, domain: unknown, initial: string) => ({ name, metaclass, space: 'semantic', domain, initial });
    const range = (min: number, max: number) => ({ kind: 'range', min, max });
    const globals = [
        decl('credit', null, range(0, 200), '0'), decl('last', null, range(0, 200), '0'), decl('seen', null, range(0, 200), '0'),
        decl('x', id('C:Coin'), range(0, 5), '0'),
    ];
    const stateAttributes = JSON.stringify({ v: 1, attrs: globals });

    let bag: Record<string, unknown>;
    if (spec.petri) {
        bag = {
            simNode: id('C:Place'), simTransition: id('C:PTrans'), simArc: id('C:Arc'), simArcSource: id('R:Arc.src'),
            simArcTarget: id('R:Arc.tgt'), simInitialMarking: id('A:Place.init'), simGuard: id('A:PTrans.guard'),
            simAction: id('A:PTrans.act'), simTrigger: id('R:PTrans.trigger'), simStateAttributes: stateAttributes,
        };
    } else {
        bag = {
            simNode: id('C:State'), simInitial: id('C:Initial'), simTerminal: id('C:Final'), simTransition: id('C:Transition'),
            simOwnedTransitions: id('R:State.transitions'), simNextState: id('R:Transition.nextState'),
            simGuard: id('A:Transition.guard'), simAction: id('A:Transition.effect'), simEntry: id('A:State.entry'),
            simExit: id('A:State.exit'), simTrigger: id('R:Transition.trigger'), simStateAttributes: stateAttributes,
            ...(spec.fork ? { simFork: id('C:Fork') } : {}),
        };
    }
    if (spec.profile === 'esm') bag.simProfile = encodeProfile(systemProfile('extendedStateMachine')!);
    bag.simEnabled = true;
    L[mmId] = { className: 'DModel', id: mmId, name: 'VendingMM', isMetamodel: true, _state: bag };
    L[m1Id] = { className: 'DModel', id: m1Id, name: 'vending', isMetamodel: false, instanceof: mmId, _state: {} };
    return { L, mmId, m1Id, projectId: 'Pointer_probe_project', id };
}

// ── a run and its readings ──────────────────────────────────────────────────────────────────────────────────────

interface Started { run: SimRun; defects: string | null; defectsDetail: string[] }

function start(b: Built): Started {
    __resetSimRunsForTests();
    const r = startRun(b.L, b.m1Id, b.mmId, b.projectId, recordOf(b.L, b.m1Id), 12345);
    if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
    simReset(b.m1Id, r.run);
    const cds = r.compileDefects ?? [];
    return {
        run: r.run,
        defects: defectsLine(r.run.net, b.L, cds),
        defectsDetail: cds.map(d => `${d.role} ${b.L[d.site?.element ?? d.element]?.name ?? d.element}: ${d.reason}: ${d.detail}`),
    };
}

const globalsOf = (b: Built): Record<string, unknown> => Object.fromEntries(getSimRun(b.m1Id)!.config.state.attrs.get(b.m1Id) ?? []);

/** One press of an event (`null` for ε): the Last step line, the halt line, the status, σ's globals. */
function pressOf(b: Built, event: string | null): Record<string, unknown> {
    const p = pressInput(b.m1Id, event === null ? null : b.id(event), undefined, b.L, event ?? 'ε');
    const run = getSimRun(b.m1Id)!;
    const status = runStatus(run);
    return {
        press: event ?? 'ε', last: p.lastStep ?? (p.pending ? `pending ${p.pending.length}` : null),
        halt: run.halt ? haltMessage(run.halt, b.L, { action: 'x', entry: 'x', exit: 'x' } as any) : null,
        haltKind: run.halt?.kind ?? null, status,
        reason: status === 'Deadlock' ? stopReason(run, b.L, e => (e === null ? 'ε' : b.L[e]?.name ?? e))?.line ?? null : null,
        globals: globalsOf(b),
    };
}

/** The guard oracle of the run on one site, for one event: what the core sees before it picks candidates. */
function guardOf(b: Built, site: string, event: string | null): string {
    const run = getSimRun(b.m1Id)!;
    const g = run.guards(b.id(site), event === null ? null : b.id(event), stateAccess(run.config.state));
    return g.kind === 'defect' ? `defect ${g.reason}: ${g.detail}` : g.kind;
}

/** The value of one expression in the guard context of `site` and `event`, with the run's snapshot (no σ). */
function valueOf(b: Built, site: string, event: string | null, text: string): string {
    const run = getSimRun(b.m1Id)!;
    const ctx = buildGuardContext(run.snapshot!, { transitionId: b.id(site) }, { event: event === null ? null : b.id(event) });
    const g = compileGuard(`(${text}) == (${text})`);
    const out = evaluateGuard(g, ctx);
    if (out.kind === 'defect') return `defect ${out.reason}: ${out.detail}`;
    // The value itself, on the same context, by the evaluator the guard uses (path B, no builtins).
    const parsed = parseExpressionStrict(text);
    let v: unknown;
    try {
        const out = EV.evaluateWithDiagnostics(parsed.expression!, ctx!);
        v = out.warnings.length > 0 ? { value: out.value, warnings: out.warnings.map(w => w.kind) } : out.value;
    } catch (e: any) {
        v = `throws ${e?.constructor?.name}: ${e?.message}`;
    }
    return JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && x.__type === 'Object' ? `<${x.name}>` : x));
}

// ── the scenes ──────────────────────────────────────────────────────────────────────────────────────────────────

const MACHINE: StateSpec[] = [
    { name: 'idle', kind: 'Initial' }, { name: 'ready', kind: 'State' }, { name: 'done', kind: 'Final' },
];
const withStates = (over: Partial<Record<string, Partial<StateSpec>>>): StateSpec[] => MACHINE.map(s => ({ ...s, ...(over[s.name] ?? {}) }));

console.log('== 1. today\'s behaviour ==');

// 1a. A guard on a triggered arc reads event.amount.
{
    const b = build({ profile: 'esm', states: MACHINE, trans: [{ name: 'tIns', from: 'idle', to: 'idle', triggers: ALL_COINS, guard: 'event.amount > 15' }] });
    const s = start(b);
    note('1a guard event.amount > 15 · Reset defects', s.defects ?? 'none');
    for (const c of ALL_COINS) note(`1a guard on tIns, event ${c}`, guardOf(b, 'tIns', c));
    const presses = ALL_COINS.map(c => pressOf(b, c));
    for (const p of presses) note('1a press', p);
    check('1a control: coin20 fires tIns', String(presses[1].last).includes('fired'), String(presses[1].last));
    check('1a control: coin10 is discarded on a false guard', String(presses[0].last).includes('discarded'), String(presses[0].last));
}

// 1b. An arc action's right-hand side; the multivalued trigger with one action (three presses).
{
    const b = build({ profile: 'esm', states: MACHINE, trans: [{ name: 'tIns', from: 'idle', to: 'idle', triggers: ALL_COINS, effects: ['model.[credit] := model.[credit] + event.amount'] }] });
    const s = start(b);
    note('1b action credit += event.amount · Reset defects', s.defects ?? 'none');
    const presses = ['coin10', 'coin20', 'coin50'].map(c => pressOf(b, c));
    for (const p of presses) note('1b press', p);
    check('1b the credit after coin10, coin20, coin50 is 80', globalsOf(b).credit === 80, JSON.stringify(globalsOf(b)));
    note('1b press coinX (amount unset)', pressOf(b, 'coinX'));
}

// 1c. Entry and exit actions read event.amount, reached through a triggered arc and through an ε arc.
{
    const b = build({
        profile: 'esm',
        states: withStates({ idle: { exit: ['model.[seen] := event.amount'] }, ready: { entry: ['model.[last] := event.amount'] } }),
        trans: [{ name: 'tPay', from: 'idle', to: 'ready', triggers: ALL_COINS }],
    });
    const s = start(b);
    note('1c entry/exit · Reset defects', s.defects ?? 'none');
    note('1c press coin20 (triggered arc idle → ready)', pressOf(b, 'coin20'));
}
{
    const b = build({
        profile: 'esm',
        states: withStates({ idle: { exit: ['model.[seen] := event.amount'] }, ready: { entry: ['model.[last] := event.amount'] } }),
        trans: [{ name: 'tGo', from: 'idle', to: 'ready' }],
    });
    const s = start(b);
    note('1c entry/exit on an ε arc · Reset defects', s.defects ?? 'none');
    note('1c press ε (untriggered arc idle → ready)', pressOf(b, null));
}
{
    // The same entry reached by two arcs, one triggered and one ε: entry depends on the path.
    const b = build({
        profile: 'esm',
        states: withStates({ ready: { entry: ['model.[last] := if event == null then 0 else event.amount'] } }),
        trans: [{ name: 'tPay', from: 'idle', to: 'ready', triggers: ['coin20'] }, { name: 'tGo', from: 'idle', to: 'ready' }],
    });
    start(b);
    note('1c entry guarded by event == null, via coin20', pressOf(b, 'coin20'));
    start(b);
    note('1c entry guarded by event == null, via ε', pressOf(b, null));
}

// 1d. The same reads on an ε arc: guard and action.
{
    const b = build({ profile: 'esm', states: MACHINE, trans: [{ name: 'tGo', from: 'idle', to: 'ready', guard: 'event.amount > 0' }] });
    const s = start(b);
    note('1d ε guard event.amount > 0 · Reset defects', s.defects ?? 'none');
    note('1d guard on tGo, ε', guardOf(b, 'tGo', null));
    note('1d press ε', pressOf(b, null));
}
{
    const b = build({ profile: 'esm', states: MACHINE, trans: [{ name: 'tGo', from: 'idle', to: 'ready', effects: ['model.[credit] := event.amount'] }] });
    const s = start(b);
    note('1d ε action credit := event.amount · Reset defects', s.defects ?? 'none');
    note('1d press ε', pressOf(b, null));
}
{
    const b = build({ profile: 'esm', states: MACHINE, trans: [{ name: 'tGo', from: 'idle', to: 'ready', guard: 'event == null' }] });
    start(b);
    note('1d ε guard event == null', guardOf(b, 'tGo', null));
}

// 1e. A transition fused by a fork (Custom profile: no system profile has a trigger and fork together).
{
    const states: StateSpec[] = [{ name: 'idle', kind: 'Initial' }, { name: 'f', kind: 'Fork' }, { name: 'a', kind: 'State' }, { name: 'bb', kind: 'State' }];
    const b = build({
        profile: 'custom', fork: true, states,
        trans: [
            { name: 'e1', from: 'idle', to: 'f', triggers: ALL_COINS },
            { name: 'e2', from: 'f', to: 'a', guard: 'event.amount > 15', effects: ['model.[last] := event.amount'] },
            { name: 'e3', from: 'f', to: 'bb' },
        ],
    });
    const s = start(b);
    const t = s.run.net.transitions;
    note('1e fork, choice edge e1 triggered · transitions', t.map(x => ({ id: b.L[x.id.split('#')[0]]?.name, origin: x.origin.map(o => b.L[o]?.name), triggers: x.triggers.map(e => b.L[e]?.name), guardSites: x.guardSites.map(g => b.L[g]?.name) })));
    note('1e Reset defects', s.defects ?? 'none');
    note('1e guard on e2, coin10', guardOf(b, 'e2', 'coin10'));
    note('1e press coin10', pressOf(b, 'coin10'));
    note('1e press coin20', pressOf(b, 'coin20'));
}
{
    const states: StateSpec[] = [{ name: 'idle', kind: 'Initial' }, { name: 'f', kind: 'Fork' }, { name: 'a', kind: 'State' }, { name: 'bb', kind: 'State' }];
    const b = build({
        profile: 'custom', fork: true, states,
        trans: [
            { name: 'e1', from: 'idle', to: 'f' },
            { name: 'e2', from: 'f', to: 'a', triggers: ALL_COINS, guard: 'event.amount > 15' },
            { name: 'e3', from: 'f', to: 'bb' },
        ],
    });
    const s = start(b);
    const t = s.run.net.transitions;
    note('1e fork, choice edge e1 untriggered, out edge e2 triggered · transitions', t.map(x => ({ origin: x.origin.map(o => b.L[o]?.name), triggers: x.triggers.map(e => b.L[e]?.name) })));
    note('1e alphabet', s.run.alphabet.map(e => b.L[e]?.name));
    note('1e press coin20', pressOf(b, 'coin20'));
    note('1e press ε', pressOf(b, null));
}
{
    // Under the Extended state machine preset the fork key is off (R-SIM-78): the fork node is a place.
    const states: StateSpec[] = [{ name: 'idle', kind: 'Initial' }, { name: 'f', kind: 'Fork' }, { name: 'a', kind: 'State' }, { name: 'bb', kind: 'State' }];
    const b = build({
        profile: 'esm', fork: true, states,
        trans: [{ name: 'e1', from: 'idle', to: 'f', triggers: ALL_COINS }, { name: 'e2', from: 'f', to: 'a' }, { name: 'e3', from: 'f', to: 'bb' }],
    });
    const s = start(b);
    note('1e fork under the ESM preset · places', [...s.run.net.places].map(p => b.L[p]?.name));
}

// 1f. A Petri transition with a trigger (Custom profile: the Petri preset has no Trigger and no Action).
{
    const b = build({ profile: 'custom', petri: { trans: { name: 't1', triggers: ALL_COINS, guard: 'event.amount > 15', effects: ['model.[credit] := model.[credit] + event.amount'] } } });
    const s = start(b);
    note('1f Petri · Reset defects', s.defects ?? 'none');
    note('1f Petri transitions', s.run.net.transitions.map(x => ({ id: b.L[x.id]?.name, triggers: x.triggers.map(e => b.L[e]?.name), actionSites: x.actionSites.map(a => `${a.role}:${b.L[a.element]?.name}`) })));
    note('1f guard on t1, coin10', guardOf(b, 't1', 'coin10'));
    note('1f press coin10', pressOf(b, 'coin10'));
    note('1f press coin20', pressOf(b, 'coin20'));
}
{
    const P = systemProfile('petri')!;
    note('1f the Petri preset\'s modes of trigger, action, guard', { trigger: P.modes.trigger.mode, action: P.modes.action.mode, guard: P.modes.guard.mode });
    const E = systemProfile('extendedStateMachine')!;
    note('1f the ESM preset\'s modes of fork, join, trigger, entry, exit', { fork: E.modes.fork.mode, join: E.modes.join.mode, trigger: E.modes.trigger.mode, entry: E.modes.entry.mode, exit: E.modes.exit.mode });
    const F = systemProfile('flowchart')!;
    note('1f the Flowchart preset\'s modes of fork, trigger', { fork: F.modes.fork.mode, trigger: F.modes.trigger.mode });
}

// 1g. Each attribute type, and the unset instance, read in the guard context of a triggered arc (stand-in record).
{
    const b = build({ profile: 'esm', states: MACHINE, trans: [{ name: 'tIns', from: 'idle', to: 'idle', triggers: ALL_COINS }] });
    start(b);
    const reads = ['event.amount', 'event.hot', 'event.size', 'event.label', 'event.home', 'event.tags', 'event.need', 'event.bonus', 'event.weight', 'event.home == ready', 'event.size == "M"', 'event.tags.size'];
    for (const c of ALL_COINS) {
        const row: Record<string, string> = {};
        for (const r of reads) row[r] = valueOf(b, 'tIns', c, r);
        note(`1g ${c}`, row);
    }
    // The unset instance in a guard and in an action, as the run meets it.
    for (const g of ['event.amount > 15', 'event.amount == null', 'event.amount + 1 > 0', 'event.need > 0']) {
        note(`1g guard «${g}» on coinX`, (() => {
            const gb = build({ profile: 'esm', states: MACHINE, trans: [{ name: 'tIns', from: 'idle', to: 'idle', triggers: ALL_COINS, guard: g }] });
            start(gb);
            return { oracle: guardOf(gb, 'tIns', 'coinX'), press: pressOf(gb, 'coinX').last };
        })());
    }
    // A subclass-only attribute: read on the BigCoin and on a Coin.
    const sb = build({ profile: 'esm', states: MACHINE, trans: [{ name: 'tIns', from: 'idle', to: 'idle', triggers: ALL_COINS, guard: 'event.bonus > 0' }] });
    const ss = start(sb);
    note('1g subclass attribute bonus · Reset defects', ss.defects ?? 'none');
    note('1g guard event.bonus > 0 on coin50 (BigCoin)', guardOf(sb, 'tIns', 'coin50'));
    note('1g guard event.bonus > 0 on coin10 (Coin)', guardOf(sb, 'tIns', 'coin10'));
}

// 1g'. What the subset checker says of event reads (no site, no type: syntactic).
for (const g of ['event.amount > 15', 'event.hot and event.amount > 15', 'event != null and event.amount > 15', 'event.size == "M"', 'event.label == "ten"', 'event.tags.size > 0']) {
    const parsed = parseExpressionStrict(g);
    note(`1g' checkGuardSubset «${g}»`, checkGuardSubset(parsed.expression!, g).map(d => `${d.code} ${d.severity}`));
}

// 1h. Assigning the event: `event.amount := 1` and `event.[x] := 1`.
{
    const parsed = parseAction('event.amount := 1');
    note('1h parseAction(event.amount := 1)', { action: parsed.action !== null, errors: parsed.errors.map(e => `${e.line}:${e.column} ${e.message}`) });
    const c = compileAction('event.amount := 1');
    note('1h compileAction(event.amount := 1)', c?.defect ?? 'no defect');
    const b = build({ profile: 'esm', states: MACHINE, trans: [{ name: 'tIns', from: 'idle', to: 'idle', triggers: ALL_COINS, effects: ['event.amount := 1'] }] });
    const s = start(b);
    note('1h event.amount := 1 · Reset defects', { line: s.defects, detail: s.defectsDetail });
    note('1h press coin20', pressOf(b, 'coin20'));
}
{
    const b = build({ profile: 'esm', states: MACHINE, trans: [{ name: 'tIns', from: 'idle', to: 'idle', triggers: ALL_COINS, effects: ['event.[x] := 1'] }] });
    const s = start(b);
    note('1h event.[x] := 1 (x declared on Coin) · Reset defects', s.defects ?? 'none');
    const p = pressOf(b, 'coin20');
    note('1h press coin20', p);
    note('1h σ of coin20 after the press', Object.fromEntries(getSimRun(b.m1Id)!.config.state.attrs.get(b.id('coin20')) ?? []));
}
{
    const b = build({ profile: 'esm', states: MACHINE, trans: [{ name: 'tIns', from: 'idle', to: 'idle', triggers: ALL_COINS, effects: ['event.[credit] := 1'] }] });
    const s = start(b);
    note('1h event.[credit] := 1 (credit global, not on Coin) · Reset defects', s.defects ?? 'none');
    note('1h press coin20', pressOf(b, 'coin20'));
}
{
    const b = build({ profile: 'esm', states: MACHINE, trans: [{ name: 'tIns', from: 'idle', to: 'idle', triggers: ALL_COINS, effects: ['event.[nope] := 1'] }] });
    const s = start(b);
    note('1h event.[nope] := 1 (undeclared) · Reset defects', s.defects ?? 'none');
    note('1h press coin20', pressOf(b, 'coin20'));
}

console.log('== 2. name resolution ==');
{
    const b = build({
        profile: 'esm', states: MACHINE,
        trans: [
            { name: 'tIns', from: 'idle', to: 'idle', triggers: ALL_COINS, eventFeature: 'arc-feature' },
            { name: 'tGo', from: 'idle', to: 'ready', eventFeature: 'arc-feature' },
        ],
    });
    start(b);
    note('2 with Transition.event = "arc-feature", triggered arc, coin20', { event: valueOf(b, 'tIns', 'coin20', 'event'), selfEvent: valueOf(b, 'tIns', 'coin20', 'self.event') });
    note('2 same, ε arc', { event: valueOf(b, 'tGo', null, 'event'), selfEvent: valueOf(b, 'tGo', null, 'self.event') });
    note('2 a bare feature name of self (nextState) in a guard', valueOf(b, 'tIns', 'coin20', 'nextState'));
    note('2 a bare feature name of the event (amount)', valueOf(b, 'tIns', 'coin20', 'amount'));
}
{
    const b = build({ profile: 'esm', states: MACHINE, rename: { coin50: 'event' }, trans: [{ name: 'tGo', from: 'idle', to: 'ready' }, { name: 'tIns', from: 'idle', to: 'idle', triggers: ALL_COINS }] });
    start(b);
    note('2 an instance named event: `event` on the ε arc', valueOf(b, 'tGo', null, 'event'));
    note('2 an instance named event: `event` on tIns with coin20', valueOf(b, 'tIns', 'coin20', 'event'));
}

console.log('== 9. guard defects on the four demo scenes, with and without the script\'s declarations ==');
{
    // The fixtures, presets and paths of sim-verif-bench.ts (copied: that script exports nothing).
    const decompressFromUTF16: (x: string) => Promise<string> = (lz as any).decompressFromUTF16 ?? (lz as any).default?.decompressFromUTF16;
    interface Scene { name: string; lookup: Lookup; projectId: string; mmId: string; m1Id: string }
    const loadScene = async (file: string): Promise<Scene> => {
        const project = JSON.parse(readFileSync(new URL(`./fixtures/${file}`, import.meta.url), 'utf8'));
        const state = JSON.parse(await decompressFromUTF16(project.state));
        return { name: file, lookup: state.idlookup ?? state, projectId: project.id, mmId: project.metamodels[0], m1Id: project.models[0] };
    };
    const configure = (sc: Scene, preset: string, m1Decls?: unknown[]): void => {
        const mm = sc.lookup[sc.mmId];
        mm._state = { ...(mm._state ?? {}) };
        const profile = systemProfile(preset as any)!;
        const bindings = profileBindings(profile, sketchOfMetamodel(sc.lookup, sc.mmId), mm._state)!;
        const classIds = Object.keys(sc.lookup).filter(k => sc.lookup[k]?.className === 'DClass' && !sc.lookup[k].abstract);
        const first = profilePatch(profile, mm._state, bindings, sc.lookup, classIds);
        if (first.kind !== 'write') throw new Error(`${sc.name}: refused`);
        let bag = { ...mm._state, ...first.patch };
        const again = profilePatch(profile, mm._state, bindings, sc.lookup, classIds, boundEstimate(sc.lookup, sc.mmId, bag));
        if (again.kind === 'write') bag = { ...mm._state, ...again.patch };
        mm._state = { ...bag, simEnabled: true };
        if (m1Decls) sc.lookup[sc.m1Id]._state = { simStateAttributes: JSON.stringify({ v: 1, attrs: m1Decls }) };
    };
    const ev = (sc: Scene, label: string): string => {
        const stc = netStcFromRoles(runBag(sc.lookup[sc.mmId]._state, sc.lookup))!;
        const hit = eventAlphabet(stc, makeNetModelView(sc.lookup, stc.eventIdentifier), collectModelObjectIds(sc.lookup, sc.m1Id)).find(e => e.label === label);
        if (!hit) throw new Error(`no event ${label}`);
        return hit.id;
    };
    const tr = (sc: Scene, name: string): string => getSimRun(sc.m1Id)!.net.transitions.find(x => x.origin.some(o => sc.lookup[o]?.name === name))!.id;
    type Press = [string | null, string | undefined];
    const ESM_DECLS = [
        { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
        { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, equation: 'model.[coins] >= 2' },
    ];
    const FLOWB_DECLS = [{ name: 'count', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' }];
    const SCENES: Array<{ file: string; which: string; preset: string; decls?: unknown[]; path: (sc: Scene) => Press[] }> = [
        { file: 'scene_1_DemoPEST.jjodel', which: 'PEST', preset: 'stateMachine', path: sc => ['push', 'coin', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'push', 'stop'].map(e => [ev(sc, e), undefined] as Press) },
        { file: 'scene_2_DemoPetri.jjodel', which: 'Petri', preset: 'petri', path: sc => [[null, tr(sc, 't1')], [null, tr(sc, 't3')], [null, tr(sc, 't2')], [null, undefined]] },
        { file: 'scene_3_DemoESM.jjodel', which: 'ESM', preset: 'extendedStateMachine', decls: ESM_DECLS, path: sc => ['push', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'coin', 'coin', 'coin'].map(e => [ev(sc, e), undefined] as Press) },
        { file: 'scene_4_DemoFlowB.jjodel', which: 'FlowB', preset: 'flowchart', decls: FLOWB_DECLS, path: () => Array.from({ length: 6 }, () => [null, undefined] as Press) },
    ];
    const DYNAMIC = new Set(['exception', 'absent-identifier', 'non-boolean', 'no-handle']);
    for (const def of SCENES) {
        for (const withDecls of def.decls ? [true, false] : [true]) {
            __resetSimRunsForTests();
            const sc = await loadScene(def.file);
            configure(sc, def.preset, withDecls ? def.decls : undefined);
            const r = startRun(sc.lookup, sc.m1Id, sc.mmId, sc.projectId, recordOf(sc.lookup, sc.m1Id), 12345);
            if (r.kind !== 'started') throw new Error(r.reason);
            simReset(sc.m1Id, r.run);
            const sites = new Set(r.run.net.transitions.flatMap(t => t.guardSites));
            const nameOf = (x: string) => sc.lookup[x.split('#')[0]]?.name ?? x;
            const reset = defectsLine(r.run.net, sc.lookup, r.compileDefects ?? []);
            const dynamic: string[] = [];
            const statics: string[] = [];
            const atPress: string[] = [];
            const scan = (step: number, pressed: string | null | undefined) => {
                const run = getSimRun(sc.m1Id)!;
                for (const e of [null, ...run.alphabet]) {
                    const cs = candidates(run.net, { state: run.config.state, event: e }, run.guards);
                    for (const x of cs.evaluated) {
                        const o: any = x.outcome.kind === 'else' ? x.outcome.outcome : x.outcome;
                        if (o.kind !== 'defect') continue;
                        const item = `step ${step} ${e === null ? 'ε' : nameOf(e)}: ${nameOf(x.transition)} ${o.reason}`;
                        (DYNAMIC.has(o.reason) ? dynamic : statics).push(item);
                        if (pressed !== undefined && e === pressed) atPress.push(item);
                    }
                }
            };
            const path = def.path(sc);
            scan(0, undefined);
            const lines: string[] = [];
            for (const [i, [e, sel]] of path.entries()) {
                // The defects of the configuration the press is read on, for the input pressed.
                scan(i, e);
                const p = pressInput(sc.m1Id, e, sel, sc.lookup, e === null ? 'ε' : nameOf(e));
                lines.push(p.lastStep ?? (p.pending ? `pending ${p.pending.length}` : 'nothing'));
                // The panel turns every input off once the run is Halted (R-SIM-29): the path ends there.
                if (getSimRun(sc.m1Id)!.halt !== null) break;
            }
            note(`9 ${def.which}${def.decls ? (withDecls ? ' with declarations' : ' without declarations') : ''}`, {
                guardSites: [...sites].map(nameOf), reset, dynamicDefects: dynamic.length, staticDefects: statics.length,
                firstDynamic: dynamic[0] ?? null, defectsAtThePressedInput: atPress, lastSteps: lines,
            });
            // The parity oracle of R-SIM-144 (Phase 2): the Reset defects in full and the run warnings, byte for byte.
            note(`9 parity ${def.which}${def.decls ? (withDecls ? ' with declarations' : ' without declarations') : ''}`, {
                compileDefects: r.compileDefects ?? null, runWarnings: (r as { runWarnings?: unknown }).runWarnings ?? null,
            });
        }
    }
}

console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
