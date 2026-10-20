/**
 * large-model-click-profile probe (P-2026-10-20-1830).
 *
 * Question: why does one selection click on a node of a large model block the main thread for
 * seconds (up to 58 s measured by the chat on 2026-10-20), and what does the cost scale with.
 *
 * Drives the real app (never 3001): imports the fixture through `ProjectsApi.importFromText`, opens
 * the model, activates a viewpoint by name, waits for the canvas to settle, then starts the CDP
 * profiler, clicks one node, waits for the main thread to settle (no long task for SETTLE_MS),
 * stops the profiler and writes:
 *   - the raw profile:   frontend/.vite-cache/perfclick-<label>.cpuprofile (gitignored);
 *   - the measures:      frontend/.vite-cache/perfclick-<label>.json;
 *   - on stdout: long tasks, store dispatches (type, ms inside dispatch, subscribers), React commits
 *     with the components rendered in each (dev only: the count needs profiling fields), react-redux
 *     selector warnings, and the top-30 self-time table by function.
 *
 * Every instrument is installed by the probe; none is in the app.
 *
 * Run (dev):   ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *                frontend/scripts/probe/large-model-click-profile.ts --port 3047 [--id <Prompt-ID>]
 * Run (prod):  build and `vite preview` on a port, then PROBE_URL=http://localhost:<port>/ \
 *                CLICK_PROD=1 npx tsx frontend/scripts/probe/large-model-click-profile.ts
 * Env:  CLICK_FIXTURE   the .jjodel export (default the «Jjodel harness» project, read only)
 *       CLICK_VP        viewpoint name to activate (default «Harness / Lane process (BPMN)»);
 *                       "-" = abstract syntax (no viewpoint)
 *       CLICK_TARGET    "model" (default) | "metamodel": the tab whose canvas is clicked
 *       CLICK_STRIP     comma list applied in the page before the canvas opens:
 *                         "other-vps"  delete every user viewpoint but the active one
 *                         "model"      delete the model (only the metamodel is left)
 *       CLICK_NODES     how many different nodes to click, one profile each (default 2)
 *       CLICK_LABEL     output label (default derived from the variant)
 *       CLICK_PROD      "1": the page is a production build (no /src imports)
 *       CLICK_INTERVAL  profiler sampling interval in us (default 500)
 *       CLICK_OPEN_REFS "1": after each click, open the «References» section of the Properties
 *                       panel and count the validTargets* calls that opening makes (the click's own
 *                       counts are the closed-section case) (P-2026-10-20-1955)
 *       CLICK_ABLATE    comma list of in-page prototype ablations, active while recording:
 *                         "validTargets"  validTargetsJSX / validTargetOptions return []
 *                         "modelname"     LModel.name returns data.name without the $name scan
 *       CLICK_STEPS     comma list of profiled interactions besides the clicks (P-2026-10-20-2305):
 *                         "open"    the model tab opening plus the viewpoint activation
 *                         "drag"    one 100 px drag of the first clicked node
 *                         "type"    one character typed in the Properties name field
 *                         "commit"  Enter in that field (the store write of the new name)
 *                         "vp"      switching to the viewpoint CLICK_VP2 (default «Harness / Authority»)
 *                         "audit"   dev only, last: targeted store writes, each followed by a count of
 *                                   the rendered nodes whose data differs from a fresh transform
 *                                   (stale nodes); not profiled (P-2026-10-21-0035)
 *       CLICK_STACKS    "1": sample the callers of LModel.name (slows the run; counts only)
 */
import { chromium, type Page, type CDPSession } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3047/').replace(/\/$/, '');
if (/:3001$/.test(URL)) throw new Error('never 3001');
const FIXTURE = process.env.CLICK_FIXTURE || `${process.env.HOME}/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`;
const VP = process.env.CLICK_VP ?? 'Harness / Lane process (BPMN)';
const TARGET = process.env.CLICK_TARGET || 'model';
const STRIP = new Set((process.env.CLICK_STRIP || '').split(',').filter(Boolean));
const NODES = Number(process.env.CLICK_NODES || 2);
const PROD = process.env.CLICK_PROD === '1';
const INTERVAL = Number(process.env.CLICK_INTERVAL || 500);
const STEPS = new Set((process.env.CLICK_STEPS || '').split(',').filter(Boolean));
const VP2 = process.env.CLICK_VP2 || 'Harness / Authority';
const SETTLE_MS = 3000;
const LABEL = process.env.CLICK_LABEL
    || [PROD ? 'prod' : 'dev', TARGET, VP === '-' ? 'abstract' : VP.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, ''), ...STRIP].join('-');
const HERE = dirname(fileURLToPath(import.meta.url));
const OUTDIR = resolve(HERE, '../../.vite-cache');
mkdirSync(OUTDIR, { recursive: true });

const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};

