import { describe, it, expect } from 'vitest';
import {
    classifyRefEdgeReconcile,
    isM2ReferenceEdge,
    type RefEdgeSnapshot,
} from '../refEdgeReconcile';

// Snapshot factory for readability.
const snap = (edgeId: string, endVertexId: string, endClassId: string | undefined): RefEdgeSnapshot =>
    ({ edgeId, endVertexId, endClassId });

// ---------------------------------------------------------------------------
// classifyRefEdgeReconcile — branch decisions (T1-T5, T8 + defensive)
// ---------------------------------------------------------------------------
//
// Atomicity note (Precisazione 2):
//   The 3-write retarget + N-delete grouping is enforced by a TRANSACTION
//   in the orchestrator (useJjomSync Step 3). It is NOT testable at the
//   pure-helper level (this module returns a *decision*, not dispatches).
//   The atomicity guarantee is verified by the §4.6 smoke test (single
//   COMMIT, no transient state visible to the classic editor's
//   relationships panel between the end / edgesIn-/+= writes).
//
describe('classifyRefEdgeReconcile — Step 3 reconcile-or-create decision', () => {
    // T1 — Branch 0: empty existing → create (the existing DVoidEdge.new2 path)
    it('T1 — no existing edge for refId → action: create', () => {
        const d = classifyRefEdgeReconcile([], 'Class_target');
        expect(d).toEqual({ action: 'create' });
    });

    // T2 — Branch 1 "nothing": one coherent edge, no extras → no dispatch (T8 idempotence at the unit level)
    it('T2 — one existing edge, end already coherent → action: nothing (0 dispatch)', () => {
        const d = classifyRefEdgeReconcile(
            [snap('E0', 'V_T', 'Class_target')],
            'Class_target',
        );
        expect(d).toEqual({ action: 'nothing' });
    });

    // T3 — Branch 1 retarget: one stale edge, keep id preserved
    it('T3 — one existing stale edge → reconcile + retargetNeeded, no extras, id preserved', () => {
        const d = classifyRefEdgeReconcile(
            [snap('E0', 'V_oldT', 'Class_old')],
            'Class_target',
        );
        expect(d).toEqual({
            action: 'reconcile',
            keepEdgeId: 'E0',
            retargetNeeded: true,
            oldEndVertexId: 'V_oldT',
            deleteEdgeIds: [],
        });
    });

    // T4a — Precisazione 1 scenario (a): coherent at index 0, stale follows.
    //   Both find-first and the existing[0] fallback would pick the coherent one;
    //   the no-retarget path collapses the duplicate to a single coherent edge.
    it('T4a — [coherent, stale]: keep coherent (no retarget), delete stale', () => {
        const d = classifyRefEdgeReconcile(
            [snap('E_coh', 'V_T', 'Class_target'), snap('E_stale', 'V_oldT', 'Class_old')],
            'Class_target',
        );
        expect(d).toEqual({
            action: 'reconcile',
            keepEdgeId: 'E_coh',
            retargetNeeded: false,
            oldEndVertexId: 'V_T',
            deleteEdgeIds: ['E_stale'],
        });
    });

    // T4b — Precisazione 1 scenario (b): stale at index 0, coherent later.
    //   The prefer-coherent rule overrides the index-0 fallback, preserving the
    //   coherent edge's anchors/waypoints even when an orphan sits at the head
    //   of subElements (this is the historical-accumulation case).
    it('T4b — [stale, coherent]: prefer-coherent overrides index-0 fallback', () => {
        const d = classifyRefEdgeReconcile(
            [snap('E_stale', 'V_oldT', 'Class_old'), snap('E_coh', 'V_T', 'Class_target')],
            'Class_target',
        );
        expect(d).toEqual({
            action: 'reconcile',
            keepEdgeId: 'E_coh',
            retargetNeeded: false,
            oldEndVertexId: 'V_T',
            deleteEdgeIds: ['E_stale'],
        });
    });

    // T5 — three existing with one coherent in the middle: keep coherent, delete others
    it('T5 — three existing with one coherent in the middle: keep coherent, delete other two', () => {
        const d = classifyRefEdgeReconcile(
            [
                snap('E_stale1', 'V_oldT1', 'Class_old1'),
                snap('E_coh',    'V_T',     'Class_target'),
                snap('E_stale2', 'V_oldT2', 'Class_old2'),
            ],
            'Class_target',
        );
        expect(d).toEqual({
            action: 'reconcile',
            keepEdgeId: 'E_coh',
            retargetNeeded: false,
            oldEndVertexId: 'V_T',
            deleteEdgeIds: ['E_stale1', 'E_stale2'],
        });
    });

    // T5b — three stale, none coherent: fallback to existing[0], retarget it, delete the rest
    it('T5b — three existing, none coherent: fallback existing[0], retarget+delete extras', () => {
        const d = classifyRefEdgeReconcile(
            [
                snap('E0', 'V_old0', 'Class_old0'),
                snap('E1', 'V_old1', 'Class_old1'),
                snap('E2', 'V_old2', 'Class_old2'),
            ],
            'Class_target',
        );
        expect(d).toEqual({
            action: 'reconcile',
            keepEdgeId: 'E0',
            retargetNeeded: true,
            oldEndVertexId: 'V_old0',
            deleteEdgeIds: ['E1', 'E2'],
        });
    });

    // T8 — idempotence sweep (helper-level proxy for the effect-level
    //   "0 action dispatch on a coherent model" guarantee). Distinct coherent
    //   inputs all return 'nothing'; combined with the auto-populate's
    //   missingEdgeCount early-exit at useJjomSync.ts:523-525, the effect
    //   stays at 0 dispatch when nothing has changed.
    it('T8 — multiple coherent inputs all return action: nothing', () => {
        const cases: ReadonlyArray<[RefEdgeSnapshot[], string]> = [
            [[snap('E', 'V', 'TargetA')], 'TargetA'],
            [[snap('E', 'Vx', 'TargetB')], 'TargetB'],
            [[snap('E', 'Vy', 'TargetC')], 'TargetC'],
        ];
        for (const [existing, target] of cases) {
            expect(classifyRefEdgeReconcile(existing, target)).toEqual({ action: 'nothing' });
        }
    });

    // Defensive: a snapshot with undefined endClassId (idlookup gap) is never
    // coherent — caller will retarget it as a safety net rather than treating
    // it as already correct.
    it('defensive: snapshot with undefined endClassId is never treated as coherent', () => {
        const d = classifyRefEdgeReconcile(
            [snap('E0', 'V_unknown', undefined)],
            'Class_target',
        );
        expect(d).toEqual({
            action: 'reconcile',
            keepEdgeId: 'E0',
            retargetNeeded: true,
            oldEndVertexId: 'V_unknown',
            deleteEdgeIds: [],
        });
    });
});

