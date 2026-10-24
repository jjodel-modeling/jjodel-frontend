/**
 * GeneratorPane — the right pane of a generator tab: a conforming model, three modes, the generated files (slice G3,
 * P-2026-10-24-0003; R-GEN-35, R-GEN-40, R-GEN-41).
 *
 * The model is chosen among the project's models conforming to the metamodel (conformingModels.ts), the one the tab
 * was opened with first (a pill pressed on a model canvas), else the first. The generator, with the tab's drafts
 * merged in, is generated PREVIEW_DELAY_MS after the last change by `generateGenerator` (G2), one result per declared
 * file, one sub-tab per file; the model's record is built anew each time, as the simulator builds it (simBridge.ts
 * `evalContextFor`). The selected file's text is shown in every mode, in the `<pre>`-with-gutter form (codeLines.ts).
 *
 * - Preview: the file's generation errors above the text.
 * - Run: the file loaded as a module in the runner's worker, its exported `main()` called with the field's timeout
 *   (runner.ts); a runtime error points at its line and at the model element of the fragments on that line.
 * - Check: the oracle (oracle.ts `runOracle`, R-GEN-11) on the same text over a scenario stored on the model
 *   (storedScenarios.ts); offered only when the generator's target is `js` (R-GEN-35).
 * Run and Check, and their results, moved here from CodePanel.tsx with their behaviour, the 3.2 panel's classes kept.
 * A generator with no template shows one neutral empty state in every mode, and nothing is generated (P-2026-10-24-0318).
 *
 * Provenance both ways (R-GEN-41). Hovering a span outlines every span of its fragment and names its origin under the
 * text. A click on a model span selects its element on the model's canvas, opening the model's tab first
 * (canvasSelection.ts); an element drawn as an edge selects the edge's source and is outlined here. Alt+click on any
 * span, or the gutter control of a hovered line, leads to the template that produced it (`onGoToTemplate`). A canvas
 * selection (`CANVAS_ELEMENT_SELECTED`) links the spans whose origin is the selected element, or one of its instances
 * when a class is selected (R-GEN-21).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { shallowEqual, useSelector } from 'react-redux';
import { DUser, LPointerTargetable, store } from '../../joiner';
import { buildEvalContext } from '../../jjscript';
import { evalContextFor } from '../../components/editor-v2/sim/simBridge';
import { resolveEdgeSelectionTarget } from '../../components/editor-v2/utils/edgeSelectionTarget';
import { JjodelEvents } from '../../events/registry';
import { generateGenerator } from '../engine/generateFiles';
import { runInWorker } from '../runner/runner';
import { DEFAULT_TIMEOUT_MS } from '../runner/protocol';
import { runOracle } from '../oracle/oracle';
import { decodeStoredScenarios, storedScenariosRaw } from '../oracle/storedScenarios';
import { checkView } from './checkView';
import { displayJson } from './displayJson';
import { conformingModels } from './conformingModels';
import { linesOf } from './codeLines';
import { elementAt, elementName, originText, templateTarget } from './codeOrigins';
import { checkOffered, noTemplates, paneGeneration, runOffered } from './generatorTabs';
import { selectOnModelCanvas } from './canvasSelection';
import type { GeneratorRecord } from '../engine/generatorCodec';
import type { GeneratorResult } from '../engine/generateFiles';
import type { ModelOrigin, TextFragment, TextMapEntry } from '../engine/text';
import type { RunResponse } from '../runner/protocol';
import type { OracleResult } from '../oracle/oracle';
import type { ScenarioRecord } from '../../model/simulation/scenarioCodec';
import type { TemplateTarget } from './codeOrigins';
import './CodePanel.scss';

type Lookup = Record<string, any>;

/** The modes of the pane. */
export type PaneMode = 'preview' | 'run' | 'check';

/** The one call of a run: the module's exported `main`, no arguments. */
const RUN_ENTRY = 'main';

/** The pause after the last edit before the preview generates again (S3, discovery §3.4, risk 6). */
const PREVIEW_DELAY_MS = 400;

/** The pane of a generator with no template, in every mode. */
const NO_TEMPLATES = 'No templates yet. «New template» on the left adds the first one.';

/** The tooltip of «Check» when the model has no stored scenario. */
const NO_SCENARIO = 'Record a scenario in the simulator first.';

/** The tooltip of «Check» on a generator whose target is not `js` (R-GEN-35). */
const NOT_JS = 'Check runs only on a generator whose target is js.';
/** The tooltip of «Run» on a generator whose target is not `js` (R-GEN-35). */
const RUN_NOT_JS = 'Run runs only on a generator whose target is js.';

