/**
 * dcn-snapshot (P-2026-11-08-2216, R-DCN-30): the snapshot of a DCN run written as a new model, in the app.
 * The export of dcn-drone-fixture imported on its own dev server, the Simulation panel on the object diagram, Reset with
 * a fixed seed, the Ticks to Ready, dji.takeOff(), three Ticks; then `saveRunSnapshot` by the entry lane 6 will use:
 *   - the new model `drone (snapshot step 24)`, its objects and links equal the source's by containment path, name and
 *     classifier, σ on the slots of dji; the source model byte-equal; `runSignature` unchanged;
 *   - one undo removes the new model and nothing else;
 *   - written again, opened: the vertices keep the source's layout (P-2026-11-08-2320), no node over dji, crop
 *     1-snapshot-open, the rows of dji against the node; a Reset on the new
 *     model classifies dji as Flying;
 *   - saved and reloaded: the snapshot is still there with its σ (LIR smoke: existing project opens, save and reopen).
 *
 * Run:  node frontend/scripts/lane-run.mjs probe ~/jjodel-w-dcn-s5 frontend/scripts/probe/dcn-snapshot.ts \
 *         --port 3157 --id P-2026-11-08-2216
 * Env:  DCN_FILE  the export (default ~/jjodel-demo-exports/dcn/dcn-drone-objects.jjodel)
 *       DCN_CROPS the crops directory (default ~/.jjodel-lanes/P-2026-11-08-2320/crops)
 *       DCN_SEED  the seed of Reset (default 4242)
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { seed, setTheme, SETTLE_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3157/').replace(/\/$/, '');
const FILE = process.env.DCN_FILE || `${homedir()}/jjodel-demo-exports/dcn/dcn-drone-objects.jjodel`;
const CROPS = (process.env.DCN_CROPS || `${homedir()}/.jjodel-lanes/P-2026-11-08-2320/crops`).replace(/\/$/, '');
const SEED = Number(process.env.DCN_SEED || 4242);
const MAX_TICKS = 20;
const SNAPSHOT_NAME = 'drone (snapshot step 24)';
const BRIDGE = '/src/components/editor-v2/sim/simBridge.ts';
const PROBLEMS = '/src/components/editor-v2/problems/dcnToProblems.ts';
const RUNS = '/src/components/editor-v2/sim/simRunState.ts';
const WRITER = '/src/components/editor-v2/sim/simSnapshotWrite.ts';

const { ev } = await import('./bpmn-lanes-fixture.ts');

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
    if (ok) pass++; else fail++;
};
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v).slice(0, 3000)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const panel = (page: Page) => page.locator('.sim-panel--open').filter({ visible: true }).first();

type PanelState = { chips: string[]; pill: string | null; line: string | null; hasReset: boolean; shownPanels: number };
const readPanel = (page: Page): Promise<PanelState> => page.evaluate(() => {
    // Not offsetParent: the panel of a tab in the background keeps one, and would be read in place of the active tab's.
    const shown = (e: Element) => { const c = getComputedStyle(e); return c.visibility !== 'hidden' && c.display !== 'none' && e.getClientRects().length > 0; };
    const open = [...document.querySelectorAll('.sim-panel--open')].filter(shown);
    const p = open[0];
    const txt = (e: Element | null | undefined) => (e ? (e.textContent ?? '').trim() : null);
    return {
        chips: [...(p?.querySelectorAll('.sim-panel__chips .sim-panel__marking-chip') ?? [])].map((e) => (e.textContent ?? '').trim()),
        pill: txt(p?.querySelector('.sim-panel__status-pill')),
        line: txt(p?.querySelector('.sim-panel__status-line')),
        hasReset: !!p?.querySelector('.sim-panel__btn[title="Reset"]'),
        shownPanels: open.length,
    };
});

async function press(page: Page, match: RegExp) {
    await panel(page).locator('.sim-panel__events .sim-panel__event').filter({ has: page.locator('span', { hasText: match }) }).first().click();
    await wait(page, 700);
}

/** Opens the panel of the visible model and presses Reset on the fixed seed. */
async function openAndReset(page: Page) {
    await page.locator('.sim-panel--closed .sim-panel__chip').filter({ visible: true }).first().click();
    await wait(page, 900);
    await panel(page).locator('select[aria-label="Choices"]').selectOption('random');
    await wait(page, 300);
    await page.evaluate((s) => {
        const c = window.crypto; const orig = c.getRandomValues.bind(c);
        (window as any).__restoreRng = () => { c.getRandomValues = orig; };
        c.getRandomValues = ((x: any) => { if (x instanceof Uint32Array && x.length === 1) { x[0] = s; return x; } return orig(x); }) as any;
    }, SEED);
    await panel(page).locator('.sim-panel__btn[title="Reset"]').first().click();
    await wait(page, 1200);
    await page.evaluate(() => (window as any).__restoreRng());
}

