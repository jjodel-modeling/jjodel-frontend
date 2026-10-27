/**
 * The I/O board's card, rendered (P-2026-10-04-1131; R-SIM-130..133 over the
 * record of R-SIM-123..128).
 *
 * The subject is `SimBoard` of simBoardDevices.tsx, rendered with
 * `renderToStaticMarkup` in node through `createElement`. The joiner barrel is
 * mocked: it pulls Monaco at import («window is not defined»), and the card reads
 * only `store.getState().idlookup` from it, here the turnstile of
 * simBoardFace.test.ts under Extended state machine, started by the bridge as the
 * panel starts it. Effects do not run under the server renderer, so the clocks,
 * the buzzer and the window's measure are out of this bench (simBoardSound.test.ts,
 * simViewerPrefs.test.ts and the lane probe hold them).
 *
 * The base markup (`fixtures/simBoardCard.base.html`) was rendered from this
 * file's fixture board at `ab7907ad9`, before this lane: a board without any of
 * the new fields renders as it did there, with the only additions R-SIM-133 asks
 * of every keyed input, its keycap and its `aria-keyshortcuts`, the card's
 * `tabindex` that lets a click on it take the focus its shortcuts need, and the
 * header's pop-out button of R-SIM-132 («or any board whose viewer chose it»). Each test
 * name says which break of the rule kills it; the bench is in the commit message.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const lookupRef = vi.hoisted(() => ({ current: {} as Record<string, any> }));
vi.mock('../../../../joiner', () => ({
    store: { getState: () => ({ idlookup: lookupRef.current }), subscribe: () => () => {}, dispatch: (a: unknown) => a },
    LPointerTargetable: { fromPointer: () => null },
}));

import { SimBoard } from '../simBoardDevices';
import type { SimBoardProps } from '../simBoardDevices';
import { inputAsks, inputLabel, inputReason, panelInputs, runStatus, startRun } from '../simBridge';
import type { ContextBuilder } from '../simBridge';
import { __resetSimRunsForTests, getSimRun, simReset } from '../simRunState';
import type { SimRun } from '../simRunState';
import { __resetSimViewerPrefsForTests, setSimViewerPrefs } from '../simViewerPrefs';
import type { BoardInputsView } from '../simBoardFace';
import { structuralInputs } from '../../../../model/simulation/netStep';

type Lookup = Record<string, any>;

const CLASSES: Lookup = {
    C_State: { className: 'DClass', name: 'State', extends: [] },
    C_Init: { className: 'DClass', name: 'Initial', extends: ['C_State'] },
    C_Final: { className: 'DClass', name: 'Terminal', extends: ['C_State'] },
    C_Event: { className: 'DClass', name: 'Event', extends: [] },
    C_Trans: { className: 'DClass', name: 'Transition', extends: [] },
    R_out: { className: 'DReference', name: 'transitions' },
    R_next: { className: 'DReference', name: 'nextState' },
    R_trigger: { className: 'DReference', name: 'event', type: 'C_Event' },
    A_label: { className: 'DAttribute', name: 'name' },
    A_guard: { className: 'DAttribute', name: 'guard' },
    A_effect: { className: 'DAttribute', name: 'effect' },
};

const ROLES = {
    simInitial: 'C_Init', simTerminal: 'C_Final', simOwnedTransitions: 'R_out', simNextState: 'R_next', simTrigger: 'R_trigger',
    simEventIdentifier: 'A_label', simGuard: 'A_guard', simAction: 'A_effect',
};

type Obj = { cls: string; slots?: Record<string, unknown[]> };

/** The ESM turnstile of the demo (§2.3), plus `stop` guarded by the two inputs. */
const OBJECTS: Record<string, Obj> = {
    locked: { cls: 'C_Init', slots: { R_out: ['tc', 'tp', 'ts'] } },
    unlocked: { cls: 'C_State', slots: { R_out: ['tu'] } },
    off: { cls: 'C_Final' },
    coin: { cls: 'C_Event', slots: { A_label: ['coin'] } },
    push: { cls: 'C_Event', slots: { A_label: ['push'] } },
    stop: { cls: 'C_Event', slots: { A_label: ['stop'] } },
    tc: { cls: 'C_Trans', slots: { R_next: ['locked'], R_trigger: ['coin'], A_effect: ['model.[coins] := model.[coins] + 1'] } },
    tp: { cls: 'C_Trans', slots: { R_next: ['unlocked'], R_trigger: ['push'], A_guard: ['model.[paid]'], A_effect: ['model.[coins] := 0'] } },
    tu: { cls: 'C_Trans', slots: { R_next: ['locked'], R_trigger: ['push'] } },
    ts: { cls: 'C_Trans', slots: { R_next: ['off'], R_trigger: ['stop'], A_guard: ['model.[power] and model.[speed] > 3'] } },
};

