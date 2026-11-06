/**
 * jjodie-s2-script-card probe (P-2026-10-24-0310, slice S2 of R-JJD-2). Read-only on sources: it writes only to the
 * throwaway browser profile and to the lane folder.
 *
 * Question: does a JjScript block in a Jjodie reply render as the collapsed script card the S2 spec asks for? With an M1
 * model open, a reply is injected (as the S1b probe injects messages) whose jjscript block creates instances of the
 * model's own metaclasses and writes one unknown feature. Checked from the DOM: the card replaces the open block (no
 * Run button); status, name and line count; the chips equal the planner's creates per metaclass and reference writes
 * per feature, computed here from `planEffects` over `buildPlanWorld` on the open model; one amber line with the count
 * and the first warning; Fix warnings enabled, Edit script and Open as file enabled with their S5 titles (P-2026-10-24-0505); the
 * canvas preview bar showing the same N as the chips and N ghost nodes; `Show script` revealing the code; a TypeScript
 * block unchanged (no card, no Run); the M2 reply has a card of its own, its chips from the planner on the metamodel
 * (P-2026-10-25-1120, after the M2 preview lanes); no console errors.
 *
 * Fixture: scene_1_DemoPEST.jjodel (as jjodie-s3c-jjel-live.ts); the first M1 model whose pane draws a canvas.
 * Real app, own dev server (never 3000, 3001, 3003), light theme.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjodie-s2-script-card.ts --port 3015 --id P-2026-10-24-0310
 * Env:  S2_SCENES  directory of the scene exports (default ~/jjodel-demo-exports)
 *       S2_OUT     crop directory (default ~/.jjodel-lanes/P-2026-10-24-0310)
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
const SCENES_DIR = process.env.S2_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const OUT = process.env.S2_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-0310');
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

async function openModel(page: Page, id: string) {
    await page.evaluate(`(async () => { const j = await import('/src/joiner/index.ts'); const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(id)})); })()`).catch(() => {});
    await wait(page, 4000);
    await page.evaluate((x: string) => {
        const b = [...document.querySelectorAll('.dock-tab-btn')].find((e) => e.id.endsWith(`-tab-${x}`)) as HTMLElement | undefined;
        b?.click();
    }, id);
    await wait(page, 4000);
}

/** A script over the model's own metaclasses, and the planner's plan of it on the open model. */
const BUILD_SCRIPT = (modelId: string) => `(async () => {
  const pw = await import('/src/jjscript/executor/planWorld.ts');
  const pl = await import('/src/jjscript/executor/effectsPlanner.ts');
  const st = await import('/src/joiner/index.ts');
  const world = pw.buildPlanWorld(st.store.getState().idlookup, ${JSON.stringify(modelId)});
  const concrete = Object.values(world.classes).filter(c => !c.abstract && !c.singleton);
  if (concrete.length === 0) return { error: 'no concrete class', classes: Object.keys(world.classes) };
  const a = concrete[0], b = concrete[1] || concrete[0];
  const lines = ['// S2 probe script', 'create instance of ' + a.name + ' "S2a1"', 'create instance of ' + a.name + ' "S2a2"', 'create instance of ' + b.name + ' "S2b1"'];
  const ref = a.references.find(r => !r.containment && world.classes[r.type] && (b.kinds || []).includes(r.type));
  if (ref) lines.push('set S2a1.' + ref.name + ' += S2b1');
  lines.push('set S2a2.s2NoSuchFeature = 1');
  const script = lines.join('\\n');
  const plan = await pl.planEffects(script, world);
  return { script, plan, classes: concrete.map(c => c.name), ref: ref ? ref.name : null };
})()`;

