/**
 * codegen-check probe (P-2026-10-11-1053): the oracle's «Check» in the Code panel (R-GEN-11, R-GEN-17), on the two
 * lecture examples of codegen/examples/.
 *
 * Fresh context, Advanced mode, the experimental setting on. For each example, loaded as the S6 probe loads it
 * (codegen-oracle.ts; its page-side helpers copied here, that probe is not imported):
 *   - the scene is imported, the producer-consumer built in a new model by the README's JjScript, the fixture's bags
 *     (roles, `genTemplates`, declarations) written with the `state` setter, ids remapped by name; no scenario yet;
 *   - the Code panel opens from its pill, Output: with no stored scenario the scenario select and «Check» are
 *     disabled and Check's tooltip reads `Record a scenario in the simulator first.`; Run is not (crop
 *     check_disabled.png, turnstile);
 *   - two scenarios are stored on the model: the fixture's, and its first three steps under another name; the select
 *     lists both, in that order, with no reload;
 *   - Generate; the second scenario selected, «Check» passes on 3 steps under its name; the first selected, it passes
 *     on all its steps under its name (crop check_pass.png, turnstile). The Timeout field set to 1 ms, «Check» fails
 *     with the runner's timeout: the field's value reaches the oracle;
 *   - the S6 mutation, by editing a template in the Templates tab: the `main` template's string gains a last
 *     statement that swaps one postset place of the fixture's transition at load time (the README's mutation, in
 *     the generated program's own TRANSITIONS table, so it does not depend on how ids are printed); Generate,
 *     «Check»: the divergence line names the fixture's step and transition, the differing places are listed with
 *     their values, and the origin link selects the transition on the canvas and links exactly its spans (crop
 *     check_divergence.png, turnstile).
 * The row of «Run» keeps its height in every state: no result, pass, divergence, disabled.
 *
 * Crops, light theme, in ~/.jjodel-lanes/P-2026-10-11-1053/crops/ (CGC_CROPS), with their sizes printed.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/codegen-check.ts \
 *         --port 3092 --id P-2026-10-11-1053
 * Env:  CGC_EXAMPLE  one example name (default: both)
 *       CGC_OUT      JSON output (default frontend/scripts/smoke/_tmp_codegen-check.json, gitignored)
 *       CGC_CROPS    the folder of the crops
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3092/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const OUT = process.env.CGC_OUT || new globalThis.URL('../smoke/_tmp_codegen-check.json', import.meta.url).pathname;
const CROPS = process.env.CGC_CROPS || `${homedir()}/.jjodel-lanes/P-2026-10-11-1053/crops`;
const NAMES = process.env.CGC_EXAMPLE ? [process.env.CGC_EXAMPLE] : ['turnstile', 'petri-producer-consumer'];
const NO_SCENARIO = 'Record a scenario in the simulator first.';
mkdirSync(CROPS, { recursive: true });

interface Example {
    name: string;
    scene: string;
    lookup: Record<string, any>;
    jjscript?: string[];
    scenario: { name: string; steps: Array<{ event: string | null; selector: string | null; kind: string }>; expect?: string };
    mutation: { transition: string; from: string; to: string; step: number };
}

const example = (name: string): Example => JSON.parse(readFileSync(new globalThis.URL(`../../src/codegen/examples/${name}/${name}.json`, import.meta.url), 'utf8'));
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

async function crop(page: Page, file: string, box: { x: number; y: number; w: number; h: number }, pad = 8) {
    const vp = page.viewportSize() ?? { width: 1600, height: 1000 };
    const x = Math.max(0, Math.floor(box.x - pad));
    const y = Math.max(0, Math.floor(box.y - pad));
    const width = Math.min(vp.width - x, Math.ceil(box.w + 2 * pad));
    const height = Math.min(vp.height - y, Math.ceil(box.h + 2 * pad));
    await page.screenshot({ path: `${CROPS}/${file}`, clip: { x, y, width, height } });
    console.log(`CROP  ${CROPS}/${file}  ${width}x${height}`);
}

// ── Page side, copied from codegen-oracle.ts (plain strings: no transform) ─────────────────────────

const IMPORT = (text: string) => String.raw`(async () => {
  const api = await import('/src/api/persistance/projects.ts');
  const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
  const before = count();
  await api.ProjectsApi.importFromText(${JSON.stringify(text)});
  for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
  const a = JSON.parse(localStorage.getItem('projects') || '[]');
  return a.length > before ? a[a.length - 1].id : null;
})()`;

const LOADED = (mm: string, m1: string | null) => String.raw`(() => {
  try {
    const all = Object.values(window.windoww.store.getState().idlookup).filter((d) => d && typeof d === 'object');
    const a = all.find((d) => d.className === 'DModel' && d.isMetamodel && d.name === ${JSON.stringify(mm)});
    const b = ${JSON.stringify(m1)} === null ? null : all.find((d) => d.className === 'DModel' && !d.isMetamodel && d.name === ${JSON.stringify(m1)});
    if (!a || document.querySelectorAll('.dock-tab').length === 0) return null;
    if (${JSON.stringify(m1)} !== null && !b) return null;
    return { mm: a.id, m1: b ? b.id : null };
  } catch (e) { return null; }
})()`;

const NEW_MODEL = String.raw`(async () => {
  const j = await import('/src/joiner/index.ts');
  const nav = await import('/src/pages/components/Navbar.tsx');
  const p = j.L.fromPointer(j.DUser.current).project;
  const before = new Set((p.models || []).map((m) => m.id));
  nav.createM1(p, p.metamodels[0], false);
  for (let i = 0; i < 50; i++) {
    await new Promise((r) => setTimeout(r, 100));
    const m = (j.L.fromPointer(j.DUser.current).project.models || []).find((m) => !before.has(m.id) && !m.isMetamodel);
    if (m) return { id: m.id, name: m.name };
  }
  return null;
})()`;

const JJSCRIPT = (lines: string[], mm: { id: string; name: string }, m1: string) => String.raw`(async () => {
  const svc = await import('/src/jjscript/services/JjScriptService.ts');
  const ev = await import('/src/events/registry.ts');
  window.dispatchEvent(new CustomEvent(ev.JjScriptEvents.EXECUTION_START, { detail: { script: '', mode: 'run-all', commandCount: 0 } }));
  const scope = { level: 'M1', metamodelId: ${JSON.stringify(mm.id)}, metamodelName: ${JSON.stringify(mm.name)}, modelId: ${JSON.stringify(m1)} };
  const failed = [];
  for (const line of ${JSON.stringify(lines)}) {
    const r = await svc.JjScriptService.execute(line, scope);
    if (!r.success) failed.push(line + ' -> ' + r.message);
    await new Promise((r) => setTimeout(r, 150));
  }
  return failed;
})()`;

/** codegen-oracle.ts INSTALL without the scenario: the fixture's ids by name, then its bags with the `state` setter. */
const INSTALL = (ex: Example, ids: { mm: string; m1: string }) => String.raw`(async () => {
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
  return { map, missing, scenarios: (lk()[m1Id]._state || {}).runScenarios ?? null };
})()`;