// ── Page-side instruments (a plain string: no transform touches it) ────────────────────────────
const INIT = String.raw`
globalThis.__name = (f) => f;
(() => {
  const P = window.__perfclick = { recording: false, longtasks: [], dispatches: [], commits: [], names: {}, warns: 0, warnSamples: [], lastCommit: 0, err: null, depth: 0 };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) P.longtasks.push({ start: e.startTime, ms: e.duration }); })
      .observe({ type: 'longtask', buffered: true });
  } catch (e) { P.err = 'longtask observer: ' + e; }
  const origWarn = console.warn;
  console.warn = function (...a) {
    if (P.recording) { const s = String(a[0]); if (s.includes('returned a different result') || s.includes('Selector')) { P.warns++; if (P.warnSamples.length < 3) P.warnSamples.push(s.slice(0, 300)); } }
    return origWarn.apply(this, a);
  };
  // Wrap store.dispatch as soon as the store is published on window (windoww.store).
  P.wrap = (store) => {
    if (!store || store.__perfclickWrapped) return;
    const orig = store.dispatch;
    const subs = [];
    const origSub = store.subscribe;
    store.subscribe = function (fn) { subs.push(fn); const un = origSub.call(this, fn); return () => { const i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); un(); }; };
    P.subscribers = () => subs.length;
    store.dispatch = function (action) {
      if (!P.recording) return orig.call(this, action);
      const t0 = performance.now(); P.depth++;
      const rec = { t: t0, type: action && action.type, depth: P.depth, ms: 0, inner: [] };
      try {
        if (action && action.type === 'COMPOSITE_ACTION' && Array.isArray(action.actions)) rec.inner = action.actions.slice(0, 12).map(a => a.type + (a.field ? ':' + a.field : '') + (a.path ? ':' + String(a.path).slice(0, 40) : ''));
        else if (action && action.field) rec.inner = [String(action.field)];
        else if (action && action.path) rec.inner = [String(action.path).slice(0, 60)];
      } catch {}
      try { return orig.call(this, action); }
      finally { P.depth--; rec.ms = performance.now() - t0; P.dispatches.push(rec); }
    };
    store.__perfclickWrapped = true;
  };
  let tries = 0;
  const poll = setInterval(() => { if (window.store) { P.wrap(window.store); clearInterval(poll); } else if (++tries > 2400) clearInterval(poll); }, 50);
  // React commits: fibers that rendered in this commit (dev only: actualStartTime and
  // selfBaseDuration exist under the profiling build of react-dom, which dev is).
  const COMPONENT = new Set([0, 1, 2, 11, 14, 15]);
  const nameOf = (f) => { const t = f.type; if (!t) return '?'; return t.displayName || t.name || (t.render && (t.render.displayName || t.render.name)) || (t.type && (t.type.displayName || t.type.name)) || 'Anonymous'; };
  P.onCommit = (root) => {
    const now = performance.now();
    if (!P.recording) { P.lastCommit = now; return; }
    const lower = P.lastCommit; P.lastCommit = now;
    const rec = { t: now, n: 0, ms: 0, dispatchIndex: P.dispatches.length };
    const stack = [root.current];
    const profiling = root.current && root.current.actualStartTime !== undefined;
    while (stack.length) {
      const f = stack.pop();
      if (f.sibling) stack.push(f.sibling);
      if (profiling && !(f.actualStartTime >= lower)) continue;
      if (f.child) stack.push(f.child);
      if (!(COMPONENT.has(f.tag) && (f.flags & 1))) continue;
      if (!profiling) continue;
      const self = f.selfBaseDuration || 0;
      rec.n++; rec.ms += self;
      const nm = nameOf(f);
      const e = P.names[nm] || (P.names[nm] = [0, 0]); e[0]++; e[1] += self;
    }
    rec.profiling = profiling;
    P.commits.push(rec);
  };
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    renderers: new Map(), supportsFiber: true,
    inject(r) { const id = this.renderers.size + 1; this.renderers.set(id, r); return id; },
    onScheduleFiberRoot() {}, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {}, checkDCE() {},
    onCommitFiberRoot(id, root) { try { P.onCommit(root); } catch (e) { P.err = String(e && e.stack || e); } },
  };
})();
`;

// ── Page helpers ───────────────────────────────────────────────────────────────────────────────
/** Store-only facts, readable in dev and prod alike. */
const FACTS = `(() => {
  const st = window.store.getState();
  const L = st.idlookup;
  const all = Object.values(L);
  const by = (c) => all.filter(d => d && d.className === c);
  const project = by('DProject')[0] || null;
  const vps = by('DViewPoint').map(v => ({ id: v.id, name: v.name, views: (v.subViews || []).length }));
  return {
    idlookup: all.length,
    objects: by('DObject').length, values: by('DValue').length, views: by('DViewElement').length,
    viewpoints: vps, activeVp: project ? project.activeViewpoint : null, rootVp: st.viewpoint,
    models: by('DModel').map(m => ({ id: m.id, name: m.name, isMetamodel: m.isMetamodel })),
    dom: document.getElementsByTagName('*').length,
    rfNodes: document.querySelectorAll('.react-flow__node').length,
    rfNodesVisible: [...document.querySelectorAll('.react-flow__node')].filter(e => e.checkVisibility()).length,
    rfEdges: document.querySelectorAll('.react-flow__edge').length,
    tabs: [...document.querySelectorAll('.dock-tab')].map(t => t.textContent.trim().slice(0, 40)),
    heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
    subscribers: window.__perfclick.subscribers ? window.__perfclick.subscribers() : null,
  };
})()`;

/** Resolves when no long task has ended in the last `quiet` ms (cap `cap` ms). */
const settle = (quiet: number, cap: number) => `(async () => {
  const P = window.__perfclick, t0 = performance.now();
  for (;;) {
    await new Promise(r => setTimeout(r, 250));
    const last = P.longtasks.length ? Math.max(...P.longtasks.map(l => l.start + l.ms)) : 0;
    const now = performance.now();
    if (now - Math.max(last, t0) >= ${quiet}) return now - t0;
    if (now - t0 > ${cap}) return -1;
  }
})()`;

async function importFixture(page: Page): Promise<string | null> {
    const text = readFileSync(FIXTURE, 'utf8');
    return page.evaluate(`(async () => {
      const api = window.ProjectsApi;
      const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
      const before = count();
      await api.importFromText(${JSON.stringify(text)});
      for (let i = 0; i < 150 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
      const a = JSON.parse(localStorage.getItem('projects') || '[]');
      return a.length > before ? a[a.length - 1].id : null;
    })()`) as Promise<string | null>;
}

