/**
 * jjodie-dock probe (P-2026-10-24-0210): the docked Jjodie panel of S1a (R-JJD-1, P-2026-10-24-0135), measured from
 * the DOM in a project with a model on the canvas.
 *
 * Fresh context, Advanced mode, DemoESM imported (fixtures/scene_3_DemoESM.jjodel), its M1 tab open, the Properties
 * rail shown (`jjodel:properties-show` through the registry string). Then:
 *   - Jjodie opened from the FAB: the window is docked in `.jodie-dock-slot`, 460 px by default, its right edge on the
 *     viewport's right edge;
 *   - the handle: present, `role="separator"`, focusable;
 *   - the clamp: arrow keys and a pointer drag both stop at 760 and at 420;
 *   - the width set by a drag is saved as `dockWidth` in `jjodie-credentials` on pointer-up, and read back after a
 *     reload;
 *   - the canvas (`.react-flow` of the M1 pane) is narrower by the dock's width with Jjodie open;
 *   - the Properties rail's right edge equals the dock's left edge, and with Jjodie closed the viewport's right edge;
 *   - no visible element with `position: fixed` outside the dock overlaps the dock's box;
 *   - the Quick tip (`.notification-widget`, its tips API stubbed with one tip) intersects neither the rail nor the dock
 *     with both shown (P-2026-10-24-0656);
 *   - no fullscreen or maximize button in the window, and every header button inside the window's box;
 *   - closed: the window unmounts, the FAB is shown, the slot is 0 px wide, the body variable is back to 0px, and the
 *     FAB opens the window again;
 *   - no console or page error from the moment Jjodie is first opened (errors while the project loads are listed, not
 *     judged: they are not this slice's).
 *
 * Crops, light theme, in ~/.jjodel-lanes/P-2026-10-24-0210/ (JJD_CROPS): jjodie_open_rail.png, jjodie_closed.png,
 * quicktip_rail_dock.png.
 *
 * Run:  PROBE_URL=http://localhost:3012 node --experimental-strip-types frontend/scripts/probe/jjodie-dock.ts
 * Env:  JJD_OUT    JSON output (default frontend/scripts/smoke/_tmp_jjodie-dock.json, gitignored)
 *       JJD_CROPS  the folder of the crops
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3012/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const OUT = process.env.JJD_OUT || new globalThis.URL('../smoke/_tmp_jjodie-dock.json', import.meta.url).pathname;
const CROPS = process.env.JJD_CROPS || `${homedir()}/.jjodel-lanes/P-2026-10-24-0210`;
const FIXTURE = new globalThis.URL('./fixtures/scene_3_DemoESM.jjodel', import.meta.url).pathname;
const MM = 'DemoESM', M1 = 'demoESM';
const VIEWPORT = { width: 1600, height: 1000 };
mkdirSync(CROPS, { recursive: true });

const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const near = (a: number, b: number, tol = 0.5) => Math.abs(a - b) <= tol;

// ── Page side (plain strings: no transform) ────────────────────────────────────────────────────
const IMPORT = (text: string) => String.raw`(async () => {
  const api = await import('/src/api/persistance/projects.ts');
  const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
  const before = count();
  await api.ProjectsApi.importFromText(${JSON.stringify(text)});
  for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
  const a = JSON.parse(localStorage.getItem('projects') || '[]');
  return a.length > before ? a[a.length - 1].id : null;
})()`;

const LOADED = String.raw`(() => {
  try {
    const all = Object.values(window.windoww.store.getState().idlookup).filter((d) => d && typeof d === 'object');
    const a = all.find((d) => d.className === 'DModel' && d.isMetamodel && d.name === ${JSON.stringify(MM)});
    const b = all.find((d) => d.className === 'DModel' && !d.isMetamodel && d.name === ${JSON.stringify(M1)});
    return a && b && document.querySelectorAll('.dock-tab').length > 0 ? { mm: a.id, m1: b.id } : null;
  } catch (e) { return null; }
})()`;

const PANE = (m1Id: string) => `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1Id}"]'))`;
const CLICK = (expr: string) => String.raw`(() => { const el = ${expr}; if (!el) return { found: false }; el.click(); return { found: true }; })()`;

/** Everything the probe reads in one go (sizes in px, rounded to 0.01). */
const STATE = (m1Id: string) => String.raw`(() => {
  const r2 = (v) => Math.round(v * 100) / 100;
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r2(r.x), y: r2(r.y), w: r2(r.width), h: r2(r.height), right: r2(r.right), bottom: r2(r.bottom) }; };
  const win = document.querySelector('.jodie-window');
  const slot = document.querySelector('.jodie-dock-slot');
  const handle = win && win.querySelector('.jodie-dock-handle');
  const rail = document.querySelector('.properties-tree-overlay');
  const pane = ${PANE(m1Id)};
  const fab = document.querySelector('.jodie-minimized');
  let creds = null;
  try { creds = JSON.parse(localStorage.getItem('jjodie-credentials') || 'null'); } catch (e) { creds = 'unparseable'; }
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    window: box(win),
    windowClass: win ? win.className : null,
    windowStyleWidth: win ? win.style.width : null,
    boxSizing: win ? getComputedStyle(win).boxSizing : null,
    inSlot: !!(win && slot && slot.contains(win)),
    slot: box(slot),
    handle: handle ? { box: box(handle), role: handle.getAttribute('role'), tabIndex: handle.tabIndex, valuenow: handle.getAttribute('aria-valuenow') } : null,
    rail: box(rail),
    railClass: rail ? rail.className : null,
    railDisplay: rail ? getComputedStyle(rail).display : null,
    canvas: box(pane && pane.querySelector('.react-flow')),
    fab: box(fab),
    fabVisible: !!fab && getComputedStyle(fab).display !== 'none' && fab.getBoundingClientRect().width > 0,
    bodyVar: document.body.style.getPropertyValue('--jj-jodie-dock-width'),
    bodyVarComputed: getComputedStyle(document.body).getPropertyValue('--jj-jodie-dock-width').trim(),
    dockWidth: creds && typeof creds === 'object' ? creds.dockWidth : creds,
  };
})()`;

