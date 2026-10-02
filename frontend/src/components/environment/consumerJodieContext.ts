/**
 * consumerJodieContext — #168 lane A (J1, J2): what Jodie looks at, and what it may see, in the
 * stand-alone consumer (`?profile=`, see `consumerMode.ts`).
 *
 * J1. The consumer works in the Configurator page only; the Dock is mounted but hidden, so the
 * resolvers Jodie uses as a developer (`getActiveLevel` / `getActiveModel` / `getActiveMetamodel`)
 * read a state the consumer cannot see. Measured on 2026-10-01: on a fresh stand-alone load they
 * resolve nothing (Jodie sends every metamodel, the reply has no scope), and a metamodel tab opened
 * before `&profile=` becomes the artefact (the reply is stamped M2). Here the artefact is the
 * Configurator's selection: always an M1 model, the selected instance's own, otherwise the first
 * model of the selected type. The Configurator writes the selection with `setConsumerSelection`
 * and announces it with `EnvGenEvents.CONFIGURATOR_SELECTION_CHANGED`; the module keeps the last
 * one, so a Jodie that recomputes after the event still reads it.
 *
 * J2. `filterContextForProfile` rewrites the context envelope of `JjodieContextService
 * .getContextJSON` so that a type the profile marks `hidden` appears nowhere — classes,
 * superTypes, reference declarations, objects, `$ref`, conformance violations — and a `read` type
 * is marked. A coherence filter, not a security one (D1 of #157): the project state still reaches
 * the client.
 *
 * The envelope carries no class ids (`JsonModelService`: a classifier is `{ name, package?,
 * metamodel? }`, and the light metamodel document drops `id` altogether), so a class is matched by
 * (metamodel name, class name). Objects and `$ref` keep their ids and are matched by id. Two
 * same-named classes of one metamodel collapse to the stricter rule: the filter errs toward hiding.
 *
 * Importable by the `node` bench on purpose: `environmentConfig.ts` and `irReadCtx.ts` have no
 * imports and `instanceManagerModel.ts` imports `irReadCtx` only; nothing here reaches `joiner`.
 */
import { metamodelOfClass, modelsForType, resolveTypePermission } from '../../joiner/environmentConfig';
import type { EnvPermission } from '../../joiner/environmentConfig';
import { modelIdOfObject } from '../abstract/tabs/instanceManagerModel';
import { makeDrawReadCtx } from '../editor-v2/viewpoint/ir/irReadCtx';

type Idlookup = Record<string, any>;

// ── J1: the selection ───────────────────────────────────────────────────────

/** What the Configurator page has on screen. `modelId` is the model it resolves to
 *  (`consumerModelId`); Jodie re-resolves from the ids, so a deleted instance falls back. */
export interface ConsumerSelection {
    typeId: string | null;
    instanceId: string | null;
    modelId: string | null;
}

/** The artefact Jodie works on in the consumer: always an M1 model. Shaped like
 *  `ActiveArtifact` of `services/JjodieContext.ts`, restated so this module needs no import. */
export interface ConsumerArtifact {
    id: string;
    name: string;
    level: 'M1';
    metamodelId?: string;
}

let _selection: ConsumerSelection | null = null;

/** Written by the Configurator page (null when it unmounts). */
export function setConsumerSelection(selection: ConsumerSelection | null): void {
    _selection = selection ? { ...selection } : null;
}

/** The last selection the Configurator page wrote, or null. */
export function getConsumerSelection(): ConsumerSelection | null {
    return _selection;
}

/**
 * The model a selection works in: the instance's own model when it is one of the project's,
 * otherwise the first model of the type (`modelsForType`, the model the Configurator's «New»
 * creates in). Null when neither resolves.
 */
export function consumerModelId(
    idlookup: Idlookup,
    projectModelIds: readonly string[],
    typeId: string | null | undefined,
    instanceId: string | null | undefined,
): string | null {
    if (instanceId) {
        const own = modelIdOfObject(idlookup, instanceId);
        if (own && projectModelIds.includes(own)) return own;
    }
    return typeId ? (modelsForType(idlookup, projectModelIds, typeId)[0] ?? null) : null;
}

