/**
 * Which viewpoints get React Flow's `onlyRenderVisibleElements` (P-2026-11-02-0020).
 *
 * ── The subject runs ────────────────────────────────────────────────────────
 * `canRenderOnlyVisible` is called as EditorV2 calls it, on an index built by the real `getIRIndex` from IR objects
 * in a fake state slice (the ir.test.ts fixture shape), so the views are compiled as on canvas. Each index is built
 * under a signature of its own: the index cache is module state, and a shared key would hand one test the index of
 * another.
 *
 * Gap: the call site (`EditorV2.tsx`, the memo over `irContainment.model` and the prop on `<ReactFlow>`) is not
 * executable here, because EditorV2 imports the joiner barrel and monaco, which fail at import with no `window`.
 */

import { describe, expect, it } from 'vitest';
import { getIRIndex } from '../viewpoint/ir/irResolveCore';
import type { AnyViewIR } from '../viewpoint/ir/irTypes';
import { canRenderOnlyVisible, formsOf } from '../onlyRenderVisible';

const world: Record<string, any> = {
    C_Named: { id: 'C_Named', name: 'Named', extends: [] },
    C_Task: { id: 'C_Task', name: 'Task', extends: ['C_Named'] },
    C_Gate: { id: 'C_Gate', name: 'Gate', extends: ['C_Named'] },
    C_Other: { id: 'C_Other', name: 'Task', extends: [] },
    t1: { id: 't1', instanceof: 'C_Task', features: [] },
    t2: { id: 't2', instanceof: 'C_Task', features: [] },
    g1: { id: 'g1', instanceof: 'C_Gate', features: [] },
};

let sigCounter = 0;

function vertex(over: Record<string, unknown>): AnyViewIR {
    return { irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Task'], shape: { form: 'rect' }, ...over } as AnyViewIR;
}

/** The answer for the objects on canvas under a viewpoint holding these views. */
function decide(views: AnyViewIR[], objectIds: string[], containerCount = 0): boolean {
    const idlookup: Record<string, any> = { ...world };
    const viewelements: string[] = [];
    views.forEach((ir, i) => {
        idlookup['V' + i] = { id: 'V' + i, viewpoint: 'VP', ir };
        viewelements.push('V' + i);
    });
    const state = { viewpoint: 'VP', viewelements, idlookup };
    const index = getIRIndex(state, 'VP|sig_only_visible_' + (++sigCounter));
    expect(index).not.toBeNull();
    return canRenderOnlyVisible(index, idlookup, objectIds, containerCount);
}

describe('canRenderOnlyVisible (P-2026-11-02-0020)', () => {
    it('is on with no IR index: no viewpoint, or one with no IR view', () => {
        expect(canRenderOnlyVisible(null, world, ['t1', 't2', 'g1'], 0)).toBe(true);
    });

    it('is on when every candidate view of the objects on canvas fills its box', () => {
        expect(decide([vertex({}), vertex({ metaclasses: ['Gate'], shape: { form: 'rounded' } })], ['t1', 't2', 'g1'])).toBe(true);
    });

    it('is off with a container on canvas', () => {
        expect(decide([vertex({})], ['t1'], 1)).toBe(false);
    });

    it('is off when a candidate view is a graphVertex, container or not on canvas yet', () => {
        expect(decide([vertex({ kind: 'graphVertex', containment: {} })], ['t1'])).toBe(false);
    });

    it('is off with a form that carries a size supplement', () => {
        expect(decide([vertex({}), vertex({ metaclasses: ['Gate'], shape: { form: 'diamond' } })], ['t1', 'g1'])).toBe(false);
        expect(decide([vertex({ shape: { form: 'hexagon' } })], ['t1'])).toBe(false);
    });

    it('ignores a content-sized view of a class with no object on canvas', () => {
        expect(decide([vertex({}), vertex({ metaclasses: ['Gate'], shape: { form: 'diamond' } })], ['t1', 't2'])).toBe(true);
    });

    it('is off with a view defaultSize that has a usable axis, on with one that has none', () => {
        expect(decide([vertex({ defaultSize: { width: 120 } })], ['t1'])).toBe(false);
        expect(decide([vertex({ defaultSize: {} })], ['t1'])).toBe(true);
    });

    it('counts a view inherited from an ancestor, and a wildcard view', () => {
        expect(decide([vertex({ metaclasses: ['Named'], shape: { form: 'ellipse' } })], ['t1'])).toBe(false);
        expect(decide([vertex({ metaclasses: '*', shape: { form: 'circle' } })], ['g1'])).toBe(false);
    });

    it('counts every branch of a conditional form, its predicate unevaluated', () => {
        const never = { op: 'literal', value: false };
        expect(decide([vertex({ shape: { form: { when: never, then: 'diamond', else: 'rect' } } })], ['t1'])).toBe(false);
        expect(decide([vertex({ shape: { form: { when: never, then: 'rect', else: 'diamond' } } })], ['t1'])).toBe(false);
        expect(decide([vertex({ shape: { form: { rules: [{ when: never, then: 'rect' }], default: 'cloud' } } })], ['t1'])).toBe(false);
        expect(decide([vertex({ shape: { form: { when: never, then: 'rounded' } } })], ['t1'])).toBe(true);
    });

    it('counts a view whose predicate is false now: a slot edit could make it win', () => {
        const never = { op: 'literal', value: false };
        expect(decide([vertex({}), vertex({ predicate: never, priority: 5, shape: { form: 'diamond' } })], ['t1'])).toBe(false);
    });

    it('honours a pin to another homonymous class, as resolveIRView does', () => {
        const pinned = vertex({ shape: { form: 'diamond' }, authoringMetaclassPins: { Task: 'C_Other' } });
        expect(decide([vertex({}), pinned], ['t1'])).toBe(true);
        expect(decide([vertex({}), { ...pinned, authoringMetaclassPins: { Task: 'C_Task' } } as AnyViewIR], ['t1'])).toBe(false);
    });
});

describe('formsOf', () => {
    it('falls back to rect where irCompile does', () => {
        expect(formsOf(undefined)).toEqual(['rect']);
        expect(formsOf({ when: {}, then: 'diamond' })).toEqual(['diamond', 'rect']);
        expect(formsOf({ rules: [{ when: {}, then: 'ellipse' }] })).toEqual(['ellipse', 'rect']);
        expect(formsOf('stadium')).toEqual(['stadium']);
    });
});
