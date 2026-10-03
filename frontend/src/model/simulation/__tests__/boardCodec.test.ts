/**
 * boardCodec — the I/O board record of a model (R-SIM-115, P-2026-10-03-1845 Lane 1,
 * docs/discovery/discovery_2026-10-03_sim_io_board.md §2).
 *
 * The record is one JSON string under the model bag's `ioBoard` key; decoding is
 * tolerant device by device, as the declarations' codec is record by record
 * (R-SIM-68). Each test name says which break of the rule kills it; the mutation
 * bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { BINDING_KINDS, DEVICE_KINDS, IO_BOARD_KEY, bindingFits, decodeBoard, encodeBoard, isInputKind } from '../boardCodec';
import type { BoardBinding, BoardDevice, DeviceKind } from '../boardCodec';

const dev = (id: string, kind: DeviceKind, cell: [number, number], binding: BoardBinding | null, label = ''): BoardDevice =>
    ({ id, kind, cell, label, binding });

/** One device of every kind, each with a binding of every form it accepts once. */
const ALL: BoardDevice[] = [
    dev('d1', 'button', [0, 0], { kind: 'event', event: 'Ev_coin' }, 'Coin'),
    dev('d2', 'switch', [1, 0], { kind: 'ivar', element: 'M', attr: 'power' }),
    dev('d3', 'switch', [2, 0], { kind: 'events', on: 'Ev_on', off: 'Ev_off' }),
    dev('d4', 'slider', [3, 0], { kind: 'ivar', element: 'M', attr: 'speed' }),
    dev('d5', 'keypad', [0, 1], { kind: 'keypadValue', element: 'M', attr: 'pin', enter: 'Ev_enter', hideOut: false }),
    dev('d6', 'keypad', [1, 1], { kind: 'keypadEvents', keys: ['Ev_0', '', '', '', '', '', '', '', '', 'Ev_9'] }),
    dev('d7', 'led', [2, 1], { kind: 'marked', place: 'P_locked' }),
    dev('d8', 'led', [3, 1], { kind: 'expr', text: 'model.[paid]' }),
    dev('d9', 'pulse', [0, 2], { kind: 'transition', transition: 'T_tc' }),
    dev('d10', 'pulse', [1, 2], { kind: 'event', event: 'Ev_coin' }),
    dev('d11', 'seven', [2, 2], { kind: 'expr', text: 'model.[coins]' }),
    dev('d12', 'text', [3, 2], { kind: 'configuration' }),
    dev('d13', 'gauge', [0, 3], { kind: 'attr', element: 'M', attr: 'coins' }),
    dev('d14', 'led', [1, 3], null),
];

describe('the key and the kinds', () => {
    it('the key is ioBoard, not a sim* key: runSignature folds every sim* key of the model bag (report §2, mutant: key renamed simBoard)', () => {
        expect(IO_BOARD_KEY).toBe('ioBoard');
        expect(IO_BOARD_KEY.startsWith('sim')).toBe(false);
    });

    it('nine kinds, four inputs then five outputs (R-SIM-111)', () => {
        expect(DEVICE_KINDS).toEqual(['button', 'switch', 'slider', 'keypad', 'led', 'pulse', 'seven', 'text', 'gauge']);
        expect(DEVICE_KINDS.filter(isInputKind)).toEqual(['button', 'switch', 'slider', 'keypad']);
    });

    it('each kind accepts its bindings only (mutant: a gauge accepting an expression, a button accepting an ivar)', () => {
        expect(BINDING_KINDS.button).toEqual(['event']);
        expect(BINDING_KINDS.switch).toEqual(['ivar', 'events']);
        expect(BINDING_KINDS.gauge).toEqual(['attr']);
        expect(bindingFits('button', { kind: 'event', event: 'e' })).toBe(true);
        expect(bindingFits('button', { kind: 'ivar', element: 'M', attr: 'x' })).toBe(false);
        expect(bindingFits('gauge', { kind: 'expr', text: 'model.[x]' })).toBe(false);
        expect(bindingFits('pulse', { kind: 'transition', transition: 't' })).toBe(true);
    });
});

