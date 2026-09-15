import { describe, it, expect } from 'vitest';
import {
    parseQualifiedName,
    qualifiedNameToString,
    matchQualifiedName,
    parseMultiplicity,
    multiplicityToString,
    isMany,
    isRequired,
    isOptional,
    parseTypeReference,
    typeReferenceToString,
    isPrimitiveType,
    parseLiteralValue,
    literalValueToString,
    isValidIdentifier,
    isValidClassName,
    isValidAttributeName,
    suggestCorrection,
} from '../parser/grammar';

// ─── Qualified Names ─────────────────────────────────────────

describe('parseQualifiedName', () => {
    it('should parse simple name', () => {
        const qn = parseQualifiedName('Person');
        expect(qn.segments).toEqual(['Person']);
        expect(qn.member).toBeUndefined();
    });

    it('should parse qualified name with package', () => {
        const qn = parseQualifiedName('domain::Person');
        expect(qn.segments).toEqual(['domain', 'Person']);
        expect(qn.member).toBeUndefined();
    });

    it('should parse deep qualified name', () => {
        const qn = parseQualifiedName('org::domain::Person');
        expect(qn.segments).toEqual(['org', 'domain', 'Person']);
    });

    it('should parse member access', () => {
        const qn = parseQualifiedName('Person.name');
        expect(qn.segments).toEqual(['Person']);
        expect(qn.member).toBe('name');
    });

    it('should parse full qualified member access', () => {
        const qn = parseQualifiedName('domain::Person.name');
        expect(qn.segments).toEqual(['domain', 'Person']);
        expect(qn.member).toBe('name');
    });

    it('should handle empty string', () => {
        const qn = parseQualifiedName('');
        expect(qn.segments).toEqual([]);
        expect(qn.raw).toBe('');
    });

    it('should handle whitespace-only string', () => {
        const qn = parseQualifiedName('   ');
        expect(qn.segments).toEqual([]);
    });
});

describe('qualifiedNameToString', () => {
    it('should convert simple name', () => {
        expect(qualifiedNameToString({ segments: ['Person'], raw: 'Person' })).toBe('Person');
    });

    it('should convert qualified name', () => {
        expect(qualifiedNameToString({ segments: ['domain', 'Person'], raw: 'domain::Person' })).toBe('domain::Person');
    });

    it('should convert with member', () => {
        expect(qualifiedNameToString({ segments: ['Person'], member: 'name', raw: 'Person.name' })).toBe('Person.name');
    });
});

describe('matchQualifiedName', () => {
    const person = parseQualifiedName('domain::Person');
    const simplePerson = parseQualifiedName('Person');

    it('should match by simple name (last segment)', () => {
        expect(matchQualifiedName(simplePerson, person)).toBe(true);
    });

    it('should match exact full path', () => {
        expect(matchQualifiedName(person, person)).toBe(true);
    });

    it('should not match different names', () => {
        const other = parseQualifiedName('Animal');
        expect(matchQualifiedName(other, person)).toBe(false);
    });

    it('should match with wildcard segment', () => {
        const pattern = parseQualifiedName('*::Person');
        expect(matchQualifiedName(pattern, person)).toBe(true);
    });

    it('should match empty pattern to anything', () => {
        const empty = parseQualifiedName('');
        expect(matchQualifiedName(empty, person)).toBe(true);
    });
});

// ─── Multiplicity ────────────────────────────────────────────

describe('parseMultiplicity', () => {
    it('should parse [0..1]', () => {
        const m = parseMultiplicity('[0..1]');
        expect(m.lower).toBe(0);
        expect(m.upper).toBe(1);
    });

    it('should parse [1..*]', () => {
        const m = parseMultiplicity('[1..*]');
        expect(m.lower).toBe(1);
        expect(m.upper).toBe('*');
    });

    it('should parse [*] as 0..*', () => {
        const m = parseMultiplicity('[*]');
        expect(m.lower).toBe(0);
        expect(m.upper).toBe('*');
    });

    it('should parse [+] as 1..*', () => {
        const m = parseMultiplicity('+');
        expect(m.lower).toBe(1);
        expect(m.upper).toBe('*');
    });

    it('should parse [?] as 0..1', () => {
        const m = parseMultiplicity('?');
        expect(m.lower).toBe(0);
        expect(m.upper).toBe(1);
    });

    it('should parse single number as exact count', () => {
        const m = parseMultiplicity('3');
        expect(m.lower).toBe(3);
        expect(m.upper).toBe(3);
    });

    it('should parse without brackets', () => {
        const m = parseMultiplicity('0..*');
        expect(m.lower).toBe(0);
        expect(m.upper).toBe('*');
    });

    it('should default to [1..1] for empty', () => {
        const m = parseMultiplicity('');
        expect(m.lower).toBe(1);
        expect(m.upper).toBe(1);
    });

    it('should default to [1..1] for unknown', () => {
        const m = parseMultiplicity('xyz');
        expect(m.lower).toBe(1);
        expect(m.upper).toBe(1);
    });
});

