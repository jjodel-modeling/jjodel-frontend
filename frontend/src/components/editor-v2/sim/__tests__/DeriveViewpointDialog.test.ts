/**
 * DeriveViewpointDialog — the «Derive viewpoint» dialog's form, rendered (slice D, P-2026-09-30-0255).
 *
 * The subject is `DeriveViewpointForm`, the dialog's content without its portal (the server renderer
 * has no portals), rendered with `renderToStaticMarkup` in node through `createElement`. The joiner
 * barrel and the creator are mocked: they pull Monaco at import («window is not defined»), and the form
 * reads neither. Esc, Enter and the focus order are the portal's, measured by the lane probe.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../../../joiner', () => ({
    store: { getState: () => ({ idlookup: {} }), subscribe: () => () => {}, dispatch: (a: unknown) => a },
    DProject: { getProject: () => null },
}));
vi.mock('../../../../utils/deriveViewpoint', () => ({ createDerivedViewpoint: () => null, projectViewpointIds: () => [] }));

import { DeriveViewpointForm } from '../DeriveViewpointDialog';
import type { DeriveViewpointFormProps } from '../DeriveViewpointDialog';

const CLASSES = [
    { id: 'S', name: 'State', abstract: false, supers: [] },
    { id: 'I', name: 'Initial', abstract: false, supers: ['S'] },
    { id: 'T', name: 'Transition', abstract: false, supers: [] },
    { id: 'E', name: 'Event', abstract: false, supers: [] },
];

const noop = () => {};
const render = (over: Partial<DeriveViewpointFormProps>) => renderToStaticMarkup(createElement(DeriveViewpointForm, {
    metamodelName: 'DemoPEST', classes: CLASSES, notation: 'stateMachine', roles: { S: 'node', I: 'initial', T: 'transition' },
    effective: new Map([['S', 'node'], ['I', 'initial'], ['T', 'transition']]), prefillFrom: 'binding',
    onNotation: noop, onRole: noop, onCancel: noop, onConfirm: noop, ...over,
}));

/** The `<select>` elements, with their id, their selected value and their options. */
function selects(html: string) {
    return [...html.matchAll(/<select([^>]*)>(.*?)<\/select>/g)].map(([, attrs, body]) => ({
        id: /id="([^"]*)"/.exec(attrs)?.[1] ?? null,
        options: [...body.matchAll(/<option([^>]*)>(.*?)<\/option>/g)].map(([, a, text]) => ({
            value: /value="([^"]*)"/.exec(a)?.[1] ?? null, text, selected: /selected=""/.test(a),
        })),
    }));
}
const labelsFor = (html: string) => [...html.matchAll(/<label[^>]*for="([^"]*)"[^>]*>(.*?)<\/label>/g)].map(([, f, t]) => [f, t.replace(/<[^>]+>/g, '')]);

