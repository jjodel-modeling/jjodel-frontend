/**
 * Jjodie Context Service
 * Extracts and formats project context for AI-assisted metamodeling
 *
 * Features:
 * - Extract project context for AI prompts
 * - Generate documentation with section markers
 * - Parse and merge sections for intelligent regeneration
 */

import type { LProject, LClass, LAttribute, LReference, LPackage, LEnumerator, LModel } from '../joiner';
import { DocumentationSection } from '../types/jodie';

// ============================================
// EXPORTED TYPES
// ============================================

export interface DocumentationData {
    content: string;
    sections: DocumentationSection[];
}

/**
 * Identifies the artefact currently focused in the editor — used to scope the
 * context string to the metamodel relevant to the user's current work.
 *
 * - level 'M2': the artefact IS the metamodel; `id` is its DModel id.
 * - level 'M1': the artefact is a model instance; `id` is the model's DModel id,
 *   and `metamodelId` is the conformity metamodel's id.
 */
export interface ActiveArtifact {
    id: string;
    name: string;
    level: 'M1' | 'M2';
    /** Metamodel of conformity — required when level === 'M1'. */
    metamodelId?: string;
}

interface ParsedSections {
    auto: Array<{ id: string; content: string; lastModified?: number }>;
    user: Array<{ id: string; content: string; lastModified?: number }>;
}

