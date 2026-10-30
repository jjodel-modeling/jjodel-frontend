/**
 * generateFiles — a generator's generation, one result per declared file (slice G2, P-2026-10-24-0002; R-GEN-33,
 * R-GEN-34, R-GEN-36, discovery_2026-10-23_codegen_generator_viewpoint §1.3, §1.5, §8 row G2).
 *
 * `generateGenerator(globals, lookup, modelId, generator, options)` runs `generate` once per file of the generator,
 * with that file's entry over the generator's own template list and the generator's target: `js` builds the
 * JavaScript target as `generate` always did, `none` binds `target` to null. The files come resolved from the
 * generator codec, so a generator with no declared metadata is one file whose entry is `main`, else the first
 * template (R-GEN-33). The generator id is on the result, not on the fragments (R-GEN-36); the template name is on
 * every fragment's origin (text.ts).
 *
 * Each file is its own generation, with its own budget. Pure: the engine.
 */

import type { JjelValue } from '../../jjel';
import { generate } from './generate';
import type { GenerateResult } from './generate';
import type { GeneratorRecord } from './generatorCodec';
import type { GenerationLimits } from './text';

type Lookup = Record<string, any>;

export interface GenerateFilesOptions {
    readonly args?: readonly JjelValue[];
    readonly limits?: GenerationLimits;
}

/** One declared file and its generation. */
export interface GeneratedFile {
    readonly path: string;
    readonly entry: string;
    readonly result: GenerateResult;
}

export interface GeneratorResult {
    readonly generatorId: string;
    readonly files: readonly GeneratedFile[];
}

export function generateGenerator(
    globals: Record<string, JjelValue>,
    lookup: Lookup,
    modelId: string,
    generator: GeneratorRecord,
    options: GenerateFilesOptions = {},
): GeneratorResult {
    const files = generator.files.map(f => ({
        path: f.path,
        entry: f.entry,
        result: generate(globals, lookup, modelId, generator.templates, f.entry, options.args ?? [], options.limits ?? {}, generator.target),
    }));
    return { generatorId: generator.id, files };
}
