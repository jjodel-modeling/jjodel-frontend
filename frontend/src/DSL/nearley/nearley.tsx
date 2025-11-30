import {Dictionary, DModelElement, GObject, Log, RuntimeAccessible, windoww} from "../../joiner";

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
    static compileGrammars(fragments: Dictionary<string, string>): Grammar | null {
        if (!fragments) return null;
        if (!Object.values(fragments).length) return null;
        let grammarFragments: Dictionary<string, GrammarInfoObject> = {};
        let joined: GrammarInfoObject = null as any;
        for (let fragmentName in fragments) {
            let sourceCode = fragments[fragmentName];
            // Parse the grammar source into an AST
            const grammarParser = new nearley.Parser(nearleyGrammar);
            try { grammarParser.feed(sourceCode); }
            catch (e: any) {
                Log.ee('Syntax error in Nearley fragment "'+fragmentName+'" check parenthesis and syntax validity. https://omrelli.ug/nearley-playground/\n'+e.message, {sourceCode, e});
                return null;
            }
            const grammarAst = grammarParser.results[0];

            if (!grammarAst) {
                Log.ee('Failed to parse Nearley fragment "'+fragmentName+'" check parenthesis and syntax validity. https://omrelli.ug/nearley-playground/', {sourceCode});
                return null;
            }
            console.log('compiled fragment ' + fragmentName, {grammarAst, sourceCode, grammarParser});
            // Compile the AST into a set of rules
            const grammarInfoObject: GrammarInfoObject = compile(grammarAst, {});
            grammarFragments[fragmentName] = grammarInfoObject;
            if (!joined) joined = grammarInfoObject;
            else { Nearley.import(joined, grammarInfoObject); }
            //// only for debug and find errored fragments

            // Generate JavaScript code from the rules
            const grammarJs = generate(grammarInfoObject, "grammar");
            // Pretend this is a CommonJS environment to catch exports from the grammar.
            const module = { exports: {} };
            try { eval(grammarJs); } catch(e: any) {
                Log.ee('Error in nearly fragment "'+fragmentName+'" postprocessing, check js code inside {% tags %}: ' + e.message, e);
                return null;
            }
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
        console.log('nearley compile', {ret, module, grammarJs, joined, fragments, grammarFragments});
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
    static compileGrammar(sourceCode: string | Dictionary<string, string>): Grammar | null{
        return Nearley.compileGrammars(typeof sourceCode === 'object' ? sourceCode : {"Default":sourceCode});
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
        console.log('pre parsing', {parser, grammar, options, text});
        try{
            let result: Parser = parser.feed(text);
            console.log('post parsing', {parser, result, ret:result.results});
            return result.results;
        }
        catch(e: any) {
            let msg: string = '';
            if (e.stack.includes('Rule.postprocess')) msg = 'Nearley runtime error, a postprocess rule generated an error: ' + e.message+'\nHint: you can use Log.ii or console.log inside postprocess blocks.';
            else msg = 'Nearley runtime error: ' + e.message;
            Log.ee(msg, {parser, grammar, text, options, e});
            return [];
        }
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