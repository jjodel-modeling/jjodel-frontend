/**
 * uml-class-object-fixture (P-2026-10-20-2005, reissue of P-2026-10-14-1955): UML class and object diagrams as a Jjodel
 * notation, built in the real app on its own dev server and exported as the File menu's «Download Project» does.
 *
 * Design: docs/archivio/claude_2026-10-14_uml_class_object_notation.md (metamodel §2, viewpoints §4, rules §5,
 * example §6). Builds:
 *   - the metamodel `UML` of §2 through the L-API (bpmn-lanes-fixture `buildMetamodel`, then typed attributes, the
 *     enumerations VisibilityKind and AggregationKind, the bounds);
 *   - the library model of §6 in one M1 model, in the root form (every object a canvas create, `syncCreateObject`,
 *     appended to its containment slot by `syncCreateCompositionLink`): class diagram nodes at x < 1300, object
 *     diagram nodes at x >= 1400, every object neither viewpoint draws far right;
 *   - the viewpoints `UML class diagram` and `UML object diagram` of §4, one view per drawn metaclass, the row views
 *     of the compartments, and a `visible: false` view for every concrete metaclass the viewpoint does not draw.
 * With GV_SAVE set the project is exported, before any check that mutates the model, as uml-class-object.jjodel.
 *
 * Then: DOM checks per viewpoint (node transform and DOM text, P8), the rules C1..C9 and O1..O8 of §5 as checks on a
 * snapshot of the store (all pass on the example; five seeded violations, one at a time, each caught by its rule and
 * by no other error rule, each undone and the undo verified on the snapshot), and the round trip: Import Project of
 * the exported file in a fresh page, both viewpoints give the same node and edge counts. Light theme.
 *
 * Where the IR cannot express a rendering of §4 the view takes the closest expressible fallback and the check asserts
 * the fallback (design file §7 lists them):
 *   - the object header `name : Class` is two `top` labels, the name and the classifier name, both underlined;
 *   - attributes and operations share one compartment (only the first `children` compartment renders);
 *   - an association end shows its multiplicity through one edge view per multiplicity pair of the model;
 *   - an operation lists its first parameter, then `, ...` when it has more;
 *   - a slot shows its first value.
 *
 * Run:  GV_SAVE=~/jjodel-demo-exports/uml node frontend/scripts/lane-run.mjs probe ~/jjodel-w-umlfixture \
 *         frontend/scripts/probe/uml-class-object-fixture.ts --port 3085 --id P-2026-10-14-1955
 * Env:  UML_OUT   output directory of screenshots and measures (default docs/discovery/assets/uml-class-object)
 *       GV_SAVE   opt-in: the directory the project is exported to, as uml-class-object.jjodel (bpmn-lanes-fixture
 *                 `saveScene`); the round trip imports that file
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { setTheme, SETTLE_MS } from '../smoke/states.ts';
import type { Box } from './bpmn-lanes-fixture.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3085/').replace(/\/$/, '');
if (/:300[01]$/.test(URL)) throw new Error('never 3000 or 3001');
const OUT = (process.env.UML_OUT || new globalThis.URL('../../../docs/discovery/assets/uml-class-object/', import.meta.url).pathname).replace(/\/$/, '');
mkdirSync(OUT, { recursive: true });
// The BPMN fixture's `shoot` writes into its GV_OUT: set before it is loaded, so the screenshots land here.
process.env.GV_OUT = OUT;
const {
    buildLinks, buildMetamodel, buildModelShell, buildObjects, buildViewpoint, createProject, ev, openPage, pickViewpoint,
    readEdges, readNodes, saveScene, shoot,
} = await import('./bpmn-lanes-fixture.ts');

const PROJECT = 'UML class and object diagrams';
const EXPORT_FILE = 'uml-class-object.jjodel';
const VP_CLASS = 'UML class diagram';
const VP_OBJECT = 'UML object diagram';

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
    if (ok) pass++; else fail++;
};
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v).slice(0, 3000)}`);

// ── The metamodel (design §2) ────────────────────────────────────────────────────────────────────────────────────

/** [class, abstract, supertypes]. `name` comes with NamedElement (buildMetamodel's attribute). */
const UML_CLASSES: Array<[string, boolean, string[]]> = [
    ['NamedElement', true, []], ['PackageableElement', true, ['NamedElement']], ['Package', false, ['PackageableElement']],
    ['Type', true, ['PackageableElement']], ['Classifier', true, ['Type']], ['Class', false, ['Classifier']],
    ['DataType', false, ['Classifier']], ['PrimitiveType', false, ['DataType']], ['Enumeration', false, ['DataType']],
    ['Association', false, ['Classifier']], ['Generalization', false, []],
    ['TypedElement', true, ['NamedElement']], ['MultiplicityElement', true, []],
    ['Property', false, ['TypedElement', 'MultiplicityElement']], ['Operation', false, ['NamedElement']],
    ['Parameter', false, ['TypedElement', 'MultiplicityElement']],
    ['InstanceSpecification', false, ['PackageableElement']], ['EnumerationLiteral', false, ['InstanceSpecification']],
    ['Slot', false, []], ['ValueSpecification', true, ['TypedElement']],
    ['LiteralInteger', false, ['ValueSpecification']], ['LiteralString', false, ['ValueSpecification']],
    ['LiteralBoolean', false, ['ValueSpecification']], ['LiteralNull', false, ['ValueSpecification']],
    ['InstanceValue', false, ['ValueSpecification']],
];
const SUPERS: Record<string, string[]> = Object.fromEntries(UML_CLASSES.map(([c, , s]) => [c, s]));
const isKind = (cls: string | undefined, k: string): boolean => !!cls && (cls === k || (SUPERS[cls] ?? []).some((s) => isKind(s, k)));

/** [owner, reference, type, containment, many, lower, upper]. */
const UML_REFS: Array<[string, string, string, boolean, boolean, number, number]> = [
    ['Package', 'packagedElements', 'PackageableElement', true, true, 0, -1],
    ['Classifier', 'generalizations', 'Generalization', true, true, 0, -1],
    ['Class', 'ownedAttributes', 'Property', true, true, 0, -1],
    ['Class', 'ownedOperations', 'Operation', true, true, 0, -1],
    ['Enumeration', 'ownedLiterals', 'EnumerationLiteral', true, true, 0, -1],
    ['Association', 'memberEnds', 'Property', false, true, 2, 2],
    ['Association', 'ownedEnds', 'Property', true, true, 0, -1],
    ['Generalization', 'specific', 'Classifier', false, false, 1, 1],
    ['Generalization', 'general', 'Classifier', false, false, 1, 1],
    ['TypedElement', 'type', 'Type', false, false, 0, 1],
    ['Property', 'association', 'Association', false, false, 0, 1],
    ['Operation', 'ownedParameters', 'Parameter', true, true, 0, -1],
    ['Operation', 'type', 'Type', false, false, 0, 1],
    ['InstanceSpecification', 'classifier', 'Classifier', false, false, 1, 1],
    ['InstanceSpecification', 'slots', 'Slot', true, true, 0, -1],
    ['Slot', 'definingFeature', 'Property', false, false, 1, 1],
    ['Slot', 'values', 'ValueSpecification', true, true, 0, -1],
    ['InstanceValue', 'instance', 'InstanceSpecification', false, false, 1, 1],
];
const CONTAINMENT = new Set(UML_REFS.filter((r) => r[3]).map((r) => r[1]));
const ENUMS: Array<[string, string[]]> = [
    ['VisibilityKind', ['public', 'private', 'protected', 'package']],
    ['AggregationKind', ['none', 'shared', 'composite']],
];
/** [owner, attribute, type (Ecore primitive or enumeration), lower, upper, default]. `defaultValue` is 0..1 as in UML
 *  2.5.1 (the design's "1..1 unless written" would make every Property without a default non-conforming). */
const UML_ATTRS: Array<[string, string, string, number, number, number | null]> = [
    ['NamedElement', 'name', 'EString', 1, 1, null],
    ['Classifier', 'isAbstract', 'EBoolean', 1, 1, null],
    ['MultiplicityElement', 'lower', 'EInt', 1, 1, 1], ['MultiplicityElement', 'upper', 'EInt', 1, 1, 1],
    ['Property', 'visibility', 'VisibilityKind', 1, 1, null], ['Property', 'aggregation', 'AggregationKind', 1, 1, null],
    ['Property', 'isDerived', 'EBoolean', 1, 1, null], ['Property', 'defaultValue', 'EString', 0, 1, null],
    ['Operation', 'visibility', 'VisibilityKind', 1, 1, null],
    ['LiteralInteger', 'value', 'EInt', 1, 1, null], ['LiteralString', 'value', 'EString', 1, 1, null],
    ['LiteralBoolean', 'value', 'EBoolean', 1, 1, null],
];
const ECORE: Record<string, string> = { EString: 'Pointer_ESTRING', EInt: 'Pointer_EINT', EBoolean: 'Pointer_EBOOLEAN' };

