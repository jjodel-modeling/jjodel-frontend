/**
 * dispatch — templates of one name chosen by the metaclass of their first argument (P-2026-10-31-1410; discovery
 * docs/discovery/discovery_2026-10-31_codegen_metaclass_dispatch.md).
 *
 * The class graph: `Expr` abstract, `Ref` and `Conj` concrete under it, `Neg` under `Conj` (the grandchild). Executed
 * through `generate` over a synthetic record shaped like `buildEvalContext`'s: class shells with `superTypes` and
 * `isAbstract`, objects whose `instanceOf` is their shell, as in originOperands.test.ts. Mutations each test kills are
 * in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { generate } from '../generate';
import { dispatchProblems, graphOfLookup, graphOfShells, mostSpecific, templateKey } from '../dispatch';
import { decodeTemplates, encodeTemplates } from '../templateCodec';
import { decodeGeneratorFile, encodeGeneratorFile, generatorDocument, GENERATOR_FILE_VERSION_TYPED } from '../generatorFile';
import { decodeGenerators } from '../generatorCodec';
import type { GenerateResult } from '../generate';
import type { TemplateRecord } from '../templates';

type Spec = readonly [name: string, supers: readonly string[], isAbstract?: boolean];

const HIERARCHY: Spec[] = [['Expr', [], true], ['Ref', ['Expr']], ['Conj', ['Expr']], ['Neg', ['Conj']]];

/** Class shells as `buildEvalContext` links them: `superTypes` are the shared shells. */
function shells(specs: readonly Spec[]): Map<string, any> {
    const out = new Map<string, any>();
    for (const [name, , isAbstract] of specs) out.set(name, { name, __type: 'Class', isAbstract: !!isAbstract, isInterface: false, superTypes: [], subTypes: [] });
    for (const [name, supers] of specs) out.get(name).superTypes = supers.map(s => out.get(s));
    return out;
}

/** One object per concrete class of `specs`, named after it in lower case, each with a `name` slot. */
function fixture(specs: readonly Spec[] = HIERARCHY) {
    const classes = shells(specs);
    const lookup: Record<string, any> = {
        MM: { className: 'DModel', id: 'MM', name: 'mm' },
        M: { className: 'DModel', id: 'M', name: 'm', instanceof: 'MM' },
        A_name: { className: 'DAttribute', id: 'A_name', name: 'name' },
    };
    const globals: Record<string, any> = { classes: [...classes.values()], instances: [] };
    for (const [name, , isAbstract] of specs) {
        if (isAbstract) continue;
        const id = name.toLowerCase();
        lookup[id] = { className: 'DObject', id, name: id, father: 'M', features: [`v_${id}`] };
        lookup[`v_${id}`] = { className: 'DValue', id: `v_${id}`, instanceof: 'A_name', values: [id], father: id };
        const handle = { id, __type: 'Object', name: id, instanceOf: classes.get(name) };
        globals[id] = handle;
        globals.instances.push(handle);
    }
    return { lookup, globals };
}

const main = (body: string): TemplateRecord => ({ name: 'main', params: [], body, mode: 'text' });
const expr = (paramType: string | undefined, body: string, params: string[] = ['e']): TemplateRecord =>
    ({ name: 'expr', params, ...(paramType !== undefined ? { paramType } : {}), body, mode: 'text' });

function gen(templates: TemplateRecord[], specs?: readonly Spec[]): GenerateResult {
    const { lookup, globals } = fixture(specs);
    return generate(globals, lookup, 'M', templates, 'main');
}

const messages = (out: GenerateResult) => out.errors.map(e => e.message);

describe('dispatch on the metaclass of the first argument', () => {
    it('picks the most specific template: Neg runs expr:Neg, not expr:Conj; Conj runs expr:Conj; Ref expr:Ref (kills: first match instead of most specific)', () => {
        const out = gen([
            main('${expr(ref)}|${expr(conj)}|${expr(neg)}'),
            expr('Conj', 'C'), expr('Ref', 'R'), expr('Neg', 'N'), expr(undefined, 'any'),
        ]);
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('R|C|N');
    });

    it('an inherited type matches: with expr:Expr and expr:Conj, Ref runs expr:Expr and Neg expr:Conj (kills: exact class match only)', () => {
        const out = gen([main('${expr(ref)}|${expr(neg)}'), expr('Expr', 'E'), expr('Conj', 'C')]);
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('E|C');
    });

    it('falls back to the untyped template for a class no type matches and for a value that is no model object (kills: fallback dropped)', () => {
        const out = gen([main('${expr(conj)}|${expr("s")}'), expr('Ref', 'R'), expr(undefined, 'any')]);
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('any|any');
    });

    it('with no template for the class and no fallback, the call is an error naming the class (kills: silent empty output)', () => {
        const out = gen([main('${expr(conj)}'), expr('Ref', 'R'), expr('Neg', 'N')]);
        expect(messages(out)).toEqual(["No template 'expr' applies to class Conj"]);
    });

    it('a first argument that is no model object, with no fallback, is an error (kills: dispatch on a missing metaclass)', () => {
        const out = gen([main('${expr(1)}'), expr('Ref', 'R')]);
        expect(messages(out)).toEqual(["Template 'expr' dispatches on the class of its first argument, which is not a model object"]);
    });

    it('a name with one untyped template is called as before, whatever its argument (kills: untyped path through dispatch)', () => {
        const out = gen([main('${expr(1)}|${expr(ref)}'), expr(undefined, '<${e.name ?? e}>')]);
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('<1>|<ref>');
    });
});

