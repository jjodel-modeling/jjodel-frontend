/**
 * simBoardEditorLayout — the pure parts of the board editor's layout (P-2026-10-06-0100, R-SIM-143): the selection
 * shared by the preview and the device list, the keyboard map, a drag on the preview (move and edge resize over free
 * cells), the footer's counters and the Apply rule, the list's groups and the Add menu.
 *
 * Executes the module on a microwave board of eight columns: a TIME text display 2×1, the Cooking and Door open LEDs,
 * the Open, Add, Reset and Close buttons. Each test name says which break of the rule kills it; the mutation bench is
 * in the commit message.
 */

import { describe, expect, it } from 'vitest';
import {
    ADD_ENTRIES, NO_SELECTION, SIZE_CHOICES, afterRemove, applyState, bindingsToReview, cellAtPoint, dragResult, editorKeyAction, exportNote, listGroups,
    neighbourDevice, selectDevice, sizeChoiceOf, unsavedChanges,
} from '../simBoardEditorLayout';
import type { EditorKeyEvent } from '../simBoardEditorLayout';
import type { BoardDevice, BoardSettings } from '../../../../model/simulation/boardCodec';
import { moveDevice } from '../simBoard';
import type { DeviceStatus } from '../simBoard';

const button = (id: string, label: string, cell: [number, number]): BoardDevice => ({ id, kind: 'button', cell, label, binding: { kind: 'event', event: `e-${label}` } });
const led = (id: string, label: string, cell: [number, number]): BoardDevice => ({ id, kind: 'led', cell, label, binding: { kind: 'expr', text: `model.[${label}]` } });

/** The microwave of the probe, on eight columns. */
const MICROWAVE: BoardDevice[] = [
    { id: 'd1', kind: 'text', cell: [0, 0], label: 'TIME', binding: { kind: 'expr', text: 'model.[secs]' }, span: [2, 1] },
    led('d2', 'Cooking', [2, 0]),
    led('d3', 'Door open', [3, 0]),
    button('d4', 'Open', [0, 1]),
    button('d5', 'Add', [1, 1]),
    button('d6', 'Reset', [2, 1]),
    button('d7', 'Close', [3, 1]),
];
const EIGHT: BoardSettings = { cols: 8 };

const key = (k: string, x: Partial<EditorKeyEvent> = {}): EditorKeyEvent => ({ key: k, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, target: { tagName: 'DIV' }, ...x });

describe('selectDevice: one selection for the preview and the list, one row expanded (R-SIM-143)', () => {
    it('open (a click on the preview, Enter) selects and expands, and collapses any other row (mutants: the old row kept; selection not moved)', () => {
        expect(selectDevice(NO_SELECTION, 'd4', 'open')).toEqual({ selected: 'd4', expanded: 'd4' });
        expect(selectDevice({ selected: 'd4', expanded: 'd4' }, 'd2', 'open')).toEqual({ selected: 'd2', expanded: 'd2' });
    });

    it('toggle (a click on a row) expands a collapsed row and collapses the expanded one, the device staying selected (mutants: always open; the selection cleared on collapse)', () => {
        expect(selectDevice({ selected: 'd1', expanded: null }, 'd5', 'toggle')).toEqual({ selected: 'd5', expanded: 'd5' });
        expect(selectDevice({ selected: 'd5', expanded: 'd5' }, 'd5', 'toggle')).toEqual({ selected: 'd5', expanded: null });
        expect(selectDevice({ selected: 'd5', expanded: 'd5' }, 'd6', 'toggle')).toEqual({ selected: 'd6', expanded: 'd6' });
    });

    it('focus (an arrow) moves the selection; the expanded row follows it only when one was open (mutants: always expands; never follows)', () => {
        expect(selectDevice({ selected: 'd4', expanded: null }, 'd5', 'focus')).toEqual({ selected: 'd5', expanded: null });
        expect(selectDevice({ selected: 'd4', expanded: 'd4' }, 'd5', 'focus')).toEqual({ selected: 'd5', expanded: 'd5' });
    });

    it('afterRemove clears the selection and the expansion of the device removed only (mutants: clears always; keeps a removed id)', () => {
        expect(afterRemove({ selected: 'd4', expanded: 'd4' }, 'd4')).toEqual(NO_SELECTION);
        expect(afterRemove({ selected: 'd4', expanded: 'd2' }, 'd2')).toEqual({ selected: 'd4', expanded: null });
        expect(afterRemove({ selected: 'd4', expanded: 'd4' }, 'd7')).toEqual({ selected: 'd4', expanded: 'd4' });
    });
});

