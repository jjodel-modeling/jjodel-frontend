/**
 * templateCompletion — completion in the Template Editor (slice S4, P-2026-10-23-2300; R-GEN-24, R-GEN-26,
 * discovery §3.2, §4).
 *
 * The shape is the dead JjTL provider's (jjtl/editor/jjtlCompletions.ts): a module-level context the open editor
 * sets and clears, and one `CompletionItemProvider` with `.` as its trigger character, registered once for both
 * template languages (templateLanguage.ts). The context is a function, keyed by the Monaco model's URI, one per open
 * Template Editor tab: it is built when a completion is asked for, not on every keystroke.
 *
 * What is offered, and where:
 * - Text mode: only inside a `${…}` hole; `\${` is text, as in the lexer's `textBody`. Expression mode: anywhere but
 *   the text of a string literal and a `--` comment. The scan mirrors the Monarch states of templateLanguage.ts.
 * - Anywhere it offers: the metamodel's classes, the templates (a call with its parameters as snippet placeholders),
 *   the edited template's parameters, `stc` and `target`.
 * - After `.`: the members of `stc` (generate.ts, `stcValue`) and of `target` (target/js/access.ts, `jsTarget`);
 *   the features of a class, inherited ones included, when the receiver is a parameter of the edited template whose
 *   class is known; else nothing. `self` is not bound in a template body (templates.ts binds the parameters only),
 *   so it has no class and nothing is offered after it.
 * - A parameter's class is known from its call sites, never from its name: every call of the template, in every
 *   template body, passes at that position a variable bound by `forall v in C.instances` (or `C.allInstances`, or
 *   `exists`), or a parameter whose class is known already, and all of them name the same class. One call site
 *   with an argument of unknown class leaves the parameter unknown.
 *
 * Pure but for `registerTemplateCompletion`, which receives Monaco from the caller: nothing here imports the joiner,
 * so the bench imports this module.
 */

import { parseTemplateBody } from '../engine/templates';
import type { Monaco } from '../../joiner';
import type { TemplateMode, TemplateRecord } from '../engine/templates';

type Lookup = Record<string, any>;

/** A feature of a class, as `x.` offers it. */
export interface FeatureInfo {
    readonly name: string;
    readonly kind: 'attribute' | 'reference';
    /** The type's name, '' when it cannot be read. */
    readonly type: string;
    /** The class that declares it: the receiver's class or one of its ancestors. */
    readonly owner: string;
}

export interface ClassInfo {
    readonly name: string;
    /** Own features first, then the inherited ones, nearest ancestor first; a name appears once. */
    readonly features: readonly FeatureInfo[];
}

export interface TemplateCompletionContext {
    /** The classes by name; a name two classes share is left out, as its features cannot be told apart. */
    readonly classes: ReadonlyMap<string, ClassInfo>;
    readonly templates: readonly { readonly name: string; readonly params: readonly string[] }[];
    /** The parameters of the edited template, in order. */
    readonly params: readonly string[];
    /** The known class of each parameter of the edited template; absent when unknown. */
    readonly paramClasses: ReadonlyMap<string, string>;
}

export type CompletionKind = 'class' | 'template' | 'variable' | 'feature' | 'member' | 'function';

/** One offer, Monaco-free: the provider maps the kind and the snippet flag. */
export interface TemplateCompletion {
    readonly label: string;
    readonly kind: CompletionKind;
    readonly insertText: string;
    readonly snippet: boolean;
    readonly detail: string;
}

/** The members of `stc`, as generate.ts `stcValue` builds it: the lists, then the functions of one element. */
export const STC_MEMBERS: readonly { readonly name: string; readonly fn: boolean }[] = [
    { name: 'profile', fn: false },
    { name: 'nodes', fn: false },
    { name: 'transitions', fn: false },
    { name: 'initial', fn: false },
    { name: 'events', fn: false },
    { name: 'net', fn: false },
    { name: 'trigger', fn: true },
    { name: 'source', fn: true },
    { name: 'target', fn: true },
    { name: 'guard', fn: true },
    { name: 'actions', fn: true },
];

/** The members of `target`, as target/js/access.ts `jsTarget` builds it (R-GEN-16, R-GEN-17). */
export const TARGET_MEMBERS: readonly { readonly name: string; readonly fn: boolean }[] = [
    { name: 'name', fn: false },
    { name: 'runtime', fn: false },
    { name: 'ids', fn: false },
    { name: 'ref', fn: true },
    { name: 'initial', fn: false },
    { name: 'net', fn: false },
    { name: 'guard', fn: true },
    { name: 'actions', fn: true },
    { name: 'equation', fn: true },
];

