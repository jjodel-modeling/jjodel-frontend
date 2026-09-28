/**
 * simInputs — the pure layer of the inputs' UI (R-SIM-88, P-2026-09-28-0034,
 * docs/discovery/discovery_2026-09-28_sim_input_variables.md §5.4).
 *
 * - The input dialog (SimInputDialog.tsx): one row per input the press reads,
 *   named as Last step names it; the text of each control parsed by the domain
 *   of its input; the values given only when every row has one.
 * - The form of a Data row in the Simulation roles dialog (SimRolesModal.tsx):
 *   stored, derived or input, and what choosing one writes into the row.
 *
 * Pure: no React, no store, no import from the joiner, so it runs under the
 * node test bench (sim/__tests__/simInputs.test.ts).
 */

import { inputLabel } from './simBridge';
import type { InputValue } from './simBridge';
import type { CompiledNet, Domain, InputRead, SimValue } from '../../../model/simulation/netTypes';
import type { StateAttributeRecord } from '../../../model/simulation/stateAttributesCodec';

// ---------------------------------------------------------------------------
// The input dialog
// ---------------------------------------------------------------------------

/** One row of the dialog: an input of one element, its name as shown, its domain. */
export interface InputRow {
    /** `element:attr`, the key of the row and of its typed text. */
    readonly key: string;
    readonly element: string;
    readonly attr: string;
    /** `DecisionNode_0.decision`; a global (the model's own) as `mode`. */
    readonly label: string;
    readonly domain: Domain;
}

/** The typed text of each row, by key: `true`/`false`, digits, a literal. */
export type InputDraft = Readonly<Record<string, string>>;

export function inputRows(asks: readonly InputRead[], net: Pick<CompiledNet, 'modelId'>, lookup: Record<string, any>): InputRow[] {
    return asks.map(a => ({ key: `${a.element}:${a.attr}`, element: a.element, attr: a.attr, label: inputLabel(a, net, lookup), domain: a.domain }));
}

/** The value of a row's text in its domain, `null` when it is none: a boolean, an integer within the bounds, a literal. */
export function parseInputValue(domain: Domain, text: string): SimValue | null {
    const t = text.trim();
    switch (domain.kind) {
        case 'boolean':
            return t === 'true' ? true : t === 'false' ? false : null;
        case 'range': {
            if (!/^-?\d+$/.test(t)) return null;
            const n = Number(t);
            return n >= domain.min && n <= domain.max ? n : null;
        }
        case 'enum':
            return domain.literals.includes(t) ? t : null;
    }
}

/** The answer, in the order of the rows, only when every row has a value of its domain; `null` keeps the dialog's primary off. */
export function inputValues(rows: readonly InputRow[], draft: InputDraft): InputValue[] | null {
    const out: InputValue[] = [];
    for (const r of rows) {
        const value = parseInputValue(r.domain, draft[r.key] ?? '');
        if (value === null) return null;
        out.push({ element: r.element, attr: r.attr, value });
    }
    return out;
}

// ---------------------------------------------------------------------------
// The form of a Data row
// ---------------------------------------------------------------------------

export type DeclarationForm = 'stored' | 'derived' | 'input';

export function declarationForm(row: StateAttributeRecord): DeclarationForm {
    return row.input === true ? 'input' : row.equation !== undefined ? 'derived' : 'stored';
}

/**
 * What choosing a form writes into the row. A derived row has no initial
 * (R-SIM-72); back to stored, the equation goes; an input has neither and is
 * semantic, with a domain (R-SIM-88): the row's own, boolean when it had none.
 */
export function formPatch(row: StateAttributeRecord, form: string): Partial<StateAttributeRecord> {
    switch (form) {
        case 'derived':
            return { initial: '', equation: row.equation ?? '', input: undefined };
        case 'input':
            return { initial: '', equation: undefined, input: true, space: 'semantic', domain: row.domain ?? { kind: 'boolean' } };
        default:
            return { equation: undefined, input: undefined };
    }
}
