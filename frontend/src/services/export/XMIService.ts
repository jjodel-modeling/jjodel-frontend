/**
 * XMI Service
 * Handles import and export of XMI (.xmi) files with embedded metamodel
 */

import {
    EcoreParser,
    DModel,
    LModel,
    DObject,
    LObject,
    DValue,
    LValue,
    LClass,
    LAttribute,
    LReference,
    DPackage,
    LPackage,
    DPointerTargetable,
    LPointerTargetable,
    Pointer,
    SetFieldAction,
    store,
    Selectors
} from '../../joiner';
import { EcoreService } from './EcoreService';

// Module-private helper: resolve a loaded metamodel by its default namespace URI.
// Matches against DPackage.__raw.uri (the literal value parsed from EPackage.nsURI),
// not LPackage.uri — the L-getter concatenates uri + "." + name and would break exact match.
//
// Fallback (FIX 2026-05-14): if no DPackage declares the requested nsURI, retry on
// DPackage.__raw.name. Several Ecore fixtures (Persons, Families, modelBook, Table, …)
// declare only EPackage.name without nsURI; the corresponding XMI files use
// xmlns="<name>" as namespace, so a strict nsURI match would always fail.
function getMetamodelByNsURI(nsURI: string): { model: LModel | null; ambiguous?: string[] } {
    const allpkgs: LPackage[] = Selectors.getAll(DPackage, undefined, undefined, true, true);

    // Primary: canonical EPackage.nsURI match.
    const matchpkg: LPackage[] = allpkgs.filter(p => p.__raw?.uri === nsURI);
    if (matchpkg.length > 1) {
        const names = matchpkg.map(p => p.model?.name ?? '(unnamed)');
        return { model: null, ambiguous: names };
    }
    if (matchpkg.length === 1) {
        return { model: matchpkg[0].model ?? null };
    }

    // Fallback: EPackage.name match. Triggers on Ecore fixtures without nsURI.
    const matchByName: LPackage[] = allpkgs.filter(p => p.__raw?.name === nsURI);
    if (matchByName.length > 1) {
        const names = matchByName.map(p => p.model?.name ?? '(unnamed)');
        return { model: null, ambiguous: names };
    }
    if (matchByName.length === 1) {
        console.info('[XMI M1 Import] Metamodel resolved via fallback on EPackage.name', nsURI);
        return { model: matchByName[0].model ?? null };
    }

    return { model: null };
}

// ============================================
// TYPES
// ============================================

export interface XMIExportOptions {
    includeMetamodel?: boolean;  // Default true - embed metamodel in XMI
    prettyPrint?: boolean;
}

export interface XMIImportResult {
    success: boolean;
    model?: LModel;
    metamodel?: LModel;  // Extracted embedded metamodel if present
    errors: string[];
    warnings: string[];
    pattern?: 'wrapper' | 'single-root';  // Discriminated XMI root pattern (populated by importM1FromXML)
}

// Context shared across the recursive walker (B.2 + B.3).
// • xmiIdMap     — xmi:id → DObject pointer, populated during pass 1, consumed in pass 2 for reference resolution.
// • nsPrefixMap  — XML prefix → namespace URI, built once from root xmlns:* attrs and used to resolve xsi:type targets.
// • pendingRefs  — accumulated in pass 1, drained in pass 2 by resolveReferences.
// • knownMetamodelURIs — set of nsURIs that map to a loaded metamodel; used to classify unknown prefixes as xmi:Extension/profile.
// • conformitySlots — per-DObject cache of the empty DValue slots minted by _forceConformity
//   at DObject.new time (keyed by meta-feature pointer); consumed by getConformitySlot.
type XMIImportContext = {
    dModel: DModel;
    metamodel: LModel;
    xmiIdMap: Map<string, Pointer<DObject>>;
    nsPrefixMap: Map<string, string>;
    pendingRefs: PendingRef[];
    knownMetamodelURIs: Set<string>;
    conformitySlots: Map<Pointer<DObject>, Map<string, DValue>>;
    summary: { dobjects: number; attrs: number; warnings: number; refsResolved: number; refsFailed: number };
    warnings: string[];
};

// A non-containment reference seen in pass 1 whose target xmi:id(s) we will look up in pass 2.
// `rawValue` is the unsplit attribute value (whitespace-separated tokens for multi-valued)
// or a single xmi:idref / element text content.
type PendingRef = {
    sourceDObject: DObject;
    feature: LReference;
    rawValue: string;
    sourceTagPath: string;
};

// ============================================
// XMI SERVICE
// ============================================

export class XMIService {

    // ============================================
    // EXPORT
    // ============================================

