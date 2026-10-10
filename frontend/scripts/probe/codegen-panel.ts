/**
 * codegen-panel probe (P-2026-10-10-1825): the experimental setting, the lazy mount and the code panel with its
 * navigable origin, in the app (R-GEN-2, R-GEN-5, R-GEN-12, R-GEN-14; discovery §E.4, §I.5).
 *
 * Phase off (fresh context, Advanced mode, the setting never written). For each of the four demo scenes
 * (fixtures/scene_{1..4}_*.jjodel): import, open the M1 tab, measure every node box of its pane keyed by the element's
 * name, then write the scene's Simulation profile and open the Simulation panel. Over the whole phase, requests whose
 * path matches `/src/codegen/(?!setting)` are counted: 0 expected. Control: `/src/codegen/setting.ts` itself is
 * requested (the listener sees the directory). No `.codegen-pill` anywhere.
 * With CGP_BEFORE (the JSON of a run on the base tree, CGP_PHASE=base), every node box equals the base's, 0 px.
 *
 * Phase on (fresh context, DemoESM with its Extended state machine profile). Settings (Ctrl+,) → Advanced → the
 * «Code generation» checkbox; the pill appears with no reload, 8px right of the Simulation chip, on its centre line,
 * and no generator module is requested until it is pressed. Then, through the panel's own controls:
 *   - two templates written (`main`, `state`), saved in the metamodel's `genTemplates`;
 *   - Output: the text expected for DemoESM, no error; for every span with a model origin, a click makes the vertex of
 *     that element the only selected node within 400 ms (React Flow ids are DVertex ids, the vertex's `model` is the
 *     element: measured in this lane, so the criterion's `[data-id]` is the vertex's);
 *   - for every element of a span, a click on its canvas node marks with `code-span--linked` exactly the spans whose
 *     origin id is that element;
 *   - hover: every span of the fragment outlined, the origin bar «element · feature · transformation»;
 *   - Run: `main()` returns; a module whose `check_unlocked` throws reports its line and the element `unlocked`, and
 *     the line is marked; `while (true) {}` is stopped at a 1500 ms timeout; a template with an error refuses Run.
 * The record the panel passes to `generate` is `buildEvalContext`'s: its handles carry `id` and the feature keys
 * (the ticket S2 left to this slice), measured in the page on the same model.
 *
 * Crops, light theme, in ~/.jjodel-lanes/P-2026-10-10-1825/crops/ with their sizes printed: settings_advanced.png,
 * editor_pill.png, panel_templates.png, panel_output.png, panel_hover.png, panel_linked.png, editor_linked.png,
 * panel_run_error.png.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/codegen-panel.ts \
 *         --port 3086 --id P-2026-10-10-1825
 * Env:  CGP_PHASE   'base': phase off only, no assertion that needs the slice (for the base tree);
 *                   'on': phase on only (the mutation bench)
 *       CGP_OUT     JSON output (default frontend/scripts/smoke/_tmp_codegen-panel.json, gitignored)
 *       CGP_BEFORE  the JSON of a base run, to compare node boxes with
 */
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3086/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const BASE_PHASE = process.env.CGP_PHASE === 'base';
const ON_ONLY = process.env.CGP_PHASE === 'on';
const OUT = process.env.CGP_OUT || new globalThis.URL('../smoke/_tmp_codegen-panel.json', import.meta.url).pathname;
const BEFORE = process.env.CGP_BEFORE || '';
const CROPS = `${homedir()}/.jjodel-lanes/P-2026-10-10-1825/crops`;
const fixture = (name: string) => new globalThis.URL(`./fixtures/${name}.jjodel`, import.meta.url).pathname;
mkdirSync(CROPS, { recursive: true });

const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const GENERATOR = /\/src\/codegen\/(?!setting)/;
const SETTING = /\/src\/codegen\/setting\.ts/;

