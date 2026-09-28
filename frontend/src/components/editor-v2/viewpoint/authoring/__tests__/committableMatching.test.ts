/**
 * Unit tests for the commit gate of an unfinished matching (item C of
 * P-2026-09-18-1650): `metaclasses: []` is a draft state, never a commit.
 *
 * The predicate is a pure module with no imports (committableMatching.ts) because
 * its consumers — the three host panels and MatchingSection — are not import-safe
 * in the node vitest env (joiner → monaco → `window`; ui barrel → scss), measured
 * 2026-09-18. The five cases are the ones the prompt names: the wildcard, the
 * empty list, a real list, the absent field, and an edge ir that has no
 * `metaclasses` at all.
 */
import { describe, it, expect } from 'vitest';
import { isCommittableMatching } from '../committableMatching';

describe('isCommittableMatching', () => {
    it('the wildcard string is committable', () => {
        expect(isCommittableMatching({ metaclasses: '*' })).toBe(true);
    });

    it('an empty metaclass list is an unfinished edit, never committable', () => {
        expect(isCommittableMatching({ metaclasses: [] })).toBe(false);
    });

    it('a non-empty list is committable', () => {
        expect(isCommittableMatching({ metaclasses: ['A'] })).toBe(true);
    });

    it('an absent metaclasses field is committable (the kind has no matching)', () => {
        expect(isCommittableMatching({})).toBe(true);
    });

    it('an edge ir without the field is committable', () => {
        const edgeIr = { kind: 'edge', reference: 'friends', labels: {} };
        expect(isCommittableMatching(edgeIr as any)).toBe(true);
    });
});