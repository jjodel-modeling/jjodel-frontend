/**
 * dcnWellFormedness: W1..W4, W6, R-DCN-13 and R-DCN-16 on the drone (P-2026-11-07-1825; spec §5, R-DCN-23).
 *
 * The view is the synthetic drone model of dcnStep.test.ts, copied verbatim (a test file is not imported by
 * another). As copied it is not well formed, and one test says so: the static `land` writes `speed`, which Mode
 * writes (W6), and the viewpoint Health of the abstract Sensor reads `status`, which only the sensors declare, while
 * Sensor's `selfTest` assigns it (W1, W4). `cleanDrone` is the copy with the two fixes the chat ratified (F1, F2):
 * `speed := 0` moved from the static `land` into `Flying.land`, `status` declared once on Sensor. Every other test
 * mutates the clean drone and names the mutant of dcnWellFormedness.ts that kills it (the bench is in the commit).
 */

import { describe, it, expect } from 'vitest';
import { encodeRoleValues } from '../../simulation/roleCatalog';
import { dcnStcFromRoles } from '../../simulation/dcn/dcnRoles';
import type { DcnStc } from '../../simulation/dcn/dcnRoles';
import type { DcnReadView } from '../../simulation/dcn/dcnCompile';
import type { OntoBinding } from '../../ontological/bindingCodec';
import { checkDcnWellFormedness } from '../dcnWellFormedness';
import type { DcnDiagnostic, DcnRule } from '../dcnWellFormedness';

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

// ── the clean drone, the check, the edits ────────────────────────────────────

/** The drone with the fixes F1 and F2 (P-2026-11-07-1825). */
function cleanDrone(): Model {
    const m = droneModel();
    m.op_Drone_land.attrs!['Operation.body'] = [];
    m.op_Flying_land.attrs!['Operation.body'] = ['self.distance := 0', 'self.speed := 0'];
    m.p_Sensor_status = { meta: 'Property', name: 'status', refs: { 'TypedElement.type': ['SensorStatus'] } };
    (m.Sensor.refs!['Class.ownedAttributes'] ??= []).push('p_Sensor_status');
    for (const s of ['TempSensor', 'WindSensor']) {
        const owned = m[s].refs!['Class.ownedAttributes'];
        owned.splice(owned.indexOf(`p_${s}_status`), 1);
        delete m[`p_${s}_status`];
    }
    for (const slot of ['s_temp1_status', 's_wind1_status']) m[slot].refs!['Slot.definingFeature'] = ['p_Sensor_status'];
    return m;
}

const check = (m: Model): DcnDiagnostic[] =>
    checkDcnWellFormedness({ stc: STC, binding: BINDING, view: viewOf(m), features: FEATURES });

/** The clean drone with `edits` applied, checked. */
function mutated(...edits: Array<(m: Model) => void>): DcnDiagnostic[] {
    const m = cleanDrone();
    for (const e of edits) e(m);
    return check(m);
}

const rows = (ds: DcnDiagnostic[], rule?: DcnRule) => ds.filter(d => rule === undefined || d.rule === rule).map(d => `${d.rule} ${d.element}`).sort();
const messageOf = (ds: DcnDiagnostic[], rule: DcnRule, element: string) => ds.find(d => d.rule === rule && d.element === element)?.message ?? '';

const inv = (dc: string, text: string) => (m: Model) => { m[dc].attrs!['DynamicClass.invariant'] = text; };
const body = (element: string, ...actions: string[]) => (m: Model) => {
    const key = m[element].meta === 'Monitor' ? 'Monitor.body' : 'Operation.body';
    m[element].attrs![key] = actions;
};
const FLYING = 'self.battery > 0 and self.speed > 0';

/** A viewpoint `vp` of `owner` whose classes each have an invariant and, when given, one monitor `<class>Tick`. */
function viewpoint(owner: string, vp: string, classes: Array<{ id: string; inv: string; monitor?: string[] }>) {
    return (m: Model) => {
        m[vp] = { meta: 'Viewpoint', name: vp, refs: { 'Viewpoint.classes': classes.map(c => c.id) } };
        (m[owner].refs!['StaticClass.viewpoints'] ??= []).push(vp);
        for (const c of classes) {
            m[c.id] = { meta: 'DynamicClass', name: c.id, attrs: { 'DynamicClass.invariant': c.inv } };
            if (!c.monitor) continue;
            m[`mon_${c.id}`] = { meta: 'Monitor', name: `${c.id}Tick`, attrs: { 'Monitor.body': c.monitor } };
            m[c.id].refs = { 'DynamicClass.monitors': [`mon_${c.id}`] };
        }
    };
}

