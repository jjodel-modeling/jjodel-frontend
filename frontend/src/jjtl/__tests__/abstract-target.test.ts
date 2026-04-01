import { describe, test, expect } from 'vitest';
/**
 * Abstract class target validation tests
 *
 * Verifies that the executor rejects abstract classes as transformation targets
 * and provides helpful error messages with concrete subclass suggestions.
 */

import { execute } from '../executor/executor';
import type { TransformationAST, ClassMappingAST, AttributeMappingAST } from '../types/ast';

const LOC = { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } };

function makeTransformation(
    mappings: ClassMappingAST[]
): TransformationAST {
    return {
        type: 'Transformation',
        name: 'TestTransformation',
        sourceMetamodel: 'Source',
        targetMetamodel: 'Target',
        mappings,
        helpers: [],
        location: LOC,
    };
}

function makeClassMapping(
    sourceClass: string,
    targetClass: string,
    body: any[] = []
): ClassMappingAST {
    return {
        type: 'ClassMapping',
        sources: [{ className: sourceClass }],
        targetClass,
        body,
        location: LOC,
    };
}

// Target metamodel with abstract and concrete classes
const targetMetamodel = [
    {
        id: '1', name: 'Human', type: 'class' as const, isAbstract: true,
        children: [
            { id: '1a', name: 'name', type: 'attribute' as const, dataType: 'String' },
        ],
    },
    {
        id: '2', name: 'Male', type: 'class' as const, isAbstract: false,
        children: [
            { id: '2a', name: 'name', type: 'attribute' as const, dataType: 'String' },
        ],
    },
    {
        id: '3', name: 'Female', type: 'class' as const, isAbstract: false,
        children: [
            { id: '3a', name: 'name', type: 'attribute' as const, dataType: 'String' },
        ],
    },
];

describe('Abstract class target validation', () => {
    test('rejects abstract class as target with concrete suggestions', async () => {
        const ast = makeTransformation([
            makeClassMapping('Person', 'Human'),
        ]);
        const source = [{ className: 'Person', name: 'John' }];
        const result = await execute(ast, source, targetMetamodel);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain("abstract class 'Human'");
        expect(result.errors[0]).toContain('Male');
        expect(result.errors[0]).toContain('Female');
    });

    test('allows concrete class as target', async () => {
        const ast = makeTransformation([
            makeClassMapping('Person', 'Male'),
        ]);
        const source = [{ className: 'Person', name: 'John' }];
        const result = await execute(ast, source, targetMetamodel);

        expect(result.success).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    test('allows concrete class with guard condition', async () => {
        const ast = makeTransformation([
            makeClassMapping('Person', 'Male', [
                {
                    type: 'AttributeMapping',
                    sourceAttribute: 'name',
                    targetAttribute: 'name',
                    location: LOC,
                },
            ]),
        ]);
        const source = [{ className: 'Person', name: 'John' }];
        const result = await execute(ast, source, targetMetamodel);

        expect(result.success).toBe(true);
    });

    test('skips validation when no target metamodel provided', async () => {
        const ast = makeTransformation([
            makeClassMapping('Person', 'Human'),
        ]);
        const source = [{ className: 'Person', name: 'John' }];
        // No targetMetamodel — validation skipped, execution proceeds
        const result = await execute(ast, source);

        // Should not fail due to abstract check (may fail for other reasons or succeed)
        const hasAbstractError = result.errors.some(e => e.includes('abstract'));
        expect(hasAbstractError).toBe(false);
    });

    test('validates object creation targets in forall mappings', async () => {
        const ast = makeTransformation([
            makeClassMapping('Person', 'Male', [
                {
                    type: 'ForAllMapping',
                    variable: 'a',
                    collection: { type: 'Identifier', name: 'attrs', location: LOC },
                    objectCreation: {
                        type: 'ObjectCreation',
                        targetClass: 'Human', // abstract!
                        body: [],
                        location: LOC,
                    },
                    location: LOC,
                },
            ]),
        ]);
        const source = [{ className: 'Person', name: 'John', attrs: [] }];
        const result = await execute(ast, source, targetMetamodel);

        expect(result.success).toBe(false);
        expect(result.errors.some(e => e.includes("abstract class 'Human'"))).toBe(true);
    });
});
