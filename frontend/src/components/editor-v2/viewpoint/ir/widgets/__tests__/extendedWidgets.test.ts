/**
 * The extended widgets (FL3), as the RENDERED half of the pair.
 *
 * Two things are asserted here that a pure test cannot reach:
 *
 *  1. ROUND-TRIP. The value a widget emits is the value its Row-view twin reads
 *     back. `jjform/widgetValue.ts` restates the read side's date and colour rules
 *     because `jjform/` may not import `components/`; this file is the gate that
 *     keeps the restatement from drifting, exactly as `widgetRenderer.test.ts` pins
 *     `withoutViewWidget` against `pruneForm`. One fixture per type.
 *
 *  2. READ-ONLY. «The widget renders the disabled variant, never an active input.»
 *     That is a statement about markup, so it is checked on markup.
 *
 * ── Why this renders React in a node environment ──────────────────────────────
 *
 * `vitest.config.ts` declares `environment: 'node'` and collects only `*.test.ts`;
 * there is no jsdom and no `@testing-library` in `package.json`, and adding one
 * would be a new dependency. `renderToStaticMarkup` needs neither: `react-dom` is
 * already a dependency, its server build runs in node, and JSX is avoided by calling
 * `createElement` directly so the file can stay a `.ts`.
 *
 * This is the first test in the suite to render a component, and it is only possible
 * because no widget in this registry imports `ui/` or `joiner/` — that barrel pulls
 * Monaco, which dereferences `window` at import time (the known "window is not
 * defined" class of failures). Keeping the six components import-free is what makes
 * them testable; it is a constraint on the widgets, not a trick in the test.
 */

import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
    detectValueRenderer,
    toCssColor,
    type SlotShape,
} from '../../../../nodes/valueRenderer';
import {
    durationValueIn,
    normalizeHex,
    normalizeIsoDate,
    normalizeIsoDateTime,
} from '../../../../../../jjform';
import { EXTENDED_WIDGETS, extendedWidget } from '../index';
import type { ExtendedWidgetProps } from '../widgetProps';

/** Render one registry entry by name, with the props a host would pass. */
function render(widget: string, props: Partial<ExtendedWidgetProps> = {}): string {
    const def = extendedWidget(widget);
    if (!def) throw new Error(`no widget registered under "${widget}"`);
    return renderToStaticMarkup(createElement(def.component, { widget, ...props } as ExtendedWidgetProps));
}

// ─────────────────────────────────────────────────────────────────────────────

describe('the registry', () => {
    it('covers the nine names FL1 hands out for the extended classes', () => {
        // Spelled as `jjform/layout.ts`'s FormWidget spells them, so FL4 has nothing
        // to translate. Compared as a set, not as a list, so key order is free.
        expect(Object.keys(EXTENDED_WIDGETS).sort()).toEqual(
            ['chips', 'color', 'date', 'datetime', 'duration', 'email', 'richtext', 'textarea', 'url'],
        );
    });

    it('states its own id in every entry', () => {
        for (const [key, def] of Object.entries(EXTENDED_WIDGETS)) {
            expect(def.id, key).toBe(key);
            expect(def.label, key).toBeTruthy();
        }
    });

    it('is an OPEN vocabulary: an unknown name resolves to null, it does not throw', () => {
        // `text`, `number` and `picker` are not missing — they are the widgets the
        // form already has, dispatched elsewhere. A name from neither table is the
        // same answer, and the host renders what it would have rendered before.
        expect(extendedWidget('text')).toBeNull();
        expect(extendedWidget('number')).toBeNull();
        expect(extendedWidget('no-such-widget')).toBeNull();
        expect(extendedWidget(undefined)).toBeNull();
        expect(extendedWidget('')).toBeNull();
    });
});

// ─── 1. Round-trip: what the widget emits is what the row reads ──────────────

