/**
 * Editor tab of a project script file (S6a, R-JJD-5), a Refactoring under R-JJD-14.
 *
 * Split (P-2026-10-24-2320): the editor on the left (600 px, resizable 480..800, the width kept per
 * browser profile like the Jjodie dock's, written on pointer-up), a read-only view of the target
 * metamodel on the right. The header holds the name with a dirty dot (Cmd+S saves the entry; the
 * project Save stays in the top bar), «Refactoring of» and the one target selector, the warnings
 * counter and `Preview`. The target level shows under the title, and the selector lists only the
 * models it fits.
 *
 * The script is planned (`planEffects`, read-only, R-JJD-2) against the selected target 300 ms after
 * typing: amber dots in the gutter on lines with warnings, a wavy underline on the names that do not
 * resolve, and a list under the editor. `Preview` draws the plan on the right pane and opens the bar;
 * `Apply` runs the script as one undo step (R-JJD-6) through the canvas preview's own path
 * (`applyAsOneStep`) and closes the preview, `Discard` closes it. Editing while previewing re-plans.
 * Nothing runs from the header.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Editor, { type OnMount } from '@monaco-editor/react';
import { store } from '../../../joiner';
import {
    projectTargetCandidates, readProjectScript, saveProjectScript,
} from '../../scripts/scriptFiles';
import { compatibleModels, readTarget, targetLabel } from '../../scripts/projectScripts';
import { diagnosticsOf, gutterLines, rangeLabel, type RefactoringDiagnostic } from '../../scripts/refactoringDiagnostics';
import { RefactoringPreviewBar, RefactoringPreviewPane } from '../../scripts/RefactoringPreviewPane';
import { planEffects, type EffectsPlan, type PlanWorld } from '../../../jjscript/executor/effectsPlanner';
import { buildPlanWorld } from '../../../jjscript/executor/planWorld';
import { applyAsOneStep } from '../../editor-v2/preview/PreviewBar';
import { createdCounts, effectsMismatch, plannedCounts } from '../../editor-v2/preview/previewApplyCheck';
import { toast } from '../../Toast/toastDispatch';
import { JJSCRIPT_LANGUAGE_ID, JJSCRIPT_THEME_ID, registerJjscriptLanguage } from '../../../jjscript/editor/jjscriptMonaco';
import './ScriptTab.scss';

export interface ScriptTabProps {
    scriptId: string;
}

/** The planning delay after typing. */
const PLAN_DEBOUNCE_MS = 300;
const MARKER_OWNER = 'jjscript-plan';

export const EDITOR_WIDTH_KEY = 'jjodel.refactoring.editorWidth';
export const EDITOR_WIDTH_MIN = 480;
export const EDITOR_WIDTH_MAX = 800;
export const EDITOR_WIDTH_DEFAULT = 600;

const clampWidth = (w: number) => Math.min(EDITOR_WIDTH_MAX, Math.max(EDITOR_WIDTH_MIN, Math.round(w)));

function readEditorWidth(): number {
    try {
        const v = Number(window.localStorage.getItem(EDITOR_WIDTH_KEY));
        return v ? clampWidth(v) : EDITOR_WIDTH_DEFAULT;
    } catch {
        return EDITOR_WIDTH_DEFAULT;
    }
}

interface PlanState { text: string; modelId: string; world: PlanWorld; plan: EffectsPlan | null }

/** The tab title: the entry's name from the store, so a rename from the tree or the megamodel shows at once (S6c). */
export const ScriptTabTitle: React.FC<{ scriptId: string; name: string }> = ({ scriptId, name }) => {
    const stored = useSelector((state: any) => readProjectScript(scriptId, state)?.name);
    return <div className="tab-title active-on-mouseenter" data-type="script">{stored ?? name}</div>;
};

