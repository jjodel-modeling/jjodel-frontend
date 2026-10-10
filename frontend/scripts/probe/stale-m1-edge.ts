/**
 * stale-m1-edge probe (P-2026-10-10-1600, Phase 1). Read-only on sources: it changes no file under `src/`, and it
 * writes only to the throwaway browser profile and to the lane folder.
 *
 * Question: after a reference-slot edit removes an M1 reference value, `useM1ReferenceEdges` deletes the stale
 * DVoidEdge. Does the React Flow edge of that pair leave the canvas, and if not, which layer still holds it?
 * Report: docs/discovery/discovery_2026-10-10_stale_m1_reference_edge.md.
 *
 * Drives the real app on its own dev server (never 3001), 1440x900, light, offline user. One fresh project:
 *
 *   Setup  Import `StateMachine.ecore` and `sample-StateMachine.xmi` through the project page's file inputs, open
 *          the model. The XMI importer lists nested objects in `DModel.objects`, so every State and Transition gets
 *          a vertex and the M1 reference edges are drawn. The subject pair is Running --outgoing--> stop: Running is
 *          the first object whose `outgoing` slot holds two values, `stop` the first of them. No other tuple backs
 *          that (source vertex, target vertex) pair.
 *   R1     Remove `stop` from Running.outgoing the way the Slots panel does (`Info.tsx` `remove`:
 *          `LValue.setValueAtPosition(index, undefined, { isPtr: true })`). Snapshot at 0, 1 and 5 s.
 *   A1     Add it back the way the panel's select does (`Info.tsx` `changeDValue`: a TRANSACTION around
 *          `setValueAtPosition(index, target, { isPtr: true })`). Snapshot at 0, 1 and 5 s.
 *   R2     Remove it again. Snapshot at 0, 1 and 5 s.
 *   A2     Add it back again (the second round trip, for the accumulation). Snapshot at 0, 1 and 5 s.
 *   R3     Remove it a third time. Snapshot at 0, 1 and 5 s.
 *   C1     Control, after R3: for every D edge of the pair that has left `idlookup` but is still listed in
 *          `graph.subElements`, scrub the id from `subElements` with the SetField-only write `m1EdgeSweep.ts` uses
 *          (`SetFieldAction.new(graphId, 'subElements', id, '-=', true)`), in one TRANSACTION. Snapshot at 0, 1, 5 s.
 *          If the stale React Flow edges leave after it, the incremental removal of `useJjomSync` works once the id
 *          leaves `subElements`, and the miss is upstream of it.
 *
 * Each snapshot reads, for the subject pair: the D edges in `graph.subElements` (live and dangling), every D edge
 * id ever seen for the pair with its `idlookup` and `subElements` membership, an `idlookup` scan, EditorV2's edges
 * state (`useEdgesState`, read from the React fiber of `EditorV2Inner`), the `edges` prop React Flow receives, React
 * Flow's internal store, and the `.react-flow__edge` elements of the pane.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/stale-m1-edge.ts --port <n> --id P-2026-10-10-1600
 * Env:  SME_OUT  JSON output (default ~/.jjodel-lanes/P-2026-10-10-1600/probe_stale_m1_edge.json)
 *
 * Exit code: the number of failed SETUP checks (import, open, subject found, baseline drawn, writes landed). The
 * measures are MEAS lines and do not fail.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3123/').replace(/\/$/, '');
if (/:3001$/.test(URL)) throw new Error('never 3001');
const OUT = process.env.SME_OUT || `${process.env.HOME}/.jjodel-lanes/P-2026-10-10-1600/probe_stale_m1_edge.json`;
const SHOTS = dirname(OUT);
const FIX = new globalThis.URL('../../src/__tests__/fixtures/xmi-m1/', import.meta.url).pathname;
const ECORE = FIX + 'StateMachine.ecore';
const XMI = FIX + 'sample-StateMachine.xmi';
const SETTLE = 12000;
const TIMES = [0, 1000, 5000];

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 1500)}`);
};
const meas = (label: string, v: unknown) => console.log(`MEAS  ${label}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 4000)}`);

// ── Page reads ────────────────────────────────────────────────────────────────────────────────────────

/** The subject: the model's v2-flow graph, the first object with two `outgoing` values, its first target, both vertices. */
const FIND_SUBJECT = (modelId: string) => `(() => {
  const L = (window.store || window.windoww.store).getState().idlookup;
  const M = ${JSON.stringify(modelId)};
  const m = L[M];
  const g = Object.values(L).find(x => x && x.className === 'DGraph' && x.model === M && x.graphStyle === 'v2-flow');
  if (!m || !g) return { error: 'no model or no v2-flow graph', model: !!m, graph: !!g };
  const nameOf = (id) => (L[id] && L[id].name !== undefined) ? L[id].name : id;
  const slot = (o, n) => (o.features || []).map(fid => L[fid]).find(v => v && (v.name === n || nameOf(v.instanceof) === n));
  const label = (o) => { const s = slot(o, 'name'); return s && s.values ? s.values[0] : o.name; };
  const vOf = new Map();
  for (const se of (g.subElements || [])) { const v = L[se]; if (v && String(v.className).includes('Vertex') && v.model) vOf.set(v.model, se); }
  for (const oid of (m.objects || [])) {
    const o = L[oid]; if (!o) continue;
    const out = slot(o, 'outgoing');
    const vals = out && Array.isArray(out.values) ? out.values.filter(v => typeof v === 'string') : [];
    if (vals.length < 2) continue;
    const tgt = vals[0];
    return { graphId: g.id, srcObj: oid, srcName: label(o), valueId: out.id, refMeta: out.instanceof, tgtObj: tgt, tgtName: label(L[tgt] || {}),
             index: out.values.indexOf(tgt), srcV: vOf.get(oid) || null, tgtV: vOf.get(tgt) || null, values: Array.from(out.values, v => v ?? null) };
  }
  return { error: 'no object with two outgoing values' };
})()`;

