/**
 * EditorFullscreenModal - Modal fullscreen per Monaco Editor
 * VERSIONE SEMPLIFICATA per debug
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import './EditorFullscreenModal.scss';

export type EditorViewMode = 'source' | 'split' | 'preview';

export interface EditorFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  value: string;
  onChange?: (value: string | undefined) => void;
  onSave?: (value: string) => void;
  language?: string;
  /**
   * Optional display label for the status bar language chip. Defaults to `language`
   * when not provided. Use this when the Monaco language id (e.g. 'typescript')
   * differs from the user-facing label (e.g. 'jsx').
   */
  languageLabel?: string;
  readOnly?: boolean;
  theme?: 'vs' | 'vs-dark';
  /** When provided, enables Source/Split/Preview toggle in toolbar */
  renderPreview?: (code: string) => React.ReactNode;
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
  languageLabel,
  readOnly = false,
  theme = 'vs',
  renderPreview,
}: EditorFullscreenModalProps): JSX.Element | null {
  const [wrap, setWrap] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [viewMode, setViewMode] = useState<EditorViewMode>('source');
  const [currValue, setCurrValue] = useState<string>(value);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const onChangeFix = (val?: string)=>{
    setCurrValue(val||'');
    if (onChange) onChange(val);
  }
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

  // Undo / Redo
  const handleUndo = useCallback(() => {
    editorRef.current?.trigger('toolbar', 'undo', null);
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.trigger('toolbar', 'redo', null);
  }, []);

  // Search (toggle Monaco find widget)
  const handleSearch = useCallback(() => {
    editorRef.current?.trigger('toolbar', 'actions.find', null);
  }, []);

  // Simple Monaco options
  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    readOnly,
    wordWrap: wrap ? 'on' : 'off',
    lineNumbers: 'on',
    lineNumbersMinChars: 4,
    lineDecorationsWidth: 8,
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    fontLigatures: false,
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    padding: { top: 12, bottom: 12 },
    renderLineHighlight: 'line',
    glyphMargin: false,
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
            {!readOnly && (
              <>
                <button
                  type="button"
                  className="editor-fullscreen-btn"
                  onClick={handleUndo}
                  title="Undo"
                >
                  <i className="bi bi-arrow-counterclockwise" />
                </button>

                <button
                  type="button"
                  className="editor-fullscreen-btn"
                  onClick={handleRedo}
                  title="Redo"
                >
                  <i className="bi bi-arrow-clockwise" />
                </button>

                <div className="editor-fullscreen-divider" />
              </>
            )}

            <button
              type="button"
              className="editor-fullscreen-btn"
              onClick={handleSearch}
              title="Search (Ctrl+F)"
            >
              <i className="bi bi-search" />
            </button>

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

            {renderPreview && (
              <>
                <div className="editor-fullscreen-divider" />
                <div className="editor-view-mode-toggle">
                  <button
                    type="button"
                    className={viewMode === 'source' ? 'active' : ''}
                    onClick={() => setViewMode('source')}
                    title="Source only"
                  >
                    <i className="bi bi-code-slash" />
                  </button>
                  <button
                    type="button"
                    className={viewMode === 'split' ? 'active' : ''}
                    onClick={() => setViewMode('split')}
                    title="Split view"
                  >
                    <i className="bi bi-layout-split" />
                  </button>
                  <button
                    type="button"
                    className={viewMode === 'preview' ? 'active' : ''}
                    onClick={() => setViewMode('preview')}
                    title="Preview only"
                  >
                    <i className="bi bi-eye" />
                  </button>
                </div>
              </>
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

        {/* Editor + Preview */}
        <div className={`editor-fullscreen-body ${viewMode !== 'source' && renderPreview ? 'editor-fullscreen-body--' + viewMode : ''}`}>
          {viewMode !== 'preview' && (
            <div
              className={viewMode === 'split' ? 'editor-fullscreen-editor-pane' : undefined}
              // Source mode: explicit 100% sizing so Monaco's height="100%" resolves
              // against a concrete parent (without this the wrapper is an auto-sized
              // block div and Monaco collapses to 0px). Split mode uses the pane
              // class's flex layout instead, so inline style is only applied
              // when unclassed.
              style={viewMode === 'source' ? { width: '100%', height: '100%' } : undefined}
            >
              <Editor
                width="100%"
                height="100%"
                value={value}
                onChange={onChangeFix}
                language={language}
                theme={theme}
                options={editorOptions}
                onMount={handleEditorMount}
              />
            </div>
          )}
          {viewMode !== 'source' && renderPreview && (
            renderPreview(value)
          )}
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
            <span className="editor-fullscreen-footer__language">{languageLabel ?? language}</span>
            {!readOnly && onSave && (
              <button
                type="button"
                className="editor-fullscreen-save-btn"
                onClick={() => onSave(currValue)}
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