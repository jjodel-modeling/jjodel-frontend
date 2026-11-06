/**
 * dispatch — templates that share a name and differ by the metaclass of their first parameter (P-2026-10-31-1410;
 * discovery_2026-10-31_codegen_metaclass_dispatch).
 *
 * A record may type its first parameter, `paramType`, with a class name of the generator's metamodel. Templates of one
 * name are told apart by their key, `name` for an untyped one and `name:Type` for a typed one (`templateKey`): names
 * are JjEL identifiers, so no untyped key holds a `:`, and every key of a list with no typed template is its name. A
 * call chooses, among the typed templates of its name, the one whose type is the most specific supertype (or the class
 * itself) of the first argument's metaclass (`mostSpecific`); the untyped one when none applies (templates.ts).
 *
 * What the metamodel's class graph tells about a list (`dispatchProblems`): a template of a name whose arity differs
 * from the first of that name, or that types a first parameter it does not have, is an error, graph or not. With the
 * graph: a type that is no class of it, and a concrete class two typed templates match equally (multiple inheritance),
 * are errors; and for a name with no untyped template, a concrete class under the nearest common supertype of its
 * typed parameters that no template matches is a warning.
 *
 * The graph is read from the JjEL class shells of a generation (`graphOfShells`, `graphOfShell`: `instanceOf`,
 * `superTypes`, jjscript/executor/commands/eval.ts) or from the D-layer of a metamodel (`graphOfLookup`: packages,
 * `classifiers`, `extends`, `abstract`, `interface`). A name two classes share keeps the first.
 *
 * Pure: no import outside the engine.
 */

import type { TemplateRecord } from './templates';

type Lookup = Record<string, any>;

/** A class as dispatch reads it: its name, its direct supertypes by name, and whether it can have instances. */
export interface Metaclass {
    readonly name: string;
    readonly supers: readonly string[];
    readonly concrete: boolean;
}

export type ClassGraph = ReadonlyMap<string, Metaclass>;

/** The key of a template among those of its name: `name`, or `name:Type` when its first parameter is typed. */
export const templateKey = (record: { readonly name: string; readonly paramType?: string }): string =>
    record.paramType !== undefined ? `${record.name}:${record.paramType}` : record.name;

/** The class `name` and every ancestor in `graph`, itself first; cycle-safe. A class the graph lacks is its own set. */
export function selfAndAncestors(graph: ClassGraph, name: string): Set<string> {
    const out = new Set<string>();
    const queue = [name];
    while (queue.length > 0) {
        const n = queue.shift() as string;
        if (out.has(n)) continue;
        out.add(n);
        queue.push(...(graph.get(n)?.supers ?? []));
    }
    return out;
}

