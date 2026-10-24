/**
 * jjodie-s6c-update-file probe (P-2026-10-24-0430, slice S6c of R-JJD-5). Read-only on sources: it writes only to the
 * throwaway browser profile and to the lane folder.
 *
 * Question: does a later Jjodie answer to a script saved as a file arrive as a diff on that file? With an M1 model
 * open, a reply with a jjscript block is injected and saved with the card's `Open as file`; the file is edited in its
 * tab and saved; a second reply with a changed script of the same name is injected. Checked from the DOM: only the
 * second card shows `Update file`; it opens a diff of the file as the user left it against the new script, with the
 * added and removed counts of the line diff; Reject closes and leaves the file and its tab; Accept writes the script
 * to the file and the open tab follows; then a rename from the project tree and one from the megamodel show at once
 * in the tab title and on the megamodel card. No console errors.
 *
 * Fixture: scene_1_DemoPEST.jjodel (as jjodie-s5-script-editor.ts); the first M1 model whose pane draws a canvas.
 * Real app, own dev server (never 3000, 3001, 3003), light theme.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjodie-s6c-update-file.ts --port 3011 --id P-2026-10-24-0430
 * Env:  S6C_SCENES  directory of the scene exports (default ~/jjodel-demo-exports)
 *       S6C_OUT     crop directory (default ~/.jjodel-lanes/P-2026-10-24-0430)
 *
 * Exit code: number of failed checks.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3011/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3003');
const SCENES_DIR = process.env.S6C_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const OUT = process.env.S6C_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-0430');
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${String(JSON.stringify(detail)).slice(0, 800)}`); };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : String(JSON.stringify(v)).slice(0, 1500)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const paneSel = (m: string) => `[id="${m}"].dock-tabpane-active`;

const JODIE_HOOK = `(() => {
  const root = document.querySelector('.jodie-root');
  const k = root && Object.keys(root).find(k => k.startsWith('__reactFiber$'));
  let f = k && root[k];
  while (f && !(f.type && f.type.name === 'Jodie')) f = f.return;
  let h = f && f.memoizedState;
  while (h) { const s = h.memoizedState; if (s && typeof s === 'object' && Array.isArray(s.messages) && 'isOpen' in s && 'isWaiting' in s) return h; h = h.next; }
  return null;
})()`;

async function inject(page: Page, msgs: Array<{ id: string; content: string; jjodieScope?: unknown }>) {
    return page.evaluate(`(() => {
      const h = ${JODIE_HOOK};
      if (!h) return 'no chat hook';
      const add = ${JSON.stringify(msgs)}.map(m => ({ kind: 'chat', role: 'assistant', timestamp: Date.now(), ...m }));
      h.queue.dispatch(prev => ({ ...prev, isOpen: true, messages: [...prev.messages, ...add] }));
      return 'ok';
    })()`);
}

async function importScene(page: Page, file: string): Promise<{ project: string | null; models: Array<{ id: string; name: string; meta: boolean; mm: string | null }> }> {
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
      return [...(pr.metamodels || []).map(m => ({ id: m.id, name: m.name, meta: true, mm: null })), ...(pr.models || []).filter(m => !m.isMetamodel).map(m => ({ id: m.id, name: m.name, meta: false, mm: (m.instanceof && m.instanceof.id) || null }))];
    })()`) as Array<{ id: string; name: string; meta: boolean; mm: string | null }>;
    return { project, models };
}

async function activateTab(page: Page, id: string) {
    await page.evaluate((x: string) => {
        const b = [...document.querySelectorAll('.dock-tab-btn')].find((e) => e.id.endsWith(`-tab-${x}`)) as HTMLElement | undefined;
        b?.click();
    }, id);
    await wait(page, 2500);
}

async function openModel(page: Page, id: string) {
    await page.evaluate(`(async () => { const j = await import('/src/joiner/index.ts'); const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(id)})); })()`).catch(() => {});
    await wait(page, 4000);
    await activateTab(page, id);
    await wait(page, 1500);
}

/** A script over the model's own metaclasses, and a changed version of it under the same first comment. */
const BUILD_SCRIPTS = (modelId: string) => `(async () => {
  const pw = await import('/src/jjscript/executor/planWorld.ts');
  const st = await import('/src/joiner/index.ts');
  const world = pw.buildPlanWorld(st.store.getState().idlookup, ${JSON.stringify(modelId)});
  const concrete = Object.values(world.classes).filter(c => !c.abstract && !c.singleton);
  if (concrete.length === 0) return { error: 'no concrete class', classes: Object.keys(world.classes) };
  const a = concrete[0], b = concrete[1] || concrete[0];
  const first = ['// S6c probe script', 'create instance of ' + a.name + ' "S6a1"', 'create instance of ' + a.name + ' "S6a2"', 'create instance of ' + b.name + ' "S6b1"'];
  const second = [first[0], 'create instance of ' + a.name + ' "S6a1x"', first[2], first[3], 'create instance of ' + b.name + ' "S6b2"'];
  return { first: first.join('\\n'), second: second.join('\\n') };
})()`;

