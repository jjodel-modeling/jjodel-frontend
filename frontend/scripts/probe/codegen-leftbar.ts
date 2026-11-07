/**
 * codegen-leftbar probe (P-2026-10-24-0004): the GENERATORS section of the project's left bar (R-GEN-42), on the
 * Turnstile lecture example of codegen/examples/, imported and installed as codegen-generator-tab.ts does (its
 * page-side helpers copied: that probe is not imported).
 *
 * Fresh context, the experimental setting on:
 *   - the left bar has a GENERATORS section right after TRANSFORMS, one row «Default» (crop leftbar_one.png);
 *   - «+ New generator» (one metamodel: no question) creates a generator and opens its tab; the section lists two
 *     (crop leftbar_two.png, crop tab_from_leftbar.png);
 *   - a click on the «Default» row brings the default's tab forward, `codegen_tpl_<mm>`;
 *   - the setting off (Settings writes it with setCodegenEnabled): the section is gone, no reload (crop
 *     leftbar_off.png); TRANSFORMS and VIEWPOINTS stay.
 *
 * Crops, light theme, in ~/.jjodel-lanes/P-2026-10-24-0004/crops/ (CLB_CROPS), with their sizes printed.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/codegen-leftbar.ts \
 *         --port 3132 --id P-2026-10-24-0004
 * Env:  CLB_OUT      JSON output (default frontend/scripts/smoke/_tmp_codegen-leftbar.json, gitignored)
 *       CLB_CROPS    the folder of the crops
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3132/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const OUT = process.env.CLB_OUT || new globalThis.URL('../smoke/_tmp_codegen-leftbar.json', import.meta.url).pathname;
const CROPS = process.env.CLB_CROPS || `${homedir()}/.jjodel-lanes/P-2026-10-24-0004/crops`;
const NAME = 'turnstile';
mkdirSync(CROPS, { recursive: true });

interface Example {
    name: string;
    scene: string;
    lookup: Record<string, any>;
    scenario: { name: string; steps: Array<{ event: string | null; selector: string | null; kind: string }> };
}

const ex: Example = JSON.parse(readFileSync(new globalThis.URL(`../../src/codegen/examples/${NAME}/${NAME}.json`, import.meta.url), 'utf8'));
const scene = (name: string) => new globalThis.URL(`./fixtures/${name}.jjodel`, import.meta.url).pathname;

const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

async function poll<T>(page: Page, expr: string, ms: number): Promise<T | null> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        const v = await page.evaluate(expr).catch(() => null) as T | null;
        if (v) return v;
        await wait(page, 250);
    }
    return null;
}

async function crop(page: Page, file: string, box: { x: number; y: number; w: number; h: number } | null, pad = 8) {
    if (!box) { check(`crop ${file} has a box`, false, 'null'); return; }
    // Jodie's quick tips float over the dock: closed as a user closes them, so the crop shows the subject.
    await page.evaluate(`document.querySelectorAll('.notification-close').forEach((b) => b.click())`);
    await wait(page, 200);
    const vp = page.viewportSize() ?? { width: 1600, height: 1000 };
    const x = Math.max(0, Math.floor(box.x - pad));
    const y = Math.max(0, Math.floor(box.y - pad));
    const width = Math.min(vp.width - x, Math.ceil(box.w + 2 * pad));
    const height = Math.min(vp.height - y, Math.ceil(box.h + 2 * pad));
    await page.screenshot({ path: `${CROPS}/${file}`, clip: { x, y, width, height } });
    console.log(`CROP  ${CROPS}/${file}  ${width}x${height}`);
}

// ── Page side, copied from codegen-check.ts (plain strings: no transform) ─────────────────────────

const IMPORT = (text: string) => String.raw`(async () => {
  const api = await import('/src/api/persistance/projects.ts');
  const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
  const before = count();
  await api.ProjectsApi.importFromText(${JSON.stringify(text)});
  for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
  const a = JSON.parse(localStorage.getItem('projects') || '[]');
  return a.length > before ? a[a.length - 1].id : null;
})()`;

const LOADED = (mm: string, m1: string) => String.raw`(() => {
  try {
    const all = Object.values(window.windoww.store.getState().idlookup).filter((d) => d && typeof d === 'object');
    const a = all.find((d) => d.className === 'DModel' && d.isMetamodel && d.name === ${JSON.stringify(mm)});
    const b = all.find((d) => d.className === 'DModel' && !d.isMetamodel && d.name === ${JSON.stringify(m1)});
    if (!a || !b || document.querySelectorAll('.dock-tab').length === 0) return null;
    return { mm: a.id, m1: b.id };
  } catch (e) { return null; }
})()`;

/** The fixture's ids by name, then its bags with the `state` setter, then its scenario stored on the model. */
const INSTALL = (ids: { mm: string; m1: string }) => String.raw`(async () => {
  const fx = ${JSON.stringify(ex.lookup)};
  const lk = () => window.windoww.store.getState().idlookup;
  const L = (x) => window.LPointerTargetable.fromPointer(x);
  const mmId = ${JSON.stringify(ids.mm)}, m1Id = ${JSON.stringify(ids.m1)};
  const under = (id, root) => { let d = lk()[id]; for (let i = 0; d && i < 40; i++) { if (d.id === root) return true; d = lk()[d.father]; } return false; };
  const all = Object.values(lk()).filter((d) => d && typeof d === 'object');
  const map = { MM: mmId, M: m1Id };
  const missing = [];
  for (const [fid, d] of Object.entries(fx)) {
    if (d.className === 'DClass') {
      const c = all.find((x) => x.className === 'DClass' && x.name === d.name && under(x.id, mmId));
      if (c) map[fid] = c.id; else missing.push(fid);
    }
  }
  for (const [fid, d] of Object.entries(fx)) {
    if (d.className === 'DAttribute' || d.className === 'DReference') {
      const f = all.find((x) => x.className === d.className && x.name === d.name && x.father === map[d.father]);
      if (f) map[fid] = f.id; else missing.push(fid);
    }
    if (d.className === 'DObject') {
      const o = all.find((x) => x.className === 'DObject' && x.name === d.name && under(x.id, m1Id));
      if (o) map[fid] = o.id; else missing.push(fid);
    }
  }
  const remap = (v) => (typeof v === 'string' && Object.prototype.hasOwnProperty.call(map, v) ? map[v] : v);
  L(mmId).state = { simEnabled: true };
  await new Promise((r) => setTimeout(r, 300));
  const bag = {};
  for (const [k, v] of Object.entries(fx.MM._state)) if (k !== 'simEnabled') bag[k] = remap(v);
  L(mmId).state = bag;
  await new Promise((r) => setTimeout(r, 300));
  const own = fx.M._state || {};
  if (Object.keys(own).length > 0) { L(m1Id).state = { ...own }; await new Promise((r) => setTimeout(r, 300)); }
  const SC = await import('/src/model/simulation/scenarioCodec.ts');
  const scenario = ${JSON.stringify(ex.scenario)};
  const full = { ...scenario, steps: scenario.steps.map((s) => ({ ...s, event: remap(s.event), selector: remap(s.selector) })) };
  L(m1Id).state = { [SC.RUN_SCENARIOS_KEY]: SC.encodeScenarios([full]) };
  await new Promise((r) => setTimeout(r, 300));
  return { map, missing };
})()`;

