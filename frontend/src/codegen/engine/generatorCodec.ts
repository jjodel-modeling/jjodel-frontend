/**
 * generatorCodec — the generators of a metamodel, as its bag stores them (slice G1, P-2026-10-24-0001; R-GEN-31,
 * R-GEN-32, R-GEN-33, discovery_2026-10-23_codegen_generator_viewpoint §4 option (c), §5).
 *
 * A generator is a record of the metamodel's `_state`, not a viewpoint nor a D-type (R-GEN-31). The template list of
 * the default generator is `genTemplates`, unmoved and read by the template codec (R-GEN-32): this module never
 * writes it but when the default's templates change. Every other generator, and the default's metadata, live in one
 * key `genGenerators`, a JSON string `{"v":1,"generators":[generator...]}`, a generator being `id`, `name`, `root`
 * when it has one, `files`, `target`, and `templates` for a generator other than the default, written in that order
 * and the default first, so the same generators give the same string. A generator's `templates` are in today's
 * record shape and decode by the template codec's own rules (`decodeTemplates`), one list per generator: two
 * generators may hold a template of the same name.
 *
 * Absent metadata reads as R-GEN-33 says: `root` the template `main`, else the first, else none; `files` one file
 * whose entry is the root, `main.js` for the default and named after the generator otherwise, none when there is no
 * root; `target` `js` for the default and `none` for the others. An absent `genGenerators` reads as the default
 * alone, so a 3.2 project is a one-generator project, and nothing writes the key until a Save changes a generator
 * (no migration, no write on open, discovery §5). Once written, the resolved metadata is the declared one.
 *
 * Decoding is tolerant, as the template codec's: a string that is not JSON, or has no `v` 1 and `generators` list,
 * is one defect on the key and only the default is read; a generator that is not a record, has no id, an id an
 * earlier one holds, no name, a root that is not a text, files that are not a list of paths and entries, a target
 * that is neither `js` nor `none`, or templates that are not a list, is one defect and the others decode; a template
 * that the template codec refuses is a defect of its own and its generator decodes without it. A default record's
 * `templates`, and unknown fields, are ignored.
 *
 * The writer is the existing `state` setter with the patch below, one `set_state`, one undo step per Save; this
 * module dispatches nothing. Pure: no import outside the engine.
 */

import { decodeTemplates, encodeTemplates, GEN_TEMPLATES_KEY, templatesPatch } from './templateCodec';
import type { TemplateDefect } from './templateCodec';
import type { TemplateRecord } from './templates';

type Lookup = Record<string, any>;

/** The bag key of the generators, on the metamodel, beside `genTemplates` (R-GEN-32). */
export const GEN_GENERATORS_KEY = 'genGenerators';

/** The id of the default generator, whose templates are `genTemplates`. */
export const DEFAULT_GENERATOR_ID = 'default';

/** The name of the default generator when nothing names it. */
export const DEFAULT_GENERATOR_NAME = 'Default';

/** The target profile a generator declares (R-GEN-34): `js` builds the JavaScript target, `none` builds none. */
export type GeneratorTarget = 'js' | 'none';

/** An output file: its path, and the template whose text it is. */
export interface GeneratorFile {
    readonly path: string;
    readonly entry: string;
}

/** A generator as decoded: its metadata resolved, its own template list (the default's being `genTemplates`). */
export interface GeneratorRecord {
    readonly id: string;
    readonly name: string;
    /** The entry template; absent when the list has no template and none is declared. */
    readonly root?: string;
    readonly files: readonly GeneratorFile[];
    readonly target: GeneratorTarget;
    readonly templates: readonly TemplateRecord[];
}

/** Why a generator, one of its templates, or the key, was not read. */
export interface GeneratorDefect {
    /** The generator's index in the stored list; `null` for the key itself and for the default's `genTemplates`. */
    readonly index: number | null;
    /** The generator's id when it is readable; `null` otherwise. */
    readonly id: string | null;
    /** Set when the defect is a template's: the template codec's own report. */
    readonly template?: TemplateDefect;
    readonly message: string;
}

