/**
 * generatorFile — a generator as a JSON file, out of a metamodel and into one (P-2026-10-30-1430, P-2026-10-30-1515;
 * discovery_2026-10-30_generator_import_export).
 *
 * The file is `{format, formatVersion, metamodel, generator, entry, targetProfile, files, templates}`, in that order,
 * `entry` written when the generator has a root; a template is `{name, params, mode, body, target?}`. `mode` is always
 * written; on import `text` is kept and `expression` is stored with no `mode` (R-GEN-25), so a round trip keeps the
 * stored bytes. `entry` is the generator's `root`, `targetProfile` its `target` (`js` or `none`, R-GEN-34), `files`
 * its declared output files. Export all is a JSON array of such objects; import reads one object or an array. Bodies
 * go through `JSON.stringify` verbatim; files are indented by two spaces and end with one newline.
 *
 * On import `metamodel`, `entry`, `targetProfile` and `files` may be absent: absent metadata is resolved by the
 * generator codec's own rules (R-GEN-33), through a synthetic `genGenerators` record decoded by `decodeGenerators`,
 * once the generator the file lands in is known (the default resolves as the default does, any other as another).
 * Unknown fields are ignored and reported once as a note.
 *
 * Validation runs on every generator of the file before any write and reports everything at once: the file's shape
 * (format, major version 1, names, lists), the template records by the template codec's own checks
 * (`decodeTemplates`), the names and bodies by the engine's own registration (`registerTemplates`: not an identifier,
 * a JjEL builtin, a duplicate, a parse error with its line and column, `with … do`), and an entry or a file entry
 * that names no template of the file. A call to a bare name that is neither a parameter, a bound variable, a JjEL
 * builtin nor a template of the generator is a warning; everything else is an error.
 *
 * `planImport` turns the generators of a file and the chosen target metamodels into one `generatorsPatch` per
 * metamodel (one `state` set, one undo step each): a generator whose name the metamodel already holds collides, and
 * is either replaced (its id and name kept) or imported under the first free name `<name> 2`, `<name> 3`, ...
 *
 * Pure: the engine and JjEL only.
 */

import { EvaluationContext, JjelEvaluator } from '../../jjel';
import type { JjelExpression } from '../../jjel';
import { decodeGenerators, DEFAULT_GENERATOR_ID, generatorsPatch, newGeneratorId } from './generatorCodec';
import type { GeneratorFile, GeneratorRecord, GeneratorTarget } from './generatorCodec';
import { OriginHost, TemplateSources } from './origin';
import { decodeTemplates, encodeTemplates } from './templateCodec';
import { modeOf, parseTemplateBody, registerTemplates } from './templates';
import type { TemplateMode, TemplateRecord } from './templates';

export const GENERATOR_FILE_FORMAT = 'jjodel-generator';
export const GENERATOR_FILE_VERSION = '1.0';

/** A `formatVersion` this reader accepts: major version 1, any minor. */
const ACCEPTED_VERSION = /^1(\.\d+)?$/;

const TOP_FIELDS = ['format', 'formatVersion', 'metamodel', 'generator', 'entry', 'targetProfile', 'files', 'templates'];
const TEMPLATE_FIELDS = ['name', 'params', 'mode', 'body', 'target'];

/** A template as the file writes it: the mode always explicit. */
export interface GeneratorDocumentTemplate {
    readonly name: string;
    readonly params: readonly string[];
    readonly mode: TemplateMode;
    readonly body: string;
    readonly target?: string;
}

/** One generator as the file writes it. (`GeneratorFile` is the codec's output file.) */
export interface GeneratorDocument {
    readonly format: string;
    readonly formatVersion: string;
    readonly metamodel: string;
    readonly generator: string;
    readonly entry?: string;
    readonly targetProfile: GeneratorTarget;
    readonly files: readonly GeneratorFile[];
    readonly templates: readonly GeneratorDocumentTemplate[];
}

