/**
 * simBoard — the I/O board against a model and its run (R-SIM-110..115;
 * P-2026-10-03-1845 Lane 1, docs/discovery/discovery_2026-10-03_sim_io_board.md §3, §5,
 * §6, §7).
 *
 * - `boardContextOf` and `boardContextOfRun`: what a board can bind to. From the
 *   model, without a run, for the editor: the net compiled as `startRun` compiles
 *   it (the role bag as `runBag` reads it, the model's globals over the
 *   metamodel's), no snapshot; from a run, its own net and the snapshot its
 *   oracles close over, for the outputs' R2 checks and their evaluation.
 * - `resolveDevice`: whether a device's binding still resolves. A binding that no
 *   longer does flags its device and never the run: board defects never join a
 *   run's compile defects (R-SIM-115). What needs state attributes is flagged
 *   with the panel's own words under a profile that turns them off (R-SIM-78);
 *   `X.[marked]` and the events do not need them.
 * - `heldAnswer`: the values a Switch or a Slider holds answer the inputs a press
 *   asks (R-SIM-111); the rest goes to the input dialog of R-SIM-88.
 * - the keypad's value mode (R-SIM-112): the buffer is the device's, Enter gives
 *   the IVAR its value, a key that would leave the domain is off with its reason.
 * - the editor's operations on a draft: add, move, bind, label, remove, and a
 *   Clock's period (R-SIM-122).
 * - the caption of a binding and the table device → binding → nuXmv (R-SIM-111):
 *   inputs are the event set or an IVAR the model declares, outputs DEFINE, the
 *   Pulse LED and the configuration out of the export.
 *
 * Pure: no React, no store, no import from the joiner, so it runs under the node
 * test bench (sim/__tests__/simBoard.test.ts).
 */

import { BOARD_COLUMNS, BOARD_ROWS, CLOCK_PERIOD_DEFAULT, CLOCK_PERIOD_MAX, CLOCK_PERIOD_MIN, bindingFits, isClockPeriod, onGrid } from '../../../model/simulation/boardCodec';
import type { BoardBinding, BoardDevice, DeviceKind } from '../../../model/simulation/boardCodec';
import { compileOutput } from '../../../model/simulation/boardOutputs';
import { compileNet, eventAlphabet, netStcFromRoles } from '../../../model/simulation/netCompile';
import { objectLabel } from '../../../model/simulation/objectSlots';
import { decodeStateAttributes, mergeDeclarations, STATE_ATTRIBUTES_KEY } from '../../../model/simulation/stateAttributesCodec';
import type { SimSnapshot } from '../../../model/simulation/guardContext';
import type { CompiledNet, Domain, InputRead, SimValue } from '../../../model/simulation/netTypes';
import { candidateLabel, collectModelObjectIds, inputLabel, makeNetModelView, modelRunBag, runBag } from './simBridge';
import type { InputValue } from './simBridge';
import { parseInputValue } from './simInputs';
import { storedProfile } from './simRoleStatus';
import type { SimRun } from './simRunState';

type Lookup = Record<string, any>;

/** The words of the palette, the table and the captions. */
export const DEVICE_LABELS: Readonly<Record<DeviceKind, string>> = {
    button: 'Button', switch: 'Switch', slider: 'Slider', keypad: 'Keypad', clock: 'Clock',
    led: 'LED', pulse: 'Pulse LED', seven: '7-segment', text: 'Text display', gauge: 'Gauge',
};

export interface BoardChoice {
    readonly id: string;
    readonly label: string;
}

/** An input variable a device can answer (R-SIM-88): its element (the model for a global), its name, its domain. */
export interface BoardIvarChoice {
    readonly element: string;
    readonly attr: string;
    readonly label: string;
    readonly domain: Domain;
}

