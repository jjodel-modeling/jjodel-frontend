/**
 * simSnapshotWrite — the write of a run snapshot (DCN slice 5, lane 5, P-2026-11-08-2216).
 *
 * The host is a fake store that applies each action 100 ms after it is sent, as the
 * store's timer does, and makes a new lookup at every change. Each test name says
 * which break kills it; the mutation bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { saveRunSnapshot, snapshotInputOf, snapshotRolesOf, sourceVertexLayouts, vertexCopiesOf, writeSnapshot } from '../simSnapshotWrite';
import type { SnapshotVertexLayout, SnapshotWriteHost } from '../simSnapshotWrite';
import { planSnapshot } from '../simSnapshot';
import type { SnapshotOperation, SnapshotPlan, SnapshotRoles, SnapshotSourceObject, SnapshotUnwritten } from '../simSnapshot';
import type { OntoBinding } from '../../../../model/ontological/bindingCodec';

type Lookup = Record<string, any>;

const LAG_MS = 100;
const QUIET_MS = 700;

interface FakeOptions {
    /** The slots a new object of the class gets, with the value they start with. */
    readonly classes: Record<string, Record<string, unknown[]>>;
    readonly takenName?: string;
    readonly dropWrites?: boolean;
    readonly noModel?: boolean;
    readonly throwOnCreate?: string;
    /** How long after its object a slot appears, as the side effects of a create land later. */
    readonly slotsLagMs?: number;
    /** A store change this long after the batch of writes has landed, with nothing to wait on. */
    readonly lateChangeMs?: number;
    /** A host that makes vertices; `drop`: sent, never in the store. */
    readonly vertices?: 'draw' | 'drop';
    /** Objects of this class are asked for and never reach the store. */
    readonly neverLands?: string;
}

function fakeHost(options: FakeOptions) {
    let lookup: Lookup = {};
    let t = 0;
    let changedAt = 0;
    let created = 0;
    let drawn = 0;
    const log: string[] = [];
    const ended: Array<{ at: number; changedAt: number; pending: number; lookup: Lookup }> = [];
    const queue: Array<{ at: number; apply: (l: Lookup) => void }> = [];
    const send = (apply: (l: Lookup) => void) => queue.push({ at: t + LAG_MS, apply });
    const flush = () => {
        const due = queue.filter(q => q.at <= t);
        if (due.length === 0) return;
        const next = { ...lookup };
        for (const q of due) {
            q.apply(next);
            queue.splice(queue.indexOf(q), 1);
        }
        lookup = next;
        changedAt = t;
    };
    const host: SnapshotWriteHost = {
        lookup: () => lookup,
        createModel(name) {
            log.push(`model ${name}`);
            const id = 'new-model';
            if (!options.noModel) send(l => { l[id] = { id, name: options.takenName ?? name }; });
            return id;
        },
        createObject(classId, _modelId, name) {
            if (classId === options.throwOnCreate) throw new Error('create failed');
            const id = `o${++created}`;
            log.push(`create ${id} ${classId} ${name ?? ''}`.trim());
            if (classId === options.neverLands) return id;
            const slots = Object.entries(options.classes[classId] ?? {});
            const addSlots = (l: Lookup) => {
                l[id] = { id, features: slots.map(([feature]) => `${id}.${feature}`) };
                for (const [feature, values] of slots) l[`${id}.${feature}`] = { instanceof: feature, values };
            };
            if (options.slotsLagMs === undefined) send(addSlots);
            else {
                send(l => { l[id] = { id, features: [] }; });
                queue.push({ at: t + LAG_MS + options.slotsLagMs, apply: addSlots });
            }
            return id;
        },
        ...(options.vertices ? {
            createVertex(objectId: string, layout: SnapshotVertexLayout) {
                const id = `v${++drawn}`;
                log.push(`vertex ${objectId} ${layout.x},${layout.y}`);
                if (options.vertices === 'draw') send(l => { l[id] = { id, model: objectId }; });
                return id;
            },
        } : {}),
        batch(writes) {
            log.push('batch');
            writes();
            log.push('batch end');
            if (options.lateChangeMs !== undefined) queue.push({ at: t + LAG_MS + options.lateChangeMs, apply: l => { l['side-effect'] = {}; } });
        },
        writeReference(slot, ids) {
            log.push(`ref ${slot}=${ids.join(',')}`);
            if (!options.dropWrites) send(l => { l[slot] = { ...l[slot], values: [...ids] }; });
        },
        writeAttribute(slot, values) {
            log.push(`attr ${slot}=${values.join(',')}`);
            if (!options.dropWrites) send(l => { l[slot] = { ...l[slot], values: [...values] }; });
        },
        beginUndoGroup() { log.push('begin'); },
        endUndoGroup() {
            log.push('end');
            ended.push({ at: t, changedAt, pending: queue.length, lookup });
        },
        sleep(ms) {
            t += ms;
            flush();
            return Promise.resolve();
        },
        now: () => t,
    };
    return { host, log, ended, sent: () => log.filter(l => l.startsWith('attr ') || l.startsWith('ref ')) };
}

