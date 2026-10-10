/**
 * statechart-fixture (P-2026-10-10-0105, slice S2b): a UML-faithful hierarchical state machine, the second fixture of
 * the graphVertex front, and the S2b oracle.
 *
 * Builds, in the real app on its own dev server, the UML fragment StateMachine / Region / Vertex / State / Pseudostate
 * / FinalState / Transition (`Region.state` is UML's owner end of `State.regions`, written here because a predicate
 * cannot climb to the owner), the D-b views of the S2b GO and the model, in the root form (R-GV-10):
 *   - a composite `Active` with two orthogonal regions, each with its own initial pseudostate;
 *   - a composite `Running` with one region, inside Active's second region (depth 3);
 *   - transitions across boundaries: `Compute` (in Running) to `Idle`, `Paused` into `Fetch` (in Running), and from
 *     the border of `Active` to `Done`.
 * Every node is placed where the computed boxes put its container (Active's regions stacked under its band).
 *
 * Then it measures, from the DOM only (node `style.transform` and offset sizes are flow coordinates): the self frame of
 * Running, the dashed regions of Active, no hull, the drag of Active, the collapse of Running. Light theme.
 *
 * Run:  node frontend/scripts/lane-run.mjs probe ~/jjodel-w-graphvertex \
 *         frontend/scripts/probe/statechart-fixture.ts --port 3073 --id P-2026-10-10-0105
 * Env:  SC_TAG    label of the run in file names (default after)
 *       SC_OUT    output directory (default docs/discovery/assets/graphvertex-s2b of this tree)
 *       SC_ONLY   comma list of scenes: statechart (S2b), s6 (Auto layout) (default statechart)
 */
import { chromium, type Browser } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTheme, SETTLE_MS } from '../smoke/states.ts';
import {
    autoLayout, buildLinks, buildMetamodel, buildModelShell, buildObjects, buildViewpoint, createProject, drag, ev, openPage,
    pickViewpoint, readEdges, readHulls, readNodes, records, screenBox, type Box,
} from './bpmn-lanes-fixture.ts';
import type { Page } from '@playwright/test';

