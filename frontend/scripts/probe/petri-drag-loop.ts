/**
 * petri-drag-loop probe (P-2026-10-10-1020: «Maximum update depth» on a node drag in Petri net (classic), discovery).
 *
 * Starts from elk-handles-loop.ts of a57bd4d53 (P-2026-10-10-0915): the same scene setup (import the demo export, derive
 * the notation, activate it, open the model, fit) and the same fast drag (30 steps to +140,+70 and back). Three parts:
 *
 *   dump    The metamodel (classes, attributes, references), the M1 objects by metaclass, and per pane node its metaclass,
 *           its size, its handles and the `irLabelAnchors` the edge synthesis wrote on it. Read-only, one page.
 *   bisect  Per state (PDL_STATES: `rest` = the first drag at rest, `layout` = the first drag after one toolbar Auto
 *           layout), PDL_PAGES fresh pages; per page up to PDL_DRAGS fast drags of one node of PDL_TARGET (place,
 *           transition, any), each from the fitted pane. Per drag: React's nested update count (max), a crash (the
 *           CanvasErrorBoundary fallback, the app's <Try> fallback, a «Maximum update depth» in the console). A crash
 *           ends the page. One line per page and a summary per state: what the bisect reads, commit by commit.
 *   record  One page per state, the drag step by step (a crash check after each of the 30 moves, the last good pane kept
 *           in memory and written when the crash comes), with the recorder: React's nested count and the scheduling
 *           stacks at depth 20..24 (P-2026-10-01-1655); the useSyncExternalStore consistency recorder (component chain,
 *           previous and next snapshot, from depth 12); every nodes and edges push of xyflow's <StoreUpdater> from depth 3
 *           with the per-node diff against the previous push (top keys, `data` keys, `irLabelAnchors`, measured, position;
 *           handles for edges); every `triggerNodeChanges` (change types and ids) and EditorV2's `useNodesState` /
 *           `useEdgesState` setter calls with a short stack. The last entries of each ring go to the JSON.
 *
 * Fixtures (PDL_FIXTURE): `petri` = DemoPetri (scene_2_DemoPetri.jjodel); `hand` = a net of three places and two
 * transitions written by JjScript in a fresh M1 model of DemoPetri's metamodel (p1 -> t1 -> p2 -> t2 -> p3), no layout
 * saved, so the canvas places it.
 *
 * Instrumentation goes in through Playwright route patches of the served modules; no tracked file is touched. With
 * PDL_NOPATCH=1 nothing is patched (the control that a crash is the app's), and the depth reads 0.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> <this file> --port 3082 --id P-2026-10-10-1020
 * Env:  PDL_TAG        label of the run (default tip); files are named after it
 *       PDL_PARTS      dump,bisect,record (default bisect)
 *       PDL_NOTATIONS  derived notations, comma-separated (default petriClassic)
 *       PDL_FIXTURE    petri | hand (default petri)
 *       PDL_TARGET     place | transition | first | any (default any: the node nearest the pane's centre; first: the
 *                      first node in DOM order, the pick of elk-handles-loop.ts)
 *       PDL_SELECT     1: click an edge's midpoint before each drag (elk-handles-loop.ts' `select` gesture)
 *       PDL_RUNS       bisect variants in one run, `;`-separated `state/target/select` (select 1 or 0), e.g.
 *                      `rest/first/1;layout/first/1`; overrides PDL_STATES, PDL_TARGET and PDL_SELECT for bisect
 *       PDL_RECORD_PAGES  record: fresh pages until one crashes, at most this many (default 4)
 *       PDL_STEPWISE   1: in record, the drag one move at a time with a crash check and a pane shot after each (slow);
 *                      default the fast drag of bisect, the last good frame then being the pane before the drag
 *       PDL_STATES     rest,layout (default both)
 *       PDL_PAGES      fresh pages per state in bisect (default 5)
 *       PDL_DRAGS      drags per page at most in bisect (default 3)
 *       PDL_NOPATCH    1: no module patched
 *       PDL_OUT        JSON output (default ~/.jjodel-lanes/<PDL_LANE_ID>/pdl_<tag>.json)
 *       PDL_CROPS      crop directory (default ~/.jjodel-lanes/<PDL_LANE_ID>/crops)
 *       PIP_SCENES     directory of the demo exports (default frontend/scripts/probe/fixtures)
 *       PDL_LANE_ID    folder under ~/.jjodel-lanes for the JSON and the crops (default petri-drag-loop)
 *
 * On the trunk since P-2026-10-12-0011 (release 3.1, L2), the gate of Fix A (useAutoAnchor reads the React Flow nodes
 * at call time). Carried from petri-loop-disc (e902f159d) as it was, but for PDL_LANE_ID. The gate run of that lane:
 *   PROBE_URL=http://localhost:3142/ PDL_TAG=fixA PDL_NOTATIONS=petriClassic PDL_RUNS='rest/first/0' PDL_PAGES=10 \
 *     ~/.local/bin/node --experimental-strip-types frontend/scripts/probe/petri-drag-loop.ts
 * The fixture, scene_2_DemoPetri.jjodel, was already on the trunk, identical to the branch's.
 */
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { seed, setTheme } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3082/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const TAG = process.env.PDL_TAG || 'tip';
const PARTS = (process.env.PDL_PARTS || 'bisect').split(',');
const NOTATIONS = (process.env.PDL_NOTATIONS || 'petriClassic').split(',');
const FIXTURE = process.env.PDL_FIXTURE || 'petri';
const TARGET = process.env.PDL_TARGET || 'any';
const STATES = (process.env.PDL_STATES || 'rest,layout').split(',');
const PAGES = Number(process.env.PDL_PAGES || 5);
const DRAGS = Number(process.env.PDL_DRAGS || 3);
const NOPATCH = process.env.PDL_NOPATCH === '1';
const SELECT = process.env.PDL_SELECT === '1';
const STEPWISE = process.env.PDL_STEPWISE === '1';
const RECORD_PAGES = Number(process.env.PDL_RECORD_PAGES || 4);
type Variant = { state: string; target: string; select: boolean };
const RUNS: Variant[] = process.env.PDL_RUNS
    ? process.env.PDL_RUNS.split(';').filter(Boolean).map((x) => { const [state, target, sel] = x.split('/'); return { state, target: target || 'any', select: sel === '1' }; })
    : STATES.map((state) => ({ state, target: TARGET, select: SELECT }));
