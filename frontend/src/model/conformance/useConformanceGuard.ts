import { useCallback } from 'react';
import { LModel, LPointerTargetable } from '../../joiner';
import { checkLinkCreation, checkObjectCreation, checkValueAssignment, emitGuardViolation } from './ConformanceGuard';
import type { GuardResult, GuardOptions } from './ConformanceTypes';

/**
 * Resolves model and metamodel from a model ID.
 * Returns null if either cannot be resolved.
 */
function resolveModelPair(modelId: string): { model: LModel; metamodel: LModel } | null {
    try {
        const lModel = LPointerTargetable.fromPointer(modelId) as LModel | null;
        if (!lModel || lModel.isMetamodel) return null;
        const metamodel = lModel.instanceof as LModel | undefined;
        if (!metamodel) return null;
        return { model: lModel, metamodel };
    } catch {
        return null;
    }
}

/**
 * Hook that exposes conformance guard functions bound to a specific model.
 * Each guard returns a GuardResult and emits a CustomEvent on violation.
 */
export function useConformanceGuard(modelId: string) {
    const guardLink = useCallback(
        (sourceObjectId: string, associationName: string, options?: GuardOptions): GuardResult => {
            const pair = resolveModelPair(modelId);
            if (!pair) return { allowed: true }; // fail open
            const result = checkLinkCreation(sourceObjectId, associationName, pair.model, pair.metamodel, options);
            emitGuardViolation(result);
            return result;
        },
        [modelId],
    );

    const guardObject = useCallback(
        (className: string, options?: GuardOptions): GuardResult => {
            const pair = resolveModelPair(modelId);
            if (!pair) return { allowed: true };
            const result = checkObjectCreation(className, pair.metamodel, options);
            emitGuardViolation(result);
            return result;
        },
        [modelId],
    );

    const guardValue = useCallback(
        (objectId: string, attributeName: string, value: unknown, options?: GuardOptions): GuardResult => {
            const pair = resolveModelPair(modelId);
            if (!pair) return { allowed: true };
            const result = checkValueAssignment(objectId, attributeName, value, pair.model, pair.metamodel, options);
            emitGuardViolation(result);
            return result;
        },
        [modelId],
    );

    return { guardLink, guardObject, guardValue };
}
