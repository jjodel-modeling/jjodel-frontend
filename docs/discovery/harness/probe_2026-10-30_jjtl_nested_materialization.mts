/**
 * jjtl-nested-materialization probe, Phase 1 (P-2026-10-30-1335). Read-only on the code: it measures.
 *
 * Question (prompt, Phase 1 item 2): after `slot.addObject(...)` returns inside STEP 6c of
 * `handleExecuteTransformation`, is the created child's `$<feature>` slot available synchronously, and does
 * it accept a further `addObject`? Plus what the recursion would meet: the sibling-name gate of
 * `get_addObject` (R-S1-2) on two children sharing a name in one slot, a class with no `name` attribute,
 * whether the id `addObject` returns is the store id, an attribute written by that id on the deferred
 * timer, and how many undo entries each step pushes.
 *
 * Neutral fixture, seeded at M2 by JjScript: Root(name) .nodes 0..* Node; Node(name, label) .kids 0..* Node,
 * .leaves 0..* Leaf; Leaf(value: EInt, no name) .subs 0..* Node. Roots are created as STEP 6 creates them
 * (`DObject.new(cls, model, DModel, name, true)` inside a TRANSACTION); everything nested goes through
 * `LValue.addObject`, the call STEP 6c makes, from inside a setTimeout as STEP 6c runs.
 *
 * Run:  node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/smoke/_tmp_jjtl_nested_probe.ts \
 *         --port 3135 --id P-2026-10-30-1335
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3135/').replace(/\/$/, '');
if (/:3001$/.test(URL)) throw new Error('never 3001');
const OUT = process.env.JNM_OUT || `${process.env.HOME}/.jjodel-lanes/P-2026-10-30-1335/probe_phase1.json`;

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 1500)}`);
};
const meas = (label: string, v: unknown) => console.log(`MEAS  ${label}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 6000)}`);

const TREE_MM = [
    'create class Root',
    'create class Node',
    'create class Leaf',
    'create attribute name in Root type EString',
    'create attribute name in Node type EString',
    'create attribute label in Node type EString',
    'create attribute value in Leaf type EInt',
    'create composition nodes in Root type Node [0..*]',
    'create composition kids in Node type Node [0..*]',
    'create composition leaves in Node type Leaf [0..*]',
    'create composition subs in Leaf type Node [0..*]',
];

/** In-page helpers, prepended to every experiment. `slotInfo` reads a slot without writing it. */
const HELPERS = `
  const j = await import('/src/joiner/index.ts');
  const undoLen = () => (j.statehistory[j.DUser.current] && j.statehistory[j.DUser.current].undoable.length) || 0;
  const inStore = (id) => !!(id && j.store.getState().idlookup[id]);
  const slotInfo = (o, f) => {
    try {
      if (!o) return { obj: 'none' };
      const s = o['$' + f];
      return { objId: o.id, objInStore: inStore(o.id), slot: typeof s, slotClass: s && s.className, slotId: s && s.id,
               slotInStore: inStore(s && s.id), addObject: typeof (s && s.addObject) };
    } catch (e) { return { threw: String(e && e.message || e) }; }
  };
  const add = (o, f, json, cls) => {
    try {
      const s = o && o['$' + f];
      if (!s || typeof s.addObject !== 'function') return { ok: false, why: 'no slot', slot: typeof s };
      const c = s.addObject(json, cls);
      return { ok: !!(c && c.id), id: c && c.id, obj: c };
    } catch (e) { return { ok: false, threw: String(e && e.message || e) }; }
  };
  const strip = (r) => { const { obj, ...rest } = r || {}; return rest; };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  // Polls a fresh proxy every 10 ms until its slot answers addObject; ms counted from t0.
  const waitSlot = async (id, f, t0, max = 4000) => {
    while (performance.now() - t0 < max) {
      const o = id && j.L.fromPointer(id);
      const s = o && o['$' + f];
      if (s && typeof s.addObject === 'function') return Math.round(performance.now() - t0);
      await sleep(10);
    }
    return -1;
  };
  const toastText = () => [...document.querySelectorAll('[class*="toast"], [role="alert"], [role="status"]')].map(e => e.textContent.trim()).filter(Boolean).slice(-6);
`;