const LANE = `${process.env.HOME}/.jjodel-lanes/${process.env.PDL_LANE_ID || 'petri-drag-loop'}`;
const OUT = process.env.PDL_OUT || `${LANE}/pdl_${TAG}.json`;
const CROPS = (process.env.PDL_CROPS || `${LANE}/crops`).replace(/\/$/, '');
const SCENES_DIR = process.env.PIP_SCENES || new globalThis.URL('./fixtures', import.meta.url).pathname;
const SCENE_FILE = 'scene_2_DemoPetri.jjodel';

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 2000)}`); if (ok) pass++; else fail++; };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 8000)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const paneSel = (m1: string) => `[id="${m1}"].dock-tabpane-active`;

// ── Instrumentation ──────────────────────────────────────────────────────────────────────────────────────────────
const patched: Record<string, number> = {};
const RECORD = PARTS.includes('record');
function patchText(src: string, url = ''): string {
    let out = src;
    if (RECORD && url.includes('/viewpoint/ir/useIRContainment.ts')) {
        const d = '[nodes, edges, irSig, collapseVersion, edgeInteractionVersion, oaeSlotsSig, markDep]);';
        if (out.includes(d)) { out = out.replace(d, '(window.__irDeps ? window.__irDeps([nodes, edges, irSig, collapseVersion, edgeInteractionVersion, oaeSlotsSig, markDep]) : [nodes, edges, irSig, collapseVersion, edgeInteractionVersion, oaeSlotsSig, markDep]));'); patched.irDeps = 1; }
        return out;
    }
    if (out.includes('function checkForNestedUpdates() {')) {
        out = out.replace('function checkForNestedUpdates() {',
            'function checkForNestedUpdates() { { const R = (window.__rd ||= { max: 0 }); if (nestedUpdateCount > R.max) R.max = nestedUpdateCount; R.cur = nestedUpdateCount; if (window.__recOn && nestedUpdateCount === 10 && window.__ev) window.__ev.push({ type: "depth10", t: Math.round(performance.now()) }); if (window.__recOn && nestedUpdateCount >= 20 && nestedUpdateCount <= 24) { const L = Error.stackTraceLimit; Error.stackTraceLimit = 60; (window.__nestStacks ||= []).push({ n: nestedUpdateCount, st: String(new Error().stack) }); Error.stackTraceLimit = L; if (window.__nestStacks.length > 20) window.__nestStacks.shift(); } }');
        patched.react = (patched.react ?? 0) + 1;
    }
    if (!RECORD) return out;
    const usi = /inst\.getSnapshot = getSnapshot;(\s*)if \(checkIfSnapshotChanged\(inst\)\) \{/;
    if (usi.test(out)) {
        out = out.replace(usi, `inst.getSnapshot = getSnapshot; if (window.__recOn && window.__rd && window.__rd.cur >= 12) { try { const nv = getSnapshot(); if (!objectIs(nextSnapshot, nv)) { const names = []; let f = fiber; for (let i = 0; i < 14 && f; i++) { const t = f.type; const n = t && (t.displayName || t.name); if (n) names.push(n); f = f.return; } (window.__uses ||= []).push({ n: window.__rd.cur, names, prev: window.__show(nextSnapshot), next: window.__show(nv), same: window.__same(nextSnapshot, nv) }); if (window.__uses.length > 60) window.__uses.shift(); } } catch (e) {} } if (checkIfSnapshotChanged(inst)) {`);
        patched.uses = (patched.uses ?? 0) + 1;
    }
    const su = /if \(fieldName === (['"])nodes\1\)(\s*)setNodes\(fieldValue\);(\s*)else if \(fieldName === (['"])edges\4\)(\s*)setEdges\(fieldValue\);/;
    if (su.test(out)) {
        out = out.replace(su, 'if (fieldName === "nodes") { window.__suNodes && window.__suNodes(fieldValue); setNodes(fieldValue); } else if (fieldName === "edges") { window.__suEdges && window.__suEdges(fieldValue); setEdges(fieldValue); }');
        patched.storeUpdater = (patched.storeUpdater ?? 0) + 1;
    }
    const tnc = /triggerNodeChanges: \(changes\) => \{/;
    if (tnc.test(out)) {
        out = out.replace(tnc, 'triggerNodeChanges: (changes) => { window.__tnc && window.__tnc(changes);');
        patched.triggerNodeChanges = (patched.triggerNodeChanges ?? 0) + 1;
    }
    const ns = /const \[nodes, setNodes\] = \(0, (\w+)\.useState\)\(initialNodes\);/;
    if (ns.test(out)) {
        out = out.replace(ns, (_m: string, r: string) => `const [nodes, setNodes0] = (0, ${r}.useState)(initialNodes); const setNodes = (0, ${r}.useCallback)((p) => { window.__ring && window.__ring("setNodes"); return setNodes0(window.__wrapUpd ? window.__wrapUpd("setNodes", p) : p); }, []);`);
        patched.useNodesState = (patched.useNodesState ?? 0) + 1;
    }
    const es = /const \[edges, setEdges\] = \(0, (\w+)\.useState\)\(initialEdges\);/;
    if (es.test(out)) {
        out = out.replace(es, (_m: string, r: string) => `const [edges, setEdges0] = (0, ${r}.useState)(initialEdges); const setEdges = (0, ${r}.useCallback)((p) => { window.__ring && window.__ring("setEdges"); return setEdges0(window.__wrapUpd ? window.__wrapUpd("setEdges", p) : p); }, []);`);
        patched.useEdgesState = (patched.useEdgesState ?? 0) + 1;
    }
    return out;
}

/** Page side: the recorder's rings and the per-push diff. Installed before any module runs. */
const RECORDER = `(() => {
  const w = window;
  w.__rd = { max: 0, cur: 0 }; w.__recOn = false;
  w.__ev = [];
  for (const type of ['pointerdown', 'pointerup']) addEventListener(type, () => { if (w.__recOn) w.__ev.push({ type, t: Math.round(performance.now()) }); }, true);
  w.__rec = { nodes: [], edges: [], tnc: [], sets: [], deps: [] };
  const ring = (a, x, cap) => { a.push(x); if (a.length > cap) a.shift(); };
  const short = (id) => String(id).slice(-8);
  w.__show = (v) => { try { if (v === null || v === undefined) return String(v); if (typeof v === 'object') return Array.isArray(v) ? 'array#' + v.length : 'object:' + Object.keys(v).slice(0, 10).join(','); return String(v).slice(0, 160); } catch (e) { return '?'; } };
  w.__same = (a, b) => { try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return 'cyclic'; } };
  const j = (v) => { try { return JSON.stringify(v); } catch (e) { return '?'; } };
  const diffNode = (p, n) => {
    const keys = [];
    for (const k of new Set([...Object.keys(p), ...Object.keys(n)])) {
      if (p[k] === n[k]) continue;
      if (k === 'data') {
        const dk = [];
        for (const kk of new Set([...Object.keys(p.data || {}), ...Object.keys(n.data || {})])) {
          if ((p.data || {})[kk] === (n.data || {})[kk]) continue;
          const same = j((p.data || {})[kk]) === j((n.data || {})[kk]);
          dk.push(kk + (same ? '(ref)' : (/irLabelAnchors|irBarOrientation|irBarThickness/.test(kk) ? '=' + j((p.data || {})[kk]) + '->' + j((n.data || {})[kk]) : '')));
        }
        keys.push('data{' + dk.join(',') + '}');
      } else if (k === 'measured' || k === 'position' || k === 'width' || k === 'height') {
        keys.push(k + (j(p[k]) === j(n[k]) ? '(ref)' : '=' + j(p[k]) + '->' + j(n[k])));
      } else keys.push(k + (j(p[k]) === j(n[k]) ? '(ref)' : ''));
    }
    return keys;
  };
  const diffEdge = (p, n) => {
    const keys = [];
    for (const k of new Set([...Object.keys(p), ...Object.keys(n)])) {
      if (p[k] === n[k]) continue;
      if (k === 'sourceHandle' || k === 'targetHandle') keys.push(k + '=' + p[k] + '->' + n[k]);
      else if (k === 'data') {
        const dk = [];
        for (const kk of new Set([...Object.keys(p.data || {}), ...Object.keys(n.data || {})])) if ((p.data || {})[kk] !== (n.data || {})[kk]) dk.push(kk + (j((p.data || {})[kk]) === j((n.data || {})[kk]) ? '(ref)' : ''));
        keys.push('data{' + dk.join(',') + '}');
      } else keys.push(k + (j(p[k]) === j(n[k]) ? '(ref)' : ''));
    }
    return keys;
  };
  // References only while recording (a diff per push changed the timing enough to hide the loop); diffed on demand.
  const differ = (kind) => (arr) => { if (w.__recOn && Array.isArray(arr)) ring(w.__rec[kind], { n: w.__rd.cur, t: performance.now(), arr }, 160); };
  w.__diffRing = (kind, since) => {
    const fn = kind === 'nodes' ? diffNode : diffEdge;
    const a = w.__rec[kind];
    const out = [];
    for (let i = 1; i < a.length; i++) {
      if (a[i].t < since) continue;
      const prev = a[i - 1].arr, arr = a[i].arr;
      const byId = new Map(prev.map((x) => [x.id, x]));
      const diffs = [];
      let changed = 0;
      for (const x of arr) {
        const p = byId.get(x.id);
        if (!p) { diffs.push(short(x.id) + ':new'); changed++; continue; }
        if (p === x) continue;
        changed++;
        const d = fn(p, x);
        if (diffs.length < 10) diffs.push(short(x.id) + ':' + d.join('|'));
      }
      out.push({ n: a[i].n, t: Math.round(a[i].t), len: arr.length, changed, sameArray: prev === arr, diffs });
    }
    return out;
  };
  w.__suNodes = differ('nodes');
  w.__suEdges = differ('edges');
  // useIRContainment's memo deps: which moved since the previous render, by index, with the signature strings' lengths.
  const DEPS = ['nodes', 'edges', 'irSig', 'collapseVersion', 'edgeInteractionVersion', 'oaeSlotsSig', 'markDep'];
  let prevDeps = null;
  w.__irDeps = (deps) => {
    if (w.__recOn && prevDeps) {
      const moved = DEPS.filter((_, i) => !Object.is(prevDeps[i], deps[i])).map((k) => { const i = DEPS.indexOf(k); return typeof deps[i] === 'string' ? k + '(' + String(prevDeps[i]).length + '->' + String(deps[i]).length + ')' : k; });
      ring(w.__rec.deps, { n: w.__rd.cur, t: performance.now(), moved, nodesRef: deps[0], edgesRef: deps[1], prevEdges: prevDeps[1], sig: typeof deps[5] === 'string' && moved.some((m) => m.startsWith('oaeSlotsSig')) ? { prev: String(prevDeps[5]).slice(0, 400), next: String(deps[5]).slice(0, 400) } : undefined }, 160);
    }
    prevDeps = deps;
    return deps;
  };
  w.__depsOut = (since) => w.__rec.deps.filter((x) => x.t >= since).map((x) => {
    let edgeDiff;
    if (x.moved.includes('edges') && Array.isArray(x.prevEdges) && Array.isArray(x.edgesRef)) {
      const byId = new Map(x.prevEdges.map((e) => [e.id, e]));
      edgeDiff = { sameLen: x.prevEdges.length === x.edgesRef.length, changed: [] };
      for (const e of x.edgesRef) { const p = byId.get(e.id); if (!p) { edgeDiff.changed.push(short(e.id) + ':new'); continue; } if (p !== e && edgeDiff.changed.length < 8) edgeDiff.changed.push(short(e.id) + ':' + diffEdge(p, e).join('|')); }
      edgeDiff.unchanged = x.edgesRef.filter((e) => byId.get(e.id) === e).length;
    }
    return { n: x.n, t: Math.round(x.t), moved: x.moved, edgeDiff, sig: x.sig };
  });
  w.__tnc = (changes) => { if (w.__recOn) ring(w.__rec.tnc, { n: w.__rd.cur, t: performance.now(), changes }, 120); };
  w.__tncOut = (since) => w.__rec.tnc.filter((x) => x.t >= since).map(({ n, t, changes }) => { const c = {}; for (const x of changes || []) { const k = x.type + (x.type === 'position' ? (x.dragging ? ':drag' : ':rest') : x.type === 'dimensions' ? (x.resizing !== undefined ? ':resize' : ':measure') : ''); c[k] = (c[k] || 0) + 1; } return { n, t: Math.round(t), c, ids: (changes || []).slice(0, 4).map((x) => short(x.id) + (x.type === 'dimensions' ? '=' + j(x.dimensions) : '')) }; });
  // Every functional updater handed to useNodesState / useEdgesState while recording: an id, the enqueue time, depth and
  // stack, and each invocation (React re-runs an updater when it rebases the queue past a skipped lower-priority update).
  let updId = 0;
  const stackOf = (skip) => { const L = Error.stackTraceLimit; Error.stackTraceLimit = 16; const st = String(new Error().stack).split('\\n').slice(skip, skip + 10).map((l) => { const m = l.match(/at (?:(\\S+) )?\\(?(?:.*\\/)?([^/?]+)(?:\\?[^:]*)?:(\\d+):\\d+\\)?/); return m ? (m[1] || '?') + '@' + m[2] + ':' + m[3] : l.trim().slice(0, 60); }); Error.stackTraceLimit = L; return st; };
  w.__upd = [];
  w.__wrapUpd = (what, p) => {
    if (!w.__recOn) return p;
    const id = ++updId;
    const rec = { id, what, kind: typeof p, t0: Math.round(performance.now()), n0: w.__rd.cur, st: stackOf(3), runs: [] };
    ring(w.__upd, rec, 200);
    if (typeof p !== 'function') return p;
    return (prev) => { const out = p(prev); if (rec.runs.length < 80) rec.runs.push({ n: w.__rd.cur, t: Math.round(performance.now()), same: out === prev }); return out; };
  };
  w.__ring = (what) => { if (!w.__recOn || (w.__rd.cur || 0) < 3) return; const L = Error.stackTraceLimit; Error.stackTraceLimit = 14; const st = String(new Error().stack).split('\\n').slice(2, 12).map((l) => { const m = l.match(/at (?:(\\S+) )?\\(?(?:.*\\/)?([^/?]+)(?:\\?[^:]*)?:(\\d+):\\d+\\)?/); return m ? (m[1] || '?') + '@' + m[2] + ':' + m[3] : l.trim().slice(0, 60); }); Error.stackTraceLimit = L; ring(w.__rec.sets, { n: w.__rd.cur, what, st }, 80); };
})();`;

async function newPage(browser: any): Promise<{ ctx: BrowserContext; page: Page; errors: string[] }> {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
    await seed(ctx, true);
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    await ctx.addInitScript(RECORDER);
    await ctx.addInitScript(`window.__pdlStore = ${STORE};`);
    if (!NOPATCH) await ctx.route((u) => /\/deps\/[^?]*\.js/.test(u.toString()) || (RECORD && u.toString().includes('/viewpoint/ir/useIRContainment.ts')), async (route) => {
        try {
            const resp = await route.fetch();
            const out = patchText(await resp.text(), route.request().url());
            await route.fulfill({ response: resp, body: out, headers: { ...resp.headers(), 'content-length': String(Buffer.byteLength(out)) } });
        } catch {
            await route.continue().catch(() => {});
        }
    });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 300)));
    page.on('console', (m) => {
        const t = m.text();
        if (m.type() === 'error' && /Maximum update depth/.test(t)) errors.push('console: ' + t.slice(0, 300));
        if (m.type() === 'error' && /The above error occurred in the/.test(t)) errors.push('component: ' + (t.match(/occurred in the <[^>]+> component/)?.[0] ?? t.slice(0, 120)));
        if (m.type() === 'warning' && /Maximum update depth/.test(t)) errors.push('warning: ' + t.slice(0, 200) + ' | ' + t.split('\n').slice(1, 6).map((l) => l.trim()).join(' < ').slice(0, 400));
    });
    return { ctx, page, errors };
}

// ── Scene setup (the calls of elk-handles-loop.ts) ───────────────────────────────────────────────────────────────
async function importScene(page: Page, file: string) {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 5000);
    const text = readFileSync(`${SCENES_DIR}/${file}`, 'utf8');
    const project = await page.evaluate(`(async () => {
      const api = await import('/src/api/persistance/projects.ts');
      const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
      const before = count();
      await api.ProjectsApi.importFromText(${JSON.stringify(text)});
      for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
      const a = JSON.parse(localStorage.getItem('projects') || '[]');
      return a.length > before ? a[a.length - 1].id : null;
    })()`) as string | null;
    if (!project) return { project, models: [] as Array<{ id: string; name: string; meta: boolean }> };
    await page.goto(`${URL}/#/project?id=${project}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 9000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    return { project, models: await listModels(page) };
}

