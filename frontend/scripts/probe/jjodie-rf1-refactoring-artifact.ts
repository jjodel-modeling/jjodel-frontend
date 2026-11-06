/**
 * jjodie-rf1-refactoring-artifact probe (P-2026-10-24-2200, R-JJD-14). Read-only on sources: it writes only to the
 * throwaway browser profile and to the lane folder.
 *
 * Question: does the «+» artifact menu create a Refactoring with its target level? «+» → Refactoring (enabled, new
 * subtitle) → Model of a metamodel → the tab opens empty with the target line under the title; the left bar lists it
 * under REFACTORINGS and the megamodel as «Refactoring»; `Run on` lists only the models of that metamodel; an M2
 * Refactoring lists only metamodels; an old entry without the field still opens, at any level.
 *
 * Fixture: scene_1_DemoPEST.jjodel (as jjodie-s6b-scripts-listing.ts).
 * Real app, own dev server (never 3000, 3001, 3003), light theme. One crop: the Refactoring tab's toolbar.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjodie-rf1-refactoring-artifact.ts --port 3012 --id P-2026-10-24-2200
 * Env:  RF1_SCENES  directory of the scene exports (default ~/jjodel-demo-exports)
 *       RF1_OUT     crop and JSON directory (default ~/.jjodel-lanes/P-2026-10-24-2200)
 *
 * Exit code: number of failed checks.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3012/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3003');
const SCENES_DIR = process.env.RF1_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const OUT = process.env.RF1_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-2200');
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 800)}`); };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 1500)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

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

const READ_STORE = `(async () => {
  const j = await import('/src/joiner/index.ts');
  const s = j.store.getState();
  const d = s.idlookup[j.U.getProjectID_URL()];
  const all = [...new Set([...(d?.metamodels || []), ...(d?.models || [])])].map(id => s.idlookup[id]).filter(Boolean);
  return {
    scripts: d?.scripts ?? null,
    metamodels: all.filter(m => m.isMetamodel).map(m => ({ id: m.id, name: m.name })),
    models: all.filter(m => !m.isMetamodel).map(m => ({ id: m.id, name: m.name, mm: m.instanceof })),
  };
})()`;
const readStore = (page: Page) => page.evaluate(READ_STORE) as Promise<any>;

/** The active Refactoring tab: its entry id, target line, `Run on` option values, and the editor text. */
const READ_TAB = `(() => {
  const t = document.querySelector('.dock-tabpane-active .script-tab');
  if (!t) return null;
  return {
    id: t.getAttribute('data-script-id'),
    target: t.querySelector('.script-tab__target')?.textContent?.trim() || null,
    level: t.querySelector('.script-tab__target')?.getAttribute('data-target-level') || null,
    options: [...t.querySelectorAll('.script-tab__model option')].map(o => o.value),
    run: t.querySelector('.script-tab__button--primary')?.textContent?.trim() || null,
    editor: (t.querySelector('.view-lines')?.textContent || '').trim(),
  };
})()`;
const readTab = (page: Page) => page.evaluate(READ_TAB) as Promise<any>;

const READ_REFACTORINGS = `(() => {
  const s = document.querySelector('.leftbar--project .psb-section[data-psb-section="scripts"]');
  if (!s) return null;
  const label = s.querySelector('.psb-section-label');
  return {
    label: label?.textContent || '',
    rendered: label ? getComputedStyle(label).textTransform : '',
    rows: [...s.querySelectorAll('.psb-item .psb-item-name')].map(r => r.textContent?.trim()),
    newRow: s.querySelector('.psb-new span')?.textContent?.trim() || '',
  };
})()`;

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
let st = await readStore(page);
meas('metamodels', st.metamodels);
meas('models', st.models);
const mm = st.metamodels.find((m: any) => st.models.some((x: any) => x.mm === m.id)) || st.metamodels[0];
check('a metamodel with models', !!mm, st.metamodels);

