/**
 * simBoardEditorLayout — the pure parts of the board editor's layout (P-2026-10-06-0100, R-SIM-143).
 *
 * The editor (SimBoardEditor.tsx) shows the board twice: a live preview on the left, drawn by the front panel's own
 * faces, and the device list on the right. One selection serves both, and one row of the list is expanded at a
 * time (`selectDevice`). The keyboard map (`editorKeyAction`): an arrow selects the device that way on the board,
 * Shift and an arrow moves the selected device one cell, Delete removes it, Enter expands its row, Escape closes;
 * a field keeps its keys. A drag on the preview reads the cell under the pointer (`cellAtPoint`) and moves the
 * device there or resizes it by an edge (`dragResult`), through the board's own `moveDevice` and `setSpan`, so a
 * place or a span the board refuses changes nothing. The footer counts the unsaved changes and the bindings to
 * review, and Apply follows `applyState`.
 *
 * Layout only: the board record, its codec and the bindings' resolution are the board's (boardCodec.ts, simBoard.ts).
 *
 * Pure: no React, no store, so it runs under the node test bench (sim/__tests__/simBoardEditorLayout.test.ts).
 */

import { SPAN_MAX_COLUMNS, SPAN_MAX_ROWS, encodeBoard, isInputKind, spanOf } from '../../../model/simulation/boardCodec';
import type { BoardBinding, BoardDevice, BoardSettings, DeviceKind } from '../../../model/simulation/boardCodec';
import { DEVICE_LABELS, moveDevice, setSpan } from './simBoard';
import type { DeviceStatus } from './simBoard';

// ---------------------------------------------------------------------------
// The selection, shared by the preview and the list
// ---------------------------------------------------------------------------

/** The device selected, on the preview and in the list, and the one row expanded; `null` for none. */
export interface EditorSelection {
    readonly selected: string | null;
    readonly expanded: string | null;
}

export const NO_SELECTION: EditorSelection = { selected: null, expanded: null };

/**
 * How a device is chosen: `open` (a click on the preview, Enter) selects it and expands its row; `toggle` (a click
 * on its row) expands a collapsed row and collapses the expanded one; `focus` (an arrow) selects it, the expanded row
 * following only when one was open.
 */
export type SelectHow = 'open' | 'toggle' | 'focus';

export function selectDevice(s: EditorSelection, id: string, how: SelectHow): EditorSelection {
    switch (how) {
        case 'open': return { selected: id, expanded: id };
        case 'toggle': return { selected: id, expanded: s.expanded === id ? null : id };
        case 'focus': return { selected: id, expanded: s.expanded === null ? null : id };
    }
}

/** The selection once device `id` is removed: whatever named it is cleared. */
export function afterRemove(s: EditorSelection, id: string): EditorSelection {
    return { selected: s.selected === id ? null : s.selected, expanded: s.expanded === id ? null : s.expanded };
}

// ---------------------------------------------------------------------------
// The keyboard
// ---------------------------------------------------------------------------

export type ArrowKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown';

const ARROWS: Readonly<Record<ArrowKey, readonly [number, number]>> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

const isArrow = (key: string): key is ArrowKey => key in ARROWS;

const byCell = (a: BoardDevice, b: BoardDevice) => a.cell[1] - b.cell[1] || a.cell[0] - b.cell[0];

/** A device's box on the grid: its first and last column and row, its centre. */
function boxOf(d: BoardDevice): { c0: number; c1: number; r0: number; r1: number; cx: number; cy: number } {
    const [w, h] = spanOf(d);
    return { c0: d.cell[0], c1: d.cell[0] + w - 1, r0: d.cell[1], r1: d.cell[1] + h - 1, cx: d.cell[0] + w / 2, cy: d.cell[1] + h / 2 };
}

