/**
 * gv-f2-f3 probe (P-2026-10-21-1926; extended by P-2026-10-21-1950): F2, user views read-only after a page load;
 * F3, a click on a palette entry.
 *
 * Drives the real app on its own dev server (never 3000, 3001, 3003, 3080), 1600x1000, one fresh browser context:
 *   1. dashboard, New Project, the project opened from its card (GVF_OPEN=card, default) or by
 *      navigating to its URL from the dashboard (GVF_OPEN=url, the 2026-10-11 path)        -> facts `opened`
 *   2. «Create Your First Metamodel», one Class dragged from the M2 palette, then a CLICK on
 *      the same palette entry: the DClass count before and 3 s after the click             -> `f3.m2Click`
 *   3. a viewpoint from the left bar «New viewpoint», one view for the class in it
 *      (createViewInWorkbench, the tree's «Add view»)                                       -> facts `authored`
 *   4. Save, then page.reload() on the project URL                                         -> facts `reload`
 *   5. a page load on the dashboard, then the project URL in the same page (in-page open)  -> facts `reopen`
 * Facts: the seeded viewpoint in idlookup and in Defaults.defaultViewPointsMap, the ids the map holds as objects,
 * and Defaults.check (the read-only gate of ViewData.tsx:58) on the user viewpoint and the user view, and on every
 * built-in `Pointer_View*` record.
 * Step 2 also measures (P-2026-10-21-1950): the clicked class's vertex against the canvas centre in flow coordinates
 * (the drop centres a 140x40 node on its point), Enter and Space on the focused entry, and a click on a member entry.
 *
 * GVF_SCENE=bpmn: the BPMN lanes scene of bpmn-lanes-fixture.ts, M1 palette. A click on a rootable class with the
 * canvas centre on bare pane, a click on Task there (non-rootable: nothing), then the pane panned so the centre falls
 * inside Warehouse and a click on Task: one Task in Process.flowElements and in Warehouse.flowNodeRefs.
 * GVF_SCENE=hull: Region (graphVertex, composition `states`) and State. Region on bare pane creates a root, State there
 * nothing; with the centre on an empty point inside region1, State is created in region1.states. The BPMN lanes hold
 * their children by reference (flowNodeRefs), so the M1 palette does not offer Task there (measured): this scene is the
 * palette-driven container check.
 * GVF_SCENE=demo: the four MODELS demo fixtures, each imported on the dashboard and opened in-page (hash navigation);
 * Defaults.check on their user viewpoints and views, and on the built-in ones. Read-only: nothing is edited.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/gv-f2-f3.ts --port 3192 --id P-2026-10-21-1926
 * Env:  GVF_TAG  label of the run (default head); GVF_OUT JSON output (default ~/.jjodel-lanes/<GVF_LANE>/)
 *       GVF_OPEN card | url (default card); GVF_SCENE main | bpmn | hull | demo (default main)
 *       GVF_LANE lane folder (default P-2026-10-21-1950)
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { seed, BOOT_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3192/').replace(/\/$/, '');
if (/:(3000|3001|3003|3080)$/.test(URL)) throw new Error('never 3000, 3001, 3003, 3080');
const LANE = `${process.env.HOME}/.jjodel-lanes/${process.env.GVF_LANE || 'P-2026-10-21-1950'}`;
const OPEN = process.env.GVF_OPEN === 'url' ? 'url' : 'card';
const SCENE = ['bpmn', 'hull', 'demo'].includes(process.env.GVF_SCENE ?? '') ? process.env.GVF_SCENE as string : 'main';
const TAG = (process.env.GVF_TAG || 'head') + '-' + (SCENE === 'main' ? OPEN : SCENE);
const OUT = process.env.GVF_OUT || `${LANE}/probe_${TAG}.json`;
const SHOTS = `${LANE}/shots/${TAG}`;
const HIDE = '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }';

const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 3000)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

async function facts(page: Page, ids: { vp?: string | null; view?: string | null }) {
    return page.evaluate(async (u) => {
        const s = (window as any).store.getState();
        const L = s.idlookup;
        const D = (await import('/src/common/Defaults.ts' as string) as any).Defaults;
        const objIds = (m: any) => Object.keys(m).filter((k) => typeof m[k] === 'object' && m[k]);
        const userVps = Object.values(L).filter((d: any) => d?.className === 'DViewPoint' && !String(d.id).startsWith('Pointer_View')) as any[];
        const userViews = Object.values(L).filter((d: any) => d?.className === 'DViewElement' && !String(d.id).startsWith('Pointer_View')) as any[];
        return {
            seededVpInIdlookup: typeof L[D.Pointer_ViewPointDefault],
            seededVpInMap: typeof D.defaultViewPointsMap[D.Pointer_ViewPointDefault],
            mapVpObjects: objIds(D.defaultViewPointsMap),
            mapViewObjects: objIds(D.defaultViewsMap).length,
            debug: !!s.debug,
            userVp: u.vp ? { inIdlookup: !!L[u.vp], check: D.check(u.vp) } : null,
            userView: u.view ? { inIdlookup: !!L[u.view], check: D.check(u.view) } : null,
            allUserVpsChecked: userVps.map((v) => `${v.name}:${D.check(v.id)}`),
            allUserViewsChecked: userViews.map((v) => `${v.name}:${D.check(v.id)}`),
            userCheckedTrue: [...userVps, ...userViews].filter((v) => D.check(v.id)).length,
            systemViews: Object.values(L).filter((d: any) => /^DView(Point|Element)$/.test(d?.className) && String(d.id).startsWith('Pointer_View')).length,
            systemCheckedFalse: (Object.values(L).filter((d: any) => /^DView(Point|Element)$/.test(d?.className) && String(d.id).startsWith('Pointer_View')) as any[])
                .filter((d) => !D.check(d.id)).map((d) => d.id),
        };
    }, ids);
}

const countClasses = (page: Page) => page.evaluate(() =>
    Object.values((window as any).store.getState().idlookup).filter((d: any) => d?.className === 'DClass' && /^NewClass/.test(d.name)).length);

const ACTIVE = '.dock-tabpane-active';

/** The centre of the visible canvas (.editor-v2__canvas) in client and in flow coordinates, from the viewport transform. */
async function canvasGeom(page: Page) {
    return page.evaluate((root) => {
        const c = document.querySelector(`${root} .editor-v2__canvas`) as HTMLElement | null;
        const rf = c?.querySelector('.react-flow') as HTMLElement | null;
        const vp = rf?.querySelector('.react-flow__viewport') as HTMLElement | null;
        if (!c || !rf || !vp) return null;
        const cr = c.getBoundingClientRect();
        const rr = rf.getBoundingClientRect();
        const m = vp.style.transform.match(/translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)\s*scale\(\s*([\d.]+)\s*\)/);
        const vx = m ? +m[1] : 0; const vy = m ? +m[2] : 0; const z = m ? +m[3] : 1;
        const cx = cr.left + cr.width / 2; const cy = cr.top + cr.height / 2;
        return { client: { x: cx, y: cy }, flow: { x: (cx - rr.left - vx) / z, y: (cy - rr.top - vy) / z }, rf: { left: rr.left, top: rr.top }, vp: { x: vx, y: vy, z } };
    }, ACTIVE);
}

