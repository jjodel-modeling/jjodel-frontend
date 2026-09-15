import { describe, it, test, expect } from 'vitest';
/**
 * JjEL Parser Tests
 */

import { parseExpression } from '../parser';
import { JjelExpression } from '../types';

function parse(src: string): JjelExpression {
    const result = parseExpression(src);
    if (result.errors.length > 0) {
        throw new Error(result.errors[0].message);
    }
    if (!result.expression) throw new Error('No expression produced');
    return result.expression;
}

function parseOk(src: string): void {
    parse(src);
}

function parseFails(src: string): void {
    const result = parseExpression(src);
    if (result.errors.length === 0 && result.expression !== null) {
        throw new Error(`Expected parse failure for: ${src}`);
    }
}

// ============================================================
// REGRESSION: existing constructs
// ============================================================

describe('Literals', () => {
    test('integer', () => { expect(parse('42')).toMatchObject({ type: 'Literal', value: 42 }); });
    test('string', () => { expect(parse('"hello"')).toMatchObject({ type: 'Literal', value: 'hello' }); });
    test('true', () => { expect(parse('true')).toMatchObject({ type: 'Literal', value: true }); });
    test('false', () => { expect(parse('false')).toMatchObject({ type: 'Literal', value: false }); });
    test('null', () => { expect(parse('null')).toMatchObject({ type: 'Literal', value: null }); });
    test('decimal', () => { expect(parse('3.14')).toMatchObject({ type: 'Literal', dataType: 'EDouble' }); });
});

describe('Identifiers', () => {
    test('simple', () => { expect(parse('name')).toMatchObject({ type: 'Identifier', name: 'name' }); });
    test('underscore', () => { expect(parse('_x')).toMatchObject({ type: 'Identifier', name: '_x' }); });
});

describe('Dollar identifiers ($variable)', () => {
    test('simple $name', () => { expect(parse('$name')).toMatchObject({ type: 'Identifier', name: '$name' }); });
    test('$prefix in binary expression', () => {
        const ast = parse('$prefix + ".tbl"');
        expect(ast).toMatchObject({ type: 'Binary', operator: '+' });
        expect((ast as any).left).toMatchObject({ type: 'Identifier', name: '$prefix' });
    });
    test('$var with underscore and digits', () => { expect(parse('$my_var2')).toMatchObject({ type: 'Identifier', name: '$my_var2' }); });
    test('bare $ fails', () => { parseFails('$ + 1'); });
});

describe('Member access', () => {
    test('dot access', () => { expect(parse('a.b')).toMatchObject({ type: 'MemberAccess', property: 'b' }); });
    test('chain', () => { expect(parse('a.b.c')).toMatchObject({ type: 'MemberAccess', property: 'c' }); });
    test('null-safe', () => { expect(parse('a?.b')).toMatchObject({ type: 'NullSafeMemberAccess' }); });
});

describe('Method calls', () => {
    test('no args', () => { expect(parse('a.toUpper()')).toMatchObject({ type: 'MethodCall', method: 'toUpper' }); });
    test('with args', () => { expect(parse('a.substring(1, 3)')).toMatchObject({ type: 'MethodCall', method: 'substring' }); });
    test('null-safe call', () => { expect(parse('a?.toUpper()')).toMatchObject({ type: 'NullSafeMethodCall' }); });
});

describe('Arithmetic', () => {
    test('a + b', () => { expect(parse('a + b')).toMatchObject({ type: 'Binary', operator: '+' }); });
    test('precedence: a + b * c', () => {
        const ast = parse('a + b * c') as any;
        expect(ast.operator).toBe('+');
        expect(ast.right.operator).toBe('*');
    });
    test('unary minus', () => { expect(parse('-x')).toMatchObject({ type: 'Unary', operator: '-' }); });
});

describe('Logical operators', () => {
    test('and', () => { expect(parse('a and b')).toMatchObject({ type: 'Binary', operator: 'and' }); });
    test('or', () => { expect(parse('a or b')).toMatchObject({ type: 'Binary', operator: 'or' }); });
    test('not', () => { expect(parse('not a')).toMatchObject({ type: 'Unary', operator: 'not' }); });
});

