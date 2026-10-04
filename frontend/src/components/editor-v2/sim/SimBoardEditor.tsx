/**
 * SimBoardEditor — the editor of a model's I/O board (R-SIM-115; P-2026-10-03-1845
 * Lane 1, docs/discovery/discovery_2026-10-03_sim_io_board.md §8).
 *
 * Four parts in one dialog, as R-SIM-115 lists them: the palette of the fixed
 * library (R-SIM-111), the board in edit mode (a grid of four columns, one tile
 * per device, its caption under it, a flag where the binding does not resolve),
 * the binding inspector of the device chosen, and the table device → binding →
 * nuXmv. A tile moves by dragging it, or with the arrow keys, onto any cell; onto
 * another device the two swap (`moveDevice`).
 *
 * A Clock (R-SIM-122) takes the Button's event picker and a period field in
 * milliseconds: the field writes the draft only with a whole number in range, and
 * says so while the text typed is not one.
 *
 * A draft over the model's `ioBoard` key (boardCodec.ts): Apply writes it in one
 * `state` assignment, one undo step. The key is not a `sim*` key, so the write
 * never moves `runSignature`: a run of the model goes on (report §2). Cancel, the
 * close button and Escape discard the draft. What the board binds to is read once
 * on open (`boardContextOf`, the model's net as Reset would compile it): the
 * dialog is modal, and a model edit interrupts a run anyway.
 *
 * Opened from the board (Lane 2, `sim-io-board-skins`); nothing in the app mounts
 * it before that lane. Portaled onto `document.body` with the classes of the
 * roles dialog (SimRolesModal.scss), and it stops keyboard and pointer events at
 * its root for the same reason: the editor's own handlers would receive them.
 */

import { DragEvent, KeyboardEvent, ReactElement, SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LPointerTargetable, store } from '../../../joiner';
import {
    BINDING_KINDS, BOARD_COLUMNS, BOARD_ROWS, CLOCK_PERIOD_DEFAULT, CLOCK_PERIOD_MAX, CLOCK_PERIOD_MIN, DEVICE_KINDS, IO_BOARD_KEY, KEYPAD_KEYS, decodeBoard,
    encodeBoard, isClockPeriod, isInputKind,
} from '../../../model/simulation/boardCodec';
import type { BindingKind, BoardBinding, BoardDevice, DeviceKind } from '../../../model/simulation/boardCodec';
import {
    DEVICE_LABELS, addDevice, bindingCaption, boardContextOf, clockPeriodText, moveDevice, nuxmvRows, removeDevice, resolveDevice, setBinding, setLabel, setPeriod,
} from './simBoard';
import type { BoardContext, BoardIvarChoice, DeviceStatus } from './simBoard';
import './SimRolesModal.scss';
import './SimBoardEditor.scss';

export interface SimBoardEditorProps {
    /** The M1 model whose bag holds the board. */
    modelId: string;
    /** Its name, for the title; '' when unknown. */
    modelName: string;
    /** The raw `ioBoard` of the model's bag, `null` when unset. */
    boardRaw: string | null;
    onClose: () => void;
    onApplied: () => void;
}

/** Stops a React event at the dialog: the portal still bubbles through the editor's React tree. */
const stop = (e: SyntheticEvent) => e.stopPropagation();

/** The glyph of each kind, Bootstrap Icons. */
const KIND_ICON: Readonly<Record<DeviceKind, string>> = {
    button: 'bi-record-circle', switch: 'bi-toggle-on', slider: 'bi-sliders', keypad: 'bi-grid-3x3-gap', clock: 'bi-stopwatch',
    led: 'bi-lightbulb', pulse: 'bi-lightning-charge', seven: 'bi-123', text: 'bi-card-text', gauge: 'bi-speedometer2',
    buzzer: 'bi-bell',
    silk: 'bi-fonts',
};

/** The words of each binding form in the inspector's select. */
const FORM_LABEL: Readonly<Record<BindingKind, string>> = {
    event: 'An event', events: 'Two events, on and off', ivar: 'An input variable', keypadValue: 'A value (an IVAR, Enter fires)',
    keypadEvents: 'One event per key', marked: 'A state is marked', expr: 'Expression over σ', transition: 'A transition fires',
    configuration: 'The configuration', attr: 'An attribute',
};