// ── CPU profile ────────────────────────────────────────────────────────────────────────────────
interface Prof { nodes: any[]; startTime: number; endTime: number; samples: number[]; timeDeltas: number[] }
const chunkMaps = new Map<string, Array<[number, string]>>();
async function loadChunkMaps(profile: Prof) {
    const urls = new Set<string>();
    for (const n of profile.nodes) if (/\/deps\/[^?]+\.js/.test(n.callFrame.url || '')) urls.add(n.callFrame.url.replace(/\?.*$/, ''));
    for (const u of urls) {
        if (chunkMaps.has(u)) continue;
        let text = '';
        try { text = await (await fetch(u)).text(); } catch { text = ''; }
        const marks: Array<[number, string]> = [];
        text.split('\n').forEach((line, i) => {
            const m = line.match(/^\/\/ .*node_modules\/((?:@[^/]+\/)?[^/]+)\//);
            if (m) marks.push([i, m[1]]);
        });
        chunkMaps.set(u, marks);
    }
}
function moduleOf(cf: any): string {
    const url: string = (cf.url || '').replace(/\?.*$/, '');
    if (!url) return '';
    const src = url.match(/\/src\/.*$/);
    if (src) return src[0];
    const marks = chunkMaps.get(url);
    if (marks) {
        let pkg = '';
        for (const [line, name] of marks) { if (line <= cf.lineNumber) pkg = name; else break; }
        if (pkg) return 'pkg:' + pkg;
    }
    const dep = url.match(/\/deps\/([^/]+)\.js$/);
    return dep ? 'pkg:' + dep[1].replace(/_/g, '/') : url.replace(/^https?:\/\/[^/]+/, '');
}

function analyse(profile: Prof) {
    const byId = new Map<number, any>();
    const parent = new Map<number, number>();
    for (const n of profile.nodes) byId.set(n.id, n);
    for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
    const self = new Map<number, number>();
    for (let i = 0; i < profile.samples.length; i++) {
        const ms = (i + 1 < profile.timeDeltas.length ? profile.timeDeltas[i + 1] : 0) / 1000;
        self.set(profile.samples[i], (self.get(profile.samples[i]) || 0) + ms);
    }
    const fnSelf: Record<string, number> = {};
    const modSelf: Record<string, number> = {};
    const fnIncl: Record<string, number> = {};
    const modIncl: Record<string, number> = {};
    let total = 0, idle = 0;
    const key = (cf: any) => `${cf.functionName || '(anon)'} @ ${moduleOf(cf) || '(native)'}:${cf.lineNumber + 1}`;
    for (const [id, ms] of self) {
        const cf = byId.get(id).callFrame;
        total += ms;
        if (cf.functionName === '(idle)') { idle += ms; continue; }
        fnSelf[key(cf)] = (fnSelf[key(cf)] || 0) + ms;
        const m = moduleOf(cf) || cf.functionName;
        modSelf[m] = (modSelf[m] || 0) + ms;
        const seenF = new Set<string>(), seenM = new Set<string>();
        for (let x: number | undefined = id; x !== undefined; x = parent.get(x)) {
            const c = byId.get(x).callFrame;
            const k = key(c), mm = moduleOf(c);
            if (!seenF.has(k)) { seenF.add(k); fnIncl[k] = (fnIncl[k] || 0) + ms; }
            if (mm && !seenM.has(mm)) { seenM.add(mm); modIncl[mm] = (modIncl[mm] || 0) + ms; }
        }
    }
    const top = (o: Record<string, number>, k: number) =>
        Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, k).map(([f, v]) => [f, +v.toFixed(1)] as [string, number]);
    return { totalMs: +total.toFixed(1), busyMs: +(total - idle).toFixed(1), fnSelfTop: top(fnSelf, 30), modSelfTop: top(modSelf, 20), fnInclTop: top(fnIncl, 40), modInclTop: top(modIncl, 25) };
}

// ── Main ───────────────────────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ args: ['--enable-precise-memory-info'] });
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await ctx.addInitScript({ content: INIT });
await seed(ctx, false);
const page = await ctx.newPage();
const pageErrors: string[] = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
const cdp: CDPSession = await ctx.newCDPSession(page);
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: INTERVAL });

const result: any = { label: LABEL, url: URL, prod: PROD, vp: VP, target: TARGET, strip: [...STRIP], clicks: [] };
await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 180000 });
await page.waitForTimeout(5000);
const pid = await importFixture(page);
check('fixture imported', !!pid, String(pid));
await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
await page.waitForTimeout(10000);
let facts: any = await page.evaluate(FACTS);
note('after open', facts);

// Call counters on the L-layer paths the first profile named, and the ablations. Prototype
// patches in the page; the source is untouched. Production reads the classes off window.
// Installed before the canvas opens (they count only while recording), so the "open" step counts too.
{
    const inst = await page.evaluate(`(async () => {
      const j = ${PROD ? 'window' : "await import('/src/joiner/index.ts')"};
      const C = window.__perfclick.calls = {};
      const stacks = ${JSON.stringify(process.env.CLICK_STACKS === '1')};
      const wrap = (cls, name, label, ablate, sample) => {
        const p = cls && cls.prototype; if (!p || typeof p[name] !== 'function') return label + ': missing';
        const orig = p[name];
        p[name] = function (...a) {
          if (!window.__perfclick.recording) return orig.apply(this, a);
          const e = C[label] || (C[label] = { n: 0, ms: 0, depth: 0, callers: {} });
          e.n++; const t = performance.now(); e.depth++;
          if (sample && stacks) {
            // The first frames outside the probe's wrapper and the proxy plumbing name the caller.
            const fr = String(new Error().stack).split('\\n').slice(2)
              .filter(s => !/proxy\\.ts|<anonymous>|at Proxy\\.|at Object\\.get /.test(s)).slice(0, 3)
              .map(s => s.trim().replace(/^at /, '').replace(/\\(?https?:\\/\\/[^/]+/, '').replace(/\\?[^:]*/, '')).join(' < ');
            e.callers[fr] = (e.callers[fr] || 0) + 1;
          }
          try { return ablate ? ablate.apply(this, a) : orig.apply(this, a); } finally { e.depth--; if (e.depth === 0) e.ms += performance.now() - t; }
        };
        return label + ': ok';
      };
      const ab = new Set(${JSON.stringify((process.env.CLICK_ABLATE || '').split(',').filter(Boolean))});
      const none = function () { return []; };
      return [
        wrap(j.LValue, 'get_validTargetsJSX', 'LValue.validTargetsJSX', ab.has('validTargets') ? none : null),
        wrap(j.LValue, 'get_validTargetOptions', 'LValue.validTargetOptions', ab.has('validTargets') ? none : null),
        wrap(j.LValue, 'get_validTargets', 'LValue.validTargets', null),
        wrap(j.LModelElement, 'get_fullname', 'LModelElement.fullname', null),
        wrap(j.LObject, 'get_name', 'LObject.name', null, true),
        // LModel inherits get_name from LPointerTargetable (joiner/classes.ts), whose $name read is
        // the O(n) _defaultGetterM1 scan; the ablation returns what that getter returns in the end.
        wrap(j.LModel, 'get_name', 'LModel.name', ab.has('modelname') ? function (c) { return c.data.name || c.data.className; } : null, true),
        'ablate=' + ([...ab].join(',') || 'none'),
      ];
    })()`);
    note('instruments', inst);
}

