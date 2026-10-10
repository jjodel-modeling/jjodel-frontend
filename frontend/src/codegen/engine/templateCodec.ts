/**
 * templateCodec — the templates of a metamodel, as its bag stores them (slice S2, R-GEN-3, R-GEN-12; spec §3,
 * discovery §C, U2).
 *
 * The templates of a metamodel live in one key of its `_state` bag, `genTemplates`, the bag that holds the STC
 * roles they read (R-GEN-7), whose value is a JSON string, as `runScenarios` and `runWatches` are
 * (model/simulation/scenarioCodec.ts): `{"v":1,"templates":[template...]}`, a template being `name`, `params`,
 * `body`, and `target` when it has one, written in that order, so the same templates give the same string. The key
 * is not a `sim*` key on purpose: `runSignature` folds every `sim*` key of the bag (simBridge.ts), so an edit would
 * interrupt a run.
 *
 * A metamodel with no templates has no key, and nothing writes one until a template is saved (`templatesPatch`); a
 * stored list emptied is written `[]`, never removed: the undo of a removed bag key does not restore it (R-SIM-99).
 * The writer is S5's, through the existing `state` setter, with the patch below; this module dispatches nothing.
 *
 * Decoding is tolerant, template by template: a string that is not JSON, or has no `v` 1 and `templates` list, is
 * one defect on the key and the list is not readable; a template that is not a record, has no name, a name an
 * earlier one holds, params that are not a list of strings, a body that is not a text, or a target that is not a
 * text, is a defect of its own and the others decode. Unknown fields are ignored. No VersionFixer step and no
 * `irVersion`: a project saved before the key has none, and unknown keys survive save and load (discovery §C.3).
 * The `.ecore` export drops the whole bag, the STC roles with it (discovery §C.4).
 *
 * Pure: no import outside the engine.
 */

import type { TemplateRecord } from './templates';

type Lookup = Record<string, any>;

/** The bag key of the templates, on the metamodel (C.6). */
export const GEN_TEMPLATES_KEY = 'genTemplates';

/** Why a stored template, or the key, was not read: `index` is the template's, `null` for the key. */
export interface TemplateDefect {
    readonly index: number | null;
    /** The template's name when it is readable; `null` otherwise. */
    readonly name: string | null;
    readonly message: string;
}

export interface DecodedTemplates {
    readonly templates: TemplateRecord[];
    readonly defects: TemplateDefect[];
    /** False when the key itself is not: then there is no template and one defect. */
    readonly readable: boolean;
}

/** The one string of the key: `v`, then the list, every record's fields in their fixed order. */
export function encodeTemplates(templates: readonly TemplateRecord[]): string {
    return JSON.stringify({
        v: 1,
        templates: templates.map(t => ({ name: t.name, params: [...t.params], body: t.body, ...(t.target !== undefined ? { target: t.target } : {}) })),
    });
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** The templates of the key, in order, and what could not be read. `undefined` and `null` are no key: no template, no defect. */
export function decodeTemplates(raw: string | null | undefined): DecodedTemplates {
    if (raw === undefined || raw === null) return { templates: [], defects: [], readable: true };
    const unreadable = (message: string): DecodedTemplates => ({ templates: [], defects: [{ index: null, name: null, message }], readable: false });
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return unreadable('The templates are not JSON.');
    }
    const root = isRecord(parsed) ? parsed : null;
    if (!root || root.v !== 1 || !Array.isArray(root.templates)) return unreadable('The templates have no version 1 and no list.');
    const templates: TemplateRecord[] = [];
    const defects: TemplateDefect[] = [];
    const names = new Set<string>();
    root.templates.forEach((item, index) => {
        const r = isRecord(item) ? item : null;
        const name = typeof r?.name === 'string' && r.name !== '' ? r.name : null;
        const defect = (message: string) => defects.push({ index, name, message });
        if (!r) return defect('Not a template.');
        if (name === null) return defect('No name.');
        if (names.has(name)) return defect(`${name}: the name is taken by an earlier one.`);
        if (!Array.isArray(r.params) || r.params.some(p => typeof p !== 'string')) return defect(`${name}: the parameters are not a list of names.`);
        if (typeof r.body !== 'string') return defect(`${name}: the body is not a text.`);
        if (r.target !== undefined && typeof r.target !== 'string') return defect(`${name}: the target is not a text.`);
        names.add(name);
        templates.push({ name, params: [...(r.params as string[])], body: r.body, ...(typeof r.target === 'string' ? { target: r.target } : {}) });
    });
    return { templates, defects, readable: true };
}

/**
 * What a save or a delete writes: one `state` assignment holding the key alone, so one `set_state`, one
 * TRANSACTION and one undo step; `null` when there is nothing to write, the list being the stored one, or empty on a
 * metamodel that has no key, which keeps its bytes. `raw` is the key as stored, `null` or `undefined` when absent.
 */
export function templatesPatch(raw: string | null | undefined, templates: readonly TemplateRecord[]): Record<string, string> | null {
    const absent = raw === undefined || raw === null;
    if (absent && templates.length === 0) return null;
    const encoded = encodeTemplates(templates);
    return encoded === raw ? null : { [GEN_TEMPLATES_KEY]: encoded };
}

/** The templates stored on the metamodel `metamodelId`, from its `_state`. */
export function readTemplates(lookup: Lookup, metamodelId: string): DecodedTemplates {
    const raw = lookup[metamodelId]?._state?.[GEN_TEMPLATES_KEY];
    return decodeTemplates(typeof raw === 'string' ? raw : raw === undefined || raw === null ? raw : String(raw));
}

/** The templates of the metamodel the model `modelId` is an instance of. */
export function readModelTemplates(lookup: Lookup, modelId: string): DecodedTemplates {
    const metamodelId = lookup[modelId]?.instanceof;
    return typeof metamodelId === 'string' ? readTemplates(lookup, metamodelId) : decodeTemplates(undefined);
}
