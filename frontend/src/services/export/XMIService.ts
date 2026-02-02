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
    LPointerTargetable,
    Pointer,
    store,
    Selectors
} from '../../joiner';
import { EcoreService } from './EcoreService';

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

            console.log('XMI to JSON:', modelJson);

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
