import { describe, it, expect } from 'vitest';

/**
 * Two parser limits closed together (GO 2026-09-06 15:20, D7).
 *
 * 1. A NEWLINE between the collection (or the `such that` clause) and the `->`
 *    of a forall used to abort parsing with "Expected '->' for object creation
 *    in forall". `forAllMapping()` consumed the arrow without skipping newlines
 *    first — the same defect class fixed in `attributeMapping()` by a4355b365,
 *    in a different position.
 *
 * 2. A value mapping whose keys are identifiers rather than boolean/number/
 *    string literals (`type := a.type : String=VARCHAR`) did not parse: both
 *    lookaheads (`isValueMappingStart`, `findValueMappingColon`) required a
 *    typed literal, so the `:` was read as a conversion and the `=` had nowhere
 *    to go. The message the user saw was "Expected source attribute name".
 *
 * A third case is pinned because the prompt that opened this work reported it as
 * broken and it is not: `name := a.name` inside a forall parses, and must keep
 * parsing.
 */

import { JjtlLexer } from '../../lexer/lexer';
import { JjtlParser } from '../parser';
import type {
    TransformationAST,
    AttributeMappingAST,
    ForAllMappingAST,
    ValueMappingAST,
} from '../../types/ast';

const HEAD = 'transformation ER2Rel\nfrom ERD\nto Relational\n\n';

/** Parse through the same entry point the app uses (no `source`: see useJjtlParser). */
function parse(body: string): { ast: TransformationAST | null; errors: string[] } {
    const { tokens, errors: lexErrors } = new JjtlLexer(HEAD + body).tokenize();
    expect(lexErrors).toEqual([]);
    const { ast, errors } = new JjtlParser(tokens).parse();
    return { ast, errors: errors.map(e => e.message) };
}

/** Parse through the JjEL-delegating path (`source` provided). */
function parseWithSource(body: string): { ast: TransformationAST | null; errors: string[] } {
    const src = HEAD + body;
    const { tokens } = new JjtlLexer(src).tokenize();
    const { ast, errors } = new JjtlParser(tokens, src).parse();
    return { ast, errors: errors.map(e => e.message) };
}

function firstForAll(ast: TransformationAST | null): ForAllMappingAST {
    const item = ast!.mappings[0].body[0];
    expect(item.type).toBe('ForAllMapping');
    return item as ForAllMappingAST;
}

describe('forall: newline before the arrow', () => {
    it('parses with the arrow on its own line', () => {
        const { ast, errors } = parse(`Entity -> Table {
    forall a in ownedAttributes
        -> Column {
            name := a.name
        }
}
`);
        expect(errors).toEqual([]);
        const forall = firstForAll(ast);
        expect(forall.variable).toBe('a');
        expect(forall.objectCreation.targetClass).toBe('Column');
        expect(forall.objectCreation.body).toHaveLength(1);
    });

    it('parses with a such-that clause and the arrow on its own line', () => {
        const { ast, errors } = parse(`Entity -> Table {
    forall a in ownedAttributes such that a.isKey
        -> Column {
            name := a.name
        }
}
`);
        expect(errors).toEqual([]);
        const forall = firstForAll(ast);
        expect(forall.filter).toBeDefined();
        expect(forall.objectCreation.targetClass).toBe('Column');
    });

    it('produces the same AST as the single-line form', () => {
        const oneLine = firstForAll(parse(`Entity -> Table {
    forall a in ownedAttributes -> Column {
        name := a.name
    }
}
`).ast);
        const twoLines = firstForAll(parse(`Entity -> Table {
    forall a in ownedAttributes
        -> Column {
            name := a.name
        }
}
`).ast);

        const strip = (n: any) => JSON.parse(JSON.stringify(n, (k, v) => (k === 'location' ? undefined : v)));
        expect(strip(twoLines)).toEqual(strip(oneLine));
    });

    it('still reports a missing arrow', () => {
        const { errors } = parse(`Entity -> Table {
    forall a in ownedAttributes
    Column {
        name := a.name
    }
}
`);
        expect(errors.some(e => e.includes("Expected '->' for object creation in forall"))).toBe(true);
    });
});

