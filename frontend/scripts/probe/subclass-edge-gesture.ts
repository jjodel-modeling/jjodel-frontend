/**
 * subclass-edge-gesture probe (P-2026-10-11-1025; Phase 1 as a gitignored scratch file, committed in Phase 2 as the
 * acceptance of fix F1). Read-only on sources: it writes only to the throwaway browser profile and to the lane folder.
 * Report: docs/discovery/discovery_2026-10-11_m1_edge_gesture_subclass_instances.md.
 *
 * Question (H3): with the metamodel tab and the model tab both open, a subclass of State added in the metamodel
 * tab left the M1 connect gesture inert on its instances until the model tab was closed and reopened, because
 * useEditorMode's memo was keyed on a class signature without `extends`. Measured on HEAD 385058377: A1..A5 inert.
 * F1 puts the superclass ids in the signature; with it every gesture below must work on the open tab.
 *
 * Fixture: StateMachine.ecore + sample-StateMachine.xmi (State.outgoing: Transition, State.substates: State
 * [containment], Transition.source/target: State). Real app, own dev server (never 3001), 1440x900, basic mode.
 *
 *   S1  Metamodel tab: class Choice created the way the M2 palette drop does (`syncCreateClass`), no superclass.
 *   S2  Model tab: one Choice instance (`syncCreateObject`, the M1 drop's write). Control gesture C0.
 *   S3  Metamodel tab again (model tab stays open, hidden): classes Initial and Terminal created; Initial, Terminal
 *       and Choice get `extends State` the way the M2 inheritance gesture writes it (`syncInheritanceEdge`).
 *   S4  Back on the model tab, NOT reopened: new Initial/Terminal instances; gestures A0..A5.
 *   S5  Model tab closed and reopened: new instances; gestures B0..B5.
 *
 * Every gesture is a real pointer drag from the source node's ghost handle to the target node's facing side.
 * Each gesture reads, after it: the popup and its options, the source slot's values, the D edges and the DOM
 * edges of the pair, and the console warnings emitted during it. `modeInfo` (useEditorMode's memo) is read from
 * the EditorV2Inner fiber of the model pane at each stage, hidden or not.
 *
 * Acceptance (F1): on the open tab (S4) the memo carries the inherited references and the new concrete subclasses,
 * `getCompatibleReferences` on it equals the fresh derivation, and A1..A5 each create one D edge, one DOM edge and
 * the slot value the Properties panel offers; the State controls C0, A0, A0t, B0 and the reopened B1..B5 too.
 * B0t is recorded, not checked: xyflow refuses it (isValid false) on the unmodified code, no subclass involved.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/subclass-edge-gesture.ts --port <n> --id P-2026-10-11-1025
 * Env:  SEG_OUT  JSON output (default ~/.jjodel-lanes/P-2026-10-11-1025/probe_subclass_edge_gesture.json)
 *
 * Exit code: number of failed setup checks and failed expectations.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3123/').replace(/\/$/, '');
if (/:3001$/.test(URL)) throw new Error('never 3001');
const OUT = process.env.SEG_OUT || `${process.env.HOME}/.jjodel-lanes/P-2026-10-11-1025/probe_subclass_edge_gesture.json`;
const SHOTS = dirname(OUT);
const FIX = new globalThis.URL('../../src/__tests__/fixtures/xmi-m1/', import.meta.url).pathname;
const ECORE = FIX + 'StateMachine.ecore';
const XMI = FIX + 'sample-StateMachine.xmi';
const SETTLE = 10000;

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 2000)}`);
};
const meas = (label: string, v: unknown) => console.log(`MEAS  ${label}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 4000)}`);
const out: Record<string, unknown> = {};

const J = `const j = await import('/src/joiner/index.ts');`;
const C2J = `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');`;

async function projectInfo(page: Page): Promise<any> {
    return page.evaluate(`(async () => { ${J}
      const p = j.L.fromPointer(j.DUser.current).project;
      return { id: p.id, metamodels: (p.metamodels || []).map(m => ({ id: m.id, name: m.name })), models: (p.models || []).filter(m => !m.isMetamodel).map(m => ({ id: m.id, name: m.name })) };
    })()`);
}

async function openTab(page: Page, id: string, wait = SETTLE): Promise<void> {
    await page.evaluate(`(async () => { ${J}
      const dm = await import('/src/components/abstract/DockManager.tsx');
      await dm.default.open2(j.L.fromPointer(${JSON.stringify(id)}));
    })()`);
    await page.waitForTimeout(wait);
}

async function closeTab(page: Page, id: string): Promise<boolean> {
    const r = await page.evaluate(`(async () => {
      const dm = await import('/src/components/abstract/DockManager.tsx');
      return dm.default.closeTab(${JSON.stringify(id)});
    })()`);
    await page.waitForTimeout(3000);
    return r as boolean;
}

/** Graphs, classes by name, and the vertex of each element on its v2-flow graph. */
async function ids(page: Page, mm: string, model: string): Promise<any> {
    return page.evaluate(`(() => {
      const L = (window.store || window.windoww.store).getState().idlookup;
      const graphOf = (m) => Object.values(L).find(x => x && x.className === 'DGraph' && x.model === m && x.graphStyle === 'v2-flow');
      const g2 = graphOf(${JSON.stringify(mm)}), g1 = graphOf(${JSON.stringify(model)});
      const vmap = (g) => { const o = {}; for (const se of ((g && g.subElements) || [])) { const v = L[se]; if (v && String(v.className).includes('Vertex') && v.model) o[v.model] = se; } return o; };
      const classes = {};
      for (const x of Object.values(L)) if (x && x.className === 'DClass') classes[x.name] = x.id;
      const nameOf = (id) => (L[id] && L[id].name !== undefined) ? L[id].name : id;
      const objects = {};
      for (const x of Object.values(L)) if (x && x.className === 'DObject') {
        const s = (x.features || []).map(f => L[f]).find(v => v && nameOf(v.instanceof) === 'name');
        const label = s && s.values && typeof s.values[0] === 'string' && s.values[0] ? s.values[0] : x.name;
        objects[label] = x.id;
      }
      return { m2Graph: g2 ? g2.id : null, m1Graph: g1 ? g1.id : null, classes, objects, v2: vmap(g2), v1: vmap(g1) };
    })()`);
}

