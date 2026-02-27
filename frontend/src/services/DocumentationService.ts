/**
 * Documentation Service
 * Centralized service for generating metamodel documentation
 * Supports both Local (instant) and Jjodie (AI-powered) generation
 *
 * This service consolidates documentation generation logic that was
 * previously duplicated between DocumentationSection.tsx and DocumentationTab.tsx
 */

import type { Dictionary } from '../joiner';
import { LProject } from '../joiner';
import AIProviderService from './AIProviderService';
import { JjodieContextService } from './JjodieContext';
import {AI, JodieConfig} from "../types/jodie";

// ============================================
// TYPES
// ============================================

export interface ProjectDocumentation {
    content: string;
    generatedAt: number;
    projectHash: string;
    confidence: number;
    generatedWith: 'local' | 'jjodie';
    lastManualEdit?: number;
    sections?: any[];
}

export interface GenerationResult {
    content: string;
    confidence: number;
    generatedWith: 'local' | 'jjodie';
}

interface ProjectLexicalData {
    project: {
        name: string;
        description?: string;
    };
    metamodels: Array<{
        name: string;
        classes: Array<{
            name: string;
            isAbstract: boolean;
            attributes: Array<{
                name: string;
                type: string;
                multiplicity?: string;
            }>;
            references: Array<{
                name: string;
                targetClass: string;
                type: 'association' | 'composition' | 'aggregation';
                multiplicity?: string;
            }>;
            superClass?: string;
        }>;
        enumerations: Array<{
            name: string;
            literals: string[];
        }>;
    }>;
}

interface JjodieResponse {
    domain: string;
    domainConfidence: number;
    projectDescription: string;
    metamodels: Array<{
        name: string;
        description: string;
        classes: Array<{
            name: string;
            description: string;
            attributeDescriptions: Record<string, string>;
            referenceDescriptions: Record<string, string>;
        }>;
    }>;
}

// ============================================
// DOMAIN INFERENCE (for Local generation)
// ============================================

const DOMAIN_KEYWORDS: Record<string, { keywords: string[], description: string }> = {
    'Transportation': {
        keywords: ['vehicle', 'car', 'truck', 'bus', 'train', 'plane', 'ship', 'motorcycle', 'bicycle', 'transport', 'route', 'driver'],
        description: 'This metamodel defines concepts related to transportation systems, vehicles, and mobility.'
    },
    'E-commerce': {
        keywords: ['product', 'order', 'cart', 'customer', 'payment', 'price', 'shop', 'catalog', 'inventory', 'shipping'],
        description: 'This metamodel represents an e-commerce domain with products, orders, and customer management.'
    },
    'Healthcare': {
        keywords: ['patient', 'doctor', 'hospital', 'diagnosis', 'treatment', 'medication', 'appointment', 'medical', 'nurse', 'prescription'],
        description: 'This metamodel covers healthcare concepts including patients, medical staff, and treatments.'
    },
    'Finance': {
        keywords: ['account', 'transaction', 'bank', 'payment', 'invoice', 'balance', 'credit', 'loan', 'currency', 'interest'],
        description: 'This metamodel represents financial concepts including accounts, transactions, and banking.'
    },
    'Education': {
        keywords: ['student', 'teacher', 'course', 'class', 'grade', 'school', 'university', 'exam', 'enrollment', 'lecture'],
        description: 'This metamodel defines educational concepts including students, courses, and academic structures.'
    },
    'Human Resources': {
        keywords: ['employee', 'department', 'salary', 'manager', 'job', 'position', 'contract', 'hire', 'team', 'organization'],
        description: 'This metamodel covers HR concepts including employees, departments, and organizational structure.'
    },
    'Software Development': {
        keywords: ['class', 'method', 'interface', 'module', 'component', 'package', 'function', 'api', 'service', 'repository'],
        description: 'This metamodel represents software architecture and development concepts.'
    },
    'Family/Genealogy': {
        keywords: ['family', 'person', 'parent', 'child', 'spouse', 'member', 'relative', 'ancestor', 'descendant', 'household'],
        description: 'This metamodel represents family structures, genealogical relationships, and household compositions.'
    }
};

