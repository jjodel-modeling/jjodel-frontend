/**
 * sim-coverage-polish probe (P-2026-10-10-1646: R-SIM-146 points 4 and 5, the Coverage switch of the canvas layer as an
 * icon of fixed width, and Clear that sees the live marking). Adapted from the P-2026-10-06-0115 coverage probe.
 *
 * Browser: a dev server of the tree under test, a port 3080-3099 (never 3000, 3001, 3003), the four demo exports of
 * `fixtures/scene_*.jjodel`, 1600x1000, light. TAG=base|after names the tree and the files it writes; the base
 * measures are MEAS lines and the premise controls (the controls grow when coverage is on; a marked place is veiled
 * after a Clear), the checks of the change run on TAG=after.
 *   PART=controls  DemoESM: the layer's controls, bounding boxes and computed styles with coverage off and on;
 *                  crops controls_<TAG>_{off,on}_600.png
 *   PART=clear     DemoESM: a few steps, coverage on, Clear: the marked place unveiled with count 1, the store's visits
 *                  equal to the live marking, one more step counted; no dispatch; crop esm_<TAG>_clear_600.png
 *   PART=scenes    the four exports with coverage off: panel markup, layer, node boxes and overlays at step 0 and at the
 *                  path's end; writes scenes_<TAG>.json
 *   PART=diff      scenes_base.json against scenes_after.json: byte-identical but the switch (and Clear's hidden slot)
 *
 * Run (from frontend/): PROBE_URL=http://localhost:3088 TAG=after PART=controls npx --no-install tsx scripts/probe/sim-coverage-polish.ts
 * Output: PROBE_OUT, default ~/.jjodel-lanes/P-2026-10-10-1646 (crops/ inside it).
 */
import { chromium, type Page } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { seed, BOOT_MS } from '../smoke/states';

const URL0 = (process.env.PROBE_URL || 'http://localhost:3088').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL0)) throw new Error('never 3000, 3001 or 3003');
const PART = process.env.PART || 'controls';
const TAG = process.env.TAG || 'after';
const ONLYS = process.env.SCENE ? process.env.SCENE.split(',') : null;
const OUT = process.env.PROBE_OUT || `${homedir()}/.jjodel-lanes/P-2026-10-10-1646`;
const CROPS = `${OUT}/crops`;
mkdirSync(CROPS, { recursive: true });
const fixture = (name: string) => new URL(`./fixtures/${name}.jjodel`, import.meta.url).pathname;

let failures = 0, passes = 0;
const check = (label: string, ok: boolean, detail: unknown = '') => {
    if (ok) passes++; else failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};
const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
const wait = (page: Page, ms = 800) => page.waitForTimeout(ms);

type Click = { ev?: string; step?: true; pick?: string };
interface Scene { key: string; file: string; mm: string; m1: string; kind: string; declare?: 'esm' | 'flowB'; clicks: Click[]; expect: string[]; final: string }
const SCENES: Scene[] = [
    { key: 'pest', file: 'scene_1_DemoPEST', mm: 'DemoPEST', m1: 'demoSM', kind: 'State machine',
        clicks: ['push', 'coin', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'push', 'stop'].map(ev => ({ ev })),
        expect: ['push: t3 (locked → locked) fired', 'coin: t1 (locked → unlocked) fired', 'coin: t4 (unlocked → unlocked) fired', 'push: t2 (unlocked → locked) fired',
            'coin: t1 (locked → unlocked) fired', 'push: t2 (unlocked → locked) fired', 'push: t3 (locked → locked) fired', 'coin: t1 (locked → unlocked) fired',
            'push: t2 (unlocked → locked) fired', 'stop: t5 (locked → off) fired'], final: 'Terminated' },
    { key: 'petri', file: 'scene_2_DemoPetri', mm: 'DemoPetri', m1: 'demoNet', kind: 'Petri net (P/T)',
        clicks: [{ step: true, pick: 't1 (p1 → p2 ×2)' }, { step: true, pick: 't3 (lock → ∅)' }, { step: true, pick: 't2 (p2 ×2 → p3)' }, { step: true }],
        expect: ['ε: t1 (p1 → p2 ×2) fired', 'ε: t3 (lock → ∅) fired', 'ε: t2 (p2 ×2 → p3) fired', 'ε: t1 (p1 → p2 ×2) fired'], final: 'Deadlock' },
    { key: 'esm', file: 'scene_3_DemoESM', mm: 'DemoESM', m1: 'demoESM', kind: 'Extended state machine', declare: 'esm',
        clicks: ['push', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'coin', 'coin', 'coin'].map(ev => ({ ev })),
        expect: ['push: discarded, tp guard false', 'coin: tc (locked → locked) fired', 'push: discarded, tp guard false', 'coin: tc (locked → locked) fired',
            'push: tp (locked → unlocked) fired', 'push: tu (unlocked → locked) fired', 'coin: tc (locked → locked) fired', 'coin: tc (locked → locked) fired',
            'coin: tc (locked → locked) fired', 'coin: tc (locked → locked) halted the run'], final: 'Halted' },
    { key: 'flowB', file: 'scene_4_DemoFlowB', mm: 'DemoFlowB', m1: 'demoFlowB', kind: 'Flowchart / Activity', declare: 'flowB',
        clicks: Array.from({ length: 6 }, () => ({ step: true as const })),
        expect: ['ε: f1 (i0 → work) fired', 'ε: f2 (work → d1) fired', 'ε: f3 (d1 → work) fired', 'ε: f2 (work → d1) fired', 'ε: fk (d1 → left, right) fired', 'ε: jn (left, right → fin) fired'],
        final: 'Terminated' },
];

