/**
 * stateAttributesCodec — the declared state attributes in the M2 bag (lane C1,
 * R-SIM-19, R-SIM-67, R-SIM-68).
 *
 * The declarations live in one additive key of the bag, `simStateAttributes`,
 * whose value is a JSON string, as `simProfile` is (R-SIM-55):
 * `{"v":1,"attrs":[record...]}`. A record is `name`, `metaclass` (a DClass
 * pointer, `null` for a global), `space`, `domain` (as `netTypes.ts` defines it,
 * `null` for presentation) and `initial`, the JjEL literal text of the initial
 * value (`0`, `true`, `'red'`, `A`), written in that order: `runSignature`
 * compares the raw string, so the same declarations must give the same string.
 * The empty set is `attrs: []`, never `undefined` on the key.
 *
 * A derived record (lane C2, R-SIM-72, R-SIM-75) has `equation`, the JjEL text
 * of its value, in the place of `initial`: exactly one of the two, both being
 * the defect `exclusive` and neither a record defect. The rows and the encoder
 * carry `equation`, so an edit of the panel's table keeps it (report §4.5 of
 * docs/discovery/discovery_2026-09-27_sim_derived_attributes.md).
 *
 * An input record (R-SIM-88) has `"input":true` in the place of both: semantic
 * only, and one of `initial` or `equation` beside it is `exclusive`.
 *
 * Decoding is tolerant, record by record (R-SIM-68): a malformed record is a
 * defect of its own and the others decode; a string that is not JSON, or has no
 * `v` and `attrs`, is one defect on the key, never a silent empty set. Unknown
 * fields are ignored.
 *
 * A model (M1) carries the same key in its own bag for its globals (R-SIM-94):
 * `mergeDeclarations` gives the run the metamodel's list with the model's
 * globals over it, by name; a model record naming a metaclass is a record defect.
 *
 * Pure: JjEL's parser for the initial literal, and the types of the core.
 */

import { parseExpressionStrict } from '../../jjel/parser';
import { inDomain } from './netStep';
import type { DeclarationDefect, Domain, SimValue, StateAttributeDecl } from './netTypes';

/** The bag key (R-SIM-67). */
export const STATE_ATTRIBUTES_KEY = 'simStateAttributes';

/**
 * A record as stored: the initial value is its JjEL literal text (question 14 of the report).
 * A derived record carries `equation` and has `initial` `''` as a row.
 */
export interface StateAttributeRecord {
    readonly name: string;
    readonly metaclass: string | null;
    readonly space: 'semantic' | 'presentation';
    readonly domain: Domain | null;
    readonly initial: string;
    readonly equation?: string;
    /** An input variable (R-SIM-88): no initial (`''` as a row), no equation. */
    readonly input?: true;
}

/** A domain with its fields in a fixed order, `null` when it is none of the three. */
function domainOf(raw: unknown): Domain | null {
    if (!raw || typeof raw !== 'object') return null;
    const d = raw as Record<string, unknown>;
    switch (d.kind) {
        case 'boolean':
            return { kind: 'boolean' };
        case 'range':
            return typeof d.min === 'number' && Number.isFinite(d.min) && typeof d.max === 'number' && Number.isFinite(d.max)
                ? { kind: 'range', min: d.min, max: d.max }
                : null;
        case 'enum':
            return Array.isArray(d.literals) && d.literals.every(l => typeof l === 'string')
                ? { kind: 'enum', literals: [...d.literals as string[]] }
                : null;
        default:
            return null;
    }
}

/**
 * The one string of the key: `{"v":1,"attrs":[...]}`, every record's fields in the order of R-SIM-67,
 * the last one `equation` for a derived record, `input` for an input (R-SIM-88), `initial` otherwise.
 */
export function encodeStateAttributes(records: readonly StateAttributeRecord[]): string {
    return JSON.stringify({
        v: 1,
        attrs: records.map(r => ({
            name: r.name, metaclass: r.metaclass, space: r.space, domain: domainOf(r.domain),
            ...(r.equation !== undefined ? { equation: r.equation } : r.input === true ? { input: true } : { initial: r.initial }),
        })),
    });
}

