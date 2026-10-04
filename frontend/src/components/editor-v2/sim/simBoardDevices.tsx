/**
 * simBoardDevices — the I/O board of the M1 face and its nine device faces
 * (R-SIM-110..115, R-SIM-119; P-2026-10-03-2000, Lane 2 of
 * docs/discovery/discovery_2026-10-03_sim_io_board.md §8).
 *
 * The card, `SimBoard`, lives here and not in a `SimBoard.tsx` of its own: beside
 * Lane 1's `simBoard.ts` that name differs only in case and extension, so on a
 * case-insensitive disk `./SimBoard` resolves to `simBoard.ts` (tsc TS1149, and
 * Vite's resolver tries `.ts` before `.tsx`). Its sheet is `SimBoard.scss`.
 *
 * The card is the machine's environment, not a view (R-SIM-110): the devices of
 * the model's `ioBoard` record (boardCodec.ts), inputs pressing the run's events
 * and answering its inputs, outputs reading σ. A floating card mounted by
 * SimulationPanel in the run inspector's slot, 584/400 (report §1, H1): one of
 * the two is open at a time, and closing the last one returns to live
 * (R-SIM-119). Two skins of the same record (R-SIM-114), a viewer preference
 * (simViewerPrefs.ts `boardSkin`):
 * - Variant A, `'board'`, the working surface: outputs above, inputs below, each
 *   group in its devices' cell order, the binding caption under every device,
 *   flat tiles in the design system's vocabulary;
 * - Variant B, `'panel'`, the front panel: every device at its cell of the grid,
 *   drawn as hardware, «Show bindings» (`showBindings`) outlining each device and
 *   naming its binding.
 * The foot carries the status block and, while a past step is viewed, the step
 * and «Back to live» (R-SIM-106, R-SIM-113). «Edit…» opens the board editor
 * (SimBoardEditor.tsx, Lane 1).
 *
 * Each face draws a `DeviceFace` (simBoardFace.ts) and nothing else: what is lit,
 * the value, `Err`, on or off and the title are decided there, so both skins say
 * the same: inputs from the panel's view of the live run (`inputs`), outputs from
 * the configuration of the step shown. A press goes through the panel's `fire`, as
 * its own buttons do, so the list, the input dialog and «Last step» are the
 * panel's; the inputs a press asks are answered by the values the board holds, the
 * rest by the dialog with the given carried (`ask`, R-SIM-120). The held values, a
 * Switch's position, a Slider's value and a keypad's buffer, are the card's state:
 * never a step, never persisted; a buffer is cleared by Reset and Stop.
 *
 * The card reads the run-state singleton on the `'mark'` version, which a view, a
 * commit, Reset and Stop bump, and is re-rendered by the panel after every press;
 * the skin on the prefs channel. It writes nothing but the view and the viewer
 * preferences; the board record only through the editor's Apply.
 *
 * The card owns the board's clocks (R-SIM-122, simBoardClock.ts): switched on and
 * off on their faces, view state never written anywhere. A tick is the Button's
 * press of the clock's event, held values included, through the panel's
 * `clockFire`, which leaves Play running; while the panel's input dialog or choice
 * list waits (`waiting`) a tick is dropped. Every change of the run makes the card
 * check its clocks, so Reset, Stop, the interruption and the end of the run switch
 * them off at once; an edit of the board switches them all off; the card's unmount
 * clears their timers.
 *
 * The styles of the front panel (R-SIM-130..133, P-2026-10-04-1131) are drawn from
 * the record's optional fields through simBoardLook.ts:
 * - Variant B carries the board's theme as one class on the front panel's root,
 *   closed palettes in SimBoard.scss that read no app token (D-UI-16); a Button
 *   and a Clock follow their shape and resolved role, the Accent role the board's
 *   accent (never on Print); a display its size and face, its glyph box fitted to
 *   the longest value its binding can produce so the box never moves; a lamp its
 *   shape and colour; a silkscreen is a caption with a rule across its span.
 * - Both skins draw the resolved icon of a Button and a Clock (Variant A keeps its
 *   glyph when nothing is resolved), the icon mode, the columns and the spans;
 *   Variant A ignores the rest and leaves the silkscreens out, it binds nothing.
 * - Every Button, Switch and Clock shows its key as a keycap; a keydown with the
 *   focus in the card, not in a field, presses the device as its click does
 *   (`shortcutKey`, `shortcutDevice`, `shortcutAction`).
 * - A Buzzer sounds on the rising edge of its boolean (simBoardSound.ts), muted
 *   by default, the toggle in the header only on a board that has one.
 * - A board of 6 or 8 columns, or of 4 whose viewer chose it, floats over the
 *   canvas as a window: dragged by its header, clamped to the canvas, docked again
 *   when it fits; its place and the choice are viewer preferences
 *   (simViewerPrefs.ts), the foot the card's own.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactElement } from 'react';
import { store } from '../../../joiner';
import { BOARD_ROWS, CLOCK_PERIOD_DEFAULT, boardCols, decodeBoard, isInputKind, spanOf } from '../../../model/simulation/boardCodec';
import type { BoardDevice as BoardDeviceRecord } from '../../../model/simulation/boardCodec';
import type { InputRead } from '../../../model/simulation/netTypes';
import { getSimRun, getSimView, simSetView, useSimVersion } from './simRunState';
import { BOARD_SLOT_LEFT, clampBoardWindow, getSimViewerPrefs, setSimViewerPrefs, useSimViewerPrefsVersion } from './simViewerPrefs';
import type { SimBoardSkin, SimBoardWindow, SimRect } from './simViewerPrefs';
import { boardContextOf, boardContextOfRun, clockPeriodText, keypadEnterValue, keypadPress, maxDisplayLength } from './simBoard';
import type { BoardContext } from './simBoard';
import { createClocks } from './simBoardClock';
import type { Clocks } from './simBoardClock';
import { boardFaces, heldInputs, NO_HELD, planPress } from './simBoardFace';
import type { BoardHeld, BoardInputsView, DeviceFace, KeyFace } from './simBoardFace';
import {
    boardAccent, boardFloats, boardKeys, boardTheme, canDock, displayGlyphFont, displayLook, ledLook, pressLook, shortcutAction, shortcutDevice, shortcutKey,
} from './simBoardLook';
import type { DisplayLook, LedLook, PressLook } from './simBoardLook';
import { createBuzzer } from './simBoardSound';
import type { Buzzer, ToneContext } from './simBoardSound';
import type { InputValue } from './simBridge';
import { SimBoardEditor } from './SimBoardEditor';
import './SimBoard.scss';

/** What an input device sends; the card answers each (`SimBoard`, below). */
export interface DeviceActions {
    /** A press of `event` from device `id`. */
    press: (id: string, event: string) => void;
    /** Switch on an IVAR: the position flips; no step. */
    flip: (id: string) => void;
    /** Slider: the value held; no step. */
    slide: (id: string, value: number) => void;
    /** Value keypad: a digit, `C` or `↵`. */
    key: (id: string, key: string) => void;
    /** Clock: switched on, or off (R-SIM-122); no step. */
    clock?: (id: string) => void;
}