// ---------------------------------------------------------------------------
// isM2ReferenceEdge — collection filter (T6, T7 + defensive)
// ---------------------------------------------------------------------------

describe('isM2ReferenceEdge — collection filter (M2 reference edges only)', () => {
    // Base idlookup fixture: two M2 classes (A, B), one M1 object (x),
    // one DReference (A→B), and three vertices: two over DClasses (M2)
    // and one over a DObject (M1).
    const idl = (over?: Record<string, unknown>) => ({
        'class_A':  { className: 'DClass' },
        'class_B':  { className: 'DClass' },
        'object_x': { className: 'DObject' },
        'ref_AB':   { className: 'DReference', type: 'class_B' },
        'V_M2_a':   { className: 'DVertex', model: 'class_A' },
        'V_M2_b':   { className: 'DVertex', model: 'class_B' },
        'V_M1':     { className: 'DVertex', model: 'object_x' },
        ...over,
    });

    it('M2 reference edge (both endpoints over DClass): true', () => {
        const lookup = idl();
        const edge = { className: 'DVoidEdge', model: 'ref_AB', start: 'V_M2_a', end: 'V_M2_b' };
        expect(isM2ReferenceEdge(edge, lookup)).toBe(true);
    });

    // T6 — M1 instance edge: start vertex.model is a DObject → excluded.
    //   Distinguishes Step 3 (M2) territory from Step 4 / useM1ReferenceEdges (M1).
    it('T6 — M1 instance edge (start vertex.model → DObject): false (Step 4 territory)', () => {
        const lookup = idl();
        const edge = { className: 'DVoidEdge', model: 'ref_AB', start: 'V_M1', end: 'V_M2_b' };
        expect(isM2ReferenceEdge(edge, lookup)).toBe(false);
    });

    // T7a — inheritance edge: model is undefined (uses isExtend, not a back-ref). Excluded.
    it('T7a — inheritance edge with undefined model: false', () => {
        const lookup = idl();
        const edge = { className: 'DVoidEdge', model: undefined, start: 'V_M2_a', end: 'V_M2_b' };
        expect(isM2ReferenceEdge(edge, lookup)).toBe(false);
    });

    // T7b — edge whose model resolves to a non-DReference (e.g. DPackage): excluded.
    it('T7b — edge whose model is not a DReference: false', () => {
        const lookup = idl({ 'class_pkg': { className: 'DPackage' } });
        const edge = { className: 'DVoidEdge', model: 'class_pkg', start: 'V_M2_a', end: 'V_M2_b' };
        expect(isM2ReferenceEdge(edge, lookup)).toBe(false);
    });

    // Defensive: vertices are not edges → excluded by className check.
    it('defensive: a Vertex subElement: false', () => {
        const lookup = idl();
        const vertex = { className: 'DVertex', model: 'class_A' };
        expect(isM2ReferenceEdge(vertex, lookup)).toBe(false);
    });

    // Defensive: malformed edges without start/end → excluded.
    it('defensive: edge missing start: false', () => {
        const lookup = idl();
        const edge = { className: 'DVoidEdge', model: 'ref_AB', start: undefined, end: 'V_M2_b' };
        expect(isM2ReferenceEdge(edge, lookup)).toBe(false);
    });

    // Defensive: start vertex absent from idlookup (race / corrupted state) → excluded.
    it('defensive: start vertex absent from idlookup: false', () => {
        const lookup = idl();
        const edge = { className: 'DVoidEdge', model: 'ref_AB', start: 'V_missing', end: 'V_M2_b' };
        expect(isM2ReferenceEdge(edge, lookup)).toBe(false);
    });

    // Defensive: null/undefined input → excluded.
    it('defensive: null and undefined edge inputs: false', () => {
        const lookup = idl();
        expect(isM2ReferenceEdge(null, lookup)).toBe(false);
        expect(isM2ReferenceEdge(undefined, lookup)).toBe(false);
    });
});