// ── Metamodel side ───────────────────────────────────────────────────────────

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** The DClass ids of a metamodel: its packages' classifiers, subpackages included, cycle-safe. */
function classIdsOf(lookup: Lookup, metamodelId: string): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    const visit = (containerId: string) => {
        if (seen.has(containerId)) return;
        seen.add(containerId);
        const c = lookup[containerId];
        if (!c) return;
        for (const id of [...ids(c.classifiers), ...ids(c.classes)]) {
            if (lookup[id]?.className === 'DClass' && !out.includes(id)) out.push(id);
        }
        for (const id of [...ids(c.packages), ...ids(c.subpackages)]) visit(id);
    };
    visit(metamodelId);
    return out;
}

const nameOf = (lookup: Lookup, id: unknown): string => {
    const n = typeof id === 'string' ? lookup[id]?.name : undefined;
    return typeof n === 'string' ? n : '';
};

/** Own features, then each ancestor's through `extends`, breadth first, cycle-safe; the nearest name wins. */
function featuresOf(lookup: Lookup, classId: string): FeatureInfo[] {
    const out: FeatureInfo[] = [];
    const taken = new Set<string>();
    const seen = new Set<string>();
    const queue = [classId];
    while (queue.length > 0) {
        const cid = queue.shift() as string;
        if (seen.has(cid)) continue;
        seen.add(cid);
        const c = lookup[cid];
        if (!c) continue;
        const owner = typeof c.name === 'string' ? c.name : '';
        const own: [string, FeatureInfo['kind']][] = [
            ...ids(c.attributes).map(id => [id, 'attribute'] as [string, FeatureInfo['kind']]),
            ...ids(c.references).map(id => [id, 'reference'] as [string, FeatureInfo['kind']]),
        ];
        for (const [fid, kind] of own) {
            const name = nameOf(lookup, fid);
            if (!name || taken.has(name)) continue;
            taken.add(name);
            out.push({ name, kind, type: nameOf(lookup, lookup[fid]?.type), owner });
        }
        queue.push(...ids(c.extends));
    }
    return out;
}

/** The classes of a metamodel by name, with their features; a shared name is left out. */
export function classesOf(lookup: Lookup, metamodelId: string): Map<string, ClassInfo> {
    const byName = new Map<string, ClassInfo>();
    const shared = new Set<string>();
    for (const id of classIdsOf(lookup, metamodelId)) {
        const name = nameOf(lookup, id);
        if (!name) continue;
        if (byName.has(name)) shared.add(name);
        else byName.set(name, { name, features: featuresOf(lookup, id) });
    }
    for (const name of shared) byName.delete(name);
    return byName;
}

// ── Parameter classes, from the call sites ───────────────────────────────────

/** The variables in scope and their class, '' when unknown: a bound name shadows a class or a template. */
type Env = ReadonlyMap<string, string>;

/** `C.instances` or `C.allInstances`, `C` a class not shadowed by a variable: `C`; else null. */
function classOfCollection(node: any, env: Env, classes: ReadonlyMap<string, ClassInfo>): string | null {
    if (!node || (node.type !== 'MemberAccess' && node.type !== 'NullSafeMemberAccess')) return null;
    if (node.property !== 'instances' && node.property !== 'allInstances') return null;
    const o = node.object;
    if (o?.type !== 'Identifier' || env.has(o.name) || !classes.has(o.name)) return null;
    return o.name;
}

/** Walks an expression with the classes of the variables in scope, calling `onCall` at each template call. */
function walk(node: any, env: Env, classes: ReadonlyMap<string, ClassInfo>, onCall: (call: any, env: Env) => void): void {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
        for (const n of node) walk(n, env, classes, onCall);
        return;
    }
    if (node.type === 'ForAll' || node.type === 'Exists') {
        walk(node.collection, env, classes, onCall);
        const inner = new Map(env);
        const c = classOfCollection(node.collection, env, classes);
        inner.set(node.variable, c ?? '');
        walk(node.filter, inner, classes, onCall);
        walk(node.projection, inner, classes, onCall);
        walk(node.predicate, inner, classes, onCall);
        return;
    }
    if (node.type === 'Lambda') {
        const inner = new Map(env);
        for (const p of node.params ?? []) inner.set(p, '');
        walk(node.body, inner, classes, onCall);
        return;
    }
    if (node.type === 'FunctionCall') onCall(node, env);
    for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v, env, classes, onCall);
}

/**
 * The known class of each parameter of each template, by template name: a parameter is known when every argument
 * passed at its position has a known class, and all name the same one. Iterated until stable, so a parameter passed
 * on as an argument becomes known in the next round.
 */
