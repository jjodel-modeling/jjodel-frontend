/**
 * hidden-tab-loop probe (P-2026-10-02-1450, ticket T9).
 *
 * Question: who re-renders a hidden metamodel editor about 60 times a second while nothing is
 * dispatched, why it never settles, and whether the visible editor does it too.
 *
 * Drives the real app on its own dev server (never 3001): a fresh project, metamodel_1 with two
 * classes (and, in the `ref` variant, one reference between them) written through
 * `JjScriptService.execute`, then a sequence of phases, each sampled for SAMPLE_MS with nothing
 * dispatched by the probe:
 *   mm1-visible       metamodel_1 is the active tab
 *   mm1-hidden        metamodel_2 created and active, metamodel_1 hidden (rc-dock keeps it mounted)
 *   mm1-visible-again metamodel_1 clicked back to the front, metamodel_2 hidden
 *   mm1-hidden-again  metamodel_2 clicked to the front again
 *   mm1-closed        metamodel_1's tab closed
 *
 * Instruments, all installed by the probe, none in the app:
 *   - React commits through `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`: commits, which
 *     `EditorV2Inner` rendered (by model id, hidden or visible pane), the components at the top of
 *     each update, and which hooks of theirs changed identity (state, reducer, useSyncExternalStore),
 *     with a shallow diff of the two values;
 *   - React's profiling hooks (`injectProfilingHooks`, development build): the stack of every
 *     `setState`/`dispatch` scheduled while sampling, mapped back to the source through the inline
 *     source map Vite serves;
 *   - counts and scheduling stacks of `requestAnimationFrame`, `setTimeout`, ResizeObserver
 *     callbacks, and Redux store notifications (the "nothing dispatched" control);
 *   - main-thread busy time per second of the sample (CDP `Performance.getMetrics`, TaskDuration);
 *   - paths, in the node and edge state that changed, of values a structural equality over plain
 *     data cannot compare (functions, non-plain prototypes).
 *
 * Counterfactuals without touching the tree: LOOP_PATCH rewrites the served
 * `useJjomSync.ts` (Playwright route) before the page runs it, and FAILs if a rewrite did not
 * match exactly once, so a patch that silently did nothing cannot pass for a negative result.
 *
 * Scenes mode (LOOP_VARIANTS=scenes): imports every *.jjodel of LOOP_SCENES (read only), opens
 * every model pane, then samples once with the last pane active: renders per second per editor.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/hidden-tab-loop.ts --port 3014 [--id <Prompt-ID>]
 * Env:  LOOP_VARIANTS  comma list of ref | classes | selfref | extends | lib6 | scenes (default "ref,classes")
 *       LOOP_PATCH     none | nodate | nodeguard | edgeguard | both (default none)
 *       LOOP_SCENES    directory of *.jjodel exports (default ~/jjodel-demo-exports)
 *       LOOP_EDGE_PHASES "1": before closing, select an edge of metamodel_1 by a click and sample
 *                      visible and hidden, then click the pane and sample again
 *       LOOP_PATCH also takes mut-nodeguard | mut-edgekeep | mut-dedupe: fix B's mutation bench
 *       LOOP_SAMPLE_MS sample length per phase (default 5000)
 *       LOOP_OUT       JSON output path (default /tmp/hidden-tab-loop.json)
 */