/** A monitor on an existing dynamic class. */
const monitorOn = (dc: string, id: string, actions: string[]) => (m: Model) => {
    m[id] = { meta: 'Monitor', name: id, attrs: { 'Monitor.body': actions } };
    (m[dc].refs ??= {});
    (m[dc].refs!['DynamicClass.monitors'] ??= []).push(id);
};

// ── the drone ────────────────────────────────────────────────────────────────

describe('dcnWellFormedness: the drone (spec §5)', () => {
    it('the clean drone gives no diagnostic, its instances included (mutants: own attributes or the static closure not visible, a same-name redefinition refused)', () => {
        expect(check(cleanDrone())).toEqual([]);
    });

    it('the drone of dcnStep.test.ts as it is: W6 on the static land, W1 on Faulty and Nominal, W4 on selfTest, all errors (mutant: the static write check dropped)', () => {
        const ds = check(droneModel());
        expect(rows(ds)).toEqual(['W1 Faulty', 'W1 Nominal', 'W4 op_Sensor_selfTest', 'W6 op_Drone_land']);
        expect(ds.every(d => d.severity === 'error' && d.message.length > 0)).toBe(true);
        expect(messageOf(ds, 'W6', 'op_Drone_land')).toBe(
            'The static operation land writes speed, which viewpoint Mode writes (takeOff, rampUp): a static operation writes only properties no viewpoint writes.');
        expect(ds.find(d => d.rule === 'W6')!.related).toEqual(['op_Ready_takeOff', 'op_Flying_rampUp']);
        expect(messageOf(ds, 'W1', 'Faulty')).toBe('The invariant of Faulty reads status, which is no feature of Sensor or of Faulty.');
        expect(messageOf(ds, 'W4', 'op_Sensor_selfTest')).toBe('The static operation selfTest assigns status, which is no feature of Sensor.');
    });
});

// ── W1 ───────────────────────────────────────────────────────────────────────

describe('dcnWellFormedness: W1, reads on self', () => {
    it('Flying reading an attribute of Charging with no guard is W1 on Flying, once per name (mutants: every dynamic attribute visible, no dedup)', () => {
        const ds = mutated(inv('Flying', `${FLYING} and self.plugged and not self.plugged`));
        expect(rows(ds)).toEqual(['W1 Flying']);
        expect(messageOf(ds, 'W1', 'Flying')).toBe(
            'The invariant of Flying reads plugged, an attribute of Charging (viewpoint Mode), with no guard self.in(Mode::Charging) in the same expression.');
    });

    it('the guard self.in(Mode::Charging) in the same expression admits the read, a guard on Ready does not (mutants: guard ignored, guard matched on the viewpoint only)', () => {
        // The guard tests a class of Flying's own viewpoint, which is also the W2 self-loop below: read W1 alone.
        expect(rows(mutated(inv('Flying', `${FLYING} and (not self.in(Mode::Charging) or self.plugged)`)), 'W1')).toEqual([]);
        expect(rows(mutated(inv('Flying', `${FLYING} and self.in(Mode::Ready) and self.plugged`)), 'W1')).toEqual(['W1 Flying']);
    });

    it('own attributes, inherited features and the handle members are visible, an unknown name is not (mutants: own attributes, inherited features, handle members)', () => {
        expect(mutated(inv('Flying', `${FLYING} and self.altitude >= 0 and self.name != ''`))).toEqual([]);
        expect(mutated(viewpoint('WindSensor', 'Gusts', [{ id: 'Gusty', inv: "self.speed > 15 and self.status == 'OK'" }]))).toEqual([]);
        const ds = mutated(inv('Flying', `${FLYING} and self.foo`));
        expect(messageOf(ds, 'W1', 'Flying')).toBe('The invariant of Flying reads foo, which is no feature of Drone or of Flying.');
    });

    it('preconditions, operation bodies and monitors are judged too (mutant: only invariants walked)', () => {
        const ds = mutated(
            m => { m.op_Flying_rampUp.attrs!['Operation.pre'] = 'self.speed < self.vmax and self.plugged'; },
            body('mon_Flying_drain', 'self.battery := self.battery - (if self.plugged then 0 else 1)'),
            body('op_Ready_takeOff', 'self.speed := self.altitude'),
        );
        expect(rows(ds)).toEqual(['W1 mon_Flying_drain', 'W1 op_Flying_rampUp', 'W1 op_Ready_takeOff']);
        expect(messageOf(ds, 'W1', 'op_Flying_rampUp')).toMatch(/^The precondition of rampUp reads plugged/);
        expect(messageOf(ds, 'W1', 'op_Ready_takeOff')).toMatch(/^The body of takeOff reads altitude, an attribute of Flying/);
    });

    it('a lambda variable named self hides self (mutant: shadowing ignored)', () => {
        expect(mutated(inv('Safe', `${WIND} < 10 and self.ownedSensors.all(self => self.status != 'Fault')`))).toEqual([]);
        expect(rows(mutated(inv('Safe', `${WIND} < 10 and self.ownedSensors.all(s => self.status != 'Fault')`)))).toEqual(['W1 Safe']);
    });
});

