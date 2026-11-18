/**
 * lost-containment-write (P-2026-11-09-1020): which containment write of `syncCreateCompositionLink` is lost, in which layer, under
 * which condition. The ticket of P-2026-11-08-1939 lost one link per DCN drone build. Copies the fixture's build path, not the fixture:
 * a metamodel, one model per run (`createM1`), objects by `syncCreateObject`, links one per `page.evaluate` with the 300 ms pause of
 * `buildLinks` and no settle after. Writes through the public function (P11).
 *
 * Each write records, in the same evaluate so the cadence does not change: whether the slot already held the previous write of that
 * slot (`prevSeen`), the buffer and the in-flight dispatches at that moment, and after the pause the D read and the L read. After the last
 * write the slots are read at once, after a settle, after a longer settle: D-layer (`idlookup`), L-layer (the proxy's `values`), the
 * edge, and the child's `father`.
 *
 * Arms, on empty slots of their own, read after a settle:
 *   sameSlotSameTick    two writes, same slot, no await between: the condition of H1. Lost the first until P-2026-11-09-1227 (11 of 11 runs, P-2026-11-09-1020); keeps both now, and the arm stays as the regression detector
 *   sameSlotMacrotask   same, one setTimeout(0) between
 *   otherContainer      two writes, two containers, same tick
 *   sameContainerOtherRef two writes, one container, two references, same tick
 *   syncCommitBetween   same slot, `COMMIT(undefined, false)` called synchronously after the first write: `TRANSACTION` is async, so its END is still owed
 *   commitBetween       same slot, a macrotask, `COMMIT(undefined, false)`, a macrotask between: must keep both (control of the writes)
 *   apart700            same slot, 700 ms between
 *
 * The drop arm (P-2026-11-09-1227, the report's §10 Q4) is the user's way in: two real `drop` events on one container, through `performContainmentDrop`, in one tick,
 * 60 ms apart, and 700 ms apart. It reads the slot, the edges, the undo stack, and what each Cmd+Z takes away. It runs after the bursts, because its viewpoint would change the models after it.
 *
 * Env: LOST_RUNS (default 5), LOST_FIRST (number of the first run, default 1), LOST_TRACE_EDGES=1 (the removals useM1ReferenceEdges logs, by edge end).
 * Run: node frontend/scripts/lane-run.mjs probe ~/jjodel-w-lostlink frontend/scripts/probe/lost-containment-write.ts --port 3096 --id P-2026-11-09-1020
 */
