/**
 * sim-event-attrs-visual probe (P-2026-10-10-1630 Phase 2, R-SIM-144): the Reset checks of event reads and the unset
 * warning, in the app.
 *
 * Scene: DemoESM imported from `fixtures/scene_3_DemoESM.jjodel`, set up in the page as the panel's Apply writes it
 * (`console-errors-demo.ts` CONFIGURE: simEnabled, the Extended state machine preset, the demo's globals `coins` and
 * `paid`). The metamodel's `Event` gains `amount: EInt` through the L API; `coin` gets 50, `push` 20, `stop` none (the
 * vending machine's coinX). Then, each followed by a click on Reset in the model tab's simulation panel:
 *   base  no event read: no defect line, no warning line; Step's top measured;
 *   A     `tu` loses its trigger and its guard becomes `event.amount > 0`: the defects line names the `event` defect,
 *         the problems registry holds it, the dot on the canvas opens it;
 *   B     `tu` restored, `ts`'s guard `event.amount == null`: the run warning line lists `stop.amount`.
 * Step's top is the same in the three. Then the four demo scenes, each imported and configured with its preset and
 * globals, are started with `startRun` and the app's `buildEvalContext`: no defect and no warning, as before.
 *
 * Crops 600 px wide in ~/.jjodel-lanes/P-2026-10-10-1630/crops/: defect_line_600.png, warning_line_600.png,
 * problems_600.png.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/sim-event-attrs-visual.ts \
 *         --port 3098 --id P-2026-10-10-1630
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3098/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const CROPS = `${homedir()}/.jjodel-lanes/P-2026-10-10-1630/crops`;
const OUT = new globalThis.URL('../smoke/_tmp_sim-event-attrs-visual.json', import.meta.url).pathname;
const fixture = (name: string) => new globalThis.URL(`./fixtures/${name}.jjodel`, import.meta.url).pathname;
mkdirSync(CROPS, { recursive: true });

const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

const SCENES = [
    { name: 'PEST', fixture: 'scene_1_DemoPEST', mm: 'DemoPEST', m1: 'demoSM', profile: 'stateMachine', decls: [] as unknown[] },
    { name: 'Petri', fixture: 'scene_2_DemoPetri', mm: 'DemoPetri', m1: 'demoNet', profile: 'petri', decls: [] as unknown[] },
    {
        name: 'ESM', fixture: 'scene_3_DemoESM', mm: 'DemoESM', m1: 'demoESM', profile: 'extendedStateMachine', decls: [
            { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
            { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: '', equation: 'model.[coins] >= 2' },
        ] as unknown[],
    },
    {
        name: 'FlowB', fixture: 'scene_4_DemoFlowB', mm: 'DemoFlowB', m1: 'demoFlowB', profile: 'flowchart',
        decls: [{ name: 'count', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' }] as unknown[],
    },
];

// ── Page side (plain strings: no transform) ────────────────────────────────────────────────────
const IMPORT = (text: string) => String.raw`(async () => {
  const api = await import('/src/api/persistance/projects.ts');
  const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
  const before = count();
  await api.ProjectsApi.importFromText(${JSON.stringify(text)});
  for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
  const a = JSON.parse(localStorage.getItem('projects') || '[]');
  return a.length > before ? a[a.length - 1].id : null;
})()`;

const LOADED = (mm: string, m1: string) => String.raw`(() => {
  const w = window;
  try {
    const all = Object.values(w.windoww.store.getState().idlookup).filter((d) => d && typeof d === 'object');
    const a = all.find((d) => d.className === 'DModel' && d.isMetamodel && d.name === ${JSON.stringify(mm)});
    const b = all.find((d) => d.className === 'DModel' && !d.isMetamodel && d.name === ${JSON.stringify(m1)});
    return a && b && document.querySelectorAll('.dock-tab').length > 0 ? { mm: a.id, m1: b.id } : null;
  } catch (e) { return null; }
})()`;

/** The panel's Apply, written in the page (console-errors-demo.ts CONFIGURE). */
const CONFIGURE = (mmId: string, m1Id: string, profileId: string, decls: unknown[]) => String.raw`(async () => {
  const w = window;
  const idl = () => w.windoww.store.getState().idlookup;
  const all = () => Object.values(idl()).filter((d) => d && typeof d === 'object');
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const RS = await import('/src/components/editor-v2/sim/simRoleStatus.ts');
  const SK = await import('/src/components/editor-v2/sim/metamodelSketch.ts');
  const MK = await import('/src/components/editor-v2/sim/modelMarkings.ts');
  const PR = await import('/src/model/simulation/simProfiles.ts');
  const C = await import('/src/model/simulation/stateAttributesCodec.ts');
  const mm = ${JSON.stringify(mmId)}, m1 = ${JSON.stringify(m1Id)};
  L(mm).state = { simEnabled: true };
  await new Promise((r) => setTimeout(r, 300));
  const lookup = idl();
  const bag = lookup[mm]._state || {};
  const profile = PR.systemProfile(${JSON.stringify(profileId)});
  const bindings = RS.profileBindings(profile, SK.sketchOfMetamodel(lookup, mm), bag);
  const boundBag = RS.boundProposalInputs(profile, bag, bindings) ? RS.boundProposalBag(profile, bag, bindings) : null;
  const largest = boundBag ? MK.boundEstimate(lookup, mm, boundBag) : null;
  const classIds = all().filter((d) => d.className === 'DClass' && !d.abstract).map((d) => d.id);
  const res = RS.profilePatch(profile, bag, bindings, lookup, classIds, largest);
  if (res.kind !== 'write') return { error: 'profile refused' };
  L(mm).state = res.patch;
  await new Promise((r) => setTimeout(r, 300));
  const decls = ${JSON.stringify(decls)};
  if (decls.length > 0) { L(m1).state = { simStateAttributes: C.encodeStateAttributes(decls) }; await new Promise((r) => setTimeout(r, 300)); }
  return { patch: Object.keys(res.patch).sort() };
})()`;

