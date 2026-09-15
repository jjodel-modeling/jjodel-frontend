import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { DObject, DValue, DClass, DAttribute, DReference, DEnumerator, DEnumLiteral, LModel, LPointerTargetable } from '../../joiner';
import type { DState } from '../../joiner';
import { validateConformance } from './ConformanceValidator';
import type { ConformanceResult } from './ConformanceTypes';

const DEBOUNCE_MS = 500;

// Pointer arrays on raw D-layer entries → stable string fragment for the signature.
const joinPtrs = (v: unknown): string => (Array.isArray(v) ? v.join(',') : '');

/**
 * Hook that computes conformance of a model against its metamodel.
 * Debounced to avoid running on every keystroke.
 * Returns null if the model is a metamodel or has no metamodel reference.
 */
export function useConformance(modelId: string): ConformanceResult | null {
    const [result, setResult] = useState<ConformanceResult | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Targeted content signature (mirrors UniquenessProblemSync's approach) over
    // exactly what conformance depends on: the model's metamodel binding, every
    // instance's id + metaclass, and every slot's raw values. Deep edits
    // (SetFieldAction on an instance's DValues when an attribute is filled/cleared)
    // change a DValue's `values`, so the string changes and the effect re-fires —
    // whereas a selector on idlookup[modelId] alone misses them (the model entry
    // reference is untouched) and a selector on the whole idlookup fires on EVERY
    // action, which would let unrelated action traffic starve the trailing debounce.
    // useSelector re-renders only when this string actually differs, so the 500ms
    // debounce below coalesces a burst (continuous typing) into one validateConformance
    // run and is never reset by irrelevant actions.
    //
    // The signature also covers the M2 side (metamodel co-evolution): a SetFieldAction
    // on a DClass/DAttribute/DReference/DEnumerator must retrigger validation of the
    // M1 instances, otherwise metamodel edits (add required attr, tighten multiplicity,
    // retype a reference, toggle abstract, rename an enum literal) only surface on the
    // next M1 structural edit. Serialized M2 fields are exactly those the checks read:
    //   DClass      → abstract (CHECK 7); attributes/references/extends membership
    //                 (feature move & inheritance changes affect allAttributes/
    //                 allReferences/extendsChain — entry presence alone misses moves)
    //   DAttribute  → type, lowerBound, upperBound, isID (CHECKs 2, 3, 9/9b, 11)
    //   DReference  → type, lowerBound, upperBound (CHECKs 4, 5, 8)
    //   DEnumerator → literals membership; DEnumLiteral → name (CHECK 10)
    const signature = useSelector((state: DState) => {
        const lookup = state?.idlookup ?? {};
        const model = lookup[modelId] as { instanceof?: unknown } | undefined;
        let sig = `m:${Array.isArray(model?.instanceof) ? model!.instanceof.join(',') : (model?.instanceof ?? '')};`;
        for (const id in lookup) {
            const raw = lookup[id] as {
                className?: string; instanceof?: unknown; values?: unknown;
                abstract?: unknown; attributes?: unknown; references?: unknown; extends?: unknown;
                type?: unknown; lowerBound?: unknown; upperBound?: unknown; isID?: unknown;
                name?: unknown; literals?: unknown;
            } | undefined;
            if (!raw) continue;
            if (raw.className === DObject.cname) {
                sig += `o${id}=${raw.instanceof ?? ''};`;
            } else if (raw.className === DValue.cname) {
                const vals = raw.values;
                // JSON.stringify instead of join(','): a single value containing a comma
                // must not alias two distinct values in the signature.
                sig += `v${id}=${Array.isArray(vals) ? JSON.stringify(vals) : (vals ?? '')};`;
            } else if (raw.className === DClass.cname) {
                sig += `c${id}=${raw.abstract ?? ''},${joinPtrs(raw.attributes)}|${joinPtrs(raw.references)}|${joinPtrs(raw.extends)};`;
            } else if (raw.className === DAttribute.cname) {
                sig += `a${id}=${raw.type ?? ''},${raw.lowerBound ?? ''},${raw.upperBound ?? ''},${raw.isID ?? ''};`;
            } else if (raw.className === DReference.cname) {
                sig += `r${id}=${raw.type ?? ''},${raw.lowerBound ?? ''},${raw.upperBound ?? ''};`;
            } else if (raw.className === DEnumerator.cname) {
                sig += `e${id}=${joinPtrs(raw.literals)};`;
            } else if (raw.className === DEnumLiteral.cname) {
                sig += `l${id}=${raw.name ?? ''};`;
            }
        }
        return sig;
    });

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
    }, [modelId, signature]);

    return result;
}
