/**
 * dcnCompile — the DCN compiler (P-2026-11-07-1216, R-DCN-11, R-DCN-14):
 * resolved roles, a read view and the R-OI binding to a placeless
 * CompiledNet, its side table and σ. The view is synthetic: the class level of
 * frontend/scripts/probe/dcn-drone-fixture.ts reproduced as data, one id per
 * M2 feature as in dcnRoles.test.ts, plus the object level the fixture leaves
 * out: one DJI drone (`distance 0, speed 0, battery 80`) and one temperature
 * sensor, each with its slots. The transcribed dynamic classes own no
 * attribute; Charging and Flying get one each here, as the probe's seeded
 * attributes do, so that σ has dormant slots.
 */

import { describe, it, expect } from 'vitest';
import { encodeRoleValues } from '../../roleCatalog';
import { dcnStcFromRoles } from '../dcnRoles';
import type { DcnStc } from '../dcnRoles';
import { DCN_TICK_EVENT, compileDcn } from '../dcnCompile';
import type { DcnCompileInput, DcnCompiled, DcnReadView } from '../dcnCompile';
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

const DRONE_BAG = {
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
};
const STC = dcnStcFromRoles(DRONE_BAG) as DcnStc;

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
    const param = (opId: string, id: string, name: string, type: string) => {
        add(id, { meta: 'Parameter', name, refs: { 'TypedElement.type': [type] } });
        push(opId, 'Operation.ownedParameters', id);
    };
    const dyn = (vp: string, id: string, inv: string) => {
        add(id, { meta: 'DynamicClass', name: id, attrs: { 'DynamicClass.invariant': inv } });
        push(vp, 'Viewpoint.classes', id);
    };
    const monitor = (dc: string, id: string, name: string, body: string[]) => {
        add(id, { meta: 'Monitor', name, attrs: { 'Monitor.body': body } });
        push(dc, 'DynamicClass.monitors', id);
    };

    // Drone and its viewpoint Mode (chapter Fig. 6).
    add('Drone', { meta: 'StaticClass', name: 'Drone', attrs: { 'Classifier.isAbstract': false } });
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_distance', 'distance', 'Integer');
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_speed', 'speed', 'Integer');
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_power', 'power', 'Integer');
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_battery', 'battery', 'Integer', { 'Property.rangeMin': 0, 'Property.rangeMax': 100 });
    prop('Drone', 'Class.ownedAttributes', 'p_Drone_vmax', 'vmax', 'Integer', { 'Property.defaultValue': '15' });
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
    param('op_Flying_rampUp', 'par_rampUp_boost', 'boost', 'Boolean');
    op('Flying', 'DynamicClass.operations', 'op_Flying_rampDown', 'rampDown', ['self.speed := self.speed - 1', 'self.power := self.power - 1']);
    param('op_Flying_rampDown', 'par_rampDown_by', 'by', 'Integer');
    monitor('Flying', 'mon_Flying_drain', 'drain', ['self.battery := self.battery - 1', 'self.distance := self.distance + self.speed']);
    prop('Flying', 'DynamicClass.attributes', 'p_Flying_altitude', 'altitude', 'Integer', { 'Property.rangeMin': 0, 'Property.rangeMax': 120 });
    dyn('Mode', 'Empty', 'self.battery == 0');

    // WeatherAssessmentUnit and Alert: invariants only, no instance here.
    add('WeatherAssessmentUnit', { meta: 'StaticClass', name: 'WeatherAssessmentUnit' });
    add('Alert', { meta: 'Viewpoint', name: 'Alert', attrs: { 'Viewpoint.isOverlapping': false, 'Viewpoint.isComplete': true } });
    push('WeatherAssessmentUnit', 'StaticClass.viewpoints', 'Alert');
    for (const d of ['Safe', 'Moderate', 'Adverse']) dyn('Alert', d, 'true');

    // The sensors, under the abstract Sensor; Sensor owns one operation here, inherited by every sensor (R-DCN-17).
    add('Sensor', { meta: 'StaticClass', name: 'Sensor', attrs: { 'Classifier.isAbstract': true } });
    op('Sensor', 'Class.ownedOperations', 'op_Sensor_selfTest', 'selfTest', ['self.status := SensorStatus.Calibrating']);
    const SENSORS: Array<[string, string]> = [['TempSensor', 'value'], ['WindSensor', 'speed'], ['RainSensor', 'intensity'], ['HumiditySensor', 'relative']];
    for (const [s, reading] of SENSORS) {
        add(s, { meta: 'StaticClass', name: s, attrs: { 'Classifier.isAbstract': false } });
        prop(s, 'Class.ownedAttributes', `p_${s}_${reading}`, reading, 'Integer',
            s === 'HumiditySensor' ? { 'Property.rangeMin': 0, 'Property.rangeMax': 100 } : {});
        prop(s, 'Class.ownedAttributes', `p_${s}_unit`, 'unit', 'String');
        prop(s, 'Class.ownedAttributes', `p_${s}_status`, 'status', 'SensorStatus');
        op(s, 'Class.ownedOperations', `op_${s}_injectFailure`, 'injectFailure', ['self.status := SensorStatus.Fault']);
        op(s, 'Class.ownedOperations', `op_${s}_reset`, 'reset', ['self.status := SensorStatus.OK']);
        add(`gen_${s}`, { meta: 'Generalization', refs: { 'Generalization.general': ['Sensor'] } });
        push(s, 'Classifier.generalizations', `gen_${s}`);
    }
    param('op_TempSensor_reset', 'par_reset_hard', 'hard', 'Boolean');

    // The object level: dji, every slot but vmax; temp1, its three slots.
    const slot = (inst: string, id: string, feature: string, value: Obj) => {
        add(`${id}_v`, value);
        add(id, { meta: 'Slot', refs: { 'Slot.definingFeature': [feature], 'Slot.values': [`${id}_v`] } });
        push(inst, 'InstanceSpecification.slots', id);
    };
    const int = (n: number): Obj => ({ meta: 'LiteralInteger', attrs: { 'LiteralInteger.value': n } });
    add('dji', { meta: 'InstanceSpecification', name: 'dji', refs: { 'InstanceSpecification.classifier': ['Drone'] } });
    slot('dji', 's_dji_distance', 'p_Drone_distance', int(0));
    slot('dji', 's_dji_speed', 'p_Drone_speed', int(0));
    slot('dji', 's_dji_power', 'p_Drone_power', int(0));
    slot('dji', 's_dji_battery', 'p_Drone_battery', int(80));
    slot('dji', 's_dji_plugged', 'p_Charging_plugged', { meta: 'LiteralBoolean', attrs: { 'LiteralBoolean.value': true } });
    slot('dji', 's_dji_altitude', 'p_Flying_altitude', int(0));
    add('temp1', { meta: 'InstanceSpecification', name: 'temp1', refs: { 'InstanceSpecification.classifier': ['TempSensor'] } });
    slot('temp1', 's_temp1_value', 'p_TempSensor_value', int(20));
    slot('temp1', 's_temp1_unit', 'p_TempSensor_unit', { meta: 'LiteralString', attrs: { 'LiteralString.value': 'C' } });
    slot('temp1', 's_temp1_status', 'p_TempSensor_status', { meta: 'InstanceValue', refs: { 'InstanceValue.instance': ['lit_Fault'] } });
    return m;
}

