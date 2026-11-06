/**
 * jjodie-udo-after-apply probe (P-2026-10-24-0657, read-only discovery).
 *
 * Question: which writer pushes the extra undo entry `Create element` (only `pointedBy` on the new DVertex)
 * that a canvas click adds after a script Apply (ticket of `jjodie-ui-s4c.md`), and does a single creation
 * made outside an Apply show the same?
 *
 * Every action dispatched to the store is recorded with its sub-actions (field, value) and the stack the
 * action captured at construction (`Action.stack`, `action.ts:309`), plus the user's undo length after it.
 * Case 1: Apply of a three-line script, wait, one pane click. Case 2: one `create instance` line run
 * through `JjScriptService.execute` outside any undo group (the code block's Run path), wait, one pane click.
 * Case 3: case 1 again, but the click comes 300 ms after the bar is gone instead of seconds later.
 *
 * Drives the real app on its own dev server (PROBE_URL, never 3000/3001/3003), 1440x900, light, with
 * the ESM fixture of `jjscript-m1-containment.ts` and a fresh M1 model opened on the canvas.
 */
import { chromium, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3014/').replace(/\/$/, '');
const FIXTURE = new globalThis.URL('./fixtures/jjscript-m1-esm.jjodel', import.meta.url).pathname;
const meas = (label: string, v: unknown) => console.log(`MEAS  ${label}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 4000)}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await seed(ctx, false);
const page: Page = await ctx.newPage();
const pageErrors: string[] = [];
page.on('pageerror', (e: Error) => pageErrors.push(e.message));

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
meas('fixture imported', String(pid));
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
    if (m) return { id: m.id, name: m.name, mm: m.instanceof && m.instanceof.id };
  }
  return null;
})()`);
meas('M1 model', model);
await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const dm = await import('/src/components/abstract/DockManager.tsx');
  await dm.default.open2(j.L.fromPointer(${JSON.stringify(model.id)}));
})()`);
await page.waitForTimeout(6000);
await page.locator('.react-flow__pane').first().click({ position: { x: 600, y: 500 } });
await page.waitForTimeout(800);

// The dispatch recorder: one row per dispatched action, sub-actions summarised, stacks kept for pointedBy writes.
await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const st = j.store;
  const orig = st.dispatch.bind(st);
  window.__udo = { rows: [], t0: performance.now() };
  const short = (v) => { try { return (typeof v === 'string' ? v : JSON.stringify(v)).slice(0, 90); } catch (e) { return String(v).slice(0, 90); } };
  const frames = (s) => (s || []).map(f => f.trim().replace(/^at /, '').replace(/https?:\\/\\/[^/]+\\/src\\//, '').replace(/\\?[^:)]*/, '')).slice(0, 14);
  // DVertex tracker: identity, own-ness and pointedBy of every vertex, compared before and after each dispatch.
  const refId = new WeakMap(); let nextRef = 1;
  const rid = (o) => { if (!refId.has(o)) refId.set(o, nextRef++); return refId.get(o); };
  let last = {};
  const vsnap = () => {
    const L = st.getState().idlookup; const out = {};
    for (const k in L) { const d = L[k]; if (!d || d.className !== 'DVertex') continue;
      out[k] = { ref: rid(d), own: Object.prototype.hasOwnProperty.call(L, k), pb: (d.pointedBy || []).map(p => p && p.source) }; }
    return out;
  };
  const vdiff = (a, b) => { const ch = [];
    for (const k in b) { const x = a[k], y = b[k];
      if (!x) { ch.push({ id: k.slice(-12), new: true, ref: y.ref, own: y.own, pb: y.pb }); continue; }
      if (x.ref !== y.ref || x.pb.length !== y.pb.length || x.own !== y.own) ch.push({ id: k.slice(-12), ref: x.ref + '->' + y.ref, own: x.own + '->' + y.own, pb: x.pb.length + '->' + y.pb.length, added: y.pb.filter(s => !x.pb.includes(s)), pbAfter: y.pb }); }
    return ch; };
  last = vsnap();
  st.dispatch = (a) => {
    const pre = vsnap(); const between = vdiff(last, pre);
    const pend = () => (j.PendingPointedByPaths.all || []).map(p => p.from + ' -> ' + String(p.holder).slice(-12));
    const pend0 = pend();
    const subs = a && a.actions ? a.actions : [a];
    const h0 = window.statehistory[j.DUser.current];
    const u0 = h0 ? h0.undoable.length : -1;
    const top0 = h0 ? h0.undoable[h0.undoable.length - 1] : null;
    const r = orig(a);
    const h = window.statehistory[j.DUser.current];
    const u1 = h ? h.undoable.length : -1;
    const top1 = h ? h.undoable[h.undoable.length - 1] : null;
    const pb = subs.filter(s => s && String(s.field || '').includes('pointedBy'));
    const post = vsnap(); const during = vdiff(pre, post); last = post;
    window.__udo.rows.push({
      pendingBefore: pend0, pendingAfter: pend(),
      vertexStack: subs.some(s => s && s.value && s.value.className === 'DVertex' && /CreateElement/.test(s.className || s.type)) ? frames(a && a.stack) : undefined,
      vBetween: between, vDuring: during,
      t: Math.round(performance.now() - window.__udo.t0), type: a && a.type, title: a && a.descriptor && a.descriptor.path,
      n: subs.length, undo: u0 + '->' + u1, merged: u0 === u1 && top0 !== null && top0 === top1 && u0 > 0 ? 'maybe' : '',
      subs: subs.slice(0, 8).map(s => (s.className || s.type) + ' ' + short(s.field) + ' ' + (s.accessModifier || '') + ' ' + short(s.value && s.value.className ? s.value.className + ':' + s.value.id : s.value)),
      pb: pb.slice(0, 4).map(s => ({ field: short(s.field), value: short(s.value), stack: frames(s.stack) })),
      stack: frames(a && a.stack).slice(0, 10),
    });
    return r;
  };
})()`);

