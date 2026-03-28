import React, { useEffect, useCallback, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { baseMonacoOptions, withReadOnly } from '../monacoConfig';
import { wrapFragment, unwrapFragment, PREFIX_LINE_COUNT, SUFFIX_LINE_COUNT } from './jsxWrapperUtils';

export interface EditorFullscreenOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    language: string;
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    /** When true, wraps the value in a virtual JSX component and hides the wrapper */
    jsxWrapping?: boolean;
}

/**
 * Apply hidden areas so the user only sees the JSX fragment.
 */
function applyHiddenAreas(
    editorInstance: editor.IStandaloneCodeEditor,
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

const EditorFullscreenOverlay: React.FC<EditorFullscreenOverlayProps> = ({
    isOpen,
    onClose,
    title,
    language,
    value,
    onChange,
    readOnly = false,
    jsxWrapping = false,
}) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof import('monaco-editor') | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, onClose]);

    // Sync external value changes into the wrapped model
    useEffect(() => {
        if (!jsxWrapping || !isOpen) return;
        const ed = editorRef.current;
        const m = monacoRef.current;
        if (!ed || !m) return;
        const model = ed.getModel();
        if (!model) return;

        const wrapped = wrapFragment(value);
        if (model.getValue() !== wrapped) {
            model.setValue(wrapped);
            applyHiddenAreas(ed, m);
        }
    }, [value, jsxWrapping, isOpen]);

    const handleMount: OnMount = useCallback((editorInstance, monaco) => {
        editorRef.current = editorInstance;
        monacoRef.current = monaco;

        if (jsxWrapping) {
            const model = editorInstance.getModel();
            if (model) {
                model.setValue(wrapFragment(value));
                applyHiddenAreas(editorInstance, monaco);
                model.onDidChangeContent(() => {
                    applyHiddenAreas(editorInstance, monaco);
                });
            }
        }

        setTimeout(() => { editorInstance.layout(); editorInstance.focus(); }, 50);
    // value is captured at mount time only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jsxWrapping]);

    const handleChange = useCallback((val: string | undefined) => {
        if (val === undefined) return;
        if (jsxWrapping) {
            onChange(unwrapFragment(val));
        } else {
            onChange(val);
        }
    }, [jsxWrapping, onChange]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    }, [onClose]);

    if (!isOpen) return null;

    const options: editor.IStandaloneEditorConstructionOptions = {
        ...withReadOnly(baseMonacoOptions, readOnly),
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: 'on',
        folding: true,
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
    };

    // When jsxWrapping, we control the model content ourselves — use defaultValue
    const editorProps = jsxWrapping
        ? { defaultValue: wrapFragment(value) }
        : { value };

    return (
        <div className="workbench-fullscreen-overlay" onClick={handleBackdropClick}>
            <div className="workbench-fullscreen-overlay__header">
                <span className="workbench-fullscreen-overlay__header-title">{title}</span>
                <button
                    className="workbench-fullscreen-overlay__header-close"
                    onClick={onClose}
                    title="Close (ESC)"
                >
                    <i className="bi bi-x-lg" />
                </button>
            </div>
            <div className="workbench-fullscreen-overlay__body">
                <Editor
                    width="100%"
                    height="100%"
                    {...editorProps}
                    language={language}
                    theme="vs"
                    options={options}
                    onChange={handleChange}
                    onMount={handleMount}
                />
            </div>
        </div>
    );
};

export default EditorFullscreenOverlay;
