/**
 * dcn-drone-fixture (P-2026-11-06-2335, R-DCN-19): the DCN metamodel of spec §3 on top of the R-OI UML metamodel, the
 * drone class level of the LNCS 16470 chapter (Fig. 6, values as transcribed in the prompt), and the class-level
 * acceptance of L2.1 (`featureSources`, `dormantOwner`). Built in the real app on its own dev server, like
 * uml-class-object-fixture.
 *
 * Spec: docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §3, §5; discovery
 * docs/discovery/discovery_2026-11-06_dcn_foundations.md §2.3. Builds:
 *   - one metamodel `DCN`: the UML tables of uml-class-object-fixture (copied: that fixture exports no builder, and
 *     importing it would also set GV_OUT to its own folder), then StaticClass, Viewpoint, DynamicClass, Monitor,
 *     CoherenceConstraint, TrajectoryPattern, BoundedPersistence, BoundedResponse, and the new features of Operation
 *     and Property (R-DCN-10, R-DCN-13);
 *   - one M1 model `drone` in the root form of the UML fixture (every object a canvas create, `syncCreateObject`,
 *     appended to its containment slot by `syncCreateCompositionLink`), default view, objects on a grid;
 *   - the `object` record of onto-s2-instantiate (branch oi-s3b; the UML fixture writes no binding) with
 *     `featureSources: [[StaticClass.viewpoints, Viewpoint.classes, DynamicClass.attributes]]`; its `link` record is
 *     judged by checkBindings and not stored.
 * Left out, as the prompt says: `PhysicalQuantity` and `Context`; object-level instances (lane L2.5).
 *
 * Measures (MEAS) and checks (PASS/FAIL):
 *   - whether `Expression` and `Action` are accepted as attribute types through the L-API, and whether a multivalued
 *     `Action` attribute keeps its order;
 *   - whether `&&` / `||` or `and` / `or` parse (the stored invariants take the one that does), which JjEL form of the
 *     Alert invariants parses (by singleton name, as in the chapter, or from `self` through
 *     `ownedSensors`), and whether the placeholder actions parse (a measure, not a gate: L3.4 owns slot writes);
 *   - `checkBindings` on the records (zero defects), `instantiableClassifiers` (static classes, never a DynamicClass);
 *   - `featureClosure` of Drone and WeatherAssessmentUnit: own features, then those of the viewpoint classes, with
 *     `dormantOwner`. The transcribed dynamic classes own no attribute, so the closure has no dormant feature; after
 *     the export, one seeded Integer attribute per dynamic class (`seed_<Class>`) measures the order and the owners;
 *   - the conformance validator on the class-level model, every problem listed (a finding, not a fix).
 * With GV_SAVE set the project is exported, before the seeded attributes, as dcn-drone.jjodel.
 *
 * Run:  GV_SAVE=~/jjodel-demo-exports/dcn node frontend/scripts/lane-run.mjs probe ~/jjodel-w-dcn-l22 \
 *         frontend/scripts/probe/dcn-drone-fixture.ts --port 3086 --id P-2026-11-06-2335
 * Env:  DCN_OUT   output directory of screenshots and measures (default docs/discovery/assets/dcn-drone)
 *       GV_SAVE   opt-in: the directory the project is exported to (bpmn-lanes-fixture `saveScene`)
 */
