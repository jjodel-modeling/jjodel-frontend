/**
 * L6 of the multi-tab front (P-2026-11-08-0808, R-MT-9): the id of a further tab on one model.
 * The first tab of a model keeps the bare model id; later ones carry a suffix, decoded in one place.
 * The real TabDataMaker runs with the tab contents mocked (node environment, no DOM).
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../MetamodelTab', () => ({ default: () => null }));
vi.mock('../ModelTab', () => ({ default: () => null }));
vi.mock('../DocumentationTab', () => ({ default: () => null }));
vi.mock('../InstanceManagerTab', () => ({ default: () => null }));
vi.mock('../ScriptTab', () => ({ default: () => null, ScriptTabTitle: () => null }));
vi.mock('../../../../model/conformance/ConformanceIndicator', () => ({ ConformanceIndicator: () => null }));
vi.mock('../../../../model/logicWrapper', () => ({}));
vi.mock('../tab-title.scss', () => ({}));

import { layoutTabIds, modelOfTabId, nextModelTabId } from '../modelTabId';
import { managerTabId } from '../instanceManagerModel';
import TabDataMaker from '../TabDataMaker';

const M = 'Pointer1762000000000_USER_12';

describe('modelTabId', () => {
    it('a free model gets the bare id, so one tab per model is what it is today', () => {
        expect(nextModelTabId(M, [])).toBe(M);
        expect(nextModelTabId(M, ['project_summary', 'Pointer9_USER_1'])).toBe(M);
    });

    it('a model with a tab open gets the first free suffix', () => {
        expect(nextModelTabId(M, [M])).toBe(`${M}~tab2`);
        expect(nextModelTabId(M, [M, `${M}~tab2`])).toBe(`${M}~tab3`);
        expect(nextModelTabId(M, [M, `${M}~tab3`])).toBe(`${M}~tab2`);
    });

    it('the first tab closed, its id is free again', () => {
        expect(nextModelTabId(M, [`${M}~tab2`])).toBe(M);
    });

    it('round trip: every id it hands out decodes to the model', () => {
        const open: string[] = [];
        for (let i = 0; i < 4; i++) {
            const id = nextModelTabId(M, open);
            expect(open).not.toContain(id);
            expect(modelOfTabId(id)).toBe(M);
            open.push(id);
        }
    });

    it('every other tab id decodes to itself', () => {
        for (const id of [M, 'project_summary', 'documentation', `doc_${M}`, `jjtl_${M}`, `vp_${M}`, `jjs_${M}`, managerTabId(M), 'Pointer_ViewPointDefault']) {
            expect(modelOfTabId(id)).toBe(id);
        }
    });

    it('layoutTabIds walks nested boxes and every top-level box', () => {
        const layout = {
            dockbox: { children: [{ tabs: [{ id: 'a' }] }, { children: [{ tabs: [{ id: 'b' }, { id: 'c' }] }] }] },
            floatbox: { children: [{ tabs: [{ id: 'd' }] }] },
            windowbox: { children: [] },
            maxbox: { children: [{ tabs: [{ id: 'e' }] }] },
        };
        expect(layoutTabIds(layout as any).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
        expect(layoutTabIds(null)).toEqual([]);
    });
});

describe('TabDataMaker.model with a tab id and a viewpoint', () => {
    const model = { id: M, name: 'm1', instanceof: 'MM' } as any;

    it('no options: the id is the model id and the content gets neither prop', () => {
        const tab = TabDataMaker.model(model) as any;
        expect(tab.id).toBe(M);
        expect(tab.content.props).toEqual({ modelid: M, metamodelid: 'MM' });
    });

    it('a tab id and a viewpoint reach the content', () => {
        const tab = TabDataMaker.model(model, { tabId: `${M}~tab2`, viewpointId: 'V' }) as any;
        expect(tab.id).toBe(`${M}~tab2`);
        expect(tab.content.props.modelid).toBe(M);
        expect(tab.content.props.tabId).toBe(`${M}~tab2`);
        expect(tab.content.props.initialViewpointId).toBe('V');
    });

    it('abstract syntax is null, not absent', () => {
        const tab = TabDataMaker.model(model, { tabId: `${M}~tab2`, viewpointId: null }) as any;
        expect(tab.content.props.initialViewpointId).toBeNull();
    });
});