/**
 * One snapshot of the subject pair across the layers. `a.hook` is the index, in EditorV2Inner's hook list, of the
 * edges state found at baseline (-1 to search for it).
 */
const SNAP = (a: any) => `(() => {
  const a = ${JSON.stringify(a)};
  const S = (window.store || window.windoww.store).getState();
  const L = S.idlookup;
  const g = L[a.graphId] || {};
  const subs = g.subElements || [];
  const isPair = (d) => d && typeof d.className === 'string' && d.className.includes('Edge') && d.start === a.srcV && d.end === a.tgtV;
  const dInSubs = subs.filter(id => isPair(L[id]));
  const danglingInSubs = subs.filter(id => !L[id]);
  const scan = Object.keys(L).filter(id => isPair(L[id]));
  const knownIds = Array.from(new Set([...(a.knownIds || []), ...dInSubs, ...scan]));
  const sv = L[a.srcV] || {}, tv = L[a.tgtV] || {};
  const known = knownIds.map(id => ({ id, inLookup: !!L[id], inSubElements: subs.includes(id),
      inSrcEdgesOut: (sv.edgesOut || []).includes(id), inTgtEdgesIn: (tv.edgesIn || []).includes(id) }));
  const slot = L[a.valueId];
  const values = slot && slot.values ? Array.from(slot.values, v => v ?? null) : null;

  const pane = document.querySelector('[id="' + a.modelId + '"].dock-tabpane-active') || document;
  const rfEl = pane.querySelector('.react-flow');
  const fk = rfEl ? Object.keys(rfEl).find(k => k.startsWith('__reactFiber$')) : null;
  let f = fk ? rfEl[fk] : null;
  let propEdges = null, storeEdges = null, stateEdges = null, hookIndex = -1, editorFound = false, depth = 0;
  const edgeLike = (v) => Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === 'object' && 'source' in v[0] && 'target' in v[0] && 'id' in v[0];
  while (f && depth++ < 400) {
    const p = f.memoizedProps;
    if (!propEdges && p && Array.isArray(p.edges) && Array.isArray(p.nodes)) propEdges = p.edges;
    if (!storeEdges && p && p.value && typeof p.value.getState === 'function') {
      try { const st = p.value.getState(); if (st && Array.isArray(st.edges)) storeEdges = st.edges; } catch (e) {}
    }
    const name = f.type && (f.type.displayName || f.type.name);
    if (!editorFound && name === 'EditorV2Inner') {
      editorFound = true;
      let h = f.memoizedState, i = 0;
      while (h) {
        const v = h.memoizedState;
        if (a.hook >= 0 ? i === a.hook : edgeLike(v)) { stateEdges = Array.isArray(v) ? v : null; hookIndex = i; break; }
        h = h.next; i++;
      }
    }
    f = f.return;
  }
  const pick = (arr) => arr ? arr.filter(e => e.source === a.srcV && e.target === a.tgtV)
      .map(e => ({ id: e.id, hidden: !!e.hidden, sourceHandle: e.sourceHandle ?? null, targetHandle: e.targetHandle ?? null })) : null;
  const domAll = rfEl ? [...rfEl.querySelectorAll('.react-flow__edge')] : [];
  const dom = domAll.map(el => {
    const m = (el.getAttribute('aria-label') || '').match(/^Edge from (\\S+) to (\\S+)$/);
    return { id: el.getAttribute('data-id') || el.getAttribute('data-testid') || null, source: m ? m[1] : null, target: m ? m[2] : null };
  }).filter(e => e.source === a.srcV && e.target === a.tgtV);
  // Handles the subject's source node gives its edges, every edge (any target): a stale edge holds a slot.
  const srcHandles = stateEdges ? stateEdges.filter(e => e.source === a.srcV || e.target === a.srcV)
      .map(e => (e.source === a.srcV ? 'out:' + (e.sourceHandle ?? '-') : 'in:' + (e.targetHandle ?? '-')) + (L[e.id] ? '' : ' [D gone]')) : null;
  return {
    t: Date.now(), values,
    d: { inSubElements: dInSubs.length, inSubElementsIds: dInSubs, danglingInSubElements: danglingInSubs.length, scanLive: scan.length, known },
    rf: { editorFound, hookIndex, state: pick(stateEdges), stateTotal: stateEdges ? stateEdges.length : null, prop: pick(propEdges), propTotal: propEdges ? propEdges.length : null,
          store: pick(storeEdges), storeTotal: storeEdges ? storeEdges.length : null, domPair: dom.length, domPairIds: dom.map(e => e.id), domTotal: domAll.length, srcHandles },
    knownIds,
  };
})()`;

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