describe('round-trip with the Row view', () => {
    it('date — the widget emits the ISO string absoluteDate reads back', () => {
        const emitted = normalizeIsoDate('2026-08-31');
        expect(emitted).toBe('2026-08-31');

        const decision = detectValueRenderer({ value: emitted!, typeName: 'EDate' } as SlotShape);
        expect(decision.kind).toBe('date');
        expect(decision.dateIso).toBe('2026-08-31');

        // And the field SHOWS that string, so the two surfaces cannot disagree.
        expect(render('date', { value: emitted! })).toContain('value="2026-08-31"');
    });

    it('datetime — the row keeps the day; the field keeps the minute', () => {
        const emitted = normalizeIsoDateTime('2026-08-31T14:30');
        expect(emitted).toBe('2026-08-31T14:30');

        const decision = detectValueRenderer({ value: emitted!, typeName: 'EDate' } as SlotShape);
        expect(decision.kind).toBe('date');
        expect(decision.dateIso).toBe('2026-08-31');

        expect(render('datetime', { value: emitted! })).toContain('value="2026-08-31T14:30"');
    });

    it('duration — the slot holds the NUMBER, the unit comes from the annotation', () => {
        // Typed as `2s` on a field declared in ms; stored as 2000; printed by the row
        // as 2000 + the declared `ms`. Writing "2s" into the value would make the row
        // print the unit twice.
        const emitted = durationValueIn('2s', 'ms');
        expect(emitted).toBe('2000');

        const decision = detectValueRenderer({ value: emitted!, typeName: 'EInt', unit: 'ms' } as SlotShape);
        expect(decision.kind).toBe('numberUnit');
        expect(decision.numValue).toBe(2000);
        expect(decision.unit).toBe('ms');

        const html = render('duration', { value: emitted!, unit: 'ms' });
        expect(html).toContain('value="2000"');
        expect(html).toContain('ir-unitfield__unit');
        expect(html).toContain('>ms<');
    });

    it('color — the canonical hex is one the row can paint', () => {
        const emitted = normalizeHex('#0AF');
        expect(emitted).toBe('#00aaff');

        const decision = detectValueRenderer({ value: emitted!, typeName: 'Color' } as SlotShape);
        expect(decision.kind).toBe('swatch');
        expect(decision.swatch).toBe('#00aaff');

        // The form paints with the ROW's own function, handed in as a prop.
        const html = render('color', { value: emitted!, toCss: toCssColor });
        expect(html).toContain('--ir-swatch:#00aaff');
        expect(html).toContain('value="#00aaff"');
    });

    it('color — a named colour survives the widget untouched', () => {
        // normalizeHex says nothing about `Green`; the widget must not blank it. This
        // is the case `ui/ColorPicker` gets wrong and the reason it is not reused.
        const decision = detectValueRenderer({ value: 'Green', typeName: 'Color' } as SlotShape);
        expect(decision.kind).toBe('swatch');
        expect(decision.swatch).toBe('Green');

        const html = render('color', { value: 'Green', toCss: toCssColor });
        expect(html).toContain('value="Green"');
        expect(html).toContain('--ir-swatch:Green');
        expect(html).not.toContain('ir-colorfield__swatch--unpaintable');
    });

    it('color — a value no rule can paint gets the hatched square, not a black one', () => {
        const html = render('color', { value: 'not-a-colour', toCss: toCssColor });
        expect(html).toContain('ir-colorfield__swatch--unpaintable');
        expect(html).toContain('value="not-a-colour"');
    });

    it('email — the value is the string, and the row renders it as text', () => {
        const decision = detectValueRenderer({ value: 'a@b.co', typeName: 'EString' } as SlotShape);
        expect(decision.kind).toBe('truncatedText');

        const html = render('email', { value: 'a@b.co' });
        expect(html).toContain('value="a@b.co"');
        expect(html).toContain('ir-checkedfield__check--valid');
    });

    it('email — an invalid address is still committed and still shown', () => {
        // Validation is diagnostic, never blocking: the field says so and keeps the value.
        const html = render('email', { value: 'nobody.example.com' });
        expect(html).toContain('value="nobody.example.com"');
        expect(html).toContain('ir-checkedfield__check--invalid');
    });

    it('url — the read half is truncatedText today, and the open link is offered', () => {
        // Declared gap: RendererKind has no `link` member, and adding one propagates
        // to five consumers. Ratified 2026-08-31 as a slice of its own —
        // docs/discovery/discovery_2026-08-31_fl3_widget_estesi.md F5.
        const decision = detectValueRenderer({ value: 'https://jjodel.io', typeName: 'EString' } as SlotShape);
        expect(decision.kind).toBe('truncatedText');

        const html = render('url', { value: 'https://jjodel.io' });
        expect(html).toContain('href="https://jjodel.io/"');
        expect(html).toContain('bi-box-arrow-up-right');
    });

    it('url — a scheme that executes gets no href at all', () => {
        const html = render('url', { value: 'javascript:alert(1)' });
        expect(html).not.toContain('href="javascript');
        expect(html).toContain('ir-checkedfield__open--disabled');
        // Still shown: hiding it would hide the thing that has to be fixed.
        expect(html).toContain('value="javascript:alert(1)"');
    });

    it('richtext — the prose box holds the value the row renders as text', () => {
        const decision = detectValueRenderer({ value: 'one\ntwo', typeName: 'EString' } as SlotShape);
        expect(decision.kind).toBe('truncatedText');

        const html = render('richtext', { value: 'one\ntwo' });
        expect(html).toContain('one\ntwo');
        expect(html).toContain('ir-growtext');
    });

    it('chips (tags) — the row reads the same values as a collection', () => {
        const values = ['alpha', 'beta'];
        const decision = detectValueRenderer({ value: values[0], values, isMany: true } as SlotShape);
        expect(decision.kind).toBe('collection');

        const html = render('chips', {
            chips: values.map((v, i) => ({ key: String(i), label: v })),
            onAppend: () => {},
            onRemove: () => {},
        });
        expect(html).toContain('ir-chipinput--tag');
        expect(html).toContain('alpha');
        expect(html).toContain('beta');
        expect(html).toContain('add…');
    });

    it('chips (multi-ref) — the row reads the same targets as reference pills', () => {
        const ids = ['Pointer_a', 'Pointer_b'];
        const decision = detectValueRenderer({
            value: ids[0], values: ids, isReference: true, isMany: true,
        } as SlotShape);
        expect(decision.kind).toBe('refPill');

        const html = render('chips', {
            chips: [{ key: ids[0], label: 'Running' }, { key: ids[1], label: 'Off' }],
            onRequestAdd: () => {},
            onRemove: () => {},
        });
        expect(html).toContain('ir-chipinput--ref');
        expect(html).toContain('ir-chipinput__pill');
        // The same glyph the read side puts on a reference pill.
        expect(html).toContain('bi-link-45deg');
        expect(html).toContain('add target');
    });

    it('chips (multi-ref) — a broken target loses the navigation affordance', () => {
        const html = render('chips', {
            chips: [{ key: 'Pointer_gone', label: 'Gone', broken: true }],
            onRequestAdd: () => {},
            onRemove: () => {},
        });
        expect(html).toContain('ir-chipinput__pill--broken');
        expect(html).not.toContain('bi-link-45deg');
    });
});

