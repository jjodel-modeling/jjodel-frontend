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

import { compileView, compileEdgeView, compileRowView, LABEL_ANCHORS, TEXT_TRANSFORMS } from './irCompile';
import { CONTAINER_ENDPOINT } from './irTypes';
import { isUsableEndpointExpr } from './edgeEndpoints';
import { authoredCornerRadius } from './shapeRegistry';
import { usableSizeAxis } from '../../nodes/nodeSizing';
import { isConditionalValue } from '../../../ui/ConditionalEditor/conditional';
import type { AnyViewIR, EdgeCurve, EdgeTermination, EdgeViewIR, EntryMark, LabelPosition, NodeViewIR, PaddingToken, Predicate, RowViewIR, TextSource, VertexViewIR } from './irTypes';

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
 * Closed vocabulary of `shape.padding` (2026-08-25), same shape and same reasoning as
 * VALID_ROUTING_VALUES: the persisted identifiers of a spacing preset, typed against the
 * IR so a value outside the union fails to compile here rather than at the call site.
 *
 * The ABSENT key is deliberately not in the list: absence is the 'normal' default the
 * compile materializes, and the shape the authoring panel writes (it drops the key
 * instead of writing 'normal'). Only a PRESENT out-of-vocabulary value is an error.
 */
export const VALID_PADDING_VALUES: ReadonlyArray<PaddingToken> = ['small', 'normal', 'large'];

/** Closed vocabulary of `shape.entry` (R-VP-22), same shape and reasoning as VALID_PADDING_VALUES; absent = no mark. */
export const VALID_ENTRY_VALUES: ReadonlyArray<EntryMark> = ['dot', 'arrow'];

/** Closed vocabulary of `edge.curve` (R-VP-22), same shape and reasoning as VALID_ROUTING_VALUES; absent = the routing path. */
export const VALID_CURVE_VALUES: ReadonlyArray<EdgeCurve> = ['arc'];

/**
 * Closed vocabulary of `edge.terminations` (P-2026-09-30-1521, R-VP-24): the persisted ends, `hollowCircle`
 * among them. A Record keyed on the union, as VALID_PREDICATE_OPS below: an end added to the type without
 * being added here fails to compile. Authoring-time only (R-B9-bis): the render stays permissive, an unknown
 * end draws no marker (UnifiedEdge `irMarkerUrl`). An absent end is legal: the compile's default applies.
 */
export const VALID_TERMINATIONS: Record<EdgeTermination, true> = {
    none: true, openArrow: true, closedArrow: true, hollowTriangle: true, filledDiamond: true, hollowDiamond: true, hollowCircle: true,
};

/**
 * Closed vocabulary of `LabelSpec.position` (P-2026-09-29-1245): the four inside positions and
 * `outside` (R-VP-15 (1)). A Record keyed on the union, for the reason given below for the
 * predicate operators. The anchor of an `outside` label has its own vocabulary, LABEL_ANCHORS,
 * next to the compile that resolves it.
 */
export const VALID_LABEL_POSITIONS: Record<LabelPosition, true> = {
    top: true, center: true, inside: true, bottom: true, outside: true,
};

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

/** Closed vocabulary of `TextSource.from`, for the segments of an edge label template (R-VP-20). */
const TEXT_SOURCE_KINDS: Record<TextSource['from'], true> = { path: true, literal: true, intrinsic: true };

const isPlainObject = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const readOf = (v: unknown) => (typeof v === 'number' ? String(v) : JSON.stringify(v));

/**
 * The two axes R-VP-20 adds to TextStyle, on any TextStyle surface. Only these are read: the axes
 * TextStyle already had keep being checked by the compile alone, as before, so a view that
 * validated before C2 validates now. A surface that is not an object is left to its own rule.
 */
