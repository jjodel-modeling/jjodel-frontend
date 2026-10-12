/**
 * new-model-instantiate probe (P-2026-10-11-1135): in a project created from the dashboard, a model of a fresh
 * metamodel with two concrete classes, and every way a user has to instantiate a metaclass.
 *
 * Drives the real app on its own dev server (never 3000, 3001, 3003, 3080), 1600x1000. Each scenario runs in a
 * fresh browser context, the way a user does it: New Project on the dashboard, the project opened (from its card,
 * or by a page load: NMI_SCENARIOS), «Create Your First Metamodel», two classes dragged from the M2 palette, the
 * model from the Models «+ New» of the project page. Then, on the model tab, one path at a time:
 *   palette-drag   a palette entry dragged on the canvas (HTML5 drag, `application/reactflow`)
 *   palette-click  a palette entry clicked
 *   dm-new         Data manager (toolbar picker), the class row, «+ New <Class>», the draft, «Create»
 *   dm-outline     Data manager outline, the model «+», «New <Class>»
 *   ctx-child      a containment reference added to the metamodel (L-API), right-click on an object, «Add …»
 *   uncontain      the containment switched off again with the model tab open, then a drag of its target class
 *   jjscript       Jjodie in JjScript mode: `create instance of <Class> "<name>"`
 * For each path: the DObjects created, right after and 3 s after; the console errors and page errors in
 * the window; the Redux action trail (store.dispatch wrapped, CompositeAction unfolded); a screenshot. The state
 * facts the prompt names as candidates (the default viewpoint pointer, the read-only views guard) are measured
 * once per scenario, before the paths.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/new-model-instantiate.ts --port 3091 --id P-2026-10-11-1135
 * Env:  NMI_TAG        label of the run (default head): file names
 *       NMI_SCENARIOS  comma list of adv-card, adv-reload, basic-reload, vp-card, vp-reload (default all five);
 *                      vp-* add a viewpoint from the left bar, one view per class, activated on the model
 *       NMI_PATHS      comma list of the paths above (default all)
 *       NMI_OUT        JSON output (default ~/.jjodel-lanes/P-2026-10-11-1135/probe_<tag>.json)
 *       NMI_SHOTS      screenshot directory (default ~/.jjodel-lanes/P-2026-10-11-1135/shots/<tag>)
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { seed, BOOT_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3091/').replace(/\/$/, '');
if (/:(3000|3001|3003|3080)$/.test(URL)) throw new Error('never 3000, 3001, 3003, 3080');
const LANE = `${process.env.HOME}/.jjodel-lanes/P-2026-10-11-1135`;
const TAG = process.env.NMI_TAG || 'head';
const OUT = process.env.NMI_OUT || `${LANE}/probe_${TAG}.json`;
const SHOTS = (process.env.NMI_SHOTS || `${LANE}/shots/${TAG}`).replace(/\/$/, '');
const SCENARIOS = (process.env.NMI_SCENARIOS || 'adv-card,adv-reload,basic-reload,vp-card,vp-reload').split(',');
// jjscript last: the Jjodie panel it opens stays over the canvas.
const PATHS = (process.env.NMI_PATHS || 'palette-drag,palette-click,dm-new,dm-outline,ctx-child,uncontain,jjscript').split(',');
const C1 = 'NewClass';
const C2 = 'NewClass1';

const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 3000)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

type Obj = { id: string; name: string; of: string | null; model: string | null };
type PathResult = {
    path: string; reached: boolean; note: string; created: Obj[]; createdLate: Obj[];
    errors: string[]; trail: string[]; shot: string;
};

// ── page instrumentation ─────────────────────────────────────────────────────────────────────────────

/** Wraps store.dispatch once: every action (CompositeAction unfolded) as `TYPE field @id` in window.__nmiTrail. */
async function armTrail(page: Page) {
    await page.evaluate(() => {
        const w = window as any;
        if (!w.store || w.__nmiArmed) return;
        w.__nmiArmed = true;
        w.__nmiTrail = [];
        const orig = w.store.dispatch;
        const one = (a: any): string => `${a?.type ?? '?'}${a?.field ? ' ' + a.field : ''}${a?.id ? ' @' + String(a.id).slice(-24) : ''}`;
        w.store.dispatch = (a: any) => {
            try {
                const sub = Array.isArray(a?.actions) ? a.actions.map(one) : [];
                w.__nmiTrail.push(sub.length ? `${one(a)} [${sub.slice(0, 12).join(', ')}${sub.length > 12 ? `, … +${sub.length - 12}` : ''}]` : one(a));
            } catch { /* never break the app */ }
            return orig(a);
        };
    });
}

