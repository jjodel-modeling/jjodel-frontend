import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { LModel, LPointerTargetable } from '../../joiner';
import type { DState } from '../../joiner';
import { validateConformance } from './ConformanceValidator';
import type { ConformanceResult } from './ConformanceTypes';

const DEBOUNCE_MS = 500;

/**
 * Hook that computes conformance of a model against its metamodel.
 * Debounced to avoid running on every keystroke.
 * Returns null if the model is a metamodel or has no metamodel reference.
 */
export function useConformance(modelId: string): ConformanceResult | null {
    const [result, setResult] = useState<ConformanceResult | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Subscribe to Redux state changes via a lightweight selector.
    // We pick the model's raw data to detect changes.
    const modelData = useSelector((state: DState) => state.idlookup?.[modelId]);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            try {
                const lModel = LPointerTargetable.fromPointer(modelId) as LModel | null;
                if (!lModel || lModel.isMetamodel) {
                    setResult(null);
                    return;
                }

                const metamodel = lModel.instanceof as LModel | undefined;
                if (!metamodel) {
                    setResult({
                        modelId,
                        status: 'unknown',
                        violations: [],
                        checkedAt: Date.now(),
                    });
                    return;
                }

                const newResult = validateConformance(lModel, metamodel);
                setResult(newResult);
            } catch (err) {
                console.warn('[useConformance] Error:', err);
                setResult({
                    modelId,
                    status: 'unknown',
                    violations: [],
                    checkedAt: Date.now(),
                });
            }
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [modelId, modelData]);

    return result;
}
