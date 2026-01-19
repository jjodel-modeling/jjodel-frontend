/**
 * Jjodie Context Service
 * Extracts and formats project context for AI-assisted metamodeling
 */

import type { LProject, LClass, LAttribute, LReference, LPackage, LEnumerator } from '../joiner';

interface MetaclassInfo {
    id: string;
    name: string;
    isAbstract: boolean;
    attributes: Array<{
        name: string;
        type: string;
        multiplicity?: string;
    }>;
    references: Array<{
        name: string;
        target: string;
        type: 'association' | 'composition' | 'inheritance';
        multiplicity?: string;
    }>;
    extends?: string[];
}

interface EnumInfo {
    name: string;
    literals: string[];
}

interface ProjectContext {
    projectId: string;
    projectName: string;
    metaclasses: MetaclassInfo[];
    enumerations: EnumInfo[];
    packages: string[];
}

export class JjodieContextService {
    /**
     * Extract context from LProject
     */
    static extractFromProject(project: LProject): ProjectContext {
        const metaclasses: MetaclassInfo[] = [];
        const enumerations: EnumInfo[] = [];
        const packages: string[] = [];

        try {
            // Extract packages
            if (project.packages) {
                project.packages.forEach((pkg: LPackage) => {
                    if (pkg?.name) {
                        packages.push(pkg.name);
                    }
                });
            }

            // Extract classes
            if (project.classes) {
                project.classes.forEach((cls: LClass) => {
                    try {
                        const classInfo: MetaclassInfo = {
                            id: cls.id || '',
                            name: cls.name || 'Unnamed',
                            isAbstract: cls.abstract || false,
                            attributes: [],
                            references: [],
                            extends: [],
                        };

                        // Extract attributes
                        if (cls.attributes) {
                            cls.attributes.forEach((attr: LAttribute) => {
                                if (attr?.name) {
                                    classInfo.attributes.push({
                                        name: attr.name,
                                        type: this.getTypeName(attr),
                                        multiplicity: this.getMultiplicity(attr),
                                    });
                                }
                            });
                        }

                        // Extract references
                        if (cls.references) {
                            cls.references.forEach((ref: LReference) => {
                                if (ref?.name) {
                                    classInfo.references.push({
                                        name: ref.name,
                                        target: this.getTargetName(ref),
                                        type: this.getReferenceType(ref),
                                        multiplicity: this.getMultiplicity(ref),
                                    });
                                }
                            });
                        }

                        // Extract extends
                        if (cls.extends && cls.extends.length > 0) {
                            cls.extends.forEach((superClass: LClass) => {
                                if (superClass?.name) {
                                    classInfo.extends?.push(superClass.name);
                                }
                            });
                        }

                        metaclasses.push(classInfo);
                    } catch (err) {
                        console.warn('Error extracting class info:', err);
                    }
                });
            }

            // Extract enumerations
            if (project.enumerators) {
                project.enumerators.forEach((enumItem: LEnumerator) => {
                    try {
                        if (enumItem?.name) {
                            const literals: string[] = [];
                            if (enumItem.literals) {
                                enumItem.literals.forEach((lit: any) => {
                                    if (lit?.name) {
                                        literals.push(lit.name);
                                    }
                                });
                            }
                            enumerations.push({
                                name: enumItem.name,
                                literals,
                            });
                        }
                    } catch (err) {
                        console.warn('Error extracting enum info:', err);
                    }
                });
            }
        } catch (err) {
            console.error('Error extracting project context:', err);
        }

        return {
            projectId: project.id || '',
            projectName: project.name || 'Unnamed Project',
            metaclasses,
            enumerations,
            packages,
        };
    }

    /**
     * Build context string for AI prompt
     */
    static buildContextString(context: ProjectContext): string {
        const lines: string[] = [];

        // Project info
        lines.push(`**Project**: ${context.projectName}`);
        lines.push(`**Metamodel Size**: ${context.metaclasses.length} metaclasses`);
        lines.push('');

        // Existing metaclasses
        if (context.metaclasses.length > 0) {
            lines.push('**Existing Metaclasses**:');

            context.metaclasses.forEach(mc => {
                const abstractFlag = mc.isAbstract ? ' (abstract)' : '';
                const extendsInfo = mc.extends && mc.extends.length > 0
                    ? ` extends ${mc.extends.join(', ')}`
                    : '';
                lines.push(`- **${mc.name}**${abstractFlag}${extendsInfo}`);

                // Attributes
                if (mc.attributes.length > 0) {
                    mc.attributes.forEach(attr => {
                        const mult = attr.multiplicity ? ` [${attr.multiplicity}]` : '';
                        lines.push(`  - ${attr.name}: ${attr.type}${mult}`);
                    });
                }

                // References
                if (mc.references.length > 0) {
                    mc.references.forEach(ref => {
                        const mult = ref.multiplicity ? ` [${ref.multiplicity}]` : '';
                        const arrow = ref.type === 'composition' ? '◆→' :
                            ref.type === 'inheritance' ? '△→' : '→';
                        lines.push(`  ${arrow} ${ref.name}: ${ref.target}${mult}`);
                    });
                }

                lines.push('');
            });
        } else {
            lines.push('**No metaclasses yet** - the metamodel is empty.');
            lines.push('');
        }

        // Enumerations
        if (context.enumerations.length > 0) {
            lines.push('**Enumerations**:');
            context.enumerations.forEach(en => {
                lines.push(`- ${en.name}: ${en.literals.join(' | ')}`);
            });
            lines.push('');
        }

        // Packages
        if (context.packages.length > 0) {
            lines.push(`**Packages**: ${context.packages.join(', ')}`);
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Get full context string from project
     */
    static getContextString(project: LProject): string {
        const context = this.extractFromProject(project);
        return this.buildContextString(context);
    }

    /**
     * Helper: Get type name from attribute
     */
    private static getTypeName(attr: any): string {
        try {
            if (attr.type?.name) return attr.type.name;
            if (typeof attr.type === 'string') return attr.type;
            if (attr.primitiveType) return attr.primitiveType;
            return 'String';
        } catch {
            return 'String';
        }
    }

    /**
     * Helper: Get target name from reference
     */
    private static getTargetName(ref: any): string {
        try {
            if (ref.type?.name) return ref.type.name;
            if (ref.target?.name) return ref.target.name;
            if (typeof ref.type === 'string') return ref.type;
            return 'Unknown';
        } catch {
            return 'Unknown';
        }
    }

    /**
     * Helper: Get reference type (association, composition, inheritance)
     */
    private static getReferenceType(ref: any): 'association' | 'composition' | 'inheritance' {
        try {
            if (ref.containment === true) return 'composition';
            if (ref.aggregation === 'composite') return 'composition';
            return 'association';
        } catch {
            return 'association';
        }
    }

    /**
     * Helper: Get multiplicity string
     */
    private static getMultiplicity(feature: any): string | undefined {
        try {
            const lower = feature.lowerBound ?? feature.lower ?? 0;
            const upper = feature.upperBound ?? feature.upper ?? 1;

            if (lower === 0 && upper === 1) return '0..1';
            if (lower === 1 && upper === 1) return '1';
            if (lower === 0 && upper === -1) return '0..*';
            if (lower === 1 && upper === -1) return '1..*';
            if (upper === -1) return `${lower}..*`;
            if (lower === upper) return `${lower}`;
            return `${lower}..${upper}`;
        } catch {
            return undefined;
        }
    }
}

export default JjodieContextService;
