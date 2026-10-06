/**
 * Notation glyphs out of «Color by metaclass» (P-2026-10-02-2045, R-VP-50,
 * docs/discovery/discovery_2026-10-02_vp_glyph_nocolor.md).
 *
 * A node a derived notation draws as a glyph (a fork or join bar, an initial disc, a final
 * bull's-eye, a Petri transition bar) paints with coloring on exactly as with coloring off;
 * every other node is still coloured.
 *
 * ── Bench ────────────────────────────────────────────────────────────────────
 * Same as `irSelectionRing.test.ts`: ObjectNode rendered to markup on its IR branch, the joiner
 * barrel mocked («window is not defined»), `useIRView` handing the compiled view. The documents
 * are the real derivation's (`derivedDocuments`, with the provenance «Derive viewpoint» writes),
 * on the demo metamodels of activityUml.test.ts. What is compared is the whole markup, coloring
 * on against coloring off. Equal markup paints equal fill, border and text here because a glyph
 * receives no override at all, so not one inline `--color-inode-*` token either: equal markup with
 * a token rebound above it would not be equal paint (the entry mark of the report's Q5, measured by
 * the lane probe). The pixels are the probe's.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { ReactFlowProvider } from '@xyflow/react';

const state: { viewpoint: string; idlookup: Record<string, any> } = { viewpoint: 'vp1', idlookup: {} };

vi.mock('../../../../joiner', () => ({
    store: { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a },
    U: {},
    LPointerTargetable: { from: () => null, fromPointer: () => null, fromD: () => null, wrap: () => null },
}));
vi.mock('../../sync/canvasToJjom', () => ({
    syncNodeLabel: () => {},
    syncUpdateFeatureValue: () => {},
    syncIRCollapsedToJjom: () => {},
    syncSetReferenceValue: () => {},
}));
vi.mock('../../hooks/useLayoutAutosave', () => ({
    useLayoutAutosave: () => ({ scheduleLayoutSave: () => {} }),
}));
vi.mock('../../viewpoint/ir/irDemoFixture', () => ({}));

const resolution: { current: any } = { current: null };
vi.mock('../../viewpoint/ir/irResolve', () => ({
    useIRView: () => resolution.current,
    useIRViewpointActive: () => true,
    useIRRowView: () => null,
}));

import ObjectNode from '../ObjectNode';
import { compileView } from '../../viewpoint/ir/irCompile';
import { makeDrawReadCtx } from '../../viewpoint/ir/irReadCtx';
import type { NodeViewIR } from '../../viewpoint/ir/irTypes';
import { derivedDocuments, dialogPrefill } from '../../viewpoint/derive/notations';
import type { DerivedNotationId } from '../../viewpoint/derive/notations';
import { sketchOfMetamodel } from '../../sim/metamodelSketch';
import { bindProfile } from '../../../../model/simulation/profileBinder';
import { systemProfile } from '../../../../model/simulation/simProfiles';
import { ROLE_CATALOG } from '../../../../model/simulation/roleCatalog';

// ---------------------------------------------------------------------------
// Fixtures: three demos of activityUml.test.ts, with the father links the resolver climbs
// ---------------------------------------------------------------------------

type ClsDef = { name: string; abstract?: boolean; supers?: string[]; attrs?: [string, string][]; refs?: [string, string][] };

function metamodel(tag: string, classes: ClsDef[], profile: string) {
    const lookup: Record<string, any> = {};
    const classId = (n: string) => `${tag}.${n}`;
    lookup[tag] = { id: tag, className: 'DModel', name: tag, isMetamodel: true, packages: [`${tag}.pkg`], classes: [] };
    lookup[`${tag}.pkg`] = { id: `${tag}.pkg`, className: 'DPackage', name: 'default', father: tag, classes: classes.map(c => classId(c.name)), subpackages: [] };
    for (const c of classes) {
        const id = classId(c.name);
        lookup[id] = {
            id, className: 'DClass', name: c.name, father: `${tag}.pkg`, abstract: !!c.abstract, extends: (c.supers ?? []).map(classId),
            attributes: (c.attrs ?? []).map(([n]) => `${id}.${n}`), references: (c.refs ?? []).map(([n]) => `${id}.${n}`),
        };
        for (const [n, type] of c.attrs ?? []) lookup[`${id}.${n}`] = { className: 'DAttribute', name: n, type, upperBound: 1 };
        for (const [n, type] of c.refs ?? []) lookup[`${id}.${n}`] = { className: 'DReference', name: n, type: classId(type), composition: false, aggregation: false, upperBound: 1 };
    }
    const bindings = bindProfile(systemProfile(profile)!, sketchOfMetamodel(lookup, tag));
    const bag: Record<string, unknown> = { simProfile: profile };
    for (const d of ROLE_CATALOG) {
        const b = bindings[d.id];
        if (d.key && b?.status === 'bound') bag[d.key] = b.value;
    }
    lookup[tag]._state = bag;
    return { id: tag, lookup, classId };
}

const FLOWB = () => metamodel('FLOWB', [
    { name: 'ActivityNode' },
    { name: 'InitialNode', supers: ['ActivityNode'] },
    { name: 'Activity', supers: ['ActivityNode'] },
    { name: 'Decision', supers: ['ActivityNode'] },
    { name: 'Fork', supers: ['ActivityNode'] },
    { name: 'Join', supers: ['ActivityNode'] },
    { name: 'FinalNode', supers: ['ActivityNode'] },
    { name: 'ControlFlow', attrs: [['guard', 'Pointer_EXPRESSION']], refs: [['source', 'ActivityNode'], ['target', 'ActivityNode']] },
], 'flowchart');
const PETRI = () => metamodel('PETRI', [
    { name: 'PNode', abstract: true },
    { name: 'Place', supers: ['PNode'], attrs: [['tokens', 'Pointer_EINT']] },
    { name: 'Transition', supers: ['PNode'], attrs: [['guard', 'Pointer_EXPRESSION']] },
    { name: 'Arc', attrs: [['weight', 'Pointer_EINT']], refs: [['src', 'PNode'], ['tgt', 'PNode']] },
    { name: 'InhibitorArc', supers: ['Arc'] },
], 'petri');
const PEST = () => metamodel('PEST', [
    { name: 'State', refs: [['transitions', 'Transition']] },
    { name: 'Initial', supers: ['State'] },
    { name: 'Terminal', supers: ['State'] },
    { name: 'Transition', refs: [['nextState', 'State'], ['event', 'Event']] },
    { name: 'Event' },
], 'stateMachine');

type Mm = ReturnType<typeof FLOWB>;

/** The vertex documents of `notation`, by class name, as «Derive viewpoint» creates them. */
function vertexDocs(mm: Mm, notation: DerivedNotationId): Record<string, NodeViewIR> {
    const views = derivedDocuments(mm.lookup, mm.id, { notation, classRoles: dialogPrefill(mm.lookup, mm.id, notation, []).roles });
    return Object.fromEntries(views.filter(v => v.ir.kind === 'vertex').map(v => [v.className, v.ir as NodeViewIR]));
}

