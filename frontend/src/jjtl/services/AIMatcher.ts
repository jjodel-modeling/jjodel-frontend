/**
 * AIMatcher - AI-powered mapping suggestions using configured LLM providers
 * Uses JodieConfigService to check provider availability
 * Uses AIProviderService to call the LLM
 */

import { MetamodelElement } from '../views/MetamodelTreeView';
import { MappingSuggestion, SuggestionConfidence, AnalysisProgressCallback } from '../types/suggestions';
import { AIProviderService } from '../../services/AIProviderService';
import { PromptService } from '../../services/PromptService';
import {AIConfig, JodieConfig, TAIProvider} from "../../types/jodie";

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
        targetMetamodelName: string = 'Target',
        aiProvider?: TAIProvider,
        signal?: AbortSignal,
        onProgress?: AnalysisProgressCallback
    ): Promise<MappingSuggestion[]> {
        if (JodieConfig.getEnabledProviders().length == 0) {
            throw new Error('AI provider not configured. Please configure an AI provider in Settings.');
        }

        // Store elements for ID lookup after AI response
        this.sourceElements = sourceElements;
        this.targetElements = targetElements;

        // Phase 1 — building prompt. Fire progress BEFORE the work so the UI shows
        // the step as running while buildPrompt executes (even if it's sub-50ms).
        onProgress?.('building-prompt');
        const prompt = this.buildPrompt(
            sourceElements,
            targetElements,
            sourceMetamodelName,
            targetMetamodelName
        );
        // Count source + target classes for the completed-state sub-label.
        const sourceClassCount = this.countClasses(sourceElements);
        const targetClassCount = this.countClasses(targetElements);

        try {
            const provider = aiProvider ?? AIConfig.getPreferred('mappings');
            const model = AIConfig.getPreferredModel('mappings');
            // TODO: AIProviderService.chat does not yet accept AbortSignal.
            // To enable real cancellation, add `signal?: AbortSignal` to its signature
            // and forward it to the underlying fetch() calls in each provider adapter.
            //
            // Phase 2 — calling AI. Fire progress with the detail from phase 1 attached
            // to that (now completing) phase. Contract: onProgress(step) means "step is
            // starting; previous one is complete; detail below belongs to the previous one".
            onProgress?.('calling-ai', `${sourceClassCount} source classes, ${targetClassCount} target classes`);
            const response = await AIProviderService.chat(prompt, provider, [], undefined, undefined, undefined, model);
            if (signal?.aborted) {
                const abortErr = new Error('Analysis was cancelled');
                abortErr.name = 'AbortError';
                throw abortErr;
            }
            // Phase 3 — parsing. The detail for phase 2 is empty (a response arrived; the
            // "duration" itself was the message).
            onProgress?.('parsing');
            const suggestions = this.parseResponse(response);
            // The panel attaches the final count as phase-3 detail when it applies the
            // terminal transition after analyze() resolves (see SuggestedMappingsPanel).
            // We return the suggestions; the caller decides how to mark phase 3 completed.
            return suggestions;
        } catch (error) {
            console.error('[AIMatcher] Error:', error);
            throw error;
        }
    }

    /**
     * Counts `type === 'class'` entries recursively in a MetamodelElement tree.
     * Used for the building-prompt sub-label in the progress modal.
     */
    private countClasses(elements: MetamodelElement[]): number {
        let n = 0;
        const walk = (list: MetamodelElement[] | undefined) => {
            if (!list) return;
            for (const el of list) {
                if (el.type === 'class') n++;
                if (el.children) walk(el.children);
            }
        };
        walk(elements);
        return n;
    }

    /**
     * Build the prompt for the AI.
     *
     * The template is resolved via PromptService with cascading overrides
     * (project → global → default). Metamodel content is injected via the
     * template engine's `{{var}}` placeholders. To customize the prompt,
     * edit it in Settings → Prompts → Analyze Metamodels.
     */
    private buildPrompt(
        sourceElements: MetamodelElement[],
        targetElements: MetamodelElement[],
        sourceName: string,
        targetName: string
    ): string {
        return PromptService.getRendered('mappings', {
            customVariables: {
                sourceName,
                targetName,
                sourceMetamodel: this.formatMetamodel(sourceElements),
                targetMetamodel: this.formatMetamodel(targetElements),
            },
        });
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
                    conversionHint: item.conversionHint ? this.sanitizeConversionHint(item.conversionHint) : undefined,
                    guardHint: item.guardHint,
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
     * Sanitize a conversionHint from LLM output to valid JjEL syntax
     */
    private sanitizeConversionHint(hint: string): string {
        return hint
            .replace(/===/g, '==')       // === -> ==
            .replace(/!==/g, '!=')       // !== -> !=
            .replace(/#\s/g, '-- ')      // # comments -> -- comments
            .replace(/\/\/\s/g, '-- ');  // // comments -> -- comments
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
