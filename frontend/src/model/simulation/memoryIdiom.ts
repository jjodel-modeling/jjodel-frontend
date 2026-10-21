/**
 * memoryIdiom — the recogniser of the memory idiom `coll.filter(c => c.F == E).first.X`
 * (hardware demonstrator, slice S-D0, plan §5.2 and §10.1).
 *
 * The simulator has no array in σ: a memory is one element per word, and a
 * word is selected by a key feature of the element (plan §5.2, measured). The
 * idiom reads `X` of the element whose feature `F` equals `E`; `X` is a σ read
 * `.[a]` (a RAM word) or a model feature `.f` (a ROM word, frozen data). The
 * same idiom with a σ read is the target of a dynamic write.
 *
 * Printers recognise it to print `mem[E]`: the Verilog printer
 * (`codegen/target/verilog/printer.ts`) and the exporter of slice S-G1. Pure,
 * syntax only: `E` must not mention the element `c`, otherwise the filter is
 * not a key lookup. `.first` is read in both forms, `.first` and `.first()`.
 */

import type { JjelExpression } from '../../jjel/types/ast';

/** What the idiom reads of the selected element. */
export type MemoryRead =
    | { readonly kind: 'state'; readonly attribute: string }
    | { readonly kind: 'feature'; readonly feature: string };

export interface MemoryIdiom {
    /** The collection of elements: `rom.cells`, `cells`. */
    readonly collection: JjelExpression;
    /** The parameter of the filter: `c`. */
    readonly element: string;
    /** The key feature `F` of `c.F == E`. */
    readonly keyFeature: string;
    /** The key `E` of `c.F == E`, as written (a `toNumber` included). */
    readonly key: JjelExpression;
    readonly read: MemoryRead;
}

/** Whether an identifier `name` occurs anywhere in `node`. */
function mentions(node: unknown, name: string): boolean {
    if (Array.isArray(node)) return node.some(n => mentions(n, name));
    if (node === null || typeof node !== 'object') return false;
    const n = node as Record<string, unknown>;
    if (n.type === 'Identifier' && n.name === name) return true;
    return Object.keys(n).some(k => k !== 'location' && mentions(n[k], name));
}

/** `coll.filter(c => c.F == E).first`, or `null`. */
function lookup(e: JjelExpression): Omit<MemoryIdiom, 'read'> | null {
    let filter: JjelExpression;
    if (e.type === 'MemberAccess' && e.property === 'first') filter = e.object;
    else if (e.type === 'MethodCall' && e.method === 'first' && e.args.length === 0) filter = e.object;
    else return null;
    if (filter.type !== 'MethodCall' || filter.method !== 'filter' || filter.args.length !== 1) return null;
    const lambda = filter.args[0];
    if (lambda.type !== 'Lambda' || lambda.params.length !== 1) return null;
    const element = lambda.params[0];
    const body = lambda.body;
    if (body.type !== 'Binary' || body.operator !== '==') return null;
    const left = body.left;
    if (left.type !== 'MemberAccess' || left.object.type !== 'Identifier' || left.object.name !== element) return null;
    if (mentions(body.right, element) || mentions(filter.object, element)) return null;
    return { collection: filter.object, element, keyFeature: left.property, key: body.right };
}

/**
 * The idiom `e` is, or `null`: `e` is `coll.filter(c => c.F == E).first.[a]`
 * (a σ read, or an action's target) or `coll.filter(c => c.F == E).first.f`.
 */
export function matchMemoryIdiom(e: JjelExpression): MemoryIdiom | null {
    if (e.type === 'StateAccess') {
        const l = lookup(e.object);
        return l ? { ...l, read: { kind: 'state', attribute: e.attribute } } : null;
    }
    if (e.type === 'MemberAccess') {
        const l = lookup(e.object);
        return l ? { ...l, read: { kind: 'feature', feature: e.property } } : null;
    }
    return null;
}
