/**
 * generatorTransfer — the write path of a generator import and the downloads of an export (P-2026-10-30-1515). The
 * joiner is a fake: `store.getState()` reads a hand-made idlookup, `LPointerTargetable.fromPointer(id).state = patch`
 * records the assignment, `U.download` records the file. Mutations each test kills are in its name; the bench is in
 * the commit body.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { beforeEach, describe, it, expect, vi } from 'vitest';

const fake = vi.hoisted(() => ({
    idlookup: {} as Record<string, any>,
    writes: [] as { id: string; patch: Record<string, string> }[],
    downloads: [] as { name: string; text: string; mime: string }[],
}));

vi.mock('../../../joiner', () => ({
    store: { getState: () => ({ idlookup: fake.idlookup }) },
    LPointerTargetable: {
        fromPointer: (id: string) => ({
            set state(patch: Record<string, string>) {
                fake.writes.push({ id, patch });
                fake.idlookup[id] = { ...fake.idlookup[id], _state: { ...fake.idlookup[id]?._state, ...patch } };
            },
        }),
    },
    U: { download: (name: string, text: string, mime: string) => fake.downloads.push({ name, text, mime }) },
}));

import { applyImportPlan, exportAllGenerators, exportGenerator, generatorsOf, storedGenerators } from '../generatorTransfer';
import { decodeGeneratorFile, planImport } from '../../engine/generatorFile';
import { encodeTemplates } from '../../engine/templateCodec';

const SMV = readFileSync(join(__dirname, '../../engine/__tests__/fixtures/generator-smv.json'), 'utf8');
const VERILOG = readFileSync(join(__dirname, '../../engine/__tests__/fixtures/generator-verilog.json'), 'utf8');
const smv = () => decodeGeneratorFile(SMV).generators;
const verilog = () => decodeGeneratorFile(VERILOG).generators;

beforeEach(() => {
    fake.idlookup = { mm: { _state: {} }, mm2: { _state: {} } };
    fake.writes = [];
    fake.downloads = [];
});

describe('import', () => {
    it('into an empty metamodel is one state assignment holding genGenerators alone (kills: writes per imported generator instead of per metamodel)', () => {
        expect(applyImportPlan(planImport([...smv(), ...verilog()], ['mm', 'mm'], storedGenerators))).toBe(true);
        expect(fake.writes).toHaveLength(1);
        expect(Object.keys(fake.writes[0].patch)).toEqual(['genGenerators']);
        expect(generatorsOf('mm').map(g => g.name)).toEqual(['Default', 'smv', 'verilog']);
    });

    it('into two metamodels is one assignment each', () => {
        applyImportPlan(planImport([...smv(), ...verilog()], ['mm', 'mm2'], storedGenerators));
        expect(fake.writes.map(w => w.id)).toEqual(['mm', 'mm2']);
    });

    it('a Replace is one assignment, the generator keeping its id', () => {
        applyImportPlan(planImport(smv(), ['mm'], storedGenerators));
        const id = generatorsOf('mm')[1].id;
        const changed = [{ ...smv()[0], templates: smv()[0].templates.slice(0, 3) }];
        fake.writes = [];
        expect(applyImportPlan(planImport(changed, ['mm'], storedGenerators, { 0: 'replace' }))).toBe(true);
        expect(fake.writes).toHaveLength(1);
        expect(generatorsOf('mm').map(g => [g.id, g.name, g.templates.length])).toEqual([['default', 'Default', 0], [id, 'smv', 3]]);
    });

    it('is refused while the open tab of the replaced generator has drafts, nothing written (kills: plan errors ignored by the writer)', () => {
        fake.idlookup.mm._state.genTemplates = encodeTemplates([{ name: 'main', params: [], body: '"m"' }]);
        const plan = planImport([{ name: 'Default', templates: [] }], ['mm'], storedGenerators, { 0: 'replace' }, () => 1);
        expect(plan.errors).toEqual(['Default: Save or discard the drafts in the Templates tab first.']);
        expect(applyImportPlan({ ...plan, writes: [{ metamodelId: 'mm', patch: { genTemplates: '[]' } }] })).toBe(false);
        expect(fake.writes).toEqual([]);
    });
});

describe('export', () => {
    it('one generator downloads <metamodel>.<generator>.generator.json as JSON, from the stored list', () => {
        applyImportPlan(planImport(smv(), ['mm'], storedGenerators));
        expect(exportGenerator({ id: 'mm', name: 'SyncRTL' }, generatorsOf('mm')[1].id)).toBe(true);
        expect(fake.downloads).toHaveLength(1);
        expect(fake.downloads[0].name).toBe('SyncRTL.smv.generator.json');
        expect(fake.downloads[0].mime).toBe('application/json');
        expect(JSON.parse(fake.downloads[0].text).templates).toHaveLength(11);
    });

    it('a generator with no template is not exported (kills: empty generators exported)', () => {
        expect(exportGenerator({ id: 'mm', name: 'SyncRTL' }, 'default')).toBe(false);
        expect(fake.downloads).toEqual([]);
    });

    it('Export all is one array of every generator with a template, and nothing when there is none', () => {
        expect(exportAllGenerators('P', [{ id: 'mm', name: 'A' }, { id: 'mm2', name: 'B' }])).toBe(0);
        expect(fake.downloads).toEqual([]);
        applyImportPlan(planImport([...smv(), ...verilog()], ['mm', 'mm2'], storedGenerators));
        expect(exportAllGenerators('P', [{ id: 'mm', name: 'A' }, { id: 'mm2', name: 'B' }])).toBe(2);
        expect(fake.downloads[0].name).toBe('P.generators.json');
        expect(JSON.parse(fake.downloads[0].text).map((d: any) => [d.metamodel, d.generator])).toEqual([['A', 'smv'], ['B', 'verilog']]);
    });
});
