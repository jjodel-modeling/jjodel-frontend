/**
 * generatorTransfer — generators out of the store into a file, and a planned import into the store
 * (P-2026-10-30-1430, P-2026-10-30-1515; discovery_2026-10-30_generator_import_export §1, §5).
 *
 * Export reads the stored generators (never a tab's drafts) and downloads them with `U.download`, the helper the
 * project exports use: one generator as `<metamodel>.<generator>.generator.json`, every generator with at least one
 * template of the project's metamodels as `<project>.generators.json`, an array. Import writes the plan of
 * `planImport` (engine/generatorFile.ts): one `state` assignment per metamodel, the one the Templates tab's Save
 * makes, so one undo step per metamodel and no outer TRANSACTION. The writer is injectable for tests.
 */

import { LPointerTargetable, store, U } from '../../joiner';
import { GEN_TEMPLATES_KEY } from '../engine/templateCodec';
import { decodeGenerators, GEN_GENERATORS_KEY } from '../engine/generatorCodec';
import { encodeGeneratorFile, generatorDocument, generatorFileName, projectGeneratorsFileName } from '../engine/generatorFile';
import type { GeneratorRecord } from '../engine/generatorCodec';
import type { GeneratorDocument, ImportPlan, StoredGenerators } from '../engine/generatorFile';

const MIME = 'application/json';

/** A metamodel of the project: its id and name. */
export interface MetamodelRef {
    readonly id: string;
    readonly name: string;
}

/** Writes one patch on a metamodel's bag. */
export type PatchWriter = (metamodelId: string, patch: Record<string, string>) => void;

/** The `state` setter of the metamodel, as Save writes it. */
export const storeWriter: PatchWriter = (metamodelId, patch) => {
    (LPointerTargetable.fromPointer(metamodelId as any) as any).state = patch;
};

const storedKey = (v: unknown): string | null | undefined => (typeof v === 'string' ? v : v === undefined || v === null ? v : String(v));

/** The two keys of a metamodel's bag, from the store. */
export function storedGenerators(metamodelId: string): StoredGenerators {
    const bag = (store.getState() as any).idlookup?.[metamodelId]?._state;
    return { rawTemplates: storedKey(bag?.[GEN_TEMPLATES_KEY]), rawGenerators: storedKey(bag?.[GEN_GENERATORS_KEY]) };
}

/** True when the metamodel holds either key: a metamodel holding neither has no generator to list. */
export function hasGeneratorKeys(metamodelId: string): boolean {
    const keys = storedGenerators(metamodelId);
    return keys.rawTemplates != null || keys.rawGenerators != null;
}

/** The stored generators of a metamodel, the default first. */
export function generatorsOf(metamodelId: string): GeneratorRecord[] {
    const keys = storedGenerators(metamodelId);
    return decodeGenerators(keys.rawTemplates, keys.rawGenerators).generators;
}

/** Downloads one stored generator; false when it is gone or has no template. */
export function exportGenerator(metamodel: MetamodelRef, generatorId: string): boolean {
    const g = generatorsOf(metamodel.id).find(x => x.id === generatorId);
    if (!g || g.templates.length === 0) return false;
    U.download(generatorFileName(metamodel.name, g.name), encodeGeneratorFile(generatorDocument(metamodel.name, g)), MIME);
    return true;
}

/** The file objects of every generator with at least one template, metamodel by metamodel. */
export function exportableDocuments(metamodels: readonly MetamodelRef[]): GeneratorDocument[] {
    return metamodels.flatMap(mm => generatorsOf(mm.id).filter(g => g.templates.length > 0).map(g => generatorDocument(mm.name, g)));
}

/** Downloads every exportable generator of the project in one file; the number exported, 0 when there was none. */
export function exportAllGenerators(project: string, metamodels: readonly MetamodelRef[]): number {
    const docs = exportableDocuments(metamodels);
    if (docs.length > 0) U.download(projectGeneratorsFileName(project), encodeGeneratorFile(docs), MIME);
    return docs.length;
}

/** Writes a plan with no error: one patch per metamodel. False, and nothing written, when it has errors. */
export function applyImportPlan(plan: ImportPlan, write: PatchWriter = storeWriter): boolean {
    if (plan.errors.length > 0) return false;
    for (const w of plan.writes) write(w.metamodelId, w.patch);
    return true;
}
