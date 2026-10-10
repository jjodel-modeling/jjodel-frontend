/**
 * sim-event-attrs-browser probe (P-2026-10-10-1630, item 1 of the event attributes discovery; the node probe is
 * `sim-event-attrs.ts`, the report docs/discovery/discovery_2026-10-10_sim_event_attributes.md).
 *
 * Question: does the app's `buildEvalContext` read an event attribute as the node probe's stand-in does? The stand-in
 * (sim-verif-bench.ts `recordOf`) copies the raw DValue values; `buildEvalContext` reads an attribute through the L
 * getter (`fillInstanceSlots`, jjscript/executor/commands/eval.ts) and fills an empty single slot with
 * `emptyAttributeDefault`. The two may differ on an unset EInt (null, 0 or undefined), on a mandatory one, on a
 * declared default, on an enumeration (literal pointer or name) and on a value stored as text.
 *
 * Scene: DemoESM imported from `fixtures/scene_3_DemoESM.jjodel`. In the page, through the L API (no click): the
 * metamodel's `Event` gains `amount: EInt`, `hot: EBoolean`, `label: EString`, `size: Size` (a new enumeration
 * {S, M, L}), `home -> State`, `tags: EInt [0..*]`, `need: EInt [1..1]`, `dflt: EInt` with default 7, `text: EInt`
 * written as the string "50". `coin` gets every slot set, `push` some, `stop` none (the slots the M2 edit created,
 * left as they are). Then the Extended state machine preset is applied as the panel's Apply writes it, the model
 * declares `credit` (0..200), `tc`'s effect becomes `model.[credit] := model.[credit] + event.amount`, a run is
 * started with `startRun` and the app's `buildEvalContext`, and `coin` is pressed with `pressInput`.
 *
 * Readings, each a MEAS line: the raw DValue values; the handle `buildEvalContext` builds; the stand-in's handle on the
 * same idlookup; `event.<f>` evaluated in the run's guard context (its frozen snapshot) on `tc`; the press.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/sim-event-attrs-browser.ts \
 *         --port 3097 --id P-2026-10-10-1630
 * Env:  SEA_OUT   JSON output (default frontend/scripts/smoke/_tmp_sim-event-attrs-browser.json, gitignored)
 */