const panel = (page: Page) => page.locator('.sim-panel--open').filter({ visible: true }).first();
const dialog = (page: Page) => page.locator('.sim-roles-modal');
const R = 'const R = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.left * 10) / 10, y: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 }; };';
async function openTab(page: Page, name: string) {
    const ok = await page.evaluate(async (n) => {
        const DM = (await import('/src/components/abstract/DockManager.tsx' as any)).default;
        const lk = (window as any).store.getState().idlookup;
        const d = (Object.values(lk) as any[]).find((o) => o?.className === 'DModel' && o.name === n);
        if (!d) return false;
        await DM.open2((window as any).LPointerTargetable.fromPointer(d.id));
        return true;
    }, name);
    await wait(page, 3500);
    // open2 does not always switch (seen on DemoPEST, metamodel and model): then the project's overview, and its card.
    const inTopBar = async () => page.evaluate((n) => [...document.querySelectorAll('body *')].some((e) => {
        if (e.children.length > 0 || (e.textContent ?? '').trim() !== n) return false;
        const b = e.getBoundingClientRect();
        return b.height > 0 && b.top >= 0 && b.bottom < 70;
    }), name);
    if (ok && !(await inTopBar())) {
        const project = await page.evaluate(() => {
            const pid = new URLSearchParams(location.hash.split('?')[1]).get('id');
            return (window as any).store.getState().idlookup[pid!]?.name ?? null;
        });
        // A leaf with the exact text: the project's tab in the top bar, then the artefact's card in the overview's main column.
        const at = (n: string, top: boolean) => page.evaluate(({ n, top }) => {
            for (const e of document.querySelectorAll('body *')) {
                if (e.children.length > 0 || (e.textContent ?? '').trim() !== n) continue;
                const b = e.getBoundingClientRect();
                if (b.height === 0) continue;
                if (top ? b.bottom < 70 : b.top > 150 && b.right < 1200) return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
            }
            return null;
        }, { n, top });
        const tab = project ? await at(project, true) : null;
        if (tab) { await page.mouse.click(tab.x, tab.y); await wait(page, 2500); }
        const card = await at(name, false);
        if (card) { await page.mouse.click(card.x, card.y); await wait(page, 4000); }
        note(`openTab ${name} fallback`, { tab, card });
    }
    return ok;
}
async function chip(page: Page) {
    if ((await page.locator('.sim-panel--open').filter({ visible: true }).count()) > 0) return;
    await page.locator('.sim-panel--closed .sim-panel__chip').filter({ visible: true }).first().click();
    await wait(page, 900);
}
async function canvas(page: Page) {
    return page.evaluate(() => {
        const visible = (e: Element) => (e as HTMLElement).offsetParent !== null;
        const layer = [...document.querySelectorAll('.sim-canvas-layer')].find(visible) as HTMLElement | undefined;
        return {
            active: [...document.querySelectorAll('.mm-node.sim-active')].filter(visible).length,
            tags: [...document.querySelectorAll('.sim-node-run__tag')].filter(visible).map((t) => t.textContent).sort(),
            layer: layer ? { html: layer.innerHTML.length, text: layer.textContent } : null,
        };
    });
}
const btn = (page: Page, title: string) => panel(page).locator(`.sim-panel__actions button[title^="${title}"]${title === 'Step' ? ':not([title="Step back"])' : ''}`).first();
async function pressEvent(page: Page, ev: string) {
    await panel(page).locator('.sim-panel__event').filter({ has: page.locator('span', { hasText: new RegExp(`^${ev}$`) }) }).first().click();
    await wait(page, 600);
}
async function pressStep(page: Page) { await btn(page, 'Step').click(); await wait(page, 600); }
async function pick(page: Page, label: string) { await panel(page).locator('.sim-panel__choice').filter({ hasText: label }).first().click(); await wait(page, 600); }
async function reset(page: Page, seedValue?: number) {
    if (seedValue !== undefined) {
        await page.evaluate((s) => {
            const c = window.crypto; const orig = c.getRandomValues.bind(c);
            (window as any).__restoreRng = () => { c.getRandomValues = orig; };
            c.getRandomValues = ((a: any) => { if (a instanceof Uint32Array && a.length === 1) { a[0] = s; return a; } return orig(a); }) as any;
        }, seedValue);
    }
    await panel(page).locator('.sim-panel__btn[title="Reset"]').first().click();
    await wait(page, 900);
    if (seedValue !== undefined) await page.evaluate(() => (window as any).__restoreRng());
}
async function cell(page: Page, aria: string, text: string) {
    const input = dialog(page).locator(`input[aria-label="${aria}"]`);
    await input.scrollIntoViewIfNeeded(); await input.click(); await page.keyboard.type(text); await page.keyboard.press('Enter'); await wait(page, 300);
}
async function choose(page: Page, aria: string, value: string) {
    const sel = dialog(page).locator(`select[aria-label="${aria}"]`); await sel.scrollIntoViewIfNeeded(); await sel.selectOption(value); await wait(page, 300);
}
async function addRow(page: Page, name: string) {
    await dialog(page).locator('.sim-roles-modal__add').click(); await wait(page, 400);
    await page.keyboard.type(name); await page.keyboard.press('Enter'); await wait(page, 300);
}
async function boot(file: string, label: string) {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
    await seed(ctx, true);
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; localStorage.setItem('theme', 'light'); });
    const page = await ctx.newPage();
    page.setDefaultNavigationTimeout(240000);
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e?.message || e).split('\n')[0].slice(0, 160)));
    await page.goto(`${URL0}/#/allProjects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(BOOT_MS + 4000);
    const pid = await importText(page, readFileSync(fixture(file), 'utf8'));
    check(`${label}: export imported`, !!pid, pid || 'none');
    await openProject(page, pid!);
    return { browser, page, pageErrors };
}
async function importText(page: Page, txt: string): Promise<string | null> {
    const before = await page.evaluate(() => (JSON.parse(localStorage.getItem('projects') || '[]') as any[]).map((p) => p.id));
    await page.evaluate(async (t) => { await (window as any).ProjectsApi.importFromText(t); }, txt);
    await page.waitForTimeout(2500);
    return page.evaluate((b) => (JSON.parse(localStorage.getItem('projects') || '[]') as any[]).find((p) => !b.includes(p.id))?.id ?? null, before);
}
async function openProject(page: Page, pid: string) {
    await page.goto(`${URL0}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(9000);
    const gotIt = page.locator('button', { hasText: /^Got it$/ });
    if (await gotIt.count()) await gotIt.first().click().catch(() => {});
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
}
async function applyRoles(page: Page, s: { key: string; mm: string; kind: string }) {
    check(`${s.key}: metamodel tab opened`, await openTab(page, s.mm));
    const pane = page.locator('.react-flow__pane').filter({ visible: true }).first();
    const box = await pane.boundingBox();
    if (box) await page.mouse.click(box.x + box.width / 2, box.y + 40);
    await wait(page, 1200);
    await page.locator('.jj-toggle-row', { hasText: 'Simulation' }).first().click();
    await wait(page, 1200);
    await chip(page);
    await panel(page).locator('button', { hasText: /^\s*Configure/ }).first().click();
    await wait(page, 800);
    await dialog(page).locator('.sim-roles-modal__chips button', { hasText: new RegExp(`^${s.kind.replace(/[()/]/g, '\\$&')}$`) }).first().click();
    await dialog(page).locator('.sim-roles-modal__btn--primary', { hasText: 'Continue' }).click();
    await wait(page, 800);
    await dialog(page).locator('.sim-roles-modal__btn--primary', { hasText: /^Apply$/ }).click();
    await wait(page, 1500);
}
async function declare(page: Page, s: Scene) {
    if (s.declare === 'esm') {
        await panel(page).locator('.sim-panel__configure', { hasText: 'State…' }).first().click();
        await wait(page, 700);
        await addRow(page, 'coins');
        await choose(page, 'Domain of state attribute 1', 'range');
        await cell(page, 'Maximum of state attribute 1', '3');
        await cell(page, 'Initial value of state attribute 1, a JjEL literal', '0');
        await addRow(page, 'paid');
        await choose(page, 'Form of state attribute 2', 'derived');
        await cell(page, 'Equation of state attribute 2, a JjEL expression', 'model.[coins] >= 2');
    } else {
        await reset(page);
        await panel(page).locator('.sim-panel__hint-action', { hasText: /Declare in State/ }).first().click();
        await wait(page, 700);
        await choose(page, 'Domain of state attribute 1', 'range');
        await cell(page, 'Maximum of state attribute 1', '3');
        await cell(page, 'Initial value of state attribute 1, a JjEL literal', '0');
    }
    const box = await dialog(page).evaluate((el) => { const b = el.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), text: (el.textContent ?? '').replace(/\s+/g, ' ').slice(0, 900) }; });
    await dialog(page).locator('button', { hasText: /^\s*Apply\s*$/ }).first().click();
    await wait(page, 1500);
    return box;
}
async function crop(page: Page, name: string, box: { x: number; y: number; w: number; h: number } | null, width = 600) {
    if (!box) { note(`crop ${name}`, 'no target'); return; }
    const x = Math.max(0, box.x + box.w - width + 8);
    const clip = { x, y: Math.max(0, box.y - 8), width, height: Math.min(1000 - Math.max(0, box.y - 8), box.h + 16) };
    const path = `${CROPS}/${name}.png`;
    await page.screenshot({ path, clip, scale: 'css' });
    note('CROP', path);
}
async function doClick(page: Page, c: Click) {
    if (c.ev) await pressEvent(page, c.ev);
    if (c.step) { await pressStep(page); if (c.pick) await pick(page, c.pick); }
}
const stepBack = async (page: Page) => { await btn(page, 'Step back').click(); await wait(page, 600); };
async function modelIdOf(page: Page, name: string) {
    return page.evaluate((n) => (Object.values((window as any).store.getState().idlookup) as any[]).find((o) => o?.className === 'DModel' && o.name === n)?.id ?? null, name);
}
/** The panel's markup (seed masked), as lane 2b read it. */
async function panelHtml(page: Page) {
    return panel(page).evaluate((el) => el.outerHTML.replace(/seed \d+/g, 'seed #'));
}
/** The visible canvas layer: markup, box, and each control's class and box. */
async function layerOf(page: Page) {
    return page.evaluate((r) => {
        const R = eval(`(${r.replace(/^const R = /, '').replace(/;$/, '')})`);
        const layer = [...document.querySelectorAll('.sim-canvas-layer')].find((e) => (e as HTMLElement).offsetParent !== null) as HTMLElement | undefined;
        if (!layer) return null;
        const controls = layer.querySelector('.sim-canvas-layer__controls');
        return {
            html: layer.outerHTML, box: R(layer), controls: R(controls), text: layer.textContent,
            items: [...(controls?.children ?? [])].map((c) => ({ cls: String((c as HTMLElement).className), text: c.textContent, box: R(c) })),
        };
    }, R);
}
/** Every visible node: its ids, its two boxes, its name text and the run overlay's markup. */
async function nodes(page: Page) {
    return page.evaluate((r) => {
        const R = eval(`(${r.replace(/^const R = /, '').replace(/;$/, '')})`);
        const lk = (window as any).store.getState().idlookup;
        return [...document.querySelectorAll('.react-flow__node')].filter((n) => (n as HTMLElement).offsetParent !== null).map((n) => {
            const vid = n.getAttribute('data-id');
            const oid = vid ? lk[vid]?.model ?? null : null;
            const ov = n.querySelector(':scope > .sim-node-run');
            return {
                vid, oid, name: (n.querySelector('.mm-node') as HTMLElement | null)?.innerText?.split('\n')[0]?.slice(0, 40) ?? null,
                box: R(n), inner: R(n.querySelector('.mm-node')), run: ov ? ov.outerHTML : null,
                cov: ov?.getAttribute('data-sim-cov') ?? null, veil: !!ov?.querySelector('.sim-node-run__cov-veil'),
                chip: ov?.querySelector('.sim-node-run__cov')?.textContent ?? null, chipBox: R(ov?.querySelector('.sim-node-run__cov') ?? null),
            };
        });
    }, R);
}
/** The coverage store of a model, and the counts recomputed from its live run's trace (the discovery's measure). */
async function covOf(page: Page, mid: string) {
    return page.evaluate(async (m) => {
        const c = await import('/src/components/editor-v2/sim/simCoverage.ts' as any);
        const s = await import('/src/components/editor-v2/sim/simRunState.ts' as any);
        const cov = c.getSimCoverage(m);
        const run = s.getSimRun(m);
        const fromTrace: any = { visits: new Map(), firings: new Map() };
        const add = (mp: Map<string, number>, k: string) => mp.set(k, (mp.get(k) ?? 0) + 1);
        if (run) {
            for (const [p, n] of run.net.initial.marking) if (n > 0) add(fromTrace.visits, p);
            for (const t of run.trace ?? []) {
                if (t.kind !== 'fired' || t.selector === null) continue;
                add(fromTrace.firings, t.selector);
                for (const a of run.net.transitions.find((x: any) => x.id === t.selector)?.postset ?? []) add(fromTrace.visits, a.place);
            }
        }
        const ser = (x: any) => JSON.stringify({ v: [...x.visits].sort(), f: [...x.firings].sort() });
        return { store: ser(cov), trace: ser(fromTrace), n: run?.trace?.length ?? null, version: c.getSimCoverageVersion() };
    }, mid);
}
/** The node readings with the boxes only, for the 0 px check. */
const boxesOf = (ns: any[]) => JSON.stringify(ns.map((n) => [n.vid, n.box, n.inner]));