const listModels = (page: Page) => page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const pr = j.L.fromPointer(j.DUser.current).project;
  return [...(pr.metamodels || []).map(m => ({ id: m.id, name: m.name, meta: true })), ...(pr.models || []).filter(m => !m.isMetamodel).map(m => ({ id: m.id, name: m.name, meta: false }))];
})()`) as Promise<Array<{ id: string; name: string; meta: boolean }>>;

async function openModel(page: Page, id: string) {
    await page.evaluate(`(async () => { const j = await import('/src/joiner/index.ts'); const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(id)})); })()`).catch(() => {});
    await wait(page, 4000);
    await page.evaluate((x: string) => {
        const b = [...document.querySelectorAll('.dock-tab-btn')].find((e) => e.id.endsWith(`-tab-${x}`)) as HTMLElement | undefined;
        b?.click();
    }, id);
    await wait(page, 4000);
}

async function derive(page: Page, mm: string, profile: string, notation: string) {
    return page.evaluate(async ([x, prof, n]: string[]) => {
        const load = (p: string): Promise<any> => import(p);
        const [pb, sp, ms, rc, dv, nt] = await Promise.all([
            load('/src/model/simulation/profileBinder.ts'), load('/src/model/simulation/simProfiles.ts'), load('/src/components/editor-v2/sim/metamodelSketch.ts'),
            load('/src/model/simulation/roleCatalog.ts'), load('/src/utils/deriveViewpoint.ts'), load('/src/components/editor-v2/viewpoint/derive/notations.ts')]);
        const w = window as any;
        const b = pb.bindProfile(sp.systemProfile(prof), ms.sketchOfMetamodel(w.windoww.store.getState().idlookup, x));
        const out: Record<string, unknown> = { ...(w.windoww.store.getState().idlookup[x]?._state ?? {}), simProfile: prof };
        for (const d of rc.ROLE_CATALOG) { const v = (b as any)[d.id]; if (d.key && v?.status === 'bound') out[d.key] = v.value; }
        w.LPointerTargetable.fromPointer(x).state = out;
        await new Promise((r) => setTimeout(r, 1200));
        const s = w.windoww.store.getState();
        const pre = nt.dialogPrefill(s.idlookup, x, n as any, dv.projectViewpointIds());
        const vp = dv.createDerivedViewpoint(x, { notation: n as any, classRoles: pre.roles }) as any;
        await new Promise((r) => setTimeout(r, 1500));
        return { vp: vp?.id ?? null };
    }, [mm, profile, notation]);
}

const activate = async (page: Page, vp: string | null) => {
    await page.evaluate(async (x: string | null) => { const load = (p: string): Promise<any> => import(p); const m = await load('/src/utils/lastViewpoint.ts'); m.activateViewpoint(x); }, vp);
    await wait(page, 3000);
};

/** The hand-made net: a fresh M1 model of the metamodel, written by JjScript (names p1..p3, t1, t2). */
async function handNet(page: Page, mm: { id: string; name: string }, lines: string[]) {
    const r: any = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const nav = await import('/src/pages/components/Navbar.tsx');
      const p = j.L.fromPointer(j.DUser.current).project;
      const before = new Set((p.models || []).map(m => m.id));
      nav.createM1(p, j.L.fromPointer(${JSON.stringify(mm.id)}), false);
      let m = null;
      for (let i = 0; i < 50 && !m; i++) {
        await new Promise(r => setTimeout(r, 100));
        m = (j.L.fromPointer(j.DUser.current).project.models || []).find(x => !before.has(x.id) && !x.isMetamodel) || null;
      }
      if (!m) return { error: 'createM1: no new model' };
      const svc = await import('/src/jjscript/services/JjScriptService.ts');
      const scope = { level: 'M1', metamodelId: ${JSON.stringify(mm.id)}, metamodelName: ${JSON.stringify(mm.name)}, modelId: m.id };
      const out = [];
      for (const line of ${JSON.stringify(lines)}) {
        const r = await svc.JjScriptService.execute(line, scope);
        out.push({ line, ok: !!r.success, msg: r.success ? '' : String(r.message || (r.errors && r.errors[0] && r.errors[0].message) || '').slice(0, 160) });
        await new Promise(r => setTimeout(r, 60));
      }
      return { id: m.id, name: m.name, lines: out };
    })()`);
    return r;
}