const SCENES = [
    { name: 'PEST', fixture: 'scene_1_DemoPEST', mm: 'DemoPEST', m1: 'demoSM', profile: 'stateMachine', decls: [] as unknown[] },
    { name: 'Petri', fixture: 'scene_2_DemoPetri', mm: 'DemoPetri', m1: 'demoNet', profile: 'petri', decls: [] as unknown[] },
    {
        name: 'ESM', fixture: 'scene_3_DemoESM', mm: 'DemoESM', m1: 'demoESM', profile: 'extendedStateMachine', decls: [
            { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
            { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: '', equation: 'model.[coins] >= 2' },
        ] as unknown[],
    },
    {
        name: 'FlowB', fixture: 'scene_4_DemoFlowB', mm: 'DemoFlowB', m1: 'demoFlowB', profile: 'flowchart',
        decls: [{ name: 'count', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' }] as unknown[],
    },
];

// The templates the probe writes through the panel. JjEL bodies; `${…}` is literal in these single-quoted strings.
const TEMPLATES = {
    main: {
        params: '',
        body: '"export const states = [\n  ${stc.nodes.map(s => state(s)).join(",\n")}\n];\n'
            + 'export const transitions = [${stc.transitions.map(t => "\'${t.name}\'").join(", ")}];\n'
            + 'export function main() {\n  return { states: states.length, transitions: transitions.length };\n}\n"',
    },
    state: { params: 's', body: '"{ name: \'${s.name}\' }"' },
    boom: {
        params: '',
        body: '"export function main() {\n  return [${stc.nodes.map(s => "check_${s.name}()").join(", ")}];\n}\n'
            + '${stc.nodes.map(s => "function check_${s.name}() { if (\'${s.name}\' === \'unlocked\') throw new Error(\'${s.name} fails\'); return \'${s.name}\'; }").join("\n")}\n"',
    },
    spin: { params: '', body: '"export function main() {\n  while (true) {}\n}\n"' },
    bad: { params: '', body: '"${nothing.at.all}"' },
};
const EXPECTED_MAIN = [
    'export const states = [',
    "  { name: 'locked' },",
    "  { name: 'unlocked' },",
    "  { name: 'off' }",
    '];',
    "export const transitions = ['tc', 'tp', 'tu', 'ts'];",
    'export function main() {',
    '  return { states: states.length, transitions: transitions.length };',
    '}',
].join('\n');

// ── Page side (plain strings: no transform) ────────────────────────────────────────────────────
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
    return a && b && document.querySelectorAll('.dock-tab').length > 0 ? { mm: a.id, m1: b.id } : null;
  } catch (e) { return null; }
})()`;

/** The Simulation panel's Apply, written in the page (console-errors-demo.ts CONFIGURE). */
const CONFIGURE = (mmId: string, m1Id: string, profileId: string, decls: unknown[]) => String.raw`(async () => {
  const w = window;
  const idl = () => w.windoww.store.getState().idlookup;
  const all = () => Object.values(idl()).filter((d) => d && typeof d === 'object');
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const RS = await import('/src/components/editor-v2/sim/simRoleStatus.ts');
  const SK = await import('/src/components/editor-v2/sim/metamodelSketch.ts');
  const MK = await import('/src/components/editor-v2/sim/modelMarkings.ts');
  const PR = await import('/src/model/simulation/simProfiles.ts');
  const C = await import('/src/model/simulation/stateAttributesCodec.ts');
  const mm = ${JSON.stringify(mmId)}, m1 = ${JSON.stringify(m1Id)};
  L(mm).state = { simEnabled: true };
  await new Promise((r) => setTimeout(r, 300));
  const lookup = idl();
  const bag = lookup[mm]._state || {};
  const profile = PR.systemProfile(${JSON.stringify(profileId)});
  const bindings = RS.profileBindings(profile, SK.sketchOfMetamodel(lookup, mm), bag);
  const boundBag = RS.boundProposalInputs(profile, bag, bindings) ? RS.boundProposalBag(profile, bag, bindings) : null;
  const largest = boundBag ? MK.boundEstimate(lookup, mm, boundBag) : null;
  const classIds = all().filter((d) => d.className === 'DClass' && !d.abstract).map((d) => d.id);
  const res = RS.profilePatch(profile, bag, bindings, lookup, classIds, largest);
  if (res.kind !== 'write') return { error: 'profile refused' };
  L(mm).state = res.patch;
  await new Promise((r) => setTimeout(r, 300));
  const decls = ${JSON.stringify(decls)};
  if (decls.length > 0) { L(m1).state = { simStateAttributes: C.encodeStateAttributes(decls) }; await new Promise((r) => setTimeout(r, 300)); }
  return { patch: Object.keys(res.patch).sort() };
})()`;

const PANE = (m1Id: string) => `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1Id}"]'))`;
const CLICK = (expr: string) => String.raw`(() => { const el = ${expr}; if (!el) return { found: false }; el.click(); return { found: true }; })()`;
const BOX = (expr: string) => String.raw`(() => { const el = ${expr}; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`;

/** Every node box of the pane, keyed by the element's name (and its class when a name repeats). */
const NODE_BOXES = (m1Id: string) => String.raw`(() => {
  const pane = ${PANE(m1Id)};
  if (!pane) return null;
  const lk = window.windoww.store.getState().idlookup;
  const out = {};
  for (const n of pane.querySelectorAll('.react-flow__node')) {
    const v = lk[n.getAttribute('data-id')];
    const o = v && lk[v.model];
    let key = (o && o.name) || n.getAttribute('data-id');
    if (key in out) key = key + ':' + ((o && o.className) || '') + ':' + Object.keys(out).length;
    const r = n.getBoundingClientRect();
    out[key] = { x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 };
  }
  return out;
})()`;

