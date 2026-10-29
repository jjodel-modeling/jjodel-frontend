/**
 * TemplateEditorTab — the templates of one metamodel in a dock tab, over Monaco (slice S2, P-2026-10-23-1945;
 * R-GEN-20, R-GEN-22, R-GEN-24; discovery §3.4, §5.2, §5.3).
 *
 * Opened by openTemplateEditor.ts, one tab per metamodel, `cached` so a hidden tab keeps its drafts. On the left the
 * metamodel's templates, a dot on each with an unsaved draft; in the centre the name, the parameters and the body of
 * the selected one, the body in Monaco with the `jjel-template` language (templateLanguage.ts) and the markers of
 * templateMarkers.ts (owner `codegen-parse`), set on every change. The «Mode» select (S5, R-GEN-27) converts the
 * body between text and expression (templateMode.ts) as a draft edit, and the model switches to the language of the
 * mode, `jjel-template-text` for text; a body that cannot be converted keeps its mode, with the reason.
 *
 * On the right the preview (S3, P-2026-10-23-2225): a model conforming to the metamodel (conformingModels.ts), an
 * entry (`main` if present, else the edited template), and the generated text in the Code panel's `<pre>`-with-gutter
 * form (codeLines.ts). It generates PREVIEW_DELAY_MS after the last edit over the stored list with the drafts merged
 * in (templatePreview.ts), the model's record built anew each time as CodePanel.tsx builds it. The errors are listed
 * above the text; those of the edited template are also Monaco markers at their hole (owner `codegen-gen`). No Run,
 * no Check: they stay in the panel.
 *
 * Completion (S4, P-2026-10-23-2300): the tab sets the context of its Monaco model in templateCompletion.ts, built on
 * demand over the store's metamodel and the templates with the drafts merged in, and clears it on unmount.
 *
 * Typing writes nothing: the drafts live here (templateDrafts.ts). «Save» and Ctrl/Cmd+S write every draft at once,
 * through `templatesPatch` and the metamodel's `state` setter, one SetFieldAction, one undo step, nothing when the
 * list is unchanged; a template with no draft follows the store, so an Undo after a Save shows the stored body again.
 * «New template» and «Delete» write at once, as the Code panel's own editor does (CodePanel.tsx), each one undo step.
 *
 * The tab is not closable by rc-dock: its title carries the close button, which asks before dropping unsaved
 * drafts (rc-dock's own close removes the tab with no way to ask). The title and the opener reach an open tab
 * through the registry below, by metamodel id.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { DUser, LPointerTargetable, Monaco, monaco, store } from '../../joiner';
import { buildEvalContext } from '../../jjscript';
import { evalContextFor } from '../../components/editor-v2/sim/simBridge';
import DockManager from '../../components/abstract/DockManager';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import { largeMonacoOptions, mergeMonacoOptions } from '../../components/editors/monacoConfig';
import { generate } from '../engine/generate';
import { GEN_TEMPLATES_KEY, decodeTemplates, templatesPatch } from '../engine/templateCodec';
import { TEMPLATE_LANGUAGE_ID, TEMPLATE_TEXT_LANGUAGE_ID, TEMPLATE_THEME_ID, ensureTemplateLanguage } from './templateLanguage';
import { templateMarkers } from './templateMarkers';
import { convertBody } from './templateMode';
import { applyDrafts, changedOutside, editDraft, followStore, paramsOf, shownDraft } from './templateDrafts';
import { conformingModels } from './conformingModels';
import { linesOf } from './codeLines';
import { previewEntry, previewMarkers, previewTemplates } from './templatePreview';
import { buildCompletionContext, setTemplateCompletionContext } from './templateCompletion';
import type { DraftEdit, Drafts } from './templateDrafts';
import type { GenerateResult } from '../engine/generate';
import type { TemplateCompletionContext } from './templateCompletion';
import type { TemplateMode, TemplateRecord } from '../engine/templates';
import './TemplateEditorTab.scss';

/** The dock tab id of a metamodel's Template Editor (R-GEN-20). */
export const templateTabId = (metamodelId: string): string => `codegen_tpl_${metamodelId}`;

/** The Monaco marker owner of the parse errors. */
const MARKER_OWNER = 'codegen-parse';

