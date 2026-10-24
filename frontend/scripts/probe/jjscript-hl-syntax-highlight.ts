/**
 * jjscript-hl-syntax-highlight probe (P-2026-10-24-2255). Read-only on sources: it writes only to the throwaway
 * browser profile and to the lane folder.
 *
 * Question: do the script editors paint JjScript? A Refactoring tab opened on a short script: the computed colour of a
 * keyword, a string and a comment token are three different colours, the keyword's equal to the JjTL theme's keyword
 * colour. The same in Jjodie's script editor (Edit script on an injected card), with the green edit bar still drawn
 * after a typed line, and in its Compare diff. No page errors, no console errors.
 *
 * Fixture: fixtures/jjscript-m1-esm.jjodel (as jjodie-rf2-run-from-tab.ts), plus one model of its metamodel created
 * through the Navbar's createM1. Real app, own dev server (never 3000, 3001, 3003), light theme. One crop: the
 * Refactoring tab's editor.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjscript-hl-syntax-highlight.ts --port 3016 --id P-2026-10-24-2255
 * Env:  HL_OUT  crop directory (default ~/.jjodel-lanes/P-2026-10-24-2255)
 *
 * Exit code: number of failed checks.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3016/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3003');
const FIXTURE = new globalThis.URL('./fixtures/jjscript-m1-esm.jjodel', import.meta.url).pathname;
const OUT = process.env.HL_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-2255');
mkdirSync(OUT, { recursive: true });

const SCRIPT = ['// hl probe comment', 'create instance of State "hlA"', 'set hlA.name = "hlName"'].join('\n');

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 800)}`); };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 1500)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

const JODIE_HOOK = `(() => {
  const root = document.querySelector('.jodie-root');
  const k = root && Object.keys(root).find(k => k.startsWith('__reactFiber$'));
  let f = k && root[k];
  while (f && !(f.type && f.type.name === 'Jodie')) f = f.return;
  let h = f && f.memoizedState;
  while (h) { const s = h.memoizedState; if (s && typeof s === 'object' && Array.isArray(s.messages) && 'isOpen' in s && 'isWaiting' in s) return h; h = h.next; }
  return null;
})()`;

/** Computed colour of the first token span under `root` whose text is exactly each of the probed tokens. */
const READ_COLOURS = (root: string) => `(() => {
  const spans = [...document.querySelectorAll(${JSON.stringify(root)} + ' .view-line span span')];
  const colour = (t) => { const s = spans.find(e => e.textContent.replace(/\\u00a0/g, ' ').trim() === t); return s ? { colour: getComputedStyle(s).color, cls: s.className } : null; };
  return { spans: spans.length, keyword: colour('create'), string: colour('"hlA"'), comment: colour('// hl probe comment'), type: colour('State') };
})()`;

/** The JjTL theme's keyword colour, as the browser writes it. */
const THEME_KEYWORD = `(async () => {
  const t = await import('/src/jjtl/editor/jjtlTheme.ts');
  const hex = t.jjtlTheme.rules.find(r => r.token === 'keyword').foreground;
  const n = (i) => parseInt(hex.slice(i, i + 2), 16);
  return 'rgb(' + n(0) + ', ' + n(2) + ', ' + n(4) + ')';
})()`;

