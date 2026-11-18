/**
 * exprBinding — the expression catalog of a metamodel, as its bag stores it (R-EXP-2, R-EXP-3, R-EXP-6, slice S1).
 *
 * The catalog lives in one key of the metamodel's `_state` bag, `exprBinding`, whose value is a JSON string:
 * `{"v":1,"parens":...,"slots":[...],"roles":[...],"sharing":{...}}`. Every class and feature in it is an M2 id. A viewpoint
 * activates the fold through its own `_state.exprFold` (R-EXP-4); it does not own the binding.
 *
 * Decoding judges the SHAPE only, and parses the pattern texts: whether an id exists is `mapIds`'s, so that a stored
 * record that went stale can still be shown and mended. The decoded value IS the original record, so a key this version
 * does not know survives `encode`; an unknown `v` is refused, never guessed at. `templates` (R-EXP-2's escape hatch) is
 * not implemented in S1: it is such a key. No VersionFixer step: a project saved before the key has none, and unknown bag
 * keys survive save and load.
 *
 * Pure: no import. `ExprMetamodelSketch` is the subset of `MetamodelSketch` (profileBinder.ts) that name resolution reads.
 */

/** The bag key of the catalog, on the metamodel. */
export const EXPR_BINDING_KEY = 'exprBinding';
/** The bag key that activates the fold, on the viewpoint. */
export const EXPR_FOLD_KEY = 'exprFold';

export type ExprParens = 'always' | 'minimal';
export type ExprRowParens = ExprParens | 'never';

/** A feature whose values fold into their owner's text (R-EXP-5). */
export interface ExprSlot {
    class: string;
    feature: string;
    caption?: string;
    [unknown: string]: unknown;
}

/** The pass that names repeated subexpressions (R-EXP-6). `host` is the class that shows the definitions. */
export interface ExprSharing {
    classes: string[];
    minLength: number;
    minCount: number;
    prefix: string;
    host?: string;
    [unknown: string]: unknown;
}

interface RoleRow {
    class: string;
    [unknown: string]: unknown;
}

export interface InfixRole extends RoleRow {
    role: 'infix';
    symbol: string;
    precedence: number;
    assoc: 'left' | 'right' | 'none';
    operands: [string, string];
    parens?: ExprRowParens;
}

export interface NaryRole extends RoleRow {
    role: 'nary';
    symbol: string;
    precedence: number;
    /** One many-valued feature. */
    operands: string;
    zero?: string;
}

export interface UnaryRole extends RoleRow {
    role: 'unary';
    symbol: string;
    operand: string;
    precedence?: number;
}

/** A literal typed by another feature: `true` and `false` are the texts that mean them, `other` wraps the rest in `{}`. */
export interface LiteralBooleanWhen {
    feature: string;
    class: string;
    true: string;
    false: string;
    other: string;
    [unknown: string]: unknown;
}

export interface LiteralRole extends RoleRow {
    role: 'literal';
    attribute: string;
    booleanWhen?: LiteralBooleanWhen;
}

export interface ReferenceRole extends RoleRow {
    role: 'reference';
    attribute: string;
    prefix?: string;
}

export interface CallRole extends RoleRow {
    role: 'call';
    name: string;
    args: string[];
}

export interface ConditionalRole extends RoleRow {
    role: 'conditional';
    cond: string;
    then: string;
    else: string;
    precedence?: number;
}

/** `cond` and `value` are features of `armClass`. An arm without a `cond` value prints in the mode `armMode`. */
export interface CaseRole extends RoleRow {
    role: 'case';
    arms: string;
    armClass: string;
    cond: string;
    value: string;
    otherwise: string;
    armMode?: string;
    open?: string;
    indent?: string;
    arrow?: string;
    elseLabel?: string;
    close?: string;
}

export interface BracketRole extends RoleRow {
    role: 'bracket';
    open: string;
    close: string;
    separator: string;
    items: string;
}

