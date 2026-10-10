/**
 * identifiers — the identifier policy of the JavaScript target profile
 * (R-GEN-6, spec 2026-10-10 §6, P-2026-10-10-0950).
 *
 * A model name becomes a JavaScript identifier by `mangle`: accents dropped,
 * every character outside `[A-Za-z0-9_]` turned into `_` (`$` included: the
 * printer's runtime owns every `$` name), a leading digit prefixed with `_`, a
 * reserved word suffixed with `_`. Mangling loses information, so the mapping
 * is kept invertible by a table, never by the function: `JsIdentifierTable`
 * hands each model key (an id) one identifier, settles a collision with `_2`,
 * `_3`, …, and answers both ways, so a generated name can always be traced to
 * the element it stands for (R-GEN-5's origin, read backwards).
 *
 * Pure: no imports.
 */

/** The reserved words of strict-mode JavaScript in a module, plus the globals a declaration must not hide. */
export const JS_RESERVED_WORDS: ReadonlySet<string> = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum',
    'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null',
    'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    // strict mode and modules
    'await', 'implements', 'interface', 'let', 'package', 'private', 'protected', 'public', 'static',
    'arguments', 'eval',
    // globals
    'undefined', 'NaN', 'Infinity', 'globalThis',
]);

/** The parameters of the printed code (`printer.ts`): a generated name must not shadow them. */
export const RUNTIME_NAMES: ReadonlySet<string> = new Set(['state', 'event', 'next']);

const SHAPE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** `x` is an identifier this policy can hand out: well formed, no `$`, not reserved. */
export function isValidIdentifier(x: string): boolean {
    return SHAPE.test(x) && !JS_RESERVED_WORDS.has(x) && !RUNTIME_NAMES.has(x);
}

/** The identifier a model name becomes before collisions are settled. */
export function mangle(name: string): string {
    let s = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_]/g, '_');
    if (s === '') s = '_';
    if (/^[0-9]/.test(s)) s = `_${s}`;
    if (JS_RESERVED_WORDS.has(s) || RUNTIME_NAMES.has(s)) s = `${s}_`;
    return s;
}

export interface JsIdentifierEntry {
    /** The model key: an element id, or any key the caller names things by. */
    readonly key: string;
    /** The name the identifier was made from. */
    readonly name: string;
    readonly identifier: string;
    /** `identifier` differs from `name`. */
    readonly mangled: boolean;
}

/**
 * One identifier per key, distinct across keys, stable across calls, and the
 * way back from each identifier to its key. `reserved` adds names that are
 * never handed out (the exports of a generated program, say).
 */
export class JsIdentifierTable {
    private readonly byKey = new Map<string, JsIdentifierEntry>();
    private readonly byIdentifier = new Map<string, string>();
    private readonly reserved: ReadonlySet<string>;

    constructor(reserved: Iterable<string> = []) {
        this.reserved = new Set(reserved);
    }

    /** The identifier of `key`, made from `name` (the key itself when absent) the first time it is asked for. */
    identifierOf(key: string, name: string = key): string {
        const known = this.byKey.get(key);
        if (known) return known.identifier;
        const base = mangle(name);
        let identifier = this.reserved.has(base) ? `${base}_` : base;
        for (let n = 2; this.taken(identifier); n++) identifier = `${base}_${n}`;
        const entry: JsIdentifierEntry = { key, name, identifier, mangled: identifier !== name };
        this.byKey.set(key, entry);
        this.byIdentifier.set(identifier, key);
        return identifier;
    }

    /** The key `identifier` was handed out for, `undefined` when it was not. */
    keyOf(identifier: string): string | undefined {
        return this.byIdentifier.get(identifier);
    }

    /** Every entry, in the order the identifiers were handed out. */
    entries(): JsIdentifierEntry[] {
        return [...this.byKey.values()];
    }

    private taken(identifier: string): boolean {
        return this.byIdentifier.has(identifier) || this.reserved.has(identifier)
            || JS_RESERVED_WORDS.has(identifier) || RUNTIME_NAMES.has(identifier);
    }
}
