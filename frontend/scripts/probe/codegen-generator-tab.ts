/**
 * codegen-generator-tab probe (P-2026-10-24-0003, completed by P-2026-10-24-0045 and P-2026-10-24-0318): the generator tab of slice G3
 * (R-GEN-35, R-GEN-40, R-GEN-41), on the Turnstile lecture example of codegen/examples/.
 *
 * Fresh context, Advanced mode, the experimental setting on. The scene is imported and the fixture's bags written
 * with the `state` setter (codegen-check.ts's page-side helpers, copied: that probe is not imported), the fixture's
 * scenario stored on the model. Then, as a user:
 *   - the Code pill of the model's editor opens the default generator's tab, `codegen_tpl_<mm>`, with that model
 *     chosen in the right pane; Preview shows the text of `main.js`, no error (crop tab_preview.png);
 *   - Alt+click on a model span whose template is not the selected one selects that template in the list (crop
 *     goto_template.png); the map gives a model fragment its template, no range, so no range is selected (crop
 *     goto_model.png); Alt+click on a literal span selects and reveals its producing range (crop goto_range.png);
 *     the gutter control of a hovered line names a template;
 *   - Run: `main()` returns (crop run_output.png); Check on the stored scenario passes (crop check_result.png);
 *   - «New generator»: its tab `codegen_tpl_<mm>_<id>` opens, the selector lists two generators (crop
 *     generator_selector.png); it has no template, so Preview, Run and Check show the empty state, no error, no gutter
 *     (crop empty_generator.png); with a template added, its target `none` keeps Run and Check disabled;
 *   - back on the default, a click on a model span selects that element's vertex in the model's editor (crop
 *     canvas_selection.png);
 *   - the pill, with two generators, shows a menu of both, the last used marked (crop pill_menu.png); its item opens
 *     that generator's tab.
 *
 * P-2026-10-24-1515: the tab opens beside the canvas, two panels side by side, and stays on screen after a fragment
 * click, also when stacked by hand on the canvas (crop beside_selection.png), the Properties/Tree rail over the
 * canvas, not the tab; moved out of the canvas panel, it joins the other generator tabs; the splitter is dragged, clamped,
 * stepped with the keyboard, reset, and its ratio kept over a reload (crops split_before.png, split_after.png).
 *
 * P-2026-10-24-1516: Preview is coloured by Monaco's tokenizer, every provenance span keeps its fragment, a hover outlines
 * every piece of the fragment (crops preview_coloured.png, preview_hovered.png), the span clicked on the canvas is coloured.
 *
 * P-2026-10-25-0925: with no generator tab the rail is the one-panel rail of 1630; opened from the pill beside the canvas
 * the rail collapses, the selected vertex after a fragment click lies inside the visible canvas (crop
 * beside_selection.png); moved into the canvas panel the rail comes back; a reload does not persist the collapse; the
 * last tab closed, the rail is back as it was (crop layout_closed.png).
 *
 * P-2026-10-25-1045: beside the canvas the tab has its header, title and close control (crop header_beside.png); a hover
 * inside the JS runtime, one fragment of hundreds of lines, outlines the hovered line only, the extent a gutter bar, no
 * text selected (crop runtime_hover.png); with the project page active, GENERATORS in the left bar opens the tab with
 * its header right of the page, the page still on screen (crop header_leftbar.png).
 *
 * P-2026-10-25-1200 (supersedes the placement right of the project page): with no canvas docked the tab opened from
 * GENERATORS is a tab of the first panel, listed in the app bar with bi-code-slash, «Default · <metamodel>», active,
 * its close, full width (crop appbar_generator.png); the project page active again, the entry stays (crop
 * appbar_project.png); the entry selects it, its close removes the dock tab. With a canvas docked it opens beside, no
 * app-bar entry (crop beside_unchanged.png); moved into the first panel and out by hand, one tab, listed only inside.
 * The dock after the reload is reported (generator tabs restored or not), not fixed.
 *
 * P-2026-10-25-1310, the finding's sequence: GENERATORS with the project page active (app-bar tab), the model canvas
 * opened, its Code pill: the tab moves beside the canvas, the canvas the active app-bar tab, no generator entry (crop
 * finding_pill_beside.png); GENERATORS with the project page in front moves it back to the first panel; a fragment
 * click from there opens the canvas and the tab moves beside it, the selection beside the code (crop
 * finding_fragment_beside.png).
 *
 * P-2026-10-25-1355: beside the canvas the boundary is rc-dock's divider, 7px to grab around its 1px line; a drag of
 * 150px from 2px off the line widens the tab by as much (crops divider_before.png, divider_after.png); a box with no
 * generator panel keeps the 1px divider.
 *
 * Crops, light theme, in ~/.jjodel-lanes/P-2026-10-24-0045/crops/ (CGT_CROPS), with their sizes printed.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/codegen-generator-tab.ts \
 *         --port 3131 --id P-2026-10-24-0045
 * Env:  CGT_OUT      JSON output (default frontend/scripts/smoke/_tmp_codegen-generator-tab.json, gitignored)
 *       CGT_CROPS    the folder of the crops
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3131/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const OUT = process.env.CGT_OUT || new globalThis.URL('../smoke/_tmp_codegen-generator-tab.json', import.meta.url).pathname;
const CROPS = process.env.CGT_CROPS || `${homedir()}/.jjodel-lanes/P-2026-10-24-0045/crops`;
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

const PANE = (m1Id: string) => `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1Id}"]'))`;
const TAB = (tabId: string) => `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${tabId}"] .codegen-tpl'))`;
const CLICK = (expr: string) => String.raw`(() => { const el = ${expr}; if (!el) return { found: false }; el.click(); return { found: true }; })()`;
const BOX = (expr: string) => String.raw`(() => { const el = ${expr}; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`;

/** The tab as the user reads it: generator selector, selected template, the pane's mode, model and controls. */
const STATE = (tab: string) => String.raw`(() => {
  const t = ${tab};
  if (!t) return null;
  const sel = t.querySelector('select[aria-label="Generator"]');
  const item = t.querySelector('.codegen-tpl__item[aria-selected="true"] .codegen-tpl__item-name');
  const pane = t.querySelector('.codegen-pane');
  const model = pane && pane.querySelector('select[aria-label="Model"]');
  const mode = pane && pane.querySelector('.codegen-pane__modes [aria-selected="true"]');
  const btn = (re) => pane && [...pane.querySelectorAll('.codegen-panel__run button')].find((b) => re.test(b.textContent.trim()));
  const run = btn(/^Run(ning)?$/), chk = btn(/^Check(ing)?$/);
  const pass = pane && pane.querySelector('.codegen-panel__result--pass');
  const bad = pane && pane.querySelector('.codegen-panel__result--error');
  const ok = pane && pane.querySelector('.codegen-panel__result:not(.codegen-panel__result--pass):not(.codegen-panel__result--error)');
  return {
    generators: sel ? [...sel.options].map((o) => o.value + ':' + o.textContent) : null,
    generator: sel ? sel.value : null,
    template: item ? item.textContent : null,
    mode: mode ? mode.textContent.trim() : null,
    model: model ? model.value : null,
    target: pane ? (pane.querySelector('.codegen-pane__target') || {}).textContent || null : null,
    files: pane ? [...pane.querySelectorAll('.codegen-pane__file')].map((f) => f.textContent) : [],
    lines: pane ? pane.querySelectorAll('.codegen-panel__line').length : 0,
    errors: pane ? [...pane.querySelectorAll('.codegen-panel__error')].map((e) => e.textContent) : [],
    empty: pane ? ((pane.querySelector('.codegen-panel__hint--empty') || {}).textContent || null) : null,
    gutters: pane ? pane.querySelectorAll('.codegen-panel__gutter').length : 0,
    redHints: pane ? pane.querySelectorAll('.codegen-panel__hint--error, .codegen-panel__result--error').length : 0,
    run: run ? { disabled: run.disabled, title: run.title, text: run.textContent.trim() } : null,
    check: chk ? { disabled: chk.disabled, title: chk.title, text: chk.textContent.trim() } : null,
    returned: ok ? { label: (ok.querySelector('.codegen-panel__label') || {}).textContent || null, value: ((ok.querySelector('.codegen-panel__value') || {}).textContent || '').slice(0, 120) } : null,
    pass: pass ? pass.textContent.trim() : null,
    error: bad ? bad.textContent.trim().slice(0, 200) : null,
  };
})()`;

/** The active tab of every dock panel, and where the model's editor is laid out against the viewport. */
const DOCK = (m1Id: string) => String.raw`(() => {
  const active = [...document.querySelectorAll('.dock-tab-active [role="tab"], [role="tab"][aria-selected="true"]')].map((t) => (t.id || '').replace(/^.*-tab-/, ''));
  const p = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1Id}"]');
  const r = p ? p.getBoundingClientRect() : null;
  const scrolled = [];
  for (let e = p && p.parentElement; e; e = e.parentElement) if (e.scrollLeft) scrolled.push((e.className || e.tagName).toString().slice(0, 60) + ' ' + e.scrollLeft);
  return { active: [...new Set(active)].filter(Boolean), pane: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null, inView: !!r && r.x >= 0 && r.x + r.width <= innerWidth + 1, scrolled };
})()`;