export function paramClassesOf(templates: readonly TemplateRecord[], classes: ReadonlyMap<string, ClassInfo>): Map<string, Map<string, string>> {
    const byName = new Map<string, TemplateRecord>();
    for (const t of templates) if (!byName.has(t.name)) byName.set(t.name, t);
    const parsed = templates.map(t => ({ record: t, expr: parseTemplateBody(t).expression }));
    let known = new Map<string, Map<string, string>>();
    for (let round = 0; round <= templates.length; round++) {
        // Per template and parameter: the classes the call sites pass, '' for an argument of unknown class.
        const votes = new Map<string, Map<string, Set<string>>>();
        for (const { record, expr } of parsed) {
            const env = new Map(known.get(record.name) ?? []);
            for (const p of record.params) if (!env.has(p)) env.set(p, '');
            walk(expr, env, classes, (call, scope) => {
                const callee = byName.get(call.name);
                if (!callee || scope.has(call.name)) return;
                const perParam = votes.get(callee.name) ?? new Map<string, Set<string>>();
                votes.set(callee.name, perParam);
                callee.params.forEach((p, i) => {
                    const arg = call.args?.[i];
                    const c = arg?.type === 'Identifier' ? scope.get(arg.name) ?? '' : '';
                    const set = perParam.get(p) ?? new Set<string>();
                    set.add(c);
                    perParam.set(p, set);
                });
            });
        }
        const next = new Map<string, Map<string, string>>();
        for (const [tpl, perParam] of votes) {
            const m = new Map<string, string>();
            for (const [p, set] of perParam) {
                const [only] = [...set];
                if (set.size === 1 && only) m.set(p, only);
            }
            if (m.size > 0) next.set(tpl, m);
        }
        const same = next.size === known.size && [...next].every(([t, m]) => {
            const k = known.get(t);
            return !!k && k.size === m.size && [...m].every(([p, c]) => k.get(p) === c);
        });
        known = next;
        if (same) break;
    }
    return known;
}

/** The context of one completion: the metamodel's classes, the templates (drafts merged), the edited template. */
export function buildCompletionContext(
    lookup: Lookup,
    metamodelId: string,
    templates: readonly TemplateRecord[],
    editedName: string | null,
    editedParams: readonly string[],
): TemplateCompletionContext {
    const classes = classesOf(lookup, metamodelId);
    const inferred = editedName !== null ? paramClassesOf(templates, classes).get(editedName) : undefined;
    const paramClasses = new Map<string, string>();
    for (const p of editedParams) {
        const c = inferred?.get(p);
        if (c) paramClasses.set(p, c);
    }
    return {
        classes,
        templates: templates.map(t => ({ name: t.name, params: [...t.params] })),
        params: [...editedParams],
        paramClasses,
    };
}

// ── Where the cursor is ──────────────────────────────────────────────────────

/**
 * Whether the offset is in code: inside a hole in text mode; in expression mode, outside the text of a string and a
 * `--` comment. Mirrors the Monarch states: a `"` string holds holes, a `'` string none, a `{` inside code opens a
 * brace the next `}` closes, the `}` of a hole closes it; in text, `\${` is text.
 */
export function inCodeAt(body: string, offset: number, mode: TemplateMode): boolean {
    type State = 'text' | 'code' | 'hole' | 'braces' | 'dstring' | 'sstring' | 'comment';
    const stack: State[] = [mode === 'text' ? 'text' : 'code'];
    const end = Math.min(offset, body.length);
    let i = 0;
    while (i < end) {
        const top = stack[stack.length - 1];
        const ch = body[i];
        if (top === 'text') {
            if (ch === '\\' && body.startsWith('${', i + 1)) i += 3;
            else if (ch === '$' && body[i + 1] === '{') { stack.push('hole'); i += 2; }
            else i++;
        } else if (top === 'dstring') {
            if (ch === '\\') i += 2;
            else if (ch === '$' && body[i + 1] === '{') { stack.push('hole'); i += 2; }
            else { if (ch === '"') stack.pop(); i++; }
        } else if (top === 'sstring') {
            if (ch === '\\') i += 2;
            else { if (ch === "'") stack.pop(); i++; }
        } else if (top === 'comment') {
            if (ch === '\n') stack.pop();
            i++;
        } else {
            if (ch === '-' && body[i + 1] === '-') { stack.push('comment'); i += 2; }
            else if (ch === '"') { stack.push('dstring'); i++; }
            else if (ch === "'") { stack.push('sstring'); i++; }
            else if (ch === '{') { stack.push('braces'); i++; }
            else if (ch === '}') { if (top !== 'code') stack.pop(); i++; }
            else i++;
        }
    }
    const top = stack[stack.length - 1];
    return top === 'code' || top === 'hole' || top === 'braces';
}

// ── What is offered ──────────────────────────────────────────────────────────

const callSnippet = (name: string, params: readonly string[]): string =>
    `${name}(${params.map((p, i) => `\${${i + 1}:${p.replace(/[$}\\]/g, '\\$&')}}`).join(', ')})`;

