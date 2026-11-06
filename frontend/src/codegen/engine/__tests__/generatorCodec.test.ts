/**
 * generatorCodec — the `genGenerators` key beside `genTemplates` (slice G1, P-2026-10-24-0001; R-GEN-31, R-GEN-32,
 * R-GEN-33, discovery_2026-10-23_codegen_generator_viewpoint §4 option (c), §8 row G1).
 *
 * Executes the decoder, the encoder, the patch, the readers and the list helpers (P11) on hand-written strings and on
 * the two lecture examples (codegen/examples/), read from their JSON. Mutations each test kills are in its name; the
 * bench is in the commit body.
 */
import { describe, it, expect } from 'vitest';
import {
    addGenerator, decodeGenerators, DEFAULT_GENERATOR_ID, encodeGenerators, GEN_GENERATORS_KEY, generatorsPatch,
    newGeneratorId, readGenerators, readModelGenerators, removeGenerator, renameGenerator,
} from '../generatorCodec';
import type { GeneratorRecord } from '../generatorCodec';
import { decodeTemplates, encodeTemplates, GEN_TEMPLATES_KEY, readTemplates } from '../templateCodec';
import type { TemplateRecord } from '../templates';
import { EXAMPLES, loadExample } from '../../oracle/__tests__/exampleFixture';

const tpl = (name: string, body = '"x"'): TemplateRecord => ({ name, params: [], body });
const T32 = encodeTemplates([tpl('header'), tpl('main', '"m"'), tpl('footer')]);
const other = (id: string, name: string, templates: TemplateRecord[]) => ({ id, name, files: [{ path: `${name}.v`, entry: 'main' }], target: 'none', templates });
const gens = (...generators: unknown[]) => JSON.stringify({ v: 1, generators });

describe('a 3.2 project, genTemplates and no genGenerators', () => {
    it('reads as the default generator alone, its templates in order, root main, one file main.js, target js (kills: default ignored when genGenerators absent)', () => {
        const d = decodeGenerators(T32, undefined);
        expect(d.readable).toBe(true);
        expect(d.defects).toEqual([]);
        expect(d.generators).toHaveLength(1);
        const [g] = d.generators;
        expect(g.id).toBe(DEFAULT_GENERATOR_ID);
        expect(g.templates.map(t => t.name)).toEqual(['header', 'main', 'footer']);
        expect(g.templates).toEqual(decodeTemplates(T32).templates);
        expect(g.root).toBe('main');
        expect(g.files).toEqual([{ path: 'main.js', entry: 'main' }]);
        expect(g.target).toBe('js');
    });

    it('roots on the first template when none is named main, and has no root and no file with no template', () => {
        const first = decodeGenerators(encodeTemplates([tpl('a'), tpl('b')]), null).generators[0];
        expect(first.root).toBe('a');
        expect(first.files).toEqual([{ path: 'main.js', entry: 'a' }]);
        const empty = decodeGenerators(undefined, undefined).generators[0];
        expect(empty.root).toBeUndefined();
        expect(empty.files).toEqual([]);
        expect(empty.templates).toEqual([]);
    });

    it('turnstile and petri decode to one default generator holding the example templates (kills: the example key not read)', () => {
        for (const name of EXAMPLES) {
            const ex = loadExample(name);
            const d = readGenerators(ex.lookup, ex.metamodelId);
            expect(d.defects).toEqual([]);
            expect(d.generators.map(g => g.id)).toEqual([DEFAULT_GENERATOR_ID]);
            expect(d.generators[0].templates).toEqual(readTemplates(ex.lookup, ex.metamodelId).templates);
            expect(d.generators[0].templates.length).toBeGreaterThan(0);
            expect(d.generators[0].target).toBe('js');
            expect(readModelGenerators(ex.lookup, ex.modelId)).toEqual(d);
        }
    });
});