/** The editor text as rendered, lines in screen order, nbsp as space. */
const viewText = (root: string) => `(() => {
  const lines = [...document.querySelectorAll(${JSON.stringify(root)} + ' .view-line')]
    .map(e => ({ top: parseFloat(e.style.top) || 0, text: e.textContent.replace(/\\u00a0/g, ' ') }))
    .sort((x, y) => x.top - y.top);
  return lines.map(l => l.text).join('\\n');
})()`;

const READ_CARDS = `[...document.querySelectorAll('.jodie-window .jj-script-card')].map(c => ({
  name: c.querySelector('.jj-script-card__name')?.textContent,
  actions: [...c.querySelectorAll('.jj-script-card__action')].map(b => ({ text: b.textContent.trim(), disabled: b.disabled, title: b.title })),
}))`;

const READ_UPDATE = `(() => {
  const v = document.querySelector('.jodie-window .jj-script-update');
  if (!v) return { open: false };
  const txt = (q) => [...v.querySelectorAll(q)].map(e => ({ top: parseFloat(e.style.top) || 0, t: e.textContent.replace(/\\u00a0/g, ' ') })).sort((x, y) => x.top - y.top).map(l => l.t).join('\\n');
  return {
    open: true,
    conversationHidden: !!document.querySelector('.jodie-window .jodie-conversation--hidden'),
    name: v.querySelector('.jj-script-editor__name')?.textContent,
    count: v.querySelector('.jj-script-editor__count')?.textContent,
    added: v.getAttribute('data-added'), removed: v.getAttribute('data-removed'),
    actions: [...v.querySelectorAll('.jj-script-editor__action')].map(b => ({ text: b.textContent.trim(), disabled: b.disabled })),
    sideBySide: !!v.querySelector('.monaco-diff-editor.side-by-side'),
    original: txt('.monaco-diff-editor .editor.original .view-line'),
    modified: txt('.monaco-diff-editor .editor.modified .view-lines .view-line'),
    inlineDeleted: [...v.querySelectorAll('.monaco-diff-editor .editor.modified .view-zones .view-line, .monaco-diff-editor .inline-deleted-text')].map(e => e.textContent.replace(/\\u00a0/g, ' ')).join('\\n'),
    inserts: v.querySelectorAll('.monaco-diff-editor .line-insert, .monaco-diff-editor .gutter-insert').length,
    deletes: v.querySelectorAll('.monaco-diff-editor .line-delete, .monaco-diff-editor .gutter-delete').length,
    status: v.querySelector('.jj-script-editor__status')?.textContent,
  };
})()`;

const readFile = (page: Page, id: string) => page.evaluate(`(async () => { const f = await import('/src/components/scripts/scriptFiles.ts'); const s = f.readProjectScript(${JSON.stringify(id)}); return s ? { name: s.name, text: s.text } : null; })()`) as Promise<{ name: string; text: string } | null>;
const tabTitle = (page: Page, id: string) => page.evaluate((x: string) => {
    const b = [...document.querySelectorAll('.dock-tab-btn')].find((e) => e.id.endsWith(`-tab-jjs_${x}`));
    return b ? (b.querySelector('.tab-title')?.textContent ?? b.textContent) : null;
}, id) as Promise<string | null>;
const tabText = (page: Page, id: string) => page.evaluate(viewText(`.script-tab[data-script-id="${id}"]`)) as Promise<string>;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await seed(ctx, true);
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
const page = await ctx.newPage();
const errors: Array<{ phase: string; text: string }> = [];
let phase = 'setup';
page.on('pageerror', (e) => errors.push({ phase, text: 'pageerror: ' + e.message }));
page.on('console', (m) => { if (m.type() === 'error') errors.push({ phase, text: m.text().slice(0, 200) }); });

const { project, models } = await importScene(page, 'scene_1_DemoPEST.jjodel');
check('imported', !!project && models.some((m) => !m.meta), { project, models: models.map((m) => `${m.name}${m.meta ? ' (M2)' : ''}`) });
meas('theme', await page.evaluate(`document.documentElement.getAttribute('data-theme') || 'none'`));

if ((await page.locator('.jodie-window').count()) === 0) {
    await page.locator('.jodie-minimized').first().click();
    await wait(page, 1500);
}
check('Jjodie window open', (await page.locator('.jodie-window').count()) === 1, '');

