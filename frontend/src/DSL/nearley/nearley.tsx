import {DModelElement, windoww} from "../../joiner";

import nearley, {Grammar, ParserOptions, Parser} from "nearley";
const compile = require("nearley/lib/compile");
const generate = require("nearley/lib/generate");
const nearleyGrammar = require("nearley/lib/nearley-language-bootstrapped");

// type Parser = nearley.Parser;

export class Nearley{
    static compileGrammar(sourceCode: string): Grammar {
        // Parse the grammar source into an AST
        const grammarParser = new nearley.Parser(nearleyGrammar);
        grammarParser.feed(sourceCode);
        const grammarAst = grammarParser.results[0]; // TODO check for errors

        // Compile the AST into a set of rules
        const grammarInfoObject = compile(grammarAst, {});
        // Generate JavaScript code from the rules
        const grammarJs = generate(grammarInfoObject, "grammar");

        // Pretend this is a CommonJS environment to catch exports from the grammar.
        const module = { exports: {} };
        eval(grammarJs);
        return nearley.Grammar.fromCompiled(module.exports as any);
    }
    static parse(grammar: Grammar, text: string): DModelElement[] {
        // const grammar: nearley.CompiledRules = grammar0;
        let options: ParserOptions = {};
        options.keepHistory = false;
        const parser: Parser = new nearley.Parser(grammar, options);
        let result: Parser = parser.feed(text);
        return result.results;
    }

}
/*
const grammar = Nearley.compileGrammar("main -> foo | bar");
windoww.nearley = nearley;
let options: ParserOptions = {};
const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar), options);
windoww.Nearley = Nearley;
windoww.parser = parser;
*/