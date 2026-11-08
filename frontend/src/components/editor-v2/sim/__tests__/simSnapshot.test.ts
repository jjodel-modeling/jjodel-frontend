/**
 * simSnapshot — the plan of the snapshot copy (DCN slice 5, lane 4, P-2026-11-08-2124).
 *
 * Executes the pure module on a hand-built model: a class level (two classes, an
 * association, two primitive types and an enumeration) and an instance level (two
 * instances, one link) in one M1 model, R-DCN-30. Each test name says which break
 * kills it; the mutation bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { planSnapshot } from '../simSnapshot';
import type {
    SnapshotAttributeWrite, SnapshotCreate, SnapshotInput, SnapshotOperation, SnapshotPlan, SnapshotReferenceWrite,
    SnapshotSourceObject,
} from '../simSnapshot';
import type { DcnSlot } from '../../../../model/simulation/dcn/dcnCompile';
import type { SimValue } from '../../../../model/simulation/netTypes';

const CONTAINS = { classes: 'F.classes', attributes: 'F.attributes', slots: 'F.slots', values: 'F.values', literals: 'F.literals' };
const F = {
    ...CONTAINS, type: 'F.type', classifier: 'F.classifier', defining: 'F.definingFeature', ends: 'F.memberEnd',
    intValue: 'F.LiteralInteger.value', strValue: 'F.LiteralString.value', instance: 'F.InstanceValue.instance', label: 'F.label',
};
const M = {
    Primitive: 'M.Primitive', Enumeration: 'M.Enumeration', Literal: 'M.EnumerationLiteral', Class: 'M.Class', Property: 'M.Property',
    Association: 'M.Association', Instance: 'M.Instance', Slot: 'M.Slot', Int: 'M.LiteralInteger', Str: 'M.LiteralString',
    InstanceValue: 'M.InstanceValue', Null: 'M.LiteralNull',
};

function object(name: string, classId: string, owner: string | null, attributes: Record<string, unknown[]>, references: Record<string, unknown[]>): SnapshotSourceObject {
    return {
        id: `id-${name}`, classId, name, owner: owner === null ? 'id-model' : `id-${owner}`,
        attributes: Object.entries(attributes).map(([feature, values]) => ({ feature, values })),
        references: Object.entries(references).map(([feature, values]) => ({ feature, values })),
    };
}
const ids = (...names: string[]) => names.map(n => `id-${n}`);

/** Contents listed before their containers on purpose: the order must come from the plan, not from the input. */
const OBJECTS: readonly SnapshotSourceObject[] = [
    object('v_battery', M.Int, 's_battery', { [F.intValue]: [80] }, {}),
    object('v_link', M.InstanceValue, 's_link', {}, { [F.instance]: ids('temp') }),
    object('v_status', M.InstanceValue, 's_status', {}, { [F.instance]: ids('lit_ok') }),
    object('s_battery', M.Slot, 'dji', {}, { [F.defining]: ids('p_battery'), [F.values]: ids('v_battery') }),
    object('s_link', M.Slot, 'dji', {}, { [F.defining]: ids('end_sensor'), [F.values]: ids('v_link') }),
    object('s_status', M.Slot, 'dji', {}, { [F.defining]: ids('p_status'), [F.values]: ids('v_status') }),
    object('dji', M.Instance, null, { [F.label]: ['the drone'] }, { [F.classifier]: ids('Drone'), [F.slots]: ids('s_battery', 's_link', 's_status') }),
    object('temp', M.Instance, null, {}, { [F.classifier]: ids('Sensor'), [F.slots]: [] }),
    object('p_battery', M.Property, 'Drone', {}, { [F.type]: ids('Integer') }),
    object('p_range', M.Property, 'Drone', {}, { [F.type]: ids('Integer') }),
    object('p_title', M.Property, 'Drone', {}, { [F.type]: ids('String') }),
    object('p_status', M.Property, 'Drone', {}, { [F.type]: ids('Status') }),
    object('end_sensor', M.Property, 'Drone', {}, { [F.type]: ids('Sensor') }),
    object('p_missing', M.Property, 'Drone', {}, { [F.type]: ids('Sensor') }),
    object('Drone', M.Class, null, {}, { [F.attributes]: ids('p_battery', 'p_range', 'p_title', 'p_status', 'end_sensor', 'p_missing') }),
    object('Sensor', M.Class, null, {}, {}),
    object('senses', M.Association, null, {}, { [F.ends]: ids('end_sensor') }),
    object('Integer', M.Primitive, null, {}, {}),
    object('String', M.Primitive, null, {}, {}),
    object('Status', M.Enumeration, null, {}, { [F.literals]: ids('lit_ok', 'lit_fault') }),
    object('lit_ok', M.Literal, 'Status', {}, {}),
    object('lit_fault', M.Literal, 'Status', {}, {}),
];

