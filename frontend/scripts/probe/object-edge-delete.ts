/**
 * object-edge-delete probe (P-2026-10-04-0130): an object rendered as an edge (an M1 Transition of DemoESM)
 * deleted from its context menu and with the Delete key.
 *
 * Drives the real app on its own dev server (never 3001), 1600x1000, light. For each of the four demo exports,
 * in a fresh context: import, open the M1 in the default viewpoint and dump its pane before any action (names,
 * boxes, edge paths, labels: the trunk comparison). On DemoESM it then derives the statechart notation through
 * the dialog's calls, activates it, and on the synthetic edges (`irobj_<objectId>`):
 *   1. right-clicks a transition and reads the menu labels from the DOM (crop of the menu);
 *   2. clicks the menu's delete entry, counts the synthetic edges and the DObjects of the transition metaclass,
 *      and the undo stack, at once and after two syncs (3 s), and the problems registry of the M1;
 *   3. Cmd+Z, recounts, and checks the transition back with its endpoints and its label;
 *   4. selects another transition with a click, presses Delete, recounts at once and after two syncs;
 *   5. with a waypoint set on a third transition (the session store SegmentHandles writes), right-clicks it and
 *      reads the menu again: «Reset routing» present, and after a click the waypoints gone.
 * Every page error and console error is listed.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/object-edge-delete.ts --port 3084 --id P-2026-10-04-0130
 * Env:  OED_SCENES  directory of the exports (default ~/jjodel-demo-exports)
 *       OED_TAG     label of the run (default before): file names and the expectations, `after` asserts the fix
 *       OED_OUT     JSON output (default ~/.jjodel-lanes/P-2026-10-04-0130/probe_<tag>.json)
 *       OED_CROPS   crop directory (default ~/.jjodel-lanes/P-2026-10-04-0130/crops)
 *       OED_ONLY    comma list of scene keys (pest, petri, esm, flowB; default all): the mutation bench runs esm alone
 *       OED_COMPARE <before.json>,<after.json>: the four default panes compared (PASS when identical)
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { seed, setTheme } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3084/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3003');
const LANE = `${process.env.HOME}/.jjodel-lanes/P-2026-10-04-0130`;
const SCENES_DIR = process.env.OED_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const TAG = process.env.OED_TAG || 'before';
const AFTER = TAG.startsWith('after');
const OUT = process.env.OED_OUT || `${LANE}/probe_${TAG}.json`;
const CROPS = (process.env.OED_CROPS || `${LANE}/crops`).replace(/\/$/, '');

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`); if (ok) pass++; else fail++; };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 4000)}`);

const SCENES = [
    { key: 'pest', file: 'scene_1_DemoPEST.jjodel' },
    { key: 'petri', file: 'scene_2_DemoPetri.jjodel' },
    { key: 'esm', file: 'scene_3_DemoESM.jjodel' },
    { key: 'flowB', file: 'scene_4_DemoFlowB.jjodel' },
].filter((s) => !process.env.OED_ONLY || process.env.OED_ONLY.split(',').includes(s.key));

const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const paneSel = (m1: string) => `[id="${m1}"].dock-tabpane-active`;

// ── Scene setup (the calls of petri-ink-ports.ts, P-2026-10-03-1920) ─────────────────────────────────

async function importScene(page: Page, file: string): Promise<{ project: string | null; models: Array<{ id: string; name: string; meta: boolean }> }> {
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
    if (!project) return { project, models: [] };
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
        const out: Record<string, unknown> = { simProfile: prof };
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

/** The React Flow store of the pane (the fiber walk of petri-ink-ports.ts `fit`), fitted to its visible nodes. */
async function fit(page: Page, m1: string) {
    await page.evaluate(async (sel: string) => {
        const pane = document.querySelector(sel);
        const rf = pane?.querySelector('.react-flow');
        const key = rf && Object.keys(rf).find((k) => k.startsWith('__reactFiber$'));
        let f = key && (rf as any)[key]; let store: any = null;
        for (let i = 0; f && i < 80; i++, f = f.return) {
            const v = f.memoizedProps && f.memoizedProps.value;
            if (v && typeof v.getState === 'function' && typeof v.getState().triggerNodeChanges === 'function') { store = v; break; }
        }
        if (!store) return;
        const s = store.getState();
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const n of s.nodes) {
            if (n.hidden) continue;
            const il = s.nodeLookup.get(n.id);
            const p = il?.internals?.positionAbsolute ?? n.position;
            const w = n.measured?.width ?? n.width ?? 0, h = n.measured?.height ?? n.height ?? 0;
            x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + w); y1 = Math.max(y1, p.y + h);
        }
        if (!Number.isFinite(x0) || !s.panZoom) return;
        const pad = 70;
        const zoom = Math.min(1, s.width / (x1 - x0 + 2 * pad), s.height / (y1 - y0 + 2 * pad));
        await s.panZoom.setViewport({ x: s.width / 2 - ((x0 + x1) / 2) * zoom, y: s.height / 2 - ((y0 + y1) / 2) * zoom, zoom });
    }, paneSel(m1));
    await wait(page, 700);
}