const create = (key: string, classId: string, name?: string): SnapshotOperation => ({ op: 'create', key, classId, name, ownerKey: null });
const attr = (key: string, feature: string, values: unknown[]): SnapshotOperation => ({ op: 'attribute', key, feature, values });
const ref = (key: string, feature: string, values: string[]): SnapshotOperation => ({ op: 'reference', key, feature, values });
const plan = (operations: SnapshotOperation[], unwritten: SnapshotUnwritten[] = []): SnapshotPlan => ({ name: 'drone (snapshot step 3)', operations, unwritten });

const CLASSES = { A: { f: [], link: [] }, B: { f: [] } };

describe('writeSnapshot, the undo bracketing', () => {
    it('begins the group before the model is created (begin moved after createModel dies)', async () => {
        const { host, log } = fakeHost({ classes: CLASSES });
        await writeSnapshot(plan([create('a', 'A')]), 'mm', host);
        expect(log.slice(0, 2)).toEqual(['begin', 'model drone (snapshot step 3)']);
    });

    it('ends once, after the last value landed and the store went quiet (no wait for landing, no quiet, a second end die)', async () => {
        const { host, log, ended } = fakeHost({ classes: CLASSES });
        const result = await writeSnapshot(plan([create('a', 'A'), attr('a', 'f', [5])]), 'mm', host);
        expect(result.ok).toBe(true);
        expect(log.filter(l => l === 'end')).toHaveLength(1);
        expect(ended[0].lookup['o1.f'].values).toEqual([5]);
        expect(ended[0].pending).toBe(0);
        expect(ended[0].at - ended[0].changedAt).toBeGreaterThanOrEqual(QUIET_MS);
    });

    it('restarts the quiet wait on a late change of the store (the wait not restarted dies)', async () => {
        const { host, ended } = fakeHost({ classes: CLASSES, lateChangeMs: 400 });
        await writeSnapshot(plan([create('a', 'A'), attr('a', 'f', [5])]), 'mm', host);
        expect(ended[0].lookup['side-effect']).toBeDefined();
        expect(ended[0].at - ended[0].changedAt).toBeGreaterThanOrEqual(QUIET_MS);
    });

    it('ends once when a create throws, keeping the model id (no finally, no catch die)', async () => {
        const { host, log } = fakeHost({ classes: CLASSES, throwOnCreate: 'B' });
        const result = await writeSnapshot(plan([create('a', 'A'), create('b', 'B')]), 'mm', host);
        expect(log.filter(l => l === 'end')).toHaveLength(1);
        expect(result.ok).toBe(false);
        expect(result.modelId).toBe('new-model');
        expect(result.problems).toEqual(['create failed']);
    });
});

