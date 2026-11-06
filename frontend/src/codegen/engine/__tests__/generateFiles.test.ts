/**
 * generateFiles — a generator's generation per file, with its target (slice G2, P-2026-10-24-0002; R-GEN-33,
 * R-GEN-34, R-GEN-36, R-GEN-41).
 *
 * The lecture examples of codegen/examples/ with the synthetic record of the oracle tests (exampleFixture.ts). The
 * default generator, read by the codec from a 3.2 bag, generates what today's `generate` does with the entry `main`,
 * code, map and errors compared by sha256; a generator's target `none` binds `target` to null; each file has its own
 * entry; every model fragment names the template that wrote it. Mutations each test kills are in its name; the bench
 * is in the commit body.
 */

import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { generate } from '../generate';
import { generateGenerator } from '../generateFiles';
import { DEFAULT_GENERATOR_ID, readModelGenerators } from '../generatorCodec';
import type { GeneratorRecord, GeneratorTarget } from '../generatorCodec';
import type { GenerateResult } from '../generate';
import type { TemplateRecord } from '../templates';
import { GEN_TEMPLATES_KEY } from '../templateCodec';
import { EXAMPLES, loadExample, recordOf } from '../../oracle/__tests__/exampleFixture';

const sha = (v: unknown): string => createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex');
const digest = (r: GenerateResult) => ({ code: sha(r.code), map: sha(r.map), errors: sha(r.errors) });

function probe(templates: TemplateRecord[], files: { path: string; entry: string }[], target: GeneratorTarget): GeneratorRecord {
    return { id: 'g1', name: 'Probe', root: files[0].entry, files, target, templates };
}

describe.each(EXAMPLES)('the default generator of %s', name => {
    it('generates code, map and errors sha256-identical to generate with the entry main (mutant: root fallback changed)', () => {
        const ex = loadExample(name);
        const def = readModelGenerators(ex.lookup, ex.modelId).generators[0];
        expect(def.id).toBe(DEFAULT_GENERATOR_ID);
        const out = generateGenerator(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, def);
        expect(out.generatorId).toBe(DEFAULT_GENERATOR_ID);
        expect(out.files.map(f => [f.path, f.entry])).toEqual([['main.js', 'main']]);
        const today = generate(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, def.templates, 'main');
        expect(today.errors).toEqual([]);
        expect(today.code).toMatch(/export function main\(\)/);
        expect(digest(out.files[0].result)).toEqual(digest(today));
    });

    it('still enters main when main is not the first template (mutant: root fallback changed)', () => {
        const ex = loadExample(name);
        const bag = ex.lookup[ex.metamodelId]._state;
        const stored = JSON.parse(bag[GEN_TEMPLATES_KEY]);
        stored.templates = [...stored.templates.filter((t: TemplateRecord) => t.name !== 'main'), ...stored.templates.filter((t: TemplateRecord) => t.name === 'main')];
        bag[GEN_TEMPLATES_KEY] = JSON.stringify(stored);
        const def = readModelGenerators(ex.lookup, ex.modelId).generators[0];
        expect(def.templates[0].name).not.toBe('main');
        const out = generateGenerator(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, def);
        const today = generate(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, def.templates, 'main');
        expect(out.files[0].entry).toBe('main');
        expect(digest(out.files[0].result)).toEqual(digest(today));
    });
});

describe('the generator\'s target', () => {
    const T: TemplateRecord = { name: 'probe', params: [], body: '"${target == null}"' };
    const run = (target: GeneratorTarget) => {
        const ex = loadExample('turnstile');
        return generateGenerator(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, probe([T], [{ path: 'probe.txt', entry: 'probe' }], target));
    };

    it('none binds target to null (mutant: jsTarget always built)', () => {
        const out = run('none').files[0].result;
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('true');
    });

    it('js builds it, the control of the probe above', () => {
        const out = run('js').files[0].result;
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('false');
    });
});

describe('a generator with two files', () => {
    it('produces two results, each with its own entry (mutant: one entry for all files)', () => {
        const ex = loadExample('turnstile');
        const templates: TemplateRecord[] = [{ name: 'a', params: [], body: '"A"' }, { name: 'b', params: [], body: '"B"' }];
        const g = probe(templates, [{ path: 'a.txt', entry: 'a' }, { path: 'b.txt', entry: 'b' }], 'none');
        const out = generateGenerator(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, g);
        expect(out.generatorId).toBe('g1');
        expect(out.files.map(f => [f.path, f.entry, f.result.code, f.result.hasErrors])).toEqual([['a.txt', 'a', 'A', false], ['b.txt', 'b', 'B', false]]);
    });
});

describe('the template of a model fragment', () => {
    it('every model fragment of the turnstile output names a template of the list (mutant: the field not filled)', () => {
        const ex = loadExample('turnstile');
        const def = readModelGenerators(ex.lookup, ex.modelId).generators[0];
        const out = generateGenerator(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, def).files[0].result;
        const names = new Set(def.templates.map(t => t.name));
        const model = out.text.fragments.filter(f => f.origin.kind === 'model');
        expect(model.length).toBeGreaterThan(0);
        const unnamed = model.filter(f => f.origin.kind !== 'model' || typeof f.origin.template !== 'string' || !names.has(f.origin.template));
        expect(unnamed.map(f => f.text)).toEqual([]);
    });
});