const traceLength = (page: Page, mid: string) => ev<number | null>(page,
    `const s = await import('${RUNS}'); const r = s.getSimRun(a); return r ? (r.trace ?? []).length : null;`, mid, 0);

/** What the model holds that the store must leave alone: the model, its objects, their slots. */
const sourceBytes = (page: Page, mid: string) => ev<string>(page, `
    const { collectModelObjectIds } = await import('${BRIDGE}');
    const l = w.store.getState().idlookup;
    const keep = new Set([a]);
    for (const id of collectModelObjectIds(l, a)) { keep.add(id); for (const v of l[id].features ?? []) keep.add(v); }
    return JSON.stringify([...keep].sort().map((k) => [k, l[k]]));`, mid, 0);

type Signature = { computed: string; stored: string | null; config: string | null };
const signature = (page: Page, mid: string) => ev<Signature>(page, `
    const b = await import('${BRIDGE}'); const s = await import('${RUNS}');
    const l = w.store.getState().idlookup; const stored = s.getSimRun(a)?.signature ?? null;
    const config = [l[a]?.instanceof ?? null, a, null].find((c) => b.runSignature(l, a, c) === stored);
    return { computed: b.runSignature(l, a, config ?? null), stored, config: config === undefined ? 'none' : config };`, mid, 0);

type Dump = Record<string, { attrs: Record<string, unknown[]>; refs: Record<string, string[]> }>;
/** The model by containment path: metaclass, name, the place in the slot that holds it; targets by the same path. */
const dump = (page: Page, mid: string) => ev<Dump>(page, `
    const { collectModelObjectIds } = await import('${BRIDGE}');
    const l = w.store.getState().idlookup;
    const nameOf = (x) => l[x]?.name ?? '?';
    const paths = new Map();
    const pathOf = (id) => {
        if (paths.has(id)) return paths.get(id);
        const o = l[id]; const father = l[o.father]; const self = nameOf(o.instanceof) + ':' + (o.name ?? '');
        const p = father?.className === 'DValue'
            ? pathOf(father.father) + '/' + nameOf(father.instanceof) + '[' + (father.values ?? []).indexOf(id) + ']' + self
            : '/' + self;
        paths.set(id, p); return p;
    };
    const out = {};
    for (const id of collectModelObjectIds(l, a)) {
        const attrs = {}; const refs = {};
        for (const v of l[id].features ?? []) {
            const d = l[v]; if (!d) continue;
            const values = (d.values ?? []).filter((x) => x !== null && x !== undefined);
            if (l[d.instanceof]?.className === 'DReference') refs[nameOf(d.instanceof)] = values.map((x) => l[x] ? pathOf(x) : 'EXTERNAL:' + x);
            else attrs[nameOf(d.instanceof)] = values;
        }
        out[pathOf(id)] = { attrs, refs };
    }
    return out;`, mid, 0);

function compare(source: Dump, snapshot: Dump) {
    const onlySource = Object.keys(source).filter((k) => !(k in snapshot));
    const onlySnapshot = Object.keys(snapshot).filter((k) => !(k in source));
    const refDiffs: Array<{ path: string; feature: string; from: string[]; to: string[] }> = [];
    const attrDiffs: Array<{ path: string; feature: string; from: unknown[]; to: unknown[] }> = [];
    for (const path of Object.keys(source)) {
        const s = source[path]; const n = snapshot[path];
        if (!n) continue;
        for (const feature of new Set([...Object.keys(s.refs), ...Object.keys(n.refs)])) {
            if (JSON.stringify(s.refs[feature] ?? []) !== JSON.stringify(n.refs[feature] ?? [])) refDiffs.push({ path, feature, from: s.refs[feature] ?? [], to: n.refs[feature] ?? [] });
        }
        for (const feature of new Set([...Object.keys(s.attrs), ...Object.keys(n.attrs)])) {
            if ((s.attrs[feature] ?? []).map(String).join() !== (n.attrs[feature] ?? []).map(String).join()) attrDiffs.push({ path, feature, from: s.attrs[feature] ?? [], to: n.attrs[feature] ?? [] });
        }
    }
    return { total: Object.keys(source).length, totalSnapshot: Object.keys(snapshot).length, onlySource, onlySnapshot, refDiffs, attrDiffs };
}