/**
 * The value of a JjEL literal (questions 14, 15): a boolean, a number, a
 * negative number, a quoted string, or a free identifier, which is an
 * enumeration literal and reads as its name. `null` for anything else.
 */
export function parseInitialLiteral(text: string): SimValue | null {
    const parsed = parseExpressionStrict(text);
    const e = parsed.expression;
    if (parsed.errors.length > 0 || !e) return null;
    if (e.type === 'Literal') return e.value;
    if (e.type === 'Unary' && e.operator === '-' && e.operand.type === 'Literal' && typeof e.operand.value === 'number') return -e.operand.value;
    if (e.type === 'Identifier') return e.name;
    return null;
}

/**
 * The initial value a domain starts at, as the JjEL text a record stores: `false` for a boolean, the
 * minimum for a range (`0`, `-3`), the first literal for an enumeration as a bare identifier (`A`), and
 * `''` for an enumeration with no literals yet, which stays a defect until it has one.
 */
export function defaultInitialOf(domain: Domain): string {
    switch (domain.kind) {
        case 'boolean': return 'false';
        case 'range': return String(domain.min);
        case 'enum': return domain.literals[0] ?? '';
    }
}

/**
 * The initial text of a stored row whose domain `prev` became `next` by an edit of a bound or of the
 * literals: the new domain's default when the text is not a value of the new domain, or is the previous
 * domain's default (it follows the minimum or the first literal); a value typed inside the domain stays.
 * A change of kind does not come here: it takes `defaultInitialOf` outright.
 */
export function initialFollowingDomain(initial: string, prev: Domain | null, next: Domain): string {
    const value = parseInitialLiteral(initial);
    const isValue = value !== null && inDomain(value, next);
    return !isValue || (prev !== null && initial === defaultInitialOf(prev)) ? defaultInitialOf(next) : initial;
}

/** The array of records, or why the key itself is unreadable. */
function recordsOf(raw: string): unknown[] | string {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return 'not JSON';
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return 'no v and attrs';
    const o = parsed as Record<string, unknown>;
    if (o.v === undefined || !Array.isArray(o.attrs)) return 'no v and attrs';
    if (o.v !== 1) return `version ${JSON.stringify(o.v)}`;
    return o.attrs;
}

/** One stored record: its declaration, or the first thing wrong with it. */
function decodeRecord(raw: unknown, index: number): StateAttributeDecl | DeclarationDefect {
    const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : null;
    const name = typeof r?.name === 'string' && r.name ? r.name : null;
    const defect = (message: string): DeclarationDefect => ({ index, name, code: 'record', message });
    if (!r) return defect('not a record');
    if (name === null) return defect('no name');
    if (!(r.metaclass === null || (typeof r.metaclass === 'string' && r.metaclass))) return defect('bad metaclass');
    if (r.space !== 'semantic' && r.space !== 'presentation') return defect('bad space');
    const domain = domainOf(r.domain);
    if (r.domain !== null && domain === null) return defect('bad domain');
    // An input has neither initial nor equation, and is semantic (R-SIM-88).
    if (r.input !== undefined) {
        if (r.input !== true) return defect('bad input');
        if (r.initial !== undefined) return { index, name, code: 'exclusive', message: 'input and initial' };
        if (r.equation !== undefined) return { index, name, code: 'exclusive', message: 'input and equation' };
        if (r.space !== 'semantic') return defect('an input is semantic');
        return { name, metaclass: r.metaclass as string | null, space: 'semantic', domain, input: true };
    }
    // Exactly one of initial and equation (R-SIM-72); the equation is compiled at Reset, not here.
    if (r.initial !== undefined && r.equation !== undefined) return { index, name, code: 'exclusive', message: 'initial and equation' };
    if (r.equation !== undefined) {
        if (typeof r.equation !== 'string' || r.equation.trim() === '') return defect('no equation text');
        return { name, metaclass: r.metaclass as string | null, space: r.space, domain, equation: r.equation };
    }
    if (r.initial === undefined) return defect('no initial or equation');
    const initial = typeof r.initial === 'string' ? parseInitialLiteral(r.initial) : null;
    if (initial === null) return defect('initial not a JjEL literal');
    return { name, metaclass: r.metaclass as string | null, space: r.space, domain, initial };
}