async function buildUmlMetamodel(page: Page) {
    const classes = await buildMetamodel(page, UML_CLASSES, UML_REFS.map(([o, r, t, c, m]): [string, string, string, boolean, boolean] => [o, r, t, c, m]), 'NamedElement');
    const pkgJs = `const pkg = w.LProject.getProject().metamodels[0].packages[0]; const cls = (n) => pkg.classes.find((c) => c.name === n);
        const en = (n) => pkg.enumerators.find((e) => e.name === n);`;
    await ev(page, `const mm = w.LProject.getProject().metamodels[0]; mm.name = 'UML'; mm.packages[0].name = 'UML'; return 1;`);
    for (const [name, lits] of ENUMS) {
        await ev(page, `${pkgJs} const e = pkg.addEnumerator(a[0]); for (const l of a[1]) e.addLiteral(l); return 1;`, [name, lits], 600);
    }
    const attrs: Record<string, unknown> = {};
    for (const [owner, name, type, lower, upper, dflt] of UML_ATTRS) {
        if (name !== 'name') await ev(page, `${pkgJs} const t = a.ecore || en(a.type).id; cls(a.owner).addAttribute(a.name, t); return 1;`,
            { owner, name, type, ecore: ECORE[type] ?? null });
        attrs[`${owner}.${name}`] = await ev(page, `${pkgJs} const at = cls(a.owner).attributes.find((x) => x.name === a.name);
            at.lowerBound = a.lower; at.upperBound = a.upper;
            let d = 'none'; if (a.dflt !== null) { try { at.defaultValue = a.dflt; d = 'ok'; } catch (e) { d = String(e && e.message || e); } }
            return { type: at.type?.name, d };`, { owner, name, lower, upper, dflt });
    }
    for (const [owner, ref, , , , lower, upper] of UML_REFS) {
        await ev(page, `${pkgJs} const r = cls(a[0]).references.find((x) => x.name === a[1]); r.lowerBound = a[2]; r.upperBound = a[3]; return 1;`,
            [owner, ref, lower, upper], 250);
    }
    const bounds = await ev(page, `const idl = w.store.getState().idlookup; const pkg = w.LProject.getProject().metamodels[0].packages[0];
        return pkg.classes.flatMap((c) => [...c.attributes, ...c.references].map((f) => c.name + '.' + f.name + ' ' + idl[f.id].lowerBound + '..' + idl[f.id].upperBound
            + ' : ' + (f.type?.name ?? '?') + (idl[f.id].composition ? ' contains' : '')));`);
    return { classes, attrs, bounds };
}

// ── The model (design §6) ────────────────────────────────────────────────────────────────────────────────────────

type Vis = 'public' | 'private' | 'protected' | 'package';
interface ClassSpec { key: string; abstract?: boolean; general?: string; x: number; y: number;
    attrs: Array<[string, Vis, string, string?]>; ops?: Array<[string, Vis, string | null, Array<[string, string]>]> }
const PRIMITIVES: Array<[string, number, number]> = [['String', 1080, 80], ['Integer', 1080, 200], ['Boolean', 1080, 320]];
const GENRE = { key: 'Genre', x: 420, y: 700, literals: ['fiction', 'science', 'history'] };
const CLASSES: ClassSpec[] = [
    { key: 'Publication', abstract: true, x: 480, y: 80, attrs: [['title', 'public', 'String'], ['year', 'protected', 'Integer']],
        ops: [['age', 'public', 'Integer', []]] },
    { key: 'Book', general: 'Publication', x: 420, y: 420, attrs: [['isbn', 'private', 'String'], ['genre', 'private', 'Genre']] },
    { key: 'Magazine', general: 'Publication', x: 760, y: 420, attrs: [['issue', 'private', 'Integer']] },
    { key: 'Library', x: 60, y: 80, attrs: [['name', 'private', 'String']] },
    { key: 'Member', x: 60, y: 420, attrs: [['name', 'private', 'String'], ['active', 'private', 'Boolean', 'true']],
        ops: [['borrow', 'public', 'Boolean', [['b', 'Book']]]] },
];
/** [association, [end name, type, lower, upper, aggregation] x 2]: memberEnds[0] is the source end of the line. */
const ASSOCS: Array<[string, Array<[string, string, number, number, string]>]> = [
    ['Holdings', [['library', 'Library', 1, 1, 'none'], ['holdings', 'Publication', 0, -1, 'composite']]],
    ['Membership', [['libraries', 'Library', 1, -1, 'none'], ['members', 'Member', 0, -1, 'shared']]],
    ['Borrowing', [['borrower', 'Member', 0, 1, 'none'], ['loans', 'Book', 0, 3, 'none']]],
];
type SlotKind = 'str' | 'int' | 'bool' | 'enum';
const OBJECTS: Array<[string, string, number, number, Array<[string, SlotKind, string | number | boolean]>]> = [
    ['cityLib', 'Library', 1800, 80, [['name', 'str', 'City Library']]],
    ['dune', 'Book', 1460, 420, [['title', 'str', 'Dune'], ['year', 'int', 1965], ['isbn', 'str', '978-0441013593'], ['genre', 'enum', 'fiction']]],
    ['history', 'Book', 1800, 420, [['title', 'str', 'A Brief History of Time'], ['year', 'int', 1988], ['isbn', 'str', '978-0553380163'], ['genre', 'enum', 'science']]],
    ['nature', 'Magazine', 2140, 420, [['title', 'str', 'Nature'], ['year', 'int', 2026], ['issue', 'int', 8012]]],
    ['alice', 'Member', 1460, 80, [['name', 'str', 'Alice'], ['active', 'bool', true]]],
];
/** [link, association, object at memberEnds[0], object at memberEnds[1]]. */
const LINKS: Array<[string, string, string, string]> = [
    ['holdings1', 'Holdings', 'cityLib', 'dune'], ['holdings2', 'Holdings', 'cityLib', 'history'], ['holdings3', 'Holdings', 'cityLib', 'nature'],
    ['membership1', 'Membership', 'cityLib', 'alice'], ['borrowing1', 'Borrowing', 'alice', 'dune'],
];
const LITERAL_CLASS: Record<SlotKind, string> = { str: 'LiteralString', int: 'LiteralInteger', bool: 'LiteralBoolean', enum: 'InstanceValue' };

/** An enumeration literal of the metamodel, resolved in the page to its id. */
interface EnumValue { enum: string; lit: string }
type AttrValue = string | number | boolean | EnumValue;
const V = (lit: Vis): EnumValue => ({ enum: 'VisibilityKind', lit });
const AGG = (lit: string): EnumValue => ({ enum: 'AggregationKind', lit });

interface ModelPlan {
    objects: Array<[string, string, string, number, number, null]>;
    containment: Array<[string, string, string]>;
    references: Array<[string, string, string]>;
    singleRefs: Set<string>;
    attrs: Array<[string, Array<[string, AttrValue]>]>;
}

/** The class key and its ancestors, nearest first. */
function chainOf(cls: string): string[] {
    const out: string[] = [];
    for (let c: ClassSpec | undefined = CLASSES.find((x) => x.key === cls); c; c = CLASSES.find((x) => x.key === c!.general)) out.push(c.key);
    return out;
}
const propKey = (cls: string, attr: string) => `p_${cls}_${attr}`;
const definingProp = (cls: string, attr: string) => propKey(chainOf(cls).find((c) => CLASSES.find((x) => x.key === c)!.attrs.some((a) => a[0] === attr))!, attr);

