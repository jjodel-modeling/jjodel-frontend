/**
 * bindingCodec — the ontological instantiation bindings of a metamodel, as its bag stores them (R-OI-2, R-OI-7,
 * R-OI-8; discovery 2026-10-20 §3.1, §3.7, slice S1).
 *
 * The relation lives in one key of the metamodel's `_state` bag, `ontoBindings`, whose value is a JSON string:
 * `{"v":1,"bindings":[binding...]}`. A binding is a named record of roles; every id in it is an M2 id (a class,
 * reference or attribute of the metamodel). A second application of the relation (links, a third level) is a second
 * record; the first is not touched. The key is not a `sim*` key on purpose: `runSignature` folds every `sim*` key of
 * the bag (simBridge.ts), so an edit would interrupt a run (model/simulation/__tests__/watchCodec.test.ts pins it).
 *
 * Decoding judges the SHAPE only: the types of the fields, not whether an id exists in the metamodel nor whether the
 * four slot roles come together (both are bindingCheck.ts's, so that a stored record that breaks a rule is still
 * readable and can be shown and mended). A root or a record that has a key this version does not know keeps it, and
 * `encode` writes it back; an unknown `v` is refused, never guessed at. No VersionFixer step: a project saved before
 * the key has none, and unknown bag keys survive save and load.
 *
 * Pure: no import. The `.ecore` export drops the whole bag, as it drops the Simulation roles.
 */

/** The bag key of the bindings, on the metamodel. */
export const ONTO_BINDINGS_KEY = 'ontoBindings';

/** The closure over the generalization: through a Generalization object (`via`, then `general`), or one reference. */
export type OntoGeneralization =
    | { via: string; general: string; [unknown: string]: unknown }
    | { direct: string; [unknown: string]: unknown };

/** How a primitive type becomes a literal value: the literal metaclass to create and the feature that holds it. */
export interface OntoValueKind {
    /** `primitive:<TypeName>`, or `instance`. */
    when: string;
    /** M2 class id of the literal (or value) metaclass. */
    create: string;
    /** M2 feature id (attribute or reference) of that metaclass that holds the value. */
    field: string;
    [unknown: string]: unknown;
}

export interface OntoBinding {
    name: string;
    /** Instance to classifier; owned by the instance metaclass. */
    typeReference: string;
    /** Classifier to property; owned by the instantiable classifier metaclass. */
    featureContainer?: string;
    generalization?: OntoGeneralization;
    /** Instance to slot. */
    slotContainer?: string;
    /** Slot to property. */
    definingFeature?: string;
    /** Slot to its value (a reference or an attribute). */
    valueHolder?: string;
    abstractFlag?: string;
    featureType?: string;
    defaultValue?: string;
    valueKinds?: OntoValueKind[];
    [unknown: string]: unknown;
}

export interface OntoBindings {
    v: 1;
    bindings: OntoBinding[];
    [unknown: string]: unknown;
}

export type DecodedOntoBindings =
    | { ok: true; value: OntoBindings }
    | { ok: false; errors: string[] };

/** The optional single-id roles, in the order a record is written. */
const ID_ROLES = ['featureContainer', 'slotContainer', 'definingFeature', 'valueHolder', 'abstractFlag', 'featureType', 'defaultValue'] as const;
const KNOWN_KEYS = new Set<string>(['name', 'typeReference', 'generalization', 'valueKinds', ...ID_ROLES]);

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isId = (v: unknown): v is string => typeof v === 'string' && v !== '';

/** The keys of `r` not in `known`, in their original order. */
function extrasOf(r: Record<string, unknown>, known: ReadonlySet<string>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(r)) if (!known.has(k)) out[k] = r[k];
    return out;
}

function decodeGeneralization(r: Record<string, unknown>, at: string, errors: string[]): OntoGeneralization | undefined {
    const hasDirect = 'direct' in r;
    const hasVia = 'via' in r || 'general' in r;
    if (hasDirect === hasVia) {
        errors.push(`${at}: needs either direct, or via and general.`);
        return undefined;
    }
    if (hasDirect) {
        if (!isId(r.direct)) { errors.push(`${at}.direct: not an id.`); return undefined; }
        return { direct: r.direct, ...extrasOf(r, new Set(['direct'])) };
    }
    if (!isId(r.via) || !isId(r.general)) { errors.push(`${at}: via and general must both be ids.`); return undefined; }
    return { via: r.via, general: r.general, ...extrasOf(r, new Set(['via', 'general'])) };
}