const CLICK = (expr: string) => String.raw`(() => { const el = ${expr}; if (!el) return { found: false }; el.click(); return { found: true }; })()`;
const BOX = (expr: string) => String.raw`(() => { const el = ${expr}; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`;

const BAR = `document.querySelector('.leftbar--project')`;
const SECTION = `document.querySelector('.leftbar--project .psb-section--generators')`;
const TAB = (tabId: string) => `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${tabId}"] .codegen-tpl'))`;

/** The left bar as the user reads it: the section labels in order, and the GENERATORS rows. */
const BAR_STATE = String.raw`(() => {
  const bar = ${BAR};
  if (!bar) return null;
  const labels = [...bar.querySelectorAll('.psb-section-label')].map((l) => l.textContent.trim());
  const sec = bar.querySelector('.psb-section--generators');
  return {
    labels,
    section: !!sec,
    rows: sec ? [...sec.querySelectorAll('.psb-item[data-generator]')].map((r) => r.getAttribute('data-generator') + ':' + r.querySelector('.psb-item-name').textContent) : [],
    groups: sec ? sec.querySelectorAll('.psb-group').length : 0,
    newEntry: sec ? !!sec.querySelector('.psb-new') : false,
  };
})()`;

/** The tab ids that are the active one of their dock panel. */
const ACTIVE = String.raw`(() => [...new Set([...document.querySelectorAll('[role="tab"][aria-selected="true"]')].map((t) => (t.id || '').replace(/^.*-tab-/, '')))].filter(Boolean))()`;