import { chromium, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3014/').replace(/\/$/, '');
if (/:3001$/.test(URL)) throw new Error('never 3001');
const VARIANTS = (process.env.LOOP_VARIANTS || 'ref,classes').split(',').filter(Boolean);
const SAMPLE_MS = Number(process.env.LOOP_SAMPLE_MS || 5000);
const OUT = process.env.LOOP_OUT || '/tmp/hidden-tab-loop.json';

const SCRIPTS: Record<string, string> = {
    ref: 'create class A\ncreate class B\ncreate reference r in A type B',
    classes: 'create class A\ncreate class B',
    selfref: 'create class A\ncreate reference next in A type A',
    extends: 'create class A\ncreate class B\nB extends A',
    // The run-slowdown probe's 16-line script, six times: 42 classes, 30 references (run 6 size).
    lib6: [1, 2, 3, 4, 5, 6].map((n) => [
        `create class R${n}_Library`, `create class R${n}_Book`, `create attribute title in R${n}_Book type String`,
        `create reference books in R${n}_Library type R${n}_Book`, `create class R${n}_Author`, `create attribute name in R${n}_Author type String`,
        `create reference authors in R${n}_Book type R${n}_Author`, `create class R${n}_Member`, `create attribute since in R${n}_Member type Integer`,
        `create class R${n}_Loan`, `create reference loans in R${n}_Member type R${n}_Loan`, `create reference item in R${n}_Loan type R${n}_Book`,
        `create attribute isbn in R${n}_Book type String`, `create class R${n}_Review`, `create reference reviews in R${n}_Book type R${n}_Review`,
        `create class R${n}_Shelf`,
    ].join('\n')).join('\n'),
};
const PATCH = process.env.LOOP_PATCH || 'none';
// Each rewrite must match exactly once in the served (esbuild-transformed) module.
const REWRITES: Record<string, Array<[RegExp, string]>> = {
    // The incremental-sync effect re-runs only when its real dependencies change.
    nodate: [[/,\s*Date\.now\(\)\s*\]/g, ']']],
    // A vertex whose transformer output is structurally unchanged is not patched.
    nodeguard: [[/!shallowDataEqual\(existing\.data,\s*rfNode\.data\)/g, 'JSON.stringify(existing.data) !== JSON.stringify(rfNode.data)']],
    // An edge whose transformer output is structurally unchanged is not patched.
    edgeguard: [[/patchedEdges\.set\(id,\s*rfEdge\);/g, 'if (!(existing && JSON.stringify(existing) === JSON.stringify(rfEdge))) patchedEdges.set(id, rfEdge);']],
};
REWRITES.both = [...REWRITES.nodeguard, ...REWRITES.edgeguard];
// Mutation bench of fix B (P-2026-10-02-1450 Phase 2), run against the fixed source: each one
// undoes one of its three parts, and the probe must see the loop come back.
REWRITES['mut-nodeguard'] = [[/\s*\|\|\s*samePlainData\(existing\.data,\s*rfNode\.data\)/g, '']];
REWRITES['mut-edgekeep'] = [[/if \(changed\)\s*result = mapped;/g, 'result = mapped;']];
REWRITES['mut-dedupe'] = [[/return kept\.length === edges\.length \? edges : kept;/g, 'return kept;']];

const note = (label: string, d: unknown) =>
    console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};

