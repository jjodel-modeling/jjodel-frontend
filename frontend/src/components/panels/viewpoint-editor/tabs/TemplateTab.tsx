import React, { useState, useCallback, useEffect, useRef } from 'react';
import Editor, { OnMount, useMonaco } from '@monaco-editor/react';
import type { editor as monacoEditor } from 'monaco-editor';
import { LViewElement } from '../../../../joiner';
import { typescriptMonacoOptions, withReadOnly } from '../../../editors/monacoConfig';
import { wrapFragment, unwrapFragment, PREFIX_LINE_COUNT, SUFFIX_LINE_COUNT } from '../../../editors/viewpoint/jsxWrapperUtils';
import EditorToolbar, { LANGUAGE_BADGES } from '../EditorToolbar';
import EditorFullscreenModal from '../EditorFullscreenModal';

interface TemplateTabProps {
    view: LViewElement;
    onViewUpdate: () => void;
}

/**
 * Apply hidden areas to a Monaco editor so the user only sees the JSX fragment.
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

const TemplateTab: React.FC<TemplateTabProps> = ({ view, onViewUpdate }) => {
    const dview = view.__raw;
    const [jsx, setJsx] = useState(dview.jsxString || '');
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
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
        if (!isFullscreenOpen) {
            setJsx(dview.jsxString || '');
        }
    }, [dview.jsxString, isFullscreenOpen]);

    // When jsx state changes, update the editor model (wrapped) and re-hide areas
    useEffect(() => {
        const ed = editorRef.current;
        const m = monacoRef.current;
        if (!ed || !m) return;
        const model = ed.getModel();
        if (!model) return;

        const wrapped = wrapFragment(jsx);
        if (wrapped !== model.getValue()) {
            model.setValue(wrapped);
            applyHiddenAreas(ed, m);
        }
    }, [jsx]);

    const handleChange = useCallback((value: string | undefined) => {
        if (value === undefined) return;
        setJsx(unwrapFragment(value));
    }, []);

    const handleEditorMount: OnMount = useCallback((editor, mon) => {
        editorRef.current = editor;
        monacoRef.current = mon;

        const model = editor.getModel();
        if (model) {
            model.setValue(wrapFragment(jsx));
            applyHiddenAreas(editor, mon);
            model.onDidChangeContent(() => applyHiddenAreas(editor, mon));
        }
    // jsx captured at mount time only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBlur = useCallback(() => {
        view.jsxString = jsx;
        onViewUpdate();
    }, [jsx, view, onViewUpdate]);

    const handleFullscreenClose = useCallback(() => {
        handleBlur();
        setIsFullscreenOpen(false);
    }, [handleBlur]);

    return (
        <div className="vep-template-tab">
            <EditorToolbar
                languageBadge={LANGUAGE_BADGES.jsx}
                editorLabel="template"
                onFullscreen={() => setIsFullscreenOpen(true)}
            />

            <div
                className="vep-template-tab__body"
                tabIndex={-1}
                onBlur={handleBlur}
            >
                <Editor
                    className="monaco-editor-container"
                    defaultValue={wrapFragment(jsx)}
                    language="typescript"
                    theme="vs"
                    options={{
                        ...withReadOnly(typescriptMonacoOptions, false),
                        automaticLayout: true,
                        lineNumbers: (lineNumber) => String(lineNumber),
                    }}
                    onChange={handleChange}
                    onMount={handleEditorMount}
                />
            </div>

            <EditorFullscreenModal
                isOpen={isFullscreenOpen}
                onClose={handleFullscreenClose}
                title={`Template — ${view.name || 'View'}`}
                subtitle="JSX template for this view element"
                languageBadge={LANGUAGE_BADGES.jsx}
                language="typescript"
                value={jsx}
                onChange={setJsx}
                jsxWrapping
            />
        </div>
    );
};

export default TemplateTab;
