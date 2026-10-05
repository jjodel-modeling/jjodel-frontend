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
 *
 * The layout (R-SIM-143, P-2026-10-06-0100): a one-row header with the Theme
 * dropdown (the accent inside it) and the Columns dropdown; a body of two columns,
 * the live preview of the board on the left and the device list on the right; a
 * footer with the accent, the σ0 note, the counters and Cancel and Apply. The
 * preview draws every device with the front panel's own faces (simBoardDevices.tsx
 * `BoardDevice`, the panel skin, in the board's theme) over the initial state σ0 of
 * a run started for the preview and never registered (`startRun`, as Reset would);
 * a click selects, a drag moves onto free cells, an edge resizes
 * (simBoardEditorLayout.ts `dragResult`). The list groups the devices under Inputs
 * and Outputs; a click on a row selects its device, synced with the preview, and
 * expands it: label, binding, the read-only nuXmv line, size and delete, and under
 * Options what the inspector held before (the binding's form and its parts, a
 * Clock's period and auto-start, the style, the span, the icon picker). A device
 * whose binding does not resolve (`resolveDevice`) carries an amber dot on its row
 * and on the preview. Keys: simBoardEditorLayout.ts `editorKeyAction`.
 */

import { ReactElement, SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { DUser, LPointerTargetable, store } from '../../../joiner';
import {
    BINDING_KINDS, BOARD_COLS, BOARD_ROWS, BOARD_THEMES, BUTTON_ROLES, BUTTON_SHAPES, CLOCK_PERIOD_DEFAULT, CLOCK_PERIOD_MAX, CLOCK_PERIOD_MIN,
    DISPLAY_FACES, DISPLAY_SIZES, ICON_MODES, IO_BOARD_KEY, KEYPAD_KEYS, LED_COLORS, LED_SHAPES, SPAN_MAX_COLUMNS, SPAN_MAX_ROWS, STYLE_FIELDS, boardCols,
    decodeBoard, encodeBoard, isClockPeriod, isInputKind, spanOf,
} from '../../../model/simulation/boardCodec';
import type { BindingKind, BoardBinding, BoardCols, BoardDevice, BoardSettings, BoardTheme, DeviceKind, StyleField } from '../../../model/simulation/boardCodec';
import {
    DEVICE_LABELS, addDevice, bindingCaption, boardContextOf, clockPeriodText, maxDisplayLength, moveDevice, nuxmvRows, removeDevice, resolveDevice, setAccent,
    setBinding, setAutoStart, setBoardCols, setBoardTheme, setLabel, setPeriod, setSpan, setStyle,
} from './simBoard';
import type { BoardContext, BoardIvarChoice, DeviceStatus, DeviceStyleChange } from './simBoard';
import { boardFaces, NO_HELD } from './simBoardFace';
import type { BoardInputsView, DeviceFace } from './simBoardFace';
import { boardAccent, boardKeys, boardTheme, displayLook, ledLook, pressLook } from './simBoardLook';
import { BoardDevice as BoardDeviceFace } from './simBoardDevices';
import type { DeviceActions, DeviceLook } from './simBoardDevices';
import {
    ADD_ENTRIES, NO_SELECTION, SEARCH_ABOVE, SIZE_CHOICES, afterRemove, applyState, bindingsToReview, cellAtPoint, dragResult, editorKeyAction, exportNote,
    listGroups, selectDevice, sizeChoiceOf, unsavedChanges,
} from './simBoardEditorLayout';
import type { AddEntry, BoardDrag, EditorSelection, GridTracks, ListGroup, SelectHow } from './simBoardEditorLayout';
import { startRun } from './simBridge';
import type { SimRun } from './simRunState';
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


/** The project of the current user, as the panel's Reset reads it (SimulationPanel.tsx `projectIdOfUser`); '' when none. */
function projectIdOfUser(): string {
    try {
        return (LPointerTargetable.fromPointer(DUser.current as any) as any)?.project?.id ?? '';
    } catch {
        return '';
    }
}

/** The preview presses nothing: its devices are drawn, never driven. */
const NO_ACTIONS: DeviceActions = { press: () => undefined, flip: () => undefined, slide: () => undefined, key: () => undefined, clock: () => undefined };

/** The words of the binding field of an expanded row (R-SIM-143): what the device does with what it is bound to. */
function bindingFieldLabel(kind: DeviceKind, form: BindingKind): string {
    switch (form) {
        case 'event': return isInputKind(kind) ? 'Fires event' : 'Reads event';
        case 'events':
        case 'keypadEvents':
        case 'keypadValue': return 'Fires event';
        case 'ivar': return 'Answers variable';
        case 'expr': return 'Reads expression';
        case 'marked': return 'Reads state';
        case 'transition': return 'Reads transition';
        case 'configuration': return 'Reads';
        case 'attr': return 'Reads attribute';
    }
}

const GROUP_LABEL: Readonly<Record<ListGroup, string>> = { inputs: 'Inputs', outputs: 'Outputs', panel: 'Panel' };

/** A drag on the preview while the pointer is down: the device, the edge or the move, the cell the pointer is over. */
interface PreviewDrag {
    readonly id: string;
    readonly mode: BoardDrag['mode'];
    readonly cell: [number, number];
}

/** The tracks of the preview's grid as the browser resolved them (`cellAtPoint`). */
function gridTracks(grid: HTMLElement): GridTracks {
    const cs = getComputedStyle(grid);
    const r = grid.getBoundingClientRect();
    const sizes = (v: string) => v.split(' ').map(parseFloat).filter(Number.isFinite);
    return {
        left: r.left + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.paddingLeft) || 0),
        top: r.top + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.paddingTop) || 0),
        columns: sizes(cs.gridTemplateColumns),
        rows: sizes(cs.gridTemplateRows),
        gap: parseFloat(cs.columnGap) || 0,
    };
}