// ─── 2. Read-only: the disabled variant, never an active input ───────────────

describe('read-only', () => {
    /** Props that give each widget something to render, per registry name. */
    const FIXTURES: Readonly<Record<string, Partial<ExtendedWidgetProps>>> = {
        date: { value: '2026-08-31' },
        datetime: { value: '2026-08-31T14:30' },
        duration: { value: '250', unit: 'ms' },
        color: { value: '#00aaff' },
        email: { value: 'a@b.co' },
        url: { value: 'https://jjodel.io' },
        textarea: { value: 'prose' },
        richtext: { value: 'prose' },
        chips: { chips: [{ key: '0', label: 'alpha' }], onAppend: () => {}, onRemove: () => {} },
    };

    it('has a fixture for every registered widget', () => {
        // A silent gap here would let a widget skip the whole block below and look
        // like it passed.
        expect(Object.keys(FIXTURES).sort()).toEqual(Object.keys(EXTENDED_WIDGETS).sort());
    });

    for (const name of Object.keys(EXTENDED_WIDGETS)) {
        it(`${name} — carries the readonly modifier and no writable control`, () => {
            const html = render(name, { ...FIXTURES[name], readOnly: true });

            // The state is on the block class, so the stylesheet can reach it.
            expect(html).toMatch(/ir-[a-z]+--readonly/);

            // Every text-entry control is inert. `readonly` on the input, or the
            // input is not rendered at all (the chip input drops its Add field).
            const inputs = html.match(/<(input|textarea)\b[^>]*>/g) ?? [];
            for (const tag of inputs) {
                expect(tag, `${name}: ${tag}`).toMatch(/\breadonly\b|\bdisabled\b/);
            }
        });

        it(`${name} — the same widget IS writable when it is not read-only`, () => {
            // The positive control. Without it, a widget that renders nothing at all
            // would pass the assertion above for the wrong reason.
            const html = render(name, FIXTURES[name]);
            expect(html).not.toMatch(/ir-[a-z]+--readonly/);
        });
    }

    it('the chip input drops both the remove and the add affordance', () => {
        const html = render('chips', { ...FIXTURES.chips, readOnly: true });
        expect(html).not.toContain('ir-chipinput__remove');
        expect(html).not.toContain('ir-chipinput__add');
        // The values themselves stay readable: read-only is not hidden.
        expect(html).toContain('alpha');
    });

    it("the date field's picker button is disabled, so the hidden native one is not a loophole", () => {
        const html = render('date', { ...FIXTURES.date, readOnly: true });
        expect(html).toMatch(/<button[^>]*ir-datefield__icon[^>]*disabled|disabled[^>]*ir-datefield__icon/);
    });
});

// ─── The invalid state, which is orthogonal to read-only ─────────────────────

describe('the error state', () => {
    it('is carried by the block class and can coexist with read-only', () => {
        const both = render('date', { value: '2026-08-31', readOnly: true, invalid: true });
        expect(both).toContain('ir-datefield--readonly');
        expect(both).toContain('ir-datefield--invalid');
    });
});
