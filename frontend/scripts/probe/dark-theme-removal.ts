/**
 * dark-theme-removal probe (P-2026-10-10-0910, D-UI-15). Report: docs/discovery/discovery_2026-10-10_dark_theme_removal.md.
 *
 * Jjodel has two LIGHT states (report §3.1): A, nothing stored and no `data-theme` on <html>; B,
 * `localStorage.theme = 'light'` and `data-theme="light"`. The lane removes the dark theme and keeps both.
 *
 * For the dashboard and the four demo scenes (fixtures/scene_{1..4}_*.jjodel, the files of ~/jjodel-demo-exports/),
 * opened in each seed (none = A, 'light' = B, 'dark'), it dumps:
 *   - the custom properties computed on <html> and <body>;
 *   - the classes of every `.editor-v2` root;
 *   - colour, background, the four border colours, box-shadow, fill, stroke, outline and opacity of EVERY element
 *     under <body>, plus the fill / fill-opacity / stroke attributes of SVG elements (the MiniMap nodes and the
 *     dot grid among them);
 *   - the rule walk of every readable stylesheet: the dark selector parts left and how many elements they match.
 * Settings (`#/settings` > Appearance) is checked for a theme radio and a «Dark» label.
 *
 * Assertions (red on the base by design, green after the lane):
 *   - the only dark selector parts left are the critical-zone rule of
 *     viewpoint/authoring/StructureGroups.scss (`.ir-structure-group__hidden`, no go-ahead in this lane), and no
 *     dark part matches an element;
 *   - data-theme: none -> null, 'light' -> "light", 'dark' -> null;
 *   - every `.editor-v2` carries `theme-light`, and the canvas rendered;
 *   - Settings has no `input[name="theme"]` and no «Dark» label;
 *   - the 'dark' seed dumps exactly as the none seed of the same run (a stored 'dark' opens in A);
 *   - with DTR_BEFORE: the none and 'light' dumps equal the before run, target by target.
 * A dark state is never dumped: a page that carries data-theme="dark" records the attribute and the counts only.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/dark-theme-removal.ts \
 *         --port 3094 --id P-2026-10-10-0910
 * Env:  DTR_OUT     JSON output (default frontend/scripts/smoke/_tmp_dark-theme-removal.json, gitignored)
 *       DTR_BEFORE  a previous DTR_OUT to compare the A and B dumps with
 */
import { chromium, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3094/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const OUT = process.env.DTR_OUT || new globalThis.URL('../smoke/_tmp_dark-theme-removal.json', import.meta.url).pathname;
const BEFORE = process.env.DTR_BEFORE || '';
const fixture = (name: string) => new globalThis.URL(`./fixtures/${name}.jjodel`, import.meta.url).pathname;

const SCENES = [
    { name: 'PEST', fixture: 'scene_1_DemoPEST' },
    { name: 'Petri', fixture: 'scene_2_DemoPetri' },
    { name: 'ESM', fixture: 'scene_3_DemoESM' },
    { name: 'FlowB', fixture: 'scene_4_DemoFlowB' },
];
const SEEDS = [null, 'light', 'dark'] as const;
type Seed = typeof SEEDS[number];
const seedName = (s: Seed) => (s === null ? 'none' : s);
/** The one dark rule this lane leaves: critical zone, no go-ahead (StructureGroups.scss:82-84). */
const ALLOWED_DARK = /\.ir-structure-group__hidden/;
/** A selector part that names the app's dark theme (the `.dark` class alone is a homonym). */
const THEME_DARK = /\[data-theme\s*=\s*["']?dark["']?\]|\.theme-dark(?![\w-])|\.dark-theme(?![\w-])/;

/** Sorted-key serialization: the order in which a browser lists computed custom properties is not stable across runs. */
const canon = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : x));

let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};

const IMPORT = (text: string) => String.raw`(async () => {
  const api = await import('/src/api/persistance/projects.ts');
  const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
  const before = count();
  await api.ProjectsApi.importFromText(${JSON.stringify(text)});
  for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
  const a = JSON.parse(localStorage.getItem('projects') || '[]');
  return a.length > before ? a[a.length - 1].id : null;
})()`;
const M1 = String.raw`(() => {
  try {
    const all = Object.values(window.windoww.store.getState().idlookup).filter((d) => d && typeof d === 'object');
    const m = all.find((d) => d.className === 'DModel' && !d.isMetamodel);
    return m ? m.id : null;
  } catch (e) { return null; }
})()`;
const OPEN = (id: string) => `(async () => { const j = await import('/src/joiner/index.ts'); const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(id)})); })()`;

