/**
 * dcnStep — the DCN nucleus over the placeless net (P-2026-11-07-1432,
 * continued by P-2026-11-07-1455; R-DCN-2, R-DCN-3, R-DCN-4, R-DCN-11,
 * R-DCN-12, R-SIM-17; spec §6).
 *
 * The view is the synthetic drone model of dcnHandles.test.ts, copied (a test
 * file is not imported by another), plus what the cycle needs: Alert invariants
 * on the wind speed with a gap at 20, a static `gust` of the wind sensor, a
 * static `land` of the drone and its redefinition in Flying; a viewpoint `Link`
 * with a monitor `ping` is added by the tests of the two policies. Each test
 * names the mutant of dcnStep.ts that kills it (the bench is in the commit).
 */

import { describe, it, expect } from 'vitest';
import type { JjelValue } from '../../../../jjel/evaluator';
import { encodeRoleValues } from '../../roleCatalog';
import { dcnStcFromRoles } from '../dcnRoles';
import type { DcnStc } from '../dcnRoles';
import { compileDcn, DCN_TICK_EVENT } from '../dcnCompile';
import type { DcnCompileInput, DcnCompiled, DcnReadView } from '../dcnCompile';
import { readDcnModel } from '../dcnHandles';
import type { DcnModel } from '../dcnHandles';
import { DCN_SYNC_SELECTOR, dcnNucleus, readDcnStep } from '../dcnStep';
import type { DcnNucleus, DcnPolicy } from '../dcnStep';
import { freezeSnapshot } from '../../guardContext';
import type { SimSnapshot } from '../../guardContext';
import { compileGuard } from '../../guardEvaluator';
import { compileOutput } from '../../boardOutputs';
import { step } from '../../netStep';
import { petriNucleus } from '../../../../components/editor-v2/sim/simNucleus';
import type { CompiledNet, GuardOracle, ActionOracle, SimState, SimValue, StepOutcome } from '../../netTypes';
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

const WIND = 'self.ownedSensors.last.speed';

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

    // Drone and its viewpoint Mode (chapter Fig. 6), with a link to its weather unit; `land` redefined in Flying.
    add('Drone', { meta: 'StaticClass', name: 'Drone', attrs: { 'Classifier.isAbstract': false } });
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_distance', 'distance', 'Integer');
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_speed', 'speed', 'Integer');
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_power', 'power', 'Integer');
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_battery', 'battery', 'Integer', { 'Property.rangeMin': 0, 'Property.rangeMax': 100 });
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_vmax', 'vmax', 'Integer', { 'Property.defaultValue': '15' });
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_wau', 'wau', 'WeatherAssessmentUnit', { [UPPER]: 1 });
    op('Drone', 'Class.ownedOperations', 'op_Drone_land', 'land', ['self.speed := 0']);
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
    op('Flying', 'DynamicClass.operations', 'op_Flying_land', 'land', ['self.distance := 0']);
    push('op_Flying_land', 'Operation.redefines', 'op_Drone_land');
    monitor('Flying', 'mon_Flying_drain', 'drain', ['self.battery := self.battery - 1', 'self.distance := self.distance + self.speed']);
    prop('Flying', 'DynamicClass.attributes', 'p_Flying_altitude', 'altitude', 'Integer', { 'Property.rangeMin': 0, 'Property.rangeMax': 120 });
    dyn('Mode', 'Empty', 'self.battery == 0');

    // WeatherAssessmentUnit and Alert on the last sensor's speed, with a gap at 20.
    add('WeatherAssessmentUnit', { meta: 'StaticClass', name: 'WeatherAssessmentUnit' });
    prop('WeatherAssessmentUnit', 'Class.ownedAttributes', 'p_WAU_ownedSensors', 'ownedSensors', 'Sensor', { [UPPER]: -1 });
    add('Alert', { meta: 'Viewpoint', name: 'Alert', attrs: { 'Viewpoint.isOverlapping': false, 'Viewpoint.isComplete': true } });
    push('WeatherAssessmentUnit', 'StaticClass.viewpoints', 'Alert');
    dyn('Alert', 'Safe', `${WIND} < 10`);
    dyn('Alert', 'Moderate', `${WIND} >= 10 and ${WIND} < 20`);
    dyn('Alert', 'Adverse', `${WIND} > 20`);

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
    op('WindSensor', 'Class.ownedOperations', 'op_WindSensor_gust', 'gust', ['self.speed := self.speed + 8']);

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

