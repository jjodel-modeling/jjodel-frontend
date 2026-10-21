/**
 * build-hw-cpu (P-2026-10-21-1036, slice S-A1 of the hardware demonstrator plan,
 * docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md §10.1): builds the `HwDesign` metamodel and the CPU model
 * `cpu` in a running app and saves them as the project file frontend/public/examples/hw/hw-cpu.jjodel.
 *
 * The file is written by the app's own export, not by hand (R9 of the plan). Nothing is imported: no base scene holds
 * this metamodel, so the build starts from nothing, in a fresh browser context, with the helpers of
 * scripts/probe/bpmn-lanes-fixture.ts:
 *   - New Project on the dashboard, «New metamodel», then the metamodel of the spec through the L-API: every DClass of
 *     the spec (`pkg.addClass`, `abstract`, `extends`), every DAttribute (`addAttribute` with its primitive pointer) and
 *     DReference (`addReference`, `composition`), with the spec's bounds;
 *   - a new model (`buildModelShell`), named as the spec's model, its objects created through the canvas
 *     (`syncCreateObject`, `buildObjects`), the containment slots appended by the canvas write path
 *     (`syncCreateCompositionLink`, `buildLinks`), the other references by `syncSetReferenceValue`, the attribute
 *     slots through the L proxy (`o.$f.values`);
 *   - the store read back and compared with the spec, element by element, by name;
 *   - the metamodel's bag with the `state` setter (slice S-B, P-2026-10-21-1145): the simulation roles and the
 *     declarations of `value` on `Register` and `Cell`, the spec's ids mapped to the app's by name, inside the
 *     declarations' JSON too (their metaclass and width feature); the spec's scenario stored on the model under its
 *     name, as the simulator stores it (`runScenarios`); both read back;
 *   - the project renamed (`HW CPU`), the model opened once so its layout is stored, and Navbar's File → «Download
 *     Project» clicked (`ProjectsApi.save`, `buildProjectExportJson`, `U.download`): the browser's download is the file.
 * The spec, src/codegen/examples/hw-cpu/hw-cpu.json, is the truth the node tests read (importable.test.ts,
 * hw-cpu.run.test.ts).
 *
 * The three viewpoints of the plan (slice S-A2, P-2026-10-21-1545), ISA, Datapath and Control, are written by hand
 * with the IR as build-gallery.ts writes its own (R-LIB-9), the first made active; each viewpoint's vertices are
 * placed and sized under it (`places`). Then the saved file is imported as a user imports it (File → Import Project),
 * each viewpoint opened, measured against the acceptance criterion of the prompt and photographed (`verify`).
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/examples/build-hw-cpu.ts \
 *         --port 3097 --id P-2026-10-21-1100
 * Env:  HWB_DIR  the output folder (default frontend/public/examples/hw)
 *       HWB_SHOTS        the screenshots' folder (default docs/discovery/assets/hw-sa2)
 *       HWB_VERIFY_ONLY  set: the import check alone, on the file already in HWB_DIR
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { seed } from '../smoke/states.ts';
import { buildModelShell, buildObjects, createProject, ev, pickViewpoint } from '../probe/bpmn-lanes-fixture.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3097/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const DIR = process.env.HWB_DIR || new globalThis.URL('../../public/examples/hw', import.meta.url).pathname;
const NAME = 'hw-cpu';
/** The project name the file carries; an import shows it with the app's ` copy` suffix. */
const PROJECT = 'HW CPU';
const PRIMITIVES = new Set(['Pointer_EINT', 'Pointer_ESTRING', 'Pointer_EBOOLEAN', 'Pointer_EXPRESSION', 'Pointer_ACTION']);
mkdirSync(DIR, { recursive: true });

