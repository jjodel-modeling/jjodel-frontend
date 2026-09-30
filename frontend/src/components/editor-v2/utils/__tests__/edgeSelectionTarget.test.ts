import { describe, it, expect } from 'vitest';
import { resolveEdgeSelectionTarget } from '../edgeSelectionTarget';

// Fixtures mirror the raw D-objects measured in
// docs/discovery/discovery_2026-09-30_edge_click_properties.md §2-§3 (demo presets DemoPEST/demoSM and
// DemoFlowB/demoFlowB): a DEdge carries `model` (the DReference, for M1 edges the M2 one), `start` and
// `end` (vertex ids); a DVertex carries `model` (the element it draws); a DObject lists its slots in
// `features`, each DValue names its feature in `instanceof`.
function fixture() {
    return {
        // M2: DemoPEST, Transition -nextState-> State, State -transitions-> Transition, Initial extends State
        cState: { className: 'DClass', name: 'State' },
        cTransition: { className: 'DClass', name: 'Transition' },
        cInitial: { className: 'DClass', name: 'Initial' },
        rNextState: { className: 'DReference', name: 'nextState' },
        rTransitions: { className: 'DReference', name: 'transitions', composition: true },
        aGuard: { className: 'DAttribute', name: 'guard' },
        vState: { className: 'DVertex', model: 'cState' },
        vTransition: { className: 'DVertex', model: 'cTransition' },
        vInitial: { className: 'DVertex', model: 'cInitial' },
        eM2Next: { className: 'DEdge', model: 'rNextState', isReference: true, start: 'vTransition', end: 'vState' },
        eM2Comp: { className: 'DEdge', model: 'rTransitions', isReference: true, start: 'vState', end: 'vTransition' },
        eM2Inh: { className: 'DEdge', isExtend: true, start: 'vInitial', end: 'vState' },
        // M1: demoSM, t1 -nextState-> unlocked, locked -transitions-> t1
        oLocked: { className: 'DObject', name: 'locked', instanceof: 'cInitial', features: ['sLockedTransitions'] },
        oUnlocked: { className: 'DObject', name: 'unlocked', instanceof: 'cState', features: [] },
        // The guard slot comes first on purpose: the match is on `instanceof`, not on position.
        oT1: { className: 'DObject', name: 't1', instanceof: 'cTransition', features: ['sT1Guard', 'sT1NextState'] },
        sLockedTransitions: { className: 'DValue', instanceof: 'rTransitions', values: ['oT1'] },
        sT1Guard: { className: 'DValue', instanceof: 'aGuard', values: [] },
        sT1NextState: { className: 'DValue', instanceof: 'rNextState', values: ['oUnlocked'] },
        vLocked: { className: 'DVertex', model: 'oLocked' },
        vUnlocked: { className: 'DVertex', model: 'oUnlocked' },
        vT1: { className: 'DVertex', model: 'oT1' },
        eM1Next: { className: 'DEdge', model: 'rNextState', isReference: true, start: 'vT1', end: 'vUnlocked' },
        eM1Comp: { className: 'DEdge', model: 'rTransitions', isReference: true, start: 'vLocked', end: 'vT1' },
    } as Record<string, any>;
}

describe('resolveEdgeSelectionTarget — M2 reference edges', () => {
    // Pins the M2 answer: the DEdge's own model, as today.
    it('an M2 reference edge shows its DReference', () => {
        expect(resolveEdgeSelectionTarget('eM2Next', fixture())).toEqual({ modelElementId: 'rNextState' });
    });

    it('an M2 composition edge shows its DReference', () => {
        expect(resolveEdgeSelectionTarget('eM2Comp', fixture())).toEqual({ modelElementId: 'rTransitions' });
    });

    // Kills "the slot lookup runs whatever the source element's class": the class here carries a
    // features list that would match.
    it('a source vertex that draws a class is M2, not a slot lookup', () => {
        const idl = fixture();
        idl.cTransition.features = ['sT1NextState'];
        expect(resolveEdgeSelectionTarget('eM2Next', idl)).toEqual({ modelElementId: 'rNextState' });
    });
});

