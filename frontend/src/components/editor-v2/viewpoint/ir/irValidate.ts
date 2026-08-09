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
import type { AnyViewIR, EdgeViewIR, RowViewIR } from './irTypes';

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

export function validateIR(viewId: string, ir: AnyViewIR): { ok: true } | { ok: false; error: string } {
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
