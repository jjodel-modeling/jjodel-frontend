import {DModelElement, GObject, Log, RuntimeAccessible, windoww} from "../../joiner";

import nearley, {Grammar, ParserOptions, Parser, Rule} from "nearley";
const compile = require("nearley/lib/compile");
const generate = require("nearley/lib/generate");
const nearleyGrammar = require("nearley/lib/nearley-language-bootstrapped");

windoww.nnearley = nearley;
class GrammarInfoObject{
    body!: unknown[];
    config!: GObject<{preprocessor: string}>; // {preprocessor:'_default'}
    customTokens!: unknown[];
    macros!: GObject;
    rules!: Rule[];
    start!: string; // 'main'
    version!: 'unknown';
}

// type Parser = nearley.Parser;
@RuntimeAccessible('Nearley')
export class Nearley{
    static cname: string = 'Nearley';
    static compileGrammars(sourceCodes: string[]): Grammar | null {
        if (!sourceCodes.length) return null;
        let fragments: GrammarInfoObject[] = [];
        let joined: GrammarInfoObject = null as any;
        for (let sourceCode of sourceCodes) {
            // Parse the grammar source into an AST
            const grammarParser = new nearley.Parser(nearleyGrammar);
            grammarParser.feed(sourceCode);
            const grammarAst = grammarParser.results[0]; // TODO check for errors

            // Compile the AST into a set of rules
            const grammarInfoObject: GrammarInfoObject = compile(grammarAst, {});
            fragments.push(grammarInfoObject);
            if (!joined) joined = grammarInfoObject;
            else { Nearley.import(joined, grammarInfoObject); }
        }

        // Generate JavaScript code from the rules
        const grammarJs = generate(joined, "grammar");

        // Pretend this is a CommonJS environment to catch exports from the grammar.
        const module = { exports: {} };
        try { eval(grammarJs); } catch(e: any) {
            Log.ee('Error in nearly grammar postprocessing, check js code inside {% tags %}: ' + e.message, e);
            return null;
        }
        let ret =  nearley.Grammar.fromCompiled(module.exports as any);
        console.log('nearley compile', {ret, module, grammarJs, joined, fragments});
        return ret;
    }


    static compileGrammar_1(sourceCode: string): Grammar | null {
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
        try { eval(grammarJs); } catch(e: any) {
            Log.ee('Error in nearly grammar postprocessing, check js code inside {% tags %}: ' + e.message, e);
            return null;
        }
        let ret =  nearley.Grammar.fromCompiled(module.exports as any);
        console.log('nearley compile', {ret, module, grammarJs, grammarInfoObject, grammarAst});
        return ret;
    }
    static compileGrammar(sourceCode: string | string[]): Grammar | null{
        return Nearley.compileGrammars(Array.isArray(sourceCode) ? sourceCode : [sourceCode]);
    }

    static import(g1: GrammarInfoObject, g2: GrammarInfoObject): void {
        let result = g1;
        let c= g2;
        result.rules = result.rules.concat(c.rules);
        result.body  = result.body.concat(c.body);
        result.customTokens = result.customTokens.concat(c.customTokens);
        Object.keys(c.config).forEach(function(k) {
            result.config[k] = c.config[k];
        });
        Object.keys(c.macros).forEach(function(k) {
            result.macros[k] = c.macros[k];
        });
    }

    static parse(grammar: Grammar, text: string): DModelElement[] {
        // const grammar: nearley.CompiledRules = grammar0;
        let options: ParserOptions = {};
        options.keepHistory = false;
        const parser: Parser = new nearley.Parser(grammar, options);
        let result: Parser = parser.feed(text);
        console.log('parsing', {parser, result, ret:result.results});
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