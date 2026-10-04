/**
 * simBoardFace — what each device of the I/O board shows, and what a press from
 * the board sends (R-SIM-110..114, R-SIM-119..121; P-2026-10-03-2000, Lane 2 of
 * docs/discovery/discovery_2026-10-03_sim_io_board.md §8).
 *
 * `deviceFace` reads three things and nothing else: the run with the step shown
 * (`getSimView ?? live`, R-SIM-106), the panel's view of the live run's inputs
 * (SimulationPanel.tsx `view`: the status, the events on, why one has no
 * candidate, what it asks), and the resolution of the device's binding
 * (simBoard.ts `resolveDevice`). Both skins draw the same faces (R-SIM-114).
 *
 * - Inputs follow the panel's rules (R-SIM-113): a Button is on exactly when the
 *   panel's button of its event is, and its title is the panel's, byte for byte,
 *   through `inputPressTitle` and `inputOffTitle`. Inputs read the live run while
 *   a past step is shown: a press acts on live and returns the view to live
 *   (simBridge.ts). A Switch or a Slider on an IVAR holds a value, a flip is not a
 *   step (R-SIM-120); the keypad's value buffer is the device's (R-SIM-121).
 * - Outputs read the configuration of the step shown: an LED lit, a value, `Err`
 *   for a value out of the device's domain or an evaluation defect (R-SIM-111),
 *   off with the reason in the title before Reset. The 7-segment shows a whole
 *   number of four digits, `SEVEN_MIN..SEVEN_MAX`.
 * - A binding that does not resolve flags its device, which is off or dark with
 *   the reason in its title (R-SIM-115): a compile defect is a flag, never `Err`.
 * - A Clock (R-SIM-122) presses its event on its own, every period, whatever that
 *   event enables: its switch follows the run, not the event's button. It shows its
 *   period, the ticks since it was switched on, the ticks dropped while a press
 *   waited on the user, and why it went off (simBoardClock.ts `ClockState`).
 * - A Silkscreen (R-SIM-128) shows its label and nothing else: never flagged, never
 *   off, with or without a run. A Buzzer reads as an LED, lit while its boolean
 *   holds; its sound is the skin's (P-2026-10-04-1131).
 *
 * `heldInputs` and `planPress` are the board's press: the inputs a press asks are
 * answered by the values the board holds (`heldAnswer`, R-SIM-120); all answered,
 * the press fires with them; some, the input dialog asks the rest with the given
 * carried (`AskingInputs.given`); none asked, the press is the panel's own, held
 * values dropped, so its «Last step» is the hand press's.
 *
 * Pure: no React, no store write, so it runs under the node test bench
 * (sim/__tests__/simBoardFace.test.ts).
 */

import { CLOCK_PERIOD_DEFAULT, isInputKind } from '../../../model/simulation/boardCodec';
import type { BoardDevice, DeviceKind } from '../../../model/simulation/boardCodec';
import { compileOutput, evaluateOutput, pulseLit } from '../../../model/simulation/boardOutputs';
import type { OutputReading } from '../../../model/simulation/boardOutputs';
import type { InputRead, NetRunStatus, SimState, SimValue } from '../../../model/simulation/netTypes';
import { DEVICE_LABELS, bindingCaption, clockPeriodText, heldAnswer, keypadEnterValue, keypadKeyReason, resolveDevice } from './simBoard';
import type { BoardContext } from './simBoard';
import { clockOffText } from './simBoardClock';
import type { ClockState } from './simBoardClock';
import { inputAsks, inputOffTitle, inputPressTitle, markingChips } from './simBridge';
import type { InputValue } from './simBridge';
import { stateValueOf } from './simCanvasState';
import { configAt } from './simRunState';
import type { SimRun } from './simRunState';

/** The 7-segment's four digits (R-SIM-111): a value outside shows `Err`. */
export const SEVEN_MIN = -999;
export const SEVEN_MAX = 9999;

