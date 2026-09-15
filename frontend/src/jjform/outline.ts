/**
 * jjform/outline — the OUTLINE half of the portable form engine (slice 10b).
 *
 * Q8, ri-sciolta col peso di 2c (`Q8 Catalogo vs Outline.dc.html`, «la mia
 * raccomandazione»): «non e' un aut-aut, e' una divisione di ruoli». The
 * catalogue keeps the per-metaclass table and its `New` shortcut; the outline
 * becomes the surface where the containment tree is visible and where a create is
 * offered ON THE NODE THAT WILL OWN IT. `Q8 Catalogo vs Outline.dc.html`, mock 1b,
 * is the authority on the rendering; this file is the authority on nothing but the
 * MENU and the default expansion.
 *
 * ── The invariant of this directory, restated ─────────────────────────────────
 *
 * ZERO imports beyond the sibling TYPES of `shape.ts` and the two reason functions
 * of `create.ts`. Same rule as `shape.ts` and `create.ts`, same reason: one import
 * from `joiner/` would drag monaco and `window` behind it and end the portability.
 *
 * ── One source for the menu, never two ────────────────────────────────────────
 *
 * The «+» of a node offers exactly what the manager's `Add contained` bar offers,
 * and the «+» of the model node exactly what the catalogue's `New <Metaclass>`
 * offers. That is not a resemblance to be maintained: `childMenu` calls
 * `addChildReason` and `rootMenu` calls `newInstanceReason`, the SAME two functions
 * the bar and the toolbar already call. A second copy of either rule would agree
 * today and diverge tomorrow (R-FORM-15 is the precedent), and the design's own
 * sentence — «upper pieno = voce assente + motivo» — is `addChildReason`'s
 * contract read aloud.
 *
 * ── Absent, not disabled ──────────────────────────────────────────────────────
 *
 * A blocked entry is NOT in `entries`. It is in `blocked`, with its reason, so the
 * menu can print the sentence under the offers instead of a greyed-out row that
 * says nothing about why. Rule 1 of Livello 2, third surface to obey it.
 */

import type { ClassShape, MetamodelShape } from './shape';
import { addChildReason, newInstanceReason } from './create';

/** What kind of thing an outline row is. `broken` is a slot value that points at
 *  nothing — rendered, never skipped: a dangling pointer that disappears in
 *  silence is the state that makes a delete unsafe (12d), and the table already
 *  shows it in its own column. */
export type OutlineKind = 'model' | 'object' | 'broken';

/** One node of the containment tree. Plain and serializable: the tree is data,
 *  the rendering is the caller's — the same split every other module here keeps. */
export interface OutlineNode {
    /** DModel id for the root node, DObject id for an instance, the dead pointer's
     *  own text for a broken one (there is nothing else to key it by). */
    id: string;
    /** Display name, by the host's naming rule. Empty when the object has none. */
    name: string;
    /** Metaclass name. Empty for the model node and for a broken pointer. */
    cls: string;
    kind: OutlineKind;
    /** 0 for the model node, 1 for its roots, and so on. */
    depth: number;
    /** The owner's containment feature this node is held in. Null for the model
     *  node and for a root instance, which the model owns directly. */
    childKey: string | null;
    children: OutlineNode[];
}

/** One offer of a node's «+» menu. The three fields are exactly the arguments of
 *  the ONE create event (`create(cls, ownerId, childKey)`) minus the owner,
 *  which is the node the menu was opened on. */
export interface OutlineMenuEntry {
    /** Metaclass to create — keys into `MetamodelShape.classes`. */
    cls: string;
    /** The owner's slot it goes into; null for a root create. */
    childKey: string | null;
    /** `Add Port`, `New State` — what the row reads. */
    label: string;
}

/** An offer that is NOT made, and why. Printed as a sentence under the entries. */
export interface OutlineMenuBlock {
    /** The feature key for a child slot, the metaclass name for a root. */
    key: string;
    reason: string;
}

/** A node's whole menu. Both halves may be empty: a leaf metaclass with no
 *  containment feature has neither offers nor reasons, and its «+» is absent. */
