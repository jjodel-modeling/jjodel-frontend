/**
 * Tests of `jjform/create` — the pure half of the create event (slice 2c).
 *
 * The fixture is the contract's own `metamodelShape` example, spelled in full:
 * `StateMachine` (root, two child slots), `State` (contained, required `name`, an
 * enum `kind`), `Transition` (contained, two required references). Using the
 * document's own literal rather than a convenient shape is the point — if the type
 * and the document drift apart, this file stops compiling.
 */

import { describe, expect, it } from 'vitest';
import type { ClassShape, MetamodelShape, RefShape } from '../shape';
import {
    addChildReason,
    draftableAttrs,
    draftableRefs,
    draftModel,
    newDraft,
    newInstanceReason,
    setDraftRef,
    setDraftValue,
    validateDraft,
} from '../create';

const ref = (o: Partial<RefShape> & { key: string; of: string }): RefShape => ({
    id: 'r_' + o.key,
    lower: 0,
    upper: -1,
    many: true,
    required: false,
    derived: false,
    readOnly: false,
    ofId: 'c_' + o.of,
    composition: false,
    ...o,
});

const SHAPE: MetamodelShape = {
    enums: {
        StateKind: {
            id: 'e1',
            name: 'StateKind',
            literals: [
                { id: 'l1', name: 'initial' },
                { id: 'l2', name: 'normal' },
                { id: 'l3', name: 'final' },
            ],
        },
    },
    classes: {
        StateMachine: {
            key: 'StateMachine', id: 'c_StateMachine',
            root: true, abstract: false, singleton: false, containedIn: [],
            attrs: [{
                key: 'name', id: 'a_sm_name', lower: 0, upper: 1, many: false, required: false,
                derived: false, readOnly: false, type: 'string', typeName: 'EString',
            }],
            refs: [],
            children: [
                ref({ key: 'states', of: 'State', composition: true }),
                ref({ key: 'transitions', of: 'Transition', composition: true, upper: 2, many: true }),
            ],
        },
        State: {
            key: 'State', id: 'c_State',
            root: false, abstract: false, singleton: false, containedIn: ['StateMachine'],
            attrs: [
                {
                    key: 'name', id: 'a1', lower: 1, upper: 1, many: false, required: true,
                    derived: false, readOnly: false, type: 'string', typeName: 'EString',
                },
                {
                    key: 'kind', id: 'a2', lower: 0, upper: 1, many: false, required: false,
                    derived: false, readOnly: false, type: 'enum', enum: 'StateKind', typeName: 'StateKind',
                },
                {
                    key: 'degree', id: 'a3', lower: 0, upper: 1, many: false, required: false,
                    derived: true, readOnly: true, type: 'number', typeName: 'EInt',
                },
            ],
            refs: [],
            children: [],
        },
        Transition: {
            key: 'Transition', id: 'c_Transition',
            root: false, abstract: false, singleton: false, containedIn: ['StateMachine'],
            attrs: [{
                key: 'name', id: 'a_t_name', lower: 0, upper: 1, many: false, required: false,
                derived: false, readOnly: false, type: 'string', typeName: 'EString',
            }],
            refs: [
                ref({ key: 'source', of: 'State', lower: 1, upper: 1, many: false, required: true }),
                ref({ key: 'target', of: 'State', lower: 1, upper: 1, many: false, required: true }),
            ],
            children: [],
        },
    },
};

const abstractCls: ClassShape = {
    ...SHAPE.classes.State, key: 'Abstract', id: 'c_Abstract', abstract: true, root: true,
};
const singletonCls: ClassShape = {
    ...SHAPE.classes.StateMachine, key: 'Config', id: 'c_Config', singleton: true,
};

describe('newInstanceReason — whether the catalogue offers New', () => {
    it('offers New on a rootable concrete metaclass', () => {
        expect(newInstanceReason(SHAPE.classes.StateMachine, 0)).toBeNull();
        expect(newInstanceReason(SHAPE.classes.StateMachine, 12)).toBeNull();
    });

    it('refuses a non-rootable one, naming its containers', () => {
        const reason = newInstanceReason(SHAPE.classes.State, 0);
        expect(reason).toBe("Created from its container's form (StateMachine)");
    });

    it('refuses an abstract one before anything else', () => {
        expect(newInstanceReason(abstractCls, 0)).toBe('Abstract metaclass — it has no direct instances');
    });

    it('offers a singleton its first instance and refuses the second', () => {
        expect(newInstanceReason(singletonCls, 0)).toBeNull();
        expect(newInstanceReason(singletonCls, 1)).toBe('Singleton — the one Config of this model already exists');
    });
});

