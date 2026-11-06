/**
 * elk-handles-loop probe (P-2026-10-10-0915: A3 back, R-VP-60).
 *
 * A3 widens DynamicHandles' keys with the ELK pins of an edge (`irSourcePin` / `irTargetPin`). Those keys were on the
 * re-render path of the «Maximum update depth» cascade of 2026-10-01 (P-2026-10-01-1655 §3.4, root cause still open).
 * This probe measures, on the code it is served, whether the cascade comes back:
 *
 *   loop  For each derived viewpoint (EHL_SCENES), in a fresh page: import the demo export, derive the notation,
 *         activate it, run one toolbar Auto layout, then repetitions of the gestures of P-2026-10-01-1655 until
 *         EHL_DRAGS drags: click an edge (an edge selection, measured on its own and held through the next drag),
 *         drag a node there and back fast (30 steps), slowly (40 steps of 16 ms), and across an edge's midpoint. The
 *         pane is fitted before each repetition (a drag that misses a node pans it). Per gesture: React's own nested
 *         update count (max), DynamicHandles renders, the edges carrying a pin, a crash (the CanvasErrorBoundary
 *         fallback, the app's <Try> fallback, a «Maximum update depth» in the console or the page errors). A crash
 *         ends the page; the drags left run on a fresh page, at most EHL_PAGES pages per viewpoint.
 *   sim   DemoESM, the demo script's ten presses (docs/demo/models_2026_simulator_demo.md, scene 3), the run's event
 *         nodes hidden by P-2026-10-04-0935: once in the default viewpoint, once in the derived Statechart after one
 *         Auto layout (where A3 pins). The panel's status lines after each press, page errors, the hidden nodes, and
 *         the connected handles of the nodes the run does not hide, before Reset, after the tenth press and after
 *         Stop; the pins of every edge before and during the run.
 *
 * Instrumentation goes in through Playwright route patches of the served modules; no tracked file is touched:
 * react-dom's checkForNestedUpdates records nestedUpdateCount, DynamicHandles.tsx counts its function body's calls.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/elk-handles-loop.ts \
 *         --port 3080 --id P-2026-10-10-0915
 * Env:  EHL_TAG     label of the run (default branch)
 *       EHL_PARTS   loop,sim (default both)
 *       EHL_SCENES  notation:scene list (default petriClassic:petri,flowchart:flowB,activityUml:flowB,statechart:pest)
 *       EHL_DRAGS   drags per viewpoint (default 60: 20 repetitions of select, fast, slow, over an edge)
 *       EHL_PAGES   fresh pages per viewpoint at most (default 5)
 *       EHL_OUT     JSON output (default ~/.jjodel-lanes/P-2026-10-10-0915/ehl_<tag>.json)
 *       EHL_CROPS   crop directory (default ~/.jjodel-lanes/P-2026-10-10-0915/crops)
 *       EHL_NOPATCH 1: no module patched (the control that a crash is the app's, not the instrumentation's); the
 *                   depth and render counts then read 0
 *       EHL_NOLAYOUT 1: the gestures at rest, no Auto layout first (a control for a crash that is not the layout's)
 *       PIP_SCENES  directory of the demo exports (default ~/jjodel-demo-exports)
 */
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { seed, setTheme } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3080/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const TAG = process.env.EHL_TAG || 'branch';
const PARTS = (process.env.EHL_PARTS || 'loop,sim').split(',');
const DRAGS = Number(process.env.EHL_DRAGS || 60);
const PAGES = Number(process.env.EHL_PAGES || 5);
const NOPATCH = process.env.EHL_NOPATCH === '1';
const NOLAYOUT = process.env.EHL_NOLAYOUT === '1';
const LANE = `${process.env.HOME}/.jjodel-lanes/P-2026-10-10-0915`;
const OUT = process.env.EHL_OUT || `${LANE}/ehl_${TAG}.json`;
const CROPS = (process.env.EHL_CROPS || `${LANE}/crops`).replace(/\/$/, '');
const SCENES_DIR = process.env.PIP_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const FILES: Record<string, { file: string; profile: string }> = {
    petri: { file: 'scene_2_DemoPetri.jjodel', profile: 'petri' },
    flowB: { file: 'scene_4_DemoFlowB.jjodel', profile: 'flowchart' },
    pest: { file: 'scene_1_DemoPEST.jjodel', profile: 'stateMachine' },
    esm: { file: 'scene_3_DemoESM.jjodel', profile: 'stateMachine' },
};
const LOOP = (process.env.EHL_SCENES || 'petriClassic:petri,flowchart:flowB,activityUml:flowB,statechart:pest').split(',').map((x) => {
    const [notation, scene] = x.split(':');
    return { notation, scene };
});

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 2000)}`); if (ok) pass++; else fail++; };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 6000)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const paneSel = (m1: string) => `[id="${m1}"].dock-tabpane-active`;

// ── Instrumentation ──────────────────────────────────────────────────────────────────────────────────────────────
const patched: Record<string, number> = {};
function patchText(url: string, src: string): string {
    let out = src;
    if (out.includes('function checkForNestedUpdates() {')) {
        out = out.replace('function checkForNestedUpdates() {',
            'function checkForNestedUpdates() { { const R = (window.__rd ||= { max: 0 }); if (nestedUpdateCount > R.max) R.max = nestedUpdateCount; }');
        patched.react = (patched.react ?? 0) + 1;
    }
    if (url.includes('/components/DynamicHandles.tsx')) {
        const re = /function DynamicHandles\(([^)]*)\)\s*\{/;
        if (re.test(out)) { out = out.replace(re, (m) => `${m} window.__dhR = (window.__dhR || 0) + 1;`); patched.dynamicHandles = 1; }
    }
    return out;
}

async function newPage(browser: any): Promise<{ ctx: BrowserContext; page: Page; errors: string[] }> {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
    await seed(ctx, true);
    await ctx.addInitScript(() => { const w = globalThis as any; w.__name = (f: any) => f; w.__rd = { max: 0 }; w.__dhR = 0; });
    await ctx.addInitScript(`window.__ehlStore = ${STORE};`);
    if (!NOPATCH) await ctx.route((u) => /\/deps\/[^?]*\.js/.test(u.toString()) || u.toString().includes('/components/DynamicHandles.tsx'), async (route) => {
        let resp;
        try { resp = await route.fetch(); } catch { await route.continue().catch(() => {}); return; }
        const body = await resp.text();
        const out = patchText(route.request().url(), body);
        await route.fulfill({ response: resp, body: out, headers: { ...resp.headers(), 'content-length': String(Buffer.byteLength(out)) } });
    });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 300)));
    page.on('console', (m) => {
        const t = m.text();
        if (m.type() === 'error' && /Maximum update depth/.test(t)) errors.push('console: ' + t.slice(0, 300));
        // React names the component whose update overflowed: «The above error occurred in the <X> component».
        if (m.type() === 'error' && /The above error occurred in the/.test(t)) errors.push('component: ' + (t.match(/occurred in the <[^>]+> component/)?.[0] ?? t.slice(0, 120)) + ' | ' + t.split('\n').slice(1, 9).map((l) => l.trim()).join(' < '));
    });
    return { ctx, page, errors };
}

// ── Scene setup (the calls of petri-ink-ports.ts) ────────────────────────────────────────────────────────────────
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
    const models = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const pr = j.L.fromPointer(j.DUser.current).project;
      return [...(pr.metamodels || []).map(m => ({ id: m.id, name: m.name, meta: true })), ...(pr.models || []).filter(m => !m.isMetamodel).map(m => ({ id: m.id, name: m.name, meta: false }))];
    })()`) as Array<{ id: string; name: string; meta: boolean }>;
    return { project, models };
}

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
        const store = (window as any).__ehlStore(sel);
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

