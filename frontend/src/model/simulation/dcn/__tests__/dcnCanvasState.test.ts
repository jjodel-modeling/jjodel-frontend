/**
 * dcnCanvasState — the plain data of the run card of one instance (R-DCN-3,
 * R-DCN-25, R-DCN-26, R-DCN-29; P-2026-11-08-1829), on a hand-built drone-like
 * model compiled and classified by the real nucleus: dji and spare are Drones
 * (viewpoints Mode and Alert), dock a Dock, whose class has no viewpoint.
 */

import { describe, it, expect } from 'vitest';
import type { JjelValue } from '../../../../jjel/evaluator';
import { encodeRoleValues } from '../../roleCatalog';
import { dcnStcFromRoles } from '../dcnRoles';
import type { DcnStc } from '../dcnRoles';
import { compileDcn } from '../dcnCompile';
import type { DcnCompileInput, DcnCompiled, DcnReadView } from '../dcnCompile';
import { readDcnModel } from '../dcnHandles';
import type { DcnModel } from '../dcnHandles';
import { dcnNucleus, readDcnStep } from '../dcnStep';
import type { DcnNucleus } from '../dcnStep';
import { dcnNodeStateOf } from '../dcnCanvasState';
import { freezeSnapshot } from '../../guardContext';
import type { SimState, SimValue } from '../../netTypes';
import type { OntoBinding } from '../../../ontological/bindingCodec';

const SUPERS: Record<string, string[]> = {
    NamedElement: [], Classifier: ['NamedElement'], Class: ['Classifier'], StaticClass: ['Class'],
    DataType: ['Classifier'], PrimitiveType: ['DataType'],
    InstanceSpecification: ['NamedElement'], Slot: [],
    ValueSpecification: [], LiteralInteger: ['ValueSpecification'],
    Property: ['NamedElement'],
    Operation: ['NamedElement'], Viewpoint: ['NamedElement'], DynamicClass: ['NamedElement'], Monitor: ['NamedElement'],
};
const conformsTo = (m: string, s: string): boolean => m === s || (SUPERS[m] ?? []).some(x => conformsTo(x, s));

