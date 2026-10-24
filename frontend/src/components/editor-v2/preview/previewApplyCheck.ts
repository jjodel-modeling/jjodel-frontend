/**
 * Planned against real effects of a script Apply (S4c, R-JJD-2): the objects the plan creates per
 * metaclass, the objects the run created per metaclass, and the line that tells them apart.
 * Pure, for the bench: the worlds come from `buildPlanWorld` before and after the run.
 *
 * M2 (P-2026-10-24-1600): both counts read the level of the open editor, the plan's
 * (`EffectsPlan.level`) and the world's (`PlanWorld.level`); on M2 the metaclass is the element's
 * `M2Kind`. The effects of a mixed script on the other level are counted by `otherLevelEffects`.
 */
import { effectLevel, type EffectsPlan, type PlanWorld } from '../../../jjscript/executor/effectsPlanner';

export type MetaclassCounts = Record<string, number>;

/** The level of the open editor the plan was read for; absent reads as M1. */
export function planLevel(plan: EffectsPlan): 'M1' | 'M2' {
    return plan.level === 'M2' ? 'M2' : 'M1';
}

/** The instances, or on M2 the metamodel elements, `plan` creates on its own level, counted per metaclass. */
export function plannedCounts(plan: EffectsPlan): MetaclassCounts {
    const level = planLevel(plan);
    const ret: MetaclassCounts = {};
    for (const c of plan.created) {
        if (effectLevel(c) !== level) continue;
        ret[c.metaclass] = (ret[c.metaclass] ?? 0) + 1;
    }
    return ret;
}

/** The effects `plan` has on the level other than its own (a mixed script). */
export function otherLevelEffects(plan: EffectsPlan): number {
    const level = planLevel(plan);
    const effects: { level?: 'M2' }[] = [...plan.created, ...plan.features, ...plan.renamed, ...plan.deleted];
    let n = effects.filter((e) => effectLevel(e) !== level).length;
    // Reference writes are M1 only, generalizations M2 only.
    n += level === 'M1' ? plan.generalizations?.length ?? 0 : plan.references.length;
    return n;
}

/** The objects of `after` that `before` did not hold, counted per metaclass; on M2 the metamodel elements, per kind. */
export function createdCounts(before: PlanWorld, after: PlanWorld): MetaclassCounts {
    const ret: MetaclassCounts = {};
    if (after.level === 'M2') {
        const known2 = new Set((before.m2?.elements ?? []).map((e) => e.id));
        for (const e of after.m2?.elements ?? []) {
            if (known2.has(e.id)) continue;
            ret[e.kind] = (ret[e.kind] ?? 0) + 1;
        }
        return ret;
    }
    const known = new Set(before.elements.map((e) => e.id));
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