type Entry = Record<string, any>;
interface Scenario { name: string; steps: Array<{ event: string | null; selector: string | null; kind: string }>; expect?: string }
const spec: { lookup: Record<string, Entry>; scenario?: Scenario } = JSON.parse(readFileSync(new globalThis.URL(`../../src/codegen/examples/${NAME}/${NAME}.json`, import.meta.url), 'utf8'));
const lookup = spec.lookup;
const of = (className: string) => Object.values(lookup).filter(d => d.className === className);
const MM = lookup.MM, M = lookup.M;

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 1500)}`);
};

async function poll<T>(page: Page, expr: string, ms: number): Promise<T | null> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        const v = await page.evaluate(expr).catch(() => null) as T | null;
        if (v) return v;
        await page.waitForTimeout(250);
    }
    return null;
}

// ── The spec, read as the build needs it ─────────────────────────────────────────────────────────────────────────

/** Class name of a class id of the spec. */
const cname = (cid: string) => lookup[cid].name as string;
/** Every feature of a class of the spec, inherited ones first, as the objects' `features` list them. */
const featuresOf = (cid: string): Entry[] => [
    ...(lookup[cid].extends as string[]).flatMap(featuresOf),
    ...Object.values(lookup).filter(d => (d.className === 'DAttribute' || d.className === 'DReference') && d.father === cid),
];
/** Per object: its class name and every slot, a reference's values as object names (the spec's ids are its names). */
function expected(): Record<string, { cls: string; f: Record<string, unknown[]> }> {
    const out: Record<string, { cls: string; f: Record<string, unknown[]> }> = {};
    for (const o of of('DObject')) {
        const f: Record<string, unknown[]> = {};
        for (const vid of o.features) {
            const v = lookup[vid];
            f[lookup[v.instanceof].name] = v.values.map((x: unknown) => (lookup[v.instanceof].className === 'DReference' ? lookup[x as string].name : x));
        }
        out[o.name] = { cls: cname(o.instanceof), f: Object.fromEntries(Object.entries(f).sort(([a], [b]) => (a < b ? -1 : 1))) };
    }
    return out;
}

/** The canvas positions: one band of rows per group, eight vertices a row, in the spec's order. */
function layout(): Array<[string, string, string, number, number, null]> {
    const groups: Array<(o: Entry) => boolean> = [
        o => ['Format', 'Field', 'Instruction'].includes(cname(o.instanceof)),
        o => ['Register', 'Alu', 'Mux', 'Memory'].includes(cname(o.instanceof)),
        o => cname(o.instanceof) === 'Port',
        o => cname(o.instanceof) === 'Wire',
        o => ['State', 'InitialState', 'FinalState'].includes(cname(o.instanceof)),
        o => cname(o.instanceof) === 'Transition',
        o => cname(o.instanceof) === 'Cell',
    ];
    const out: Array<[string, string, string, number, number, null]> = [];
    let row = 0;
    for (const g of groups) {
        const members = of('DObject').filter(g);
        members.forEach((o, i) => out.push([o.name, cname(o.instanceof), o.name, 40 + (i % 8) * 220, 40 + (row + Math.floor(i / 8)) * 120, null]));
        row += Math.ceil(members.length / 8) + 1;
    }
    return out;
}

// ── The three viewpoints of D2 (slice S-A2, P-2026-10-21-1545): hand-written with the IR (R-LIB-9) ────────────────
// R3, R4, R10, R11 of the plan: a port is an object with its own vertex, set on its component's border and never
// nested in it; a wire is an object drawn as an edge from port to port; no derived viewpoint.

type View = [string, Record<string, unknown>];
interface Viewpoint { name: string; views: View[] }

const I = (prop: string) => ({ from: 'intrinsic', prop });
const P = (expr: string) => ({ from: 'path', expr });
const L = (text: string) => ({ from: 'literal', text });
const INK = '#1f2937';
const GREY = '#6b7280';
const arrow = { sourceEnd: 'none', targetEnd: 'openArrow' };
/** Every concrete class of HwDesign: a viewpoint draws the ones it names and hides the others. */
const CONCRETE = ['Format', 'Field', 'Instruction', 'Register', 'Alu', 'Mux', 'Memory', 'Cell', 'Port', 'Wire', 'State', 'InitialState', 'FinalState', 'Transition'];
/** Not drawn, and its containment arcs go with it (irContainment.ts). */
const hidden = (c: string): View => [c, { kind: 'vertex', metaclasses: [c], label: `${c} (not drawn)`, visible: false, shape: { form: 'rect' } }];
/** No edge view hides a reference edge (statechart-fixture.ts SC_VIEWS): one that must not show is drawn clear. */
const clear = (c: string, ref: string): View =>
    [c, { kind: 'edge', metaclasses: [c], reference: ref, label: `${c}.${ref} (drawn clear)`,
        edge: { line: { color: 'transparent', width: 1 }, terminations: { sourceEnd: 'none', targetEnd: 'none' } } }];
/** The views of one viewpoint, then a hidden view for every class it does not draw. */
const only = (drawn: string[], views: View[]): View[] => [...views, ...CONCRETE.filter(c => !drawn.includes(c)).map(hidden)];
/** One row per slot, `name = value`, in the mono face. */
const rows = (id: string, from: 'attributes'): Record<string, unknown> =>
    ({ id, source: { from }, rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }], style: { fontSize: 12, fontFamily: 'mono' } } });
const title = (source: unknown, extra: Record<string, unknown> = {}) => ({ position: 'top', source, style: { fontWeight: 'semibold', fontFamily: 'mono', ...extra } });

/** A component's side: one size for every component, since a layout record does not carry a size per viewpoint. */
const CW = 110;
/** A component of the datapath: its name, and its metaclass under it. */
const component = (c: string): View =>
    [c, { kind: 'vertex', metaclasses: [c], label: c, defaultSize: { width: CW, height: CW },
        shape: { form: 'rect', fill: '#ffffff', border: { width: 2, color: INK }, labels: [
            { position: 'center', source: I('name'), style: { fontSize: 15, fontWeight: 'semibold', fontFamily: 'mono' } },
            { position: 'bottom', source: I('metaclassName'), style: { fontSize: 11, color: GREY } },
        ] } }];
const OUTPUT = { op: 'eq', left: '$output.value', right: { kind: 'boolean', value: true } };
/** The port's size: its name over its width (at 40 high the width row covered half the name). */
const PW = 80, PH = 50;
/** From the state that owns it (`State.out` is a composition) to `next`. */
const transition = { source: 'container', target: '$next.value', line: { width: 1.25, color: INK }, terminations: arrow, curve: 'arc' };
const state = (c: string, extra: Record<string, unknown> = {}): View =>
    [c, { kind: 'vertex', metaclasses: [c], label: c, defaultSize: { width: 124, height: 44 },
        shape: { form: 'rounded', fill: '#ffffff', border: { width: 1.5, color: INK },
            labels: [{ position: 'center', source: I('name'), style: { fontWeight: 'semibold', fontFamily: 'mono' } }], ...extra } }];

const VIEWPOINTS: Viewpoint[] = [
    // The instruction format with its fields and their bit ranges, and the ten instructions with their opcodes.
    { name: 'ISA', views: only(['Format', 'Field', 'Instruction'], [
        ['Format', { kind: 'vertex', metaclasses: ['Format'], label: 'Format', defaultSize: { width: 340, height: 64 },
            shape: { form: 'rect', fill: '#f3f4f6', border: { width: 1.5, color: INK }, labels: [title(I('name'))] }, fieldCompartments: [rows('width', 'attributes')] }],
        ['Field', { kind: 'vertex', metaclasses: ['Field'], label: 'Field (bits hi..lo)', defaultSize: { width: 170, height: 84 },
            shape: { form: 'rect', fill: '#ffffff', border: { width: 1.5, color: INK }, labels: [title(I('name'))] }, fieldCompartments: [rows('bits', 'attributes')] }],
        ['Instruction', { kind: 'vertex', metaclasses: ['Instruction'], label: 'Instruction', defaultSize: { width: 150, height: 84 },
            shape: { form: 'rounded', fill: '#ffffff', border: { width: 1.5, color: INK }, labels: [title(I('name'), { fontSize: 14 })] },
            fieldCompartments: [rows('opcode', 'attributes')] }],
        // The format is a row of every instruction box; ten arcs onto one box would say it again.
        clear('Instruction', 'format'),
        clear('Format', 'fields'),
    ]) },
    // Every component a box, every port a vertex on its border, every wire an edge from port to port.
    { name: 'Datapath', views: only(['Register', 'Alu', 'Mux', 'Memory', 'Port', 'Wire'], [
        component('Register'), component('Alu'), component('Mux'), component('Memory'),
        ['Port', { kind: 'vertex', metaclasses: ['Port'], label: 'Port (an output is shaded)', defaultSize: { width: PW, height: PH },
            shape: { form: 'rect', fill: { when: OUTPUT, then: '#dbeafe', else: '#ffffff' }, border: { width: 1, color: INK },
                labels: [{ position: 'top', source: I('name'), style: { fontSize: 11, fontFamily: 'mono' } }] },
            fieldCompartments: [{ id: 'width', source: { from: 'attributes', exclude: ['output'] },
                rowFormat: { segments: [{ kind: 'value' }, { kind: 'literal', text: ' bit' }], style: { fontSize: 10, color: GREY } } }] }],
        ['Wire', { kind: 'edge', metaclasses: ['Wire'], label: 'Wire (port to port)',
            edge: { source: '$src.value', target: '$tgt.value', line: { width: 1.5, color: INK }, terminations: arrow, curve: 'arc' } }],
        clear('Component', 'ports'),
        clear('Memory', 'cells'),
    ]) },
    // The eleven states, FETCH first, and every transition labelled with its guard.
    { name: 'Control', views: only(['State', 'InitialState', 'FinalState', 'Transition'], [
        state('State'),
        state('InitialState', { entry: 'dot' }),
        ['FinalState', { kind: 'vertex', metaclasses: ['FinalState'], label: 'FinalState', defaultSize: { width: 30, height: 30 },
            shape: { form: 'circle', fill: '#ffffff', border: { width: 1.5, color: INK }, marker: 'dot-large',
                labels: [{ position: 'outside', anchor: 's', source: I('name'), style: { fontFamily: 'mono' } }] } }],
        ['Transition', { kind: 'edge', metaclasses: ['Transition'], label: 'Transition', edge: transition }],
        ['Transition', { kind: 'edge', metaclasses: ['Transition'], label: 'Transition (guard)', priority: 1, predicate: { op: 'exists', path: '$guard.value' },
            edge: { ...transition, labels: { template: [L('['), P('$guard.value'), L(']')] } } }],
        // DECODE's `else` and NOP's guard run DECODE → FETCH side by side, and a fan of arcs puts every centre label at
        // mid-height: the `else` one is drawn at its source end, beside the arc as it leaves DECODE.
        ['Transition', { kind: 'edge', metaclasses: ['Transition'], label: 'Transition (else)', priority: 2,
            predicate: { op: 'eq', left: '$guard.value', right: { kind: 'string', value: 'else' } },
            edge: { ...transition, labels: { sourceEnd: L('[else]') } } }],
    ]) },
];

/**
 * Where each drawn vertex sits (flow px, top left) and its size, by object name: the three viewpoints in three
 * bands, so each fits on its own. The datapath reads left to right, a port abutting its component's side, the
 * feedback wires set on the top and bottom sides so that no wire crosses a component; the control places FETCH
 * first, at the top, DECODE under it, and the states DECODE reaches in two columns either side of them. An object-as-edge
 * takes a handle per edge on the side it enters, unclamped (irEdgeViews.ts assignGeometricHandles), and React Flow
 * refuses an index past MAX_HANDLES_PER_SIDE (4): so no side of FETCH or DECODE takes more than four ends of one role.
 */
function places(): Record<string, [number, number, number, number]> {
    const at: Record<string, [number, number, number, number]> = {};
    // ISA: the format over its fields, the instructions in two rows of five.
    at.fmt = [245, 0, 340, 64];
    at.opcode = [245, 64, 170, 84];
    at.operand = [415, 64, 170, 84];
    of('DObject').filter(o => cname(o.instanceof) === 'Instruction')
        .forEach((o, i) => { at[o.name] = [(i % 5) * 170, 210 + Math.floor(i / 5) * 104, 150, 84]; });
    // Datapath: a component and the side of each of its ports, in the order the ports stack on that side.
    const DY = 1000, G = 10;
    const comp = (name: string, x: number, y: number, sides: Record<string, 'l' | 'r' | 't' | 'b'>) => {
        const w = CW, h = CW;
        at[name] = [x, y + DY, w, h];
        for (const s of ['l', 'r', 't', 'b'] as const) {
            const ports = Object.keys(sides).filter(p => sides[p] === s);
            ports.forEach((p, k) => {
                const vert = s === 'l' || s === 'r';
                const span = ports.length * (vert ? PH : PW) + (ports.length - 1) * G;
                const along = (vert ? (h - span) / 2 + k * (PH + G) : (w - span) / 2 + k * (PW + G));
                at[`${name}_${p}`] = vert
                    ? [s === 'l' ? x - PW : x + w, y + DY + along, PW, PH]
                    : [x + along, s === 't' ? y + DY - PH : y + DY + h, PW, PH];
            });
        }
    };
    comp('pcMux', 160, 0, { a: 't', b: 'b', y: 'r' });
    comp('pcInc', 480, -220, { y: 'l', a: 'r' });
    comp('PC', 480, 0, { d: 'l', q: 'r' });
    comp('rom', 800, 0, { addr: 'l', data: 'r' });
    comp('IR', 1120, 0, { d: 'l', q: 'b' });
    comp('ram', 480, 330, { addr: 't', din: 'b', dout: 'r' });
    comp('accMux', 800, 330, { a: 'l', b: 't', y: 'r' });
    comp('alu', 1120, 330, { b: 'l', a: 'b', z: 'r', y: 'r' });
    comp('Z', 1440, 170, { d: 'l', q: 'r' });
    comp('ACC', 1440, 440, { d: 'l', q: 'b' });
    // Control: FETCH first, DECODE under it, the states it reaches in opcode order down the left column and then the
    // right one, HALT last. Every column state is nearer FETCH and DECODE across than down, so its two ends take the
    // left or right side of each: four a side; the two returns from DECODE and the step to it take the vertical sides.
    const CY = 2000, CX = 578, SX = 560;
    at.FETCH = [CX, CY, 124, 44];
    at.DECODE = [CX, CY + 400, 124, 44];
    ['EX_LDA', 'EX_STA', 'EX_ADD', 'EX_SUB', 'EX_AND', 'EX_LDI', 'EX_JZ', 'EX_JMP']
        .forEach((s, i) => { at[s] = [CX + (i < 4 ? -SX : SX), CY + 60 + (i % 4) * 105, 124, 44]; });
    at.HALT = [CX + 47, CY + 564, 30, 30];
    return at;
}

// ── Page side ────────────────────────────────────────────────────────────────────────────────────────────────────

const PKG = `const pkg = w.LProject.getProject().metamodels[0].packages[0]; const cls = (n) => pkg.classes.find((c) => c.name === n);`;

async function buildMetamodel(page: Page): Promise<string[]> {
    const nm = page.getByText('New metamodel', { exact: true });
    if (await nm.count()) { await nm.first().click(); await page.waitForTimeout(2500); }
    await page.waitForTimeout(1500);
    await ev(page, `const mm = w.LProject.getProject().metamodels[0]; mm.name = a; mm.packages[0].name = a; return 1;`, MM.name);
    const classes = of('DClass');
    for (const c of classes) await ev(page, `${PKG} pkg.addClass(a); return 1;`, c.name, 250);
    for (const c of classes) {
        if (c.abstract) await ev(page, `${PKG} cls(a).abstract = true; return 1;`, c.name, 200);
        if (c.extends.length) await ev(page, `${PKG} cls(a[0]).extends = a[1].map((s) => cls(s).id); return 1;`, [c.name, c.extends.map(cname)], 250);
    }
    // A feature is added in one call and looked up in the next, after the pause: right after the add, the class's
    // forward collection does not list it yet (the split of uml-class-object-fixture.ts).
    const errors: string[] = [];
    for (const f of of('DAttribute')) {
        if (!PRIMITIVES.has(f.type)) { errors.push(`${f.id}: type ${f.type}`); continue; }
        await ev(page, `${PKG} cls(a.owner).addAttribute(a.name, a.type); return 1;`, { owner: cname(f.father), name: f.name, type: f.type }, 400);
        const r = await ev<string>(page, `${PKG} const at = cls(a.owner).attributes.find((x) => x.name === a.name); if (!at) return 'missing';
            at.lowerBound = a.lower; at.upperBound = a.upper; return 'ok';`,
            { owner: cname(f.father), name: f.name, lower: f.lowerBound, upper: f.upperBound }, 200);
        if (r !== 'ok') errors.push(`${f.id}: ${r}`);
    }
    for (const f of of('DReference')) {
        await ev(page, `${PKG} cls(a.owner).addReference(a.name, cls(a.type).id); return 1;`, { owner: cname(f.father), name: f.name, type: cname(f.type) }, 400);
        const r = await ev<string>(page, `${PKG} const x = cls(a.owner).references.find((y) => y.name === a.name); if (!x) return 'missing';
            if (a.comp) x.composition = true; x.lowerBound = a.lower; x.upperBound = a.upper; return 'ok';`,
            { owner: cname(f.father), name: f.name, comp: f.composition, lower: f.lowerBound, upper: f.upperBound }, 250);
        if (r !== 'ok') errors.push(`${f.id}: ${r}`);
    }
    return errors;
}

/** The metamodel as the store holds it, in the spec's terms: one line per class and per feature. */
const READ_METAMODEL = `const idl = w.store.getState().idlookup; const pkg = w.LProject.getProject().metamodels[0].packages[0];
    return { mm: w.LProject.getProject().metamodels[0].name, lines: pkg.classes.flatMap((c) => [
        'class ' + c.name + (c.abstract ? ' abstract' : '') + ' extends [' + c.extends.map((e) => e.name).join(',') + ']',
        ...[...c.attributes, ...c.references].map((f) => c.name + '.' + f.name + ' : ' + (idl[f.id].type ?? '?') + ' '
            + idl[f.id].lowerBound + '..' + idl[f.id].upperBound + (idl[f.id].composition ? ' contains' : '')),
    ]) };`;

function expectedMetamodel(): string[] {
    const classId = (n: string) => `@${n}`;
    return of('DClass').flatMap(c => [
        `class ${c.name}${c.abstract ? ' abstract' : ''} extends [${c.extends.map(cname).join(',')}]`,
        ...Object.values(lookup).filter(d => (d.className === 'DAttribute' || d.className === 'DReference') && d.father === c.id)
            .map(f => `${c.name}.${f.name} : ${f.className === 'DReference' ? classId(cname(f.type)) : f.type} ${f.lowerBound}..${f.upperBound}${f.composition ? ' contains' : ''}`),
    ]);
}

/** Every object of the model with its class and slots, from the D-layer, references as object names. */
const READ_MODEL = `const idl = w.store.getState().idlookup; const m = w.LProject.getProject().models[0];
    const under = (id) => { let d = idl[id]; for (let i = 0; d && i < 40; i++) { if (d.id === m.id) return true; d = idl[d.father]; } return false; };
    const out = {};
    for (const o of Object.values(idl).filter((d) => d && d.className === 'DObject' && under(d.id))) {
        const f = {};
        for (const vid of o.features || []) {
            const d = idl[vid]; const fd = idl[d.instanceof];
            f[fd.name] = (d.values || []).filter((x) => x !== undefined && x !== null && x !== '').map((x) => fd.className === 'DReference' ? (idl[x] ? idl[x].name : '?' + x) : x);
        }
        out[o.name] = { cls: idl[o.instanceof].name, f: Object.fromEntries(Object.entries(f).sort(([a], [b]) => (a < b ? -1 : 1))) };
    }
    return { model: m.name, objects: out };`;

/**
 * The spec's ids mapped to the app's by name: a class of the metamodel, a feature by name under its class, an object
 * as created (`a.objects`). Then the metamodel's bag with the `state` setter, `simEnabled` first, as
 * build-codegen-examples.ts INSTALL writes it; a declaration's metaclass and width feature are ids inside the JSON
 * text of `simStateAttributes`, so they are mapped there too.
 */
const INSTALL = `const fx = a.fx; const L = (x) => w.LPointerTargetable.fromPointer(x);
    const mm = w.LProject.getProject().metamodels[0]; const pkg = mm.packages[0];
    const map = { MM: mm.id, ...a.objects }; const missing = [];
    for (const [fid, d] of Object.entries(fx)) if (d.className === 'DClass') {
        const c = pkg.classes.find((x) => x.name === d.name); if (c) map[fid] = c.id; else missing.push(fid); }
    for (const [fid, d] of Object.entries(fx)) if (d.className === 'DAttribute' || d.className === 'DReference') {
        const owner = pkg.classes.find((x) => x.id === map[d.father]);
        const f = owner && [...owner.attributes, ...owner.references].find((x) => x.name === d.name);
        if (f) map[fid] = f.id; else missing.push(fid); }
    const remap = (v) => (typeof v === 'string' && Object.prototype.hasOwnProperty.call(map, v) ? map[v] : v);
    const decls = (text) => { const j = JSON.parse(text); return JSON.stringify({ ...j, attrs: j.attrs.map((r) => ({ ...r, metaclass: remap(r.metaclass),
        ...(r.domain && r.domain.kind === 'word' ? { domain: { ...r.domain, widthFeature: remap(r.domain.widthFeature) } } : {}) })) }); };
    L(mm.id).state = { simEnabled: true };
    await new Promise((r) => setTimeout(r, 300));
    const bag = {};
    for (const [k, v] of Object.entries(fx.MM._state)) if (k !== 'simEnabled') bag[k] = k === 'simStateAttributes' ? decls(v) : remap(v);
    L(mm.id).state = bag;
    await new Promise((r) => setTimeout(r, 300));
    return { map, missing, expected: { simEnabled: true, ...bag }, stored: w.store.getState().idlookup[mm.id]._state || {} };`;

/** The spec's scenario alone, under its own name, stored on the model as the simulator stores it, then read back. */
const STORE_SCENARIO = `const SC = await import('/src/model/simulation/scenarioCodec.ts');
    const remap = (v) => (typeof v === 'string' && Object.prototype.hasOwnProperty.call(a.map, v) ? a.map[v] : v);
    const full = { ...a.scenario, steps: a.scenario.steps.map((s) => ({ ...s, event: remap(s.event), selector: remap(s.selector) })) };
    w.LPointerTargetable.fromPointer(a.m).state = { [SC.RUN_SCENARIOS_KEY]: SC.encodeScenarios([full]) };
    await new Promise((r) => setTimeout(r, 300));
    const back = SC.decodeScenarios(w.store.getState().idlookup[a.m]._state.runScenarios).scenarios;
    return back.map((s) => ({ name: s.name, expect: s.expect ?? null, same: JSON.stringify(s.steps) === JSON.stringify(full.steps) }));`;

/** One viewpoint, as build-gallery.ts BUILD_VIEWPOINT writes it, on the classes of the metamodel. */
const BUILD_VIEWPOINT = (vp: Viewpoint) => String.raw`(async () => {
  const lv = await import('/src/utils/lastViewpoint.ts');
  const vp = ${JSON.stringify(vp)};
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const classes = window.LProject.getProject().metamodels[0].packages.flatMap((k) => k.classes);
  const vpId = window.DViewPoint.newVP(vp.name, undefined, true).id;
  await sleep(600);
  const made = [];
  for (const [cls, ir] of vp.views) {
    const klass = classes.find((k) => k.name === cls);
    if (!klass) return { error: 'no class ' + cls };
    const id = lv.createViewInWorkbench(klass.id, klass.name, 'DClass', vpId);
    await sleep(400);
    const pins = {};
    for (const m of ir.metaclasses) pins[m] = classes.find((k) => k.name === m).id;
    window.LPointerTargetable.fromPointer(id).ir = { irVersion: 'ir-1.2', exclusive: true, ...ir, authoringMetaclassPins: pins };
    await sleep(400);
    made.push(cls + ':' + (window.windoww.store.getState().idlookup[id]?.ir?.kind ?? 'none'));
  }
  return { id: vpId, name: vp.name, made };
})()`;

const ACTIVATE = (vpId: string) => String.raw`(async () => { const lv = await import('/src/utils/lastViewpoint.ts'); lv.activateViewpoint(${JSON.stringify(vpId)}); })()`;

/** Places the drawn vertices of the model's pane by their object's name; returns the names placed. The size comes from
 * the view's defaultSize: a w/h set on the vertex would size the default viewpoint's vertex only. */
const PLACE = (modelId: string, at: Record<string, [number, number, number, number]>) => String.raw`(async () => {
  const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
  const at = ${JSON.stringify(at)};
  const lk = window.windoww.store.getState().idlookup;
  const pane = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${modelId}"] .react-flow');
  const placed = [];
  for (const n of pane ? pane.querySelectorAll('.react-flow__node') : []) {
    const name = (lk[(lk[n.dataset.id] || {}).model] || {}).name;
    const p = name && at[name];
    if (!p) continue;
    c2j.syncPositionToJjom(n.dataset.id, p[0], p[1]);
    placed.push(name);
  }
  return placed;
})()`;

/** Navbar's File → «Download Project», the entry a user clicks (Navbar.tsx, `name: 'Download Project'`). */
const DOWNLOAD_ENTRY = String.raw`(() => {
  const li = [...document.querySelectorAll('li')].find((l) => { const s = l.querySelector(':scope > label span span'); return s && s.textContent.trim() === 'Download Project'; });
  if (!li) return false;
  li.click();
  return true;
})()`;

async function build(): Promise<void> {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    await seed(ctx, true);
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
    try {
        const pid = await createProject(page, PROJECT);
        check('a new project', !!pid, String(pid));
        if (!pid) return;
        await page.goto(`${URL}/?open=${encodeURIComponent(pid)}#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        await poll(page, `!!(window.windoww && window.windoww.store && window.LProject && window.LProject.getProject())`, 120000);
        await page.waitForTimeout(4000);
        await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});

        const mmErrors = await buildMetamodel(page);
        check('every class and feature of the spec is created', mmErrors.length === 0, mmErrors);
        const mm = await ev<{ mm: string; lines: string[] }>(page, READ_METAMODEL);
        const ids = await ev<Record<string, string>>(page, `const pkg = w.LProject.getProject().metamodels[0].packages[0];
            return Object.fromEntries(pkg.classes.map((c) => [c.id, '@' + c.name]));`);
        const got = mm.lines.map(l => l.replace(/ : (\S+) /, (_s, t: string) =>` : ${ids[t] ?? t} `)).sort();
        check(`the metamodel ${MM.name} is the spec's, class by class and feature by feature`,
            mm.mm === MM.name && JSON.stringify(got) === JSON.stringify(expectedMetamodel().sort()),
            { name: mm.mm, extra: got.filter(l => !expectedMetamodel().includes(l)), missing: expectedMetamodel().filter(l => !got.includes(l)) });

        const shell = await buildModelShell(page);
        check('a model with its v2-flow graph', !!shell.graphId, shell);
        if (!shell.graphId) return;
        await ev(page, `w.LProject.getProject().models[0].name = a; return 1;`, M.name);
        const plan = layout();
        const made = await buildObjects(page, shell.graphId, plan);
        check(`every object of the spec is created with its vertex (${plan.length})`, Object.keys(made).length === plan.length,
            plan.map(o => o[0]).filter(k => !made[k]));

        // The containment slots by the canvas write path, then the other references, then the attribute slots.
        const want = expected();
        const slots = (kind: 'contains' | 'refers' | 'attr') => of('DValue').filter(v => {
            const f = lookup[v.instanceof];
            if (kind === 'attr') return f.className === 'DAttribute' && v.values.length > 0;
            return f.className === 'DReference' && !!f.composition === (kind === 'contains') && v.values.length > 0;
        });
        // The write path appends to the slot it reads: the next append waits until the store lists this child, or it
        // reads the slot without it and the child is lost (measured: `PC.ports` kept `PC_q` alone).
        const linkErrors: string[] = [];
        for (const v of slots('contains')) for (const child of v.values) {
            const r = await ev<string>(page, `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
                if (!c2j.syncCreateCompositionLink(a.pv, a.cv, a.ref)) return 'no edge';
                const has = () => { const idl = w.store.getState().idlookup;
                    const d = (idl[a.po].features || []).map((id) => idl[id]).find((x) => x && idl[x.instanceof].name === a.ref);
                    return !!d && (d.values || []).includes(a.co); };
                for (let i = 0; i < 80 && !has(); i++) await new Promise((res) => setTimeout(res, 50));
                return has() ? 'ok' : 'not in the slot';`,
                { pv: made[v.father].vertex, cv: made[child].vertex, po: made[v.father].obj, co: made[child].obj, ref: lookup[v.instanceof].name }, 250);
            if (r !== 'ok') linkErrors.push(`${v.father}.${lookup[v.instanceof].name} += ${child}: ${r}`);
        }
        check('every containment child is appended to its slot', linkErrors.length === 0, linkErrors);
        for (const v of slots('refers')) for (const target of v.values) {
            const f = lookup[v.instanceof];
            await ev(page, `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
                c2j.syncSetReferenceValue(a[0], a[1], a[2], a[3]); return 1;`, [made[v.father].vertex, f.name, made[target].obj, f.upperBound === 1 ? 'replace' : 'append'], 200);
        }
        const attrErrors: string[] = [];
        for (const v of slots('attr')) {
            const r = await ev<string>(page, `try { w.LPointerTargetable.fromPointer(a.obj)['$' + a.f].values = a.values; return 'ok'; }
                catch (e) { return String(e && e.message || e); }`, { obj: made[v.father].obj, f: lookup[v.instanceof].name, values: v.values }, 120);
            if (r !== 'ok') attrErrors.push(`${v.id}: ${r}`);
        }
        check('every attribute slot is written', attrErrors.length === 0, attrErrors);
        await page.waitForTimeout(2000);

        const model = await ev<{ model: string; objects: Record<string, { cls: string; f: Record<string, unknown[]> }> }>(page, READ_MODEL);
        const diff = Object.keys({ ...want, ...model.objects }).filter(n => JSON.stringify(want[n]) !== JSON.stringify(model.objects[n]));
        check(`the model ${M.name} is the spec's, object by object and slot by slot (${Object.keys(want).length} objects)`,
            model.model === M.name && diff.length === 0,
            diff.slice(0, 4).map(n => ({ n, want: want[n], got: model.objects[n] })));

        // The simulation roles and declarations on the metamodel, then the scenario on the model (slice S-B).
        const objects = Object.fromEntries(Object.entries(made).map(([n, m]) => [n, m.obj]));
        const installed = await ev<{ map: Record<string, string>; missing: string[]; expected: Record<string, unknown>; stored: Record<string, unknown> }>(
            page, INSTALL, { fx: lookup, objects }, 300);
        check('every class, feature and object the bag names has its namesake in the app', installed.missing.length === 0, installed.missing);
        const badKeys = Object.keys(installed.expected).filter(k => JSON.stringify(installed.stored[k]) !== JSON.stringify(installed.expected[k]));
        check(`the metamodel's bag holds the spec's roles and declarations, mapped (${Object.keys(installed.expected).length} keys)`,
            badKeys.length === 0 && Object.keys(installed.expected).length === Object.keys(MM._state).length,
            badKeys.map(k => ({ k, want: installed.expected[k], got: installed.stored[k] })));
        if (spec.scenario) {
            const stored = await ev<Array<{ name: string; expect: string | null; same: boolean }>>(page, STORE_SCENARIO,
                { map: installed.map, scenario: spec.scenario, m: shell.modelId }, 300);
            check(`the spec's scenario is stored on the model under its name (${spec.scenario.steps.length} steps)`,
                stored.length === 1 && stored[0].name === spec.scenario.name && stored[0].same && stored[0].expect === (spec.scenario.expect ?? null), stored);
        }

        const renamed = await ev<string>(page, `w.LPointerTargetable.fromPointer(a[0]).name = a[1]; await new Promise((r) => setTimeout(r, 500));
            return w.store.getState().idlookup[a[0]].name;`, [pid, PROJECT]);
        check(`the project is named ${PROJECT}`, renamed === PROJECT, String(renamed));

        // The three viewpoints (slice S-A2), then the first made active, before the editor opens.
        const built: { id: string; name: string }[] = [];
        for (const vp of VIEWPOINTS) {
            const got = await page.evaluate(BUILD_VIEWPOINT(vp)) as any;
            const ok = !!got && !got.error && got.made.length === vp.views.length && got.made.every((m: string) => !m.endsWith(':none'));
            check(`the viewpoint ${vp.name} has its ${vp.views.length} views`, ok, got);
            if (ok) built.push({ id: got.id, name: got.name });
        }
        if (built.length !== VIEWPOINTS.length) return;

        // The model's editor once, so its layout is in the store the export serializes; under each viewpoint the
        // vertices it draws are placed and sized, then the first is active again.
        await page.evaluate(ACTIVATE(built[0].id));
        await page.waitForTimeout(1500);
        await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(shell.modelId)})); })()`);
        const pane = `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${shell.modelId}"]'))`;
        const nodes = await poll<number>(page, `(() => { const p = ${pane}; return p ? p.querySelectorAll('.react-flow__node').length : 0; })()`, 60000);
        check(`the model's editor shows its nodes`, (nodes ?? 0) > 0, String(nodes));
        // The first layout of a fresh graph arms a 3 s re-layout (reLayoutWatcher.ts): placed after it.
        await page.waitForTimeout(5000);
        const at = places();
        const drawn: string[] = [];
        for (const vp of built) {
            await page.evaluate(ACTIVATE(vp.id));
            await page.waitForTimeout(3000);
            const placed = await page.evaluate(PLACE(shell.modelId, at)) as string[];
            drawn.push(...placed);
            await page.waitForTimeout(1500);
        }
        check(`every vertex a viewpoint draws is placed (${Object.keys(at).length})`, Object.keys(at).every(n => drawn.includes(n)),
            Object.keys(at).filter(n => !drawn.includes(n)));
        await page.evaluate(ACTIVATE(built[0].id));
        await page.waitForTimeout(3000);

        // File → «Download Project»: the app saves the project, then downloads it.
        const download = page.waitForEvent('download', { timeout: 120000 });
        const clicked = await page.evaluate(DOWNLOAD_ENTRY) as boolean;
        check('the Download Project entry of the File menu is clicked', clicked, '');
        if (!clicked) return;
        const file = await download;
        const out = `${DIR}/${NAME}.jjodel`;
        await file.saveAs(out);
        const text = readFileSync(out, 'utf8');
        let parsed: Record<string, any> | null = null;
        try { parsed = JSON.parse(text); } catch { parsed = null; }
        check(`the download, ${file.suggestedFilename()}, is a project file`,
            !!parsed && typeof parsed.state === 'string' && parsed.state.length > 0 && parsed.name === PROJECT && file.suggestedFilename().endsWith('.jjodel'),
            `${out} ${statSync(out).size} bytes`);
        check('no page error', errors.length === 0, errors.slice(0, 3));
    } finally {
        await ctx.close();
        await browser.close();
    }
}

