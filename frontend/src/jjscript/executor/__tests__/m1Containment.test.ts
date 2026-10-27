/**
 * R-JS-9..11 — an M1 instance born inside its container, the model-wide name lookup, and the
 * readiness of the M1 wait (`docs/discovery/discovery_2026-10-04_jjscript_m1_containment.md`).
 *
 * The handlers run for real on an in-memory model; the joiner is reduced to what they touch:
 * `LPointerTargetable.fromPointer` (id -> object), `DObject.new` (recorded, and the new object
 * stored under its id) and the `DModel` / `DValue` father types. The commands are parsed by the
 * real parser, so the AST the handlers read is the one Run hands them.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
    store: new Map<string, any>(),
    created: [] as any[],
    next: 0,
    project: null as any,
}));

vi.mock('../../../joiner', () => {
    class DModel {}
    class DValue {}
    return {
        LPointerTargetable: { fromPointer: (id: string) => h.store.get(id) },
        DObject: {
            new: (instanceof_: string, father: string, fatherType: any, name: string, persist: boolean) => {
                const id = `new${++h.next}`;
                const d = { id, name, instanceof: instanceof_, father, fatherType, persist };
                h.created.push(d);
                h.store.set(id, { id, name, className: 'DObject', __raw: {}, delete() { h.store.delete(id); } });
                return d;
            },
        },
        DModel,
        DValue,
        SetFieldAction: { new: () => undefined },
        TRANSACTION: (_: string, fn: () => void) => fn(),
        LModel: class {},
        LProject: class {},
        LClass: class {},
    };
});

vi.mock('../utils', () => ({
    getProject: () => h.project,
    getTargetMetamodel: () => null,
}));

vi.mock('../resolvers', () => ({
    resolveElementInMetamodel: () => null,
    resolveElement: () => null,
}));

// `delete instance` (#171) settles the queued writes and goes through the delete plan of the
// Configurator and the Data Manager; both reach the store, so here they act on the in-memory one:
// the plan deletes the instance alone, and applying it calls each `.delete()`, as
// `deleteAdapter.applyDelete` does (`instanceDelete.test.ts` covers the plan itself).
vi.mock('../../../redux/action/action', () => ({ COMMIT: () => undefined }));
vi.mock('../../../components/editor-v2/hooks/shapeAdapter', () => ({
    makeShapeCtx: () => ({ shape: () => ({ enums: {}, classes: {} }) }),
}));
vi.mock('../../../components/editor-v2/hooks/deleteAdapter', () => ({
    preflightFor: (_modelId: string, _shape: unknown, id: string) => ({ id }),
    deletePlan: (preflight: { id: string }) => ({ deletes: [preflight.id], blocked: null }),
    applyDelete: (plan: { deletes: string[] }) => {
        let deleted = 0;
        for (const id of plan.deletes) {
            const o = h.store.get(id);
            if (o) { o.delete(); deleted++; }
        }
        return deleted;
    },
}));

import { DModel, DValue } from '../../../joiner';
import { parse } from '../../parser/parser';
import {
    executeCreateInstance,
    executeDeleteInstance,
    executeRenameInstance,
    findInstanceByName,
} from '../commands/instance';
import { clearHandles, getHandleId, registerHandle } from '../handleRegistry';
import { extractDependencies } from '../dependencies';
import { waitForDependencies } from '../elementWaiter';

// ── The ESM metamodel ────────────────────────────────────────────────────────────────────────────

function cls(name: string, supers: any[] = []): any {
    const c: any = {
        id: `c_${name}`, name, abstract: false, isSingleton: false, references: [] as any[], attributes: [] as any[], supers,
        get allReferences() { return [...c.references, ...c.supers.flatMap((s: any) => s.allReferences)]; },
        get allAttributes() { return [...c.attributes, ...c.supers.flatMap((s: any) => s.allAttributes)]; },
        isExtending(t: any): boolean { return !!t && (t.id === c.id || c.supers.some((s: any) => s.isExtending(t))); },
    };
    return c;
}
const State = cls('State');
const Initial = cls('Initial', [State]);
const Transition = cls('Transition');
const SubTransition = cls('SubTransition', [Transition]);
const Event = cls('Event');
const Box = cls('Box');
State.references.push({ name: 'transitions', containment: true, type: Transition, upperBound: -1 });
Transition.references.push({ name: 'nextState', containment: false, type: State, upperBound: 1 });
Transition.references.push({ name: 'event', containment: false, type: Event, upperBound: 1 });
Transition.attributes.push({ name: 'guard' });
Box.references.push({ name: 'item', containment: true, type: Transition, upperBound: 1 });
const metamodel = { id: 'mm1', name: 'esm', classes: [State, Initial, Transition, SubTransition, Event, Box] };

/** An instance as the L-layer shows it once committed: metaclass in the store, its slots. */
function inst(id: string, name: string, metaclass: any, slots: Record<string, string[]> = {}): any {
    const o: any = { id, name, className: 'DObject', instanceof: metaclass, __raw: { id, instanceof: metaclass?.id }, subObjects: [] };
    for (const [ref, values] of Object.entries(slots)) o['$' + ref] = { id: `${id}_${ref}`, __raw: { values } };
    h.store.set(id, o);
    return o;
}