describe('Comparisons', () => {
    test('==', () => { expect(parse('a == b')).toMatchObject({ type: 'Binary', operator: '==' }); });
    test('!=', () => { expect(parse('a != b')).toMatchObject({ type: 'Binary', operator: '!=' }); });
    test('<', () => { expect(parse('a < b')).toMatchObject({ type: 'Binary', operator: '<' }); });
    test('>=', () => { expect(parse('a >= b')).toMatchObject({ type: 'Binary', operator: '>=' }); });
});

describe('Null-safe operators', () => {
    test('??', () => { expect(parse('a ?? b')).toMatchObject({ type: 'NullCoalesce' }); });
});

describe('If/then/else', () => {
    test('with else', () => { expect(parse('if a then b else c')).toMatchObject({ type: 'IfThenElse' }); });
    test('without else', () => { expect((parse('if a then b') as any).elseBranch).toBeNull(); });
});

describe('Is type check', () => {
    test('x is String', () => { expect(parse('x is String')).toMatchObject({ type: 'IsType', targetType: 'String' }); });
});

describe('Array literal', () => {
    test('empty', () => { expect(parse('[]')).toMatchObject({ type: 'ArrayLiteral', elements: [] }); });
    test('non-empty', () => { expect((parse('[1, 2, 3]') as any).elements).toHaveLength(3); });
});

describe('Parenthesized expression', () => {
    test('(a + b) * c', () => { expect(parse('(a + b) * c')).toMatchObject({ type: 'Binary', operator: '*' }); });
});

// ============================================================
// LAMBDA — BREAKING CHANGE: => instead of :
// ============================================================

describe('Lambda (=> separator)', () => {
    test('single param', () => {
        const ast = parse('x => x.name') as any;
        expect(ast.type).toBe('Lambda');
        expect(ast.params).toEqual(['x']);
    });

    test('multi param', () => {
        const ast = parse('(a, b) => a + b') as any;
        expect(ast.type).toBe('Lambda');
        expect(ast.params).toEqual(['a', 'b']);
    });

    test('lambda in method arg', () => {
        const ast = parse('items.sortBy(x => x.name)') as any;
        expect(ast.type).toBe('MethodCall');
        expect(ast.args[0].type).toBe('Lambda');
    });

    test('lambda body is full expression', () => {
        const ast = parse('a => a.name == "test" and a.isPublic') as any;
        expect(ast.type).toBe('Lambda');
        expect(ast.body.type).toBe('Binary');
        expect(ast.body.operator).toBe('and');
    });

    test('old colon syntax rejected at top level', () => {
        // "x: expr" should NOT parse as a lambda; colon is a forall separator now
        // At the top level, "x" followed by ":" would stop (colon not consumed in expression context)
        // This test confirms x parses as bare identifier (colon causes parse to stop or error)
        const result = parseExpression('x: x.name');
        // It parses "x" as identifier and stops — no error thrown but stops before ":"
        expect(result.expression).toMatchObject({ type: 'Identifier', name: 'x' });
    });
});

// ============================================================
// NEW: -- LINE COMMENTS
// ============================================================

describe('Line comments (--)', () => {
    test('expression followed by comment', () => {
        expect(parse('42 -- this is a comment')).toMatchObject({ type: 'Literal', value: 42 });
    });

    test('comment on its own line (blank expression)', () => {
        const result = parseExpression('-- just a comment');
        // Lexer skips the comment; parser sees only EOF — returns null expression, no errors
        expect(result.errors).toHaveLength(0);
    });

    test('-- does not affect prior expression', () => {
        expect(parse('name.toUpper() -- returns uppercase')).toMatchObject({ type: 'MethodCall' });
    });

    test('does not confuse with minus', () => {
        // a - b is subtraction; -- starts a comment only when it follows whitespace/start-of-token
        expect(parse('a - b')).toMatchObject({ type: 'Binary', operator: '-' });
    });
});

// ============================================================
// NEW: IMPLIES
// ============================================================