// ── The import check (slice S-A2): the file imported as a user imports it, each viewpoint opened and measured ─────

const PROJECTS = String.raw`JSON.parse(localStorage.getItem('projects') || '[]').map((p) => ({ id: p.id, name: p.name }))`;

/** Every drawn node of the model's pane (flow px, from style.transform) and every edge, by object name. */
const MEASURE = (m1: string) => String.raw`(() => {
  const idl = window.windoww.store.getState().idlookup;
  const pane = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1}"] .react-flow');
  if (!pane) return null;
  const nameOf = (vid) => (idl[(idl[vid] || {}).model] || {}).name || null;
  const nodes = [...pane.querySelectorAll('.react-flow__node')].filter((e) => e.offsetWidth > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none').map((e) => {
    const m = e.style.transform.match(/translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
    return { id: e.dataset.id, name: nameOf(e.dataset.id), x: m ? +m[1] : NaN, y: m ? +m[2] : NaN, w: e.offsetWidth, h: e.offsetHeight, text: e.innerText.replace(/\s+/g, ' ').trim() };
  });
  const edges = [...pane.querySelectorAll('.react-flow__edge')].map((g) => {
    const m = (g.getAttribute('aria-label') || '').match(/^Edge from (\S+) to (\S+)$/);
    // Drawn when one of its paths (markers aside) paints: a clear view leaves every one transparent.
    const ink = [...g.querySelectorAll('path')].filter((p) => !p.closest('marker')).map((p) => p.style.stroke === 'transparent' ? 'transparent' : getComputedStyle(p).stroke)
      .find((c) => c && c !== 'none' && c !== 'transparent' && c !== 'rgba(0, 0, 0, 0)');
    const stroke = ink || 'transparent';
    return { source: m ? nameOf(m[1]) : null, target: m ? nameOf(m[2]) : null, sid: m ? m[1] : null, tid: m ? m[2] : null, stroke };
  });
  const leaves = [...pane.querySelectorAll('.react-flow__edgelabel-renderer *')].filter((e) => e.children.length === 0 && e.textContent.trim());
  const labels = leaves.map((e) => e.textContent.trim());
  const labelBoxes = leaves.map((e) => { const r = e.getBoundingClientRect(); return { id: e.textContent.trim(), name: null, x: r.x, y: r.y, w: r.width, h: r.height, text: '' }; });
  return { nodes, edges, labels, labelBoxes, zoom: (() => { const t = pane.querySelector('.react-flow__viewport'); const z = t && t.style.transform.match(/scale\(([\d.]+)\)/); return z ? +z[1] : null; })() };
})()`;

