/**
 * simBoardLook — how each device of the I/O board is drawn from its style, and
 * what a shortcut key presses (R-SIM-130..133; P-2026-10-04-1131, over the record
 * of R-SIM-123..128 and docs/discovery/discovery_2026-10-04_sim_io_panel_styles.md).
 *
 * - `pressLook`: a Button's or a Clock's shape, role, icon and icon mode. The icon
 *   is the style's, else the one `suggestIcon` reads from the event's label (the
 *   board context's, so a renamed event suggests again), `none` hiding it; no
 *   match gives no icon, never a random one. The role is the style's, else the
 *   suggested one, else neutral. Shape and role are Variant B's; the icon and the
 *   icon mode both skins' (R-SIM-131).
 * - `boardKeys`, `shortcutKey`, `shortcutDevice`, `shortcutAction`: one key per
 *   Button, Switch and Clock in board order, row then column (`suggestKeys`); a
 *   keydown with no modifier, not repeated and not inside a field, while the focus
 *   is in the board (the card's handler), presses the device holding the key as
 *   its click does, and a device that is off ignores it (R-SIM-133).
 * - `displayLook`, `displayGlyphFont`: a display's size, face and glyph box. The
 *   glyphs are as many as the longest value its binding can produce
 *   (`maxDisplayLength`), never the value shown, and the font is fitted to them
 *   inside the box's width, so the box keeps its size while the value runs.
 * - `ledLook`: a lamp's shape and colour; a Pulse LED amber when its colour is
 *   absent, as before styles.
 * - `boardTheme`, `boardAccent`, `boardFloats`, `canDock`: the theme of the front
 *   panel (Variant B only, D-UI-16), the accent that overrides the theme's Accent
 *   role (never on Print), and the window rule of R-SIM-132.
 *
 * Pure: no React, no store, so it runs under the node test bench
 * (sim/__tests__/simBoardLook.test.ts).
 */

import type {
    BoardCols, BoardDevice, BoardSettings, BoardTheme, ButtonRole, ButtonShape, DeviceKind, DisplayFace, DisplaySize, IconMode, LedColor, LedShape,
} from '../../../model/simulation/boardCodec';
import { suggestIcon, suggestKeys } from './simBoardIcons';
import type { IconSuggestion } from './simBoardIcons';
import type { DeviceFace } from './simBoardFace';

/** How a Button or a Clock is drawn (R-SIM-131). */
export interface PressLook {
    readonly shape: ButtonShape;
    readonly role: ButtonRole;
    readonly roleFrom: 'style' | 'suggested' | 'default';
    /** A Bootstrap icon name without `bi-`; `null` for `none` and for no match. */
    readonly icon: string | null;
    readonly iconFrom: 'style' | 'none' | 'suggested' | 'no match';
    /** What the event's label suggests, whatever the style says: the editor shows it beside Auto. */
    readonly suggestion: IconSuggestion;
    readonly iconMode: IconMode;
    /** The icon is drawn: there is one and the mode is not `text`. */
    readonly showIcon: boolean;
    /** The text is drawn: hidden only by the mode `icon` when an icon is drawn in its place. */
    readonly showText: boolean;
}

const NO_SUGGESTION: IconSuggestion = { icon: null, role: null, rule: 'no match' };

/** A Button's or a Clock's look from its style and the label of the event it presses (`null` when unbound). */
export function pressLook(device: BoardDevice, eventLabel: string | null): PressLook {
    const style = device.style ?? {};
    const suggestion = eventLabel === null ? NO_SUGGESTION : suggestIcon(eventLabel);
    const shape = (style.shape as ButtonShape | undefined) ?? 'key';
    const iconMode = style.iconMode ?? 'both';
    const [icon, iconFrom]: [string | null, PressLook['iconFrom']] = style.icon === 'none' ? [null, 'none']
        : style.icon !== undefined ? [style.icon, 'style']
        : suggestion.icon !== null ? [suggestion.icon, 'suggested'] : [null, 'no match'];
    const [role, roleFrom]: [ButtonRole, PressLook['roleFrom']] = style.role !== undefined ? [style.role, 'style']
        : suggestion.role !== null ? [suggestion.role, 'suggested'] : ['neutral', 'default'];
    const showIcon = icon !== null && iconMode !== 'text';
    return { shape, role, roleFrom, icon, iconFrom, suggestion, iconMode, showIcon, showText: !(iconMode === 'icon' && showIcon) };
}