/** `amount: EInt` on Event; coin 50, push 20, stop unset. */
const AMOUNT = String.raw`(async () => {
  const w = window;
  const all = () => Object.values(w.windoww.store.getState().idlookup).filter((d) => d && typeof d === 'object');
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const obj = (n) => all().find((d) => d.className === 'DObject' && d.name === n);
  const ev = all().find((d) => d.className === 'DClass' && d.name === 'Event');
  const a = L(ev.id).addAttribute('amount', 'Pointer_EINT');
  await new Promise((r) => setTimeout(r, 600));
  L(obj('coin').id).$amount.value = 50;
  L(obj('push').id).$amount.value = 20;
  await new Promise((r) => setTimeout(r, 900));
  const ids = {}; for (const n of ['coin', 'push', 'stop', 'tu', 'ts', 'tp', 'tc']) ids[n] = obj(n).id;
  window.__sea = { ids, amount: a && a.id };
  return window.__sea;
})()`;

/** One slot write through the L proxy, then the deferred commit. */
const SET = (obj: string, feature: string, values: unknown[]) => String.raw`(async () => {
  const w = window;
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  L(window.__sea.ids[${JSON.stringify(obj)}])['$' + ${JSON.stringify(feature)}].values = ${JSON.stringify(values)};
  await new Promise((r) => setTimeout(r, 900));
  const idl = w.windoww.store.getState().idlookup;
  const o = idl[window.__sea.ids[${JSON.stringify(obj)}]];
  const v = (o.features || []).map((x) => idl[x]).find((x) => x && idl[x.instanceof] && idl[x.instanceof].name === ${JSON.stringify(feature)});
  return v ? v.values : 'no slot';
})()`;

const PANE = (m1Id: string) => `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1Id}"]'))`;
const CLICK = (expr: string) => String.raw`(() => { const el = ${expr}; if (!el) return { found: false }; el.click(); return { found: true }; })()`;

/** The panel's lines and Step's top, read from the DOM. */
const READ = (m1Id: string) => String.raw`(() => {
  const pane = ${PANE(m1Id)};
  if (!pane) return { pane: false };
  const step = pane.querySelector('button.sim-panel__btn[title^="Step"]');
  const lines = [...pane.querySelectorAll('.sim-panel__hint--warning')].map((e) => ({ text: (e.textContent || '').trim(), title: e.getAttribute('title') || '', top: e.getBoundingClientRect().top, height: e.getBoundingClientRect().height }));
  const status = [...pane.querySelectorAll('.sim-panel__status-line')].map((e) => (e.getAttribute('title') || e.textContent || '').trim());
  const panel = pane.querySelector('.sim-panel');
  const r = panel ? panel.getBoundingClientRect() : null;
  return { pane: true, stepTop: step ? step.getBoundingClientRect().top : null, lines, status, panel: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null };
})()`;