/** Every DObject of the model, with where it sits: `name:Class @owner.slot|root [nameSlot=..]`. */
const READ_TREE = (modelId: string) => `(async () => {
  ${HELPERS}
  const lm = j.L.fromPointer(${JSON.stringify(modelId)});
  const idl = j.store.getState().idlookup;
  const all = lm.allSubObjects || [];
  return all.map(o => {
    const d = idl[o.id] || {};
    const f = idl[d.father] || {};
    let where = 'root';
    if (f.className === 'DValue') where = ((idl[f.father] || {}).name || '?') + '.' + (f.name || (idl[f.instanceof] || {}).name || '?');
    else if (f.className !== 'DModel') where = String(f.className);
    let nameSlot, label, value;
    try { nameSlot = o.$name ? o.$name.value : '(none)'; } catch (e) { nameSlot = 'threw'; }
    try { label = o.$label ? o.$label.value : undefined; } catch (e) {}
    try { value = o.$value ? o.$value.value : undefined; } catch (e) {}
    return { id: o.id, name: d.name, cls: (idl[d.instanceof] || {}).name, where, nameSlot, label, value };
  });
})()`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await seed(ctx, false);
const page: Page = await ctx.newPage();
const pageErrors: string[] = [];
const consoleLog: Array<{ t: string; text: string }> = [];
page.on('pageerror', (e: Error) => pageErrors.push(e.message));
page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warning' || (t === 'log' && m.text().startsWith('[PROBE]'))) consoleLog.push({ t, text: m.text().slice(0, 400) });
});
const result: any = { url: URL, experiments: {} };
const save = () => { mkdirSync(dirname(OUT), { recursive: true }); writeFileSync(OUT, JSON.stringify(result, null, 1)); };
/** The console lines between two [PROBE] markers. */
const consoleSince = (n: number) => consoleLog.slice(n).filter(l => !l.text.startsWith('[PROBE]'));

await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await page.waitForTimeout(5000);
await page.locator('button', { hasText: 'New Project' }).first().click();
await page.waitForTimeout(1500);
await page.locator('input[type="text"]').first().fill('JnmTree');
await page.locator('button', { hasText: /^Create/ }).last().click();
await page.waitForTimeout(6000);
const pid = await page.evaluate(`(() => { const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length ? a[a.length - 1].id : null; })()`);
check('project created', !!pid, String(pid));
await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await page.waitForTimeout(9000);
await page.getByText('New metamodel', { exact: true }).first().click();
await page.waitForTimeout(9000);
const seeded: any = await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const svc = await import('/src/jjscript/services/JjScriptService.ts');
  const mm = j.L.fromPointer(j.DUser.current).project.metamodels[0];
  const out = [];
  for (const line of ${JSON.stringify(TREE_MM)}) {
    const r = await svc.JjScriptService.execute(line, { level: 'M2', metamodelId: mm.id, metamodelName: mm.name });
    out.push(r.success ? 'ok' : (line + ' -> ' + r.message));
    await new Promise(r => setTimeout(r, 600));
  }
  return out;
})()`);
check('Tree metamodel seeded at M2', seeded.every((s: string) => s === 'ok'), seeded);
const mmShape: any = await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const mm = j.L.fromPointer(j.DUser.current).project.metamodels[0];
  return { id: mm.id, classes: (mm.classes || []).map(c => ({ id: c.id, name: c.name,
    attrs: (c.allAttributes || []).map(a => a.name), refs: (c.allReferences || []).map(r => r.name + (r.composition ? '<>' : '') + ':' + (r.type && r.type.name)) })) };
})()`);
meas('metamodel', mmShape);
const byName = Object.fromEntries(mmShape.classes.map((c: any) => [c.name, c]));
check('Leaf has no name attribute, Node has name and label',
    !byName.Leaf.attrs.includes('name') && byName.Node.attrs.includes('name') && byName.Node.attrs.includes('label'), mmShape.classes);

