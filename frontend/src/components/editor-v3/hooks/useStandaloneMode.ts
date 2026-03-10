/**
 * Editor V3 — useStandaloneMode: auto-creates a DModel + DGraph
 * when no modelid is provided (standalone / demo mode).
 *
 * This enables testing and standalone usage of the editor without
 * needing an existing project/model.
 */

import { useState, useEffect, useRef } from 'react';
import {
    DModel,
    DGraph,
    DClass,
    SetFieldAction,
    SetRootFieldAction,
    ShortAttribETypes,
} from '../../../joiner';
import { V3_GRAPH_STYLE } from '../constants';

interface StandaloneModeResult {
    /** The effective model ID (either the provided one, or the auto-created one). */
    modelId: string;
    /** Whether standalone mode created a new model. */
    isStandalone: boolean;
}

/**
 * Attempt to create the standalone model+graph.
 * Returns the modelId on success, or '' if APIs aren't ready yet.
 */
function tryCreateStandaloneModel(): string {
    // Check all required APIs are available
    if (typeof (DModel as any)?.new !== 'function') return '';
    if (typeof (DGraph as any)?.new !== 'function') return '';
    if (typeof (SetFieldAction as any)?.new !== 'function') return '';
    if (typeof (SetRootFieldAction as any)?.new !== 'function') return '';

    // Do NOT wrap in TRANSACTION — each .new() call handles its own
    // transaction internally via Constructors.persist(). Wrapping in an
    // outer TRANSACTION leaks a BEGIN() because TRANSACTION is async
    // and the Promise is never awaited.

    // 1. Create a blank metamodel
    const dModel = (DModel as any).new(
        'V3 Standalone',  // name
        undefined,        // instanceof (no metamodel — this IS a metamodel)
        true,             // isMetamodel = true for M2 mode
        true,             // persist
    );

    if (!dModel?.id) return '';

    // 2. Create a graph linked to the model (auto-generated ID)
    const dGraph = (DGraph as any).new(0, dModel.id);
    if (!dGraph?.id) return '';

    // 3. Tag graph as v3-editor
    (SetFieldAction as any).new(dGraph.id, 'graphStyle', V3_GRAPH_STYLE, '', false);

    // 4. Add graph to Redux root state so useJjomSyncV3 can find it
    (SetRootFieldAction as any).new('graphs', dGraph.id, '+=', true);

    // 5. Create primitive types (EString, EInt, etc.) — normally done by
    //    DState.init_editor() for #/project URLs. Standalone mode (#/editor-v3)
    //    goes through init_dashboard() which skips them, causing DAttribute/
    //    DOperation creation to fail (Pointer_ESTRING not in idlookup).
    for (const primitiveType of Object.values(ShortAttribETypes)) {
        if (primitiveType === ShortAttribETypes.EVoid) continue;
        const dPrim = (DClass as any).new(
            primitiveType,                              // name
            false,                                      // isInterface
            false,                                      // isAbstract
            true,                                       // isPrimitive
            false,                                      // partial
            '',                                         // partialDefaultName
            undefined,                                  // father (global — no parent)
            true,                                       // persist
            'Pointer_' + primitiveType.toUpperCase(),   // id
        );
        if (dPrim?.id) {
            (SetRootFieldAction as any).new('primitiveTypes', dPrim.id, '+=', true);
        }
    }

    // 6. The framework's async TRANSACTION inside Constructors.persist()
    //    leaks transaction depth levels. Schedule a cleanup to reset the
    //    transaction state after microtasks settle.
    const tStatus = (window as any).transactionStatus;
    if (tStatus) {
        setTimeout(() => {
            if (tStatus.transactionDepthLevel > 0 && tStatus.pendingActions.length === 0) {
                tStatus.transactionDepthLevel = 0;
                tStatus.hasBegun = false;
            }
        }, 500);
    }

    return dModel.id;
}

/**
 * If `modelid` is falsy, creates a blank metamodel + graph.
 * Retries with a timer if joiner APIs aren't ready yet.
 */
export function useStandaloneMode(modelid: string): StandaloneModeResult {
    const [standaloneModelId, setStandaloneModelId] = useState<string>('');
    const createdRef = useRef(false);

    useEffect(() => {
        if (modelid) return;
        if (createdRef.current) return;

        // Try immediately
        const id = tryCreateStandaloneModel();
        if (id) {
            createdRef.current = true;
            setStandaloneModelId(id);
            return;
        }

        // Retry with increasing delays (joiner may still be initializing)
        const delays = [200, 500, 1000, 2000];
        let attempt = 0;
        let timer: ReturnType<typeof setTimeout>;

        function retry() {
            if (createdRef.current) return;
            const retryId = tryCreateStandaloneModel();
            if (retryId) {
                createdRef.current = true;
                setStandaloneModelId(retryId);
                return;
            }
            attempt++;
            if (attempt < delays.length) {
                timer = setTimeout(retry, delays[attempt]);
            }
        }

        timer = setTimeout(retry, delays[0]);

        return () => clearTimeout(timer);
    }, [modelid]);

    if (modelid) {
        return { modelId: modelid, isStandalone: false };
    }

    return { modelId: standaloneModelId, isStandalone: true };
}