/**
 * Brings `el` into view inside the code view `box`, scrolling `box` alone. `scrollIntoView` scrolls every ancestor
 * too: with the tab behind another dock tab (a canvas selection, or the click that brings the model's tab forward),
 * it scrolled the dock sideways to reveal a hidden span and left the model's editor off screen.
 */
function revealIn(box: HTMLElement | null, el: Element | null | undefined): void {
    if (!box || !el) return;
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.top < b.top) box.scrollTop -= b.top - r.top;
    else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom;
}

/** The project of the current user, as the simulator reads it (SimulationPanel.tsx `projectIdOfUser`); '' when none. */
function projectIdOfUser(): string {
    try {
        return (LPointerTargetable.fromPointer(DUser.current as any) as any)?.project?.id ?? '';
    } catch {
        return '';
    }
}

/** The record `generate` and the oracle read the model through, as the simulator builds it. */
function evalGlobals(lookup: Lookup, modelid: string) {
    return buildEvalContext(evalContextFor(lookup, modelid, projectIdOfUser()), { extentModelId: modelid });
}

interface RunOutcome {
    readonly response: RunResponse;
    readonly ms: number;
    /** The text that ran, and its map: a later generation does not move what the error points at. */
    readonly code: string;
    readonly map: readonly TextMapEntry[];
}

interface CheckOutcome {
    readonly result: OracleResult;
    readonly scenario: ScenarioRecord;
    /** The map of the text that was checked: a later generation does not move what a failure's line points at. */
    readonly map: readonly TextMapEntry[];
}

interface Box {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
}

export interface GeneratorPaneProps {
    readonly metamodelId: string;
    /** The generator with the tab's drafts merged in. */
    readonly generator: GeneratorRecord;
    /** The model chosen first; another is chosen in the pane. */
    readonly model?: string | null;
    /** «Go to template»: selects the template in the tab's list and reveals the range when known. */
    readonly onGoToTemplate: (target: TemplateTarget) => void;
    /** Every generation, for the tab's markers of the edited template. */
    readonly onGenerated?: (result: GeneratorResult | null) => void;
}