describe('writeSnapshot, the writes', () => {
    it('sends one write per slot, the last asked (sigma replacing the model write, first-wins dies)', async () => {
        const { host, sent } = fakeHost({ classes: CLASSES });
        await writeSnapshot(plan([create('a', 'A'), attr('a', 'f', [1]), attr('a', 'f', [2])]), 'mm', host);
        expect(sent()).toEqual(['attr o1.f=2']);
    });

    it('keeps apart two objects writing the same feature (key dropped from the slot key dies)', async () => {
        const { host, sent } = fakeHost({ classes: CLASSES });
        await writeSnapshot(plan([create('a', 'A'), create('b', 'B'), attr('a', 'f', [1]), attr('b', 'f', [2])]), 'mm', host);
        expect(sent()).toEqual(['attr o1.f=1', 'attr o2.f=2']);
    });

    it('remaps the keys of a reference to the created ids (keys written raw die)', async () => {
        const { host, sent } = fakeHost({ classes: CLASSES });
        const result = await writeSnapshot(plan([create('a', 'A'), create('b', 'B'), ref('a', 'link', ['b'])]), 'mm', host);
        expect(sent()).toEqual(['ref o1.link=o2']);
        expect(result.ok).toBe(true);
    });

    it('waits for the slots, which land after their object (waiting for the objects alone dies)', async () => {
        const { host, sent } = fakeHost({ classes: CLASSES, slotsLagMs: 300 });
        const result = await writeSnapshot(plan([create('a', 'A'), attr('a', 'f', [2])]), 'mm', host);
        expect(result.ok).toBe(true);
        expect(sent()).toEqual(['attr o1.f=2']);
    });

    it('passes the class and the name of each create (class or name dropped die)', async () => {
        const { host, log } = fakeHost({ classes: CLASSES });
        await writeSnapshot(plan([create('a', 'A', 'dji')]), 'mm', host);
        expect(log).toContain('create o1 A dji');
    });

    it('creates every object before the one batch of writes (a batch per write, writes before creates die)', async () => {
        const { host, log } = fakeHost({ classes: CLASSES });
        await writeSnapshot(plan([create('a', 'A'), attr('a', 'f', [1]), create('b', 'B'), attr('b', 'f', [2])]), 'mm', host);
        expect(log.filter(l => l === 'batch')).toHaveLength(1);
        const batch = log.indexOf('batch');
        expect(log.findIndex(l => l.startsWith('create '))).toBeLessThan(batch);
        expect(log.map((l, i) => l.startsWith('create ') ? i : -1).filter(i => i >= 0).every(i => i < batch)).toBe(true);
        expect(log.indexOf('attr o2.f=2')).toBeLessThan(log.indexOf('batch end'));
    });

    it('does not send a value the slot already holds, compared as text (always sending, strict compare die)', async () => {
        const { host, sent } = fakeHost({ classes: { A: { f: [5, null] } } });
        const result = await writeSnapshot(plan([create('a', 'A'), attr('a', 'f', ['5'])]), 'mm', host);
        expect(sent()).toEqual([]);
        expect(result.ok).toBe(true);
    });

    it('sends a value of the same length that differs (length-only compare dies)', async () => {
        const { host, sent } = fakeHost({ classes: { A: { f: [4] } } });
        await writeSnapshot(plan([create('a', 'A'), attr('a', 'f', [5])]), 'mm', host);
        expect(sent()).toEqual(['attr o1.f=5']);
    });

    it('reads the name the store gave the model (the plan name returned dies)', async () => {
        const { host } = fakeHost({ classes: CLASSES, takenName: 'drone (snapshot step 3)_1' });
        const result = await writeSnapshot(plan([]), 'mm', host);
        expect(result.name).toBe('drone (snapshot step 3)_1');
    });

    it('hands the unwritten list of the plan to the caller (dropped dies)', async () => {
        const unwritten: SnapshotUnwritten[] = [{ objectId: 'x', what: 'y', reason: 'no-type' }];
        const { host } = fakeHost({ classes: CLASSES });
        const result = await writeSnapshot(plan([], unwritten), 'mm', host);
        expect(result.unwritten).toEqual(unwritten);
        expect(result.ok).toBe(true);
    });
});

describe('writeSnapshot, what did not happen', () => {
    it('reports a slot that never appears, the others still written and landed in the group (a stop at the first, one shared deadline die)', async () => {
        const { host, sent, ended } = fakeHost({ classes: CLASSES });
        const result = await writeSnapshot(plan([create('a', 'A'), attr('a', 'nope', [1]), attr('a', 'f', [2])]), 'mm', host);
        expect(result.ok).toBe(false);
        expect(result.problems).toEqual(['a: no slot of nope']);
        expect(sent()).toEqual(['attr o1.f=2']);
        expect(ended[0].lookup['o1.f'].values).toEqual([2]);
    });

    it('reports values that never land (the landing not checked dies)', async () => {
        const { host, log } = fakeHost({ classes: CLASSES, dropWrites: true });
        const result = await writeSnapshot(plan([create('a', 'A'), attr('a', 'f', [2])]), 'mm', host);
        expect(result.ok).toBe(false);
        expect(result.problems).toEqual(['some values never landed']);
        expect(log.filter(l => l === 'end')).toHaveLength(1);
    });

    it('stops when the model never reaches the store, nothing created (the settle result ignored dies)', async () => {
        const { host, log } = fakeHost({ classes: CLASSES, noModel: true });
        const result = await writeSnapshot(plan([create('a', 'A'), attr('a', 'f', [2])]), 'mm', host);
        expect(result.ok).toBe(false);
        expect(result.problems).toEqual(['the new model never reached the store']);
        expect(result.name).toBeNull();
        expect(log.some(l => l.startsWith('create '))).toBe(false);
        expect(log.filter(l => l === 'end')).toHaveLength(1);
    });
});