async function cropClip(page: Page, name: string, clip: { x: number; y: number; width: number; height: number }) {
    const path = `${CROPS}/${name}.png`;
    await page.screenshot({ path, clip: { x: Math.max(0, clip.x), y: Math.max(0, clip.y), width: clip.width, height: Math.min(clip.height, 1000 - Math.max(0, clip.y)) }, scale: 'css' });
    note('CROP', path);
}
/** The model's counted nodes on screen, centred in a clip `width` wide; the open panel hidden for the shot only. */
async function cropCounted(page: Page, name: string, width: number) {
    const ns = (await nodes(page)).filter((n) => n.cov !== null && n.box && n.box.x >= 0);
    const x0 = Math.min(...ns.map((n) => n.box.x)), y0 = Math.min(...ns.map((n) => n.box.y));
    const x1 = Math.max(...ns.map((n) => n.box.x + n.box.w)), y1 = Math.max(...ns.map((n) => n.box.y + n.box.h));
    note(`${name} counted nodes union`, { x0, y0, x1, y1, n: ns.length });
    const tag = await page.addStyleTag({ content: '.sim-panel--open { visibility: hidden !important; }' });
    await wait(page, 200);
    const cx = (x0 + x1) / 2;
    await cropClip(page, name, { x: Math.max(0, Math.min(1600 - width, cx - width / 2)), y: y0 - 40, width, height: y1 - y0 + 80 });
    await tag.evaluate((el) => el.remove());
    await wait(page, 200);
}