/** The vertex drawing an element, and its node's flow position (style.transform) and size. */
async function vertexOf(page: Page, elementId: string) {
    return page.evaluate(([root, id]) => {
        const idl = (window as any).store.getState().idlookup;
        const vid = Object.keys(idl).find((k) => idl[k]?.model === id && /Vertex/.test(idl[k]?.className ?? ''));
        const el = vid ? document.querySelector(`${root} .react-flow__node[data-id="${vid}"]`) as HTMLElement | null : null;
        const m = el?.style.transform.match(/translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
        return { vid: vid ?? null, x: m ? +m[1] : null, y: m ? +m[2] : null, w: el?.offsetWidth ?? null, h: el?.offsetHeight ?? null };
    }, [ACTIVE, elementId] as const);
}

/** Distance of a node, created centred on the canvas centre with the drop's default size, from that centre. */
const offCentre = (v: { x: number | null; y: number | null }, flow: { x: number; y: number }, w = 140, h = 40) =>
    v.x === null || v.y === null ? null : { dx: +(v.x + w / 2 - flow.x).toFixed(2), dy: +(v.y + h / 2 - flow.y).toFixed(2) };

const idsOf = (page: Page, cls: string, nameRe?: string) => page.evaluate(([c, re]) =>
    Object.values((window as any).store.getState().idlookup).filter((d: any) => d?.className === c && (!re || new RegExp(re).test(d.name))).map((d: any) => d.id as string), [cls, nameRe ?? ''] as const);

/** A palette entry of the visible editor by its label. */
const paletteItem = (page: Page, label: string) =>
    page.locator(`${ACTIVE} .editor-v2-palette .palette-item, ${ACTIVE} .editor-v2-palette .palette-instances__item`).filter({ has: page.getByText(label, { exact: true }) }).first();

/** Pans the pane with left-button drags from empty pane until the canvas centre sits on targetClient. */
const panCentreTo = async (page: Page, target: { x: number; y: number }) => {
    for (let i = 0; i < 6; i++) {
        const g = await canvasGeom(page);
        if (!g) return;
        const ddx = g.client.x - target.x; const ddy = g.client.y - target.y;
        if (Math.abs(ddx) < 1 && Math.abs(ddy) < 1) return;
        // The largest share of the delta (all, half, a quarter) with a start on empty pane and an end in the window.
        let pick: { x: number; y: number; dx: number; dy: number } | null = null;
        for (const share of [1, 0.5, 0.25]) {
            const dx = ddx * share; const dy = ddy * share;
            const start = await page.evaluate(([root, mx, my]) => {
                const c = document.querySelector(`${root} .editor-v2__canvas`)!.getBoundingClientRect();
                for (let y = c.top + 30; y < c.bottom - 30; y += 25) for (let x = c.left + 30; x < c.right - 30; x += 25) {
                    const ex = x + (mx as number); const ey = y + (my as number);
                    if (ex < 5 || ey < 5 || ex > innerWidth - 5 || ey > innerHeight - 5) continue;
                    const el = document.elementFromPoint(x, y) as HTMLElement | null;
                    if (el && el.classList.contains('react-flow__pane')) return { x, y };
                }
                return null;
            }, [ACTIVE, dx, dy] as const);
            if (start) { pick = { ...start, dx, dy }; break; }
        }
        if (!pick) return;
        await page.mouse.move(pick.x, pick.y);
        await page.mouse.down();
        for (let k = 1; k <= 12; k++) await page.mouse.move(pick.x + pick.dx * k / 12, pick.y + pick.dy * k / 12);
        await page.mouse.up();
        await wait(page, 800);
        // The pan moved the content, and the target with it.
        target = { x: target.x + pick.dx, y: target.y + pick.dy };
    }
};
const hitAtCentre = async (page: Page) => page.evaluate((root) => {
    const c = document.querySelector(`${root} .editor-v2__canvas`)!.getBoundingClientRect();
    const el = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2) as HTMLElement | null;
    return { pane: !!el?.classList.contains('react-flow__pane'), node: (el?.closest('.react-flow__node') as HTMLElement | null)?.dataset.id ?? null };
}, ACTIVE);


