/**
 * L2 — Mini-evaluator for edge endpoint expressions.
 *
 * Used by the SVG overlay (L2 Fase 3+) and the default view template
 * (L2 Fase 4 fallback) to resolve `edgeSource` / `edgeTarget` expressions
 * declared on a DViewElement against an M1 instance (e.g., T1).
 *
 * Returns the resolved LObject (e.g., S1) or `null` if the expression
 * cannot be evaluated on the current data. Never throws.
 *
 * SUPPORTED SYNTAX (MVP):
 *   - Dot access:           "$source.value"
 *   - Bracket access:       "$source.values[0]"
 *   - Multi-level navigation:
 *                           "$pair.value.left"
 *                           "$source.value.$container.value"
 *
 * NOT SUPPORTED (future L2.5+ or JjEL inline):
 *   - Ternaries / conditions:    "$cond ? $a : $b"
 *   - Callback aggregations:     "$members.values.find(m => ...)"
 *   - JjEL/OCL functions:        "OCL.first(...)", "OCL.size(...)"
 *
 * VALIDATION OF OUTPUT:
 *   The evaluator only returns LObject-shaped values, recognized via
 *   the guard `result && typeof result === 'object' && result.id && result.className`.
 *   Path that terminates on a primitive (string, number, boolean) returns null.
 *   Example: `evalEdgeExpression(t1, "$source.value.name")` returns null
 *   (because ".name" is a string, not an LObject).
 *
 * INPUT CONSTRAINTS:
 *   - data null/undefined → null
 *   - expr null/undefined/empty → null
 *   - expr with whitespace: not supported, behavior undefined
 *   - expr with unsupported syntax: returns null silently
 *
 * NEVER THROWS. All failure modes are reported as `null`.
 */

/**
 * Splits an expression into segments by `.`, preserving bracket access
 * intact within a single segment.
 *
 * Examples:
 *   "$source.value"            → ["$source", "value"]
 *   "$source.values[0]"        → ["$source", "values[0]"]
 *   "$pair.value.left"         → ["$pair", "value", "left"]
 *
 * Note: brackets are not nested in the MVP grammar, so a naive split('.')
 * is sufficient. If future syntax introduces dots inside brackets
 * (e.g., string keys), this function will need to be revisited.
 */
function parseSegments(expr: string): string[] {
    return expr.split('.');
}

/**
 * Evaluates an edge endpoint expression against an M1 LObject instance.
 *
 * @param data An LObject (typically the M1 instance carrying the edge,
 *             e.g., a Transition with $source, $target).
 * @param expr A path expression (see file-level JSDoc for syntax).
 * @returns The resolved LObject (with id and className), or null.
 */
export function evalEdgeExpression(data: any, expr: string): any | null {
    if (!data || !expr || typeof expr !== 'string') return null;

    const segments = parseSegments(expr);
    if (segments.length === 0) return null;

    // Regex matches a property name followed by a single numeric bracket access.
    // Group 1 = property name, group 2 = numeric index.
    const BRACKET_ACCESS = /^([^\[]+)\[(\d+)\]$/;

    let current: any = data;
    for (let i = 0; i < segments.length; i++) {
        if (current === null || current === undefined) return null;

        const seg = segments[i];
        if (!seg) return null;

        const bracketMatch = seg.match(BRACKET_ACCESS);
        if (bracketMatch) {
            // Property access followed by numeric bracket: e.g., "values[0]".
            const propName = bracketMatch[1];
            const idx = parseInt(bracketMatch[2], 10);

            const arr = current[propName];
            if (arr === null || arr === undefined) return null;
            current = arr[idx];
        } else {
            // Plain property access.
            current = current[seg];
        }
    }

    // Final validation: the result must look like an LObject (id + className).
    // Primitives (string, number, boolean) and plain objects without these
    // markers return null.
    if (current && typeof current === 'object' && current.id && current.className) {
        return current;
    }
    return null;
}