/** A scene opened on its model tab with its roles applied, its state declared, and a Reset. */
async function openScene(s: Scene, label: string) {
    const { browser, page, pageErrors } = await boot(s.file, label);
    await applyRoles(page, s);
    check(`${label}: model tab opened`, await openTab(page, s.m1));
    await chip(page);
    if (s.declare) await declare(page, s);
    await reset(page);
    return { browser, page, pageErrors };
}
/** The Coverage switch, on the base (icon and text) and on the change (icon only): the button holding the bullseye. */
const coverageSwitch = (page: Page) => page.locator('.sim-canvas-layer__toggle:has(.bi-bullseye)').filter({ visible: true }).first();
/** The controls' items with the computed style that decides what is seen and what takes a click. */
async function controlsOf(page: Page) {
    return page.evaluate(() => {
        const layer = [...document.querySelectorAll('.sim-canvas-layer')].find((e) => (e as HTMLElement).offsetParent !== null) as HTMLElement | undefined;
        const controls = layer?.querySelector('.sim-canvas-layer__controls') as HTMLElement | null | undefined;
        if (!controls) return null;
        const r = (e: Element) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left * 10) / 10, y: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 }; };
        return {
            box: r(controls),
            items: [...controls.children].map((c) => ({
                cls: String((c as HTMLElement).className), text: (c.textContent ?? '').trim(), label: c.getAttribute('aria-label'), pressed: c.getAttribute('aria-pressed'),
                title: c.getAttribute('title'), visibility: getComputedStyle(c).visibility, box: r(c),
            })),
        };
    });
}