// Strips run on the live store before the canvas tab opens (in-page only; the fixture is untouched).
if (STRIP.size) {
    const stripped = await page.evaluate(`(async () => {
      const out = [];
      const st = window.store.getState();
      const L = st.idlookup;
      const proj = Object.values(L).find(d => d && d.className === 'DProject');
      const j = ${PROD ? 'null' : "await import('/src/joiner/index.ts')"};
      if (!j) return ['strip needs dev'];
      const del = (id) => { try { j.LPointerTargetable.fromPointer(id).delete(); return true; } catch (e) { out.push('delete ' + id + ' threw ' + e); return false; } };
      if (${STRIP.has('other-vps')}) {
        const keep = Object.values(L).find(d => d && d.className === 'DViewPoint' && d.name === ${JSON.stringify(VP)});
        const vps = (proj.viewpoints || []).filter(id => keep && id !== keep.id && L[id] && L[id].className === 'DViewPoint' && !j.Defaults.isSystemViewpoint(id));
        let n = 0; for (const id of vps) if (del(id)) n++;
        out.push('viewpoints deleted ' + n + ' of ' + vps.length);
      }
      if (${STRIP.has('model')}) {
        const ms = (proj.models || []).filter(id => L[id] && L[id].className === 'DModel' && !L[id].isMetamodel);
        let n = 0; for (const id of ms) if (del(id)) n++;
        out.push('models deleted ' + n + ' of ' + ms.length);
      }
      await new Promise(r => setTimeout(r, 3000));
      return out;
    })()`);
    note('strip', stripped);
}

// ── Profiled interaction: reset the page instruments, profile, act, settle, collect ────────────
const RESET = `(() => { const P = window.__perfclick; P.longtasks = []; P.dispatches = []; P.commits = []; P.names = {}; P.warns = 0; P.warnSamples = []; if (P.calls) for (const k of Object.keys(P.calls)) delete P.calls[k]; P.lastCommit = performance.now(); P.recording = true; })()`;
const COLLECT = `(() => {
      const P = window.__perfclick; P.recording = false;
      const byType = {};
      for (const d of P.dispatches) { const e = byType[d.type] || (byType[d.type] = { n: 0, ms: 0, top: 0 }); e.n++; if (d.depth === 1) { e.ms += d.ms; e.top++; } }
      return {
        longtasks: P.longtasks.map(l => Math.round(l.ms)), longtaskSum: Math.round(P.longtasks.reduce((s, l) => s + l.ms, 0)),
        dispatches: P.dispatches.length, topDispatches: P.dispatches.filter(d => d.depth === 1).length,
        dispatchMsTop: Math.round(P.dispatches.filter(d => d.depth === 1).reduce((s, d) => s + d.ms, 0)),
        byType, slowest: P.dispatches.filter(d => d.depth === 1).sort((a, b) => b.ms - a.ms).slice(0, 8).map(d => ({ type: d.type, ms: Math.round(d.ms), inner: d.inner })),
        commits: P.commits.length, commitFibers: P.commits.map(c => c.n), commitRenderMs: Math.round(P.commits.reduce((s, c) => s + c.ms, 0)),
        topComponents: Object.entries(P.names).sort((a, b) => b[1][1] - a[1][1]).slice(0, 25).map(([k, [c, ms]]) => [k, c, Math.round(ms)]),
        warns: P.warns, warnSamples: P.warnSamples, err: P.err,
        selected: (window.store.getState()._lastSelected || {}).modelElement || null,
        calls: P.calls ? Object.fromEntries(Object.entries(P.calls).map(([k, v]) => [k, { n: v.n, ms: Math.round(v.ms) }])) : null,
        callers: P.calls ? Object.fromEntries(Object.entries(P.calls).filter(([, v]) => v.callers && Object.keys(v.callers).length)
          .map(([k, v]) => [k, Object.entries(v.callers).sort((a, b) => b[1] - a[1]).slice(0, 12)])) : null,
        sel: (() => {
          const L = window.store.getState().idlookup, id = (window.store.getState()._lastSelected || {}).modelElement, d = L[id];
          if (!d) return null;
          const slots = (d.features || []).map(f => L[f]).filter(Boolean);
          const refs = slots.filter(v => L[v.instanceof] && L[v.instanceof].className === 'DReference');
          return { className: d.className, name: d.name, metaclass: L[d.instanceof] && L[d.instanceof].name, slots: slots.length, refSlots: refs.length,
                   refTypes: refs.map(v => L[L[v.instanceof].type] && L[L[v.instanceof].type].name) };
        })(),
      };
    })()`;
