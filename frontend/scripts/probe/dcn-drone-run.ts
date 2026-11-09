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
 * P-2026-11-08-2042 (R-DCN-29): the run card of `dji` on the canvas, read from its DOM after Reset, in Flying and after
 * the timeline back to step 0; one crop each of the node with its card: 1-charging, 2-flying, 3-stepback.
 * P-2026-11-09-0055 (R-SIM-106): the panel's chips at step 0, S5T-1, and a crop of the panel, 1-stepback-chips.
 * P-2026-11-09-0320 (R-DCN-28): rampUp until speed exceeds vmax, the hit line of speedLimit@dji, Play and Step back, S5L10-1..4, and a crop of the panel, 1-hit.
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

// The run card of an instance (R-DCN-29), read from the visible canvas; `enabled` is what would light the dashed ring.
type CardState = {
    shown: boolean; layer: boolean; ring: boolean; enabled: boolean | null; ringsOnCanvas: number; cards: number; dormant: string[]; changed: string[];
    viewpoints: Array<{ name: string | null; classes: Array<{ text: string; active: boolean; monitored: boolean }>; monitors: string[] }>;
};
const readCard = async (page: Page, id: string): Promise<CardState> => {
    const dom = await page.evaluate((oid) => {
        const visible = (e: Element) => (e as HTMLElement).offsetParent !== null;
        const txt = (e: Element) => (e.textContent ?? '').trim();
        const card = [...document.querySelectorAll(`.sim-node-run__dcn[data-sim-dcn="${oid}"]`)].find(visible);
        const layer = card?.closest('.sim-node-run');
        return {
            shown: !!card, layer: !!layer, ring: !!layer?.querySelector('.sim-node-run__ring'),
            ringsOnCanvas: [...document.querySelectorAll('.sim-node-run__ring')].filter(visible).length,
            cards: [...document.querySelectorAll('.sim-node-run__dcn')].filter(visible).length,
            dormant: [...(card?.querySelectorAll('.sim-node-run__dcn-slot--dormant') ?? [])].map(txt),
            changed: [...(card?.querySelectorAll('.sim-node-run__dcn-slot--changed') ?? [])].map(txt),
            viewpoints: [...(card?.querySelectorAll('.sim-node-run__dcn-viewpoint') ?? [])].map((v) => ({
                name: v.getAttribute('data-sim-dcn-viewpoint'),
                classes: [...v.querySelectorAll('.sim-node-run__dcn-class')].map((c) => ({
                    text: txt(c), active: c.classList.contains('sim-node-run__dcn-class--active'), monitored: !!c.querySelector('.bi-activity'),
                })),
                monitors: [...v.querySelectorAll('.sim-node-run__dcn-monitors')].map(txt),
            })),
        };
    }, id);
    const enabled = await ev<boolean | null>(page,
        `const s = await import('/src/components/editor-v2/sim/simRunState.ts'); return s.getSimNodeState(a)?.enabled ?? null;`, id, 0);
    return { ...dom, enabled };
};
const activeIn = (c: CardState, viewpoint: string) => c.viewpoints.find((v) => v.name === viewpoint)?.classes.filter((x) => x.active).map((x) => x.text) ?? [];
const dormantNames = (c: CardState) => c.dormant.map((d) => d.split(' = ')[0]);

// One crop of the node of `id` with its card, at the page's deviceScaleFactor.
async function shootCard(page: Page, id: string, name: string) {
    const box = await page.evaluate((oid) => {
        const card = [...document.querySelectorAll(`.sim-node-run__dcn[data-sim-dcn="${oid}"]`)].find((e) => (e as HTMLElement).offsetParent !== null);
        const node = card?.closest('.react-flow__node');
        if (!card || !node) return null;
        const a = node.getBoundingClientRect(); const b = card.getBoundingClientRect();
        return { left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom), node: [a.left, a.top, a.width, a.height], card: [b.left, b.top, b.width, b.height] };
    }, id);
    meas(`card box ${name}`, box);
    if (!box) return;
    const x = Math.max(0, box.left - 16); const y = Math.max(0, box.top - 16);
    // The open panel floats over the canvas, on the card at this zoom: out of the crop only.
    await page.addStyleTag({ content: '.sim-panel--open { visibility: hidden !important; }' }).then(async (tag) => {
        await page.screenshot({ path: `${CROPS}/${name}.png`, clip: { x, y, width: Math.min(1440 - x, box.right + 16 - x), height: Math.min(900 - y, box.bottom + 16 - y) } });
        await tag.evaluate((e) => e.remove());
    });
}

