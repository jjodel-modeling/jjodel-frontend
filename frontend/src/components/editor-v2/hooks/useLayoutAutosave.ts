import { useCallback, useEffect, useRef } from 'react';
import { DUser, LProject } from '../../../joiner';
import { ProjectsApi } from '../../../api/persistance';

/**
 * Autosave of the v2-flow node layout.
 *
 * The v2-flow drag handler commits node positions to the D-layer (DVertex.x/y)
 * but the project is only serialized to disk on an explicit save (Ctrl+S /
 * toolbar). Without persistence, a Close Project → reload discards the moved
 * coordinates and the auto-populate regenerates nodes on the default grid.
 *
 * This hook bridges that gap: `scheduleLayoutSave()` debounces and coalesces
 * rapid drags into a single full project save, gated by the current user's
 * `autosaveLayout` preference. It reuses the existing `ProjectsApi.save` path
 * (full state serialization) — no new persistence infrastructure.
 *
 * A pending save in the debounce window is flushed on unmount, so a node moved
 * just before closing the metamodel tab is not lost.
 */
const AUTOSAVE_DEBOUNCE_MS = 1000;

export function useLayoutAutosave(): { scheduleLayoutSave: () => void } {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSavingRef = useRef(false);
    // Set when a save is requested while another is already in flight, so the
    // in-flight save's completion triggers exactly one more save (no overlap,
    // no lost final state).
    const pendingRef = useRef(false);

    const runSave = useCallback(async (): Promise<void> => {
        const project = LProject.getProject();
        // Gate: respect the user-level autosaveLayout preference. Default-on;
        // off only when the current user explicitly disables it (undefined/true
        // → autosave active). The project is still required as the save target.
        const user = DUser.getUser();
        if (!project || user?.autosaveLayout === false) {
            pendingRef.current = false;
            return;
        }
        // Concurrency guard: never overlap saves. Remember the request and
        // replay it once the in-flight save resolves.
        if (isSavingRef.current) {
            pendingRef.current = true;
            return;
        }
        isSavingRef.current = true;
        pendingRef.current = false;
        try {
            await ProjectsApi.save(project);
        } catch (e) {
            console.warn('[useLayoutAutosave] Layout autosave failed:', e);
        } finally {
            isSavingRef.current = false;
            if (pendingRef.current) {
                pendingRef.current = false;
                void runSave();
            }
        }
    }, []);

    const scheduleLayoutSave = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            void runSave();
        }, AUTOSAVE_DEBOUNCE_MS);
    }, [runSave]);

    // Flush-on-unmount: if a debounced save is still pending when the editor
    // unmounts (e.g. tab closed shortly after a drag), run it now instead of
    // dropping it.
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
                void runSave();
            }
        };
    }, [runSave]);

    return { scheduleLayoutSave };
}
