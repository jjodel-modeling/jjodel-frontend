/**
 * jjodie-jto-conversation-deadline probe (P-2026-10-24-0655, R-JJD-9). Read-only on sources: it writes only to the
 * throwaway browser profile and to the lane folder.
 *
 * Question: is the JjEL mode submit bounded? Submit the 8-deep nested `forall` of the S3c log, the one that blocked
 * the page past Playwright's 30 s: a second action (filling the input) completes within 3 s of the Enter, the
 * conversation entry reads `timed out after 2 s` in slate-400 without the error style, and a plain expression still
 * returns its value.
 *
 * Fixture: scene_1_DemoPEST.jjodel (as jjodie-s3c-jjel-live.ts), its first model open. Real app, own dev server
 * (never 3000, 3001, 3003), light theme.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjodie-jto-conversation-deadline.ts --port 3014 --id P-2026-10-24-0655
 * Env:  JTO_SCENES  directory of the scene exports (default ~/jjodel-demo-exports)
 *       JTO_OUT     crop and JSON directory (default ~/.jjodel-lanes/P-2026-10-24-0655)
 *
 * Exit code: number of failed checks.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3014/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3003');
const SCENES_DIR = process.env.JTO_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const OUT = process.env.JTO_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-0655');
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 800)}`); };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 1500)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

const SLATE_400 = 'rgb(148, 163, 184)';
const ERROR_RED = 'rgb(185, 28, 28)';
const DEPTH = 8;
const NESTED = '(' + Array.from({ length: DEPTH }, (_, i) => `forall x${i} in instances: `).join('') + 'x0.name).size';

async function importScene(page: Page, file: string): Promise<{ project: string | null; models: Array<{ id: string; name: string; meta: boolean }> }> {
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
    if (!project) return { project, models: [] };
    await page.goto(`${URL}/#/project?id=${project}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 9000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    const models = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const pr = j.L.fromPointer(j.DUser.current).project;
      return [...(pr.metamodels || []).map(m => ({ id: m.id, name: m.name, meta: true })), ...(pr.models || []).filter(m => !m.isMetamodel).map(m => ({ id: m.id, name: m.name, meta: false }))];
    })()`) as Array<{ id: string; name: string; meta: boolean }>;
    return { project, models };
}

/** The last conversation code entry: input, output text, classes and colour. */
const READ_LAST_ENTRY = `(() => {
  const all = [...document.querySelectorAll('.jodie-window .jodie-code-entry')];
  const e = all[all.length - 1];
  if (!e) return { count: 0 };
  const out = e.querySelector('.jodie-code-entry__output');
  const row = e.querySelector('.jodie-code-entry__output-row');
  return {
    count: all.length,
    input: e.querySelector('.jodie-code-entry__input')?.textContent ?? null,
    output: out ? out.textContent : null,
    color: out ? getComputedStyle(out).color : null,
    entryClass: e.className,
    rowClass: row ? row.className : null,
    askButton: !!e.querySelector('.jodie-code-entry__promote'),
  };
})()`;
const readLast = (page: Page) => page.evaluate(READ_LAST_ENTRY) as Promise<any>;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await seed(ctx, true);
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
const result: any = { url: URL, expression: NESTED };

const { project, models } = await importScene(page, 'scene_1_DemoPEST.jjodel');
check('imported', !!project && models.length >= 2, { project, models: models.map((m) => m.name) });
meas('theme', await page.evaluate(`document.documentElement.getAttribute('data-theme') || 'none'`));
const first = models.find((m) => !m.meta) ?? models[0];
if (first) {
    await page.evaluate(`(async () => { const j = await import('/src/joiner/index.ts'); const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(first.id)})); })()`).catch(() => {});
    await wait(page, 4000);
}
meas('instances bound', await page.evaluate(`(async () => {
  const j = await import('/src/components/Jodie/jodieJjelContext.ts');
  const v = j.buildJodieJjelVariables();
  return Array.isArray(v.instances) ? v.instances.length : typeof v.instances;
})()`));

if ((await page.locator('.jodie-window').count()) === 0) {
    await page.locator('.jodie-minimized').first().click();
    await wait(page, 1500);
}
check('Jjodie window open', (await page.locator('.jodie-window').count()) === 1, '');
await page.locator('.jodie-mode-select__control').selectOption('jjel');
await wait(page, 800);

const ta = page.locator('.jodie-window textarea.jodie-input');

// 1. The nested forall: Enter, then a second action that needs the main thread.
await ta.fill(NESTED);
const t0 = Date.now();
await ta.press('Enter');
const tPress = Date.now() - t0;
let secondOk = true;
try {
    await ta.fill('1 + 1', { timeout: 3000 });
} catch (e) {
    secondOk = false;
}
const tSecond = Date.now() - t0;
const filled = await ta.inputValue({ timeout: 30000 }).catch(() => null);
meas('timing', { pressMs: tPress, secondActionMs: tSecond, secondOk, filled });
check('page responsive: second action within 3 s of the Enter', secondOk && tSecond < 3000 && filled === '1 + 1', { tSecond, secondOk, filled });
await wait(page, 600);
const e1 = await readLast(page);
meas('timed-out entry', e1);
check('conversation entry reads timed out after 2 s', e1.input === NESTED && e1.output === 'timed out after 2 s', { input: e1.input?.slice(0, 40), output: e1.output });
check('muted slate-400, not the error style', e1.color === SLATE_400 && !/--error/.test(e1.entryClass || '') && !/--error/.test(e1.rowClass || '') && /--timed-out/.test(e1.rowClass || ''), { color: e1.color, entry: e1.entryClass, row: e1.rowClass });
check('no "Ask Jjodie" error button on a timeout', e1.askButton === false, e1.askButton);
const box = await page.locator('.jodie-window .jodie-code-entry').last().boundingBox();
if (box) await page.screenshot({ path: join(OUT, 'jto-timed-out-entry.png'), clip: { x: box.x - 4, y: box.y - 4, width: box.width + 8, height: box.height + 8 } });

// 2. A plain expression still returns its value; a parse error keeps the error colour.
await ta.press('Enter');
await wait(page, 600);
const e2 = await readLast(page);
meas('plain entry', e2);
check('plain expression: value 2, not muted', e2.input === '1 + 1' && e2.output === '2' && !/--timed-out/.test(e2.rowClass || ''), { input: e2.input, output: e2.output, row: e2.rowClass });
await ta.fill('1 +');
await ta.press('Enter');
await wait(page, 600);
const e3 = await readLast(page);
meas('parse error entry', e3);
// The error class, not the red: `.jodie-messages code` (JodieWindow.css) paints every code-entry output #334155
// !important, so the error red never rendered before this lane either. Measured, not asserted.
check('parse error: error style kept', /--error/.test(e3.rowClass || '') && /--error/.test(e3.entryClass || '') && e3.askButton === true, { output: e3.output, row: e3.rowClass, entry: e3.entryClass });
meas('parse error colour (red expected, pre-existing override)', { color: e3.color, red: e3.color === ERROR_RED });
result.entries = [e1, e2, e3];

meas('page errors', errors.slice(0, 5));
check('no page errors', errors.length === 0, errors.slice(0, 3));
writeFileSync(join(OUT, 'probe_jjodie_jto.json'), JSON.stringify(result, null, 2));
console.log(`OUT ${OUT}`);
await ctx.close();
await browser.close();
process.exit(failures);
