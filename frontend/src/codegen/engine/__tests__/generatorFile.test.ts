/**
 * generatorFile — a generator as a JSON file (P-2026-10-30-1430, P-2026-10-30-1515;
 * discovery_2026-10-30_generator_import_export).
 *
 * Executes the encoder, the decoder, the validation and the import plan on hand-written generators and on the two
 * acceptance generators of the SyncRTL case (fixtures/generator-smv.json, fixtures/generator-verilog.json, format 1.0
 * without `targetProfile` and `files`). Mutations each test kills are in its name; the bench is in the commit body.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import {
    decodeGeneratorFile, encodeGeneratorFile, generatorDocument, generatorFileName, planImport, projectGeneratorsFileName,
    resolveImported, validateGenerator,
} from '../generatorFile';
import type { ImportedGenerator, StoredGenerators } from '../generatorFile';
import { decodeGenerators, DEFAULT_GENERATOR_ID, encodeGenerators, GEN_GENERATORS_KEY } from '../generatorCodec';
import type { GeneratorRecord } from '../generatorCodec';
import { encodeTemplates, GEN_TEMPLATES_KEY, templatesPatch } from '../templateCodec';
import type { TemplateRecord } from '../templates';

const fixture = (name: string): string => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const SMV = fixture('generator-smv.json');
const VERILOG = fixture('generator-verilog.json');

/** Ten templates: text bodies with holes, both quotes, backslashes and `\n` in literals, a multi-line join, one target. */
const ROUND: TemplateRecord[] = [
    { name: 'main', params: [], body: 'header() + rows(Module.instances) + footer()' },
    { name: 'header', params: [], body: '"// \\"double\\" and \'single\' quotes\\n"' },
    { name: 'footer', params: [], body: '"end\\\\of\\\\file\\n"' },
    { name: 'rows', params: ['xs'], body: 'xs\n  .map(x => row(x, " | "))\n  .join("\\n")' },
    { name: 'row', params: ['x', 'sep'], body: '${x.name}${sep}"${cell(x)}" \\\\ \'${x.kind}\'', mode: 'text' },
    { name: 'cell', params: ['x'], body: 'guard(x.value)' },
    { name: 'guard', params: ['e'], body: 'if e == null then "TRUE" else e' },
    { name: 'smvLine', params: ['x'], body: 'VAR ${x.name} : boolean;\\n-- \\${not a hole}', mode: 'text', target: 'smv' },
    { name: 'names', params: ['xs'], body: 'forall x in xs : x.name' },
    { name: 'allNamed', params: ['xs'], body: 'xs.all(x => x.name != null)' },
];

const keys = (rawTemplates?: string, rawGenerators?: string): StoredGenerators => ({ rawTemplates, rawGenerators });
const none = (): StoredGenerators => keys();
const only = (g: ImportedGenerator, over: Partial<ImportedGenerator> = {}): ImportedGenerator => ({ ...g, ...over });
const errors = (text: string) => decodeGeneratorFile(text).problems.filter(p => p.severity === 'error');
const fileOf = (over: Record<string, unknown>, templates: unknown[] = [{ name: 'main', params: [], mode: 'expression', body: '"m"' }]) =>
    JSON.stringify({ format: 'jjodel-generator', formatVersion: '1.0', metamodel: 'MM', generator: 'g', entry: 'main', templates, ...over });

/** The bag after applying the plan's write to `bag`. */
function apply(bag: Record<string, string>, plan: ReturnType<typeof planImport>, metamodelId = 'mm'): Record<string, string> {
    const w = plan.writes.find(x => x.metamodelId === metamodelId);
    return w ? { ...bag, ...w.patch } : bag;
}
const fromBag = (bag: Record<string, string>) => keys(bag[GEN_TEMPLATES_KEY], bag[GEN_GENERATORS_KEY]);

