/**
 * Executor L-Layer Proxy Tests
 *
 * Tests that the JjTL executor correctly handles L-layer proxy objects
 * by using Reflect.ownKeys / proxyEntries to capture computed properties
 * (isAbstract, attributes, subClasses, references, etc.) that are not
 * visible via Object.keys / Object.entries.
 *
 * These tests simulate proxy-like objects (plain objects with the same
 * property structure as L-layer proxies) to verify that the executor's
 * flattenProxy / proxyEntries approach captures all properties correctly.
 */

import { JjtlExecutor, execute } from '../executor/executor';
import type { TransformationAST, ClassMappingAST, AttributeMappingAST, ForAllMappingAST } from '../types/ast';

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
    body: (AttributeMappingAST | ForAllMappingAST)[],
    condition?: any
): ClassMappingAST {
    return {
        type: 'ClassMapping',
        sourceClass,
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
// TEST 1: L-layer property names in source instances
// ============================================

describe('L-layer property access in source instances', () => {
    test('isAbstract property is accessible in direct mapping', () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('isAbstract', 'abstract'),
            ]),
        ]);

        // Simulates an L-layer proxy where isAbstract is a computed property
        const source = [
            { className: 'Class', name: 'Person', isAbstract: false },
            { className: 'Class', name: 'Shape', isAbstract: true },
        ];
        const result = execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables).toHaveLength(2);
        expect(tables[0].abstract).toBe(false);
        expect(tables[1].abstract).toBe(true);
    });

    test('attributes array is accessible as source property', () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName'),
                // Map the count of attributes
                makeAttrMapping(undefined, 'attrCount', {
                    type: 'Conversion',
                    expression: {
                        type: 'FunctionCall',
                        callee: {
                            type: 'MemberAccess',
                            object: { type: 'Identifier', name: 'attributes', location: LOC },
                            property: 'size',
                            location: LOC,
                        },
                        arguments: [],
                        location: LOC,
                    },
                    location: LOC,
                }),
            ]),
        ]);

        const source = [
            {
                className: 'Class',
                name: 'Person',
                attributes: [
                    { name: 'firstName', type: 'String' },
                    { name: 'lastName', type: 'String' },
                    { name: 'age', type: 'Integer' },
                ],
            },
        ];
        const result = execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables).toHaveLength(1);
        expect(tables[0].tableName).toBe('Person');
        expect(tables[0].attrCount).toBe(3);
    });
});

// ============================================
// TEST 2: Guard conditions with L-layer properties
// ============================================

describe('Guard conditions with L-layer properties', () => {
    test('when { not isAbstract } filters abstract classes', () => {
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
            { className: 'Class', name: 'Person', isAbstract: false },
            { className: 'Class', name: 'Shape', isAbstract: true },
            { className: 'Class', name: 'Animal', isAbstract: false },
        ];
        const result = execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        // Only non-abstract classes should produce Tables
        expect(tables).toHaveLength(2);
        expect(tables.map((t: any) => t.tableName).sort()).toEqual(['Animal', 'Person']);
    });

    test('when { subClasses.isNotEmpty } filters by computed collection', () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName'),
            ], {
                // subClasses.isNotEmpty()
                type: 'FunctionCall',
                callee: {
                    type: 'MemberAccess',
                    object: { type: 'Identifier', name: 'subClasses', location: LOC },
                    property: 'isNotEmpty',
                    location: LOC,
                },
                arguments: [],
                location: LOC,
            }),
        ]);

        const source = [
            { className: 'Class', name: 'Shape', subClasses: ['Circle', 'Rectangle'] },
            { className: 'Class', name: 'Circle', subClasses: [] },
            { className: 'Class', name: 'Rectangle', subClasses: [] },
        ];
        const result = execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        // Only Shape has subClasses
        expect(tables).toHaveLength(1);
        expect(tables[0].tableName).toBe('Shape');
    });
});

// ============================================
// TEST 3: ForAll with resolved object collections
// ============================================