/** Edges of the pane: how many, how many routed (the session route store), how many carry a pin. */
async function edgeState(page: Page, m1: string) {
    return page.evaluate(async ([sel]: string[]) => {
        const store = (window as any).__ehlStore(sel);
        if (!store) return null;
        const load = (p: string): Promise<any> => import(p);
        const elk = await load('/src/components/editor-v2/utils/elkLayout.ts');
        const edges = store.getState().edges as any[];
        const pins: Record<string, [number | null, number | null]> = {};
        for (const e of edges) if (e.data && (e.data.irSourcePin !== undefined || e.data.irTargetPin !== undefined)) pins[e.id] = [e.data.irSourcePin ?? null, e.data.irTargetPin ?? null];
        return { edges: edges.length, hidden: edges.filter((e) => e.hidden).length, routed: edges.filter((e) => !!elk.getElkRoute(e.id)).length, pinned: Object.keys(pins).length, pins };
    }, [paneSel(m1)]);
}

/** The connected handles of the pane's visible nodes, in flow coordinates, by node and handle id. */
async function handlesOf(page: Page, m1: string) {
    return page.evaluate(async ([sel]: string[]) => {
        const store = (window as any).__ehlStore(sel);
        const s = store?.getState();
        const out: Record<string, [number, number]> = {};
        const hidden = new Set<string>((s?.nodes ?? []).filter((n: any) => n.hidden).map((n: any) => n.id));
        const pane = document.querySelector(sel);
        const vp = pane?.querySelector('.react-flow__viewport') as HTMLElement | null;
        const mt = vp ? getComputedStyle(vp).transform.match(/matrix\(([^)]+)\)/) : null;
        const [a, , , , e, f] = mt ? mt[1].split(',').map(Number) : [1, 0, 0, 1, 0, 0];
        const root = pane?.querySelector('.react-flow')?.getBoundingClientRect();
        for (const node of pane?.querySelectorAll('.react-flow__node') ?? []) {
            const id = node.getAttribute('data-id')!;
            if (hidden.has(id)) continue;
            for (const h of node.querySelectorAll('.react-flow__handle.mm-anchor--connected')) {
                const r = h.getBoundingClientRect();
                const x = (r.left + r.width / 2 - (root?.left ?? 0) - e) / a, y = (r.top + r.height / 2 - (root?.top ?? 0) - f) / a;
                out[`${id}|${h.getAttribute('data-handleid')}|${h.classList.contains('source') ? 's' : 't'}`] = [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
            }
        }
        return { handles: out, hiddenNodes: hidden.size };
    }, [paneSel(m1)]);
}

