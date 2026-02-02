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
    // EXPORT
    // ============================================

    /**
     * Export metamodel to Ecore XML string
     */
    static exportToXML(metamodel: LModel, options: EcoreExportOptions = {}): string {
        const pkg = metamodel.packages[0]; // Root package
        if (!pkg) {
            throw new Error('Metamodel has no packages to export');
        }

        const nsURI = options.nsURI || pkg.uri || `http://jjodel.org/${metamodel.name}`;
        const nsPrefix = options.nsPrefix || pkg.prefix || metamodel.name.toLowerCase();
        const indent = options.prettyPrint !== false ? '  ' : '';
        const newline = options.prettyPrint !== false ? '\n' : '';

        const xmlParts: string[] = [];

        // XML Declaration
        xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');

        // Root EPackage
        xmlParts.push(`<ecore:EPackage xmi:version="2.0"`);
        xmlParts.push(`${indent}xmlns:xmi="http://www.omg.org/XMI"`);
        xmlParts.push(`${indent}xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`);
        xmlParts.push(`${indent}xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"`);
        xmlParts.push(`${indent}name="${this.escapeXml(pkg.name || metamodel.name)}"`);
        xmlParts.push(`${indent}nsURI="${this.escapeXml(nsURI)}"`);
        xmlParts.push(`${indent}nsPrefix="${this.escapeXml(nsPrefix)}">`);

        // Export classes
        const classes = pkg.classes || [];
        for (const cls of classes) {
            xmlParts.push(this.exportClass(cls, classes, indent, newline));
        }

        // Export enumerators
        const enums = pkg.enumerators || [];
        for (const enumType of enums) {
            xmlParts.push(this.exportEnumerator(enumType, indent, newline));
        }

        // Export sub-packages (recursive)
        const subpackages = pkg.subpackages || [];
        for (const subpkg of subpackages) {
            xmlParts.push(this.exportSubPackage(subpkg, indent, newline, 1));
        }

        // Close EPackage
        xmlParts.push('</ecore:EPackage>');

        return xmlParts.join(newline);
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
    private static exportClass(cls: LClass, allClasses: LClass[], indent: string, newline: string): string {
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

        // Superclasses (extends)
        const superTypes = cls.extends || [];
        if (superTypes.length > 0) {
            const superRefs = superTypes.map(st => `#//${st.name}`).join(' ');
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
                parts.push(this.exportReference(ref, allClasses, i + indent));
            }

            // Export operations
            for (const op of operations) {
                parts.push(this.exportOperation(op, i + indent, newline));
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

        // Default value
        if (attr.defaultValueLiteral) {
            parts.push(`defaultValueLiteral="${this.escapeXml(attr.defaultValueLiteral)}"`);
        }

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
    private static exportReference(ref: LReference, allClasses: LClass[], indent: string): string {
        const parts: string[] = [
            `xsi:type="ecore:EReference"`,
            `name="${this.escapeXml(ref.name)}"`,
        ];

        // Target type
        const targetType = ref.type;
        if (targetType) {
            parts.push(`eType="#//${this.escapeXml(targetType.name)}"`);
        }

        // Multiplicity
        if (ref.lowerBound !== undefined) {
            parts.push(`lowerBound="${ref.lowerBound}"`);
        }
        if (ref.upperBound !== undefined && ref.upperBound !== 1) {
            parts.push(`upperBound="${ref.upperBound}"`);
        }

        // Containment (composition)
        if (ref.composition || ref.containment) {
            parts.push(`containment="true"`);
        }

        // Opposite reference
        const opposite = ref.opposite;
        if (opposite && targetType) {
            parts.push(`eOpposite="#//${targetType.name}/${opposite.name}"`);
        }

        return `${indent}<eStructuralFeatures ${parts.join(' ')}/>`;
    }

    /**
     * Export EOperation
     */
    private static exportOperation(op: LOperation, indent: string, newline: string): string {
        const parts: string[] = [];

        const opAttrs: string[] = [
            `xsi:type="ecore:EOperation"`,
            `name="${this.escapeXml(op.name)}"`,
        ];

        // Return type
        const returnType = op.type;
        if (returnType) {
            const ecoreType = this.mapToEcoreType(returnType);
            opAttrs.push(`eType="${ecoreType}"`);
        }

        const parameters = op.parameters || [];

        if (parameters.length > 0) {
            parts.push(`${indent}<eOperations ${opAttrs.join(' ')}>`);

            for (const param of parameters) {
                parts.push(this.exportParameter(param, indent + '  '));
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
    private static exportParameter(param: LParameter, indent: string): string {
        const parts: string[] = [
            `xsi:type="ecore:EParameter"`,
            `name="${this.escapeXml(param.name)}"`,
        ];

        const paramType = param.type;
        if (paramType) {
            const ecoreType = this.mapToEcoreType(paramType);
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

        parts.push(`${i}<eSubpackages name="${this.escapeXml(pkg.name)}"${pkg.uri ? ` nsURI="${this.escapeXml(pkg.uri)}"` : ''}${pkg.prefix ? ` nsPrefix="${this.escapeXml(pkg.prefix)}"` : ''}>`);

        // Classes
        for (const cls of pkg.classes || []) {
            parts.push(this.exportClass(cls, pkg.classes || [], i + indent, newline));
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

            console.log('Ecore XML to JSON:', json);

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
