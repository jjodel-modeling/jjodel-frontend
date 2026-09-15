/**
 * jjform/palettes — the FORM PALETTE, a closed preset of APPEARANCE (slice R-SKIN).
 *
 * Design source: memo `docs/ratifiche/claude_2026-09-04_2302_memo_ratifica_form_skins.md`,
 * ratified R-SKIN-1..4 + R-SKIN-3-bis, 04-09-2026.
 *
 * ── What a palette is, and what it is not ─────────────────────────────────────
 *
 * A palette REMAPS NINE TOKENS the form and the manager table already read — surfaces,
 * borders, the muted tones — and does nothing else. It introduces no CSS property, offers
 * the user no colour and no slider, and is chosen by NAME from a closed list. Measured in
 * the phase 1 discovery (§2): `irFormStyle.scss` applies zero literal colours in 1243
 * lines, so appearance is entirely a matter of which values those tokens carry.
 *
 * ORTHOGONAL TO THE THEME of `themes.ts`, which is the LAYOUT axis (label placement,
 * density, section chrome). `Compact` + `Paper` is a legitimate combination, and neither
 * axis may reach into the other's fields: a palette that moved a padding would make the
 * two into one knob with two names.
 *
 * ── Why this module carries no colours ────────────────────────────────────────
 *
 * `themes.ts` carries its scales as numbers, because the renderer spends them in JS. A
 * palette's values are COLOURS, and rule 28 puts colours in `styles/tokens/` and nowhere
 * else — here that is `styles/tokens/_form-palettes.scss`. Holding hex values here too
 * would be a second source of truth for the same nine tokens, kept in step by hand
 * forever. What this module holds is what CSS cannot: the closed list of names, which one
 * is the default, the guard that admits a persisted string, and the attribute value the
 * stylesheet keys on.
 *
 * ── The invariant of this directory ───────────────────────────────────────────
 *
 * ZERO imports, like `themes.ts`, `shape.ts` and `nav.ts`: one import from `joiner/`
 * would drag monaco and window-bound modules behind it and end the portability.
 *
 * ── A word that was already taken ─────────────────────────────────────────────
 *
 * This axis was ratified as «skin» and renamed before a line was written (R-SKIN-3-bis).
 * The phase 1 discovery measured the word already in use for something else in exactly
 * these files: `formAutoLayout.ts` imports `irTypes.FormTheme` AS `LegacySkin` and exports
 * `LEGACY_SKIN_PRESET`, and the form's own root already renders `ir-form--plain`. Two
 * senses of one word on one element is a cost paid at every reading; `palette` costs
 * nothing and says exactly what the thing does.
 *
 * `DViewElement` also carries a `palette` field of its own (`view/viewElement/view.tsx`),
 * the legacy per-view colour map the classic CSS compiler reads. Different name, different
 * class member, no collision — but they sit close enough that the field added for this
 * axis is called `formPalette` and never `palette`.
 */

/**
 * The four presets, by name. Capitalised like `FormThemeName`, and for the same reason:
 * the NAME is what a project persists, so it reads back as it was chosen.
 */
export type FormPaletteName = 'Slate' | 'Paper' | 'Ink' | 'Mist';

/** What a palette states here. Not its colours — see the header. */
export interface FormPalette {
    /** The `data-palette` value the stylesheet keys on. Lowercase by convention with
     *  every other `data-*` this codebase writes (`data-theme`, `data-density`). */
    attr: string;
    /** What a chooser shows. Identical to the name today, and separate anyway: a label is
     *  UI text and a name is a persisted literal, and the day one is translated the other
     *  must not move. */
    label: string;
    /** One line, for the chooser's title. States the MATERIAL, not the colour values. */
    description: string;
}

/**
 * The preset table.
 *
 * `Slate` is the appearance committed before this axis existed, and it has NO rule in
 * `_form-palettes.scss`: it is the values of `:root`. That is what makes «no project
 * changes» (R-SKIN-2) true by construction rather than by copying the defaults into a
 * second place where they could drift.
 */
export const FORM_PALETTE_PRESETS: Record<FormPaletteName, FormPalette> = {
    Slate: {
        attr: 'slate',
        label: 'Slate',
        description: 'Cool surfaces and slate borders — the default appearance.',
    },
    Paper: {
        attr: 'paper',
        label: 'Paper',
        description: 'Warm ivory surface with soft sand borders.',
    },
    Ink: {
        attr: 'ink',
        label: 'Ink',
        description: 'High contrast: dark, crisp borders and full-strength labels.',
    },
    Mist: {
        attr: 'mist',
        label: 'Mist',
        description: 'Almost borderless — fields told apart by surface tone alone.',
    },
};

/** The name of the default preset, stated once so it can be read back. */
export const FORM_PALETTE_DEFAULT_NAME: FormPaletteName = 'Slate';

/** Every preset name, in catalogue order (R-SKIN-2), for a chooser that must list them
 *  without hardcoding the four names a second time. */
export const FORM_PALETTE_NAMES: readonly FormPaletteName[] = ['Slate', 'Paper', 'Ink', 'Mist'];

/**
 * Is this persisted string one of the four?
 *
 * The guard exists because the field is READ from a saved project, where the value is an
 * arbitrary string as far as the type system is concerned. A project written by a future
 * version, by hand, or by an AI can carry a fifth name; it must fall back to the default
 * rather than reach a stylesheet that has no rule for it. Same shape as
 * `formAutoLayout.isFormThemeName` — which lives there and not in `themes.ts` only because
 * that is where its single caller was; a palette has no such module, so the guard is here.
 */
export function isFormPaletteName(v: unknown): v is FormPaletteName {
    return typeof v === 'string' && (FORM_PALETTE_NAMES as readonly string[]).includes(v);
}

/**
 * The `data-palette` value for a name.
 *
 * A function and not `name.toLowerCase()` at the call site: the attribute is a CONTRACT
 * between the element that writes it and the stylesheet that selects on it, and a contract
 * spelled out in two places drifts the first time a name gains a space or a capital in the
 * middle. `undefined` in — no palette chosen — gives the default's attribute, so the
 * element always carries one and the stylesheet never has to match on its absence.
 */
export function paletteAttr(name: FormPaletteName | undefined | null): string {
    return FORM_PALETTE_PRESETS[isFormPaletteName(name) ? name : FORM_PALETTE_DEFAULT_NAME].attr;
}
