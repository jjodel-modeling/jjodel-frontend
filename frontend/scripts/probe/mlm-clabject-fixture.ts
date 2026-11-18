/**
 * mlm-clabject-fixture (P-2026-11-16-0430, multilevel L4, R-OI-31): the clabject metamodel `MLM` of the multilevel
 * discovery, its binding with the potency roles, a three-level model and its three level viewpoints, built in the real
 * app on its own dev server and exported as the File menu's «Download Project» does.
 *
 * Source: docs/discovery/discovery_2026-11-16_onto_multilevel_level_potency.md §3.4, §6 item 4, §7 Q9. Builds:
 *   - the metamodel `MLM` (Atkinson-Kühne, DeepJava style) through the L-API (bpmn-lanes-fixture `buildMetamodel`, then
 *     typed attributes and bounds): Element (abstract) { name }; Clabject ▸ Element { potency, isAbstract, type [0..1],
 *     supers [0..*], slots [0..*] contains, fields [0..*] contains }; Field ▸ Element { potency, type [1], default };
 *     Slot { field [1], value [0..1] contains }; Value (abstract), StringValue, IntValue { value }; DataType ▸ Element.
 *     `slots` is declared before `fields`, so a clabject's slot rows come first in its node (§7 Q9);
 *   - the bag of the metamodel: one `object` record with every slot role, the two value kinds and the potency roles;
 *   - the model `products`, the class level by canvas creates and the instance levels through the R-OI surfaces
 *     (`instantiate`, the S2 synthesis), values by the host's create primitive (`createInstance`), as dcn-drone-fixture:
 *       String, Integer : DataType; ProductType (potency 2) { taxRate^1 : Integer, price^2 : Integer };
 *       Book : ProductType { isbn : String } with taxRate = 7; DVD : ProductType; mobyDick : Book with isbn, price = 10.
 *     Only ProductType's potency and taxRate's and price's feature potency are written; every other potency stays unset
 *     and is derived by the reader (R-OI-26, R-OI-28): levels 0/1/2, potencies 2/1/0;
 *   - the viewpoints «MLM / level 0», «MLM / level 1», «MLM / level 2» (`ontoLevel` '0', '1', '2'; the default viewpoint
 *     stays `both`), one set of views each: the Clabject node (`name`, then the type's name; the slots compartment first,
 *     `field = value`, then the fields, `name^potency : type`), the DataType node, and no node for Field, Slot and the
 *     values.
 * Then a few checks on what it built (F-*), and the export to GV_SAVE (default ~/jjodel-demo-exports/mlm-clabject) as
 * mlm-clabject.jjodel. The acceptance runs on that export: onto-mlm.ts.
 *
 * Run:  node frontend/scripts/lane-run.mjs probe ~/jjodel-w-oi-ml frontend/scripts/probe/mlm-clabject-fixture.ts \
 *         --port 3143 --id P-2026-11-16-0430
 * Env:  GV_SAVE  the export directory (default ~/jjodel-demo-exports/mlm-clabject)
 *       MLM_OUT  scratch output of the helpers (default /tmp/mlm-clabject)
 */