/** The pane's React Flow store, by the fiber walk of tree-crossing.ts. Page side, as a string so it can be reused. */
const STORE = `(sel) => {
  const pane = document.querySelector(sel);
  const rf = pane && pane.querySelector('.react-flow');
  const key = rf && Object.keys(rf).find((k) => k.startsWith('__reactFiber$'));
  let f = key && rf[key];
  for (let i = 0; f && i < 80; i++, f = f.return) {
    const v = f.memoizedProps && f.memoizedProps.value;
    if (v && typeof v.getState === 'function' && typeof v.getState().triggerNodeChanges === 'function') return v;
  }
  return null;
}`;

async function fit(page: Page, m1: string) {
    await page.evaluate(async ([sel]: string[]) => {
        const store = (window as any).__pdlStore(sel);
        if (!store) return null;
        const s = store.getState();
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const n of s.nodes) {
            if (n.hidden) continue;
            const il = s.nodeLookup.get(n.id);
            const p = il?.internals?.positionAbsolute ?? n.position;
            const w = n.measured?.width ?? n.width ?? 0, h = n.measured?.height ?? n.height ?? 0;
            x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + w); y1 = Math.max(y1, p.y + h);
        }
        if (!Number.isFinite(x0) || !s.panZoom) return null;
        const pad = 70;
        const zoom = Math.min(1, s.width / (x1 - x0 + 2 * pad), s.height / (y1 - y0 + 2 * pad));
        await s.panZoom.setViewport({ x: s.width / 2 - ((x0 + x1) / 2) * zoom, y: s.height / 2 - ((y0 + y1) / 2) * zoom, zoom });
        return zoom;
    }, [paneSel(m1)]);
    await wait(page, 700);
}

