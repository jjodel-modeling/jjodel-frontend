/**
 * `getLayoutKeyOf` — the impure half of the layout resolver, tested on synthetic state.
 *
 * The joiner barrel is mocked away rather than imported: pulling it in loads monaco-editor and
 * `window`, which is what makes 9 suites red in this repo (see the note at the head of
 * `vertexLayout.ts`). The mock supplies the single symbol the adapter imports — `store` — and
 * every test here calls `getLayoutKeyOf(state)` with the state in hand, so the mocked store is
 * never even read. Its only job is to let the module load.
 *
 * `getActiveLayoutKey` is deliberately NOT tested: it is `getLayoutKeyOf(store.getState())` and
 * nothing else, so a test of it would be a test of the mock.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../joiner', () => ({ store: { getState: () => ({}) } }));

import { ABSTRACT_SYNTAX_LAYOUT_KEY, getLayoutKeyOf } from '../vertexLayoutAdapter';

const VP = 'Pointer_vp_exclusive';
const DECO = 'Pointer_vp_decorative';

/** A state with both an exclusive and a non-exclusive viewpoint, activating `active`. */
const state = (active: unknown) => ({
    viewpoint: active,
    idlookup: {
        [VP]: { className: 'DViewPoint', isExclusiveView: true },
        [DECO]: { className: 'DViewPoint', isExclusiveView: false },
    },
});

describe('getLayoutKeyOf', () => {
    it('returns the viewpoint id when the active viewpoint is exclusive', () => {
        expect(getLayoutKeyOf(state(VP))).toBe(VP);
    });

    it('falls back to abstract syntax when the active viewpoint is decorative', () => {
        // R-LAY-16 as amended: a non-exclusive viewpoint is not a layout of its own.
        expect(getLayoutKeyOf(state(DECO))).toBe(ABSTRACT_SYNTAX_LAYOUT_KEY);
    });

    it('falls back to abstract syntax on both spellings of "no viewpoint"', () => {
        // R-IRN-11/R-IRN-21 leave `null` as the canonical empty, but '' survives in old
        // snapshots and the two must behave identically here.
        expect(getLayoutKeyOf(state(null))).toBe(ABSTRACT_SYNTAX_LAYOUT_KEY);
        expect(getLayoutKeyOf(state(''))).toBe(ABSTRACT_SYNTAX_LAYOUT_KEY);
        expect(getLayoutKeyOf(state(undefined))).toBe(ABSTRACT_SYNTAX_LAYOUT_KEY);
    });

    it('falls back to abstract syntax when the active viewpoint is not a string', () => {
        expect(getLayoutKeyOf(state({ id: VP }))).toBe(ABSTRACT_SYNTAX_LAYOUT_KEY);
    });

    it('falls back to abstract syntax when the viewpoint id resolves to nothing', () => {
        // `state.viewpoint` is NOT scrubbed by VersionFixer (unlike `state.viewpoints`), so a
        // pointer to a deleted viewpoint is reachable and must not throw.
        expect(getLayoutKeyOf({ viewpoint: 'Pointer_deleted', idlookup: {} }))
            .toBe(ABSTRACT_SYNTAX_LAYOUT_KEY);
        expect(getLayoutKeyOf({ viewpoint: VP })).toBe(ABSTRACT_SYNTAX_LAYOUT_KEY);
    });

    it('falls back to abstract syntax on a missing or hostile state', () => {
        expect(getLayoutKeyOf(undefined)).toBe(ABSTRACT_SYNTAX_LAYOUT_KEY);
        expect(getLayoutKeyOf(null)).toBe(ABSTRACT_SYNTAX_LAYOUT_KEY);
        const throwing = { get viewpoint(): string { throw new Error('boom'); } };
        expect(getLayoutKeyOf(throwing)).toBe(ABSTRACT_SYNTAX_LAYOUT_KEY);
    });

    it('never returns null: editor-v2 does not rewrite the seed', () => {
        for (const active of [VP, DECO, null, '', undefined]) {
            expect(typeof getLayoutKeyOf(state(active))).toBe('string');
        }
    });
});
