import React, { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { LViewElement } from '../../../joiner';
import { typescriptMonacoOptions, withReadOnly } from '../monacoConfig';
import { Function } from '../../forEndUser/FunctionComponent';
import EditorFullscreenOverlay from './EditorFullscreenOverlay';

interface TemplateEditorProps {
    view: LViewElement;
    readOnly: boolean;
    onViewUpdate: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ view, readOnly, onViewUpdate }) => {
    const dview = view.__raw;
    const [jsx, setJsx] = useState(dview.jsxString || '');
    const [fullscreen, setFullscreen] = useState(false);

    // Sync when view changes externally
    useEffect(() => {
        if (!fullscreen) {
            setJsx(dview.jsxString || '');
        }
    }, [dview.jsxString, fullscreen]);

    const handleChange = useCallback((value: string | undefined) => {
        if (value !== undefined) setJsx(value);
    }, []);

    const handleBlur = useCallback(() => {
        view.jsxString = jsx;
        onViewUpdate();
    }, [jsx, view, onViewUpdate]);

    const handleFullscreenClose = useCallback(() => {
        handleBlur();
        setFullscreen(false);
    }, [handleBlur]);

    return (
        <>
            {/* Header */}
            <div className="editor-section__header">
                <div className="editor-section__header-left">
                    <span className="editor-section__header-title">Template</span>
                </div>
                <div className="editor-section__header-actions">
                    <span className="editor-section__header-badge editor-section__header-badge--jsx">JSX</span>
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
                    value={jsx}
                    language="typescript"
                    theme="vs"
                    options={{
                        ...withReadOnly(typescriptMonacoOptions, readOnly),
                        automaticLayout: true,
                    }}
                    onChange={handleChange}
                />
            </div>

            {/* Template extras: Constants, Featured props, Observed properties */}
            <div className="template-extras">
                <div className="template-extras__section">
                    <span className="template-extras__label">Constants</span>
                    <Function
                        data={view}
                        field={"constants"}
                        getter={(l) => (l as LViewElement).__raw.constants || ''}
                        readOnly={readOnly}
                    />
                </div>

                <div className="template-extras__section">
                    <span className="template-extras__label">Observed properties</span>
                    <Function
                        data={view}
                        field={"usageDeclarations"}
                        readOnly={readOnly}
                    />
                </div>
            </div>

            {/* Fullscreen overlay */}
            <EditorFullscreenOverlay
                isOpen={fullscreen}
                onClose={handleFullscreenClose}
                title={`Template — ${view.name || 'View'}`}
                language="typescript"
                value={jsx}
                onChange={handleChange}
                readOnly={readOnly}
            />
        </>
    );
};

export default TemplateEditor;
