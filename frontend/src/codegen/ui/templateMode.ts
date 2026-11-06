/**
 * templateMode — the «Text | Expression» toggle of a template body (slice S5, P-2026-10-23-2030; R-GEN-27,
 * discovery 2026-10-23 §2.2).
 *
 * Expression to text only when the body is one string literal: `parseTemplate` gives a root `InterpolatedString`
 * or string `Literal` spanning the whole trimmed body. Its text parts are written with `${` as `\${`, its holes copied
 * verbatim from the source. Refused, with a one-line reason, when the body is anything else (`main + "x"`,
 * `if … then "…"`), when a comment sits outside the literal (the literal then does not span the body), or when a text
 * part ends in `\` right before a hole (text mode would read `\${` as an escape).
 *
 * Text to expression always, for a body whose holes are closed: text parts escaped for `\`, `"` and a `$` before
 * `{`, holes copied verbatim, the whole wrapped in quotes.
 *
 * Pure: JjEL's lexer and parser only.
 */

import { JjelTokenType, parseTemplate, tokenize } from '../../jjel';
import type { JjelToken } from '../../jjel';
import type { TemplateMode } from '../engine/templates';

export type ModeConversion =
    | { readonly ok: true; readonly body: string }
    | { readonly ok: false; readonly reason: string };

const isText = (t: JjelToken) => t.type === JjelTokenType.STRING_PART || t.type === JjelTokenType.STRING;

/** The body in text mode, or why it cannot be. */
export function expressionToText(body: string): ModeConversion {
    const refuse = (reason: string): ModeConversion => ({ ok: false, reason });
    const parsed = parseTemplate(body);
    const root = parsed.expression;
    if (parsed.errors.length > 0 || !root) return refuse('The body does not parse: fix it before switching to text.');
    const literal = root.type === 'InterpolatedString' || (root.type === 'Literal' && typeof root.value === 'string');
    const start = body.length - body.trimStart().length;
    const end = body.trimEnd().length;
    if (!literal || root.location?.start.offset !== start || root.location?.end.offset !== end) {
        return refuse('Only a body that is one string can switch to text.');
    }
    const { tokens } = tokenize(body, { interpolation: true });
    let out = '';
    for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        if (isText(tok)) {
            if (tok.value.endsWith('\\') && tokens[i + 1]?.type === JjelTokenType.DOLLAR_LBRACE) {
                return refuse('A backslash right before a hole would read as an escape in text: write it as ${"\\\\"}.');
            }
            out += tok.value.split('${').join('\\${');
            if (tok.type === JjelTokenType.STRING) break;
        } else if (tok.type === JjelTokenType.DOLLAR_LBRACE) {
            out += '${' + tok.value + '}';
        }
    }
    return { ok: true, body: out };
}

/** The body in expression mode: one string literal holding the text and its holes. */
export function textToExpression(body: string): ModeConversion {
    const { tokens, errors } = tokenize(body, { textBody: true });
    if (errors.length > 0) return { ok: false, reason: 'A hole is not closed: close it before switching to expression.' };
    let out = '"';
    for (const tok of tokens) {
        if (isText(tok)) out += tok.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$\{/g, '\\${');
        else if (tok.type === JjelTokenType.DOLLAR_LBRACE) out += '${' + tok.value + '}';
    }
    return { ok: true, body: out + '"' };
}

/** The body converted to `to` from `from`; the same body when the mode does not change. */
export function convertBody(body: string, from: TemplateMode, to: TemplateMode): ModeConversion {
    if (from === to) return { ok: true, body };
    return to === 'text' ? expressionToText(body) : textToExpression(body);
}
