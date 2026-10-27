/**
 * io-board-outputs probe (P-2026-10-03-1845, the I/O board discovery, questions 2, 3 and 4).
 *
 * Questions:
 *   Q4  can a board output, a read-only JjEL expression over σ, be evaluated after each step with `event` null and
 *       `self` the model root, as `derivedEvaluator.ts` evaluates a global DEFINE; what it costs per step with ten
 *       outputs; whether `X.[marked]` reads under the State machine profile (no state attributes).
 *   Q3  which outputs the run's own checks (`checkGuardSubset`, `stcChecks.checkGuard`) flag before evaluation: an
 *       undeclared attribute, `node.[x]`, `event`, `.[marked]` on a non-place.
 *   Q2  whether a board record in the M1 bag moves `runSignature` (key `simBoard` versus `ioBoard`), and whether it
 *       survives save, the `.jjodel` text, import (which renews every id by string replacement) and the reopen
 *       (VersionFixer), with the event id it names remapped to the imported `coin`.
 *
 * Scene: DemoESM imported from `fixtures/scene_3_DemoESM.jjodel` (byte copy of
 * `~/jjodel-demo-exports/scene_3_DemoESM.jjodel`). Set up in the page, not through the UI: the metamodel bag gets
 * `simEnabled` and the Extended state machine preset through `profileBindings` and `profilePatch` (the panel's
 * Apply), the model bag the demo's two globals (`coins` range 0..3 initial 0, `paid` derived `model.[coins] >= 2`,
 * docs/demo/models_2026_simulator_demo.md §2.3). The run is started with `startRun` and stepped with `pressInput`,
 * the panel's own functions; nothing is clicked. The snapshot outputs read is frozen a second time from the same
 * builder `startRun` uses, since `SimRun` does not carry it (that is the seam the report names), and the time of that
 * second freeze is measured too.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/io-board-outputs.ts \
 *         --port 3079 --id P-2026-10-03-1845
 * Env:  IOB_REPS  evaluations of the ten outputs per step for the timing (default 200)
 *       IOB_OUT   JSON output (default frontend/scripts/smoke/_tmp_io-board-outputs.json, gitignored)
 */