describe('value mappings with identifier keys', () => {
    it('parses `attr := expr : Ident=Ident, …` after the := syntax', () => {
        const { ast, errors } = parse(`Entity -> Table {
    forall a in ownedAttributes -> Column {
        type := a.type : String=VARCHAR, Integer=INTEGER, Boolean=BOOLEAN
    }
}
`);
        expect(errors).toEqual([]);
        const inner = firstForAll(ast).objectCreation.body[0] as AttributeMappingAST;
        expect(inner.targetAttribute).toBe('type');
        const pairs = inner.valueMapping as ValueMappingAST[];
        expect(pairs).toHaveLength(3);
        expect(pairs.map(p => [p.sourceValue.value, p.targetValue.value])).toEqual([
            ['String', 'VARCHAR'],
            ['Integer', 'INTEGER'],
            ['Boolean', 'BOOLEAN'],
        ]);
        // Identifiers are carried as strings: that is the shape the source side has.
        expect(pairs.every(p => p.sourceValue.literalType === 'string')).toBe(true);
        expect(pairs.every(p => p.targetValue.literalType === 'string')).toBe(true);
    });

    it('parses the same pairs after the conversion form `-> attr : expr : …`', () => {
        const { ast, errors } = parse(`Entity -> Table {
    forall a in ownedAttributes -> Column {
        -> type : a.type : String=VARCHAR, Integer=INTEGER
    }
}
`);
        expect(errors).toEqual([]);
        const inner = firstForAll(ast).objectCreation.body[0] as AttributeMappingAST;
        expect(inner.targetAttribute).toBe('type');
        const pairs = inner.conversion!.mappings as ValueMappingAST[];
        expect(pairs.map(p => [p.sourceValue.value, p.targetValue.value])).toEqual([
            ['String', 'VARCHAR'],
            ['Integer', 'INTEGER'],
        ]);
    });

    it('parses on the JjEL-delegating path too', () => {
        const { ast, errors } = parseWithSource(`Entity -> Table {
    forall a in ownedAttributes -> Column {
        type := a.type : String=VARCHAR, Integer=INTEGER
    }
}
`);
        expect(errors).toEqual([]);
        const inner = firstForAll(ast).objectCreation.body[0] as AttributeMappingAST;
        expect(inner.valueMapping).toHaveLength(2);
    });

    it('keeps the boolean and number keys working', () => {
        const { ast, errors } = parse(`State -> Place {
    tokens := isInitial : true=1, false=0
}
`);
        expect(errors).toEqual([]);
        const item = ast!.mappings[0].body[0] as AttributeMappingAST;
        expect(item.valueMapping!.map(p => [p.sourceValue.value, p.targetValue.value]))
            .toEqual([[true, 1], [false, 0]]);
    });

    it('a colon not followed by `key =` stays a conversion expression', () => {
        // Negative control for the widened lookahead: `a.name` after the colon is an
        // IDENTIFIER, but the token after it is '.', not '=', so no value mapping.
        const { ast, errors } = parse(`Entity -> Table {
    forall a in ownedAttributes -> Column {
        -> name : a.name
    }
}
`);
        expect(errors).toEqual([]);
        const inner = firstForAll(ast).objectCreation.body[0] as AttributeMappingAST;
        expect(inner.conversion!.expression).toBeDefined();
        expect(inner.conversion!.mappings).toBeUndefined();
    });
});

describe('assignment inside a forall body', () => {
    it('`name := a.name` parses (it was reported as broken; it is not)', () => {
        const { ast, errors } = parse(`Entity -> Table {
    forall a in ownedAttributes -> Column {
        name := a.name
        isPrimaryKey := a.isKey
    }
}
`);
        expect(errors).toEqual([]);
        const body = firstForAll(ast).objectCreation.body as AttributeMappingAST[];
        expect(body.map(b => b.targetAttribute)).toEqual(['name', 'isPrimaryKey']);
        expect(body.every(b => b.expression !== undefined)).toBe(true);
    });

    it('the legacy dotted source form `a.name -> name` still does not parse', () => {
        const { errors } = parse(`Entity -> Table {
    forall a in ownedAttributes -> Column {
        a.name -> name
    }
}
`);
        expect(errors.length).toBeGreaterThan(0);
    });
});
