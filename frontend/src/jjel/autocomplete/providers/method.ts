/**
 * JjEL Method Provider
 *
 * Triggered after `.` or `?.`. Returns all known built-in methods, filtered by
 * the prefix that follows the dot.
 *
 * TODO (next stage): infer the type of the receiver expression and restrict
 * the method set to the compatible category. For now we surface the union and
 * boost commonly used names.
 */

import type { Suggestion } from '../../../jjscript/autocomplete/types';
import type { JjelAutocompleteContext } from '../context';
import {
    ALL_BUILTIN_METHODS,
    COMMON_METHOD_NAMES,
    BuiltinMethod,
} from '../../metadata/builtins';

function matchesPrefix(name: string, filter: string): boolean {
    if (!filter) return true;
    return name.toLowerCase().startsWith(filter.toLowerCase());
}

function priorityFor(method: BuiltinMethod, filter: string): number {
    const base = COMMON_METHOD_NAMES.has(method.name) ? 75 : 60;
    if (!filter) return base;
    if (method.name.toLowerCase() === filter.toLowerCase()) return base + 25;
    if (method.name.toLowerCase().startsWith(filter.toLowerCase())) return base + 15;
    return base;
}

export function getJjelMethodSuggestions(context: JjelAutocompleteContext): Suggestion[] {
    if (context.parseContext !== 'after-dot') return [];

    const filter = context.currentWord;
    const out: Suggestion[] = [];

    // Deduplicate by name: some methods (e.g. `reverse`, `contains`, `indexOf`,
    // `isEmpty`, `isNotEmpty`, `format`) appear in more than one category.
    // We keep the first occurrence (string comes first in ALL_BUILTIN_METHODS)
    // and surface the others' categories in the description until type
    // inference lands.
    const seen = new Map<string, BuiltinMethod[]>();
    for (const m of ALL_BUILTIN_METHODS) {
        if (!matchesPrefix(m.name, filter)) continue;
        const existing = seen.get(m.name);
        if (existing) existing.push(m);
        else seen.set(m.name, [m]);
    }

    for (const [name, defs] of seen) {
        const primary = defs[0];
        const categories = defs.map(d => d.category).join(', ');
        const description = defs.length > 1
            ? `${primary.signature} — ${primary.description} [${categories}]`
            : `${primary.signature} — ${primary.description}`;
        const jjelKind = primary.category === 'class-structural'
            ? 'class-property'
            : primary.category === 'meta'
                ? 'meta-property'
                : 'method';
        const icon = primary.category === 'class-structural'
            ? 'bi-square-fill'
            : primary.category === 'meta'
                ? 'bi-diagram-3'
                : 'bi-three-dots';
        out.push({
            text: name,
            displayText: name,
            type: 'attribute', // reuse SuggestionType; UI maps jjelKind to a category-specific badge
            description,
            priority: priorityFor(primary, filter),
            icon,
            metadata: { jjelKind, category: primary.category, signature: primary.signature },
        });
    }

    return out;
}
