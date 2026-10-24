/**
 * Script files of the open project, against the store (S6a, R-JJD-5).
 *
 * The list lives on `DProject.scripts` and is written back whole with one `SetFieldAction`, the way
 * `ProjectEditor` writes `transformations`, so the project save carries it with no extra step.
 * The list operations themselves are pure, in `projectScripts.ts`.
 */
import type { DProjectScript } from '../../joiner/classes';
import type { DModel, DProject } from '../../joiner';
import { LModel, SetFieldAction, U, store } from '../../joiner';
import { JjodelEvents } from '../../events/registry';
import DockManager from '../abstract/DockManager';
import { addScript, findScript, readScripts, renameScript, removeScript, updateScript, type ScriptPatch } from './projectScripts';

/** Wait before asking a canvas that `open2` has just mounted for the preview: its listener installs on mount. */
const PREVIEW_AFTER_OPEN_MS = 350;

function projectId(): string | undefined {
    return U.getProjectID_URL() || undefined;
}

function dProject(state: any = store.getState()): DProject | undefined {
    const id = projectId();
    return id ? (state.idlookup?.[id] as DProject | undefined) : undefined;
}

/** The scripts of the open project, `[]` when there is none or the field is absent. */
export function readProjectScripts(state?: any): DProjectScript[] {
    return readScripts(dProject(state));
}

export function readProjectScript(scriptId: string, state?: any): DProjectScript | undefined {
    return findScript(readProjectScripts(state), scriptId);
}

function writeProjectScripts(next: DProjectScript[]): boolean {
    const id = projectId() as DProject['id'] | undefined;
    if (!id) return false;
    SetFieldAction.new(id, 'scripts', next as any, '', false);
    return true;
}

export function saveProjectScript(scriptId: string, patch: ScriptPatch): void {
    const list = readProjectScripts();
    const next = updateScript(list, scriptId, patch);
    if (next !== list) writeProjectScripts(next);
}

export function renameProjectScript(scriptId: string, name: string): void {
    const list = readProjectScripts();
    const next = renameScript(list, scriptId, name);
    if (next !== list) writeProjectScripts(next);
}

export function removeProjectScript(scriptId: string): void {
    const list = readProjectScripts();
    const next = removeScript(list, scriptId);
    if (next !== list) writeProjectScripts(next);
}

/** The M1 models of the open project, as `{ id, name }`, in project order. */
export function projectM1Models(state: any = store.getState()): { id: string; name: string }[] {
    const ids = (dProject(state)?.models || []) as string[];
    return ids
        .map(id => state.idlookup?.[id] as DModel | undefined)
        .filter((m): m is DModel => !!m && !m.isMetamodel)
        .map(m => ({ id: m.id as string, name: m.name || (m.id as string) }));
}

/**
 * Store `text` as a new script file of the open project and open it in its editor tab. Called by
 * Jjodie's `Open as file` (S2) and `Save as file` (S5). Returns the entry, or undefined when no
 * project is open.
 */
export function openScriptAsFile(text: string, suggestedName: string, modelId?: string): DProjectScript | undefined {
    const { scripts, entry } = addScript(readProjectScripts(), { name: suggestedName, text, modelId });
    if (!writeProjectScripts(scripts)) return undefined;
    DockManager.openScript(entry.id);
    return entry;
}

/**
 * Run `text` on `modelId` as the S4b preview: open the model's canvas, then ask it for the ghost
 * preview through `SCRIPT_PREVIEW_REQUEST`. The user applies or discards from the canvas bar.
 */
export async function runScriptOnModel(text: string, modelId: string): Promise<void> {
    const model = LModel.fromPointer(modelId as any) as LModel | undefined;
    if (!model) return;
    await DockManager.open2(model);
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent(JjodelEvents.SCRIPT_PREVIEW_REQUEST, { detail: { script: text, modelId } }));
    }, PREVIEW_AFTER_OPEN_MS);
}
