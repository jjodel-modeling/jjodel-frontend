/**
 * Format a JjEL runtime value for REPL display in Jjodie's Code mode.
 *
 * Recognizes JjEL-specific shapes (today: JjelFunction, marker
 * `__jjelFunction: true`) and renders them as readable bracketed labels
 * instead of leaking internal fields via JSON.stringify.
 *
 * `name` field on JjelFunction is intentionally NOT surfaced: the function
 * value carries no name (the registered name lives only as a key in the
 * EvaluationContext.builtins Map). Improving to `<function name>` would
 * require extending the JjelFunction interface with an optional `name`
 * field populated at registration time — left as a future enhancement.
 */
export function formatJjelValue(value: unknown): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        return '[' + value.map(formatJjelValue).join(', ') + ']';
    }
    if (typeof value === 'object') {
        if ((value as { __jjelFunction?: unknown }).__jjelFunction === true) return '<function>';
        const name = (value as { name?: unknown }).name;
        if (typeof name === 'string' && name.length > 0) return name;
        try { return JSON.stringify(value); }
        catch { return '[object]'; }
    }
    return String(value);
}
