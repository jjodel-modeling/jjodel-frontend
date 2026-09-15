import { describe, it, test, expect } from 'vitest';
/**
 * Executor-Bridge Integration Tests
 *
 * Tests that the JjTL executor correctly delegates expression evaluation
 * to JjEL via the AST bridge. These tests exercise the full pipeline:
 * JjTL AST → astBridge → JjEL evaluator → result
 *
 * Corresponds to the 7 test scenarios from the migration prompt.
 */

import { JjtlExecutor, execute } from '../executor/executor';
import type { TransformationAST, ClassMappingAST, AttributeMappingAST } from '../types/ast';

const LOC = { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } };

function makeTransformation(
    name: string,
    sourceMetamodel: string,
    targetMetamodel: string,
    mappings: ClassMappingAST[]
): TransformationAST {
    return {
        type: 'Transformation',
        name,
        sourceMetamodel,
        targetMetamodel,
        mappings,
        helpers: [],
        location: LOC,
    };
}

function makeClassMapping(
    sourceClass: string,
    targetClass: string,
    body: AttributeMappingAST[],
    condition?: any
): ClassMappingAST {
    return {
        type: 'ClassMapping',
        sources: [{ className: sourceClass }],
        targetClass,
        body,
        condition,
        location: LOC,
    };
}

function makeAttrMapping(
    sourceAttribute: string | undefined,
    targetAttribute: string,
    conversion?: any,
    objectCreation?: any
): AttributeMappingAST {
    return {
        type: 'AttributeMapping',
        sourceAttribute,
        targetAttribute,
        conversion,
        objectCreation,
        location: LOC,
    };
}

// ============================================
// TEST 1: Direct mapping
// ============================================

describe('Test 1: Direct mapping', () => {
    test('name -> tableName copies value', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName'),
            ]),
        ]);

        const source = [{ className: 'Class', name: 'MyClass' }];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables).toHaveLength(1);
        expect(tables[0].tableName).toBe('MyClass');
    });
});

// ============================================
// TEST 2: Expression mapping with JjEL builtins
// ============================================

describe('Test 2: JjEL builtins in expressions', () => {
    test('name.snakeCase() works via JjEL delegation', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName', {
                    type: 'Conversion',
                    expression: {
                        type: 'FunctionCall',
                        callee: {
                            type: 'MemberAccess',
                            object: { type: 'Identifier', name: 'name', location: LOC },
                            property: 'snakeCase',
                            location: LOC,
                        },
                        arguments: [],
                        location: LOC,
                    },
                    location: LOC,
                }),
            ]),
        ]);

        const source = [{ className: 'Class', name: 'MyClassName' }];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables[0].tableName).toBe('my_class_name');
    });

    test('name.camelCase() works via JjEL delegation', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName', {
                    type: 'Conversion',
                    expression: {
                        type: 'FunctionCall',
                        callee: {
                            type: 'MemberAccess',
                            object: { type: 'Identifier', name: 'name', location: LOC },
                            property: 'camelCase',
                            location: LOC,
                        },
                        arguments: [],
                        location: LOC,
                    },
                    location: LOC,
                }),
            ]),
        ]);

        const source = [{ className: 'Class', name: 'my_class_name' }];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables[0].tableName).toBe('myClassName');
    });

    test('name + "_suffix" string concatenation', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName', {
                    type: 'Conversion',
                    expression: {
                        type: 'BinaryExpression',
                        operator: '+',
                        left: { type: 'Identifier', name: 'name', location: LOC },
                        right: { type: 'Literal', value: '_tbl', literalType: 'string', location: LOC },
                        location: LOC,
                    },
                    location: LOC,
                }),
            ]),
        ]);

        const source = [{ className: 'Class', name: 'MyClass' }];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables[0].tableName).toBe('MyClass_tbl');
    });
});

// ============================================
// TEST 3: Value mapping
// ============================================

