/**
 * jjodie-s1b-header-composer probe (P-2026-10-24-0211).
 *
 * Question: does slice S1b render what the prompt asks? Header contents and order (avatar, name,
 * status dot, context chip, New conversation, overflow menu holding Reset, close; no mode switch,
 * no model selector, no fullscreen), the mode selector inside the input (its box within the
 * composer's box, left of the textarea, keyboard reachable, same modes and state), the 11.5 px line
 * under the input (model selector and disclaimer), the JjEL scope hint above the input, code block
 * padding and soft wrap with a 4ch hanging indent on a long line, the Run button still there, and
 * the console free of errors after Jjodie opens. Every item is read from the DOM; two crops are
 * written as a record, light theme.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjodie-s1b-header-composer.ts --port 3013 --id P-2026-10-24-0211
 * Env:  S1B_OUT   crop directory (default ~/.jjodel-lanes/P-2026-10-24-0211)
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3013/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const OUT = process.env.S1B_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-0211');
mkdirSync(OUT, { recursive: true });

const note = (label: string, d: unknown) =>
    console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};

const JODIE_HOOK = `(() => {
  const root = document.querySelector('.jodie-root');
  const k = root && Object.keys(root).find(k => k.startsWith('__reactFiber$'));
  let f = k && root[k];
  while (f && !(f.type && f.type.name === 'Jodie')) f = f.return;
  let h = f && f.memoizedState;
  while (h) { const s = h.memoizedState; if (s && typeof s === 'object' && Array.isArray(s.messages) && 'isOpen' in s && 'isWaiting' in s) return h; h = h.next; }
  return null;
})()`;

const LONG = 'create attribute description : EString in Library ' + 'with a deliberately long tail of words '.repeat(8);
const PROSE_MSG = 'Here is the script, with one long line:\n\n```jjscript\ncreate class Library\n' + LONG + '\ncreate class Book\n```\n\nRun it when ready.';
const NUMBERED_MSG = '```jjscript\ncreate class A\ncreate class B\n' + LONG + '\ncreate class C\ncreate class D\ncreate class E\n```\n';

async function inject(page: Page, msgs: Array<{ id: string; content: string }>) {
    return page.evaluate(`(() => {
      const h = ${JODIE_HOOK};
      if (!h) return 'no chat hook';
      const add = ${JSON.stringify(msgs)}.map(m => ({ id: m.id, kind: 'chat', role: 'assistant', timestamp: Date.now(), content: m.content }));
      h.queue.dispatch(prev => ({ ...prev, isOpen: true, messages: [...prev.messages, ...add] }));
      return 'ok';
    })()`);
}

async function createProject(page: Page, name: string): Promise<string | null> {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForTimeout(4000);
    await page.locator('button', { hasText: 'New Project' }).first().click();
    await page.waitForTimeout(1200);
    await page.locator('input[type="text"]').first().fill(name);
    await page.locator('button', { hasText: /^Create/ }).last().click();
    await page.waitForTimeout(5000);
    return page.evaluate(`(() => { const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length ? a[a.length - 1].id : null; })()`) as Promise<string | null>;
}

const HEADER = `(() => {
  const h = document.querySelector('.jodie-window .jodie-header');
  if (!h) return null;
  const pick = [
    ['avatar', '.jodie-avatar'], ['name', '.jodie-name'], ['dot', '.jodie-alive-dot'],
    ['chip', '.jodie-metamodel-indicator'], ['new', '.jodie-new-conversation-btn'],
    ['overflow', '.jodie-overflow-btn'], ['close', '.jodie-close-btn'],
  ];
  const found = pick.map(([k, s]) => { const e = h.querySelector(s); const r = e && e.getBoundingClientRect(); return { k, ok: !!e, x: r ? Math.round(r.left) : null }; });
  const all = [...h.querySelectorAll('.jodie-avatar, .jodie-name, .jodie-alive-dot, .jodie-metamodel-indicator, .jodie-new-conversation-btn, .jodie-overflow-btn, .jodie-close-btn')];
  const order = all.map(e => pick.find(([, s]) => e.matches(s))[0]);
  const nb = h.querySelector('.jodie-new-conversation-btn');
  return {
    found, order,
    buttons: [...h.querySelectorAll('button')].map(b => b.getAttribute('aria-label') || b.title),
    newLabel: nb && nb.getAttribute('aria-label'), newTitle: nb && nb.title,
    modeSwitch: !!h.querySelector('.jodie-mode-switch'),
    modelSelector: !!h.querySelector('.provider-model-selector'),
    fullscreen: !!h.querySelector('.jodie-fullscreen-btn, .jodie-fullscreen-exit-btn'),
    subrow: !!document.querySelector('.jodie-window .jodie-code-subrow'),
    name: h.querySelector('.jodie-name')?.textContent.trim(),
  };
})()`;

const COMPOSER = `(() => {
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { l: +b.left.toFixed(1), t: +b.top.toFixed(1), r: +b.right.toFixed(1), b: +b.bottom.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const c = document.querySelector('.jodie-window .jodie-composer');
  const sel = c && c.querySelector('.jodie-mode-select');
  const ctl = sel && sel.querySelector('select');
  const ta = c && c.querySelector('textarea.jodie-input');
  const meta = document.querySelector('.jodie-window .jodie-composer-meta');
  const disc = meta && meta.querySelector('.ai-disclaimer');
  const pm = meta && meta.querySelector('.provider-model-selector .provider-btn');
  const scope = document.querySelector('.jodie-window .jodie-code-scope--composer');
  const fs = (e) => e ? getComputedStyle(e).fontSize : null;
  return {
    composer: r(c), select: r(sel), textarea: r(ta), meta: r(meta), scope: r(scope),
    prompt: sel && sel.querySelector('.jodie-code-prompt')?.textContent,
    options: ctl ? [...ctl.options].map(o => o.value + ':' + o.textContent) : null,
    value: ctl && ctl.value, ariaLabel: ctl && ctl.getAttribute('aria-label'), tabIndex: ctl ? ctl.tabIndex : null,
    metaFont: fs(meta), discFont: fs(disc), pmFont: fs(pm), scopeFont: fs(scope),
    metaLines: meta ? Math.round(meta.getBoundingClientRect().height / parseFloat(getComputedStyle(meta).lineHeight)) : null,
    hasPm: !!pm, hasDisc: !!disc, scopeText: scope && scope.textContent.trim(),
    discTitle: meta && meta.querySelector('.jodie-composer-meta__disclaimer')?.title,
    oldDisclaimerOutside: [...document.querySelectorAll('.jodie-window .ai-disclaimer')].filter(e => !e.closest('.jodie-composer-meta')).length,
  };
})()`;

/** Visual line starts of the long line in a code block: min left per line box, grouped by top. */
const CODE_MEASURE = `((index) => {
  const bubbles = [...document.querySelectorAll('.jodie-window .jodie-message-assistant .jodie-message-bubble')].filter(b => b.querySelector('.md-code-block'));
  const bubble = bubbles[index];
  if (!bubble) return { error: 'no bubble ' + index + ' of ' + bubbles.length };
  const block = bubble.querySelector('.md-code-block');
  const code = block.querySelector('.md-code-content code');
  const lines = [...block.querySelectorAll('.md-code-line')];
  const longLine = lines.find(l => l.textContent.includes('deliberately long tail'));
  const probe = document.createElement('span'); probe.textContent = '0000000000';
  code.appendChild(probe); const ch = probe.getBoundingClientRect().width / 10; probe.remove();
  const starts = (el) => {
    const rects = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n; while ((n = walker.nextNode())) {
      if (n.parentElement.closest('.linenumber')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) if (q.width > 0) rects.push(q);
    }
    const byTop = new Map();
    for (const q of rects) { const k = Math.round(q.top); byTop.set(k, Math.min(byTop.get(k) ?? 1e9, q.left)); }
    return [...byTop.entries()].sort((a, b) => a[0] - b[0]).map(([t, l]) => +l.toFixed(1));
  };
  const bb = bubble.getBoundingClientRect(), cb = block.getBoundingClientRect();
  const bcs = getComputedStyle(bubble), kcs = getComputedStyle(block), ccs = getComputedStyle(block.querySelector('.md-code-content'));
  const s = longLine ? starts(longLine) : [];
  const lineCs = longLine ? getComputedStyle(longLine) : null;
  return {
    numbered: block.classList.contains('md-code-block--numbered'),
    bubble: { l: +bb.left.toFixed(1), r: +bb.right.toFixed(1), padding: bcs.padding },
    block: { l: +cb.left.toFixed(1), r: +cb.right.toFixed(1), radius: kcs.borderRadius, borderL: kcs.borderLeftWidth, borderR: kcs.borderRightWidth, margin: kcs.margin },
    contentPadding: ccs.padding, whiteSpace: getComputedStyle(code).whiteSpace,
    scrollOverflow: block.querySelector('.md-code-content').scrollWidth - block.querySelector('.md-code-content').clientWidth,
    lines: lines.length, lineDisplay: lineCs && lineCs.display, ch: +ch.toFixed(2),
    visualLines: s.length, starts: s, lineHeight: lineCs && lineCs.lineHeight,
    run: !!block.querySelector('.md-code-jjscript'), runText: block.querySelector('.md-code-jjscript')?.textContent.trim(),
  };
})`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await seed(ctx, false);
const page = await ctx.newPage();
const errors: Array<{ phase: string; text: string }> = [];
let phase = 'setup';
page.on('pageerror', (e) => errors.push({ phase, text: 'pageerror: ' + e.message }));
page.on('console', (m) => { if (m.type() === 'error') errors.push({ phase, text: m.text().slice(0, 200) }); });

