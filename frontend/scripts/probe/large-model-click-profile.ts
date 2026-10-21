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
 *                         "stale"   after "vp": node sizes in place against a fresh mount, per change of
 *                                   inherited CSS (fonts, theme, a widening <style> and its removal);
 *                                   not profiled (P-2026-10-21-1355)
 *                         "audit"   dev only, last: targeted store writes, each followed by a count of
 *                                   the rendered nodes whose data differs from a fresh transform
 *                                   (stale nodes); not profiled (P-2026-10-21-0035)
 *       CLICK_STACKS    "1": sample the callers of LModel.name (slows the run; counts only)
 *     Round 3 (P-2026-10-21-0905): every step also reports the saves that ran in it (U.compressedState,
 *     ProjectsApi.save: start, length, silent, caller frames), the long tasks inside them, and storage
 *     writes over 20,000 chars. More CLICK_STEPS:
 *                         "idle"    CLICK_IDLE_MS (20000) with nothing done: saves and long tasks
 *                         "lat"     input latency, profiler off: CLICK_LAT_N (10) clicks, pointerdown to the
 *                                   first frame with .mm-node.selected; CLICK_LAT_DRAGS (3) drags of
 *                                   CLICK_LAT_MOVES (20) moves, pointermove to the first frame in which the
 *                                   node's transform moved; Event Timing per interaction (INP-like); p50/p95
 *                         "session" drag, 3 s, rename (type + Enter), 3 s, drag back, profiled over
 *                                   CLICK_SESSION_MS (30000) from the first edit; long tasks split by cause
 *                                   (inside a save, else the last edit before them), first 20 s and total
 *                                   CLICK_LAT_DURING_SAVE=1 starts a U.compressedState before each drag
 *     CLICK_ABLATE also takes "minimap": localStorage jjodel.showMinimap=false before the editor mounts.
 *     CLICK_LAYOUTS "1": count the layouts the intrinsic measure forces (P-2026-10-21-1010). Every read of
 *                   offsetWidth/offsetHeight on an `.ir-node-content` at `max-content` is a measure read; the
 *                   reads of one synchronous stretch are one burst (the measures of one commit). A read
 *                   forces a layout when it is the first of its burst, or when the element read
 *                   before it is no longer at `max-content` (restored in between). Also notes the size of every
 *                   canvas node after the open, for a before/after comparison.
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
  // Round 3 (P-2026-10-21-0905): Event Timing entries, save records, big storage writes, and the
  // input-to-frame watch (pointerdown to the first frame with the selection ring; pointermove to
  // the first frame in which the dragged node's transform moved).
  P.events = []; P.saves = []; P.storage = []; P.marks = []; P.watch = null; P.recStart = 0;
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) P.events.push({ name: e.name, start: e.startTime, ps: e.processingStart, pe: e.processingEnd, dur: e.duration, iid: e.interactionId || 0 }); })
      .observe({ type: 'event', durationThreshold: 16, buffered: true });
  } catch (e) { P.err = 'event observer: ' + e; }
  const si = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    const t = performance.now();
    try { return si.call(this, k, v); }
    finally { const n = String(v).length; if (n > 20000) P.storage.push({ k: String(k).slice(0, 40), len: n, ms: Math.round(performance.now() - t), t }); }
  };
  const onInput = (e) => {
    const w = P.watch; if (!w) return;
    if (w.kind === 'select' && e.type === 'pointerdown' && w.t0 == null) w.t0 = e.timeStamp;
    if (w.kind === 'drag') {
      if (e.type === 'pointerdown') w.down = true;
      else if (e.type === 'pointerup') w.down = false;
      else if (e.type === 'pointermove' && w.down) { w.moves++; w.pending.push(e.timeStamp); }
    }
  };
  for (const t of ['pointerdown', 'pointermove', 'pointerup']) window.addEventListener(t, onInput, true);
  const frame = () => {
    const w = P.watch;
    if (w) {
      const now = performance.now();
      const n = document.querySelector('.react-flow__node[data-id="' + w.id + '"]');
      if (w.kind === 'select' && w.t0 != null) {
        if (w.rf == null && n && n.classList.contains('selected')) w.rf = now - w.t0;
        if (w.ring == null && n && n.querySelector('.mm-node.selected')) w.ring = now - w.t0;
      }
      if (w.kind === 'drag' && w.pending.length) {
        const tr = n ? n.style.transform : '';
        if (tr !== w.lastTr) { w.lastTr = tr; for (const t of w.pending) w.lat.push(now - t); w.pending = []; }
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
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
const ABLATE = new Set((process.env.CLICK_ABLATE || '').split(',').filter(Boolean));
const browser = await chromium.launch({ args: ['--enable-precise-memory-info'] });
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await ctx.addInitScript({ content: INIT });
// MiniMap ablation: the editor reads this key once, when it mounts (EditorV2.tsx minimapVisible).
if (ABLATE.has('minimap')) await ctx.addInitScript({ content: `try { localStorage.setItem('jjodel.showMinimap', 'false'); } catch (e) {}` });
const LAYOUTS = process.env.CLICK_LAYOUTS === '1';
if (LAYOUTS) await ctx.addInitScript({ content: `(() => {
  const S = window.__measureLayouts = { bursts: [], cur: null, last: null };
  for (const k of ['offsetWidth', 'offsetHeight']) {
    const d = Object.getOwnPropertyDescriptor(HTMLElement.prototype, k);
    Object.defineProperty(HTMLElement.prototype, k, { ...d, get() {
      if (this.classList && this.classList.contains('ir-node-content') && this.style.width === 'max-content') {
        if (!S.cur) {
          S.cur = { layouts: 0, els: new Set() }; S.bursts.push(S.cur); S.last = null;
          queueMicrotask(() => { S.cur = null; });
        }
        if (!S.last || (S.last !== this && S.last.style.width !== 'max-content')) S.cur.layouts++;
        S.last = this; S.cur.els.add(this);
      }
      return d.get.call(this);
    } });
  }
})();` });
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
    // Every save, recording or not (P-2026-10-21-0905): U.compressedState and ProjectsApi.save, with
    // start, end, the silent flag and the synchronous caller frames.
    const saveInst = await page.evaluate(`(async () => {
      const U = window.U || ${PROD ? 'null' : "(await import('/src/common/U.tsx')).U"};
      const PA = window.ProjectsApi, P = window.__perfclick;
      const wrapS = (obj, name, label) => {
        if (!obj || typeof obj[name] !== 'function') return label + ': missing';
        const o = obj[name];
        obj[name] = async function (...a) {
          const rec = { label, t0: performance.now(), t1: 0, silent: !!(a[1] && a[1].silent),
            stack: String(new Error().stack).split('\\n').slice(2, 7).map(s => s.trim().replace(/^at /, '').replace(/\\(?https?:\\/\\/[^/]+/, '').replace(/\\?[^:]*/, '')).join(' < ') };
          P.saves.push(rec);
          try { return await o.apply(this, a); } finally { rec.t1 = performance.now(); }
        };
        return label + ': ok';
      };
      return [wrapS(U, 'compressedState', 'compressedState'), wrapS(PA, 'save', 'ProjectsApi.save')];
    })()`);
    note('save instruments', saveInst);
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
const RESET = `(() => { const P = window.__perfclick; P.longtasks = []; P.dispatches = []; P.commits = []; P.names = {}; P.warns = 0; P.warnSamples = []; if (P.calls) for (const k of Object.keys(P.calls)) delete P.calls[k]; P.lastCommit = performance.now(); P.events = []; P.marks = []; P.recStart = performance.now(); P.recording = true; })()`;
/** Saves and big storage writes since the last RESET, times relative to it (P-2026-10-21-0905). */
const SAVES = `(() => {
      const P = window.__perfclick, t0 = P.recStart, now = performance.now();
      const cs = P.saves.filter(s => s.label === 'compressedState' && (s.t1 === 0 || s.t1 >= t0));
      const inSave = (l) => cs.some(s => l.start < (s.t1 || now) && l.start + l.ms > s.t0);
      const lts = P.longtasks.filter(inSave);
      return {
        saves: P.saves.filter(s => s.t1 === 0 || s.t1 >= t0).map(s => ({ label: s.label, at: Math.round(s.t0 - t0), ms: Math.round((s.t1 || now) - s.t0), done: s.t1 > 0, silent: s.silent, stack: s.stack })),
        storage: P.storage.filter(s => s.t >= t0).map(s => ({ k: s.k, len: s.len, ms: s.ms, at: Math.round(s.t - t0) })),
        saveLongtasks: lts.map(l => Math.round(l.ms)), saveLongtaskSum: Math.round(lts.reduce((a, l) => a + l.ms, 0)),
      };
    })()`;
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
    rec.save = await page.evaluate(SAVES);
    await loadChunkMaps(profile);
    const cpu = analyse(profile);
    const file = join(OUTDIR, `perfclick-${LABEL}-${step}.cpuprofile`);
    writeFileSync(file, JSON.stringify(profile));
    Object.assign(rec, { step, acted, actMs, settledMs: Math.round(settledMs), wallMs, profile: file, cpu });
    note(`step ${step}`, { acted, wallMs, actMs, longtasks: rec.longtasks, longtaskSum: rec.longtaskSum, busyMs: cpu.busyMs, dispatches: rec.dispatches, byType: rec.byType, commits: rec.commits, commitFibers: rec.commitFibers.slice(0, 20), calls: rec.calls, save: rec.save });
    note(`step ${step} modules self`, cpu.modSelfTop.slice(0, 12));
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
if (LAYOUTS) note('node sizes', await page.evaluate(`(() => {
  const ns = [...document.querySelectorAll('.react-flow__node')].map(n => [n.getAttribute('data-id'), n.offsetWidth, n.offsetHeight]);
  ns.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  return { nodes: ns.length, edges: document.querySelectorAll('.react-flow__edge').length, first3: ns.slice(0, 3), all: ns.map(n => n[1] + 'x' + n[2]).join(',') };
})()`));

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
    rec.save = await page.evaluate(SAVES);
    await loadChunkMaps(profile);
    const cpu = analyse(profile);
    const file = join(OUTDIR, `perfclick-${LABEL}-click${k + 1}.cpuprofile`);
    writeFileSync(file, JSON.stringify(profile));
    Object.assign(rec, { click: k + 1, node: id, clickReturnedMs, settledMs: Math.round(settledMs), wallMs, profile: file, cpu });
    note(`click ${k + 1}`, { node: id, wallMs, clickReturnedMs, longtasks: rec.longtasks, longtaskSum: rec.longtaskSum, dispatches: rec.dispatches, topDispatches: rec.topDispatches, dispatchMsTop: rec.dispatchMsTop, commits: rec.commits, commitFibers: rec.commitFibers.slice(0, 20), commitRenderMs: rec.commitRenderMs, warns: rec.warns, busyMs: cpu.busyMs, selected: rec.selected, sel: rec.sel, calls: rec.calls, save: rec.save });
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

// ── Round 3 steps (P-2026-10-21-0905) ──────────────────────────────────────────────────────────
const pct = (a: number[], p: number) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]); };
const latStats = (a: number[]) => ({ n: a.length, p50: pct(a, 0.5), p95: pct(a, 0.95), max: a.length ? Math.round(Math.max(...a)) : null });
/** Event Timing since the last RESET: per interaction (interactionId), its longest entry (the INP measure). */
const INTERACTIONS = `(() => { const by = {}; for (const e of window.__perfclick.events) if (e.iid) by[e.iid] = Math.max(by[e.iid] || 0, e.dur);
  const byName = {}; for (const e of window.__perfclick.events) (byName[e.name] = byName[e.name] || []).push(Math.round(e.dur));
  return { inp: Object.values(by).map(Math.round), byName }; })()`;
