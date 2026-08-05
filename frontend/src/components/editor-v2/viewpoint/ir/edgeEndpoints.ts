/**
 * edgeEndpoints — the decision logic of the edge-view endpoint pair, in one place.
 *
 * Extracted verbatim out of EdgeAuthoringPanel.tsx (slice 2.1): the panel held the
 * whole object-as-edge decision inline, and the unit test could not import it
 * (joiner -> monaco -> `window` undefined), so the test carried hand-written
 * MIRRORS of the same predicates instead. A mirror asserts that the copy behaves
 * as expected, never that the shipped code does: `49c32c134` changed the panel's
 * endpoint semantics with the mirrors left describing the old ones, and the suite
 * stayed green. This module exists so the branches are importable.
 *
 * The behaviour is unchanged. Every function here was either a module-local
 * function of the panel (`natureOf`, `isUsableEndpointExpr`) or logic inlined in
 * `applyEndpoints` / `changeNature` / the render guard, moved with its semantics
 * and its comments intact.
 *
 * Pure by contract, like ir/pathExpr.ts: no React, no Redux, no runtime import
 * from editor-v2. The only dependency is the EdgeViewIR type, erased at build.
 */

import type { EdgeViewIR } from './irTypes';

/**
 * Which substrate the edge view describes. UI state only: the IR has NO nature
 * field and none is introduced here — a view IS object-as-edge exactly when both
 * endpoint PathExprs are present (`isObjectAsEdge` in irCompile), so the nature is
 * always re-derived from the data, never persisted.
 */
export type EdgeNature = 'reference' | 'object';

/** Nature of an ir, derived (never read from a field). */
export function natureOf(ir: EdgeViewIR | undefined): EdgeNature {
    return ir?.edge?.source && ir?.edge?.target ? 'object' : 'reference';
}

/**
 * An endpoint PathExpr is usable when it is non-empty and does not read a whole
 * array: the endpoint normalization in irEdgeViews rejects arrays, so `$ref.values`
 * would compile, resolve to nothing, and leave the object rendered as a node with no
 * diagnostic at all. The indexed form `$ref.values[0]` is fine.
 */
export function isUsableEndpointExpr(expr: string | undefined): boolean {
    if (!expr) return false;
    return !/\.values$/.test(expr);
}

/**
 * The `edge` the panel must commit for a typed endpoint pair, or `null` when the
 * ir does not move (no patch, no commit, no recompile).
 *
 * `null` covers the two cases the panel must not write: the typed pair is not
 * usable, or it is identical to the committed one. It never returns an edge
 * carrying a single endpoint, and it never REMOVES one — emptying an endpoint
 * leaves a committed pair alone.
 *
 * That last property is the semantics `49c32c134` introduced. A draft carrying a
 * single endpoint compiles to isObjectAsEdge=false, i.e. a live reference-as-edge
 * view whose PathExpr is inert and unreported: a state the UI must never produce.
 * Emptying one endpoint used to drop BOTH keys, which silently discarded the other
 * (valid) endpoint and flipped a working object-as-edge back to a live
 * reference-as-edge view — a notation change nobody asked for (discovery
 * 2026-08-05 §2.4). Leaving object-as-edge is now only `dropEndpoints`, reached
 * exclusively from the explicit nature switch.
 *
 * The write itself stays atomic: both keys are replaced together.
 */
export function nextEdgeForEndpoints(
    edge: EdgeViewIR['edge'],
    nextSource: string,
    nextTarget: string,
): EdgeViewIR['edge'] | null {
    if (!isUsableEndpointExpr(nextSource) || !isUsableEndpointExpr(nextTarget)) return null;
    const next = { ...edge };
    next.source = nextSource;
    next.target = nextTarget;
    if (next.source === edge.source && next.target === edge.target) return null;
    return next;
}

/** Whether the ir carries either endpoint — the guard the nature switch drops on. */
export function hasAnyEndpoint(edge: EdgeViewIR['edge']): boolean {
    return edge.source !== undefined || edge.target !== undefined;
}

/**
 * Both endpoints dropped together — the ir-facing half of `changeNature('reference')`,
 * the only gesture that leaves object-as-edge. Keys are deleted, never emptied: the
 * result must be byte-identical to a view authored without endpoints.
 */
export function dropEndpoints(edge: EdgeViewIR['edge']): EdgeViewIR['edge'] {
    const next = { ...edge };
    delete next.source;
    delete next.target;
    return next;
}

/**
 * How the typed endpoint pair relates to the one the draft carries.
 *
 * Every field is computed from the DRAFT, which is what the panel holds between
 * two debounced commits. None of them says anything about what is persisted.
 */
export interface EndpointDraftState {
    /** Both typed expressions are present and usable — the pair would commit. */
    typedPairUsable: boolean;
    /** The draft already carries a complete pair. NOT a claim about persistence. */
    hasCommittedPair: boolean;
    /**
     * The form and the draft disagree, deliberately, and it must be shown: the
     * typed pair is not usable but a complete pair is still driving the canvas.
     * Without a message this would trade a silent loss for a silent state.
     */
    diverges: boolean;
}

export function endpointDraftState(
    edge: EdgeViewIR['edge'] | undefined,
    sourceExpr: string,
    targetExpr: string,
): EndpointDraftState {
    const typedPairUsable = isUsableEndpointExpr(sourceExpr) && isUsableEndpointExpr(targetExpr);
    const hasCommittedPair = !!(edge?.source && edge?.target);
    return {
        typedPairUsable,
        hasCommittedPair,
        diverges: !typedPairUsable && hasCommittedPair,
    };
}