async function main() {
    mkdirSync(SHOTS, { recursive: true });
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await seed(ctx, true);
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 300)));
    const out: Record<string, unknown> = { url: URL, tag: TAG, open: OPEN };

    // 1. New project, opened from its card or by its URL.
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, BOOT_MS + 3000);
    await page.locator('button', { hasText: /New Project/i }).first().click();
    await wait(page, 1200);
    const name = `GVF_${TAG}_${Date.now()}`;
    await page.locator('input[type="text"]').first().fill(name);
    await page.locator('button', { hasText: /^\s*\+?\s*Create/ }).last().click();
    await wait(page, 5000);
    const pid = await page.evaluate(() => { const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length ? a[a.length - 1].id : null; });
    const card = page.getByText(name, { exact: true });
    if (OPEN === 'card' && await card.count()) await card.first().click(); else await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
    await wait(page, 9000);
    await page.addStyleTag({ content: HIDE }).catch(() => {});
    out.opened = await facts(page, {});
    meas('opened', out.opened);

    // 2. Metamodel, one class by drag, then a click on the palette entry (F3).
    await page.locator('button', { hasText: 'Create Your First Metamodel' }).first().click();
    await wait(page, 9000);
    const m2pane = page.locator('.dock-tabpane-active .editor-v2__canvas .react-flow__pane').first();
    const entry = page.getByText('Class', { exact: true }).first();
    await entry.dragTo(m2pane, { targetPosition: { x: 260, y: 220 } });
    await wait(page, 2500);
    const afterDrag = await countClasses(page);
    await entry.click();
    await wait(page, 3000);
    const afterClick = await countClasses(page);
    out.f3 = { m2Drag: afterDrag, m2ClickBefore: afterDrag, m2ClickAfter: afterClick, clickCreated: afterClick - afterDrag };
    meas('f3', out.f3);
    // The clicked class against the canvas centre; then Enter and Space on the focused entry; then a member entry.
    const geom = await canvasGeom(page);
    const classIds = await idsOf(page, 'DClass', '^NewClass');
    const clicked = classIds.length > afterDrag ? classIds[classIds.length - 1] : null;
    const cv = clicked ? await vertexOf(page, clicked) : null;
    const item = paletteItem(page, 'Class');
    await page.mouse.click(5, 5);
    await item.focus().catch(() => {});
    const focused = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.textContent?.trim().slice(0, 60) ?? null);
    await page.keyboard.press('Enter');
    await wait(page, 2500);
    const afterEnter = await countClasses(page);
    await page.mouse.click(5, 5);
    await item.focus().catch(() => {});
    await page.keyboard.press(' ');
    await wait(page, 2500);
    const afterSpace = await countClasses(page);
    const attrs0 = (await idsOf(page, 'DAttribute')).length;
    await paletteItem(page, 'Attribute').click({ timeout: 5000 }).catch((e) => meas('memberClickError', String(e).slice(0, 200)));
    await wait(page, 2000);
    out.f3m2 = {
        geom, clicked, vertex: cv, offCentre: cv && geom ? offCentre(cv, geom.flow) : null, focused,
        enterCreated: afterEnter - afterClick, spaceCreated: afterSpace - afterEnter,
        memberClick: { attributes: (await idsOf(page, 'DAttribute')).length - attrs0, classes: (await countClasses(page)) - afterSpace },
    };
    meas('f3m2', out.f3m2);
    await page.screenshot({ path: `${SHOTS}/01_m2_after_click.png` });

    // 3. A viewpoint from the left bar, one view for the class in it.
    const vpsBefore = await page.evaluate(() => Object.values((window as any).store.getState().idlookup).filter((d: any) => d?.className === 'DViewPoint').map((d: any) => d.id));
    await page.locator('.appbar-tab__name, button, span').filter({ hasText: /^\s*GVF_/ }).first().click();
    await wait(page, 3000);
    const nv = page.locator(':text-is("New viewpoint"):visible').first();
    out.newViewpointButton = (await nv.count()) > 0;
    if (out.newViewpointButton) {
        await nv.click();
        await wait(page, 1500);
        await page.locator('input[placeholder*="Custom Syntax"]').first().fill('VP_F2');
        await page.locator('button', { hasText: 'Create Viewpoint' }).first().click();
        await wait(page, 4000);
    }
    const vpId: string | null = await page.evaluate((b) => {
        const v = Object.values((window as any).store.getState().idlookup).find((d: any) => d?.className === 'DViewPoint' && !b.includes(d.id)) as any;
        return v?.id ?? null;
    }, vpsBefore);
    const viewId: string | null = vpId ? await page.evaluate(async (vp) => {
        const w = window as any;
        const lv: any = await import('/src/utils/lastViewpoint.ts' as string);
        const k = w.LProject.getProject().metamodels[0].packages[0].classes[0];
        const id = lv.createViewInWorkbench(k.id, k.name, 'DClass', vp);
        await new Promise((r) => setTimeout(r, 800));
        return id;
    }, vpId) : null;
    out.ids = { pid, vpId, viewId };
    out.authored = await facts(page, { vp: vpId, view: viewId });
    meas('authored', out.authored);

    // 4. Save, then a page load on the project URL.
    await page.locator('button', { hasText: /^\s*Save\s*$/ }).first().click();
    await wait(page, 3000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await wait(page, BOOT_MS + 9000);
    out.reload = await facts(page, { vp: vpId, view: viewId });
    meas('reload', out.reload);

    // 5. A page load on the dashboard, then the project URL in the same page (no page load: hash navigation).
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await wait(page, BOOT_MS + 3000);
    out.dashboard = await facts(page, {});
    meas('dashboard', out.dashboard);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
    await wait(page, 9000);
    out.reopen = await facts(page, { vp: vpId, view: viewId });
    meas('reopen', out.reopen);
    await page.screenshot({ path: `${SHOTS}/02_reopen.png` });

    out.errors = errors;
    meas('pageErrors', errors.length);
    writeFileSync(OUT, JSON.stringify(out, null, 2));
    console.log(`OUT ${OUT}`);
    await browser.close();
}