describe('saveRunSnapshot', () => {
    it('refuses a model with no DCN run and opens no group (the run not checked dies)', async () => {
        const { host, log } = fakeHost({ classes: CLASSES });
        const result = await saveRunSnapshot('no-such-model', 0, host);
        expect(result).toEqual({ ok: false, modelId: null, name: null, unwritten: [], problems: ['no DCN run of this model'] });
        expect(log).toEqual([]);
    });
});

describe('snapshotRolesOf', () => {
    const lookup: Lookup = { 'F.slots': { type: 'M.Slot' } };
    const binding = {
        slotContainer: 'F.slots', definingFeature: 'F.defining', valueHolder: 'F.values', featureType: 'F.type',
        valueKinds: [{ classId: 'M.Int' }],
    } as unknown as OntoBinding;

    it('takes the slot class from the type of the slot container (the id of the feature itself dies)', () => {
        expect(snapshotRolesOf(lookup, binding, 'F.literals')).toEqual({
            slotClass: 'M.Slot', slotContainer: 'F.slots', definingFeature: 'F.defining', valueHolder: 'F.values', featureType: 'F.type',
            literals: 'F.literals', valueKinds: [{ classId: 'M.Int' }],
        });
    });

    it.each(['slotContainer', 'definingFeature', 'valueHolder', 'featureType', 'valueKinds'])('is null without %s (that check dropped dies)', role => {
        expect(snapshotRolesOf(lookup, { ...binding, [role]: undefined } as OntoBinding, undefined)).toBeNull();
    });

    it('is null when the slot container has no type in the lookup (the type check dropped dies)', () => {
        expect(snapshotRolesOf({ 'F.slots': {} }, binding, undefined)).toBeNull();
    });
});

describe('snapshotInputOf', () => {
    const roles = { slotClass: 'M.Slot' } as unknown as SnapshotRoles;
    const sigma = new Map();
    const slots = new Map();
    const LOOKUP: Lookup = {
        m: { id: 'm', className: 'DModel', name: 'drone' },
        other: { id: 'other', className: 'DModel', name: 'other' },
        attr: { className: 'DAttribute' },
        ref: { className: 'DReference' },
        cls: { className: 'DClass' },
        root: { id: 'root', className: 'DObject', father: 'm', instanceof: 'cls', name: 'dji', features: ['v1', 'v2', 'v3', 'v4'] },
        v1: { className: 'DValue', father: 'root', instanceof: 'attr', values: [3] },
        v2: { className: 'DValue', father: 'root', instanceof: 'ref', values: ['inner'] },
        v3: { className: 'DValue', father: 'root', instanceof: 'attr', values: 'not a list' },
        v4: { className: 'DValue', father: 'root' },
        inner: { id: 'inner', className: 'DObject', father: 'v2', instanceof: 'cls', features: [] },
        foreign: { id: 'foreign', className: 'DObject', father: 'other', instanceof: 'cls' },
    };

    it('reads the object holding the slot as the owner of a contained object (the DValue id as owner dies)', () => {
        const input = snapshotInputOf(LOOKUP, 'm', 3, sigma, roles, slots);
        expect(input.objects.find(o => o.id === 'inner')?.owner).toBe('root');
    });

    it('keeps the model as the owner of a root (a root owned by null dies)', () => {
        const input = snapshotInputOf(LOOKUP, 'm', 3, sigma, roles, slots);
        expect(input.objects.find(o => o.id === 'root')?.owner).toBe('m');
    });

    it('sorts the slots by the kind of feature, a slot with no feature skipped (one list, no guard die)', () => {
        const root = snapshotInputOf(LOOKUP, 'm', 3, sigma, roles, slots).objects.find(o => o.id === 'root');
        expect(root?.attributes).toEqual([{ feature: 'attr', values: [3] }, { feature: 'attr', values: [] }]);
        expect(root?.references).toEqual([{ feature: 'ref', values: ['inner'] }]);
    });

    it('reads this model only and carries the run through (the name, step, sigma or the model filter lost die)', () => {
        const input = snapshotInputOf(LOOKUP, 'm', 3, sigma, roles, slots);
        expect(input.objects.map(o => o.id).sort()).toEqual(['inner', 'root']);
        expect(input.modelName).toBe('drone');
        expect(input.step).toBe(3);
        expect(input.sigma).toBe(sigma);
        expect(input.slots).toBe(slots);
        expect(input.roles).toBe(roles);
        const root = input.objects.find(o => o.id === 'root');
        expect(root?.classId).toBe('cls');
        expect(root?.name).toBe('dji');
    });
});