/** The Monaco marker owner of the preview's generation errors (S3). */
const GEN_MARKER_OWNER = 'codegen-gen';

/** The pause after the last edit before the preview generates again (S3, discovery §3.4, risk 6). */
const PREVIEW_DELAY_MS = 400;

type Lookup = Record<string, any>;

/** The project of the current user, as CodePanel.tsx reads it; '' when none. */
function projectIdOfUser(): string {
    try {
        return (LPointerTargetable.fromPointer(DUser.current as any) as any)?.project?.id ?? '';
    } catch {
        return '';
    }
}

/** An element's name for a reader, as CodePanel.tsx words it. */
function elementName(lookup: Lookup, id: string): string {
    const d = lookup[id];
    return typeof d?.name === 'string' && d.name ? d.name : `${d?.className ?? 'element'} ${id}`;
}

/** One refresh of the preview: the generation, or why the model could not be read. */
interface Preview {
    readonly result: GenerateResult | null;
    readonly failure: string | null;
}

// ── Registry of the open tabs, by metamodel id ───────────────────────────────

interface OpenTab {
    select(name: string | null): void;
    requestClose(): void;
}

const openTabs = new Map<string, OpenTab>();
const dirtyCounts = new Map<string, number>();
const dirtyListeners = new Set<() => void>();

function setDirtyCount(metamodelId: string, n: number | null): void {
    if (n === null) dirtyCounts.delete(metamodelId);
    else dirtyCounts.set(metamodelId, n);
    dirtyListeners.forEach(l => l());
}

const subscribeDirty = (listener: () => void) => {
    dirtyListeners.add(listener);
    return () => { dirtyListeners.delete(listener); };
};

/** Selects a template in the open tab of the metamodel; false when no tab is open. */
export function selectInTemplateTab(metamodelId: string, name: string | null): boolean {
    const tab = openTabs.get(metamodelId);
    if (!tab) return false;
    tab.select(name);
    return true;
}

// ── Title ────────────────────────────────────────────────────────────────────

export interface TemplateTabTitleProps {
    readonly metamodelId: string;
    readonly name: string;
}

export function TemplateTabTitle({ metamodelId, name }: TemplateTabTitleProps): React.ReactElement {
    const dirty = useSyncExternalStore(subscribeDirty, () => dirtyCounts.get(metamodelId) ?? 0);
    const close = (e: React.SyntheticEvent) => {
        e.stopPropagation();
        const tab = openTabs.get(metamodelId);
        if (tab) tab.requestClose();
        else DockManager.closeTab(templateTabId(metamodelId));
    };
    return (
        <div className="tab-title active-on-mouseenter codegen-tpl-title">
            <i className="bi bi-code-slash" />
            <span>{`Templates · ${name}`}</span>
            {dirty > 0 && <span className="codegen-tpl-title__dirty" title={`${dirty} unsaved`} />}
            <button
                type="button"
                className="codegen-tpl-title__close"
                title="Close"
                aria-label="Close the Template Editor"
                onMouseDown={e => e.stopPropagation()}
                onClick={close}
            >
                <i className="bi bi-x" />
            </button>
        </div>
    );
}

// ── Tab ──────────────────────────────────────────────────────────────────────

export interface TemplateEditorTabProps {
    readonly metamodelId: string;
    /** The template selected on open; the first when absent or gone. */
    readonly initial?: string | null;
}

/** A unique name for a new template, over the stored names and the names drafts give. */
function freshName(taken: ReadonlySet<string>): string {
    let n = taken.size + 1;
    while (taken.has(`template${n}`)) n++;
    return `template${n}`;
}

interface Item {
    /** The draft key: the stored name, or the base name of a draft whose template is gone. */
    readonly key: string;
    readonly record: TemplateRecord;
    readonly stored: boolean;
}