describe('validation of dispatched names', () => {
    const DIAMOND: Spec[] = [['A', [], true], ['B', [], true], ['Both', ['A', 'B']]];

    it('two equally specific matches are a problem before evaluation, and the call errors instead of choosing (kills: ambiguity resolved by order)', () => {
        const out = gen([main('${f(both)}'), { name: 'f', params: ['x'], paramType: 'A', body: 'a', mode: 'text' }, { name: 'f', params: ['x'], paramType: 'B', body: 'b', mode: 'text' }], DIAMOND);
        expect(messages(out)).toEqual([
            "Class Both matches 'f:A' and 'f:B' equally: add 'f:Both'",
            "Template 'f' is ambiguous for class Both: 'f:A' and 'f:B' match equally",
        ]);
        expect(out.errors[0].template).toBe('f:A');
    });

    it('a template for the class itself resolves the diamond (kills: ambiguity reported for a covered class)', () => {
        const out = gen([
            main('${f(both)}'),
            { name: 'f', params: ['x'], paramType: 'A', body: 'a', mode: 'text' },
            { name: 'f', params: ['x'], paramType: 'B', body: 'b', mode: 'text' },
            { name: 'f', params: ['x'], paramType: 'Both', body: 'both', mode: 'text' },
        ], DIAMOND);
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('both');
    });

    it('an arity mismatch among templates of one name is a problem, and the odd template is not registered (kills: arity unchecked)', () => {
        const out = gen([main('${expr(conj)}'), expr('Ref', 'R'), expr('Conj', 'C', ['e', 'L'])]);
        expect(messages(out)).toEqual([
            "Template 'expr:Conj' has 2 parameters and 'expr:Ref' has 1: templates of one name have one arity",
            "No template 'expr' applies to class Conj",
        ]);
    });

    it('a duplicate (name, type) is a problem; two untyped of one name keep today\'s message (kills: uniqueness by name only, or by key ignoring the type)', () => {
        const out = gen([main('${expr(ref)}'), expr('Ref', 'R'), expr('Ref', 'R2'), expr(undefined, 'x'), expr(undefined, 'y')]);
        expect(messages(out)).toEqual([
            "Template 'expr' is defined twice for Ref: the first definition is used",
            "Template 'expr' is defined twice: the first definition is used",
        ]);
        expect(out.code).toBe('R');
    });

    it('a type that is no class of the metamodel is a problem (kills: unknown type accepted)', () => {
        const out = gen([main('${expr(ref)}'), expr('Ref', 'R'), expr('Lit', 'L')]);
        expect(messages(out)).toEqual(["Template 'expr:Lit' types its first parameter Lit, which is not a class of the metamodel"]);
    });

    it('a typed template with no parameter is a problem (kills: paramType on an empty list)', () => {
        const out = gen([main('x'), expr('Ref', 'R', [])]);
        expect(messages(out)).toEqual(["Template 'expr:Ref' types its first parameter, but has no parameter"]);
    });

    it('the warning lists the concrete class under the common supertype that no template covers, and none with a fallback (kills: warning on covered classes)', () => {
        const graph = graphOfShells([...shells(HIERARCHY).values()])!;
        const records = [expr('Ref', 'R'), expr('Neg', 'N')];
        expect(dispatchProblems(records, graph).map(p => [p.severity, p.message])).toEqual([
            ['warning', "No template 'expr' applies to class Conj: add 'expr:Conj' or an untyped 'expr'"],
        ]);
        expect(dispatchProblems([...records, expr(undefined, 'any')], graph)).toEqual([]);
        expect(dispatchProblems([expr('Ref', 'R'), expr('Conj', 'C')], graph)).toEqual([]);
    });

    it('a warning is not a generation error (kills: warnings refusing Run)', () => {
        const out = gen([main('${expr(ref)}'), expr('Ref', 'R'), expr('Neg', 'N')]);
        expect(out.errors).toEqual([]);
    });

    it('mostSpecific drops a matched type that another matched type inherits (kills: supertypes kept)', () => {
        const graph = graphOfShells([...shells(HIERARCHY).values()])!;
        expect(mostSpecific(graph, 'Neg', ['Expr', 'Conj', 'Ref'])).toEqual(['Conj']);
        expect(mostSpecific(graph, 'Ref', ['Conj'])).toEqual([]);
    });

    it('graphOfLookup reads the D-layer: packages, extends, abstract and interface (kills: inheritance or concreteness misread)', () => {
        const lookup = {
            MM: { className: 'DMetamodel', packages: ['P'] },
            P: { className: 'DPackage', classifiers: ['cE', 'cR'], subpackages: ['Q'] },
            Q: { className: 'DPackage', classifiers: ['cI'] },
            cE: { className: 'DClass', name: 'Expr', abstract: true, extends: [] },
            cR: { className: 'DClass', name: 'Ref', extends: ['cE', 'cI'] },
            cI: { className: 'DClass', name: 'Named', interface: true, extends: [] },
        };
        expect([...graphOfLookup(lookup, 'MM').values()]).toEqual([
            { name: 'Expr', supers: [], concrete: false },
            { name: 'Ref', supers: ['Expr', 'Named'], concrete: true },
            { name: 'Named', supers: [], concrete: false },
        ]);
    });
});