// A model of the metamodel, as the «New model» entry makes it; roots as STEP 6 makes them.
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
const ROOTS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
const roots: any = await page.evaluate(`(async () => {
  ${HELPERS}
  const rootCls = ${JSON.stringify(byName.Root.id)};
  const modelId = ${JSON.stringify(model.id)};
  const u0 = undoLen();
  j.TRANSACTION('probe roots', () => {
    for (const n of ${JSON.stringify(ROOTS)}) j.DObject.new(rootCls, modelId, j.DModel, n, true);
  });
  await sleep(1000);
  const lm = j.L.fromPointer(modelId);
  return { names: (lm.objects || []).map(o => o.name), undoDelta: undoLen() - u0 };
})()`);
check('roots seeded like STEP 6, found by name after 1000 ms', ROOTS.every(n => roots.names.includes(n)), roots);

/** Runs one experiment in the page; `body` sees HELPERS, `lm`, and `root(name)`. */
async function experiment(key: string, body: string): Promise<any> {
    const mark = consoleLog.length;
    await page.evaluate(`console.log('[PROBE] ${key} start')`);
    const r: any = await page.evaluate(`(async () => {
      ${HELPERS}
      const lm = j.L.fromPointer(${JSON.stringify(model.id)});
      const root = (n) => (lm.objects || []).filter(o => o.name === n)[0];
      // STEP 6c runs inside a setTimeout callback: start from a macrotask too.
      return await new Promise(resolve => setTimeout(async () => {
        try { resolve(await (async () => { ${body} })()); }
        catch (e) { resolve({ threw: String(e && e.stack || e) }); }
      }, 0));
    })()`);
    await page.waitForTimeout(400);
    r.console = consoleSince(mark);
    result.experiments[key] = r;
    meas(key, r);
    save();
    return r;
}

// Run 1 (2026-10-30 14:2x) measured: the child returned by addObject is in the store at once, its `$kids` is
// undefined synchronously, after a microtask and after a macrotask, and present at 700 ms. Run 2 times it.

// X1: three levels, each child asked for its slot by polling a fresh proxy from the returned id.
const x1 = await experiment('X1_slot_timing', `
  const out = {};
  const t0 = performance.now();
  const n = add(root('r1'), 'nodes', { name: 'n1' }, 'Node');
  out.child = strip(n);
  out.childSlotSync = slotInfo(n.obj, 'kids');
  out.childSlotMs = await waitSlot(n.id, 'kids', t0);
  out.returnedProxyAtThatTime = slotInfo(n.obj, 'kids');
  const t1 = performance.now();
  const g = add(j.L.fromPointer(n.id), 'kids', { name: 'g1' }, 'Node');
  out.grandchild = strip(g);
  out.grandchildSlotMs = await waitSlot(g.id, 'kids', t1);
  const t2 = performance.now();
  const gg = add(j.L.fromPointer(g.id), 'kids', { name: 'gg1' }, 'Node');
  out.greatGrandchild = strip(gg);
  out.greatGrandchildSlotMs = await waitSlot(gg.id, 'kids', t2);
  await sleep(700);
  out.idsInStore = { n: inStore(n.id), g: inStore(g.id), gg: inStore(gg.id) };
  return out;
`);