/** How a device is drawn beyond its face (R-SIM-130..133, simBoardLook.ts); every field absent draws it as before styles. */
export interface DeviceLook {
    /** Button, Clock: shape, role, icon and icon mode. */
    readonly press?: PressLook;
    /** Button, Switch, Clock: the shortcut, `null` for none. */
    readonly key?: string | null;
    /** Text display, 7-segment, on Variant B. */
    readonly display?: DisplayLook;
    /** LED, Pulse LED, on Variant B. */
    readonly led?: LedLook;
    /** The colour of the Accent role on Variant B; absent or `null`, the theme's. */
    readonly accent?: string | null;
    /** Variant A: the columns and rows it spans in its group. */
    readonly span?: readonly [number, number];
}

export interface BoardDeviceProps {
    face: DeviceFace;
    skin: SimBoardSkin;
    /** The caption under the device: always in Variant A, with «Show bindings» in Variant B. */
    caption: boolean;
    actions: DeviceActions;
    look?: DeviceLook;
}

/** The key as `aria-keyshortcuts` names it, last among a control's attributes. */
const keyshortcuts = (look: DeviceLook | undefined): { 'aria-keyshortcuts'?: string } =>
    (look?.key ? { 'aria-keyshortcuts': look.key.toUpperCase() } : {});

/** The Accent role's colour, inline because it is the board's own value; a text press takes it as its ink. */
function accentStyle(p: PressLook | undefined, look: DeviceLook | undefined, ink: boolean): CSSProperties | undefined {
    if (p?.role !== 'accent' || !look?.accent) return undefined;
    return ink ? { color: look.accent } : { backgroundColor: look.accent };
}

/** The glyph of Variant A's Button, Bootstrap Icons (the editor's palette, SimBoardEditor.tsx). */
const BUTTON_ICON = 'bi-record-circle';

/**
 * Variant A: the panel's event button, its icon the resolved one, else its glyph unless the icon is `none` or the mode
 * `text`. Variant B: a press of its shape and role, the icon and the text as the icon mode says, a round press showing
 * its icon only, the text as title and aria-label (R-SIM-131).
 */
function ButtonFace({ face, skin, actions, look }: BoardDeviceProps): ReactElement {
    const p = look?.press;
    const flagged = face.flag !== null;
    const click = () => face.fires && actions.press(face.id, face.fires);
    if (skin === 'board') {
        const glyph = flagged ? 'bi-exclamation-triangle sim-board-device__flag'
            : p?.showIcon ? `bi-${p.icon}` : !p || (p.iconFrom === 'no match' && p.iconMode !== 'text') ? BUTTON_ICON : null;
        const text = !(p?.iconMode === 'icon' && glyph !== null);
        return (
            <button
                type="button"
                className="sim-board-device__button"
                title={face.title}
                disabled={!face.on}
                onClick={click}
                aria-label={text ? undefined : face.name}
                {...keyshortcuts(look)}
            >
                {glyph !== null && <i className={`bi ${glyph}`} />}{text && <span>{face.name}</span>}
            </button>
        );
    }
    const shape = p?.shape ?? 'key';
    const icon = flagged ? 'bi-exclamation-triangle sim-board-device__flag' : p?.showIcon ? `bi-${p.icon}` : null;
    const text = shape !== 'round' && (p?.showText ?? true);
    return (
        <button
            type="button"
            className={`sim-board-device__press sim-board-device__press--${shape} sim-board-device__press--${p?.role ?? 'neutral'}`}
            title={face.title}
            disabled={!face.on}
            onClick={click}
            style={accentStyle(p, look, shape === 'text')}
            aria-label={text ? undefined : face.name}
            {...keyshortcuts(look)}
        >
            {icon !== null && <i className={`bi ${icon} sim-board-device__press-icon`} />}
            {text && <span className="sim-board-device__press-text">{face.name}</span>}
        </button>
    );
}