const GLOBALS = JSON.stringify({
    v: 1,
    attrs: [
        { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
        { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, equation: 'model.[coins] >= 2' },
        { name: 'power', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, input: true },
        { name: 'speed', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 9 }, input: true },
        { name: 'level', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 1, max: 5 }, initial: '2' },
    ],
});

function buildLookup(): Lookup {
    const lookup: Lookup = {};
    for (const [id, d] of Object.entries(CLASSES)) lookup[id] = { ...d, id };
    lookup.MM = { className: 'DModel', id: 'MM', name: 'DemoESM', _state: { ...ROLES, simProfile: 'extendedStateMachine' } };
    lookup.M = { className: 'DModel', id: 'M', name: 'demoESM', instanceof: 'MM', _state: { simStateAttributes: GLOBALS } };
    for (const [id, o] of Object.entries(OBJECTS)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            const vid = `v_${id}_${f}`;
            features.push(vid);
            lookup[vid] = { className: 'DValue', id: vid, instanceof: f, values: [...values], father: id };
        }
        lookup[id] = { className: 'DObject', id, instanceof: o.cls, father: 'M', name: id, features };
    }
    return lookup;
}

const build: ContextBuilder = () => {
    const h: Record<string, any> = {};
    for (const id of Object.keys(OBJECTS)) h[id] = { id, __type: 'Object', name: id };
    return { instances: Object.values(h), classes: [], ...h };
};

function runOf(lookup: Lookup): SimRun {
    const r = startRun(lookup, 'M', 'MM', 'P', build);
    if (r.kind !== 'started') throw new Error(r.reason);
    simReset('M', r.run);
    return getSimRun('M')!;
}

/** The panel's view of the live run (SimulationPanel.tsx `view`). */
function viewOf(run: SimRun | undefined, lookup: Lookup): BoardInputsView {
    if (!run) return { status: 'Not started', eventsOn: new Set(), noCandidate: new Map(), asks: new Map() };
    const status = runStatus(run);
    const inputs = panelInputs(status, structuralInputs(run.net, run.config.state));
    const noCandidate = new Map<string | null, string>();
    const asks = new Map<string | null, string>();
    if (status === 'Running') {
        for (const e of run.alphabet) {
            const why = inputReason(run, e, lookup, x => (x === null ? 'ε' : lookup[x].name), ['A_guard']);
            if (why) noCandidate.set(e, why.full);
            const read = inputAsks(run, e);
            if (read.length > 0) asks.set(e, read.map(a => inputLabel(a, run.net, lookup)).join(', '));
        }
    }
    return { status, eventsOn: inputs.events, noCandidate, asks };
}

/**
 * The fixture board of the base markup: every kind the base commit drew, each binding form, no field of R-SIM-123..
 * The Buttons and the Clock press `push`, a name the icon dictionary does not know, so no icon is suggested.
 */
