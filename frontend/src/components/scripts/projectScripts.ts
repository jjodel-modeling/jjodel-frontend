/**
 * Script files of a project — pure list operations (S6a, R-JJD-5).
 *
 * `DProject.scripts` is optional: every reader goes through `readScripts`, which answers `[]` for a
 * project saved before the field existed, exactly as `transformations` is read. Every operation
 * returns a new array and never mutates its input, so the caller writes the result back with one
 * `SetFieldAction` (see `scriptFiles.ts`).
 *
 * Names end in `.jjs`. A name already taken gets the project's ` (1)`, ` (2)` suffix, placed before
 * the extension: `a.jjs`, `a (1).jjs`, `a (2).jjs`.
 */
import type { DProjectScript } from '../../joiner/classes';

export const SCRIPT_EXTENSION = '.jjs';
const DEFAULT_BASE = 'script';

/** The scripts of `project`, `[]` when the field is absent. */
export function readScripts(project: { scripts?: DProjectScript[] } | null | undefined): DProjectScript[] {
    return project?.scripts || [];
}

/** `name` trimmed, with `.jjs` appended when it does not end in it; `script.jjs` when empty. */
export function scriptFileName(name: string | null | undefined): string {
    const trimmed = (name || '').trim();
    const base = trimmed.toLowerCase().endsWith(SCRIPT_EXTENSION)
        ? trimmed.slice(0, -SCRIPT_EXTENSION.length).trim()
        : trimmed;
    return (base || DEFAULT_BASE) + SCRIPT_EXTENSION;
}

/** `name` as a `.jjs` file name that no script of `scripts` holds, `exceptId` excluded. */
export function uniqueScriptName(name: string | null | undefined, scripts: ReadonlyArray<Pick<DProjectScript, 'id' | 'name'>>,
                                 exceptId?: string): string {
    const taken = new Set(scripts.filter(s => s.id !== exceptId).map(s => s.name));
    const file = scriptFileName(name);
    const base = file.slice(0, -SCRIPT_EXTENSION.length);
    let unique = file;
    for (let i = 1; taken.has(unique); i++) unique = `${base} (${i})${SCRIPT_EXTENSION}`;
    return unique;
}

export function newScriptId(): string {
    return 'Script_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export interface NewScript {
    name?: string;
    text: string;
    modelId?: string;
    generatedText?: string;
    level?: DProjectScript['level'];
    metamodelId?: string;
}

/** Append a new entry; returns the list and the entry. */
export function addScript(scripts: DProjectScript[], input: NewScript, now: number = Date.now(),
                          id: string = newScriptId()): { scripts: DProjectScript[]; entry: DProjectScript } {
    const entry: DProjectScript = { id, name: uniqueScriptName(input.name, scripts), text: input.text || '', updatedAt: now };
    if (input.modelId) entry.modelId = input.modelId;
    if (input.generatedText !== undefined) entry.generatedText = input.generatedText;
    if (input.level) entry.level = input.level;
    if (input.level === 'M1' && input.metamodelId) entry.metamodelId = input.metamodelId;
    return { scripts: [...scripts, entry], entry };
}

/**
 * The target of a Refactoring (R-JJD-14), read with defaults: an entry without `level` changes
 * any level, an M1 entry without `metamodelId` the models of any metamodel.
 */
export interface RefactoringTarget {
    level?: 'M2' | 'M1';
    metamodelId?: string;
}

export function readTarget(entry: Pick<DProjectScript, 'level' | 'metamodelId'> | null | undefined): RefactoringTarget {
    const level = entry?.level === 'M2' || entry?.level === 'M1' ? entry.level : undefined;
    return level === 'M1' && entry?.metamodelId ? { level, metamodelId: entry.metamodelId } : { level };
}

/** A model or metamodel of the project, as the target rules read it. */
export interface TargetCandidate {
    id: string;
    name: string;
    isMetamodel: boolean;
    /** The metamodel of an M1. */
    metamodelId?: string;
}

/** The target a script planned on `model` gets: the metamodel level, or the models of its metamodel. */
export function targetOfModel(model: Pick<TargetCandidate, 'isMetamodel' | 'metamodelId'> | null | undefined): RefactoringTarget {
    if (!model) return {};
    if (model.isMetamodel) return { level: 'M2' };
    return model.metamodelId ? { level: 'M1', metamodelId: model.metamodelId } : { level: 'M1' };
}

/**
 * The candidates a Refactoring with `target` may run on, in input order. Any level lists the
 * models first and the metamodels after, so the first choice stays the first model.
 */
export function compatibleModels<T extends TargetCandidate>(candidates: ReadonlyArray<T>, target: RefactoringTarget): T[] {
    if (target.level === 'M2') return candidates.filter(c => c.isMetamodel);
    if (target.level === 'M1') {
        return candidates.filter(c => !c.isMetamodel && (!target.metamodelId || c.metamodelId === target.metamodelId));
    }
    return [...candidates.filter(c => !c.isMetamodel), ...candidates.filter(c => c.isMetamodel)];
}

/**
 * The Refactorings that may run on `artifact`, in project order: the menu of the artifact's tab
 * (R-JJD-14). The same rule as `compatibleModels`, read from the artifact's side.
 */
export function refactoringsForArtifact<S extends Pick<DProjectScript, 'level' | 'metamodelId'>>(
    scripts: ReadonlyArray<S>, artifact: Pick<TargetCandidate, 'id' | 'name' | 'isMetamodel' | 'metamodelId'>): S[] {
    return scripts.filter(s => compatibleModels([artifact], readTarget(s)).length > 0);
}

/** The target as the Refactoring tab shows it under the title. */
export function targetLabel(target: RefactoringTarget, metamodelName?: string): string {
    if (target.level === 'M2') return 'Metamodel';
    if (target.level === 'M1') return target.metamodelId ? `Model of ${metamodelName || 'a missing metamodel'}` : 'Model';
    return 'Any level';
}

/** Rename entry `id`; the list unchanged (same array) when there is no such entry. */
export function renameScript(scripts: DProjectScript[], id: string, name: string, now: number = Date.now()): DProjectScript[] {
    if (!scripts.some(s => s.id === id)) return scripts;
    const unique = uniqueScriptName(name, scripts, id);
    return scripts.map(s => (s.id === id ? { ...s, name: unique, updatedAt: now } : s));
}

export type ScriptPatch = Partial<Pick<DProjectScript, 'text' | 'modelId' | 'generatedText'>>;

/** Update text, model or generated text of entry `id`; the list unchanged when there is no such entry. */
export function updateScript(scripts: DProjectScript[], id: string, patch: ScriptPatch, now: number = Date.now()): DProjectScript[] {
    if (!scripts.some(s => s.id === id)) return scripts;
    return scripts.map(s => (s.id === id ? { ...s, ...patch, id: s.id, name: s.name, updatedAt: now } : s));
}

/** Remove entry `id`; the list unchanged when there is no such entry. */
export function removeScript(scripts: DProjectScript[], id: string): DProjectScript[] {
    return scripts.some(s => s.id === id) ? scripts.filter(s => s.id !== id) : scripts;
}

export function findScript(scripts: DProjectScript[], id: string): DProjectScript | undefined {
    return scripts.find(s => s.id === id);
}
