/**
 * jjodie-rf2-run-from-tab probe (P-2026-10-24-2215, R-JJD-14). Read-only on sources: it writes only to the
 * throwaway browser profile and to the lane folder.
 *
 * Question: does the tab of a metamodel or model run a Refactoring through its menu? A project with an M2
 * Refactoring and an M1 one (on the ESM metamodel): right-click the metamodel tab → «Run refactoring…» lists only
 * the M2 one; right-click the (inactive) ESM model tab → only the M1 one; choosing it activates the model's tab
 * and the preview bar shows the planned count; Apply → one undo entry, one Cmd+Z removes the created objects; a
 * model of another metamodel → the item is disabled with the tooltip «No refactoring for this artifact».
 *
 * Fixture: fixtures/jjscript-m1-esm.jjodel (as jjodie-s4c-apply-undo.ts), plus a second metamodel and one model of
 * each, created through the Navbar's createM2 / createM1.
 * Real app, own dev server (never 3000, 3001, 3003), light theme. One crop: the model tab with the listed menu.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjodie-rf2-run-from-tab.ts --port 3014 --id P-2026-10-24-2215
 * Env:  RF2_OUT  crop directory (default ~/.jjodel-lanes/P-2026-10-24-2215)
 *
 * Exit code: number of failed checks.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3014/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3003');
const FIXTURE = new globalThis.URL('./fixtures/jjscript-m1-esm.jjodel', import.meta.url).pathname;
const OUT = process.env.RF2_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-2215');
mkdirSync(OUT, { recursive: true });

const SCRIPT_M1 = ['create instance of State "rf2A"', 'create instance of State "rf2B"', 'create instance of Event "rf2E"'].join('\n');
const NAMES = ['rf2A', 'rf2B', 'rf2E'];

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 800)}`); };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 1500)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

/** The script's objects in `modelId`, and the user's undo/redo lengths. */
async function read(page: Page, modelId: string): Promise<{ names: string[]; undo: number; redo: number }> {
    return page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const L = j.store.getState().idlookup;
      const modelOf = (o) => { let f = L[o.father], n = 0; while (f && f.className !== 'DModel' && n++ < 50) f = L[f.father]; return f && f.id; };
      const objs = Object.values(L).filter(d => d && d.className === 'DObject' && modelOf(d) === ${JSON.stringify(modelId)} && ${JSON.stringify(NAMES)}.includes(d.name));
      const h = window.statehistory[j.DUser.current] || { undoable: [], redoable: [] };
      return { names: objs.map(o => o.name).sort(), undo: h.undoable.length, redo: h.redoable.length };
    })()`) as any;
}

/** Open `modelId` in its tab and wait for the canvas. */
async function openArtifact(page: Page, modelId: string) {
    await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const dm = await import('/src/components/abstract/DockManager.tsx');
      await dm.default.open2(j.L.fromPointer(${JSON.stringify(modelId)}));
    })()`);
    await wait(page, 5000);
}

const activeTabId = (page: Page) => page.evaluate(`(() => {
  const t = document.querySelector('.appbar-tab.appbar-tab--active');
  return t ? t.getAttribute('data-tab-id') : null;
})()`) as Promise<string | null>;

/** Right-click the app-bar tab of `modelId` and read the root menu item. */
async function openTabMenu(page: Page, modelId: string) {
    const title = page.locator(`.appbar-tab[data-tab-id="${modelId}"]`).first();
    await title.click({ button: 'right' });
    await wait(page, 400);
    const item = page.locator('.mm-context-menu .mm-context-menu__item').first();
    if (!(await item.count())) return null;
    return {
        label: (await item.innerText()).trim(),
        disabled: await item.isDisabled(),
        title: await item.getAttribute('title'),
        tabClass: await title.getAttribute('class'),
        items: await page.locator('.mm-context-menu .mm-context-menu__item').count(),
    };
}