/** The page-side measure. A page in a dark state returns the attribute and the walk only. */
const MEASURE = String.raw`(() => {
  const DARK = /\[data-theme\s*=\s*["']?dark["']?\]|\.theme-dark(?![\w-])|\.dark-theme(?![\w-])|(^|[\s,>+~(])\.dark(?![\w-])/;
  const walk = { sheets: 0, unreadable: 0, darkParts: [], darkMatching: [], mediaDark: [] };
  const count = (sel) => { try { return document.querySelectorAll(sel).length; } catch (e) { return -1; } };
  const visit = (rules) => {
    for (const r of rules) {
      if (r instanceof CSSMediaRule) {
        if (/prefers-color-scheme\s*:\s*dark/.test(r.conditionText || '')) {
          const sels = []; for (const x of r.cssRules) if (x.selectorText) sels.push(x.selectorText);
          walk.mediaDark.push(sels.join(' | '));
        } else visit(r.cssRules);
        continue;
      }
      if (!r.selectorText) { if (r.cssRules && r.cssRules.length) visit(r.cssRules); continue; }
      for (const p of r.selectorText.split(/,(?![^(]*\))/).map((s) => s.trim())) {
        if (DARK.test(p)) { walk.darkParts.push(p); if (count(p) > 0) walk.darkMatching.push(p); }
      }
      if (r.cssRules && r.cssRules.length) visit(r.cssRules);
    }
  };
  for (const s of document.styleSheets) { walk.sheets++; try { visit(s.cssRules); } catch (e) { walk.unreadable++; } }
  const attr = document.documentElement.getAttribute('data-theme');
  const editors = [...document.querySelectorAll('.editor-v2')].map((e) => [...e.classList].filter((c) => c.startsWith('theme-')).join(' '));
  const nodes = document.querySelectorAll('.react-flow__node').length;
  const base = { attr, stored: localStorage.getItem('theme'), editors, nodes, walk };
  if (attr === 'dark') return base;
  const vars = (el) => { const cs = getComputedStyle(el), o = {}; for (let i = 0; i < cs.length; i++) { const n = cs[i]; if (n.startsWith('--')) o[n] = cs.getPropertyValue(n).trim(); } return o; };
  const PROPS = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'box-shadow', 'fill', 'stroke', 'outline-color', 'opacity'];
  const els = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('script, style, .monaco-editor')) continue;
    const cs = getComputedStyle(el);
    const svg = el instanceof SVGElement ? ['fill', 'fill-opacity', 'stroke'].map((a) => el.getAttribute(a)).join(',') : '';
    els.push(el.tagName.toLowerCase() + '.' + (el.getAttribute('class') || '').trim().split(/\s+/).join('.') + ' ' + PROPS.map((p) => cs.getPropertyValue(p)).join('|') + (svg ? ' svg:' + svg : ''));
  }
  return { ...base, root: vars(document.documentElement), body: vars(document.body), els };
})()`;

async function measureTarget(browser: any, target: string, s: Seed): Promise<any> {
    const ctx = await browser.newContext({ colorScheme: 'light', viewport: { width: 1600, height: 1000 } });
    await seed(ctx, true);
    if (s !== null) await ctx.addInitScript((t: string) => localStorage.setItem('theme', t), s);
    const page: Page = await ctx.newPage();
    try {
        await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        await page.waitForFunction('!!(window.windoww && window.windoww.store)', null, { timeout: 120000 });
        await page.waitForTimeout(2500);
        if (target === 'settings') {
            await page.goto(`${URL}/#/settings`, { waitUntil: 'domcontentloaded', timeout: 300000 });
            await page.waitForTimeout(2500);
            await page.evaluate(`(() => { const b = [...document.querySelectorAll('.sidebar-item')].find((x) => x.textContent.trim() === 'Appearance'); if (b) b.click(); return !!b; })()`);
            await page.waitForTimeout(1200);
            return await page.evaluate(String.raw`(() => ({
              attr: document.documentElement.getAttribute('data-theme'),
              stored: localStorage.getItem('theme'),
              appearance: !!document.querySelector('.settings-section-content'),
              placeholder: document.body.textContent.includes('Coming Soon'),
              radios: document.querySelectorAll('input[name="theme"]').length,
              darkLabel: [...document.querySelectorAll('label, span, button')].some((e) => e.textContent.trim() === 'Dark'),
            }))()`);
        }
        if (target !== 'dashboard') {
            const sc = SCENES.find((x) => x.name === target)!;
            const pid = await page.evaluate(IMPORT(readFileSync(fixture(sc.fixture), 'utf8'))) as string | null;
            await page.goto('about:blank');
            await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
            await page.waitForTimeout(9000);
            const m1 = await page.evaluate(M1) as string | null;
            if (m1) await page.evaluate(OPEN(m1)).catch(() => {});
            await page.waitForTimeout(8000);
        }
        return await page.evaluate(MEASURE);
    } finally {
        await ctx.close();
    }
}

