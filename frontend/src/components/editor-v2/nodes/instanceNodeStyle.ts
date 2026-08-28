/**
 * instanceNodeStyle — the style fields of the M1 instance node, and how they
 * resolve at render time.
 *
 * Design handoff: docs/design/design_handoff_instance_node/README.md, "State
 * Management".
 *
 * The six fields below are the ones the View Designer is meant to expose. Each
 * resolves through a cascade — metamodel class default, then viewpoint override,
 * then per-instance override — and `resolveInstanceNodeStyle` is that cascade:
 * it takes the layers in order and folds them over the factory default. This
 * slice renders from the default (no authoring surface writes the layers yet),
 * so the resolver is called with none; the shape is here so the next slice adds
 * a source, not a mechanism.
 *
 * `selected` is deliberately NOT a field: it is runtime canvas state, and it
 * overrides the resolved chrome at render time (see `instanceNodeChrome`)
 * without ever being stored.
 */

export type AccentPlacement = 'none' | 'top' | 'left';
export type TypeDisplay = 'inline' | 'chip' | 'badge';
export type EmptyBehavior = 'dash' | 'collapse' | 'hide';

export interface InstanceNodeStyle {
    /** Where the 3px categorical bar goes, or nowhere. */
    accentPlacement: AccentPlacement;
    /** Colour of that bar. Any CSS colour, `var(--token)` included. */
    accent: string;
    /** Filled header vs transparent. */
    headerFill: boolean;
    /** How the metaclass is presented in the header. */
    typeDisplay: TypeDisplay;
    /** What an unset slot does. */
    emptyBehavior: EmptyBehavior;
    /** Mark properties whose target is also drawn as an edge. */
    edgeMarker: boolean;
}

/**
 * The neutral accent. Not a colour the user picked: its whole job is to be the
 * value `accent` has when nobody has chosen one, which is what
 * `isCategoricalAccent` tests for.
 */
export const NEUTRAL_ACCENT = 'var(--color-inode-accent-neutral)';

/**
 * The factory default, and the handoff's central argument: with no colour in the
 * node chrome, colour INSIDE the node — a swatch, a reference pill, a selection
 * — always means something. The categorical tint stays one field away, so a
 * tinted node is an authored decision rather than an imposed default.
 */
export const INSTANCE_NODE_STYLE_DEFAULT: InstanceNodeStyle = {
    accentPlacement: 'none',
    accent: NEUTRAL_ACCENT,
    headerFill: false,
    typeDisplay: 'inline',
    emptyBehavior: 'dash',
    edgeMarker: true,
};

/**
 * The categorical pair for a model instance. The handoff names amber and reads
 * it out of `entityMeta.ts`; that file has held no colours since 2026-08-11
 * (R-RAIL-30) and the scale now lives in the `--color-entity-*` tokens, so the
 * pair is taken from there — the `object` entry, which is what an M1 instance
 * is. The handoff's own instruction is to read the pair for the actual entity
 * type rather than hardcode amber, so this follows it rather than the literal.
 */
export const CATEGORICAL_ACCENT = 'var(--color-entity-object-fg)';

/** The four named presets over the same six fields. */
export const INSTANCE_NODE_PRESETS: Record<string, Partial<InstanceNodeStyle>> = {
    /** Everything at its default value. */
    default: {},
    /** Separates header from compartment without spending colour. */
    headerFilled: { headerFill: true },
    /** The instance name is the only primary element; the type demotes to a pill. */
    namePrimary: { accentPlacement: 'left', typeDisplay: 'chip' },
    /** The coloured reading. */
    categorical: { accentPlacement: 'left', typeDisplay: 'chip', accent: CATEGORICAL_ACCENT },
};

export type InstanceNodePresetName = keyof typeof INSTANCE_NODE_PRESETS;

/**
 * Fold the cascade over the factory default. Layers are applied in order, so the
 * caller passes them least- to most-specific: metamodel class, then viewpoint,
 * then instance. `undefined` on a field means "no opinion" and leaves the layer
 * below in place — which is why the layers are Partial and not full styles.
 */
export function resolveInstanceNodeStyle(
    ...layers: Array<Partial<InstanceNodeStyle> | null | undefined>
): InstanceNodeStyle {
    let out: InstanceNodeStyle = { ...INSTANCE_NODE_STYLE_DEFAULT };
    for (const layer of layers) {
        if (!layer) continue;
        // The explicit `undefined` filter is the whole point: a spread would let
        // a layer that names a field without an opinion erase the layer below.
        const stated = Object.entries(layer).filter(([, v]) => v !== undefined);
        out = { ...out, ...Object.fromEntries(stated) } as InstanceNodeStyle;
    }
    return out;
}

/** A categorical colour is in play: a bar is drawn, and it is not the neutral. */
export function isCategoricalAccent(style: InstanceNodeStyle): boolean {
    return style.accentPlacement !== 'none' && style.accent !== NEUTRAL_ACCENT;
}

export interface InstanceNodeChrome {
    /** Colour of the accent bar, or null when no bar is drawn. */
    accentColor: string | null;
    accentPlacement: AccentPlacement;
    /** Background of the type badge / chip. */
    badgeBg: string;
    /** Foreground of the type badge / chip. */
    badgeFg: string;
}

/**
 * The resolved chrome for one render.
 *
 * This is where selection takes the cyan. An amber 3px bar plus a cyan ring plus
 * an amber chip is three colours fighting on one small object, and none of them
 * reads as "selected"; so while the node is selected the categorical accent
 * yields, and the identity colour returns on deselect. It is an override HERE,
 * at render time — the stored `accent` is never mutated.
 */
export function instanceNodeChrome(style: InstanceNodeStyle, selected: boolean): InstanceNodeChrome {
    const tinted = isCategoricalAccent(style);

    const badge = selected
        ? { bg: 'var(--color-inode-selected-badge-bg)', fg: 'var(--color-inode-selected-badge-fg)' }
        : tinted
            ? { bg: 'var(--color-entity-object-bg)', fg: 'var(--color-entity-object-fg)' }
            : { bg: 'var(--color-inode-badge-bg)', fg: 'var(--color-inode-badge-fg)' };

    return {
        accentColor: style.accentPlacement === 'none'
            ? null
            : (selected ? 'var(--color-inode-selected-border)' : style.accent),
        accentPlacement: style.accentPlacement,
        badgeBg: badge.bg,
        badgeFg: badge.fg,
    };
}

/**
 * `"3 slot vuoti"` / `"1 slot vuoto"`. The canvas speaks Italian, and the
 * singular is a different word, not a dropped `s`: the two forms are spelled out
 * rather than composed.
 */
export function emptySlotsLabel(count: number): string {
    return count === 1 ? '1 slot vuoto' : `${count} slot vuoti`;
}