/** Whether the point at the middle of Clear's box lands on Clear (or its icon): the slot takes a click only when it is seen. */
async function clearTakesClick(page: Page) {
    return page.evaluate(() => {
        const c = document.querySelector('.sim-canvas-layer__coverage-clear') as HTMLElement | null;
        if (!c) return null;
        const b = c.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return !!hit && c.contains(hit);
    });
}

// -- controls: the layer's controls with coverage off and on ------------------------------------------------------------
async function controlsPart() {
    const s = SCENES[2];
    const L = `controls ${TAG}`;
    const { browser, page, pageErrors } = await openScene(s, L);
    for (const c of s.clicks.slice(0, 3)) await doClick(page, c);
    const off = (await controlsOf(page))!;
    note(`${L} off`, off);
    await crop(page, `controls_${TAG}_off_600`, off.box);
    const hitOff = await clearTakesClick(page);
    await coverageSwitch(page).click();
    await wait(page, 600);
    const on = (await controlsOf(page))!;
    note(`${L} on`, on);
    await crop(page, `controls_${TAG}_on_600`, on.box);
    const sw = (c: typeof off) => c.items.find((i) => i.cls.includes('sim-canvas-layer__toggle') && (i.label === 'Coverage' || i.text === 'Coverage'))!;
    const clear = (c: typeof off) => c.items.find((i) => i.cls.includes('sim-canvas-layer__coverage-clear'));
    check(`${L}: control, the layer has controls and a Coverage switch off and on`, off.items.length >= 3 && !!sw(off) && !!sw(on), off.items.map((i) => i.cls));
    if (TAG === 'base') {
        check(`${L}: control, the premise: the controls grow when coverage is on`, on.box.w > off.box.w, { off: off.box.w, on: on.box.w });
        note(`${L} widths`, { off: off.box.w, on: on.box.w, grew: Math.round((on.box.w - off.box.w) * 10) / 10, switchOff: sw(off).box.w, switchOn: sw(on).box.w });
    } else {
        check(`${L}: the controls have one width, coverage off and on`, off.box.w === on.box.w && off.box.x === on.box.x, { off: off.box, on: on.box });
        check(`${L}: the switch is an icon of fixed width: 24 px, the same off and on, no text, named and pressed by attributes`,
            sw(off).box.w === 24 && sw(on).box.w === 24 && sw(off).text === '' && sw(on).text === '' && sw(off).label === 'Coverage' && sw(off).pressed === 'false' && sw(on).pressed === 'true',
            { off: sw(off), on: sw(on) });
        check(`${L}: the summary is in the title when on, not when off`, /^Hide the coverage of the runs: \d+\/\d+ places · \d+\/\d+ transitions$/.test(sw(on).title ?? '') && !(sw(off).title ?? '').includes('places'), { off: sw(off).title, on: sw(on).title });
        check(`${L}: Clear keeps its slot: present and hidden off (visibility), seen on, the same box`,
            !!clear(off) && !!clear(on) && clear(off)!.visibility === 'hidden' && clear(on)!.visibility === 'visible' && JSON.stringify(clear(off)!.box) === JSON.stringify(clear(on)!.box), { off: clear(off), on: clear(on) });
        check(`${L}: every item keeps its box off and on`, JSON.stringify(off.items.map((i) => i.box)) === JSON.stringify(on.items.map((i) => i.box)), { off: off.items.map((i) => i.box), on: on.items.map((i) => i.box) });
        const hitOn = await clearTakesClick(page);
        check(`${L}: the hidden slot takes no click off, Clear takes it on`, hitOff === false && hitOn === true, { off: hitOff, on: hitOn });
    }
    note(`${L} page errors`, [...new Set(pageErrors)]);
    await browser.close();
}

