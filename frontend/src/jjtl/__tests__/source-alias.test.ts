import { describe, it, expect } from 'vitest';
/**
 * Step 3: Optional Source Alias Tests
 *
 * Tests that 'Person p -> Human { ... }' parses correctly and that the alias
 * 'p' is available as an expression variable in where conditions and body.
 */

import { JjtlLexer } from '../lexer/lexer';
import { JjtlParser } from '../parser/parser';
import { JjtlExecutor } from '../executor/executor';
import type { TransformationAST, ClassMappingAST } from '../types/ast';

const HEADER = `transformation Test\nfrom Source\nto Target\n`;

function parse(source: string): TransformationAST {
    const lexer = new JjtlLexer(source);
    const { tokens, errors: lexErrors } = lexer.tokenize();
    if (lexErrors.length > 0) throw new Error(`Lex errors: ${lexErrors.map(e => e.message).join(', ')}`);
    const parser = new JjtlParser(tokens, source);
    const { ast, errors: parseErrors } = parser.parse();
    if (parseErrors.length > 0) throw new Error(`Parse errors: ${parseErrors.map(e => e.message).join(', ')}`);
    if (!ast) throw new Error('No AST produced');
    return ast;
}

// ============================================
// PARSER TESTS
// ============================================

describe('Step 3: Optional source alias — Parser', () => {

    it('parses mapping without alias (backward compat)', () => {
        const ast = parse(`${HEADER}Person -> Human {\n  name := name\n}`);
        const m = ast.mappings[0];
        expect(m.sourceClass).toBe('Person');
        expect(m.sourceAlias).toBeUndefined();
        expect(m.targetClass).toBe('Human');
    });

    it('parses mapping with alias', () => {
        const ast = parse(`${HEADER}Person p -> Human {\n  name := p.name\n}`);
        const m = ast.mappings[0];
        expect(m.sourceClass).toBe('Person');
        expect(m.sourceAlias).toBe('p');
        expect(m.targetClass).toBe('Human');
    });

    it('parses alias with where condition', () => {
        const ast = parse(`${HEADER}Person p -> Human where not p.abstract {\n  name := p.name\n}`);
        const m = ast.mappings[0];
        expect(m.sourceClass).toBe('Person');
        expect(m.sourceAlias).toBe('p');
        expect(m.condition).toBeDefined();
    });

    it('body expression uses alias', () => {
        const ast = parse(`${HEADER}Person p -> Human {\n  label := p.name\n}`);
        const m = ast.mappings[0];
        expect(m.sourceAlias).toBe('p');
        expect(m.body.length).toBe(1);
    });

    it('multiple mappings with and without alias', () => {
        const src = `${HEADER}A -> B {\n  x := x\n}\nC c -> D {\n  y := c.y\n}`;
        const ast = parse(src);
        expect(ast.mappings[0].sourceAlias).toBeUndefined();
        expect(ast.mappings[1].sourceAlias).toBe('c');
    });
});

// ============================================
// EXECUTOR TESTS
// ============================================

describe('Step 3: Optional source alias — Executor', () => {

    it('alias is available in body expression', () => {
        const src = `${HEADER}Person p -> Human {\n  label := p.name\n}`;
        const ast = parse(src);
        const executor = new JjtlExecutor(ast);
        const result = executor.execute([{ className: 'Person', name: 'Alice' }]);
        expect(result.success).toBe(true);
        const humans = result.targetModel!.instances.get('Human')!;
        expect(humans[0].label).toBe('Alice');
    });

    it('alias works alongside implicit context (name still accessible without alias)', () => {
        const src = `${HEADER}Person p -> Human {\n  label := name\n}`;
        const ast = parse(src);
        const executor = new JjtlExecutor(ast);
        const result = executor.execute([{ className: 'Person', name: 'Bob' }]);
        expect(result.success).toBe(true);
        const humans = result.targetModel!.instances.get('Human')!;
        expect(humans[0].label).toBe('Bob');
    });

    it('alias filters via where condition', () => {
        const src = `${HEADER}Person p -> Human where not p.abstract {\n  label := p.name\n}`;
        const ast = parse(src);
        const executor = new JjtlExecutor(ast);
        const result = executor.execute([
            { className: 'Person', name: 'Alice', abstract: false },
            { className: 'Person', name: 'Abstract', abstract: true },
        ]);
        expect(result.success).toBe(true);
        const humans = result.targetModel!.instances.get('Human') ?? [];
        expect(humans.length).toBe(1);
        expect(humans[0].label).toBe('Alice');
    });

    it('alias expression with member access', () => {
        const src = `${HEADER}Person p -> Human {\n  label := p.name\n  fullName := p.firstName\n}`;
        const ast = parse(src);
        const executor = new JjtlExecutor(ast);
        const result = executor.execute([{ className: 'Person', name: 'Smith', firstName: 'John' }]);
        expect(result.success).toBe(true);
        const humans = result.targetModel!.instances.get('Human')!;
        expect(humans[0].label).toBe('Smith');
        expect(humans[0].fullName).toBe('John');
    });
});