/** GVF_SCENE=bpmn: the M1 palette click on the BPMN lanes scene. */
async function sceneBpmn() {
    mkdirSync(SHOTS, { recursive: true });
    process.env.GV_OUT = process.env.GV_OUT || SHOTS;
    process.env.GV_TAG = process.env.GV_TAG || TAG;
    const fx = await import('./bpmn-lanes-fixture.ts');
    const browser = await chromium.launch();
    const out: Record<string, unknown> = { url: URL, tag: TAG, scene: 'bpmn' };
    const built = await fx.buildBpmnScene(browser, 'gvf3');
    if (!built) { out.error = 'scene not built'; writeFileSync(OUT, JSON.stringify(out, null, 2)); await browser.close(); process.exit(1); }
    const { page, errors, ids } = built;
    await page.addStyleTag({ content: HIDE }).catch(() => {});
    const items = await page.locator(`${ACTIVE} .editor-v2-palette .palette-instances__item`).allTextContents();
    out.paletteItems = items.map((t) => t.trim());
    const mm = await page.evaluate(() => (window as any).LProject.getProject().metamodels[0].packages[0].classes.map((c: any) => ({ id: c.id, name: c.name })));
    const clsId = (n: string) => mm.find((c: any) => c.name === n)?.id as string;
    const objectsOf = (cls: string) => page.evaluate((cid) => Object.values((window as any).store.getState().idlookup)
        .filter((d: any) => d?.className === 'DObject' && d.instanceof === cid).map((d: any) => d.id as string), clsId(cls));

    // 1. Bare centre: flow point (-500, 300), left of every object of the scene.
    let g = await canvasGeom(page);
    if (g) await panCentreTo(page, { x: g.rf.left + g.vp.x + -500 * g.vp.z, y: g.rf.top + g.vp.y + 300 * g.vp.z });
    const bareHit = await hitAtCentre(page);
    const root = ['Collaboration', 'Process'].find((n) => out.paletteItems && (out.paletteItems as string[]).includes(n)) ?? null;
    const root0 = root ? await objectsOf(root) : [];
    if (root) await paletteItem(page, root).click();
    await wait(page, 2500);
    g = await canvasGeom(page);
    const rootNew = root ? (await objectsOf(root)).filter((x) => !root0.includes(x)) : [];
    const rv = rootNew.length === 1 ? await vertexOf(page, rootNew[0]) : null;
    out.rootBare = { hit: bareHit, cls: root, created: rootNew.length, vertex: rv, offCentre: rv && g ? offCentre(rv, g.flow) : null };
    meas('rootBare', out.rootBare);
    const tasks0 = await objectsOf('Task');
    if ((out.paletteItems as string[]).includes('Task')) await paletteItem(page, 'Task').click();
    await wait(page, 2500);
    out.taskBare = { created: (await objectsOf('Task')).length - tasks0.length };
    meas('taskBare', out.taskBare);
    await page.screenshot({ path: `${SHOTS}/01_bpmn_bare.png` });

    // 2. Centre inside Warehouse (60% of its width, mid height, as the S3-8 palette drop), then a click on Task.
    await page.mouse.click(5, 5);
    const wb = await page.locator(`${ACTIVE} .react-flow__node[data-id="${ids.warehouse.vertex}"]`).first().boundingBox();
    if (wb) await panCentreTo(page, { x: wb.x + wb.width * 0.6, y: wb.y + wb.height * 0.5 });
    const laneHit = await hitAtCentre(page);
    const tasks1 = await objectsOf('Task');
    if ((out.paletteItems as string[]).includes('Task')) await paletteItem(page, 'Task').click();
    await wait(page, 3000);
    const newTasks = (await objectsOf('Task')).filter((x) => !tasks1.includes(x));
    const fe = await fx.slotIds(page, ids, 'shopProc', 'flowElements');
    const wh = await fx.slotIds(page, ids, 'warehouse', 'flowNodeRefs');
    out.taskInLane = { taskOffered: (out.paletteItems as string[]).includes('Task'), hit: laneHit, warehouseVertex: ids.warehouse.vertex, created: newTasks.length,
        inFlowElements: newTasks.length === 1 && fe.includes(newTasks[0]), inWarehouse: newTasks.length === 1 && wh.includes(newTasks[0]) };
    meas('taskInLane', out.taskInLane);
    await page.screenshot({ path: `${SHOTS}/02_bpmn_lane.png` });
    out.errors = errors.slice(0, 20);
    meas('pageErrors', errors.length);
    writeFileSync(OUT, JSON.stringify(out, null, 2));
    console.log(`OUT ${OUT}`);
    await browser.close();
}

