/**
 * borderOverrideRows — the grouping behind the Border OVERRIDES table (D1, slice 2)
 * and, since slice 4b, behind the count badge of the Border entry in the modal's
 * section nav.
 *
 * Slice 2 left this function without tests and said so in its log entry. What made it
 * due is the badge: the number on screen and the rows in the table must be the same
 * derivation, and the way they come apart is one of them being re-derived by hand.
 * These tests pin the grouping itself, so either caller is covered by the same bench.
 *
 * Executed, not read: the function is imported and run (P11). That is possible only
 * because it lives in its own pure module — inside `VertexAuthoringPanel.tsx` it was
 * unreachable here, the `joiner` barrel pulling Monaco and dereferencing `window` at
 * import time.
 */

import { describe, it, expect } from 'vitest';
import { BORDER_AXES, borderOverrideRows } from '../borderOverrides';
import type { Predicate, VertexViewIR } from '../../ir/irTypes';

type Border = VertexViewIR['shape']['border'];

/** `eq <path> true`, which formatPredicate renders as the bare path name. */
const flag = (name: string): Predicate =>
    ({ op: 'eq', left: `$${name}.value`, right: { kind: 'boolean', value: true } }) as unknown as Predicate;

const IS_FINAL = flag('isFinal');
const IS_INITIAL = flag('isInitial');

describe('borderOverrideRows: nothing to group', () => {
    it('an absent border has no rows and does not diverge', () => {
        expect(borderOverrideRows(undefined)).toEqual({ rows: [], divergent: false });
    });

    it('a fully scalar border has no rows', () => {
        const border: Border = { color: '#aa0000', width: 2, style: 'dashed' };
        expect(borderOverrideRows(border)).toEqual({ rows: [], divergent: false });
    });

    it('an axis switched to Conditional with no rules yet contributes none (state 2i)', () => {
        const border: Border = { width: { rules: [], default: 3 } };
        expect(borderOverrideRows(border)).toEqual({ rows: [], divergent: false });
    });
});

describe('borderOverrideRows: one row per predicate, not per rule', () => {
    it('two rules on one axis are two rows, in rule order, both naming that axis', () => {
        const border: Border = {
            width: { rules: [{ when: IS_FINAL, then: 3 }, { when: IS_INITIAL, then: 1 }] },
        };
        const { rows, divergent } = borderOverrideRows(border);
        expect(rows.map((r) => r.whenText)).toEqual(['isFinal', 'isInitial']);
        expect(rows.map((r) => r.axes)).toEqual([['width'], ['width']]);
        // One axis cannot disagree with itself, whatever its predicates.
        expect(divergent).toBe(false);
    });

    it('two axes under the SAME predicate collapse into one row carrying both', () => {
        const border: Border = {
            color: { rules: [{ when: IS_FINAL, then: '#ff0000' }] },
            width: { rules: [{ when: IS_FINAL, then: 3 }] },
        };
        const { rows, divergent } = borderOverrideRows(border);
        expect(rows).toHaveLength(1);
        expect(rows[0].whenText).toBe('isFinal');
        expect(rows[0].axes).toEqual(['color', 'width']);
        expect(divergent).toBe(false);
    });

    it('three axes under one predicate give one row, in BORDER_AXES order', () => {
        const rule = <T,>(then: T) => ({ rules: [{ when: IS_FINAL, then }] });
        const border: Border = {
            // Declared style-first on purpose: the row must follow the table's axis
            // order, not the order the keys happen to be written in.
            style: rule('dashed' as const),
            width: rule(3),
            color: rule('#ff0000'),
        };
        const { rows } = borderOverrideRows(border);
        expect(rows).toHaveLength(1);
        expect(rows[0].axes).toEqual([...BORDER_AXES]);
    });

    it('an axis repeating the same predicate is named once in its row', () => {
        const border: Border = {
            width: { rules: [{ when: IS_FINAL, then: 3 }, { when: IS_FINAL, then: 5 }] },
        };
        const { rows } = borderOverrideRows(border);
        expect(rows).toHaveLength(1);
        expect(rows[0].axes).toEqual(['width']);
    });
});

describe('borderOverrideRows: divergence', () => {
    it('axes overriding on DIFFERENT conditions keep a row each and say so', () => {
        const border: Border = {
            color: { rules: [{ when: IS_FINAL, then: '#ff0000' }] },
            width: { rules: [{ when: IS_INITIAL, then: 3 }] },
        };
        const { rows, divergent } = borderOverrideRows(border);
        expect(rows.map((r) => [r.whenText, r.axes])).toEqual([
            ['isFinal', ['color']],
            ['isInitial', ['width']],
        ]);
        expect(divergent).toBe(true);
    });

    it('a shared predicate plus one extra on a single axis still diverges', () => {
        const border: Border = {
            color: { rules: [{ when: IS_FINAL, then: '#ff0000' }] },
            width: { rules: [{ when: IS_FINAL, then: 3 }, { when: IS_INITIAL, then: 1 }] },
        };
        const { rows, divergent } = borderOverrideRows(border);
        // The shared predicate still collapses; the surplus is its own row.
        expect(rows.map((r) => r.axes)).toEqual([['color', 'width'], ['width']]);
        expect(divergent).toBe(true);
    });
});

describe('borderOverrideRows: the three Conditional spellings', () => {
    it('reads the {when,then,else} form, not only {rules}', () => {
        // Proof that the axis goes through `toRules` instead of a raw `.rules` read:
        // written this way there is no `rules` key at all, and a raw read sees nothing.
        const border: Border = {
            width: { when: IS_FINAL, then: 3, else: 1 } as any,
        };
        const { rows } = borderOverrideRows(border);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toEqual({ whenText: 'isFinal', axes: ['width'] });
    });

    it('groups the {when,then} form together with the {rules} form of the same predicate', () => {
        const border: Border = {
            color: { when: IS_FINAL, then: '#ff0000' } as any,
            style: { rules: [{ when: IS_FINAL, then: 'dashed' as const }] },
        };
        const { rows, divergent } = borderOverrideRows(border);
        expect(rows).toHaveLength(1);
        expect(rows[0].axes).toEqual(['color', 'style']);
        expect(divergent).toBe(false);
    });
});