function textStyleAxesError(style: unknown, where: string): string | null {
    if (!isPlainObject(style)) return null;
    const ls = style.letterSpacing;
    if (ls !== undefined && !(typeof ls === 'number' && Number.isFinite(ls))) {
        return `[ir] ${where}.letterSpacing must be a finite number (em), or absent for the surface's spacing, read ${readOf(ls)}`;
    }
    const tt = style.textTransform;
    if (tt !== undefined && (typeof tt !== 'string' || !Object.prototype.hasOwnProperty.call(TEXT_TRANSFORMS, tt))) {
        return `[ir] ${where}.textTransform must be one of ${Object.keys(TEXT_TRANSFORMS).join(' | ')}, or absent for the surface's case, read ${readOf(tt)}`;
    }
    return null;
}

/** A key R-VP-20 adds whose value is a TextStyle (a literal segment's, an edge label's): an object when present. */
function textStyleKeyError(style: unknown, where: string): string | null {
    if (style === undefined) return null;
    if (!isPlainObject(style)) return `[ir] ${where} must be a TextStyle object, or absent, read ${readOf(style)}`;
    return textStyleAxesError(style, where);
}

/**
 * The C2 keys (R-VP-20, P-2026-09-30-0150), authoring-time by the R-B9-bis criterion: the render
 * reads a value outside the vocabulary as absent (irCompile resolveTextStyle, compileLabelText), the
 * authoring surface refuses it here. Read as unknown for the reason given at `routing` below.
 */
function c2KeysError(ir: AnyViewIR): string | null {
    const node = ir as NodeViewIR;
    if (ir.kind === 'vertex' || ir.kind === 'graphVertex') {
        const text = textStyleAxesError(node.shape?.text, 'shape.text');
        if (text) return text;
        const labels: unknown = node.shape?.labels;
        if (Array.isArray(labels)) {
            for (let i = 0; i < labels.length; i++) {
                const bad = textStyleAxesError(labels[i]?.style, `shape.labels[${i}].style`);
                if (bad) return bad;
            }
        }
        const compartments: unknown = node.fieldCompartments;
        if (Array.isArray(compartments)) {
            for (let j = 0; j < compartments.length; j++) {
                const fc = compartments[j];
                const at = `fieldCompartments[${j}]`;
                const exclude: unknown = fc?.source?.exclude;
                if (exclude !== undefined) {
                    if (fc.source.from !== 'attributes') return `[ir] ${at}.source.exclude applies to the attributes source only, read on ${readOf(fc.source.from)}`;
                    if (!Array.isArray(exclude) || !exclude.every(x => typeof x === 'string')) {
                        return `[ir] ${at}.source.exclude must be an array of feature names, or absent for every slot, read ${readOf(exclude)}`;
                    }
                }
                const rowStyle = textStyleAxesError(fc?.rowFormat?.style, `${at}.rowFormat.style`);
                if (rowStyle) return rowStyle;
                const segments: unknown = fc?.rowFormat?.segments;
                if (Array.isArray(segments)) {
                    for (let k = 0; k < segments.length; k++) {
                        if (segments[k]?.kind !== 'literal') continue;
                        const bad = textStyleKeyError(segments[k].style, `${at}.rowFormat.segments[${k}].style`);
                        if (bad) return bad;
                    }
                }
            }
        }
    }
    if (ir.kind === 'row') return textStyleAxesError((ir as RowViewIR).style, 'style');
    if (ir.kind === 'edge') {
        const labels: unknown = (ir as EdgeViewIR).edge?.labels;
        if (isPlainObject(labels)) {
            const template = labels.template;
            if (template !== undefined && !(Array.isArray(template) && template.length > 0
                && template.every(seg => isPlainObject(seg) && typeof seg.from === 'string' && Object.prototype.hasOwnProperty.call(TEXT_SOURCE_KINDS, seg.from)))) {
                return `[ir] edge.labels.template must be a non-empty array of text sources (from: ${Object.keys(TEXT_SOURCE_KINDS).join(' | ')}), or absent for the centre source, read ${readOf(template)}`;
            }
            const style = textStyleKeyError(labels.style, 'edge.labels.style');
            if (style) return style;
            // R-VP-23: an end label is a text source, or absent; the compile reads anything else as absent.
            for (const end of ['sourceEnd', 'targetEnd'] as const) {
                const bad = endLabelError(labels[end], `edge.labels.${end}`);
                if (bad) return bad;
            }
        }
    }
    return null;
}