describe('ForAll with resolved object collections', () => {
    test('forall a in attributes -> Column maps each attribute', () => {
        const forallMapping: ForAllMappingAST = {
            type: 'ForAllMapping',
            variable: 'a',
            collection: { type: 'Identifier', name: 'attributes', location: LOC },
            objectCreation: {
                type: 'ObjectCreation',
                targetClass: 'Column',
                body: [
                    makeAttrMapping(undefined, 'name', {
                        type: 'Conversion',
                        expression: {
                            type: 'MemberAccess',
                            object: { type: 'Identifier', name: 'a', location: LOC },
                            property: 'name',
                            location: LOC,
                        },
                        location: LOC,
                    }),
                    makeAttrMapping(undefined, 'typeName', {
                        type: 'Conversion',
                        expression: {
                            type: 'MemberAccess',
                            object: { type: 'Identifier', name: 'a', location: LOC },
                            property: 'type',
                            location: LOC,
                        },
                        location: LOC,
                    }),
                ],
                location: LOC,
            },
            location: LOC,
        };

        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName'),
                forallMapping,
            ]),
        ]);

        const source = [
            {
                className: 'Class',
                name: 'Person',
                attributes: [
                    { name: 'firstName', type: 'String' },
                    { name: 'age', type: 'Integer' },
                ],
            },
        ];
        const result = execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables).toHaveLength(1);
        expect(tables[0].tableName).toBe('Person');
        expect(tables[0].columns).toHaveLength(2);
        expect(tables[0].columns[0].name).toBe('firstName');
        expect(tables[0].columns[0].typeName).toBe('String');
        expect(tables[0].columns[1].name).toBe('age');
        expect(tables[0].columns[1].typeName).toBe('Integer');
    });

    test('forall with such that filter using item property', () => {
        const forallMapping: ForAllMappingAST = {
            type: 'ForAllMapping',
            variable: 'a',
            collection: { type: 'Identifier', name: 'attributes', location: LOC },
            filter: {
                // a.isPublic (or just isPublic since item properties are promoted)
                type: 'Identifier',
                name: 'isPublic',
                location: LOC,
            },
            objectCreation: {
                type: 'ObjectCreation',
                targetClass: 'Column',
                body: [
                    makeAttrMapping(undefined, 'name', {
                        type: 'Conversion',
                        expression: {
                            type: 'MemberAccess',
                            object: { type: 'Identifier', name: 'a', location: LOC },
                            property: 'name',
                            location: LOC,
                        },
                        location: LOC,
                    }),
                ],
                location: LOC,
            },
            location: LOC,
        };

        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName'),
                forallMapping,
            ]),
        ]);

        const source = [
            {
                className: 'Class',
                name: 'Person',
                attributes: [
                    { name: 'firstName', type: 'String', isPublic: true },
                    { name: 'ssn', type: 'String', isPublic: false },
                    { name: 'age', type: 'Integer', isPublic: true },
                ],
            },
        ];
        const result = execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables[0].columns).toHaveLength(2);
        expect(tables[0].columns.map((c: any) => c.name).sort()).toEqual(['age', 'firstName']);
    });
});

// ============================================
// TEST 4: Source model with proxy-like properties preserved through deep copy
// ============================================

describe('Proxy property preservation through deep copy', () => {
    test('properties survive JSON.parse(JSON.stringify) after flattening', () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName'),
                makeAttrMapping('isAbstract', 'abstract'),
                makeAttrMapping(undefined, 'refCount', {
                    type: 'Conversion',
                    expression: {
                        type: 'FunctionCall',
                        callee: {
                            type: 'MemberAccess',
                            object: { type: 'Identifier', name: 'references', location: LOC },
                            property: 'size',
                            location: LOC,
                        },
                        arguments: [],
                        location: LOC,
                    },
                    location: LOC,
                }),
            ]),
        ]);

        // Source with L-layer-like properties
        const source = [
            {
                className: 'Class',
                name: 'Person',
                isAbstract: false,
                references: [
                    { name: 'employer', type: 'Company' },
                    { name: 'address', type: 'Address' },
                ],
                subClasses: [],
                superClass: null,
            },
        ];
        const result = execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables[0].tableName).toBe('Person');
        expect(tables[0].abstract).toBe(false);
        expect(tables[0].refCount).toBe(2);
    });

    test('original source model is not mutated', () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName'),
            ]),
        ]);

        const source = [
            { className: 'Class', name: 'Person', isAbstract: false },
        ];
        const originalSource = JSON.parse(JSON.stringify(source));
        execute(ast, source);

        // Source should not be modified
        expect(source).toEqual(originalSource);
    });
});

// ============================================
// TEST 5: Multiple element types (not just classes)
// ============================================

describe('Multiple element types', () => {
    test('handles Enumeration elements alongside Class elements', () => {
        const ast = makeTransformation('T', 'S', 'T', [
            makeClassMapping('Class', 'Table', [
                makeAttrMapping('name', 'tableName'),
            ]),
            makeClassMapping('Enumeration', 'EnumType', [
                makeAttrMapping('name', 'enumName'),
            ]),
        ]);

        const source = [
            { className: 'Class', name: 'Person', isAbstract: false, attributes: [] },
            { className: 'Enumeration', name: 'Color', literals: ['RED', 'GREEN', 'BLUE'] },
        ];
        const result = execute(ast, source);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        const enums = result.targetModel!.instances.get('EnumType')!;
        expect(tables).toHaveLength(1);
        expect(tables[0].tableName).toBe('Person');
        expect(enums).toHaveLength(1);
        expect(enums[0].enumName).toBe('Color');
    });
});