function sigmaOf(values: Record<string, Record<string, SimValue>>): SnapshotInput['sigma'] {
    return new Map(Object.entries(values).map(([instance, attrs]) => [`id-${instance}`, new Map(Object.entries(attrs))]));
}
function slotsOf(values: Record<string, Record<string, string | DcnSlot>>): SnapshotInput['slots'] {
    return new Map(Object.entries(values).map(([instance, attrs]) => [
        `id-${instance}`,
        new Map(Object.entries(attrs).map(([name, f]) => [name, typeof f === 'string' ? { feature: `id-${f}`, dormantOwner: null } : f])),
    ]));
}

const ROLES: SnapshotInput['roles'] = {
    slotClass: M.Slot, slotContainer: F.slots, definingFeature: F.defining, valueHolder: F.values, featureType: F.type, literals: F.literals,
    valueKinds: [
        { when: 'primitive:Integer', create: M.Int, field: F.intValue },
        { when: 'primitive:String', create: M.Str, field: F.strValue },
        { when: 'instance', create: M.InstanceValue, field: F.instance },
    ],
};

const BASE: SnapshotInput = {
    modelName: 'drone', step: 21, objects: OBJECTS, roles: ROLES,
    sigma: sigmaOf({ dji: { battery: 55, sensor: 'temp', range: 12, status: 'lit_fault' } }),
    slots: slotsOf({ dji: { battery: 'p_battery', sensor: 'end_sensor', range: 'p_range', status: 'p_status' } }),
};

const creates = (p: SnapshotPlan) => p.operations.filter((o): o is SnapshotCreate => o.op === 'create');
const refs = (p: SnapshotPlan) => p.operations.filter((o): o is SnapshotReferenceWrite => o.op === 'reference');
const attrs = (p: SnapshotPlan) => p.operations.filter((o): o is SnapshotAttributeWrite => o.op === 'attribute');
const keyOf = (p: SnapshotPlan, name: string): string => {
    const c = creates(p).find(o => o.name === name);
    if (!c) throw new Error(`no create for ${name}`);
    return c.key;
};
/** The writes of one field in plan order: the last one is what the model ends up with. */
const refWrites = (p: SnapshotPlan, key: string, feature: string) => refs(p).filter(o => o.key === key && o.feature === feature).map(o => o.values);
const attrWrites = (p: SnapshotPlan, key: string, feature: string) => attrs(p).filter(o => o.key === key && o.feature === feature).map(o => o.values);

describe('planSnapshot: the name', () => {
    it('is the model and the step, the suffix left to uniqueModelName (killed by a name without the step)', () => {
        expect(planSnapshot(BASE).name).toBe('drone (snapshot step 21)');
        expect(planSnapshot({ ...BASE, modelName: 'x', step: 0 }).name).toBe('x (snapshot step 0)');
    });
});