/** The problems the registry holds for an element, and the dots on the canvas. */
const PROBLEMS = (id: string) => String.raw`(async () => {
  const R = await import('/src/components/editor-v2/problems/registry.ts');
  const own = R.getNodeProblemsSnapshot(${JSON.stringify(id)}).map((p) => ({ title: p.title, description: p.description, kind: p.kind, severity: p.severity }));
  const dots = [...document.querySelectorAll('.node-problem-dot')].map((d) => d.getAttribute('title') || '');
  return { own, dots };
})()`;

async function clip(page: Page, file: string, box: { x: number; y: number; w: number; h: number }) {
    const x = Math.max(0, Math.round(box.x + box.w / 2 - 300));
    await page.screenshot({ path: `${CROPS}/${file}`, clip: { x, y: Math.max(0, Math.round(box.y)), width: 600, height: Math.max(40, Math.round(box.h)) } });
}

async function poll<T>(page: Page, expr: string, ms: number): Promise<T | null> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        const v = await page.evaluate(expr).catch(() => null) as T | null;
        if (v) return v;
        await wait(page, 250);
    }
    return null;
}

async function open(page: Page, s: typeof SCENES[number]): Promise<{ mm: string; m1: string } | null> {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await poll(page, `!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 60000);
    await wait(page, 2000);
    const pid = await page.evaluate(IMPORT(readFileSync(fixture(s.fixture), 'utf8'))) as string | null;
    if (!pid) return null;
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    const ids = await poll<{ mm: string; m1: string }>(page, LOADED(s.mm, s.m1), 60000);
    await wait(page, 3000);
    return ids;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
await seed(ctx, true);
const page: Page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
const result: any = { url: URL };

try {
    // ── the vending machine on DemoESM ─────────────────────────────────────────────────────────
    const esm = SCENES[2];
    const ids = await open(page, esm);
    check('DemoESM opened', !!ids, JSON.stringify(ids));
    if (!ids) throw new Error('no DemoESM');
    result.configure = await page.evaluate(CONFIGURE(ids.mm, ids.m1, esm.profile, esm.decls));
    result.amount = await page.evaluate(AMOUNT);
    note('setup', { configure: result.configure, amount: result.amount });
    const tab = await page.evaluate(CLICK(`[...document.querySelectorAll('.dock-tab')].find((t) => t.textContent.trim() === 'demoESM')`)) as any;
    if (!tab.found) await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)})); })()`);
    await wait(page, 2000);
    await page.evaluate(CLICK(`${PANE(ids.m1)} && ${PANE(ids.m1)}.querySelector('.sim-panel__chip')`));
    await wait(page, 1500);
    const reset = async () => {
        await page.evaluate(CLICK(`${PANE(ids.m1)} && ${PANE(ids.m1)}.querySelector('button.sim-panel__btn[title="Reset"]')`));
        await wait(page, 1500);
        return page.evaluate(READ(ids.m1)) as Promise<any>;
    };

    const base = await reset();
    result.base = base;
    note('base', base);
    check('base: no defect and no warning line', base.pane && base.lines.length === 0, JSON.stringify(base.lines));

    // A: tu without a trigger reads event in its guard.
    // `[]` leaves the slot as it was through the proxy (measured, retry 1): `[null]` is no trigger (objectSlotValues drops it).
    result.aSet = { event: await page.evaluate(SET('tu', 'event', [null])), guard: await page.evaluate(SET('tu', 'guard', ['event.amount > 0'])) };
    const a = await reset();
    result.a = a;
    note('A: tu untriggered, guard event.amount > 0', a);
    const defect = a.lines.find((l: any) => /defect/.test(l.text));
    check('A: the defects line names the event defect', !!defect && defect.text === '1 defect: tu guard (reads event, no trigger).', JSON.stringify(a.lines));
    check('A: Step\'s top unchanged', a.stepTop === base.stepTop, `${base.stepTop} → ${a.stepTop}`);
    if (defect && a.panel) await clip(page, 'defect_line_600.png', { x: a.panel.x, y: defect.top - 12, w: a.panel.w, h: (base.stepTop ?? defect.top + 40) - defect.top + 40 });
    await wait(page, 1500);
    const problems: any = await page.evaluate(PROBLEMS(result.amount.ids.tu));
    result.problems = problems;
    note('A: problems of tu', problems);
    check('A: the registry holds the event defect of tu', problems.own.some((p: any) => /reads event, no trigger/.test(p.title)), JSON.stringify(problems.own));
    const dot = await page.evaluate(String.raw`(() => { const d = [...document.querySelectorAll('.node-problem-dot')].find((x) => /reads event/.test(x.getAttribute('title') || '')); if (!d) return null; d.click(); const r = d.getBoundingClientRect(); return { x: r.x, y: r.y }; })()`) as any;
    await wait(page, 800);
    const overlay = await page.evaluate(String.raw`(() => { const o = document.querySelector('.node-problem-overlay'); if (!o) return null; const r = o.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, text: (o.textContent || '').trim().slice(0, 200) }; })()`) as any;
    result.overlay = { dot, overlay };
    note('A: problems dot and overlay', result.overlay);
    if (overlay) await clip(page, 'problems_600.png', { x: overlay.x, y: overlay.y - 10, w: overlay.w, h: overlay.h + 20 });
    else if (dot) await clip(page, 'problems_600.png', { x: dot.x, y: dot.y - 60, w: 20, h: 160 });
    check('A: a dot on the canvas carries the event defect', !!dot, JSON.stringify(problems.dots));
    await page.keyboard.press('Escape');

    // B: tu restored, ts reads stop's unset amount.
    result.bSet = {
        event: await page.evaluate(SET('tu', 'event', [result.amount.ids.push])), guard: await page.evaluate(SET('tu', 'guard', [''])),
        ts: await page.evaluate(SET('ts', 'guard', ['event.amount == null'])),
    };
    const b = await reset();
    result.b = b;
    note('B: ts guard event.amount == null, stop unset', b);
    const warning = b.lines.find((l: any) => /Unset event attributes/.test(l.text));
    check('B: the run warning line lists stop.amount', !!warning && warning.text === 'Unset event attributes: stop.amount' && warning.title === warning.text, JSON.stringify(b.lines));
    check('B: no defect line', !b.lines.some((l: any) => /defect/.test(l.text)), JSON.stringify(b.lines));
    check('B: Step\'s top unchanged', b.stepTop === base.stepTop, `${base.stepTop} → ${b.stepTop}`);
    if (warning && b.panel) await clip(page, 'warning_line_600.png', { x: b.panel.x, y: warning.top - 12, w: b.panel.w, h: (base.stepTop ?? warning.top + 40) - warning.top + 40 });

    // ── the four demo scenes: no defect and no warning at Reset, as before ─────────────────────
    result.scenes = {};
    for (const s of SCENES) {
        const sids = await open(page, s);
        if (!sids) { check(`${s.name} opened`, false, ''); continue; }
        await page.evaluate(CONFIGURE(sids.mm, sids.m1, s.profile, s.decls));
        await wait(page, 800);
        const got: any = await page.evaluate(String.raw`(async () => {
          const B = await import('/src/components/editor-v2/sim/simBridge.ts');
          const JS = await import('/src/jjscript/index.ts');
          const J = await import('/src/joiner/index.ts');
          const L = (x) => window.LPointerTargetable.fromPointer(x);
          const pid = (() => { try { return L(J.DUser.current).project.id; } catch (e) { return ''; } })();
          const r = B.startRun(window.windoww.store.getState().idlookup, ${JSON.stringify(sids.m1)}, ${JSON.stringify(sids.mm)}, pid, JS.buildEvalContext, 1);
          return r.kind === 'started' ? { defects: (r.compileDefects || []).map((d) => d.short || d.detail), runWarnings: r.runWarnings || null } : { refused: r.reason };
        })()`);
        result.scenes[s.name] = got;
        note(`scene ${s.name}`, got);
        check(`${s.name}: no defect and no warning at Reset`, !got.refused && got.defects.length === 0 && got.runWarnings === null, JSON.stringify(got));
    }
} catch (e: any) {
    failures++;
    console.log(`FAIL  exception  ${e?.message ?? String(e)}`);
} finally {
    result.errors = errors;
    result.failures = failures;
    writeFileSync(OUT, JSON.stringify(result, null, 1));
    note('page errors', errors.length);
    for (const e of errors.slice(0, 8)) console.log(`      ${e}`);
    await browser.close();
    console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  out ${OUT}  crops ${CROPS}`);
    process.exit(failures === 0 ? 0 : 1);
}
