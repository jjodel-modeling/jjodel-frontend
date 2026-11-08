/**
 * dcn-drone-run (P-2026-11-08-0329): the visual check of L4.5, a drone run in the app. The export of
 * dcn-drone-fixture (`dcn-drone-objects.jjodel`, the object level) imported on its own dev server, the object
 * diagram opened, the Simulation panel opened, Choices Random, Reset with a fixed seed, then:
 *   1-reset    after Reset;
 *   2-ready    after the Tick presses that bring `dji` to `Mode = Ready` (at most 20);
 *   3-takeoff  after pressing `dji.takeOff()`;
 *   4-flying   after three more Tick presses.
 * One crop of the panel per step (light theme, deviceScaleFactor 2) and one MEAS line per step: the classification
 * (the chips and their title's first line) and the status line (`step n · last step`).
 * Checks: the panel shows Reset (not «Simulation not configured»); the heading is DCN_PANEL_HEADING; after takeOff
 * the classification has `Mode = Flying` and the step is one trace entry (R-DCN-22).
 *
 * Run:  node frontend/scripts/lane-run.mjs probe ~/jjodel-w-dcn-l45 frontend/scripts/probe/dcn-drone-run.ts \
 *         --port 3087 --id P-2026-11-08-0329
 * Env:  DCN_FILE  the export (default ~/jjodel-demo-exports/dcn/dcn-drone-objects.jjodel)
 *       DCN_CROPS the crops directory (default ~/.jjodel-lanes/P-2026-11-08-0329/crops)
 *       DCN_SEED  the seed of Reset (default 4242)
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { seed, setTheme, SETTLE_MS } from '../smoke/states.ts';
import { DCN_PANEL_HEADING } from '../../src/model/simulation/dcn/dcnPanelText.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3087/').replace(/\/$/, '');
const FILE = process.env.DCN_FILE || `${homedir()}/jjodel-demo-exports/dcn/dcn-drone-objects.jjodel`;
const CROPS = (process.env.DCN_CROPS || `${homedir()}/.jjodel-lanes/P-2026-11-08-0329/crops`).replace(/\/$/, '');
const SEED = Number(process.env.DCN_SEED || 4242);
const MAX_TICKS = 20;
// The Tick button's label in the inputs row, matched exactly (P-2026-11-08-1606; the event id stays `dcn-tick`).
const TICK_LABEL = 'Tick';
const TICK = new RegExp(`^${TICK_LABEL}$`);

const { ev } = await import('./bpmn-lanes-fixture.ts');

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
    if (ok) pass++; else fail++;
};
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v).slice(0, 3000)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const panel = (page: Page) => page.locator('.sim-panel--open').filter({ visible: true }).first();

type PanelState = {
    hint: string | null; sections: string[]; chips: string[]; chipsTitle: string | null; pill: string | null;
    line: string | null; inputs: Array<{ text: string; on: boolean }>; hasReset: boolean;
    warningLines: Array<string | null>; text: string;
};
const readPanel = (page: Page): Promise<PanelState> => page.evaluate(() => {
    const p = [...document.querySelectorAll('.sim-panel--open')].find((e) => (e as HTMLElement).offsetParent !== null);
    const txt = (e: Element | null | undefined) => (e ? (e.textContent ?? '').trim() : null);
    return {
        hint: txt(p?.querySelector('.sim-panel__body > .sim-panel__hint')),
        sections: [...(p?.querySelectorAll('.sim-panel__section') ?? [])].map((e) => (e.textContent ?? '').trim()),
        chips: [...(p?.querySelectorAll('.sim-panel__chips .sim-panel__marking-chip') ?? [])].map((e) => (e.textContent ?? '').trim()),
        chipsTitle: p?.querySelector('.sim-panel__chips')?.getAttribute('title') ?? null,
        pill: txt(p?.querySelector('.sim-panel__status-pill')),
        line: txt(p?.querySelector('.sim-panel__status-line')),
        inputs: [...(p?.querySelectorAll('.sim-panel__events .sim-panel__event') ?? [])]
            .map((e) => ({ text: (e.textContent ?? '').trim(), on: !(e as HTMLButtonElement).disabled })),
        hasReset: !!p?.querySelector('.sim-panel__btn[title="Reset"]'),
        // The compile-defects line of the panel (`defects` in SimulationPanel), and the whole panel's text as its control.
        warningLines: [...(p?.querySelectorAll('.sim-panel__hint--warning.sim-panel__hint--line') ?? [])].map((e) => txt(e)),
        text: (p?.textContent ?? '').trim(),
    };
});
const traceLength = (page: Page, mid: string) => ev<number | null>(page,
    `const s = await import('/src/components/editor-v2/sim/simRunState.ts'); const r = s.getSimRun(a); return r ? (r.trace ?? []).length : null;`, mid, 0);

async function shoot(page: Page, name: string) {
    const box = await panel(page).boundingBox();
    if (!box) { meas(`crop ${name} skipped`, 'no panel box'); return; }
    await page.screenshot({ path: `${CROPS}/${name}.png`, clip: { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: box.width + 16, height: box.height + 16 } });
}

async function step(page: Page, mid: string, name: string, crop: boolean): Promise<PanelState> {
    const s = await readPanel(page);
    const classification = s.chipsTitle ? s.chipsTitle.split('\n')[0] : null;
    meas(`step ${name}`, { classification, chips: s.chips, status: s.pill, line: s.line, trace: await traceLength(page, mid) });
    if (crop) await shoot(page, name);
    return s;
}

async function press(page: Page, match: RegExp) {
    await panel(page).locator('.sim-panel__events .sim-panel__event').filter({ has: page.locator('span', { hasText: match }) }).first().click();
    await wait(page, 700);
}

const browser = await chromium.launch();
try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await seed(ctx, true);
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    mkdirSync(CROPS, { recursive: true });

    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 5000);
    const imported = await ev<{ id: string | null }>(page, `
        const api = await import('/src/api/persistance/projects.ts');
        const list = () => JSON.parse(localStorage.getItem('projects') || '[]');
        const before = list().length;
        await api.ProjectsApi.importFromText(a);
        for (let i = 0; i < 75 && list().length <= before; i++) await new Promise((r) => setTimeout(r, 200));
        const l = list(); return { id: l.length > before ? l[l.length - 1].id : null };`, readFileSync(FILE, 'utf8'), 0);
    if (!imported.id) throw new Error('the export did not import');
    await page.goto(`${URL}/#/project?id=${imported.id}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 9000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});

    // The object diagram: the M1 model's tab.
    const model = await ev<{ id: string; name: string; models: string[] }>(page, `
        const ms = w.LProject.getProject().models; const m = ms.find((x) => !x.isMetamodel);
        const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(w.LPointerTargetable.fromPointer(m.id));
        return { id: m.id, name: m.name, models: ms.map((x) => x.name + (x.isMetamodel ? ' (M2)' : ' (M1)')) };`, undefined, 8000);
    meas('model opened', model);
    await setTheme(page, 'light');
    await wait(page, SETTLE_MS);

    // The Simulation panel, Choices Random, Reset on a fixed seed (the seed is drawn from getRandomValues at Reset).
    await page.locator('.sim-panel--closed .sim-panel__chip').filter({ visible: true }).first().click();
    await wait(page, 900);
    const before = await readPanel(page);
    meas('panel opened', { hint: before.hint, sections: before.sections, hasReset: before.hasReset });
    check('L45d-1 the panel shows Reset, not «Simulation not configured»',
        before.hasReset && !(before.hint ?? '').startsWith('Simulation not configured'), { hint: before.hint, hasReset: before.hasReset });
    if (!before.hasReset) throw new Error('no Reset in the panel');
    await panel(page).locator('select[aria-label="Choices"]').selectOption('random');
    await wait(page, 300);
    await page.evaluate((s) => {
        const c = window.crypto; const orig = c.getRandomValues.bind(c);
        (window as any).__restoreRng = () => { c.getRandomValues = orig; };
        c.getRandomValues = ((x: any) => { if (x instanceof Uint32Array && x.length === 1) { x[0] = s; return x; } return orig(x); }) as any;
    }, SEED);
    await panel(page).locator('.sim-panel__btn[title="Reset"]').first().click();
    await wait(page, 1200);
    await page.evaluate(() => (window as any).__restoreRng());

    const s1 = await step(page, model.id, '1-reset', true);
    meas('inputs row', s1.inputs);
    meas('tick button label', s1.inputs.filter((i) => /tick/i.test(i.text)).map((i) => i.text));
    check('L45d-2 the heading is the DCN one', s1.sections.includes(DCN_PANEL_HEADING), { sections: s1.sections, expected: DCN_PANEL_HEADING });
    const takeOffInput = (st: PanelState) => st.inputs.find((i) => /^dji\.takeOff\(/.test(i.text));
    // L4.7: the slots filled, so no compile defect; the panel's own text is the control that the read ran.
    check('L47-1 the panel shows no defects line', s1.warningLines.length === 0 && !/\bdefects?\b/i.test(s1.text) && s1.text.includes(DCN_PANEL_HEADING),
        { warningLines: s1.warningLines, textLength: s1.text.length });
    check('L47-2 the initial state is dji.Mode = Charging and wau1.Alert = Safe', s1.chips.includes('dji.Mode = Charging') && s1.chips.includes('wau1.Alert = Safe'), { chips: s1.chips });
    check('L46-1 takeOff is disabled after Reset (Charging)', takeOffInput(s1)?.on === false, { takeOff: takeOffInput(s1), chips: s1.chips });

    // Tick until dji is Ready.
    const ready = (s: PanelState) => s.chips.some((c) => /^dji\.Mode = Ready$/.test(c));
    let s = s1;
    let ticks = 0;
    while (!ready(s) && ticks < MAX_TICKS && s.pill === 'Running') {
        await press(page, TICK);
        ticks++;
        s = await step(page, model.id, `tick ${ticks}`, false);
    }
    meas('ticks to Ready', { ticks, ready: ready(s), status: s.pill });
    if (!ready(s)) {
        check('L45d-3 dji reaches Mode = Ready within 20 ticks', false, { ticks, status: s.pill, line: s.line, chips: s.chips, title: s.chipsTitle });
        throw new Error('dji never reached Ready');
    }
    check('L46-2 takeOff is enabled in Ready', takeOffInput(s)?.on === true, { takeOff: takeOffInput(s), chips: s.chips });
    await shoot(page, '2-ready');
    meas('step 2-ready', { classification: s.chipsTitle?.split('\n')[0] ?? null, line: s.line, slots: s.chipsTitle });

    // takeOff: one press, one trace entry, Mode = Flying.
    const n0 = await traceLength(page, model.id);
    await press(page, /^dji\.takeOff\(/);
    const s3 = await step(page, model.id, '3-takeoff', true);
    const n1 = await traceLength(page, model.id);
    meas('takeOff slots', s3.chipsTitle);
    check('L45d-4 after takeOff the classification has Mode = Flying', s3.chips.includes('dji.Mode = Flying'), { chips: s3.chips, line: s3.line });
    check('L45d-5 takeOff is one trace entry', n0 !== null && n1 === n0 + 1, { before: n0, after: n1 });

    let s4 = s3;
    for (let i = 1; i <= 3 && s4.pill === 'Running'; i++) {
        await press(page, TICK);
        s4 = await step(page, model.id, `flying tick ${i}`, false);
    }
    await shoot(page, '4-flying');
    meas('step 4-flying', { classification: s4.chipsTitle?.split('\n')[0] ?? null, status: s4.pill, line: s4.line, slots: s4.chipsTitle });
    check('L45d-6 page errors', errors.length === 0, errors.slice(0, 5));
} catch (e) {
    console.log(`FAIL  probe aborted  ${String((e as Error).message ?? e).slice(0, 800)}`);
    fail++;
} finally {
    await browser.close();
}
console.log(`DONE pass=${pass} fail=${fail}`);
process.exit(fail ? 1 : 0);
