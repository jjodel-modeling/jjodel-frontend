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

import { compileView, compileEdgeView } from './irCompile';
import type { AnyViewIR, EdgeViewIR } from './irTypes';

export function validateIR(viewId: string, ir: AnyViewIR): { ok: true } | { ok: false; error: string } {
    try {
        if (ir.kind === 'edge') compileEdgeView(viewId, ir as EdgeViewIR);
        else compileView(viewId, ir);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
}
