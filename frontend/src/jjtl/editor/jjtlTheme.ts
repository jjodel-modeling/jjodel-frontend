/**
 * JjTL Theme for Monaco Editor
 * Based on Jjodel's slate/cyan color scheme
 */

import {monaco} from "../../joiner";

export const JJTL_THEME_ID = 'jjtl-theme';

export const jjtlTheme: monaco.editor.IStandaloneThemeData = {
    base: 'vs', // Light theme base
    inherit: true,
    rules: [
        // Comments
        { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },

        // Keywords
        { token: 'keyword', foreground: '0ea5e9', fontStyle: 'bold' },

        // Types (class names)
        { token: 'type.identifier', foreground: '8b5cf6' },

        // Identifiers
        { token: 'identifier', foreground: '334155' },

        // Constants (true, false)
        { token: 'constant.language', foreground: 'f59e0b' },

        // Built-in functions
        { token: 'support.function', foreground: '10b981' },

        // Numbers
        { token: 'number', foreground: 'f59e0b' },

        // Strings
        { token: 'string', foreground: '10b981' },

        // Operators
        { token: 'operator', foreground: '64748b' },
        { token: 'operator.arrow', foreground: '0ea5e9', fontStyle: 'bold' },

        // Delimiters
        { token: 'delimiter', foreground: '64748b' },

        // Brackets
        { token: '@brackets', foreground: '475569' },
    ],
    colors: {
        'editor.background': '#f8fafc',
        'editor.foreground': '#334155',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editorCursor.foreground': '#0ea5e9',
        'editor.selectionBackground': '#0ea5e933',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#0ea5e9',
    },
};

export function registerJjtlTheme(): void {
    monaco.editor.defineTheme(JJTL_THEME_ID, jjtlTheme);
}