/** The slots of an instance, read by the DCN binding of its model: feature name to the values of the first holder. */
const slotsOf = (page: Page, mid: string, instance: string) => ev<Record<string, unknown[]> | null>(page, `
    const { collectModelObjectIds } = await import('${BRIDGE}');
    const { dcnInputOf } = await import('${PROBLEMS}');
    const l = w.store.getState().idlookup;
    const b = dcnInputOf(l, a.mid)?.binding; if (!b) return null;
    const o = collectModelObjectIds(l, a.mid).map((id) => l[id]).find((x) => x.name === a.instance); if (!o) return null;
    const of = (owner, feature) => (owner?.features ?? []).map((id) => l[id]).find((d) => d?.instanceof === feature)?.values ?? [];
    const out = {};
    for (const sid of of(o, b.slotContainer)) {
        const slot = l[sid]; if (!slot) continue;
        const prop = of(slot, b.definingFeature)[0]; const holder = l[of(slot, b.valueHolder)[0]];
        const held = (holder?.features ?? []).map((id) => l[id]).filter(Boolean);
        const vals = held.filter((d) => l[d.instanceof]?.className !== 'DReference').flatMap((d) => d.values ?? []).filter((x) => x !== null && x !== undefined && x !== '');
        const refs = held.filter((d) => l[d.instanceof]?.className === 'DReference').flatMap((d) => (d.values ?? []).map((x) => l[x]?.name ?? x));
        out[l[prop]?.name ?? String(prop)] = vals.length ? vals : refs;
    }
    return out;`, { mid, instance }, 0);

type Store = { keys: string[]; models: string[]; names: string[]; graphs: number; undo: number; redo: number };
const storeState = (page: Page) => ev<Store>(page, `
    const j = await import('/src/joiner/index.ts');
    const p = w.LProject.getProject();
    const h = window.statehistory?.[j.DUser.current] || { undoable: [], redoable: [] };
    return { keys: Object.keys(j.store.getState().idlookup).sort(), models: p.models.map((m) => m.id), names: p.models.map((m) => m.name),
        graphs: (p.graphs ?? []).length, undo: h.undoable.length, redo: h.redoable.length };`, undefined, 0);

type WriteResult = { ok: boolean; modelId: string | null; name: string | null; unwritten: unknown[]; problems: string[]; ms: number };
const writeSnapshot = (page: Page, mid: string) => ev<WriteResult>(page, `
    const snap = await import('${WRITER}'); const s = await import('${RUNS}');
    const t0 = performance.now();
    const r = await snap.saveRunSnapshot(a, s.getSimRun(a).trace.length);
    return { ...r, ms: Math.round(performance.now() - t0) };`, mid, 300);

const openModel = (page: Page, mid: string) => ev<boolean>(page, `
    const dm = await import('/src/components/abstract/DockManager.tsx');
    await dm.default.open2(w.LPointerTargetable.fromPointer(a)); return true;`, mid, 8000);

