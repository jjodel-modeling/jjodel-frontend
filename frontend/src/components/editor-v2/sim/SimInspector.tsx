/**
 * SimInspector: the run inspector of the M1 face (R-SIM-105, R-SIM-106;
 * P-2026-10-03-0120, discovery 2026-10-02 §1 and §8.3).
 *
 * A floating card mounted by SimulationPanel beside its own root, right of the
 * panel, inside the editor: it hides with its tab as the panel does, and leaves
 * the canvas in view, which a dock tab would hide (discovery §1, H1). Three
 * sections, apart as R-SIM-102 keeps the two spaces apart:
 * - σ, the abstract state: the marking, the globals with their domain bars, then
 *   per metaclass per instance, a marked instance flagged;
 * - node, the concrete state, in the viewpoint pink, dashed;
 * - the trace, one button per step: choosing one shows it (`simSetView`), under
 *   «Viewing step n. The run is still at step m» and «Back to live»; newest first,
 *   in an area six rows tall that scrolls (P-2026-10-03-1015).
 *
 * It reads the run-state singleton on the `'mark'` version, which a view, a
 * commit, Reset and Stop bump, and is re-rendered by the panel after every press,
 * a discard included; the viewer preferences on their own channel. What it shows
 * is the configuration of the step shown, `configAt` of the run, and the changes
 * that step made. It writes nothing but the view and the viewer preferences: a pin
 * (R-SIM-104) and a tag (R-SIM-107) per attribute. Viewing is read-only; a press
 * returns the view to live (simBridge.ts).
 */

import { useLayoutEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { store } from '../../../joiner';
import { configAt, getSimRun, getSimView, simSetView, useSimVersion } from './simRunState';
import type { SimRun, SimTraceStep } from './simRunState';
import { stateKindOf, stateValueOf } from './simCanvasState';
import type { SimStateKind } from './simCanvasState';
import { defaultSimPins, getSimViewerPrefs, MAX_SIM_PINS, setSimViewerPrefs, useSimViewerPrefsVersion } from './simViewerPrefs';
import type { SimAttrRef } from './simViewerPrefs';
import { candidateLabel, markingChips } from './simBridge';
import type { InputLabel } from './simBridge';
import type { StateHeading } from './simLabels';
import type { SimState, SimValue, StateAttributeDecl } from '../../../model/simulation/netTypes';
import './SimInspector.scss';

export interface SimInspectorProps {
    /** The M1 model whose run is inspected. */
    modelId: string;
    modelName: string;
    /** The panel's label of an input: `ε`, or the event's. */
    inputLabel: InputLabel;
    /** The panel's hint of a profile without state attributes (P-2026-10-03-1420), said once at the top of σ; the card computes nothing. */
    stateHint?: { line: string; title: string } | null;
    /** The heading of the marked places, the panel's `stateHeading` of the run's profile (simLabels.ts); `Marking` when absent. */
    markingHeading?: StateHeading;
    /** Closes the card; the panel returns the view to live. */
    onClose: () => void;
}

/** One attribute of one element on the step shown. */
interface InspectorRow {
    readonly element: string;
    readonly attr: string;
    readonly decl: StateAttributeDecl | null;
    readonly kind: SimStateKind | null;
    readonly value: SimValue | null;
    /** The value before the step shown, when that step changed it; `undefined` when it did not. */
    readonly before?: SimValue | null;
}

/** One instance and its rows, under its metaclass. */
interface InspectorInstance {
    readonly element: string;
    readonly name: string;
    readonly marked: boolean;
    readonly rows: InspectorRow[];
}

type Lookup = Record<string, any>;

/**
 * The pins the face reads (R-SIM-104 as the chat's visual check of P-2026-10-03-0120 reads it): the viewer's own,
 * else the globals of `defaultSimPins`, at most four, and nothing else; an attribute of a metaclass, stored or
 * derived, reaches Watch only when pinned here. The panel shows four rows at most whatever the pins give.
 */
export function facePins(pins: readonly SimAttrRef[] | null, attributes: readonly StateAttributeDecl[]): readonly SimAttrRef[] {
    return pins ?? defaultSimPins(attributes).filter(p => p.metaclass === null);
}

const nameOf = (lookup: Lookup, id: string | null | undefined): string => {
    const name = id ? lookup[id]?.name : undefined;
    return typeof name === 'string' && name ? name : id ?? '';
};

const sameRef = (a: SimAttrRef, b: SimAttrRef): boolean => a.metaclass === b.metaclass && a.name === b.name && a.space === b.space;

const refOf = (decl: StateAttributeDecl): SimAttrRef => ({ metaclass: decl.metaclass, name: decl.name, space: decl.space });

/** The verb of a committed step, in the words of «Last step» (simBridge.ts `lastStepText`). */
const KIND_WORD: Record<SimTraceStep['kind'], string> = {
    fired: 'fired', halted: 'halted the run', discard: 'discarded', quiescence: 'nothing to fire',
};

/**
 * The rows of one space of σ on `state`, by element: every declaration the net holds
 * for the element, then any value σ has with no declaration. An input (`IVAR`) is not
 * in σ: it reads the value its step was given, `inputs`. `prev`, the σ before the
 * step, gives the changes; never an input's.
 */
function rowsBySpace(
    run: SimRun, state: SimState, prev: SimState | null, space: 'semantic' | 'presentation',
    inputs: SimTraceStep['inputs'],
): Map<string, InspectorRow[]> {
    const out = new Map<string, InspectorRow[]>();
    const push = (element: string, row: InspectorRow) => {
        const list = out.get(element);
        if (list) list.push(row); else out.set(element, [row]);
    };
    for (const [element, byName] of run.net.declared) {
        for (const decl of byName.values()) {
            if (decl.space !== space) continue;
            const kind = stateKindOf(decl);
            if (kind === 'IVAR') {
                const given = inputs?.find(v => v.element === element && v.attr === decl.name)?.value;
                push(element, { element, attr: decl.name, decl, kind, value: given ?? null });
                continue;
            }
            const value = stateValueOf(state, space, element, decl.name) ?? null;
            const old = prev ? stateValueOf(prev, space, element, decl.name) ?? null : value;
            push(element, { element, attr: decl.name, decl, kind, value, ...(old !== value ? { before: old } : {}) });
        }
    }
    const stored = space === 'semantic' ? [state.attrs, state.derived?.attrs] : [state.presentation, state.derived?.presentation];
    for (const map of stored) {
        for (const [element, values] of map ?? []) {
            for (const [attr, value] of values) {
                if (run.net.declared.get(element)?.has(attr)) continue;
                const old = prev ? stateValueOf(prev, space, element, attr) ?? null : value;
                push(element, { element, attr, decl: null, kind: null, value, ...(old !== value ? { before: old } : {}) });
            }
        }
    }
    for (const rows of out.values()) rows.sort((a, b) => a.attr.localeCompare(b.attr));
    return out;
}

/** The instances of one space grouped by metaclass, the globals apart; groups and instances by name. */
function grouped(run: SimRun, state: SimState, rows: Map<string, InspectorRow[]>, lookup: Lookup) {
    const globals = rows.get(run.net.modelId) ?? [];
    const byClass = new Map<string, InspectorInstance[]>();
    for (const [element, list] of rows) {
        if (element === run.net.modelId) continue;
        const cls = nameOf(lookup, lookup[element]?.instanceof ?? list[0]?.decl?.metaclass ?? null) || 'Other';
        const instance: InspectorInstance = { element, name: nameOf(lookup, element), marked: (state.marking.get(element) ?? 0) > 0, rows: list };
        const group = byClass.get(cls);
        if (group) group.push(instance); else byClass.set(cls, [instance]);
    }
    const classes = [...byClass].sort(([a], [b]) => a.localeCompare(b)).map(([cls, list]) => ({
        cls, instances: list.sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return { globals, classes };
}

export function SimInspector({ modelId, modelName, inputLabel, stateHint, markingHeading = 'Marking', onClose }: SimInspectorProps): ReactElement {
    // The view, a commit, Reset and Stop bump the 'mark' version; the pins and tags their own channel.
    useSimVersion();
    useSimViewerPrefsVersion();
    const run = getSimRun(modelId);
    const lookup: Lookup = (store.getState() as any).idlookup ?? {};
    const live = run?.trace?.length ?? 0;
    const viewed = run ? getSimView(modelId) : null;
    const n = viewed ?? live;
    const config = run ? configAt(run, n) : null;
    const prev = run && n > 0 ? configAt(run, n - 1)?.state ?? null : null;
    const prefs = getSimViewerPrefs(modelId);
    const pins = run ? facePins(prefs.pins, run.net.attributes) : [];

    // The trace's scroll area (P-2026-10-03-1015), newest first. A commit leaves a list at its top there, the new
    // step in view, and keeps the rows in view where the reader scrolled down (the browser's scroll anchoring is
    // off on the list); a step shown without a commit, chosen or «Back to live», is scrolled into view.
    const traceRef = useRef<HTMLOListElement>(null);
    const traceWas = useRef({ live, n, height: 0 });
    useLayoutEffect(() => {
        const list = traceRef.current;
        const was = traceWas.current;
        if (list && live !== was.live) {
            if (live > was.live && list.scrollTop >= 1) list.scrollTop += list.scrollHeight - was.height;
            else list.scrollTop = 0;
        } else if (list && n !== was.n) {
            list.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'nearest' });
        }
        traceWas.current = { live, n, height: list?.scrollHeight ?? 0 };
    }, [live, n]);

    const pinned = (decl: StateAttributeDecl) => pins.some(p => sameRef(p, refOf(decl)));
    const tagged = (decl: StateAttributeDecl) => prefs.tags.some(t => sameRef(t, refOf(decl)));
    const togglePin = (decl: StateAttributeDecl) => {
        const ref = refOf(decl);
        setSimViewerPrefs(modelId, { pins: pinned(decl) ? pins.filter(p => !sameRef(p, ref)) : [...pins, ref] });
    };
    const toggleTag = (decl: StateAttributeDecl) => {
        const ref = refOf(decl);
        setSimViewerPrefs(modelId, { tags: tagged(decl) ? prefs.tags.filter(t => !sameRef(t, ref)) : [...prefs.tags, ref] });
    };

    /** One row: name (italic for a DEFINE), kind chip, domain bar, value, and the pin and tag of its declaration. */
    const renderRow = (row: InspectorRow, space: 'semantic' | 'presentation', global: boolean) => {
        const shown = row.value === null ? (row.kind === 'IVAR' ? 'asked at the press' : '—') : String(row.value);
        const changed = row.before !== undefined;
        const text = changed ? `${row.before === null ? '—' : String(row.before)} → ${shown}` : shown;
        const range = row.decl?.domain?.kind === 'range' ? row.decl.domain : null;
        const num = typeof row.value === 'number' ? row.value : null;
        const out = range !== null && num !== null && (num < range.min || num > range.max);
        const fill = range !== null && num !== null && range.max > range.min ? Math.min(1, Math.max(0, (num - range.min) / (range.max - range.min))) : 0;
        const decl = row.decl;
        const isPinned = decl ? pinned(decl) : false;
        const isTagged = decl ? tagged(decl) : false;
        const path = space === 'presentation' ? `node.[${row.attr}]` : global ? `model.[${row.attr}]` : `self.[${row.attr}]`;
        const title = `${path}${row.kind ? ` · ${row.kind}` : ' · undeclared'}${range ? ` · ${range.min}..${range.max}` : ''} = ${text}`;
        return (
            <div
                key={`${row.element}\u0000${row.attr}`}
                className={`sim-inspector__row${changed ? ' sim-inspector__row--changed' : ''}${row.kind === null ? ' sim-inspector__row--undeclared' : ''}`}
                title={title}
            >
                <span className={`sim-inspector__name${row.kind === 'DEFINE' ? ' sim-inspector__name--define' : ''}`}>{row.attr}</span>
                {row.kind && (
                    <span className={`sim-state-chip sim-state-chip--${row.kind.toLowerCase()}${space === 'presentation' ? ' sim-state-chip--presentation' : ''}`}>
                        {row.kind}
                    </span>
                )}
                {range && (
                    <span className={`sim-inspector__bar${out ? ' sim-inspector__bar--out' : ''}`} aria-hidden="true">
                        <span className="sim-inspector__fill" style={{ width: `${Math.round(fill * 100)}%` }} />
                    </span>
                )}
                <span className={`sim-inspector__value${changed ? ' sim-inspector__value--changed' : ''}${row.kind === 'IVAR' ? ' sim-inspector__value--input' : ''}`}>
                    {text}
                </span>
                {decl && (
                    <span className="sim-inspector__row-actions">
                        <button
                            type="button"
                            className="sim-inspector__toggle"
                            aria-pressed={isPinned}
                            disabled={!isPinned && pins.length >= MAX_SIM_PINS}
                            title={isPinned ? 'Unpin from Watch' : pins.length >= MAX_SIM_PINS ? `Watch shows ${MAX_SIM_PINS} pins at most` : 'Pin to Watch'}
                            onClick={() => togglePin(decl)}
                        >
                            <i className={`bi ${isPinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'}`} />
                        </button>
                        {/* R-SIM-107: a tag names a σ attribute of the nodes; the globals have their card on the canvas. */}
                        {space === 'semantic' && !global && (
                            <button
                                type="button"
                                className="sim-inspector__toggle"
                                aria-pressed={isTagged}
                                title={isTagged ? 'Hide the tag on the canvas' : `Tag ${row.attr} on the canvas`}
                                onClick={() => toggleTag(decl)}
                            >
                                <i className={`bi ${isTagged ? 'bi-tag-fill' : 'bi-tag'}`} />
                            </button>
                        )}
                    </span>
                )}
            </div>
        );
    };

    const header = (
        <div className="sim-inspector__header">
            <i className="bi bi-arrows-angle-expand" />
            <span className="sim-inspector__title">Run inspector</span>
            <span className="sim-inspector__subtitle" title={modelName}>{modelName}</span>
            <button type="button" className="sim-inspector__close" title="Close the inspector" aria-label="Close the inspector" onClick={onClose}>
                <i className="bi bi-x-lg" />
            </button>
        </div>
    );

    if (!run || !config) {
        return (
            <div className="sim-inspector" role="dialog" aria-label="Run inspector">
                {header}
                <div className="sim-inspector__body">
                    <div className="sim-inspector__empty">Not started. Reset starts the run.</div>
                </div>
            </div>
        );
    }

    const state = config.state;
    const inputs = n > 0 ? run.trace?.[n - 1]?.inputs : undefined;
    const semantic = grouped(run, state, rowsBySpace(run, state, prev, 'semantic', inputs), lookup);
    const presentation = grouped(run, state, rowsBySpace(run, state, prev, 'presentation', inputs), lookup);
    const chips = markingChips(state, lookup);
    const trace = run.trace ?? [];
    /** A committed step as «Last step» words it: `push: t3 (locked → locked) fired`, `ε (random): …`. */
    const stepText = (t: SimTraceStep): string => {
        const input = `${inputLabel(t.event)}${t.origin === 'random' ? ' (random)' : ''}`;
        const what = t.selector !== null && (t.kind === 'fired' || t.kind === 'halted') ? `${candidateLabel(run.net, t.selector, lookup)} ` : '';
        return `${input}: ${what}${KIND_WORD[t.kind]}`;
    };
    const steps = [{ i: 0, text: 'Reset' }, ...trace.map((t, k) => ({ i: k + 1, text: stepText(t) }))].reverse();

    return (
        <div className="sim-inspector" role="dialog" aria-label="Run inspector">
            {header}
            {viewed !== null && (
                <div className="sim-inspector__viewing" role="status">
                    <span className="sim-inspector__viewing-text">{`Viewing step ${viewed}. The run is still at step ${live}.`}</span>
                    <button type="button" className="sim-inspector__live" onClick={() => simSetView(modelId, null)}>Back to live</button>
                </div>
            )}
            <div className={`sim-inspector__body${viewed !== null ? ' sim-inspector__body--past' : ''}`}>
                {/* σ, the abstract state (R-SIM-102): solid slate, the glyph σ. */}
                <section className="sim-inspector__section sim-inspector__section--semantic" aria-label="Abstract state σ">
                    <div className="sim-inspector__section-head">
                        <span className="sim-state-glyph">σ</span>
                        <span>Abstract state</span>
                        <span className="sim-inspector__step">{`step ${n}`}</span>
                    </div>
                    {stateHint && <div className="sim-panel__hint" title={stateHint.title}>{stateHint.line}</div>}
                    <div className="sim-inspector__group-head">{markingHeading}</div>
                    <div className="sim-inspector__chips">
                        {chips.length === 0
                            ? <span className="sim-panel__marking-chip sim-panel__marking-chip--empty">∅</span>
                            : chips.map(c => <span className="sim-panel__marking-chip" key={c.place}>{c.text}</span>)}
                    </div>
                    {semantic.globals.length > 0 && (
                        <>
                            <div className="sim-inspector__group-head">Globals</div>
                            {semantic.globals.map(r => renderRow(r, 'semantic', true))}
                        </>
                    )}
                    {semantic.classes.map(g => (
                        <div className="sim-inspector__group" key={g.cls}>
                            <div className="sim-inspector__group-head">{g.cls}</div>
                            {g.instances.map(inst => (
                                <div className="sim-inspector__instance" key={inst.element}>
                                    <div className="sim-inspector__instance-head">
                                        <span>{inst.name}</span>
                                        {inst.marked && <span className="sim-inspector__marked" title="Marked: holds a token on this step">marked</span>}
                                    </div>
                                    {inst.rows.map(r => renderRow(r, 'semantic', false))}
                                </div>
                            ))}
                        </div>
                    ))}
                    {semantic.globals.length === 0 && semantic.classes.length === 0 && (
                        <div className="sim-inspector__empty">{`No state attribute: σ is the ${markingHeading.toLowerCase()} alone.`}</div>
                    )}
                </section>
                {/* node, the concrete state (R-SIM-102): the viewpoint pink, dashed; it belongs to the view. */}
                <section className="sim-inspector__section sim-inspector__section--presentation" aria-label="Concrete state node">
                    <div className="sim-inspector__section-head">
                        <span className="sim-state-glyph sim-state-glyph--presentation">node</span>
                        <span>Concrete state</span>
                    </div>
                    {presentation.globals.map(r => renderRow(r, 'presentation', true))}
                    {presentation.classes.map(g => (
                        <div className="sim-inspector__group" key={g.cls}>
                            <div className="sim-inspector__group-head">{g.cls}</div>
                            {g.instances.map(inst => (
                                <div className="sim-inspector__instance" key={inst.element}>
                                    <div className="sim-inspector__instance-head">
                                        <span>{inst.name}</span>
                                        {inst.marked && <span className="sim-inspector__marked" title="Marked: holds a token on this step">marked</span>}
                                    </div>
                                    {inst.rows.map(r => renderRow(r, 'presentation', false))}
                                </div>
                            ))}
                        </div>
                    ))}
                    {presentation.globals.length === 0 && presentation.classes.length === 0 && (
                        <div className="sim-inspector__empty">No presentation state.</div>
                    )}
                </section>
                {/* The trace (R-SIM-106): a step chosen is shown on the canvas as it was; the run does not move. */}
                <section className="sim-inspector__section sim-inspector__section--trace" aria-label="Trace">
                    <div className="sim-inspector__section-head">
                        <i className="bi bi-clock-history" />
                        <span>Trace</span>
                        <span className="sim-inspector__step">{`${live} ${live === 1 ? 'step' : 'steps'}`}</span>
                    </div>
                    <ol className="sim-inspector__trace" ref={traceRef}>
                        {steps.map(s => (
                            <li key={s.i}>
                                <button
                                    type="button"
                                    className={`sim-inspector__trace-step${s.i === n ? ' sim-inspector__trace-step--shown' : ''}`}
                                    aria-current={s.i === n ? 'step' : undefined}
                                    title={s.i === live ? `Step ${s.i}, live: ${s.text}` : `Show step ${s.i}: ${s.text}`}
                                    onClick={() => simSetView(modelId, s.i === live ? null : s.i)}
                                >
                                    <span className="sim-inspector__trace-n">{s.i}</span>
                                    <span className="sim-inspector__trace-text">{s.text}</span>
                                    {s.i === live && <span className="sim-inspector__trace-live">live</span>}
                                </button>
                            </li>
                        ))}
                    </ol>
                </section>
            </div>
        </div>
    );
}

export default SimInspector;
