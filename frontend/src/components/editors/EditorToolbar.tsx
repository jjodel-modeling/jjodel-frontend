/**
 * EditorToolbar - Toolbar riutilizzabile per Monaco Editor
 *
 * Fornisce controlli comuni: Wrap, Copy, Expand, Fullscreen
 */

import React, { useState, useCallback, ReactNode } from 'react';
import './EditorToolbar.scss';
import {GenericProps} from "../../joiner/types";

export interface EditorToolbarProps extends GenericProps {
  /** Titolo/label dell'editor (string o ReactNode per custom event name inputs) */
  title: ReactNode;
  /** Icona Bootstrap Icons (es: 'bi-code-slash') */
  icon?: string;
  /** Contenuto attuale dell'editor (per Copy) */
  content?: string;
  /** Callback quando cambia wrap */
  onWrapChange?: (wrap: boolean) => void;
  /** Callback quando cambia expand */
  onExpandChange?: (expanded: boolean) => void;
  /** Callback per aprire fullscreen modal */
  onFullscreenOpen?: () => void;
  /** Stato iniziale wrap (default: false) */
  initialWrap?: boolean;
  /** Stato iniziale expanded (default: false) */
  initialExpanded?: boolean;
  /** Disabilita il pulsante fullscreen (per editor piccoli) */
  disableFullscreen?: boolean;
  /** Mostra/nascondi l'editor (toggle collapse) */
  collapsed?: boolean;
  /** Callback per toggle collapse */
  onCollapseToggle?: () => void;
  /** Sola lettura - nasconde alcuni controlli */
  readOnly?: boolean;
}

export function EditorToolbar({
  title,
  icon,
  content = '',
  onWrapChange,
  onExpandChange,
  onFullscreenOpen,
  initialWrap = false,
  initialExpanded = false,
  disableFullscreen = false,
  collapsed = false,
  onCollapseToggle,
  readOnly = false,
  className = '',
  style={}
}: EditorToolbarProps): JSX.Element {
  const [wrap, setWrap] = useState(initialWrap);
  const [expanded, setExpanded] = useState(initialExpanded);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Toggle wrap
  const handleWrapToggle = useCallback(() => {
    const newWrap = !wrap;
    setWrap(newWrap);
    onWrapChange?.(newWrap);
  }, [wrap, onWrapChange]);

  // Toggle expand
  const handleExpandToggle = useCallback(() => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  }, [expanded, onExpandChange]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [content]);

  // Fullscreen
  const handleFullscreen = useCallback(() => {
    onFullscreenOpen?.();
  }, [onFullscreenOpen]);

  // Handle collapse toggle - don't trigger when clicking on input elements
  const handleLeftClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger collapse when clicking on input (for custom event name editing)
    if ((e.target as HTMLElement).tagName === 'INPUT') {
      return;
    }
    onCollapseToggle?.();
  }, [onCollapseToggle]);

  return (
    <div className={`editor-toolbar ${className}`} style={style}>
      {/* Left side: collapse toggle + title */}
      <div className="editor-toolbar__left" onClick={handleLeftClick}>
        {onCollapseToggle && (
          <button
            type="button"
            className="editor-toolbar__btn editor-toolbar__collapse"
            title={collapsed ? 'Espandi' : 'Comprimi'}
          >
            <i className={`bi bi-chevron-${collapsed ? 'right' : 'down'}`} />
          </button>
        )}

        {icon && <i className={`bi ${icon} editor-toolbar__icon`} />}

        <span className="editor-toolbar__title">{title}</span>
      </div>

      {/* Right side: action buttons */}
      {!collapsed && (
        <div className="editor-toolbar__actions">
          {/* Wrap toggle */}
          <button
            type="button"
            className={`editor-toolbar__btn ${wrap ? 'active' : ''}`}
            onClick={handleWrapToggle}
            title={wrap ? 'Disabilita Word Wrap' : 'Abilita Word Wrap'}
          >
            <i className="bi bi-text-wrap" />
          </button>

          {/* Copy */}
          <button
            type="button"
            className={`editor-toolbar__btn ${copyFeedback ? 'success' : ''}`}
            onClick={handleCopy}
            title="Copia contenuto"
            disabled={!content}
          >
            <i className={`bi ${copyFeedback ? 'bi-check-lg' : 'bi-clipboard'}`} />
          </button>

          {/* Expand/Collapse height */}
          <button
            type="button"
            className={`editor-toolbar__btn ${expanded ? 'active' : ''}`}
            onClick={handleExpandToggle}
            title={expanded ? 'Riduci altezza' : 'Espandi altezza'}
          >
            <i className={`bi ${expanded ? 'bi-arrows-collapse' : 'bi-arrows-expand'}`} />
          </button>

          {/* Fullscreen */}
          {!disableFullscreen && onFullscreenOpen && (
            <button
              type="button"
              className="editor-toolbar__btn"
              onClick={handleFullscreen}
              title="Apri in finestra grande"
            >
              <i className="bi bi-arrows-fullscreen" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EditorToolbar;