// ============================================
// INTERNAL TYPES
// ============================================

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
     * Resolve the metamodel scope from an active artefact.
     * Returns the LModel of the metamodel to walk, or null if no scoping applies
     * (caller should fall back to the global project collections).
     */
    private static resolveMetamodelScope(
        project: LProject,
        activeArtifact?: ActiveArtifact
    ): LModel | null {
        if (!activeArtifact) return null;
        const metamodels: LModel[] = (project as any).metamodels || [];

        if (activeArtifact.level === 'M2') {
            return metamodels.find((mm) => mm.id === activeArtifact.id) ?? null;
        }

        // level === 'M1': prefer the supplied metamodelId, otherwise resolve via the model's instanceof
        if (activeArtifact.metamodelId) {
            const found = metamodels.find((mm) => mm.id === activeArtifact.metamodelId);
            if (found) return found;
        }
        const models: LModel[] = (project as any).models || [];
        const m1 = models.find((m) => m.id === activeArtifact.id);
        if (m1) {
            const inst = (m1 as any).instanceof ?? (m1 as any).metamodel;
            const mmId = typeof inst === 'string' ? inst : inst?.id;
            if (mmId) {
                const found = metamodels.find((mm) => mm.id === mmId);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Extract context from LProject. When `activeArtifact` is supplied, the
     * extraction is scoped to the metamodel relevant to the active artefact;
     * otherwise it walks the global project collections (backward-compatible).
     */
    static extractFromProject(project: LProject, activeArtifact?: ActiveArtifact): ProjectContext {
        const metaclasses: MetaclassInfo[] = [];
        const enumerations: EnumInfo[] = [];
        const packages: string[] = [];

        const scope = this.resolveMetamodelScope(project, activeArtifact);

        // Use the metamodel scope when available; fall back to the global project view.
        const classSource: any = scope
            ? ((scope as any).classes ?? [])
            : (project.classes ?? []);
        const enumSource: any = scope
            ? ((scope as any).enumerations ?? (scope as any).enumerators ?? [])
            : (project.enumerators ?? []);
        const packageSource: any = scope
            ? ((scope as any).packages ?? [])
            : (project.packages ?? []);

        try {
            // Extract packages
            if (packageSource) {
                packageSource.forEach((pkg: LPackage) => {
                    if (pkg?.name) {
                        packages.push(pkg.name);
                    }
                });
            }

            // Extract classes
            if (classSource) {
                classSource.forEach((cls: LClass) => {
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
            if (enumSource) {
                enumSource.forEach((enumItem: LEnumerator) => {
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
    static buildContextString(context: ProjectContext, activeArtifact?: ActiveArtifact): string {
        const lines: string[] = [];

        // Active artefact header — tells the LLM what the user is currently looking at.
        if (activeArtifact) {
            const levelLabel = activeArtifact.level === 'M1' ? 'M1 model' : 'M2 metamodel';
            lines.push(`**Currently editing**: ${activeArtifact.name} (${levelLabel})`);
            lines.push('');
        }

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
     * Get full context string from project. When `activeArtifact` is supplied,
     * the context is scoped to the metamodel relevant to the user's current
     * editor tab and prepended with a "Currently editing" header.
     */
    static getContextString(project: LProject, activeArtifact?: ActiveArtifact): string {
        const context = this.extractFromProject(project, activeArtifact);
        return this.buildContextString(context, activeArtifact);
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

    /**
     * Generate full Markdown documentation for the metamodel
     */
    static generateDocumentation(project: LProject): string {
        const context = this.extractFromProject(project);
        const lines: string[] = [];
        const now = new Date().toISOString().split('T')[0];

        // Document header
        lines.push(`# ${context.projectName}`);
        lines.push('');
        lines.push('## Metamodel Documentation');
        lines.push('');
        lines.push(`> Generated on ${now}`);
        lines.push('');

        // Overview section
        lines.push('---');
        lines.push('');
        lines.push('## Overview');
        lines.push('');
        lines.push('| Metric | Count |');
        lines.push('|--------|-------|');
        lines.push(`| Classes | ${context.metaclasses.length} |`);
        lines.push(`| Enumerations | ${context.enumerations.length} |`);
        lines.push(`| Packages | ${context.packages.length} |`);

        const totalAttributes = context.metaclasses.reduce((sum, mc) => sum + mc.attributes.length, 0);
        const totalReferences = context.metaclasses.reduce((sum, mc) => sum + mc.references.length, 0);
        lines.push(`| Total Attributes | ${totalAttributes} |`);
        lines.push(`| Total References | ${totalReferences} |`);
        lines.push('');

        // Packages section
        if (context.packages.length > 0) {
            lines.push('---');
            lines.push('');
            lines.push('## Packages');
            lines.push('');
            context.packages.forEach(pkg => {
                lines.push(`- \`${pkg}\``);
            });
            lines.push('');
        }

        // Classes section
        if (context.metaclasses.length > 0) {
            lines.push('---');
            lines.push('');
            lines.push('## Classes');
            lines.push('');

            context.metaclasses.forEach(mc => {
                // Class header
                const badges: string[] = [];
                if (mc.isAbstract) badges.push('`abstract`');
                const badgeStr = badges.length > 0 ? ' ' + badges.join(' ') : '';

                lines.push(`### ${mc.name}${badgeStr}`);
                lines.push('');

                // Inheritance
                if (mc.extends && mc.extends.length > 0) {
                    lines.push(`**Extends:** ${mc.extends.map(e => `\`${e}\``).join(', ')}`);
                    lines.push('');
                }

                // Attributes table
                if (mc.attributes.length > 0) {
                    lines.push('#### Attributes');
                    lines.push('');
                    lines.push('| Name | Type | Multiplicity |');
                    lines.push('|------|------|--------------|');
                    mc.attributes.forEach(attr => {
                        const mult = attr.multiplicity || '1';
                        lines.push(`| \`${attr.name}\` | ${attr.type} | ${mult} |`);
                    });
                    lines.push('');
                }

                // References table
                if (mc.references.length > 0) {
                    lines.push('#### References');
                    lines.push('');
                    lines.push('| Name | Target | Type | Multiplicity |');
                    lines.push('|------|--------|------|--------------|');
                    mc.references.forEach(ref => {
                        const mult = ref.multiplicity || '1';
                        const typeIcon = ref.type === 'composition' ? '◆ composition' :
                                        ref.type === 'inheritance' ? '△ inheritance' : '→ association';
                        lines.push(`| \`${ref.name}\` | \`${ref.target}\` | ${typeIcon} | ${mult} |`);
                    });
                    lines.push('');
                }

                // Empty class note
                if (mc.attributes.length === 0 && mc.references.length === 0) {
                    lines.push('*No attributes or references defined.*');
                    lines.push('');
                }

                lines.push('');
            });
        } else {
            lines.push('---');
            lines.push('');
            lines.push('## Classes');
            lines.push('');
            lines.push('*No classes defined yet.*');
            lines.push('');
        }

        // Enumerations section
        if (context.enumerations.length > 0) {
            lines.push('---');
            lines.push('');
            lines.push('## Enumerations');
            lines.push('');

            context.enumerations.forEach(en => {
                lines.push(`### ${en.name}`);
                lines.push('');
                if (en.literals.length > 0) {
                    lines.push('**Literals:**');
                    en.literals.forEach(lit => {
                        lines.push(`- \`${lit}\``);
                    });
                } else {
                    lines.push('*No literals defined.*');
                }
                lines.push('');
            });
        }

        // Footer
        lines.push('---');
        lines.push('');
        lines.push('*Documentation generated by Jjodie*');

        return lines.join('\n');
    }

    /**
     * Get documentation as downloadable content
     */
    static getDocumentationDownload(project: LProject): { content: string; filename: string } {
        const content = this.generateDocumentation(project);
        const filename = `${project.name || 'metamodel'}-documentation.md`;
        return { content, filename };
    }

    // ============================================
    // SECTION-BASED DOCUMENTATION
    // ============================================

    /**
     * Generate a hash of the project state for change detection
     */
    static getProjectHash(project: LProject): string {
        try {
            const context = this.extractFromProject(project);
            // Create a deterministic string from project state
            const stateString = JSON.stringify({
                name: context.projectName,
                classes: context.metaclasses.map(mc => ({
                    name: mc.name,
                    abstract: mc.isAbstract,
                    attrs: mc.attributes.map(a => `${a.name}:${a.type}`).sort(),
                    refs: mc.references.map(r => `${r.name}:${r.target}`).sort(),
                    extends: mc.extends?.sort() || [],
                })).sort((a, b) => a.name.localeCompare(b.name)),
                enums: context.enumerations.map(e => ({
                    name: e.name,
                    literals: e.literals.sort(),
                })).sort((a, b) => a.name.localeCompare(b.name)),
                packages: context.packages.sort(),
            });
            // Simple hash function
            let hash = 0;
            for (let i = 0; i < stateString.length; i++) {
                const char = stateString.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash.toString(16);
        } catch {
            return Date.now().toString(16);
        }
    }

    /**
     * Parse sections from markdown content
     */
    static parseSections(markdown: string): ParsedSections {
        const result: ParsedSections = { auto: [], user: [] };
        const regex = /<!-- JJODIE:(AUTO|USER):START:(\S+) -->\n?([\s\S]*?)<!-- JJODIE:\1:END:\2 -->/g;
        let match;

        while ((match = regex.exec(markdown)) !== null) {
            const type = match[1] as 'AUTO' | 'USER';
            const section = {
                id: match[2],
                content: match[3].trim(),
            };

            if (type === 'AUTO') {
                result.auto.push(section);
            } else {
                result.user.push(section);
            }
        }

        return result;
    }

    /**
     * Wrap content in section markers
     */
    private static wrapSection(id: string, type: 'AUTO' | 'USER', content: string): string {
        return `<!-- JJODIE:${type}:START:${id} -->\n${content}\n<!-- JJODIE:${type}:END:${id} -->`;
    }

    /**
     * Generate documentation with section markers
     */
    static generateDocumentationWithSections(project: LProject): DocumentationData {
        const context = this.extractFromProject(project);
        const lines: string[] = [];
        const sections: DocumentationSection[] = [];
        const now = new Date().toISOString().split('T')[0];

        // Document header (AUTO section)
        const headerContent = [
            `# ${context.projectName}`,
            '',
            '## Metamodel Documentation',
            '',
            `> Generated on ${now}`,
        ].join('\n');
        lines.push(this.wrapSection('header', 'AUTO', headerContent));
        sections.push({ id: 'header', type: 'AUTO', content: headerContent });
        lines.push('');

        // Overview section (AUTO)
        const overviewLines = [
            '---',
            '',
            '## Overview',
            '',
            '| Metric | Count |',
            '|--------|-------|',
            `| Classes | ${context.metaclasses.length} |`,
            `| Enumerations | ${context.enumerations.length} |`,
            `| Packages | ${context.packages.length} |`,
        ];
        const totalAttributes = context.metaclasses.reduce((sum, mc) => sum + mc.attributes.length, 0);
        const totalReferences = context.metaclasses.reduce((sum, mc) => sum + mc.references.length, 0);
        overviewLines.push(`| Total Attributes | ${totalAttributes} |`);
        overviewLines.push(`| Total References | ${totalReferences} |`);
        const overviewContent = overviewLines.join('\n');
        lines.push(this.wrapSection('overview', 'AUTO', overviewContent));
        sections.push({ id: 'overview', type: 'AUTO', content: overviewContent });
        lines.push('');

        // Packages section (AUTO)
        if (context.packages.length > 0) {
            const packagesLines = [
                '---',
                '',
                '## Packages',
                '',
                ...context.packages.map(pkg => `- \`${pkg}\``),
            ];
            const packagesContent = packagesLines.join('\n');
            lines.push(this.wrapSection('packages', 'AUTO', packagesContent));
            sections.push({ id: 'packages', type: 'AUTO', content: packagesContent });
            lines.push('');
        }

        // Classes section (AUTO)
        const classesLines: string[] = ['---', '', '## Classes', ''];
        if (context.metaclasses.length > 0) {
            context.metaclasses.forEach(mc => {
                const badges: string[] = [];
                if (mc.isAbstract) badges.push('`abstract`');
                const badgeStr = badges.length > 0 ? ' ' + badges.join(' ') : '';

                classesLines.push(`### ${mc.name}${badgeStr}`);
                classesLines.push('');

                if (mc.extends && mc.extends.length > 0) {
                    classesLines.push(`**Extends:** ${mc.extends.map(e => `\`${e}\``).join(', ')}`);
                    classesLines.push('');
                }

                if (mc.attributes.length > 0) {
                    classesLines.push('#### Attributes');
                    classesLines.push('');
                    classesLines.push('| Name | Type | Multiplicity |');
                    classesLines.push('|------|------|--------------|');
                    mc.attributes.forEach(attr => {
                        const mult = attr.multiplicity || '1';
                        classesLines.push(`| \`${attr.name}\` | ${attr.type} | ${mult} |`);
                    });
                    classesLines.push('');
                }

                if (mc.references.length > 0) {
                    classesLines.push('#### References');
                    classesLines.push('');
                    classesLines.push('| Name | Target | Type | Multiplicity |');
                    classesLines.push('|------|--------|------|--------------|');
                    mc.references.forEach(ref => {
                        const mult = ref.multiplicity || '1';
                        const typeIcon = ref.type === 'composition' ? '◆ composition' :
                                        ref.type === 'inheritance' ? '△ inheritance' : '→ association';
                        classesLines.push(`| \`${ref.name}\` | \`${ref.target}\` | ${typeIcon} | ${mult} |`);
                    });
                    classesLines.push('');
                }

                if (mc.attributes.length === 0 && mc.references.length === 0) {
                    classesLines.push('*No attributes or references defined.*');
                    classesLines.push('');
                }

                classesLines.push('');
            });
        } else {
            classesLines.push('*No classes defined yet.*');
            classesLines.push('');
        }
        const classesContent = classesLines.join('\n');
        lines.push(this.wrapSection('classes', 'AUTO', classesContent));
        sections.push({ id: 'classes', type: 'AUTO', content: classesContent });
        lines.push('');

        // Enumerations section (AUTO)
        if (context.enumerations.length > 0) {
            const enumsLines: string[] = ['---', '', '## Enumerations', ''];
            context.enumerations.forEach(en => {
                enumsLines.push(`### ${en.name}`);
                enumsLines.push('');
                if (en.literals.length > 0) {
                    enumsLines.push('**Literals:**');
                    en.literals.forEach(lit => {
                        enumsLines.push(`- \`${lit}\``);
                    });
                } else {
                    enumsLines.push('*No literals defined.*');
                }
                enumsLines.push('');
            });
            const enumsContent = enumsLines.join('\n');
            lines.push(this.wrapSection('enumerations', 'AUTO', enumsContent));
            sections.push({ id: 'enumerations', type: 'AUTO', content: enumsContent });
            lines.push('');
        }

        // Examples section (USER - preserved)
        const examplesContent = '---\n\n## Examples\n\n*Add your usage examples here...*';
        lines.push(this.wrapSection('examples', 'USER', examplesContent));
        sections.push({ id: 'examples', type: 'USER', content: examplesContent });
        lines.push('');

        // Notes section (USER - preserved)
        const notesContent = '---\n\n## Notes\n\n*Add your personal notes here...*';
        lines.push(this.wrapSection('notes', 'USER', notesContent));
        sections.push({ id: 'notes', type: 'USER', content: notesContent });
        lines.push('');

        // Footer (AUTO)
        const footerContent = [
            '---',
            '',
            '*Documentation generated by Jjodie*',
            `*Last regenerated: ${now}*`,
        ].join('\n');
        lines.push(this.wrapSection('footer', 'AUTO', footerContent));
        sections.push({ id: 'footer', type: 'AUTO', content: footerContent });

        return {
            content: lines.join('\n'),
            sections,
        };
    }

    /**
     * Regenerate documentation while preserving USER sections
     */
    static regenerateDocumentation(project: LProject, existingContent: string): DocumentationData {
        // Parse existing sections
        const existingSections = this.parseSections(existingContent);

        // Generate fresh documentation
        const freshDoc = this.generateDocumentationWithSections(project);

        // If there are no user sections to preserve, just return fresh doc
        if (existingSections.user.length === 0) {
            return freshDoc;
        }

        // Replace USER sections in fresh doc with existing USER sections
        let mergedContent = freshDoc.content;
        const mergedSections = [...freshDoc.sections];

        existingSections.user.forEach(userSection => {
            // Find and replace the USER section in fresh content
            const userMarkerRegex = new RegExp(
                `<!-- JJODIE:USER:START:${userSection.id} -->\\n?[\\s\\S]*?<!-- JJODIE:USER:END:${userSection.id} -->`,
                'g'
            );

            const replacement = this.wrapSection(userSection.id, 'USER', userSection.content);
            mergedContent = mergedContent.replace(userMarkerRegex, replacement);

            // Update section in array
            const sectionIndex = mergedSections.findIndex(s => s.id === userSection.id);
            if (sectionIndex !== -1) {
                mergedSections[sectionIndex] = {
                    id: userSection.id,
                    type: 'USER',
                    content: userSection.content,
                    lastModified: Date.now(),
                };
            }
        });

        return {
            content: mergedContent,
            sections: mergedSections,
        };
    }
}

export default JjodieContextService;
