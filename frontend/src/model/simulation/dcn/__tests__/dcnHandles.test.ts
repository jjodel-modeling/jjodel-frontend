/**
 * dcnHandles — σ-backed handles and the classification accessor of the DCN
 * nucleus (P-2026-11-07-1410, R-DCN-2, R-DCN-3, R-DCN-7, R-DCN-12, R-DCN-17).
 *
 * The view is the synthetic drone model of dcnCompile.test.ts, copied (a test
 * file is not imported by another), plus what navigation needs: a `wau` link
 * from the drone to a weather assessment unit `wau1` that owns two sensors,
 * `temp1` and `wind1`, through `ownedSensors`; an upper bound on the two link
 * features; and a viewpoint `Health` on the abstract `Sensor`, inherited by
 * every sensor (R-DCN-17). The snapshot is a synthetic `buildEvalContext`
 * record (guardContext.test.ts explains why): a pool handle per object, which
 * carries the linguistic features only, and every name bound at the top.
 */

import { describe, it, expect } from 'vitest';
import { JjelEvaluator } from '../../../../jjel/evaluator';
import type { EvaluationContext, JjelValue } from '../../../../jjel/evaluator';
import { parseExpressionStrict } from '../../../../jjel/parser';
import { encodeRoleValues } from '../../roleCatalog';
import { dcnStcFromRoles } from '../dcnRoles';
import type { DcnStc } from '../dcnRoles';
import { compileDcn } from '../dcnCompile';
import type { DcnCompileInput, DcnCompiled, DcnReadView } from '../dcnCompile';
import { bindDcn, readDcnModel } from '../dcnHandles';
import type { DcnBinding, DcnModel } from '../dcnHandles';
import { buildGuardContext, freezeSnapshot } from '../../guardContext';
import type { SimSnapshot } from '../../guardContext';
import { compileGuard, evaluateGuard } from '../../guardEvaluator';
import type { CompiledGuard, GuardOutcome } from '../../guardEvaluator';
import { compileOutput, evaluateOutput } from '../../boardOutputs';
import type { SimState, SimValue } from '../../netTypes';
import type { OntoBinding } from '../../../ontological/bindingCodec';

// ── the metamodel: M2 classes and their supertypes ───────────────────────────

const SUPERS: Record<string, string[]> = {
    NamedElement: [], Classifier: ['NamedElement'], Class: ['Classifier'], StaticClass: ['Class'],
    DataType: ['Classifier'], PrimitiveType: ['DataType'], Enumeration: ['DataType'],
    InstanceSpecification: ['NamedElement'], EnumerationLiteral: ['InstanceSpecification'], Slot: [],
    ValueSpecification: [], LiteralInteger: ['ValueSpecification'], LiteralString: ['ValueSpecification'],
    LiteralBoolean: ['ValueSpecification'], InstanceValue: ['ValueSpecification'],
    Property: ['NamedElement'], Parameter: ['NamedElement'], Operation: ['NamedElement'], Generalization: [],
    Viewpoint: ['NamedElement'], DynamicClass: ['NamedElement'], Monitor: ['NamedElement'],
};
const conformsTo = (m: string, s: string): boolean => m === s || (SUPERS[m] ?? []).some(x => conformsTo(x, s));

const STC = dcnStcFromRoles({
    simStaticClass: 'StaticClass',
    simViewpoints: 'StaticClass.viewpoints',
    simDynamicClasses: 'Viewpoint.classes',
    simInvariant: 'DynamicClass.invariant',
    simOperation: encodeRoleValues(['Class.ownedOperations', 'DynamicClass.operations']),
    simPrecondition: 'Operation.pre',
    simBody: encodeRoleValues(['Operation.body', 'Monitor.body']),
    simRedefines: 'Operation.redefines',
    simMonitor: 'DynamicClass.monitors',
    simOverlapping: 'Viewpoint.isOverlapping',
    simComplete: 'Viewpoint.isComplete',
}) as DcnStc;

