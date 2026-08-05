/**
 * Unit tests for ir/edgeEndpoints — the endpoint-pair decision logic of the edge
 * authoring panel.
 *
 * These assert the SHIPPED functions, which is the whole point of the module:
 * before the extraction the same branches were covered by literal mirrors living
 * in edgeAuthoring.test.ts, because EdgeAuthoringPanel is not import-safe in the
 * node vitest env (joiner -> monaco -> `window` undefined). A mirror cannot catch
 * a change in the code it mirrors, and `49c32c134` proved it: the panel's endpoint
 * semantics changed, the mirrors kept describing the old ones, the suite stayed
 * green. Nothing here is mirrored.
 */
import { describe, it, expect } from 'vitest';
import {
    natureOf,
    isUsableEndpointExpr,
    nextEdgeForEndpoints,
    hasAnyEndpoint,
    dropEndpoints,
    endpointDraftState,
} from '../edgeEndpoints';
import { defaultEdgeViewIR } from '../irDefaults';
import type { EdgeViewIR } from '../irTypes';

/** A committed pair, as the panel's draft carries it. */
const PAIR: EdgeViewIR['edge'] = { source: '$src.value', target: '$tgt.value' };
/** No endpoints at all — a fresh edge view. */
const EMPTY: EdgeViewIR['edge'] = {};

describe('natureOf — the pair is the only discriminant', () => {
    it('both endpoints present is object', () => {
        expect(natureOf({ ...defaultEdgeViewIR(), edge: PAIR })).toBe('object');
    });

    it('a single endpoint is reference, in either position', () => {
        expect(natureOf({ ...defaultEdgeViewIR(), edge: { source: '$src.value' } })).toBe('reference');
        expect(natureOf({ ...defaultEdgeViewIR(), edge: { target: '$tgt.value' } })).toBe('reference');
    });

    it('no endpoints, no edge, no ir at all are all reference', () => {
        expect(natureOf(defaultEdgeViewIR())).toBe('reference');
        expect(natureOf({} as EdgeViewIR)).toBe('reference');
        expect(natureOf(undefined)).toBe('reference');
    });
});

describe('isUsableEndpointExpr — the endpoint guard', () => {
    it('accepts .value and values[N], refuses a whole array', () => {
        expect(isUsableEndpointExpr('$src.value')).toBe(true);
        expect(isUsableEndpointExpr('$src.values[0]')).toBe(true);
        expect(isUsableEndpointExpr('$src.values[12]')).toBe(true);
        expect(isUsableEndpointExpr('$src.values')).toBe(false);
        expect(isUsableEndpointExpr('')).toBe(false);
        expect(isUsableEndpointExpr(undefined)).toBe(false);
    });
});

describe('nextEdgeForEndpoints — the ir moves only for a complete, new, usable pair', () => {
    it('a complete new pair is written, both keys together', () => {
        const next = nextEdgeForEndpoints(EMPTY, '$from.value', '$to.values[0]')!;
        expect(next).not.toBe(null);
        expect(next.source).toBe('$from.value');
        expect(next.target).toBe('$to.values[0]');
    });

    it('fields the panel does not author survive the replacement', () => {
        const edge: EdgeViewIR['edge'] = { ...PAIR, routing: 'orthogonal', persistWaypoints: false };
        const next = nextEdgeForEndpoints(edge, '$from.value', '$to.value')!;
        expect(next.routing).toBe('orthogonal');
        expect(next.persistWaypoints).toBe(false);
    });

    it('retyping the same pair does not move the ir', () => {
        expect(nextEdgeForEndpoints(PAIR, '$src.value', '$tgt.value')).toBe(null);
    });

    it('an unusable expression does not move the ir, in either position', () => {
        expect(nextEdgeForEndpoints(PAIR, '$src.values', '$tgt.value')).toBe(null);
        expect(nextEdgeForEndpoints(PAIR, '$src.value', '$tgt.values')).toBe(null);
    });

    // The branch the mirrors never asserted, and the one 49c32c134 changed.
    it('an incomplete input leaves a committed pair INTACT — no drop', () => {
        expect(nextEdgeForEndpoints(PAIR, '', '$tgt.value')).toBe(null);
        expect(nextEdgeForEndpoints(PAIR, '$src.value', '')).toBe(null);
        // null means "do not patch": the caller never touches the edge, so the
        // committed pair is still there, byte-identical.
        expect(PAIR).toEqual({ source: '$src.value', target: '$tgt.value' });
    });

    it('with no committed pair an incomplete input still writes nothing', () => {
        expect(nextEdgeForEndpoints(EMPTY, '$src.value', '')).toBe(null);
        expect(nextEdgeForEndpoints(EMPTY, '', '$tgt.value')).toBe(null);
        expect(EMPTY).toEqual({});
    });

    it('never returns an edge carrying a single endpoint', () => {
        const inputs: Array<[string, string]> = [
            ['$a.value', ''], ['', '$b.value'], ['', ''],
            ['$a.values', '$b.value'], ['$a.value', '$b.values'],
        ];
        for (const [s, t] of inputs) {
            const next = nextEdgeForEndpoints(PAIR, s, t);
            if (next === null) continue;
            // Unreachable by construction; asserted so a future relaxation trips here.
            expect('source' in next && 'target' in next).toBe(true);
        }
    });
});