result.steps = [];
async function profiled(step: string, act: () => Promise<unknown>) {
    await page.evaluate(RESET);
    await cdp.send('Profiler.start');
    const t0 = Date.now();
    const acted = await act();
    const actMs = Date.now() - t0;
    const settledMs = await page.evaluate(settle(SETTLE_MS, 240000)) as number;
    const wallMs = Date.now() - t0;
    const { profile } = await cdp.send('Profiler.stop') as any;
    const rec: any = await page.evaluate(COLLECT);
    await loadChunkMaps(profile);
    const cpu = analyse(profile);
    const file = join(OUTDIR, `perfclick-${LABEL}-${step}.cpuprofile`);
    writeFileSync(file, JSON.stringify(profile));
    Object.assign(rec, { step, acted, actMs, settledMs: Math.round(settledMs), wallMs, profile: file, cpu });
    note(`step ${step}`, { acted, wallMs, actMs, longtasks: rec.longtasks, longtaskSum: rec.longtaskSum, busyMs: cpu.busyMs, dispatches: rec.dispatches, byType: rec.byType, commits: rec.commits, commitFibers: rec.commitFibers.slice(0, 20), calls: rec.calls });
    note(`step ${step} top components`, rec.topComponents.slice(0, 15));
    if (rec.callers) note(`step ${step} callers`, rec.callers);
    console.log(`TOP10 self time, ${step} (ms, function @ module:line)`);
    for (const [f, ms] of cpu.fnSelfTop.slice(0, 10)) console.log(`  ${String(ms).padStart(9)}  ${f}`);
    result.steps.push(rec);
    writeFileSync(join(OUTDIR, `perfclick-${LABEL}.json`), JSON.stringify(result, null, 1));
    return rec;
}
/** Activates a viewpoint by name: activateViewpoint in dev, its two writes by hand in production. */
const activateVp = (name: string) => `(async () => {
  const L = window.store.getState().idlookup;
  const vp = ${JSON.stringify(name)} === '-' ? null : Object.values(L).find(d => d && d.className === 'DViewPoint' && d.name === ${JSON.stringify(name)});
  if (${JSON.stringify(name)} !== '-' && !vp) return { error: 'no viewpoint named ' + ${JSON.stringify(name)} };
  ${PROD ? `
  const proj = Object.values(L).find(d => d && d.className === 'DProject');
  window.SetFieldAction.new(proj.id, 'activeViewpoint', vp ? vp.id : null, '', true);
  window.SetRootFieldAction.new('viewpoint', vp ? vp.id : null, '', true);` : `
  (await import('/src/utils/lastViewpoint.ts')).activateViewpoint(vp ? vp.id : null);`}
  return { vp: vp ? vp.name : null };
})()`;

// Open the target model's tab and activate the viewpoint.
const OPEN_JS = `(async () => {
  const st = window.store.getState();
  const L = st.idlookup;
  const want = ${JSON.stringify(TARGET)};
  const m = Object.values(L).find(d => d && d.className === 'DModel' && (want === 'metamodel' ? d.isMetamodel : !d.isMetamodel));
  if (!m) return { error: 'no ' + want };
  const vp = ${JSON.stringify(VP)} === '-' ? null : Object.values(L).find(d => d && d.className === 'DViewPoint' && d.name === ${JSON.stringify(VP)});
  if (${JSON.stringify(VP)} !== '-' && !vp) return { error: 'no viewpoint named ' + ${JSON.stringify(VP)} };
  ${PROD ? `
  // Production: the RuntimeAccessible classes are on window under their cname (classes.ts,
  // windoww[constructor.cname]); activateViewpoint's two writes are repeated by hand.
  const open = [...document.querySelectorAll('.dock-tab')].some(t => t.textContent.trim() === m.name);
  if (!open) await window.DockManager.open2(window.LModel.fromPointer(m.id));
  else [...document.querySelectorAll('.dock-tab')].find(t => t.textContent.trim() === m.name).click();
  const proj = Object.values(L).find(d => d && d.className === 'DProject');
  window.SetFieldAction.new(proj.id, 'activeViewpoint', vp ? vp.id : null, '', true);
  window.SetRootFieldAction.new('viewpoint', vp ? vp.id : null, '', true);
  return { model: m.name, id: m.id, vp: vp ? vp.name : null, wasOpen: open, via: 'window globals' };` : `
  const j = await import('/src/joiner/index.ts');
  const dm = await import('/src/components/abstract/DockManager.tsx');
  const lv = await import('/src/utils/lastViewpoint.ts');
  const open = [...document.querySelectorAll('.dock-tab')].some(t => t.textContent.trim() === m.name);
  if (!open) await dm.default.open2(j.LModel.fromPointer(m.id));
  else [...document.querySelectorAll('.dock-tab')].find(t => t.textContent.trim() === m.name).click();
  lv.activateViewpoint(vp ? vp.id : null);
  return { model: m.name, id: m.id, vp: vp ? vp.name : null, wasOpen: open };`}
})()`;
const opened: any = STEPS.has('open')
    ? (await profiled('open', () => page.evaluate(OPEN_JS))).acted
    : await page.evaluate(OPEN_JS);
note('opened', opened);
check('target opened', !opened.error, JSON.stringify(opened));
await page.waitForTimeout(8000);
const settled0 = await page.evaluate(settle(SETTLE_MS, 240000));
facts = await page.evaluate(FACTS);
note('before clicks', { settledMs: settled0, ...facts, viewpoints: facts.viewpoints.length });
result.before = facts;

