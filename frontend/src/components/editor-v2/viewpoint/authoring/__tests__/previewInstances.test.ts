/**
 * previewInstances — the per-instance resolution and the caption of the Symbol modal
 * preview strip (slice 5, D8-a and D8-b).
 *
 * Executed, not read (P11): the module is imported and run against plain D-layer
 * fixtures through the draw `ReadCtx`, which is possible only because it keeps out of
 * the `joiner` barrel — the same constraint `borderOverrides.ts` was split out for.
 *
 * Mutation bench declared with the slice: making the Border caption pick the LAST
 * holding row instead of the first kills «the FIRST holding row wins» below.
 */
import { describe, it, expect } from 'vitest';
import {
    BASE_CAPTION,
    OTHERWISE_CAPTION,
    borderRowPredicates,
    captionForInstance,
    instanceLabel,
    resolveConditional,
    resolvePreviewInstances,
} from '../previewInstances';
import { borderOverrideRows } from '../borderOverrides';
import { formatPredicate } from '../../../../ui/ConditionalEditor/conditional';
import { makeDrawReadCtx } from '../../ir/irReadCtx';
import type { Predicate, VertexViewIR } from '../../ir/irTypes';

/**
 * s1 (State) name='Idle', isInitial=true, kind='start'
 * s2 (State) name='Done', isInitial=false, kind='end'
 * s3 (State) NO name slot and no D-layer name: the `#N` fallback case.
 */
function world() {
    const idlookup: Record<string, any> = {
        C_State: { id: 'C_State', name: 'State', extends: [] },
        A_name: { id: 'A_name', name: 'name' },
        A_isInitial: { id: 'A_isInitial', name: 'isInitial' },
        A_kind: { id: 'A_kind', name: 'kind' },
        s1: { id: 's1', name: 'Idle', instanceof: 'C_State', features: ['v1n', 'v1i', 'v1k'] },
        v1n: { id: 'v1n', instanceof: 'A_name', values: ['Idle'] },
        v1i: { id: 'v1i', instanceof: 'A_isInitial', values: [true] },
        v1k: { id: 'v1k', instanceof: 'A_kind', values: ['start'] },
        s2: { id: 's2', name: 'Done', instanceof: 'C_State', features: ['v2n', 'v2i', 'v2k'] },
        v2n: { id: 'v2n', instanceof: 'A_name', values: ['Done'] },
        v2i: { id: 'v2i', instanceof: 'A_isInitial', values: [false] },
        v2k: { id: 'v2k', instanceof: 'A_kind', values: ['end'] },
        s3: { id: 's3', instanceof: 'C_State', features: [] },
    };
    return makeDrawReadCtx(idlookup);
}

const isInitial: Predicate = { op: 'eq', left: '$isInitial.value', right: { kind: 'boolean', value: true } } as any;
const isNotInitial: Predicate = { op: 'eq', left: '$isInitial.value', right: { kind: 'boolean', value: false } } as any;
const kindIsStart: Predicate = { op: 'eq', left: '$kind.value', right: { kind: 'string', value: 'start' } } as any;

const SIZE = '190 × 58 px · derived from ink (D8)';
const input = (objectId: string) => ({ objectId, sizeCaption: SIZE });

/** A shape with the form axis in rules form: initial → circle, else the default rect. */
const conditionalForm: VertexViewIR['shape'] = {
    form: { rules: [{ when: isInitial, then: 'circle' }], default: 'rect' },
};

describe('resolveConditional', () => {
    it('gives the winning rule value, the default otherwise, undefined when absent', () => {
        const ctx = world();
        expect(resolveConditional(conditionalForm.form, ctx, 's1')).toBe('circle');
        expect(resolveConditional(conditionalForm.form, ctx, 's2')).toBe('rect');
        expect(resolveConditional(undefined, ctx, 's1')).toBeUndefined();
        expect(resolveConditional('#eee', ctx, 's1')).toBe('#eee');
    });

    it('reads the else of a {when, then, else} as the default', () => {
        const ctx = world();
        const c = { when: isInitial, then: 'circle' as const, else: 'diamond' as const };
        expect(resolveConditional(c, ctx, 's1')).toBe('circle');
        expect(resolveConditional(c, ctx, 's2')).toBe('diamond');
    });
});

describe('instanceLabel', () => {
    it('is the name feature read through the ReadCtx', () => {
        expect(instanceLabel(world(), 's1', 0)).toBe('Idle');
        expect(instanceLabel(world(), 's2', 1)).toBe('Done');
    });

    it('falls back to #N, 1-based, when the instance has no name at all', () => {
        expect(instanceLabel(world(), 's3', 2)).toBe('#3');
    });
});

