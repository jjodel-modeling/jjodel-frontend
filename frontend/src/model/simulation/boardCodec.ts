/**
 * boardCodec — the I/O board of a model, as its bag stores it (R-SIM-110..115;
 * P-2026-10-03-1845 Lane 1, docs/discovery/discovery_2026-10-03_sim_io_board.md §2).
 *
 * The board is the machine's environment (R-SIM-110): devices bound to what a run
 * already has, inputs to events and IVAR, outputs to read-only expressions over σ.
 * It is saved with the model (R-SIM-115), in one key of the M1 bag, `ioBoard`,
 * whose value is a JSON string, as `simStateAttributes` is (R-SIM-67):
 * `{"v":1,"devices":[device...]}`. A device is `id`, `kind`, `cell` (a grid
 * position `[column, row]`, so both skins draw the same record, R-SIM-114),
 * `label` and `binding`, written in that order, the binding's fields in a fixed
 * order per kind: the same board gives the same string. The empty board is
 * `devices: []`, never an absent key (the undo of a removed bag key, report §2).
 *
 * The key is not a `sim*` key on purpose: `runSignature` folds every `sim*` key of
 * the model bag (simBridge.ts `modelRunBag`), so a board edit under such a key
 * would interrupt the run, and the board never changes what a run reads
 * (measured, report §2).
 *
 * Bindings name elements of M by id (an event instance, a place, a transition),
 * so a rename keeps them and the import, which renews every id by text
 * replacement, remaps them; a declaration has no id, so an IVAR or an attribute
 * is named by its element and its name (report §3).
 *
 * Decoding is tolerant, device by device, as the declarations' codec is record by
 * record (R-SIM-68): a string that is not JSON, or has no `v` 1 and `devices`, is
 * one defect on the key and the board is not readable; a malformed device, an
 * unknown kind, a cell off the grid, an id or a cell taken by an earlier device
 * are defects of their own and the others decode; a binding that does not fit
 * its kind or misses a field leaves the device unbound, with a defect. Unknown
 * fields are ignored.
 *
 * The Clock (R-SIM-122, P-2026-10-04-0150) is the fifth input: time as an
 * environment source, not model time. It takes the Button's binding, one event
 * instance, and its record alone carries `period`, after `binding`, so a board
 * without a clock keeps its bytes. A clock stored without a period reads the
 * default; a stored period that is not a whole number of milliseconds in range is
 * a defect of its device, as a cell off the grid is, never a clamp.
 *
 * The style of the front panel (R-SIM-123..128, P-2026-10-04-1130,
 * docs/discovery/discovery_2026-10-04_sim_io_panel_styles.md) is authoring, saved
 * here as optional fields: the board's `theme`, `accent` and `cols` after
 * `devices`, a device's `span` and `style` after `period`, the style's fields in a
 * fixed order. A default is never written, whether the record holds it or not, so
 * every board saved before them keeps its bytes and `v` stays 1. A device covers
 * the cells from its `cell` over its span, and occupancy is by covered cells: a
 * device covering a cell an earlier one covers, or whose span leaves the grid of
 * the board's columns, is a defect of its own, as the cell-taken defect is. An
 * unknown value of a style field, a span out of its domain, a style field on a kind
 * that has no such field and a second explicit equal key drop only that field, with
 * a defect naming it (`field`); unknown style fields are ignored. Two kinds join the
 * library (R-SIM-128): the silkscreen, a caption with no binding, and the buzzer,
 * an output bound as the LED is.
 *
 * Pure: no import.
 */

/** The bag key of the board (report §2, decision D1). */
export const IO_BOARD_KEY = 'ioBoard';

/** The grid both skins draw on: four columns by default (R-SIM-125: 6 or 8 by the board's `cols`), eight rows. */
export const BOARD_COLUMNS = 4;
export const BOARD_ROWS = 8;

/**
 * The fixed library of the first cut (R-SIM-111): five inputs, the Clock added by R-SIM-122, and five outputs; the
 * Buzzer, an output, and the Silkscreen, neither input nor output, added by R-SIM-128.
 */