// ---------------------------------------------------------------------------
// Shortcut keys (R-SIM-133)
// ---------------------------------------------------------------------------

/** The kinds that carry a key (the chat's answer to the report's question 2): a Slider has no press, a Keypad its own keys. */
export const KEYED_KINDS: readonly DeviceKind[] = ['button', 'switch', 'clock'];

const byCell = (a: BoardDevice, b: BoardDevice) => a.cell[1] - b.cell[1] || a.cell[0] - b.cell[0];

/** The key of each Button, Switch and Clock, in board order (row, then column), by device id; `null` for none. */
export function boardKeys(devices: readonly BoardDevice[], nameOf: (device: BoardDevice) => string): Map<string, string | null> {
    const keyed = devices.filter(d => KEYED_KINDS.includes(d.kind)).sort(byCell);
    const keys = suggestKeys(keyed.map(d => ({ name: nameOf(d), ...(d.style?.key !== undefined ? { key: d.style.key } : {}) })));
    return new Map(keyed.map((d, i) => [d.id, keys[i].key]));
}

/** What `shortcutKey` reads of a keydown. */
export interface ShortcutEvent {
    readonly key: string;
    readonly ctrlKey?: boolean;
    readonly metaKey?: boolean;
    readonly altKey?: boolean;
    readonly repeat?: boolean;
    readonly target?: { readonly tagName?: string; readonly isContentEditable?: boolean } | null;
}

const FIELDS: ReadonlySet<string> = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** The shortcut a keydown names, lower case; `null` with a modifier, on a repeat, inside a field, or for any other key. */
export function shortcutKey(e: ShortcutEvent): string | null {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return null;
    const t = e.target;
    if (t && (t.isContentEditable === true || FIELDS.has((t.tagName ?? '').toUpperCase()))) return null;
    const key = e.key.length === 1 ? e.key.toLowerCase() : '';
    return /^[a-z0-9]$/.test(key) ? key : null;
}

/** The device holding `key`, when it is on; `null` otherwise. */
export function shortcutDevice(key: string, keys: ReadonlyMap<string, string | null>, on: (id: string) => boolean): string | null {
    for (const [id, k] of keys) if (k === key) return on(id) ? id : null;
    return null;
}

/** What a device's click sends. */
export type ShortcutAction = { readonly kind: 'press'; readonly event: string } | { readonly kind: 'flip' } | { readonly kind: 'clock' };

/** What a key sends to its device, as its click: a Button its event, a Switch its flip or its press, a Clock on or off; off, nothing. */
export function shortcutAction(face: DeviceFace): ShortcutAction | null {
    if (!face.on) return null;
    switch (face.kind) {
        case 'button': return face.fires ? { kind: 'press', event: face.fires } : null;
        case 'switch': return face.fires ? { kind: 'press', event: face.fires } : { kind: 'flip' };
        case 'clock': return { kind: 'clock' };
        default: return null;
    }
}

// ---------------------------------------------------------------------------
// Displays and lamps (R-SIM-131)
// ---------------------------------------------------------------------------

/** A display's look on Variant B. */
export interface DisplayLook {
    readonly size: DisplaySize;
    readonly face: DisplayFace;
    /** The glyphs the box is sized for; `null` for a text display whose binding has no known domain (the cell width). */
    readonly glyphs: number | null;
    /** The font at this size, before the fit. */
    readonly fontPx: number;
    /** The box's padding left and right together, which the fit leaves out. */
    readonly padPx: number;
    /** One glyph's advance in em: the mono font's 0.6 and the 7-segment's letter spacing. */
    readonly advance: number;
}

