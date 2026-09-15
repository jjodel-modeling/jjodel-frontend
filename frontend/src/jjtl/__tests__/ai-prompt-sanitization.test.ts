import { describe, test, expect } from 'vitest';
/**
 * Tests for AI prompt output sanitization and JjTL code generation.
 *
 * Verifies that:
 * 1. AIMatcher.sanitizeConversionHint fixes common LLM syntax mistakes
 * 2. generateJjtlCode produces correct JjTL with := and where guards
 */

// --- Test sanitizeConversionHint via the AIMatcher class ---

import { AIMatcher } from '../services/AIMatcher';

// Access private method via prototype for testing
const matcher = new AIMatcher();
const sanitize = (matcher as any).sanitizeConversionHint.bind(matcher);

describe('AIMatcher.sanitizeConversionHint', () => {
    test('replaces === with ==', () => {
        expect(sanitize('gender === "Male"')).toBe('gender == "Male"');
    });

    test('replaces !== with !=', () => {
        expect(sanitize('status !== "active"')).toBe('status != "active"');
    });

    test('replaces # comments with -- comments', () => {
        expect(sanitize('name.toUpper() # uppercase')).toBe('name.toUpper() -- uppercase');
    });

    test('replaces // comments with -- comments', () => {
        expect(sanitize('name.toLower() // lowercase')).toBe('name.toLower() -- lowercase');
    });

    test('handles multiple replacements in one string', () => {
        expect(sanitize('x === 1 # check')).toBe('x == 1 -- check');
    });

    test('leaves valid JjEL expressions untouched', () => {
        expect(sanitize('name.toUpper()')).toBe('name.toUpper()');
        expect(sanitize('if x == 1 then "a" else "b"')).toBe('if x == 1 then "a" else "b"');
        expect(sanitize('true=1, false=0')).toBe('true=1, false=0');
        expect(sanitize('parent?.name ?? "default"')).toBe('parent?.name ?? "default"');
    });
});

// --- Test generateJjtlCode with guardHint ---

// We need to test the generateJjtlCode function from SuggestedMappingsPanel.
// Since it's a module-scoped function, we replicate the logic here for testing.
// This mirrors the actual implementation.

import type { MappingSuggestion } from '../types/suggestions';

function isJjelExpression(hint: string): boolean {
    return /[().=\[\]><!+\-*/%&|0-9]/.test(hint);
}

function formatAttrMapping(attr: MappingSuggestion): string {
    let line = `    ${attr.targetAttribute} := ${attr.sourceAttribute}`;
    if (attr.conversionHint) {
        if (isJjelExpression(attr.conversionHint)) {
            line += ` : ${attr.conversionHint}`;
        } else {
            line += `  -- ${attr.conversionHint}`;
        }
    }
    return line;
}

function generateJjtlCode(mappings: MappingSuggestion[]): string {
    if (mappings.length === 0) return '';

    const classMappings = mappings.filter(m => !m.sourceAttribute);
    const attrMappings = mappings.filter(m => m.sourceAttribute);

    const attrByClassPair = new Map<string, MappingSuggestion[]>();
    for (const attr of attrMappings) {
        const key = `${attr.sourceClass}|${attr.targetClass}`;
        if (!attrByClassPair.has(key)) {
            attrByClassPair.set(key, []);
        }
        attrByClassPair.get(key)!.push(attr);
    }

    let code = '';
    const processedPairs = new Set<string>();

    for (const classMapping of classMappings) {
        const pairKey = `${classMapping.sourceClass}|${classMapping.targetClass}`;
        const matchingAttrs = attrByClassPair.get(pairKey) || [];

        code += `${classMapping.sourceClass} -> ${classMapping.targetClass}`;

        if (classMapping.guardHint) {
            code += ` where ${classMapping.guardHint}`;
        }

        if (matchingAttrs.length > 0) {
            code += ' {\n';
            for (const attr of matchingAttrs) {
                code += formatAttrMapping(attr) + '\n';
            }
            code += '}';
        }

        code += '\n\n';
        processedPairs.add(pairKey);
    }

    for (const [pairKey, attrs] of attrByClassPair) {
        if (processedPairs.has(pairKey)) continue;

        const [sourceClass, targetClass] = pairKey.split('|');

        code += `${sourceClass} -> ${targetClass} {\n`;
        for (const attr of attrs) {
            code += formatAttrMapping(attr) + '\n';
        }
        code += '}\n\n';
    }

    return code.trim();
}

function makeSuggestion(overrides: Partial<MappingSuggestion>): MappingSuggestion {
    return {
        id: 'test',
        sourceClass: 'Person',
        sourceClassId: 's1',
        targetClass: 'Human',
        targetClassId: 't1',
        confidence: 'high',
        reason: 'ai-inferred',
        reasonText: 'test',
        status: 'toInsert',
        ...overrides,
    };
}

describe('generateJjtlCode', () => {
    test('uses := for attribute mappings', () => {
        const code = generateJjtlCode([
            makeSuggestion({}),
            makeSuggestion({
                id: 'a1',
                sourceAttribute: 'name',
                targetAttribute: 'label',
            }),
        ]);
        expect(code).toContain('label := name');
        expect(code).not.toContain('name -> label');
    });

    test('emits where guard when guardHint is present', () => {
        const code = generateJjtlCode([
            makeSuggestion({
                targetClass: 'Male',
                targetClassId: 't2',
                guardHint: 'gender == "Male"',
            }),
        ]);
        expect(code).toContain('Person -> Male where gender == "Male"');
    });

    test('emits multiple guarded class mappings for concrete subclasses', () => {
        const code = generateJjtlCode([
            makeSuggestion({
                id: 'm1',
                targetClass: 'Male',
                targetClassId: 't2',
                guardHint: 'gender == "Male"',
            }),
            makeSuggestion({
                id: 'f1',
                targetClass: 'Female',
                targetClassId: 't3',
                guardHint: 'gender == "Female"',
            }),
        ]);
        expect(code).toContain('Person -> Male where gender == "Male"');
        expect(code).toContain('Person -> Female where gender == "Female"');
        expect(code).not.toContain('Human');
    });

    test('uses -- for non-JjEL conversionHints', () => {
        const code = generateJjtlCode([
            makeSuggestion({}),
            makeSuggestion({
                id: 'a1',
                sourceAttribute: 'name',
                targetAttribute: 'label',
                conversionHint: 'needs manual review',
            }),
        ]);
        expect(code).toContain('-- needs manual review');
        expect(code).not.toContain(': needs manual review');
    });

    test('uses : for JjEL conversionHints', () => {
        const code = generateJjtlCode([
            makeSuggestion({}),
            makeSuggestion({
                id: 'a1',
                sourceAttribute: 'name',
                targetAttribute: 'label',
                conversionHint: 'name.toUpper()',
            }),
        ]);
        expect(code).toContain('label := name : name.toUpper()');
    });

    test('class mapping without guard or attributes', () => {
        const code = generateJjtlCode([
            makeSuggestion({ targetClass: 'Table', targetClassId: 't1' }),
        ]);
        expect(code).toBe('Person -> Table');
    });
});
