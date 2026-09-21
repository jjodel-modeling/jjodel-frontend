/**
 * conditional — pure discriminator for Conditional<T> values (authoring phase
 * B2b-i). Exported to become the single source replacing the four local
 * `isConditional` copies (VertexAuthoringPanel, LabelEntryEditor, BadgeListEditor,
 * FieldCompartmentListEditor) when they are wired in B2b-ii; those copies are NOT
 * touched here.
 *
 * A Conditional<T> is either a flat T (scalar) or an object carrying `when`
 * (single rule) / `rules` (multi-rule). Only the object forms return true.
 */
import type { Conditional, Literal, PathExpr, Predicate } from '../../editor-v2/viewpoint/ir/irTypes';

export function isConditionalValue(
    x: unknown,
): x is { when: Predicate; then: unknown; else?: unknown } | { rules: unknown[]; default?: unknown } {
    return x !== null && typeof x === 'object' && ('when' in (x as any) || 'rules' in (x as any));
}

// ---- rules normal form (Symbol Editor 1b, slice 1, decision D3) ----------------

/**
 * The normal form every Conditional<T> is edited in: an ordered rule list (first
 * match wins) plus an optional default. `default` is a KEY that is either present
 * with a value or absent, never present with `undefined` (D2: a default is written
 * only when the author chose one).
 */
export interface RulesForm<T> {
    rules: { when: Predicate; then: T }[];
    default?: T;
}

/**
 * Normalize any Conditional<T> to its rules form. Accepts the three shapes:
 * - a scalar T → no rules, the scalar as `default` (what Solid → Conditional does);
 * - `{when, then, else?}` → one rule, `else` as `default` when present;
 * - `{rules, default?}` → the same rules (shallow copy), `default` when present.
 * `undefined` (absent axis) → no rules and no default.
 */
export function toRules<T>(c: Conditional<T> | undefined): RulesForm<T> {
    if (c === undefined) return { rules: [] };
    if (!isConditionalValue(c)) return { rules: [], default: c as T };
    if ('when' in (c as any)) {
        const w = c as { when: Predicate; then: T; else?: T };
        const out: RulesForm<T> = { rules: [{ when: w.when, then: w.then }] };
        if (w.else !== undefined) out.default = w.else;
        return out;
    }
    const r = c as { rules: { when: Predicate; then: T }[]; default?: T };
    const out: RulesForm<T> = { rules: Array.isArray(r.rules) ? r.rules.slice() : [] };
    if (r.default !== undefined) out.default = r.default;
    return out;
}

/**
 * Write a rules form back as a Conditional<T>. Always the `rules` form (D3), never
 * `{when, then, else}`. The three write rules:
 * - one or more rules → `{rules, default?}`, `default` only when set;
 * - no rules but a default → `{rules: [], default}` (state 2i: the author chose
 *   Conditional and nothing matched yet — what brings the switch back on reopen);
 * - neither → `{rules: []}` alone compiles to the fallback exactly like absence
 *   (irCompile.ts compileConditional), so it is never written. The axis is removed
 *   (`undefined`) when it has a none value, since absence is the canonical spelling
 *   of none; otherwise the explicit `fallback` scalar is written.
 */
export function fromRules<T>(
    form: RulesForm<T>,
    opts: { noneValue?: T; fallback?: T } = {},
): Conditional<T> | undefined {
    if (form.rules.length > 0) {
        const out: { rules: { when: Predicate; then: T }[]; default?: T } = { rules: form.rules.slice() };
        if (form.default !== undefined) out.default = form.default;
        return out;
    }
    if (form.default !== undefined) return { rules: [], default: form.default };
    if (opts.noneValue !== undefined) return undefined;
    return opts.fallback;
}

// ---- formatPredicate (decision D4) ---------------------------------------------

/** Neutral text for an operator this build does not know, or a malformed node. */
export const PREDICATE_PLACEHOLDER = '⟨expr⟩';

const COMPARATOR_SYMBOLS: Record<string, string> = {
    eq: '==', neq: '!=', lt: '<', lte: '<=', gt: '>', gte: '>=',
};

export interface FormatPredicateOptions {
    /** Prefix for every path (`state` → `state.isFinal`). Absent: the bare path. */
    subject?: string;
}

function isLiteral(x: unknown): x is Literal {
    return typeof x === 'object' && x !== null && 'kind' in (x as any);
}