const crashed = (page: Page) => page.evaluate(() => {
    const w = window as any;
    return { canvasError: document.querySelectorAll('.editor-v2__canvas-error').length, tryMessage: document.querySelectorAll('.try-message').length, tryreport: w.tryreport ? String(w.tryreport.e?.message ?? '').slice(0, 120) : null };
});
const counters = (page: Page) => page.evaluate(() => ({ rd: (window as any).__rd?.max ?? 0, dh: (window as any).__dhR ?? 0 }));
const resetCounters = (page: Page) => page.evaluate(() => { const w = window as any; w.__rd = { max: 0 }; w.__dhR = 0; });

const nodesOf = (page: Page, m1: string) => page.evaluate((sel: string) => {
    const pane = document.querySelector(sel);
    if (!pane) return [];
    return [...pane.querySelectorAll('.react-flow__node')].filter((n) => (n as HTMLElement).offsetParent && getComputedStyle(n).visibility !== 'hidden').map((n) => {
        const r = n.getBoundingClientRect();
        return { id: n.getAttribute('data-id')!, cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width, h: r.height };
    }).filter((n) => n.w > 4 && n.h > 4 && n.cx > 0 && n.cy > 0 && n.cx < 1600 && n.cy < 1000);
}, paneSel(m1));

const edgeMids = (page: Page, m1: string) => page.evaluate((sel: string) => {
    const pane = document.querySelector(sel);
    if (!pane) return [];
    return [...pane.querySelectorAll('.react-flow__edge')].map((e) => {
        const path = e.querySelector('path.react-flow__edge-path, path') as SVGPathElement | null;
        if (!path) return null;
        try { const L = path.getTotalLength(); const m = path.getPointAtLength(L / 2); const ctm = path.getScreenCTM()!; return { id: e.getAttribute('data-id'), x: m.x * ctm.a + ctm.e, y: m.y * ctm.d + ctm.f }; } catch { return null; }
    }).filter((x): x is { id: string; x: number; y: number } => !!x && x.x > 0 && x.y > 0 && x.x < 1600 && x.y < 1000);
}, paneSel(m1));

