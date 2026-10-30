/**
 * jjodie-s6a-script-file probe (P-2026-10-24-0312, slice S6a of R-JJD-5). Read-only on sources: it writes only to
 * the throwaway browser profile and to the lane folder.
 *
 * Question: does a script file live in the project and in its tab as S6a asks? On an imported project saved before
 * `DProject.scripts` existed, the field reads empty. `openScriptAsFile` creates `probe script.jjs` and opens its tab;
 * typing in Monaco marks it dirty, Save writes the entry. Save the project, reload it: the entry is intact and its tab
 * reopens with the saved text. `Run on <model>` opens the model canvas and shows the S4b preview bar.
 *
 * Fixture: scene_1_DemoPEST.jjodel (as jjodie-s3c-jjel-live.ts); the first M1 whose metamodel has a concrete class.
 * Real app, own dev server (never 3000, 3001, 3003), light theme. One crop: the script tab after the reload.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjodie-s6a-script-file.ts --port 3016 --id P-2026-10-24-0312
 * Env:  S6A_SCENES  directory of the scene exports (default ~/jjodel-demo-exports)
 *       S6A_OUT     crop and JSON directory (default ~/.jjodel-lanes/P-2026-10-24-0312)
 *
 * Exit code: number of failed checks.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3016/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3003');
const SCENES_DIR = process.env.S6A_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const OUT = process.env.S6A_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-0312');
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 800)}`); };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 1500)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

async function openProject(page: Page, project: string) {
    await page.goto(`${URL}/#/project?id=${project}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 9000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
}

async function importScene(page: Page, file: string): Promise<string | null> {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 5000);
    const text = readFileSync(`${SCENES_DIR}/${file}`, 'utf8');
    const project = await page.evaluate(`(async () => {
      const api = await import('/src/api/persistance/projects.ts');
      const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
      const before = count();
      await api.ProjectsApi.importFromText(${JSON.stringify(text)});
      for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
      const a = JSON.parse(localStorage.getItem('projects') || '[]');
      return a.length > before ? a[a.length - 1].id : null;
    })()`) as string | null;
    if (project) await openProject(page, project);
    return project;
}

async function openModel(page: Page, id: string) {
    await page.evaluate(`(async () => { const j = await import('/src/joiner/index.ts'); const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(id)})); })()`).catch(() => {});
    await wait(page, 4000);
}

/** The project's script entries and the M1 models with one concrete class each, from the store. */
const READ_PROJECT = `(async () => {
  const j = await import('/src/joiner/index.ts');
  const pw = await import('/src/jjscript/executor/planWorld.ts');
  const s = j.store.getState();
  const pid = j.U.getProjectID_URL();
  const d = s.idlookup[pid];
  const models = (d?.models || []).map(id => s.idlookup[id]).filter(m => m && !m.isMetamodel).map(m => {
    const w = pw.buildPlanWorld(s.idlookup, m.id);
    const c = Object.values(w.classes).find(c => !c.abstract && !c.singleton);
    return { id: m.id, name: m.name, cls: c ? c.name : null };
  });
  return { pid, hasField: !!d && ('scripts' in d), scripts: d?.scripts ?? null, models };
})()`;
const readProject = (page: Page) => page.evaluate(READ_PROJECT) as Promise<any>;

const READ_TAB = `(() => {
  const tab = document.querySelector('.dock-tabpane-active .script-tab');
  return {
    present: !!tab,
    scriptId: tab && tab.getAttribute('data-script-id'),
    name: tab && tab.querySelector('.script-tab__name')?.textContent,
    dirty: !!(tab && tab.querySelector('.script-tab__dirty')),
    text: tab && [...tab.querySelectorAll('.view-line')].map(l => l.textContent.replace(/\\u00a0/g, ' ')).join('\\n'),
    saveDisabled: tab && tab.querySelector('.script-tab__button')?.disabled,
    model: tab && tab.querySelector('.script-tab__model')?.value,
    runLabel: tab && tab.querySelector('.script-tab__button--primary')?.textContent,
    tabTitles: [...document.querySelectorAll('.dock-tab-btn')].map(e => e.textContent),
  };
})()`;
const readTab = (page: Page) => page.evaluate(READ_TAB) as Promise<any>;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await seed(ctx, true);
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
const result: any = { url: URL };

const project = await importScene(page, 'scene_1_DemoPEST.jjodel');
check('imported', !!project, { project });
meas('theme', await page.evaluate(`document.documentElement.getAttribute('data-theme') || 'none'`));

let st = await readProject(page);
check('a project saved before the field has no scripts and reads empty', !st.hasField && st.scripts === null, { hasField: st.hasField, scripts: st.scripts });
const target = (st.models as any[]).find((m) => m.cls);
check('an M1 with a concrete class', !!target, st.models);
result.model = target;