import { chromium, type Page } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { setTheme, SETTLE_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3143/').replace(/\/$/, '');
if (/:300[01]$/.test(URL)) throw new Error('never 3000 or 3001');
// bpmn-lanes-fixture reads GV_OUT and GV_SAVE at load: set before it is loaded.
process.env.GV_OUT = (process.env.MLM_OUT || '/tmp/mlm-clabject').replace(/\/$/, '');
process.env.GV_SAVE = (process.env.GV_SAVE || `${homedir()}/jjodel-demo-exports/mlm-clabject`).replace(/\/$/, '');
mkdirSync(process.env.GV_OUT, { recursive: true });
const { buildMetamodel, buildModelShell, buildObjects, buildViewpoint, createProject, ev, openPage, pickViewpoint, saveScene } = await import('./bpmn-lanes-fixture.ts');

const PROJECT = 'MLM clabjects';
const EXPORT_FILE = 'mlm-clabject.jjodel';
const LEVEL_VIEWPOINTS: Array<[string, string]> = [['MLM / level 0', '0'], ['MLM / level 1', '1'], ['MLM / level 2', '2']];

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    if (ok) pass++; else fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
};
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v).slice(0, 1500)}`);

// ── The metamodel (discovery §3.4) ───────────────────────────────────────────────────────────────────────────────

const MLM_CLASSES: Array<[string, boolean, string[]]> = [
    ['Element', true, []], ['Clabject', false, ['Element']], ['Field', false, ['Element']], ['DataType', false, ['Element']],
    ['Slot', false, []], ['Value', true, []], ['StringValue', false, ['Value']], ['IntValue', false, ['Value']],
];
/** [owner, reference, type, containment, many, lower, upper]; `slots` before `fields` (§7 Q9). */
const MLM_REFS: Array<[string, string, string, boolean, boolean, number, number]> = [
    ['Clabject', 'type', 'Clabject', false, false, 0, 1],
    ['Clabject', 'supers', 'Clabject', false, true, 0, -1],
    ['Clabject', 'slots', 'Slot', true, true, 0, -1],
    ['Clabject', 'fields', 'Field', true, true, 0, -1],
    ['Field', 'type', 'DataType', false, false, 1, 1],
    ['Slot', 'field', 'Field', false, false, 1, 1],
    ['Slot', 'value', 'Value', true, false, 0, 1],
];
/** [owner, attribute, Ecore type, lower, upper]; `Element.name` comes with buildMetamodel. */
const MLM_ATTRS: Array<[string, string, string, number, number]> = [
    ['Clabject', 'potency', 'Pointer_EINT', 0, 1], ['Clabject', 'isAbstract', 'Pointer_EBOOLEAN', 0, 1],
    ['Field', 'potency', 'Pointer_EINT', 0, 1], ['Field', 'default', 'Pointer_ESTRING', 0, 1],
    ['StringValue', 'value', 'Pointer_ESTRING', 1, 1], ['IntValue', 'value', 'Pointer_EINT', 1, 1],
];
const PKG_JS = `const pkg = w.LProject.getProject().metamodels[0].packages[0]; const cls = (n) => pkg.classes.find((c) => c.name === n);
    const f = (c, n) => [...cls(c).attributes, ...cls(c).references].find((x) => x.name === n).id;`;

async function buildMlmMetamodel(page: Page) {
    const classes = await buildMetamodel(page, MLM_CLASSES, MLM_REFS.map(([o, r, t, c, m]): [string, string, string, boolean, boolean] => [o, r, t, c, m]), 'Element');
    await ev(page, `const mm = w.LProject.getProject().metamodels[0]; mm.name = 'MLM'; mm.packages[0].name = 'MLM'; return 1;`);
    for (const [owner, name, type, lower, upper] of MLM_ATTRS) {
        await ev(page, `${PKG_JS} cls(a[0]).addAttribute(a[1], a[2]); return 1;`, [owner, name, type]);
        await ev(page, `${PKG_JS} const at = cls(a[0]).attributes.find((x) => x.name === a[1]); at.lowerBound = a[2]; at.upperBound = a[3]; return 1;`,
            [owner, name, lower, upper], 250);
    }
    for (const [owner, ref, , , , lower, upper] of MLM_REFS) {
        await ev(page, `${PKG_JS} const r = cls(a[0]).references.find((x) => x.name === a[1]); r.lowerBound = a[2]; r.upperBound = a[3]; return 1;`,
            [owner, ref, lower, upper], 250);
    }
    const shape = await ev(page, `const idl = w.store.getState().idlookup; const pkg = w.LProject.getProject().metamodels[0].packages[0];
        return pkg.classes.flatMap((c) => [...c.attributes, ...c.references].map((x) => c.name + '.' + x.name + ' ' + idl[x.id].lowerBound + '..'
            + idl[x.id].upperBound + ' : ' + (x.type?.name ?? '?') + (idl[x.id].composition ? ' contains' : '')));`);
    return { classes, shape };
}

/** The bag: one `object` record (discovery §3.4), written through the metamodel's `state` in the codec's canonical form. */
async function writeBinding(page: Page) {
    return ev<{ mm: string; raw: string | null; defects: unknown[] }>(page, `${PKG_JS}
        const codec = await import('/src/model/ontological/bindingCodec.ts');
        const bc = await import('/src/model/ontological/bindingCheck.ts');
        const sk = await import('/src/components/editor-v2/sim/metamodelSketch.ts');
        const mm = w.LProject.getProject().metamodels[0];
        const object = { name: 'object', typeReference: f('Clabject', 'type'), featureContainer: f('Clabject', 'fields'),
            generalization: { direct: f('Clabject', 'supers') }, slotContainer: f('Clabject', 'slots'), definingFeature: f('Slot', 'field'),
            valueHolder: f('Slot', 'value'), abstractFlag: f('Clabject', 'isAbstract'), featureType: f('Field', 'type'),
            defaultValue: f('Field', 'default'),
            valueKinds: [{ when: 'primitive:String', create: cls('StringValue').id, field: f('StringValue', 'value') },
                { when: 'primitive:Integer', create: cls('IntValue').id, field: f('IntValue', 'value') }],
            potency: f('Clabject', 'potency'), featurePotency: f('Field', 'potency') };
        w.LPointerTargetable.fromPointer(mm.id).state = { ontoBindings: codec.encodeOntoBindings({ v: 1, bindings: [object] }) };
        await new Promise((r) => setTimeout(r, 600));
        const lookup = w.store.getState().idlookup;
        const verdict = bc.checkBindings([object], sk.sketchOfMetamodel(lookup, mm.id));
        return { mm: mm.id, raw: lookup[mm.id]._state?.ontoBindings ?? null, defects: verdict.defects };`, undefined, 0);
}

// ── The viewpoints (discovery §3.4) ──────────────────────────────────────────────────────────────────────────────

const I = (prop: string) => ({ from: 'intrinsic', prop });
const P = (expr: string) => ({ from: 'path', expr });
const L = (text: string) => ({ from: 'literal', text });
const exists = (path: string) => ({ op: 'exists', path });
const kind = (c: string) => ({ op: 'isKind', class: c });
const hidden = (cls: string): [string, Record<string, unknown>] =>
    [cls, { kind: 'vertex', metaclasses: [cls], label: `${cls} (not drawn)`, visible: false, priority: 5, shape: { form: 'rect' } }];
const BOX = { form: 'rect', fill: '#ffffff', border: { width: 1 }, cornerRadius: 0 };
/** Slots first (the ghost rows follow the first children compartment, §7 Q9), then the fields. */
const COMPARTMENTS = [
    { id: 'slots', title: 'Slots', separator: true, rowFormat: { segments: [{ kind: 'name' }] }, source: { from: 'children', filter: kind('Slot') } },
    { id: 'fields', title: 'Fields', separator: true, rowFormat: { segments: [{ kind: 'name' }] }, source: { from: 'children', filter: kind('Field') } },
];
const NAME_LABEL = { position: 'top', source: I('name'), style: { fontWeight: 'bold' } };
const MLM_VIEWS: Array<[string, Record<string, unknown>]> = [
    // `name : type.name` as two top labels, the UML fixture's fallback for the object header. The Clabject views author a
    // width only: the height is derived from the content (useContentDrivenSize), so the header and every row fit
    // (P-2026-11-16-0535; a 60 px height cut the rows past the second).
    ['Clabject', { kind: 'vertex', metaclasses: ['Clabject'], label: 'Clabject (typed)', priority: 1, predicate: exists('$type.value'),
        defaultSize: { width: 220 },
        shape: { ...BOX, labels: [NAME_LABEL, { position: 'top', source: P('$type.value.$name.value'), style: { fontWeight: 'normal', fontStyle: 'italic' } }] },
        fieldCompartments: COMPARTMENTS }],
    ['Clabject', { kind: 'vertex', metaclasses: ['Clabject'], label: 'Clabject (root)', defaultSize: { width: 220 },
        shape: { ...BOX, labels: [NAME_LABEL] }, fieldCompartments: COMPARTMENTS }],
    ['DataType', { kind: 'vertex', metaclasses: ['DataType'], label: 'DataType', defaultSize: { width: 120, height: 40 },
        shape: { ...BOX, labels: [{ position: 'top', source: I('name'), style: { fontWeight: 'normal' } }] } }],
    ['Slot', { kind: 'row', metaclasses: ['Slot'], label: 'Slot', template: [P('$field.value.$name.value'), L(' = '), P('$value.value.$value.value')] }],
    ['Field', { kind: 'row', metaclasses: ['Field'], label: 'Field (potency)', priority: 1, predicate: exists('$potency.value'),
        template: [P('$name.value'), L('^'), P('$potency.value'), L(' : '), P('$type.value.$name.value')] }],
    ['Field', { kind: 'row', metaclasses: ['Field'], label: 'Field', template: [P('$name.value'), L(' : '), P('$type.value.$name.value')] }],
    ...['Field', 'Slot', 'StringValue', 'IntValue'].map(hidden),
];

// ── The model ────────────────────────────────────────────────────────────────────────────────────────────────────

type Ids = Record<string, string>;

/** A contained object by the host's create primitive (S2's default write); its id, or the refusal. */
async function createIn(page: Page, model: string, metaclass: string, owner: string, key: string, seed: Record<string, unknown>) {
    return ev<{ ok: boolean; id: string | null; reason?: string }>(page, `const ca = await import('/src/components/editor-v2/hooks/createAdapter.ts');
        const r = ca.createInstance(a.model, a.metaclass, a.owner, a.key, a.seed); return { ok: r.ok, id: r.id, reason: r.reason };`,
        { model, metaclass, owner, key, seed }, 700);
}

/** A field on `owner` with its type (a reference: the `values` form, §9.3) and, when given, its potency. */
async function addField(page: Page, model: string, owner: string, name: string, type: string, potency: number | null) {
    const r = await createIn(page, model, 'Field', owner, 'fields', { name });
    if (!r.ok || !r.id) return r;
    await ev(page, `const o = w.LPointerTargetable.fromPointer(a[0]); o.$type.values = [a[1]]; if (a[2] !== null) o.$potency.value = a[2]; return 1;`,
        [r.id, type, potency], 400);
    return r;
}

/** One instance of `classifier` through S2 (`instantiate`), named, at (x, y): its id, slot count and problems. */
async function instantiateAt(page: Page, model: string, classifier: string, name: string, x: number, y: number) {
    return ev<{ instance: string | null; ok: boolean; slots: number; problems: string[] }>(page, `const ins = await import('/src/components/editor-v2/hooks/instantiate.ts');
        const get = (id) => w.store.getState().idlookup[id]; const rec = ins.objectRecord(get, a.model);
        const r = await ins.instantiate(a.cls, rec, () => ({ x: a.x, y: a.y }));
        if (r.instance) { const o = w.LPointerTargetable.fromPointer(r.instance); if (o.$name) o.$name.values = [a.name]; }
        return { instance: r.instance, ok: r.ok, slots: r.slots.length, problems: r.problems };`, { model, cls: classifier, name, x, y }, 900);
}

/** The value of the slot of `instance` that `field` defines: one value object by the host's create primitive. */
async function writeSlot(page: Page, model: string, instance: string, field: string, metaclass: string, value: unknown) {
    const slot = await ev<string | null>(page, `const idl = w.store.getState().idlookup;
        const fv = (o, n) => { for (const vid of (idl[o] && idl[o].features) || []) { const v = idl[vid]; if (v && idl[v.instanceof] && idl[v.instanceof].name === n) return v; } return null; };
        return ((fv(a[0], 'slots') || {}).values || []).find((s) => ((fv(s, 'field') || {}).values || []).includes(a[1])) ?? null;`, [instance, field], 0);
    if (!slot) return { ok: false, id: null, reason: `no slot of ${field} on ${instance}` };
    return createIn(page, model, metaclass, slot, 'value', { value });
}

async function buildModel(page: Page, modelId: string, graphId: string) {
    await ev(page, `w.LProject.getProject().models[0].name = 'products'; return 1;`);
    const made = await buildObjects(page, graphId, [
        ['String', 'DataType', 'String', 900, 80, null], ['Integer', 'DataType', 'Integer', 900, 180, null],
        ['ProductType', 'Clabject', 'ProductType', 80, 60, null],
    ]);
    const ids: Ids = Object.fromEntries(Object.entries(made).map(([k, v]) => [k, v.obj]));
    // syncCreateObject sets DObject.name only; the `name` slot keeps its auto value until written (uml fixture).
    await ev(page, `for (const [obj, n] of a) { const o = w.LPointerTargetable.fromPointer(obj); if (o.$name) o.$name.values = [n]; } return 1;`,
        Object.entries(ids).map(([k, v]) => [v, k]), 400);
    await ev(page, `w.LPointerTargetable.fromPointer(a).$potency.value = 2; return 1;`, ids.ProductType, 400);
    const errors: string[] = [];
    const keep = (k: string, r: { ok: boolean; id: string | null; reason?: string }) => { if (r.ok && r.id) ids[k] = r.id; else errors.push(`${k}: ${r.reason}`); };
    keep('taxRate', await addField(page, modelId, ids.ProductType, 'taxRate', ids.Integer, 1));
    keep('price', await addField(page, modelId, ids.ProductType, 'price', ids.Integer, 2));
    const inst: Record<string, unknown> = {};
    for (const [k, cls, x, y] of [['Book', 'ProductType', 80, 330], ['DVD', 'ProductType', 420, 330]] as const) {
        const r = await instantiateAt(page, modelId, ids[cls], k, x, y);
        inst[k] = r;
        if (r.instance) ids[k] = r.instance; else errors.push(`${k}: ${r.problems.join('; ')}`);
    }
    // isbn's potency stays unset: it reads 1 (R-OI-26).
    if (ids.Book) keep('isbn', await addField(page, modelId, ids.Book, 'isbn', ids.String, null));
    if (ids.Book) keep('taxRate=7', await writeSlot(page, modelId, ids.Book, ids.taxRate, 'IntValue', 7));
    if (ids.Book) {
        const r = await instantiateAt(page, modelId, ids.Book, 'mobyDick', 80, 600);
        inst.mobyDick = r;
        if (r.instance) ids.mobyDick = r.instance; else errors.push(`mobyDick: ${r.problems.join('; ')}`);
    }
    if (ids.mobyDick) {
        keep('isbn=', await writeSlot(page, modelId, ids.mobyDick, ids.isbn, 'StringValue', '978-0142437247'));
        keep('price=10', await writeSlot(page, modelId, ids.mobyDick, ids.price, 'IntValue', 10));
    }
    return { ids, inst, errors };
}

/** Levels, potencies, due features and slots as the reader and the store give them. */
async function readLevels(page: Page, modelId: string, ids: Ids) {
    return ev<Record<string, any>>(page, `
        const br = await import('/src/model/ontological/bindingReader.ts'); const inst = await import('/src/components/editor-v2/hooks/instantiate.ts');
        const get = (id) => w.store.getState().idlookup[id]; const view = inst.ontoReadView(get); const rec = inst.objectRecord(get, a.model);
        if (!rec) return { rec: null };
        const nm = (id) => (get(id) || {}).name ?? id;
        const out = { levels: {}, potencies: {}, due: {}, slots: {}, rawPotency: {} };
        for (const k of ['ProductType', 'Book', 'DVD', 'mobyDick']) { const id = a.ids[k]; if (!id) continue;
            out.levels[k] = br.ontoLevel(view, rec, id); out.potencies[k] = br.clabjectPotency(view, rec, id);
            out.due[k] = br.dueFeatures(view, rec, id).features.map(nm);
            out.slots[k] = view.referenceTargets(id, rec.slotContainer).map((s) => nm(view.referenceTargets(s, rec.definingFeature)[0]));
            out.rawPotency[k] = view.attributeValue(id, rec.potency) ?? 'undefined'; }
        out.rawPotency.isbn = a.ids.isbn ? (view.attributeValue(a.ids.isbn, rec.featurePotency) ?? 'undefined') : null;
        return out;`, { model: modelId, ids }, 0);
}

// ── The scene ────────────────────────────────────────────────────────────────────────────────────────────────────

const browser = await chromium.launch();
try {
    const { page, errors } = await openPage(browser);
    await page.context().addInitScript(() => { localStorage.setItem('jjodel_welcome_3_1_1_seen', '1'); });
    const pid = await createProject(page, PROJECT);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(4000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    const mm = await buildMlmMetamodel(page);
    meas('metamodel', mm.shape);
    const bag = await writeBinding(page);
    meas('bag', bag);
    check('F-1 the bag is stored and checkBindings finds no defect', !!bag.raw && bag.defects.length === 0, { defects: bag.defects });
    const shell = await buildModelShell(page);
    if (!shell.graphId) throw new Error(`no v2-flow graph: ${JSON.stringify(shell)}`);
    const model = await buildModel(page, shell.modelId, shell.graphId);
    meas('instantiate', model.inst);
    check('F-2 every object, field, instance and value was made', model.errors.length === 0, model.errors);
    const read = await readLevels(page, shell.modelId, model.ids);
    meas('levels', read);
    const J = (v: unknown) => JSON.stringify(v);
    check('F-3 levels 0/1/1/2 and potencies 2/1/1/0', J(read.levels) === J({ ProductType: 0, Book: 1, DVD: 1, mobyDick: 2 })
        && J(read.potencies) === J({ ProductType: 2, Book: 1, DVD: 1, mobyDick: 0 }), { levels: read.levels, potencies: read.potencies });
    check('F-4 slots: Book and DVD [taxRate], mobyDick [isbn, price], ProductType none', J(read.slots) === J({ ProductType: [], Book: ['taxRate'], DVD: ['taxRate'], mobyDick: ['isbn', 'price'] }), read.slots);
    const vps: Record<string, string> = {};
    for (const [name, level] of LEVEL_VIEWPOINTS) {
        const vp = await buildViewpoint(page, name, MLM_VIEWS);
        await ev(page, `w.LPointerTargetable.fromPointer(a[0]).state = { ontoLevel: a[1] }; return 1;`, [vp.vpId, level], 600);
        vps[name] = vp.vpId;
        const bad = vp.made.filter((m) => !/:(vertex|row)$/.test(m));
        check(`F-5 ${name}: every view holds its IR`, bad.length === 0 && vp.made.length === MLM_VIEWS.length, { made: vp.made.length, bad });
    }
    const levels = await ev<Record<string, string>>(page, `const out = {}; for (const [n, id] of Object.entries(a)) out[n] = w.store.getState().idlookup[id]?._state?.ontoLevel ?? null; return out;`, vps, 0);
    check('F-6 the level viewpoints carry ontoLevel 0, 1, 2', J(Object.values(levels)) === J(['0', '1', '2']), levels);
    await setTheme(page, 'light');
    await pickViewpoint(page, 'MLM / level 1');
    await page.waitForTimeout(SETTLE_MS);
    await saveScene(page, EXPORT_FILE);
    const file = `${process.env.GV_SAVE}/${EXPORT_FILE}`;
    check('F-7 the project is exported', existsSync(file), { file });
    check('F-8 page errors []', errors.length === 0, errors.slice(0, 5));
} catch (e) {
    fail++;
    console.log(`FAIL  scene  ${String((e as Error)?.stack || e).slice(0, 1200)}`);
} finally {
    await browser.close();
    console.log(`DONE pass=${pass} fail=${fail}`);
    process.exitCode = fail ? 1 : 0;
}