/** The panel's view of the live run's inputs (SimulationPanel.tsx `view`). */
export interface BoardInputsView {
    readonly status: NetRunStatus | null;
    /** The events whose button is on (`view.inputs.events`). */
    readonly eventsOn: ReadonlySet<string>;
    /** Why an input has no candidate, in full (R-SIM-60). */
    readonly noCandidate: ReadonlyMap<string | null, string>;
    /** What a press of an input asks, its labels joined (R-SIM-88). */
    readonly asks: ReadonlyMap<string | null, string>;
}

/** What the devices hold between presses, never persisted: a Switch's position, a Slider's value, a keypad's buffer; by device id. */
export interface BoardHeld {
    readonly values: ReadonlyMap<string, SimValue>;
    readonly buffers: ReadonlyMap<string, string>;
}

export const NO_HELD: BoardHeld = { values: new Map(), buffers: new Map() };

/** What the faces read. */
export interface BoardScene {
    /** The live run, absent before Reset. */
    readonly run: SimRun | undefined;
    /** The step shown: the one viewed, or the live one. */
    readonly n: number;
    /** What the board resolves against: the run's (`boardContextOfRun`), the model's before Reset; `null` when the roles make no net. */
    readonly ctx: BoardContext | null;
    readonly inputs: BoardInputsView;
    readonly held: BoardHeld;
    /** The store's lookup, for the names of the marked states (`markingChips`). */
    readonly lookup: Record<string, any>;
    /** The board's clocks by device id (R-SIM-122): view state of the card, absent while none was switched on. */
    readonly clocks?: ReadonlyMap<string, ClockState>;
}

/** One key of a keypad: `0`..`9`, `C` (clear) and `↵` (Enter) in value mode. */
export interface KeyFace {
    readonly key: string;
    readonly on: boolean;
    /** Value mode with «hide the keys out of the domain»: not drawn. */
    readonly hidden: boolean;
    readonly title: string;
    /** Events mode: the event the key fires; `null` when unbound, and in value mode. */
    readonly event: string | null;
}