// ── Page-side instruments (a plain string: no transform touches it) ────────────────────────────
const INIT = String.raw`
globalThis.__name = (f) => f;
(() => {
  const L = window.__loop = { on: false, err: null };
  const reset = () => {
    L.t0 = performance.now(); L.commits = 0; L.editorRenders = {}; L.top = {}; L.hooks = {}; L.sched = {};
    L.raf = 0; L.rafStacks = {}; L.timeouts = 0; L.timeoutStacks = {}; L.ro = 0; L.roTargets = {}; L.storeNotes = 0;
    L.diffs = []; L.renderMs = 0; L.nonPlain = {}; L.nonPlainVisited = 0; L.lastCommit = performance.now();
  };
  L.reset = reset; reset();
  const STACK_SKIP = /react-dom|react_dom|scheduler|\/deps\/chunk-|__loop|<anonymous>/;
  const frames = (skip) => {
    const s = (new Error().stack || '').split('\n').slice(1 + (skip || 0)).map((x) => x.trim().replace(/^at /, ''));
    return s.filter((x) => !STACK_SKIP.test(x)).slice(0, 8);
  };
  const bump = (o, k, extra) => { const e = o[k] || (o[k] = { n: 0 }); e.n++; if (extra && !e.sample) e.sample = extra; return e; };
  const nameOf = (f) => { const t = f && f.type; if (!t) return f && f.tag === 3 ? 'HostRoot' : '?'; if (typeof t === 'string') return t; return t.displayName || t.name || (t.render && (t.render.displayName || t.render.name)) || (t.type && (t.type.displayName || t.type.name)) || 'Anonymous'; };
  const firstHost = (f) => { const st = [f.child]; let n = 0; while (st.length && n++ < 400) { const x = st.pop(); if (!x) continue; if (x.tag === 5 && x.stateNode && x.stateNode.nodeType === 1) return x.stateNode; if (x.sibling) st.push(x.sibling); if (x.child) st.push(x.child); } return null; };
  const paneOf = (el) => { for (let x = el; x; x = x.parentElement) if (x.classList && x.classList.contains('dock-tabpane')) return x; return null; };
  const paneTag = (f) => { const el = firstHost(f); const p = el && paneOf(el); if (!p) return 'no-pane'; return p.classList.contains('dock-tabpane-active') ? 'visible' : 'hidden'; };
  const short = (v) => {
    if (v === null || v === undefined) return String(v);
    if (Array.isArray(v)) return 'Array(' + v.length + ')';
    if (typeof v === 'object') return 'Object{' + Object.keys(v).slice(0, 6).join(',') + '}';
    if (typeof v === 'function') return 'fn ' + (v.name || 'anon');
    return JSON.stringify(v).slice(0, 60);
  };
  // Shallow diff of two values a hook alternated between: which elements and keys moved.
  const diff = (a, b) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      let same = 0; const moved = [];
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] === b[i]) { same++; continue; }
        if (moved.length < 3) {
          const x = a[i], y = b[i]; const keys = [];
          if (x && y && typeof x === 'object' && typeof y === 'object') {
            for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
              if (x[k] !== y[k]) {
                let sx, sy; try { sx = JSON.stringify(x[k]); sy = JSON.stringify(y[k]); } catch (e) { sx = short(x[k]); sy = short(y[k]); }
                keys.push({ k, same: sx === sy, a: (sx || '').slice(0, 140), b: (sy || '').slice(0, 140) });
              }
            }
          }
          moved.push({ i, id: (y && y.id) || (x && x.id) || null, keys });
        }
      }
      return { len: [a.length, b.length], same, moved };
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const keys = [];
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[k] !== b[k]) { let sx, sy; try { sx = JSON.stringify(a[k]); sy = JSON.stringify(b[k]); } catch (e) { sx = short(a[k]); sy = short(b[k]); } keys.push({ k, same: sx === sy, a: (sx || '').slice(0, 140), b: (sy || '').slice(0, 140) }); }
      return { keys: keys.slice(0, 8) };
    }
    return { a: short(a), b: short(b) };
  };
  // Paths, in node and edge state, of values a structural equality over plain data cannot
  // compare: functions and objects whose prototype is neither Object.prototype nor null.
  const nonPlain = (v, path, depth) => {
    if (v === null || v === undefined || depth > 8) return;
    if (typeof v === 'function') { bump(L.nonPlain, path + ' : function'); return; }
    if (typeof v !== 'object') return;
    L.nonPlainVisited++;
    if (Array.isArray(v)) { for (let i = 0; i < Math.min(v.length, 50); i++) nonPlain(v[i], path + '[]', depth + 1); return; }
    const proto = Object.getPrototypeOf(v);
    if (proto !== Object.prototype && proto !== null) { bump(L.nonPlain, path + ' : ' + ((proto && proto.constructor && proto.constructor.name) || 'proto')); return; }
    for (const k of Object.keys(v)) nonPlain(v[k], path + '.' + k, depth + 1);
  };
  // Positive control: the detector must report this Map, nested like node data.
  L.nonPlainControl = () => nonPlain({ data: { features: [{ value: new Map() }] } }, 'control', 0);
  const hookKind = (h) => {
    const q = h.queue;
    if (!q) return null;
    if (typeof q.getSnapshot === 'function') return 'uSES';
    if (q.lastRenderedReducer) return q.lastRenderedReducer.name === 'basicStateReducer' ? 'state' : 'reducer';
    return 'queue';
  };
  // Changed state-like hooks of a fiber between its previous and current committed version.
  const changedHooks = (f) => {
    const a = f.alternate; if (!a) return ['mount'];
    const out = [];
    let h1 = a.memoizedState, h2 = f.memoizedState, i = 0;
    while (h1 && h2 && i < 400) {
      const kind = hookKind(h2);
      if (kind && h1.memoizedState !== h2.memoizedState) out.push({ i, kind, h1: h1.memoizedState, h2: h2.memoizedState });
      h1 = h1.next; h2 = h2.next; i++;
    }
    if (a.memoizedProps !== f.memoizedProps) out.push({ i: 'props', kind: 'props', h1: a.memoizedProps, h2: f.memoizedProps });
    let c = f.dependencies && f.dependencies.firstContext; while (c) { out.push({ i: 'ctx', kind: 'ctx:' + ((c.context && c.context.displayName) || '?') }); c = c.next; }
    return out;
  };
  L.onCommit = (root) => {
    const now = performance.now();
    if (!L.on) { L.lastCommit = now; return; }
    const lower = L.lastCommit; L.lastCommit = now;
    L.commits++;
    // Top-down over the subtrees visited in this render; "top" = a component that rendered while
    // no ancestor of it did (where the update entered the tree).
    const stack = [root.current, false];
    while (stack.length) {
      const parentWorked = stack.pop(), f = stack.pop();
      if (f.sibling) stack.push(f.sibling, parentWorked);
      if (!(f.actualStartTime >= lower)) continue;
      const comp = [0, 1, 2, 11, 14, 15].includes(f.tag);
      const worked = comp && !!(f.flags & 1);
      if (f.child) stack.push(f.child, parentWorked || worked);
      if (!worked) continue;
      L.renderMs += f.selfBaseDuration || 0;
      const nm = nameOf(f);
      if (nm === 'EditorV2Inner') {
        const key = (f.memoizedProps && f.memoizedProps.modelid) + ' ' + paneTag(f);
        bump(L.editorRenders, key);
        for (const h of changedHooks(f)) {
          if ((h.i === 0 || h.i === 2) && h.kind === 'state') nonPlain(h.h2, h.i === 0 ? 'node' : 'edge', 0);
          const k = 'EditorV2Inner ' + paneTag(f) + ' hook#' + h.i + ' ' + h.kind;
          const e = bump(L.hooks, k);
          if (L.diffs.length < 40 && h.h1 !== undefined && (h.kind === 'state' || h.kind === 'reducer' || h.kind === 'uSES')) L.diffs.push({ k, d: diff(h.h1, h.h2) });
        }
      }
      if (!parentWorked) {
        const tag = paneTag(f);
        const ch = changedHooks(f).map((h) => '#' + h.i + ':' + h.kind).slice(0, 6).join(' ');
        bump(L.top, nm + ' [' + tag + '] <- ' + ch);
        if (nm !== 'EditorV2Inner') for (const h of changedHooks(f)) if (L.diffs.length < 40 && h.h1 !== undefined && (h.kind === 'uSES' || h.kind === 'state' || h.kind === 'reducer')) L.diffs.push({ k: nm + ' [' + tag + '] hook#' + h.i + ' ' + h.kind, d: diff(h.h1, h.h2) });
      }
    }
  };
  const profilingHooks = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'markStateUpdateScheduled' || prop === 'markForceUpdateScheduled') {
        return (fiber) => {
          if (!L.on) return;
          const fr = frames(0);
          const key = nameOf(fiber) + ' [' + paneTag(fiber) + '] ' + String(prop).replace(/^mark|Scheduled$/g, '') + ' <- ' + fr.slice(0, 3).join(' | ');
          bump(L.sched, key, fr);
        };
      }
      return () => {};
    },
  });
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    renderers: new Map(), supportsFiber: true,
    inject(r) {
      const id = this.renderers.size + 1; this.renderers.set(id, r);
      try { if (typeof r.injectProfilingHooks === 'function') { r.injectProfilingHooks(profilingHooks); L.profilingHooks = true; } } catch (e) { L.err = 'injectProfilingHooks: ' + e; }
      return id;
    },
    onScheduleFiberRoot() {}, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {}, checkDCE() {}, setStrictMode() {},
    onCommitFiberRoot(id, root) { try { L.onCommit(root); } catch (e) { L.err = String(e && e.stack || e); } },
  };
  const origRaf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (cb) {
    if (L.on) { L.raf++; bump(L.rafStacks, frames(1).slice(0, 3).join(' | ')); }
    return origRaf(cb);
  };
  const origTimeout = window.setTimeout.bind(window);
  window.setTimeout = function (cb, ms, ...rest) {
    if (L.on) { L.timeouts++; bump(L.timeoutStacks, 'ms=' + (ms | 0) + ' ' + frames(1).slice(0, 3).join(' | ')); }
    return origTimeout(cb, ms, ...rest);
  };
  const OrigRO = window.ResizeObserver;
  window.ResizeObserver = class extends OrigRO {
    constructor(cb) {
      super((entries, obs) => {
        if (L.on) { L.ro++; for (const e of entries.slice(0, 4)) { const t = e.target; bump(L.roTargets, (t.className && String(t.className).slice(0, 60)) + ' ' + Math.round(e.contentRect.width) + 'x' + Math.round(e.contentRect.height)); } }
        return cb(entries, obs);
      });
    }
  };
})();
`;