const BINDING: OntoBinding = {
    name: 'object',
    typeReference: 'InstanceSpecification.classifier',
    slotContainer: 'InstanceSpecification.slots',
    definingFeature: 'Slot.definingFeature',
    valueHolder: 'Slot.values',
    featureContainer: 'Class.ownedAttributes',
    generalization: { via: 'Classifier.generalizations', general: 'Generalization.general' },
    abstractFlag: 'Classifier.isAbstract',
    featureType: 'TypedElement.type',
    defaultValue: 'Property.defaultValue',
    valueKinds: [
        { when: 'primitive:Boolean', create: 'LiteralBoolean', field: 'LiteralBoolean.value' },
        { when: 'primitive:String', create: 'LiteralString', field: 'LiteralString.value' },
        { when: 'primitive:Integer', create: 'LiteralInteger', field: 'LiteralInteger.value' },
        { when: 'instance', create: 'InstanceValue', field: 'InstanceValue.instance' },
    ],
    featureSources: [{ path: ['StaticClass.viewpoints', 'Viewpoint.classes', 'DynamicClass.attributes'] }],
};

const FEATURES = {
    rangeMin: 'Property.rangeMin', rangeMax: 'Property.rangeMax',
    literals: 'Enumeration.ownedLiterals', parameters: 'Operation.ownedParameters',
};
const UPPER = 'Property.upper';

// ── the model: M1 objects ────────────────────────────────────────────────────

interface Obj { meta: string; name?: string; refs?: Record<string, string[]>; attrs?: Record<string, unknown> }
type Model = Record<string, Obj>;