/** useEditorMode's memo, read from the EditorV2Inner fiber of the pane whose id is the model id. */
async function modeInfo(page: Page, modelId: string): Promise<any> {
    return page.evaluate(`(() => {
      const panes = [...document.querySelectorAll('[id="' + ${JSON.stringify(modelId)} + '"]')].filter(e => e.querySelector('.react-flow'));
      if (!panes.length) return { mounted: false };
      const pane = panes[0];
      const rf = pane.querySelector('.react-flow');
      const fk = Object.keys(rf).find(k => k.startsWith('__reactFiber$'));
      let f = fk ? rf[fk] : null, depth = 0, info = null;
      while (f && depth++ < 500) {
        const n = f.type && (f.type.displayName || f.type.name);
        if (n === 'EditorV2Inner') {
          let h = f.memoizedState;
          while (h) {
            const v = h.memoizedState;
            if (Array.isArray(v) && v.length === 2 && v[0] && typeof v[0] === 'object' && Array.isArray(v[0].allClasses) && 'rootableClasses' in v[0]) { info = v[0]; break; }
            h = h.next;
          }
          break;
        }
        f = f.return;
      }
      if (!info) return { mounted: true, active: pane.className.includes('active'), found: false };
      const byName = {};
      for (const c of info.allClasses) byName[c.name] = { refs: c.references.map(r => r.name), subs: c.concreteSubclasses.map(s => s.name) };
      return { mounted: true, active: pane.className.includes('active'), found: true, mode: info.mode,
               classes: byName, rootable: info.rootableClasses.map(c => c.name) };
    })()`);
}

/**
 * The gesture's own decision, executed in the page: `getCompatibleReferences` (the call EditorV2's onConnectEnd makes)
 * on the memo's `allClasses` read from the fiber, and on a fresh `getMetaclassInfo(model)` (the same resolution,
 * computed now). Pairs are class names [source, target].
 */