/** Info.tsx `remove`: `value.setValueAtPosition(index, undefined, { isPtr })` on the LValue. */
async function removeValue(page: Page, valueId: string, index: number): Promise<any> {
    return page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const v = j.L.fromPointer(${JSON.stringify(valueId)});
      return v.setValueAtPosition(${index}, undefined, { isPtr: true });
    })()`);
}

/** Info.tsx `changeDValue`: a TRANSACTION around `value.setValueAtPosition(index, target, { isPtr })`. */
async function addValue(page: Page, valueId: string, index: number, target: string): Promise<any> {
    return page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      let out = null;
      j.TRANSACTION('change value (sidebar)', () => {
        const v = j.L.fromPointer(${JSON.stringify(valueId)});
        out = v.setValueAtPosition(${index}, ${JSON.stringify(target)}, { isPtr: true });
      });
      return out;
    })()`);
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────────────

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await seed(ctx, false);
const page: Page = await ctx.newPage();
const pageErrors: string[] = [];
const consoleErrors: string[] = [];
const hookLogs: string[] = [];
page.on('pageerror', (e: Error) => pageErrors.push(e.message.slice(0, 300)));
page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error') consoleErrors.push(t.slice(0, 300));
    if (t.startsWith('[useM1ReferenceEdges]') || t.startsWith('[DEDUP]')) hookLogs.push(`${Date.now()} ${t.slice(0, 600)}`);
});
const result: any = { url: URL, started: new Date().toISOString(), steps: [] };
const out = () => { mkdirSync(dirname(OUT), { recursive: true }); writeFileSync(OUT, JSON.stringify({ ...result, hookLogs, pageErrors, consoleErrors }, null, 1)); };

