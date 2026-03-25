import { describe, it, expect } from 'vitest';
import { JjtlLexer } from '../lexer/lexer';
import { JjtlParser } from '../parser/parser';
import { JjtlExecutor } from '../executor/executor';
import type { TransformationAST, ForAllMappingAST } from '../types/ast';

// Helper to parse JjTL source into AST
function parseJjtl(source: string): TransformationAST | null {
    const lexer = new JjtlLexer(source.trim());
    const { tokens } = lexer.tokenize();
    const parser = new JjtlParser(tokens);
    const { ast, errors } = parser.parse();
    if (errors.length > 0) {
        console.error('Parse errors:', errors);
    }
    return ast;
}

// Helper to execute a transformation using array-based source model
// (avoids pre-existing duplicate extraction issues with {classes, instances} format)
function executeTransformation(source: string, sourceInstances: any[]) {
    const ast = parseJjtl(source);
    expect(ast).not.toBeNull();
    const executor = new JjtlExecutor(ast!);
    return executor.execute(sourceInstances);
}

describe('JjTL ForAll Mapping', () => {

    describe('Lexer', () => {
        it('tokenizes forall, in, such, that as keywords', () => {
            const lexer = new JjtlLexer('forall x in items such that x.active');
            const { tokens } = lexer.tokenize();

            const types = tokens.map(t => t.type);
            expect(types).toContain('FORALL');
            expect(types).toContain('IN');
            expect(types).toContain('SUCH');
            expect(types).toContain('THAT');
        });
    });

    describe('Parser', () => {
        it('parses forall with filter and object creation', () => {
            const ast = parseJjtl(`
                transformation Test
                from Source
                to Target

                MyClass -> MyTarget {
                    forall a in attributes such that not a.multiValued -> Column {
                        name := a.name
                    }
                }
            `);
            expect(ast).not.toBeNull();
            expect(ast!.mappings).toHaveLength(1);

            const body = ast!.mappings[0].body;
            expect(body).toHaveLength(1);
            expect(body[0].type).toBe('ForAllMapping');

            const forall = body[0] as ForAllMappingAST;
            expect(forall.variable).toBe('a');
            expect(forall.collection.type).toBe('Identifier');
            expect(forall.filter).toBeDefined();
            expect(forall.filter!.type).toBe('UnaryExpression');
            expect(forall.objectCreation.targetClass).toBe('Column');
            expect(forall.objectCreation.body).toHaveLength(1);
        });

        it('parses forall without filter', () => {
            const ast = parseJjtl(`
                transformation Test
                from Source
                to Target

                MyClass -> MyTarget {
                    forall a in attributes -> Column {
                        name := a.name
                    }
                }
            `);
            expect(ast).not.toBeNull();

            const forall = ast!.mappings[0].body[0] as ForAllMappingAST;
            expect(forall.variable).toBe('a');
            expect(forall.filter).toBeUndefined();
            expect(forall.objectCreation.targetClass).toBe('Column');
        });

        it('parses forall with dotted collection expression', () => {
            const ast = parseJjtl(`
                transformation Test
                from Source
                to Target

                MyClass -> MyTarget {
                    forall a in source.attributes -> Column {
                        name := a.name
                    }
                }
            `);
            expect(ast).not.toBeNull();

            const forall = ast!.mappings[0].body[0] as ForAllMappingAST;
            expect(forall.collection.type).toBe('MemberAccess');
        });

        it('parses forall alongside regular attribute mappings', () => {
            const ast = parseJjtl(`
                transformation Test
                from Source
                to Target

                MyClass -> MyTarget {
                    targetName := name
                    forall a in attributes -> Column {
                        name := a.name
                    }
                }
            `);
            expect(ast).not.toBeNull();

            const body = ast!.mappings[0].body;
            expect(body).toHaveLength(2);
            expect(body[0].type).toBe('AttributeMapping');
            expect(body[1].type).toBe('ForAllMapping');
        });
    });

    describe('Executor — basic iteration', () => {
        it('creates one target object per source element', () => {
            const result = executeTransformation(`
                transformation Test
                from Source
                to Target

                MyClass -> MyTarget {
                    forall a in attributes -> Column {
                        name := a.name
                    }
                }
            `, [
                {
                    className: 'MyClass',
                    name: 'obj1',
                    attributes: [
                        { name: 'id' },
                        { name: 'firstName' },
                        { name: 'email' },
                    ],
                },
            ]);

            expect(result.success).toBe(true);
            const targets = result.targetModel!.instances.get('MyTarget');
            expect(targets).toHaveLength(1);

            const target = targets![0];
            expect(target.columns).toHaveLength(3);
            expect(target.columns[0].name).toBe('id');
            expect(target.columns[1].name).toBe('firstName');
            expect(target.columns[2].name).toBe('email');
        });

        it('handles empty collection', () => {
            const result = executeTransformation(`
                transformation Test
                from Source
                to Target

                MyClass -> MyTarget {
                    forall a in attributes -> Column {
                        name := a.name
                    }
                }
            `, [
                {
                    className: 'MyClass',
                    name: 'obj1',
                    attributes: [],
                },
            ]);

            expect(result.success).toBe(true);
            const targets = result.targetModel!.instances.get('MyTarget');
            expect(targets).toHaveLength(1);
            expect(targets![0].columns || []).toHaveLength(0);
        });

        it('handles null collection', () => {
            const result = executeTransformation(`
                transformation Test
                from Source
                to Target

                MyClass -> MyTarget {
                    forall a in attributes -> Column {
                        name := a.name
                    }
                }
            `, [
                {
                    className: 'MyClass',
                    name: 'obj1',
                    attributes: null,
                },
            ]);

            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('Executor — filtering', () => {
        it('filters with such that clause', () => {
            const result = executeTransformation(`
                transformation Test
                from Source
                to Target

                MyClass -> MyTarget {
                    forall a in attributes such that not a.multiValued -> Column {
                        name := a.name
                    }
                }
            `, [
                {
                    className: 'MyClass',
                    name: 'obj1',
                    attributes: [
                        { name: 'id', multiValued: false },
                        { name: 'tags', multiValued: true },
                        { name: 'email', multiValued: false },
                    ],
                },
            ]);

            expect(result.success).toBe(true);
            const target = result.targetModel!.instances.get('MyTarget')![0];
            expect(target.columns).toHaveLength(2);
            expect(target.columns[0].name).toBe('id');
            expect(target.columns[1].name).toBe('email');
        });
    });

    describe('Executor — variable scoping', () => {
        it('forall variable is visible in nested attribute mappings', () => {
            const result = executeTransformation(`
                transformation Test
                from Source
                to Target

                MyClass -> MyTarget {
                    forall a in attributes -> Column {
                        name := a.name
                        dataType := a.type
                    }
                }
            `, [
                {
                    className: 'MyClass',
                    name: 'obj1',
                    attributes: [
                        { name: 'id', type: 'Integer' },
                    ],
                },
            ]);

            expect(result.success).toBe(true);
            const target = result.targetModel!.instances.get('MyTarget')![0];
            expect(target.columns).toHaveLength(1);
            expect(target.columns[0].name).toBe('id');
            expect(target.columns[0].dataType).toBe('Integer');
        });

        it('forall variable is visible in conversion expressions', () => {
            const result = executeTransformation(`
                transformation Test
                from Source
                to Target

                MyClass -> MyTarget {
                    forall a in attributes -> Column {
                        name := a.name + "_col"
                    }
                }
            `, [
                {
                    className: 'MyClass',
                    name: 'obj1',
                    attributes: [
                        { name: 'id' },
                    ],
                },
            ]);

            expect(result.success).toBe(true);
            const target = result.targetModel!.instances.get('MyTarget')![0];
            expect(target.columns[0].name).toBe('id_col');
        });
    });

    describe('Executor — with JjEL builtins', () => {
        it('snakeCase works inside forall', () => {
            const result = executeTransformation(`
                transformation Test
                from Source
                to Target

                MyClass -> MyTarget {
                    forall a in attributes -> Column {
                        name := a.name.snakeCase()
                    }
                }
            `, [
                {
                    className: 'MyClass',
                    name: 'obj1',
                    attributes: [
                        { name: 'firstName' },
                    ],
                },
            ]);

            expect(result.success).toBe(true);
            const target = result.targetModel!.instances.get('MyTarget')![0];
            expect(target.columns[0].name).toBe('first_name');
        });
    });

    describe('Integration — realistic transformation', () => {
        it('Class2Relational: attributes become columns', () => {
            const result = executeTransformation(`
                transformation Class2Relational
                from ClassDiagram
                to Relational

                Class -> Table {
                    tableName := name.snakeCase()
                    forall a in attributes such that not a.multiValued -> Column {
                        name := a.name.snakeCase()
                        type := a.type
                    }
                }
            `, [
                {
                    className: 'Class',
                    name: 'Customer',
                    isAbstract: false,
                    attributes: [
                        { name: 'firstName', multiValued: false, type: 'String' },
                        { name: 'lastName', multiValued: false, type: 'String' },
                        { name: 'orders', multiValued: true, type: 'Order' },
                    ],
                },
            ]);

            expect(result.success).toBe(true);
            const tables = result.targetModel!.instances.get('Table');
            expect(tables).toHaveLength(1);

            const table = tables![0];
            expect(table.tableName).toBe('customer');
            expect(table.columns).toHaveLength(2);
            expect(table.columns[0].name).toBe('first_name');
            expect(table.columns[0].type).toBe('String');
            expect(table.columns[1].name).toBe('last_name');
            expect(table.columns[1].type).toBe('String');
        });
    });
});