export type ExprFormCondition = { has: string } | { absent: string } | { plain: string } | { mode: string };

export interface ExprPatternForm {
    when?: ExprFormCondition[];
    text: string;
    [unknown: string]: unknown;
}

/** `args` maps the locals of the holes to feature ids. Either `text`, or `forms` of which the first that holds prints. */
export interface PatternRole extends RoleRow {
    role: 'pattern';
    args: Record<string, string>;
    text?: string;
    forms?: ExprPatternForm[];
}

export type ExprRole =
    | InfixRole | NaryRole | UnaryRole | LiteralRole | ReferenceRole
    | CallRole | ConditionalRole | CaseRole | BracketRole | PatternRole;

export interface ExprBinding {
    v: 1;
    parens: ExprParens;
    slots: ExprSlot[];
    roles: ExprRole[];
    sharing?: ExprSharing;
    [unknown: string]: unknown;
}

/** `null` is no key: no binding, no error. */
export type DecodedExprBinding =
    | { ok: true; value: ExprBinding | null }
    | { ok: false; errors: string[] };

export type MappedExprBinding =
    | { ok: true; value: ExprBinding }
    | { ok: false; errors: string[] };

export type PatternPart =
    | { kind: 'text'; text: string }
    | { kind: 'one'; arg: string; atom: boolean; fallback?: string }
    | { kind: 'truth'; arg: string; yes: string; no: string }
    | { kind: 'many'; arg: string; separator: string };

export interface ExprMetamodelSketch {
    classes: ReadonlyArray<{ id: string; name: string; supers: readonly string[] }>;
    attributes: ReadonlyArray<{ id: string; name: string; owner: string }>;
    references: ReadonlyArray<{ id: string; name: string; owner: string }>;
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isId = (v: unknown): v is string => typeof v === 'string' && v !== '';
const isText = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isIdList = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every(isId);
const isIdPair = (v: unknown): v is [string, string] => isIdList(v) && v.length === 2;
const oneOf = (...allowed: string[]) => (v: unknown): boolean => typeof v === 'string' && allowed.includes(v);

const HOLE = /^([A-Za-z_]\w*)(?:(\^)|!(.*)|\?([^|]*)\|(.*)|\*(.*))?$/s;

/**
 * The parts of a pattern text. Holes: `{x}`, `{x^}` (atom precedence), `{x!default}`, `{x?a|b}` (attribute truth),
 * `{x*sep}` (many); `{{` and `}}` are the braces.
 */
export function parsePattern(text: string): { parts: PatternPart[] } | { error: string } {
    const parts: PatternPart[] = [];
    let literal = '';
    const flush = (): void => {
        if (literal) parts.push({ kind: 'text', text: literal });
        literal = '';
    };
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if ((c === '{' || c === '}') && text[i + 1] === c) {
            literal += c;
            i++;
            continue;
        }
        if (c === '}') return { error: `unmatched } at ${i}` };
        if (c !== '{') {
            literal += c;
            continue;
        }
        const end = text.indexOf('}', i);
        if (end < 0) return { error: `unclosed { at ${i}` };
        const hole = text.slice(i + 1, end);
        const m = HOLE.exec(hole);
        if (!m) return { error: `bad hole {${hole}}` };
        flush();
        const arg = m[1];
        if (m[4] !== undefined) parts.push({ kind: 'truth', arg, yes: m[4], no: m[5] });
        else if (m[6] !== undefined) parts.push({ kind: 'many', arg, separator: m[6] });
        else if (m[3] !== undefined) parts.push({ kind: 'one', arg, atom: false, fallback: m[3] });
        else parts.push({ kind: 'one', arg, atom: m[2] !== undefined });
        i = end;
    }
    flush();
    return { parts };
}

interface Field {
    check: (v: unknown) => boolean;
    what: string;
    optional?: boolean;
}