export type InputDeviceKind = 'button' | 'switch' | 'slider' | 'keypad' | 'clock';
export type OutputDeviceKind = 'led' | 'pulse' | 'seven' | 'text' | 'gauge' | 'buzzer';
export type DeviceKind = InputDeviceKind | OutputDeviceKind | 'silk';

export const DEVICE_KINDS: readonly DeviceKind[] = ['button', 'switch', 'slider', 'keypad', 'clock', 'led', 'pulse', 'seven', 'text', 'gauge', 'buzzer', 'silk'];

const INPUT_KINDS: ReadonlySet<DeviceKind> = new Set<DeviceKind>(['button', 'switch', 'slider', 'keypad', 'clock']);

export function isInputKind(kind: DeviceKind): kind is InputDeviceKind {
    return INPUT_KINDS.has(kind);
}

/**
 * What a device is bound to. Elements of M by id; an IVAR or an attribute by its
 * element (the model id for a global) and its name; an output expression by its
 * JjEL text. The keypad declares its mode in the binding (R-SIM-112): the value
 * mode answers one IVAR and Enter fires an event; the events mode binds each key,
 * `0` to `9`, to an event instance (`''` for a key left unbound).
 */
export type BoardBinding =
    | { readonly kind: 'event'; readonly event: string }
    | { readonly kind: 'events'; readonly on: string; readonly off: string }
    | { readonly kind: 'ivar'; readonly element: string; readonly attr: string }
    | { readonly kind: 'keypadValue'; readonly element: string; readonly attr: string; readonly enter: string; readonly hideOut: boolean }
    | { readonly kind: 'keypadEvents'; readonly keys: readonly string[] }
    | { readonly kind: 'marked'; readonly place: string }
    | { readonly kind: 'expr'; readonly text: string }
    | { readonly kind: 'transition'; readonly transition: string }
    | { readonly kind: 'configuration' }
    | { readonly kind: 'attr'; readonly element: string; readonly attr: string };

export type BindingKind = BoardBinding['kind'];

/** The bindings each kind accepts, in the order the editor offers them (R-SIM-111). */
export const BINDING_KINDS: Readonly<Record<DeviceKind, readonly BindingKind[]>> = {
    button: ['event'],
    switch: ['ivar', 'events'],
    slider: ['ivar'],
    keypad: ['keypadValue', 'keypadEvents'],
    clock: ['event'],
    led: ['marked', 'expr'],
    pulse: ['transition', 'event'],
    seven: ['expr'],
    text: ['configuration', 'expr'],
    gauge: ['attr'],
    buzzer: ['marked', 'expr'],
    silk: [],
};

/** The keys of the keypad in events mode: `0` to `9`. */
export const KEYPAD_KEYS = 10;

/** The Clock's period in milliseconds (R-SIM-122): a whole number in `CLOCK_PERIOD_MIN..CLOCK_PERIOD_MAX`. */
export const CLOCK_PERIOD_MIN = 100;
export const CLOCK_PERIOD_MAX = 60000;
export const CLOCK_PERIOD_DEFAULT = 1000;

export function isClockPeriod(ms: unknown): ms is number {
    return typeof ms === 'number' && Number.isInteger(ms) && ms >= CLOCK_PERIOD_MIN && ms <= CLOCK_PERIOD_MAX;
}

// ---------------------------------------------------------------------------
// The style of the front panel (R-SIM-123..126)
// ---------------------------------------------------------------------------

/** R-SIM-124: the themes of the front panel, Variant B only; `graphite` is today's look and the default. */
export type BoardTheme = 'graphite' | 'appliance' | 'instrument' | 'print';
export const BOARD_THEMES: readonly BoardTheme[] = ['graphite', 'appliance', 'instrument', 'print'];

/** R-SIM-125: the columns of the board; rows stay eight. */
export type BoardCols = 4 | 6 | 8;
export const BOARD_COLS: readonly BoardCols[] = [4, 6, 8];

/** The board's own fields (R-SIM-123): each absent means its default, and a default is never written. */
export interface BoardSettings {
    readonly theme?: BoardTheme;
    /** A colour `#rrggbb`, lower case; absent: the theme's own accent. */
    readonly accent?: string;
    readonly cols?: BoardCols;
}

