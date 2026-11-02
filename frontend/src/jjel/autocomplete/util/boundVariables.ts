/**
 * The variables bound by the `forall` / `exists` binding lists of a text (R-FA, P-2026-11-02-1330).
 *
 * Read on the text before the cursor, so the list is an approximation of scope: a variable stays
 * offered after its `forall` closes. Both spellings of R-FA-1 count: `forall x, y in S` and the
 * `, y in B` that continues a list after a collection.
 */

const NAME = '[A-Za-z_$][\\w$]*';
const LIST = `${NAME}(?:\\s*,\\s*${NAME})*`;
const HEAD = new RegExp(`\\b(?:forall|exists)\\s+(${LIST})\\s+in\\b`, 'gi');
const MORE = new RegExp(`,\\s*(${LIST})\\s+in\\b`, 'gi');

/** The names bound before the end of `text`, in order of first appearance, each once. */
export function boundVariablesBefore(text: string): string[] {
    const first = text.search(/\b(?:forall|exists)\b/i);
    if (first < 0) return [];
    const scan = text.slice(first);
    const found: Array<{ at: number; names: string[] }> = [];
    for (const re of [HEAD, MORE]) {
        for (const m of scan.matchAll(re)) {
            found.push({ at: (m.index ?? 0) + m[0].indexOf(m[1]), names: m[1].split(',').map(n => n.trim()) });
        }
    }
    found.sort((a, b) => a.at - b.at);
    return [...new Set(found.flatMap(f => f.names))];
}
