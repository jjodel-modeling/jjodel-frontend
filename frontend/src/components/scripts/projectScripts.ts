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
}

/** Append a new entry; returns the list and the entry. */
export function addScript(scripts: DProjectScript[], input: NewScript, now: number = Date.now(),
                          id: string = newScriptId()): { scripts: DProjectScript[]; entry: DProjectScript } {
    const entry: DProjectScript = { id, name: uniqueScriptName(input.name, scripts), text: input.text || '', updatedAt: now };
    if (input.modelId) entry.modelId = input.modelId;
    if (input.generatedText !== undefined) entry.generatedText = input.generatedText;
    return { scripts: [...scripts, entry], entry };
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