describe('captionForInstance — axis sections (D8-a)', () => {
    it('reports the winning predicate on a conditional Symbol axis', () => {
        const ctx = world();
        expect(captionForInstance(conditionalForm, 'symbol', ctx, input('s1'), 0))
            .toBe(`Idle · ${formatPredicate(isInitial)}`);
    });

    it('reports `otherwise` on Symbol when no rule wins', () => {
        const ctx = world();
        expect(captionForInstance(conditionalForm, 'symbol', ctx, input('s2'), 1))
            .toBe(`Done · ${OTHERWISE_CAPTION}`);
    });

    it('reports the winning predicate on Fill and on Marker', () => {
        const ctx = world();
        const shape: VertexViewIR['shape'] = {
            form: 'rect',
            fill: { rules: [{ when: isInitial, then: '#dbeafe' }], default: '#fff' },
            marker: { rules: [{ when: kindIsStart, then: 'bar-top' }] },
        };
        expect(captionForInstance(shape, 'fill', ctx, input('s1'), 0))
            .toBe(`Idle · ${formatPredicate(isInitial)}`);
        expect(captionForInstance(shape, 'marker', ctx, input('s1'), 0))
            .toBe(`Idle · ${formatPredicate(kindIsStart)}`);
        expect(captionForInstance(shape, 'fill', ctx, input('s2'), 1))
            .toBe(`Done · ${OTHERWISE_CAPTION}`);
    });

    it('keeps the size caption where the section axis is SCALAR', () => {
        const ctx = world();
        const shape: VertexViewIR['shape'] = { form: 'rect', fill: '#fff' };
        expect(captionForInstance(shape, 'symbol', ctx, input('s1'), 0)).toBe(SIZE);
        expect(captionForInstance(shape, 'fill', ctx, input('s1'), 0)).toBe(SIZE);
        // An absent axis is not conditional either.
        expect(captionForInstance(shape, 'marker', ctx, input('s1'), 0)).toBe(SIZE);
    });

    it('keeps the size caption on every section that reports no rule', () => {
        const ctx = world();
        // The form axis IS conditional here: the section is what decides, not the IR.
        for (const section of ['padding', 'sizing', 'badges'] as const) {
            expect(captionForInstance(conditionalForm, section, ctx, input('s1'), 0)).toBe(SIZE);
        }
        // `undefined` is the Text entry, which shows a whole body and no axis.
        expect(captionForInstance(conditionalForm, undefined, ctx, input('s1'), 0)).toBe(SIZE);
    });

    it('uses #N in the caption too when the instance has no name', () => {
        expect(captionForInstance(conditionalForm, 'symbol', world(), input('s3'), 2))
            .toBe(`#3 · ${OTHERWISE_CAPTION}`);
    });
});

describe('captionForInstance — Border (D8-a)', () => {
    /** color and width both override under isInitial; width also under kindIsStart. */
    const shape: VertexViewIR['shape'] = {
        form: 'rect',
        border: {
            color: { rules: [{ when: isInitial, then: '#0ea5e9' }], default: '#334155' },
            width: { rules: [{ when: isInitial, then: 3 }, { when: kindIsStart, then: 2 }], default: 1 },
        },
    };

    it('lets the FIRST holding row win over a later row that also holds', () => {
        // On s1 both rows hold: isInitial (row 0, first seen on `color`) and kindIsStart
        // (row 1, seen on `width`). The rows are the rules in first-match-wins order, so
        // the caption must name row 0 — naming the last would name a rule the canvas
        // never applied.
        expect(captionForInstance(shape, 'border', world(), input('s1'), 0))
            .toBe(`Idle · ${formatPredicate(isInitial)}`);
    });

    it('says `base` when no row holds', () => {
        expect(captionForInstance(shape, 'border', world(), input('s2'), 1))
            .toBe(`Done · ${BASE_CAPTION}`);
    });

    it('reports a row that holds on a later axis when the earlier rows do not', () => {
        const only: VertexViewIR['shape'] = {
            form: 'rect',
            border: {
                color: { rules: [{ when: isInitial, then: '#0ea5e9' }] },
                style: { rules: [{ when: isNotInitial, then: 'dashed' }] },
            },
        };
        expect(captionForInstance(only, 'border', world(), input('s2'), 0))
            .toBe(`Done · ${formatPredicate(isNotInitial)}`);
    });

    it('keeps the size caption when all three border axes are scalar or absent', () => {
        const scalar: VertexViewIR['shape'] = { form: 'rect', border: { color: '#334155', width: 2 } };
        expect(captionForInstance(scalar, 'border', world(), input('s1'), 0)).toBe(SIZE);
        expect(captionForInstance({ form: 'rect' }, 'border', world(), input('s1'), 0)).toBe(SIZE);
    });

    it('says `base` when an axis is conditional but carries no rule (the D3 empty form)', () => {
        const empty: VertexViewIR['shape'] = { form: 'rect', border: { width: { rules: [], default: 2 } } };
        expect(captionForInstance(empty, 'border', world(), input('s1'), 0))
            .toBe(`Idle · ${BASE_CAPTION}`);
    });
});