function viewOf(m: Model): DcnReadView {
    return {
        objects: () => Object.keys(m),
        metaclassOf: id => m[id]?.meta,
        referenceTargets: (id, ref) => [...(m[id]?.refs?.[ref] ?? [])],
        attributeValue: (id, attr) => m[id]?.attrs?.[attr],
        ownerOf: f => (f.includes('.') ? f.split('.')[0] : undefined),
        conformsTo,
        nameOf: id => m[id]?.name,
    };
}

const input = (m: Model = droneModel()): DcnCompileInput => ({ modelId: 'drone', stc: STC, binding: BINDING, view: viewOf(m), features: FEATURES });
const compile = (m?: Model): DcnCompiled => compileDcn(input(m));

/** The side table as rows, in transition order. */
const rows = (c: DcnCompiled) => c.net.transitions.map(t => {
    const e = c.entries.get(t.id)!;
    return [e.kind, e.instance, e.element, e.viewpoint, e.dynamicClass];
});
const idOf = (c: DcnCompiled, instance: string, element: string) =>
    [...c.entries.values()].find(e => e.instance === instance && e.element === element)!.id;
const attrsOf = (c: DcnCompiled, instance: string) => Object.fromEntries(c.net.initial.attrs.get(instance) ?? []);

// ── tests ────────────────────────────────────────────────────────────────────