// The edges of an opened model, "src→tgt" by object name: stored in its v2-flow graph and drawn in the active tab. nodes is the control on the DOM query, unparsed the edges with no readable ends.
type EdgeRead = { nodes: number; drawn: string[]; unparsed: number; stored: string[]; vertexEnds: number };
const edgesOf = (page: Page, mid: string) => ev<EdgeRead>(page, `
    const l = w.store.getState().idlookup;
    const end = (v) => l[l[v]?.model]?.name ?? '?';
    const g = Object.values(l).find((d) => d && d.className === 'DGraph' && d.model === a && d.graphStyle === 'v2-flow');
    const mine = (g?.subElements ?? []).map((x) => l[x]).filter((x) => x && String(x.className).includes('Edge'));
    const visible = (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
    const shown = [...document.querySelectorAll('.dock-tabpane-active .react-flow__edge')].filter(visible);
    const ends = shown.map((e) => (e.getAttribute('aria-label') ?? '').match(/^Edge from (\\S+) to (\\S+)$/)).filter(Boolean);
    return {
        nodes: [...document.querySelectorAll('.dock-tabpane-active .react-flow__node')].filter(visible).length,
        drawn: ends.map((m) => end(m[1]) + '→' + end(m[2])).sort(),
        unparsed: shown.length - ends.length,
        stored: mine.map((e) => end(e.start) + '→' + end(e.end)).sort(),
        vertexEnds: mine.filter((e) => l[e.start]?.className === 'DVertex' && l[e.end]?.className === 'DVertex').length,
    };`, mid, 0);

// The vertices of source and snapshot in their v2-flow graph, paired by containment, name and classifier: what differs in the seed or in the records.
type LayoutDiff = { pairs: number; sourceObjects: number; snapshotObjects: number; withRecords: number; noSnapshotVertex: string[]; differ: Array<{ path: string; source: unknown; snapshot: unknown }> };
const layoutDiff = (page: Page, sourceId: string, snapshotId: string) => ev<LayoutDiff>(page, `
    const { collectModelObjectIds } = await import('${BRIDGE}');
    const l = w.store.getState().idlookup;
    const nameOf = (x) => l[x]?.name ?? '?';
    const pathOf = (id) => {
        const o = l[id]; const father = l[o.father]; const self = nameOf(o.instanceof) + ':' + (o.name ?? '');
        return father?.className === 'DValue' ? pathOf(father.father) + '/' + nameOf(father.instanceof) + '[' + (father.values ?? []).indexOf(id) + ']' + self : '/' + self;
    };
    const read = (mid) => {
        const g = Object.values(l).find((d) => d && d.className === 'DGraph' && d.model === mid && d.graphStyle === 'v2-flow');
        const byObject = new Map((g?.subElements ?? []).map((x) => l[x]).filter((x) => x && x.className === 'DVertex').map((x) => [x.model, x]));
        return new Map(collectModelObjectIds(l, mid).map((id) => [pathOf(id), byObject.get(id)]));
    };
    const box = (v) => ({ x: v.x, y: v.y, w: v.w, h: v.h, isResized: !!v.isResized, records: v.layoutByViewpoint ?? {} });
    const sorted = (b) => JSON.stringify({ ...b, records: Object.fromEntries(Object.entries(b.records).sort()) });
    const src = read(a.s); const snap = read(a.t);
    const noSnapshotVertex = []; const differ = []; let pairs = 0; let withRecords = 0;
    for (const [path, v] of src) {
        if (!v) continue;
        const t = snap.get(path);
        if (!t) { noSnapshotVertex.push(path); continue; }
        pairs++;
        if (Object.keys(v.layoutByViewpoint ?? {}).length > 0) withRecords++;
        if (sorted(box(v)) !== sorted(box(t))) differ.push({ path, source: box(v), snapshot: box(t) });
    }
    return { pairs, sourceObjects: src.size, snapshotObjects: snap.size, withRecords, noSnapshotVertex: noSnapshotVertex.slice(0, 8), differ: differ.slice(0, 6) };`, { s: sourceId, t: snapshotId }, 0);

