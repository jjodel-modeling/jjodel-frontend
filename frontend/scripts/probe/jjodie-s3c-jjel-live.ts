/**
 * jjodie-s3c-jjel-live probe (P-2026-10-24-0241, slice S3c of R-JJD-3). Read-only on sources: it writes only to the
 * throwaway browser profile and to the lane folder.
 *
 * Question: does the JjEL live result render and behave as the S3 spec asks? With node A selected before JjEL mode
 * opens, submit `self.name`: the expression stays in the input, the block reads `self <level> <kind> <path>` and
 * `follows selection`, the value is mono 15 px slate-900, the type 12 px slate-400, the block background transparent.
 * Shift-click B: re-evaluated once, at least 150 ms after the selection event (debounce), as a two-row list. Pin
 * (`aria-pressed` true, `pinned`), click C alone: no re-evaluation. Unpin: re-evaluated on C, one value. A feature
 * the metaclass lacks reads `not applicable to <Kind>` in slate-400; a nested quantifier forced past 500 ms reads
 * `timed out`, muted; a parse error keeps the error colour. History capped at six, newest at the bottom.
 *
 * Fixture: scene_1_DemoPEST.jjodel (as canvas-multi-selection.ts); the first model whose pane shows three nodes clear
 * of the Jjodie panel. Real app, own dev server (never 3000, 3001, 3003), light theme.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjodie-s3c-jjel-live.ts --port 3014 --id P-2026-10-24-0241
 * Env:  S3C_SCENES  directory of the scene exports (default ~/jjodel-demo-exports)
 *       S3C_OUT     crop and JSON directory (default ~/.jjodel-lanes/P-2026-10-24-0241)
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
const SCENES_DIR = process.env.S3C_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const OUT = process.env.S3C_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-0241');
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 800)}`); };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 1500)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const paneSel = (m: string) => `[id="${m}"].dock-tabpane-active`;

const SLATE_900 = 'rgb(15, 23, 42)';
const SLATE_400 = 'rgb(148, 163, 184)';
const ERROR_RED = 'rgb(185, 28, 28)';
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

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

async function openModel(page: Page, id: string) {
    await page.evaluate(`(async () => { const j = await import('/src/joiner/index.ts'); const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(id)})); })()`).catch(() => {});
    await wait(page, 4000);
    await page.evaluate((x: string) => {
        const b = [...document.querySelectorAll('.dock-tab-btn')].find((e) => e.id.endsWith(`-tab-${x}`)) as HTMLElement | undefined;
        b?.click();
    }, id);
    await wait(page, 4000);
}

/** Visible top-level nodes of the pane, left of the Jjodie panel; the point clicked is the header strip. */
async function paneNodes(page: Page, m: string): Promise<Array<{ id: string; x: number; y: number }>> {
    return page.evaluate((sel: string) => {
        const pane = document.querySelector(sel);
        if (!pane) return [];
        const jw = document.querySelector('.jodie-window')?.getBoundingClientRect();
        const limit = jw ? jw.left : innerWidth;
        return [...pane.querySelectorAll('.react-flow__node')].map((n) => {
            const r = (n as HTMLElement).getBoundingClientRect();
            return { id: n.getAttribute('data-id') || '', x: r.left + r.width / 2, y: r.top + Math.min(10, r.height / 2), vis: r.width > 20 && r.height > 20 && r.top > 0 && r.left > 0 && r.bottom < innerHeight && r.right < limit - 4 };
        }).filter((n) => n.id && n.vis);
    }, paneSel(m));
}