describe('encodeBoard and decodeBoard', () => {
    it('round trip: every kind and every binding form decode to what was encoded, no defect', () => {
        const raw = encodeBoard(ALL);
        const back = decodeBoard(raw);
        expect(back.defects).toEqual([]);
        expect(back.readable).toBe(true);
        expect(back.devices).toEqual(ALL);
    });

    it('the string is canonical: fields in a fixed order, so the same board gives the same string whatever order it was built in (mutant: object spread order)', () => {
        const raw = encodeBoard([dev('d1', 'button', [0, 0], { kind: 'event', event: 'E' }, 'Coin')]);
        expect(raw).toBe('{"v":1,"devices":[{"id":"d1","kind":"button","cell":[0,0],"label":"Coin","binding":{"kind":"event","event":"E"}}]}');
        const shuffled = JSON.parse(raw);
        shuffled.devices[0] = { binding: { event: 'E', kind: 'event' }, label: 'Coin', cell: [0, 0], kind: 'button', id: 'd1' };
        expect(encodeBoard(decodeBoard(JSON.stringify(shuffled)).devices)).toBe(raw);
    });

    it('the empty board is devices: [], never an absent key (the removal-undo ticket, report §2)', () => {
        expect(encodeBoard([])).toBe('{"v":1,"devices":[]}');
    });

    it('an absent key is the empty board, readable, no defect', () => {
        for (const raw of [undefined, null, '']) {
            expect(decodeBoard(raw)).toEqual({ devices: [], defects: [], readable: true });
        }
    });

    it('a string that is not JSON, or has no v 1 and devices, is one defect on the key and not readable, never a silent empty board', () => {
        for (const raw of ['not json', '{"devices":[]}', '{"v":2,"devices":[]}', '{"v":1}', '[]']) {
            const d = decodeBoard(raw);
            expect(d.readable).toBe(false);
            expect(d.devices).toEqual([]);
            expect(d.defects).toHaveLength(1);
            expect(d.defects[0]).toMatchObject({ index: null, code: 'key' });
        }
    });

    it('tolerant per device: an unknown kind, a cell off the grid, a missing id are defects of their own, the others decode (mutant: one bad device drops the board)', () => {
        const raw = JSON.stringify({
            v: 1,
            devices: [
                { id: 'd1', kind: 'button', cell: [0, 0], label: '', binding: { kind: 'event', event: 'E' } },
                { id: 'd2', kind: 'lamp', cell: [1, 0], label: '', binding: null },
                { id: 'd3', kind: 'led', cell: [9, 0], label: '', binding: null },
                { kind: 'led', cell: [2, 0], label: '', binding: null },
                { id: 'd5', kind: 'led', cell: [3, 0], label: '', binding: null },
            ],
        });
        const d = decodeBoard(raw);
        expect(d.devices.map(x => x.id)).toEqual(['d1', 'd5']);
        expect(d.defects.map(x => [x.index, x.code])).toEqual([[1, 'device'], [2, 'device'], [3, 'device']]);
        expect(d.readable).toBe(true);
    });

    it('a second device with the same id or on the same cell is a defect, the first kept', () => {
        const raw = JSON.stringify({
            v: 1,
            devices: [
                { id: 'd1', kind: 'led', cell: [0, 0], label: '', binding: null },
                { id: 'd1', kind: 'led', cell: [1, 0], label: '', binding: null },
                { id: 'd3', kind: 'led', cell: [0, 0], label: '', binding: null },
            ],
        });
        const d = decodeBoard(raw);
        expect(d.devices.map(x => x.id)).toEqual(['d1']);
        expect(d.defects.map(x => x.index)).toEqual([1, 2]);
    });

    it('a binding that does not fit its kind, or misses a field, leaves the device unbound with a binding defect: the device is kept (mutant: device dropped)', () => {
        const raw = JSON.stringify({
            v: 1,
            devices: [
                { id: 'd1', kind: 'gauge', cell: [0, 0], label: 'g', binding: { kind: 'expr', text: 'model.[x]' } },
                { id: 'd2', kind: 'button', cell: [1, 0], label: '', binding: { kind: 'event' } },
                { id: 'd3', kind: 'keypad', cell: [2, 0], label: '', binding: { kind: 'keypadEvents', keys: ['a', 'b'] } },
            ],
        });
        const d = decodeBoard(raw);
        expect(d.devices.map(x => [x.id, x.binding])).toEqual([['d1', null], ['d2', null], ['d3', null]]);
        expect(d.defects.map(x => [x.index, x.code])).toEqual([[0, 'binding'], [1, 'binding'], [2, 'binding']]);
    });

    it('unknown fields are ignored; a missing label reads empty, a missing hideOut reads false', () => {
        const raw = JSON.stringify({
            v: 1, extra: 1,
            devices: [{ id: 'd1', kind: 'keypad', cell: [0, 0], colour: 'red', binding: { kind: 'keypadValue', element: 'M', attr: 'pin', enter: 'E' } }],
        });
        const d = decodeBoard(raw);
        expect(d.defects).toEqual([]);
        expect(d.devices).toEqual([dev('d1', 'keypad', [0, 0], { kind: 'keypadValue', element: 'M', attr: 'pin', enter: 'E', hideOut: false })]);
    });

    it('the ids inside the string are plain text, so the import that renews ids by text replacement remaps them (report H3)', () => {
        const raw = encodeBoard([dev('d1', 'button', [0, 0], { kind: 'event', event: 'Pointer123_USER_57' })]);
        const renewed = raw.split('Pointer123_USER_57').join('Pointer999_USER_1');
        expect(decodeBoard(renewed).devices[0].binding).toEqual({ kind: 'event', event: 'Pointer999_USER_1' });
    });
});
