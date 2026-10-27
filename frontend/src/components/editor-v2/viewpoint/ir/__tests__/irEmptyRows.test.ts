/**
 * IRNodeContent: `structure.emptyBehavior: 'hide'` in an IR slot compartment (P-2026-10-03-1304, Q9a,
 * docs/discovery/discovery_2026-10-03_derived_notations_edges.md §3.9 (a), docs/lir/lir_2026-10-03_empty_rows_hidden.md).
 *
 * A row whose slot holds no value is left out, and a compartment left with no row is not drawn; without the key, or
 * with 'dash', every row is drawn as before (pinned on the markup of 171aca4d8).
 */
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';

const state: { idlookup: Record<string, any> } = { idlookup: {} };

vi.mock('../../../../../joiner', () => ({
    store: { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a },
    U: {},
    LPointerTargetable: { from: () => null, fromPointer: () => null, fromD: () => null, wrap: () => null },
}));
vi.mock('../../../sync/canvasToJjom', () => ({
    syncNodeLabel: () => {},
    syncUpdateFeatureValue: () => {},
    syncSetReferenceValue: () => {},
    syncEdgeRefProperty: () => {},
}));
vi.mock('../irResolve', () => ({ useIRRowView: () => null }));
vi.mock('@xyflow/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@xyflow/react')>();
    return { ...actual, useReactFlow: () => ({ setEdges: () => {}, getNodes: () => [] }), useInternalNode: () => undefined, useEdges: () => [] };
});

import IRNodeContent from '../IRNodeContent';
import { clearCompileCache, compileView } from '../irCompile';
import { makeDrawReadCtx } from '../irReadCtx';
import type { FieldCompartmentSpec, StructureSpec, VertexViewIR } from '../irTypes';

const digest = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

/**
 * A State with four slots: `name` (the identity), `entry` (empty: no value), `exit` (a single null value), `doo`
 * (`count := 0`), and a reference `next` with no target.
 */
function lookup(over: { doo?: unknown[] } = {}): Record<string, any> {
    return {
        T_str: { id: 'T_str', className: 'DClass', name: 'EString' },
        T_act: { id: 'T_act', className: 'DClass', name: 'Action' },
        cls_S: { id: 'cls_S', className: 'DClass', name: 'State', extends: [] },
        A_name: { id: 'A_name', className: 'DAttribute', name: 'name', type: 'T_str' },
        A_entry: { id: 'A_entry', className: 'DAttribute', name: 'entry', type: 'T_act' },
        A_exit: { id: 'A_exit', className: 'DAttribute', name: 'exit', type: 'T_act' },
        A_doo: { id: 'A_doo', className: 'DAttribute', name: 'doo', type: 'T_act' },
        R_next: { id: 'R_next', className: 'DReference', name: 'next', type: 'cls_S' },
        s1: { id: 's1', className: 'DObject', instanceof: 'cls_S', name: 'locked', features: ['dv_name', 'dv_entry', 'dv_exit', 'dv_doo', 'dv_next'] },
        dv_name: { id: 'dv_name', className: 'DValue', instanceof: 'A_name', values: ['locked'] },
        dv_entry: { id: 'dv_entry', className: 'DValue', instanceof: 'A_entry', values: [] },
        dv_exit: { id: 'dv_exit', className: 'DValue', instanceof: 'A_exit', values: [null] },
        dv_doo: { id: 'dv_doo', className: 'DValue', instanceof: 'A_doo', values: over.doo ?? ['count := 0'] },
        dv_next: { id: 'dv_next', className: 'DValue', instanceof: 'R_next', values: [] },
    };
}

const attributes = (): FieldCompartmentSpec => ({
    id: 'attributes', source: { from: 'attributes', exclude: ['name'] },
    rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }] }, separator: true,
});
const references = (): FieldCompartmentSpec => ({
    id: 'references', source: { from: 'references' },
    rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }] }, separator: true,
});

function view(structure?: StructureSpec, compartments: FieldCompartmentSpec[] = [attributes()]): VertexViewIR {
    return {
        irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
        shape: { form: 'rounded', labels: [{ position: 'top', source: { from: 'intrinsic', prop: 'name' } }] },
        ...(structure ? { structure } : {}),
        fieldCompartments: compartments,
    };
}