async function compatProbe(page: Page, modelId: string, pairs: Array<[string, string]>): Promise<any> {
    return page.evaluate(`(async () => {
      const cc = await import('/src/components/editor-v2/utils/compositionCompat.ts');
      const em = await import('/src/components/editor-v2/hooks/useEditorMode.ts');
      const panes = [...document.querySelectorAll('[id="' + ${JSON.stringify(modelId)} + '"]')].filter(e => e.querySelector('.react-flow'));
      if (!panes.length) return { error: 'not mounted' };
      const rf = panes[0].querySelector('.react-flow');
      const fk = Object.keys(rf).find(k => k.startsWith('__reactFiber$'));
      let f = rf[fk], memo = null, d = 0;
      while (f && d++ < 500 && !memo) {
        const n = f.type && (f.type.displayName || f.type.name);
        if (n === 'EditorV2Inner') { let h = f.memoizedState; while (h) { const v = h.memoizedState; if (Array.isArray(v) && v.length === 2 && v[0] && Array.isArray(v[0].allClasses) && 'rootableClasses' in v[0]) { memo = v[0]; break; } h = h.next; } break; }
        f = f.return;
      }
      if (!memo) return { error: 'memo not found' };
      const fresh = em.getMetaclassInfo(${JSON.stringify(modelId)});
      const run = (info, s, t) => {
        const src = info.allClasses.find(c => c.name === s), tgt = info.allClasses.find(c => c.name === t);
        if (!src || !tgt) return 'class missing';
        return cc.getCompatibleReferences(src, tgt.id, info.allClasses).map(r => r.ref.name);
      };
      const out = {};
      for (const [s, t] of ${JSON.stringify(pairs)}) out[s + '->' + t] = { memo: run(memo, s, t), fresh: run(fresh, s, t) };
      return out;
    })()`);
}

/** The D-layer truth the memo should mirror: each class's extends and allReferences, read live. */
async function liveClasses(page: Page, names: string[]): Promise<any> {
    return page.evaluate(`(async () => { ${J}
      const L = (window.store || window.windoww.store).getState().idlookup;
      const out = {};
      for (const x of Object.values(L)) if (x && x.className === 'DClass' && ${JSON.stringify(names)}.includes(x.name)) {
        const lc = j.L.fromPointer(x.id);
        out[x.name] = { extends: (x.extends || []).map(id => L[id] && L[id].name), allReferences: (lc.allReferences || []).map(r => r.name) };
      }
      return out;
    })()`);
}

async function createClass(page: Page, m2Graph: string, name: string, x: number, y: number): Promise<string | false> {
    const r = await page.evaluate(`(async () => { ${C2J} return c2j.syncCreateClass(${JSON.stringify(m2Graph)}, ${x}, ${y}, false, ${JSON.stringify(name)}); })()`);
    await page.waitForTimeout(1500);
    return r as string | false;
}

async function inherit(page: Page, srcV: string, tgtV: string): Promise<string | null> {
    const r = await page.evaluate(`(async () => { ${C2J} return c2j.syncInheritanceEdge(${JSON.stringify(srcV)}, ${JSON.stringify(tgtV)}); })()`);
    await page.waitForTimeout(1500);
    return r as string | null;
}

async function createObject(page: Page, m1Graph: string, classId: string, at: { x: number; y: number }): Promise<{ vertex: string; object: string } | null> {
    const r: any = await page.evaluate(`(async () => { ${C2J}
      const v = c2j.syncCreateObject(${JSON.stringify(m1Graph)}, ${JSON.stringify(classId)}, ${at.x}, ${at.y});
      if (!v) return null;
      await new Promise(res => setTimeout(res, 300));
      const L = (window.store || window.windoww.store).getState().idlookup;
      return { vertex: v, object: L[v] ? L[v].model : null };
    })()`);
    await page.waitForTimeout(1500);
    return r;
}

/** The pair after a gesture: the source slot's values, D edges of the pair in the graph, DOM edges in the pane. */
async function pairState(page: Page, a: { srcObj: string; feature: string; srcV: string; tgtV: string; m1Graph: string }): Promise<any> {
    return page.evaluate(`(() => {
      const a = ${JSON.stringify(a)};
      const L = (window.store || window.windoww.store).getState().idlookup;
      const nameOf = (id) => (L[id] && L[id].name !== undefined) ? L[id].name : id;
      const src = L[a.srcObj] || {};
      const slot = (src.features || []).map(f => L[f]).find(v => v && nameOf(v.instanceof) === a.feature);
      const values = slot && slot.values ? Array.from(slot.values).filter(v => typeof v === 'string' && v) : null;
      const g = L[a.m1Graph] || {};
      const dEdges = (g.subElements || []).filter(id => { const d = L[id]; return d && String(d.className).includes('Edge') && d.start === a.srcV && d.end === a.tgtV; }).length;
      const pane = document.querySelector('.dock-tabpane-active .react-flow');
      const dom = pane ? [...pane.querySelectorAll('.react-flow__edge')].filter(el => (el.getAttribute('aria-label') || '') === 'Edge from ' + a.srcV + ' to ' + a.tgtV).length : -1;
      return { slotId: slot ? slot.id : null, values, dEdges, domEdges: dom };
    })()`);
}