const mark = (label: string) => page.evaluate(`(() => { window.__udo.rows.push({ t: Math.round(performance.now() - window.__udo.t0), mark: ${JSON.stringify(label)} }); return window.__udo.rows.length; })()`) as Promise<number>;
const rowsFrom = (i: number) => page.evaluate(`window.__udo.rows.slice(${i})`) as Promise<any[]>;

/** The created objects, their DVertex and the vertex pointedBy, and the user's undo lengths. */
const snap = (names: string[]) => page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const L = j.store.getState().idlookup;
  const objs = Object.values(L).filter(d => d && d.className === 'DObject' && ${JSON.stringify(names)}.includes(d.name));
  const vtx = Object.values(L).filter(d => d && /Vertex/.test(d.className) && objs.some(o => o.id === d.data));
  const h = window.statehistory[j.DUser.current] || { undoable: [], redoable: [] };
  return { objs: objs.map(o => o.name + ':' + o.id), vertices: vtx.map(v => ({ id: v.id, cls: v.className, data: L[v.data] && L[v.data].name, pointedBy: (v.pointedBy || []).map(p => p.source) })),
    undo: h.undoable.length, redo: h.redoable.length };
})()`) as Promise<any>;

/** The top undo entry: title and, per touched element, its class and the keys it restores. */
const topEntry = () => page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const h = window.statehistory[j.DUser.current];
  const e = h.undoable[h.undoable.length - 1];
  const L = j.store.getState().idlookup;
  if (!e) return null;
  return { n: h.undoable.length, title: e.action_title, keys: Object.keys(e),
    idl: Object.keys(e.idlookup || {}).slice(0, 12).map(k => [L[k] ? L[k].className + (L[k].data && L[L[k].data] ? '(' + L[L[k].data].name + ')' : '') : 'gone:' + k, Object.keys(e.idlookup[k] || {}).slice(0, 6), JSON.stringify(e.idlookup[k]).slice(0, 160)]) };
})()`);

