/**
 * jjodie-s6b-scripts-listing probe (P-2026-10-24-0355, slice S6b of R-JJD-5). Read-only on sources: it writes only to
 * the throwaway browser profile and to the lane folder.
 *
 * Question: are the project's script files listed as S6b asks? Two scripts made with `openScriptAsFile` (one on a
 * model, one on none) appear under REFACTORINGS in the left bar and as nodes of the megamodel view, the first linked to its
 * model; the existing megamodel nodes keep their place. A click on a row opens its tab; the row's context menu renames
 * it in place and offers Delete behind a confirmation. The rows of the other sections do not change.
 *
 * Fixture: scene_1_DemoPEST.jjodel (as jjodie-s6a-script-file.ts); its first M1 model.
 * Real app, own dev server (never 3000, 3001, 3003), light theme. One crop: the REFACTORINGS section after the rename.
 *
 * Labels follow R-JJD-14 (P-2026-10-25-1120): the section reads «Refactorings», the megamodel card «Refactoring».
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjodie-s6b-scripts-listing.ts --port 3017 --id P-2026-10-24-0355
 * Env:  S6B_SCENES  directory of the scene exports (default ~/jjodel-demo-exports)
 *       S6B_OUT     crop and JSON directory (default ~/.jjodel-lanes/P-2026-10-24-0355)
 *
 * Exit code: number of failed checks.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3017/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3003');
const SCENES_DIR = process.env.S6B_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const OUT = process.env.S6B_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-0355');
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

/** Every section of the project left bar: its label, its row names, and its index. */
const READ_SECTIONS = `(() => [...document.querySelectorAll('.leftbar--project .psb-section')].map((s, i) => ({
  i,
  label: s.querySelector('.psb-section-label')?.textContent || '',
  rows: [...s.querySelectorAll(':scope > .psb-section-body > .psb-item, :scope > .psb-section-body > .psb-action')]
    .map(r => (r.querySelector('.psb-item-name, span:not(.psb-badge)')?.textContent || '').trim()),
})))()`;
const readSections = (page: Page) => page.evaluate(READ_SECTIONS) as Promise<Array<{ i: number; label: string; rows: string[] }>>;
const others = (secs: Array<{ label: string; rows: string[] }>) => secs.filter(s => s.label !== 'Refactorings').map(s => `${s.label}:${s.rows.length}:${s.rows.join('|')}`);

const READ_STORE = `(async () => {
  const j = await import('/src/joiner/index.ts');
  const s = j.store.getState();
  const d = s.idlookup[j.U.getProjectID_URL()];
  const models = (d?.models || []).map(id => s.idlookup[id]).filter(m => m && !m.isMetamodel).map(m => ({ id: m.id, name: m.name }));
  return { scripts: d?.scripts ?? null, models };
})()`;
const readStore = (page: Page) => page.evaluate(READ_STORE) as Promise<any>;

/** The megamodel cards (name, kind class, left/top) and the number of drawn edge paths. */
const READ_MEGAMODEL = `(() => ({
  cards: [...document.querySelectorAll('.mm-view .mm-card')].map(c => ({
    name: c.querySelector('.mm-card__name')?.textContent?.trim(),
    kind: [...c.classList].find(k => /^mm-card--(metamodel|model|transformation|viewpoint)$/.test(k)),
    type: c.querySelector('.mm-card__type')?.textContent?.trim(),
    left: c.style.left, top: c.style.top,
  })),
  edges: document.querySelectorAll('.mm-view svg.mm-canvas--svg > g path').length,
}))()`;

async function readMegamodel(page: Page) {
    await page.locator('.leftbar--project .psb-megamodel').click();
    await wait(page, 2000);
    const mm = await page.evaluate(READ_MEGAMODEL) as any;
    await page.locator('.mm-view__close').click().catch(() => {});
    await wait(page, 800);
    return mm;
}

const ACTIVE_SCRIPT_TAB = `(() => document.querySelector('.dock-tabpane-active .script-tab')?.getAttribute('data-script-id') || null)()`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await seed(ctx, true);
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
// Console errors by phase (P-2026-10-24-0505): measured, not checked, to tell a megamodel-open error with no script from one with scripts.
let phase = 'setup';
const consoleErrors: Array<{ phase: string; text: string }> = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push({ phase, text: m.text().slice(0, 300) }); });
const result: any = { url: URL };

const project = await importScene(page, 'scene_1_DemoPEST.jjodel');
check('imported', !!project, { project });
meas('theme', await page.evaluate(`document.documentElement.getAttribute('data-theme') || 'none'`));

let st = await readStore(page);
const target = st.models?.[0];
check('an M1 model', !!target, st.models);

const before = await readSections(page);
meas('sections before', before.map(s => `${s.label}:${s.rows.length}`));
const scriptsIdx = before.findIndex(s => s.label === 'Refactorings');
const transIdx = before.findIndex(s => s.label === 'Transforms');
check('REFACTORINGS is listed right after Transforms, empty', scriptsIdx >= 0 && scriptsIdx === transIdx + 1 && before[scriptsIdx].rows.length === 0, { scriptsIdx, transIdx });
phase = 'megamodel-before';
const mmBefore = await readMegamodel(page);
phase = 'scripts';
meas('megamodel before', { cards: mmBefore.cards.length, edges: mmBefore.edges });
meas('megamodel before, cards', mmBefore.cards);