describe('addChildReason — whether a child slot offers Add', () => {
    const unbounded = SHAPE.classes.StateMachine.children[0];
    const bounded = SHAPE.classes.StateMachine.children[1];   // upper: 2

    it('never fills an unbounded slot', () => {
        expect(addChildReason(unbounded, 0)).toBeNull();
        expect(addChildReason(unbounded, 999)).toBeNull();
    });

    it('offers Add while a bounded slot has room', () => {
        expect(addChildReason(bounded, 0)).toBeNull();
        expect(addChildReason(bounded, 1)).toBeNull();
    });

    it('refuses once the bound is reached, with the cardinality as the reason', () => {
        expect(addChildReason(bounded, 2)).toBe('«transitions» is full — cardinality 0..2');
        expect(addChildReason(bounded, 3)).toBe('«transitions» is full — cardinality 0..2');
    });

    it('refuses a read-only slot whatever its count', () => {
        expect(addChildReason({ ...unbounded, readOnly: true }, 0)).toBe('«states» is read-only');
    });
});

describe('newDraft', () => {
    it('carries the route without interpreting it', () => {
        const root = newDraft(SHAPE, 'StateMachine');
        expect(root).toMatchObject({ cls: 'StateMachine', ownerId: null, childKey: null });

        const child = newDraft(SHAPE, 'State', 'm1', 'states');
        expect(child).toMatchObject({ cls: 'State', ownerId: 'm1', childKey: 'states' });
    });

    it('opens an enum on its first literal, by id', () => {
        expect(newDraft(SHAPE, 'State').values.kind).toBe('l1');
    });

    it('opens every other field empty, and gives every draftable feature a key', () => {
        const d = newDraft(SHAPE, 'Transition');
        expect(d.values).toEqual({ name: '' });
        expect(d.refs).toEqual({ source: '', target: '' });
    });

    it('offers no control over a derived or read-only feature', () => {
        expect(draftableAttrs(SHAPE.classes.State).map(a => a.key)).toEqual(['name', 'kind']);
        expect(newDraft(SHAPE, 'State').values).not.toHaveProperty('degree');
        expect(draftableRefs(SHAPE.classes.Transition).map(r => r.key)).toEqual(['source', 'target']);
    });

    it('returns an empty draft for an unknown metaclass instead of throwing', () => {
        expect(newDraft(SHAPE, 'Nope')).toEqual({
            cls: 'Nope', ownerId: null, childKey: null, values: {}, refs: {},
        });
    });
});

describe('validateDraft — required by cardinality', () => {
    it('blocks a missing required attribute and names the cardinality', () => {
        const errors = validateDraft(SHAPE, newDraft(SHAPE, 'State', 'm1', 'states'));
        expect(errors.name).toBe('Required by cardinality 1..1');
        expect(errors).not.toHaveProperty('kind');
    });

    it('clears once the value arrives', () => {
        const d = setDraftValue(newDraft(SHAPE, 'State', 'm1', 'states'), 'name', 'red');
        expect(validateDraft(SHAPE, d)).toEqual({});
    });

    it('does not accept whitespace as a value', () => {
        const d = setDraftValue(newDraft(SHAPE, 'State', 'm1', 'states'), 'name', '   ');
        expect(validateDraft(SHAPE, d).name).toBe('Required by cardinality 1..1');
    });

    it('blocks missing required references, one error per feature', () => {
        const errors = validateDraft(SHAPE, newDraft(SHAPE, 'Transition', 'm1', 'transitions'));
        expect(errors).toEqual({
            source: 'Required by cardinality 1..1',
            target: 'Required by cardinality 1..1',
        });
    });

    it('clears each reference independently', () => {
        let d = newDraft(SHAPE, 'Transition', 'm1', 'transitions');
        d = setDraftRef(d, 'source', 's1');
        expect(validateDraft(SHAPE, d)).toEqual({ target: 'Required by cardinality 1..1' });
    });
});