export interface OutlineMenu {
    entries: OutlineMenuEntry[];
    blocked: OutlineMenuBlock[];
}

/**
 * The «+» menu of an INSTANCE node: the child slots of its metaclass.
 *
 * `counts` is how many values each slot ACTUALLY holds, holes excluded — the
 * caller counts them, because `formWrite.clearSlotValue` leaves holes and a raw
 * `values.length` would report a slot as full that is not. A key absent from
 * `counts` is read as zero, which is what an untouched slot holds.
 *
 * Order is the shape's, not alphabetical: a metamodel declares its features in an
 * order, and re-sorting them here would make the menu disagree with the form.
 */
export function childMenu(
    cls: ClassShape | null | undefined,
    counts: Record<string, number> = {},
    shape?: MetamodelShape,
): OutlineMenu {
    const menu: OutlineMenu = { entries: [], blocked: [] };
    if (!cls) return menu;
    for (const child of cls.children) {
        // `shape` is OPTIONAL and is what lets the abstract gate of §2.6 fire here
        // too. Without it this menu and the children bar would disagree — one
        // offering «Add Node» on an abstract target while the other refused it —
        // and two surfaces over one rule is the divergence the outline was written
        // to avoid («the SAME two functions», the header above). A caller that
        // cannot resolve the shape gets exactly the verdict it got before.
        const reason = addChildReason(child, counts[child.key] ?? 0, shape?.classes?.[child.of]);
        if (reason) menu.blocked.push({ key: child.key, reason });
        else menu.entries.push({ cls: child.of, childKey: child.key, label: `Add ${child.of}` });
    }
    return menu;
}

/**
 * The «+» menu of the MODEL node: the metaclasses the model may own directly.
 *
 * The candidates are the `root && !abstract` ones and nothing else, and that is
 * the deliberate reading of open question 3 of the discovery: listing the reason
 * of every non-rootable metaclass would build a wall of sentences saying the same
 * thing, and the catalogue already prints each one under its own collection
 * (`newInstanceReason`'s «Created from its container's form (…)»). What survives
 * into `blocked` is therefore the one case a person can act on — a singleton whose
 * single instance already exists.
 *
 * `instanceCounts` is keyed by metaclass NAME, as `MetamodelShape.classes` is.
 * Only a singleton reads it; for everything else the count is irrelevant.
 *
 * Order is the shape's key order, for the reason `childMenu`'s is.
 */
export function rootMenu(shape: MetamodelShape | null | undefined, instanceCounts: Record<string, number> = {}): OutlineMenu {
    const menu: OutlineMenu = { entries: [], blocked: [] };
    const classes = shape?.classes;
    if (!classes) return menu;
    for (const key in classes) {
        const cls = classes[key];
        if (!cls || !cls.root || cls.abstract) continue;
        const reason = newInstanceReason(cls, instanceCounts[key] ?? 0);
        if (reason) menu.blocked.push({ key, reason });
        else menu.entries.push({ cls: key, childKey: null, label: `New ${key}` });
    }
    return menu;
}

/** How deep the tree opens on its own. Two levels — the model and its roots — is
 *  what mock 1b shows open before anything is clicked, and it is the depth at
 *  which the panel still says «where» without becoming a wall on a large model.
 *  Deeper nodes are opened by hand, and the expansion state is the host's. */
export const OUTLINE_DEFAULT_OPEN_DEPTH = 2;

/** Whether a node at `depth` is open before the user has said otherwise. */
export function outlineOpenByDefault(depth: number): boolean {
    return depth < OUTLINE_DEFAULT_OPEN_DEPTH;
}

/**
 * What a row reads.
 *
 * A nameless object is NOT printed as an empty string: a row with no text is a row
 * that cannot be clicked with confidence, and the table beside it already prints
 * `unnamed` in the same situation. A broken pointer says what it is, because the
 * one thing the user needs from it is that it is not an object.
 */
export function outlineLabel(node: OutlineNode | null | undefined): string {
    if (!node) return '';
    if (node.kind === 'broken') return 'dangling pointer';
    const name = (node.name ?? '').trim();
    return name.length > 0 ? name : 'unnamed';
}
