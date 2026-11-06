/**
 * jjodie-s5-script-editor probe (P-2026-10-24-0350, slice S5 of R-JJD-2). Read-only on sources: it writes only to the
 * throwaway browser profile and to the lane folder.
 *
 * Question: does `Edit script` on a Jjodie script card open the S5 editor, and do its actions do what the spec says?
 * With an M1 model open, a reply with a jjscript block is injected (as the S2 probe does), followed by filler replies so
 * that the conversation scrolls. Checked from the DOM: Edit script hides the conversation and shows the editor with the
 * script; replacing one line by keyboard gives the green margin bar on that line only; one preview request after the
 * debounce, not one per keystroke; the status line reads valid; the canvas bar counts N+1; Compare shows a read-only
 * diff with the change; Revert restores the text and clears the bar; Undo brings the edit back; Save as file opens a
 * `.jjs` tab with the edited text; Chat returns to the conversation at the same scroll; Apply on the canvas bar turns
 * the card applied; Open as file on the card opens a tab with the generated text; no console errors.
 *
 * Fixture: scene_1_DemoPEST.jjodel (as jjodie-s2-script-card.ts); the first M1 model whose pane draws a canvas.
 * Real app, own dev server (never 3000, 3001, 3003), light theme.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjodie-s5-script-editor.ts --port 3015 --id P-2026-10-24-0350
 * Env:  S5_SCENES  directory of the scene exports (default ~/jjodel-demo-exports)
 *       S5_OUT     crop directory (default ~/.jjodel-lanes/P-2026-10-24-0350)
 *
 * Exit code: number of failed checks.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3015/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3003');
const SCENES_DIR = process.env.S5_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const OUT = process.env.S5_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-0350');
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 800)}`); };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 1500)}`);
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

async function activateModelTab(page: Page, id: string) {
    await page.evaluate((x: string) => {
        const b = [...document.querySelectorAll('.dock-tab-btn')].find((e) => e.id.endsWith(`-tab-${x}`)) as HTMLElement | undefined;
        b?.click();
    }, id);
    await wait(page, 2500);
}

async function openModel(page: Page, id: string) {
    await page.evaluate(`(async () => { const j = await import('/src/joiner/index.ts'); const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(id)})); })()`).catch(() => {});
    await wait(page, 4000);
    await activateModelTab(page, id);
    await wait(page, 1500);
}

/** A script over the model's own metaclasses (the S2 one, renamed), and the planner's plan of it on the open model. */
const BUILD_SCRIPT = (modelId: string) => `(async () => {
  const pw = await import('/src/jjscript/executor/planWorld.ts');
  const pl = await import('/src/jjscript/executor/effectsPlanner.ts');
  const st = await import('/src/joiner/index.ts');
  const world = pw.buildPlanWorld(st.store.getState().idlookup, ${JSON.stringify(modelId)});
  const concrete = Object.values(world.classes).filter(c => !c.abstract && !c.singleton);
  if (concrete.length === 0) return { error: 'no concrete class', classes: Object.keys(world.classes) };
  const a = concrete[0], b = concrete[1] || concrete[0];
  const lines = ['// S5 probe script', 'create instance of ' + a.name + ' "S5a1"', 'create instance of ' + a.name + ' "S5a2"', 'create instance of ' + b.name + ' "S5b1"'];
  const ref = a.references.find(r => !r.containment && world.classes[r.type] && (b.kinds || []).includes(r.type));
  if (ref) lines.push('set S5a1.' + ref.name + ' += S5b1');
  lines.push('set S5a2.s5NoSuchFeature = 1');
  const script = lines.join('\\n');
  const plan = await pl.planEffects(script, world);
  return { script, plan, a: a.name, ref: ref ? ref.name : null };
})()`;

/** The editor text as rendered, lines in screen order, nbsp as space. */
const viewText = (root: string) => `(() => {
  const lines = [...document.querySelectorAll(${JSON.stringify(root)} + ' .view-line')]
    .map(e => ({ top: parseFloat(e.style.top) || 0, text: e.textContent.replace(/\\u00a0/g, ' ') }))
    .sort((x, y) => x.top - y.top);
  return lines.map(l => l.text).join('\\n');
})()`;