async function clickLayout(page: Page, m1: string) {
    await page.mouse.move(5, 5);
    const btn = page.locator(`${paneSel(m1)} .toolbar-btn[title="Auto layout"]`).first();
    if (!(await btn.count())) return 'no button';
    if (await btn.isDisabled()) return 'disabled';
    await btn.click();
    await wait(page, 3500);
    await page.mouse.move(5, 5);
    return 'clicked';
}

/** The visible nodes of the pane with their metaclass, screen box, the label moves on their data, their outside labels. */
const nodesOf = (page: Page, m1: string) => page.evaluate(([sel]: string[]) => {
    const w = window as any;
    const pane = document.querySelector(sel);
    if (!pane) return [];
    const idl = w.windoww.store.getState().idlookup;
    const store = w.__pdlStore(sel);
    const rfNodes = new Map<string, any>((store?.getState().nodes ?? []).map((n: any) => [n.id, n]));
    const classOf = (id: string) => {
        let d = idl[id];
        if (d && d.className !== 'DObject' && typeof d.model === 'string') d = idl[d.model];
        const mc = d && idl[d.instanceof];
        return mc?.name ?? d?.className ?? '?';
    };
    return [...pane.querySelectorAll('.react-flow__node')].filter((n) => (n as HTMLElement).offsetParent && getComputedStyle(n).visibility !== 'hidden').map((n) => {
        const r = n.getBoundingClientRect();
        const id = n.getAttribute('data-id')!;
        const rf = rfNodes.get(id);
        const labels = [...n.querySelectorAll('.ir-label')].map((l) => `${[...l.classList].filter((c) => c.startsWith('ir-label--')).join(' ')}:${(l.textContent || '').trim().slice(0, 20)}`);
        return { id, cls: classOf(id), name: (n.textContent || '').trim().slice(0, 24), cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height),
            moves: rf?.data?.irLabelAnchors ?? null, bar: rf?.data?.irBarOrientation ?? null, labels };
    }).filter((n) => n.w > 4 && n.h > 4 && n.cx > 0 && n.cy > 0 && n.cx < 1600 && n.cy < 1000);
}, [paneSel(m1)]);

const edgesOf = (page: Page, m1: string) => page.evaluate(([sel]: string[]) => {
    const store = (window as any).__pdlStore(sel);
    return (store?.getState().edges ?? []).filter((e: any) => !e.hidden).map((e: any) => `${String(e.source).slice(-6)}.${e.sourceHandle}->${String(e.target).slice(-6)}.${e.targetHandle}`);
}, [paneSel(m1)]);

const edgeMids = (page: Page, m1: string) => page.evaluate((sel: string) => {
    const pane = document.querySelector(sel);
    if (!pane) return [];
    return [...pane.querySelectorAll('.react-flow__edge')].map((e) => {
        const path = e.querySelector('path.react-flow__edge-path, path') as SVGPathElement | null;
        if (!path) return null;
        try { const L = path.getTotalLength(); const m = path.getPointAtLength(L / 2); const ctm = path.getScreenCTM()!; return { id: e.getAttribute('data-id'), x: m.x * ctm.a + ctm.e, y: m.y * ctm.d + ctm.f }; } catch { return null; }
    }).filter((x): x is { id: string; x: number; y: number } => !!x && x.x > 0 && x.y > 0 && x.x < 1600 && x.y < 1000);
}, paneSel(m1));

/** elk-handles-loop.ts' `select`: a click on the midpoint of the k-th edge, held through the next drag. */
async function selectEdge(page: Page, m1: string, k: number) {
    const mids = await edgeMids(page, m1);
    const em = mids.length ? mids[k % mids.length] : null;
    if (em) { await page.mouse.click(em.x, em.y); await wait(page, 350); }
    return em?.id ?? null;
}

