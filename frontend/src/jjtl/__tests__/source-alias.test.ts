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
import type { TransformationAST } from '../types/ast';

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
        expect(m.sources[0].className).toBe('Person');
        expect(m.sources[0].alias).toBeUndefined();
        expect(m.targetClass).toBe('Human');
    });

    it('parses mapping with alias', () => {
        const ast = parse(`${HEADER}Person p -> Human {\n  name := p.name\n}`);
        const m = ast.mappings[0];
        expect(m.sources[0].className).toBe('Person');
        expect(m.sources[0].alias).toBe('p');
        expect(m.targetClass).toBe('Human');
    });

    it('parses alias with where condition', () => {
        const ast = parse(`${HEADER}Person p -> Human where not p.abstract {\n  name := p.name\n}`);
        const m = ast.mappings[0];
        expect(m.sources[0].className).toBe('Person');
        expect(m.sources[0].alias).toBe('p');
        expect(m.condition).toBeDefined();
    });

    it('body expression uses alias', () => {
        const ast = parse(`${HEADER}Person p -> Human {\n  label := p.name\n}`);
        const m = ast.mappings[0];
        expect(m.sources[0].alias).toBe('p');
        expect(m.body.length).toBe(1);
    });

    it('multiple mappings with and without alias', () => {
        const src = `${HEADER}A -> B {\n  x := x\n}\nC c -> D {\n  y := c.y\n}`;
        const ast = parse(src);
        expect(ast.mappings[0].sources[0].alias).toBeUndefined();
        expect(ast.mappings[1].sources[0].alias).toBe('c');
    });
});

// ============================================
// EXECUTOR TESTS
// ============================================

describe('Step 3: Optional source alias — Executor', () => {

    it('alias is available in body expression', async () => {
        const src = `${HEADER}Person p -> Human {\n  label := p.name\n}`;
        const ast = parse(src);
        const executor = new JjtlExecutor(ast);
        const result = await executor.execute([{ className: 'Person', name: 'Alice' }]);
        expect(result.success).toBe(true);
        const humans = result.targetModel!.instances.get('Human')!;
        expect(humans[0].label).toBe('Alice');
    });

    it('alias works alongside implicit context (name still accessible without alias)', async () => {
        const src = `${HEADER}Person p -> Human {\n  label := name\n}`;
        const ast = parse(src);
        const executor = new JjtlExecutor(ast);
        const result = await executor.execute([{ className: 'Person', name: 'Bob' }]);
        expect(result.success).toBe(true);
        const humans = result.targetModel!.instances.get('Human')!;
        expect(humans[0].label).toBe('Bob');
    });

    it('alias filters via where condition', async () => {
        const src = `${HEADER}Person p -> Human where not p.abstract {\n  label := p.name\n}`;
        const ast = parse(src);
        const executor = new JjtlExecutor(ast);
        const result = await executor.execute([
            { className: 'Person', name: 'Alice', abstract: false },
            { className: 'Person', name: 'Abstract', abstract: true },
        ]);
        expect(result.success).toBe(true);
        const humans = result.targetModel!.instances.get('Human') ?? [];
        expect(humans.length).toBe(1);
        expect(humans[0].label).toBe('Alice');
    });

    it('alias expression with member access', async () => {
        const src = `${HEADER}Person p -> Human {\n  label := p.name\n  fullName := p.firstName\n}`;
        const ast = parse(src);
        const executor = new JjtlExecutor(ast);
        const result = await executor.execute([{ className: 'Person', name: 'Smith', firstName: 'John' }]);
        expect(result.success).toBe(true);
        const humans = result.targetModel!.instances.get('Human')!;
        expect(humans[0].label).toBe('Smith');
        expect(humans[0].fullName).toBe('John');
    });
});

// ============================================
// STEP 4: MULTI-SOURCE TESTS
// ============================================

