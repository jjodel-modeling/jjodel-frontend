/**
 * JSON Model Service
 * Exports metamodels (M2) and models (M1) to a clean, semantic JSON format.
 *
 * Design notes
 * ------------
 * - Semantic shape: the JSON mirrors the modelling structure (packages /
 *   classes / attributes / references, objects / attribute values / reference
 *   values), not the internal D-layer Pointer graph. It is meant to be read by
 *   external tooling, not to round-trip 1:1 into the D-layer.
 * - Self-contained (embedded) cross-metamodel handling: a metamodel may extend
 *   or reference classes that live in ANOTHER metamodel. Those elements are
 *   emitted as qualified references carrying the origin metamodel
 *   ({ id, name, nsURI }), and the FULL definition of every referenced foreign
 *   metamodel is embedded under `externalMetamodels` (transitive closure, with
 *   cycle protection). Consumers can therefore resolve every reference without
 *   any additional file.
 *
 * Traversal reuses the same L-layer accessors as EcoreService (M2) and
 * XMIService (M1). M1 values are read from `feature.__raw.values` (never the
 * L-layer `values` getter, which resolves Pointer ids into proxies with
 * circular back-references).
 */

import {
    LModel,
    LPackage,
    LClass,
    LAttribute,
    LReference,
    LEnumerator,
    LDataType,
    LObject,
    LPointerTargetable,
    store,
} from '../../joiner';

// ============================================
// TYPES
// ============================================

/** { id, name, nsURI } identity of a metamodel, used both as a manifest entry
 *  and as the origin marker on a cross-metamodel classifier reference. */
export interface JsonMetamodelRef {
    id: string;
    name: string;
    nsURI: string;
}

/** Reference to a classifier (class / enum / datatype). `metamodel` is present
 *  only when the classifier lives in a metamodel other than the one being
 *  exported (cross-metamodel element). */
export interface JsonClassifierRef {
    name: string;
    package?: string;
    metamodel?: JsonMetamodelRef;
}

/** Full embedded definition of a metamodel referenced from another one. */
export interface JsonExternalMetamodel extends JsonMetamodelRef {
    packages: any[];
}

// ============================================
// JSON MODEL SERVICE
// ============================================

interface BuildContext {
    /** metamodel ids already embedded (or queued for embedding) — dedup + cycle guard. */
    visited: Set<string>;
    /** foreign metamodels discovered while building, pending full embedding. */
    queue: LModel[];
}

export class JsonModelService {

    private static readonly FORMAT_VERSION = '1.0';

    // ============================================
    // PUBLIC — METAMODEL (M2)
    // ============================================

    /**
     * Build the semantic metamodel document (`jjodel-metamodel`) as a plain
     * object, so it can be embedded into other documents (e.g. the full
     * megamodel export). Foreign metamodels referenced by super-types /
     * reference types are embedded fully under `externalMetamodels`.
     */
    static buildMetamodelDocument(metamodel: LModel): Record<string, unknown> {
        const ctx: BuildContext = { visited: new Set([metamodel.id]), queue: [] };
        const packages = this.buildPackages(metamodel, metamodel.id, ctx);
        const externalMetamodels = this.drainExternals(ctx);

        const doc: any = {
            format: 'jjodel-metamodel',
            formatVersion: this.FORMAT_VERSION,
            metadata: this.buildMetadata(metamodel),
            packages,
        };
        if (externalMetamodels.length > 0) doc.externalMetamodels = externalMetamodels;
        return doc;
    }

    /**
     * Export a metamodel to a semantic JSON string.
     */
    static exportMetamodelToJSON(metamodel: LModel): string {
        return JSON.stringify(this.buildMetamodelDocument(metamodel), null, 2);
    }

