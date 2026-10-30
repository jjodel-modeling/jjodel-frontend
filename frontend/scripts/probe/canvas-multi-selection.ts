/**
 * canvas-multi-selection probe (P-2026-10-24-0155, slice S3b of R-JJD-3). Read-only on sources: it writes only to the
 * throwaway browser profile and to the lane folder. Report: docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md
 * (Q4, «Dependencies and risks»: shift-click survival against `selectElement` is not measured).
 *
 * Question: on a model with at least three nodes, click node A, then shift-click B, then shift-click C. After each
 * step, what does React Flow report as selected (the `.selected` class of the pane's nodes), what does the D-layer
 * report (`isSelected` of each vertex) and what is `_lastSelected`? Does `selectElement` (run by `onNodeClick` on
 * every click, shift or not) collapse React Flow's shift selection?
 *
 * Every step also records the `JjodelEvents.CANVAS_SELECTION_CHANGED` payloads received since the previous step, so
 * the same run shows the event for one, two and three selected nodes once EditorV2 publishes it (empty before).
 *
 * Fixture: scene_1_DemoPEST.jjodel (OED_SCENES dir, as object-edge-delete.ts); the M1 if its pane shows three nodes,
 * otherwise the M2. Real app, own dev server (never 3000, 3001, 3003), 1600x1000, advanced mode.
 *
 * Run:  PROBE_URL=http://localhost:<port>/ ~/.local/bin/node frontend/scripts/probe/canvas-multi-selection.ts
 * Env:  CMS_SCENES  directory of the scene exports (default ~/jjodel-demo-exports)
 *       CMS_OUT     JSON output (default ~/.jjodel-lanes/P-2026-10-24-0155/probe_canvas_multi_selection.json)
 *
 * Exit code: number of failed checks.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3012/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3003');
const SCENES_DIR = process.env.CMS_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const OUT = process.env.CMS_OUT || `${process.env.HOME}/.jjodel-lanes/P-2026-10-24-0155/probe_canvas_multi_selection.json`;

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`); };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 3000)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const paneSel = (m: string) => `[id="${m}"].dock-tabpane-active`;

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

/** The pane's top-level visible nodes: id and the point clicked (the node's header strip, clear of inner fields). */
async function paneNodes(page: Page, m: string): Promise<Array<{ id: string; x: number; y: number }>> {
    return page.evaluate((sel: string) => {
        const pane = document.querySelector(sel);
        if (!pane) return [];
        return [...pane.querySelectorAll('.react-flow__node')].map((n) => {
            const r = (n as HTMLElement).getBoundingClientRect();
            return { id: n.getAttribute('data-id') || '', x: r.left + r.width / 2, y: r.top + Math.min(10, r.height / 2), w: r.width, h: r.height, top: r.top, vis: r.width > 20 && r.height > 20 && r.top > 0 && r.left > 0 && r.bottom < innerHeight && r.right < innerWidth };
        }).filter((n) => n.id && n.vis);
    }, paneSel(m));
}

async function snapshot(page: Page, m: string, ids: string[]) {
    return page.evaluate(([sel, nodeIds]: [string, string[]]) => {
        const w = window as any;
        const s = w.windoww.store.getState();
        const pane = document.querySelector(sel);
        const rf = pane ? [...pane.querySelectorAll('.react-flow__node.selected')].map((n) => n.getAttribute('data-id')) : null;
        const events = (w.__cmsEvents || []).splice(0);
        return {
            rfSelected: rf,
            dSelected: nodeIds.filter((id) => { const d = s.idlookup[id]; return !!d && !!d.isSelected && Object.values(d.isSelected).some(Boolean); }),
            dIsSelected: nodeIds.map((id) => s.idlookup[id]?.isSelected ?? null),
            lastSelected: s._lastSelected,
            events,
        };
    }, [paneSel(m), ids] as [string, string[]]);
}