// The node of `dji` on the visible canvas, by vertex or object id: its box, what is painted below its bottom edge, what scrolls inside it.
type NodeBox = {
    count: number; rendered: number; left: number; top: number; width: number; height: number; text: string; zoom: string | null;
    below: string[]; overflowing: Array<{ cls: string; scroll: number; client: number; overflow: string }>;
    covered: string[]; coveredBy: Array<{ text: string; top: number }>;
};
const readDjiNode = (page: Page, wanted: string[]) => page.evaluate((ids): NodeBox | { count: number; rendered: number; dataIds: Array<string | null> } => {
    const shown = (e: Element) => { const c = getComputedStyle(e); return c.visibility !== 'hidden' && c.display !== 'none' && e.getClientRects().length > 0; };
    const all = [...document.querySelectorAll('.react-flow__node')];
    const nodes = all.filter(shown);
    const node = nodes.find((n) => ids.includes(n.getAttribute('data-id') ?? ''));
    if (!node) return { count: nodes.length, rendered: all.length, dataIds: nodes.map((n) => n.getAttribute('data-id')).slice(0, 8) };
    const r = node.getBoundingClientRect();
    // An instance name can sit in an input: its value counts as text.
    const rows = [...node.querySelectorAll('*')].filter((c) => c.children.length === 0)
        .map((c) => ({ c, t: ((c.tagName === 'INPUT' || c.tagName === 'TEXTAREA' ? (c as HTMLInputElement).value : c.textContent) ?? '').trim() }))
        .filter((x) => x.t !== '');
    const below = rows.filter((x) => x.c.getBoundingClientRect().bottom > r.bottom + 1).map((x) => x.t);
    // What the eye gets: a row whose centre hits another element is covered, whatever the node's own box says.
    const covered = rows.filter((x) => {
        const b = x.c.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return !!hit && !node.contains(hit);
    }).map((x) => x.t);
    const coveredBy = nodes.filter((n) => n !== node).filter((n) => { const o = n.getBoundingClientRect(); return o.left < r.right && o.right > r.left && o.top < r.bottom && o.bottom > r.top; })
        .map((n) => ({ text: (n.textContent ?? '').trim().slice(0, 24), top: n.getBoundingClientRect().top }));
    const overflowing = [node, ...node.querySelectorAll('*')]
        .filter((c) => c.scrollHeight > c.clientHeight + 1 && c.clientHeight > 0)
        .map((c) => ({ cls: String((c as HTMLElement).className).slice(0, 60), scroll: c.scrollHeight, client: c.clientHeight, overflow: getComputedStyle(c).overflowY }));
    return {
        count: nodes.length, rendered: all.length, left: r.left, top: r.top, width: r.width, height: r.height, text: rows.map((x) => x.t).join(' | ').slice(0, 500),
        zoom: (node.closest('.react-flow__viewport') as HTMLElement | null)?.style.transform ?? null, below, overflowing: overflowing.slice(0, 8), covered, coveredBy,
    };
}, wanted);