describe('the default and the others', () => {
    it('two generators with a template of the same name decode independently (kills: one name set across generators)', () => {
        const raw = gens(
            { id: 'default', name: 'JS', root: 'main', files: [{ path: 'main.js', entry: 'main' }], target: 'js' },
            other('g1', 'verilog', [tpl('main', '"v"'), tpl('header')]),
            other('g2', 'doc', [tpl('main', '"d"')]),
        );
        const d = decodeGenerators(T32, raw);
        expect(d.defects).toEqual([]);
        expect(d.generators.map(g => g.id)).toEqual(['default', 'g1', 'g2']);
        expect(d.generators.map(g => g.templates.map(t => `${t.name}=${t.body}`))).toEqual([
            ['header="x"', 'main="m"', 'footer="x"'], ['main="v"', 'header="x"'], ['main="d"'],
        ]);
        expect(d.generators[1].target).toBe('none');
    });

    it('puts the default first wherever it is stored, and reads it from genTemplates, never from its own templates field', () => {
        const raw = gens(other('g1', 'doc', [tpl('main')]), { id: 'default', name: 'JS', templates: [tpl('stray')] });
        const d = decodeGenerators(T32, raw);
        expect(d.generators.map(g => g.id)).toEqual(['default', 'g1']);
        expect(d.generators[0].name).toBe('JS');
        expect(d.generators[0].templates.map(t => t.name)).toEqual(['header', 'main', 'footer']);
        expect(JSON.parse(encodeGenerators(d.generators)).generators[0].templates).toBeUndefined();
    });

    it('a bad generator is one defect and the others decode (kills: whole key unreadable)', () => {
        const raw = gens(other('g1', 'a', [tpl('main')]), 'not a generator', { id: 'g2', name: 'b', target: 'verilog' }, other('g1', 'dup', []), other('g3', 'c', [tpl('main')]));
        const d = decodeGenerators(T32, raw);
        expect(d.readable).toBe(true);
        expect(d.generators.map(g => g.id)).toEqual(['default', 'g1', 'g3']);
        expect(d.defects.map(x => [x.index, x.id])).toEqual([[1, null], [2, 'g2'], [3, 'g1']]);
    });

    it('a bad template is a defect of its own and its generator decodes without it', () => {
        const raw = gens({ ...other('g1', 'a', []), templates: [tpl('main'), { name: 'main', params: [], body: '"again"' }, tpl('tail')] });
        const d = decodeGenerators(T32, raw);
        expect(d.generators[1].templates.map(t => t.name)).toEqual(['main', 'tail']);
        expect(d.defects).toHaveLength(1);
        expect(d.defects[0]).toMatchObject({ index: 0, id: 'g1', template: { index: 1, name: 'main' } });
    });

    it('a key that is not JSON, or not version 1, is one defect and the default is still read', () => {
        for (const raw of ['{', '{"v":2,"generators":[]}', '[]']) {
            const d = decodeGenerators(T32, raw);
            expect(d.readable).toBe(false);
            expect(d.defects).toHaveLength(1);
            expect(d.defects[0].index).toBeNull();
            expect(d.generators.map(g => g.templates.length)).toEqual([3]);
        }
    });
});

