import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { EditorV2 } from '../../editor-v2/EditorV2';
import { ActiveEditorProvider } from '../../editor-v2/ActiveEditorContext';
import { store } from '../../../joiner';
import { activateViewpoint } from '../../../utils/lastViewpoint';
import DockManager from '../DockManager';
import { JjodelEvents } from '../../../events/registry';
import './EditorSwitch.scss';

export type EditorMode = 'classic' | 'v2';

type EditorViewMode = 'flow' | 'classic' | 'split';

/**
 * Per-model editor preferences, persisted in localStorage keyed per model
 * (`jjodel.editorPrefs.${modelid}`), following the documented idiom in
 * EditorV2.tsx (`jjodel.highlight.${modelid}` etc.). These do NOT travel with
 * the project file — no Redux schema change, no D field, no VersionFixer migration.
 */
type EditorPrefs = { viewpointId?: string; editorMode?: EditorViewMode };

/** Reads the per-model editor preferences. Tolerates missing / partial / corrupt JSON. */
function readEditorPrefs(modelid: string): EditorPrefs {
    try {
        const raw = localStorage.getItem('jjodel.editorPrefs.' + modelid);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object') ? parsed as EditorPrefs : {};
    } catch { return {}; }
}

/** Merges a partial preference over the stored one and writes it back. Quota / private-mode safe. */
function writeEditorPrefs(modelid: string, partial: EditorPrefs): void {
    try {
        const next: EditorPrefs = { ...readEditorPrefs(modelid), ...partial };
        localStorage.setItem('jjodel.editorPrefs.' + modelid, JSON.stringify(next));
    } catch { /* quota / private mode */ }
}

/**
 * Whether `tabId` is the dock's active tab: `dockbox.children[0].activeId`, the definition
 * Dock.tsx, MyRcDock.tsx and Navbar.tsx already use. rc-dock keeps inactive tabs mounted
 * (off-screen), so "mounted" does not mean "the tab the user is looking at". The model tab id
 * is the model id (TabDataMaker.model). False when the dock is not available.
 */
export function isActiveDockTab(tabId: string): boolean {
    try {
        const panel = DockManager.dock?.getLayout()?.dockbox?.children?.[0] as any;
        return !!tabId && panel?.activeId === tabId;
    } catch { return false; }
}

/**
 * The saved viewpoint the mounting tab of `modelid` should activate, or null.
 * R-MT-16: only the dock's active tab restores; a tab mounting behind it would otherwise switch
 * the project-global viewpoint, and with it the syntax of the tab the user is looking at.
 * Validates against state.viewpoints (the plural array IS scrubbed by VersionFixer, unlike the
 * singular state.viewpoint). A missing or deleted viewpoint is a graceful no-op.
 * R-MT-18: a saved '' is abstract syntax, a preference like any other, returned as '' and
 * restored with activateViewpoint(null); null stays "nothing to restore" (no preference saved).
 */
export function savedViewpointToRestore(modelid: string, currentVpId: string | null | undefined): string | null {
    const savedVpId = readEditorPrefs(modelid).viewpointId;
    if (typeof savedVpId !== 'string') return null;  // no preference saved
    if (savedVpId === '') {
        if (!currentVpId) return null;                // abstract syntax already in force
    } else {
        const known = (store.getState().viewpoints || []) as string[];
        if (!known.includes(savedVpId)) return null;  // deleted / unknown viewpoint
        if (savedVpId === currentVpId) return null;   // already the active (snapshot-restored) one
    }
    if (!isActiveDockTab(modelid)) return null;     // mounted behind the active tab (R-MT-16)
    return savedVpId;
}

/**
 * The viewpoint a model tab starts with (R-MT-1: the active viewpoint belongs to the tab): the one
 * its mount restores, when savedViewpointToRestore returned one, else the root's. `null` is
 * abstract syntax, the canonical empty (R-IRN-21); '' never enters the tab state.
 */
export function initialTabViewpoint(rootVpId: string | null | undefined, restored: string | null): string | null {
    if (restored !== null) return restored || null;
    return rootVpId || null;
}

/**
 * Saves a viewpoint pick as the preference of `modelid` only. Called by the picker of that
 * model's toolbar (Toolbar.tsx), not by every mounted EditorSwitch on a root change: that wrote
 * a pick made in one tab as the preference of every other open model (R-MT-16).
 */
export function saveViewpointPreference(modelid: string, viewpointId: string | null | undefined): void {
    writeEditorPrefs(modelid, { viewpointId: viewpointId || '', editorMode: 'flow' });
}

interface EditorSwitchProps {
    /** Model ID passed to the editor. */
    modelid: string;
    /** Legacy classic editor JSX. Ignored since the classic shutdown (Fase 5a). */
    children?: ReactNode;
    /** Metamodels never enter the toggle/split flow — they always render the flow editor only. */
    isMetamodel?: boolean;
}

/**
 * Wrapper that decides whether EditorV2 should expose the 3-state mode toggle
 * (flow / classic / split). When a viewpoint is active, the toggle is shown
 * and the user can pick the layout; metamodels and viewpoint-less models keep
 * the flow editor only.
 */
export function EditorSwitch({ modelid, children, isMetamodel }: EditorSwitchProps) {
    const viewpointId = useSelector((state: any) => state.viewpoint) as string | undefined;

    // The tab's own viewpoint (R-MT-1, multi-tab L2), what this tab's EditorV2 and toolbar picker
    // read through EditorContext. It starts from the root, or from the preference the mount
    // restores, and stays in step with the root while the tab is focused (the effects below).
    // A metamodel owns none: no picker, no focus write, the root passes through as before.
    const [restoreAtMount] = useState<string | null>(() =>
        isMetamodel ? null : savedViewpointToRestore(modelid, viewpointId));
    const [tabViewpointId, setTabViewpointId] = useState<string | null>(() =>
        initialTabViewpoint(viewpointId, restoreAtMount));
    const shownViewpointId: string | null = isMetamodel ? (viewpointId || null) : tabViewpointId;
    const hasViewpoint = !!shownViewpointId && !isMetamodel;
    const tabViewpointRef = useRef(tabViewpointId);
    tabViewpointRef.current = tabViewpointId;
    const rootViewpointRef = useRef(viewpointId);
    rootViewpointRef.current = viewpointId;
    // Whether this tab is the dock's active one, kept by the ACTIVE_TAB listener below.
    const focusedRef = useRef<boolean | null>(null);
    if (focusedRef.current === null) focusedRef.current = isActiveDockTab(modelid);

    // Editor view mode, hydrated from per-model localStorage. Metamodels are
    // always flow-only and never read a saved mode. The saved literal is validated
    // explicitly; raw storage is never trusted.
    const [editorMode, setEditorMode] = useState<EditorViewMode>(() => {
        if (isMetamodel) return 'flow';
        const saved = readEditorPrefs(modelid).editorMode;
        return saved === 'flow' || saved === 'classic' || saved === 'split' ? saved : 'flow';
    });

    // didMountRef: tells the reset effect apart on its initial run (hydrated mode
    // must win). expectedVpRef: the viewpoint our hydration effect is activating,
    // so the resulting viewpoint change is not mistaken for a user-initiated one.
    const didMountRef = useRef(false);
    const expectedVpRef = useRef<string | null>(null);

    // Persist + propagate user-initiated mode changes (the three toolbar buttons).
    const handleEditorModeChange = (mode: EditorViewMode) => {
        setEditorMode(mode);
        if (!isMetamodel) writeEditorPrefs(modelid, { editorMode: mode });
    };

    // Mount-only: restore the viewpoint this model had the last time it was open,
    // only when this tab is the dock's active one (savedViewpointToRestore, R-MT-16).
    // Reuses the existing activateViewpoint dual-write (deliberately non-TRANSACTION).
    // A missing or deleted viewpoint is a graceful no-op: the snapshot-restored,
    // project-global viewpoint is left untouched.
    // R-MT-18: a restored '' is abstract syntax, activated as null. The decision was taken once,
    // in the state initialiser above, so the tab state and the activation cannot disagree.
    useEffect(() => {
        if (restoreAtMount === null) return;
        expectedVpRef.current = restoreAtMount;
        activateViewpoint(restoreAtMount || null);
    }, []);

    // Q7: the tab that gains focus writes its viewpoint to the root and the project, which the
    // global readers (Tree View, rail, new-view parenting) and every reader not yet moved to the
    // tab (layout key, IR resolution: lanes L3, L5) follow. Only on the transition to focused:
    // rc-dock reports every layout change. The model tab id is the model id (TabDataMaker.model).
    useEffect(() => {
        if (isMetamodel) return;
        const onActiveTab = (e: Event) => {
            const wasFocused = focusedRef.current;
            focusedRef.current = (e as CustomEvent).detail?.activeId === modelid;
            if (!focusedRef.current || wasFocused) return;
            const tabVp = tabViewpointRef.current;
            if ((rootViewpointRef.current || null) !== tabVp) activateViewpoint(tabVp);
        };
        window.addEventListener(JjodelEvents.ACTIVE_TAB, onActiveTab);
        return () => window.removeEventListener(JjodelEvents.ACTIVE_TAB, onActiveTab);
    }, [modelid, isMetamodel]);

    // The focused tab adopts a root change it did not make (an undone activation, a reload), so
    // its picker never contradicts what the canvas renders from the root. A tab behind it keeps
    // its own viewpoint, and writes it back when it gains focus (above).
    const didMountAdoptRef = useRef(false);
    useEffect(() => {
        if (!didMountAdoptRef.current) { didMountAdoptRef.current = true; return; }
        if (isMetamodel || !focusedRef.current) return;
        setTabViewpointId(viewpointId || null);
    }, [viewpointId]);

    // Reset to `flow` whenever the active viewpoint changes, EXCEPT on the initial
    // mount (the hydrated mode must win) and when the change is the one our
    // hydration effect just triggered (keep the hydrated mode). A genuine
    // user-initiated viewpoint change still resets the mode to `flow`. The new
    // preference is NOT written here: every mounted EditorSwitch sees the root
    // change, so this wrote one tab's pick as every open model's preference. The
    // picker that changed it saves it for its own model (Toolbar.tsx, R-MT-16).
    useEffect(() => {
        if (!didMountRef.current) { didMountRef.current = true; return; }
        if (expectedVpRef.current !== null && (viewpointId || '') === expectedVpRef.current) {
            expectedVpRef.current = null;
            return;
        }
        setEditorMode('flow');
    }, [viewpointId]);

    if (!hasViewpoint) {
        return (
            <ActiveEditorProvider>
                <div className="editor-switch-container">
                    <div className="editor-switch-stage">
                        <EditorV2
                            modelid={modelid}
                            hasViewpoint={false}
                            viewpointId={shownViewpointId}
                            onViewpointChange={isMetamodel ? undefined : setTabViewpointId}
                        />
                    </div>
                </div>
            </ActiveEditorProvider>
        );
    }

    // Classic shutdown (Fase 5a, decisione B 2026-07-17): the classic/split
    // modes are no longer reachable — EditorV2 renders the flow editor for
    // every model; concrete syntax comes from the IR interpreter behind the
    // active viewpoint. classicSlot/editorMode wiring intentionally dropped;
    // the localStorage mode preference is ignored (flow is the only mode).
    // TODO: cleanup — remove the mode state machinery above and the
    // classic/split branches in EditorV2 once the removal layer lands.
    return (
        <ActiveEditorProvider>
            <div className="editor-switch-container">
                <div className="editor-switch-stage">
                    <EditorV2
                        modelid={modelid}
                        hasViewpoint
                        viewpointId={shownViewpointId}
                        onViewpointChange={isMetamodel ? undefined : setTabViewpointId}
                    />
                </div>
            </div>
        </ActiveEditorProvider>
    );
}

export default EditorSwitch;