const browser = await chromium.launch();
const result: Record<string, Record<string, any>> = {};
for (const target of ['dashboard', ...SCENES.map((x) => x.name), 'settings']) {
    result[target] = {};
    for (const s of SEEDS) {
        const r = await measureTarget(browser, target, s);
        result[target][seedName(s)] = r;
        const tag = `${target} seed=${seedName(s)}`;
        if (target === 'settings') {
            console.log(`MEAS  ${tag}  ${JSON.stringify(r)}`);
            check(`${tag}: the Appearance section rendered (control)`, r.appearance && r.placeholder, `appearance=${r.appearance} placeholder=${r.placeholder}`);
            check(`${tag}: no theme radio and no Dark label`, r.radios === 0 && !r.darkLabel, `radios=${r.radios} darkLabel=${r.darkLabel}`);
            check(`${tag}: opening Settings writes no theme`, r.stored === s, `stored=${r.stored}`);
            continue;
        }
        // `.dark` alone is a homonym (Btn / CommandBar / tooltip button styles, report §A.4): it is in the page-side
        // regex only so that a mixed list like `[data-theme="dark"] .x, .dark .x` is caught; a rule left is a theme
        // rule only if it names the theme.
        const left = r.walk.darkParts.filter((p: string) => THEME_DARK.test(p) && !ALLOWED_DARK.test(p));
        console.log(`MEAS  ${tag}  attr=${r.attr} stored=${r.stored} editors=${JSON.stringify(r.editors)} nodes=${r.nodes} sheets=${r.walk.sheets} unreadable=${r.walk.unreadable} darkParts=${r.walk.darkParts.length} (left beyond StructureGroups: ${left.length}) darkMatching=${r.walk.darkMatching.length} mediaDark=${r.walk.mediaDark.length} els=${r.els ? r.els.length : '-'}`);
        check(`${tag}: no dark rule left but the critical-zone one`, left.length === 0, left.slice(0, 3).join(' ; '));
        check(`${tag}: no dark selector matches an element`, r.walk.darkMatching.length === 0, r.walk.darkMatching.slice(0, 3).join(' ; '));
        check(`${tag}: no OS-dark media block of ours`, r.walk.mediaDark.every((m: string) => /swal2/.test(m)), r.walk.mediaDark.join(' / ').slice(0, 200));
        check(`${tag}: data-theme`, r.attr === (s === 'light' ? 'light' : null), `attr=${r.attr}`);
        if (target !== 'dashboard') check(`${tag}: canvas rendered, every editor theme-light`, r.nodes > 0 && r.editors.length > 0 && r.editors.every((e: string) => e === 'theme-light'), `nodes=${r.nodes} editors=${JSON.stringify(r.editors)}`);
    }
    if (target !== 'settings') {
        const n = result[target].none, d = result[target].dark;
        const same = !!(d.els && canon({ root: d.root, body: d.body, els: d.els, editors: d.editors }) === canon({ root: n.root, body: n.body, els: n.els, editors: n.editors }));
        check(`${target}: a stored 'dark' renders exactly as nothing stored (state A)`, same, d.els ? 'compared' : `the dark seed carried data-theme=${d.attr}`);
    }
}
await browser.close();
writeFileSync(OUT, JSON.stringify(result));
console.log(`MEAS  written ${OUT}`);

if (BEFORE) {
    const before = JSON.parse(readFileSync(BEFORE, 'utf8'));
    for (const target of ['dashboard', ...SCENES.map((x) => x.name)]) {
        for (const s of ['none', 'light']) {
            const b = before[target]?.[s], a = result[target][s];
            const parts = ['root', 'body', 'editors', 'els'].filter((k) => canon(b?.[k]) !== canon(a?.[k]));
            let detail = parts.length ? `differs in ${parts.join(', ')}` : `identical (${a.els.length} elements, ${Object.keys(a.root).length} root vars)`;
            if (parts.includes('els') && b?.els) {
                const diffs: string[] = [];
                const n = Math.max(b.els.length, a.els.length);
                for (let i = 0; i < n && diffs.length < 3; i++) if (b.els[i] !== a.els[i]) diffs.push(`#${i}: ${String(b.els[i]).slice(0, 140)} -> ${String(a.els[i]).slice(0, 140)}`);
                detail += ` (elements ${b.els.length} -> ${a.els.length}; ${diffs.join(' ; ')})`;
            }
            check(`${target} seed=${s}: identical to the before run`, parts.length === 0, detail);
        }
    }
}

console.log(failures ? `FAIL  ${failures} check(s) failed` : 'PASS  all checks');
process.exit(failures ? 1 : 0);
