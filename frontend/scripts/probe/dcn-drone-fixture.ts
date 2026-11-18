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
 * Left out, as the prompt says: `PhysicalQuantity` and `Context`.
 * L2.5 (P-2026-11-08-0011, R-DCN-24): the navigable ends `ownedSensors` and `WAU` are owned by their classes
 * (`Class.ownedAttributes` with `Property.association`), `Charging` owns `chargeRate : Integer [0..10] = 1`, and the
 * metamodel's bag binds the dcn roles under the «Dynamic classification» profile as the roles dialog's Apply writes
 * them. The object level is made through the R-OI surfaces: `instantiate` (S2 synthesis) for `dji : Drone`, `wau1`
 * and one instance per concrete sensor class, the values and the links as InstanceValues in the slots S2 made
 * (`createInstance`, the host's create primitive, as S2 writes a default), then «Sync slots» (`syncSlots`) on each.
 *
 * Measures (MEAS) and checks (PASS/FAIL):
 *   - whether `Expression` and `Action` are accepted as attribute types through the L-API, and whether a multivalued
 *     `Action` attribute keeps its order;
 *   - whether `&&` / `||` or `and` / `or` parse (the stored invariants take the one that does), which JjEL form of the
 *     Alert invariants parses (by singleton name, as in the chapter, or from `self` through
 *     `ownedSensors`), and whether the placeholder actions parse (a measure, not a gate: L3.4 owns slot writes);
 *   - `checkBindings` on the records (zero defects), `instantiableClassifiers` (static classes, never a DynamicClass);
 *   - `featureClosure` of Drone and WeatherAssessmentUnit: own features (the class-owned end among them), then those
 *     of the viewpoint classes, with `dormantOwner` (`chargeRate` of Charging); after the exports, one seeded
 *     Integer attribute per dynamic class (`seed_<Class>`) measures the order and the owners;
 *   - the conformance validator on the class-level model, every problem listed (a finding, not a fix);
 *   - the `dcn` checks on the class level (zero expected), computed and read from the registry;
 *   - object level (L2.5): the slots S2 synthesized for `dji`, `chargeRate` among them with its default; zero
 *     `instantiation` findings on every instance, computed and in the registry, after «Sync slots» too; the
 *     conformance problems left on the whole model, listed. One screenshot of the object diagram (light theme).
 *   - R-DCN-29 (P-2026-11-08-1939): the object level is drawn in the `UML object diagram` viewpoint (the views copied
 *     from uml-class-object-fixture, the DCN metaclasses hidden too), active in the export: the six instances with
 *     their slots as rows and no other node, counted on the built project and on the export imported in a new page;
 *   - the containment writes the build lost and re-applied (one MEAS line each, L-1 counts them and never fails);
 *   - R-DCN-28 (P-2026-11-09-0237): three coherence constraints on Drone, their nine roles in the bag, read back through
 *     dcnCoherenceFromRoles (kinds, texts, k, no defect), and the dcn and conformance checks clean with them in the model.
 * With GV_SAVE set the project is exported, before the seeded attributes, as dcn-drone.jjodel (class level) and,
 * after the object level, as dcn-drone-objects.jjodel.
 *
 * Run:  GV_SAVE=~/jjodel-demo-exports/dcn node frontend/scripts/lane-run.mjs probe ~/jjodel-w-dcn-l25 \
 *         frontend/scripts/probe/dcn-drone-fixture.ts --port 3086 --id P-2026-11-08-0011
 * Env:  DCN_OUT   output directory of screenshots and measures (default docs/discovery/assets/dcn-drone)
 *       DCN_CROPS directory of the object-diagram screenshot (default ~/.jjodel-lanes/P-2026-11-08-0011/crops)
 *       GV_SAVE   opt-in: the directory the project is exported to (bpmn-lanes-fixture `saveScene`)
 */
import { chromium, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { setTheme, SETTLE_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3086/').replace(/\/$/, '');
if (/:300[01]$/.test(URL)) throw new Error('never 3000 or 3001');
const OUT = (process.env.DCN_OUT || new globalThis.URL('../../../docs/discovery/assets/dcn-drone/', import.meta.url).pathname).replace(/\/$/, '');
mkdirSync(OUT, { recursive: true });
const CROPS = (process.env.DCN_CROPS || `${homedir()}/.jjodel-lanes/P-2026-11-08-0011/crops`).replace(/\/$/, '');
// The BPMN fixture's `shoot` writes into its GV_OUT: set before it is loaded, so the screenshots land here.
process.env.GV_OUT = OUT;
const { buildLinks, buildMetamodel, buildModelShell, buildObjects, buildViewpoint, createProject, ev, openPage, pickViewpoint, saveScene, shoot } = await import('./bpmn-lanes-fixture.ts');

const PROJECT = 'DCN drone';
const EXPORT_FILE = 'dcn-drone.jjodel';
const EXPORT_OBJECTS_FILE = 'dcn-drone-objects.jjodel';

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

/** [attribute, type, range, default (Property.defaultValue, a text)]. */
type DynAttr = [string, string, [number, number]?, string?];
interface DynSpec { key: string; inv: string; attrs?: DynAttr[]; ops?: Array<[string, string[]]>; monitors?: Array<[string, string[]]> }
interface VpSpec { key: string; overlapping: boolean; complete: boolean; classes: DynSpec[] }
interface StaticSpec {
    key: string; abstract?: boolean; singleton?: boolean; general?: string;
    attrs: DynAttr[]; ops?: Array<[string, string[]]>; viewpoints?: VpSpec[];
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
        { key: 'Drone', attrs: [['distance', 'Integer'], ['speed', 'Integer'], ['power', 'Integer', undefined, '0'], ['battery', 'Integer', [0, 100]], ['vmax', 'Integer']],
            viewpoints: [{ key: 'Mode', overlapping: true, complete: true, classes: [
                // L2.5: an attribute of its own, so the drone has a real dormant slot (R-DCN-3).
                { key: 'Charging', inv: spell('self.distance == 0 && self.speed == 0 && self.battery < 100', c), attrs: [['chargeRate', 'Integer', [0, 10], '1']],
                    monitors: [['charge', ['self.battery := self.battery + 1']]] },
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
        { key: 'TempSensor', singleton: true, general: 'Sensor', attrs: [['value', 'Integer'], ['unit', 'String', undefined, '°C'], ['status', 'SensorStatus', undefined, 'OK']], ops: sensorOps() },
        { key: 'WindSensor', singleton: true, general: 'Sensor', attrs: [['speed', 'Integer'], ['unit', 'String', undefined, 'm/s'], ['status', 'SensorStatus', undefined, 'OK']], ops: sensorOps() },
        { key: 'RainSensor', singleton: true, general: 'Sensor', attrs: [['intensity', 'Integer'], ['unit', 'String', undefined, 'mm/h'], ['status', 'SensorStatus', undefined, 'OK'], ['presence', 'Boolean', undefined, 'false']], ops: sensorOps() },
        { key: 'HumiditySensor', singleton: true, general: 'Sensor', attrs: [['relative', 'Integer', [0, 100]], ['unit', 'String', undefined, '%'], ['status', 'SensorStatus', undefined, 'OK']], ops: sensorOps() },
    ];
}
const PRIMITIVES = ['String', 'Integer', 'Boolean'];
const SENSOR_STATUS = { key: 'SensorStatus', literals: ['OK', 'Fault', 'Calibrating'] };
/** [association, [end name, type, lower, upper, aggregation, owner] x 2]; the composite end is the one typed by the part
 *  (UML fixture). R-DCN-24: a navigable end is owned by the class at the other end (`Class.ownedAttributes`, with
 *  `Property.association`); the other end stays in `Association.ownedEnds`. Both are member ends. */
type EndOwner = 'class' | 'association';
const ASSOCS: Array<[string, Array<[string, string, number, number, string, EndOwner]>]> = [
    ['DroneWAU', [['drone', 'Drone', 1, 1, 'none', 'association'], ['WAU', 'WeatherAssessmentUnit', 1, 1, 'composite', 'class']]],
    ['WAUSensors', [['wau', 'WeatherAssessmentUnit', 1, 1, 'none', 'association'], ['ownedSensors', 'Sensor', 0, -1, 'composite', 'class']]],
];
const DYNAMIC = ['Charging', 'Ready', 'Flying', 'Empty', 'Safe', 'Moderate', 'Adverse'];

/** A coherence constraint of the class level (R-DCN-28), context Drone: φ, or a pattern it contains. */
interface CoherenceSpec {
    key: string;
    pointwise?: string;
    pattern?: { cls: 'BoundedPersistence'; condition: string; k: number } | { cls: 'BoundedResponse'; trigger: string; response: string; k: number };
}
const coherenceConstraints = (c: Connectives): CoherenceSpec[] => [
    { key: 'speedLimit', pointwise: spell('self.speed <= self.vmax', c) },
    { key: 'lowBatteryPersistence', pattern: { cls: 'BoundedPersistence', condition: spell('self.battery < 20', c), k: 10 } },
    { key: 'lowBatteryResponse', pattern: { cls: 'BoundedResponse', trigger: spell('self.battery < 20', c), response: spell('self.speed == 0', c), k: 15 } },
];

interface ModelPlan {
    objects: Array<[string, string, string, number, number, null]>;
    containment: Array<[string, string, string]>;
    references: Array<[string, string, string]>;
    attrs: Array<[string, Array<[string, AttrValue]>]>;
}

function modelPlan(statics: StaticSpec[], coherence: CoherenceSpec[]): ModelPlan {
    const objects: ModelPlan['objects'] = [];
    const containment: ModelPlan['containment'] = [];
    const references: ModelPlan['references'] = [];
    const attrs: ModelPlan['attrs'] = [];
    let n = 0;
    const add = (key: string, cls: string, name: string) => { const i = n++; objects.push([key, cls, name, 60 + (i % 10) * 300, 60 + Math.floor(i / 10) * 220, null]); };
    const prop = (key: string, name: string, type: string, vis: Vis, lower: number, upper: number, agg: string, range?: [number, number], dflt?: string) => {
        add(key, 'Property', name);
        references.push([key, 'type', type]);
        attrs.push([key, [['visibility', V(vis)], ['aggregation', AGG(agg)], ['isDerived', false], ['lower', lower], ['upper', upper],
            ...(range ? [['rangeMin', range[0]], ['rangeMax', range[1]]] as Array<[string, AttrValue]> : []),
            ...(dflt !== undefined ? [['defaultValue', dflt]] as Array<[string, AttrValue]> : [])]]);
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
        for (const [a, type, range, dflt] of c.attrs) {
            prop(`p_${c.key}_${a}`, a, type, 'public', 1, 1, 'none', range, dflt);
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
                for (const [a, type, range, dflt] of d.attrs ?? []) {
                    prop(`p_${d.key}_${a}`, a, type, 'public', 1, 1, 'none', range, dflt);
                    containment.push([d.key, 'attributes', `p_${d.key}_${a}`]);
                }
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
        for (const [en, type, lower, upper, agg, owner] of ends) {
            const ek = `end_${a}_${en}`;
            prop(ek, en, type, 'public', lower, upper, agg);
            // The class at the other end owns a class-owned end (R-DCN-24).
            const other = ends.find((e) => e[0] !== en)![1];
            containment.push(owner === 'class' ? [other, 'ownedAttributes', ek] : [a, 'ownedEnds', ek]);
            references.push([ek, 'association', a], [a, 'memberEnds', ek]);
        }
    }
    for (const p of packaged) containment.push(['pkg', 'packagedElements', p]);
    for (const cc of coherence) {
        add(cc.key, 'CoherenceConstraint', cc.key);
        references.push([cc.key, 'context', 'Drone']);
        if (cc.pointwise !== undefined) attrs.push([cc.key, [['pointwise', cc.pointwise]]]);
        if (cc.pattern) {
            const { cls, ...vals } = cc.pattern;
            add(`pat_${cc.key}`, cls, `pat_${cc.key}`);
            containment.push([cc.key, 'pattern', `pat_${cc.key}`]);
            attrs.push([`pat_${cc.key}`, Object.entries(vals) as Array<[string, AttrValue]>]);
        }
    }
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

/** The registry entries of `kind` owned by the model, and those not resolved (`window._jjNodeProblems`, the id map). */
const REGISTRY_JS = `const reg = await import('/src/components/editor-v2/problems/registry.ts');
    const owned = (kind, model) => { const ids = reg.getProblemIdsOwnedBy(kind, model); const g = w._jjNodeProblems;
        const readable = !!(g && typeof g.get === 'function');
        const active = ids.filter((id) => { const p = readable ? g.get(id) : null; return !p || p.resolvedAt === undefined; })
            .map((id) => { const p = readable ? g.get(id) : null; return p ? { id, severity: p.severity, title: p.title, description: p.description } : { id }; });
        return { owned: ids.length, readable, active }; };`;

/** The canvas of the active tab (bpmn-lanes-fixture `ACTIVE`). */
const ACTIVE_PANE = '.dock-tabpane-active .react-flow';

/**
 * The object level on a grid of its own below the class level: one column per instance (at its own top when given), its slots under it, the values
 * of each slot to its right, past the slot's chips. S2 places the instance (`placeAt`) and leaves its slots and values where the create put
 * them, over the class level. The writes are S2's (`resolveVertexLayoutWrite` under the layout in force, one
 * TRANSACTION of SetFieldAction only, rule 12). Returns the objects laid out and the vertices of the first and last cell.
 */
async function layoutObjectLevel(page: Page, columns: Array<[string, number, number?]>, y0: number, withSlots = true) {
    return ev<{ objects: string[]; vertices: number; first: string | null; last: string | null }>(page, `
        const j = await import('/src/joiner/index.ts');
        const lk = await import('/src/components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts');
        const lay = await import('/src/components/editor-v2/viewpoint/layout/vertexLayout.ts');
        const st = w.store.getState(); const idl = st.idlookup; const key = lk.getLayoutKeyOf(st);
        const vOf = (o) => Object.keys(idl).filter((id) => idl[id] && idl[id].model === o && /Vertex/.test(String(idl[id].className)));
        const fv = (o, n) => { for (const vid of (idl[o] && idl[o].features) || []) { const v = idl[vid]; if (v && idl[v.instanceof] && idl[v.instanceof].name === n) return (v.values || []).filter((x) => typeof x === 'string' && idl[x]); } return []; };
        const pos = [];
        for (const [obj, x, top] of a.columns) { const y0 = top ?? a.y0;
            pos.push([obj, x, y0]);
            if (a.withSlots) fv(obj, 'slots').forEach((sl, i) => { const y = y0 + 300 + i * 170; pos.push([sl, x, y]);
                const vs = fv(sl, 'values'); const vx = x + 330 + Math.max(0, vs.length - 1) * 150;
                vs.forEach((v, k) => pos.push([v, vx, y + k * 170])); });
        }
        let n = 0;
        j.TRANSACTION('fixture: object level layout', () => {
            for (const [o, x, y] of pos) for (const vid of vOf(o)) {
                n++; const wr = lay.resolveVertexLayoutWrite(idl[vid], { x, y }, key);
                if (wr.target === 'dictionary') { j.SetFieldAction.new(vid, 'layoutByViewpoint', { [wr.vpId]: wr.record }, '+=', false); continue; }
                for (const [k, v] of Object.entries(wr.patch)) j.SetFieldAction.new(vid, k, v, undefined, false);
            }
        });
        const far = pos.reduce((m, p) => (p[1] + p[2] > m[1] + m[2] ? p : m), pos[0]);
        return { objects: pos.map((p) => p[0]), vertices: n, first: vOf(pos[0][0])[0] ?? null, last: vOf(far[0])[0] ?? null };`,
        { columns, y0, withSlots }, 1500);
}

/**
 * The object level shot in a 2560x1600 page: zoomed out with the toolbar until it fits, brought into React Flow's own
 * view by the tree's reveal (`SELECT_NODE`: the far cell, then the first, so every node of it is mounted, the canvas
 * rendering only the visible ones), then the picture framed on its drawn nodes (as `shoot` frames every node).
 */
async function shootObjects(page: Page, objectIds: string[], path: string, modelId: string, reveal: Array<string | null>, atFrame?: () => Promise<void>) {
    const hide = page.locator('button[aria-label="Hide the side panel"]:visible');
    if (await hide.count()) { await hide.first().click(); await page.waitForTimeout(900); }
    const size0 = page.viewportSize();
    await page.setViewportSize({ width: 2560, height: 1600 });
    await page.waitForTimeout(1200);
    const scale = () => page.evaluate((root) => {
        const vp = document.querySelector(`${root} .react-flow__viewport`) as HTMLElement | null;
        const m = vp?.style.transform.match(/scale\(([\d.]+)\)/); return m ? +m[1] : 1;
    }, ACTIVE_PANE);
    const zoomOut = page.locator('button[title="Zoom out"]:visible');
    for (let i = 0; i < 12 && (await scale()) > 0.6 && (await zoomOut.count()); i++) { await zoomOut.first().click(); await page.waitForTimeout(500); }
    for (const vid of reveal) {
        if (!vid) continue;
        await ev(page, `const r = await import('/src/events/registry.ts');
            w.dispatchEvent(new CustomEvent(r.JjodelEvents.SELECT_NODE, { detail: { nodeId: a.vid, modelId: a.model } })); return 1;`, { vid, model: modelId }, 900);
    }
    meas('object diagram zoom before framing', await scale());
    const framed = await page.evaluate(([ids, root]) => {
        const w = window as any; const idl = w.store.getState().idlookup; const want = new Set(ids);
        for (const id of Object.keys(idl)) { const r = idl[id]; if (r && want.has(r.model) && /Vertex/.test(String(r.className))) want.add(id); }
        const pane = document.querySelector(root) as HTMLElement | null;
        const vp = pane?.querySelector('.react-flow__viewport') as HTMLElement | null;
        if (!pane || !vp) return { nodes: 0 };
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0;
        for (const el of Array.from(pane.querySelectorAll('.react-flow__node')) as HTMLElement[]) {
            if (!want.has(el.getAttribute('data-id') ?? '')) continue;
            const m = el.style.transform.match(/translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
            if (!m) continue;
            n++; x0 = Math.min(x0, +m[1]); y0 = Math.min(y0, +m[2]); x1 = Math.max(x1, +m[1] + el.offsetWidth); y1 = Math.max(y1, +m[2] + el.offsetHeight);
        }
        if (n === 0) return { nodes: 0 };
        const k = Math.min(1, (pane.clientWidth - 80) / (x1 - x0), (pane.clientHeight - 80) / (y1 - y0));
        vp.style.transform = `translate(${40 - x0 * k}px, ${40 - y0 * k}px) scale(${k})`;
        return { nodes: n, box: [x0, y0, x1, y1], k };
    }, [objectIds, ACTIVE_PANE] as const);
    meas('object diagram framed', framed);
    await page.waitForTimeout(400);
    await page.locator(ACTIVE_PANE).first().screenshot({ path });
    meas('screenshot', path);
    if (atFrame) await atFrame();
    if (size0) await page.setViewportSize(size0);
}

/**
 * A containment write of `syncCreateCompositionLink` is lost about once per build (P-2026-11-08-1939, ticket in its log entry). Each link
 * missing from its slot after the settle is written again, one MEAS line per loss, at most three rounds; then the slot gets the plan's order,
 * since a late write lands last. The edge is created only if the loss took it too: a second one would be drawn twice. Returns the losses.
 */
async function repairContainment(page: Page, ids: Record<string, { obj: string; vertex: string }>, containment: Array<[string, string, string]>) {
    await page.waitForTimeout(SETTLE_MS);
    const lost: Array<{ link: string; attempt: number; edges: number }> = [];
    const touched = new Set<string>();
    const pairs = containment.map(([o, f, t]) => [ids[o].obj, f, ids[t].obj]);
    for (let attempt = 1; attempt <= 3; attempt++) {
        const gone = await ev<number[]>(page, `${VIEW_JS}
            return a.map(([o, f, t], i) => { const v = slot(o, f); return v && (v.values || []).includes(t) ? -1 : i; }).filter((i) => i >= 0);`, pairs, 0);
        if (!gone.length) break;
        for (const i of gone) {
            const [o, f, t] = containment[i];
            const link = `${o}.${f}->${t}`;
            const edges = await ev<number>(page, `const idl = w.store.getState().idlookup;
                const edges = Object.keys(idl).filter((id) => idl[id] && /Edge/.test(String(idl[id].className)) && idl[id].start === a.pv && idl[id].end === a.cv).length;
                if (edges === 0) { const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts'); c2j.syncCreateCompositionLink(a.pv, a.cv, a.f); }
                else { const r = w.LPointerTargetable.fromPointer(a.po)['$' + a.f]; r.values = [...(r.__raw.values || []).filter((v) => v != null && v !== ''), a.co]; }
                return edges;`, { pv: ids[o].vertex, cv: ids[t].vertex, po: ids[o].obj, co: ids[t].obj, f }, 700);
            meas('lost containment write', { link, attempt, edges });
            lost.push({ link, attempt, edges });
            touched.add(`${o}\n${f}`);
        }
        await page.waitForTimeout(SETTLE_MS);
    }
    for (const key of touched) {
        const [o, f] = key.split('\n');
        await ev(page, `const r = w.LPointerTargetable.fromPointer(a.po)['$' + a.f]; r.values = a.order; return 1;`,
            { po: ids[o].obj, f, order: containment.filter((c) => c[0] === o && c[1] === f).map((c) => ids[c[2]].obj) }, 700);
    }
    if (containment.length) {
        const [o, , t] = containment[0];
        meas('edge query control (edges of the first containment link)', await ev<number>(page, `const idl = w.store.getState().idlookup;
            return Object.keys(idl).filter((id) => idl[id] && /Edge/.test(String(idl[id].className)) && idl[id].start === a[0] && idl[id].end === a[1]).length;`, [ids[o].vertex, ids[t].vertex], 0));
    }
    return lost;
}

// ── The UML object diagram viewpoint (R-DCN-29), copied from uml-class-object-fixture: importing it sets GV_OUT ─────

const VP_OBJECT = 'UML object diagram';
const I = (prop: string) => ({ from: 'intrinsic', prop });
const P = (expr: string) => ({ from: 'path', expr });
const L = (text: string) => ({ from: 'literal', text });
const not = (arg: unknown) => ({ op: 'not', arg });
const exists = (path: string) => ({ op: 'exists', path });
const kind = (c: string, path?: string) => path ? { op: 'isKind', class: c, path } : { op: 'isKind', class: c };
const hidden = (cls: string): [string, Record<string, unknown>] =>
    [cls, { kind: 'vertex', metaclasses: [cls], label: `${cls} (not drawn)`, visible: false, priority: 5, shape: { form: 'rect' } }];
const BOX = { form: 'rect', fill: '#ffffff', border: { width: 1 }, cornerRadius: 0 };
const IS_LINK = exists('$classifier.value.$memberEnds.values[0]');
const slotHead = [P('$definingFeature.value.$name.value'), L(' = ')];
const OBJECT_VIEWS: Array<[string, Record<string, unknown>]> = [
    ['InstanceSpecification', { kind: 'vertex', metaclasses: ['InstanceSpecification'], label: 'Object', predicate: not(IS_LINK),
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
    ['Slot', { kind: 'row', metaclasses: ['Slot'], label: 'Slot (instance value)', priority: 1, predicate: exists('$values.values[0].$instance.value'),
        template: [...slotHead, P('$values.values[0].$instance.value.$name.value')] }],
    ['Slot', { kind: 'row', metaclasses: ['Slot'], label: 'Slot (null)', priority: 1, predicate: kind('LiteralNull', '$values.values[0]'),
        template: [...slotHead, L('null')] }],
    ['Slot', { kind: 'row', metaclasses: ['Slot'], label: 'Slot (literal)', template: [...slotHead, P('$values.values[0].$value.value')] }],
    ...['Package', 'Class', 'DataType', 'PrimitiveType', 'Enumeration', 'Association', 'Generalization', 'Property', 'Operation',
        'Parameter', 'EnumerationLiteral', 'Slot', 'LiteralInteger', 'LiteralString', 'LiteralBoolean', 'LiteralNull', 'InstanceValue',
        // The drone's own metaclasses, which the UML fixture does not have.
        'StaticClass', 'Viewpoint', 'DynamicClass', 'Monitor', 'CoherenceConstraint', 'BoundedPersistence', 'BoundedResponse'].map(hidden),
];

type ObjectCensus = { active: string | null; instances: Array<{ name: string; ir: boolean; rows: string[] }>; others: string[]; overlaps: string[] };
/** What the canvas of the active pane draws for the object level: the instances with their rows, any other node, overlapping boxes. */
const objectCensus = (page: Page) => page.evaluate((root) => {
    const w = window as any; const idl = w.store.getState().idlookup;
    const instances: ObjectCensus['instances'] = []; const others: string[] = []; const boxes: Array<[string, number, number, number, number]> = [];
    for (const el of Array.from(document.querySelectorAll(`${root} .react-flow__node`)) as HTMLElement[]) {
        const obj = idl[idl[el.dataset.id ?? '']?.model]; const meta = obj && idl[obj.instanceof]?.name;
        if (meta !== 'InstanceSpecification') { others.push(`${meta}:${obj?.name}`); continue; }
        instances.push({ name: obj.name, ir: !!el.querySelector('.ir-node-content'),
            rows: Array.from(el.querySelectorAll('.ir-compartment .ir-row')).map((r) => r.textContent ?? '') });
        const m = el.style.transform.match(/translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
        if (m) boxes.push([obj.name, +m[1], +m[2], el.offsetWidth, el.offsetHeight]);
    }
    const overlaps = boxes.flatMap((a, i) => boxes.slice(i + 1).filter((b) => a[1] < b[1] + b[3] && b[1] < a[1] + a[3] && a[2] < b[2] + b[4] && b[2] < a[2] + a[4]).map((b) => `${a[0]}/${b[0]}`));
    return { active: w.LProject.getProject().activeViewpoint?.name ?? null, instances, others, overlaps };
}, ACTIVE_PANE) as Promise<ObjectCensus>;
/** Six instances, each drawn by the IR with `rows[name]` slot rows, and nothing else on the canvas. */
const censusOk = (c: ObjectCensus, rows: Record<string, number>) => c.active === VP_OBJECT && c.others.length === 0 && c.overlaps.length === 0
    && c.instances.length === Object.keys(rows).length && c.instances.every((i) => i.ir && i.rows.length === rows[i.name]);

/** The export imported in a new page, no viewpoint picked: its object diagram as it opens. */
async function reimported(file: string, shot: string, rows: Record<string, number>) {
    const { page, errors } = await openPage(browser);
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(5000);
    const imported = await ev<{ id: string | null }>(page, `
        const api = await import('/src/api/persistance/projects.ts');
        const list = () => JSON.parse(localStorage.getItem('projects') || '[]');
        const before = list().length;
        await api.ProjectsApi.importFromText(a);
        for (let i = 0; i < 75 && list().length <= before; i++) await new Promise((r) => setTimeout(r, 200));
        const l = list(); return { id: l.length > before ? l[l.length - 1].id : null };`, readFileSync(file, 'utf8'), 0);
    if (!imported.id) { check('RT-1 the export opens in the UML object viewpoint', false, imported); await page.context().close(); return; }
    await page.goto(`${URL}/#/project?id=${imported.id}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(9000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    const opened = await ev<{ model: string; objects: string[]; vertices: string[] }>(page, `
        const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
        const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(w.LPointerTargetable.fromPointer(m.id));
        const idl = w.store.getState().idlookup;
        const objects = Object.keys(idl).filter((id) => idl[id] && idl[idl[id].instanceof] && idl[idl[id].instanceof].name === 'InstanceSpecification');
        const set = new Set(objects);
        return { model: m.id, objects, vertices: Object.keys(idl).filter((id) => idl[id] && set.has(idl[id].model) && /Vertex/.test(String(idl[id].className))) };`, undefined, 8000);
    let census: ObjectCensus | null = null;
    await shootObjects(page, opened.objects, shot, opened.model, [opened.vertices[opened.vertices.length - 1] ?? null, opened.vertices[0] ?? null], async () => { census = await objectCensus(page); });
    meas('object diagram of the export', census);
    check('RT-1 the export opens in the UML object viewpoint: the six instances drawn with it, their slots as rows, no other node, no overlap',
        !!census && censusOk(census, rows) && errors.length === 0, { census, errors: errors.slice(0, 3) });
    await page.context().close();
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
    const coherence = coherenceConstraints(connectives);
    const plan = modelPlan(statics, coherence);
    const ids = await buildObjects(page, shell.graphId, plan.objects);
    check('every object of the plan was created with its vertex', Object.keys(ids).length === plan.objects.length,
        { planned: plan.objects.length, made: Object.keys(ids).length, missing: plan.objects.map((o) => o[0]).filter((k) => !ids[k]) });
    await buildLinks(page, ids, plan.containment, []);
    const lostLinks = await repairContainment(page, ids, plan.containment);
    out.lostContainment = lostLinks;
    check('L-1 containment writes lost by the build, counted (a report, it never fails: the checks below judge the final state)', true, { losses: lostLinks.length, lost: lostLinks });
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
    const coherenceExprs: Record<string, string> = {};
    for (const cc of coherence) {
        if (cc.pointwise !== undefined) coherenceExprs[`${cc.key}.pointwise`] = cc.pointwise;
        if (cc.pattern?.cls === 'BoundedPersistence') coherenceExprs[`${cc.key}.condition`] = cc.pattern.condition;
        if (cc.pattern?.cls === 'BoundedResponse') { coherenceExprs[`${cc.key}.trigger`] = cc.pattern.trigger; coherenceExprs[`${cc.key}.response`] = cc.pattern.response; }
    }
    const parsedCoherence = await parseAll(page, coherenceExprs, {});
    meas('coherence expressions stored', coherenceExprs);
    out.coherenceExprs = coherenceExprs;
    check('CC-1 the coherence expressions parse as Expression', Object.keys(coherenceExprs).every((k) => parsedCoherence[`expr ${k}`]?.ok), parsedCoherence);

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
    // The dcn roles under the «Dynamic classification» profile, as the roles dialog's Apply writes them (`lmm.state =
    // patch`, simRolesDraft.ts: the profile encoded, single roles an id, Operation and Body a role list).
    const roleIds = {
        simStaticClass: C('StaticClass'), simViewpoints: F('StaticClass.viewpoints'), simDynamicClasses: F('Viewpoint.classes'),
        simInvariant: F('DynamicClass.invariant'), simPrecondition: F('Operation.pre'), simRedefines: F('Operation.redefines'),
        simMonitor: F('DynamicClass.monitors'), simOverlapping: F('Viewpoint.isOverlapping'), simComplete: F('Viewpoint.isComplete'),
        simCoherence: C('CoherenceConstraint'), simCoherenceContext: F('CoherenceConstraint.context'),
        simCoherencePointwise: F('CoherenceConstraint.pointwise'), simCoherencePattern: F('CoherenceConstraint.pattern'),
        simPersistenceCondition: F('BoundedPersistence.condition'), simPersistenceBound: F('BoundedPersistence.k'),
        simResponseTrigger: F('BoundedResponse.trigger'), simResponseResponse: F('BoundedResponse.response'), simResponseBound: F('BoundedResponse.k'),
    };
    const roleLists = { simOperation: [F('Class.ownedOperations'), F('DynamicClass.operations')], simBody: [F('Operation.body'), F('Monitor.body')] };
    const roles = await ev<{ keys: string[]; stc: unknown; ontoKept: boolean; profile: unknown }>(page, `
        const pc = await import('/src/model/simulation/profileCodec.ts'); const sp = await import('/src/model/simulation/simProfiles.ts');
        const rc = await import('/src/model/simulation/roleCatalog.ts'); const dr = await import('/src/model/simulation/dcn/dcnRoles.ts');
        const patch = { simProfile: pc.encodeProfile(sp.systemProfile('dynamicClassification')), ...a.ids };
        for (const [k, v] of Object.entries(a.lists)) patch[k] = rc.encodeRoleValues(v);
        w.LPointerTargetable.fromPointer(a.mm).state = patch;
        await new Promise((r) => setTimeout(r, 600));
        const raw = w.store.getState().idlookup[a.mm]._state || {};
        return { keys: Object.keys(raw).sort(), stc: dr.dcnStcFromRoles(raw), ontoKept: !!raw.ontoBindings, profile: pc.decodeProfile(raw.simProfile) };`,
        { mm: mmId, ids: roleIds, lists: roleLists }, 400);
    meas('dcn roles in the bag', roles);
    out.roles = roles;
    check('R-1 the dcn roles resolve (dcnStcFromRoles) and the bindings stay in the bag', roles.stc !== null && roles.ontoKept, { stc: roles.stc, keys: roles.keys });

    // The coherence constraints as the reader returns them (kinds, texts, k; ids dropped, the context by name), against the plan.
    const coherenceRead = await ev<{ constraints: unknown[]; defects: unknown[] } | null>(page, `
        const dr = await import('/src/model/simulation/dcn/dcnRoles.ts'); const dp = await import('/src/components/editor-v2/problems/dcnToProblems.ts');
        const idl = w.store.getState().idlookup; const stc = dr.dcnStcFromRoles(idl[a.mm]._state || {}); if (!stc) return null;
        const r = dr.dcnCoherenceFromRoles(stc, dp.dcnReadView(idl, a.model));
        return { defects: r.defects, constraints: r.constraints.map((c) => { const { id: _c, ...p } = c.pattern || {};
            return { name: c.name, context: c.context && idl[c.context] ? idl[c.context].name : c.context, pointwise: c.pointwise, pattern: c.pattern ? p : null }; }) };`,
        { mm: mmId, model: shell.modelId }, 0);
    const coherenceExpected = coherence.map((cc) => ({ name: cc.key, context: 'Drone', pointwise: cc.pointwise ?? null,
        pattern: !cc.pattern ? null : cc.pattern.cls === 'BoundedPersistence' ? { kind: 'persistence', condition: cc.pattern.condition, k: cc.pattern.k }
            : { kind: 'response', trigger: cc.pattern.trigger, response: cc.pattern.response, k: cc.pattern.k } }));
    meas('dcnCoherenceFromRoles', coherenceRead);
    out.coherence = coherenceRead;
    check('CC-2 dcnCoherenceFromRoles returns the three constraints with their kinds, texts and k', JSON.stringify(coherenceRead?.constraints) === JSON.stringify(coherenceExpected), { read: coherenceRead?.constraints, expected: coherenceExpected });
    check('CC-3 dcnCoherenceFromRoles reports no defect', coherenceRead !== null && coherenceRead.defects.length === 0, coherenceRead?.defects);

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
    // The class-owned end WAU follows the five attributes in Drone.ownedAttributes (R-DCN-24).
    const droneOwn = ['distance', 'speed', 'power', 'battery', 'vmax', 'WAU'];
    const cDrone = closures.Drone as { features: string[]; dormantOwner: Record<string, string> };
    check('C-1 featureClosure(Drone): the five attributes and the end WAU, in order, then chargeRate, dormant under Charging',
        JSON.stringify(cDrone.features) === JSON.stringify([...droneOwn, 'chargeRate'])
        && JSON.stringify(cDrone.dormantOwner) === JSON.stringify({ chargeRate: 'Charging' }), cDrone);
    const cWau = closures.WeatherAssessmentUnit as { features: string[]; dormantOwner: Record<string, string> };
    check('C-2 featureClosure(WeatherAssessmentUnit): the end ownedSensors alone (the Alert classes own none)',
        JSON.stringify(cWau.features) === JSON.stringify(['ownedSensors']) && Object.keys(cWau.dormantOwner).length === 0, cWau);
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
    check('V-2 conformance clean on the class level, the coherence constraints included', conformance.status === 'conformant' && conformance.n === 0, conformance.violations);

    await setTheme(page, 'light');
    await page.waitForTimeout(SETTLE_MS);
    await shoot(page, 'dcn-drone-class-level-light.png', true, 2);

    // Export, before the seeded attributes.
    await saveScene(page, EXPORT_FILE);
    const file = process.env.GV_SAVE ? `${process.env.GV_SAVE.replace(/\/$/, '')}/${EXPORT_FILE}` : null;
    check('EX-1 the project is exported before the seeded attributes', !!file && existsSync(file), { file });

    // The dcn checks on the class level: computed (dcnInputOf, checkDcnWellFormedness) and read from the registry.
    const dcnRead = () => ev<{ input: boolean; diagnostics: Array<{ rule: string; element: string; message: string }> | null; registry: { owned: number; readable: boolean; active: unknown[] } }>(page, `
        ${REGISTRY_JS} const dp = await import('/src/components/editor-v2/problems/dcnToProblems.ts');
        const wf = await import('/src/model/dcn/dcnWellFormedness.ts'); const idl = w.store.getState().idlookup;
        const input = dp.dcnInputOf(idl, a); const diags = input ? wf.checkDcnWellFormedness(input) : null;
        return { input: !!input, diagnostics: diags && diags.map((d) => ({ rule: d.rule, element: idl[d.element] ? idl[d.element].name : d.element, message: d.message })),
            registry: owned('dcn', a) };`, shell.modelId, 0);
    const dcnClass = await dcnRead();
    out.dcnClassLevel = dcnClass;
    meas('dcn problems, class level', dcnClass);
    check('D-1 zero dcn problems on the class level (computed and in the registry)',
        dcnClass.input && (dcnClass.diagnostics ?? []).length === 0 && dcnClass.registry.active.length === 0, dcnClass);

    // (L2.5) The object level through the R-OI surfaces: S2 `instantiate` per instance, placed below the class level.
    const INSTANCES: Array<[string, string]> = [['dji', 'Drone'], ['wau1', 'WeatherAssessmentUnit'],
        ...SENSORS.map(([cls, single]): [string, string] => [single.toLowerCase(), cls])];
    const made: Record<string, { instance: string | null; ok: boolean; slots: number; values: number; problems: string[] }> = {};
    for (const [i, [name, cls]] of INSTANCES.entries()) {
        made[name] = await ev<typeof made[string]>(page, `const ins = await import('/src/components/editor-v2/hooks/instantiate.ts');
            const get = (id) => w.store.getState().idlookup[id]; const rec = ins.objectRecord(get, a.model);
            const r = await ins.instantiate(a.cls, rec, () => ({ x: a.x, y: a.y }));
            if (r.instance) { const o = w.LPointerTargetable.fromPointer(r.instance); if (o.$name) o.$name.values = [a.name]; }
            return { instance: r.instance, ok: r.ok, slots: r.slots.length, values: r.values.length, problems: r.problems };`,
            { model: shell.modelId, cls: ids[cls].obj, name, x: 60 + (i % 3) * 420, y: 3400 + Math.floor(i / 3) * 420 }, 800);
    }
    meas('instantiate', made);
    out.instantiate = made;
    check('O-1 instantiate made every instance with no problem', INSTANCES.every(([n]) => made[n].ok && !!made[n].instance), made);
    const instOf = (n: string) => made[n].instance!;

    // The values and the links: one value object per slot S2 made, by the host's create primitive (S2's default write).
    const slotWrites: Array<[string, string, string, Record<string, unknown>]> = [
        ['dji', 'p_Drone_distance', 'LiteralInteger', { value: 0 }], ['dji', 'p_Drone_speed', 'LiteralInteger', { value: 0 }],
        ['dji', 'p_Drone_battery', 'LiteralInteger', { value: 80 }], ['dji', 'p_Drone_vmax', 'LiteralInteger', { value: 15 }],
        // L4.7: the readings, inside the Safe invariant (wind <= 8, 0 <= temp <= 35, humidity <= 60, rain == 0).
        ['temp', 'p_TempSensor_value', 'LiteralInteger', { value: 20 }], ['wind', 'p_WindSensor_speed', 'LiteralInteger', { value: 3 }],
        ['rain', 'p_RainSensor_intensity', 'LiteralInteger', { value: 0 }], ['humidity', 'p_HumiditySensor_relative', 'LiteralInteger', { value: 45 }],
        ['dji', 'end_DroneWAU_WAU', 'InstanceValue', { instance: instOf('wau1') }],
        ...SENSORS.map(([, single]): [string, string, string, Record<string, unknown>] =>
            ['wau1', 'end_WAUSensors_ownedSensors', 'InstanceValue', { instance: instOf(single.toLowerCase()) }]),
    ];
    const written = await ev<string[]>(page, `const ca = await import('/src/components/editor-v2/hooks/createAdapter.ts');
        const idl = () => w.store.getState().idlookup; const errs = [];
        const featureValue = (o, n) => { for (const vid of (idl()[o] && idl()[o].features) || []) { const v = idl()[vid]; if (v && idl()[v.instanceof] && idl()[v.instanceof].name === n) return v; } return null; };
        for (const [inst, feature, metaclass, seed] of a.writes) {
            const slot = ((featureValue(inst, 'slots') || {}).values || []).find((s) => ((featureValue(s, 'definingFeature') || {}).values || []).includes(feature));
            if (!slot) { errs.push('no slot of ' + feature + ' on ' + inst); continue; }
            const r = ca.createInstance(a.model, metaclass, slot, 'values', seed);
            if (!r.ok) errs.push(feature + ': ' + r.reason);
            await new Promise((res) => setTimeout(res, 700));
        }
        return errs;`, { model: shell.modelId, writes: slotWrites.map(([n, f, m, seed]) => [instOf(n), ids[f].obj, m, seed]) }, 800);
    check('O-2 every value and link was written into its slot', written.length === 0, written);

    // «Sync slots» on every instance (R-OI-9): nothing to create is a success that writes nothing.
    const synced = await ev<Record<string, unknown>>(page, `const ins = await import('/src/components/editor-v2/hooks/instantiate.ts');
        const get = (id) => w.store.getState().idlookup[id]; const out = {};
        for (const [n, id] of a.insts) { const rec = ins.instanceObjectRecord(get, a.model, id);
            const r = rec ? await ins.syncSlots(id, rec) : null; out[n] = r ? { ok: r.ok, slots: r.slots.length, problems: r.problems } : 'no object record'; }
        return out;`, { model: shell.modelId, insts: INSTANCES.map(([n]) => [n, instOf(n)]) }, 0);
    meas('Sync slots', synced);
    await page.waitForTimeout(SETTLE_MS + 1500);

    // The slots of every instance: defining feature, value metaclass and value, in slot order.
    const slotsOf = await ev<Record<string, Array<{ feature: string; values: Array<[string, unknown]> }>>>(page, `${VIEW_JS} const out = {};
        for (const [n, id] of a) {
            out[n] = ((slot(id, 'slots') || {}).values || []).map((s) => ({
                feature: (idl[((slot(s, 'definingFeature') || {}).values || [])[0]] || {}).name,
                values: ((slot(s, 'values') || {}).values || []).map((v) => { const vv = slot(v, 'value') || slot(v, 'instance');
                    const x = vv && (vv.values || [])[0]; return [idl[idl[v].instanceof].name, idl[x] ? idl[x].name : x]; }),
            }));
        }
        return out;`, INSTANCES.map(([n]) => [n, instOf(n)]), 0);
    out.slots = slotsOf;
    for (const [n] of INSTANCES) meas(`slots of ${n}`, slotsOf[n]);
    const djiSlots = slotsOf.dji.map((x) => x.feature);
    check('O-3 S2 synthesized the closure of Drone for dji, chargeRate among them with its default 1',
        JSON.stringify(djiSlots) === JSON.stringify([...droneOwn, 'chargeRate'])
        && JSON.stringify(slotsOf.dji.find((x) => x.feature === 'chargeRate')?.values) === JSON.stringify([['LiteralInteger', 1]]), slotsOf.dji);
    const valueOf = (f: string) => slotsOf.dji.find((x) => x.feature === f)?.values;
    check('O-4 dji holds distance 0, speed 0, battery 80 and links wau1 through WAU; wau1 links the four sensors through ownedSensors',
        JSON.stringify(valueOf('distance')) === '[["LiteralInteger",0]]' && JSON.stringify(valueOf('speed')) === '[["LiteralInteger",0]]'
        && JSON.stringify(valueOf('battery')) === '[["LiteralInteger",80]]' && JSON.stringify(valueOf('WAU')) === '[["InstanceValue","wau1"]]'
        && JSON.stringify(slotsOf.wau1.find((x) => x.feature === 'ownedSensors')?.values) === JSON.stringify(SENSORS.map(([, s]) => ['InstanceValue', s.toLowerCase()])),
        { dji: slotsOf.dji, wau1: slotsOf.wau1 });

    // L4.7: no slot left empty; the defaults came through S2, the readings and vmax through the writes above.
    const held = Object.fromEntries(INSTANCES.map(([n]) => [n, Object.fromEntries(slotsOf[n].map((x) => [x.feature, x.values.map((v) => v[1])]))]));
    const expectedHeld = { dji: { power: [0], vmax: [15] },
        temp: { value: [20], unit: ['°C'], status: ['OK'] }, wind: { speed: [3], unit: ['m/s'], status: ['OK'] },
        rain: { intensity: [0], unit: ['mm/h'], status: ['OK'], presence: [false] }, humidity: { relative: [45], unit: ['%'], status: ['OK'] } } as Record<string, Record<string, unknown[]>>;
    check('O-6 no slot is empty, and power, vmax and every sensor slot hold the chosen value',
        INSTANCES.every(([n]) => slotsOf[n].every((x) => x.values.length > 0))
        && Object.entries(expectedHeld).every(([n, w]) => Object.entries(w).every(([f, v]) => JSON.stringify(held[n][f]) === JSON.stringify(v))), held);

    // Zero instantiation findings on every instance: computed (detectInstantiationProblems) and in the registry.
    const instProblems = await ev<{ findings: unknown[]; onInstances: Record<string, unknown[]>; registry: { owned: number; readable: boolean; active: unknown[] } }>(page, `
        ${REGISTRY_JS} const ip = await import('/src/components/editor-v2/problems/instantiationToProblems.ts');
        const lookup = w.store.getState().idlookup; const get = (id) => (Object.prototype.hasOwnProperty.call(lookup, id) ? lookup[id] : undefined);
        const findings = ip.detectInstantiationProblems(get, a.model).map((f) => ({ kind: f.kind, severity: f.severity, instance: f.instance && lookup[f.instance] ? lookup[f.instance].name : f.instance, description: f.description }));
        const onInstances = {}; for (const [n, id] of a.insts) onInstances[n] = reg.getNodeProblemsSnapshot(id).filter((p) => p.kind === 'instantiation' && p.resolvedAt === undefined).map((p) => p.title + ': ' + p.description);
        return { findings, onInstances, registry: owned('instantiation', a.model) };`, { model: shell.modelId, insts: INSTANCES.map(([n]) => [n, instOf(n)]) }, 0);
    out.instantiationProblems = instProblems;
    meas('instantiation problems', instProblems);
    check('O-5 zero instantiation problems on every instance (no orphan, no missing), computed and in the registry',
        instProblems.findings.length === 0 && Object.values(instProblems.onInstances).every((x) => x.length === 0) && instProblems.registry.active.length === 0, instProblems);

    // The dcn checks again, with the instances in the model; and the conformance problems left, listed.
    const dcnObjects = await dcnRead();
    out.dcnObjectLevel = dcnObjects;
    meas('dcn problems, with the object level', dcnObjects);
    const conformanceObjects = await ev<{ status: string; n: number; violations: Array<{ objectName: string; violationType: string; severity: string; message: string; meta: string | null }> }>(page, `
        const cv = await import('/src/model/conformance/ConformanceValidator.ts'); const idl = w.store.getState().idlookup;
        const p = w.LProject.getProject(); const m = p.models.find((x) => x.id === a.model); const mm = p.metamodels.find((x) => x.id === a.mm);
        const r = cv.validateConformance(m, mm);
        return { status: r.status, n: r.violations.length, violations: r.violations.map((v) => ({ objectName: v.objectName, violationType: v.violationType, severity: v.severity,
            message: v.message, meta: v.objectId && idl[v.objectId] && idl[idl[v.objectId].instanceof] ? idl[idl[v.objectId].instanceof].name : null })) };`,
        { model: shell.modelId, mm: mmId }, 0);
    out.conformanceObjects = conformanceObjects;
    meas('conformance status, with the object level', { status: conformanceObjects.status, violations: conformanceObjects.n });
    for (const v of conformanceObjects.violations) meas('conformance problem left', v);
    check('D-2 zero dcn problems with the object level (computed and in the registry)',
        dcnObjects.input && (dcnObjects.diagnostics ?? []).length === 0 && dcnObjects.registry.active.length === 0, dcnObjects);
    check('V-3 conformance clean with the object level', conformanceObjects.status === 'conformant' && conformanceObjects.n === 0, conformanceObjects.violations);

    // The object diagram, light theme; then the export with the object level, before the seeds.
    await setTheme(page, 'light');
    await page.waitForTimeout(SETTLE_MS);
    mkdirSync(CROPS, { recursive: true });
    // Columns: dji and wau1 with their values to the right, then the four sensors (no value) in a band under wau1, clear of its values' column.
    const laid = await layoutObjectLevel(page, INSTANCES.map(([n], i): [string, number, number?] => i < 2 ? [instOf(n), 60 + i * 700] : [instOf(n), [760, 1140, 2210, 1830][i - 2], 3150]), 2600);
    meas('object level laid out', { objects: laid.objects.length, vertices: laid.vertices });
    await page.waitForTimeout(SETTLE_MS);

    // R-DCN-29: the UML object viewpoint, active in the export; the instances on a grid of their own in it (the layout is per viewpoint).
    const vpObject = await buildViewpoint(page, VP_OBJECT, OBJECT_VIEWS);
    meas('object viewpoint', vpObject);
    check('O-7 every view of the UML object viewpoint is built', vpObject.made.length === OBJECT_VIEWS.length && vpObject.made.every((m) => !/:undefined$/.test(m)), vpObject.made);
    await pickViewpoint(page, VP_OBJECT);
    await page.waitForTimeout(SETTLE_MS);
    const grid = await layoutObjectLevel(page, INSTANCES.map(([n], i): [string, number, number?] => [instOf(n), 60 + (i % 3) * 420, 2600 + Math.floor(i / 3) * 420]), 2600, false);
    meas('object level laid out in the UML object viewpoint', { objects: grid.objects.length, vertices: grid.vertices });
    await page.waitForTimeout(SETTLE_MS);
    const rowsOf = Object.fromEntries(INSTANCES.map(([n]) => [n, slotsOf[n].length]));
    let drawn: ObjectCensus | null = null;
    await shootObjects(page, grid.objects, `${CROPS}/dcn-drone-objects-light.png`, shell.modelId, [grid.last, grid.first], async () => { drawn = await objectCensus(page); });
    meas('object diagram', drawn);
    out.objectDiagram = drawn;
    check('O-8 the object diagram uses the UML object viewpoint: the six instances drawn with it, their slots as rows, no other node, no overlap', !!drawn && censusOk(drawn, rowsOf), { drawn, rowsOf });
    await saveScene(page, EXPORT_OBJECTS_FILE);
    const fileObjects = process.env.GV_SAVE ? `${process.env.GV_SAVE.replace(/\/$/, '')}/${EXPORT_OBJECTS_FILE}` : null;
    check('EX-2 the project is exported with the object level', !!fileObjects && existsSync(fileObjects), { file: fileObjects });
    if (fileObjects && existsSync(fileObjects)) await reimported(fileObjects, `${CROPS}/dcn-drone-objects-reimported-light.png`, rowsOf);
    // The seeds below are made on the abstract syntax, as before this viewpoint existed.
    await pickViewpoint(page, 'Abstract syntax');
    await page.waitForTimeout(SETTLE_MS);

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
    check('C-3 seeded featureClosure(Drone): the own features, then chargeRate and one per Mode class in viewpoint order, dormantOwner naming each class',
        JSON.stringify(sDrone.features) === JSON.stringify([...droneOwn, 'chargeRate', ...modeSeeds.map((d) => `seed_${d}`)])
        && modeSeeds.every((d) => sDrone.dormantOwner[`seed_${d}`] === d) && sDrone.dormantOwner.chargeRate === 'Charging'
        && Object.keys(sDrone.dormantOwner).length === 5, sDrone);
    const sWau = seeded.WeatherAssessmentUnit as { features: string[]; dormantOwner: Record<string, string> };
    const alertSeeds = ['Safe', 'Moderate', 'Adverse'];
    check('C-4 seeded featureClosure(WeatherAssessmentUnit): ownedSensors, then one per Alert class in viewpoint order, dormantOwner naming each class',
        JSON.stringify(sWau.features) === JSON.stringify(['ownedSensors', ...alertSeeds.map((d) => `seed_${d}`)]) && alertSeeds.every((d) => sWau.dormantOwner[`seed_${d}`] === d), sWau);
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