let model: any;
function setModel(objects: any[]) {
    model = { id: 'm1', name: 'M1', isMetamodel: false, objects };
    h.project = { id: 'p', models: [model], metamodels: [metamodel] };
}

const context: any = { projectId: 'p', modelId: 'm1', targetMetamodelId: 'mm1', level: 'M1', history: [], variables: new Map() };
const argsOf = (line: string): any => {
    const r = parse(line);
    if (!r.success) throw new Error(`parse failed: ${line}: ${r.errors?.[0]?.message}`);
    return r.ast!.args;
};
const create = (line: string) => executeCreateInstance(argsOf(line), context, h.project);
const codeOf = (r: any) => r.errors?.[0]?.code;

beforeEach(() => {
    h.store.clear();
    h.created = [];
    h.next = 0;
    clearHandles();
    setModel([inst('idle', 'idle', Initial, { transitions: [] }), inst('cooking', 'cooking', State, { transitions: [] })]);
});

// ── R-JS-9: create inside a container ──────────────────────────────────────────────────────────

describe('create instance … in <Parent>.<ref> (R-JS-9)', () => {
    it('is born in the slot of its parent: the DValue is the father, not the model', async () => {
        const r = await create('create instance of Transition "tStart" in idle.transitions');
        expect(r.success).toBe(true);
        expect(h.created).toHaveLength(1);
        expect(h.created[0]).toMatchObject({ instanceof: 'c_Transition', father: 'idle_transitions', fatherType: DValue, name: 'tStart', persist: true });
        expect(getHandleId('tStart')).toBe(h.created[0].id);
    });

    it('without `in` it is born at the model root, as before', async () => {
        const r = await create('create instance of Transition "tRoot"');
        expect(r.success).toBe(true);
        expect(h.created[0]).toMatchObject({ father: 'm1', fatherType: DModel });
    });

    it('finds a parent created earlier in the same run by its handle', async () => {
        inst('doorOpenId', 'doorOpen', State, { transitions: [] });
        registerHandle('doorOpen', 'doorOpenId');
        const r = await create('create instance of Transition "tClose" in doorOpen.transitions');
        expect(r.success).toBe(true);
        expect(h.created[0].father).toBe('doorOpenId_transitions');
    });

    it('a parent that does not exist yet: INSTANCE_NOT_FOUND, nothing written', async () => {
        const r = await create('create instance of Transition "tClose" in doorOpen.transitions');
        expect(codeOf(r)).toBe('INSTANCE_NOT_FOUND');
        expect(h.created).toEqual([]);
        expect(getHandleId('tClose')).toBeUndefined();
    });

    it('an ambiguous parent: AMBIGUOUS_INSTANCE, nothing written', async () => {
        setModel([inst('a', 'twin', State, { transitions: [] }), inst('b', 'twin', State, { transitions: [] })]);
        const r = await create('create instance of Transition "t" in twin.transitions');
        expect(codeOf(r)).toBe('AMBIGUOUS_INSTANCE');
        expect(h.created).toEqual([]);
    });

    it('a parent whose metaclass is not in the store yet: CONTAINER_NOT_READY, nothing written', async () => {
        const fresh = inst('freshId', 'fresh', State, { transitions: [] });
        fresh.instanceof = undefined;
        fresh.__raw = { id: 'freshId' };
        registerHandle('fresh', 'freshId');
        const r = await create('create instance of Transition "t" in fresh.transitions');
        expect(codeOf(r)).toBe('CONTAINER_NOT_READY');
        expect(h.created).toEqual([]);
    });

    it('a parent whose slot is not there yet: CONTAINER_NOT_READY, nothing written', async () => {
        inst('noSlotId', 'noSlot', State);
        registerHandle('noSlot', 'noSlotId');
        const r = await create('create instance of Transition "t" in noSlot.transitions');
        expect(codeOf(r)).toBe('CONTAINER_NOT_READY');
        expect(h.created).toEqual([]);
    });

    it('a reference the parent does not have, or an attribute: UNKNOWN_PROPERTY', async () => {
        setModel([inst('idle', 'idle', Initial, { transitions: [] }), inst('t0', 't0', Transition, { nextState: [] })]);
        expect(codeOf(await create('create instance of Transition "t" in idle.exits'))).toBe('UNKNOWN_PROPERTY');
        expect(codeOf(await create('create instance of Transition "t" in t0.guard'))).toBe('UNKNOWN_PROPERTY');
        expect(h.created).toEqual([]);
    });

    it('a reference that is not a containment: NOT_A_CONTAINMENT', async () => {
        setModel([inst('t0', 't0', Transition, { nextState: [] })]);
        const r = await create('create instance of State "s" in t0.nextState');
        expect(codeOf(r)).toBe('NOT_A_CONTAINMENT');
        expect(h.created).toEqual([]);
    });

    it('a class that does not conform to the slot: TYPE_MISMATCH; a subclass conforms', async () => {
        expect(codeOf(await create('create instance of Event "e" in idle.transitions'))).toBe('TYPE_MISMATCH');
        expect(h.created).toEqual([]);
        expect((await create('create instance of SubTransition "st" in idle.transitions')).success).toBe(true);
    });

    it('reads the reference through the parent\'s superclasses', async () => {
        // idle is an Initial; `transitions` is declared on State.
        expect((await create('create instance of Transition "t" in idle.transitions')).success).toBe(true);
    });

    it('a full slot: MULTIPLICITY_EXCEEDED on the committed values', async () => {
        setModel([inst('box', 'box', Box, { item: ['x'] })]);
        const r = await create('create instance of Transition "t" in box.item');
        expect(codeOf(r)).toBe('MULTIPLICITY_EXCEEDED');
        expect(h.created).toEqual([]);
    });

    it('counts the children this run created into the slot before the store lists them', async () => {
        setModel([inst('box', 'box', Box, { item: [] })]);
        expect((await create('create instance of Transition "t1" in box.item')).success).toBe(true);
        // The slot still reads [] (the store lists the child ~300 ms later): the second must not pass.
        const second = await create('create instance of Transition "t2" in box.item');
        expect(codeOf(second)).toBe('MULTIPLICITY_EXCEEDED');
        expect(h.created).toHaveLength(1);
    });

    it('a child counted as pending once listed is counted once', async () => {
        setModel([inst('box', 'box', Box, { item: [] })]);
        await create('create instance of Transition "t1" in box.item');
        h.store.get('box').$item.__raw.values = [h.created[0].id];
        Box.references[0].upperBound = 2;
        try {
            expect((await create('create instance of Transition "t2" in box.item')).success).toBe(true);
        } finally {
            Box.references[0].upperBound = 1;
        }
    });

    it('the pending count belongs to the run: cleared with the handles', async () => {
        setModel([inst('box', 'box', Box, { item: [] })]);
        await create('create instance of Transition "t1" in box.item');
        clearHandles();
        expect((await create('create instance of Transition "t2" in box.item')).success).toBe(true);
    });

    it('a deleted pending child frees its place in the slot', async () => {
        setModel([inst('box', 'box', Box, { item: [] })]);
        await create('create instance of Transition "t1" in box.item');
        const d = await executeDeleteInstance(argsOf('delete instance t1'), context, h.project);
        expect(d.success).toBe(true);
        expect((await create('create instance of Transition "t2" in box.item')).success).toBe(true);
    });
});