const BASE_DEVICES = [
    { id: 'b1', kind: 'button', cell: [0, 0], label: '', binding: { kind: 'event', event: 'push' } },
    { id: 'b2', kind: 'button', cell: [1, 0], label: 'Go through', binding: { kind: 'event', event: 'push' } },
    { id: 'w1', kind: 'switch', cell: [2, 0], label: '', binding: { kind: 'ivar', element: 'M', attr: 'power' } },
    { id: 'w2', kind: 'switch', cell: [3, 0], label: 'Lever', binding: { kind: 'events', on: 'coin', off: 'push' } },
    { id: 's1', kind: 'slider', cell: [0, 1], label: '', binding: { kind: 'ivar', element: 'M', attr: 'speed' } },
    { id: 'k1', kind: 'keypad', cell: [1, 1], label: '', binding: { kind: 'keypadValue', element: 'M', attr: 'speed', enter: 'stop', hideOut: false } },
    { id: 'k2', kind: 'keypad', cell: [2, 1], label: 'Keys', binding: { kind: 'keypadEvents', keys: ['coin', 'push', '', '', '', '', '', '', '', ''] } },
    { id: 'c1', kind: 'clock', cell: [3, 1], label: 'Beat', binding: { kind: 'event', event: 'push' }, period: 500 },
    { id: 'l1', kind: 'led', cell: [0, 2], label: 'Locked', binding: { kind: 'marked', place: 'locked' } },
    { id: 'l2', kind: 'led', cell: [1, 2], label: '', binding: { kind: 'expr', text: 'model.[paid]' } },
    { id: 'p1', kind: 'pulse', cell: [2, 2], label: '', binding: { kind: 'event', event: 'coin' } },
    { id: 'n1', kind: 'seven', cell: [3, 2], label: 'Coins', binding: { kind: 'expr', text: 'model.[coins]' } },
    { id: 't1', kind: 'text', cell: [0, 3], label: '', binding: { kind: 'configuration' } },
    { id: 't2', kind: 'text', cell: [1, 3], label: 'Level', binding: { kind: 'expr', text: 'model.[level]' } },
    { id: 'g1', kind: 'gauge', cell: [2, 3], label: '', binding: { kind: 'attr', element: 'M', attr: 'coins' } },
    { id: 'x1', kind: 'button', cell: [3, 3], label: 'Gone', binding: { kind: 'event', event: 'nope' } },
];

const boardOf = (devices: readonly object[], settings: object = {}): string => JSON.stringify({ v: 1, devices, ...settings });

const noop = () => {};

function render(boardRaw: string | null, over: Partial<SimBoardProps> = {}): string {
    const run = getSimRun('M');
    return renderToStaticMarkup(createElement(SimBoard, {
        modelId: 'M', modelName: 'demoESM', configModelId: 'MM', boardRaw, inputs: viewOf(run, lookupRef.current),
        statusLine: run ? { line: 'step 0', title: 'step 0' } : null, contextKey: 'k', fire: noop, ask: noop, onClose: noop, ...over,
    }));
}

/** What R-SIM-133 adds to every keyed input and to the card, taken out to compare with the base markup. */
function withoutShortcuts(html: string): string {
    return html
        .replace(/<kbd class="sim-board-device__keycap"[^>]*>[^<]*<\/kbd>/g, '')
        .replace(/ aria-keyshortcuts="[^"]*"/g, '')
        .replace(/^(<div [^>]*?) tabindex="-1"/, '$1')
        .replace(/<button type="button" class="sim-board__window"[^>]*><i class="bi [^"]*"><\/i><\/button>/, '');
}

const BASE = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8').trimEnd();

beforeEach(() => {
    __resetSimRunsForTests();
    __resetSimViewerPrefsForTests();
    lookupRef.current = buildLookup();
});

describe('a board without the new fields renders as on the base commit (R-SIM-123: absent means today\'s look)', () => {
    it('Variant A, with a run at step 0: the markup of ab7907ad9, keycaps aside (mutants: Variant A reads the theme; a default icon replaces the glyph; spans drawn without a span)', () => {
        runOf(lookupRef.current);
        expect(withoutShortcuts(render(boardOf(BASE_DEVICES)))).toBe(BASE('simBoardCard.base.html'));
    });

    it('Variant A before Reset: the markup of ab7907ad9, keycaps aside (mutant: an off device loses its keycap rule)', () => {
        expect(withoutShortcuts(render(boardOf(BASE_DEVICES)))).toBe(BASE('simBoardCard.base-notstarted.html'));
    });
});

const dev = (id: string, kind: string, cell: [number, number], binding: object | null, extra: object = {}) => ({ id, kind, cell, label: '', binding, ...extra });
const press = (id: string, cell: [number, number], event: string, style?: object) => dev(id, 'button', cell, { kind: 'event', event }, style ? { style } : {});
const panel = () => setSimViewerPrefs('M', { boardSkin: 'panel' });
/** The opening tag of the element carrying `cls` among its classes. */
const tagOf = (html: string, cls: string): string => new RegExp(`<[a-z]+ [^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`).exec(html)?.[0] ?? '';