import { chromium, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3097/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const FIXTURE = new globalThis.URL('./fixtures/scene_3_DemoESM.jjodel', import.meta.url).pathname;
const OUT = process.env.SEA_OUT || new globalThis.URL('../smoke/_tmp_sim-event-attrs-browser.json', import.meta.url).pathname;

const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

const FEATURES = ['amount', 'hot', 'label', 'size', 'home', 'tags', 'need', 'dflt', 'text'];

// ── Page side (plain strings: no transform) ────────────────────────────────────────────────────
const SETUP = String.raw`(async () => {
  const w = window;
  const idl = () => w.windoww.store.getState().idlookup;
  const all = () => Object.values(idl()).filter((d) => d && typeof d === 'object');
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const mm = all().find((d) => d.className === 'DModel' && d.isMetamodel && d.name === 'DemoESM');
  const m1 = all().find((d) => d.className === 'DModel' && !d.isMetamodel && d.name === 'demoESM');
  const M = w.__sea = {
    RS: await import('/src/components/editor-v2/sim/simRoleStatus.ts'),
    SK: await import('/src/components/editor-v2/sim/metamodelSketch.ts'),
    PR: await import('/src/model/simulation/simProfiles.ts'),
    B: await import('/src/components/editor-v2/sim/simBridge.ts'),
    R: await import('/src/components/editor-v2/sim/simRunState.ts'),
    C: await import('/src/model/simulation/stateAttributesCodec.ts'),
    GC: await import('/src/model/simulation/guardContext.ts'),
    GE: await import('/src/model/simulation/guardEvaluator.ts'),
    P: await import('/src/jjel/parser/index.ts'),
    EV: await import('/src/jjel/evaluator/index.ts'),
    JS: await import('/src/jjscript/index.ts'),
    J: await import('/src/joiner/index.ts'),
    mm: mm && mm.id, m1: m1 && m1.id,
  };
  M.projectId = (() => { try { return L(M.J.DUser.current).project.id; } catch (e) { return null; } })();
  const cls = (n) => all().find((d) => d.className === 'DClass' && d.name === n);
  const obj = (n) => all().find((d) => d.className === 'DObject' && d.name === n);
  M.ids = { Event: cls('Event') && cls('Event').id, State: cls('State') && cls('State').id,
    coin: obj('coin') && obj('coin').id, push: obj('push') && obj('push').id, stop: obj('stop') && obj('stop').id,
    tc: obj('tc') && obj('tc').id, locked: obj('locked') && obj('locked').id, unlocked: obj('unlocked') && obj('unlocked').id };
  M.applyProfile = (id) => {
    const lookup = idl();
    const bag = lookup[M.mm]._state || {};
    const profile = M.PR.systemProfile(id);
    const sketch = M.SK.sketchOfMetamodel(lookup, M.mm);
    const bindings = M.RS.profileBindings(profile, sketch, bag);
    const classIds = all().filter((d) => d.className === 'DClass' && !d.abstract).map((d) => d.id);
    const res = M.RS.profilePatch(profile, bag, bindings, lookup, classIds, null);
    if (res.kind !== 'write') return { refused: true };
    L(M.mm).state = { ...res.patch, simEnabled: true };
    return { keys: Object.keys(res.patch).sort() };
  };
  return { mm: M.mm, m1: M.m1, projectId: M.projectId, ids: M.ids };
})()`;

/** The M2 edit: nine attributes and a reference on Event, an enumeration Size {S, M, L}. */
const ADD_FEATURES = String.raw`(async () => {
  const w = window; const M = w.__sea;
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const ev = L(M.ids.Event);
  const out = {};
  const add = (n, t) => { const a = ev.addAttribute(n, t); out[n] = a ? a.id : null; return a; };
  add('amount', 'Pointer_EINT'); add('hot', 'Pointer_EBOOLEAN'); add('label', 'Pointer_ESTRING');
  add('tags', 'Pointer_EINT'); add('need', 'Pointer_EINT'); add('dflt', 'Pointer_EINT'); add('text', 'Pointer_EINT');
  const pkg = L(M.mm).packages[0];
  const en = pkg.addEnumerator('Size');
  out.Size = en ? en.id : null;
  out.literals = {};
  for (const l of ['S', 'M', 'L']) { const lit = en.addLiteral(l); out.literals[l] = lit ? lit.id : null; }
  add('size', out.Size);
  const r = ev.addReference('home', M.ids.State);
  out.home = r ? r.id : null;
  await new Promise((r) => setTimeout(r, 600));
  L(out.tags).upperBound = -1;
  L(out.need).lowerBound = 1;
  let dfltSet = 'ok';
  try { L(out.dflt).defaultValue = 7; } catch (e) { dfltSet = String(e && e.message || e); }
  await new Promise((r) => setTimeout(r, 600));
  M.f = out;
  const d = w.windoww.store.getState().idlookup;
  return { ids: out, dfltSet, bounds: { tags: d[out.tags].upperBound, need: d[out.need].lowerBound, dflt: d[out.dflt].defaultValue } };
})()`;

/** The M1 values: coin all set, push some, stop none. `text` is written as the string "50". */
const SET_VALUES = String.raw`(async () => {
  const w = window; const M = w.__sea;
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const errs = [];
  const set = (o, n, v, many) => { try { const s = L(o)['$' + n]; if (!s) { errs.push(o + '.' + n + ': no slot'); return; } if (many) s.values = v; else s.value = v; } catch (e) { errs.push(o + '.' + n + ': ' + (e && e.message || e)); } };
  const c = M.ids.coin, p = M.ids.push;
  set(c, 'amount', 50); set(c, 'hot', true); set(c, 'label', 'fifty'); set(c, 'size', M.f.literals.L); set(c, 'home', [M.ids.locked], true);
  set(c, 'tags', [1, 2], true); set(c, 'need', 5); set(c, 'text', '50');
  set(p, 'amount', 20); set(p, 'hot', false); set(p, 'size', M.f.literals.M); set(p, 'home', [M.ids.unlocked], true);
  await new Promise((r) => setTimeout(r, 1200));
  return { errs };
})()`;

/** What the D-layer stores, what buildEvalContext builds, what the stand-in builds, on the same idlookup. */
const READ = (features: string[]) => String.raw`(async () => {
  const w = window; const M = w.__sea;
  const idl = () => w.windoww.store.getState().idlookup;
  const lookup = idl();
  const feats = ${JSON.stringify(features)};
  const show = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v.__type === 'Object' ? '<' + v.name + '>' : 'object') : Array.isArray(v) ? v.map(show) : v === undefined ? 'undefined' : v);
  const raw = {};
  for (const n of ['coin', 'push', 'stop']) {
    const o = lookup[M.ids[n]]; raw[n] = {};
    for (const vid of o.features || []) { const v = lookup[vid]; const f = lookup[v && v.instanceof]; if (f && feats.includes(f.name)) raw[n][f.name] = v.values; }
  }
  const globals = M.JS.buildEvalContext(M.B.evalContextFor(lookup, M.m1, M.projectId), { extentModelId: M.m1 });
  const app = {};
  for (const n of ['coin', 'push', 'stop']) {
    const h = (globals.instances || []).find((x) => x && x.id === M.ids[n]); app[n] = {};
    for (const f of feats) app[n][f] = h ? (f in h ? show(h[f]) : 'absent') : 'no handle';
  }
  // The node probe's stand-in (sim-verif-bench.ts recordOf), on the same lookup.
  const ids = M.B.collectModelObjectIds(lookup, M.m1);
  const hh = {};
  for (const id of ids) hh[id] = { id, __type: 'Object', name: lookup[id] && lookup[id].name || id };
  for (const id of ids) for (const vid of (lookup[id] && lookup[id].features) || []) {
    const v = lookup[vid]; const feat = lookup[v && v.instanceof]; if (!feat || !feat.name) continue;
    const vals = (v.values || []).map((x) => (typeof x === 'string' && hh[x] ? hh[x] : x));
    hh[id][feat.name] = (feat.upperBound === 1 || feat.upperBound === undefined) && vals.length <= 1 ? (vals[0] === undefined ? null : vals[0]) : vals;
  }
  const stand = {};
  for (const n of ['coin', 'push', 'stop']) { stand[n] = {}; for (const f of feats) stand[n][f] = f in hh[M.ids[n]] ? show(hh[M.ids[n]][f]) : 'absent'; }
  return { raw, app, stand };
})()`;

/** Preset, globals, tc's effect, a run with the app's builder; event reads on tc in the run's guard context; a press. */
const RUN = (reads: string[]) => String.raw`(async () => {
  const w = window; const M = w.__sea;
  const idl = () => w.windoww.store.getState().idlookup;
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const applied = M.applyProfile('extendedStateMachine');
  L(M.m1).state = { simStateAttributes: M.C.encodeStateAttributes([
    { name: 'credit', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 200 }, initial: '0' },
  ]) };
  L(M.ids.tc).$effect.values = ['model.[credit] := model.[credit] + event.amount'];
  await new Promise((r) => setTimeout(r, 1200));
  const started = M.B.startRun(idl(), M.m1, M.mm, M.projectId, M.JS.buildEvalContext, 12345);
  if (started.kind !== 'started') return { applied, refused: started.reason };
  M.R.simReset(M.m1, started.run);
  const run = started.run;
  const EVAL = new M.EV.JjelEvaluator();
  const show = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v.__type === 'Object' ? '<' + v.name + '>' : 'object') : Array.isArray(v) ? v.map(show) : v === undefined ? 'undefined' : v);
  const readings = {};
  for (const n of ['coin', 'push', 'stop']) {
    readings[n] = {};
    const ctx = M.GC.buildGuardContext(run.snapshot, { transitionId: M.ids.tc }, { event: M.ids[n] });
    for (const t of ${JSON.stringify(reads)}) {
      const parsed = M.P.parseExpressionStrict(t);
      try { const out = EVAL.evaluateWithDiagnostics(parsed.expression, ctx); readings[n][t] = out.warnings.length ? { value: show(out.value), warnings: out.warnings.map((x) => x.kind) } : show(out.value); }
      catch (e) { readings[n][t] = 'throws ' + (e && e.message); }
    }
    const g = M.GE.evaluateGuard(M.GE.compileGuard('event.amount > 15'), ctx);
    readings[n]['guard event.amount > 15'] = g.kind === 'defect' ? 'defect ' + g.reason : g.kind;
  }
  const p = M.B.pressInput(M.m1, M.ids.coin, undefined, idl(), 'coin');
  const after = M.R.getSimRun(M.m1);
  const credit = Object.fromEntries((after.config.state.attrs.get(M.m1)) || []);
  const defects = (started.compileDefects || []).map((d) => d.short || d.detail);
  return { applied, defects, readings, press: p.lastStep, credit, halt: after.halt && after.halt.kind };
})()`;

const IMPORT = (text: string) => String.raw`(async () => {
  const api = await import('/src/api/persistance/projects.ts');
  const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
  const before = count();
  await api.ProjectsApi.importFromText(${JSON.stringify(text)});
  for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
  const a = JSON.parse(localStorage.getItem('projects') || '[]');
  return a.length > before ? a[a.length - 1].id : null;
})()`;

// ── Main ──────────────────────────────────────────────────────────────────────────────────────
const READS = ['event.amount', 'event.hot', 'event.label', 'event.size', 'event.size == "L"', 'event.home', 'event.tags', 'event.need', 'event.dflt', 'event.text', 'event.text + 1', 'event.amount + 1'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
await seed(ctx, true);
const page: Page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
const result: any = { url: URL };
const save = () => writeFileSync(OUT, JSON.stringify(result, null, 1));

try {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 6000);
    const project = await page.evaluate(IMPORT(readFileSync(FIXTURE, 'utf8'))) as string | null;
    check('fixture imported', !!project, String(project));
    await page.goto(`${URL}/#/project?id=${project}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 10000);

    const setup: any = await page.evaluate(SETUP);
    result.setup = setup;
    check('models and elements found', !!setup.mm && !!setup.m1 && !!setup.projectId && Object.values(setup.ids).every(Boolean), JSON.stringify(setup));
    const added: any = await page.evaluate(ADD_FEATURES);
    result.added = added;
    note('M2 edit', added);
    const set: any = await page.evaluate(SET_VALUES);
    result.set = set;
    note('M1 writes', set);
    const read: any = await page.evaluate(READ(FEATURES));
    result.read = read;
    for (const n of ['coin', 'push', 'stop']) {
        note(`raw DValue values, ${n}`, read.raw[n]);
        note(`buildEvalContext handle, ${n}`, read.app[n]);
        note(`stand-in handle, ${n}`, read.stand[n]);
    }
    check('positive control: coin.amount written and read by the app as 50', read.app.coin.amount === 50, JSON.stringify(read.app.coin));
    const differ: string[] = [];
    for (const n of ['coin', 'push', 'stop']) for (const f of FEATURES) {
        if (JSON.stringify(read.app[n][f]) !== JSON.stringify(read.stand[n][f])) differ.push(`${n}.${f}: app ${JSON.stringify(read.app[n][f])}, stand-in ${JSON.stringify(read.stand[n][f])}`);
    }
    result.differ = differ;
    note('app and stand-in differ on', differ.length === 0 ? 'nothing' : differ);
    const run: any = await page.evaluate(RUN(READS));
    result.run = run;
    note('run', { applied: run.applied, refused: run.refused, defects: run.defects });
    for (const n of ['coin', 'push', 'stop']) if (run.readings) note(`event reads in the run's guard context on tc, ${n}`, run.readings[n]);
    note('press coin', { last: run.press, credit: run.credit, halt: run.halt });
    check('positive control: the press of coin adds event.amount to credit', run.credit?.credit === 50, JSON.stringify(run.credit));
} catch (e: any) {
    failures++;
    console.log(`FAIL  exception  ${e?.message ?? String(e)}`);
} finally {
    result.errors = errors;
    result.failures = failures;
    save();
    note('page errors', errors.length);
    for (const e of errors.slice(0, 8)) console.log(`      ${e}`);
    await browser.close();
    console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  out ${OUT}`);
    process.exit(failures === 0 ? 0 : 1);
}
