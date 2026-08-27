/**
 * formDiagnostics — project the NodeProblem registry onto the fields of a form.
 *
 * The form runs NO validation of its own (slice decision 2): every message it shows comes
 * from `editor-v2/problems/`, which `model/conformance/` fills. So this module does not
 * decide what is wrong, only WHERE to say it — which field a violation belongs to, and what
 * is left over.
 *
 * Extracted from IRForm rather than left inline for the reason slotValues was: IRForm
 * imports the framework barrel, which pulls Monaco, which touches `window` at import time,
 * and a node-environment test cannot load it. Here the input is plain data, so the
 * distribution rule is testable directly.
 *
 * Matching is BY NAME, `field.name === detail.metamodelElementName`, because the registry
 * has no feature id to offer — the conformance validator names the metamodel element and
 * stops there. Names are unique among a class's own features, which is what makes this
 * sound; a violation naming a class (`orphan_object`, `abstract_instantiation`) simply
 * matches no field and lands in the residue, which is the correct outcome rather than a
 * missed case.
 *
 * Nothing is dropped. A violation that matches no field still counts in the summary, so the
 * rail and the canvas badge can never disagree about how many problems an object has.
 */

import type { NodeProblem, ConformanceProblemDetail } from '../../problems/registry';

export interface FieldDiagnostic {
    severity: 'error' | 'warning';
    message: string;
}

export interface FormDiagnostics {
    /** Field name -> its diagnostics, in the order the validator produced them. */
    byField: Map<string, FieldDiagnostic[]>;
    /** Diagnostics that belong to no field of this form: class-level checks, features
     *  hidden by `FormSpec.features`, features outside Basic. Counted, never shown twice. */
    residue: FieldDiagnostic[];
    errorCount: number;
    warningCount: number;
}

const EMPTY: FormDiagnostics = {
    byField: new Map(),
    residue: [],
    errorCount: 0,
    warningCount: 0,
};

/**
 * Distribute the active problems of one object over the field names of its form.
 *
 * `fieldNames` is the set of names the form actually renders, so a feature the view hides
 * contributes to the counts without claiming a field that is not on screen.
 *
 * The counting rule is COPIED from NodeProblemIndicator: one unit per conformance violation,
 * one unit for a problem of any other kind. Copied and not shared because the indicator
 * counts to size a badge and this counts to fill a summary; what matters is that the two
 * agree, and a test pins the formula. If they ever diverge the rail and the canvas would
 * report different numbers for the same object, which is worse than the duplication.
 */
export function collectFormDiagnostics(
    problems: readonly NodeProblem[],
    fieldNames: ReadonlySet<string>,
): FormDiagnostics {
    if (!problems || problems.length === 0) return EMPTY;

    const byField = new Map<string, FieldDiagnostic[]>();
    const residue: FieldDiagnostic[] = [];
    let errorCount = 0;
    let warningCount = 0;

    const push = (name: string | undefined, d: FieldDiagnostic): void => {
        if (name && fieldNames.has(name)) {
            const arr = byField.get(name);
            if (arr) arr.push(d); else byField.set(name, [d]);
        } else {
            residue.push(d);
        }
        if (d.severity === 'error') errorCount++; else warningCount++;
    };

    for (const p of problems) {
        // A resolved problem is on its way out of the registry (5s TTL): it must not light
        // a field up, and it must not be counted either.
        if (p.resolvedAt !== undefined) continue;

        const details: readonly ConformanceProblemDetail[] | undefined = p.conformance;
        if (details && details.length > 0) {
            for (const d of details) {
                push(d.metamodelElementName, { severity: d.severity, message: d.message });
            }
            continue;
        }

        // Any other kind — `duplicate-name` today — is one unit with no field to attach to.
        // Its title is the useful half: the description repeats the object's name, which the
        // form header already shows.
        push(undefined, { severity: p.severity, message: p.title || p.description });
    }

    return { byField, residue, errorCount, warningCount };
}

/** The worst severity among some diagnostics, or null when there are none. */
export function worstSeverity(ds: readonly FieldDiagnostic[] | undefined): 'error' | 'warning' | null {
    if (!ds || ds.length === 0) return null;
    return ds.some(d => d.severity === 'error') ? 'error' : 'warning';
}
