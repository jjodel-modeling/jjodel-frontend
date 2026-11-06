/**
 * The label of a reference target that has no name: `: <Class>`, as the target's own
 * header reads (R-TXT-47 D5 on the default view, D6 on the IR form).
 *
 * Display only. The target's `name` stays '' everywhere else, and the memory of names never
 * sees this string (R-TXT-46).
 *
 * Input: the resolved L object of the target, or anything shaped like it (`name`,
 * `instanceof.name`). Output: the label when the target is nameless, `undefined` when it has
 * a name or is not there at all. No imports, so the test bench can execute it directly.
 */
export function namelessTargetLabel(l: any): string | undefined {
    if (!l || l.name) return undefined;
    return `: ${l.instanceof?.name || 'Object'}`;
}