/** The intrinsic props a text source may read (irTypes.ts `TextSource`). */
const INTRINSIC_PROPS: Readonly<Record<string, true>> = { name: true, metaclassName: true, qualifiedName: true };

/** An end label (R-VP-23): absent, or a text source whose own field has its type. */
function endLabelError(src: unknown, where: string): string | null {
    if (src === undefined) return null;
    const ok = isPlainObject(src) && (
        (src.from === 'literal' && typeof src.text === 'string')
        || (src.from === 'path' && typeof src.expr === 'string')
        || (src.from === 'intrinsic' && typeof src.prop === 'string' && Object.prototype.hasOwnProperty.call(INTRINSIC_PROPS, src.prop))
    );
    return ok ? null : `[ir] ${where} must be a text source ({from: 'literal', text} | {from: 'path', expr} | {from: 'intrinsic', prop}), or absent for no end label, read ${readOf(src)}`;
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

    // Padding vocabulary (2026-08-25): authoring-time by the R-B9-bis criterion, like
    // routing below. The render stays permissive towards what is already persisted
    // (compileView falls back to 'normal' for anything it does not know, so a bad value
    // draws the default instead of dropping the view), and the authoring surface applies
    // the vocabulary. Read as unknown for the same reason as routing.
    if (ir.kind === 'vertex' || ir.kind === 'graphVertex') {
        const padding: unknown = (ir as NodeViewIR).shape?.padding;
        if (padding !== undefined && !(VALID_PADDING_VALUES as readonly unknown[]).includes(padding)) {
            return {
                ok: false,
                error: `[ir] shape.padding must be one of ${VALID_PADDING_VALUES.join(' | ')}, or absent for the normal default, read ${JSON.stringify(padding)}`,
            };
        }

        // Entry mark (R-VP-22): same criterion as padding. The render reads a value outside the
        // vocabulary as absent (compileView), the authoring surface refuses it here.
        const entry: unknown = (ir as NodeViewIR).shape?.entry;
        if (entry !== undefined && !(VALID_ENTRY_VALUES as readonly unknown[]).includes(entry)) {
            return {
                ok: false,
                error: `[ir] shape.entry must be one of ${VALID_ENTRY_VALUES.join(' | ')}, or absent for no entry mark, read ${JSON.stringify(entry)}`,
            };
        }

        // Corner radius (slice 3, D5): numeric guard, same criterion as padding. The render
        // reads an invalid value as absent (authoredCornerRadius), the authoring surface
        // rejects it here through the same function, so the two cannot disagree on what
        // "usable" means. A number is printed with String: JSON.stringify(NaN) is "null".
        // The guard is for the LITERAL form only (R-IRN-35): a Conditional radius is
        // validated as the border axes are, by the predicate walk above and the compile
        // below, and its branch values are not checked (the render reads a bad one as absent).
        const cornerRadius: unknown = (ir as NodeViewIR).shape?.cornerRadius;
        if (cornerRadius !== undefined && !isConditionalValue(cornerRadius) && authoredCornerRadius(cornerRadius) === undefined) {
            const read = typeof cornerRadius === 'number' ? String(cornerRadius) : JSON.stringify(cornerRadius);
            return {
                ok: false,
                error: `[ir] shape.cornerRadius must be a finite number >= 0 (px), or absent for the form's base radius, read ${read}`,
            };
        }

        // Default size (P-2026-09-29-1230): same criterion as the radius, through the same
        // function the render reads with (usableSizeAxis), so the two agree on "usable".
        // No clamp here: the floor depends on the form, which can change per instance, so
        // it is applied at render (defaultBoxFor). An absent axis is legal (stays derived).
        const defaultSize: unknown = (ir as VertexViewIR).defaultSize;
        if (defaultSize !== undefined) {
            if (!defaultSize || typeof defaultSize !== 'object' || Array.isArray(defaultSize)) {
                return {
                    ok: false,
                    error: `[ir] defaultSize must be an object { width?, height? }, or absent for the size derived from content, read ${JSON.stringify(defaultSize)}`,
                };
            }
            for (const axis of ['width', 'height'] as const) {
                const v: unknown = (defaultSize as Record<string, unknown>)[axis];
                if (v !== undefined && usableSizeAxis(v) === undefined) {
                    const read = typeof v === 'number' ? String(v) : JSON.stringify(v);
                    return {
                        ok: false,
                        error: `[ir] defaultSize.${axis} must be a finite number > 0 (px), or absent for the size derived from content, read ${read}`,
                    };
                }
            }
        }

        // Label position and anchor (P-2026-09-29-1245): authoring-time by the R-B9-bis
        // criterion, like padding. The render stays permissive (an unknown anchor draws 's',
        // resolveLabelAnchor; an unknown position gets no rule and stays in the flow), the
        // authoring surface applies the vocabulary. Read as unknown for the same reason as
        // routing. A present anchor is checked on every position: the label editor never
        // writes one on an inside position, so one there came from somewhere else.
        const labels: unknown = (ir as NodeViewIR).shape?.labels;
        if (Array.isArray(labels)) {
            for (let i = 0; i < labels.length; i++) {
                const position: unknown = labels[i]?.position;
                if (typeof position !== 'string' || !Object.prototype.hasOwnProperty.call(VALID_LABEL_POSITIONS, position)) {
                    return {
                        ok: false,
                        error: `[ir] shape.labels[${i}].position must be one of ${Object.keys(VALID_LABEL_POSITIONS).join(' | ')}, read ${JSON.stringify(position)}`,
                    };
                }
                const anchor: unknown = labels[i]?.anchor;
                if (anchor !== undefined && (typeof anchor !== 'string' || !Object.prototype.hasOwnProperty.call(LABEL_ANCHORS, anchor))) {
                    return {
                        ok: false,
                        error: `[ir] shape.labels[${i}].anchor must be one of ${Object.keys(LABEL_ANCHORS).join(' | ')}, or absent for 's' (below), read ${JSON.stringify(anchor)}`,
                    };
                }
            }
        }
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

        // Curve vocabulary (R-VP-22): same criterion as routing, read as unknown for the same reason.
        const curve: unknown = (ir as EdgeViewIR).edge?.curve;
        if (curve !== undefined && !(VALID_CURVE_VALUES as readonly unknown[]).includes(curve)) {
            return {
                ok: false,
                error: `[ir] edge.curve must be ${VALID_CURVE_VALUES.join(' | ')}, or absent for the routing path, read ${JSON.stringify(curve)}`,
            };
        }

        // Termination vocabulary (R-VP-24): same criterion as routing, each end read as unknown for the same reason.
        const terminations: unknown = (ir as EdgeViewIR).edge?.terminations;
        if (terminations && typeof terminations === 'object') {
            for (const end of ['sourceEnd', 'targetEnd'] as const) {
                const t: unknown = (terminations as Record<string, unknown>)[end];
                if (t !== undefined && (typeof t !== 'string' || !Object.prototype.hasOwnProperty.call(VALID_TERMINATIONS, t))) {
                    return {
                        ok: false,
                        error: `[ir] edge.terminations.${end} must be one of ${Object.keys(VALID_TERMINATIONS).join(' | ')}, or absent for the default end, read ${JSON.stringify(t)}`,
                    };
                }
            }
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

    // The C2 keys (R-VP-20): after the rules above, before the compile, which reads them permissively.
    const c2 = c2KeysError(ir);
    if (c2 !== null) return { ok: false, error: c2 };

    try {
        if (ir.kind === 'edge') compileEdgeView(viewId, ir as EdgeViewIR);
        else if (ir.kind === 'row') compileRowView(viewId, ir as RowViewIR);
        else compileView(viewId, ir);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
}
