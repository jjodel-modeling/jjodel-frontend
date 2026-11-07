/**
 * open-viewport probe (ticket #419, P-2026-11-02-1856; draft of P-2026-11-02-0646 Phase 1).
 *
 * Opens the harness model and checks that the canvas lands on at least one node in the visible part of the pane
 * (DOM rects, the pane minus the overlay inset on the right):
 *   - per viewpoint (OV_VPS, default `-` and `Harness / Lane process (BPMN)`), OV_RUNS fresh opens, each in view,
 *     all on the same transform; the BPMN one on today's `(-1197.5, -1107, 0.5)`;
 *   - the first run of each viewpoint reloads and reopens (the restore path), in view;
 *   - "stored empty": the Phase 1 empty viewport written as the stored one before the first open, in view;
 *   - after the toolbar's auto layout (button `title="Auto layout"`), started from the empty viewport, in view;
 *   - a per-rAF sampler counts the frames painted with no node in view after the first panZoom.setViewport of an
 *     open (the fit), that is between the fit and its fallback; at most one. Its positive control paints the empty
 *     viewport on purpose and must count it.
 * Every panZoom.setViewport call is recorded with its time and duration. Read-only on the project it imports.
 * Env: OV_ONLY (comma list: opens, stored; default both), OV_VPS, OV_RUNS, OV_FIXTURE, OV_LAYOUT_CAP_MS.
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3073/').replace(/\/$/, '');
if (/:300[01]$/.test(URL)) throw new Error('never 3000 or 3001');
const FIXTURE = process.env.OV_FIXTURE || `${process.env.HOME}/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`;
const VPS = (process.env.OV_VPS || '-|Harness / Lane process (BPMN)').split('|');
const RUNS = Number(process.env.OV_RUNS || 3);
const BPMN = 'Harness / Lane process (BPMN)';
const BPMN_TRANSFORM = [-1197.5, -1107, 0.5];
const STORED_EMPTY = { x: -1223.5, y: -9802, zoom: 0.5 };
const MAX_EMPTY_FRAMES = 1;
const ONLY = (process.env.OV_ONLY || 'opens,stored').split(',').filter(Boolean);
const LAYOUT_CAP_MS = Number(process.env.OV_LAYOUT_CAP_MS || 600000);   // the full ELK layout measured 382 s
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../.vite-cache/open-viewport.json');
mkdirSync(dirname(OUT), { recursive: true });

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
    if (ok) pass++; else fail++;
};
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v).slice(0, 3000)}`);

const PANE_SEL = (modelId: string) => `[role="tabpanel"][aria-labelledby$="-tab-${modelId}"]`;

// The in-view count runs in the page, on DOM rects: the react-flow box minus the overlay inset on its right.
const IN_VIEW_FN = `(rf) => {
    const box = rf.getBoundingClientRect();
    const inset = parseFloat(document.body.style.getPropertyValue('--jj-canvas-right-inset')) || 0;
    let k = 0;
    for (const el of rf.querySelectorAll('.react-flow__node')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > box.left && r.left < box.right - inset && r.bottom > box.top && r.top < box.bottom) k++;
    }
    return k;
  }`;

const SAMPLER = (modelId: string) => `(() => {
  const inViewDom = ${IN_VIEW_FN};
  const S = window.__ov = { t0: performance.now(), frames: [], calls: [], last: '', store: null, wrapped: false, on: true };
  const findStore = (rf) => {
    const fk = Object.keys(rf).find(k => k.startsWith('__reactFiber$'));
    for (let f = fk ? rf[fk] : null; f; f = f.return) {
      const v = f.memoizedProps && f.memoizedProps.value;
      if (v && typeof v.getState === 'function' && v.getState().nodeLookup) return v;
    }
    return null;
  };
  const frame = () => {
    if (!S.on) return;
    const pane = document.querySelector('${PANE_SEL(modelId)}');
    const rf = pane && pane.querySelector('.react-flow');
    if (rf) {
      if (!S.store) S.store = findStore(rf);
      const store = S.store;
      if (store && !S.wrapped && store.getState().panZoom) {
        const pz = store.getState().panZoom, o = pz.setViewport;
        pz.setViewport = function (v, opts) {
          S.calls.push({ t: performance.now() - S.t0, v: { x: +v.x.toFixed(2), y: +v.y.toFixed(2), zoom: +(+v.zoom).toFixed(4) }, dur: opts && opts.duration });
          return o.apply(this, arguments);
        };
        S.wrapped = true;
      }
      const vp = rf.querySelector('.react-flow__viewport');
      S.last = vp ? vp.style.transform : '';
      S.frames.push({ t: performance.now() - S.t0, tr: S.last, dom: rf.querySelectorAll('.react-flow__node').length, inView: inViewDom(rf) });
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return 'sampler on';
})()`;

const COLLECT = (modelId: string) => `(() => {
  const inViewDom = ${IN_VIEW_FN};
  const S = window.__ov; S.on = false;
  const pane = document.querySelector('${PANE_SEL(modelId)}');
  const rf = pane && pane.querySelector('.react-flow');
  if (!rf || !S.store) return { error: 'no canvas or store', frames: S.frames.length };
  const s = S.store.getState();
  const [tx, ty, tz] = s.transform;
  const fitT = S.calls.length ? S.calls[0].t : null;
  const after = fitT === null ? [] : S.frames.filter(f => f.t >= fitT);
  return {
    transform: [tx, ty, tz], pane: [s.width, s.height], minZoom: s.minZoom,
    inset: document.body.style.getPropertyValue('--jj-canvas-right-inset'),
    nodes: s.nodeLookup.size, inViewDom: inViewDom(rf),
    calls: S.calls.map(c => ({ t: Math.round(c.t), v: c.v, dur: c.dur })),
    frames: S.frames.length, framesAfterFit: after.length, emptyFrames: after.filter(f => f.inView === 0).length,
    stored: Object.keys(localStorage).filter(k => k.startsWith('jjodel.viewport.')).map(k => [k.slice(-32), localStorage.getItem(k)]),
  };
})()`;

const OPEN = (vpName: string) => `(async () => {
  const L = window.store.getState().idlookup;
  const m = Object.values(L).find(d => d && d.className === 'DModel' && !d.isMetamodel);
  if (!m) return { error: 'no model' };
  const vp = ${JSON.stringify(vpName)} === '-' ? null : Object.values(L).find(d => d && d.className === 'DViewPoint' && d.name === ${JSON.stringify(vpName)});
  if (${JSON.stringify(vpName)} !== '-' && !vp) return { error: 'no viewpoint' };
  const j = await import('/src/joiner/index.ts');
  const dm = await import('/src/components/abstract/DockManager.tsx');
  const lv = await import('/src/utils/lastViewpoint.ts');
  lv.activateViewpoint(vp ? vp.id : null);
  await dm.default.open2(j.LModel.fromPointer(m.id));
  return { model: m.name, id: m.id, vp: vp ? vp.name : null };
})()`;

const MODEL_ID = `(() => { const L = window.store.getState().idlookup; const m = Object.values(L).find(d => d && d.className === 'DModel' && !d.isMetamodel); return m ? m.id : null; })()`;

async function settleTransform(page: Page, quietMs: number, capMs: number): Promise<number> {
    const t0 = Date.now();
    let last = '', since = Date.now();
    for (;;) {
        await page.waitForTimeout(250);
        const tr = await page.evaluate(`window.__ov ? window.__ov.last + '|' + window.__ov.calls.length : ''`) as string;
        if (tr !== last) { last = tr; since = Date.now(); }
        if (Date.now() - since >= quietMs) return Date.now() - t0;
        if (Date.now() - t0 > capMs) return -1;
    }
}

/** A fresh context with the harness project imported; null when the import fails. */
async function freshProject(browser: Browser): Promise<{ page: Page; close: () => Promise<void>; pid: string } | null> {
    const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
    await seed(ctx, false);
    const page = await ctx.newPage();
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForTimeout(5000);
    const text = readFileSync(FIXTURE, 'utf8');
    const pid = await page.evaluate(`(async () => {
      const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
      const before = count();
      await window.ProjectsApi.importFromText(${JSON.stringify(text)});
      for (let i = 0; i < 150 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
      const a = JSON.parse(localStorage.getItem('projects') || '[]');
      return a.length > before ? a[a.length - 1].id : null;
    })()`) as string | null;
    if (!pid) { await ctx.close(); return null; }
    return { page, close: () => ctx.close(), pid };
}