/** GVF_SCENE=hull: Region (graphVertex, composition `states`) and State; the M1 palette click into a container. */
async function sceneHull() {
    mkdirSync(SHOTS, { recursive: true });
    process.env.GV_OUT = process.env.GV_OUT || SHOTS;
    process.env.GV_TAG = process.env.GV_TAG || TAG;
    const fx = await import('./bpmn-lanes-fixture.ts');
    const browser = await chromium.launch();
    const out: Record<string, unknown> = { url: URL, tag: TAG, scene: 'hull' };
    const { page, errors } = await fx.openPage(browser);
    const pid = await fx.createProject(page, `GVF_hull_${TAG}_${Date.now()}`);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 7000);
    await page.addStyleTag({ content: HIDE }).catch(() => {});
    await fx.buildMetamodel(page, [['Named', true, []], ['Region', false, ['Named']], ['State', false, ['Named']]], [['Region', 'states', 'State', true, true]], 'Named');
    const shell = await fx.buildModelShell(page);
    if (!shell.graphId) { out.error = 'no graph'; writeFileSync(OUT, JSON.stringify(out, null, 2)); await browser.close(); process.exit(1); }
    const ids = await fx.buildObjects(page, shell.graphId, [
        ['r1', 'Region', 'region1', 100, 100, [420, 300]], ['a', 'State', 'A', 140, 180, null],
    ]);
    await fx.buildLinks(page, ids, [['r1', 'states', 'a']], []);
    const I = (prop: string) => ({ from: 'intrinsic', prop });
    await fx.buildViewpoint(page, 'Hulls', [
        ['Region', { kind: 'graphVertex', metaclasses: ['Region'], shape: { form: 'rect', labels: [{ position: 'top', source: I('name') }] }, containment: { collapsible: true } }],
        ['State', { kind: 'vertex', metaclasses: ['State'], shape: { form: 'rounded', labels: [{ position: 'center', source: I('name') }] } }],
    ]);
    await fx.pickViewpoint(page, 'Hulls');
    await wait(page, 3000);
    out.paletteItems = (await page.locator(`${ACTIVE} .editor-v2-palette .palette-instances__item`).allTextContents()).map((t) => t.trim());
    const statesOf = () => page.evaluate(() => Object.values((window as any).store.getState().idlookup)
        .filter((d: any) => d?.className === 'DObject' && (window as any).store.getState().idlookup[d.instanceof]?.name === 'State').map((d: any) => d.id as string));
    const regionsOf = () => page.evaluate(() => Object.values((window as any).store.getState().idlookup)
        .filter((d: any) => d?.className === 'DObject' && (window as any).store.getState().idlookup[d.instanceof]?.name === 'Region').map((d: any) => d.id as string));

    // 1. Bare centre (flow -600, 300): Region (rootable) creates one root; State (non-rootable) creates nothing.
    let g = await canvasGeom(page);
    if (g) await panCentreTo(page, { x: g.rf.left + g.vp.x + -600 * g.vp.z, y: g.rf.top + g.vp.y + 300 * g.vp.z });
    const bareHit = await hitAtCentre(page);
    const r0 = await regionsOf();
    await paletteItem(page, 'Region').click({ timeout: 5000 }).catch(() => {});
    await wait(page, 2500);
    g = await canvasGeom(page);
    const rNew = (await regionsOf()).filter((x) => !r0.includes(x));
    const rv = rNew.length === 1 ? await vertexOf(page, rNew[0]) : null;
    out.regionBare = { hit: bareHit, created: rNew.length, vertex: rv, offCentre: rv && g ? offCentre(rv, g.flow) : null };
    meas('regionBare', out.regionBare);
    await page.mouse.click(5, 5);
    const s0 = await statesOf();
    await paletteItem(page, 'State').click({ timeout: 5000 }).catch(() => {});
    await wait(page, 2500);
    out.stateBare = { offered: (out.paletteItems as string[]).includes('State'), created: (await statesOf()).length - s0.length };
    meas('stateBare', out.stateBare);

    // 2. Centre on region1's box at (75%, 80%), clear of A (the drop's container hit test is a bbox test over the nodes,
    // findIRDropContainerAt), then State: one State in region1.states.
    await page.mouse.click(5, 5);
    const r1 = (await fx.readNodes(page)).find((n) => n.id === ids.r1.vertex);
    g = await canvasGeom(page);
    const spot = r1 && g ? { x: g.rf.left + g.vp.x + (r1.x + r1.w * 0.75) * g.vp.z, y: g.rf.top + g.vp.y + (r1.y + r1.h * 0.8) * g.vp.z } : null;
    out.region1Box = r1 ? { x: r1.x, y: r1.y, w: r1.w, h: r1.h } : null;
    if (spot) await panCentreTo(page, spot);
    const inHit = await hitAtCentre(page);
    const centreFlow = (await canvasGeom(page))?.flow ?? null;
    const s1 = await statesOf();
    await paletteItem(page, 'State').click({ timeout: 5000 }).catch(() => {});
    await wait(page, 3000);
    const sNew = (await statesOf()).filter((x) => !s1.includes(x));
    const held = await fx.slotIds(page, ids, 'r1', 'states');
    out.stateInRegion = { hit: inHit, centreFlow, region: ids.r1.vertex, created: sNew.length, inRegionStates: sNew.length === 1 && held.includes(sNew[0]) };
    meas('stateInRegion', out.stateInRegion);
    await page.screenshot({ path: `${SHOTS}/01_hull_click.png` });
    out.errors = errors.slice(0, 20);
    meas('pageErrors', errors.length);
    writeFileSync(OUT, JSON.stringify(out, null, 2));
    console.log(`OUT ${OUT}`);
    await browser.close();
}

