/**
 * irValidate — validate a ViewpointIR before it is written to lview.ir.
 *
 * The IR interpreter skips a malformed view silently (irResolveCore.ts try/catch
 * -> console.warn -> continue), so a persisted bad IR breaks invisibly. The
 * authoring surface must therefore gate the write. This wrapper drives the same
 * structural validator the render uses (compileView / compileEdgeView), which
 * throws on invalid PathExprs / predicates. compileView caches by
 * (viewId, irHash), so validating pre-warms the cache and the render-time compile
 * is a cache hit.
 */

import { compileView, compileEdgeView, compileRowView } from './irCompile';
import { CONTAINER_ENDPOINT } from './irTypes';
import { isUsableEndpointExpr } from './edgeEndpoints';
import type { AnyViewIR, EdgeViewIR, Predicate, RowViewIR } from './irTypes';

/**
 * Closed vocabulary of `edge.routing` (R-B9, 2026-08-03): the persisted identifiers,
 * never renamed, because saved edge views have no VersionFixer. Typed against the IR
 * union so a value outside it fails to compile here rather than at the call site.
 *
 * The ABSENT key is deliberately not in the list: absence is the 'orthogonal' default
 * (irTypes.ts:227) and the shape the authoring panel writes, which drops the key
 * instead of writing a value. Only a PRESENT out-of-vocabulary value is an error.
 */
export const VALID_ROUTING_VALUES: ReadonlyArray<NonNullable<EdgeViewIR['edge']['routing']>> =
    ['orthogonal', 'straight', 'curved'];

/**
 * Closed vocabulary of `Predicate.op` (R-MK-11, 2026-08-18).
 *
 * A Record keyed on the union, not a list: TypeScript then requires every branch
 * of `Predicate` to appear here, so an operator added to the schema without being
 * added to this vocabulary fails to compile instead of being rejected as unknown
 * by a validator the compiler already supports.
 */
export const VALID_PREDICATE_OPS: Record<Predicate['op'], true> = {
    and: true, or: true, not: true,
    eq: true, neq: true, lt: true, lte: true, gt: true, gte: true,
    exists: true, empty: true, isKind: true, marked: true, literal: true,
};

/**
 * The first predicate operator outside the vocabulary, or null.
 *
 * Generic over the ir's JSON rather than a walk targeted per field: `op` is a key
 * of `Predicate` and of nothing else in the schema (measured on irTypes.ts — the
 * seven occurrences of the key are the seven branches of the union), so every
 * object carrying a string `op` IS a predicate wherever it sits: the view's own
 * `predicate`, the `when` of any Conditional (fill, form, marker, visible,
 * line.*, each TextStyle axis), the args of and/or/not at any depth, a
 * fieldCompartment `children` filter, a graphVertex `containment.childFilter`. A
 * targeted walk would have to enumerate all of them, and would silently miss the
 * next Conditional the schema grows.
 *
 * `seen` is not decoration: this scan runs BEFORE the compile-as-validator, and a
 * hand-built cyclic object — which today fails gracefully inside that try/catch —
 * would otherwise recurse until the stack gives out.
 *
 * A non-string `op` is deliberately out of scope: it stays what it is today, an
 * error surfaced by the compile.
 */
function findUnknownPredicateOp(node: unknown, seen: Set<object>): string | null {
    if (!node || typeof node !== 'object') return null;
    if (seen.has(node)) return null;
    seen.add(node);
    if (Array.isArray(node)) {
        for (const item of node) {
            const bad = findUnknownPredicateOp(item, seen);
            if (bad !== null) return bad;
        }
        return null;
    }
    const op = (node as { op?: unknown }).op;
    if (typeof op === 'string' && !Object.prototype.hasOwnProperty.call(VALID_PREDICATE_OPS, op)) return op;
    for (const value of Object.values(node as Record<string, unknown>)) {
        const bad = findUnknownPredicateOp(value, seen);
        if (bad !== null) return bad;
    }
    return null;
}