/** What the Properties panel offers for the slot: LValue.validTargets (live L-proxy), as object ids. */
async function validTargets(page: Page, slotId: string | null): Promise<string[] | null> {
    if (!slotId) return null;
    return page.evaluate(`(async () => { ${J}
      try { const vt = j.L.fromPointer(${JSON.stringify(slotId)}).validTargets || []; return Array.from(vt).map(o => (o && (o.id || o.value)) || String(o)); }
      catch (e) { return ['ERR ' + e.message]; }
    })()`);
}

type Side = 'top' | 'bottom' | 'left' | 'right';
const sideToward = (from: { cx: number; cy: number }, to: { cx: number; cy: number }): Side => {
    const dx = to.cx - from.cx, dy = to.cy - from.cy;
    return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top');
};
const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const sidePoint = (b: { x: number; y: number; width: number; height: number }, s: Side, inset: number) =>
    s === 'top' ? { x: b.x + b.width / 2, y: b.y + inset } : s === 'bottom' ? { x: b.x + b.width / 2, y: b.y + b.height - inset }
        : s === 'left' ? { x: b.x + inset, y: b.y + b.height / 2 } : { x: b.x + b.width - inset, y: b.y + b.height / 2 };

const consoleLog: string[] = [];

/** One connect gesture, source ghost handle to the target's facing side. `pick` is the popup option to click. */
async function gesture(page: Page, label: string, a: { srcV: string; tgtV: string; srcObj: string; tgtObj: string; feature: string; m1Graph: string; pick?: string }): Promise<any> {
    const node = (v: string) => page.locator(`.dock-tabpane-active .react-flow__node[data-id="${v}"]`).first();
    const before = await pairState(page, a);
    const sb = await node(a.srcV).boundingBox();
    const tb = await node(a.tgtV).boundingBox();
    if (!sb || !tb) return { label, error: 'node not rendered', sb: !!sb, tb: !!tb };
    const sc = { cx: sb.x + sb.width / 2, cy: sb.y + sb.height / 2 }, tc = { cx: tb.x + tb.width / 2, cy: tb.y + tb.height / 2 };
    const sSide = sideToward(sc, tc);
    const tSide = opposite[sideToward(sc, tc)];
    const hover = sidePoint(sb, sSide, 4);
    await page.mouse.move(hover.x, hover.y, { steps: 4 });
    await page.waitForTimeout(400);
    const ghost = node(a.srcV).locator('.react-flow__handle.source.mm-anchor--ghost-visible').first();
    const gb = (await ghost.count()) ? await ghost.boundingBox() : null;
    let press: { x: number; y: number } | null = null;
    if (gb) {
        for (let fy = 0.1; fy <= 0.91 && !press; fy += 0.2) for (let fx = 0.1; fx <= 0.91 && !press; fx += 0.2) {
            const p = { x: gb.x + gb.width * fx, y: gb.y + gb.height * fy };
            const cls = await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x as number, y as number); return el ? String(el.className && (el.className as any).baseVal !== undefined ? (el.className as any).baseVal : el.className) : ''; }, [p.x, p.y]);
            if (cls.includes('react-flow__handle')) press = p;
        }
    }
    const mark = consoleLog.length;
    let popup: string[] | null = null, picked = false, dropOn: string | null = null, conn: any = null;
    if (press) {
        const to = sidePoint(tb, tSide, 2);
        dropOn = await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x as number, y as number); const n = el && el.closest('.react-flow__node'); return n ? n.getAttribute('data-id') : (el ? 'not a node: ' + el.tagName : null); }, [to.x, to.y]);
        await page.mouse.move(press.x, press.y); await page.waitForTimeout(150);
        await ghost.dispatchEvent('mousedown', { clientX: press.x, clientY: press.y, button: 0, buttons: 1 });
        for (let i = 1; i <= 14; i++) { await page.mouse.move(press.x + (to.x - press.x) * i / 14, press.y + (to.y - press.y) * i / 14); await page.waitForTimeout(30); }
        await page.waitForTimeout(120);
        conn = await page.evaluate(`(() => {
          const pane = document.querySelector('.dock-tabpane-active .react-flow');
          const fk = Object.keys(pane).find(k => k.startsWith('__reactFiber$'));
          let f = pane[fk], st = null, d = 0;
          while (f && d++ < 400 && !st) { const p = f.memoizedProps; if (p && p.value && typeof p.value.getState === 'function') { try { const s = p.value.getState(); if (s && 'connection' in s) st = s; } catch (e) {} } f = f.return; }
          const c = st && st.connection;
          if (!c) return null;
          const h = (x) => x ? { node: x.nodeId, id: x.id, type: x.type } : null;
          return { inProgress: !!c.inProgress, isValid: c.isValid ?? null, from: h(c.fromHandle), to: h(c.toHandle) };
        })()`);
        await page.mouse.up(); await page.waitForTimeout(900);
        const pop = page.locator('.edge-type-popup');
        if (await pop.count()) {
            popup = await pop.locator('.edge-type-popup__label').allInnerTexts();
            if (a.pick) {
                const opt = pop.locator('.edge-type-popup__option', { hasText: a.pick }).first();
                if (await opt.count()) { await opt.click(); picked = true; }
            }
            if (!picked) await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(2000);
    }
    const after = await pairState(page, a);
    const vt = await validTargets(page, after.slotId);
    const r = {
        label, tgtObj: a.tgtObj, srcSide: sSide, tgtSide: tSide, ghost: !!gb, pressed: !!press, dropOnTarget: dropOn === a.tgtV, dropOn, conn, popup, picked,
        before, after, propertiesOffersTarget: vt ? vt.includes(a.tgtObj) : null,
        console: consoleLog.slice(mark).filter(t => /EditorV2|canvasToJjom|Upper bound|guard/i.test(t)).slice(0, 10),
    };
    meas(`gesture ${label}`, r);
    return r;
}