/** The fixture's scenario and its first three steps under another name, stored on the model as the simulator stores them. */
const STORE_SCENARIOS = (ex: Example, m1Id: string, map: Record<string, string>, prefix: string) => String.raw`(async () => {
  const SC = await import('/src/model/simulation/scenarioCodec.ts');
  const map = ${JSON.stringify(map)};
  const remap = (v) => (typeof v === 'string' && Object.prototype.hasOwnProperty.call(map, v) ? map[v] : v);
  const scenario = ${JSON.stringify(ex.scenario)};
  const full = { ...scenario, steps: scenario.steps.map((s) => ({ ...s, event: remap(s.event), selector: remap(s.selector) })) };
  const first = { name: ${JSON.stringify(prefix)}, steps: full.steps.slice(0, 3) };
  window.LPointerTargetable.fromPointer(${JSON.stringify(m1Id)}).state = { [SC.RUN_SCENARIOS_KEY]: SC.encodeScenarios([full, first]) };
  await new Promise((r) => setTimeout(r, 300));
  return SC.decodeScenarios(window.windoww.store.getState().idlookup[${JSON.stringify(m1Id)}]._state.runScenarios).scenarios.map((s) => s.name);
})()`;

const PANE = (m1Id: string) => `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1Id}"]'))`;
const CLICK = (expr: string) => String.raw`(() => { const el = ${expr}; if (!el) return { found: false }; el.click(); return { found: true }; })()`;
const BOX = (expr: string) => String.raw`(() => { const el = ${expr}; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`;