/**
 * The device an arrow selects from `fromId`: among the devices whose centre lies that way, those sharing a row (left,
 * right) or a column (up, down) with it first, then the nearest along the arrow, then the nearest across it, then
 * board order. No selection: the first device in board order. Nothing that way: `null`.
 */
export function neighbourDevice(devices: readonly BoardDevice[], fromId: string | null, key: ArrowKey): string | null {
    const from = fromId === null ? undefined : devices.find(d => d.id === fromId);
    if (!from) return [...devices].sort(byCell)[0]?.id ?? null;
    const [dx, dy] = ARROWS[key];
    const a = boxOf(from);
    const ranked = devices.filter(d => d.id !== from.id).map(d => {
        const b = boxOf(d);
        const along = dx !== 0 ? (b.cx - a.cx) * dx : (b.cy - a.cy) * dy;
        const shares = dx !== 0 ? b.r0 <= a.r1 && b.r1 >= a.r0 : b.c0 <= a.c1 && b.c1 >= a.c0;
        const across = dx !== 0 ? Math.abs(b.cy - a.cy) : Math.abs(b.cx - a.cx);
        return { d, along, shares, across };
    }).filter(x => x.along > 0);
    ranked.sort((x, y) => Number(y.shares) - Number(x.shares) || x.along - y.along || x.across - y.across || byCell(x.d, y.d));
    return ranked[0]?.d.id ?? null;
}

/** What the editor's keydown reads: the key, its modifiers, and the element that has the focus. */
export interface EditorKeyEvent {
    readonly key: string;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly altKey: boolean;
    readonly target: { readonly tagName: string; readonly isContentEditable?: boolean } | null;
}

export type EditorKeyAction =
    | { readonly kind: 'close' }
    | { readonly kind: 'select'; readonly id: string }
    | { readonly kind: 'move'; readonly id: string; readonly cell: [number, number] }
    | { readonly kind: 'delete'; readonly id: string }
    | { readonly kind: 'expand'; readonly id: string };

const FIELDS: ReadonlySet<string> = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * The editor's keyboard (R-SIM-143 item 5): Escape closes from anywhere; outside a field and without Ctrl, Cmd or
 * Alt, an arrow selects the neighbour (`neighbourDevice`) and Shift with an arrow moves the selected device one cell,
 * Delete or Backspace removes it, Enter expands its row unless the focus is on a button, whose Enter is its own.
 * `null`: the key is the page's.
 */
export function editorKeyAction(e: EditorKeyEvent, devices: readonly BoardDevice[], selected: string | null): EditorKeyAction | null {
    if (e.key === 'Escape') return { kind: 'close' };
    const t = e.target;
    if (t && (FIELDS.has(t.tagName) || t.isContentEditable === true)) return null;
    if (e.ctrlKey || e.metaKey || e.altKey) return null;
    const device = selected === null ? undefined : devices.find(d => d.id === selected);
    if (isArrow(e.key)) {
        if (e.shiftKey) {
            if (!device) return null;
            const [dx, dy] = ARROWS[e.key];
            return { kind: 'move', id: device.id, cell: [device.cell[0] + dx, device.cell[1] + dy] };
        }
        const id = neighbourDevice(devices, device ? device.id : null, e.key);
        return id === null ? null : { kind: 'select', id };
    }
    if (!device) return null;
    if (e.key === 'Delete' || e.key === 'Backspace') return { kind: 'delete', id: device.id };
    if (e.key === 'Enter' && t?.tagName !== 'BUTTON') return { kind: 'expand', id: device.id };
    return null;
}

// ---------------------------------------------------------------------------
// A drag on the preview
// ---------------------------------------------------------------------------

/**
 * The preview's grid on the page, in pixels: where its first cell starts, the sizes of its column and row tracks as
 * the browser resolved them (a row grows with a tall device, a keypad), and the gap between cells.
 */
export interface GridTracks {
    readonly left: number;
    readonly top: number;
    readonly columns: readonly number[];
    readonly rows: readonly number[];
    readonly gap: number;
}