/** The card of the reply whose bubble holds `marker`: since the M2 preview lanes an M2 reply has a card of its own. */
const M1_REPLY = 'Here is the script';
const M2_REPLY = 'A metamodel script';
const READ_CARD = (marker: string = M1_REPLY) => `(() => {
  const cards = [...document.querySelectorAll('.jodie-window .jj-script-card')];
  const card = cards.find(c => (c.closest('.jodie-message-bubble')?.textContent || '').includes(${JSON.stringify(marker)}));
  if (!card) return { count: 0 };
  const cs = (e) => e ? getComputedStyle(e) : null;
  const warn = card.querySelector('.jj-script-card__warnings');
  const wt = card.querySelector('.jj-script-card__warnings-text');
  const actions = [...card.querySelectorAll('.jj-script-card__action')].map(b => ({ text: b.textContent.trim(), disabled: b.disabled, title: b.title }));
  const r = card.getBoundingClientRect();
  return {
    count: cards.length,
    status: card.getAttribute('data-status'),
    statusText: card.querySelector('.jj-script-card__status-text')?.textContent,
    name: card.querySelector('.jj-script-card__name')?.textContent,
    lines: card.querySelector('.jj-script-card__lines')?.textContent,
    chips: [...card.querySelectorAll('.jj-script-card__chip')].map(c => c.textContent),
    warnings: wt && wt.textContent,
    warnColor: warn && cs(warn).color, warnIconColor: warn && cs(warn.querySelector('i')).color,
    warnOneLine: wt ? Math.round(wt.getBoundingClientRect().height) <= Math.ceil(parseFloat(cs(wt).lineHeight) || 20) + 1 : null,
    warnEllipsis: wt && cs(wt).textOverflow, warnNowrap: wt && cs(wt).whiteSpace,
    actions,
    disclosure: card.querySelector('.jj-script-card__disclosure')?.textContent.trim(),
    expanded: card.querySelector('.jj-script-card__disclosure')?.getAttribute('aria-expanded'),
    codeShown: !!card.querySelector('.jj-script-card__code .md-code-block'),
    codeText: card.querySelector('.jj-script-card__code .md-code-content')?.textContent || null,
    runInCard: !!card.querySelector('.md-code-jjscript'),
    openBlockInBubble: [...(card.closest('.jodie-message-bubble')?.querySelectorAll('.md-code-block') || [])].some(k => !k.closest('.jj-script-card') && k.textContent.includes('S2 probe script')),
    previewing: card.classList.contains('jj-script-card--previewing'),
    box: { x: r.left, y: r.top, w: r.width, h: r.height },
  };
})()`;