const takeTrail = (page: Page) => page.evaluate(() => { const w = window as any; const t = w.__nmiTrail ?? []; w.__nmiTrail = []; return t as string[]; });

async function objects(page: Page): Promise<Obj[]> {
    return page.evaluate(() => {
        const L = (window as any).store.getState().idlookup;
        // Every DObject: the project has one model, and an object created outside it would be a finding too.
        return Object.values(L).filter((d: any) => d?.className === 'DObject')
            .map((d: any) => ({ id: d.id, name: d.name, of: L[d.instanceof]?.name ?? null, model: L[d.model]?.name ?? d.model ?? null }));
    });
}

/** The candidates of the prompt, measured: the default viewpoint pointer and the read-only views guard. */
async function stateFacts(page: Page, modelId: string | null) {
    return page.evaluate(async (m) => {
        const w = window as any;
        const s = w.store.getState();
        const L = s.idlookup;
        const load = (p: string): Promise<any> => import(p);
        const D = (await load('/src/common/Defaults.ts')).Defaults;
        const views = Object.values(L).filter((d: any) => d?.className === 'DViewElement') as any[];
        let rootable: string[] | string = 'n/a';
        try {
            const em = await load('/src/components/editor-v2/hooks/useEditorMode.ts');
            const info = em.getMetaclassInfo(m);
            rootable = (info?.rootableClasses ?? []).map((c: any) => c.name);
        } catch (e: any) { rootable = 'error: ' + e?.message; }
        const vm = (() => { const v = m ? L[m] : undefined; return v ? { instanceof: v.instanceof ?? null, isMetamodel: !!v.isMetamodel } : null; })();
        return {
            ptrDefaultInIdlookup: typeof L[D.Pointer_ViewPointDefault],
            ptrDefaultInDefaultsMap: typeof D.defaultViewPointsMap[D.Pointer_ViewPointDefault],
            stateViewpoints: s.viewpoints,
            stateViewpoint: s.viewpoint,
            viewsInIdlookup: views.length,
            viewsCheckedDefault: views.filter((v) => D.check(v.id)).length,
            defaultViewsMapSize: Object.keys(D.defaultViewsMap).length,
            interfaceMode: localStorage.getItem('jjodel.interfaceMode'),
            model: vm,
            rootable,
            graphs: (s.graphs || []).map((g: string) => L[g]).filter((g: any) => g?.model === m).map((g: any) => g.graphStyle || 'classic'),
        };
    }, modelId);
}

// ── setup: the user's way ────────────────────────────────────────────────────────────────────────────