/** R-SIM-125: a span is `[w, h]`, `1 <= w <= SPAN_MAX_COLUMNS`, `1 <= h <= SPAN_MAX_ROWS`; absent means `[1, 1]`. */
export const SPAN_MAX_COLUMNS = 4;
export const SPAN_MAX_ROWS = 2;

/** R-SIM-126: the values of each style field. */
export type ButtonShape = 'key' | 'membrane' | 'round' | 'text';
export type ButtonRole = 'neutral' | 'go' | 'stop' | 'accent';
export type IconMode = 'both' | 'icon' | 'text';
export type DisplaySize = 'S' | 'M' | 'L' | 'XL';
export type DisplayFace = 'plain' | 'lcd' | 'vfd';
export type LedShape = 'round' | 'square' | 'bar';
export type LedColor = 'green' | 'red' | 'amber' | 'blue' | 'violet';

export const BUTTON_SHAPES: readonly ButtonShape[] = ['key', 'membrane', 'round', 'text'];
export const BUTTON_ROLES: readonly ButtonRole[] = ['neutral', 'go', 'stop', 'accent'];
export const ICON_MODES: readonly IconMode[] = ['both', 'icon', 'text'];
export const DISPLAY_SIZES: readonly DisplaySize[] = ['S', 'M', 'L', 'XL'];
export const DISPLAY_FACES: readonly DisplayFace[] = ['plain', 'lcd', 'vfd'];
export const LED_SHAPES: readonly LedShape[] = ['round', 'square', 'bar'];
export const LED_COLORS: readonly LedColor[] = ['green', 'red', 'amber', 'blue', 'violet'];

/**
 * A device's style (R-SIM-126), its fields in this order, each optional and valid only on the kinds of
 * `STYLE_FIELDS`. Button and Clock: `shape` (a `ButtonShape`), `role` (absent: suggested from the event's name),
 * `icon` (a Bootstrap icon name without `bi-`, or `none`; absent: suggested), `iconMode`, `key` (one character
 * `[a-z0-9]`, or `none`; absent: suggested). Text display and 7-segment: `size`, `face` (absent: the theme's). LED
 * and Pulse LED: `shape` (an `LedShape`), `color`.
 */
export interface DeviceStyle {
    readonly shape?: ButtonShape | LedShape;
    readonly role?: ButtonRole;
    readonly icon?: string;
    readonly iconMode?: IconMode;
    readonly key?: string;
    readonly size?: DisplaySize;
    readonly face?: DisplayFace;
    readonly color?: LedColor;
}

export type StyleField = keyof DeviceStyle;

/** The order the style's fields are written in. */
const STYLE_ORDER: readonly StyleField[] = ['shape', 'role', 'icon', 'iconMode', 'key', 'size', 'face', 'color'];

const BUTTON_FIELDS: readonly StyleField[] = ['shape', 'role', 'icon', 'iconMode', 'key'];
const DISPLAY_FIELDS: readonly StyleField[] = ['size', 'face'];
const LED_FIELDS: readonly StyleField[] = ['shape', 'color'];

/** The style fields each kind takes (R-SIM-126). */
export const STYLE_FIELDS: Readonly<Record<DeviceKind, readonly StyleField[]>> = {
    button: BUTTON_FIELDS, clock: BUTTON_FIELDS,
    text: DISPLAY_FIELDS, seven: DISPLAY_FIELDS,
    led: LED_FIELDS, pulse: LED_FIELDS,
    switch: [], slider: [], keypad: [], gauge: [], buzzer: [], silk: [],
};

/** A Bootstrap icon name without the `bi-` prefix: lower-case words of letters and digits joined by `-`. */
const ICON_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SHORTCUT_KEY = /^[a-z0-9]$/;