const dragOnce = async (x: number, y: number, dx: number, moves: number) => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y, { steps: moves });
    await page.mouse.up();
};
const nameInputFocus = async (): Promise<string | null> => page.evaluate(`(() => { const L = window.store.getState().idlookup, d = L[(window.store.getState()._lastSelected || {}).modelElement];
  const i = d ? [...document.querySelectorAll('input[type="text"], input:not([type])')].find(i => i.value === d.name && i.checkVisibility()) : null;
  if (!i) return null; i.focus(); i.setSelectionRange(i.value.length, i.value.length); return i.value; })()`) as Promise<string | null>;

// idle: nothing done for CLICK_IDLE_MS after a settled canvas; does any save run, any long task?
if (STEPS.has('idle')) {
    const IDLE_MS = Number(process.env.CLICK_IDLE_MS || 20000);
    await page.evaluate(RESET);
    await page.waitForTimeout(IDLE_MS);
    const rec: any = await page.evaluate(COLLECT);
    const save = await page.evaluate(SAVES);
    result.idle = { ms: IDLE_MS, longtasks: rec.longtasks, longtaskSum: rec.longtaskSum, dispatches: rec.dispatches, commits: rec.commits, save };
    note('idle', result.idle);
}

// lat: input latency as felt, profiler off. CLICK_LAT_N selection clicks on different nodes
// (pointerdown to the first frame showing .mm-node.selected), then CLICK_LAT_DRAGS drags of
// CLICK_LAT_MOVES moves (each pointermove to the first frame in which the node's transform moved).
if (STEPS.has('lat') && nodeHits.length) {
    const N = Number(process.env.CLICK_LAT_N || 10), DRAGS = Number(process.env.CLICK_LAT_DRAGS || 3), MOVES = Number(process.env.CLICK_LAT_MOVES || 20);
    const ring: number[] = [], rf: number[] = [], inpClick: number[] = [], misses: string[] = [];
    for (let k = 0; k < N; k++) {
        const [id, px, py] = nodeHits[Math.floor(k * nodeHits.length / N)];
        await page.evaluate(RESET);
        await page.evaluate(`window.__perfclick.watch = { kind: 'select', id: ${JSON.stringify(id)}, t0: null, rf: null, ring: null }`);
        await page.mouse.click(px, py);
        await page.evaluate(settle(1500, 60000));
        const w: any = await page.evaluate(`(() => { const w = window.__perfclick.watch; window.__perfclick.watch = null; return w; })()`);
        const it: any = await page.evaluate(INTERACTIONS);
        if (w.ring != null) ring.push(w.ring); else misses.push(id);
        if (w.rf != null) rf.push(w.rf);
        if (it.inp.length) inpClick.push(Math.max(...it.inp));
    }
    const dragLat: number[] = [], inpDrag: number[] = [], perDrag: any[] = [];
    const [did, dx0, dy0] = nodeHits[Math.floor(nodeHits.length / (NODES + 1))];
    for (let d = 0; d < DRAGS; d++) {
        await page.evaluate(RESET);
        await page.evaluate(`(() => { const n = document.querySelector('.react-flow__node[data-id="${did}"]');
          window.__perfclick.watch = { kind: 'drag', id: ${JSON.stringify(did)}, down: false, moves: 0, pending: [], lat: [], lastTr: n ? n.style.transform : '' }; })()`);
        const dir = d % 2 === 0 ? 1 : -1;
        // CLICK_LAT_DURING_SAVE=1: a full save starts (not awaited) right before the drag, so the
        // moves land while async-lz-string runs its chunks.
        if (process.env.CLICK_LAT_DURING_SAVE === '1') await page.evaluate(`(() => { const L = window.store.getState().idlookup;
          const proj = Object.values(L).find(d => d && d.className === 'DProject'); window.U.compressedState(proj); return 1; })()`);
        const t0 = Date.now();
        await dragOnce(dir > 0 ? dx0 : dx0 + 100, dy0, 100 * dir, MOVES);
        const gestureMs = Date.now() - t0;
        await page.evaluate(settle(1500, 60000));
        const w: any = await page.evaluate(`(() => { const w = window.__perfclick.watch; window.__perfclick.watch = null; return { moves: w.moves, lat: w.lat, pending: w.pending.length }; })()`);
        const it: any = await page.evaluate(INTERACTIONS);
        dragLat.push(...w.lat);
        if (it.inp.length) inpDrag.push(Math.max(...it.inp));
        perDrag.push({ gestureMs, moves: w.moves, framed: w.lat.length, unframed: w.pending, ...latStats(w.lat) });
    }
    result.lat = { select: { ring: latStats(ring), rf: latStats(rf), inp: latStats(inpClick), misses }, drag: { move: latStats(dragLat), inp: latStats(inpDrag), perDrag } };
    note('lat select', result.lat.select);
    note('lat drag', result.lat.drag);
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
// session: three edits spaced like a user (drag, 3 s, rename, 3 s, drag back), profiled over
// CLICK_SESSION_MS from the first edit, plus any save still running then. Long tasks split by
// cause: inside a U.compressedState call ("save"), else the last edit started before them.
if (STEPS.has('session') && nodeHits.length) {
    const SESSION_MS = Number(process.env.CLICK_SESSION_MS || 30000);
    const [, px, py] = nodeHits[Math.floor(nodeHits.length / (NODES + 1))];
    const mark = (k: string) => page.evaluate(`window.__perfclick.marks.push([${JSON.stringify(k)}, performance.now()])`);
    await page.evaluate(RESET);
    await cdp.send('Profiler.start');
    const t0 = Date.now();
    await mark('drag1'); await dragOnce(px, py, 100, 10);
    await page.waitForTimeout(3000);
    await mark('rename');
    const found = await nameInputFocus();
    check('session: name field found', found !== null, String(found));
    if (found !== null) { await page.keyboard.type('y'); await page.keyboard.press('Enter'); }
    await page.waitForTimeout(3000);
    await mark('drag2'); await dragOnce(px + 100, py, -100, 10);
    await mark('idle');
    const left = SESSION_MS - (Date.now() - t0);
    if (left > 0) await page.waitForTimeout(left);
    // A save still in flight at the end of the window is waited for (cap 30 s).
    await page.evaluate(`(async () => { for (let i = 0; i < 120 && window.__perfclick.saves.some(s => s.t1 === 0); i++) await new Promise(r => setTimeout(r, 250)); })()`);
    const wallMs = Date.now() - t0;
    const { profile } = await cdp.send('Profiler.stop') as any;
    const split: any = await page.evaluate(`(() => {
      const P = window.__perfclick, t0 = P.recStart, now = performance.now();
      const cs = P.saves.filter(s => s.label === 'compressedState' && (s.t1 === 0 || s.t1 >= t0));
      const cause = (l) => { if (cs.some(s => l.start < (s.t1 || now) && l.start + l.ms > s.t0)) return 'save';
        let k = 'before'; for (const [name, t] of P.marks) if (l.start >= t) k = name; return k; };
      const by = {};
      for (const l of P.longtasks) { const c = cause(l), e = by[c] || (by[c] = { n: 0, ms: 0, max: 0, first20s: 0 });
        e.n++; e.ms += l.ms; e.max = Math.max(e.max, l.ms); if (l.start - t0 < 20000) e.first20s += l.ms; }
      for (const e of Object.values(by)) { e.ms = Math.round(e.ms); e.max = Math.round(e.max); e.first20s = Math.round(e.first20s); }
      return { byCause: by, total: Math.round(P.longtasks.reduce((a, l) => a + l.ms, 0)),
        first20s: Math.round(P.longtasks.filter(l => l.start - t0 < 20000).reduce((a, l) => a + l.ms, 0)),
        marks: P.marks.map(([k, t]) => [k, Math.round(t - t0)]), timeline: P.longtasks.map(l => [Math.round(l.start - t0), Math.round(l.ms)]) };
    })()`);
    {
        const rec: any = await page.evaluate(COLLECT);
        const save = await page.evaluate(SAVES);
        await loadChunkMaps(profile);
        const cpu = analyse(profile);
        const file = join(OUTDIR, `perfclick-${LABEL}-session.cpuprofile`);
        writeFileSync(file, JSON.stringify(profile));
        result.session = { wallMs, sessionMs: SESSION_MS, ...split, save, dispatches: rec.dispatches, commits: rec.commits, busyMs: cpu.busyMs, modSelfTop: cpu.modSelfTop, fnSelfTop: cpu.fnSelfTop.slice(0, 15), profile: file };
        note('session split', { wallMs, total: split.total, first20s: split.first20s, byCause: split.byCause, marks: split.marks, busyMs: cpu.busyMs });
        note('session saves', save);
        note('session timeline', split.timeline);
        note('session modules self', cpu.modSelfTop.slice(0, 12));
        console.log('TOP15 self time, session');
        for (const [f, ms] of cpu.fnSelfTop.slice(0, 15)) console.log(`  ${String(ms).padStart(9)}  ${f}`);
    }
    writeFileSync(join(OUTDIR, `perfclick-${LABEL}.json`), JSON.stringify(result, null, 1));
}
if (STEPS.has('vp')) await profiled('vp', () => page.evaluate(activateVp(VP2)));

// Staleness of the intrinsic measure cache (P-2026-10-21-1355), not profiled. Sizes of every canvas
// node in place (S) against the sizes after a fresh mount (F: viewpoint off and back on, so every
// IRNodeContent unmounts and its entry is dropped), per change of inherited CSS: none (fonts), the
// theme attribute on <html>, a <style> in <head> that widens the IR text (positive control: it must
// move some size), and its removal. stale = nodes whose S and F differ.
if (STEPS.has('stale')) {
    const SIZES = `(() => [...document.querySelectorAll('.react-flow__node')]
      .map(n => [n.getAttribute('data-id'), n.offsetWidth + 'x' + n.offsetHeight]))()`;
    const settled = () => page.evaluate(settle(SETTLE_MS, 240000));
    const sizes = async () => { await settled(); return await page.evaluate(SIZES) as [string, string][]; };
    const differ = (a: [string, string][], b: [string, string][]) => {
        const m = new Map(b);
        return a.filter(([id, s]) => m.get(id) !== s).length + Math.abs(a.length - b.length);
    };
    let controlMoved = 0, controlRemeasured = 0;
    // CLICK_LAYOUTS: the IR contents measured in place since a mark (a measure read is a cache miss).
    const mark = () => page.evaluate(`window.__measureLayouts ? window.__measureLayouts.bursts.length : -1`) as Promise<number>;
    const measuredSince = (n0: number) => page.evaluate(`(() => { const S = window.__measureLayouts; if (!S) return -1;
      const els = new Set(); for (const b of S.bursts.slice(${n0})) for (const e of b.els) els.add(e); return els.size; })()`) as Promise<number>;
    // Both viewpoints: a node whose box is a view default or a manual size (every BPMN node of the
    // harness fixture) does not follow its content, so only a viewpoint with derived boxes discriminates.
    for (const v of [VP, VP2]) {
        const tag = v.replace(/^.*\/ */, '');
        let irOff = -1, lastRemeasured = -1;
        const fresh = async () => {
            await page.evaluate(activateVp('-'));
            await settled();
            irOff = await page.evaluate(`document.querySelectorAll('.ir-node-content').length`) as number;
            await page.evaluate(activateVp(v));
            return sizes();
        };
        const sub = async (name: string, change: string | null) => {
            const n0 = await mark();
            if (change) await page.evaluate(change);
            const s = await sizes();
            lastRemeasured = n0 < 0 ? -1 : await measuredSince(n0);
            const irOn = await page.evaluate(`document.querySelectorAll('.ir-node-content').length`) as number;
            const f = await fresh();
            const stale = differ(s, f);
            note(`stale ${tag} ${name}`, { nodes: s.length, stale, irContent: irOn, remeasured: lastRemeasured, irContentWhileOff: irOff });
            check(`stale ${tag} ${name}`, stale === 0 && s.length > 0 && irOff === 0, `${stale} of ${s.length} nodes, ${irOff} IR contents while off`);
            return s;
        };
        await page.evaluate(activateVp(v));
        await settled();
        await sub('fonts', null);
        const s1 = await sub('theme', `document.documentElement.setAttribute('data-theme', 'dark')`);
        await page.evaluate(`document.documentElement.setAttribute('data-theme', 'light')`);
        const s2 = await sub('style', `(() => { const s = document.createElement('style'); s.id = 'perfclick-stale';
          s.textContent = '.ir-node-content, .ir-node-content * { letter-spacing: 12px !important; font-size: 28px !important; }';
          document.head.appendChild(s); })()`);
        controlRemeasured += Math.max(0, lastRemeasured);
        // In place, and only the nodes whose box the hook writes (inline width): their new size is a cache miss.
        const written = new Set(await page.evaluate(`[...document.querySelectorAll('.react-flow__node')]
          .filter(n => n.style.width).map(n => n.getAttribute('data-id'))`) as string[]);
        const before = new Map(s1);
        const moved = s2.filter(([id, sz]) => written.has(id) && before.get(id) !== sz).length;
        note(`stale ${tag} control`, { moved, movedAll: differ(s2, s1), written: written.size });
        controlMoved += moved;
        const s3 = await sub('style removed', `document.getElementById('perfclick-stale').remove()`);
        note(`stale ${tag} restored`, { differFromTheme: differ(s3, s1) });
    }
    // A box derived from the reading moves only on a viewpoint that has one; elsewhere the control is the
    // in-place re-measure after the style lands (the epoch reached the cache), which needs CLICK_LAYOUTS.
    check('stale control: the style reaches the cache', controlMoved > 0 || controlRemeasured > 0,
        `${controlMoved} hook-sized nodes moved in place, ${controlRemeasured} IR contents re-measured in place`);
}

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
      const out = [], P = window.__perfclick;
      for (let i = 0; i < 2; i++) {
        const lt0 = P.longtasks.length, t = performance.now(); const s = await U.compressedState(proj);
        const lts = P.longtasks.slice(lt0).filter(l => l.start >= t);
        out.push({ ms: Math.round(performance.now() - t), chars: s.length, longtasks: lts.length, longtaskSum: Math.round(lts.reduce((a, l) => a + l.ms, 0)), longtaskMax: Math.round(Math.max(0, ...lts.map(l => l.ms))) });
      }
      // The two halves of compressedState (dev only: the replacer is a module import): the
      // JSON.stringify with proxyToIdReplacer, and the input length async-lz-string gets
      // (it yields with setTimeout(0) every 10,000 input chars, compressor.ts:148).
      let split = null;
      if (${!PROD}) {
        const { proxyToIdReplacer } = await import('/src/model/unproxy.ts');
        const st = { ...window.store.getState() };
        let t = performance.now(); const j1 = JSON.stringify(st, proxyToIdReplacer); const replacerMs = performance.now() - t;
        t = performance.now(); const j2 = JSON.stringify(st); const plainMs = performance.now() - t;
        split = { stringifyReplacerMs: Math.round(replacerMs), stringifyPlainMs: Math.round(plainMs), jsonChars: j1.length, plainChars: j2.length, lzYields: Math.ceil(j1.length / 10000) };
      }
      return { runs: out, split };
    })()`);
    note('bench save', result.benchSave);
}

if (LAYOUTS) {
    result.measureLayouts = await page.evaluate(`(() => {
      const b = window.__measureLayouts.bursts;
      const per = b.map(x => x.layouts), els = b.map(x => x.els.size);
      return { bursts: b.length, layouts: per.reduce((a, c) => a + c, 0), maxLayoutsPerBurst: Math.max(0, ...per),
        burstsWithMoreThanOne: per.filter(x => x > 1).length, elementsRead: els.reduce((a, c) => a + c, 0), maxElementsPerBurst: Math.max(0, ...els) };
    })()`);
    note('measure layouts', result.measureLayouts);
}
result.pageErrors = pageErrors.slice(0, 20);
result.failures = failures;
writeFileSync(join(OUTDIR, `perfclick-${LABEL}.json`), JSON.stringify(result, null, 1));
note('page errors', pageErrors.length);
console.log(`OUT ${join(OUTDIR, `perfclick-${LABEL}.json`)}`);
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