describe('DeriveViewpointForm — the notation select and the table', () => {
    it('a dialog named by its title', () => {
        const html = render({});
        const title = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
        expect(html).toMatch(/role="dialog"/);
        expect(html).toMatch(/aria-modal="true"/);
        expect(title).toBeTruthy();
        expect(html).toMatch(new RegExp(`id="${title}"[^>]*>Derive viewpoint — DemoPEST<`));
    });

    it('the notation select lists the nine notations, the chosen one selected, with a real label', () => {
        const html = render({ notation: 'petri' });
        const [notation] = selects(html);
        // A1 and A3 (P-2026-09-30-0355, R-VP-22): Statechart (UML) and Flowchart (ISO 5807) beside their siblings.
        // A4 (P-2026-09-30-0440, R-VP-23): ER (Chen) last.
        // A2 (P-2026-09-30-1521, R-VP-24): Petri net (classic) after Petri net.
        // P-2026-09-30-1552 (R-VP-26): Activity (UML) after Flowchart (ISO 5807).
        expect(notation.options.map(o => [o.value, o.text])).toEqual([
            ['generic', 'Generic'], ['stateMachine', 'State machine'], ['statechart', 'Statechart (UML)'],
            ['petri', 'Petri net'], ['petriClassic', 'Petri net (classic)'], ['flowchart', 'Flowchart'], ['flowchartIso', 'Flowchart (ISO 5807)'],
            ['activityUml', 'Activity (UML)'], ['erChen', 'ER (Chen)'],
        ]);
        expect(notation.options.filter(o => o.selected).map(o => o.value)).toEqual(['petri']);
        expect(labelsFor(html)).toContainEqual([notation.id, 'Notation']);
    });

    it('Activity (UML) offers the flowchart roles, Node read as Action, and Decision / merge last (R-VP-26)', () => {
        const html = render({ notation: 'activityUml', roles: { S: 'node', I: 'decision', T: 'transition' } });
        const [, ...rows] = selects(html);
        expect(rows[0].options.map(o => [o.value, o.text])).toEqual([
            ['', '—'], ['node', 'Action'], ['initial', 'Initial'], ['terminal', 'Terminal'], ['activityFinal', 'Activity final'],
            ['transition', 'Transition'], ['fork', 'Fork'], ['join', 'Join'], ['decision', 'Decision / merge'],
        ]);
        expect(rows.map(r => r.options.find(o => o.selected)?.value)).toEqual(['node', 'decision', 'transition', '']);
    });

    it('Generic hides the table: one select, no row, no role', () => {
        const html = render({ notation: 'generic', roles: {}, effective: new Map(), prefillFrom: 'none' });
        expect(selects(html)).toHaveLength(1);
        expect(html).not.toMatch(/derive-viewpoint-dialog__table/);
        expect(html).not.toMatch(/Metaclass/);
    });

    it('a role notation shows one row per class, each select with its label, the prefill selected', () => {
        const html = render({});
        const [, ...rows] = selects(html);
        expect(rows).toHaveLength(4);
        const labels = Object.fromEntries(labelsFor(html));
        expect(rows.map(r => labels[r.id ?? ''])).toEqual(['State', 'Initial', 'Transition', 'Event']);
        expect(rows.map(r => r.options.find(o => o.selected)?.value)).toEqual(['node', 'initial', 'transition', '']);
        expect(rows[0].options.map(o => o.text)).toEqual(['—', 'State', 'Initial', 'Terminal', 'Transition']);
    });

    it('a class with no entry of its own says which role it inherits, in its empty option', () => {
        const html = render({ roles: { S: 'node', T: 'transition' }, effective: new Map([['S', 'node'], ['I', 'node'], ['T', 'transition']]) });
        const [, , initial, , event] = selects(html);
        expect(initial.options[0]).toEqual({ value: '', text: '— (State, inherited)', selected: true });
        expect(event.options[0]).toEqual({ value: '', text: '—', selected: true });
    });

    it('Derive is off while a role notation has no role, on for Generic and once a class has one', () => {
        const button = (html: string) => /<button[^>]*class="[^"]*sim-roles-modal__btn--primary[^"]*"[^>]*>/.exec(html)?.[0] ?? '';
        expect(button(render({ roles: {}, effective: new Map() }))).toMatch(/disabled=""/);
        expect(button(render({}))).not.toMatch(/disabled=""/);
        expect(button(render({ notation: 'generic', roles: {}, effective: new Map() }))).not.toMatch(/disabled=""/);
    });

    it('the footer says where the table came from', () => {
        expect(render({ prefillFrom: 'binding' })).toMatch(/Prefilled from the simulation roles/);
        expect(render({ prefillFrom: 'derived' })).toMatch(/Prefilled from the latest derived viewpoint/);
        expect(render({ prefillFrom: 'signals' })).toMatch(/Prefilled from the names and the structure/);
    });

    it('uses the shared modal shell and Bootstrap icons only', () => {
        const html = render({});
        expect(html).toMatch(/class="sim-roles-modal derive-viewpoint-dialog"/);
        for (const c of ['sim-roles-modal__header', 'sim-roles-modal__body', 'sim-roles-modal__footer', 'sim-roles-modal__btn--secondary']) expect(html).toContain(c);
        const icons = [...html.matchAll(/<i class="([^"]*)"/g)].map(m => m[1]);
        expect(icons.length).toBeGreaterThan(0);
        expect(icons.every(c => /^bi bi-[a-z0-9-]+$/.test(c))).toBe(true);
    });
});
