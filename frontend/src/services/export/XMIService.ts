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
    LPointerTargetable,
    Pointer,
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
}

// Context shared across the recursive walker for B.2 nested containment.
// `xmiIdMap` is populated in B.2 but not yet consulted — setup for B.3 references.
type XMIImportContext = {
    dModel: DModel;
    metamodel: LModel;
    xmiIdMap: Map<string, Pointer<DObject>>;
    summary: { dobjects: number; attrs: number; warnings: number };
    warnings: string[];
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

        const nsURI = pkg.uri || `http://jjodel.org/${metamodel.name}`;
        const nsPrefix = pkg.prefix || metamodel.name.toLowerCase();

        const xmlParts: string[] = [];

        // XML Declaration
        xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');

        // XMI Root
        xmlParts.push(`<xmi:XMI xmi:version="2.0"`);
        xmlParts.push(`${indent}xmlns:xmi="http://www.omg.org/XMI"`);
        xmlParts.push(`${indent}xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`);
        xmlParts.push(`${indent}xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"`);
        xmlParts.push(`${indent}xmlns:${nsPrefix}="${this.escapeXml(nsURI)}">`);

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

        const objects = model.objects || [];
        for (const obj of objects) {
            xmlParts.push(this.exportObject(obj, metamodel, nsPrefix, indent, newline));
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
     * Export single object instance
     */
    private static exportObject(
        obj: LObject,
        metamodel: LModel,
        nsPrefix: string,
        indent: string,
        newline: string
    ): string {
        const parts: string[] = [];
        const i = indent;

        // Get class name from instanceof
        const metaclass = obj.instanceof as LClass;
        const className = metaclass?.name || 'Object';

        // Opening tag with xmi:id
        const attrs: string[] = [`xmi:id="${this.escapeXml(obj.id)}"`];

        // Get feature values
        const features = obj.features || [];
        const containedChildren: Array<{ refName: string; objects: LObject[] }> = [];

        for (const feature of features) {
            const metaFeature = feature.instanceof as LAttribute | LReference;
            const featureName = metaFeature?.name || feature.name || 'unknown';
            const values = feature.values || [];

            if (!metaFeature || metaFeature.className === 'DAttribute') {
                // Simple attribute - add to tag attributes
                if (values.length === 1) {
                    attrs.push(`${featureName}="${this.escapeXml(String(values[0]))}"`);
                } else if (values.length > 1) {
                    // Multi-valued attribute
                    attrs.push(`${featureName}="${values.map(v => this.escapeXml(String(v))).join(' ')}"`);
                }
            } else {
                // Reference - could be containment or non-containment
                const refMeta = metaFeature as LReference;
                if (refMeta.composition || refMeta.containment) {
                    // Contained objects - will be nested
                    const childObjects = values
                        .map(v => this.resolveObject(v))
                        .filter(o => o !== null) as LObject[];
                    if (childObjects.length > 0) {
                        containedChildren.push({ refName: featureName, objects: childObjects });
                    }
                } else {
                    // Non-containment reference - use xmi:idref or href
                    if (values.length > 0) {
                        const refs = values.map(v => {
                            if (typeof v === 'string') return v; // Already a pointer/id
                            const resolved = this.resolveObject(v);
                            return resolved?.id || String(v);
                        });
                        attrs.push(`${featureName}="${refs.join(' ')}"`);
                    }
                }
            }
        }

        // Build the element
        if (containedChildren.length > 0) {
            parts.push(`${i}<${nsPrefix}:${className} ${attrs.join(' ')}>`);

            // Nested contained objects
            for (const { refName, objects } of containedChildren) {
                for (const child of objects) {
                    parts.push(this.exportNestedObject(child, refName, metamodel, nsPrefix, indent, newline, 2));
                }
            }

            parts.push(`${i}</${nsPrefix}:${className}>`);
        } else {
            parts.push(`${i}<${nsPrefix}:${className} ${attrs.join(' ')}/>`);
        }

        return parts.join(newline);
    }

    /**
     * Export nested contained object
     */
    private static exportNestedObject(
        obj: LObject,
        refName: string,
        metamodel: LModel,
        nsPrefix: string,
        indent: string,
        newline: string,
        level: number
    ): string {
        const i = indent.repeat(level);
        const parts: string[] = [];

        const metaclass = obj.instanceof as LClass;
        const className = metaclass?.name || 'Object';

        const attrs: string[] = [
            `xsi:type="${nsPrefix}:${className}"`,
            `xmi:id="${this.escapeXml(obj.id)}"`,
        ];

        // Add simple attributes
        const features = obj.features || [];
        const containedChildren: Array<{ refName: string; objects: LObject[] }> = [];

        for (const feature of features) {
            const metaFeature = feature.instanceof as LAttribute | LReference;
            const featureName = metaFeature?.name || feature.name || 'unknown';
            const values = feature.values || [];

            if (!metaFeature || metaFeature.className === 'DAttribute') {
                if (values.length === 1) {
                    attrs.push(`${featureName}="${this.escapeXml(String(values[0]))}"`);
                } else if (values.length > 1) {
                    attrs.push(`${featureName}="${values.map(v => this.escapeXml(String(v))).join(' ')}"`);
                }
            } else {
                const refMeta = metaFeature as LReference;
                if (refMeta.composition || refMeta.containment) {
                    const childObjects = values
                        .map(v => this.resolveObject(v))
                        .filter(o => o !== null) as LObject[];
                    if (childObjects.length > 0) {
                        containedChildren.push({ refName: featureName, objects: childObjects });
                    }
                } else if (values.length > 0) {
                    const refs = values.map(v => {
                        const resolved = this.resolveObject(v);
                        return resolved?.id || String(v);
                    });
                    attrs.push(`${featureName}="${refs.join(' ')}"`);
                }
            }
        }

        if (containedChildren.length > 0) {
            parts.push(`${i}<${refName} ${attrs.join(' ')}>`);

            for (const { refName: childRefName, objects } of containedChildren) {
                for (const child of objects) {
                    parts.push(this.exportNestedObject(child, childRefName, metamodel, nsPrefix, indent, newline, level + 1));
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

            XMIService.checkForXsiType(rootContent, warnings, 5, '');

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

            const ctx: XMIImportContext = {
                dModel,
                metamodel,
                xmiIdMap: new Map<string, Pointer<DObject>>(),
                summary: { dobjects: 0, attrs: 0, warnings: 0 },
                warnings,
            };

            type Pending = { dObject: DObject; itemJson: any; metaClass: LClass };
            const pending: Pending[] = [];

            if (isWrapper) {
                // Wrapper path: each non-dash key under <xmi:XMI> is a root instance (or array thereof).
                for (const key of Object.keys(rootContent)) {
                    if (key.startsWith('-')) continue;
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

            // Recursive walker: each DObject.new / DValue.new opens its own TRANSACTION via
            // Constructors.persist (classes.ts:643). The sync layer (useJjomSync.ts:496-498)
            // forbids outer TRANSACTION wrapping, so processInstance runs as a bare loop.
            for (const { dObject, itemJson, metaClass } of pending) {
                XMIService.processInstance(itemJson, dObject, metaClass, ctx);
            }

            console.info('[XMI M1 Import] Completato:', {
                dobjects: ctx.summary.dobjects,
                attrs: ctx.summary.attrs,
                warnings: ctx.summary.warnings,
            });

            const lModel: LModel = LPointerTargetable.fromD(dModel) as LModel;
            return { success: true, model: lModel, errors, warnings };

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
            // Containment refs are expressed as nested elements, not XML attributes.
            // A reference-as-attribute value here is a non-containment cross-instance ref → B.3 scope.
            const msg = `Reference attribute "${featName}" on "${metaClass.name}" skipped (non-containment cross-instance ref is B.3 scope)`;
            console.warn('[XMI import]', msg);
            ctx.warnings.push(msg);
            ctx.summary.warnings++;
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

        const dValue: DValue = DValue.new(undefined, metaFeature.id as any, values, dObject.id, true, false);
        (dObject.features as Pointer<DValue>[]).push(dValue.id);
        ctx.summary.attrs++;
    }

    // Handle a nested element under the current DObject. Identifies the corresponding
    // containment feature on the parent metaclass, creates the containment DValue once,
    // then for each child item creates a child DObject (father = containmentDValue, pattern
    // EcoreParser.parseDObject data.ts:588-593) and recurses.
    private static processContainment(
        childVal: any,
        childKey: string,
        parentDObject: DObject,
        parentMetaClass: LClass,
        ctx: XMIImportContext,
    ): void {
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
        if (!isContainment) {
            const msg = `Reference "${featName}" on "${parentMetaClass.name}" is non-containment — nested element ignored (B.3 scope)`;
            console.warn('[XMI import]', msg);
            ctx.warnings.push(msg);
            ctx.summary.warnings++;
            return;
        }

        const childClass = refMeta.type as LClass | undefined;
        if (!childClass || typeof childClass !== 'object') {
            const msg = `Containment feature "${featName}" on "${parentMetaClass.name}" has no declared type — cannot create children`;
            console.warn('[XMI import]', msg);
            ctx.warnings.push(msg);
            ctx.summary.warnings++;
            return;
        }

        // Create the containment DValue ONCE for this feature on the parent.
        const containmentDValue: DValue = DValue.new(undefined, containmentMeta.id as any, [], parentDObject.id, true, false);
        (parentDObject.features as Pointer<DValue>[]).push(containmentDValue.id);

        const items = Array.isArray(childVal) ? childVal : [childVal];
        for (const childItem of items) {
            if (!childItem || typeof childItem !== 'object') continue;

            // xsi:type polymorphism is B.3 scope — use feature-declared type as fallback.
            const xsiType = childItem['-xsi:type'];
            if (xsiType) {
                const msg = `xsi:type "${xsiType}" on child "${featName}" of "${parentMetaClass.name}" ignored (B.3 scope; using feature-declared type "${childClass.name}")`;
                console.warn('[XMI import]', msg);
                ctx.warnings.push(msg);
                ctx.summary.warnings++;
            }

            // Father wiring per D1 decision (2-hop EMF-aligned, same as EcoreParser.parseDObject).
            const child: DObject = DObject.new(childClass.id, containmentDValue.id, DValue, undefined, true);
            (containmentDValue.values as Pointer<DObject>[]).push(child.id);
            // Also push to dModel.objects so useJjomSync Step 2bis materializes a DVertex.
            (ctx.dModel.objects as Pointer<DObject>[]).push(child.id);
            ctx.summary.dobjects++;

            // Recurse into this child.
            XMIService.processInstance(childItem, child, childClass, ctx);
        }
    }

    // Surface up to maxWarnings occurrences of xsi:type for B.3 follow-up.
    private static checkForXsiType(json: any, warnings: string[], maxWarnings: number, path: string): void {
        if (warnings.length >= maxWarnings) return;
        if (!json || typeof json !== 'object') return;
        if (Array.isArray(json)) {
            for (let i = 0; i < json.length; i++) {
                this.checkForXsiType(json[i], warnings, maxWarnings, `${path}[${i}]`);
                if (warnings.length >= maxWarnings) return;
            }
            return;
        }
        for (const key of Object.keys(json)) {
            if (key === '-xsi:type') {
                warnings.push(`xsi:type "${json[key]}" at ${path || '<root>'} ignored (B.3 scope; using tag-derived type)`);
                if (warnings.length >= maxWarnings) return;
            } else if (typeof json[key] === 'object') {
                this.checkForXsiType(json[key], warnings, maxWarnings, path ? `${path}.${key}` : key);
                if (warnings.length >= maxWarnings) return;
            }
        }
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
