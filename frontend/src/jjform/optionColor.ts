/**
 * optionColor — which colour slot an option wears.
 *
 * The rule, and it is the whole module: two options a user is choosing BETWEEN never
 * wear the same colour. Colour identifies an alternative WITHIN its own choice set,
 * not an entity across the application — the same target reached through two different
 * references may well come out in two different colours, and that is not a defect. It
 * is what makes the colour readable at all: a picker with thirty candidates cannot give
 * thirty stable identities, but it can always tell its own first seven apart.
 *
 * ── Why seven ────────────────────────────────────────────────────────────────
 *
 * Three hue families are reserved for state in this design system — red-500
 * (`--color-error`), amber-500 (`--color-warning`), green-500 (`--color-success`) — and
 * a categorical slot may not borrow one: a rose pill beside a red error border is a
 * misread waiting to happen. With those out, seven ordered hues clear the separation
 * floors in both light and dark and an eighth does not. The measurements are in
 * `styles/tokens/_colors-light.scss`, next to the values they were taken on.
 *
 * ── Why it cycles ────────────────────────────────────────────────────────────
 *
 * Past the seventh option the assignment wraps: option 8 wears slot 1 again. The
 * alternative — leaving everything past the seventh neutral — was measured against the
 * request and rejected: a reference offering thirty candidates would show seven
 * coloured pills and twenty-three grey ones, which is the opposite of what colouring
 * them was for. The cost is stated rather than hidden: beyond seven options the
 * guarantee weakens from «no two alternatives share a colour» to «no two of any seven
 * consecutive alternatives share one».
 *
 * ── Pure, and structurally typed ─────────────────────────────────────────────
 *
 * `jjform/` may not import from `components/`, so the option list is taken by SHAPE
 * rather than by name: `FormFieldOptionGroup[]` satisfies `OptionGroupLike[]` without
 * either side importing the other. No proxies, no Redux, no DOM — the same call answers
 * for a widget, for the picker and for a test.
 */

/** How many slots the palette declares. The tokens are `--color-opt-1-*` … `-7-*`. */
export const OPTION_COLOR_SLOTS = 7;

/** An option, as this module needs to see it: something with a value. */
export interface OptionLike {
    readonly value: string;
}

/** A titled run of options — `FormFieldOptionGroup` satisfies this structurally. */
export interface OptionGroupLike {
    readonly options: readonly OptionLike[];
}

/**
 * The slot of `value` among `groups`, 1-based, or `null` when it is not offered.
 *
 * `null` is a real answer and not a failure: a dangling pointer, a literal removed from
 * its enumeration, or an offer function that threw and left the list empty all land
 * here, and none of them may be given a colour that would claim the value is one of the
 * alternatives. The caller renders its base treatment, which is what it drew before
 * there were slots at all.
 *
 * Position is taken over the groups FLATTENED, in the order they arrive, so a value's
 * slot does not depend on which group it sits in. The order is the one the host built
 * the list with; this module never sorts, because a sort here would silently disagree
 * with the order the picker paints.
 */
export function optionSlot(
    groups: readonly OptionGroupLike[] | undefined | null,
    value: string | null | undefined,
): number | null {
    if (!groups || !value) return null;
    let i = 0;
    for (const group of groups) {
        for (const option of group.options ?? []) {
            if (option.value === value) return (i % OPTION_COLOR_SLOTS) + 1;
            i++;
        }
    }
    return null;
}

/**
 * The modifier class for a slot, or `''` when there is none.
 *
 * A CLASS and not a custom property written onto the element: the design system keeps
 * its variables in `styles/tokens/` (CLAUDE.md rule 28), and seven blocks in a
 * stylesheet cost less than a colour computed at render and handed to the DOM. The
 * empty string composes into a `className` without a stray space.
 */
export function optionSlotClass(base: string, slot: number | null): string {
    return slot ? ` ${base}--slot-${slot}` : '';
}