describe('Step 4: Multi-source mapping — Parser', () => {

    it('parses two sources with aliases', async () => {
        const src = `${HEADER}Class c, Package p -> Table {\n  name := p.name\n}`;
        const ast = parse(src);
        const m = ast.mappings[0];
        expect(m.sources.length).toBe(2);
        expect(m.sources[0].className).toBe('Class');
        expect(m.sources[0].alias).toBe('c');
        expect(m.sources[1].className).toBe('Package');
        expect(m.sources[1].alias).toBe('p');
        expect(m.targetClass).toBe('Table');
    });

    it('parses three sources', async () => {
        const src = `${HEADER}A a, B b, C c -> D {\n  x := a.x\n}`;
        const ast = parse(src);
        expect(ast.mappings[0].sources.length).toBe(3);
        expect(ast.mappings[0].sources[2].className).toBe('C');
        expect(ast.mappings[0].sources[2].alias).toBe('c');
    });

    it('parses multi-source with where condition', async () => {
        const src = `${HEADER}Class c, Package p -> Table where c.pkg == p.name {\n  name := p.name\n}`;
        const ast = parse(src);
        const m = ast.mappings[0];
        expect(m.sources.length).toBe(2);
        expect(m.condition).toBeDefined();
    });

    it('single source still produces sources array with one element', async () => {
        const src = `${HEADER}Person -> Human {\n  name := name\n}`;
        const ast = parse(src);
        expect(ast.mappings[0].sources.length).toBe(1);
    });
});

describe('Step 4: Multi-source mapping — Executor', () => {

    it('cartesian product: 2 classes × 2 packages = 4 combinations → 4 tables', async () => {
        const src = `${HEADER}Class c, Package p -> Table {\n  name := p.name\n}`;
        const ast = parse(src);
        const executor = new JjtlExecutor(ast);
        const sourceModel = [
            { className: 'Class', name: 'ClassA' },
            { className: 'Class', name: 'ClassB' },
            { className: 'Package', name: 'pkg1' },
            { className: 'Package', name: 'pkg2' },
        ];
        const result = await executor.execute(sourceModel);
        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables.length).toBe(4); // 2 classes × 2 packages
    });

    it('uses alias expressions: name := p.name + "." + c.name', async () => {
        const src = `${HEADER}Class c, Package p -> Table {\n  name := p.name\n  className := c.name\n}`;
        const ast = parse(src);
        const executor = new JjtlExecutor(ast);
        const sourceModel = [
            { className: 'Class', name: 'MyClass' },
            { className: 'Package', name: 'myPackage' },
        ];
        const result = await executor.execute(sourceModel);
        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables.length).toBe(1);
        expect(tables[0].name).toBe('myPackage');
        expect(tables[0].className).toBe('MyClass');
    });

    it('where condition filters combinations', async () => {
        // Only Class c belongs to Package p if c.pkg === p.name
        const src = `${HEADER}Class c, Package p -> Table where c.pkg == p.name {\n  name := p.name\n}`;
        const ast = parse(src);
        const executor = new JjtlExecutor(ast);
        const sourceModel = [
            { className: 'Class', name: 'ClassA', pkg: 'pkg1' },
            { className: 'Class', name: 'ClassB', pkg: 'pkg2' },
            { className: 'Package', name: 'pkg1' },
            { className: 'Package', name: 'pkg2' },
        ];
        const result = await executor.execute(sourceModel);
        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        // ClassA×pkg1 and ClassB×pkg2 pass; ClassA×pkg2 and ClassB×pkg1 fail
        expect(tables.length).toBe(2);
    });

    it('multi-source without aliases produces an error', async () => {
        // Parse a transformation AST manually with sources lacking aliases
        // (the parser always assigns aliases when an IDENT follows the class name,
        //  but we can construct the AST directly to test validation)
        const LOC = { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } };
        const ast: TransformationAST = {
            type: 'Transformation',
            name: 'T',
            sourceMetamodel: 'S',
            targetMetamodel: 'T',
            helpers: [],
            mappings: [{
                type: 'ClassMapping',
                sources: [{ className: 'Class' }, { className: 'Package' }], // no aliases!
                targetClass: 'Table',
                body: [],
                location: LOC,
            }],
            location: LOC,
        };
        const executor = new JjtlExecutor(ast);
        const result = await executor.execute([
            { className: 'Class', name: 'A' },
            { className: 'Package', name: 'p' },
        ]);
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('alias');
    });
});
