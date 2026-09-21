/**
 * TextStyleEditor — the Underline axis (S6, D-S6-1).
 *
 * Executed, not read: `TextStyleEditor.tsx` loads in the node bench (React and the `ui`
 * barrel are pure at import), so `setAxis` is called and the editor is rendered to
 * markup through `react-dom/server`. The rendered-markup tests read the `selected`
 * attribute React emits for a controlled `<select>` and the presence of the row label.
 *
 * Mutation bench (each one shown red, then restored; recorded in the commit message and
 * the log entry): `setAxis` dropping a key on a falsy patch instead of on `undefined`;
 * `setAxis` no longer collapsing an empty style; the Underline `Select` reading an unset
 * axis as 'false'; `hideUnderline` ignored.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TextStyleEditor, setAxis } from '../TextStyleEditor';
import type { TextStyle } from '../../ir/irTypes';

describe('setAxis: the underline axis', () => {
    it('drops the key on `undefined` (Default) and collapses the style when nothing else is left', () => {
        expect(setAxis({ underline: true }, { underline: undefined })).toBeUndefined();
    });

    it('drops only the underline key and keeps the other axes', () => {
        expect(setAxis({ fontSize: 14, underline: true }, { underline: undefined })).toEqual({ fontSize: 14 });
    });

    it('keeps `false` (Off): an authored value, not an unset axis', () => {
        expect(setAxis(undefined, { underline: false })).toEqual({ underline: false });
        expect(setAxis({ fontSize: 14 }, { underline: false })).toEqual({ fontSize: 14, underline: false });
    });

    it('keeps a conditional underline verbatim', () => {
        const cond = { rules: [{ when: { op: 'literal', value: true }, then: true }], default: false } as TextStyle['underline'];
        expect(setAxis(undefined, { underline: cond })).toEqual({ underline: cond });
    });
});

const render = (value: TextStyle | undefined, hideUnderline?: boolean) => renderToStaticMarkup(
    React.createElement(TextStyleEditor, { value, onChange: () => undefined, features: null, classNames: [], hideUnderline }),
);

/** The `<select>` that follows the row label, isolated from the other rows. */
function underlineSelect(html: string): string {
    const i = html.indexOf('>Underline<');
    expect(i).toBeGreaterThan(-1);
    const start = html.indexOf('<select', i);
    return html.slice(start, html.indexOf('</select>', start) + '</select>'.length);
}

describe('TextStyleEditor: the Underline row', () => {
    it('is shown by default, between Style and Color', () => {
        const html = render(undefined);
        const iStyle = html.indexOf('>Style<');
        const iUnder = html.indexOf('>Underline<');
        const iColor = html.indexOf('>Color<');
        expect(iStyle).toBeGreaterThan(-1);
        expect(iUnder).toBeGreaterThan(iStyle);
        expect(iColor).toBeGreaterThan(iUnder);
    });

    it('is absent with hideUnderline', () => {
        expect(render(undefined, true)).not.toContain('>Underline<');
        expect(render(undefined, true)).toContain('>Color<');
    });

    it('offers Default, On and Off, and reads an unset axis as Default (the empty option)', () => {
        const sel = underlineSelect(render(undefined));
        expect(sel).toContain('>Default<');
        expect(sel).toContain('>On<');
        expect(sel).toContain('>Off<');
        expect(sel).toMatch(/<option value="" selected/);
        expect(sel).not.toMatch(/value="(true|false)" selected/);
    });

    it('reads a written `true` as On and a written `false` as Off', () => {
        expect(underlineSelect(render({ underline: true }))).toMatch(/<option value="true" selected/);
        const off = underlineSelect(render({ underline: false }));
        expect(off).toMatch(/<option value="false" selected/);
        expect(off).not.toMatch(/<option value="" selected/);
    });

    it('shows a conditional underline as Conditional, not as a fixed value', () => {
        const html = render({ underline: { when: { op: 'literal', value: true }, then: true } as TextStyle['underline'] });
        expect(html).toContain('Conditional');
    });
});
