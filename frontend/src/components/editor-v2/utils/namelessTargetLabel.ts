/**
 * The label of a reference target that has no name: `<Class> (unnamed)`, as the Text tab's
 * confirm panel names such an object, on the default view and on the IR form (R-TXT-59,
 * amending R-TXT-47 D5 and D6).
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
    return `${l.instanceof?.name || 'Object'} (unnamed)`;
}

/**
 * The labels of the reference targets of ONE list, in its order, for the widgets where a
 * target is something to recognise and choose (ReferenceWidget, ListWidget, ReferencePicker):
 * the label above, reused here so the surfaces cannot drift (R-TXT-59).
 *
 * The index is for two DIFFERENT targets of one class, which would otherwise read the same in
 * this list: the first stays bare, the next read `Port (unnamed) 2`, and so on. The same target
 * held twice is one target and keeps one label.
 *
 * Output: one entry per input, `undefined` where the target has a name or is not there at all.
 * Display only, as above.
 */
export function unnamedTargetLabels(targets: any[]): Array<string | undefined> {
    const seenByClass = new Map<string, Map<unknown, number>>();
    return targets.map((l, position) => {
        const label = namelessTargetLabel(l);
        if (label === undefined) return undefined;
        let seen = seenByClass.get(label);
        if (!seen) seenByClass.set(label, seen = new Map());
        const key = l.id ?? position;
        if (!seen.has(key)) seen.set(key, seen.size + 1);
        const n = seen.get(key)!;
        return n === 1 ? label : `${label} ${n}`;
    });
}