/** The model's editor and the generator tab: both laid out, in two dock panels, side by side (P-2026-10-24-1515). */
const BESIDE = (m1Id: string, tabId: string) => String.raw`(() => {
  const p = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1Id}"]');
  const t = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${tabId}"]');
  if (!p || !t) return { found: false };
  const box = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  const a = box(p), b = box(t);
  const code = t.querySelector('.codegen-pane__code');
  const c = code ? box(code) : null;
  const rail = document.querySelector('.properties-tree-overlay:not(.properties-tree-overlay--collapsed)');
  const shown = (e, r) => e.offsetParent !== null && r.w > 0 && r.h > 0 && r.x >= 0 && r.x + r.w <= innerWidth + 1;
  return {
    found: true, canvas: a, tab: b, code: c,
    panels: p.closest('.dock-panel') !== t.closest('.dock-panel'),
    visible: shown(p, a) && shown(t, b) && !!code && shown(code, c),
    sideBySide: a.x + a.w <= b.x + 2 && a.y < b.y + b.h && b.y < a.y + a.h,
    share: Math.round(1000 * b.w / (a.w + b.w)) / 1000,
    rail: rail ? box(rail) : null,
    railOnCanvas: !rail || (box(rail).x + box(rail).w <= a.x + a.w + 2 && box(rail).x + box(rail).w <= b.x + 2),
  };
})()`;

/** The tab header of a dock tab: in the DOM, laid out, in the viewport, its title and close control (P-2026-10-25-1045). */
const HEADER = (tabId: string) => String.raw`(() => {
  const t = document.querySelector('[role="tab"][id$="-tab-${tabId}"]');
  if (!t) return { inDom: false };
  const r = t.getBoundingClientRect();
  const bar = t.closest('.dock-bar');
  const close = t.querySelector('.codegen-tpl-title__close');
  const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  return {
    inDom: true, box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    visible: r.width > 0 && r.height > 0 && r.x >= 0 && r.x + r.width <= innerWidth + 1 && r.y >= 0 && !!bar && getComputedStyle(bar).display !== 'none' && !!hit && t.contains(hit),
    title: (t.textContent || '').trim(), close: !!close && close.getBoundingClientRect().width > 0,
    panel: (t.closest('.dock-panel') || {}).className || null,
  };
})()`;
const visibleHeader = (h: any) => !!h && h.inDom && h.visible && h.close && /^Default · /.test(h.title);

/** The dock divider left of the generator tab's panel: shown, its width, which points 3px off its line grab it (P-2026-10-25-1355). */
const DIVIDER = (tabId: string) => String.raw`(() => {
  const t = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${tabId}"]');
  const panel = t && t.closest('.dock-panel');
  const d = panel && panel.previousElementSibling;
  if (!d || !d.classList.contains('dock-divider')) return { found: false };
  const r = d.getBoundingClientRect(), p = panel.getBoundingClientRect(), cs = getComputedStyle(d);
  const line = r.x + r.width / 2, y = r.y + r.height / 2;
  const at = (x) => { const e = document.elementFromPoint(x, y); return !!e && (e === d || d.contains(e)); };
  return { found: true, display: cs.display, width: Math.round(r.width * 10) / 10, cursor: cs.cursor, line, y, hit: [line - 3, line, line + 3].map(at), tabWidth: Math.round(p.width) };
})()`;
/** Every divider of a dock box that holds no generator panel: shown or not, and its width (P-2026-10-25-1355). */
const PLAIN_DIVIDERS = String.raw`(() => [...document.querySelectorAll('.not-strip > .dock-layout .dock-hbox > .dock-divider')]
  .filter((d) => ![...d.parentElement.children].some((c) => c.classList.contains('dock-style-codegen')))
  .map((d) => ({ display: getComputedStyle(d).display, basis: getComputedStyle(d).flexBasis, width: Math.round(d.getBoundingClientRect().width * 10) / 10 })))()`;

/** The Properties/Tree rail: its box while on screen, and the canvas inset it publishes (P-2026-10-25-0925). */
const RAIL = String.raw`(() => {
  const r = document.querySelector('.properties-tree-overlay:not(.properties-tree-overlay--collapsed)');
  const b = r ? r.getBoundingClientRect() : null;
  return { shown: !!b && b.width > 0, box: b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null, inset: document.body.style.getPropertyValue('--jj-canvas-right-inset') };
})()`;
/** Every dock panel: its tabs and the one it shows. */
const LAYOUT = String.raw`(async () => {
  const d = (await import('/src/components/abstract/DockManager.tsx')).default.dock;
  const walk = (n) => n.tabs ? [{ tabs: n.tabs.map((t) => t.id.slice(-24)), active: (n.activeId || '').slice(-24) }] : (n.children || []).flatMap(walk);
  return walk(d.getLayout().dockbox);
})()`;
/** The one-panel rail of P-2026-10-24-1630 on the Turnstile model: overlay x 1200, 400×877, inset 408px. */
const onePanelRail = (r: any) => !!r && r.shown && r.box.x === 1200 && r.box.w === 400 && r.box.h === 877 && r.inset === '408px';

/** The editor column's share of the width right of the template list, and the splitter (P-2026-10-24-1515). */
const SPLIT = (tab: string) => String.raw`(() => {
  const t = ${tab};
  if (!t) return null;
  const main = t.querySelector('.codegen-tpl__main'), bar = t.querySelector('.codegen-tpl__splitter');
  if (!main || !bar) return null;
  const r = t.getBoundingClientRect(), m = main.getBoundingClientRect(), s = bar.getBoundingClientRect();
  // The ratio is the share of what grows: the columns' paddings and borders left out, as TemplateEditorTab measures it.
  const frame = (el) => { if (!el) return 0; const cs = getComputedStyle(el); return [cs.paddingLeft, cs.paddingRight, cs.borderLeftWidth, cs.borderRightWidth].reduce((n, v) => n + (parseFloat(v) || 0), 0); };
  const fm = frame(main), fp = frame(bar.nextElementSibling);
  return { ratio: Math.round(1000 * (m.width - fm) / (r.right - m.left - s.width - fm - fp)) / 1000, main: Math.round(m.width), bar: { x: s.x + s.width / 2, y: s.y + s.height / 2, w: s.width }, stored: localStorage.getItem('jjodel.codegen.tabSplit'), focusable: bar.tabIndex === 0, role: bar.getAttribute('role') };
})()`;

/** The template editor's Monaco instance in the tab: its model's first line, the selection, the lines in view. */
const EDITOR = (tab: string) => String.raw`(async () => {
  const t = ${tab};
  if (!t) return null;
  const J = await import('/src/joiner/index.ts');
  const ed = J.monaco.editor.getEditors().find((e) => t.contains(e.getContainerDomNode()));
  if (!ed || !ed.getModel()) return null;
  const s = ed.getSelection();
  const v = ed.getVisibleRanges()[0];
  return {
    selection: s ? { line: s.startLineNumber, column: s.startColumn, endLine: s.endLineNumber, endColumn: s.endColumn } : null,
    selected: s ? ed.getModel().getValueInRange(s).slice(0, 80) : '',
    visible: v ? [v.startLineNumber, v.endLineNumber] : null,
    painted: ed.getContainerDomNode().querySelectorAll('.selected-text').length,
    lines: ed.getModel().getLineCount(),
  };
})()`;

const mode = (page: Page, tab: string, label: string) => page.evaluate(CLICK(`[...${tab}.querySelectorAll('.codegen-pane__modes button')].find((b) => b.textContent.trim() === '${label}')`));

