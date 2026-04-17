import React, { useEffect, useState, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { EditorV2 } from '../../editor-v2/EditorV2';
import './EditorSwitch.scss';

export type EditorMode = 'classic' | 'v2';

type EditorViewMode = 'flow' | 'classic' | 'split';

interface EditorSwitchProps {
    /** Model ID passed to the editor. */
    modelid: string;
    /** Classic editor JSX, forwarded to EditorV2 as `classicSlot` when a viewpoint is active. */
    children: ReactNode;
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

    const [editorMode, setEditorMode] = useState<EditorViewMode>('flow');

    // Reset to the default mode whenever the active viewpoint changes (or is
    // cleared). This guarantees the toggle starts on `flow` every time the
    // user picks a different viewpoint.
    useEffect(() => {
        setEditorMode('flow');
    }, [viewpointId]);

    if (!hasViewpoint) {
        return (
            <div className="editor-switch-container">
                <div className="editor-switch-stage">
                    <EditorV2 modelid={modelid} hasViewpoint={false} />
                </div>
            </div>
        );
    }

    return (
        <div className="editor-switch-container">
            <div className="editor-switch-stage">
                <EditorV2
                    modelid={modelid}
                    classicSlot={children}
                    editorMode={editorMode}
                    hasViewpoint
                    onEditorModeChange={setEditorMode}
                />
            </div>
        </div>
    );
}

export default EditorSwitch;
