/**
 * The outside label paints on the side the decoration pass chose (P-2026-10-03-1920, item 2, A2 amending R-VP-53).
 *
 * `irLabelAnchors` on the node data (declared side -> chosen side, written by irEdgeViews.ts) reaches IRNodeContent
 * through ObjectNode; absent, the label paints on its declared side, the markup as before. The bench of
 * irInkOutside.test.ts: ObjectNode rendered to markup on its IR branch, the joiner barrel mocked, the real derivation's
 * documents (Petri net (classic) on the PETRI demo metamodel).
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
import { sketchOfMetamodel } from '../../sim/metamodelSketch';
import { bindProfile } from '../../../../model/simulation/profileBinder';
import { systemProfile } from '../../../../model/simulation/simProfiles';
import { ROLE_CATALOG } from '../../../../model/simulation/roleCatalog';

// ---------------------------------------------------------------------------
// Fixtures: the PETRI and PEST demos of irGlyphNoColor.test.ts
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

const PETRI = () => metamodel('PETRI', [
    { name: 'PNode', abstract: true },
    { name: 'Place', supers: ['PNode'], attrs: [['tokens', 'Pointer_EINT']] },
    { name: 'Transition', supers: ['PNode'], attrs: [['guard', 'Pointer_EXPRESSION']] },
    { name: 'Arc', attrs: [['weight', 'Pointer_EINT']], refs: [['src', 'PNode'], ['tgt', 'PNode']] },
    { name: 'InhibitorArc', supers: ['Arc'] },
], 'petri');

function render(data: Record<string, unknown>): string {
    const mm = PETRI();
    const views = derivedDocuments(mm.lookup, mm.id, { notation: 'petriClassic', classRoles: dialogPrefill(mm.lookup, mm.id, 'petriClassic', []).roles });
    const ir = views.find(v => v.className === 'Place' && v.ir.kind === 'vertex')!.ir as NodeViewIR;
    const classId = mm.classId('Place');
    state.viewpoint = 'vp1';
    state.idlookup = {
        ...mm.lookup,
        vp1: { id: 'vp1', className: 'DViewPoint' },
        obj: { id: 'obj', className: 'DObject', instanceof: classId, name: 'p1', features: [] },
        v_obj: { id: 'v_obj', className: 'DVertex', model: 'obj' },
    };
    resolution.current = { compiled: compileView('view_Place_anchor', ir), objectId: 'obj', readCtx: makeDrawReadCtx(state.idlookup) };
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    const props = { id: 'v_obj', data: { label: 'p1', instanceOfClassId: classId, className: 'Place', features: [], ...data }, selected: false } as any;
    return renderToStaticMarkup(createElement(Provider, {
        store: reduxStore,
        children: createElement(ReactFlowProvider, { children: createElement(ObjectNode, props) }),
    }));
}

describe('the classic Petri place\'s name on the side the decoration pass chose', () => {
    it('absent: below, its declared side (the markup of before)', () => {
        const html = render({});
        expect(html).toContain('ir-label--outside ir-label--anchor-s');
        expect(html).not.toContain('ir-label--anchor-n');
    });

    it('moved: above, and nowhere else (mutation: the map not passed, or not read)', () => {
        const html = render({ irLabelAnchors: { s: 'n' } });
        expect(html).toContain('ir-label--outside ir-label--anchor-n');
        expect(html).not.toContain('ir-label--anchor-s');
    });

    it('a map for another side leaves the label where it is declared (mutation: the first entry taken for any label)', () => {
        expect(render({ irLabelAnchors: { n: 'e' } })).toContain('ir-label--outside ir-label--anchor-s');
    });

    it('a value outside the four sides is ignored (mutation: any string painted)', () => {
        const html = render({ irLabelAnchors: { s: 'nw' } });
        expect(html).toContain('ir-label--outside ir-label--anchor-s');
        expect(html).not.toContain('anchor-nw');
    });
});