import { chromium, type Page } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { setTheme, SETTLE_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3086/').replace(/\/$/, '');
if (/:300[01]$/.test(URL)) throw new Error('never 3000 or 3001');
const OUT = (process.env.DCN_OUT || new globalThis.URL('../../../docs/discovery/assets/dcn-drone/', import.meta.url).pathname).replace(/\/$/, '');
mkdirSync(OUT, { recursive: true });
// The BPMN fixture's `shoot` writes into its GV_OUT: set before it is loaded, so the screenshots land here.
process.env.GV_OUT = OUT;
const { buildLinks, buildMetamodel, buildModelShell, buildObjects, createProject, ev, openPage, saveScene, shoot } = await import('./bpmn-lanes-fixture.ts');

const PROJECT = 'DCN drone';
const EXPORT_FILE = 'dcn-drone.jjodel';

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
    if (ok) pass++; else fail++;
};
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v).slice(0, 3000)}`);

// ── The metamodel: UML (copied from uml-class-object-fixture), then DCN (spec §3) ──────────────────────────────────

/** [class, abstract, supertypes]. */
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
const DCN_CLASSES: Array<[string, boolean, string[]]> = [
    ['StaticClass', false, ['Class']], ['Viewpoint', false, ['NamedElement']],
    // R-DCN-10: a feature source, not a Classifier.
    ['DynamicClass', false, ['NamedElement']], ['Monitor', false, ['NamedElement']],
    ['CoherenceConstraint', false, ['NamedElement']], ['TrajectoryPattern', true, []],
    ['BoundedPersistence', false, ['TrajectoryPattern']], ['BoundedResponse', false, ['TrajectoryPattern']],
];

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
const DCN_REFS: Array<[string, string, string, boolean, boolean, number, number]> = [
    ['StaticClass', 'viewpoints', 'Viewpoint', true, true, 0, -1],
    ['Viewpoint', 'classes', 'DynamicClass', true, true, 1, -1],
    ['DynamicClass', 'attributes', 'Property', true, true, 0, -1],
    ['DynamicClass', 'operations', 'Operation', true, true, 0, -1],
    ['DynamicClass', 'monitors', 'Monitor', true, true, 0, -1],
    ['Operation', 'redefines', 'Operation', false, false, 0, 1],
    ['CoherenceConstraint', 'context', 'StaticClass', false, false, 1, 1],
    ['CoherenceConstraint', 'pattern', 'TrajectoryPattern', true, false, 0, 1],
];
const ENUMS: Array<[string, string[]]> = [
    ['VisibilityKind', ['public', 'private', 'protected', 'package']],
    ['AggregationKind', ['none', 'shared', 'composite']],
];
/** [owner, attribute, type (Ecore primitive, core type or enumeration), lower, upper, default]. */
const UML_ATTRS: Array<[string, string, string, number, number, number | boolean | null]> = [
    ['NamedElement', 'name', 'EString', 1, 1, null],
    ['Classifier', 'isAbstract', 'EBoolean', 1, 1, null],
    ['MultiplicityElement', 'lower', 'EInt', 1, 1, 1], ['MultiplicityElement', 'upper', 'EInt', 1, 1, 1],
    ['Property', 'visibility', 'VisibilityKind', 1, 1, null], ['Property', 'aggregation', 'AggregationKind', 1, 1, null],
    ['Property', 'isDerived', 'EBoolean', 1, 1, null], ['Property', 'defaultValue', 'EString', 0, 1, null],
    ['Operation', 'visibility', 'VisibilityKind', 1, 1, null],
    ['LiteralInteger', 'value', 'EInt', 1, 1, null], ['LiteralString', 'value', 'EString', 1, 1, null],
    ['LiteralBoolean', 'value', 'EBoolean', 1, 1, null],
];
const DCN_ATTRS: Array<[string, string, string, number, number, number | boolean | null]> = [
    ['StaticClass', 'isSingleton', 'EBoolean', 1, 1, false],
    ['Viewpoint', 'isOverlapping', 'EBoolean', 1, 1, false], ['Viewpoint', 'isComplete', 'EBoolean', 1, 1, true],
    ['DynamicClass', 'invariant', 'Expression', 1, 1, null], ['DynamicClass', 'isCreation', 'EBoolean', 1, 1, false],
    ['Operation', 'pre', 'Expression', 0, 1, null], ['Operation', 'body', 'Action', 0, -1, null],
    ['Monitor', 'body', 'Action', 0, -1, null],
    // R-DCN-13: two optional integer bounds, named apart from the multiplicity lower/upper.
    ['Property', 'rangeMin', 'EInt', 0, 1, null], ['Property', 'rangeMax', 'EInt', 0, 1, null],
    ['CoherenceConstraint', 'pointwise', 'Expression', 0, 1, null],
    ['BoundedPersistence', 'condition', 'Expression', 1, 1, null], ['BoundedPersistence', 'k', 'EInt', 1, 1, null],
    ['BoundedResponse', 'trigger', 'Expression', 1, 1, null], ['BoundedResponse', 'response', 'Expression', 1, 1, null],
    ['BoundedResponse', 'k', 'EInt', 1, 1, null],
];
const TYPE_PTR: Record<string, string> = {
    EString: 'Pointer_ESTRING', EInt: 'Pointer_EINT', EBoolean: 'Pointer_EBOOLEAN', Expression: 'Pointer_EXPRESSION', Action: 'Pointer_ACTION',
};
const CLASSES = [...UML_CLASSES, ...DCN_CLASSES];
const REFS = [...UML_REFS, ...DCN_REFS];
const ATTRS = [...UML_ATTRS, ...DCN_ATTRS];

/** uml-class-object-fixture `buildUmlMetamodel` over the joined tables; the types of the new attributes read back. */
async function buildDcnMetamodel(page: Page) {
    const classes = await buildMetamodel(page, CLASSES, REFS.map(([o, r, t, c, m]): [string, string, string, boolean, boolean] => [o, r, t, c, m]), 'NamedElement');
    const pkgJs = `const pkg = w.LProject.getProject().metamodels[0].packages[0]; const cls = (n) => pkg.classes.find((c) => c.name === n);
        const en = (n) => pkg.enumerators.find((e) => e.name === n);`;
    await ev(page, `const mm = w.LProject.getProject().metamodels[0]; mm.name = 'DCN'; mm.packages[0].name = 'DCN'; return 1;`);
    for (const [name, lits] of ENUMS) {
        await ev(page, `${pkgJs} const e = pkg.addEnumerator(a[0]); for (const l of a[1]) e.addLiteral(l); return 1;`, [name, lits], 600);
    }
    const attrs: Record<string, unknown> = {};
    for (const [owner, name, type, lower, upper, dflt] of ATTRS) {
        if (name !== 'name') await ev(page, `${pkgJs} const t = a.ptr || en(a.type).id; cls(a.owner).addAttribute(a.name, t); return 1;`,
            { owner, name, type, ptr: TYPE_PTR[type] ?? null });
        attrs[`${owner}.${name}`] = await ev(page, `${pkgJs} const idl = w.store.getState().idlookup;
            const at = cls(a.owner).attributes.find((x) => x.name === a.name);
            at.lowerBound = a.lower; at.upperBound = a.upper;
            let d = 'none'; if (a.dflt !== null) { try { at.defaultValue = a.dflt; d = 'ok'; } catch (e) { d = String(e && e.message || e); } }
            return { type: at.type?.name, typeId: idl[at.id].type, d };`, { owner, name, lower, upper, dflt });
    }
    for (const [owner, ref, , , , lower, upper] of REFS) {
        await ev(page, `${pkgJs} const r = cls(a[0]).references.find((x) => x.name === a[1]); r.lowerBound = a[2]; r.upperBound = a[3]; return 1;`,
            [owner, ref, lower, upper], 250);
    }
    const bounds = await ev<string[]>(page, `const idl = w.store.getState().idlookup; const pkg = w.LProject.getProject().metamodels[0].packages[0];
        return pkg.classes.flatMap((c) => [...c.attributes, ...c.references].map((f) => c.name + '.' + f.name + ' ' + idl[f.id].lowerBound + '..' + idl[f.id].upperBound
            + ' : ' + (f.type?.name ?? '?') + (idl[f.id].composition ? ' contains' : '')));`);
    return { classes, attrs, bounds };
}

// ── The drone class level (chapter Fig. 6, as transcribed in the prompt) ───────────────────────────────────────────

type Vis = 'public' | 'private' | 'protected' | 'package';
interface EnumValue { enum: string; lit: string }
type AttrValue = string | number | boolean | EnumValue | string[];
const V = (lit: Vis): EnumValue => ({ enum: 'VisibilityKind', lit });
const AGG = (lit: string): EnumValue => ({ enum: 'AggregationKind', lit });

interface DynSpec { key: string; inv: string; ops?: Array<[string, string[]]>; monitors?: Array<[string, string[]]> }
interface VpSpec { key: string; overlapping: boolean; complete: boolean; classes: DynSpec[] }
interface StaticSpec {
    key: string; abstract?: boolean; singleton?: boolean; general?: string;
    attrs: Array<[string, string, [number, number]?]>; ops?: Array<[string, string[]]>; viewpoints?: VpSpec[];
}

/** The sensors in the order of `ownedSensors`: [class, singleton name of the chapter]. */
const SENSORS: Array<[string, string]> = [['TempSensor', 'Temp'], ['WindSensor', 'Wind'], ['RainSensor', 'Rain'], ['HumiditySensor', 'Humidity']];

/** A sensor read in one of the measured JjEL forms: the chapter's singleton name, or from `self` (a WAU) through ownedSensors. */
type SensorForm = 'chapter' | 'firstSingle' | 'firstDouble' | 'filterFirst' | 'index';
const FORMS: SensorForm[] = ['firstSingle', 'firstDouble', 'filterFirst', 'index', 'chapter'];
function sensorRead(form: SensorForm, sensorClass: string, attr: string): string {
    const [, single] = SENSORS.find((s) => s[0] === sensorClass)!;
    switch (form) {
        case 'chapter': return `${single}.${attr}`;
        case 'firstSingle': return `self.ownedSensors.first(s => s.classifier.name == '${sensorClass}').${attr}`;
        case 'firstDouble': return `self.ownedSensors.first(s => s.classifier.name == "${sensorClass}").${attr}`;
        case 'filterFirst': return `self.ownedSensors.filter(s => s.classifier.name == '${sensorClass}').first().${attr}`;
        case 'index': return `self.ownedSensors[${SENSORS.findIndex((s) => s[0] === sensorClass)}].${attr}`;
    }
}
function alertInvariants(form: SensorForm): Record<string, string> {
    const W = sensorRead(form, 'WindSensor', 'speed'); const T = sensorRead(form, 'TempSensor', 'value');
    const H = sensorRead(form, 'HumiditySensor', 'relative'); const R = sensorRead(form, 'RainSensor', 'intensity');
    return {
        Safe: `${W} <= 8 && ${T} >= 0 && ${T} <= 35 && ${H} <= 60 && ${R} == 0`,
        Moderate: `${W} > 8 && ${W} <= 12 && ${T} >= -5 && ${T} <= 35 && ${H} <= 80 && ${R} <= 2`,
        Adverse: `${W} > 12 && (${T} < -5 || ${T} > 35) && ${H} > 80 && ${R} > 2`,
    };
}

/** The chapter writes `&&` and `||`; JjEL spells them `and` and `or` (lexer: `!` is refused for `not`, measured on the
 *  first green-path run: «Unexpected character: &»). The probe measures both and stores the spelling that parses. */
type Connectives = 'chapter' | 'jjel';
const spell = (text: string, c: Connectives) => (c === 'chapter' ? text : text.replace(/&&/g, 'and').replace(/\|\|/g, 'or'));

/** Placeholder bodies (the chapter's bodies are not transcribed): they parse or not as `Action`, a measure. */
const sensorOps = (): Array<[string, string[]]> => [['injectFailure', ['self.status := SensorStatus.Fault']], ['reset', ['self.status := SensorStatus.OK']]];
function staticClasses(alertForm: SensorForm, c: Connectives): StaticSpec[] {
    const alert = Object.fromEntries(Object.entries(alertInvariants(alertForm)).map(([k, v]) => [k, spell(v, c)]));
    return [
        { key: 'Drone', attrs: [['distance', 'Integer'], ['speed', 'Integer'], ['power', 'Integer'], ['battery', 'Integer', [0, 100]], ['vmax', 'Integer']],
            viewpoints: [{ key: 'Mode', overlapping: true, complete: true, classes: [
                { key: 'Charging', inv: spell('self.distance == 0 && self.speed == 0 && self.battery < 100', c), monitors: [['charge', ['self.battery := self.battery + 1']]] },
                { key: 'Ready', inv: spell('self.distance == 0 && self.speed == 0 && self.battery == 100', c), ops: [['takeOff', ['self.speed := 1']]] },
                { key: 'Flying', inv: spell('self.battery > 0 && self.speed > 0', c),
                    ops: [['rampUp', ['self.speed := self.speed + 1', 'self.power := self.power + 1']], ['rampDown', ['self.speed := self.speed - 1', 'self.power := self.power - 1']]],
                    monitors: [['drain', ['self.battery := self.battery - 1', 'self.distance := self.distance + self.speed']]] },
                { key: 'Empty', inv: 'self.battery == 0' },
            ] }] },
        { key: 'WeatherAssessmentUnit', attrs: [],
            viewpoints: [{ key: 'Alert', overlapping: false, complete: true, classes: [
                { key: 'Safe', inv: alert.Safe }, { key: 'Moderate', inv: alert.Moderate }, { key: 'Adverse', inv: alert.Adverse },
            ] }] },
        { key: 'Sensor', abstract: true, attrs: [] },
        { key: 'TempSensor', singleton: true, general: 'Sensor', attrs: [['value', 'Integer'], ['unit', 'String'], ['status', 'SensorStatus']], ops: sensorOps() },
        { key: 'WindSensor', singleton: true, general: 'Sensor', attrs: [['speed', 'Integer'], ['unit', 'String'], ['status', 'SensorStatus']], ops: sensorOps() },
        { key: 'RainSensor', singleton: true, general: 'Sensor', attrs: [['intensity', 'Integer'], ['unit', 'String'], ['status', 'SensorStatus'], ['presence', 'Boolean']], ops: sensorOps() },
        { key: 'HumiditySensor', singleton: true, general: 'Sensor', attrs: [['relative', 'Integer', [0, 100]], ['unit', 'String'], ['status', 'SensorStatus']], ops: sensorOps() },
    ];
}
const PRIMITIVES = ['String', 'Integer', 'Boolean'];
const SENSOR_STATUS = { key: 'SensorStatus', literals: ['OK', 'Fault', 'Calibrating'] };
/** [association, [end name, type, lower, upper, aggregation] x 2]; the composite end is the one typed by the part (UML fixture). */
const ASSOCS: Array<[string, Array<[string, string, number, number, string]>]> = [
    ['DroneWAU', [['drone', 'Drone', 1, 1, 'none'], ['WAU', 'WeatherAssessmentUnit', 1, 1, 'composite']]],
    ['WAUSensors', [['wau', 'WeatherAssessmentUnit', 1, 1, 'none'], ['ownedSensors', 'Sensor', 0, -1, 'composite']]],
];
const DYNAMIC = ['Charging', 'Ready', 'Flying', 'Empty', 'Safe', 'Moderate', 'Adverse'];

interface ModelPlan {
    objects: Array<[string, string, string, number, number, null]>;
    containment: Array<[string, string, string]>;
    references: Array<[string, string, string]>;
    attrs: Array<[string, Array<[string, AttrValue]>]>;
}

function modelPlan(statics: StaticSpec[]): ModelPlan {
    const objects: ModelPlan['objects'] = [];
    const containment: ModelPlan['containment'] = [];
    const references: ModelPlan['references'] = [];
    const attrs: ModelPlan['attrs'] = [];
    let n = 0;
    const add = (key: string, cls: string, name: string) => { const i = n++; objects.push([key, cls, name, 60 + (i % 10) * 300, 60 + Math.floor(i / 10) * 220, null]); };
    const prop = (key: string, name: string, type: string, vis: Vis, lower: number, upper: number, agg: string, range?: [number, number]) => {
        add(key, 'Property', name);
        references.push([key, 'type', type]);
        attrs.push([key, [['visibility', V(vis)], ['aggregation', AGG(agg)], ['isDerived', false], ['lower', lower], ['upper', upper],
            ...(range ? [['rangeMin', range[0]], ['rangeMax', range[1]]] as Array<[string, AttrValue]> : [])]]);
    };
    const op = (owner: string, ref: string, key: string, name: string, body: string[]) => {
        add(key, 'Operation', name);
        containment.push([owner, ref, key]);
        attrs.push([key, [['visibility', V('public')], ['body', body]]]);
    };
    add('pkg', 'Package', 'DroneModel');
    const packaged: string[] = [];
    for (const p of PRIMITIVES) { add(p, 'PrimitiveType', p); attrs.push([p, [['isAbstract', false]]]); packaged.push(p); }
    add(SENSOR_STATUS.key, 'Enumeration', SENSOR_STATUS.key); attrs.push([SENSOR_STATUS.key, [['isAbstract', false]]]); packaged.push(SENSOR_STATUS.key);
    for (const l of SENSOR_STATUS.literals) {
        add(`lit_${l}`, 'EnumerationLiteral', l);
        containment.push([SENSOR_STATUS.key, 'ownedLiterals', `lit_${l}`]);
        references.push([`lit_${l}`, 'classifier', SENSOR_STATUS.key]);
    }
    for (const c of statics) {
        add(c.key, 'StaticClass', c.key); packaged.push(c.key);
        attrs.push([c.key, [['isAbstract', !!c.abstract], ['isSingleton', !!c.singleton]]]);
        for (const [a, type, range] of c.attrs) {
            prop(`p_${c.key}_${a}`, a, type, 'public', 1, 1, 'none', range);
            containment.push([c.key, 'ownedAttributes', `p_${c.key}_${a}`]);
        }
        for (const [o, body] of c.ops ?? []) op(c.key, 'ownedOperations', `op_${c.key}_${o}`, o, body);
        for (const vp of c.viewpoints ?? []) {
            add(vp.key, 'Viewpoint', vp.key);
            containment.push([c.key, 'viewpoints', vp.key]);
            attrs.push([vp.key, [['isOverlapping', vp.overlapping], ['isComplete', vp.complete]]]);
            for (const d of vp.classes) {
                add(d.key, 'DynamicClass', d.key);
                containment.push([vp.key, 'classes', d.key]);
                attrs.push([d.key, [['invariant', d.inv], ['isCreation', false]]]);
                for (const [o, body] of d.ops ?? []) op(d.key, 'operations', `op_${d.key}_${o}`, o, body);
                for (const [m, body] of d.monitors ?? []) {
                    add(`mon_${d.key}_${m}`, 'Monitor', m);
                    containment.push([d.key, 'monitors', `mon_${d.key}_${m}`]);
                    attrs.push([`mon_${d.key}_${m}`, [['body', body]]]);
                }
            }
        }
    }
    for (const c of statics.filter((x) => x.general)) {
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
    for (const p of packaged) containment.push(['pkg', 'packagedElements', p]);
    return { objects, containment, references, attrs };
}
const SINGLE_REFS = new Set(REFS.filter((r) => !r[4]).map((r) => r[1]));

type Ids = Record<string, { obj: string; vertex: string }>;

async function setReferences(page: Page, ids: Ids, refs: Array<[string, string, string]>) {
    for (const [owner, ref, target] of refs) {
        await ev(page, `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
            c2j.syncSetReferenceValue(a[0], a[1], a[2], a[3]); return 1;`, [ids[owner].vertex, ref, ids[target].obj, SINGLE_REFS.has(ref) ? 'replace' : 'append'], 250);
    }
}

/** Attribute values through the L-API, one object per call; an enumeration value is its literal's id, a list is the whole list. */
async function setAttrs(page: Page, ids: Ids, attrs: ModelPlan['attrs']) {
    const errs: string[] = [];
    for (const [key, vals] of attrs) {
        const r = await ev<string[]>(page, `const pkg = w.LProject.getProject().metamodels[0].packages[0]; const errs = [];
            const o = w.LPointerTargetable.fromPointer(a.obj);
            for (const [f, v] of a.vals) {
                try {
                    if (Array.isArray(v)) { o['$' + f].values = v; continue; }
                    const val = v && typeof v === 'object' ? pkg.enumerators.find((e) => e.name === v.enum).literals.find((l) => l.name === v.lit).id : v;
                    o['$' + f].values = [val];
                } catch (e) { errs.push(a.key + '.' + f + ': ' + (e && e.message || e)); }
            }
            return errs;`, { obj: ids[key].obj, key, vals }, 150);
        errs.push(...r);
    }
    return errs;
}

// ── Reads over the store ─────────────────────────────────────────────────────────────────────────────────────────

/** In the page: `idl`, `slot(o, featureName)` (the DValue of the feature, by name), and `view`, an OntoReadView over the
 *  raw idlookup (this branch has no store adapter: the R-OI one, instantiate.ts, lives on oi-s3b). */
const VIEW_JS = `const idl = w.store.getState().idlookup;
    const slot = (o, n) => { const d = idl[o]; for (const vid of (d && d.features) || []) { const v = idl[vid]; if (v && idl[v.instanceof] && idl[v.instanceof].name === n) return v; } return null; };
    const byId = (o, f) => { const d = idl[o]; for (const vid of (d && d.features) || []) { const v = idl[vid]; if (v && v.instanceof === f) return v; } return null; };
    const view = {
        metaclassOf: (o) => (idl[o] ? idl[o].instanceof : undefined),
        referenceTargets: (o, r) => { const v = byId(o, r); return v ? (v.values || []).filter((x) => typeof x === 'string' && x !== '') : []; },
        attributeValue: (o, at) => { const v = byId(o, at); return v ? (v.values || [])[0] : undefined; },
        ownerOf: (f) => (idl[f] ? idl[f].father : undefined),
        conformsTo: (c, s) => { const seen = new Set(); const st = [c]; while (st.length) { const x = st.pop(); if (x === s) return true;
            if (!x || seen.has(x)) continue; seen.add(x); st.push(...((idl[x] && idl[x].extends) || [])); } return false; },
    };`;

/** The M2 ids of the metamodel's features and classes, by `Class.feature` and `Class`. */
async function m2Ids(page: Page, mmId: string) {
    return ev<{ cls: Record<string, string>; f: Record<string, string> }>(page, `const idl = w.store.getState().idlookup;
        const sk = (await import('/src/components/editor-v2/sim/metamodelSketch.ts')).sketchOfMetamodel(idl, a);
        const cls = {}; for (const c of sk.classes) cls[c.name] = c.id;
        const f = {}; for (const x of [...sk.attributes, ...sk.references]) f[idl[x.owner].name + '.' + x.name] = x.id;
        return { cls, f };`, mmId, 0);
}

async function parseAll(page: Page, exprs: Record<string, string>, actions: Record<string, string>) {
    return ev<Record<string, { ok: boolean; err: string | null }>>(page, `const p = await import('/src/jjel/parser/parser.ts'); const out = {};
        const fmt = (e) => (e && e[0] ? e[0].line + ':' + e[0].column + ' ' + e[0].message : null);
        for (const [k, t] of Object.entries(a.exprs)) { const r = p.parseExpressionStrict(t); out['expr ' + k] = { ok: r.expression !== null && r.errors.length === 0, err: fmt(r.errors) }; }
        for (const [k, t] of Object.entries(a.actions)) { const r = p.parseAction(t); out['action ' + k] = { ok: r.action !== null && r.errors.length === 0, err: fmt(r.errors) }; }
        return out;`, { exprs, actions }, 0);
}

// ── The scene ────────────────────────────────────────────────────────────────────────────────────────────────────

const browser = await chromium.launch();
const out: Record<string, unknown> = { url: URL, at: new Date().toISOString() };
try {
    const { page, errors } = await openPage(browser);
    // smoke/states.ts \`seed\` sets the 3 and 3.1 welcome keys; the modal now reads the 3.1.1 one, and its backdrop
    // swallows the dashboard's clicks (measured on the first run of this probe).
    await page.context().addInitScript(() => { localStorage.setItem('jjodel_welcome_3_1_1_seen', '1'); });
    const pid = await createProject(page, PROJECT);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(4000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});

    // (1) The metamodel, Expression and Action as attribute types.
    const mm = await buildDcnMetamodel(page);
    out.metamodel = mm;
    meas('metamodel', mm.bounds.filter((b) => DCN_CLASSES.some(([c]) => b.startsWith(c + '.')) || /^(Operation\.(pre|body|redefines)|Property\.range)/.test(b)));
    const coreTyped = Object.fromEntries(Object.entries(mm.attrs).filter(([k]) => DCN_ATTRS.some(([o, n, t]) => `${o}.${n}` === k && (t === 'Expression' || t === 'Action'))));
    meas('Expression and Action attribute types through the L-API', coreTyped);
    check('M-1 every Expression / Action attribute holds its core type pointer',
        Object.entries(coreTyped).every(([k, v]) => (v as { typeId: string }).typeId === TYPE_PTR[DCN_ATTRS.find(([o, n]) => `${o}.${n}` === k)![2]]), coreTyped);
    meas('DCN defaults', Object.fromEntries(Object.entries(mm.attrs).filter(([k]) => /isSingleton|isOverlapping|isComplete|isCreation/.test(k))));

    // (3) The parse forms of the Alert invariants: the first form whose three invariants parse is the one stored.
    const formExprs: Record<string, string> = {
        'connectives &&': 'self.distance == 0 && self.speed == 0', 'connectives and': 'self.distance == 0 and self.speed == 0',
        'connectives ||': '(self.speed < -5 || self.speed > 35)', 'connectives or': '(self.speed < -5 or self.speed > 35)',
    };
    for (const f of FORMS) for (const [dc, inv] of Object.entries(alertInvariants(f))) {
        formExprs[`${f}:${dc}`] = inv; formExprs[`${f}:${dc}:jjel`] = spell(inv, 'jjel');
    }
    for (const f of FORMS) formExprs[`${f}:atom`] = `${sensorRead(f, 'WindSensor', 'speed')} <= 8`;
    formExprs['exists:atom'] = 'exists s in self.ownedSensors such that s.speed <= 8';
    formExprs['any:atom'] = 'self.ownedSensors.any(s => s.speed <= 8)';
    const actionForms: Record<string, string> = {
        'dot assign': 'self.battery := self.battery + 1', 'bracket assign (R-SIM-18)': 'self.[battery] := self.[battery] + 1',
        'enum literal by name': 'self.status := SensorStatus.Fault', 'enum literal as string': "self.status := 'Fault'",
    };
    const parsedForms = await parseAll(page, formExprs, actionForms);
    meas('Alert invariant forms', parsedForms);
    const connectives: Connectives = parsedForms['expr connectives &&']?.ok && parsedForms['expr connectives ||']?.ok ? 'chapter' : 'jjel';
    const sfx = connectives === 'chapter' ? '' : ':jjel';
    const alertForm = FORMS.find((f) => ['Safe', 'Moderate', 'Adverse'].every((dc) => parsedForms[`expr ${f}:${dc}${sfx}`]?.ok)) ?? 'chapter';
    meas('Alert form stored', { connectives, alertForm, invariants: Object.values(alertInvariants(alertForm)).map((t) => spell(t, connectives)) });
    out.parseForms = { parsedForms, connectives, alertForm };

    // The model, in the root form of the UML fixture.
    const statics = staticClasses(alertForm, connectives);
    const shell = await buildModelShell(page);
    if (!shell.graphId) throw new Error(`no v2-flow graph: ${JSON.stringify(shell)}`);
    await ev(page, `w.LProject.getProject().models[0].name = 'drone'; return 1;`);
    const plan = modelPlan(statics);
    const ids = await buildObjects(page, shell.graphId, plan.objects);
    check('every object of the plan was created with its vertex', Object.keys(ids).length === plan.objects.length,
        { planned: plan.objects.length, made: Object.keys(ids).length, missing: plan.objects.map((o) => o[0]).filter((k) => !ids[k]) });
    await buildLinks(page, ids, plan.containment, []);
    await setReferences(page, ids, plan.references);
    const unnamed = await ev<string[]>(page, `const skipped = [];
        for (const [key, obj, n] of a) { const o = w.LPointerTargetable.fromPointer(obj); if (o.$name) o.$name.values = [n]; else skipped.push(key); }
        return skipped;`, plan.objects.filter((o) => ids[o[0]]).map((o) => [o[0], ids[o[0]].obj, o[2]]), 0);
    meas('objects without a name slot', unnamed);
    const attrErrors = await setAttrs(page, ids, plan.attrs);
    check('every attribute value was written', attrErrors.length === 0, attrErrors);
    out.ids = ids;
    await page.waitForTimeout(SETTLE_MS);

    // Every containment and reference of the plan, read back on the raw slots (by feature name).
    const landed = await ev<string[]>(page, `${VIEW_JS} const bad = [];
        for (const [o, f, t, k] of a) { const v = slot(o, f); if (!v || !(v.values || []).includes(t)) bad.push(k); }
        return bad;`, [...plan.containment, ...plan.references].map(([o, f, t]) => [ids[o].obj, f, ids[t].obj, `${o}.${f}->${t}`]), 0);
    check('every containment and reference of the plan is on its slot', landed.length === 0, landed);

    // A multivalued Action attribute keeps its order; Expression values read back as written.
    const readBack = await ev<Record<string, unknown>>(page, `${VIEW_JS} const out = {};
        for (const [k, o, f] of a) { const v = slot(o, f); out[k] = v ? (v.values || []) : null; }
        return out;`, [
        ['Flying.rampUp.body', ids['op_Flying_rampUp'].obj, 'body'], ['Flying.drain.body', ids['mon_Flying_drain'].obj, 'body'],
        ['Charging.invariant', ids['Charging'].obj, 'invariant'], ['Safe.invariant', ids['Safe'].obj, 'invariant'],
        ['Drone.battery.rangeMin', ids['p_Drone_battery'].obj, 'rangeMin'], ['Drone.battery.rangeMax', ids['p_Drone_battery'].obj, 'rangeMax'],
    ], 0);
    meas('read back', readBack);
    const flying = statics[0].viewpoints![0].classes[2];
    check('M-2 a multivalued Action attribute keeps its order (rampUp, drain)',
        JSON.stringify(readBack['Flying.rampUp.body']) === JSON.stringify(flying.ops![0][1]) && JSON.stringify(readBack['Flying.drain.body']) === JSON.stringify(flying.monitors![0][1]),
        { rampUp: readBack['Flying.rampUp.body'], drain: readBack['Flying.drain.body'] });

    // Every stored invariant and body: does it parse.
    const storedExprs: Record<string, string> = {}; const storedActions: Record<string, string> = {};
    for (const c of statics) {
        for (const [o, body] of c.ops ?? []) body.forEach((b, i) => { storedActions[`${c.key}.${o}[${i}]`] = b; });
        for (const vp of c.viewpoints ?? []) for (const d of vp.classes) {
            storedExprs[`${d.key}.invariant`] = d.inv;
            for (const [o, body] of [...(d.ops ?? []), ...(d.monitors ?? [])]) body.forEach((b, i) => { storedActions[`${d.key}.${o}[${i}]`] = b; });
        }
    }
    const parsedStored = await parseAll(page, storedExprs, storedActions);
    meas('stored invariants and bodies: parse', parsedStored);
    check('M-3 the seven invariants parse as Expression', Object.keys(storedExprs).every((k) => parsedStored[`expr ${k}`]?.ok),
        Object.fromEntries(Object.entries(parsedStored).filter(([k, v]) => k.startsWith('expr ') && !v.ok)));
    out.parseStored = parsedStored;

    // (2) The binding: object (with featureSources) and link, M2 ids, through mm.state.
    const mmId = await ev<string>(page, `return w.store.getState().idlookup[a].instanceof;`, shell.modelId, 0);
    const m2 = await m2Ids(page, mmId);
    const F = (k: string) => { if (!m2.f[k]) throw new Error(`no M2 feature ${k}`); return m2.f[k]; };
    const C = (k: string) => { if (!m2.cls[k]) throw new Error(`no M2 class ${k}`); return m2.cls[k]; };
    const shared = { typeReference: F('InstanceSpecification.classifier'), slotContainer: F('InstanceSpecification.slots'),
        definingFeature: F('Slot.definingFeature'), valueHolder: F('Slot.values') };
    const objectRecord = { name: 'object', ...shared, featureContainer: F('Class.ownedAttributes'),
        generalization: { via: F('Classifier.generalizations'), general: F('Generalization.general') },
        abstractFlag: F('Classifier.isAbstract'), featureType: F('TypedElement.type'), defaultValue: F('Property.defaultValue'),
        valueKinds: [
            { when: 'primitive:Boolean', create: C('LiteralBoolean'), field: F('LiteralBoolean.value') },
            { when: 'primitive:String', create: C('LiteralString'), field: F('LiteralString.value') },
            { when: 'primitive:Integer', create: C('LiteralInteger'), field: F('LiteralInteger.value') },
            { when: 'instance', create: C('InstanceValue'), field: F('InstanceValue.instance') },
        ],
        featureSources: [{ path: [F('StaticClass.viewpoints'), F('Viewpoint.classes'), F('DynamicClass.attributes')] }] };
    const linkRecord = { name: 'link', ...shared, featureContainer: F('Association.memberEnds') };
    const binding = await ev<{ raw: string | null; decoded: { ok: boolean; errors?: string[] }; defects: unknown[] }>(page, `
        const codec = await import('/src/model/ontological/bindingCodec.ts');
        const bc = await import('/src/model/ontological/bindingCheck.ts');
        const ms = await import('/src/components/editor-v2/sim/metamodelSketch.ts');
        w.LPointerTargetable.fromPointer(a.mm).state = { [codec.ONTO_BINDINGS_KEY]: codec.encodeOntoBindings({ v: 1, bindings: a.records }) };
        await new Promise((r) => setTimeout(r, 600));
        const idl = w.store.getState().idlookup; const s = idl[a.mm]._state; const raw = s ? s[codec.ONTO_BINDINGS_KEY] ?? null : null;
        const decoded = codec.decodeOntoBindings(raw);
        const defects = decoded.ok ? bc.checkBindings(decoded.value.bindings, ms.sketchOfMetamodel(idl, a.mm)).defects : [];
        return { raw, decoded: { ok: decoded.ok, errors: decoded.ok ? undefined : decoded.errors }, defects };`,
        { mm: mmId, records: [objectRecord] }, 400);
    out.binding = { objectRecord, linkRecord, ...binding };
    check('B-1 the record object, with featureSources, is in the metamodel bag and decodes', !!binding.raw && binding.decoded.ok, binding.decoded);
    check('B-2 checkBindings on the object record: zero defects', binding.decoded.ok && binding.defects.length === 0, binding.defects);
    // The link record of onto-s2-instantiate binds three of the four slot roles (no valueKinds): judged, not stored.
    const linkDefects = await ev<unknown[]>(page, `const bc = await import('/src/model/ontological/bindingCheck.ts');
        const ms = await import('/src/components/editor-v2/sim/metamodelSketch.ts');
        return bc.checkBindings([a.link], ms.sketchOfMetamodel(w.store.getState().idlookup, a.mm)).defects;`, { mm: mmId, link: linkRecord }, 0);
    meas('checkBindings on the onto-s2 link record (not stored)', linkDefects);
    out.linkDefects = linkDefects;

    // Model objects (roots, then contained), names by id.
    const census = await ev<{ objects: string[]; names: Record<string, string>; meta: Record<string, string> }>(page, `${VIEW_JS}
        const objects = []; const seen = new Set(); const q = [...(idl[a].objects || [])];
        while (q.length) { const id = q.shift(); const o = idl[id]; if (seen.has(id) || !o || o.className !== 'DObject') continue; seen.add(id); objects.push(id);
            for (const vid of o.features || []) for (const c of (idl[vid] && idl[vid].values) || []) if (typeof c === 'string' && idl[c] && idl[c].className === 'DObject') q.push(c); }
        const names = {}; const meta = {}; for (const id of objects) { names[id] = idl[id].name; meta[id] = idl[idl[id].instanceof] && idl[idl[id].instanceof].name; }
        for (const id of Object.keys(idl)) if (idl[id] && (idl[id].className === 'DAttribute' || idl[id].className === 'DReference' || idl[id].className === 'DClass')) names[id] = idl[id].name;
        return { objects, names, meta };`, shell.modelId, 0);
    const nameOf = (id: string) => census.names[id] ?? id;
    check('the census reaches every object of the plan', Object.values(ids).every((x) => census.objects.includes(x.obj)), { census: census.objects.length, planned: plan.objects.length });

    const reader = (body: string, arg: unknown) => ev<any>(page, `${VIEW_JS} const br = await import('/src/model/ontological/bindingReader.ts');
        const codec = await import('/src/model/ontological/bindingCodec.ts');
        const b = codec.decodeOntoBindings(idl[a.mm]._state[codec.ONTO_BINDINGS_KEY]).value.bindings.find((x) => x.name === 'object');
        ${body}`, { mm: mmId, ...(arg as object) }, 0);

    // instantiableClassifiers: the static classes, never a DynamicClass (R-DCN-10); Sensor is abstract.
    const inst = (await reader(`return br.instantiableClassifiers(view, b, a.objects);`, { objects: census.objects }) as string[]).map(nameOf);
    meas('instantiableClassifiers', inst);
    const expectedInst = ['Drone', 'WeatherAssessmentUnit', 'TempSensor', 'WindSensor', 'RainSensor', 'HumiditySensor'];
    check('B-3 instantiableClassifiers offers the six concrete static classes, no DynamicClass, not the abstract Sensor',
        JSON.stringify([...inst].sort()) === JSON.stringify([...expectedInst].sort()) && !inst.some((n) => DYNAMIC.includes(n)), { inst, expectedInst });

    // (4) featureClosure at class level, as transcribed.
    const closureOf = async (key: string) => {
        const r = await reader(`return br.featureClosure(view, b, a.c);`, { c: ids[key].obj }) as { features: string[]; cycles: string[][]; dormantOwner?: Record<string, string> };
        return { features: r.features.map(nameOf), cycles: r.cycles, dormantOwner: Object.fromEntries(Object.entries(r.dormantOwner ?? {}).map(([f, o]) => [nameOf(f), nameOf(o)])) };
    };
    const closures: Record<string, unknown> = {};
    for (const k of ['Drone', 'WeatherAssessmentUnit', 'TempSensor', 'HumiditySensor']) closures[k] = await closureOf(k);
    meas('featureClosure as transcribed', closures);
    const droneOwn = ['distance', 'speed', 'power', 'battery', 'vmax'];
    const cDrone = closures.Drone as { features: string[]; dormantOwner: Record<string, string> };
    check('C-1 featureClosure(Drone) as transcribed: the five own features, in order, and no dormant one (the Mode classes own no attribute)',
        JSON.stringify(cDrone.features) === JSON.stringify(droneOwn) && Object.keys(cDrone.dormantOwner).length === 0, cDrone);
    const cWau = closures.WeatherAssessmentUnit as { features: string[]; dormantOwner: Record<string, string> };
    check('C-2 featureClosure(WeatherAssessmentUnit) as transcribed: empty (no own attribute, the Alert classes own none)',
        cWau.features.length === 0 && Object.keys(cWau.dormantOwner).length === 0, cWau);
    out.closures = closures;

    // The conformance validator on the class-level model: every problem, a finding.
    const conformance = await ev<{ status: string; n: number; violations: Array<{ objectName: string; violationType: string; severity: string; message: string; meta: string | null }> }>(page, `
        const cv = await import('/src/model/conformance/ConformanceValidator.ts'); const idl = w.store.getState().idlookup;
        const p = w.LProject.getProject(); const m = p.models.find((x) => x.id === a.model); const mm = p.metamodels.find((x) => x.id === a.mm);
        const r = cv.validateConformance(m, mm);
        return { status: r.status, n: r.violations.length, violations: r.violations.map((v) => ({ objectName: v.objectName, violationType: v.violationType, severity: v.severity,
            message: v.message, meta: v.objectId && idl[v.objectId] && idl[idl[v.objectId].instanceof] ? idl[idl[v.objectId].instanceof].name : null })) };`,
        { model: shell.modelId, mm: mmId }, 0);
    out.conformance = conformance;
    meas('conformance status', { status: conformance.status, violations: conformance.n });
    for (const v of conformance.violations) meas('conformance problem', v);
    const dcnMeta = new Set(['StaticClass', 'Viewpoint', 'DynamicClass', 'Monitor', 'Operation', 'Property']);
    meas('conformance problems on DCN elements', conformance.violations.filter((v) => v.meta && dcnMeta.has(v.meta)).length);
    check('V-1 the conformance validator ran on the class-level model', typeof conformance.status === 'string', { status: conformance.status });

    await setTheme(page, 'light');
    await page.waitForTimeout(SETTLE_MS);
    await shoot(page, 'dcn-drone-class-level-light.png', true, 2);

    // Export, before the seeded attributes.
    await saveScene(page, EXPORT_FILE);
    const file = process.env.GV_SAVE ? `${process.env.GV_SAVE.replace(/\/$/, '')}/${EXPORT_FILE}` : null;
    check('EX-1 the project is exported before the seeded attributes', !!file && existsSync(file), { file });

    // Seeded: one Integer attribute per dynamic class, to measure the order of the closure and dormantOwner.
    const seeds: ModelPlan['objects'] = DYNAMIC.map((d, i) => [`seed_${d}`, 'Property', `seed_${d}`, 60 + i * 300, 2400, null]);
    const seedIds = await buildObjects(page, shell.graphId, seeds);
    Object.assign(ids, seedIds);
    await buildLinks(page, ids, DYNAMIC.map((d) => [d, 'attributes', `seed_${d}`]), []);
    await setReferences(page, ids, DYNAMIC.map((d) => [`seed_${d}`, 'type', 'Integer']));
    await ev(page, `for (const [obj, n] of a) { const o = w.LPointerTargetable.fromPointer(obj); if (o.$name) o.$name.values = [n]; } return 1;`,
        DYNAMIC.map((d) => [seedIds[`seed_${d}`]?.obj, `seed_${d}`]), 0);
    await setAttrs(page, ids, DYNAMIC.map((d) => [`seed_${d}`, [['visibility', V('public')], ['aggregation', AGG('none')], ['isDerived', false], ['lower', 1], ['upper', 1]]]));
    await page.waitForTimeout(SETTLE_MS);
    for (const n of Object.values(seedIds)) census.names[n.obj] = Object.keys(seedIds).find((k) => seedIds[k].obj === n.obj)!;
    const seeded: Record<string, unknown> = {};
    for (const k of ['Drone', 'WeatherAssessmentUnit', 'TempSensor']) seeded[k] = await closureOf(k);
    meas('featureClosure seeded', seeded);
    out.closuresSeeded = seeded;
    const sDrone = seeded.Drone as { features: string[]; dormantOwner: Record<string, string> };
    const modeSeeds = ['Charging', 'Ready', 'Flying', 'Empty'];
    check('C-3 seeded featureClosure(Drone): the five own features, then one per Mode class in viewpoint order, dormantOwner naming each class',
        JSON.stringify(sDrone.features) === JSON.stringify([...droneOwn, ...modeSeeds.map((d) => `seed_${d}`)])
        && modeSeeds.every((d) => sDrone.dormantOwner[`seed_${d}`] === d) && Object.keys(sDrone.dormantOwner).length === 4, sDrone);
    const sWau = seeded.WeatherAssessmentUnit as { features: string[]; dormantOwner: Record<string, string> };
    const alertSeeds = ['Safe', 'Moderate', 'Adverse'];
    check('C-4 seeded featureClosure(WeatherAssessmentUnit): one per Alert class in viewpoint order, dormantOwner naming each class',
        JSON.stringify(sWau.features) === JSON.stringify(alertSeeds.map((d) => `seed_${d}`)) && alertSeeds.every((d) => sWau.dormantOwner[`seed_${d}`] === d), sWau);
    const sTemp = seeded.TempSensor as { features: string[]; dormantOwner: Record<string, string> };
    check('C-5 seeded featureClosure(TempSensor): its own three features, no dormant one (neither it nor Sensor has a viewpoint)',
        JSON.stringify(sTemp.features) === JSON.stringify(['value', 'unit', 'status']) && Object.keys(sTemp.dormantOwner).length === 0, sTemp);

    out.errors = errors.slice(0, 20);
    meas('page errors', errors.slice(0, 5));
    await page.context().close();
} finally {
    out.checks = { pass, fail };
    writeFileSync(`${OUT}/dcn-drone.json`, JSON.stringify(out, null, 2));
    meas('json', `${OUT}/dcn-drone.json`);
    await browser.close();
}
console.log(`DONE pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