/** The types among `types` that `className` is or inherits, none of them a proper supertype of another. */
export function mostSpecific(graph: ClassGraph, className: string, types: readonly string[]): string[] {
    const up = selfAndAncestors(graph, className);
    const matches = [...new Set(types.filter(t => up.has(t)))];
    return matches.filter(t => !matches.some(u => u !== t && selfAndAncestors(graph, u).has(t)));
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

const shellOf = (shell: unknown): Metaclass | null => {
    if (!isRecord(shell) || typeof shell.name !== 'string' || shell.name === '') return null;
    const supers = Array.isArray(shell.superTypes)
        ? shell.superTypes.map(s => (isRecord(s) && typeof s.name === 'string' ? s.name : '')).filter(n => n !== '')
        : [];
    return { name: shell.name, supers, concrete: shell.isAbstract !== true && shell.isInterface !== true };
};

/** The graph of a generation's `classes`, the JjEL class shells; `null` when `classes` is not a list. */
export function graphOfShells(classes: unknown): ClassGraph | null {
    if (!Array.isArray(classes)) return null;
    const graph = new Map<string, Metaclass>();
    for (const c of classes) {
        const m = shellOf(c);
        if (m && !graph.has(m.name)) graph.set(m.name, m);
    }
    return graph;
}

/** The metaclass of a model object handle, `instanceOf`, with its ancestors' graph; `null` for any other value. */
export function metaclassOf(value: unknown): { name: string; graph: ClassGraph } | null {
    const shell = isRecord(value) ? value.instanceOf : undefined;
    const top = shellOf(shell);
    if (!top) return null;
    const graph = new Map<string, Metaclass>();
    const queue: unknown[] = [shell];
    while (queue.length > 0) {
        const s = queue.shift();
        const m = shellOf(s);
        if (!m || graph.has(m.name)) continue;
        graph.set(m.name, m);
        if (isRecord(s) && Array.isArray(s.superTypes)) queue.push(...s.superTypes);
    }
    return { name: top.name, graph };
}

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** The graph of the classes of the metamodel `metamodelId` in the D-layer `lookup`: its packages, subpackages included. */
export function graphOfLookup(lookup: Lookup, metamodelId: string): ClassGraph {
    const graph = new Map<string, Metaclass>();
    const seen = new Set<string>();
    const nameOf = (id: string): string => (typeof lookup[id]?.name === 'string' ? lookup[id].name : '');
    const visit = (containerId: string) => {
        if (seen.has(containerId)) return;
        seen.add(containerId);
        const c = lookup[containerId];
        if (!c) return;
        for (const id of [...ids(c.classifiers), ...ids(c.classes)]) {
            const k = lookup[id];
            const name = nameOf(id);
            if (k?.className !== 'DClass' || name === '' || graph.has(name)) continue;
            graph.set(name, { name, supers: ids(k.extends).map(nameOf).filter(n => n !== ''), concrete: !k.abstract && !k.interface });
        }
        for (const id of [...ids(c.packages), ...ids(c.subpackages)]) visit(id);
    };
    visit(metamodelId);
    return graph;
}

export type DispatchProblemKind = 'arity' | 'type' | 'ambiguous' | 'uncovered';

export interface DispatchProblem {
    readonly kind: DispatchProblemKind;
    readonly severity: 'error' | 'warning';
    /** The template name the problem is about. */
    readonly name: string;
    /** The key of the template it is reported on. */
    readonly key: string;
    readonly message: string;
}

/** The arity problem of `record` against the first template of its name, `first`; `null` when there is none. */
export function arityProblem(record: TemplateRecord, first: TemplateRecord | undefined): string | null {
    const key = templateKey(record);
    if (record.paramType !== undefined && record.params.length === 0) return `Template '${key}' types its first parameter, but has no parameter`;
    if (first && first.params.length !== record.params.length) {
        return `Template '${key}' has ${record.params.length} parameter${record.params.length === 1 ? '' : 's'} and '${templateKey(first)}' has ${first.params.length}: templates of one name have one arity`;
    }
    return null;
}

/**
 * The problems of `records` as one dispatch per name: arity always, types, ambiguity and uncovered classes when the
 * class `graph` is known. A record whose key an earlier one holds is left to the duplicate checks of its callers.
 */
export function dispatchProblems(records: readonly TemplateRecord[], graph: ClassGraph | null): DispatchProblem[] {
    const out: DispatchProblem[] = [];
    const groups = new Map<string, TemplateRecord[]>();
    const keys = new Set<string>();
    for (const r of records) {
        const key = templateKey(r);
        if (keys.has(key)) continue;
        keys.add(key);
        const group = groups.get(r.name);
        const arity = arityProblem(r, group?.[0]);
        if (arity) {
            out.push({ kind: 'arity', severity: 'error', name: r.name, key, message: arity });
            continue;
        }
        if (group) group.push(r);
        else groups.set(r.name, [r]);
    }
    if (!graph) return out;

    for (const [name, group] of groups) {
        const typed = group.filter(r => r.paramType !== undefined);
        if (typed.length === 0) continue;
        for (const r of typed) {
            if (!graph.has(r.paramType as string)) {
                out.push({ kind: 'type', severity: 'error', name, key: templateKey(r), message: `Template '${templateKey(r)}' types its first parameter ${r.paramType}, which is not a class of the metamodel` });
            }
        }
        const types = typed.map(r => r.paramType as string).filter(t => graph.has(t));
        const concrete = [...graph.values()].filter(c => c.concrete);
        for (const c of concrete) {
            const picks = mostSpecific(graph, c.name, types);
            if (picks.length > 1) {
                const keysOf = picks.map(t => `'${name}:${t}'`).join(' and ');
                out.push({ kind: 'ambiguous', severity: 'error', name, key: `${name}:${picks[0]}`, message: `Class ${c.name} matches ${keysOf} equally: add '${name}:${c.name}'` });
            }
        }
        if (group.some(r => r.paramType === undefined) || types.length === 0) continue;
        // The nearest common supertypes of the typed parameters: the classes a call of this name is meant for.
        let common = selfAndAncestors(graph, types[0]);
        for (const t of types.slice(1)) {
            const up = selfAndAncestors(graph, t);
            common = new Set([...common].filter(n => up.has(n)));
        }
        const bases = [...common].filter(b => ![...common].some(o => o !== b && selfAndAncestors(graph, o).has(b)));
        for (const c of concrete) {
            const up = selfAndAncestors(graph, c.name);
            if (!bases.some(b => up.has(b)) || mostSpecific(graph, c.name, types).length > 0) continue;
            out.push({
                kind: 'uncovered', severity: 'warning', name, key: templateKey(typed[0]),
                message: `No template '${name}' applies to class ${c.name}: add '${name}:${c.name}' or an untyped '${name}'`,
            });
        }
    }
    return out;
}