// -- clear: DemoESM, the marked place after a Clear ---------------------------------------------------------------------
/** The live run's marking and the store's visits, by element id, then the name of each. */
async function markingAndVisits(page: Page, mid: string) {
    return page.evaluate(async (m) => {
        const c = await import('/src/components/editor-v2/sim/simCoverage.ts' as any);
        const s = await import('/src/components/editor-v2/sim/simRunState.ts' as any);
        const run = s.getSimRun(m);
        const lk = (window as any).store.getState().idlookup;
        const name = (id: string) => lk[id]?.name ?? id;
        const marked = run ? [...run.config.state.marking].filter(([, n]: any) => n > 0).map(([id, n]: any) => [name(id), n]).sort() : null;
        const cov = c.getSimCoverage(m);
        return { marked, visits: [...cov.visits].map(([id, n]: any) => [name(id), n]).sort(), firings: [...cov.firings].map(([id, n]: any) => [name(id), n]).sort() };
    }, mid);
}
const placeName = (n: any) => String(n.name).split(' : ')[0];
async function clearPart() {
    const s = SCENES[2];
    const L = `clear ${TAG}`;
    const { browser, page, pageErrors } = await openScene(s, L);
    const id = (await modelIdOf(page, s.m1))!;
    // push, coin, push, coin, push: two discards, two coins, and tp: the marking is `unlocked`
    for (const c of s.clicks.slice(0, 5)) await doClick(page, c);
    await page.evaluate(() => {
        const w = window as any; w.__dispatches = 0; const orig = w.store.dispatch;
        w.store.dispatch = (...a: any[]) => { w.__dispatches++; return orig(...a); };
        w.__lookup0 = JSON.stringify(w.store.getState().idlookup);
    });
    await coverageSwitch(page).click();
    await wait(page, 600);
    const before = await markingAndVisits(page, id);
    note(`${L} before Clear`, before);
    check(`${L}: control, the run holds one marked place, unlocked, and the counts have its arrival`,
        JSON.stringify(before.marked) === JSON.stringify([['unlocked', 1]]) && before.visits.some(([n]: any) => n === 'unlocked'), before);
    await page.locator('.sim-canvas-layer__coverage-clear').filter({ visible: true }).first().click();
    await wait(page, 600);
    const cleared = await nodes(page);
    const afterClear = await markingAndVisits(page, id);
    note(`${L} nodes after Clear`, cleared.filter((n) => n.cov !== null).map((n) => ({ name: placeName(n), cov: n.cov, veil: n.veil, chip: n.chip })));
    note(`${L} store after Clear`, afterClear);
    const unlocked = cleared.find((n) => placeName(n) === 'unlocked');
    check(`${L}: control, the nodes carry coverage and the marked place is among them`, !!unlocked && cleared.filter((n) => n.cov !== null).length >= 3);
    if (TAG === 'base') {
        check(`${L}: control, the premise: the marked place is veiled after a Clear`, unlocked?.veil === true && unlocked?.cov === '0', { cov: unlocked?.cov, veil: unlocked?.veil });
    } else {
        check(`${L}: after Clear the marked place is unveiled with count 1`, unlocked?.veil === false && unlocked?.cov === '1' && unlocked?.chip === '×1', { cov: unlocked?.cov, veil: unlocked?.veil, chip: unlocked?.chip });
        check(`${L}: the other places stay veiled at 0`, cleared.filter((n) => n.cov !== null && placeName(n) !== 'unlocked').every((n) => n.veil && n.cov === '0'),
            cleared.filter((n) => n.cov !== null).map((n) => [placeName(n), n.cov, n.veil]));
        check(`${L}: the store's visits are the live marking, once each, and no firing`,
            JSON.stringify(afterClear.visits) === JSON.stringify([['unlocked', 1]]) && afterClear.firings.length === 0, afterClear);
        const sw = (await controlsOf(page))!.items.find((i) => i.label === 'Coverage');
        check(`${L}: the summary in the title reads 1 of 3 places, 0 of 4 transitions`, sw?.title === 'Hide the coverage of the runs: 1/3 places · 0/4 transitions', sw?.title);
    }
    await cropCounted(page, `esm_${TAG}_clear_600`, 600);
    // push: tu (unlocked -> locked): the token arrives in locked, unlocked keeps its one visit
    await doClick(page, s.clicks[5]);
    const next = await nodes(page);
    const afterStep = await markingAndVisits(page, id);
    note(`${L} nodes after one more step`, next.filter((n) => n.cov !== null).map((n) => ({ name: placeName(n), cov: n.cov, veil: n.veil, chip: n.chip })));
    const cov = (name: string) => next.find((n) => placeName(n) === name)?.cov;
    if (TAG === 'after') {
        check(`${L}: one more step counts on top: locked 1, unlocked still 1, off still 0`, cov('locked') === '1' && cov('unlocked') === '1' && cov('off') === '0', afterStep);
        check(`${L}: the store holds that step's firing and no recount of the steps before the Clear`,
            JSON.stringify(afterStep.firings) === JSON.stringify([['tu', 1]]) && JSON.stringify(afterStep.visits) === JSON.stringify([['locked', 1], ['unlocked', 1]]), afterStep);
    }
    const w = await page.evaluate(() => ({ d: (window as any).__dispatches, same: JSON.stringify((window as any).store.getState().idlookup) === (window as any).__lookup0 }));
    check(`${L}: no Redux dispatch and the lookup unchanged across the gestures, Clear included`, w.d === 0 && w.same, w);
    note(`${L} page errors`, [...new Set(pageErrors)]);
    await browser.close();
}