async function drag(page: Page, x0: number, y0: number, x1: number, y1: number, steps: number, pause = 0) {
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    if (pause) {
        for (let i = 1; i <= steps; i++) { await page.mouse.move(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps); await page.waitForTimeout(pause); }
    } else {
        await page.mouse.move(x1, y1, { steps });
    }
    await page.mouse.up();
}

const result: any = { url: URL, tag: TAG, loop: {}, sim: {} };
mkdirSync(CROPS, { recursive: true });
mkdirSync(OUT.replace(/\/[^/]*$/, ''), { recursive: true });
const save = () => writeFileSync(OUT, JSON.stringify(result, null, 1));
const browser = await chromium.launch();

// ── Part 1: the loop check ────────────────────────────────────────────────────────────────────────────────────────
type Row = { page: number; kind: string; rep: number; rd: number; dh: number; pinned: number | null; crash: boolean };
const isDrag = (k: string) => k !== 'select';
if (PARTS.includes('loop')) for (const { notation, scene } of LOOP) {
    const key = `${scene}/${notation}`;
    const out: any = { rows: [] as Row[], pages: [] as any[], crashes: [] as any[] };
    result.loop[key] = out;
    const drags = () => (out.rows as Row[]).filter((r) => isDrag(r.kind)).length;
    for (let pg = 0; pg < PAGES && drags() < DRAGS; pg++) {
        const { ctx, page, errors } = await newPage(browser);
        const pageOut: any = { page: pg };
        out.pages.push(pageOut);
        try {
            const { project, models } = await importScene(page, FILES[scene].file);
            if (!project) { check(`${key} page ${pg}: imported`, false, { project }); break; }
            await setTheme(page, 'light');
            const mm = models.find((m) => m.meta)!.id, m1 = models.find((m) => !m.meta)!.id;
            const d = await derive(page, mm, FILES[scene].profile, notation);
            if (!d.vp) { check(`${key} page ${pg}: derived`, false, d); break; }
            await activate(page, d.vp);
            await openModel(page, m1);
            await fit(page, m1);
            pageOut.instrumented = { ...patched, dhAtOpen: (await counters(page)).dh };
            pageOut.layout = NOLAYOUT ? 'skipped' : await clickLayout(page, m1);
            await fit(page, m1);
            await wait(page, 1200);
            const st = await edgeState(page, m1);
            pageOut.afterLayout = st && { edges: st.edges, routed: st.routed, pinned: st.pinned, pins: st.pins };
            if (pg === 0) {
                if (NOPATCH) meas(`${key}: instrumentation off (EHL_NOPATCH)`, patched);
                else check(`${key}: instrumentation: react-dom and DynamicHandles patched, DynamicHandles renders counted`, !!patched.react && !!patched.dynamicHandles && pageOut.instrumented.dhAtOpen > 0, pageOut.instrumented);
                if (!NOLAYOUT) check(`${key}: Auto layout ran and routed edges`, pageOut.layout === 'clicked' && (st?.routed ?? 0) > 0, st && { routed: st.routed, pinned: st.pinned });
                meas(`${key} after Auto layout`, pageOut.afterLayout);
                await page.locator(paneSel(m1)).first().screenshot({ path: `${CROPS}/ehl_${TAG}_${scene}_${notation}_elk.png` });
            }
            let crashed_ = false;
            for (let rep = 0; drags() < DRAGS && !crashed_; rep++) {
                await fit(page, m1);
                const ns = await nodesOf(page, m1);
                const pick = ns.length ? ns[(rep * 3) % ns.length] : null;
                if (!pick) { pageOut.noNode = rep; break; }
                const mids = await edgeMids(page, m1);
                const em0 = mids.length ? mids[rep % mids.length] : null;
                const em1 = mids.length ? mids[(rep + 1) % mids.length] : { x: pick.cx + 120, y: pick.cy };
                const gestures: Array<[string, () => Promise<void>]> = [
                    ['select', async () => { if (em0) await page.mouse.click(em0.x, em0.y); }],
                    ['fast30', async () => { await drag(page, pick.cx, pick.cy, pick.cx + 140, pick.cy + 70, 30); await wait(page, 120); await drag(page, pick.cx + 140, pick.cy + 70, pick.cx, pick.cy, 30); }],
                    ['slow40', async () => { await drag(page, pick.cx, pick.cy, pick.cx - 90, pick.cy + 110, 40, 16); await wait(page, 120); await drag(page, pick.cx - 90, pick.cy + 110, pick.cx, pick.cy, 40, 16); }],
                    ['overEdge', async () => { await drag(page, pick.cx, pick.cy, em1.x, em1.y, 30); await wait(page, 120); await drag(page, em1.x, em1.y, pick.cx, pick.cy, 30); }],
                ];
                for (const [kind, act] of gestures) {
                    if (isDrag(kind) && drags() >= DRAGS) break;
                    await resetCounters(page);
                    const e0 = errors.length;
                    const pinsBefore = isDrag(kind) ? null : (await edgeState(page, m1))?.pinned ?? null;
                    await act();
                    await wait(page, 350);
                    const c = await counters(page);
                    const cr = await crashed(page);
                    const es = await edgeState(page, m1);
                    const crash = cr.canvasError > 0 || cr.tryMessage > 0 || !!cr.tryreport || errors.slice(e0).some((e) => /Maximum update depth/.test(e));
                    out.rows.push({ page: pg, kind, rep, rd: c.rd, dh: c.dh, pinned: es?.pinned ?? pinsBefore, crash });
                    if (crash) {
                        crashed_ = true;
                        await wait(page, 300);
                        out.crashes.push({ page: pg, kind, rep, dragsBefore: drags() - (isDrag(kind) ? 1 : 0), rd: c.rd, cr, pinsAtCrash: pinsBefore, errors: errors.slice(e0, e0 + 2).map((e) => e.slice(0, 160)), component: errors.slice(e0).filter((e) => e.startsWith('component: ')).slice(0, 2).map((e) => e.slice(0, 700)) });
                        await page.screenshot({ path: `${CROPS}/ehl_${TAG}_${scene}_${notation}_crash_p${pg}.png` });
                        break;
                    }
                }
                await page.keyboard.press('Escape');
            }
            if (!crashed_) await page.locator(paneSel(m1)).first().screenshot({ path: `${CROPS}/ehl_${TAG}_${scene}_${notation}_after_drags.png` });
            pageOut.errors = errors.filter((e) => !/Maximum update depth|^component: /.test(e)).slice(0, 4);
        } catch (e: any) {
            check(`${key} page ${pg}: ran`, false, String(e?.message ?? e).slice(0, 300));
            break;
        } finally {
            save();
            await ctx.close();
        }
    }
    const rows: Row[] = out.rows;
    const stat = (r: Row[]) => ({ n: r.length, rdMax: Math.max(0, ...r.map((x) => x.rd)), dhMean: r.length ? Math.round((r.reduce((a, x) => a + x.dh, 0) / r.length) * 10) / 10 : null, dhMax: Math.max(0, ...r.map((x) => x.dh)) });
    const ok = rows.filter((r) => !r.crash);
    out.summary = { drags: drags(), selections: rows.filter((r) => r.kind === 'select').length, pages: out.pages.length, crashes: out.crashes.length,
        rdMaxNoCrash: Math.max(0, ...ok.map((r) => r.rd)), dhPerDrag: stat(ok.filter((r) => isDrag(r.kind))), dhPerSelect: stat(ok.filter((r) => r.kind === 'select')),
        perKind: Object.fromEntries(['select', 'fast30', 'slow40', 'overEdge'].map((k) => [k, stat(ok.filter((r) => r.kind === k))])),
        pinnedSeen: [...new Set(rows.map((r) => r.pinned))], crashAt: out.crashes.map((c: any) => `p${c.page} ${c.kind} rep ${c.rep} after ${c.dragsBefore} drags (pins ${c.pinsAtCrash})`) };
    meas(`${key} loop summary`, out.summary);
    check(`${key}: ${out.summary.drags} drags and ${out.summary.selections} edge selections on ${out.summary.pages} fresh page(s), 0 «Maximum update depth» and 0 CanvasErrorBoundary fallbacks`, out.summary.drags >= DRAGS && out.crashes.length === 0, { crashes: out.summary.crashAt });
    if (!NOPATCH) check(`${key}: React nested update depth at most 3 on every gesture`, Math.max(0, ...rows.map((r) => r.rd)) <= 3, Math.max(0, ...rows.map((r) => r.rd)));
    if (out.crashes.length) meas(`${key} crashes`, out.crashes.map((c: any) => ({ at: `p${c.page} ${c.kind} rep ${c.rep}`, rd: c.rd, component: c.component })));
    check(`${key}: no other page error`, out.pages.every((p: any) => !p.errors?.length), out.pages.map((p: any) => p.errors));
    save();
}