const READ_EDITOR = `(() => {
  const ed = document.querySelector('.jodie-window .jj-script-editor');
  if (!ed) return { open: false };
  const pane = ed.querySelector('.jj-script-editor__pane:not(.jj-script-editor__pane--diff)');
  const bars = [...pane.querySelectorAll('.jj-script-editor__edited-line')];
  const lineTops = [...pane.querySelectorAll('.view-line')].map(e => Math.round(e.getBoundingClientRect().top)).sort((a, b) => a - b);
  const barLines = bars.map(b => lineTops.indexOf(Math.round(b.getBoundingClientRect().top)) + 1);
  const bar = bars[0];
  const status = ed.querySelector('.jj-script-editor__status');
  const msgs = document.querySelector('.jodie-window .jodie-messages');
  return {
    open: true,
    name: ed.querySelector('.jj-script-editor__name')?.textContent,
    back: ed.querySelector('.jj-script-editor__back')?.textContent.trim(),
    actions: [...ed.querySelectorAll('.jj-script-editor__action')].map(b => ({ text: b.textContent.trim(), disabled: b.disabled, pressed: b.getAttribute('aria-pressed') })),
    editedAttr: ed.getAttribute('data-edited-lines'),
    bars: bars.length, barLines,
    barColor: bar && getComputedStyle(bar).backgroundColor, barWidth: bar && Math.round(bar.getBoundingClientRect().width),
    barRect: bar && (() => { const r = bar.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; })(),
    geom: bar && (() => { const r = (q) => { const e = pane.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.width)]; }; return { margin: r('.margin'), lineNumbers: r('.line-numbers'), content: r('.lines-content'), viewLine: r('.view-line span'), cldrStyle: bar.getAttribute('style'), cls: bar.className, parent: bar.parentElement && bar.parentElement.className }; })(),
    barOnTop: bar && (() => { const r = bar.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return t === bar ? 'bar' : (t && t.className); })(),
    status: status?.textContent, statusColor: status && getComputedStyle(status).color,
    diff: !!ed.querySelector('.monaco-diff-editor'),
    diffInserts: ed.querySelectorAll('.monaco-diff-editor .line-insert, .monaco-diff-editor .char-insert, .monaco-diff-editor .gutter-insert').length,
    diffText: [...ed.querySelectorAll('.monaco-diff-editor .editor.modified .view-line')].map(e => e.textContent.replace(/\\u00a0/g, ' ')).join('\\n'),
    conversationHidden: !!document.querySelector('.jodie-window .jodie-conversation--hidden') && !!msgs && msgs.offsetParent === null,
  };
})()`;

const READ_BAR = `(() => {
  const bar = document.querySelector('.jj-preview-bar');
  return { bar: !!bar, text: bar && bar.textContent.replace(/\\s+/g, ' ').trim(), count: bar && bar.querySelector('.jj-preview-bar__count')?.textContent, ghosts: document.querySelectorAll('.react-flow__node.jj-preview-node').length };
})()`;

const READ_TAB = `(() => {
  const tab = document.querySelector('.dock-tabpane-active .script-tab');
  return { tab: !!tab, name: tab && tab.querySelector('.script-tab__name')?.textContent.trim() };
})()`;

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
    meas(`pane ${m.name}`, { canvas: ok });
    if (ok) { target = m; break; }
}
check('an M1 model with a canvas', !!target, target);

