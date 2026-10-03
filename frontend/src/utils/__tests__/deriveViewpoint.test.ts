/**
 * deriveViewpoint — the name of a derived viewpoint (P-2026-10-03-1302).
 *
 * `<metamodel> / <notation label>`, the label read from the full notation list by id, made unique
 * among the project's viewpoint names with the suffix of duplicate model names (` (1)`, ` (2)`).
 *
 * `derivedViewpointName` is run directly. `createDerivedViewpoint` is run through the real notation
 * and derivation modules, with the joiner barrel and the UI collaborators mocked: the barrel pulls
 * Monaco at import («window is not defined»), as the DeriveViewpointDialog test notes. The mock of
 * `DViewPoint.newVP` records the name it is given and puts the viewpoint in the project, as the
 * creator does, so a second derivation sees the first.
 */
import { describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
    lookup: {} as Record<string, any>,
    projectVps: [] as string[],
    names: [] as string[],
}));

vi.mock('../../joiner', () => ({
    store: { getState: () => ({ idlookup: h.lookup }) },
    DProject: { getProject: () => ({ viewpoints: h.projectVps }) },
    DViewPoint: {
        newVP: (name: string, init?: (vp: any) => void) => {
            const vp: any = { id: `vp${h.projectVps.length}`, className: 'DViewPoint', name };
            init?.(vp);
            h.lookup[vp.id] = vp;
            h.projectVps.push(vp.id);
            h.names.push(name);
            return vp;
        },
    },
    DViewElement: { new2: () => ({}) },
    U: {},
}));
vi.mock('../../components/abstract/DockManager', () => ({ default: { openViewpoint: () => {} } }));
vi.mock('../../components/Toast/toastDispatch', () => ({ toast: { warning: () => {}, success: () => {} } }));
vi.mock('../../view/viewElement/view', () => ({ appliableToForIRKind: () => undefined }));

import { createDerivedViewpoint, derivedViewpointName } from '../deriveViewpoint';
import { DERIVED_NOTATIONS } from '../../components/editor-v2/viewpoint/derive/notations';
import type { DerivedNotationId } from '../../components/editor-v2/viewpoint/derive/notations';

describe('derivedViewpointName', () => {
    it('reads "<metamodel> / <label>" for the notations of the review (killed by a name that ignores the notation)', () => {
        expect(derivedViewpointName('DemoFlowB', 'activityUml', [])).toBe('DemoFlowB / Activity (UML)');
        expect(derivedViewpointName('DemoPetri', 'petriClassic', [])).toBe('DemoPetri / Petri net (classic)');
        expect(derivedViewpointName('Turnstile', 'statechart', [])).toBe('Turnstile / Statechart (UML)');
    });

    it('reads "Generic" for Generic (killed by a missing Generic label)', () => {
        expect(derivedViewpointName('M', 'generic', [])).toBe('M / Generic');
    });

    it('resolves every entry of the full list by id, so a hidden notation resolves too (killed by a lookup over a filtered list)', () => {
        for (const n of DERIVED_NOTATIONS) expect(derivedViewpointName('M', n.id, [])).toBe(`M / ${n.label}`);
    });

    it('falls back to the id for an id the list does not hold (killed by a throw on a missing entry)', () => {
        expect(derivedViewpointName('M', 'nope' as DerivedNotationId, [])).toBe('M / nope');
    });

    it('suffixes " (1)" then " (2)" on a taken name (killed by a dropped uniqueness step)', () => {
        expect(derivedViewpointName('M', 'generic', ['M / Generic'])).toBe('M / Generic (1)');
        expect(derivedViewpointName('M', 'generic', ['M / Generic', 'M / Generic (1)'])).toBe('M / Generic (2)');
    });

    it('does not suffix a notation whose name is free, nor on the name an earlier release gave (killed by a name compared without its notation)', () => {
        expect(derivedViewpointName('M', 'generic', ['M / Statechart (UML)', 'M (derived)', 'Default'])).toBe('M / Generic');
    });
});

/** A metamodel of two concrete classes joined by a reference: enough for the Generic derivation. */
function metamodel(id: string, name: string): Record<string, any> {
    const lookup: Record<string, any> = {};
    lookup[id] = { className: 'DModel', name, isMetamodel: true, packages: [`${id}.pkg`], classes: [] };
    lookup[`${id}.pkg`] = { className: 'DPackage', name: 'default', classes: [`${id}.A`, `${id}.B`], subpackages: [] };
    lookup[`${id}.A`] = { className: 'DClass', name: 'A', abstract: false, extends: [], attributes: [], references: [`${id}.A.b`] };
    lookup[`${id}.B`] = { className: 'DClass', name: 'B', abstract: false, extends: [], attributes: [], references: [] };
    lookup[`${id}.A.b`] = { className: 'DReference', name: 'b', type: `${id}.B`, composition: false, aggregation: false, upperBound: 1 };
    return lookup;
}

describe('createDerivedViewpoint', () => {
    const reset = () => {
        h.lookup = metamodel('MM', 'Flow');
        h.projectVps.length = 0;
        h.names.length = 0;
    };

    it('names the viewpoint after its notation, and a second derivation of the same notation " (1)" (killed by the old "(derived)" name, by a name built without the project\'s viewpoints)', () => {
        reset();
        const generic = { notation: 'generic' as const, classRoles: {} };
        const first = createDerivedViewpoint('MM', generic);
        const second = createDerivedViewpoint('MM', generic);
        expect(first?.name).toBe('Flow / Generic');
        expect(second?.name).toBe('Flow / Generic (1)');
        expect(h.names).toEqual(['Flow / Generic', 'Flow / Generic (1)']);
    });

    it('leaves a viewpoint saved under the old name as it is and does not count it as taken (killed by the old name counted as taken)', () => {
        reset();
        h.lookup.old = { className: 'DViewPoint', id: 'old', name: 'Flow (derived)' };
        h.projectVps.push('old');
        const vp = createDerivedViewpoint('MM', { notation: 'generic', classRoles: {} });
        expect(vp?.name).toBe('Flow / Generic');
        expect(h.lookup.old.name).toBe('Flow (derived)');
    });

    it('takes the names of the project\'s viewpoints only, not of any other entry of the store (killed by names read from the whole lookup)', () => {
        reset();
        h.lookup.other = { className: 'DModel', id: 'other', name: 'Flow / Generic' };
        const vp = createDerivedViewpoint('MM', { notation: 'generic', classRoles: {} });
        expect(vp?.name).toBe('Flow / Generic');
    });
});
