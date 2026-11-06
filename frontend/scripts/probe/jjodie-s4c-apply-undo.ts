/**
 * jjodie-s4c-apply-undo probe (P-2026-10-24-0256).
 *
 * Question: is a script Apply one undo step (R-JJD-6)? A three-line M1 script is previewed through
 * `JjodelEvents.SCRIPT_PREVIEW_REQUEST`, applied with the bar's Apply button, then one Cmd+Z on the
 * canvas must remove all three created objects and one redo (Cmd+Shift+Z, else Ctrl+Y) bring them back.
 *
 * Drives the real app on its own dev server (PROBE_URL, never 3000/3001/3003), 1440x900, light, with
 * the ESM fixture of `jjscript-m1-containment.ts` and a fresh M1 model opened on the canvas.
 */
import { chromium, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3013/').replace(/\/$/, '');
const FIXTURE = new globalThis.URL('./fixtures/jjscript-m1-esm.jjodel', import.meta.url).pathname;
const SCRIPT = ['create instance of State "s4cA"', 'create instance of State "s4cB"', 'create instance of Event "s4cE"'].join('\n');
const NAMES = ['s4cA', 's4cB', 's4cE'];

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 800)}`);
};
const meas = (label: string, v: unknown) => console.log(`MEAS  ${label}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 800)}`);

/** The script's objects present in the model, and the user's undo/redo lengths. */
async function read(page: Page, modelId: string): Promise<{ names: string[]; undo: number; redo: number }> {
    return page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const L = j.store.getState().idlookup;
      const modelOf = (o) => { let f = L[o.father], n = 0; while (f && f.className !== 'DModel' && n++ < 50) f = L[f.father]; return f && f.id; };
      const objs = Object.values(L).filter(d => d && d.className === 'DObject' && modelOf(d) === ${JSON.stringify(modelId)} && ${JSON.stringify(NAMES)}.includes(d.name));
      const h = window.statehistory[j.DUser.current] || { undoable: [], redoable: [] };
      return { names: objs.map(o => o.name).sort(), undo: h.undoable.length, redo: h.redoable.length };
    })()`) as any;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await seed(ctx, false);
const page: Page = await ctx.newPage();
const pageErrors: string[] = [];
const warnings: string[] = [];
page.on('pageerror', (e: Error) => pageErrors.push(e.message));
page.on('console', (m) => { if (m.type() === 'warning' && m.text().includes('[PreviewBar]')) warnings.push(m.text()); });

await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await page.waitForTimeout(5000);
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
await page.waitForTimeout(9000);

const model: any = await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const nav = await import('/src/pages/components/Navbar.tsx');
  const p = j.L.fromPointer(j.DUser.current).project;
  const before = new Set((p.models || []).map(m => m.id));
  nav.createM1(p, p.metamodels[0], false);
  for (let i = 0; i < 50; i++) {
    await new Promise(r => setTimeout(r, 100));
    const m = (j.L.fromPointer(j.DUser.current).project.models || []).find(m => !before.has(m.id) && !m.isMetamodel);
    if (m) return { id: m.id, name: m.name };
  }
  return null;
})()`);
check('M1 model created', !!model, model);
await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const dm = await import('/src/components/abstract/DockManager.tsx');
  await dm.default.open2(j.L.fromPointer(${JSON.stringify(model.id)}));
})()`);
await page.waitForTimeout(6000);
// A user click: the reducer keeps no undo entry before the first interaction (`isRelevantChangeCheck`).
await page.locator('.react-flow__pane').first().click({ position: { x: 600, y: 500 } });
await page.waitForTimeout(800);

const s0 = await read(page, model.id);
meas('before preview', s0);

await page.evaluate(`window.dispatchEvent(new CustomEvent('jjodel:script-preview-request', { detail: { script: ${JSON.stringify(SCRIPT)}, modelId: ${JSON.stringify(model.id)} } }))`);
const bar = page.locator('.jj-preview-bar');
await bar.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);
const barText = (await bar.count()) ? (await bar.innerText()).replace(/\s+/g, ' ') : '';
check('preview bar shows +3 objects', /\+3 objects/.test(barText), barText);