let subj: any = null;
let hook = -1;
let knownIds: string[] = [];
async function snap(label: string): Promise<any> {
    const s: any = await page.evaluate(SNAP({ ...subj, hook, knownIds }));
    knownIds = s.knownIds;
    if (hook < 0 && s.rf.hookIndex >= 0) hook = s.rf.hookIndex;
    const line = {
        values: s.values,
        D: `subElements ${s.d.inSubElements} live (${s.d.danglingInSubElements} dangling ids in the graph), idlookup ${s.d.scanLive}`,
        known: s.d.known.map((k: any) => `${k.id.slice(-8)} lookup=${k.inLookup ? 1 : 0} subs=${k.inSubElements ? 1 : 0} out=${k.inSrcEdgesOut ? 1 : 0} in=${k.inTgtEdgesIn ? 1 : 0}`).join(', '),
        RF: `state ${s.rf.state?.length ?? 'n/a'} prop ${s.rf.prop?.length ?? 'n/a'} store ${s.rf.store?.length ?? 'n/a'} dom ${s.rf.domPair}`,
        rfIds: (s.rf.state ?? []).map((e: any) => `${e.id.slice(-8)}${e.hidden ? ' hidden' : ''} ${e.sourceHandle}->${e.targetHandle}`).join(', '),
        totals: `state ${s.rf.stateTotal} prop ${s.rf.propTotal} store ${s.rf.storeTotal} dom ${s.rf.domTotal}`,
        srcHandles: (s.rf.srcHandles ?? []).join(' '),
    };
    meas(label, line);
    return s;
}

/** A crop around the subject pair's two nodes (record only; the DOM counts are the evidence). */
async function shot(name: string): Promise<void> {
    const clip: any = await page.evaluate(`(() => {
      const a = ${JSON.stringify({ srcV: subj?.srcV, tgtV: subj?.tgtV, modelId: subj?.modelId })};
      const pane = document.querySelector('[id="' + a.modelId + '"].dock-tabpane-active') || document;
      const r = [a.srcV, a.tgtV].map(id => pane.querySelector('.react-flow__node[data-id="' + id + '"]')).filter(Boolean).map(el => el.getBoundingClientRect());
      if (!r.length) return null;
      const x0 = Math.max(0, Math.min(...r.map(b => b.left)) - 60), y0 = Math.max(0, Math.min(...r.map(b => b.top)) - 60);
      const x1 = Math.min(innerWidth, Math.max(...r.map(b => b.right)) + 60), y1 = Math.min(innerHeight, Math.max(...r.map(b => b.bottom)) + 60);
      return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    })()`);
    await page.screenshot({ path: `${SHOTS}/stale-m1-edge_${name}.png`, ...(clip && clip.width > 0 && clip.height > 0 ? { clip } : {}) });
}

async function series(step: string, act: () => Promise<any>): Promise<any> {
    const before = Date.now();
    const ret = await act();
    const snaps: any[] = [];
    for (const t of TIMES) {
        const wait = before + t - Date.now();
        if (wait > 0) await page.waitForTimeout(wait);
        snaps.push({ at: t, ...(await snap(`${step} t=${t / 1000}s`)) });
    }
    const entry = { step, returned: ret, snaps };
    result.steps.push(entry);
    out();
    return entry;
}

