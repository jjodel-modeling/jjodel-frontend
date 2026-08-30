/**
 * Tests of `jjform/writeCtx` - the write contract, exercised by a host that is not
 * jjodel.
 *
 * The adapter below is a plain JSON store: a `Record<id, {name, features}>` and six
 * functions over it, no proxies, no store, no framework. That is the whole point of
 * the file. R-FORM-2 has claimed portability since slice 2b, and until now the claim
 * was structural - the directory has no imports, therefore it could run elsewhere.
 * Here the ENGINE actually writes through a second implementation and the writes land,
 * which is a different statement: the contract is small enough, and complete enough,
 * that something other than the L layer can satisfy it.
 *
 * The engine under test is `applyPlanWrites`, the only part of the engine that writes
 * today (S4 declared the other two inversions and deferred them - see the referto).
 * It gets a `DeletePlan` built by `deletePlan` itself, not hand-written, so the test
 * exercises the real hand-off: preflight -> plan -> writes.
 */

import { describe, expect, it } from 'vitest';
import type { MetamodelShape, RefShape } from '../shape';
import { applyPlanWrites, deletePlan, deletePreflight, type PreflightInput, type ReferrerInput } from '../delete';
import { writeDone, writeRefused, writeUnchanged } from '../write';
import type { CreateResult, WriteCtx, WriteValue } from '../writeCtx';

// -- The fake host ------------------------------------------------------------

/** An instance in the JSON host: a name and slots of positional values. A hole is a
 *  `null` in place, never a shorter array - the format the contract declares
 *  (R-FORM-7) and the reason this store keeps arrays instead of maps. */
interface FakeInstance {
    cls: string;
    name: string;
    slots: Record<string, WriteValue[]>;
}

type FakeStore = Record<string, FakeInstance>;

/** A `WriteCtx` over a plain object. Six functions, ~40 lines, zero dependencies:
 *  the measure of how much a host has to bring. */
function makeFakeCtx(db: FakeStore): WriteCtx {
    let seq = 0;
    const slotOf = (id: string, key: string): WriteValue[] | null => {
        const inst = db[id];
        if (!inst) return null;
        return inst.slots[key] ?? null;
    };
    return {
        setValue(id, key, index, value) {
            const slot = slotOf(id, key);
            if (!slot) return writeRefused(`feature "${key}" is not on this object`);
            if (slot[index] === value) return writeUnchanged();
            slot[index] = value;
            return writeDone();
        },
        clearValue(id, key, index) {
            const slot = slotOf(id, key);
            if (!slot) return writeRefused(`feature "${key}" is not on this object`);
            if (slot[index] == null) return writeUnchanged();
            // A HOLE, not a splice: `slot.length` must not move.
            slot[index] = null;
            return writeDone();
        },
        appendValue(id, key, value) {
            const slot = slotOf(id, key);
            if (!slot) return writeRefused(`feature "${key}" is not on this object`);
            slot.push(value);
            return writeDone();
        },
        setName(id, name) {
            const inst = db[id];
            if (!inst) return writeRefused('object not found');
            if (inst.name === name) return writeUnchanged();
            inst.name = name;
            return writeDone();
        },
        create(cls, ownerId, childKey, seed): CreateResult {
            const id = `fake_${++seq}`;
            const slots: Record<string, WriteValue[]> = {};
            for (const [k, v] of Object.entries(seed)) if (k !== 'name') slots[k] = [v];
            db[id] = { cls, name: String(seed.name ?? id), slots };
            if (ownerId && childKey) {
                const owner = db[ownerId];
                if (!owner) return { ok: false, id: null, reason: 'owner not found' };
                (owner.slots[childKey] ??= []).push(id);
            }
            return { ok: true, id };
        },
        delete(id) {
            if (!db[id]) return writeUnchanged();
            delete db[id];
            return writeDone();
        },
    };
}

// -- The fixture --------------------------------------------------------------

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

/** The contract's own example, trimmed to what a delete needs: two `State`s and two
 *  `Transition`s whose `target` points at one of them. Same fixture family as
 *  `delete.test.ts`, so the two files describe the same metamodel. */
const SHAPE: MetamodelShape = {
    enums: {},
    classes: {
        State: {
            key: 'State', id: 'c_State',
            root: true, abstract: false, singleton: false, containedIn: [],
            attrs: [], refs: [], children: [],
        },
        Transition: {
            key: 'Transition', id: 'c_Transition',
            root: true, abstract: false, singleton: false, containedIn: [],
            attrs: [],
            refs: [ref({ key: 'target', of: 'State', lower: 1, upper: 1, many: false, required: true })],
            children: [],
        },
    },
};

/** Two transitions point at `s_doomed`; `s_spare` is the reassign target. `t_two`
 *  holds TWO values, so a clear that shortened instead of holing would show. */
function seedDb(): FakeStore {
    return {
        s_doomed: { cls: 'State', name: 'Doomed', slots: {} },
        s_spare: { cls: 'State', name: 'Spare', slots: {} },
        t_one: { cls: 'Transition', name: 'T1', slots: { target: ['s_doomed'] } },
        t_two: { cls: 'Transition', name: 'T2', slots: { target: ['s_other', 's_doomed'] } },
    };
}

const referrer = (o: Partial<ReferrerInput> & { instanceId: string; featureKey: string; index: number }): ReferrerInput => ({
    instanceName: o.instanceId,
    instanceClass: 'Transition',
    featureId: 'r_' + o.featureKey,
    pointsAt: 's_doomed',
    lower: 1,
    upper: 1,
    slotCount: 1,
    ...o,
});