/** GVF_SCENE=demo: the four MODELS demo fixtures, imported and opened in-page; read-only. */
async function sceneDemo() {
    const browser = await chromium.launch();
    const out: Record<string, unknown> = { url: URL, tag: TAG, scene: 'demo' };
    const fixtures = ['scene_1_DemoPEST', 'scene_2_DemoPetri', 'scene_3_DemoESM', 'scene_4_DemoFlowB'];
    let total = 0;
    for (const name of fixtures) {
        const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
        await seed(ctx, true);
        await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message.slice(0, 300)));
        await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        await wait(page, BOOT_MS + 3000);
        const text = readFileSync(new globalThis.URL(`./fixtures/${name}.jjodel`, import.meta.url), 'utf8');
        const pid = await page.evaluate(`(async () => {
            const api = await import('/src/api/persistance/projects.ts');
            const n = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
            const before = n();
            await api.ProjectsApi.importFromText(${JSON.stringify(text)});
            for (let i = 0; i < 75 && n() <= before; i++) await new Promise(r => setTimeout(r, 200));
            const a = JSON.parse(localStorage.getItem('projects') || '[]');
            return a.length > before ? a[a.length - 1].id : null;
        })()`) as string | null;
        await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
        await wait(page, 9000);
        const f = await facts(page, {});
        const sameDocument = await page.evaluate(() => performance.getEntriesByType('navigation').length === 1);
        const r = { pid, sameDocument, userVps: f.allUserVpsChecked, userViews: f.allUserViewsChecked.length,
            userCheckedTrue: f.userCheckedTrue, systemViews: f.systemViews, systemCheckedFalse: f.systemCheckedFalse,
            mapVpObjects: f.mapVpObjects, pageErrors: errors.length };
        total += f.userCheckedTrue;
        out[name] = r;
        meas(name, r);
        await ctx.close();
    }
    out.userCheckedTrueTotal = total;
    meas('userCheckedTrueTotal', total);
    writeFileSync(OUT, JSON.stringify(out, null, 2));
    console.log(`OUT ${OUT}`);
    await browser.close();
}

(SCENE === 'bpmn' ? sceneBpmn() : SCENE === 'hull' ? sceneHull() : SCENE === 'demo' ? sceneDemo() : main()).catch((e) => { console.error('PROBE FAILED', e); process.exit(1); });