function membersOf(owner: 'stc' | 'target', members: readonly { readonly name: string; readonly fn: boolean }[]): TemplateCompletion[] {
    const arg = owner === 'stc' ? 'element' : 'site';
    return members.map(m => (m.fn
        ? { label: m.name, kind: 'function' as const, insertText: callSnippet(m.name, [arg]), snippet: true, detail: `${owner}.${m.name}(${arg})` }
        : { label: m.name, kind: 'member' as const, insertText: m.name, snippet: false, detail: `${owner}.${m.name}` }));
}

/**
 * The offers at an offset of a body: null where nothing is offered (outside code, or after a receiver of unknown
 * class), else the list.
 */
export function completionsAt(ctx: TemplateCompletionContext, body: string, offset: number, mode: TemplateMode): TemplateCompletion[] | null {
    if (!inCodeAt(body, offset, mode)) return null;
    const before = body.slice(0, offset);
    const dot = /(^|[^\w.?])([A-Za-z_]\w*)\s*\??\.\s*\w*$/.exec(before);
    if (dot) {
        const receiver = dot[2];
        if (ctx.params.includes(receiver)) {
            const cls = ctx.paramClasses.get(receiver);
            const info = cls ? ctx.classes.get(cls) : undefined;
            if (!info) return null;
            return info.features.map(f => ({
                label: f.name,
                kind: 'feature' as const,
                insertText: f.name,
                snippet: false,
                detail: `${f.owner}.${f.name}${f.type ? `: ${f.type}` : ''}`,
            }));
        }
        if (receiver === 'stc') return membersOf('stc', STC_MEMBERS);
        if (receiver === 'target') return membersOf('target', TARGET_MEMBERS);
        return null;
    }
    // A dot after something that is not a plain name (`a.b.`, `f().`, `"x".`): no receiver whose members are known.
    if (/\??\.\s*\w*$/.test(before)) return null;
    const out: TemplateCompletion[] = [];
    for (const p of ctx.params) {
        const cls = ctx.paramClasses.get(p);
        out.push({ label: p, kind: 'variable', insertText: p, snippet: false, detail: cls ? `parameter: ${cls}` : 'parameter' });
    }
    for (const t of ctx.templates) {
        out.push({ label: t.name, kind: 'template', insertText: callSnippet(t.name, t.params), snippet: true, detail: `template ${t.name}(${t.params.join(', ')})` });
    }
    for (const c of ctx.classes.values()) out.push({ label: c.name, kind: 'class', insertText: c.name, snippet: false, detail: 'class' });
    out.push({ label: 'stc', kind: 'variable', insertText: 'stc', snippet: false, detail: 'the model\'s STC roles' });
    out.push({ label: 'target', kind: 'variable', insertText: 'target', snippet: false, detail: 'the target profile' });
    return out;
}

// ── The open editors' contexts, and the provider ─────────────────────────────

const contexts = new Map<string, () => TemplateCompletionContext | null>();

/** Sets the context of the editor whose Monaco model has this URI; null clears it. */
export function setTemplateCompletionContext(modelUri: string, get: (() => TemplateCompletionContext | null) | null): void {
    if (get) contexts.set(modelUri, get);
    else contexts.delete(modelUri);
}

let registered = false;

/** Registers the provider once, for both languages; called by templateLanguage.ts with its Monaco. */
export function registerTemplateCompletion(api: typeof Monaco, expressionLanguageId: string, textLanguageId: string): void {
    if (registered) return;
    registered = true;
    const K = api.languages.CompletionItemKind;
    const kinds: Record<CompletionKind, Monaco.languages.CompletionItemKind> = {
        class: K.Class, template: K.Function, variable: K.Variable, feature: K.Field, member: K.Property, function: K.Method,
    };
    const provider: Monaco.languages.CompletionItemProvider = {
        triggerCharacters: ['.'],
        provideCompletionItems(model, position) {
            const ctx = contexts.get(model.uri.toString())?.() ?? null;
            if (!ctx) return { suggestions: [] };
            const mode: TemplateMode = model.getLanguageId() === textLanguageId ? 'text' : 'expression';
            const items = completionsAt(ctx, model.getValue(), model.getOffsetAt(position), mode);
            if (!items) return { suggestions: [] };
            const word = model.getWordUntilPosition(position);
            const range = new api.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
            return {
                suggestions: items.map(c => ({
                    label: c.label,
                    kind: kinds[c.kind],
                    insertText: c.insertText,
                    insertTextRules: c.snippet ? api.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
                    detail: c.detail,
                    range,
                })),
            };
        },
    };
    api.languages.registerCompletionItemProvider(expressionLanguageId, provider);
    api.languages.registerCompletionItemProvider(textLanguageId, provider);
}
