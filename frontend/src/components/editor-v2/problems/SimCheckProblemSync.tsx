/**
 * Producer that mirrors the simulator's guard and action checks into the NodeProblem
 * registry (P-2026-09-27-1805). Mounts once at the EditorV2 root next to
 * ConformanceProblemSync; returns null. The rules and the mapping live in
 * `simCheckToProblems.ts`, pure and tested; this file only reads the store.
 *
 * Reactivity: a `useSelector` signature, `''` unless the open model is an M1 whose
 * metamodel binds a guard or action role, otherwise the run's own signature (R-SIM-34).
 * A change waits 500 ms, as `useConformance`, then runs the bridge's `startRun` on the
 * store's lookup with `buildEvalContext`, the call the panel's Reset makes.
 *
 * Cleanup: the model's entries are cleared outright on unmount and on a model switch,
 * as ConformanceProblemSync does on unmount.
 */

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DUser, LPointerTargetable, store } from '../../../joiner';
import type { DState } from '../../../joiner';
import { buildEvalContext } from '../../../jjscript';
import { buildVertexResolver } from './vertexResolver';
import {
    clearSimCheckProblems, reconcileSimCheckProblems, resolveSimCheckProblems, simCheckSignature,
} from './simCheckToProblems';

interface Props {
    modelid: string | undefined;
    graphId: string | null | undefined;
}

const SIM_CHECK_DEBOUNCE_MS = 500;

/**
 * The project of the current user, the id the panel's Reset hands `startRun`: the same
 * body as `projectIdOfUser` in `sim/SimulationPanel.tsx`, which is private to that file.
 */
function projectIdOfUser(): string {
    try {
        return (LPointerTargetable.fromPointer(DUser.current as any) as any)?.project?.id ?? '';
    } catch {
        return '';
    }
}

export function SimCheckProblemSync({ modelid, graphId }: Props) {
    const sig = useSelector((state: DState) =>
        modelid ? simCheckSignature(((state as any)?.idlookup ?? {}) as Record<string, any>, modelid) : '');

    useEffect(() => {
        if (!modelid) return;
        const timer = setTimeout(() => {
            if (sig === '') {
                // Nothing bound, nothing checked: what this model registered before stands no more.
                resolveSimCheckProblems(modelid);
                return;
            }
            const lookup = ((store.getState() as any).idlookup ?? {}) as Record<string, any>;
            reconcileSimCheckProblems(lookup, modelid, projectIdOfUser(), buildEvalContext, buildVertexResolver(lookup, graphId));
        }, SIM_CHECK_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [modelid, graphId, sig]);

    // Full cleanup when the editor closes or switches model: nothing stale bleeds into the next.
    useEffect(() => {
        return () => {
            if (modelid) clearSimCheckProblems(modelid);
        };
    }, [modelid]);

    return null;
}