function modelPlan(): ModelPlan {
    const objects: ModelPlan['objects'] = [];
    const containment: ModelPlan['containment'] = [];
    const references: ModelPlan['references'] = [];
    const attrs: ModelPlan['attrs'] = [];
    let hidden = 0;
    // Every object no viewpoint draws: far right, on a grid, out of both regions.
    const far = (): [number, number] => { const i = hidden++; return [3000 + (i % 10) * 220, 80 + Math.floor(i / 10) * 120]; };
    const add = (key: string, cls: string, name: string, at?: [number, number], size: [number, number] | null = null) => {
        const [x, y] = at ?? far(); objects.push([key, cls, name, x, y, size]); };
    // The default box height clips the header once a box holds two rows or more (first screenshot of P-2026-10-20-2330):
    // every drawn box is sized from its top labels and its rows.
    const box = (w: number, labels: number, rows: number): [number, number] => [w, 26 + 20 * labels + 18 * rows];
    const prop = (key: string, name: string, type: string, vis: Vis, lower: number, upper: number, agg: string, dflt?: string) => {
        add(key, 'Property', name);
        references.push([key, 'type', type]);
        attrs.push([key, [['visibility', V(vis)], ['aggregation', AGG(agg)], ['isDerived', false], ['lower', lower], ['upper', upper],
            ...(dflt !== undefined ? [['defaultValue', dflt] as [string, AttrValue]] : [])]]);
    };
    add('pkg', 'Package', 'LibraryModel');
    const packaged: string[] = [];
    for (const [p, x, y] of PRIMITIVES) { add(p, 'PrimitiveType', p, [x, y]); attrs.push([p, [['isAbstract', false]]]); packaged.push(p); }
    add(GENRE.key, 'Enumeration', GENRE.key, [GENRE.x, GENRE.y], box(200, 2, GENRE.literals.length)); attrs.push([GENRE.key, [['isAbstract', false]]]); packaged.push(GENRE.key);
    for (const l of GENRE.literals) {
        add(`lit_${l}`, 'EnumerationLiteral', l);
        containment.push([GENRE.key, 'ownedLiterals', `lit_${l}`]);
        references.push([`lit_${l}`, 'classifier', GENRE.key]);
    }
    for (const c of CLASSES) {
        add(c.key, 'Class', c.key, [c.x, c.y], box(c.ops?.length ? 260 : 220, 1, c.attrs.length + (c.ops?.length ?? 0))); attrs.push([c.key, [['isAbstract', !!c.abstract]]]); packaged.push(c.key);
        for (const [a, vis, type, dflt] of c.attrs) {
            prop(propKey(c.key, a), a, type, vis, 1, 1, 'none', dflt);
            containment.push([c.key, 'ownedAttributes', propKey(c.key, a)]);
        }
        for (const [o, vis, ret, params] of c.ops ?? []) {
            const ok = `op_${c.key}_${o}`;
            add(ok, 'Operation', o);
            containment.push([c.key, 'ownedOperations', ok]);
            attrs.push([ok, [['visibility', V(vis)]]]);
            if (ret) references.push([ok, 'type', ret]);
            for (const [pn, pt] of params) {
                const pk = `par_${c.key}_${o}_${pn}`;
                add(pk, 'Parameter', pn);
                containment.push([ok, 'ownedParameters', pk]);
                references.push([pk, 'type', pt]);
                attrs.push([pk, [['lower', 1], ['upper', 1]]]);
            }
        }
    }
    for (const c of CLASSES.filter((x) => x.general)) {
        const gk = `gen_${c.key}`;
        add(gk, 'Generalization', `${c.key}_${c.general}`);
        containment.push([c.key, 'generalizations', gk]);
        references.push([gk, 'specific', c.key], [gk, 'general', c.general!]);
    }
    for (const [a, ends] of ASSOCS) {
        add(a, 'Association', a); attrs.push([a, [['isAbstract', false]]]); packaged.push(a);
        for (const [en, type, lower, upper, agg] of ends) {
            const ek = `end_${a}_${en}`;
            prop(ek, en, type, 'public', lower, upper, agg);
            containment.push([a, 'ownedEnds', ek]);
            references.push([ek, 'association', a], [a, 'memberEnds', ek]);
        }
    }
    for (const [o, cls, x, y, slots] of OBJECTS) {
        add(o, 'InstanceSpecification', o, [x, y], box(300, 2, slots.length)); packaged.push(o);
        references.push([o, 'classifier', cls]);
        for (const [attr, kind, value] of slots) {
            const sk = `slot_${o}_${attr}`; const vk = `val_${o}_${attr}`;
            add(sk, 'Slot', sk); add(vk, LITERAL_CLASS[kind], vk);
            containment.push([o, 'slots', sk], [sk, 'values', vk]);
            references.push([sk, 'definingFeature', definingProp(cls, attr)]);
            if (kind === 'enum') references.push([vk, 'instance', `lit_${value}`]);
            else attrs.push([vk, [['value', value]]]);
        }
    }
    for (const [l, a, src, tgt] of LINKS) {
        add(l, 'InstanceSpecification', l); packaged.push(l);
        references.push([l, 'classifier', a]);
        const ends = ASSOCS.find((x) => x[0] === a)![1];
        [src, tgt].forEach((obj, i) => {
            const sk = `slot_${l}_${i}`; const vk = `val_${l}_${i}`;
            add(sk, 'Slot', sk); add(vk, 'InstanceValue', vk);
            containment.push([l, 'slots', sk], [sk, 'values', vk]);
            references.push([sk, 'definingFeature', `end_${a}_${ends[i][0]}`], [vk, 'instance', obj]);
        });
    }
    for (const p of packaged) containment.push(['pkg', 'packagedElements', p]);
    const singleRefs = new Set(UML_REFS.filter((r) => !r[4]).map((r) => r[1]));
    return { objects, containment, references, singleRefs, attrs };
}

type Ids = Record<string, { obj: string; vertex: string }>;

/** The non-containment references: `replace` on a single-valued one, `append` on a many (syncSetReferenceValue). */
async function setReferences(page: Page, ids: Ids, refs: Array<[string, string, string]>, single: Set<string>) {
    for (const [owner, ref, target] of refs) {
        await ev(page, `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
            c2j.syncSetReferenceValue(a[0], a[1], a[2], a[3]); return 1;`, [ids[owner].vertex, ref, ids[target].obj, single.has(ref) ? 'replace' : 'append'], 250);
    }
}

/** Attribute values through the L-API, one object per call; an enumeration value is its literal's id. */
async function setAttrs(page: Page, ids: Ids, attrs: ModelPlan['attrs']) {
    const errs: string[] = [];
    for (const [key, vals] of attrs) {
        const r = await ev<string[]>(page, `const pkg = w.LProject.getProject().metamodels[0].packages[0]; const errs = [];
            const o = w.LPointerTargetable.fromPointer(a.obj);
            for (const [f, v] of a.vals) {
                try {
                    const val = v && typeof v === 'object' ? pkg.enumerators.find((e) => e.name === v.enum).literals.find((l) => l.name === v.lit).id : v;
                    o['$' + f].values = [val];
                } catch (e) { errs.push(a.key + '.' + f + ': ' + (e && e.message || e)); }
            }
            return errs;`, { obj: ids[key].obj, key, vals }, 150);
        errs.push(...r);
    }
    return errs;
}

// ── The viewpoints (design §4) ───────────────────────────────────────────────────────────────────────────────────

const I = (prop: string) => ({ from: 'intrinsic', prop });
const P = (expr: string) => ({ from: 'path', expr });
const L = (text: string) => ({ from: 'literal', text });
type Lit = string | number | boolean;
const lit = (v: Lit) => typeof v === 'string' ? { kind: 'string', value: v } : typeof v === 'number' ? { kind: 'number', value: v } : { kind: 'boolean', value: v };
const eq = (path: string, v: Lit) => ({ op: 'eq', left: path, right: lit(v) });
const and = (...args: unknown[]) => ({ op: 'and', args });
const or = (...args: unknown[]) => ({ op: 'or', args });
const not = (arg: unknown) => ({ op: 'not', arg });
const exists = (path: string) => ({ op: 'exists', path });
const kind = (c: string, path?: string) => path ? { op: 'isKind', class: c, path } : { op: 'isKind', class: c };
const hidden = (cls: string): [string, Record<string, unknown>] =>
    [cls, { kind: 'vertex', metaclasses: [cls], label: `${cls} (not drawn)`, visible: false, priority: 5, shape: { form: 'rect' } }];
const BOX = { form: 'rect', fill: '#ffffff', border: { width: 1 }, cornerRadius: 0 };
const VIS: Array<[Vis, string]> = [['public', '+'], ['private', '-'], ['protected', '#'], ['package', '~']];
const multText = (l: number, u: number) => l === u ? `${l}` : `${l}..${u === -1 ? '*' : u}`;

/** `<vis> name : Type [l..u]`, the multiplicity omitted for 1..1, `*` for -1: one row view per visibility and form. */
function propertyRows(): Array<[string, Record<string, unknown>]> {
    const head = (sym: string) => [L(`${sym} `), P('$name.value'), L(' : '), P('$type.value.$name.value')];
    const rows: Array<[string, Record<string, unknown>]> = [];
    for (const [vis, sym] of VIS) {
        const v = eq('$visibility.value', vis);
        rows.push(['Property', { kind: 'row', metaclasses: ['Property'], label: `Property (${vis}, 1..1)`, priority: 2,
            predicate: and(v, eq('$lower.value', 1), eq('$upper.value', 1)), template: head(sym) }]);
        rows.push(['Property', { kind: 'row', metaclasses: ['Property'], label: `Property (${vis}, l..*)`, priority: 2,
            predicate: and(v, eq('$upper.value', -1)), template: [...head(sym), L(' ['), P('$lower.value'), L('..*]')] }]);
        rows.push(['Property', { kind: 'row', metaclasses: ['Property'], label: `Property (${vis}, l..u)`, priority: 1,
            predicate: v, template: [...head(sym), L(' ['), P('$lower.value'), L('..'), P('$upper.value'), L(']')] }]);
    }
    rows.push(['Property', { kind: 'row', metaclasses: ['Property'], label: 'Property (no visibility)',
        template: [P('$name.value'), L(' : '), P('$type.value.$name.value'), L(' ['), P('$lower.value'), L('..'), P('$upper.value'), L(']')] }]);
    return rows;
}

/** `<vis> name(p : T, ...) : R`: the first parameter and `, ...` past it (no list join in a template), the return
 *  type when there is one. */
function operationRows(): Array<[string, Record<string, unknown>]> {
    const p0 = '$ownedParameters.values[0]';
    const params: Array<[string, unknown, unknown[]]> = [
        ['no parameter', not(exists(p0)), [L('()')]],
        ['1 parameter', and(exists(p0), not(exists('$ownedParameters.values[1]'))), [L('('), P(`${p0}.$name.value`), L(' : '), P(`${p0}.$type.value.$name.value`), L(')')]],
        ['2+ parameters', exists('$ownedParameters.values[1]'), [L('('), P(`${p0}.$name.value`), L(' : '), P(`${p0}.$type.value.$name.value`), L(', ...)')]],
    ];
    const rets: Array<[string, unknown, unknown[]]> = [
        ['returns', exists('$type.value'), [L(' : '), P('$type.value.$name.value')]],
        ['no return', not(exists('$type.value')), []],
    ];
    const rows: Array<[string, Record<string, unknown>]> = [];
    for (const [vis, sym] of VIS) for (const [pl, pp, pt] of params) for (const [rl, rp, rt] of rets) {
        rows.push(['Operation', { kind: 'row', metaclasses: ['Operation'], label: `Operation (${vis}, ${pl}, ${rl})`, priority: 2,
            predicate: and(eq('$visibility.value', vis), pp, rp), template: [L(`${sym} `), P('$name.value'), ...pt, ...rt] }]);
    }
    rows.push(['Operation', { kind: 'row', metaclasses: ['Operation'], label: 'Operation (fallback)', template: [P('$name.value'), L('(...)')] }]);
    return rows;
}

