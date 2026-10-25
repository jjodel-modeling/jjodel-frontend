/**
 * jjodie-tools-run-refactoring probe (P-2026-10-25-0945, R-JJD-17). Read-only on sources: it writes only to the
 * throwaway browser profile and to the lane folder.
 *
 * Question: does Tools › «Run refactoring on <name>…» run a Refactoring on the artifact of the active tab? A project
 * with two M1 Refactorings on the ESM metamodel and no M2 one, Advanced mode: the dashboard has no Tools menu; with
 * the ESM model's tab active Tools shows «Run refactoring on <model>…» enabled, its list equals the right-click list
 * of the same tab, choosing one shows the preview bar; with the ESM metamodel's tab active the entry is disabled with
 * the tooltip «No refactoring for this metamodel».
 *
 * Fixture: fixtures/jjscript-m1-esm.jjodel (as jjodie-rf2-run-from-tab.ts), plus one model created through the
 * Navbar's createM1. Real app, own dev server (never 3000, 3001, 3003), light theme. One crop: the open Tools menu.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjodie-tools-run-refactoring.ts --port 3014 --id P-2026-10-25-0945
 * Env:  TOOLS_OUT  crop directory (default ~/.jjodel-lanes/P-2026-10-25-0945)
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
const OUT = process.env.TOOLS_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-25-0945');
mkdirSync(OUT, { recursive: true });

const SCRIPT_A = ['create instance of State "toolsA"', 'create instance of Event "toolsE"'].join('\n');
const SCRIPT_B = 'create instance of State "toolsB"';

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 800)}`); };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 1500)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

const toolsMenu = (page: Page) => page.locator('.nav-hamburger').filter({ has: page.locator('> .menu-title', { hasText: /^Tools$/ }) });
const runEntry = (page: Page) => page.locator('li#navbar_tools_run_refactoring');

/** Open `modelId` in its tab and wait for the canvas. */
async function openArtifact(page: Page, modelId: string) {
    await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const dm = await import('/src/components/abstract/DockManager.tsx');
      await dm.default.open2(j.L.fromPointer(${JSON.stringify(modelId)}));
    })()`);
    await wait(page, 5000);
}

/** Hover Tools and read the «Run refactoring» entry, and its list when it opens one. */
async function readTools(page: Page) {
    await page.mouse.move(5, VIEWPORT_HEIGHT - 5);
    await wait(page, 300);
    await toolsMenu(page).first().hover();
    await wait(page, 400);
    const entry = runEntry(page);
    if (!(await entry.count())) return null;
    const label = (await entry.locator('> label').innerText()).trim();
    const disabled = ((await entry.locator('> label').getAttribute('class')) || '').includes('disabled');
    const title = await entry.getAttribute('title');
    await entry.hover();
    await wait(page, 400);
    const list = (await entry.locator('> .content li > label').allInnerTexts()).map(s => s.trim());
    return { label, disabled, title, list };
}

/** The right-click «Run refactoring…» list of the app-bar tab of `modelId`. */
async function rightClickList(page: Page, modelId: string): Promise<string[]> {
    await page.locator(`.appbar-tab[data-tab-id="${modelId}"]`).first().click({ button: 'right' });
    await wait(page, 400);
    await page.locator('.mm-context-menu .mm-context-menu__item', { hasText: 'Run refactoring' }).click();
    await wait(page, 400);
    const list = await page.locator('.mm-context-menu .mm-context-menu__label').allInnerTexts();
    await page.keyboard.press('Escape');
    await wait(page, 300);
    return list.map(s => s.trim());
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await seed(ctx, true);
const page: Page = await ctx.newPage();
const pageErrors: string[] = [];
page.on('pageerror', (e: Error) => pageErrors.push(e.message));

await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await wait(page, 5000);
const dashTools = await toolsMenu(page).count();
meas('dashboard Tools menus', dashTools);
check('dashboard: no Tools menu', dashTools === 0, dashTools);
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

// The scene: the ESM metamodel, a model of it, two M1 Refactorings on ESM and no M2 one.
const scene: any = await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const nav = await import('/src/pages/components/Navbar.tsx');
  const project = () => j.L.fromPointer(j.DUser.current).project;
  const settle = async (find) => { for (let i = 0; i < 50; i++) { await new Promise(r => setTimeout(r, 100)); const x = find(); if (x) return x; } return null; };
  const esm = project().metamodels[0];
  const ids0 = new Set(project().models.map(m => m.id));
  nav.createM1(project(), esm, false, 'toolsEsm');
  const mA = await settle(() => project().models.find(m => !ids0.has(m.id) && !m.isMetamodel));
  const pid = j.U.getProjectID_URL();
  const scripts = [
    { id: 'tools_a', name: 'tools refactoring A', text: ${JSON.stringify(SCRIPT_A)}, updatedAt: Date.now(), level: 'M1', metamodelId: esm.id },
    { id: 'tools_b', name: 'tools refactoring B', text: ${JSON.stringify(SCRIPT_B)}, updatedAt: Date.now(), level: 'M1', metamodelId: esm.id },
  ];
  j.SetFieldAction.new(pid, 'scripts', scripts, '', false);
  await new Promise(r => setTimeout(r, 500));
  return { esm: esm.id, esmName: esm.name, mA: mA && mA.id, mAName: mA && mA.name,
           stored: (j.store.getState().idlookup[pid].scripts || []).map(s => s.id) };
})()`);
meas('scene', scene);
check('scene built', !!(scene.esm && scene.mA) && scene.stored.length === 2, scene);