    /**
     * Export model to XMI XML string with optional embedded metamodel
     */
    static exportToXML(model: LModel, options: XMIExportOptions = {}): string {
        const includeMetamodel = options.includeMetamodel !== false;
        const indent = options.prettyPrint !== false ? '  ' : '';
        const newline = options.prettyPrint !== false ? '\n' : '';

        // Get metamodel
        const metamodel = model.instanceof as LModel;
        if (!metamodel) {
            throw new Error('Model has no metamodel reference (instanceof)');
        }

        const pkg = metamodel.packages[0];
        if (!pkg) {
            throw new Error('Metamodel has no packages');
        }

        // RT6: il namespace di default DEVE combaciare con ciò che importM1FromXML risolve
        // via getMetamodelByNsURI: nsURI del package se presente, altrimenti il NOME del
        // package (stesso fallback dell'import). Niente URI inventate.
        const nsURI = pkg.__raw.uri || pkg.__raw.name || metamodel.name;

        // RT7: side-table del round-trip (Phase B.7): se il modello fu importato da XMI,
        // DModel.metadata.xmiIdMap contiene DObject.id → xmi:id originale. Usala per
        // riemettere gli xmi:id originali; fallback = Pointer id di Jjodel.
        const xmiIdMap: Record<string, string> = (model.__raw as any)?.metadata?.xmiIdMap || {};
        const mapId = (ptr: string): string => xmiIdMap[ptr] || ptr;

        const xmlParts: string[] = [];

        // XML Declaration
        xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');

        // XMI Root — xmlns di DEFAULT (richiesto dall'import) + xmi/xsi.
        xmlParts.push(`<xmi:XMI xmi:version="2.0"`);
        xmlParts.push(`${indent}xmlns:xmi="http://www.omg.org/XMI"`);
        xmlParts.push(`${indent}xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`);
        xmlParts.push(`${indent}xmlns="${this.escapeXml(nsURI)}">`);

        // Embedded Metamodel (optional but default)
        if (includeMetamodel) {
            xmlParts.push('');
            xmlParts.push(`${indent}<!-- Embedded Metamodel for standalone import -->`);
            xmlParts.push(`${indent}<xmi:Documentation>`);
            xmlParts.push(`${indent}${indent}<embeddedMetamodel>`);

            // Indent the ecore content
            const ecoreXml = EcoreService.exportToXML(metamodel, { prettyPrint: true });
            const ecoreLines = ecoreXml.split('\n').slice(1); // Skip XML declaration
            ecoreLines.forEach(line => {
                xmlParts.push(`${indent}${indent}${indent}${line}`);
            });

            xmlParts.push(`${indent}${indent}</embeddedMetamodel>`);
            xmlParts.push(`${indent}</xmi:Documentation>`);
        }

        // Model instances
        xmlParts.push('');
        xmlParts.push(`${indent}<!-- Model Instances -->`);

        // RT8: model.objects contiene TUTTI gli oggetti (anche i figli containment,
        // registrati lì per la materializzazione canvas). Esportare solo le RADICI,
        // altrimenti ogni figlio appare due volte (nested + top-level) e il re-import
        // duplica gli oggetti.
        const objects = (model.objects || []).filter((o: LObject | null) => !!o);
        const contained = new Set<string>();
        for (const obj of objects) {
            for (const feature of obj.features || []) {
                const metaFeature = feature?.instanceof as LReference | undefined;
                if (!metaFeature || (metaFeature as any).className !== 'DReference') continue;
                if (!((metaFeature as any).composition || (metaFeature as any).containment)) continue;
                for (const v of (feature.__raw?.values || [])) {
                    if (typeof v === 'string') contained.add(v);
                }
            }
        }
        const seen = new Set<string>();
        for (const obj of objects) {
            if (contained.has(obj.id) || seen.has(obj.id)) continue;
            seen.add(obj.id);
            xmlParts.push(this.exportObject(obj, metamodel, mapId, indent, newline));
        }

        // Close XMI
        xmlParts.push('');
        xmlParts.push('</xmi:XMI>');

        return xmlParts.join(newline);
    }

