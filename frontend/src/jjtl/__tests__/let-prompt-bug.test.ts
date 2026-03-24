import { describe, it, expect } from 'vitest';
import { JjtlLexer } from '../lexer/lexer';
import { JjtlParser } from '../parser/parser';
import type { LetStatementAST, AttributeMappingAST } from '../types/ast';

const HEADER = `transformation Test\nfrom Source\nto Target\n`;

function parseNoSource(source: string) {
    const lexer = new JjtlLexer(source);
    const { tokens, errors: lexErrors } = lexer.tokenize();
    if (lexErrors.length > 0) throw new Error(`Lex: ${lexErrors.map(e => e.message).join(', ')}`);
    const parser = new JjtlParser(tokens);
    return parser.parse();
}

function parseWithSource(source: string) {
    const lexer = new JjtlLexer(source);
    const { tokens, errors: lexErrors } = lexer.tokenize();
    if (lexErrors.length > 0) throw new Error(`Lex: ${lexErrors.map(e => e.message).join(', ')}`);
    const parser = new JjtlParser(tokens, source);
    return parser.parse();
}

describe('let statement with prompt() — comma bug fix', () => {
    const input = HEADER + `SourceClass -> TargetClass {
  let $p = prompt('Name', EString) in {
    -> name : $p
  }
}
`;

    it('parses without source string (production path)', () => {
        const { ast, errors } = parseNoSource(input);
        expect(errors).toHaveLength(0);
        expect(ast).not.toBeNull();
        const letStmt = ast!.mappings[0].body[0] as LetStatementAST;
        expect(letStmt.type).toBe('LetStatement');
        expect(letStmt.bindings).toHaveLength(1);
        expect(letStmt.bindings[0].name).toBe('$p');
        expect(letStmt.bindings[0].value.type).toBe('PromptExpression');
    });

    it('parses with source string (JjEL delegation path)', () => {
        const { ast, errors } = parseWithSource(input);
        expect(errors).toHaveLength(0);
        expect(ast).not.toBeNull();
        const letStmt = ast!.mappings[0].body[0] as LetStatementAST;
        expect(letStmt.type).toBe('LetStatement');
        expect(letStmt.bindings).toHaveLength(1);
        expect(letStmt.bindings[0].name).toBe('$p');
        // JjEL delegation wraps prompt() as a JjelExpression (function call),
        // not a JjTL-specific PromptExpression — both are valid representations
        expect(letStmt.bindings[0].value.type).toBe('JjelExpression');
    });
});

describe('let statement — $var in conversion expressions', () => {
    const input = HEADER + `SourceClass -> TargetClass {
  let $prefix = "hello" in {
    name -> label : $prefix
  }
}
`;

    it('$var resolves as identifier in conversion', () => {
        const { ast, errors } = parseNoSource(input);
        expect(errors).toHaveLength(0);
        const letStmt = ast!.mappings[0].body[0] as LetStatementAST;
        expect(letStmt.type).toBe('LetStatement');
        const attr = letStmt.body[0] as AttributeMappingAST;
        expect(attr.type).toBe('AttributeMapping');
    });
});

describe('let statement — multiple bindings with comma', () => {
    const input = HEADER + `SourceClass -> TargetClass {
  let $a = "x", $b = "y" in {
    -> name : $a
  }
}
`;

    it('parses multiple comma-separated bindings', () => {
        const { ast, errors } = parseNoSource(input);
        expect(errors).toHaveLength(0);
        const letStmt = ast!.mappings[0].body[0] as LetStatementAST;
        expect(letStmt.bindings).toHaveLength(2);
        expect(letStmt.bindings[0].name).toBe('$a');
        expect(letStmt.bindings[1].name).toBe('$b');
    });
});

describe('let statement — prompt with default value (3 args)', () => {
    const input = HEADER + `SourceClass -> TargetClass {
  let $p = prompt('Name', EString, "default") in {
    -> name : $p
  }
}
`;

    it('parses prompt with 3 arguments', () => {
        const { ast, errors } = parseNoSource(input);
        expect(errors).toHaveLength(0);
        const letStmt = ast!.mappings[0].body[0] as LetStatementAST;
        expect(letStmt.bindings[0].value.type).toBe('PromptExpression');
    });
});

describe('let statement — multiple bindings with prompt (comma bug)', () => {
    it('parses prompt + expression on same line', () => {
        const input = HEADER + `SourceClass -> TargetClass {
  let $p = prompt('Name', EString), $q = name.snakeCase() in {
    name -> name : $p + $q
  }
}
`;
        const { ast, errors } = parseNoSource(input);
        expect(errors).toHaveLength(0);
        const letStmt = ast!.mappings[0].body[0] as LetStatementAST;
        expect(letStmt.bindings).toHaveLength(2);
        expect(letStmt.bindings[0].name).toBe('$p');
        expect(letStmt.bindings[1].name).toBe('$q');
    });

    it('parses prompt + expression on separate lines', () => {
        const input = HEADER + `SourceClass -> TargetClass {
  let $name = prompt('Name', EString),
      $upper = $name.toUpper() in {
    name  -> name  : $name
    label -> label : $upper
  }
}
`;
        const { ast, errors } = parseNoSource(input);
        expect(errors).toHaveLength(0);
        const letStmt = ast!.mappings[0].body[0] as LetStatementAST;
        expect(letStmt.bindings).toHaveLength(2);
        expect(letStmt.bindings[0].name).toBe('$name');
        expect(letStmt.bindings[1].name).toBe('$upper');
    });

    it('parses single binding with newline before in', () => {
        const input = HEADER + `SourceClass -> TargetClass {
  let $name = prompt('Name', EString)
  in {
    name -> name : $name
  }
}
`;
        const { ast, errors } = parseNoSource(input);
        expect(errors).toHaveLength(0);
        const letStmt = ast!.mappings[0].body[0] as LetStatementAST;
        expect(letStmt.bindings).toHaveLength(1);
        expect(letStmt.bindings[0].name).toBe('$name');
    });

    it('parses with source string — multiple bindings', () => {
        const input = HEADER + `SourceClass -> TargetClass {
  let $p = prompt('Name', EString), $q = name.snakeCase() in {
    name -> name : $p
  }
}
`;
        const { ast, errors } = parseWithSource(input);
        expect(errors).toHaveLength(0);
        const letStmt = ast!.mappings[0].body[0] as LetStatementAST;
        expect(letStmt.bindings).toHaveLength(2);
        expect(letStmt.bindings[0].name).toBe('$p');
        expect(letStmt.bindings[1].name).toBe('$q');
    });
});
