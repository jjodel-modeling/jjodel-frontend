/**
 * Ecore Service
 * Handles import and export of Ecore (.ecore) files
 * Works with XML format and integrates with existing EcoreParser
 */

import {
    EcoreParser,
    DModel,
    LModel,
    DPackage,
    LPackage,
    DClass,
    LClass,
    DAttribute,
    LAttribute,
    DReference,
    LReference,
    DEnumerator,
    LEnumerator,
    DEnumLiteral,
    LEnumLiteral,
    DOperation,
    LOperation,
    DParameter,
    LParameter,
    LPointerTargetable,
    Pointer,
    store,
    Selectors
} from '../../joiner';

// ============================================
// TYPES
// ============================================

export interface EcoreExportOptions {
    nsURI?: string;
    nsPrefix?: string;
    includeAnnotations?: boolean;
    prettyPrint?: boolean;
}

export interface EcoreImportResult {
    success: boolean;
    model?: LModel;
    errors: string[];
    warnings: string[];
}

// ============================================
// ECORE SERVICE
// ============================================

export class EcoreService {

    // ============================================
    // CONSTANTS
    // ============================================

    private static readonly ECORE_NSURI = 'http://www.eclipse.org/emf/2002/Ecore';

    /** Ecore.ecore reflection EClass names — emitted as cross-doc `ecore:EClass <ECORE_NSURI>#//<Name>`. */
    private static readonly ECORE_REFLECTION_CLASSES = new Set<string>([
        'EObject', 'EClass', 'EClassifier', 'EPackage', 'ENamedElement',
        'EAnnotation', 'ETypedElement', 'EModelElement', 'EStructuralFeature',
        'EReference', 'EAttribute', 'EOperation', 'EParameter',
        'EEnum', 'EEnumLiteral',
    ]);

    /** Ecore.ecore reflection EDataType names — emitted as cross-doc `ecore:EDataType <ECORE_NSURI>#//<Name>`. */
    private static readonly ECORE_REFLECTION_DATATYPES = new Set<string>([
        'EDiagnosticChain', 'EJavaObject', 'EJavaClass',
        'EFeatureMapEntry', 'EFeatureMap', 'EInvocationTargetException',
    ]);

    // ============================================
    // EXPORT
    // ============================================

    /**
     * Export metamodel to Ecore XML string.
     * - 1 package: root <ecore:EPackage> (single-package mode).
     * - N>1 packages: <xmi:XMI> wrapper with N <ecore:EPackage> children (multi-package mode).
     */
    static exportToXML(metamodel: LModel, options: EcoreExportOptions = {}): string {
        const packages = metamodel.packages || [];
        if (packages.length === 0) {
            throw new Error('Metamodel has no packages to export');
        }

        const indent = options.prettyPrint !== false ? '  ' : '';
        const newline = options.prettyPrint !== false ? '\n' : '';

        const xmlParts: string[] = [];
        xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');

        if (packages.length === 1) {
            // Single-package: <ecore:EPackage> as document root.
            const pkg = packages[0];
            const name = pkg.name || metamodel.name;
            const nsURI = options.nsURI || pkg.__raw.uri || `http://jjodel.org/${metamodel.name}`;
            const nsPrefix = options.nsPrefix || pkg.prefix || metamodel.name.toLowerCase();
            xmlParts.push(this.renderEPackageBody(pkg, name, nsURI, nsPrefix, indent, newline, '', true));
        } else {
            // Multi-package: <xmi:XMI> root with N <ecore:EPackage> children.
            // options.nsURI / options.nsPrefix are intentionally not applied here —
            // they would be ambiguous across N packages; each package keeps its own metadata.
            xmlParts.push(`<xmi:XMI xmi:version="2.0"`);
            xmlParts.push(`${indent}xmlns:xmi="http://www.omg.org/XMI"`);
            xmlParts.push(`${indent}xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`);
            xmlParts.push(`${indent}xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore">`);
            for (const pkg of packages) {
                const name = pkg.name || metamodel.name;
                const nsURI = pkg.__raw.uri || `http://jjodel.org/${metamodel.name}/${name}`;
                const nsPrefix = pkg.prefix || (pkg.name || metamodel.name).toLowerCase();
                xmlParts.push(this.renderEPackageBody(pkg, name, nsURI, nsPrefix, indent, newline, indent, false));
            }
            xmlParts.push('</xmi:XMI>');
        }

        return xmlParts.join(newline);
    }

