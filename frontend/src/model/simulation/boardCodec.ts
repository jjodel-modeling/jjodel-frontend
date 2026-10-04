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
 * Pure: no import.
 */

/** The bag key of the board (report §2, decision D1). */
export const IO_BOARD_KEY = 'ioBoard';

/** The grid both skins draw on: four columns, eight rows. */
export const BOARD_COLUMNS = 4;
export const BOARD_ROWS = 8;

/** The fixed library of the first cut (R-SIM-111): five inputs, the Clock added by R-SIM-122, and five outputs. */
export type InputDeviceKind = 'button' | 'switch' | 'slider' | 'keypad' | 'clock';
export type OutputDeviceKind = 'led' | 'pulse' | 'seven' | 'text' | 'gauge';
export type DeviceKind = InputDeviceKind | OutputDeviceKind;

export const DEVICE_KINDS: readonly DeviceKind[] = ['button', 'switch', 'slider', 'keypad', 'clock', 'led', 'pulse', 'seven', 'text', 'gauge'];

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
}

/** Why a stored board, or a device of it, was not read as written: `index` is the device's, `null` for the key. */
export interface BoardDefect {
    readonly index: number | null;
    readonly code: 'key' | 'device' | 'binding';
    readonly message: string;
}

export interface DecodedBoard {
    readonly devices: BoardDevice[];
    readonly defects: BoardDefect[];
    /** False when the key holds something that is not a board: the editor says so before it overwrites it. */
    readonly readable: boolean;
}

export function bindingFits(kind: DeviceKind, binding: BoardBinding): boolean {
    return BINDING_KINDS[kind].includes(binding.kind);
}

/** A cell on the grid: two integers within its bounds. */
export function onGrid(cell: readonly number[]): boolean {
    return cell.length === 2 && cell.every(Number.isInteger) && cell[0] >= 0 && cell[0] < BOARD_COLUMNS && cell[1] >= 0 && cell[1] < BOARD_ROWS;
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

export function encodeBoard(devices: readonly BoardDevice[]): string {
    return JSON.stringify({
        v: 1,
        devices: devices.map(d => ({
            id: d.id, kind: d.kind, cell: [d.cell[0], d.cell[1]], label: d.label, binding: d.binding === null ? null : canonicalBinding(d.binding),
            ...(d.kind === 'clock' ? { period: d.period ?? CLOCK_PERIOD_DEFAULT } : {}),
        })),
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
    const devices: BoardDevice[] = [];
    const defects: BoardDefect[] = [];
    const ids = new Set<string>();
    const cells = new Set<string>();
    root.devices.forEach((item, index) => {
        const device = (message: string) => defects.push({ index, code: 'device', message });
        if (!item || typeof item !== 'object' || Array.isArray(item)) return device('Not a device.');
        const d = item as Record<string, unknown>;
        if (!named(d.id)) return device('A device without an id.');
        if (!DEVICE_KINDS.includes(d.kind as DeviceKind)) return device(`Unknown kind '${String(d.kind)}'.`);
        const kind = d.kind as DeviceKind;
        if (!Array.isArray(d.cell) || !onGrid(d.cell as number[])) return device(`${d.id}: the cell is off the grid.`);
        const cell: [number, number] = [(d.cell as number[])[0], (d.cell as number[])[1]];
        if (ids.has(d.id)) return device(`${d.id}: the id is taken by an earlier device.`);
        if (cells.has(cell.join(','))) return device(`${d.id}: the cell is taken by an earlier device.`);
        if (kind === 'clock' && d.period !== undefined && !isClockPeriod(d.period)) {
            return device(`${d.id}: the period is not a whole number of milliseconds in ${CLOCK_PERIOD_MIN}..${CLOCK_PERIOD_MAX}.`);
        }
        let binding: BoardBinding | null = null;
        if (d.binding !== undefined && d.binding !== null) {
            binding = bindingOf(d.binding);
            if (binding !== null && !bindingFits(kind, binding)) binding = null;
            if (binding === null) defects.push({ index, code: 'binding', message: `${d.id}: the binding is not one a ${kind} takes; the device is unbound.` });
        }
        ids.add(d.id);
        cells.add(cell.join(','));
        const label = text(d.label) ? d.label : '';
        devices.push(kind === 'clock'
            ? { id: d.id, kind, cell, label, binding, period: d.period === undefined ? CLOCK_PERIOD_DEFAULT : d.period as number }
            : { id: d.id, kind, cell, label, binding });
    });
    return { devices, defects, readable: true };
}