/** A generator read from a file: its declared metadata only, the rest resolved when it lands (`resolveImported`). */
export interface ImportedGenerator {
    /** The metamodel name the file declares, when it does. */
    readonly metamodel?: string;
    readonly name: string;
    readonly root?: string;
    readonly files?: readonly GeneratorFile[];
    readonly target?: GeneratorTarget;
    readonly templates: readonly TemplateRecord[];
}

export type GeneratorProblemSeverity = 'error' | 'warning' | 'note';

export interface GeneratorFileProblem {
    readonly severity: GeneratorProblemSeverity;
    /** The generator's name (`#n`, its position, when it has none); `null` for the file itself. */
    readonly generator: string | null;
    readonly template?: string;
    /** Set for a parse error of a body: where in that body. */
    readonly line?: number;
    readonly column?: number;
    readonly message: string;
}

export interface DecodedGeneratorFile {
    /** The generators read, in file order; empty when the file is not JSON. */
    readonly generators: ImportedGenerator[];
    /** Errors first, then warnings, then notes. */
    readonly problems: GeneratorFileProblem[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

// ---------------------------------------------------------------- export

/** The file object of the generator `g` of the metamodel `metamodel`. */
export function generatorDocument(metamodel: string, g: GeneratorRecord): GeneratorDocument {
    return {
        format: GENERATOR_FILE_FORMAT,
        formatVersion: GENERATOR_FILE_VERSION,
        metamodel,
        generator: g.name,
        ...(g.root !== undefined ? { entry: g.root } : {}),
        targetProfile: g.target,
        files: g.files.map(f => ({ path: f.path, entry: f.entry })),
        templates: g.templates.map(t => ({
            name: t.name,
            params: [...t.params],
            mode: modeOf(t),
            body: t.body,
            ...(t.target !== undefined ? { target: t.target } : {}),
        })),
    };
}

/** The text of a file: one object, or an array for Export all. */
export function encodeGeneratorFile(docs: GeneratorDocument | readonly GeneratorDocument[]): string {
    return JSON.stringify(docs, null, 2) + '\n';
}

/** `<metamodel>.<generator>.generator.json`. */
export const generatorFileName = (metamodel: string, generator: string): string => `${metamodel}.${generator}.generator.json`;

/** `<project>.generators.json`. */
export const projectGeneratorsFileName = (project: string): string => `${project}.generators.json`;

// ---------------------------------------------------------------- import

/** The declared files of a file's generator: `undefined` when absent, `null` when not a list of distinct paths and entries. */
function readDeclaredFiles(v: unknown): GeneratorFile[] | undefined | null {
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

/** Bare-name calls of a parsed body that nothing binds: `bound` holds the parameters, binders add their variables. */
function freeCalls(node: unknown, bound: ReadonlySet<string>, out: string[]): void {
    if (Array.isArray(node)) {
        for (const n of node) freeCalls(n, bound, out);
        return;
    }
    if (!isRecord(node)) return;
    const with_ = (names: readonly string[]) => new Set([...bound, ...names]);
    switch (node.type) {
        case 'FunctionCall':
            if (typeof node.name === 'string' && !bound.has(node.name)) out.push(node.name);
            freeCalls(node.args, bound, out);
            return;
        case 'Lambda':
            freeCalls(node.body, with_(node.params as string[]), out);
            return;
        case 'ForAll': {
            freeCalls(node.collection, bound, out);
            const inner = with_([node.variable as string]);
            freeCalls(node.filter, inner, out);
            freeCalls(node.projection, inner, out);
            return;
        }
        case 'Exists':
            freeCalls(node.collection, bound, out);
            freeCalls(node.predicate, with_([node.variable as string]), out);
            return;
    }
    for (const [key, value] of Object.entries(node)) if (key !== 'location') freeCalls(value, bound, out);
}

/**
 * The engine's problems with the templates of one generator, and the calls that resolve to nothing: errors, then
 * warnings. `declared` is every template name the file lists, read or not, for the entry checks.
 */
export function validateGenerator(g: ImportedGenerator, declared: readonly string[] = g.templates.map(t => t.name)): GeneratorFileProblem[] {
    const errors: GeneratorFileProblem[] = [];
    const warnings: GeneratorFileProblem[] = [];
    const generator = g.name;
    const names = new Set(declared);
    if (g.root !== undefined && !names.has(g.root)) {
        errors.push({ severity: 'error', generator, message: `The entry '${g.root}' is not a template of the generator.` });
    }
    for (const f of g.files ?? []) {
        if (!names.has(f.entry)) errors.push({ severity: 'error', generator, message: `The file '${f.path}' has the entry '${f.entry}', which is not a template of the generator.` });
    }

    const ctx = new EvaluationContext();
    const evaluator = new JjelEvaluator(ctx);
    const builtins = new Set(ctx.allNames());
    const sources = new TemplateSources();
    const parses = new Map(g.templates.map(t => [t.name, parseTemplateBody(t)] as const));
    const set = registerTemplates(g.templates, ctx, evaluator, new OriginHost({}, sources), sources);
    for (const p of set.problems) {
        const isParseError = parses.get(p.template)?.errors.some(e => e.line === p.line && e.column === p.column && e.message === p.message);
        errors.push({ severity: 'error', generator, template: p.template, ...(isParseError ? { line: p.line, column: p.column } : {}), message: p.message });
    }

    const templates = new Set(g.templates.map(t => t.name));
    for (const t of g.templates) {
        const expr: JjelExpression | null | undefined = parses.get(t.name)?.expression;
        if (!expr) continue;
        const calls: string[] = [];
        freeCalls(expr, new Set(t.params), calls);
        for (const callee of new Set(calls)) {
            if (builtins.has(callee) || templates.has(callee)) continue;
            warnings.push({ severity: 'warning', generator, template: t.name, message: `${t.name} calls ${callee}(), which is not a template of the generator.` });
        }
    }
    return [...errors, ...warnings];
}

/** The generators of a file's text and every problem they have, nothing written. */
export function decodeGeneratorFile(text: string): DecodedGeneratorFile {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return { generators: [], problems: [{ severity: 'error', generator: null, message: 'The file is not JSON.' }] };
    }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    if (items.length === 0) return { generators: [], problems: [{ severity: 'error', generator: null, message: 'The file holds no generator.' }] };

    const problems: GeneratorFileProblem[] = [];
    const unknown: string[] = [];
    const generators: ImportedGenerator[] = [];
    items.forEach((item, index) => {
        if (!isRecord(item)) {
            problems.push({ severity: 'error', generator: null, message: `Item ${index + 1} of the file is not a generator.` });
            return;
        }
        const name = typeof item.generator === 'string' && item.generator !== '' ? item.generator : null;
        const label = name ?? `#${index + 1}`;
        const error = (message: string, template?: string) => problems.push({ severity: 'error', generator: label, ...(template !== undefined ? { template } : {}), message });
        let shaped = true;
        if (item.format !== GENERATOR_FILE_FORMAT) error(`The format is not ${GENERATOR_FILE_FORMAT}.`);
        if (typeof item.formatVersion !== 'string' || !ACCEPTED_VERSION.test(item.formatVersion)) {
            error(`The format version ${JSON.stringify(item.formatVersion ?? null)} is not 1.x.`);
        }
        if (name === null) { error(`The generator has no name.`); shaped = false; }
        if (item.metamodel !== undefined && typeof item.metamodel !== 'string') error(`The metamodel is not a name.`);
        if (item.entry !== undefined && (typeof item.entry !== 'string' || item.entry === '')) { error(`The entry is not a template name.`); shaped = false; }
        if (item.targetProfile !== undefined && item.targetProfile !== 'js' && item.targetProfile !== 'none') error(`The target profile is neither js nor none.`);
        const files = readDeclaredFiles(item.files);
        if (files === null) { error(`The files are not a list of distinct paths and entries.`); shaped = false; }
        if (!Array.isArray(item.templates)) { error(`The templates are not a list.`); shaped = false; }
        for (const key of Object.keys(item)) if (!TOP_FIELDS.includes(key)) unknown.push(`${label}: ${key}`);
        if (!shaped || name === null || !Array.isArray(item.templates)) return;

        const rawTemplates = item.templates as unknown[];
        const decoded = decodeTemplates(JSON.stringify({ v: 1, templates: rawTemplates }));
        for (const d of decoded.defects) {
            const prefix = d.name !== null ? `${d.name}: ` : '';
            const bare = prefix && d.message.startsWith(prefix) ? d.message.slice(prefix.length) : d.message;
            const message = bare.charAt(0).toUpperCase() + bare.slice(1);
            error(d.name !== null ? message : `Template ${(d.index ?? 0) + 1}: ${message}`, d.name ?? undefined);
        }
        rawTemplates.forEach(t => {
            if (!isRecord(t)) return;
            for (const key of Object.keys(t)) if (!TEMPLATE_FIELDS.includes(key)) unknown.push(`${label} › ${typeof t.name === 'string' ? t.name : '?'}: ${key}`);
        });
        const templates: TemplateRecord[] = decoded.templates.map(t => ({
            name: t.name,
            params: t.params,
            body: t.body,
            ...(t.mode === 'text' ? { mode: 'text' as const } : {}),
            ...(t.target !== undefined ? { target: t.target } : {}),
        }));
        const g: ImportedGenerator = {
            ...(typeof item.metamodel === 'string' ? { metamodel: item.metamodel } : {}),
            name,
            ...(typeof item.entry === 'string' ? { root: item.entry } : {}),
            ...(files ? { files } : {}),
            ...(item.targetProfile === 'js' || item.targetProfile === 'none' ? { target: item.targetProfile } : {}),
            templates,
        };
        const declared = rawTemplates.filter(isRecord).map(t => t.name).filter((n): n is string => typeof n === 'string');
        problems.push(...validateGenerator(g, declared));
        generators.push(g);
    });
    if (unknown.length > 0) problems.push({ severity: 'note', generator: null, message: `Ignored unknown fields: ${unknown.join(', ')}.` });
    const rank: Record<GeneratorProblemSeverity, number> = { error: 0, warning: 1, note: 2 };
    problems.sort((a, b) => rank[a.severity] - rank[b.severity]);
    return { generators, problems };
}

/**
 * The generator `g` lands as: id `id`, named `name`, its absent metadata resolved by the codec as a generator of that
 * id resolves it. The second member is what the codec refused, as messages (none for a validated file).
 */
export function resolveImported(g: ImportedGenerator, id: string, name: string = g.name): { generator: GeneratorRecord; defects: string[] } {
    const meta = {
        id,
        name,
        ...(g.root !== undefined ? { root: g.root } : {}),
        ...(g.files !== undefined ? { files: g.files } : {}),
        ...(g.target !== undefined ? { target: g.target } : {}),
    };
    const isDefault = id === DEFAULT_GENERATOR_ID;
    const raw = JSON.stringify({ v: 1, generators: [isDefault ? meta : { ...meta, templates: JSON.parse(encodeTemplates(g.templates)).templates }] });
    const decoded = decodeGenerators(isDefault ? encodeTemplates(g.templates) : undefined, raw);
    return { generator: decoded.generators[isDefault ? 0 : 1], defects: decoded.defects.map(d => d.message) };
}

// ---------------------------------------------------------------- plan

export type CollisionChoice = 'replace' | 'rename';

/** The two keys of a metamodel's bag, as stored. */
export interface StoredGenerators {
    readonly rawTemplates: string | null | undefined;
    readonly rawGenerators: string | null | undefined;
}

export interface ImportCollision {
    /** The index of the file's generator. */
    readonly index: number;
    readonly metamodelId: string;
    readonly existingId: string;
    readonly existingTemplates: number;
    /** The name «Import under a new name» gives it. */
    readonly newName: string;
}

export interface ImportWrite {
    readonly metamodelId: string;
    readonly patch: Record<string, string>;
}

export interface ImportPlan {
    readonly errors: string[];
    readonly collisions: ImportCollision[];
    /** One per metamodel that changes; empty when there is any error. */
    readonly writes: ImportWrite[];
    /** Where each generator of the file lands, in file order; empty when there is any error. */
    readonly imported: { readonly index: number; readonly metamodelId: string; readonly generatorId: string; readonly name: string }[];
}

/** `<name> 2`, `<name> 3`, ... the first that `taken` does not hold. */
function freeName(name: string, taken: ReadonlySet<string>): string {
    let n = 2;
    while (taken.has(`${name} ${n}`)) n++;
    return `${name} ${n}`;
}

/**
 * The writes that import `generators` into the metamodels `targets` (by index, `null` for none chosen). `stored`
 * gives a metamodel's keys, `choices` the answer to each collision (by index, `rename` when absent), `draftsOf` the
 * unsaved drafts of a generator's open tab: a generator with drafts is not replaced.
 */
export function planImport(
    generators: readonly ImportedGenerator[],
    targets: readonly (string | null | undefined)[],
    stored: (metamodelId: string) => StoredGenerators,
    choices: Readonly<Record<number, CollisionChoice>> = {},
    draftsOf: (metamodelId: string, generatorId: string) => number = () => 0,
): ImportPlan {
    const errors: string[] = [];
    const collisions: ImportCollision[] = [];
    const byMetamodel = new Map<string, number[]>();
    generators.forEach((g, index) => {
        const target = targets[index];
        if (!target) { errors.push(`${g.name}: choose a target metamodel.`); return; }
        byMetamodel.set(target, [...(byMetamodel.get(target) ?? []), index]);
    });

    const writes: ImportWrite[] = [];
    const imported: ImportPlan['imported'][number][] = [];
    for (const [metamodelId, indices] of byMetamodel) {
        const fileNames = indices.map(i => generators[i].name);
        const twice = [...new Set(fileNames.filter((n, i) => fileNames.indexOf(n) !== i))];
        for (const n of twice) errors.push(`${n}: the file holds two generators of this name for the same metamodel.`);
        if (twice.length > 0) continue;

        const keys = stored(metamodelId);
        let list: GeneratorRecord[] = [...decodeGenerators(keys.rawTemplates, keys.rawGenerators).generators];
        const taken = new Set([...list.map(g => g.name), ...fileNames]);
        for (const index of indices) {
            const g = generators[index];
            const existing = list.find(x => x.name === g.name);
            let id: string;
            let name = g.name;
            if (existing) {
                const newName = freeName(g.name, taken);
                collisions.push({ index, metamodelId, existingId: existing.id, existingTemplates: existing.templates.length, newName });
                if ((choices[index] ?? 'rename') === 'replace') {
                    if (draftsOf(metamodelId, existing.id) > 0) errors.push(`${g.name}: Save or discard the drafts in the Templates tab first.`);
                    id = existing.id;
                    name = existing.name;
                } else {
                    taken.add(newName);
                    id = newGeneratorId(list);
                    name = newName;
                }
            } else {
                id = newGeneratorId(list);
            }
            const { generator, defects } = resolveImported(g, id, name);
            for (const d of defects) errors.push(`${g.name}: ${d}`);
            list = existing && id === existing.id ? list.map(x => (x.id === id ? generator : x)) : [...list, generator];
            imported.push({ index, metamodelId, generatorId: id, name });
        }
        const patch = generatorsPatch(keys.rawTemplates, keys.rawGenerators, list);
        if (patch) writes.push({ metamodelId, patch });
    }
    imported.sort((a, b) => a.index - b.index);
    return errors.length > 0 ? { errors, collisions, writes: [], imported: [] } : { errors, collisions, writes, imported };
}