/** Visible `position: fixed` elements outside the dock whose box intersects the dock's box. */
const FIXED_OVER_DOCK = String.raw`(() => {
  const win = document.querySelector('.jodie-window');
  if (!win) return null;
  const d = win.getBoundingClientRect();
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (win.contains(el) || el.contains(win)) continue;
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const ix = Math.min(r.right, d.right) - Math.max(r.left, d.left);
    const iy = Math.min(r.bottom, d.bottom) - Math.max(r.top, d.top);
    if (ix > 0.5 && iy > 0.5) out.push({ el: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), z: cs.zIndex, pe: cs.pointerEvents });
  }
  return out;
})()`;

const FULLSCREEN = String.raw`(() => {
  const win = document.querySelector('.jodie-window');
  if (!win) return null;
  const byClass = win.querySelectorAll('.jodie-fullscreen-btn, .jodie-fullscreen-exit-btn').length;
  const byLabel = [...win.querySelectorAll('button, [role="button"]')].filter((b) => /fullscreen|full screen|maximi[sz]e/i.test((b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || ''))).map((b) => b.getAttribute('title') || b.getAttribute('aria-label'));
  return { byClass, byLabel };
})()`;

async function poll<T>(page: Page, expr: string, ms: number): Promise<T | null> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        const v = await page.evaluate(expr).catch(() => null) as T | null;
        if (v) return v;
        await wait(page, 250);
    }
    return null;
}

async function openProject(page: Page, pid: string): Promise<{ mm: string; m1: string } | null> {
    await page.goto(`${URL}/?open=${encodeURIComponent(pid)}#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    const ids = await poll<{ mm: string; m1: string }>(page, LOADED, 120000);
    await wait(page, 3000);
    if (!ids) return null;
    const tab = await page.evaluate(CLICK(`[...document.querySelectorAll('.dock-tab')].find((t) => t.textContent.trim() === ${JSON.stringify(M1)})`)) as any;
    if (!tab.found) await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)})); })()`);
    await poll(page, `(() => { const p = ${PANE(ids.m1)}; return !!p && p.querySelectorAll('.react-flow__node').length > 0; })()`, 60000);
    await wait(page, 2000);
    // Show the Properties rail (JjodelEvents.PROPERTIES_SHOW).
    await page.evaluate(`window.dispatchEvent(new CustomEvent('jjodel:properties-show'))`);
    await poll(page, `(() => { const r = document.querySelector('.properties-tree-overlay'); return !!r && !r.classList.contains('properties-tree-overlay--collapsed'); })()`, 5000);
    await wait(page, 800);
    return ids;
}

