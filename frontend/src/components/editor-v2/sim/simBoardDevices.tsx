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
 */

import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { store } from '../../../joiner';
import { BOARD_ROWS, decodeBoard, isInputKind } from '../../../model/simulation/boardCodec';
import type { BoardDevice as BoardDeviceRecord } from '../../../model/simulation/boardCodec';
import type { InputRead } from '../../../model/simulation/netTypes';
import { getSimRun, getSimView, simSetView, useSimVersion } from './simRunState';
import { getSimViewerPrefs, setSimViewerPrefs, useSimViewerPrefsVersion } from './simViewerPrefs';
import type { SimBoardSkin } from './simViewerPrefs';
import { boardContextOf, boardContextOfRun, keypadEnterValue, keypadPress } from './simBoard';
import type { BoardContext } from './simBoard';
import { boardFaces, heldInputs, NO_HELD, planPress } from './simBoardFace';
import type { BoardHeld, BoardInputsView, DeviceFace, KeyFace } from './simBoardFace';
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
}

export interface BoardDeviceProps {
    face: DeviceFace;
    skin: SimBoardSkin;
    /** The caption under the device: always in Variant A, with «Show bindings» in Variant B. */
    caption: boolean;
    actions: DeviceActions;
}

/** The glyph of Variant A's Button, Bootstrap Icons (the editor's palette, SimBoardEditor.tsx). */
const BUTTON_ICON = 'bi-record-circle';

function ButtonFace({ face, skin, actions }: BoardDeviceProps): ReactElement {
    return (
        <button
            type="button"
            className="sim-board-device__button"
            title={face.title}
            disabled={!face.on}
            onClick={() => face.fires && actions.press(face.id, face.fires)}
        >
            {skin === 'board'
                ? <><i className={`bi ${face.flag !== null ? 'bi-exclamation-triangle sim-board-device__flag' : BUTTON_ICON}`} /><span>{face.name}</span></>
                : <span className="sim-board-device__cap" />}
        </button>
    );
}

function SwitchFace({ face, skin, actions }: BoardDeviceProps): ReactElement {
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

function LampFace({ face }: BoardDeviceProps): ReactElement {
    const lamp = `sim-board-device__lamp${face.kind === 'pulse' ? ' sim-board-device__lamp--pulse' : ''}`
        + `${face.lit ? ' sim-board-device__lamp--lit' : ''}${face.err ? ' sim-board-device__lamp--err' : ''}`;
    return (
        <span className="sim-board-device__lamp-row">
            <span className={lamp} role="img" aria-label={`${face.name}: ${face.err ? 'Err' : face.lit ? 'lit' : 'dark'}`} />
            {face.err && <span className="sim-board-device__err">Err</span>}
        </span>
    );
}

function SevenFace({ face }: BoardDeviceProps): ReactElement {
    return (
        <span className={`sim-board-device__digits${face.err ? ' sim-board-device__digits--err' : ''}${face.on ? '' : ' sim-board-device__digits--off'}`}>
            {face.on ? face.text : '----'}
        </span>
    );
}

function TextFace({ face }: BoardDeviceProps): ReactElement {
    return (
        <span className={`sim-board-device__lcd${face.err ? ' sim-board-device__lcd--err' : ''}${face.on ? '' : ' sim-board-device__lcd--off'}`}>
            {face.on ? face.text : ''}
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
    button: ButtonFace, switch: SwitchFace, slider: SliderFace, keypad: KeypadFace,
    led: LampFace, pulse: LampFace, seven: SevenFace, text: TextFace, gauge: GaugeFace,
};

/**
 * One device on the board: its face, its name, the caption of its binding. A flagged device carries the warning
 * glyph and its reason in the title (R-SIM-115); an output's title says what it shows and on which step.
 */
export function BoardDevice(props: BoardDeviceProps): ReactElement {
    const { face, caption } = props;
    const Face = FACES[face.kind];
    const flagged = face.flag !== null;
    return (
        <div
            className={`sim-board-device sim-board-device--${face.kind}${flagged ? ' sim-board-device--flagged' : ''}${face.on ? '' : ' sim-board-device--off'}`}
            data-device={face.id}
            title={face.title}
        >
            <div className="sim-board-device__face"><Face {...props} /></div>
            {/* Variant A's Button carries its name, and its flag, on the button itself. */}
            {!(face.kind === 'button' && props.skin === 'board') && (
                <div className="sim-board-device__name">
                    {flagged && <i className="bi bi-exclamation-triangle sim-board-device__flag" />}
                    <span>{face.name}</span>
                </div>
            )}
            {caption && <div className="sim-board-device__caption">{face.caption}</div>}
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
const withBuffer = (h: BoardHeld, id: string, buffer: string): BoardHeld => ({ values: h.values, buffers: new Map(h.buffers).set(id, buffer) });

export function SimBoard(props: SimBoardProps): ReactElement {
    const { modelId, modelName, configModelId, boardRaw, inputs, statusLine, contextKey, fire, ask, onClose } = props;
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

    const faces = boardFaces(decoded.devices, { run, n, ctx, inputs, held, lookup });
    const faceOf = new Map<string, DeviceFace>(faces.map(f => [f.id, f]));

    /** A press of `event`, the values the board holds answering what it asks, `first` before them (R-SIM-120). */
    const send = (event: string, first: readonly InputValue[] = []): void => {
        const plan = planPress(getSimRun(modelId), event, [...first, ...heldInputs(decoded.devices, ctx, held)]);
        if (plan.kind === 'fire') fire(plan.event, undefined, plan.values);
        else ask(plan.event, plan.asks, plan.given);
    };
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
    };

    const device = (f: DeviceFace) => <BoardDevice key={f.id} face={f} skin={skin} caption={skin === 'board' || showBindings} actions={actions} />;
    const ordered = [...decoded.devices].sort(byCell);
    const outputs = ordered.filter(d => !isInputKind(d.kind));
    const ins = ordered.filter(d => isInputKind(d.kind));
    const rows = Math.min(BOARD_ROWS, decoded.devices.reduce((m, d) => Math.max(m, d.cell[1] + 1), 1));
    const status = inputs.status ?? 'Not started';
    const statusKey = status.toLowerCase().replace(' ', '-');

    return (
        <div className={`sim-board sim-board--${skin}`} role="dialog" aria-label="I/O board">
            <div className="sim-board__header">
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
                                <div className="sim-board__grid">{outputs.map(d => device(faceOf.get(d.id)!))}</div>
                            </section>
                        )}
                        {ins.length > 0 && (
                            <section className="sim-board__group" aria-label="Inputs">
                                <div className="sim-board__group-head">Inputs</div>
                                <div className="sim-board__grid">{ins.map(d => device(faceOf.get(d.id)!))}</div>
                            </section>
                        )}
                    </>
                ) : (
                    <div className={`sim-board__front${showBindings ? ' sim-board__front--bindings' : ''}`} style={{ gridTemplateRows: `repeat(${rows}, auto)` }}>
                        {decoded.devices.map(d => (
                            <div className="sim-board__slot" key={d.id} style={{ gridColumn: d.cell[0] + 1, gridRow: d.cell[1] + 1 }}>
                                {device(faceOf.get(d.id)!)}
                            </div>
                        ))}
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