function droneModel(): Model {
    const m: Model = {};
    const add = (id: string, o: Obj) => { m[id] = o; };
    const push = (id: string, ref: string, ...targets: string[]) => {
        const refs = (m[id].refs ??= {});
        (refs[ref] ??= []).push(...targets);
    };
    for (const p of ['Integer', 'Boolean', 'String']) add(p, { meta: 'PrimitiveType', name: p });
    add('SensorStatus', { meta: 'Enumeration', name: 'SensorStatus' });
    for (const l of ['OK', 'Fault', 'Calibrating']) {
        add(`lit_${l}`, { meta: 'EnumerationLiteral', name: l, refs: { 'InstanceSpecification.classifier': ['SensorStatus'] } });
        push('SensorStatus', 'Enumeration.ownedLiterals', `lit_${l}`);
    }
    const prop = (owner: string, ref: string, id: string, name: string, type: string, attrs: Record<string, unknown> = {}) => {
        add(id, { meta: 'Property', name, refs: { 'TypedElement.type': [type] }, attrs });
        push(owner, ref, id);
    };
    const op = (owner: string, ref: string, id: string, name: string, body: string[], pre?: string) => {
        add(id, { meta: 'Operation', name, attrs: { 'Operation.body': body, ...(pre ? { 'Operation.pre': pre } : {}) } });
        push(owner, ref, id);
    };
    const dyn = (vp: string, id: string, inv: string) => {
        add(id, { meta: 'DynamicClass', name: id, attrs: { 'DynamicClass.invariant': inv } });
        push(vp, 'Viewpoint.classes', id);
    };
    const monitor = (dc: string, id: string, name: string, body: string[]) => {
        add(id, { meta: 'Monitor', name, attrs: { 'Monitor.body': body } });
        push(dc, 'DynamicClass.monitors', id);
    };

    // Drone and its viewpoint Mode (chapter Fig. 6), with a link to its weather unit.
    add('Drone', { meta: 'StaticClass', name: 'Drone', attrs: { 'Classifier.isAbstract': false } });
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_distance', 'distance', 'Integer');
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_speed', 'speed', 'Integer');
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_power', 'power', 'Integer');
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_battery', 'battery', 'Integer', { 'Property.rangeMin': 0, 'Property.rangeMax': 100 });
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_vmax', 'vmax', 'Integer', { 'Property.defaultValue': '15' });
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_wau', 'wau', 'WeatherAssessmentUnit', { [UPPER]: 1 });
    add('Mode', { meta: 'Viewpoint', name: 'Mode', attrs: { 'Viewpoint.isOverlapping': true, 'Viewpoint.isComplete': true } });
    push('Drone', 'StaticClass.viewpoints', 'Mode');
    dyn('Mode', 'Charging', 'self.distance == 0 and self.speed == 0 and self.battery < 100');
    monitor('Charging', 'mon_Charging_charge', 'charge', ['self.battery := self.battery + 1']);
    prop('Charging', 'DynamicClass.attributes', 'p_Charging_plugged', 'plugged', 'Boolean', { 'Property.defaultValue': 'false' });
    dyn('Mode', 'Ready', 'self.distance == 0 and self.speed == 0 and self.battery == 100');
    op('Ready', 'DynamicClass.operations', 'op_Ready_takeOff', 'takeOff', ['self.speed := 1']);
    dyn('Mode', 'Flying', 'self.battery > 0 and self.speed > 0');
    op('Flying', 'DynamicClass.operations', 'op_Flying_rampUp', 'rampUp',
        ['self.speed := self.speed + 1', 'self.power := self.power + 1'], 'self.speed < self.vmax');
    monitor('Flying', 'mon_Flying_drain', 'drain', ['self.battery := self.battery - 1', 'self.distance := self.distance + self.speed']);
    prop('Flying', 'DynamicClass.attributes', 'p_Flying_altitude', 'altitude', 'Integer', { 'Property.rangeMin': 0, 'Property.rangeMax': 120 });
    dyn('Mode', 'Empty', 'self.battery == 0');

    // WeatherAssessmentUnit and Alert, and the sensors the unit owns.
    add('WeatherAssessmentUnit', { meta: 'StaticClass', name: 'WeatherAssessmentUnit' });
    prop('WeatherAssessmentUnit', 'Class.ownedAttributes', 'p_WAU_ownedSensors', 'ownedSensors', 'Sensor', { [UPPER]: -1 });
    add('Alert', { meta: 'Viewpoint', name: 'Alert', attrs: { 'Viewpoint.isOverlapping': false, 'Viewpoint.isComplete': true } });
    push('WeatherAssessmentUnit', 'StaticClass.viewpoints', 'Alert');
    for (const d of ['Safe', 'Moderate', 'Adverse']) dyn('Alert', d, 'true');

    // The sensors, under the abstract Sensor; Sensor owns the viewpoint Health, inherited by every sensor (R-DCN-17).
    add('Sensor', { meta: 'StaticClass', name: 'Sensor', attrs: { 'Classifier.isAbstract': true } });
    op('Sensor', 'Class.ownedOperations', 'op_Sensor_selfTest', 'selfTest', ['self.status := SensorStatus.Calibrating']);
    add('Health', { meta: 'Viewpoint', name: 'Health', attrs: { 'Viewpoint.isOverlapping': false, 'Viewpoint.isComplete': true } });
    push('Sensor', 'StaticClass.viewpoints', 'Health');
    dyn('Health', 'Faulty', "self.status == 'Fault'");
    dyn('Health', 'Nominal', "self.status != 'Fault'");
    const SENSORS: Array<[string, string]> = [['TempSensor', 'value'], ['WindSensor', 'speed']];
    for (const [s, reading] of SENSORS) {
        add(s, { meta: 'StaticClass', name: s, attrs: { 'Classifier.isAbstract': false } });
        prop(s, 'Class.ownedAttributes', `p_${s}_${reading}`, reading, 'Integer');
        prop(s, 'Class.ownedAttributes', `p_${s}_unit`, 'unit', 'String');
        prop(s, 'Class.ownedAttributes', `p_${s}_status`, 'status', 'SensorStatus');
        add(`gen_${s}`, { meta: 'Generalization', refs: { 'Generalization.general': ['Sensor'] } });
        push(s, 'Classifier.generalizations', `gen_${s}`);
    }

    // The object level: dji, every slot but vmax; wau1 and its two sensors.
    const slot = (inst: string, id: string, feature: string, ...values: Obj[]) => {
        const ids = values.map((v, i) => { add(`${id}_v${i}`, v); return `${id}_v${i}`; });
        add(id, { meta: 'Slot', refs: { 'Slot.definingFeature': [feature], 'Slot.values': ids } });
        push(inst, 'InstanceSpecification.slots', id);
    };
    const int = (n: number): Obj => ({ meta: 'LiteralInteger', attrs: { 'LiteralInteger.value': n } });
    const ref = (target: string): Obj => ({ meta: 'InstanceValue', refs: { 'InstanceValue.instance': [target] } });
    add('dji', { meta: 'InstanceSpecification', name: 'dji', refs: { 'InstanceSpecification.classifier': ['Drone'] } });
    slot('dji', 's_dji_distance', 'p_Drone_distance', int(0));
    slot('dji', 's_dji_speed', 'p_Drone_speed', int(0));
    slot('dji', 's_dji_power', 'p_Drone_power', int(0));
    slot('dji', 's_dji_battery', 'p_Drone_battery', int(80));
    slot('dji', 's_dji_plugged', 'p_Charging_plugged', { meta: 'LiteralBoolean', attrs: { 'LiteralBoolean.value': true } });
    slot('dji', 's_dji_altitude', 'p_Flying_altitude', int(7));
    slot('dji', 's_dji_wau', 'p_Drone_wau', ref('wau1'));
    add('wau1', { meta: 'InstanceSpecification', name: 'wau1', refs: { 'InstanceSpecification.classifier': ['WeatherAssessmentUnit'] } });
    slot('wau1', 's_wau1_sensors', 'p_WAU_ownedSensors', ref('temp1'), ref('wind1'));
    add('temp1', { meta: 'InstanceSpecification', name: 'temp1', refs: { 'InstanceSpecification.classifier': ['TempSensor'] } });
    slot('temp1', 's_temp1_value', 'p_TempSensor_value', int(20));
    slot('temp1', 's_temp1_unit', 'p_TempSensor_unit', { meta: 'LiteralString', attrs: { 'LiteralString.value': 'C' } });
    slot('temp1', 's_temp1_status', 'p_TempSensor_status', ref('lit_Fault'));
    add('wind1', { meta: 'InstanceSpecification', name: 'wind1', refs: { 'InstanceSpecification.classifier': ['WindSensor'] } });
    slot('wind1', 's_wind1_speed', 'p_WindSensor_speed', int(4));
    slot('wind1', 's_wind1_unit', 'p_WindSensor_unit', { meta: 'LiteralString', attrs: { 'LiteralString.value': 'm/s' } });
    slot('wind1', 's_wind1_status', 'p_WindSensor_status', ref('lit_OK'));
    return m;
}