describe('themes: one class on the front panel, Variant B only (R-SIM-130)', () => {
    it('each theme its class, graphite without a theme field (mutants: the class on the card; graphite unnamed)', () => {
        runOf(lookupRef.current);
        panel();
        const devices = [press('b1', [0, 0], 'push')];
        expect(render(boardOf(devices))).toMatch(/class="sim-board__front sim-board__front--graphite"/);
        for (const theme of ['appliance', 'instrument', 'print']) {
            const html = render(boardOf(devices, { theme }));
            expect(html).toMatch(new RegExp(`class="sim-board__front sim-board__front--${theme}"`));
            expect(tagOf(html, 'sim-board')).not.toMatch(theme);
        }
    });

    it('Variant A ignores theme, accent, shape and role: no theme class, no press class (mutant: Variant A themed)', () => {
        runOf(lookupRef.current);
        const html = render(boardOf([press('b1', [0, 0], 'coin', { shape: 'round', role: 'accent' })], { theme: 'appliance', accent: '#ff8800' }));
        expect(html).not.toMatch(/appliance|sim-board-device__press|#ff8800/);
        expect(html).toMatch(/class="sim-board-device__button"/);
    });

    it('the accent colours an accent key, never on Print (mutants: accent on every role; accent on print)', () => {
        runOf(lookupRef.current);
        panel();
        const devices = [press('b1', [0, 0], 'push', { role: 'accent' }), press('b2', [1, 0], 'coin', { role: 'go' })];
        const html = render(boardOf(devices, { accent: '#ff8800' }));
        expect(tagOf(html, 'sim-board-device__press--accent')).toMatch(/style="background-color:#ff8800"/);
        expect(tagOf(html, 'sim-board-device__press--go')).not.toMatch(/style=/);
        expect(render(boardOf(devices, { theme: 'print', accent: '#ff8800' }))).not.toMatch(/#ff8800/);
    });
});

describe('shapes, roles and icons of a press (R-SIM-131)', () => {
    it('each shape its class on Variant B, key by default, with the resolved role (mutants: shape ignored; role not suggested)', () => {
        runOf(lookupRef.current);
        panel();
        const devices = [press('b1', [0, 0], 'push'), press('b2', [1, 0], 'push', { shape: 'membrane' }), press('b3', [2, 0], 'stop', { shape: 'round' }), press('b4', [3, 0], 'coin', { shape: 'text', role: 'go' })];
        const html = render(boardOf(devices));
        expect(tagOf(html, 'sim-board-device__press--key')).toMatch(/sim-board-device__press--neutral/);
        expect(tagOf(html, 'sim-board-device__press--membrane')).toMatch(/sim-board-device__press--neutral/);
        expect(tagOf(html, 'sim-board-device__press--round')).toMatch(/sim-board-device__press--stop/);
        expect(tagOf(html, 'sim-board-device__press--text')).toMatch(/sim-board-device__press--go/);
    });

    it('the suggested icon on both skins; explicit wins; none hides it; Variant A keeps its glyph when nothing matches (mutants: suggestion on one skin; none drawn)', () => {
        runOf(lookupRef.current);
        const devices = [press('b1', [0, 0], 'coin'), press('b2', [1, 0], 'stop', { icon: 'bell' }), press('b3', [2, 0], 'stop', { icon: 'none' }), press('b4', [3, 0], 'push')];
        const a = render(boardOf(devices));
        expect(a).toMatch(/<i class="bi bi-coin"><\/i><span>coin<\/span>/);
        expect(a).toMatch(/<i class="bi bi-bell"><\/i><span>stop<\/span>/);
        expect(a).toMatch(/aria-keyshortcuts="[A-Z0-9]"><span>stop<\/span>/);
        expect(a).toMatch(/<i class="bi bi-record-circle"><\/i><span>push<\/span>/);
        panel();
        const b = render(boardOf(devices));
        expect(b).toMatch(/<i class="bi bi-coin sim-board-device__press-icon"><\/i>/);
        expect(b).toMatch(/<i class="bi bi-bell sim-board-device__press-icon"><\/i>/);
        expect(b).not.toMatch(/bi-stop-fill|bi-record-circle/);
    });

    it('icon mode icon hides the text, kept as aria-label; round shows the icon only (mutants: text kept; no aria-label)', () => {
        runOf(lookupRef.current);
        const devices = [press('b1', [0, 0], 'coin', { iconMode: 'icon' }), press('b2', [1, 0], 'stop', { shape: 'round' })];
        const a = render(boardOf(devices));
        expect(a).toMatch(/aria-label="coin"[^>]*><i class="bi bi-coin"><\/i><\/button>/);
        panel();
        const b = render(boardOf(devices));
        expect(tagOf(b, 'sim-board-device__press--round')).toMatch(/aria-label="stop"/);
        expect(b).not.toMatch(/sim-board-device__press-text">stop</);
        expect(b).not.toMatch(/sim-board-device__press-text">coin</);
    });
});

describe('keycaps (R-SIM-133)', () => {
    it('each Button, Switch and Clock shows its key, in board order; a Slider none (mutants: keycap on every kind; record order)', () => {
        runOf(lookupRef.current);
        const devices = [
            press('b2', [1, 0], 'push'), { ...press('b1', [0, 0], 'coin'), label: 'Pay' },
            dev('w1', 'switch', [2, 0], { kind: 'ivar', element: 'M', attr: 'power' }),
            dev('s1', 'slider', [3, 0], { kind: 'ivar', element: 'M', attr: 'speed' }),
            dev('c1', 'clock', [0, 1], { kind: 'event', event: 'push' }, { period: 1000, style: { key: 'z' } }),
        ];
        const html = render(boardOf(devices));
        const caps = [...html.matchAll(/data-device="([a-z0-9]+)"[^>]*>(?:(?!data-device).)*?<kbd class="sim-board-device__keycap" aria-hidden="true">([a-z0-9])<\/kbd>/g)].map(m => [m[1], m[2]]);
        expect(caps).toEqual([['b1', 'p'], ['b2', 'u'], ['w1', 'o'], ['c1', 'z']]);
        expect(html).toMatch(/aria-keyshortcuts="U"/);
        expect(html).not.toMatch(/data-device="s1"[^]*?keycap[^]*?data-device="c1"/);
    });
});

describe('the new kinds (R-SIM-133 over R-SIM-128)', () => {
    it('a silkscreen is a caption with a rule on Variant B and left out of Variant A (mutants: drawn as a text display; listed with the outputs)', () => {
        runOf(lookupRef.current);
        const devices = [dev('k1', 'silk', [0, 0], null, { label: 'TIMER', span: [4, 1] }), press('b1', [0, 1], 'push')];
        expect(render(boardOf(devices))).not.toMatch(/TIMER|sim-board-device--silk/);
        panel();
        const b = render(boardOf(devices));
        expect(b).toMatch(/<span class="sim-board-device__silk"><span class="sim-board-device__silk-text">TIMER<\/span><span class="sim-board-device__silk-rule" aria-hidden="true"><\/span><\/span>/);
        expect(b).toMatch(/class="sim-board__slot" style="grid-column:1 \/ span 4;grid-row:1"/);
    });

    it('a buzzer is a lamp with a bell; the header\'s sound toggle only with a buzzer, off by default (mutants: toggle on every board; sound on by default)', () => {
        runOf(lookupRef.current);
        const buzzer = dev('z1', 'buzzer', [0, 0], { kind: 'marked', place: 'locked' }, { label: 'Ding' });
        expect(render(boardOf([press('b1', [0, 0], 'push')]))).not.toMatch(/sim-board__sound/);
        const html = render(boardOf([buzzer]));
        expect(tagOf(html, 'sim-board__sound')).toMatch(/aria-pressed="false"/);
        expect(html).toMatch(/bi-bell/);
        expect(html).toMatch(/sim-board-device__lamp sim-board-device__lamp--buzzer sim-board-device__lamp--lit/);
        setSimViewerPrefs('M', { boardSound: true });
        expect(tagOf(render(boardOf([buzzer])), 'sim-board__sound')).toMatch(/aria-pressed="true"/);
    });
});

describe('columns, spans and the floating window (R-SIM-132)', () => {
    it('4 columns docked with a pop-out button; 6 and 8 float, the dock refused (mutants: 6 docked; the dock enabled)', () => {
        runOf(lookupRef.current);
        const devices = [press('b1', [0, 0], 'push')];
        const four = render(boardOf(devices));
        expect(tagOf(four, 'sim-board')).not.toMatch(/floating/);
        expect(tagOf(four, 'sim-board__window')).toMatch(/aria-label="Pop out"/);
        for (const cols of [6, 8]) {
            const html = render(boardOf(devices, { cols }));
            expect(tagOf(html, 'sim-board')).toMatch(new RegExp(`sim-board--floating sim-board--cols-${cols}`));
            expect(tagOf(html, 'sim-board__window')).toMatch(/aria-label="Dock"[^>]*disabled=""|disabled=""[^>]*aria-label="Dock"/);
        }
    });

    it('a 4-column board floats when the viewer chose it, and docks again (mutant: the pref ignored)', () => {
        runOf(lookupRef.current);
        setSimViewerPrefs('M', { boardFloating: true, boardWindow: { x: 700, y: 90 } });
        const html = render(boardOf([press('b1', [0, 0], 'push')]));
        expect(tagOf(html, 'sim-board')).toMatch(/sim-board--floating/);
        expect(tagOf(html, 'sim-board')).toMatch(/style="left:700px;top:90px"/);
        expect(tagOf(html, 'sim-board__window')).toMatch(/aria-label="Dock"/);
        expect(tagOf(html, 'sim-board__window')).not.toMatch(/disabled/);
    });

    it('Variant A spans its devices over the columns of a wider grid (mutants: span dropped; four columns kept)', () => {
        runOf(lookupRef.current);
        const html = render(boardOf([dev('n1', 'seven', [0, 0], { kind: 'expr', text: 'model.[coins]' }, { span: [3, 2] })], { cols: 6 }));
        expect(html).toMatch(/class="sim-board__grid sim-board__grid--cols-6"/);
        expect(tagOf(html, 'sim-board-device--seven')).toMatch(/style="grid-column:span 3;grid-row:span 2"/);
    });
});

describe('displays and lamps on Variant B (R-SIM-131)', () => {
    it('a display carries its size and face classes, a glyph font and a box that do not read the value (mutants: size ignored; font from the value; box from the value)', () => {
        runOf(lookupRef.current);
        panel();
        const devices = [
            dev('n1', 'seven', [0, 0], { kind: 'expr', text: 'model.[coins]' }, { style: { size: 'L' } }),
            dev('t1', 'text', [1, 0], { kind: 'expr', text: 'model.[level]' }, { style: { size: 'XL', face: 'vfd' } }),
        ];
        const html = render(boardOf(devices));
        const seven = tagOf(html, 'sim-board-device__digits');
        expect(seven).toMatch(/sim-board-device__digits--plain sim-board-device__digits--l"/);
        expect(seven).toMatch(/style="font-size:min\(\d+px, calc\(\(100cqw - \d+px\) \/ [\d.]+\)\);width:calc\(\d+ch \+ [\d.]+em\)"/);
        // coins is 0..3: one glyph, three for Err; the box is three glyphs wide while the value shown is one.
        expect(seven).toMatch(/width:calc\(3ch \+ 0\.24em\)"/);
        expect(tagOf(html, 'sim-board-device__lcd')).toMatch(/sim-board-device__lcd--vfd sim-board-device__lcd--xl sim-board-device__lcd--fit"/);
    });

    it('a lamp carries its shape and colour; a pulse amber by default (mutants: colour ignored; pulse green)', () => {
        runOf(lookupRef.current);
        panel();
        const devices = [
            dev('l1', 'led', [0, 0], { kind: 'marked', place: 'locked' }, { style: { shape: 'bar', color: 'red' } }),
            dev('p1', 'pulse', [1, 0], { kind: 'event', event: 'coin' }),
        ];
        const html = render(boardOf(devices));
        expect(html).toMatch(/class="sim-board-device__lamp sim-board-device__lamp--bar sim-board-device__lamp--red sim-board-device__lamp--lit"/);
        expect(html).toMatch(/class="sim-board-device__lamp sim-board-device__lamp--pulse sim-board-device__lamp--round sim-board-device__lamp--amber"/);
    });
});
