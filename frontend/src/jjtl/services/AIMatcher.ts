/**
 * AIMatcher - AI-powered mapping suggestions using configured LLM providers
 * Uses JodieConfigService to check provider availability
 * Uses AIProviderService to call the LLM
 */

import { MetamodelElement } from '../views/MetamodelTreeView';
import { MappingSuggestion, SuggestionConfidence } from '../types/suggestions';
import { AIProviderService } from '../../services/AIProviderService';
import {JodieConfig} from "../../types/jodie";

export class AIMatcher {
    // Store elements for ID lookup after AI response
    private sourceElements: MetamodelElement[] = [];
    private targetElements: MetamodelElement[] = [];

    /**
     * Analyze metamodels using AI
     */
    async analyze(
        sourceElements: MetamodelElement[],
        targetElements: MetamodelElement[],
        sourceMetamodelName: string = 'Source',
        targetMetamodelName: string = 'Target'
    ): Promise<MappingSuggestion[]> {
        if (JodieConfig.getEnabledProviders().length == 0) {
            throw new Error('AI provider not configured. Please configure an AI provider in Settings.');
        }

        // Store elements for ID lookup after AI response
        this.sourceElements = sourceElements;
        this.targetElements = targetElements;

        const prompt = this.buildPrompt(
            sourceElements,
            targetElements,
            sourceMetamodelName,
            targetMetamodelName
        );

        try {
            const provider = JodieConfig.current.activeProvider;
            const response = await AIProviderService.chat(prompt, provider, [], undefined);
            return this.parseResponse(response);
        } catch (error) {
            console.error('[AIMatcher] Error:', error);
            throw error;
        }
    }

    /**
     * Build the prompt for the AI
     */
    private buildPrompt(
        sourceElements: MetamodelElement[],
        targetElements: MetamodelElement[],
        sourceName: string,
        targetName: string
    ): string {
        return `You are an expert in model-driven engineering and metamodel transformations.

Analyze these two metamodels and suggest semantic mappings between them.

## Source Metamodel: ${sourceName}

${this.formatMetamodel(sourceElements)}

## Target Metamodel: ${targetName}

${this.formatMetamodel(targetElements)}

## Task

Identify which elements from the Source metamodel should map to which elements in the Target metamodel.
Consider:
1. Semantic similarity (even if names are different)
2. Structural similarity
3. Type compatibility
4. Common modeling patterns

## Response Format

Respond ONLY with a JSON array of mapping suggestions. No explanation, no markdown code blocks, just the raw JSON array:

[
    {
        "sourceClass": "ClassName",
        "sourceAttribute": null,
        "targetClass": "ClassName",
        "targetAttribute": null,
        "confidence": "high",
        "reason": "Explanation"
    },
    {
        "sourceClass": "ClassName",
        "sourceAttribute": "attrName",
        "targetClass": "ClassName",
        "targetAttribute": "attrName",
        "confidence": "medium",
        "reason": "Explanation",
        "conversionHint": "optional conversion hint"
    }
]

Notes:
- sourceAttribute/targetAttribute should be null for class-level mappings
- confidence should be "high", "medium", or "low"
- Only suggest mappings you are confident about
- Quality over quantity`;
    }

    /**
     * Format metamodel elements for the prompt
     */
    private formatMetamodel(elements: MetamodelElement[]): string {
        const lines: string[] = [];

        const formatElement = (el: MetamodelElement, indent: number = 0) => {
            const prefix = '  '.repeat(indent);

            switch (el.type) {
                case 'package':
                    lines.push(`${prefix}Package: ${el.name}`);
                    break;
                case 'class':
                    lines.push(`${prefix}Class: ${el.name}${el.isAbstract ? ' (abstract)' : ''}`);
                    break;
                case 'attribute':
                    const attrType = el.dataType || 'unknown';
                    const mult = el.multiplicity ? ` [${el.multiplicity}]` : '';
                    lines.push(`${prefix}  - ${el.name}: ${attrType}${mult}`);
                    break;
                case 'reference':
                    const refType = el.dataType || 'unknown';
                    const refMult = el.multiplicity ? ` [${el.multiplicity}]` : '';
                    lines.push(`${prefix}  -> ${el.name}: ${refType}${refMult}`);
                    break;
                case 'enumeration':
                    lines.push(`${prefix}Enum: ${el.name}`);
                    break;
                case 'literal':
                    lines.push(`${prefix}  - ${el.name}`);
                    break;
            }

            if (el.children) {
                for (const child of el.children) {
                    formatElement(child, el.type === 'package' ? indent + 1 : indent);
                }
            }
        };

        for (const el of elements) {
            formatElement(el);
        }

        return lines.join('\n');
    }