const READ_BAR = `(() => {
  const bar = document.querySelector('.jj-preview-bar');
  return {
    bar: !!bar,
    text: bar && bar.textContent.replace(/\\s+/g, ' ').trim(),
    count: bar && bar.querySelector('.jj-preview-bar__count')?.textContent,
    warnings: bar && bar.querySelector('.jj-preview-bar__warnings')?.textContent.trim(),
    ghosts: document.querySelectorAll('.react-flow__node.jj-preview-node').length,
  };
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
    meas('script', { classes: built.classes, ref: built.ref, script: built.script });
    check('script built from the model', !!built.script && !built.error, built.error || '');
    const plan = built.plan;
    const created = new Map<string, number>();
    for (const c of plan?.created ?? []) created.set(c.metaclass, (created.get(c.metaclass) ?? 0) + 1);
    const refs = new Map<string, number>();
    for (const r of plan?.references ?? []) if ((r.operator === '=' || r.operator === '+=') && r.target !== null) refs.set(r.feature, (refs.get(r.feature) ?? 0) + 1);
    const wantChips = [...[...created].map(([k, n]) => `+${n} ${k}`), ...[...refs].map(([k, n]) => `+${n} ${k}`)];
    const N = plan?.created.length ?? -1;
    meas('planner', { created: N, chips: wantChips, warnings: plan?.warnings, error: plan?.error });

    phase = 'card';
    await page.evaluate(`(async () => { const reg = await import('/src/events/registry.ts'); window.__s2Requests = 0; window.addEventListener(reg.JjodelEvents.SCRIPT_PREVIEW_REQUEST, () => { window.__s2Requests++; }); })()`);
    const scope = { level: 'M1', metamodelId: target.mm || '', metamodelName: 'probe', modelId: target.id };
    const tsBlock = '```typescript\nconst a = 1;\nconst b = 2;\n```';
    const m2Script = '```jjscript\ncreate class S2Probe\ncreate attribute x : EString in S2Probe\n```';
    note(await inject(page, [
        { id: 'msg_s2_m2', content: M2_REPLY + ':\n\n' + m2Script, jjodieScope: { level: 'M2', metamodelId: target.mm || '', metamodelName: 'probe' } },
        { id: 'msg_s2_card', content: M1_REPLY + ':\n\n```jjscript\n' + built.script + '\n```\n\nAnd a helper:\n\n' + tsBlock, jjodieScope: scope },
    ]));
    await wait(page, 2500);

    const c: any = await page.evaluate(READ_CARD());
    meas('card', c);
    const geo: any = await page.evaluate(`(() => {
      const card = [...document.querySelectorAll('.jodie-window .jj-script-card')].find(c => (c.closest('.jodie-message-bubble')?.textContent || '').includes(${JSON.stringify(M1_REPLY)}));
      const box = (sel) => { const e = sel === '' ? card : card.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { l: +r.left.toFixed(1), r: +r.right.toFixed(1), w: +r.width.toFixed(1), sw: e.scrollWidth, cw: e.clientWidth }; };
      const bubble = card.closest('.jodie-message-bubble').getBoundingClientRect();
      const win = document.querySelector('.jodie-window').getBoundingClientRect();
      return { win: [+win.left.toFixed(1), +win.right.toFixed(1)], bubble: [+bubble.left.toFixed(1), +bubble.right.toFixed(1)], card: box(''), summary: box('.jj-script-card__summary'), warn: box('.jj-script-card__warnings-text'), actions: box('.jj-script-card__actions'), disclosure: box('.jj-script-card__disclosure') };
    })()`);
    meas('card geometry', geo);
    const within = (x: any) => !!x && x.l >= geo.card.l - 0.5 && x.r <= geo.card.r + 0.5;
    check('card within its bubble and the window', geo.card.l >= geo.bubble[0] - 0.5 && geo.card.r <= geo.bubble[1] + 0.5 && geo.card.r <= geo.win[1] + 0.5, geo);
    check('warning line truncated inside the card, disclosure inside the card', within(geo.warn) && geo.warn.sw > geo.warn.cw && within(geo.disclosure), { warn: geo.warn, disc: geo.disclosure, card: geo.card });
    check('two script cards, one per reply (M1 and M2)', c.count === 2, c.count);
    check('no Run button and no open code block for the card', !c.runInCard && !c.openBlockInBubble, { run: c.runInCard, open: c.openBlockInBubble });
    check('status planned', c.status === 'planned' && c.statusText === 'Planned', { s: c.status, t: c.statusText });
    check('name from the first comment, line count', c.name === 'S2 probe script' && c.lines === `${built.script.split('\n').length} lines`, { n: c.name, l: c.lines });
    check('chips equal the planner (creates per metaclass, then reference writes)', JSON.stringify(c.chips) === JSON.stringify(wantChips), { card: c.chips, planner: wantChips });
    const w0 = plan?.warnings?.[0];
    const wantWarn = w0 ? `${plan.warnings.length} ${plan.warnings.length === 1 ? 'warning' : 'warnings'} · line ${w0.line}: ${w0.message}` : null;
    check('amber line: count and first warning', !!wantWarn && c.warnings === wantWarn, { card: c.warnings, want: wantWarn });
    check('amber line is one line, truncated with an ellipsis, amber', c.warnOneLine === true && c.warnEllipsis === 'ellipsis' && c.warnNowrap === 'nowrap' && c.warnColor === 'rgb(180, 83, 9)', { one: c.warnOneLine, e: c.warnEllipsis, ws: c.warnNowrap, col: c.warnColor, icon: c.warnIconColor });
    const act = Object.fromEntries((c.actions || []).map((a: any) => [a.text, a]));
    check('Fix warnings enabled', act['Fix warnings'] && !act['Fix warnings'].disabled, act['Fix warnings']);
    const wantActTitles: Record<string, string> = { 'Edit script': 'Edit the script, with a live preview', 'Open as file': 'Store the script as a project file and open it' };
    check('Edit script and Open as file enabled, with their S5 titles', Object.keys(wantActTitles).every((k) => act[k] && !act[k].disabled && act[k].title === wantActTitles[k]), [act['Edit script'], act['Open as file']]);
    check('Show script collapsed by default', c.disclosure === 'Show script' && c.expanded === 'false' && !c.codeShown, { d: c.disclosure, e: c.expanded, s: c.codeShown });

    const others: any = await page.evaluate(`(() => {
      const bubbles = [...document.querySelectorAll('.jodie-window .jodie-message-assistant .jodie-message-bubble')];
      const blocks = bubbles.flatMap(b => [...b.querySelectorAll('.md-code-block')].filter(k => !k.closest('.jj-script-card')));
      return blocks.map(k => ({ lang: k.querySelector('.md-code-language')?.textContent, run: !!k.querySelector('.md-code-jjscript') }));
    })()`);
    meas('other blocks', others);
    check('TypeScript block unchanged (no card, no Run)', others.some((o: any) => o.lang === 'TYPESCRIPT' && !o.run), others);
    check('no open jjscript block with Run in either reply', !others.some((o: any) => o.lang === 'JJSCRIPT'), others);

    // The M2 reply: its own card, chips from the planner on the metamodel (P-2026-10-24-1600).
    const m2: any = await page.evaluate(READ_CARD(M2_REPLY));
    meas('M2 card', m2);
    const m2Plan: any = await page.evaluate(`(async () => {
      const pw = await import('/src/jjscript/executor/planWorld.ts');
      const pl = await import('/src/jjscript/executor/effectsPlanner.ts');
      const st = await import('/src/joiner/index.ts');
      return pl.planEffects(${JSON.stringify(m2Script.replace(/^```jjscript\n|\n```$/g, ''))}, pw.buildPlanWorld(st.store.getState().idlookup, ${JSON.stringify(target.mm || '')}));
    })()`);
    const m2Created = new Map<string, number>();
    for (const x of m2Plan?.created ?? []) m2Created.set(x.metaclass, (m2Created.get(x.metaclass) ?? 0) + 1);
    const m2Refs = new Map<string, number>();
    for (const r of m2Plan?.references ?? []) if ((r.operator === '=' || r.operator === '+=') && r.target !== null) m2Refs.set(r.feature, (m2Refs.get(r.feature) ?? 0) + 1);
    const wantM2Chips = [...[...m2Created].map(([k, n]) => `+${n} ${k}`), ...[...m2Refs].map(([k, n]) => `+${n} ${k}`)];
    meas('M2 planner', { created: m2Plan?.created?.length, chips: wantM2Chips, warnings: m2Plan?.warnings, error: m2Plan?.error });
    check('M2 card: planned, no Run, no open block', m2.status === 'planned' && !m2.runInCard && !m2.openBlockInBubble, { s: m2.status, run: m2.runInCard, open: m2.openBlockInBubble });
    check('M2 card: chips equal the planner on the metamodel', wantM2Chips.length > 0 && JSON.stringify(m2.chips) === JSON.stringify(wantM2Chips), { card: m2.chips, planner: wantM2Chips });
    check('M2 card is not the previewed one (the M1 reply is newest)', m2.previewing === false, '');

    // Preview: the newest card asked for it on mount.
    const bar: any = await page.evaluate(READ_BAR);
    meas('preview bar', bar);
    check('preview bar shows the same N as the chips', bar.bar && bar.count === `+${N} ${N === 1 ? 'object' : 'objects'}`, { bar: bar.count, N });
    check('preview bar warning count equals the card', bar.bar && bar.warnings === `${plan.warnings.length} ${plan.warnings.length === 1 ? 'warning' : 'warnings'}`, bar.warnings);
    check('N ghost nodes on the canvas', bar.ghosts === N, { ghosts: bar.ghosts, N });
    check('card marked as the previewed script', (await page.evaluate(READ_CARD()) as any).previewing === true, '');

    // Discard, then a click on the M1 card brings the preview back.
    const m1Card = page.locator('.jodie-window .jodie-message-bubble', { hasText: M1_REPLY }).locator('.jj-script-card');
    const motion = await page.evaluate(`(async () => { const out = []; for (let i = 0; i < 6; i++) { const b = document.querySelector('.jj-preview-bar')?.getBoundingClientRect(); out.push(b ? [+b.left.toFixed(1), +b.top.toFixed(1), +b.width.toFixed(1)] : null); await new Promise(r => setTimeout(r, 120)); } return { rects: out, requests: window.__s2Requests }; })()`) as any;
    meas('bar motion before Discard', motion);
    check('the card asked for the preview once (no request loop)', motion.requests === 1, motion.requests);
    const bars = await page.locator('.jj-preview-bar').count();
    // The Properties rail is a fixed overlay (z 900) over the canvas: the bar must sit clear of it, or a real click lands on the rail.
    const hits: any[] = await page.evaluate(`(() => [...document.querySelectorAll('.jj-preview-bar button')].map((b) => { const r = b.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { text: b.textContent, own: !!t && (t === b || b.contains(t)), hit: t ? t.tagName + '.' + String(t.className).slice(0, 50) : null }; }))()`) as any;
    check('the bar buttons are the hit target at their centre', hits.length === 2 && hits.every((h) => h.own), hits);
    const discardErr = await page.locator('.jj-preview-bar button', { hasText: 'Discard' }).first().click({ timeout: 5000 }).then(() => null, (e: Error) => e.message.split('\n').slice(0, 6).join(' | '));
    meas('discard click', { bars, error: discardErr });
    check('a Playwright click on Discard lands', !discardErr, discardErr || '');
    await wait(page, 800);
    const gone: any = await page.evaluate(READ_BAR);
    await m1Card.locator('.jj-script-card__summary').click();
    await wait(page, 1500);
    const back: any = await page.evaluate(READ_BAR);
    check('Discard clears it, a click on the card previews again', !gone.bar && back.bar && back.count === bar.count, { gone: gone.bar, back: back.count });

    const card = m1Card;
    await card.scrollIntoViewIfNeeded();
    const cb = await card.boundingBox();
    await page.screenshot({ path: join(OUT, 's2-card.png'), clip: { x: cb!.x - 8, y: cb!.y - 8, width: cb!.width + 16, height: cb!.height + 16 } });
    const pane = await page.locator(paneSel(target.id)).boundingBox();
    if (pane) await page.screenshot({ path: join(OUT, 's2-canvas-preview.png'), clip: { x: pane.x, y: pane.y, width: pane.width, height: Math.min(pane.height, 640) } });

    await m1Card.locator('.jj-script-card__disclosure').click();
    await wait(page, 500);
    const o: any = await page.evaluate(READ_CARD());
    meas('card open', { d: o.disclosure, e: o.expanded, shown: o.codeShown });
    check('Show script reveals the code (S1b block, Copy, no Run)', o.codeShown && o.expanded === 'true' && o.disclosure === 'Hide script' && (o.codeText || '').includes('S2a1') && !o.runInCard, { shown: o.codeShown, e: o.expanded, run: o.runInCard });
    const ob = await card.boundingBox();
    await page.screenshot({ path: join(OUT, 's2-card-open.png'), clip: { x: ob!.x - 8, y: ob!.y - 8, width: ob!.width + 16, height: Math.min(ob!.height + 16, 700) } });
    await page.locator('.jj-preview-bar button', { hasText: 'Discard' }).click().catch(() => {});
}

const after = errors.filter((e) => e.phase === 'card');
meas('console errors during setup', errors.filter((e) => e.phase === 'setup').length);
check('no console errors once the card renders', after.length === 0, after.slice(0, 5));

console.log(`CROPS ${join(OUT, 's2-card.png')} ${join(OUT, 's2-canvas-preview.png')} ${join(OUT, 's2-card-open.png')}`);
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`);
await browser.close();
process.exit(failures);

function note(v: unknown) { meas('inject', v); }
