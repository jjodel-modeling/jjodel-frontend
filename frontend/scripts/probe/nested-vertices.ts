/**
 * nested-vertices probe, slice S0 (P-2026-10-10-0830). Read-only: it changes no source, and it writes only to the
 * throwaway browser profile and to the lane folder.
 *
 * Question: what the canvas draws today for the three D-layer shapes of an M1 object (root, nested `father = DValue`,
 * hybrid: nested and also listed in `DModel.objects`), and whether opening a canvas that has to create a vertex
 * re-lays the existing nodes. Report: docs/discovery/discovery_2026-10-10_nested_object_vertices.md (A2, B6, D3).
 *
 * Drives the real app on its own dev server (never 3001), 1440x900, light, offline user. One fresh project:
 *
 *   E1  A2. Import `StateMachine.ecore` and then `sample-StateMachine.xmi` through the two hidden file inputs of the
 *       project page (`ProjectEditor.tsx` `handleEcoreFileChange`, `handleXmiFileChange`), open the model, and count
 *       the `.react-flow__node` of its tab against its DObjects. Print, for each DObject, the class of its `father`,
 *       whether `DModel.objects` lists it, and how many DVertex of the model's graphs point at it.
 *   E2  B6. With that canvas open, run `create instance of State "ProbeChild" in <state>.substates` through
 *       `JjScriptService.execute` with the M1 scope (the call Jjodie's Run makes per line). Node count before and
 *       after, and the new object's shape and vertices.
 *   E3  D3. Move one node by the drag write path (`syncPositionToJjom`), the sentinel a re-layout would undo, and
 *       save. E3a: reload, open, compare every node's position (nothing should be created on this open). E3b: reload
 *       without opening the model, create a ROOT instance with JjScript (no canvas mounted, so no vertex), save,
 *       reload, open: Step 2bis creates one vertex on open, the mechanism D3 is about. Compare every pre-existing
 *       node's position before and after, the sentinel first.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/nested-vertices.ts --port 3097 --id P-2026-10-10-0830
 * Env:  NV_OUT  JSON output (default ~/.jjodel-lanes/P-2026-10-10-0830/probe_s0.json)
 *
 * Exit code: the number of failed SETUP checks (import, open, save). The measures are MEAS lines and do not fail.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3097/').replace(/\/$/, '');
if (/:3001$/.test(URL)) throw new Error('never 3001');
const OUT = process.env.NV_OUT || `${process.env.HOME}/.jjodel-lanes/P-2026-10-10-0830/probe_s0.json`;
const FIX = new globalThis.URL('../../src/__tests__/fixtures/xmi-m1/', import.meta.url).pathname;
const ECORE = FIX + 'StateMachine.ecore';
const XMI = FIX + 'sample-StateMachine.xmi';
const SETTLE = 12000;

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 1500)}`);
};
const meas = (label: string, v: unknown) => console.log(`MEAS  ${label}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 6000)}`);

// ── Page reads ────────────────────────────────────────────────────────────────────────────────────────

/** Every DObject whose father chain ends in the model: shape, and the DVertex of the model's graphs over it. */
const READ_SHAPES = (modelId: string) => `(() => {
  const L = (window.store || window.windoww.store).getState().idlookup;
  const M = ${JSON.stringify(modelId)};
  const m = L[M];
  const modelOf = (o) => { let f = L[o.father], n = 0; while (f && f.className !== 'DModel' && n++ < 50) f = L[f.father]; return f && f.id; };
  const objects = (m && m.objects) || [];
  const graphs = Object.values(L).filter(g => g && g.className === 'DGraph' && g.model === M);
  const vOf = new Map();
  for (const g of graphs) for (const se of (g.subElements || [])) { const v = L[se]; if (v && String(v.className).includes('Vertex') && v.model) vOf.set(v.model, (vOf.get(v.model) || 0) + 1); }
  const nameOf = (id) => (L[id] && L[id].name !== undefined) ? L[id].name : id;
  const dobjects = Object.values(L).filter(d => d && d.className === 'DObject' && modelOf(d) === M).map(o => {
    const f = L[o.father];
    const fatherClass = f ? f.className : 'none';
    const inObjects = objects.includes(o.id);
    const shape = fatherClass === 'DModel' && inObjects ? 'root' : fatherClass === 'DValue' && inObjects ? 'hybrid' : fatherClass === 'DValue' ? 'nested' : 'other';
    const slot = (n) => (o.features || []).map(fid => L[fid]).find(v => v && (v.name === n || nameOf(v.instanceof) === n));
    const label = ((slot('name') || {}).values || [])[0] ?? null;
    const subs = ((slot('substates') || {}).values || []).length;
    return { id: o.id, name: o.name, label, subs, cls: nameOf(o.instanceof), fatherClass, container: fatherClass === 'DValue' ? nameOf(f.father) + '.' + (f.name || nameOf(f.instanceof)) : null, inObjects, vertices: vOf.get(o.id) || 0, shape };
  });
  return { objectsLength: objects.length, graphs: graphs.map(g => ({ id: g.id, style: g.graphStyle || null, subElements: (g.subElements || []).length })), dobjects };
})()`;