if (project && mm) {
    // 1. «+» → Refactoring: enabled, with the new subtitle.
    await page.locator('.new-document__btn').click();
    await wait(page, 400);
    const item = page.locator('.new-document__item', { hasText: 'Refactoring' });
    const itemInfo = await item.evaluate((b: any) => ({
        disabled: b.disabled, soon: !!b.querySelector('.new-document__soon'),
        desc: b.querySelector('.new-document__desc')?.textContent,
    }));
    check('the Refactoring entry is enabled, no «coming soon»', !itemInfo.disabled && !itemInfo.soon, itemInfo);
    check('its subtitle', itemInfo.desc === 'In-place changes of a metamodel or model', itemInfo.desc);
    await item.click();
    await wait(page, 500);
    const dialogOpen = await page.locator('#tpl-nrd-title').isVisible();
    check('the dialog asks the target level', dialogOpen, { dialogOpen });
    meas('dialog level options', await page.locator('input[name="tpl-nrd-level"]').evaluateAll((xs: any[]) => xs.map(x => x.value)));

    // 2. Model of a metamodel → Create.
    await page.locator('label.radio-card:has(input[name="tpl-nrd-level"][value="M1"])').click();
    await wait(page, 200);
    const mmChoices = await page.locator('input[name="tpl-nrd-metamodel"]').evaluateAll((xs: any[]) => xs.map(x => x.value));
    check('Model lists the project metamodels', same(mmChoices, st.metamodels.map((m: any) => m.id)), { mmChoices });
    await page.locator(`label.radio-card:has(input[name="tpl-nrd-metamodel"][value="${mm.id}"])`).click();
    await page.locator('.dialog-footer button[type="submit"]').click();
    await wait(page, 2500);
    check('the dialog closes', !(await page.locator('#tpl-nrd-title').isVisible()), {});

    st = await readStore(page);
    const entry = st.scripts?.[0];
    check('one entry in DProject.scripts with the target', st.scripts?.length === 1 && entry?.level === 'M1' && entry?.metamodelId === mm.id && entry?.text === '',
        st.scripts);
    let tab = await readTab(page);
    meas('tab M1', tab);
    check('its tab opens, empty', tab?.id === entry?.id && tab?.editor === '', tab);
    check('the target line under the title', tab?.target === `Refactoring · Model of ${mm.name}`, tab?.target);
    const compatible = st.models.filter((m: any) => m.mm === mm.id).map((m: any) => m.id);
    const others = st.models.filter((m: any) => m.mm !== mm.id).map((m: any) => m.id);
    meas('models of other metamodels', others);
    check('Run on lists only the models of the metamodel', same(tab?.options || [], compatible), { options: tab?.options, compatible });
    const toolbar = page.locator('.dock-tabpane-active .script-tab__toolbar');
    const box = await toolbar.boundingBox();
    if (box) await page.screenshot({ path: join(OUT, 'rf1_refactoring_tab.png'), clip: { x: box.x, y: Math.max(0, box.y - 34), width: Math.min(box.width, 900), height: box.height + 34 } });
    meas('crop', box ? join(OUT, 'rf1_refactoring_tab.png') : 'no toolbar');

    // 3. The left bar: REFACTORINGS.
    const tree = await page.evaluate(READ_REFACTORINGS) as any;
    meas('tree section', tree);
    check('the tree lists it under REFACTORINGS', /^refactorings$/i.test(tree?.label || '') && (tree?.rows || []).includes(entry?.name), tree);
    check('the tree offers New refactoring', tree?.newRow === 'New refactoring', tree?.newRow);

    // 4. An M2 Refactoring lists only metamodels.
    await page.evaluate(`(async () => { const sf = await import('/src/components/scripts/scriptFiles.ts'); sf.createProjectRefactoring({ level: 'M2', name: 'probe m2' }); })()`);
    await wait(page, 2000);
    tab = await readTab(page);
    meas('tab M2', tab);
    check('M2: target Metamodel, Run on only metamodels', tab?.target === 'Refactoring · Metamodel' && same(tab?.options || [], st.metamodels.map((m: any) => m.id)), tab);

    // 5. An old entry without the field still opens, at any level.
    const oldId = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const dm = await import('/src/components/abstract/DockManager.tsx');
      const pid = j.U.getProjectID_URL();
      const list = j.store.getState().idlookup[pid].scripts || [];
      const old = { id: 'Script_probe_old', name: 'old.jjs', text: '-- old', updatedAt: 1 };
      j.SetFieldAction.new(pid, 'scripts', [...list, old], '', false);
      await new Promise(r => setTimeout(r, 600));
      dm.default.openScript(old.id, old);
      return old.id;
    })()`);
    await wait(page, 2000);
    tab = await readTab(page);
    meas('tab old', tab);
    const anyLevel = [...st.models.map((m: any) => m.id), ...st.metamodels.map((m: any) => m.id)];
    check('the old entry opens at any level', tab?.id === oldId && tab?.target === 'Refactoring · Any level' && tab?.level === 'any', tab);
    check('any level: models first, then metamodels', same(tab?.options || [], anyLevel), { options: tab?.options, anyLevel });
    const stored = (await readStore(page)).scripts.find((s: any) => s.id === oldId);
    check('the old entry is not rewritten with a level', stored && !('level' in stored), stored);

    // 6. The tree's New refactoring opens the same dialog.
    await page.locator('.leftbar--project .psb-section[data-psb-section="scripts"] .psb-new').click().catch(() => {});
    await wait(page, 500);
    const treeDialog = await page.locator('#tpl-nrd-title').isVisible();
    check('the tree row opens the dialog', treeDialog, { treeDialog });
    await page.locator('.dialog-footer button[type="button"]', { hasText: 'Cancel' }).click().catch(() => {});
    await wait(page, 300);

    // 7. The megamodel names it Refactoring.
    await page.locator('.leftbar--project .psb-megamodel').click().catch(() => {});
    await wait(page, 2000);
    const types = await page.evaluate(`[...document.querySelectorAll('.mm-view .mm-card')].map(c => c.querySelector('.mm-card__type')?.textContent?.trim())`) as string[];
    meas('megamodel types', types);
    check('the megamodel shows three Refactoring cards', types.filter(t => t === 'Refactoring').length === 3 && !types.includes('JjScript file'), types);
    await page.locator('.mm-view__close').click().catch(() => {});
    result.store = await readStore(page);
}

check('no page errors', errors.length === 0, errors.slice(0, 5));
result.failures = failures;
writeFileSync(join(OUT, 'rf1_probe.json'), JSON.stringify(result, null, 2));
await browser.close();
console.log(`DONE  failures=${failures}`);
process.exit(failures);