async function openJodie(page: Page): Promise<boolean> {
    await page.evaluate(CLICK(`document.querySelector('.jodie-minimized')`));
    const ok = await poll(page, `!!document.querySelector('.jodie-window.jodie-window--visible')`, 5000);
    await wait(page, 800); // enter transition, React Flow resize observer
    return !!ok;
}

async function crop(page: Page, file: string, box: { x: number; y: number; w: number; h: number }) {
    const x = Math.max(0, Math.floor(box.x));
    const y = Math.max(0, Math.floor(box.y));
    const width = Math.min(VIEWPORT.width - x, Math.ceil(box.w));
    const height = Math.min(VIEWPORT.height - y, Math.ceil(box.h));
    await page.screenshot({ path: `${CROPS}/${file}`, clip: { x, y, width, height } });
    console.log(`CROP  ${CROPS}/${file}  ${width}x${height}`);
}

async function dragHandle(page: Page, dx: number) {
    const h = await page.locator('.jodie-dock-handle').boundingBox();
    if (!h) throw new Error('no handle');
    const x = h.x + h.width / 2, y = h.y + h.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y, { steps: 12 });
    await page.mouse.up();
    await wait(page, 400);
}

const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
const result: any = { url: URL };
const loadErrors: string[] = [];
const jodieErrors: string[] = [];
let phase: 'load' | 'jodie' = 'load';

