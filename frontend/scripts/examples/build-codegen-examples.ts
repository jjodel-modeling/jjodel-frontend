/**
 * build-codegen-examples (P-2026-10-11-1415, slice S8): builds the two lecture examples of codegen/examples/ in a
 * running app and saves them as the project files a student imports, frontend/public/examples/codegen/<name>.jjodel.
 *
 * The files are written by the app's own export, not by hand. For each example, in a fresh browser context (so the
 * store holds that project alone):
 *   - the scene of the fixture is imported and opened; for the producer-consumer a new model of DemoPetri is created
 *     and built by the README's JjScript, then named as the fixture's model (`producerConsumer`);
 *   - the fixture's bags are written with the `state` setter, its ids mapped to the app's by name, as the S6 and S7b
 *     probes do (codegen-oracle.ts, codegen-check.ts; their page-side helpers copied here): the metamodel's roles and
 *     `genTemplates`, the model's data declarations;
 *   - the fixture's scenario is stored on the model under its own name, as the simulator stores it (`runScenarios`);
 *   - the project is renamed (`Turnstile`, `Producer-consumer`), the model is opened once so its layout is stored;
 *   - Navbar's File → «Download Project» is clicked (`ProjectsApi.save`, then `buildProjectExportJson`, then
 *     `U.download`), and the browser's download is the file.
 * The export's own extension is `.jjodel`: the dashboard's drop zone and the import menu accept no other.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/examples/build-codegen-examples.ts \
 *         --port 3096 --id P-2026-10-11-1415
 * Env:  CGB_EXAMPLE  one example name (default: both)
 *       CGB_DIR      the output folder (default frontend/public/examples/codegen)
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3096/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const DIR = process.env.CGB_DIR || new globalThis.URL('../../public/examples/codegen', import.meta.url).pathname;
const NAMES = process.env.CGB_EXAMPLE ? [process.env.CGB_EXAMPLE] : ['turnstile', 'petri-producer-consumer'];
/** The project name each file carries; an import shows it with the app's ` copy` suffix. */
const PROJECT: Record<string, string> = { turnstile: 'Turnstile', 'petri-producer-consumer': 'Producer-consumer' };
mkdirSync(DIR, { recursive: true });

interface Example {
    name: string;
    scene: string;
    lookup: Record<string, any>;
    jjscript?: string[];
    scenario: { name: string; steps: Array<{ event: string | null; selector: string | null; kind: string }>; expect?: string };
}

const example = (name: string): Example => JSON.parse(readFileSync(new globalThis.URL(`../../src/codegen/examples/${name}/${name}.json`, import.meta.url), 'utf8'));
const scene = (name: string) => new globalThis.URL(`../probe/fixtures/${name}.jjodel`, import.meta.url).pathname;

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

// ── Page side, copied from codegen-check.ts (plain strings: no transform) ──────────────────────

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

/** codegen-check.ts INSTALL: the fixture's ids by name, then its bags with the `state` setter. */
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

/** The fixture's scenario alone, under its own name, stored on the model as the simulator stores it. */
const STORE_SCENARIO = (ex: Example, m1Id: string, map: Record<string, string>) => String.raw`(async () => {
  const SC = await import('/src/model/simulation/scenarioCodec.ts');
  const map = ${JSON.stringify(map)};
  const remap = (v) => (typeof v === 'string' && Object.prototype.hasOwnProperty.call(map, v) ? map[v] : v);
  const scenario = ${JSON.stringify(ex.scenario)};
  const full = { ...scenario, steps: scenario.steps.map((s) => ({ ...s, event: remap(s.event), selector: remap(s.selector) })) };
  window.LPointerTargetable.fromPointer(${JSON.stringify(m1Id)}).state = { [SC.RUN_SCENARIOS_KEY]: SC.encodeScenarios([full]) };
  await new Promise((r) => setTimeout(r, 300));
  return SC.decodeScenarios(window.windoww.store.getState().idlookup[${JSON.stringify(m1Id)}]._state.runScenarios).scenarios.map((s) => ({ name: s.name, steps: s.steps.length }));
})()`;

const RENAME = (id: string, name: string) => String.raw`(async () => {
  window.LPointerTargetable.fromPointer(${JSON.stringify(id)}).name = ${JSON.stringify(name)};
  await new Promise((r) => setTimeout(r, 500));
  return window.windoww.store.getState().idlookup[${JSON.stringify(id)}].name;
})()`;