/** Sets the active pane's viewport through React Flow's own panZoom (the store found on the fiber). */
async function setViewport(page: Page, x: number, y: number, zoom: number): Promise<boolean> {
    const ok = await page.evaluate(`(async () => {
      const pane = document.querySelector('.dock-tabpane-active .react-flow');
      if (!pane) return false;
      const fk = Object.keys(pane).find(k => k.startsWith('__reactFiber$'));
      let f = pane[fk], st = null, d = 0;
      while (f && d++ < 400 && !st) { const p = f.memoizedProps; if (p && p.value && typeof p.value.getState === 'function') { try { const s = p.value.getState(); if (s && s.panZoom) st = s; } catch (e) {} } f = f.return; }
      if (!st) return false;
      await st.panZoom.setViewport({ x: ${x}, y: ${y}, zoom: ${zoom} });
      return true;
    })()`);
    await page.waitForTimeout(1000);
    return ok as boolean;
}

/** A region of the canvas no fixture node reaches: its own grid, 420 x 600 flow units per cell, shown at zoom 0.5. */
const ZOOM = 0.5;
const region = (ox: number, oy: number) => ({
    cell: (col: number, row: number) => ({ x: ox + col * 420, y: oy + row * 600 }),
    show: (page: Page) => setViewport(page, -ox * ZOOM + 60, -oy * ZOOM + 40, ZOOM),
});

/** A gesture "worked": one more D edge and one DOM edge for the pair, and the target id added to the slot. */
const worked = (g: any) => !!g && !g.error && g.pressed && g.after.domEdges === 1 && g.after.dEdges === 1
    && Array.isArray(g.after.values) && g.after.values.includes(g.tgtObj ?? '') ;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await seed(ctx, false);
const page = await ctx.newPage();
page.on('console', (m) => consoleLog.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => consoleLog.push(`pageerror: ${e.message}`));
mkdirSync(SHOTS, { recursive: true });

