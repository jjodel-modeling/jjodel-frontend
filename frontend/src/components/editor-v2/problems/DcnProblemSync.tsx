/**
 * Producer that mirrors the DCN well-formedness checks (spec §5, P-2026-11-07-1825) into the
 * NodeProblem registry. Mounts once at the EditorV2 root next to SimCheckProblemSync; returns
 * null. The rules live in `model/dcn/dcnWellFormedness.ts` and the mapping in
 * `dcnToProblems.ts`, pure and tested; this file only reads the store.
 *
 * Reactivity: a `useSelector` signature, `''` unless the open model's metamodel binds the dcn
 * roles, otherwise the run's own signature (R-SIM-34) and the bindings. A change waits 500 ms,
 * as `useConformance`, then checks the store's lookup.
 *
 * Cleanup: the model's entries are cleared outright on unmount and on a model switch, once the
 * last editor on the model lets go (`acquireProducerMount`, multi-tab L4b): another tab on the
 * same model keeps its badges.
 */

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { store } from '../../../joiner';
import type { DState } from '../../../joiner';
import { buildVertexResolver } from './vertexResolver';
import { acquireProducerMount } from './registry';
import { clearDcnProblems, dcnSignature, reconcileDcnProblems, resolveDcnProblems } from './dcnToProblems';

interface Props {
    modelid: string | undefined;
    graphId: string | null | undefined;
}

const DCN_DEBOUNCE_MS = 500;

export function DcnProblemSync({ modelid, graphId }: Props) {
    const sig = useSelector((state: DState) =>
        modelid ? dcnSignature(((state as any)?.idlookup ?? {}) as Record<string, any>, modelid) : '');

    useEffect(() => {
        if (!modelid) return;
        const timer = setTimeout(() => {
            if (sig === '') {
                // No dcn role bound, nothing checked: what this model registered before stands no more.
                resolveDcnProblems(modelid);
                return;
            }
            const lookup = ((store.getState() as any).idlookup ?? {}) as Record<string, any>;
            reconcileDcnProblems(lookup, modelid, buildVertexResolver(lookup, graphId));
        }, DCN_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [modelid, graphId, sig]);

    // Full cleanup when the last editor on the model closes or switches model: nothing stale
    // bleeds into the next, and a second tab on the same model keeps what it shows.
    useEffect(() => {
        if (!modelid) return;
        return acquireProducerMount('dcn', modelid, () => clearDcnProblems(modelid));
    }, [modelid]);

    return null;
}