// ── Page helpers ───────────────────────────────────────────────────────────────────────────────
async function createProject(page: Page, name: string): Promise<string | null> {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForTimeout(5000);
    await page.locator('button', { hasText: 'New Project' }).first().click();
    await page.waitForTimeout(1500);
    await page.locator('input[type="text"]').first().fill(name);
    await page.locator('button', { hasText: /^Create/ }).last().click();
    await page.waitForTimeout(6000);
    return page.evaluate(`(() => { const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length ? a[a.length - 1].id : null; })()`) as Promise<string | null>;
}

async function metamodels(page: Page): Promise<Array<{ id: string; name: string; classes: number; refs: number }>> {
    return page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const p = j.L.fromPointer(j.DUser.current)?.project;
      return (p?.metamodels || []).map(m => ({ id: m.id, name: m.name, classes: (m.classes || []).length,
        refs: (m.classes || []).reduce((s, c) => s + (c.references || []).length, 0) }));
    })()`) as any;
}

async function runScript(page: Page, src: string, mmIndex: number, waitMs = 600): Promise<boolean[]> {
    return page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const svc = await import('/src/jjscript/services/JjScriptService.ts');
      const p = j.L.fromPointer(j.DUser.current).project;
      const mm = p.metamodels[${mmIndex}];
      const out = [];
      for (const line of ${JSON.stringify(src)}.split('\\n')) {
        const r = await svc.JjScriptService.execute(line, { level: 'M2', metamodelId: mm.id, metamodelName: mm.name });
        out.push(!!r.success);
        await new Promise(r => setTimeout(r, ${waitMs}));
      }
      return out;
    })()`) as Promise<boolean[]>;
}

