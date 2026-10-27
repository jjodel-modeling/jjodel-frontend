/**
 * jjscript-run-slowdown probe (P-2026-10-01-2136).
 *
 * Question: why does each JjScript Run from Jjodie get slower than the one before, and how much
 * of the main thread does each dispatch cost, attributed to H1 (past chat blocks), H2 (editor
 * tabs), H3 (tree panel), H4 (accumulation independent of what is mounted), H5 (RunSummaryDialog).
 *
 * Drives the real app on its own dev server (never 3001): a fresh project, metamodel_1, Jjodie
 * open, then N runs of the same 16-line script (prefix R<n>_), each injected as a scoped
 * assistant reply through the `{ messages, isOpen }` state hook of `Jodie` (no test hook exists
 * in the code for this), then «Run as JjScript» and «Run», waiting for `.run-summary`.
 *
 * Instruments, all installed by the probe, none in the app:
 *   - the `[JjScript-TIMING]` TEMP-DISCOVERY lines, timestamped in the page;
 *   - React commits through `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`: components that
 *     rendered in each commit (PerformedWork and visited in this render) with selfBaseDuration,
 *     bucketed by named ancestor; editor fibers split by the visibility of their tab;
 *   - a CDP CPU profile of the profiled runs, each sample owned by the nearest frame (leaf to
 *     root) whose file belongs to a bucket.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjscript-run-slowdown.ts --port 3004 [--id <Prompt-ID>]
 * Env:  RUNPERF_VARIANT  baseline | chat-empty | one-tab | tree-hidden | two-mm | two-mm-closed | inset-cached | summary-open
 *                        | scenes (no runs: import the demo exports of RUNPERF_SCENES and dump handles and edge paths)
 *       RUNPERF_N        runs (default 12)
 *       RUNPERF_PROFILE  runs to profile (default "1,6,12")
 *       RUNPERF_RELOAD   "1": after the last run, reload, reopen and run once more (H4)
 *       RUNPERF_OUT      JSON output path (default /tmp/runperf-<variant>.json)
 *       RUNPERF_SCENES   directory of *.jjodel exports, read only (default ~/jjodel-demo-exports)
 */
import { chromium, type Page, type CDPSession } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3004/').replace(/\/$/, '');
if (/:3001$/.test(URL)) throw new Error('never 3001');
const VARIANT = process.env.RUNPERF_VARIANT || 'baseline';
const N = Number(process.env.RUNPERF_N || 12);
const PROFILE = new Set((process.env.RUNPERF_PROFILE ?? '1,6,12').split(',').filter(Boolean).map(Number));
const RELOAD = process.env.RUNPERF_RELOAD === '1';
const OUT = process.env.RUNPERF_OUT || `/tmp/runperf-${VARIANT}.json`;
const SWITCH_AT = Math.floor(N / 2) + 1; // two-mm variants: first run into metamodel_2

const note = (label: string, d: unknown) =>
    console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};

/** 16 lines: 7 classes, 4 attributes, 5 references, one forward reference (line 14 -> line 15). */
const script = (p: string) => [
    `create class ${p}Library`,
    `create class ${p}Book`,
    `create attribute title in ${p}Book type String`,
    `create reference books in ${p}Library type ${p}Book`,
    `create class ${p}Author`,
    `create attribute name in ${p}Author type String`,
    `create reference authors in ${p}Book type ${p}Author`,
    `create class ${p}Member`,
    `create attribute since in ${p}Member type Integer`,
    `create class ${p}Loan`,
    `create reference loans in ${p}Member type ${p}Loan`,
    `create reference item in ${p}Loan type ${p}Book`,
    `create attribute isbn in ${p}Book type String`,
    `create reference reviews in ${p}Book type ${p}Review`,
    `create class ${p}Review`,
    `create class ${p}Shelf`,
].join('\n');
/** The `create attribute` whose window is attributed alone: its class is created by line 2. */
const ATTR_LINE = 3;