/** The nodes of the model's active tab: id, the object behind it, the drawn translate, and the D-layer record. */
const READ_NODES = (modelId: string) => `(async () => {
  const L = (window.store || window.windoww.store).getState().idlookup;
  const ad = await import('/src/components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts');
  const key = ad.getActiveLayoutKey();
  const pane = document.querySelector(${JSON.stringify(`[id="${modelId}"].dock-tabpane-active`)});
  const els = pane ? [...pane.querySelectorAll('.react-flow__node')] : [];
  const nodes = els.map(el => {
    const id = el.getAttribute('data-id');
    const t = (el.style.transform || '').match(/translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/);
    const v = L[id] || {};
    const rec = v.layoutByViewpoint && v.layoutByViewpoint[key];
    return { id, object: v.model ? ((L[v.model] || {}).name ?? v.model) : null, x: t ? Math.round(+t[1]) : null, y: t ? Math.round(+t[2]) : null,
             seed: { x: v.x, y: v.y }, rec: rec ? { x: Math.round(rec.x), y: Math.round(rec.y) } : null, recRaw: rec ? JSON.stringify(rec) : null };
  });
  const edges = pane ? [...pane.querySelectorAll('.react-flow__edge')].map(e => [...e.classList].find(c => c.startsWith('react-flow__edge-')) || '?') : [];
  const byType = {}; for (const t of edges) byType[t] = (byType[t] || 0) + 1;
  return { mounted: !!pane, layoutKey: key, nodeCount: nodes.length, edgeCount: edges.length, edgesByType: byType, nodes };
})()`;

async function readShapes(page: Page, modelId: string): Promise<any> { return page.evaluate(READ_SHAPES(modelId)); }
async function readNodes(page: Page, modelId: string): Promise<any> { return page.evaluate(READ_NODES(modelId)); }

/** Is any canvas of the model mounted, active or not (rc-dock keeps inactive panes mounted). */
async function canvasMounted(page: Page, modelId: string): Promise<number> {
    return page.evaluate(`document.querySelectorAll(${JSON.stringify(`[id="${modelId}"] .react-flow`)}).length`) as Promise<number>;
}

async function projectInfo(page: Page): Promise<any> {
    return page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const p = j.L.fromPointer(j.DUser.current).project;
      return { id: p.id, metamodels: (p.metamodels || []).map(m => ({ id: m.id, name: m.name })), models: (p.models || []).filter(m => !m.isMetamodel).map(m => ({ id: m.id, name: m.name })) };
    })()`);
}

async function openModel(page: Page, id: string): Promise<void> {
    await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const dm = await import('/src/components/abstract/DockManager.tsx');
      await dm.default.open2(j.L.fromPointer(${JSON.stringify(id)}));
    })()`);
    await page.waitForTimeout(SETTLE);
}