// ── R-JS-10: the M1 name lookup is model-wide ───────────────────────────────────────────────────

describe('findInstanceByName — roots and contained instances (R-JS-10)', () => {
    it('finds an instance contained in a root, through the containment slots', () => {
        const t = inst('tN', 'tNested', Transition);
        model.objects[0].subObjects = [t];
        expect(findInstanceByName(model, 'tNested')).toEqual([t]);
    });

    it('goes down more than one level', () => {
        const inner = inst('in', 'inner', Transition);
        const mid = inst('mid', 'mid', State);
        mid.subObjects = [inner];
        model.objects[0].subObjects = [mid];
        expect(findInstanceByName(model, 'inner')).toEqual([inner]);
    });

    it('lists an object that is both a root and contained (the `set +=` hybrid) once', () => {
        const t = inst('tH', 'tHybrid', Transition);
        model.objects.push(t);
        model.objects[0].subObjects = [t];
        expect(findInstanceByName(model, 'tHybrid')).toHaveLength(1);
    });

    it('a root and a contained instance sharing a name are two candidates, roots first', () => {
        const nested = inst('n1', 'twin', Transition);
        const root = inst('r1', 'twin', Transition);
        model.objects.push(root);
        model.objects[0].subObjects = [nested];
        expect(findInstanceByName(model, 'twin').map((o: any) => o.id)).toEqual(['r1', 'n1']);
    });

    it('survives a containment cycle', () => {
        const a = inst('a', 'a', State);
        const b = inst('b', 'b', State);
        a.subObjects = [b];
        b.subObjects = [a];
        model.objects = [a];
        expect(findInstanceByName(model, 'b')).toEqual([b]);
    });

    it('ignores what a slot holds that is not an object', () => {
        model.objects[0].subObjects = [null, 'x', { id: 'lit', name: 'tNested', className: 'DEnumLiteral' }];
        expect(findInstanceByName(model, 'tNested')).toEqual([]);
    });

    it('a contained instance is addressable in a later run (registry cleared)', async () => {
        const t = inst('tN', 'tNested', Transition, { nextState: [] });
        model.objects[0].subObjects = [t];
        clearHandles();
        const r = await executeRenameInstance(argsOf('rename instance tNested to tRenamed'), context, h.project);
        expect(r.success).toBe(true);
    });

    it('an auto-name skips the names of contained instances', async () => {
        model.objects[0].subObjects = [inst('tN', 'Transition', Transition)];
        const r = await create('create instance of Transition');
        expect(r.success).toBe(true);
        expect(h.created[0].name).toBe('Transition2');
    });
});