const id: Field = { check: isId, what: 'not an id' };
const text: Field = { check: isText, what: 'not a text' };
const number: Field = { check: isNumber, what: 'not a number' };
const optional = (f: Field): Field => ({ ...f, optional: true });

const ROW_PARENS: Field = { check: oneOf('always', 'minimal', 'never'), what: 'not always, minimal or never', optional: true };

const ROLE_FIELDS: Record<string, Record<string, Field>> = {
    infix: {
        symbol: text, precedence: number, assoc: { check: oneOf('left', 'right', 'none'), what: 'not left, right or none' },
        operands: { check: isIdPair, what: 'not two ids' }, parens: ROW_PARENS,
    },
    nary: { symbol: text, precedence: number, operands: id, zero: optional(text) },
    unary: { symbol: text, operand: id, precedence: optional(number) },
    literal: { attribute: id },
    reference: { attribute: id, prefix: optional(text) },
    call: { name: id, args: { check: isIdList, what: 'not a non-empty list of ids' } },
    conditional: { cond: id, then: id, else: id, precedence: optional(number) },
    case: {
        arms: id, armClass: id, cond: id, value: id, otherwise: id, armMode: optional(text), open: optional(text),
        indent: optional(text), arrow: optional(text), elseLabel: optional(text), close: optional(text),
    },
    bracket: { open: text, close: text, separator: text, items: id },
    pattern: {},
};

function checkFields(r: Record<string, unknown>, fields: Record<string, Field>, at: string, errors: string[]): void {
    for (const [key, field] of Object.entries(fields)) {
        if (r[key] === undefined) {
            if (!field.optional) errors.push(`${at}.${key}: missing.`);
        } else if (!field.check(r[key])) {
            errors.push(`${at}.${key}: ${field.what}.`);
        }
    }
}

function checkPatternText(pattern: unknown, locals: Record<string, unknown>, at: string, errors: string[]): void {
    if (!isText(pattern)) return void errors.push(`${at}: not a text.`);
    const parsed = parsePattern(pattern);
    if ('error' in parsed) return void errors.push(`${at}: ${parsed.error}.`);
    for (const part of parsed.parts) {
        if (part.kind !== 'text' && !(part.arg in locals)) errors.push(`${at}: the hole ${part.arg} has no arg.`);
    }
}

function checkFormCondition(c: unknown, locals: Record<string, unknown>, at: string, errors: string[]): void {
    if (!isRecord(c)) return void errors.push(`${at}: not a record.`);
    const key = ['has', 'absent', 'plain', 'mode'].filter(k => k in c);
    if (key.length !== 1 || !isText(c[key[0]])) return void errors.push(`${at}: needs one of has, absent, plain, mode.`);
    if (key[0] !== 'mode' && !((c[key[0]] as string) in locals)) errors.push(`${at}: ${c[key[0]]} has no arg.`);
}

function checkPattern(r: Record<string, unknown>, at: string, errors: string[]): void {
    if (!isRecord(r.args) || !Object.values(r.args).every(isId)) return void errors.push(`${at}.args: not a record of ids.`);
    const locals = r.args;
    if ((r.text === undefined) === (r.forms === undefined)) return void errors.push(`${at}: needs either text or forms.`);
    if (r.text !== undefined) return checkPatternText(r.text, locals, `${at}.text`, errors);
    if (!Array.isArray(r.forms) || r.forms.length === 0) return void errors.push(`${at}.forms: not a non-empty list.`);
    r.forms.forEach((form, i) => {
        const formAt = `${at}.forms[${i}]`;
        if (!isRecord(form)) return void errors.push(`${formAt}: not a record.`);
        checkPatternText(form.text, locals, `${formAt}.text`, errors);
        if (form.when === undefined) return;
        if (!Array.isArray(form.when)) return void errors.push(`${formAt}.when: not a list.`);
        form.when.forEach((c, j) => checkFormCondition(c, locals, `${formAt}.when[${j}]`, errors));
    });
}