// ── Part 2: DemoESM, the demo's ten presses with the run's events hidden ──────────────────────────────────────────
const CONFIGURE = (mmId: string, m1Id: string) => String.raw`(async () => {
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
  const profile = PR.systemProfile('extendedStateMachine');
  const bindings = RS.profileBindings(profile, SK.sketchOfMetamodel(lookup, mm), bag);
  const boundBag = RS.boundProposalInputs(profile, bag, bindings) ? RS.boundProposalBag(profile, bag, bindings) : null;
  const largest = boundBag ? MK.boundEstimate(lookup, mm, boundBag) : null;
  const classIds = all().filter((d) => d.className === 'DClass' && !d.abstract).map((d) => d.id);
  const res = RS.profilePatch(profile, bag, bindings, lookup, classIds, largest);
  if (res.kind !== 'write') return { error: 'profile refused' };
  L(mm).state = res.patch;
  await new Promise((r) => setTimeout(r, 300));
  L(m1).state = { simStateAttributes: C.encodeStateAttributes([
    { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
    { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: '', equation: 'model.[coins] >= 2' },
  ]) };
  await new Promise((r) => setTimeout(r, 300));
  return { patch: Object.keys(res.patch).sort() };
})()`;
const PANE = (m1Id: string) => `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1Id}"]'))`;
const CLICK = (expr: string) => `(() => { const el = ${expr}; if (!el) return false; el.click(); return true; })()`;
const STATUS = (m1Id: string) => `(() => { const pane = ${PANE(m1Id)}; if (!pane) return null; return [...pane.querySelectorAll('.sim-panel__status-line')].map((e) => (e.getAttribute('title') || e.textContent || '').trim()); })()`;
const PRESSES = ['push', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'coin', 'coin', 'coin'];
const LAST = 'coin: tc (locked → locked) halted the run';