/** What one device shows. The fields after `on` are its kind's. */
export interface DeviceFace {
    readonly id: string;
    readonly kind: DeviceKind;
    /** Its label, else what it is bound to, else its kind (`deviceName`). */
    readonly name: string;
    /** What it is bound to, in a few words: the caption under it (`bindingCaption`). */
    readonly caption: string;
    /** Why the binding does not resolve; `null` when it does. */
    readonly flag: string | null;
    readonly title: string;
    /** An input: a press reaches the machine now. An output: it shows a reading of the step shown. */
    readonly on: boolean;
    /** LED, Pulse LED. */
    readonly lit?: boolean;
    /** 7-segment, Text display, Gauge: the value as text, `Err` for an error. */
    readonly text?: string;
    readonly err?: boolean;
    /** Gauge, Slider: the value against the range, 0..1. */
    readonly fill?: number;
    readonly range?: { readonly min: number; readonly max: number };
    /** Switch: its position; Slider: its value. */
    readonly held?: SimValue;
    /** Button, Switch on two events: the event a press sends now. */
    readonly fires?: string;
    /** Keypad: its mode, the value buffer and the keys. */
    readonly mode?: 'value' | 'events';
    readonly buffer?: string;
    readonly keys?: readonly KeyFace[];
    /** Clock (R-SIM-122): ticking now; its period in milliseconds; the presses since it was switched on, and the ticks dropped. */
    readonly ticking?: boolean;
    readonly period?: number;
    readonly ticks?: number;
    readonly dropped?: number;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const NO_CONTEXT = 'Nothing to bind to: the roles make no net.';

function eventLabel(ctx: BoardContext, id: string): string {
    return ctx.events.find(e => e.id === id)?.label ?? ctx.nameOf(id);
}

function ivarName(ctx: BoardContext, element: string, attr: string): string {
    return ctx.ivars.find(i => i.element === element && i.attr === attr)?.label ?? (element === ctx.modelId ? attr : `${ctx.nameOf(element)}.${attr}`);
}

/** A device's name on the board: its label, else what it is bound to when that names an element, else its kind. */
export function deviceName(device: BoardDevice, ctx: BoardContext): string {
    if (device.label !== '') return device.label;
    const b = device.binding;
    if (b === null) return DEVICE_LABELS[device.kind];
    switch (b.kind) {
        case 'event': return eventLabel(ctx, b.event);
        case 'events': return `${eventLabel(ctx, b.on)} / ${eventLabel(ctx, b.off)}`;
        case 'ivar':
        case 'keypadValue': return ivarName(ctx, b.element, b.attr);
        case 'marked': return ctx.nameOf(b.place);
        case 'transition': return ctx.nameOf(b.transition);
        case 'attr': return ctx.attrs.find(a => a.element === b.element && a.attr === b.attr)?.label ?? ivarName(ctx, b.element, b.attr);
        case 'keypadEvents':
        case 'expr':
        case 'configuration': return DEVICE_LABELS[device.kind];
    }
}

/** A press of `event` as the panel's button of that event says it: on, and its title. */
function pressOf(event: string, base: string, scene: BoardScene, withAsks = true): { on: boolean; title: string } {
    const v = scene.inputs;
    const on = v.eventsOn.has(event);
    const why = v.noCandidate.get(event);
    return { on, title: on ? inputPressTitle(base, why, withAsks ? v.asks.get(event) : undefined) : inputOffTitle(base, why, v.status) };
}

const isNumber = (v: SimValue | undefined): v is number => typeof v === 'number' && Number.isFinite(v);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** The keys of a keypad whose binding does not resolve: every key off, the reason in its title. */
function flaggedKeys(device: BoardDevice, reason: string): KeyFace[] {
    const value = device.binding?.kind === 'keypadValue';
    return [...DIGITS, ...(value ? ['C', '↵'] : [])].map(key => ({ key, on: false, hidden: false, title: `${key === '↵' ? 'Enter' : key === 'C' ? 'Clear' : key}\nOff. ${reason}`, event: null }));
}

/** What a device shows (R-SIM-111, R-SIM-113). */
export function deviceFace(device: BoardDevice, scene: BoardScene): DeviceFace {
    const { ctx } = scene;
    if (device.kind === 'silk') {
        const name = device.label || DEVICE_LABELS.silk;
        return {
            id: device.id, kind: device.kind, name, caption: '', flag: null, on: true, text: device.label,
            title: device.label === '' ? DEVICE_LABELS.silk : `${DEVICE_LABELS.silk} · ${device.label}`,
        };
    }
    const status = ctx ? resolveDevice(device, ctx) : { ok: false as const, reason: NO_CONTEXT };
    const caption = ctx ? bindingCaption(device, ctx) : device.binding === null ? 'unbound' : '(missing)';
    const name = ctx ? deviceName(device, ctx) : device.label || DEVICE_LABELS[device.kind];
    const head = `${DEVICE_LABELS[device.kind]} · ${caption}`;
    const base = { id: device.id, kind: device.kind, name, caption };
    if (!status.ok || !ctx || device.binding === null) {
        const reason = status.ok ? 'Not bound.' : status.reason;
        return {
            ...base, flag: reason, title: `${head}\nOff. ${reason}`, on: false,
            ...(device.kind === 'keypad' ? { keys: flaggedKeys(device, reason), mode: device.binding?.kind === 'keypadEvents' ? 'events' as const : 'value' as const } : {}),
            ...(device.kind === 'clock' ? { ticking: false, period: device.period ?? CLOCK_PERIOD_DEFAULT, ticks: 0, dropped: 0 } : {}),
        };
    }
    return isInputKind(device.kind) ? inputFace(device, scene, ctx, base, head) : outputFace(device, scene, ctx, base, head);
}

type FaceBase = Pick<DeviceFace, 'id' | 'kind' | 'name' | 'caption'>;

function inputFace(device: BoardDevice, scene: BoardScene, ctx: BoardContext, base: FaceBase, head: string): DeviceFace {
    const b = device.binding!;
    const ok = { ...base, flag: null };
    switch (b.kind) {
        case 'event': {
            if (device.kind === 'clock') return clockFace(device, b.event, scene, ctx, base, head);
            const p = pressOf(b.event, `Fire ${eventLabel(ctx, b.event)}`, scene);
            return { ...ok, on: p.on, title: p.title, fires: b.event };
        }
        case 'events': {
            const position = scene.held.values.get(device.id) === true;
            const fires = position ? b.off : b.on;
            const p = pressOf(fires, `Fire ${eventLabel(ctx, fires)}`, scene);
            return { ...ok, on: p.on, title: p.title, fires, held: position };
        }
        case 'ivar': {
            const label = ivarName(ctx, b.element, b.attr);
            const domain = ctx.ivars.find(i => i.element === b.element && i.attr === b.attr)?.domain;
            if (device.kind === 'slider' && domain?.kind === 'range') {
                const kept = scene.held.values.get(device.id);
                const value = isNumber(kept) ? clamp(kept, domain.min, domain.max) : domain.min;
                const fill = domain.max > domain.min ? (value - domain.min) / (domain.max - domain.min) : 0;
                return { ...ok, on: true, held: value, fill, range: { min: domain.min, max: domain.max }, title: `${head}\n${label} = ${value}: given to the press that reads it.` };
            }
            const value = scene.held.values.get(device.id) === true;
            return { ...ok, on: true, held: value, title: `${head}\n${label} = ${value}: given to the press that reads it.` };
        }
        case 'keypadValue': {
            const label = ivarName(ctx, b.element, b.attr);
            const domain = ctx.ivars.find(i => i.element === b.element && i.attr === b.attr)!.domain;
            const buffer = scene.held.buffers.get(device.id) ?? '';
            const keys: KeyFace[] = DIGITS.map(key => {
                const why = keypadKeyReason(domain, buffer, Number(key));
                return { key, on: why === null, hidden: why !== null && b.hideOut, title: why === null ? key : `${key}\nOff. ${why}`, event: null };
            });
            keys.push({ key: 'C', on: buffer !== '', hidden: false, title: buffer !== '' ? 'Clear' : 'Clear\nOff. Nothing typed.', event: null });
            const entered = keypadEnterValue(domain, buffer);
            if ('refused' in entered) {
                keys.push({ key: '↵', on: false, hidden: false, title: `Enter\nOff. ${entered.refused}`, event: null });
            } else {
                const p = pressOf(b.enter, `Fire ${eventLabel(ctx, b.enter)} with ${label} = ${String(entered.value)}`, scene, false);
                keys.push({ key: '↵', on: p.on, hidden: false, title: p.title, event: null });
            }
            return { ...ok, on: true, mode: 'value', buffer, keys, title: `${head}\n${label} = ${buffer === '' ? '—' : buffer}, given by Enter.` };
        }
        case 'keypadEvents': {
            const keys: KeyFace[] = DIGITS.map((key, i) => {
                const event = b.keys[i] ?? '';
                if (event === '') return { key, on: false, hidden: false, title: `${key}\nOff. Not bound.`, event: null };
                const p = pressOf(event, `Fire ${eventLabel(ctx, event)}`, scene);
                return { key, on: p.on, hidden: false, title: p.title, event };
            });
            return { ...ok, on: keys.some(k => k.on), mode: 'events', keys, title: head };
        }
        default:
            return { ...ok, on: false, title: head };
    }
}

const countText = (ticks: number, dropped: number): string =>
    `${ticks} ${ticks === 1 ? 'tick' : 'ticks'}${dropped > 0 ? `, ${dropped} dropped` : ''}`;

/**
 * A Clock (R-SIM-122): its switch is on while the clock ticks, or while the run is Running and it could; the event's
 * own button does not matter, a tick it does not accept is discarded (decision 3). The title says what it presses and
 * how often, the count since it was switched on, and why it is off.
 */
function clockFace(device: BoardDevice, event: string, scene: BoardScene, ctx: BoardContext, base: FaceBase, head: string): DeviceFace {
    const period = device.period ?? CLOCK_PERIOD_DEFAULT;
    const presses = `press ${eventLabel(ctx, event)} every ${clockPeriodText(period)}`;
    const s = scene.clocks?.get(device.id);
    const ticking = s?.on === true;
    const ticks = s?.ticks ?? 0;
    const dropped = s?.dropped ?? 0;
    const status = scene.inputs.status;
    const canStart = status === 'Running';
    const face = { ...base, flag: null, fires: event, period, ticking, ticks, dropped, on: ticking || canStart };
    if (ticking) {
        const note = dropped > 0 ? ' A dropped tick came while a press waited on the input dialog or a choice.' : '';
        return { ...face, title: `${head}\nOn: ${presses.replace(/^press/, 'presses')}. ${countText(ticks, dropped)} since on.${note}` };
    }
    const hint = canStart ? ` Switch it on to ${presses}.` : '';
    if (s?.off) return { ...face, title: `${head}\nOff: ${clockOffText(s.off)}. ${countText(ticks, dropped)}.${hint}` };
    const why = canStart ? `Switch it on to ${presses}.` : status === 'Not started' || status === null ? 'Reset starts the run.' : `The run is ${status}.`;
    return { ...face, title: `${head}\nOff. ${why}` };
}

function readExpr(text: string, run: SimRun, ctx: BoardContext, state: SimState): OutputReading {
    if (!run.snapshot) return { kind: 'defect', detail: 'The run carries no frozen model.' };
    return evaluateOutput(compileOutput(text, { net: run.net, snapshot: run.snapshot, nameOf: ctx.nameOf }), run.snapshot, run.net, state);
}

const typeName = (v: SimValue): string => (typeof v === 'boolean' ? 'a boolean' : typeof v === 'number' ? 'a number' : 'a string');

function outputFace(device: BoardDevice, scene: BoardScene, ctx: BoardContext, base: FaceBase, head: string): DeviceFace {
    const b = device.binding!;
    const ok = { ...base, flag: null };
    const run = scene.run;
    const config = run ? configAt(run, scene.n) : null;
    if (!run || !config) {
        return { ...ok, on: false, lit: false, text: '', title: `${head}\nOff. ${run ? `Step ${scene.n} cannot be rebuilt.` : 'Reset starts the run.'}` };
    }
    const viewing = scene.n !== (run.trace?.length ?? 0) ? `\nViewing step ${scene.n}.` : '';
    const shown = (reading: string, x: Partial<DeviceFace>): DeviceFace => ({ ...ok, on: true, ...x, title: `${head}\n${reading}${viewing}` });
    const lamp = device.kind === 'led' || device.kind === 'buzzer';
    const error = (why: string, x: Partial<DeviceFace> = {}): DeviceFace => shown(`Err. ${why}`, { err: true, text: 'Err', ...(lamp ? { lit: false } : {}), ...x });
    const state = config.state;
    switch (b.kind) {
        case 'marked': {
            const lit = (state.marking.get(b.place) ?? 0) > 0;
            return shown(lit ? 'Lit.' : 'Dark.', { lit });
        }
        case 'transition':
        case 'event': {
            const lit = pulseLit(run.trace ?? [], scene.n, { kind: b.kind, id: b.kind === 'transition' ? b.transition : b.event });
            return shown(lit ? `Lit: fired on step ${scene.n}.` : `Dark: not fired on step ${scene.n}.`, { lit });
        }
        case 'configuration': {
            const text = markingChips(state, scene.lookup).map(c => c.text).join(', ');
            return shown(text === '' ? '∅' : text, { text: text === '' ? '∅' : text });
        }
        case 'expr': {
            const r = readExpr(b.text, run, ctx, state);
            if (r.kind === 'defect') return error(r.detail);
            const v = r.value;
            if (lamp) {
                return typeof v === 'boolean' ? shown(v ? 'Lit.' : 'Dark.', { lit: v }) : error(`The value is ${typeName(v)}, not a boolean.`);
            }
            if (device.kind === 'seven') {
                if (typeof v !== 'number') return error(`The value is ${typeName(v)}, not a number.`);
                if (!Number.isInteger(v)) return error(`${v} is not a whole number.`);
                if (v < SEVEN_MIN || v > SEVEN_MAX) return error(`${v} does not fit the display, ${SEVEN_MIN}..${SEVEN_MAX}.`);
                return shown(String(v), { text: String(v) });
            }
            return shown(String(v), { text: String(v) });
        }
        case 'attr': {
            const domain = ctx.attrs.find(a => a.element === b.element && a.attr === b.attr)?.domain;
            if (domain?.kind !== 'range') return error('The attribute has no range domain.');
            const range = { min: domain.min, max: domain.max };
            const v = stateValueOf(state, 'semantic', b.element, b.attr);
            if (v === undefined) return error('No value on this step.', { range, fill: 0 });
            if (!isNumber(v)) return error(`The value is ${typeName(v)}, not a number.`, { range, fill: 0 });
            const fill = domain.max > domain.min ? clamp((v - domain.min) / (domain.max - domain.min), 0, 1) : 0;
            if (v < domain.min || v > domain.max) return error(`${v} is outside ${domain.min}..${domain.max}.`, { range, fill });
            return shown(`${v} of ${domain.min}..${domain.max}`, { text: String(v), range, fill });
        }
        default:
            return shown('', {});
    }
}

/** The faces of a board, in its order. */
export function boardFaces(devices: readonly BoardDevice[], scene: BoardScene): DeviceFace[] {
    return devices.map(d => deviceFace(d, scene));
}

// ---------------------------------------------------------------------------
// The board's press (R-SIM-120)
// ---------------------------------------------------------------------------

/**
 * The values the board holds for the inputs (R-SIM-120): each Switch and Slider on an IVAR whose binding resolves,
 * in the board's order, a Switch false and a Slider its minimum until moved. The keypad's buffer is not held: Enter
 * gives it.
 */
export function heldInputs(devices: readonly BoardDevice[], ctx: BoardContext | null, held: BoardHeld): InputValue[] {
    if (!ctx) return [];
    const out: InputValue[] = [];
    for (const d of devices) {
        const b = d.binding;
        if (b?.kind !== 'ivar' || !resolveDevice(d, ctx).ok) continue;
        const domain = ctx.ivars.find(i => i.element === b.element && i.attr === b.attr)?.domain;
        const kept = held.values.get(d.id);
        const value: SimValue = domain?.kind === 'range' ? (isNumber(kept) ? clamp(kept, domain.min, domain.max) : domain.min) : kept === true;
        out.push({ element: b.element, attr: b.attr, value });
    }
    return out;
}

/** What a press from the board sends: the press, with the values that answer every ask; or the dialog for the rest. */
export type BoardPress =
    | { readonly kind: 'fire'; readonly event: string; readonly values?: readonly InputValue[] }
    | { readonly kind: 'ask'; readonly event: string; readonly asks: readonly InputRead[]; readonly given: readonly InputValue[] };

/**
 * A press of `event` from the board: what it asks (`inputAsks`, the live run), answered by `held` (`heldAnswer`, the
 * first value for an input wins). Nothing asked: the hand press, no value sent. Every ask answered: the press with
 * the values, in the asks' order. Some: the dialog asks the rest, the given carried.
 */
export function planPress(run: SimRun | undefined, event: string, held: readonly InputValue[]): BoardPress {
    const asks = run ? inputAsks(run, event) : [];
    if (asks.length === 0) return { kind: 'fire', event };
    const { given, rest } = heldAnswer(asks, held);
    return rest.length === 0 ? { kind: 'fire', event, values: given } : { kind: 'ask', event, asks: rest, given };
}