describe('compileDcn: transitions and the side table (R-DCN-11, R-DCN-14)', () => {
    it('one transition per (instance, operation) and per (instance, viewpoint, monitor), static operations inherited (mutants: generalization not followed, monitors dropped)', () => {
        const c = compile();
        expect(rows(c)).toEqual([
            ['tick', 'dji', 'mon_Charging_charge', 'Mode', 'Charging'],
            ['invocation', 'dji', 'op_Ready_takeOff', 'Mode', 'Ready'],
            ['invocation', 'dji', 'op_Flying_rampUp', 'Mode', 'Flying'],
            ['invocation', 'dji', 'op_Flying_rampDown', 'Mode', 'Flying'],
            ['tick', 'dji', 'mon_Flying_drain', 'Mode', 'Flying'],
            ['invocation', 'temp1', 'op_TempSensor_injectFailure', null, null],
            ['invocation', 'temp1', 'op_TempSensor_reset', null, null],
            ['invocation', 'temp1', 'op_Sensor_selfTest', null, null],
        ]);
        expect(c.entries.size).toBe(8);
        expect(c.net.places.size).toBe(0);
        expect(c.net.modelId).toBe('drone');
        expect(c.net.defects).toEqual([]);
    });

    it('the transitions have no arcs; an invocation is triggered by its own id, a tick by the tick event (mutant: ticks on ε)', () => {
        const c = compile();
        for (const t of c.net.transitions) {
            expect(t.preset).toEqual([]);
            expect(t.postset).toEqual([]);
            expect(t.inhibitors).toEqual([]);
            expect(t.elseOf).toBeNull();
            expect(t.origin).toEqual([c.entries.get(t.id)!.instance, c.entries.get(t.id)!.element]);
            expect(t.triggers).toEqual(c.entries.get(t.id)!.kind === 'tick' ? [DCN_TICK_EVENT] : [t.id]);
        }
        expect(c.net.hasEventRole).toBe(true);
        expect(c.entries.has(DCN_TICK_EVENT)).toBe(false);
    });

    it('the guard is the precondition as text and the class to be active as a separate field; the bodies stay text (mutants: classification on static ops, a guard site without a precondition)', () => {
        const c = compile();
        const up = c.entries.get(idOf(c, 'dji', 'op_Flying_rampUp'))!;
        expect(up.guard).toEqual({ precondition: 'self.speed < self.vmax', classifiedAs: 'Flying' });
        expect(up.body).toEqual(['self.speed := self.speed + 1', 'self.power := self.power + 1']);
        const drain = c.entries.get(idOf(c, 'dji', 'mon_Flying_drain'))!;
        expect(drain.guard).toEqual({ precondition: null, classifiedAs: 'Flying' });
        expect(drain.body).toEqual(['self.battery := self.battery - 1', 'self.distance := self.distance + self.speed']);
        const self = c.entries.get(idOf(c, 'temp1', 'op_Sensor_selfTest'))!;
        expect(self.guard).toEqual({ precondition: null, classifiedAs: null });
        // the guard and action sites are the transition itself: the oracle finds `self` in the side table
        const byId = new Map(c.net.transitions.map(t => [t.id, t]));
        expect(byId.get(up.id)!.guardSites).toEqual([up.id]);
        expect(byId.get(up.id)!.actionSites).toEqual([{ element: up.id, role: 'transition' }]);
        expect(byId.get(drain.id)!.guardSites).toEqual([]);
        expect(byId.get(drain.id)!.actionSites).toEqual([{ element: drain.id, role: 'transition' }]);
    });

    it('arguments are inputs of the transition (R-DCN-15, R-SIM-88); one without a finite domain is a defect (mutant: parameters not read)', () => {
        const c = compile();
        const up = idOf(c, 'dji', 'op_Flying_rampUp');
        expect(c.entries.get(up)!.inputs).toEqual([{ element: up, attr: 'boost', domain: { kind: 'boolean' } }]);
        const reset = idOf(c, 'temp1', 'op_TempSensor_reset');
        expect(c.entries.get(reset)!.inputs).toEqual([{ element: reset, attr: 'hard', domain: { kind: 'boolean' } }]);
        const down = idOf(c, 'dji', 'op_Flying_rampDown');
        expect(c.entries.get(down)!.inputs).toEqual([]);
        expect(c.net.declarationDefects).toContainEqual(expect.objectContaining({ code: 'no-domain', name: 'by', element: down }));
        // inputs are never events: no trigger carries a parameter
        expect(c.net.transitions.flatMap(t => t.triggers).filter(e => e !== DCN_TICK_EVENT).sort()).toEqual([...c.entries.keys()].filter(id => c.entries.get(id)!.kind === 'invocation').sort());
    });

    it('only instances of a static class are compiled: not the enumeration literals, not an instance of a plain Class (mutant: the static-class test dropped)', () => {
        const m = droneModel();
        m.Plain = { meta: 'Class', name: 'Plain', refs: { 'Class.ownedAttributes': ['p_Plain_x'], 'Class.ownedOperations': ['op_Plain_go'] } };
        m.p_Plain_x = { meta: 'Property', name: 'x', refs: { 'TypedElement.type': ['Boolean'] } };
        m.op_Plain_go = { meta: 'Operation', name: 'go', attrs: { 'Operation.body': ['self.x := true'] } };
        m.plain1 = { meta: 'InstanceSpecification', name: 'plain1', refs: { 'InstanceSpecification.classifier': ['Plain'] } };
        const c = compile(m);
        expect([...new Set([...c.entries.values()].map(e => e.instance))]).toEqual(['dji', 'temp1']);
        expect([...c.net.initial.attrs.keys()]).toEqual(['dji', 'temp1']);
    });
});