const moved = (a: Record<string, [number, number]>, b: Record<string, [number, number]>) =>
    Object.keys(a).filter((k) => b[k] && Math.hypot(a[k][0] - b[k][0], a[k][1] - b[k][1]) > 0.5).map((k) => `${k} ${a[k]} -> ${b[k]}`);

if (PARTS.includes('sim')) for (const mode of ['default', 'statechart']) {
    const key = `esm/${mode}`;
    const { ctx, page, errors } = await newPage(browser);
    const allErrors: string[] = [];
    page.on('pageerror', (e) => allErrors.push(e.message.slice(0, 300)));
    const out: any = {};
    result.sim[mode] = out;
    try {
        const { project, models } = await importScene(page, FILES.esm.file);
        check(`${key}: imported`, !!project && models.length >= 2, { project });
        if (!project) continue;
        await setTheme(page, 'light');
        const mm = models.find((m) => m.meta)!.id, m1 = models.find((m) => !m.meta)!.id;
        out.configure = await page.evaluate(CONFIGURE(mm, m1));
        await wait(page, 1200);
        if (mode === 'statechart') {
            const d = await derive(page, mm, 'extendedStateMachine', 'statechart');
            check(`${key}: derived`, !!d.vp, d);
            await activate(page, d.vp);
        }
        await openModel(page, m1);
        await fit(page, m1);
        if (mode === 'statechart') {
            out.layout = await clickLayout(page, m1);
            await fit(page, m1);
            await wait(page, 1200);
        }
        out.edgesBefore = await edgeState(page, m1);
        out.handlesBefore = await handlesOf(page, m1);
        meas(`${key} before Reset`, { layout: out.layout ?? null, edges: out.edgesBefore?.edges, routed: out.edgesBefore?.routed, pinned: out.edgesBefore?.pinned, handles: Object.keys(out.handlesBefore.handles).length });
        await page.locator(paneSel(m1)).first().screenshot({ path: `${CROPS}/ehl_${TAG}_esm_${mode}_before.png` });
        out.panel = await page.evaluate(CLICK(`${PANE(m1)} && ${PANE(m1)}.querySelector('.sim-panel__chip')`));
        await wait(page, 1500);
        out.reset = await page.evaluate(CLICK(`${PANE(m1)} && ${PANE(m1)}.querySelector('button.sim-panel__btn[title="Reset"]')`));
        await wait(page, 1500);
        out.lines = [{ step: 'Reset', status: await page.evaluate(STATUS(m1)) }];
        out.duringReset = await edgeState(page, m1);
        for (const [i, ev] of PRESSES.entries()) {
            const ok = await page.evaluate(CLICK(`${PANE(m1)} && [...${PANE(m1)}.querySelectorAll('button.sim-panel__event')].find((b) => (b.querySelector('span') || b).textContent.trim() === ${JSON.stringify(ev)})`));
            await wait(page, 600);
            out.lines.push({ step: `${i + 1} ${ev}`, pressed: ok, status: await page.evaluate(STATUS(m1)) });
        }
        out.edgesRun = await edgeState(page, m1);
        out.handlesRun = await handlesOf(page, m1);
        await page.locator(paneSel(m1)).first().screenshot({ path: `${CROPS}/ehl_${TAG}_esm_${mode}_running.png` });
        out.stop = await page.evaluate(CLICK(`${PANE(m1)} && ${PANE(m1)}.querySelector('button.sim-panel__btn[title="Stop"]')`));
        await wait(page, 1500);
        out.edgesStop = await edgeState(page, m1);
        out.handlesStop = await handlesOf(page, m1);
        const last = out.lines[out.lines.length - 1].status as string[] | null;
        check(`${key}: the ten presses reach the script's last step`, out.lines.slice(1).every((l: any) => l.pressed) && !!last && last.some((t) => t.includes(LAST)), last);
        // The derived Statechart already hides the event nodes (an event is not drawn there): the run adds none, so the
        // control with signal is the default viewpoint's.
        const grows = mode === 'default' ? out.handlesRun.hiddenNodes > out.handlesBefore.hiddenNodes : out.handlesRun.hiddenNodes >= out.handlesBefore.hiddenNodes;
        check(`${key}: the run hides event nodes (control${mode === 'default' ? '' : ': already hidden here'}), and Stop restores the hidden set`, grows && out.handlesStop.hiddenNodes === out.handlesBefore.hiddenNodes, { before: out.handlesBefore.hiddenNodes, running: out.handlesRun.hiddenNodes, stopped: out.handlesStop.hiddenNodes });
        const keep = (p: Record<string, unknown> | undefined, q: Record<string, unknown> | undefined) => JSON.stringify(p ?? {}) === JSON.stringify(q ?? {});
        check(`${key}: the pins of every edge unchanged by the run and by Stop`, keep(out.edgesBefore?.pins, out.edgesRun?.pins) && keep(out.edgesBefore?.pins, out.edgesStop?.pins), { before: out.edgesBefore?.pinned, running: out.edgesRun?.pinned, stopped: out.edgesStop?.pinned });
        const mRun = moved(out.handlesBefore.handles, out.handlesRun.handles), mStop = moved(out.handlesBefore.handles, out.handlesStop.handles);
        check(`${key}: the connected handles of the nodes the run keeps do not move during the run nor after Stop (0.5 px)`, mRun.length === 0 && mStop.length === 0, { running: mRun.slice(0, 6), stopped: mStop.slice(0, 6) });
        check(`${key}: no page error`, allErrors.length === 0 && errors.length === 0, allErrors.slice(0, 3));
        meas(`${key} panel lines`, out.lines.map((l: any) => [l.step, l.status]));
    } catch (e: any) {
        check(`${key}: ran`, false, String(e?.message ?? e).slice(0, 300));
    } finally {
        out.pageErrors = allErrors;
        save();
        await ctx.close();
    }
}

save();
await browser.close();
meas('out', OUT);
console.log(`RESULT ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