/** The font of each size: M is the size the skin drew before styles. */
const FONT_PX: Readonly<Record<'text' | 'seven', Readonly<Record<DisplaySize, number>>>> = {
    text: { S: 10, M: 11, L: 15, XL: 20 },
    seven: { S: 15, M: 20, L: 26, XL: 34 },
};

/** `Err` is three glyphs: a box never narrower than the reading it may have to show. */
const ERR_GLYPHS = 3;
/** The 7-segment's four digits (simBoardFace.ts `SEVEN_MIN..SEVEN_MAX`) when the domain is unknown. */
const SEVEN_GLYPHS = 4;

/** The face a theme gives a display without one: Graphite keeps the LCD text and the glass digits it drew. */
function themeFace(kind: 'text' | 'seven', theme: BoardTheme): DisplayFace {
    return theme === 'graphite' && kind === 'text' ? 'lcd' : 'plain';
}

/** A Text display's or a 7-segment's look on Variant B, from its style, `maxDisplayLength` and the theme. */
export function displayLook(device: BoardDevice, maxLength: number | null, theme: BoardTheme): DisplayLook {
    const kind = device.kind === 'seven' ? 'seven' : 'text';
    const size = device.style?.size ?? 'M';
    // The 7-segment shows four digits at most: a wider domain reads Err beyond them.
    const longest = kind === 'seven' ? Math.min(maxLength ?? SEVEN_GLYPHS, SEVEN_GLYPHS) : maxLength;
    return {
        size,
        face: device.style?.face ?? themeFace(kind, theme),
        glyphs: longest === null ? null : Math.max(longest, ERR_GLYPHS),
        fontPx: FONT_PX[kind][size],
        padPx: kind === 'seven' ? 20 : 12,
        advance: kind === 'seven' ? 0.68 : 0.6,
    };
}

/**
 * The CSS font size of a display: its size's font, shrunk to fit its glyphs in the box's width (`100cqw`, the face is
 * the container); without glyphs, the size's font alone. Nothing here reads the value shown.
 */
export function displayGlyphFont(look: DisplayLook): string {
    if (look.glyphs === null) return `${look.fontPx}px`;
    const per = Math.round(look.glyphs * look.advance * 100) / 100;
    return `min(${look.fontPx}px, calc((100cqw - ${look.padPx}px) / ${per}))`;
}

export interface LedLook {
    readonly shape: LedShape;
    readonly color: LedColor;
}

/** A lamp's shape and colour: round; an LED green and a Pulse LED amber unless the style says otherwise. */
export function ledLook(device: BoardDevice): LedLook {
    return {
        shape: (device.style?.shape as LedShape | undefined) ?? 'round',
        color: device.style?.color ?? (device.kind === 'pulse' ? 'amber' : 'green'),
    };
}

// ---------------------------------------------------------------------------
// The board (R-SIM-130, R-SIM-132)
// ---------------------------------------------------------------------------

export function boardTheme(settings: BoardSettings | undefined): BoardTheme {
    return settings?.theme ?? 'graphite';
}

/** The colour of the Accent role: the board's accent, never on Print; `null` leaves the theme's own. */
export function boardAccent(settings: BoardSettings | undefined): string | null {
    return settings?.accent !== undefined && boardTheme(settings) !== 'print' ? settings.accent : null;
}

/** A board floats over the canvas when it is wider than the card slot (6 or 8 columns), or by the viewer's choice. */
export function boardFloats(cols: BoardCols, chosen: boolean): boolean {
    return cols > 4 || chosen;
}

/** Only a board of four columns fits the card slot (R-SIM-119). */
export function canDock(cols: BoardCols): boolean {
    return cols === 4;
}
