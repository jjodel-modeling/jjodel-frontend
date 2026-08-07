/**
 * Unit tests for collectViewSubtree — the enumeration the `set_father` cascade and the
 * "Parent view" select both depend on.
 *
 * They assert the shipped module, not a copy of its logic. The three properties that
 * matter downstream are the ones a wrong answer would break in production: every level
 * is reached (a grandchild that stays behind stops rendering after a move), a cycle
 * terminates (the two upward walks in view.tsx have no visited set and would hang the
 * tab), and the root is never in its own result (it would be reparented onto itself).
 */
import { describe, it, expect } from 'vitest';
import { collectViewSubtree, type ViewSubtreeSource } from '../viewSubtree';

/** Builds a state slice out of `id -> father` pairs. */
function stateOf(fathers: { [id: string]: string | undefined }): ViewSubtreeSource {
    const idlookup: { [id: string]: any } = {};
    for (const id in fathers) idlookup[id] = { id, className: 'DViewElement', father: fathers[id] };
    return { viewelements: Object.keys(fathers), idlookup };
}

describe('collectViewSubtree', () => {
    it('returns the direct children of a view', () => {
        const s = stateOf({ vp: undefined, root: 'vp', a: 'root', b: 'root' });
        expect(collectViewSubtree(s, 'root').sort()).toEqual(['a', 'b']);
    });

    it('reaches every level, not just the first', () => {
        const s = stateOf({ vp: undefined, root: 'vp', child: 'root', grandchild: 'child', greatgrandchild: 'grandchild' });
        expect(collectViewSubtree(s, 'root').sort()).toEqual(['child', 'grandchild', 'greatgrandchild']);
    });

    it('never includes the root itself', () => {
        const s = stateOf({ vp: undefined, root: 'vp', child: 'root' });
        expect(collectViewSubtree(s, 'root')).not.toContain('root');
    });

    it('ignores siblings and other branches of the same viewpoint', () => {
        const s = stateOf({ vp: undefined, root: 'vp', other: 'vp', otherchild: 'other', child: 'root' });
        expect(collectViewSubtree(s, 'root')).toEqual(['child']);
    });

    it('terminates on a cycle that closes back onto the root', () => {
        const s = stateOf({ root: 'leaf', child: 'root', leaf: 'child' });
        expect(collectViewSubtree(s, 'root').sort()).toEqual(['child', 'leaf']);
    });

    it('terminates on a cycle that does not involve the root', () => {
        const s = stateOf({ root: 'vp', a: 'root', b: 'a', c: 'b' });
        (s.idlookup as any).a.father = 'c'; // a -> b -> c -> a, detached from root
        expect(collectViewSubtree(s, 'root')).toEqual([]);
    });

    it('returns [] for a leaf, an unknown id and an empty pointer', () => {
        const s = stateOf({ vp: undefined, root: 'vp', child: 'root' });
        expect(collectViewSubtree(s, 'child')).toEqual([]);
        expect(collectViewSubtree(s, 'nosuchview')).toEqual([]);
        expect(collectViewSubtree(s, '')).toEqual([]);
    });

    it('does not depend on subViews being present or correct', () => {
        // The opposite is deliberately absent here: four writers maintain it and a project
        // migrated from pre-2.201 can carry a father whose parent does not list it.
        const s = stateOf({ vp: undefined, root: 'vp', child: 'root', grandchild: 'child' });
        for (const id in s.idlookup) s.idlookup[id].subViews = {};
        expect(collectViewSubtree(s, 'root').sort()).toEqual(['child', 'grandchild']);
    });

    it('skips entries whose father is missing or not a pointer', () => {
        const s = stateOf({ vp: undefined, root: 'vp', child: 'root' });
        s.idlookup.orphan = { id: 'orphan', className: 'DViewElement' };
        s.idlookup.malformed = { id: 'malformed', className: 'DViewElement', father: 42 };
        (s as any).viewelements = [...s.viewelements, 'orphan', 'malformed'];
        expect(collectViewSubtree(s, 'root')).toEqual(['child']);
    });
});