const preflightInput = (o: Partial<PreflightInput> = {}): PreflightInput => ({
    id: 's_doomed',
    name: 'Doomed',
    cls: 'State',
    referrers: [
        referrer({ instanceId: 't_one', featureKey: 'target', index: 0 }),
        referrer({ instanceId: 't_two', featureKey: 'target', index: 1, slotCount: 2 }),
    ],
    descendants: [],
    candidates: [{ id: 's_spare', label: 'Spare' }],
    ...o,
});

describe('WriteCtx - a non-jjodel adapter the engine writes through', () => {
    it('applies a reassign plan: both referrers repointed, in the JSON host', () => {
        const db = seedDb();
        const pre = deletePreflight(SHAPE, preflightInput());
        const plan = deletePlan(pre, { reassignTo: 's_spare' });
        expect(plan.verdict).toBe('reassign');

        const outcome = applyPlanWrites(makeFakeCtx(db), plan);

        expect(outcome).toEqual({ written: 2, unchanged: 0, refused: [] });
        expect(db.t_one.slots.target).toEqual(['s_spare']);
        // Position 1 only: the other value of the same slot is untouched.
        expect(db.t_two.slots.target).toEqual(['s_other', 's_spare']);
    });

    it('applies a clear plan by leaving a HOLE, not by shortening (R-FORM-7)', () => {
        const db = seedDb();
        const pre = deletePreflight(SHAPE, preflightInput());
        const plan = deletePlan(pre, { clearRefs: true });
        expect(plan.verdict).toBe('clear');

        const outcome = applyPlanWrites(makeFakeCtx(db), plan);

        expect(outcome.written).toBe(2);
        expect(db.t_one.slots.target).toEqual([null]);
        // The array is still length 2, and `s_other` is still at index 0: an adapter
        // that spliced would renumber it and the next step would address the wrong value.
        expect(db.t_two.slots.target).toEqual(['s_other', null]);
    });

    it('a dirty plan writes nothing at all', () => {
        const db = seedDb();
        const before = JSON.stringify(db);
        const pre = deletePreflight(SHAPE, preflightInput());
        const plan = deletePlan(pre, {});
        expect(plan.verdict).toBe('dirty');

        const outcome = applyPlanWrites(makeFakeCtx(db), plan);

        expect(outcome).toEqual({ written: 0, unchanged: 0, refused: [] });
        expect(JSON.stringify(db)).toBe(before);
    });

    it('reports the host refusal verbatim, and keeps applying the other steps', () => {
        const db = seedDb();
        delete (db.t_one as FakeInstance).slots.target;   // the feature is gone from THIS host
        const pre = deletePreflight(SHAPE, preflightInput());
        const plan = deletePlan(pre, { reassignTo: 's_spare' });

        const outcome = applyPlanWrites(makeFakeCtx(db), plan);

        expect(outcome.refused).toEqual([
            { kind: 'reassign', instanceId: 't_one', featureKey: 'target', index: 0, reason: 'feature "target" is not on this object' },
        ]);
        // Per contrasto, in the same run: the step that CAN be applied is applied. A
        // function that gave up on the first refusal would leave a live referrer pointing
        // at an instance that is about to disappear.
        expect(outcome.written).toBe(1);
        expect(db.t_two.slots.target).toEqual(['s_other', 's_spare']);
    });

    it('a blocked plan is not half-applied', () => {
        const db = seedDb();
        const before = JSON.stringify(db);
        const pre = deletePreflight(SHAPE, preflightInput({ blocked: 'State is a singleton' }));
        const plan = deletePlan(pre, { reassignTo: 's_spare' });

        expect(applyPlanWrites(makeFakeCtx(db), plan)).toEqual({ written: 0, unchanged: 0, refused: [] });
        expect(JSON.stringify(db)).toBe(before);
    });

    it('a no-op is not a refusal: reassigning to the value already there', () => {
        const db = seedDb();
        db.t_one.slots.target = ['s_spare'];
        db.t_two.slots.target = ['s_other', 's_spare'];
        const pre = deletePreflight(SHAPE, preflightInput());
        const plan = deletePlan(pre, { reassignTo: 's_spare' });

        const outcome = applyPlanWrites(makeFakeCtx(db), plan);

        expect(outcome).toEqual({ written: 0, unchanged: 2, refused: [] });
    });

    it('the other five primitives are satisfiable by the same JSON host', () => {
        // Not the engine writing - the engine has no create/delete/rename loop yet (S4
        // declared those inversions and deferred them). This is the CONTRACT being
        // implementable end to end by something that is not jjodel, which is the claim
        // R-FORM-2 makes and the thing that stops being a declaration here.
        const db = seedDb();
        const ctx = makeFakeCtx(db);

        expect(ctx.setName('s_doomed', 'Renamed')).toEqual({ ok: true, changed: true });
        expect(db.s_doomed.name).toBe('Renamed');
        expect(ctx.setName('s_doomed', 'Renamed')).toEqual({ ok: true, changed: false });

        expect(ctx.appendValue('t_one', 'target', 's_spare', true)).toEqual({ ok: true, changed: true });
        expect(db.t_one.slots.target).toEqual(['s_doomed', 's_spare']);

        const created = ctx.create('State', null, null, { name: 'Fresh' });
        expect(created.ok).toBe(true);
        expect(db[created.id as string]).toEqual({ cls: 'State', name: 'Fresh', slots: {} });

        expect(ctx.delete(created.id as string)).toEqual({ ok: true, changed: true });
        expect(db[created.id as string]).toBeUndefined();
        // Already gone is not a failure - the case a containment cascade hits whenever
        // the host removed a child on its own.
        expect(ctx.delete(created.id as string)).toEqual({ ok: true, changed: false });
    });
});