/** Whether `value` is a value of `field` on a device of `kind`: the field must be one the kind takes. */
export function styleValueFits(kind: DeviceKind, field: StyleField, value: unknown): boolean {
    if (!STYLE_FIELDS[kind].includes(field) || typeof value !== 'string') return false;
    const button = kind === 'button' || kind === 'clock';
    switch (field) {
        case 'shape': return button ? (BUTTON_SHAPES as readonly string[]).includes(value) : (LED_SHAPES as readonly string[]).includes(value);
        case 'role': return (BUTTON_ROLES as readonly string[]).includes(value);
        case 'icon': return value === 'none' || (ICON_NAME.test(value) && !value.startsWith('bi-'));
        case 'iconMode': return (ICON_MODES as readonly string[]).includes(value);
        case 'key': return value === 'none' || SHORTCUT_KEY.test(value);
        case 'size': return (DISPLAY_SIZES as readonly string[]).includes(value);
        case 'face': return (DISPLAY_FACES as readonly string[]).includes(value);
        case 'color': return (LED_COLORS as readonly string[]).includes(value);
    }
}

/** The value a field takes when absent, where there is one: never written. `role`, `icon`, `key` and `face` have none. */
function styleDefault(kind: DeviceKind, field: StyleField): string | undefined {
    const button = kind === 'button' || kind === 'clock';
    if (field === 'shape') return button ? 'key' : 'round';
    if (field === 'iconMode') return 'both';
    if (field === 'size') return 'M';
    if (field === 'color') return 'green';
    return undefined;
}

/** A style as written: the fields of the kind with a valid value other than the default, in order; `undefined` when none is left. */
export function canonicalStyle(kind: DeviceKind, style: DeviceStyle | undefined): DeviceStyle | undefined {
    if (!style) return undefined;
    const out: Record<string, string> = {};
    for (const field of STYLE_ORDER) {
        const value = style[field];
        if (value === undefined || !styleValueFits(kind, field, value) || value === styleDefault(kind, field)) continue;
        out[field] = value;
    }
    return Object.keys(out).length > 0 ? out as DeviceStyle : undefined;
}

export function isBoardTheme(v: unknown): v is BoardTheme {
    return typeof v === 'string' && (BOARD_THEMES as readonly string[]).includes(v);
}

export function isBoardCols(v: unknown): v is BoardCols {
    return typeof v === 'number' && (BOARD_COLS as readonly number[]).includes(v);
}

/** A colour `#rrggbb`, either case. */
export function isAccent(v: unknown): v is string {
    return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
}

/** The board's fields as written: the valid ones other than the default, the accent in lower case; `undefined` when none is left. */
export function canonicalSettings(settings: BoardSettings | undefined): BoardSettings | undefined {
    if (!settings) return undefined;
    const out: { theme?: BoardTheme; accent?: string; cols?: BoardCols } = {};
    if (isBoardTheme(settings.theme) && settings.theme !== 'graphite') out.theme = settings.theme;
    if (isAccent(settings.accent)) out.accent = settings.accent.toLowerCase();
    if (isBoardCols(settings.cols) && settings.cols !== BOARD_COLUMNS) out.cols = settings.cols;
    return Object.keys(out).length > 0 ? out : undefined;
}

/** The board's columns: its `cols`, else four. */
export function boardCols(settings: BoardSettings | undefined): BoardCols {
    return isBoardCols(settings?.cols) ? settings!.cols! : BOARD_COLUMNS;
}

export function isSpan(v: unknown): v is readonly [number, number] {
    return Array.isArray(v) && v.length === 2 && v.every(Number.isInteger)
        && v[0] >= 1 && v[0] <= SPAN_MAX_COLUMNS && v[1] >= 1 && v[1] <= SPAN_MAX_ROWS;
}

/** A device's span, `[1, 1]` when it has none. */
export function spanOf(device: { readonly span?: readonly [number, number] }): readonly [number, number] {
    return device.span ?? [1, 1];
}

/** The cells a device covers from `cell` over `span`, row by row. */
export function coveredCells(cell: readonly [number, number], span: readonly [number, number]): Array<[number, number]> {
    const out: Array<[number, number]> = [];
    for (let r = 0; r < span[1]; r++) for (let c = 0; c < span[0]; c++) out.push([cell[0] + c, cell[1] + r]);
    return out;
}