if (target) {
    const built: any = await page.evaluate(BUILD_SCRIPT(target.id));
    check('script built from the model', !!built.script && !built.error, built.error || '');
    const generated: string = built.script;
    const N: number = built.plan?.created.length ?? -1;
    const lastLine = generated.split('\n').length;
    const newLine = `create instance of ${built.a} "S5x1"`;
    const editedText = [...generated.split('\n').slice(0, -1), newLine].join('\n');
    meas('planner', { created: N, lines: lastLine, warnings: built.plan?.warnings?.length, error: built.plan?.error });

    phase = 'card';
    await page.evaluate(`(async () => { const reg = await import('/src/events/registry.ts'); window.__s5Requests = []; window.addEventListener(reg.JjodelEvents.SCRIPT_PREVIEW_REQUEST, (e) => { window.__s5Requests.push({ t: performance.now(), script: e.detail && e.detail.script }); }); })()`);
    const scope = { level: 'M1', metamodelId: target.mm || '', metamodelName: 'probe', modelId: target.id };
    const filler = Array.from({ length: 9 }, (_, i) => ({ id: `msg_s5_fill_${i}`, content: `Filler reply ${i + 1}.\n\n` + 'A line of text that takes some room in the panel. '.repeat(6) }));
    meas('inject', await inject(page, [
        ...filler.slice(0, 3),
        { id: 'msg_s5_card', content: 'Here is the script:\n\n```jjscript\n' + generated + '\n```', jjodieScope: scope },
        ...filler.slice(3),
    ]));
    await wait(page, 3000);

    const actions = await page.evaluate(`[...document.querySelectorAll('.jodie-window .jj-script-card .jj-script-card__action')].map(b => ({ text: b.textContent.trim(), disabled: b.disabled, title: b.title }))`) as Array<{ text: string; disabled: boolean; title: string }>;
    const edit = actions.find((a) => a.text === 'Edit script');
    const open = actions.find((a) => a.text === 'Open as file');
    check('Edit script and Open as file enabled, no Coming tooltip', !!edit && !!open && !edit.disabled && !open.disabled && !/Coming/.test(edit.title + open.title), actions);

    const card = page.locator('.jodie-window .jj-script-card').first();
    await card.scrollIntoViewIfNeeded();
    await wait(page, 600);
    const scroll0 = await page.evaluate(`(() => { const m = document.querySelector('.jodie-window .jodie-messages'); return { top: m.scrollTop, max: m.scrollHeight - m.clientHeight }; })()`) as { top: number; max: number };
    meas('chat scroll before edit', scroll0);

    phase = 'editor';
    await card.locator('.jj-script-card__action', { hasText: 'Edit script' }).click();
    await wait(page, 2500);
    let e: any = await page.evaluate(READ_EDITOR);
    const text0 = await page.evaluate(viewText('.jodie-window .jj-script-editor__pane:not(.jj-script-editor__pane--diff)')) as string;
    meas('editor open', { name: e.name, back: e.back, actions: e.actions?.map((a: any) => a.text), status: e.status });
    check('Edit script opens the editor in place of the conversation', e.open && e.conversationHidden && e.back === 'Chat', { open: e.open, hidden: e.conversationHidden, back: e.back });
    check('the editor shows the generated script, no edited line', text0 === generated && e.bars === 0 && e.editedAttr === '', { same: text0 === generated, bars: e.bars, text0 });
    check('status line valid on the generated script', e.status === 'Valid · preview follows your edits', e.status);

    // Replace the last line by keyboard.
    const before = await page.evaluate(`window.__s5Requests.length`) as number;
    const lines = page.locator('.jodie-window .jj-script-editor__pane:not(.jj-script-editor__pane--diff) .view-line');
    await lines.nth(lastLine - 1).click();
    await page.keyboard.press('End');
    await page.keyboard.press('Shift+Home');
    await page.keyboard.type(newLine, { delay: 15 });
    const typedAt = await page.evaluate(`performance.now()`) as number;
    await wait(page, 200);
    const midRequests = (await page.evaluate(`window.__s5Requests.length`) as number) - before;
    await wait(page, 1500);
    const reqs = (await page.evaluate(`window.__s5Requests`) as Array<{ t: number; script: string }>).slice(before);
    e = await page.evaluate(READ_EDITOR);
    const text1 = await page.evaluate(viewText('.jodie-window .jj-script-editor__pane:not(.jj-script-editor__pane--diff)')) as string;
    meas('after edit', { bars: e.bars, barLines: e.barLines, attr: e.editedAttr, color: e.barColor, width: e.barWidth, rect: e.barRect, onTop: e.barOnTop, geom: e.geom, status: e.status, statusColor: e.statusColor });
    meas('debounce', { requests: reqs.length, during200ms: midRequests, delayMs: reqs[0] ? Math.round(reqs[0].t - typedAt) : null });
    check('the editor holds the edited text', text1 === editedText, { text1 });
    check(`green bar on line ${lastLine} only`, e.bars === 1 && e.barLines[0] === lastLine && e.editedAttr === String(lastLine) && e.barColor === 'rgb(34, 197, 94)' && e.barOnTop === 'bar' && e.barRect.h >= 10 && e.geom.lineNumbers && e.geom.viewLine && e.barRect.x >= e.geom.lineNumbers[0] + e.geom.lineNumbers[1] && e.barRect.x + e.barRect.w <= e.geom.viewLine[0], { rect: e.barRect, onTop: e.barOnTop, geom: e.geom, bars: e.bars, lines: e.barLines, attr: e.editedAttr, color: e.barColor });
    check('one preview request with the edited text, after the debounce', reqs.length === 1 && reqs[0].script === editedText && midRequests === 0 && (reqs[0].t - typedAt) >= 300, { n: reqs.length, mid: midRequests });
    check('status line valid after the edit', e.status === 'Valid · preview follows your edits', e.status);
    const bar: any = await page.evaluate(READ_BAR);
    meas('preview bar', bar);
    check(`preview bar counts N+1 = ${N + 1}`, bar.bar && (bar.text || '').includes(`+${N + 1} objects`) && bar.ghosts === N + 1, bar);

    const panel = await page.locator('.jodie-window').boundingBox();
    if (panel) await page.screenshot({ path: join(OUT, 's5-editor-edited.png'), clip: { x: panel.x, y: panel.y, width: panel.width, height: panel.height } });

    // Compare.
    await page.locator('.jodie-window .jj-script-editor__action', { hasText: 'Compare with generated' }).click();
    await wait(page, 1500);
    e = await page.evaluate(READ_EDITOR);
    meas('compare', { diff: e.diff, inserts: e.diffInserts, pressed: e.actions.find((a: any) => a.text === 'Compare with generated')?.pressed });
    // Read-only, by behaviour: typing into the modified side leaves the edited text as it was.
    await page.locator('.jodie-window .monaco-diff-editor .editor.modified textarea').first().focus();
    await page.keyboard.type('zz', { delay: 15 });
    await wait(page, 500);
    const afterType = await page.evaluate(viewText('.jodie-window .monaco-diff-editor .editor.modified')) as string;
    const readOnly = !afterType.includes('zz');
    check('Compare shows a read-only diff with the change', e.diff && e.diffInserts > 0 && e.diffText.includes('S5x1') && readOnly, { diff: e.diff, inserts: e.diffInserts, readOnly, afterType });
    if (panel) await page.screenshot({ path: join(OUT, 's5-compare.png'), clip: { x: panel.x, y: panel.y, width: panel.width, height: Math.min(panel.height, 720) } });
    await page.locator('.jodie-window .jj-script-editor__action', { hasText: 'Compare with generated' }).click();
    await wait(page, 600);

    // Revert, then Undo.
    await page.locator('.jodie-window .jj-script-editor__action', { hasText: 'Revert' }).click();
    await wait(page, 800);
    e = await page.evaluate(READ_EDITOR);
    const text2 = await page.evaluate(viewText('.jodie-window .jj-script-editor__pane:not(.jj-script-editor__pane--diff)')) as string;
    check('Revert restores the generated text and clears the bar', text2 === generated && e.bars === 0 && e.editedAttr === '', { same: text2 === generated, bars: e.bars });
    await page.locator('.jodie-window .jj-script-editor__action', { hasText: 'Undo' }).click();
    await wait(page, 1200);
    e = await page.evaluate(READ_EDITOR);
    const text3 = await page.evaluate(viewText('.jodie-window .jj-script-editor__pane:not(.jj-script-editor__pane--diff)')) as string;
    check('Undo brings the edit back', text3 === editedText && e.bars === 1, { same: text3 === editedText, bars: e.bars, text3 });

    // Save as file.
    await page.locator('.jodie-window .jj-script-editor__action', { hasText: 'Save as file' }).click();
    await wait(page, 2500);
    const tab: any = await page.evaluate(READ_TAB);
    const tabText = await page.evaluate(viewText('.dock-tabpane-active .script-tab')) as string;
    const stored = await page.evaluate(`(async () => { const f = await import('/src/components/scripts/scriptFiles.ts'); return f.readProjectScripts().map(s => ({ name: s.name, text: s.text, modelId: s.modelId })); })()`) as Array<{ name: string; text: string; modelId?: string }>;
    meas('save as file', { tab, stored: stored.map((s) => s.name) });
    check('Save as file opens a .jjs tab with the edited text', tab.tab && /\.jjs$/.test(tab.name || '') && tabText === editedText && stored.some((s) => s.text === editedText && s.modelId === target!.id), { tab, same: tabText === editedText, tabText, stored: stored.map((s) => s.text) });

    // Chat, while comparing: the diff unmounts with the view.
    await page.locator('.jodie-window .jj-script-editor__action', { hasText: 'Compare with generated' }).click();
    await wait(page, 1200);
    await page.locator('.jodie-window .jj-script-editor__back').click();
    await wait(page, 800);
    const back = await page.evaluate(`(() => { const m = document.querySelector('.jodie-window .jodie-messages'); return { editor: !!document.querySelector('.jodie-window .jj-script-editor'), visible: !!m && m.offsetParent !== null, top: m && m.scrollTop, input: !!document.querySelector('.jodie-window .jodie-conversation:not(.jodie-conversation--hidden) textarea'), cards: document.querySelectorAll('.jodie-window .jj-script-card').length }; })()`) as any;
    meas('back to chat', back);
    check('Chat returns to the conversation at the same scroll', !back.editor && back.visible && back.input && back.cards === 1 && Math.abs(back.top - scroll0.top) <= 1 && scroll0.top > 0 && scroll0.top < scroll0.max, { back, scroll0 });

    // Apply the edited preview from the canvas bar: the card turns applied.
    phase = 'apply';
    await activateModelTab(page, target.id);
    const bar2: any = await page.evaluate(READ_BAR);
    meas('preview bar after Save', bar2);
    await page.locator('.jj-preview-bar button', { hasText: 'Apply' }).click().catch(() => {});
    await wait(page, 3000);
    const after = await page.evaluate(`(() => { const c = document.querySelector('.jodie-window .jj-script-card'); return { status: c && c.getAttribute('data-status'), text: c && c.querySelector('.jj-script-card__status-text')?.textContent, bar: !!document.querySelector('.jj-preview-bar') }; })()`) as any;
    meas('after Apply', after);
    check('after Apply of the edited script the card reads applied', after.status === 'applied' && !after.bar, after);

    // Open as file on the card.
    phase = 'open';
    await page.locator('.jodie-window .jj-script-card .jj-script-card__action', { hasText: 'Open as file' }).click();
    await wait(page, 2500);
    const tab2: any = await page.evaluate(READ_TAB);
    const tab2Text = await page.evaluate(viewText('.dock-tabpane-active .script-tab')) as string;
    meas('open as file', tab2);
    check('Open as file opens a tab with the generated text', tab2.tab && /\.jjs$/.test(tab2.name || '') && tab2.name !== tab.name && tab2Text === generated, { tab2, same: tab2Text === generated });
}

const after = errors.filter((e) => e.phase !== 'setup');
meas('console errors during setup', errors.filter((e) => e.phase === 'setup').length);
check('no console errors from the card on', after.length === 0, after.slice(0, 5));

console.log(`CROPS ${join(OUT, 's5-editor-edited.png')} ${join(OUT, 's5-compare.png')}`);
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`);
await browser.close();
process.exit(failures);