function decodeValueKinds(list: unknown, at: string, errors: string[]): OntoValueKind[] | undefined {
    if (!Array.isArray(list)) { errors.push(`${at}: not a list.`); return undefined; }
    const out: OntoValueKind[] = [];
    list.forEach((k, i) => {
        if (!isRecord(k)) return void errors.push(`${at}[${i}]: not a record.`);
        if (!isId(k.when) || !isId(k.create) || !isId(k.field)) return void errors.push(`${at}[${i}]: when, create and field must be ids.`);
        out.push({ when: k.when, create: k.create, field: k.field, ...extrasOf(k, new Set(['when', 'create', 'field'])) });
    });
    return out;
}

function decodeBinding(item: unknown, index: number, errors: string[]): OntoBinding | undefined {
    const at = `bindings[${index}]`;
    if (!isRecord(item)) { errors.push(`${at}: not a record.`); return undefined; }
    const before = errors.length;
    if (!isId(item.name)) errors.push(`${at}.name: no name.`);
    if (!isId(item.typeReference)) errors.push(`${at}.typeReference: no type reference.`);
    for (const role of ID_ROLES) {
        if (item[role] !== undefined && !isId(item[role])) errors.push(`${at}.${role}: not an id.`);
    }
    let generalization: OntoGeneralization | undefined;
    if (item.generalization !== undefined) {
        if (isRecord(item.generalization)) generalization = decodeGeneralization(item.generalization, `${at}.generalization`, errors);
        else errors.push(`${at}.generalization: not a record.`);
    }
    const valueKinds = item.valueKinds !== undefined ? decodeValueKinds(item.valueKinds, `${at}.valueKinds`, errors) : undefined;
    if (errors.length > before) return undefined;

    const out: OntoBinding = { name: item.name as string, typeReference: item.typeReference as string };
    if (item.featureContainer !== undefined) out.featureContainer = item.featureContainer as string;
    if (generalization) out.generalization = generalization;
    for (const role of ID_ROLES) if (role !== 'featureContainer' && item[role] !== undefined) out[role] = item[role] as string;
    if (valueKinds) out.valueKinds = valueKinds;
    return { ...out, ...extrasOf(item, KNOWN_KEYS) };
}

/**
 * The bindings of the key. `raw` is the bag value: the JSON string, or the parsed record. `undefined` and `null` are
 * no key: no binding, no error. Any defect makes the whole key unreadable, with every defect listed.
 */
export function decodeOntoBindings(raw: unknown): DecodedOntoBindings {
    if (raw === undefined || raw === null) return { ok: true, value: { v: 1, bindings: [] } };
    let parsed: unknown = raw;
    if (typeof raw === 'string') {
        try {
            parsed = JSON.parse(raw);
        } catch {
            return { ok: false, errors: ['The bindings are not JSON.'] };
        }
    }
    if (!isRecord(parsed)) return { ok: false, errors: ['The bindings are not a record.'] };
    if (parsed.v !== 1) return { ok: false, errors: [`Unknown version ${JSON.stringify(parsed.v)}: only 1 is read.`] };
    if (!Array.isArray(parsed.bindings)) return { ok: false, errors: ['The bindings have no list.'] };
    const errors: string[] = [];
    const bindings: OntoBinding[] = [];
    parsed.bindings.forEach((item, index) => {
        const b = decodeBinding(item, index, errors);
        if (b) bindings.push(b);
    });
    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, value: { v: 1, bindings, ...extrasOf(parsed, new Set(['v', 'bindings'])) } };
}

/** The one string of the key: `v`, then the list, then the root's unknown keys. */
export function encodeOntoBindings(value: OntoBindings): string {
    const { v, bindings, ...rest } = value;
    return JSON.stringify({ v, bindings, ...rest });
}