try {
    const ctx = await browser.newContext({ viewport: VIEWPORT });
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    await seed(ctx, true);
    // The Quick tip reads its posts from a remote worker: one stubbed tip makes it show on every run.
    await ctx.route('https://jjodel-notifications.alfonso99.workers.dev/**', (route) => route.fulfill({
        status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ posts: [{ id: 'probe-tip', category: 'tip', message: 'Probe tip: the Quick tip clears the rail and the dock.' }] }),
    }));
    const page = await ctx.newPage();
    page.on('pageerror', (e: Error) => (phase === 'load' ? loadErrors : jodieErrors).push('pageerror: ' + e.message.slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error') (phase === 'load' ? loadErrors : jodieErrors).push('console: ' + m.text().slice(0, 200)); });

    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await poll(page, `!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 120000);
    await wait(page, 2000);
    const pid = await page.evaluate(IMPORT(readFileSync(FIXTURE, 'utf8'))) as string | null;
    check('import DemoESM', !!pid, `${pid}`);
    if (!pid) throw new Error('no project');
    let ids = await openProject(page, pid);
    check('project open, M1 canvas with nodes', !!ids, JSON.stringify(ids));
    if (!ids) throw new Error('no project load');

    // ── Closed, before any opening ────────────────────────────────────────────────────────────
    const closed0 = await page.evaluate(STATE(ids.m1)) as any;
    result.closed0 = closed0;
    note('closed (before)', { canvas: closed0.canvas, rail: closed0.rail, slot: closed0.slot, fab: closed0.fab, bodyVar: closed0.bodyVarComputed });
    check('closed: FAB shown, no window', closed0.fabVisible && !closed0.window, JSON.stringify({ fab: closed0.fab, window: closed0.window }));
    check('closed: the Properties rail is open', !!closed0.rail && !/--collapsed/.test(closed0.railClass ?? ''), `${closed0.railClass}`);
    check('closed: the rail\'s right edge is the viewport\'s right edge', !!closed0.rail && near(closed0.rail.right, closed0.viewport.w), JSON.stringify({ rail: closed0.rail, vw: closed0.viewport.w }));

    // ── Open ─────────────────────────────────────────────────────────────────────────────────
    phase = 'jodie';
    check('the FAB opens Jjodie', await openJodie(page), '');
    const open = await page.evaluate(STATE(ids.m1)) as any;
    result.open = open;
    note('open', { window: open.window, style: open.windowStyleWidth, boxSizing: open.boxSizing, slot: open.slot, canvas: open.canvas, rail: open.rail, bodyVar: open.bodyVarComputed });
    check('open: docked in the dashboard slot', open.inSlot && /jodie-window--docked/.test(open.windowClass ?? ''), `${open.windowClass}`);
    check('open: dock width is 460 by default', !!open.window && near(open.window.w, 460), JSON.stringify({ box: open.window?.w, style: open.windowStyleWidth, boxSizing: open.boxSizing }));
    check('open: dock\'s right edge is the viewport\'s right edge', !!open.window && near(open.window.right, open.viewport.w), JSON.stringify({ right: open.window?.right, vw: open.viewport.w }));
    check('open: dock spans the dashboard height (top below the app bar, bottom on the status bar or viewport)', !!open.window && open.window.y >= 49 && open.window.h > 500, JSON.stringify(open.window));
    check('open: handle present, role=separator, tabIndex 0', !!open.handle && open.handle.role === 'separator' && open.handle.tabIndex === 0, JSON.stringify(open.handle));
    await page.focus('.jodie-dock-handle');
    const focused = await page.evaluate(`document.activeElement && document.activeElement.classList.contains('jodie-dock-handle')`);
    check('open: handle takes focus', focused === true, `${focused}`);
    check('open: the canvas shrinks by the dock width', !!open.canvas && !!closed0.canvas && !!open.window && near(closed0.canvas.w - open.canvas.w, open.window.w, 1), JSON.stringify({ before: closed0.canvas?.w, after: open.canvas?.w, dock: open.window?.w }));
    check('open: the rail is open and its right edge equals the dock\'s left edge', !!open.rail && !!open.window && near(open.rail.right, open.window.x), JSON.stringify({ railRight: open.rail?.right, dockLeft: open.window?.x, bodyVar: open.bodyVarComputed }));
    const fixed = await page.evaluate(FIXED_OVER_DOCK) as any[];
    result.fixedOverDock = fixed;
    check('open: no position:fixed element overlaps the dock', Array.isArray(fixed) && fixed.length === 0, fixed);
    // The Quick tip with the rail open and Jjodie docked (P-2026-10-24-0656): its box meets neither the rail nor the dock.
    await poll(page, `!!document.querySelector('.notification-widget')`, 10000);
    const tip = await page.evaluate(String.raw`(() => {
      const r2 = (v) => Math.round(v * 100) / 100;
      const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r2(r.x), y: r2(r.y), w: r2(r.width), h: r2(r.height), right: r2(r.right), bottom: r2(r.bottom) }; };
      const meets = (a, b) => !!a && !!b && Math.min(a.right, b.right) - Math.max(a.x, b.x) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 0.5;
      const t = box(document.querySelector('.notification-widget'));
      const rail = box(document.querySelector('.properties-tree-overlay'));
      const dock = box(document.querySelector('.jodie-window'));
      return { tip: t, rail, dock, railWidthVar: getComputedStyle(document.body).getPropertyValue('--jj-rail-width').trim(), overRail: meets(t, rail), overDock: meets(t, dock) };
    })()`) as any;
    result.tip = tip;
    note('open: quick tip', tip);
    check('open: the Quick tip is shown and meets neither the rail nor the dock', !!tip?.tip && !!tip.rail && !!tip.dock && !tip.overRail && !tip.overDock, JSON.stringify(tip));
    if (tip?.tip) await crop(page, 'quicktip_rail_dock.png', { x: tip.tip.x - 40, y: tip.tip.y - 40, w: VIEWPORT.width, h: tip.tip.h + 80 });
    const fs = await page.evaluate(FULLSCREEN) as any;
    check('open: no fullscreen / maximize button', !!fs && fs.byClass === 0 && fs.byLabel.length === 0, JSON.stringify(fs));
    // The header's actions must stay inside the window: at 460 the close button sat 47 px past the viewport edge
    // (first run of this probe). The header layout itself is S1b's (the mode switch and the model selector leave it).
    const header = await page.evaluate(String.raw`(() => {
      const win = document.querySelector('.jodie-window');
      const h = win && win.querySelector('.jodie-header');
      if (!h) return null;
      const w = win.getBoundingClientRect();
      const right = Math.max(...[...h.querySelectorAll('button')].map((b) => b.getBoundingClientRect().right));
      return { scrollWidth: h.scrollWidth, clientWidth: h.clientWidth, lastButtonRight: Math.round(right * 100) / 100, windowRight: w.right };
    })()`);
    result.header = header;
    note('open: header at 460', header);
    check('open: every header button lies inside the window (close reachable)', !!header && header.lastButtonRight <= header.windowRight + 0.5, JSON.stringify(header));

    // Crop: Jjodie beside the canvas, rail open. From 360 px left of the rail to the viewport edge, app bar to bottom.
    if (open.rail) await crop(page, 'jjodie_open_rail.png', { x: Math.max(0, open.rail.x - 360), y: 0, w: VIEWPORT.width, h: VIEWPORT.height });

    // ── Clamp: arrow keys ─────────────────────────────────────────────────────────────────────
    await page.focus('.jodie-dock-handle');
    for (let i = 0; i < 50; i++) await page.keyboard.press('ArrowLeft');
    await wait(page, 300);
    const kMax = await page.evaluate(STATE(ids.m1)) as any;
    for (let i = 0; i < 60; i++) await page.keyboard.press('ArrowRight');
    await wait(page, 300);
    const kMin = await page.evaluate(STATE(ids.m1)) as any;
    result.keys = { max: kMax.window, min: kMin.window, savedAfterKeys: kMin.dockWidth };
    note('arrow keys', { max: kMax.window?.w, maxRail: kMax.rail?.right, min: kMin.window?.w, minRail: kMin.rail?.right, saved: kMin.dockWidth });
    check('keys: ArrowLeft x50 stops at 760', near(kMax.window?.w ?? 0, 760), `${kMax.window?.w}`);
    check('keys: ArrowRight x60 stops at 420', near(kMin.window?.w ?? 0, 420), `${kMin.window?.w}`);
    check('keys: the rail follows the dock at both clamps', near(kMax.rail?.right ?? -1, kMax.window?.x ?? -2) && near(kMin.rail?.right ?? -1, kMin.window?.x ?? -2), JSON.stringify({ max: [kMax.rail?.right, kMax.window?.x], min: [kMin.rail?.right, kMin.window?.x] }));

    // ── Clamp: pointer drag ───────────────────────────────────────────────────────────────────
    await dragHandle(page, -500);
    const dMax = await page.evaluate(STATE(ids.m1)) as any;
    await dragHandle(page, 600);
    const dMin = await page.evaluate(STATE(ids.m1)) as any;
    note('drag', { max: dMax.window?.w, savedMax: dMax.dockWidth, min: dMin.window?.w, savedMin: dMin.dockWidth });
    check('drag: 500 px left stops at 760, saved on pointer-up', near(dMax.window?.w ?? 0, 760) && dMax.dockWidth === 760, JSON.stringify({ w: dMax.window?.w, saved: dMax.dockWidth }));
    check('drag: 600 px right stops at 420, saved on pointer-up', near(dMin.window?.w ?? 0, 420) && dMin.dockWidth === 420, JSON.stringify({ w: dMin.window?.w, saved: dMin.dockWidth }));
    await dragHandle(page, -180);
    const d600 = await page.evaluate(STATE(ids.m1)) as any;
    check('drag: 180 px left from 420 gives 600, saved', near(d600.window?.w ?? 0, 600) && d600.dockWidth === 600, JSON.stringify({ w: d600.window?.w, saved: d600.dockWidth }));
    check('drag: canvas shrinks by the dock width at 600', !!d600.canvas && near(closed0.canvas.w - d600.canvas.w, d600.window?.w ?? -1, 1), JSON.stringify({ before: closed0.canvas?.w, after: d600.canvas?.w, dock: d600.window?.w }));

    // ── Reload: the width persists ────────────────────────────────────────────────────────────
    phase = 'load';
    ids = await openProject(page, pid);
    check('reload: project open again', !!ids, JSON.stringify(ids));
    if (!ids) throw new Error('no reload');
    phase = 'jodie';
    check('reload: the FAB opens Jjodie', await openJodie(page), '');
    const reload = await page.evaluate(STATE(ids.m1)) as any;
    result.reload = reload;
    note('reload', { window: reload.window?.w, saved: reload.dockWidth, rail: reload.rail?.right, dockLeft: reload.window?.x });
    check('reload: dockWidth 600 persisted and applied', reload.dockWidth === 600 && near(reload.window?.w ?? 0, 600), JSON.stringify({ saved: reload.dockWidth, w: reload.window?.w }));
    check('reload: rail right edge equals the dock left edge', near(reload.rail?.right ?? -1, reload.window?.x ?? -2), JSON.stringify({ railRight: reload.rail?.right, dockLeft: reload.window?.x }));

    // Back to the default for the closed crop and the reset path: the header Reset restores 460.
    // Since S1b (P-2026-10-24-0211) Reset lives in the header's overflow menu, rendered only while open.
    await page.evaluate(CLICK(`document.querySelector('.jodie-window .jodie-overflow-btn')`));
    await wait(page, 300);
    const reset = await page.evaluate(CLICK(`document.querySelector('.jodie-window button[title*="Reset" i], .jodie-window button[aria-label*="Reset" i]')`)) as any;
    await wait(page, 600);
    const afterReset = await page.evaluate(STATE(ids.m1)) as any;
    note('reset', { found: reset.found, w: afterReset.window?.w, saved: afterReset.dockWidth });
    if (reset.found) check('reset: the header Reset restores 460 and saves it', near(afterReset.window?.w ?? 0, 460) && afterReset.dockWidth === 460, JSON.stringify({ w: afterReset.window?.w, saved: afterReset.dockWidth }));

    // ── Close ────────────────────────────────────────────────────────────────────────────────
    await page.evaluate(CLICK(`document.querySelector('.jodie-window .jodie-close-btn')`));
    await poll(page, `!document.querySelector('.jodie-window') && !!document.querySelector('.jodie-minimized')`, 5000);
    await wait(page, 800);
    const closed = await page.evaluate(STATE(ids.m1)) as any;
    result.closed = closed;
    note('closed (after)', { window: closed.window, slot: closed.slot, fab: closed.fab, canvas: closed.canvas?.w, rail: closed.rail?.right, bodyVar: closed.bodyVarComputed });
    check('closed: window unmounted, FAB shown', !closed.window && closed.fabVisible, JSON.stringify({ window: closed.window, fab: closed.fab }));
    check('closed: slot 0 px wide, body variable 0px', !!closed.slot && closed.slot.w === 0 && closed.bodyVarComputed === '0px', JSON.stringify({ slot: closed.slot, bodyVar: closed.bodyVarComputed }));
    check('closed: canvas back to its width, rail back on the viewport edge', !!closed.canvas && near(closed.canvas.w, closed0.canvas.w, 1) && near(closed.rail?.right ?? -1, closed.viewport.w), JSON.stringify({ canvas: [closed0.canvas?.w, closed.canvas?.w], rail: closed.rail?.right }));
    await crop(page, 'jjodie_closed.png', { x: Math.max(0, (open.rail?.x ?? VIEWPORT.width - 760) - 360), y: 0, w: VIEWPORT.width, h: VIEWPORT.height });
    check('closed: the FAB opens Jjodie again', await openJodie(page), '');
    const again = await page.evaluate(STATE(ids.m1)) as any;
    check('reopen: docked at 460', again.inSlot && near(again.window?.w ?? 0, 460), JSON.stringify({ inSlot: again.inSlot, w: again.window?.w }));

    result.loadErrors = loadErrors;
    result.jodieErrors = jodieErrors;
    note('console errors while the project loads (not judged)', loadErrors.length);
    for (const e of loadErrors.slice(0, 6)) console.log(`      ${e}`);
    check('console: no error since Jjodie was first opened', jodieErrors.length === 0, jodieErrors.slice(0, 6));
    await ctx.close();
} catch (e: any) {
    failures++;
    console.log(`FAIL  exception  ${e?.message ?? String(e)}`);
} finally {
    result.failures = failures;
    writeFileSync(OUT, JSON.stringify(result, null, 1));
    await browser.close();
    console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  out ${OUT}  crops ${CROPS}`);
    process.exit(failures === 0 ? 0 : 1);
}