/** A second viewpoint of Drone, `Link`, whose one class `Online` always holds and whose monitor `ping` copies the battery. */
function withLink(body: string = 'self.power := self.battery') {
    return (m: Model) => {
        m.Link = { meta: 'Viewpoint', name: 'Link', refs: { 'Viewpoint.classes': ['Online'] } };
        m.Drone.refs!['StaticClass.viewpoints'].push('Link');
        m.Online = { meta: 'DynamicClass', name: 'Online', attrs: { 'DynamicClass.invariant': 'true' }, refs: { 'DynamicClass.monitors': ['mon_Online_ping'] } };
        m.mon_Online_ping = { meta: 'Monitor', name: 'ping', attrs: { 'Monitor.body': [body] } };
    };
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

function snapshotOf(m: Model): SimSnapshot {
    const instances = Object.entries(m).map(([id, o]) => ({ __type: 'Object', id, name: o.name ?? id, metaclass: o.meta }));
    const globals: Record<string, JjelValue> = { instances };
    for (const h of instances) if (m[h.id].name) globals[h.name] = h;
    return freezeSnapshot(globals, { id: 'drone', name: 'Drones' });
}

interface Fixture { input: DcnCompileInput; compiled: DcnCompiled; model: DcnModel; snapshot: SimSnapshot }

function fixture(edit?: (m: Model) => void): Fixture {
    const m = droneModel();
    edit?.(m);
    const input: DcnCompileInput = { modelId: 'drone', stc: STC, binding: BINDING, view: viewOf(m), features: FEATURES };
    const compiled = compileDcn(input);
    return { input, compiled, model: readDcnModel(input, compiled, { upper: UPPER }), snapshot: snapshotOf(m) };
}

const nucleus = (f: Fixture, policy: DcnPolicy = 'interleave'): DcnNucleus =>
    dcnNucleus(readDcnStep(f.input, f.model), f.snapshot, policy);

function sigma(f: Fixture, over: Record<string, Record<string, SimValue>> = {}): SimState {
    const attrs = new Map([...f.compiled.net.initial.attrs].map(([i, a]) => [i, new Map(a)]));
    for (const [i, values] of Object.entries(over)) for (const [k, v] of Object.entries(values)) attrs.get(i)!.set(k, v);
    return { ...f.compiled.net.initial, attrs };
}

const idOf = (c: DcnCompiled, instance: string, element: string) =>
    [...c.entries.values()].find(e => e.instance === instance && e.element === element)!.id;

const read = (s: SimState, instance: string, attr: string) => s.attrs.get(instance)?.get(attr);

/** One step on `event`, the selector `pick` or the first candidate (Interleave), the one Sync candidate otherwise. */
function press(n: DcnNucleus, state: SimState, event: string | null, pick?: string): StepOutcome {
    const cs = n.candidates({ state, event }, n.guards);
    const selector = pick ?? cs.candidates[0]?.transition ?? null;
    return n.step({ state, event }, selector, n.guards, n.actions);
}

function fired(out: StepOutcome): SimState {
    expect(out.kind === 'halted' ? out.reason : out.kind).toBe('fired');
    return (out as Extract<StepOutcome, { kind: 'fired' }>).next.state;
}

const reasonOf = (out: StepOutcome) => (out.kind === 'halted' ? out.reason : null);

// ── the operational cycle (spec §6) ──────────────────────────────────────────

describe('dcnStep: the cycle Charging, Ready, Flying, Empty (R-DCN-2)', () => {
    it('the Charging monitor raises the battery tick by tick to 100, then Mode is Ready and the next tick is a discard (mutant: classifiedAs ignored, a 101 domain halt)', () => {
        const f = fixture();
        const n = nucleus(f);
        const charge = idOf(f.compiled, 'dji', 'mon_Charging_charge');
        let s = n.initial;
        expect(n.classify(s).classes.get('dji')!.get('Mode')).toEqual(['Charging']);
        for (let i = 0; i < 20; i++) {
            const out = press(n, s, DCN_TICK_EVENT);
            expect(out.kind === 'fired' && out.label.candidates).toEqual([charge]);
            s = fired(out);
        }
        expect(read(s, 'dji', 'battery')).toBe(100);
        expect(n.classify(s).classes.get('dji')!.get('Mode')).toEqual(['Ready']);
        const after = press(n, s, DCN_TICK_EVENT);
        expect(after.kind).toBe('discard');
        expect(after.kind !== 'inadmissible' && after.next.state).toBe(s);
    });

    it('takeOff is a discard in Charging and fires in Ready, to Flying; the redefinition is no input of its own (mutants: classifiedAs ignored, the redefinition not re-triggered)', () => {
        const f = fixture();
        const n = nucleus(f);
        const takeOff = idOf(f.compiled, 'dji', 'op_Ready_takeOff');
        expect(press(n, n.initial, takeOff).kind).toBe('discard');
        const s = fired(press(n, sigma(f, { dji: { battery: 100 } }), takeOff));
        expect(read(s, 'dji', 'speed')).toBe(1);
        expect(n.classify(s).classes.get('dji')!.get('Mode')).toEqual(['Flying']);
        const events = n.structuralInputs(n.initial).events;
        expect(events.has(takeOff)).toBe(true);
        expect(events.has(DCN_TICK_EVENT)).toBe(true);
        expect(events.has(idOf(f.compiled, 'dji', 'op_Drone_land'))).toBe(true);
        expect(events.has(idOf(f.compiled, 'dji', 'op_Flying_land'))).toBe(false);
    });

    it('the Flying monitor drains the battery to 0 in 100 ticks, then Mode is Empty and the next tick is a discard (mutant: the binding read off the initial σ)', () => {
        const f = fixture();
        const n = nucleus(f);
        let s = fired(press(n, sigma(f, { dji: { battery: 100 } }), idOf(f.compiled, 'dji', 'op_Ready_takeOff')));
        for (let i = 0; i < 100; i++) s = fired(press(n, s, DCN_TICK_EVENT));
        expect(read(s, 'dji', 'battery')).toBe(0);
        expect(read(s, 'dji', 'distance')).toBe(100);
        expect(n.classify(s).classes.get('dji')!.get('Mode')).toEqual(['Empty']);
        expect(press(n, s, DCN_TICK_EVENT).kind).toBe('discard');
    });
});

describe('dcnStep: completeness and exclusivity after the step (spec §6)', () => {
    it('two gusts take the wind to 12, Moderate, then to 20, in no Alert class: halted unclassified, σ unchanged (mutants: no completeness check, the halt keeps σ′)', () => {
        const f = fixture();
        const n = nucleus(f);
        const gust = idOf(f.compiled, 'wind1', 'op_WindSensor_gust');
        const s = fired(press(n, n.initial, gust));
        expect(read(s, 'wind1', 'speed')).toBe(12);
        expect(n.classify(s).classes.get('wau1')!.get('Alert')).toEqual(['Moderate']);
        const out = press(n, s, gust);
        expect(reasonOf(out)).toEqual({ kind: 'unclassified', element: 'wau1', viewpoint: 'Alert' });
        expect(out.kind === 'halted' && out.next).toEqual({ state: s, event: null });
        expect(out.kind === 'halted' && out.label.assignments).toEqual([]);
    });

    it('an invariant that throws is unclassified with a detail (mutant: the detail dropped)', () => {
        const f = fixture(m => { m.Faulty.attrs!['DynamicClass.invariant'] = 'self.nope == 1'; });
        const n = nucleus(f);
        const reason = reasonOf(press(n, n.initial, DCN_TICK_EVENT));
        expect(reason).toMatchObject({ kind: 'unclassified', element: 'temp1', viewpoint: 'Health' });
        expect((reason as any).detail).toContain('nope');
    });

    it('two classes of the non-overlapping Alert at once: halted ambiguous, classes in model order; the overlapping Mode may hold two (mutants: no exclusivity check, overlapping ignored)', () => {
        const f = fixture(m => { m.Moderate.attrs!['DynamicClass.invariant'] = `${WIND} < 20`; });
        const n = nucleus(f);
        expect(reasonOf(press(n, n.initial, DCN_TICK_EVENT))).toEqual({ kind: 'ambiguous', element: 'wau1', viewpoint: 'Alert', classes: ['Safe', 'Moderate'] });
        const g = fixture();
        const both = nucleus(g).classify(sigma(g, { dji: { battery: 0 } }));
        expect(both.classes.get('dji')!.get('Mode')).toEqual(['Charging', 'Empty']);
        expect(both.halt).toBeNull();
    });

    it('the order of the halts: domain, then unclassified on every instance, then ambiguous (mutant: the two passes merged per instance)', () => {
        const edit = (charge: string) => (m: Model) => {
            m.Moderate.attrs!['DynamicClass.invariant'] = `${WIND} < 20`;
            m.Faulty.attrs!['DynamicClass.invariant'] = 'false';
            m.mon_Charging_charge.attrs!['Monitor.body'] = [charge];
        };
        const f = fixture(edit('self.battery := self.battery + 30'));
        expect(reasonOf(press(nucleus(f), f.compiled.net.initial, DCN_TICK_EVENT))).toEqual({ kind: 'domain', element: 'dji', attr: 'battery', value: 110 });
        const g = fixture(edit('self.battery := self.battery + 1'));
        // wau1, ambiguous, comes before temp1 in model order: the completeness pass runs over every instance first
        expect(reasonOf(press(nucleus(g), g.compiled.net.initial, DCN_TICK_EVENT))).toEqual({ kind: 'unclassified', element: 'temp1', viewpoint: 'Health' });
    });
});

// ── Interleave and Sync (R-DCN-4) ────────────────────────────────────────────

describe('dcnStep: Interleave and Sync of one tick with two viewpoints contributing', () => {
    it('Interleave: one contribution per step, charge or ping; Sync: both in one parallel assignment on the previous σ (mutant: Sync fires the first candidate only)', () => {
        const f = fixture(withLink());
        const charge = idOf(f.compiled, 'dji', 'mon_Charging_charge');
        const ping = idOf(f.compiled, 'dji', 'mon_Online_ping');
        const n = nucleus(f);
        expect(n.candidates({ state: n.initial, event: DCN_TICK_EVENT }, n.guards).candidates.map(c => c.transition)).toEqual([charge, ping]);
        const a = fired(press(n, n.initial, DCN_TICK_EVENT, charge));
        expect([read(a, 'dji', 'battery'), read(a, 'dji', 'power')]).toEqual([81, 0]);
        const b = fired(press(n, n.initial, DCN_TICK_EVENT, ping));
        expect([read(b, 'dji', 'battery'), read(b, 'dji', 'power')]).toEqual([80, 80]);

        const sync = nucleus(f, 'sync');
        expect(sync.candidates({ state: sync.initial, event: DCN_TICK_EVENT }, sync.guards).candidates.map(c => c.transition)).toEqual([DCN_SYNC_SELECTOR]);
        const out = press(sync, sync.initial, DCN_TICK_EVENT);
        const s = fired(out);
        expect([read(s, 'dji', 'battery'), read(s, 'dji', 'power')]).toEqual([81, 80]);
        expect(out.kind === 'fired' && out.label.candidates).toEqual([charge, ping]);
        expect(out.kind === 'fired' && out.label.selector).toBe(DCN_SYNC_SELECTOR);
        expect(sync.step({ state: sync.initial, event: DCN_TICK_EVENT }, charge, sync.guards, sync.actions).kind).toBe('inadmissible');
    });

    it('Interleave (SoSyM Definition 3): two consecutive ticks select the two monitors in either order, two trajectories (mutant: the selector ignored)', () => {
        const f = fixture(withLink());
        const charge = idOf(f.compiled, 'dji', 'mon_Charging_charge');
        const ping = idOf(f.compiled, 'dji', 'mon_Online_ping');
        const n = nucleus(f);
        const cp = fired(press(n, fired(press(n, n.initial, DCN_TICK_EVENT, charge)), DCN_TICK_EVENT, ping));
        expect([read(cp, 'dji', 'battery'), read(cp, 'dji', 'power')]).toEqual([81, 81]);
        const pc = fired(press(n, fired(press(n, n.initial, DCN_TICK_EVENT, ping)), DCN_TICK_EVENT, charge));
        expect([read(pc, 'dji', 'battery'), read(pc, 'dji', 'power')]).toEqual([81, 80]);
    });

    it('Sync: two writes of the battery in one step halt double-assignment, σ kept (R-SIM-17; mutant: Sync fires the first candidate only)', () => {
        const f = fixture(withLink('self.battery := self.battery + 2'));
        const n = nucleus(f, 'sync');
        const out = press(n, n.initial, DCN_TICK_EVENT);
        expect(reasonOf(out)).toEqual({ kind: 'double-assignment', element: 'dji', attr: 'battery' });
        expect(out.kind === 'halted' && out.next.state).toBe(n.initial);
    });

    it('a redefinition expands the invocation: Sync runs both, to Charging; Interleave may run the static one alone, unclassified (W5 gap, spec §5; mutant: the redefinition not re-triggered)', () => {
        const f = fixture();
        const land = idOf(f.compiled, 'dji', 'op_Drone_land');
        const flyingLand = idOf(f.compiled, 'dji', 'op_Flying_land');
        const flying = sigma(f, { dji: { battery: 50, speed: 1, distance: 5 } });
        const n = nucleus(f);
        expect(n.candidates({ state: flying, event: land }, n.guards).candidates.map(c => c.transition)).toEqual([land, flyingLand]);
        const sync = nucleus(f, 'sync');
        const s = fired(press(sync, flying, land));
        expect([read(s, 'dji', 'speed'), read(s, 'dji', 'distance')]).toEqual([0, 0]);
        expect(sync.classify(s).classes.get('dji')!.get('Mode')).toEqual(['Charging']);
        expect(reasonOf(press(n, flying, land, land))).toEqual({ kind: 'unclassified', element: 'dji', viewpoint: 'Mode' });
    });
});

// ── slots and state attributes, the subset mode, Petri ───────────────────────

describe('dcnStep: the slot marker is read before any lookup by name (L3.4 ticket)', () => {
    it('self.[battery] := 50 names a state attribute, and battery is a slot: halted undeclared, battery kept (mutant: marker check removed, 50 applied)', () => {
        const f = fixture(m => { m.mon_Charging_charge.attrs!['Monitor.body'] = ['self.[battery] := 50']; });
        const n = nucleus(f);
        const charge = idOf(f.compiled, 'dji', 'mon_Charging_charge');
        const out = press(n, n.initial, DCN_TICK_EVENT);
        expect(reasonOf(out)).toEqual({ kind: 'undeclared', site: { element: charge, role: 'transition' }, element: 'dji', attr: 'battery' });
        expect(out.kind === 'halted' && read(out.next.state, 'dji', 'battery')).toBe(80);
    });

    it('self.nope := 1 is a slot write of no slot: undeclared', () => {
        const f = fixture(m => { m.mon_Charging_charge.attrs!['Monitor.body'] = ['self.nope := 1']; });
        const n = nucleus(f);
        expect(reasonOf(press(n, n.initial, DCN_TICK_EVENT))).toMatchObject({ kind: 'undeclared', element: 'dji', attr: 'nope' });
    });
});

describe('dcnStep: the DCN subset mode (L4.3 ticket)', () => {
    it('compileGuard and compileOutput refuse .in with E-CALL without the mode, and accept it with { dcn: true }', () => {
        const f = fixture();
        const scope = { net: f.compiled.net, snapshot: f.snapshot };
        expect(compileGuard('self.in(Mode::Charging)').defect).toMatchObject({ reason: 'subset' });
        expect(compileGuard('self.in(Mode::Charging)').defect!.detail).toContain('E-CALL');
        expect(compileGuard('self.in(Mode::Charging) and self.battery > 0', { dcn: true }).defect).toBeNull();
        expect(compileOutput('dji.in(Mode::Charging)', scope).defect).toMatchObject({ code: 'subset', short: 'E-CALL' });
        expect(compileOutput('dji.in(Mode::Charging)', scope, { dcn: true }).defect).toBeNull();
    });

    it('a precondition that tests a class compiles in the mode and is evaluated on the classification', () => {
        const f = fixture(m => { m.op_Drone_land.attrs!['Operation.pre'] = 'self.in(Mode::Flying)'; });
        const n = nucleus(f);
        const land = idOf(f.compiled, 'dji', 'op_Drone_land');
        expect(press(n, n.initial, land).kind).toBe('discard');
        expect(fired(press(n, sigma(f, { dji: { battery: 50, speed: 1 } }), land, land)).attrs.get('dji')!.get('speed')).toBe(0);
    });
});

describe('dcnStep: the Petri nucleus is unchanged', () => {
    it('a hand net through petriNucleus steps as netStep.step', () => {
        const t = { id: 't', origin: ['t'], preset: [{ place: 'p', weight: 1 }], postset: [{ place: 'q', weight: 1 }], inhibitors: [], triggers: [], guardSites: [], elseOf: null, actionSites: [] };
        const net: CompiledNet = {
            modelId: 'm', places: new Set(['p', 'q']), transitions: [t], bound: 1, final: null, hasEventRole: false,
            attributes: [], declared: new Map(), initial: { marking: new Map([['p', 1]]), attrs: new Map(), presentation: new Map() }, defects: [],
        };
        const guards: GuardOracle = () => ({ kind: 'true' });
        const actions: ActionOracle = () => ({ kind: 'ok', assignments: [] });
        const cfg = { state: net.initial, event: null };
        const out = petriNucleus(net).step(cfg, 't', guards, actions);
        expect(out).toEqual(step(net, cfg, 't', guards, actions));
        expect(out.kind === 'fired' && [...out.next.state.marking]).toEqual([['q', 1]]);
    });
});