describe('origins through a dispatched call', () => {
    it('a member read inside the chosen template keeps its model origin, labelled with the template key (kills: origin lost through dispatch)', () => {
        const out = gen([main('${expr(ref)}'), expr('Ref', 'ref ${e.name}'), expr(undefined, 'x')]);
        expect(out.code).toBe('ref ref');
        const model = out.map.filter(e => e.origin.kind === 'model').map(e => [out.code.slice(e.start, e.end), e.origin]);
        expect(model).toEqual([['ref', { kind: 'model', elementId: 'ref', feature: 'A_name', featureName: 'name', transformation: { name: 'identity' }, template: 'expr:Ref' }]]);
    });
});

describe('storage and the generator file', () => {
    const TYPED: TemplateRecord[] = [main('${expr(ref)}'), expr('Ref', 'R'), expr('Conj', 'C'), expr(undefined, 'any')];

    it('the codec writes paramType after params only when present, and reads it back (kills: paramType dropped or always written)', () => {
        const raw = encodeTemplates(TYPED);
        expect(raw).toContain('"params":["e"],"paramType":"Ref","body"');
        expect(raw).not.toContain('"paramType":null');
        expect(decodeTemplates(raw)).toEqual({ templates: TYPED, defects: [], readable: true });
        expect(templateKey(TYPED[1])).toBe('expr:Ref');
        expect(templateKey(TYPED[3])).toBe('expr');
    });

    it('the codec refuses a duplicate key and an empty type, not two types of one name (kills: codec uniqueness by name)', () => {
        const raw = JSON.stringify({ v: 1, templates: [
            { name: 'expr', params: ['e'], paramType: 'Ref', body: 'a' },
            { name: 'expr', params: ['e'], paramType: 'Ref', body: 'b' },
            { name: 'expr', params: ['e'], paramType: '', body: 'c' },
            { name: 'expr', params: ['e'], body: 'd' },
        ] });
        const d = decodeTemplates(raw);
        expect(d.templates.map(t => t.body)).toEqual(['a', 'd']);
        expect(d.defects.map(x => x.message)).toEqual([
            'expr: the name and the parameter type Ref are taken by an earlier one.',
            'expr: the parameter type is not a class name.',
        ]);
    });

    it('a 1.0 file imports unchanged and re-exports byte for byte as 1.0 (kills: version raised for untyped files)', () => {
        const file = JSON.stringify({
            format: 'jjodel-generator', formatVersion: '1.0', metamodel: 'MM', generator: 'Default', entry: 'main', targetProfile: 'js',
            files: [{ path: 'main.js', entry: 'main' }], templates: [{ name: 'main', params: [], mode: 'text', body: 'm' }],
        }, null, 2) + '\n';
        const d = decodeGeneratorFile(file);
        expect(d.problems).toEqual([]);
        expect(d.generators[0].templates).toEqual([{ name: 'main', params: [], body: 'm', mode: 'text' }]);
        const g = decodeGenerators(encodeTemplates(d.generators[0].templates), JSON.stringify({ v: 1, generators: [{ id: 'default', name: 'Default', root: 'main', files: [{ path: 'main.js', entry: 'main' }], target: 'js' }] })).generators[0];
        expect(encodeGeneratorFile(generatorDocument('MM', g))).toBe(file);
    });

    it('a typed file is written 1.1 with paramType after params, and round trips byte for byte (kills: paramType not written or not read)', () => {
        const g = decodeGenerators(encodeTemplates(TYPED), undefined).generators[0];
        const text = encodeGeneratorFile(generatorDocument('MM', g));
        const doc = JSON.parse(text);
        expect(doc.formatVersion).toBe(GENERATOR_FILE_VERSION_TYPED);
        expect(Object.keys(doc.templates[1])).toEqual(['name', 'params', 'paramType', 'mode', 'body']);
        expect('paramType' in doc.templates[3]).toBe(false);
        const d = decodeGeneratorFile(text);
        expect(d.problems).toEqual([]);
        expect(d.generators[0].templates).toEqual(TYPED);
        const back = decodeGenerators(encodeTemplates(d.generators[0].templates), undefined).generators[0];
        expect(encodeGeneratorFile(generatorDocument('MM', back))).toBe(text);
    });
});
