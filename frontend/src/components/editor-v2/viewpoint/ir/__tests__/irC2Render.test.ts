/**
 * Slice C2 (P-2026-09-30-0150, R-VP-20): the five IR keys, rendered, present and absent.
 *
 * ── The subjects are IRNodeContent and UnifiedEdge, rendered ─────────────────
 * Same bench as `nodes/__tests__/irCollapsedRender.test.ts`: `renderToStaticMarkup` in node with
 * `createElement`, the joiner barrel and the canvas write-back mocked (they pull Monaco at import,
 * «window is not defined»), the view compiled by the real `compileView` / `compileEdgeView` and read
 * through the real draw ReadCtx. UnifiedEdge also needs React Flow's hooks: the provider is real,
 * `EdgeLabelRenderer` (a portal into the flow's DOM) renders its children in place, and the node and
 * edge hooks answer «no node measured yet», the first frame of every edge.
 *
 * «Absent» is measured against the C1 tip: the markup digests below were taken on `3ec98d486` (code
 * as `ddfb24dc1`) before any C2 edit, so an IR without the keys renders the bytes it rendered.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { ReactFlowProvider } from '@xyflow/react';

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
    return {
        ...actual,
        EdgeLabelRenderer: ({ children }: { children?: unknown }) => createElement(Fragment, null, children as never),
        useReactFlow: () => ({ setEdges: () => {}, getNodes: () => [] }),
        useInternalNode: () => undefined,
        useEdges: () => [],
    };
});

import IRNodeContent from '../IRNodeContent';
import UnifiedEdge from '../../../edges/UnifiedEdge';
import { clearCompileCache, compileView } from '../irCompile';
import { makeDrawReadCtx } from '../irReadCtx';
import type { FieldSegment, LabelSpec, VertexViewIR } from '../irTypes';

const digest = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

/** An Attribute `id` with three slots: the identity `name`, `type` and `isKey`. */
function lookup(): Record<string, any> {
    return {
        T_str: { id: 'T_str', className: 'DClass', name: 'EString' },
        T_bool: { id: 'T_bool', className: 'DClass', name: 'EBoolean' },
        cls_A: { id: 'cls_A', className: 'DClass', name: 'Attribute', extends: [] },
        A_name: { id: 'A_name', className: 'DAttribute', name: 'name', type: 'T_str' },
        A_type: { id: 'A_type', className: 'DAttribute', name: 'type', type: 'T_str' },
        A_key: { id: 'A_key', className: 'DAttribute', name: 'isKey', type: 'T_bool' },
        a1: { id: 'a1', className: 'DObject', instanceof: 'cls_A', name: 'id', features: ['dv_name', 'dv_type', 'dv_key'] },
        dv_name: { id: 'dv_name', className: 'DValue', instanceof: 'A_name', values: ['id'] },
        dv_type: { id: 'dv_type', className: 'DValue', instanceof: 'A_type', values: ['String'] },
        dv_key: { id: 'dv_key', className: 'DValue', instanceof: 'A_key', values: [true] },
    };
}

const EYEBROW: LabelSpec = { position: 'top', source: { from: 'literal', text: 'Attribute' }, style: { fontSize: 10, fontWeight: 'semibold' } };
const NAME: LabelSpec = { position: 'top', source: { from: 'intrinsic', prop: 'name' } };
const SEGMENTS: FieldSegment[] = [{ kind: 'literal', text: 'attr ' }, { kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }];

/** The generic box of an Attribute; `over` adds the C2 keys. */
function view(over: { eyebrow?: Partial<LabelSpec['style']>; exclude?: string[]; prefix?: FieldSegment } = {}): VertexViewIR {
    return {
        irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Attribute'],
        shape: { form: 'rounded', labels: [{ ...EYEBROW, style: { ...EYEBROW.style, ...(over.eyebrow ?? {}) } }, NAME] },
        fieldCompartments: [{
            id: 'attributes',
            source: over.exclude ? { from: 'attributes', exclude: over.exclude } : { from: 'attributes' },
            rowFormat: { segments: over.prefix ? [over.prefix, ...SEGMENTS.slice(1)] : SEGMENTS },
            separator: true,
        }],
    };
}

