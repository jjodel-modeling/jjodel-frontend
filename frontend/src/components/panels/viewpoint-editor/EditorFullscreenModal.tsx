import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor as monacoEditor } from 'monaco-editor';
import { baseMonacoOptions, withReadOnly } from '../../editors/monacoConfig';
import { wrapFragment, unwrapFragment, PREFIX_LINE_COUNT, SUFFIX_LINE_COUNT } from '../../editors/viewpoint/jsxWrapperUtils';
import type { LanguageBadge } from './EditorToolbar';

type ToolbarSep = '|';
interface ToolbarButton {
    icon: string;
    iconActive?: string;
    title: string;
    action: (editor: monacoEditor.IStandaloneCodeEditor) => void;
    /** Return true when the button should show its "active/feedback" icon */
    isActive?: () => boolean;
}

export interface EditorFullscreenModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle: string;
    languageBadge: LanguageBadge;
    language: string;
    value: string;
    onChange: (value: string) => void;
    onRefresh?: () => void;
    readOnly?: boolean;
    /** When true, wraps the value in a virtual JSX component and hides the wrapper */
    jsxWrapping?: boolean;
}

/**
 * Apply hidden areas so the user only sees the JSX fragment.
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

const EditorFullscreenModal: React.FC<EditorFullscreenModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    languageBadge,
    language,
    value,
    onChange,
    onRefresh,
    readOnly = false,
    jsxWrapping = false,
}) => {
    const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
    const [minimap, setMinimap] = useState(false);
    const [wordWrap, setWordWrap] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState(false);

    // ESC to close (capture phase for Monaco compatibility)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, onClose]);

    // Sync external value changes into wrapped model
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

    // Toggle minimap
    useEffect(() => {
        editorRef.current?.updateOptions({ minimap: { enabled: minimap } });
    }, [minimap]);

    // Toggle word wrap
    useEffect(() => {
        editorRef.current?.updateOptions({ wordWrap: wordWrap ? 'on' : 'off' });
    }, [wordWrap]);

    const handleMount: OnMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        if (jsxWrapping) {
            const model = editor.getModel();
            if (model) {
                model.setValue(wrapFragment(value));
                applyHiddenAreas(editor, monaco);
                model.onDidChangeContent(() => applyHiddenAreas(editor, monaco));
            }
        }

        editor.onDidChangeCursorPosition((e) => {
            setCursorPosition({ line: e.position.lineNumber, col: e.position.column });
        });

        setTimeout(() => { editor.layout(); editor.focus(); }, 50);
    // value captured at mount time only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jsxWrapping]);

    const handleChange = useCallback((val: string | undefined) => {
        if (val === undefined) return;
        onChange(jsxWrapping ? unwrapFragment(val) : val);
    }, [jsxWrapping, onChange]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    }, [onClose]);

    const toolbarItems: (ToolbarButton | ToolbarSep)[] = [
        {
            icon: 'bi-arrow-counterclockwise',
            title: 'Undo',
            action: (ed) => ed.trigger('toolbar', 'undo', null),
        },
        {
            icon: 'bi-arrow-clockwise',
            title: 'Redo',
            action: (ed) => ed.trigger('toolbar', 'redo', null),
        },
        '|',
        {
            icon: 'bi-search',
            title: 'Find',
            action: (ed) => ed.trigger('toolbar', 'actions.find', null),
        },
        {
            icon: copyFeedback ? 'bi-check' : 'bi-clipboard',
            title: 'Copy All',
            action: (ed) => {
                const text = jsxWrapping ? unwrapFragment(ed.getValue()) : ed.getValue();
                navigator.clipboard.writeText(text).then(() => {
                    setCopyFeedback(true);
                    setTimeout(() => setCopyFeedback(false), 1500);
                });
            },
        },
        {
            icon: 'bi-code-slash',
            title: 'Format Document',
            action: (ed) => ed.trigger('toolbar', 'editor.action.formatDocument', null),
        },
    ];

    if (!isOpen) return null;

    const options: monacoEditor.IStandaloneEditorConstructionOptions = {
        ...withReadOnly(baseMonacoOptions, readOnly),
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: jsxWrapping ? ((n: number) => String(n - PREFIX_LINE_COUNT)) as any : 'on',
        lineNumbersMinChars: 4,
        lineDecorationsWidth: 8,
        folding: true,
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        minimap: { enabled: minimap },
        wordWrap: wordWrap ? 'on' : 'off',
    };

    const editorProps = jsxWrapping
        ? { defaultValue: wrapFragment(value) }
        : { value };

    return ReactDOM.createPortal(
        <div className="vep-fullscreen-overlay" onClick={handleBackdropClick}>
            <div className="vep-fullscreen-card">
                {/* Header */}
                <div className="vep-fullscreen-card__header">
                    <div className="vep-fullscreen-card__header-left">
                        <span
                            className="vep-editor-toolbar__badge"
                            style={{ background: languageBadge.bgColor, color: languageBadge.textColor }}
                        >
                            {languageBadge.label}
                        </span>
                        <span className="vep-fullscreen-card__title">{title}</span>
                        <span className="vep-fullscreen-card__subtitle">{subtitle}</span>
                    </div>
                    <div className="vep-fullscreen-card__header-right">
                        {toolbarItems.map((item, i) =>
                            item === '|' ? (
                                <span key={i} className="vep-fullscreen-card__header-sep" />
                            ) : (
                                <button
                                    key={i}
                                    className="vep-fullscreen-card__header-btn"
                                    title={item.title}
                                    onClick={() => editorRef.current && item.action(editorRef.current)}
                                >
                                    <i className={`bi ${item.icon}`} />
                                </button>
                            )
                        )}
                        {onRefresh && (
                            <>
                                <span className="vep-fullscreen-card__header-sep" />
                                <button
                                    className="vep-fullscreen-card__header-btn"
                                    onClick={onRefresh}
                                    title="Refresh"
                                >
                                    <i className="bi bi-arrow-clockwise" />
                                </button>
                            </>
                        )}
                        <span className="vep-fullscreen-card__header-sep" />
                        <button
                            className="vep-fullscreen-card__header-btn"
                            onClick={onClose}
                            title="Close (ESC)"
                        >
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                </div>

                {/* Body — Monaco editor */}
                <div className="vep-fullscreen-card__body">
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

                {/* Footer */}
                <div className="vep-fullscreen-card__footer">
                    <div className="vep-fullscreen-card__footer-left">
                        <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
                        <span className="vep-fullscreen-card__footer-sep">&middot;</span>
                        <span>UTF-8</span>
                        <span className="vep-fullscreen-card__footer-sep">&middot;</span>
                        <span>{languageBadge.label}</span>
                    </div>
                    <div className="vep-fullscreen-card__footer-right">
                        <button
                            className={`vep-fullscreen-card__footer-toggle ${minimap ? 'vep-fullscreen-card__footer-toggle--active' : ''}`}
                            onClick={() => setMinimap(v => !v)}
                        >
                            Minimap
                        </button>
                        <button
                            className={`vep-fullscreen-card__footer-toggle ${wordWrap ? 'vep-fullscreen-card__footer-toggle--active' : ''}`}
                            onClick={() => setWordWrap(v => !v)}
                        >
                            Word wrap
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default EditorFullscreenModal;