async function setup(browser: Browser, scenario: string) {
    const advanced = !scenario.startsWith('basic');
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await seed(ctx, advanced);
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 400)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 400)); });
    const steps: Record<string, unknown> = {};

    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, BOOT_MS + 3000);
    await page.locator('button', { hasText: /New Project/i }).first().click();
    await wait(page, 1200);
    const name = `NMI_${scenario}_${TAG}_${Date.now()}`;
    await page.locator('input[type="text"]').first().fill(name);
    await page.locator('button', { hasText: /^\s*\+?\s*Create/ }).last().click();
    await wait(page, 5000);
    const pid = await page.evaluate(() => { const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length ? a[a.length - 1].id : null; });
    steps.project = pid;
    if (scenario === 'adv-card' || scenario === 'vp-card') {
        const card = page.getByText(name, { exact: true });
        if (await card.count()) await card.first().click(); else await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
    } else {
        await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
    }
    await wait(page, 9000);
    steps.openedBy = scenario.endsWith('-card') ? 'card' : 'page load';
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});

    await page.locator('button', { hasText: 'Create Your First Metamodel' }).first().click();
    await wait(page, 9000);
    const m2pane = page.locator('.dock-tabpane-active .editor-v2__canvas .react-flow__pane').first();
    for (const [x, y] of [[220, 200], [600, 200]]) {
        await page.getByText('Class', { exact: true }).first().dragTo(m2pane, { targetPosition: { x, y } });
        await wait(page, 2500);
    }
    steps.classes = await page.evaluate(() => {
        const L = (window as any).store.getState().idlookup;
        return Object.values(L).filter((d: any) => d?.className === 'DClass' && /^NewClass/.test(d.name)).map((d: any) => d.name);
    });

    await page.locator('.appbar-tab__name, button, span').filter({ hasText: /^\s*NMI_/ }).first().click();
    await wait(page, 4000);
    await page.locator('button', { hasText: /^\+ New$/ }).nth(1).click();
    await wait(page, 9000);
    const modelId = await page.evaluate(() => {
        const L = (window as any).store.getState().idlookup;
        const m = Object.values(L).find((d: any) => d?.className === 'DModel' && !d.isMetamodel) as any;
        return m?.id ?? null;
    });
    steps.model = modelId;

    if (scenario === 'adv-reload' || scenario === 'vp-reload') {
        // The persisted project: Save, a page load, then the model tab from the left bar.
        await page.locator('button', { hasText: /^\s*Save\s*$/ }).first().click();
        await wait(page, 3000);
        await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded' });
        await wait(page, BOOT_MS);
        await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
        await wait(page, 9000);
        await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
        const row = page.locator(':text-is("model_1"):visible').first();
        if (await row.count()) { await row.click(); await wait(page, 9000); }
        steps.reopened = await page.locator('.dock-tabpane-active .editor-v2-palette--m1').count();
    }
    if (scenario.startsWith('vp-')) steps.viewpoint = await viewpointStep(page);
    await page.screenshot({ path: `${SHOTS}/${scenario}_00_model.png` });
    return { ctx, page, errors, steps, modelId: modelId as string | null };
}

/**
 * The graphVertex tester's context: a viewpoint from the left bar «New viewpoint», one view per class in it
 * (createViewInWorkbench, the call of the tree's «Add view»), the viewpoint activated from the M1 toolbar picker.
 * Measures, for each view, Defaults.check (the read-only guard) right after creation.
 */
async function viewpointStep(page: Page) {
    const before = await page.evaluate(() => Object.values((window as any).store.getState().idlookup).filter((d: any) => d?.className === 'DViewPoint').map((d: any) => d.id));
    // The project tab: its left bar holds «New viewpoint».
    await page.locator('.appbar-tab__name, button, span').filter({ hasText: /^\s*NMI_/ }).first().click();
    await wait(page, 3000);
    const nv = page.locator(':text-is("New viewpoint"):visible').first();
    const clicked = (await nv.count()) > 0;
    if (clicked) {
        await nv.click();
        await wait(page, 1500);
        await page.locator('input[placeholder*="Custom Syntax"]').first().fill('VP_Test');
        await page.locator('button', { hasText: 'Create Viewpoint' }).first().click();
        await wait(page, 4000);
    }
    await page.screenshot({ path: `${SHOTS}/vp_after_new_viewpoint.png` });
    const vp = await page.evaluate((b) => {
        const L = (window as any).store.getState().idlookup;
        const v = Object.values(L).find((d: any) => d?.className === 'DViewPoint' && !b.includes(d.id)) as any;
        return v ? { id: v.id, name: v.name } : null;
    }, before);
    const backToModel = async () => {
        const t = page.locator('.appbar-tab__name').filter({ hasText: /^\s*model_1\s*$/ }).first();
        if (await t.count()) { await t.click(); await wait(page, 2500); }
    };
    if (!vp) { await backToModel(); return { clicked, vp: null }; }
    const views = await page.evaluate(async ([vpId, names]) => {
        const w = window as any;
        const lv: any = await import('/src/utils/lastViewpoint.ts' as string);
        const D = (await import('/src/common/Defaults.ts' as string) as any).Defaults;
        const pkg = w.LProject.getProject().metamodels[0].packages[0];
        const out: Array<Record<string, unknown>> = [];
        for (const n of names) {
            const k = pkg.classes.find((c: any) => c.name === n);
            const id = lv.createViewInWorkbench(k.id, k.name, 'DClass', vpId);
            await new Promise((r) => setTimeout(r, 600));
            out.push({ cls: n, id, inIdlookup: !!w.store.getState().idlookup[id], checkedDefault: D.check(id) });
        }
        return out;
    }, [vp.id, [C1, C2]] as [string, string[]]);
    await backToModel();
    await page.locator('.dock-tabpane-active .toolbar-viewpoint-trigger').first().click();
    await wait(page, 600);
    const opts = await page.locator('.toolbar-viewpoint-menu__option').allInnerTexts();
    const opt = page.locator('.toolbar-viewpoint-menu__option').filter({ hasText: vp.name }).first();
    let activated = false;
    if (await opt.count()) { await opt.click(); activated = true; await wait(page, 3000); } else await page.keyboard.press('Escape');
    const active = await page.evaluate(() => (window as any).store.getState().viewpoint);
    return { clicked, vp, views, picker: opts, activated, active };
}