/** The run row's controls and the result area, as the user reads them. */
const STATE = (panel: string) => String.raw`(() => {
  const p = ${panel};
  const row = p && p.querySelector('.codegen-panel__run');
  if (!row) return null;
  const select = row.querySelector('select[aria-label="Scenario"]');
  const buttons = [...row.querySelectorAll('button')];
  const run = row.querySelector('.codegen-panel__button--primary');
  const chk = buttons.find((b) => /^Check(ing)?$/.test(b.textContent.trim()));
  const pass = p.querySelector('.codegen-panel__result--pass');
  const bad = p.querySelector('.codegen-panel__result--error');
  return {
    rowHeight: row.getBoundingClientRect().height,
    select: select ? { disabled: select.disabled, value: select.value, options: [...select.options].map((o) => o.textContent), height: select.getBoundingClientRect().height } : null,
    check: chk ? { disabled: chk.disabled, title: chk.title, text: chk.textContent.trim(), height: chk.getBoundingClientRect().height } : null,
    run: run ? { disabled: run.disabled, height: run.getBoundingClientRect().height } : null,
    pass: pass ? { text: pass.textContent.trim(), color: getComputedStyle(pass).color } : null,
    error: bad ? {
      head: (bad.querySelector('.codegen-panel__run-error') || {}).textContent || null,
      lines: [...bad.querySelectorAll('.codegen-panel__check-line')].map((l) => l.textContent),
      at: (bad.querySelector('.codegen-panel__run-at') || {}).textContent || null,
      link: (bad.querySelector('.codegen-panel__link') || {}).textContent || null,
    } : null,
  };
})()`;

/** Select a scenario by name in the panel's select, as a user picks it. */
async function chooseScenario(page: Page, pane: string, name: string) {
    const handle = await page.evaluateHandle(`${pane}.querySelector('.codegen-panel__run select[aria-label="Scenario"]')`);
    await (handle.asElement() as any).selectOption({ label: name });
}

async function clickCheck(page: Page, panel: string): Promise<any> {
    await page.evaluate(String.raw`(() => { const p = ${panel}; [...p.querySelectorAll('.codegen-panel__result')].forEach((r) => r.setAttribute('data-probe-stale', '1')); })()`);
    await page.evaluate(CLICK(`[...${panel}.querySelectorAll('.codegen-panel__run button')].find((b) => b.textContent.trim() === 'Check')`));
    return poll<any>(page, String.raw`(() => {
      const p = ${panel};
      const r = p.querySelector('.codegen-panel__result--pass:not([data-probe-stale]), .codegen-panel__result--error:not([data-probe-stale])');
      if (!r) return null;
      const btn = [...p.querySelectorAll('.codegen-panel__run button')].find((b) => /^Check(ing)?$/.test(b.textContent.trim()));
      return btn && btn.textContent.trim() === 'Check' ? true : null;
    })()`, 90000).then(async ok => (ok ? page.evaluate(STATE(panel)) : null));
}

/** The S6 mutation as a template edit: one postset place of a transition swapped in the program's own table. */
function mutatedBody(body: string, swap: { transition: string; from: string; to: string }): string | null {
    const trimmed = body.replace(/\s+$/, '');
    if (!trimmed.endsWith('"')) return null;
    const statement = `\n// Probe mutation (scripts/probe/codegen-check.ts): one target of a transition swapped.\n`
        + `for (const t of TRANSITIONS) if (t.id === '${swap.transition}') t.postset = t.postset.map(a => (a.place === '${swap.from}' ? { place: '${swap.to}', weight: a.weight } : a));\n`;
    return trimmed.slice(0, -1) + statement + '"';
}

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
const result: Record<string, any> = { url: URL, examples: {} };

