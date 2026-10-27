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
import {
    BINDING_KINDS, BOARD_COLS, BOARD_THEMES, CLOCK_PERIOD_DEFAULT, CLOCK_PERIOD_MAX, CLOCK_PERIOD_MIN, DEVICE_KINDS, IO_BOARD_KEY, STYLE_FIELDS, bindingFits,
    canonicalStyle, coveredCells, decodeBoard, encodeBoard, fitsGrid, isAccent, isClockPeriod, isInputKind, isSpan, onGrid, styleValueFits,
} from '../boardCodec';
import type { BoardBinding, BoardDevice, DeviceKind, DeviceStyle } from '../boardCodec';

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
    { ...dev('d15', 'clock', [2, 3], { kind: 'event', event: 'Ev_tick' }, 'Timer'), period: 2500 },
];

describe('the key and the kinds', () => {
    it('the key is ioBoard, not a sim* key: runSignature folds every sim* key of the model bag (report §2, mutant: key renamed simBoard)', () => {
        expect(IO_BOARD_KEY).toBe('ioBoard');
        expect(IO_BOARD_KEY.startsWith('sim')).toBe(false);
    });

    it('twelve kinds, five inputs, six outputs and the silkscreen: the clock is the fifth input (R-SIM-111 as amended by R-SIM-122 and R-SIM-128; mutant: clock an output)', () => {
        expect(DEVICE_KINDS).toEqual(['button', 'switch', 'slider', 'keypad', 'clock', 'led', 'pulse', 'seven', 'text', 'gauge', 'buzzer', 'silk']);
        expect(DEVICE_KINDS.filter(isInputKind)).toEqual(['button', 'switch', 'slider', 'keypad', 'clock']);
    });

    it('a clock takes the Button\'s binding, one event instance, and nothing else (R-SIM-122 decision 2; mutant: a clock accepting an ivar)', () => {
        expect(BINDING_KINDS.clock).toEqual(['event']);
        expect(bindingFits('clock', { kind: 'event', event: 'e' })).toBe(true);
        expect(bindingFits('clock', { kind: 'ivar', element: 'M', attr: 'x' })).toBe(false);
        expect(bindingFits('clock', { kind: 'events', on: 'a', off: 'b' })).toBe(false);
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

describe('the clock\'s period (R-SIM-122 decision 2)', () => {
    it('milliseconds, integer, 100..60000, default 1000 (mutant: bounds shifted by one; mutant: a fraction accepted)', () => {
        expect([CLOCK_PERIOD_MIN, CLOCK_PERIOD_MAX, CLOCK_PERIOD_DEFAULT]).toEqual([100, 60000, 1000]);
        expect([100, 1000, 60000].map(isClockPeriod)).toEqual([true, true, true]);
        expect([99, 60001, 0, -1000, 1000.5, NaN, Infinity].map(isClockPeriod)).toEqual([false, false, false, false, false, false, false]);
        expect(isClockPeriod('1000')).toBe(false);
        expect(isClockPeriod(null)).toBe(false);
    });

    it('a clock writes its period after the binding; every other kind writes none, so an existing board keeps its bytes (mutant: period on every device)', () => {
        const clock: BoardDevice = { ...dev('d1', 'clock', [0, 0], { kind: 'event', event: 'E' }), period: 1000 };
        expect(encodeBoard([clock])).toBe('{"v":1,"devices":[{"id":"d1","kind":"clock","cell":[0,0],"label":"","binding":{"kind":"event","event":"E"},"period":1000}]}');
        const button: BoardDevice = { ...dev('d1', 'button', [0, 0], { kind: 'event', event: 'E' }, 'Coin'), period: 500 };
        expect(encodeBoard([button])).toBe('{"v":1,"devices":[{"id":"d1","kind":"button","cell":[0,0],"label":"Coin","binding":{"kind":"event","event":"E"}}]}');
    });

    it('a stored clock without a period reads the default, with no defect; an unbound clock keeps its period (mutant: absent period a defect)', () => {
        const raw = JSON.stringify({ v: 1, devices: [
            { id: 'd1', kind: 'clock', cell: [0, 0], label: '', binding: { kind: 'event', event: 'E' } },
            { id: 'd2', kind: 'clock', cell: [1, 0], label: '', binding: null, period: 250 },
        ] });
        const d = decodeBoard(raw);
        expect(d.defects).toEqual([]);
        expect(d.devices.map(x => [x.id, x.period, x.binding])).toEqual([['d1', 1000, { kind: 'event', event: 'E' }], ['d2', 250, null]]);
    });

    it('a stored period that is not a whole number in 100..60000 is a defect of its device, never a clamp: the device is not read, the others are (mutant: clamped to the range)', () => {
        const bad: unknown[] = [50, 60001, 1.5, '1000', null, 0];
        const raw = JSON.stringify({ v: 1, devices: [
            ...bad.map((period, i) => ({ id: `c${i}`, kind: 'clock', cell: [i % 4, Math.floor(i / 4)], label: '', binding: { kind: 'event', event: 'E' }, period })),
            { id: 'ok', kind: 'clock', cell: [3, 3], label: '', binding: { kind: 'event', event: 'E' }, period: 60000 },
        ] });
        const d = decodeBoard(raw);
        expect(d.devices.map(x => [x.id, x.period])).toEqual([['ok', 60000]]);
        expect(d.defects.map(x => [x.index, x.code])).toEqual(bad.map((_, i) => [i, 'device']));
        expect(d.defects[0].message).toBe('c0: the period is not a whole number of milliseconds in 100..60000.');
        expect(d.readable).toBe(true);
    });

    it('a period stored on another kind is an unknown field: ignored, not read onto the device', () => {
        const raw = JSON.stringify({ v: 1, devices: [{ id: 'd1', kind: 'button', cell: [0, 0], label: '', binding: null, period: 5 }] });
        const d = decodeBoard(raw);
        expect(d.defects).toEqual([]);
        expect('period' in d.devices[0]).toBe(false);
    });
});

describe('the clock\'s auto-start (R-SIM-134)', () => {
    const CLOCK = '{"v":1,"devices":[{"id":"d1","kind":"clock","cell":[0,0],"label":"","binding":{"kind":"event","event":"E"},"period":1000}]}';
    const clock = (x: Partial<BoardDevice> = {}): BoardDevice => ({ ...dev('d1', 'clock', [0, 0], { kind: 'event', event: 'E' }), period: 1000, ...x });

    it('absent or false is not written: a clock saved today keeps its bytes, and so does every board of the base commit (mutant: false written; mutant: autoStart always written)', () => {
        expect(encodeBoard([clock()])).toBe(CLOCK);
        expect(encodeBoard([clock({ autoStart: false })])).toBe(CLOCK);
        expect(encodeBoard(ALL)).toBe(BASE_ALL);
        expect(encodeBoard(ALL.map(d => (d.kind === 'clock' ? { ...d, autoStart: false } : d)))).toBe(BASE_ALL);
    });

    it('true is written after the period, before the span and the style, and round-trips (mutant: written before period; mutant: dropped by the decoder)', () => {
        const raw = encodeBoard([clock({ autoStart: true, span: [2, 1], style: { shape: 'round' } })]);
        expect(raw).toBe('{"v":1,"devices":[{"id":"d1","kind":"clock","cell":[0,0],"label":"","binding":{"kind":"event","event":"E"},"period":1000,"autoStart":true,"span":[2,1],"style":{"shape":"round"}}]}');
        const back = decodeBoard(raw);
        expect(back.defects).toEqual([]);
        expect(back.devices[0].autoStart).toBe(true);
        expect(encodeBoard(back.devices)).toBe(raw);
    });

    it('a stored false reads as absent, so it re-encodes to today\'s bytes (mutant: false kept and written back)', () => {
        const d = decodeBoard(CLOCK.replace('"period":1000', '"period":1000,"autoStart":false'));
        expect(d.defects).toEqual([]);
        expect('autoStart' in d.devices[0]).toBe(false);
        expect(encodeBoard(d.devices)).toBe(CLOCK);
    });

    it('a stored value that is not a boolean drops the field with a defect naming it, never the device (R-SIM-123; mutant: the device dropped; mutant: "true" read as true)', () => {
        for (const bad of ['true', 1, null, {}]) {
            const d = decodeBoard(CLOCK.replace('"period":1000', `"period":1000,"autoStart":${JSON.stringify(bad)}`));
            expect(d.devices.map(x => [x.id, x.autoStart])).toEqual([['d1', undefined]]);
            expect(d.defects.map(x => [x.index, x.code, x.field])).toEqual([[0, 'device', 'autoStart']]);
            expect(d.defects[0].message).toBe('d1: auto-start is not true or false; the clock is switched on by hand.');
        }
    });

    it('on another kind it is an unknown field, as the period is there: ignored, never read nor written (mutant: autoStart on every kind)', () => {
        const raw = JSON.stringify({ v: 1, devices: [{ id: 'd1', kind: 'button', cell: [0, 0], label: '', binding: null, autoStart: true }] });
        const d = decodeBoard(raw);
        expect(d.defects).toEqual([]);
        expect('autoStart' in d.devices[0]).toBe(false);
        const button: BoardDevice = { ...dev('d1', 'button', [0, 0], null), autoStart: true };
        expect(encodeBoard([button])).toBe('{"v":1,"devices":[{"id":"d1","kind":"button","cell":[0,0],"label":"","binding":null}]}');
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

// ---------------------------------------------------------------------------
// R-SIM-123..126, R-SIM-128 (P-2026-10-04-1130): the style of the front panel
// ---------------------------------------------------------------------------

/** `encodeBoard(ALL)` on the base commit `b27138436`, before any style field existed: today's boards keep these bytes. */
const BASE_ALL = '{"v":1,"devices":[{"id":"d1","kind":"button","cell":[0,0],"label":"Coin","binding":{"kind":"event","event":"Ev_coin"}},{"id":"d2","kind":"switch","cell":[1,0],"label":"","binding":{"kind":"ivar","element":"M","attr":"power"}},{"id":"d3","kind":"switch","cell":[2,0],"label":"","binding":{"kind":"events","on":"Ev_on","off":"Ev_off"}},{"id":"d4","kind":"slider","cell":[3,0],"label":"","binding":{"kind":"ivar","element":"M","attr":"speed"}},{"id":"d5","kind":"keypad","cell":[0,1],"label":"","binding":{"kind":"keypadValue","element":"M","attr":"pin","enter":"Ev_enter","hideOut":false}},{"id":"d6","kind":"keypad","cell":[1,1],"label":"","binding":{"kind":"keypadEvents","keys":["Ev_0","","","","","","","","","Ev_9"]}},{"id":"d7","kind":"led","cell":[2,1],"label":"","binding":{"kind":"marked","place":"P_locked"}},{"id":"d8","kind":"led","cell":[3,1],"label":"","binding":{"kind":"expr","text":"model.[paid]"}},{"id":"d9","kind":"pulse","cell":[0,2],"label":"","binding":{"kind":"transition","transition":"T_tc"}},{"id":"d10","kind":"pulse","cell":[1,2],"label":"","binding":{"kind":"event","event":"Ev_coin"}},{"id":"d11","kind":"seven","cell":[2,2],"label":"","binding":{"kind":"expr","text":"model.[coins]"}},{"id":"d12","kind":"text","cell":[3,2],"label":"","binding":{"kind":"configuration"}},{"id":"d13","kind":"gauge","cell":[0,3],"label":"","binding":{"kind":"attr","element":"M","attr":"coins"}},{"id":"d14","kind":"led","cell":[1,3],"label":"","binding":null},{"id":"d15","kind":"clock","cell":[2,3],"label":"Timer","binding":{"kind":"event","event":"Ev_tick"},"period":2500}]}';

const board = (devices: unknown[], extra: Record<string, unknown> = {}) => JSON.stringify({ v: 1, devices, ...extra });
const raw = (id: string, kind: string, cell: [number, number], more: Record<string, unknown> = {}) => ({ id, kind, cell, label: '', binding: null, ...more });

describe('R-SIM-123: the style is optional, and today\'s boards keep their bytes', () => {
    it('every board saved today encodes byte for byte as on the base commit, with or without empty settings (mutant: a default written)', () => {
        expect(encodeBoard(ALL)).toBe(BASE_ALL);
        expect(encodeBoard(ALL, {})).toBe(BASE_ALL);
        expect(encodeBoard(decodeBoard(BASE_ALL).devices, decodeBoard(BASE_ALL).settings)).toBe(BASE_ALL);
        expect(decodeBoard(BASE_ALL).settings).toBeUndefined();
        expect(encodeBoard([])).toBe('{"v":1,"devices":[]}');
    });

    it('a default is never written, explicit or absent alike: theme graphite, 4 columns, span [1, 1], a key shape, both, M, round, green (mutant: explicit defaults kept)', () => {
        const explicit: BoardDevice[] = ALL.map(d => ({ ...d, span: [1, 1] as const }));
        explicit[0] = { ...explicit[0], style: { shape: 'key', iconMode: 'both' } };
        explicit[6] = { ...explicit[6], style: { shape: 'round', color: 'green' } };
        explicit[10] = { ...explicit[10], style: { size: 'M' } };
        expect(encodeBoard(explicit, { theme: 'graphite', cols: 4 })).toBe(BASE_ALL);
        const stored = board([raw('d1', 'button', [0, 0], { span: [1, 1], style: { shape: 'key', iconMode: 'both' } })], { theme: 'graphite', cols: 4 });
        const d = decodeBoard(stored);
        expect(d.defects).toEqual([]);
        expect(d.settings).toBeUndefined();
        expect('span' in d.devices[0] || 'style' in d.devices[0]).toBe(false);
    });

    it('the settings come after the devices, theme, accent, cols; span and style after the period; the style\'s fields in a fixed order (mutant: object spread order)', () => {
        const devices: BoardDevice[] = [
            { ...dev('d1', 'clock', [0, 0], { kind: 'event', event: 'E' }), period: 1000, span: [2, 1], style: { key: 't', icon: 'stopwatch', shape: 'round', iconMode: 'icon', role: 'accent' } },
            { ...dev('d2', 'text', [2, 0], { kind: 'configuration' }), span: [2, 2], style: { face: 'vfd', size: 'XL' } },
            { ...dev('d3', 'led', [0, 1], null), style: { color: 'amber', shape: 'bar' } },
        ];
        const s = encodeBoard(devices, { cols: 6, accent: '#E11D48', theme: 'appliance' });
        expect(s).toBe('{"v":1,"devices":['
            + '{"id":"d1","kind":"clock","cell":[0,0],"label":"","binding":{"kind":"event","event":"E"},"period":1000,"span":[2,1],"style":{"shape":"round","role":"accent","icon":"stopwatch","iconMode":"icon","key":"t"}},'
            + '{"id":"d2","kind":"text","cell":[2,0],"label":"","binding":{"kind":"configuration"},"span":[2,2],"style":{"size":"XL","face":"vfd"}},'
            + '{"id":"d3","kind":"led","cell":[0,1],"label":"","binding":null,"style":{"shape":"bar","color":"amber"}}'
            + '],"theme":"appliance","accent":"#e11d48","cols":6}');
        const back = decodeBoard(s);
        expect(back.defects).toEqual([]);
        expect(back.settings).toEqual({ theme: 'appliance', accent: '#e11d48', cols: 6 });
        expect(encodeBoard(back.devices, back.settings)).toBe(s);
    });

    it('round trip: every new field of every kind that takes it decodes to what was encoded (mutant: a field not read back)', () => {
        const devices: BoardDevice[] = [
            { ...dev('b1', 'button', [0, 0], { kind: 'event', event: 'E' }), style: { shape: 'membrane', role: 'go', icon: 'play-fill', iconMode: 'text', key: '5' } },
            { ...dev('b2', 'button', [1, 0], null), style: { shape: 'text', role: 'neutral', icon: 'none', key: 'none' } },
            { ...dev('s1', 'seven', [2, 0], { kind: 'expr', text: 'model.[t]' }), span: [4, 1], style: { size: 'S', face: 'plain' } },
            { ...dev('l1', 'pulse', [0, 1], null), style: { shape: 'square', color: 'violet' } },
            { ...dev('z1', 'buzzer', [1, 1], { kind: 'marked', place: 'P' }), span: [1, 2] },
            { ...dev('k1', 'silk', [2, 1], null, 'TIMER'), span: [4, 1] },
        ];
        const settings = { theme: 'instrument' as const, accent: '#0ea5e9', cols: 8 as const };
        const back = decodeBoard(encodeBoard(devices, settings));
        expect(back.defects).toEqual([]);
        expect(back.devices).toEqual(devices);
        expect(back.settings).toEqual(settings);
    });
});

describe('R-SIM-123: an unknown value of a style field drops that field with a defect, never the device', () => {
    it('board fields: an unknown theme, an accent that is not #rrggbb, columns other than 4, 6, 8 (mutant: the board dropped; mutant: the value kept)', () => {
        const d = decodeBoard(board([raw('d1', 'led', [0, 0])], { theme: 'neon', accent: 'red', cols: 5 }));
        expect(d.readable).toBe(true);
        expect(d.devices.map(x => x.id)).toEqual(['d1']);
        expect(d.settings).toBeUndefined();
        expect(d.defects.map(x => [x.index, x.code, x.field])).toEqual([[null, 'key', 'theme'], [null, 'key', 'accent'], [null, 'key', 'cols']]);
        expect(d.defects.map(x => x.message)).toEqual([
            'The theme \'neon\' is not one of graphite, appliance, instrument, print; the default is used.',
            'The accent \'red\' is not a colour #rrggbb; the theme\'s own is used.',
            'The columns \'5\' are not 4, 6 or 8; the board has 4.',
        ]);
        for (const accent of ['#12345', '#1234567', 'e11d48', '#e11d4g', 42]) {
            expect(decodeBoard(board([], { accent })).defects.map(x => x.field)).toEqual(['accent']);
        }
    });

    it('a span out of its domain is dropped and the device takes one cell (mutant: the device dropped)', () => {
        const bad: unknown[] = [[5, 1], [0, 1], [1, 3], [1.5, 1], [1], 'x', [1, 1, 1]];
        const d = decodeBoard(board(bad.map((span, i) => raw(`d${i}`, 'led', [0, i], { span }))));
        expect(d.devices.map(x => x.id)).toEqual(bad.map((_, i) => `d${i}`));
        expect(d.devices.every(x => !('span' in x))).toBe(true);
        expect(d.defects.map(x => [x.index, x.code, x.field])).toEqual(bad.map((_, i) => [i, 'device', 'span']));
        expect(d.defects[0].message).toBe('d0: the span is not [w, h] with w in 1..4 and h in 1..2; the device takes one cell.');
    });

    it('a style field on a kind that has no such field, or with an unknown value, is dropped alone; the other fields stay (mutant: the whole style dropped)', () => {
        const d = decodeBoard(board([
            raw('d1', 'button', [0, 0], { style: { shape: 'hexagon', role: 'go', size: 'L', key: 'AB' } }),
            raw('d2', 'led', [1, 0], { style: { color: 'pink', shape: 'bar' } }),
            raw('d3', 'text', [2, 0], { style: { size: 'XXL', face: 'lcd', icon: 'play' } }),
            raw('d4', 'switch', [3, 0], { style: { shape: 'key' } }),
            raw('d5', 'clock', [0, 1], { style: { icon: 'bi-play', iconMode: 'both' } }),
            raw('d6', 'button', [1, 1], { style: 'round' }),
        ]));
        expect(d.devices.map(x => [x.id, x.style])).toEqual([
            ['d1', { role: 'go' }], ['d2', { shape: 'bar' }], ['d3', { face: 'lcd' }], ['d4', undefined], ['d5', undefined], ['d6', undefined],
        ]);
        expect(d.defects.map(x => [x.index, x.field])).toEqual([
            [0, 'style.shape'], [0, 'style.key'], [0, 'style.size'], [1, 'style.color'], [2, 'style.icon'], [2, 'style.size'], [3, 'style.shape'], [4, 'style.icon'], [5, 'style'],
        ]);
        expect(d.defects.map(x => x.code).every(c => c === 'device')).toBe(true);
        expect(d.defects[0].message).toBe('d1: \'hexagon\' is not a value of the style \'shape\'.');
        expect(d.defects[2].message).toBe('d1: a button has no style \'size\'.');
        expect(d.defects[8].message).toBe('d6: the style is not an object; the device keeps the defaults.');
    });

    it('unknown style fields are ignored, as unknown fields are (R-SIM-68)', () => {
        const d = decodeBoard(board([raw('d1', 'button', [0, 0], { style: { glow: true, role: 'stop' } })]));
        expect(d.defects).toEqual([]);
        expect(d.devices[0].style).toEqual({ role: 'stop' });
    });

    it('two explicit equal keys: the second\'s key is a defect and dropped, the device kept (R-SIM-127; mutant: both kept)', () => {
        const d = decodeBoard(board([
            raw('d1', 'button', [0, 0], { style: { key: 'a' } }),
            raw('d2', 'clock', [1, 0], { style: { key: 'a', role: 'go' } }),
            raw('d3', 'button', [2, 0], { style: { key: 'none' } }),
            raw('d4', 'button', [3, 0], { style: { key: 'none' } }),
        ]));
        expect(d.devices.map(x => x.style)).toEqual([{ key: 'a' }, { role: 'go' }, { key: 'none' }, { key: 'none' }]);
        expect(d.defects.map(x => [x.index, x.field, x.message])).toEqual([[1, 'style.key', 'd2: the key \'a\' is taken by an earlier device.']]);
    });
});

describe('R-SIM-125: columns and spans, occupancy by covered cells', () => {
    it('the grid helpers: covered cells row by row, a span fits within the board\'s columns and eight rows (mutants: off by one at the edges)', () => {
        expect(coveredCells([1, 2], [2, 2])).toEqual([[1, 2], [2, 2], [1, 3], [2, 3]]);
        expect(coveredCells([0, 0], [1, 1])).toEqual([[0, 0]]);
        expect(fitsGrid([2, 0], [2, 1])).toBe(true);
        expect(fitsGrid([3, 0], [2, 1])).toBe(false);
        expect(fitsGrid([3, 0], [2, 1], 6)).toBe(true);
        expect(fitsGrid([0, 7], [1, 2])).toBe(false);
        expect(fitsGrid([0, 6], [1, 2])).toBe(true);
        expect([onGrid([3, 0]), onGrid([5, 0]), onGrid([5, 0], 6), onGrid([7, 7], 8), onGrid([8, 0], 8)]).toEqual([true, false, true, true, false]);
        expect([[1, 1], [4, 2], [4, 1]].map(isSpan)).toEqual([true, true, true]);
        expect([[0, 1], [5, 1], [1, 3], [1.5, 1], [1], '1,1', null].map(isSpan)).toEqual([false, false, false, false, false, false, false]);
    });

    it('a device covering a cell an earlier one covers is a defect and dropped, as the cell-taken defect (mutant: occupancy by anchor only)', () => {
        const d = decodeBoard(board([
            raw('d1', 'seven', [0, 0], { span: [2, 1] }),
            raw('d2', 'led', [1, 0]),
            raw('d3', 'led', [0, 1], { span: [1, 2] }),
            raw('d4', 'led', [3, 0], { span: [1, 2] }),
            raw('d5', 'led', [3, 1]),
        ]));
        expect(d.devices.map(x => x.id)).toEqual(['d1', 'd3', 'd4']);
        expect(d.defects.map(x => [x.index, x.code, x.message])).toEqual([
            [1, 'device', 'd2: the cell is taken by an earlier device.'],
            [4, 'device', 'd5: the cell is taken by an earlier device.'],
        ]);
        const later = decodeBoard(board([raw('d1', 'led', [1, 0]), raw('d2', 'seven', [0, 0], { span: [2, 1] })]));
        expect(later.devices.map(x => x.id)).toEqual(['d1']);
        expect(later.defects.map(x => x.message)).toEqual(['d2: a cell it covers is taken by an earlier device.']);
    });

    it('a span that leaves the grid drops its device; the board\'s columns decide where the grid ends (mutant: columns ignored)', () => {
        const devices = [raw('d1', 'seven', [3, 0], { span: [2, 1] }), raw('d2', 'led', [5, 7]), raw('d3', 'led', [0, 7], { span: [1, 2] })];
        const four = decodeBoard(board(devices));
        expect(four.devices.map(x => x.id)).toEqual([]);
        expect(four.defects.map(x => x.message)).toEqual(['d1: the span leaves the grid.', 'd2: the cell is off the grid.', 'd3: the span leaves the grid.']);
        const six = decodeBoard(board(devices, { cols: 6 }));
        expect(six.devices.map(x => x.id)).toEqual(['d1', 'd2']);
        expect(six.settings).toEqual({ cols: 6 });
    });
});

describe('R-SIM-124, R-SIM-126: the values and the kinds that take them', () => {
    it('four themes, three column counts, the accent a colour #rrggbb (mutant: a theme missing)', () => {
        expect(BOARD_THEMES).toEqual(['graphite', 'appliance', 'instrument', 'print']);
        expect(BOARD_COLS).toEqual([4, 6, 8]);
        expect(['#000000', '#E11D48', '#a1b2c3'].map(isAccent)).toEqual([true, true, true]);
        expect(['#fff', 'red', '', '#a1b2c3 ', null].map(isAccent)).toEqual([false, false, false, false, false]);
    });

    it('each style field is valid only on its kinds (R-SIM-126; mutant: size on a button, shape on a switch)', () => {
        expect(STYLE_FIELDS.button).toEqual(['shape', 'role', 'icon', 'iconMode', 'key']);
        expect(STYLE_FIELDS.clock).toEqual(STYLE_FIELDS.button);
        expect(STYLE_FIELDS.text).toEqual(['size', 'face']);
        expect(STYLE_FIELDS.seven).toEqual(['size', 'face']);
        expect(STYLE_FIELDS.led).toEqual(['shape', 'color']);
        expect(STYLE_FIELDS.pulse).toEqual(['shape', 'color']);
        for (const k of ['switch', 'slider', 'keypad', 'gauge', 'buzzer', 'silk'] as DeviceKind[]) expect(STYLE_FIELDS[k]).toEqual([]);
    });

    it('the values: shapes by kind, roles, icon names without bi-, icon modes, keys, sizes, faces, colours (mutants: an LED shape on a button; an uppercase key)', () => {
        const fits = (kind: DeviceKind, field: keyof DeviceStyle, values: unknown[]) => values.map(v => styleValueFits(kind, field, v));
        expect(fits('button', 'shape', ['key', 'membrane', 'round', 'text', 'square', 'bar'])).toEqual([true, true, true, true, false, false]);
        expect(fits('led', 'shape', ['round', 'square', 'bar', 'key', 'membrane'])).toEqual([true, true, true, false, false]);
        expect(fits('button', 'role', ['neutral', 'go', 'stop', 'accent', 'warn'])).toEqual([true, true, true, true, false]);
        expect(fits('clock', 'icon', ['play-fill', 'none', 'arrow-counterclockwise', '123', 'bi-play', 'Play', 'play_fill', '', '-x', 'x-'])).toEqual([true, true, true, true, false, false, false, false, false, false]);
        expect(fits('button', 'iconMode', ['both', 'icon', 'text', 'none'])).toEqual([true, true, true, false]);
        expect(fits('button', 'key', ['a', 'z', '0', '9', 'none', 'A', 'ab', '', ' ', 'é'])).toEqual([true, true, true, true, true, false, false, false, false, false]);
        expect(fits('text', 'size', ['S', 'M', 'L', 'XL', 's', 'XXL'])).toEqual([true, true, true, true, false, false]);
        expect(fits('seven', 'face', ['plain', 'lcd', 'vfd', 'oled'])).toEqual([true, true, true, false]);
        expect(fits('pulse', 'color', ['green', 'red', 'amber', 'blue', 'violet', 'pink'])).toEqual([true, true, true, true, true, false]);
        expect(fits('switch', 'shape', ['key'])).toEqual([false]);
    });

    it('canonicalStyle: the defaults and the invalid dropped, the fields in order, undefined when nothing is left (mutant: defaults kept)', () => {
        expect(canonicalStyle('button', { iconMode: 'both', shape: 'key' })).toBeUndefined();
        expect(canonicalStyle('button', { key: 'q', shape: 'round', size: 'L' } as DeviceStyle)).toEqual({ shape: 'round', key: 'q' });
        expect(Object.keys(canonicalStyle('button', { key: 'q', role: 'go', shape: 'round' })!)).toEqual(['shape', 'role', 'key']);
        expect(canonicalStyle('led', { shape: 'round', color: 'green' })).toBeUndefined();
        // P-2026-10-04-1131: a Pulse LED is amber when its colour is absent (today's look), so green is a choice it keeps.
        expect(canonicalStyle('pulse', { shape: 'round', color: 'amber' })).toBeUndefined();
        expect(canonicalStyle('pulse', { color: 'green' })).toEqual({ color: 'green' });
        expect(canonicalStyle('text', { size: 'M', face: 'lcd' })).toEqual({ face: 'lcd' });
        expect(canonicalStyle('gauge', { size: 'L' })).toBeUndefined();
        expect(canonicalStyle('button', undefined)).toBeUndefined();
    });
});

describe('R-SIM-128: the silkscreen and the buzzer', () => {
    it('a silkscreen takes no binding; a buzzer the LED\'s bindings; neither is an input (mutant: a buzzer accepting a transition)', () => {
        expect(BINDING_KINDS.silk).toEqual([]);
        expect(BINDING_KINDS.buzzer).toEqual(BINDING_KINDS.led);
        expect([isInputKind('silk'), isInputKind('buzzer')]).toEqual([false, false]);
        expect(bindingFits('buzzer', { kind: 'marked', place: 'P' })).toBe(true);
        expect(bindingFits('buzzer', { kind: 'transition', transition: 'T' })).toBe(false);
        expect(bindingFits('silk', { kind: 'expr', text: 'true' })).toBe(false);
    });

    it('a silkscreen stored with a binding keeps its label and loses the binding with a defect, as any misfit binding (mutant: device dropped)', () => {
        const d = decodeBoard(board([{ id: 'd1', kind: 'silk', cell: [0, 0], label: 'COOK', binding: { kind: 'expr', text: 'true' } }]));
        expect(d.devices).toEqual([dev('d1', 'silk', [0, 0], null, 'COOK')]);
        expect(d.defects.map(x => [x.index, x.code])).toEqual([[0, 'binding']]);
    });
});
