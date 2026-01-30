/**
 * JjScript Grammar Utilities
 * Helper functions for parsing qualified names, multiplicities, types, etc.
 */

import {
    QualifiedName,
    Multiplicity,
    TypeReference,
    PrimitiveTypeName,
    TYPE_ALIASES,
    LiteralValue,
    MULTIPLICITY
} from '../types';

// ============================================
// QUALIFIED NAME PARSING
// ============================================

/**
 * Parse a qualified name string into a QualifiedName object
 * Supports formats:
 *   - "ClassName"
 *   - "Package::ClassName"
 *   - "Package::SubPackage::ClassName"
 *   - "Package::ClassName.attributeName"
 */
export function parseQualifiedName(raw: string): QualifiedName {
    if (!raw || raw.trim() === '') {
        return { segments: [], raw: '' };
    }

    raw = raw.trim();
    let member: string | undefined;

    // Check for member access (last dot-separated part if not part of qualified path)
    const lastDotIndex = raw.lastIndexOf('.');
    if (lastDotIndex > 0) {
        const beforeDot = raw.substring(0, lastDotIndex);
        const afterDot = raw.substring(lastDotIndex + 1);

        // Only treat as member if afterDot is a valid identifier (no ::)
        if (!afterDot.includes('::') && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(afterDot)) {
            member = afterDot;
            raw = beforeDot;
        }
    }

    // Split by :: for package/class path
    const segments = raw.split('::').filter(s => s.length > 0);

    return {
        segments,
        member,
        raw: member ? `${raw}.${member}` : raw
    };
}

/**
 * Convert a QualifiedName back to a string
 */
export function qualifiedNameToString(qn: QualifiedName): string {
    let result = qn.segments.join('::');
    if (qn.member) {
        result += '.' + qn.member;
    }
    return result;
}

/**
 * Check if a qualified name matches another (supports wildcards)
 */
export function matchQualifiedName(pattern: QualifiedName, target: QualifiedName): boolean {
    if (pattern.segments.length === 0) return true;

    // Check if pattern is just a simple name (last segment)
    if (pattern.segments.length === 1 && pattern.segments[0] !== '*') {
        const patternName = pattern.segments[0].toLowerCase();
        const targetName = target.segments[target.segments.length - 1]?.toLowerCase();
        return patternName === targetName;
    }

    // Full path match
    if (pattern.segments.length !== target.segments.length) return false;

    for (let i = 0; i < pattern.segments.length; i++) {
        const p = pattern.segments[i];
        const t = target.segments[i];
        if (p !== '*' && p.toLowerCase() !== t.toLowerCase()) {
            return false;
        }
    }

    // Check member if specified
    if (pattern.member && pattern.member !== '*') {
        return pattern.member.toLowerCase() === target.member?.toLowerCase();
    }

    return true;
}

// ============================================
// MULTIPLICITY PARSING
// ============================================

/**
 * Parse a multiplicity string into a Multiplicity object
 * Supports formats:
 *   - "[0..1]", "[1..*]", "[*]", "[0..5]"
 *   - "0..1", "1..*", "*" (without brackets)
 *   - "1" (single value = [1..1])
 */
export function parseMultiplicity(raw: string): Multiplicity {
    if (!raw || raw.trim() === '') {
        return { ...MULTIPLICITY.ONE };
    }

    raw = raw.trim();

    // Remove brackets if present
    if (raw.startsWith('[') && raw.endsWith(']')) {
        raw = raw.substring(1, raw.length - 1);
    }

    // Handle single "*"
    if (raw === '*') {
        return { lower: 0, upper: '*', raw: '[*]' };
    }

    // Handle single number
    if (/^\d+$/.test(raw)) {
        const n = parseInt(raw, 10);
        return { lower: n, upper: n, raw: `[${n}]` };
    }

    // Handle range "lower..upper"
    const rangeMatch = raw.match(/^(\d+)\.\.(\d+|\*)$/);
    if (rangeMatch) {
        const lower = parseInt(rangeMatch[1], 10);
        const upper = rangeMatch[2] === '*' ? '*' : parseInt(rangeMatch[2], 10);
        return { lower, upper, raw: `[${lower}..${upper === '*' ? '*' : upper}]` };
    }

    // Default to [1..1]
    return { ...MULTIPLICITY.ONE };
}

/**
 * Convert a Multiplicity to a display string
 */
export function multiplicityToString(m: Multiplicity): string {
    if (m.lower === m.upper) {
        return `[${m.lower}]`;
    }
    return `[${m.lower}..${m.upper === '*' ? '*' : m.upper}]`;
}

/**
 * Check if a multiplicity represents "many" (upper > 1 or *)
 */
export function isMany(m: Multiplicity): boolean {
    return m.upper === '*' || (typeof m.upper === 'number' && m.upper > 1);
}

/**
 * Check if a multiplicity is required (lower >= 1)
 */
export function isRequired(m: Multiplicity): boolean {
    return m.lower >= 1;
}

/**
 * Check if a multiplicity is optional (lower === 0)
 */
export function isOptional(m: Multiplicity): boolean {
    return m.lower === 0;
}

// ============================================
// TYPE PARSING
// ============================================

/**
 * Parse a type reference string into a TypeReference object
 * Supports:
 *   - Primitive types: "String", "int", "Boolean"
 *   - Class references: "MyClass", "Package::MyClass"
 *   - Collections: "List<String>", "Set<MyClass>"
 */
