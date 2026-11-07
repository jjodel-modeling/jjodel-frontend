/**
 * Step D lane D3b (P-2026-11-07-0157; docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §4.2, decision D8):
 * the conformance violations of a model as marks of its text. A violation names its object by the model id the Text tab's
 * carried spans hold; a feature violation goes on the item of that feature inside the object, else, and for an object
 * violation, on the object's first line. Warnings of their own source, never in the way of applying the text: they speak
 * of the model, not of the text.
 *
 * Pure: the violations are read by the tab (model/conformance/useConformance), not here.
 *
 * Lane D3c (P-2026-11-07-1838, decision D9): the problems a run of the user's validation rules wrote in the problems
 * registry (problems/validationToProblems.ts) are placed the same way. Their `nodeId` is the instance's model id, the
 * one the spans carry; the vertex entry of the double anchoring matches no span. The tab reads the registry, not here.
 */

import type { ConformanceViolation } from '../../model/conformance/ConformanceTypes';
import type { NodeProblem } from '../../components/editor-v2/problems/registry';
import type { ObjectNode, SyntaxNode, TextNode } from './parser';
import type { ObjectSpan } from './printer';

/** The marker source of the conformance marks, beside the parse's (decision D8). */
export const CONFORMANCE_SOURCE = 'conformance' as const;

/** D3c: the marker source of the validation-rule marks; the registry's entry names no viewpoint (decision D9). */
export const VALIDATION_SOURCE = 'validation' as const;

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

/** Where a mark of `objectId` goes: the item of `feature` in the object when the text writes one, else the object's first line. */
type Placed = { readonly start: number; readonly end: number; readonly feature?: string };
function place(objectId: string, feature: string | undefined, byId: ReadonlyMap<string, ObjectSpan>, text: string, tree?: TextNode): Placed | undefined {
    const s = byId.get(objectId);
    if (!s) return undefined;
    const end = Math.min(s.end, text.length);
    if (end <= s.start) return undefined;
    const o = feature && tree ? objectIn(tree, { ...s, end }) : undefined;
    const item = o && feature ? featureIn(o, feature) : undefined;
    if (item && feature) return { start: item.start, end: item.end, feature };
    const nl = text.indexOf('\n', s.start);
    const head = text.slice(s.start, nl < 0 ? end : Math.min(nl, end)).trimEnd();
    return head.length ? { start: s.start, end: s.start + head.length } : undefined;
}

/** In text order, equal starts in input order. */
const inTextOrder = <M extends { readonly start: number }>(ms: readonly M[]): M[] =>
    ms.map((m, i) => [m, i] as const).sort((a, b) => a[0].start - b[0].start || a[1] - b[1]).map(([m]) => m);

/** The marks of `violations` on `text`, by the spans carried there; `tree`, the parse of `text`, places the feature ones. */
export function conformanceMarks(violations: readonly MarkedViolation[], spans: readonly ObjectSpan[], text: string, tree?: TextNode): ConformanceMark[] {
    const byId = new Map(spans.map(s => [s.id, s]));
    const out: ConformanceMark[] = [];
    for (const v of violations) {
        const feature = v.metamodelElementName && !CLASS_NAMED.has(v.violationType) ? v.metamodelElementName : undefined;
        const at = place(v.objectId, feature, byId, text, tree);
        if (at) out.push({ message: v.message, severity: 'warning', source: CONFORMANCE_SOURCE, objectId: v.objectId, ...at });
    }
    return inTextOrder(out);
}

/**
 * D3c: a registry entry as the tab reads it. `feature` is not written by today's producer (a rule names its class, not a
 * feature: model/validation/validationEvaluator.ts `Violation`), so every rule mark sits on the object's first line until
 * one does.
 */
export type RuleProblem = Pick<NodeProblem, 'nodeId' | 'kind' | 'title' | 'description' | 'ownerModelId' | 'resolvedAt'> & { readonly feature?: string };

/** D3c: a validation-rule mark at `[start, end)` of the text. */
export interface RuleMark {
    readonly start: number;
    readonly end: number;
    readonly message: string;
    readonly severity: 'warning';
    readonly source: typeof VALIDATION_SOURCE;
    readonly objectId: string;
    /** The rule's name (the entry's title), absent when the rule has none. */
    readonly rule?: string;
    readonly feature?: string;
}

/**
 * D3c (D9): the marks of the registry entries a validation run of `ownerModelId` wrote, on the spans carried in `text`.
 * Only the validation kind, only that model's, and not an entry the last run resolved: a new run replaces them.
 */
export function ruleMarks(problems: readonly RuleProblem[], ownerModelId: string, spans: readonly ObjectSpan[], text: string, tree?: TextNode): RuleMark[] {
    const byId = new Map(spans.map(s => [s.id, s]));
    const out: RuleMark[] = [];
    for (const p of problems) {
        if (p.kind !== 'validation' || p.ownerModelId !== ownerModelId || p.resolvedAt !== undefined) continue;
        const at = place(p.nodeId, p.feature, byId, text, tree);
        if (at) out.push({ message: p.description, severity: 'warning', source: VALIDATION_SOURCE, objectId: p.nodeId, ...(p.title ? { rule: p.title } : {}), ...at });
    }
    return inTextOrder(out);
}
