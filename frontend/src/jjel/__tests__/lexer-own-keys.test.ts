import { describe, test, expect } from 'vitest';
/**
 * JjEL Lexer own-key lookup tests
 *
 * The OCL message table and the keyword table are plain objects: a lookup that
 * is not own-key only answers true for names inherited from Object.prototype.
 */

import { tokenize } from '../lexer';
import { parseExpression } from '../parser';
import { JjelTokenType } from '../types';

const INHERITED_NAMES = ['toString', 'valueOf', 'hasOwnProperty', 'constructor', '__proto__'];

describe('Inherited names are not OCL method messages', () => {
    for (const name of ['toString', 'valueOf', 'hasOwnProperty']) {
        test(`x.${name}() lexes and parses without an error`, () => {
            const { errors } = tokenize(`x.${name}()`);
            expect(errors).toEqual([]);
            const result = parseExpression(`x.${name}()`);
            expect(result.errors).toEqual([]);
            expect(result.expression).not.toBeNull();
        });
    }

    test('a lexer error message is always a string, never an inherited function', () => {
        for (const name of INHERITED_NAMES) {
            const { errors } = tokenize(`x.${name}`);
            for (const e of errors) expect(typeof e.message).toBe('string');
        }
    });
});

describe('Inherited names lex as identifiers', () => {
    for (const name of INHERITED_NAMES) {
        test(`bare ${name} is an IDENTIFIER`, () => {
            const { tokens, errors } = tokenize(name);
            expect(errors).toEqual([]);
            expect(tokens[0].type).toBe(JjelTokenType.IDENTIFIER);
            expect(tokens[0].value).toBe(name);
        });

        test(`x.${name} has an IDENTIFIER after the dot`, () => {
            const { tokens, errors } = tokenize(`x.${name}`);
            expect(errors).toEqual([]);
            const last = tokens[tokens.length - 2];
            expect(last.type).toBe(JjelTokenType.IDENTIFIER);
            expect(last.value).toBe(name);
        });
    }

    test('constructor parses as an Identifier', () => {
        const result = parseExpression('constructor');
        expect(result.errors).toEqual([]);
        expect(result.expression).toMatchObject({ type: 'Identifier', name: 'constructor' });
    });
});

describe('Own-key entries still fire', () => {
    const OCL_MESSAGES: Record<string, string> = {
        oclIsTypeOf: "'expr is Type'",
        oclIsKindOf: "'expr is Type'",
        oclIsUndefined: "'expr == null'",
        oclAsType: 'explicit type casts',
    };

    for (const [name, fragment] of Object.entries(OCL_MESSAGES)) {
        test(`${name} is still an OCL message error`, () => {
            const { errors } = tokenize(name);
            expect(errors).toHaveLength(1);
            expect(errors[0].message).toContain(fragment);
        });
    }

    test('keywords still lex as keywords', () => {
        expect(tokenize('if').tokens[0].type).toBe(JjelTokenType.IF);
        expect(tokenize('IF').tokens[0].type).toBe(JjelTokenType.IF);
        expect(tokenize('forall').tokens[0].type).toBe(JjelTokenType.FORALL);
        expect(tokenize('true').tokens[0].type).toBe(JjelTokenType.BOOLEAN);
        expect(tokenize('null').tokens[0].type).toBe(JjelTokenType.NULL);
    });
});
