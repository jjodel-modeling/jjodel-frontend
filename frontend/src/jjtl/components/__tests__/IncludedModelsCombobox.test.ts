import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * The «Also include» field of the run dialog (P-2026-11-08-1200). Vitest runs under
 * `environment: 'node'`: the choices are pure functions and the markup is rendered to a
 * string; pressing keys in the field, opening the list and measuring the pills are in the
 * dialog probe.
 */
import {
    IncludedModelsCombobox,
    availableOptions,
    comboboxKeyResult,
    visiblePillCount,
} from '../IncludedModelsCombobox';

const A = { id: 'a', name: 'Alpha' };
const B = { id: 'b', name: 'Beta' };
const C = { id: 'c', name: 'alphabet' };

describe('availableOptions', () => {
    it('leaves out what is already included', () => {
        expect(availableOptions([A, B, C], [B], '')).toEqual([A, C]);
    });

    it('filters by the typed text, whatever its case and outer spaces', () => {
        expect(availableOptions([A, B, C], [], ' ALPHA ')).toEqual([A, C]);
    });

    it('offers nothing when no name holds the text', () => {
        expect(availableOptions([A, B], [], 'zz')).toEqual([]);
    });
});

describe('visiblePillCount', () => {
    it('shows every pill when they fit exactly: no room is kept for a +N pill that is not there', () => {
        expect(visiblePillCount([100, 100], 204, 30, 4)).toBe(2);
    });

    it('keeps room for the +N pill as soon as one pill does not fit', () => {
        expect(visiblePillCount([100, 100], 203, 30, 4)).toBe(1);
        expect(visiblePillCount([100, 100, 100], 250, 30, 4)).toBe(2);
    });

    it('counts the gap between the pills', () => {
        expect(visiblePillCount([100, 100, 100], 237, 30, 4)).toBe(1);
    });

    it('shows no pill when not even the first fits beside the +N pill', () => {
        expect(visiblePillCount([200], 150, 30, 4)).toBe(0);
    });

    it('has nothing to show with no pill', () => {
        expect(visiblePillCount([], 100, 30, 4)).toBe(0);
    });
});

describe('comboboxKeyResult', () => {
    const state = { isOpen: true, query: '', optionCount: 3, activeIndex: 1, pillCount: 2 };

    it('Backspace in the empty field removes the last pill', () => {
        expect(comboboxKeyResult('Backspace', state)).toEqual({ action: 'removeLast' });
    });

    it('Backspace edits the text when there is some', () => {
        expect(comboboxKeyResult('Backspace', { ...state, query: 'a' })).toEqual({ action: 'ignore' });
    });

    it('Backspace with no pill does nothing', () => {
        expect(comboboxKeyResult('Backspace', { ...state, pillCount: 0 })).toEqual({ action: 'ignore' });
    });

    it('Escape closes the open list and leaves the closed one to the dialog', () => {
        expect(comboboxKeyResult('Escape', state)).toEqual({ action: 'close' });
        expect(comboboxKeyResult('Escape', { ...state, isOpen: false })).toEqual({ action: 'ignore' });
    });

    it('Enter adds the active option', () => {
        expect(comboboxKeyResult('Enter', state)).toEqual({ action: 'add' });
    });

    it('Enter never submits the form from the field: closed list, or no option', () => {
        expect(comboboxKeyResult('Enter', { ...state, isOpen: false })).toEqual({ action: 'swallow' });
        expect(comboboxKeyResult('Enter', { ...state, optionCount: 0 })).toEqual({ action: 'swallow' });
    });

    it('the arrows move within the list and stop at its ends', () => {
        expect(comboboxKeyResult('ArrowDown', state)).toEqual({ action: 'highlight', index: 2 });
        expect(comboboxKeyResult('ArrowDown', { ...state, activeIndex: 2 })).toEqual({ action: 'highlight', index: 2 });
        expect(comboboxKeyResult('ArrowUp', state)).toEqual({ action: 'highlight', index: 0 });
        expect(comboboxKeyResult('ArrowUp', { ...state, activeIndex: 0 })).toEqual({ action: 'highlight', index: 0 });
    });

    it('an arrow on the closed list opens it at the first option', () => {
        expect(comboboxKeyResult('ArrowDown', { ...state, isOpen: false })).toEqual({ action: 'highlight', index: 0 });
    });

    it('any other key is left to the input', () => {
        expect(comboboxKeyResult('a', state)).toEqual({ action: 'ignore' });
    });
});

describe('the markup of the field', () => {
    // Rendering to a string, React warns that useLayoutEffect, which measures the pills, does not run
    beforeAll(() => { vi.spyOn(console, 'error').mockImplementation(() => undefined); });
    afterAll(() => { vi.restoreAllMocks(); });

    const render = (props: Partial<React.ComponentProps<typeof IncludedModelsCombobox>>) => renderToStaticMarkup(
        React.createElement(IncludedModelsCombobox, {
            inputId: 'inc', candidates: [A, B], selected: [], metamodelName: 'Family',
            onAdd: () => undefined, onRemove: () => undefined, ...props,
        })
    );
    const count = (html: string, text: string) => html.split(text).length - 1;

    it('a pill has its name and one x button named Remove <model>; the ruler copy has no name', () => {
        const html = render({ selected: [A] });
        expect(count(html, 'aria-label="Remove Alpha"')).toBe(1);
        expect(count(html, 'class="included-models-pill-name">Alpha<')).toBe(2);
        expect(count(html, 'bi bi-x')).toBe(2);
    });

    it('with no candidate the field is disabled and says why, naming the metamodel', () => {
        const html = render({ candidates: [] });
        expect(html).toContain('placeholder="No other instance of Family"');
        expect(html).toMatch(/<input[^>]* disabled=""/);
        expect(html).toContain('included-models-field--disabled');
    });

    it('with candidates and no pill the field is enabled, with a prompt', () => {
        const html = render({});
        expect(html).toContain('placeholder="Select models to include..."');
        expect(html).not.toMatch(/<input[^>]* disabled=""/);
    });

    it('with pills there is no placeholder', () => {
        expect(render({ selected: [A] })).not.toContain('placeholder=');
    });

    it('while the run executes the field and the x are disabled, without claiming there is no candidate', () => {
        const html = render({ selected: [A], disabled: true });
        expect(html).toMatch(/<input[^>]* disabled=""/);
        expect(html).toMatch(/aria-label="Remove Alpha"[^>]* disabled=""/);
        expect(html).not.toContain('No other instance');
    });

    it('is a combobox, closed at first: no list in the page', () => {
        const html = render({});
        expect(html).toContain('role="combobox"');
        expect(html).toContain('aria-expanded="false"');
        expect(html).not.toContain('role="listbox"');
    });
});