/** Everything the checks read from the live block, in one pass. */
const READ_LIVE = `(() => {
  const root = document.querySelector('.jodie-window .jjel-live');
  const cs = (el) => el ? getComputedStyle(el) : null;
  const val = root && root.querySelector('.jjel-live__value');
  const typ = root && root.querySelector('.jjel-live__type');
  const res = root && root.querySelector('.jjel-live__result');
  const pin = root && root.querySelector('.jjel-live__pin');
  const line = root && root.querySelector('.jjel-live__value-line');
  const hist = root ? [...root.querySelectorAll('.jjel-live__history-row')] : [];
  return {
    present: !!root,
    evalCount: root ? Number(root.getAttribute('data-eval-count')) : null,
    input: document.querySelector('.jodie-window textarea.jodie-input')?.value ?? null,
    self: root && root.querySelector('.jjel-live__self')?.textContent,
    badge: root && root.querySelector('.jjel-live__badge')?.textContent,
    kind: root && root.querySelector('.jjel-live__kind')?.textContent,
    path: root && root.querySelector('.jjel-live__path')?.textContent,
    mode: root && root.querySelector('.jjel-live__mode')?.textContent,
    pressed: pin && pin.getAttribute('aria-pressed'),
    pinTag: pin && pin.tagName,
    status: line ? (line.className.match(/--([a-z-]+)$/) || [])[1] : null,
    value: val && val.textContent,
    valueFont: val && cs(val).fontSize, valueColor: val && cs(val).color, valueFamily: val && cs(val).fontFamily,
    type: typ && typ.textContent, typeFont: typ && cs(typ).fontSize, typeColor: typ && cs(typ).color,
    rootBg: root && cs(root).backgroundColor, resultBg: res && cs(res).backgroundColor,
    resultBorders: res && [cs(res).borderTopWidth, cs(res).borderRightWidth, cs(res).borderBottomWidth, cs(res).borderLeftWidth],
    upper: root ? [...root.querySelectorAll('*')].filter(e => cs(e).textTransform === 'uppercase').length : null,
    rows: root ? [...root.querySelectorAll('.jjel-live__row')].map(r => ({ path: r.querySelector('.jjel-live__row-path')?.textContent, value: r.querySelector('.jjel-live__row-value')?.textContent, cls: r.className })) : [],
    history: hist.map(h => h.textContent),
    historyColor: hist[0] ? cs(hist[0]).color : null,
  };
})()`;
const readLive = (page: Page) => page.evaluate(READ_LIVE) as Promise<any>;