const pid = await createProject(page, 'S1b_probe');
check('project created', !!pid, String(pid));
await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
await page.waitForTimeout(7000);
note('theme', await page.evaluate(`document.documentElement.getAttribute('data-theme') || document.body.className`));

phase = 'jjodie';
if ((await page.locator('.jodie-window').count()) === 0) {
    await page.locator('.jodie-minimized').first().click();
    await page.waitForTimeout(1500);
}
check('Jjodie window open', (await page.locator('.jodie-window').count()) === 1, '');

// 1. Header.
const h: any = await page.evaluate(HEADER);
note('header', h);
const want = ['avatar', 'name', 'dot', 'chip', 'new', 'overflow', 'close'];
check('header has the seven items', !!h && h.found.every((f: any) => f.ok), JSON.stringify(h?.found.filter((f: any) => !f.ok)));
check('header order avatar,name,dot,chip,new,overflow,close', !!h && JSON.stringify(h.order) === JSON.stringify(want), JSON.stringify(h?.order));
check('New conversation label and tooltip', h?.newLabel === 'New conversation' && h?.newTitle === 'New conversation', `${h?.newLabel} / ${h?.newTitle}`);
check('no mode switch, model selector, fullscreen or JjEL sub-row in the header', !!h && !h.modeSwitch && !h.modelSelector && !h.fullscreen && !h.subrow, JSON.stringify({ m: h?.modeSwitch, p: h?.modelSelector, f: h?.fullscreen, s: h?.subrow }));
check('header has exactly three buttons', h?.buttons.length === 3, JSON.stringify(h?.buttons));

