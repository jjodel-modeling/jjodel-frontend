/**
 * JjScript effects planner (S4a, R-JJD-2): what a script would do, read without running it.
 *
 * One test per command kind and one per warning. The executor does not import under
 * `environment: 'node'` (it reaches monaco through `joiner`), so these tests pin the planner
 * against the executor rules quoted in `../effectsPlanner.ts`, not against a live run.
 */
import { describe, it, expect } from 'vitest';
import { planEffects, type PlanWorld } from '../effectsPlanner';

const UNBOUNDED = -1;

/** A small state machine: a machine contains states, a state holds outgoing transitions. */
function world(): PlanWorld {
    return {
        classes: {
            Machine: {
                name: 'Machine', kinds: ['Machine'],
                attributes: [{ name: 'name', upper: 1 }],
                references: [
                    { name: 'states', containment: true, upper: UNBOUNDED, type: 'State' },
                    { name: 'initial', containment: true, upper: 1, type: 'State' },
                ],
            },
            State: {
                name: 'State', kinds: ['State'],
                attributes: [{ name: 'name', upper: 1 }, { name: 'tags', upper: UNBOUNDED }],
                references: [
                    { name: 'outgoing', containment: false, upper: UNBOUNDED, type: 'Transition', opposite: 'source' },
                    { name: 'next', containment: false, upper: 1, type: 'State' },
                    { name: 'pair', containment: false, upper: 2, type: 'State' },
                ],
            },
            FinalState: {
                name: 'FinalState', kinds: ['FinalState', 'State'],
                attributes: [{ name: 'name', upper: 1 }, { name: 'tags', upper: UNBOUNDED }],
                references: [
                    { name: 'outgoing', containment: false, upper: UNBOUNDED, type: 'Transition', opposite: 'source' },
                    { name: 'next', containment: false, upper: 1, type: 'State' },
                    { name: 'pair', containment: false, upper: 2, type: 'State' },
                ],
            },
            Transition: {
                name: 'Transition', kinds: ['Transition'],
                attributes: [{ name: 'name', upper: 1 }],
                references: [{ name: 'source', containment: false, upper: 1, type: 'State', opposite: 'outgoing' }],
            },
            Vertex: { name: 'Vertex', kinds: ['Vertex'], abstract: true, attributes: [], references: [] },
            Config: { name: 'Config', kinds: ['Config'], singleton: true, attributes: [], references: [] },
        },
        elements: [
            { id: 'm', name: 'M', className: 'Machine', root: true, references: { states: ['a'] } },
            { id: 'a', name: 'A', className: 'State', root: false, container: { owner: 'm', feature: 'states' }, references: { next: ['b'] } },
            { id: 'b', name: 'B', className: 'State', root: true },
            { id: 'd1', name: 'Dup', className: 'State', root: true },
            { id: 'd2', name: 'Dup', className: 'State', root: true },
        ],
    };
}

const codes = (xs: { code: string }[]) => xs.map((x) => x.code);

describe('create instance', () => {
    it('plans a root instance with its metaclass and name', async () => {
        const plan = await planEffects('create instance of State "S1"', world());
        expect(plan.created).toEqual([{ line: 1, id: 'planned:1', metaclass: 'State', name: 'S1', container: null }]);
        expect(plan.error).toBeNull();
        expect(plan.warnings).toEqual([]);
    });

    it('names an unnamed instance after its class, skipping names in use (instance.ts:271-282)', async () => {
        const plan = await planEffects('create instance of Machine\ncreate instance of Machine', world());
        expect(plan.created.map((c) => c.name)).toEqual(['Machine', 'Machine2']);
    });

    it('plans an instance born in a container slot, with its path (R-JS-9)', async () => {
        const plan = await planEffects('create instance of FinalState "F" in M.states', world());
        expect(plan.created).toEqual([{ line: 1, id: 'planned:1', metaclass: 'FinalState', name: 'F', container: 'M.states' }]);
    });

    it('refuses a container slot that is not a containment (NOT_A_CONTAINMENT)', async () => {
        const plan = await planEffects('create instance of State "S" in B.next', world());
        expect(plan.created).toEqual([]);
        expect(plan.error).toMatchObject({ line: 1, code: 'NOT_A_CONTAINMENT' });
    });

    it('refuses a type the container slot does not hold (TYPE_MISMATCH)', async () => {
        const plan = await planEffects('create instance of Transition "T" in M.states', world());
        expect(plan.error).toMatchObject({ line: 1, code: 'TYPE_MISMATCH' });
    });

    it('counts the children this run created into a bounded slot (MULTIPLICITY_EXCEEDED, instance.ts:474-482)', async () => {
        const plan = await planEffects('create instance of State "I1" in M.initial\ncreate instance of State "I2" in M.initial', world());
        expect(plan.created.map((c) => c.name)).toEqual(['I1']);
        expect(plan.error).toMatchObject({ line: 2, code: 'MULTIPLICITY_EXCEEDED' });
    });

    it('refuses an abstract and a singleton class, and a handle claimed twice', async () => {
        const plan = await planEffects(
            'create instance of Vertex "V"\ncreate instance of Config "C"\ncreate instance of State "S"\ncreate instance of State "S"',
            world(),
        );
        expect(plan.error).toMatchObject({ line: 1, code: 'ABSTRACT_CLASS' });
        expect(codes(plan.errors)).toEqual(['ABSTRACT_CLASS', 'SINGLETON_CLASS', 'HANDLE_IN_USE']);
        expect(plan.created.map((c) => c.name)).toEqual(['S']);
    });
});