    /**
     * Build a token-lean variant of the metamodel document, for feeding into
     * LLM prompts. Same `jjodel-metamodel` semantic shape as
     * buildMetamodelDocument, with heavy / id-only fields deep-stripped
     * (externalMetamodels, ids, export timestamp, version stamps). Cross-
     * metamodel classifier refs keep their `name` (+ `package`) so they still
     * resolve by name; only their internal metamodel id is dropped.
     */
    static buildMetamodelDocumentLight(metamodel: LModel): Record<string, unknown> {
        return this.stripKeysDeep(
            this.buildMetamodelDocument(metamodel),
            this.LIGHT_OMIT_KEYS
        ) as Record<string, unknown>;
    }

    // ============================================
    // PUBLIC — MODEL (M1)
    // ============================================

    /**
     * Build the semantic model document (`jjodel-model`) as a plain object.
     * The model's metamodel is embedded in full (self-contained, like the XMI
     * exporter). Additional metamodels whose classes are instantiated /
     * referenced are embedded under `externalMetamodels`.
     */
    static buildModelDocument(model: LModel): Record<string, unknown> {
        const metamodel = model.instanceof as LModel;
        if (!metamodel) {
            throw new Error('Model has no metamodel reference (instanceof)');
        }

        const ctx: BuildContext = { visited: new Set([metamodel.id]), queue: [] };
        const primaryPackages = this.buildPackages(metamodel, metamodel.id, ctx);
        const objects = this.buildModelObjects(model, metamodel.id, ctx);
        const externalMetamodels = this.drainExternals(ctx);

        const doc: any = {
            format: 'jjodel-model',
            formatVersion: this.FORMAT_VERSION,
            metadata: this.buildMetadata(model),
            metamodel: {
                id: metamodel.id,
                name: metamodel.name || '',
                nsURI: this.nsURIOf(metamodel),
                packages: primaryPackages,
            },
            objects,
        };
        if (externalMetamodels.length > 0) doc.externalMetamodels = externalMetamodels;
        return doc;
    }

    /**
     * Export a model to a semantic JSON string.
     */
    static exportModelToJSON(model: LModel): string {
        return JSON.stringify(this.buildModelDocument(model), null, 2);
    }

    /**
     * Build a token-lean variant of the model document, for feeding into LLM
     * prompts. Same `jjodel-model` shape as buildModelDocument (metamodel
     * embedded), with only the heavy / noise fields stripped
     * (externalMetamodels, export timestamp, version stamps).
     *
     * Unlike buildMetamodelDocumentLight, this does NOT strip `id`: object ids,
     * `$ref` targets and object names are the stable handles a downstream
     * refactoring script needs to address instances (`set <name>.<attr> = ...`,
     * `delete instance <name>`), so identity must be preserved.
     */
    static buildModelDocumentLight(model: LModel): Record<string, unknown> {
        return this.stripKeysDeep(
            this.buildModelDocument(model),
            this.LIGHT_MODEL_OMIT_KEYS
        ) as Record<string, unknown>;
    }

    // ============================================
    // PUBLIC — FILE DOWNLOAD
    // ============================================

