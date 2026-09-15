/**
 * Pure lexical check on a model element's name.
 *
 * The three failure cases are re-hosted verbatim from the `Naming error view`
 * of the seeded `Default Validation` viewpoint (`redux/store.tsx`,
 * `onDataUpdate`): empty name, first character outside `[\p{L}_$]`, and a
 * character outside the allowed set. That view stopped being evaluated with
 * the classic shutdown (Fase 5a), so the rule has had no runtime since: this
 * module re-hosts it, it does not invent it.
 *
 * Kept pure and free of framework imports so it is unit-testable on its own,
 * same convention as `components/editor-v2/problems/conformanceToProblems.ts`.
 */

export type NameShapeVerdict = 'ok' | 'empty' | 'bad_first_char' | 'bad_charset';

/** First character: a letter in any script, `_` or `$`. */
const NAME_FIRST_CHAR = /[\p{L}_$]/u;

/** Whole name: a `[\p{L}_$]` head, then letters, digits, spaces, apostrophes, `$`, `_`.
 *  `’` is the typographic apostrophe, accepted alongside the ASCII one. */
const NAME_WHOLE = /^[\p{L}_$]+[\p{L}\p{N}$_\s'’]*$/u;

/**
 * Classifies a name. Returns `'ok'` when the name is well formed.
 * `undefined` and `null` are treated as an empty name, not as an error to throw:
 * an element with no name at all is exactly the first case the rule covers.
 */
export function checkNameShape(name: string | undefined | null): NameShapeVerdict {
    const n = name ?? '';
    if (n.length === 0) return 'empty';
    if (!NAME_FIRST_CHAR.test(n[0])) return 'bad_first_char';
    if (!NAME_WHOLE.test(n)) return 'bad_charset';
    return 'ok';
}

/** Human-readable reason for a failing verdict, phrased like the other validator messages. */
export function nameShapeMessage(verdict: NameShapeVerdict, label: string): string {
    switch (verdict) {
        case 'empty':
            return `Object "${label}" has no name`;
        case 'bad_first_char':
            return `Object "${label}" must begin with a letter or the $ _ symbols`;
        case 'bad_charset':
            return `Object "${label}" can only contain letters, digits, spaces, apostrophes, or the $ _ symbols`;
        default:
            return `Object "${label}" has a well-formed name`;
    }
}
