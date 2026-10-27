/**
 * tree-crossing probe (P-2026-10-03-1002).
 *
 * Question: does the crossing set that `useTreeLayout` computes for a tree connector (the bridge
 * arcs on the bus of a multi-inheritance group) follow an edge that is moved across that bus,
 * with the editors idle between actions?
 *
 * The scene, seeded by the probe in a fresh project (TC_MODE=seed, the default) or imported from
 * the fixture it writes (TC_MODE=fixture):
 *   metamodel_1: classes P, C1, C2, X, Y; `C1 extends P`, `C2 extends P` (a tree connector: trunk,
 *   bus, two branches, drawn by the primary inheritance edge); reference `r: X -> Y`.
 *   The default placement puts P, C1, C2 on one row and the bus 20 px under it. The probe drags Y
 *   below the row and X into the gap between C1 and C2, so the vertical of `r` leaves X's bottom
 *   handle above the bus and crosses it: the bus is horizontal, so the tree draws the bridge
 *   (getEdgeCrossings pairs the horizontal of one entry with the vertical of another).
 *
 * Actions on X, each followed by a settle wait and an idle sample:
 *   drag-down / drag-up      pointer drag, 12 moves then release, X below the bus and back
 *   drag-left / drag-right   pointer drag, X 48 px left and back: the crossing slides along the bus
 *   drag-away / drag-back    pointer drag, X to the left of Y on Y's row and back into the gap: the
 *                            release re-anchors `r` (EditorV2's drag-end anchor pass, right/left
 *                            sides away, bottom/top back), so its path changes once more after the
 *                            last drag frame
 *   key-down / key-up        X selected, Shift+ArrowDown / Shift+ArrowUp: one 64 px move each,
 *                            React Flow's keyboard path (one position change, no drag frames)
 *   key-left / key-right     ArrowLeft / ArrowRight: one 16 px move each
 *
 * After each action, read at rest:
 *   - the arcs of the tree as drawn: `A 6 6` bridges in the `d` of its two `.inheritance-edge`
 *     paths, the output of the two crossings memos (useTreeLayout.ts trunkPathFinal,
 *     barBranchesPathFinal);
 *   - the oracle: the app's own `getEdgeCrossings`, imported from the served module (the same
 *     instance the app uses: positive control, its version must be > 0 and the first state must
 *     have one crossing), called at rest on the raw tree segments with the same arguments the
 *     memos pass, so it reads the registry after every effect has run;
 *   - the geometric expectation: one crossing at X's centre x when X's bottom is above the bus,
 *     none when X's top is below it;
 *   - renders at rest: React commits, EditorV2Inner and UnifiedEdge renders per second over
 *     TC_SAMPLE_MS with nothing dispatched by the probe (expected 0 after fix B), and every
 *     component that committed in the sample.
 *
 * Mutation bench without touching the tree: TC_PATCH rewrites the served `useTreeLayout.ts`
 * (Playwright route) and FAILs unless each rewrite matched exactly once.
 *   mut-bar    the bus memo (barBranchesPathFinal) without edgePathsVersion in its deps
 *   mut-trunk  the trunk memo (trunkPathFinal) without it
 *   mut-both   both
 * Under a mutation the checks that compare drawn arcs with the oracle are expected to FAIL where
 * the wiring is load-bearing: that red is the kill.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/tree-crossing.ts --port 3017 [--id <Prompt-ID>]
 * Env:  TC_MODE         seed | fixture (default seed)
 *       TC_FIXTURE      fixture path (default frontend/scripts/probe/fixtures/tree-crossing.jjodel)
 *       TC_WRITE_FIXTURE "1": in seed mode, save the arranged project and write it to TC_FIXTURE
 *       TC_PATCH        none | mut-bar | mut-trunk | mut-both (default none)
 *       TC_SAMPLE_MS    idle sample per state (default 3000)
 *       TC_SETTLE_MS    wait after each action before reading (default 1500)
 *       TC_OUT          JSON output (default /tmp/tree-crossing.json)
 */
