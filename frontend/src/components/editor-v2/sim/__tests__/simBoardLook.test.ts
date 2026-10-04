/**
 * simBoardLook — how each device of the I/O board is drawn from its style, and
 * what a shortcut key presses (P-2026-10-04-1131; R-SIM-130..133 over the record
 * of R-SIM-123..128).
 *
 * Executes the module: the resolved icon and role of a Button or a Clock
 * (explicit, suggested from the event's label, none), the icon mode, the keys of
 * the keyed devices in board order, the keydown the board answers (focus inside is
 * the card's, a field and a modifier are not), the device a key presses and what
 * it sends, the display's glyph box, the LED's shape and colour, the theme, the
 * accent and the floating window's rule. Each test name says which break of the
 * rule kills it; the mutation bench is in the commit message.
 */

import { describe, expect, it } from 'vitest';
import {
    KEYED_KINDS, boardAccent, boardFloats, boardKeys, boardTheme, canDock, displayGlyphFont, displayLook, ledLook, pressLook, shortcutAction,
    shortcutDevice, shortcutKey,
} from '../simBoardLook';
import type { DeviceFace } from '../simBoardFace';
import type { BoardDevice, DeviceKind, DeviceStyle } from '../../../../model/simulation/boardCodec';

const dev = (id: string, kind: DeviceKind, cell: [number, number] = [0, 0], style?: DeviceStyle, label = ''): BoardDevice => ({
    id, kind, cell, label, binding: kind === 'button' || kind === 'clock' ? { kind: 'event', event: 'e' } : null, ...(style ? { style } : {}),
});

describe('pressLook: the icon and the role of a Button or a Clock (R-SIM-131)', () => {
    it('no style: the icon and the role suggested by the event\'s label, with the rule (mutants: the device label read instead; no suggestion)', () => {
        const look = pressLook(dev('b', 'button', [0, 0], undefined, 'Big red'), 'startCooking');
        expect([look.icon, look.iconFrom, look.role, look.roleFrom, look.suggestion.rule]).toEqual(['play-fill', 'suggested', 'go', 'suggested', 'word «start»']);
        expect([look.shape, look.iconMode, look.showIcon, look.showText]).toEqual(['key', 'both', true, true]);
    });

    it('an explicit icon and role win over the suggestion (mutants: suggestion first; role from the icon)', () => {
        const look = pressLook(dev('b', 'button', [0, 0], { icon: 'bell', role: 'accent', shape: 'membrane' }), 'stop');
        expect([look.icon, look.iconFrom, look.role, look.roleFrom, look.shape]).toEqual(['bell', 'style', 'accent', 'style', 'membrane']);
        expect(look.suggestion.icon).toBe('stop-fill');
    });

    it('icon none hides it, the role still suggested; no match gives no icon and the neutral role (mutants: none read as absent; a fallback icon)', () => {
        const none = pressLook(dev('b', 'button', [0, 0], { icon: 'none' }), 'stop');
        expect([none.icon, none.iconFrom, none.showIcon, none.role, none.roleFrom]).toEqual([null, 'none', false, 'stop', 'suggested']);
        const miss = pressLook(dev('b', 'button'), 'push');
        expect([miss.icon, miss.iconFrom, miss.showIcon, miss.role, miss.roleFrom]).toEqual([null, 'no match', false, 'neutral', 'default']);
        const unbound = pressLook(dev('b', 'button'), null);
        expect([unbound.icon, unbound.iconFrom]).toEqual([null, 'no match']);
    });

    it('icon mode: icon hides the text only when an icon is shown; text hides the icon (mutants: icon mode ignored; text hidden with no icon to show)', () => {
        const icon = pressLook(dev('b', 'button', [0, 0], { iconMode: 'icon' }), 'start');
        expect([icon.showIcon, icon.showText]).toEqual([true, false]);
        const iconless = pressLook(dev('b', 'button', [0, 0], { iconMode: 'icon' }), 'push');
        expect([iconless.showIcon, iconless.showText]).toEqual([false, true]);
        const text = pressLook(dev('b', 'button', [0, 0], { iconMode: 'text' }), 'start');
        expect([text.icon, text.showIcon, text.showText]).toEqual(['play-fill', false, true]);
    });

    it('a Clock reads the same fields as a Button (mutant: the clock keeps the key shape)', () => {
        const look = pressLook(dev('c', 'clock', [0, 0], { shape: 'round' }), 'tick');
        expect([look.shape, look.icon, look.role]).toEqual(['round', 'stopwatch', 'neutral']);
    });
});