describe('neighbourDevice: the arrows walk the board by the devices\' places', () => {
    it('right and left stay on the row a device shares before looking further (mutants: nearest centre only; direction inverted)', () => {
        expect(neighbourDevice(MICROWAVE, 'd1', 'ArrowRight')).toBe('d2');
        expect(neighbourDevice(MICROWAVE, 'd4', 'ArrowRight')).toBe('d5');
        expect(neighbourDevice(MICROWAVE, 'd6', 'ArrowLeft')).toBe('d5');
    });

    it('up and down pick the device across the row nearest on the other axis, a span read by its centre (mutants: span ignored; first in board order)', () => {
        expect(neighbourDevice(MICROWAVE, 'd5', 'ArrowUp')).toBe('d1');
        expect(neighbourDevice(MICROWAVE, 'd3', 'ArrowDown')).toBe('d7');
        expect(neighbourDevice(MICROWAVE, 'd2', 'ArrowDown')).toBe('d6');
    });

    it('a tie along the arrow goes to the nearest across it, a span read by its centre (mutants: across ignored; span ignored)', () => {
        const s: BoardDevice = { ...led('s', 'S', [1, 0]), span: [2, 1] };
        const a: BoardDevice = { ...led('a', 'A', [0, 1]), span: [2, 1] };
        expect(neighbourDevice([s, a, led('b', 'B', [2, 1])], 's', 'ArrowDown')).toBe('b');
        const wide: BoardDevice = { ...led('w', 'W', [0, 1]), span: [4, 1] };
        expect(neighbourDevice([led('s', 'S', [1, 0]), wide, led('x', 'X', [3, 2])], 's', 'ArrowRight')).toBe('w');
    });

    it('nothing that way gives null; no selection gives the first device in board order (mutants: wraps around; the first in the array)', () => {
        expect(neighbourDevice(MICROWAVE, 'd4', 'ArrowLeft')).toBeNull();
        expect(neighbourDevice(MICROWAVE, 'd1', 'ArrowUp')).toBeNull();
        expect(neighbourDevice([MICROWAVE[3], MICROWAVE[0]], null, 'ArrowDown')).toBe('d1');
        expect(neighbourDevice([], null, 'ArrowDown')).toBeNull();
    });
});