describe('Test 3: Value mapping', () => {
    test('true=1, false=0', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('State', 'Place', [
                makeAttrMapping('isInitial', 'tokens', {
                    type: 'Conversion',
                    mappings: [
                        {
                            type: 'ValueMapping',
                            sourceValue: { type: 'Literal', value: true, literalType: 'boolean', location: LOC },
                            targetValue: { type: 'Literal', value: 1, literalType: 'number', location: LOC },
                            location: LOC,
                        },
                        {
                            type: 'ValueMapping',
                            sourceValue: { type: 'Literal', value: false, literalType: 'boolean', location: LOC },
                            targetValue: { type: 'Literal', value: 0, literalType: 'number', location: LOC },
                            location: LOC,
                        },
                    ],
                    location: LOC,
                }),
            ]),
        ]);

        const source = [
            { className: 'State', isInitial: true, name: 'S1' },
            { className: 'State', isInitial: false, name: 'S2' },
        ];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        const places = result.targetModel!.instances.get('Place')!;
        expect(places).toHaveLength(2);
        expect(places[0].tokens).toBe(1);
        expect(places[1].tokens).toBe(0);
    });
});

// ============================================
// TEST 4: Guard condition
// ============================================

describe('Test 4: Guard condition', () => {
    test('when not isAbstract skips abstract classes', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName'),
            ], {
                // not isAbstract
                type: 'UnaryExpression',
                operator: 'not',
                operand: { type: 'Identifier', name: 'isAbstract', location: LOC },
                location: LOC,
            }),
        ]);

        const source = [
            { className: 'Class', name: 'ConcreteClass', isAbstract: false },
            { className: 'Class', name: 'AbstractClass', isAbstract: true },
        ];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables).toHaveLength(1);
        expect(tables[0].tableName).toBe('ConcreteClass');
    });
});

// ============================================
// TEST 5: Nested object creation
// ============================================

describe('Test 5: Nested object creation', () => {
    test('creates nested object with attributes', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName'),
                makeAttrMapping(undefined, 'primaryKey', undefined, {
                    type: 'ObjectCreation',
                    targetClass: 'Column',
                    body: [
                        makeAttrMapping(undefined, 'name', {
                            type: 'Conversion',
                            expression: { type: 'Literal', value: 'id', literalType: 'string', location: LOC },
                            location: LOC,
                        }),
                    ],
                    location: LOC,
                }),
            ]),
        ]);

        const source = [{ className: 'Class', name: 'Person' }];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables[0].tableName).toBe('Person');
        expect(tables[0].primaryKey).toEqual({
            __type: 'Column',
            className: 'Column',
            name: 'id',
        });
    });
});

// ============================================
// TEST 6: If/then/else in expression
// ============================================

describe('Test 6: If/then/else in expression', () => {
    test('if isInitial then 1 else 0', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('State', 'Place', [
                makeAttrMapping('isInitial', 'tokens', {
                    type: 'Conversion',
                    expression: {
                        type: 'ConditionalExpression',
                        condition: { type: 'Identifier', name: 'isInitial', location: LOC },
                        thenBranch: { type: 'Literal', value: 1, literalType: 'number', location: LOC },
                        elseBranch: { type: 'Literal', value: 0, literalType: 'number', location: LOC },
                        location: LOC,
                    },
                    location: LOC,
                }),
            ]),
        ]);

        const source = [
            { className: 'State', isInitial: true, name: 'Start' },
            { className: 'State', isInitial: false, name: 'End' },
        ];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        const places = result.targetModel!.instances.get('Place')!;
        expect(places[0].tokens).toBe(1);
        expect(places[1].tokens).toBe(0);
    });
});

// ============================================
// TEST 7: Null-safe navigation
// ============================================

describe('Test 7: Null-safe navigation', () => {
    test('parent?.name ?? "none"', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping(undefined, 'parentName', {
                    type: 'Conversion',
                    expression: {
                        type: 'NullCoalesceExpression',
                        left: {
                            type: 'NullSafeMemberAccess',
                            object: { type: 'Identifier', name: 'parent', location: LOC },
                            property: 'name',
                            location: LOC,
                        },
                        right: { type: 'Literal', value: 'none', literalType: 'string', location: LOC },
                        location: LOC,
                    },
                    location: LOC,
                }),
            ]),
        ]);

        const sourceWithParent = [
            { className: 'Class', name: 'Child', parent: { name: 'Parent' } },
        ];
        const result1 = await execute(ast, sourceWithParent);
        expect(result1.success).toBe(true);
        expect(result1.targetModel!.instances.get('Table')![0].parentName).toBe('Parent');

        const sourceNoParent = [
            { className: 'Class', name: 'Orphan', parent: null },
        ];
        const result2 = await execute(ast, sourceNoParent);
        expect(result2.success).toBe(true);
        expect(result2.targetModel!.instances.get('Table')![0].parentName).toBe('none');
    });
});