/**
 * The selection the Configurator publishes. An instance whose class is known and is not the
 * selected type is dropped: when the type changes, the effect that clears the instance has not
 * re-rendered yet, and for one commit the old instance sits next to the new type. A class not
 * known yet (`instanceof` lands deferred on a new instance) is kept.
 */
export function consumerSelectionOf(
    idlookup: Idlookup,
    projectModelIds: readonly string[],
    typeId: string | null,
    instanceId: string | null,
): ConsumerSelection {
    const iof = instanceId ? idlookup?.[instanceId]?.instanceof : undefined;
    const kept = instanceId && (typeof iof !== 'string' || iof === typeId) ? instanceId : null;
    return { typeId, instanceId: kept, modelId: consumerModelId(idlookup, projectModelIds, typeId, kept) };
}

/** The artefact of a selection, or undefined when the selection resolves no model. */
export function resolveConsumerArtifact(
    selection: ConsumerSelection | null | undefined,
    idlookup: Idlookup,
    projectModelIds: readonly string[],
): ConsumerArtifact | undefined {
    if (!selection) return undefined;
    const id = consumerModelId(idlookup, projectModelIds, selection.typeId, selection.instanceId);
    const model = id ? idlookup[id] : null;
    if (!id || !model) return undefined;
    const mm = model.instanceof;
    return { id, name: model.name ?? 'Unnamed', level: 'M1', metamodelId: typeof mm === 'string' ? mm : undefined };
}

/** The selection in words, for the chat line and the context: the type's name and the
 *  instance's (the Configurator list's rule, `makeDrawReadCtx.getName`). Null without a type. */
export function describeConsumerSelection(
    selection: ConsumerSelection | null | undefined,
    idlookup: Idlookup,
): { key: string; typeName: string; instanceName: string | null } | null {
    if (!selection?.typeId) return null;
    const typeName = idlookup?.[selection.typeId]?.name;
    if (typeof typeName !== 'string' || !typeName) return null;
    const instanceName = selection.instanceId && idlookup[selection.instanceId]
        ? (makeDrawReadCtx(idlookup).getName(selection.instanceId) ?? null)
        : null;
    return { key: `${selection.typeId}|${selection.instanceId ?? ''}`, typeName, instanceName };
}

/** The chat line for a new selection, with no jargon: «Now looking at: Scenario «Arco_0»». */
export function selectionNotice(described: { typeName: string; instanceName: string | null }): string {
    return described.instanceName
        ? `Now looking at: ${described.typeName} «${described.instanceName}»`
        : `Now looking at: ${described.typeName}`;
}

/** The envelope with the selection in `currentlyEditing` (`type`, `instance { id, name }`).
 *  Unchanged when there is no `currentlyEditing` (no artefact resolved) or no selection. */
export function withConsumerSelection(
    envelope: Record<string, any>,
    idlookup: Idlookup,
    selection: ConsumerSelection | null | undefined,
): Record<string, any> {
    if (!selection || !envelope?.currentlyEditing) return envelope;
    const described = describeConsumerSelection(selection, idlookup);
    if (!described) return envelope;
    const currentlyEditing: Record<string, any> = { ...envelope.currentlyEditing, type: described.typeName };
    if (selection.instanceId && idlookup[selection.instanceId]) {
        currentlyEditing.instance = { id: selection.instanceId, name: described.instanceName ?? '' };
    }
    return { ...envelope, currentlyEditing };
}

// ── J2: the profile ─────────────────────────────────────────────────────────

const PERMISSION_RANK: Record<EnvPermission, number> = { edit: 0, read: 1, hidden: 2 };
const keyOf = (metamodelName: string, className: string) => `${metamodelName}\u0000${className}`;