function judge(where: string, c: any, keywordColour: string) {
    meas(`${where} colours`, c);
    const k = c.keyword?.colour, s = c.string?.colour, m = c.comment?.colour;
    check(`${where}: keyword, string, comment found`, !!(k && s && m), c);
    check(`${where}: three different colours`, !!(k && s && m) && new Set([k, s, m]).size === 3, { k, s, m });
    check(`${where}: keyword is the theme's keyword colour`, k === keywordColour, { k, keywordColour });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await seed(ctx, true);
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
const page: Page = await ctx.newPage();
const errors: Array<{ phase: string; text: string }> = [];
let phase = 'setup';
page.on('pageerror', (e: Error) => errors.push({ phase, text: 'pageerror: ' + e.message }));
page.on('console', (m) => { if (m.type() === 'error') errors.push({ phase, text: m.text().slice(0, 200) }); });

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
meas('theme', await page.evaluate(`document.documentElement.getAttribute('data-theme') || 'none'`));
const keywordColour = await page.evaluate(THEME_KEYWORD) as string;
meas('theme keyword colour', keywordColour);

// The Refactoring tab.
phase = 'refactoring tab';
const entry: any = await page.evaluate(`(async () => {
  const sf = await import('/src/components/scripts/scriptFiles.ts');
  const e = sf.openScriptAsFile(${JSON.stringify(SCRIPT)}, 'hl probe refactoring');
  return e ? { id: e.id, name: e.name } : null;
})()`);
await wait(page, 3000);
check('Refactoring tab opened', !!entry && (await page.locator('.dock-tabpane-active .script-tab').count()) === 1, entry);
const tabRoot = '.dock-tabpane-active .script-tab__editor';
const lang = await page.evaluate(`(() => { const m = window.monaco; const ed = m && m.editor.getModels().find(x => x.getValue() === ${JSON.stringify(SCRIPT)}); return ed ? ed.getLanguageId() : null; })()`);
check('Refactoring tab model language is jjscript', lang === 'jjscript', lang);
judge('Refactoring tab', await page.evaluate(READ_COLOURS(tabRoot)), keywordColour);
const box = await page.locator(tabRoot).first().boundingBox();
if (box) {
    await page.screenshot({ path: join(OUT, 'hl_refactoring_tab.png'), clip: { x: box.x, y: box.y, width: Math.min(box.width, 720), height: 110 } });
    meas('crop', join(OUT, 'hl_refactoring_tab.png'));
}

// Jjodie's script editor, on a card injected with an M1 scope.
phase = 'jjodie editor';
const scene: any = await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const nav = await import('/src/pages/components/Navbar.tsx');
  const project = () => j.L.fromPointer(j.DUser.current).project;
  const esm = project().metamodels[0];
  const ids0 = new Set(project().models.map(m => m.id));
  nav.createM1(project(), esm, false, 'hlModel');
  for (let i = 0; i < 50; i++) { await new Promise(r => setTimeout(r, 100)); const m = project().models.find(m => !ids0.has(m.id) && !m.isMetamodel); if (m) return { mm: esm.id, model: m.id }; }
  return { mm: esm.id, model: null };
})()`);
check('model created', !!scene.model, scene);
await page.evaluate(`(async () => { const j = await import('/src/joiner/index.ts'); const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(j.L.fromPointer(${JSON.stringify(scene.model)})); })()`);
await wait(page, 5000);
if ((await page.locator('.jodie-window').count()) === 0) {
    await page.locator('.jodie-minimized').first().click();
    await wait(page, 1500);
}
check('Jjodie window open', (await page.locator('.jodie-window').count()) === 1, '');
const injected = await page.evaluate(`(() => {
  const h = ${JODIE_HOOK};
  if (!h) return 'no chat hook';
  const m = { kind: 'chat', role: 'assistant', timestamp: Date.now(), id: 'msg_hl_card',
    content: 'Here is the script:\\n\\n\`\`\`jjscript\\n' + ${JSON.stringify(SCRIPT)} + '\\n\`\`\`',
    jjodieScope: { level: 'M1', metamodelId: ${JSON.stringify(scene.mm)}, metamodelName: 'probe', modelId: ${JSON.stringify(scene.model)} } };
  h.queue.dispatch(prev => ({ ...prev, isOpen: true, messages: [...prev.messages, m] }));
  return 'ok';
})()`);
meas('inject', injected);
await wait(page, 2500);
const card = page.locator('.jodie-window .jj-script-card').first();
await card.locator('.jj-script-card__action', { hasText: 'Edit script' }).click().catch((e: Error) => meas('edit click', e.message));
await wait(page, 2500);
const edRoot = '.jodie-window .jj-script-editor__pane:not(.jj-script-editor__pane--diff)';
check('Jjodie script editor open', (await page.locator(edRoot).count()) === 1, '');
judge('Jjodie editor', await page.evaluate(READ_COLOURS(edRoot)), keywordColour);

// A typed line: the green edit bar still shows, on a painted line.
const lines = page.locator(`${edRoot} .view-line`);
await lines.nth((await lines.count()) - 1).click();
await page.keyboard.press('End');
await page.keyboard.type('\ncreate instance of State "hlB"');
await wait(page, 1800);
const bars = await page.evaluate(`(() => { const p = document.querySelector(${JSON.stringify(edRoot)}); const b = [...p.querySelectorAll('.jj-script-editor__edited-line')]; return { bars: b.length, colour: b[0] && getComputedStyle(b[0]).backgroundColor }; })()`) as any;
meas('edit bars', bars);
check('green edit bar after a typed line', bars.bars >= 1, bars);

// Compare: the diff paints the same tokens.
phase = 'compare';
await page.locator('.jodie-window .jj-script-editor__action', { hasText: 'Compare with generated' }).click();
await wait(page, 2500);
const diffRoot = '.jodie-window .jj-script-editor__pane--diff .monaco-diff-editor .editor.modified';
const diffInfo = await page.evaluate(`(() => ({ diff: !!document.querySelector('.jodie-window .monaco-diff-editor'), inserts: document.querySelectorAll('.jodie-window .monaco-diff-editor .line-insert, .jodie-window .monaco-diff-editor .gutter-insert').length }))()`) as any;
meas('diff', diffInfo);
check('Compare shows the diff with the inserted line', diffInfo.diff && diffInfo.inserts > 0, diffInfo);
judge('Compare diff', await page.evaluate(READ_COLOURS(diffRoot)), keywordColour);
await page.locator('.jodie-window .jj-script-editor__action', { hasText: 'Compare with generated' }).click();
await wait(page, 800);

// `init_dash` is the dashboard's own console.error (redux/store.tsx init_dashboard), logged on every project load.
meas('errors', errors);
check('no page errors', !errors.some(e => e.text.startsWith('pageerror')), errors.slice(0, 5));
check('no console errors in the editor phases', !errors.some(e => e.phase !== 'setup'), errors.filter(e => e.phase !== 'setup').slice(0, 5));
await browser.close();
console.log(`${failures === 0 ? 'ALL PASS' : failures + ' FAILED'}`);
process.exit(failures);
