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
 * says so while the text typed is not one. Its Auto-start switch (R-SIM-134,
 * P-2026-10-04-1625) is on for a new Clock: it switches itself on with the run.
 *
 * A draft over the model's `ioBoard` key (boardCodec.ts): Apply writes it in one
 * `state` assignment, one undo step. The key is not a `sim*` key, so the write
 * never moves `runSignature`: a run of the model goes on (report §2). Cancel, the
 * close button and Escape discard the draft. What the board binds to is read once
 * on open (`boardContextOf`, the model's net as Reset would compile it): the
 * dialog is modal, and a model edit interrupts a run anyway.
 *
 * The styles of the front panel (R-SIM-133, P-2026-10-04-1131): above the grid,
 * the board's theme, accent (five swatches and Auto) and columns; the grid on the
 * board's columns, each tile over its span, the cells it covers not drawn as
 * targets; in the inspector, the style fields of the device's kind (simBoard.ts
 * `setStyle`), its span (`setSpan`, refused off the grid or over another device),
 * and for a Button or a Clock an icon picker over the installed Bootstrap icons,
 * loaded on first use, with Auto (the suggestion and its rule) and None. The
 * palette gains the Buzzer under Outputs and the Silkscreen under Panel.
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
    BINDING_KINDS, BOARD_COLS, BOARD_ROWS, BOARD_THEMES, BUTTON_ROLES, BUTTON_SHAPES, CLOCK_PERIOD_DEFAULT, CLOCK_PERIOD_MAX, CLOCK_PERIOD_MIN, DEVICE_KINDS,
    DISPLAY_FACES, DISPLAY_SIZES, ICON_MODES, IO_BOARD_KEY, KEYPAD_KEYS, LED_COLORS, LED_SHAPES, SPAN_MAX_COLUMNS, SPAN_MAX_ROWS, STYLE_FIELDS, boardCols,
    decodeBoard, encodeBoard, isClockPeriod, isInputKind, spanOf,
} from '../../../model/simulation/boardCodec';
import type { BindingKind, BoardBinding, BoardCols, BoardDevice, BoardSettings, BoardTheme, DeviceKind, StyleField } from '../../../model/simulation/boardCodec';
import {
    DEVICE_LABELS, addDevice, bindingCaption, boardContextOf, clockPeriodText, moveDevice, nuxmvRows, removeDevice, resolveDevice, setAccent, setBinding,
    setAutoStart, setBoardCols, setBoardTheme, setLabel, setPeriod, setSpan, setStyle,
} from './simBoard';
import type { BoardContext, BoardIvarChoice, DeviceStatus, DeviceStyleChange } from './simBoard';
import { pressLook } from './simBoardLook';
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

/** R-SIM-133: the accent's five swatches beside Auto, the theme's own. */
const ACCENTS: ReadonlyArray<{ color: string; name: string }> = [
    { color: '#e8590c', name: 'Orange' }, { color: '#1c7ed6', name: 'Blue' }, { color: '#2f9e44', name: 'Green' },
    { color: '#ae3ec9', name: 'Violet' }, { color: '#f59f00', name: 'Amber' },
];

const THEME_LABEL: Readonly<Record<BoardTheme, string>> = { graphite: 'Graphite', appliance: 'Appliance', instrument: 'Instrument', print: 'Print' };

/** The words of each style field and of its values (R-SIM-126). */
const STYLE_LABEL: Readonly<Record<StyleField, string>> = {
    shape: 'Shape', role: 'Role', icon: 'Icon', iconMode: 'Icon and text', key: 'Shortcut key', size: 'Size', face: 'Face', color: 'Colour',
};

/** The icons the picker shows at once; a search narrows them. */
const PICKER_LIMIT = 60;

