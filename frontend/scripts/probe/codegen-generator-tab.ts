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

/** The editor column's share of the width right of the template list, and the splitter (P-2026-10-24-1515). */
const SPLIT = (tab: string) => String.raw`(() => {
  const t = ${tab};
  if (!t) return null;
  const main = t.querySelector('.codegen-tpl__main'), bar = t.querySelector('.codegen-tpl__splitter');
  if (!main || !bar) return null;
  const r = t.getBoundingClientRect(), m = main.getBoundingClientRect(), s = bar.getBoundingClientRect();
  return { ratio: Math.round(1000 * m.width / (r.right - m.left - s.width)) / 1000, main: Math.round(m.width), bar: { x: s.x + s.width / 2, y: s.y + s.height / 2, w: s.width }, stored: localStorage.getItem('jjodel.codegen.tabSplit'), focusable: bar.tabIndex === 0, role: bar.getAttribute('role') };
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
    check('the Properties/Tree rail covers the canvas, not the generator tab', !!beside.rail && beside.railOnCanvas, JSON.stringify({ rail: beside.rail, canvas: beside.canvas, tab: beside.tab }));
    check('no floating editor panel is left on the canvas', !(await page.evaluate(`!!(${pane}.querySelector('.codegen-panel'))`)), '');
    await wait(page, 500);
    await crop(page, 'tab_preview.png', await page.evaluate(BOX(tab)) as any);

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
      const s = spans.find((x) => (lk[x.getAttribute('data-origin-id')] || {}).className === 'DObject');
      if (!s) return null;
      s.setAttribute('data-probe-pick', '1');
      return s.getAttribute('data-origin-id');
    })()`) as string | null;
    check('a span from a model object', !!element, String(element));
    if (element) {
        // A DOM click, as the mouse gives it: Playwright's own click scrolls every ancestor to the span first.
        note('the dock before the span click', await page.evaluate(DOCK(m1)));
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
    await page.focus('.codegen-tpl__splitter');
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
    await page.evaluate(String.raw`(async () => { const o = await import('/src/codegen/ui/openTemplateEditor.ts'); o.openTemplateEditor(${JSON.stringify(again.mm)}, ${JSON.stringify(ex.lookup.MM.name)}, null, 'default'); })()`);
    const tabAgain = TAB(`codegen_tpl_${again.mm}`);
    await poll(page, `!!(${tabAgain} && ${tabAgain}.offsetParent !== null)`, 20000);
    await wait(page, 800);
    const s3 = await page.evaluate(SPLIT(tabAgain)) as any;
    result.splitReload = { before: s2, after: s3 };
    note('the split before and after the reload', { before: s2?.ratio, after: s3?.ratio, stored: s3?.stored });
    check('after a reload the tab keeps the dragged ratio', !!s2 && !!s3 && Math.abs(s3.ratio - s2.ratio) < 0.01 && s3.stored === s2.stored, JSON.stringify({ before: s2?.ratio, after: s3?.ratio }));
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