import { chromium, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3079/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const FIXTURE = new globalThis.URL('./fixtures/scene_3_DemoESM.jjodel', import.meta.url).pathname;
const REPS = Number(process.env.IOB_REPS || 200);
const OUT = process.env.IOB_OUT || new globalThis.URL('../smoke/_tmp_io-board-outputs.json', import.meta.url).pathname;

const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

// ── Page side (plain strings: no transform) ────────────────────────────────────────────────────
const SETUP = String.raw`(async () => {
  const w = window;
  const idl = () => w.windoww.store.getState().idlookup;
  const all = () => Object.values(idl()).filter((d) => d && typeof d === 'object');
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const mm = all().find((d) => d.className === 'DModel' && d.isMetamodel && d.name === 'DemoESM');
  const m1 = all().find((d) => d.className === 'DModel' && !d.isMetamodel && d.name === 'demoESM');
  const M = w.__iob = {
    RS: await import('/src/components/editor-v2/sim/simRoleStatus.ts'),
    SK: await import('/src/components/editor-v2/sim/metamodelSketch.ts'),
    PR: await import('/src/model/simulation/simProfiles.ts'),
    B: await import('/src/components/editor-v2/sim/simBridge.ts'),
    R: await import('/src/components/editor-v2/sim/simRunState.ts'),
    C: await import('/src/model/simulation/stateAttributesCodec.ts'),
    GC: await import('/src/model/simulation/guardContext.ts'),
    NS: await import('/src/model/simulation/netStep.ts'),
    P: await import('/src/jjel/parser/index.ts'),
    SC: await import('/src/model/simulation/subsetChecker.ts'),
    ST: await import('/src/model/simulation/stcChecks.ts'),
    TS: await import('/src/model/jjelTriState.ts'),
    EV: await import('/src/jjel/evaluator/index.ts'),
    JS: await import('/src/jjscript/index.ts'),
    J: await import('/src/joiner/index.ts'),
    mm: mm && mm.id, m1: m1 && m1.id,
  };
  M.projectId = (() => { try { return L(M.J.DUser.current).project.id; } catch (e) { return null; } })();
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
  return { mm: M.mm, m1: M.m1, projectId: M.projectId };
})()`;

/** Declares the demo's globals on the model, starts a run, freezes the outputs' snapshot (timed). */
const START = String.raw`(async () => {
  const w = window; const M = w.__iob;
  const idl = () => w.windoww.store.getState().idlookup;
  const started = M.B.startRun(idl(), M.m1, M.mm, M.projectId, M.JS.buildEvalContext, 12345);
  if (started.kind !== 'started') return { refused: started.reason };
  M.R.simReset(M.m1, started.run);
  const t0 = performance.now();
  M.snap = M.GC.freezeSnapshot(M.JS.buildEvalContext(M.B.evalContextFor(idl(), M.m1, M.projectId), { extentModelId: M.m1 }),
    { id: M.m1, name: String(idl()[M.m1].name || '') });
  const freezeMs = performance.now() - t0;
  const run = M.R.getSimRun(M.m1);
  return {
    freezeMs, places: [...run.net.places].map((p) => idl()[p] && idl()[p].name),
    attributes: run.net.attributes.map((d) => d.name + (d.equation ? ' (DEFINE)' : d.input ? ' (IVAR)' : ' (VAR)')),
    defects: (started.compileDefects || []).map((d) => d.short || d.detail),
  };
})()`;

/** Compiles the outputs as a global DEFINE is compiled (parse, subset, event), plus the guard's R1/R2 (stcChecks). */
const COMPILE = (texts: string[]) => String.raw`(async () => {
  const w = window; const M = w.__iob;
  const idl = () => w.windoww.store.getState().idlookup;
  const run = M.R.getSimRun(M.m1);
  const scope = { snapshot: M.snap, net: run.net, nameOf: (id) => (idl()[id] && idl()[id].name) || id };
  const visit = (n, f) => { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) { n.forEach((x) => visit(x, f)); return; }
    f(n); for (const [k, v] of Object.entries(n)) if (k !== 'location') visit(v, f); };
  M.outputs = ${JSON.stringify(texts)}.map((text) => {
    const parsed = M.P.parseExpressionStrict(text);
    if (parsed.errors.length > 0 || !parsed.expression) return { text, expr: null, defect: 'parse: ' + (parsed.errors[0] && parsed.errors[0].message) };
    const sub = M.SC.checkGuardSubset(parsed.expression, text).find((d) => d.severity === 'error');
    if (sub) return { text, expr: null, defect: 'subset: ' + sub.code };
    let ev = false; visit(parsed.expression, (e) => { if (e.type === 'Identifier' && e.name === 'event') ev = true; });
    if (ev) return { text, expr: null, defect: 'event: reads event' };
    const st = M.ST.checkGuard(parsed.expression, M.m1, scope);
    if (st && st.reason !== 'value') return { text, expr: null, defect: st.reason + ': ' + st.short };
    return { text, expr: parsed.expression, defect: null };
  });
  return M.outputs.map((o) => ({ text: o.text, defect: o.defect }));
})()`;

/** Evaluates every compiled output on the live σ: `self` the model root, `event` null, σ through the core's accessor. */
const EVAL_FN = String.raw`
  const w = window; const M = w.__iob;
  if (!M.EVAL) M.EVAL = new M.EV.JjelEvaluator();
  const evalAll = () => {
    const run = M.R.getSimRun(M.m1);
    const state = run.config.state;
    return M.outputs.map((o) => {
      if (!o.expr) return 'flagged';
      const ctx = M.snap.base.child({ self: M.snap.model, event: null, model: M.snap.model });
      ctx.stateAccess = M.GC.toJjelStateAccess(M.NS.stateAccess(state, M.m1), run.net.places);
      const out = M.TS.evaluateTriState(M.EVAL, o.expr, ctx);
      return out.kind === 'verdict' ? out.value : out.kind === 'non-boolean' ? out.value : ('defect ' + out.kind);
    });
  };`;

const RUN = (events: string[], reps: number) => String.raw`(async () => {
  ${EVAL_FN}
  const idl = () => w.windoww.store.getState().idlookup;
  const ev = (n) => Object.values(idl()).find((d) => d && d.className === 'DObject' && d.name === n && d.father === M.m1);
  const time = (f, n) => { const t0 = performance.now(); for (let i = 0; i < n; i++) f(); return (performance.now() - t0) / n; };
  const rows = [{ step: 0, press: 'Reset', values: evalAll(), evalMs: time(evalAll, ${reps}) }];
  let pressMs = 0;
  for (const name of ${JSON.stringify(events)}) {
    const e = ev(name);
    const t0 = performance.now();
    const p = M.B.pressInput(M.m1, e.id, undefined, idl(), name);
    pressMs += performance.now() - t0;
    const run = M.R.getSimRun(M.m1);
    rows.push({ step: (run.trace || []).length, press: name, last: p.lastStep, values: evalAll(), evalMs: time(evalAll, ${reps}) });
  }
  return { rows, pressMsMean: pressMs / ${events.length} };
})()`;

/** The board record in the model bag: does it move runSignature, under `simBoard` and under `ioBoard`. */
const SIGNATURE = String.raw`(async () => {
  const w = window; const M = w.__iob;
  const idl = () => w.windoww.store.getState().idlookup;
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const sig = () => M.B.runSignature(idl(), M.m1, M.mm);
  const coin = Object.values(idl()).find((d) => d && d.className === 'DObject' && d.name === 'coin' && d.father === M.m1);
  const record = JSON.stringify({ v: 1, devices: [{ id: 'd1', kind: 'button', binding: { kind: 'event', event: coin.id } }] });
  const out = { base: sig().length };
  L(M.m1).state = { simBoard: record };
  await new Promise((r) => setTimeout(r, 500));
  out.simBoardMoves = sig() !== M.R.getSimRun(M.m1).signature;
  L(M.m1).state = { simBoard: undefined };
  await new Promise((r) => setTimeout(r, 500));
  out.simBoardKeyAfterUndefined = Object.prototype.hasOwnProperty.call(idl()[M.m1]._state || {}, 'simBoard');
  out.afterClearMoves = sig() !== M.R.getSimRun(M.m1).signature;
  L(M.m1).state = { ioBoard: record };
  await new Promise((r) => setTimeout(r, 500));
  out.ioBoardMoves = sig() !== M.R.getSimRun(M.m1).signature;
  out.ioBoardStored = idl()[M.m1]._state && idl()[M.m1]._state.ioBoard === record;
  out.bagKeys = Object.keys(idl()[M.m1]._state || {}).sort();
  out.coinId = coin.id;
  return out;
})()`;

const SAVE_EXPORT = String.raw`(async () => {
  const w = window; const M = w.__iob;
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const api = await import('/src/api/persistance/projects.ts');
  const saved = await api.ProjectsApi.save(L(M.projectId), { silent: true });
  const U = (await import('/src/common/U.tsx')).U;
  const raw = JSON.parse(localStorage.getItem('projects') || '[]').find((p) => p.id === M.projectId);
  const st = JSON.parse(await U.decompressState(raw.state));
  const m1 = st.idlookup[M.m1];
  return { text: JSON.stringify(raw), savedBag: m1 && m1._state, savedHasKey: !!(m1 && m1._state && m1._state.ioBoard) };
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

const REOPENED = String.raw`(async () => {
  const w = window;
  const idl = () => w.windoww.store.getState().idlookup;
  const all = () => Object.values(idl()).filter((d) => d && typeof d === 'object');
  const m1 = all().find((d) => d.className === 'DModel' && !d.isMetamodel && d.name === 'demoESM');
  const raw = m1 && m1._state && m1._state.ioBoard;
  let named = null;
  try { named = JSON.parse(raw).devices[0].binding.event; } catch (e) { named = 'unreadable: ' + String(raw); }
  const target = named && idl()[named];
  return { m1: m1 && m1.id, bagKeys: Object.keys((m1 && m1._state) || {}).sort(), named, namedResolves: !!target,
    namedIs: target ? target.name : null, namedFather: target ? target.father === (m1 && m1.id) : null };
})()`;

// ── Main ──────────────────────────────────────────────────────────────────────────────────────
const OUTPUTS = [
    'locked.[marked]', 'unlocked.[marked]', 'off.[marked]',
    'model.[coins]', 'model.[paid]', 'model.[coins] >= 2', 'model.[coins] * 10 + 1',
    'model.[paid] and locked.[marked]', 'unlocked.[marked] or off.[marked]', 'not model.[paid]',
];
const FLAGGED = ['model.[nope]', 'node.[shade]', 'event.name', 'model.[coins] + event', 'tc.[marked]'];
const ESM_PRESSES = ['push', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'coin', 'coin', 'coin'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
await seed(ctx, true);
const page: Page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
const result: any = { url: URL, reps: REPS };
const save = () => writeFileSync(OUT, JSON.stringify(result, null, 1));

try {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 6000);
    const fixtureText = readFileSync(FIXTURE, 'utf8');
    const project = await page.evaluate(IMPORT(fixtureText)) as string | null;
    check('fixture imported', !!project, String(project));
    await page.goto(`${URL}/#/project?id=${project}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 10000);

    const setup: any = await page.evaluate(SETUP);
    result.setup = setup;
    check('models found', !!setup.mm && !!setup.m1 && !!setup.projectId, JSON.stringify(setup));
    const esm: any = await page.evaluate(`window.__iob.applyProfile('extendedStateMachine')`);
    result.esmProfile = esm;
    check('ESM profile applied', !esm.refused, JSON.stringify(esm));
    await page.evaluate(String.raw`(async () => {
      const w = window; const M = w.__iob;
      const L = (x) => w.LPointerTargetable.fromPointer(x);
      L(M.m1).state = { simStateAttributes: M.C.encodeStateAttributes([
        { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
        { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: '', equation: 'model.[coins] >= 2' },
      ]) };
    })()`);
    await wait(page, 800);

    // Q4 on Extended state machine.
    const startEsm: any = await page.evaluate(START);
    result.startEsm = startEsm;
    note('esm start', startEsm);
    check('ESM run started without defects', !startEsm.refused && startEsm.defects.length === 0, JSON.stringify(startEsm.defects));
    const compiledEsm: any = await page.evaluate(COMPILE(OUTPUTS));
    result.compiledEsm = compiledEsm;
    check('ten outputs compile on ESM', compiledEsm.every((o: any) => o.defect === null), JSON.stringify(compiledEsm.filter((o: any) => o.defect)));
    const runEsm: any = await page.evaluate(RUN(ESM_PRESSES, REPS));
    result.runEsm = runEsm;
    for (const r of runEsm.rows) note(`esm step ${r.step} ${r.press}`, { last: r.last, values: r.values, evalMs: Number(r.evalMs.toFixed(4)) });
    const evalMs = runEsm.rows.map((r: any) => r.evalMs);
    note('esm ten outputs per step, ms', { min: Math.min(...evalMs), max: Math.max(...evalMs), mean: evalMs.reduce((a: number, b: number) => a + b, 0) / evalMs.length, pressMsMean: runEsm.pressMsMean });
    const last = runEsm.rows[runEsm.rows.length - 1];
    check('step 5 reads unlocked, coins 0', runEsm.rows[5].values[1] === true && runEsm.rows[5].values[3] === 0, JSON.stringify(runEsm.rows[5].values));
    check('step 10 halted at coins 3, paid', last.values[3] === 3 && last.values[4] === true && last.values[0] === true, JSON.stringify(last.values));
    // A bad output is flagged at compile, or its evaluation is a defect: never a value, never a throw out of the board.
    const flaggedEsm: any = await page.evaluate(COMPILE(FLAGGED));
    const flaggedValues: any = await page.evaluate(String.raw`(async () => { ${EVAL_FN} return evalAll(); })()`);
    result.flaggedEsm = flaggedEsm.map((f: any, i: number) => ({ ...f, evaluated: flaggedValues[i] }));
    for (const f of result.flaggedEsm) note('esm flagged', f);
    check('five bad outputs flagged at compile or at evaluation', flaggedValues.every((v: any) => v === 'flagged' || String(v).startsWith('defect')),
        JSON.stringify(result.flaggedEsm));

    // Q2: the record's key against runSignature, then save, the .jjodel text, import, reopen.
    const sig: any = await page.evaluate(SIGNATURE);
    result.signature = sig;
    note('signature', sig);
    check('a simBoard key interrupts the run (moves runSignature)', sig.simBoardMoves === true, JSON.stringify(sig));
    check('an ioBoard key does not', sig.ioBoardMoves === false && sig.ioBoardStored === true, JSON.stringify(sig));
    const saved: any = await page.evaluate(SAVE_EXPORT);
    result.saved = { savedBag: saved.savedBag, savedHasKey: saved.savedHasKey, textBytes: saved.text.length };
    check('saved state carries ioBoard', saved.savedHasKey === true, JSON.stringify(saved.savedBag && Object.keys(saved.savedBag)));

    // Q4 on State machine: no state attributes; X.[marked] still reads.
    const sm: any = await page.evaluate(`window.__iob.applyProfile('stateMachine')`);
    result.smProfile = sm;
    await wait(page, 800);
    const startSm: any = await page.evaluate(START);
    result.startSm = startSm;
    note('sm start', startSm);
    const compiledSm: any = await page.evaluate(COMPILE(['locked.[marked]', 'unlocked.[marked]', 'off.[marked]', 'model.[coins]']));
    result.compiledSm = compiledSm;
    for (const c of compiledSm) note('sm compiled', c);
    check('X.[marked] compiles under State machine', compiledSm.slice(0, 3).every((o: any) => o.defect === null), JSON.stringify(compiledSm));
    check('model.[coins] flagged under State machine', compiledSm[3].defect !== null, JSON.stringify(compiledSm[3]));
    const runSm: any = await page.evaluate(RUN(['coin', 'push', 'stop'], REPS));
    result.runSm = runSm;
    for (const r of runSm.rows) note(`sm step ${r.step} ${r.press}`, { last: r.last, values: r.values });
    check('State machine LEDs follow the configuration', runSm.rows[0].values[0] === true && runSm.rows[runSm.rows.length - 1].values[2] === true,
        JSON.stringify(runSm.rows.map((r: any) => r.values.slice(0, 3))));

    // Import of the saved text: every id renewed by string replacement; reopen runs the load path.
    const imported = await page.evaluate(IMPORT(saved.text)) as string | null;
    check('saved text imported', !!imported, String(imported));
    await page.goto(`${URL}/#/project?id=${imported}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 10000);
    const reopened: any = await page.evaluate(REOPENED);
    result.reopened = reopened;
    note('reopened', reopened);
    check('ioBoard survives import and reopen', reopened.bagKeys.includes('ioBoard'), JSON.stringify(reopened.bagKeys));
    check('its event id is remapped to the imported coin', reopened.namedResolves && reopened.namedIs === 'coin' && reopened.namedFather === true
        && reopened.named !== sig.coinId, JSON.stringify(reopened));
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