if (project && target) {
    await openModel(page, target.id);
    const created = await page.evaluate(`(async () => {
      const sf = await import('/src/components/scripts/scriptFiles.ts');
      const a = sf.openScriptAsFile('-- probe one', 'probe one', ${JSON.stringify(target.id)});
      await new Promise(r => setTimeout(r, 800));
      const b = sf.openScriptAsFile('-- probe two', 'probe two');
      return [a, b];
    })()`) as any[];
    await wait(page, 2000);
    st = await readStore(page);
    check('two scripts in the store', st.scripts?.length === 2 && created.every(Boolean), st.scripts?.map((s: any) => s.name));
    const [one, two] = created;

    let secs = await readSections(page);
    const rows = secs.find(s => s.label === 'Refactorings')?.rows || [];
    check('both are listed under REFACTORINGS with the .jjs name', JSON.stringify(rows) === JSON.stringify(['probe one.jjs', 'probe two.jjs']), rows);
    check('the other sections are unchanged after the create', JSON.stringify(others(secs)) === JSON.stringify(others(before)), { before: others(before), after: others(secs) });

    // Click opens the tab: the second script's tab is active, the click raises the first.
    const activeBefore = await page.evaluate(ACTIVE_SCRIPT_TAB);
    await page.locator(`.leftbar--project .psb-item[data-script-id="${one.id}"]`).click();
    await wait(page, 1200);
    const activeAfter = await page.evaluate(ACTIVE_SCRIPT_TAB);
    check('a click on a row opens its script tab', activeBefore === two.id && activeAfter === one.id, { activeBefore, activeAfter });

    // Context menu: Rename in place.
    await page.locator(`.leftbar--project .psb-item[data-script-id="${two.id}"]`).click({ button: 'right' });
    await wait(page, 400);
    const menu = await page.evaluate(() => {
        const m = document.querySelector('.psb-script-menu') as HTMLElement | null;
        if (!m) return null;
        const r = m.getBoundingClientRect();
        return { items: [...m.querySelectorAll('.tree-node__context-item')].map(e => e.textContent?.trim()), w: Math.round(r.width), h: Math.round(r.height), position: getComputedStyle(m).position, bg: getComputedStyle(m).backgroundColor };
    });
    meas('context menu', menu);
    check('the context menu offers Rename and Delete', !!menu && JSON.stringify(menu.items) === '["Rename","Delete"]' && menu.w > 0 && menu.h > 0, menu);
    await page.locator('.psb-script-menu .tree-node__context-item', { hasText: 'Rename' }).click();
    await wait(page, 300);
    const input = page.locator(`.leftbar--project .psb-item[data-script-id="${two.id}"] .psb-rename-input`);
    const initial = await input.inputValue().catch(() => null);
    check('the rename field opens on the name without .jjs', initial === 'probe two', { initial });
    await input.fill('renamed');
    await input.press('Enter');
    await wait(page, 800);
    st = await readStore(page);
    secs = await readSections(page);
    const renamedRows = secs.find(s => s.label === 'Refactorings')?.rows || [];
    check('rename writes renamed.jjs to the store and the row', st.scripts?.find((s: any) => s.id === two.id)?.name === 'renamed.jjs' && renamedRows.includes('renamed.jjs'), { store: st.scripts?.map((s: any) => s.name), rows: renamedRows });
    const section = await page.locator('.leftbar--project [data-psb-section="scripts"]').boundingBox();
    if (section) await page.screenshot({ path: `${OUT}/s6b_scripts_section.png`, clip: { x: section.x, y: section.y, width: section.width, height: section.height } });

    // Delete asks first; Cancel keeps the script.
    await page.locator(`.leftbar--project .psb-item[data-script-id="${two.id}"]`).click({ button: 'right' });
    await wait(page, 300);
    await page.locator('.psb-script-menu .tree-node__context-item', { hasText: 'Delete' }).click();
    await wait(page, 400);
    const dialog = await page.evaluate(() => document.querySelector('.confirm-dialog')?.textContent || null);
    check('Delete asks for confirmation', !!dialog && dialog.includes('renamed.jjs'), { dialog });
    await page.locator('.confirm-dialog button', { hasText: 'Cancel' }).click().catch(() => {});
    await wait(page, 400);
    st = await readStore(page);
    check('Cancel keeps both scripts', st.scripts?.length === 2, st.scripts?.map((s: any) => s.name));

    secs = await readSections(page);
    check('the other sections are unchanged at the end', JSON.stringify(others(secs)) === JSON.stringify(others(before)), { before: others(before), after: others(secs) });

    // Megamodel view: two script nodes, the existing nodes where they were, one more edge.
    phase = 'megamodel-after';
    const mmAfter = await readMegamodel(page);
    phase = 'end';
    meas('megamodel after', { cards: mmAfter.cards.length, edges: mmAfter.edges });
    meas('megamodel after, cards', mmAfter.cards);
    const scriptCards = mmAfter.cards.filter((c: any) => c.type === 'Refactoring');
    check('the megamodel lists both scripts as Refactoring nodes', scriptCards.length === 2 && scriptCards.some((c: any) => c.name === 'probe one.jjs') && scriptCards.some((c: any) => c.name === 'renamed.jjs'), scriptCards);
    const moved = mmBefore.cards.filter((b: any) => {
        const a = mmAfter.cards.find((c: any) => c.name === b.name && c.kind === b.kind);
        return !a || a.left !== b.left || a.top !== b.top;
    });
    check('the existing megamodel nodes keep their place', mmAfter.cards.length === mmBefore.cards.length + 2 && moved.length === 0, { moved });
    check('the script on a model adds one link', mmAfter.edges > mmBefore.edges, { before: mmBefore.edges, after: mmAfter.edges });
    result.megamodel = { before: mmBefore, after: mmAfter };
    result.sections = secs;
}

check('no page errors', errors.length === 0, errors.slice(0, 5));
meas('console errors by phase', consoleErrors.slice(0, 10));
result.failures = failures;
writeFileSync(join(OUT, 's6b_probe.json'), JSON.stringify(result, null, 2));
await browser.close();
console.log(`DONE  failures=${failures}`);
process.exit(failures);