/** `$isFinal.value` → `isFinal`, then the subject prefix. Empty path → placeholder. */
function formatPath(path: PathExpr, subject: string | undefined): string {
    if (typeof path !== 'string') return PREDICATE_PLACEHOLDER;
    let p = path.trim();
    if (p.startsWith('$')) p = p.slice(1);
    if (p.endsWith('.value')) p = p.slice(0, -'.value'.length);
    if (p === '') return '⟨path⟩';
    return subject ? `${subject}.${p}` : p;
}

function formatLiteral(l: Literal): string {
    if (l.kind === 'string') return JSON.stringify(l.value);
    return String(l.value);
}

function formatOperand(o: PathExpr | Literal, subject: string | undefined): string {
    if (isLiteral(o)) return formatLiteral(o);
    return formatPath(o as PathExpr, subject);
}

/** Wrap an `and`/`or` child in parentheses only where precedence requires it
 *  (`not` > `and` > `or`): an `or` inside an `and`. */
function formatChild(child: Predicate, parentOp: 'and' | 'or', subject: string | undefined): string {
    const text = formatNode(child, subject);
    const childOp = (child as any)?.op;
    const needsParens = parentOp === 'and' && childOp === 'or'
        && Array.isArray((child as any).args) && (child as any).args.length > 1;
    return needsParens ? `(${text})` : text;
}

function formatNode(p: Predicate, subject: string | undefined): string {
    if (typeof p !== 'object' || p === null) return PREDICATE_PLACEHOLDER;
    switch ((p as any).op) {
        case 'literal':
            return (p as any).value === true ? 'always true' : (p as any).value === false ? 'always false' : PREDICATE_PLACEHOLDER;
        case 'and':
        case 'or': {
            const g = p as { op: 'and' | 'or'; args: Predicate[] };
            if (!Array.isArray(g.args)) return PREDICATE_PLACEHOLDER;
            // Compile semantics: every([]) is true, some([]) is false.
            if (g.args.length === 0) return g.op === 'and' ? 'always true' : 'always false';
            return g.args.map((a) => formatChild(a, g.op, subject)).join(` ${g.op} `);
        }
        case 'not':
            return `not (${formatNode((p as any).arg, subject)})`;
        case 'eq':
        case 'neq':
        case 'lt':
        case 'lte':
        case 'gt':
        case 'gte': {
            const c = p as { op: string; left: PathExpr | Literal; right: PathExpr | Literal };
            if (c.left === undefined || c.right === undefined) return PREDICATE_PLACEHOLDER;
            // `eq <path> true` reads as the path, `eq <path> false` as `not <path>`;
            // only against a boolean literal, never a number or a string.
            if (c.op === 'eq') {
                const [path, lit] = isLiteral(c.right) ? [c.left, c.right] : [c.right, c.left];
                if (!isLiteral(path) && isLiteral(lit) && lit.kind === 'boolean') {
                    const text = formatPath(path as PathExpr, subject);
                    return lit.value ? text : `not ${text}`;
                }
            }
            return `${formatOperand(c.left, subject)} ${COMPARATOR_SYMBOLS[c.op]} ${formatOperand(c.right, subject)}`;
        }
        case 'exists':
            return `exists ${formatPath((p as any).path, subject)}`;
        case 'empty':
            return `empty ${formatPath((p as any).path, subject)}`;
        case 'isKind': {
            const k = p as { class: string; path?: PathExpr };
            if (typeof k.class !== 'string') return PREDICATE_PLACEHOLDER;
            return k.path !== undefined ? `isKind ${k.class} on ${formatPath(k.path, subject)}` : `isKind ${k.class}`;
        }
        case 'marked': {
            const m = p as { path?: PathExpr };
            return m.path !== undefined ? `marked on ${formatPath(m.path, subject)}` : 'marked';
        }
        default:
            return PREDICATE_PLACEHOLDER;
    }
}

/**
 * Display text of a Predicate: the single source of the rule rows, the preview
 * captions and the suggestion chips. Total over the union and never throws: saved
 * IR can carry an operator this build does not know, and reporting that is
 * `irValidate`'s job, not the panel's. Display only — there is no parser back.
 */
export function formatPredicate(p: Predicate, opts: FormatPredicateOptions = {}): string {
    try {
        return formatNode(p, opts.subject);
    } catch {
        return PREDICATE_PLACEHOLDER;
    }
}