const crashed = (page: Page) => page.evaluate(() => {
    const w = window as any;
    return { canvasError: document.querySelectorAll('.editor-v2__canvas-error').length, tryMessage: document.querySelectorAll('.try-message').length, tryreport: w.tryreport ? String(w.tryreport.e?.message ?? '').slice(0, 120) : null };
});
const isCrash = (cr: { canvasError: number; tryMessage: number; tryreport: string | null }, errs: string[]) => cr.canvasError > 0 || cr.tryMessage > 0 || !!cr.tryreport || errs.some((e) => /Maximum update depth/.test(e) && !e.startsWith('warning'));
const depth = (page: Page) => page.evaluate(() => (window as any).__rd?.max ?? 0);
const resetDepth = (page: Page) => page.evaluate(() => { const w = window as any; w.__rd.max = 0; });

async function drag(page: Page, x0: number, y0: number, x1: number, y1: number, steps: number) {
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    await page.mouse.move(x1, y1, { steps });
    await page.mouse.up();
}

function pick(ns: Awaited<ReturnType<typeof nodesOf>>, rep: number, target = TARGET) {
    const want = target === 'place' ? /place/i : target === 'transition' ? /transition/i : null;
    if (target === 'first') return ns.length ? ns[(rep * 3) % ns.length] : null;
    const pool = want ? ns.filter((n) => want.test(n.cls)) : [...ns].sort((a, b) => Math.hypot(a.cx - 800, a.cy - 500) - Math.hypot(b.cx - 800, b.cy - 500));
    return pool.length ? pool[rep % pool.length] : null;
}

/** One fresh page set up to the moment before the first drag: the fixture, the notation, the state. */
async function setup(page: Page, notation: string, state: string) {
    const { project, models } = await importScene(page, SCENE_FILE);
    if (!project) return { error: 'import' };
    await setTheme(page, 'light');
    const mm = models.find((m) => m.meta)!;
    let m1 = models.find((m) => !m.meta)!;
    let hand: any = null;
    if (FIXTURE === 'hand') {
        hand = await handNet(page, mm, HAND_LINES);
        if (!hand?.id) return { error: 'hand', hand };
        m1 = { id: hand.id, name: hand.name, meta: false };
    }
    const d = await derive(page, mm.id, 'petri', notation);
    if (!d.vp) return { error: 'derive' };
    await activate(page, d.vp);
    await openModel(page, m1.id);
    await fit(page, m1.id);
    // The derived viewpoint must be the one drawn: a Petri pane shows outside labels (both notations), the default one none.
    const outsideLabels = () => page.evaluate((sel: string) => document.querySelectorAll(`${sel} .ir-label--outside`).length, paneSel(m1.id));
    if ((await outsideLabels()) === 0) { await activate(page, d.vp); await fit(page, m1.id); }
    if ((await outsideLabels()) === 0) return { error: 'viewpoint not drawn (no outside label in the pane)' };
    const layout = state === 'layout' ? await clickLayout(page, m1.id) : 'skipped';
    await fit(page, m1.id);
    await wait(page, 1200);
    return { mm, m1: m1.id, vp: d.vp, layout, hand };
}

// The hand-made net, in the metamodel DemoPetri declares (read by the dump part: Place{tokens}, Transition{guard},
// Arc{weight, src: PNode, tgt: PNode}): p1 -> t1 -> p2 -> t2 -> p3, one token in p1. Overridable with PDL_HAND (lines
// separated by `;;`).
const HAND_LINES = (process.env.PDL_HAND || [
    'create instance of Place "p1"', 'create instance of Place "p2"', 'create instance of Place "p3"',
    'create instance of Transition "t1"', 'create instance of Transition "t2"',
    'create instance of Arc "a1"', 'create instance of Arc "a2"', 'create instance of Arc "a3"', 'create instance of Arc "a4"',
    'set a1.src = p1', 'set a1.tgt = t1', 'set a2.src = t1', 'set a2.tgt = p2',
    'set a3.src = p2', 'set a3.tgt = t2', 'set a4.src = t2', 'set a4.tgt = p3',
    'set p1.tokens = 1',
].join(';;')).split(';;');

const result: any = { url: URL, tag: TAG, fixture: FIXTURE, target: TARGET, nopatch: NOPATCH, dump: null, bisect: {}, record: {} };
mkdirSync(CROPS, { recursive: true });
mkdirSync(OUT.replace(/\/[^/]*$/, ''), { recursive: true });
const save = () => writeFileSync(OUT, JSON.stringify(result, null, 1));
const browser = await chromium.launch();

// Warm-up: a cold dev server fails the first dynamic imports now and then («Failed to fetch dynamically imported module»,
// P-2026-10-01-2336's ticket); one page loads the app and the modules the setup imports, retried, before any measure.
{
    const { ctx, page } = await newPage(browser);
    for (let i = 0; i < 4; i++) {
        try {
            await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
            await wait(page, 6000);
            await page.evaluate(`Promise.all(['/src/joiner/index.ts', '/src/api/persistance/projects.ts', '/src/components/abstract/DockManager.tsx', '/src/utils/deriveViewpoint.ts', '/src/utils/lastViewpoint.ts', '/src/components/editor-v2/viewpoint/derive/notations.ts', '/src/model/simulation/profileBinder.ts', '/src/jjscript/services/JjScriptService.ts', '/src/pages/components/Navbar.tsx'].map((p) => import(p)))`);
            meas('warm-up', `ok after ${i + 1} attempt(s)`);
            break;
        } catch (e: any) { meas('warm-up', `attempt ${i + 1}: ${String(e?.message ?? e).slice(0, 160)}`); }
    }
    await ctx.close();
}

