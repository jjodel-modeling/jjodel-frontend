/**
 * Registers the JjScript language and its theme with Monaco (P-2026-10-24-2255).
 *
 * Meant for the `beforeMount` prop of `@monaco-editor/react`'s `Editor` and `DiffEditor`, which
 * hands over the monaco instance the editor is about to use. The theme is `vs` plus the JjTL
 * colours on the `.jjscript` tokens only, so the editors of other languages that share the global
 * Monaco theme keep their colours. Light theme only.
 */

import type * as Monaco from 'monaco-editor';
import { jjtlTheme } from '../../jjtl/editor/jjtlTheme';
import {
    JJSCRIPT_LANGUAGE_ID,
    jjscriptLanguageConfiguration,
    jjscriptLanguageDefinition,
    jjscriptThemeRules,
} from './jjscriptLanguage';

export { JJSCRIPT_LANGUAGE_ID } from './jjscriptLanguage';

export const JJSCRIPT_THEME_ID = 'jjscript-theme';

let registered = false;

export function registerJjscriptLanguage(monaco: typeof Monaco): void {
    if (registered) return;
    if (!monaco.languages.getLanguages().some(l => l.id === JJSCRIPT_LANGUAGE_ID)) {
        monaco.languages.register({ id: JJSCRIPT_LANGUAGE_ID });
    }
    monaco.languages.setMonarchTokensProvider(JJSCRIPT_LANGUAGE_ID, jjscriptLanguageDefinition);
    monaco.languages.setLanguageConfiguration(JJSCRIPT_LANGUAGE_ID, jjscriptLanguageConfiguration);
    monaco.editor.defineTheme(JJSCRIPT_THEME_ID, {
        base: 'vs',
        inherit: true,
        rules: jjscriptThemeRules(jjtlTheme.rules),
        colors: {},
    });
    registered = true;
}
