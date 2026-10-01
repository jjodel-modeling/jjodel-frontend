/**
 * metaclassEntries — the metaclass list of an IR view, one entry per IDENTITY.
 *
 * Two metaclasses declared by different metamodels are different metaclasses even
 * when they share a name (R-MCID-1, 2026-09-19). `ir.metaclasses` stays a list of
 * names; the identity lives in `authoringMetaclassPins`, whose value under a name is
 * a class id or an array of class ids. The authoring list therefore shows one row
 * per identity, and everything the three host panels do to that list — derive the
 * rows, offer the picker, label a row, add a class, remove a row — is a pure
 * function here.
 *
 * Pure by contract, on the model of `committableMatching.ts` and `metaclassPin.ts`:
 * type-only imports, so it loads in the node vitest env where `MatchingSection.tsx`
 * (ui barrel → scss) does not. `MatchingSection.tsx` re-exports it.
 */

import type { SelectOptionGroup } from '../../../ui';
import type { AuthoringMetaclassPins } from '../ir/irTypes';
import type { PinnableIR } from '../ir/metaclassPin';

/**
 * One entry of the metaclass picker: a class, and the metamodel that declares it.
 *
 * `ir.metaclasses` holds NAMES, so the name alone cannot say which class was picked
 * when two metamodels declare the same one. The picker therefore carries the id and
 * writes it as the authoring pin, while the name keeps going into `metaclasses`.
 */
export interface MetaclassChoice {
    id: string;
    name: string;
    metamodelName: string;
}

/**
 * One row of the metaclass list. `id` is the pinned class; absent when the name is
 * listed without a pin (a view authored before pins existed: "any class with that
 * name").
 */
export interface MetaclassEntry {
    name: string;
    id?: string;
}

/**
 * The rows of the list: for each name in list order, one entry per pinned id (array
 * pin, in array order), one entry for a string pin, one entry WITHOUT id when the
 * name has no pin. An empty array or an empty string reads as no pin — the same
 * reading `withMetaclassPins` gives them — so the row stays visible and removable.
 */
export function metaclassEntries(list: string[], pins: AuthoringMetaclassPins | undefined): MetaclassEntry[] {
    const out: MetaclassEntry[] = [];
    for (const name of list) {
        const pinned = pins?.[name];
        if (Array.isArray(pinned) && pinned.length > 0) {
            for (const id of pinned) out.push({ name, id });
        } else if (typeof pinned === 'string' && pinned !== '') {
            out.push({ name, id: pinned });
        } else {
            out.push({ name });
        }
    }
    return out;
}

/**
 * The picker options, grouped by metamodel. `value` is the class ID (the name is
 * ambiguous by construction — that is the whole point), `label` the class name.
 *
 * `taken` are the entries already in the view's list. A choice is excluded when its
 * ID is pinned there, or when its NAME is listed without a pin: an unpinned name
 * already means "every class with that name", and offering one of them would
 * silently narrow it. A homonym of a pinned class stays available — that is the
 * second identity of the same name.
 */
export function metaclassGroups(choices: MetaclassChoice[], taken: MetaclassEntry[]): SelectOptionGroup[] {
    const takenIds = new Set<string>();
    const unpinnedNames = new Set<string>();
    for (const e of taken) {
        if (e.id !== undefined) takenIds.add(e.id);
        else unpinnedNames.add(e.name);
    }
    const groups: SelectOptionGroup[] = [];
    const byMetamodel = new Map<string, SelectOptionGroup>();
    for (const c of choices) {
        if (takenIds.has(c.id) || unpinnedNames.has(c.name)) continue;
        let g = byMetamodel.get(c.metamodelName);
        if (!g) {
            g = { label: c.metamodelName, options: [] };
            byMetamodel.set(c.metamodelName, g);
            groups.push(g);
        }
        g.options.push({ value: c.id, label: c.name });
    }
    return groups.filter((g) => g.options.length > 0);
}

/**
 * How an entry reads in the list: `metamodel.Name` when the entry has an id and more
 * than one metamodel declares that name, the bare name otherwise.
 *
 * The qualification comes from the entry's id, not from the first candidate: the id
 * is what says which of the homonyms the row stands for. Without an id (view
 * authored before pins existed) the name stays bare — inventing a metamodel there
 * would be a guess. An id no choice carries (its class is gone) reads bare too.
 */