describe('multiplicity helpers', () => {
    it('isMany should detect upper > 1 or *', () => {
        expect(isMany(parseMultiplicity('[0..*]'))).toBe(true);
        expect(isMany(parseMultiplicity('[0..5]'))).toBe(true);
        expect(isMany(parseMultiplicity('[0..1]'))).toBe(false);
        expect(isMany(parseMultiplicity('[1]'))).toBe(false);
    });

    it('isRequired should detect lower >= 1', () => {
        expect(isRequired(parseMultiplicity('[1..*]'))).toBe(true);
        expect(isRequired(parseMultiplicity('[0..1]'))).toBe(false);
    });

    it('isOptional should detect lower === 0', () => {
        expect(isOptional(parseMultiplicity('[0..1]'))).toBe(true);
        expect(isOptional(parseMultiplicity('[1]'))).toBe(false);
    });
});

describe('multiplicityToString', () => {
    it('should format exact count', () => {
        expect(multiplicityToString({ lower: 1, upper: 1, raw: '' })).toBe('[1]');
    });

    it('should format range', () => {
        expect(multiplicityToString({ lower: 0, upper: '*', raw: '' })).toBe('[0..*]');
    });
});

// ─── Type References ─────────────────────────────────────────

describe('parseTypeReference', () => {
    it('should parse primitive types', () => {
        expect(parseTypeReference('String').kind).toBe('primitive');
        expect(parseTypeReference('Integer').kind).toBe('primitive');
        expect(parseTypeReference('Boolean').kind).toBe('primitive');
        expect(parseTypeReference('Float').kind).toBe('primitive');
        expect(parseTypeReference('Date').kind).toBe('primitive');
    });

    it('should handle type aliases (case-insensitive)', () => {
        const strRef = parseTypeReference('string');
        expect(strRef.kind).toBe('primitive');
        if (strRef.kind === 'primitive') expect(strRef.type).toBe('String');

        const intRef = parseTypeReference('int');
        expect(intRef.kind).toBe('primitive');
        if (intRef.kind === 'primitive') expect(intRef.type).toBe('Integer');

        const boolRef = parseTypeReference('bool');
        expect(boolRef.kind).toBe('primitive');
        if (boolRef.kind === 'primitive') expect(boolRef.type).toBe('Boolean');
    });

    it('should parse class references', () => {
        const ref = parseTypeReference('Person');
        expect(ref.kind).toBe('class');
    });

    it('should parse qualified class references', () => {
        const ref = parseTypeReference('domain::Person');
        expect(ref.kind).toBe('class');
        if (ref.kind === 'class') {
            expect(ref.name.segments).toEqual(['domain', 'Person']);
        }
    });

    it('should parse collection types', () => {
        const listRef = parseTypeReference('List<String>');
        expect(listRef.kind).toBe('collection');
        if (listRef.kind === 'collection') {
            expect(listRef.ordered).toBe(true);
            expect(listRef.elementType.kind).toBe('primitive');
        }

        const setRef = parseTypeReference('Set<Person>');
        expect(setRef.kind).toBe('collection');
        if (setRef.kind === 'collection') {
            expect(setRef.unique).toBe(true);
        }
    });

    it('should default empty to String', () => {
        const ref = parseTypeReference('');
        expect(ref.kind).toBe('primitive');
        if (ref.kind === 'primitive') expect(ref.type).toBe('String');
    });
});

describe('typeReferenceToString', () => {
    it('should format primitive', () => {
        expect(typeReferenceToString({ kind: 'primitive', type: 'String' })).toBe('String');
    });

    it('should format collection', () => {
        const ref = parseTypeReference('Set<String>');
        expect(typeReferenceToString(ref)).toBe('Set<String>');
    });
});

describe('isPrimitiveType', () => {
    it('should return true for primitives', () => {
        expect(isPrimitiveType({ kind: 'primitive', type: 'String' })).toBe(true);
    });

    it('should return false for class refs', () => {
        expect(isPrimitiveType({ kind: 'class', name: parseQualifiedName('Person') })).toBe(false);
    });
});

// ─── Literal Values ──────────────────────────────────────────