describe('set an attribute', () => {
    it('plans the value written', async () => {
        const plan = await planEffects('set B.name = "Idle"', world());
        expect(plan.features).toEqual([{ line: 1, owner: 'B', ownerId: 'b', feature: 'name', value: 'Idle', many: false }]);
    });

    it('marks a multi-valued attribute: `=` writes its first value (LValue.set_value)', async () => {
        const plan = await planEffects('set B.tags = "hot"', world());
        expect(plan.features[0]).toMatchObject({ feature: 'tags', value: 'hot', many: true });
    });

    it('refuses `+=` on an attribute (OPERATOR_NOT_SUPPORTED, instance.ts:977-987)', async () => {
        const plan = await planEffects('set B.name += "x"', world());
        expect(plan.features).toEqual([]);
        expect(plan.error).toMatchObject({ line: 1, code: 'OPERATOR_NOT_SUPPORTED' });
    });
});

describe('reference writes', () => {
    it('`=` on a single-valued reference replaces the target', async () => {
        const plan = await planEffects('set A.next = Dup', { ...world(), elements: world().elements.filter((e) => e.id !== 'd2') });
        expect(plan.references).toEqual([{
            line: 1, source: 'A', sourceId: 'a', feature: 'next', operator: '=', target: 'Dup', targetId: 'd1',
            containment: false, targetCreated: false, removed: ['b'],
        }]);
    });

    it('`=` on a multi-valued reference appends, to a target created earlier in the script', async () => {
        const plan = await planEffects('create instance of Transition "T"\nset B.outgoing = T\nset T.source = B', world());
        expect(plan.references[0]).toMatchObject({ line: 2, source: 'B', feature: 'outgoing', target: 'T', targetId: 'planned:1', targetCreated: true, removed: [] });
        expect(plan.warnings).toEqual([]);
    });

    it('`+=` appends while the slot has room, and refuses a full one (MULTIPLICITY_EXCEEDED)', async () => {
        const plan = await planEffects('set B.pair += A\nset B.pair += B\nset B.pair += Dup', { ...world(), elements: world().elements.filter((e) => e.id !== 'd2') });
        expect(plan.references.map((r) => r.target)).toEqual(['A', 'B']);
        expect(plan.error).toMatchObject({ line: 3, code: 'MULTIPLICITY_EXCEEDED' });
    });

    it('`-=` and `remove … from` take a held target out, and refuse an absent one (NOT_LINKED)', async () => {
        const plan = await planEffects('set A.next -= B\nremove B from A.next', world());
        expect(plan.references[0]).toMatchObject({ line: 1, operator: '-=', target: 'B', targetId: 'b', removed: ['b'] });
        expect(plan.error).toMatchObject({ line: 2, code: 'NOT_LINKED' });
    });

    it('refuses `-=` of a child born in that containment slot (WOULD_ORPHAN, instance.ts:1246-1251)', async () => {
        const plan = await planEffects('create instance of State "C" in M.states\nset M.states -= C', world());
        expect(plan.error).toMatchObject({ line: 2, code: 'WOULD_ORPHAN' });
    });

    it('`= null` empties the slot', async () => {
        const plan = await planEffects('set A.next = null', world());
        expect(plan.references).toEqual([{
            line: 1, source: 'A', sourceId: 'a', feature: 'next', operator: 'clear', target: null, targetId: null,
            containment: false, targetCreated: false, removed: ['b'],
        }]);
    });

    it('refuses a target of the wrong type (TYPE_MISMATCH, linkTypeMismatch)', async () => {
        const plan = await planEffects('set A.next = M', world());
        expect(plan.references).toEqual([]);
        expect(plan.error).toMatchObject({ line: 1, code: 'TYPE_MISMATCH' });
    });

    it('refuses an ambiguous target (AMBIGUOUS_INSTANCE)', async () => {
        const plan = await planEffects('set A.next = Dup', world());
        expect(plan.error).toMatchObject({ line: 1, code: 'AMBIGUOUS_INSTANCE' });
    });

    it('resolves a target created by a LATER line, as the pass loop does (R-JS-3)', async () => {
        const plan = await planEffects('set A.next = Late\ncreate instance of State "Late"', world());
        expect(plan.references[0]).toMatchObject({ line: 1, target: 'Late', targetId: 'planned:1', targetCreated: true });
        expect(plan.warnings).toEqual([]);
    });
});