    /**
     * Parse the AI response into suggestions
     */
    private parseResponse(response: string): MappingSuggestion[] {
        try {
            // Try to extract JSON from the response
            let jsonStr = response.trim();

            // Remove markdown code blocks if present
            const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1];
            }

            // Try to find JSON array
            const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                jsonStr = arrayMatch[0];
            }

            const parsed = JSON.parse(jsonStr);

            if (!Array.isArray(parsed)) {
                console.warn('[AIMatcher] Response is not an array');
                return [];
            }

            return parsed.map((item: any, index: number) => {
                // Resolve names to element IDs
                const sourceClass = this.findClass(this.sourceElements, item.sourceClass);
                const targetClass = this.findClass(this.targetElements, item.targetClass);
                const sourceAttr = item.sourceAttribute && sourceClass
                    ? this.findAttribute(sourceClass, item.sourceAttribute)
                    : undefined;
                const targetAttr = item.targetAttribute && targetClass
                    ? this.findAttribute(targetClass, item.targetAttribute)
                    : undefined;

                return {
                    id: `ai_${index}_${Date.now()}`,
                    sourceClass: item.sourceClass || '',
                    sourceClassId: sourceClass?.id || `unknown_src_${item.sourceClass}`,
                    sourceAttribute: item.sourceAttribute || undefined,
                    sourceAttributeId: sourceAttr?.id,
                    sourceType: item.sourceType || sourceAttr?.dataType,
                    targetClass: item.targetClass || '',
                    targetClassId: targetClass?.id || `unknown_tgt_${item.targetClass}`,
                    targetAttribute: item.targetAttribute || undefined,
                    targetAttributeId: targetAttr?.id,
                    targetType: item.targetType || targetAttr?.dataType,
                    confidence: this.normalizeConfidence(item.confidence),
                    reason: 'ai-inferred' as const,
                    reasonText: item.reason || 'AI suggested mapping',
                    conversionHint: item.conversionHint,
                    status: 'pending',
                };
            });
        } catch (error) {
            console.error('[AIMatcher] Failed to parse response:', error);
            console.error('[AIMatcher] Response was:', response);
            return [];
        }
    }

    /**
     * Find a class by name in the metamodel elements
     */
    private findClass(elements: MetamodelElement[], name: string): MetamodelElement | undefined {
        if (!name) return undefined;
        const lowerName = name.toLowerCase();

        const search = (els: MetamodelElement[]): MetamodelElement | undefined => {
            for (const el of els) {
                if (el.type === 'class' && el.name.toLowerCase() === lowerName) {
                    return el;
                }
                if (el.children) {
                    const found = search(el.children);
                    if (found) return found;
                }
            }
            return undefined;
        };

        return search(elements);
    }

    /**
     * Find an attribute by name within a class
     */
    private findAttribute(classEl: MetamodelElement, attrName: string): MetamodelElement | undefined {
        if (!attrName || !classEl.children) return undefined;
        const lowerName = attrName.toLowerCase();

        return classEl.children.find(
            c => (c.type === 'attribute' || c.type === 'reference') &&
                 c.name.toLowerCase() === lowerName
        );
    }

    /**
     * Normalize confidence value
     */
    private normalizeConfidence(conf: string): SuggestionConfidence {
        const c = (conf || '').toLowerCase();
        if (c === 'high' || c === 'h') return 'high';
        if (c === 'low' || c === 'l') return 'low';
        return 'medium';
    }
}

export const aiMatcher = new AIMatcher();
