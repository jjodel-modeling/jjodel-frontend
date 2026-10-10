/**
 * The one list of the words the JjScript lexer reserves (P-2026-10-10-0045).
 *
 * Measured in `docs/discovery/discovery_2026-10-10_jjodie_reserved_identifiers.md` §4.1: the
 * lexer reserves 63 single words, exact and lowercase; `copy` is a command word and can never
 * be a name, `Copy` is an ordinary identifier.
 */
import { describe, it, expect } from 'vitest';
import { RESERVED_IDENTIFIERS, isReservedIdentifier } from '../reservedIdentifiers';
import { tokenize } from '../parser/lexer';
import { COMMANDS, ELEMENT_TYPES, KEYWORDS } from '../types';

/** The type of the first token of `word`, read through the lexer. */
const tokenTypeOf = (word: string): string => tokenize(word)[0].type;

describe('RESERVED_IDENTIFIERS', () => {
    it('contains copy, the word of the 2026-10-10 incident', () => {
        expect(RESERVED_IDENTIFIERS.has('copy')).toBe(true);
    });

    it('is the union of the lexer tables and the two booleans, single words only (63)', () => {
        const union = new Set<string>([
            ...COMMANDS,
            ...ELEMENT_TYPES.filter(w => !w.includes(' ')),
            ...KEYWORDS,
            'true',
            'false',
        ]);
        expect([...RESERVED_IDENTIFIERS].sort()).toEqual([...union].sort());
        expect(RESERVED_IDENTIFIERS.size).toBe(63);
    });

    it('holds lowercase words only', () => {
        for (const word of RESERVED_IDENTIFIERS) expect(word).toBe(word.toLowerCase());
    });
});

describe('isReservedIdentifier', () => {
    it('matches the exact lowercase word', () => {
        expect(isReservedIdentifier('copy')).toBe(true);
        expect(isReservedIdentifier('type')).toBe(true);
        expect(isReservedIdentifier('true')).toBe(true);
    });

    it('does not match another case: Copy, COPY and Class are ordinary names', () => {
        expect(isReservedIdentifier('Copy')).toBe(false);
        expect(isReservedIdentifier('COPY')).toBe(false);
        expect(isReservedIdentifier('Class')).toBe(false);
    });

    it('does not match a longer name', () => {
        expect(isReservedIdentifier('copyOf')).toBe(false);
        expect(isReservedIdentifier('bookCopy')).toBe(false);
    });

    it('does not walk the prototype', () => {
        for (const name of ['toString', 'constructor', '__proto__', 'hasOwnProperty', 'valueOf']) {
            expect(isReservedIdentifier(name), name).toBe(false);
        }
    });
});

describe('the lexer reads the list', () => {
    it('never tokenizes a reserved word as IDENTIFIER', () => {
        for (const word of RESERVED_IDENTIFIERS) {
            expect(tokenTypeOf(word), word).not.toBe('IDENTIFIER');
        }
    });

    it('tokenizes the capitalised form of every reserved word as IDENTIFIER', () => {
        for (const word of RESERVED_IDENTIFIERS) {
            const capitalised = word[0].toUpperCase() + word.slice(1);
            expect(tokenTypeOf(capitalised), capitalised).toBe('IDENTIFIER');
        }
    });

    it('keeps the token types of the base, word by word', () => {
        const expected: Record<string, string> = {
            copy: 'COMMAND',
            create: 'COMMAND',
            abstract: 'COMMAND',
            extends: 'COMMAND',
            forall: 'COMMAND',
            class: 'KEYWORD',
            instance: 'KEYWORD',
            containment: 'KEYWORD',
            type: 'KEYWORD',
            tree: 'KEYWORD',
            true: 'BOOLEAN',
            false: 'BOOLEAN',
            Attribute: 'IDENTIFIER',
            Copy: 'IDENTIFIER',
            copyOf: 'IDENTIFIER',
            toString: 'IDENTIFIER',
            constructor: 'IDENTIFIER',
            null: 'IDENTIFIER',
            do: 'IDENTIFIER',
        };
        for (const [word, type] of Object.entries(expected)) {
            expect(tokenTypeOf(word), word).toBe(type);
        }
    });
});