describe('borderRowPredicates', () => {
    it('is the same grouping, in the same order, as borderOverrideRows', () => {
        // The anti-drift guard: two derivations of one row list. `borderOverrideRows`
        // carries `whenText` and not `when`, so the caption cannot ask it which row
        // holds; this pins the re-derivation to it, executed, on a shape whose axes
        // DIVERGE — the case where an order mistake would be visible.
        const border: VertexViewIR['shape']['border'] = {
            color: { rules: [{ when: isInitial, then: '#0ea5e9' }] },
            width: { rules: [{ when: kindIsStart, then: 3 }, { when: isInitial, then: 2 }] },
            style: { rules: [{ when: isNotInitial, then: 'dashed' }] },
        };
        expect(borderRowPredicates(border).map((w) => formatPredicate(w)))
            .toEqual(borderOverrideRows(border).rows.map((r) => r.whenText));
        // And the fixture really is the divergent case, not a vacuous one.
        expect(borderOverrideRows(border).divergent).toBe(true);
        expect(borderRowPredicates(border)).toHaveLength(3);
    });

    it('is empty when no axis carries a rule', () => {
        expect(borderRowPredicates(undefined)).toEqual([]);
        expect(borderRowPredicates({ color: '#334155' })).toEqual([]);
    });
});

describe('resolvePreviewInstances', () => {
    it('resolves every axis per instance and captions each one', () => {
        const shape: VertexViewIR['shape'] = {
            form: { rules: [{ when: isInitial, then: 'circle' }], default: 'rect' },
            fill: { rules: [{ when: isInitial, then: '#dbeafe' }], default: '#ffffff' },
            border: { width: { rules: [{ when: isInitial, then: 3 }], default: 1 }, color: '#334155' },
            marker: { rules: [{ when: kindIsStart, then: 'bar-top' }] },
        };
        const out = resolvePreviewInstances(shape, 'symbol', world(), [input('s1'), input('s2')]);
        expect(out).toHaveLength(2);
        expect(out[0]).toMatchObject({
            objectId: 's1', form: 'circle', fill: '#dbeafe', borderWidth: 3, borderColor: '#334155', marker: 'bar-top',
        });
        expect(out[0].caption).toBe(`Idle · ${formatPredicate(isInitial)}`);
        expect(out[1]).toMatchObject({ objectId: 's2', form: 'rect', fill: '#ffffff', borderWidth: 1 });
        expect(out[1].marker).toBeUndefined();
        expect(out[1].caption).toBe(`Done · ${OTHERWISE_CAPTION}`);
    });

    it('falls back to rect when the form conditional has no default (irCompile.ts:305)', () => {
        const shape: VertexViewIR['shape'] = { form: { rules: [{ when: kindIsStart, then: 'circle' }] } };
        const out = resolvePreviewInstances(shape, 'symbol', world(), [input('s2')]);
        expect(out[0].form).toBe('rect');
    });

    it('leaves an absent axis undefined rather than inventing a value', () => {
        const out = resolvePreviewInstances({ form: 'rect' }, 'symbol', world(), [input('s1')]);
        expect(out[0]).toMatchObject({ form: 'rect' });
        expect(out[0].fill).toBeUndefined();
        expect(out[0].borderColor).toBeUndefined();
        expect(out[0].borderWidth).toBeUndefined();
        expect(out[0].borderStyle).toBeUndefined();
        expect(out[0].marker).toBeUndefined();
    });

    it('is empty for no instance: the strip has nothing to draw', () => {
        expect(resolvePreviewInstances(conditionalForm, 'symbol', world(), [])).toEqual([]);
    });
});