describe('compileDcn: the opaque ids (R-DCN-14)', () => {
    it('are opaque, unique, and the same on two compilations of the same model (mutant: random ids)', () => {
        const a = compile();
        const b = compile();
        const ids = a.net.transitions.map(t => t.id);
        expect(b.net.transitions.map(t => t.id)).toEqual(ids);
        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) {
            expect(id).toMatch(/^dcn-[0-9a-z]+$/);
            for (const m1 of ['dji', 'temp1', 'Mode', 'Flying', 'rampUp', 'drain']) expect(id).not.toContain(m1);
        }
        expect(JSON.stringify([...b.entries])).toBe(JSON.stringify([...a.entries]));
    });

    it('do not move when another operation is added before them (mutant: a counter in compile order)', () => {
        const before = compile();
        const m = droneModel();
        m.op_Charging_unplug = { meta: 'Operation', name: 'unplug', attrs: { 'Operation.body': ['self.plugged := false'] } };
        (m.Charging.refs ??= {})['DynamicClass.operations'] = ['op_Charging_unplug'];
        const after = compile(m);
        expect(after.entries.size).toBe(before.entries.size + 1);
        for (const e of before.entries.values()) expect(idOf(after, e.instance, e.element)).toBe(e.id);
    });

    it('tell the instance apart, and do not move when another instance is added before (mutant: the instance left out of the hash)', () => {
        const before = compile();
        const m: Model = { dji0: { meta: 'InstanceSpecification', name: 'dji0', refs: { 'InstanceSpecification.classifier': ['Drone'] } }, ...droneModel() };
        const c = compile(m);
        expect(idOf(c, 'dji0', 'op_Ready_takeOff')).not.toBe(idOf(c, 'dji', 'op_Ready_takeOff'));
        for (const e of before.entries.values()) expect(idOf(c, e.instance, e.element)).toBe(e.id);
    });
});