describe('boardKeys: one shortcut per Button, Switch and Clock, in board order (R-SIM-127, R-SIM-133)', () => {
    it('row first, then column, whatever the record\'s order; Slider, Keypad and outputs get none (mutants: record order; every kind keyed)', () => {
        const devices = [
            dev('c', 'button', [0, 1], undefined, 'cook'),
            dev('s', 'slider', [1, 0], undefined, 'speed'),
            dev('a', 'button', [2, 0], undefined, 'cancel'),
            dev('w', 'switch', [3, 0], undefined, 'cover'),
            dev('l', 'led', [0, 0], undefined, 'lamp'),
        ];
        const keys = boardKeys(devices, d => d.label);
        expect([...keys.entries()]).toEqual([['a', 'c'], ['w', 'o'], ['c', 'k']]);
        expect(KEYED_KINDS).toEqual(['button', 'switch', 'clock']);
    });

    it('an explicit key is reserved first, none gives none (mutants: explicit ignored; none suggested)', () => {
        const devices = [dev('a', 'button', [0, 0], undefined, 'start'), dev('b', 'button', [1, 0], { key: 's' }, 'stop'), dev('c', 'clock', [2, 0], { key: 'none' }, 'tick')];
        expect([...boardKeys(devices, d => d.label).entries()]).toEqual([['a', 't'], ['b', 's'], ['c', null]]);
    });
});

describe('shortcutKey: the keydown the board answers (R-SIM-133)', () => {
    const on = (over: object = {}) => ({ key: 's', target: { tagName: 'BUTTON' }, ...over });

    it('a letter or a digit, lower-cased, from a button or the card (mutants: upper case kept; digits refused)', () => {
        expect(shortcutKey(on())).toBe('s');
        expect(shortcutKey(on({ key: 'S' }))).toBe('s');
        expect(shortcutKey(on({ key: '7', target: { tagName: 'DIV' } }))).toBe('7');
        expect(shortcutKey(on({ target: null }))).toBe('s');
    });

    it('never inside an input field, a text area, a select or editable text (mutants: field check dropped; contenteditable missed)', () => {
        for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT', 'input']) expect(shortcutKey(on({ target: { tagName } }))).toBeNull();
        expect(shortcutKey(on({ target: { tagName: 'DIV', isContentEditable: true } }))).toBeNull();
    });

    it('a modifier, a repeat or a key that is not one character [a-z0-9] is not a shortcut (mutants: ctrl, meta or alt allowed; repeat fires)', () => {
        for (const m of ['ctrlKey', 'metaKey', 'altKey', 'repeat']) expect(shortcutKey(on({ [m]: true }))).toBeNull();
        for (const key of ['Enter', ' ', 'ArrowUp', 'é', '-']) expect(shortcutKey(on({ key }))).toBeNull();
    });
});

const face = (id: string, kind: DeviceKind, on: boolean, extra: Partial<DeviceFace> = {}): DeviceFace => ({ id, kind, name: id, caption: '', flag: null, title: '', on, ...extra });

describe('shortcutDevice and shortcutAction: a key presses its device as a click does (R-SIM-133)', () => {
    const keys = new Map<string, string | null>([['b', 's'], ['w', 'p'], ['c', 't'], ['x', null]]);

    it('the device holding the key, only while it is on (mutants: a disabled device fires; the first device whatever its key)', () => {
        expect(shortcutDevice('s', keys, () => true)).toBe('b');
        expect(shortcutDevice('p', keys, () => true)).toBe('w');
        expect(shortcutDevice('s', keys, id => id !== 'b')).toBeNull();
        expect(shortcutDevice('q', keys, () => true)).toBeNull();
    });

    it('a Button presses its event, a Switch flips or presses, a Clock switches on or off; an off device nothing (mutants: switch on two events flipped; clock pressed)', () => {
        expect(shortcutAction(face('b', 'button', true, { fires: 'start' }))).toEqual({ kind: 'press', event: 'start' });
        expect(shortcutAction(face('w', 'switch', true))).toEqual({ kind: 'flip' });
        expect(shortcutAction(face('w', 'switch', true, { fires: 'on' }))).toEqual({ kind: 'press', event: 'on' });
        expect(shortcutAction(face('c', 'clock', true, { fires: 'tick' }))).toEqual({ kind: 'clock' });
        expect(shortcutAction(face('b', 'button', false, { fires: 'start' }))).toBeNull();
        expect(shortcutAction(face('b', 'button', true))).toBeNull();
        expect(shortcutAction(face('s', 'slider', true))).toBeNull();
    });
});