// ── Page-side instruments (a plain string: no transform touches it) ────────────────────────────
const INIT = String.raw`
globalThis.__name = (f) => f;
(() => {
  const P = window.__runperf = { timing: [], recording: false, lastCommit: 0, commits: [], names: {}, err: null };
  const origLog = console.log;
  console.log = function (...a) {
    if (typeof a[0] === 'string' && a[0].startsWith('[JjScript-TIMING]')) P.timing.push({ t: performance.now(), s: a[0] });
    return origLog.apply(this, a);
  };
  // Count the reads of the overlay inset (viewportInset.ts getCanvasRightInset, a forced style
  // recalc). Variant inset-cached answers them from a value read once before the run: the fix
  // "read the inset once, not on every render", measured without touching the source.
  const origGPV = CSSStyleDeclaration.prototype.getPropertyValue;
  P.insetReads = 0;
  CSSStyleDeclaration.prototype.getPropertyValue = function (name) {
    if (name === '--jj-canvas-right-inset') { P.insetReads++; if (globalThis.__runperfInsetCacheOn && P.insetCache !== undefined) return P.insetCache; }
    return origGPV.call(this, name);
  };
  P.refreshInset = () => { P.insetCache = origGPV.call(getComputedStyle(document.body), '--jj-canvas-right-inset'); return P.insetCache; };
  P.mark = function __runperfMark() { const t = performance.now(); while (performance.now() - t < 4) {} return t; };
  // Buckets by named ancestor, nearest first. Editor roots are split by the visibility of their DOM.
  const MARK = {
    RunSummaryDialog: 'H5 RunSummaryDialog',
    ScriptBlock: 'H1 ScriptBlock', MarkdownRenderer: 'H1 Markdown', MarkdownMessage: 'H1 Markdown',
    MessageBubble: 'H1 chat', ChatMessages: 'H1 chat', JodieWindow: 'H1 chat', Jodie: 'H1 chat',
    TreeViewContent: 'H3 tree', PropertiesWithTreeView: 'H3 rail (properties, tree host)',
    ProjectDashboard: 'H2 project tab (dashboard)', StatusBar: 'statusbar', ContextMenu: 'context menu',
  };
  const EDITOR = new Set(['MetamodelTab', 'ModelTab', 'EditorV2', 'EditorV2Inner']);
  const COMPONENT = new Set([0, 1, 2, 11, 14, 15]);
  const nameOf = (f) => { const t = f.type; if (!t) return '?'; return t.displayName || t.name || (t.render && (t.render.displayName || t.render.name)) || (t.type && (t.type.displayName || t.type.name)) || 'Anonymous'; };
  const firstHost = (f) => { const st = [f.child]; let n = 0; while (st.length && n++ < 400) { const x = st.pop(); if (!x) continue; if (x.tag === 5 && x.stateNode && x.stateNode.nodeType === 1) return x.stateNode; if (x.sibling) st.push(x.sibling); if (x.child) st.push(x.child); } return null; };
  // Hidden = inside an rc-dock pane with aria-hidden="true" (inactive tab, kept mounted once
  // visited: rc-dock DockTabPane renders children when active || visited). No layout is read.
  const hiddenPane = (el) => { for (let x = el; x; x = x.parentElement) { if (x.classList && x.classList.contains('dock-tabpane')) return x.getAttribute('aria-hidden') === 'true'; } return false; };
  P.onCommit = (root) => {
    const now = performance.now();
    if (!P.recording) { P.lastCommit = now; return; }
    const lower = P.lastCommit; P.lastCommit = now;
    const rec = { t: now, n: 0, ms: 0, b: {} };
    // Top-down: a fiber's bucket is its own marker or its parent's, so no walk up per fiber.
    // Only subtrees visited in this render are entered (actualStartTime is set on every fiber
    // the work loop visits and is older than the previous commit on the rest).
    const stack = [root.current, 'other'];
    while (stack.length) {
      const inherited = stack.pop(), f = stack.pop();
      if (f.sibling) stack.push(f.sibling, inherited);
      if (!(f.actualStartTime >= lower)) continue;
      let bucket = inherited;
      const comp = COMPONENT.has(f.tag);
      const nm = comp ? nameOf(f) : null;
      if (comp) {
        if (MARK[nm]) bucket = MARK[nm];
        else if (EDITOR.has(nm)) { const el = firstHost(f); bucket = el && hiddenPane(el) ? 'H2 editor (hidden tab)' : 'H2 editor (visible)'; }
      }
      if (f.child) stack.push(f.child, bucket);
      if (!(comp && (f.flags & 1))) continue;
      const self = f.selfBaseDuration || 0;
      rec.n++; rec.ms += self;
      const b = rec.b[bucket] || (rec.b[bucket] = [0, 0]); b[0]++; b[1] += self;
      const key = bucket + ' :: ' + nm;
      const e = P.names[key] || (P.names[key] = [0, 0]); e[0]++; e[1] += self;
    }
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
const JODIE_HOOK = `(() => {
  const root = document.querySelector('.jodie-root');
  const k = root && Object.keys(root).find(k => k.startsWith('__reactFiber$'));
  let f = k && root[k];
  while (f && !(f.type && f.type.name === 'Jodie')) f = f.return;
  let h = f && f.memoizedState;
  while (h) { const s = h.memoizedState; if (s && typeof s === 'object' && Array.isArray(s.messages) && 'isOpen' in s && 'isWaiting' in s) return h; h = h.next; }
  return null;
})()`;

async function inject(page: Page, n: number, mm: { id: string; name: string }, clearFirst: boolean, body = script(`R${n}_`)) {
    const content = 'Here is the script:\n\n```jjscript\n' + body + '\n```\n';
    return page.evaluate(`(() => {
      const h = ${JODIE_HOOK};
      if (!h) return 'no chat hook';
      const msg = { id: 'msg_runperf_${n}', kind: 'chat', role: 'assistant', timestamp: Date.now(),
        content: ${JSON.stringify(content)},
        jjodieScope: { level: 'M2', metamodelId: ${JSON.stringify(mm.id)}, metamodelName: ${JSON.stringify(mm.name)} } };
      h.queue.dispatch(prev => ({ ...prev, isOpen: true, messages: [...(${clearFirst} ? [] : prev.messages), msg] }));
      return 'ok';
    })()`);
}

async function snapshot(page: Page) {
    return page.evaluate(`(() => {
      const st = window.store.getState();
      const q = (s) => document.querySelectorAll(s).length;
      return {
        idlookup: Object.keys(st.idlookup).length,
        dom: document.getElementsByTagName('*').length,
        heapMB: Math.round(performance.memory.usedJSHeapSize / 1048576),
        rfNodes: q('.react-flow__node'), rfHandles: q('.react-flow__handle'),
        rfNodesVisible: [...document.querySelectorAll('.react-flow__node')].filter(e => e.checkVisibility()).length,
        treeDom: document.querySelector('.tree-view-content') ? document.querySelector('.tree-view-content').getElementsByTagName('*').length : 0, jjactions: (window.jjactions || []).length,
        scriptBlocks: q('.script-block'), codeBlocks: q('.md-code-block'),
        tabs: [...document.querySelectorAll('.dock-tab')].map(t => t.textContent.trim().slice(0, 30)),
      };
    })()`);
}

/** Click Run in the last block and resolve when `.run-summary` is in the DOM: wall in page time. */
const RUN_AND_WAIT = `(async () => {
  const P = window.__runperf;
  const known = document.querySelectorAll('.run-summary').length;
  const btn = [...document.querySelectorAll('.script-block__btn--run')].pop();
  if (!btn || btn.disabled) return { error: 'no enabled run button' };
  P.timing = []; P.commits = []; P.names = {}; P.insetReads = 0;
  const inset = globalThis.__runperfInsetCacheOn ? P.refreshInset() : null;
  const mark = P.mark();
  P.lastCommit = performance.now(); P.recording = true;
  const t0 = performance.now();
  btn.click();
  await new Promise((res, rej) => {
    const to = setTimeout(() => { obs.disconnect(); rej(new Error('no .run-summary in 180 s')); }, 180000);
    const obs = new MutationObserver(() => { if (document.querySelectorAll('.run-summary').length > known) { clearTimeout(to); obs.disconnect(); res(); } });
    obs.observe(document.body, { childList: true, subtree: true });
  });
  const t1 = performance.now();
  P.recording = false;
  return { mark, t0, t1, wall: t1 - t0, insetReads: P.insetReads, inset, timing: P.timing, commits: P.commits, names: P.names, err: P.err,
           summary: ([...document.querySelectorAll('.run-summary h2')].pop() || {}).textContent || '', openSummaries: document.querySelectorAll('.run-summary').length };
})()`;

// ── CPU profile attribution ────────────────────────────────────────────────────────────────────
// A frame is named by its module: a /src/ path, or, inside a Vite deps chunk, the npm package of
// the `// .../node_modules/<pkg>/...` banner esbuild writes above each bundled module.
const chunkMaps = new Map<string, Array<[number, string]>>();
async function loadChunkMaps(profile: Prof) {
    const urls = new Set<string>();
    for (const n of profile.nodes) if (/\/deps\/[^?]+\.js/.test(n.callFrame.url || '')) urls.add(n.callFrame.url.replace(/\?.*$/, ''));
    for (const u of urls) {
        if (chunkMaps.has(u)) continue;
        // The deps live on disk under the server's cacheDir (/@fs/<abs path>); read them there.
        const fsPath = decodeURIComponent(u.replace(/^https?:\/\/[^/]+\/@fs/, ''));
        let text = '';
        try { text = readFileSync(fsPath, 'utf8'); } catch { try { text = await (await fetch(u)).text(); } catch { text = ''; } }
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
    if (!url) return cf.functionName === 'P.onCommit' || cf.functionName === '__runperfMark' ? 'probe:instrument' : '';
    const src = url.match(/\/src\/.*$/);
    if (src) return src[0];
    const marks = chunkMaps.get(url);
    if (marks) {
        let pkg = '';
        for (const [line, name] of marks) { if (line <= cf.lineNumber) pkg = name; else break; }
        if (pkg) return 'pkg:' + pkg;
    }
    if (url.includes('@react-refresh')) return 'pkg:react-refresh';
    const dep = url.match(/\/deps\/([^/]+)\.js$/);
    return dep ? 'pkg:' + dep[1].replace(/_/g, '/') : url.replace(/^https?:\/\/[^/]+/, '');
}

type Owner = [string, RegExp];
// Leaf to root, the first frame whose module matches names the owner of the sample.
const OWNERS: Owner[] = [
    ['probe instrument', /^probe:/],
    ['H5 RunSummaryDialog', /\/jjscript\/components\/(RunSummaryDialog|runFigures)\./],
    ['H1 chat', /\/(components\/Jodie\/|jjscript\/components\/ScriptBlock\.|components\/common\/MarkdownRenderer\.)|^pkg:(react-markdown|react-syntax-highlighter|refractor|prismjs|highlight\.js|lowlight|remark|micromark|mdast|hast|unified|vfile)/],
    ['H3 tree', /\/(TreeView|tree-view|treeView|contexts\/TreeViewPanelContext)/i],
    ['H2 project tab (dashboard)', /\/pages\/components\/Dashboard\./],
    ['H2 editor', /\/components\/editor-v2\/|\/components\/abstract\/tabs\/(MetamodelTab|ModelTab)\.|^pkg:@xyflow|^pkg:reactflow/],
    ['statusbar', /\/components\/StatusBar\./],
    ['dock chrome', /\/components\/abstract\/Dock|\/components\/dock\//],
    ['Try (connect)', /\/forEndUser\/Try\./],
];
const FALLBACK: Owner[] = [
    ['react-dom (unowned)', /^pkg:(react-dom|scheduler|react-refresh|react)$/],
    ['react-redux (unowned)', /^pkg:(react-redux|use-sync-external-store)/],
    ['rc-dock', /^pkg:(rc-dock|rc-tabs|rc-)/],
    ['redux core', /\/src\/redux\//],
    ['jjscript executor', /\/src\/jjscript\//],
    ['model/joiner', /\/src\/(model|joiner|common)\//],
];

interface Prof { nodes: any[]; startTime: number; endTime: number; samples: number[]; timeDeltas: number[] }

function attribute(profile: Prof, offsetMs: number, windows: Record<string, [number, number]>) {
    const byId = new Map<number, any>();
    const parent = new Map<number, number>();
    for (const n of profile.nodes) byId.set(n.id, n);
    for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
    const modCache = new Map<number, string>();
    const mod = (id: number) => { let m = modCache.get(id); if (m === undefined) { m = moduleOf(byId.get(id).callFrame); modCache.set(id, m); } return m; };
    const ownerCache = new Map<number, string>();
    const ownerOf = (id: number): string => {
        const hit = ownerCache.get(id);
        if (hit) return hit;
        const fn = byId.get(id).callFrame.functionName;
        let owner: string | null = null;
        if (fn === '(idle)') owner = 'idle';
        else if (fn === '(garbage collector)') owner = 'gc';
        else if (fn === '(program)') owner = 'program (native: style, layout, paint)';
        for (const table of [OWNERS, FALLBACK]) {
            for (let x: number | undefined = id; !owner && x !== undefined; x = parent.get(x)) {
                const m = mod(x);
                for (const [name, re] of table) if (re.test(m)) { owner = name; break; }
            }
        }
        owner = owner || 'other';
        ownerCache.set(id, owner);
        return owner;
    };
    const out: Record<string, Record<string, number>> = {};
    const modSelf: Record<string, number> = {};
    const modIncl: Record<string, number> = {};
    const fnSelf: Record<string, number> = {};
    for (const w of Object.keys(windows)) out[w] = {};
    let t = profile.startTime;
    for (let i = 0; i < profile.samples.length; i++) {
        t += profile.timeDeltas[i];
        const next = i + 1 < profile.timeDeltas.length ? profile.timeDeltas[i + 1] : 0;
        const ms = next / 1000;
        const pageT = t / 1000 - offsetMs;
        const id = profile.samples[i];
        const owner = ownerOf(id);
        for (const [w, [a, b]] of Object.entries(windows)) {
            if (pageT > a && pageT <= b) out[w][owner] = (out[w][owner] || 0) + ms;
        }
        const [ra, rb] = windows.run;
        if (pageT > ra && pageT <= rb) {
            const cf = byId.get(id).callFrame;
            const leaf = mod(id) || cf.functionName;
            modSelf[leaf] = (modSelf[leaf] || 0) + ms;
            const fk = `${cf.functionName || '(anon)'} @ ${leaf}`;
            fnSelf[fk] = (fnSelf[fk] || 0) + ms;
            const seen = new Set<string>();
            for (let x: number | undefined = id; x !== undefined; x = parent.get(x)) {
                const f = mod(x);
                if (f && !seen.has(f)) { seen.add(f); modIncl[f] = (modIncl[f] || 0) + ms; }
            }
        }
    }
    const top = (o: Record<string, number>, k: number) =>
        Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, k).map(([f, v]) => [f, +v.toFixed(1)]);
    const round = (o: Record<string, number>) =>
        Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, +v.toFixed(1)]));
    return {
        windows: Object.fromEntries(Object.entries(out).map(([w, o]) => [w, round(o)])),
        moduleSelfTop: top(modSelf, 25),
        moduleInclTop: top(modIncl, 40),
        functionSelfTop: top(fnSelf, 30),
    };
}

function markOffset(profile: Prof, markPageMs: number): number | null {
    const byId = new Map<number, any>();
    const parent = new Map<number, number>();
    for (const n of profile.nodes) byId.set(n.id, n);
    for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
    let t = profile.startTime;
    for (let i = 0; i < profile.samples.length; i++) {
        t += profile.timeDeltas[i];
        for (let x: number | undefined = profile.samples[i]; x !== undefined; x = parent.get(x)) {
            if (byId.get(x).callFrame.functionName === '__runperfMark') return t / 1000 - markPageMs;
        }
    }
    return null;
}

// ── Timing lines ───────────────────────────────────────────────────────────────────────────────
function parseTiming(lines: Array<{ t: number; s: string }>) {
    const iters: Array<{ t: number; line: number; iter: number; cmd: string }> = [];
    const execs: Array<{ wait: number; apply: number; total: number; inp: string }> = [];
    for (const { t, s } of lines) {
        let m = s.match(/line=(\d+) iter=([\d.]+) cmd="(.*)"/);
        if (m) { iters.push({ t, line: +m[1], iter: +m[2], cmd: m[3] }); continue; }
        m = s.match(/wait=([\d.]+) apply=([\d.]+) total=([\d.]+) in="(.*)"/);
        if (m) execs.push({ wait: +m[1], apply: +m[2], total: +m[3], inp: m[4] });
    }
    return { iters, execs };
}

// ── UI steps ───────────────────────────────────────────────────────────────────────────────────
async function createProject(page: Page, name: string): Promise<string | null> {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.locator('button', { hasText: 'New Project' }).first().click();
    await page.waitForTimeout(1200);
    await page.locator('input[type="text"]').first().fill(name);
    await page.locator('button', { hasText: /^Create/ }).last().click();
    await page.waitForTimeout(5000);
    return page.evaluate(`(() => { const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length ? a[a.length - 1].id : null; })()`) as Promise<string | null>;
}

async function metamodels(page: Page): Promise<Array<{ id: string; name: string; classes: number }>> {
    return page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const p = j.L.fromPointer(j.DUser.current)?.project;
      return (p?.metamodels || []).map(m => ({ id: m.id, name: m.name, classes: (m.classes || []).length }));
    })()`) as any;
}

async function newMetamodel(page: Page): Promise<string> {
    const entry = page.getByText('New metamodel', { exact: true }).first();
    if (await entry.isVisible().catch(() => false)) {
        await entry.click();
        await page.waitForTimeout(8000);
        return 'left bar entry';
    }
    // Once the left bar leaves its Project panel the entry is not in the DOM: call the function
    // the entry calls (LeftBar.tsx: createM2(project), from Navbar.tsx), then open its tab.
    const how = await page.evaluate(`(async () => {
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
    })()`) as string;
    await page.waitForTimeout(8000);
    return how;
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

async function openJodie(page: Page) {
    if ((await page.locator('.jodie-window').count()) === 0) {
        await page.locator('.jodie-minimized').click();
        await page.waitForTimeout(1500);
    }
}


/** One editor pane by its model id: rc-dock labels the pane `<dock>-tab-<tab id>`, and a model tab's id is the model's. */
async function paneState(page: Page, modelId: string, needle = '') {
    return page.evaluate(`(() => {
      const pane = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${modelId}"]');
      if (!pane) return null;
      const vp = pane.querySelector('.react-flow__viewport');
      const nodes = [...pane.querySelectorAll('.react-flow__node')];
      return {
        active: pane.classList.contains('dock-tabpane-active'),
        viewport: vp ? vp.style.transform : null,
        nodes: nodes.length,
        selected: nodes.filter(n => n.classList.contains('selected')).map(n => n.getAttribute('data-id')).sort(),
        lastSelected: (window.store.getState()._lastSelected || {}).modelElement || null,
        needle: ${JSON.stringify(needle)} ? nodes.filter(n => n.textContent.includes(${JSON.stringify(needle)})).length : 0,
      };
    })()`) as Promise<any>;
}

/** Everything that says where a handle and an edge end are drawn, in flow coordinates. */
const DUMP_PANE = `((pane) => {
  const nodes = [...pane.querySelectorAll('.react-flow__node')].map(n => ({
    id: n.getAttribute('data-id'), transform: n.style.transform, w: n.style.width, h: n.style.height,
    handles: [...n.querySelectorAll('.react-flow__handle.mm-anchor--connected')].map(h => ({
      id: h.getAttribute('data-handleid'), type: h.classList.contains('source') ? 'source' : 'target', style: h.getAttribute('style'),
    })).sort((a, b) => (a.id + a.type).localeCompare(b.id + b.type)),
  })).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const edges = [...pane.querySelectorAll('.react-flow__edge')].map(e => ({
    id: e.getAttribute('data-id') || e.getAttribute('data-testid'),
    d: [...e.querySelectorAll('path')].map(p => p.getAttribute('d')).filter(Boolean),
  })).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return { nodes, edges };
})`;

async function runScenes(browser: any): Promise<void> {
    const { readdirSync, readFileSync: rf } = await import('node:fs');
    const dir = process.env.RUNPERF_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
    const files = readdirSync(dir).filter((f: string) => f.endsWith('.jjodel')).sort();
    const out: any = { dir, scenes: {} };
    for (const f of files) {
        const c = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
        await c.addInitScript({ content: 'globalThis.__name = (f) => f;' });
        await seed(c, false);
        const p: Page = await c.newPage();
        const errs: string[] = [];
        p.on('pageerror', (e: Error) => errs.push(e.message));
        await p.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 180000 });
        await p.waitForTimeout(4000);
        const text = rf(`${dir}/${f}`, 'utf8');
        const imported = await p.evaluate(`(async () => {
          const api = await import('/src/api/persistance/projects.ts');
          const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
          const before = count();
          // importFromText returns before its async TRANSACTION stores the project: wait for it.
          await api.ProjectsApi.importFromText(${JSON.stringify(text)});
          for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
          const a = JSON.parse(localStorage.getItem('projects') || '[]');
          return a.length > before ? a[a.length - 1].id : null;
        })()`) as string | null;
        check(`scene ${f}: imported`, !!imported, String(imported));
        if (!imported) { await c.close(); continue; }
        await p.goto(`${URL}/#/project?id=${imported}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
        await p.waitForTimeout(8000);
        const models: Array<{ id: string; name: string }> = await p.evaluate(`(async () => {
          const j = await import('/src/joiner/index.ts');
          const pr = j.L.fromPointer(j.DUser.current).project;
          if (!pr) return [];
          return [...(pr.metamodels || []), ...(pr.models || []).filter(m => !m.isMetamodel)].map(m => ({ id: m.id, name: m.name }));
        })()`) as any;
        const panes: any = {};
        for (const m of models) {
            await p.evaluate(`(async () => {
              const j = await import('/src/joiner/index.ts');
              const dm = await import('/src/components/abstract/DockManager.tsx');
              await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(m.id)}));
            })()`).catch(() => {});
            await p.waitForTimeout(5000);
            panes[m.name] = await p.evaluate(`(() => {
              const pane = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m.id}"]');
              return pane ? ${DUMP_PANE}(pane) : null;
            })()`);
        }
        const counts = Object.fromEntries(Object.entries(panes).map(([k, v]: any) => [k, v ? { nodes: v.nodes.length, edges: v.edges.length, handles: v.nodes.reduce((s: number, n: any) => s + n.handles.length, 0) } : null]));
        note(`scene ${f}`, { project: imported, models: models.length, counts, pageErrors: errs.length });
        check(`scene ${f}: every model pane rendered`, Object.values(panes).every((v: any) => v && v.nodes.length > 0), JSON.stringify(counts));
        out.scenes[f] = { models, panes, pageErrors: errs };
        await c.close();
    }
    writeFileSync(OUT, JSON.stringify(out, null, 1));
}