/** The installed Bootstrap icon names, loaded on first use: the picker's list (no new dependency, report H4). */
let iconNames: Promise<string[]> | null = null;
function loadIconNames(): Promise<string[]> {
    iconNames ??= import('bootstrap-icons/font/bootstrap-icons.json').then(m => Object.keys((m as { default?: Record<string, number> }).default ?? m).sort());
    return iconNames;
}

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
    // R-SIM-123: the board's own fields, beside its devices; the grid's columns are its.
    const [settings, setSettings] = useState<BoardSettings>(() => stored.settings ?? {});
    const cols = boardCols(settings);
    const [colsRefused, setColsRefused] = useState<BoardCols | null>(null);
    // The icon picker's search and the installed names, loaded when a Button or a Clock is chosen.
    const [iconQuery, setIconQuery] = useState('');
    const [icons, setIcons] = useState<string[] | null>(null);
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
    const changed = encodeBoard(draft, settings) !== encodeBoard(stored.devices, stored.settings) || !stored.readable;
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
    useEffect(() => { setIconQuery(''); }, [selected]);
    const picks = device !== null && (device.kind === 'button' || device.kind === 'clock');
    useEffect(() => {
        if (!picks || icons !== null) return;
        let live = true;
        loadIconNames().then(names => { if (live) setIcons(names); }, () => { if (live) setIcons([]); });
        return () => { live = false; };
    }, [picks, icons]);

    const add = (kind: DeviceKind): void => {
        const r = addDevice(draft, kind, cols);
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
        lmodel.state = { [IO_BOARD_KEY]: encodeBoard(draft, settings) };
        onApplied();
    };

    // The grid: every row up to the last one covered, and one more to drop into, within the board's rows.
    const lastRow = draft.reduce((m, d) => Math.max(m, d.cell[1] + spanOf(d)[1] - 1), -1);
    const shownRows = Math.min(BOARD_ROWS, Math.max(2, lastRow + 2));
    const at = (column: number, row: number) => draft.find(d => d.cell[0] === column && d.cell[1] === row) ?? null;
    // A cell a device covers beyond its own: neither a target nor a tile (R-SIM-125).
    const covered = (column: number, row: number) => draft.some(d => {
        const [w, h] = spanOf(d);
        return column >= d.cell[0] && column < d.cell[0] + w && row >= d.cell[1] && row < d.cell[1] + h && !(column === d.cell[0] && row === d.cell[1]);
    });
    const drop = (e: DragEvent, column: number, row: number): void => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (id) setDraft(d => moveDevice(d, id, [column, row], cols));
    };
    const onTileKey = (e: KeyboardEvent, d: BoardDevice): void => {
        const delta: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        const step = delta[e.key];
        if (!step) return;
        e.preventDefault();
        setDraft(all => moveDevice(all, d.id, [d.cell[0] + step[0], d.cell[1] + step[1]], cols));
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

    const chooseCols = (next: BoardCols): void => {
        const after = setBoardCols(settings, draft, next);
        setColsRefused(boardCols(after) === next ? null : next);
        setSettings(after);
    };
    const restyle = (d: BoardDevice, change: DeviceStyleChange): void => setDraft(all => setStyle(all, d.id, change));
    /** A select of a style field's values, with the default or Auto first (`null`: the field removed). */
    const styleSelect = (d: BoardDevice, field: StyleField, values: readonly string[], first: string): ReactElement => {
        const value = (d.style as Record<string, string> | undefined)?.[field] ?? '';
        return (
            <label className="sim-board-editor__field" key={field}>
                <span className="sim-board-editor__field-label">{STYLE_LABEL[field]}</span>
                <select
                    className="sim-roles-modal__select"
                    aria-label={STYLE_LABEL[field]}
                    value={value}
                    onChange={e => restyle(d, { [field]: e.target.value === '' ? null : e.target.value } as DeviceStyleChange)}
                >
                    <option value="">{first}</option>
                    {values.map(v => <option value={v} key={v}>{v}</option>)}
                </select>
            </label>
        );
    };
    /** The style of the device chosen (R-SIM-126, R-SIM-133): its kind's fields, its span, the icon picker. */
    const styleFields = (d: BoardDevice): ReactElement => {
        const fields = STYLE_FIELDS[d.kind];
        const [w, h] = spanOf(d);
        const pressed = d.binding?.kind === 'event' ? d.binding.event : null;
        const look = picks ? pressLook(d, pressed === null ? null : ctx.events.find(e => e.id === pressed)?.label ?? ctx.nameOf(pressed)) : null;
        const current = d.style?.icon;
        const query = iconQuery.trim().toLowerCase();
        const shown = (icons ?? []).filter(n => query === '' || n.includes(query)).slice(0, PICKER_LIMIT);
        const spanSelect = (axis: 0 | 1): ReactElement => (
            <label className="sim-board-editor__field">
                <span className="sim-board-editor__field-label">{axis === 0 ? 'Width (cells)' : 'Height (cells)'}</span>
                <select
                    className="sim-roles-modal__select"
                    aria-label={axis === 0 ? 'Span width' : 'Span height'}
                    value={axis === 0 ? w : h}
                    onChange={e => {
                        const v = Number(e.target.value);
                        setDraft(all => setSpan(all, d.id, axis === 0 ? [v, h] : [w, v], cols));
                    }}
                >
                    {Array.from({ length: axis === 0 ? SPAN_MAX_COLUMNS : SPAN_MAX_ROWS }, (_, i) => i + 1).map(v => <option value={v} key={v}>{v}</option>)}
                </select>
            </label>
        );
        return (
            <div className="sim-board-editor__style" role="group" aria-label="Style">
                <div className="sim-roles-modal__section">Style</div>
                <div className="sim-board-editor__pair">
                    {spanSelect(0)}
                    {spanSelect(1)}
                </div>
                <span className="sim-board-editor__hint">A span that leaves the grid or covers another device is refused.</span>
                {fields.includes('shape') && styleSelect(d, 'shape', d.kind === 'button' || d.kind === 'clock' ? BUTTON_SHAPES : LED_SHAPES, d.kind === 'button' || d.kind === 'clock' ? 'key (default)' : 'round (default)')}
                {fields.includes('role') && styleSelect(d, 'role', BUTTON_ROLES, look?.suggestion.role ? `Auto: ${look.suggestion.role}` : 'Auto: neutral')}
                {fields.includes('iconMode') && styleSelect(d, 'iconMode', ICON_MODES.filter(m => m !== 'both'), 'both (default)')}
                {fields.includes('key') && (
                    <label className="sim-board-editor__field">
                        <span className="sim-board-editor__field-label">{STYLE_LABEL.key}</span>
                        <select
                            className="sim-roles-modal__select"
                            aria-label={STYLE_LABEL.key}
                            value={d.style?.key ?? ''}
                            onChange={e => restyle(d, { key: e.target.value === '' ? null : e.target.value })}
                        >
                            <option value="">Auto</option>
                            <option value="none">None</option>
                            {[...'abcdefghijklmnopqrstuvwxyz0123456789'].map(k => (
                                <option value={k} key={k} disabled={draft.some(x => x.id !== d.id && x.style?.key === k)}>{k.toUpperCase()}</option>
                            ))}
                        </select>
                    </label>
                )}
                {fields.includes('size') && styleSelect(d, 'size', DISPLAY_SIZES.filter(v => v !== 'M'), 'M (default)')}
                {fields.includes('face') && styleSelect(d, 'face', DISPLAY_FACES, "Auto: the theme's")}
                {fields.includes('color') && styleSelect(d, 'color', LED_COLORS.filter(c => c !== (d.kind === 'pulse' ? 'amber' : 'green')), d.kind === 'pulse' ? 'amber (default)' : 'green (default)')}
                {picks && look && (
                    <div className="sim-board-editor__field">
                        <span className="sim-board-editor__field-label">{STYLE_LABEL.icon}</span>
                        <div className="sim-board-editor__icon-choices" role="radiogroup" aria-label="Icon">
                            <button
                                type="button"
                                role="radio"
                                aria-checked={current === undefined}
                                className="sim-board-editor__icon-choice"
                                title={look.suggestion.icon ? `Auto: ${look.suggestion.icon}, from the event's name (${look.suggestion.rule})` : "Auto: the event's name suggests no icon"}
                                onClick={() => restyle(d, { icon: null })}
                            >
                                {look.suggestion.icon && <i className={`bi bi-${look.suggestion.icon}`} />}
                                <span>Auto</span>
                            </button>
                            <button
                                type="button"
                                role="radio"
                                aria-checked={current === 'none'}
                                className="sim-board-editor__icon-choice"
                                title="No icon"
                                onClick={() => restyle(d, { icon: 'none' })}
                            >
                                <span>None</span>
                            </button>
                            {current !== undefined && current !== 'none' && (
                                <span className="sim-board-editor__icon-current" title={current}><i className={`bi bi-${current}`} /><span>{current}</span></span>
                            )}
                        </div>
                        <span className="sim-board-editor__hint">
                            {look.suggestion.icon ? `Suggested: ${look.suggestion.icon}, ${look.suggestion.rule}.` : "The event's name suggests no icon."}
                        </span>
                        <input
                            type="search"
                            className="sim-roles-modal__input"
                            aria-label="Search the icons"
                            placeholder={icons === null ? 'Loading the icons…' : `Search ${icons.length} icons`}
                            value={iconQuery}
                            onChange={e => setIconQuery(e.target.value)}
                        />
                        <div className="sim-board-editor__icons" role="listbox" aria-label="Icons">
                            {shown.map(name => (
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={current === name}
                                    key={name}
                                    className="sim-board-editor__icon"
                                    title={name}
                                    onClick={() => restyle(d, { icon: name })}
                                >
                                    <i className={`bi bi-${name}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

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
                        {(['Inputs', 'Outputs', 'Panel'] as const).map(group => (
                            <div className="sim-board-editor__group" key={group}>
                                <div className="sim-roles-modal__section">{group}</div>
                                {DEVICE_KINDS.filter(k => (k === 'silk' ? 'Panel' : isInputKind(k) ? 'Inputs' : 'Outputs') === group).map(k => (
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
                        <div className="sim-board-editor__look" role="group" aria-label="Front panel">
                            <label className="sim-board-editor__field">
                                <span className="sim-board-editor__field-label">Theme</span>
                                <select
                                    className="sim-roles-modal__select"
                                    aria-label="Theme"
                                    value={settings.theme ?? 'graphite'}
                                    onChange={e => setSettings(x => setBoardTheme(x, e.target.value as BoardTheme))}
                                >
                                    {BOARD_THEMES.map(t => <option value={t} key={t}>{THEME_LABEL[t]}</option>)}
                                </select>
                            </label>
                            <div className="sim-board-editor__field">
                                <span className="sim-board-editor__field-label">Accent</span>
                                <div className="sim-board-editor__swatches" role="radiogroup" aria-label="Accent">
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={settings.accent === undefined}
                                        className="sim-board-editor__swatch sim-board-editor__swatch--auto"
                                        title="Auto: the theme's own accent"
                                        onClick={() => setSettings(x => setAccent(x, null))}
                                    >
                                        Auto
                                    </button>
                                    {ACCENTS.map(a => (
                                        <button
                                            type="button"
                                            role="radio"
                                            key={a.color}
                                            aria-checked={settings.accent === a.color}
                                            aria-label={a.name}
                                            className="sim-board-editor__swatch"
                                            title={settings.theme === 'print' ? `${a.name}: Print draws in black, it keeps no accent` : a.name}
                                            style={{ backgroundColor: a.color }}
                                            onClick={() => setSettings(x => setAccent(x, a.color))}
                                        />
                                    ))}
                                </div>
                            </div>
                            <label className="sim-board-editor__field">
                                <span className="sim-board-editor__field-label">Columns</span>
                                <select className="sim-roles-modal__select" aria-label="Columns" value={cols} onChange={e => chooseCols(Number(e.target.value) as BoardCols)}>
                                    {BOARD_COLS.map(c => <option value={c} key={c}>{c}</option>)}
                                </select>
                            </label>
                            <span className="sim-board-editor__hint">
                                {colsRefused !== null
                                    ? `Not ${colsRefused}: a device covers a column beyond it. Move it first.`
                                    : cols > 4 ? `${cols} columns: the board opens as a window over the canvas.` : 'Theme and accent dress the front panel only.'}
                            </span>
                        </div>
                        <div className="sim-board-editor__grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} role="grid" aria-label="Board in edit mode">
                            {Array.from({ length: shownRows }, (_, row) => Array.from({ length: cols }, (__, column) => {
                                if (covered(column, row)) return null;
                                const d = at(column, row);
                                if (!d) {
                                    return (
                                        <div
                                            key={`${column},${row}`}
                                            className="sim-board-editor__cell"
                                            role="gridcell"
                                            style={{ gridColumn: column + 1, gridRow: row + 1 }}
                                            title={device ? `Move ${device.label || device.id} here` : undefined}
                                            onClick={() => { if (device) setDraft(all => moveDevice(all, device.id, [column, row], cols)); }}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={e => drop(e, column, row)}
                                        />
                                    );
                                }
                                const s = statuses.get(d.id);
                                const flagged = !!s && !s.ok;
                                const [w, h] = spanOf(d);
                                return (
                                    <button
                                        type="button"
                                        key={d.id}
                                        role="gridcell"
                                        data-device={d.id}
                                        style={{ gridColumn: `${column + 1} / span ${w}`, gridRow: `${row + 1} / span ${h}` }}
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
                                {device.kind === 'clock' && (
                                    <div className="sim-board-editor__field">
                                        <label className="sim-board-editor__check">
                                            <input
                                                type="checkbox"
                                                role="switch"
                                                aria-label="Auto-start"
                                                checked={device.autoStart === true}
                                                onChange={e => setDraft(d => setAutoStart(d, device.id, e.target.checked))}
                                            />
                                            <span>Auto-start</span>
                                        </label>
                                        <span className="sim-board-editor__hint">
                                            {device.autoStart === true
                                                ? 'On with the run, at Reset. Its switch on the board pauses it until the next Reset.'
                                                : 'Off until switched on by hand on the board.'}
                                        </span>
                                    </div>
                                )}
                                {styleFields(device)}
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