if (project && target) {
    await openModel(page, target.id);
    const line1 = `create instance of ${target.cls} "ProbeA"`;
    const entry = await page.evaluate(`(async () => {
      const sf = await import('/src/components/scripts/scriptFiles.ts');
      return sf.openScriptAsFile(${JSON.stringify(line1)}, 'probe script', ${JSON.stringify(target.id)});
    })()`) as any;
    await wait(page, 2500);
    st = await readProject(page);
    check('openScriptAsFile creates one entry named probe script.jjs', !!entry && st.scripts?.length === 1 && st.scripts[0].name === 'probe script.jjs' && st.scripts[0].modelId === target.id, st.scripts);
    let tab = await readTab(page);
    check('its tab is open and active with the text', tab.present && tab.scriptId === entry?.id && tab.text === line1 && !tab.dirty && tab.saveDisabled === true, tab);
    check('the run button names the model', tab.model === target.id && tab.runLabel === `Run on ${target.name}`, { model: tab.model, run: tab.runLabel });

    // Edit in Monaco: a second line at the end.
    await page.locator('.dock-tabpane-active .script-tab .monaco-editor .view-lines').click();
    await page.keyboard.press('Meta+ArrowDown');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type(`create instance of ${target.cls} "ProbeB"`);
    await wait(page, 800);
    tab = await readTab(page);
    const line2 = `create instance of ${target.cls} "ProbeB"`;
    check('typing marks the tab dirty', tab.dirty && tab.saveDisabled === false && tab.text.includes('ProbeB'), tab);
    await page.locator('.dock-tabpane-active .script-tab .script-tab__button', { hasText: 'Save' }).click();
    await wait(page, 800);
    st = await readProject(page);
    tab = await readTab(page);
    const saved = st.scripts?.[0];
    check('Save writes the entry and clears the dirty mark', saved?.text === `${line1}\n${line2}` && !tab.dirty && saved?.updatedAt >= entry?.updatedAt, { text: saved?.text, dirty: tab.dirty });

    // Save the project, reload it.
    const stored = await page.evaluate(`(async () => {
      const api = await import('/src/api/persistance/projects.ts');
      const j = await import('/src/joiner/index.ts');
      const p = j.LProject.getProject();
      await api.ProjectsApi.save(p, { silent: true });
      await new Promise((r) => setTimeout(r, 2000));
      const a = JSON.parse(localStorage.getItem('projects') || '[]');
      return !!a.find((x) => x.id === p.id);
    })()`);
    check('project saved', stored === true, { stored });
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 4000);
    await openProject(page, project);
    st = await readProject(page);
    check('after reload the entry is intact', st.scripts?.length === 1 && JSON.stringify(st.scripts[0]) === JSON.stringify(saved), { before: saved, after: st.scripts });

    await openModel(page, target.id);
    const reopened = await page.evaluate(`(async () => {
      const dm = await import('/src/components/abstract/DockManager.tsx');
      return dm.default.openScript(${JSON.stringify(entry?.id)});
    })()`);
    await wait(page, 2500);
    tab = await readTab(page);
    check('the tab reopens with the saved text', reopened === true && tab.present && tab.text === `${line1}\n${line2}` && !tab.dirty, tab);
    result.tab = tab;
    const box = await page.locator('.dock-tabpane-active .script-tab').boundingBox();
    if (box) await page.screenshot({ path: `${OUT}/s6a_script_tab.png`, clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 140) } });

    // Run on <model>: the model canvas and the preview bar.
    await page.locator('.dock-tabpane-active .script-tab .script-tab__button--primary').click();
    let bar: any = null;
    for (let i = 0; i < 20 && !bar; i++) {
        await wait(page, 500);
        bar = await page.evaluate(() => {
            const b = document.querySelector('.dock-tabpane-active .jj-preview-bar') as HTMLElement | null;
            return b ? { text: b.textContent, w: Math.round(b.getBoundingClientRect().width), pane: b.closest('.dock-tabpane-active')?.id } : null;
        });
    }
    meas('preview bar', bar);
    check('Run on <model> shows the preview bar on that model', !!bar && /Preview/.test(bar.text) && /\+2 objects/.test(bar.text) && bar.pane === target.id, bar);
    const ghosts = await page.evaluate(() => document.querySelectorAll('.dock-tabpane-active .react-flow__node.jj-preview-node').length);
    meas('ghost nodes', ghosts);
    result.bar = bar;
    result.ghosts = ghosts;
}

check('no page errors', errors.length === 0, errors.slice(0, 5));
result.failures = failures;
writeFileSync(join(OUT, 's6a_probe.json'), JSON.stringify(result, null, 2));
await browser.close();
console.log(`DONE  failures=${failures}`);
process.exit(failures);
