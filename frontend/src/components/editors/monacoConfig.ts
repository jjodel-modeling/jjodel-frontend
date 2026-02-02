/**
 * Monaco Editor - Configurazione Centralizzata
 * 
 * Questo file definisce le opzioni standard per tutti gli editor Monaco in Jjodel.
 * Importa queste configurazioni invece di definire opzioni inline in ogni componente.
 * 
 * @example
 * import { baseMonacoOptions, compactMonacoOptions } from './monacoConfig';
 * <Editor options={baseMonacoOptions} ... />
 */

import type { editor } from 'monaco-editor';

// =============================================================================
// CONFIGURAZIONE BASE
// =============================================================================

/**
 * Opzioni base per tutti gli editor Monaco.
 * Usa questa configurazione come default per la maggior parte degli editor.
 */
export const baseMonacoOptions: editor.IStandaloneEditorConstructionOptions = {
  // -------------------------
  // Font
  // -------------------------
  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
  fontSize: 13,
  fontLigatures: false, // Disable ligatures (=>, ===, !== appear as separate chars)
  fontWeight: '400',
  lineHeight: 20,

  // -------------------------
  // Line Numbers & Gutter
  // -------------------------
  lineNumbers: 'on',
  lineNumbersMinChars: 3,
  glyphMargin: false,
  folding: false,
  lineDecorationsWidth: 8,

  // -------------------------
  // Scrollbar
  // -------------------------
  scrollbar: {
    vertical: 'auto',
    horizontal: 'auto',
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
    useShadows: false,
  },
  scrollBeyondLastLine: false,

  // -------------------------
  // Minimap
  // -------------------------
  minimap: { enabled: false },

  // -------------------------
  // Layout & Behavior
  // -------------------------
  automaticLayout: true,
  wordWrap: 'off',

  // -------------------------
  // Cursor
  // -------------------------
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  cursorStyle: 'line',

  // -------------------------
  // Rendering
  // -------------------------
  renderLineHighlight: 'line',
  renderWhitespace: 'selection',
  
  // -------------------------
  // Padding
  // -------------------------
  padding: { top: 8, bottom: 8 },

  // -------------------------
  // Accessibility
  // -------------------------
  accessibilitySupport: 'auto',

  // -------------------------
  // Theme
  // -------------------------
  theme: 'vs',
};

// =============================================================================
// VARIANTI
// =============================================================================

/**
 * Configurazione compatta per editor piccoli o single-line.
 * Usa per: OCL Editor, espressioni semplici, Constants.
 */
export const compactMonacoOptions: editor.IStandaloneEditorConstructionOptions = {
  ...baseMonacoOptions,
  fontSize: 12,
  lineHeight: 18,
  lineNumbers: 'off',
  padding: { top: 4, bottom: 4 },
  folding: false,
  glyphMargin: false,
  lineDecorationsWidth: 4,
};

/**
 * Configurazione per editor di medie dimensioni.
 * Usa per: JS Editor, Observed Properties.
 */
export const mediumMonacoOptions: editor.IStandaloneEditorConstructionOptions = {
  ...baseMonacoOptions,
  fontSize: 12,
  lineHeight: 18,
};

/**
 * Configurazione per editor grandi con più funzionalità.
 * Usa per: JSX Editor, CSS Editor.
 */
export const largeMonacoOptions: editor.IStandaloneEditorConstructionOptions = {
  ...baseMonacoOptions,
  fontSize: 13,
  folding: true,
  lineNumbersMinChars: 4,
  renderLineHighlight: 'all',
};

/**
 * Configurazione per editor in sola lettura.
 * Usa per: preview, output, visualizzazione codice.
 */
export const readOnlyMonacoOptions: editor.IStandaloneEditorConstructionOptions = {
  ...baseMonacoOptions,
  readOnly: true,
  domReadOnly: true,
  cursorStyle: 'underline',
  renderLineHighlight: 'none',
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Merge delle opzioni base con opzioni custom.
 * Utile quando serve sovrascrivere solo alcune proprietà.
 * 
 * @example
 * const myOptions = mergeMonacoOptions(baseMonacoOptions, { readOnly: true, fontSize: 14 });
 */
export function mergeMonacoOptions(
  base: editor.IStandaloneEditorConstructionOptions,
  overrides: Partial<editor.IStandaloneEditorConstructionOptions>
): editor.IStandaloneEditorConstructionOptions {
  return {
    ...base,
    ...overrides,
    // Deep merge per scrollbar se presente
    scrollbar: {
      ...base.scrollbar,
      ...overrides.scrollbar,
    },
    // Deep merge per padding se presente
    padding: {
      ...base.padding,
      ...overrides.padding,
    },
    // Deep merge per minimap se presente
    minimap: {
      ...base.minimap,
      ...overrides.minimap,
    },
  };
}

/**
 * Crea opzioni con readOnly dinamico.
 * 
 * @example
 * <Editor options={withReadOnly(baseMonacoOptions, isDisabled)} />
 */
export function withReadOnly(
  options: editor.IStandaloneEditorConstructionOptions,
  readOnly: boolean
): editor.IStandaloneEditorConstructionOptions {
  return {
    ...options,
    readOnly,
    domReadOnly: readOnly,
  };
}

// =============================================================================
// LANGUAGE-SPECIFIC OPTIONS
// =============================================================================

/**
 * Opzioni specifiche per TypeScript/JSX.
 */
export const typescriptMonacoOptions: editor.IStandaloneEditorConstructionOptions = {
  ...largeMonacoOptions,
  // TypeScript-specific
  tabSize: 2,
  insertSpaces: true,
  formatOnPaste: true,
  formatOnType: false,
};

/**
 * Opzioni specifiche per CSS/LESS/SCSS.
 */
export const cssMonacoOptions: editor.IStandaloneEditorConstructionOptions = {
  ...largeMonacoOptions,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'on',
};

/**
 * Opzioni specifiche per JSON.
 */
export const jsonMonacoOptions: editor.IStandaloneEditorConstructionOptions = {
  ...mediumMonacoOptions,
  tabSize: 2,
  insertSpaces: true,
  formatOnPaste: true,
};

/**
 * Opzioni specifiche per Markdown.
 * Usa per: Documentation Editor, README, Notes.
 */
export const markdownMonacoOptions: editor.IStandaloneEditorConstructionOptions = {
  ...baseMonacoOptions,
  fontSize: 14,
  lineHeight: 22,
  wordWrap: 'on',
  lineNumbers: 'off',
  glyphMargin: false,
  folding: false,
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 0,
  renderLineHighlight: 'none',
  padding: { top: 16, bottom: 16 },
  scrollbar: {
    vertical: 'auto',
    horizontal: 'hidden',
    verticalScrollbarSize: 8,
    useShadows: false,
  },
};