export interface DecodedGenerators {
    /** The default first, then the others in stored order. Never empty. */
    readonly generators: GeneratorRecord[];
    readonly defects: GeneratorDefect[];
    /** False when either key is not: then that key's content is not read, and one defect says so. */
    readonly readable: boolean;
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

const isDefault = (g: { readonly id: string }) => g.id === DEFAULT_GENERATOR_ID;

/** The root a generator with no declared one reads: `main`, else the first template, else none. */
function fallbackRoot(templates: readonly TemplateRecord[]): string | undefined {
    return (templates.find(t => t.name === 'main') ?? templates[0])?.name;
}

/** The one file a generator with no declared files reads, named after it. */
function fallbackPath(id: string, name: string, target: GeneratorTarget): string {
    if (id === DEFAULT_GENERATOR_ID) return 'main.js';
    return `${name}.${target === 'js' ? 'js' : 'txt'}`;
}

function resolve(
    id: string, name: string, templates: readonly TemplateRecord[],
    root: string | undefined, files: readonly GeneratorFile[] | undefined, target: GeneratorTarget | undefined,
): GeneratorRecord {
    const t: GeneratorTarget = target ?? (id === DEFAULT_GENERATOR_ID ? 'js' : 'none');
    const r = root ?? fallbackRoot(templates);
    const f = files ?? (r !== undefined ? [{ path: fallbackPath(id, name, t), entry: r }] : []);
    return { id, name, ...(r !== undefined ? { root: r } : {}), files: f.map(x => ({ path: x.path, entry: x.entry })), target: t, templates };
}

/** The template records of a list, as the template codec writes them: one source for the field order. */
const templateList = (templates: readonly TemplateRecord[]): unknown[] => JSON.parse(encodeTemplates(templates)).templates;

/** The one string of the key: `v`, then the list, the default first, every record's fields in their fixed order. */
export function encodeGenerators(generators: readonly GeneratorRecord[]): string {
    const ordered = [...generators.filter(isDefault), ...generators.filter(g => !isDefault(g))];
    return JSON.stringify({
        v: 1,
        generators: ordered.map(g => ({
            id: g.id,
            name: g.name,
            ...(g.root !== undefined ? { root: g.root } : {}),
            files: g.files.map(f => ({ path: f.path, entry: f.entry })),
            target: g.target,
            ...(isDefault(g) ? {} : { templates: templateList(g.templates) }),
        })),
    });
}

/** The declared files of a stored generator, `undefined` when absent, `null` when not a list of paths and entries. */
function readFiles(v: unknown): GeneratorFile[] | undefined | null {
    if (v === undefined) return undefined;
    if (!Array.isArray(v)) return null;
    const files: GeneratorFile[] = [];
    const paths = new Set<string>();
    for (const item of v) {
        if (!isRecord(item) || typeof item.path !== 'string' || item.path === '' || typeof item.entry !== 'string' || item.entry === '') return null;
        if (paths.has(item.path)) return null;
        paths.add(item.path);
        files.push({ path: item.path, entry: item.entry });
    }
    return files;
}

/**
 * The generators of the two keys, the default first, and what could not be read. `undefined` and `null` are no key:
 * no `genTemplates` is a default with no template, no `genGenerators` is the default alone.
 */
export function decodeGenerators(rawTemplates: string | null | undefined, rawGenerators: string | null | undefined): DecodedGenerators {
    const own = decodeTemplates(rawTemplates);
    const defects: GeneratorDefect[] = own.defects.map(d => ({ index: null, id: DEFAULT_GENERATOR_ID, template: d, message: d.message }));
    const fallbackDefault = () => resolve(DEFAULT_GENERATOR_ID, DEFAULT_GENERATOR_NAME, own.templates, undefined, undefined, undefined);
    if (rawGenerators === undefined || rawGenerators === null) return { generators: [fallbackDefault()], defects, readable: own.readable };
    const unreadable = (message: string): DecodedGenerators => ({
        generators: [fallbackDefault()], defects: [...defects, { index: null, id: null, message }], readable: false,
    });
    let parsed: unknown;
    try {
        parsed = JSON.parse(rawGenerators);
    } catch {
        return unreadable('The generators are not JSON.');
    }
    const root = isRecord(parsed) ? parsed : null;
    if (!root || root.v !== 1 || !Array.isArray(root.generators)) return unreadable('The generators have no version 1 and no list.');
    let def = null as GeneratorRecord | null;
    const others: GeneratorRecord[] = [];
    const ids = new Set<string>();
    root.generators.forEach((item, index) => {
        const r = isRecord(item) ? item : null;
        const id = typeof r?.id === 'string' && r.id !== '' ? r.id : null;
        const defect = (message: string) => defects.push({ index, id, message });
        if (!r) return defect('Not a generator.');
        if (id === null) return defect('No id.');
        if (ids.has(id)) return defect(`${id}: the id is taken by an earlier one.`);
        if (typeof r.name !== 'string' || r.name === '') return defect(`${id}: no name.`);
        if (r.root !== undefined && (typeof r.root !== 'string' || r.root === '')) return defect(`${id}: the root is not a template name.`);
        const files = readFiles(r.files);
        if (files === null) return defect(`${id}: the files are not a list of distinct paths and entries.`);
        if (r.target !== undefined && r.target !== 'js' && r.target !== 'none') return defect(`${id}: the target is neither js nor none.`);
        const target = r.target as GeneratorTarget | undefined;
        const rootName = r.root as string | undefined;
        if (id === DEFAULT_GENERATOR_ID) {
            ids.add(id);
            def = resolve(id, r.name, own.templates, rootName, files, target);
            return;
        }
        if (r.templates !== undefined && !Array.isArray(r.templates)) return defect(`${id}: the templates are not a list.`);
        ids.add(id);
        const decoded = decodeTemplates(JSON.stringify({ v: 1, templates: r.templates ?? [] }));
        decoded.defects.forEach(d => defects.push({ index, id, template: d, message: `${id}: ${d.message}` }));
        others.push(resolve(id, r.name, decoded.templates, rootName, files, target));
    });
    return { generators: [def ?? fallbackDefault(), ...others], defects, readable: own.readable };
}

/**
 * What a Save writes: one `state` assignment holding `genTemplates` only when the default's templates change, and
 * `genGenerators` only when a generator's metadata or a non-default list changes; `null` when nothing changes. Never
 * a removed key: an emptied list is written `[]` (the `templatesPatch` contract). The comparison is with the keys
 * as decoded, so a key whose bytes differ from the canonical ones, or that holds a defect, keeps them when its part
 * is unchanged. `next` without a default keeps the stored one.
 */
export function generatorsPatch(
    rawTemplates: string | null | undefined, rawGenerators: string | null | undefined, next: readonly GeneratorRecord[],
): Record<string, string> | null {
    const current = decodeGenerators(rawTemplates, rawGenerators).generators;
    const currentDefault = current.find(isDefault)!;
    const nextDefault = next.find(isDefault) ?? currentDefault;
    const list = next.some(isDefault) ? next : [currentDefault, ...next];
    const patch: Record<string, string> = {};
    if (encodeTemplates(nextDefault.templates) !== encodeTemplates(currentDefault.templates)) {
        const t = templatesPatch(rawTemplates, nextDefault.templates);
        if (t) Object.assign(patch, t);
    }
    const encoded = encodeGenerators(list);
    if (encoded !== encodeGenerators(current)) patch[GEN_GENERATORS_KEY] = encoded;
    return Object.keys(patch).length ? patch : null;
}

const stored = (raw: unknown): string | null | undefined =>
    typeof raw === 'string' ? raw : raw === undefined || raw === null ? raw : String(raw);

/** The generators stored on the metamodel `metamodelId`, from its `_state`. */
export function readGenerators(lookup: Lookup, metamodelId: string): DecodedGenerators {
    const bag = lookup[metamodelId]?._state;
    return decodeGenerators(stored(bag?.[GEN_TEMPLATES_KEY]), stored(bag?.[GEN_GENERATORS_KEY]));
}

/** The generators of the metamodel the model `modelId` is an instance of. */
export function readModelGenerators(lookup: Lookup, modelId: string): DecodedGenerators {
    const metamodelId = lookup[modelId]?.instanceof;
    return typeof metamodelId === 'string' ? readGenerators(lookup, metamodelId) : decodeGenerators(undefined, undefined);
}

/** An id no generator of `list` holds: `g1`, `g2`, ... */
export function newGeneratorId(list: readonly { readonly id: string }[]): string {
    const ids = new Set(list.map(g => g.id));
    let n = 1;
    while (ids.has(`g${n}`)) n++;
    return `g${n}`;
}

/** The list with the generator `id` named `name`; the list itself when there is no such generator or the name is empty. */
export function renameGenerator(list: readonly GeneratorRecord[], id: string, name: string): readonly GeneratorRecord[] {
    if (name === '' || !list.some(g => g.id === id)) return list;
    return list.map(g => (g.id === id ? { ...g, name } : g));
}

/** The list without the generator `id`; the list itself for the default, which is never removed, or an unknown id. */
export function removeGenerator(list: readonly GeneratorRecord[], id: string): readonly GeneratorRecord[] {
    if (id === DEFAULT_GENERATOR_ID || !list.some(g => g.id === id)) return list;
    return list.filter(g => g.id !== id);
}

/** The list with a new generator `name` at its end: no template, target `none`, one file named after it, entry `main`. */
export function addGenerator(list: readonly GeneratorRecord[], name: string): readonly GeneratorRecord[] {
    const id = newGeneratorId(list);
    return [...list, { id, name, files: [{ path: fallbackPath(id, name, 'none'), entry: 'main' }], target: 'none', templates: [] }];
}