export default function GeneratorPane({ metamodelId, generator, model = null, onGoToTemplate, onGenerated }: GeneratorPaneProps): React.ReactElement {
    const codeRef = useRef<HTMLPreElement>(null);
    const mounted = useRef(true);
    useEffect(() => () => { mounted.current = false; }, []);

    const models = useSelector((state: any) => conformingModels(state.idlookup ?? {}, projectIdOfUser(), metamodelId), shallowEqual);
    const [chosenModel, setChosenModel] = useState<string | null>(model);
    useEffect(() => { if (model !== null) setChosenModel(model); }, [model]);
    const targetId = chosenModel !== null && models.includes(chosenModel) ? chosenModel : models[0] ?? null;
    const scenariosRaw = useSelector((state: any) => (targetId ? storedScenariosRaw(state.idlookup ?? {}, targetId) : undefined));
    const scenarios = useMemo(() => decodeStoredScenarios(scenariosRaw), [scenariosRaw]);

    const [mode, setMode] = useState<PaneMode>('preview');
    const [filePath, setFilePath] = useState<string | null>(null);
    const [generated, setGenerated] = useState<GeneratorResult | null>(null);
    const [failure, setFailure] = useState<string | null>(null);
    const [timeout, setTimeoutText] = useState(String(DEFAULT_TIMEOUT_MS));
    const [running, setRunning] = useState(false);
    const [outcome, setOutcome] = useState<RunOutcome | null>(null);
    const [scenarioName, setScenarioName] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);
    const [checked, setChecked] = useState<CheckOutcome | null>(null);
    const [hover, setHover] = useState<TextFragment | null>(null);
    const [hoverLine, setHoverLine] = useState<number | null>(null);
    const [linked, setLinked] = useState<string | null>(null);
    const [edgeOutline, setEdgeOutline] = useState<string | null>(null);
    const [edgeBox, setEdgeBox] = useState<Box | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const onGeneratedRef = useRef(onGenerated);
    onGeneratedRef.current = onGenerated;
    useEffect(() => { onGeneratedRef.current?.(generated); }, [generated]);

    // ── Generation: PREVIEW_DELAY_MS after the last change, the model's record built anew each time ──
    useEffect(() => {
        if (targetId === null) {
            setGenerated(null);
            setFailure(null);
            return;
        }
        const timer = setTimeout(() => {
            const lookup: Lookup = (store.getState() as any).idlookup ?? {};
            try {
                setGenerated(paneGeneration(generator, () => generateGenerator(evalGlobals(lookup, targetId), lookup, targetId, generator)));
                setFailure(null);
            } catch (error) {
                setGenerated(null);
                setFailure(error instanceof Error ? error.message : String(error));
            }
        }, PREVIEW_DELAY_MS);
        return () => clearTimeout(timer);
    }, [generator, targetId]);

    // The file shown follows the declared list: gone from it, the first.
    const file = generated?.files.find(f => f.path === filePath) ?? generated?.files[0] ?? null;
    const result = file?.result ?? null;
    const scenario = scenarios.find(s => s.name === scenarioName) ?? scenarios[0] ?? null;

    const timeoutMs = Number(timeout);
    const timeoutValid = Number.isFinite(timeoutMs) && timeoutMs >= 1;
    const offered = checkOffered(generator.target);
    const runnable = runOffered(generator.target);
    const canRun = runnable && !!result && !result.hasErrors && !running && !checking && timeoutValid;
    const canCheck = offered && !!result && !result.hasErrors && !running && !checking && timeoutValid && scenario !== null && targetId !== null;

    const run = async () => {
        if (!runnable || !result || result.hasErrors || !timeoutValid) return;
        const { code, map } = result;
        setRunning(true);
        setOutcome(null);
        setChecked(null);
        const t0 = performance.now();
        const response = await runInWorker({ code, calls: [{ fn: RUN_ENTRY, args: [] }], timeoutMs });
        if (!mounted.current) return;
        setOutcome({ response, ms: Math.round(performance.now() - t0), code, map });
        setRunning(false);
    };

    const check = async () => {
        if (!offered || !result || result.hasErrors || !timeoutValid || !scenario || targetId === null) return;
        const { code, map } = result;
        const chosen = scenario;
        setChecking(true);
        setOutcome(null);
        setChecked(null);
        const lookup: Lookup = (store.getState() as any).idlookup ?? {};
        let oracle: OracleResult;
        try {
            oracle = await runOracle({ lookup, modelId: targetId, globals: evalGlobals(lookup, targetId), scenario: chosen, code, map, timeoutMs });
        } catch (error) {
            // runOracle never rejects; the model's record can throw, as it can for the generation.
            oracle = { ok: false, kind: 'model', step: 0, message: error instanceof Error ? error.message : String(error), sim: [], gen: [] };
        }
        if (!mounted.current) return;
        setChecked({ result: oracle, scenario: chosen, map });
        setChecking(false);
    };

    // ── Provenance: code to canvas, code to template ──────────────────────────
    const selectOnCanvas = (elementId: string) => {
        if (targetId === null) return;
        setLinked(elementId);
        setNotice(null);
        const lookup: Lookup = (store.getState() as any).idlookup ?? {};
        void selectOnModelCanvas(lookup, targetId, elementId).then(pick => {
            if (!mounted.current) return;
            setEdgeOutline(pick?.kind === 'edge' ? pick.edgeId : null);
            if (!pick) setNotice(`${elementName(lookup, elementId)} is not on the canvas.`);
        });
    };

    const goToTemplate = (fragment: TextFragment) => {
        const target = templateTarget(fragment.origin);
        if (target) onGoToTemplate(target);
        else setNotice('This fragment names no template.');
    };

    const onSpanClick = (e: React.MouseEvent, entry: TextMapEntry) => {
        if (e.altKey) {
            e.preventDefault();
            goToTemplate(entry.fragment);
            return;
        }
        if (entry.origin.kind === 'model') selectOnCanvas(entry.origin.elementId);
    };

    // Canvas to code: the selected vertex's element, or the element an edge stands for.
    useEffect(() => {
        const onSelected = (event: Event) => {
            const id = (event as CustomEvent).detail?.elementId;
            if (typeof id !== 'string' || !id) return;
            const lookup: Lookup = (store.getState() as any).idlookup ?? {};
            const element = lookup[id]?.model;
            setLinked(typeof element === 'string' && element ? element : resolveEdgeSelectionTarget(id, lookup)?.modelElementId ?? id);
            setEdgeOutline(null);
            setNotice(null);
        };
        window.addEventListener(JjodelEvents.CANVAS_ELEMENT_SELECTED, onSelected);
        return () => window.removeEventListener(JjodelEvents.CANVAS_ELEMENT_SELECTED, onSelected);
    }, []);

    // The first linked span in view.
    useEffect(() => {
        if (!linked) return;
        revealIn(codeRef.current, codeRef.current?.querySelector('.code-span--linked'));
    }, [linked, result]);

    // The outline follows the edge on screen, pan and zoom included, until another selection; none while hidden.
    useEffect(() => {
        if (!edgeOutline || targetId === null) {
            setEdgeBox(null);
            return;
        }
        let frame = 0;
        const track = () => {
            const path = document.querySelector(`[role="tabpanel"][aria-labelledby$="-tab-${CSS.escape(targetId)}"] .react-flow__edge[data-id="${CSS.escape(edgeOutline)}"]`);
            const r = path?.getBoundingClientRect();
            if (r && r.width > 0 && r.height > 0) {
                setEdgeBox(prev => (prev && prev.left === r.left && prev.top === r.top && prev.width === r.width && prev.height === r.height
                    ? prev
                    : { left: r.left, top: r.top, width: r.width, height: r.height }));
            } else {
                setEdgeBox(null);
            }
            frame = requestAnimationFrame(track);
        };
        track();
        return () => cancelAnimationFrame(frame);
    }, [edgeOutline, targetId]);

    // ── Rendering ─────────────────────────────────────────────────────────────
    const lookupNow: Lookup = (store.getState() as any).idlookup ?? {};
    const lines = useMemo(() => (result ? linesOf(result.code, result.map) : []), [result]);
    const fragmentIndex = useMemo(() => new Map<TextFragment, number>((result?.text.fragments ?? []).map((f, i) => [f, i])), [result]);
    const runError = mode === 'run' && outcome && !outcome.response.ok ? outcome.response.error : null;
    const errorLine = runError && result && outcome && outcome.code === result.code ? runError.line : null;
    const errorElement = runError && runError.line !== null && outcome ? elementAt(outcome.map, runError.line, runError.column) : null;
    const view = mode === 'check' && checked ? checkView(checked.result, checked.scenario, id => elementName(lookupNow, id)) : null;
    const checkElement = view?.status === 'failure' && view.line !== null && checked ? elementAt(checked.map, view.line, null) : null;
    const noModel = targetId === null;
    const empty = noTemplates(generator);
    const checkTitle = !offered
        ? NOT_JS
        : noModel
        ? 'Create a model of this metamodel first.'
        : scenario === null
        ? NO_SCENARIO
        : result?.hasErrors ? 'Fix the generation errors first' : `Run the module on ${scenario.name} and compare it with the simulator, step by step`;

    // The line of a runtime error in view.
    useEffect(() => {
        if (errorLine === null) return;
        revealIn(codeRef.current, codeRef.current?.querySelector(`[data-line="${errorLine}"]`));
    }, [errorLine]);

    const spanClass = (e: TextMapEntry): string => {
        let c = `code-span code-span--${e.origin.kind}`;
        if (hover !== null && e.fragment === hover) c += ' code-span--hover';
        // A selected class links the spans of its instances (R-GEN-21).
        if (linked !== null && e.origin.kind === 'model'
            && (e.origin.elementId === linked || lookupNow[e.origin.elementId]?.instanceof === linked)) c += ' code-span--linked';
        return c;
    };

    // The fragment the gutter control of a line leads to: the hovered one on that line, else the line's first with a template.
    const lineTarget = (i: number): TextFragment | null => {
        const entries = lines[i]?.map(p => p.entry).filter((e): e is TextMapEntry => e !== null) ?? [];
        if (hover !== null && entries.some(e => e.fragment === hover) && templateTarget(hover.origin)) return hover;
        return entries.find(e => templateTarget(e.origin) !== null)?.fragment ?? null;
    };

    const modeButton = (m: PaneMode, label: string) => (
        <button type="button" role="tab" aria-selected={mode === m} className="codegen-panel__tab" onClick={() => setMode(m)}>
            {label}
        </button>
    );

    return (
        <section className="codegen-tpl__preview codegen-pane" aria-label="Generation" onKeyDown={e => e.stopPropagation()}>
            <div className="codegen-pane__head">
                <div className="codegen-panel__tabs codegen-pane__modes" role="tablist" aria-label="Mode">
                    {modeButton('preview', 'Preview')}
                    {modeButton('run', 'Run')}
                    {modeButton('check', 'Check')}
                </div>
                <span className="codegen-pane__target" title="The generator's target profile">{`target ${generator.target}`}</span>
            </div>
            <div className="codegen-panel__row">
                <span className="codegen-panel__label">Model</span>
                <select
                    className="codegen-panel__select"
                    aria-label="Model"
                    value={targetId ?? ''}
                    disabled={models.length === 0}
                    onChange={e => setChosenModel(e.target.value)}
                >
                    {models.length === 0 && <option value="">No model</option>}
                    {models.map(id => <option key={id} value={id}>{elementName(lookupNow, id)}</option>)}
                </select>
            </div>
            {noModel && (
                <div className="codegen-panel__hint codegen-panel__hint--empty" role="status">
                    {`No model conforms to ${elementName(lookupNow, metamodelId)}: create one to generate, run and check.`}
                </div>
            )}
            {empty && <div className="codegen-panel__hint codegen-panel__hint--empty" role="status">{NO_TEMPLATES}</div>}
            {!empty && generated && generated.files.length > 0 && (
                <div className="codegen-pane__files" role="tablist" aria-label="Files">
                    {generated.files.map(f => (
                        <button
                            type="button"
                            role="tab"
                            key={f.path}
                            aria-selected={file?.path === f.path}
                            className="codegen-pane__file"
                            title={`${f.path}: entry ${f.entry}`}
                            onClick={() => setFilePath(f.path)}
                        >
                            {f.path}
                            {f.result.hasErrors && <span className="codegen-pane__file-error" aria-label="has errors" />}
                        </button>
                    ))}
                </div>
            )}
            {!empty && generated && generated.files.length === 0 && <div className="codegen-panel__hint">This generator declares no file: add a template.</div>}
            {failure && <div className="codegen-panel__hint codegen-panel__hint--error">{`The model could not be read: ${failure}`}</div>}
            {!empty && mode === 'preview' && result && result.errors.length > 0 && (
                <ul className="codegen-panel__errors" aria-label="Generation errors">
                    {result.errors.map((e, i) => (
                        <li className="codegen-panel__error" key={`error-${i}`}>
                            <span className="codegen-panel__error-at">{`${e.template} ${e.line}:${e.column}`}</span>
                            <span>{e.message}</span>
                        </li>
                    ))}
                </ul>
            )}

            {!empty && mode === 'run' && (
                <div className="codegen-panel__row codegen-panel__run">
                    <button
                        type="button"
                        className="codegen-panel__button codegen-panel__button--primary"
                        disabled={!canRun}
                        title={!runnable ? RUN_NOT_JS : result?.hasErrors ? 'Fix the generation errors first' : `Run the module and call its ${RUN_ENTRY}()`}
                        onClick={() => { void run(); }}
                    >
                        <i className="bi bi-play-fill" />
                        <span>{running ? 'Running' : 'Run'}</span>
                    </button>
                    <label className="codegen-panel__timeout">
                        <span className="codegen-panel__label">Timeout</span>
                        <input className="codegen-panel__input" type="number" min={1} step={100} value={timeout} onChange={e => setTimeoutText(e.target.value)} />
                        <span className="codegen-panel__unit">ms</span>
                    </label>
                </div>
            )}
            {!empty && mode === 'check' && (
                <div className="codegen-panel__row codegen-panel__run">
                    <select
                        className="codegen-panel__scenario"
                        aria-label="Scenario"
                        title={scenario?.name ?? NO_SCENARIO}
                        value={scenario?.name ?? ''}
                        disabled={scenarios.length === 0 || !offered}
                        onChange={e => setScenarioName(e.target.value)}
                    >
                        {scenarios.length === 0 && <option value="">No scenario</option>}
                        {scenarios.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                    <label className="codegen-panel__timeout">
                        <span className="codegen-panel__label">Timeout</span>
                        <input className="codegen-panel__input" type="number" min={1} step={100} value={timeout} onChange={e => setTimeoutText(e.target.value)} />
                        <span className="codegen-panel__unit">ms</span>
                    </label>
                    <button type="button" className="codegen-panel__button codegen-panel__button--primary" disabled={!canCheck} title={checkTitle} onClick={() => { void check(); }}>
                        <i className="bi bi-check2-circle" />
                        <span>{checking ? 'Checking' : 'Check'}</span>
                    </button>
                </div>
            )}
            {!empty && mode === 'run' && !runnable && <div className="codegen-panel__hint" role="status">{RUN_NOT_JS}</div>}
            {!empty && mode === 'check' && !offered && <div className="codegen-panel__hint" role="status">{NOT_JS}</div>}
            {!empty && mode !== 'preview' && result?.hasErrors && <div className="codegen-panel__hint">{`${mode === 'run' ? 'Run' : 'Check'} is off while the generation has errors.`}</div>}

            {!empty && mode === 'run' && outcome && outcome.response.ok && (
                <div className="codegen-panel__result">
                    <div className="codegen-panel__label">{`${RUN_ENTRY}() returned, ${outcome.ms} ms`}</div>
                    <pre className="codegen-panel__value">{displayJson(outcome.response.results[0] ?? null, 2) ?? 'undefined'}</pre>
                </div>
            )}
            {!empty && runError && (
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
            {!empty && view?.status === 'pass' && (
                <div className="codegen-panel__result codegen-panel__result--pass" role="status" title={view.text}>
                    <i className="bi bi-check2-circle" />
                    <span>{view.text}</span>
                </div>
            )}
            {!empty && view && view.status !== 'pass' && (
                <div className="codegen-panel__result codegen-panel__result--error" role="alert">
                    <div className="codegen-panel__run-error">{view.text}</div>
                    {view.status === 'divergence' ? (
                        <>
                            {view.lines.map((l, i) => <div className="codegen-panel__check-line" key={i}>{l}</div>)}
                            {view.more > 0 && <div className="codegen-panel__check-line">{`+${view.more} more`}</div>}
                            {view.link && (
                                <div className="codegen-panel__run-at">
                                    {`line ${view.link.line} · `}
                                    <button type="button" className="codegen-panel__link" onClick={() => selectOnCanvas(view.link!.elementId)}>
                                        {elementName(lookupNow, view.link.elementId)}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="codegen-panel__check-line">{view.message}</div>
                            {view.line !== null && (
                                <div className="codegen-panel__run-at">
                                    {`line ${view.line}`}
                                    {checkElement && (
                                        <>
                                            {' · '}
                                            <button type="button" className="codegen-panel__link" onClick={() => selectOnCanvas((checkElement as ModelOrigin).elementId)}>
                                                {elementName(lookupNow, checkElement.elementId)}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {!empty && result && (
                <pre className="codegen-panel__code codegen-pane__code" ref={codeRef} aria-label="Generated text" onMouseLeave={() => setHoverLine(null)}>
                    {lines.map((pieces, i) => {
                        const jump = hoverLine === i ? lineTarget(i) : null;
                        return (
                            <span
                                className={`codegen-panel__line${errorLine === i + 1 ? ' codegen-panel__line--error' : ''}`}
                                data-line={i + 1}
                                key={i}
                                onMouseEnter={() => setHoverLine(i)}
                            >
                                <span className="codegen-panel__gutter codegen-pane__gutter">
                                    {jump ? (
                                        <button
                                            type="button"
                                            className="codegen-pane__jump"
                                            title={`Go to template ${templateTarget(jump.origin)!.template} (Alt+click a span)`}
                                            aria-label="Go to template"
                                            onClick={() => goToTemplate(jump)}
                                        >
                                            <i className="bi bi-box-arrow-in-left" />
                                        </button>
                                    ) : i + 1}
                                </span>
                                <span className="codegen-panel__text">
                                    {pieces.map((p, j) => (p.entry === null ? (
                                        <React.Fragment key={j}>{p.text}</React.Fragment>
                                    ) : (
                                        <span
                                            key={j}
                                            className={spanClass(p.entry)}
                                            data-fragment={fragmentIndex.get(p.entry.fragment)}
                                            data-origin-id={p.entry.origin.kind === 'model' ? p.entry.origin.elementId : undefined}
                                            data-template={templateTarget(p.entry.origin)?.template}
                                            onMouseEnter={() => setHover(p.entry!.fragment)}
                                            onMouseLeave={() => setHover(null)}
                                            onClick={e => onSpanClick(e, p.entry!)}
                                        >
                                            {p.text}
                                        </span>
                                    )))}
                                </span>
                            </span>
                        );
                    })}
                </pre>
            )}
            {!empty && <div className="codegen-panel__origin" aria-live="polite">
                {notice ?? (hover
                    ? originText(lookupNow, hover.origin)
                    : 'Hover a span for its origin; click a model value to select it on the canvas, Alt+click to go to its template.')}
            </div>}
            {edgeBox && createPortal(
                <div
                    className="codegen-panel__edge-outline codegen-pane__edge-outline"
                    style={{ left: edgeBox.left - 4, top: edgeBox.top - 4, width: edgeBox.width + 8, height: edgeBox.height + 8 }}
                />,
                document.body,
            )}
        </section>
    );
}