/** The default pane by names and geometry, no ids (an import may renumber them). */
async function defaultDump(page: Page, m1: string) {
    return page.evaluate((sel: string) => {
        const pane = document.querySelector(sel);
        if (!pane) return null;
        const rf = pane.querySelector('.react-flow')!.getBoundingClientRect();
        const r1 = (v: number) => Math.round(v * 10) / 10;
        const nodes = [...pane.querySelectorAll('.react-flow__node')].map((n) => {
            const r = n.getBoundingClientRect();
            return [(n as HTMLElement).innerText.replace(/\s+/g, ' ').trim(), r1(r.left - rf.left), r1(r.top - rf.top), r1(r.width), r1(r.height)];
        }).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        const edges = [...pane.querySelectorAll('.react-flow__edge path')].map((p) => (p.getAttribute('d') ?? '').replace(/-?\d+\.\d+/g, (x) => String(Math.round(Number(x) * 10) / 10)))
            .filter(Boolean).sort();
        const labels = [...pane.querySelectorAll('.react-flow__edgelabel-renderer *')].filter((e) => e.children.length === 0)
            .map((e) => (e as HTMLElement).innerText?.trim()).filter(Boolean).sort();
        return { nodes, edges, labels };
    }, paneSel(m1));
}

// ── ESM: the synthetic edges, the model, the menu ─────────────────────────────────────────────────────