// ── W2 ───────────────────────────────────────────────────────────────────────

describe('dcnWellFormedness: W2, the dependencies between viewpoints', () => {
    it('Mode and Link testing each other: W2 on both, with the cycle', () => {
        const ds = mutated(withLink('self.vmax := 15'), inv('Online', 'self.in(Mode::Flying)'), inv('Flying', `${FLYING} and self.in(Link::Online)`));
        expect(rows(ds, 'W2')).toEqual(['W2 Link', 'W2 Mode']);
        expect(messageOf(ds, 'W2', 'Mode')).toBe('Viewpoint Mode is on a cycle of class tests: Mode -> Link -> Mode. The dependencies between viewpoints are acyclic.');
        expect(ds.find(d => d.element === 'Mode')!.related).toEqual(['Link']);
    });

    it('an edge with no way back is no error (mutant: every edge an error)', () => {
        expect(rows(mutated(withLink('self.vmax := 15'), inv('Online', 'self.in(Mode::Flying)')), 'W2')).toEqual([]);
    });

    it('a viewpoint testing its own classes is a self-loop, a cycle under spec §5 (mutant: self-loops skipped)', () => {
        const ds = mutated(inv('Charging', 'self.distance == 0 and self.speed == 0 and self.battery < 100 and not self.in(Mode::Ready)'));
        expect(rows(ds)).toEqual(['W2 Mode']);
        expect(messageOf(ds, 'W2', 'Mode')).toMatch(/: Mode -> Mode\./);
    });

    it('a test on another receiver, in a monitor body, is an edge too (mutants: self receivers only, invariants only)', () => {
        const ds = mutated(
            body('mon_Flying_drain', 'self.battery := if self.wau.in(Alert::Adverse) then self.battery - 2 else self.battery - 1'),
            inv('Safe', `${WIND} < 10 and not self.in(Mode::Flying)`),
        );
        expect(rows(ds)).toEqual(['W2 Alert', 'W2 Mode']);
    });
});

// ── W3 ───────────────────────────────────────────────────────────────────────

describe('dcnWellFormedness: W3, redefinitions', () => {
    it('a redefinition named otherwise (mutant: the name unchecked)', () => {
        const ds = mutated(m => { m.op_Flying_land.name = 'touchDown'; });
        expect(rows(ds)).toEqual(['W3 op_Flying_land']);
        expect(messageOf(ds, 'W3', 'op_Flying_land')).toBe('touchDown of Flying redefines land: a redefinition has the name of the operation it redefines.');
    });

    it('a redefinition with one parameter more (mutant: the parameter count unchecked)', () => {
        const ds = mutated(m => {
            m.par_h = { meta: 'Parameter', name: 'h', refs: { 'TypedElement.type': ['Integer'] } };
            (m.op_Flying_land.refs ??= {})['Operation.ownedParameters'] = ['par_h'];
        });
        expect(messageOf(ds, 'W3', 'op_Flying_land')).toBe('land of Flying has 1 parameters and redefines land of Drone, which has 0.');
    });

    it('two redefined operations, one of another class (mutants: at most one unchecked, the owner unchecked)', () => {
        const ds = mutated(m => { m.op_Flying_land.refs!['Operation.redefines'].push('op_WindSensor_gust'); });
        expect(ds.map(d => d.message)).toEqual([
            'land of Flying redefines 2 operations: an operation redefines at most one.',
            'land of Flying redefines gust, which is no operation of Drone.',
        ]);
    });
});

// ── W4 ───────────────────────────────────────────────────────────────────────

describe('dcnWellFormedness: W4, writes on self', () => {
    it('a monitor of Flying assigning an attribute of Charging (mutant: dynamic writes unchecked)', () => {
        const ds = mutated(body('mon_Flying_drain', 'self.battery := self.battery - 1', 'self.plugged := false'));
        expect(rows(ds)).toEqual(['W4 mon_Flying_drain']);
        expect(messageOf(ds, 'W4', 'mon_Flying_drain')).toBe('The monitor drain assigns plugged, an attribute of Charging: a body assigns only the features of Drone or of Flying.');
    });

    it('the static land assigning the dormant altitude is W4, Flying assigning it is not, an unknown name is (mutants: static writes see dormant attributes, own attributes not writable)', () => {
        const ds = mutated(body('op_Drone_land', 'self.altitude := 0'), body('op_Flying_land', 'self.distance := 0', 'self.speed := 0', 'self.altitude := 0'),
            body('op_Ready_takeOff', 'self.speed := 1', 'self.foo := 1'));
        expect(rows(ds)).toEqual(['W4 op_Drone_land', 'W4 op_Ready_takeOff']);
        expect(messageOf(ds, 'W4', 'op_Drone_land')).toBe('The static operation land assigns altitude, an attribute of Flying: a body assigns only the features of Drone.');
        expect(messageOf(ds, 'W4', 'op_Ready_takeOff')).toBe('The body of takeOff assigns foo, which is no feature of Drone or of Ready.');
    });
});