describe('the acceptance generators (SyncRTL: smv, verilog)', () => {
    it.each([['generator-smv.json', SMV, 11], ['generator-verilog.json', VERILOG, 10]])(
        '%s decodes and validates with no error, no warning and no note: every call resolves (kills: template names left out of the resolved set)',
        (_, text, count) => {
            const d = decodeGeneratorFile(text);
            expect(d.problems).toEqual([]);
            expect(d.generators).toHaveLength(1);
            expect(d.generators[0].templates).toHaveLength(count);
            expect(d.generators[0].metamodel).toBe('SyncRTL');
            expect(d.generators[0]).not.toHaveProperty('files');
            expect(d.generators[0]).not.toHaveProperty('target');
        },
    );

    it('both import into one metamodel as two generators smv and verilog, templates as in the files and in their order (kills: expression mode stored on import)', () => {
        const smv = decodeGeneratorFile(SMV).generators[0];
        const verilog = decodeGeneratorFile(VERILOG).generators[0];
        let bag: Record<string, string> = {};
        bag = apply(bag, planImport([smv], ['mm'], () => fromBag(bag)));
        bag = apply(bag, planImport([verilog], ['mm'], () => fromBag(bag)));
        const stored = decodeGenerators(bag[GEN_TEMPLATES_KEY], bag[GEN_GENERATORS_KEY]);
        expect(stored.defects).toEqual([]);
        const imported = stored.generators.filter(g => g.id !== DEFAULT_GENERATOR_ID);
        expect(imported.map(g => g.name)).toEqual(['smv', 'verilog']);
        for (const [g, text] of [[imported[0], SMV], [imported[1], VERILOG]] as const) {
            const file = JSON.parse(text);
            expect(g.templates.map(t => [t.name, t.params, t.mode ?? 'expression', t.body])).toEqual(
                file.templates.map((t: any) => [t.name, t.params, t.mode, t.body]),
            );
            expect(g.templates.filter(t => 'mode' in t).map(t => t.mode)).toEqual(['text']);
        }
        expect(bag).not.toHaveProperty(GEN_TEMPLATES_KEY);
    });

    it.each([['smv', SMV], ['verilog', VERILOG]])(
        're-exporting %s gives the file back plus targetProfile none and one file <name>.txt, nothing else (kills: absent metadata not resolved through the codec)',
        (name, text) => {
            const plan = planImport(decodeGeneratorFile(text).generators, ['mm'], none);
            const bag = apply({}, plan);
            const g = decodeGenerators(bag[GEN_TEMPLATES_KEY], bag[GEN_GENERATORS_KEY]).generators[1];
            const { templates, ...head } = JSON.parse(text);
            const expected = { ...head, targetProfile: 'none', files: [{ path: `${name}.txt`, entry: 'main' }], templates };
            expect(encodeGeneratorFile(generatorDocument('SyncRTL', g))).toBe(JSON.stringify(expected, null, 2) + '\n');
        },
    );

    it('importing smv a second time collides, and «Import under a new name» yields smv 2 (kills: collision not detected)', () => {
        const smv = decodeGeneratorFile(SMV).generators;
        const bag = apply({}, planImport(smv, ['mm'], none));
        const plan = planImport(smv, ['mm'], () => fromBag(bag));
        expect(plan.errors).toEqual([]);
        expect(plan.collisions).toHaveLength(1);
        expect(plan.collisions[0]).toMatchObject({ index: 0, existingTemplates: 11, newName: 'smv 2' });
        const after = apply(bag, plan);
        expect(decodeGenerators(after[GEN_TEMPLATES_KEY], after[GEN_GENERATORS_KEY]).generators.map(g => g.name)).toEqual(['Default', 'smv', 'smv 2']);
    });
});

describe('round trip', () => {
    const RAW = encodeTemplates(ROUND);
    const stored = decodeGenerators(RAW, undefined).generators[0];
    const text = encodeGeneratorFile(generatorDocument('MM', stored));

    it('ten templates decode back equal, every body verbatim, with no problem (kills: own escaping of bodies)', () => {
        const d = decodeGeneratorFile(text);
        expect(d.problems).toEqual([]);
        expect(d.generators[0].templates).toEqual(ROUND);
        expect(d.generators[0].root).toBe('main');
    });

    it('templatesPatch against the stored string is null, and Replace of the default writes nothing (kills: mode written for an expression on import)', () => {
        const [g] = decodeGeneratorFile(text).generators;
        expect(templatesPatch(RAW, g.templates)).toBeNull();
        const plan = planImport([only(g, { name: 'Default' })], ['mm'], () => keys(RAW), { 0: 'replace' });
        expect(plan.errors).toEqual([]);
        expect(plan.writes).toEqual([]);
        expect(plan.imported).toEqual([{ index: 0, metamodelId: 'mm', generatorId: DEFAULT_GENERATOR_ID, name: 'Default' }]);
    });

    it('Replace of a non-default generator by its own export writes nothing (kills: replace appends)', () => {
        const other: GeneratorRecord = { id: 'g1', name: 'smv', root: 'main', files: [{ path: 'out.smv', entry: 'main' }], target: 'none', templates: ROUND };
        const rawG = encodeGenerators([stored, other]);
        const [g] = decodeGeneratorFile(encodeGeneratorFile(generatorDocument('MM', other))).generators;
        const plan = planImport([g], ['mm'], () => keys(RAW, rawG), { 0: 'replace' });
        expect(plan.writes).toEqual([]);
        expect(plan.imported[0].generatorId).toBe('g1');
    });

    it('an expression exports mode expression and imports with no mode; text keeps mode text (kills: mode always kept)', () => {
        const doc = JSON.parse(text);
        expect(doc.templates[0].mode).toBe('expression');
        expect(doc.templates[4].mode).toBe('text');
        const [g] = decodeGeneratorFile(text).generators;
        expect('mode' in g.templates[0]).toBe(false);
        expect(g.templates[4].mode).toBe('text');
        expect(g.templates[7].target).toBe('smv');
    });

    it('writes keys in the fixed order and ends with one newline; Export all is an array', () => {
        expect(Object.keys(JSON.parse(text))).toEqual(['format', 'formatVersion', 'metamodel', 'generator', 'entry', 'targetProfile', 'files', 'templates']);
        expect(text.endsWith('}\n')).toBe(true);
        const all = encodeGeneratorFile([generatorDocument('A', stored), generatorDocument('B', stored)]);
        expect(JSON.parse(all)).toHaveLength(2);
        expect(decodeGeneratorFile(all).generators).toHaveLength(2);
        expect(generatorFileName('SyncRTL', 'smv')).toBe('SyncRTL.smv.generator.json');
        expect(projectGeneratorsFileName('P')).toBe('P.generators.json');
    });

    it('a default with no templates has no entry in the file', () => {
        const empty = decodeGenerators(undefined, undefined).generators[0];
        expect(JSON.parse(encodeGeneratorFile(generatorDocument('MM', empty)))).not.toHaveProperty('entry');
    });
});