import { chromium, type Page } from '@playwright/test';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3017/').replace(/\/$/, '');
if (/:3001$/.test(URL)) throw new Error('never 3001');
const MODE = process.env.TC_MODE || 'seed';
const FIXTURE = process.env.TC_FIXTURE || new globalThis.URL('./fixtures/tree-crossing.jjodel', import.meta.url).pathname;
const PATCH = process.env.TC_PATCH || 'none';
const SAMPLE_MS = Number(process.env.TC_SAMPLE_MS || 3000);
const SETTLE_MS = Number(process.env.TC_SETTLE_MS || 1500);
const OUT = process.env.TC_OUT || '/tmp/tree-crossing.json';

const SEED = [
    'create class P', 'create class C1', 'create class C2', 'C1 extends P', 'C2 extends P',
    'create class X', 'create class Y', 'create reference r in X type Y',
];
// Flow coordinates of the arranged scene (React Flow snaps a drop to its 16 px grid).
const ARRANGE: Record<string, { x: number; y: number }> = { Y: { x: 592, y: 640 }, X: { x: 672, y: 48 } };
// Where drag-away takes X: left of Y on Y's row, so `r` leaves X's right side for Y's left side.
const AWAY = { x: 48, y: 624 };

const REWRITES: Record<string, Array<[RegExp, string]>> = {
    'mut-bar': [[/allNodes,\s*allEdges,\s*edgePathsVersion\s*\]/g, 'allNodes, allEdges]']],
    'mut-trunk': [[/activeNodeIds,\s*allEdges,\s*edgePathsVersion\s*\]/g, 'activeNodeIds, allEdges]']],
};
REWRITES['mut-both'] = [...REWRITES['mut-bar'], ...REWRITES['mut-trunk']];

const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};

// ── Page-side instrument: commits and component renders (a plain string: no transform) ────────
const INIT = String.raw`
globalThis.__name = (f) => f;
(() => {
  const T = window.__tc = { on: false, commits: 0, renders: {}, err: null, last: performance.now() };
  T.reset = () => { T.commits = 0; T.renders = {}; T.t0 = performance.now(); };
  const nameOf = (f) => { const t = f && f.type; if (!t || typeof t === 'string') return null; return t.displayName || t.name || (t.render && (t.render.displayName || t.render.name)) || (t.type && (t.type.displayName || t.type.name)) || null; };
  const onCommit = (root) => {
    const now = performance.now();
    const lower = T.last; T.last = now;
    if (!T.on) return;
    T.commits++;
    const stack = [root.current];
    while (stack.length) {
      const f = stack.pop();
      if (f.sibling) stack.push(f.sibling);
      if (!(f.actualStartTime >= lower)) continue;
      if (f.child) stack.push(f.child);
      if (![0, 1, 2, 11, 14, 15].includes(f.tag) || !(f.flags & 1)) continue;
      const nm = nameOf(f);
      if (nm) T.renders[nm] = (T.renders[nm] || 0) + 1;
    }
  };
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    renderers: new Map(), supportsFiber: true,
    inject(r) { const id = this.renderers.size + 1; this.renderers.set(id, r); return id; },
    onScheduleFiberRoot() {}, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {}, checkDCE() {}, setStrictMode() {},
    onCommitFiberRoot(id, root) { try { onCommit(root); } catch (e) { T.err = String(e && e.stack || e); } },
  };
})();
`;