/** A diamond at the whole end: the opposite end is the part side. */
const aggEnd = (oppositeAggregation: string) => ({
    rules: [{ when: eq(oppositeAggregation, 'composite'), then: 'filledDiamond' }, { when: eq(oppositeAggregation, 'shared'), then: 'hollowDiamond' }],
    default: 'none',
});
/** One edge view per multiplicity pair of the model (an end label is one TextSource: no `l..u` template, no -1 -> `*`
 *  map), and a fallback with the role names only. */
function associationEdges(): Array<[string, Record<string, unknown>]> {
    const m = (i: number) => `$memberEnds.values[${i}]`;
    const edge = (mult: [string, string] | null) => ({
        source: `${m(0)}.$type.value`, target: `${m(1)}.$type.value`, line: { style: 'solid', width: 1 },
        terminations: { sourceEnd: aggEnd(`${m(1)}.$aggregation.value`), targetEnd: aggEnd(`${m(0)}.$aggregation.value`) },
        labels: {
            center: I('name'),
            sourceEnd: { role: P(`${m(0)}.$name.value`), ...(mult ? { multiplicity: L(mult[0]) } : {}) },
            targetEnd: { role: P(`${m(1)}.$name.value`), ...(mult ? { multiplicity: L(mult[1]) } : {}) },
        },
    });
    const pairs = new Map<string, number[]>();
    for (const [, [[, , l0, u0], [, , l1, u1]]] of ASSOCS) pairs.set([l0, u0, l1, u1].join(','), [l0, u0, l1, u1]);
    const views: Array<[string, Record<string, unknown>]> = [...pairs.values()].map(([l0, u0, l1, u1]) => ['Association', {
        kind: 'edge', metaclasses: ['Association'], label: `Association ${multText(l0, u0)} / ${multText(l1, u1)}`, priority: 1,
        predicate: and(eq(`${m(0)}.$lower.value`, l0), eq(`${m(0)}.$upper.value`, u0), eq(`${m(1)}.$lower.value`, l1), eq(`${m(1)}.$upper.value`, u1)),
        edge: edge([multText(l0, u0), multText(l1, u1)]) }]);
    views.push(['Association', { kind: 'edge', metaclasses: ['Association'], label: 'Association (no multiplicity view)', edge: edge(null) }]);
    return views;
}

const keywordBox = (cls: string, keyword: string, size: { width: number; height: number }): [string, Record<string, unknown>] => [cls, {
    kind: 'vertex', metaclasses: [cls], label: cls, defaultSize: size,
    shape: { ...BOX, labels: [{ position: 'top', source: L(`«${keyword}»`), style: { fontWeight: 'normal' } },
        { position: 'top', source: I('name'), style: { fontWeight: 'bold' } }] },
}];

export const CLASS_VIEWS: Array<[string, Record<string, unknown>]> = [
    ['Class', { kind: 'vertex', metaclasses: ['Class'], label: 'Class', defaultSize: { width: 240, height: 60 },
        shape: { ...BOX, labels: [{ position: 'top', source: I('name'),
            style: { fontWeight: 'bold', fontStyle: { when: eq('$isAbstract.value', true), then: 'italic', else: 'normal' } } }] },
        fieldCompartments: [{ id: 'features', title: 'Attributes and operations', separator: true, rowFormat: { segments: [{ kind: 'name' }] },
            source: { from: 'children', filter: or(and(kind('Property'), not(exists('$association.value'))), kind('Operation')) } }] }],
    [keywordBox('Enumeration', 'enumeration', { width: 160, height: 60 })[0], { ...keywordBox('Enumeration', 'enumeration', { width: 160, height: 60 })[1],
        fieldCompartments: [{ id: 'literals', title: 'Literals', separator: true, rowFormat: { segments: [{ kind: 'name' }] },
            source: { from: 'children', filter: kind('EnumerationLiteral') } }] }],
    keywordBox('PrimitiveType', 'primitive', { width: 140, height: 56 }),
    keywordBox('DataType', 'dataType', { width: 140, height: 56 }),
    ['Generalization', { kind: 'edge', metaclasses: ['Generalization'], label: 'Generalization',
        edge: { source: '$specific.value', target: '$general.value', line: { style: 'solid', width: 1 }, terminations: { sourceEnd: 'none', targetEnd: 'hollowTriangle' } } }],
    ...associationEdges(),
    ...propertyRows(),
    ...operationRows(),
    ['EnumerationLiteral', { kind: 'row', metaclasses: ['EnumerationLiteral'], label: 'Enumeration literal', template: [I('name')] }],
    ...['Package', 'Property', 'Operation', 'Parameter', 'EnumerationLiteral', 'InstanceSpecification', 'Slot',
        'LiteralInteger', 'LiteralString', 'LiteralBoolean', 'LiteralNull', 'InstanceValue'].map(hidden),
];

const IS_LINK = exists('$classifier.value.$memberEnds.values[0]');
const slotHead = [P('$definingFeature.value.$name.value'), L(' = ')];
export const OBJECT_VIEWS: Array<[string, Record<string, unknown>]> = [
    ['InstanceSpecification', { kind: 'vertex', metaclasses: ['InstanceSpecification'], label: 'Object', predicate: not(IS_LINK),
        defaultSize: { width: 280, height: 60 },
        shape: { ...BOX, labels: [
            { position: 'top', source: I('name'), style: { fontWeight: 'normal', underline: true } },
            { position: 'top', source: P('$classifier.value.$name.value'), style: { fontWeight: 'normal', underline: true } }] },
        fieldCompartments: [{ id: 'slots', title: 'Slots', separator: true, rowFormat: { segments: [{ kind: 'name' }] },
            source: { from: 'children', filter: kind('Slot') } }] }],
    ['InstanceSpecification', { kind: 'edge', metaclasses: ['InstanceSpecification'], label: 'Link', priority: 1, predicate: IS_LINK,
        edge: { source: '$slots.values[0].$values.values[0].$instance.value', target: '$slots.values[1].$values.values[0].$instance.value',
            line: { style: 'solid', width: 1 }, terminations: { sourceEnd: 'none', targetEnd: 'none' },
            labels: { center: P('$classifier.value.$name.value'),
                sourceEnd: { role: P('$slots.values[0].$definingFeature.value.$name.value') },
                targetEnd: { role: P('$slots.values[1].$definingFeature.value.$name.value') } } } }],
    // `isKind('InstanceValue', '$values.values[0]')` never matched (first runs of P-2026-10-20-2330): a one-step path to a
    // contained value is read through the lproxy backend, not as an id. A navigating hop returns the id, so `exists` on it.
    ['Slot', { kind: 'row', metaclasses: ['Slot'], label: 'Slot (instance value)', priority: 1, predicate: exists('$values.values[0].$instance.value'),
        template: [...slotHead, P('$values.values[0].$instance.value.$name.value')] }],
    ['Slot', { kind: 'row', metaclasses: ['Slot'], label: 'Slot (null)', priority: 1, predicate: kind('LiteralNull', '$values.values[0]'),
        template: [...slotHead, L('null')] }],
    ['Slot', { kind: 'row', metaclasses: ['Slot'], label: 'Slot (literal)', template: [...slotHead, P('$values.values[0].$value.value')] }],
    ...['Package', 'Class', 'DataType', 'PrimitiveType', 'Enumeration', 'Association', 'Generalization', 'Property', 'Operation',
        'Parameter', 'EnumerationLiteral', 'Slot', 'LiteralInteger', 'LiteralString', 'LiteralBoolean', 'LiteralNull', 'InstanceValue'].map(hidden),
];

// ── The rules (design §5), on a snapshot of the store ────────────────────────────────────────────────────────────

type Val = string | number | boolean | null | { ref: string } | { lit: string };
type Snap = Record<string, { cls: string; name: string; f: Record<string, Val[]> }>;
interface Finding { rule: string; sev: 'error' | 'warning'; at: string; msg: string }

/** Every object of the model: its metaclass, name and slot values (a DObject value as {ref}, a literal as {lit}). */
async function snapshot(page: Page, modelId: string): Promise<Snap> {
    return ev<Snap>(page, `const idl = w.store.getState().idlookup; const m = idl[a]; const out = {};
        for (const oid of m.objects || []) { const o = idl[oid]; if (!o) continue; const f = {};
            for (const vid of o.features || []) { const v = idl[vid]; const fd = v && idl[v.instanceof]; if (!fd) continue;
                f[fd.name] = (v.values || []).filter((x) => x !== undefined).map((x) => { const d = typeof x === 'string' ? idl[x] : null;
                    return d && d.className === 'DEnumLiteral' ? { lit: d.name } : d && d.className === 'DObject' ? { ref: x } : x; }); }
            out[oid] = { cls: idl[o.instanceof]?.name, name: o.name, f }; }
        return out;`, modelId, 0);
}

/** The snapshot with ids replaced by `class:name`, sorted: equal before a seed and after its undo. */
function canonical(s: Snap): string {
    const label = (id: string) => s[id] ? `${s[id].cls}:${s[id].name}` : `?${id}`;
    return JSON.stringify(Object.values(s).map((o) => `${o.cls}:${o.name} ${JSON.stringify(Object.fromEntries(Object.entries(o.f).sort()
        .map(([k, vs]) => [k, vs.map((v) => v && typeof v === 'object' && 'ref' in v ? label(v.ref) : v)])))}`).sort());
}

