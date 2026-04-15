import React, { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { LViewElement } from '../../../joiner';
import { cssMonacoOptions, withReadOnly } from '../monacoConfig';
import EditorFullscreenOverlay from './EditorFullscreenOverlay';

interface StyleEditorProps {
    view: LViewElement;
    readOnly: boolean;
    onViewUpdate: () => void;
}

const StyleEditor: React.FC<StyleEditorProps> = ({ view, readOnly, onViewUpdate }) => {
    const [css, setCss] = useState(view.css || '');
    const [fullscreen, setFullscreen] = useState(false);

    // Sync when view changes externally
    useEffect(() => {
        if (!fullscreen) {
            setCss(view.css || '');
        }
    }, [view.css, fullscreen]);

    const handleChange = useCallback((value: string | undefined) => {
        if (value !== undefined) setCss(value);
    }, []);

    const handleBlur = useCallback(() => {
        view.css = css;
        onViewUpdate();
    }, [css, view, onViewUpdate]);

    const handleFullscreenClose = useCallback(() => {
        handleBlur();
        setFullscreen(false);
    }, [handleBlur]);

    return (
        <>
            {/* Header */}
            <div className="editor-section__header">
                <div className="editor-section__header-left">
                    <span className="editor-section__header-title">Style</span>
                </div>
                <div className="editor-section__header-actions">
                    <button
                        className="editor-section__header-link"
                        // TODO: P-future - open visual CSS variable picker
                        onClick={() => { /* noop */ }}
                        title="CSS Variables"
                    >
                        Variables
                    </button>
                    <span className="editor-section__header-badge editor-section__header-badge--css">CSS/LESS</span>
                    <button
                        className="editor-section__header-fullscreen"
                        onClick={() => setFullscreen(true)}
                        title="Open fullscreen"
                    >
                        <i className="bi bi-arrows-fullscreen" />
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div
                className="editor-section__body"
                tabIndex={-1}
                onBlur={handleBlur}
            >
                <Editor
                    className="monaco-editor-container"
                    value={css}
                    language="less"
                    theme="vs"
                    options={{
                        ...withReadOnly(cssMonacoOptions, readOnly),
                        automaticLayout: true,
                    }}
                    onChange={handleChange}
                />
            </div>

            {/* Fullscreen overlay */}
            <EditorFullscreenOverlay
                isOpen={fullscreen}
                onClose={handleFullscreenClose}
                title={`Style — ${view.name || 'View'}`}
                language="less"
                value={css}
                onChange={handleChange}
                readOnly={readOnly}
            />
        </>
    );
};

export default StyleEditor;