/** A context with nothing to bind to: the roles of the metamodel make no STC. */
function emptyContext(modelId: string): BoardContext {
    return {
        modelId, profileName: '', stateAttributesOff: false, events: [], places: [], transitions: [], ivars: [], attrs: [],
        net: { modelId, attributes: [], declared: new Map(), places: new Set() }, exists: () => false, nameOf: id => id,
    };
}

/** The IVAR a device can answer: a switch a boolean, a slider and the keypad a range. */
function ivarsFor(kind: DeviceKind, ctx: BoardContext): readonly BoardIvarChoice[] {
    if (kind === 'switch') return ctx.ivars.filter(i => i.domain.kind === 'boolean');
    return ctx.ivars.filter(i => i.domain.kind === 'range');
}

/** A form chosen in the inspector before its fields are: the binding that needs nothing more, else none. */
function bindingOfForm(form: BindingKind): BoardBinding | null {
    if (form === 'configuration') return { kind: 'configuration' };
    if (form === 'keypadEvents') return { kind: 'keypadEvents', keys: Array<string>(KEYPAD_KEYS).fill('') };
    return null;
}

export function SimBoardEditor(props: SimBoardEditorProps): ReactElement {
    const { modelId, modelName, boardRaw, onClose, onApplied } = props;
    const stored = useMemo(() => decodeBoard(boardRaw), [boardRaw]);
    const [draft, setDraft] = useState<BoardDevice[]>(() => stored.devices);
    const [selected, setSelected] = useState<string | null>(null);
    // The form chosen per device while its fields are not: a device's binding, once complete, says its own form.
    const [forms, setForms] = useState<Record<string, BindingKind>>({});
    // The fields of a two-part binding chosen while the other part is not, per device: it binds once complete.
    const [partial, setPartial] = useState<Record<string, Partial<Record<'on' | 'off' | 'element' | 'attr' | 'enter', string>>>>({});
    const [exprDraft, setExprDraft] = useState<string | null>(null);
    // A Clock's period while typed (R-SIM-122): the draft takes it only as a whole number in range.
    const [periodDraft, setPeriodDraft] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    // What the board binds to, read once on open: the model's net as Reset would compile it.
    const ctx = useMemo<BoardContext>(() => {
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const config = lookup[modelId]?.instanceof;
        return boardContextOf(lookup, modelId, typeof config === 'string' ? config : null) ?? emptyContext(modelId);
    }, [modelId]);
    const statuses = useMemo(() => new Map(draft.map(d => [d.id, resolveDevice(d, ctx)] as [string, DeviceStatus])), [draft, ctx]);
    const rows = useMemo(() => nuxmvRows(draft, ctx), [draft, ctx]);
    const changed = encodeBoard(draft) !== encodeBoard(stored.devices) || !stored.readable;
    const device = draft.find(d => d.id === selected) ?? null;
    const form: BindingKind | null = device ? device.binding?.kind ?? forms[device.id] ?? BINDING_KINDS[device.kind][0] : null;

    // Escape closes without writing: from inside, the root's onKeyDown; with the focus outside, this listener.
    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    useEffect(() => { dialogRef.current?.focus(); }, []);
    useEffect(() => { setExprDraft(null); }, [selected]);
    useEffect(() => { setPeriodDraft(null); }, [selected]);

    const add = (kind: DeviceKind): void => {
        const r = addDevice(draft, kind);
        if (r.id === '') return;
        setDraft(r.devices);
        setSelected(r.id);
    };
    const bind = (binding: BoardBinding | null): void => {
        if (device) setDraft(d => setBinding(d, device.id, binding));
    };
    const chooseForm = (next: BindingKind): void => {
        if (!device) return;
        setForms(f => ({ ...f, [device.id]: next }));
        setPartial(x => ({ ...x, [device.id]: {} }));
        bind(bindingOfForm(next));
    };
    const remove = (): void => {
        if (!device) return;
        setDraft(d => removeDevice(d, device.id));
        setSelected(null);
    };
    const apply = (): void => {
        const lmodel: any = LPointerTargetable.fromPointer(modelId as any);
        if (!lmodel || !changed) return;
        lmodel.state = { [IO_BOARD_KEY]: encodeBoard(draft) };
        onApplied();
    };

    // The grid: every row up to the last one used, and one more to drop into, within the board's rows.
    const lastRow = draft.reduce((m, d) => Math.max(m, d.cell[1]), -1);
    const shownRows = Math.min(BOARD_ROWS, Math.max(2, lastRow + 2));
    const at = (column: number, row: number) => draft.find(d => d.cell[0] === column && d.cell[1] === row) ?? null;
    const drop = (e: DragEvent, column: number, row: number): void => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (id) setDraft(d => moveDevice(d, id, [column, row]));
    };
    const onTileKey = (e: KeyboardEvent, d: BoardDevice): void => {
        const delta: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        const step = delta[e.key];
        if (!step) return;
        e.preventDefault();
        setDraft(all => moveDevice(all, d.id, [d.cell[0] + step[0], d.cell[1] + step[1]]));
    };

    const title = modelName ? `Board of ${modelName}` : 'Board';

    /** A select of choices by id; a stored id that is not among them is shown as missing, so nothing is rewritten silently. */
    const choiceSelect = (label: string, value: string, choices: ReadonlyArray<{ id: string; label: string }>, set: (id: string) => void): ReactElement => (
        <label className="sim-board-editor__field">
            <span className="sim-board-editor__field-label">{label}</span>
            <select className="sim-roles-modal__select" aria-label={label} value={value} onChange={e => set(e.target.value)}>
                <option value="" disabled={value !== ''}>{choices.length === 0 ? 'None in this model' : 'Choose…'}</option>
                {value !== '' && !choices.some(c => c.id === value) && <option value={value}>(missing)</option>}
                {choices.map(c => <option value={c.id} key={c.id}>{c.label}</option>)}
            </select>
        </label>
    );
    const ivarKey = (element: string, attr: string) => `${element}\u0000${attr}`;
    const ivarSelect = (kind: DeviceKind, element: string, attr: string, set: (element: string, attr: string) => void): ReactElement => {
        const choices = ivarsFor(kind, ctx).map(i => ({ id: ivarKey(i.element, i.attr), label: i.label }));
        return choiceSelect('Input variable', element ? ivarKey(element, attr) : '', choices, id => {
            const [e, a] = id.split('\u0000');
            set(e, a);
        });
    };

    /** The fields of the form chosen, for the device chosen. */
    const fields = (d: BoardDevice, f: BindingKind): ReactElement | null => {
        const b = d.binding;
        switch (f) {
            case 'event': {
                const value = b?.kind === 'event' ? b.event : '';
                return choiceSelect('Event', value, ctx.events, id => bind({ kind: 'event', event: id }));
            }
            case 'events': {
                const held = partial[d.id] ?? {};
                const on = b?.kind === 'events' ? b.on : held.on ?? '';
                const off = b?.kind === 'events' ? b.off : held.off ?? '';
                const set = (nextOn: string, nextOff: string) => {
                    setPartial(x => ({ ...x, [d.id]: { ...x[d.id], on: nextOn, off: nextOff } }));
                    if (nextOn && nextOff) bind({ kind: 'events', on: nextOn, off: nextOff });
                };
                return (
                    <>
                        {choiceSelect('On event', on, ctx.events, id => set(id, off))}
                        {choiceSelect('Off event', off, ctx.events, id => set(on, id))}
                    </>
                );
            }
            case 'ivar':
                return ivarSelect(d.kind, b?.kind === 'ivar' ? b.element : '', b?.kind === 'ivar' ? b.attr : '', (element, attr) => bind({ kind: 'ivar', element, attr }));
            case 'keypadValue': {
                const v = b?.kind === 'keypadValue' ? b : null;
                const held = partial[d.id] ?? {};
                const element = v?.element ?? held.element ?? '';
                const attr = v?.attr ?? held.attr ?? '';
                const enter = v?.enter ?? held.enter ?? '';
                const set = (next: { element: string; attr: string; enter: string }, hideOut: boolean) => {
                    setPartial(x => ({ ...x, [d.id]: { ...x[d.id], ...next } }));
                    if (next.element && next.attr && next.enter) bind({ kind: 'keypadValue', ...next, hideOut });
                };
                return (
                    <>
                        {ivarSelect(d.kind, element, attr, (e, a) => set({ element: e, attr: a, enter }, v?.hideOut ?? false))}
                        {choiceSelect('Enter event', enter, ctx.events, id => set({ element, attr, enter: id }, v?.hideOut ?? false))}
                        <label className="sim-board-editor__check">
                            <input
                                type="checkbox"
                                checked={v?.hideOut ?? false}
                                disabled={!v}
                                onChange={e => v && set({ element: v.element, attr: v.attr, enter: v.enter }, e.target.checked)}
                            />
                            <span>Hide the keys out of the domain</span>
                        </label>
                    </>
                );
            }
            case 'keypadEvents': {
                const keys = b?.kind === 'keypadEvents' ? b.keys : Array<string>(KEYPAD_KEYS).fill('');
                return (
                    <div className="sim-board-editor__keys">
                        {keys.map((k, i) => (
                            <label className="sim-board-editor__key" key={i}>
                                <span className="sim-board-editor__key-digit">{i}</span>
                                <select
                                    className="sim-roles-modal__select"
                                    aria-label={`Key ${i}`}
                                    value={k}
                                    onChange={e => bind({ kind: 'keypadEvents', keys: keys.map((x, j) => (j === i ? e.target.value : x)) })}
                                >
                                    <option value="">—</option>
                                    {k !== '' && !ctx.events.some(c => c.id === k) && <option value={k}>(missing)</option>}
                                    {ctx.events.map(c => <option value={c.id} key={c.id}>{c.label}</option>)}
                                </select>
                            </label>
                        ))}
                    </div>
                );
            }
            case 'marked': {
                const value = b?.kind === 'marked' ? b.place : '';
                return choiceSelect('State', value, ctx.places, id => bind({ kind: 'marked', place: id }));
            }
            case 'expr': {
                const committed = b?.kind === 'expr' ? b.text : '';
                const text = exprDraft ?? committed;
                const commit = () => { if (exprDraft !== null) { bind(exprDraft.trim() === '' ? null : { kind: 'expr', text: exprDraft }); setExprDraft(null); } };
                return (
                    <label className="sim-board-editor__field">
                        <span className="sim-board-editor__field-label">Expression</span>
                        <input
                            type="text"
                            className="sim-roles-modal__input sim-board-editor__expr"
                            aria-label="Expression"
                            placeholder="model.[coins] >= 2"
                            spellCheck={false}
                            value={text}
                            onChange={e => setExprDraft(e.target.value)}
                            onBlur={commit}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
                        />
                        <span className="sim-board-editor__hint">Read-only over σ: self is the model, event is null.</span>
                    </label>
                );
            }
            case 'transition': {
                const value = b?.kind === 'transition' ? b.transition : '';
                return choiceSelect('Transition', value, ctx.transitions, id => bind({ kind: 'transition', transition: id }));
            }
            case 'configuration':
                return <span className="sim-board-editor__hint">Shows the names of the marked states, two lines at most.</span>;
            case 'attr': {
                const value = b?.kind === 'attr' ? ivarKey(b.element, b.attr) : '';
                const choices = ctx.attrs.filter(a => a.domain.kind === 'range').map(a => ({ id: ivarKey(a.element, a.attr), label: `${a.label} (${a.kind})` }));
                return choiceSelect('Attribute', value, choices, id => {
                    const [element, attr] = id.split('\u0000');
                    bind({ kind: 'attr', element, attr });
                });
            }
        }
    };

    const status = device ? statuses.get(device.id) ?? null : null;

    return createPortal(
        <div
            className="sim-roles-modal-backdrop"
            role="presentation"
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') onClose(); }} onKeyUp={stop} onMouseDown={stop} onMouseUp={stop} onClick={stop} onDoubleClick={stop}
            onPointerDown={stop} onPointerUp={stop} onContextMenu={stop} onWheel={stop}
        >
            <div
                className="sim-roles-modal sim-roles-modal--wide sim-board-editor"
                role="dialog" aria-modal="true" aria-labelledby="sim-board-editor-title" tabIndex={-1} ref={dialogRef}
            >
                <div className="sim-roles-modal__header">
                    <div className="sim-roles-modal__title-row">
                        <h2 className="sim-roles-modal__title" id="sim-board-editor-title">{title}</h2>
                        <button type="button" className="sim-roles-modal__close" title="Close" aria-label="Close" onClick={onClose}>
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                    <span className="sim-roles-modal__subtitle">
                        The machine&apos;s environment: inputs press events and answer input variables, outputs read σ. Saved with the model.
                    </span>
                </div>
                <div className="sim-roles-modal__body sim-board-editor__body">
                    <nav className="sim-board-editor__palette" aria-label="Device library">
                        {(['Inputs', 'Outputs'] as const).map(group => (
                            <div className="sim-board-editor__group" key={group}>
                                <div className="sim-roles-modal__section">{group}</div>
                                {DEVICE_KINDS.filter(k => isInputKind(k) === (group === 'Inputs')).map(k => (
                                    <button type="button" className="sim-board-editor__palette-item" key={k} title={`Add a ${DEVICE_LABELS[k]}`} onClick={() => add(k)}>
                                        <i className={`bi ${KIND_ICON[k]}`} />
                                        <span>{DEVICE_LABELS[k]}</span>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </nav>
                    <div className="sim-board-editor__center">
                        <div className="sim-roles-modal__section">
                            Board<span className="sim-roles-modal__count">{draft.length}</span>
                        </div>
                        {!stored.readable && (
                            <div className="sim-roles-modal__warning">The stored board is not readable. Apply replaces it.</div>
                        )}
                        {stored.readable && stored.defects.length > 0 && (
                            <div className="sim-roles-modal__warning" title={stored.defects.map(d => d.message).join('\n')}>
                                {`${stored.defects.length} stored ${stored.defects.length === 1 ? 'device was' : 'devices were'} not read as written.`}
                            </div>
                        )}
                        <div className="sim-board-editor__grid" style={{ gridTemplateColumns: `repeat(${BOARD_COLUMNS}, 1fr)` }} role="grid" aria-label="Board in edit mode">
                            {Array.from({ length: shownRows }, (_, row) => Array.from({ length: BOARD_COLUMNS }, (__, column) => {
                                const d = at(column, row);
                                if (!d) {
                                    return (
                                        <div
                                            key={`${column},${row}`}
                                            className="sim-board-editor__cell"
                                            role="gridcell"
                                            title={device ? `Move ${device.label || device.id} here` : undefined}
                                            onClick={() => { if (device) setDraft(all => moveDevice(all, device.id, [column, row])); }}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={e => drop(e, column, row)}
                                        />
                                    );
                                }
                                const s = statuses.get(d.id);
                                const flagged = !!s && !s.ok;
                                return (
                                    <button
                                        type="button"
                                        key={d.id}
                                        role="gridcell"
                                        data-device={d.id}
                                        draggable
                                        className={`sim-board-editor__tile sim-board-editor__tile--${isInputKind(d.kind) ? 'input' : 'output'}`
                                            + `${flagged ? ' sim-board-editor__tile--flagged' : ''}${d.id === selected ? ' sim-board-editor__tile--selected' : ''}`}
                                        title={flagged && s && !s.ok ? `${DEVICE_LABELS[d.kind]} ${d.label || d.id}: ${s.reason}` : `${DEVICE_LABELS[d.kind]} ${d.label || d.id}`}
                                        aria-pressed={d.id === selected}
                                        onClick={() => setSelected(d.id)}
                                        onKeyDown={e => onTileKey(e, d)}
                                        onDragStart={e => { e.dataTransfer.setData('text/plain', d.id); e.dataTransfer.effectAllowed = 'move'; }}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={e => drop(e, column, row)}
                                    >
                                        <span className="sim-board-editor__tile-head">
                                            <i className={`bi ${KIND_ICON[d.kind]}`} />
                                            <span className="sim-board-editor__tile-name">{d.label || d.id}</span>
                                            {flagged && <i className="bi bi-exclamation-triangle sim-board-editor__tile-flag" />}
                                        </span>
                                        <span className="sim-board-editor__tile-caption">{bindingCaption(d, ctx)}</span>
                                    </button>
                                );
                            }))}
                        </div>
                        <div className="sim-roles-modal__section">nuXmv</div>
                        <div className="sim-board-editor__table-wrap">
                            <table className="sim-board-editor__table">
                                <thead>
                                    <tr><th>Device</th><th>Binding</th><th>nuXmv</th></tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 && (
                                        <tr><td colSpan={3} className="sim-board-editor__table-empty">No device. Add one from the library.</td></tr>
                                    )}
                                    {rows.map(r => (
                                        <tr key={r.id} className={statuses.get(r.id)?.ok === false ? 'sim-board-editor__row--flagged' : undefined}>
                                            <td>{r.device}</td><td className="sim-board-editor__mono">{r.binding}</td><td className="sim-board-editor__mono">{r.nuxmv}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <aside className="sim-board-editor__inspector" aria-label="Binding inspector">
                        {!device ? (
                            <div className="sim-board-editor__empty">Choose a device on the board, or add one from the library.</div>
                        ) : (
                            <>
                                <div className="sim-board-editor__inspector-head">
                                    <i className={`bi ${KIND_ICON[device.kind]}`} />
                                    <span className="sim-board-editor__inspector-title">{`${DEVICE_LABELS[device.kind]} ${device.id}`}</span>
                                    <span className="sim-board-editor__cell-text">{`cell ${device.cell[0] + 1}, ${device.cell[1] + 1}`}</span>
                                    <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--ghost" title="Remove the device" aria-label="Remove the device" onClick={remove}>
                                        <i className="bi bi-trash" />
                                    </button>
                                </div>
                                <label className="sim-board-editor__field">
                                    <span className="sim-board-editor__field-label">Label</span>
                                    <input
                                        type="text"
                                        className="sim-roles-modal__input"
                                        aria-label="Label"
                                        placeholder={device.id}
                                        value={device.label}
                                        onChange={e => setDraft(d => setLabel(d, device.id, e.target.value))}
                                    />
                                </label>
                                {BINDING_KINDS[device.kind].length > 1 && form && (
                                    <label className="sim-board-editor__field">
                                        <span className="sim-board-editor__field-label">Binding</span>
                                        <select className="sim-roles-modal__select" aria-label="Binding" value={form} onChange={e => chooseForm(e.target.value as BindingKind)}>
                                            {BINDING_KINDS[device.kind].map(k => <option value={k} key={k}>{FORM_LABEL[k]}</option>)}
                                        </select>
                                    </label>
                                )}
                                {form && fields(device, form)}
                                {device.kind === 'clock' && (() => {
                                    const period = device.period ?? CLOCK_PERIOD_DEFAULT;
                                    const typed = periodDraft === null || (periodDraft.trim() !== '' && isClockPeriod(Number(periodDraft)));
                                    return (
                                        <label className="sim-board-editor__field">
                                            <span className="sim-board-editor__field-label">Period (ms)</span>
                                            <input
                                                type="number"
                                                className="sim-roles-modal__input"
                                                aria-label="Period in milliseconds"
                                                title={`A whole number of milliseconds, ${CLOCK_PERIOD_MIN} to ${CLOCK_PERIOD_MAX}`}
                                                min={CLOCK_PERIOD_MIN}
                                                max={CLOCK_PERIOD_MAX}
                                                step={100}
                                                value={periodDraft ?? String(period)}
                                                onChange={e => {
                                                    const text = e.target.value;
                                                    setPeriodDraft(text);
                                                    if (text.trim() !== '' && isClockPeriod(Number(text))) setDraft(d => setPeriod(d, device.id, Number(text)));
                                                }}
                                                onBlur={() => setPeriodDraft(null)}
                                            />
                                            <span className="sim-board-editor__hint">
                                                {typed
                                                    ? `${CLOCK_PERIOD_MIN} to ${CLOCK_PERIOD_MAX} ms: the clock presses its event every ${clockPeriodText(period)} while it is on.`
                                                    : `Not a whole number from ${CLOCK_PERIOD_MIN} to ${CLOCK_PERIOD_MAX}: the period stays ${period} ms.`}
                                            </span>
                                        </label>
                                    );
                                })()}
                                {status && (
                                    <div className={`sim-board-editor__status sim-board-editor__status--${status.ok ? 'ok' : 'flagged'}`} role="status">
                                        <i className={`bi ${status.ok ? 'bi-check-circle' : 'bi-exclamation-triangle'}`} />
                                        <span>{status.ok ? 'Resolves in this model.' : status.reason}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </aside>
                </div>
                <div className="sim-roles-modal__footer">
                    <span className="sim-roles-modal__note">A Pulse LED reads the trace and a configuration display shows the marking; neither is exported.</span>
                    <div className="sim-roles-modal__actions sim-roles-modal__actions--end">
                        <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--secondary" onClick={onClose}>Cancel</button>
                        <button
                            type="button"
                            className="sim-roles-modal__btn sim-roles-modal__btn--primary"
                            disabled={!changed}
                            title={changed ? 'Write the board in one step; one undo reverts it. A run of this model goes on.' : 'Nothing to write'}
                            onClick={apply}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default SimBoardEditor;
