/**
 * Metamodel Converter
 * Converts Jjodel LModel metamodels to JjTL MetamodelElement[] format
 */

import { MetamodelElement } from '../views/MetamodelTreeView';

export interface ConvertMetamodelOptions {
    /**
     * When true, concrete classes also expose features inherited from their
     * superclasses (direct + transitive), flagged via `MetamodelElement.inherited`.
     * Only used by the Transformation Editor. Default: false.
     */
    includeInherited?: boolean;
}

/**
 * Convert a Jjodel metamodel (LModel) to JjTL MetamodelElement array
 *
 * @param metamodel - The Jjodel LModel metamodel
 * @param opts - Optional flags (see ConvertMetamodelOptions)
 * @returns Array of MetamodelElement for use in JjTL views
 */
export function convertMetamodelToJjtl(metamodel: any, opts: ConvertMetamodelOptions = {}): MetamodelElement[] {
    if (!metamodel) {
        return [];
    }

    const elements: MetamodelElement[] = [];

    // Get packages from the metamodel
    const packages = metamodel.packages || [];

    for (const pkg of packages) {
        elements.push(convertPackage(pkg, opts));
    }

    // If no packages, try to get classes directly (some metamodels may not use packages)
    if (elements.length === 0 && metamodel.classes) {
        for (const cls of metamodel.classes) {
            elements.push(convertClass(cls, opts));
        }
    }

    return elements;
}

/**
 * Convert a Jjodel LPackage to MetamodelElement
 */
function convertPackage(pkg: any, opts: ConvertMetamodelOptions = {}): MetamodelElement {
    const children: MetamodelElement[] = [];

    // Convert classes
    const classes = pkg.classes || [];
    for (const cls of classes) {
        children.push(convertClass(cls, opts));
    }

    // Convert enumerators
    const enumerators = pkg.enumerators || [];
    for (const enumType of enumerators) {
        children.push(convertEnumerator(enumType));
    }

    // Convert subpackages recursively
    const subpackages = pkg.subpackages || [];
    for (const subpkg of subpackages) {
        children.push(convertPackage(subpkg, opts));
    }

    return {
        id: pkg.id || `pkg-${pkg.name}`,
        name: pkg.name || 'Unnamed Package',
        type: 'package',
        children: children.length > 0 ? children : undefined,
    };
}

/**
 * Convert a Jjodel LClass to MetamodelElement
 */
function convertClass(cls: any, opts: ConvertMetamodelOptions = {}): MetamodelElement {
    const children: MetamodelElement[] = [];
    const isAbstract = cls.abstract || cls.isAbstract || false;

    // Convert own attributes
    const attributes = cls.attributes || [];
    for (const attr of attributes) {
        children.push(convertAttribute(attr));
    }

    // Convert own references
    const references = cls.references || [];
    for (const ref of references) {
        children.push(convertReference(ref));
    }

    // Convert inherited features (concrete classes only). Uses the LClass proxy's
    // `extendsChain` (direct + transitive supertypes, cycle-safe). Grouped by
    // superclass (alphabetical) so that entries stay predictable under multiple
    // inheritance. Synthetic IDs guarantee DOM uniqueness for MappingLinesOverlay.
    if (opts.includeInherited && !isAbstract) {
        const superChain = cls.extendsChain ?? cls.superclasses ?? [];
        const sortedSupers = [...superChain].sort((a: any, b: any) =>
            (a?.name ?? '').localeCompare(b?.name ?? '')
        );

        for (const superCls of sortedSupers) {
            const fromClassName = superCls?.name ?? 'unknown';
            const ownAttrs = superCls?.ownAttributes ?? [];
            const ownRefs = superCls?.ownReferences ?? [];

            for (const attr of ownAttrs) {
                children.push({
                    ...convertAttribute(attr),
                    id: `${cls.id}__inherited__${attr.id}`,
                    inherited: { fromClassName },
                });
            }
            for (const ref of ownRefs) {
                children.push({
                    ...convertReference(ref),
                    id: `${cls.id}__inherited__${ref.id}`,
                    inherited: { fromClassName },
                });
            }
        }
    }

    return {
        id: cls.id || `cls-${cls.name}`,
        name: cls.name || 'Unnamed Class',
        type: 'class',
        isAbstract,
        children: children.length > 0 ? children : undefined,
    };
}

/**
 * Convert a Jjodel LAttribute to MetamodelElement
 */
function convertAttribute(attr: any): MetamodelElement {
    // Format multiplicity string
    let multiplicity: string | undefined;
    const lower = attr.lowerBound ?? 0;
    const upper = attr.upperBound ?? 1;

    if (lower !== 0 || upper !== 1) {
        if (upper === -1) {
            multiplicity = lower === 0 ? '*' : `${lower}..*`;
        } else if (lower === upper) {
            multiplicity = `${lower}`;
        } else {
            multiplicity = `${lower}..${upper}`;
        }
    }

    // Get type name
    let dataType: string | undefined;
    if (attr.type) {
        if (typeof attr.type === 'string') {
            dataType = attr.type;
        } else if (attr.type.name) {
            dataType = attr.type.name;
        }
    }

    return {
        id: attr.id || `attr-${attr.name}`,
        name: attr.name || 'unnamed',
        type: 'attribute',
        dataType,
        multiplicity,
    };
}

/**
 * Convert a Jjodel LReference to MetamodelElement
 */
function convertReference(ref: any): MetamodelElement {
    // Format multiplicity string
    let multiplicity: string | undefined;
    const lower = ref.lowerBound ?? 0;
    const upper = ref.upperBound ?? 1;

    if (lower !== 0 || upper !== 1) {
        if (upper === -1) {
            multiplicity = lower === 0 ? '*' : `${lower}..*`;
        } else if (lower === upper) {
            multiplicity = `${lower}`;
        } else {
            multiplicity = `${lower}..${upper}`;
        }
    }

    // Get target type name
    let dataType: string | undefined;
    if (ref.type) {
        if (typeof ref.type === 'string') {
            dataType = ref.type;
        } else if (ref.type.name) {
            dataType = ref.type.name;
        }
    }

    return {
        id: ref.id || `ref-${ref.name}`,
        name: ref.name || 'unnamed',
        type: 'reference',
        dataType,
        multiplicity,
    };
}

/**
 * Convert a Jjodel LEnumerator to MetamodelElement
 */
function convertEnumerator(enumType: any): MetamodelElement {
    const children: MetamodelElement[] = [];

    // Convert enum literals
    const literals = enumType.literals || [];
    for (const lit of literals) {
        children.push({
            id: lit.id || `lit-${lit.name}`,
            name: lit.name || 'unnamed',
            type: 'literal',
        });
    }

    return {
        id: enumType.id || `enum-${enumType.name}`,
        name: enumType.name || 'Unnamed Enum',
        type: 'enumeration',
        children: children.length > 0 ? children : undefined,
    };
}

/**
 * Find a metamodel by ID from a list of metamodels
 */
export function findMetamodelById(metamodels: any[], id: string | undefined): any | undefined {
    if (!id || !metamodels) return undefined;
    return metamodels.find(mm => mm.id === id);
}