try {
    // ── S0 setup ──
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(5000);
    await page.locator('button', { hasText: 'New Project' }).first().click();
    await page.waitForTimeout(1500);
    await page.locator('input[type="text"]').first().fill('SubclassEdge');
    await page.locator('button', { hasText: /^Create/ }).last().click();
    await page.waitForTimeout(6000);
    const pid = await page.evaluate(() => { const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length ? a[a.length - 1].id : null; });
    check('project created', !!pid, pid);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(9000);
    await page.locator('input[type="file"][accept=".ecore"]').setInputFiles(ECORE);
    await page.waitForTimeout(5000);
    await page.locator('input[type="file"][accept=".xmi,.xml"]').setInputFiles(XMI);
    await page.waitForTimeout(6000);
    const close = page.locator('button', { hasText: /^Close$/ }).first();
    if (await close.isVisible().catch(() => false)) { await close.click(); await page.waitForTimeout(500); }
    const pr = await projectInfo(page);
    check('metamodel and model imported', pr.metamodels.length > 0 && pr.models.length > 0, pr);
    const MM = pr.metamodels[0].id, MODEL = pr.models[0].id;

    // ── S1 metamodel tab, class Choice (no superclass) ──
    await openTab(page, MM);
    let I = await ids(page, MM, MODEL);
    check('M2 graph and State vertex', !!I.m2Graph && !!I.v2[I.classes.State], { m2Graph: I.m2Graph, stateV: I.v2[I.classes.State] });
    const choiceV = await createClass(page, I.m2Graph, 'Choice', 900, 40);
    check('Choice class created', !!choiceV, choiceV);

    // ── S2 model tab: the instances that exist before the change, in two regions of their own ──
    // Region A serves the mounted-tab gestures (S4), region B the reopened-tab gestures (S5). Row 0 of each region is
    // created now: a Choice instance (variant: superclass link added to an existing class), a State instance (control)
    // and two Transition instances (empty `target`, so the [1..1] bound does not refuse the link).
    await openTab(page, MODEL);
    I = await ids(page, MM, MODEL);
    check('M1 graph', !!I.m1Graph, I.m1Graph);
    const RA = region(-6000, -6000), RB = region(-6000, -4000);
    const mk = async (cls: string, at: { x: number; y: number }) => {
        const r = await createObject(page, I.m1Graph, I.classes[cls], at);
        check(`instance of ${cls} created`, !!r?.object, r);
        return r!;
    };
    const pre = {
        A: { ch: await mk('Choice', RA.cell(0, 0)), st: await mk('State', RA.cell(1, 0)), tx: await mk('Transition', RA.cell(2, 0)), tx2: await mk('Transition', RA.cell(3, 0)) },
        B: { ch: await mk('Choice', RB.cell(0, 0)), st: await mk('State', RB.cell(1, 0)), tx: await mk('Transition', RB.cell(2, 0)), tx2: await mk('Transition', RB.cell(3, 0)) },
    };
    out.s2 = { modeInfo: await modeInfo(page, MODEL) };
    meas('S2 modeInfo', out.s2);
    const g: Record<string, any> = {};
    const G = (src: { vertex: string; object: string }, tgt: { vertex: string; object: string }, feature: string, pick?: string) =>
        ({ srcObj: src.object, tgtObj: tgt.object, srcV: src.vertex, tgtV: tgt.vertex, feature, m1Graph: I.m1Graph, pick });
    check('region A shown', await RA.show(page), '');
    g.C0 = await gesture(page, 'C0 State -> Transition (outgoing), before the change', G(pre.A.st, pre.A.tx, 'outgoing'));
    await page.screenshot({ path: `${SHOTS}/s2-model-regionA.png` });

    // ── S3 metamodel tab, subclasses added while the model tab stays open ──
    await openTab(page, MM, 4000);
    out.s3hiddenBefore = await modeInfo(page, MODEL);
    const initialV = await createClass(page, I.m2Graph, 'Initial', 900, 260);
    const terminalV = await createClass(page, I.m2Graph, 'Terminal', 1150, 260);
    I = await ids(page, MM, MODEL);
    const stateV = I.v2[I.classes.State];
    const inh = {
        initial: initialV ? await inherit(page, initialV, stateV) : null,
        terminal: terminalV ? await inherit(page, terminalV, stateV) : null,
        choice: choiceV ? await inherit(page, choiceV, stateV) : null,
    };
    await page.waitForTimeout(2000);
    out.s3 = { inh, live: await liveClasses(page, ['State', 'Initial', 'Terminal', 'Choice']), hiddenModelTab: await modeInfo(page, MODEL) };
    meas('S3 after extends', out.s3);
    const live: any = (out.s3 as any).live;
    check('S3 D-layer: Initial, Terminal, Choice extend State', ['Initial', 'Terminal', 'Choice'].every(n => live[n]?.extends?.includes('State')), live);
    check('S3 model tab stayed mounted while hidden', (out.s3 as any).hiddenModelTab.mounted && !(out.s3 as any).hiddenModelTab.active, (out.s3 as any).hiddenModelTab);
    await page.screenshot({ path: `${SHOTS}/s3-metamodel.png` });

    // ── S4 back on the model tab, not reopened ──
    await openTab(page, MODEL, 4000);
    const s4: any = { modeInfo: await modeInfo(page, MODEL) };
    out.s4 = s4;
    meas('S4 modeInfo (mounted tab)', s4);
    I = await ids(page, MM, MODEL);
    const A = { ...pre.A, i1: await mk('Initial', RA.cell(0, 1)), t1: await mk('Terminal', RA.cell(1, 1)), i2: await mk('Initial', RA.cell(2, 1)), t2: await mk('Terminal', RA.cell(3, 1)) };
    s4.modeInfoAfterInstances = await modeInfo(page, MODEL);
    const PAIRS: Array<[string, string]> = [['State', 'Transition'], ['Transition', 'State'], ['Initial', 'Transition'], ['Transition', 'Terminal'],
        ['Initial', 'Terminal'], ['Terminal', 'Initial'], ['Choice', 'Transition']];
    s4.compat = await compatProbe(page, MODEL, PAIRS);
    meas('S4 getCompatibleReferences, memo vs fresh (mounted tab)', s4.compat);
    check('region A shown (S4)', await RA.show(page), '');
    await page.screenshot({ path: `${SHOTS}/s4-model-regionA.png` });
    g.A0 = await gesture(page, 'A0 State -> Transition (outgoing), control after the change', G(A.st, A.tx2, 'outgoing'));
    g.A0t = await gesture(page, 'A0t Transition -> State (target), control after the change', G(A.tx, A.st, 'target', 'target'));
    g.A1 = await gesture(page, 'A1 Initial -> Transition (outgoing, inherited)', G(A.i1, A.tx, 'outgoing'));
    g.A2 = await gesture(page, 'A2 Transition -> Terminal (target: State)', G(A.tx2, A.t1, 'target', 'target'));
    g.A3 = await gesture(page, 'A3 Initial -> Terminal (substates: State)', G(A.i1, A.t1, 'substates'));
    g.A4 = await gesture(page, 'A4 Terminal -> Initial (substates: State), reverse', G(A.t2, A.i2, 'substates'));
    g.A5 = await gesture(page, 'A5 Choice (extends added later) -> Transition (outgoing)', G(A.ch, A.tx, 'outgoing'));
    s4.modeInfoAfterGestures = await modeInfo(page, MODEL);
    await page.screenshot({ path: `${SHOTS}/s4-model-regionA-after.png` });

    // ── S5 close and reopen the model tab ──
    const closed = await closeTab(page, MODEL);
    out.s5closed = { closed, modeInfo: await modeInfo(page, MODEL) };
    check('S5 model tab closed (unmounted)', closed && !(out.s5closed as any).modeInfo.mounted, out.s5closed);
    await openTab(page, MODEL);
    const s5: any = { modeInfo: await modeInfo(page, MODEL) };
    out.s5 = s5;
    meas('S5 modeInfo (reopened)', s5);
    s5.compat = await compatProbe(page, MODEL, PAIRS);
    meas('S5 getCompatibleReferences, memo vs fresh (reopened tab)', s5.compat);
    I = await ids(page, MM, MODEL);
    const B = { ...pre.B, i1: await mk('Initial', RB.cell(0, 1)), t1: await mk('Terminal', RB.cell(1, 1)), i2: await mk('Initial', RB.cell(2, 1)), t2: await mk('Terminal', RB.cell(3, 1)) };
    check('region B shown (S5)', await RB.show(page), '');
    await page.screenshot({ path: `${SHOTS}/s5-model-regionB.png` });
    g.B0 = await gesture(page, 'B0 State -> Transition (outgoing), control after reopen', G(B.st, B.tx2, 'outgoing'));
    g.B0t = await gesture(page, 'B0t Transition -> State (target), control after reopen', G(B.tx, B.st, 'target', 'target'));
    g.B1 = await gesture(page, 'B1 Initial -> Transition (outgoing, inherited)', G(B.i1, B.tx, 'outgoing'));
    g.B2 = await gesture(page, 'B2 Transition -> Terminal (target: State)', G(B.tx2, B.t1, 'target', 'target'));
    g.B3 = await gesture(page, 'B3 Initial -> Terminal (substates: State)', G(B.i1, B.t1, 'substates'));
    g.B4 = await gesture(page, 'B4 Terminal -> Initial (substates: State), reverse', G(B.t2, B.i2, 'substates'));
    g.B5 = await gesture(page, 'B5 Choice (extends added later) -> Transition (outgoing)', G(B.ch, B.tx, 'outgoing'));
    await page.screenshot({ path: `${SHOTS}/s5-model-regionB-after.png` });
    out.gestures = g;

    // ── Verdicts ──
    meas('S4 vs S5 State.concreteSubclasses', { s4: s4.modeInfo?.classes?.State?.subs, s5: s5.modeInfo?.classes?.State?.subs });
    meas('S4 vs S5 Initial.references', { s4: s4.modeInfo?.classes?.Initial?.refs, s5: s5.modeInfo?.classes?.Initial?.refs });
    // Acceptance of F1: the mounted tab's memo carries the post-link ancestry, and the gesture's decision on it equals
    // the fresh one on every pair.
    const fresh4 = s4.modeInfo?.classes;
    check('S4 mounted tab: Initial, Terminal, Choice inherit outgoing and substates',
        ['Initial', 'Terminal', 'Choice'].every(n => JSON.stringify(fresh4?.[n]?.refs) === JSON.stringify(['outgoing', 'substates'])), fresh4);
    check('S4 mounted tab: State lists Choice, Initial, Terminal among its concrete subclasses',
        JSON.stringify([...(fresh4?.State?.subs ?? [])].sort()) === JSON.stringify(['Choice', 'Initial', 'Terminal']), fresh4?.State);
    check('S4 mounted tab: getCompatibleReferences on the memo equals the fresh derivation on every pair',
        !s4.compat?.error && Object.values(s4.compat ?? {}).every((p: any) => JSON.stringify(p.memo) === JSON.stringify(p.fresh)), s4.compat);
    // Every gesture is checked, A1..A5 included (exactly one edge and the value the Properties panel offers), except
    // B0t: xyflow refuses that connection itself (isValid false) on the unmodified code too, with no subclass
    // involved (report §5.3), so it is recorded and not checked.
    for (const k of Object.keys(g)) {
        const r = g[k];
        const line = { worked: worked(r), dropOnTarget: r?.dropOnTarget, conn: r?.conn, popup: r?.popup, picked: r?.picked, values: r?.after?.values?.length, dEdges: r?.after?.dEdges, domEdges: r?.after?.domEdges, properties: r?.propertiesOffersTarget, console: r?.console };
        if (k === 'B0t') meas(`gesture ${k} (recorded, not checked)`, line);
        else check(`gesture ${k} works`, worked(r) && r?.propertiesOffersTarget === true, line);
    }
    // The drop must land on the intended node for every gesture, or the measure is not about the subject.
    check('every drop landed on its target node', Object.values(g).every((r: any) => r?.dropOnTarget), Object.fromEntries(Object.entries(g).map(([k, r]: any) => [k, r?.dropOn])));
} catch (e) {
    failures++;
    console.log('FAIL  exception  ' + ((e as Error).stack || e));
} finally {
    out.console = consoleLog.filter(t => /^(error|warning|pageerror)/.test(t)).slice(0, 60);
    writeFileSync(OUT, JSON.stringify(out, null, 2));
    console.log(`OUT ${OUT}`);
    console.log(`FAILURES=${failures}`);
    await browser.close();
    process.exit(failures);
}
