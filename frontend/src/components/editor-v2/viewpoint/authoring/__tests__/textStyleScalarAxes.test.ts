/**
 * TextStyleEditor — the scalar axes `letterSpacing` and `textTransform` (S1c, P-2026-11-11-2037).
 *
 * Executed, not read: the node bench has no DOM, so the writes are exercised by calling
 * `TextStyleEditor` as a function (it holds no hook) and invoking the `onChange` of the control
 * found under the row label, with a fake change event; the reads go through `react-dom/server`.
 * Each write is checked for set, change, reset and «other axes untouched» (deep-equal of the
 * rest of the style, and the previous object left unmutated).
 *
 * Negative control (shown red, then restored; recorded in the log entry): the Case `onChange`
 * rebuilding the style from scratch (`onChange({ textTransform: ... })`) instead of patching it.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TextStyleEditor } from '../TextStyleEditor';
import type { TextStyle } from '../../ir/irTypes';

type AnyElement = React.ReactElement<Record<string, unknown>>;

function children(el: AnyElement): AnyElement[] {
    const c = el.props.children;
    const list = Array.isArray(c) ? c.flat(Infinity) : [c];
    return list.filter((x): x is AnyElement => React.isValidElement(x));
}

function find(el: AnyElement, pred: (e: AnyElement) => boolean): AnyElement | undefined {
    if (pred(el)) return el;
    for (const ch of children(el)) {
        const hit = find(ch, pred);
        if (hit) return hit;
    }
    return undefined;
}

/** Renders the editor one level deep and fires the change handler of the control in row `label`. */
function write(value: TextStyle | undefined, label: string, input: string): { calls: number; next: TextStyle | undefined } {
    const out = { calls: 0, next: undefined as TextStyle | undefined };
    const tree = (TextStyleEditor as (p: unknown) => AnyElement)({
        value,
        onChange: (n: TextStyle | undefined) => { out.calls++; out.next = n; },
        features: null,
        classNames: [],
    });
    const row = find(tree, (e) => e.props.className === 'jj-textstyle-row__main'
        && children(e).some((c) => c.type === 'span' && c.props.children === label));
    expect(row, `row ${label}`).toBeDefined();
    const control = find(row!, (e) => typeof e.props.onChange === 'function');
    expect(control, `control of ${label}`).toBeDefined();
    (control!.props.onChange as (e: unknown) => void)({ target: { value: input } });
    return out;
}

const RICH: TextStyle = {
    fontFamily: 'mono',
    fontSize: 14,
    fontWeight: { when: { op: 'literal', value: true }, then: 'bold' } as TextStyle['fontWeight'],
    color: '#123456',
    underline: false,
};

const html = (value: TextStyle | undefined) => renderToStaticMarkup(
    React.createElement(TextStyleEditor, { value, onChange: () => undefined, features: null, classNames: [] }),
);

/** The markup of the control that follows the row label. */
function controlAfter(markup: string, label: string, tag: 'select' | 'input'): string {
    const i = markup.indexOf(`>${label}<`);
    expect(i).toBeGreaterThan(-1);
    const start = markup.indexOf(`<${tag}`, i);
    const end = tag === 'select' ? markup.indexOf('</select>', start) + '</select>'.length : markup.indexOf('>', start) + 1;
    return markup.slice(start, end);
}

describe('TextStyleEditor: the Spacing row (letterSpacing)', () => {
    it('is shown after Color, with an em suffix', () => {
        const m = html(undefined);
        expect(m.indexOf('>Spacing<')).toBeGreaterThan(m.indexOf('>Color<'));
        expect(m).toContain('>em<');
    });

    it('reads an absent axis as empty and a written value as that number', () => {
        expect(controlAfter(html(undefined), 'Spacing', 'input')).toContain('value=""');
        expect(controlAfter(html({ letterSpacing: 0.05 }), 'Spacing', 'input')).toContain('value="0.05"');
        expect(controlAfter(html({ letterSpacing: 0 }), 'Spacing', 'input')).toContain('value="0"');
    });

    it('sets the key from absent', () => {
        expect(write(undefined, 'Spacing', '0.1').next).toEqual({ letterSpacing: 0.1 });
    });

    it('changes the key and leaves every other axis untouched', () => {
        const prev: TextStyle = { ...RICH, letterSpacing: 0.1 };
        const snapshot = structuredClone(prev);
        const { next } = write(prev, 'Spacing', '-0.02');
        expect(next?.letterSpacing).toBe(-0.02);
        const { letterSpacing: _a, ...rest } = next!;
        const { letterSpacing: _b, ...restPrev } = snapshot;
        expect(rest).toEqual(restPrev);
        expect(prev).toEqual(snapshot);
    });

    it('keeps 0: an authored value, not an unset axis', () => {
        expect(write(RICH, 'Spacing', '0').next).toEqual({ ...RICH, letterSpacing: 0 });
    });

    it('reset removes the key, keeps the rest, and collapses a style left empty', () => {
        const { next } = write({ ...RICH, letterSpacing: 0.1 }, 'Spacing', '');
        expect(next).toEqual(RICH);
        expect(next && 'letterSpacing' in next).toBe(false);
        expect(write({ letterSpacing: 0.1 }, 'Spacing', '').next).toBeUndefined();
    });

    it('ignores a non-finite entry instead of writing it', () => {
        expect(write(RICH, 'Spacing', 'abc').calls).toBe(0);
    });
});

describe('TextStyleEditor: the Case row (textTransform)', () => {
    it('is shown after Spacing and offers Default, Uppercase, Lowercase and None', () => {
        const m = html(undefined);
        expect(m.indexOf('>Case<')).toBeGreaterThan(m.indexOf('>Spacing<'));
        const sel = controlAfter(m, 'Case', 'select');
        for (const l of ['Default', 'Uppercase', 'Lowercase', 'None']) expect(sel).toContain(`>${l}<`);
    });

    it('reads an absent axis as Default and a written `none` as None', () => {
        expect(controlAfter(html(undefined), 'Case', 'select')).toMatch(/<option value="" selected/);
        const none = controlAfter(html({ textTransform: 'none' }), 'Case', 'select');
        expect(none).toMatch(/<option value="none" selected/);
        expect(none).not.toMatch(/<option value="" selected/);
    });

    it('sets the key from absent', () => {
        expect(write(undefined, 'Case', 'uppercase').next).toEqual({ textTransform: 'uppercase' });
    });

    it('changes the key and leaves every other axis untouched', () => {
        const prev: TextStyle = { ...RICH, letterSpacing: 0.1, textTransform: 'uppercase' };
        const snapshot = structuredClone(prev);
        const { next } = write(prev, 'Case', 'lowercase');
        expect(next?.textTransform).toBe('lowercase');
        const { textTransform: _a, ...rest } = next!;
        const { textTransform: _b, ...restPrev } = snapshot;
        expect(rest).toEqual(restPrev);
        expect(prev).toEqual(snapshot);
    });

    it('writes `none` as a value, distinct from Default', () => {
        expect(write(RICH, 'Case', 'none').next).toEqual({ ...RICH, textTransform: 'none' });
    });

    it('reset (Default) removes the key, keeps the rest, and collapses a style left empty', () => {
        const { next } = write({ ...RICH, textTransform: 'lowercase' }, 'Case', '');
        expect(next).toEqual(RICH);
        expect(next && 'textTransform' in next).toBe(false);
        expect(write({ textTransform: 'lowercase' }, 'Case', '').next).toBeUndefined();
    });
});