    /**
     * Render the <ecore:EPackage>...</ecore:EPackage> body for a single package.
     * @param pkgIndent indentation prefix of the <ecore:EPackage> tag itself
     *                  (empty for single-package root, one `indent` for multi-package children).
     * @param isRoot when true, emits xmlns:* + xmi:version on the EPackage tag (single-package mode).
     *               When false, emits a bare EPackage tag (child of <xmi:XMI> in multi-package mode).
     */
    private static renderEPackageBody(
        pkg: LPackage,
        name: string,
        nsURI: string,
        nsPrefix: string,
        indent: string,
        newline: string,
        pkgIndent: string,
        isRoot: boolean
    ): string {
        const parts: string[] = [];
        const innerIndent = pkgIndent + indent;

        if (isRoot) {
            parts.push(`${pkgIndent}<ecore:EPackage xmi:version="2.0"`);
            parts.push(`${pkgIndent}${indent}xmlns:xmi="http://www.omg.org/XMI"`);
            parts.push(`${pkgIndent}${indent}xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`);
            parts.push(`${pkgIndent}${indent}xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"`);
            parts.push(`${pkgIndent}${indent}name="${this.escapeXml(name)}"`);
            parts.push(`${pkgIndent}${indent}nsURI="${this.escapeXml(nsURI)}"`);
            parts.push(`${pkgIndent}${indent}nsPrefix="${this.escapeXml(nsPrefix)}">`);
        } else {
            parts.push(`${pkgIndent}<ecore:EPackage name="${this.escapeXml(name)}" nsURI="${this.escapeXml(nsURI)}" nsPrefix="${this.escapeXml(nsPrefix)}">`);
        }

        const classes = pkg.classes || [];
        for (const cls of classes) {
            parts.push(this.exportClass(cls, classes, innerIndent, newline, pkg));
        }

        const enums = pkg.enumerators || [];
        for (const enumType of enums) {
            parts.push(this.exportEnumerator(enumType, innerIndent, newline));
        }

        // Sub-package nesting level: 1 under a root EPackage, 2 under <xmi:XMI> children.
        const subpackages = pkg.subpackages || [];
        const subPkgLevel = isRoot ? 1 : 2;
        for (const subpkg of subpackages) {
            parts.push(this.exportSubPackage(subpkg, indent, newline, subPkgLevel));
        }

        parts.push(`${pkgIndent}</ecore:EPackage>`);
        return parts.join(newline);
    }