export function runRules(s: Snap): Finding[] {
    const out: Finding[] = [];
    const err = (rule: string, at: string, msg: string) => out.push({ rule, sev: 'error', at, msg });
    const warn = (rule: string, at: string, msg: string) => out.push({ rule, sev: 'warning', at, msg });
    const ids = Object.keys(s);
    const of = (k: string) => ids.filter((id) => isKind(s[id].cls, k));
    const refs = (id: string | undefined, f: string): string[] => (id && s[id] ? s[id].f[f] ?? [] : [])
        .filter((v): v is { ref: string } => !!v && typeof v === 'object' && 'ref' in v).map((v) => v.ref).filter((r) => !!s[r]);
    const ref = (id: string | undefined, f: string) => refs(id, f)[0];
    const prim = (id: string, f: string) => (s[id].f[f] ?? []).find((v) => v !== null && v !== '' && !(typeof v === 'object'));
    const enumOf = (id: string, f: string) => { const v = (s[id].f[f] ?? [])[0]; return v && typeof v === 'object' && 'lit' in v ? v.lit : v == null ? undefined : String(v); };
    const num = (id: string, f: string, dflt: number) => { const v = prim(id, f); return v === undefined ? dflt : Number(v); };
    const bool = (id: string, f: string) => { const v = prim(id, f); return v === true || v === 'true'; };
    const nm = (id: string | undefined) => !id || !s[id] ? '?' : String(prim(id, 'name') ?? s[id].name);
    const lower = (p: string) => num(p, 'lower', 1);
    const upper = (p: string) => num(p, 'upper', 1);
    const within = (n: number, p: string) => n >= lower(p) && (upper(p) === -1 || n <= upper(p));
    const owner: Record<string, string> = {};
    for (const id of ids) for (const f of Object.keys(s[id].f)) if (CONTAINMENT.has(f)) for (const c of refs(id, f)) owner[c] = id;

    const parents = (c: string) => refs(c, 'generalizations').map((g) => ref(g, 'general')).filter((x): x is string => !!x);
    const reach = (c: string) => { const seen = new Set<string>(); const todo = parents(c); while (todo.length) { const p = todo.pop()!; if (seen.has(p)) continue; seen.add(p); todo.push(...parents(p)); } return seen; };
    const ancestors = (c: string) => { const r = reach(c); r.delete(c); return r; };
    const conforms = (c: string | undefined, t: string | undefined) => !!c && !!t && (c === t || ancestors(c).has(t));
    const own = (c: string) => isKind(s[c]?.cls, 'Class') ? refs(c, 'ownedAttributes') : [];
    const allAttrs = (c: string) => [own(c), ...[...ancestors(c)].map(own)].flat();
    const family = (c: string | undefined) => !c ? '?' : isKind(s[c].cls, 'Association') ? 'Association' : isKind(s[c].cls, 'Class') ? 'Class' : isKind(s[c].cls, 'DataType') ? 'DataType' : '?';

    // Class diagram.
    for (const c of of('Classifier')) if (reach(c).has(c)) err('C1', nm(c), 'is among its own ancestors');
    for (const g of of('Generalization')) {
        const sp = ref(g, 'specific'); const ge = ref(g, 'general');
        if (owner[g] !== sp) err('C2', nm(g), `owned by ${nm(owner[g])}, specific ${nm(sp)}`);
        if (sp && sp === ge) err('C2', nm(g), 'general equals specific');
        if (family(sp) !== family(ge)) err('C3', nm(g), `${family(sp)} ${nm(sp)} specializes ${family(ge)} ${nm(ge)}`);
    }
    for (const c of of('Class')) {
        const names = own(c).map(nm); const inherited = new Set([...ancestors(c)].flatMap(own).map(nm));
        names.forEach((n, i) => { if (names.indexOf(n) !== i) err('C4', nm(c), `attribute ${n} twice`); if (inherited.has(n)) err('C4', nm(c), `attribute ${n} hides an inherited one`); });
        const ops = refs(c, 'ownedOperations').map(nm);
        ops.forEach((n, i) => { if (ops.indexOf(n) !== i) err('C4', nm(c), `operation ${n} twice`); });
    }
    for (const p of [...of('Property'), ...of('Parameter')]) {
        const l = lower(p); const u = upper(p);
        if (!(l >= 0 && (u === -1 || u >= l) && u !== 0)) err('C5', nm(p), `multiplicity ${l}..${u}`);
        if (!ref(p, 'type')) warn('C8', nm(p), 'no type');
    }
    for (const a of of('Association')) {
        const ends = refs(a, 'memberEnds');
        if (ends.length !== 2) err('C6', nm(a), `${ends.length} member ends`);
        for (const e of ends) if (ref(e, 'association') !== a || !ref(e, 'type')) err('C6', nm(a), `end ${nm(e)}: association ${nm(ref(e, 'association'))}, type ${nm(ref(e, 'type'))}`);
        const aggs = ends.map((e) => enumOf(e, 'aggregation'));
        if (aggs.filter((x) => x === 'shared' || x === 'composite').length > 1) err('C7', nm(a), 'two aggregate ends');
        ends.forEach((e, i) => { const o = ends[1 - i]; if (aggs[i] === 'composite' && o && (upper(o) === -1 || upper(o) > 1)) err('C7', nm(a), `composite end ${nm(e)}, opposite ${nm(o)} upper ${upper(o)}`); });
    }
    for (const en of of('Enumeration')) {
        const lits = refs(en, 'ownedLiterals'); const names = lits.map(nm);
        names.forEach((n, i) => { if (names.indexOf(n) !== i) err('C9', nm(en), `literal ${n} twice`); });
        for (const l of lits) if (ref(l, 'classifier') !== en) err('C9', nm(l), `classifier ${nm(ref(l, 'classifier'))}`);
    }

    // Object diagram.
    const specs = of('InstanceSpecification');
    const isLink = (i: string) => isKind(s[ref(i, 'classifier') ?? '']?.cls, 'Association');
    const isLiteral = (i: string) => s[i].cls === 'EnumerationLiteral';
    const objects = specs.filter((i) => !isLink(i) && !isLiteral(i));
    const links = specs.filter(isLink);
    const valuesOf = (slot: string) => refs(slot, 'values');
    const instanceAt = (link: string, end: string) => refs(link, 'slots').filter((sl) => ref(sl, 'definingFeature') === end)
        .flatMap(valuesOf).map((v) => ref(v, 'instance')).filter((x): x is string => !!x);
    for (const i of specs) {
        const c = ref(i, 'classifier'); const cc = c ? s[c].cls : undefined;
        if (isLiteral(i)) { if (!isKind(cc, 'Enumeration')) err('O1', nm(i), `literal classified by ${cc} ${nm(c)}`); continue; }
        if (isLink(i)) continue;
        if (!isKind(cc, 'Class') || bool(c!, 'isAbstract')) err('O1', nm(i), `classified by ${bool(c ?? '', 'isAbstract') ? 'abstract ' : ''}${cc} ${nm(c)}`);
    }
    for (const i of [...objects, ...links]) {
        const c = ref(i, 'classifier')!;
        const allowed = isLink(i) ? refs(c, 'memberEnds') : c ? allAttrs(c) : [];
        const slots = refs(i, 'slots'); const feats = slots.map((sl) => ref(sl, 'definingFeature'));
        slots.forEach((sl, k) => {
            const p = feats[k];
            if (!p || !allowed.includes(p)) err('O2', nm(i), `slot ${nm(p)} is not a feature of ${nm(c)}`);
            if (feats.indexOf(p) !== k) err('O3', nm(i), `two slots for ${nm(p)}`);
            if (p && !within(valuesOf(sl).length, p)) err('O4', nm(i), `${nm(p)} has ${valuesOf(sl).length} values, multiplicity ${lower(p)}..${upper(p)}`);
        });
        if (!isLink(i) && c) for (const p of allAttrs(c)) {
            if (lower(p) >= 1 && prim(p, 'defaultValue') === undefined && !feats.includes(p)) warn('O4', nm(i), `no slot for ${nm(p)}`);
        }
    }
    const PRIM_LITERAL: Record<string, string> = { Integer: 'LiteralInteger', String: 'LiteralString', Boolean: 'LiteralBoolean' };
    for (const i of objects) for (const sl of refs(i, 'slots')) {
        const p = ref(sl, 'definingFeature'); const t = ref(p, 'type'); if (!p || !t) continue;
        for (const v of valuesOf(sl)) {
            const vc = s[v].cls; if (vc === 'LiteralNull') continue;
            const tc = s[t].cls; const inst = ref(v, 'instance');
            const ok = tc === 'PrimitiveType' ? !PRIM_LITERAL[nm(t)] || vc === PRIM_LITERAL[nm(t)]
                : tc === 'Enumeration' ? vc === 'InstanceValue' && !!inst && isLiteral(inst) && ref(inst, 'classifier') === t
                : isKind(tc, 'Class') ? vc === 'InstanceValue' && !!inst && objects.includes(inst) && conforms(ref(inst, 'classifier'), t)
                : true;
            if (!ok) err('O5', nm(i), `${nm(p)} : ${nm(t)} holds a ${vc}`);
        }
    }
    for (const l of links) {
        const a = ref(l, 'classifier')!; const ends = refs(a, 'memberEnds'); const slots = refs(l, 'slots');
        const feats = slots.map((sl) => ref(sl, 'definingFeature'));
        const shape = slots.length === 2 && ends.length === 2 && ends.every((e) => feats.filter((f) => f === e).length === 1);
        const vals = slots.every((sl) => { const vs = valuesOf(sl); const e = ref(sl, 'definingFeature'); const inst = vs.length === 1 && s[vs[0]].cls === 'InstanceValue' ? ref(vs[0], 'instance') : undefined;
            return !!inst && objects.includes(inst) && conforms(ref(inst, 'classifier'), ref(e, 'type')); });
        if (!shape || !vals) err('O6', nm(l), `slots ${feats.map(nm).join(', ')}${vals ? '' : ', a value that is not one object of the end type'}`);
    }
    for (const a of of('Association')) {
        const ends = refs(a, 'memberEnds'); if (ends.length !== 2) continue;
        const ls = links.filter((l) => ref(l, 'classifier') === a);
        ends.forEach((e, k) => {
            const o = ends[1 - k];
            for (const x of objects.filter((x) => conforms(ref(x, 'classifier'), ref(o, 'type')))) {
                const n = ls.filter((l) => instanceAt(l, o).includes(x)).length;
                if (!within(n, e)) err('O7', nm(x), `${n} ${nm(a)} links at end ${nm(o)}, ${nm(e)} is ${lower(e)}..${upper(e)}`);
            }
        });
    }
    for (const x of objects) {
        const n = links.filter((l) => refs(ref(l, 'classifier'), 'memberEnds').some((e) => enumOf(e, 'aggregation') === 'composite' && instanceAt(l, e).includes(x))).length;
        if (n > 1) err('O8', nm(x), `part of ${n} composite links`);
    }
    return out;
}