/** A σ attribute a Gauge can read: stored (VAR) or derived (DEFINE), semantic, with a domain. */
export interface BoardAttrChoice {
    readonly element: string;
    readonly attr: string;
    readonly label: string;
    readonly domain: Domain;
    readonly kind: 'VAR' | 'DEFINE';
}

/** What a board binds to and resolves against. */
export interface BoardContext {
    readonly modelId: string;
    readonly profileName: string;
    /** The profile turns the declarations off (R-SIM-78): no IVAR, no attribute reaches the run. */
    readonly stateAttributesOff: boolean;
    /** The run's alphabet, with the panel's labels. */
    readonly events: readonly BoardChoice[];
    readonly places: readonly BoardChoice[];
    readonly transitions: readonly BoardChoice[];
    readonly ivars: readonly BoardIvarChoice[];
    readonly attrs: readonly BoardAttrChoice[];
    readonly net: Pick<CompiledNet, 'modelId' | 'attributes' | 'declared' | 'places'>;
    /** The run's frozen M; absent from the model's context, which has no run. */
    readonly snapshot?: SimSnapshot;
    readonly exists: (id: string) => boolean;
    readonly nameOf: (id: string) => string;
}

export type DeviceStatus =
    | { readonly ok: true }
    | { readonly ok: false; readonly reason: string; readonly stateAttributes?: true };

/** The panel's hint of a profile without state attributes (SimulationPanel.tsx `stateAccessHint`), its line. */
export function stateAttributesReason(profileName: string): string {
    return `«${profileName}» has no state attributes: use Extended state machine.`;
}

function nameIn(lookup: Lookup): (id: string) => string {
    return id => {
        const name = lookup[id]?.name;
        return typeof name === 'string' && name ? name : objectLabel(lookup, id);
    };
}

function contextOf(
    net: CompiledNet, events: readonly BoardChoice[], lookup: Lookup, configRaw: Record<string, unknown>, snapshot?: SimSnapshot,
): BoardContext {
    const { profile } = storedProfile(configRaw);
    const nameOf = nameIn(lookup);
    const ivars: BoardIvarChoice[] = [];
    const attrs: BoardAttrChoice[] = [];
    for (const [element, byName] of net.declared) {
        for (const decl of byName.values()) {
            if (decl.space !== 'semantic' || decl.domain === null) continue;
            const label = inputLabel({ element, attr: decl.name }, net, lookup);
            if (decl.input === true) ivars.push({ element, attr: decl.name, label, domain: decl.domain });
            else attrs.push({ element, attr: decl.name, label, domain: decl.domain, kind: decl.equation !== undefined ? 'DEFINE' : 'VAR' });
        }
    }
    return {
        modelId: net.modelId,
        profileName: profile.name,
        stateAttributesOff: profile.modes.stateAttributes.mode === 'off',
        events,
        places: [...net.places].map(id => ({ id, label: nameOf(id) })),
        transitions: net.transitions.map(t => ({ id: t.id, label: candidateLabel(net, t.id, lookup) })),
        ivars,
        attrs,
        net,
        ...(snapshot ? { snapshot } : {}),
        exists: id => !!lookup[id],
        nameOf,
    };
}

/**
 * The context of a model without a run, for the editor: the net as `startRun` compiles it (simBridge.ts), the
 * declarations of both bags merged, no snapshot. `null` when the roles make no STC.
 */
export function boardContextOf(lookup: Lookup, modelId: string, configModelId: string | null): BoardContext | null {
    const raw: Record<string, unknown> = (configModelId ? lookup[configModelId]?._state : undefined) ?? {};
    const bag = runBag(raw, lookup);
    const stc = netStcFromRoles(bag);
    if (!stc) return null;
    const ids = collectModelObjectIds(lookup, modelId);
    const view = makeNetModelView(lookup, stc.eventIdentifier);
    const stored = bag[STATE_ATTRIBUTES_KEY];
    const declarations = decodeStateAttributes(stored === undefined || stored === null ? undefined : String(stored));
    const own = modelRunBag(lookup, modelId, raw)[STATE_ATTRIBUTES_KEY];
    const modelDeclarations = decodeStateAttributes(own === undefined || own === null ? undefined : String(own));
    const net = compileNet(stc, view, modelId, ids, mergeDeclarations(declarations, modelDeclarations).decls);
    return contextOf(net, eventAlphabet(stc, view, ids), lookup, raw);
}