// Metamodel tab active: no M2 Refactoring → disabled with the reason.
await openArtifact(page, scene.esm);
const mmTools = await readTools(page);
meas('Tools on the metamodel tab', mmTools);
check('metamodel: «Run refactoring on <metamodel>…» disabled with the tooltip',
    !!mmTools && mmTools.label === `Run refactoring on ${scene.esmName}…` && mmTools.disabled
    && mmTools.title === 'No refactoring for this metamodel' && mmTools.list.length === 0, mmTools);

// Model tab active: enabled, the same list as the right-click menu, choosing one previews.
await openArtifact(page, scene.mA);
await page.locator('.dock-tabpane-active .react-flow__pane').first().click({ position: { x: 600, y: 500 } }).catch(() => undefined);
await wait(page, 800);
const rcList = await rightClickList(page, scene.mA);
meas('right-click list on the model tab', rcList);
const mTools = await readTools(page);
meas('Tools on the model tab', mTools);
check('model: «Run refactoring on <model>…» enabled, no tooltip',
    !!mTools && mTools.label === `Run refactoring on ${scene.mAName}…` && !mTools.disabled && !mTools.title, mTools);
check('model: Tools list equals the right-click list',
    !!mTools && rcList.length === 2 && mTools.list.join('|') === rcList.join('|'), { tools: mTools?.list, rightClick: rcList });

const menuBox = await toolsMenu(page).first().locator('> .content').boundingBox();
const subBox = await runEntry(page).locator('> .content').boundingBox();
if (menuBox && subBox) {
    const x = Math.max(0, Math.min(menuBox.x, subBox.x) - 16);
    const y = Math.max(0, Math.min(menuBox.y, subBox.y) - 40);
    const w = Math.max(menuBox.x + menuBox.width, subBox.x + subBox.width) - x + 16;
    const h = Math.max(menuBox.y + menuBox.height, subBox.y + subBox.height) - y + 12;
    await page.screenshot({ path: join(OUT, 'tools_run_refactoring.png'), clip: { x, y, width: w, height: h } });
    meas('crop', join(OUT, 'tools_run_refactoring.png'));
}

await runEntry(page).locator('li#navbar_tools_run_refactoring_tools_a').click();
const bar = page.locator('.jj-preview-bar');
await bar.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);
const barText = (await bar.count()) ? (await bar.innerText()).replace(/\s+/g, ' ') : '';
meas('preview bar', barText);
check('choosing one shows the preview bar with +2 objects', /\+2 objects/.test(barText), barText);
const discard = bar.locator('button', { hasText: /Discard|Cancel/ });
if (await discard.count()) { await discard.first().click(); await wait(page, 800); }

check('no page errors', pageErrors.length === 0, pageErrors.slice(0, 5));
await browser.close();
console.log(`${failures === 0 ? 'ALL PASS' : failures + ' FAILED'}`);
process.exit(failures);