// ── Main ───────────────────────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ args: ['--enable-precise-memory-info'] });
if (VARIANT === 'scenes') {
    await runScenes(browser);
    console.log(`OUT ${OUT}`);
    console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`);
    await browser.close();
    process.exit(failures === 0 ? 0 : 1);
}
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await ctx.addInitScript({ content: INIT });
await seed(ctx, false);
// Ablation (c): the tree starts hidden through its own persisted switch (TreeViewPanelContext,
// STORAGE_KEY_VISIBLE), the state ⌘B leaves behind; TreeViewContent is then not mounted.
if (VARIANT === 'inset-cached') await ctx.addInitScript({ content: 'globalThis.__runperfInsetCacheOn = true;' });
if (VARIANT === 'tree-hidden') await ctx.addInitScript({ content: "localStorage.setItem('jjodel_treeview_visible', 'false');" });
const page = await ctx.newPage();
const pageErrors: string[] = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
const cdp: CDPSession = await ctx.newCDPSession(page);
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 250 });

const result: any = { variant: VARIANT, url: URL, n: N, profiled: [...PROFILE], runs: [], notes: {} };
const pid = await createProject(page, `RunPerf_${VARIANT}`);
check('project created', !!pid, String(pid));
await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(7000);
await newMetamodel(page);
let mms = await metamodels(page);
check('metamodel_1 exists', mms.length === 1, JSON.stringify(mms));
let target = mms[0];
await openJodie(page);
check('Jjodie chat hook found', (await page.evaluate(`!!${JODIE_HOOK}`)) === true, '');
note('setup', await snapshot(page));

if (VARIANT === 'one-tab') {
    const tabs: string[] = (await snapshot(page) as any).tabs;
    for (const t of tabs) if (t !== target.name) result.notes['close ' + t] = await closeTab(page, t);
    note('one-tab', await snapshot(page));
}
if (VARIANT === 'tree-hidden') {
    const mounted = await page.locator('.tree-view-content').count();
    check('tree hidden: TreeViewContent not in the DOM', mounted === 0, `.tree-view-content x${mounted}`);
}

async function oneRun(n: number, label = `run ${n}`) {
    return oneRunScript(n, undefined, label);
}

async function oneRunScript(n: number, body: string | undefined, label: string) {
    const before: any = await snapshot(page);
    const clear = VARIANT === 'chat-empty';
    const inj = await inject(page, n, target, clear, body);
    await page.waitForTimeout(600);
    // DOM click: with summary-open the earlier dialogs' overlays may cover the button.
    await page.evaluate(`(() => { const b = [...document.querySelectorAll('.md-code-jjscript')].pop(); if (b) b.click(); })()`);
    await page.waitForTimeout(400);
    const prof = PROFILE.has(n);
    if (prof) await cdp.send('Profiler.start');
    const r: any = await page.evaluate(RUN_AND_WAIT);
    let profile: Prof | null = null;
    if (prof) profile = (await cdp.send('Profiler.stop')).profile as any;
    if (r.error) throw new Error(label + ': ' + r.error);
    await page.waitForTimeout(300);
    const summaryText = await page.locator('.run-summary').last().innerText().catch(() => '');
    // summary-open (H5 with the dialog open): every summary stays open, as a user who never
    // presses Close leaves it; each open dialog's useSelector then reads the project per dispatch.
    if (VARIANT !== 'summary-open') await page.locator('.run-summary .exec-error-btn--primary').last().click().catch(() => {});
    await page.waitForTimeout(500);
    const after: any = await snapshot(page);
    const { iters, execs } = parseTiming(r.timing);
    const rec: any = {
        run: n, label, target: target.name, inject: inj, summary: r.summary, wall: Math.round(r.wall),
        before: { idlookup: before.idlookup, dom: before.dom, heapMB: before.heapMB, rfNodes: before.rfNodes, rfHandles: before.rfHandles, treeDom: before.treeDom, jjactions: before.jjactions, scriptBlocks: before.scriptBlocks },
        after: { idlookup: after.idlookup, dom: after.dom, heapMB: after.heapMB, rfNodes: after.rfNodes, rfNodesVisible: after.rfNodesVisible, rfHandles: after.rfHandles, treeDom: after.treeDom, jjactions: after.jjactions, scriptBlocks: after.scriptBlocks, tabs: after.tabs },
        iterSum: Math.round(iters.reduce((s, x) => s + x.iter, 0)), iters: iters.length,
        waitSum: Math.round(execs.reduce((s, x) => s + x.wait, 0)), applySum: +execs.reduce((s, x) => s + x.apply, 0).toFixed(1),
        attrLine: iters.find((x) => x.line === ATTR_LINE)?.iter, attrWait: execs.find((x) => x.inp.startsWith('create attribute title'))?.wait,
        noWaitIterMean: (() => { const nw = iters.filter((_x, i) => (execs[i]?.wait ?? 1) < 1); return nw.length ? Math.round(nw.reduce((s, x) => s + x.iter, 0) / nw.length) : null; })(),
        insetReads: r.insetReads, insetCached: r.inset, openSummaries: r.openSummaries,
        failedLines: (summaryText.match(/with (\d+) error/) || [])[1] || '0',
        summaryErrors: /error/.test(r.summary) ? summaryText.slice(0, 1500) : '',
        reactErr: r.err,
    };
    // React commits: totals per bucket over the run, and inside the window of the attribute line.
    const iterT = (line: number) => iters.find((x) => x.line === line)?.t;
    const wA = iterT(ATTR_LINE - 1), wB = iterT(ATTR_LINE);
    const sumBuckets = (cs: any[]) => {
        const o: Record<string, [number, number]> = {};
        for (const c of cs) for (const [b, [k, ms]] of Object.entries(c.b as Record<string, [number, number]>)) {
            const e = o[b] || (o[b] = [0, 0]); e[0] += k; e[1] += ms;
        }
        return Object.fromEntries(Object.entries(o).sort((a, b) => b[1][1] - a[1][1]).map(([b, [k, ms]]) => [b, { fibers: k, ms: +ms.toFixed(1) }]));
    };
    rec.react = {
        commits: r.commits.length,
        renderMs: +r.commits.reduce((s: number, c: any) => s + c.ms, 0).toFixed(1),
        run: sumBuckets(r.commits),
        attrWindow: wA && wB ? { commits: r.commits.filter((c: any) => c.t > wA && c.t <= wB).length, buckets: sumBuckets(r.commits.filter((c: any) => c.t > wA && c.t <= wB)) } : null,
        topNames: Object.entries(r.names as Record<string, [number, number]>).sort((a, b) => b[1][1] - a[1][1]).slice(0, 30).map(([k, [c, ms]]) => [k, c, +ms.toFixed(1)]),
    };
    if (profile) {
        await loadChunkMaps(profile);
        const off = markOffset(profile, r.mark);
        rec.cpu = off === null ? { error: 'mark not found in profile' } : {
            offsetMs: +off.toFixed(2),
            ...attribute(profile, off, { run: [r.t0, r.t1], ...(wA && wB ? { attr: [wA, wB] } : {}) }),
        };
    }
    note(label, { insetReads: rec.insetReads, wall: rec.wall, iterSum: rec.iterSum, waitSum: rec.waitSum, applySum: rec.applySum, attrWait: rec.attrWait, noWaitIterMean: rec.noWaitIterMean, idlookup: rec.after.idlookup, dom: rec.after.dom, heapMB: rec.after.heapMB, renderMs: rec.react.renderMs, commits: rec.react.commits, failed: rec.failedLines });
    result.runs.push(rec);
    writeFileSync(OUT, JSON.stringify(result, null, 1));
}

for (let n = 1; n <= N; n++) {
    if ((VARIANT === 'two-mm' || VARIANT === 'two-mm-closed') && n === SWITCH_AT) {
        const first = target.name;
        const firstId = target.id;
        if (VARIANT === 'two-mm') {
            // Tab-switch check (fix 1): select a node of metamodel_1 and record its pane before leaving it.
            await page.locator(`[role="tabpanel"][aria-labelledby$="-tab-${firstId}"] .react-flow__node`, { hasText: `R${n - 1}_Library` })
                .first().click({ position: { x: 20, y: 8 } }).catch(() => {});
            await page.waitForTimeout(800);
            // Move the viewport away from its default with the wheel, so "viewport kept" can fail.
            const box = await page.locator(`[role="tabpanel"][aria-labelledby$="-tab-${firstId}"] .react-flow__pane`).first().boundingBox().catch(() => null);
            if (box) {
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.wheel(0, -400);
                await page.waitForTimeout(800);
            }
            result.notes.tabBefore = await paneState(page, firstId);
            result.notes.firstMetamodel = { id: firstId, name: first };
        }
        result.notes.newMetamodel2 = await newMetamodel(page);
        mms = await metamodels(page);
        const nxt = mms.find((m) => m.id !== target.id);
        check('metamodel_2 created', !!nxt, JSON.stringify(mms));
        if (nxt) target = nxt;
        if (VARIANT === 'two-mm-closed') result.notes['close ' + first] = await closeTab(page, first);
        await openJodie(page);
        note('switch', await snapshot(page));
    }
    await oneRun(n);
}
if (VARIANT === 'two-mm' && result.notes.firstMetamodel) {
    // Write into metamodel_1 while its tab is hidden, then bring it back: it must show the new
    // class, and keep its viewport and its selection (what a tab switch shows, fix 1).
    const mm1 = result.notes.firstMetamodel;
    const second = target;
    target = { id: mm1.id, name: mm1.name } as any;
    const hiddenBefore = await paneState(page, mm1.id, 'HiddenCatchUp');
    PROFILE.delete(N + 1);
    await oneRunScript(N + 1, 'create class HiddenCatchUp\ncreate attribute probe in HiddenCatchUp type String', 'write into hidden metamodel_1');
    const hiddenAfterWrite = await paneState(page, mm1.id, 'HiddenCatchUp');
    await page.evaluate(`(() => { const t = [...document.querySelectorAll('.dock-tab')].find(t => t.textContent.trim() === ${JSON.stringify(mm1.name)}); if (t) t.click(); })()`);
    await page.waitForTimeout(2000);
    const back = await paneState(page, mm1.id, 'HiddenCatchUp');
    const classes1 = (await metamodels(page)).find((m) => m.id === mm1.id)?.classes;
    result.notes.tabCheck = { before: result.notes.tabBefore, hiddenBefore, hiddenAfterWrite, back, classes: classes1 };
    note('tab check', result.notes.tabCheck);
    check('tab check: metamodel_1 active again', !!back?.active, JSON.stringify(back));
    check('tab check: the class written while hidden is drawn', back?.needle === 1, `needle=${back?.needle}`);
    check('tab check: one node per class', back?.nodes === classes1, `nodes=${back?.nodes} classes=${classes1}`);
    check('tab check: viewport kept', back?.viewport === result.notes.tabBefore?.viewport, `${result.notes.tabBefore?.viewport} -> ${back?.viewport}`);
    check('tab check: the viewport had moved before the switch', result.notes.tabBefore?.viewport !== 'translate(0px, 0px) scale(1)', String(result.notes.tabBefore?.viewport));
    check('tab check: selection kept', JSON.stringify(back?.selected) === JSON.stringify(result.notes.tabBefore?.selected), `${JSON.stringify(result.notes.tabBefore?.selected)} -> ${JSON.stringify(back?.selected)}`);
    note('tab check: hidden pane while hidden (follows the store before fix 1, frozen after)', { nodesBefore: hiddenBefore?.nodes, nodesAfterWrite: hiddenAfterWrite?.nodes, needleAfterWrite: hiddenAfterWrite?.needle });
    target = second;
}
mms = await metamodels(page);
note('metamodels after runs', mms);
check('every run created its 7 classes', mms.reduce((s, m) => s + m.classes, 0) === 7 * N + (result.notes.tabCheck ? 1 : 0), JSON.stringify(mms));

if (RELOAD) {
    // H4, two checks after the last run.
    // (a) Same page, same store, the chat emptied: what is left is size plus whatever accumulated
    //     outside the chat (history, listeners, caches).
    await page.evaluate(`(() => { const h = ${JODIE_HOOK}; if (h) h.queue.dispatch(prev => ({ ...prev, messages: [] })); })()`);
    await page.waitForTimeout(1500);
    PROFILE.add(N + 1);
    await oneRun(N + 1, `run ${N + 1} same page, chat emptied`);
    // (b) Save, reload, reopen: the same store in a fresh page, nothing accumulated.
    await cdp.send('HeapProfiler.enable');
    await cdp.send('HeapProfiler.collectGarbage');
    result.notes.heapAfterGcMB = await page.evaluate('Math.round(performance.memory.usedJSHeapSize / 1048576)');
    note('heap after GC, before reload (MB)', result.notes.heapAfterGcMB);
    const idBefore = (await snapshot(page) as any).idlookup;
    const classesBefore = (await metamodels(page))[0]?.classes;
    result.notes.save = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const api = await import('/src/api/persistance/projects.ts');
      const p = j.L.fromPointer(j.DUser.current).project;
      try { await api.ProjectsApi.save(p); return 'saved'; } catch (e) { return 'save threw: ' + e; }
    })()`);
    await page.waitForTimeout(3000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);
    const mmsReload = await metamodels(page);
    result.notes.reload = { idlookupBefore: idBefore, metamodels: mmsReload, snapshot: await snapshot(page) };
    note('after save and reload', result.notes.reload);
    const persisted = mmsReload.length > 0 && mmsReload[0].classes === classesBefore;
    check('project persists across save and reload with its classes', persisted, `${result.notes.save}; ${JSON.stringify(mmsReload)}`);
    if (mmsReload.length > 0) {
        target = mmsReload[0];
        const tabs: string[] = (await snapshot(page) as any).tabs;
        if (!tabs.includes(target.name)) {
            result.notes.reopen = await page.evaluate(`(async () => {
              const j = await import('/src/joiner/index.ts');
              const dm = await import('/src/components/abstract/DockManager.tsx');
              await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(target.id)}));
              return 'open2';
            })()`).catch((e: any) => 'reopen failed: ' + e);
            await page.waitForTimeout(8000);
        }
        await openJodie(page);
        note('reopened', await snapshot(page));
        PROFILE.add(N + 2);
        await oneRun(N + 2, `run ${N + 2} after save and reload`);
    }
}

result.notes.chunkMaps = [...chunkMaps].map(([u, m]) => [u.replace(/^.*\/deps\//, ''), m.length, [...new Set(m.map((x) => x[1]))].slice(0, 6)]);
result.pageErrors = pageErrors;
result.failures = failures;
writeFileSync(OUT, JSON.stringify(result, null, 1));
note('page errors', pageErrors.length);
console.log(`OUT ${OUT}`);
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