function viewOf(m: Model): DcnReadView {
    return {
        objects: () => Object.keys(m),
        metaclassOf: id => m[id]?.meta,
        referenceTargets: (id, r) => [...(m[id]?.refs?.[r] ?? [])],
        attributeValue: (id, attr) => m[id]?.attrs?.[attr],
        ownerOf: f => (f.includes('.') ? f.split('.')[0] : undefined),
        conformsTo,
        nameOf: id => m[id]?.name,
    };
}

/** A `buildEvalContext`-shaped record: a linguistic pool handle per object, the names at the top. */
function snapshotOf(m: Model): SimSnapshot {
    const instances = Object.entries(m).map(([id, o]) => ({ __type: 'Object', id, name: o.name ?? id, metaclass: o.meta }));
    const globals: Record<string, JjelValue> = { instances };
    for (const h of instances) if (m[h.id].name) globals[h.name] = h;
    return freezeSnapshot(globals, { id: 'drone', name: 'Drones' });
}

interface Fixture { m: Model; input: DcnCompileInput; compiled: DcnCompiled; model: DcnModel; snapshot: SimSnapshot }

function fixture(edit?: (m: Model) => void): Fixture {
    const m = droneModel();
    edit?.(m);
    const input: DcnCompileInput = { modelId: 'drone', stc: STC, binding: BINDING, view: viewOf(m), features: FEATURES };
    const compiled = compileDcn(input);
    return { m, input, compiled, model: readDcnModel(input, compiled, { upper: UPPER }), snapshot: snapshotOf(m) };
}

/** σ: the initial one, with some slots of some instances overwritten. */
function sigma(f: Fixture, over: Record<string, Record<string, SimValue>> = {}): SimState {
    const attrs = new Map([...f.compiled.net.initial.attrs].map(([i, a]) => [i, new Map(a)]));
    for (const [i, values] of Object.entries(over)) for (const [k, v] of Object.entries(values)) attrs.get(i)!.set(k, v);
    return { ...f.compiled.net.initial, attrs };
}