// ── Part 0: dump ─────────────────────────────────────────────────────────────────────────────────────────────────
if (PARTS.includes('dump')) {
    const { ctx, page, errors } = await newPage(browser);
    try {
        const { project, models } = await importScene(page, SCENE_FILE);
        check('dump: imported', !!project, { project, models });
        const mm = models.find((m) => m.meta)!, m1 = models.find((m) => !m.meta)!;
        result.dump = await page.evaluate(`(() => {
          const idl = window.windoww.store.getState().idlookup;
          const all = Object.values(idl).filter((d) => d && typeof d === 'object');
          const classes = all.filter((d) => d.className === 'DClass' && d.father && (d.father === ${JSON.stringify(mm.id)} || (idl[d.father] && idl[d.father].father === ${JSON.stringify(mm.id)}))).map((c) => ({
            name: c.name, abstract: !!c.abstract, ext: (c.extends || []).map((x) => idl[x] && idl[x].name),
            attrs: (c.attributes || []).map((a) => idl[a] && (idl[a].name + ':' + ((idl[idl[a].type] || {}).name || idl[a].type))),
            refs: (c.references || []).map((r) => idl[r] && (idl[r].name + ':' + ((idl[idl[r].type] || {}).name || idl[r].type) + '[' + idl[r].lowerBound + '..' + idl[r].upperBound + ']' + (idl[r].containment ? ' containment' : ''))),
          }));
          const objs = all.filter((d) => d.className === 'DObject' && d.model === ${JSON.stringify(m1.id)}).map((o) => ((idl[o.instanceof] || {}).name) + ' ' + o.name);
          return { classes, objs };
        })()`);
        meas('dump metamodel', result.dump);
        for (const notation of NOTATIONS) {
            const d = await derive(page, mm.id, 'petri', notation);
            await activate(page, d.vp);
            await openModel(page, m1.id);
            await fit(page, m1.id);
            const ns = await nodesOf(page, m1.id);
            const es = await edgesOf(page, m1.id);
            meas(`dump ${notation} nodes`, ns.map((n) => ({ id: n.id.slice(-6), cls: n.cls, name: n.name, w: n.w, h: n.h, moves: n.moves, bar: n.bar, labels: n.labels })));
            meas(`dump ${notation} edges`, es);
            await page.locator(paneSel(m1.id)).first().screenshot({ path: `${CROPS}/pdl_${TAG}_dump_${notation}.png` });
        }
        meas('dump errors', errors);
    } catch (e: any) {
        check('dump: ran', false, String(e?.message ?? e).slice(0, 300));
    } finally { save(); await ctx.close(); }
}

// ── Part 1: bisect ───────────────────────────────────────────────────────────────────────────────────────────────
if (PARTS.includes('bisect')) for (const notation of NOTATIONS) for (const { state, target, select } of RUNS) {
    const key = `${FIXTURE}/${notation}/${state}/${target}${select ? '/sel' : ''}`;
    const out: any = { pages: [] as any[] };
    result.bisect[key] = out;
    for (let pg = 0; pg < PAGES; pg++) {
        const { ctx, page, errors } = await newPage(browser);
        const row: any = { page: pg, drags: [] as any[] };
        out.pages.push(row);
        try {
            const s: any = await setup(page, notation, state);
            if (s.error) { row.error = s.error; row.hand = s.hand; check(`${key} p${pg}: set up`, false, s); continue; }
            row.layout = s.layout;
            if (s.hand) row.hand = s.hand.lines.filter((l: any) => !l.ok);
            for (let k = 0; k < DRAGS; k++) {
                await fit(page, s.m1);
                const ns = await nodesOf(page, s.m1);
                if (pg === 0 && k === 0) {
                    meas(`${key} nodes before the first drag`, ns.map((n) => ({ id: n.id.slice(-6), cls: n.cls, name: n.name, moves: n.moves, labels: n.labels })));
                    await page.locator(paneSel(s.m1)).first().screenshot({ path: `${CROPS}/pdl_${TAG}_${FIXTURE}_${notation}_${state}_${target}_before.png` });
                }
                const t = pick(ns, k, target);
                if (!t) { row.noNode = k; break; }
                const e0 = errors.length;
                const sel = select ? await selectEdge(page, s.m1, k) : null;
                if (select && isCrash(await crashed(page), errors.slice(e0))) { row.drags.push({ k, node: 'edge select', moves: null, rd: await depth(page), crash: true, leg: 'select', component: errors.slice(e0).find((e) => e.startsWith('component: ')) ?? null }); break; }
                await resetDepth(page);
                await drag(page, t.cx, t.cy, t.cx + 140, t.cy + 70, 30);
                await wait(page, 120);
                const cr0 = await crashed(page);
                if (!isCrash(cr0, errors.slice(e0))) await drag(page, t.cx + 140, t.cy + 70, t.cx, t.cy, 30);
                await wait(page, 350);
                const cr = await crashed(page);
                const crash = isCrash(cr, errors.slice(e0));
                row.drags.push({ k, node: `${t.cls} ${t.name}`, sel, moves: t.moves, rd: await depth(page), crash, leg: crash ? (isCrash(cr0, errors.slice(e0)) ? 'out' : 'back') : null, component: errors.slice(e0).find((e) => e.startsWith('component: ')) ?? null });
                if (crash) {
                    if (!out.crop) { out.crop = `${CROPS}/pdl_${TAG}_${FIXTURE}_${notation}_${state}_${target}_crash.png`; await page.screenshot({ path: out.crop }); }
                    break;
                }
            }
            row.otherErrors = errors.filter((e) => !/Maximum update depth|^component: |^warning: /.test(e)).slice(0, 3);
        } catch (e: any) {
            row.error = String(e?.message ?? e).slice(0, 300);
            check(`${key} p${pg}: ran`, false, row.error);
        } finally {
            const d = row.drags as any[];
            meas(`${key} p${pg}`, { layout: row.layout, drags: d.map((x) => `${x.node}${x.crash ? ' CRASH(' + x.leg + ')' : ' ok'} rd ${x.rd}`), hand: row.hand, other: row.otherErrors });
            save();
            await ctx.close();
        }
    }
    const pages = (out.pages as any[]).filter((p) => !p.error);
    const crashedPages = pages.filter((p) => p.drags.some((d: any) => d.crash));
    const firstDrag = pages.filter((p) => p.drags[0]?.crash);
    out.summary = { pages: pages.length, crashedPages: crashedPages.length, crashOnFirstDrag: firstDrag.length, drags: pages.reduce((a, p) => a + p.drags.length, 0),
        rdMaxNoCrash: Math.max(0, ...pages.flatMap((p) => p.drags.filter((d: any) => !d.crash).map((d: any) => d.rd))), components: [...new Set(pages.flatMap((p) => p.drags.map((d: any) => d.component).filter(Boolean)))] };
    meas(`${key} summary`, out.summary);
    check(`${key}: ${out.summary.drags} drags on ${pages.length} fresh pages, no crash`, crashedPages.length === 0 && pages.length > 0, out.summary);
    save();
}

// ── Part 2: record ───────────────────────────────────────────────────────────────────────────────────────────────
const tail = (a: any[] | undefined, n: number) => (a ?? []).slice(-n);
/** A stack reduced to function@file:line, the react-dom and xyflow internals kept short. */
const reduce = (st: string) => st.split('\n').slice(1).map((l) => {
    const m = l.match(/at (?:(\S+) )?\(?(?:.*\/)?([^/?]+)(?:\?[^:]*)?:(\d+):\d+\)?/);
    return m ? `${m[1] ?? '?'}@${m[2]}:${m[3]}` : l.trim().slice(0, 60);
}).slice(0, 40);