const clampTo = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** The track under `at`, from `start`: a point in a gap reads the track before it, one before the first track the first, past the last the last. */
function trackAt(at: number, start: number, sizes: readonly number[], gap: number): number {
    let end = start;
    for (let i = 0; i < sizes.length; i++) {
        end += sizes[i];
        if (at < end + gap) return i;
        end += gap;
    }
    return Math.max(0, sizes.length - 1);
}

/** The cell `[column, row]` under a point of the grid; outside it, the edge cell. */
export function cellAtPoint(x: number, y: number, grid: GridTracks): [number, number] {
    return [trackAt(x, grid.left, grid.columns, grid.gap), trackAt(y, grid.top, grid.rows, grid.gap)];
}

/** A drag: `move` takes the device to the cell, an edge (`right`, `bottom`) or the `corner` sizes it to reach the cell. */
export interface BoardDrag {
    readonly mode: 'move' | 'right' | 'bottom' | 'corner';
    readonly cell: readonly [number, number];
}

/**
 * The board after a drag, on `cols` columns: a move through `moveDevice` (free cells, or the swap it keeps); a resize
 * from the device's cell to the cell reached, at least one cell and at most the span's domain, through `setSpan`, which
 * refuses a span off the grid or over another device. Refused, the same array.
 */
export function dragResult(devices: BoardDevice[], id: string, drag: BoardDrag, cols: number): BoardDevice[] {
    const device = devices.find(d => d.id === id);
    if (!device) return devices;
    if (drag.mode === 'move') return moveDevice(devices, id, drag.cell, cols);
    const [w, h] = spanOf(device);
    const width = drag.mode === 'bottom' ? w : clampTo(drag.cell[0] - device.cell[0] + 1, 1, SPAN_MAX_COLUMNS);
    const height = drag.mode === 'right' ? h : clampTo(drag.cell[1] - device.cell[1] + 1, 1, SPAN_MAX_ROWS);
    return width === w && height === h ? devices : setSpan(devices, id, [width, height], cols);
}

// ---------------------------------------------------------------------------
// The footer
// ---------------------------------------------------------------------------

/** One device as the board writes it, for a comparison by id. */
const deviceText = (d: BoardDevice): string => encodeBoard([d]);

/** The board's own fields as it writes them: the record without devices. */
const settingsText = (s: BoardSettings | undefined): string => encodeBoard([], s);

/**
 * The changes Apply would write: the devices added, removed or changed (by id), one more when the board's own fields
 * (theme, accent, columns) differ; at least one when the written string differs in any other way (the order).
 */
export function unsavedChanges(
    stored: { readonly devices: readonly BoardDevice[]; readonly settings?: BoardSettings },
    draft: { readonly devices: readonly BoardDevice[]; readonly settings?: BoardSettings },
): number {
    const before = new Map(stored.devices.map(d => [d.id, deviceText(d)] as [string, string]));
    const after = new Map(draft.devices.map(d => [d.id, deviceText(d)] as [string, string]));
    let n = 0;
    for (const [id, text] of after) if (before.get(id) !== text) n++;
    for (const id of before.keys()) if (!after.has(id)) n++;
    if (settingsText(stored.settings) !== settingsText(draft.settings)) n++;
    if (n === 0 && encodeBoard(stored.devices, stored.settings) !== encodeBoard(draft.devices, draft.settings)) n = 1;
    return n;
}

/** The devices whose binding does not resolve (simBoard.ts `resolveDevice`): the footer's «bindings to review». */
export function bindingsToReview(statuses: Iterable<DeviceStatus>): number {
    let n = 0;
    for (const s of statuses) if (!s.ok) n++;
    return n;
}