/** Navbar's File → «Download Project», the entry a user clicks (Navbar.tsx, `name: 'Download Project'`). */
const DOWNLOAD_ENTRY = String.raw`(() => {
  const li = [...document.querySelectorAll('li')].find((l) => { const s = l.querySelector(':scope > label span span'); return s && s.textContent.trim() === 'Download Project'; });
  if (!li) return false;
  li.click();
  return true;
})()`;

async function build(browser: Browser, name: string): Promise<void> {
    const ex = example(name);
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    await seed(ctx, true);
    await ctx.addInitScript(() => { localStorage.setItem('jjodel.experimental.codegen', 'true'); });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
    try {
        const mmName = ex.lookup.MM.name as string;
        const m1Name = ex.lookup.M.name as string;
        await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        await poll(page, `!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 120000);
        await wait(page, 2000);
        const pid = await page.evaluate(IMPORT(readFileSync(scene(ex.scene), 'utf8'))) as string | null;
        check(`${name}: the scene ${ex.scene} is imported`, !!pid, String(pid));
        if (!pid) return;
        await page.goto(`${URL}/?open=${encodeURIComponent(pid)}#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        const loaded = await poll<{ mm: string; m1: string | null }>(page, LOADED(mmName, ex.jjscript ? null : m1Name), 120000);
        check(`${name}: the project loads`, !!loaded, JSON.stringify(loaded));
        if (!loaded) return;
        await wait(page, 3000);

        let m1 = loaded.m1;
        if (ex.jjscript) {
            const created = await page.evaluate(NEW_MODEL) as { id: string; name: string } | null;
            check(`${name}: a new model of ${mmName}`, !!created, JSON.stringify(created));
            if (!created) return;
            m1 = created.id;
            const failed = await page.evaluate(JJSCRIPT(ex.jjscript, { id: loaded.mm, name: mmName }, m1)) as string[];
            check(`${name}: the JjScript of the README builds the model (${ex.jjscript.length} commands)`, failed.length === 0, failed.slice(0, 5));
            await wait(page, 1500);
            const renamed = await page.evaluate(RENAME(m1, m1Name));
            check(`${name}: the new model is named ${m1Name}`, renamed === m1Name, String(renamed));
        }
        if (!m1) return;

        const installed = await page.evaluate(INSTALL(ex, { mm: loaded.mm, m1 })) as any;
        check(`${name}: every element of the fixture has its namesake in the app`, installed.missing.length === 0, installed.missing);
        const stored = await page.evaluate(STORE_SCENARIO(ex, m1, installed.map)) as Array<{ name: string; steps: number }>;
        check(`${name}: the fixture's scenario is stored on the model under its name`,
            stored.length === 1 && stored[0].name === ex.scenario.name && stored[0].steps === ex.scenario.steps.length, stored);
        const project = await page.evaluate(RENAME(pid, PROJECT[name]));
        check(`${name}: the project is named ${PROJECT[name]}`, project === PROJECT[name], String(project));

        // The model's editor once, so its layout is in the store the export serializes.
        await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(m1)})); })()`);
        const pane = `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1}"]'))`;
        const nodes = await poll<number>(page, `(() => { const p = ${pane}; return p ? p.querySelectorAll('.react-flow__node').length : 0; })()`, 60000);
        check(`${name}: the model's editor shows its nodes`, (nodes ?? 0) > 0, String(nodes));
        await wait(page, 3000);

        // File → «Download Project»: the app saves the project, then downloads it.
        const download = page.waitForEvent('download', { timeout: 60000 });
        const clicked = await page.evaluate(DOWNLOAD_ENTRY) as boolean;
        check(`${name}: the Download Project entry of the File menu is clicked`, clicked, '');
        if (!clicked) return;
        const file = await download;
        const out = `${DIR}/${name}.jjodel`;
        await file.saveAs(out);
        const text = readFileSync(out, 'utf8');
        let parsed: Record<string, any> | null = null;
        try { parsed = JSON.parse(text); } catch { parsed = null; }
        check(`${name}: the download, ${file.suggestedFilename()}, is a project file`,
            !!parsed && typeof parsed.state === 'string' && parsed.state.length > 0 && parsed.name === PROJECT[name] && file.suggestedFilename().endsWith('.jjodel'),
            `${out} ${statSync(out).size} bytes`);
        check(`${name}: no page error`, errors.length === 0, errors.slice(0, 3));
    } finally {
        await ctx.close();
    }
}

const browser = await chromium.launch();
for (const name of NAMES) await build(browser, name);
await browser.close();
console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  (${DIR})`);
process.exit(failures === 0 ? 0 : 1);
