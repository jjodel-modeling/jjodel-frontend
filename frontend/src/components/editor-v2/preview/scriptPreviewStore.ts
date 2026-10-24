/**
 * Script preview store — the one planned preview the canvas shows (S4b, R-JJD-2).
 *
 * Holds the script text, the target M1 model, the world it was planned against and the plan
 * (`planEffects`, read-only). Set by `JjodelEvents.SCRIPT_PREVIEW_REQUEST`, so that the script
 * card (S2) and the script editor (S5) can drive it; cleared by Discard, by Apply, and when the
 * model the plan was read against changes (`isPreviewStale`). Outside Redux on purpose: a preview
 * is not model data, never persisted and never undone.
 *
 * A request supersedes the one before it, also while that one is still planning: the plan of a
 * stale request is dropped.
 */
import { useSyncExternalStore } from 'react';
import { planEffects, type EffectsPlan, type PlanWorld } from '../../../jjscript/executor/effectsPlanner';
import { buildPlanWorld } from '../../../jjscript/executor/planWorld';
import { JjodelEvents } from '../../../events/registry';

type Idlookup = Record<string, any>;

/** Detail of `JjodelEvents.SCRIPT_PREVIEW_REQUEST`. An empty script clears the preview. */
export interface ScriptPreviewRequest {
    script: string;
    modelId: string;
}

export interface ScriptPreview {
    script: string;
    modelId: string;
    world: PlanWorld;
    /** The world, serialized: the model as the plan read it. */
    worldKey: string;
    plan: EffectsPlan;
    /** Apply is running: the model changes under it, and that does not clear the preview. */
    applying: boolean;
}

let current: ScriptPreview | null = null;
let generation = 0;
const listeners = new Set<() => void>();

function emit(): void {
    for (const l of [...listeners]) l();
}

export function subscribeScriptPreview(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

export function getScriptPreview(): ScriptPreview | null {
    return current;
}

/** Clear the preview; with `modelId`, only when it is that model's. Drops a request in flight. */
export function clearScriptPreview(modelId?: string): void {
    if (modelId !== undefined && current && current.modelId !== modelId) return;
    generation++;
    if (!current) return;
    current = null;
    emit();
}

export function setScriptPreviewApplying(applying: boolean): void {
    if (!current || current.applying === applying) return;
    current = { ...current, applying };
    emit();
}

export function worldKeyOf(world: PlanWorld): string {
    return JSON.stringify(world);
}

/** Plan `request.script` against the model as `idlookup` holds it and make it the preview. */
export async function requestScriptPreview(request: ScriptPreviewRequest, idlookup: Idlookup): Promise<ScriptPreview | null> {
    if (!request?.script?.trim() || !request.modelId) {
        clearScriptPreview();
        return null;
    }
    const mine = ++generation;
    const world = buildPlanWorld(idlookup, request.modelId);
    const plan = await planEffects(request.script, world);
    if (mine !== generation) return null;
    current = { script: request.script, modelId: request.modelId, world, worldKey: worldKeyOf(world), plan, applying: false };
    emit();
    return current;
}

/** True when the model of `preview` no longer reads as the world it was planned against. */
export function isPreviewStale(preview: ScriptPreview, idlookup: Idlookup): boolean {
    if (preview.applying) return false;
    if (!idlookup?.[preview.modelId]) return true;
    return worldKeyOf(buildPlanWorld(idlookup, preview.modelId)) !== preview.worldKey;
}

let installed = 0;
let detach: (() => void) | null = null;

/**
 * Listen to `SCRIPT_PREVIEW_REQUEST` while at least one canvas is mounted; `readIdlookup` reads
 * the store at request time. Reference-counted: every canvas installs it, one listener runs.
 */
export function installScriptPreviewListener(readIdlookup: () => Idlookup): () => void {
    if (installed++ === 0) {
        const onRequest = (e: Event) => {
            const detail = (e as CustomEvent<ScriptPreviewRequest>).detail;
            requestScriptPreview(detail, readIdlookup()).catch((err) => {
                console.warn('[scriptPreviewStore] Could not plan the script preview.', err);
            });
        };
        window.addEventListener(JjodelEvents.SCRIPT_PREVIEW_REQUEST, onRequest);
        detach = () => window.removeEventListener(JjodelEvents.SCRIPT_PREVIEW_REQUEST, onRequest);
    }
    let done = false;
    return () => {
        if (done) return;
        done = true;
        if (--installed === 0) {
            detach?.();
            detach = null;
        }
    };
}

/** The preview of `modelId`, or null when there is none or it belongs to another model. */
export function useScriptPreview(modelId: string | undefined): ScriptPreview | null {
    return useSyncExternalStore(subscribeScriptPreview, () => (current && modelId && current.modelId === modelId ? current : null));
}