const URL = (process.env.PROBE_URL || 'http://localhost:3073/').replace(/\/$/, '');
if (/:300[01]$/.test(URL)) throw new Error('never 3000 or 3001');
const TAG = process.env.SC_TAG || 'after';
const ONLY = (process.env.SC_ONLY || 'statechart').split(',').filter(Boolean);
const OUT = (process.env.SC_OUT || new globalThis.URL('../../../docs/discovery/assets/graphvertex-s2b/', import.meta.url).pathname).replace(/\/$/, '');
mkdirSync(OUT, { recursive: true });

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
    if (ok) pass++; else fail++;
};
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v).slice(0, 3000)}`);

/** The BPMN fixture's screenshot, into this fixture's directory: rail hidden, fit to view, one step out. */
async function shoot(page: Page, file: string, outSteps = 1) {
    const hide = page.locator('button[aria-label="Hide the side panel"]:visible');
    if (await hide.count()) { await hide.first().click(); await page.waitForTimeout(900); }
    const fit = page.locator('.toolbar-commands__level:visible');
    if (await fit.count()) { await fit.first().click(); await page.waitForTimeout(900); }
    const out = page.locator('button[title="Zoom out"]:visible');
    if (await out.count()) { await out.first().click(); await page.waitForTimeout(700); }
    // A layout larger than the fit allows (S6): the picture only, the viewport's transform set on the drawn nodes'
    // box (style.transform, flow units), a margin around; React Flow's own viewport is not touched.
    if (outSteps > 1) {
        await page.evaluate((root) => {
            const pane = document.querySelector(root) as HTMLElement | null;
            const vp = document.querySelector(`${root} .react-flow__viewport`) as HTMLElement | null;
            if (!pane || !vp) return;
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (const el of Array.from(document.querySelectorAll(`${root} .react-flow__node`)) as HTMLElement[]) {
                if (getComputedStyle(el).visibility === 'hidden' || el.style.display === 'none') continue;
                const m = el.style.transform.match(/translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
                if (!m) continue;
                x0 = Math.min(x0, +m[1]); y0 = Math.min(y0, +m[2]); x1 = Math.max(x1, +m[1] + el.offsetWidth); y1 = Math.max(y1, +m[2] + el.offsetHeight);
            }
            if (!Number.isFinite(x0)) return;
            const k = Math.min(1, (pane.clientWidth - 80) / (x1 - x0), (pane.clientHeight - 80) / (y1 - y0));
            vp.style.transform = `translate(${40 - x0 * k}px, ${40 - y0 * k}px) scale(${k})`;
        }, '.dock-tabpane-active .react-flow');
        await page.waitForTimeout(400);
    }
    await page.locator('.dock-tabpane-active .react-flow').first().screenshot({ path: `${OUT}/${file}` });
    meas('screenshot', `${OUT}/${file}`);
}

// ── The views (D-b, R-GV-12): three State views told apart by predicate and priority ─────────────────────────────

const I = (prop: string) => ({ from: 'intrinsic', prop });
const P = (expr: string) => ({ from: 'path', expr });
const isKind = (c: string) => ({ op: 'isKind', class: c });
/** The name compartment of a composite state: a band on top, the name in it. */
const BAND = { side: 'n', size: 28 };
/** The padding of Running's frame, the floor the first criterion measures. */
const PAD = 16;
const headerLabel = { position: 'header', source: I('name') };
const transitionEdge = { source: '$source.value', target: '$target.value', line: { width: 1 }, terminations: { sourceEnd: 'none', targetEnd: 'openArrow' } };

export const SC_VIEWS: Array<[string, Record<string, unknown>]> = [
    ['StateMachine', { kind: 'vertex', metaclasses: ['StateMachine'], label: 'State machine (not drawn)', visible: false, shape: { form: 'rect' } }],
    // A region of a state with one region is not drawn: the state's channel reaches its substates through it.
    ['Region', { kind: 'vertex', metaclasses: ['Region'], label: 'Region (not drawn)', visible: false, shape: { form: 'rect' } }],
    ['Region', { kind: 'graphVertex', metaclasses: ['Region'], label: 'Orthogonal region', priority: 1,
        predicate: { op: 'exists', path: '$state.value.$regions.values[1]' },
        shape: { form: 'rect', fill: 'transparent', border: { width: 1, color: 'transparent' } },
        containment: { childFilter: isKind('Vertex'), layout: { mode: 'free' }, edges: 'hide', collapsible: false } }],
    // `Region.state` is there for the predicate above; no edge view can hide a reference edge, so it is drawn clear.
    ['Region', { kind: 'edge', metaclasses: ['Region'], reference: 'state', label: 'Region.state (drawn clear)',
        edge: { line: { color: 'transparent', width: 1 }, terminations: { sourceEnd: 'none', targetEnd: 'none' } } }],
    ['State', { kind: 'vertex', metaclasses: ['State'], label: 'Simple state', defaultSize: { width: 140, height: 60 },
        shape: { form: 'rounded', fill: '#ffffff', border: { width: 1 }, labels: [{ position: 'center', source: I('name') }] } }],
    ['State', { kind: 'graphVertex', metaclasses: ['State'], label: 'Composite state', priority: 1,
        predicate: { op: 'exists', path: '$regions.values[0]' },
        shape: { form: 'rounded', fill: '#ffffff', border: { width: 1 }, labels: [headerLabel] },
        containment: { children: '$regions.values[0].$subvertex.values', childFilter: isKind('Vertex'),
            layout: { mode: 'free', frame: 'self', header: BAND, padding: PAD }, edges: 'hide', collapsible: true,
            collapsed: { badge: { icon: 'bi-diagram-2', position: 'tr', visible: true } } } }],
    ['State', { kind: 'graphVertex', metaclasses: ['State'], label: 'Orthogonal state', priority: 2,
        predicate: { op: 'exists', path: '$regions.values[1]' },
        shape: { form: 'rounded', fill: '#ffffff', border: { width: 1 }, labels: [headerLabel] },
        containment: { childFilter: isKind('Region'), layout: { mode: 'partitions', axis: 'vertical', header: BAND, separator: 'dashed' },
            edges: 'hide', collapsible: false } }],
    ['FinalState', { kind: 'vertex', metaclasses: ['FinalState'], label: 'Final state', defaultSize: { width: 30, height: 30 },
        shape: { form: 'circle', border: { width: 4, style: 'double' }, labels: [{ position: 'outside', anchor: 's', source: I('name') }] } }],
    ['Pseudostate', { kind: 'vertex', metaclasses: ['Pseudostate'], label: 'Pseudostate', defaultSize: { width: 20, height: 20 },
        shape: { form: 'circle', fill: '#1f2937', border: { width: 0 } } }],
    // `trigger [guard]` as the derived statecharts read it (P-2026-10-03-1304, Q6): a second view for a guarded one.
    ['Transition', { kind: 'edge', metaclasses: ['Transition'], label: 'Transition', edge: { ...transitionEdge, labels: { center: P('$trigger.value') } } }],
    ['Transition', { kind: 'edge', metaclasses: ['Transition'], label: 'Transition (guard)', priority: 1, predicate: { op: 'exists', path: '$guard.value' },
        edge: { ...transitionEdge, labels: { template: [P('$trigger.value'), { from: 'literal', text: ' [' }, P('$guard.value'), { from: 'literal', text: ']' }] } } }],
];

// ── The metamodel: the UML fragment ──────────────────────────────────────────────────────────────────────────────

const SC_CLASSES: Array<[string, boolean, string[]]> = [
    ['NamedElement', true, []], ['StateMachine', false, ['NamedElement']], ['Region', false, ['NamedElement']],
    ['Vertex', true, ['NamedElement']], ['State', false, ['Vertex']], ['Pseudostate', false, ['Vertex']],
    ['FinalState', false, ['State']], ['Transition', false, ['NamedElement']],
];
const SC_REFS: Array<[string, string, string, boolean, boolean]> = [
    ['StateMachine', 'regions', 'Region', true, true],
    ['Region', 'subvertex', 'Vertex', true, true], ['Region', 'transitions', 'Transition', true, true],
    ['Region', 'state', 'State', false, false],
    ['State', 'regions', 'Region', true, true],
    ['Transition', 'source', 'Vertex', false, false], ['Transition', 'target', 'Vertex', false, false],
];
/** [class, attribute]: the string attributes past `name`; every one 0..1, as `Region.state` and the lists. */
const SC_ATTRS: Array<[string, string]> = [['Pseudostate', 'kind'], ['Transition', 'trigger'], ['Transition', 'guard']];

// ── The model: [key, class, name, x, y] ─────────────────────────────────────────────────────────────────────────

const SC_OBJECTS: Array<[string, string, string, number, number, null]> = [
    ['sm', 'StateMachine', 'Machine', 1300, 40, null], ['top', 'Region', 'top', 1300, 100, null],
    ['i0', 'Pseudostate', 'i0', 40, 480, null], ['idle', 'State', 'Idle', 100, 460, null],
    ['active', 'State', 'Active', 100, 100, null], ['done', 'FinalState', 'Done', 880, 220, null],
    ['a1', 'Region', 'A1', 1300, 160, null], ['a2', 'Region', 'A2', 1300, 220, null],
    ['i1', 'Pseudostate', 'i1', 120, 164, null], ['waiting', 'State', 'Waiting', 170, 144, null], ['processing', 'State', 'Processing', 360, 144, null],
    ['i2', 'Pseudostate', 'i2', 116, 286, null], ['running', 'State', 'Running', 1300, 280, null], ['paused', 'State', 'Paused', 600, 266, null],
    ['r', 'Region', 'R', 1300, 340, null],
    ['i3', 'Pseudostate', 'i3', 180, 300, null], ['fetch', 'State', 'Fetch', 220, 280, null], ['compute', 'State', 'Compute', 400, 280, null],
];
/** [key, owner region, source, target, trigger, guard]. */
const SC_TRANSITIONS: Array<[string, string, string, string, string, string]> = [
    ['t0', 'top', 'i0', 'idle', '', ''], ['t1', 'top', 'idle', 'active', 'start', ''], ['t2', 'top', 'active', 'done', 'stop', ''],
    ['t3', 'top', 'compute', 'idle', 'abort', 'fatal'],
    ['t4', 'a1', 'i1', 'waiting', '', ''], ['t5', 'a1', 'waiting', 'processing', 'job', ''],
    ['t6', 'a2', 'i2', 'running', '', ''], ['t7', 'a2', 'running', 'paused', 'pause', ''], ['t8', 'a2', 'paused', 'fetch', 'resume', ''],
    ['t9', 'r', 'i3', 'fetch', '', ''], ['t10', 'r', 'fetch', 'compute', 'fetched', 'ok'],
];
const SC_CONTAINMENT: Array<[string, string, string]> = [
    ['sm', 'regions', 'top'],
    ...['i0', 'idle', 'active', 'done'].map((k): [string, string, string] => ['top', 'subvertex', k]),
    ['active', 'regions', 'a1'], ['active', 'regions', 'a2'],
    ...['i1', 'waiting', 'processing'].map((k): [string, string, string] => ['a1', 'subvertex', k]),
    ...['i2', 'running', 'paused'].map((k): [string, string, string] => ['a2', 'subvertex', k]),
    ['running', 'regions', 'r'],
    ...['i3', 'fetch', 'compute'].map((k): [string, string, string] => ['r', 'subvertex', k]),
    ...SC_TRANSITIONS.map(([t, owner]): [string, string, string] => [owner, 'transitions', t]),
];
const SC_REFERENCES: Array<[string, string, string]> = [
    ['a1', 'state', 'active'], ['a2', 'state', 'active'], ['r', 'state', 'running'],
    ...SC_TRANSITIONS.flatMap(([t, , s, g]): Array<[string, string, string]> => [[t, 'source', s], [t, 'target', g]]),
];

/** The project, the metamodel, the model and the viewpoint, drawn in the light theme. */
async function buildStatechartScene(browser: Browser) {
    const { page, errors } = await openPage(browser);
    const pid = await createProject(page, `GV_S2b_statechart_${TAG}_${Date.now()}`);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(4000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    meas('metamodel', await buildMetamodel(page, SC_CLASSES, SC_REFS, 'NamedElement'));
    const pkgJs = `const pkg = w.LProject.getProject().metamodels[0].packages[0]; const cls = (n) => pkg.classes.find((c) => c.name === n);`;
    for (const [c, a] of SC_ATTRS) {
        await ev(page, `${pkgJs} cls(a[0]).addAttribute(a[1]); return 1;`, [c, a]);
        await ev(page, `${pkgJs} const at = cls(a[0]).attributes.find((x) => x.name === a[1]); at.lowerBound = 0; return 1;`, [c, a]);
    }
    for (const [owner, ref] of [['Region', 'state'], ['State', 'regions'], ['StateMachine', 'regions'], ['Region', 'subvertex'], ['Region', 'transitions']]) {
        await ev(page, `${pkgJs} const r = cls(a[0]).references.find((x) => x.name === a[1]); r.lowerBound = 0; return 1;`, [owner, ref]);
    }
    const shell = await buildModelShell(page);
    if (!shell.graphId) { check('statechart: v2-flow graph exists', false, shell); return null; }
    const objects = [...SC_OBJECTS, ...SC_TRANSITIONS.map(([t], i): [string, string, string, number, number, null] => [t, 'Transition', t, 1500, 40 + 40 * i, null])];
    const ids = await buildObjects(page, shell.graphId, objects);
    meas('objects', Object.keys(ids).length);
    await buildLinks(page, ids, SC_CONTAINMENT, SC_REFERENCES);
    const setAttr = async (key: string, feature: string, value: string) => ev(page, `const o = w.LPointerTargetable.fromPointer(a.obj);
        o['$' + a.f].values = [a.v]; return 1;`, { obj: ids[key].obj, f: feature, v: value }, 200);
    for (const k of ['i0', 'i1', 'i2', 'i3']) await setAttr(k, 'kind', 'initial');
    for (const [t, , , , trigger, guard] of SC_TRANSITIONS) {
        if (trigger) await setAttr(t, 'trigger', trigger);
        if (guard) await setAttr(t, 'guard', guard);
    }
    meas('viewpoint', await buildViewpoint(page, 'Statechart', SC_VIEWS));
    await setTheme(page, 'light');
    await pickViewpoint(page, 'Statechart');
    await page.waitForTimeout(SETTLE_MS);
    return { page, errors, ids, shell };
}

const by = (ns: Box[], ids: Record<string, { vertex: string }>, key: string) => ns.find((n) => n.id === ids[key].vertex);

async function sceneStatechart(browser: Browser, out: Record<string, unknown>) {
    const scene = await buildStatechartScene(browser);
    if (!scene) return;
    const { page, errors, ids } = scene;
    const res: Record<string, unknown> = { tag: TAG, ids };
    out.statechart = res;
    const at = (ns: Box[], key: string) => by(ns, ids, key)!;
    const hit = async (x: number, y: number) => page.evaluate(([x, y]) => {
        const el = document.elementFromPoint(x, y) as HTMLElement | null;
        return { cls: String(el?.className ?? '').slice(0, 60), node: (el?.closest('.react-flow__node') as HTMLElement | null)?.dataset.id ?? null };
    }, [x, y] as const);
    const nodes0 = await readNodes(page);
    res.nodes0 = nodes0.map((n) => `${n.name} ${n.x},${n.y} ${n.w}x${n.h} z${n.z}`);
    meas('nodes', res.nodes0);
    await shoot(page, `s2b-statechart-${TAG}-light.png`);

    // 1. Running is its own frame: every substate inside with at least the padding, the name in the band on top.
    const run = by(nodes0, ids, 'running');
    const subs = ['i3', 'fetch', 'compute'].map((k) => by(nodes0, ids, k));
    const margins = run && subs.every(Boolean) ? subs.map((s) => ({
        left: s!.x - run.x, right: run.x + run.w - (s!.x + s!.w), top: s!.y - (run.y + BAND.size), bottom: run.y + run.h - (s!.y + s!.h),
    })) : null;
    const label = await page.evaluate((id) => {
        const n = document.querySelector(`.dock-tabpane-active .react-flow__node[data-id="${id}"]`) as HTMLElement | null;
        const band = n?.querySelector('.ir-header-band') as HTMLElement | null;
        const l = band?.querySelector('.ir-label') as HTMLElement | null;
        if (!n || !band || !l) return null;
        const nr = n.getBoundingClientRect(); const br = band.getBoundingClientRect(); const lr = l.getBoundingClientRect();
        return { text: l.textContent, bandTop: br.top - nr.top, bandH: br.height, labelInside: lr.left >= nr.left && lr.right <= nr.right && lr.top >= nr.top && lr.bottom <= br.bottom + 0.5 };
    }, ids.running.vertex);
    check('S2b-1 Running contains every substate with at least the padding; its name sits in the band at its top',
        !!margins && margins.every((m) => Math.min(m.left, m.right, m.top, m.bottom) >= PAD - 0.5)
        // The band starts at the top of the box, inside its border (screen px, at most the border and a rounding).
        && !!label && label.text === 'Running' && label.bandTop >= -0.5 && label.bandTop <= 3 && label.labelInside,
        { running: run && [run.x, run.y, run.w, run.h], margins, label });

    // 2. Active's regions fill its inner width under the band, stacked, and share one dashed line.
    const act = by(nodes0, ids, 'active'); const a1 = by(nodes0, ids, 'a1'); const a2 = by(nodes0, ids, 'a2');
    const borders = await page.evaluate((v) => v.map((id) => {
        const c = document.querySelector(`.dock-tabpane-active .react-flow__node[data-id="${id}"] .ir-node-content`) as HTMLElement | null;
        if (!c) return null;
        const s = getComputedStyle(c);
        return { bottom: `${s.borderBottomStyle} ${s.borderBottomWidth} ${s.borderBottomColor}`, top: `${s.borderTopStyle} ${s.borderTopColor}` };
    }), [ids.a1.vertex, ids.a2.vertex]);
    check('S2b-2 Active\'s two regions fill its inner width under the band and share one dashed border',
        !!act && !!a1 && !!a2 && [a1, a2].every((r) => Math.abs(r.x - act.x) < 0.5 && Math.abs(r.w - act.w) < 0.5)
        && Math.abs(a1.y - (act.y + BAND.size)) < 0.5 && Math.abs(a1.y + a1.h - a2.y) < 0.5 && Math.abs(a2.y + a2.h - (act.y + act.h)) < 0.5
        && !!borders[0] && borders[0].bottom.startsWith('dashed') && !!borders[1] && borders[1].top.endsWith('rgba(0, 0, 0, 0)'),
        { active: act && [act.x, act.y, act.w, act.h], a1: a1 && [a1.x, a1.y, a1.w, a1.h], a2: a2 && [a2.x, a2.y, a2.w, a2.h], borders });

    // 3. No hull: the self-framed containers are their own frame.
    const hulls = await readHulls(page);
    check('S2b-3 no hull element for the self-framed containers (none at all in this viewpoint)', hulls.length === 0, hulls);

    // 4. Active dragged by its band: every descendant moves by exactly its delta, on screen and in the records.
    const desc = ['a1', 'a2', 'i1', 'waiting', 'processing', 'i2', 'running', 'paused', 'i3', 'fetch', 'compute'];
    const ab = await screenBox(page, ids.active.vertex);
    const press = ab ? { x: ab.x + 60, y: ab.y + 8 } : null;
    const pressedOn = press ? await hit(press.x, press.y) : null;
    if (press) await drag(page, press, { x: press.x + 140, y: press.y + 60 }, 2500);
    const nodes4 = await readNodes(page);
    const dA = { x: at(nodes4, 'active').x - at(nodes0, 'active').x, y: at(nodes4, 'active').y - at(nodes0, 'active').y };
    const deltas = desc.map((d) => ({ d, dx: at(nodes4, d).x - at(nodes0, d).x, dy: at(nodes4, d).y - at(nodes0, d).y }));
    const recs = await records(page, ids);
    check('S2b-4 Active dragged: every descendant moves by exactly Active\'s delta',
        pressedOn?.node === ids.active.vertex && dA.x !== 0 && deltas.every((v) => Math.abs(v.dx - dA.x) < 0.5 && Math.abs(v.dy - dA.y) < 0.5),
        { pressedOn, dActive: dA, deltas });
    check('S2b-4b the substates\' records moved with it', ['i1', 'waiting', 'paused', 'fetch', 'compute'].every((d) => Math.abs(recs[d].x - at(nodes4, d).x) < 0.5 && Math.abs(recs[d].y - at(nodes4, d).y) < 0.5),
        Object.fromEntries(['waiting', 'fetch', 'compute'].map((d) => [d, [recs[d].x, recs[d].y, at(nodes4, d).x, at(nodes4, d).y]])));
    // Active is selected by its drag: React Flow lifts a selected node by 1000, and a layout container takes it back,
    // so its regions and Running stay drawn above it.
    const zs = await page.evaluate((v) => v.map((id) => {
        const n = document.querySelector(`.dock-tabpane-active .react-flow__node[data-id="${id}"]`) as HTMLElement | null;
        return n ? { z: Number(n.style.zIndex), selected: n.classList.contains('selected') } : null;
    }), [ids.active.vertex, ids.a1.vertex, ids.a2.vertex, ids.running.vertex]);
    check('S2b-4c with Active selected, its regions and Running are still drawn above it',
        !!zs[0]?.selected && zs.every(Boolean) && zs[0]!.z < zs[1]!.z && zs[0]!.z < zs[2]!.z && zs[2]!.z < zs[3]!.z,
        { active: zs[0], a1: zs[1], a2: zs[2], running: zs[3] });
    await shoot(page, `s2b-active-moved-${TAG}-light.png`);

    // 5. Running collapsed: its substates go, the transitions that cross its border are lifted to it, the badge shows.
    const edgesBefore = await readEdges(page);
    const runBefore = at(nodes4, 'running');
    const chip = page.locator(`.dock-tabpane-active .react-flow__node[data-id="${ids.running.vertex}"] .ir-collapse-chip`).first();
    const chipFound = (await chip.count()) > 0;
    // The chip of a layout container sits under the edges (the container's z-index is below them), and an edge crossing
    // it takes the pointer: the click is dispatched on the chip, and what a pointer would hit there is recorded.
    const cb = chipFound ? await chip.boundingBox() : null;
    const chipCovered = cb ? await hit(cb.x + cb.width / 2, cb.y + cb.height / 2) : null;
    if (chipFound) { await chip.dispatchEvent('click'); await page.waitForTimeout(2500); }
    const nodes5 = await readNodes(page);
    const edges5 = await readEdges(page);
    const edgeOf = (t: string) => edges5.filter((e) => e.id.includes(ids[t].obj));
    const t3 = edgeOf('t3'); const t8 = edgeOf('t8');
    const badge = await page.locator(`.dock-tabpane-active .react-flow__node[data-id="${ids.running.vertex}"] .bi-diagram-2`).count();
    const runAfter = by(nodes5, ids, 'running');
    const substatesGone = ['i3', 'fetch', 'compute'].every((k) => !by(nodes5, ids, k));
    check('S2b-5 Running collapsed: substates hidden, Compute→Idle lifted to Running→Idle, Paused→Fetch to Paused→Running, internal ones gone, badge shown',
        chipFound && substatesGone
        && t3.length === 1 && t3[0].source === ids.running.vertex && t3[0].target === ids.idle.vertex
        && t8.length === 1 && t8[0].source === ids.paused.vertex && t8[0].target === ids.running.vertex
        && edgeOf('t9').length === 0 && edgeOf('t10').length === 0 && badge > 0
        && !!runAfter && runAfter.w < runBefore.w && runAfter.h < runBefore.h
        // Collapsed, it keeps the top-left of its frame.
        && Math.abs(runAfter.x - runBefore.x) < 0.5 && Math.abs(runAfter.y - runBefore.y) < 0.5,
        { chipFound, chipCovered, substatesGone, t3, t8, internal: [edgeOf('t9').length, edgeOf('t10').length], badge,
            running: [runBefore.x, runBefore.y, runBefore.w, runBefore.h, runAfter?.x, runAfter?.y, runAfter?.w, runAfter?.h],
            edgesBefore: edgesBefore.length, edgesAfter: edges5.length });
    await shoot(page, `s2b-running-collapsed-${TAG}-light.png`);
    res.collapse = { chipFound, chipCovered, t3, t8, badge, runBefore, runAfter };
    res.errors = errors.slice(0, 20);
    meas('errors', errors.slice(0, 5));
}

/** S6: after one Auto layout, every substate in its frame, each region with its own states inside Active, no overlap;
 *  a second Auto layout gives the same positions. */
async function sceneS6(browser: Browser, out: Record<string, unknown>) {
    const scene = await buildStatechartScene(browser);
    if (!scene) return;
    const { page, errors, ids } = scene;
    const res: Record<string, unknown> = { tag: TAG };
    out.s6 = res;
    const named = (ns: Box[]) => Object.fromEntries(ns.filter((n) => n.name).map((n) => [n.name, [n.x, n.y, n.w, n.h]]));
    res.before = named(await readNodes(page));
    await autoLayout(page);
    const n1 = await readNodes(page);
    res.after1 = named(n1);
    const at = (k: string) => n1.find((n) => n.id === ids[k].vertex)!;
    const inside = (c: Box, p: Box) => c.x >= p.x - 0.5 && c.y >= p.y - 0.5 && c.x + c.w <= p.x + p.w + 0.5 && c.y + c.h <= p.y + p.h + 0.5;
    const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const holds: Array<[string, string[]]> = [['running', ['i3', 'fetch', 'compute']], ['a1', ['i1', 'waiting', 'processing']], ['a2', ['i2', 'running', 'paused']], ['active', ['a1', 'a2']]];
    const outside = holds.flatMap(([p, cs]) => cs.filter((c) => !inside(at(c), at(p))).map((c) => `${c} outside ${p}`));
    check('S6-SC-1 every substate inside its frame; Active\'s regions inside Active, each with its own states', outside.length === 0,
        { outside, boxes: Object.fromEntries(['active', 'a1', 'a2', 'running', 'i3', 'fetch', 'compute', 'paused'].map((k) => [k, [at(k).x, at(k).y, at(k).w, at(k).h]])) });
    const levels = [['i0', 'idle', 'active', 'done'], ['i1', 'waiting', 'processing'], ['i2', 'running', 'paused'], ['i3', 'fetch', 'compute']];
    const pairs = levels.flatMap((l) => l.flatMap((a, i) => l.slice(i + 1).filter((b) => overlaps(at(a), at(b))).map((b) => `${a}/${b}`)));
    check('S6-SC-2 no overlap among the nodes of one level (root, each region, Running)', pairs.length === 0, pairs);
    await shoot(page, `s6-statechart-${TAG}-light.png`, 3);
    await autoLayout(page);
    const n2 = await readNodes(page);
    res.after2 = named(n2);
    const moved = n1.filter((n) => { const m = n2.find((x) => x.id === n.id); return !m || Math.abs(m.x - n.x) > 1 || Math.abs(m.y - n.y) > 1 || Math.abs(m.w - n.w) > 1 || Math.abs(m.h - n.h) > 1; });
    check('S6-SC-3 a second Auto layout gives the same positions and sizes (within 1 px)', moved.length === 0, moved.map((n) => n.name));
    res.errors = errors.slice(0, 20);
}

if (process.argv[1] && /statechart-fixture\.ts$/.test(process.argv[1])) {
    const browser = await chromium.launch();
    const out: Record<string, unknown> = { url: URL, tag: TAG, at: new Date().toISOString() };
    try {
        if (ONLY.includes('statechart')) await sceneStatechart(browser, out);
        if (ONLY.includes('s6')) await sceneS6(browser, out);
    } finally {
        out.checks = { pass, fail };
        const file = ONLY.join('-') === 'statechart' ? `statechart-${TAG}.json` : `statechart-${ONLY.join('-')}-${TAG}.json`;
        writeFileSync(`${OUT}/${file}`, JSON.stringify(out, null, 2));
        meas('json', `${OUT}/${file}`);
        await browser.close();
    }
    console.log(`DONE pass=${pass} fail=${fail}`);
    process.exit(fail === 0 ? 0 : 1);
}