describe('displayLook: the glyph box of a display does not depend on its value (R-SIM-131)', () => {
    it('size from the style, M by default; the face the theme\'s when absent (mutants: size ignored; graphite text not lcd)', () => {
        expect(displayLook(dev('t', 'text'), null, 'graphite')).toMatchObject({ size: 'M', face: 'lcd', glyphs: null });
        expect(displayLook(dev('n', 'seven'), null, 'graphite')).toMatchObject({ size: 'M', face: 'plain', glyphs: 4 });
        expect(displayLook(dev('t', 'text'), 5, 'appliance')).toMatchObject({ face: 'plain', glyphs: 5 });
        expect(displayLook(dev('t', 'text', [0, 0], { size: 'XL', face: 'vfd' }), 2, 'graphite')).toMatchObject({ size: 'XL', face: 'vfd', glyphs: 3 });
    });

    it('the font grows with the size and is fitted to the glyphs, never to the value (mutants: one font for every size; fit to the value)', () => {
        const px = (['S', 'M', 'L', 'XL'] as const).map(size => displayLook(dev('n', 'seven', [0, 0], { size }), 4, 'graphite').fontPx);
        expect(px).toEqual([...px].sort((a, b) => a - b));
        expect(new Set(px).size).toBe(4);
        const fitted = displayGlyphFont(displayLook(dev('n', 'seven'), 4, 'graphite'));
        expect(fitted).toMatch(/^min\(\d+px, calc\(\(100cqw - \d+px\) \/ [\d.]+\)\)$/);
        expect(displayGlyphFont(displayLook(dev('t', 'text'), null, 'graphite'))).toBe(`${displayLook(dev('t', 'text'), null, 'graphite').fontPx}px`);
    });
});

describe('ledLook: the shape and colour of a lamp (R-SIM-131)', () => {
    it('round by default; an LED green, a Pulse LED amber as today, an explicit colour wins (mutants: pulse green by default; colour ignored)', () => {
        expect(ledLook(dev('l', 'led'))).toEqual({ shape: 'round', color: 'green' });
        expect(ledLook(dev('p', 'pulse'))).toEqual({ shape: 'round', color: 'amber' });
        expect(ledLook(dev('p', 'pulse', [0, 0], { shape: 'bar', color: 'green' }))).toEqual({ shape: 'bar', color: 'green' });
        expect(ledLook(dev('l', 'led', [0, 0], { shape: 'square', color: 'violet' }))).toEqual({ shape: 'square', color: 'violet' });
    });
});

describe('theme, accent and the floating window (R-SIM-130, R-SIM-132)', () => {
    it('graphite without a theme; the accent only when set and never on Print (mutants: accent on print; theme default lost)', () => {
        expect(boardTheme(undefined)).toBe('graphite');
        expect(boardTheme({ theme: 'instrument' })).toBe('instrument');
        expect(boardAccent(undefined)).toBeNull();
        expect(boardAccent({ accent: '#ff8800' })).toBe('#ff8800');
        expect(boardAccent({ theme: 'print', accent: '#ff8800' })).toBeNull();
    });

    it('6 and 8 columns always float; 4 only by the viewer\'s choice; only 4 columns dock (mutants: 6 docks; the choice ignored)', () => {
        expect([boardFloats(4, false), boardFloats(4, true), boardFloats(6, false), boardFloats(8, false)]).toEqual([false, true, true, true]);
        expect([canDock(4), canDock(6), canDock(8)]).toEqual([true, false, false]);
    });
});
