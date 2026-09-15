/**
 * JjScript Normalizer
 * Converts natural language syntax to formal JjScript commands
 *
 * @example
 * ```typescript
 * import { normalize, normalizeWithDetails } from '../normalizer';
 *
 * // Simple normalization
 * const jjscript = normalize('create class Person');
 * // Result: '/add class Person'
 *
 * // With details
 * const results = normalizeWithDetails(`
 *   create class Person
 *   create attribute name in Person type String
 * `);
 * // Results include original, normalized, rule name, and transform status
 * ```
 */

import { NORMALIZATION_RULES } from './rules';
import type { NormalizationRule } from './rules';
export { NORMALIZATION_RULES } from './rules';
export type { NormalizationRule } from './rules';
export {
    detectJjScript,
    isJjScriptCode,
    isJjScriptLine,
    detectSyntaxType,
} from './detector';

// ============================================
// TYPES
// ============================================

export interface NormalizationResult {
    /** Original input line */
    original: string;
    /** Normalized JjScript command */
    normalized: string;
    /** Name of the rule that matched (if any) */
    rule?: string;
    /** Whether the line was transformed */
    wasTransformed: boolean;
    /** Line number (1-indexed) */
    lineNumber?: number;
}

export interface NormalizationSummary {
    /** All normalization results */
    results: NormalizationResult[];
    /** Number of lines transformed */
    transformedCount: number;
    /** Number of lines already in JjScript format */
    alreadyJjScriptCount: number;
    /** Number of lines that couldn't be normalized */
    unknownCount: number;
    /** Total lines processed */
    totalLines: number;
    /** Combined JjScript output */
    output: string;
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Normalize a single line to JjScript
 */
export function normalizeLine(line: string, lineNumber?: number): NormalizationResult {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
        return {
            original: line,
            normalized: '',
            wasTransformed: false,
            lineNumber,
        };
    }

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
        return {
            original: line,
            normalized: '',
            wasTransformed: false,
            lineNumber,
        };
    }

    // Already JjScript format (starts with /)
    if (trimmed.startsWith('/')) {
        return {
            original: line,
            normalized: trimmed,
            wasTransformed: false,
            lineNumber,
        };
    }

    // Try each normalization rule
    for (const rule of NORMALIZATION_RULES) {
        const match = trimmed.match(rule.pattern);
        if (match) {
            return {
                original: line,
                normalized: rule.transform(match),
                rule: rule.name,
                wasTransformed: true,
                lineNumber,
            };
        }
    }

    // No match - return as-is (might be an error or unrecognized syntax)
    return {
        original: line,
        normalized: trimmed,
        wasTransformed: false,
        lineNumber,
    };
}

/**
 * Normalize code to JjScript (simple output)
 */
export function normalize(code: string): string {
    return code
        .split('\n')
        .map((line, idx) => normalizeLine(line, idx + 1))
        .map(r => r.normalized)
        .filter(line => line.length > 0)
        .join('\n');
}

/**
 * Normalize code with detailed results
 */
export function normalizeWithDetails(code: string): NormalizationSummary {
    const lines = code.split('\n');
    const results: NormalizationResult[] = [];

    let transformedCount = 0;
    let alreadyJjScriptCount = 0;
    let unknownCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const result = normalizeLine(lines[i], i + 1);
        results.push(result);

        if (result.normalized) {
            if (result.wasTransformed) {
                transformedCount++;
            } else if (result.original.trim().startsWith('/')) {
                alreadyJjScriptCount++;
            } else if (result.original.trim() && !result.original.trim().startsWith('//') && !result.original.trim().startsWith('#')) {
                unknownCount++;
            }
        }
    }

    const output = results
        .map(r => r.normalized)
        .filter(line => line.length > 0)
        .join('\n');

    return {
        results,
        transformedCount,
        alreadyJjScriptCount,
        unknownCount,
        totalLines: lines.length,
        output,
    };
}

/**
 * Check if a line needs normalization
 */
export function needsNormalization(line: string): boolean {
    const trimmed = line.trim();

    // Empty or comment
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
        return false;
    }

    // Already JjScript
    if (trimmed.startsWith('/')) {
        return false;
    }

    // Check if any rule matches
    return NORMALIZATION_RULES.some(rule => rule.pattern.test(trimmed));
}

/**
 * Get the rule that would match a line (if any)
 */
export function getMatchingRule(line: string): NormalizationRule | null {
    const trimmed = line.trim();

    for (const rule of NORMALIZATION_RULES) {
        if (rule.pattern.test(trimmed)) {
            return rule;
        }
    }

    return null;
}

/**
 * Add a custom normalization rule at runtime
 */
export function addNormalizationRule(rule: NormalizationRule): void {
    NORMALIZATION_RULES.push(rule);
    // Re-sort by priority
    NORMALIZATION_RULES.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

/**
 * Preview what the normalization would produce without executing
 */
export function previewNormalization(code: string): Array<{
    original: string;
    normalized: string;
    changed: boolean;
}> {
    return code.split('\n').map(line => {
        const result = normalizeLine(line);
        return {
            original: line,
            normalized: result.normalized,
            changed: result.wasTransformed,
        };
    });
}