function checkBooleanWhen(w: unknown, at: string, errors: string[]): void {
    if (!isRecord(w)) return void errors.push(`${at}: not a record.`);
    checkFields(w, { feature: id, class: id, true: text, false: text, other: text }, at, errors);
}

function checkRole(item: unknown, index: number, errors: string[]): void {
    const at = `roles[${index}]`;
    if (!isRecord(item)) return void errors.push(`${at}: not a record.`);
    if (!isId(item.class)) errors.push(`${at}.class: not an id.`);
    if (typeof item.role !== 'string' || !Object.prototype.hasOwnProperty.call(ROLE_FIELDS, item.role)) {
        return void errors.push(`${at}.role: unknown role ${JSON.stringify(item.role)}.`);
    }
    checkFields(item, ROLE_FIELDS[item.role], at, errors);
    if (item.role === 'pattern') checkPattern(item, at, errors);
    if (item.role === 'literal' && item.booleanWhen !== undefined) checkBooleanWhen(item.booleanWhen, `${at}.booleanWhen`, errors);
}

function checkSlot(item: unknown, index: number, errors: string[]): void {
    const at = `slots[${index}]`;
    if (!isRecord(item)) return void errors.push(`${at}: not a record.`);
    checkFields(item, { class: id, feature: id, caption: optional(text) }, at, errors);
}

function checkSharing(item: unknown, errors: string[]): void {
    if (!isRecord(item)) return void errors.push('sharing: not a record.');
    checkFields(item, {
        classes: { check: isIdList, what: 'not a non-empty list of ids' }, minLength: number, minCount: number,
        prefix: { check: isId, what: 'not a non-empty text' }, host: optional(id),
    }, 'sharing', errors);
}

/**
 * The catalog of the key. `raw` is the bag value: the JSON string, or the parsed record. `undefined` and `null` are no
 * key. Any defect makes the whole key unreadable, with every defect listed.
 */
export function decodeExprBinding(raw: unknown): DecodedExprBinding {
    if (raw === undefined || raw === null) return { ok: true, value: null };
    let parsed: unknown = raw;
    if (typeof raw === 'string') {
        try {
            parsed = JSON.parse(raw);
        } catch {
            return { ok: false, errors: ['The binding is not JSON.'] };
        }
    }
    if (!isRecord(parsed)) return { ok: false, errors: ['The binding is not a record.'] };
    if (parsed.v !== 1) return { ok: false, errors: [`Unknown version ${JSON.stringify(parsed.v)}: only 1 is read.`] };
    const errors: string[] = [];
    if (parsed.parens !== 'always' && parsed.parens !== 'minimal') errors.push('parens: not always or minimal.');
    if (Array.isArray(parsed.slots)) parsed.slots.forEach((s, i) => checkSlot(s, i, errors));
    else errors.push('slots: not a list.');
    if (Array.isArray(parsed.roles)) parsed.roles.forEach((r, i) => checkRole(r, i, errors));
    else errors.push('roles: not a list.');
    if (parsed.sharing !== undefined) checkSharing(parsed.sharing, errors);
    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, value: parsed as ExprBinding };
}

/** The one string of the key, unknown keys included. */
export function encodeExprBinding(value: ExprBinding): string {
    return JSON.stringify(value);
}

/** The features of each role that hang off the role's own class; `case` adds two on `armClass`, `pattern` has its `args`. */
const ROLE_FEATURES: Record<string, readonly string[]> = {
    infix: ['operands'], nary: ['operands'], unary: ['operand'], literal: ['attribute'], reference: ['attribute'],
    call: ['args'], conditional: ['cond', 'then', 'else'], case: ['arms', 'otherwise'], bracket: ['items'], pattern: [],
};

/**
 * One walk over every class and feature of a catalog, used twice: name-to-id resolution of a binding file, and the
 * check that the ids of a stored one still exist. `feat` receives the mapped owner. Every defect is listed.
 */