describe('import errors, each with its generator and template', () => {
    it('a file that is not JSON is one error', () => {
        expect(decodeGeneratorFile('{ nope').problems).toEqual([{ severity: 'error', generator: null, message: 'The file is not JSON.' }]);
    });

    it('a wrong format and a format version 2.0 are errors; 1.3 is accepted (kills: version regex anchored on 1.0)', () => {
        expect(errors(fileOf({ format: 'other' })).map(p => p.message)).toEqual(['The format is not jjodel-generator.']);
        expect(errors(fileOf({ formatVersion: '2.0' })).map(p => p.message)).toEqual(['The format version "2.0" is not 1.x.']);
        expect(errors(fileOf({ formatVersion: '1.3' }))).toEqual([]);
        expect(errors(fileOf({ formatVersion: '10' }))).toHaveLength(1);
    });

    it('an entry that names no template is an error naming it (kills: entry check dropped)', () => {
        const e = errors(fileOf({ entry: 'start' }));
        expect(e).toHaveLength(1);
        expect(e[0]).toMatchObject({ generator: 'g' });
        expect(e[0].message).toContain("'start'");
    });

    it('a file entry that names no template is an error', () => {
        expect(errors(fileOf({ files: [{ path: 'a.txt', entry: 'nope' }] }))[0].message).toContain("'nope'");
        expect(errors(fileOf({ files: [{ path: 'a.txt', entry: 'main' }, { path: 'a.txt', entry: 'main' }] }))).toHaveLength(1);
        expect(errors(fileOf({ targetProfile: 'c' }))).toHaveLength(1);
    });

    it('a duplicate name, a keyword name (not, implies), a builtin name and an unknown mode are errors of that template', () => {
        const t = (name: string, extra: Record<string, unknown> = {}) => ({ name, params: [], mode: 'expression', body: '"x"', ...extra });
        const e = errors(fileOf({}, [t('main'), t('main'), t('not'), t('implies'), t('now'), t('bin', { mode: 'binary' })]));
        expect(e.map(p => p.template)).toEqual(['main', 'bin', 'not', 'implies', 'now']);
        expect(e.every(p => p.generator === 'g')).toBe(true);
        expect(e[0].message).toBe('The name is taken by an earlier one.');
        expect(e[1].message).toBe('The mode is neither text nor expression.');
    });

    it('a body that does not parse is an error with its line and column (kills: parse positions dropped)', () => {
        const e = errors(fileOf({}, [{ name: 'main', params: [], mode: 'expression', body: '"a" +\n  )' }]));
        expect(e).toHaveLength(1);
        expect(e[0]).toMatchObject({ template: 'main', line: 2 });
        expect(typeof e[0].column).toBe('number');
    });

    it('one file with several errors reports all of them', () => {
        const text = fileOf({ formatVersion: '2.0', entry: 'start' }, [
            { name: 'main', params: [], mode: 'expression', body: '(' },
            { name: 'not', params: [], mode: 'expression', body: '"x"' },
        ]);
        expect(errors(text).length).toBe(4);
    });

    it('a call to a name nothing defines is a warning, not an error; parameters, lambda and forall variables and builtins are not (kills: binders ignored by the walker)', () => {
        const d = decodeGeneratorFile(fileOf({}, [
            { name: 'main', params: ['f'], mode: 'expression', body: 'f(1) + helper(2) + [1].map(g => g(3)).join("") + (forall h in [] : h(4)) + String(now())' },
        ]));
        expect(d.problems.filter(p => p.severity === 'error')).toEqual([]);
        expect(d.problems).toEqual([{ severity: 'warning', generator: 'g', template: 'main', message: 'main calls helper(), which is not a template of the generator.' }]);
    });

    it('unknown fields are one note, not an error', () => {
        const d = decodeGeneratorFile(fileOf({ author: 'A' }, [{ name: 'main', params: [], mode: 'expression', body: '"m"', doc: 'x' }]));
        expect(d.problems).toEqual([{ severity: 'note', generator: null, message: 'Ignored unknown fields: g: author, g › main: doc.' }]);
    });

    it('validateGenerator on an imported generator alone reports the engine problems', () => {
        const g: ImportedGenerator = { name: 'g', templates: [{ name: 'now', params: [], body: '"x"' }] };
        expect(validateGenerator(g).map(p => p.message)).toEqual(["Template name 'now' is a JjEL builtin"]);
    });
});