function SwitchFace({ face, skin, actions, look }: BoardDeviceProps): ReactElement {
    const position = face.held === true;
    const onTwoEvents = face.fires !== undefined;
    return (
        <button
            type="button"
            role="switch"
            aria-checked={position}
            aria-label={face.name}
            className={skin === 'board' ? `jjodel-switch${position ? ' checked' : ''}` : `sim-board-device__lever${position ? ' sim-board-device__lever--up' : ''}`}
            title={face.title}
            disabled={!face.on}
            onClick={() => (onTwoEvents ? face.fires && actions.press(face.id, face.fires) : actions.flip(face.id))}
            {...keyshortcuts(look)}
        >
            {skin === 'panel' && <span className="sim-board-device__lever-knob" />}
        </button>
    );
}

function SliderFace({ face, actions }: BoardDeviceProps): ReactElement {
    const range = face.range ?? { min: 0, max: 0 };
    const value = typeof face.held === 'number' ? face.held : range.min;
    return (
        <span className="sim-board-device__slider" title={face.title}>
            <input
                type="range"
                aria-label={face.name}
                min={range.min}
                max={range.max}
                step={1}
                value={value}
                disabled={!face.on}
                onChange={e => actions.slide(face.id, Number(e.target.value))}
            />
            <span className="sim-board-device__readout">{face.on ? String(value) : '—'}</span>
        </span>
    );
}

/** The value keypad's layout: three rows of digits, then Clear, 0, Enter; the events keypad has no Clear and no Enter. */
const VALUE_LAYOUT = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '↵'];
const EVENTS_LAYOUT = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];

function KeypadFace({ face, actions }: BoardDeviceProps): ReactElement {
    const keys = new Map<string, KeyFace>((face.keys ?? []).map(k => [k.key, k]));
    const layout = face.mode === 'events' ? EVENTS_LAYOUT : VALUE_LAYOUT;
    return (
        <span className="sim-board-device__keypad">
            {face.mode === 'value' && <span className="sim-board-device__buffer">{face.buffer || '—'}</span>}
            <span className="sim-board-device__keys">
                {layout.map((key, i) => {
                    const k = keys.get(key);
                    if (!k || k.hidden) return <span className="sim-board-device__key sim-board-device__key--blank" key={`${key}${i}`} />;
                    return (
                        <button
                            type="button"
                            key={key}
                            className={`sim-board-device__key${key === '↵' ? ' sim-board-device__key--enter' : ''}`}
                            title={k.title}
                            aria-label={key === '↵' ? 'Enter' : key === 'C' ? 'Clear' : `Key ${key}`}
                            disabled={!k.on}
                            onClick={() => (k.event ? actions.press(face.id, k.event) : actions.key(face.id, key))}
                        >
                            {key}
                        </button>
                    );
                })}
            </span>
        </span>
    );
}

/**
 * The Clock (R-SIM-122): an on/off switch, its period and the ticks since it was switched on; the dropped ticks and
 * why it is off are in its title. Variant A a flat toggle in the panel's vocabulary; Variant B a power key with its
 * lamp, which blinks at every tick, and a counter behind glass.
 */
function ClockFace({ face, skin, actions, look }: BoardDeviceProps): ReactElement {
    const ticking = face.ticking === true;
    const flagged = face.flag !== null;
    const period = clockPeriodText(face.period ?? CLOCK_PERIOD_DEFAULT);
    const p = look?.press;
    // Off, the resolved icon, else the stopwatch unless the icon is `none` or the mode `text` (R-SIM-131); on, the pause.
    const idle = p?.showIcon ? `bi-${p.icon}` : !p || (p.iconFrom === 'no match' && p.iconMode !== 'text') ? 'bi-stopwatch' : null;
    const glyph = flagged ? 'bi-exclamation-triangle sim-board-device__flag' : ticking ? 'bi-pause-fill' : idle;
    const power = p ? `sim-board-device__clock-power sim-board-device__clock-power--${p.shape} sim-board-device__clock-power--${p.role}` : 'sim-board-device__clock-power';
    return (
        <span className={`sim-board-device__clock${ticking ? ' sim-board-device__clock--on' : ''}`}>
            <button
                type="button"
                role="switch"
                aria-checked={ticking}
                aria-label={face.name}
                className={skin === 'board' ? 'sim-board-device__clock-toggle' : power}
                title={face.title}
                disabled={!face.on}
                onClick={() => actions.clock?.(face.id)}
                style={skin === 'panel' ? accentStyle(p, look, p?.shape === 'text') : undefined}
                {...keyshortcuts(look)}
            >
                {skin === 'board'
                    ? <>{glyph !== null && <i className={`bi ${glyph}`} />}<span>{ticking ? 'On' : 'Off'}</span></>
                    : <><span key={face.ticks ?? 0} className="sim-board-device__clock-lamp" />{p?.showIcon && <i className={`bi bi-${p.icon} sim-board-device__clock-icon`} />}</>}
            </button>
            <span className="sim-board-device__clock-read">
                <span className="sim-board-device__clock-ticks" aria-label="Ticks since on">{String(face.ticks ?? 0)}</span>
                <span className="sim-board-device__clock-period">{period}</span>
            </span>
        </span>
    );
}

/** LED and Pulse LED; on Variant B with the shape and the colour of its style (R-SIM-131). The Buzzer is a bar lamp with its bell. */
function LampFace({ face, skin, look }: BoardDeviceProps): ReactElement {
    const led = skin === 'panel' && look?.led ? ` sim-board-device__lamp--${look.led.shape} sim-board-device__lamp--${look.led.color}` : '';
    const lamp = `sim-board-device__lamp${face.kind === 'pulse' ? ' sim-board-device__lamp--pulse' : ''}${face.kind === 'buzzer' ? ' sim-board-device__lamp--buzzer' : ''}${led}`
        + `${face.lit ? ' sim-board-device__lamp--lit' : ''}${face.err ? ' sim-board-device__lamp--err' : ''}`;
    return (
        <span className="sim-board-device__lamp-row">
            {face.kind === 'buzzer' && <i className={`bi ${face.lit ? 'bi-bell-fill' : 'bi-bell'} sim-board-device__bell`} aria-hidden="true" />}
            <span className={lamp} role="img" aria-label={`${face.name}: ${face.err ? 'Err' : face.lit ? 'lit' : 'dark'}`} />
            {face.err && <span className="sim-board-device__err">Err</span>}
        </span>
    );
}

