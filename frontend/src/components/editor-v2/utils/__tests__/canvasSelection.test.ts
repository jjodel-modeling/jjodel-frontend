import { describe, it, expect } from 'vitest';
import { orderSelection, sameIdList, resolveElementIds } from '../canvasSelection';

describe('orderSelection', () => {
    it('starts from the order React Flow lists the selected nodes', () => {
        expect(orderSelection([], ['a', 'b'])).toEqual(['a', 'b']);
    });

    it('appends a node selected later after the ones already selected', () => {
        // React Flow lists nodes in array order, not click order: C before A here.
        expect(orderSelection(['a', 'b'], ['c', 'a', 'b'])).toEqual(['a', 'b', 'c']);
    });

    it('drops a deselected node and keeps the others in place', () => {
        expect(orderSelection(['a', 'b', 'c'], ['c', 'a'])).toEqual(['a', 'c']);
    });

    it('empties when nothing is selected', () => {
        expect(orderSelection(['a', 'b'], [])).toEqual([]);
    });

    it('lists a duplicated id once', () => {
        expect(orderSelection([], ['a', 'a', 'b'])).toEqual(['a', 'b']);
    });

    it('does not mutate its inputs', () => {
        const prev = ['a', 'b'];
        const now = ['b', 'c'];
        orderSelection(prev, now);
        expect(prev).toEqual(['a', 'b']);
        expect(now).toEqual(['b', 'c']);
    });
});

describe('sameIdList', () => {
    it('is true for the same ids in the same order', () => {
        expect(sameIdList(['a', 'b'], ['a', 'b'])).toBe(true);
        expect(sameIdList([], [])).toBe(true);
    });

    it('is false when the order differs', () => {
        expect(sameIdList(['a', 'b'], ['b', 'a'])).toBe(false);
    });

    it('is false when the length differs', () => {
        expect(sameIdList(['a'], ['a', 'b'])).toBe(false);
        expect(sameIdList(['a', 'b'], ['a'])).toBe(false);
    });
});

describe('resolveElementIds', () => {
    const idlookup = {
        v1: { id: 'v1', model: 'e1' },
        v2: { id: 'v2', model: 'e2' },
        e3: { id: 'e3' },
    };

    it('maps each vertex to its model element, in order', () => {
        expect(resolveElementIds(['v2', 'v1'], idlookup)).toEqual(['e2', 'e1']);
    });

    it('keeps the id of a D-object with no model', () => {
        expect(resolveElementIds(['e3'], idlookup)).toEqual(['e3']);
    });

    it('leaves out a node with no D-object', () => {
        expect(resolveElementIds(['ghost', 'v1'], idlookup)).toEqual(['e1']);
        expect(resolveElementIds(['v1'], undefined)).toEqual([]);
    });
});