try {
    // ── Setup: a fresh project, the StateMachine metamodel and its instance ─────────────────────────────
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(5000);
    await page.locator('button', { hasText: 'New Project' }).first().click();
    await page.waitForTimeout(1500);
    await page.locator('input[type="text"]').first().fill('StaleM1Edge');
    await page.locator('button', { hasText: /^Create/ }).last().click();
    await page.waitForTimeout(6000);
    const pid = await page.evaluate(`(() => { const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length ? a[a.length - 1].id : null; })()`) as string | null;
    check('project created', !!pid, String(pid));
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(9000);
    await page.locator('input[type="file"][accept=".ecore"]').setInputFiles(ECORE);
    await page.waitForTimeout(5000);
    await page.locator('input[type="file"][accept=".xmi,.xml"]').setInputFiles(XMI);
    await page.waitForTimeout(6000);
    // The import summary modal sits over the canvas: close it so the crops show the pair.
    const close = page.locator('button', { hasText: /^Close$/ }).first();
    if (await close.isVisible().catch(() => false)) { await close.click(); await page.waitForTimeout(500); }
    const pr = await projectInfo(page);
    check('metamodel imported', pr.metamodels.length > 0, pr.metamodels);
    check('M1 model imported', pr.models.length > 0, pr.models);
    const model = pr.models[pr.models.length - 1];
    await openModel(page, model.id);

    const found: any = await page.evaluate(FIND_SUBJECT(model.id));
    check('subject found (object with two outgoing values, both vertices)', !found.error && !!found.srcV && !!found.tgtV, found);
    subj = { ...found, modelId: model.id };
    result.subject = subj;
    await page.evaluate(`window.__m1RefEdgesDebug = true`);

    const base = await snap('baseline');
    result.baseline = base;
    check('baseline: EditorV2 edges state located', base.rf.editorFound && base.rf.hookIndex >= 0, base.rf);
    check('baseline: the pair has one D edge and one RF edge, drawn', base.d.inSubElements === 1 && base.rf.state?.length === 1 && base.rf.domPair === 1,
        { d: base.d.inSubElements, state: base.rf.state, dom: base.rf.domPair });
    await shot('baseline');
    out();

    // ── R1 / A1 / R2 / A2 / R3: the round trips ─────────────────────────────────────────────────────────
    const r1 = await series('R1 remove', () => removeValue(page, subj.valueId, subj.index));
    const r1last = r1.snaps[r1.snaps.length - 1];
    check('R1 landed: the slot no longer holds the target', !(r1last.values || []).includes(subj.tgtObj), r1last.values);
    const holeIndex = () => {
        const v = (result.steps[result.steps.length - 1].snaps.slice(-1)[0].values || []) as Array<string | null>;
        const i = v.indexOf(null);
        return i >= 0 ? i : v.length;
    };
    const a1 = await series('A1 add back', () => addValue(page, subj.valueId, holeIndex(), subj.tgtObj));
    check('A1 landed: the slot holds the target again', (a1.snaps.slice(-1)[0].values || []).includes(subj.tgtObj), a1.snaps.slice(-1)[0].values);
    const idxOf = () => (result.steps[result.steps.length - 1].snaps.slice(-1)[0].values || []).indexOf(subj.tgtObj);
    const r2 = await series('R2 remove again', () => removeValue(page, subj.valueId, idxOf()));
    check('R2 landed', !(r2.snaps.slice(-1)[0].values || []).includes(subj.tgtObj), r2.snaps.slice(-1)[0].values);
    await shot('after_R2');
    const a2 = await series('A2 add back again', () => addValue(page, subj.valueId, holeIndex(), subj.tgtObj));
    check('A2 landed', (a2.snaps.slice(-1)[0].values || []).includes(subj.tgtObj), a2.snaps.slice(-1)[0].values);
    await shot('after_A2');
    const r3 = await series('R3 remove a third time', () => removeValue(page, subj.valueId, idxOf()));
    check('R3 landed', !(r3.snaps.slice(-1)[0].values || []).includes(subj.tgtObj), r3.snaps.slice(-1)[0].values);

    // ── C1: scrub the dangling ids from subElements (m1EdgeSweep's write), and watch the RF state ───────
    const last = r3.snaps.slice(-1)[0];
    const dangling = last.d.known.filter((k: any) => !k.inLookup && k.inSubElements).map((k: any) => k.id);
    meas('C1 dangling pair ids in subElements before the scrub', dangling);
    await series('C1 scrub subElements', () => page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const ids = ${JSON.stringify(dangling)};
      if (!ids.length) return 'nothing to scrub';
      j.TRANSACTION('probe: scrub dangling M1 edge ids', () => {
        for (const id of ids) j.SetFieldAction.new(${JSON.stringify(subj.graphId)}, 'subElements', id, '-=', true);
      });
      return 'scrubbed ' + ids.length;
    })()`));
    await shot('after_C1');
} catch (err) {
    failures++;
    console.log('FAIL  probe threw  ' + String((err as Error)?.stack ?? err).slice(0, 1500));
} finally {
    meas('hookLogs', hookLogs.length);
    for (const l of hookLogs.slice(0, 40)) meas('hookLog', l);
    meas('pageErrors', pageErrors.length);
    meas('consoleErrors', consoleErrors.length);
    result.finished = new Date().toISOString();
    out();
    meas('json', OUT);
    await browser.close();
}
console.log(`FAILURES ${failures}`);
process.exit(failures);