describe('compileDcn: σ seeded from the model (R-DCN-3, R-DCN-6, R-DCN-13)', () => {
    it('one attribute per feature of the closure, own first then dormant, from the slots; the marking empty (mutant: featureSources ignored)', () => {
        const c = compile();
        expect(attrsOf(c, 'dji')).toEqual({ distance: 0, speed: 0, power: 0, battery: 80, vmax: 15, plugged: true, altitude: 0 });
        expect([...c.net.initial.attrs.get('dji')!.keys()]).toEqual(['distance', 'speed', 'power', 'battery', 'vmax', 'plugged', 'altitude']);
        expect(attrsOf(c, 'temp1')).toEqual({ value: 20, unit: 'C', status: 'Fault' });
        expect(c.net.initial.marking.size).toBe(0);
        expect(c.net.initial.presentation.size).toBe(0);
    });

    it('records the dormant slots and their owners (mutant: dormantOwner not read)', () => {
        const c = compile();
        const slots = Object.fromEntries([...c.slots.get('dji')!].map(([n, s]) => [n, [s.feature, s.dormantOwner]]));
        expect(slots).toEqual({
            distance: ['p_Drone_distance', null], speed: ['p_Drone_speed', null], power: ['p_Drone_power', null],
            battery: ['p_Drone_battery', null], vmax: ['p_Drone_vmax', null],
            plugged: ['p_Charging_plugged', 'Charging'], altitude: ['p_Flying_altitude', 'Flying'],
        });
    });

    it('declares per instance: the instance key, semantic, the domains (mutants: one bound enough, enum literals not read)', () => {
        const c = compile();
        const decl = (i: string, n: string) => c.net.declared.get(i)!.get(n)!;
        expect(decl('dji', 'battery')).toEqual({ name: 'battery', metaclass: 'InstanceSpecification', instance: 'dji', space: 'semantic', domain: { kind: 'range', min: 0, max: 100 }, initial: 80 });
        expect(decl('dji', 'altitude').domain).toEqual({ kind: 'range', min: 0, max: 120 });
        expect(decl('dji', 'plugged').domain).toEqual({ kind: 'boolean' });
        expect(decl('dji', 'distance').domain).toBeNull();
        expect(decl('temp1', 'status').domain).toEqual({ kind: 'enum', literals: ['OK', 'Fault', 'Calibrating'] });
        expect(c.net.attributes).toHaveLength(10);
        expect(c.net.attributes.every(d => d.instance !== undefined && d.equation === undefined && d.input === undefined)).toBe(true);
    });

    it('flags an unbounded Integer for the exporter, and a String as having no domain (R-DCN-6)', () => {
        const c = compile();
        expect(c.unexportable.map(u => [u.element, u.attr, u.reason])).toEqual([
            ['dji', 'distance', 'unbounded-integer'], ['dji', 'speed', 'unbounded-integer'], ['dji', 'power', 'unbounded-integer'],
            ['dji', 'vmax', 'unbounded-integer'], ['temp1', 'value', 'unbounded-integer'], ['temp1', 'unit', 'no-domain'],
        ]);
        // one bound alone is still unbounded
        const m = droneModel();
        delete m.p_Drone_battery.attrs!['Property.rangeMax'];
        const one = compile(m);
        expect(one.net.declared.get('dji')!.get('battery')!.domain).toBeNull();
        expect(one.unexportable).toContainEqual(expect.objectContaining({ element: 'dji', attr: 'battery', reason: 'unbounded-integer' }));
    });

    it('seeds a missing slot from the feature default; with no default, from the domain with a defect (mutant: default not read)', () => {
        const c = compile();
        expect(c.net.initial.attrs.get('dji')!.get('vmax')).toBe(15);
        expect(c.net.declarationDefects ?? []).not.toContainEqual(expect.objectContaining({ code: 'initial' }));
        const m = droneModel();
        m.dji.refs!['InstanceSpecification.slots'] = m.dji.refs!['InstanceSpecification.slots'].filter(s => s !== 's_dji_battery' && s !== 's_dji_plugged');
        m.p_Drone_battery.attrs!['Property.rangeMin'] = 10;
        const d = compile(m);
        expect(d.net.initial.attrs.get('dji')!.get('plugged')).toBe(false);
        // the least value of the range, not 0
        expect(d.net.initial.attrs.get('dji')!.get('battery')).toBe(10);
        expect(d.net.declarationDefects).toEqual([
            expect.objectContaining({ code: 'initial', name: 'battery', element: 'dji' }),
            expect.objectContaining({ code: 'no-domain', name: 'by' }),
        ]);
    });

    it('reports a slot value outside its range and keeps it; bounds the wrong way round are a defect', () => {
        const m = droneModel();
        m.s_dji_battery_v.attrs!['LiteralInteger.value'] = 120;
        m.p_Flying_altitude.attrs = { 'Property.rangeMin': 10, 'Property.rangeMax': 5 };
        const c = compile(m);
        expect(c.net.initial.attrs.get('dji')!.get('battery')).toBe(120);
        expect(c.net.declarationDefects).toContainEqual(expect.objectContaining({ code: 'initial', name: 'battery', message: 'initial 120 outside 0..100' }));
        expect(c.net.declarationDefects).toContainEqual(expect.objectContaining({ code: 'bounds', name: 'altitude', element: 'dji' }));
        expect(c.net.declared.get('dji')!.get('altitude')!.domain).toBeNull();
    });

    it('a second feature of the same name is a defect, the first wins', () => {
        const m = droneModel();
        m.p_Flying_speed = { meta: 'Property', name: 'speed', refs: { 'TypedElement.type': ['Integer'] } };
        m.Flying.refs!['DynamicClass.attributes'].push('p_Flying_speed');
        const c = compile(m);
        expect(c.slots.get('dji')!.get('speed')!.feature).toBe('p_Drone_speed');
        expect(c.net.declarationDefects).toContainEqual(expect.objectContaining({ code: 'twice', name: 'speed', element: 'dji' }));
    });

    it('the first slot of a feature gives its value (mutant: the last slot wins)', () => {
        const m = droneModel();
        m.s_dji_battery2_v = { meta: 'LiteralInteger', attrs: { 'LiteralInteger.value': 50 } };
        m.s_dji_battery2 = { meta: 'Slot', refs: { 'Slot.definingFeature': ['p_Drone_battery'], 'Slot.values': ['s_dji_battery2_v'] } };
        m.dji.refs!['InstanceSpecification.slots'].push('s_dji_battery2');
        expect(compile(m).net.initial.attrs.get('dji')!.get('battery')).toBe(80);
    });

    it('does not write the view', () => {
        const m = droneModel();
        const before = JSON.stringify(m);
        compile(m);
        expect(JSON.stringify(m)).toBe(before);
    });
});
