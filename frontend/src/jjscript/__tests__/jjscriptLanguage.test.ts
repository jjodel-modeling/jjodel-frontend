import { describe, it, expect } from 'vitest';
import { tokenize } from '../parser/lexer';
import { COMMANDS, ELEMENT_TYPES, KEYWORDS } from '../types';
import { JJSCRIPT_BOOLEAN_WORDS } from '../reservedIdentifiers';
import { jjscriptLanguageDefinition, jjscriptThemeRules } from '../editor/jjscriptLanguage';

const def = jjscriptLanguageDefinition as any;

/** The type the JjScript lexer gives to a single word; `MULTI` when it is not one token. */
function lexerType(word: string): string {
    const tokens = tokenize(word).filter(t => t.type !== 'EOF' && t.type !== 'WHITESPACE');
    return tokens.length === 1 ? tokens[0].type : 'MULTI';
}

/**
 * A minimal Monarch runner over this definition: first matching rule wins, `cases` guards are
 * `@keywords`, `@constants`, a whole-match regex or `@default`, `@name` pushes and `@pop` pops.
 * Enough to execute the rule order, which a read of the array cannot check.
 */
function monarch(line: string): Array<[string, string]> {
    const out: Array<[string, string]> = [];
    const stack = ['root'];
    let pos = 0;
    while (pos < line.length) {
        const rules = def.tokenizer[stack[stack.length - 1]];
        let matched = false;
        for (const [re, action, next] of rules) {
            const sticky = new RegExp(re.source, 'y');
            sticky.lastIndex = pos;
            const m = sticky.exec(line);
            if (!m || m[0] === '') continue;
            let token: string;
            if (typeof action === 'string') {
                token = action;
            } else {
                token = '';
                for (const [guard, t] of Object.entries(action.cases as Record<string, string>)) {
                    if (guard === '@default'
                        || (guard.startsWith('@') && (def[guard.slice(1)] as string[]).includes(m[0]))
                        || (!guard.startsWith('@') && new RegExp(`^(?:${guard})$`).test(m[0]))) {
                        token = t;
                        break;
                    }
                }
            }
            if (next === '@pop') stack.pop();
            else if (typeof next === 'string') stack.push(next.slice(1));
            if (token !== 'white') out.push([m[0], token]);
            pos += m[0].length;
            matched = true;
            break;
        }
        if (!matched) {
            out.push([line[pos], 'unmatched']);
            pos++;
        }
    }
    return out;
}

const candidates = Array.from(new Set<string>([
    ...COMMANDS, ...ELEMENT_TYPES.flatMap(w => w.split(' ')), ...KEYWORDS, ...JJSCRIPT_BOOLEAN_WORDS,
]));

describe('jjscript Monarch tokenizer against the lexer', () => {
    it('every word the lexer reads as COMMAND or KEYWORD is a tokenizer keyword', () => {
        const lexerKeywords = candidates.filter(w => ['COMMAND', 'KEYWORD'].includes(lexerType(w)));
        expect(lexerKeywords.length).toBeGreaterThan(40);
        const missing = lexerKeywords.filter(w => !def.keywords.includes(w));
        expect(missing).toEqual([]);
    });

    it('every tokenizer keyword is a keyword of the lexer, booleans are constants', () => {
        const extra = (def.keywords as string[]).filter(w => !['COMMAND', 'KEYWORD'].includes(lexerType(w)));
        expect(extra).toEqual([]);
        expect(JJSCRIPT_BOOLEAN_WORDS.filter(w => lexerType(w) === 'BOOLEAN')).toEqual(def.constants);
    });

    it('keywords are exact and lowercase like the lexer: Attribute stays a class name', () => {
        expect(lexerType('Attribute')).toBe('IDENTIFIER');
        expect(monarch('Attribute attribute')).toEqual([['Attribute', 'type.identifier'], ['attribute', 'keyword']]);
    });

    it('a create line: keywords, names, a dotted path, operators, a string and a number', () => {
        expect(monarch('create instance p of Person in m set p.name = "Ann" age += -3')).toEqual([
            ['create', 'keyword'], ['instance', 'keyword'], ['p', 'identifier'], ['of', 'keyword'],
            ['Person', 'type.identifier'], ['in', 'keyword'], ['m', 'identifier'], ['set', 'keyword'],
            ['p', 'identifier'], ['.', 'delimiter'], ['name', 'identifier'], ['=', 'operator'],
            ['"Ann"', 'string'], ['age', 'identifier'], ['+=', 'operator'], ['-3', 'number'],
        ]);
        expect(monarch('set p.alive = true')).toEqual([
            ['set', 'keyword'], ['p', 'identifier'], ['.', 'delimiter'], ['alive', 'identifier'],
            ['=', 'operator'], ['true', 'constant.language'],
        ]);
    });

    it('comments: a line comment and a block comment, and a slash alone is an operator', () => {
        expect(monarch('rename A to B // done')).toEqual([
            ['rename', 'keyword'], ['A', 'type.identifier'], ['to', 'keyword'], ['B', 'type.identifier'],
            ['// done', 'comment'],
        ]);
        expect(monarch("/* a */ delete 'x' / 2")).toEqual([
            ['/*', 'comment'], [' a ', 'comment'], ['*/', 'comment'], ['delete', 'keyword'],
            ["'x'", 'string'], ['/', 'operator'], ['2', 'number'],
        ]);
    });

    it('arrows win over the minus and the comparison, :: is a path separator', () => {
        expect(monarch('A -> B <-> Pkg::C')).toEqual([
            ['A', 'type.identifier'], ['->', 'operator.arrow'], ['B', 'type.identifier'],
            ['<->', 'operator.arrow'], ['Pkg', 'type.identifier'], ['::', 'delimiter'], ['C', 'type.identifier'],
        ]);
    });

    it('theme rules: the base colours on .jjscript tokens only, bracket pseudo-tokens dropped', () => {
        const rules = jjscriptThemeRules([
            { token: 'keyword', foreground: '0ea5e9', fontStyle: 'bold' },
            { token: '@brackets', foreground: '475569' },
        ]);
        expect(rules).toEqual([{ token: 'keyword.jjscript', foreground: '0ea5e9', fontStyle: 'bold' }]);
        expect(def.tokenPostfix).toBe('.jjscript');
    });
});