/** The classes and the inline font of a display on Variant B: its face and size, its glyph box (R-SIM-131). */
function displayDress(base: string, d: DisplayLook): { cls: string; style: CSSProperties } {
    return { cls: ` ${base}--${d.face} ${base}--${d.size.toLowerCase()}`, style: { fontSize: displayGlyphFont(d) } };
}

function SevenFace({ face, skin, look }: BoardDeviceProps): ReactElement {
    const d = skin === 'panel' ? look?.display : undefined;
    const dress = d ? displayDress('sim-board-device__digits', d) : null;
    // A fixed box: as wide as its glyphs, whatever the value (R-SIM-131); the dashes of an off display fill it.
    const glyphs = d?.glyphs ?? 4;
    const style = dress ? { ...dress.style, width: `calc(${glyphs}ch + ${Math.round(glyphs * 8) / 100}em)` } : undefined;
    return (
        <span className={`sim-board-device__digits${dress?.cls ?? ''}${face.err ? ' sim-board-device__digits--err' : ''}${face.on ? '' : ' sim-board-device__digits--off'}`} style={style}>
            {face.on ? face.text : d ? '-'.repeat(glyphs) : '----'}
        </span>
    );
}

function TextFace({ face, skin, look }: BoardDeviceProps): ReactElement {
    const d = skin === 'panel' ? look?.display : undefined;
    const dress = d ? displayDress('sim-board-device__lcd', d) : null;
    return (
        <span
            className={`sim-board-device__lcd${dress?.cls ?? ''}${d && d.glyphs !== null ? ' sim-board-device__lcd--fit' : ''}${face.err ? ' sim-board-device__lcd--err' : ''}${face.on ? '' : ' sim-board-device__lcd--off'}`}
            style={dress?.style}
        >
            {face.on ? face.text : ''}
        </span>
    );
}

/** The silkscreen (R-SIM-128, R-SIM-133): its caption and a rule across its span, in the theme's ink. */
function SilkFace({ face }: BoardDeviceProps): ReactElement {
    return (
        <span className="sim-board-device__silk">
            <span className="sim-board-device__silk-text">{face.text ?? ''}</span>
            <span className="sim-board-device__silk-rule" aria-hidden="true" />
        </span>
    );
}

/** The gauge: a bar on Variant A, a dial on Variant B; the needle from the minimum. */
function GaugeFace({ face, skin }: BoardDeviceProps): ReactElement {
    const fill = face.on ? face.fill ?? 0 : 0;
    if (skin === 'panel') {
        // A half dial, 180° from the left: the needle's end on the arc of radius 30 around (36, 36).
        const angle = Math.PI * (1 - fill);
        const x = 36 + 30 * Math.cos(angle);
        const y = 36 - 30 * Math.sin(angle);
        return (
            <span className={`sim-board-device__dial${face.err ? ' sim-board-device__dial--err' : ''}`}>
                <svg viewBox="0 0 72 40" width="72" height="40" aria-hidden="true">
                    <path className="sim-board-device__dial-arc" d="M 6 36 A 30 30 0 0 1 66 36" />
                    {face.on && <line className="sim-board-device__dial-needle" x1="36" y1="36" x2={x.toFixed(2)} y2={y.toFixed(2)} />}
                </svg>
                <span className="sim-board-device__readout">{face.on ? face.text : '—'}</span>
            </span>
        );
    }
    return (
        <span className="sim-board-device__gauge">
            <span className={`sim-board-device__bar${face.err ? ' sim-board-device__bar--err' : ''}`} aria-hidden="true">
                <span className="sim-board-device__bar-fill" style={{ width: `${Math.round(fill * 100)}%` }} />
            </span>
            <span className="sim-board-device__readout">{face.on ? face.text : '—'}</span>
        </span>
    );
}

const FACES: Readonly<Record<DeviceFace['kind'], (p: BoardDeviceProps) => ReactElement>> = {
    button: ButtonFace, switch: SwitchFace, slider: SliderFace, keypad: KeypadFace, clock: ClockFace,
    led: LampFace, pulse: LampFace, seven: SevenFace, text: TextFace, gauge: GaugeFace,
    buzzer: LampFace,
    silk: SilkFace,
};

/**
 * One device on the board: its face, its name, the caption of its binding. A flagged device carries the warning
 * glyph and its reason in the title (R-SIM-115); an output's title says what it shows and on which step.
 */