import { chromium, type Page } from '@playwright/test';
import { homedir } from 'node:os';
import { NAV_MS, SETTLE_MS, TAB_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3096/').replace(/\/$/, '');
if (/:300[01]$/.test(URL)) throw new Error('never 3000 or 3001');

// The BPMN fixture creates its GV_OUT at import: keep it out of the repo.
process.env.GV_OUT = `${homedir()}/.jjodel-lanes/P-2026-11-09-1020/probe-out`;
const { buildMetamodel, buildObjects, buildViewpoint, createProject, ev, openPage, screenBox } = await import('./bpmn-lanes-fixture.ts');

const RUNS = Number(process.env.LOST_RUNS || 5);
const FIRST = Number(process.env.LOST_FIRST || 1);
const PAUSE_MS = 300;
const LONG_SETTLE_MS = 6000;

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
    if (ok) pass++; else fail++;
};
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v).slice(0, 3000)}`);

type Ids = Record<string, { obj: string; vertex: string }>;
type Link = [string, string, string];

const CLASSES: Array<[string, boolean, string[]]> = [['Named', true, []], ['Root', false, ['Named']], ['Leaf', false, ['Named']], ['Box', false, ['Named']], ['Item', false, ['Named']]];
// `Box` has one containment for `Item`: two would open the reference picker instead of `performContainmentDrop`.
const REFS: Array<[string, string, string, boolean, boolean]> = [['Root', 'a', 'Leaf', true, true], ['Root', 'b', 'Leaf', true, true], ['Box', 'items', 'Item', true, true]];

/** Blocks of consecutive appends to one slot, as the fixture's plan has, and a block alternating two containers. */
function plan(): { roots: string[]; links: Link[] } {
    const roots = ['R0', 'R1', 'R2', 'R3'];
    const links: Link[] = [];
    for (let i = 0; i < 15; i++) links.push(['R0', 'a', `A${i}`]);
    for (let i = 0; i < 15; i++) links.push(['R1', 'a', `B${i}`]);
    for (let i = 0; i < 10; i++) { links.push(['R2', 'a', `C${i}`]); links.push(['R3', 'a', `D${i}`]); }
    return { roots, links };
}

const ARMS: Array<{ name: string; roots: string[]; leaves: string[] }> = [
    { name: 'sameSlotSameTick', roots: ['S0'], leaves: ['S1', 'S2'] },
    { name: 'sameSlotMacrotask', roots: ['M0'], leaves: ['M1', 'M2'] },
    { name: 'otherContainer', roots: ['O0', 'O1'], leaves: ['O2', 'O3'] },
    { name: 'sameContainerOtherRef', roots: ['X0'], leaves: ['X1', 'X2'] },
    { name: 'syncCommitBetween', roots: ['Y0'], leaves: ['Y1', 'Y2'] },
    { name: 'commitBetween', roots: ['K0'], leaves: ['K1', 'K2'] },
    { name: 'apart700', roots: ['T0'], leaves: ['T1', 'T2'] },
];

async function newModel(page: Page): Promise<{ graphId: string | null; name: string; index: number }> {
    const made = await ev<{ name: string; index: number }>(page, `const nb = await import('/src/pages/components/Navbar.tsx'); const p = w.LProject.getProject();
        const before = p.models.length; nb.createM1(p, p.metamodels[0]); await new Promise((r) => setTimeout(r, 900));
        const ms = w.LProject.getProject().models; return { name: ms[ms.length - 1].name, index: ms.length - 1, before };`, undefined, 200);
    await page.waitForTimeout(TAB_MS);
    const tab = page.locator('.appbar-tab__name').filter({ hasText: new RegExp(`^\\s*${made.name}\\s*$`) });
    if (await tab.count()) { await tab.first().click(); await page.waitForTimeout(TAB_MS); }
    // The first layout of a fresh graph arms a 3 s re-layout watcher: wait it out, as buildModelShell does.
    await page.waitForTimeout(4000);
    const graphId = await ev<string | null>(page, `const s = w.store.getState(); const m = w.LProject.getProject().models[a];
        const g = (s.graphs || []).map((id) => s.idlookup[id]).find((d) => d && d.model === m.id && d.graphStyle === 'v2-flow');
        return g ? g.id : null;`, made.index, 0);
    return { graphId, name: made.name, index: made.index };
}

const WRITE_JS = `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
    const P = w.LPointerTargetable; const t = w.transactionStatus;
    const slotId = P.fromPointer(a.po)['$' + a.f].id;
    const before = (w.store.getState().idlookup[slotId].values || []).filter((v) => v != null && v !== '');
    const info = { seen: before.length, prevSeen: a.prev ? before.includes(a.prev) : null, pending: t.pendingActions.length, inFlight: t.dispatchesInFlight,
        disp: w.__lp.n, at: Math.round(performance.now()) };
    const edge = c2j.syncCreateCompositionLink(a.pv, a.cv, a.f);
    await new Promise((res) => setTimeout(res, a.ms));
    const d = w.store.getState().idlookup[slotId].values || [];
    const l = (P.fromPointer(a.po)['$' + a.f].values || []).map((v) => v && v.id);
    return { ...info, edge: !!edge, afterD: d.includes(a.co), afterL: l.includes(a.co), dispAfter: w.__lp.n };`;

const READ_JS = `const idl = w.store.getState().idlookup; const P = w.LPointerTargetable;
    const pairs = {};
    for (const id of Object.keys(idl)) { const e = idl[id]; if (e && /Edge/.test(String(e.className))) { const k = e.start + '|' + e.end; pairs[k] = (pairs[k] || 0) + 1; } }
    return a.map((x) => { const s = P.fromPointer(x.po)['$' + x.f]; const d = idl[s.id].values || []; const l = (s.values || []).map((v) => v && v.id);
        return { d: d.includes(x.co), l: l.includes(x.co), edges: pairs[x.pv + '|' + x.cv] || 0, father: idl[x.co] ? idl[x.co].father === s.id : null }; });`;

const ARM_JS = `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
    const write = (x) => c2j.syncCreateCompositionLink(x.pv, x.cv, x.f);
    const tick = () => new Promise((res) => setTimeout(res, 0));
    switch (a.name) {
        case 'sameSlotMacrotask': write(a.w[0]); await tick(); write(a.w[1]); break;
        case 'syncCommitBetween': write(a.w[0]); w.COMMIT(undefined, false); await tick(); write(a.w[1]); break;
        case 'commitBetween': write(a.w[0]); await tick(); w.COMMIT(undefined, false); await tick(); write(a.w[1]); break;
        case 'apart700': write(a.w[0]); await new Promise((res) => setTimeout(res, 700)); write(a.w[1]); break;
        default: write(a.w[0]); write(a.w[1]);
    }
    return 1;`;

const DROP_VARIANTS = [{ name: 'dropsSameTick', gap: -1 }, { name: 'dropsGap60', gap: 60 }, { name: 'dropsApart700', gap: 700 }];

const DROP_JS = `const fire = (p) => { const el = document.elementFromPoint(p.x, p.y); const dt = new DataTransfer();
        dt.setData('application/reactflow', 'objectNode'); dt.setData('metaclassId', a.cls);
        for (const type of ['dragover', 'drop']) el?.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, clientX: p.x, clientY: p.y, dataTransfer: dt })); };
    fire(a.p[0]);
    if (a.gap >= 0) await new Promise((res) => setTimeout(res, a.gap));
    fire(a.p[1]);
    return 1;`;

const READ_DROP_JS = `const idl = w.store.getState().idlookup; const P = w.LPointerTargetable;
    const slot = P.fromPointer(a.box)['$items']; const inSlot = (idl[slot.id].values || []).filter((v) => v != null && v !== '');
    const ids = Object.keys(idl); const kind = (k, re) => idl[k] && re.test(String(idl[k].className));
    const items = ids.filter((k) => kind(k, /^DObject$/) && idl[k].instanceof === a.cls && !a.before.includes(k));
    const vertexOf = (o) => ids.find((k) => kind(k, /Vertex/) && idl[k].model === o);
    const edges = items.map((o) => { const v = vertexOf(o); return ids.filter((k) => kind(k, /Edge/) && idl[k].start === a.vertex && idl[k].end === v).length; });
    return { items, inSlot, kept: items.filter((o) => inSlot.includes(o)).length, edges, undoable: w.statehistory.all.undoable.length };`;

/** Two real drops on one container, then Cmd+Z until the slot is empty, at most three times so the arm does not undo the boxes of the next. */
async function dropArm(page: Page) {
    const VP = 'drops';
    await buildViewpoint(page, VP, [['Box', { kind: 'graphVertex', metaclasses: ['Box'], label: 'Box', shape: { form: 'rect', fill: '#ffffff', border: { width: 1.5 } } }]]);
    const shell = await newModel(page);
    if (!shell.graphId) { check('drops: v2-flow graph', false, shell); return; }
    // Not the fixture's pickViewpoint: with one tab per model its `.first()` is the toolbar of a hidden tab.
    await page.locator('.toolbar-viewpoint-trigger:not([disabled]):visible').first().click();
    await page.waitForTimeout(400);
    await page.locator('.toolbar-viewpoint-menu__option:visible', { hasText: VP }).first().click();
    await page.waitForTimeout(4000);
    const ids: Ids = await buildObjects(page, shell.graphId, DROP_VARIANTS.map((_, i) => [`Box${i}`, 'Box', `Box${i}_drops`, 40 + (i % 2) * 300, 60 + Math.floor(i / 2) * 200, [260, 160]] as [string, string, string, number, number, [number, number]]));
    await page.waitForTimeout(SETTLE_MS);
    // Boxes kept left of about 800 px, where a drop reaches the canvas (a third box further right received none, measured). Two points
    // far apart in a large box: the first child, centred on its drop point, must not lie over the second.
    const cls = await ev<string>(page, `return w.LProject.getProject().metamodels[0].packages[0].classes.find((c) => c.name === 'Item').id;`, undefined, 0);
    type DropRead = { items: string[]; inSlot: string[]; kept: number; edges: number[]; undoable: number };
    for (const [i, v] of DROP_VARIANTS.entries()) {
        const box = ids[`Box${i}`];
        const r = await screenBox(page, box.vertex);
        if (!r) { check(`drops ${v.name}: the box is on screen`, false, box); continue; }
        const before = (await ev<DropRead>(page, READ_DROP_JS, { box: box.obj, vertex: box.vertex, cls, before: [] }, 0)).items;
        const read = () => ev<DropRead>(page, READ_DROP_JS, { box: box.obj, vertex: box.vertex, cls, before }, 0);
        const stackBefore = (await read()).undoable;
        await ev(page, DROP_JS, { cls, gap: v.gap, p: [{ x: r.x + r.width * 0.75, y: r.y + r.height * 0.75 }, { x: r.x + r.width * 0.15, y: r.y + r.height * 0.2 }] }, 0);
        await page.waitForTimeout(SETTLE_MS);
        const after = await read();
        await page.locator('.dock-tabpane-active .react-flow__pane').first().click({ position: { x: 15, y: 15 }, force: true });
        await page.waitForTimeout(400);
        const trail: Array<{ kept: number; itemsAlive: number; undoable: number }> = [];
        for (let u = 0; u < 3 && (trail.length ? trail[trail.length - 1].itemsAlive : after.items.length) > 0; u++) {
            await page.keyboard.press('Meta+z');
            await page.waitForTimeout(1500);
            const x = await read();
            trail.push({ kept: x.kept, itemsAlive: x.items.length, undoable: x.undoable });
        }
        meas(`drops ${v.name}`, { itemsCreated: after.items.length, keptInSlot: after.kept, slotSize: after.inSlot.length, edgesPerItem: after.edges, stack: [stackBefore, after.undoable], undos: trail.length, trail });
        check(`drops ${v.name}: both children kept in the slot`, after.items.length === 2 && after.kept === 2, { items: after.items.length, kept: after.kept });
        check(`drops ${v.name}: both edges drawn`, after.edges.length === 2 && after.edges.every((n) => n === 1), after.edges);
        // As measured before the fix (LIR, Measures): one entry for drops in one commit, one for each drop 700 ms apart; a 60 ms gap may or may not straddle a commit.
        const last = trail[trail.length - 1];
        check(`drops ${v.name}: one undo per entry, nothing left`, trail.length === after.undoable - stackBefore && !!last && last.kept === 0 && last.itemsAlive === 0
            && (v.gap !== -1 || trail.length === 1) && (v.gap !== 700 || trail.length === 2), { stack: [stackBefore, after.undoable], trail });
    }
}

let traceRemoved: Array<{ start: string; end: string }> | null = null;

async function oneRun(page: Page, run: number) {
    const started = Date.now();
    const shell = await newModel(page);
    if (!shell.graphId) { check(`run ${run}: v2-flow graph`, false, shell); return null; }
    const { roots, links } = plan();
    const armObjects = ARMS.flatMap((x) => [...x.roots.map((k) => [k, 'Root'] as const), ...x.leaves.map((k) => [k, 'Leaf'] as const)]);
    const objects: Array<[string, string, string, number, number, null]> = [];
    const add = (key: string, cls: string) => { const i = objects.length; objects.push([key, cls, `${key}_${run}`, 60 + (i % 10) * 300, 60 + Math.floor(i / 10) * 220, null]); };
    for (const r of roots) add(r, 'Root');
    for (const [, , c] of links) add(c, 'Leaf');
    for (const [k, c] of armObjects) add(k, c);
    const ids: Ids = await buildObjects(page, shell.graphId, objects);
    const missing = objects.map((o) => o[0]).filter((k) => !ids[k]);
    if (missing.length) { check(`run ${run}: every object created`, false, { missing }); return null; }
    await ev(page, `if (!w.__lp) { w.__lp = { n: 0 }; w.store.subscribe(() => { w.__lp.n++; }); } return 1;`, undefined, 0);

    const pv = (k: string) => ids[k].vertex; const obj = (k: string) => ids[k].obj;
    const toRead = (l: Link) => ({ po: obj(l[0]), f: l[1], co: obj(l[2]), pv: pv(l[0]), cv: pv(l[2]) });
    const writesStart = Date.now();
    const last: Record<string, string> = {};
    const trace: Array<Record<string, unknown>> = [];
    for (const l of links) {
        const key = `${l[0]}.${l[1]}`;
        trace.push(await ev<Record<string, unknown>>(page, WRITE_JS, { ...toRead(l), prev: last[key] ?? null, ms: PAUSE_MS }, 0));
        last[key] = obj(l[2]);
    }
    const writesMs = Date.now() - writesStart;

    // The reads: at once, after the settle of `repairContainment`, after a longer one.
    const q = links.map(toRead);
    const at0 = await ev<Array<Record<string, unknown>>>(page, READ_JS, q, 0);
    await page.waitForTimeout(SETTLE_MS);
    const at3 = await ev<Array<Record<string, unknown>>>(page, READ_JS, q, 0);
    await page.waitForTimeout(LONG_SETTLE_MS);
    const at9 = await ev<Array<Record<string, unknown>>>(page, READ_JS, q, 0);

    const indexOfSlot = (i: number) => links.slice(0, i).filter((x) => x[0] === links[i][0] && x[1] === links[i][1]).length;
    const sizeOfSlot = (i: number) => links.filter((x) => x[0] === links[i][0] && x[1] === links[i][1]).length;
    const lost = links.map((l, i) => ({ l, i })).filter(({ i }) => !at9[i].d).map(({ l, i }) => {
        const nextIsSameSlot = i + 1 < links.length && links[i + 1][0] === l[0] && links[i + 1][1] === l[1];
        const laterSameSlot = links.findIndex((x, j) => j > i && x[0] === l[0] && x[1] === l[1]);
        return {
            link: `${l[0]}.${l[1]}->${l[2]}`, writeIndex: i, slotIndex: indexOfSlot(i), slotSize: sizeOfSlot(i), nextIsSameSlot,
            successorPrevSeen: laterSameSlot >= 0 ? trace[laterSameSlot].prevSeen : null, successorSeen: laterSameSlot >= 0 ? trace[laterSameSlot].seen : null,
            edgeReturned: trace[i].edge, successorInFlight: laterSameSlot >= 0 ? trace[laterSameSlot].inFlight : null, successorPending: laterSameSlot >= 0 ? trace[laterSameSlot].pending : null,
            ownPrevSeen: trace[i].prevSeen, afterD: trace[i].afterD, afterL: trace[i].afterL, d0: at0[i].d, d3: at3[i].d, d9: at9[i].d, l9: at9[i].l, edges: at9[i].edges, father: at9[i].father,
        };
    });
    const stale = links.map((l, i) => ({ l, i })).filter(({ i }) => trace[i].prevSeen === false);
    const keyOf = Object.fromEntries(Object.entries(ids).map(([k, v]) => [v.obj, k]));
    const lostSlots = [...new Set(lost.map((x) => x.link.split('->')[0]))];
    const slotValues: Record<string, unknown> = {};
    for (const sl of lostSlots) {
        const [o, f] = sl.split('.');
        const vals = await ev<string[]>(page, `const s = w.LPointerTargetable.fromPointer(a.po)['$' + a.f]; return (w.store.getState().idlookup[s.id].values || []).map((v) => v == null ? null : v);`, { po: obj(o), f }, 0);
        slotValues[sl] = vals.map((v) => (v == null ? null : keyOf[v] ?? v));
    }
    const kept = links.map((_, i) => i).filter((i) => at9[i].d);
    const transient = links.map((l, i) => ({ l, i })).filter(({ i }) => !at0[i].d && at9[i].d).map(({ l, i }) => ({ link: `${l[0]}.${l[1]}->${l[2]}`, writeIndex: i, isLastWrite: i === links.length - 1 }));
    const count = (reads: Array<Record<string, unknown>>, f: 'd' | 'l') => reads.filter((r) => !r[f]).length;

    // Arms: on their own empty slots, after the writes above have landed.
    const arms: Record<string, unknown> = {};
    const armLinks: Record<string, Link[]> = {};
    for (const arm of ARMS) {
        const toLink = (i: number): Link => {
            if (arm.name === 'otherContainer') return [arm.roots[i], 'a', arm.leaves[i]];
            if (arm.name === 'sameContainerOtherRef') return [arm.roots[0], i === 0 ? 'a' : 'b', arm.leaves[i]];
            return [arm.roots[0], 'a', arm.leaves[i]];
        };
        const w = [toLink(0), toLink(1)];
        await ev(page, ARM_JS, { name: arm.name, w: w.map((l) => ({ pv: pv(l[0]), cv: pv(l[2]), f: l[1] })) }, 0);
        armLinks[arm.name] = w;
    }
    // Every arm is on its own slots, so one set of reads serves them all: at 500 ms, 2 s, 6 s, the edge of each write too.
    const readArms = async () => Object.fromEntries(await Promise.all(ARMS.map(async (arm) => [arm.name, await ev<Array<Record<string, unknown>>>(page, READ_JS, armLinks[arm.name].map(toRead), 0)] as const)));
    await page.waitForTimeout(500);
    const arm500 = await readArms();
    await page.waitForTimeout(1500);
    const arm2000 = await readArms();
    await page.waitForTimeout(4000);
    const arm6000 = await readArms();
    const armEdges: Record<string, unknown> = {};
    for (const arm of ARMS) {
        arms[arm.name] = arm6000[arm.name].map((r) => r.d);
        armEdges[arm.name] = { e500: arm500[arm.name].map((r) => r.edges), e2000: arm2000[arm.name].map((r) => r.edges), e6000: arm6000[arm.name].map((r) => r.edges), father6000: arm6000[arm.name].map((r) => r.father) };
    }
    if (traceRemoved) meas(`run ${run} edge removals`, ARMS.map((arm) => ({ arm: arm.name, removedForWrite: armLinks[arm.name].map((l) => traceRemoved!.filter((e) => e.start === pv(l[0]) && e.end === pv(l[2])).length) })));
    const lastIsAlwaysKept = lost.every((x) => x.slotIndex < x.slotSize - 1);
    meas(`run ${run}`, {
        run, model: shell.name, writes: links.length, writesMs, totalMs: Date.now() - started,
        lostAt0: count(at0, 'd'), lostAt3: count(at3, 'd'), lostAt9: count(at9, 'd'), lLostAt9: count(at9, 'l'),
        stalePrev: stale.length, stalePairs: stale.map(({ l, i }) => ({ link: `${l[0]}.${l[1]}->${l[2]}`, i, seen: trace[i].seen, pending: trace[i].pending, inFlight: trace[i].inFlight })),
        lost, slotValues, transient, keptLinks: kept.length, keptLinksWithEdge: kept.filter((i) => (at9[i].edges as number) > 0).length,
        writesWithInFlight: trace.filter((x) => (x.inFlight as number) > 0).length, writesWithPending: trace.filter((x) => (x.pending as number) > 0).length, lastIsAlwaysKept, arms, armEdges,
    });
    return { lost: lost.length, stale: stale.length, arms, lostAt0: count(at0, 'd'), lostAt9: count(at9, 'd') };
}

const browser = await chromium.launch();
try {
    const { page, errors } = await openPage(browser);
    const removed: Array<{ start: string; end: string }> = [];
    if (process.env.LOST_TRACE_EDGES) {
        await page.context().addInitScript(() => { (window as unknown as { __m1RefEdgesDebug: boolean }).__m1RefEdgesDebug = true; });
        page.on('console', async (m) => {
            if (!m.text().includes('[useM1ReferenceEdges] removing')) return;
            const list = await m.args()[3]?.jsonValue().catch(() => null) as Array<{ start: string; end: string }> | null;
            for (const e of list ?? []) removed.push({ start: e.start, end: e.end });
        });
        traceRemoved = removed;
    }
    // As the DCN fixture: the 3.1.1 welcome modal's backdrop swallows the dashboard's clicks, and the widgets cover the tabs.
    await page.context().addInitScript(() => { localStorage.setItem('jjodel_welcome_3_1_1_seen', '1'); });
    const pid = await createProject(page, 'lost containment');
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(NAV_MS);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    await buildMetamodel(page, CLASSES, REFS, 'Named');
    const results: Array<NonNullable<Awaited<ReturnType<typeof oneRun>>>> = [];
    for (let r = FIRST; r < FIRST + RUNS; r++) {
        const res = await oneRun(page, r);
        if (res) results.push(res);
    }
    const tally = (name: string) => results.map((x) => (x.arms as Record<string, boolean[]>)[name].join('/')).join(' ');
    meas('summary', { runs: results.length, lostPerRun: results.map((x) => x.lostAt9), staleSameSlotPerRun: results.map((x) => x.stale), lostAt0PerRun: results.map((x) => x.lostAt0),
        arms: Object.fromEntries(ARMS.map((a) => [a.name, tally(a.name)])), pageErrors: errors.length });
    const armOk = (name: string, want: [boolean, boolean]) => results.every((x) => { const v = (x.arms as Record<string, boolean[]>)[name]; return v[0] === want[0] && v[1] === want[1]; });
    for (const name of ['sameSlotSameTick', 'sameSlotMacrotask', 'syncCommitBetween']) check(`regression detector: ${name} keeps both writes`, armOk(name, [true, true]), tally(name));
    check('the organic burst loses nothing', results.every((x) => x.lostAt9 === 0), results.map((x) => x.lostAt9));
    check('control of the writes: a macrotask, COMMIT and a macrotask between keeps both', armOk('commitBetween', [true, true]), tally('commitBetween'));
    await dropArm(page);
    console.log(`DONE  ${pass} passed, ${fail} failed`);
} catch (e) {
    check('probe crashed', false, String((e as Error)?.stack ?? e));
} finally {
    await browser.close();
}
process.exit(fail ? 1 : 0);
