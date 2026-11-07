/**
 * Step D lane D3b (P-2026-11-07-0157; docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §4.2, decision D8):
 * the conformance violations of a model as marks of its text. A violation names its object by the model id the Text tab's
 * carried spans hold; a feature violation goes on the item of that feature inside the object, else, and for an object
 * violation, on the object's first line. Warnings of their own source, never in the way of applying the text: they speak
 * of the model, not of the text.
 *
 * Pure: the violations are read by the tab (model/conformance/useConformance), not here.
 */

import type { ConformanceViolation } from '../../model/conformance/ConformanceTypes';
import type { ObjectNode, SyntaxNode, TextNode } from './parser';
import type { ObjectSpan } from './printer';

/** The marker source of the conformance marks, beside the parse's (decision D8). */
export const CONFORMANCE_SOURCE = 'conformance' as const;

export type MarkedViolation = Pick<ConformanceViolation, 'objectId' | 'violationType' | 'message' | 'metamodelElementName'>;

/** A mark at `[start, end)` of the text. */
export interface ConformanceMark {
    readonly start: number;
    readonly end: number;
    readonly message: string;
    readonly severity: 'warning';
    readonly source: typeof CONFORMANCE_SOURCE;
    readonly objectId: string;
    /** The feature whose item the mark is on; absent on the object's first line. */
    readonly feature?: string;
}

/** The violations whose `metamodelElementName` is a class name (problems/registry.ts), never a feature. */
const CLASS_NAMED: ReadonlySet<string> = new Set(['orphan_object', 'abstract_instantiation']);

const isNode = (c: SyntaxNode | { readonly kind: 'token' }): c is SyntaxNode => c.kind !== 'token';

/** The object node of a span: the outermost one inside it (the span runs from the object's first token to its last). */
function objectIn(tree: TextNode, span: ObjectSpan): ObjectNode | undefined {
    const walk = (n: SyntaxNode): ObjectNode | undefined => {
        if (n.kind === 'object' && n.start >= span.start && n.end <= span.end && n.end > n.start) return n;
        if (n.end < span.start || n.start > span.end) return undefined;
        for (const c of n.children) {
            const found = isNode(c) ? walk(c) : undefined;
            if (found) return found;
        }
        return undefined;
    };
    return walk(tree);
}

/** The first node of `feature` among the object's own items, never inside a contained object. */
function featureIn(o: ObjectNode, feature: string): SyntaxNode | undefined {
    const walk = (n: SyntaxNode): SyntaxNode | undefined => {
        for (const c of n.children) {
            if (!isNode(c) || c.kind === 'object') continue;
            if ((c.kind === 'item' || c.kind === 'list' || c.kind === 'ref') && c.feature === feature && c.end > c.start) return c;
            const found = walk(c);
            if (found) return found;
        }
        return undefined;
    };
    return walk(o);
}

/** The marks of `violations` on `text`, by the spans carried there; `tree`, the parse of `text`, places the feature ones. */
export function conformanceMarks(violations: readonly MarkedViolation[], spans: readonly ObjectSpan[], text: string, tree?: TextNode): ConformanceMark[] {
    const byId = new Map(spans.map(s => [s.id, s]));
    const out: ConformanceMark[] = [];
    for (const v of violations) {
        const s = byId.get(v.objectId);
        if (!s) continue;
        const end = Math.min(s.end, text.length);
        if (end <= s.start) continue;
        const base = { message: v.message, severity: 'warning' as const, source: CONFORMANCE_SOURCE, objectId: v.objectId };
        const feature = v.metamodelElementName && !CLASS_NAMED.has(v.violationType) ? v.metamodelElementName : undefined;
        const o = feature && tree ? objectIn(tree, { ...s, end }) : undefined;
        const item = o && feature ? featureIn(o, feature) : undefined;
        if (item && feature) {
            out.push({ ...base, start: item.start, end: item.end, feature });
            continue;
        }
        const nl = text.indexOf('\n', s.start);
        const head = text.slice(s.start, nl < 0 ? end : Math.min(nl, end)).trimEnd();
        if (head.length) out.push({ ...base, start: s.start, end: s.start + head.length });
    }
    return out.map((m, i) => [m, i] as const).sort((a, b) => a[0].start - b[0].start || a[1] - b[1]).map(([m]) => m);
}
