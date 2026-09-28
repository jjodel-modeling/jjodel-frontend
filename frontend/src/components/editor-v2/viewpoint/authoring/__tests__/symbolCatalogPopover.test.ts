/**
 * SymbolCatalogPicker, popover variant (D7, slice 4b) — the snapshot the spec asks for.
 *
 * Rendered, not inspected as source. `vitest.config.ts` declares `environment: 'node'`
 * and there is no jsdom and no `@testing-library` in `package.json`; `renderToStaticMarkup`
 * needs neither, `react-dom` is already a dependency, and JSX is avoided by calling
 * `createElement` so the file stays a `.ts`. Same precedent, and same constraint, as
 * `ir/widgets/__tests__/extendedWidgets.test.ts`: this works only because the picker's
 * imports stop at `ui/`, which does not pull Monaco. (`VertexAuthoringPanel` does, through
 * the `joiner` barrel, and cannot be rendered here at all — measured 2026-09-16.)
 *
 * What is actually asserted is the claim the spec makes about this variant: that it
 * REUSES the column path unchanged and only adds a footer. So the two renderings are
 * compared to each other, rather than the popover being described twice.
 */

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SymbolCatalogPicker, type SymbolCatalogPickerProps } from '../SymbolCatalogPicker';
import { CATALOG_FAMILIES, NOTATION_CATALOG, catalogFamilySections } from '../../ir/notationCatalog';

const KEEP_RULES_LABEL = 'Keep my Fill / Border rules when switching';

const render = (props: Partial<SymbolCatalogPickerProps> = {}): string =>
    renderToStaticMarkup(createElement(SymbolCatalogPicker, {
        onApply: () => { /* the host applies; the picker only reports */ },
        ...props,
    } as SymbolCatalogPickerProps));

/** The label of every tile in the markup, in DOM order. */
const tiles = (html: string): string[] =>
    [...html.matchAll(/aria-label="Apply ([^"]+)"/g)].map((m) => m[1]);

const countOf = (html: string, needle: string): number => html.split(needle).length - 1;

const popoverHtml = render({ variant: 'popover' });
const columnHtml = render({ variant: 'column' });

describe('the popover is the column path', () => {
    it('renders the same tiles, in the same order, as the column variant', () => {
        // The whole of D7's «reusing the column path unchanged», executed: recents,
        // search-first layout and family sections need no second implementation.
        expect(tiles(popoverHtml)).toEqual(tiles(columnHtml));
        expect(tiles(popoverHtml).length).toBeGreaterThan(0);
    });

    it('renders one section head per family, with the full totals', () => {
        expect(countOf(popoverHtml, 'symbol-catalog__section-head')).toBe(CATALOG_FAMILIES.length);
        for (const s of catalogFamilySections('', '')) {
            expect(popoverHtml).toContain(`>${s.total}</span>`);
        }
    });

    it('opens on the first family and leaves the others collapsed (D24 default)', () => {
        const [base, ...rest] = catalogFamilySections('', '');
        for (const p of base.presets) {
            expect(popoverHtml).toContain(`aria-label="Apply ${p.label} (${p.notation})"`);
        }
        expect(tiles(popoverHtml)).toHaveLength(base.presets.length);
        // A collapsed section is a head with no tiles, not a missing section.
        for (const s of rest) expect(popoverHtml).toContain(`<span>${s.family}</span>`);
    });

    it('carries its own modifier class, so the host can size it as a popover', () => {
        expect(popoverHtml).toContain('symbol-catalog--popover');
        expect(columnHtml).not.toContain('symbol-catalog--popover');
    });
});

describe('the popover footer (D7)', () => {
    it('is the one thing the column variant does not have', () => {
        expect(popoverHtml).toContain(KEEP_RULES_LABEL);
        expect(popoverHtml).toContain('symbol-catalog__foot');
        expect(columnHtml).not.toContain(KEEP_RULES_LABEL);
        expect(columnHtml).not.toContain('symbol-catalog__foot');
    });

    it('states the size of the catalog', () => {
        expect(popoverHtml).toContain(`${NOTATION_CATALOG.length} presets`);
        expect(popoverHtml).toContain(`${CATALOG_FAMILIES.length} families`);
    });

    it('checks «keep my rules» by default, and reflects the host when it is off', () => {
        // Default ON is the decision, not a detail: it is what makes a preset switch
        // safe for an author who has written rules.
        expect(render({ variant: 'popover' })).toContain('aria-checked="true"');
        expect(render({ variant: 'popover', keepRules: true })).toContain('aria-checked="true"');
        expect(render({ variant: 'popover', keepRules: false })).toContain('aria-checked="false"');
    });

    it('omits «Manage presets…» rather than shipping it disabled', () => {
        expect(popoverHtml).not.toContain('Manage presets');
    });
});

describe('the recents strip travels with the variant (D18)', () => {
    it('is absent without ids and present with them', () => {
        expect(popoverHtml).not.toContain('symbol-catalog__recents');
        const withRecents = render({ variant: 'popover', recentIds: ['bpmn-timer-event'] });
        expect(withRecents).toContain('symbol-catalog__recents');
        // Unknown ids are dropped at render, never rendered as a hole.
        const unknown = render({ variant: 'popover', recentIds: ['not-a-preset'] });
        expect(unknown).not.toContain('symbol-catalog__recents');
    });
});