export function BoardDevice(props: BoardDeviceProps): ReactElement {
    const { face, caption, skin, look } = props;
    const Face = FACES[face.kind];
    const flagged = face.flag !== null;
    const p = look?.press;
    // A Button carries its name on its face, but a round press with no icon (R-SIM-131); the mode `icon` hides a Clock's
    // name behind its icon; a silkscreen is its caption.
    const named = face.kind === 'silk' ? false
        : face.kind === 'button' ? skin === 'panel' && p !== undefined && p.shape === 'round' && !p.showIcon
        : face.kind === 'clock' ? !(p?.iconMode === 'icon' && p.showIcon)
        : true;
    const span = skin === 'board' && look?.span ? { gridColumn: `span ${look.span[0]}`, gridRow: `span ${look.span[1]}` } : undefined;
    return (
        <div
            className={`sim-board-device sim-board-device--${face.kind}${flagged ? ' sim-board-device--flagged' : ''}${face.on ? '' : ' sim-board-device--off'}`}
            data-device={face.id}
            title={face.title}
            style={span}
        >
            {look?.key && <kbd className="sim-board-device__keycap" aria-hidden="true">{look.key}</kbd>}
            <div className="sim-board-device__face"><Face {...props} /></div>
            {named && (
                <div className="sim-board-device__name">
                    {flagged && <i className="bi bi-exclamation-triangle sim-board-device__flag" />}
                    <span>{face.name}</span>
                </div>
            )}
            {caption && face.kind !== 'silk' && <div className="sim-board-device__caption">{face.caption}</div>}
        </div>
    );
}

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

export interface SimBoardProps {
    /** The M1 model whose bag holds the board and whose run it drives. */
    modelId: string;
    modelName: string;
    /** Its metamodel, whose bag holds the roles; `null` when unknown. */
    configModelId: string | null;
    /** The raw `ioBoard` of the model's bag, `null` when unset. */
    boardRaw: string | null;
    /** The panel's view of the live run's inputs: the status, the events on, why one has no candidate, what it asks. */
    inputs: BoardInputsView;
    /** The panel's status line, `step n · last step` and its title; `null` without a run. */
    statusLine: { line: string; title: string } | null;
    /** A key that changes when the model's elements may have (the panel's event signature): the context before Reset is read again. */
    contextKey: string;
    /** The panel's press (SimulationPanel.tsx `fire`). */
    fire: (event: string | null, selector?: string, values?: readonly InputValue[]) => void;
    /** A Clock's tick (R-SIM-122): the panel's press that leaves Play running; without it a tick is a hand press. */
    clockFire?: (event: string, values?: readonly InputValue[]) => void;
    /** A press waits on the user, the input dialog or a choice list: a Clock's tick is dropped (R-SIM-122). */
    waiting?: boolean;
    /** The panel's input dialog for the inputs the held values leave, the given carried (R-SIM-120). */
    ask: (event: string, asks: readonly InputRead[], given: readonly InputValue[]) => void;
    /** Closes the card; the panel returns the view to live. */
    onClose: () => void;
}

const SKINS: ReadonlyArray<{ skin: SimBoardSkin; label: string; title: string }> = [
    { skin: 'board', label: 'Board', title: 'The working surface: outputs above, inputs below, every binding named' },
    { skin: 'panel', label: 'Panel', title: 'The front panel: the same devices, drawn as hardware at their places' },
];

const byCell = (a: BoardDeviceRecord, b: BoardDeviceRecord) => a.cell[1] - b.cell[1] || a.cell[0] - b.cell[0];

const withValue = (h: BoardHeld, id: string, value: InputValue['value']): BoardHeld => ({ values: new Map(h.values).set(id, value), buffers: h.buffers });

/** The event a Button or a Clock presses, as the board context labels it; `null` when unbound. */
function pressedLabel(d: BoardDeviceRecord, ctx: BoardContext | null): string | null {
    if (d.binding?.kind !== 'event') return null;
    const id = d.binding.event;
    return ctx ? ctx.events.find(e => e.id === id)?.label ?? ctx.nameOf(id) : id;
}

/** WebAudio's context, made on the first gesture (simBoardSound.ts); `null` where there is none. */
function makeAudio(): ToneContext | null {
    const w = window as any;
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    return Ctor ? new Ctor() as ToneContext : null;
}

/** A pixel length of a custom property the card inherits (read, never defined here); `fallback` when unset. */
function cssPx(el: Element, name: string, fallback: number): number {
    const v = parseFloat(getComputedStyle(el).getPropertyValue(name));
    return Number.isFinite(v) ? v : fallback;
}

/** The canvas the floating window is clamped to: the card's containing block, under the toolbar and left of the rail. */
function canvasBounds(card: HTMLElement): SimRect | null {
    const parent = card.offsetParent as HTMLElement | null;
    if (!parent) return null;
    const top = cssPx(card, '--jj-toolbar-height', 40);
    const inset = cssPx(card, '--jj-canvas-right-inset', 0);
    return { left: 0, top, width: parent.clientWidth - inset, height: parent.clientHeight - top };
}
const withBuffer = (h: BoardHeld, id: string, buffer: string): BoardHeld => ({ values: h.values, buffers: new Map(h.buffers).set(id, buffer) });

