/**
 * EditorFullscreenModal - Modal fullscreen per Monaco Editor
 *
 * Fornisce un'esperienza di editing a schermo pieno con:
 * - Header con titolo e toolbar
 * - Editor Monaco a larghezza piena
 * - Footer con info (linea, colonna, linguaggio)
 * - Chiusura con X, ESC, o click fuori
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import './EditorFullscreenModal.scss';

export interface EditorFullscreenModalProps {
  /** Se il modal è aperto */
  isOpen: boolean;
  /** Callback per chiudere il modal */
  onClose: () => void;
  /** Titolo dell'editor */
  title: string;
  /** Icona Bootstrap Icons (es: 'bi-filetype-tsx') */
  icon?: string;
  /** Valore corrente dell'editor */
  value: string;
  /** Callback quando il valore cambia */
  onChange?: (value: string | undefined) => void;
  /** Callback al salvataggio (Ctrl+S) */
  onSave?: (value: string) => void;
  /** Linguaggio dell'editor (es: 'typescript', 'javascript', 'css') */
  language?: string;
  /** Editor in sola lettura */
  readOnly?: boolean;
  /** Tema Monaco ('vs' | 'vs-dark') */
  theme?: 'vs' | 'vs-dark';
}

export function EditorFullscreenModal({
  isOpen,
  onClose,
  title,
  icon,
  value,
  onChange,
  onSave,
  language = 'typescript',
  readOnly = false,
  theme = 'vs',
}: EditorFullscreenModalProps): JSX.Element | null {
  const [internalValue, setInternalValue] = useState(value);
  const [wrap, setWrap] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [copyFeedback, setCopyFeedback] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Sync internal value when prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Handle ESC key and Ctrl+S
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Ctrl+S / Cmd+S per salvare
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.(internalValue);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSave, internalValue]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-fullscreen-open');
    } else {
      document.body.classList.remove('modal-fullscreen-open');
    }
    return () => {
      document.body.classList.remove('modal-fullscreen-open');
    };
  }, [isOpen]);

  // Editor mount handler
  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;

    // Force line numbers to be visible
    editor.updateOptions({
      lineNumbers: 'on',
      lineNumbersMinChars: 3,
    });

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Focus and force layout after a short delay
    setTimeout(() => {
      editor.layout();
      editor.focus();
    }, 100);
  }, []);

  // Value change handler
  const handleChange = useCallback((newValue: string | undefined) => {
    setInternalValue(newValue || '');
    onChange?.(newValue);
  }, [onChange]);

  // Toggle wrap
  const handleWrapToggle = useCallback(() => {
    setWrap((prev) => !prev);
  }, []);

  // Copy content
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(internalValue);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [internalValue]);

  // Format document
  const handleFormat = useCallback(() => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  }, []);

  // Close on backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Calculate stats
  const lineCount = internalValue.split('\n').length;
  const charCount = internalValue.length;

  // Monaco options - defined inline for full control
  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    readOnly,
    wordWrap: wrap ? 'on' : 'off',

    // Line numbers
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    renderLineHighlight: 'line',

    // Font
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
    fontLigatures: false, // Disable ligatures (=>, ===, !== appear as separate chars)
    fontWeight: '400',

    // Layout
    glyphMargin: false,
    lineDecorationsWidth: 10,
    folding: true,
    foldingHighlight: true,

    // Padding
    padding: { top: 16, bottom: 16 },

    // Scrolling
    scrollBeyondLastLine: false,
    smoothScrolling: true,

    // Minimap
    minimap: { enabled: false },

    // Scrollbar
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      useShadows: false,
    },

    // Behavior
    automaticLayout: true,

    // Cursor
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    cursorStyle: 'line',

    // Brackets
    matchBrackets: 'always',
    bracketPairColorization: {
      enabled: true,
    },

    // Guides
    guides: {
      indentation: true,
      bracketPairs: true,
    },
  };

  if (!isOpen) return null;

  return (
    <div className="editor-fullscreen-overlay" onClick={handleBackdropClick}>
      <div className="editor-fullscreen-modal">
        {/* Header */}
        <div className="editor-fullscreen-header">
          <div className="editor-fullscreen-header__left">
            {icon && <i className={`bi ${icon}`} />}
            <h2>{title}</h2>
            {readOnly && <span className="editor-fullscreen-badge">Read-only</span>}
          </div>

          <div className="editor-fullscreen-header__actions">
            {/* Wrap toggle */}
            <button
              type="button"
              className={`editor-fullscreen-btn ${wrap ? 'active' : ''}`}
              onClick={handleWrapToggle}
              title={wrap ? 'Disabilita Word Wrap' : 'Abilita Word Wrap'}
            >
              <i className="bi bi-text-wrap" />
            </button>

            {/* Copy */}
            <button
              type="button"
              className={`editor-fullscreen-btn ${copyFeedback ? 'success' : ''}`}
              onClick={handleCopy}
              title="Copia contenuto"
            >
              <i className={`bi ${copyFeedback ? 'bi-check-lg' : 'bi-clipboard'}`} />
            </button>

            {/* Format */}
            {!readOnly && (
              <button
                type="button"
                className="editor-fullscreen-btn"
                onClick={handleFormat}
                title="Formatta documento"
              >
                <i className="bi bi-code-slash" />
              </button>
            )}

            {/* Divider */}
            <div className="editor-fullscreen-divider" />

            {/* Close */}
            <button
              type="button"
              className="editor-fullscreen-btn editor-fullscreen-btn--close"
              onClick={onClose}
              title="Chiudi (ESC)"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="editor-fullscreen-body">
          <Editor
            width="100%"
            height="100%"
            value={internalValue}
            onChange={handleChange}
            language={language}
            theme={theme}
            options={editorOptions}
            onMount={handleEditorMount}
            loading={
              <div className="editor-fullscreen-loading">
                <i className="bi bi-arrow-repeat spin" />
                <span>Caricamento editor...</span>
              </div>
            }
          />
        </div>

        {/* Footer */}
        <div className="editor-fullscreen-footer">
          <div className="editor-fullscreen-footer__left">
            <span>
              Ln {cursorPosition.line}, Col {cursorPosition.column}
            </span>
            <span className="editor-fullscreen-footer__separator">|</span>
            <span>{lineCount} righe</span>
            <span className="editor-fullscreen-footer__separator">|</span>
            <span>{charCount} caratteri</span>
          </div>

          <div className="editor-fullscreen-footer__right">
            <span className="editor-fullscreen-footer__language">{language}</span>
            {!readOnly && onSave && (
              <button
                type="button"
                className="editor-fullscreen-save-btn"
                onClick={() => onSave(internalValue)}
              >
                <i className="bi bi-check2" />
                Salva
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorFullscreenModal;