await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  window.__s4cApply = [];
  const t0 = performance.now();
  let lastState = null;
  const tick = () => {
    const st = j.store.getState();
    const h = window.statehistory[j.DUser.current] || { undoable: [], redoable: [] };
    const bar = !!document.querySelector('.jj-preview-bar');
    const row = 'u' + h.undoable.length + (bar ? ' bar' : '');
    const last = window.__s4cApply[window.__s4cApply.length - 1];
    if (st !== lastState) { lastState = st; window.__s4cApply.push({ t: Math.round(performance.now() - t0), row: row + ' state' }); }
    else if (!last || !last.row.startsWith(row)) window.__s4cApply.push({ t: Math.round(performance.now() - t0), row });
    if (performance.now() - t0 < 6000) setTimeout(tick, 20);
  };
  tick();
})()`);
const t0 = Date.now();
await bar.locator('button', { hasText: 'Apply' }).click();
await bar.waitFor({ state: 'detached', timeout: 20000 }).catch(() => undefined);
meas('apply ms (click to bar gone)', Date.now() - t0);
await page.waitForTimeout(1500);
const s1 = await read(page, model.id);
await page.waitForTimeout(4000);
meas('timeline from Apply click', await page.evaluate('window.__s4cApply'));
meas('after apply', s1);
check('apply created the three objects', s1.names.join(',') === NAMES.slice().sort().join(','), s1.names);
check('apply added exactly one undo entry', s1.undo === s0.undo + 1, { before: s0.undo, after: s1.undo });
check('no planned/real mismatch warning', warnings.length === 0, warnings);

/** What the top undo entry holds: its top keys, and what it restores for each created object. */
const ENTRY = (modelId: string) => `(async () => {
  const j = await import('/src/joiner/index.ts');
  const L = j.store.getState().idlookup;
  const h = window.statehistory[j.DUser.current];
  const e = h.undoable[h.undoable.length - 1];
  if (!e) return null;
  const ids = Object.values(L).filter(d => d && d.className === 'DObject' && ${JSON.stringify(NAMES)}.includes(d.name)).map(d => d.id);
  return { keys: Object.keys(e).slice(0, 30), idlookupKeys: Object.keys(e.idlookup || {}).length,
    created: ids.map(id => [L[id].name, typeof (e.idlookup || {})[id], String((e.idlookup || {})[id]).slice(0, 40)]),
    model: JSON.stringify((e.idlookup || {})[${JSON.stringify(modelId)}] || null).slice(0, 300),
    all: window.statehistory.all.undoable.length, users: Object.keys(window.statehistory) };
})()`;
meas('top entry after apply', await page.evaluate(ENTRY(model.id)));

/** Focus the canvas (the `.editor-v2` element carries the key handler) without a click on the pane. */
const focusCanvas = () => page.evaluate(`document.querySelector('.editor-v2').focus()`);
/** The top undo entry: its keys, and the class of the first elements it touches. */
const topEntry = () => page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const h = window.statehistory[j.DUser.current];
  const e = h.undoable[h.undoable.length - 1];
  const L = j.store.getState().idlookup;
  return e ? { n: h.undoable.length, keys: Object.keys(e), title: e.action_title,
    idl: Object.keys(e.idlookup || {}).slice(0, 4).map(k => [L[k] ? L[k].className : 'gone', Object.keys(e.idlookup[k] || {}).slice(0, 3)]) } : null;
})()`);

// Case A: Apply, then Cmd+Z with the canvas focused and no click in between.
await focusCanvas();
await page.waitForTimeout(400);
const sA = await read(page, model.id);
check('nothing pushed between Apply and Cmd+Z', sA.undo === s1.undo, { afterApply: s1.undo, beforeUndo: sA.undo });
await page.keyboard.press('Meta+z');
await page.waitForTimeout(2500);
const s2 = await read(page, model.id);
meas('A: after one Cmd+Z', s2);
check('A: one Cmd+Z removes all three objects', s2.names.length === 0, s2.names);
check('A: the Apply entry moved to the redo stack', s2.undo === s1.undo - 1 && s2.redo === 1, { undo: s2.undo, redo: s2.redo });

await focusCanvas();
await page.keyboard.press('Meta+Shift+z');
await page.waitForTimeout(2500);
let s3 = await read(page, model.id);
meas('A: after one Cmd+Shift+Z', s3);
let redoKey = 'Cmd+Shift+Z';
if (s3.names.length === 0) {
    await page.keyboard.press('Control+y');
    await page.waitForTimeout(2500);
    s3 = await read(page, model.id);
    redoKey = 'Ctrl+Y';
    meas('A: after one Ctrl+Y', s3);
}
check(`A: one redo (${redoKey}) brings the three objects back`, s3.names.join(',') === NAMES.slice().sort().join(','), s3.names);

// Case B (measured, not asserted): a click on the pane after Apply pushes an entry of its own.
await page.locator('.react-flow__pane').first().click({ position: { x: 300, y: 700 } });
await page.waitForTimeout(1500);
meas('B: undo length before/after a pane click', { before: s3.undo, after: (await read(page, model.id)).undo });
meas('B: top entry after the pane click', await topEntry());
meas('page errors', pageErrors.slice(0, 5));
console.log(failures ? `PROBE: ${failures} FAIL` : 'PROBE: ALL PASS');
await browser.close();
process.exit(failures ? 1 : 0);