function renderNode(ir: VertexViewIR, data = lookup()): string {
    clearCompileCache();
    state.idlookup = data;
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    return renderToStaticMarkup(createElement(Provider, {
        store: reduxStore,
        children: createElement(IRNodeContent, { compiled: compileView('empty_rows', ir), objectId: 's1', vertexId: 'v_s1', readCtx: makeDrawReadCtx(state.idlookup) }),
    }));
}
/** The text of each compartment row, tags stripped. */
const rowTexts = (html: string) => [...html.matchAll(/<div class="ir-row">(.*?)<\/div>/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
const compartments = (html: string) => (html.match(/class="ir-compartment/g) ?? []).length;

describe('IRNodeContent: an IR compartment without emptyBehavior draws every row, as before', () => {
    it('no key: the three slot rows, the two empty ones included; the markup of 171aca4d8', () => {
        const html = renderNode(view());
        expect(rowTexts(html).map(t => t.split(' = ')[0])).toEqual(['entry', 'exit', 'doo']);
        expect(digest(html)).toBe(PIN_NO_KEY);
    });

    it('\'dash\' draws exactly what no key draws', () => {
        expect(renderNode(view({ emptyBehavior: 'dash' }))).toBe(renderNode(view()));
    });
});

describe('IRNodeContent: emptyBehavior \'hide\' leaves the rows with no value out', () => {
    it('an attribute slot with no value, or a single null, draws no row; a set one does', () => {
        expect(rowTexts(renderNode(view({ emptyBehavior: 'hide' })))).toEqual(['doo = count := 0']);
    });

    it('every row empty: no compartment at all (DemoESM\'s locked, its `entry` unset)', () => {
        const html = renderNode(view({ emptyBehavior: 'hide' }), lookup({ doo: [] }));
        expect(rowTexts(html)).toEqual([]);
        expect(compartments(html)).toBe(0);
        // The same node without the key keeps its compartment of dashes.
        expect(compartments(renderNode(view(undefined), lookup({ doo: [] })))).toBe(1);
    });

    it('no row left: the name the compartment pushed to the top is centred, as with no compartment; a row left keeps it on top', () => {
        const labelClass = (html: string) => html.match(/<span class="(ir-label ir-label--[a-z]+)"/)?.[1];
        expect(labelClass(renderNode(view({ emptyBehavior: 'hide' }), lookup({ doo: [] })))).toBe('ir-label ir-label--center');
        expect(labelClass(renderNode(view({ emptyBehavior: 'hide' })))).toBe('ir-label ir-label--top');
        // Without the key the empty rows are drawn, the name stays on top.
        expect(labelClass(renderNode(view(undefined), lookup({ doo: [] })))).toBe('ir-label ir-label--top');
    });

    it('the name is centred only when every compartment is left without a row: one with a row keeps it on top', () => {
        const labelClass = (html: string) => html.match(/<span class="(ir-label ir-label--[a-z]+)"/)?.[1];
        // `doo` is set, the reference `next` is not: the attributes keep a row, the references none.
        const html = renderNode(view({ emptyBehavior: 'hide' }, [attributes(), references()]));
        expect(compartments(html)).toBe(1);
        expect(labelClass(html)).toBe('ir-label ir-label--top');
    });

    it('without the key nothing moves: every slot excluded draws no compartment and the name stays on top, as before', () => {
        const labelClass = (html: string) => html.match(/<span class="(ir-label ir-label--[a-z]+)"/)?.[1];
        const all: FieldCompartmentSpec = { ...attributes(), source: { from: 'attributes', exclude: ['name', 'entry', 'exit', 'doo'] } };
        const html = renderNode(view(undefined, [all]));
        expect(compartments(html)).toBe(0);
        expect(labelClass(html)).toBe('ir-label ir-label--top');
    });

    it('a references compartment hides its empty rows too', () => {
        const html = renderNode(view({ emptyBehavior: 'hide' }, [references()]));
        expect(compartments(html)).toBe(0);
        expect(compartments(renderNode(view(undefined, [references()])))).toBe(1);
    });

    it('\'collapse\' is not \'hide\' in the IR compartment: every row, as without the key', () => {
        expect(renderNode(view({ emptyBehavior: 'collapse' }))).toBe(renderNode(view()));
    });
});

/** The markup of the no-key view, measured on 171aca4d8 before the edit of this item. */
const PIN_NO_KEY = '034ca331cac6c1f6';