describe('generatorsPatch', () => {
    it('an unchanged list writes nothing (kills: patch always returned)', () => {
        const absent = decodeGenerators(T32, undefined).generators;
        expect(generatorsPatch(T32, undefined, absent)).toBeNull();
        expect(generatorsPatch(undefined, undefined, decodeGenerators(undefined, undefined).generators)).toBeNull();
        const raw = gens({ id: 'default', name: 'JS' }, other('g1', 'v', [tpl('main')]));
        expect(generatorsPatch(T32, raw, decodeGenerators(T32, raw).generators)).toBeNull();
    });

    it('saving a non-default generator leaves genTemplates byte-identical (kills: the default rewritten)', () => {
        // Not the canonical bytes: an unknown field, which re-encoding would drop.
        const raw = '{"v":1,"templates":[{"name":"main","params":[],"body":"\\"m\\"","note":"kept"}]}';
        const list = addGenerator(decodeGenerators(raw, undefined).generators, 'verilog');
        const patch = generatorsPatch(raw, undefined, list)!;
        expect(Object.keys(patch)).toEqual([GEN_GENERATORS_KEY]);
        const back = decodeGenerators(raw, patch[GEN_GENERATORS_KEY]);
        expect(back.generators.map(g => g.name)).toEqual(['Default', 'verilog']);
        expect(generatorsPatch(raw, patch[GEN_GENERATORS_KEY], back.generators)).toBeNull();
    });

    it('a change of the default\'s templates writes genTemplates alone, an emptied list as []', () => {
        const [def] = decodeGenerators(T32, undefined).generators;
        const changed = generatorsPatch(T32, undefined, [{ ...def, templates: [tpl('main', '"new"')] }])!;
        expect(Object.keys(changed)).toEqual([GEN_TEMPLATES_KEY]);
        expect(decodeTemplates(changed[GEN_TEMPLATES_KEY]).templates).toEqual([tpl('main', '"new"')]);
        // The emptied default keeps root main, declared in the list it was handed: the metadata is unchanged.
        const emptied = generatorsPatch(T32, undefined, [{ ...def, templates: [] }])!;
        expect(emptied[GEN_TEMPLATES_KEY]).toBe('{"v":1,"templates":[]}');
    });

    it('a change of a non-default list writes genGenerators alone, an emptied list as []; the result is one state delta', () => {
        const raw = gens({ id: 'default', name: 'JS' }, other('g1', 'v', [tpl('main')]));
        const list = decodeGenerators(T32, raw).generators.map(g => (g.id === 'g1' ? { ...g, templates: [] } : g));
        const patch = generatorsPatch(T32, raw, list)!;
        expect(Object.keys(patch)).toEqual([GEN_GENERATORS_KEY]);
        expect(JSON.parse(patch[GEN_GENERATORS_KEY]).generators[1].templates).toEqual([]);
    });

    it('a removed generator writes the shorter list, never a removed key', () => {
        const raw = gens({ id: 'default', name: 'JS' }, other('g1', 'v', [tpl('main')]));
        const list = removeGenerator(decodeGenerators(T32, raw).generators, 'g1');
        const patch = generatorsPatch(T32, raw, list)!;
        expect(Object.keys(patch)).toEqual([GEN_GENERATORS_KEY]);
        expect(JSON.parse(patch[GEN_GENERATORS_KEY]).generators.map((g: any) => g.id)).toEqual(['default']);
    });

    it('keeps a defective key\'s bytes when the save leaves its part unchanged', () => {
        const raw = gens({ id: 'default', name: 'JS' }, 'broken', other('g1', 'v', [tpl('main')]));
        expect(generatorsPatch(T32, raw, decodeGenerators(T32, raw).generators)).toBeNull();
    });
});

describe('3.3 data read by the 3.2 codec', () => {
    it('readTemplates on a metamodel with genGenerators still yields the default\'s templates (kills: the default moved out of genTemplates)', () => {
        const list = addGenerator(decodeGenerators(T32, undefined).generators, 'verilog');
        const patch = generatorsPatch(T32, undefined, list)!;
        const lookup = { MM: { id: 'MM', _state: { [GEN_TEMPLATES_KEY]: T32, ...patch } }, M: { id: 'M', instanceof: 'MM' } };
        expect(readTemplates(lookup, 'MM')).toEqual(decodeTemplates(T32));
        expect(readModelGenerators(lookup, 'M').generators.map(g => g.id)).toEqual(['default', 'g1']);
    });
});

describe('list helpers', () => {
    const base = (): readonly GeneratorRecord[] => decodeGenerators(T32, undefined).generators;

    it('addGenerator appends a generator with no template, target none, one file named after it', () => {
        const list = addGenerator(base(), 'doc');
        expect(list).toHaveLength(2);
        expect(list[1]).toEqual({ id: 'g1', name: 'doc', files: [{ path: 'doc.txt', entry: 'main' }], target: 'none', templates: [] });
        expect(addGenerator(list, 'doc')[2].id).toBe('g2');
    });

    it('newGeneratorId picks the first id no generator holds', () => {
        expect(newGeneratorId([{ id: 'default' }, { id: 'g1' }, { id: 'g3' }])).toBe('g2');
        expect(newGeneratorId([])).toBe('g1');
    });

    it('removeGenerator refuses the default and an unknown id, returning the list itself', () => {
        const list = addGenerator(base(), 'doc');
        expect(removeGenerator(list, DEFAULT_GENERATOR_ID)).toBe(list);
        expect(removeGenerator(list, 'nope')).toBe(list);
        expect(removeGenerator(list, 'g1').map(g => g.id)).toEqual(['default']);
    });

    it('renameGenerator renames by id, and refuses an empty name or an unknown id', () => {
        const list = addGenerator(base(), 'doc');
        expect(renameGenerator(list, 'g1', 'docs').map(g => g.name)).toEqual(['Default', 'docs']);
        expect(renameGenerator(list, 'g1', '')).toBe(list);
        expect(renameGenerator(list, 'nope', 'x')).toBe(list);
    });
});