// ── Main ──────────────────────────────────────────────────────────────────────────────────────

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
await seed(ctx, true);
await ctx.addInitScript(() => { localStorage.setItem('jjodel.experimental.codegen', 'true'); });
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

    // The model's editor, its pill: one generator, so the default's tab opens at once with this model chosen.
    await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(m1)})); })()`);
    const pane = PANE(m1);
    await poll(page, `(() => { const p = ${pane}; return !!p && p.querySelectorAll('.react-flow__node').length > 0; })()`, 60000);
    await wait(page, 2000);
    check('the Code pill is on the model\'s editor', !!(await poll(page, `!!(${pane} && ${pane}.querySelector('.codegen-pill button'))`, 30000)), '');
    const railAlone = await page.evaluate(RAIL) as any;
    result.railAlone = railAlone;
    note('the rail with no generator tab', railAlone);
    check('with no generator tab the rail is the one-panel rail of 1630: x 1200, 400x877, inset 408px (P-2026-10-25-0925)', onePanelRail(railAlone), JSON.stringify(railAlone));
    await page.evaluate(CLICK(`${pane}.querySelector('.codegen-pill button')`));
    const tabId = `codegen_tpl_${mm}`;
    const tab = TAB(tabId);
    const opened = await poll<any>(page, String.raw`(() => { const s = ${STATE(tab)}; return s && s.lines > 0 ? s : null; })()`, 90000);
    result.opened = opened;
    note('the tab the pill opened', opened);
    check(`the pill opens the default generator's tab ${tabId}, Preview, the model chosen`,
        !!opened && opened.generator === 'default' && opened.mode === 'Preview' && opened.model === m1, JSON.stringify(opened && { generator: opened.generator, mode: opened.mode, model: opened.model }));
    check('Preview shows the text of main.js with no generation error', !!opened && opened.files.join() === 'main.js' && opened.errors.length === 0 && opened.lines > 5,
        JSON.stringify(opened && { files: opened.files, lines: opened.lines, errors: opened.errors.slice(0, 3) }));
    note('the dock once the tab is open', await page.evaluate(DOCK(m1)));
    const beside = await page.evaluate(BESIDE(m1, tabId)) as any;
    result.beside = beside;
    note('the canvas and the tab once open', beside);
    check('the tab opens beside the canvas: two panels, both visible, side by side, the tab about 45 %',
        beside.found && beside.panels && beside.visible && beside.sideBySide && Math.abs(beside.share - 0.45) < 0.06, JSON.stringify(beside));
    const headBeside = await page.evaluate(HEADER(tabId)) as any;
    result.headerBeside = headBeside;
    note('the tab header beside the canvas', headBeside);
    check('beside the canvas the tab has its header: in the DOM, visible, «Default · <metamodel>», its close control (P-2026-10-25-1045)', visibleHeader(headBeside), JSON.stringify(headBeside));
    if (beside.found) await crop(page, 'header_beside.png', { x: beside.canvas.x, y: Math.max(0, beside.tab.y - 60), w: beside.tab.x + beside.tab.w - beside.canvas.x, h: 260 }, 0);
    const railOpen = await poll<any>(page, `(() => { const r = ${RAIL}; return r.shown ? null : r; })()`, 5000);
    result.railBeside = railOpen;
    check('opened from the pill beside the canvas, the Properties/Tree rail is collapsed, inset 0px (P-2026-10-25-0925)', !!railOpen && railOpen.inset === '0px', JSON.stringify(railOpen ?? await page.evaluate(RAIL)));
    check('no floating editor panel is left on the canvas', !(await page.evaluate(`!!(${pane}.querySelector('.codegen-panel'))`)), '');
    await wait(page, 500);
    await crop(page, 'rail_beside.png', beside.found ? { x: beside.canvas.x, y: Math.min(beside.canvas.y, beside.tab.y), w: beside.tab.x + beside.tab.w - beside.canvas.x, h: Math.max(beside.canvas.h, beside.tab.h) } : null, 0);
    await crop(page, 'tab_preview.png', await page.evaluate(BOX(tab)) as any);

    // P-2026-10-24-1516: the text coloured by Monaco's javascript tokenizer, the provenance kept on every piece.
    const colour = await poll<any>(page, String.raw`(() => {
      const code = ${tab}.querySelector('.codegen-pane__code');
      const toks = code ? [...code.querySelectorAll('.code-tok')] : [];
      if (toks.length === 0) return null;
      const kw = toks.filter((t) => t.classList.contains('code-tok--keyword'));
      const words = new Set(kw.map((t) => t.textContent));
      const spans = [...code.querySelectorAll('.code-span')];
      return {
        toks: toks.length, keywords: kw.length, hasConst: words.has('const'), hasFunction: words.has('function'),
        classes: [...new Set(toks.map((t) => [...t.classList].find((c) => c.startsWith('code-tok--'))))].sort(),
        keywordColour: kw[0] ? getComputedStyle(kw[0]).color : null,
        spans: spans.length, colouredSpans: spans.filter((x) => x.classList.contains('code-tok')).length,
        spansWithoutFragment: spans.filter((x) => !x.hasAttribute('data-fragment')).length,
      };
    })()`, 15000);
    result.colour = colour;
    note('the colouring of the Preview', colour);
    check('Preview is coloured: keyword pieces on const and function, three classes or more, the keyword in the theme colour',
        !!colour && colour.hasConst && colour.hasFunction && colour.classes.length >= 3 && colour.keywordColour === 'rgb(14, 165, 233)', JSON.stringify(colour));
    check('every provenance span keeps its fragment, coloured or not', !!colour && colour.colouredSpans > 0 && colour.spansWithoutFragment === 0, JSON.stringify(colour && { spans: colour.spans, coloured: colour.colouredSpans, without: colour.spansWithoutFragment }));
    // The crops with the right pane widened (splitter to its minimum), reset afterwards to the fresh state.
    const sc = await page.evaluate(SPLIT(tab)) as any;
    if (sc) {
        await page.mouse.move(sc.bar.x, sc.bar.y);
        await page.mouse.down();
        await page.mouse.move(sc.bar.x - 600, sc.bar.y, { steps: 8 });
        await page.mouse.up();
        await wait(page, 300);
    }
    await page.evaluate(`(() => { const c = ${tab}.querySelector('.codegen-pane__code'); c.scrollLeft = 0; c.scrollTop = 0; })()`);
    const codeBox = await page.evaluate(BOX(`${tab}.querySelector('.codegen-pane__code')`)) as any;
    note('the code view for the colour crops', codeBox);
    await crop(page, 'preview_coloured.png', codeBox);
    // A fragment cut into several coloured pieces, on screen: the mouse goes to it, no scroll.
    const hoverAt = await page.evaluate(String.raw`(() => {
      const code = ${tab}.querySelector('.codegen-pane__code');
      const box = code.getBoundingClientRect();
      const seen = (x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.left >= box.left + 40 && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom; };
      const spans = [...code.querySelectorAll('.code-span.code-tok[data-fragment]')].filter(seen);
      const pieces = (x) => code.querySelectorAll('.code-span[data-fragment="' + x.getAttribute('data-fragment') + '"]').length;
      const s = spans.find((x) => pieces(x) >= 3) || spans[0];
      if (!s) return null;
      s.setAttribute('data-probe-hover', '1');
      const r = s.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, pieces: pieces(s) };
    })()`) as any;
    if (hoverAt) {
        await page.mouse.move(hoverAt.x, hoverAt.y);
        await wait(page, 200);
        const hovered = await page.evaluate(String.raw`(() => {
          const s = document.querySelector('[data-probe-hover="1"]');
          const f = s.getAttribute('data-fragment');
          const same = [...${tab}.querySelectorAll('.codegen-pane__code .code-span[data-fragment="' + f + '"]')];
          const classes = [...new Set(same.map((x) => [...x.classList].find((c) => c.startsWith('code-tok--'))))].filter(Boolean);
          // In scope (P-2026-10-25-1045): every piece of a fragment of three lines at most, else the pieces of the hovered line.
          const lineOf = (x) => x.closest('[data-line]').getAttribute('data-line');
          const lines = new Set(same.map(lineOf)).size;
          const scoped = lines <= 3 ? same : same.filter((x) => lineOf(x) === lineOf(s));
          return { fragment: f, pieces: same.length, lines, scoped: scoped.length, classes, hovered: scoped.filter((x) => x.classList.contains('code-span--hover')).length, others: ${tab}.querySelectorAll('.code-span--hover').length };
        })()`) as any;
        note('a coloured fragment hovered', hovered);
        check('hovering a fragment cut into coloured pieces outlines every piece in scope (whole up to 3 lines, else the hovered line), and only them', hovered.pieces >= 2 && hovered.scoped >= 2 && hovered.hovered === hovered.scoped && hovered.others === hovered.scoped, JSON.stringify(hovered));
        await crop(page, 'preview_hovered.png', codeBox);
        await page.mouse.move(0, 0);
    } else {
        check('a coloured fragment on screen to hover', false, '');
    }
    // P-2026-10-25-1045: inside the JS runtime, one fragment of hundreds of lines, a hover outlines the hovered line only
    // and draws the fragment's extent as a bar in the gutter.
    const runtimeAt = await page.evaluate(String.raw`(() => {
      const code = ${tab}.querySelector('.codegen-pane__code');
      const by = new Map();
      code.querySelectorAll('.code-span[data-fragment]').forEach((x) => { const f = x.getAttribute('data-fragment'); const l = +x.closest('[data-line]').getAttribute('data-line'); const e = by.get(f) || { first: l, last: l }; by.set(f, { first: Math.min(e.first, l), last: Math.max(e.last, l) }); });
      const [f, ext] = [...by.entries()].sort((a, b) => (b[1].last - b[1].first) - (a[1].last - a[1].first))[0] || [];
      if (!f) return null;
      const line = ext.first + 6;
      const row = code.querySelector('[data-line="' + line + '"]');
      code.scrollTop = Math.max(0, row.offsetTop - 120);
      const s = row.querySelector('.code-span[data-fragment="' + f + '"]');
      if (!s) return null;
      const r = s.getBoundingClientRect();
      return { fragment: f, first: ext.first, last: ext.last, line, x: r.x + Math.min(20, r.width / 2), y: r.y + r.height / 2 };
    })()`) as any;
    note('the runtime fragment', runtimeAt);
    if (runtimeAt) {
        await page.mouse.move(runtimeAt.x, runtimeAt.y);
        await wait(page, 200);
        const rh = await page.evaluate(String.raw`(() => {
          const code = ${tab}.querySelector('.codegen-pane__code');
          const hov = [...code.querySelectorAll('.code-span--hover')];
          const bars = [...code.querySelectorAll('.codegen-pane__gutter--extent')].map((g) => +g.closest('[data-line]').getAttribute('data-line'));
          const g = code.querySelector('.codegen-pane__gutter--extent');
          return { hoveredLines: [...new Set(hov.map((x) => +x.closest('[data-line]').getAttribute('data-line')))], bars: bars.length, barFirst: bars[0], barLast: bars[bars.length - 1], barShadow: g ? getComputedStyle(g).boxShadow : null, selection: String(getSelection()).length };
        })()`) as any;
        result.runtimeHover = rh;
        note('a hover inside the runtime', rh);
        check('a hover inside the runtime outlines the hovered line only (P-2026-10-25-1045)', rh.hoveredLines.length === 1 && rh.hoveredLines[0] === runtimeAt.line, JSON.stringify(rh.hoveredLines));
        check('the runtime fragment\'s extent is a bar over its lines in the gutter, the text not selected', rh.bars === runtimeAt.last - runtimeAt.first + 1 && rh.barFirst === runtimeAt.first && rh.barLast === runtimeAt.last && !!rh.barShadow && rh.barShadow !== 'none' && rh.selection === 0, JSON.stringify(rh));
        await crop(page, 'runtime_hover.png', await page.evaluate(BOX(`${tab}.querySelector('.codegen-pane__code')`)) as any);
        await page.mouse.click(runtimeAt.x, runtimeAt.y);
        await wait(page, 200);
        check('a click inside the runtime selects no text', (await page.evaluate(`String(getSelection()).length`)) === 0, '');
        await page.mouse.move(0, 0);
    } else {
        check('a runtime fragment on screen to hover', false, '');
    }
    if (sc) {
        const sw = await page.evaluate(SPLIT(tab)) as any;
        await page.mouse.dblclick(sw.bar.x, sw.bar.y);
        await page.evaluate(`localStorage.removeItem('jjodel.codegen.tabSplit')`);
        await wait(page, 300);
        note('the split reset after the colour crops', await page.evaluate(SPLIT(tab)));
    }

    // «Go to template»: Alt+click a span whose template is not the selected one.
    const before = opened?.template ?? null;
    const target = await page.evaluate(String.raw`(() => {
      const spans = [...${tab}.querySelectorAll('.codegen-pane__code .code-span--model[data-template]')];
      const s = spans.find((x) => x.getAttribute('data-template') !== ${JSON.stringify(before)});
      if (!s) return null;
      s.setAttribute('data-probe-alt', '1');
      return s.getAttribute('data-template');
    })()`) as string | null;
    check('a model span names a template other than the selected one', !!target, `${before} -> ${target}`);
    if (target) {
        await page.locator('[data-probe-alt="1"]').click({ modifiers: ['Alt'] });
        const picked = await poll<string>(page, String.raw`(() => { const s = ${STATE(tab)}; return s && s.template === ${JSON.stringify(target)} ? s.template : null; })()`, 5000);
        check(`Alt+click selects the template «${target}» in the list`, picked === target, String(picked));
        await crop(page, 'goto_template.png', await page.evaluate(BOX(`${tab}.querySelector('.codegen-tpl__side')`)) as any);
        // A model fragment's origin names its template, not a range (text.ts ModelOrigin): the editor shows the template, nothing selected.
        const shown = await poll<any>(page, String.raw`(async () => { const e = await ${EDITOR(tab)}; return e && e.lines > 0 ? e : null; })()`, 5000);
        result.modelRange = shown;
        note('the template editor after the Alt+click on a model span', shown);
        check('a model span: the template is in the editor, no range selected (the map gives none)',
            !!shown && !!shown.selection && shown.selection.line === shown.selection.endLine && shown.selection.column === shown.selection.endColumn, JSON.stringify(shown));
        await wait(page, 300);
        await crop(page, 'goto_model.png', await page.evaluate(BOX(`${tab}.querySelector('.codegen-tpl__main') || ${tab}`)) as any);
        // A literal fragment's origin gives its range: selected in the template's editor, in view and painted.
        const literal = await page.evaluate(String.raw`(() => {
          const spans = [...${tab}.querySelectorAll('.codegen-pane__code .code-span--literal[data-template]')];
          const s = spans.find((x) => x.getAttribute('data-template') !== ${JSON.stringify(target)} && x.textContent.trim().length > 2);
          if (!s) return null;
          s.setAttribute('data-probe-lit', '1');
          return { template: s.getAttribute('data-template'), text: s.textContent.slice(0, 60) };
        })()`) as { template: string; text: string } | null;
        check('a literal span of another template', !!literal, JSON.stringify(literal));
        if (literal) {
            await page.locator('[data-probe-lit="1"]').scrollIntoViewIfNeeded();
            await page.locator('[data-probe-lit="1"]').click({ modifiers: ['Alt'] });
            const range = await poll<any>(page, String.raw`(async () => { const s = ${STATE(tab)}; if (!s || s.template !== ${JSON.stringify(literal.template)}) return null; const e = await ${EDITOR(tab)}; return e && e.selection && (e.selection.line !== e.selection.endLine || e.selection.column !== e.selection.endColumn) ? e : null; })()`, 5000);
            result.range = { literal, range };
            note('the template editor after the Alt+click on a literal span', { literal, range });
            check(`Alt+click on a literal span of «${literal.template}» selects its producing range, in view and painted`,
                !!range && !!range.visible && range.selection.line >= range.visible[0] && range.selection.line <= range.visible[1] && range.painted > 0 && range.selected.length > 0,
                JSON.stringify(range));
            await wait(page, 300);
            await crop(page, 'goto_range.png', await page.evaluate(BOX(tab)) as any);
        }
    }
    note('the dock after the Alt+click', await page.evaluate(DOCK(m1)));
    // The gutter control on a hovered line.
    await page.locator(`[role="tabpanel"][aria-labelledby$="-tab-${tabId}"] .codegen-pane__code .codegen-panel__line [data-template]`).first().hover();
    const jump = await poll<string>(page, `(() => { const b = ${tab}.querySelector('.codegen-pane__jump'); return b ? b.title : null; })()`, 3000);
    check('the gutter of a hovered line offers «go to template»', !!jump && /^Go to template \S+/.test(jump), String(jump));

    // Run.
    await mode(page, tab, 'Run');
    await poll(page, `(() => { const s = ${STATE(tab)}; return s && s.run && !s.run.disabled; })()`, 10000);
    await page.evaluate(CLICK(`[...${tab}.querySelectorAll('.codegen-panel__run button')].find((b) => b.textContent.trim() === 'Run')`));
    const ran = await poll<any>(page, String.raw`(() => { const s = ${STATE(tab)}; return s && (s.returned || s.error) ? s : null; })()`, 60000);
    result.run = ran;
    note('Run', ran && { returned: ran.returned, error: ran.error });
    check('Run on target js: main() returns', !!ran?.returned && /^main\(\) returned, \d+ ms$/.test(ran.returned.label ?? ''), JSON.stringify(ran?.returned ?? ran?.error ?? null));
    await crop(page, 'run_output.png', await page.evaluate(BOX(`${tab}.querySelector('.codegen-pane')`)) as any);

    // Check on the stored scenario.
    await mode(page, tab, 'Check');
    await poll(page, `(() => { const s = ${STATE(tab)}; return s && s.check && !s.check.disabled; })()`, 10000);
    await page.evaluate(CLICK(`[...${tab}.querySelectorAll('.codegen-panel__run button')].find((b) => b.textContent.trim() === 'Check')`));
    const checked = await poll<any>(page, String.raw`(() => { const s = ${STATE(tab)}; return s && (s.pass || s.error) && s.check && s.check.text === 'Check' ? s : null; })()`, 90000);
    result.check = checked;
    const n = ex.scenario.steps.length;
    check(`Check passes on «${ex.scenario.name}», ${n} steps`, checked?.pass === `Agrees with the simulator on ${n} steps · ${ex.scenario.name}`, JSON.stringify(checked?.pass ?? checked?.error ?? null));
    await crop(page, 'check_result.png', await page.evaluate(BOX(`${tab}.querySelector('.codegen-pane')`)) as any);

    // A second generator: its own tab, target none, so neither Run nor Check.
    await page.evaluate(CLICK(`${tab}.querySelector('button[aria-label="New generator"]')`));
    const second = await poll<{ id: string; s: any }>(page, String.raw`(() => {
      const panels = [...document.querySelectorAll('[role="tabpanel"]')].filter((p) => (p.getAttribute('aria-labelledby') || '').includes('-tab-codegen_tpl_${mm}_'));
      const p = panels.find((x) => x.querySelector('.codegen-tpl') && x.offsetParent !== null) || panels[0];
      if (!p) return null;
      const id = p.getAttribute('aria-labelledby').replace(/^.*-tab-/, '');
      const s = ${STATE(`(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-' + id + '"] .codegen-tpl'))`)};
      return s && s.generators && s.generators.length === 2 && !s.generators.some((g) => / \(gone\)$/.test(g)) && s.target ? { id, s } : null;
    })()`, 20000);
    result.second = second;
    note('the second generator', second);
    check(`«New generator» opens its own tab codegen_tpl_${mm}_<id>, the selector lists two generators`,
        !!second && second.id === `codegen_tpl_${mm}_${second.s.generator}` && second.s.generator !== 'default' && second.s.generators.length === 2, JSON.stringify(second && { id: second.id, generators: second.s.generators }));
    if (second) {
        const tab2 = TAB(second.id);
        await crop(page, 'generator_selector.png', await page.evaluate(BOX(`${tab2}.querySelector('.codegen-tpl__side')`)) as any);
        check('the new generator\'s target is none', second.s.target === 'target none', String(second.s.target));
        // No template yet: one neutral empty state in every mode, no error, no gutter, nothing to run.
        const EMPTY_TEXT = 'No templates yet. «New template» on the left adds the first one.';
        const modes: Record<string, any> = {};
        for (const m of ['Preview', 'Run', 'Check']) {
            await mode(page, tab2, m);
            await wait(page, 700);
            modes[m] = await page.evaluate(STATE(tab2));
        }
        result.empty = modes;
        note('the empty generator', Object.fromEntries(Object.entries(modes).map(([k, v]) => [k, v && { empty: v.empty, errors: v.errors, gutters: v.gutters, lines: v.lines, redHints: v.redHints, run: v.run, check: v.check }])));
        check('an empty generator shows the empty state in Preview, Run and Check, no error, no gutter, no Run or Check',
            Object.values(modes).every((v: any) => v && v.empty === EMPTY_TEXT && v.errors.length === 0 && v.gutters === 0 && v.lines === 0 && v.redHints === 0 && v.run === null && v.check === null && v.files.length === 0),
            JSON.stringify(Object.fromEntries(Object.entries(modes).map(([k, v]) => [k, v && { empty: v.empty, errors: v.errors, gutters: v.gutters, redHints: v.redHints }]))));
        await mode(page, tab2, 'Preview');
        await wait(page, 300);
        await crop(page, 'empty_generator.png', await page.evaluate(BOX(tab2)) as any);
        // With a template, the target none keeps Run and Check off (R-GEN-35).
        await page.evaluate(CLICK(`${tab2}.querySelector('.codegen-tpl__add')`));
        await poll(page, `(() => { const s = ${STATE(tab2)}; return s && s.empty === null && s.template ? true : null; })()`, 10000);
        await mode(page, tab2, 'Run');
        await wait(page, 300);
        const r2 = await page.evaluate(STATE(tab2)) as any;
        await mode(page, tab2, 'Check');
        await wait(page, 300);
        const c2 = await page.evaluate(STATE(tab2)) as any;
        check('on target none Run and Check are disabled (R-GEN-35)', r2?.run?.disabled === true && c2?.check?.disabled === true,
            JSON.stringify({ run: r2?.run, check: c2?.check }));
    }

    // Back on the default (its tab, from the selector), a click on a model span selects the vertex on the canvas.
    await page.evaluate(String.raw`(async () => { const o = await import('/src/codegen/ui/openTemplateEditor.ts'); o.openTemplateEditor(${JSON.stringify(mm)}, ${JSON.stringify(ex.lookup.MM.name)}, null, 'default'); })()`);
    await poll(page, `!!(${tab} && ${tab}.offsetParent !== null && ${tab}.querySelector('.codegen-pane__code .code-span--model[data-origin-id]'))`, 10000);
    await mode(page, tab, 'Preview');
    await wait(page, 300);
    const element = await page.evaluate(String.raw`(() => {
      const lk = window.windoww.store.getState().idlookup;
      const spans = [...${tab}.querySelectorAll('.codegen-pane__code .code-span--model[data-origin-id]')];
      const objects = spans.filter((x) => (lk[x.getAttribute('data-origin-id')] || {}).className === 'DObject');
      const s = objects.find((x) => x.classList.contains('code-tok')) || objects[0];
      if (!s) return null;
      s.setAttribute('data-probe-pick', '1');
      return s.getAttribute('data-origin-id');
    })()`) as string | null;
    check('a span from a model object', !!element, String(element));
    if (element) {
        // A DOM click, as the mouse gives it: Playwright's own click scrolls every ancestor to the span first.
        note('the dock before the span click', await page.evaluate(DOCK(m1)));
        check('the span clicked is coloured (P-2026-10-24-1516)', await page.evaluate(`!!document.querySelector('[data-probe-pick="1"].code-tok')`) as boolean, '');
        await page.evaluate(CLICK(`document.querySelector('[data-probe-pick="1"]')`));
        const selected = await poll<string[]>(page, String.raw`(() => {
          const p = ${pane};
          if (!p || p.offsetParent === null) return null;
          const lk = window.windoww.store.getState().idlookup;
          const s = [...p.querySelectorAll('.react-flow__node.selected')].map((n) => (lk[n.getAttribute('data-id')] || {}).model || n.getAttribute('data-id'));
          return s.length > 0 ? s : null;
        })()`, 5000);
        result.selected = selected;
        await wait(page, 1200);
        const dock = await page.evaluate(DOCK(m1)) as any;
        result.dockAfterClick = dock;
        note('the dock after the span click', dock);
        check('after the span click the model\'s editor is the tab in front, in the viewport', dock.inView === true && dock.active.includes(m1), JSON.stringify(dock));
        check('a click on a model span selects that element\'s vertex, only it, in the model\'s editor', !!selected && selected.length === 1 && selected[0] === element, JSON.stringify(selected));
        // The canvas pans to the selection: the box once it has settled.
        await wait(page, 1200);
        const nodeBox = await page.evaluate(BOX(`${pane}.querySelector('.react-flow__node.selected')`)) as any;
        note('the selected vertex box', nodeBox);
        await crop(page, 'canvas_selection.png', nodeBox, 60);
        const kept = await page.evaluate(BESIDE(m1, tabId)) as any;
        result.besideAfterClick = kept;
        check('after a fragment click the code view is still on screen beside the canvas, the rail on the canvas', kept.found && kept.panels && kept.visible && kept.sideBySide && kept.railOnCanvas, JSON.stringify(kept));
        const inCanvas = !!nodeBox && kept.found && nodeBox.w > 0 && nodeBox.x >= kept.canvas.x && nodeBox.y >= kept.canvas.y
            && nodeBox.x + nodeBox.w <= kept.canvas.x + kept.canvas.w && nodeBox.y + nodeBox.h <= kept.canvas.y + kept.canvas.h
            && (!kept.rail || nodeBox.x + nodeBox.w <= kept.rail.x);
        check('after a fragment click the selected vertex lies inside the visible canvas, no rail over it (P-2026-10-25-0925)', inCanvas, JSON.stringify({ node: nodeBox, canvas: kept.canvas, rail: kept.rail }));
        await crop(page, 'beside_selection.png', kept.found ? { x: kept.canvas.x, y: Math.min(kept.canvas.y, kept.tab.y), w: kept.tab.x + kept.tab.w - kept.canvas.x, h: Math.max(kept.canvas.h, kept.tab.h) } : null, 0);

        // The tab moved by hand into the canvas's own panel: a fragment click moves it to a right split first.
        const stacked = await page.evaluate(String.raw`(async () => {
          const d = (await import('/src/components/abstract/DockManager.tsx')).default.dock;
          const canvas = d.find(${JSON.stringify(m1)}), gen = d.find(${JSON.stringify(tabId)});
          if (!canvas || !gen) return null;
          d.dockMove(gen, canvas.parent, 'middle');
          await new Promise((r) => setTimeout(r, 600));
          return d.find(${JSON.stringify(m1)}).parent === d.find(${JSON.stringify(tabId)}).parent;
        })()`);
        check('the tab can be stacked by hand in the canvas panel', stacked === true, String(stacked));
        note('the dock layout stacked', await page.evaluate(LAYOUT));
        await wait(page, 600);
        const railStacked = await page.evaluate(`[localStorage.getItem('jjodel_treeview_visible'), localStorage.getItem('jjodel_property_panel_visible')]`) as string[];
        result.railStacked = railStacked;
        check('stacked on the canvas while the other generator tab stays beside the canvas panel, the rail stays collapsed (P-2026-10-25-0925)',
            railStacked.join() === 'false,false', JSON.stringify(railStacked));
        await poll(page, `!!(${tab} && ${tab}.offsetParent !== null && ${tab}.querySelector('[data-probe-pick="1"]'))`, 5000);
        await page.evaluate(CLICK(`document.querySelector('[data-probe-pick="1"]')`));
        await wait(page, 1500);
        const moved = await page.evaluate(BESIDE(m1, tabId)) as any;
        result.besideAfterStacked = moved;
        const reselected = await page.evaluate(String.raw`(() => { const p = ${pane}; return p ? p.querySelectorAll('.react-flow__node.selected').length : -1; })()`);
        check('a fragment click with the tab stacked on the canvas moves it beside, the code still on screen, the vertex selected',
            moved.found && moved.panels && moved.visible && moved.sideBySide && moved.railOnCanvas && reselected === 1, JSON.stringify({ moved, reselected }));
        const panels = await page.evaluate(String.raw`(async () => {
          const d = (await import('/src/components/abstract/DockManager.tsx')).default.dock;
          const walk = (n) => n.tabs ? [n.tabs.map((t) => t.id)] : (n.children || []).flatMap(walk);
          return walk(d.getLayout().dockbox).filter((ids) => ids.some((id) => id.startsWith('codegen_tpl_'))).length;
        })()`);
        check('moved out of the canvas panel, the tab joins the panel of the other generator tabs', panels === 1, String(panels));

        // Canvas to code with the tab behind: a click on another vertex links its spans there, the dock stays put.
        const other = await page.evaluate(String.raw`(() => {
          const n = [...${pane}.querySelectorAll('.react-flow__node:not(.selected)')].find((x) => { const r = x.getBoundingClientRect(); return r.x > 0 && r.y > 60 && r.x + r.width < innerWidth && r.y + r.height < innerHeight; });
          if (!n) return null;
          const r = n.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + Math.min(12, r.height / 2) };
        })()`) as { x: number; y: number } | null;
        if (other) {
            await page.mouse.click(other.x, other.y);
            await wait(page, 1000);
            const after = await page.evaluate(DOCK(m1)) as any;
            note('the dock after a canvas click', after);
            check('a canvas selection with the generator tab behind leaves the dock unscrolled and the editor in view',
                after.inView === true && after.scrolled.length === 0, JSON.stringify(after));
        } else {
            check('another vertex in view to click', false, 'none');
        }
    }

    // The pill with two generators: a menu, the last used marked; its item opens that tab.
    await page.evaluate(CLICK(`${pane}.querySelector('.codegen-pill button')`));
    const menu = await poll<any>(page, String.raw`(() => {
      const m = document.querySelector('.codegen-panel--menu [role="menu"]');
      if (!m) return null;
      return [...m.querySelectorAll('[role="menuitem"]')].map((b) => ({ name: b.querySelector('.codegen-panel__item-name').textContent, last: b.getAttribute('aria-current') === 'true' }));
    })()`, 10000);
    result.menu = menu;
    note('the pill menu', menu);
    check('with two generators the pill shows a menu of both, the default last used', !!menu && menu.length === 2 && menu.filter((i: any) => i.last).length === 1 && menu[0].last === true, JSON.stringify(menu));
    await wait(page, 800);
    const menuBox = await page.evaluate(BOX(`document.querySelector('.codegen-panel--menu')`)) as any;
    note('the pill menu box', menuBox);
    await crop(page, 'pill_menu.png', menuBox);
    if (menu && second) {
        await page.evaluate(CLICK(`document.querySelectorAll('.codegen-panel--menu [role="menuitem"]')[1]`));
        const back = await poll<boolean>(page, `(() => { const t = ${TAB(second.id)}; return !!t && t.offsetParent !== null && !document.querySelector('.codegen-panel--menu'); })()`, 10000);
        check('the menu item opens that generator\'s tab and the menu closes', back === true, String(back));
    }

    // The splitter between the editor column and the right pane: drag, keyboard, kept over a reload.
    await page.evaluate(String.raw`(async () => { const o = await import('/src/codegen/ui/openTemplateEditor.ts'); o.openTemplateEditor(${JSON.stringify(mm)}, ${JSON.stringify(ex.lookup.MM.name)}, null, 'default'); })()`);
    await poll(page, `!!(${tab} && ${tab}.offsetParent !== null)`, 10000);
    await wait(page, 500);
    const s0 = await page.evaluate(SPLIT(tab)) as any;
    note('the split before the drag', s0);
    check('a focusable vertical separator between the editor column and the right pane', !!s0 && s0.focusable && s0.role === 'separator', JSON.stringify(s0));
    if (!s0) return;
    await crop(page, 'split_before.png', await page.evaluate(BOX(tab)) as any);
    await page.mouse.move(s0.bar.x, s0.bar.y);
    await page.mouse.down();
    await page.mouse.move(s0.bar.x - 25, s0.bar.y, { steps: 6 });
    await page.mouse.move(s0.bar.x - 50, s0.bar.y, { steps: 6 });
    await page.mouse.up();
    await wait(page, 300);
    const s1 = await page.evaluate(SPLIT(tab)) as any;
    result.split = { before: s0, after: s1 };
    note('the split after a 50 px drag left', s1);
    check('at the default 45 % tab a drag left narrows the editor column by the drag and stores the ratio',
        !!s1 && Math.abs(s0.main - s1.main - 50) <= 3 && s1.stored !== null && Math.abs(Number(s1.stored) - s1.ratio) < 0.01, JSON.stringify({ s0: s0.main, s1: s1?.main, stored: s1?.stored, ratio: s1?.ratio }));
    await crop(page, 'split_after.png', await page.evaluate(BOX(tab)) as any);
    await page.mouse.move(s1.bar.x, s1.bar.y);
    await page.mouse.down();
    await page.mouse.move(s1.bar.x - 2000, s1.bar.y, { steps: 6 });
    await page.mouse.up();
    await wait(page, 300);
    const sMin = await page.evaluate(SPLIT(tab)) as any;
    check('the drag stops at 200 px of editor column', !!sMin && Math.abs(sMin.main - 200) <= 2, JSON.stringify(sMin?.main));
    // The splitter of this tab: the other generator's tab, behind it in the panel, has one too.
    await page.evaluate(`${tab}.querySelector('.codegen-tpl__splitter').focus()`);
    await page.keyboard.press('ArrowRight');
    await wait(page, 200);
    const sKey = await page.evaluate(SPLIT(tab)) as any;
    check('ArrowRight on the focused splitter widens the editor column by 16 px', !!sKey && Math.abs(sKey.main - sMin.main - 16) <= 2, JSON.stringify({ from: sMin?.main, to: sKey?.main }));
    await page.mouse.dblclick(sKey.bar.x, sKey.bar.y);
    await wait(page, 200);
    const sReset = await page.evaluate(SPLIT(tab)) as any;
    check('a double-click resets the default ratio', !!sReset && Math.abs(sReset.ratio - 0.55) < 0.01 && sReset.stored === '0.55', JSON.stringify(sReset && { ratio: sReset.ratio, stored: sReset.stored }));
    // A drag again, then a reload: the tab opens on the stored ratio.
    await page.mouse.move(sReset.bar.x, sReset.bar.y);
    await page.mouse.down();
    await page.mouse.move(sReset.bar.x - 40, sReset.bar.y, { steps: 6 });
    await page.mouse.up();
    await wait(page, 300);
    const s2 = await page.evaluate(SPLIT(tab)) as any;
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 300000 });
    const again = await poll<{ mm: string; m1: string }>(page, LOADED(ex.lookup.MM.name, ex.lookup.M.name), 120000);
    check('the project loads again after the reload', !!again, JSON.stringify(again));
    if (!again) return;
    await wait(page, 2000);
    // Reloaded while auto-collapsed (the pill menu opened the second generator beside the canvas): nothing persisted.
    const railReloaded = await page.evaluate(RAIL) as any;
    result.railReloaded = railReloaded;
    note('the rail after the reload', railReloaded);
    check('a reload while auto-collapsed does not persist the collapse: the rail zones are stored shown (P-2026-10-25-0925)',
        await page.evaluate(`localStorage.getItem('jjodel_property_panel_visible') === 'true' && localStorage.getItem('jjodel_treeview_visible') === 'true'`) as boolean, JSON.stringify(railReloaded));
    await page.evaluate(String.raw`(async () => { const o = await import('/src/codegen/ui/openTemplateEditor.ts'); o.openTemplateEditor(${JSON.stringify(again.mm)}, ${JSON.stringify(ex.lookup.MM.name)}, null, 'default'); })()`);
    const tabAgain = TAB(`codegen_tpl_${again.mm}`);
    await poll(page, `!!(${tabAgain} && ${tabAgain}.offsetParent !== null)`, 20000);
    await wait(page, 800);
    const s3 = await page.evaluate(SPLIT(tabAgain)) as any;
    result.splitReload = { before: s2, after: s3 };
    note('the split before and after the reload', { before: s2?.ratio, after: s3?.ratio, stored: s3?.stored });
    check('after a reload the tab keeps the dragged ratio', !!s2 && !!s3 && Math.abs(s3.ratio - s2.ratio) < 0.01 && s3.stored === s2.stored, JSON.stringify({ before: s2?.ratio, after: s3?.ratio }));

    // P-2026-10-25-0925: the model's canvas and the tab beside it, then the tab closed: the rail comes back as it was.
    // The tab open after the reload is closed first, so the opening on the model docks a new one beside its canvas.
    const CLOSE_ALL = String.raw`(async () => {
      const dm = (await import('/src/components/abstract/DockManager.tsx')).default;
      const d = dm.dock;
      const walk = (n) => n.tabs ? n.tabs.map((t) => t.id) : (n.children || []).flatMap(walk);
      walk(d.getLayout().dockbox).filter((id) => id.startsWith('codegen_tpl_')).forEach((id) => dm.closeTab(id));
      await new Promise((r) => setTimeout(r, 300));
      return walk(d.getLayout().dockbox).filter((id) => id.startsWith('codegen_tpl_')).length;
    })()`;
    await page.evaluate(CLOSE_ALL);
    await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(again.m1)})); })()`);
    await poll(page, `(() => { const p = ${PANE(again.m1)}; return !!p && p.offsetParent !== null && p.querySelectorAll('.react-flow__node').length > 0; })()`, 30000);
    await page.evaluate(String.raw`(async () => { const o = await import('/src/codegen/ui/openTemplateEditor.ts'); o.openTemplateEditor(${JSON.stringify(again.mm)}, ${JSON.stringify(ex.lookup.MM.name)}, null, 'default', ${JSON.stringify(again.m1)}); })()`);
    await wait(page, 1500);
    const besideAgain = await page.evaluate(BESIDE(again.m1, `codegen_tpl_${again.mm}`)) as any;
    const railAgain = await page.evaluate(RAIL) as any;
    note('the dock and the rail, the tab opened again beside the canvas', { dock: await page.evaluate(DOCK(again.m1)), rail: railAgain });
    check('opened again beside the canvas, the rail is collapsed', besideAgain.found && besideAgain.panels && besideAgain.sideBySide && !railAgain.shown, JSON.stringify({ beside: besideAgain.found && besideAgain.panels, rail: railAgain }));
    await crop(page, 'layout_beside_again.png', { x: 0, y: 0, w: 1600, h: 1000 }, 0);
    const closed = await page.evaluate(CLOSE_ALL);
    check('every generator tab closes', closed === 0, String(closed));
    const railClosed = await poll<any>(page, `(() => { const r = ${RAIL}; return r.shown && r.box.w === 400 ? r : null; })()`, 5000);
    await wait(page, 600);
    const railFinal = await page.evaluate(RAIL) as any;
    result.railClosed = railFinal;
    note('the rail after the last generator tab closed', railFinal);
    check('the last generator tab closed, the rail is back as it was: x 1200, 400x877, inset 408px', !!railClosed && onePanelRail(railFinal), JSON.stringify(railFinal));
    await crop(page, 'layout_closed.png', { x: 0, y: 0, w: 1600, h: 1000 }, 0);

    // P-2026-10-25-1200 (supersedes the 1045 placement right of the project page): the project page active and no
    // canvas docked, the generator opened from GENERATORS in the left bar is a tab of the first panel, listed in the
    // app bar beside the project and model tabs, full width when selected; closed from the app bar it leaves the dock.
    // The project opened afresh, the left bar on screen.
    await page.goto(`${URL}/?open=${encodeURIComponent(pid)}#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    check('the project opens afresh', !!(await poll(page, LOADED(ex.lookup.MM.name, ex.lookup.M.name), 120000)), '');
    await wait(page, 3000);
    // Reload (prompt COSA 3): which generator tabs the restored dock holds, reported, not fixed here.
    const DOCKED = String.raw`(async () => {
      const d = (await import('/src/components/abstract/DockManager.tsx')).default.dock;
      const walk = (n) => n.tabs ? n.tabs.map((t) => t.id) : (n.children || []).flatMap(walk);
      const first = d.getLayout().dockbox.children[0];
      return { all: walk(d.getLayout().dockbox), first: first && first.tabs ? first.tabs.map((t) => t.id) : null, firstActive: first ? first.activeId : null, panels: walk(d.getLayout().dockbox).length };
    })()`;
    const afterReload = await page.evaluate(DOCKED) as any;
    result.reloadDock = afterReload;
    note('the dock after the reload (generator tabs restored?)', { generators: afterReload.all.filter((id: string) => id.startsWith('codegen_tpl_')), all: afterReload.all });
    // No canvas docked: every model and metamodel tab closed, as a user closes them.
    await page.evaluate(String.raw`(async () => {
      const dm = (await import('/src/components/abstract/DockManager.tsx')).default;
      const walk = (n) => n.tabs ? n.tabs.map((t) => t.id) : (n.children || []).flatMap(walk);
      const lookup = window.windoww.store.getState().idlookup || {};
      walk(dm.dock.getLayout().dockbox).filter((id) => id.startsWith('codegen_tpl_') || (lookup[id] && lookup[id].className === 'DModel')).forEach((id) => dm.closeTab(id));
      await new Promise((r) => setTimeout(r, 300));
    })()`);
    // The project page brought forward as the project rail brings it (DockManager.activateProjectSummary).
    await page.evaluate(String.raw`(async () => (await import('/src/components/abstract/DockManager.tsx')).default.activateProjectSummary())()`);
    await wait(page, 1000);
    // The fixture's bags are not saved with the project: written again, so GENERATORS lists the default.
    const reinstalled = await page.evaluate(INSTALL(again)) as any;
    check('the fixture is installed again on the fresh project', reinstalled.missing.length === 0, reinstalled.missing);
    await poll(page, `document.body.getAttribute('data-editor-type') === 'summary'`, 10000);
    await wait(page, 800);
    const noCanvas = await page.evaluate(DOCKED) as any;
    const lookupKinds = await page.evaluate(`(() => { const l = window.windoww.store.getState().idlookup || {}; return ${JSON.stringify(noCanvas.all)}.filter((id) => l[id] && l[id].className === 'DModel'); })()`) as string[];
    check('no canvas docked before the opening', lookupKinds.length === 0, JSON.stringify({ docked: noCanvas.all, canvases: lookupKinds }));
    note('the GENERATORS entries', await page.evaluate(`({ entries: [...document.querySelectorAll('.psb-section--generators .psb-item[data-generator]')].map((e) => e.getAttribute('data-generator') + ':' + (e.offsetParent !== null)) })`));
    await page.evaluate(CLICK(`document.querySelector('.psb-section--generators .psb-item[data-generator]')`));
    const leftTab = `codegen_tpl_${again.mm}`;
    await poll(page, `!!(${TAB(leftTab)} && ${TAB(leftTab)}.offsetParent !== null)`, 20000);
    await wait(page, 1500);
    const APPBAR = String.raw`(() => [...document.querySelectorAll('.appbar-tabs .appbar-tab')].map((b) => ({
      cls: b.className, name: (b.querySelector('.appbar-tab__name') || {}).textContent || '', active: b.classList.contains('appbar-tab--active'),
      icon: !!b.querySelector('.appbar-tab__badge .bi-code-slash'), close: !!b.querySelector('.appbar-tab__close'),
      visible: b.offsetParent !== null && b.getBoundingClientRect().width > 0 })))()`;
    const genEntries = (bar: any[]) => bar.filter((t: any) => /appbar-tab--generator/.test(t.cls));
    const inMain = await page.evaluate(DOCKED) as any;
    const bar1 = await page.evaluate(APPBAR) as any[];
    const fullBox = await page.evaluate(BOX(TAB(leftTab))) as any;
    result.appBar = { dock: inMain, bar: bar1, tab: fullBox };
    note('no canvas docked, opened from the left bar', result.appBar);
    check('with no canvas docked the tab is in the first panel, active, one panel only (kills: right of the project page kept)', !!inMain.first && inMain.first.includes(leftTab) && inMain.firstActive === leftTab && inMain.all.filter((id: string) => id === leftTab).length === 1, JSON.stringify(inMain));
    const g1 = genEntries(bar1);
    check('the app bar lists the generator tab once: bi-code-slash, «Default · <metamodel>», active, its close (kills: ghost filter kept)', g1.length === 1 && g1[0].visible && g1[0].icon && g1[0].close && g1[0].active && g1[0].name === `Default · ${ex.lookup.MM.name}`, JSON.stringify(g1));
    check('the generator tab in the first panel shows no rc-dock header of its own (the app bar is its header)', !(await page.evaluate(HEADER(leftTab)) as any)?.visible, JSON.stringify(await page.evaluate(HEADER(leftTab))));
    await crop(page, 'appbar_generator.png', { x: 0, y: 0, w: 1600, h: 1000 }, 0);
    // The project page brought forward again: the generator's entry stays, not active; the page is on screen.
    await page.evaluate(String.raw`(async () => (await import('/src/components/abstract/DockManager.tsx')).default.activateProjectSummary())()`);
    await wait(page, 1200);
    const bar2 = await page.evaluate(APPBAR) as any[];
    const g2 = genEntries(bar2);
    const pageBox = await page.evaluate(BOX(`document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-project_summary"]')`)) as any;
    check('the project page active again: the generator entry stays, not active, the page on screen', g2.length === 1 && !g2[0].active && !!pageBox && pageBox.w > 1000, JSON.stringify({ bar: g2, page: pageBox }));
    // Full width: the generator, selected, takes the box the project page takes, not a split of it.
    check('selected, the generator is full width: the project page\'s box, to the viewport\'s right edge', !!pageBox && !!fullBox && Math.abs(fullBox.x - pageBox.x) <= 2 && Math.abs(fullBox.w - pageBox.w) <= 4 && fullBox.x + fullBox.w >= 1600 - 4, JSON.stringify({ page: pageBox, tab: fullBox }));
    await crop(page, 'appbar_project.png', { x: 0, y: 0, w: 1600, h: 1000 }, 0);
    // Back through the app bar: its entry selects the tab.
    await page.evaluate(CLICK(`document.querySelector('.appbar-tabs .appbar-tab--generator')`));
    await wait(page, 1000);
    const g3 = genEntries(await page.evaluate(APPBAR) as any[]);
    check('the app-bar entry selects the generator tab again', g3.length === 1 && g3[0].active && !!(await page.evaluate(`(${TAB(leftTab)} || {}).offsetParent !== null`)), JSON.stringify(g3));
    // Closed from the app bar: the dock tab is gone, and the entry with it.
    await page.evaluate(CLICK(`document.querySelector('.appbar-tabs .appbar-tab--generator .appbar-tab__close')`));
    await wait(page, 1500);
    const afterClose = await page.evaluate(DOCKED) as any;
    const g4 = genEntries(await page.evaluate(APPBAR) as any[]);
    check('closed from the app bar, the dock tab is removed and the entry gone (kills: close only hides the entry)', !afterClose.all.includes(leftTab) && g4.length === 0, JSON.stringify({ dock: afterClose.all, bar: g4 }));

    // Canvas docked: beside, unchanged (1515/1045), and no entry in the app bar; moved by hand into the first panel it
    // is listed once, moved out again it is not, never a duplicate dock tab.
    await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(again.m1)})); })()`);
    await poll(page, `(() => { const p = ${PANE(again.m1)}; return !!p && p.offsetParent !== null && p.querySelectorAll('.react-flow__node').length > 0; })()`, 30000);
    await page.evaluate(String.raw`(async () => { const o = await import('/src/codegen/ui/openTemplateEditor.ts'); o.openTemplateEditor(${JSON.stringify(again.mm)}, ${JSON.stringify(ex.lookup.MM.name)}, null, 'default', ${JSON.stringify(again.m1)}); })()`);
    await wait(page, 1500);
    const besideLast = await page.evaluate(BESIDE(again.m1, leftTab)) as any;
    const headLast = await page.evaluate(HEADER(leftTab)) as any;
    const dockBeside = await page.evaluate(DOCKED) as any;
    const g5 = genEntries(await page.evaluate(APPBAR) as any[]);
    result.besideLast = { beside: besideLast, header: headLast, dock: dockBeside, bar: g5 };
    note('a canvas docked, the tab opened again', result.besideLast);
    check('with a canvas docked the tab opens beside it, its own header, not in the first panel (kills: always the main panel)', besideLast.found && besideLast.panels && besideLast.sideBySide && visibleHeader(headLast) && !dockBeside.first.includes(leftTab), JSON.stringify({ beside: besideLast, first: dockBeside.first }));
    check('beside, the app bar has no generator entry (no ghost)', g5.length === 0, JSON.stringify(g5));
    if (besideLast.found) await crop(page, 'beside_unchanged.png', { x: 0, y: 0, w: 1600, h: 1000 }, 0);
    const MOVE = (dir: string) => String.raw`(async () => {
      const d = (await import('/src/components/abstract/DockManager.tsx')).default.dock;
      const first = d.getLayout().dockbox.children[0];
      d.dockMove(d.find(${JSON.stringify(leftTab)}), d.find(first.id) || first, ${JSON.stringify(dir)});
      await new Promise((r) => setTimeout(r, 1500));
    })()`;
    await page.evaluate(MOVE('middle'));
    const movedIn = await page.evaluate(DOCKED) as any;
    const g6 = genEntries(await page.evaluate(APPBAR) as any[]);
    check('moved into the first panel by hand: one dock tab, listed once in the app bar', movedIn.all.filter((id: string) => id === leftTab).length === 1 && movedIn.first.includes(leftTab) && g6.length === 1 && g6[0].name === `Default · ${ex.lookup.MM.name}`, JSON.stringify({ dock: movedIn.all, bar: g6 }));
    await page.evaluate(MOVE('right'));
    const movedOut = await page.evaluate(DOCKED) as any;
    const g7 = genEntries(await page.evaluate(APPBAR) as any[]);
    check('moved out again: one dock tab, no app-bar entry', movedOut.all.filter((id: string) => id === leftTab).length === 1 && !movedOut.first.includes(leftTab) && g7.length === 0, JSON.stringify({ dock: movedOut.all, bar: g7 }));

    // P-2026-10-25-1310, the finding's sequence: GENERATORS with the project page active and no canvas docked (the tab
    // joins the app bar), then the model's canvas opened, then its Code pill: the tab moves beside the canvas, which
    // stays the active app-bar tab, and the app bar no longer lists the generator.
    await page.evaluate(String.raw`(async () => {
      const dm = (await import('/src/components/abstract/DockManager.tsx')).default;
      const walk = (n) => n.tabs ? n.tabs.map((t) => t.id) : (n.children || []).flatMap(walk);
      const lookup = window.windoww.store.getState().idlookup || {};
      walk(dm.dock.getLayout().dockbox).filter((id) => id.startsWith('codegen_tpl_') || (lookup[id] && lookup[id].className === 'DModel')).forEach((id) => dm.closeTab(id));
      await new Promise((r) => setTimeout(r, 300));
      dm.activateProjectSummary();
    })()`);
    await wait(page, 1200);
    await page.evaluate(CLICK(`document.querySelector('.psb-section--generators .psb-item[data-generator]')`));
    await poll(page, `!!(${TAB(leftTab)} && ${TAB(leftTab)}.offsetParent !== null)`, 20000);
    await wait(page, 1000);
    const f1 = await page.evaluate(DOCKED) as any;
    check('finding step 1: from GENERATORS, no canvas docked, the tab is in the first panel, listed in the app bar', !!f1.first && f1.first.includes(leftTab) && genEntries(await page.evaluate(APPBAR) as any[]).length === 1, JSON.stringify(f1));
    await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(again.m1)})); })()`);
    await poll(page, `(() => { const p = ${PANE(again.m1)}; return !!p && p.offsetParent !== null && p.querySelectorAll('.react-flow__node').length > 0 && !!p.querySelector('.codegen-pill button'); })()`, 30000);
    await wait(page, 800);
    const f2 = await page.evaluate(DOCKED) as any;
    note('finding step 2: the model canvas opened over the app-bar tab', f2);
    await page.evaluate(CLICK(`${PANE(again.m1)}.querySelector('.codegen-pill button')`));
    await wait(page, 600);
    // Several generators: the pill's menu, its Default item.
    await page.evaluate(String.raw`(() => {
      const items = [...document.querySelectorAll('.codegen-panel--menu [role="menuitem"]')];
      const d = items.find((b) => /^Default$/.test(((b.querySelector('.codegen-panel__item-name') || {}).textContent || '').trim())) || items[0];
      if (d) d.click();
    })()`);
    await wait(page, 1800);
    const pillBeside = await page.evaluate(BESIDE(again.m1, leftTab)) as any;
    const pillDock = await page.evaluate(DOCKED) as any;
    const pillBar = await page.evaluate(APPBAR) as any[];
    const pillActive = pillBar.filter((t: any) => t.active);
    result.findingPill = { beside: pillBeside, dock: pillDock, bar: pillBar };
    note('finding step 3: after the Code pill', result.findingPill);
    check('after the pill the generator tab is beside the canvas, both on screen, side by side (kills: only activated)', pillBeside.found && pillBeside.panels && pillBeside.visible && pillBeside.sideBySide, JSON.stringify(pillBeside));
    check('after the pill the canvas is the first panel\'s active tab and the generator is not in it', pillDock.firstActive === again.m1 && !pillDock.first.includes(leftTab) && pillDock.all.filter((id: string) => id === leftTab).length === 1, JSON.stringify(pillDock));
    check('after the pill the app bar shows the canvas tab active and lists no generator tab', genEntries(pillBar).length === 0 && pillActive.length === 1 && !/appbar-tab--generator/.test(pillActive[0].cls), JSON.stringify(pillBar));
    await crop(page, 'finding_pill_beside.png', { x: 0, y: 0, w: 1600, h: 1000 }, 0);

    // P-2026-10-25-1355 COSA 1: the boundary between canvas and tab is rc-dock's divider, 7px to grab over the two
    // panels' edges around its 1px line (kills: the 1px divider, a drag only on its exact pixel); dragged, the tab widens.
    const div1 = await page.evaluate(DIVIDER(leftTab)) as any;
    result.divider = div1;
    note('the divider beside the generator tab', div1);
    check('the boundary beside the generator tab is rc-dock\'s divider, shown, 7px, grabbed 3px either side of its line', div1.found && div1.display !== 'none' && div1.width >= 6.5 && div1.hit.every(Boolean) && div1.cursor === 'ew-resize', JSON.stringify(div1));
    if (div1.found) {
        const area = { x: div1.line - 220, y: div1.y - 160, w: 440, h: 320 };
        await page.mouse.move(div1.line + 2, div1.y);
        await wait(page, 300);
        await crop(page, 'divider_before.png', area, 0);
        await page.mouse.down();
        await page.mouse.move(div1.line - 148, div1.y, { steps: 10 });
        await page.mouse.up();
        await wait(page, 600);
        const div2 = await page.evaluate(DIVIDER(leftTab)) as any;
        result.dividerDragged = div2;
        note('the divider after a drag of 150px to the left, started 2px right of its line', div2);
        check('dragged 150px to the left, the generator tab widens by about 150px and the canvas stays beside it', div2.found && Math.abs(div2.tabWidth - div1.tabWidth - 150) <= 12 && (await page.evaluate(BESIDE(again.m1, leftTab)) as any).sideBySide, JSON.stringify({ before: div1.tabWidth, after: div2.tabWidth }));
        await crop(page, 'divider_after.png', { ...area, x: div2.line - 220 }, 0);
    }

    // Back to the app bar: the project page brought forward, GENERATORS moves the tab into the first panel (COSA 2);
    // then a fragment click opens the model's canvas and the tab moves beside it, the selection beside the code (COSA 3).
    await page.evaluate(String.raw`(async () => (await import('/src/components/abstract/DockManager.tsx')).default.activateProjectSummary())()`);
    await wait(page, 1000);
    await page.evaluate(CLICK(`document.querySelector('.psb-section--generators .psb-item[data-generator]')`));
    await wait(page, 1500);
    const back = await page.evaluate(DOCKED) as any;
    note('GENERATORS with the project page in front, the tab beside a hidden canvas', back);
    check('from GENERATORS with no canvas in front, the tab goes back to the first panel, active, listed in the app bar (COSA 2)', !!back.first && back.first.includes(leftTab) && back.firstActive === leftTab && genEntries(await page.evaluate(APPBAR) as any[]).length === 1, JSON.stringify(back));
    await mode(page, TAB(leftTab), 'Preview');
    await poll(page, `!!(${TAB(leftTab)} && ${TAB(leftTab)}.querySelector('.codegen-pane__code .code-span--model[data-origin-id]'))`, 10000);
    const fragElement = await page.evaluate(String.raw`(() => {
      const lk = window.windoww.store.getState().idlookup;
      const spans = [...${TAB(leftTab)}.querySelectorAll('.codegen-pane__code .code-span--model[data-origin-id]')];
      const objects = spans.filter((x) => (lk[x.getAttribute('data-origin-id')] || {}).className === 'DObject');
      const s = objects.find((x) => x.classList.contains('code-tok')) || objects[0];
      if (!s) return null;
      s.setAttribute('data-probe-pick2', '1');
      return s.getAttribute('data-origin-id');
    })()`) as string | null;
    check('the app-bar tab shows a span from a model object', !!fragElement, String(fragElement));
    if (fragElement) {
        await page.evaluate(CLICK(`document.querySelector('[data-probe-pick2="1"]')`));
        const sel = await poll<string[]>(page, String.raw`(() => {
          const p = ${PANE(again.m1)};
          if (!p || p.offsetParent === null) return null;
          const lk = window.windoww.store.getState().idlookup;
          const s = [...p.querySelectorAll('.react-flow__node.selected')].map((n) => (lk[n.getAttribute('data-id')] || {}).model || n.getAttribute('data-id'));
          return s.length > 0 ? s : null;
        })()`, 6000);
        await wait(page, 1500);
        const fragBeside = await page.evaluate(BESIDE(again.m1, leftTab)) as any;
        const fragDock = await page.evaluate(DOCKED) as any;
        const fragBar = await page.evaluate(APPBAR) as any[];
        const selBox = await page.evaluate(BOX(`${PANE(again.m1)}.querySelector('.react-flow__node.selected')`)) as any;
        result.findingFragment = { selected: sel, beside: fragBeside, dock: fragDock, node: selBox };
        note('a fragment click from the app-bar placement', result.findingFragment);
        check('a fragment click from the app-bar placement ends with canvas and tab side by side (kills: canvas tab activated over the code)', fragBeside.found && fragBeside.panels && fragBeside.visible && fragBeside.sideBySide && fragDock.firstActive === again.m1 && !fragDock.first.includes(leftTab) && genEntries(fragBar).length === 0, JSON.stringify({ beside: fragBeside, dock: fragDock }));
        const selIn = !!selBox && fragBeside.found && selBox.w > 0 && selBox.x >= fragBeside.canvas.x && selBox.x + selBox.w <= fragBeside.canvas.x + fragBeside.canvas.w;
        check('after the fragment click the element is selected on the canvas, visible beside the code', !!sel && sel.length === 1 && sel[0] === fragElement && selIn, JSON.stringify({ selected: sel, node: selBox, canvas: fragBeside.canvas }));
        await crop(page, 'finding_fragment_beside.png', { x: 0, y: 0, w: 1600, h: 1000 }, 0);
    }

    // P-2026-10-25-1355: a box with no generator panel keeps rc-dock's 1px divider (kills: every divider widened). The
    // generator tab closed, the metamodel's tab docked right of the canvas.
    await page.evaluate(String.raw`(async () => {
      const dm = (await import('/src/components/abstract/DockManager.tsx')).default;
      dm.closeTab(${JSON.stringify(leftTab)});
      await new Promise((r) => setTimeout(r, 400));
      await dm.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(again.mm)}));
      await new Promise((r) => setTimeout(r, 800));
      const d = dm.dock, tab = d.find(${JSON.stringify(again.mm)}), canvas = d.find(${JSON.stringify(again.m1)});
      if (tab && canvas && canvas.parent) d.dockMove(tab, canvas.parent, 'right');
    })()`);
    await wait(page, 800);
    const plain = await page.evaluate(PLAIN_DIVIDERS) as any[];
    const plainDock = await page.evaluate(LAYOUT) as any;
    result.plainDividers = { dividers: plain, layout: plainDock };
    note('the dividers of a box with no generator panel', result.plainDividers);
    check('a box with no generator panel keeps rc-dock\'s 1px divider', plain.length > 0 && plain.every((d: any) => d.basis === '1px' && d.width <= 1), JSON.stringify(result.plainDividers));
}

try {
    await main();
} catch (e) {
    check('the probe ran to its end', false, String((e as Error).stack ?? e).slice(0, 400));
}
const own = errors.filter(e => /codegen|oracle|jjodelOracle|GeneratorPane|TemplateEditor/i.test(e));
result.errors = errors;
note('console errors', { total: errors.length, codegen: own.length });
check('no console error from the generator tab', own.length === 0, own.slice(0, 5));
writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  (${OUT})`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