// Helpers evaluated in the page, prepended to each read: the pane of a model and its React Flow store.
const H = `
  const paneOf = (mmId) => document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-' + mmId + '"]');
  const storeOf = (pane) => {
    const rf = pane && pane.querySelector('.react-flow');
    const key = rf && Object.keys(rf).find(k => k.startsWith('__reactFiber$'));
    let f = key && rf[key];
    for (let i = 0; f && i < 60; i++, f = f.return) {
      const v = f.memoizedProps && f.memoizedProps.value;
      if (v && typeof v.getState === 'function' && typeof v.getState().triggerNodeChanges === 'function') return v;
    }
    return null;
  };
  const byName = (s) => { const out = {}; for (const n of s.nodes) { const nm = n.data && (n.data.name || n.data.label); const il = s.nodeLookup.get(n.id); out[nm] = { id: n.id, x: il.internals.positionAbsolute.x, y: il.internals.positionAbsolute.y, w: n.measured && n.measured.width, h: n.measured && n.measured.height }; } return out; };
`;

/** Everything a state is judged on: positions, the tree's drawn arcs, the oracle, the reference's path. */
async function readScene(page: Page, mmId: string): Promise<any> {
    return page.evaluate(`(async () => {
      ${H}
      const pane = paneOf(${JSON.stringify(mmId)});
      const store = storeOf(pane);
      if (!store) return { error: 'no React Flow store' };
      const s = store.getState();
      const nodes = byName(s);
      const P = nodes.P;
      const tree = s.edges.filter(e => e.type === 'inheritance' && P && e.target === P.id).map(e => e.id).sort((a, b) => a.localeCompare(b));
      const primary = tree[0];
      const g = primary && pane.querySelector('.react-flow__edge[data-id="' + primary + '"]');
      const raw = g ? [...g.querySelectorAll('path[stroke="transparent"]')].map(p => p.getAttribute('d')) : [];
      const drawn = g ? [...g.querySelectorAll('path.inheritance-edge')].map(p => p.getAttribute('d')) : [];
      const ref = s.edges.find(e => e.type !== 'inheritance');
      const rg = ref && pane.querySelector('.react-flow__edge[data-id="' + ref.id + '"]');
      const refRaw = rg ? [...rg.querySelectorAll('path')].filter(p => !p.getAttribute('class')).map(p => p.getAttribute('d')) : [];
      const refDrawn = rg ? [...rg.querySelectorAll('path')].filter(p => /reference-edge/.test(p.getAttribute('class') || '')).map(p => p.getAttribute('d')) : [];
      // Bridges: a horizontal run "L bx y A 6 6 0 0 s ax y"; the crossing is at the midpoint.
      const bridges = (d) => { const out = []; const re = /L\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+A\\s+6\\s+6\\s+0\\s+0\\s+[01]\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)/g; let m; while ((m = re.exec(d || ''))) out.push({ x: +((+m[1] + +m[3]) / 2).toFixed(2), y: +(+m[2]).toFixed(2) }); return out; };
      const eu = await import('/src/components/editor-v2/utils/edgeUtils.ts');
      const active = new Set(s.nodes.map(n => n.id));
      const oracle = { version: eu.getEdgePathsVersion(), trunk: [], bus: [] };
      if (primary && raw[0]) oracle.trunk = eu.getEdgeCrossings(primary + '__trunk', eu.parsePathPoints(raw[0]), active, []).map(c => ({ x: +c.x.toFixed(2), y: +c.y.toFixed(2) }));
      if (primary && raw[1]) eu.parsePathSubPaths(raw[1]).forEach((pts, idx) => { if (pts.length >= 2) for (const c of eu.getEdgeCrossings(primary + '__tree_' + idx, pts, active, [])) oracle.bus.push({ x: +c.x.toFixed(2), y: +c.y.toFixed(2), sub: idx }); });
      const vp = pane.querySelector('.react-flow__viewport');
      return { nodes, tree, primary, ref: ref && ref.id, raw, drawn, refRaw, refDrawn,
        arcs: { trunk: bridges(drawn[0]), bus: bridges(drawn[1]) }, oracle, transform: vp && vp.style.transform };
    })()`);
}