describe('planSnapshot: the create operations', () => {
    const plan = planSnapshot(BASE);

    it('create every object of the model once, with its class and its name (killed by skipping an object or dropping the class)', () => {
        const fromSource = creates(plan).filter(c => OBJECTS.some(o => o.name === c.name));
        expect(fromSource.map(c => c.name).sort()).toEqual(OBJECTS.map(o => o.name).sort());
        for (const o of OBJECTS) expect(fromSource.find(c => c.name === o.name)?.classId).toBe(o.classId);
    });

    it('put a container before its contents, whatever the input order (killed by keeping the input order)', () => {
        const at = (name: string) => creates(plan).findIndex(c => c.name === name);
        for (const o of OBJECTS) {
            const owner = OBJECTS.find(x => x.id === o.owner);
            if (owner) expect(at(owner.name!)).toBeLessThan(at(o.name!));
        }
    });

    it('give the key of the owner, null for a root (killed by the source owner id or by a root with an owner)', () => {
        const slot = creates(plan).find(c => c.name === 's_battery')!;
        expect(slot.ownerKey).toBe(keyOf(plan, 'dji'));
        expect(creates(plan).find(c => c.name === 'dji')!.ownerKey).toBeNull();
    });

    it('have distinct keys (killed by one key for every object)', () => {
        const keys = creates(plan).map(c => c.key);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it('all come before the first write (killed by writing while creating)', () => {
        const kinds = plan.operations.map(o => o.op);
        expect(kinds.lastIndexOf('create')).toBeLessThan(kinds.findIndex(k => k !== 'create'));
    });
});

describe('planSnapshot: the references', () => {
    const plan = planSnapshot(BASE);

    it('remap containment and plain references to the keys, in slot order (killed by a write of source ids)', () => {
        const dji = keyOf(plan, 'dji');
        expect(refWrites(plan, dji, F.classifier)).toEqual([[keyOf(plan, 'Drone')]]);
        expect(refWrites(plan, dji, F.slots)[0].slice(0, 3)).toEqual([keyOf(plan, 's_battery'), keyOf(plan, 's_link'), keyOf(plan, 's_status')]);
        expect(refWrites(plan, keyOf(plan, 'Drone'), F.attributes)[0][0]).toBe(keyOf(plan, 'p_battery'));
        expect(refWrites(plan, keyOf(plan, 'senses'), F.ends)).toEqual([[keyOf(plan, 'end_sensor')]]);
    });

    it('leave no source id anywhere in the plan (killed by any id not remapped)', () => {
        expect(JSON.stringify(plan)).not.toContain('id-');
    });

    it('write nothing for an empty slot: a new object is unset, and values = [] does not clear (killed by writing the empty list)', () => {
        expect(refWrites(plan, keyOf(plan, 'temp'), F.slots)).toEqual([]);
    });

    it('drop a null entry of a raw slot (killed by remapping every entry)', () => {
        const objects = OBJECTS.map(o => o.name === 'senses' ? object('senses', M.Association, null, {}, { [F.ends]: [null, 'id-end_sensor'] }) : o);
        const p = planSnapshot({ ...BASE, objects });
        expect(refWrites(p, keyOf(p, 'senses'), F.ends)).toEqual([[keyOf(p, 'end_sensor')]]);
        expect(p.unwritten).toEqual([]);
    });

    it('report and drop a target outside the model, never carrying its id as a key (killed by keeping the id)', () => {
        const objects = OBJECTS.map(o => o.name === 'senses' ? object('senses', M.Association, null, {}, { [F.ends]: ['elsewhere', 'id-end_sensor'] }) : o);
        const p = planSnapshot({ ...BASE, objects });
        expect(refWrites(p, keyOf(p, 'senses'), F.ends)).toEqual([[keyOf(p, 'end_sensor')]]);
        expect(p.unwritten).toEqual([{ objectId: 'id-senses', what: F.ends, reason: 'target-outside-model' }]);
    });
});

describe('planSnapshot: the links come from the model, never from σ (R-DCN-30)', () => {
    it('keep the target of the model when σ names another one (killed by a link written from σ)', () => {
        const sigma = sigmaOf({ dji: { sensor: 'Sensor' } });
        const plan = planSnapshot({ ...BASE, sigma });
        expect(refWrites(plan, keyOf(plan, 'v_link'), F.instance)).toEqual([[keyOf(plan, 'temp')]]);
    });

    it('create nothing for a link with no Slot object (killed by seeding a holder for it)', () => {
        const sigma = sigmaOf({ dji: { nothing: '' } });
        const slots = slotsOf({ dji: { nothing: 'p_missing' } });
        const plan = planSnapshot({ ...BASE, sigma, slots });
        expect(creates(plan)).toHaveLength(OBJECTS.length);
        expect(plan.unwritten).toEqual([]);
    });
});

describe('planSnapshot: σ over the attribute slots', () => {
    const plan = planSnapshot(BASE);

    it('copy the attribute of the model, then write σ over it (killed by dropping either write or swapping them)', () => {
        expect(attrWrites(plan, keyOf(plan, 'v_battery'), F.intValue)).toEqual([[80], [55]]);
    });

    it('copy an attribute σ does not hold (killed by writing σ only)', () => {
        expect(attrWrites(plan, keyOf(plan, 'dji'), F.label)).toEqual([['the drone']]);
    });

    it('write a dormant slot like any other, R-DCN-3 (killed by skipping a slot with a dormant owner)', () => {
        const slots = slotsOf({ dji: { battery: { feature: 'id-p_battery', dormantOwner: 'id-Flying' } } });
        const p = planSnapshot({ ...BASE, slots, sigma: sigmaOf({ dji: { battery: 7 } }) });
        expect(attrWrites(p, keyOf(p, 'v_battery'), F.intValue)).toEqual([[80], [7]]);
    });

    it('write an unchanged value too: every slot at the shown step (killed by skipping equal values)', () => {
        const p = planSnapshot({ ...BASE, sigma: sigmaOf({ dji: { battery: 80 } }) });
        expect(attrWrites(p, keyOf(p, 'v_battery'), F.intValue)).toEqual([[80], [80]]);
    });

    it('point an enumeration slot to the literal σ names (killed by treating every InstanceValue as a link)', () => {
        const key = keyOf(plan, 'v_status');
        expect(refWrites(plan, key, F.instance)).toEqual([[keyOf(plan, 'lit_ok')], [keyOf(plan, 'lit_fault')]]);
    });

    it('touch only the first value of a multi-valued slot, the only one σ holds (killed by overriding the last or every holder)', () => {
        const objects = [
            ...OBJECTS.map(o => o.name === 's_battery'
                ? object('s_battery', M.Slot, 'dji', {}, { [F.defining]: ids('p_battery'), [F.values]: ids('v_battery', 'v_second') })
                : o),
            object('v_second', M.Int, 's_battery', { [F.intValue]: [90] }, {}),
        ];
        const p = planSnapshot({ ...BASE, objects });
        expect(attrWrites(p, keyOf(p, 'v_battery'), F.intValue)).toEqual([[80], [55]]);
        expect(attrWrites(p, keyOf(p, 'v_second'), F.intValue)).toEqual([[90]]);
    });

    it('write the first Slot of a feature, the one the compiler reads (killed by the last duplicate winning)', () => {
        const objects = [
            ...OBJECTS.map(o => o.name === 'dji'
                ? object('dji', M.Instance, null, {}, { [F.classifier]: ids('Drone'), [F.slots]: ids('s_battery', 's_copy') })
                : o),
            object('s_copy', M.Slot, 'dji', {}, { [F.defining]: ids('p_battery'), [F.values]: ids('v_copy') }),
            object('v_copy', M.Int, 's_copy', { [F.intValue]: [1] }, {}),
        ];
        const p = planSnapshot({ ...BASE, objects });
        expect(attrWrites(p, keyOf(p, 'v_battery'), F.intValue)).toEqual([[80], [55]]);
        expect(attrWrites(p, keyOf(p, 'v_copy'), F.intValue)).toEqual([[1]]);
    });

    it('write straight on the Slot when the value holder is an attribute of it (killed by requiring a holder object)', () => {
        const objects = OBJECTS.map(o => o.name === 's_battery'
            ? object('s_battery', M.Slot, 'dji', { [F.values]: [80] }, { [F.defining]: ids('p_battery') })
            : o).filter(o => o.name !== 'v_battery');
        const p = planSnapshot({ ...BASE, objects, sigma: sigmaOf({ dji: { battery: 3 } }) });
        expect(attrWrites(p, keyOf(p, 's_battery'), F.values)).toEqual([[80], [3]]);
    });
});

describe('planSnapshot: a slot in σ with no Slot object', () => {
    const plan = planSnapshot(BASE);
    const extra = creates(plan).filter(c => !OBJECTS.some(o => o.name === c.name));
    const slot = extra.find(c => c.classId === M.Slot)!;
    const holder = extra.find(c => c.classId === M.Int)!;

    it('creates one Slot and one holder under the instance (killed by no create or by a wrong owner)', () => {
        expect(extra).toHaveLength(2);
        expect(slot.ownerKey).toBe(keyOf(plan, 'dji'));
        expect(holder.ownerKey).toBe(slot.key);
    });

    it('gives the added objects no name of their own (killed by the internal id as a name)', () => {
        expect(extra.map(c => c.name)).toEqual([undefined, undefined]);
    });

    it('appends the new Slot to the slots of the instance, after those of the model (killed by replacing them)', () => {
        const [written] = refWrites(plan, keyOf(plan, 'dji'), F.slots);
        expect(written).toEqual([keyOf(plan, 's_battery'), keyOf(plan, 's_link'), keyOf(plan, 's_status'), slot.key]);
    });

    it('points the Slot to the feature of the copied class level (killed by the source feature id)', () => {
        expect(refWrites(plan, slot.key, F.defining)).toEqual([[keyOf(plan, 'p_range')]]);
        expect(refWrites(plan, slot.key, F.values)).toEqual([[holder.key]]);
    });

    it('writes the value of σ through the value kind of the feature type (killed by a wrong field or kind)', () => {
        expect(attrWrites(plan, holder.key, F.intValue)).toEqual([[12]]);
    });

    it('creates a Slot for an instance with no slots written at all (killed by appending only to an existing write)', () => {
        const p = planSnapshot({ ...BASE, sigma: sigmaOf({ temp: { range: 4 } }), slots: slotsOf({ temp: { range: 'p_range' } }) });
        const s = creates(p).find(c => c.classId === M.Slot && c.ownerKey === keyOf(p, 'temp'))!;
        expect(refWrites(p, keyOf(p, 'temp'), F.slots)).toEqual([[s.key]]);
    });

    it('uses the literal for an enumeration slot, by reference (killed by a string holder)', () => {
        const p = planSnapshot({ ...BASE, sigma: sigmaOf({ temp: { status: 'lit_ok' } }), slots: slotsOf({ temp: { status: 'p_status' } }) });
        const made = creates(p).filter(c => !OBJECTS.some(o => o.name === c.name));
        const h = made.find(c => c.classId === M.InstanceValue)!;
        expect(refWrites(p, h.key, F.instance)).toEqual([[keyOf(p, 'lit_ok')]]);
        expect(attrs(p).filter(o => o.key === h.key)).toEqual([]);
    });

    it('picks the value kind by the type of the feature (killed by the first value kind for every primitive)', () => {
        const p = planSnapshot({ ...BASE, sigma: sigmaOf({ temp: { title: 'hello' } }), slots: slotsOf({ temp: { title: 'p_title' } }) });
        const h = creates(p).find(c => c.classId === M.Str)!;
        expect(attrWrites(p, h.key, F.strValue)).toEqual([['hello']]);
    });

    it('fills a Slot that holds no value, creating only the holder (killed by a second Slot)', () => {
        const objects = OBJECTS.map(o => o.name === 's_battery'
            ? object('s_battery', M.Slot, 'dji', {}, { [F.defining]: ids('p_battery') })
            : o).filter(o => o.name !== 'v_battery');
        const p = planSnapshot({ ...BASE, objects, sigma: sigmaOf({ dji: { battery: 9 } }) });
        const made = creates(p).filter(c => !objects.some(o => o.name === c.name));
        expect(made.map(c => c.classId)).toEqual([M.Int]);
        expect(made[0].ownerKey).toBe(keyOf(p, 's_battery'));
        expect(refWrites(p, keyOf(p, 's_battery'), F.values)).toEqual([[made[0].key]]);
        expect(attrWrites(p, made[0].key, F.intValue)).toEqual([[9]]);
    });
});

describe('planSnapshot: what cannot be written is reported, not guessed', () => {
    it('a holder of a kind with no value kind (killed by writing through the first value kind)', () => {
        const objects = OBJECTS.map(o => o.name === 'v_battery' ? object('v_battery', M.Null, 's_battery', {}, {}) : o);
        const p = planSnapshot({ ...BASE, objects, sigma: sigmaOf({ dji: { battery: 5 } }) });
        expect(p.unwritten).toEqual([{ objectId: 'id-dji', what: 'battery', reason: 'holder-kind' }]);
        expect(attrs(p).filter(o => o.key === keyOf(p, 'v_battery'))).toEqual([]);
    });

    it('an instance outside the model and an attribute with no slot record (killed by a throw or by creating them)', () => {
        const sigma = new Map([['ghost', new Map<string, SimValue>([['x', 1]])], ['id-dji', new Map<string, SimValue>([['free', 1]])]]);
        const p = planSnapshot({ ...BASE, sigma, slots: slotsOf({ dji: {} }) });
        expect(p.unwritten).toEqual([
            { objectId: 'ghost', what: 'x', reason: 'no-instance' },
            { objectId: 'id-dji', what: 'free', reason: 'no-feature' },
        ]);
        expect(creates(p)).toHaveLength(OBJECTS.length);
    });

    it('a feature with no type, which could be a link or a value (killed by seeding a holder or by dropping it silently)', () => {
        const objects = [...OBJECTS, object('p_untyped', M.Property, 'Drone', {}, {})];
        const p = planSnapshot({ ...BASE, objects, sigma: sigmaOf({ temp: { u: 1 } }), slots: slotsOf({ temp: { u: 'p_untyped' } }) });
        expect(p.unwritten).toEqual([{ objectId: 'id-temp', what: 'u', reason: 'no-type' }]);
        expect(creates(p)).toHaveLength(objects.length);
    });

    it('is empty on a clean plan (killed by a report of every link)', () => {
        expect(planSnapshot(BASE).unwritten).toEqual([]);
    });
});

describe('planSnapshot: the operations are data', () => {
    it('never carry a function or a non-plain value (killed by a closure in an operation)', () => {
        const plan = planSnapshot(BASE);
        const roundTrip = JSON.parse(JSON.stringify(plan.operations)) as SnapshotOperation[];
        expect(roundTrip).toEqual(plan.operations);
    });
});