const idOf = (c: DcnCompiled, instance: string, element: string) =>
    [...c.entries.values()].find(e => e.instance === instance && e.element === element)!.id;

const EVALUATOR = new JjelEvaluator();

function guardCtx(f: Fixture, binding: DcnBinding, site: string): EvaluationContext {
    const ctx = buildGuardContext(f.snapshot, { transitionId: site }, { event: null }, undefined, undefined, binding);
    expect(ctx).not.toBeNull();
    return ctx!;
}

/** The value of `text` with `self` the instance `site` stands for. */
function value(f: Fixture, binding: DcnBinding, site: string, text: string): JjelValue {
    const parsed = parseExpressionStrict(text);
    expect(parsed.errors).toEqual([]);
    return EVALUATOR.evaluate(parsed.expression!, guardCtx(f, binding, site));
}

/**
 * A guard parsed, not passed through the Petri subset checker: that checker
 * rejects `.in(V::D)` (E-CALL, subsetChecker.ts), and the DCN guard compiler is
 * the step lane's (L4.4). The tri-state is `evaluateGuard`'s, unchanged.
 */
function dcnGuard(text: string): CompiledGuard {
    const parsed = parseExpressionStrict(text);
    expect(parsed.errors).toEqual([]);
    return { source: text, expr: parsed.expression!, diagnostics: [], defect: null };
}

function guard(f: Fixture, binding: DcnBinding, site: string, text: string): GuardOutcome {
    return evaluateGuard(dcnGuard(text), guardCtx(f, binding, site));
}

const TRUE: GuardOutcome = { kind: 'true' };
const FALSE: GuardOutcome = { kind: 'false' };

// ── tests ────────────────────────────────────────────────────────────────────

describe('dcnHandles: the handle of an instance reads σ (R-DCN-12, R-DCN-3)', () => {
    it('self.battery is the slot of σ, not of the model, on the transition site and on the instance (mutant: handles built from the initial σ)', () => {
        const f = fixture();
        const b = bindDcn(f.model, sigma(f), f.snapshot);
        const takeOff = idOf(f.compiled, 'dji', 'op_Ready_takeOff');
        expect(value(f, b, takeOff, 'self.battery')).toBe(80);
        expect(value(f, b, 'dji', 'self.battery')).toBe(80);
        expect(guard(f, b, takeOff, 'self.battery == 80')).toEqual(TRUE);
        const later = bindDcn(f.model, sigma(f, { dji: { battery: 42 } }), f.snapshot);
        expect(value(f, later, takeOff, 'self.battery')).toBe(42);
        expect(value(f, later, takeOff, 'self.vmax')).toBe(15);
    });

    it('a dormant slot reads its value: W1 is static (mutant: dormant slots left off the handle)', () => {
        const f = fixture();
        const b = bindDcn(f.model, sigma(f, { dji: { altitude: 9 } }), f.snapshot);
        expect(f.compiled.slots.get('dji')!.get('altitude')!.dormantOwner).toBe('Flying');
        expect(value(f, b, 'dji', 'self.in(Mode::Flying)')).toBe(false);
        expect(value(f, b, 'dji', 'self.altitude')).toBe(9);
        expect(value(f, b, 'dji', 'self.plugged')).toBe(true);
    });

    it('the name and the classifier are readable; the handle is frozen and σ is not written', () => {
        const f = fixture();
        const s = sigma(f);
        const before = JSON.stringify([...s.attrs].map(([i, a]) => [i, [...a]]));
        const b = bindDcn(f.model, s, f.snapshot);
        expect(value(f, b, 'dji', 'self.name')).toBe('dji');
        expect(value(f, b, 'dji', 'self.classifier.name')).toBe('Drone');
        expect(value(f, b, 'dji', 'self.id')).toBe('dji');
        expect(Object.isFrozen(b.handles.get('dji'))).toBe(true);
        expect(JSON.stringify([...s.attrs].map(([i, a]) => [i, [...a]]))).toBe(before);
    });

    it('associations navigate to the handles of the linked instances, single or many by the upper bound (mutants: links left as σ names, every link a list)', () => {
        const f = fixture();
        const b = bindDcn(f.model, sigma(f, { temp1: { status: 'OK' } }), f.snapshot);
        expect(value(f, b, 'dji', 'self.wau.name')).toBe('wau1');
        expect(value(f, b, 'dji', 'self.wau.ownedSensors.size')).toBe(2);
        expect(value(f, b, 'dji', 'forall s in self.wau.ownedSensors : s.name')).toEqual(['temp1', 'wind1']);
        // the linked handles read σ too: temp1's status is the overwritten one, not the model's Fault
        expect(value(f, b, 'dji', 'self.wau.ownedSensors.first.status')).toBe('OK');
        expect(value(f, b, 'dji', 'self.wau.ownedSensors.first')).toBe(b.handles.get('temp1'));
    });

    it('named instances are the handles too, below self, event and model', () => {
        const f = fixture();
        const b = bindDcn(f.model, sigma(f), f.snapshot);
        expect(value(f, b, 'dji', 'wau1.ownedSensors.last.speed')).toBe(4);
        expect(value(f, b, 'dji', 'temp1.in(Health::Faulty)')).toBe(true);
        expect(value(f, b, 'temp1', 'self.name')).toBe('temp1');
        expect(value(f, b, 'dji', 'model.name')).toBe('Drones');
    });

    it('a name two instances share binds neither: the snapshot keeps it (mutant: the first one wins)', () => {
        const f = fixture(m => {
            m.dji2 = { meta: 'InstanceSpecification', name: 'dji', refs: { 'InstanceSpecification.classifier': ['Drone'] } };
        });
        const b = bindDcn(f.model, sigma(f), f.snapshot);
        expect(b.named.dji).toBeUndefined();
        expect(b.named.wau1).toBe(b.handles.get('wau1'));
        expect(guard(f, b, 'wau1', 'dji.battery == 80')).toMatchObject({ kind: 'defect', reason: 'absent-identifier' });
        expect(value(f, b, 'dji2', 'self.battery')).toBe(0);
    });
});