// ── Page reads ───────────────────────────────────────────────────────────────────────────────────────────────────

const ACTIVE = '.dock-tabpane-active .react-flow';

/** A node's labels (text, computed font and decoration, where the decoration sits) and its rows. */
async function nodeDetail(page: Page, vertexId: string) {
    return page.evaluate(([root, id]) => {
        const n = document.querySelector(`${root} .react-flow__node[data-id="${id}"]`) as HTMLElement | null;
        if (!n) return null;
        const labels = Array.from(n.querySelectorAll('.ir-label')).map((l) => {
            const e = l as HTMLElement; const st = getComputedStyle(e); const parent = e.parentElement ? getComputedStyle(e.parentElement) : null;
            return { text: e.textContent, tag: e.tagName.toLowerCase(), cls: e.className, fontStyle: st.fontStyle, fontWeight: st.fontWeight,
                decoration: st.textDecorationLine, inlineDecoration: e.style.textDecoration, parentDecoration: parent?.textDecorationLine ?? null,
                parentCls: e.parentElement?.className ?? null };
        });
        const rows = Array.from(n.querySelectorAll('.ir-compartment .ir-row')).map((r) => r.textContent);
        const compartments = n.querySelectorAll('.ir-compartment').length;
        return { labels, rows, compartments };
    }, [ACTIVE, vertexId] as const);
}

/** Every drawn edge with the markers of its paths. */
async function edgeMarkers(page: Page) {
    return page.evaluate((root) => Array.from(document.querySelectorAll(`${root} .react-flow__edge`)).map((g) => ({
        id: (g as HTMLElement).dataset.id ?? '',
        markers: Array.from(g.querySelectorAll('path')).map((p) => [p.getAttribute('marker-start'), p.getAttribute('marker-end')]).filter(([a, b]) => a || b),
    })), ACTIVE);
}

/** The end labels (multiplicity or role) and the drawn node whose box is nearest to each. */
async function endLabels(page: Page) {
    return page.evaluate((root) => {
        const nodes = Array.from(document.querySelectorAll(`${root} .react-flow__node`)).map((n) => ({ id: (n as HTMLElement).dataset.id ?? '', r: n.getBoundingClientRect() }));
        const dist = (x: number, y: number, r: DOMRect) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
        return Array.from(document.querySelectorAll(`${root} .edge-end-label`)).map((e) => {
            const r = e.getBoundingClientRect(); const x = r.left + r.width / 2; const y = r.top + r.height / 2;
            const near = nodes.map((n) => ({ id: n.id, d: dist(x, y, n.r) })).sort((a, b) => a.d - b.d)[0];
            return { text: e.textContent?.trim() ?? '', role: e.classList.contains('edge-end-label--role'), near: near?.id ?? null };
        });
    }, ACTIVE);
}

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const overlapPairs = (ns: Box[]) => ns.flatMap((a, i) => ns.slice(i + 1).filter((b) => overlaps(a, b)).map((b) => `${a.name}/${b.name}`));
const keyOf = (ids: Ids, vertex: string) => Object.keys(ids).find((k) => ids[k].vertex === vertex) ?? vertex;

// ── Scenes ───────────────────────────────────────────────────────────────────────────────────────────────────────