/** Synthetic edges of the pane (React Flow store) with their DOM label, the transition DObjects, the undo stack. */
async function census(page: Page, m1: string, metaclassId: string | null) {
    return page.evaluate(async ([sel, meta, model]: (string | null)[]) => {
        const pane = document.querySelector(sel as string);
        const rf = pane?.querySelector('.react-flow');
        const key = rf && Object.keys(rf).find((k) => k.startsWith('__reactFiber$'));
        let f = key && (rf as any)[key]; let store: any = null;
        for (let i = 0; f && i < 80; i++, f = f.return) {
            const v = f.memoizedProps && f.memoizedProps.value;
            if (v && typeof v.getState === 'function' && typeof v.getState().triggerNodeChanges === 'function') { store = v; break; }
        }
        const w = window as any;
        const st = w.windoww.store.getState();
        const L = st.idlookup;
        const nameOf = (vertexId: string) => L[L[vertexId]?.model]?.name ?? null;
        const edges = (store?.getState().edges ?? []).filter((e: any) => e.id.startsWith('irobj_')).map((e: any) => ({
            id: e.id, objectId: e.data?.irObjectId, source: nameOf(e.source), target: nameOf(e.target),
            selected: !!e.selected, waypoints: (e.data?.waypoints ?? []).length,
            dom: !!pane?.querySelector(`.react-flow__edge[data-id="${e.id}"]`),
            vertex: (store?.getState().nodes ?? []).some((n: any) => n.hidden && L[n.id]?.model === e.data?.irObjectId),
        }));
        const objects = Object.values(L).filter((d: any) => d?.className === 'DObject' && (!meta || d.instanceof === meta))
            .map((d: any) => {
                const slots: Record<string, unknown> = {};
                for (const fid of d.features ?? []) { const s = L[fid]; const fname = L[s?.instanceof]?.name; if (fname) slots[fname] = (s.values ?? []).map((v: any) => L[v]?.name ?? v); }
                return { id: d.id, name: d.name, slots };
            });
        const load = (x: string): Promise<any> => import(x);
        const reg: any = await load('/src/components/editor-v2/problems/registry.ts');
        const problems: Record<string, number> = {};
        for (const k of ['duplicate-name', 'conformance', 'validation', 'classifier-kind', 'simulation']) problems[k] = reg.getProblemIdsOwnedBy(k, model).length;
        const j: any = await load('/src/joiner/index.ts');
        const undo = w.statehistory?.[j.DUser.current]?.undoable?.length ?? null;   // a module singleton on window (store.tsx)
        const labels = [...(pane?.querySelectorAll('.react-flow__edgelabel-renderer *') ?? [])].filter((e) => e.children.length === 0)
            .map((e) => (e as HTMLElement).innerText?.trim()).filter(Boolean).sort();
        return { edges, objects, problems, undo, labels, rfEdges: store?.getState().edges.length ?? null };
    }, [paneSel(m1), metaclassId, m1]);
}

/** A client point on the edge's own path where the edge is the topmost element (a label may cover the middle). */
async function edgePoint(page: Page, m1: string, edgeId: string): Promise<{ x: number; y: number } | null> {
    return page.evaluate(([sel, id]: string[]) => {
        const pane = document.querySelector(sel);
        const g = pane?.querySelector(`.react-flow__edge[data-id="${id}"]`);
        if (!g) return null;
        const paths = [...g.querySelectorAll('path')] as SVGPathElement[];
        for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.25, 0.75]) {
            for (const path of paths) {
                const len = path.getTotalLength();
                if (!len) continue;
                const p = path.getPointAtLength(len * t);
                const m = path.getScreenCTM();
                if (!m) continue;
                const x = m.a * p.x + m.c * p.y + m.e, y = m.b * p.x + m.d * p.y + m.f;
                const top = document.elementFromPoint(x, y);
                if (top && top.closest('.react-flow__edge')?.getAttribute('data-id') === id) return { x, y };
            }
        }
        return null;
    }, [paneSel(m1), edgeId]);
}

async function menuItems(page: Page) {
    return page.evaluate(() => [...document.querySelectorAll('.context-menu .context-menu__item, .context-menu .context-menu__header')].map((e) => ({
        label: (e as HTMLElement).innerText.trim(),
        danger: e.classList.contains('danger'),
        disabled: e.classList.contains('disabled'),
        icon: e.querySelector('i')?.className ?? null,
    })));
}

async function cropMenu(page: Page, at: { x: number; y: number }, name: string) {
    const clip = await page.evaluate(([x, y]: number[]) => {
        // The open menu: the last `.context-menu` holding items (another, empty one may sit at the origin).
        const m = [...document.querySelectorAll('.context-menu')].filter((e) => e.querySelector('.context-menu__item')).pop()?.getBoundingClientRect();
        const x0 = Math.min(x, m?.left ?? x) - 160, y0 = Math.min(y, m?.top ?? y) - 120;
        const x1 = Math.max(x, m?.right ?? x) + 60, y1 = Math.max(y, m?.bottom ?? y) + 60;
        return { x: Math.max(0, x0), y: Math.max(0, y0), width: Math.min(1600, x1) - Math.max(0, x0), height: Math.min(1000, y1) - Math.max(0, y0) };
    }, [at.x, at.y]);
    const file = `${CROPS}/${name}.png`;
    await page.screenshot({ path: file, clip });
    return file;
}

