import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { EditorV2 } from '../../editor-v2/EditorV2';
import { ActiveEditorProvider } from '../../editor-v2/ActiveEditorContext';
import { store } from '../../../joiner';
import { activateViewpoint } from '../../../utils/lastViewpoint';
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
    const hasViewpoint = !!viewpointId && !isMetamodel;

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

    // Mount-only: restore the viewpoint this model had the last time it was open.
    // Validates against state.viewpoints (the plural array IS scrubbed by
    // VersionFixer, unlike the singular state.viewpoint) and reuses the existing
    // activateViewpoint dual-write (deliberately non-TRANSACTION). A missing or
    // deleted viewpoint is a graceful no-op: the snapshot-restored, project-global
    // viewpoint is left untouched.
    useEffect(() => {
        if (isMetamodel) return;
        const savedVpId = readEditorPrefs(modelid).viewpointId;
        if (!savedVpId) return;
        const known = (store.getState().viewpoints || []) as string[];
        if (!known.includes(savedVpId)) return;   // deleted / unknown viewpoint
        if (savedVpId === viewpointId) return;     // already the active (snapshot-restored) one
        expectedVpRef.current = savedVpId;
        activateViewpoint(savedVpId);
    }, []);

    // Reset to `flow` whenever the active viewpoint changes, EXCEPT on the initial
    // mount (the hydrated mode must win) and when the change is the one our
    // hydration effect just triggered (keep the hydrated mode). A genuine
    // user-initiated viewpoint change still resets the mode to `flow` and persists
    // that as this model's new preference.
    useEffect(() => {
        if (!didMountRef.current) { didMountRef.current = true; return; }
        if (expectedVpRef.current !== null && viewpointId === expectedVpRef.current) {
            expectedVpRef.current = null;
            return;
        }
        setEditorMode('flow');
        if (!isMetamodel) writeEditorPrefs(modelid, { viewpointId: viewpointId || '', editorMode: 'flow' });
    }, [viewpointId]);

    if (!hasViewpoint) {
        return (
            <ActiveEditorProvider>
                <div className="editor-switch-container">
                    <div className="editor-switch-stage">
                        <EditorV2 modelid={modelid} hasViewpoint={false} />
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
                    />
                </div>
            </div>
        </ActiveEditorProvider>
    );
}

export default EditorSwitch;