/**
 * The declarations of the key, and its defects (R-SIM-68). `undefined` is the
 * empty set. A record that fails is left out and reported with its index, and
 * its name when readable; the key that fails gives no declaration and one defect.
 */
export function decodeStateAttributes(raw: string | undefined): { decls: StateAttributeDecl[]; defects: DeclarationDefect[] } {
    if (raw === undefined) return { decls: [], defects: [] };
    const records = recordsOf(raw);
    if (typeof records === 'string') return { decls: [], defects: [{ index: null, name: null, code: 'key', message: records }] };
    const decls: StateAttributeDecl[] = [];
    const defects: DeclarationDefect[] = [];
    records.forEach((record, index) => {
        const out = decodeRecord(record, index);
        if ('code' in out) defects.push(out); else decls.push(out);
    });
    return { decls, defects };
}

/**
 * The records as the panel's table edits them: every stored record a row, a
 * malformed field replaced by its default so the row can be fixed, unknown
 * fields dropped. `readable` is false when the key itself is not, and then there
 * is no row. `undefined` is readable and empty.
 */
export function stateAttributeRows(raw: string | undefined): { rows: StateAttributeRecord[]; readable: boolean } {
    if (raw === undefined) return { rows: [], readable: true };
    const records = recordsOf(raw);
    if (typeof records === 'string') return { rows: [], readable: false };
    const rows = records.map((record): StateAttributeRecord => {
        const r = record && typeof record === 'object' ? record as Record<string, unknown> : {};
        const initial = r.initial;
        return {
            name: typeof r.name === 'string' ? r.name : '',
            metaclass: typeof r.metaclass === 'string' && r.metaclass ? r.metaclass : null,
            space: r.space === 'presentation' ? 'presentation' : 'semantic',
            domain: domainOf(r.domain),
            initial: typeof initial === 'string' ? initial : typeof initial === 'number' || typeof initial === 'boolean' ? String(initial) : '',
            ...(typeof r.equation === 'string' ? { equation: r.equation } : {}),
            ...(r.input === true ? { input: true as const } : {}),
        };
    });
    return { rows, readable: true };
}

/** What `decodeStateAttributes` gives: the declarations of one key, and its defects. */
export interface DecodedStateAttributes {
    readonly decls: readonly StateAttributeDecl[];
    readonly defects: readonly DeclarationDefect[];
}

/**
 * The declarations a run reads (R-SIM-94): the metamodel's, then the model's
 * globals. A model global shadows the metamodel's global of the same name, with
 * no defect, so a global declared in the metamodel is the default of every model
 * that does not declare its own; a metaclass-bound record of the metamodel is
 * never shadowed. A model record naming a metaclass is a record defect, left
 * out: a model declares globals only. `defects` holds those defects only, indexed
 * as the records of the model's key; the decoder's defects stay the caller's.
 * Pure: neither input is mutated.
 */
export function mergeDeclarations(
    metamodel: DecodedStateAttributes, model: DecodedStateAttributes,
): { decls: StateAttributeDecl[]; defects: DeclarationDefect[] } {
    // The decoder gives one declaration or one defect per record, in order: the declarations' record
    // indices are the ones no record defect holds.
    const dropped = new Set(model.defects.map(d => d.index));
    const globals: StateAttributeDecl[] = [];
    const defects: DeclarationDefect[] = [];
    let index = 0;
    for (const decl of model.decls) {
        while (dropped.has(index)) index++;
        if (decl.metaclass !== null) defects.push({ index, name: decl.name, code: 'record', message: 'a model declares globals only' });
        else globals.push(decl);
        index++;
    }
    const shadowed = new Set(globals.map(d => d.name));
    return {
        decls: [...metamodel.decls.filter(d => d.metaclass !== null || !shadowed.has(d.name)), ...globals],
        defects,
    };
}