type Box = { id: string; name: string | null; x: number; y: number; w: number; h: number; text: string };
type Measure = { nodes: Box[]; edges: Array<{ source: string | null; target: string | null; sid: string | null; tid: string | null; stroke: string }>; labels: string[]; labelBoxes: Box[]; zoom: number | null };
const names = (cls: string[]) => of('DObject').filter(o => cls.includes(cname(o.instanceof))).map(o => o.name as string).sort();
const slot1 = (o: Entry, f: string) => { for (const vid of o.features) { const v = lookup[vid]; if (lookup[v.instanceof].name === f) return v.values[0]; } return undefined; };
const overlaps = (a: Box, b: Box) => a.x + 1 < b.x + b.w && b.x + 1 < a.x + a.w && a.y + 1 < b.y + b.h && b.y + 1 < a.y + a.h;
/** A port on its component's border: one side shared, and the two boxes face each other along it. */
const abuts = (p: Box, c: Box) => {
    const near = (u: number, v: number) => Math.abs(u - v) <= 1;
    const alongY = p.y < c.y + c.h && c.y < p.y + p.h, alongX = p.x < c.x + c.w && c.x < p.x + p.w;
    return ((near(p.x + p.w, c.x) || near(c.x + c.w, p.x)) && alongY) || ((near(p.y + p.h, c.y) || near(c.y + c.h, p.y)) && alongX);
};