export function parseTypeReference(raw: string): TypeReference {
    if (!raw || raw.trim() === '') {
        return { kind: 'primitive', type: 'String' };
    }

    raw = raw.trim();

    // Check for collection types
    const collectionMatch = raw.match(/^(List|Set|Collection|OrderedSet|Bag|Sequence)\s*<(.+)>$/i);
    if (collectionMatch) {
        const collectionType = collectionMatch[1].toLowerCase();
        const elementType = parseTypeReference(collectionMatch[2]);
        return {
            kind: 'collection',
            elementType,
            ordered: collectionType === 'list' || collectionType === 'orderedset' || collectionType === 'sequence',
            unique: collectionType === 'set' || collectionType === 'orderedset'
        };
    }

    // Check if it's a primitive type
    const normalizedType = TYPE_ALIASES[raw];
    if (normalizedType) {
        return { kind: 'primitive', type: normalizedType };
    }

    // Check if it looks like a qualified name (contains ::)
    if (raw.includes('::')) {
        return { kind: 'class', name: parseQualifiedName(raw) };
    }

    // Check common primitive type names (case-insensitive)
    const lowerRaw = raw.toLowerCase();
    for (const [alias, type] of Object.entries(TYPE_ALIASES)) {
        if (alias.toLowerCase() === lowerRaw) {
            return { kind: 'primitive', type };
        }
    }

    // Assume it's a class reference
    return { kind: 'class', name: parseQualifiedName(raw) };
}

/**
 * Convert a TypeReference to a display string
 */
export function typeReferenceToString(type: TypeReference): string {
    switch (type.kind) {
        case 'primitive':
            return type.type;
        case 'class':
            return qualifiedNameToString(type.name);
        case 'enum':
            return qualifiedNameToString(type.name);
        case 'collection':
            const elementStr = typeReferenceToString(type.elementType);
            if (type.ordered && type.unique) return `OrderedSet<${elementStr}>`;
            if (type.ordered) return `List<${elementStr}>`;
            if (type.unique) return `Set<${elementStr}>`;
            return `Collection<${elementStr}>`;
    }
}

/**
 * Check if a type is a primitive type
 */
export function isPrimitiveType(type: TypeReference): type is { kind: 'primitive'; type: PrimitiveTypeName } {
    return type.kind === 'primitive';
}

// ============================================
// LITERAL VALUE PARSING
// ============================================

/**
 * Parse a literal value from a string
 */
export function parseLiteralValue(raw: string): LiteralValue {
    if (raw === undefined || raw === null) {
        return { kind: 'null' };
    }

    raw = String(raw).trim();

    // Null
    if (raw.toLowerCase() === 'null' || raw === '') {
        return { kind: 'null' };
    }

    // Boolean
    if (raw.toLowerCase() === 'true') {
        return { kind: 'boolean', value: true };
    }
    if (raw.toLowerCase() === 'false') {
        return { kind: 'boolean', value: false };
    }

    // Number
    if (/^-?\d+(\.\d+)?$/.test(raw)) {
        return { kind: 'number', value: parseFloat(raw) };
    }

    // String (remove quotes if present)
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        return { kind: 'string', value: raw.substring(1, raw.length - 1) };
    }

    // Array
    if (raw.startsWith('[') && raw.endsWith(']')) {
        const inner = raw.substring(1, raw.length - 1);
        const values = splitArrayValues(inner).map(parseLiteralValue);
        return { kind: 'array', values };
    }

    // Enum literal (EnumName::LiteralName or EnumName.LiteralName)
    if (raw.includes('::') || (raw.includes('.') && /^[A-Z]/.test(raw))) {
        const parts = raw.includes('::') ? raw.split('::') : raw.split('.');
        if (parts.length === 2) {
            return {
                kind: 'enumLiteral',
                enum: parseQualifiedName(parts[0]),
                literal: parts[1]
            };
        }
    }

    // Default to string
    return { kind: 'string', value: raw };
}

/**
 * Split array values, respecting nested structures
 */
function splitArrayValues(input: string): string[] {
    const values: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (const char of input) {
        if (inString) {
            current += char;
            if (char === stringChar) {
                inString = false;
            }
        } else if (char === '"' || char === "'") {
            current += char;
            inString = true;
            stringChar = char;
        } else if (char === '[' || char === '{' || char === '(') {
            current += char;
            depth++;
        } else if (char === ']' || char === '}' || char === ')') {
            current += char;
            depth--;
        } else if (char === ',' && depth === 0) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        values.push(current.trim());
    }

    return values;
}

/**
 * Convert a LiteralValue to a display string
 */
export function literalValueToString(value: LiteralValue): string {
    switch (value.kind) {
        case 'null':
            return 'null';
        case 'boolean':
            return value.value ? 'true' : 'false';
        case 'number':
            return String(value.value);
        case 'string':
            return `"${value.value}"`;
        case 'array':
            return '[' + value.values.map(literalValueToString).join(', ') + ']';
        case 'enumLiteral':
            return `${qualifiedNameToString(value.enum)}::${value.literal}`;
    }
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate an identifier name
 */
export function isValidIdentifier(name: string): boolean {
    if (!name || name.length === 0) return false;
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Validate a class name (PascalCase recommended)
 */
export function isValidClassName(name: string): boolean {
    if (!isValidIdentifier(name)) return false;
    // Warn if not PascalCase but don't reject
    return true;
}

/**
 * Validate an attribute name (camelCase recommended)
 */
export function isValidAttributeName(name: string): boolean {
    return isValidIdentifier(name);
}

/**
 * Suggest corrections for common mistakes
 */
export function suggestCorrection(input: string, possibilities: string[]): string | null {
    if (!input || possibilities.length === 0) return null;

    const inputLower = input.toLowerCase();
    let bestMatch: string | null = null;
    let bestScore = Infinity;

    for (const possibility of possibilities) {
        const score = levenshteinDistance(inputLower, possibility.toLowerCase());
        if (score < bestScore && score <= Math.ceil(input.length / 2)) {
            bestScore = score;
            bestMatch = possibility;
        }
    }

    return bestMatch;
}

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}