/** Whether a device at `cell` over `span` stays on a grid of `cols` columns and eight rows. */
export function fitsGrid(cell: readonly [number, number], span: readonly [number, number], cols: number = BOARD_COLUMNS): boolean {
    return onGrid(cell, cols) && cell[0] + span[0] <= cols && cell[1] + span[1] <= BOARD_ROWS;
}

export interface BoardDevice {
    readonly id: string;
    readonly kind: DeviceKind;
    /** `[column, row]`, `0 <= column < BOARD_COLUMNS`, `0 <= row < BOARD_ROWS`. */
    readonly cell: readonly [number, number];
    /** The device's own name; `''` lets the caption name it. */
    readonly label: string;
    /** `null`: dropped from the palette and not bound yet. */
    readonly binding: BoardBinding | null;
    /** A Clock's period in milliseconds (R-SIM-122); absent on every other kind. */
    readonly period?: number;
    /** The cells it covers from `cell`, `[w, h]` (R-SIM-125); absent means `[1, 1]` and is never stored as such. */
    readonly span?: readonly [number, number];
    /** Its style (R-SIM-126); absent, or without a field, means the default or the suggestion. */
    readonly style?: DeviceStyle;
}

/** Why a stored board, or a device of it, was not read as written: `index` is the device's, `null` for the key. */
export interface BoardDefect {
    readonly index: number | null;
    readonly code: 'key' | 'device' | 'binding';
    readonly message: string;
    /**
     * Set when the defect drops one field and keeps the rest (R-SIM-123): the board (`index` null) or the device is
     * read without it. `theme`, `accent`, `cols`, `span`, `style`, or `style.<field>`.
     */
    readonly field?: string;
}

export interface DecodedBoard {
    readonly devices: BoardDevice[];
    readonly defects: BoardDefect[];
    /** False when the key holds something that is not a board: the editor says so before it overwrites it. */
    readonly readable: boolean;
    /** The board's own fields (R-SIM-123), absent when every one is the default. */
    readonly settings?: BoardSettings;
}

export function bindingFits(kind: DeviceKind, binding: BoardBinding): boolean {
    return BINDING_KINDS[kind].includes(binding.kind);
}

/** A cell on the grid: two integers within its bounds, `cols` columns (four by default) and eight rows. */
export function onGrid(cell: readonly number[], cols: number = BOARD_COLUMNS): boolean {
    return cell.length === 2 && cell.every(Number.isInteger) && cell[0] >= 0 && cell[0] < cols && cell[1] >= 0 && cell[1] < BOARD_ROWS;
}

/** The binding with its fields in the fixed order of its kind: what the string holds. */
function canonicalBinding(b: BoardBinding): Record<string, unknown> {
    switch (b.kind) {
        case 'event': return { kind: b.kind, event: b.event };
        case 'events': return { kind: b.kind, on: b.on, off: b.off };
        case 'ivar': return { kind: b.kind, element: b.element, attr: b.attr };
        case 'keypadValue': return { kind: b.kind, element: b.element, attr: b.attr, enter: b.enter, hideOut: b.hideOut };
        case 'keypadEvents': return { kind: b.kind, keys: [...b.keys] };
        case 'marked': return { kind: b.kind, place: b.place };
        case 'expr': return { kind: b.kind, text: b.text };
        case 'transition': return { kind: b.kind, transition: b.transition };
        case 'configuration': return { kind: b.kind };
        case 'attr': return { kind: b.kind, element: b.element, attr: b.attr };
    }
}

export function encodeBoard(devices: readonly BoardDevice[], settings?: BoardSettings): string {
    return JSON.stringify({
        v: 1,
        devices: devices.map(d => {
            const span = d.span && isSpan(d.span) && (d.span[0] !== 1 || d.span[1] !== 1) ? [d.span[0], d.span[1]] : undefined;
            const style = canonicalStyle(d.kind, d.style);
            return {
                id: d.id, kind: d.kind, cell: [d.cell[0], d.cell[1]], label: d.label, binding: d.binding === null ? null : canonicalBinding(d.binding),
                ...(d.kind === 'clock' ? { period: d.period ?? CLOCK_PERIOD_DEFAULT } : {}),
                ...(span ? { span } : {}),
                ...(style ? { style } : {}),
            };
        }),
        ...canonicalSettings(settings),
    });
}