/** Keeps the preview's faces out of the tab order and of the pointer: the slot around a face is what a user works on. */
const inert = (el: HTMLElement | null): void => { el?.setAttribute('inert', ''); };

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
    // R-SIM-143: one selection for the preview and the list, one row expanded (simBoardEditorLayout.ts).
    const [sel, setSel] = useState<EditorSelection>(NO_SELECTION);
    const selected = sel.selected;
    // The form chosen per device while its fields are not: a device's binding, once complete, says its own form.
    const [forms, setForms] = useState<Record<string, BindingKind>>({});
    // The fields of a two-part binding chosen while the other part is not, per device: it binds once complete.
    const [partial, setPartial] = useState<Record<string, Partial<Record<'on' | 'off' | 'element' | 'attr' | 'enter', string>>>>({});
    const [exprDraft, setExprDraft] = useState<string | null>(null);
    // A Clock's period while typed (R-SIM-122): the draft takes it only as a whole number in range.
    const [periodDraft, setPeriodDraft] = useState<string | null>(null);
    // The header's dropdowns and the Add menu, one open at a time; the Options of the expanded row; the list's search.
    const [menu, setMenu] = useState<'theme' | 'cols' | 'add' | null>(null);
    const [options, setOptions] = useState(false);
    const [query, setQuery] = useState('');
    const [copied, setCopied] = useState<string | null>(null);
    const [drag, setDrag] = useState<PreviewDrag | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // What the board binds to, read once on open: the model's net as Reset would compile it.
    const ctx = useMemo<BoardContext>(() => {
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const config = lookup[modelId]?.instanceof;
        return boardContextOf(lookup, modelId, typeof config === 'string' ? config : null) ?? emptyContext(modelId);
    }, [modelId]);
    // The preview's σ0: a run started as Reset starts one, read at step 0 and never registered, so no run of the model
    // moves; refused (the roles make no net), the outputs stay dark with the reason in the footer's title. The evaluation
    // context's builder is loaded on open, as the app already holds it: a static import of the jjscript barrel would put
    // its UI modules in the import chain of the board card and of its tests.
    const [preview, setPreview] = useState<{ run?: SimRun; refused?: string }>({});
    useEffect(() => {
        let live = true;
        import('../../../jjscript').then(({ buildEvalContext }) => {
            if (!live) return;
            const lookup: any = (store.getState() as any).idlookup ?? {};
            const config = lookup[modelId]?.instanceof;
            try {
                const started = startRun(lookup, modelId, typeof config === 'string' ? config : null, projectIdOfUser(), buildEvalContext, 0);
                setPreview(started.kind === 'started' ? { run: started.run } : { refused: started.reason });
            } catch (e) {
                setPreview({ refused: e instanceof Error ? e.message : String(e) });
            }
        }, (e: unknown) => { if (live) setPreview({ refused: e instanceof Error ? e.message : String(e) }); });
        return () => { live = false; };
    }, [modelId]);
    const statuses = useMemo(() => new Map(draft.map(d => [d.id, resolveDevice(d, ctx)] as [string, DeviceStatus])), [draft, ctx]);
    const rows = useMemo(() => nuxmvRows(draft, ctx), [draft, ctx]);
    const changes = unsavedChanges(stored, { devices: draft, settings });
    const apply = applyState(changes, stored.readable);
    const review = bindingsToReview(statuses.values());
    const device = draft.find(d => d.id === selected) ?? null;
    const form: BindingKind | null = device ? device.binding?.kind ?? forms[device.id] ?? BINDING_KINDS[device.kind][0] : null;

    // Escape closes without writing: from inside, the root's onKeyDown; with the focus outside, this listener. A key the
    // root already took (an open menu's Escape) is marked handled and left alone.
    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    useEffect(() => { dialogRef.current?.focus(); }, []);
    useEffect(() => { setExprDraft(null); }, [selected]);
    useEffect(() => { setPeriodDraft(null); }, [selected]);
    useEffect(() => { setIconQuery(''); }, [selected]);
    useEffect(() => { setOptions(false); }, [sel.expanded]);
    // The selected device's row in view, whichever side chose it.
    useEffect(() => {
        if (selected === null) return;
        listRef.current?.querySelector(`[data-row="${selected}"]`)?.scrollIntoView?.({ block: 'nearest' });
    }, [selected, sel.expanded]);
    useEffect(() => {
        if (copied === null) return;
        const t = window.setTimeout(() => setCopied(null), 1500);
        return () => window.clearTimeout(t);
    }, [copied]);
    const picks = device !== null && (device.kind === 'button' || device.kind === 'clock');
    useEffect(() => {
        if (!picks || icons !== null) return;
        let live = true;
        loadIconNames().then(names => { if (live) setIcons(names); }, () => { if (live) setIcons([]); });
        return () => { live = false; };
    }, [picks, icons]);

    const choose = (id: string, how: SelectHow): void => setSel(s => selectDevice(s, id, how));
    const add = (entry: AddEntry): void => {
        const r = addDevice(draft, entry.kind, cols);
        if (r.id === '') return;
        setDraft(entry.binding ? setBinding(r.devices, r.id, entry.binding) : r.devices);
        setSel(selectDevice(sel, r.id, 'open'));
        setMenu(null);
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
    const remove = (id: string): void => {
        setDraft(d => removeDevice(d, id));
        setSel(s => afterRemove(s, id));
    };
    const write = (): void => {
        const lmodel: any = LPointerTargetable.fromPointer(modelId as any);
        if (!lmodel || !apply.enabled) return;
        lmodel.state = { [IO_BOARD_KEY]: encodeBoard(draft, settings) };
        onApplied();
    };

    // The grid: every row up to the last one covered, and one more to drop into, within the board's rows.
    const lastRow = draft.reduce((m, d) => Math.max(m, d.cell[1] + spanOf(d)[1] - 1), -1);
    const shownRows = Math.min(BOARD_ROWS, Math.max(2, lastRow + 2));
    // A cell a device covers, its own included: no empty cell is drawn under it.
    const covered = (column: number, row: number) => draft.some(d => {
        const [w, h] = spanOf(d);
        return column >= d.cell[0] && column < d.cell[0] + w && row >= d.cell[1] && row < d.cell[1] + h;
    });

    /**
     * A drag on the preview, by the device (`move`) or by one of its edges: the cell under the pointer is read on the
     * grid's measured tracks, a move keeping the cell of the device the pointer took it by. Released without moving, a
     * press on the device opens it. The board takes the result through `dragResult`; a refused place changes nothing.
     */
    const startDrag = (e: ReactPointerEvent<HTMLElement>, d: BoardDevice, mode: BoardDrag['mode']): void => {
        const grid = gridRef.current;
        if (e.button !== 0 || !grid) return;
        e.preventDefault();
        e.stopPropagation();
        grid.focus({ preventScroll: true });
        const handle = e.currentTarget;
        handle.setPointerCapture?.(e.pointerId);
        const from = { x: e.clientX, y: e.clientY };
        const start = cellAtPoint(e.clientX, e.clientY, gridTracks(grid));
        const grab: [number, number] = mode === 'move' ? [start[0] - d.cell[0], start[1] - d.cell[1]] : [0, 0];
        let moved = false;
        let at: [number, number] = [d.cell[0], d.cell[1]];
        const target = (cell: [number, number]): [number, number] => (mode === 'move' ? [cell[0] - grab[0], cell[1] - grab[1]] : cell);
        const move = (m: PointerEvent): void => {
            moved = moved || Math.abs(m.clientX - from.x) + Math.abs(m.clientY - from.y) > 4;
            if (!moved) return;
            at = target(cellAtPoint(m.clientX, m.clientY, gridTracks(grid)));
            setDrag({ id: d.id, mode, cell: at });
        };
        const up = (): void => {
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', up);
            handle.removeEventListener('pointercancel', up);
            setDrag(null);
            if (moved) setDraft(all => dragResult(all, d.id, { mode, cell: at }, cols));
            else if (mode === 'move') choose(d.id, 'open');
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
        handle.addEventListener('pointercancel', up);
    };

    /** The editor's keys (R-SIM-143 item 5): an open menu's Escape closes the menu, the rest `editorKeyAction` maps. */
    const onKey = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
        e.stopPropagation();
        if (menu !== null && e.key === 'Escape') {
            e.preventDefault();
            setMenu(null);
            return;
        }
        const t = e.target as HTMLElement;
        const act = editorKeyAction({ key: e.key, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, target: t }, draft, selected);
        if (!act) return;
        e.preventDefault();
        switch (act.kind) {
            case 'close': onClose(); break;
            case 'select': choose(act.id, 'focus'); break;
            case 'move': setDraft(all => moveDevice(all, act.id, act.cell, cols)); break;
            case 'delete': remove(act.id); break;
            case 'expand': choose(act.id, 'open'); break;
        }
    };

    const title = modelName ? `Board of ${modelName}` : 'Board';

    /** A select of choices by id; a stored id that is not among them is shown as missing, so nothing is rewritten silently. Bare: the select alone, mono. */
    const choiceSelect = (label: string, value: string, choices: ReadonlyArray<{ id: string; label: string }>, set: (id: string) => void, bare = false): ReactElement => {
        const select = (
            <select className={`sim-roles-modal__select${bare ? ' sim-board-editor__mono' : ''}`} aria-label={label} value={value} onChange={e => set(e.target.value)}>
                <option value="" disabled={value !== ''}>{choices.length === 0 ? 'None in this model' : 'Choose…'}</option>
                {value !== '' && !choices.some(c => c.id === value) && <option value={value}>(missing)</option>}
                {choices.map(c => <option value={c.id} key={c.id}>{c.label}</option>)}
            </select>
        );
        if (bare) return select;
        return (
            <label className="sim-board-editor__field">
                <span className="sim-board-editor__field-label">{label}</span>
                {select}
            </label>
        );
    };
    const ivarKey = (element: string, attr: string) => `${element}\u0000${attr}`;
    const ivarSelect = (kind: DeviceKind, element: string, attr: string, set: (element: string, attr: string) => void, bare = false, label = 'Input variable'): ReactElement => {
        const choices = ivarsFor(kind, ctx).map(i => ({ id: ivarKey(i.element, i.attr), label: i.label }));
        return choiceSelect(label, element ? ivarKey(element, attr) : '', choices, id => {
            const [e, a] = id.split('\u0000');
            set(e, a);
        }, bare);
    };
    /** The expression of an output, committed on Enter and on blur; bare: the input alone, labelled by the row. */
    const exprInput = (d: BoardDevice, bare: boolean, label = 'Expression'): ReactElement => {
        const b = d.binding;
        const committed = b?.kind === 'expr' ? b.text : '';
        const text = exprDraft ?? committed;
        const commit = () => { if (exprDraft !== null) { bind(exprDraft.trim() === '' ? null : { kind: 'expr', text: exprDraft }); setExprDraft(null); } };
        const input = (
            <input
                type="text"
                className="sim-roles-modal__input sim-board-editor__expr"
                aria-label={label}
                placeholder="model.[coins] >= 2"
                spellCheck={false}
                value={text}
                onChange={e => setExprDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); commit(); } }}
            />
        );
        if (bare) return input;
        return (
            <label className="sim-board-editor__field">
                <span className="sim-board-editor__field-label">Expression</span>
                {input}
                <span className="sim-board-editor__hint">Read-only over σ: self is the model, event is null.</span>
            </label>
        );
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
            case 'expr':
                return exprInput(d, false);
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

    /**
     * The binding field of an expanded row (R-SIM-143): one control for a form of one part, mono; a form of several
     * parts (two events, a keypad) shows what it is bound to and keeps its parts under Options.
     */
    const bindingField = (d: BoardDevice, f: BindingKind): ReactElement => {
        const b = d.binding;
        const label = bindingFieldLabel(d.kind, f);
        switch (f) {
            case 'event':
                return choiceSelect(label, b?.kind === 'event' ? b.event : '', ctx.events, id => bind({ kind: 'event', event: id }), true);
            case 'marked':
                return choiceSelect(label, b?.kind === 'marked' ? b.place : '', ctx.places, id => bind({ kind: 'marked', place: id }), true);
            case 'transition':
                return choiceSelect(label, b?.kind === 'transition' ? b.transition : '', ctx.transitions, id => bind({ kind: 'transition', transition: id }), true);
            case 'ivar':
                return ivarSelect(d.kind, b?.kind === 'ivar' ? b.element : '', b?.kind === 'ivar' ? b.attr : '', (element, attr) => bind({ kind: 'ivar', element, attr }), true, label);
            case 'attr': {
                const choices = ctx.attrs.filter(a => a.domain.kind === 'range').map(a => ({ id: ivarKey(a.element, a.attr), label: `${a.label} (${a.kind})` }));
                return choiceSelect(label, b?.kind === 'attr' ? ivarKey(b.element, b.attr) : '', choices, id => {
                    const [element, attr] = id.split('\u0000');
                    bind({ kind: 'attr', element, attr });
                }, true);
            }
            case 'expr':
                return exprInput(d, true, label);
            default:
                return (
                    <span className="sim-board-editor__readonly sim-board-editor__mono" title={f === 'configuration' ? undefined : 'Set its parts under Options'}>
                        {b === null ? 'unbound' : bindingCaption(d, ctx)}
                    </span>
                );
        }
    };

    const chooseCols = (next: BoardCols): void => {
        const after = setBoardCols(settings, draft, next);
        const refused = boardCols(after) !== next;
        setColsRefused(refused ? next : null);
        setSettings(after);
        if (!refused) setMenu(null);
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

    // -- the preview: the front panel's own faces over σ0 (R-SIM-130..133), in the board's theme ---------------------
    const theme = boardTheme(settings);
    const accent = boardAccent(settings);
    const inputsView = useMemo<BoardInputsView>(
        () => ({ status: preview.run ? 'Running' : null, eventsOn: new Set(ctx.events.map(e => e.id)), noCandidate: new Map(), asks: new Map() }),
        [ctx, preview.run],
    );
    const lookupNow: Record<string, any> = (store.getState() as any).idlookup ?? {};
    const faces = boardFaces(draft, { run: preview.run, n: 0, ctx, inputs: inputsView, held: NO_HELD, lookup: lookupNow });
    const faceOf = new Map<string, DeviceFace>(faces.map(f => [f.id, f]));
    const keys = boardKeys(draft, d => faceOf.get(d.id)?.name ?? d.id);
    const eventLabelOf = (d: BoardDevice): string | null => (d.binding?.kind === 'event'
        ? ctx.events.find(e => e.id === (d.binding as { event: string }).event)?.label ?? ctx.nameOf(d.binding.event) : null);
    // As the card builds it (simBoardDevices.tsx `lookOf`), the panel skin's part.
    const lookOf = (d: BoardDevice): DeviceLook => ({
        ...(d.kind === 'button' || d.kind === 'clock' ? { press: pressLook(d, eventLabelOf(d)) } : {}),
        ...(keys.has(d.id) ? { key: keys.get(d.id) ?? null } : {}),
        ...(d.kind === 'text' || d.kind === 'seven' ? { display: displayLook(d, maxDisplayLength(d, ctx), theme) } : {}),
        ...(d.kind === 'led' || d.kind === 'pulse' ? { led: ledLook(d) } : {}),
        ...(accent ? { accent } : {}),
    });
    // The place a drag would give the device, drawn while the pointer is down; a place the board refuses draws nothing.
    const ghost = (() => {
        if (!drag) return null;
        const after = dragResult(draft, drag.id, { mode: drag.mode, cell: drag.cell }, cols);
        if (after === draft) return null;
        const d = after.find(x => x.id === drag.id);
        if (!d) return null;
        const [w, h] = spanOf(d);
        return <div className="sim-board-editor__ghost" aria-hidden="true" style={{ gridColumn: `${d.cell[0] + 1} / span ${w}`, gridRow: `${d.cell[1] + 1} / span ${h}` }} />;
    })();

    const accentName = settings.accent === undefined ? 'Auto' : ACCENTS.find(a => a.color === settings.accent)?.name ?? settings.accent;
    const groups = listGroups(draft);
    const q = query.trim().toLowerCase();
    const shownInList = (d: BoardDevice): boolean => q === '' || [d.label, DEVICE_LABELS[d.kind], bindingCaption(d, ctx)].some(t => t.toLowerCase().includes(q));
    const rowOf = new Map(rows.map(r => [r.id, r]));

    /** One row of the list: icon, label, binding, chevron; expanded, the device's fields (R-SIM-143). */
    const row = (d: BoardDevice): ReactElement => {
        const s = statuses.get(d.id);
        const flagged = !!s && !s.ok;
        const expanded = sel.expanded === d.id;
        const note = exportNote(d);
        const input = isInputKind(d.kind);
        const f: BindingKind | null = d.kind === 'silk' ? null : d.binding?.kind ?? forms[d.id] ?? BINDING_KINDS[d.kind][0];
        const nuxmv = rowOf.get(d.id)?.nuxmv ?? '—';
        const size = sizeChoiceOf(d);
        return (
            <div
                key={d.id}
                data-row={d.id}
                role="listitem"
                className={`sim-board-editor__row${d.id === selected ? ' sim-board-editor__row--selected' : ''}${expanded ? ' sim-board-editor__row--expanded' : ''}`}
            >
                <button
                    type="button"
                    className="sim-board-editor__row-head"
                    aria-expanded={expanded}
                    title={note ?? (flagged && s && !s.ok ? s.reason : undefined)}
                    onClick={() => choose(d.id, 'toggle')}
                >
                    <i className={`bi ${KIND_ICON[d.kind]} sim-board-editor__row-icon sim-board-editor__row-icon--${input ? 'input' : d.kind === 'silk' ? 'panel' : 'output'}`} />
                    <span className="sim-board-editor__row-label">{d.label || DEVICE_LABELS[d.kind]}</span>
                    {note && <span className="sim-board-editor__tag">preview</span>}
                    <span className="sim-board-editor__row-binding">{d.kind === 'silk' ? '' : bindingCaption(d, ctx)}</span>
                    {flagged && <span className="sim-board-editor__dot" role="img" aria-label="Binding to review" />}
                    <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'} sim-board-editor__chevron`} />
                </button>
                {expanded && (
                    <div className="sim-board-editor__row-body">
                        <label className="sim-board-editor__line">
                            <span className="sim-board-editor__line-label">Label</span>
                            <input
                                type="text"
                                className="sim-roles-modal__input"
                                aria-label="Label"
                                placeholder={DEVICE_LABELS[d.kind]}
                                value={d.label}
                                onChange={e => setDraft(all => setLabel(all, d.id, e.target.value))}
                            />
                        </label>
                        {f && (
                            <div className="sim-board-editor__line">
                                <span className="sim-board-editor__line-label">{bindingFieldLabel(d.kind, f)}</span>
                                {bindingField(d, f)}
                            </div>
                        )}
                        {d.kind !== 'silk' && (
                            <div className="sim-board-editor__line sim-board-editor__nuxmv" title={note ?? undefined}>
                                <span className="sim-board-editor__line-label">nuXmv</span>
                                <span className="sim-board-editor__nuxmv-line sim-board-editor__mono">{nuxmv}</span>
                                <button
                                    type="button"
                                    className="sim-board-editor__icon-btn"
                                    title={copied === d.id ? 'Copied' : 'Copy the nuXmv line'}
                                    aria-label="Copy the nuXmv line"
                                    onClick={() => { void navigator.clipboard?.writeText(nuxmv).then(() => setCopied(d.id), () => undefined); }}
                                >
                                    <i className={`bi ${copied === d.id ? 'bi-check2' : 'bi-copy'}`} />
                                </button>
                            </div>
                        )}
                        <div className="sim-board-editor__line">
                            <span className="sim-board-editor__line-label">Size</span>
                            <div className="sim-board-editor__segmented" role="radiogroup" aria-label="Size">
                                {SIZE_CHOICES.map(c => (
                                    <button
                                        type="button"
                                        role="radio"
                                        key={c.id}
                                        aria-checked={size === c.id}
                                        className="sim-board-editor__segment"
                                        title={`${c.label} cells; refused off the grid or over another device`}
                                        onClick={() => setDraft(all => setSpan(all, d.id, c.span, cols))}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="sim-board-editor__options-toggle"
                                aria-expanded={options}
                                title="The binding's form and parts, the style, the span and the icon"
                                onClick={() => setOptions(o => !o)}
                            >
                                Options<i className={`bi ${options ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                            </button>
                            <button type="button" className="sim-board-editor__icon-btn sim-board-editor__delete" title="Remove the device" aria-label="Remove the device" onClick={() => remove(d.id)}>
                                <i className="bi bi-trash" />
                            </button>
                        </div>
                        {flagged && s && !s.ok && (
                            <div className="sim-board-editor__problem" role="status">
                                <i className="bi bi-exclamation-triangle-fill" />
                                <span>{s.reason}</span>
                            </div>
                        )}
                        {options && (
                            <div className="sim-board-editor__options" role="group" aria-label="Options">
                                {f && BINDING_KINDS[d.kind].length > 1 && (
                                    <label className="sim-board-editor__field">
                                        <span className="sim-board-editor__field-label">Binding</span>
                                        <select className="sim-roles-modal__select" aria-label="Binding" value={f} onChange={e => chooseForm(e.target.value as BindingKind)}>
                                            {BINDING_KINDS[d.kind].map(k => <option value={k} key={k}>{FORM_LABEL[k]}</option>)}
                                        </select>
                                    </label>
                                )}
                                {f && (f === 'events' || f === 'keypadValue' || f === 'keypadEvents') && fields(d, f)}
                                {d.kind === 'clock' && (() => {
                                    const period = d.period ?? CLOCK_PERIOD_DEFAULT;
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
                                                    if (text.trim() !== '' && isClockPeriod(Number(text))) setDraft(all => setPeriod(all, d.id, Number(text)));
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
                                {d.kind === 'clock' && (
                                    <div className="sim-board-editor__field">
                                        <label className="sim-board-editor__check">
                                            <input
                                                type="checkbox"
                                                role="switch"
                                                aria-label="Auto-start"
                                                checked={d.autoStart === true}
                                                onChange={e => setDraft(all => setAutoStart(all, d.id, e.target.checked))}
                                            />
                                            <span>Auto-start</span>
                                        </label>
                                        <span className="sim-board-editor__hint">
                                            {d.autoStart === true
                                                ? 'On with the run, at Reset. Its switch on the board pauses it until the next Reset.'
                                                : 'Off until switched on by hand on the board.'}
                                        </span>
                                    </div>
                                )}
                                {styleFields(d)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const menuToggle = (which: 'theme' | 'cols' | 'add') => () => { setMenu(m => (m === which ? null : which)); if (which === 'cols') setColsRefused(null); };

    return createPortal(
        <div
            className="sim-roles-modal-backdrop"
            role="presentation"
            onKeyDown={onKey} onKeyUp={stop} onMouseDown={stop} onMouseUp={stop} onClick={stop} onDoubleClick={stop}
            onPointerDown={stop} onPointerUp={stop} onContextMenu={stop} onWheel={stop}
        >
            <div
                className="sim-roles-modal sim-roles-modal--wide sim-board-editor"
                role="dialog" aria-modal="true" aria-labelledby="sim-board-editor-title" tabIndex={-1} ref={dialogRef}
                onPointerDownCapture={e => {
                    // A press outside the open menu and its toggle closes it.
                    if (menu !== null && !(e.target as HTMLElement).closest('.sim-board-editor__menu, .sim-board-editor__menu-toggle')) setMenu(null);
                }}
            >
                <div className="sim-roles-modal__header sim-board-editor__header">
                    <div className="sim-board-editor__heading">
                        <h2 className="sim-roles-modal__title" id="sim-board-editor-title">{title}</h2>
                        <span className="sim-board-editor__subtitle">The machine&apos;s environment, saved with the model.</span>
                    </div>
                    <div className="sim-board-editor__tools">
                        <div className="sim-board-editor__dropdown">
                            <button
                                type="button"
                                className="sim-roles-modal__btn sim-roles-modal__btn--secondary sim-board-editor__menu-toggle"
                                aria-haspopup="menu"
                                aria-expanded={menu === 'theme'}
                                title="Theme and accent of the front panel"
                                onClick={menuToggle('theme')}
                            >
                                <span
                                    className={`sim-board-editor__theme-swatch sim-board-editor__theme-swatch--${theme}`}
                                    style={settings.accent !== undefined && theme !== 'print' ? { backgroundColor: settings.accent } : undefined}
                                    aria-hidden="true"
                                />
                                <span>{THEME_LABEL[theme]}</span>
                                <i className="bi bi-chevron-down" />
                            </button>
                            {menu === 'theme' && (
                                <div className="sim-board-editor__menu sim-board-editor__menu--right" role="menu" aria-label="Theme">
                                    <div className="sim-board-editor__menu-head">Theme</div>
                                    {BOARD_THEMES.map(t => (
                                        <button
                                            type="button"
                                            role="menuitemradio"
                                            key={t}
                                            aria-checked={theme === t}
                                            className="sim-board-editor__menu-item"
                                            onClick={() => setSettings(x => setBoardTheme(x, t))}
                                        >
                                            <span className={`sim-board-editor__theme-swatch sim-board-editor__theme-swatch--${t}`} aria-hidden="true" />
                                            <span>{THEME_LABEL[t]}</span>
                                            {theme === t && <i className="bi bi-check2 sim-board-editor__menu-check" />}
                                        </button>
                                    ))}
                                    <div className="sim-board-editor__menu-head">Accent</div>
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
                                    <span className="sim-board-editor__hint">Theme and accent dress the front panel only.</span>
                                </div>
                            )}
                        </div>
                        <div className="sim-board-editor__dropdown">
                            <button
                                type="button"
                                className="sim-roles-modal__btn sim-roles-modal__btn--secondary sim-board-editor__menu-toggle"
                                aria-haspopup="menu"
                                aria-expanded={menu === 'cols'}
                                title="Columns of the board"
                                onClick={menuToggle('cols')}
                            >
                                <i className="bi bi-grid-3x3" />
                                <span>{`${cols} cols`}</span>
                                <i className="bi bi-chevron-down" />
                            </button>
                            {menu === 'cols' && (
                                <div className="sim-board-editor__menu sim-board-editor__menu--right" role="menu" aria-label="Columns">
                                    {BOARD_COLS.map(c => (
                                        <button
                                            type="button"
                                            role="menuitemradio"
                                            key={c}
                                            aria-checked={cols === c}
                                            className="sim-board-editor__menu-item"
                                            onClick={() => chooseCols(c)}
                                        >
                                            <span>{`${c} columns`}</span>
                                            {cols === c && <i className="bi bi-check2 sim-board-editor__menu-check" />}
                                        </button>
                                    ))}
                                    <span className={`sim-board-editor__hint${colsRefused !== null ? ' sim-board-editor__hint--warning' : ''}`}>
                                        {colsRefused !== null
                                            ? `Not ${colsRefused}: a device covers a column beyond it. Move it first.`
                                            : 'At 6 or 8 columns the board opens as a window over the canvas.'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <button type="button" className="sim-roles-modal__close" title="Close" aria-label="Close" onClick={onClose}>
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                </div>
                <div className="sim-roles-modal__body sim-board-editor__body">
                    <section className="sim-board-editor__stage" aria-label="Preview">
                        {!stored.readable && (
                            <div className="sim-roles-modal__warning">The stored board is not readable. Apply replaces it.</div>
                        )}
                        {stored.readable && stored.defects.length > 0 && (
                            <div className="sim-roles-modal__warning" title={stored.defects.map(d => d.message).join('\n')}>
                                {`${stored.defects.length} stored ${stored.defects.length === 1 ? 'device was' : 'devices were'} not read as written.`}
                            </div>
                        )}
                        <div className="sim-board--panel sim-board-editor__panel">
                            <div
                                ref={gridRef}
                                className={`sim-board__front sim-board__front--${theme} sim-board-editor__front`}
                                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${shownRows}, minmax(56px, auto))` }}
                                role="grid"
                                aria-label="Board preview"
                                aria-description="Arrows select a device; Shift and an arrow move it; Delete removes it; Enter edits it."
                                tabIndex={0}
                            >
                                {Array.from({ length: shownRows }, (_, row) => Array.from({ length: cols }, (__, column) => (covered(column, row) ? null : (
                                    <div key={`${column},${row}`} className="sim-board-editor__cell" data-cell={`${column},${row}`} style={{ gridColumn: column + 1, gridRow: row + 1 }} />
                                ))))}
                                {draft.map(d => {
                                    const f = faceOf.get(d.id);
                                    if (!f) return null;
                                    const s = statuses.get(d.id);
                                    const flagged = !!s && !s.ok;
                                    const [w, h] = spanOf(d);
                                    const isSelected = d.id === selected;
                                    return (
                                        <div
                                            key={d.id}
                                            data-device={d.id}
                                            role="gridcell"
                                            aria-selected={isSelected}
                                            aria-label={`${DEVICE_LABELS[d.kind]} ${d.label || d.id}`}
                                            className={`sim-board-editor__slot${isSelected ? ' sim-board-editor__slot--selected' : ''}${drag?.id === d.id ? ' sim-board-editor__slot--dragged' : ''}`}
                                            style={{ gridColumn: `${d.cell[0] + 1} / span ${w}`, gridRow: `${d.cell[1] + 1} / span ${h}` }}
                                            title={flagged && s && !s.ok ? `${DEVICE_LABELS[d.kind]} ${d.label || d.id}: ${s.reason}` : `${DEVICE_LABELS[d.kind]} ${d.label || d.id}`}
                                            onPointerDown={e => startDrag(e, d, 'move')}
                                        >
                                            <div className="sim-board-editor__face" ref={inert}>
                                                <BoardDeviceFace face={f} skin="panel" caption={false} actions={NO_ACTIONS} look={lookOf(d)} />
                                            </div>
                                            {flagged && <span className="sim-board-editor__dot sim-board-editor__dot--slot" role="img" aria-label="Binding to review" />}
                                            {isSelected && (
                                                <>
                                                    <span className="sim-board-editor__handle sim-board-editor__handle--right" title="Drag to resize" onPointerDown={e => startDrag(e, d, 'right')} />
                                                    <span className="sim-board-editor__handle sim-board-editor__handle--bottom" title="Drag to resize" onPointerDown={e => startDrag(e, d, 'bottom')} />
                                                    <span className="sim-board-editor__handle sim-board-editor__handle--corner" title="Drag to resize" onPointerDown={e => startDrag(e, d, 'corner')} />
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                                {ghost}
                            </div>
                        </div>
                        <p className="sim-board-editor__helper">Click a device to edit it. Drag to move; drag an edge to resize.</p>
                    </section>
                    <aside className="sim-board-editor__list" aria-label="Devices">
                        <div className="sim-board-editor__list-head">
                            <span className="sim-board-editor__eyebrow">{`Devices · ${draft.length}`}</span>
                            <div className="sim-board-editor__dropdown">
                                <button
                                    type="button"
                                    className="sim-roles-modal__btn sim-roles-modal__btn--secondary sim-board-editor__menu-toggle sim-board-editor__add"
                                    aria-haspopup="menu"
                                    aria-expanded={menu === 'add'}
                                    onClick={menuToggle('add')}
                                >
                                    <i className="bi bi-plus-lg" />
                                    <span>Add</span>
                                </button>
                                {menu === 'add' && (
                                    <div className="sim-board-editor__menu sim-board-editor__menu--right sim-board-editor__menu--add" role="menu" aria-label="Add a device">
                                        {(['Inputs', 'Outputs', 'Panel'] as const).map(group => (
                                            <div className="sim-board-editor__menu-group" role="group" aria-label={group} key={group}>
                                                <div className="sim-board-editor__menu-head">{group}</div>
                                                {ADD_ENTRIES.filter(x => x.group === group).map(x => (
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        key={x.label}
                                                        className="sim-board-editor__menu-item"
                                                        title={x.note ?? `Add a ${x.label}`}
                                                        onClick={() => add(x)}
                                                    >
                                                        <i className={`bi ${KIND_ICON[x.kind]} sim-board-editor__row-icon--${x.group === 'Inputs' ? 'input' : x.group === 'Outputs' ? 'output' : 'panel'}`} />
                                                        <span>{x.label}</span>
                                                        {x.note && <span className="sim-board-editor__tag">preview</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {draft.length > SEARCH_ABOVE && (
                            <input
                                type="search"
                                className="sim-roles-modal__input sim-board-editor__search"
                                aria-label="Search the devices"
                                placeholder="Search the devices"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                        )}
                        <div className="sim-board-editor__rows" role="list" ref={listRef}>
                            {draft.length === 0 && <div className="sim-board-editor__empty">No device yet. Add one: buttons, switches, lamps and displays.</div>}
                            {groups.map(g => {
                                const shown = g.devices.filter(shownInList);
                                if (shown.length === 0) return null;
                                return (
                                    <div className="sim-board-editor__list-group" role="group" aria-label={GROUP_LABEL[g.group]} key={g.group}>
                                        <div className="sim-board-editor__subhead">{GROUP_LABEL[g.group]}</div>
                                        {shown.map(row)}
                                    </div>
                                );
                            })}
                        </div>
                    </aside>
                </div>
                <div className="sim-roles-modal__footer sim-board-editor__footer">
                    <span className="sim-board-editor__summary">
                        <span>{`Accent ${accentName}`}</span>
                        <span aria-hidden="true">·</span>
                        <span title={preview.refused ? `No run can start, so the outputs are dark: ${preview.refused}` : 'Outputs read the state at Reset, before any step'}>
                            Preview shows the initial state σ0
                        </span>
                        {review > 0 && (
                            <>
                                <span aria-hidden="true">·</span>
                                <span className="sim-board-editor__summary-warning">{`${review} ${review === 1 ? 'binding' : 'bindings'} to review`}</span>
                            </>
                        )}
                        {changes > 0 && (
                            <>
                                <span aria-hidden="true">·</span>
                                <span>{`${changes} unsaved ${changes === 1 ? 'change' : 'changes'}`}</span>
                            </>
                        )}
                    </span>
                    <div className="sim-roles-modal__actions sim-roles-modal__actions--end">
                        <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--secondary" onClick={onClose}>Cancel</button>
                        <span className="sim-board-editor__apply" title={apply.title}>
                            <button
                                type="button"
                                className="sim-roles-modal__btn sim-roles-modal__btn--primary"
                                disabled={!apply.enabled}
                                title={apply.title}
                                onClick={write}
                            >
                                Apply
                            </button>
                        </span>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default SimBoardEditor;