function inferDomain(classNames: string[]): { name: string; confidence: number; description: string } {
    const normalized = classNames.map(n => n.toLowerCase());
    let best = { name: 'General', confidence: 0, description: 'A general-purpose metamodel.' };

    for (const [domain, data] of Object.entries(DOMAIN_KEYWORDS)) {
        const matchedKeywords = data.keywords.filter(kw =>
            normalized.some(n => n.includes(kw) || kw.includes(n))
        );
        const conf = Math.round((matchedKeywords.length / Math.min(data.keywords.length, 5)) * 100);
        if (conf > best.confidence) {
            best = { name: domain, confidence: Math.min(conf, 100), description: data.description };
        }
    }
    return best;
}

// ============================================
// DOCUMENTATION SERVICE
// ============================================

export class DocumentationService {

    // ========================================
    // PUBLIC API
    // ========================================

    /**
     * Generate documentation (auto-selects Local or Jjodie based on parameter)
     */
    static async generate(project: LProject, useJjodie: boolean): Promise<GenerationResult> {
        if (useJjodie && JodieConfig.getEnabledProviders().length > 0) {
            return await this.generateWithJjodie(project);
        } else {
            return this.generateLocal(project);
        }
    }

    /**
     * Load documentation from localStorage
     */
    static load(projectId: string): ProjectDocumentation | null {
        try {
            const stored = localStorage.getItem(`${AI.DOCUMENTATION_STORAGE_PREFIX}${projectId}`);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    /**
     * Save documentation to localStorage
     */
    static save(projectId: string, doc: ProjectDocumentation): void {
        localStorage.setItem(`${AI.DOCUMENTATION_STORAGE_PREFIX}${projectId}`, JSON.stringify(doc));
    }

    /**
     * Delete documentation from localStorage
     */
    static delete(projectId: string): void {
        localStorage.removeItem(`${AI.DOCUMENTATION_STORAGE_PREFIX}${projectId}`);
    }

    /**
     * Calculate project hash for change detection
     */
    static calculateHash(project: LProject): string {
        return JjodieContextService.getProjectHash(project);
    }

    /**
     * Check if project has critical mass for documentation
     * Requires at least 1 class
     */
    static hasCriticalMass(project: LProject): boolean {
        // Use project.classes which aggregates classes from all packages across all metamodels
        const classes = (project as any).classes || [];
        return classes.length >= 1;
    }

    // ========================================
    // LOCAL GENERATION
    // ========================================

    /**
     * Generate documentation locally (instant, no AI)
     */
    static generateLocal(project: LProject): GenerationResult {
        const metamodels = (project as any).metamodels || [];
        const allClasses = metamodels.flatMap((mm: any) => mm.classes || []);
        const allEnums = metamodels.flatMap((mm: any) => mm.enumerations || []);
        const domain = inferDomain(allClasses.map((c: any) => c.name || ''));

        const stats = {
            classes: allClasses.length,
            attributes: allClasses.reduce((sum: number, c: any) => sum + (c.attributes?.length || 0), 0),
            references: allClasses.reduce((sum: number, c: any) => sum + (c.references?.length || 0), 0),
            enumerations: allEnums.length
        };

        let md = `# ${project.name || 'Project'} Documentation\n\n`;

        // Overview section
        md += `## Overview\n\n`;
        md += `> **Domain**: ${domain.name} | **Generated**: Local\n\n`;
        md += `${domain.description}\n\n`;

        // Statistics table
        md += `### Statistics\n\n`;
        md += `| Metric | Count |\n|--------|-------|\n`;
        md += `| Classes | ${stats.classes} |\n`;
        md += `| Attributes | ${stats.attributes} |\n`;
        md += `| References | ${stats.references} |\n`;
        md += `| Enumerations | ${stats.enumerations} |\n\n`;

        // Metamodels with classes
        metamodels.forEach((mm: any) => {
            md += `---\n\n`;
            md += `## Metamodel: ${mm.name || 'Unnamed'}\n\n`;

            const mmClasses = mm.classes || [];
            const mmEnums = mm.enumerations || [];

            if (mmClasses.length === 0) {
                md += `*No classes defined.*\n\n`;
            } else {
                mmClasses.forEach((cls: any) => {
                    const icon = cls.abstract ? '◇' : '■';
                    md += `### ${icon} ${cls.name || 'Unnamed'}${cls.abstract ? ' *(abstract)*' : ''}\n\n`;

                    // Class description (template-based)
                    md += `${this.generateClassDescriptionLocal(cls.name || 'Unnamed', cls, domain.name)}\n\n`;

                    // Inheritance
                    if (cls.extends) {
                        const superName = typeof cls.extends === 'string' ? cls.extends : cls.extends.name;
                        md += `**Extends:** \`${superName}\`\n\n`;
                    }

                    // Attributes table
                    const attrs = cls.attributes || [];
                    if (attrs.length > 0) {
                        md += `**Attributes:**\n\n`;
                        md += `| Name | Type | Multiplicity |\n|------|------|-------------|\n`;
                        attrs.forEach((a: any) => {
                            const type = typeof a.type === 'string' ? a.type : (a.type?.name || 'any');
                            const mult = a.lowerBound !== undefined
                                ? `${a.lowerBound}..${a.upperBound === -1 ? '*' : a.upperBound}`
                                : '1';
                            md += `| \`${a.name}\` | ${type} | ${mult} |\n`;
                        });
                        md += `\n`;
                    }

                    // References table
                    const refs = cls.references || [];
                    if (refs.length > 0) {
                        md += `**References:**\n\n`;
                        md += `| Name | Target | Type | Multiplicity |\n|------|--------|------|-------------|\n`;
                        refs.forEach((r: any) => {
                            const target = typeof r.type === 'string' ? r.type : (r.type?.name || r.target || '?');
                            const relType = r.containment ? '◆ composition' : '→ association';
                            const mult = r.lowerBound !== undefined
                                ? `${r.lowerBound}..${r.upperBound === -1 ? '*' : r.upperBound}`
                                : '0..*';
                            md += `| \`${r.name}\` | \`${target}\` | ${relType} | ${mult} |\n`;
                        });
                        md += `\n`;
                    }

                    if (attrs.length === 0 && refs.length === 0) {
                        md += `*No attributes or references defined.*\n\n`;
                    }
                });
            }

            // Enumerations for this metamodel
            if (mmEnums.length > 0) {
                md += `### Enumerations\n\n`;
                mmEnums.forEach((en: any) => {
                    const literals = (en.literals || []).map((l: any) => `\`${l.name || l}\``).join(', ');
                    md += `- **${en.name}**: ${literals}\n`;
                });
                md += `\n`;
            }
        });

        // Notes section with protected markers
        md += `---\n\n`;
        md += `## Notes\n\n`;
        md += `@protected\n`;
        md += `Add your notes here. This section will be preserved when regenerating documentation.\n`;
        md += `@end\n`;

        return {
            content: md,
            confidence: 0, // Local generation has no confidence score
            generatedWith: 'local'
        };
    }

    /**
     * Generate a template-based class description for Local mode
     */
    private static generateClassDescriptionLocal(className: string, cls: any, domainName: string): string {
        const isAbstract = cls.abstract ? 'abstract base ' : '';
        const hasAttrs = (cls.attributes?.length || 0) > 0;
        const hasRefs = (cls.references?.length || 0) > 0;

        let desc = `The \`${className}\` ${isAbstract}class`;

        if (cls.extends) {
            const superName = typeof cls.extends === 'string' ? cls.extends : cls.extends.name;
            desc += ` extends \`${superName}\` and represents a specialized type`;
        } else {
            desc += ` represents a core concept in the ${domainName} domain`;
        }

        if (hasAttrs && hasRefs) {
            desc += `, containing ${cls.attributes.length} attribute${cls.attributes.length > 1 ? 's' : ''} and ${cls.references.length} relationship${cls.references.length > 1 ? 's' : ''}.`;
        } else if (hasAttrs) {
            desc += `, defined by ${cls.attributes.length} attribute${cls.attributes.length > 1 ? 's' : ''}.`;
        } else if (hasRefs) {
            desc += `, connected through ${cls.references.length} relationship${cls.references.length > 1 ? 's' : ''}.`;
        } else {
            desc += `.`;
        }

        return desc;
    }

    // ========================================
    // JJODIE (AI) GENERATION
    // ========================================

    /**
     * Robustly extract and parse JSON from AI response
     * Handles various response formats: pure JSON, markdown code blocks, text + JSON
     */
    private static extractJsonFromResponse(responseText: string): any {
        const trimmed = responseText.trim();

        // Strategy 1: Try direct parse (response is pure JSON)
        try {
            return JSON.parse(trimmed);
        } catch {
            // Continue to other strategies
        }

        // Strategy 2: Extract from markdown code blocks
        // Matches ```json, ```JSON, ``` (any language), etc.
        const codeBlockPatterns = [
            /```json\s*([\s\S]*?)\s*```/i,
            /```JSON\s*([\s\S]*?)\s*```/i,
            /```\s*([\s\S]*?)\s*```/,
        ];

        for (const pattern of codeBlockPatterns) {
            const match = trimmed.match(pattern);
            if (match && match[1]) {
                try {
                    return JSON.parse(match[1].trim());
                } catch {
                    // Try to fix common JSON issues
                    const fixed = this.fixCommonJsonIssues(match[1].trim());
                    try {
                        return JSON.parse(fixed);
                    } catch {
                        // Continue to next pattern
                    }
                }
            }
        }

        // Strategy 3: Find JSON object in text (starts with { ends with })
        const jsonObjectMatch = trimmed.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
            try {
                return JSON.parse(jsonObjectMatch[0]);
            } catch {
                const fixed = this.fixCommonJsonIssues(jsonObjectMatch[0]);
                try {
                    return JSON.parse(fixed);
                } catch {
                    // Continue to next strategy
                }
            }
        }

        // Strategy 4: Find JSON array in text (starts with [ ends with ])
        const jsonArrayMatch = trimmed.match(/\[[\s\S]*\]/);
        if (jsonArrayMatch) {
            try {
                return JSON.parse(jsonArrayMatch[0]);
            } catch {
                const fixed = this.fixCommonJsonIssues(jsonArrayMatch[0]);
                try {
                    return JSON.parse(fixed);
                } catch {
                    // Continue
                }
            }
        }

        // Strategy 5: Try to find the last valid JSON in the response
        // (Some models add explanations after the JSON)
        const lines = trimmed.split('\n');
        let jsonCandidate = '';
        let braceCount = 0;
        let inJson = false;

        for (const line of lines) {
            if (!inJson && line.trim().startsWith('{')) {
                inJson = true;
                jsonCandidate = '';
            }

            if (inJson) {
                jsonCandidate += line + '\n';
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;

                if (braceCount === 0 && jsonCandidate.trim()) {
                    try {
                        return JSON.parse(jsonCandidate.trim());
                    } catch {
                        const fixed = this.fixCommonJsonIssues(jsonCandidate.trim());
                        try {
                            return JSON.parse(fixed);
                        } catch {
                            // Reset and try to find another JSON object
                            inJson = false;
                            jsonCandidate = '';
                        }
                    }
                }
            }
        }

        // All strategies failed
        throw new Error('Could not extract valid JSON from AI response');
    }

    /**
     * Fix common JSON formatting issues from AI responses
     */
    private static fixCommonJsonIssues(jsonStr: string): string {
        let fixed = jsonStr;

        // Remove trailing commas before } or ]
        fixed = fixed.replace(/,\s*([}\]])/g, '$1');

