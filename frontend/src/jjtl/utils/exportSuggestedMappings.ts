/**
 * Serializer + browser-download helper for exporting the current AI mapping
 * suggestions as a JSON document (benchmark dataset for the MDEIntelligence
 * mapping-suggestion study).
 *
 * `buildSuggestedMappingsJson` is pure and framework-free; `downloadSuggestedMappings`
 * is the only browser-touching surface (Blob + <a download>). Enum values are emitted
 * verbatim from the tool (status `toInsert`, confidence `medium`) — no normalization.
 *
 * `kind` is derived from the presence of an attribute on either endpoint; the
 * MappingSuggestion type has no reference concept, so `reference` is never produced.
 */

import { MappingStatus, MappingSuggestion, SuggestionConfidence } from '../types/suggestions';

export interface ExportedMappingEndpoint {
    class: string;
    feature: string | null;
    type: string | null;
}

export interface ExportedMapping {
    id: string;
    kind: 'class' | 'attribute';
    confidence: SuggestionConfidence;
    status: MappingStatus;
    source: ExportedMappingEndpoint;
    target: ExportedMappingEndpoint;
    /** Optional per-suggestion JjTL snippet; omitted entirely when unavailable. */
    jjtl?: string;
}

export interface SuggestedMappingsExport {
    jjodel: { exportType: 'suggested-mappings'; schemaVersion: 1 };
    transformation: { name: string | null; source: string | null; target: string | null };
    analysis: {
        provider: string | null;
        model: string | null;
        modelLabel: string | null;
        generatedAt: string;
        counts: { total: number; pending: number; toInsert: number; rejected: number };
    };
    mappings: ExportedMapping[];
}

export interface BuildSuggestedMappingsParams {
    /** Full suggestion list, every status included (pending/toInsert/rejected). */
    suggestions: MappingSuggestion[];
    transformationName?: string | null;
    sourceMetamodelName?: string | null;
    targetMetamodelName?: string | null;
    provider?: string | null;
    model?: string | null;
    modelLabel?: string | null;
    /** ISO-8601 timestamp supplied by the caller (e.g. new Date().toISOString()). */
    generatedAt: string;
    /** Optional per-suggestion JjTL generator; the field is omitted when it yields empty. */
    getJjtl?: (m: MappingSuggestion) => string | undefined;
}

export function buildSuggestedMappingsJson(params: BuildSuggestedMappingsParams): SuggestedMappingsExport {
    const { suggestions, getJjtl } = params;

    const counts = { total: suggestions.length, pending: 0, toInsert: 0, rejected: 0 };
    for (const s of suggestions) {
        if (s.status === 'pending') counts.pending++;
        else if (s.status === 'toInsert') counts.toInsert++;
        else if (s.status === 'rejected') counts.rejected++;
    }

    const mappings: ExportedMapping[] = suggestions.map(s => {
        const isAttribute = !!(s.sourceAttribute || s.targetAttribute);
        const mapping: ExportedMapping = {
            id: s.id,
            kind: isAttribute ? 'attribute' : 'class',
            confidence: s.confidence,
            status: s.status,
            source: {
                class: s.sourceClass,
                feature: s.sourceAttribute ?? null,
                type: s.sourceType ?? null,
            },
            target: {
                class: s.targetClass,
                feature: s.targetAttribute ?? null,
                type: s.targetType ?? null,
            },
        };
        if (getJjtl) {
            const snippet = getJjtl(s)?.trim();
            if (snippet) mapping.jjtl = snippet;
        }
        return mapping;
    });

    return {
        jjodel: { exportType: 'suggested-mappings', schemaVersion: 1 },
        transformation: {
            name: params.transformationName ?? null,
            source: params.sourceMetamodelName ?? null,
            target: params.targetMetamodelName ?? null,
        },
        analysis: {
            provider: params.provider ?? null,
            model: params.model ?? null,
            modelLabel: params.modelLabel ?? null,
            generatedAt: params.generatedAt,
            counts,
        },
        mappings,
    };
}

export function downloadSuggestedMappings(params: BuildSuggestedMappingsParams): void {
    const data = buildSuggestedMappingsJson(params);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (params.transformationName ?? '').trim().replace(/[^A-Za-z0-9._-]+/g, '_');
    a.download = safeName ? `${safeName}_suggested_mappings.json` : 'suggested_mappings.json';
    a.click();
    URL.revokeObjectURL(url);
}