    /**
     * Export to file and trigger browser download
     */
    static exportToFile(model: LModel, options: XMIExportOptions = {}): void {
        const xml = this.exportToXML(model, options);
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${model.name}.xmi`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Serialize one feature slot (DValue) into either a tag attribute or a
     * containment child list. Shared by root and nested export.
     *
     * RT9: i valori vengono letti dal D-layer (feature.__raw.values), non dal
     * getter L `values` (che mappa i pointer in proxy LObject/LEnumLiteral e
     * renderebbe String(v) = garbage). Enum → nome del literal; reference →
     * xmi:id mappato (RT7); attribute → stringa.
     */
    private static serializeFeatures(
        obj: LObject,
        mapId: (ptr: string) => string,
        attrs: string[],
        containedChildren: Array<{ refName: string; objects: LObject[] }>,
    ): void {
        const state = store.getState();
        const features = obj.features || [];
        for (const feature of features) {
            if (!feature) continue;
            const metaFeature = feature.instanceof as LAttribute | LReference;
            const featureName = metaFeature?.name || (feature as any).name || 'unknown';
            const rawValues: any[] = (feature.__raw?.values || []) as any[];
            if (rawValues.length === 0) continue;

            const isReference = metaFeature && (metaFeature as any).className === 'DReference';
            if (!isReference) {
                // Attribute: primitives or DEnumLiteral pointers → literal name.
                const rendered = rawValues.map((v) => {
                    if (typeof v === 'string') {
                        const target = state.idlookup[v];
                        if (target && target.className === 'DEnumLiteral') return this.escapeXml(target.name || '');
                    }
                    return this.escapeXml(String(v));
                });
                attrs.push(`${featureName}="${rendered.join(' ')}"`);
                continue;
            }

            const refMeta = metaFeature as LReference;
            if ((refMeta as any).composition || (refMeta as any).containment) {
                const childObjects = rawValues
                    .map((v) => this.resolveObject(v))
                    .filter((o) => o !== null) as LObject[];
                if (childObjects.length > 0) {
                    containedChildren.push({ refName: featureName, objects: childObjects });
                }
            } else {
                const refs = rawValues
                    .filter((v) => typeof v === 'string' && !!v)
                    .map((v) => this.escapeXml(mapId(v as string)));
                if (refs.length > 0) attrs.push(`${featureName}="${refs.join(' ')}"`);
            }
        }
    }

    /**
     * Export single root object instance.
     * RT6: tag NON prefissato — la radice vive nel namespace di default, che è
     * quello che importM1FromXML risolve (il prefix veniva comunque scartato).
     */
    private static exportObject(
        obj: LObject,
        metamodel: LModel,
        mapId: (ptr: string) => string,
        indent: string,
        newline: string
    ): string {
        const parts: string[] = [];
        const i = indent;

        const metaclass = obj.instanceof as LClass;
        const className = metaclass?.name || 'Object';

        const attrs: string[] = [`xmi:id="${this.escapeXml(mapId(obj.id))}"`];
        const containedChildren: Array<{ refName: string; objects: LObject[] }> = [];
        this.serializeFeatures(obj, mapId, attrs, containedChildren);

        if (containedChildren.length > 0) {
            parts.push(`${i}<${className} ${attrs.join(' ')}>`);
            for (const { refName, objects } of containedChildren) {
                for (const child of objects) {
                    parts.push(this.exportNestedObject(child, refName, metamodel, mapId, indent, newline, 2));
                }
            }
            parts.push(`${i}</${className}>`);
        } else {
            parts.push(`${i}<${className} ${attrs.join(' ')}/>`);
        }

        return parts.join(newline);
    }

    /**
     * Export nested contained object.
     * RT6: xsi:type NON prefissato (classe del metamodello di default), stessa
     * forma degli XMI EMF single-metamodel e ciò che resolveDClass gestisce.
     */
    private static exportNestedObject(
        obj: LObject,
        refName: string,
        metamodel: LModel,
        mapId: (ptr: string) => string,
        indent: string,
        newline: string,
        level: number
    ): string {
        const i = indent.repeat(level);
        const parts: string[] = [];

        const metaclass = obj.instanceof as LClass;
        const className = metaclass?.name || 'Object';

        const attrs: string[] = [
            `xsi:type="${this.escapeXml(className)}"`,
            `xmi:id="${this.escapeXml(mapId(obj.id))}"`,
        ];
        const containedChildren: Array<{ refName: string; objects: LObject[] }> = [];
        this.serializeFeatures(obj, mapId, attrs, containedChildren);

        if (containedChildren.length > 0) {
            parts.push(`${i}<${refName} ${attrs.join(' ')}>`);
            for (const { refName: childRefName, objects } of containedChildren) {
                for (const child of objects) {
                    parts.push(this.exportNestedObject(child, childRefName, metamodel, mapId, indent, newline, level + 1));
                }
            }
            parts.push(`${i}</${refName}>`);
        } else {
            parts.push(`${i}<${refName} ${attrs.join(' ')}/>`);
        }

        return parts.join(newline);
    }

    /**
     * Resolve a value to an LObject if it's a pointer
     */
    private static resolveObject(value: any): LObject | null {
        if (!value) return null;
        if (typeof value === 'object' && value.className === 'DObject') {
            return LPointerTargetable.fromD(value) as LObject;
        }
        if (typeof value === 'string') {
            try {
                const state = store.getState();
                const d = state.idlookup[value];
                if (d && d.className === 'DObject') {
                    return LPointerTargetable.fromD(d) as LObject;
                }
            } catch {
                return null;
            }
        }
        return null;
    }

    // ============================================
    // IMPORT
    // ============================================

    /**
     * Import XMI XML string
     */
    static importFromXML(xmlString: string, filename?: string): XMIImportResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Parse XML to DOM
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlString, 'application/xml');

            // Check for parse errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                return {
                    success: false,
                    errors: ['Invalid XML: ' + parseError.textContent],
                    warnings: [],
                };
            }

            let importedMetamodel: LModel | undefined;

            // Try to extract embedded metamodel
            const embeddedMM = doc.querySelector('embeddedMetamodel ecore\\:EPackage') ||
                               doc.querySelector('embeddedMetamodel EPackage') ||
                               doc.querySelector('Documentation embeddedMetamodel > *');

            if (embeddedMM) {
                const serializer = new XMLSerializer();
                const mmXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                              serializer.serializeToString(embeddedMM);

                const mmResult = EcoreService.importFromXML(mmXml, filename ? `${filename}_metamodel` : 'imported_metamodel');

                if (mmResult.success && mmResult.model) {
                    importedMetamodel = mmResult.model;
                    warnings.push(...mmResult.warnings);
                } else {
                    warnings.push('Could not parse embedded metamodel: ' + mmResult.errors.join(', '));
                }
            } else {
                warnings.push('No embedded metamodel found in XMI - looking for existing metamodel');
            }

            // Find model namespace and match to metamodel
            const xmiRoot = doc.documentElement;
            const nsPrefix = this.findModelNamespacePrefix(xmiRoot);

            // Convert model instances to JSON for EcoreParser
            const modelJson = this.xmlToJson(xmiRoot);

            // Remove documentation/metamodel from model json
            delete modelJson['xmi:Documentation'];
            delete modelJson['Documentation'];

            // console.log('XMI to JSON:', modelJson);

            // If we have an imported metamodel, use it
            // Otherwise try to find matching metamodel by namespace
            const meta = importedMetamodel;

            // Parse model using EcoreParser
            const parsedElements = EcoreParser.parse(modelJson, false, filename || 'imported_model', true);

            // Find the created model
            const dmodel = parsedElements.find(e => e.className === DModel.cname) as DModel;
            if (!dmodel) {
                return {
                    success: false,
                    errors: ['No model was created from the import'],
                    warnings,
                };
            }

            const lmodel = LPointerTargetable.fromD(dmodel) as LModel;

            return {
                success: true,
                model: lmodel,
                metamodel: importedMetamodel,
                errors,
                warnings,
            };

        } catch (error) {
            return {
                success: false,
                errors: [`Import failed: ${(error as Error).message}`],
                warnings: [],
            };
        }
    }

    /**
     * Import from File object
     */
    static async importFromFile(file: File): Promise<XMIImportResult> {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target?.result as string;
                const filename = file.name.replace(/\.[^/.]+$/, '');
                resolve(this.importFromXML(content, filename));
            };

            reader.onerror = () => {
                resolve({
                    success: false,
                    errors: ['Failed to read file'],
                    warnings: [],
                });
            };

            reader.readAsText(file);
        });
    }

    // ============================================
    // M1 IMPORT (Phase B.1: flat instances + primitive attributes only)
    // ============================================

    /**
     * Import an M1 model from an XMI file. Resolves the metamodel automatically by
     * matching the document's default xmlns against the URI of any loaded EPackage.
     * Scope (B.1): root-level elements + primitive attributes. Containment, multi-valued
     * features, xsi:type polymorphism, and non-containment refs are out of scope.
     */
    static async importM1FromFile(file: File): Promise<XMIImportResult> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const filename = file.name.replace(/\.[^/.]+$/, '');
                resolve(XMIService.importM1FromXML(content, filename));
            };
            reader.onerror = () => {
                resolve({
                    success: false,
                    errors: ['Failed to read file'],
                    warnings: [],
                });
            };
            reader.readAsText(file);
        });
    }

    private static importM1FromXML(xmlString: string, filename: string): XMIImportResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlString, 'application/xml');
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                return { success: false, errors: [`Invalid XML: ${parseError.textContent}`], warnings };
            }

            const xmiRoot = doc.documentElement;
            // XMI 2.0 admits two root patterns:
            //   (a) wrapper: <xmi:XMI> with N root instances as children
            //   (b) single-root: the document root tag IS the unique root instance
            const isWrapper = (xmiRoot.tagName === 'xmi:XMI' || xmiRoot.tagName === 'XMI');

            const rootContent: any = this.xmlToJson(xmiRoot);

            const xmlnsDefault: string | undefined = rootContent['-xmlns'];
            if (xmlnsDefault === undefined) {
                return {
                    success: false,
                    errors: ['XMI file missing default xmlns attribute (cannot resolve metamodel)'],
                    warnings,
                };
            }
            if (xmlnsDefault === '') {
                return {
                    success: false,
                    errors: ['XMI file has empty xmlns attribute'],
                    warnings,
                };
            }

            const mmLookup = getMetamodelByNsURI(xmlnsDefault);
            if (mmLookup.ambiguous) {
                return {
                    success: false,
                    errors: [`Multiple metamodels with namespace '${xmlnsDefault}' loaded: [${mmLookup.ambiguous.join(', ')}]. Please remove duplicates before importing.`],
                    warnings,
                };
            }
            if (!mmLookup.model) {
                return {
                    success: false,
                    errors: [`No metamodel with namespace '${xmlnsDefault}' is loaded. Import the corresponding Ecore first.`],
                    warnings,
                };
            }
            const metamodel: LModel = mmLookup.model;

            const modelName = filename || 'imported_xmi_model';
            const dModel: DModel = DModel.new(modelName, metamodel.id, false, true);

            // Build the prefix → URI map ONCE from the root element's xmlns:* attrs.
            // XMI files declare all namespace prefixes at the root (nested redeclaration is
            // legal but extremely rare in EMF output and we don't support shadowing here).
            const nsPrefixMap = XMIService.buildNamespaceMap(rootContent);
            // Snapshot of every nsURI that resolves to a loaded metamodel — used by the
            // xmi:Extension / UML profile detector (any prefix mapping to an unknown URI is
            // treated as a foreign extension and skipped with a warning).
            const knownMetamodelURIs = new Set<string>();
            for (const uri of nsPrefixMap.values()) {
                if (getMetamodelByNsURI(uri).model) knownMetamodelURIs.add(uri);
            }
            if (xmlnsDefault) knownMetamodelURIs.add(xmlnsDefault);

            const ctx: XMIImportContext = {
                dModel,
                metamodel,
                xmiIdMap: new Map<string, Pointer<DObject>>(),
                nsPrefixMap,
                pendingRefs: [],
                knownMetamodelURIs,
                conformitySlots: new Map<Pointer<DObject>, Map<string, DValue>>(),
                summary: { dobjects: 0, attrs: 0, warnings: 0, refsResolved: 0, refsFailed: 0 },
                warnings,
            };

            type Pending = { dObject: DObject; itemJson: any; metaClass: LClass };
            const pending: Pending[] = [];

            if (isWrapper) {
                // Wrapper path: each non-dash key under <xmi:XMI> is a root instance (or array thereof).
                for (const key of Object.keys(rootContent)) {
                    if (key.startsWith('-')) continue;
                    // RT10: elementi di sistema sotto il wrapper (xmi:Documentation con
                    // l'embedded metamodel, xmi:Extension, xsi:*) non sono istanze radice:
                    // vanno saltati, non risolti come classi del metamodello.
                    if (key.startsWith('xmi:') || key.startsWith('xsi:')) {
                        const msg = `System element <${key}> under <xmi:XMI> skipped (not a model instance)`;
                        console.warn('[XMI import]', msg);
                        warnings.push(msg);
                        continue;
                    }
                    const val = rootContent[key];
                    const tag = key.indexOf(':') > 0 ? key.substring(key.indexOf(':') + 1) : key;

                    const metaClass = XMIService.findMetaclassByName(metamodel, tag);
                    if (!metaClass) {
                        errors.push(`Unknown class '${tag}' in metamodel '${metamodel.name}'`);
                        return { success: false, errors, warnings };
                    }

                    const items = Array.isArray(val) ? val : [val];
                    for (const item of items) {
                        const dObject: DObject = DObject.new(metaClass.id, dModel.id, DModel, undefined, true);
                        (dModel.objects as Pointer<DObject>[]).push(dObject.id);
                        ctx.summary.dobjects++;
                        pending.push({ dObject, itemJson: item, metaClass });
                    }
                }
            } else {
                // Single-root path: the document root tag itself is the unique root instance.
                // Its attributes and nested children are processed recursively by processInstance.
                const rootTag = xmiRoot.tagName;
                const tag = rootTag.indexOf(':') > 0 ? rootTag.substring(rootTag.indexOf(':') + 1) : rootTag;

                const metaClass = XMIService.findMetaclassByName(metamodel, tag);
                if (!metaClass) {
                    return {
                        success: false,
                        errors: [`Root element <${rootTag}> does not correspond to a class in metamodel '${metamodel.name}'. Expected either <xmi:XMI> wrapper or a class name from the metamodel.`],
                        warnings,
                    };
                }

                const dObject: DObject = DObject.new(metaClass.id, dModel.id, DModel, undefined, true);
                (dModel.objects as Pointer<DObject>[]).push(dObject.id);
                ctx.summary.dobjects++;
                pending.push({ dObject, itemJson: rootContent, metaClass });
            }

            // Pass 1 — recursive walker: each DObject.new / DValue.new opens its own TRANSACTION via
            // Constructors.persist (classes.ts:643). The sync layer (useJjomSync.ts:496-498)
            // forbids outer TRANSACTION wrapping, so processInstance runs as a bare loop.
            // During this pass non-containment references are deferred into ctx.pendingRefs
            // (their target DObjects may not yet exist when first seen).
            for (const { dObject, itemJson, metaClass } of pending) {
                XMIService.processInstance(itemJson, dObject, metaClass, ctx);
            }

            // Pass 2 — every DObject is now in the store; resolve queued non-containment refs.
            XMIService.resolveReferences(ctx);

            // Side-table — persist DObject.id → original xmi:id mapping for round-trip export.
            XMIService.persistMetadata(dModel, ctx.xmiIdMap);

            console.info('[XMI M1 Import] Completato:', {
                dobjects: ctx.summary.dobjects,
                attrs: ctx.summary.attrs,
                refsResolved: ctx.summary.refsResolved,
                refsFailed: ctx.summary.refsFailed,
                warnings: ctx.summary.warnings,
            });

            const lModel: LModel = LPointerTargetable.fromD(dModel) as LModel;
            return { success: true, model: lModel, errors, warnings, pattern: isWrapper ? 'wrapper' : 'single-root' };

        } catch (error) {
            return {
                success: false,
                errors: [`Import failed: ${(error as Error).message}`],
                warnings,
            };
        }
    }

    // Walk metamodel to find a class by name (M2 level), mirrors instance.ts:findMetaclassByName.
    private static findMetaclassByName(metamodel: LModel, className: string): LClass | null {
        const visited = new Set<string>();
        const stack: any[] = [metamodel];
        while (stack.length > 0) {
            const container = stack.pop();
            if (!container || visited.has(container.id)) continue;
            visited.add(container.id);
            const classes = container.classes ?? [];
            for (const c of classes) if (c?.name === className) return c as LClass;
            const subpackages = container.subpackages ?? container.subPackages ?? [];
            for (const sp of subpackages) stack.push(sp);
            const packages = container.packages ?? [];
            for (const p of packages) stack.push(p);
        }
        return null;
    }

    // Lookup attribute/reference by name including inherited ones via LClass.allAttributes/allReferences.
    private static findMetafeatureByName(metaClass: LClass, name: string): LAttribute | LReference | null {
        const attrs = (metaClass as any).allAttributes ?? [];
        for (const a of attrs) if (a?.name === name) return a as LAttribute;
        const refs = (metaClass as any).allReferences ?? [];
        for (const r of refs) if (r?.name === name) return r as LReference;
        return null;
    }

    // FIX 2026-07-20 (docs/discovery/discovery_2026-07-19_dvalue_duplicati_import_xmi.md):
    // every DObject.new with `instanceoff` gets one empty DValue slot per metaclass feature,
    // minted by LObject._forceConformity during Constructors.persist. The import must populate
    // THOSE slots instead of creating new DValues, or each feature present in the XMI ends up
    // with two slots (one empty, one populated) that both render and both persist in saves.
    // Timing: during the synchronous import walk the enclosing TRANSACTION has not committed
    // yet (END fires in a microtask), so the conformity slots are not in the store; they are
    // found in DPointerTargetable.pendingCreation, with the committed store as fallback.
    // The per-object feature→slot map is cached in ctx.conformitySlots.
    private static getConformitySlot(dObject: DObject, featureId: string, ctx: XMIImportContext): DValue | null {
        let slotsByFeature = ctx.conformitySlots.get(dObject.id);
        if (!slotsByFeature) {
            slotsByFeature = new Map<string, DValue>();
            const pending = DPointerTargetable.pendingCreation;
            for (const id in pending) {
                const e = pending[id] as DValue;
                if (e?.className === 'DValue' && e.father === dObject.id && e.instanceof
                    && !slotsByFeature.has(e.instanceof)) slotsByFeature.set(e.instanceof, e);
            }
            const state = store.getState();
            const storedObj = state.idlookup[dObject.id] as DObject | undefined;
            if (storedObj?.features) for (const fid of storedObj.features) {
                const v = state.idlookup[fid as string] as DValue | undefined;
                if (v?.className === 'DValue' && v.instanceof
                    && !slotsByFeature.has(v.instanceof)) slotsByFeature.set(v.instanceof, v);
            }
            ctx.conformitySlots.set(dObject.id, slotsByFeature);
        }
        return slotsByFeature.get(featureId) || null;
    }

    // B.2: recursive walker. For a given DObject + its corresponding JSON node, populate
    // primitive-attribute DValues and recurse into containment children. Pattern is the
    // single-pass nested traversal (B.2 has no non-containment references → no two-pass
    // resolver needed). xmi:id values are recorded in ctx.xmiIdMap as setup for B.3.
    //
    // Father wiring follows the EcoreParser.parseDObject convention (data.ts:588-593):
    //   • child.father = containmentDValue.id (fatherType=DValue)
    //   • containmentDValue.values.push(child.id) — registers the child semantically
    //   • dModel.objects.push(child.id) — also registers for canvas materialization
    //     (useJjomSync Step 2bis iterates rawModel.objects to auto-create DVertex)
    // The EMF eContainer (= parent DObject) is recoverable via 2-hop: child.father.father.
    private static processInstance(
        itemJson: any,
        dObject: DObject,
        metaClass: LClass,
        ctx: XMIImportContext,
    ): void {
        if (!itemJson || typeof itemJson !== 'object') return;

        // Side-table: record xmi:id → DObject pointer for B.3 cross-instance reference resolution.
        const xmiIdRaw = itemJson['-xmi:id'];
        if (typeof xmiIdRaw === 'string' && xmiIdRaw.length > 0) {
            ctx.xmiIdMap.set(xmiIdRaw, dObject.id);
        }

        for (const key of Object.keys(itemJson)) {
            if (key.startsWith('-')) {
                // XML attribute → primitive value (or system attribute to skip)
                XMIService.processAttribute(itemJson, key, dObject, metaClass, ctx);
            } else {
                // Nested element → containment child
                XMIService.processContainment(itemJson[key], key, dObject, metaClass, ctx);
            }
        }
    }

    // Handle a single XML attribute on the current DObject. Skips system attributes,
    // emits a warning for unknown features or non-containment cross-instance refs,
    // and creates a DValue for primitive attributes (with whitespace-split for multi-valued).
    private static processAttribute(
        itemJson: any,
        attrKey: string,
        dObject: DObject,
        metaClass: LClass,
        ctx: XMIImportContext,
    ): void {
        const featName = attrKey.substring(1);
        // Skip XML/XMI system attributes (not M1 features):
        // -xmi:version, -xmi:id, -xmi:type, -xsi:type, -xmlns, -xmlns:*
        if (featName === 'xsi:type' || featName === 'xmi:id') return;
        if (featName === 'xmi:version' || featName === 'xmi:type') return;
        if (featName.startsWith('xmlns')) return;

        const metaFeature = XMIService.findMetafeatureByName(metaClass, featName);
        if (!metaFeature) {
            const msg = `Unknown attribute "${featName}" on class "${metaClass.name}", skipped`;
            console.warn('[XMI import]', msg);
            ctx.warnings.push(msg);
            ctx.summary.warnings++;
            return;
        }

        if ((metaFeature as any).className === 'DReference') {
            // Reference expressed as XML attribute → non-containment cross-instance ref.
            // Defer to pass 2; the target DObject(s) may not yet exist at this point in pass 1.
            // The unsplit value is preserved verbatim — tokenisation (whitespace for multi-valued)
            // happens at resolution time inside resolveReferences().
            const rawRef = String(itemJson[attrKey] ?? '');
            ctx.pendingRefs.push({
                sourceDObject: dObject,
                feature: metaFeature as LReference,
                rawValue: rawRef,
                sourceTagPath: `${metaClass.name}.${featName}`,
            });
            return;
        }

        const rawValue: string = String(itemJson[attrKey]);
        const upperBound = Number((metaFeature as any).upperBound ?? 1);
        const isMulti = upperBound !== 1;

        let values: string[];
        if (isMulti) {
            // EMF default: whitespace split for multi-valued primitive attributes.
            values = rawValue.split(/\s+/).filter(v => v.length > 0);
            if (values.length > 1) {
                const msg = `Attribute "${featName}" on "${metaClass.name}" treated as space-separated list (${values.length} values). Quoted/escaped values not supported in MVP.`;
                console.warn('[XMI import]', msg);
                ctx.warnings.push(msg);
                ctx.summary.warnings++;
            }
        } else {
            values = [rawValue];
        }

        // Reuse the conformity slot when present (see getConformitySlot). Plain replace on
        // `values` + clearing isMirage mirrors the identity-slot population pattern in
        // LModelElement.tsx set_name (Direction A). Fallback (no slot) keeps the B.1 behavior.
        const conformitySlot = XMIService.getConformitySlot(dObject, metaFeature.id, ctx);
        if (conformitySlot) {
            SetFieldAction.new(conformitySlot.id, 'values', values as any, '', false);
            SetFieldAction.new(conformitySlot.id, 'isMirage', false, '', false);
        } else {
            const dValue: DValue = DValue.new(undefined, metaFeature.id as any, values, dObject.id, true, false);
            (dObject.features as Pointer<DValue>[]).push(dValue.id);
        }
        ctx.summary.attrs++;
    }

    // Handle a nested element under the current DObject. Three classes of child are recognised:
    //   1. xmi:Extension / foreign profile elements        → warn + skip (out of scope in Jjodel 3.0)
    //   2. non-containment reference expressed as element  → defer to pass 2 (Format B refs)
    //   3. containment reference                            → instantiate child (B.2 path + xsi:type resolution)
    //
    // Father wiring for containment is unchanged from B.2 (EcoreParser.parseDObject data.ts:588-593):
    //   • child.father = containmentDValue.id (fatherType=DValue)
    //   • containmentDValue.values.push(child.id)
    //   • dModel.objects.push(child.id) — for canvas materialisation via useJjomSync Step 2bis
    // The EMF eContainer (= parent DObject) remains recoverable via 2-hop: child.father.father.
    private static processContainment(
        childVal: any,
        childKey: string,
        parentDObject: DObject,
        parentMetaClass: LClass,
        ctx: XMIImportContext,
    ): void {
        // (1) Extension / unknown-profile detection runs first: anything not in a loaded
        // metamodel is silently dropped after a single warning (no recursion into the subtree).
        if (XMIService.isExtensionElement(childKey, ctx)) {
            const msg = `Element <${childKey}> on '${parentMetaClass.name}' detected as xmi:Extension or unrecognised profile; skipped (out of scope in Jjodel 3.0)`;
            console.warn('[XMI import]', msg);
            ctx.warnings.push(msg);
            ctx.summary.warnings++;
            return;
        }

        const featName = childKey.indexOf(':') > 0 ? childKey.substring(childKey.indexOf(':') + 1) : childKey;

        const containmentMeta = XMIService.findMetafeatureByName(parentMetaClass, featName);
        if (!containmentMeta) {
            const msg = `No feature "${featName}" on class "${parentMetaClass.name}" — nested element ignored`;
            console.warn('[XMI import]', msg);
            ctx.warnings.push(msg);
            ctx.summary.warnings++;
            return;
        }

        if ((containmentMeta as any).className !== 'DReference') {
            // Nested element matching an Attribute (not a Reference) is malformed XMI.
            const msg = `Feature "${featName}" on "${parentMetaClass.name}" is an attribute, not a reference — nested element ignored`;
            console.warn('[XMI import]', msg);
            ctx.warnings.push(msg);
            ctx.summary.warnings++;
            return;
        }

        const refMeta = containmentMeta as any;
        // L-layer LReference.containment is `composition || aggregation` (composition is the
        // D-layer storage canonical, per discovery_2026-05-14_a5_discovery_ecore_exporter).
        const isContainment = refMeta.containment === true || refMeta.composition === true;

        // (2) Non-containment reference via nested elements — XMI 2.0 "Format B".
        // Each item supplies a single target via -xmi:idref attribute or text content; both shapes are accepted.
        // The reference is deferred verbatim; tokenisation and lookup happen in resolveReferences().
        if (!isContainment) {
            const items = Array.isArray(childVal) ? childVal : [childVal];
            for (const item of items) {
                let token = '';
                if (typeof item === 'string') {
                    token = item.trim();
                } else if (item && typeof item === 'object') {
                    token = String(item['-xmi:idref'] ?? item['#text'] ?? '').trim();
                }
                if (!token) {
                    const msg = `Reference element <${featName}> on '${parentMetaClass.name}' has no xmi:idref or text content; skipped`;
                    console.warn('[XMI import]', msg);
                    ctx.warnings.push(msg);
                    ctx.summary.warnings++;
                    continue;
                }
                ctx.pendingRefs.push({
                    sourceDObject: parentDObject,
                    feature: containmentMeta as LReference,
                    rawValue: token,
                    sourceTagPath: `${parentMetaClass.name}.${featName}`,
                });
            }
            return;
        }

        // (3) Containment — original B.2 path, with xsi:type polymorphism plugged in.
        const fallbackClass = refMeta.type as LClass | undefined;
        if (!fallbackClass || typeof fallbackClass !== 'object') {
            const msg = `Containment feature "${featName}" on "${parentMetaClass.name}" has no declared type — cannot create children`;
            console.warn('[XMI import]', msg);
            ctx.warnings.push(msg);
            ctx.summary.warnings++;
            return;
        }

        // Reuse the conformity slot as the containment DValue when present (see
        // getConformitySlot); otherwise create it ONCE for this feature on the parent.
        const conformitySlot = XMIService.getConformitySlot(parentDObject, containmentMeta.id, ctx);
        let containmentDValue: DValue;
        if (conformitySlot) {
            containmentDValue = conformitySlot;
            SetFieldAction.new(containmentDValue.id, 'isMirage', false, '', false);
        } else {
            containmentDValue = DValue.new(undefined, containmentMeta.id as any, [], parentDObject.id, true, false);
            (parentDObject.features as Pointer<DValue>[]).push(containmentDValue.id);
        }

        const items = Array.isArray(childVal) ? childVal : [childVal];
        for (const childItem of items) {
            if (!childItem || typeof childItem !== 'object') continue;

            // xsi:type polymorphism: resolve the concrete subclass when present; otherwise use
            // the feature-declared type. resolveDClass logs its own warnings on prefix misses.
            const xsiTypeRaw: string | undefined = childItem['-xsi:type'];
            let childClass: LClass | null = XMIService.resolveDClass(xsiTypeRaw, ctx.metamodel, fallbackClass, ctx);
            if (!childClass) {
                // Resolution failed (unknown prefix or unknown classname). Fall back to the
                // declared feature type rather than dropping the child silently.
                childClass = fallbackClass;
            }

            // Type-safety guard: a non-null xsi:type must resolve to a (transitive) subclass of
            // the feature.type. Otherwise the XMI is malformed and we drop the child rather than
            // creating an instance of an incompatible class in the wrong slot.
            if (xsiTypeRaw && childClass !== fallbackClass && !XMIService.isSubclassOf(childClass, fallbackClass)) {
                const msg = `xsi:type '${xsiTypeRaw}' on '<${featName}>' resolves to '${childClass.name}', not a subclass of feature type '${fallbackClass.name}'; child skipped`;
                console.warn('[XMI import]', msg);
                ctx.warnings.push(msg);
                ctx.summary.warnings++;
                continue;
            }

            const child: DObject = DObject.new(childClass.id, containmentDValue.id, DValue, undefined, true);
            // FIX 2026-07-20: no direct push into containmentDValue.values. Constructors.DObject
            // already queues the SetFieldAction "values" '+=' on the father slot; since
            // CreateElementAction carries the pending DValue BY REFERENCE and the batch commits
            // after this synchronous walk, a direct push here gets serialized into the created
            // element AND re-appended by the '+=' action, duplicating every child pointer
            // (verified dynamically: pets = [c1, c2, c1, c2] pre-fix).
            (ctx.dModel.objects as Pointer<DObject>[]).push(child.id);
            ctx.summary.dobjects++;

            XMIService.processInstance(childItem, child, childClass, ctx);
        }
    }

    // ============================================
    // B.3 HELPERS
    // ============================================

    // Collect every `-xmlns:prefix` declaration on the document root into a prefix→URI map.
    // XMI documents virtually always declare all prefixes at the root (nested redeclaration is
    // legal under XML but extremely rare in EMF-generated output); supporting it would require
    // walking with an XML Element node rather than the post-`xmlToJson` plain object. Reject
    // gracefully if it ever shows up in practice.
    private static buildNamespaceMap(rootContent: any): Map<string, string> {
        const map = new Map<string, string>();
        if (!rootContent || typeof rootContent !== 'object') return map;
        for (const key of Object.keys(rootContent)) {
            if (!key.startsWith('-xmlns:')) continue;
            const prefix = key.substring('-xmlns:'.length);
            const uri = rootContent[key];
            if (typeof uri === 'string' && uri.length > 0) map.set(prefix, uri);
        }
        return map;
    }

    // Resolve the concrete LClass that should instantiate a containment child.
    // Algorithm:
    //   • no xsi:type           → return fallback (feature-declared type, the B.2 default)
    //   • `prefix:ClassName`    → look up prefix in nsPrefixMap → metamodel via nsURI → class by name
    //   • bare `ClassName`      → class lookup in the feature's parent metamodel
    // Any miss (unknown prefix, prefix not pointing at a loaded metamodel, class not in the
    // resolved metamodel) emits a warning and returns null so the caller can fall back to the
    // declared feature type. The subclass-of guard is enforced by the caller after this returns.
    private static resolveDClass(
        xsiTypeRaw: string | undefined,
        parentMetamodel: LModel,
        fallback: LClass | null | undefined,
        ctx: XMIImportContext,
    ): LClass | null {
        if (!xsiTypeRaw) return fallback ?? null;

        const colonIdx = xsiTypeRaw.indexOf(':');
        const prefix = colonIdx > 0 ? xsiTypeRaw.substring(0, colonIdx) : '';
        const className = colonIdx > 0 ? xsiTypeRaw.substring(colonIdx + 1) : xsiTypeRaw;

        let targetMetamodel: LModel = parentMetamodel;
        if (prefix) {
            const nsURI = ctx.nsPrefixMap.get(prefix);
            if (!nsURI) {
                const msg = `xsi:type prefix '${prefix}' is not declared as xmlns at the document root; falling back to default metamodel`;
                console.warn('[XMI import]', msg);
                ctx.warnings.push(msg);
                ctx.summary.warnings++;
            } else {
                const lookup = getMetamodelByNsURI(nsURI);
                if (lookup.model) {
                    targetMetamodel = lookup.model;
                } else {
                    const msg = `xsi:type prefix '${prefix}' (URI=${nsURI}) does not match any loaded metamodel`;
                    console.warn('[XMI import]', msg);
                    ctx.warnings.push(msg);
                    ctx.summary.warnings++;
                    return null;
                }
            }
        }

        const cls = XMIService.findMetaclassByName(targetMetamodel, className);
        if (!cls) {
            const msg = `xsi:type '${xsiTypeRaw}' resolves no class in metamodel '${targetMetamodel.name}'`;
            console.warn('[XMI import]', msg);
            ctx.warnings.push(msg);
            ctx.summary.warnings++;
            return null;
        }
        return cls;
    }

    // Transitive subclass test: `child` is a subclass of `parent` iff parent appears anywhere
    // in child.superclasses (the L-layer transitive closure of `extends`), or they are the same.
    private static isSubclassOf(child: LClass | null, parent: LClass | null | undefined): boolean {
        if (!child || !parent) return false;
        if (child.id === parent.id) return true;
        const supers: LClass[] = (child as any).superclasses ?? [];
        for (const sc of supers) if (sc && sc.id === parent.id) return true;
        return false;
    }

    // Element classifier used by processContainment to drop xmi:Extension, UML profile content
    // and anything else namespaced into a non-loaded metamodel before recursing into its subtree.
    // A bare-prefix element (`uml:Class`) is an extension iff its prefix is either undeclared, a
    // system prefix (xmi:, xsi:, ecore:) other than the document default, or points to a URI no
    // imported metamodel claims.
    private static isExtensionElement(key: string, ctx: XMIImportContext): boolean {
        if (key === 'xmi:Extension') return true;
        const colonIdx = key.indexOf(':');
        if (colonIdx <= 0) return false;
        const prefix = key.substring(0, colonIdx);
        if (prefix === 'xmi' || prefix === 'xsi') return true;
        const nsURI = ctx.nsPrefixMap.get(prefix);
        if (!nsURI) return true;
        return !ctx.knownMetamodelURIs.has(nsURI);
    }

    // Pass 2 — drain ctx.pendingRefs by tokenising each rawValue on whitespace, resolving every
    // token against ctx.xmiIdMap, and populating a DValue with the resolved pointers. Unresolved
    // tokens accumulate as warnings (refsFailed) but never abort the import. EMF path syntax
    // (`//@feature.idx`, `#//path`) is flagged as unsupported; literal xmi:id matching is still
    // attempted as a fallback per Hard rule 11.
    private static resolveReferences(ctx: XMIImportContext): void {
        for (const pending of ctx.pendingRefs) {
            const { sourceDObject, feature, rawValue, sourceTagPath } = pending;
            const tokens = rawValue.split(/\s+/).filter(t => t.length > 0);
            if (tokens.length === 0) continue;

            const upperBound = Number((feature as any).upperBound ?? 1);
            if (tokens.length > 1 && upperBound === 1) {
                const msg = `Multi-valued reference value '${rawValue}' assigned to single-valued feature ${sourceTagPath}`;
                console.warn('[XMI import]', msg);
                ctx.warnings.push(msg);
                ctx.summary.warnings++;
            }

            const resolved: Pointer<DObject>[] = [];
            for (const token of tokens) {
                if (token.startsWith('//@') || token.startsWith('#//')) {
                    const msg = `EMF path reference '${token}' on ${sourceTagPath} not supported in Jjodel; falling back to literal xmi:id matching`;
                    console.warn('[XMI import]', msg);
                    ctx.warnings.push(msg);
                    ctx.summary.warnings++;
                }
                const target = ctx.xmiIdMap.get(token);
                if (target) {
                    resolved.push(target);
                    ctx.summary.refsResolved++;
                } else {
                    const msg = `Reference target xmi:id='${token}' not found for ${sourceTagPath}; value left unresolved`;
                    console.warn('[XMI import]', msg);
                    ctx.warnings.push(msg);
                    ctx.summary.refsFailed++;
                    ctx.summary.warnings++;
                }
            }

            if (resolved.length > 0) {
                XMIService.populateReferenceValue(sourceDObject, feature, resolved, ctx);
            }
        }
    }

    // Materialise a reference slot as a DValue whose `values` are DObject pointers.
    // Mirror of the primitive-attribute population in processAttribute(); the only difference is
    // that the payload is an array of Pointer<DObject> rather than primitive strings. DValue.values
    // is typed `PrimitiveType[] | Pointer<DObject|DEnumLiteral>[]` (LModelElement.tsx:6277), so
    // both shapes share one canonical pattern.
    private static populateReferenceValue(
        sourceDObject: DObject,
        feature: LReference,
        targets: Pointer<DObject>[],
        ctx: XMIImportContext,
    ): void {
        // Reuse the conformity slot when present (see getConformitySlot). Targets are APPENDED
        // one by one with the proven '+=' single-value pattern (LModelElement.tsx set_name,
        // Direction A) rather than replacing the array: XMI "Format B" references arrive as one
        // pendingRefs entry PER nested element, so a replace would keep only the last target.
        const conformitySlot = XMIService.getConformitySlot(sourceDObject, feature.id, ctx);
        if (conformitySlot) {
            for (const target of targets) {
                SetFieldAction.new(conformitySlot.id, 'values', target, '+=', true);
            }
            SetFieldAction.new(conformitySlot.id, 'isMirage', false, '', false);
            return;
        }
        const dValue: DValue = DValue.new(undefined, feature.id as any, targets as any, sourceDObject.id, true, false);
        (sourceDObject.features as Pointer<DValue>[]).push(dValue.id);
    }

    // Side-table writer — invert ctx.xmiIdMap (xmi:id → DObject pointer) to the export-friendly
    // shape (DObject.id → original xmi:id) and persist it on DModel.metadata via SetFieldAction
    // so it survives Redux serialisation and is available for round-trip exporters (Phase B.7).
    private static persistMetadata(dModel: DModel, xmiIdMap: Map<string, Pointer<DObject>>): void {
        if (xmiIdMap.size === 0) return;
        const inverted: Record<string, string> = {};
        xmiIdMap.forEach((pointer, xmiId) => { inverted[pointer] = xmiId; });
        SetFieldAction.new(dModel.id, 'metadata', { xmiIdMap: inverted }, '', false);
    }

    // ============================================
    // UTILITIES
    // ============================================

    /**
     * Find model namespace prefix from XMI root
     */
    private static findModelNamespacePrefix(root: Element): string {
        const attrs = root.attributes;
        for (let i = 0; i < attrs.length; i++) {
            const attr = attrs[i];
            if (attr.name.startsWith('xmlns:') &&
                !attr.name.includes('xmi') &&
                !attr.name.includes('xsi') &&
                !attr.name.includes('ecore')) {
                return attr.name.replace('xmlns:', '');
            }
        }
        return '';
    }

    /**
     * Convert XML Element to JSON format for EcoreParser
     */
    private static xmlToJson(element: Element): any {
        const json: any = {};

        // Handle attributes
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            json['-' + attr.name] = attr.value;
        }

        // Handle child elements
        for (let i = 0; i < element.children.length; i++) {
            const child = element.children[i];
            const tagName = child.tagName;
            const childJson = this.xmlToJson(child);

            if (json[tagName] !== undefined) {
                if (!Array.isArray(json[tagName])) {
                    json[tagName] = [json[tagName]];
                }
                json[tagName].push(childJson);
            } else {
                json[tagName] = childJson;
            }
        }

        // Handle text content
        const textContent = element.textContent?.trim();
        if (textContent && element.children.length === 0) {
            if (Object.keys(json).length === 0) {
                return textContent;
            }
            json['#text'] = textContent;
        }

        return json;
    }

    /**
     * Escape XML special characters
     */
    private static escapeXml(str: string): string {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

export default XMIService;
