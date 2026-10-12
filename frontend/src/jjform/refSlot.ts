/**
 * jjform/refSlot — what ONE non-containment reference slot of an instance detail offers
 * (#172, R-REF-3, R-REF-4): a row per value with the gestures of its menu, and what the
 * foot of the slot may link.
 *
 * In the instance detail a reference is on screen once, as its section of the list
 * (R-REF-1), so the section takes what the form field did: pick, change, unset, append,
 * remove. This module decides WHICH of those a slot offers, from the reference's bounds,
 * the values it holds and what the viewer may write. It decides nothing about how they
 * are drawn and performs no write: the host calls the existing `formWrite` functions.
 *
 * ── The raw index is the address ──────────────────────────────────────────────
 *
 * A clear leaves a HOLE and does not shorten the array (R-FORM-7), so the position of a
 * value among the filled ones is not its position in the slot. Every row carries the
 * index it has in the RAW array, and every write of that row addresses it. Re-packing
 * here is how a removal lands on the neighbour, and how a single-valued slot gets a
 * second target: measured on the form field, which writes position 0 whatever the slot
 * holds (`docs/discovery/discovery_2026-10-10_172_references_once.md` §3.5).
 *
 * Pure, like every module of this directory: the two reads it needs about the instances
 * (does a pointer resolve, is a value locked for this viewer) are handed in.
 */

import type { RefShape } from './shape';

/** A gesture of a row's menu, in the order the menu prints them. */
export type RefRowAction = 'open' | 'change' | 'remove';

/** One value of the slot, as the section lists it. */
export interface RefSlotRow {
    /** The pointer the row shows. */
    value: string;
    /** Its position in the RAW array: the address of every write on this row. */
    index: number;
    /** The pointer does not resolve: the row has no Open, and keeps its write. */
    broken: boolean;
    actions: RefRowAction[];
}

export interface RefSlotControls {
    rows: RefSlotRow[];
    /** Why the viewer cannot write the slot, or null when they can. */
    lockedBy: 'derived' | 'readOnly' | 'profile' | null;
    /** The picker of a single-valued slot offers «(none)»: its lower bound is 0. */
    allowNone: boolean;
    /**
     * «Link existing»: null when it is not offered; the raw index to set on an empty
     * single-valued slot; `'append'` on a multi-valued one below its upper bound.
     */
    link: number | 'append' | null;
    /** The filled values reached the upper bound. Unbounded never is. */
    full: boolean;
}

/** What the rule needs to know beyond the reference and its values. */
export interface RefSlotReads {
    /** The pointer resolves to a live instance. */
    resolves: (value: string) => boolean;
    /** The viewer may write the instance that owns the slot (its profile says `edit`). */
    sourceEditable: boolean;
    /** A value the viewer may neither remove nor replace (#157 step B). Absent: none. */
    isLocked?: (value: string) => boolean;
}

/** A hole of the raw array: `undefined`, `null`, or a string with nothing in it. */
function isHole(v: unknown): boolean {
    return v == null || String(v).trim() === '';
}

/**
 * The rows of a slot and what its foot may link.
 *
 * `raw` is the slot's RAW `values`, holes included, and it is not mutated. A broken
 * pointer is a row: it holds a position, counts toward the upper bound, and the one
 * thing to do with it is to take it out.
 */
export function refSlotControls(
    ref: Pick<RefShape, 'lower' | 'upper' | 'readOnly' | 'derived'>,
    raw: readonly unknown[],
    reads: RefSlotReads,
): RefSlotControls {
    // `readOnly` is `derived || changeable === false` in the shape, so derived is asked first.
    const lockedBy = ref.derived ? 'derived'
        : ref.readOnly ? 'readOnly'
            : !reads.sourceEditable ? 'profile'
                : null;
    const writable = lockedBy === null;
    const single = ref.upper === 1;
    const optional = ref.lower < 1;

    const rows: RefSlotRow[] = [];
    for (let i = 0; i < raw.length; i++) {
        if (isHole(raw[i])) continue;
        const value = String(raw[i]);
        const broken = !reads.resolves(value);
        const actions: RefRowAction[] = [];
        if (!broken) actions.push('open');
        if (writable && !reads.isLocked?.(value)) {
            if (single) actions.push('change');
            // On a single-valued slot Remove is the write of «(none)»: a required one has neither.
            if (!single || optional) actions.push('remove');
        }
        rows.push({ value, index: i, broken, actions });
    }

    const full = ref.upper !== -1 && rows.length >= ref.upper;
    let link: RefSlotControls['link'] = null;
    if (writable) {
        if (single) link = rows.length === 0 ? 0 : null;
        else link = full ? null : 'append';
    }
    return { rows, lockedBy, allowNone: single && optional, link, full };
}

/** The row gets the menu button: it offers something besides Open. */
export function hasRowMenu(row: RefSlotRow): boolean {
    return row.actions.some(a => a !== 'open');
}
