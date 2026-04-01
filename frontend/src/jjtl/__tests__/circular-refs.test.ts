import { describe, it, test, expect } from 'vitest';
/**
 * Circular Reference Tests
 *
 * Verifies that the JjTL executor does NOT freeze when source models contain
 * circular references (common in L-layer proxies where LClass.attributes[0].owner
 * points back to the LClass).
 */

import { JjtlExecutor } from '../executor/executor';
import type { TransformationAST, ClassMappingAST, AttributeMappingAST } from '../types/ast';

const LOC = { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } };

function makeTransformation(mappings: ClassMappingAST[]): TransformationAST {
    return {
        type: 'Transformation',
        name: 'CircularTest',
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
    body: AttributeMappingAST[]
): ClassMappingAST {
    return {
        type: 'ClassMapping',
        sources: [{ className: sourceClass }],
        targetClass,
        body,
        location: LOC,
    };
}

function makeAttrMapping(
    sourceAttribute: string | undefined,
    targetAttribute: string,
    conversion?: any
): AttributeMappingAST {
    return {
        type: 'AttributeMapping',
        sourceAttribute,
        targetAttribute,
        conversion,
        location: LOC,
    };
}

describe('Circular reference safety', () => {

    it('handles source model with circular references without freezing', async () => {
        // Simulate L-layer circular refs: Class → attributes → Attribute → owner → Class
        const classA: any = {
            className: 'EClass',
            name: 'Person',
            isAbstract: false,
            attributes: [],
        };
        const attr1: any = {
            className: 'EAttribute',
            name: 'firstName',
            type: 'String',
            owner: classA,  // CIRCULAR: back-reference to parent class
        };
        const attr2: any = {
            className: 'EAttribute',
            name: 'age',
            type: 'Integer',
            owner: classA,  // CIRCULAR
        };
        classA.attributes.push(attr1, attr2);

        const ast = makeTransformation([
            makeClassMapping('EClass', 'Table', [
                makeAttrMapping('name', 'tableName'),
            ]),
        ]);

        const executor = new JjtlExecutor(ast);

        // This must complete without freezing (< 5 seconds)
        const start = Date.now();
        const result = await executor.execute([classA]);
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(5000);
        expect(result.success).toBe(true);
        expect(result.targetModel).toBeDefined();

        const tables = result.targetModel!.instances.get('Table');
        expect(tables).toBeDefined();
        expect(tables!.length).toBe(1);
        expect(tables![0].tableName).toBe('Person');
    });

    it('handles deeply nested circular references', async () => {
        // Class → superClass → subClasses → [Class] (cycle)
        const parentClass: any = {
            className: 'EClass',
            name: 'Animal',
            isAbstract: true,
            subClasses: [],
            superClass: null,
            attributes: [],
        };
        const childClass: any = {
            className: 'EClass',
            name: 'Dog',
            isAbstract: false,
            subClasses: [],
            superClass: parentClass,  // CIRCULAR: references parent
            attributes: [],
        };
        parentClass.subClasses.push(childClass);  // CIRCULAR: parent references child

        const ast = makeTransformation([
            makeClassMapping('EClass', 'Table', [
                makeAttrMapping('name', 'tableName'),
            ]),
        ]);

        const executor = new JjtlExecutor(ast);
        const result = await executor.execute([parentClass, childClass]);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table');
        expect(tables!.length).toBe(2);
    });

    it('handles self-referencing objects', async () => {
        const selfRef: any = {
            className: 'Node',
            name: 'Root',
        };
        selfRef.parent = selfRef;  // Self-reference

        const ast = makeTransformation([
            makeClassMapping('Node', 'FlatNode', [
                makeAttrMapping('name', 'label'),
            ]),
        ]);

        const executor = new JjtlExecutor(ast);
        const result = await executor.execute([selfRef]);

        expect(result.success).toBe(true);
        const nodes = result.targetModel!.instances.get('FlatNode');
        expect(nodes!.length).toBe(1);
        expect(nodes![0].label).toBe('Root');
    });

    it('handles circular refs in conversion expressions', async () => {
        const classA: any = {
            className: 'EClass',
            name: 'person',
            attributes: [],
        };
        const attr: any = { name: 'age', owner: classA };
        classA.attributes.push(attr);

        const ast = makeTransformation([
            makeClassMapping('EClass', 'Table', [
                makeAttrMapping(undefined, 'tableName', {
                    type: 'Conversion',
                    expression: {
                        type: 'Identifier',
                        name: 'name',
                        location: LOC,
                    },
                    location: LOC,
                }),
            ]),
        ]);

        const executor = new JjtlExecutor(ast);
        const result = await executor.execute([classA]);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table');
        expect(tables![0].tableName).toBe('person');
    });
});