async function save(page: Page): Promise<boolean> {
    return page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const api = await import('/src/api/persistance/projects.ts');
      const pr = j.L.fromPointer(j.DUser.current).project;
      await api.ProjectsApi.save(pr, { silent: true });
      await new Promise(r => setTimeout(r, 2000));
      const a = JSON.parse(localStorage.getItem('projects') || '[]');
      return !!a.find(x => x.id === pr.id);
    })()`) as Promise<boolean>;
}

async function reopenProject(page: Page, pid: string): Promise<void> {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(5000);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(9000);
}

async function jjs(page: Page, line: string, scope: any): Promise<any> {
    return page.evaluate(`(async () => {
      const svc = await import('/src/jjscript/services/JjScriptService.ts');
      const r = await svc.JjScriptService.execute(${JSON.stringify(line)}, ${JSON.stringify(scope)});
      return { line: ${JSON.stringify(line)}, success: r.success, code: r.errors && r.errors[0] && r.errors[0].code, message: r.message };
    })()`);
}

/** Pre-existing nodes compared by vertex id: moved ones with their delta. */
function diffPositions(before: any[], after: any[]): { compared: number; moved: Array<{ id: string; object: string; from: string; to: string }>; missing: string[] } {
    const a = new Map(after.map((n: any) => [n.id, n]));
    const moved: Array<{ id: string; object: string; from: string; to: string }> = [];
    const missing: string[] = [];
    for (const b of before) {
        const n: any = a.get(b.id);
        if (!n) { missing.push(b.id); continue; }
        if (n.x !== b.x || n.y !== b.y) moved.push({ id: b.id, object: String(b.object), from: `${b.x},${b.y}`, to: `${n.x},${n.y}` });
    }
    return { compared: before.length - missing.length, moved, missing };
}

const countShapes = (s: any) => s.dobjects.reduce((acc: any, o: any) => {
    acc[o.shape] = (acc[o.shape] || 0) + 1;
    if (o.vertices > 0) acc[o.shape + 'WithVertex'] = (acc[o.shape + 'WithVertex'] || 0) + 1;
    return acc;
}, {});

// ── Main ──────────────────────────────────────────────────────────────────────────────────────────────

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await seed(ctx, false);
const page: Page = await ctx.newPage();
const pageErrors: string[] = [];
const consoleErrors: string[] = [];
page.on('pageerror', (e: Error) => pageErrors.push(e.message.slice(0, 300)));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
const result: any = { url: URL, started: new Date().toISOString(), experiments: {} };
const out = () => { mkdirSync(dirname(OUT), { recursive: true }); writeFileSync(OUT, JSON.stringify({ ...result, pageErrors, consoleErrors }, null, 1)); };

try {
    // ── Setup: a fresh project ────────────────────────────────────────────────────────────────────────
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(5000);
    await page.locator('button', { hasText: 'New Project' }).first().click();
    await page.waitForTimeout(1500);
    await page.locator('input[type="text"]').first().fill('NestedVerticesS0');
    await page.locator('button', { hasText: /^Create/ }).last().click();
    await page.waitForTimeout(6000);
    const pid = await page.evaluate(`(() => { const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length ? a[a.length - 1].id : null; })()`) as string | null;
    check('project created', !!pid, String(pid));
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(9000);

    // ── E1: import the .ecore and the .xmi through the project page's file inputs ────────────────────
    await page.locator('input[type="file"][accept=".ecore"]').setInputFiles(ECORE);
    await page.waitForTimeout(5000);
    await page.locator('input[type="file"][accept=".xmi,.xml"]').setInputFiles(XMI);
    await page.waitForTimeout(6000);
    const pr = await projectInfo(page);
    check('metamodel imported', pr.metamodels.length > 0, pr.metamodels);
    check('M1 model imported', pr.models.length > 0, pr.models);
    const model = pr.models[pr.models.length - 1];
    const mm = pr.metamodels[pr.metamodels.length - 1];
    const scope = { level: 'M1', metamodelId: mm.id, metamodelName: mm.name, modelId: model.id };

    const e1Before = await readShapes(page, model.id);
    meas('E1 D-layer before open', { objectsLength: e1Before.objectsLength, graphs: e1Before.graphs, shapes: countShapes(e1Before) });
    await openModel(page, model.id);
    const e1Shapes = await readShapes(page, model.id);
    const e1Nodes = await readNodes(page, model.id);
    check('E1 canvas mounted', e1Nodes.mounted, '');
    for (const o of e1Shapes.dobjects) meas('E1 object', `${o.name} (name slot ${o.label}):${o.cls} father=${o.fatherClass}${o.container ? ' (' + o.container + ')' : ''} inObjects=${o.inObjects} vertices=${o.vertices} shape=${o.shape}`);
    meas('E1 counts', { dobjects: e1Shapes.dobjects.length, objectsLength: e1Shapes.objectsLength, shapes: countShapes(e1Shapes), rfNodes: e1Nodes.nodeCount, rfEdges: e1Nodes.edgeCount, edgesByType: e1Nodes.edgesByType, graphs: e1Shapes.graphs });
    meas('E1 verdict A2 (nodes == DObjects)', `${e1Nodes.nodeCount} nodes vs ${e1Shapes.dobjects.length} DObjects`);
    result.experiments.E1 = { shapesBeforeOpen: e1Before, shapes: e1Shapes, nodes: e1Nodes };
    out();

    // ── E2: create … in, with the canvas open ─────────────────────────────────────────────────────────
    // JjScript resolves an instance by its identity slot (`name`), not by DObject.name, which the XMI importer
    // leaves at the auto-name (first run: `State_0` -> INSTANCE_NOT_FOUND). The parent is the State that already
    // owns substates, by its `name` slot.
    const parent = e1Shapes.dobjects.find((o: any) => o.cls === 'State' && o.subs > 0 && o.label)
        ?? e1Shapes.dobjects.find((o: any) => o.cls === 'State' && o.label);
    const n0 = await readNodes(page, model.id);
    const line = `create instance of State "ProbeChild" in ${parent?.label}.substates`;
    const r2 = await jjs(page, line, scope);
    meas('E2 command', r2);
    await page.waitForTimeout(6000);
    const n1 = await readNodes(page, model.id);
    const s2 = await readShapes(page, model.id);
    const child = s2.dobjects.find((o: any) => o.name === 'ProbeChild');
    meas('E2 node count', `before ${n0.nodeCount}, after ${n1.nodeCount}; edges before ${n0.edgeCount}, after ${n1.edgeCount}`);
    meas('E2 new object', child ? `${child.name}:${child.cls} father=${child.fatherClass} (${child.container}) inObjects=${child.inObjects} vertices=${child.vertices} shape=${child.shape}` : 'not found');
    result.experiments.E2 = { parent: parent?.label, command: r2, before: n0, after: n1, child };
    out();

    // ── E3 prep: move one node by the drag write path (the sentinel), save ──────────────────────────────
    const sentinel = n1.nodes.find((n: any) => n.x !== null);
    const moved = await page.evaluate(`(async () => {
      const c = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
      c.syncPositionToJjom(${JSON.stringify(sentinel?.id)}, ${(sentinel?.x ?? 0) + 640}, ${(sentinel?.y ?? 0) + 480});
      await new Promise(r => setTimeout(r, 1500));
      return true;
    })()`);
    await page.waitForTimeout(2000);
    const p0 = await readNodes(page, model.id);
    const sentinelAfterMove = p0.nodes.find((n: any) => n.id === sentinel?.id);
    // The drag write marks the vertex canvas-updated, so the sync does not echo the position back to React Flow (in a
    // real drag the node is already there; first run: DOM unchanged, record written). The sentinel's baseline is its record.
    if (sentinelAfterMove?.rec) {
        sentinelAfterMove.domAfterWrite = `${sentinelAfterMove.x},${sentinelAfterMove.y}`;
        sentinelAfterMove.x = sentinelAfterMove.rec.x;
        sentinelAfterMove.y = sentinelAfterMove.rec.y;
    }
    meas('E3 sentinel', { id: sentinel?.id, object: sentinel?.object, from: `${sentinel?.x},${sentinel?.y}`, to: `${sentinelAfterMove?.x},${sentinelAfterMove?.y}`, rec: sentinelAfterMove?.rec, layoutKey: p0.layoutKey, moved });
    const s3pre = await readShapes(page, model.id);
    const vBefore = s3pre.dobjects.reduce((a: number, o: any) => a + o.vertices, 0);
    check('E3 saved (before E3a)', await save(page), '');

    // ── E3a: reload, open; nothing should be created ──────────────────────────────────────────────────
    await reopenProject(page, pid as string);
    const mountedOnLoadA = await canvasMounted(page, model.id);
    meas('E3a canvas mounted right after reload, before opening', mountedOnLoadA);
    await openModel(page, model.id);
    const p1 = await readNodes(page, model.id);
    const s3a = await readShapes(page, model.id);
    const vA = s3a.dobjects.reduce((a: number, o: any) => a + o.vertices, 0);
    const childA = s3a.dobjects.find((o: any) => o.name === 'ProbeChild');
    const dA = diffPositions(p0.nodes, p1.nodes);
    meas('E3a vertices before / after the open', `${vBefore} / ${vA}`);
    meas('E3a ProbeChild after reopen', childA ? `vertices=${childA.vertices} shape=${childA.shape}` : 'not found');
    meas('E3a positions', { compared: dA.compared, moved: dA.moved, missing: dA.missing, sentinel: p1.nodes.find((n: any) => n.id === sentinel?.id) });
    result.experiments.E3a = { mountedOnLoad: mountedOnLoadA, before: p0, after: p1, diff: dA, verticesBefore: vBefore, verticesAfter: vA };
    out();

    // ── E3b: a vertex-less ROOT made with no canvas mounted, then the open that creates its vertex ───────
    await reopenProject(page, pid as string);
    const mountedOnLoadB = await canvasMounted(page, model.id);
    meas('E3b canvas mounted right after reload, before the create', mountedOnLoadB);
    const r3 = await jjs(page, 'create instance of State "ProbeRoot"', scope);
    meas('E3b command', r3);
    await page.waitForTimeout(4000);
    const s3b0 = await readShapes(page, model.id);
    const rootB0 = s3b0.dobjects.find((o: any) => o.name === 'ProbeRoot');
    meas('E3b ProbeRoot before the open', rootB0 ? `vertices=${rootB0.vertices} shape=${rootB0.shape}` : 'not found');
    check('E3b saved (before the open)', await save(page), '');
    await reopenProject(page, pid as string);
    meas('E3b canvas mounted right after the second reload', await canvasMounted(page, model.id));
    await openModel(page, model.id);
    const p2 = await readNodes(page, model.id);
    const s3b = await readShapes(page, model.id);
    const rootB = s3b.dobjects.find((o: any) => o.name === 'ProbeRoot');
    const dB = diffPositions(p1.nodes, p2.nodes);
    meas('E3b ProbeRoot after the open', rootB ? `vertices=${rootB.vertices} shape=${rootB.shape}` : 'not found');
    meas('E3b node count before / after the open', `${p1.nodeCount} / ${p2.nodeCount}`);
    meas('E3b positions of pre-existing nodes', { compared: dB.compared, movedCount: dB.moved.length, moved: dB.moved, missing: dB.missing, sentinelBefore: p1.nodes.find((n: any) => n.id === sentinel?.id), sentinelAfter: p2.nodes.find((n: any) => n.id === sentinel?.id) });
    // P-2026-10-10-1155: every pre-existing node's full layout record, compared as the stored JSON (byte-identical or not).
    const recAfter = new Map(p2.nodes.map((n: any) => [n.id, n.recRaw]));
    const recChanged = p1.nodes.filter((n: any) => recAfter.has(n.id) && recAfter.get(n.id) !== n.recRaw).map((n: any) => ({ object: n.object, before: n.recRaw, after: recAfter.get(n.id) }));
    meas('E3b layout records of pre-existing nodes', { compared: p1.nodes.filter((n: any) => recAfter.has(n.id)).length, changedCount: recChanged.length, changed: recChanged, sentinelRecBefore: p1.nodes.find((n: any) => n.id === sentinel?.id)?.recRaw, sentinelRecAfter: recAfter.get(sentinel?.id) });
    result.experiments.E3b = { mountedOnLoad: mountedOnLoadB, command: r3, rootBeforeOpen: rootB0, rootAfterOpen: rootB, before: p1, after: p2, diff: dB };
    out();
} catch (err) {
    failures++;
    console.log('FAIL  probe threw  ' + String((err as Error)?.stack ?? err).slice(0, 1500));
} finally {
    meas('pageErrors', pageErrors.length);
    meas('consoleErrors', consoleErrors.length);
    result.finished = new Date().toISOString();
    out();
    meas('json', OUT);
    await browser.close();
}
console.log(`FAILURES ${failures}`);
process.exit(failures);