/** Screen point that grabs node `name` itself (not a handle, an input or a button). */
async function grabPoint(page: Page, mmId: string, name: string): Promise<any> {
    return page.evaluate(`(() => {
      ${H}
      const pane = paneOf(${JSON.stringify(mmId)});
      const store = storeOf(pane);
      const n = store && byName(store.getState())[${JSON.stringify(name)}];
      const el = n && pane.querySelector('.react-flow__node[data-id="' + n.id + '"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      for (const fy of [0.5, 0.4, 0.6, 0.3, 0.7]) for (const fx of [0.15, 0.85, 0.3, 0.7, 0.5]) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        const hit = document.elementFromPoint(x, y);
        if (hit && el.contains(hit) && !hit.closest('.react-flow__handle, input, button, .react-flow__resize-control')) return { id: n.id, x, y };
      }
      return null;
    })()`);
}

async function zoomOf(page: Page, mmId: string): Promise<number> {
    return page.evaluate(`(() => { ${H} const s = storeOf(paneOf(${JSON.stringify(mmId)})); return s ? s.getState().transform[2] : 1; })()`) as Promise<number>;
}

/** A pointer drag of node `name` by (dx, dy) in flow units: 12 moves, then release. */
async function dragNode(page: Page, mmId: string, name: string, dx: number, dy: number): Promise<any> {
    const g = await grabPoint(page, mmId, name);
    if (!g) return { ok: false };
    const z = await zoomOf(page, mmId);
    await page.mouse.move(g.x, g.y);
    await page.mouse.down();
    // React Flow starts a drag once the pointer has crossed its threshold and measures from there:
    // a 3 px step in the direction of travel crosses it first, so the 12 moves below are not lost
    // (without it the first move was, 13 to 52 px short of the target before the 16 px snap).
    const len = Math.hypot(dx, dy) || 1;
    await page.mouse.move(g.x + (3 * dx) / len, g.y + (3 * dy) / len);
    await page.waitForTimeout(16);
    for (let i = 1; i <= 12; i++) { await page.mouse.move(g.x + (dx * z * i) / 12, g.y + (dy * z * i) / 12); await page.waitForTimeout(16); }
    await page.mouse.up();
    return { ok: true, from: g, zoom: z };
}

/** Select node `name` with a click, make sure it holds the focus, then press `key` once. */
async function keyMove(page: Page, mmId: string, name: string, key: string): Promise<any> {
    const focused = await page.evaluate(`(() => { ${H} const s = storeOf(paneOf(${JSON.stringify(mmId)})); const n = s && byName(s.getState())[${JSON.stringify(name)}]; const a = document.activeElement; return !!(n && a && a.getAttribute && a.getAttribute('data-id') === n.id); })()`);
    let clicked = false;
    if (!focused) {
        const g = await grabPoint(page, mmId, name);
        if (!g) return { ok: false };
        await page.mouse.click(g.x, g.y);
        await page.waitForTimeout(400);
        clicked = true;
    }
    const state = await page.evaluate(`(() => { ${H} const pane = paneOf(${JSON.stringify(mmId)}); const s = storeOf(pane); const n = s && byName(s.getState())[${JSON.stringify(name)}];
      const el = n && pane.querySelector('.react-flow__node[data-id="' + n.id + '"]');
      if (el && document.activeElement !== el) el.focus({ preventScroll: true });
      const node = s.getState().nodes.find(x => x.id === n.id);
      return { selected: !!(node && node.selected), focused: document.activeElement === el };
    })()`);
    await page.keyboard.press(key);
    return { ok: true, clicked, ...(state as any) };
}