/** ObjectNode's markup for an object of class `className` drawn by `ir`, under viewpoint vp1 coloured or not. */
function render(mm: Mm, className: string, ir: NodeViewIR, coloring: boolean): string {
    const classId = mm.classId(className);
    state.viewpoint = 'vp1';
    state.idlookup = {
        ...mm.lookup,
        vp1: { id: 'vp1', className: 'DViewPoint', metaclassColoring: { enabled: coloring, baseColor: '#0ea5e9', border: true } },
        obj: { id: 'obj', className: 'DObject', instanceof: classId, name: 'n1', features: [] },
        v_obj: { id: 'v_obj', className: 'DVertex', model: 'obj' },
    };
    resolution.current = { compiled: compileView(`view_${className}`, ir), objectId: 'obj', readCtx: makeDrawReadCtx(state.idlookup) };
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    const props = { id: 'v_obj', data: { label: 'n1', instanceOfClassId: classId, className, features: [] }, selected: false } as any;
    return renderToStaticMarkup(createElement(Provider, {
        store: reduxStore,
        children: createElement(ReactFlowProvider, { children: createElement(ObjectNode, props) }),
    }));
}

/** The colours the palette gives the demo classes at 1ff8ab314 (notationGlyph.test.ts pins them). */
const FILL = { FLOWB_Activity: '#f3cbcb', PETRI_Place: '#f3dfcb', PEST_State: '#cbdef0' };

describe('a derived glyph node paints with coloring on exactly as with coloring off', () => {
    const cases: Array<[string, () => Mm, DerivedNotationId, string]> = [
        ['Activity (UML) initial disc', FLOWB, 'activityUml', 'InitialNode'],
        ['Activity (UML) fork bar', FLOWB, 'activityUml', 'Fork'],
        ['Activity (UML) join bar', FLOWB, 'activityUml', 'Join'],
        ['Activity (UML) final bull\'s-eye (dot-large)', FLOWB, 'activityUml', 'FinalNode'],
        ['Flowchart initial disc (catalogue ink)', FLOWB, 'flowchart', 'InitialNode'],
        ['Flowchart fork bar', FLOWB, 'flowchart', 'Fork'],
        ['Flowchart final bull\'s-eye (dot)', FLOWB, 'flowchart', 'FinalNode'],
        // State machine is drawn as Statechart (UML) since P-2026-10-03-1300 and draws no disc: the named glyph is the Petri Terminal's.
        ['Petri net terminal bull\'s-eye, named', PEST, 'petri', 'Terminal'],
        ['Petri net (classic) transition bar', PETRI, 'petriClassic', 'Transition'],
        ['Petri net transition bar, name on it', PETRI, 'petri', 'Transition'],
    ];
    for (const [label, make, notation, className] of cases) {
        it(label, () => {
            const mm = make();
            const ir = vertexDocs(mm, notation)[className];
            expect(ir, `${notation}/${className}`).toBeTruthy();
            const off = render(mm, className, ir, false);
            const on = render(mm, className, ir, true);
            expect(off).toContain('ir-node-content');
            expect(on).toBe(off);
        });
    }
});

describe('every other node is still coloured', () => {
    it('positive control: an Activity (UML) action takes its swatch, and its markup moves', () => {
        const mm = FLOWB();
        const ir = vertexDocs(mm, 'activityUml').Activity;
        const off = render(mm, 'Activity', ir, false);
        const on = render(mm, 'Activity', ir, true);
        expect(on).not.toBe(off);
        expect(on).toContain(`background:${FILL.FLOWB_Activity}`);
        expect(off).not.toContain(`background:${FILL.FLOWB_Activity}`);
    });

    it('the Petri net (classic) place is coloured', () => {
        const mm = PETRI();
        const ir = vertexDocs(mm, 'petriClassic').Place;
        const on = render(mm, 'Place', ir, true);
        expect(on).not.toBe(render(mm, 'Place', ir, false));
        expect(on).toContain(FILL.PETRI_Place);
    });

    it('a Statechart (UML) state is coloured', () => {
        const mm = PEST();
        const ir = vertexDocs(mm, 'statechart').State;
        expect(render(mm, 'State', ir, true)).toContain(`background:${FILL.PEST_State}`);
    });
});