export function validateIR(viewId: string, ir: AnyViewIR): { ok: true } | { ok: false; error: string } {
    // Predicate operator vocabulary (R-MK-11): the second authoring-time rule after
    // the endpoint one, by the same R-B9-bis criterion, and the only one that is not
    // edge-specific. Without it an operator outside the union falls into
    // compilePredicate's `default` branch, which compiles `left`/`right` that are not
    // there and throws a bare TypeError ("Cannot read properties of undefined
    // (reading 'split')"): at render the WHOLE view leaves the index with a console
    // warning, and in authoring the panel stops committing anything at all, because
    // the commit is gated on this function. Run BEFORE the compile-as-validator, so
    // for this class of error the author reads the operator name instead.
    const unknownOp = findUnknownPredicateOp(ir, new Set<object>());
    if (unknownOp !== null) {
        return {
            ok: false,
            error: `[ir] unknown predicate operator "${unknownOp}" in view ${viewId} — must be one of ${Object.keys(VALID_PREDICATE_OPS).join(' | ')}`,
        };
    }

    // Read as unknown on purpose: the values this rule exists to catch (the empty
    // string of a Select placeholder, an AI provider's guess, a direct store edit)
    // are outside the declared union, so the compiler's view of the field is not
    // the runtime's. Checked before the compile, which passes routing through.
    if (ir.kind === 'edge') {
        const routing: unknown = (ir as EdgeViewIR).edge?.routing;
        if (routing !== undefined && !(VALID_ROUTING_VALUES as readonly unknown[]).includes(routing)) {
            return {
                ok: false,
                error: `[ir] edge.routing must be one of ${VALID_ROUTING_VALUES.join(' | ')}, or absent for the Manhattan default — read ${JSON.stringify(routing)}`,
            };
        }

        // Endpoint vocabulary (R-B13/R-B15): the FIRST endpoint rule of validateIR,
        // and authoring-time by the R-B9-bis criterion — the render stays permissive
        // towards what is already persisted, the authoring surface applies the
        // vocabulary. Two halves:
        //  - the reserved `container` token is a legal endpoint value. It never
        //    reaches the PathExpr parser (compileEdgeView recognises it first), so
        //    this branch states the rule rather than enabling it;
        //  - an endpoint that reads a WHOLE array is rejected. That rule already
        //    existed as `isUsableEndpointExpr`, but only the panel consumed it, so an
        //    ir carrying `source: '$ref.values'` passed validateIR: it compiles,
        //    resolves to nothing, and leaves the object drawn as a node with no
        //    diagnostic. The predicate is IMPORTED, never mirrored — a copy of these
        //    branches is exactly what let panel and tests drift apart once already
        //    (see the module doc of edgeEndpoints.ts).
        // Read as unknown for the same reason as `routing` above. A falsy endpoint is
        // deliberately NOT rejected: everywhere else in the pipeline it means "no
        // endpoint" (compileExpr, natureOf, endpointDraftState all test truthiness),
        // and failing on it would gate every later edit of a view whose endpoint the
        // panel does not even show — the same trap the routing rule avoids by leaving
        // the ABSENT key out of its vocabulary.
        const edge = (ir as EdgeViewIR).edge;
        for (const end of ['source', 'target'] as const) {
            const expr: unknown = edge?.[end];
            if (!expr || expr === CONTAINER_ENDPOINT) continue;
            if (typeof expr !== 'string' || !isUsableEndpointExpr(expr)) {
                return {
                    ok: false,
                    error: `[ir] edge.${end} must be a single-valued PathExpr or the reserved '${CONTAINER_ENDPOINT}' endpoint — an endpoint cannot read the whole array (.values): choose values[N] (for example values[0]) or a single-valued reference. Read ${JSON.stringify(expr)}`,
                };
            }
        }
    }

    try {
        if (ir.kind === 'edge') compileEdgeView(viewId, ir as EdgeViewIR);
        else if (ir.kind === 'row') compileRowView(viewId, ir as RowViewIR);
        else compileView(viewId, ir);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
}