const browser = await chromium.launch();
try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await seed(ctx, true);
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    mkdirSync(CROPS, { recursive: true });

    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 5000);
    const imported = await ev<{ id: string | null }>(page, `
        const api = await import('/src/api/persistance/projects.ts');
        const list = () => JSON.parse(localStorage.getItem('projects') || '[]');
        const before = list().length;
        await api.ProjectsApi.importFromText(a);
        for (let i = 0; i < 75 && list().length <= before; i++) await new Promise((r) => setTimeout(r, 200));
        const l = list(); return { id: l.length > before ? l[l.length - 1].id : null };`, readFileSync(FILE, 'utf8'), 0);
    if (!imported.id) throw new Error('the export did not import');
    await page.goto(`${URL}/#/project?id=${imported.id}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 9000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});

    const model = await ev<{ id: string; name: string }>(page, `
        const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
        const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(w.LPointerTargetable.fromPointer(m.id));
        return { id: m.id, name: m.name };`, undefined, 8000);
    meas('source model', model);
    await setTheme(page, 'light');
    await wait(page, SETTLE_MS);

    // The run: Reset, Ticks to Ready, takeOff, three Ticks.
    await openAndReset(page);
    const ready = (s: PanelState) => s.chips.includes('dji.Mode = Ready');
    let s = await readPanel(page);
    let ticks = 0;
    while (!ready(s) && ticks < MAX_TICKS && s.pill === 'Running') {
        await press(page, /^Tick$/);
        ticks++;
        s = await readPanel(page);
    }
    meas('ticks to Ready', { ticks, chips: s.chips, pill: s.pill });
    if (!ready(s)) throw new Error('dji never reached Ready');
    await press(page, /^dji\.takeOff\(/);
    for (let i = 0; i < 3; i++) await press(page, /^Tick$/);
    s = await readPanel(page);
    const steps = await traceLength(page, model.id);
    meas('run at the snapshot', { chips: s.chips, pill: s.pill, line: s.line, steps });
    check('SN-0 the run is at step 24 with dji Flying', steps === 24 && s.chips.includes('dji.Mode = Flying'), { steps, chips: s.chips });

    // The reducer keeps no undo entry before the first interaction (`isRelevantChangeCheck`).
    await page.locator('.react-flow__pane').first().click({ position: { x: 600, y: 500 } });
    await wait(page, 800);

    const bytes0 = await sourceBytes(page, model.id);
    const sig0 = await signature(page, model.id);
    const store0 = await storeState(page);
    const source = await dump(page, model.id);
    meas('before the write', { bytes: bytes0.length, objects: Object.keys(source).length, models: store0.names, graphs: store0.graphs, undo: store0.undo, signatureIsStored: sig0.computed === sig0.stored, signatureConfig: sig0.config });

    // The write.
    const w1 = await writeSnapshot(page, model.id);
    meas('write', w1);
    const store1 = await storeState(page);
    check('SN-1 the writer reports ok and the plan name', w1.ok && w1.name === SNAPSHOT_NAME && !!w1.modelId, { ok: w1.ok, name: w1.name, problems: w1.problems, unwritten: w1.unwritten });
    check('SN-2 one model more, in the project', store1.models.length === store0.models.length + 1 && store1.names.includes(SNAPSHOT_NAME), store1.names);
    check('SN-3 the write is one undo entry', store1.undo === store0.undo + 1, { before: store0.undo, after: store1.undo });
    if (!w1.modelId) throw new Error('no model written');

    const snapshot = await dump(page, w1.modelId);
    const diff = compare(source, snapshot);
    meas('objects compared', { total: diff.total, totalSnapshot: diff.totalSnapshot, onlySource: diff.onlySource.slice(0, 10), onlySnapshot: diff.onlySnapshot.slice(0, 10), refDiffs: diff.refDiffs.length, attrDiffs: diff.attrDiffs.length });
    meas('reference differences', diff.refDiffs.slice(0, 12));
    meas('attribute differences', diff.attrDiffs.slice(0, 24));
    const externals = Object.values(snapshot).flatMap((o) => Object.values(o.refs).flat()).filter((t) => t.startsWith('EXTERNAL:'));
    check('SN-4 same objects by containment, name and classifier', diff.onlySource.length === 0 && diff.onlySnapshot.length === 0 && diff.total === diff.totalSnapshot, { total: diff.total, onlySource: diff.onlySource.length, onlySnapshot: diff.onlySnapshot.length });
    check('SN-5 same links: a reference differs only where σ names another literal', diff.refDiffs.every((d) => /InstanceValue:[^/]*$/.test(d.path)), diff.refDiffs.slice(0, 6));
    check('SN-6 no target outside the new model', externals.length === 0, externals.slice(0, 6));
    const slots = await slotsOf(page, w1.modelId, 'dji');
    const sourceSlots = await slotsOf(page, model.id, 'dji');
    meas('slots of dji', { snapshot: slots, source: sourceSlots });
    const reads = (name: string, value: number) => (slots?.[name] ?? []).map(String).join() === String(value);
    check('SN-7 dji carries σ: distance 3, speed 1, battery 97, chargeRate 1', reads('distance', 3) && reads('speed', 1) && reads('battery', 97) && reads('chargeRate', 1), slots);

    const bytes1 = await sourceBytes(page, model.id);
    const sig1 = await signature(page, model.id);
    check('SN-8 the source model is byte-equal after the write', bytes1 === bytes0, { before: bytes0.length, after: bytes1.length });
    check('SN-9 runSignature is unchanged and still the run\'s baseline', sig1.computed === sig0.computed && sig1.computed === sig1.stored, { computedSame: sig1.computed === sig0.computed, baseline: sig1.computed === sig1.stored, config: sig1.config });

    const layout1 = await layoutDiff(page, model.id, w1.modelId);
    meas('layout against the source, after the write', layout1);
    check('SN-21 every vertex of the snapshot has the source\'s position, size and records', layout1.pairs === diff.total && layout1.withRecords > 0 && layout1.noSnapshotVertex.length === 0 && layout1.differ.length === 0, { pairs: layout1.pairs, withRecords: layout1.withRecords, noVertex: layout1.noSnapshotVertex.length, differ: layout1.differ.length });

    // One undo.
    await page.evaluate(`document.querySelector('.editor-v2').focus()`);
    await wait(page, 400);
    const beforeUndo = await storeState(page);
    check('SN-10 nothing pushed between the write and the undo', beforeUndo.undo === store1.undo, { afterWrite: store1.undo, beforeUndo: beforeUndo.undo });
    await page.keyboard.press('Meta+z');
    await wait(page, 2500);
    const store2 = await storeState(page);
    const added = store2.keys.filter((k) => !store0.keys.includes(k));
    const removed = store0.keys.filter((k) => !store2.keys.includes(k));
    meas('after the undo', { models: store2.names, graphs: store2.graphs, undo: store2.undo, redo: store2.redo, added: added.length, removed: removed.length, addedSample: added.slice(0, 6), removedSample: removed.slice(0, 6) });
    check('SN-11 one undo removes the new model and nothing else', store2.models.join() === store0.models.join() && store2.graphs === store0.graphs && added.length === 0 && removed.length === 0, { models: store2.names, added: added.length, removed: removed.length });
    check('SN-12 the source model is byte-equal after the undo', (await sourceBytes(page, model.id)) === bytes0, { bytes: bytes0.length });

    // Written again, opened: the source's layout, then a Reset on the snapshot.
    const w2 = await writeSnapshot(page, model.id);
    meas('second write', w2);
    check('SN-13 after the undo the name is free again', w2.ok && w2.name === SNAPSHOT_NAME, { ok: w2.ok, name: w2.name, problems: w2.problems });
    if (!w2.modelId) throw new Error('no second model written');
    await page.setViewportSize({ width: 3000, height: 2000 });
    await wait(page, 600);
    await openModel(page, model.id);
    await wait(page, SETTLE_MS * 2);
    const sourceEdges = await edgesOf(page, model.id);
    await openModel(page, w2.modelId);
    await wait(page, SETTLE_MS * 2);
    const djiIds = await ev<string[]>(page, `
        const { collectModelObjectIds } = await import('${BRIDGE}');
        const l = w.store.getState().idlookup; const id = collectModelObjectIds(l, a).find((x) => l[x].name === 'dji');
        return [id, ...Object.values(l).filter((d) => d && d.className === 'DVertex' && d.model === id).map((d) => d.id)];`, w2.modelId, 0);
    const node = await readDjiNode(page, djiIds);
    meas('dji on the canvas', node);
    check('SN-14 the snapshot opens with dji drawn', 'left' in node, { count: node.count, rendered: node.rendered });
    const vertices = await ev<{ vertices: number; objects: number }>(page, `
        const { collectModelObjectIds } = await import('${BRIDGE}');
        const l = w.store.getState().idlookup; const ids = new Set(collectModelObjectIds(l, a));
        return { objects: ids.size, vertices: Object.values(l).filter((d) => d && d.className === 'DVertex' && ids.has(d.model)).length };`, w2.modelId, 0);
    meas('vertices of the snapshot', vertices);
    const layout2 = await layoutDiff(page, model.id, w2.modelId);
    meas('layout against the source, opened', layout2);
    check('SN-22 opening the snapshot moves no vertex: same count, position, size and records', vertices.vertices === vertices.objects && layout2.pairs === diff.total && layout2.differ.length === 0, { vertices, pairs: layout2.pairs, differ: layout2.differ.length });
    const snapshotEdges = await edgesOf(page, w2.modelId);
    const onlyIn = (a: string[], b: string[]) => { const rest = [...b]; return a.filter((e) => { const i = rest.indexOf(e); if (i < 0) return true; rest.splice(i, 1); return false; }); };
    const edgeDiff = { onlySource: onlyIn(sourceEdges.drawn, snapshotEdges.drawn), onlySnapshot: onlyIn(snapshotEdges.drawn, sourceEdges.drawn) };
    const edgeCounts = (e: EdgeRead) => ({ nodes: e.nodes, drawn: e.drawn.length, unparsed: e.unparsed, stored: e.stored.length, vertexEnds: e.vertexEnds });
    meas('edges against the source, opened', { source: edgeCounts(sourceEdges), snapshot: edgeCounts(snapshotEdges), ...edgeDiff, sample: sourceEdges.drawn.slice(0, 8), storedOnlySource: onlyIn(sourceEdges.stored, snapshotEdges.stored).length, storedOnlySnapshot: onlyIn(snapshotEdges.stored, sourceEdges.stored).length });
    const edgesRead = (e: EdgeRead) => e.nodes > 0 && e.unparsed === 0;
    check('SN-24 the snapshot draws the source\'s edges, by count and endpoints', edgesRead(sourceEdges) && edgesRead(snapshotEdges) && edgeDiff.onlySource.length === 0 && edgeDiff.onlySnapshot.length === 0, { source: edgeCounts(sourceEdges), snapshot: edgeCounts(snapshotEdges), ...edgeDiff });
    {
        const r = 'left' in node ? { top: node.top, bottom: node.top + node.height, left: node.left, right: node.left + node.width } : null;
        const onPage = !!r && r.top >= 0 && r.left >= 0 && r.bottom <= 2000 && r.right <= 3000;
        check('SN-23 no node overlaps dji and its rows are all in sight', 'left' in node && onPage && node.coveredBy.length === 0 && node.covered.length === 0 && node.below.length === 0, 'left' in node ? { box: r, onPage, covered: node.covered, coveredBy: node.coveredBy, below: node.below } : node);
    }
    if ('left' in node) {
        const x = Math.max(0, node.left - 24); const y = Math.max(0, node.top - 24);
        await page.addStyleTag({ content: '.sim-panel--open { visibility: hidden !important; }' }).then(async (tag) => {
            await page.screenshot({ path: `${CROPS}/1-snapshot-open.png`, clip: { x, y, width: Math.max(node.width + 48, 640), height: Math.max(node.height + 48, 360) } });
            await tag.evaluate((e) => (e as Element).remove());
        });
        // The verdict is SN-23; this is the measure behind it.
        meas('rows of dji against the node', { size: [node.width, node.height], zoom: node.zoom, clippedByOwnBox: node.below.length > 0, covered: node.covered, coveredBy: node.coveredBy, top: node.top, below: node.below.slice(0, 12) });
    }

    await openAndReset(page);
    const s2 = await readPanel(page);
    meas('Reset on the snapshot', { chips: s2.chips, pill: s2.pill, line: s2.line, trace: await traceLength(page, w2.modelId) });
    const snapshotTrace = await traceLength(page, w2.modelId);
    check('SN-16 a Reset on the snapshot classifies dji as Flying, read from its own panel', s2.chips.includes('dji.Mode = Flying') && s2.shownPanels === 1 && snapshotTrace === 0 && !/step 24/.test(s2.line ?? ''), { chips: s2.chips, line: s2.line, shownPanels: s2.shownPanels, trace: snapshotTrace });

    // LIR smoke: save, reload, the project opens again with the snapshot in it.
    await ev(page, `const api = await import('/src/api/persistance/projects.ts'); await api.ProjectsApi.save(w.LProject.getProject(), { silent: true }); await new Promise((r) => setTimeout(r, 2000)); return true;`, undefined, 0);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 12000);
    const reopened = await storeState(page);
    const reMid = await ev<string | null>(page, `return w.LProject.getProject().models.find((m) => m.name === a)?.id ?? null;`, SNAPSHOT_NAME, 0);
    meas('after save and reload', { models: reopened.names, snapshot: reMid });
    check('SN-17 existing project opens after save and reload, snapshot included', !!reMid && reopened.names.includes(model.name), reopened.names);
    if (reMid) {
        const reDump = await dump(page, reMid);
        const reSlots = await slotsOf(page, reMid, 'dji');
        check('SN-18 the reloaded snapshot keeps its objects and σ', Object.keys(reDump).length === diff.totalSnapshot && JSON.stringify(reSlots) === JSON.stringify(slots), { objects: Object.keys(reDump).length, slots: reSlots });
    }
    check('SN-19 the source is unchanged by save and reload (data)', JSON.stringify(await dump(page, model.id)) === JSON.stringify(source), { objects: Object.keys(source).length });
    check('SN-20 page errors', errors.length === 0, errors.slice(0, 5));
} catch (e) {
    console.log(`FAIL  probe aborted  ${String((e as Error).message ?? e).slice(0, 800)}`);
    fail++;
} finally {
    await browser.close();
}
console.log(`DONE pass=${pass} fail=${fail}`);
process.exit(fail ? 1 : 0);