/** Click «Run refactoring…» and read the listed Refactorings. */
async function listRefactorings(page: Page): Promise<string[]> {
    await page.locator('.mm-context-menu .mm-context-menu__item', { hasText: 'Run refactoring' }).click();
    await wait(page, 400);
    return page.locator('.mm-context-menu .mm-context-menu__label').allInnerTexts();
}

const closeMenu = async (page: Page) => { await page.keyboard.press('Escape'); await wait(page, 300); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await seed(ctx, false);
const page: Page = await ctx.newPage();
const pageErrors: string[] = [];
const warnings: string[] = [];
page.on('pageerror', (e: Error) => pageErrors.push(e.message));
page.on('console', (m) => { if (m.type() === 'warning' && m.text().includes('[PreviewBar]')) warnings.push(m.text()); });

await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await wait(page, 5000);
const pid = await page.evaluate(`(async () => {
  const api = await import('/src/api/persistance/projects.ts');
  const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
  const before = count();
  await api.ProjectsApi.importFromText(${JSON.stringify(readFileSync(FIXTURE, 'utf8'))});
  for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
  const a = JSON.parse(localStorage.getItem('projects') || '[]');
  return a.length > before ? a[a.length - 1].id : null;
})()`) as string | null;
check('fixture imported', !!pid, String(pid));
await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await wait(page, 9000);
await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});

