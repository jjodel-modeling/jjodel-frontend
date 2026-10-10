/**
 * CodePanel — the code generation panel of a model editor (slice S5, P-2026-10-10-1825; spec §2, §3, §5; R-GEN-2,
 * R-GEN-3, R-GEN-5, R-GEN-12, R-GEN-14; discovery §E, §H.3, §I.5, U3, U5).
 *
 * Loaded only by EditorV2's `React.lazy`, when the experimental setting is on and its «Code» pill is pressed: every
 * module of the generator is reachable from here alone (scripts/gates/check-codegen-lazy.ts). It floats where the
 * pill was (`left`, measured by EditorV2's `CodegenSlot`), and «Collapse» gives the pill back.
 *
 * Two tabs.
 * - Templates: the templates of the model's metamodel, its `_state` key `genTemplates` (templateCodec.ts). Add,
 *   rename, delete, edit name, parameters and body; each write is one `state` assignment (a pure SetFieldAction, one
 *   undo step), and an unchanged list writes nothing.
 * - Output: `generate` on the model, over the record `buildEvalContext` builds for it, as the simulator builds it
 *   (simBridge.ts `evalContextFor`, `ContextBuilder`; the S2 decision recorded in docs/log-inbox/codegen-engine.md).
 *   A `<pre>` with a line gutter and one span per fragment, not Monaco (U5). The errors of the generation are listed
 *   above the text, and «Run» is refused while there is one. Run loads the text as a module in the runner's worker
 *   and calls its exported `main()`, with the timeout of the field (runner.ts); a runtime error points at its line
 *   of the generated text, and at the model element of the fragments on that line.
 *
 * Origin navigation. Hovering a span outlines every span of its fragment and names its origin under the text,
 * «element · feature · transformation». Clicking a model span selects its element on the canvas with `SELECT_NODE`;
 * the canvas node is the element's vertex, not the element (React Flow ids are DVertex ids, whose `model` is the
 * DObject, measured in this lane). An element drawn as an edge has no vertex: its edge's source node is selected and
 * the edge outlined by this panel's own overlay (R-GEN-14). A canvas selection (`CANVAS_ELEMENT_SELECTED`, a vertex
 * or an edge id) gives `code-span--linked` to exactly the spans whose origin is the selected element, by id.
 *
 * Keys typed in the panel stop at its root: EditorV2's `onKeyDown` deletes the selection on Backspace unless the
 * target is an INPUT or a SELECT, and a template body is a TEXTAREA.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useReactFlow } from '@xyflow/react';
import { DUser, LPointerTargetable, store } from '../../joiner';
import { buildEvalContext } from '../../jjscript';
import { evalContextFor } from '../../components/editor-v2/sim/simBridge';
import { resolveEdgeSelectionTarget } from '../../components/editor-v2/utils/edgeSelectionTarget';
import { JjodelEvents } from '../../events/registry';
import { generate } from '../engine/generate';
import { GEN_TEMPLATES_KEY, decodeTemplates, templatesPatch } from '../engine/templateCodec';
import { runInWorker } from '../runner/runner';
import { DEFAULT_TIMEOUT_MS } from '../runner/protocol';
import TemplateEditor from './TemplateEditor';
import type { GenerateResult } from '../engine/generate';
import type { TemplateRecord } from '../engine/templates';
import type { ModelOrigin, Origin, TextFragment, TextMapEntry } from '../engine/text';
import type { RunResponse } from '../runner/protocol';
import './CodePanel.scss';

export interface CodePanelProps {
    readonly modelid: string;
    /** The CSS `left` of the panel, where the pill was. */
    readonly left: string;
    readonly onClose: () => void;
}

type Lookup = Record<string, any>;
type Tab = 'templates' | 'output';

/** The one call of a run: the module's exported `main`, no arguments. */
const RUN_ENTRY = 'main';