    /**
     * Export to a .json file and trigger a browser download.
     * @param kind 'metamodel' selects the M2 serializer, 'model' the M1 one.
     */
    static exportToFile(entity: LModel, kind: 'metamodel' | 'model'): void {
        const json = kind === 'metamodel'
            ? this.exportMetamodelToJSON(entity)
            : this.exportModelToJSON(entity);

        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${entity.name || kind}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // ============================================
    // METAMODEL STRUCTURE BUILDERS
    // ============================================

    private static buildPackages(metamodel: LModel, currentModelId: string, ctx: BuildContext): any[] {
        return (metamodel.packages || []).map(pkg => this.buildPackage(pkg, currentModelId, ctx));
    }

    private static buildPackage(pkg: LPackage, currentModelId: string, ctx: BuildContext): any {
        const out: any = { name: pkg.name || '' };
        const nsURI = pkg.__raw?.uri;
        if (nsURI) out.nsURI = nsURI;
        if (pkg.prefix) out.nsPrefix = pkg.prefix;

        const classes = (pkg.classes || []).map(cls => this.buildClass(cls, currentModelId, ctx));
        if (classes.length > 0) out.classes = classes;

        const enums = (pkg.enumerators || []).map(en => this.buildEnum(en));
        if (enums.length > 0) out.enums = enums;

        const dataTypes = (pkg.datatypes || []).map(dt => this.buildDataType(dt));
        if (dataTypes.length > 0) out.dataTypes = dataTypes;

        const subpackages = (pkg.subpackages || []).map(sp => this.buildPackage(sp, currentModelId, ctx));
        if (subpackages.length > 0) out.subpackages = subpackages;

        return out;
    }

    private static buildClass(cls: LClass, currentModelId: string, ctx: BuildContext): any {
        const out: any = { name: cls.name || '' };
        if (cls.abstract) out.abstract = true;
        if (cls.interface) out.interface = true;
        if (cls.instanceClassName) out.instanceClassName = cls.instanceClassName;

        const superTypes = (cls.extends || []).map(st => this.buildClassifierRef(st, currentModelId, ctx));
        if (superTypes.length > 0) out.superTypes = superTypes;

        const attributes = (cls.attributes || []).map(a => this.buildAttribute(a, currentModelId, ctx));
        if (attributes.length > 0) out.attributes = attributes;

        const references = (cls.references || []).map(r => this.buildReference(r, currentModelId, ctx));
        if (references.length > 0) out.references = references;

        return out;
    }

    private static buildAttribute(attr: LAttribute, currentModelId: string, ctx: BuildContext): any {
        const out: any = { name: attr.name || '' };
        out.type = this.buildTypeRef(attr.type, currentModelId, ctx);
        this.applyMultiplicity(out, attr.lowerBound, attr.upperBound);
        if (attr.ordered === false) out.ordered = false;
        if (attr.unique === false) out.unique = false;
        if (attr.derived === true) out.derived = true;
        return out;
    }

    private static buildReference(ref: LReference, currentModelId: string, ctx: BuildContext): any {
        const out: any = { name: ref.name || '' };
        out.type = this.buildClassifierRef(ref.type, currentModelId, ctx);
        if (ref.composition || (ref as any).containment) out.containment = true;
        this.applyMultiplicity(out, ref.lowerBound, ref.upperBound);
        if (ref.ordered === false) out.ordered = false;
        if (ref.unique === false) out.unique = false;
        const opposite = ref.opposite;
        if (opposite?.name) out.opposite = opposite.name;
        return out;
    }

    private static buildEnum(en: LEnumerator): any {
        const out: any = { name: en.name || '' };
        if (en.instanceClassName) out.instanceClassName = en.instanceClassName;
        if (en.serializable === false) out.serializable = false;
        out.literals = (en.literals || []).map(lit => {
            const litOut: any = { name: lit.name || '' };
            const value = lit.__raw?.value;
            if (Number.isFinite(value)) litOut.value = value;
            const literal = lit.__raw?.literal;
            if (literal && literal !== lit.name) litOut.literal = literal;
            return litOut;
        });
        return out;
    }

    private static buildDataType(dt: LDataType): any {
        const out: any = { name: dt.name || '' };
        if (dt.instanceClassName) out.instanceClassName = dt.instanceClassName;
        if (dt.serializable === false) out.serializable = false;
        return out;
    }

    // ============================================
    // TYPE REFERENCE BUILDERS
    // ============================================

    /**
     * Build the `type` value for an attribute. Canonical primitives (EString,
     * EInt, ...) are emitted as a plain string; enum / user-datatype / class
     * classifiers are emitted as a JsonClassifierRef object (carrying the
     * origin metamodel when cross-metamodel). The `Pointer_E` id prefix is the
     * canonical-primitive discriminator (same convention as EcoreService).
     */
    private static buildTypeRef(type: any, currentModelId: string, ctx: BuildContext): string | JsonClassifierRef {
        if (!type) return 'EString';
        if (typeof type === 'string') return type;
        const id = typeof type.id === 'string' ? type.id : '';
        if (id.startsWith('Pointer_E')) return type.name || 'EString';
        return this.buildClassifierRef(type, currentModelId, ctx);
    }

    /**
     * Build a reference to a classifier (class / enum / datatype). When the
     * classifier lives in a metamodel other than `currentModelId`, the origin
     * metamodel is recorded on the ref AND queued for full embedding.
     */
    private static buildClassifierRef(classifier: any, currentModelId: string, ctx: BuildContext): JsonClassifierRef {
        const out: JsonClassifierRef = { name: classifier?.name || '' };
        try {
            const pkg = classifier?.package;
            if (pkg?.name) out.package = pkg.name;

            const ownerModel: LModel | undefined = classifier?.model;
            if (ownerModel && ownerModel.id && ownerModel.id !== currentModelId) {
                this.registerExternal(ownerModel, ctx);
                out.metamodel = {
                    id: ownerModel.id,
                    name: ownerModel.name || '',
                    nsURI: this.nsURIOf(ownerModel),
                };
            }
        } catch {
            // L-proxy navigation (.package / .model) can throw on stale data —
            // fall back to the bare name, mirroring the megamodel useEffect.
        }
        return out;
    }

    // ============================================
    // MODEL (M1) STRUCTURE BUILDERS
    // ============================================

    /**
     * Build the root objects of a model. Contained (composition) children are
     * NOT emitted at top level — they are nested under their container's
     * `children` map (mirrors XMIService's root-only export).
     */
    private static buildModelObjects(model: LModel, currentModelId: string, ctx: BuildContext): any[] {
        const objects = (model.objects || []).filter((o: LObject | null) => !!o) as LObject[];

        const contained = new Set<string>();
        for (const obj of objects) {
            for (const feature of obj.features || []) {
                const metaFeature: any = feature?.instanceof;
                if (!metaFeature || metaFeature.className !== 'DReference') continue;
                if (!(metaFeature.composition || metaFeature.containment)) continue;
                for (const v of (feature.__raw?.values || [])) {
                    if (typeof v === 'string') contained.add(v);
                }
            }
        }

        return objects
            .filter(obj => !contained.has(obj.id))
            .map(obj => this.buildObject(obj, currentModelId, ctx));
    }

    private static buildObject(obj: LObject, currentModelId: string, ctx: BuildContext): any {
        const metaclass: any = obj.instanceof;
        const out: any = {
            id: obj.id,
            class: metaclass ? this.buildClassifierRef(metaclass, currentModelId, ctx) : { name: 'Object' },
        };
        if (obj.name) out.name = obj.name;

        const state = store.getState();
        const attributes: Record<string, any> = {};
        const references: Record<string, any> = {};
        const children: Record<string, any> = {};

        for (const feature of obj.features || []) {
            if (!feature) continue;
            const metaFeature: any = feature.instanceof;
            const featureName: string = metaFeature?.name || (feature as any).name;
            if (!featureName) continue;

            const rawValues: any[] = (feature.__raw?.values || []) as any[];
            if (rawValues.length === 0) continue;

            const isReference = metaFeature && metaFeature.className === 'DReference';
            if (!isReference) {
                // Attribute: primitives, or DEnumLiteral pointers → literal name.
                const rendered = rawValues.map((v) => {
                    if (typeof v === 'string') {
                        const target = state.idlookup[v];
                        if (target && target.className === 'DEnumLiteral') return target.name;
                    }
                    return v;
                });
                attributes[featureName] = rendered.length === 1 ? rendered[0] : rendered;
                continue;
            }

            if (metaFeature.composition || metaFeature.containment) {
                // Containment: nest the child objects.
                const childObjs = rawValues
                    .map((v) => this.resolveObject(v))
                    .filter((o): o is LObject => o !== null);
                if (childObjs.length > 0) {
                    children[featureName] = childObjs.map(c => this.buildObject(c, currentModelId, ctx));
                }
            } else {
                // Cross-reference: emit id pointers as { $ref: objectId }.
                const refs = rawValues
                    .filter((v) => typeof v === 'string' && !!v)
                    .map((v) => ({ $ref: v as string }));
                if (refs.length > 0) references[featureName] = refs;
            }
        }

        if (Object.keys(attributes).length > 0) out.attributes = attributes;
        if (Object.keys(references).length > 0) out.references = references;
        if (Object.keys(children).length > 0) out.children = children;

        return out;
    }

    // ============================================
    // EXTERNAL METAMODEL EMBEDDING
    // ============================================

    private static registerExternal(model: LModel, ctx: BuildContext): void {
        if (!model?.id || ctx.visited.has(model.id)) return;
        ctx.visited.add(model.id);
        ctx.queue.push(model);
    }

    /**
     * Fully embed every queued foreign metamodel. Building one may enqueue
     * further metamodels (transitive references); the loop drains until the
     * closure is complete. Cycles are prevented by `ctx.visited`.
     */
    private static drainExternals(ctx: BuildContext): JsonExternalMetamodel[] {
        const out: JsonExternalMetamodel[] = [];
        while (ctx.queue.length > 0) {
            const mm = ctx.queue.shift() as LModel;
            const packages = this.buildPackages(mm, mm.id, ctx);
            out.push({
                id: mm.id,
                name: mm.name || '',
                nsURI: this.nsURIOf(mm),
                packages,
            });
        }
        return out;
    }

    // ============================================
    // UTILITIES
    // ============================================

    /**
     * Keys removed by buildMetamodelDocumentLight. `externalMetamodels` is the
     * biggest token sink (full transitive-closure embedding); the rest are
     * ids / timestamps / version stamps that carry no modelling meaning for an
     * LLM. Safe as a blanket recursive strip for the M2 metamodel document,
     * where `id` appears only in `metadata` and cross-metamodel classifier refs
     * (no class / attribute / reference carries an id of its own).
     */
    private static readonly LIGHT_OMIT_KEYS = new Set<string>([
        'externalMetamodels', 'id', 'exportedAt', 'jjodelVersion', 'formatVersion',
    ]);

    /**
     * Keys removed by buildModelDocumentLight. Same rationale as LIGHT_OMIT_KEYS
     * but WITHOUT `id`: an M1 document uses object ids / `$ref` as identity
     * handles (see buildModelDocumentLight), so they must survive the trim.
     */
    private static readonly LIGHT_MODEL_OMIT_KEYS = new Set<string>([
        'externalMetamodels', 'exportedAt', 'jjodelVersion', 'formatVersion',
    ]);

    /** Deep-clone `value`, dropping any object key present in `omit`. */
    private static stripKeysDeep(value: any, omit: Set<string>): any {
        if (Array.isArray(value)) return value.map(v => this.stripKeysDeep(v, omit));
        if (value && typeof value === 'object') {
            const out: any = {};
            for (const [k, v] of Object.entries(value)) {
                if (omit.has(k)) continue;
                out[k] = this.stripKeysDeep(v, omit);
            }
            return out;
        }
        return value;
    }

    private static applyMultiplicity(out: any, lowerBound: any, upperBound: any): void {
        if (lowerBound !== undefined && lowerBound !== 0) out.lowerBound = lowerBound;
        if (upperBound !== undefined && upperBound !== 1) out.upperBound = upperBound;
    }

    private static nsURIOf(metamodel: LModel): string {
        try {
            return metamodel.packages?.[0]?.__raw?.uri || '';
        } catch {
            return '';
        }
    }

    private static buildMetadata(entity: LModel): any {
        return {
            name: entity.name || '',
            id: entity.id,
            exportedAt: new Date().toISOString(),
            jjodelVersion: `v${(store.getState() as any).version?.n || '2.0'}`,
        };
    }

    private static resolveObject(value: any): LObject | null {
        if (!value) return null;
        if (typeof value === 'object' && value.className === 'DObject') {
            return LPointerTargetable.fromD(value) as LObject;
        }
        if (typeof value === 'string') {
            try {
                const d = store.getState().idlookup[value];
                if (d && d.className === 'DObject') {
                    return LPointerTargetable.fromD(d) as LObject;
                }
            } catch {
                return null;
            }
        }
        return null;
    }
}

export default JsonModelService;