/** Navigate to the project (reload when asked), optionally store a viewport, open the model, settle, collect. */
async function openAndCollect(page: Page, pid: string, vpName: string, opts: { reload?: boolean; storeViewport?: object } = {}): Promise<any> {
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    if (opts.reload) await page.reload({ waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForTimeout(10000);
    const mid = await page.evaluate(MODEL_ID) as string | null;
    if (opts.storeViewport && mid) {
        await page.evaluate(`localStorage.setItem(${JSON.stringify(`jjodel.viewport.${mid}.__abstract__`)}, ${JSON.stringify(JSON.stringify(opts.storeViewport))})`);
    }
    await page.evaluate(SAMPLER(mid || ''));
    const opened = await page.evaluate(OPEN(vpName));
    await page.waitForTimeout(8000);
    const settledMs = await settleTransform(page, 4000, 90000);
    const r: any = await page.evaluate(COLLECT(mid || ''));
    return Object.assign(r, { mid, opened, settledMs });
}

const same = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 0.01);
const brief = (r: any) => ({ transform: r.transform, inViewDom: r.inViewDom, nodes: r.nodes, emptyFrames: r.emptyFrames, calls: r.calls, settledMs: r.settledMs, error: r.error });

const browser = await chromium.launch();
const results: any[] = [];
try {
    for (const vpName of ONLY.includes('opens') ? VPS : []) {
        const transforms: number[][] = [];
        for (let run = 1; run <= RUNS; run++) {
            const fp = await freshProject(browser);
            if (!fp) { check(`import vp=${vpName} run=${run}`, false, 'import failed'); continue; }
            const r = await openAndCollect(fp.page, fp.pid, vpName);
            results.push({ vp: vpName, run, pass: 1, ...r });
            meas(`open vp=${vpName} run=${run}`, brief(r));
            check(`in view vp=${vpName} run=${run}`, r.inViewDom >= 1, brief(r));
            check(`one-frame empty paint vp=${vpName} run=${run}`, r.emptyFrames <= MAX_EMPTY_FRAMES, { emptyFrames: r.emptyFrames, framesAfterFit: r.framesAfterFit, max: MAX_EMPTY_FRAMES });
            if (r.transform) transforms.push(r.transform);
            if (run === 1) {
                const re = await openAndCollect(fp.page, fp.pid, vpName, { reload: true });
                results.push({ vp: vpName, run, pass: 2, ...re });
                meas(`reopen vp=${vpName}`, { ...brief(re), stored: re.stored, firstOpen: r.transform });
                check(`reload and reopen in view vp=${vpName}`, re.inViewDom >= 1, brief(re));
            }
            await fp.close();
            writeFileSync(OUT, JSON.stringify(results, null, 1));
        }
        check(`same transform over ${RUNS} fresh opens vp=${vpName}`, transforms.length === RUNS && transforms.every(t => same(t, transforms[0])), transforms);
        if (vpName === BPMN) check(`BPMN open transform unchanged`, transforms.length > 0 && transforms.every(t => same(t, BPMN_TRANSFORM)), { want: BPMN_TRANSFORM, got: transforms });
    }

    // Stored empty: the Phase 1 empty viewport as the stored one, then the toolbar layout on the same canvas.
    const fp = ONLY.includes('stored') ? await freshProject(browser) : undefined;
    if (fp === null) check('import stored-empty', false, 'import failed');
    else if (fp) {
        const r = await openAndCollect(fp.page, fp.pid, '-', { storeViewport: STORED_EMPTY });
        results.push({ vp: '-', scenario: 'stored-empty', ...r });
        check('stored empty viewport: open in view', r.inViewDom >= 1, { ...brief(r), stored: STORED_EMPTY });
        // Positive control of the empty-frame counter: the Phase 1 empty viewport, painted on purpose for a second.
        await fp.page.evaluate(SAMPLER(r.mid || ''));
        await fp.page.waitForTimeout(500);
        await fp.page.evaluate(`window.__ov.store.getState().panZoom.setViewport(${JSON.stringify(STORED_EMPTY)})`);
        await fp.page.waitForTimeout(1000);
        const c: any = await fp.page.evaluate(COLLECT(r.mid || ''));
        check('counter control: a viewport painted empty on purpose is counted', c.emptyFrames > 0, { emptyFrames: c.emptyFrames, framesAfterFit: c.framesAfterFit, inViewDom: c.inViewDom, transform: c.transform });
        await fp.page.evaluate(SAMPLER(r.mid || ''));
        const pane = fp.page.locator(`${PANE_SEL(r.mid || '')} button[title="Auto layout"]`);
        const button = (await pane.count()) > 0 ? pane.first() : fp.page.locator('button[title="Auto layout"]').first();
        // The handler holds the main thread through the full ELK layout: click from the page, not awaited.
        const clicked = await button.evaluate((b) => { setTimeout(() => (b as HTMLButtonElement).click(), 0); return true; }).catch((e) => { meas('auto layout click failed', String(e)); return false; });
        const t0 = Date.now();
        const fitted = await fp.page.waitForFunction('window.__ov && window.__ov.calls.length > 0', undefined, { timeout: LAYOUT_CAP_MS, polling: 500 })
            .then(() => true, () => false);
        const layoutMs = Date.now() - t0;
        const settledMs = await settleTransform(fp.page, 4000, 60000);
        const l: any = await fp.page.evaluate(COLLECT(r.mid || ''));
        Object.assign(l, { settledMs, layoutMs });
        results.push({ vp: '-', scenario: 'toolbar-layout', ...l });
        check('after the toolbar auto layout: in view', clicked && fitted && l.inViewDom >= 1, { clicked, fitted, layoutMs, ...brief(l) });
        await fp.close();
    }
} finally {
    writeFileSync(OUT, JSON.stringify(results, null, 1));
    meas('json', OUT);
    await browser.close();
}
console.log(`DONE pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