async function buildScene(browser: Browser, out: Record<string, unknown>) {
    const { page, errors } = await openPage(browser);
    const pid = await createProject(page, PROJECT);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(4000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    const mm = await buildUmlMetamodel(page);
    meas('metamodel', mm.bounds);
    meas('attribute types and defaults', mm.attrs);
    out.metamodel = mm;
    const shell = await buildModelShell(page);
    if (!shell.graphId) { check('a v2-flow graph exists for the model', false, shell); return null; }
    await ev(page, `w.LProject.getProject().models[0].name = 'library'; return 1;`);
    const plan = modelPlan();
    const ids = await buildObjects(page, shell.graphId, plan.objects);
    check('every object of the plan was created with its vertex', Object.keys(ids).length === plan.objects.length,
        { planned: plan.objects.length, made: Object.keys(ids).length, missing: plan.objects.map((o) => o[0]).filter((k) => !ids[k]) });
    await buildLinks(page, ids, plan.containment, []);
    await setReferences(page, ids, plan.references, plan.singleRefs);
    // syncCreateObject sets DObject.name only; the `name` slot, which every `$x.value.$name.value` path reads, keeps its
    // auto value (`Property_0`) until written (measured on the first run of P-2026-10-20-2330).
    // Only where the metaclass has the feature (Generalization and Slot are not NamedElements).
    const unnamed = await ev<string[]>(page, `const skipped = [];
        for (const [key, obj, n] of a) { const o = w.LPointerTargetable.fromPointer(obj); if (o.$name) o.$name.values = [n]; else skipped.push(key); }
        return skipped;`, plan.objects.filter((o) => ids[o[0]]).map((o) => [o[0], ids[o[0]].obj, o[2]]), 0);
    meas('objects without a name slot', unnamed);
    const attrErrors = await setAttrs(page, ids, plan.attrs);
    check('every attribute value was written', attrErrors.length === 0, attrErrors);
    out.ids = ids;
    const vpClass = await buildViewpoint(page, VP_CLASS, CLASS_VIEWS);
    const vpObject = await buildViewpoint(page, VP_OBJECT, OBJECT_VIEWS);
    const bad = [...vpClass.made, ...vpObject.made].filter((m) => !/:(vertex|graphVertex|edge|row)$/.test(m));
    check('every view of both viewpoints holds its IR', bad.length === 0 && vpClass.made.length === CLASS_VIEWS.length && vpObject.made.length === OBJECT_VIEWS.length,
        { classViews: vpClass.made.length, objectViews: vpObject.made.length, bad });
    out.viewpoints = { [VP_CLASS]: vpClass, [VP_OBJECT]: vpObject };
    await setTheme(page, 'light');
    await pickViewpoint(page, VP_CLASS);
    await page.waitForTimeout(SETTLE_MS);
    return { page, errors, ids, shell: shell as { modelId: string; graphId: string } };
}

const CLASS_NODES = ['Publication', 'Book', 'Magazine', 'Library', 'Member', 'Genre', 'String', 'Integer', 'Boolean'];
const CLASS_EDGES = ['gen_Book', 'gen_Magazine', 'Holdings', 'Membership', 'Borrowing'];
const OBJECT_NODES = OBJECTS.map((o) => o[0]);
const OBJECT_EDGES = LINKS.map((l) => l[0]);

async function classDiagram(page: Page, ids: Ids, res: Record<string, unknown>) {
    const nodes = await readNodes(page);
    const edges = await readEdges(page);
    const keys = nodes.map((n) => keyOf(ids, n.id));
    res.nodes = nodes.map((n) => `${keyOf(ids, n.id)} ${n.x},${n.y} ${n.w}x${n.h}`);
    res.edges = edges.map((e) => `${e.id} ${keyOf(ids, e.source)}->${keyOf(ids, e.target)}`);
    meas('class nodes', res.nodes); meas('class edges', res.edges);
    const instances = [...OBJECT_NODES, ...OBJECT_EDGES].filter((k) => keys.includes(k));
    check('CD-1 the class diagram draws 9 nodes (5 classes, Genre, 3 primitive types) and no InstanceSpecification',
        nodes.length === 9 && CLASS_NODES.every((k) => keys.includes(k)) && instances.length === 0, { keys, instances });
    const edgeIds = edges.map((e) => e.id);
    check('CD-2 the class diagram draws 5 edges: 2 generalizations, 3 associations, each an object-as-edge',
        edges.length === 5 && CLASS_EDGES.every((k) => edgeIds.includes(`irobj_${ids[k].obj}`)), res.edges);
    const region = nodes.filter((n) => n.x >= 1300 || n.x + n.w > 1300).map((n) => keyOf(ids, n.id));
    const pairs = overlapPairs(nodes);
    check('CD-3 every class diagram node lies left of x 1300 and no two boxes overlap', region.length === 0 && pairs.length === 0, { region, pairs });

    const book = await nodeDetail(page, ids.Book.vertex);
    res.book = book;
    check('CD-4 Book\'s rows read "- isbn : String" and "- genre : Genre"', !!book && book.rows.includes('- isbn : String') && book.rows.includes('- genre : Genre'), book?.rows);
    const member = await nodeDetail(page, ids.Member.vertex);
    const publication = await nodeDetail(page, ids.Publication.vertex);
    res.member = member; res.publication = publication;
    meas('Member rows', member?.rows); meas('Publication rows', publication?.rows);
    check('CD-5 attributes then operations in one compartment (fallback: one children compartment renders): Member and Publication',
        !!member && member.compartments === 1 && JSON.stringify(member.rows) === JSON.stringify(['- name : String', '- active : Boolean', '+ borrow(b : Book) : Boolean'])
        && !!publication && JSON.stringify(publication.rows) === JSON.stringify(['+ title : String', '# year : Integer', '+ age() : Integer']),
        { member: member?.rows, publication: publication?.rows });
    const pubName = publication?.labels.find((l) => l.text === 'Publication');
    const bookName = book?.labels.find((l) => l.text === 'Book');
    check('CD-6 Publication is marked abstract: its name in italic, Book\'s upright', pubName?.fontStyle === 'italic' && bookName?.fontStyle === 'normal',
        { publication: pubName, book: bookName });
    const genre = await nodeDetail(page, ids.Genre.vertex);
    res.genre = genre;
    check('CD-7 Genre reads «enumeration» Genre and lists its three literals',
        !!genre && genre.labels.map((l) => l.text).join('|') === '«enumeration»|Genre' && JSON.stringify(genre.rows) === JSON.stringify(GENRE.literals), genre);
    const str = await nodeDetail(page, ids.String.vertex);
    check('CD-8 a primitive type reads «primitive» String', !!str && str.labels.map((l) => l.text).join('|') === '«primitive»|String', str?.labels);

    const markers = await edgeMarkers(page);
    res.markers = markers;
    const edgeOf = (k: string) => edges.find((e) => e.id === `irobj_${ids[k].obj}`);
    const markOf = (k: string) => markers.find((m) => m.id === `irobj_${ids[k].obj}`)?.markers ?? [];
    const has = (k: string, end: 0 | 1, glyph: string) => markOf(k).some((m) => (m[end] ?? '').includes(glyph));
    const g = edgeOf('gen_Book');
    check('CD-9 the generalization Book -> Publication ends in a hollow triangle at Publication',
        !!g && g.source === ids.Book.vertex && g.target === ids.Publication.vertex && has('gen_Book', 1, 'ir-triangle-hollow') && !has('gen_Book', 0, 'ir-'),
        { edge: g, markers: markOf('gen_Book') });
    const h = edgeOf('Holdings'); const m = edgeOf('Membership'); const b = edgeOf('Borrowing');
    check('CD-10 Holdings has a filled diamond at Library, Membership a hollow one, Borrowing none',
        !!h && h.source === ids.Library.vertex && has('Holdings', 0, 'ir-diamond-filled') && !has('Holdings', 1, 'ir-diamond')
        && !!m && m.source === ids.Library.vertex && has('Membership', 0, 'ir-diamond-hollow') && !has('Membership', 1, 'ir-diamond')
        && !!b && !markOf('Borrowing').some((x) => (x[0] ?? '').includes('ir-diamond') || (x[1] ?? '').includes('ir-diamond')),
        { holdings: [h, markOf('Holdings')], membership: [m, markOf('Membership')], borrowing: markOf('Borrowing') });
    const ends = await endLabels(page);
    res.endLabels = ends.map((e) => ({ ...e, near: e.near && keyOf(ids, e.near) }));
    meas('end labels', res.endLabels);
    const mult = ends.filter((e) => !e.role);
    const loans = mult.find((e) => e.text === '0..3');
    check('CD-11 the end labels 0..* and 0..3 are drawn, 0..3 at Book, with the role names',
        mult.some((e) => e.text === '0..*') && !!loans && loans.near === ids.Book.vertex
        && ['library', 'holdings', 'libraries', 'members', 'borrower', 'loans'].every((r) => ends.some((e) => e.role && e.text === r)), res.endLabels);
    return { nodes: nodes.length, edges: edges.length };
}

async function objectDiagram(page: Page, ids: Ids, res: Record<string, unknown>) {
    const nodes = await readNodes(page);
    const edges = await readEdges(page);
    const keys = nodes.map((n) => keyOf(ids, n.id));
    res.nodes = nodes.map((n) => `${keyOf(ids, n.id)} ${n.x},${n.y} ${n.w}x${n.h}`);
    res.edges = edges.map((e) => `${e.id} ${keyOf(ids, e.source)}->${keyOf(ids, e.target)}`);
    meas('object nodes', res.nodes); meas('object edges', res.edges);
    const classes = CLASS_NODES.filter((k) => keys.includes(k));
    check('OD-1 the object diagram draws 5 nodes and no Class', nodes.length === 5 && OBJECT_NODES.every((k) => keys.includes(k)) && classes.length === 0, { keys, classes });
    const edgeIds = edges.map((e) => e.id);
    const ends = LINKS.every(([l, , s, t]) => { const e = edges.find((x) => x.id === `irobj_${ids[l].obj}`); return !!e && e.source === ids[s].vertex && e.target === ids[t].vertex; });
    check('OD-2 the object diagram draws 5 edges, one per link, from the object of slots[0] to the object of slots[1]',
        edges.length === 5 && OBJECT_EDGES.every((k) => edgeIds.includes(`irobj_${ids[k].obj}`)) && ends, res.edges);
    const region = nodes.filter((n) => n.x < 1400).map((n) => keyOf(ids, n.id));
    const pairs = overlapPairs(nodes);
    check('OD-3 every object diagram node lies at x >= 1400 and no two boxes overlap', region.length === 0 && pairs.length === 0, { region, pairs });
    const dune = await nodeDetail(page, ids.dune.vertex);
    res.dune = dune;
    const head = (dune?.labels ?? []).filter((l) => l.cls.includes('ir-label--top'));
    meas('dune header', head);
    check('OD-4 the header of dune reads "dune : Book" (fallback: two top labels, name and classifier) and is underlined',
        head.map((l) => l.text).join(' : ') === 'dune : Book' && head.every((l) => l.decoration.includes('underline')),
        head.map((l) => ({ text: l.text, decoration: l.decoration, on: `${l.tag}.${l.cls}`, inline: l.inlineDecoration, parent: l.parentDecoration })));
    check('OD-5 dune shows genre = fiction among its slots', !!dune && dune.rows.includes('genre = fiction'), dune?.rows);
    meas('dune genre in the store', await ev(page, `const L = (x) => w.LPointerTargetable.fromPointer(x); const s = L(a.s), v = L(a.v), l = L(a.l);
        const v0 = s.$values.values[0]; const i0 = v.$instance;
        return { slotValues: s.$values.__raw?.values, v0: v0 && v0.className, v0meta: v0 && v0.instanceof?.name, instRaw: i0?.__raw?.values,
            inst: i0?.value?.name, litMeta: l.instanceof?.name, litSlot: l.$name?.value, litName: l.name };`,
        { s: ids.slot_dune_genre.obj, v: ids.val_dune_genre.obj, l: ids.lit_fiction.obj }, 0));
    const ends2 = await endLabels(page);
    res.endLabels = ends2.map((e) => ({ ...e, near: e.near && keyOf(ids, e.near) }));
    meas('object end labels', res.endLabels);
    return { nodes: nodes.length, edges: edges.length };
}

/** The rules on the example, then each seeded violation, its findings, its undo, and the undo verified. */
async function rules(page: Page, ids: Ids, shell: { modelId: string; graphId: string }, res: Record<string, unknown>) {
    const base = await snapshot(page, shell.modelId);
    const baseSig = canonical(base);
    const f0 = runRules(base);
    res.example = f0;
    meas('rules on the example', f0);
    check('R-0 the rules C1..C9 and O1..O8 find no error on the example (warnings reported)', f0.every((f) => f.sev === 'warning'),
        { errors: f0.filter((f) => f.sev === 'error'), warnings: f0.filter((f) => f.sev === 'warning') });

    const L_ = (js: string, arg: unknown, pause = 400) => ev(page, `const L = (x) => w.LPointerTargetable.fromPointer(x); ${js}`, arg, pause);
    const setRef = (key: string, f: string, target: string) => ev(page, `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
        c2j.syncSetReferenceValue(a[0], a[1], a[2], 'replace'); return 1;`, [ids[key].vertex, f, ids[target].obj], 400);
    const create = async (objects: ModelPlan['objects'], containment: ModelPlan['containment'], references: ModelPlan['references']) => {
        const made = await buildObjects(page, shell.graphId, objects);
        Object.assign(ids, made);
        await buildLinks(page, ids, containment, []);
        await setReferences(page, ids, references, modelPlan().singleRefs);
        return Object.keys(made);
    };
    const remove = async (keys: string[]) => {
        for (const k of keys) {
            await ev(page, `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
                try { if (w.store.getState().idlookup[a]) c2j.syncDeleteVertex(a); } catch (e) { return String(e); } return 1;`, ids[k].vertex, 300);
            delete ids[k];
        }
    };
    const seeds: Array<{ rule: string; label: string; apply: () => Promise<unknown>; undo: () => Promise<unknown> }> = [];

    // O1: nature classified by the abstract Publication. Its slot `issue` (a Magazine attribute) is detached for the
    // seed, else O2 fires on it too; restored by the undo.
    seeds.push({ rule: 'O1', label: 'nature classified by Publication', apply: async () => {
        await setRef('nature', 'classifier', 'Publication');
        return L_(`const o = L(a.o); o.$slots.values = (o.$slots.__raw?.values ?? []).filter((v) => v != null && v !== '' && v !== a.s);
            return o.$slots.__raw?.values;`,
            { o: ids.nature.obj, s: ids.slot_nature_issue.obj });
    }, undo: async () => {
        await setRef('nature', 'classifier', 'Magazine');
        return L_(`const o = L(a.o); o.$slots.values = a.s; return o.$slots.values.length;`,
            { o: ids.nature.obj, s: ['title', 'year', 'issue'].map((k) => ids[`slot_nature_${k}`].obj) });
    } });
    // O5: the year of dune as a LiteralString.
    seeds.push({ rule: 'O5', label: 'the year of dune as a LiteralString', apply: async () => {
        await create([['seed_year', 'LiteralString', 'seed_year', 3000, 1400, null]], [], []);
        await L_(`L(a).$value.values = ['1965']; return 1;`, ids.seed_year.obj);
        return L_(`const s = L(a.s); s.$values.values = [a.v]; return s.$values.values.length;`, { s: ids.slot_dune_year.obj, v: ids.seed_year.obj });
    }, undo: async () => {
        await L_(`const s = L(a.s); s.$values.values = [a.v]; return 1;`, { s: ids.slot_dune_year.obj, v: ids.val_dune_year.obj });
        await remove(['seed_year']);
    } });
    // O7: a second Member bob, with a Borrowing link to dune.
    const bobKeys = ['seed_bob', 'seed_link', 'seed_s0', 'seed_s1', 'seed_v0', 'seed_v1'];
    seeds.push({ rule: 'O7', label: 'a second Member bob with a Borrowing link to dune', apply: async () => create(
        [['seed_bob', 'InstanceSpecification', 'bob', 3000, 1520, null], ['seed_link', 'InstanceSpecification', 'borrowing2', 3220, 1520, null],
            ['seed_s0', 'Slot', 'seed_s0', 3440, 1520, null], ['seed_s1', 'Slot', 'seed_s1', 3660, 1520, null],
            ['seed_v0', 'InstanceValue', 'seed_v0', 3880, 1520, null], ['seed_v1', 'InstanceValue', 'seed_v1', 4100, 1520, null]],
        [['seed_link', 'slots', 'seed_s0'], ['seed_link', 'slots', 'seed_s1'], ['seed_s0', 'values', 'seed_v0'], ['seed_s1', 'values', 'seed_v1']],
        [['seed_bob', 'classifier', 'Member'], ['seed_link', 'classifier', 'Borrowing'],
            ['seed_s0', 'definingFeature', 'end_Borrowing_borrower'], ['seed_s1', 'definingFeature', 'end_Borrowing_loans'],
            ['seed_v0', 'instance', 'seed_bob'], ['seed_v1', 'instance', 'dune']]),
    undo: async () => remove(['seed_v0', 'seed_v1', 'seed_s0', 'seed_s1', 'seed_link', 'seed_bob']) });
    // C1: a generalization from Publication to Book.
    seeds.push({ rule: 'C1', label: 'a generalization from Publication to Book', apply: async () => create(
        [['seed_gen', 'Generalization', 'Publication_Book', 3000, 1640, null]], [['Publication', 'generalizations', 'seed_gen']],
        [['seed_gen', 'specific', 'Publication'], ['seed_gen', 'general', 'Book']]),
    undo: async () => remove(['seed_gen']) });
    // C7: the library end of Holdings with upper -1.
    seeds.push({ rule: 'C7', label: 'the library end of Holdings with upper -1', apply: async () =>
        L_(`L(a).$upper.values = [-1]; return 1;`, ids.end_Holdings_library.obj),
    undo: async () => L_(`L(a).$upper.values = [1]; return 1;`, ids.end_Holdings_library.obj) });

    const out: Array<Record<string, unknown>> = [];
    for (const sd of seeds) {
        const applied = await sd.apply();
        await page.waitForTimeout(600);
        const fs = runRules(await snapshot(page, shell.modelId));
        const errs = fs.filter((f) => f.sev === 'error');
        const rulesHit = [...new Set(errs.map((f) => f.rule))];
        check(`R-${sd.rule} seeded "${sd.label}": caught by ${sd.rule} and by no other error rule`, rulesHit.length === 1 && rulesHit[0] === sd.rule,
            { errors: errs, warnings: fs.filter((f) => f.sev === 'warning'), applied });
        await sd.undo();
        await page.waitForTimeout(800);
        const after = await snapshot(page, shell.modelId);
        const sig = canonical(after);
        const fa = runRules(after);
        const left = JSON.parse(sig).filter((x: string) => !JSON.parse(baseSig).includes(x));
        const gone = JSON.parse(baseSig).filter((x: string) => !JSON.parse(sig).includes(x));
        check(`R-${sd.rule} undone: the model equals the built one and the rules find no error again`, sig === baseSig && fa.every((f) => f.sev === 'warning'),
            { left: left.slice(0, 6), gone: gone.slice(0, 6), errors: fa.filter((f) => f.sev === 'error') });
        out.push({ rule: sd.rule, label: sd.label, findings: fs, undone: sig === baseSig });
    }
    void bobKeys;
    res.seeds = out;
}

/** Import Project of the exported file in a fresh page; both viewpoints counted as in the built project. */
async function roundTrip(browser: Browser, file: string, expected: Record<string, { nodes: number; edges: number }>, res: Record<string, unknown>) {
    const { page, errors } = await openPage(browser);
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(5000);
    const imported = await ev<{ id: string | null; name: string | null }>(page, `
        const api = await import('/src/api/persistance/projects.ts');
        const list = () => JSON.parse(localStorage.getItem('projects') || '[]');
        const before = list().length;
        await api.ProjectsApi.importFromText(a);
        for (let i = 0; i < 75 && list().length <= before; i++) await new Promise((r) => setTimeout(r, 200));
        const l = list(); const p = l.length > before ? l[l.length - 1] : null;
        return { id: p ? p.id : null, name: p ? p.name : null };`, readFileSync(file, 'utf8'), 0);
    res.imported = imported;
    if (!imported.id) { check('RT-0 the exported file imports as a project', false, imported); await page.context().close(); return; }
    await page.goto(`${URL}/#/project?id=${imported.id}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(9000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    if (!(await page.locator('.toolbar-viewpoint-trigger:visible').count())) {
        await ev(page, `const dm = await import('/src/components/abstract/DockManager.tsx'); const m = w.LProject.getProject().models[0];
            await dm.default.open2(w.LPointerTargetable.fromPointer(m.id)); return 1;`, undefined, 8000);
    }
    await setTheme(page, 'light');
    const counts: Record<string, { nodes: number; edges: number }> = {};
    for (const vp of [VP_CLASS, VP_OBJECT]) {
        await pickViewpoint(page, vp);
        await page.waitForTimeout(SETTLE_MS);
        counts[vp] = { nodes: (await readNodes(page)).length, edges: (await readEdges(page)).length };
    }
    res.counts = counts;
    res.errors = errors.slice(0, 10);
    // Import Project names the imported copy `<name> copy` (measured on the first run of P-2026-10-20-2330).
    check('RT-1 the imported project, named as exported (Import adds " copy"), gives in both viewpoints the node and edge counts of the built one',
        (imported.name === PROJECT || imported.name === `${PROJECT} copy`) && JSON.stringify(counts) === JSON.stringify(expected), { imported, counts, expected });
    await page.context().close();
}

if (process.argv[1] && /uml-class-object-fixture\.ts$/.test(process.argv[1])) {
    const browser = await chromium.launch();
    const out: Record<string, unknown> = { url: URL, at: new Date().toISOString() };
    try {
        const scene = await buildScene(browser, out);
        if (scene) {
            const { page, errors, ids, shell } = scene;
            await saveScene(page, EXPORT_FILE);
            const file = process.env.GV_SAVE ? `${process.env.GV_SAVE.replace(/\/$/, '')}/${EXPORT_FILE}` : null;
            check('EX-1 the project is exported before any check that mutates the model', !!file && existsSync(file), { file });
            const counts: Record<string, { nodes: number; edges: number }> = {};
            const cd: Record<string, unknown> = {}; out.classDiagram = cd;
            counts[VP_CLASS] = await classDiagram(page, ids, cd);
            // outSteps 2: frame the drawn nodes' box (the fit alone left the object diagram, at x >= 1400, out of view).
            await shoot(page, 'uml-class-diagram-light.png', true, 2);
            await pickViewpoint(page, VP_OBJECT);
            await page.waitForTimeout(SETTLE_MS);
            const od: Record<string, unknown> = {}; out.objectDiagram = od;
            counts[VP_OBJECT] = await objectDiagram(page, ids, od);
            await shoot(page, 'uml-object-diagram-light.png', true, 2);
            const rs: Record<string, unknown> = {}; out.rules = rs;
            await rules(page, ids, shell, rs);
            out.errors = errors.slice(0, 20);
            meas('page errors', errors.slice(0, 5));
            if (file && existsSync(file)) { const rt: Record<string, unknown> = {}; out.roundTrip = rt; await roundTrip(browser, file, counts, rt); }
            else check('RT-1 round trip: no exported file (GV_SAVE unset)', false, { file });
        }
    } finally {
        out.checks = { pass, fail };
        writeFileSync(`${OUT}/uml-class-object.json`, JSON.stringify(out, null, 2));
        meas('json', `${OUT}/uml-class-object.json`);
        await browser.close();
    }
    console.log(`DONE pass=${pass} fail=${fail}`);
    process.exit(fail === 0 ? 0 : 1);
}
