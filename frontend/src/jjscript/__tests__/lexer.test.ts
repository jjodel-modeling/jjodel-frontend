import { describe, it, expect } from 'vitest';
import { Lexer, tokenize } from '../parser/lexer';
import type { Token, TokenType } from '../types';

// Helper: extract token types (excluding EOF)
function types(input: string): TokenType[] {
    return tokenize(input).filter(t => t.type !== 'EOF').map(t => t.type);
}

// Helper: extract token values (excluding EOF)
function values(input: string): string[] {
    return tokenize(input).filter(t => t.type !== 'EOF').map(t => t.value);
}

describe('JjScript Lexer', () => {

    // ── Basic token classification ───────────────────────────

    describe('commands', () => {
        it('should tokenize all known commands', () => {
            const commands = [
                'create', 'delete', 'rename', 'set', 'add', 'remove',
                'move', 'copy', 'list', 'show', 'help', 'undo', 'redo',
                'clear', 'validate', 'eval', 'let', 'forall', 'abstract'
            ];
            for (const cmd of commands) {
                const tokens = tokenize(cmd);
                expect(tokens[0].type, `${cmd} should be COMMAND`).toBe('COMMAND');
                expect(tokens[0].value).toBe(cmd);
            }
        });

        it('should NOT classify PascalCase words as commands', () => {
            expect(tokenize('Create')[0].type).toBe('IDENTIFIER');
            expect(tokenize('DELETE')[0].type).toBe('IDENTIFIER');
        });
    });

    describe('keywords', () => {
        it('should tokenize element type keywords', () => {
            const keywords = ['class', 'attribute', 'reference', 'operation', 'package', 'enum', 'literal'];
            for (const kw of keywords) {
                expect(tokenize(kw)[0].type, `${kw} should be KEYWORD`).toBe('KEYWORD');
            }
        });

        it('should tokenize structural keywords', () => {
            // Note: 'extends' is in both COMMANDS and KEYWORDS; lexer classifies it as COMMAND
            const kws = ['to', 'from', 'in', 'as', 'with', 'type'];
            for (const kw of kws) {
                expect(tokenize(kw)[0].type, `${kw} should be KEYWORD`).toBe('KEYWORD');
            }
        });

        it('should classify "extends" as COMMAND (dual membership)', () => {
            // 'extends' is in both COMMANDS and KEYWORDS; COMMANDS is checked first
            expect(tokenize('extends')[0].type).toBe('COMMAND');
        });

        it('should treat PascalCase class-like names as IDENTIFIER', () => {
            // "Attribute" (PascalCase) must be an identifier so it can be used as a class name
            expect(tokenize('Attribute')[0].type).toBe('IDENTIFIER');
            expect(tokenize('Class')[0].type).toBe('IDENTIFIER');
            expect(tokenize('Reference')[0].type).toBe('IDENTIFIER');
        });
    });

    describe('identifiers', () => {
        it('should tokenize simple identifiers', () => {
            expect(tokenize('Person')[0].type).toBe('IDENTIFIER');
            expect(tokenize('myAttribute')[0].type).toBe('IDENTIFIER');
            expect(tokenize('_private')[0].type).toBe('IDENTIFIER');
        });

        it('should tokenize qualified names with ::', () => {
            const tokens = tokenize('Package::MyClass');
            expect(tokens[0].type).toBe('QUALIFIED_NAME');
            expect(tokens[0].value).toBe('Package::MyClass');
        });

        it('should tokenize member access with dot', () => {
            const tokens = tokenize('Person.name');
            expect(tokens[0].type).toBe('QUALIFIED_NAME');
            expect(tokens[0].value).toBe('Person.name');
        });

        it('should tokenize full qualified member access', () => {
            const tokens = tokenize('domain::Person.name');
            expect(tokens[0].type).toBe('QUALIFIED_NAME');
            expect(tokens[0].value).toBe('domain::Person.name');
        });
    });

    describe('literals', () => {
        it('should tokenize double-quoted strings', () => {
            const tokens = tokenize('"hello world"');
            expect(tokens[0].type).toBe('STRING');
            expect(tokens[0].value).toBe('hello world');
        });

        it('should tokenize single-quoted strings', () => {
            const tokens = tokenize("'hello'");
            expect(tokens[0].type).toBe('STRING');
            expect(tokens[0].value).toBe('hello');
        });

        it('should handle escape sequences in strings', () => {
            const tokens = tokenize('"line1\\nline2"');
            expect(tokens[0].value).toBe('line1\nline2');
        });

        it('should tokenize integers', () => {
            const tokens = tokenize('42');
            expect(tokens[0].type).toBe('NUMBER');
            expect(tokens[0].value).toBe('42');
        });

        it('should tokenize floats', () => {
            const tokens = tokenize('3.14');
            expect(tokens[0].type).toBe('NUMBER');
            expect(tokens[0].value).toBe('3.14');
        });

        it('should tokenize negative numbers', () => {
            const tokens = tokenize('-5');
            expect(tokens[0].type).toBe('NUMBER');
            expect(tokens[0].value).toBe('-5');
        });

        it('should tokenize booleans', () => {
            expect(tokenize('true')[0].type).toBe('BOOLEAN');
            expect(tokenize('false')[0].type).toBe('BOOLEAN');
        });
    });

    describe('multiplicity', () => {
        it('should tokenize [0..1]', () => {
            const tokens = tokenize('[0..1]');
            expect(tokens[0].type).toBe('MULTIPLICITY');
            expect(tokens[0].value).toBe('[0..1]');
        });

        it('should tokenize [1..*]', () => {
            const tokens = tokenize('[1..*]');
            expect(tokens[0].type).toBe('MULTIPLICITY');
        });

        it('should tokenize [*]', () => {
            const tokens = tokenize('[*]');
            expect(tokens[0].type).toBe('MULTIPLICITY');
        });

        it('should tokenize [+] and [?]', () => {
            expect(tokenize('[+]')[0].type).toBe('MULTIPLICITY');
            expect(tokenize('[?]')[0].type).toBe('MULTIPLICITY');
        });
    });

    describe('operators and punctuation', () => {
        it('should tokenize assignment operators', () => {
            expect(tokenize('=')[0].type).toBe('OPERATOR');
            expect(tokenize('+=')[0].type).toBe('OPERATOR');
            expect(tokenize('-=')[0].type).toBe('OPERATOR');
        });

        it('should tokenize arrows', () => {
            expect(tokenize('->')[0].type).toBe('ARROW');
            expect(tokenize('<->')[0].type).toBe('ARROW');
        });

        it('should tokenize double colon as operator', () => {
            expect(tokenize('::')[0].type).toBe('OPERATOR');
        });

        it('should tokenize punctuation', () => {
            for (const ch of ['(', ')', '{', '}', ',', ';']) {
                expect(tokenize(ch)[0].type, `${ch} should be PUNCTUATION`).toBe('PUNCTUATION');
            }
        });
    });

    describe('comments', () => {
        it('should skip line comments', () => {
            const tokens = tokenize('create // this is a comment');
            expect(tokens.filter(t => t.type !== 'EOF').length).toBe(1);
            expect(tokens[0].type).toBe('COMMAND');
        });

        it('should skip block comments', () => {
            const tokens = tokenize('create /* block */ class');
            const meaningful = tokens.filter(t => t.type !== 'EOF');
            expect(meaningful.length).toBe(2);
            expect(meaningful[0].value).toBe('create');
            expect(meaningful[1].value).toBe('class');
        });
    });

    // ── Compound inputs ──────────────────────────────────────

    describe('compound statements', () => {
        it('should tokenize "create class Person"', () => {
            const t = types('create class Person');
            expect(t).toEqual(['COMMAND', 'KEYWORD', 'IDENTIFIER']);
        });

        it('should tokenize "create attribute name in Person type String"', () => {
            const t = types('create attribute name in Person type String');
            expect(t).toEqual(['COMMAND', 'KEYWORD', 'IDENTIFIER', 'KEYWORD', 'IDENTIFIER', 'KEYWORD', 'IDENTIFIER']);
        });

        it('should tokenize "set Person.abstract = true"', () => {
            const v = values('set Person.abstract = true');
            expect(v).toEqual(['set', 'Person.abstract', '=', 'true']);
        });

        it('should tokenize "create reference friends in Person type Person [0..*]"', () => {
            const t = types('create reference friends in Person type Person [0..*]');
            expect(t).toEqual([
                'COMMAND', 'KEYWORD', 'IDENTIFIER', 'KEYWORD',
                'IDENTIFIER', 'KEYWORD', 'IDENTIFIER', 'MULTIPLICITY'
            ]);
        });

        it('should tokenize "Employee extends Person"', () => {
            const t = types('Employee extends Person');
            // 'extends' is classified as COMMAND (see dual membership note above)
            expect(t).toEqual(['IDENTIFIER', 'COMMAND', 'IDENTIFIER']);
        });
    });

    // ── Edge cases ───────────────────────────────────────────

    describe('edge cases', () => {
        it('should handle empty input', () => {
            const tokens = tokenize('');
            expect(tokens.length).toBe(1); // just EOF
            expect(tokens[0].type).toBe('EOF');
        });

        it('should handle whitespace-only input', () => {
            const tokens = tokenize('   \t  ');
            expect(tokens.length).toBe(1); // just EOF
        });

        it('should handle newlines', () => {
            const tokens = tokenize('create\nclass');
            const meaningful = tokens.filter(t => t.type !== 'EOF' && t.type !== 'NEWLINE');
            expect(meaningful.length).toBe(2);
        });

        it('should track line and column numbers', () => {
            const tokens = tokenize('create class\nPerson');
            expect(tokens[0].line).toBe(1);
            // Person should be on line 2
            const person = tokens.find(t => t.value === 'Person');
            expect(person?.line).toBe(2);
        });
    });
});