describe('dcnHandles: the classification accessor (R-DCN-2, R-DCN-7, R-DCN-17)', () => {
    it('DJI at distance 0, speed 0, battery 80 is Charging and not Ready (mutant: the invariant read off another class)', () => {
        const f = fixture();
        const b = bindDcn(f.model, sigma(f), f.snapshot);
        expect(guard(f, b, 'dji', 'self.in(Mode::Charging)')).toEqual(TRUE);
        expect(guard(f, b, 'dji', 'self.in(Mode::Ready)')).toEqual(FALSE);
        expect(guard(f, b, 'dji', 'self.in(Mode::Flying)')).toEqual(FALSE);
        expect(guard(f, b, 'dji', 'self.in(Mode::Empty)')).toEqual(FALSE);
    });

    it('the classification is derived from σ: battery 100 is Ready, battery 0 is Empty and Charging at once (mutant: the memo outlives σ)', () => {
        const f = fixture();
        const first = bindDcn(f.model, sigma(f), f.snapshot);
        expect(first.classification.isIn(first.handles.get('dji'), 'Mode', 'Charging')).toBe(true);
        const full = bindDcn(f.model, sigma(f, { dji: { battery: 100 } }), f.snapshot);
        expect(guard(f, full, 'dji', 'self.in(Mode::Ready) and not self.in(Mode::Charging)')).toEqual(TRUE);
        const empty = bindDcn(f.model, sigma(f, { dji: { battery: 0 } }), f.snapshot);
        expect(guard(f, empty, 'dji', 'self.in(Mode::Empty) and self.in(Mode::Charging)')).toEqual(TRUE);
        expect(guard(f, empty, 'dji', 'self.in(Mode::Ready) or self.in(Mode::Flying)')).toEqual(FALSE);
    });

    it('a viewpoint of a general classifies the instance (R-DCN-17; mutant: the generalization not followed)', () => {
        const f = fixture();
        const b = bindDcn(f.model, sigma(f), f.snapshot);
        expect(guard(f, b, 'temp1', 'self.in(Health::Faulty)')).toEqual(TRUE);
        expect(guard(f, b, 'wind1', 'self.in(Health::Nominal)')).toEqual(TRUE);
    });

    it('an unknown viewpoint, an unknown class, a viewpoint of another static class: exception (mutant: false for a name not found)', () => {
        const f = fixture();
        const b = bindDcn(f.model, sigma(f), f.snapshot);
        const unknownVp = guard(f, b, 'dji', 'self.in(Moods::Charging)');
        expect(unknownVp).toMatchObject({ kind: 'defect', reason: 'exception' });
        expect((unknownVp as any).detail).toContain('Moods');
        const unknownDc = guard(f, b, 'dji', 'self.in(Mode::Docked)');
        expect(unknownDc).toMatchObject({ kind: 'defect', reason: 'exception' });
        expect((unknownDc as any).detail).toContain('Docked');
        expect(guard(f, b, 'temp1', 'self.in(Mode::Charging)')).toMatchObject({ kind: 'defect', reason: 'exception' });
        expect(guard(f, b, 'dji', 'self.in(Health::Faulty)')).toMatchObject({ kind: 'defect', reason: 'exception' });
        expect(() => b.classification.isIn({ id: 'dji' }, 'Mode', 'Charging')).toThrow(/not a DCN instance/);
    });

    it('a cycle of classification reads (W2 violated) throws naming the cycle instead of recursing (mutant: no cycle check, a stack overflow)', () => {
        const f = fixture(m => {
            m.Charging.attrs!['DynamicClass.invariant'] = 'self.in(Mode::Ready)';
            m.Ready.attrs!['DynamicClass.invariant'] = 'not self.in(Mode::Charging)';
        });
        const b = bindDcn(f.model, sigma(f), f.snapshot);
        const out = guard(f, b, 'dji', 'self.in(Mode::Charging)');
        expect(out).toMatchObject({ kind: 'defect', reason: 'exception' });
        expect((out as any).detail).toContain('dji in Mode::Charging -> dji in Mode::Ready -> dji in Mode::Charging');
        expect((out as any).detail).not.toContain('RangeError');
        // the cycle leaves no stale entry: a read outside it still answers
        expect(guard(f, b, 'dji', 'self.in(Mode::Empty)')).toEqual(FALSE);
    });

    it('an acyclic read of another class is not a cycle, and is answered once per σ (memo per instance and class)', () => {
        const f = fixture(m => { m.Empty.attrs!['DynamicClass.invariant'] = 'self.battery == 0 and self.in(Mode::Charging)'; });
        const empty = bindDcn(f.model, sigma(f, { dji: { battery: 0 } }), f.snapshot);
        expect(guard(f, empty, 'dji', 'self.in(Mode::Empty) and self.in(Mode::Charging) and self.in(Mode::Empty)')).toEqual(TRUE);
    });

    it('an invariant that throws, reads an absent name, or is not a boolean is an exception of the guard', () => {
        const f = fixture(m => {
            m.Ready.attrs!['DynamicClass.invariant'] = 'self.nope == 1';
            m.Flying.attrs!['DynamicClass.invariant'] = 'self.battery';
            m.Empty.attrs!['DynamicClass.invariant'] = '';
        });
        const b = bindDcn(f.model, sigma(f), f.snapshot);
        expect(guard(f, b, 'dji', 'self.in(Mode::Ready)')).toMatchObject({ kind: 'defect', reason: 'exception' });
        const number = guard(f, b, 'dji', 'self.in(Mode::Flying)');
        expect(number).toMatchObject({ kind: 'defect', reason: 'exception' });
        // the accessor's own message, not the evaluator's check on its answer
        expect((number as any).detail).toContain('dji in Mode::Flying: the invariant is');
        const none = guard(f, b, 'dji', 'self.in(Mode::Empty)');
        expect(none).toMatchObject({ kind: 'defect', reason: 'exception' });
        expect((none as any).detail).toContain('has no invariant');
        expect(guard(f, b, 'dji', 'self.in(Mode::Charging)')).toEqual(TRUE);
    });
});