// ============================================
// BONUS: Multiple source instances
// ============================================

describe('Multiple source instances', () => {
    test('each source instance produces a separate target', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('State', 'Place', [
                makeAttrMapping('name', 'label'),
            ]),
        ]);

        const source = [
            { className: 'State', name: 'Idle' },
            { className: 'State', name: 'Running' },
            { className: 'State', name: 'Done' },
        ];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        const places = result.targetModel!.instances.get('Place')!;
        expect(places).toHaveLength(3);
        expect(places[0].label).toBe('Idle');
        expect(places[1].label).toBe('Running');
        expect(places[2].label).toBe('Done');
    });
});

// ============================================
// BONUS: Trace model is produced
// ============================================

describe('Trace model', () => {
    test('trace model records bindings', async () => {
        const ast = makeTransformation('SM_to_PN', 'StateMachine', 'PetriNet', [
            makeClassMapping('State', 'Place', [
                makeAttrMapping('name', 'label'),
            ]),
        ]);

        const source = [{ className: 'State', name: 'S1' }];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        expect(result.traceModel).toBeDefined();
        expect(result.traceModel!.transformationName).toBe('SM_to_PN');
        expect(result.traceModel!.links.length).toBeGreaterThan(0);
    });
});

// ============================================
// Falsy value preservation
// ============================================

describe('Falsy value preservation', () => {
    test('if/then/else returning false is preserved', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Person', 'Result', [
                makeAttrMapping(undefined, 'hasLongName', {
                    type: 'Conversion',
                    expression: {
                        type: 'ConditionalExpression',
                        condition: {
                            type: 'BinaryExpression',
                            operator: '>',
                            left: {
                                type: 'MemberAccess',
                                object: { type: 'Identifier', name: 'name', location: LOC },
                                property: 'length',
                                location: LOC,
                            },
                            right: { type: 'Literal', value: 8, literalType: 'number', location: LOC },
                            location: LOC,
                        },
                        thenBranch: { type: 'Literal', value: true, literalType: 'boolean', location: LOC },
                        elseBranch: { type: 'Literal', value: false, literalType: 'boolean', location: LOC },
                        location: LOC,
                    },
                    location: LOC,
                }),
            ]),
        ]);

        const source = [
            { className: 'Person', name: 'Pierantonio' },  // length 12 > 8 → true
            { className: 'Person', name: 'Di Rocco' },     // length 8, NOT > 8 → false
            { className: 'Person', name: 'Bucchiarone' },   // length 11 > 8 → true
        ];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        const results = result.targetModel!.instances.get('Result')!;
        expect(results).toHaveLength(3);
        expect(results[0].hasLongName).toBe(true);
        expect(results[1].hasLongName).toBe(false);  // Must be false, NOT undefined/null
        expect(results[2].hasLongName).toBe(true);
    });

    test('zero is preserved as attribute value', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Item', 'Output', [
                makeAttrMapping(undefined, 'count', {
                    type: 'Conversion',
                    expression: { type: 'Literal', value: 0, literalType: 'number', location: LOC },
                    location: LOC,
                }),
            ]),
        ]);

        const source = [{ className: 'Item', name: 'x' }];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        const outputs = result.targetModel!.instances.get('Output')!;
        expect(outputs[0].count).toBe(0);  // Must be 0, NOT undefined/null
    });

    test('empty string is preserved as attribute value', async () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Item', 'Output', [
                makeAttrMapping(undefined, 'label', {
                    type: 'Conversion',
                    expression: { type: 'Literal', value: '', literalType: 'string', location: LOC },
                    location: LOC,
                }),
            ]),
        ]);

        const source = [{ className: 'Item', name: 'x' }];
        const result = await execute(ast, source);

        expect(result.success).toBe(true);
        const outputs = result.targetModel!.instances.get('Output')!;
        expect(outputs[0].label).toBe('');  // Must be '', NOT undefined/null
    });
});