if (PARTS.includes('record')) for (const notation of NOTATIONS) for (const { state, target, select } of RUNS) for (let rp = 0; rp < RECORD_PAGES; rp++) {
    const key = `${FIXTURE}/${notation}/${state}/${target}${select ? '/sel' : ''}#${rp}`;
    const out: any = {};
    result.record[key] = out;
    const { ctx, page, errors } = await newPage(browser);
    try {
        const s: any = await setup(page, notation, state);
        if (s.error) { out.error = s; check(`${key} record: set up`, false, s); continue; }
        out.patched = { ...patched };
        out.layout = s.layout;
        const ns = await nodesOf(page, s.m1);
        out.nodesAtRest = ns.map((n) => ({ id: n.id.slice(-8), cls: n.cls, name: n.name, w: n.w, h: n.h, moves: n.moves, bar: n.bar, labels: n.labels }));
        out.edgesAtRest = await edgesOf(page, s.m1);
        const t = pick(ns, 0, target);
        if (!t) { out.error = 'no node'; continue; }
        out.target = `${t.cls} ${t.name} ${t.id.slice(-8)}`;
        const e0 = errors.length;
        let crashAt: string | null = null;
        let last: Buffer | null = null;
        out.drags = [] as string[];
        await page.evaluate(() => { const w = window as any; w.__rd.max = 0; w.__recOn = true; });
        // Stepwise: one drag, a crash check and a pane shot after each move. Otherwise the drags of bisect, out and back,
        // up to PDL_DRAGS, the pane shot before each, the recorder on throughout (its rings keep the last entries).
        for (let k = 0; k < (STEPWISE ? 1 : DRAGS) && crashAt === null; k++) {
            await fit(page, s.m1);
            const tk = k === 0 ? t : pick(await nodesOf(page, s.m1), k, target);
            if (!tk) break;
            last = await page.locator(paneSel(s.m1)).first().screenshot();
            await page.evaluate(() => { (window as any).__rec.mark = performance.now(); });
            if (select) out.drags.push('select ' + await selectEdge(page, s.m1, k));
            if (isCrash(await crashed(page), errors.slice(e0))) { crashAt = `select ${k}`; break; }
            await page.mouse.move(tk.cx, tk.cy);
            await page.mouse.down();
            const steps = 30;
            // Not stepwise: bisect's own drag (the release right after the last move), the crash read after it.
            if (!STEPWISE) { await page.mouse.move(tk.cx + 140, tk.cy + 70, { steps }); await page.mouse.up(); }
            for (let i = 1; STEPWISE && i <= steps && crashAt === null; i++) {
                await page.mouse.move(tk.cx + (140 * i) / steps, tk.cy + (70 * i) / steps);
                await wait(page, 30);
                if (isCrash(await crashed(page), errors.slice(e0))) { crashAt = `drag ${k} move ${i}`; break; }
                last = await page.locator(paneSel(s.m1)).first().screenshot();
            }
            if (STEPWISE) {
                await wait(page, 60);
                if (crashAt === null && isCrash(await crashed(page), errors.slice(e0))) crashAt = `drag ${k} out, before release`;
                await page.mouse.up();
            }
            await wait(page, 120);
            if (crashAt === null && isCrash(await crashed(page), errors.slice(e0))) crashAt = `drag ${k} out, at release`;
            if (crashAt === null && !STEPWISE) {
                await drag(page, tk.cx + 140, tk.cy + 70, tk.cx, tk.cy, 30);
                await wait(page, 350);
                if (isCrash(await crashed(page), errors.slice(e0))) crashAt = `drag ${k} back`;
            }
            out.drags.push(`${tk.cls} ${tk.name}${crashAt ? ' CRASH' : ' ok'} rd ${await depth(page)}`);
        }
        await wait(page, 300);
        out.crashAt = crashAt;
        out.rd = await depth(page);
        const rec: any = await page.evaluate(() => { const w = window as any; w.__recOn = false; const m = w.__rec.mark ?? 0; return { rec: { nodes: w.__diffRing('nodes', m), edges: w.__diffRing('edges', m), tnc: w.__tncOut(m), sets: w.__rec.sets, ev: w.__ev.filter((x: any) => x.t >= m).slice(0, 4), deps: w.__depsOut(m), upd: w.__upd.filter((x: any) => x.t0 >= m - 50 || x.runs.some((r: any) => r.t >= m)).map((x: any) => ({ ...x, runCount: x.runs.length, runs: x.runs.slice(0, 3).concat(x.runs.length > 6 ? [{ more: x.runs.length - 6 }] : []).concat(x.runs.slice(Math.max(3, x.runs.length - 3))) })) }, uses: w.__uses ?? [], stacks: w.__nestStacks ?? [] }; });
        out.uses = tail(rec.uses, 30);
        out.stacks = tail(rec.stacks, 5).map((x: any) => ({ n: x.n, st: reduce(x.st) }));
        out.nodePushes = tail(rec.rec.nodes, 40);
        out.edgePushes = tail(rec.rec.edges, 40);
        out.tnc = tail(rec.rec.tnc, 30);
        out.sets = tail(rec.rec.sets, 30);
        out.events = rec.rec.ev;
        out.deps = rec.rec.deps;
        out.upd = rec.rec.upd;
        out.errors = errors.slice(e0).slice(0, 6);
        const stem = `${CROPS}/pdl_${TAG}_${FIXTURE}_${notation}_${state}_${target}_r${rp}`;
        if (crashAt !== null && last) { writeFileSync(`${stem}_lastgood.png`, last); await page.screenshot({ path: `${stem}_fallback.png` }); }
        meas(`${key} record`, { target: out.target, crashAt, drags: out.drags, rd: out.rd, patched: out.patched, nodesAtRest: out.nodesAtRest });
        meas(`${key} record uses`, out.uses.slice(-12));
        meas(`${key} record node pushes`, out.nodePushes.slice(-14));
        meas(`${key} record edge pushes`, out.edgePushes.slice(-8));
        meas(`${key} record tnc`, out.tnc.slice(-10));
        meas(`${key} record sets`, out.sets.slice(-10));
        meas(`${key} record pointer and depth events`, out.events);
        meas(`${key} record useIRContainment deps (last 12)`, out.deps.slice(-12));
        meas(`${key} record setter calls since the drag (functional updaters and their runs)`, out.upd);
        meas(`${key} record useIRContainment deps (first 8 from depth 2)`, out.deps.filter((x: any) => x.n >= 2).slice(0, 8));
        meas(`${key} record stack`, out.stacks.slice(-1));
    } catch (e: any) {
        out.error = String(e?.message ?? e).slice(0, 300);
        check(`${key} record: ran`, false, out.error);
    } finally { save(); await ctx.close(); }
    if (out.crashAt != null) break;
}

save();
await browser.close();
meas('patched', patched);
meas('out', OUT);
console.log(`RESULT ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