// Overflow menu: opens, focuses its first item, holds Reset, closes on Escape.
await page.locator('.jodie-overflow-btn').click();
await page.waitForTimeout(300);
const menu: any = await page.evaluate(`(() => { const m = document.querySelector('.jodie-overflow-menu'); return m && { items: [...m.querySelectorAll('[role=menuitem]')].map(b => b.textContent.trim()), focused: document.activeElement && document.activeElement.textContent.trim(), expanded: document.querySelector('.jodie-overflow-btn').getAttribute('aria-expanded') }; })()`);
check('overflow menu holds Reset, first item focused', !!menu && menu.items.length === 1 && /Reset/.test(menu.items[0]) && menu.focused === menu.items[0] && menu.expanded === 'true', JSON.stringify(menu));
await page.screenshot({ path: join(OUT, 's1b-header.png'), clip: await page.locator('.jodie-window').boundingBox().then((b) => ({ x: b!.x, y: b!.y, width: b!.width, height: 160 })) });
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const afterEsc: any = await page.evaluate(`({ open: !!document.querySelector('.jodie-overflow-menu'), focus: document.activeElement && document.activeElement.className })`);
check('Escape closes the menu and returns focus to its button', !afterEsc.open && /jodie-overflow-btn/.test(afterEsc.focus), JSON.stringify(afterEsc));