    /**
     * Export to file and trigger browser download
     */
    static exportToFile(metamodel: LModel, options: EcoreExportOptions = {}): void {
        const xml = this.exportToXML(metamodel, options);
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${metamodel.name}.ecore`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Export EClass
     */
    private static exportClass(cls: LClass, allClasses: LClass[], indent: string, newline: string, currentPackage: LPackage): string {
        const parts: string[] = [];
        const i = indent;

        // Class attributes
        const classAttrs: string[] = [
            `xsi:type="ecore:EClass"`,
            `name="${this.escapeXml(cls.name)}"`,
        ];

        // Abstract?
        if (cls.abstract) {
            classAttrs.push(`abstract="true"`);
        }

        // Interface?
        if (cls.interface) {
            classAttrs.push(`interface="true"`);
        }

        // Superclasses (extends) — emitted with cross-package-aware pointer.
        const superTypes = cls.extends || [];
        if (superTypes.length > 0) {
            const superRefs = superTypes.map(st => this.crossPackagePointer(st, currentPackage)).join(' ');
            classAttrs.push(`eSuperTypes="${superRefs}"`);
        }

        // Check if class has children
        const attributes = cls.attributes || [];
        const references = cls.references || [];
        const operations = cls.operations || [];
        const hasChildren = attributes.length > 0 || references.length > 0 || operations.length > 0;

        if (hasChildren) {
            parts.push(`${i}<eClassifiers ${classAttrs.join(' ')}>`);

            // Export attributes
            for (const attr of attributes) {
                parts.push(this.exportAttribute(attr, i + indent));
            }

            // Export references
            for (const ref of references) {
                parts.push(this.exportReference(ref, allClasses, i + indent, currentPackage));
            }

            // Export operations
            for (const op of operations) {
                parts.push(this.exportOperation(op, i + indent, newline, currentPackage));
            }

            parts.push(`${i}</eClassifiers>`);
        } else {
            parts.push(`${i}<eClassifiers ${classAttrs.join(' ')}/>`);
        }

        return parts.join(newline);
    }

    /**
     * Export EAttribute
     */
    private static exportAttribute(attr: LAttribute, indent: string): string {
        const parts: string[] = [
            `xsi:type="ecore:EAttribute"`,
            `name="${this.escapeXml(attr.name)}"`,
        ];

        // Type mapping
        const ecoreType = this.mapToEcoreType(attr.type);
        parts.push(`eType="${ecoreType}"`);

        // Multiplicity
        if (attr.lowerBound !== undefined && attr.lowerBound !== 0) {
            parts.push(`lowerBound="${attr.lowerBound}"`);
        }
        if (attr.upperBound !== undefined && attr.upperBound !== 1) {
            parts.push(`upperBound="${attr.upperBound}"`);
        }

        // ordered/unique — opt-only emission (EMF default true)
        if (attr.ordered === false) parts.push(`ordered="false"`);
        if (attr.unique === false) parts.push(`unique="false"`);

        // Default value
        /*if (attr.defaultValueLiteral) {
            parts.push(`defaultValueLiteral="${this.escapeXml(attr.defaultValueLiteral)}"`);
        }*/

        // Other properties
        if (attr.derived) parts.push(`derived="true"`);
        if (attr.transient) parts.push(`transient="true"`);
        if (attr.volatile) parts.push(`volatile="true"`);
        if (attr.unsettable) parts.push(`unsettable="true"`);
        if (!attr.changeable) parts.push(`changeable="false"`);

        return `${indent}<eStructuralFeatures ${parts.join(' ')}/>`;
    }

    /**
     * Export EReference
     */
    private static exportReference(ref: LReference, allClasses: LClass[], indent: string, currentPackage: LPackage): string {
        const parts: string[] = [
            `xsi:type="ecore:EReference"`,
            `name="${this.escapeXml(ref.name)}"`,
        ];

        // Target type — emitted with reflection-aware, cross-package-aware pointer.
        const targetType = ref.type;
        if (targetType) {
            parts.push(`eType="${this.targetTypePointer(targetType, currentPackage)}"`);
        }

        // Multiplicity
        if (ref.lowerBound !== undefined) {
            parts.push(`lowerBound="${ref.lowerBound}"`);
        }
        if (ref.upperBound !== undefined && ref.upperBound !== 1) {
            parts.push(`upperBound="${ref.upperBound}"`);
        }

        // Feature flags — opt-only emission, strict === comparison (false-positive guard on undefined/missing).
        if (ref.ordered === false) parts.push(`ordered="false"`);
        if (ref.unique === false) parts.push(`unique="false"`);
        if (ref.changeable === false) parts.push(`changeable="false"`);
        if (ref.derived === true) parts.push(`derived="true"`);
        if (ref.transient === true) parts.push(`transient="true"`);
        if (ref.volatile === true) parts.push(`volatile="true"`);
        if (ref.unsettable === true) parts.push(`unsettable="true"`);

        // Containment (composition)
        if (ref.composition || ref.containment) {
            parts.push(`containment="true"`);
        }

        // Opposite reference — class-level pointer is cross-package-aware,
        // then we append /featureName for the opposite's own name.
        const opposite = ref.opposite;
        if (opposite && targetType) {
            parts.push(`eOpposite="${this.crossPackagePointer(targetType, currentPackage)}/${this.escapeXml(opposite.name)}"`);
        }

        return `${indent}<eStructuralFeatures ${parts.join(' ')}/>`;
    }

    /**
     * Export EOperation
     */
    private static exportOperation(op: LOperation, indent: string, newline: string, currentPackage: LPackage): string {
        const parts: string[] = [];

        const opAttrs: string[] = [
            `xsi:type="ecore:EOperation"`,
            `name="${this.escapeXml(op.name)}"`,
        ];

        // Return type — reflection-aware, cross-package-aware, primitive-aware pointer.
        const returnType = op.type;
        if (returnType) {
            const ecoreType = this.targetTypePointer(returnType, currentPackage);
            opAttrs.push(`eType="${ecoreType}"`);
        }

        const parameters = op.parameters || [];

        if (parameters.length > 0) {
            parts.push(`${indent}<eOperations ${opAttrs.join(' ')}>`);

            for (const param of parameters) {
                parts.push(this.exportParameter(param, indent + '  ', currentPackage));
            }

            parts.push(`${indent}</eOperations>`);
        } else {
            parts.push(`${indent}<eOperations ${opAttrs.join(' ')}/>`);
        }

        return parts.join(newline);
    }

    /**
     * Export EParameter
     */
    private static exportParameter(param: LParameter, indent: string, currentPackage: LPackage): string {
        const parts: string[] = [
            `xsi:type="ecore:EParameter"`,
            `name="${this.escapeXml(param.name)}"`,
        ];

        const paramType = param.type;
        if (paramType) {
            const ecoreType = this.targetTypePointer(paramType, currentPackage);
            parts.push(`eType="${ecoreType}"`);
        }

        return `${indent}<eParameters ${parts.join(' ')}/>`;
    }

    /**
     * Export EEnum
     */
    private static exportEnumerator(enumType: LEnumerator, indent: string, newline: string): string {
        const parts: string[] = [];

        parts.push(`${indent}<eClassifiers xsi:type="ecore:EEnum" name="${this.escapeXml(enumType.name)}">`);

        const literals = enumType.literals || [];
        literals.forEach((literal, index) => {
            const ordinal = literal.ordinal !== undefined ? literal.ordinal : index;
            parts.push(`${indent}${indent}<eLiterals name="${this.escapeXml(literal.literal)}" value="${ordinal}"/>`);
        });

        parts.push(`${indent}</eClassifiers>`);

        return parts.join(newline);
    }

    /**
     * Export sub-package (recursive)
     */
    private static exportSubPackage(pkg: LPackage, indent: string, newline: string, level: number): string {
        const i = indent.repeat(level);
        const parts: string[] = [];

        parts.push(`${i}<eSubpackages name="${this.escapeXml(pkg.name)}"${pkg.__raw.uri ? ` nsURI="${this.escapeXml(pkg.__raw.uri)}"` : ''}${pkg.prefix ? ` nsPrefix="${this.escapeXml(pkg.prefix)}"` : ''}>`);

        // Classes
        for (const cls of pkg.classes || []) {
            parts.push(this.exportClass(cls, pkg.classes || [], i + indent, newline, pkg));
        }

        // Enums
        for (const enumType of pkg.enumerators || []) {
            parts.push(this.exportEnumerator(enumType, i + indent, newline));
        }

        // Recursive sub-packages
        for (const subpkg of pkg.subpackages || []) {
            parts.push(this.exportSubPackage(subpkg, indent, newline, level + 1));
        }

        parts.push(`${i}</eSubpackages>`);

        return parts.join(newline);
    }

    // ============================================
    // IMPORT
    // ============================================

    /**
     * Import Ecore XML string
     */
    static importFromXML(xmlString: string, filename?: string): EcoreImportResult {
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

            // Convert XML DOM to JSON format expected by EcoreParser
            const json = this.xmlToJson(doc.documentElement);

            // console.log('Ecore XML to JSON:', json);

            // Use existing EcoreParser
            const parsedElements = EcoreParser.parse(json, true, filename || 'imported', true);

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
    static async importFromFile(file: File): Promise<EcoreImportResult> {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target?.result as string;
                const filename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
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
     * Convert XML Element to JSON format for EcoreParser
     * Uses '@' prefix for attributes (as expected by EcoreParser)
     */
    private static xmlToJson(element: Element): any {
        const json: any = {};

        // Handle attributes
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            // Use '-' prefix as EcoreParser expects
            json['-' + attr.name] = attr.value;
        }

        // Handle child elements
        for (let i = 0; i < element.children.length; i++) {
            const child = element.children[i];
            const tagName = child.tagName;
            const childJson = this.xmlToJson(child);

            // If key already exists, convert to array
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
     * Map Jjodel/generic type to Ecore type
     */
    private static mapToEcoreType(type: any): string {
        if (!type) return 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString';

        // If type is a class/classifier reference
        const typeName = typeof type === 'string' ? type : (type.name || 'EString');

        const typeMap: Record<string, string> = {
            'String': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString',
            'EString': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString',
            'string': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString',
            'Integer': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt',
            'EInt': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt',
            'int': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt',
            'Boolean': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EBoolean',
            'EBoolean': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EBoolean',
            'boolean': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EBoolean',
            'Float': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EFloat',
            'EFloat': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EFloat',
            'float': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EFloat',
            'Double': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDouble',
            'EDouble': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDouble',
            'double': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDouble',
            'Date': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDate',
            'EDate': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDate',
            'Long': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//ELong',
            'ELong': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//ELong',
            'Short': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EShort',
            'EShort': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EShort',
            'Byte': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EByte',
            'EByte': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EByte',
            'Char': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EChar',
            'EChar': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EChar',
        };

        // Check if it's a primitive type
        if (typeMap[typeName]) {
            return typeMap[typeName];
        }

        // Otherwise it's a reference to a class in the model
        return `#//${typeName}`;
    }