async function poll<T>(page: Page, expr: string, ms: number): Promise<T | null> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        const v = await page.evaluate(expr).catch(() => null) as T | null;
        if (v) return v;
        await wait(page, 250);
    }
    return null;
}

async function open(page: Page, s: typeof SCENES[number]): Promise<{ mm: string; m1: string } | null> {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await poll(page, `!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 120000);
    await wait(page, 2000);
    const pid = await page.evaluate(IMPORT(readFileSync(fixture(s.fixture), 'utf8'))) as string | null;
    if (!pid) {
        note(`${s.name}: import`, 'no project id');
        return null;
    }
    // A document load, not a hash change: switching project in place left the 3rd scene unloaded for 120 s, on the
    // base tree and on the slice alike (measured in this lane).
    await page.goto(`${URL}/?open=${encodeURIComponent(pid)}#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    const ids = await poll<{ mm: string; m1: string }>(page, LOADED(s.mm, s.m1), 120000);
    await wait(page, 3000);
    if (!ids) {
        note(`${s.name}: load`, `project ${pid} did not load`);
        return null;
    }
    const tab = await page.evaluate(CLICK(`[...document.querySelectorAll('.dock-tab')].find((t) => t.textContent.trim() === ${JSON.stringify(s.m1)})`)) as any;
    if (!tab.found) await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)})); })()`);
    await poll(page, `(() => { const p = ${PANE(ids.m1)}; return !!p && p.querySelectorAll('.react-flow__node').length > 0; })()`, 60000);
    await wait(page, 3000);
    return ids;
}

async function crop(page: Page, file: string, box: { x: number; y: number; w: number; h: number }, pad = 8) {
    const vp = page.viewportSize() ?? { width: 1600, height: 1000 };
    const x = Math.max(0, Math.floor(box.x - pad));
    const y = Math.max(0, Math.floor(box.y - pad));
    const width = Math.min(vp.width - x, Math.ceil(box.w + 2 * pad));
    const height = Math.min(vp.height - y, Math.ceil(box.h + 2 * pad));
    await page.screenshot({ path: `${CROPS}/${file}`, clip: { x, y, width, height } });
    console.log(`CROP  ${CROPS}/${file}  ${width}x${height}`);
}

async function newContext(browser: Awaited<ReturnType<typeof chromium.launch>>): Promise<{ ctx: BrowserContext; page: Page; requests: string[]; errors: string[] }> {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    await seed(ctx, true);
    const page = await ctx.newPage();
    const requests: string[] = [];
    const errors: string[] = [];
    page.on('request', r => requests.push(r.url()));
    page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
    return { ctx, page, requests, errors };
}

const browser = await chromium.launch();
const result: any = { url: URL, phase: BASE_PHASE ? 'base' : 'slice', boxes: {} };

try {
    // ── Phase off ─────────────────────────────────────────────────────────────────────────────────
    if (!ON_ONLY) {
        const off = await newContext(browser);
        let pills = 0;
        for (const s of SCENES) {
            const ids = await open(off.page, s);
            check(`off: ${s.name} opened`, !!ids, JSON.stringify(ids));
            if (!ids) continue;
            result.boxes[s.name] = await off.page.evaluate(NODE_BOXES(ids.m1));
            note(`off: ${s.name} node boxes`, `${Object.keys(result.boxes[s.name] ?? {}).length} nodes`);
            await off.page.evaluate(CONFIGURE(ids.mm, ids.m1, s.profile, s.decls));
            await wait(off.page, 1000);
            const sim = await off.page.evaluate(CLICK(`${PANE(ids.m1)} && ${PANE(ids.m1)}.querySelector('.sim-panel__chip')`)) as any;
            await wait(off.page, 1500);
            check(`off: ${s.name} the Simulation panel opened`, sim.found && await off.page.evaluate(`!!(${PANE(ids.m1)}.querySelector('.sim-panel--open'))`) as boolean, JSON.stringify(sim));
            const found = await off.page.evaluate(`document.querySelectorAll('.codegen-pill, .codegen-panel').length`) as number;
            pills += found;
        }
        const offGenerator = off.requests.filter(u => GENERATOR.test(new globalThis.URL(u).pathname));
        const offSetting = off.requests.filter(u => SETTING.test(new globalThis.URL(u).pathname));
        result.off = { requests: off.requests.length, generator: offGenerator, setting: offSetting.length, pills, errors: off.errors };
        note('off: requests', { total: off.requests.length, generator: offGenerator.length, setting: offSetting.length });
        check('off: 0 requests matching /src/codegen/(?!setting)', offGenerator.length === 0, offGenerator.slice(0, 5));
        if (!BASE_PHASE) check('off: control, /src/codegen/setting.ts was requested (the listener sees the directory)', offSetting.length > 0, `${offSetting.length}`);
        check('off: no Code pill and no Code panel in any scene', pills === 0, `${pills}`);
        if (BEFORE) {
            const before = JSON.parse(readFileSync(BEFORE, 'utf8'));
            for (const s of SCENES) {
                const a = before.boxes?.[s.name] ?? {};
                const b = result.boxes[s.name] ?? {};
                const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
                const deltas = keys.map(k => {
                    const p = a[k], q = b[k];
                    if (!p || !q) return { k, missing: !p ? 'base' : 'slice' };
                    return { k, d: Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y), Math.abs(p.w - q.w), Math.abs(p.h - q.h)) };
                });
                const worst = deltas.filter(d => 'missing' in d || (d as any).d !== 0);
                check(`off: ${s.name} node boxes equal the base, 0 px (${keys.length} nodes)`, keys.length > 0 && worst.length === 0, worst.slice(0, 5));
            }
        }
        await off.ctx.close();
    }

    if (!BASE_PHASE) {
        // ── Phase on ──────────────────────────────────────────────────────────────────────────────
        const on = await newContext(browser);
        const page = on.page;
        const esm = SCENES[2];
        const ids = await open(page, esm);
        check('on: DemoESM opened', !!ids, JSON.stringify(ids));
        if (!ids) throw new Error('no DemoESM');
        result.configure = await page.evaluate(CONFIGURE(ids.mm, ids.m1, esm.profile, esm.decls));
        await wait(page, 1000);
        const pane = PANE(ids.m1);
        check('on: no pill before the setting', await page.evaluate(`document.querySelectorAll('.codegen-pill').length`) === 0, '');

        // Settings → Advanced → Code generation.
        await page.keyboard.press('Control+,');
        await poll(page, `!!document.querySelector('.unified-settings-modal.visible')`, 10000);
        await page.evaluate(CLICK(`[...document.querySelectorAll('.settings-nav-item')].find((b) => b.textContent.trim() === 'Advanced')`));
        await wait(page, 600);
        const box = await page.evaluate(String.raw`(() => {
          const label = [...document.querySelectorAll('.settings-checkbox')].find((l) => (l.textContent || '').includes('Code generation'));
          if (!label) return null;
          const group = label.closest('.settings-group');
          const input = label.querySelector('input');
          const r = group.getBoundingClientRect();
          return { checked: input.checked, title: (group.querySelector('.settings-label') || {}).textContent, x: r.x, y: r.y, w: r.width, h: r.height };
        })()`) as any;
        check('on: Settings → Advanced holds «Code generation» under «Experimental», unchecked', !!box && box.title === 'Experimental' && box.checked === false, JSON.stringify(box));
        await page.evaluate(CLICK(`[...document.querySelectorAll('.settings-checkbox')].find((l) => (l.textContent || '').includes('Code generation')).querySelector('input')`));
        await wait(page, 400);
        const stored = await page.evaluate(`localStorage.getItem('jjodel.experimental.codegen')`);
        check('on: the checkbox writes the key', stored === 'true', `${stored}`);
        const content = await page.evaluate(BOX(`document.querySelector('.unified-settings-content')`)) as any;
        if (content && box) await crop(page, 'settings_advanced.png', { x: content.x, y: box.y - 8, w: content.w, h: box.h + 16 }, 0);
        await page.evaluate(CLICK(`document.querySelector('.unified-settings-close')`));
        await wait(page, 800);

        // The pill, with no reload, beside the Simulation chip; nothing of the generator yet.
        const pill = await poll<any>(page, String.raw`(() => {
          const p = ${pane};
          const pill = p && p.querySelector('.codegen-pill');
          const chip = p && p.querySelector('.sim-panel--closed .sim-panel__chip');
          if (!pill || !chip) return null;
          const a = chip.getBoundingClientRect(), b = pill.getBoundingClientRect(), c = pill.querySelector('button').getBoundingClientRect();
          return { chip: { x: a.x, y: a.y, w: a.width, h: a.height }, pill: { x: b.x, y: b.y, w: b.width, h: b.height }, button: { x: c.x, y: c.y, w: c.width, h: c.height }, text: pill.textContent.trim() };
        })()`, 5000);
        result.pill = pill;
        note('on: pill', pill);
        check('on: the pill shows after the checkbox, no reload', !!pill && pill.text === 'Code', JSON.stringify(pill));
        if (pill) {
            check('on: the pill sits 8px right of the Simulation chip', Math.abs(pill.button.x - (pill.chip.x + pill.chip.w + 8)) < 0.5, `${pill.chip.x + pill.chip.w} + 8 vs ${pill.button.x}`);
            check('on: the pill is on the chip\'s centre line, same height', Math.abs((pill.button.y + pill.button.h / 2) - (pill.chip.y + pill.chip.h / 2)) < 0.5 && pill.button.h === pill.chip.h, `${pill.chip.y + pill.chip.h / 2} vs ${pill.button.y + pill.button.h / 2}`);
            await crop(page, 'editor_pill.png', { x: pill.chip.x - 80, y: pill.chip.y - 60, w: pill.button.x + pill.button.w - pill.chip.x + 160, h: pill.chip.h + 100 }, 0);
        }
        const beforePanel = on.requests.filter(u => GENERATOR.test(new globalThis.URL(u).pathname));
        check('on: no generator module requested before the pill is pressed', beforePanel.length === 0, beforePanel.slice(0, 5));

        // The panel follows the Simulation panel open and closed.
        await page.evaluate(CLICK(`${pane}.querySelector('.sim-panel__chip')`));
        await wait(page, 800);
        const follow = await page.evaluate(String.raw`(() => { const p = ${pane}; const s = p.querySelector('.sim-panel--open').getBoundingClientRect(); const b = p.querySelector('.codegen-pill button').getBoundingClientRect(); return { simRight: s.x + s.width, pill: b.x }; })()`) as any;
        check('on: with the Simulation panel open the pill moves 8px right of it', Math.abs(follow.pill - (follow.simRight + 8)) < 0.5, JSON.stringify(follow));
        await page.evaluate(CLICK(`${pane}.querySelector('.sim-panel__collapse')`));
        await wait(page, 800);

        // Open the panel: the lazy chunk loads now.
        await page.evaluate(CLICK(`${pane}.querySelector('.codegen-pill button')`));
        const panelOpen = await poll(page, `!!(${pane}.querySelector('.codegen-panel'))`, 60000);
        check('on: the pill opens the panel', !!panelOpen, '');
        const afterPanel = on.requests.filter(u => /\/src\/codegen\/ui\/CodePanel\.tsx/.test(new globalThis.URL(u).pathname));
        check('on: pressing the pill requests the lazy CodePanel module', afterPanel.length > 0, `${afterPanel.length}`);

        // Two templates, through the panel's controls.
        const panel = `${pane}.querySelector('.codegen-panel')`;
        const writeTemplate = async (name: keyof typeof TEMPLATES) => {
            const t = TEMPLATES[name];
            await page.evaluate(CLICK(`${panel}.querySelector('.codegen-panel__add')`));
            await wait(page, 500);
            const fields = page.locator('.codegen-panel__editor .codegen-panel__input');
            await fields.nth(0).fill(name);
            await fields.nth(1).fill(t.params);
            await page.locator('.codegen-panel__editor .codegen-panel__body-input').fill(t.body);
            await page.locator('.codegen-panel__editor .codegen-panel__button--primary').click();
            await wait(page, 600);
        };
        await writeTemplate('main');
        await writeTemplate('state');
        const saved = await page.evaluate(String.raw`(() => {
          const raw = window.windoww.store.getState().idlookup[${JSON.stringify(ids.mm)}]._state.genTemplates;
          try { return JSON.parse(raw).templates.map((t) => ({ name: t.name, params: t.params })); } catch (e) { return String(raw); }
        })()`);
        check('on: the two templates are saved in the metamodel\'s genTemplates', JSON.stringify(saved) === JSON.stringify([{ name: 'main', params: [] }, { name: 'state', params: ['s'] }]), JSON.stringify(saved));
        const pBox = await page.evaluate(BOX(panel)) as any;
        if (pBox) await crop(page, 'panel_templates.png', pBox);

        // Output.
        await page.evaluate(CLICK(`[...${panel}.querySelectorAll('.codegen-panel__tab')].find((b) => b.textContent.trim() === 'Output')`));
        await poll(page, `!!(${panel}.querySelector('.codegen-panel__code'))`, 10000);
        await wait(page, 300);
        const out = await page.evaluate(String.raw`(() => {
          const p = ${panel};
          const lines = [...p.querySelectorAll('.codegen-panel__line')].map((l) => l.querySelector('.codegen-panel__text').textContent);
          const spans = [...p.querySelectorAll('.code-span[data-origin-id]')].map((s) => ({ id: s.getAttribute('data-origin-id'), text: s.textContent }));
          return { code: lines.join('\n'), spans, errors: p.querySelectorAll('.codegen-panel__error').length, gutter: [...p.querySelectorAll('.codegen-panel__gutter')].map((g) => g.textContent).join(',') };
        })()`) as any;
        result.output = out;
        note('on: output', { lines: out.code.split('\n').length, spans: out.spans.length, gutter: out.gutter });
        check('on: the generated text is the expected module, no error', out.code === EXPECTED_MAIN && out.errors === 0, out.code);
        check('on: one model span per state and transition name', out.spans.length === 7 && out.spans.map((s: any) => s.text).join(',') === 'locked,unlocked,off,tc,tp,tu,ts', out.spans.map((s: any) => s.text).join(','));
        const oBox = await page.evaluate(BOX(panel)) as any;
        if (oBox) await crop(page, 'panel_output.png', oBox);

        // The record buildEvalContext gives generate: handles with id and feature keys.
        result.handles = await page.evaluate(String.raw`(async () => {
          const JS = await import('/src/jjscript/index.ts');
          const B = await import('/src/components/editor-v2/sim/simBridge.ts');
          const J = await import('/src/joiner/index.ts');
          const lk = window.windoww.store.getState().idlookup;
          const pid = (() => { try { return window.LPointerTargetable.fromPointer(J.DUser.current).project.id; } catch (e) { return ''; } })();
          const g = JS.buildEvalContext(B.evalContextFor(lk, ${JSON.stringify(ids.m1)}, pid), { extentModelId: ${JSON.stringify(ids.m1)} });
          const objs = (window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)}).allSubObjects || []).map((o) => lk[o.id]).filter(Boolean);
          const missing = [];
          for (const o of objs) {
            const h = (g.instances || []).find((x) => x && x.id === o.id);
            if (!h) { missing.push(o.name + ': no handle'); continue; }
            for (const v of (o.features || []).map((f) => lk[f]).filter(Boolean)) {
              const f = lk[v.instanceof];
              if (f && f.name && !(f.name in h)) missing.push(o.name + '.' + f.name);
            }
          }
          return { objects: objs.length, instances: (g.instances || []).length, missing };
        })()`);
        note('on: buildEvalContext handles', result.handles);
        check('on: every object of the model has a handle with its id and its feature keys', result.handles.objects > 0 && result.handles.missing.length === 0, JSON.stringify(result.handles));

        // Hover.
        const target = page.locator('.codegen-panel .code-span[data-origin-id]').nth(1);
        await target.hover();
        await wait(page, 300);
        const hover = await page.evaluate(String.raw`(() => {
          const p = ${panel};
          const h = [...p.querySelectorAll('.code-span--hover')];
          const frag = h.length ? h[0].getAttribute('data-fragment') : null;
          const same = [...p.querySelectorAll('.code-span')].filter((s) => s.getAttribute('data-fragment') === frag);
          return { hovered: h.map((s) => s.textContent), same: same.length, all: h.length === same.length && same.every((s) => h.includes(s)), bar: p.querySelector('.codegen-panel__origin').textContent };
        })()`) as any;
        result.hover = hover;
        note('on: hover', hover);
        check('on: hover outlines every span of the fragment, and only them', hover.hovered.length > 0 && hover.all, JSON.stringify(hover));
        check('on: hover shows «element · feature · transformation»', hover.bar === 'unlocked · name · identity', hover.bar);
        const hBox = await page.evaluate(BOX(panel)) as any;
        if (hBox) await crop(page, 'panel_hover.png', hBox);
        await page.mouse.move(5, 5);

        // Every model span: a click selects the element's vertex, alone, within 400 ms.
        result.clicks = await page.evaluate(String.raw`(async () => {
          const pane = ${pane};
          const lk = () => window.windoww.store.getState().idlookup;
          const spans = [...pane.querySelectorAll('.codegen-panel .code-span[data-origin-id]')];
          const out = [];
          for (let i = 0; i < spans.length; i++) {
            const s = [...pane.querySelectorAll('.codegen-panel .code-span[data-origin-id]')][i];
            const id = s.getAttribute('data-origin-id');
            const vertices = [...pane.querySelectorAll('.react-flow__node')].filter((n) => (lk()[n.getAttribute('data-id')] || {}).model === id).map((n) => n.getAttribute('data-id'));
            const t0 = performance.now();
            s.click();
            let selected = [], ms = null;
            while (performance.now() - t0 < 400) {
              await new Promise((r) => setTimeout(r, 10));
              selected = [...pane.querySelectorAll('.react-flow__node.selected')].map((n) => n.getAttribute('data-id'));
              if (selected.length === 1 && vertices.includes(selected[0])) { ms = Math.round(performance.now() - t0); break; }
            }
            out.push({ text: s.textContent, id, vertices, selected, ms });
            await new Promise((r) => setTimeout(r, 400));
          }
          return out;
        })()`);
        const slow = (result.clicks as any[]).filter(c => c.ms === null);
        note('on: span clicks', (result.clicks as any[]).map(c => `${c.text}:${c.ms}ms`).join(' '));
        check('on: every model span click makes its element\'s vertex the only selected node within 400 ms', (result.clicks as any[]).length === 7 && slow.length === 0, slow);

        // Canvas to code: each element's node clicked on the canvas marks exactly its spans.
        result.linked = await page.evaluate(String.raw`(async () => {
          const pane = ${pane};
          const lk = () => window.windoww.store.getState().idlookup;
          const ids = [...new Set([...pane.querySelectorAll('.codegen-panel .code-span[data-origin-id]')].map((s) => s.getAttribute('data-origin-id')))];
          const out = [];
          for (const id of ids) {
            const node = [...pane.querySelectorAll('.react-flow__node')].find((n) => (lk()[n.getAttribute('data-id')] || {}).model === id);
            if (!node) { out.push({ id, node: false }); continue; }
            node.click();
            await new Promise((r) => setTimeout(r, 500));
            const linked = [...pane.querySelectorAll('.codegen-panel .code-span--linked')];
            const own = [...pane.querySelectorAll('.codegen-panel .code-span')].filter((s) => s.getAttribute('data-origin-id') === id);
            out.push({ id, name: (lk()[id] || {}).name, linked: linked.length, own: own.length, exact: linked.length === own.length && own.length > 0 && own.every((s) => linked.includes(s)) });
          }
          return out;
        })()`);
        const inexact = (result.linked as any[]).filter(l => !l.exact);
        note('on: canvas selection', (result.linked as any[]).map(l => `${l.name}:${l.linked}/${l.own}`).join(' '));
        check('on: a canvas selection marks code-span--linked on exactly the spans of that element, for every element', (result.linked as any[]).length === 7 && inexact.length === 0, inexact);
        const lBox = await page.evaluate(BOX(panel)) as any;
        if (lBox) await crop(page, 'panel_linked.png', lBox);
        const paneBox = await page.evaluate(BOX(pane)) as any;
        if (paneBox) await crop(page, 'editor_linked.png', paneBox, 0);

        // Run: main() returns.
        await page.locator('.codegen-panel__timeout input').fill('60000');
        await page.locator('.codegen-panel__run .codegen-panel__button--primary').click();
        const ran = await poll<any>(page, String.raw`(() => { const r = ${panel}.querySelector('.codegen-panel__result'); return r ? { text: r.textContent, error: r.classList.contains('codegen-panel__result--error') } : null; })()`, 90000);
        note('on: run main', ran);
        check('on: Run calls main() and shows what it returned', !!ran && !ran.error && /"states": 3/.test(ran.text) && /"transitions": 4/.test(ran.text), JSON.stringify(ran));

        // Keys typed in a template body stay in the panel: EditorV2 deletes the canvas selection on Backspace.
        const selectTc = String.raw`(() => {
          const pane = ${pane};
          const lk = window.windoww.store.getState().idlookup;
          const n = [...pane.querySelectorAll('.react-flow__node')].find((x) => ((lk[(lk[x.getAttribute('data-id')] || {}).model] || {}).name) === 'tc');
          if (n) n.click();
          return !!n;
        })()`;
        const census = String.raw`(() => {
          const pane = ${pane};
          const lk = window.windoww.store.getState().idlookup;
          const names = [...pane.querySelectorAll('.react-flow__node')].map((x) => (lk[(lk[x.getAttribute('data-id')] || {}).model] || {}).name);
          return { nodes: names.length, tc: names.includes('tc'), selected: [...pane.querySelectorAll('.react-flow__node.selected')].length };
        })()`;
        await page.evaluate(selectTc);
        await wait(page, 500);
        await page.evaluate(CLICK(`[...${panel}.querySelectorAll('.codegen-panel__tab')].find((b) => b.textContent.trim() === 'Templates')`));
        await wait(page, 400);
        const keysBefore = await page.evaluate(census) as any;
        await page.locator('.codegen-panel__editor .codegen-panel__body-input').click();
        for (const key of ['End', 'Backspace', 'Backspace', 'Delete']) await page.keyboard.press(key);
        await wait(page, 800);
        const keysAfter = await page.evaluate(census) as any;
        result.keys = { keysBefore, keysAfter };
        note('on: Backspace in a template body', result.keys);
        check('on: Backspace and Delete in a template body leave the selected canvas node in place', keysBefore.selected === 1 && keysBefore.tc && keysAfter.tc && keysAfter.nodes === keysBefore.nodes, JSON.stringify(result.keys));

        // Run: a deliberate throw points at its line and at its element.
        await writeTemplate('boom');
        await writeTemplate('spin');
        await writeTemplate('bad');
        await page.evaluate(CLICK(`[...${panel}.querySelectorAll('.codegen-panel__tab')].find((b) => b.textContent.trim() === 'Output')`));
        await wait(page, 600);
        await page.locator('.codegen-panel__select').selectOption('boom');
        await wait(page, 600);
        const boomLine = await page.evaluate(String.raw`(() => [...${panel}.querySelectorAll('.codegen-panel__line')].find((l) => l.querySelector('.codegen-panel__text').textContent.startsWith('function check_unlocked'))?.getAttribute('data-line'))()`) as string | undefined;
        await page.locator('.codegen-panel__timeout input').fill('60000');
        await page.locator('.codegen-panel__run .codegen-panel__button--primary').click();
        const boom = await poll<any>(page, String.raw`(() => {
          const p = ${panel};
          const r = p.querySelector('.codegen-panel__result--error');
          if (!r) return null;
          const marked = [...p.querySelectorAll('.codegen-panel__line--error')].map((l) => l.getAttribute('data-line'));
          return { error: r.querySelector('.codegen-panel__run-error').textContent, at: (r.querySelector('.codegen-panel__run-at') || {}).textContent, element: (r.querySelector('.codegen-panel__link') || {}).textContent, marked };
        })()`, 90000);
        result.boom = { boomLine, boom };
        note('on: run boom', result.boom);
        check('on: a runtime error names its line of the generated text, and the line is marked', !!boom && !!boomLine && new RegExp(`^line ${boomLine},`).test(boom.at ?? '') && boom.marked.length === 1 && boom.marked[0] === boomLine && /^runtime: Error: unlocked fails/.test(boom.error), JSON.stringify(result.boom));
        check('on: the runtime error points at the element unlocked', !!boom && boom.element === 'unlocked', JSON.stringify(boom));
        const eBox = await page.evaluate(BOX(panel)) as any;
        if (eBox) await crop(page, 'panel_run_error.png', eBox);
        if (boom?.element) {
            const jump = await page.evaluate(String.raw`(async () => {
              const pane = ${pane};
              pane.querySelector('.codegen-panel__link').click();
              await new Promise((r) => setTimeout(r, 400));
              const lk = window.windoww.store.getState().idlookup;
              return [...pane.querySelectorAll('.react-flow__node.selected')].map((n) => (lk[(lk[n.getAttribute('data-id')] || {}).model] || {}).name);
            })()`);
            check('on: the error\'s element link selects it on the canvas', JSON.stringify(jump) === '["unlocked"]', JSON.stringify(jump));
        }

        // Run: an endless loop is stopped at the timeout.
        await page.locator('.codegen-panel__select').selectOption('spin');
        await wait(page, 600);
        await page.locator('.codegen-panel__timeout input').fill('1500');
        const t0 = Date.now();
        await page.locator('.codegen-panel__run .codegen-panel__button--primary').click();
        const spin = await poll<any>(page, String.raw`(() => { const r = ${panel}.querySelector('.codegen-panel__result--error .codegen-panel__run-error'); return r ? r.textContent : null; })()`, 30000);
        const spinMs = Date.now() - t0;
        result.spin = { spin, spinMs };
        note('on: run spin', result.spin);
        check('on: while (true) {} is stopped at the 1500 ms timeout', !!spin && /^timeout: The run did not finish in 1500 ms/.test(spin) && spinMs >= 1400 && spinMs < 8000, JSON.stringify(result.spin));

        // Run is refused while the generation has errors.
        await page.locator('.codegen-panel__select').selectOption('bad');
        await wait(page, 600);
        const bad = await page.evaluate(String.raw`(() => { const p = ${panel}; return { errors: [...p.querySelectorAll('.codegen-panel__error')].map((e) => e.textContent), disabled: p.querySelector('.codegen-panel__run .codegen-panel__button--primary').disabled }; })()`) as any;
        note('on: bad', bad);
        check('on: an error fragment is listed above the text and Run is refused', bad.errors.length > 0 && bad.disabled === true, JSON.stringify(bad));

        result.on = { errors: on.errors };
        note('on: page errors', on.errors.length);
        for (const e of on.errors.slice(0, 8)) console.log(`      ${e}`);
        await on.ctx.close();
    }
} catch (e: any) {
    failures++;
    console.log(`FAIL  exception  ${e?.message ?? String(e)}`);
} finally {
    result.failures = failures;
    writeFileSync(OUT, JSON.stringify(result, null, 1));
    await browser.close();
    console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  out ${OUT}  crops ${CROPS}`);
    process.exit(failures === 0 ? 0 : 1);
}
