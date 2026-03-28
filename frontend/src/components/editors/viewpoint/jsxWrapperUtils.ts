/**
 * Utility for wrapping JSX fragments in a virtual TypeScript component
 * so Monaco provides correct JSX validation and IntelliSense.
 *
 * The user edits only the JSX fragment; the wrapper prefix/suffix
 * are hidden via editor.setHiddenAreas().
 */

// Virtual wrapper that provides valid TypeScript/JSX context
const JSX_PREFIX_LINES = [
    'import React from "react";',
    'declare const data: any;',
    'declare const decorators: any;',
    'declare const node: { state: any };',
    'declare const view: { palette: Record<string, string[]> };',
    'declare function View(props: any): JSX.Element;',
    '',
    'function _JjodelView() {',
    '  return (',
];

const JSX_SUFFIX_LINES = [
    '  );',
    '}',
];

export const JSX_PREFIX = JSX_PREFIX_LINES.join('\n') + '\n';
export const JSX_SUFFIX = '\n' + JSX_SUFFIX_LINES.join('\n') + '\n';

/** Number of lines the prefix occupies in the Monaco model (hidden from user) */
export const PREFIX_LINE_COUNT = JSX_PREFIX.split('\n').length - 1;

/** Number of lines the suffix occupies in the Monaco model (hidden from user) */
export const SUFFIX_LINE_COUNT = JSX_SUFFIX.split('\n').length - 1;

/** Wrap a JSX fragment into a full virtual TS file */
export function wrapFragment(fragment: string): string {
    return JSX_PREFIX + fragment + JSX_SUFFIX;
}

/** Extract the JSX fragment from a wrapped TS file */
export function unwrapFragment(fullContent: string): string {
    const lines = fullContent.split('\n');
    // Remove prefix lines and suffix lines
    const fragmentLines = lines.slice(PREFIX_LINE_COUNT, lines.length - SUFFIX_LINE_COUNT);
    return fragmentLines.join('\n');
}
