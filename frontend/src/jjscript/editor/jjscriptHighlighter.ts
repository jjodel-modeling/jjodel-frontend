/**
 * The JjScript highlighter of the read-only script blocks (P-2026-10-25-1020): an `astGenerator`
 * and a stylesheet for `react-syntax-highlighter`, fed by the `jjscript` Monarch tokenizer through
 * `monaco.editor.tokenize` and painted with the JjTL theme rules the script editor uses.
 */

import { monaco } from '../../joiner';
import { jjtlTheme } from '../../jjtl/editor/jjtlTheme';
import { JJSCRIPT_LANGUAGE_ID, registerJjscriptLanguage } from './jjscriptMonaco';
import { jjscriptHast, jjscriptStylesheet, type HastNode } from './jjscriptHighlight';

/** Merge into the highlighter's `style` so the token classes resolve to the editor colours. */
export const JJSCRIPT_HIGHLIGHT_STYLE = jjscriptStylesheet(jjtlTheme.rules);

export const jjscriptAstGenerator = {
    highlight(code: string): HastNode[] {
        try {
            registerJjscriptLanguage(monaco);
            return jjscriptHast(code, monaco.editor.tokenize(code, JJSCRIPT_LANGUAGE_ID), jjtlTheme.rules);
        } catch {
            return [{ type: 'text', value: code }];
        }
    },
};