const text = (v: unknown): v is string => typeof v === 'string';
const named = (v: unknown): v is string => typeof v === 'string' && v !== '';

/** A binding as stored, or `null` when it is not one: a kind unknown, a field missing or of another type. */
function bindingOf(raw: unknown): BoardBinding | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const b = raw as Record<string, unknown>;
    switch (b.kind) {
        case 'event': return named(b.event) ? { kind: 'event', event: b.event } : null;
        case 'events': return named(b.on) && named(b.off) ? { kind: 'events', on: b.on, off: b.off } : null;
        case 'ivar': return named(b.element) && named(b.attr) ? { kind: 'ivar', element: b.element, attr: b.attr } : null;
        case 'keypadValue':
            if (!named(b.element) || !named(b.attr) || !named(b.enter)) return null;
            if (b.hideOut !== undefined && typeof b.hideOut !== 'boolean') return null;
            return { kind: 'keypadValue', element: b.element, attr: b.attr, enter: b.enter, hideOut: b.hideOut === true };
        case 'keypadEvents':
            return Array.isArray(b.keys) && b.keys.length === KEYPAD_KEYS && b.keys.every(text) ? { kind: 'keypadEvents', keys: [...b.keys] } : null;
        case 'marked': return named(b.place) ? { kind: 'marked', place: b.place } : null;
        case 'expr': return text(b.text) ? { kind: 'expr', text: b.text } : null;
        case 'transition': return named(b.transition) ? { kind: 'transition', transition: b.transition } : null;
        case 'configuration': return { kind: 'configuration' };
        case 'attr': return named(b.element) && named(b.attr) ? { kind: 'attr', element: b.element, attr: b.attr } : null;
        default: return null;
    }
}

export function decodeBoard(raw: string | null | undefined): DecodedBoard {
    if (raw === undefined || raw === null || raw === '') return { devices: [], defects: [], readable: true };
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { devices: [], defects: [{ index: null, code: 'key', message: 'The board is not JSON.' }], readable: false };
    }
    const root = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
    if (!root || root.v !== 1 || !Array.isArray(root.devices)) {
        return { devices: [], defects: [{ index: null, code: 'key', message: 'The board has no version 1 and no device list.' }], readable: false };
    }
    const defects: BoardDefect[] = [];
    const settings = settingsOf(root, defects);
    const cols = boardCols(settings);
    const devices: BoardDevice[] = [];
    const ids = new Set<string>();
    const cells = new Set<string>();
    const keys = new Set<string>();
    root.devices.forEach((item, index) => {
        const device = (message: string) => defects.push({ index, code: 'device', message });
        if (!item || typeof item !== 'object' || Array.isArray(item)) return device('Not a device.');
        const d = item as Record<string, unknown>;
        if (!named(d.id)) return device('A device without an id.');
        if (!DEVICE_KINDS.includes(d.kind as DeviceKind)) return device(`Unknown kind '${String(d.kind)}'.`);
        const kind = d.kind as DeviceKind;
        if (!Array.isArray(d.cell) || !onGrid(d.cell as number[], cols)) return device(`${d.id}: the cell is off the grid.`);
        const cell: [number, number] = [(d.cell as number[])[0], (d.cell as number[])[1]];
        if (ids.has(d.id)) return device(`${d.id}: the id is taken by an earlier device.`);
        // Field defects are kept aside and reported only if the device is read (R-SIM-123).
        const dropped: BoardDefect[] = [];
        const drop = (field: string, message: string) => dropped.push({ index, code: 'device', message: `${d.id}: ${message}`, field });
        let span: [number, number] = [1, 1];
        if (d.span !== undefined) {
            if (isSpan(d.span)) span = [d.span[0], d.span[1]];
            else drop('span', `the span is not [w, h] with w in 1..${SPAN_MAX_COLUMNS} and h in 1..${SPAN_MAX_ROWS}; the device takes one cell.`);
        }
        if (!fitsGrid(cell, span, cols)) return device(`${d.id}: the span leaves the grid.`);
        const covered = coveredCells(cell, span).map(c => c.join(','));
        if (cells.has(covered[0])) return device(`${d.id}: the cell is taken by an earlier device.`);
        if (covered.some(c => cells.has(c))) return device(`${d.id}: a cell it covers is taken by an earlier device.`);
        if (kind === 'clock' && d.period !== undefined && !isClockPeriod(d.period)) {
            return device(`${d.id}: the period is not a whole number of milliseconds in ${CLOCK_PERIOD_MIN}..${CLOCK_PERIOD_MAX}.`);
        }
        let binding: BoardBinding | null = null;
        if (d.binding !== undefined && d.binding !== null) {
            binding = bindingOf(d.binding);
            if (binding !== null && !bindingFits(kind, binding)) binding = null;
            if (binding === null) defects.push({ index, code: 'binding', message: `${d.id}: the binding is not one a ${kind} takes; the device is unbound.` });
        }
        const style = styleOf(kind, d.style, keys, drop);
        defects.push(...dropped);
        ids.add(d.id);
        for (const c of covered) cells.add(c);
        if (style?.key !== undefined && style.key !== 'none') keys.add(style.key);
        const label = text(d.label) ? d.label : '';
        const read: BoardDevice = kind === 'clock'
            ? { id: d.id, kind, cell, label, binding, period: d.period === undefined ? CLOCK_PERIOD_DEFAULT : d.period as number }
            : { id: d.id, kind, cell, label, binding };
        devices.push({ ...read, ...(span[0] !== 1 || span[1] !== 1 ? { span } : {}), ...(style ? { style } : {}) });
    });
    return { devices, defects, readable: true, ...(settings ? { settings } : {}) };
}

