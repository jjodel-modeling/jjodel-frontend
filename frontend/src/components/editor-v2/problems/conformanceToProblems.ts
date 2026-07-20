/**
 * Pure mapping: ConformanceResult -> per-object aggregates ready for the
 * NodeProblem registry. Extracted from ConformanceProblemSync so the grouping /
 * severity / model-level-exclusion logic is unit-testable without React, Redux
 * or the framework barrel (same convention as ConformanceValidator.test.ts).
 *
 * The producer (ConformanceProblemSync) turns each aggregate into registry
 * entries — one keyed by the DObject id (TreeView) and one keyed by the DVertex
 * id (canvas), per the dual-registration decision (discovery
 * 2026-07-16 §7 Option A).
 */

import type { NodeProblemSeverity, ConformanceProblemDetail } from './registry';
import type { ConformanceResult } from '../../../model/conformance/ConformanceTypes';

export interface ConformanceObjectProblem {
    /** DObject id the violations attach to. */
    objectId: string;
    objectName?: string;
    /** Max severity across the object's violations ('error' wins over 'warning'). */
    severity: NodeProblemSeverity;
    /** One entry per violation on this object. */
    violations: ConformanceProblemDetail[];
}

/**
 * Group a conformance result's violations by object.
 *
 * - Returns [] for a null result or one with no violations (conformant model).
 * - Model-level violations (objectId absent, or objectId === result.modelId —
 *   e.g. the CHECK-11 fail-visible post-pass) are excluded: they are not
 *   attachable to a node and only feed the toolbar pill.
 * - severity is the max over the object's violations.
 */
export function aggregateConformanceByObject(
    result: ConformanceResult | null,
): ConformanceObjectProblem[] {
    if (!result || !result.violations || result.violations.length === 0) return [];

    const byObject = new Map<string, ConformanceObjectProblem>();
    for (const v of result.violations) {
        // model-level / unattachable violations do not go into the registry
        if (!v.objectId || v.objectId === result.modelId) continue;

        let agg = byObject.get(v.objectId);
        if (!agg) {
            agg = { objectId: v.objectId, objectName: v.objectName, severity: 'warning', violations: [] };
            byObject.set(v.objectId, agg);
        }
        agg.violations.push({
            violationType: v.violationType,
            severity: v.severity,
            message: v.message,
        });
        if (v.severity === 'error') agg.severity = 'error';
        if (!agg.objectName && v.objectName) agg.objectName = v.objectName;
    }

    return Array.from(byObject.values());
}