interface Rules {
    /** (metamodel name, class name) → the profile's rule, stricter one on a collision. */
    byName: Map<string, EnvPermission>;
    /** Ids of the objects whose exact class is hidden (the Configurator's rule). */
    hiddenObjects: Set<string>;
    /** For free text (violation messages): a hidden class name in quotes, as the validator
     *  writes class names, and a hidden object's id or name as a whole word (names are quoted
     *  everywhere but in the duplicate-id list). A class named `Object` must not match every
     *  message, which all begin with `Object "<name>"`. */
    hiddenClassText: RegExp | null;
    hiddenObjectText: RegExp | null;
    hiddenClassNames: Set<string>;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function rulesOf(idlookup: Idlookup, profile: any): Rules {
    const byName = new Map<string, EnvPermission>();
    const hiddenObjects = new Set<string>();
    const hiddenClassNames = new Set<string>();
    const objectWords = new Set<string>();
    for (const id in idlookup) {
        const d = idlookup[id];
        if (!d || d.className !== 'DClass' || typeof d.name !== 'string') continue;
        const mm = metamodelOfClass(idlookup, id);
        const mmName = mm ? idlookup[mm]?.name : undefined;
        if (typeof mmName !== 'string') continue;
        const permission = resolveTypePermission(profile, id);
        const key = keyOf(mmName, d.name);
        const previous = byName.get(key);
        if (!previous || PERMISSION_RANK[permission] > PERMISSION_RANK[previous]) byName.set(key, permission);
        if (permission === 'hidden' && d.name) hiddenClassNames.add(d.name);
    }
    const read = makeDrawReadCtx(idlookup);
    for (const id in idlookup) {
        const d = idlookup[id];
        if (!d || d.className !== 'DObject' || typeof d.instanceof !== 'string') continue;
        if (resolveTypePermission(profile, d.instanceof) !== 'hidden') continue;
        hiddenObjects.add(id);
        objectWords.add(id);
        const name = read.getName(id);
        if (name) objectWords.add(name);
    }
    const alternation = (set: Set<string>) => [...set].filter(Boolean).map(escapeRegExp).join('|');
    const hiddenClassText = hiddenClassNames.size ? new RegExp(`"(${alternation(hiddenClassNames)})"`) : null;
    const hiddenObjectText = objectWords.size
        ? new RegExp(`(^|[^A-Za-z0-9_])(${alternation(objectWords)})(?![A-Za-z0-9_])`)
        : null;
    return { byName, hiddenObjects, hiddenClassText, hiddenObjectText, hiddenClassNames };
}

const permissionOf = (rules: Rules, metamodelName: string, className: unknown): EnvPermission =>
    (typeof className === 'string' && rules.byName.get(keyOf(metamodelName, className))) || 'edit';

/** A classifier reference `{ name, package?, metamodel? }` to a hidden class. */
const isHiddenRef = (rules: Rules, ref: any, metamodelName: string): boolean =>
    !!ref && typeof ref === 'object'
    && permissionOf(rules, typeof ref.metamodel?.name === 'string' ? ref.metamodel.name : metamodelName, ref.name) === 'hidden';

function filterClass(cls: any, metamodelName: string, rules: Rules): any {
    const out: any = { ...cls };
    if (Array.isArray(cls.superTypes)) {
        const superTypes = cls.superTypes.filter((t: any) => !isHiddenRef(rules, t, metamodelName));
        if (superTypes.length) out.superTypes = superTypes; else delete out.superTypes;
    }
    if (Array.isArray(cls.references)) {
        const references = cls.references.filter((r: any) => !isHiddenRef(rules, r?.type, metamodelName));
        if (references.length) out.references = references; else delete out.references;
    }
    if (permissionOf(rules, metamodelName, cls.name) === 'read') out.readOnly = true;
    return out;
}

function filterPackage(pkg: any, metamodelName: string, rules: Rules): any {
    const out: any = { ...pkg };
    if (Array.isArray(pkg.classes)) {
        const classes = pkg.classes
            .filter((c: any) => permissionOf(rules, metamodelName, c?.name) !== 'hidden')
            .map((c: any) => filterClass(c, metamodelName, rules));
        if (classes.length) out.classes = classes; else delete out.classes;
    }
    if (Array.isArray(pkg.subpackages)) {
        out.subpackages = pkg.subpackages.map((p: any) => filterPackage(p, metamodelName, rules));
    }
    return out;
}

function isHiddenObject(obj: any, metamodelName: string, rules: Rules): boolean {
    if (!obj || typeof obj !== 'object') return false;
    if (typeof obj.$ref === 'string') return rules.hiddenObjects.has(obj.$ref);
    if (typeof obj.id === 'string' && rules.hiddenObjects.has(obj.id)) return true;
    return isHiddenRef(rules, obj.class, metamodelName);
}

/** Visible objects of `list`, their subtrees filtered. The visible descendants of a hidden object
 *  go to `lifted`: the Configurator lists them whatever contains them, so Jodie sees them too,
 *  with no container named. */
function filterObjects(list: any[], metamodelName: string, rules: Rules, lifted: any[]): any[] {
    const out: any[] = [];
    for (const obj of list) {
        if (!isHiddenObject(obj, metamodelName, rules)) {
            out.push(filterObject(obj, metamodelName, rules, lifted));
            continue;
        }
        for (const kids of Object.values(obj?.children ?? {})) {
            if (!Array.isArray(kids)) continue;
            const visible = filterObjects(kids, metamodelName, rules, lifted);
            lifted.push(...visible.filter((k) => typeof k?.$ref !== 'string'));
        }
    }
    return out;
}

function filterObject(obj: any, metamodelName: string, rules: Rules, lifted: any[]): any {
    if (!obj || typeof obj !== 'object' || typeof obj.$ref === 'string') return obj;
    const out: any = { ...obj };
    if (obj.references && typeof obj.references === 'object') {
        const references: Record<string, any> = {};
        for (const [feature, values] of Object.entries<any>(obj.references)) {
            const kept = Array.isArray(values)
                ? values.filter((v: any) => !(typeof v?.$ref === 'string' && rules.hiddenObjects.has(v.$ref)))
                : values;
            if (!Array.isArray(kept) || kept.length) references[feature] = kept;
        }
        if (Object.keys(references).length) out.references = references; else delete out.references;
    }
    if (obj.children && typeof obj.children === 'object') {
        const children: Record<string, any> = {};
        for (const [feature, kids] of Object.entries<any>(obj.children)) {
            const kept = Array.isArray(kids) ? filterObjects(kids, metamodelName, rules, lifted) : kids;
            if (!Array.isArray(kept) || kept.length) children[feature] = kept;
        }
        if (Object.keys(children).length) out.children = children; else delete out.children;
    }
    return out;
}

function filterModelDocument(doc: any, rules: Rules): any {
    const metamodelName: string = typeof doc?.metamodel?.name === 'string' ? doc.metamodel.name : '';
    const out: any = { ...doc };
    if (Array.isArray(doc?.metamodel?.packages)) {
        out.metamodel = { ...doc.metamodel, packages: doc.metamodel.packages.map((p: any) => filterPackage(p, metamodelName, rules)) };
    }
    for (const key of ['objects', 'externalObjects']) {
        if (!Array.isArray(doc?.[key])) continue;
        const lifted: any[] = [];
        const kept = filterObjects(doc[key], metamodelName, rules, lifted);
        out[key] = [...kept, ...lifted];
    }
    return out;
}

function filterMetamodelDocument(doc: any, rules: Rules): any {
    const metamodelName: string = typeof doc?.metadata?.name === 'string' ? doc.metadata.name : '';
    if (!Array.isArray(doc?.packages)) return doc;
    return { ...doc, packages: doc.packages.map((p: any) => filterPackage(p, metamodelName, rules)) };
}

function mentionsHidden(violation: any, rules: Rules): boolean {
    if (typeof violation?.objectId === 'string' && rules.hiddenObjects.has(violation.objectId)) return true;
    if (typeof violation?.metamodelElementName === 'string' && rules.hiddenClassNames.has(violation.metamodelElementName)) return true;
    const message = typeof violation?.message === 'string' ? violation.message : '';
    return !!rules.hiddenClassText?.test(message) || !!rules.hiddenObjectText?.test(message);
}

/** The report without what names a hidden object or type; the status follows what is left. */
function filterConformance(conformance: any, rules: Rules): any {
    if (!conformance || !Array.isArray(conformance.violations)) return conformance;
    const violations = conformance.violations.filter((v: any) => !mentionsHidden(v, rules));
    if (violations.length === conformance.violations.length || conformance.status === 'unknown') {
        return { ...conformance, violations };
    }
    const status = violations.some((v: any) => v?.severity === 'error') ? 'errors'
        : violations.length ? 'warnings' : 'conformant';
    return { ...conformance, status, violations };
}

/** Names of the classes left in the documents, by the profile's rule; abstract and interface
 *  classes have no instances of their own and are listed in neither. */
function environmentOf(profile: any, documents: Array<{ metamodelName: string; packages: any[] }>, rules: Rules) {
    const editableTypes: string[] = [];
    const readOnlyTypes: string[] = [];
    const walk = (packages: any[], metamodelName: string) => {
        for (const pkg of packages ?? []) {
            for (const cls of pkg?.classes ?? []) {
                if (!cls || cls.abstract || cls.interface || typeof cls.name !== 'string') continue;
                const permission = permissionOf(rules, metamodelName, cls.name);
                const into = permission === 'read' ? readOnlyTypes : permission === 'edit' ? editableTypes : null;
                if (into && !into.includes(cls.name)) into.push(cls.name);
            }
            walk(pkg?.subpackages ?? [], metamodelName);
        }
    };
    for (const d of documents) walk(d.packages, d.metamodelName);
    return { profile: typeof profile?.name === 'string' ? profile.name : '', editableTypes, readOnlyTypes };
}

/**
 * The envelope of `getContextJSON` (`currentlyEditing`, then `model` + `conformance`, or
 * `metamodel`, or `metamodels`) as the profile lets the consumer see it, plus an `environment`
 * block `{ profile, editableTypes, readOnlyTypes }`. Without a profile (the developer, or a
 * `?profile=` that resolves to none, which the Configurator also treats as full access) the
 * envelope is returned as it is. Never mutates its input.
 */
export function filterContextForProfile(
    envelope: Record<string, any>,
    idlookup: Idlookup,
    profile: any | null | undefined,
): Record<string, any> {
    if (!profile || !envelope || typeof envelope !== 'object') return envelope;
    const rules = rulesOf(idlookup, profile);
    const out: Record<string, any> = { ...envelope };
    const documents: Array<{ metamodelName: string; packages: any[] }> = [];
    if (envelope.model) {
        out.model = filterModelDocument(envelope.model, rules);
        documents.push({ metamodelName: out.model?.metamodel?.name ?? '', packages: out.model?.metamodel?.packages ?? [] });
    }
    if (envelope.metamodel) {
        out.metamodel = filterMetamodelDocument(envelope.metamodel, rules);
        documents.push({ metamodelName: out.metamodel?.metadata?.name ?? '', packages: out.metamodel?.packages ?? [] });
    }
    if (Array.isArray(envelope.metamodels)) {
        out.metamodels = envelope.metamodels.map((d: any) => filterMetamodelDocument(d, rules));
        for (const d of out.metamodels) documents.push({ metamodelName: d?.metadata?.name ?? '', packages: d?.packages ?? [] });
    }
    if (envelope.conformance) out.conformance = filterConformance(envelope.conformance, rules);
    if (envelope.currentlyEditing && typeof envelope.currentlyEditing === 'object') {
        const metamodelName: string = envelope.model?.metamodel?.name ?? '';
        const currentlyEditing: Record<string, any> = { ...envelope.currentlyEditing };
        if (permissionOf(rules, metamodelName, currentlyEditing.type) === 'hidden') delete currentlyEditing.type;
        if (typeof currentlyEditing.instance?.id === 'string' && rules.hiddenObjects.has(currentlyEditing.instance.id)) delete currentlyEditing.instance;
        out.currentlyEditing = currentlyEditing;
    }
    out.environment = environmentOf(profile, documents, rules);
    return out;
}