/** The board's own fields as stored: each unknown value is dropped with a defect on the key (R-SIM-123). */
function settingsOf(root: Record<string, unknown>, defects: BoardDefect[]): BoardSettings | undefined {
    const drop = (field: string, message: string) => defects.push({ index: null, code: 'key', message, field });
    const out: { theme?: BoardTheme; accent?: string; cols?: BoardCols } = {};
    if (root.theme !== undefined) {
        if (isBoardTheme(root.theme)) out.theme = root.theme;
        else drop('theme', `The theme '${String(root.theme)}' is not one of ${BOARD_THEMES.join(', ')}; the default is used.`);
    }
    if (root.accent !== undefined) {
        if (isAccent(root.accent)) out.accent = root.accent;
        else drop('accent', `The accent '${String(root.accent)}' is not a colour #rrggbb; the theme's own is used.`);
    }
    if (root.cols !== undefined) {
        if (isBoardCols(root.cols)) out.cols = root.cols;
        else drop('cols', `The columns '${String(root.cols)}' are not ${BOARD_COLS.slice(0, -1).join(', ')} or ${BOARD_COLS[BOARD_COLS.length - 1]}; the board has ${BOARD_COLUMNS}.`);
    }
    return canonicalSettings(out);
}

/**
 * A device's style as stored (R-SIM-126): a field the kind does not take, or an unknown value, is dropped with a
 * defect; an explicit key an earlier device holds is dropped too (R-SIM-127); unknown fields are ignored.
 */
function styleOf(kind: DeviceKind, raw: unknown, keys: ReadonlySet<string>, drop: (field: string, message: string) => void): DeviceStyle | undefined {
    if (raw === undefined) return undefined;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        drop('style', 'the style is not an object; the device keeps the defaults.');
        return undefined;
    }
    const r = raw as Record<string, unknown>;
    const kept: Record<string, string> = {};
    for (const field of STYLE_ORDER) {
        const value = r[field];
        if (value === undefined) continue;
        if (!STYLE_FIELDS[kind].includes(field)) drop(`style.${field}`, `a ${kind} has no style '${field}'.`);
        else if (!styleValueFits(kind, field, value)) drop(`style.${field}`, `'${String(value)}' is not a value of the style '${field}'.`);
        else if (field === 'key' && value !== 'none' && keys.has(value as string)) drop('style.key', `the key '${String(value)}' is taken by an earlier device.`);
        else kept[field] = value as string;
    }
    return canonicalStyle(kind, kept as DeviceStyle);
}