        // Remove control characters that break JSON (except \n, \r, \t)
        fixed = fixed.replace(/[\x00-\x1F\x7F]/g, (char) => {
            if (char === '\n' || char === '\r' || char === '\t') {
                return char; // Keep these
            }
            return ''; // Remove others
        });

        // Fix single quotes used instead of double quotes (some models do this)
        // Only fix if the string doesn't parse as valid JSON
        try {
            JSON.parse(fixed);
            return fixed; // Already valid
        } catch {
            // Try replacing single quotes with double quotes
            // This is risky but sometimes necessary
            const singleQuoteFixed = fixed
                .replace(/'/g, '"')
                .replace(/"\s*:\s*"/g, '": "'); // Fix spacing

            try {
                JSON.parse(singleQuoteFixed);
                return singleQuoteFixed;
            } catch {
                // Return original fixed version
                return fixed;
            }
        }
    }

    /**
     * Create a fallback response by extracting what we can from the text
     * Used when JSON parsing completely fails but we have useful text content
     */
    private static createFallbackResponse(
        responseText: string,
        lexicalData: ProjectLexicalData
    ): JjodieResponse | null {
        try {
            // Try to extract domain from the response text
            let domain = 'General';
            const domainPatterns = [
                /domain[:\s]+["']?([^"'\n,]+)["']?/i,
                /this (?:is a|appears to be|represents)(?: an?)?\s+([^.]+)/i,
                /(?:modeling|models)\s+(?:the\s+)?([^.]+)\s+domain/i,
            ];

            for (const pattern of domainPatterns) {
                const match = responseText.match(pattern);
                if (match && match[1]) {
                    domain = match[1].trim().substring(0, 50);
                    break;
                }
            }

            // Extract any descriptions we can find
            const projectDescription = this.extractDescription(responseText, lexicalData.project.name)
                || `Documentation for ${lexicalData.project.name}`;

            // Build minimal valid response
            const fallbackResponse: JjodieResponse = {
                domain,
                domainConfidence: 30, // Low confidence for fallback
                projectDescription,
                metamodels: lexicalData.metamodels.map(mm => ({
                    name: mm.name,
                    description: this.extractDescription(responseText, mm.name)
                        || `Metamodel containing ${mm.classes.length} classes.`,
                    classes: mm.classes.map(cls => ({
                        name: cls.name,
                        description: this.extractDescription(responseText, cls.name)
                            || this.generateClassDescriptionLocal(cls.name, cls, domain),
                        attributeDescriptions: {},
                        referenceDescriptions: {},
                    })),
                })),
            };

            return fallbackResponse;
        } catch (error) {
            console.error('[DocumentationService] Fallback response creation failed:', error);
            return null;
        }
    }