// ── Main ──────────────────────────────────────────────────────────────────────────────────────

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
await seed(ctx, true);
await ctx.addInitScript(() => { if (!sessionStorage.getItem('clb.started')) { sessionStorage.setItem('clb.started', '1'); localStorage.setItem('jjodel.experimental.codegen', 'true'); } });
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
const result: Record<string, any> = { url: URL };

async function main(): Promise<void> {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await poll(page, `!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 120000);
    await wait(page, 2000);
    const pid = await page.evaluate(IMPORT(readFileSync(scene(ex.scene), 'utf8'))) as string | null;
    check(`the scene ${ex.scene} is imported`, !!pid, String(pid));
    if (!pid) return;
    await page.goto(`${URL}/?open=${encodeURIComponent(pid)}#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    const loaded = await poll<{ mm: string; m1: string }>(page, LOADED(ex.lookup.MM.name, ex.lookup.M.name), 120000);
    check('the project loads', !!loaded, JSON.stringify(loaded));
    if (!loaded) return;
    await wait(page, 3000);
    const { mm, m1 } = loaded;
    const installed = await page.evaluate(INSTALL({ mm, m1 })) as any;
    check('every element of the fixture has its namesake in the app', installed.missing.length === 0, installed.missing);

    // One generator: the section, right after TRANSFORMS, lists the default.
    const one = await poll<any>(page, String.raw`(() => { const s = ${BAR_STATE}; return s && s.rows.length > 0 ? s : null; })()`, 30000);
    result.one = one;
    note('the left bar, one generator', one);
    const ti = one ? one.labels.indexOf('Transforms') : -1;
    check('the GENERATORS section comes right after TRANSFORMS', !!one && ti >= 0 && one.labels[ti + 1] === 'Generators', JSON.stringify(one && one.labels));
    check('it lists one row, «Default», the default generator', !!one && one.rows.length === 1 && one.rows[0] === 'default:Default', JSON.stringify(one && one.rows));
    check('one metamodel: no group header; a «New generator» entry', !!one && one.groups === 0 && one.newEntry, JSON.stringify(one));
    await wait(page, 500);
    await crop(page, 'leftbar_one.png', await page.evaluate(BOX(SECTION)) as any);

    // «+ New generator»: one metamodel, so no question; the generator is created and its tab opens.
    await page.evaluate(CLICK(`${SECTION}.querySelector('.psb-new')`));
    const two = await poll<any>(page, String.raw`(() => { const s = ${BAR_STATE}; return s && s.rows.length === 2 ? s : null; })()`, 15000);
    result.two = two;
    note('the left bar, two generators', two);
    check('after «New generator» the section lists two, the default first', !!two && two.rows[0] === 'default:Default' && /^g\d+:generator\d+$/.test(two.rows[1]), JSON.stringify(two && two.rows));
    const second = two ? two.rows[1].split(':')[0] : null;
    const stored = await page.evaluate(`(() => { const s = window.windoww.store.getState().idlookup[${JSON.stringify(mm)}]._state.genGenerators; return typeof s === 'string' ? JSON.parse(s).generators.map((g) => g.id) : null; })()`) as string[] | null;
    check('the new generator is stored in genGenerators', !!stored && !!second && stored.includes(second), JSON.stringify(stored));
    const newTabId = second ? `codegen_tpl_${mm}_${second}` : '';
    const newTab = second ? await poll<boolean>(page, `(() => { const t = ${TAB(newTabId)}; return !!t && t.offsetParent !== null; })()`, 15000) : null;
    check('the new generator\'s tab opens and is shown', newTab === true, newTabId);
    const sel = second ? await page.evaluate(`(() => { const t = ${TAB(newTabId)}; const s = t && t.querySelector('select[aria-label="Generator"]'); return s ? s.value : null; })()`) : null;
    check('its selector names the new generator', sel === second, String(sel));
    await wait(page, 800);
    await crop(page, 'leftbar_two.png', await page.evaluate(BOX(SECTION)) as any);
    await crop(page, 'tab_from_leftbar.png', await page.evaluate(BOX(TAB(newTabId))) as any);

    // A click on «Default» brings the default's tab forward.
    const defTabId = `codegen_tpl_${mm}`;
    await page.evaluate(CLICK(`${SECTION}.querySelector('.psb-item[data-generator="default"]')`));
    const defShown = await poll<boolean>(page, `(() => { const t = ${TAB(defTabId)}; return !!t && t.offsetParent !== null; })()`, 15000);
    const active = await page.evaluate(ACTIVE) as string[];
    note('active tabs after the «Default» click', active);
    check('the «Default» row opens the default generator\'s tab, shown and active', defShown === true && active.includes(defTabId), JSON.stringify(active));
    const defSel = await page.evaluate(`(() => { const t = ${TAB(defTabId)}; const s = t && t.querySelector('select[aria-label="Generator"]'); return s ? s.value : null; })()`);
    check('its selector names the default', defSel === 'default', String(defSel));
    // And the second row its own tab again.
    if (second) {
        await page.evaluate(CLICK(`${SECTION}.querySelector('.psb-item[data-generator="${second}"]')`));
        const back = await poll<boolean>(page, `(() => { const t = ${TAB(newTabId)}; return !!t && t.offsetParent !== null; })()`, 15000);
        check('the second row brings its generator\'s tab forward', back === true, String(back));
    }

    // The setting off, as Settings writes it: the section goes, without a reload.
    await page.evaluate(`(async () => { const s = await import('/src/codegen/setting.ts'); s.setCodegenEnabled(false); })()`);
    const off = await poll<any>(page, String.raw`(() => { const s = ${BAR_STATE}; return s && !s.section ? s : null; })()`, 10000);
    result.off = off;
    note('the left bar, setting off', off);
    check('with the setting off the GENERATORS section is absent', !!off && !off.section && !off.labels.includes('Generators'), JSON.stringify(off));
    check('TRANSFORMS and VIEWPOINTS stay', !!off && off.labels.includes('Transforms') && off.labels.includes('Viewpoints'), JSON.stringify(off && off.labels));
    await wait(page, 500);
    await crop(page, 'leftbar_off.png', await page.evaluate(BOX(BAR)) as any);

    // The setting on again: the section is back with both generators.
    await page.evaluate(`(async () => { const s = await import('/src/codegen/setting.ts'); s.setCodegenEnabled(true); })()`);
    const on = await poll<any>(page, String.raw`(() => { const s = ${BAR_STATE}; return s && s.section ? s : null; })()`, 10000);
    check('the setting on again: the section is back with both rows', !!on && on.rows.length === 2, JSON.stringify(on && on.rows));
}

try {
    await main();
} catch (e) {
    check('the probe ran to its end', false, String((e as Error).stack ?? e).slice(0, 400));
}
const own = errors.filter(e => /codegen|LeftBar|GeneratorPane|TemplateEditor/i.test(e));
result.errors = errors;
note('console errors', { total: errors.length, codegen: own.length });
check('no console error from the left bar or the generator tab', own.length === 0, own.slice(0, 5));
writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  (${OUT})`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