describe('parseLiteralValue', () => {
    it('should parse null', () => {
        expect(parseLiteralValue('null').kind).toBe('null');
    });

    it('should parse booleans', () => {
        const t = parseLiteralValue('true');
        expect(t.kind).toBe('boolean');
        if (t.kind === 'boolean') expect(t.value).toBe(true);

        const f = parseLiteralValue('false');
        expect(f.kind).toBe('boolean');
        if (f.kind === 'boolean') expect(f.value).toBe(false);
    });

    it('should parse integers', () => {
        const n = parseLiteralValue('42');
        expect(n.kind).toBe('number');
        if (n.kind === 'number') expect(n.value).toBe(42);
    });

    it('should parse floats', () => {
        const n = parseLiteralValue('3.14');
        expect(n.kind).toBe('number');
        if (n.kind === 'number') expect(n.value).toBe(3.14);
    });

    it('should parse negative numbers', () => {
        const n = parseLiteralValue('-5');
        expect(n.kind).toBe('number');
        if (n.kind === 'number') expect(n.value).toBe(-5);
    });

    it('should parse double-quoted strings', () => {
        const s = parseLiteralValue('"hello"');
        expect(s.kind).toBe('string');
        if (s.kind === 'string') expect(s.value).toBe('hello');
    });

    it('should parse single-quoted strings', () => {
        const s = parseLiteralValue("'world'");
        expect(s.kind).toBe('string');
        if (s.kind === 'string') expect(s.value).toBe('world');
    });

    it('should parse unquoted string as default', () => {
        const s = parseLiteralValue('unknown');
        expect(s.kind).toBe('string');
        if (s.kind === 'string') expect(s.value).toBe('unknown');
    });

    it('should parse arrays', () => {
        const a = parseLiteralValue('[1, 2, 3]');
        expect(a.kind).toBe('array');
        if (a.kind === 'array') {
            expect(a.values.length).toBe(3);
            expect(a.values[0].kind).toBe('number');
        }
    });

    it('should parse enum literal with ::', () => {
        const e = parseLiteralValue('Status::ACTIVE');
        expect(e.kind).toBe('enumLiteral');
        if (e.kind === 'enumLiteral') {
            expect(e.literal).toBe('ACTIVE');
        }
    });

    it('should handle null/undefined input', () => {
        expect(parseLiteralValue(null as any).kind).toBe('null');
        expect(parseLiteralValue(undefined as any).kind).toBe('null');
    });

    it('should handle empty string as null', () => {
        expect(parseLiteralValue('').kind).toBe('null');
    });
});

describe('literalValueToString', () => {
    it('should format null', () => {
        expect(literalValueToString({ kind: 'null' })).toBe('null');
    });

    it('should format boolean', () => {
        expect(literalValueToString({ kind: 'boolean', value: true })).toBe('true');
    });

    it('should format number', () => {
        expect(literalValueToString({ kind: 'number', value: 42 })).toBe('42');
    });

    it('should format string with quotes', () => {
        expect(literalValueToString({ kind: 'string', value: 'hello' })).toBe('"hello"');
    });

    it('should format array', () => {
        expect(literalValueToString({
            kind: 'array',
            values: [{ kind: 'number', value: 1 }, { kind: 'number', value: 2 }]
        })).toBe('[1, 2]');
    });
});

// ─── Validation ──────────────────────────────────────────────

describe('isValidIdentifier', () => {
    it('should accept valid identifiers', () => {
        expect(isValidIdentifier('name')).toBe(true);
        expect(isValidIdentifier('Person')).toBe(true);
        expect(isValidIdentifier('my_var')).toBe(true);
        expect(isValidIdentifier('_private')).toBe(true);
        expect(isValidIdentifier('a1')).toBe(true);
    });

    it('should reject invalid identifiers', () => {
        expect(isValidIdentifier('')).toBe(false);
        expect(isValidIdentifier('123')).toBe(false);
        expect(isValidIdentifier('hello world')).toBe(false);
        expect(isValidIdentifier('a-b')).toBe(false);
    });
});

describe('isValidClassName', () => {
    it('should accept any valid identifier', () => {
        expect(isValidClassName('Person')).toBe(true);
        expect(isValidClassName('myClass')).toBe(true);
    });

    it('should reject invalid identifiers', () => {
        expect(isValidClassName('')).toBe(false);
        expect(isValidClassName('123Class')).toBe(false);
    });
});

describe('isValidAttributeName', () => {
    it('should accept valid identifiers', () => {
        expect(isValidAttributeName('name')).toBe(true);
        expect(isValidAttributeName('firstName')).toBe(true);
    });

    it('should reject invalid identifiers', () => {
        expect(isValidAttributeName('')).toBe(false);
    });
});

// ─── Fuzzy matching ──────────────────────────────────────────

describe('suggestCorrection', () => {
    const commands = ['create', 'delete', 'rename', 'set', 'list', 'show', 'help'];

    it('should suggest close match', () => {
        expect(suggestCorrection('creat', commands)).toBe('create');
        expect(suggestCorrection('delet', commands)).toBe('delete');
    });

    it('should suggest for typos', () => {
        expect(suggestCorrection('craete', commands)).toBe('create');
        expect(suggestCorrection('renam', commands)).toBe('rename');
    });

    it('should return null for no close match', () => {
        expect(suggestCorrection('zzzzz', commands)).toBeNull();
    });

    it('should return null for empty input', () => {
        expect(suggestCorrection('', commands)).toBeNull();
    });

    it('should return null for empty possibilities', () => {
        expect(suggestCorrection('create', [])).toBeNull();
    });
});