describe('implies', () => {
    test('simple', () => {
        expect(parse('isAbstract implies subClasses.isNotEmpty')).toMatchObject({ type: 'Implies' });
    });

    test('right-associative: a implies b implies c', () => {
        const ast = parse('a implies b implies c') as any;
        expect(ast.type).toBe('Implies');
        expect(ast.right.type).toBe('Implies'); // right-assoc
    });

    test('lower precedence than or: a or b implies c = (a or b) implies c', () => {
        const ast = parse('a or b implies c') as any;
        expect(ast.type).toBe('Implies');
        expect(ast.left.type).toBe('Binary');
        expect(ast.left.operator).toBe('or');
    });

    test('?? lower precedence than implies: a ?? b implies c = a ?? (b implies c)', () => {
        const ast = parse('a ?? b implies c') as any;
        expect(ast.type).toBe('NullCoalesce');
        expect(ast.right.type).toBe('Implies');
    });

    test('if/then/else is lowest: if x then a implies b else c', () => {
        expect(parse('if x then a implies b else c')).toMatchObject({ type: 'IfThenElse' });
    });
});

// ============================================================
// NEW: FORALL
// ============================================================

describe('forall', () => {
    test('projection only (:)', () => {
        const ast = parse('forall a in attrs : a.name') as any;
        expect(ast.type).toBe('ForAll');
        expect(ast.variable).toBe('a');
        expect(ast.filter).toBeUndefined();
        expect(ast.projection).toBeDefined();
    });

    test('filter only (such that)', () => {
        const ast = parse('forall a in attrs such that a.isPublic') as any;
        expect(ast.type).toBe('ForAll');
        expect(ast.filter).toBeDefined();
        expect(ast.projection).toBeUndefined();
    });

    test('filter + projection', () => {
        const ast = parse('forall a in attrs such that a.isPublic : a.name') as any;
        expect(ast.type).toBe('ForAll');
        expect(ast.filter).toBeDefined();
        expect(ast.projection).toBeDefined();
    });

    test('rejects forall without filter or projection', () => {
        expect(() => parse('forall a in attrs')).toThrow();
    });

    test('nested forall', () => {
        expect(parse('forall c in classes : forall a in c.attrs : a.name')).toMatchObject({ type: 'ForAll' });
    });

    test('collection is a method chain', () => {
        parseOk('forall a in attrs.filter(x => x.valid) such that a.isPublic : a.name');
    });

    test('complex filter with and/not', () => {
        parseOk('forall a in attrs such that a.isPublic and not a.isDerived : a.name');
    });

    test('array literal as collection', () => {
        expect(parse('forall x in [1,2,3] : x + 1')).toMatchObject({ type: 'ForAll' });
    });
});

// ============================================================
// NEW: EXISTS
// ============================================================

describe('exists', () => {
    test('pipe separator', () => {
        const ast = parse('exists a in attrs | a.type == "String"') as any;
        expect(ast.type).toBe('Exists');
        expect(ast.variable).toBe('a');
    });

    test('colon separator is rejected', () => {
        expect(() => parse('exists a in attrs : a.type == "String"')).toThrow();
    });

    test('such that separator', () => {
        const ast = parse('exists a in attrs such that a.isPublic') as any;
        expect(ast.type).toBe('Exists');
    });

    test('rejects exists without separator', () => {
        expect(() => parse('exists a in attrs')).toThrow();
    });
});

// ============================================================
// NEW: WITH...DO
// ============================================================

describe('with...do', () => {
    test('simple', () => {
        expect(parse('with parent do name')).toMatchObject({ type: 'WithDo' });
    });

    test('complex body', () => {
        parseOk('with superClass do forall a in attrs : a.name');
    });

    test('method chain context', () => {
        parseOk('with parent?.container do name.pascalCase()');
    });
});

// ============================================================
// NEW: ARRAY INDEXING
// ============================================================

describe('array indexing [i]', () => {
    test('simple index', () => {
        const ast = parse('arr[0]') as any;
        expect(ast.type).toBe('IndexAccess');
        expect(ast.index).toMatchObject({ type: 'Literal', value: 0 });
    });

    test('chained index', () => {
        const ast = parse('matrix[0][1]') as any;
        expect(ast.type).toBe('IndexAccess');
        expect(ast.object.type).toBe('IndexAccess');
    });

    test('expression index', () => {
        parseOk('arr[i + 1]');
    });

    test('index after method call', () => {
        const ast = parse('items.sortBy(x => x.name)[0]') as any;
        expect(ast.type).toBe('IndexAccess');
        expect(ast.object.type).toBe('MethodCall');
    });
});

// ============================================================
// REAL-WORLD EXPRESSIONS
// ============================================================