/** Apply: enabled with a change, or over a stored board that is not readable (Apply replaces it); the title says why. */
export function applyState(changes: number, readable: boolean): { enabled: boolean; title: string } {
    return changes > 0 || !readable
        ? { enabled: true, title: 'Write the board in one step; one undo reverts it. A run of this model goes on.' }
        : { enabled: false, title: 'Nothing to apply: the board is as it was opened.' };
}

// ---------------------------------------------------------------------------
// The device list and the Add menu
// ---------------------------------------------------------------------------

export type ListGroup = 'inputs' | 'outputs' | 'panel';

const groupOf = (kind: DeviceKind): ListGroup => (kind === 'silk' ? 'panel' : isInputKind(kind) ? 'inputs' : 'outputs');

/** The list's groups: the inputs, the outputs, then the silkscreens, each in board order; an empty group left out. */
export function listGroups(devices: readonly BoardDevice[]): Array<{ group: ListGroup; devices: BoardDevice[] }> {
    const ordered = [...devices].sort(byCell);
    return (['inputs', 'outputs', 'panel'] as const)
        .map(group => ({ group, devices: ordered.filter(d => groupOf(d.kind) === group) }))
        .filter(g => g.devices.length > 0);
}

/** The list shows a search field above this many devices. */
export const SEARCH_ABOVE = 10;

export type SizeChoice = '1x1' | '2x1' | '2x2';

/** The size control of an expanded row: three spans; another span is set from the row's options. */
export const SIZE_CHOICES: ReadonlyArray<{ readonly id: SizeChoice; readonly span: readonly [number, number]; readonly label: string }> = [
    { id: '1x1', span: [1, 1], label: '1×1' },
    { id: '2x1', span: [2, 1], label: '2×1' },
    { id: '2x2', span: [2, 2], label: '2×2' },
];

export function sizeChoiceOf(device: BoardDevice): SizeChoice | null {
    const [w, h] = spanOf(device);
    return SIZE_CHOICES.find(c => c.span[0] === w && c.span[1] === h)?.id ?? null;
}

const NOT_EXPORTED = 'preview only, not exported to nuXmv.';

/** Why a device is drawn on the board but absent from the `.smv` export: the Pulse LED, the configuration display, the Buzzer. */
export function exportNote(device: BoardDevice): string | null {
    if (device.kind === 'pulse') return `A Pulse LED reads the trace: ${NOT_EXPORTED}`;
    if (device.kind === 'buzzer') return `A Buzzer sounds on the rising edge of its boolean: ${NOT_EXPORTED}`;
    if (device.kind === 'text' && device.binding?.kind === 'configuration') return `A configuration display shows the marking: ${NOT_EXPORTED}`;
    return null;
}

/** One entry of the Add menu: the kind added, the binding it starts with, and the note of a preview-only type. */
export interface AddEntry {
    readonly label: string;
    readonly kind: DeviceKind;
    readonly group: 'Inputs' | 'Outputs' | 'Panel';
    readonly binding?: BoardBinding;
    readonly note: string | null;
}

const entry = (kind: DeviceKind, group: AddEntry['group'], label: string = DEVICE_LABELS[kind], binding?: BoardBinding): AddEntry => ({
    label, kind, group, ...(binding ? { binding } : {}),
    note: exportNote({ id: '', kind, cell: [0, 0], label: '', binding: binding ?? null }),
});

/** The Add menu: the five inputs, the outputs with the configuration display (a Text display on the configuration), the silkscreen. */
export const ADD_ENTRIES: readonly AddEntry[] = [
    entry('button', 'Inputs'), entry('switch', 'Inputs'), entry('slider', 'Inputs'), entry('keypad', 'Inputs'), entry('clock', 'Inputs'),
    entry('led', 'Outputs'), entry('pulse', 'Outputs'), entry('seven', 'Outputs'), entry('text', 'Outputs'),
    entry('text', 'Outputs', 'Config display', { kind: 'configuration' }), entry('gauge', 'Outputs'), entry('buzzer', 'Outputs'),
    entry('silk', 'Panel'),
];