/** The context of a run: its own net, alphabet and snapshot; the labels the panel gives its events. */
export function boardContextOfRun(run: SimRun, lookup: Lookup, configModelId: string | null): BoardContext {
    const raw: Record<string, unknown> = (configModelId ? lookup[configModelId]?._state : undefined) ?? {};
    const stc = netStcFromRoles(runBag(raw, lookup));
    // The label `makeNetModelView` gives an event, the one the panel's buttons carry (eventAlphabet).
    return contextOf(run.net, run.alphabet.map(id => ({ id, label: objectLabel(lookup, id, stc?.eventIdentifier) })), lookup, raw, run.snapshot);
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

const OK: DeviceStatus = { ok: true };
const flag = (reason: string): DeviceStatus => ({ ok: false, reason });

function eventStatus(id: string, ctx: BoardContext): DeviceStatus {
    if (ctx.events.some(e => e.id === id)) return OK;
    return flag(ctx.exists(id) ? 'Not an event of this model.' : 'The event no longer exists.');
}

function ivarLabel(ctx: BoardContext, element: string, attr: string): string {
    return element === ctx.modelId ? attr : `${ctx.nameOf(element)}.${attr}`;
}

function needsStateAttributes(ctx: BoardContext): DeviceStatus {
    return { ok: false, reason: stateAttributesReason(ctx.profileName), stateAttributes: true };
}

/** An IVAR of the model, or why the binding does not name one. */
function ivarOf(ctx: BoardContext, element: string, attr: string): BoardIvarChoice | DeviceStatus {
    if (ctx.stateAttributesOff) return needsStateAttributes(ctx);
    return ctx.ivars.find(i => i.element === element && i.attr === attr) ?? flag(`The input ${ivarLabel(ctx, element, attr)} is not declared.`);
}

const isStatus = (x: BoardIvarChoice | DeviceStatus): x is DeviceStatus => 'ok' in x;

function bindingStatus(kind: DeviceKind, b: BoardBinding, ctx: BoardContext): DeviceStatus {
    switch (b.kind) {
        case 'event':
            return eventStatus(b.event, ctx);
        case 'events': {
            const on = eventStatus(b.on, ctx);
            return on.ok ? eventStatus(b.off, ctx) : on;
        }
        case 'ivar': {
            const ivar = ivarOf(ctx, b.element, b.attr);
            if (isStatus(ivar)) return ivar;
            if (kind === 'switch' && ivar.domain.kind !== 'boolean') return flag(`${ivar.label} is not boolean.`);
            if (kind === 'slider' && ivar.domain.kind !== 'range') return flag(`${ivar.label} has no range domain.`);
            return OK;
        }
        case 'keypadValue': {
            const ivar = ivarOf(ctx, b.element, b.attr);
            if (isStatus(ivar)) return ivar;
            if (ivar.domain.kind !== 'range' || ivar.domain.min < 0) return flag(`${ivar.label} needs a range of whole numbers from 0.`);
            return eventStatus(b.enter, ctx);
        }
        case 'keypadEvents': {
            const bound = b.keys.filter(k => k !== '');
            if (bound.length === 0) return flag('No key is bound.');
            for (const k of bound) {
                const s = eventStatus(k, ctx);
                if (!s.ok) return s;
            }
            return OK;
        }
        case 'marked':
            if (ctx.places.some(p => p.id === b.place)) return OK;
            return flag(ctx.exists(b.place) ? 'Not a state of this model.' : 'The state no longer exists.');
        case 'expr': {
            const c = compileOutput(b.text, { net: ctx.net, snapshot: ctx.snapshot, nameOf: ctx.nameOf });
            if (c.defect === null) return OK;
            if (ctx.stateAttributesOff && c.defect.code === 'undeclared') return needsStateAttributes(ctx);
            return flag(c.defect.detail);
        }
        case 'transition':
            if (ctx.transitions.some(t => t.id === b.transition)) return OK;
            return flag(ctx.exists(b.transition) ? 'Not a transition of this model.' : 'The transition no longer exists.');
        case 'configuration':
            return OK;
        case 'attr': {
            if (ctx.stateAttributesOff) return needsStateAttributes(ctx);
            const attr = ctx.attrs.find(a => a.element === b.element && a.attr === b.attr);
            if (!attr) return flag(`${ivarLabel(ctx, b.element, b.attr)} is not declared.`);
            return attr.domain.kind === 'range' ? OK : flag(`${attr.label} has no range domain.`);
        }
    }
}

/** Whether a device's binding resolves in the context; the reason, for its title, when it does not. */
export function resolveDevice(device: BoardDevice, ctx: BoardContext): DeviceStatus {
    if (device.binding === null) return flag('Not bound.');
    if (!bindingFits(device.kind, device.binding)) return flag(`A ${DEVICE_LABELS[device.kind]} does not take this binding.`);
    // A Clock's period only a draft can carry out of range: the codec drops such a record (R-SIM-122).
    if (device.kind === 'clock' && device.period !== undefined && !isClockPeriod(device.period)) {
        return flag(`The period ${device.period} ms is outside ${CLOCK_PERIOD_MIN}..${CLOCK_PERIOD_MAX} ms.`);
    }
    return bindingStatus(device.kind, device.binding, ctx);
}

// ---------------------------------------------------------------------------
// Held inputs and the keypad
// ---------------------------------------------------------------------------

/**
 * The inputs a press asks, answered by the values the board holds: `given` in the order of the asks, matched
 * by element and name; `rest` for the dialog. A held value no ask names is dropped.
 */
export function heldAnswer(asks: readonly InputRead[], held: readonly InputValue[]): { given: InputValue[]; rest: InputRead[] } {
    const given: InputValue[] = [];
    const rest: InputRead[] = [];
    for (const a of asks) {
        const h = held.find(v => v.element === a.element && v.attr === a.attr);
        if (h) given.push(h); else rest.push(a);
    }
    return { given, rest };
}

/** The buffer after a key: a leading zero is replaced. */
export function keypadPress(buffer: string, digit: number): string {
    return buffer === '0' ? String(digit) : `${buffer}${digit}`;
}

/** Why a key is off in value mode, `null` when it is on: the buffer it would make is above the maximum. */
export function keypadKeyReason(domain: Domain, buffer: string, digit: number): string | null {
    if (domain.kind !== 'range') return 'The keypad needs a range.';
    const next = Number(keypadPress(buffer, digit));
    return next > domain.max ? `${next} is above ${domain.max}.` : null;
}

/** The value Enter gives the IVAR, or why it gives none. */
export function keypadEnterValue(domain: Domain, buffer: string): { value: SimValue } | { refused: string } {
    if (buffer === '') return { refused: 'Nothing typed.' };
    const value = parseInputValue(domain, buffer);
    if (value !== null) return { value };
    return { refused: domain.kind === 'range' ? `${buffer} is outside ${domain.min}..${domain.max}.` : `${buffer} is not a value of the input.` };
}

// ---------------------------------------------------------------------------
// The editor's operations
// ---------------------------------------------------------------------------

/** The first free cell, row by row; `null` when the grid is full. */
export function firstFreeCell(devices: readonly BoardDevice[]): [number, number] | null {
    const taken = new Set(devices.map(d => `${d.cell[0]},${d.cell[1]}`));
    for (let row = 0; row < BOARD_ROWS; row++) {
        for (let column = 0; column < BOARD_COLUMNS; column++) if (!taken.has(`${column},${row}`)) return [column, row];
    }
    return null;
}

/** A new unbound device in the first free cell, with the first free id `d1`, `d2`, …; `id` `''` when the grid is full. A Clock gets the default period. */
export function addDevice(devices: readonly BoardDevice[], kind: DeviceKind): { devices: BoardDevice[]; id: string } {
    const cell = firstFreeCell(devices);
    if (cell === null) return { devices: [...devices], id: '' };
    let n = 1;
    while (devices.some(d => d.id === `d${n}`)) n++;
    const id = `d${n}`;
    const device: BoardDevice = kind === 'clock'
        ? { id, kind, cell, label: '', binding: null, period: CLOCK_PERIOD_DEFAULT }
        : { id, kind, cell, label: '', binding: null };
    return { devices: [...devices, device], id };
}

/** A device moved to a cell; onto another device the two swap; off the grid, or unknown, nothing changes. */
export function moveDevice(devices: BoardDevice[], id: string, cell: readonly [number, number]): BoardDevice[] {
    const moving = devices.find(d => d.id === id);
    if (!moving || !onGrid(cell)) return devices;
    const other = devices.find(d => d.id !== id && d.cell[0] === cell[0] && d.cell[1] === cell[1]);
    return devices.map(d => (d.id === id ? { ...d, cell: [cell[0], cell[1]] } : d === other ? { ...d, cell: moving.cell } : d));
}

/** The binding of a device; one its kind does not take is refused and nothing changes. */
export function setBinding(devices: BoardDevice[], id: string, binding: BoardBinding | null): BoardDevice[] {
    const device = devices.find(d => d.id === id);
    if (!device || (binding !== null && !bindingFits(device.kind, binding))) return devices;
    return devices.map(d => (d.id === id ? { ...d, binding } : d));
}

/** A Clock's period (R-SIM-122): a whole number of milliseconds in range, for a clock only; anything else changes nothing. */
export function setPeriod(devices: BoardDevice[], id: string, ms: number): BoardDevice[] {
    const device = devices.find(d => d.id === id);
    if (!device || device.kind !== 'clock' || !isClockPeriod(ms)) return devices;
    return devices.map(d => (d.id === id ? { ...d, period: ms } : d));
}

export function setLabel(devices: BoardDevice[], id: string, label: string): BoardDevice[] {
    return devices.map(d => (d.id === id ? { ...d, label } : d));
}

export function removeDevice(devices: readonly BoardDevice[], id: string): BoardDevice[] {
    return devices.filter(d => d.id !== id);
}

// ---------------------------------------------------------------------------
// Captions and the nuXmv table
// ---------------------------------------------------------------------------

function eventCaption(ctx: BoardContext, id: string): string {
    return ctx.events.find(e => e.id === id)?.label ?? (ctx.exists(id) ? ctx.nameOf(id) : '(missing)');
}

function ivarCaption(ctx: BoardContext, element: string, attr: string): string {
    return ctx.ivars.find(i => i.element === element && i.attr === attr)?.label ?? ivarLabel(ctx, element, attr);
}

function domainText(domain: Domain): string {
    switch (domain.kind) {
        case 'boolean': return 'boolean';
        case 'range': return `${domain.min}..${domain.max}`;
        case 'enum': return `{${domain.literals.join(', ')}}`;
    }
}

/** A Clock's period in words: whole or decimal seconds from one second, milliseconds below. */
export function clockPeriodText(ms: number): string {
    return ms >= 1000 ? `${ms / 1000} s` : `${ms} ms`;
}

/** What a device is bound to, in a few words: the caption under it on the board, the binding column of the table. */
export function bindingCaption(device: BoardDevice, ctx: BoardContext): string {
    const b = device.binding;
    if (b === null) return 'unbound';
    switch (b.kind) {
        case 'event':
            return device.kind === 'clock'
                ? `${eventCaption(ctx, b.event)} every ${clockPeriodText(device.period ?? CLOCK_PERIOD_DEFAULT)}`
                : eventCaption(ctx, b.event);
        case 'events': return `${eventCaption(ctx, b.on)} / ${eventCaption(ctx, b.off)}`;
        case 'ivar': return `IVAR ${ivarCaption(ctx, b.element, b.attr)}`;
        case 'keypadValue': return `IVAR ${ivarCaption(ctx, b.element, b.attr)} · Enter ${eventCaption(ctx, b.enter)}`;
        case 'keypadEvents': {
            const n = b.keys.filter(k => k !== '').length;
            return `${n} ${n === 1 ? 'key' : 'keys'}`;
        }
        case 'marked': return `${ctx.places.find(p => p.id === b.place)?.label ?? (ctx.exists(b.place) ? ctx.nameOf(b.place) : '(missing)')}.[marked]`;
        case 'expr': return b.text;
        case 'transition': return ctx.transitions.find(t => t.id === b.transition)?.label ?? (ctx.exists(b.transition) ? ctx.nameOf(b.transition) : '(missing)');
        case 'configuration': return 'the configuration';
        case 'attr': return ctx.attrs.find(a => a.element === b.element && a.attr === b.attr)?.label ?? ivarLabel(ctx, b.element, b.attr);
    }
}

/** What a device is in nuXmv: an input names the event set or an IVAR the model declares, an output is a DEFINE. */
function nuxmvOf(device: BoardDevice, ctx: BoardContext): string {
    const b = device.binding;
    if (b === null) return '—';
    const ivarDomain = (element: string, attr: string) => {
        const ivar = ctx.ivars.find(i => i.element === element && i.attr === attr);
        return ivar ? ` : ${domainText(ivar.domain)}` : '';
    };
    switch (b.kind) {
        case 'event':
            return device.kind === 'pulse' ? '— (reads the trace; not exported)' : `event = ${eventCaption(ctx, b.event)}`;
        case 'events': return `event ∈ {${eventCaption(ctx, b.on)}, ${eventCaption(ctx, b.off)}}`;
        case 'ivar': return `IVAR ${ivarCaption(ctx, b.element, b.attr)}${ivarDomain(b.element, b.attr)}`;
        case 'keypadValue':
            return `IVAR ${ivarCaption(ctx, b.element, b.attr)}${ivarDomain(b.element, b.attr)}; event = ${eventCaption(ctx, b.enter)}`;
        case 'keypadEvents': {
            const labels: string[] = [];
            for (const k of b.keys) if (k !== '' && !labels.includes(eventCaption(ctx, k))) labels.push(eventCaption(ctx, k));
            return `event ∈ {${labels.join(', ')}}`;
        }
        case 'marked':
        case 'expr':
            return `DEFINE ${device.id} := ${bindingCaption(device, ctx)}`;
        case 'transition': return '— (reads the trace; not exported)';
        case 'configuration': return '— (the configuration)';
        case 'attr': {
            const attr = ctx.attrs.find(a => a.element === b.element && a.attr === b.attr);
            return attr ? `reads ${attr.kind} ${attr.label} : ${domainText(attr.domain)}` : `reads ${bindingCaption(device, ctx)}`;
        }
    }
}

export interface NuxmvRow {
    readonly id: string;
    /** The kind and the device's label, or its id. */
    readonly device: string;
    readonly binding: string;
    readonly nuxmv: string;
}

/** The editor's table, one row per device in the board's order. */
export function nuxmvRows(devices: readonly BoardDevice[], ctx: BoardContext): NuxmvRow[] {
    return devices.map(d => ({
        id: d.id, device: `${DEVICE_LABELS[d.kind]} ${d.label || d.id}`, binding: bindingCaption(d, ctx), nuxmv: nuxmvOf(d, ctx),
    }));
}