// The timeline to step `n`, as a drag of its thumb does: the native setter, then the input event React listens to.
const timelineTo = async (page: Page, n: number) => {
    const moved = await page.evaluate((v) => {
        const r = [...document.querySelectorAll('input.sim-timeline__range')].find((e) => (e as HTMLElement).offsetParent !== null) as HTMLInputElement | undefined;
        if (!r) return false;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(r, String(v));
        r.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    }, n);
    await wait(page, 700);
    return moved;
};

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
    const dji = await ev<string | null>(page, `const m = w.LProject.getProject().models.find((x) => x.id === a); return m.objects.find((o) => o.name === 'dji')?.id ?? null;`, model.id, 0);
    if (!dji) throw new Error('no instance named dji');
    const c1 = await readCard(page, dji);
    meas('card charging', c1);
    await shootCard(page, dji, '1-charging');
    check('S5L3-1 after Reset the Mode compartment shows Charging active', c1.shown && activeIn(c1, 'Mode').join() === 'Charging', { shown: c1.shown, viewpoints: c1.viewpoints });
    check('S5L3-2 chargeRate is not dormant in Charging', c1.shown && !dormantNames(c1).includes('chargeRate'), { shown: c1.shown, dormant: c1.dormant });
    check('S5L3-3 no dashed ring on dji while the card shows, and the run enables it', c1.shown && c1.layer && !c1.ring && c1.enabled === true,
        { shown: c1.shown, layer: c1.layer, ring: c1.ring, enabled: c1.enabled, ringsOnCanvas: c1.ringsOnCanvas, cards: c1.cards });
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
    const c2 = await readCard(page, dji);
    meas('card flying', c2);
    await shootCard(page, dji, '2-flying');
    check('S5L3-4 in Flying the Mode compartment shows Flying active', c2.shown && activeIn(c2, 'Mode').join() === 'Flying', { shown: c2.shown, viewpoints: c2.viewpoints });
    check('S5L3-5 chargeRate is dormant in Flying', dormantNames(c2).includes('chargeRate'), { dormant: c2.dormant });
    const flying = c2.viewpoints.find((v) => v.name === 'Mode')?.classes.find((x) => x.text === 'Flying');
    check('S5L3-6 the monitor icon is on Flying, with the monitors named', flying?.monitored === true && (c2.viewpoints.find((v) => v.name === 'Mode')?.monitors.length ?? 0) > 0, { flying, viewpoints: c2.viewpoints });
    check('S5L3-7 no dashed ring on dji in Flying', c2.shown && c2.layer && !c2.ring, { shown: c2.shown, ring: c2.ring, enabled: c2.enabled, ringsOnCanvas: c2.ringsOnCanvas });

    const moved = await timelineTo(page, 0);
    const c3 = await readCard(page, dji);
    const sBack = await readPanel(page);
    meas('card step back', { moved, ...c3, line: sBack.line, panelChips: sBack.chips });
    await shootCard(page, dji, '3-stepback');
    await shoot(page, '1-stepback-chips');
    check('S5T-1 with the timeline at step 0 the chips read dji.Mode = Charging', moved && sBack.chips.includes('dji.Mode = Charging') && !sBack.chips.includes('dji.Mode = Flying'), { moved, chips: sBack.chips, title: sBack.chipsTitle?.split('\n')[0] ?? null });
    check('S5L3-8 the timeline at step 0 returns the Charging card', moved && c3.shown && activeIn(c3, 'Mode').join() === 'Charging' && !dormantNames(c3).includes('chargeRate'), { moved, shown: c3.shown, viewpoints: c3.viewpoints, dormant: c3.dormant });
    meas('step 4-flying', { classification: s4.chipsTitle?.split('\n')[0] ?? null, status: s4.pill, line: s4.line, slots: s4.chipsTitle });

    // P-2026-11-09-0320 (R-DCN-28): rampUp until speed exceeds vmax (15), the hit of speedLimit on dji.
    const speedOf = () => ev<number | null>(page,
        `const s = await import('/src/components/editor-v2/sim/simRunState.ts'); return s.getSimRun(a.mid)?.config.state.attrs.get(a.dji)?.get('speed') ?? null;`, { mid: model.id, dji }, 0);
    const hitText = () => page.evaluate(() => {
        const p = [...document.querySelectorAll('.sim-panel--open')].find((e) => (e as HTMLElement).offsetParent !== null);
        return (p?.querySelector('.sim-panel__hint--error.sim-panel__hint--line')?.textContent ?? '').trim();
    });
    const rampUp = (st: PanelState) => st.inputs.find((i) => /^dji\.rampUp\(/.test(i.text));
    const SPEED_LIMIT = /Invariant speedLimit@dji( and \d+ more)? false at step \d+|Invariant [^ ]+ and \d+ more false/;
    let ramps = 0;
    let hit = await hitText();
    let sRamp = await readPanel(page);
    const speeds: Array<number | null> = [await speedOf()];
    while (!/speedLimit@dji/.test(hit) && ramps < 30 && rampUp(sRamp)?.on) {
        await press(page, /^dji\.rampUp\(/);
        ramps++;
        speeds.push(await speedOf());
        hit = await hitText();
        sRamp = await readPanel(page);
    }
    const hitStep = await traceLength(page, model.id);
    const hitSpeed = speeds[speeds.length - 1];
    meas('coherence hit', { ramps, speeds, hitStep, hitSpeed, hit, rampUp: rampUp(sRamp) });
    await shoot(page, '1-hit');
    check('S5L10-1 the hit line names speedLimit@dji at the step speed first exceeds vmax 15',
        SPEED_LIMIT.test(hit) && hit.includes('speedLimit@dji') && hitSpeed === 16 && hit.includes(`at step ${hitStep}`), { hit, hitSpeed, hitStep });
    check('S5L10-2 before the last rampUp the speed was within vmax', speeds[speeds.length - 2] === 15, { speeds });

    // Play on a DCN net: no ε candidate, so it presses nothing whether or not a hit is shown.
    await panel(page).locator('.sim-panel__btn[title="Play"]').first().click();
    await wait(page, 1200);
    const afterPlay = await traceLength(page, model.id);
    const pText = await readPanel(page);
    meas('play on the hit', { afterPlay, hitStep, hit: await hitText(), playsAt: /Play[^.]*/.exec(pText.text)?.[0] ?? null, pill: pText.pill });
    check('S5L10-3 Play leaves the run on the step of the hit', afterPlay === hitStep, { afterPlay, hitStep });

    // The timeline back one step: a view, the run stays where it is.
    const viewed = await timelineTo(page, (hitStep ?? 1) - 1);
    meas('timeline one step before the hit', { viewed, hit: await hitText(), trace: await traceLength(page, model.id) });
    await timelineTo(page, hitStep ?? 0);

    await panel(page).locator('.sim-panel__btn[title="Step back"]').first().click();
    await wait(page, 900);
    const backHit = await hitText();
    const backStep = await traceLength(page, model.id);
    meas('after Step back', { backStep, backHit, speed: await speedOf() });
    check('S5L10-4 after Step back below the hit, the hit is gone from the shown step', backStep === (hitStep ?? 0) - 1 && !backHit.includes('speedLimit@dji'), { backStep, backHit });

    check('L45d-6 page errors', errors.length === 0, errors.slice(0, 5));
} catch (e) {
    console.log(`FAIL  probe aborted  ${String((e as Error).message ?? e).slice(0, 800)}`);
    fail++;
} finally {
    await browser.close();
}
console.log(`DONE pass=${pass} fail=${fail}`);
process.exit(fail ? 1 : 0);