describe('dcnHandles: watches and board outputs read the same handles (evaluateOutput)', () => {
    const scope = (f: Fixture) => ({ net: f.compiled.net, snapshot: f.snapshot });

    it('a watch over self.battery, self an instance; a named instance with self the model (mutant: the binding ignored)', () => {
        const f = fixture();
        const s = sigma(f, { dji: { battery: 30 } });
        const b = bindDcn(f.model, s, f.snapshot);
        const watch = compileOutput('self.battery > 50', scope(f));
        expect(watch.defect).toBeNull();
        expect(evaluateOutput(watch, f.snapshot, f.compiled.net, s, { binding: b, self: 'dji' })).toEqual({ kind: 'value', value: false });
        const full = sigma(f, { dji: { battery: 90 } });
        expect(evaluateOutput(watch, f.snapshot, f.compiled.net, full, { binding: bindDcn(f.model, full, f.snapshot), self: 'dji' })).toEqual({ kind: 'value', value: true });
        const named = compileOutput('dji.battery', scope(f));
        expect(evaluateOutput(named, f.snapshot, f.compiled.net, s, { binding: b })).toEqual({ kind: 'value', value: 30 });
        // compileOutput refuses `.in` (the subset checker, E-CALL): the output is built from the parse, as dcnGuard does
        expect(compileOutput('dji.in(Mode::Charging)', scope(f)).defect).toMatchObject({ code: 'subset', short: 'E-CALL' });
        const cls = { source: 'dji.in(Mode::Charging)', expr: dcnGuard('dji.in(Mode::Charging)').expr, defect: null };
        expect(evaluateOutput(cls, f.snapshot, f.compiled.net, s, { binding: b })).toEqual({ kind: 'value', value: true });
        expect(evaluateOutput(cls, f.snapshot, f.compiled.net, s)).toMatchObject({ kind: 'defect' });
    });

    it('a self that is no DCN instance is a defect, not an exception', () => {
        const f = fixture();
        const b = bindDcn(f.model, sigma(f), f.snapshot);
        const watch = compileOutput('self.battery > 50', scope(f));
        expect(evaluateOutput(watch, f.snapshot, f.compiled.net, sigma(f), { binding: b, self: 'nobody' })).toMatchObject({ kind: 'defect' });
    });
});