async function submit(page: Page, expr: string) {
    const ta = page.locator('.jodie-window textarea.jodie-input');
    await ta.fill(expr);
    await ta.press('Enter');
    await wait(page, 400);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await seed(ctx, true);
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
const result: any = { url: URL };

const { project, models } = await importScene(page, 'scene_1_DemoPEST.jjodel');
check('imported', !!project && models.length >= 2, { project, models: models.map((m) => m.name) });
meas('theme', await page.evaluate(`document.documentElement.getAttribute('data-theme') || 'none'`));

if ((await page.locator('.jodie-window').count()) === 0) {
    await page.locator('.jodie-minimized').first().click();
    await wait(page, 1500);
}
check('Jjodie window open', (await page.locator('.jodie-window').count()) === 1, '');

// Selection events and the moments the live block changes its evaluation count.
await page.evaluate(async () => {
    const reg = await import('/src/events/registry.ts' as any);
    const w = window as any;
    w.__s3cEvents = [];
    w.__s3cEvals = [];
    window.addEventListener(reg.JjodelEvents.CANVAS_SELECTION_CHANGED, (e: Event) => w.__s3cEvents.push({ t: performance.now(), d: (e as CustomEvent).detail }));
    new MutationObserver((ms) => {
        for (const m of ms) if (m.attributeName === 'data-eval-count') w.__s3cEvals.push({ t: performance.now(), n: (m.target as HTMLElement).getAttribute('data-eval-count') });
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-eval-count'] });
});

let target = '';
let nodes: Array<{ id: string; x: number; y: number }> = [];
for (const m of [...models.filter((x) => !x.meta), ...models.filter((x) => x.meta)]) {
    await openModel(page, m.id);
    nodes = await paneNodes(page, m.id);
    meas(`pane ${m.name}`, { meta: m.meta, visibleNodes: nodes.length });
    if (nodes.length >= 3) { target = m.id; result.model = m; break; }
}
check('a model with three visible nodes', !!target, { target });

if (target) {
    const [a, b, c] = nodes.slice(0, 3);
    result.nodes = [a.id, b.id, c.id];
    // 1. A selected before JjEL mode opens: the initial target is the current single selection.
    await page.mouse.click(a.x, a.y);
    await wait(page, 1500);
    await page.locator('.jodie-mode-select__control').selectOption('jjel');
    await wait(page, 800);
    await submit(page, 'self.name');
    const s1 = await readLive(page);
    meas('single A', s1);
    check('expression stays in the input', s1.input === 'self.name', s1.input);
    check('target line: self, level badge, kind, path, follows selection', s1.self === 'self' && /^M[12]$/.test(s1.badge || '') && !!s1.kind && !!s1.path && s1.mode === 'follows selection', { self: s1.self, badge: s1.badge, kind: s1.kind, path: s1.path, mode: s1.mode });
    check('value ok, mono 15 px slate-900', s1.status === 'ok' && s1.valueFont === '15px' && s1.valueColor === SLATE_900 && /Mono|monospace/i.test(s1.valueFamily || ''), { st: s1.status, v: s1.value, f: s1.valueFont, c: s1.valueColor, fam: s1.valueFamily });
    check('type 12 px slate-400', s1.typeFont === '12px' && s1.typeColor === SLATE_400, { t: s1.type, f: s1.typeFont, c: s1.typeColor });
    check('no tinted background (block and root transparent)', s1.resultBg === TRANSPARENT && s1.rootBg === TRANSPARENT, { r: s1.resultBg, root: s1.rootBg });
    check('hairline only: top border 1 px, no box', JSON.stringify(s1.resultBorders) === JSON.stringify(['1px', '0px', '0px', '0px']), s1.resultBorders);
    check('no uppercase labels in the view', s1.upper === 0, s1.upper);
    check('pin is a button, aria-pressed false', s1.pinTag === 'BUTTON' && s1.pressed === 'false', { tag: s1.pinTag, p: s1.pressed });
    await page.screenshot({ path: join(OUT, 's3c-single.png'), clip: await page.locator('.jodie-window .jodie-input-container').boundingBox().then((bb) => ({ x: bb!.x, y: bb!.y, width: bb!.width, height: bb!.height })) });

    // 2. Shift-click B: one debounced re-evaluation, a two-row list.
    await page.evaluate(() => { (window as any).__s3cEvents = []; (window as any).__s3cEvals = []; });
    await page.keyboard.down('Shift');
    await page.mouse.click(b.x, b.y);
    await page.keyboard.up('Shift');
    await wait(page, 1200);
    const timing = await page.evaluate(() => ({ ev: (window as any).__s3cEvents.map((e: any) => ({ t: e.t, n: e.d.elementIds.length })), evals: (window as any).__s3cEvals }));
    const lastEv = timing.ev[timing.ev.length - 1];
    const firstEval = timing.evals[0];
    const delay = lastEv && firstEval ? +(firstEval.t - lastEv.t).toFixed(1) : null;
    meas('debounce timing', { events: timing.ev.length, evals: timing.evals.length, delayMs: delay });
    check('debounce: one re-evaluation, 150..450 ms after the last selection event', timing.evals.length === 1 && delay !== null && delay >= 150 && delay < 450, { evals: timing.evals.length, delay });
    const s2 = await readLive(page);
    meas('multi A+B', { rows: s2.rows, kind: s2.kind, mode: s2.mode, history: s2.history });
    check('multi-selection: two list rows (path, value)', s2.rows.length === 2 && s2.rows.every((r: any) => !!r.path && r.value !== undefined), s2.rows);

    // 3. Pin, then click C alone: no re-evaluation.
    await page.locator('.jodie-window .jjel-live__pin').click();
    await wait(page, 200);
    const s3 = await readLive(page);
    check('pin: aria-pressed true, mode pinned', s3.pressed === 'true' && s3.mode === 'pinned', { p: s3.pressed, m: s3.mode });
    await page.screenshot({ path: join(OUT, 's3c-multi-pinned.png'), clip: await page.locator('.jodie-window .jodie-input-container').boundingBox().then((bb) => ({ x: bb!.x, y: bb!.y, width: bb!.width, height: bb!.height })) });
    await page.mouse.click(c.x, c.y);
    await wait(page, 900);
    const s4 = await readLive(page);
    check('pinned: selection change does not re-evaluate', s4.evalCount === s3.evalCount && s4.rows.length === 2, { before: s3.evalCount, after: s4.evalCount, rows: s4.rows.length });

    // 4. Unpin: catches up with C, one value.
    await page.locator('.jodie-window .jjel-live__pin').click();
    await wait(page, 400);
    const s5 = await readLive(page);
    meas('unpinned on C', { path: s5.path, value: s5.value, mode: s5.mode, evalCount: s5.evalCount });
    check('unpin: aria-pressed false, re-evaluated on one element', s5.pressed === 'false' && s5.mode === 'follows selection' && s5.evalCount === (s4.evalCount ?? 0) + 1 && s5.rows.length === 0 && s5.status === 'ok', { p: s5.pressed, n: s5.evalCount, rows: s5.rows.length, st: s5.status });

    // 5. A feature the metaclass does not have.
    await submit(page, 'self.zzzNoSuchFeature');
    const s6 = await readLive(page);
    meas('not applicable', { v: s6.value, st: s6.status, c: s6.valueColor });
    check('not applicable: muted slate-400 text, not the error style', s6.status === 'not-applicable' && /^not applicable to \S+/.test(s6.value || '') && s6.valueColor === SLATE_400, { st: s6.status, v: s6.value, c: s6.valueColor });

    // 6. Timeout: a nested quantifier over the instances, the shallowest depth whose unbounded run takes 700 ms or
    // more. Not deeper: the console entry that a submit also appends (evaluateJjelInJodie) has no deadline, and a
    // deeper one blocks the thread for its whole run.
    const nest = (d: number) => '(' + Array.from({ length: d }, (_, i) => `forall x${i} in instances: `).join('') + 'x0.name).size';
    const fixture = await page.evaluate(`(async () => {
      const j = await import('/src/components/Jodie/jodieJjelContext.ts');
      const out = [];
      for (let d = 1; d <= 8; d++) {
        const expr = '(' + Array.from({ length: d }, (_, i) => 'forall x' + i + ' in instances: ').join('') + 'x0.name).size';
        const t0 = performance.now();
        const rows = j.evaluateJjelLive(expr, [], 1e9);
        const ms = performance.now() - t0;
        out.push({ d, ms: +ms.toFixed(1), st: rows[0].status });
        if (ms >= 700 || rows[0].status !== 'ok') break;
      }
      return out;
    })()`) as Array<{ d: number; ms: number; st: string }>;
    const pick = fixture.find((f) => f.ms >= 700 && f.st === 'ok');
    meas('timeout fixture (unbounded runs)', fixture);
    if (pick) {
        const expr = nest(pick.d);
        const t0 = Date.now();
        await submit(page, expr);
        const s7 = await readLive(page);
        meas('timeout', { v: s7.value, st: s7.status, c: s7.valueColor, wallMs: Date.now() - t0 });
        check('slow expression: timed out, muted', s7.status === 'timed-out' && s7.value === 'timed out' && s7.valueColor === SLATE_400, { st: s7.status, v: s7.value, c: s7.valueColor });
    }

    // 7. A parse error keeps the error colour.
    await submit(page, 'self.');
    const s8 = await readLive(page);
    check('parse error: error style', s8.status === 'error' && s8.valueColor === ERROR_RED, { st: s8.status, v: s8.value, c: s8.valueColor });

    // 8. History: capped at six, newest at the bottom.
    await submit(page, 'self.name.toUpper()');
    await submit(page, 'self.name');
    const s9 = await readLive(page);
    meas('history', { length: s9.history.length, rows: s9.history, color: s9.historyColor });
    check('history capped at six', s9.history.length === 6, s9.history.length);
    check('history newest at the bottom (the previous expression)', /^self\.name\.toUpper\(\) on /.test(s9.history[s9.history.length - 1] || ''), s9.history[s9.history.length - 1]);
    check('history muted slate-400', s9.historyColor === SLATE_400, s9.historyColor);
    await page.screenshot({ path: join(OUT, 's3c-single-history.png'), clip: await page.locator('.jodie-window .jodie-input-container').boundingBox().then((bb) => ({ x: bb!.x, y: bb!.y, width: bb!.width, height: bb!.height })) });
    result.final = s9;
}
meas('page errors', errors.slice(0, 5));
check('no page errors', errors.length === 0, errors.slice(0, 3));
writeFileSync(join(OUT, 'probe_jjodie_s3c.json'), JSON.stringify(result, null, 2));
console.log(`OUT ${OUT}`);
await ctx.close();
await browser.close();
process.exit(failures);