// ── the paths ────────────────────────────────────────────────────────────────────────────────────────

async function runPath(page: Page, scenario: string, path: string, modelId: string | null, errors: string[], act: () => Promise<{ reached: boolean; note: string }>): Promise<PathResult> {
    const before = new Set((await objects(page)).map((o) => o.id));
    const errFrom = errors.length;
    await takeTrail(page);
    let r = { reached: false, note: '' };
    try { r = await act(); } catch (e: any) { r = { reached: false, note: 'threw: ' + String(e?.message ?? e).split('\n').slice(0, 4).join(' / ').slice(0, 400) }; }
    await wait(page, 600);
    const created = (await objects(page)).filter((o) => !before.has(o.id));
    await wait(page, 3000);
    const createdLate = (await objects(page)).filter((o) => !before.has(o.id));
    const trail = await takeTrail(page);
    const shot = `${SHOTS}/${scenario}_${path}.png`;
    await page.screenshot({ path: shot });
    const res: PathResult = { path, reached: r.reached, note: r.note, created, createdLate, errors: errors.slice(errFrom), trail, shot };
    console.log(`PATH  ${scenario}  ${path}  reached=${res.reached}  created=${created.length}/${createdLate.length}  ${created.map((o) => o.name + ':' + o.of).join(',')}  note=${res.note}  errors=${res.errors.length}`);
    for (const e of res.errors.slice(0, 6)) console.log(`      err  ${e}`);
    console.log(`      trail  ${trail.slice(0, 20).join(' | ')}${trail.length > 20 ? ` … +${trail.length - 20}` : ''}`);
    return res;
}

const paletteItem = (page: Page, cls: string) =>
    page.locator('.dock-tabpane-active .editor-v2-palette--m1 .palette-instances__item').filter({ hasText: new RegExp(`^\\s*${cls}\\s*$`) }).first();
const m1pane = (page: Page) => page.locator('.dock-tabpane-active .editor-v2__canvas .react-flow__pane').first();