export default function TemplateEditorTab({ metamodelId, initial = null }: TemplateEditorTabProps): React.ReactElement {
    const exists = useSelector((state: any) => !!state.idlookup?.[metamodelId]);
    const raw = useSelector((state: any) => {
        const v = state.idlookup?.[metamodelId]?._state?.[GEN_TEMPLATES_KEY];
        return typeof v === 'string' ? v : v === undefined || v === null ? v : String(v);
    }) as string | null | undefined;
    const decoded = useMemo(() => decodeTemplates(raw), [raw]);
    const templates = decoded.templates;

    const [drafts, setDrafts] = useState<Drafts>({});
    const [selected, setSelected] = useState<string | null>(initial);
    const [refused, setRefused] = useState<string | null>(null);
    const [confirmClose, setConfirmClose] = useState(false);

    // Drafts the store has come to hold are dropped (an Undo/Redo onto the draft, the panel saving the same text).
    useEffect(() => {
        setDrafts(d => followStore(d, templates));
    }, [templates]);

    const items: Item[] = useMemo(() => [
        ...templates.map(t => ({ key: t.name, record: t, stored: true })),
        ...Object.entries(drafts).filter(([key]) => !templates.some(t => t.name === key)).map(([key, d]) => ({ key, record: d.base, stored: false })),
    ], [templates, drafts]);
    const current = items.find(i => i.key === selected) ?? items[0] ?? null;
    const shown = current ? shownDraft(drafts, current.record) : null;
    const applied = useMemo(() => applyDrafts(templates, drafts), [templates, drafts]);
    const dirtyCount = Object.keys(drafts).length;
    const problem = current ? applied.problems[current.key] ?? null : null;
    const outside = current && drafts[current.key] ? changedOutside(drafts[current.key], templates) : false;

    // ── Preview (S3): a model of the metamodel, an entry, the generated text ──
    const models = useSelector((state: any) => conformingModels(state.idlookup ?? {}, projectIdOfUser(), metamodelId), shallowEqual);
    const [chosenModel, setChosenModel] = useState<string | null>(null);
    const [chosenEntry, setChosenEntry] = useState<string | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const targetId = chosenModel !== null && models.includes(chosenModel) ? chosenModel : models[0] ?? null;
    const previewList = useMemo(() => previewTemplates(templates, drafts), [templates, drafts]);
    const edited = shown ? shown.name.trim() : null;
    const entryName = previewEntry(previewList, chosenEntry, edited);

    // Generated again PREVIEW_DELAY_MS after the last change; the model's record is built anew each time.
    useEffect(() => {
        if (entryName === null || targetId === null) {
            setPreview(null);
            return;
        }
        const timer = setTimeout(() => {
            const lookup: Lookup = (store.getState() as any).idlookup ?? {};
            try {
                const globals = buildEvalContext(evalContextFor(lookup, targetId, projectIdOfUser()), { extentModelId: targetId });
                setPreview({ result: generate(globals, lookup, targetId, previewList, entryName), failure: null });
            } catch (error) {
                setPreview({ result: null, failure: error instanceof Error ? error.message : String(error) });
            }
        }, PREVIEW_DELAY_MS);
        return () => clearTimeout(timer);
    }, [previewList, entryName, targetId]);
    const previewLines = useMemo(() => (preview?.result ? linesOf(preview.result.code, preview.result.map) : []), [preview]);

    // ── Writes ──────────────────────────────────────────────────────────────
    const write = useCallback((next: readonly TemplateRecord[]) => {
        const patch = templatesPatch(raw, next);
        if (!patch) return;
        (LPointerTargetable.fromPointer(metamodelId as any) as any).state = patch;
    }, [metamodelId, raw]);

    const save = () => {
        if (dirtyCount === 0) return;
        const firstProblem = Object.entries(applied.problems)[0];
        if (firstProblem) {
            setSelected(firstProblem[0]);
            setRefused(`Not saved: ${firstProblem[1]}`);
            return;
        }
        write(applied.next);
        if (current && drafts[current.key]) setSelected(drafts[current.key].name.trim());
        setDrafts({});
        setRefused(null);
    };
    const saveRef = useRef(save);
    saveRef.current = save;

    const edit = (change: DraftEdit) => {
        if (!current) return;
        setRefused(null);
        setDrafts(d => editDraft(d, current.record, change));
    };

    const addTemplate = () => {
        const taken = new Set([...templates.map(t => t.name), ...Object.values(drafts).map(d => d.name.trim()), ...Object.keys(drafts)]);
        const name = freshName(taken);
        write([...templates, { name, params: [], body: '', mode: 'text' }]);
        setSelected(name);
    };

    const deleteCurrent = () => {
        if (!current) return;
        const key = current.key;
        setDrafts(({ [key]: _gone, ...others }) => others);
        if (current.stored) write(templates.filter(t => t.name !== key));
    };

    const switchMode = (to: TemplateMode) => {
        if (!shown) return;
        const converted = convertBody(shown.body, shown.mode, to);
        if (!converted.ok) {
            setRefused(converted.reason);
            return;
        }
        edit({ body: converted.body, mode: to });
    };

    const revertCurrent = () => {
        if (!current) return;
        const key = current.key;
        setDrafts(({ [key]: _gone, ...others }) => others);
        setRefused(null);
    };

    // ── Registry: selection from the opener, close from the title ───────────
    const draftsRef = useRef(drafts);
    draftsRef.current = drafts;
    useEffect(() => {
        openTabs.set(metamodelId, {
            select: name => { if (name !== null) setSelected(name); },
            requestClose: () => {
                if (Object.keys(draftsRef.current).length === 0) DockManager.closeTab(templateTabId(metamodelId));
                else setConfirmClose(true);
            },
        });
        return () => {
            openTabs.delete(metamodelId);
            setDirtyCount(metamodelId, null);
        };
    }, [metamodelId]);
    useEffect(() => {
        setDirtyCount(metamodelId, dirtyCount);
    }, [metamodelId, dirtyCount]);

    // ── Monaco ──────────────────────────────────────────────────────────────
    const hostRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const applying = useRef(false);
    const editRef = useRef(edit);
    editRef.current = edit;
    const mode: TemplateMode = shown?.mode ?? 'text';
    const modeRef = useRef(mode);
    modeRef.current = mode;
    // The completion context of this render's templates and edited template, built when a completion is asked for.
    const completionRef = useRef<() => TemplateCompletionContext | null>(() => null);
    completionRef.current = () => buildCompletionContext(
        (store.getState() as any).idlookup ?? {}, metamodelId, previewList, shown ? edited : null, shown ? paramsOf(shown.params) : [],
    );

    const mark = (model: Monaco.editor.ITextModel) => {
        const markers = templateMarkers(model.getValue(), modeRef.current).map(m => ({ ...m, severity: monaco.MarkerSeverity.Error }));
        monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
    };

    useEffect(() => {
        if (!hostRef.current) return;
        ensureTemplateLanguage();
        const model = monaco.editor.createModel('', modeRef.current === 'text' ? TEMPLATE_TEXT_LANGUAGE_ID : TEMPLATE_LANGUAGE_ID);
        const editor = monaco.editor.create(hostRef.current, {
            ...mergeMonacoOptions(largeMonacoOptions, {
                fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace",
                fontSize: 13,
                lineHeight: 20,
                wordWrap: 'on',
                tabSize: 4,
                insertSpaces: true,
                automaticLayout: true,
                // A quote typed before a quote steps over it: `""` plus a typed opening quote leaves no stray one.
                autoClosingOvertype: 'always',
            }),
            model,
            theme: TEMPLATE_THEME_ID,
        });
        editorRef.current = editor;
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveRef.current());
        const uri = model.uri.toString();
        setTemplateCompletionContext(uri, () => completionRef.current());
        const sub = editor.onDidChangeModelContent(() => {
            mark(model);
            if (!applying.current) editRef.current({ body: model.getValue() });
        });
        return () => {
            setTemplateCompletionContext(uri, null);
            sub.dispose();
            editor.dispose();
            model.dispose();
            editorRef.current = null;
        };
    }, []);

    // The editor shows the selected template's draft, or its stored body: an outside write reaches it here.
    const body = shown?.body ?? '';
    const hasTemplate = shown !== null;
    useEffect(() => {
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!editor || !model) return;
        editor.updateOptions({ readOnly: !hasTemplate });
        const language = mode === 'text' ? TEMPLATE_TEXT_LANGUAGE_ID : TEMPLATE_LANGUAGE_ID;
        if (model.getLanguageId() !== language) monaco.editor.setModelLanguage(model, language);
        if (model.getValue() !== body) {
            applying.current = true;
            model.setValue(body);
            applying.current = false;
        }
        mark(model);
    }, [body, mode, hasTemplate, current?.key]);

    // The preview's errors of the edited template, at their hole; between refreshes Monaco moves them with the text.
    useEffect(() => {
        const model = editorRef.current?.getModel();
        if (!model) return;
        const parsed = templateMarkers(model.getValue(), modeRef.current);
        const markers = previewMarkers(preview?.result?.errors ?? [], hasTemplate ? edited : null, parsed);
        monaco.editor.setModelMarkers(model, GEN_MARKER_OWNER, markers.map(m => ({ ...m, severity: monaco.MarkerSeverity.Error })));
    }, [preview, edited, hasTemplate]);

    // Ctrl/Cmd+S outside Monaco (the name and parameter fields).
    const onKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            e.stopPropagation();
            save();
        }
    };

    return (
        <div className="codegen-tpl" onKeyDown={onKeyDown}>
            <aside className="codegen-tpl__side">
                <div className="codegen-tpl__side-title">Templates</div>
                {decoded.defects.map((d, i) => (
                    <div className="codegen-tpl__hint codegen-tpl__hint--warning" key={`defect-${i}`}>
                        {d.index === null ? d.message : `Template ${d.index + 1}: ${d.message}`}
                    </div>
                ))}
                <div className="codegen-tpl__list" role="listbox" aria-label="Templates">
                    {items.map(i => {
                        const d = drafts[i.key];
                        const label = d ? d.name.trim() || i.key : i.record.name;
                        const params = d ? d.params : i.record.params.join(', ');
                        return (
                            <button
                                type="button"
                                role="option"
                                aria-selected={current?.key === i.key}
                                className="codegen-tpl__item"
                                key={i.key}
                                onClick={() => setSelected(i.key)}
                            >
                                <span className="codegen-tpl__item-name">{label}</span>
                                <span className="codegen-tpl__item-params">{`(${params})`}</span>
                                {d && <span className="codegen-tpl__dirty" title="Unsaved changes" aria-label="unsaved" />}
                            </button>
                        );
                    })}
                </div>
                <button type="button" className="codegen-tpl__add" disabled={!exists} onClick={addTemplate}>
                    <i className="bi bi-plus-lg" />
                    <span>New template</span>
                </button>
            </aside>

            <section className="codegen-tpl__main">
                {!exists && <div className="codegen-tpl__hint codegen-tpl__hint--error">This metamodel is gone: its templates cannot be saved.</div>}
                {current && shown ? (
                    <div className="codegen-tpl__fields">
                        <label className="codegen-tpl__field">
                            <span className="codegen-tpl__label">Name</span>
                            <input
                                className="codegen-tpl__input"
                                value={shown.name}
                                spellCheck={false}
                                onChange={e => edit({ name: e.target.value })}
                            />
                        </label>
                        <label className="codegen-tpl__field codegen-tpl__field--wide">
                            <span className="codegen-tpl__label">Parameters</span>
                            <input
                                className="codegen-tpl__input"
                                value={shown.params}
                                placeholder="a, b"
                                spellCheck={false}
                                onChange={e => edit({ params: e.target.value })}
                            />
                        </label>
                        <label className="codegen-tpl__field">
                            <span className="codegen-tpl__label">Mode</span>
                            <select
                                className="codegen-tpl__input"
                                value={shown.mode}
                                title="Text: the body is the output, with ${…} holes. Expression: the body is a JjEL expression."
                                onChange={e => switchMode(e.target.value as TemplateMode)}
                            >
                                <option value="text">Text</option>
                                <option value="expression">Expression</option>
                            </select>
                        </label>
                    </div>
                ) : (
                    <div className="codegen-tpl__hint">No template yet: «New template» adds one.</div>
                )}
                <div className={`codegen-tpl__monaco${current ? '' : ' codegen-tpl__monaco--empty'}`} ref={hostRef} />
                {problem && <div className="codegen-tpl__hint codegen-tpl__hint--error">{problem}</div>}
                {refused && !problem && <div className="codegen-tpl__hint codegen-tpl__hint--error">{refused}</div>}
                {outside && (
                    <div className="codegen-tpl__hint codegen-tpl__hint--warning">
                        This template changed outside the editor since the draft began: Save writes the draft over it, Revert takes the stored one.
                    </div>
                )}
                <div className="codegen-tpl__actions">
                    <button
                        type="button"
                        className="codegen-tpl__button codegen-tpl__button--primary"
                        disabled={dirtyCount === 0 || !exists}
                        title="Save every draft (Ctrl/Cmd+S): one undo step"
                        onClick={save}
                    >
                        <i className="bi bi-check2" />
                        <span>{dirtyCount > 1 ? `Save ${dirtyCount}` : 'Save'}</span>
                    </button>
                    <button
                        type="button"
                        className="codegen-tpl__button"
                        disabled={!current || !drafts[current.key]}
                        title="Drop the draft of this template"
                        onClick={revertCurrent}
                    >
                        <i className="bi bi-arrow-counterclockwise" />
                        <span>Revert</span>
                    </button>
                    <button
                        type="button"
                        className="codegen-tpl__button"
                        disabled={!current || !exists}
                        title={current ? `Delete ${current.record.name}` : undefined}
                        onClick={deleteCurrent}
                    >
                        <i className="bi bi-trash" />
                        <span>Delete</span>
                    </button>
                </div>
                <div className="codegen-tpl__help">
                    A template is text with {'${…}'} holes ({'\\${'} writes {'${'}), or in expression mode a JjEL expression; templates call each other by name.
                    Typing writes nothing: Save writes every draft at once.
                </div>
            </section>

            <section className="codegen-tpl__preview" aria-label="Preview">
                <div className="codegen-tpl__side-title">Preview</div>
                <div className="codegen-tpl__fields">
                    <label className="codegen-tpl__field codegen-tpl__field--wide">
                        <span className="codegen-tpl__label">Model</span>
                        <select
                            className="codegen-tpl__input"
                            value={targetId ?? ''}
                            disabled={models.length === 0}
                            onChange={e => setChosenModel(e.target.value)}
                        >
                            {models.length === 0 && <option value="">No model</option>}
                            {models.map(id => <option key={id} value={id}>{elementName((store.getState() as any).idlookup ?? {}, id)}</option>)}
                        </select>
                    </label>
                    <label className="codegen-tpl__field codegen-tpl__field--wide">
                        <span className="codegen-tpl__label">Entry</span>
                        <select
                            className="codegen-tpl__input"
                            value={entryName ?? ''}
                            disabled={previewList.length === 0}
                            onChange={e => setChosenEntry(e.target.value)}
                        >
                            {previewList.map((t, i) => <option key={`${i}-${t.name}`} value={t.name}>{t.name}</option>)}
                        </select>
                    </label>
                </div>
                {models.length === 0 && (
                    <div className="codegen-tpl__hint" role="status">No model conforms to this metamodel: create one to see the generated text.</div>
                )}
                {preview?.failure && <div className="codegen-tpl__hint codegen-tpl__hint--error">{`The model could not be read: ${preview.failure}`}</div>}
                {preview?.result && preview.result.errors.length > 0 && (
                    <ul className="codegen-tpl__errors" aria-label="Generation errors">
                        {preview.result.errors.map((e, i) => (
                            <li className="codegen-tpl__error" key={`error-${i}`}>
                                <span className="codegen-tpl__error-at">{`${e.template} ${e.line}:${e.column}`}</span>
                                <span>{e.message}</span>
                            </li>
                        ))}
                    </ul>
                )}
                {preview?.result && (
                    <pre className="codegen-tpl__code" aria-label="Generated text">
                        {previewLines.map((pieces, i) => (
                            <span className="codegen-tpl__line" data-line={i + 1} key={i}>
                                <span className="codegen-tpl__gutter">{i + 1}</span>
                                <span className="codegen-tpl__text">
                                    {pieces.map((p, j) => (p.entry === null
                                        ? <React.Fragment key={j}>{p.text}</React.Fragment>
                                        : <span key={j} className={`codegen-tpl__span codegen-tpl__span--${p.entry.origin.kind}`}>{p.text}</span>))}
                                </span>
                            </span>
                        ))}
                    </pre>
                )}
            </section>

            <ConfirmDialog
                isOpen={confirmClose}
                title="Discard unsaved templates?"
                message={`${dirtyCount} template${dirtyCount === 1 ? ' has' : 's have'} unsaved changes. Closing the editor discards them.`}
                confirmText="Discard and close"
                cancelText="Keep editing"
                variant="warning"
                onConfirm={() => {
                    setConfirmClose(false);
                    DockManager.closeTab(templateTabId(metamodelId));
                }}
                onCancel={() => setConfirmClose(false)}
            />
        </div>
    );
}