// X2: twelve children in one synchronous loop (what STEP 6c does per parent), then the time until every one of
// them answers on its slot; the order of the parent's slot against the creation order; undo history length.
const x2 = await experiment('X2_batch_of_12', `
  const out = {};
  const hAll0 = j.statehistory.all.undoable.length;
  const t0 = performance.now();
  const made = [];
  for (let i = 0; i < 12; i++) made.push(add(root('r2'), 'nodes', { name: 'c' + i }, 'Node'));
  out.created = made.filter(m => m.ok).length;
  const ms = [];
  for (const m of made) ms.push(m.ok ? await waitSlot(m.id, 'kids', t0) : -2);
  out.slotMs = ms;
  out.maxSlotMs = Math.max(...ms);
  await sleep(700);
  const r = root('r2');
  try { out.slotOrder = (r.$nodes.__raw.values || []).map(id => (j.store.getState().idlookup[id] || {}).name); } catch (e) { out.slotOrder = 'threw ' + e; }
  out.undoAllDelta = j.statehistory.all.undoable.length - hAll0;
  out.historyKeys = Object.keys(j.statehistory);
  return out;
`);

// X3: two siblings sharing a name in ONE slot (same tick, and later), the same name in another slot of the same
// owner, and a no-name sibling renamed to the same name through its name slot.
const x3 = await experiment('X3_homonym_siblings', `
  const out = {};
  const t0 = performance.now();
  const n = add(root('r3'), 'nodes', { name: 'n3' }, 'Node');
  out.ownerSlotMs = await waitSlot(n.id, 'kids', t0);
  const o = j.L.fromPointer(n.id);
  const a1 = add(o, 'kids', { name: 'dup' }, 'Node');
  const a2 = add(o, 'kids', { name: 'dup' }, 'Node');
  out.sameSlotSameTick = { first: strip(a1), second: strip(a2) };
  await sleep(900);
  const a3 = add(j.L.fromPointer(n.id), 'kids', { name: 'dup' }, 'Node');
  out.sameSlotLater = strip(a3);
  const a5 = add(j.L.fromPointer(n.id), 'leaves', { name: 'dup' }, 'Leaf');
  out.otherSlotSameOwner = strip(a5);
  const a4 = add(j.L.fromPointer(n.id), 'kids', {}, 'Node');
  out.sameSlotNoName = strip(a4);
  await sleep(900);
  out.autoName = a4.ok ? j.L.fromPointer(a4.id).name : null;
  try { if (a4.ok) j.L.fromPointer(a4.id).$name.value = 'dup'; } catch (e) { out.slotRenameThrew = String(e); }
  await sleep(900);
  out.afterSlotRename = a4.ok ? j.L.fromPointer(a4.id).name : null;
  out.kidsNames = (j.L.fromPointer(n.id).$kids.__raw.values || []).map(id => (j.store.getState().idlookup[id] || {}).name);
  out.toasts = toastText();
  return out;
`);

// X4: a class with no name attribute at depth 2, created as STEP 6c does today (an invented name) and with no
// name; then its own slot at depth 3.
const x4 = await experiment('X4_nameless_class', `
  const out = {};
  const t0 = performance.now();
  const n = add(root('r4'), 'nodes', { name: 'n4' }, 'Node');
  out.ownerSlotMs = await waitSlot(n.id, 'leaves', t0);
  const o = j.L.fromPointer(n.id);
  const l1 = add(o, 'leaves', { name: 'Leaf_0' }, 'Leaf');
  const l2 = add(o, 'leaves', {}, 'Leaf');
  out.withInventedName = strip(l1);
  out.withoutName = strip(l2);
  const t1 = performance.now();
  out.leafSlotMs = await waitSlot(l2.id, 'subs', t1);
  const d = add(j.L.fromPointer(l2.id), 'subs', { name: 'deep' }, 'Node');
  out.depth3UnderNameless = strip(d);
  await sleep(1000);
  out.names = { l1: l1.ok ? j.L.fromPointer(l1.id).name : null, l2: l2.ok ? j.L.fromPointer(l2.id).name : null };
  return out;
`);