describe('planImport', () => {
    const gen = (name: string, metamodel?: string): ImportedGenerator => ({ ...(metamodel ? { metamodel } : {}), name, templates: [{ name: 'main', params: [], body: '"m"' }] });

    it('two generators for two metamodels write once each', () => {
        const plan = planImport([gen('a'), gen('b')], ['m1', 'm2'], none);
        expect(plan.errors).toEqual([]);
        expect(plan.writes.map(w => w.metamodelId)).toEqual(['m1', 'm2']);
    });

    it('two generators of the same name for the same metamodel fail as a whole (kills: duplicate check per write)', () => {
        const plan = planImport([gen('a'), gen('a'), gen('b')], ['m1', 'm1', 'm2'], none);
        expect(plan.errors).toEqual(['a: the file holds two generators of this name for the same metamodel.']);
        expect(plan.writes).toEqual([]);
        expect(plan.imported).toEqual([]);
    });

    it('a generator with no target chosen is an error', () => {
        expect(planImport([gen('a')], [null], none).errors).toEqual(['a: choose a target metamodel.']);
    });

    it('two new generators in one metamodel are one write holding both', () => {
        const plan = planImport([gen('a'), gen('b')], ['mm', 'mm'], none);
        expect(plan.writes).toHaveLength(1);
        const bag = apply({}, plan);
        expect(decodeGenerators(undefined, bag[GEN_GENERATORS_KEY]).generators.map(g => [g.id, g.name])).toEqual([['default', 'Default'], ['g1', 'a'], ['g2', 'b']]);
    });

    it('a generator named as the default collides with it; Replace keeps its id and name and writes genTemplates', () => {
        const plan = planImport([gen('Default')], ['mm'], none, { 0: 'replace' });
        expect(plan.collisions[0]).toMatchObject({ existingId: 'default', existingTemplates: 0, newName: 'Default 2' });
        expect(Object.keys(plan.writes[0].patch)).toContain(GEN_TEMPLATES_KEY);
        expect(plan.imported[0]).toMatchObject({ generatorId: 'default', name: 'Default' });
    });

    it('Replace of a generator whose open tab has drafts is refused, nothing written (kills: drafts ignored)', () => {
        const plan = planImport([gen('Default')], ['mm'], none, { 0: 'replace' }, (mm, id) => (mm === 'mm' && id === 'default' ? 2 : 0));
        expect(plan.errors).toEqual(['Default: Save or discard the drafts in the Templates tab first.']);
        expect(plan.writes).toEqual([]);
    });

    it('the new name skips names the metamodel and the file already hold', () => {
        const rawG = JSON.stringify({ v: 1, generators: [{ id: 'g1', name: 'a', files: [], target: 'none', templates: [] }, { id: 'g2', name: 'a 2', files: [], target: 'none', templates: [] }] });
        const plan = planImport([gen('a'), gen('a 3')], ['mm', 'mm'], () => keys(undefined, rawG));
        expect(plan.collisions.map(c => c.newName)).toEqual(['a 4']);
    });

    it('resolveImported reads absent metadata as the codec does for that id', () => {
        const d = resolveImported(gen('x'), DEFAULT_GENERATOR_ID).generator;
        expect([d.target, d.files]).toEqual(['js', [{ path: 'main.js', entry: 'main' }]]);
        const o = resolveImported(gen('x'), 'g7').generator;
        expect([o.target, o.files]).toEqual(['none', [{ path: 'x.txt', entry: 'main' }]]);
    });
});
