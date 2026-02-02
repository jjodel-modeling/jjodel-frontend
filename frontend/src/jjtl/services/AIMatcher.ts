/**
 * AIMatcher - AI-powered mapping suggestions using configured LLM providers
 * Uses JodieConfigService to check provider availability
 * Uses AIProviderService to call the LLM
 */

import { MetamodelElement } from '../views/MetamodelTreeView';
import { MappingSuggestion, SuggestionConfidence } from '../types/suggestions';
import { JodieConfigService } from '../../services/JodieConfig';
import { AIProviderService } from '../../services/AIProviderService';

export class AIMatcher {

    /**
     * Check if AI is available (any provider configured and enabled)
     */
    isAvailable(): boolean {
        return JodieConfigService.hasValidConfiguration();
    }

    /**
     * Get the name of the active provider for display
     */
    getActiveProviderName(): string | null {
        if (!this.isAvailable()) return null;
        return JodieConfigService.getActiveProvider();
    }

    /**
     * Analyze metamodels using AI
     */
    async analyze(
        sourceElements: MetamodelElement[],
        targetElements: MetamodelElement[],
        sourceMetamodelName: string = 'Source',
        targetMetamodelName: string = 'Target'
    ): Promise<MappingSuggestion[]> {
        if (!this.isAvailable()) {
            throw new Error('AI provider not configured. Please configure an AI provider in Settings.');
        }

        const prompt = this.buildPrompt(
            sourceElements,
            targetElements,
            sourceMetamodelName,
            targetMetamodelName
        );

        try {
            const provider = JodieConfigService.getActiveProvider();
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

            return parsed.map((item: any, index: number) => ({
                id: `ai_${index}_${Date.now()}`,
                sourceClass: item.sourceClass || '',
                sourceAttribute: item.sourceAttribute || undefined,
                sourceType: item.sourceType,
                targetClass: item.targetClass || '',
                targetAttribute: item.targetAttribute || undefined,
                targetType: item.targetType,
                confidence: this.normalizeConfidence(item.confidence),
                reason: 'ai-inferred',
                reasonText: item.reason || 'AI suggested mapping',
                conversionHint: item.conversionHint,
                accepted: false,
                rejected: false,
            }));
        } catch (error) {
            console.error('[AIMatcher] Failed to parse response:', error);
            console.error('[AIMatcher] Response was:', response);
            return [];
        }
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