// 2. Composer: selector inside the input, keyboard reachable, same modes and state.
let c: any = await page.evaluate(COMPOSER);
note('composer jjodie', c);
const inside = (a: any, b: any) => a && b && a.l >= b.l - 0.5 && a.r <= b.r + 0.5 && a.t >= b.t - 0.5 && a.b <= b.b + 0.5;
check('mode selector box within the composer box', inside(c.select, c.composer), JSON.stringify({ s: c.select, c: c.composer }));
check('mode selector left of the textarea', !!c.select && !!c.textarea && c.select.r <= c.textarea.l + 0.5, `${c.select?.r} <= ${c.textarea?.l}`);
check('selector options are the three modes, value jjodie', JSON.stringify(c.options) === JSON.stringify(['jjodie:Jjodie', 'jjscript:JjScript', 'jjel:JjEL']) && c.value === 'jjodie' && c.prompt === 'jjodie>', JSON.stringify({ o: c.options, v: c.value, p: c.prompt }));
await page.locator('textarea.jodie-input').focus();
await page.keyboard.press('Shift+Tab');
const kb: any = await page.evaluate(`({ cls: document.activeElement.className, label: document.activeElement.getAttribute('aria-label') })`);
check('Shift+Tab from the textarea reaches the mode selector', /jodie-mode-select__control/.test(kb.cls) && kb.label === 'Console mode', JSON.stringify(kb));
await page.locator('.jodie-mode-select__control').selectOption('jjel');
await page.waitForTimeout(400);
c = await page.evaluate(COMPOSER);
note('composer jjel', c);
check('choosing JjEL switches the mode (glyph and value)', c.value === 'jjel' && c.prompt === 'jjel>', JSON.stringify({ v: c.value, p: c.prompt }));
check('JjEL scope hint visible right above the input', !!c.scope && c.scopeText === 'scope: self, model, classes' && c.scope.b <= c.composer.t + 0.5 && c.composer.t - c.scope.b < 12, JSON.stringify({ s: c.scope, ct: c.composer?.t, f: c.scopeFont }));
check('scope hint 11.5px', c.scopeFont === '11.5px', String(c.scopeFont));
await page.keyboard.press('Meta+j');
await page.waitForTimeout(400);
const cycled: any = await page.evaluate(COMPOSER);
check('Cmd+J still cycles and the selector follows (same state)', cycled.value === cycled.prompt?.replace('>', '') && cycled.value !== 'jjel', JSON.stringify({ v: cycled.value, p: cycled.prompt }));
await page.locator('.jodie-mode-select__control').selectOption('jjodie');
await page.waitForTimeout(400);
c = await page.evaluate(COMPOSER);
check('back to Jjodie, scope hint gone', c.value === 'jjodie' && !c.scope, JSON.stringify({ v: c.value, s: c.scope }));