describe('editorKeyAction: the keyboard map of the editor (R-SIM-143 item 5)', () => {
    it('Escape closes from anywhere, a field included (mutants: Escape ignored in a field)', () => {
        expect(editorKeyAction(key('Escape', { target: { tagName: 'INPUT' } }), MICROWAVE, 'd4')).toEqual({ kind: 'close' });
        expect(editorKeyAction(key('Escape'), MICROWAVE, null)).toEqual({ kind: 'close' });
    });

    it('an arrow moves the selected device one cell in its direction (mutants: the arrow selects; the direction inverted; two cells)', () => {
        expect(editorKeyAction(key('ArrowRight'), MICROWAVE, 'd4')).toEqual({ kind: 'move', id: 'd4', cell: [1, 1] });
        expect(editorKeyAction(key('ArrowDown'), MICROWAVE, 'd4')).toEqual({ kind: 'move', id: 'd4', cell: [0, 2] });
        expect(editorKeyAction(key('ArrowLeft'), MICROWAVE, 'd5')).toEqual({ kind: 'move', id: 'd5', cell: [0, 1] });
        expect(editorKeyAction(key('ArrowUp'), MICROWAVE, 'd5')).toEqual({ kind: 'move', id: 'd5', cell: [1, 0] });
    });

    it('Shift and an arrow select the neighbouring device, and nothing that way gives null (mutants: Shift ignored; the branches swapped back; a move on Shift)', () => {
        expect(editorKeyAction(key('ArrowRight', { shiftKey: true }), MICROWAVE, 'd4')).toEqual({ kind: 'select', id: 'd5' });
        expect(editorKeyAction(key('ArrowLeft', { shiftKey: true }), MICROWAVE, 'd5')).toEqual({ kind: 'select', id: 'd4' });
        expect(editorKeyAction(key('ArrowUp', { shiftKey: true }), MICROWAVE, 'd4')).toEqual({ kind: 'select', id: 'd1' });
        expect(editorKeyAction(key('ArrowDown', { shiftKey: true }), MICROWAVE, 'd1')).toEqual({ kind: 'select', id: 'd4' });
        expect(editorKeyAction(key('ArrowLeft', { shiftKey: true }), MICROWAVE, 'd4')).toBeNull();
    });

    it('a move the board refuses changes nothing: off the grid the action carries the cell and moveDevice returns the same board (mutants: the cell clamped into the grid)', () => {
        const edge = [...MICROWAVE, button('d8', 'Edge', [7, 1])];
        for (const [id, k, cell] of [['d4', 'ArrowLeft', [-1, 1]], ['d1', 'ArrowUp', [0, -1]], ['d8', 'ArrowRight', [8, 1]]] as const) {
            const act = editorKeyAction(key(k), edge, id);
            expect(act).toEqual({ kind: 'move', id, cell });
            if (act?.kind === 'move') expect(moveDevice(edge, act.id, act.cell, 8)).toBe(edge);
        }
        const free = editorKeyAction(key('ArrowDown'), edge, 'd5');
        expect(free).toEqual({ kind: 'move', id: 'd5', cell: [1, 2] });
        if (free?.kind === 'move') expect(moveDevice(edge, free.id, free.cell, 8).find(d => d.id === 'd5')?.cell).toEqual([1, 2]);
    });

    it('with no device selected an arrow, with or without Shift, selects the first device in board order; an unknown id counts as none (mutants: the plain arrow returns null; the first in the array)', () => {
        const shuffled = [MICROWAVE[3], MICROWAVE[0], MICROWAVE[1]];
        expect(editorKeyAction(key('ArrowRight'), MICROWAVE, null)).toEqual({ kind: 'select', id: 'd1' });
        expect(editorKeyAction(key('ArrowDown', { shiftKey: true }), MICROWAVE, null)).toEqual({ kind: 'select', id: 'd1' });
        expect(editorKeyAction(key('ArrowLeft'), shuffled, null)).toEqual({ kind: 'select', id: 'd1' });
        expect(editorKeyAction(key('ArrowRight'), MICROWAVE, 'gone')).toEqual({ kind: 'select', id: 'd1' });
        expect(editorKeyAction(key('ArrowRight'), [], null)).toBeNull();
    });

    it('Delete and Backspace remove the selected device, Enter expands its row (mutants: Backspace missed; Enter deletes)', () => {
        expect(editorKeyAction(key('Delete'), MICROWAVE, 'd3')).toEqual({ kind: 'delete', id: 'd3' });
        expect(editorKeyAction(key('Backspace'), MICROWAVE, 'd3')).toEqual({ kind: 'delete', id: 'd3' });
        expect(editorKeyAction(key('Enter'), MICROWAVE, 'd3')).toEqual({ kind: 'expand', id: 'd3' });
        expect(editorKeyAction(key('Delete'), MICROWAVE, null)).toBeNull();
        expect(editorKeyAction(key('Enter'), MICROWAVE, null)).toBeNull();
    });

    it('a field, a select, a modifier and Enter on a button leave the key to the page (mutants: the field guard dropped; the button\'s Enter taken)', () => {
        for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) {
            expect(editorKeyAction(key('Delete', { target: { tagName } }), MICROWAVE, 'd3')).toBeNull();
            expect(editorKeyAction(key('ArrowRight', { target: { tagName } }), MICROWAVE, 'd3')).toBeNull();
            expect(editorKeyAction(key('ArrowRight', { shiftKey: true, target: { tagName } }), MICROWAVE, 'd3')).toBeNull();
        }
        expect(editorKeyAction(key('Delete', { target: { tagName: 'DIV', isContentEditable: true } }), MICROWAVE, 'd3')).toBeNull();
        expect(editorKeyAction(key('ArrowRight', { ctrlKey: true }), MICROWAVE, 'd4')).toBeNull();
        expect(editorKeyAction(key('ArrowRight', { shiftKey: true, ctrlKey: true }), MICROWAVE, 'd4')).toBeNull();
        expect(editorKeyAction(key('ArrowRight', { metaKey: true }), MICROWAVE, 'd4')).toBeNull();
        expect(editorKeyAction(key('Delete', { altKey: true }), MICROWAVE, 'd4')).toBeNull();
        expect(editorKeyAction(key('Enter', { target: { tagName: 'BUTTON' } }), MICROWAVE, 'd3')).toBeNull();
        expect(editorKeyAction(key('Delete', { target: { tagName: 'BUTTON' } }), MICROWAVE, 'd3')).toEqual({ kind: 'delete', id: 'd3' });
    });
});

