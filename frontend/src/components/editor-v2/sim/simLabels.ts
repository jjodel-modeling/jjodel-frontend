/**
 * simLabels — the words of the simulation UI that follow its state
 * (P-2026-10-03-1630).
 *
 * - The heading of the run's state, on the panel's M1 face (SimulationPanel.tsx)
 *   and in the run inspector (SimInspector.tsx): `Marking` is Petri vocabulary
 *   (R-SIM-21..26) and heads the run of a Petri profile only; a control-flow
 *   profile (state machines, automata, flowcharts and activities) heads it
 *   `Configuration`, the word the spec gives the state of a run
 *   (docs/spec/claude_spec_2026-09-13_computational_model.md §2). The shape
 *   decides, not the id: a user copy and «Custom» follow theirs.
 * - The roles line of the Simulation roles dialog (SimRolesModal.tsx): how many
 *   of the roles the binder judged hold a value now, set by hand, stored or
 *   proposed, so a manual assign or clear moves it.
 *
 * Pure: no React, no store, no import from the joiner, so it runs under the
 * node test bench (sim/__tests__/simLabels.test.ts).
 */

import { roleDescriptor } from '../../../model/simulation/roleCatalog';
import type { RoleId } from '../../../model/simulation/roleCatalog';
import type { SimProfile } from '../../../model/simulation/simProfiles';
import { rowValue } from './simRolesDraft';
import type { DraftInput } from './simRolesDraft';
import type { ProfileProposal } from './simRoleStatus';

export type StateHeading = 'Marking' | 'Configuration';

/** The heading of a run's marked places under `profile`: `Marking` for the Petri shape, `Configuration` for control flow. */
export function stateHeading(profile: Pick<SimProfile, 'shape'>): StateHeading {
    return profile.shape === 'petri' ? 'Marking' : 'Configuration';
}

/** The head `markingLine` writes (simBridge.ts). */
const MARKING_HEAD = 'Marking: ';

/** `markingLine`'s text (simBridge.ts) under `heading`: `Configuration: Idle · coins = 2`; a text without that head stays as it is. */
export function headedStateLine(line: string, heading: StateHeading): string {
    return line.startsWith(MARKING_HEAD) ? `${heading}: ${line.slice(MARKING_HEAD.length)}` : line;
}

/**
 * The roles line: of the roles the binder judged (`bindings`, the line's total), how many hold a value now as
 * their rows show it (`rowValue`: the edit, else the stored value, else the proposal). `null` for «Custom».
 */
export function assignedRoles(input: DraftInput, proposals: readonly ProfileProposal[]): { assigned: number; total: number } | null {
    if (!input.bindings) return null;
    const roles = Object.keys(input.bindings) as RoleId[];
    const assigned = roles.filter(r => {
        const key = roleDescriptor(r).key;
        return key !== null && rowValue(key, input, proposals).value !== '';
    }).length;
    return { assigned, total: roles.length };
}