describe('hasAnyEndpoint / dropEndpoints — the explicit exit from object-as-edge', () => {
    it('hasAnyEndpoint sees a complete pair, a half pair, and nothing', () => {
        expect(hasAnyEndpoint(PAIR)).toBe(true);
        expect(hasAnyEndpoint({ source: '$src.value' })).toBe(true);
        expect(hasAnyEndpoint({ target: '$tgt.value' })).toBe(true);
        expect(hasAnyEndpoint(EMPTY)).toBe(false);
    });

    it('dropEndpoints removes BOTH keys, never empties them', () => {
        const dropped = dropEndpoints(PAIR);
        expect('source' in dropped).toBe(false);
        expect('target' in dropped).toBe(false);
    });

    it('dropEndpoints leaves the input untouched and keeps the other fields', () => {
        const edge: EdgeViewIR['edge'] = { ...PAIR, routing: 'orthogonal' };
        const dropped = dropEndpoints(edge);
        expect(dropped.routing).toBe('orthogonal');
        expect(edge.source).toBe('$src.value');
    });
});

describe('endpointDraftState — how the form relates to the draft', () => {
    it('caso A: a committed pair with one endpoint emptied diverges', () => {
        const s = endpointDraftState(PAIR, '', '$tgt.value');
        expect(s.hasCommittedPair).toBe(true);
        expect(s.typedPairUsable).toBe(false);
        expect(s.diverges).toBe(true);
    });

    it('caso A also covers an unusable endpoint, not only an empty one', () => {
        expect(endpointDraftState(PAIR, '$src.values', '$tgt.value').diverges).toBe(true);
    });

    it('caso B: no committed pair and one endpoint typed does NOT diverge', () => {
        // Nothing to diverge from. The state is unsaved work, reported separately.
        const s = endpointDraftState(EMPTY, '$src.value', '');
        expect(s.hasCommittedPair).toBe(false);
        expect(s.typedPairUsable).toBe(false);
        expect(s.diverges).toBe(false);
    });

    it('both endpoints usable: neither condition holds', () => {
        const s = endpointDraftState(PAIR, '$src.value', '$tgt.value');
        expect(s.typedPairUsable).toBe(true);
        expect(s.diverges).toBe(false);
    });

    it('after the nature switch to reference the exit is clean', () => {
        // changeNature('reference') empties both expressions AND drops both keys.
        const s = endpointDraftState(dropEndpoints(PAIR), '', '');
        expect(s.hasCommittedPair).toBe(false);
        expect(s.typedPairUsable).toBe(false);
        expect(s.diverges).toBe(false);
    });

    it('an empty edge with nothing typed is quiet', () => {
        const s = endpointDraftState(EMPTY, '', '');
        expect(s.diverges).toBe(false);
        expect(s.hasCommittedPair).toBe(false);
    });

    it('tolerates an ir with no edge at all', () => {
        expect(endpointDraftState(undefined, '', '').hasCommittedPair).toBe(false);
    });

    /**
     * C-3 as a property. `hasCommittedPair` is computed from the edge it is HANDED,
     * which at call site is the panel's draft — the object that lives between two
     * debounced commits. It is therefore true for a pair that has never been written
     * back to the view, and no message derived from it may claim the pair is saved.
     */
    it('hasCommittedPair is a property of the draft, not evidence of persistence', () => {
        const neverPersisted: EdgeViewIR['edge'] = { source: '$a.value', target: '$b.value' };
        expect(endpointDraftState(neverPersisted, '', '').hasCommittedPair).toBe(true);
        // The function takes no view, no id, no store: it cannot know what is persisted.
        expect(endpointDraftState.length).toBe(3);
    });
});
