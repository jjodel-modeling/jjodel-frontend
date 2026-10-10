/**
 * The section list of every IR authoring panel, rendered (P-2026-10-10-1156, slice S4).
 *
 * The prompt's third criterion: the vertex, edge and row panels are unchanged by the graphVertex slice. Each panel is
 * rendered to markup through `react-dom/server`, with every body visible (no `activeTab`, the pre-partition layout),
 * in Basic and in Advanced, and the titles of its FormSections are read in order. The joiner barrel is mocked
 * (Monaco at import, «window is not defined»), as in nodes/__tests__/irHeaderBandRender.test.ts: the panels read
 * the project's metamodels through it, and an empty project leaves every metaclass-dependent field on its hint.
 *
 * The three existing lists were measured on the tree before this slice (a temporary worktree at 7d334c817, this file
 * and nothing else copied in) and are written here as they came out. The graphVertex list is the new panel's.
 */
import { describe, expect, it, vi } from 'vitest';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';

const state = { advanced: false, idlookup: {} as Record<string, unknown> };

vi.mock('../../../../../joiner', () => ({
    store: { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a },
    LProject: { getProject: () => ({ metamodels: [] }) },
    LPointerTargetable: { fromPointer: () => null, from: () => null, fromD: () => null, wrap: () => null },
    DClass: { cname: 'DClass' },
    Input: () => React.createElement('input'),
    Select: () => React.createElement('select'),
    U: {},
}));

import { VertexAuthoringPanel } from '../VertexAuthoringPanel';
import { EdgeAuthoringPanel } from '../EdgeAuthoringPanel';
import { RowAuthoringPanel } from '../RowAuthoringPanel';
import { GraphVertexAuthoringPanel } from '../GraphVertexAuthoringPanel';
import { defaultEdgeViewIR, defaultObjectViewIR } from '../../ir/irDefaults';
import { graphVertexSeedIR } from '../../ir/irCreationSeed';

const view = (ir: unknown) => ({ id: 'view_1', name: 'View', ir, appliableToClasses: [] }) as any;
const ROW_IR = { irVersion: 'ir-1.0', kind: 'row', metaclasses: [], template: [{ from: 'intrinsic', prop: 'name' }] };

function sections(panel: React.FC<any>, ir: unknown, advanced: boolean): string[] {
    state.advanced = advanced;
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    const html = renderToStaticMarkup(createElement(Provider, {
        store: reduxStore,
        children: createElement(panel, { view: view(ir) }),
    }));
    return [...html.matchAll(/<h3[^>]*>(.*?)<\/h3>/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
}

describe('IR authoring panels: the section list', () => {
    it('vertex', () => {
        expect(sections(VertexAuthoringPanel, defaultObjectViewIR(), false)).toMatchInlineSnapshot(`
          [
            "Matching",
            "Name",
            "Accent",
            "Compartment",
            "Field compartments",
            "Symbol",
            "Shape",
            "Fill",
            "Border",
            "Marker",
            "Sizing",
            "Badges",
            "General",
            "Symbol text",
            "Labels",
            "Source",
          ]
        `);
        expect(sections(VertexAuthoringPanel, defaultObjectViewIR(), true)).toMatchInlineSnapshot(`
          [
            "Matching",
            "Name",
            "Accent",
            "Compartment",
            "Field compartments",
            "Symbol",
            "Shape",
            "Fill",
            "Border",
            "Padding",
            "Marker",
            "Sizing",
            "Badges",
            "General",
            "Symbol text",
            "Labels",
            "Source",
          ]
        `);
    });

    it('edge', () => {
        expect(sections(EdgeAuthoringPanel, defaultEdgeViewIR(), false)).toMatchInlineSnapshot(`
          [
            "IR Edge view authoring",
            "Matching",
            "Line",
            "Ends",
            "Label",
            "Source",
          ]
        `);
        expect(sections(EdgeAuthoringPanel, defaultEdgeViewIR(), true)).toMatchInlineSnapshot(`
          [
            "IR Edge view authoring",
            "Matching",
            "Line",
            "Ends",
            "Label",
            "End labels",
            "Source",
          ]
        `);
    });

    it('row', () => {
        expect(sections(RowAuthoringPanel, ROW_IR, false)).toMatchInlineSnapshot(`
          [
            "IR Row view authoring",
            "Matching",
            "Template",
            "Row style",
            "Source",
          ]
        `);
        expect(sections(RowAuthoringPanel, ROW_IR, true)).toMatchInlineSnapshot(`
          [
            "IR Row view authoring",
            "Matching",
            "Template",
            "Row style",
            "Source",
          ]
        `);
    });

    it('graphVertex', () => {
        expect(sections(GraphVertexAuthoringPanel, graphVertexSeedIR(), false)).toMatchInlineSnapshot(`
          [
            "Matching",
            "Containment",
            "Shape",
            "Fill",
            "Border",
            "Sizing",
            "Visibility",
            "General",
            "Labels",
            "Source",
          ]
        `);
        expect(sections(GraphVertexAuthoringPanel, graphVertexSeedIR(), true)).toMatchInlineSnapshot(`
          [
            "Matching",
            "Containment",
            "Shape",
            "Fill",
            "Border",
            "Sizing",
            "Visibility",
            "General",
            "Labels",
            "Source",
          ]
        `);
    });
});
