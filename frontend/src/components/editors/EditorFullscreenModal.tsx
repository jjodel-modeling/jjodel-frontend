/**
 * EditorFullscreenModal - Modal fullscreen per Monaco Editor
 * VERSIONE SEMPLIFICATA per debug
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import './EditorFullscreenModal.scss';

export interface EditorFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  value: string;
  onChange?: (value: string | undefined) => void;
  onSave?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
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
  const [wrap, setWrap] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [copyFeedback, setCopyFeedback] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.(value);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSave, value]);

  // Body class for hiding GraphContainer
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

    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Focus after mount
    setTimeout(() => {
      editor.layout();
      editor.focus();
    }, 50);
  }, []);

  // Toggle wrap
  const handleWrapToggle = useCallback(() => {
    setWrap((prev) => !prev);
  }, []);

  // Copy content
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

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

  // Stats
  const lineCount = value.split('\n').length;
  const charCount = value.length;

  // Simple Monaco options
  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    readOnly,
    wordWrap: wrap ? 'on' : 'off',
    lineNumbers: 'on',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    fontLigatures: false,
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    padding: { top: 12, bottom: 12 },
    renderLineHighlight: 'line',
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
            <button
              type="button"
              className={`editor-fullscreen-btn ${wrap ? 'active' : ''}`}
              onClick={handleWrapToggle}
              title={wrap ? 'Disable Word Wrap' : 'Enable Word Wrap'}
            >
              <i className="bi bi-text-wrap" />
            </button>

            <button
              type="button"
              className={`editor-fullscreen-btn ${copyFeedback ? 'success' : ''}`}
              onClick={handleCopy}
              title="Copy content"
            >
              <i className={`bi ${copyFeedback ? 'bi-check-lg' : 'bi-clipboard'}`} />
            </button>

            {!readOnly && (
              <button
                type="button"
                className="editor-fullscreen-btn"
                onClick={handleFormat}
                title="Format document"
              >
                <i className="bi bi-code-slash" />
              </button>
            )}

            <div className="editor-fullscreen-divider" />

            <button
              type="button"
              className="editor-fullscreen-btn editor-fullscreen-btn--close"
              onClick={onClose}
              title="Close (ESC)"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {/* Editor - SIMPLIFIED */}
        <div className="editor-fullscreen-body">
          <Editor
            width="100%"
            height="100%"
            value={value}
            onChange={onChange}
            language={language}
            theme={theme}
            options={editorOptions}
            onMount={handleEditorMount}
          />
        </div>

        {/* Footer */}
        <div className="editor-fullscreen-footer">
          <div className="editor-fullscreen-footer__left">
            <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
            <span className="editor-fullscreen-footer__separator">│</span>
            <span>{lineCount} lines</span>
            <span className="editor-fullscreen-footer__separator">│</span>
            <span>{charCount} chars</span>
          </div>

          <div className="editor-fullscreen-footer__right">
            <span className="editor-fullscreen-footer__language">{language}</span>
            {!readOnly && onSave && (
              <button
                type="button"
                className="editor-fullscreen-save-btn"
                onClick={() => onSave(value)}
              >
                <i className="bi bi-check2" />
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorFullscreenModal;