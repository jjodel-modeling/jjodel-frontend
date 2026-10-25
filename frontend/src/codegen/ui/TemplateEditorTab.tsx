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
 * through the registry below, by tab id.
 *
 * Slice G3 (P-2026-10-24-0003; R-GEN-36, R-GEN-40, R-GEN-41): the tab is one generator's, id `generatorTabId`
 * (generatorTabs.ts), titled «<generator> · <metamodel>». The list is that generator's templates (codec G1), and a
 * Save writes them through `saveGeneratorTemplates`, one `state` set, one undo step; the default's list is still
 * `genTemplates`. Above the list a selector opens another generator's tab, and New, Rename, Delete write one patch
 * each (Delete refuses the default, and closes the tab). The right pane is GeneratorPane.tsx: Preview, Run and Check
 * over a conforming model, its generation errors of the edited template still Monaco markers here; «go to template»
 * from a fragment selects that template here and reveals the producing range when the origin gives it. The paragraph
 * on the preview above describes S3; the entry select gave way to the generator's declared files.
 *
 * Beside the canvas (P-2026-10-25-0925): while an opened generator tab sits beside the canvas the Properties/Tree rail
 * is collapsed, by the topbar's own `toggleRail`, and it comes back as it was when no generator tab is beside any
 * more; a reopen by the user is kept until the next opening (`useRailBeside` below, the rules in generatorTabs.ts).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { shallowEqual, useSelector } from 'react-redux';
import { LPointerTargetable, Monaco, monaco, store } from '../../joiner';
import { buildEvalContext } from '../../jjscript';
import { evalContextFor } from '../../components/editor-v2/sim/simBridge';
import DockManager from '../../components/abstract/DockManager';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import { largeMonacoOptions, mergeMonacoOptions } from '../../components/editors/monacoConfig';
import { GEN_TEMPLATES_KEY } from '../engine/templateCodec';
import {
    DEFAULT_GENERATOR_ID, GEN_GENERATORS_KEY, addGenerator, decodeGenerators, generatorsPatch, removeGenerator, renameGenerator,
} from '../engine/generatorCodec';
import { TEMPLATE_LANGUAGE_ID, TEMPLATE_TEXT_LANGUAGE_ID, TEMPLATE_THEME_ID, ensureTemplateLanguage } from './templateLanguage';
import { templateMarkers } from './templateMarkers';
import { convertBody } from './templateMode';
import { applyDrafts, changedOutside, editDraft, followStore, paramsOf, shownDraft } from './templateDrafts';
import { previewMarkers, previewTemplates } from './templatePreview';
import { buildCompletionContext, setTemplateCompletionContext } from './templateCompletion';
import type { DraftEdit, Drafts } from './templateDrafts';
import { elementName } from './codeOrigins';
import { useTreeViewPanel } from '../../contexts/TreeViewPanelContext';
import {
    armRailCollapse, forgetRail, generatorBeside, generatorTabId, railShown, railStep, rememberGenerator, saveGeneratorTemplates, templateToSelect,
} from './generatorTabs';
import { openTemplateEditor } from './openTemplateEditor';
import GeneratorPane from './GeneratorPane';
import { ColumnSplitter, SPLIT_MIN_PX, readSplitRatio } from './splitter';
import type { GeneratorResult } from '../engine/generateFiles';
import type { GeneratorRecord } from '../engine/generatorCodec';
import type { TemplateTarget } from './codeOrigins';
import type { TemplateCompletionContext } from './templateCompletion';
import type { TemplateMode, TemplateRecord } from '../engine/templates';
import './TemplateEditorTab.scss';

/** The dock tab id of a metamodel's Template Editor (R-GEN-20); a generator's other than the default's (G3). */
export const templateTabId = (metamodelId: string, generatorId: string = DEFAULT_GENERATOR_ID): string => generatorTabId(metamodelId, generatorId);

/** The Monaco marker owner of the parse errors. */
const MARKER_OWNER = 'codegen-parse';

/** The Monaco marker owner of the preview's generation errors (S3). */
const GEN_MARKER_OWNER = 'codegen-gen';

/** A stored key as the codecs read it. */
const storedKey = (v: unknown): string | null | undefined => (typeof v === 'string' ? v : v === undefined || v === null ? v : String(v));

/** The two keys of a metamodel's generators, from the store. */
function useGeneratorKeys(metamodelId: string): { rawT: string | null | undefined; rawG: string | null | undefined } {
    const rawT = useSelector((state: any) => storedKey(state.idlookup?.[metamodelId]?._state?.[GEN_TEMPLATES_KEY]));
    const rawG = useSelector((state: any) => storedKey(state.idlookup?.[metamodelId]?._state?.[GEN_GENERATORS_KEY]));
    return { rawT, rawG };
}

/** A generator name no generator of the list holds. */
function freshGeneratorName(list: readonly GeneratorRecord[]): string {
    const taken = new Set(list.map(g => g.name));
    let n = list.length;
    while (taken.has(`generator${n}`)) n++;
    return `generator${n}`;
}

/**
 * Creates a generator on the metamodel, named fresh, and opens its tab on `model` (the selector's «New generator»,
 * and the left bar's «+ New generator» through openTemplateEditor, R-GEN-42); the new generator's id, or null when
 * the metamodel is gone.
 */
export function createGenerator(metamodelId: string, model?: string): string | null {
    const idlookup = (store.getState() as any).idlookup ?? {};
    if (!idlookup[metamodelId]) return null;
    const bag = idlookup[metamodelId]._state;
    const rawT = storedKey(bag?.[GEN_TEMPLATES_KEY]);
    const rawG = storedKey(bag?.[GEN_GENERATORS_KEY]);
    const current = decodeGenerators(rawT, rawG).generators;
    const next = addGenerator(current, freshGeneratorName(current));
    const patch = generatorsPatch(rawT, rawG, next);
    if (patch) (LPointerTargetable.fromPointer(metamodelId as any) as any).state = patch;
    const id = next[next.length - 1].id;
    openTemplateEditor(metamodelId, elementName(idlookup, metamodelId), null, id, model);
    return id;
}

// ── Registry of the open tabs, by tab id ─────────────────────────────────────

interface OpenTab {
    select(name: string | null): void;
    chooseModel(modelId: string): void;
    requestClose(): void;
}

const openTabs = new Map<string, OpenTab>();
const dirtyCounts = new Map<string, number>();
const dirtyListeners = new Set<() => void>();

function setDirtyCount(tabId: string, n: number | null): void {
    if (n === null) dirtyCounts.delete(tabId);
    else dirtyCounts.set(tabId, n);
    dirtyListeners.forEach(l => l());
}

const subscribeDirty = (listener: () => void) => {
    dirtyListeners.add(listener);
    return () => { dirtyListeners.delete(listener); };
};

/** Selects a template in the open tab of the metamodel's generator (the default when absent); false when no tab is open. */
export function selectInTemplateTab(metamodelId: string, name: string | null, generatorId?: string): boolean {
    const tab = openTabs.get(templateTabId(metamodelId, generatorId));
    if (!tab) return false;
    tab.select(name);
    return true;
}

/** Chooses the model of the right pane in the open tab of the metamodel's generator; false when no tab is open. */
export function chooseModelInTemplateTab(metamodelId: string, modelId: string, generatorId?: string): boolean {
    const tab = openTabs.get(templateTabId(metamodelId, generatorId));
    if (!tab) return false;
    tab.chooseModel(modelId);
    return true;
}

// ── Title ────────────────────────────────────────────────────────────────────

export interface TemplateTabTitleProps {
    readonly metamodelId: string;
    readonly name: string;
    /** The generator of the tab; the default when absent (G3). */
    readonly generatorId?: string;
}

export function TemplateTabTitle({ metamodelId, name, generatorId = DEFAULT_GENERATOR_ID }: TemplateTabTitleProps): React.ReactElement {
    const tabId = templateTabId(metamodelId, generatorId);
    const dirty = useSyncExternalStore(subscribeDirty, () => dirtyCounts.get(tabId) ?? 0);
    const { rawT, rawG } = useGeneratorKeys(metamodelId);
    const generatorName = useMemo(() => decodeGenerators(rawT, rawG).generators.find(g => g.id === generatorId)?.name ?? generatorId, [rawT, rawG, generatorId]);
    const close = (e: React.SyntheticEvent) => {
        e.stopPropagation();
        const tab = openTabs.get(tabId);
        if (tab) tab.requestClose();
        else DockManager.closeTab(tabId);
    };
    return (
        <div className="tab-title active-on-mouseenter codegen-tpl-title">
            <i className="bi bi-code-slash" />
            <span>{`${generatorName} · ${name}`}</span>
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
    /** The generator of the tab; the default when absent (G3). */
    readonly generatorId?: string;
    /** The model the right pane chooses first (a pill pressed on a model canvas). */
    readonly model?: string | null;
}

/** A unique name for a new template, over the stored names and the names drafts give. */
function freshName(taken: ReadonlySet<string>): string {
    let n = taken.size + 1;
    while (taken.has(`template${n}`)) n++;
    return `template${n}`;
}

/** An element's horizontal paddings and borders, 0 when absent. */
function frameWidth(el: Element | null | undefined): number {
    if (!el) return 0;
    const cs = getComputedStyle(el);
    return [cs.paddingLeft, cs.paddingRight, cs.borderLeftWidth, cs.borderRightWidth].reduce((n, v) => n + (parseFloat(v) || 0), 0);
}

// ── The rail beside the tab (P-2026-10-25-0925) ──────────────────────────────

/** The rail's state and its own controls, as the tabs' provider gives them. */
interface RailControls {
    readonly tree: boolean;
    readonly inspector: boolean;
    readonly toggleRail: () => void;
    readonly show: () => void;
    readonly showInspector: () => void;
}

/** The controls of the last rendered tab: every tab reads the same provider. */
let railControls: RailControls | null = null;
let mountedTabs = 0;

/** Applies the rail's step for the dock as it is now (generatorTabs.ts `railStep`). */
function settleRail(c: RailControls): void {
    const dock = DockManager.dock;
    const step = railStep(!!dock && generatorBeside(dock.getLayout()), { tree: c.tree, inspector: c.inspector });
    if (step?.kind === 'collapse') c.toggleRail();
    else if (step?.kind === 'restore') {
        if (step.zones.tree) c.show();
        if (step.zones.inspector) c.showInspector();
    }
}

/**
 * A reload or a close while the rail is auto-collapsed: its zones come back first, synchronously, so the keys the
 * provider stores them under keep the user's state and nothing of the auto-collapse is persisted.
 */
function restoreOnLeave(): void {
    const c = railControls;
    if (!c) return;
    const step = railStep(false, { tree: c.tree, inspector: c.inspector });
    if (step?.kind !== 'restore') return;
    flushSync(() => {
        if (step.zones.tree) c.show();
        if (step.zones.inspector) c.showInspector();
    });
}

/** An opening of a generator tab (openTemplateEditor.ts): the rail collapses once the tab is beside the canvas. */
export function collapseRailOnOpen(): void {
    armRailCollapse();
    // A tab already on screen beside the canvas does not resize: settle once the dock has rendered the opening.
    setTimeout(() => { if (railControls) settleRail(railControls); }, 0);
}

/**
 * The rail collapses while an opened generator tab is beside the canvas, the way the topbar's control collapses it
 * (`toggleRail`), and comes back as it was when none is. A tab is shown, hidden, moved and resized as its root
 * resizes; a closed tab settles after it has left the dock. A reopen by the user drops the memory (`railShown`).
 */
function useRailBeside(rootRef: React.RefObject<HTMLElement>): void {
    const { isVisible, isInspectorVisible, isRailVisible, toggleRail, show, showInspector } = useTreeViewPanel();
    const live = useRef<RailControls>({ tree: isVisible, inspector: isInspectorVisible, toggleRail, show, showInspector });
    live.current = { tree: isVisible, inspector: isInspectorVisible, toggleRail, show, showInspector };
    railControls = live.current;
    useEffect(() => {
        if (isRailVisible) railShown();
    }, [isRailVisible]);
    useEffect(() => {
        if (mountedTabs++ === 0) window.addEventListener('pagehide', restoreOnLeave);
        const el = rootRef.current;
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => settleRail(live.current));
        if (el && observer) observer.observe(el);
        return () => {
            observer?.disconnect();
            mountedTabs--;
            const last = live.current;
            setTimeout(() => {
                settleRail(last);
                if (mountedTabs === 0) {
                    window.removeEventListener('pagehide', restoreOnLeave);
                    forgetRail();
                    railControls = null;
                }
            }, 0);
        };
    }, []);
}

interface Item {
    /** The draft key: the stored name, or the base name of a draft whose template is gone. */
    readonly key: string;
    readonly record: TemplateRecord;
    readonly stored: boolean;
}

const NO_TEMPLATES: readonly TemplateRecord[] = [];

export default function TemplateEditorTab({ metamodelId, initial = null, generatorId = DEFAULT_GENERATOR_ID, model = null }: TemplateEditorTabProps): React.ReactElement {
    const tabId = templateTabId(metamodelId, generatorId);
    const exists = useSelector((state: any) => !!state.idlookup?.[metamodelId]);
    const { rawT, rawG } = useGeneratorKeys(metamodelId);
    const decoded = useMemo(() => decodeGenerators(rawT, rawG), [rawT, rawG]);
    const generator = decoded.generators.find(g => g.id === generatorId) ?? null;
    const templates = generator?.templates ?? NO_TEMPLATES;
    const defects = decoded.defects.filter(d => d.id === generatorId || (generatorId === DEFAULT_GENERATOR_ID && d.id === null));

    const [drafts, setDrafts] = useState<Drafts>({});
    const [selected, setSelected] = useState<string | null>(initial);
    const [refused, setRefused] = useState<string | null>(null);
    const [confirmClose, setConfirmClose] = useState(false);

    // The editor column's share of the width right of the list, against the right pane (P-2026-10-24-1515).
    const [split, setSplit] = useState(() => readSplitRatio());
    const rootRef = useRef<HTMLDivElement>(null);
    useRailBeside(rootRef);
    const mainRef = useRef<HTMLElement>(null);
    const splitArea = useCallback(() => {
        const root = rootRef.current?.getBoundingClientRect();
        const mainEl = mainRef.current;
        if (!root || !mainEl) return null;
        const main = mainEl.getBoundingClientRect();
        const barEl = rootRef.current?.querySelector('.codegen-tpl__splitter');
        const bar = barEl?.getBoundingClientRect().width ?? 0;
        // The columns' paddings and borders sit outside the flex share: the split is measured on what grows, so the
        // column's edge follows the pointer and the minimums hold on the columns' outer widths.
        const fm = frameWidth(mainEl), fp = frameWidth(barEl?.nextElementSibling);
        return {
            left: main.left + fm,
            width: root.right - main.left - bar - fm - fp,
            minStart: Math.max(0, SPLIT_MIN_PX - fm),
            minEnd: Math.max(0, SPLIT_MIN_PX - fp),
        };
    }, []);

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

    // ── Preview (S3, G3): the generator with the drafts merged in, generated by the right pane ──
    const previewList = useMemo(() => previewTemplates(templates, drafts), [templates, drafts]);
    const edited = shown ? shown.name.trim() : null;
    const previewGenerator = useMemo(() => (generator ? { ...generator, templates: previewList } : null), [generator, previewList]);
    const [generated, setGenerated] = useState<GeneratorResult | null>(null);
    const [paneModel, setPaneModel] = useState<string | null>(model);
    const pendingReveal = useRef<TemplateTarget | null>(null);
    const [revealTick, setRevealTick] = useState(0);

    // ── Writes ──────────────────────────────────────────────────────────────
    const writePatch = useCallback((patch: Record<string, string> | null) => {
        if (!patch) return;
        (LPointerTargetable.fromPointer(metamodelId as any) as any).state = patch;
    }, [metamodelId]);
    const write = useCallback((next: readonly TemplateRecord[]) => {
        writePatch(saveGeneratorTemplates(rawT, rawG, decoded.generators, generatorId, next));
    }, [writePatch, rawT, rawG, decoded, generatorId]);

    // ── Generators: open another, New, Rename, Delete (one patch each) ────────
    const metamodelName = () => elementName((store.getState() as any).idlookup ?? {}, metamodelId);
    const [renaming, setRenaming] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const openGenerator = (id: string) => {
        if (id !== generatorId) openTemplateEditor(metamodelId, metamodelName(), null, id, paneModel ?? undefined);
    };
    const newGenerator = () => { createGenerator(metamodelId, paneModel ?? undefined); };
    const commitRename = () => {
        const name = (renaming ?? '').trim();
        setRenaming(null);
        if (name && generator && name !== generator.name) writePatch(generatorsPatch(rawT, rawG, renameGenerator(decoded.generators, generatorId, name)));
    };
    const deleteGenerator = () => {
        setConfirmDelete(false);
        if (generatorId === DEFAULT_GENERATOR_ID) return;
        writePatch(generatorsPatch(rawT, rawG, removeGenerator(decoded.generators, generatorId)));
        openTemplateEditor(metamodelId, metamodelName(), null, DEFAULT_GENERATOR_ID, paneModel ?? undefined);
        DockManager.closeTab(tabId);
    };

    // «Go to template» (R-GEN-41): the template selected here, the producing range revealed once its body is shown.
    const goToTemplate = useCallback((target: TemplateTarget) => {
        const name = templateToSelect(templates.map(t => t.name), target);
        if (name === null) {
            setRefused(`The template ${target.template} is not in this generator.`);
            return;
        }
        setRefused(null);
        setSelected(name);
        pendingReveal.current = target;
        setRevealTick(t => t + 1);
    }, [templates]);

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
        openTabs.set(tabId, {
            select: name => { if (name !== null) setSelected(name); },
            chooseModel: id => setPaneModel(id),
            requestClose: () => {
                if (Object.keys(draftsRef.current).length === 0) DockManager.closeTab(tabId);
                else setConfirmClose(true);
            },
        });
        rememberGenerator(metamodelId, generatorId);
        return () => {
            openTabs.delete(tabId);
            setDirtyCount(tabId, null);
        };
    }, [tabId, metamodelId, generatorId]);
    useEffect(() => {
        setDirtyCount(tabId, dirtyCount);
    }, [tabId, dirtyCount]);

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

    // The producing range of a «go to template», once the template's body is in the editor.
    useEffect(() => {
        const target = pendingReveal.current;
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!target || !editor || !model || current?.key !== target.template) return;
        pendingReveal.current = null;
        editor.focus();
        if (target.line === null || target.line > model.getLineCount()) return;
        const column = Math.max(1, target.column ?? 1);
        const end = model.getLineMaxColumn(target.line);
        editor.setSelection(new monaco.Selection(target.line, column, target.line, Math.max(column, end)));
        editor.revealLineInCenter(target.line);
    }, [revealTick, current?.key, body]);

    // The preview's errors of the edited template, at their hole; between refreshes Monaco moves them with the text.
    useEffect(() => {
        const model = editorRef.current?.getModel();
        if (!model) return;
        const parsed = templateMarkers(model.getValue(), modeRef.current);
        const errors = (generated?.files ?? []).flatMap(f => f.result.errors);
        const markers = previewMarkers(errors, hasTemplate ? edited : null, parsed);
        monaco.editor.setModelMarkers(model, GEN_MARKER_OWNER, markers.map(m => ({ ...m, severity: monaco.MarkerSeverity.Error })));
    }, [generated, edited, hasTemplate]);

    // Ctrl/Cmd+S outside Monaco (the name and parameter fields).
    const onKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            e.stopPropagation();
            save();
        }
    };

    return (
        <div className="codegen-tpl" ref={rootRef} onKeyDown={onKeyDown} onPointerDownCapture={() => rememberGenerator(metamodelId, generatorId)}>
            <aside className="codegen-tpl__side">
                <div className="codegen-tpl__side-title">Generator</div>
                <div className="codegen-tpl__generator">
                    {renaming !== null ? (
                        <input
                            className="codegen-tpl__input"
                            aria-label="Generator name"
                            value={renaming}
                            autoFocus
                            spellCheck={false}
                            onChange={e => setRenaming(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={e => {
                                if (e.key === 'Enter') commitRename();
                                if (e.key === 'Escape') setRenaming(null);
                            }}
                        />
                    ) : (
                        <select
                            className="codegen-tpl__input"
                            aria-label="Generator"
                            value={generatorId}
                            onChange={e => openGenerator(e.target.value)}
                        >
                            {decoded.generators.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            {!generator && <option value={generatorId}>{`${generatorId} (gone)`}</option>}
                        </select>
                    )}
                    <div className="codegen-tpl__generator-actions">
                        <button type="button" className="codegen-tpl__icon" title="New generator" aria-label="New generator" disabled={!exists} onClick={newGenerator}>
                            <i className="bi bi-plus-lg" />
                        </button>
                        <button
                            type="button"
                            className="codegen-tpl__icon"
                            title="Rename the generator"
                            aria-label="Rename the generator"
                            disabled={!exists || !generator}
                            onClick={() => setRenaming(generator?.name ?? '')}
                        >
                            <i className="bi bi-pencil" />
                        </button>
                        <button
                            type="button"
                            className="codegen-tpl__icon"
                            title={generatorId === DEFAULT_GENERATOR_ID ? 'The default generator cannot be deleted' : 'Delete the generator'}
                            aria-label="Delete the generator"
                            disabled={!exists || !generator || generatorId === DEFAULT_GENERATOR_ID}
                            onClick={() => setConfirmDelete(true)}
                        >
                            <i className="bi bi-trash" />
                        </button>
                    </div>
                </div>
                {generator && (
                    <div className="codegen-tpl__generator-meta">
                        {`target ${generator.target} · ${generator.files.map(f => f.path).join(', ') || 'no file'}`}
                    </div>
                )}
                {!generator && <div className="codegen-tpl__hint codegen-tpl__hint--error">This generator is gone.</div>}
                <div className="codegen-tpl__side-title">Templates</div>
                {defects.map((d, i) => (
                    <div className="codegen-tpl__hint codegen-tpl__hint--warning" key={`defect-${i}`}>
                        {d.template ? (d.template.index === null ? d.template.message : `Template ${d.template.index + 1}: ${d.template.message}`) : d.message}
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
                <button type="button" className="codegen-tpl__add" disabled={!exists || !generator} onClick={addTemplate}>
                    <i className="bi bi-plus-lg" />
                    <span>New template</span>
                </button>
            </aside>

            <section className="codegen-tpl__main" ref={mainRef} style={{ flex: `${split / (1 - split)} 1 0` }}>
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
                        disabled={dirtyCount === 0 || !exists || !generator}
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

            <ColumnSplitter ratio={split} onRatio={setSplit} area={splitArea} />

            {previewGenerator ? (
                <GeneratorPane metamodelId={metamodelId} generator={previewGenerator} model={paneModel} onGoToTemplate={goToTemplate} onGenerated={setGenerated} />
            ) : (
                <section className="codegen-tpl__preview" aria-label="Generation" />
            )}

            <ConfirmDialog
                isOpen={confirmClose}
                title="Discard unsaved templates?"
                message={`${dirtyCount} template${dirtyCount === 1 ? ' has' : 's have'} unsaved changes. Closing the editor discards them.`}
                confirmText="Discard and close"
                cancelText="Keep editing"
                variant="warning"
                onConfirm={() => {
                    setConfirmClose(false);
                    DockManager.closeTab(tabId);
                }}
                onCancel={() => setConfirmClose(false)}
            />
            <ConfirmDialog
                isOpen={confirmDelete}
                title="Delete the generator?"
                message={`${generator?.name ?? generatorId} and its ${templates.length} template${templates.length === 1 ? '' : 's'} are removed from ${metamodelName()}: one undo step.`}
                confirmText="Delete"
                cancelText="Keep"
                variant="warning"
                onConfirm={deleteGenerator}
                onCancel={() => setConfirmDelete(false)}
            />
        </div>
    );
}