function renderNode(ir: VertexViewIR): string {
    clearCompileCache();
    state.idlookup = lookup();
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    return renderToStaticMarkup(createElement(Provider, {
        store: reduxStore,
        children: createElement(IRNodeContent, { compiled: compileView('c2_attr', ir), objectId: 'a1', vertexId: 'v_a1', readCtx: makeDrawReadCtx(state.idlookup) }),
    }));
}
/** The opening tag of each label span, in order. */
const labelTags = (html: string) => [...html.matchAll(/<span class="ir-label ir-label--top"[^>]*>/g)].map(m => m[0]);
/** The text of each compartment row, tags stripped. */
const rowTexts = (html: string) => [...html.matchAll(/<div class="ir-row">(.*?)<\/div>/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
/** The spans of each compartment row. */
const rowSpans = (html: string) => [...html.matchAll(/<div class="ir-row">(.*?)<\/div>/g)].map(m => [...m[1].matchAll(/<span[^>]*>[^<]*<\/span>/g)].map(s => s[0]));

describe('IRNodeContent — the C2 keys absent render the C1 tip\'s bytes', () => {
    it('the Attribute box without any C2 key: markup digest measured on the C1 tip', () => {
        const html = renderNode(view());
        expect(digest(html)).toBe('9f12c7a3feb02830');
        expect(labelTags(html)).toEqual(['<span class="ir-label ir-label--top" style="font-size:10px;font-weight:600">', '<span class="ir-label ir-label--top">']);
        expect(rowTexts(html)).toEqual(['attr name = id', 'attr type = String', 'attr isKey = true']);
    });
});

describe('IRNodeContent — letterSpacing and textTransform (R-VP-20 (1))', () => {
    it('present: letter-spacing in em and text-transform on the label span; the text stays as written', () => {
        const html = renderNode(view({ eyebrow: { letterSpacing: 0.08, textTransform: 'uppercase' } }));
        expect(labelTags(html)[0]).toBe('<span class="ir-label ir-label--top" style="font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase">');
        expect(html).toContain('text-transform:uppercase">Attribute</span>');
        // The name label is untouched.
        expect(labelTags(html)[1]).toBe('<span class="ir-label ir-label--top">');
    });

    it('absent: no letter-spacing, no text-transform anywhere', () => {
        const html = renderNode(view());
        expect(html).not.toContain('letter-spacing');
        expect(html).not.toContain('text-transform');
    });
});

describe('IRNodeContent — the attributes exclude (R-VP-20 (2))', () => {
    it('present: the excluded slot draws no row, the others keep their order', () => {
        expect(rowTexts(renderNode(view({ exclude: ['name'] })))).toEqual(['attr type = String', 'attr isKey = true']);
        expect(rowTexts(renderNode(view({ exclude: ['name', 'isKey'] })))).toEqual(['attr type = String']);
    });

    it('every slot excluded: no compartment at all, as a compartment with no slot', () => {
        const html = renderNode(view({ exclude: ['name', 'type', 'isKey'] }));
        expect(html).not.toContain('ir-compartment');
    });

    it('absent, or naming no slot: every slot has its row', () => {
        expect(rowTexts(renderNode(view()))).toEqual(['attr name = id', 'attr type = String', 'attr isKey = true']);
        expect(rowTexts(renderNode(view({ exclude: ['nope'] })))).toEqual(['attr name = id', 'attr type = String', 'attr isKey = true']);
    });
});

describe('IRNodeContent — the literal segment style (R-VP-20 (3))', () => {
    it('present: the literal span carries the style, the other spans none', () => {
        const spans = rowSpans(renderNode(view({ prefix: { kind: 'literal', text: 'attr ', style: { color: 'var(--color-inode-quiet)', fontStyle: 'italic' } } })));
        expect(spans[0]).toEqual([
            '<span style="font-style:italic;color:var(--color-inode-quiet)">attr </span>', '<span>name</span>', '<span> = </span>', '<span class="ir-row__value--editable">id</span>',
        ]);
    });

    it('absent: a bare span', () => {
        expect(rowSpans(renderNode(view()))[0][0]).toBe('<span>attr </span>');
    });
});

// ---------------------------------------------------------------------------
// UnifiedEdge: the label template reaches it as the RF label; the style as data.irLabelStyle
// ---------------------------------------------------------------------------

function renderEdge(data: Record<string, unknown>, label = 'weight = 2'): string {
    const props = {
        id: 'e1', source: 'A', target: 'B', sourceX: 0, sourceY: 0, targetX: 200, targetY: 0,
        sourceHandleId: 'right-0', targetHandleId: 'left-0', selected: false, label, type: 'instanceRef',
        data: { referenceName: 'next', irEdgeViewId: 'V_arc', irLabelAlwaysVisible: true, irLabelText: label, irTargetTermination: 'closedArrow', ...data },
    } as any;
    return renderToStaticMarkup(createElement(ReactFlowProvider, { children: createElement(UnifiedEdge, props) }));
}
const labelSpan = (html: string) => html.match(/<span class="edge-label__text[^"]*"[^>]*>[^<]*<\/span>/)?.[0] ?? null;

describe('UnifiedEdge — the label style and its halo (R-VP-20 (5))', () => {
    it('absent: the C1 tip\'s label box, uncoloured and coloured by the line (digests measured on the C1 tip)', () => {
        const plain = renderEdge({});
        const inked = renderEdge({ irStroke: 'var(--color-inode-name)' });
        expect(labelSpan(plain)).toBe('<span class="edge-label__text">weight = 2</span>');
        expect(labelSpan(inked)).toBe('<span class="edge-label__text" style="color:var(--color-inode-name)">weight = 2</span>');
        expect([digest(plain), digest(inked)]).toEqual(['d2fb1fbf4d9180a1', '880239314d2453e0']);
    });

    it('present: the halo class and the resolved style inline', () => {
        const html = renderEdge({ irLabelStyle: { fontSize: '12px', fontWeight: 500, color: 'var(--color-inode-quiet)' } });
        expect(labelSpan(html)).toBe('<span class="edge-label__text edge-label__text--halo" style="font-size:12px;font-weight:500;color:var(--color-inode-quiet)">weight = 2</span>');
    });

    it('present and empty: the halo class alone, the class defaults apply', () => {
        expect(labelSpan(renderEdge({ irLabelStyle: {} }))).toBe('<span class="edge-label__text edge-label__text--halo">weight = 2</span>');
    });

    it('TS3 colour precedence: style.color wins over line.color, which the text keeps when the style has none', () => {
        const both = renderEdge({ irStroke: '#ff0000', irLabelStyle: { color: 'var(--color-inode-quiet)' } });
        expect(labelSpan(both)).toBe('<span class="edge-label__text edge-label__text--halo" style="color:var(--color-inode-quiet)">weight = 2</span>');
        const lineOnly = renderEdge({ irStroke: '#ff0000', irLabelStyle: { fontSize: '12px' } });
        expect(labelSpan(lineOnly)).toBe('<span class="edge-label__text edge-label__text--halo" style="color:#ff0000;font-size:12px">weight = 2</span>');
        // The arrowhead keeps the line colour whatever the label says (E0b).
        expect(both).toContain('fill:#ff0000');
    });

    it('not an IR edge: a stray irLabelStyle is not read (an M2 reference edge, whose label is always drawn)', () => {
        const props = {
            id: 'e2', source: 'A', target: 'B', sourceX: 0, sourceY: 0, targetX: 200, targetY: 0,
            sourceHandleId: 'right-0', targetHandleId: 'left-0', selected: false, label: 'next', type: 'reference',
            data: { reference: { id: 'r1', name: 'next', kind: 'association' }, irLabelStyle: { fontSize: '12px' } },
        } as any;
        const html = renderToStaticMarkup(createElement(ReactFlowProvider, { children: createElement(UnifiedEdge, props) }));
        expect(labelSpan(html)).toBe('<span class="edge-label__text">next</span>');
    });
});
