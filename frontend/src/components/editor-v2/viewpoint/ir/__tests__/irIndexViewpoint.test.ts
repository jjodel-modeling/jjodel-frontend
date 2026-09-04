/**
 * getIRIndex / computeIRSignature with an EXPLICIT viewpoint (R-DMV-1, slice B).
 *
 * The Data Manager reads its index from its own singleton and never from
 * `state.viewpoint`. The parameter that makes that possible is optional and defaults to
 * the active viewpoint, so these cases must show two things at once: that naming a
 * viewpoint changes what comes out, and that NOT naming one changes nothing.
 *
 * The risk Q3 of the discovery names is the cache. `indexCache` is keyed on the
 * signature alone, and the fixed id `Pointer_ViewPointDataManager` means two projects
 * opened in a row carry the same viewpoint id. What keeps them apart is that the
 * signature also carries a token per ir OBJECT (`refToken`, a WeakMap on identity), so
 * two different sets of views under one id produce two different keys. That is asserted
 * here rather than assumed: a shared index would serve the previous project's columns.
 *
 * Executed, not read (P11): every case calls the exported functions on a real state
 * shape and looks at the returned index, never at the source.
 */
import { describe, it, expect } from 'vitest';
import { computeIRSignature, getIRIndex } from '../irResolveCore';
import type { VertexViewIR } from '../irTypes';

const vertexIR = (metaclass: string): VertexViewIR => ({
    irVersion: 'ir-1.2', kind: 'vertex', metaclasses: [metaclass],
    shape: { form: 'rect' },
} as VertexViewIR);

/** A state with two viewpoints at once: the active one and the singleton. */
function twoViewpoints() {
    const idlookup: Record<string, any> = {
        V_canvas: { id: 'V_canvas', viewpoint: 'VP_active', ir: vertexIR('State') },
        V_table: { id: 'V_table', viewpoint: 'Pointer_ViewPointDataManager', ir: vertexIR('Person') },
    };
    return { viewpoint: 'VP_active', viewelements: ['V_canvas', 'V_table'], idlookup };
}

describe('computeIRSignature — the explicit viewpoint', () => {
    it('without the parameter it is the active viewpoint, exactly as before', () => {
        const state = twoViewpoints();
        const sig = computeIRSignature(state);
        expect(sig.startsWith('VP_active|')).toBe(true);
        expect(sig).toContain('V_canvas:');
        expect(sig).not.toContain('V_table:');       // the singleton's view is not in it
        expect(computeIRSignature(state, undefined)).toBe(sig);   // explicit undefined = absent
    });

    it('with the parameter it is that viewpoint, and only its views', () => {
        const state = twoViewpoints();
        const sig = computeIRSignature(state, 'Pointer_ViewPointDataManager');
        expect(sig.startsWith('Pointer_ViewPointDataManager|')).toBe(true);
        expect(sig).toContain('V_table:');
        expect(sig).not.toContain('V_canvas:');
    });

    it('a viewpoint with no view of its own produces NO signature, hence no index', () => {
        // R-VP-4 read from the other end: the singleton that nobody has written to yet
        // must leave the manager on the type-derived default.
        const state = twoViewpoints();
        expect(computeIRSignature(state, 'Pointer_ViewPointEmpty')).toBe('');
        expect(getIRIndex(state, computeIRSignature(state, 'Pointer_ViewPointEmpty'), 'Pointer_ViewPointEmpty'))
            .toBeNull();
    });
});

describe('getIRIndex — two viewpoints indexed at the same time', () => {
    it('each index holds its own viewpoint and its own views', () => {
        const state = twoViewpoints();
        const active = getIRIndex(state, computeIRSignature(state))!;
        const singleton = getIRIndex(
            state,
            computeIRSignature(state, 'Pointer_ViewPointDataManager'),
            'Pointer_ViewPointDataManager',
        )!;
        expect(active.viewpointId).toBe('VP_active');
        expect(active.viewIds).toEqual(['V_canvas']);
        expect(active.byMetaclass.has('State')).toBe(true);
        expect(active.byMetaclass.has('Person')).toBe(false);

        expect(singleton.viewpointId).toBe('Pointer_ViewPointDataManager');
        expect(singleton.viewIds).toEqual(['V_table']);
        expect(singleton.byMetaclass.has('Person')).toBe(true);
        expect(singleton.byMetaclass.has('State')).toBe(false);

        expect(singleton).not.toBe(active);
    });

    it('indexing the singleton does NOT evict the active index (css lifecycle is per viewpoint)', () => {
        const state = twoViewpoints();
        const sigActive = computeIRSignature(state);
        const first = getIRIndex(state, sigActive)!;
        getIRIndex(state, computeIRSignature(state, 'Pointer_ViewPointDataManager'), 'Pointer_ViewPointDataManager');
        // Same signature, same cached object: had the singleton's build evicted it, this
        // would be a rebuilt index and a different reference.
        expect(getIRIndex(state, sigActive)).toBe(first);
    });

    it('Q3 — same viewpoint id, different views: two keys, never one shared index', () => {
        // The fixed id survives a project change; the ir objects do not. This is the case
        // that would serve the previous project's table if the cache keyed on the id.
        const projectA = {
            viewpoint: 'VP_active',
            viewelements: ['V_a'],
            idlookup: { V_a: { id: 'V_a', viewpoint: 'Pointer_ViewPointDataManager', ir: vertexIR('Person') } },
        };
        const projectB = {
            viewpoint: 'VP_active',
            viewelements: ['V_b'],
            idlookup: { V_b: { id: 'V_b', viewpoint: 'Pointer_ViewPointDataManager', ir: vertexIR('Order') } },
        };
        const sigA = computeIRSignature(projectA, 'Pointer_ViewPointDataManager');
        const sigB = computeIRSignature(projectB, 'Pointer_ViewPointDataManager');
        expect(sigA).not.toBe(sigB);                       // controllo positivo: le due firme esistono e differiscono

        const idxA = getIRIndex(projectA, sigA, 'Pointer_ViewPointDataManager')!;
        const idxB = getIRIndex(projectB, sigB, 'Pointer_ViewPointDataManager')!;
        expect(idxA.byMetaclass.has('Person')).toBe(true);
        expect(idxB.byMetaclass.has('Order')).toBe(true);
        expect(idxB.byMetaclass.has('Person')).toBe(false);   // B non serve l'indice di A
    });
});
