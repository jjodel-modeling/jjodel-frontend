import React, { useState, useCallback, ReactNode } from 'react';
import { EditorV2 } from '../../editor-v2/EditorV2';
import './EditorSwitch.scss';

const STORAGE_KEY = 'jjodel-editor-preference';

export type EditorMode = 'classic' | 'v2';

function getEditorPreference(): EditorMode {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'v2' ? 'v2' : 'classic';
}

function setEditorPreference(mode: EditorMode) {
    localStorage.setItem(STORAGE_KEY, mode);
}

interface EditorSwitchProps {
    /** Model ID passed to both editors. */
    modelid: string;
    /** The classic editor content (rendered as children). */
    children: ReactNode;
}

/**
 * Wrapper that allows switching between the classic editor and Editor v2 (React Flow).
 * Persists the user's choice in localStorage.
 */
export function EditorSwitch({ modelid, children }: EditorSwitchProps) {
    const [mode, setMode] = useState<EditorMode>(getEditorPreference);

    const switchToV2 = useCallback(() => {
        setMode('v2');
        setEditorPreference('v2');
    }, []);

    const switchToClassic = useCallback(() => {
        setMode('classic');
        setEditorPreference('classic');
    }, []);

    return (
        <div className="editor-switch-container">
            {/* Floating segmented toggle */}
            <div className="editor-switch-toggle">
                <button
                    className={`editor-switch-toggle__btn ${mode === 'classic' ? 'active' : ''}`}
                    onClick={switchToClassic}
                    title="Classic Editor"
                >
                    <i className="bi bi-layers" />
                    <span>Classic</span>
                </button>
                <button
                    className={`editor-switch-toggle__btn ${mode === 'v2' ? 'active' : ''}`}
                    onClick={switchToV2}
                    title="Editor v2 (React Flow)"
                >
                    <i className="bi bi-bezier2" />
                    <span>Flow</span>
                </button>
            </div>

            {/* Render the active editor */}
            {mode === 'classic' ? (
                children
            ) : (
                <div className="editor-switch-v2-wrapper">
                    <EditorV2 modelid={modelid} onSwitchEditor={switchToClassic} />
                </div>
            )}
        </div>
    );
}

export default EditorSwitch;