describe('the layout of the snapshot', () => {
    const box = (x: number): SnapshotVertexLayout => ({ x, y: 20, w: 200, h: 120, isResized: false });
    const source = (id: string, classId: string, name: string | undefined, owner: string | null): SnapshotSourceObject => (
        { id, classId, name, owner, attributes: [], references: [] });
    const created = (key: string, classId: string, name: string, ownerKey: string | null): SnapshotOperation => ({ op: 'create', key, classId, name, ownerKey });
    const roles: SnapshotRoles = { slotClass: 'S', slotContainer: 'sc', definingFeature: 'df', valueHolder: 'vh', featureType: 'ft', valueKinds: [] };
    const planned = (objects: SnapshotSourceObject[]) => planSnapshot({ modelName: 'm', step: 1, objects, roles, sigma: new Map(), slots: new Map() });
    const copyAt = (copies: ReturnType<typeof vertexCopiesOf>, key: string) => copies.find(c => c.key === key)?.layout.x;

    it('reads the v2-flow graph of the model only (dropping either graph test takes the other vertex)', () => {
        const lookup: Lookup = {
            flow: { model: 'm', graphStyle: 'v2-flow' },
            classic: { model: 'm', graphStyle: '' },
            other: { model: 'x', graphStyle: 'v2-flow' },
            v1: { className: 'DVertex', model: 'o1', graph: 'flow', x: 1, y: 2, w: 3, h: 4, isResized: false },
            v2: { className: 'DVertex', model: 'o2', graph: 'classic', x: 9, y: 9, w: 9, h: 9 },
            v3: { className: 'DVertex', model: 'o3', graph: 'other', x: 9, y: 9, w: 9, h: 9 },
            v4: { className: 'DVoidEdge', model: 'o4', graph: 'flow', x: 9, y: 9, w: 9, h: 9 },
        };
        expect([...sourceVertexLayouts(lookup, 'm').entries()]).toEqual([['o1', { x: 1, y: 2, w: 3, h: 4, isResized: false }]]);
    });

    it('copies the seed, isResized and the records; an empty dictionary is no record', () => {
        const record = { x: 60, y: 2600, w: 200, h: 120, isResized: false };
        const lookup: Lookup = {
            g: { model: 'm', graphStyle: 'v2-flow' },
            v1: { className: 'DVertex', model: 'o1', graph: 'g', x: 50, y: 6650, w: 200, h: 120, isResized: true, layoutByViewpoint: { vp: record } },
            v2: { className: 'DVertex', model: 'o2', graph: 'g', x: 1, y: 2, w: 3, h: 4, layoutByViewpoint: {} },
        };
        const layouts = sourceVertexLayouts(lookup, 'm');
        expect(layouts.get('o1')).toEqual({ x: 50, y: 6650, w: 200, h: 120, isResized: true, layoutByViewpoint: { vp: record } });
        expect(layouts.get('o2')).toEqual({ x: 1, y: 2, w: 3, h: 4, isResized: false });
    });

    it('maps through the keys of a real plan when a child precedes its owner (matching by position in the input swaps them)', () => {
        const objects = [source('c1', 'Slot', 's', 'B'), source('B', 'C', 'b', 'model'), source('A', 'C', 'a', 'model'), source('c2', 'Slot', 't', 'A')];
        const plan = planned(objects);
        const keyOf = (name: string) => (plan.operations.find(op => op.op === 'create' && op.name === name) as { key: string }).key;
        const layouts = new Map([['c1', box(1)], ['B', box(2)], ['A', box(3)], ['c2', box(4)]]);
        const copies = vertexCopiesOf(plan, objects, layouts);
        expect(copies).toHaveLength(4);
        expect([copyAt(copies, keyOf('s')), copyAt(copies, keyOf('b')), copyAt(copies, keyOf('a')), copyAt(copies, keyOf('t'))]).toEqual([1, 2, 3, 4]);
    });

    it('keeps two namesakes under two owners apart (dropping the owner from the identity swaps them)', () => {
        const objects = [source('b', 'C', 'b', 'model'), source('a', 'C', 'a', 'model'), source('s1', 'Slot', 'Slot_0', 'a'), source('s2', 'Slot', 'Slot_0', 'b')];
        const operations = [created('kb', 'C', 'b', null), created('ka', 'C', 'a', null), created('ksb', 'Slot', 'Slot_0', 'kb'), created('ksa', 'Slot', 'Slot_0', 'ka')];
        const copies = vertexCopiesOf(plan(operations), objects, new Map([['s1', box(1)], ['s2', box(2)]]));
        expect([copyAt(copies, 'ksa'), copyAt(copies, 'ksb')]).toEqual([1, 2]);
    });

    it('gives no copy to an object with no source vertex, to one the plan added, or to what the plan added under it', () => {
        const objects = [source('a', 'C', 'a', 'model'), source('b', 'C', 'b', 'model'), source('c', 'C', 'c', 'model')];
        const operations = [created('ka', 'C', 'a', null), created('add', 'C', 'new', null), created('under', 'C', 'b', 'add'), created('kb', 'C', 'b', null), created('kc', 'C', 'c', null)];
        const copies = vertexCopiesOf(plan(operations), objects, new Map([['a', box(1)], ['b', box(3)], ['new', box(2)]]));
        expect(copies.map(c => c.key)).toEqual(['ka', 'kb']);
    });

    it('tells siblings apart by name and by class when the plan orders them otherwise (dropping either from the identity swaps them)', () => {
        const objects = [source('n1', 'C', 'a', 'model'), source('n2', 'C', 'b', 'model'), source('c1', 'D', 'z', 'model'), source('c2', 'E', 'z', 'model')];
        const operations = [created('kn2', 'C', 'b', null), created('kn1', 'C', 'a', null), created('kc2', 'E', 'z', null), created('kc1', 'D', 'z', null)];
        const copies = vertexCopiesOf(plan(operations), objects, new Map([['n1', box(1)], ['n2', box(2)], ['c1', box(3)], ['c2', box(4)]]));
        expect(['kn1', 'kn2', 'kc1', 'kc2'].map(k => copyAt(copies, k))).toEqual([1, 2, 3, 4]);
    });

    it('makes the vertices inside the undo group, out of the batch, and closes after they land (moving the loop in the batch or past the wait fails)', async () => {
        const { host, log, ended } = fakeHost({ classes: CLASSES, vertices: 'draw' });
        const result = await writeSnapshot(plan([create('k1', 'A', 'x'), attr('k1', 'f', [3])]), 'mm', host, [{ key: 'k1', layout: box(7) }]);
        expect(result.ok).toBe(true);
        expect(log.indexOf('vertex o1 7,20')).toBeGreaterThan(log.indexOf('batch end'));
        expect(log.indexOf('vertex o1 7,20')).toBeLessThan(log.indexOf('end'));
        expect(ended[0].lookup.v1).toEqual({ id: 'v1', model: 'o1' });
        expect(ended[0].pending).toBe(0);
    });

    it('reports a vertex that never lands (a missing wait reports nothing)', async () => {
        const { host } = fakeHost({ classes: CLASSES, vertices: 'drop' });
        const result = await writeSnapshot(plan([create('k1', 'A', 'x')]), 'mm', host, [{ key: 'k1', layout: box(7) }]);
        expect(result.ok).toBe(false);
        expect(result.problems).toEqual(['some vertices never landed']);
    });

    it('leaves the layout to Step 2bis for a host with no createVertex, and for an object that never landed', async () => {
        const without = fakeHost({ classes: CLASSES });
        expect((await writeSnapshot(plan([create('k1', 'A', 'x')]), 'mm', without.host, [{ key: 'k1', layout: box(7) }])).ok).toBe(true);
        const lost = fakeHost({ classes: CLASSES, vertices: 'draw', neverLands: 'A' });
        await writeSnapshot(plan([create('k1', 'A', 'x')]), 'mm', lost.host, [{ key: 'k1', layout: box(7) }]);
        expect(lost.log.filter(l => l.startsWith('vertex'))).toEqual([]);
    });
});