// 3. The 11.5px line under the input.
check('meta line under the input', !!c.meta && c.meta.t >= c.composer.b - 0.5 && c.meta.t - c.composer.b < 12, JSON.stringify({ m: c.meta, cb: c.composer?.b }));
check('meta line 11.5px (line, disclaimer, model selector)', c.metaFont === '11.5px' && c.discFont === '11.5px' && c.pmFont === '11.5px', JSON.stringify({ m: c.metaFont, d: c.discFont, p: c.pmFont }));
check('meta line is one line and holds model selector and disclaimer', c.metaLines === 1 && c.hasPm && c.hasDisc, JSON.stringify({ lines: c.metaLines, pm: c.hasPm, d: c.hasDisc, h: c.meta?.h }));
check('no disclaimer left outside the meta line', c.oldDisclaimerOutside === 0, String(c.oldDisclaimerOutside));
note('disclaimer tooltip', c.discTitle);

// 4. Code blocks: prose + code (bleed, wrap) and code only with line numbers.
note('inject', await inject(page, [{ id: 'msg_s1b_prose', content: PROSE_MSG }, { id: 'msg_s1b_numbered', content: NUMBERED_MSG }]));
await page.waitForTimeout(1500);
for (const [i, label] of [[0, 'prose'], [1, 'numbered']] as const) {
    const m: any = await page.evaluate(`${CODE_MEASURE}(${i})`);
    note(`code ${label}`, m);
    if (m.error) { check(`code ${label} rendered`, false, m.error); continue; }
    check(`code ${label}: soft wrap (pre-wrap, no horizontal overflow, long line on >1 visual line)`, m.whiteSpace === 'pre-wrap' && m.scrollOverflow <= 0 && m.visualLines > 1, JSON.stringify({ ws: m.whiteSpace, o: m.scrollOverflow, v: m.visualLines }));
    check(`code ${label}: lines are blocks`, m.lineDisplay === 'block', String(m.lineDisplay));
    if (label === 'prose') {
        const d = m.starts[1] - m.starts[0];
        check('code prose: hanging indent 4ch on wrapped lines', Math.abs(d - 4 * m.ch) <= 1.5 && m.starts.slice(2).every((x: number) => Math.abs(x - m.starts[1]) <= 0.5), `delta ${d.toFixed(1)} vs 4ch ${(4 * m.ch).toFixed(1)}, starts ${JSON.stringify(m.starts)}`);
        check('code prose: no nested card (block flush with the bubble edges, radius 0, no side borders)', Math.abs(m.block.l - m.bubble.l) <= 1 && Math.abs(m.block.r - m.bubble.r) <= 1 && m.block.radius === '0px' && m.block.borderL === '0px' && m.block.borderR === '0px', JSON.stringify({ b: m.bubble, k: m.block }));
    } else {
        // Line-number text is skipped, so starts[0] is where the code begins on the first visual
        // line; continuation lines must sit 4ch further in than that, as without numbers.
        const d = m.starts[1] - m.starts[0];
        check('code numbered: continuation 4ch past the code start', Math.abs(d - 4 * m.ch) <= 1.5 && m.starts.slice(2).every((x: number) => Math.abs(x - m.starts[1]) <= 0.5), `delta ${d.toFixed(1)} vs 4ch ${(4 * m.ch).toFixed(1)}, starts ${JSON.stringify(m.starts)}`);
        check('code numbered (code only): bubble box stripped', m.bubble.padding === '0px', m.bubble.padding);
    }
    check(`code ${label}: Run button unchanged`, m.run && m.runText === 'Run', JSON.stringify({ run: m.run, t: m.runText }));
}
const win = await page.locator('.jodie-window').boundingBox();
await page.locator('.jodie-window .jodie-message-assistant').last().scrollIntoViewIfNeeded();
await page.screenshot({ path: join(OUT, 's1b-composer-code.png'), clip: { x: win!.x, y: win!.y + win!.height - 520, width: win!.width, height: 520 } });

// 5. Console.
const after = errors.filter((e) => e.phase === 'jjodie');
note('console errors before Jjodie opened', errors.filter((e) => e.phase === 'setup').length);
check('console free of errors after Jjodie opened', after.length === 0, JSON.stringify(after.slice(0, 5)));

console.log(`CROPS ${join(OUT, 's1b-header.png')} ${join(OUT, 's1b-composer-code.png')}`);
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