export function metaclassChipLabel(entry: MetaclassEntry, choices: MetaclassChoice[]): string {
    const homonyms = choices.filter((c) => c.name === entry.name);
    if (homonyms.length < 2) return entry.name;
    const hit = entry.id !== undefined ? homonyms.find((c) => c.id === entry.id) : undefined;
    return hit ? `${hit.metamodelName}.${entry.name}` : entry.name;
}

/** Ids as a pin value: one id is the plain string, several are the array. Never empty. */
function pinValue(ids: string[]): string | string[] {
    return ids.length === 1 ? ids[0] : ids;
}

/**
 * `draft` with the given list and pin map. An empty map drops the KEY instead of
 * writing `{}` (byte-identical to an ir authored without pins); otherwise the
 * spread keeps an existing key where it was, so an ir with one identity per name is
 * written exactly as before.
 */
function withListAndPins<T extends PinnableIR>(draft: T, metaclasses: string[], pins: AuthoringMetaclassPins): T {
    if (Object.keys(pins).length === 0) {
        const { authoringMetaclassPins, ...rest } = draft;
        return { ...rest, metaclasses } as T;
    }
    return { ...draft, metaclasses, authoringMetaclassPins: pins };
}

/**
 * `draft` without the row `entry`, or `draft` itself when the entry is not there.
 *
 * - entry with an id: that id leaves the pin under its name. Others remain (two
 *   left stay an array, one left collapses to the plain string). If none remain the
 *   key is dropped AND the name leaves `metaclasses`.
 * - entry without an id: the name and any pin under it leave.
 *
 * Removing one identity of a name that keeps others does not move `metaclasses`, so
 * the panel's `withMetaclassPins` returns the patch untouched: the shrunk pin is
 * written HERE, in the same patch (see the note on `withMetaclassPins`).
 */
export function withoutMetaclassEntry<T extends PinnableIR>(draft: T, entry: MetaclassEntry): T {
    const list = Array.isArray(draft.metaclasses) ? draft.metaclasses : [];
    if (!list.includes(entry.name)) return draft;
    const pins = { ...(draft.authoringMetaclassPins ?? {}) };
    const dropName = () => {
        delete pins[entry.name];
        return withListAndPins(draft, list.filter((n) => n !== entry.name), pins);
    };
    if (entry.id === undefined) return dropName();

    const pinned = pins[entry.name];
    const ids = Array.isArray(pinned) ? pinned : pinned ? [pinned] : [];
    if (!ids.includes(entry.id)) return draft;
    const remaining = ids.filter((id) => id !== entry.id);
    if (remaining.length === 0) return dropName();
    pins[entry.name] = pinValue(remaining);
    return withListAndPins(draft, list, pins);
}

/**
 * `draft` with the picked class added, or `null` when there is nothing to do.
 *
 * - the class is already pinned (by id): nothing.
 * - its name is not in the list: the name is appended and the id pinned.
 * - its name is in the list with a pin: the id is appended to it (a string becomes a
 *   two-element array).
 * - its name is in the list WITHOUT a pin: nothing. An unpinned name already means
 *   "every class with that name" and must not be narrowed silently; the picker does
 *   not offer this case, this is the same rule held at the write.
 */
export function withMetaclassChoice<T extends PinnableIR>(draft: T, choice: MetaclassChoice | undefined): T | null {
    if (!choice) return null;
    const list = Array.isArray(draft.metaclasses) ? draft.metaclasses : [];
    const pins = { ...(draft.authoringMetaclassPins ?? {}) };
    if (!list.includes(choice.name)) {
        pins[choice.name] = choice.id;
        return withListAndPins(draft, [...list, choice.name], pins);
    }
    const pinned = pins[choice.name];
    const ids = Array.isArray(pinned) ? pinned : pinned ? [pinned] : [];
    if (ids.length === 0 || ids.includes(choice.id)) return null;
    pins[choice.name] = pinValue([...ids, choice.id]);
    return withListAndPins(draft, list, pins);
}
