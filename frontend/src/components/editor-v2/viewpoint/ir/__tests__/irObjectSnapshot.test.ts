/**
 * objectSnapshotParts — the self snapshot behind the useIRView / useIRRowView subscriptions.
 *
 * The hooks live in irResolve.ts, which imports the joiner and cannot load in the node
 * bench; the snapshot does, and it is what decides whether their memo re-runs. An
 * intrinsic `name` / `metaclassName` / `qualifiedName` label draws what `getName` and
 * `getMetaclassName` read, so the snapshot has to move exactly when those move.
 *
 * Each test name declares the mutation that kills it (CLAUDE.md section 5).
 */
import { describe, it, expect } from 'vitest';
import { objectSnapshotParts } from '../irResolveCore';
import { makeDrawReadCtx } from '../irReadCtx';

type Lookup = Record<string, any>;

/** Class `Plain` has no `name` attribute; `Named` has one; `Other` shares nothing with them. */
function world(): Lookup {
    return {
        C_Plain: { id: 'C_Plain', name: 'Plain', extends: [] },
        C_Named: { id: 'C_Named', name: 'Named', extends: [] },
        C_Other: { id: 'C_Other', name: 'Other', extends: [] },
        A_name: { id: 'A_name', name: 'name' },
        A_size: { id: 'A_size', name: 'size' },
        o1: { id: 'o1', name: 'old', instanceof: 'C_Plain', features: ['v1s'] },
        v1s: { id: 'v1s', instanceof: 'A_size', values: [1] },
        o2: { id: 'o2', name: 'old2', instanceof: 'C_Named', features: ['v2n'] },
        v2n: { id: 'v2n', instanceof: 'A_name', values: ['old2'] },
        o3: { id: 'o3', name: 'sibling', instanceof: 'C_Plain', features: [] },
        o4: { id: 'o4', name: 'stranger', instanceof: 'C_Other', features: [] },
        o5: { id: 'o5', initialName: 'init', instanceof: 'C_Plain', features: [] },
        o6: { id: 'o6', name: 'live', initialName: 'created', instanceof: 'C_Plain', features: [] },
    };
}

/** The lookup after replacing the records in `patch` (a new object, the way the store replaces). */
function edited(base: Lookup, patch: Lookup): Lookup {
    const out: Lookup = { ...base };
    for (const [k, v] of Object.entries(patch)) out[k] = { ...base[k], ...v };
    return out;
}

/** The string the hooks compare: the parts joined with ';'. */
function snap(lookup: Lookup, id: string): string {
    return (objectSnapshotParts(lookup, id, 'sig') ?? ['<null>']).join(';');
}

describe('objectSnapshotParts', () => {
    it('moves when only the object name changes (dies if the object-name term is dropped)', () => {
        const w = world();
        expect(snap(edited(w, { o1: { name: 'renamed' } }), 'o1')).not.toBe(snap(w, 'o1'));
    });

    it('moves when only initialName changes on an unnamed object (dies if the initialName fallback is dropped)', () => {
        const w = world();
        expect(snap(edited(w, { o5: { initialName: 'other-init' } }), 'o5')).not.toBe(snap(w, 'o5'));
    });

    it('moves when only the metaclass name changes (dies if the metaclass-name term is dropped)', () => {
        const w = world();
        expect(snap(edited(w, { C_Plain: { name: 'Renamed' } }), 'o1')).not.toBe(snap(w, 'o1'));
    });

    it('does not move when another object is renamed (dies if the name term reads more than the object\'s own)', () => {
        const w = world();
        const before = snap(w, 'o1');
        expect(snap(edited(w, { o3: { name: 'renamed' } }), 'o1')).toBe(before);   // same class
        expect(snap(edited(w, { o4: { name: 'renamed' } }), 'o1')).toBe(before);   // other class
    });

    it('does not move when an unrelated class is renamed (dies if the metaclass term reads a class other than the object\'s own)', () => {
        const w = world();
        expect(snap(edited(w, { C_Other: { name: 'Renamed' }, C_Named: { name: 'Renamed' } }), 'o1')).toBe(snap(w, 'o1'));
    });

    it('follows name, not initialName, once both are set (dies if the fallback order is inverted)', () => {
        const w = world();
        expect(snap(edited(w, { o6: { name: 'renamed' } }), 'o6')).not.toBe(snap(w, 'o6'));
        expect(snap(edited(w, { o6: { initialName: 'recreated' } }), 'o6')).toBe(snap(w, 'o6'));
    });

    it('moves on a slot value change (dies if the slot loop is dropped)', () => {
        const w = world();
        expect(snap(edited(w, { v1s: { values: [2] } }), 'o1')).not.toBe(snap(w, 'o1'));
    });

    it('moves for every edit that changes what getName or getMetaclassName reads, and only for those (dies if the snapshot and the accessors drift apart)', () => {
        const w = world();
        const edits: Array<[string, string, Lookup]> = [
            ['o1 renamed', 'o1', { o1: { name: 'renamed' } }],
            ['o1 class renamed', 'o1', { C_Plain: { name: 'Renamed' } }],
            ['o2 renamed with its slot', 'o2', { o2: { name: 'r2' }, v2n: { values: ['r2'] } }],
            ['o2 class renamed', 'o2', { C_Named: { name: 'Renamed' } }],
            ['o5 initialName', 'o5', { o5: { initialName: 'other-init' } }],
            ['o6 renamed, initialName kept', 'o6', { o6: { name: 'renamed' } }],
            ['o6 initialName changed, name kept', 'o6', { o6: { initialName: 'recreated' } }],
            ['o3 renamed, read o1', 'o1', { o3: { name: 'renamed' } }],
            ['o4 class renamed, read o1', 'o1', { C_Other: { name: 'Renamed' } }],
        ];
        for (const [label, id, patch] of edits) {
            const after = edited(w, patch);
            const readBefore = makeDrawReadCtx(w);
            const readAfter = makeDrawReadCtx(after);
            const readerMoved =
                readBefore.getName(id) !== readAfter.getName(id)
                || readBefore.getMetaclassName(id) !== readAfter.getMetaclassName(id);
            expect([label, snap(after, id) !== snap(w, id)]).toEqual([label, readerMoved]);
        }
    });

    it('keeps irSig, object id and metaclass id as its leading parts (dies if they are reordered or dropped)', () => {
        expect(objectSnapshotParts(world(), 'o1', 'sig')!.slice(0, 3)).toEqual(['sig', 'o1', 'C_Plain']);
    });

    it('returns null for an object that is not in the lookup (dies if the guard is dropped)', () => {
        expect(objectSnapshotParts(world(), 'missing', 'sig')).toBeNull();
        expect(objectSnapshotParts(undefined, 'o1', 'sig')).toBeNull();
    });

    it('does not alias a name and a metaclass name that join to the same text (dies if the terms are not quoted)', () => {
        const w = world();
        const a = edited(w, { o3: { name: 'a' }, C_Plain: { name: 'b;c=' } });
        const b = edited(w, { o3: { name: 'a;c=b' }, C_Plain: { name: '' } });
        expect(snap(a, 'o3')).not.toBe(snap(b, 'o3'));
    });
});