const paneSel = opened.id ? `[role="tabpanel"][aria-labelledby$="-tab-${opened.id}"]` : '';
// Clickable = a point of the node's on-screen rect (5x5 grid, centre first) hit-tests to the node
// itself, not to a nested node or an overlay. Returns [id, x, y] per node.
const CLICKABLE = `(() => {
  const pane = document.querySelector(${JSON.stringify(paneSel)}) || document;
  const pr = (pane.querySelector('.react-flow') || pane).getBoundingClientRect();
  const out = [];
  for (const n of pane.querySelectorAll('.react-flow__node')) {
    const r = n.getBoundingClientRect();
    const x0 = Math.max(r.left, pr.left, 0), x1 = Math.min(r.right, pr.right, innerWidth);
    const y0 = Math.max(r.top, pr.top, 0), y1 = Math.min(r.bottom, pr.bottom, innerHeight);
    if (x1 - x0 < 4 || y1 - y0 < 4) continue;
    const pts = [[0.5, 0.5]];
    for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) for (const fy of [0.1, 0.3, 0.5, 0.7, 0.9]) pts.push([fx, fy]);
    for (const [fx, fy] of pts) {
      const x = x0 + (x1 - x0) * fx, y = y0 + (y1 - y0) * fy;
      const el = document.elementFromPoint(x, y);
      if (el && el.closest('.react-flow__node') === n) { out.push([n.getAttribute('data-id'), x, y]); break; }
    }
  }
  return out;
})()`;
let nodeHits: Array<[string, number, number]> = await page.evaluate(CLICKABLE) as any;
for (let z = 0; nodeHits.length < NODES && z < 6; z++) {
    // Zoom out with the wheel on the pane centre (React Flow zoomOnScroll).
    const pb = await page.locator(`${paneSel} .react-flow__pane`).first().boundingBox().catch(() => null);
    if (!pb) break;
    await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(1500);
    await page.evaluate(settle(SETTLE_MS, 240000));
    nodeHits = await page.evaluate(CLICKABLE) as any;
    note('zoom out', { step: z + 1, clickable: nodeHits.length });
}
const nodeIds = nodeHits.map((h) => h[0]);
check('visible nodes in the target pane', nodeIds.length > 0, `${nodeIds.length}`);

for (let k = 0; k < Math.min(NODES, nodeIds.length); k++) {
    // Two different nodes, spread over the list, so the second click changes the selection.
    const [id, px, py] = nodeHits[Math.floor((k + 1) * nodeHits.length / (NODES + 1))];
    const hit: any = await page.evaluate(`(() => {
      const el = document.elementFromPoint(${px}, ${py});
      const node = el && el.closest('.react-flow__node');
      return { tag: el ? el.tagName + '.' + String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 60) : null, node: node ? node.getAttribute('data-id') : null,
               text: node ? node.textContent.trim().slice(0, 40) : null };
    })()`);
    note(`click ${k + 1} target`, { id, hit, at: [Math.round(px), Math.round(py)] });
    await page.evaluate(RESET);
    await cdp.send('Profiler.start');
    const t0 = Date.now();
    await page.mouse.click(px, py);
    const clickReturnedMs = Date.now() - t0;
    const settledMs = await page.evaluate(settle(SETTLE_MS, 240000)) as number;
    const wallMs = Date.now() - t0;
    const { profile } = await cdp.send('Profiler.stop') as any;
    const rec: any = await page.evaluate(COLLECT);
    await loadChunkMaps(profile);
    const cpu = analyse(profile);
    const file = join(OUTDIR, `perfclick-${LABEL}-click${k + 1}.cpuprofile`);
    writeFileSync(file, JSON.stringify(profile));
    Object.assign(rec, { click: k + 1, node: id, clickReturnedMs, settledMs: Math.round(settledMs), wallMs, profile: file, cpu });
    note(`click ${k + 1}`, { node: id, wallMs, clickReturnedMs, longtasks: rec.longtasks, longtaskSum: rec.longtaskSum, dispatches: rec.dispatches, topDispatches: rec.topDispatches, dispatchMsTop: rec.dispatchMsTop, commits: rec.commits, commitFibers: rec.commitFibers.slice(0, 20), commitRenderMs: rec.commitRenderMs, warns: rec.warns, busyMs: cpu.busyMs, selected: rec.selected, sel: rec.sel, calls: rec.calls });
    note(`click ${k + 1} dispatch types`, rec.byType);
    note(`click ${k + 1} slowest dispatches`, rec.slowest);
    note(`click ${k + 1} top components`, rec.topComponents);
    if (rec.callers) note(`click ${k + 1} callers`, rec.callers);
    console.log(`TOP30 self time, click ${k + 1} (ms, function @ module:line)`);
    for (const [f, ms] of cpu.fnSelfTop) console.log(`  ${String(ms).padStart(9)}  ${f}`);
    console.log(`TOP modules self, click ${k + 1}`);
    for (const [f, ms] of cpu.modSelfTop) console.log(`  ${String(ms).padStart(9)}  ${f}`);
    console.log(`TOP functions inclusive, click ${k + 1}`);
    for (const [f, ms] of cpu.fnInclTop) console.log(`  ${String(ms).padStart(9)}  ${f}`);
    if (process.env.CLICK_OPEN_REFS === '1') {
        // The click's counts above are the closed-section case; this one is the cost of opening it.
        // The section is closed again afterwards, so the next click measures the closed case too.
        const REFS_HEADER = `[...document.querySelectorAll('.props-section__header')].find(h => (h.textContent || '').trim() === 'References')`;
        const wasClosed = await page.evaluate(`(() => { const b = ${REFS_HEADER}; return b ? b.closest('.props-section').classList.contains('props-section--closed') : null; })()`);
        await page.evaluate(`(() => { const P = window.__perfclick; P.longtasks = []; if (P.calls) for (const k of Object.keys(P.calls)) delete P.calls[k]; P.recording = true; })()`);
        if (wasClosed) await page.evaluate(`(${REFS_HEADER}).click()`);
        await page.waitForTimeout(4000);
        rec.openRefs = await page.evaluate(`(() => {
          const P = window.__perfclick; P.recording = false;
          return { wasClosed: ${JSON.stringify(wasClosed)},
                   calls: P.calls ? Object.fromEntries(Object.entries(P.calls).filter(([k]) => k.startsWith('LValue.validTarget')).map(([k, v]) => [k, { n: v.n, ms: Math.round(v.ms) }])) : null,
                   refSlots: document.querySelectorAll('.jj-ref-slot').length,
                   selects: document.querySelectorAll('.jj-ref-slot select').length,
                   longtasks: P.longtasks.map(l => Math.round(l.ms)), longtaskSum: Math.round(P.longtasks.reduce((s, l) => s + l.ms, 0)) };
        })()`);
        note(`click ${k + 1} open References`, rec.openRefs);
        if (wasClosed) { await page.evaluate(`(${REFS_HEADER}).click()`); await page.waitForTimeout(1000); }
    }
    result.clicks.push(rec);
    writeFileSync(join(OUTDIR, `perfclick-${LABEL}.json`), JSON.stringify(result, null, 1));
    await page.waitForTimeout(1000);
}