const printRows = (label: string, rows: any[]) => {
    meas(`${label}: dispatched actions`, rows.length);
    for (const r of rows) {
        const { vertexStack, pendingBefore, pendingAfter, vBetween, vDuring, ...rest } = r;
        console.log(`ROW   ${label}  ${JSON.stringify(rest).slice(0, 1200)}`);
        if (r.mark) continue;
        console.log(`PEND  ${label}  t=${r.t}  ${JSON.stringify({ before: pendingBefore, after: pendingAfter })}`);
        console.log(`VTX   ${label}  t=${r.t}  ${JSON.stringify({ between: vBetween, during: vDuring }).slice(0, 1500)}`);
        if (vertexStack) console.log(`STACK ${label}  t=${r.t}  ${JSON.stringify(vertexStack)}`);
    }
};

async function applyCase(label: string, script: string, names: string[], clickDelayMs: number, clickPos: { x: number; y: number }) {
    await page.evaluate(`window.dispatchEvent(new CustomEvent('jjodel:script-preview-request', { detail: { script: ${JSON.stringify(script)}, modelId: ${JSON.stringify(model.id)} } }))`);
    const bar = page.locator('.jj-preview-bar');
    await bar.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);
    const s0 = await snap(names);
    meas(`${label}: before apply`, s0);
    const i0 = await mark(`${label} apply click`);
    await bar.locator('button', { hasText: 'Apply' }).click();
    await bar.waitFor({ state: 'detached', timeout: 20000 }).catch(() => undefined);
    await mark(`${label} bar gone`);
    await page.waitForTimeout(clickDelayMs);
    const s1 = await snap(names);
    meas(`${label}: after apply, before click`, s1);
    meas(`${label}: top entry after apply`, await topEntry());
    const i1 = await mark(`${label} pane click`);
    printRows(`${label} apply`, await rowsFrom(i0));
    await page.locator('.react-flow__pane').first().click({ position: clickPos });
    await page.waitForTimeout(2000);
    const s2 = await snap(names);
    meas(`${label}: after click`, s2);
    meas(`${label}: undo before/after click`, { before: s1.undo, after: s2.undo });
    meas(`${label}: top entry after click`, await topEntry());
    printRows(`${label} click`, await rowsFrom(i1));
}

// Case 1: Apply, wait 4 s, click.
await applyCase('C1', ['create instance of State "u1A"', 'create instance of State "u1B"', 'create instance of Event "u1E"'].join('\n'), ['u1A', 'u1B', 'u1E'], 4000, { x: 300, y: 700 });

// Case 2: one creation outside any Apply (the code block's Run path), wait 4 s, click.
{
    const names = ['u2M'];
    const s0 = await snap(names);
    meas('C2: before run', s0);
    const i0 = await mark('C2 run');
    const res = await page.evaluate(`(async () => {
      const js = await import('/src/jjscript/index.ts');
      const r = await js.JjScriptService.execute('create instance of State "u2M"', { level: 'M1', metamodelId: ${JSON.stringify(model.mm)}, modelId: ${JSON.stringify(model.id)} });
      return { success: r && r.success, message: r && r.message };
    })()`);
    meas('C2: run result', res);
    await page.waitForTimeout(4000);
    const s1 = await snap(names);
    meas('C2: after run, before click', s1);
    meas('C2: top entry after run', await topEntry());
    const i1 = await mark('C2 pane click');
    printRows('C2 run', await rowsFrom(i0));
    await page.locator('.react-flow__pane').first().click({ position: { x: 320, y: 720 } });
    await page.waitForTimeout(2000);
    const s2 = await snap(names);
    meas('C2: after click', s2);
    meas('C2: undo before/after run/click', { beforeRun: s0.undo, afterRun: s1.undo, afterClick: s2.undo });
    meas('C2: top entry after click', await topEntry());
    printRows('C2 click', await rowsFrom(i1));
}

// Case 3: Apply, click 300 ms after the bar is gone.
await applyCase('C3', ['create instance of State "u3A"', 'create instance of Event "u3E"'].join('\n'), ['u3A', 'u3E'], 300, { x: 340, y: 740 });

meas('page errors', pageErrors.slice(0, 5));
console.log('PROBE: DONE');
await browser.close();
process.exit(0);
