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
 * `elementIdTable` names the elements of a generated program (R-GEN-17, P-2026-10-11-1052): every element id is
 * written once, in one frozen table `const $ID = Object.freeze({ … })`, and everywhere else the program refers to
 * an element as `$ID.<identifier>`. The values stay the id strings, so the program computes what it computed when
 * it wrote the ids themselves.
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

/** The table of element ids a generated program declares once (R-GEN-17). */
export const ID_TABLE = '$ID';

const STRING_ESCAPES: Readonly<Record<string, string>> = { '\\': '\\\\', "'": "\\'", '\n': '\\n', '\r': '\\r', '\u2028': '\\u2028', '\u2029': '\\u2029' };

/** `s` as a JavaScript string literal in single quotes: backslash, quote and line terminators escaped. */
export function jsString(s: string): string {
    return `'${s.replace(/[\\'\n\r\u2028\u2029]/g, c => STRING_ESCAPES[c])}'`;
}

/** An element a generated program names: its id, its model name (a string with a letter or a digit counts), its metaclass. */
export interface JsElement {
    readonly id: string;
    readonly name?: unknown;
    readonly metaclass: string;
}

export interface JsIdTable {
    /** The expression naming each element, `$ID.<identifier>`, by id. */
    readonly refs: ReadonlyMap<string, string>;
    /** `const $ID = Object.freeze({ … });`, one element per line in the order given. */
    readonly declaration: string;
    /** The identifiers, and the way back from each to its id. */
    readonly identifiers: JsIdentifierTable;
}

/** A name a reader can use: once mangled, it still holds a letter or a digit. */
function usableName(name: unknown): name is string {
    return typeof name === 'string' && /[A-Za-z0-9]/.test(mangle(name));
}

/**
 * The `$ID` table of `elements`, in the order given (model order): each element's identifier is its name through
 * `mangle`, made unique by a `JsIdentifierTable` (`_2`, `_3`, … in that order); an element without a usable name is
 * `<metaclass>_<n>`, n counting such elements of its metaclass from 1, mangled and made unique the same way. An id
 * given twice keeps its first entry. Deterministic: the same elements in the same order give the same text.
 */
export function elementIdTable(elements: Iterable<JsElement>): JsIdTable {
    const identifiers = new JsIdentifierTable();
    const refs = new Map<string, string>();
    const unnamed = new Map<string, number>();
    const lines: string[] = [];
    for (const e of elements) {
        if (refs.has(e.id)) continue;
        let name: string;
        if (usableName(e.name)) {
            name = e.name;
        } else {
            const n = (unnamed.get(e.metaclass) ?? 0) + 1;
            unnamed.set(e.metaclass, n);
            name = `${e.metaclass}_${n}`;
        }
        const identifier = identifiers.identifierOf(e.id, name);
        refs.set(e.id, `${ID_TABLE}.${identifier}`);
        lines.push(`  ${identifier}: ${jsString(e.id)},`);
    }
    const declaration = lines.length === 0
        ? `const ${ID_TABLE} = Object.freeze({});`
        : [`const ${ID_TABLE} = Object.freeze({`, ...lines, '});'].join('\n');
    return { refs, declaration, identifiers };
}