export function mapIds(
    doc: ExprBinding,
    cls: (ref: string) => string | undefined,
    feat: (classId: string, ref: string) => string | undefined,
): MappedExprBinding {
    const errors: string[] = [];
    const unknownClasses = new Set<string>();
    const mapClass = (ref: string, at: string): string => {
        const mapped = cls(ref);
        if (mapped !== undefined) return mapped;
        unknownClasses.add(ref);
        errors.push(`${at}: unknown class ${ref}.`);
        return ref;
    };
    const mapFeature = (owner: string, ref: string, at: string): string => {
        if (unknownClasses.has(owner)) return ref;
        const mapped = feat(owner, ref);
        if (mapped === undefined) errors.push(`${at}: unknown feature ${ref}.`);
        return mapped ?? ref;
    };

    const mapRole = (r: ExprRole, at: string): ExprRole => {
        const owner = mapClass(r.class, `${at}.class`);
        const out: Record<string, unknown> = { ...r, class: owner };
        const generic = r as unknown as Record<string, string | string[]>;
        for (const key of ROLE_FEATURES[r.role]) {
            const v = generic[key];
            out[key] = Array.isArray(v)
                ? v.map((f, i) => mapFeature(owner, f, `${at}.${key}[${i}]`))
                : mapFeature(owner, v, `${at}.${key}`);
        }
        if (r.role === 'pattern') {
            out.args = Object.fromEntries(Object.entries(r.args).map(([k, f]) => [k, mapFeature(owner, f, `${at}.args.${k}`)]));
        }
        if (r.role === 'case') {
            const armClass = mapClass(r.armClass, `${at}.armClass`);
            out.armClass = armClass;
            out.cond = mapFeature(armClass, r.cond, `${at}.cond`);
            out.value = mapFeature(armClass, r.value, `${at}.value`);
        }
        if (r.role === 'literal' && r.booleanWhen) {
            const w = r.booleanWhen;
            out.booleanWhen = { ...w, feature: mapFeature(owner, w.feature, `${at}.booleanWhen.feature`), class: mapClass(w.class, `${at}.booleanWhen.class`) };
        }
        return out as ExprRole;
    };

    const slots = doc.slots.map((s, i) => {
        const owner = mapClass(s.class, `slots[${i}].class`);
        return { ...s, class: owner, feature: mapFeature(owner, s.feature, `slots[${i}].feature`) };
    });
    const roles = doc.roles.map((r, i) => mapRole(r, `roles[${i}]`));
    const out: ExprBinding = { ...doc, slots, roles };
    if (doc.sharing) {
        out.sharing = { ...doc.sharing, classes: doc.sharing.classes.map((c, i) => mapClass(c, `sharing.classes[${i}]`)) };
        if (doc.sharing.host !== undefined) out.sharing.host = mapClass(doc.sharing.host, 'sharing.host');
    }
    return errors.length > 0 ? { ok: false, errors } : { ok: true, value: out };
}

/** A binding file (names) as a stored catalog (M2 ids). A feature name resolves in the class and its lineage. */
export function resolveBindingNames(doc: ExprBinding, sketch: ExprMetamodelSketch): MappedExprBinding {
    const byName = new Map(sketch.classes.map(c => [c.name, c]));
    const byId = new Map(sketch.classes.map(c => [c.id, c]));
    const features = [...sketch.attributes, ...sketch.references];
    const lineage = (classId: string, seen: Set<string> = new Set()): Set<string> => {
        if (seen.has(classId)) return seen;
        seen.add(classId);
        for (const s of byId.get(classId)?.supers ?? []) lineage(s, seen);
        return seen;
    };
    return mapIds(
        doc,
        ref => byName.get(ref)?.id,
        (classId, ref) => {
            const owners = lineage(classId);
            return features.find(f => f.name === ref && owners.has(f.owner))?.id;
        },
    );
}