const ACTS: Record<string, (page: Page) => Promise<{ reached: boolean; note: string }>> = {
    'palette-drag': async (page) => {
        const item = paletteItem(page, C1);
        const n = await page.locator('.dock-tabpane-active .editor-v2-palette--m1 .palette-instances__item').allInnerTexts();
        if (!(await item.count())) return { reached: false, note: `no palette entry ${C1}; palette: ${JSON.stringify(n)}; empty: ${await page.locator('.dock-tabpane-active .palette-empty').count()}` };
        await item.dragTo(m1pane(page), { targetPosition: { x: 300, y: 250 } });
        return { reached: true, note: `palette: ${JSON.stringify(n)}` };
    },
    'palette-click': async (page) => {
        const item = paletteItem(page, C2);
        if (!(await item.count())) return { reached: false, note: `no palette entry ${C2}` };
        await item.click();
        return { reached: true, note: 'clicked' };
    },
    'dm-new': async (page) => {
        await page.locator('.dock-tabpane-active .toolbar-viewpoint-trigger').first().click();
        await wait(page, 600);
        const opts = await page.locator('.toolbar-viewpoint-menu__option').allInnerTexts();
        const dm = page.locator('.toolbar-viewpoint-menu__option').filter({ hasText: 'Data manager' });
        if (!(await dm.count())) { await page.keyboard.press('Escape'); return { reached: false, note: `no Data manager option; picker: ${JSON.stringify(opts)}` }; }
        await dm.first().click();
        await wait(page, 4000);
        // By the exact name: a row's text joins its nodes, so «NewClass» with count 1 reads «NewClass1».
        const row = page.locator('.instance-manager__row', { has: page.getByText(C2, { exact: true }) }).first();
        if (!(await row.count())) return { reached: false, note: `no row ${C2}; rows: ${JSON.stringify(await page.locator('.instance-manager__row').allInnerTexts())}` };
        const rowDisabled = await row.getAttribute('aria-disabled');
        await row.click();
        await wait(page, 1000);
        const newBtn = page.locator('button', { hasText: new RegExp(`New ${C2}\\b`) }).first();
        if (!(await newBtn.count())) return { reached: false, note: `row aria-disabled=${rowDisabled}; no «New ${C2}» button; empty-state: ${JSON.stringify(await page.locator('.instance-manager__empty').allInnerTexts())}` };
        await newBtn.click();
        await wait(page, 1200);
        const commit = page.locator('button.instance-manager__draft-commit').first();
        if (!(await commit.count())) return { reached: false, note: 'no draft «Create»' };
        const disabled = await commit.isDisabled();
        if (disabled) return { reached: false, note: 'draft «Create» disabled' };
        await commit.click();
        return { reached: true, note: `row aria-disabled=${rowDisabled}` };
    },
    'dm-outline': async (page) => {
        // The outline is on by default: toggle it only when its panel is not there.
        if (!(await page.locator('.instance-manager__outline-name').count())) {
            const outline = page.locator('.instance-manager__view').filter({ hasText: 'Outline' }).first();
            if (!(await outline.count())) return { reached: false, note: 'no Outline toggle (Data manager not open?)' };
            await outline.click();
            await wait(page, 1200);
        }
        const add = page.locator('button.instance-manager__outline-add').first();
        if (!(await add.count())) return { reached: false, note: 'no outline «+»' };
        await add.click();
        await wait(page, 800);
        const items = await page.locator('.instance-manager__outline-menu-item').allInnerTexts();
        const it = page.locator('.instance-manager__outline-menu-item').filter({ hasText: `New ${C1}` }).first();
        if (!(await it.count())) return { reached: false, note: `outline menu: ${JSON.stringify(items)}` };
        await it.click();
        await wait(page, 1200);
        const commit = page.locator('button.instance-manager__draft-commit').first();
        if (await commit.count()) {
            if (await commit.isDisabled()) return { reached: false, note: 'draft «Create» disabled' };
            await commit.click();
        }
        return { reached: true, note: `outline menu: ${JSON.stringify(items)}` };
    },
    'uncontain': async (page) => {
        // The restrictive side of the same signature: the containment switched off while the model tab is open.
        // NewClass1 is a root again for the metamodel (getMetaclassInfo, recomputed per call); the palette and the
        // drop gate read the hook's memo. Then a drag of NewClass1 on the canvas.
        const tab = page.locator('.appbar-tab__name').filter({ hasText: /^\s*model_1\s*$/ }).first();
        if (await tab.count()) { await tab.click(); await wait(page, 1500); }
        const unset = await page.evaluate((a) => {
            const pkg = (window as any).LProject.getProject().metamodels[0].packages[0];
            const r = pkg.classes.find((c: any) => c.name === a).references.find((x: any) => x.composition);
            if (!r) return null;
            r.composition = false;
            return r.name;
        }, C1);
        if (!unset) return { reached: false, note: 'no containment reference to switch off (ctx-child not run?)' };
        await wait(page, 1500);
        const fresh = await page.evaluate(async () => {
            const L = (window as any).store.getState().idlookup;
            const m = (Object.values(L).find((d: any) => d?.className === 'DModel' && !d.isMetamodel) as any)?.id;
            const em: any = await import('/src/components/editor-v2/hooks/useEditorMode.ts' as string);
            return (em.getMetaclassInfo(m)?.rootableClasses ?? []).map((c: any) => c.name);
        });
        const palette = await page.locator('.dock-tabpane-active .editor-v2-palette--m1 .palette-instances__item').allInnerTexts();
        // A round trip through the metamodel tab: does the palette catch up when the user goes back?
        const mmTab = page.locator('.appbar-tab__name').filter({ hasText: /^\s*metamodel_1\s*$/ }).first();
        let afterTrip: string[] | string = 'no metamodel tab';
        if (await mmTab.count()) {
            await mmTab.click(); await wait(page, 1500);
            if (await tab.count()) { await tab.click(); await wait(page, 1500); }
            afterTrip = await page.locator('.dock-tabpane-active .editor-v2-palette--m1 .palette-instances__item').allInnerTexts();
        }
        const item = paletteItem(page, C2);
        if (!(await item.count())) return { reached: false, note: `reference ${unset} composition=false; metamodel rootable ${JSON.stringify(fresh)}; palette ${JSON.stringify(palette)}, after a tab round trip ${JSON.stringify(afterTrip)}: no ${C2} entry` };
        await item.dragTo(m1pane(page), { targetPosition: { x: 700, y: 520 } });
        return { reached: true, note: `reference ${unset} composition=false; metamodel rootable ${JSON.stringify(fresh)}; palette ${JSON.stringify(palette)}, after a tab round trip ${JSON.stringify(afterTrip)}` };
    },
    'jjscript': async (page) => {
        // Back to the canvas tab of the model, then Jjodie: the floating launcher, Cmd+J to JjScript, the command.
        const tab = page.locator('.appbar-tab__name').filter({ hasText: /^\s*model_1\s*$/ }).first();
        if (await tab.count()) { await tab.click(); await wait(page, 2000); }
        let input = page.locator('textarea.jodie-input').first();
        if (!(await input.isVisible().catch(() => false))) {
            const launcher = await page.evaluate(() => {
                const cand = [...document.querySelectorAll('[class*="jodie"], [class*="jjodie"]')]
                    .filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 20 && r.width < 120 && r.height > 20 && r.height < 120 && (cs.position === 'fixed' || cs.position === 'absolute') && cs.visibility !== 'hidden'; })
                    .map((e) => { const r = e.getBoundingClientRect(); return { cls: (e as HTMLElement).className, x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
                return cand[0] ?? null;
            });
            if (!launcher) return { reached: false, note: 'no Jjodie launcher found' };
            await page.mouse.click(launcher.x, launcher.y);
            await wait(page, 1500);
            input = page.locator('textarea.jodie-input').first();
            if (!(await input.isVisible().catch(() => false))) return { reached: false, note: `Jjodie input not visible after ${launcher.cls}` };
        }
        await input.click();
        for (let i = 0; i < 3; i++) {
            const prompt = await page.locator('.jodie-code-prompt').first().innerText().catch(() => '');
            if (prompt.startsWith('jjscript')) break;
            await page.keyboard.press('Meta+j');
            await wait(page, 500);
        }
        const prompt = await page.locator('.jodie-code-prompt').first().innerText().catch(() => '');
        if (!prompt.startsWith('jjscript')) return { reached: false, note: `console mode ${prompt}` };
        // C1: after ctx-child, C2 is a containment target and no longer a root.
        await input.fill(`create instance of ${C1} "viaScript"`);
        await page.keyboard.press('Enter');
        await wait(page, 2500);
        const last = await page.evaluate(() => {
            const msgs = [...document.querySelectorAll('[class*="jodie-message"], [class*="chat-message"]')];
            return msgs.slice(-2).map((m) => (m as HTMLElement).innerText.replace(/\s+/g, ' ').slice(0, 300));
        });
        await page.keyboard.press('Escape');
        await page.mouse.click(1000, 600);
        return { reached: true, note: `mode ${prompt}; reply: ${JSON.stringify(last)}` };
    },
    'ctx-child': async (page) => {
        // A containment reference NewClass.children: NewClass1, through the L-API, then the object's menu.
        const refName = await page.evaluate(([a, b]) => {
            const w = window as any;
            const pkg = w.LProject.getProject().metamodels[0].packages[0];
            const owner = pkg.classes.find((c: any) => c.name === a);
            const tgt = pkg.classes.find((c: any) => c.name === b);
            return owner.addReference('children', tgt.id)?.name ?? null;
        }, [C1, C2]);
        await wait(page, 800);
        const refSet = await page.evaluate(([a, n]) => {
            const w = window as any;
            const pkg = w.LProject.getProject().metamodels[0].packages[0];
            const r = pkg.classes.find((c: any) => c.name === a).references.find((x: any) => x.name === n);
            if (!r) return false;
            r.composition = true; r.upperBound = -1;
            return true;
        }, [C1, refName]);
        await wait(page, 1500);
        if (!refSet) return { reached: false, note: `containment reference not set (${refName})` };
        const refInfo = await page.evaluate(async ([a, n, m]) => {
            const w = window as any;
            const L = w.store.getState().idlookup;
            const d = Object.values(L).find((x: any) => x?.className === 'DReference' && x.name === n && L[x.father]?.name === a) as any;
            const em = await import('/src/components/editor-v2/hooks/useEditorMode.ts' as string);
            const info = (em as any).getMetaclassInfo(m);
            const mc = info?.allClasses?.find((c: any) => c.name === a);
            return { d: d ? { composition: d.composition, aggregation: d.aggregation, containment: d.containment, upperBound: d.upperBound } : null,
                editorMode: mc?.references?.map((r: any) => `${r.name}:${r.containment}:${r.targetClassName ?? r.targetClassId}`) ?? null,
                rootable: (info?.rootableClasses ?? []).map((c: any) => c.name) };
        }, [C1, refName, await page.evaluate(() => { const L = (window as any).store.getState().idlookup; return (Object.values(L).find((d: any) => d?.className === 'DModel' && !d.isMetamodel) as any)?.id; })]);
        const tab = page.locator('.appbar-tab__name').filter({ hasText: /^\s*model_1\s*$/ }).first();
        if (await tab.count()) { await tab.click(); await wait(page, 2500); }
        // The object palette-drag dropped at (300, 250): on screen, unlike the ones placed by the other paths.
        const node = page.locator('.dock-tabpane-active .react-flow__node').filter({ hasText: `${C1}_0` }).first();
        if (!(await node.count())) return { reached: false, note: `no ${C1}_0 node on the canvas` };
        await node.click({ button: 'right' });
        await wait(page, 800);
        const items = await page.locator('.context-menu__item:visible').allInnerTexts();
        const add = page.locator('.context-menu__item:visible').filter({ hasText: new RegExp(`Add ${C2}`) }).first();
        if (await add.count()) {
            await add.click();
            return { reached: true, note: `menu: ${JSON.stringify(items)}; ref: ${JSON.stringify(refInfo)}` };
        }
        // Escape does not close this menu: a click on the empty canvas does (top-left corner of the pane).
        await page.mouse.click(15, 120);
        await wait(page, 500);
        // The editor's metaclass signature (useEditorMode.ts) reads reference names, not the composition flag:
        // a rename re-derives it. The menu is read again after it.
        await page.evaluate(([a, n]) => {
            const pkg = (window as any).LProject.getProject().metamodels[0].packages[0];
            pkg.classes.find((c: any) => c.name === a).references.find((x: any) => x.name === n).name = 'kids';
        }, [C1, refName]);
        await wait(page, 1500);
        await node.click({ button: 'right' });
        await wait(page, 800);
        const items2 = await page.locator('.context-menu__item:visible').allInnerTexts();
        const add2 = page.locator('.context-menu__item:visible').filter({ hasText: new RegExp(`Add ${C2}`) }).first();
        if (!(await add2.count())) { await page.mouse.click(15, 120); return { reached: false, note: `menu: ${JSON.stringify(items)}; after rename: ${JSON.stringify(items2)}; ref: ${JSON.stringify(refInfo)}` }; }
        await add2.click();
        return { reached: true, note: `stale menu: ${JSON.stringify(items)}; after a rename of the reference: ${JSON.stringify(items2)}; ref: ${JSON.stringify(refInfo)}` };
    },
};

// ── main ─────────────────────────────────────────────────────────────────────────────────────────────

(async () => {
    mkdirSync(SHOTS, { recursive: true });
    const browser = await chromium.launch();
    const out: Record<string, unknown> = { tag: TAG, url: URL, at: new Date().toISOString(), scenarios: {} };
    for (const scenario of SCENARIOS) {
        const { ctx, page, errors, steps, modelId } = await setup(browser, scenario);
        meas(`${scenario}.setup`, steps);
        await armTrail(page);
        const facts = await stateFacts(page, modelId);
        meas(`${scenario}.facts`, facts);
        const paths: PathResult[] = [];
        for (const p of PATHS) if (ACTS[p]) paths.push(await runPath(page, scenario, p, modelId, errors, () => ACTS[p](page)));
        (out.scenarios as any)[scenario] = { steps, facts, paths, setupErrors: errors.slice(0, 20) };
        await ctx.close();
    }
    await browser.close();
    mkdirSync(LANE, { recursive: true });
    writeFileSync(OUT, JSON.stringify(out, null, 2));
    console.log(`OUT  ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