// Interactions besides selection (CLICK_STEPS), on the first clicked node (P-2026-10-20-2305).
if (nodeHits.length && (STEPS.has('drag') || STEPS.has('type') || STEPS.has('commit'))) {
    const [, px, py] = nodeHits[Math.floor(nodeHits.length / (NODES + 1))];
    if (STEPS.has('drag')) {
        // One drag of 100 px to the right, 10 mouse moves (the node is also selected by it).
        await profiled('drag', async () => {
            await page.mouse.move(px, py);
            await page.mouse.down();
            await page.mouse.move(px + 100, py, { steps: 10 });
            await page.mouse.up();
            return { from: [Math.round(px), Math.round(py)], dx: 100 };
        });
    } else {
        await page.mouse.click(px, py);
        await page.evaluate(settle(SETTLE_MS, 240000));
    }
    if (STEPS.has('type') || STEPS.has('commit')) {
        // The Properties name field: the visible text input whose value is the selected object's name.
        const NAME_INPUT = `(() => { const L = window.store.getState().idlookup, d = L[(window.store.getState()._lastSelected || {}).modelElement];
          return d ? [...document.querySelectorAll('input[type="text"], input:not([type])')].find(i => i.value === d.name && i.checkVisibility()) : null; })()`;
        const found = await page.evaluate(`(() => { const i = ${NAME_INPUT}; if (!i) return null; i.focus(); i.setSelectionRange(i.value.length, i.value.length); return i.value; })()`);
        check('name field found', found !== null, String(found));
        if (found !== null) {
            await profiled('type', async () => { await page.keyboard.type('x'); return { before: found }; });
            if (STEPS.has('commit')) await profiled('commit', async () => { await page.keyboard.press('Enter'); return { name: found + 'x' }; });
        }
    }
}
if (STEPS.has('vp')) await profiled('vp', () => page.evaluate(activateVp(VP2)));