async function clickMenu(page: Page, startsWith: string): Promise<string | null> {
    const hit = await page.evaluate((p: string) => {
        const el = [...document.querySelectorAll('.context-menu .context-menu__item')].find((e) => (e as HTMLElement).innerText.trim().startsWith(p));
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: (el as HTMLElement).innerText.trim() };
    }, startsWith);
    if (!hit) return null;
    await page.mouse.click(hit.x, hit.y);
    return hit.label;
}

const closeMenu = async (page: Page) => { await page.keyboard.press('Escape'); await page.evaluate(() => (document.querySelector('.context-menu-backdrop') as HTMLElement | null)?.click()); await wait(page, 300); };

// ── Compare: OED_COMPARE=<before.json>,<after.json> ───────────────────────────────────────────────────
if (process.env.OED_COMPARE) {
    const [b, a] = process.env.OED_COMPARE.split(',').map((f) => JSON.parse(readFileSync(f, 'utf8')));
    for (const key of Object.keys(b.scenes ?? {})) {
        const x = JSON.stringify(b.scenes[key]?.defaultPane ?? null), y = JSON.stringify(a.scenes?.[key]?.defaultPane ?? null);
        check(`${key}: the default pane identical before and after`, x !== 'null' && x === y, x === y ? 'identical' : { before: x.slice(0, 600), after: y.slice(0, 600) });
    }
    console.log(`RESULT ${pass}/${pass + fail}`);
    process.exit(fail ? 1 : 0);
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────────────

mkdirSync(CROPS, { recursive: true });
mkdirSync(OUT.replace(/\/[^/]*$/, ''), { recursive: true });
const browser = await chromium.launch();
const result: any = { url: URL, tag: TAG, scenes: {}, esm: {} };
for (const sc of SCENES) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
    await seed(ctx, true);
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
    const { project, models } = await importScene(page, sc.file);
    check(`${sc.key}: imported`, !!project && models.length >= 2, { project, models: models.map((m) => m.name) });
    if (!project) { await ctx.close(); continue; }
    await setTheme(page, 'light');
    const mm = models.find((m) => m.meta)!.id;
    const m1 = models.find((m) => !m.meta)!.id;
    await openModel(page, m1);
    await fit(page, m1);
    result.scenes[sc.key] = { defaultPane: await defaultDump(page, m1) };
    meas(`${sc.key} default pane`, { nodes: result.scenes[sc.key].defaultPane?.nodes.length, edges: result.scenes[sc.key].defaultPane?.edges.length, labels: result.scenes[sc.key].defaultPane?.labels.length });

    if (sc.key === 'esm') {
        const out: any = result.esm;
        const d = await derive(page, mm, 'stateMachine', 'statechart');
        check('esm: statechart derived', !!d.vp, d);
        await activate(page, d.vp);
        await fit(page, m1);
        let c = await census(page, m1, null);
        const first = c.edges[0];
        const metaclassId = first ? await page.evaluate((o: string) => (window as any).windoww.store.getState().idlookup[o]?.instanceof ?? null, first.objectId) : null;
        const metaclassName = metaclassId ? await page.evaluate((x: string) => (window as any).windoww.store.getState().idlookup[x]?.name ?? null, metaclassId) : null;
        c = await census(page, m1, metaclassId);
        out.metaclass = metaclassName;
        out.start = c;
        meas('esm start', { metaclassName, edges: c.edges.map((e: any) => `${e.source}->${e.target}`), objects: c.objects.map((o: any) => o.name), problems: c.problems, undo: c.undo, labels: c.labels });
        check('esm: transitions rendered as synthetic edges', c.edges.length >= 3 && c.edges.every((e: any) => e.dom), c.edges.length);
        const n0 = c.edges.length, o0 = c.objects.length;

        // 1-2. Right-click, read the menu, click its delete entry.
        const t1 = c.edges[0];
        const t1obj = c.objects.find((o: any) => o.id === t1.objectId);
        const p1 = await edgePoint(page, m1, t1.id);
        check('esm: a hit point on the first transition', !!p1, p1);
        if (p1) {
            await page.mouse.click(p1.x, p1.y, { button: 'right' });
            await wait(page, 500);
            const items = await menuItems(page);
            out.menu = items;
            meas('esm menu on a transition', items);
            await cropMenu(page, p1, `oed_${TAG}_menu`);
            if (AFTER) {
                check('esm: the menu offers «Delete <metaclass>», danger, trash icon', items.some((i) => i.label === `Delete ${metaclassName}` && i.danger && /bi-trash/.test(i.icon ?? '')), items);
                check('esm: no «Convert to Inheritance», «Delete reference», «Create edge view»', !items.some((i) => /Convert to|Delete reference|Create edge view/.test(i.label)), items.map((i) => i.label));
            }
            const clicked = await clickMenu(page, 'Delete');
            out.clicked = clicked;
            await wait(page, 300);
            const now = await census(page, m1, metaclassId);
            await wait(page, 3000);
            const later = await census(page, m1, metaclassId);
            out.afterMenuDelete = { now, later };
            meas('esm after the menu delete', { clicked, now: { edges: now.edges.length, objects: now.objects.length, undo: now.undo, problems: now.problems }, later: { edges: later.edges.length, objects: later.objects.length, undo: later.undo, problems: later.problems }, gone: !later.objects.some((o: any) => o.id === t1.objectId) });
            if (AFTER) {
                check('esm: menu delete removes the DObject and its edge', now.objects.length === o0 - 1 && now.edges.length === n0 - 1 && !now.edges.some((e: any) => e.id === t1.id), { o0, n0, objects: now.objects.length, edges: now.edges.length });
                check('esm: after two syncs the edge does not come back', later.objects.length === o0 - 1 && later.edges.length === n0 - 1 && !later.edges.some((e: any) => e.id === t1.id), { objects: later.objects.length, edges: later.edges.length });
            } else {
                check('esm (before): the DObject survives «Delete reference»', later.objects.some((o: any) => o.id === t1.objectId), { objects: later.objects.length, o0 });
            }

            // 3. Cmd+Z: the transition back with its endpoints and its label.
            await page.evaluate(() => (document.querySelector('.editor-v2') as HTMLElement | null)?.focus());
            await page.keyboard.press('Meta+z');
            await wait(page, 3000);
            let undone = await census(page, m1, metaclassId);
            let presses = 1;
            if (!undone.objects.some((o: any) => o.id === t1.objectId) && AFTER) {
                // Not back after one: a second press, measured and reported (the check below stays on one).
                await page.keyboard.press('Meta+z');
                await wait(page, 3000);
                const second = await census(page, m1, metaclassId);
                meas('esm after a second Cmd+Z', { edges: second.edges.length, objects: second.objects.length, undo: second.undo, back: second.objects.some((o: any) => o.id === t1.objectId) });
                out.afterSecondUndo = second;
                presses = 2;
                undone = second;
            }
            out.afterUndo = undone;
            out.undoPresses = presses;
            const back = undone.edges.find((e: any) => e.objectId === t1.objectId);
            const backObj = undone.objects.find((o: any) => o.id === t1.objectId);
            meas('esm after Cmd+Z', { edges: undone.edges.length, objects: undone.objects.length, undo: undone.undo, back, backObj, labels: undone.labels });
            if (AFTER) {
                check('esm: one Cmd+Z restores the transition with its endpoints', presses === 1 && !!back && back.source === t1.source && back.target === t1.target && undone.edges.length === n0 && undone.objects.length === o0, { presses, back, t1 });
                check('esm: the restored transition keeps its slots and label', !!backObj && JSON.stringify(backObj.slots) === JSON.stringify(t1obj?.slots) && JSON.stringify(undone.labels) === JSON.stringify(c.labels), { backObj, t1obj, labels: [c.labels, undone.labels] });
            }
        }

        // 4. Select another transition with a click, press Delete.
        let c2 = await census(page, m1, metaclassId);
        const t2 = c2.edges.find((e: any) => e.objectId !== t1.objectId);
        const p2 = t2 ? await edgePoint(page, m1, t2.id) : null;
        check('esm: a hit point on a second transition', !!p2, { t2: t2?.id, p2 });
        if (t2 && p2) {
            await page.mouse.click(p2.x, p2.y);
            await wait(page, 500);
            c2 = await census(page, m1, metaclassId);
            meas('esm second transition selected', c2.edges.find((e: any) => e.id === t2.id));
            const n2 = c2.edges.length, o2 = c2.objects.length;
            await page.keyboard.press('Delete');
            await wait(page, 300);
            const now = await census(page, m1, metaclassId);
            await wait(page, 3000);
            const later = await census(page, m1, metaclassId);
            out.afterKeyDelete = { now, later };
            meas('esm after the Delete key', { now: { edges: now.edges.length, objects: now.objects.length, undo: now.undo }, later: { edges: later.edges.length, objects: later.objects.length, undo: later.undo }, gone: !later.objects.some((o: any) => o.id === t2.objectId) });
            if (AFTER) {
                check('esm: the Delete key removes the selected transition', later.objects.length === o2 - 1 && later.edges.length === n2 - 1 && !later.objects.some((o: any) => o.id === t2.objectId), { o2, n2, objects: later.objects.length, edges: later.edges.length });
            } else {
                check('esm (before): the DObject survives the Delete key', later.objects.some((o: any) => o.id === t2.objectId), { objects: later.objects.length, o2 });
            }
        }

        // 5. «Reset routing» on a transition with waypoints (the session store SegmentHandles writes).
        const c3 = await census(page, m1, metaclassId);
        const t3 = c3.edges.find((e: any) => e.objectId !== t1.objectId && e.objectId !== t2?.objectId) ?? c3.edges[0];
        if (t3) {
            await page.evaluate(async (o: string) => {
                const load = (x: string): Promise<any> => import(x);
                const m: any = await load('/src/components/editor-v2/viewpoint/ir/irEdgeInteraction.ts');
                m.setIREdgeAnchorOverride(o, { waypoints: [{ segmentIndex: 1, offset: 24 }] });
            }, t3.objectId);
            await wait(page, 800);
            const withWp = (await census(page, m1, metaclassId)).edges.find((e: any) => e.id === t3.id);
            const p3 = await edgePoint(page, m1, t3.id);
            if (p3) {
                await page.mouse.click(p3.x, p3.y, { button: 'right' });
                await wait(page, 500);
                const items = await menuItems(page);
                out.menuWithWaypoints = items;
                meas('esm menu on a transition with waypoints', { waypoints: withWp?.waypoints, items });
                await cropMenu(page, p3, `oed_${TAG}_menu_waypoints`);
                if (AFTER) {
                    check('esm: «Reset routing» offered on a transition with waypoints', items.some((i) => i.label === 'Reset routing'), items.map((i) => i.label));
                    const clicked = await clickMenu(page, 'Reset routing');
                    await wait(page, 800);
                    const reset = (await census(page, m1, metaclassId)).edges.find((e: any) => e.id === t3.id);
                    check('esm: «Reset routing» drops the waypoints', !!clicked && (withWp?.waypoints ?? 0) > 0 && reset?.waypoints === 0, { before: withWp?.waypoints, after: reset?.waypoints });
                } else {
                    await closeMenu(page);
                }
            }
        }
        out.errors = errors.slice();
    }
    meas(`${sc.key} errors`, errors);
    result.scenes[sc.key].errors = errors;
    await ctx.close();
}
await browser.close();
writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(`OUT ${OUT}`);
console.log(`RESULT ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
