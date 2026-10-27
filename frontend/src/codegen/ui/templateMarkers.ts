/**
 * templateMarkers — the problems of a template body as Monaco markers (slice S2, P-2026-10-23-1945; R-GEN-24,
 * discovery §3.3).
 *
 * The two refusals `registerTemplates` (templates.ts) makes of a body, without a model: what the parse of its mode
 * rejects (`parseTemplateBody`, the engine's own dispatch, S5), and a `with … do`, which the template engine refuses. A parse error carries the 1-based line and column of the
 * body, holes and nested strings included (`origin.test.ts`), so a marker sits where the error is, not at the start
 * of the hole that holds it. A marker is one column wide, as the JjTL editor's; Monaco widens one past the end of a
 * line to the character before it.
 *
 * Pure: no Monaco import, so the tab adds the severity and the owner.
 */

import { checkGuardSubset } from '../../model/simulation/subsetChecker';
import { parseTemplateBody } from '../engine/templates';
import type { TemplateMode } from '../engine/templates';

/** The fields of a Monaco `IMarkerData` this module fills: 1-based, end exclusive. */
export interface TemplateMarker {
    readonly startLineNumber: number;
    readonly startColumn: number;
    readonly endLineNumber: number;
    readonly endColumn: number;
    readonly message: string;
}

/** The message of a refused `with … do`, as the engine words it (templates.ts). */
export const WITH_REFUSED = '`with … do` is not allowed in a template: it binds the features of its object as bare names, so their reads have no origin; navigate with `x.f`';

const at = (line: number, column: number, message: string): TemplateMarker => ({
    startLineNumber: line,
    startColumn: column,
    endLineNumber: line,
    endColumn: column + 1,
    message,
});

/** The markers of a body in `mode` (absent: an expression): none when it parses and holds no `with … do`. */
export function templateMarkers(body: string, mode?: TemplateMode): TemplateMarker[] {
    const parsed = parseTemplateBody({ body, mode });
    if (parsed.errors.length > 0) return parsed.errors.map(e => at(e.line, e.column, e.message));
    if (!parsed.expression) return [at(1, 1, 'The template has no body')];
    return checkGuardSubset(parsed.expression)
        .filter(d => d.code === 'E-WITH')
        .map(d => at(d.location?.start?.line ?? 1, d.location?.start?.column ?? 1, WITH_REFUSED));
}