describe('cellAtPoint: the cell under the pointer on the preview\'s grid', () => {
    // Four columns of 50 px, a first row of 40 px and a second of 120 px (a keypad), 10 px gaps, from (100, 50).
    const grid = { left: 100, top: 50, columns: [50, 50, 50, 50], rows: [40, 120], gap: 10 };

    it('a point in a cell or in the gap after it reads that cell (mutants: the gap ignored; columns and rows swapped)', () => {
        expect(cellAtPoint(100 + 5, 50 + 5, grid)).toEqual([0, 0]);
        expect(cellAtPoint(100 + 61, 50 + 51, grid)).toEqual([1, 1]);
        expect(cellAtPoint(100 + 54, 50 + 5, grid)).toEqual([0, 0]);
        expect(cellAtPoint(100 + 175, 50 + 45, grid)).toEqual([2, 0]);
        expect(cellAtPoint(100 + 185, 50 + 85, grid)).toEqual([3, 1]);
    });

    it('rows of their own heights: a tall row read by its track, not by an even split (mutants: rows taken as equal)', () => {
        expect(cellAtPoint(100 + 5, 50 + 160, grid)).toEqual([0, 1]);
        const uneven = { left: 0, top: 0, columns: [100, 20], rows: [20, 20, 20], gap: 0 };
        expect(cellAtPoint(90, 50, uneven)).toEqual([0, 2]);
    });

    it('a point outside the grid is clamped to its edge cells (mutants: no clamp; clamp off by one)', () => {
        expect(cellAtPoint(0, 0, grid)).toEqual([0, 0]);
        expect(cellAtPoint(900, 900, grid)).toEqual([3, 1]);
        expect(cellAtPoint(5, 5, { left: 0, top: 0, columns: [], rows: [], gap: 0 })).toEqual([0, 0]);
    });
});