describe('real-world expressions', () => {
    test('validation: abstract implies has subclasses', () => {
        parseOk('isAbstract implies subClasses.isNotEmpty');
    });

    test('null-safe with coalesce', () => {
        parseOk('parent?.name ?? "no parent"');
    });

    test('forall with method chain', () => {
        parseOk('forall a in attributes such that a.isPublic : a.name.camelCase()');
    });

    test('exists with nested navigation', () => {
        parseOk('exists a in attributes such that a.type.name == "String"');
    });

    test('complex: forall + implies + null-safe', () => {
        parseOk('isAbstract implies subClasses?.isNotEmpty');
    });
});

// ============================================================
// NEW: OBJECT LITERALS
// ============================================================

describe('object literals', () => {
    test('empty object', () => {
        const ast = parse('{}') as any;
        expect(ast.type).toBe('ObjectLiteral');
        expect(ast.entries).toEqual([]);
    });

    test('single entry with identifier key', () => {
        const ast = parse('{name: "hello"}') as any;
        expect(ast.type).toBe('ObjectLiteral');
        expect(ast.entries).toHaveLength(1);
        expect(ast.entries[0].key).toBe('name');
        expect(ast.entries[0].value).toMatchObject({ type: 'Literal', value: 'hello' });
    });

    test('multiple entries', () => {
        const ast = parse('{name: "hello", count: 42}') as any;
        expect(ast.type).toBe('ObjectLiteral');
        expect(ast.entries).toHaveLength(2);
        expect(ast.entries[0].key).toBe('name');
        expect(ast.entries[1].key).toBe('count');
    });

    test('string keys', () => {
        const ast = parse('{"my-key": "value"}') as any;
        expect(ast.type).toBe('ObjectLiteral');
        expect(ast.entries[0].key).toBe('my-key');
    });

    test('expression values', () => {
        const ast = parse('{sum: 1 + 2, neg: not true}') as any;
        expect(ast.type).toBe('ObjectLiteral');
        expect(ast.entries[0].value.type).toBe('Binary');
        expect(ast.entries[1].value.type).toBe('Unary');
    });

    test('nested object', () => {
        const ast = parse('{outer: {inner: 1}}') as any;
        expect(ast.type).toBe('ObjectLiteral');
        expect(ast.entries[0].value.type).toBe('ObjectLiteral');
    });

    test('dot access on object literal', () => {
        const ast = parse('{name: "hello"}.name') as any;
        expect(ast.type).toBe('MemberAccess');
        expect(ast.object.type).toBe('ObjectLiteral');
        expect(ast.property).toBe('name');
    });

    test('index access on object literal', () => {
        const ast = parse('{"my-key": 1}["my-key"]') as any;
        expect(ast.type).toBe('IndexAccess');
        expect(ast.object.type).toBe('ObjectLiteral');
    });

    test('object in array', () => {
        const ast = parse('[{a: 1}, {a: 2}]') as any;
        expect(ast.type).toBe('ArrayLiteral');
        expect(ast.elements[0].type).toBe('ObjectLiteral');
        expect(ast.elements[1].type).toBe('ObjectLiteral');
    });

    test('object with member access value', () => {
        parseOk('{cls: c.name, attr: a.name}');
    });

    test('object as forall projection', () => {
        parseOk('forall c in classes : {name: c.name}');
    });
});

// ============================================================
// UNSUPPORTED SYNTAX — helpful error messages
// ============================================================

describe('unsupported syntax errors', () => {
    test('ternary ?: produces helpful error', () => {
        const result = parseExpression('gender == "Male" ? "Male" : "Female"');
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain("Ternary operator '?:'");
        expect(result.errors[0].message).toContain('if condition then value1 else value2');
    });

    test('=== produces helpful error', () => {
        const result = parseExpression('a === b');
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain("Strict equality '==='");
        expect(result.errors[0].message).toContain("Use '=='");
    });

    test('?. still works', () => {
        parseOk('parent?.name');
    });

    test('?? still works', () => {
        parseOk('parent?.name ?? "none"');
    });

    test('== still works', () => {
        parseOk('a == b');
    });
});

// ============================================================
// OCL-isms produce specific helpful errors (stadio 6.8)
// ============================================================

