/**
 * Planned against real effects of a script Apply (S4c, R-JJD-2): the objects the plan creates per
 * metaclass, the objects the run created per metaclass, and the line that tells them apart.
 * Pure, for the bench: the worlds come from `buildPlanWorld` before and after the run.
 */
import type { EffectsPlan, PlanWorld } from '../../../jjscript/executor/effectsPlanner';

export type MetaclassCounts = Record<string, number>;

/** The instances `plan` creates, counted per metaclass. */
export function plannedCounts(plan: EffectsPlan): MetaclassCounts {
    const ret: MetaclassCounts = {};
    for (const c of plan.created) ret[c.metaclass] = (ret[c.metaclass] ?? 0) + 1;
    return ret;
}

/** The objects of `after` that `before` did not hold, counted per metaclass. */
export function createdCounts(before: PlanWorld, after: PlanWorld): MetaclassCounts {
    const known = new Set(before.elements.map((e) => e.id));
    const ret: MetaclassCounts = {};
    for (const e of after.elements) {
        if (known.has(e.id)) continue;
        ret[e.className] = (ret[e.className] ?? 0) + 1;
    }
    return ret;
}

/**
 * `null` when both counts agree, otherwise one line, metaclasses in name order:
 * `planned +3 State, created +2 State; planned +0 Transition, created +1 Transition`.
 */
export function effectsMismatch(planned: MetaclassCounts, created: MetaclassCounts): string | null {
    const names = [...new Set([...Object.keys(planned), ...Object.keys(created)])].sort();
    const parts: string[] = [];
    for (const n of names) {
        const p = planned[n] ?? 0;
        const c = created[n] ?? 0;
        if (p !== c) parts.push(`planned +${p} ${n}, created +${c} ${n}`);
    }
    return parts.length ? parts.join('; ') : null;
}
