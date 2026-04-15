import React, { useState, useCallback, useEffect, useRef } from 'react';
import Editor, { OnMount, useMonaco } from '@monaco-editor/react';
import type { editor as monacoEditor } from 'monaco-editor';
import { LViewElement } from '../../../joiner';
import { typescriptMonacoOptions, withReadOnly } from '../monacoConfig';
import { Function } from '../../forEndUser/FunctionComponent';
import EditorFullscreenOverlay from './EditorFullscreenOverlay';
import { wrapFragment, unwrapFragment, PREFIX_LINE_COUNT, SUFFIX_LINE_COUNT } from './jsxWrapperUtils';

interface TemplateEditorProps {
    view: LViewElement;
    readOnly: boolean;
    onViewUpdate: () => void;
}

/**
 * Apply hidden areas to a Monaco editor so the user only sees the JSX fragment.
 * Prefix lines (1..PREFIX_LINE_COUNT) and suffix lines are hidden.
 */
function applyHiddenAreas(
    editorInstance: monacoEditor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor'),
) {
    const model = editorInstance.getModel();
    if (!model) return;
    const totalLines = model.getLineCount();
    const suffixStart = totalLines - SUFFIX_LINE_COUNT;

    const hidden: import('monaco-editor').IRange[] = [];
    if (PREFIX_LINE_COUNT > 0) {
        hidden.push(new monaco.Range(1, 1, PREFIX_LINE_COUNT, 1));
    }
    if (suffixStart < totalLines) {
        hidden.push(new monaco.Range(suffixStart + 1, 1, totalLines, 1));
    }
    (editorInstance as any).setHiddenAreas(hidden);
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ view, readOnly, onViewUpdate }) => {
    const dview = view.__raw;
    const [jsx, setJsx] = useState(dview.jsxString || '');
    const [fullscreen, setFullscreen] = useState(false);
    const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof import('monaco-editor') | null>(null);

    const monaco = useMonaco();

    // Configure TypeScript compiler for JSX once Monaco is ready
    useEffect(() => {
        if (!monaco) return;
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
        });
    }, [monaco]);

    // Sync when view changes externally
    useEffect(() => {
        if (!fullscreen) {
            setJsx(dview.jsxString || '');
        }
    }, [dview.jsxString, fullscreen]);

    // When jsx state changes, update the editor model (wrapped) and re-hide areas
    useEffect(() => {
        const ed = editorRef.current;
        const m = monacoRef.current;
        if (!ed || !m) return;
        const model = ed.getModel();
        if (!model) return;

        const wrapped = wrapFragment(jsx);
        const currentValue = model.getValue();
        if (wrapped !== currentValue) {
            model.setValue(wrapped);
            applyHiddenAreas(ed, m);
        }
    }, [jsx]);

    const handleChange = useCallback((value: string | undefined) => {
        if (value === undefined) return;
        // Extract the fragment from the full wrapped content
        const fragment = unwrapFragment(value);
        setJsx(fragment);
    }, []);

    const handleEditorMount: OnMount = useCallback((editor, mon) => {
        editorRef.current = editor;
        monacoRef.current = mon;

        // Set initial wrapped content and hide prefix/suffix
        const model = editor.getModel();
        if (model) {
            const wrapped = wrapFragment(jsx);
            model.setValue(wrapped);
            applyHiddenAreas(editor, mon);

            // Re-apply hidden areas whenever content changes (e.g. undo/redo)
            model.onDidChangeContent(() => {
                applyHiddenAreas(editor, mon);
            });
        }
    // jsx is intentionally captured at mount time only
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

            {/* Editor — value prop is intentionally empty; content is set via model in onMount */}
            <div
                className="editor-section__body"
                tabIndex={-1}
                onBlur={handleBlur}
            >
                <Editor
                    className="monaco-editor-container"
                    defaultValue={wrapFragment(jsx)}
                    language="typescript"
                    theme="vs"
                    options={{
                        ...withReadOnly(typescriptMonacoOptions, readOnly),
                        automaticLayout: true,
                        lineNumbers: (lineNumber: number) => {
                        const adjusted = lineNumber - PREFIX_LINE_COUNT;
                        return adjusted > 0 ? String(adjusted) : '';
                    },
                    }}
                    onChange={handleChange}
                    onMount={handleEditorMount}
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
                onChange={setJsx}
                readOnly={readOnly}
                jsxWrapping
            />
        </>
    );
};

export default TemplateEditor;