    /**
     * Build an Ecore pointer for an eType reference.
     *
     * Resolution order:
     *  1. Ecore.ecore reflection classes (EObject, EClass, ENamedElement, ...): emit
     *     cross-doc `ecore:EClass <ECORE_NSURI>#//<Name>` form.
     *  2. Ecore.ecore reflection datatypes (EDiagnosticChain, EJavaObject, ...): emit
     *     cross-doc `ecore:EDataType <ECORE_NSURI>#//<Name>` form.
     *  3. Primitive datatypes (EString, EInt, EBoolean, ...): delegate to
     *     mapToEcoreType, which returns the canonical cross-doc EDataType form.
     *  4. Anything else (user-defined class in the model): delegate to
     *     crossPackagePointer for intra/cross-package XPath.
     *
     * Use this for the eType attribute of EReference, EOperation, and eParameters.
     * Do NOT use this for the prefix of eOpposite (which is always intra-document).
     */
    private static targetTypePointer(target: any, fromPackage: LPackage | undefined | null): string {
        if (!target) {
            console.warn('[EcoreService] targetTypePointer: target is null/undefined');
            return '';
        }
        const name = target.name || '';
        if (this.ECORE_REFLECTION_CLASSES.has(name)) {
            return `ecore:EClass ${this.ECORE_NSURI}#//${name}`;
        }
        if (this.ECORE_REFLECTION_DATATYPES.has(name)) {
            return `ecore:EDataType ${this.ECORE_NSURI}#//${name}`;
        }
        // Primitive datatypes: mapToEcoreType returns the canonical cross-doc form
        // ('ecore:EDataType http://.../#//EString'); only treat as primitive when the
        // returned string carries the cross-doc prefix (otherwise it's the '#//X'
        // fallback for non-primitive type names, which we handle below).
        const primitiveAttempt = this.mapToEcoreType(target);
        if (primitiveAttempt.startsWith('ecore:EDataType http://')) {
            return primitiveAttempt;
        }
        return this.crossPackagePointer(target, fromPackage);
    }

    /**
     * Build an Ecore XPath-style pointer to a classifier within the same document.
     * Returns '#//ClassName' when the target is in the same package as the referrer,
     * or '#//PackageName/ClassName' when the target lives in a sibling package
     * within the same metamodel. Cross-document refs to Ecore-native primitives
     * are handled separately by mapToEcoreType().
     */
    private static crossPackagePointer(target: any, fromPackage: LPackage | undefined | null): string {
        if (!target) {
            console.warn('[EcoreService] crossPackagePointer: target is null/undefined');
            return '';
        }
        const targetName = this.escapeXml(target.name || '');
        const targetPkg: LPackage | undefined | null = target.package;
        if (!targetPkg || !fromPackage || targetPkg.id === fromPackage.id) {
            return `#//${targetName}`;
        }
        return `#//${this.escapeXml(targetPkg.name || '')}/${targetName}`;
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

export default EcoreService;