// -- scenes: coverage off, base and after ---------------------------------------------------------------------------
async function sceneRun(s: Scene) {
    const { browser, page, pageErrors } = await openScene(s, s.key);
    const out: any = { key: s.key };
    const read = async () => ({ html: await panelHtml(page), active: (await canvas(page)).active, layer: await layerOf(page), nodes: await nodes(page) });
    out.at0 = await read();
    for (const c of s.clicks) await doClick(page, c);
    out.atK = await read();
    out.final = (await panel(page).locator('.sim-panel__status-text').first().textContent()) ?? null;
    check(`${s.key}: control, the path ends ${s.final}`, out.final === s.final, out.final);
    out.pageErrors = [...new Set(pageErrors)];
    await browser.close();
    return out;
}
async function scenesPart() {
    const all: Record<string, any> = {};
    for (const s of SCENES) if (!ONLYS || ONLYS.includes(s.key)) all[s.key] = await sceneRun(s);
    writeFileSync(`${OUT}/scenes_${TAG}${ONLYS ? `_${ONLYS.join('_')}` : ''}.json`, JSON.stringify(all, null, 1));
}
/** The layer without the coverage buttons: the base's switch (icon and text), the change's switch and Clear's hidden slot. */
const SWITCH = /<button[^>]*>\s*<i class="bi bi-bullseye"[^>]*><\/i>(?:<span>Coverage<\/span>)?<\/button>/;
const CLEAR = /<button[^>]*sim-canvas-layer__coverage-clear[^>]*>\s*<i class="bi bi-eraser"[^>]*><\/i><\/button>/;
function withoutCoverage(at: any) {
    if (!at?.layer) return { at, switchFound: false, clearFound: false };
    const switchFound = SWITCH.test(at.layer.html), clearFound = CLEAR.test(at.layer.html);
    const html = at.layer.html.replace(CLEAR, '').replace(SWITCH, '');
    const items = at.layer.items.filter((i: any) => !(i.cls.includes('coverage-clear') || i.cls.includes('toggle--icon') || i.text === 'Coverage'));
    return { at: { ...at, layer: { html, right: at.layer.box.x + at.layer.box.w, y: at.layer.box.y, h: at.layer.box.h, items } }, switchFound, clearFound };
}
function diffPart() {
    // ids carry the import's timestamp and the seed is drawn at Reset: both masked
    const norm = (t: string) => t.replace(/Pointer\d+_USER_/g, 'Pointer#_USER_').replace(/seed \d+/g, 'seed #');
    const a = JSON.parse(norm(readFileSync(`${OUT}/scenes_base.json`, 'utf8')));
    const b = JSON.parse(norm(readFileSync(`${OUT}/scenes_after.json`, 'utf8')));
    const paths: string[] = [];
    const walk = (x: any, y: any, path: string) => {
        if (JSON.stringify(x) === JSON.stringify(y)) return;
        if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], `${path}.${k}`); return; }
        paths.push(`${path}: ${JSON.stringify(x)?.slice(0, 200)} -> ${JSON.stringify(y)?.slice(0, 200)}`);
    };
    check('control: base and after hold the four scenes with panel markup, nodes and a layer', ['pest', 'petri', 'esm', 'flowB'].every((k) => a[k]?.at0?.html?.length > 1000 && b[k]?.atK?.nodes?.length > 0 && a[k]?.at0?.layer && b[k]?.at0?.layer),
        Object.keys(a).map((k) => [k, a[k]?.at0?.html?.length, b[k]?.at0?.nodes?.length]));
    for (const key of Object.keys(a)) {
        for (const at of ['at0', 'atK']) {
            const x = withoutCoverage(a[key][at]), y = withoutCoverage(b[key]?.[at]);
            check(`${key}.${at}: the base layer holds the switch and no Clear; the after layer the icon switch and Clear's slot, off`, x.switchFound && !x.clearFound && y.switchFound && y.clearFound, [x.switchFound, x.clearFound, y.switchFound, y.clearFound]);
            walk(x.at, y.at, `${key}.${at}`);
        }
        walk(a[key].final, b[key]?.final, `${key}.final`);
        note(`${key} page errors base/after`, [a[key].pageErrors, b[key]?.pageErrors]);
    }
    for (const p of paths.slice(0, 60)) console.log(`DIFF  ${p}`);
    check('the four scenes with coverage off byte-identical to the base but the switch and Clear\'s hidden slot (panel, layer, node boxes and overlays)', paths.length === 0, `${paths.length} differing paths`);
}

async function main() {
    if (PART === 'controls') await controlsPart();
    else if (PART === 'clear') await clearPart();
    else if (PART === 'scenes') await scenesPart();
    else if (PART === 'diff') diffPart();
    else throw new Error(`PART=${PART}`);
    console.log(`RESULT ${passes} PASS, ${failures} FAIL`);
    process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(2); });