/** Idle sample: React commits and renders while the probe dispatches nothing. */
async function idle(page: Page): Promise<any> {
    return page.evaluate(`(async () => {
      const T = window.__tc; T.reset(); T.on = true;
      await new Promise(r => setTimeout(r, ${SAMPLE_MS}));
      T.on = false;
      const dt = (performance.now() - T.t0) / 1000;
      return { seconds: +dt.toFixed(2), commits: T.commits, commitsPerSec: +(T.commits / dt).toFixed(2),
        editorV2InnerPerSec: +((T.renders.EditorV2Inner || 0) / dt).toFixed(2), unifiedEdgePerSec: +((T.renders.UnifiedEdge || 0) / dt).toFixed(2),
        rendered: Object.entries(T.renders).sort((a, b) => b[1] - a[1]).slice(0, 8), err: T.err };
    })()`);
}

/** Counts during an action (control: the counter sees renders when something happens). */
async function counting(page: Page, run: () => Promise<any>): Promise<{ result: any; commits: number; unifiedEdge: number }> {
    await page.evaluate(`(() => { const T = window.__tc; T.reset(); T.on = true; })()`);
    const result = await run();
    await page.waitForTimeout(SETTLE_MS);
    const c: any = await page.evaluate(`(() => { const T = window.__tc; T.on = false; return { commits: T.commits, unifiedEdge: T.renders.UnifiedEdge || 0 }; })()`);
    return { result, commits: c.commits, unifiedEdge: c.unifiedEdge };
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await ctx.addInitScript({ content: INIT });
await seed(ctx, false);
const patched: Record<string, number> = {};
if (PATCH !== 'none') {
    const rewrites = REWRITES[PATCH];
    if (!rewrites) throw new Error('unknown TC_PATCH ' + PATCH);
    await ctx.route((u: any) => u.toString().includes('/src/components/editor-v2/hooks/useTreeLayout.ts'), async (route: any) => {
        const resp = await route.fetch();
        let body = await resp.text();
        for (const [re, to] of rewrites) {
            const n = (body.match(re) || []).length;
            patched[String(re)] = (patched[String(re)] || 0) + n;
            body = body.replace(re, to);
        }
        await route.fulfill({ response: resp, body });
    });
}
const page: Page = await ctx.newPage();
const pageErrors: string[] = [];
page.on('pageerror', (e: Error) => pageErrors.push(e.message));
const result: any = { url: URL, mode: MODE, patch: PATCH, sampleMs: SAMPLE_MS, settleMs: SETTLE_MS, states: {}, actions: {} };
const save = () => writeFileSync(OUT, JSON.stringify(result, null, 1));

await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await page.waitForTimeout(5000);
let mmId = '';
if (MODE === 'fixture') {
    const text = readFileSync(FIXTURE, 'utf8');
    const project = await page.evaluate(`(async () => {
      const api = await import('/src/api/persistance/projects.ts');
      const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
      const before = count();
      await api.ProjectsApi.importFromText(${JSON.stringify(text)});
      for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
      const a = JSON.parse(localStorage.getItem('projects') || '[]');
      return a.length > before ? a[a.length - 1].id : null;
    })()`) as string | null;
    check('fixture imported', !!project, String(project));
    await page.goto(`${URL}/#/project?id=${project}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(9000);
    mmId = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const pr = j.L.fromPointer(j.DUser.current).project;
      const mm = pr && (pr.metamodels || [])[0];
      if (!mm) return '';
      const dm = await import('/src/components/abstract/DockManager.tsx');
      await dm.default.open2(mm);
      return mm.id;
    })()`) as string;
    await page.waitForTimeout(6000);
} else {
    await page.locator('button', { hasText: 'New Project' }).first().click();
    await page.waitForTimeout(1500);
    await page.locator('input[type="text"]').first().fill('TreeCross');
    await page.locator('button', { hasText: /^Create/ }).last().click();
    await page.waitForTimeout(6000);
    const pid = await page.evaluate(`(() => { const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length ? a[a.length - 1].id : null; })()`);
    check('project created', !!pid, String(pid));
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(9000);
    await page.getByText('New metamodel', { exact: true }).first().click();
    await page.waitForTimeout(9000);
    const seeded: any = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const svc = await import('/src/jjscript/services/JjScriptService.ts');
      const mm = j.L.fromPointer(j.DUser.current).project.metamodels[0];
      const out = [];
      for (const line of ${JSON.stringify(SEED)}) {
        const r = await svc.JjScriptService.execute(line, { level: 'M2', metamodelId: mm.id, metamodelName: mm.name });
        out.push(!!r.success);
        await new Promise(r => setTimeout(r, 600));
      }
      return { mm: mm.id, out };
    })()`);
    mmId = seeded.mm;
    check('seed script ran', seeded.out.every(Boolean), JSON.stringify(seeded.out));
    await page.waitForTimeout(3000);
    result.defaultPlacement = (await readScene(page, mmId)).nodes;
    // Arrange: Y below the row, then X into the gap between C1 and C2.
    for (const name of ['Y', 'X']) {
        const before = (await readScene(page, mmId)).nodes[name];
        const d = await dragNode(page, mmId, name, ARRANGE[name].x - before.x, ARRANGE[name].y - before.y);
        await page.waitForTimeout(2000);
        const after = (await readScene(page, mmId)).nodes[name];
        check(`arrange ${name}`, d.ok && Math.abs(after.x - ARRANGE[name].x) <= 16 && Math.abs(after.y - ARRANGE[name].y) <= 16, JSON.stringify({ before, after }));
    }
}
check('metamodel pane found', !!mmId, mmId);
if (MODE === 'fixture') {
    const n = (await readScene(page, mmId)).nodes;
    check('fixture reopens arranged (X and Y where the seed put them)', !!n.X && !!n.Y && n.X.x === ARRANGE.X.x && n.X.y === ARRANGE.X.y && n.Y.x === ARRANGE.Y.x && n.Y.y === ARRANGE.Y.y, JSON.stringify({ X: n.X, Y: n.Y }));
}
const patchOk = PATCH === 'none' || REWRITES[PATCH].every(([re]) => patched[String(re)] === 1);
if (PATCH !== 'none') check(`patch ${PATCH} matched once each`, patchOk, JSON.stringify(patched));

/** Read one state, compare drawn arcs with the oracle and with the geometric expectation. */
async function judge(label: string): Promise<any> {
    const idleSample = await idle(page);
    const sc = await readScene(page, mmId);
    const X = sc.nodes.X;
    // The bus y: the y shared by the horizontal of the outer branches (third point of an L sub-path).
    const busY = (() => { const m = /L\s+(-?[\d.]+)\s+(-?[\d.]+)\s+L\s+(-?[\d.]+)\s+\2/.exec(sc.raw[1] || ''); return m ? Number(m[2]) : null; })();
    const xc = X ? X.x + X.w / 2 : null;
    const expected = X && busY !== null && X.y + X.h < busY - 6 ? [{ x: xc }] : [];
    const key = (a: any[]) => JSON.stringify(a.map((c) => Math.round(c.x)).sort((p, q) => p - q));
    const drawnBus = sc.arcs.bus, oracleBus = sc.oracle.bus;
    const st = { idle: idleSample, X, busY, xc, expected: expected.map((e) => Math.round(e.x)), drawn: sc.arcs, oracle: sc.oracle, raw: sc.raw, drawnPaths: sc.drawn, refRaw: sc.refRaw, refDrawn: sc.refDrawn, transform: sc.transform };
    result.states[label] = st;
    note(`${label}`, `X=(${X && X.x},${X && X.y}) busY=${busY} drawn bus=${key(drawnBus)} trunk=${key(sc.arcs.trunk)} | oracle bus=${key(oracleBus)} trunk=${key(sc.oracle.trunk)} v=${sc.oracle.version} | expected=${key(expected)} | idle commits/s=${idleSample.commitsPerSec} EditorV2Inner/s=${idleSample.editorV2InnerPerSec} UnifiedEdge/s=${idleSample.unifiedEdgePerSec}`);
    check(`${label}: drawn bus arcs = oracle`, key(drawnBus) === key(oracleBus), `${key(drawnBus)} vs ${key(oracleBus)}`);
    check(`${label}: drawn trunk arcs = oracle`, key(sc.arcs.trunk) === key(sc.oracle.trunk), `${key(sc.arcs.trunk)} vs ${key(sc.oracle.trunk)}`);
    check(`${label}: oracle = geometric expectation`, key(oracleBus) === key(expected), `${key(oracleBus)} vs ${key(expected)}`);
    // At rest no editor and no edge renders (fix B). Other commits are reported, not failed: the
    // debounced «last saved» indicator commits once about two seconds after a keyboard move.
    check(`${label}: idle, 0 editor and edge renders`, idleSample.editorV2InnerPerSec === 0 && idleSample.unifiedEdgePerSec === 0, JSON.stringify(idleSample));
    save();
    return st;
}

const first = await judge('rest');
check('oracle reads the app\'s registry (version > 0, one crossing at rest)', first.oracle.version > 0 && first.oracle.bus.length === 1, JSON.stringify(first.oracle));

if (MODE === 'seed' && process.env.TC_WRITE_FIXTURE === '1') {
    const saved: any = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const api = await import('/src/api/persistance/projects.ts');
      const pr = j.L.fromPointer(j.DUser.current).project;
      await api.ProjectsApi.save(pr, { silent: true });
      await new Promise(r => setTimeout(r, 1500));
      const a = JSON.parse(localStorage.getItem('projects') || '[]');
      const p = a.find(x => x.id === pr.id);
      return p ? JSON.stringify(p) : null;
    })()`);
    check('fixture saved', !!saved, saved ? `${saved.length} bytes` : 'null');
    if (saved) { mkdirSync(dirname(FIXTURE), { recursive: true }); writeFileSync(FIXTURE, saved); note('fixture', FIXTURE); }
}