const STC = dcnStcFromRoles({
    simStaticClass: 'StaticClass',
    simViewpoints: 'StaticClass.viewpoints',
    simDynamicClasses: 'Viewpoint.classes',
    simInvariant: 'DynamicClass.invariant',
    simOperation: 'DynamicClass.operations',
    simBody: encodeRoleValues(['Operation.body', 'Monitor.body']),
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
    featureType: 'TypedElement.type',
    valueKinds: [{ when: 'primitive:Integer', create: 'LiteralInteger', field: 'LiteralInteger.value' }],
    featureSources: [{ path: ['StaticClass.viewpoints', 'Viewpoint.classes', 'DynamicClass.attributes'] }],
};

interface Obj { meta: string; name?: string; refs?: Record<string, string[]>; attrs?: Record<string, unknown> }
type Model = Record<string, Obj>;

function droneModel(): Model {
    const m: Model = { Integer: { meta: 'PrimitiveType', name: 'Integer' } };
    const push = (id: string, ref: string, ...targets: string[]) => {
        const refs = (m[id].refs ??= {});
        (refs[ref] ??= []).push(...targets);
    };
    const prop = (owner: string, ref: string, id: string, name: string) => {
        m[id] = { meta: 'Property', name, refs: { 'TypedElement.type': ['Integer'] } };
        push(owner, ref, id);
    };
    const dyn = (vp: string, id: string, inv: string) => {
        m[id] = { meta: 'DynamicClass', name: id, attrs: { 'DynamicClass.invariant': inv } };
        push(vp, 'Viewpoint.classes', id);
    };
    const monitor = (dc: string, id: string, name: string) => {
        m[id] = { meta: 'Monitor', name, attrs: { 'Monitor.body': ['self.speed := self.speed'] } };
        push(dc, 'DynamicClass.monitors', id);
    };
    const viewpoint = (owner: string, id: string, complete: boolean) => {
        m[id] = { meta: 'Viewpoint', name: id, attrs: { 'Viewpoint.isOverlapping': false, 'Viewpoint.isComplete': complete } };
        push(owner, 'StaticClass.viewpoints', id);
    };

    m.Drone = { meta: 'StaticClass', name: 'Drone' };
    for (const a of ['speed', 'battery', 'wind']) prop('Drone', 'Class.ownedAttributes', `p_${a}`, a);
    viewpoint('Drone', 'Mode', true);
    dyn('Mode', 'Ready', 'self.speed == 0 and self.battery == 100');
    dyn('Mode', 'Flying', 'self.speed > 0');
    prop('Flying', 'DynamicClass.attributes', 'p_altitude', 'altitude');
    m.op_rampUp = { meta: 'Operation', name: 'rampUp', attrs: { 'Operation.body': ['self.speed := self.speed + 1'] } };
    push('Flying', 'DynamicClass.operations', 'op_rampUp');
    monitor('Flying', 'mon_drain', 'drain');
    monitor('Flying', 'mon_log', 'log');
    dyn('Mode', 'Charging', 'self.speed == 0 and self.battery < 100');
    prop('Charging', 'DynamicClass.attributes', 'p_chargeRate', 'chargeRate');
    viewpoint('Drone', 'Alert', true);
    dyn('Alert', 'Safe', 'self.wind < 10');
    dyn('Alert', 'Adverse', 'self.wind >= 10');
    monitor('Adverse', 'mon_warn', 'warn');

    m.Dock = { meta: 'StaticClass', name: 'Dock' };
    prop('Dock', 'Class.ownedAttributes', 'p_bays', 'bays');

    const instance = (id: string, classifier: string, values: Record<string, number>) => {
        m[id] = { meta: 'InstanceSpecification', name: id, refs: { 'InstanceSpecification.classifier': [classifier] } };
        for (const [attr, n] of Object.entries(values)) {
            m[`s_${id}_${attr}_v`] = { meta: 'LiteralInteger', attrs: { 'LiteralInteger.value': n } };
            m[`s_${id}_${attr}`] = { meta: 'Slot', refs: { 'Slot.definingFeature': [`p_${attr}`], 'Slot.values': [`s_${id}_${attr}_v`] } };
            push(id, 'InstanceSpecification.slots', `s_${id}_${attr}`);
        }
    };
    instance('dji', 'Drone', { speed: 0, battery: 80, wind: 4, altitude: 7, chargeRate: 5 });
    instance('spare', 'Drone', { speed: 2, battery: 50, wind: 15, altitude: 9, chargeRate: 1 });
    instance('dock', 'Dock', { bays: 3 });
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

interface Fixture { compiled: DcnCompiled; model: DcnModel; nucleus: DcnNucleus; nameOf: (id: string) => string; reset: SimState }

function fixture(edit?: (m: Model) => void): Fixture {
    const m = droneModel();
    edit?.(m);
    const input: DcnCompileInput = { modelId: 'drone', stc: STC, binding: BINDING, view: viewOf(m) };
    const compiled = compileDcn(input);
    const model = readDcnModel(input, compiled);
    const instances = Object.entries(m).map(([id, o]) => ({ __type: 'Object', id, name: o.name ?? id, metaclass: o.meta }));
    const globals: Record<string, JjelValue> = { instances };
    for (const h of instances) if (m[h.id].name) globals[h.name] = h;
    const nucleus = dcnNucleus(readDcnStep(input, model), freezeSnapshot(globals, { id: 'drone', name: 'Drones' }));
    return { compiled, model, nucleus, nameOf: id => m[id]?.name ?? id, reset: compiled.net.initial };
}

function sigma(f: Fixture, over: Record<string, Record<string, SimValue>> = {}): SimState {
    const attrs = new Map([...f.reset.attrs].map(([i, a]) => [i, new Map(a)]));
    for (const [i, values] of Object.entries(over)) for (const [k, v] of Object.entries(values)) attrs.get(i)!.set(k, v);
    return { ...f.reset, attrs };
}

const of = (f: Fixture, state: SimState, id: string) => dcnNodeStateOf(f.model, f.nucleus, state, f.reset, id, f.nameOf);

const FLYING = { dji: { speed: 3, battery: 70, chargeRate: 9, altitude: 40 } };

describe('dcnNodeStateOf: an instance in Charging', () => {
    const f = fixture();
    const card = of(f, sigma(f), 'dji')!;

    it('lists every viewpoint and every dynamic class, only the classifying ones active', () => {
        expect(card.viewpoints).toEqual([
            { name: 'Mode', classes: [{ name: 'Ready', active: false }, { name: 'Flying', active: false }, { name: 'Charging', active: true }] },
            { name: 'Alert', classes: [{ name: 'Safe', active: true }, { name: 'Adverse', active: false }] },
        ]);
    });

    it('is dormant only in the slots of the inactive class, with the kept value', () => {
        expect(card.dormant).toEqual([{ name: 'altitude', value: 7 }]);
    });

    it('has no monitor when its active classes have none', () => {
        expect(card.monitors).toEqual([]);
    });

    it('has no changed static slot at Reset', () => {
        expect(card.changedStatic).toEqual([]);
    });
});

describe('dcnNodeStateOf: an instance in Flying', () => {
    const f = fixture();
    const card = of(f, sigma(f, FLYING), 'dji')!;

    it('moves the active class', () => {
        expect(card.viewpoints[0].classes).toEqual([{ name: 'Ready', active: false }, { name: 'Flying', active: true }, { name: 'Charging', active: false }]);
    });

    it('keeps in σ the value of the slot that fell dormant, and the slot of the active class leaves the list', () => {
        expect(card.dormant).toEqual([{ name: 'chargeRate', value: 9 }]);
    });

    it('names the monitors of the active class of this instance only', () => {
        expect(card.monitors).toEqual([{ viewpoint: 'Mode', dynamicClass: 'Flying', names: ['drain', 'log'] }]);
    });

    it('reports only the static slots that differ from Reset, not the slots of a dynamic class', () => {
        expect(card.changedStatic).toEqual([
            { name: 'speed', reset: 0, current: 3 },
            { name: 'battery', reset: 80, current: 70 },
        ]);
    });
});

describe('dcnNodeStateOf: per instance', () => {
    it('reads each instance on its own classification and σ', () => {
        const f = fixture();
        const card = of(f, sigma(f, FLYING), 'spare')!;
        expect(card.viewpoints.map(v => v.classes.filter(c => c.active).map(c => c.name))).toEqual([['Flying'], ['Adverse']]);
        expect(card.monitors).toEqual([
            { viewpoint: 'Mode', dynamicClass: 'Flying', names: ['drain', 'log'] },
            { viewpoint: 'Alert', dynamicClass: 'Adverse', names: ['warn'] },
        ]);
        expect(card.dormant).toEqual([{ name: 'chargeRate', value: 1 }]);
        expect(card.changedStatic).toEqual([]);
    });

    it('has every class inactive and every dynamic slot dormant when nothing classifies it', () => {
        const f = fixture();
        const card = of(f, sigma(f, { dji: { speed: -1 } }), 'dji')!;
        expect(card.viewpoints[0].classes.map(c => c.active)).toEqual([false, false, false]);
        expect(card.dormant).toEqual([{ name: 'altitude', value: 7 }, { name: 'chargeRate', value: 5 }]);
        expect(card.monitors).toEqual([]);
    });

    it('tells apart two classes of one name in two viewpoints', () => {
        const f = fixture(m => { m.Adverse.name = 'Flying'; });
        const card = of(f, sigma(f, FLYING), 'dji')!;
        expect(card.viewpoints[1].classes).toEqual([{ name: 'Safe', active: true }, { name: 'Flying', active: false }]);
        expect(card.monitors).toEqual([{ viewpoint: 'Mode', dynamicClass: 'Flying', names: ['drain', 'log'] }]);
    });
});

describe('dcnNodeStateOf: what is not a card with viewpoints', () => {
    const f = fixture();

    it('is null for an id that is no instance of the run', () => {
        expect(of(f, sigma(f), 'Mode')).toBeNull();
        expect(of(f, sigma(f), 'nope')).toBeNull();
    });

    it('is empty but for the changed slots on an instance without viewpoints', () => {
        expect(of(f, sigma(f, { dock: { bays: 4 } }), 'dock')).toEqual({
            viewpoints: [], dormant: [], monitors: [], changedStatic: [{ name: 'bays', reset: 3, current: 4 }],
        });
    });
});

describe('dcnNodeStateOf: classification cached per state object', () => {
    it('classifies one σ once, for all its instances, and a new σ again', () => {
        const f = fixture();
        let calls = 0;
        const counted = { classify: (s: SimState) => { calls++; return f.nucleus.classify(s); } };
        const read = (state: SimState, id: string) => dcnNodeStateOf(f.model, counted, state, f.reset, id, f.nameOf);
        const state = sigma(f);
        read(state, 'dji');
        read(state, 'spare');
        expect(calls).toBe(1);
        read(sigma(f), 'dji');
        expect(calls).toBe(2);
    });

    it('does not classify for an id that is no instance', () => {
        const f = fixture();
        let calls = 0;
        const counted = { classify: (s: SimState) => { calls++; return f.nucleus.classify(s); } };
        expect(dcnNodeStateOf(f.model, counted, sigma(f), f.reset, 'nope', f.nameOf)).toBeNull();
        expect(calls).toBe(0);
    });
});
