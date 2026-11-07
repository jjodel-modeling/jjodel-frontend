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