// Staleness audit (P-2026-10-21-0035), dev only: after each targeted store write, compare the
// data every rendered canvas node holds (props of the node component, read off its fiber) with
// a fresh jjomVertexToRFNode of its vertex. A node whose fields differ is stale: the sync did
// not re-transform it. Not profiled; the writes are not undone (the probe ends here).
if (STEPS.has('audit') && !PROD) {
    result.audit = await page.evaluate(`(async () => {
      const T = await import('/src/components/editor-v2/utils/jjomTransformers.ts');
      const LP = window.LPointerTargetable, S = () => window.store.getState().idlookup;
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      const rendered = () => {
        const out = new Map();
        for (const el of document.querySelectorAll('.react-flow__node[data-id]')) {
          const id = el.getAttribute('data-id'), k = Object.keys(el).find(k => k.startsWith('__reactFiber'));
          const stack = [el[k] && el[k].child]; let n = 0;
          while (stack.length && n++ < 300) { const x = stack.pop(); if (!x) continue; const p = x.memoizedProps;
            if (p && p.id === id && p.data && typeof p.data === 'object') { out.set(id, p.data); break; }
            if (x.sibling) stack.push(x.sibling); if (x.child) stack.push(x.child); }
        }
        return out;
      };
      const sig = (d) => JSON.stringify([d.label, d.instanceOfClassName, !!d.isSingleton, !!d.isAbstract,
        (d.features || []).map(f => [f.featureName, f.value, f.typeName || '', !!f.isMany, !!f.required]),
        (d.attributes || []).map(a => [a.name, a.type]), (d.references || []).map(r => [r.name, r.type && r.type.name, r.opposite || '']),
        (d.operations || []).map(o => [o.name, o.returnType, (o.parameters || []).map(p => p.name + ':' + p.type)]),
        (d.literals || []).map(l => l.name)]);
      const audit = (label, extra) => { const R = rendered(); const stale = [];
        for (const [id, d] of R) { const v = LP.fromPointer(id); const f = v && T.jjomVertexToRFNode(v); if (f && sig(f.data) !== sig(d)) stale.push(id); }
        return { label, rendered: R.size, stale: stale.length, staleIds: stale.slice(0, 4), ...extra }; };
      const out = [audit('rest')];
      const R0 = rendered(), L0 = S();
      const vOf = new Map(); for (const vid of R0.keys()) { const d = L0[vid]; if (d && typeof d.model === 'string') vOf.set(d.model, vid); }
      const U = (await import('/src/common/U.tsx')).U, alerts = []; U.alert = (...a) => { alerts.push(a.slice(0, 3).map(String).join(' | ').slice(0, 140)); };
      const vals = (oid) => { const d = rendered().get(vOf.get(oid)); return d ? (d.features || []).map(f => f.value).join('|').slice(0, 160) + (d.isSingleton !== undefined ? ' isSingleton=' + d.isSingleton : '') : null; };
      const rename = (id, v) => { const x = LP.fromPointer(id); try { x.name = v; } catch (e) {} if (S()[id].name === v) return 'name';
        try { x['$name'].value = v; } catch (e) {} return S()[id].name === v ? '$name' : 'not landed'; };
      const write = async (label, f) => { let extra; alerts.length = 0; try { extra = await f(); } catch (e) { extra = { error: String(e).slice(0, 120) }; } await wait(1500); const L1 = S();
        if (extra && extra.c && L1[extra.c]) extra.cAfter = { final: L1[extra.c].final, isSingleton: L1[extra.c].isSingleton, rendered: vals(extra.c) };
        if (extra && extra.o) extra.oRendered = vals(extra.o);
        if (alerts.length) extra.alerts = alerts.slice(0, 3); out.push(audit(label, extra)); };
      const objs = [...vOf.keys()].filter(id => L0[id] && L0[id].className === 'DObject');
      const classes = [...vOf.keys()].filter(id => L0[id] && L0[id].className === 'DClass');
      if (objs.length) {
        // M1 rows: an attribute slot edit (covered by the hash: positive control), a reference target
        // renamed, the metaclass renamed, the M2 attribute of a slot renamed.
        await write('m1 attribute slot edit', () => { for (const o of objs) for (const fv of (L0[o].features || [])) { const d = L0[fv], m = d && L0[d.instanceof];
          if (m && m.className === 'DAttribute' && L0[m.type] && L0[m.type].className !== 'DEnumerator' && (d.values || []).length && typeof d.values[0] === 'string') { LP.fromPointer(fv).value = d.values[0] + '_e'; return { o, fv }; } } return { none: 1 }; });
        await write('m1 reference target renamed', () => { const L = S(); for (const o of objs) for (const fv of (L[o].features || [])) { const d = L[fv];
          for (const t of (d && d.values) || []) if (typeof t === 'string' && vOf.has(t) && t !== o) { const before = vals(o); const how = rename(t, S()[t].name + '_r'); return { o, t, how, newName: S()[t].name, before }; } } return { none: 1 }; });
        await write('m1 metaclass renamed', () => { const o = objs[0], mc = S()[o].instanceof; const how = rename(mc, S()[mc].name + '_r'); return { o, mc, how }; });
        await write('m1 M2 attribute renamed', () => { const L = S(); for (const o of objs) for (const fv of (L[o].features || [])) { const m = L[L[fv] && L[fv].instanceof];
          if (m && m.className === 'DAttribute') { const how = rename(m.id, m.name + '_r'); return { o, a: m.id, how }; } } return { none: 1 }; });
      }
      if (classes.length) {
        // M2 rows: issue #67 (final first, then singleton), a reference's type class renamed.
        await write('m2 final then singleton (#67)', async () => { const L = S(); const c = classes.find(id => { const l = LP.fromPointer(id); return !l.isSingleton && !l.final && !(l.extendedBy || []).length && !(l.instances || []).length; });
          if (!c) return { none: 1 }; const lc = LP.fromPointer(c); lc.final = true; await wait(1500); const finalLanded = S()[c].final; lc.isSingleton = true; return { c, finalLanded, isSingleton: S()[c].isSingleton }; });
        await write('m2 reference type renamed', () => { const L = S(); for (const c of classes) for (const r of (L[c].references || [])) { const t = L[r] && L[r].type;
          if (typeof t === 'string' && t !== c && vOf.has(t)) { const how = rename(t, S()[t].name + '_r'); return { c, t, how }; } } return { none: 1 }; });
      }
      return out;
    })()`);
    for (const a of result.audit || []) note('audit', a);
}

// Micro-benchmark on the first selected object: what one `name` and one `fullname` read cost,
// and how many LObject.name reads each one makes (counters above, recording on).
if (result.clicks.length && result.clicks[0].selected) {
    result.bench = await page.evaluate(`(() => {
      const P = window.__perfclick, id = ${JSON.stringify(result.clicks[0].selected)};
      const o = window.LPointerTargetable.fromPointer(id);
      if (!o) return { error: 'no object' };
      const one = (label, f, reps) => {
        for (const k of Object.keys(P.calls || {})) delete P.calls[k];
        P.recording = true; const t = performance.now(); let v; for (let i = 0; i < reps; i++) v = f(); const ms = (performance.now() - t) / reps; P.recording = false;
        const n = P.calls && P.calls['LObject.name'] ? P.calls['LObject.name'].n / reps : null;
        return { label, msPerRead: +ms.toFixed(3), lobjectNameCallsPerRead: n, value: String(v).slice(0, 80) };
      };
      const containers = (() => { const c = []; for (let x = o; x; x = x.father) c.push(x.className); return c; })();
      const m1 = o.model;
      return {
        object: o.name, containers, allSubObjects: m1.allSubObjects.length,
        reads: [ one('o.name', () => o.name, 20), one('o.fullname', () => o.fullname, 5), one("o['$name']", () => o['$name'], 20),
                 one('o.father.name', () => o.father && o.father.name, 20), one('m1.allSubObjects', () => m1.allSubObjects.length, 3) ],
      };
    })()`);
    note('bench', result.bench);
    // One full-project serialization, the work of every save and layout autosave (U.compressedState).
    result.benchSave = await page.evaluate(`(async () => {
      const U = window.U || ${PROD ? 'null' : "(await import('/src/common/U.tsx')).U"};
      const L = window.store.getState().idlookup, proj = Object.values(L).find(d => d && d.className === 'DProject');
      if (!U || !U.compressedState || !proj) return { error: 'no U.compressedState' };
      const out = [];
      for (let i = 0; i < 2; i++) { const t = performance.now(); const s = await U.compressedState(proj); out.push({ ms: Math.round(performance.now() - t), chars: s.length }); }
      return { runs: out };
    })()`);
    note('bench save', result.benchSave);
}

result.pageErrors = pageErrors.slice(0, 20);
result.failures = failures;
writeFileSync(join(OUTDIR, `perfclick-${LABEL}.json`), JSON.stringify(result, null, 1));
note('page errors', pageErrors.length);
console.log(`OUT ${join(OUTDIR, `perfclick-${LABEL}.json`)}`);
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