describe('resolveEdgeSelectionTarget — M1 reference edges show the slot', () => {
    // Kills "M1 edges answer the M2 DReference" (today's behaviour) and "the first slot is taken".
    it('an M1 reference edge shows the DValue of the source object for that reference', () => {
        expect(resolveEdgeSelectionTarget('eM1Next', fixture())).toEqual({ modelElementId: 'sT1NextState' });
    });

    it('an M1 composition edge shows the containment slot of the owner', () => {
        expect(resolveEdgeSelectionTarget('eM1Comp', fixture())).toEqual({ modelElementId: 'sLockedTransitions' });
    });

    // Kills "no slot falls back to the M2 DReference": an unknown shape keeps today's path (null).
    it('an M1 edge whose source object has no slot for the reference resolves to null', () => {
        const idl = fixture();
        idl.oT1.features = ['sT1Guard'];
        expect(resolveEdgeSelectionTarget('eM1Next', idl)).toBeNull();
    });

    // Kills "a dangling slot id matches" (the slot must exist to be compared).
    it('a slot id with no D-object behind it is skipped', () => {
        const idl = fixture();
        idl.oT1.features = ['sMissing', 'sT1NextState'];
        expect(resolveEdgeSelectionTarget('eM1Next', idl)).toEqual({ modelElementId: 'sT1NextState' });
    });

    it('features that are not an array resolve to null', () => {
        const idl = fixture();
        idl.oT1.features = undefined;
        expect(resolveEdgeSelectionTarget('eM1Next', idl)).toBeNull();
    });
});

describe('resolveEdgeSelectionTarget — object-as-edge', () => {
    // Kills "the irobj_ branch is dropped" and "the prefix is sliced with the wrong length".
    it('irobj_<objectId> shows the object', () => {
        expect(resolveEdgeSelectionTarget('irobj_oT1', fixture())).toEqual({ modelElementId: 'oT1' });
    });

    it('irobj_ of an id with no D-object resolves to null', () => {
        expect(resolveEdgeSelectionTarget('irobj_oGone', fixture())).toBeNull();
    });

    // Kills "any D-object behind the suffix is accepted": the synthesis draws M1 objects only
    // (irContainment.ts:206), so a class id there is not an object-as-edge.
    it('irobj_ of a non-object id resolves to null', () => {
        expect(resolveEdgeSelectionTarget('irobj_cState', fixture())).toBeNull();
    });
});

describe('resolveEdgeSelectionTarget — kinds it does not know keep today\'s path (null)', () => {
    it('an inheritance edge (no model) resolves to null', () => {
        expect(resolveEdgeSelectionTarget('eM2Inh', fixture())).toBeNull();
    });

    // Kills "the DReference check is dropped": an edge whose model is not a DReference is not a reference.
    it('an edge whose model is not a DReference resolves to null', () => {
        const idl = fixture();
        idl.eM2Next.model = 'cState';
        expect(resolveEdgeSelectionTarget('eM2Next', idl)).toBeNull();
    });

    it('an edge whose model points nowhere resolves to null', () => {
        const idl = fixture();
        idl.eM2Next.model = 'rGone';
        expect(resolveEdgeSelectionTarget('eM2Next', idl)).toBeNull();
    });

    // An IR-lifted edge (irContainment.ts:318) and an unknown id have no D-object behind them.
    it('a lifted id and an unknown id resolve to null', () => {
        expect(resolveEdgeSelectionTarget('eM1Next__irlift', fixture())).toBeNull();
        expect(resolveEdgeSelectionTarget('nope', fixture())).toBeNull();
        expect(resolveEdgeSelectionTarget('', fixture())).toBeNull();
    });
});