// ── R-JS-11: the parent is a required dependency, and the M1 wait waits for readiness ───────────

describe('the M1 wait (R-JS-11)', () => {
    const MAX_WAIT_MS = 500;

    it('the container of `create instance … in` is a required parent dependency', () => {
        const deps = extractDependencies(parse('create instance of Transition "t" in idle.transitions').ast!);
        expect(deps).toEqual([{ name: { segments: ['idle'], member: 'transitions', raw: 'idle.transitions' }, role: 'parent', required: true }]);
        expect(extractDependencies(parse('create instance of Transition "t"').ast!)).toEqual([]);
    });

    it('a contained instance resolves at once, without polling to the cap', async () => {
        model.objects[0].subObjects = [inst('tN', 'tNested', Transition)];
        const deps = extractDependencies(parse('set tNested.nextState = cooking').ast!);
        const res = await waitForDependencies(deps, context);
        expect(res.allResolved).toBe(true);
        expect(res.waitedMs).toBeLessThan(50);
    });

    it('a handle of this run counts only once its metaclass is in the store', async () => {
        const fresh = inst('freshId', 'fresh', Transition);
        fresh.__raw = { id: 'freshId' };
        registerHandle('fresh', 'freshId');
        setTimeout(() => { fresh.__raw.instanceof = 'c_Transition'; }, 120);
        const deps = extractDependencies(parse('set fresh.nextState = cooking').ast!);
        const res = await waitForDependencies(deps, context);
        expect(res.allResolved).toBe(true);
        expect(res.waitedMs).toBeGreaterThanOrEqual(100);
        expect(res.waitedMs).toBeLessThan(MAX_WAIT_MS - 100);
    });

    it('a handle whose metaclass never arrives is not resolved', async () => {
        const fresh = inst('freshId', 'fresh', Transition);
        fresh.__raw = { id: 'freshId' };
        registerHandle('fresh', 'freshId');
        const deps = extractDependencies(parse('set fresh.nextState = cooking').ast!);
        const res = await waitForDependencies(deps, context);
        expect(res.allResolved).toBe(false);
        expect(res.waitedMs).toBeGreaterThan(MAX_WAIT_MS - 100);
    });
});