describe('dragResult: a drag on the preview moves over free cells and resizes by an edge', () => {
    it('a move onto free cells moves the device, its span with it; off the grid nothing moves (mutants: the cols of the board ignored)', () => {
        expect(dragResult(MICROWAVE, 'd4', { mode: 'move', cell: [5, 1] }, 8).find(d => d.id === 'd4')?.cell).toEqual([5, 1]);
        expect(dragResult(MICROWAVE, 'd1', { mode: 'move', cell: [4, 2] }, 8).find(d => d.id === 'd1')).toMatchObject({ cell: [4, 2], span: [2, 1] });
        expect(dragResult(MICROWAVE, 'd1', { mode: 'move', cell: [7, 0] }, 8)).toBe(MICROWAVE);
        expect(dragResult(MICROWAVE, 'd4', { mode: 'move', cell: [5, 1] }, 4)).toBe(MICROWAVE);
    });

    it('the right edge sets the width, the bottom edge the height, the corner both, over free cells (mutants: edges swapped; the corner reads one axis)', () => {
        expect(dragResult(MICROWAVE, 'd3', { mode: 'right', cell: [4, 1] }, 8).find(d => d.id === 'd3')?.span).toEqual([2, 1]);
        expect(dragResult(MICROWAVE, 'd7', { mode: 'bottom', cell: [5, 2] }, 8).find(d => d.id === 'd7')?.span).toEqual([1, 2]);
        expect(dragResult(MICROWAVE, 'd7', { mode: 'corner', cell: [4, 2] }, 8).find(d => d.id === 'd7')?.span).toEqual([2, 2]);
    });

    it('a resize over another device is refused; a drag back over the device itself gives one cell (mutants: no refusal; span below one)', () => {
        expect(dragResult(MICROWAVE, 'd2', { mode: 'right', cell: [3, 0] }, 8)).toBe(MICROWAVE);
        expect(dragResult(MICROWAVE, 'd3', { mode: 'bottom', cell: [3, 1] }, 8)).toBe(MICROWAVE);
        const narrowed = dragResult(MICROWAVE, 'd1', { mode: 'right', cell: [0, 0] }, 8).find(d => d.id === 'd1');
        expect(narrowed?.span).toBeUndefined();
        expect(dragResult(MICROWAVE, 'd5', { mode: 'corner', cell: [0, 0] }, 8).find(d => d.id === 'd5')?.span).toBeUndefined();
        const wideLed: BoardDevice[] = [{ ...led('d1', 'Wide', [2, 3]), span: [2, 1] }];
        expect(dragResult(wideLed, 'd1', { mode: 'right', cell: [0, 3] }, 8)[0].span).toBeUndefined();
    });

    it('a width beyond the span\'s domain is clamped to it (mutants: clamp dropped, the span refused)', () => {
        const wide = dragResult(MICROWAVE, 'd4', { mode: 'right', cell: [7, 2] }, 8);
        expect(wide).toBe(MICROWAVE);
        const free: BoardDevice[] = [button('d1', 'Open', [0, 3])];
        expect(dragResult(free, 'd1', { mode: 'corner', cell: [7, 7] }, 8)[0].span).toEqual([4, 2]);
    });
});

describe('the footer: changes, bindings to review, Apply (R-SIM-143 item 4)', () => {
    it('unsavedChanges counts the devices added, removed or changed, and one for the board\'s own fields (mutants: settings ignored; a device counted twice)', () => {
        const stored = { devices: MICROWAVE, settings: EIGHT };
        expect(unsavedChanges(stored, { devices: MICROWAVE, settings: EIGHT })).toBe(0);
        const relabelled = MICROWAVE.map(d => (d.id === 'd5' ? { ...d, label: 'Add 30 s' } : d));
        expect(unsavedChanges(stored, { devices: relabelled, settings: EIGHT })).toBe(1);
        expect(unsavedChanges(stored, { devices: [...relabelled.slice(1), button('d8', 'Start', [4, 1])], settings: { ...EIGHT, theme: 'appliance' } })).toBe(4);
        expect(unsavedChanges(stored, { devices: MICROWAVE, settings: { cols: 8, accent: '#e8590c' } })).toBe(1);
    });

    it('a board whose devices only changed order still has one change to write (mutants: the encoding not compared)', () => {
        expect(unsavedChanges({ devices: MICROWAVE, settings: EIGHT }, { devices: [...MICROWAVE].reverse(), settings: EIGHT })).toBe(1);
    });

    it('bindingsToReview counts the devices whose binding does not resolve (mutants: counts the resolved ones)', () => {
        const statuses: DeviceStatus[] = [{ ok: true }, { ok: false, reason: 'Not bound.' }, { ok: true }, { ok: true }];
        expect(bindingsToReview(statuses)).toBe(1);
        expect(bindingsToReview([])).toBe(0);
    });

    it('Apply is enabled with a change or over an unreadable board, and says why when it is not (mutants: readable ignored; no reason)', () => {
        expect(applyState(0, true)).toEqual({ enabled: false, title: 'Nothing to apply: the board is as it was opened.' });
        expect(applyState(3, true).enabled).toBe(true);
        expect(applyState(0, false).enabled).toBe(true);
        expect(applyState(1, true).title).toMatch(/one undo reverts it/);
    });
});