/** DockManager.open2 on the model, the tab a user opens from the tree. */
const OPEN = (m1: string) => String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(m1)})); })()`;
/** Closes the model's tab: the reopened canvas mounts under the active viewpoint (a live switch keeps the old positions). */
const CLOSE = (m1: string) => String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); dm.default.closeTabsForEntity(${JSON.stringify(m1)}, 'model'); })()`;
/** Forgets the model's stored pan and zoom (EditorV2.tsx, `jjodel.viewport.<model>.<layout key>`), which the closing tab
 * writes under the viewpoint just switched to: the reopened canvas then fits, as on a viewpoint's first opening. */
const FORGET_VIEWPORT = (m1: string) => `Object.keys(localStorage).filter((k) => k.startsWith('jjodel.viewport.${m1}.')).forEach((k) => localStorage.removeItem(k))`;
const PANE_READY = (m1: string) => `(() => { const p = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1}"]'); return !!p && p.querySelectorAll('.react-flow__node').length > 0; })()`;
/** The vertices whose position tells whether the canvas follows the viewpoint, one per viewpoint. */
const WITNESS = ['fmt', 'PC', 'FETCH'];

async function verify(): Promise<void> {
    const SHOTS = process.env.HWB_SHOTS || new globalThis.URL('../../../docs/discovery/assets/hw-sa2', import.meta.url).pathname;
    mkdirSync(SHOTS, { recursive: true });
    const browser = await chromium.launch();
    // Twice the pixels: the pane fits the Datapath at about 0.6, where an 11 px port name would be 6 px on the shot.
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    await seed(ctx, true);
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
    // React Flow drops an edge whose handle is not on the node and says so on the console only (error #008).
    const refused: string[] = [];
    page.on('console', (m) => { if (m.text().startsWith('[React Flow]')) refused.push(m.text().slice(0, 200)); });
    try {
        // File → «Import Project» on the dashboard, the file given to the chooser it opens.
        await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        await poll(page, `!!document.querySelector('.nav-hamburger .menu-title') && !!(window.windoww && window.windoww.store)`, 120000);
        await page.waitForTimeout(1500);
        const before = await page.evaluate(PROJECTS) as Array<{ id: string }>;
        const menu = page.locator('.nav-hamburger', { has: page.locator(':scope > .menu-title', { hasText: /^File$/ }) });
        await menu.hover();
        const chooser = page.waitForEvent('filechooser', { timeout: 15000 });
        await menu.locator('li', { has: page.locator(':scope > label span span', { hasText: /^Import Project$/ }) }).click();
        await (await chooser).setFiles(`${DIR}/${NAME}.jjodel`);
        const added = await poll<{ id: string; name: string }>(page, String.raw`(() => { const ids = new Set(${JSON.stringify(before.map(p => p.id))});
            return ${PROJECTS}.find((p) => !ids.has(p.id)) || null; })()`, 30000);
        check(`import: File → Import Project adds «${PROJECT} copy»`, added?.name === `${PROJECT} copy`, JSON.stringify(added));
        if (!added) return;
        await page.goto(`${URL}/?open=${encodeURIComponent(added.id)}#/project?id=${added.id}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        const m1 = await poll<string>(page, String.raw`(() => { try { const d = Object.values(window.windoww.store.getState().idlookup)
            .find((x) => x && x.className === 'DModel' && !x.isMetamodel && x.name === ${JSON.stringify(M.name)}); return d && document.querySelectorAll('.dock-tab').length ? d.id : null; } catch (e) { return null; } })()`, 120000);
        check(`import: the project opens with the model ${M.name}`, !!m1, String(m1));
        if (!m1) {
            note('import: the page', await page.evaluate(String.raw`(() => { try { const s = window.windoww && window.windoww.store && window.windoww.store.getState();
                return { url: location.href, tabs: document.querySelectorAll('.dock-tab').length, models: s ? Object.values(s.idlookup).filter((d) => d && d.className === 'DModel').map((d) => d.name + (d.isMetamodel ? ' (M2)' : '')) : null }; } catch (e) { return String(e); } })()`));
            await page.screenshot({ path: '/tmp/sa2-import-fail.png' });
            return;
        }
        await page.waitForTimeout(3000);
        await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
        await page.evaluate(OPEN(m1));
        await poll(page, PANE_READY(m1), 60000);
        await page.waitForTimeout(4000);
        const vps = await page.evaluate(String.raw`(() => { const s = window.windoww.store.getState();
            return Object.values(s.idlookup).filter((d) => d && d.className === 'DViewPoint').map((d) => ({ id: d.id, name: d.name })); })()`) as Array<{ id: string; name: string }>;
        const active = await page.evaluate(`window.windoww.store.getState().viewpoint`) as string;
        check(`import: the first viewpoint, ${VIEWPOINTS[0].name}, is active`, vps.find(v => v.id === active)?.name === VIEWPOINTS[0].name, { active, vps: vps.map(v => v.name) });

        for (const vp of VIEWPOINTS) {
            const id = vps.find(v => v.name === vp.name)?.id;
            check(`${vp.name}: the viewpoint is in the imported project`, !!id, vps.map(v => v.name));
            if (!id) continue;
            // The user's path: the toolbar's viewpoint menu. Where it is not reachable, the store action it calls.
            try { await pickViewpoint(page, vp.name); } catch (e) { note(`${vp.name}: toolbar switch failed`, String(e).slice(0, 200)); }
            if (await page.evaluate(`window.windoww.store.getState().viewpoint`) !== id) { await page.evaluate(ACTIVATE(id)); await page.waitForTimeout(3500); }
            const live = await page.evaluate(MEASURE(m1)) as Measure | null;
            note(`${vp.name}: witnesses after the live switch`, (live?.nodes ?? []).filter(n => WITNESS.includes(n.name ?? '')).map(n => `${n.name}@${n.x},${n.y}`));
            await page.evaluate(CLOSE(m1));
            await page.waitForTimeout(1500);
            await page.evaluate(FORGET_VIEWPORT(m1));
            refused.splice(0); // what the stale positions refused belongs to the live switch, not to this viewpoint
            await page.evaluate(OPEN(m1));
            await poll(page, PANE_READY(m1), 60000);
            await page.waitForTimeout(4000);
            const got = await page.evaluate(MEASURE(m1)) as Measure | null;
            if (!got) { check(`${vp.name}: the pane is measured`, false, ''); continue; }
            note(`${vp.name}: witnesses after the remount`, got.nodes.filter(n => WITNESS.includes(n.name ?? '')).map(n => `${n.name}@${n.x},${n.y}`));
            const shown = got.nodes.map(n => n.name ?? '?').sort();
            const pairs = got.nodes.flatMap((a, i) => got.nodes.slice(i + 1).filter(b => overlaps(a, b)).map(b => `${a.name}×${b.name}`));
            const ids = new Set(got.nodes.map(n => n.id));
            const drawnEdges = got.edges.filter(e => e.stroke !== 'transparent' && e.stroke !== 'rgba(0, 0, 0, 0)');
            const dangling = drawnEdges.filter(e => !ids.has(e.sid ?? '') || !ids.has(e.tid ?? ''));
            note(`${vp.name}: measured`, { nodes: got.nodes.length, edges: got.edges.length, drawn: drawnEdges.length, labels: got.labels.length, zoom: got.zoom });
            // The mount assigns handles on interim positions first: a refusal there is transient, the edge checks below
            // judge the settled canvas.
            if (refused.length) note(`${vp.name}: React Flow refusals while mounting`, refused.splice(0).slice(0, 3));
            check(`${vp.name}: no two nodes overlap`, pairs.length === 0, pairs.slice(0, 6));
            check(`${vp.name}: no drawn edge ends in empty space`, dangling.length === 0, dangling.slice(0, 4));
            if (vp.name === 'ISA') {
                const want = names(['Format', 'Field', 'Instruction']);
                check(`ISA: the format, its fields and the ten instructions are drawn, nothing else (${want.length})`, JSON.stringify(shown) === JSON.stringify(want), shown);
                const bad = of('DObject').filter(o => cname(o.instanceof) === 'Instruction')
                    .filter(o => !got.nodes.find(n => n.name === o.name)?.text.includes(`opcode = ${slot1(o, 'opcode')}`)).map(o => o.name);
                const fields = of('DObject').filter(o => cname(o.instanceof) === 'Field')
                    .filter(o => { const t = got.nodes.find(n => n.name === o.name)?.text ?? ''; return !t.includes(`hi = ${slot1(o, 'hi')}`) || !t.includes(`lo = ${slot1(o, 'lo')}`); }).map(o => o.name);
                check('ISA: every instruction shows its opcode, every field its bit range', bad.length === 0 && fields.length === 0, { bad, fields });
                check('ISA: readable at 100% (the fitted zoom is at least 1)', (got.zoom ?? 0) >= 1, String(got.zoom));
            } else if (vp.name === 'Datapath') {
                const want = names(['Register', 'Alu', 'Mux', 'Memory', 'Port']);
                check(`Datapath: every component and every port is drawn, nothing else (${want.length})`, JSON.stringify(shown) === JSON.stringify(want), shown);
                const off = of('DObject').filter(o => cname(o.instanceof) === 'Port').filter(o => {
                    const owner = of('DObject').find(c => c.features.some((vid: string) => lookup[lookup[vid].instanceof].name === 'ports' && lookup[vid].values.includes(o.id)));
                    const p = got.nodes.find(n => n.name === o.name), c = got.nodes.find(n => n.name === owner?.name);
                    return !p || !c || !abuts(p, c);
                }).map(o => o.name);
                check('Datapath: every port sits on its component\'s border', off.length === 0, off);
                const wires = of('DObject').filter(o => cname(o.instanceof) === 'Wire').map(o => `${lookup[slot1(o, 'src')].name}>${lookup[slot1(o, 'tgt')].name}`).sort();
                const edges = drawnEdges.map(e => `${e.source}>${e.target}`).sort();
                const stray = drawnEdges.filter(e => !wires.includes(`${e.source}>${e.target}`)).map(e => `${e.source}>${e.target} ${e.stroke}`);
                check(`Datapath: every wire is one edge from port to port, and no other edge is drawn (${wires.length})`, JSON.stringify(edges) === JSON.stringify(wires), { stray: stray.slice(0, 4), strays: stray.length, edges: edges.length, wires: wires.length });
            } else {
                const want = names(['State', 'InitialState', 'FinalState']);
                check(`Control: the eleven states are drawn, nothing else (${want.length})`, JSON.stringify(shown) === JSON.stringify(want), shown);
                const ts = of('DObject').filter(o => cname(o.instanceof) === 'Transition');
                const owner = (t: Entry) => of('DObject').find(s => s.features.some((vid: string) => lookup[lookup[vid].instanceof].name === 'out' && lookup[vid].values.includes(t.id)))?.name;
                const want2 = ts.map(t => `${owner(t)}>${lookup[slot1(t, 'next')].name}`).sort();
                const edges = drawnEdges.map(e => `${e.source}>${e.target}`).sort();
                check(`Control: every transition is one edge from its state to the next, and no other edge is drawn (${ts.length})`, JSON.stringify(edges) === JSON.stringify(want2), { edges, want: want2 });
                const guards = ts.map(t => slot1(t, 'guard')).filter((g): g is string => typeof g === 'string' && g !== '');
                const missing = guards.filter(g => !got.labels.some(l => l.includes(g)));
                check(`Control: every guard labels its transition (${guards.length})`, missing.length === 0, { missing, labels: got.labels.slice(0, 4) });
                const clash = got.labelBoxes.flatMap((a, i) => got.labelBoxes.slice(i + 1).filter(b => overlaps(a, b)).map(b => `${a.id} × ${b.id}`));
                check('Control: no two guard labels overlap', clash.length === 0, clash.slice(0, 4));
                const f = got.nodes.find(n => n.name === 'FETCH');
                check('Control: FETCH is placed first, above every other state', !!f && got.nodes.every(n => n.y >= f.y - 1 && (n.y > f.y + 1 || n.x >= f.x)), f);
            }
            // The reopened canvas keeps the pan it had, so the band of this viewpoint can lie outside the pane. The page
            // grows until every drawn node is on it, and the shot is clipped to them: the canvas is not panned or zoomed.
            const BOX = String.raw`(() => { const pane = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1}"] .react-flow');
              const rs = [...pane.querySelectorAll('.react-flow__node')].filter((e) => e.offsetWidth > 0 && getComputedStyle(e).visibility !== 'hidden').map((e) => e.getBoundingClientRect());
              return { l: Math.min(...rs.map((r) => r.left)), t: Math.min(...rs.map((r) => r.top)), r: Math.max(...rs.map((r) => r.right)), b: Math.max(...rs.map((r) => r.bottom)) }; })()`;
            const b0 = await page.evaluate(BOX) as { l: number; t: number; r: number; b: number };
            await page.setViewportSize({ width: Math.max(1600, Math.ceil(b0.r) + 480), height: Math.max(1000, Math.ceil(b0.b) + 80) });
            await page.waitForTimeout(1500);
            const b1 = await page.evaluate(BOX) as { l: number; t: number; r: number; b: number };
            const M = 24, x = Math.max(0, b1.l - M), y = Math.max(0, b1.t - M);
            const shot = `${SHOTS}/hw-cpu-${vp.name.toLowerCase()}.png`;
            await page.screenshot({ path: shot, clip: { x, y, width: Math.min(1600, b1.r + M - x), height: Math.min(1600, b1.b + M - y) } });
            await page.setViewportSize({ width: 1600, height: 1000 });
            note(`${vp.name}: screenshot`, shot);
        }
        check('import: no page error', errors.length === 0, errors.slice(0, 3));
    } finally {
        await ctx.close();
        await browser.close();
    }
}

const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);

if (!process.env.HWB_VERIFY_ONLY) await build();
if (failures === 0) await verify();
console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  (${DIR})`);
process.exit(failures === 0 ? 0 : 1);
