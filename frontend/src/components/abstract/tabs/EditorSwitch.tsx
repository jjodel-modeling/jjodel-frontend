import React, { useState, useCallback, ReactNode } from 'react';
import { EditorV2 } from '../../editor-v2/EditorV2';
import { EditorV3Shell } from '../../editor-v3';
import './EditorSwitch.scss';

const STORAGE_KEY = 'jjodel-editor-preference';

export type EditorMode = 'classic' | 'v2' | 'v3';

function getEditorPreference(): EditorMode {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'v3') return 'v3';
    if (saved === 'v2') return 'v2';
    return 'classic';
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
 * Wrapper that allows switching between the classic editor, Editor v2, and Editor v3.
 * Persists the user's choice in localStorage.
 */
export function EditorSwitch({ modelid, children }: EditorSwitchProps) {
    const [mode, setMode] = useState<EditorMode>(getEditorPreference);

    const switchToV2 = useCallback(() => {
        setMode('v2');
        setEditorPreference('v2');
    }, []);

    const switchToV3 = useCallback(() => {
        setMode('v3');
        setEditorPreference('v3');
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
                <button
                    className={`editor-switch-toggle__btn ${mode === 'v3' ? 'active' : ''}`}
                    onClick={switchToV3}
                    title="Editor v3 (Viewpoint-First)"
                >
                    <i className="bi bi-grid-3x3-gap" />
                    <span>V3</span>
                </button>
            </div>

            {/* Render the active editor */}
            {mode === 'classic' ? (
                children
            ) : mode === 'v2' ? (
                <div className="editor-switch-v2-wrapper">
                    <EditorV2 modelid={modelid} onSwitchEditor={switchToClassic} />
                </div>
            ) : (
                <div className="editor-switch-v2-wrapper">
                    <EditorV3Shell modelid={modelid} />
                </div>
            )}
        </div>
    );
}

export default EditorSwitch;