mkdirSync(OUT.replace(/\/[^/]*$/, ''), { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await seed(ctx, true);
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
const result: any = { url: URL };

const { project, models } = await importScene(page, 'scene_1_DemoPEST.jjodel');
check('imported', !!project && models.length >= 2, { project, models: models.map((m) => m.name) });
await page.evaluate(async () => {
    const reg = await import('/src/events/registry.ts' as any);
    const w = window as any;
    w.__cmsEvents = [];
    const name = reg.JjodelEvents.CANVAS_SELECTION_CHANGED;
    w.__cmsEventName = name ?? null;
    if (name) window.addEventListener(name, (e: Event) => w.__cmsEvents.push((e as CustomEvent).detail));
});
meas('event name', await page.evaluate(() => (window as any).__cmsEventName));

let target = '';
let nodes: Array<{ id: string; x: number; y: number }> = [];
for (const m of [...models.filter((x) => !x.meta), ...models.filter((x) => x.meta)]) {
    await openModel(page, m.id);
    nodes = await paneNodes(page, m.id);
    meas(`pane ${m.name}`, { meta: m.meta, visibleNodes: nodes.length });
    if (nodes.length >= 3) { target = m.id; result.model = m; break; }
}
check('a model with three visible nodes', !!target, { target });

if (target) {
    // Pick three nodes far enough apart that a header click lands on the node itself.
    const [a, b, c] = nodes.slice(0, 3);
    const ids = [a.id, b.id, c.id];
    result.nodes = ids;
    await page.mouse.click(5, 5).catch(() => {});
    await page.evaluate(() => { (window as any).__cmsEvents = []; });
    const steps: Array<[string, { x: number; y: number }, boolean]> = [['click A', a, false], ['shift-click B', b, true], ['shift-click C', c, true]];
    result.steps = [];
    for (const [label, n, shift] of steps) {
        if (shift) await page.keyboard.down('Shift');
        await page.mouse.click(n.x, n.y);
        if (shift) await page.keyboard.up('Shift');
        await wait(page, 300);
        const early = await snapshot(page, target, ids);
        await wait(page, 2500);
        const late = await snapshot(page, target, ids);
        result.steps.push({ label, early, late });
        meas(label, { rfEarly: early.rfSelected, rfLate: late.rfSelected, dLate: late.dSelected, dIsSelected: late.dIsSelected, lastSelected: late.lastSelected, events: [...early.events, ...late.events] });
    }
    if (result.steps.some((s: any) => s.early.events.length + s.late.events.length > 0) || (await page.evaluate(() => (window as any).__cmsEventName))) {
        const payloads = result.steps.map((s: any) => [...s.early.events, ...s.late.events]);
        const last = (p: any[]) => p[p.length - 1];
        check('event: one emission per step', payloads.every((p: any[]) => p.length === 1), payloads.map((p: any[]) => p.length));
        check('event: nodeIds in click order for 1, 2, 3', JSON.stringify(payloads.map((p: any[]) => last(p)?.nodeIds)) === JSON.stringify([[a.id], [a.id, b.id], [a.id, b.id, c.id]]), payloads.map((p: any[]) => last(p)?.nodeIds));
        check('event: elementIds end with _lastSelected.modelElement', payloads.every((p: any[], i: number) => { const e = last(p)?.elementIds || []; return e.length === i + 1 && e[i] === result.steps[i].late.lastSelected?.modelElement; }), payloads.map((p: any[]) => last(p)?.elementIds));
    }
    const [s1, s2, s3] = result.steps;
    check('click A: React Flow selects A', JSON.stringify(s1.late.rfSelected) === JSON.stringify([a.id]), s1.late.rfSelected);
    meas('shift selection survives selectElement', { afterB: s2.late.rfSelected, afterC: s3.late.rfSelected });
    check('shift-click C: React Flow keeps A, B, C', [a.id, b.id, c.id].every((id) => (s3.late.rfSelected || []).includes(id)), s3.late.rfSelected);
    check('_lastSelected.node is the last clicked', s3.late.lastSelected?.node === c.id, s3.late.lastSelected);
}
meas('page errors', errors.slice(0, 5));
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(`OUT ${OUT}`);
await ctx.close();
await browser.close();
process.exit(failures);