    /**
     * Try to extract a description for a named element from text
     */
    private static extractDescription(text: string, elementName: string): string | null {
        if (!elementName) return null;

        // Look for patterns like "ElementName: description" or "ElementName is/represents..."
        const patterns = [
            new RegExp(`${elementName}[:\\s]+([^.]+\\.)`, 'i'),
            new RegExp(`${elementName}\\s+(?:is|represents|defines|models)\\s+([^.]+\\.)`, 'i'),
            new RegExp(`\\*\\*${elementName}\\*\\*[:\\s]+([^.]+\\.)`, 'i'),
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1] && match[1].length > 10) {
                return match[1].trim();
            }
        }

        return null;
    }

    /**
     * Generate documentation with AI (Jjodie)
     */
    static async generateWithJjodie(project: LProject): Promise<GenerationResult> {
        const lexicalData = this.extractLexicalData(project);

        // Collect terms for Wikidata lookup
        const terms: string[] = [];
        terms.push(project.name || '');
        lexicalData.metamodels.forEach(mm => {
            terms.push(mm.name);
            mm.classes.forEach(c => {
                terms.push(c.name);
                // Split camelCase into words
                const words = c.name.split(/(?=[A-Z])/).filter(w => w.length > 2);
                words.forEach(w => terms.push(w.toLowerCase()));
            });
        });

        // Fetch Wikidata definitions
        let wikidataDefinitions: Record<string, string> = {};
        try {
            wikidataDefinitions = await this.fetchWikidataDefinitions(terms.filter(t => t.length > 2));
            console.log('[DocumentationService] Wikidata definitions:', wikidataDefinitions);
        } catch (error) {
            console.warn('[DocumentationService] Wikidata fetch failed:', error);
        }

        // Build prompt
        const prompt = this.buildJjodiePrompt(lexicalData, wikidataDefinitions);
        console.log('[DocumentationService] Jjodie prompt built, length:', prompt.length);

        // Get active provider
        const activeProvider = JodieConfig.current.activeProvider;
        if (!activeProvider) {
            throw new Error('No AI provider configured');
        }

        // Call AI
        console.log('[DocumentationService] Calling AI provider:', activeProvider);
        const responseText = await AIProviderService.chat(
            prompt,
            activeProvider,
            [],
            undefined
        );
        console.log('[DocumentationService] AI response received, length:', responseText.length);

        // Parse JSON response with robust extraction
        let aiResponse: JjodieResponse;
        try {
            aiResponse = this.extractJsonFromResponse(responseText);
            console.log('[DocumentationService] Successfully parsed AI response');
        } catch (parseError) {
            console.error('[DocumentationService] Failed to parse AI response.');
            console.error('[DocumentationService] Response preview:', responseText.substring(0, 1000));
            console.error('[DocumentationService] Parse error:', parseError);

            // Last resort: try to generate a minimal valid response from the text
            const lexicalDataForFallback = this.extractLexicalData(project);
            const fallbackResponse = this.createFallbackResponse(responseText, lexicalDataForFallback);
            if (fallbackResponse) {
                console.warn('[DocumentationService] Using fallback response from text extraction');
                aiResponse = fallbackResponse;
            } else {
                throw new Error('AI returned invalid JSON format. Please try again or use Local generation.');
            }
        }

        // Validate response
        if (!aiResponse.domain || !aiResponse.metamodels) {
            throw new Error('AI response missing required fields (domain, metamodels)');
        }

        // Convert to Markdown
        const markdown = this.convertJjodieToMarkdown(project, aiResponse, lexicalData);

        return {
            content: markdown,
            confidence: aiResponse.domainConfidence || 50,
            generatedWith: 'jjodie'
        };
    }

    /**
     * Extract lexical data from project for AI prompt
     */
    private static extractLexicalData(project: LProject): ProjectLexicalData {
        const metamodels = (project as any).metamodels || [];

        return {
            project: {
                name: project.name || 'Unnamed Project',
                description: (project as any).description || undefined
            },
            metamodels: metamodels.map((mm: any) => ({
                name: mm.name || 'Unnamed Metamodel',
                classes: (mm.classes || []).map((cls: any) => ({
                    name: cls.name || 'Unnamed',
                    isAbstract: cls.abstract || false,
                    attributes: (cls.attributes || []).map((attr: any) => ({
                        name: attr.name || '',
                        type: typeof attr.type === 'string' ? attr.type : (attr.type?.name || 'any'),
                        multiplicity: attr.lowerBound !== undefined
                            ? `${attr.lowerBound}..${attr.upperBound === -1 ? '*' : attr.upperBound}`
                            : undefined
                    })),
                    references: (cls.references || []).map((ref: any) => ({
                        name: ref.name || '',
                        targetClass: typeof ref.type === 'string' ? ref.type : (ref.type?.name || 'unknown'),
                        type: (ref.containment ? 'composition' : 'association') as 'association' | 'composition' | 'aggregation',
                        multiplicity: ref.lowerBound !== undefined
                            ? `${ref.lowerBound}..${ref.upperBound === -1 ? '*' : ref.upperBound}`
                            : undefined
                    })),
                    superClass: cls.extends?.name || undefined
                })),
                enumerations: (mm.enumerations || []).map((en: any) => ({
                    name: en.name || 'Unnamed',
                    literals: (en.literals || []).map((l: any) => l.name || l || '')
                }))
            }))
        };
    }

    /**
     * Fetch definitions from Wikidata API
     */
    private static async fetchWikidataDefinitions(terms: string[]): Promise<Record<string, string>> {
        const definitions: Record<string, string> = {};
        const uniqueTerms = [...new Set(terms)].slice(0, 10); // Max 10 terms

        for (const term of uniqueTerms) {
            try {
                const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(term)}&language=en&format=json&origin=*`;
                const searchRes = await fetch(searchUrl);
                const searchData = await searchRes.json();

                if (searchData.search && searchData.search.length > 0) {
                    const description = searchData.search[0].description;
                    if (description) {
                        definitions[term] = description;
                    }
                }
            } catch (error) {
                console.warn(`[DocumentationService] Wikidata lookup failed for "${term}":`, error);
            }
        }

        return definitions;
    }

    /**
     * Build the AI prompt for documentation generation
     */
    private static buildJjodiePrompt(data: ProjectLexicalData, wikidataDefinitions?: Record<string, string>): string {
        const metamodelSections = data.metamodels.map(mm => `
### Metamodel: ${mm.name}

**Classes:**
${mm.classes.map(c => `
- **${c.name}**${c.isAbstract ? ' (abstract)' : ''}${c.superClass ? ` extends ${c.superClass}` : ''}
  - Attributes: ${c.attributes.map(a => `${a.name}: ${a.type}${a.multiplicity ? ` [${a.multiplicity}]` : ''}`).join(', ') || 'none'}
  - References: ${c.references.map(r => `${r.name} -> ${r.targetClass} (${r.type}, ${r.multiplicity || '0..*'})`).join(', ') || 'none'}
`).join('\n')}

**Enumerations:**
${mm.enumerations.map(e => `- ${e.name}: [${e.literals.join(', ')}]`).join('\n') || 'none'}
`).join('\n');

        const wikidataSection = wikidataDefinitions && Object.keys(wikidataDefinitions).length > 0
            ? `\n## Reference Definitions from Wikidata:\n${Object.entries(wikidataDefinitions).map(([term, def]) => `- **${term}**: ${def}`).join('\n')}\n`
            : '';

        return `
You are a documentation expert. Analyze this metamodel and generate comprehensive, detailed documentation.

## Project: ${data.project.name}
${data.project.description ? `Description: ${data.project.description}` : ''}
${wikidataSection}
## Metamodel Structure:
${metamodelSections}

## Your Task:
1. **Identify the Application Domain**: Based on class names, attributes, relationships${wikidataDefinitions ? ', and Wikidata definitions' : ''}, determine the specific domain (e.g., "Vehicle Fleet Management", "Genealogical Family System", "E-commerce Platform")

2. **Write Extended Project Description** (3-5 sentences): Explain the purpose, scope, and potential use cases of this metamodel

3. **For Each Metamodel**: Write a description (2-3 sentences) explaining what it models and its role

4. **For Each Class**: Write a detailed description including:
   - What real-world concept it represents
   - Its role in the domain
   - How it relates to other classes
   ${wikidataDefinitions ? '- Use the Wikidata definitions to enrich your descriptions' : ''}

5. **For Each Attribute**: Explain its purpose and what data it holds

6. **For Each Reference**: Explain the relationship semantics and why it exists

7. **Confidence Score**: Rate 0-100 how confident you are in your domain identification

## CRITICAL: Output Format

You MUST respond with ONLY a valid JSON object. No other text.

RULES:
1. Start your response with { and end with }
2. Do NOT wrap in markdown code blocks (no \`\`\`json)
3. Do NOT add any text before or after the JSON
4. Do NOT add comments or explanations
5. Ensure all strings are properly escaped
6. Do NOT use trailing commas

The JSON structure MUST be:
{
    "domain": "Specific domain name",
    "domainConfidence": 85,
    "projectDescription": "Extended description (3-5 sentences)...",
    "metamodels": [
        {
            "name": "metamodel name",
            "description": "Extended description (2-3 sentences)...",
            "classes": [
                {
                    "name": "ClassName",
                    "description": "Detailed description (2-4 sentences)...",
                    "attributeDescriptions": {
                        "attrName": "What this attribute represents and its purpose..."
                    },
                    "referenceDescriptions": {
                        "refName": "The semantic meaning of this relationship..."
                    }
                }
            ]
        }
    ]
}

Be specific, detailed, and use domain terminology. Avoid generic descriptions.
REMEMBER: Output ONLY the JSON object, nothing else.
`;
    }

    /**
     * Convert AI response to Markdown documentation
     */
    private static convertJjodieToMarkdown(
        project: LProject,
        aiResponse: JjodieResponse,
        lexicalData: ProjectLexicalData
    ): string {
        let md = `# ${project.name || 'Project'} Documentation\n\n`;

        // Overview with confidence
        md += `## Overview\n\n`;
        md += `> **Domain**: ${aiResponse.domain} (${aiResponse.domainConfidence}% confidence)\n\n`;
        md += `${aiResponse.projectDescription}\n\n`;

        // Metamodels
        aiResponse.metamodels.forEach((mm, mmIndex) => {
            md += `---\n\n`;
            md += `## Metamodel: ${mm.name}\n\n`;
            md += `${mm.description}\n\n`;

            if (mm.classes && mm.classes.length > 0) {
                mm.classes.forEach(cls => {
                    // Find original class data for structural info
                    const originalClass = lexicalData.metamodels[mmIndex]?.classes.find(c => c.name === cls.name);

                    const icon = originalClass?.isAbstract ? '◇' : '■';
                    md += `### ${icon} ${cls.name}${originalClass?.isAbstract ? ' *(abstract)*' : ''}\n\n`;
                    md += `${cls.description}\n\n`;

                    // Inheritance
                    if (originalClass?.superClass) {
                        md += `**Extends:** \`${originalClass.superClass}\`\n\n`;
                    }

                    // Attributes with AI descriptions
                    if (cls.attributeDescriptions && Object.keys(cls.attributeDescriptions).length > 0) {
                        md += `**Attributes:**\n\n`;
                        md += `| Name | Type | Description |\n|------|------|-------------|\n`;
                        Object.entries(cls.attributeDescriptions).forEach(([name, desc]) => {
                            const attr = originalClass?.attributes.find(a => a.name === name);
                            md += `| \`${name}\` | ${attr?.type || ''} | ${desc} |\n`;
                        });
                        md += `\n`;
                    }

                    // References with AI descriptions
                    if (cls.referenceDescriptions && Object.keys(cls.referenceDescriptions).length > 0) {
                        md += `**Relationships:**\n\n`;
                        Object.entries(cls.referenceDescriptions).forEach(([name, desc]) => {
                            md += `- **${name}**: ${desc}\n`;
                        });
                        md += `\n`;
                    }
                });
            }
        });

        // Enumerations from original data
        const allEnums = lexicalData.metamodels.flatMap(mm => mm.enumerations);
        if (allEnums.length > 0) {
            md += `---\n\n`;
            md += `## Enumerations\n\n`;
            allEnums.forEach(en => {
                md += `**${en.name}**: \`${en.literals.join('\`, \`')}\`\n\n`;
            });
        }

        // Notes section with protected markers
        md += `---\n\n`;
        md += `## Notes\n\n`;
        md += `@protected\n`;
        md += `*Add your notes here. This section is preserved on regeneration.*\n`;
        md += `@end\n`;

        return md;
    }

    // ========================================
    // PROTECTED SECTIONS
    // ========================================

    /**
     * Extract @protected ... @end sections from content
     */
    static extractProtectedSections(content: string): Array<{ id: string; content: string }> {
        const sections: Array<{ id: string; content: string }> = [];
        const regex = /@protected([\s\S]*?)@end/g;

        let match;
        let index = 0;
        while ((match = regex.exec(content)) !== null) {
            sections.push({
                id: `protected_${index}`,
                content: match[1].trim(),
            });
            index++;
        }

        return sections;
    }

    /**
     * Merge new content with preserved protected sections from old content
     */
    static mergeProtectedSections(newContent: string, oldContent: string): string {
        const oldSections = this.extractProtectedSections(oldContent);
        if (oldSections.length === 0) return newContent;

        // Find the Notes section in new content and replace its protected content
        const notesMatch = newContent.match(/(## Notes[\s\S]*?)(@protected[\s\S]*?@end)/);
        if (notesMatch && oldSections.length > 0) {
            return newContent.replace(
                notesMatch[2],
                `@protected\n${oldSections[0].content}\n@end`
            );
        }

        return newContent;
    }

    /**
     * Count protected sections in content
     */
    static countProtectedSections(content: string): number {
        const matches = content.match(/@protected/g);
        return matches ? matches.length : 0;
    }
}

export default DocumentationService;