/** The project of the current user, as the simulator reads it (SimulationPanel.tsx `projectIdOfUser`); '' when none. */
function projectIdOfUser(): string {
    try {
        return (LPointerTargetable.fromPointer(DUser.current as any) as any)?.project?.id ?? '';
    } catch {
        return '';
    }
}

/** An element's name for a reader: its `name`, else its class and id. */
function elementName(lookup: Lookup, id: string): string {
    const d = lookup[id];
    return typeof d?.name === 'string' && d.name ? d.name : `${d?.className ?? 'element'} ${id}`;
}

function transformationText(o: ModelOrigin): string {
    const t = o.transformation;
    return t.args && t.args.length > 0 ? `${t.name}(${t.args.map(a => JSON.stringify(a)).join(', ')})` : t.name;
}

/** What the origin bar says of a fragment. */
function originText(lookup: Lookup, origin: Origin): string {
    switch (origin.kind) {
        case 'model':
            return `${elementName(lookup, origin.elementId)} · ${origin.featureName} · ${transformationText(origin)}`;
        case 'literal':
            return `template ${origin.template} · line ${origin.line}, column ${origin.column}`;
        case 'opaque':
            return origin.reads.length > 0
                ? `computed from ${origin.reads.map(r => `${elementName(lookup, r.elementId)}.${r.featureName}`).join(', ')}`
                : 'computed, no model read';
        case 'error':
            return origin.message;
    }
}

/** A unique name for a new template. */
function freshName(templates: readonly TemplateRecord[]): string {
    const taken = new Set(templates.map(t => t.name));
    let n = templates.length + 1;
    while (taken.has(`template${n}`)) n++;
    return `template${n}`;
}

/** One rendered piece of a line: plain text (an indentation prefix) or the span of a map entry. */
interface Piece {
    readonly text: string;
    readonly entry: TextMapEntry | null;
}

/** The lines of the code, each cut at its map entries; a zero-width entry (an error fragment) writes nothing. */
function linesOf(code: string, map: readonly TextMapEntry[]): Piece[][] {
    const texts = code.split('\n');
    if (texts.length > 1 && texts[texts.length - 1] === '') texts.pop();
    const byLine = new Map<number, TextMapEntry[]>();
    for (const e of map) {
        if (e.end <= e.start) continue;
        const list = byLine.get(e.line);
        if (list) list.push(e);
        else byLine.set(e.line, [e]);
    }
    return texts.map((text, i) => {
        const pieces: Piece[] = [];
        let at = 0;
        for (const e of byLine.get(i + 1) ?? []) {
            if (e.start > at) pieces.push({ text: text.slice(at, e.start), entry: null });
            pieces.push({ text: text.slice(e.start, e.end), entry: e });
            at = e.end;
        }
        if (at < text.length) pieces.push({ text: text.slice(at), entry: null });
        return pieces;
    });
}

/**
 * The model element of a generated position (1-based line and column): the model fragment under the column, else
 * the nearest model fragment on the line; `null` when the line holds none.
 */
function elementAt(map: readonly TextMapEntry[], line: number, column: number | null): ModelOrigin | null {
    const onLine = map.filter((e): e is TextMapEntry & { origin: ModelOrigin } => e.line === line && e.end > e.start && e.origin.kind === 'model');
    if (onLine.length === 0) return null;
    const col = (column ?? 1) - 1;
    const distance = (e: TextMapEntry) => (col < e.start ? e.start - col : col >= e.end ? col - e.end + 1 : 0);
    return onLine.reduce((best, e) => (distance(e) < distance(best) ? e : best)).origin;
}

interface RunOutcome {
    readonly response: RunResponse;
    readonly ms: number;
    /** The text that ran, and its map: a later generation does not move what the error points at. */
    readonly code: string;
    readonly map: readonly TextMapEntry[];
}

interface Box {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
}