describe('dcnHandles: parity, without the binding nothing changes', () => {
    it('buildGuardContext: a DCN site has no pool handle, self is the pool handle, and .in is unbound', () => {
        const f = fixture();
        expect(buildGuardContext(f.snapshot, { transitionId: idOf(f.compiled, 'dji', 'op_Ready_takeOff') }, { event: null })).toBeNull();
        const ctx = buildGuardContext(f.snapshot, { transitionId: 'dji' }, { event: null })!;
        expect(EVALUATOR.evaluate(parseExpressionStrict('self').expression!, ctx)).toBe(f.snapshot.handleById.get('dji'));
        expect(evaluateGuard(compileGuard('self.in(Mode::Charging)'), ctx)).toMatchObject({ kind: 'defect', reason: 'subset' });
        const unbound = evaluateGuard(dcnGuard('self.in(Mode::Charging)'), ctx);
        expect(unbound).toMatchObject({ kind: 'defect', reason: 'exception' });
        expect((unbound as any).detail).toContain('classification is not bound here');
        expect(evaluateGuard(compileGuard('self.battery == 80'), ctx)).toMatchObject({ kind: 'defect', reason: 'absent-identifier' });
        // an event with no pool handle is still a null context
        expect(buildGuardContext(f.snapshot, { transitionId: 'dji' }, { event: 'dcn-tick' })).toBeNull();
    });

    it('with the binding, an event with no pool handle (a press) is null, not a missing context', () => {
        const f = fixture();
        const b = bindDcn(f.model, sigma(f), f.snapshot);
        const ctx = buildGuardContext(f.snapshot, { transitionId: 'dji' }, { event: 'dcn-tick' }, undefined, undefined, b);
        expect(ctx).not.toBeNull();
        expect(EVALUATOR.evaluate(parseExpressionStrict('event').expression!, ctx!)).toBeNull();
        expect(buildGuardContext(f.snapshot, { transitionId: 'nobody' }, { event: null }, undefined, undefined, b)).toBeNull();
    });

    it('evaluateOutput: dji is the pool handle, which has no battery', () => {
        const f = fixture();
        const out = compileOutput('dji.battery', { net: f.compiled.net, snapshot: f.snapshot });
        expect(evaluateOutput(out, f.snapshot, f.compiled.net, sigma(f))).toMatchObject({ kind: 'defect' });
    });
});