export function SimBoard(props: SimBoardProps): ReactElement {
    const { modelId, modelName, configModelId, boardRaw, inputs, statusLine, contextKey, fire, clockFire, ask, waiting, onClose } = props;
    // The view, a commit, Reset and Stop bump the 'mark' version; the skin and «Show bindings» their own channel.
    useSimVersion();
    useSimViewerPrefsVersion();
    const run = getSimRun(modelId);
    const lookup: Record<string, any> = (store.getState() as any).idlookup ?? {};
    const live = run?.trace?.length ?? 0;
    const viewed = run ? getSimView(modelId) : null;
    const n = viewed ?? live;
    const prefs = getSimViewerPrefs(modelId);
    const skin: SimBoardSkin = prefs.boardSkin ?? 'board';
    const showBindings = prefs.showBindings ?? false;
    const [held, setHeld] = useState<BoardHeld>(NO_HELD);
    const [editing, setEditing] = useState(false);

    const decoded = useMemo(() => decodeBoard(boardRaw), [boardRaw]);
    // R-SIM-130, R-SIM-132: the board's own fields, each absent its default.
    const theme = boardTheme(decoded.settings);
    const accent = boardAccent(decoded.settings);
    const cols = boardCols(decoded.settings);
    const floating = boardFloats(cols, prefs.boardFloating === true);
    const sound = prefs.boardSound === true;
    const hasBuzzer = decoded.devices.some(d => d.kind === 'buzzer');
    // What the devices resolve against: the run's own net and frozen M while it exists (its outputs' R2 included), the
    // model's net as Reset would compile it before. A run's net and snapshot are the same object across its commits.
    const runNet = run?.net;
    const runSnapshot = run?.snapshot;
    const ctx = useMemo<BoardContext | null>(() => {
        const now: Record<string, any> = (store.getState() as any).idlookup ?? {};
        const current = getSimRun(modelId);
        return current ? boardContextOfRun(current, now, configModelId) : boardContextOf(now, modelId, configModelId);
    }, [modelId, configModelId, runNet, runSnapshot, contextKey, boardRaw]);
    // A keypad's buffer goes with the run it was typed for: Reset and Stop clear it (R-SIM-121); positions stay.
    useEffect(() => { setHeld(h => (h.buffers.size === 0 ? h : { values: h.values, buffers: new Map() })); }, [runSnapshot]);

    // R-SIM-122: the clocks of this card. A tick reads the run from the store and this render's press through `latest`,
    // so the held values and the dialog's state it sees are the current ones; the card's unmount clears every timer.
    const [, setClockVersion] = useState(0);
    const clocksRef = useRef<Clocks | null>(null);
    const latest = useRef<{ waiting: boolean; tick: (event: string) => void }>({ waiting: false, tick: () => undefined });
    useEffect(() => {
        const clocks = createClocks({
            run: () => getSimRun(modelId),
            waiting: () => latest.current.waiting,
            press: event => latest.current.tick(event),
            changed: () => setClockVersion(v => v + 1),
        });
        clocksRef.current = clocks;
        return () => { clocks.dispose(); clocksRef.current = null; };
    }, [modelId]);
    // A new run (Reset), none (Stop, the interruption) or an ended one, whoever caused it, switches the clocks off now.
    useEffect(() => { clocksRef.current?.check(); }, [run]);
    // An edit of the board can remove, rebind or re-time a clock: every clock goes off.
    useEffect(() => { clocksRef.current?.stopAll('board'); }, [boardRaw]);

    const faces = boardFaces(decoded.devices, { run, n, ctx, inputs, held, lookup, clocks: clocksRef.current?.states() });
    const faceOf = new Map<string, DeviceFace>(faces.map(f => [f.id, f]));
    // R-SIM-133: one key per Button, Switch and Clock, in board order, by the names the faces show.
    const keys = boardKeys(decoded.devices, d => faceOf.get(d.id)?.name ?? d.id);
    const lookOf = (d: BoardDeviceRecord): DeviceLook => ({
        ...(d.kind === 'button' || d.kind === 'clock' ? { press: pressLook(d, pressedLabel(d, ctx)) } : {}),
        ...(keys.has(d.id) ? { key: keys.get(d.id) ?? null } : {}),
        ...(d.kind === 'text' || d.kind === 'seven' ? { display: displayLook(d, ctx ? maxDisplayLength(d, ctx) : null, theme) } : {}),
        ...(d.kind === 'led' || d.kind === 'pulse' ? { led: ledLook(d) } : {}),
        ...(accent ? { accent } : {}),
        ...(d.span ? { span: spanOf(d) } : {}),
    });

    // R-SIM-133: the buzzers sound on a rising edge of the live step; the audio context waits for a gesture.
    const buzzerRef = useRef<Buzzer | null>(null);
    if (buzzerRef.current === null) buzzerRef.current = createBuzzer(makeAudio);
    useEffect(() => {
        const lit = new Map(faces.filter(f => f.kind === 'buzzer').map(f => [f.id, f.lit === true] as [string, boolean]));
        buzzerRef.current?.observe(lit, { muted: !sound, live: viewed === null });
    });
    const gesture = (): void => { if (hasBuzzer && sound) buzzerRef.current?.unlock(); };

    // R-SIM-132: the floating window's place, the stored one clamped to the canvas once measured, live while dragged.
    const rootRef = useRef<HTMLDivElement>(null);
    const [win, setWin] = useState<SimBoardWindow | null>(null);
    const place: SimBoardWindow = win ?? prefs.boardWindow ?? { x: BOARD_SLOT_LEFT, y: 56 };
    useEffect(() => {
        if (!floating) { setWin(null); return; }
        const fit = (): void => {
            const card = rootRef.current;
            const bounds = card ? canvasBounds(card) : null;
            if (!card || !bounds) return;
            const at = getSimViewerPrefs(modelId).boardWindow ?? { x: BOARD_SLOT_LEFT, y: bounds.top + 16 };
            const next = clampBoardWindow(at, { width: card.offsetWidth, height: card.offsetHeight }, bounds);
            setWin(w => (w && w.x === next.x && w.y === next.y ? w : next));
        };
        fit();
        window.addEventListener('resize', fit);
        return () => window.removeEventListener('resize', fit);
    }, [floating, cols, skin, modelId]);
    const drag = (e: ReactPointerEvent<HTMLDivElement>): void => {
        const card = rootRef.current;
        if (!floating || !card || e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
        const bounds = canvasBounds(card);
        if (!bounds) return;
        e.preventDefault();
        const handle = e.currentTarget;
        const from = { x: e.clientX, y: e.clientY, at: place };
        const size = { width: card.offsetWidth, height: card.offsetHeight };
        let last = place;
        const move = (m: PointerEvent): void => {
            last = clampBoardWindow({ x: from.at.x + m.clientX - from.x, y: from.at.y + m.clientY - from.y }, size, bounds);
            setWin(last);
        };
        const up = (): void => {
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', up);
            handle.removeEventListener('pointercancel', up);
            setSimViewerPrefs(modelId, { boardWindow: last });
        };
        handle.setPointerCapture(e.pointerId);
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
        handle.addEventListener('pointercancel', up);
    };

    /** A press of `event`, the values the board holds answering what it asks, `first` before them (R-SIM-120); `press` sends it. */
    const send = (event: string, first: readonly InputValue[] = [], press = (e: string, values?: readonly InputValue[]) => fire(e, undefined, values)): void => {
        const plan = planPress(getSimRun(modelId), event, [...first, ...heldInputs(decoded.devices, ctx, held)]);
        if (plan.kind === 'fire') press(plan.event, plan.values);
        else ask(plan.event, plan.asks, plan.given);
    };
    // A tick is the Button's press of the clock's event, sent by the panel's clock press so that Play goes on.
    latest.current = { waiting: waiting ?? false, tick: event => (clockFire ? send(event, [], clockFire) : send(event)) };
    const actions: DeviceActions = {
        press: (id, event) => {
            const d = decoded.devices.find(x => x.id === id);
            send(event);
            // A switch on two events moves with the press it sends.
            if (d?.kind === 'switch' && d.binding?.kind === 'events') setHeld(h => withValue(h, id, h.values.get(id) !== true));
        },
        flip: id => setHeld(h => withValue(h, id, h.values.get(id) !== true)),
        slide: (id, value) => setHeld(h => withValue(h, id, value)),
        key: (id, key) => {
            const d = decoded.devices.find(x => x.id === id);
            const b = d?.binding;
            if (b?.kind !== 'keypadValue' || !ctx) return;
            const buffer = held.buffers.get(id) ?? '';
            if (key === 'C') { setHeld(h => withBuffer(h, id, '')); return; }
            if (key !== '↵') { setHeld(h => withBuffer(h, id, keypadPress(buffer, Number(key)))); return; }
            const domain = ctx.ivars.find(i => i.element === b.element && i.attr === b.attr)?.domain;
            const entered = domain ? keypadEnterValue(domain, buffer) : null;
            if (!entered || 'refused' in entered) return;
            setHeld(h => withBuffer(h, id, ''));
            send(b.enter, [{ element: b.element, attr: b.attr, value: entered.value }]);
        },
        clock: id => {
            const clocks = clocksRef.current;
            const d = decoded.devices.find(x => x.id === id);
            if (!clocks || d?.kind !== 'clock' || d.binding?.kind !== 'event') return;
            if (clocks.state(id)?.on) clocks.stop(id);
            else clocks.start(id, d.binding.event, d.period ?? CLOCK_PERIOD_DEFAULT);
        },
    };

    /** R-SIM-133: a key with the focus in the card, not in a field, presses its device as its click does; off, nothing. */
    const onKey = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
        const key = shortcutKey({ key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, repeat: e.repeat, target: e.target as HTMLElement });
        const id = key === null ? null : shortcutDevice(key, keys, x => faceOf.get(x)?.on === true);
        const f = id === null ? undefined : faceOf.get(id);
        const act = f ? shortcutAction(f) : null;
        if (!f || !act) return;
        e.preventDefault();
        e.stopPropagation();
        gesture();
        if (act.kind === 'press') actions.press(f.id, act.event);
        else if (act.kind === 'flip') actions.flip(f.id);
        else actions.clock?.(f.id);
    };

    const deviceOf = (d: BoardDeviceRecord) => {
        const f = faceOf.get(d.id)!;
        return <BoardDevice key={f.id} face={f} skin={skin} caption={skin === 'board' || showBindings} actions={actions} look={lookOf(d)} />;
    };
    const ordered = [...decoded.devices].sort(byCell);
    // Variant A lists what is bound: a silkscreen binds nothing and stays on the front panel.
    const outputs = ordered.filter(d => !isInputKind(d.kind) && d.kind !== 'silk');
    const ins = ordered.filter(d => isInputKind(d.kind));
    const rows = Math.min(BOARD_ROWS, decoded.devices.reduce((m, d) => Math.max(m, d.cell[1] + spanOf(d)[1]), 1));
    const status = inputs.status ?? 'Not started';
    const statusKey = status.toLowerCase().replace(' ', '-');
    const wide = cols !== 4 ? ` sim-board--cols-${cols}` : '';
    const dockable = canDock(cols);

    return (
        <div
            className={`sim-board sim-board--${skin}${floating ? ' sim-board--floating' : ''}${wide}`}
            role="dialog"
            aria-label="I/O board"
            tabIndex={-1}
            ref={rootRef}
            style={floating ? { left: `${place.x}px`, top: `${place.y}px` } : undefined}
            onKeyDown={onKey}
            onPointerDown={gesture}
        >
            <div className="sim-board__header" onPointerDown={drag}>
                <i className="bi bi-motherboard" />
                <span className="sim-board__title">I/O board</span>
                <span className="sim-board__subtitle" title={modelName}>{modelName}</span>
                <span className="sim-board__skins" role="group" aria-label="Skin">
                    {SKINS.map(s => (
                        <button
                            type="button"
                            key={s.skin}
                            className="sim-board__skin"
                            aria-pressed={skin === s.skin}
                            title={s.title}
                            onClick={() => setSimViewerPrefs(modelId, { boardSkin: s.skin })}
                        >
                            {s.label}
                        </button>
                    ))}
                </span>
                {hasBuzzer && (
                    <button
                        type="button"
                        className="sim-board__sound"
                        aria-pressed={sound}
                        aria-label={sound ? 'Mute the buzzer' : 'Let the buzzer sound'}
                        title={sound ? 'The buzzer sounds when it rings; click to mute it' : 'The buzzer is muted: its lamp still rings; click to hear it'}
                        onClick={() => {
                            if (!sound) buzzerRef.current?.unlock();
                            setSimViewerPrefs(modelId, { boardSound: !sound });
                        }}
                    >
                        <i className={`bi ${sound ? 'bi-volume-up' : 'bi-volume-mute'}`} />
                    </button>
                )}
                {floating ? (
                    <button
                        type="button"
                        className="sim-board__window"
                        aria-label="Dock"
                        title={dockable ? 'Dock the board in its card slot' : `A board of ${cols} columns does not fit the card slot: it stays a window`}
                        disabled={!dockable}
                        onClick={() => setSimViewerPrefs(modelId, { boardFloating: false })}
                    >
                        <i className="bi bi-box-arrow-in-down-left" />
                    </button>
                ) : (
                    <button
                        type="button"
                        className="sim-board__window"
                        aria-label="Pop out"
                        title="Pop the board out into a window over the canvas, dragged by its header"
                        onClick={() => setSimViewerPrefs(modelId, { boardFloating: true })}
                    >
                        <i className="bi bi-box-arrow-up-right" />
                    </button>
                )}
                <button type="button" className="sim-board__edit" aria-haspopup="dialog" title="Edit the board: devices, places, bindings" onClick={() => setEditing(true)}>
                    Edit…
                </button>
                <button type="button" className="sim-board__close" title="Close the board" aria-label="Close the board" onClick={onClose}>
                    <i className="bi bi-x-lg" />
                </button>
            </div>
            {skin === 'panel' && (
                <div className="sim-board__toolbar">
                    <span className="sim-board__toolbar-label" id={`sim-board-bindings-${modelId}`}>Show bindings</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={showBindings}
                        aria-labelledby={`sim-board-bindings-${modelId}`}
                        className={`jjodel-switch${showBindings ? ' checked' : ''}`}
                        title="Outline each device and name what it is bound to"
                        onClick={() => setSimViewerPrefs(modelId, { showBindings: !showBindings })}
                    />
                </div>
            )}
            <div className="sim-board__body">
                {!decoded.readable && <div className="sim-board__warning">The stored board is not readable. Edit… replaces it.</div>}
                {decoded.readable && decoded.defects.length > 0 && (
                    <div className="sim-board__warning" title={decoded.defects.map(d => d.message).join('\n')}>
                        {`${decoded.defects.length} stored ${decoded.defects.length === 1 ? 'device was' : 'devices were'} not read as written.`}
                    </div>
                )}
                {decoded.devices.length === 0 ? (
                    <div className="sim-board__empty">No device yet. Edit… adds buttons, switches, lamps and displays.</div>
                ) : skin === 'board' ? (
                    <>
                        {outputs.length > 0 && (
                            <section className="sim-board__group" aria-label="Outputs">
                                <div className="sim-board__group-head">Outputs</div>
                                <div className={`sim-board__grid${cols !== 4 ? ` sim-board__grid--cols-${cols}` : ''}`}>{outputs.map(deviceOf)}</div>
                            </section>
                        )}
                        {ins.length > 0 && (
                            <section className="sim-board__group" aria-label="Inputs">
                                <div className="sim-board__group-head">Inputs</div>
                                <div className={`sim-board__grid${cols !== 4 ? ` sim-board__grid--cols-${cols}` : ''}`}>{ins.map(deviceOf)}</div>
                            </section>
                        )}
                    </>
                ) : (
                    <div
                        className={`sim-board__front sim-board__front--${theme}${cols !== 4 ? ` sim-board__front--cols-${cols}` : ''}${showBindings ? ' sim-board__front--bindings' : ''}`}
                        style={{ gridTemplateRows: `repeat(${rows}, auto)` }}
                    >
                        {decoded.devices.map(d => {
                            const [w, h] = spanOf(d);
                            return (
                                <div
                                    className="sim-board__slot"
                                    key={d.id}
                                    style={{ gridColumn: w > 1 ? `${d.cell[0] + 1} / span ${w}` : d.cell[0] + 1, gridRow: h > 1 ? `${d.cell[1] + 1} / span ${h}` : d.cell[1] + 1 }}
                                >
                                    {deviceOf(d)}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="sim-board__foot">
                {viewed !== null && (
                    <div className="sim-board__viewing" role="status">
                        <span className="sim-board__viewing-text">{`Viewing step ${viewed}. The run is still at step ${live}.`}</span>
                        <button type="button" className="sim-board__live" onClick={() => simSetView(modelId, null)}>Back to live</button>
                    </div>
                )}
                <div className="sim-board__status">
                    <span className={`sim-panel__status-pill sim-panel__status-pill--${statusKey}`}>
                        <span className={`sim-panel__dot sim-panel__dot--${statusKey}`} />
                        <span className="sim-panel__status-text">{status}</span>
                    </span>
                    {statusLine && <span className="sim-panel__status-line" title={statusLine.title}>{`· ${statusLine.line}`}</span>}
                </div>
            </div>
            {editing && (
                <SimBoardEditor
                    modelId={modelId}
                    modelName={modelName}
                    boardRaw={boardRaw}
                    onClose={() => setEditing(false)}
                    onApplied={() => setEditing(false)}
                />
            )}
        </div>
    );
}

export default SimBoard;