describe('rename and delete', () => {
    it('rename moves the name a later line addresses', async () => {
        const plan = await planEffects('rename B to "Busy"\nset Busy.name = "x"', world());
        expect(plan.renamed).toEqual([{ line: 1, id: 'b', from: 'B', to: 'Busy' }]);
        expect(plan.features[0]).toMatchObject({ owner: 'Busy', ownerId: 'b' });
    });

    it('rename of a created instance frees its handle for a later create (renameHandle, instance.ts:874)', async () => {
        const plan = await planEffects('create instance of State "S"\nrename S to "T"\ncreate instance of State "S"', world());
        expect(plan.created.map((c) => c.name)).toEqual(['S', 'S']);
        expect(plan.error).toBeNull();
    });

    it('delete lists the instance and what it contains', async () => {
        const plan = await planEffects('delete M', world());
        expect(plan.deleted).toEqual([{ line: 1, id: 'm', name: 'M', contained: ['A'] }]);
    });
});

describe('warnings', () => {
    it('unknown metaclass (CLASS_NOT_FOUND)', async () => {
        const plan = await planEffects('create instance of Ghost "g"', world());
        expect(plan.warnings).toEqual([expect.objectContaining({ line: 1, code: 'CLASS_NOT_FOUND' })]);
        expect(plan.created).toEqual([]);
    });

    it('unknown feature (UNKNOWN_PROPERTY)', async () => {
        const plan = await planEffects('set B.colour = "red"', world());
        expect(plan.warnings).toEqual([expect.objectContaining({ line: 1, code: 'UNKNOWN_PROPERTY' })]);
    });

    it('unresolvable target (INSTANCE_NOT_FOUND), after the retry passes', async () => {
        const plan = await planEffects('set B.next = Nowhere', world());
        expect(plan.warnings).toEqual([expect.objectContaining({ line: 1, code: 'INSTANCE_NOT_FOUND' })]);
        expect(plan.references).toEqual([]);
    });

    it('one end written of an opposite pair (OPPOSITE_ONE_END, A3)', async () => {
        const plan = await planEffects('create instance of Transition "T"\nset B.outgoing = T', world());
        expect(plan.warnings).toEqual([expect.objectContaining({ line: 2, code: 'OPPOSITE_ONE_END' })]);
    });

    it('an M2 command is one `unsupported: <command>` warning, with no effect', async () => {
        const plan = await planEffects('create class Foo', world());
        expect(plan.warnings).toEqual([{ line: 1, code: 'UNSUPPORTED', message: 'unsupported: create class' }]);
        expect(plan.created).toEqual([]);
        expect(plan.error).toBeNull();
    });

    it('a line that does not parse is the error, with its line; comments and blanks are skipped', async () => {
        const plan = await planEffects('// a comment\n\nset B.name = "x"\nset = =', world());
        expect(plan.features[0].line).toBe(3);
        expect(plan.error).toMatchObject({ line: 4, code: 'PARSE_ERROR' });
    });
});

describe('read only', () => {
    it('leaves the world it was given as it was', async () => {
        const w = world();
        const before = JSON.stringify(w);
        await planEffects('create instance of State "S" in M.states\nset A.next = null\ndelete M\nrename B to "C"', w);
        expect(JSON.stringify(w)).toBe(before);
    });
});