describe('OCL-isms produce helpful errors', () => {
    test('-> arrow produces specific error', () => {
        const result = parseExpression('self.segments->size()');
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain("JjEL uses '.'");
        expect(result.errors[0].message).toContain("'->'");
    });

    test('-> on collection literal also caught', () => {
        const result = parseExpression('[1,2,3]->first()');
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain("'->'");
    });

    test('Set{...} collection constructor produces specific error', () => {
        const result = parseExpression('Set{1, 2, 3}');
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain("'[...]'");
        expect(result.errors[0].message).toContain('Set/Sequence/Bag/OrderedSet');
    });

    test('Sequence{...} also caught', () => {
        const result = parseExpression('Sequence{1, 2, 3}');
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain("'[...]'");
    });

    test('oclIsTypeOf produces specific error', () => {
        const result = parseExpression('x.oclIsTypeOf(Y)');
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain("'expr is Type'");
        expect(result.errors[0].message).toContain('oclIsTypeOf');
    });

    test('oclIsKindOf produces specific error', () => {
        const result = parseExpression('x.oclIsKindOf(Y)');
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain('oclIsKindOf');
    });

    test('oclIsUndefined produces specific error', () => {
        const result = parseExpression('x.oclIsUndefined()');
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain("'expr == null'");
        expect(result.errors[0].message).toContain('oclIsUndefined');
    });

    test('oclAsType produces specific error', () => {
        const result = parseExpression('x.oclAsType(Y)');
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain('explicit type casts');
    });
});

// ============================================================
// Regression: valid syntax adjacent to OCL-isms still parses
// ============================================================

describe('OCL-ism regression checks', () => {
    test('subtraction still parses', () => {
        parseOk('a - b');
        parseOk('1 - 2 - 3');
    });

    test('unary minus still parses', () => {
        parseOk('-x');
        parseOk('-(a + b)');
    });

    test('Set as plain identifier still parses (no following brace)', () => {
        parseOk('Set');
    });

    test('member access on Set-named class still parses', () => {
        parseOk('Set.instances');
    });

    test('method call on Set-named class still parses', () => {
        parseOk('Set.instances.size()');
    });

    test('"is" type check still parses', () => {
        parseOk('x is Y');
    });

    test('null comparison still parses', () => {
        parseOk('x == null');
    });

    test('array literal still parses', () => {
        parseOk('[1, 2, 3]');
    });

    test('chained method calls still parse', () => {
        parseOk('self.segments.size()');
        parseOk('a.b.c.d');
    });
});

// ============================================================
// FUNCTION CALLS — standalone builtin/bound invocation
// Added for JjTL cross-type resolution: `targetAttr := resolve(expr, Type)`
// ============================================================

describe('FunctionCall (standalone)', () => {
    test('no-arg call', () => {
        expect(parse('now()')).toMatchObject({
            type: 'FunctionCall',
            name: 'now',
            args: [],
        });
    });

    test('single-arg call', () => {
        expect(parse('resolve(x)')).toMatchObject({
            type: 'FunctionCall',
            name: 'resolve',
            args: [{ type: 'Identifier', name: 'x' }],
        });
    });

    test('resolve with type identifier', () => {
        const ast = parse('resolve(nextState, Place)') as any;
        expect(ast.type).toBe('FunctionCall');
        expect(ast.name).toBe('resolve');
        expect(ast.args).toHaveLength(2);
        expect(ast.args[0]).toMatchObject({ type: 'Identifier', name: 'nextState' });
        expect(ast.args[1]).toMatchObject({ type: 'Identifier', name: 'Place' });
    });

    test('function call with expression args', () => {
        const ast = parse('helper(a + b, c.method())') as any;
        expect(ast.type).toBe('FunctionCall');
        expect(ast.name).toBe('helper');
        expect(ast.args).toHaveLength(2);
        expect(ast.args[0].type).toBe('Binary');
        expect(ast.args[1].type).toBe('MethodCall');
    });

    test('function call result chains into member access', () => {
        const ast = parse('resolve(x).name') as any;
        expect(ast.type).toBe('MemberAccess');
        expect(ast.property).toBe('name');
        expect(ast.object.type).toBe('FunctionCall');
        expect(ast.object.name).toBe('resolve');
    });

    test('function call inside binary expression', () => {
        const ast = parse('resolve(x) ?? defaultValue') as any;
        expect(ast.type).toBe('NullCoalesce');
        expect(ast.left.type).toBe('FunctionCall');
        expect(ast.right.type).toBe('Identifier');
    });
});