async function createSecondMetamodel(page: Page): Promise<string> {
    return page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const nav = await import('/src/pages/components/Navbar.tsx');
      const p = j.L.fromPointer(j.DUser.current).project;
      const before = new Set((p.metamodels || []).map(m => m.id));
      nav.createM2(p);
      await new Promise(r => setTimeout(r, 3000));
      const p2 = j.L.fromPointer(j.DUser.current).project;
      const mm = (p2.metamodels || []).find(m => !before.has(m.id));
      if (!mm) return 'createM2: no new metamodel';
      const open = [...document.querySelectorAll('.dock-tab')].some(t => t.textContent.trim() === mm.name);
      if (!open) { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(mm); return 'createM2 + open2'; }
      return 'createM2';
    })()`) as Promise<string>;
}

/** Click the middle of the first edge path drawn in a model's pane, as a user would. */
async function clickEdge(page: Page, modelId: string): Promise<any> {
    const pt: any = await page.evaluate(`(() => {
      const pane = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${modelId}"]');
      // The longest drawn path of the first edge: its markers come first in the DOM and have no box.
      const edge = pane && pane.querySelector('.react-flow__edge');
      const path = edge && [...edge.querySelectorAll('path')]
        .filter((q) => { const r = q.getBoundingClientRect(); return r.width + r.height > 0; })
        .sort((x, y) => y.getTotalLength() - x.getTotalLength())[0];
      if (!path) return null;
      const p = path.getPointAtLength(path.getTotalLength() / 2);
      const m = path.getScreenCTM();
      return { x: p.x * m.a + p.y * m.c + m.e, y: p.x * m.b + p.y * m.d + m.f };
    })()`);
    if (!pt) return { clicked: false };
    await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(800);
    const selected = await page.evaluate(`document.querySelectorAll('[role="tabpanel"][aria-labelledby$="-tab-${modelId}"] .react-flow__edge.selected').length`);
    return { clicked: true, at: pt, selected };
}

/** Click an empty point of a model's pane (the first grid point whose top element is the pane). */
async function clickPane(page: Page, modelId: string): Promise<any> {
    const pt: any = await page.evaluate(`(() => {
      const pane = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${modelId}"] .react-flow__pane');
      if (!pane) return null;
      const r = pane.getBoundingClientRect();
      for (let fy = 0.2; fy < 0.9; fy += 0.1) for (let fx = 0.2; fx < 0.8; fx += 0.1) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        const el = document.elementFromPoint(x, y);
        if (el && el.classList && el.classList.contains('react-flow__pane')) return { x, y };
      }
      return null;
    })()`);
    if (!pt) return { clicked: false };
    await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(800);
    const selected = await page.evaluate(`document.querySelectorAll('[role="tabpanel"][aria-labelledby$="-tab-${modelId}"] .react-flow__edge.selected').length`);
    return { clicked: true, at: pt, selected };
}

async function clickTab(page: Page, text: string): Promise<boolean> {
    return page.evaluate(`(() => { const t = [...document.querySelectorAll('.dock-tab')].find(t => t.textContent.trim() === ${JSON.stringify(text)}); if (!t) return false; t.click(); return true; })()`) as Promise<boolean>;
}

async function closeTab(page: Page, text: string): Promise<boolean> {
    // The close button is drawn on hover only (zero size otherwise): click it through the DOM.
    const clicked = await page.evaluate(`(() => {
      const tab = [...document.querySelectorAll('.dock-tab')].find(t => t.textContent.trim() === ${JSON.stringify(text)});
      const btn = tab && tab.querySelector('.dock-tab-close-btn');
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    if (!clicked) return false;
    await page.waitForTimeout(2000);
    return (await page.locator('.dock-tab', { hasText: text }).count()) === 0;
}

async function panes(page: Page) {
    return page.evaluate(`(() => [...document.querySelectorAll('.dock-tabpane')].map(p => ({
      label: (p.getAttribute('aria-labelledby') || '').replace(/^.*-tab-/, ''),
      active: p.classList.contains('dock-tabpane-active'),
      ariaHidden: p.getAttribute('aria-hidden'),
      h: Math.round(p.getBoundingClientRect().height), w: Math.round(p.getBoundingClientRect().width),
      rfNodes: p.querySelectorAll('.react-flow__node').length,
      rfEdges: p.querySelectorAll('.react-flow__edge').length,
      handles: p.querySelectorAll('.react-flow__handle').length,
      canvas: (() => { const c = p.querySelector('.react-flow'); if (!c) return null; const r = c.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); })(),
    })))()`);
}

/** Sample SAMPLE_MS with nothing dispatched by the probe; the store's notifications are counted. */
async function sample(page: Page): Promise<any> {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    const metric = async () => {
        const m: any = await cdp.send('Performance.getMetrics');
        const get = (n: string) => (m.metrics.find((x: any) => x.name === n) || {}).value || 0;
        return { task: get('TaskDuration'), script: get('ScriptDuration'), layout: get('LayoutDuration'), style: get('RecalcStyleDuration'), t: get('Timestamp') };
    };
    const m0 = await metric();
    const s: any = await sampleInPage(page);
    const m1 = await metric();
    const wall = m1.t - m0.t;
    s.busy = { wallS: +wall.toFixed(2), taskPct: +((m1.task - m0.task) / wall * 100).toFixed(1), scriptPct: +((m1.script - m0.script) / wall * 100).toFixed(1),
        stylePct: +((m1.style - m0.style) / wall * 100).toFixed(1), layoutPct: +((m1.layout - m0.layout) / wall * 100).toFixed(1) };
    await cdp.detach();
    return s;
}
async function sampleInPage(page: Page): Promise<any> {
    return page.evaluate(`(async () => {
      const L = window.__loop;
      L.reset();
      const unsub = window.store.subscribe(() => { L.storeNotes++; });
      L.on = true;
      await new Promise(r => setTimeout(r, ${SAMPLE_MS}));
      L.on = false;
      unsub();
      L.nonPlainControl();
      const dt = (performance.now() - L.t0) / 1000;
      const sortObj = (o, k) => Object.entries(o).sort((a, b) => b[1].n - a[1].n).slice(0, k).map(([key, v]) => ({ key, n: v.n, sample: v.sample }));
      return { seconds: +dt.toFixed(2), commits: L.commits, commitsPerSec: +(L.commits / dt).toFixed(1), storeNotes: L.storeNotes,
        renderMsPerSec: +(L.renderMs / dt).toFixed(1),
        editorRenders: Object.fromEntries(Object.entries(L.editorRenders).map(([k, v]) => [k, { n: v.n, perSec: +(v.n / dt).toFixed(1) }])),
        top: sortObj(L.top, 12), hooks: sortObj(L.hooks, 12), sched: sortObj(L.sched, 12),
        raf: L.raf, rafStacks: sortObj(L.rafStacks, 6), timeouts: L.timeouts, timeoutStacks: sortObj(L.timeoutStacks, 6),
        ro: L.ro, roTargets: sortObj(L.roTargets, 6), nonPlain: sortObj(L.nonPlain, 20), nonPlainVisited: L.nonPlainVisited, diffs: L.diffs.slice(0, 12), err: L.err, profilingHooks: !!L.profilingHooks };
    })()`);
}

// ── Stack frames to source lines, through the inline source map Vite serves ───────────────────
let traceMapping: any = null;
try { traceMapping = await import('@jridgewell/trace-mapping'); } catch { traceMapping = null; }
const maps = new Map<string, any>();
async function mapFrame(frame: string): Promise<string> {
    const m = frame.match(/^(.*?)\s*\(?(https?:\/\/[^)\s]+):(\d+):(\d+)\)?$/);
    if (!m) return frame;
    const [, fn, url, line, col] = m;
    const path = url.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '');
    if (!traceMapping || !/\/src\//.test(path)) return `${fn} ${path}:${line}`;
    let tm = maps.get(url);
    if (tm === undefined) {
        tm = null;
        try {
            const text = await (await fetch(url)).text();
            const sm = text.match(/\/\/# sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,([A-Za-z0-9+/=]+)/);
            if (sm) tm = new traceMapping.TraceMap(JSON.parse(Buffer.from(sm[1], 'base64').toString('utf8')));
        } catch { tm = null; }
        maps.set(url, tm);
    }
    if (!tm) return `${fn} ${path}:${line} (transformed)`;
    const pos = traceMapping.originalPositionFor(tm, { line: Number(line), column: Number(col) - 1 });
    if (!pos || pos.line == null) return `${fn} ${path}:${line} (unmapped)`;
    const src = traceMapping.sourceContentFor(tm, pos.source) || '';
    const text = (src.split('\n')[pos.line - 1] || '').trim().slice(0, 120);
    return `${fn} ${path}:${pos.line}  «${text}»`;
}
async function mapSample(s: any) {
    for (const list of [s.sched, s.rafStacks, s.timeoutStacks]) {
        for (const e of list || []) {
            const fr: string[] = Array.isArray(e.sample) ? e.sample : e.key.split(' <- ').pop().split(' | ');
            e.mapped = [];
            for (const f of fr.slice(0, 6)) e.mapped.push(await mapFrame(f));
        }
    }
    return s;
}

// ── Counterfactual: rewrite the served useJjomSync.ts ─────────────────────────────────────────
async function newContext(label: string): Promise<{ ctx: any; patched: Record<string, number> }> {
    const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
    await ctx.addInitScript({ content: INIT });
    await seed(ctx, false);
    const patched: Record<string, number> = {};
    if (PATCH !== 'none') {
        const rewrites = REWRITES[PATCH];
        if (!rewrites) throw new Error('unknown LOOP_PATCH ' + PATCH);
        await ctx.route((u: any) => u.toString().includes('/src/components/editor-v2/hooks/useJjomSync.ts'), async (route: any) => {
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
    return { ctx, patched };
}
const checkPatched = (label: string, patched: Record<string, number>) => {
    if (PATCH === 'none') return;
    for (const [re] of REWRITES[PATCH]) check(`${label}: patch ${PATCH} matched once`, patched[String(re)] === 1, `${re} x${patched[String(re)] || 0}`);
};

// ── Scenes: the demo exports, every model pane opened, then one idle sample ────────────────────
async function runScenes(): Promise<void> {
    const { readdirSync, readFileSync } = await import('node:fs');
    const dir = process.env.LOOP_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
    const files = readdirSync(dir).filter((f: string) => f.endsWith('.jjodel')).sort();
    result.scenes = { dir, files: {} };
    for (const f of files) {
        const { ctx, patched } = await newContext(f);
        const page: Page = await ctx.newPage();
        const errs: string[] = [];
        page.on('pageerror', (e: Error) => errs.push(e.message));
        await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 180000 });
        await page.waitForTimeout(5000);
        const text = readFileSync(`${dir}/${f}`, 'utf8');
        const imported = await page.evaluate(`(async () => {
          const api = await import('/src/api/persistance/projects.ts');
          const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
          const before = count();
          await api.ProjectsApi.importFromText(${JSON.stringify(text)});
          for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
          const a = JSON.parse(localStorage.getItem('projects') || '[]');
          return a.length > before ? a[a.length - 1].id : null;
        })()`) as string | null;
        check(`scene ${f}: imported`, !!imported, String(imported));
        if (!imported) { await ctx.close(); continue; }
        await page.goto(`${URL}/#/project?id=${imported}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
        await page.waitForTimeout(9000);
        const models: Array<{ id: string; name: string; meta: boolean }> = await page.evaluate(`(async () => {
          const j = await import('/src/joiner/index.ts');
          const pr = j.L.fromPointer(j.DUser.current).project;
          if (!pr) return [];
          return [...(pr.metamodels || []).map(m => ({ id: m.id, name: m.name, meta: true })), ...(pr.models || []).filter(m => !m.isMetamodel).map(m => ({ id: m.id, name: m.name, meta: false }))];
        })()`) as any;
        for (const m of models) {
            await page.evaluate(`(async () => {
              const j = await import('/src/joiner/index.ts');
              const dm = await import('/src/components/abstract/DockManager.tsx');
              await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(m.id)}));
            })()`).catch(() => {});
            await page.waitForTimeout(5000);
        }
        await page.waitForTimeout(3000);
        checkPatched(`scene ${f}`, patched);
        const p = await panes(page);
        const s = await mapSample(await sample(page));
        const names = Object.fromEntries(models.map((m) => [m.id, (m.meta ? 'M2 ' : 'M1 ') + m.name]));
        const per = Object.entries(s.editorRenders).map(([k, v]: any) => `${names[k.split(' ')[0]] || k.split(' ')[0]} ${k.split(' ')[1]}=${v.perSec}/s`).join('; ');
        note(`scene ${f}`, `models=${models.length} commits/s=${s.commitsPerSec} renderMs/s=${s.renderMsPerSec} busy=${s.busy.taskPct}% storeNotes=${s.storeNotes} raf=${s.raf} editors: ${per || 'none'}`);
        result.scenes.files[f] = { models, panes: p, ...s, pageErrors: errs };
        writeFileSync(OUT, JSON.stringify(result, null, 1));
        await ctx.close();
    }
}

// ── Main ───────────────────────────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const result: any = { url: URL, sampleMs: SAMPLE_MS, patch: PATCH, variants: {} };
for (const variant of VARIANTS) {
    if (variant === 'scenes') { await runScenes(); continue; }
    const { ctx, patched } = await newContext(variant);
    const page = await ctx.newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', (e: Error) => pageErrors.push(e.message));
    const out: any = { phases: {}, notes: {} };
    result.variants[variant] = out;

    const pid = await createProject(page, `HiddenLoop_${variant}`);
    check(`${variant}: project created`, !!pid, String(pid));
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForTimeout(9000);
    await page.getByText('New metamodel', { exact: true }).first().click();
    await page.waitForTimeout(9000);
    out.notes.script = await runScript(page, SCRIPTS[variant], 0, variant === 'lib6' ? 250 : 600);
    await page.waitForTimeout(3000);
    let mms = await metamodels(page);
    out.notes.mm1 = mms[0];
    check(`${variant}: metamodel_1 written`, mms.length === 1 && out.notes.script.every(Boolean), JSON.stringify({ mms, script: out.notes.script }));
    const mm1 = mms[0];
    out.notes.profilingHooks = await page.evaluate('!!window.__loop.profilingHooks');
    check(`${variant}: React profiling hooks injected`, out.notes.profilingHooks === true, '');
    checkPatched(variant, patched);
    out.notes.patched = patched;

    const phase = async (name: string) => {
        const p = await panes(page);
        const s = await mapSample(await sample(page));
        out.phases[name] = { panes: p, ...s };
        const ed = Object.entries(s.editorRenders).map(([k, v]: any) => `${k}=${v.perSec}/s`).join(' ');
        note(`${variant} ${name}`, `commits/s=${s.commitsPerSec} renderMs/s=${s.renderMsPerSec} busy=${s.busy.taskPct}% storeNotes=${s.storeNotes} raf=${s.raf} timeouts=${s.timeouts} ro=${s.ro} editors: ${ed || 'none'}`);
        writeFileSync(OUT, JSON.stringify(result, null, 1));
    };

    await phase('mm1-visible');
    out.notes.createM2 = await createSecondMetamodel(page);
    await page.waitForTimeout(8000);
    mms = await metamodels(page);
    const mm2 = mms.find((m) => m.id !== mm1.id);
    check(`${variant}: metamodel_2 created`, !!mm2, JSON.stringify(mms));
    await phase('mm1-hidden');
    out.notes.clickMm1 = await clickTab(page, mm1.name);
    await page.waitForTimeout(3000);
    await phase('mm1-visible-again');
    if (mm2) out.notes.clickMm2 = await clickTab(page, mm2.name);
    await page.waitForTimeout(3000);
    await phase('mm1-hidden-again');
    if (process.env.LOOP_EDGE_PHASES === '1' && variant !== 'classes') {
        // An edge selected by a click: EditorV2 keeps it selected through sync patches.
        out.notes.clickMm1ForEdge = await clickTab(page, mm1.name);
        await page.waitForTimeout(2000);
        out.notes.edgeClick = await clickEdge(page, mm1.id);
        check(`${variant}: an edge of metamodel_1 is selected`, out.notes.edgeClick.selected === 1, JSON.stringify(out.notes.edgeClick));
        await phase('mm1-edge-selected');
        if (mm2) out.notes.clickMm2WithEdge = await clickTab(page, mm2.name);
        await page.waitForTimeout(2000);
        await phase('mm1-hidden-edge-selected');
        out.notes.clickMm1ForPane = await clickTab(page, mm1.name);
        await page.waitForTimeout(2000);
        out.notes.paneClick = await clickPane(page, mm1.id);
        check(`${variant}: the pane click cleared the edge selection`, out.notes.paneClick.selected === 0, JSON.stringify(out.notes.paneClick));
        await phase('mm1-pane-clicked');
    }
    out.notes.closeMm1 = await closeTab(page, mm1.name);
    await page.waitForTimeout(3000);
    await phase('mm1-closed');
    out.pageErrors = pageErrors;
    note(`${variant} page errors`, pageErrors.length);
    await ctx.close();
}
result.failures = failures;
writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(`OUT ${OUT}`);
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