export default function CodePanel({ modelid, left, onClose }: CodePanelProps): React.ReactElement {
    const rf = useReactFlow();
    const rootRef = useRef<HTMLDivElement>(null);
    const codeRef = useRef<HTMLPreElement>(null);
    const mounted = useRef(true);
    useEffect(() => () => { mounted.current = false; }, []);

    const metamodelId = useSelector((state: any) => {
        const mm = state.idlookup?.[modelid]?.instanceof;
        return typeof mm === 'string' ? mm : null;
    });
    const raw = useSelector((state: any) => {
        const v = metamodelId ? state.idlookup?.[metamodelId]?._state?.[GEN_TEMPLATES_KEY] : undefined;
        return typeof v === 'string' ? v : v === undefined || v === null ? v : String(v);
    }) as string | null | undefined;
    const decoded = useMemo(() => decodeTemplates(raw), [raw]);
    const templates = decoded.templates;

    const [tab, setTab] = useState<Tab>('templates');
    const [selected, setSelected] = useState<string | null>(null);
    const [entry, setEntry] = useState<string | null>(null);
    const [result, setResult] = useState<GenerateResult | null>(null);
    const [failure, setFailure] = useState<string | null>(null);
    const [timeout, setTimeoutText] = useState(String(DEFAULT_TIMEOUT_MS));
    const [running, setRunning] = useState(false);
    const [outcome, setOutcome] = useState<RunOutcome | null>(null);
    const [hover, setHover] = useState<TextFragment | null>(null);
    const [linked, setLinked] = useState<string | null>(null);
    const [edgeOutline, setEdgeOutline] = useState<string | null>(null);
    const [edgeBox, setEdgeBox] = useState<Box | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // The selected template and the entry follow the list: gone from it, they fall back.
    const current = templates.find(t => t.name === selected) ?? templates[0] ?? null;
    const entryName = entry !== null && templates.some(t => t.name === entry)
        ? entry
        : (templates.find(t => t.name === 'main') ?? templates[0])?.name ?? null;

    // ── Templates: one `state` assignment per write ───────────────────────────
    const save = useCallback((next: readonly TemplateRecord[]) => {
        if (!metamodelId) return;
        const patch = templatesPatch(raw, next);
        if (!patch) return;
        (LPointerTargetable.fromPointer(metamodelId as any) as any).state = patch;
    }, [metamodelId, raw]);

    const addTemplate = () => {
        const name = freshName(templates);
        save([...templates, { name, params: [], body: '""' }]);
        setSelected(name);
    };

    // ── Output: generation and run ────────────────────────────────────────────
    const runGenerate = useCallback(() => {
        setOutcome(null);
        setHover(null);
        if (entryName === null) {
            setResult(null);
            setFailure(null);
            return;
        }
        const lookup: Lookup = (store.getState() as any).idlookup ?? {};
        try {
            const globals = buildEvalContext(evalContextFor(lookup, modelid, projectIdOfUser()), { extentModelId: modelid });
            setResult(generate(globals, lookup, modelid, templates, entryName));
            setFailure(null);
        } catch (error) {
            setResult(null);
            setFailure(error instanceof Error ? error.message : String(error));
        }
    }, [entryName, modelid, templates]);

    // On the Output tab, the text follows the templates and the entry; a model edit waits for «Generate».
    useEffect(() => {
        if (tab === 'output') runGenerate();
    }, [tab, runGenerate]);

    const timeoutMs = Number(timeout);
    const timeoutValid = Number.isFinite(timeoutMs) && timeoutMs >= 1;
    const canRun = !!result && !result.hasErrors && !running && timeoutValid;

    const run = async () => {
        if (!result || result.hasErrors || !timeoutValid) return;
        const { code, map } = result;
        setRunning(true);
        setOutcome(null);
        const t0 = performance.now();
        const response = await runInWorker({ code, calls: [{ fn: RUN_ENTRY, args: [] }], timeoutMs });
        if (!mounted.current) return;
        setOutcome({ response, ms: Math.round(performance.now() - t0), code, map });
        setRunning(false);
    };

    // ── Origin navigation ─────────────────────────────────────────────────────
    const selectOnCanvas = (elementId: string) => {
        setLinked(elementId);
        setNotice(null);
        const lookup: Lookup = (store.getState() as any).idlookup ?? {};
        const node = rf.getNodes().find(n => lookup[n.id]?.model === elementId || n.id === elementId);
        if (node) {
            setEdgeOutline(null);
            window.dispatchEvent(new CustomEvent(JjodelEvents.SELECT_NODE, { detail: { nodeId: node.id, modelId: modelid } }));
            return;
        }
        // R-GEN-14: an element drawn as an edge; its source node is selected, the edge outlined here.
        const edge = rf.getEdges().find(e => resolveEdgeSelectionTarget(e.id, lookup)?.modelElementId === elementId);
        if (edge) {
            setEdgeOutline(edge.id);
            window.dispatchEvent(new CustomEvent(JjodelEvents.SELECT_NODE, { detail: { nodeId: edge.source, modelId: modelid } }));
            return;
        }
        setEdgeOutline(null);
        setNotice(`${elementName(lookup, elementId)} is not on the canvas.`);
    };

    // Canvas to code: the selected vertex's element, or the element an edge stands for.
    useEffect(() => {
        const onSelected = (event: Event) => {
            const id = (event as CustomEvent).detail?.elementId;
            if (typeof id !== 'string' || !id) return;
            const lookup: Lookup = (store.getState() as any).idlookup ?? {};
            const model = lookup[id]?.model;
            setLinked(typeof model === 'string' && model ? model : resolveEdgeSelectionTarget(id, lookup)?.modelElementId ?? id);
            setEdgeOutline(null);
            setNotice(null);
        };
        window.addEventListener(JjodelEvents.CANVAS_ELEMENT_SELECTED, onSelected);
        return () => window.removeEventListener(JjodelEvents.CANVAS_ELEMENT_SELECTED, onSelected);
    }, []);

    // The first linked span in view.
    useEffect(() => {
        if (!linked) return;
        const span = codeRef.current?.querySelector('.code-span--linked');
        span?.scrollIntoView?.({ block: 'nearest' });
    }, [linked, result]);

    // The overlay follows the outlined edge on screen, pan and zoom included, until another selection.
    useEffect(() => {
        if (!edgeOutline) {
            setEdgeBox(null);
            return;
        }
        let frame = 0;
        const track = () => {
            const host = rootRef.current?.closest('.editor-v2');
            const origin = rootRef.current?.offsetParent;
            const path = host?.querySelector(`.react-flow__edge[data-id="${CSS.escape(edgeOutline)}"]`);
            if (path && origin) {
                const r = path.getBoundingClientRect();
                const o = origin.getBoundingClientRect();
                setEdgeBox(prev => (prev && prev.left === r.left - o.left && prev.top === r.top - o.top && prev.width === r.width && prev.height === r.height
                    ? prev
                    : { left: r.left - o.left, top: r.top - o.top, width: r.width, height: r.height }));
            } else {
                setEdgeBox(null);
            }
            frame = requestAnimationFrame(track);
        };
        track();
        return () => cancelAnimationFrame(frame);
    }, [edgeOutline]);

    // ── Rendering ─────────────────────────────────────────────────────────────
    const lookupNow: Lookup = (store.getState() as any).idlookup ?? {};
    const lines = useMemo(() => (result ? linesOf(result.code, result.map) : []), [result]);
    const fragmentIndex = useMemo(() => new Map<TextFragment, number>((result?.text.fragments ?? []).map((f, i) => [f, i])), [result]);
    const runError = outcome && !outcome.response.ok ? outcome.response.error : null;
    const errorLine = runError && result && outcome && outcome.code === result.code ? runError.line : null;
    const errorElement = runError && runError.line !== null && outcome ? elementAt(outcome.map, runError.line, runError.column) : null;

    // The line of a runtime error in view.
    useEffect(() => {
        if (errorLine === null) return;
        codeRef.current?.querySelector(`[data-line="${errorLine}"]`)?.scrollIntoView?.({ block: 'nearest' });
    }, [errorLine]);

    const spanClass = (e: TextMapEntry): string => {
        let c = `code-span code-span--${e.origin.kind}`;
        if (hover !== null && e.fragment === hover) c += ' code-span--hover';
        if (linked !== null && e.origin.kind === 'model' && e.origin.elementId === linked) c += ' code-span--linked';
        return c;
    };

    return (
        <>
            <div
                ref={rootRef}
                className="codegen-panel"
                style={{ left }}
                onKeyDown={e => e.stopPropagation()}
            >
                <div className="codegen-panel__header">
                    <i className="bi bi-code-slash" />
                    <span className="codegen-panel__title">Code</span>
                    <div className="codegen-panel__tabs" role="tablist">
                        <button type="button" role="tab" aria-selected={tab === 'templates'} className="codegen-panel__tab" onClick={() => setTab('templates')}>
                            Templates
                        </button>
                        <button type="button" role="tab" aria-selected={tab === 'output'} className="codegen-panel__tab" onClick={() => setTab('output')}>
                            Output
                        </button>
                    </div>
                    <button type="button" className="codegen-panel__collapse" title="Collapse" onClick={onClose}>
                        <i className="bi bi-chevron-down" />
                    </button>
                </div>

                {tab === 'templates' ? (
                    <div className="codegen-panel__body">
                        {!metamodelId && <div className="codegen-panel__hint">This model has no metamodel to hold templates.</div>}
                        {decoded.defects.map((d, i) => (
                            <div className="codegen-panel__hint codegen-panel__hint--warning" key={`defect-${i}`}>
                                {d.index === null ? d.message : `Template ${d.index + 1}: ${d.message}`}
                            </div>
                        ))}
                        <div className="codegen-panel__list" role="listbox" aria-label="Templates">
                            {templates.map(t => (
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={current?.name === t.name}
                                    className="codegen-panel__item"
                                    key={t.name}
                                    onClick={() => setSelected(t.name)}
                                >
                                    <span className="codegen-panel__item-name">{t.name}</span>
                                    <span className="codegen-panel__item-params">({t.params.join(', ')})</span>
                                </button>
                            ))}
                            <button type="button" className="codegen-panel__add" disabled={!metamodelId} onClick={addTemplate}>
                                <i className="bi bi-plus-lg" />
                                <span>New template</span>
                            </button>
                        </div>
                        {current && (
                            <TemplateEditor
                                key={current.name}
                                template={current}
                                taken={templates.filter(t => t !== current).map(t => t.name)}
                                onSave={next => {
                                    save(templates.map(t => (t === current ? next : t)));
                                    setSelected(next.name);
                                }}
                                onDelete={() => save(templates.filter(t => t !== current))}
                            />
                        )}
                        <div className="codegen-panel__help">
                            A template is a JjEL expression, usually one string with {'${…}'} holes; templates call each other by name.
                            They are stored in the metamodel, and the .ecore export does not keep them.
                        </div>
                    </div>
                ) : (
                    <div className="codegen-panel__body codegen-panel__body--output">
                        <div className="codegen-panel__row">
                            <span className="codegen-panel__label">Entry</span>
                            <select
                                className="codegen-panel__select"
                                value={entryName ?? ''}
                                disabled={templates.length === 0}
                                onChange={e => setEntry(e.target.value)}
                            >
                                {templates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                            </select>
                            <button type="button" className="codegen-panel__button" title="Generate again from the model" onClick={runGenerate}>
                                <i className="bi bi-arrow-repeat" />
                                <span>Generate</span>
                            </button>
                        </div>
                        {templates.length === 0 && <div className="codegen-panel__hint">No template yet: write one in Templates.</div>}
                        {failure && <div className="codegen-panel__hint codegen-panel__hint--error">{`The model could not be read: ${failure}`}</div>}
                        {result && result.errors.length > 0 && (
                            <ul className="codegen-panel__errors" aria-label="Generation errors">
                                {result.errors.map((e, i) => (
                                    <li className="codegen-panel__error" key={`error-${i}`}>
                                        <span className="codegen-panel__error-at">{`${e.template} ${e.line}:${e.column}`}</span>
                                        <span>{e.message}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {result && (
                            <pre className="codegen-panel__code" ref={codeRef}>
                                {lines.map((pieces, i) => (
                                    <span className={`codegen-panel__line${errorLine === i + 1 ? ' codegen-panel__line--error' : ''}`} data-line={i + 1} key={i}>
                                        <span className="codegen-panel__gutter">{i + 1}</span>
                                        <span className="codegen-panel__text">
                                            {pieces.map((p, j) => (p.entry === null ? (
                                                <React.Fragment key={j}>{p.text}</React.Fragment>
                                            ) : (
                                                <span
                                                    key={j}
                                                    className={spanClass(p.entry)}
                                                    data-fragment={fragmentIndex.get(p.entry.fragment)}
                                                    data-origin-id={p.entry.origin.kind === 'model' ? p.entry.origin.elementId : undefined}
                                                    onMouseEnter={() => setHover(p.entry!.fragment)}
                                                    onMouseLeave={() => setHover(null)}
                                                    onClick={p.entry.origin.kind === 'model' ? () => selectOnCanvas((p.entry!.origin as ModelOrigin).elementId) : undefined}
                                                >
                                                    {p.text}
                                                </span>
                                            )))}
                                        </span>
                                    </span>
                                ))}
                            </pre>
                        )}
                        <div className="codegen-panel__origin" aria-live="polite">
                            {notice ?? (hover ? originText(lookupNow, hover.origin) : 'Hover a span for its origin; click a model value to select it on the canvas.')}
                        </div>
                        <div className="codegen-panel__row codegen-panel__run">
                            <button
                                type="button"
                                className="codegen-panel__button codegen-panel__button--primary"
                                disabled={!canRun}
                                title={result?.hasErrors ? 'Fix the generation errors first' : `Run the module and call its ${RUN_ENTRY}()`}
                                onClick={() => { void run(); }}
                            >
                                <i className="bi bi-play-fill" />
                                <span>{running ? 'Running' : 'Run'}</span>
                            </button>
                            <label className="codegen-panel__timeout">
                                <span className="codegen-panel__label">Timeout</span>
                                <input
                                    className="codegen-panel__input"
                                    type="number"
                                    min={1}
                                    step={100}
                                    value={timeout}
                                    onChange={e => setTimeoutText(e.target.value)}
                                />
                                <span className="codegen-panel__unit">ms</span>
                            </label>
                        </div>
                        {result?.hasErrors && <div className="codegen-panel__hint">Run is off while the generation has errors.</div>}
                        {outcome && outcome.response.ok && (
                            <div className="codegen-panel__result">
                                <div className="codegen-panel__label">{`${RUN_ENTRY}() returned, ${outcome.ms} ms`}</div>
                                <pre className="codegen-panel__value">{JSON.stringify(outcome.response.results[0] ?? null, null, 2) ?? 'undefined'}</pre>
                            </div>
                        )}
                        {runError && (
                            <div className="codegen-panel__result codegen-panel__result--error" role="alert">
                                <div className="codegen-panel__run-error">{`${runError.kind}: ${runError.message}`}</div>
                                {runError.line !== null && (
                                    <div className="codegen-panel__run-at">
                                        {`line ${runError.line}${runError.column !== null ? `, column ${runError.column}` : ''}`}
                                        {errorElement && (
                                            <>
                                                {' · '}
                                                <button type="button" className="codegen-panel__link" onClick={() => selectOnCanvas(errorElement.elementId)}>
                                                    {elementName(lookupNow, errorElement.elementId)}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {edgeBox && (
                <div
                    className="codegen-panel__edge-outline"
                    style={{ left: edgeBox.left - 4, top: edgeBox.top - 4, width: edgeBox.width + 8, height: edgeBox.height + 8 }}
                />
            )}
        </>
    );
}