describe('the device list and the Add menu', () => {
    it('listGroups gives the inputs, then the outputs, then the panel, each in board order, empty groups left out (mutants: outputs first; array order)', () => {
        const groups = listGroups([...MICROWAVE].reverse());
        expect(groups.map(g => [g.group, g.devices.map(d => d.id)])).toEqual([['inputs', ['d4', 'd5', 'd6', 'd7']], ['outputs', ['d1', 'd2', 'd3']]]);
        const silk: BoardDevice = { id: 'd9', kind: 'silk', cell: [0, 3], label: 'Door', binding: null };
        expect(listGroups([silk, MICROWAVE[3]]).map(g => g.group)).toEqual(['inputs', 'panel']);
    });

    it('sizeChoiceOf reads 1×1, 2×1 and 2×2, and null for another span (mutants: width and height swapped)', () => {
        expect(SIZE_CHOICES.map(c => c.label)).toEqual(['1×1', '2×1', '2×2']);
        expect(sizeChoiceOf(MICROWAVE[3])).toBe('1x1');
        expect(sizeChoiceOf(MICROWAVE[0])).toBe('2x1');
        expect(sizeChoiceOf({ ...MICROWAVE[3], span: [2, 2] })).toBe('2x2');
        expect(sizeChoiceOf({ ...MICROWAVE[3], span: [1, 2] })).toBeNull();
    });

    it('exportNote names the preview-only devices: the Pulse LED, the configuration display and the Buzzer (mutants: any text display; the Buzzer missed)', () => {
        expect(exportNote({ id: 'p', kind: 'pulse', cell: [0, 0], label: '', binding: null })).toMatch(/not exported to nuXmv/);
        expect(exportNote({ id: 'c', kind: 'text', cell: [0, 0], label: '', binding: { kind: 'configuration' } })).toMatch(/not exported to nuXmv/);
        expect(exportNote({ id: 'z', kind: 'buzzer', cell: [0, 0], label: '', binding: null })).toMatch(/not exported to nuXmv/);
        expect(exportNote(MICROWAVE[0])).toBeNull();
        expect(exportNote(MICROWAVE[1])).toBeNull();
    });

    it('the Add menu lists the five inputs, the outputs with the configuration display, and the preview-only ones carry their note (mutants: a kind dropped)', () => {
        expect(ADD_ENTRIES.filter(e => e.group === 'Inputs').map(e => e.label)).toEqual(['Button', 'Switch', 'Slider', 'Keypad', 'Clock']);
        expect(ADD_ENTRIES.filter(e => e.group === 'Outputs').map(e => e.label)).toEqual(['LED', 'Pulse LED', '7-segment', 'Text display', 'Config display', 'Gauge', 'Buzzer']);
        expect(ADD_ENTRIES.filter(e => e.note !== null).map(e => e.label)).toEqual(['Pulse LED', 'Config display', 'Buzzer']);
        expect(ADD_ENTRIES.find(e => e.label === 'Config display')).toMatchObject({ kind: 'text', binding: { kind: 'configuration' } });
        expect(ADD_ENTRIES.filter(e => e.group === 'Panel').map(e => e.kind)).toEqual(['silk']);
    });
});
