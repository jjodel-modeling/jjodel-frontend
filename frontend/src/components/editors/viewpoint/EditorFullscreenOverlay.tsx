import React, { useEffect, useCallback, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { baseMonacoOptions, withReadOnly } from '../monacoConfig';

export interface EditorFullscreenOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    language: string;
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
}

const EditorFullscreenOverlay: React.FC<EditorFullscreenOverlayProps> = ({
    isOpen,
    onClose,
    title,
    language,
    value,
    onChange,
    readOnly = false,
}) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, onClose]);

    const handleMount: OnMount = useCallback((editor) => {
        editorRef.current = editor;
        setTimeout(() => { editor.layout(); editor.focus(); }, 50);
    }, []);

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
                    value={value}
                    language={language}
                    theme="vs"
                    options={options}
                    onChange={(v) => { if (v !== undefined) onChange(v); }}
                    onMount={handleMount}
                />
            </div>
        </div>
    );
};

export default EditorFullscreenOverlay;