describe('validateDraft — the name is unique among siblings (12a)', () => {
    const base = () => setDraftValue(newDraft(SHAPE, 'State', 'm1', 'states'), 'name', 'red');

    it('names the conflict', () => {
        const errors = validateDraft(SHAPE, base(), { siblingNames: ['green', 'red'] });
        expect(errors.name).toBe('A State named «red» already exists here');
    });

    it('accepts a name no sibling holds', () => {
        expect(validateDraft(SHAPE, base(), { siblingNames: ['green', 'amber'] })).toEqual({});
    });

    it('compares trimmed, both sides', () => {
        const d = setDraftValue(newDraft(SHAPE, 'State'), 'name', '  red  ');
        expect(validateDraft(SHAPE, d, { siblingNames: [' red '] }).name)
            .toBe('A State named «red» already exists here');
    });

    it('does not make an empty name collide with unnamed siblings', () => {
        // The required error fires, not the uniqueness one: the absence of a name
        // is not a name that collides.
        const errors = validateDraft(SHAPE, newDraft(SHAPE, 'State'), { siblingNames: ['', '  '] });
        expect(errors.name).toBe('Required by cardinality 1..1');
    });

    it('leaves other attributes free to repeat', () => {
        const d = setDraftValue(base(), 'kind', 'l2');
        expect(validateDraft(SHAPE, d, { siblingNames: ['green'] })).toEqual({});
    });
});

describe('draftModel — what a UI renders', () => {
    it('titles the create and orders attrs before refs', () => {
        const model = draftModel(SHAPE, newDraft(SHAPE, 'Transition', 'm1', 'transitions'));
        expect(model.title).toBe('New Transition');
        expect(model.fields.map(f => f.key)).toEqual(['name', 'source', 'target']);
        expect(model.fields.map(f => f.kind)).toEqual(['text', 'ref', 'ref']);
    });

    it('is invalid while any field carries an error, valid when none does', () => {
        let d = newDraft(SHAPE, 'Transition', 'm1', 'transitions');
        expect(draftModel(SHAPE, d).valid).toBe(false);
        d = setDraftRef(setDraftRef(d, 'source', 's1'), 'target', 's2');
        expect(draftModel(SHAPE, d).valid).toBe(true);
    });

    it('reports the error PER FIELD, not as a banner', () => {
        const model = draftModel(SHAPE, newDraft(SHAPE, 'Transition', 'm1', 'transitions'));
        expect(model.fields.find(f => f.key === 'source')?.error).toBe('Required by cardinality 1..1');
        expect(model.fields.find(f => f.key === 'name')?.error).toBeNull();
    });

    it('carries the enum literals as options, with id and name apart', () => {
        const kind = draftModel(SHAPE, newDraft(SHAPE, 'State')).fields.find(f => f.key === 'kind');
        expect(kind?.options).toEqual([
            { id: 'l1', label: 'initial' },
            { id: 'l2', label: 'normal' },
            { id: 'l3', label: 'final' },
        ]);
    });

    it('carries the reference candidates the host resolved, and no others', () => {
        const model = draftModel(SHAPE, newDraft(SHAPE, 'Transition', 'm1', 'transitions'), {
            candidates: { source: [{ id: 's1', label: 'red' }] },
        });
        expect(model.fields.find(f => f.key === 'source')?.options).toEqual([{ id: 's1', label: 'red' }]);
        expect(model.fields.find(f => f.key === 'target')?.options).toEqual([]);
    });

    it('prints the multiplicity and the required flag of each field', () => {
        const model = draftModel(SHAPE, newDraft(SHAPE, 'State'));
        const name = model.fields.find(f => f.key === 'name');
        expect(name).toMatchObject({ multiplicity: '1..1', required: true, typeName: 'EString' });
        const kind = model.fields.find(f => f.key === 'kind');
        expect(kind).toMatchObject({ multiplicity: '0..1', required: false, typeName: 'StateKind' });
    });
});

describe('the two routes are one event', () => {
    it('produces the same fields whichever gesture opened the draft', () => {
        const fromCatalogue = draftModel(SHAPE, newDraft(SHAPE, 'State'));
        const fromChildSlot = draftModel(SHAPE, newDraft(SHAPE, 'State', 'm1', 'states'));
        expect(fromChildSlot.fields).toEqual(fromCatalogue.fields);
        expect(fromChildSlot.title).toBe(fromCatalogue.title);
    });

    it('keeps the destination on the draft, and only there', () => {
        const d = newDraft(SHAPE, 'State', 'm1', 'states');
        expect({ ownerId: d.ownerId, childKey: d.childKey }).toEqual({ ownerId: 'm1', childKey: 'states' });
    });
});

describe('immutability of the draft', () => {
    it('setDraftValue and setDraftRef return a new draft and mutate nothing', () => {
        const d = newDraft(SHAPE, 'Transition');
        const withName = setDraftValue(d, 'name', 'go');
        const withRef = setDraftRef(d, 'source', 's1');
        expect(d.values.name).toBe('');
        expect(d.refs.source).toBe('');
        expect(withName.values.name).toBe('go');
        expect(withRef.refs.source).toBe('s1');
    });
});