// ── W6 ───────────────────────────────────────────────────────────────────────

describe('dcnWellFormedness: W6, write ownership (R-DCN-23)', () => {
    it('Link and Mode both writing power: W6 on both writers (mutant: pairs of viewpoints unchecked)', () => {
        const ds = mutated(withLink());
        expect(rows(ds)).toEqual(['W6 mon_Online_ping', 'W6 op_Flying_rampUp']);
        expect(messageOf(ds, 'W6', 'mon_Online_ping')).toBe('ping writes power, which viewpoint Mode also writes (rampUp): two viewpoints never write the same property.');
        expect(messageOf(ds, 'W6', 'op_Flying_rampUp')).toBe('rampUp writes power, which viewpoint Link also writes (ping): two viewpoints never write the same property.');
    });

    it('a viewpoint of Sensor and one of WindSensor writing status meet on WindSensor (mutant: inherited viewpoints left out of the closure)', () => {
        const ds = mutated(body('op_Sensor_selfTest'), monitorOn('Faulty', 'mon_Faulty_flag', ['self.status := SensorStatus.Fault']),
            viewpoint('WindSensor', 'Gusts', [{ id: 'Gusty', inv: 'self.speed > 15', monitor: ['self.status := SensorStatus.Calibrating'] }]));
        expect(rows(ds)).toEqual(['W6 mon_Faulty_flag', 'W6 mon_Gusty']);
    });

    it('viewpoints of two unrelated sensors writing the inherited status never meet (mutant: ownership by feature alone)', () => {
        const ds = mutated(body('op_Sensor_selfTest'),
            viewpoint('TempSensor', 'Heat', [{ id: 'Hot', inv: 'self.value > 30', monitor: ['self.status := SensorStatus.Fault'] }]),
            viewpoint('WindSensor', 'Gusts', [{ id: 'Gusty', inv: 'self.speed > 15', monitor: ['self.status := SensorStatus.Calibrating'] }]));
        expect(ds).toEqual([]);
    });

    it('the static selfTest writing the status a viewpoint writes (mutant: static operations of generals left out)', () => {
        const ds = mutated(viewpoint('WindSensor', 'Gusts', [{ id: 'Gusty', inv: 'self.speed > 15', monitor: ['self.status := SensorStatus.Calibrating'] }]));
        expect(rows(ds)).toEqual(['W6 op_Sensor_selfTest']);
    });
});

// ── R-DCN-13, R-DCN-16, parse errors ─────────────────────────────────────────

describe('dcnWellFormedness: ranges (R-DCN-13), blank invariants (R-DCN-16)', () => {
    it('a range bound on a Boolean, rangeMin above rangeMax; one bound or equal bounds are fine (mutants: the type unchecked, the order unchecked, >= for >)', () => {
        const ds = mutated(
            m => { m.p_Charging_plugged.attrs!['Property.rangeMin'] = 0; },
            m => { m.p_Drone_battery.attrs = { 'Property.rangeMin': 100, 'Property.rangeMax': 0 }; },
        );
        expect(rows(ds)).toEqual(['R-DCN-13 p_Charging_plugged', 'R-DCN-13 p_Drone_battery']);
        expect(messageOf(ds, 'R-DCN-13', 'p_Charging_plugged')).toBe('Charging.plugged has a range bound but its type is Boolean: ranges apply to Integer properties only.');
        expect(messageOf(ds, 'R-DCN-13', 'p_Drone_battery')).toBe('Drone.battery has rangeMin 100 above rangeMax 0.');
        expect(mutated(
            m => { m.p_Drone_battery.attrs = { 'Property.rangeMin': 50, 'Property.rangeMax': 50 }; },
            m => { m.p_Flying_altitude.attrs = { 'Property.rangeMin': 0 }; },
        )).toEqual([]);
    });

    it('a blank invariant is an error on its class (mutant: blank invariants unchecked)', () => {
        const ds = mutated(inv('Empty', '   '));
        expect(rows(ds)).toEqual(['R-DCN-16 Empty']);
        expect(messageOf(ds, 'R-DCN-16', 'Empty')).toBe('The invariant of Empty (viewpoint Mode) is blank: every dynamic class needs one.');
    });

    it('a text that does not parse is left to conformance', () => {
        expect(mutated(inv('Flying', 'self.plugged >'))).toEqual([]);
    });
});