for (const name of NAMES) {
    const ex = example(name);
    const r: Record<string, any> = {};
    result.examples[name] = r;
    const crops = name === 'turnstile';
    const mmName = ex.lookup.MM.name as string;
    const m1Name = ex.jjscript ? null : (ex.lookup.M.name as string);
    const prefix = `${ex.scenario.name} (first 3)`;

    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await poll(page, `!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 120000);
    await wait(page, 2000);
    const pid = await page.evaluate(IMPORT(readFileSync(scene(ex.scene), 'utf8'))) as string | null;
    check(`${name}: the scene ${ex.scene} is imported`, !!pid, String(pid));
    if (!pid) continue;
    await page.goto(`${URL}/?open=${encodeURIComponent(pid)}#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    const loaded = await poll<{ mm: string; m1: string | null }>(page, LOADED(mmName, m1Name), 120000);
    check(`${name}: the project loads`, !!loaded, JSON.stringify(loaded));
    if (!loaded) continue;
    await wait(page, 3000);

    let m1 = loaded.m1;
    if (ex.jjscript) {
        const created = await page.evaluate(NEW_MODEL) as { id: string; name: string } | null;
        check(`${name}: a new model of ${mmName}`, !!created, JSON.stringify(created));
        if (!created) continue;
        m1 = created.id;
        const failed = await page.evaluate(JJSCRIPT(ex.jjscript, { id: loaded.mm, name: mmName }, m1)) as string[];
        check(`${name}: the JjScript of the README builds the model (${ex.jjscript.length} commands)`, failed.length === 0, failed.slice(0, 5));
        await wait(page, 1500);
    }
    if (!m1) continue;

    const installed = await page.evaluate(INSTALL(ex, { mm: loaded.mm, m1 })) as any;
    check(`${name}: every element of the fixture has its namesake in the app`, installed.missing.length === 0, installed.missing);
    check(`${name}: the model has no stored scenario yet`, installed.scenarios === null, String(installed.scenarios));
    const appId = (fid: string) => installed.map[fid] ?? fid;

    // The model's editor, then the Code panel from its pill, on Output.
    await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(m1)})); })()`);
    const pane = PANE(m1);
    await poll(page, `(() => { const p = ${pane}; return !!p && p.querySelectorAll('.react-flow__node').length > 0; })()`, 60000);
    await wait(page, 2000);
    check(`${name}: the Code pill is on the model's editor`, !!(await poll(page, `!!(${pane} && ${pane}.querySelector('.codegen-pill button'))`, 30000)), '');
    await page.evaluate(CLICK(`${pane}.querySelector('.codegen-pill button')`));
    const panel = `${pane}.querySelector('.codegen-panel')`;
    check(`${name}: the pill opens the panel`, !!(await poll(page, `!!(${panel})`, 60000)), '');
    const tab = (label: string) => page.evaluate(CLICK(`[...${panel}.querySelectorAll('.codegen-panel__tab')].find((b) => b.textContent.trim() === '${label}')`));
    await tab('Output');
    await poll(page, `!!(${panel}.querySelector('.codegen-panel__code'))`, 30000);
    await wait(page, 500);

    // No stored scenario: the select and «Check» are off, Check says why; Run is not.
    const off = await page.evaluate(STATE(panel)) as any;
    r.disabled = off;
    note(`${name}: no scenario`, off);
    check(`${name}: with no stored scenario the select and Check are disabled, Check's tooltip reads «${NO_SCENARIO}», Run is enabled`,
        !!off && off.select?.disabled === true && off.check?.disabled === true && off.check?.title === NO_SCENARIO && off.run?.disabled === false,
        JSON.stringify(off));
    const rowHeight = off?.rowHeight ?? 0;
    const pBox = await page.evaluate(BOX(panel)) as any;
    if (crops && pBox) await crop(page, 'check_disabled.png', pBox);

    // Two scenarios stored on the model: the select follows, with no reload.
    const stored = await page.evaluate(STORE_SCENARIOS(ex, m1, installed.map, prefix)) as string[];
    check(`${name}: two scenarios stored on the model`, stored.length === 2 && stored[0] === ex.scenario.name && stored[1] === prefix, stored);
    const listed = await poll<any>(page, String.raw`(() => { const s = ${STATE(panel)}; return s && s.select && !s.select.disabled ? s : null; })()`, 10000);
    check(`${name}: the select lists the stored scenarios, in order, and Check is enabled`,
        !!listed && JSON.stringify(listed.select.options) === JSON.stringify([ex.scenario.name, prefix]) && listed.check?.disabled === false && listed.check?.title !== NO_SCENARIO,
        JSON.stringify(listed?.select ?? null));

    // Generate; the first three steps, then the whole scenario: both pass, each under its own name and count.
    await page.locator('.codegen-panel__timeout input').fill('10000');
    await page.locator('.codegen-panel__timeout input').blur();
    await page.evaluate(CLICK(`[...${panel}.querySelectorAll('.codegen-panel__button')].find((b) => b.textContent.trim() === 'Generate')`));
    await wait(page, 500);
    await chooseScenario(page, pane, prefix);
    const short = await clickCheck(page, panel);
    r.passShort = short;
    note(`${name}: Check on «${prefix}»`, short);
    check(`${name}: Check passes on the selected scenario «${prefix}», 3 steps`,
        short?.pass?.text === `Agrees with the simulator on 3 steps · ${prefix}`, JSON.stringify(short?.pass ?? short?.error ?? null));
    await chooseScenario(page, pane, ex.scenario.name);
    const full = await clickCheck(page, panel);
    r.passFull = full;
    note(`${name}: Check on «${ex.scenario.name}»`, full);
    const n = ex.scenario.steps.length;
    check(`${name}: Check passes on «${ex.scenario.name}», ${n} steps`,
        full?.pass?.text === `Agrees with the simulator on ${n} steps · ${ex.scenario.name}`, JSON.stringify(full?.pass ?? full?.error ?? null));
    check(`${name}: the row of Run keeps its height with a pass shown`, !!full && full.rowHeight === rowHeight && full.select.height === full.run.height && full.check.height === full.run.height,
        `${rowHeight} -> ${full?.rowHeight}; select ${full?.select?.height}, check ${full?.check?.height}, run ${full?.run?.height}`);
    if (crops && pBox) await crop(page, 'check_pass.png', (await page.evaluate(BOX(panel))) as any);

    // The field's timeout reaches the oracle: at 1 ms the run is stopped.
    await page.locator('.codegen-panel__timeout input').fill('1');
    const timed = await clickCheck(page, panel);
    r.timeout = timed;
    note(`${name}: Check at 1 ms`, timed?.error ?? timed?.pass ?? null);
    check(`${name}: at a 1 ms Timeout, Check reports the runner's timeout`,
        timed?.error?.head === 'The program did not run' && /^timeout: The run did not finish in 1 ms/.test(timed?.error?.lines?.[0] ?? ''), JSON.stringify(timed?.error ?? timed?.pass ?? null));
    await page.locator('.codegen-panel__timeout input').fill('10000');
    await page.locator('.codegen-panel__timeout input').blur();

    // The S6 mutation, written in the `main` template through the Templates tab.
    const m = ex.mutation;
    const swap = { transition: appId(m.transition), from: appId(m.from), to: appId(m.to) };
    await tab('Templates');
    await poll(page, `!!(${panel}.querySelector('.codegen-panel__item'))`, 10000);
    await page.evaluate(CLICK(`[...${panel}.querySelectorAll('.codegen-panel__item')].find((b) => b.querySelector('.codegen-panel__item-name').textContent === 'main')`));
    await wait(page, 300);
    const textarea = page.locator('.codegen-panel__editor textarea');
    const body = await textarea.inputValue();
    const mutated = mutatedBody(body, swap);
    check(`${name}: the main template is one string the mutation can extend`, mutated !== null, body.slice(-40));
    if (mutated === null) continue;
    await textarea.fill(mutated);
    await page.locator('.codegen-panel__editor .codegen-panel__button--primary').click();
    await wait(page, 500);
    await tab('Output');
    await poll(page, `!!(${panel}.querySelector('.codegen-panel__code'))`, 30000);
    await page.evaluate(CLICK(`[...${panel}.querySelectorAll('.codegen-panel__button')].find((b) => b.textContent.trim() === 'Generate')`));
    await wait(page, 500);
    const genErrors = await page.evaluate(`[...${panel}.querySelectorAll('.codegen-panel__error')].map((e) => e.textContent)`) as string[];
    check(`${name}: the mutated templates generate with no error`, genErrors.length === 0, genErrors.slice(0, 3));
    await chooseScenario(page, pane, ex.scenario.name);
    const bad = await clickCheck(page, panel);
    r.divergence = bad;
    note(`${name}: Check after the mutation`, bad?.error ?? bad?.pass ?? null);
    const trName = ex.lookup[m.transition].name as string;
    const fromName = ex.lookup[m.from].name as string;
    const toName = ex.lookup[m.to].name as string;
    check(`${name}: the divergence names step ${m.step} and transition ${trName}`,
        bad?.error?.head === `Diverges at step ${m.step} · ${trName}`, JSON.stringify(bad?.error ?? bad?.pass ?? null));
    // The token the simulator puts in `from` the program puts in `to`: one less in the first, one more in the second.
    const delta = (place: string) => {
        const line = (bad?.error?.lines as string[] | undefined ?? []).map(l => new RegExp(`^place ${place}: expected (\\d+), actual (\\d+)$`).exec(l)).find(x => x);
        return line ? Number(line[2]) - Number(line[1]) : null;
    };
    check(`${name}: the swapped places are listed with expected and actual, ${fromName} one token less, ${toName} one more`,
        !!bad?.error && delta(fromName) === -1 && delta(toName) === 1 && bad.error.lines.length <= 6, JSON.stringify(bad?.error?.lines ?? null));
    check(`${name}: the origin link names the transition, at a line of the text`,
        bad?.error?.link === trName && /^line \d+ · /.test(bad?.error?.at ?? ''), JSON.stringify({ at: bad?.error?.at, link: bad?.error?.link }));
    check(`${name}: the row of Run keeps its height with a divergence shown`, !!bad && bad.rowHeight === rowHeight, `${rowHeight} -> ${bad?.rowHeight}`);
    if (crops && pBox) await crop(page, 'check_divergence.png', (await page.evaluate(BOX(panel))) as any);

    // The origin link selects the transition: its vertex (or, drawn as an edge, its source and the outline), and links its spans.
    const picked = await page.evaluate(String.raw`(async () => {
      const p = ${panel};
      const pane = ${pane};
      p.querySelector('.codegen-panel__result--error .codegen-panel__link').click();
      await new Promise((r) => setTimeout(r, 400));
      const lk = window.windoww.store.getState().idlookup;
      const selected = [...pane.querySelectorAll('.react-flow__node.selected')].map((n) => (lk[n.getAttribute('data-id')] || {}).model || n.getAttribute('data-id'));
      const linked = [...p.querySelectorAll('.code-span--linked')].map((s) => s.getAttribute('data-origin-id'));
      return { selected, linked: linked.length, ids: [...new Set(linked)], outline: !!pane.parentElement.querySelector('.codegen-panel__edge-outline') || !!document.querySelector('.codegen-panel__edge-outline') };
    })()`) as any;
    r.picked = picked;
    note(`${name}: origin link clicked`, picked);
    check(`${name}: the origin link selects the transition on the canvas and links exactly its spans`,
        picked.linked > 0 && picked.ids.length === 1 && picked.ids[0] === swap.transition
        && ((picked.selected.length === 1 && picked.selected[0] === swap.transition) || picked.outline === true), JSON.stringify(picked));
}

const own = errors.filter(e => /codegen|oracle|jjodelOracle/i.test(e));
result.errors = errors;
note('console errors', { total: errors.length, codegen: own.length });
check('no console error from the generator or the oracle', own.length === 0, own.slice(0, 5));
writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  (${OUT})`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