const ACTIONS: Array<[string, () => Promise<any>]> = [
    ['drag-down', () => dragNode(page, mmId, 'X', 0, 160)],
    ['drag-up', () => dragNode(page, mmId, 'X', 0, -160)],
    ['drag-left', () => dragNode(page, mmId, 'X', -48, 0)],
    ['drag-right', () => dragNode(page, mmId, 'X', 48, 0)],
    ['drag-away', () => dragNode(page, mmId, 'X', AWAY.x - ARRANGE.X.x, AWAY.y - ARRANGE.X.y)],
    ['drag-back', () => dragNode(page, mmId, 'X', ARRANGE.X.x - AWAY.x, ARRANGE.X.y - AWAY.y)],
    ['key-down', () => keyMove(page, mmId, 'X', 'Shift+ArrowDown')],
    ['key-up', () => keyMove(page, mmId, 'X', 'Shift+ArrowUp')],
    ['key-left', () => keyMove(page, mmId, 'X', 'ArrowLeft')],
    ['key-right', () => keyMove(page, mmId, 'X', 'ArrowRight')],
];
let prevX = first.X;
for (const [name, run] of ACTIONS) {
    const c = await counting(page, run);
    result.actions[name] = c;
    const st = await judge(name);
    const moved = !!(st.X && prevX && (st.X.x !== prevX.x || st.X.y !== prevX.y));
    check(`${name}: X moved, and the action rendered (control)`, c.result.ok && moved && c.commits > 0, JSON.stringify({ from: prevX && [prevX.x, prevX.y], to: st.X && [st.X.x, st.X.y], commits: c.commits, unifiedEdge: c.unifiedEdge, r: c.result }));
    prevX = st.X;
}

result.pageErrors = pageErrors;
check('no page error', pageErrors.length === 0, JSON.stringify(pageErrors).slice(0, 300));
result.failures = failures;
save();
console.log(`OUT ${OUT}`);
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