const ScriptTab: React.FC<ScriptTabProps> = ({ scriptId }) => {
    const entry = useSelector((state: any) => readProjectScript(scriptId, state));
    const candidates = useSelector((state: any) => projectTargetCandidates(state),
        (a, b) => a.length === b.length && a.every((m, i) => m.id === b[i].id && m.name === b[i].name
            && m.isMetamodel === b[i].isMetamodel && m.metamodelId === b[i].metamodelId));
    const idlookup = useSelector((state: any) => state.idlookup);
    const target = readTarget(entry);
    const models = useMemo(() => compatibleModels(candidates, target),
        [candidates, target.level, target.metamodelId]); // eslint-disable-line react-hooks/exhaustive-deps
    const targetText = targetLabel(target, candidates.find(c => c.id === target.metamodelId)?.name);

    const [text, setText] = useState<string>(entry?.text ?? '');
    const [modelId, setModelId] = useState<string>(entry?.modelId ?? '');

    // The chosen model falls back to the first compatible one when the stored one is gone or does not fit.
    const chosen = useMemo(
        () => (models.some(m => m.id === modelId) ? modelId : models[0]?.id || ''),
        [models, modelId]);

    // Saved elsewhere (another tab on the same entry, a later Jjodie write): follow it when not dirty.
    const [savedText, setSavedText] = useState<string>(entry?.text ?? '');
    useEffect(() => {
        if (entry && entry.text !== savedText) {
            if (text === savedText) setText(entry.text);
            setSavedText(entry.text);
        }
    }, [entry?.text]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Planning, debounced ───────────────────────────────────────────────────
    const [planState, setPlanState] = useState<PlanState | null>(null);
    const planGeneration = useRef(0);
    const firstPlan = useRef(true);
    useEffect(() => {
        if (!chosen) { setPlanState(null); return; }
        const mine = ++planGeneration.current;
        const delay = firstPlan.current ? 0 : PLAN_DEBOUNCE_MS;
        firstPlan.current = false;
        const timer = window.setTimeout(async () => {
            const world = buildPlanWorld((store.getState() as any).idlookup ?? {}, chosen);
            let plan: EffectsPlan | null = null;
            if (text.trim()) {
                try {
                    plan = await planEffects(text, world);
                } catch (err) {
                    console.warn('[ScriptTab] Could not plan the refactoring.', err);
                }
            }
            if (mine === planGeneration.current) setPlanState({ text, modelId: chosen, world, plan });
        }, delay);
        return () => window.clearTimeout(timer);
    }, [text, chosen, idlookup]);

    const current = planState && planState.modelId === chosen ? planState : null;
    const plan = current?.plan ?? null;
    const diagnostics = useMemo(() => (current ? diagnosticsOf(current.plan, current.text) : []), [current]);
    const warnings = diagnostics.filter(d => d.severity === 'warning').length;
    const errors = diagnostics.length - warnings;

    // ── Monaco: gutter dots, underlines, Cmd+S ────────────────────────────────
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
    const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
    const decorationsRef = useRef<ReturnType<Parameters<OnMount>[0]['createDecorationsCollection']> | null>(null);
    const saveRef = useRef<() => void>(() => undefined);
    const [editorReady, setEditorReady] = useState(false);

    const onMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveRef.current());
        setEditorReady(true);
    };

    useEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        const model = editor?.getModel();
        if (!editor || !monaco || !model) return;
        // Diagnostics of a text the editor no longer holds would land on the wrong lines.
        const live = current && current.text === model.getValue() ? diagnostics : [];
        const lineCount = model.getLineCount();
        decorationsRef.current ??= editor.createDecorationsCollection();
        decorationsRef.current.set(gutterLines(live)
            .filter(g => g.line <= lineCount)
            .map(g => ({
                range: new monaco.Range(g.line, 1, g.line, 1),
                options: {
                    glyphMarginClassName: `script-tab__glyph script-tab__glyph--${g.severity}`,
                    glyphMarginHoverMessage: { value: live.filter(d => d.line === g.line).map(d => d.message).join('\n\n') },
                },
            })));
        monaco.editor.setModelMarkers(model, MARKER_OWNER, live
            .filter(d => d.startColumn && d.endColumn && d.line <= lineCount)
            .map(d => ({
                severity: d.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
                message: d.message,
                code: d.code,
                startLineNumber: d.line, endLineNumber: d.line,
                startColumn: d.startColumn!, endColumn: d.endColumn!,
            })));
    }, [diagnostics, current, editorReady]);

    const revealLine = (d: RefactoringDiagnostic) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.revealLineInCenter(d.line);
        editor.setPosition({ lineNumber: d.line, column: d.startColumn || 1 });
        editor.focus();
    };

    // ── Split width ───────────────────────────────────────────────────────────
    const [editorWidth, setEditorWidth] = useState<number>(readEditorWidth);
    const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
    const onHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
        dragRef.current = { startX: e.clientX, startWidth: editorWidth };
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = dragRef.current;
        if (d) setEditorWidth(clampWidth(d.startWidth + e.clientX - d.startX));
    };
    const onHandleUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
        try { window.localStorage.setItem(EDITOR_WIDTH_KEY, String(editorWidth)); } catch { /* private mode */ }
    };

    // ── Preview and Apply ─────────────────────────────────────────────────────
    const [previewing, setPreviewing] = useState(false);
    const [busy, setBusy] = useState(false);
    const typeName = useCallback((id: string) => (store.getState() as any).idlookup?.[id]?.name as string | undefined, []);

    const save = () => {
        if (!entry) return;
        saveProjectScript(scriptId, chosen && chosen !== entry.modelId ? { text, modelId: chosen } : { text });
    };
    saveRef.current = save;

    const apply = async () => {
        if (!entry || !current?.plan || busy) return;
        setBusy(true);
        try {
            if (chosen !== entry.modelId) saveProjectScript(scriptId, { modelId: chosen });
            const before = buildPlanWorld((store.getState() as any).idlookup ?? {}, chosen);
            const { applied, failed } = await applyAsOneStep({ script: current.text, modelId: chosen, world: current.world });
            if (failed > 0) toast.warning(`${applied} lines applied, ${failed} failed.`, 'Refactoring applied in part');
            else toast.success(`${applied} lines applied.`, 'Refactoring applied');
            const after = buildPlanWorld((store.getState() as any).idlookup ?? {}, chosen);
            const diff = effectsMismatch(plannedCounts(current.plan), createdCounts(before, after));
            if (diff) console.warn('[ScriptTab] Apply: planned and real effects differ:', diff);
            setPreviewing(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Unknown error', 'Refactoring not applied');
        } finally {
            setBusy(false);
        }
    };

    if (!entry) {
        return <div className="script-tab script-tab--missing">This script is no longer in the project.</div>;
    }

    const dirty = text !== entry.text;
    const stale = !current || current.text !== text;
    const world = current?.world ?? null;
    const metamodelId = world?.m2?.id;
    const metamodelName = world?.m2?.name;
    const conforming = metamodelId ? candidates.filter(c => !c.isMetamodel && c.metamodelId === metamodelId).length : 0;

    return (
        <div className="script-tab" data-script-id={scriptId}>
            <div className="script-tab__toolbar">
                <span className="script-tab__heading">
                    <span className="script-tab__name" title={entry.name}>
                        <i className="bi bi-arrow-repeat" aria-hidden="true" />
                        {entry.name}
                        {dirty && <span className="script-tab__dirty" aria-label="Unsaved changes" title="Unsaved changes (Cmd+S saves)">•</span>}
                    </span>
                    <span className="script-tab__target" data-target-level={target.level || 'any'}>
                        Refactoring · {targetText}
                    </span>
                </span>
                <span className="script-tab__spacer" />
                <label className="script-tab__of">
                    Refactoring of
                    <select className="script-tab__model" aria-label="Refactoring target" value={chosen}
                            onChange={e => setModelId(e.target.value)} disabled={!models.length || busy}>
                        {!models.length && <option value="">No model</option>}
                        {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </label>
                <span className={`script-tab__warnings${warnings ? ' script-tab__warnings--on' : ''}${errors ? ' script-tab__warnings--errors' : ''}`}
                      data-warnings={warnings} data-errors={errors} title="Planner warnings">
                    <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                    {warnings} {warnings === 1 ? 'warning' : 'warnings'}{errors ? ` · ${errors} ${errors === 1 ? 'error' : 'errors'}` : ''}
                </span>
                <button type="button"
                        className={`script-tab__button script-tab__button--primary script-tab__button--solid${previewing ? ' script-tab__button--active' : ''}`}
                        onClick={() => setPreviewing(true)} disabled={!chosen || !text.trim() || busy} aria-pressed={previewing}>
                    Preview
                </button>
            </div>
            <div className="script-tab__split">
                <div className="script-tab__left" style={{ width: editorWidth }}>
                    <div className="script-tab__editor">
                        <Editor
                            width="100%"
                            height="100%"
                            language={JJSCRIPT_LANGUAGE_ID}
                            theme={JJSCRIPT_THEME_ID}
                            beforeMount={registerJjscriptLanguage}
                            onMount={onMount}
                            value={text}
                            onChange={(value) => setText(value || '')}
                            options={{
                                minimap: { enabled: false },
                                lineNumbers: 'on',
                                glyphMargin: true,
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                            }}
                        />
                    </div>
                    {diagnostics.length > 0 && (
                        <ul className="script-tab__problems" aria-label="Planner diagnostics">
                            {diagnostics.map((d, i) => (
                                <li key={`${d.line}:${d.code}:${i}`} className={`script-tab__problem script-tab__problem--${d.severity}`}
                                    data-code={d.code} onClick={() => revealLine(d)}>
                                    <span className="script-tab__problem-at">{rangeLabel(d)}</span>
                                    <span className="script-tab__problem-msg">{d.message}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="script-tab__handle" role="separator" aria-orientation="vertical" aria-label="Resize the editor"
                     aria-valuemin={EDITOR_WIDTH_MIN} aria-valuemax={EDITOR_WIDTH_MAX} aria-valuenow={editorWidth}
                     onPointerDown={onHandleDown} onPointerMove={onHandleMove} onPointerUp={onHandleUp} onPointerCancel={onHandleUp} />
                <div className="script-tab__right">
                    <RefactoringPreviewPane world={world} plan={plan} previewing={previewing}
                                            metamodelName={metamodelName} typeName={typeName} />
                    {previewing && plan && (
                        <RefactoringPreviewBar plan={plan} conformingModels={conforming} busy={busy} stale={stale}
                                               onDiscard={() => setPreviewing(false)} onApply={() => { void apply(); }} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScriptTab;
