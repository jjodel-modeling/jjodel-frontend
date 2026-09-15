import { describe, it, expect } from 'vitest';
/**
 * Nested object creation: `-> attr { -> Class { ... } }`
 *
 * Regression tests for the multi-line form documented in SPEC.md §3.3.
 * Before the fix, a NEWLINE between `-> attr {` and `-> Class {` made the
 * parser fall into the "nested mapping body" branch, which used the
 * attribute name as target class (targetClass = "inputArcs") without any
 * parse or validation error.
 */

import { JjtlLexer } from '../lexer/lexer';
import { JjtlParser } from '../parser/parser';
import type {
    TransformationAST,
    AttributeMappingAST,
    ObjectCreationAST,
} from '../types/ast';

function parseTransformation(source: string): TransformationAST {
    const lexer = new JjtlLexer(source);
    const { tokens, errors: lexErrors } = lexer.tokenize();
    if (lexErrors.length > 0) {
        throw new Error(`Lexer errors: ${lexErrors.map(e => e.message).join(', ')}`);
    }
    const parser = new JjtlParser(tokens);
    const { ast, errors: parseErrors } = parser.parse();
    if (parseErrors.length > 0) {
        throw new Error(`Parser errors: ${parseErrors.map(e => e.message).join(', ')}`);
    }
    expect(ast).not.toBeNull();
    return ast!;
}

function getMappingBody(source: string): AttributeMappingAST[] {
    const ast = parseTransformation(source);
    expect(ast.mappings.length).toBe(1);
    return ast.mappings[0].body as AttributeMappingAST[];
}

function expectCreation(item: AttributeMappingAST, attr: string, cls: string): ObjectCreationAST {
    expect(item.type).toBe('AttributeMapping');
    expect(item.targetAttribute).toBe(attr);
    expect(item.objectCreation).toBeDefined();
    expect(item.objectCreation!.type).toBe('ObjectCreation');
    expect(item.objectCreation!.targetClass).toBe(cls);
    return item.objectCreation!;
}

const HEADER = `transformation SM2PN\nfrom StateMachine\nto PetriNet\n`;

const SINGLE_LINE = `${HEADER}Transition -> Transition {
    name := label
    -> inputArcs { -> Arc { source := source } }
}`;

// Exactly the documented multi-line form, with blank lines and indentation.
const MULTI_LINE = `${HEADER}Transition -> Transition {
    name := label

    -> inputArcs {
        -> Arc {
            source := source
            weight := 1
        }
    }
}
`;

const TWO_CREATIONS = `${HEADER}Transition -> Transition {
    name := label

    -> inputArcs {
        -> Arc {
            source := source
            weight := 1
        }
    }

    -> outputArcs {
        -> Arc {
            target := target
            weight := 1
        }
    }
}
`;

describe('JjTL nested object creation across lines', () => {

    it('single-line form: -> inputArcs { -> Arc { ... } }', () => {
        const body = getMappingBody(SINGLE_LINE);
        expect(body.length).toBe(2);
        const creation = expectCreation(body[1], 'inputArcs', 'Arc');
        expect(creation.body.length).toBe(1);
        expect((creation.body[0] as AttributeMappingAST).targetAttribute).toBe('source');
    });

    it('multi-line form produces the same AST shape as the single-line form', () => {
        const body = getMappingBody(MULTI_LINE);
        expect(body.length).toBe(2);
        expect(body[0].targetAttribute).toBe('name');
        expect(body[0].objectCreation).toBeUndefined();

        const creation = expectCreation(body[1], 'inputArcs', 'Arc');
        expect(creation.body.length).toBe(2);

        // Same structure as the single-line form
        const single = expectCreation(getMappingBody(SINGLE_LINE)[1], 'inputArcs', 'Arc');
        expect(creation.targetClass).toBe(single.targetClass);
        expect(body[1].targetAttribute).toBe(getMappingBody(SINGLE_LINE)[1].targetAttribute);
    });

    it('multi-line form: two consecutive creations in the same mapping', () => {
        const body = getMappingBody(TWO_CREATIONS);
        expect(body.length).toBe(3);
        expectCreation(body[1], 'inputArcs', 'Arc');
        expectCreation(body[2], 'outputArcs', 'Arc');
    });

    it('inner body with attributes on separate lines yields one AttributeMapping each', () => {
        const body = getMappingBody(MULTI_LINE);
        const creation = expectCreation(body[1], 'inputArcs', 'Arc');
        const inner = creation.body as AttributeMappingAST[];
        expect(inner.map(i => i.type)).toEqual(['AttributeMapping', 'AttributeMapping']);
        expect(inner.map(i => i.targetAttribute)).toEqual(['source', 'weight']);
        expect(inner[0].expression).toBeDefined();
        expect(inner[1].expression).toBeDefined();
    });

    it('never uses the attribute name as target class', () => {
        const body = getMappingBody(MULTI_LINE);
        expect(body[1].objectCreation!.targetClass).not.toBe('inputArcs');
    });
});
