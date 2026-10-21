/**
 * gv-f2-f3 probe (P-2026-10-21-1926): F2, user views read-only after a page load; F3, a click on a palette entry.
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
 * and Defaults.check (the read-only gate of ViewData.tsx:58) on the user viewpoint and the user view.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/gv-f2-f3.ts --port 3192 --id P-2026-10-21-1926
 * Env:  GVF_TAG  label of the run (default head); GVF_OUT JSON output (default ~/.jjodel-lanes/P-2026-10-21-1926/)
 *       GVF_OPEN card | url (default card)
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { seed, BOOT_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3192/').replace(/\/$/, '');
if (/:(3000|3001|3003|3080)$/.test(URL)) throw new Error('never 3000, 3001, 3003, 3080');
const LANE = `${process.env.HOME}/.jjodel-lanes/P-2026-10-21-1926`;
const OPEN = process.env.GVF_OPEN === 'url' ? 'url' : 'card';
const TAG = (process.env.GVF_TAG || 'head') + '-' + OPEN;
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
        };
    }, ids);
}

const countClasses = (page: Page) => page.evaluate(() =>
    Object.values((window as any).store.getState().idlookup).filter((d: any) => d?.className === 'DClass' && /^NewClass/.test(d.name)).length);

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

main().catch((e) => { console.error('PROBE FAILED', e); process.exit(1); });