// The scene: the ESM metamodel, a model of it, a second metamodel and a model of that one, two Refactorings.
const scene: any = await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const nav = await import('/src/pages/components/Navbar.tsx');
  const project = () => j.L.fromPointer(j.DUser.current).project;
  const settle = async (find) => { for (let i = 0; i < 50; i++) { await new Promise(r => setTimeout(r, 100)); const x = find(); if (x) return x; } return null; };
  const esm = project().metamodels[0];
  const ids0 = new Set([...project().models, ...project().metamodels].map(m => m.id));
  nav.createM1(project(), esm, false, 'rf2Esm');
  const mA = await settle(() => project().models.find(m => !ids0.has(m.id) && !m.isMetamodel));
  nav.createM2(project(), 'rf2Other');
  const other = await settle(() => project().metamodels.find(m => !ids0.has(m.id)));
  const ids1 = new Set(project().models.map(m => m.id));
  nav.createM1(project(), other, false, 'rf2OtherModel');
  const mB = await settle(() => project().models.find(m => !ids1.has(m.id) && !m.isMetamodel));
  const pid = j.U.getProjectID_URL();
  const scripts = [
    { id: 'rf2_m2', name: 'rf2 metamodel refactoring', text: 'create class "Rf2Tmp"', updatedAt: Date.now(), level: 'M2' },
    { id: 'rf2_m1', name: 'rf2 model refactoring', text: ${JSON.stringify(SCRIPT_M1)}, updatedAt: Date.now(), level: 'M1', metamodelId: esm.id },
  ];
  j.SetFieldAction.new(pid, 'scripts', scripts, '', false);
  await new Promise(r => setTimeout(r, 500));
  return { esm: esm.id, other: other && other.id, mA: mA && mA.id, mB: mB && mB.id,
           stored: (j.store.getState().idlookup[pid].scripts || []).map(s => s.id) };
})()`);
meas('scene', scene);
check('scene built', !!(scene.esm && scene.other && scene.mA && scene.mB) && scene.stored.length === 2, scene);

// The ESM model first, with a user click: the reducer keeps no undo entry before the first interaction.
await openArtifact(page, scene.mA);
await page.locator('.dock-tabpane-active .react-flow__pane').first().click({ position: { x: 600, y: 500 } }).catch(() => undefined);
await wait(page, 800);

// Metamodel tab: only the M2 Refactoring.
await openArtifact(page, scene.esm);
const mmMenu = await openTabMenu(page, scene.esm);
meas('metamodel tab menu', mmMenu);
check('metamodel tab: «Run refactoring…» enabled', !!mmMenu && /Run refactoring/.test(mmMenu.label) && !mmMenu.disabled, mmMenu);
const mmList = mmMenu ? await listRefactorings(page) : [];
check('metamodel tab lists only the M2 Refactoring', mmList.join('|') === 'rf2 metamodel refactoring', mmList);
await closeMenu(page);
check('menu closed on Escape', (await page.locator('.mm-context-menu').count()) === 0, await page.locator('.mm-context-menu').count());

// ESM model tab, inactive: only the M1 Refactoring; choosing it activates the tab and previews.
const activeBefore = await activeTabId(page);
const mMenu = await openTabMenu(page, scene.mA);
meas('model tab menu', mMenu);
const mList = mMenu ? await listRefactorings(page) : [];
check('ESM model tab lists only the M1 Refactoring', mList.join('|') === 'rf2 model refactoring', mList);
const tabBox = await page.locator(`.appbar-tab[data-tab-id="${scene.mA}"]`).first().boundingBox();
const menuBox = await page.locator('.mm-context-menu').boundingBox();
if (tabBox && menuBox) {
    const x = Math.max(0, Math.min(tabBox.x, menuBox.x) - 16);
    const y = Math.max(0, Math.min(tabBox.y, menuBox.y) - 12);
    const w = Math.max(tabBox.x + tabBox.width, menuBox.x + menuBox.width) - x + 16;
    const h = Math.max(tabBox.y + tabBox.height, menuBox.y + menuBox.height) - y + 12;
    await page.screenshot({ path: join(OUT, 'rf2_run_from_tab.png'), clip: { x, y, width: w, height: h } });
    meas('crop', join(OUT, 'rf2_run_from_tab.png'));
}
const s0 = await read(page, scene.mA);
meas('before preview', s0);
await page.locator('.mm-context-menu .mm-context-menu__item', { hasText: 'rf2 model refactoring' }).click();
const bar = page.locator('.jj-preview-bar');
await bar.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);
const activeAfter = await activeTabId(page);
check('choosing activates the model tab', activeBefore === scene.esm && activeAfter === scene.mA, { activeBefore, activeAfter });
const barText = (await bar.count()) ? (await bar.innerText()).replace(/\s+/g, ' ') : '';
meas('preview bar', barText);
check('preview bar shows the planned +3 objects', /\+3 objects/.test(barText), barText);
const sP = await read(page, scene.mA);
check('nothing runs before Apply', sP.names.length === 0 && sP.undo === s0.undo, sP);

await bar.locator('button', { hasText: 'Apply' }).click();
await bar.waitFor({ state: 'detached', timeout: 20000 }).catch(() => undefined);
await wait(page, 1500);
const s1 = await read(page, scene.mA);
meas('after apply', s1);
check('apply created the three objects', s1.names.join(',') === NAMES.slice().sort().join(','), s1.names);
check('apply added exactly one undo entry', s1.undo === s0.undo + 1, { before: s0.undo, after: s1.undo });
check('no planned/real mismatch warning', warnings.length === 0, warnings);

await page.evaluate(`document.querySelector('.dock-tabpane-active .editor-v2')?.focus()`);
await wait(page, 400);
await page.keyboard.press('Meta+z');
await wait(page, 2500);
const s2 = await read(page, scene.mA);
meas('after one Cmd+Z', s2);
check('one Cmd+Z removes the three objects', s2.names.length === 0 && s2.undo === s1.undo - 1, s2);

// A model of the other metamodel: no Refactoring fits.
await openArtifact(page, scene.mB);
const bMenu = await openTabMenu(page, scene.mB);
meas('other-metamodel model tab menu', bMenu);
check('other-metamodel model: item disabled with the tooltip',
    !!bMenu && bMenu.disabled && bMenu.title === 'No refactoring for this artifact', bMenu);
await closeMenu(page);

check('no page errors', pageErrors.length === 0, pageErrors.slice(0, 5));
await browser.close();
console.log(`${failures === 0 ? 'ALL PASS' : failures + ' FAILED'}`);
process.exit(failures);
