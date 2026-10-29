/**
 * Diagnostics of a Refactoring, from the effects plan to editor lines and ranges (P-2026-10-24-2320).
 *
 * Pure: the tab plans the script with `planEffects` (R-JJD-2) and this maps the plan's warnings and
 * errors to what the editor shows: a gutter dot per line, a wavy underline on a name that does not
 * resolve, and a list under the editor. The name is the one the planner's message quotes, found in
 * the line's own text; when it is not there, the line keeps its dot and its list row, no underline.
 */
import type { EffectsPlan, PlanIssue } from '../../jjscript/executor/effectsPlanner';

export type DiagnosticSeverity = 'warning' | 'error';

export interface RefactoringDiagnostic {
    line: number;
    severity: DiagnosticSeverity;
    code: string;
    message: string;
    /** 1-based columns of the unresolved name, end exclusive (Monaco's convention); absent: no underline. */
    startColumn?: number;
    endColumn?: number;
}

/** The planner codes that mean «this name resolves to nothing». */
export const UNRESOLVED_CODES: ReadonlySet<string> = new Set([
    'CLASS_NOT_FOUND', 'INSTANCE_NOT_FOUND', 'UNKNOWN_PROPERTY', 'UNKNOWN_ATTRIBUTE_TYPE', 'UNKNOWN_REFERENCE_TYPE',
    'UNKNOWN_OPERATION_TYPE', 'UNKNOWN_PARAMETER_TYPE', 'UNKNOWN_TYPE', 'PARENT_NOT_FOUND', 'CHILD_NOT_FOUND',
    'MEMBER_NOT_FOUND', 'ELEMENT_NOT_FOUND',
]);

/** The name an unresolved-name message quotes: the first quoted one, the property for «X 'e' has no property 'p'». */
export function unresolvedName(issue: PlanIssue): string | null {
    if (!UNRESOLVED_CODES.has(issue.code)) return null;
    const quoted = [...issue.message.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    if (!quoted.length) return null;
    return /has no property/.test(issue.message) ? quoted[quoted.length - 1] : quoted[0];
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Where `name` stands in `text` as a whole word (a qualified name whole too), as 1-based columns. */
export function findName(text: string, name: string): { startColumn: number; endColumn: number } | null {
    const re = new RegExp(`(^|[^A-Za-z0-9_])(${escapeRegExp(name)})(?![A-Za-z0-9_])`);
    const m = re.exec(text);
    if (!m) return null;
    const start = m.index + m[1].length;
    return { startColumn: start + 1, endColumn: start + 1 + name.length };
}

function toDiagnostic(issue: PlanIssue, severity: DiagnosticSeverity, lines: readonly string[]): RefactoringDiagnostic {
    const d: RefactoringDiagnostic = { line: issue.line, severity, code: issue.code, message: issue.message };
    const name = unresolvedName(issue);
    const at = name ? findName(lines[issue.line - 1] ?? '', name) : null;
    if (at) Object.assign(d, at);
    return d;
}

/** The diagnostics of `plan` on `script`, by line, warnings before errors on the same line. */
export function diagnosticsOf(plan: EffectsPlan | null, script: string): RefactoringDiagnostic[] {
    if (!plan) return [];
    const lines = script.split('\n');
    const out = [
        ...plan.warnings.map((w) => toDiagnostic(w, 'warning', lines)),
        ...plan.errors.map((e) => toDiagnostic(e, 'error', lines)),
    ];
    // A stable sort: on the same line the warnings, pushed first, stay before the errors.
    return out.sort((a, b) => a.line - b.line);
}

/** The list's location label: `L3`, or `L3:5-12` with the underlined columns (end inclusive). */
export function rangeLabel(d: RefactoringDiagnostic): string {
    return d.startColumn && d.endColumn ? `L${d.line}:${d.startColumn}-${d.endColumn - 1}` : `L${d.line}`;
}

/** One gutter dot per line: the worst severity among the line's diagnostics. */
export function gutterLines(diagnostics: readonly RefactoringDiagnostic[]): { line: number; severity: DiagnosticSeverity }[] {
    const byLine = new Map<number, DiagnosticSeverity>();
    for (const d of diagnostics) {
        if (byLine.get(d.line) !== 'error') byLine.set(d.line, d.severity);
    }
    return [...byLine].sort((a, b) => a[0] - b[0]).map(([line, severity]) => ({ line, severity }));
}