let target: { id: string; name: string; mm: string | null } | null = null;
for (const m of models.filter((x) => !x.meta)) {
    await openModel(page, m.id);
    const ok = await page.evaluate((sel: string) => !!document.querySelector(sel + ' .react-flow__renderer'), paneSel(m.id));
    if (ok) { target = m; break; }
}
check('an M1 model with a canvas', !!target, target);

if (target) {
    const built: any = await page.evaluate(BUILD_SCRIPTS(target.id));
    check('scripts built from the model', !!built.first && !built.error, built.error || '');
    const first: string = built.first;
    const second: string = built.second;
    const scope = { level: 'M1', metamodelId: target.mm || '', metamodelName: 'probe', modelId: target.id };

    // 1. First reply, saved as a file from the card.
    phase = 'link';
    meas('inject first', await inject(page, [{ id: 'msg_s6c_1', content: 'Here is the script:\n\n```jjscript\n' + first + '\n```', jjodieScope: scope }]));
    await wait(page, 3000);
    await page.locator('.jodie-window .jj-script-card .jj-script-card__action', { hasText: 'Open as file' }).first().click();
    await wait(page, 2500);
    const stored = await page.evaluate(`(async () => { const f = await import('/src/components/scripts/scriptFiles.ts'); return f.readProjectScripts().map(s => ({ id: s.id, name: s.name, text: s.text })); })()`) as Array<{ id: string; name: string; text: string }>;
    const file = stored.find((s) => s.text === first);
    check('Open as file stores the script as a file and opens its tab', !!file && file.name === 'S6c probe script.jjs' && (await tabText(page, file.id)) === first, stored.map((s) => s.name));
    let cards = await page.evaluate(READ_CARDS) as any[];
    check('the saved card itself shows no Update file', cards.length === 1 && !cards[0].actions.some((a: any) => a.text === 'Update file'), cards);

    if (file) {
        // 2. The user edits the file in its tab and saves.
        phase = 'edit';
        const lines = page.locator(`.script-tab[data-script-id="${file.id}"] .view-line`);
        await lines.nth(first.split('\n').length - 1).click();
        await page.keyboard.press('End');
        await page.keyboard.press('Enter');
        await page.keyboard.type('// user note', { delay: 15 });
        await wait(page, 300);
        await page.locator(`.script-tab[data-script-id="${file.id}"] .script-tab__button`, { hasText: /^Save$/ }).click();
        await wait(page, 800);
        const userText = first + '\n// user note';
        const afterEdit = await readFile(page, file.id);
        check('the user edit is saved to the file', afterEdit?.text === userText, afterEdit);

        // 3. Second reply: a changed script under the same name.
        phase = 'update';
        meas('inject second', await inject(page, [{ id: 'msg_s6c_2', content: 'Here is the updated script:\n\n```jjscript\n' + second + '\n```', jjodieScope: scope }]));
        await wait(page, 3000);
        cards = await page.evaluate(READ_CARDS) as any[];
        meas('cards', cards.map((c: any) => ({ name: c.name, actions: c.actions.map((a: any) => a.text + (a.disabled ? ' (disabled)' : '')) })));
        const upd = cards[1]?.actions.find((a: any) => a.text === 'Update file');
        check('the later card of the same name shows Update file, enabled, the first does not', cards.length === 2 && !!upd && !upd.disabled && !cards[0].actions.some((a: any) => a.text === 'Update file'), cards);

        // Expected: same line 1, removed S6a1, added S6a1x, same lines 3-4, removed the user note, added S6b2.
        const updateBtn = page.locator('.jodie-window .jj-script-card').nth(1).locator('.jj-script-card__action', { hasText: 'Update file' });
        await updateBtn.click();
        await wait(page, 2500);
        let u: any = await page.evaluate(READ_UPDATE);
        meas('update view', u);
        check('Update file opens the diff in place of the conversation', u.open && u.conversationHidden && u.name === 'Update S6c probe script.jjs', { open: u.open, hidden: u.conversationHidden, name: u.name });
        check('diff rows: 2 added, 2 removed', u.added === '2' && u.removed === '2' && u.count === '+2 −2 lines' && u.inserts > 0 && u.deletes > 0, { added: u.added, removed: u.removed, count: u.count, inserts: u.inserts, deletes: u.deletes });
        const leftHasUser = u.sideBySide ? u.original === userText : u.inlineDeleted.includes('// user note');
        check('the old side is the file as the user left it, the new side the new script', leftHasUser && u.modified.includes('S6a1x') && u.modified.includes('S6b2'), { sideBySide: u.sideBySide, original: u.original, inlineDeleted: u.inlineDeleted, modified: u.modified });
        const panel = await page.locator('.jodie-window').boundingBox();
        if (panel) await page.screenshot({ path: join(OUT, 's6c-update-file.png'), clip: { x: panel.x, y: panel.y, width: panel.width, height: Math.min(panel.height, 720) } });

        // 4. Reject: nothing changes.
        await page.locator('.jodie-window .jj-script-update .jj-script-editor__action', { hasText: 'Reject' }).click();
        await wait(page, 1000);
        const afterReject = await readFile(page, file.id);
        u = await page.evaluate(READ_UPDATE);
        const tabAfterReject = await tabText(page, file.id);
        check('Reject closes and leaves the file and its tab', !u.open && afterReject?.text === userText && tabAfterReject === userText, { open: u.open, file: afterReject?.text, tab: tabAfterReject });

        // 5. Accept: the file takes the script, the open tab follows.
        phase = 'accept';
        await updateBtn.click();
        await wait(page, 2000);
        await page.locator('.jodie-window .jj-script-update .jj-script-editor__action', { hasText: 'Accept' }).click();
        await wait(page, 1500);
        const afterAccept = await readFile(page, file.id);
        u = await page.evaluate(READ_UPDATE);
        const tabAfterAccept = await tabText(page, file.id);
        cards = await page.evaluate(READ_CARDS) as any[];
        const upd2 = cards[1]?.actions.find((a: any) => a.text === 'Update file');
        meas('after accept', { file: afterAccept, tab: tabAfterAccept, update: upd2 });
        check('Accept writes the script to the file and the open tab refreshes', !u.open && afterAccept?.text === second && tabAfterAccept === second, { open: u.open, file: afterAccept?.text, tab: tabAfterAccept });
        check('after Accept the card reads up to date', !!upd2 && upd2.disabled, upd2);

        // 6. Rename from the project tree: the tab title follows at once.
        phase = 'rename';
        await page.locator(`.leftbar--project .psb-item[data-script-id="${file.id}"]`).click({ button: 'right' });
        await wait(page, 400);
        await page.locator('.psb-script-menu .tree-node__context-item', { hasText: 'Rename' }).click();
        await wait(page, 300);
        const input = page.locator(`.leftbar--project .psb-item[data-script-id="${file.id}"] .psb-rename-input`);
        await input.fill('tree renamed');
        await input.press('Enter');
        await wait(page, 800);
        const t1 = await tabTitle(page, file.id);
        const f1 = await readFile(page, file.id);
        check('a rename from the tree updates the tab title', f1?.name === 'tree renamed.jjs' && t1 === 'tree renamed.jjs', { stored: f1?.name, title: t1 });

        // 7. Rename from the megamodel: the card shows the stored .jjs name at once, the tab follows.
        phase = 'megamodel-open';
        await page.locator('.leftbar--project .psb-megamodel').click();
        await wait(page, 2000);
        phase = 'megamodel-rename';
        await page.locator('.mm-view .mm-card', { hasText: 'tree renamed.jjs' }).first().click({ button: 'right' });
        await wait(page, 400);
        await page.locator('.mm-context-menu__item', { hasText: 'Rename' }).click();
        await wait(page, 300);
        const mmInput = page.locator('.mm-view .mm-card__name-input');
        await mmInput.fill('mm renamed');
        await mmInput.press('Enter');
        await wait(page, 400);
        const mmNames = await page.evaluate(`[...document.querySelectorAll('.mm-view .mm-card .mm-card__name')].map(e => e.textContent.trim())`) as string[];
        await page.locator('.mm-view__close').click().catch(() => {});
        await wait(page, 800);
        const t2 = await tabTitle(page, file.id);
        const f2 = await readFile(page, file.id);
        meas('megamodel rename', { cards: mmNames, stored: f2?.name, title: t2 });
        check('a rename from the megamodel shows the stored .jjs name at once', f2?.name === 'mm renamed.jjs' && mmNames.includes('mm renamed.jjs') && !mmNames.includes('mm renamed'), { cards: mmNames, stored: f2?.name });
        check('a rename from the megamodel updates the tab title', t2 === 'mm renamed.jjs', { title: t2 });
    }
}

// Opening the megamodel logs NaN edge paths before any S6c code runs there (only the rename handler changed):
// measured apart, not counted against this slice.
meas('console errors at megamodel open (not S6c)', errors.filter((e) => e.phase === 'megamodel-open'));
const after = errors.filter((e) => e.phase !== 'setup' && e.phase !== 'megamodel-open');
meas('console errors during setup', errors.filter((e) => e.phase === 'setup').length);
meas('console errors by phase', after.reduce((acc: Record<string, number>, e) => { acc[e.phase] = (acc[e.phase] || 0) + 1; return acc; }, {}));
check('no console errors from the card on', after.length === 0, after.slice(0, 5));

console.log(`CROPS ${join(OUT, 's6c-update-file.png')}`);
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`);
await browser.close();
process.exit(failures);