// X5: attributes written by the returned id at depth 2 and 3 and on a nameless object, one second after creation.
const x5 = await experiment('X5_attributes_by_id', `
  const out = {};
  const t0 = performance.now();
  const n = add(root('r5'), 'nodes', { name: 'n5' }, 'Node');
  await waitSlot(n.id, 'kids', t0);
  const t1 = performance.now();
  const g = add(j.L.fromPointer(n.id), 'kids', { name: 'g5' }, 'Node');
  await waitSlot(g.id, 'kids', t1);
  const gg = add(j.L.fromPointer(g.id), 'kids', { name: 'gg5' }, 'Node');
  const lf = add(j.L.fromPointer(g.id), 'leaves', {}, 'Leaf');
  await sleep(1000);
  const write = (id, f, v) => { try { const o = j.L.fromPointer(id); if (!o) return 'no object'; o['$' + f].value = v; return 'ok'; } catch (e) { return 'threw ' + e; } };
  out.writes = { g: write(g.id, 'label', 'L-g5'), gg: write(gg.id, 'label', 'L-gg5'), leaf: write(lf.id, 'value', 7) };
  await sleep(800);
  const read = (id, f) => { try { return j.L.fromPointer(id)['$' + f].value; } catch (e) { return 'threw'; } };
  out.reads = { g: read(g.id, 'label'), gg: read(gg.id, 'label'), leaf: read(lf.id, 'value') };
  return out;
`);

await page.waitForTimeout(2500);
const tree: any[] = await page.evaluate(READ_TREE(model.id)) as any[];
result.tree = tree;
meas('tree', tree.map(o => `${o.name}:${o.cls} @${o.where} nameSlot=${JSON.stringify(o.nameSlot)}${o.label !== undefined ? ' label=' + JSON.stringify(o.label) : ''}${o.value !== undefined ? ' value=' + JSON.stringify(o.value) : ''}`));
const at = (name: string) => tree.filter(o => o.name === name).map(o => o.where);

// The checks state what was measured; a FAIL is a finding, not a probe defect.
check('X1 child slot NOT usable in the same tick (run 1 finding, re-measured)', x1.childSlotSync?.addObject !== 'function', x1.childSlotSync);
check('X1 child slot appears within 4 s', x1.childSlotMs >= 0, x1.childSlotMs);
check('X1 grandchild and great-grandchild created once the slot answered', !!(x1.grandchild?.ok && x1.greatGrandchild?.ok), x1);
check('X1 g1 sits in n1.kids, gg1 in g1.kids', JSON.stringify(at('g1')) === '["n1.kids"]' && JSON.stringify(at('gg1')) === '["g1.kids"]', { g1: at('g1'), gg1: at('gg1') });
check('X2 twelve children created in one loop', x2.created === 12, x2.created);
check('X2 every slot answers within 4 s', x2.slotMs?.every((m: number) => m >= 0), x2.slotMs);
check('X2 slot order is creation order', JSON.stringify(x2.slotOrder) === JSON.stringify(Array.from({ length: 12 }, (_, i) => 'c' + i)), x2.slotOrder);
check('X3 second homonym in one slot, same tick, refused', !x3.sameSlotSameTick?.second?.ok, x3.sameSlotSameTick);
check('X3 homonym in one slot, later, refused', !x3.sameSlotLater?.ok, x3.sameSlotLater);
check('X3 same name in another slot of the same owner accepted', !!x3.otherSlotSameOwner?.ok, x3.otherSlotSameOwner);
check('X3 rename through the name slot NOT gated (duplicate made)', x3.afterSlotRename === 'dup', x3.afterSlotRename);
check('X4 nameless class created with an invented name', !!x4.withInventedName?.ok, x4.withInventedName);
check('X4 nameless class created without a name', !!x4.withoutName?.ok, x4.withoutName);
check('X4 depth 3 under a nameless object', JSON.stringify(at('deep')).includes('.subs'), at('deep'));
check('X5 label written by id at depth 2 and 3', x5.reads?.g === 'L-g5' && x5.reads?.gg === 'L-gg5', x5.reads);
check('X5 value written by id on a nameless object', x5.reads?.leaf === 7, x5.reads);
result.pageErrors = pageErrors;
check('no page error', pageErrors.length === 0, pageErrors.slice(0, 5));
save();
console.log(`DONE failures=${failures} out=${OUT}`);
await browser.close();
process.exit(0);
