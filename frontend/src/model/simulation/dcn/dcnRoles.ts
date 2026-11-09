/**
 * dcnRoles — the resolved roles of the dcn group (R-DCN-8, R-SIM-47).
 *
 * The DCN twin of `netStcFromRoles` (netCompile.ts): the roles of the bag the
 * DCN nucleus will read, or `null` when the closure of the dcn shape is not
 * met (simProfiles.ts `closureRoles('dcn')`). The nucleus is picked at
 * `startRun` by which role set is bound, never by the profile (discovery
 * 2026-11-06 §3.2); this lane adds the reader only, and nothing calls it yet.
 *
 * The keys are read through the catalog (roleCatalog.ts), with the filter of
 * stcFromRoles.ts: a role counts when its key holds a non-empty string. An
 * optional role whose dependency is unset is dropped, as the event role is
 * without a Trigger. Operation and Body are `multi` (R-SIM-90): their value is
 * the list `roleValues` reads, absent when empty. Instance-of is not here: it is the R-OI binding
 * (`ontoBindings`), read by the nucleus. Pure: no React, no store.
 */

import { ROLE_CATALOG, roleValues } from '../roleCatalog';
import type { RoleId } from '../roleCatalog';
import { closureRoles } from '../simProfiles';
import type { DeclarationDefect } from '../netTypes';
import type { DcnReadView } from './dcnCompile';

/** The bag values of the dcn roles: an id each, a list for Operation and Body, the closure always present. */
export interface DcnStc {
    readonly staticClass: string;
    readonly viewpoints: string;
    readonly dynamicClasses: string;
    readonly invariant: string;
    readonly operation?: readonly string[];
    readonly precondition?: string;
    readonly body?: readonly string[];
    readonly redefines?: string;
    readonly monitor?: string;
    readonly overlapping?: string;
    readonly complete?: string;
    readonly coherence?: string;
    readonly coherenceContext?: string;
    readonly coherencePointwise?: string;
    readonly coherencePattern?: string;
    readonly persistenceCondition?: string;
    readonly persistenceBound?: string;
    readonly responseTrigger?: string;
    readonly responseResponse?: string;
    readonly responseBound?: string;
}

/** The resolved dcn roles of `bag`, or `null` when a role of the dcn closure is unset. */
export function dcnStcFromRoles(bag: Readonly<Record<string, unknown>> | undefined): DcnStc | null {
    if (!bag) return null;
    const out: Partial<Record<RoleId, string | readonly string[]>> = {};
    // Catalog order puts every role after the roles it depends on.
    for (const d of ROLE_CATALOG) {
        if (d.group !== 'dcn' || d.key === null) continue;
        const value = bag[d.key];
        if (typeof value !== 'string' || value === '') continue;
        if (!d.dependsOn.every(dep => out[dep] !== undefined)) continue;
        if (!d.multi) {
            out[d.id] = value;
            continue;
        }
        const values = roleValues(value);
        if (values.length > 0) out[d.id] = values;
    }
    if (!closureRoles('dcn').every(r => out[r] !== undefined)) return null;
    return out as unknown as DcnStc;
}

/** A trajectory pattern with a valid k (R-DCN-31: committed steps); a blank expression reads `null`. */
export type DcnCoherencePattern =
    | { readonly kind: 'persistence'; readonly id: string; readonly condition: string | null; readonly k: number }
    | { readonly kind: 'response'; readonly id: string; readonly trigger: string | null; readonly response: string | null; readonly k: number };

/** A coherence constraint of the model as plain data (R-DCN-28, spec §3). */
export interface DcnCoherenceConstraint {
    readonly id: string;
    readonly name: string;
    /** The static class it applies to; `null` when unset. */
    readonly context: string | null;
    /** φ as text; `null` when absent. */
    readonly pointwise: string | null;
    /** ψ; `null` when absent, of neither kind, or dropped for a bad k. */
    readonly pattern: DcnCoherencePattern | null;
}

export interface DcnCoherence {
    readonly constraints: readonly DcnCoherenceConstraint[];
    /** The shape of `CompiledNet.declarationDefects`, for the lane that wires this into a run. */
    readonly defects: readonly DeclarationDefect[];
}

const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);

const isBlank = (v: unknown): boolean => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** The positive integer `v` holds, as a number or as digits (`asInt` of dcnCompile.ts), else `null`. */
function positive(v: unknown): number | null {
    const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v.trim()) : NaN;
    return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * The coherence constraints of the model: every object whose metaclass conforms
 * to the constraint class, in model order; none when the role is unbound. The
 * kind of a pattern is the class that owns the feature of its condition or
 * trigger. A missing or non-positive k is a `bounds` defect and drops the
 * pattern only, so φ is still read and no run can start from a bad bound.
 */
export function dcnCoherenceFromRoles(stc: DcnStc, view: DcnReadView): DcnCoherence {
    const constraints: DcnCoherenceConstraint[] = [];
    const defects: DeclarationDefect[] = [];
    if (stc.coherence === undefined) return { constraints, defects };
    const coherence = stc.coherence;

    const read = (id: string, role: string | undefined): unknown => (role !== undefined ? view.attributeValue(id, role) : undefined);
    const isOf = (id: string, feature: string | undefined): boolean => {
        const owner = feature !== undefined ? view.ownerOf(feature) : undefined;
        const meta = view.metaclassOf(id);
        return owner !== undefined && meta !== undefined && view.conformsTo(meta, owner);
    };
    const boundOf = (name: string, pattern: string, role: string | undefined): number | null => {
        const raw = read(pattern, role);
        const k = positive(raw);
        if (k === null) {
            const message = isBlank(raw) ? 'a pattern with no k' : `k ${String(raw)} is not a positive integer`;
            defects.push({ index: null, name, code: 'bounds', message, element: pattern });
        }
        return k;
    };
    const patternOf = (name: string, pattern: string): DcnCoherencePattern | null => {
        if (isOf(pattern, stc.persistenceCondition)) {
            const k = boundOf(name, pattern, stc.persistenceBound);
            return k === null ? null : { kind: 'persistence', id: pattern, condition: text(read(pattern, stc.persistenceCondition)), k };
        }
        if (isOf(pattern, stc.responseTrigger)) {
            const k = boundOf(name, pattern, stc.responseBound);
            return k === null ? null : {
                kind: 'response', id: pattern, trigger: text(read(pattern, stc.responseTrigger)),
                response: text(read(pattern, stc.responseResponse)), k,
            };
        }
        return null;
    };

    for (const id of view.objects()) {
        const meta = view.metaclassOf(id);
        if (meta === undefined || !view.conformsTo(meta, coherence)) continue;
        const name = view.nameOf(id) ?? id;
        const target = stc.coherencePattern !== undefined ? view.referenceTargets(id, stc.coherencePattern)[0] : undefined;
        constraints.push({
            id,
            name,
            context: (stc.coherenceContext !== undefined ? view.referenceTargets(id, stc.coherenceContext)[0] : undefined) ?? null,
            pointwise: text(read(id, stc.coherencePointwise)),
            pattern: target !== undefined ? patternOf(name, target) : null,
        });
    }
    return { constraints, defects };
}
