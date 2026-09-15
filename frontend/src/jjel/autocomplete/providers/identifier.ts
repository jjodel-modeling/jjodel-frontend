/**
 * JjEL Identifier Provider
 *
 * Suggests:
 *   - Level 1 collections (classes, attributes, references, packages, enumerations, instances)
 *   - Level 2 context vars  (data, node)
 *   - Class names of the active metamodel — read on-demand from buildJodieJjelVariables(),
 *     which gives parity with the runtime evaluation context.
 *
 * The class-name set is recomputed each call. With the keystroke debounce in the UI
 * (~50ms) this is cheap and naturally reactive: switching the active metamodel
 * changes what the next call sees, no subscription needed.
 */

import type { Suggestion } from '../../../jjscript/autocomplete/types';
import type { JjelAutocompleteContext } from '../context';
import { buildJodieJjelVariables } from '../../../components/Jodie/jodieJjelContext';

interface BuiltinIdentDef {
    name: string;
    description: string;
    /** Collection-shaped (Level 1) vs scalar (Level 2). Used for badge rendering. */
    kind: 'collection' | 'context';
}

const LEVEL_1_COLLECTIONS: BuiltinIdentDef[] = [
    { name: 'classes',      description: 'All classes in active metamodel',     kind: 'collection' },
    { name: 'attributes',   description: 'All attributes (flat, all classes)',  kind: 'collection' },
    { name: 'references',   description: 'All references (flat, all classes)',  kind: 'collection' },
    { name: 'packages',     description: 'All packages (incl. nested)',         kind: 'collection' },
    { name: 'enumerations', description: 'All enumerations',                    kind: 'collection' },
    { name: 'instances',    description: 'All M1 instances',                    kind: 'collection' },
];

const LEVEL_2_CONTEXT: BuiltinIdentDef[] = [
    { name: 'data', description: 'Currently selected model element', kind: 'context' },
    { name: 'node', description: 'Currently selected graph node',    kind: 'context' },
];

const RESERVED_FOR_BUILTINS = new Set<string>([
    ...LEVEL_1_COLLECTIONS.map(b => b.name),
    ...LEVEL_2_CONTEXT.map(b => b.name),
    'metamodel', 'project',
]);

function matchesPrefix(name: string, filter: string): boolean {
    if (!filter) return true;
    return name.toLowerCase().startsWith(filter.toLowerCase());
}

/** Read class names from the same context that the evaluator sees. Defensive: tolerates errors. */
function getActiveClassNames(): string[] {
    try {
        const vars = buildJodieJjelVariables();
        const classes = (vars as any).classes;
        if (!Array.isArray(classes)) return [];
        const out: string[] = [];
        for (const c of classes) {
            const n = c?.name;
            if (typeof n === 'string' && n.length > 0) out.push(n);
        }
        return out;
    } catch {
        return [];
    }
}

export function getJjelIdentifierSuggestions(context: JjelAutocompleteContext): Suggestion[] {
    const { parseContext, currentWord } = context;

    // Identifiers don't apply after a dot — that's the method provider's territory.
    if (parseContext === 'after-dot') return [];

    const filter = currentWord;
    const out: Suggestion[] = [];

    // Level 1 collections — bumped slightly higher in 'after-forall-in' state since the
    // user is almost always reaching for one of these.
    const collectionBoost = parseContext === 'after-forall-in' ? 100 : 88;
    for (const def of LEVEL_1_COLLECTIONS) {
        if (!matchesPrefix(def.name, filter)) continue;
        out.push({
            text: def.name,
            displayText: def.name,
            type: 'class', // SuggestionType has no 'collection'; reuse 'class' for badge styling on the JjEL side.
            description: def.description,
            priority: def.name.toLowerCase().startsWith(filter.toLowerCase()) ? collectionBoost : collectionBoost - 10,
            icon: 'bi-collection',
            metadata: { jjelKind: 'collection' },
        });
    }

    // Level 2 context vars — only useful at top-level (after-forall-in is shaped for collections).
    if (parseContext !== 'after-forall-in') {
        for (const def of LEVEL_2_CONTEXT) {
            if (!matchesPrefix(def.name, filter)) continue;
            out.push({
                text: def.name,
                displayText: def.name,
                type: 'value',
                description: def.description,
                priority: def.name.toLowerCase().startsWith(filter.toLowerCase()) ? 80 : 70,
                icon: 'bi-cursor',
                metadata: { jjelKind: 'context' },
            });
        }
    }

    // Class names of the active metamodel.
    const classNames = getActiveClassNames();
    const classBoost = parseContext === 'after-forall-in' ? 90 : 85;
    for (const name of classNames) {
        if (RESERVED_FOR_BUILTINS.has(name)) continue;
        if (!matchesPrefix(name, filter)) continue;
        out.push({
            text: name,
            displayText: name,
            type: 'class',
            description: 'Metamodel class',
            priority: name.toLowerCase().startsWith(filter.toLowerCase()) ? classBoost : classBoost - 10,
            icon: 'bi-square-fill',
            metadata: { jjelKind: 'class' },
        });
    }

    return out;
}
