/**
 * metamodelSketch — the plain sketch of a metamodel, read from the raw lookup
 * (R-SIM-77, P-2026-09-27-0225).
 *
 * A fake lookup with the D-layer fields the collector reads: `classes` and
 * `subpackages` on the containers, `packages` on the model, `abstract`,
 * `extends`, `attributes`, `references` on a class, `type`, `composition`,
 * `aggregation` on a feature. The panel imports the joiner and does not load
 * under this bench; the collector does.
 */

import { describe, it, expect } from 'vitest';
import { sketchOfMetamodel } from '../metamodelSketch';
import { bindProfile } from '../../../../model/simulation/profileBinder';
import { systemProfile } from '../../../../model/simulation/simProfiles';
import type { SimProfile } from '../../../../model/simulation/simProfiles';

const LOOKUP: Record<string, any> = {
    MM: { className: 'DModel', name: 'Turnstile', packages: ['P1'], classes: ['C_Root'] },
    C_Root: { className: 'DClass', name: 'Root', abstract: false, extends: [], attributes: [], references: [] },
    P1: { className: 'DPackage', classes: ['C_Named', 'C_State', 'C_Gone', 42], subpackages: ['P2'] },
    // P2 lists P1 back: the walk is cycle-safe.
    P2: { className: 'DPackage', classes: ['C_Trans', 'C_Event', 'C_Init'], subpackages: ['P1'] },
    C_Named: { className: 'DClass', name: 'TNamed', abstract: true, extends: [], attributes: ['A_label'], references: [] },
    C_State: { className: 'DClass', name: 'TState', abstract: false, extends: ['C_Named'], attributes: [], references: ['R_out'] },
    C_Trans: {
        className: 'DClass', name: 'TTrans', abstract: false, extends: [], attributes: ['A_guard', 'A_gone'],
        references: ['R_next', 'R_trigger', 'R_bag'],
    },
    C_Event: { className: 'DClass', name: 'TEvent', extends: ['C_Named'] },
    C_Init: { className: 'DClass', name: 'TInit', abstract: false, extends: ['C_State'], attributes: [], references: [] },
    A_label: { className: 'DAttribute', name: 'label', type: 'Pointer_ESTRING' },
    A_guard: { className: 'DAttribute', name: 'guard', type: 'Pointer_EXPRESSION' },
    R_out: { className: 'DReference', name: 'out', type: 'C_Trans', composition: true, aggregation: false },
    R_next: { className: 'DReference', name: 'next', type: 'C_State', composition: false, aggregation: false },
    R_trigger: { className: 'DReference', name: 'trigger', type: 'C_Event', composition: false, aggregation: false },
    R_bag: { className: 'DReference', name: 'bag', type: 'C_Event', composition: false, aggregation: true },
};

describe('sketchOfMetamodel', () => {
    const sketch = sketchOfMetamodel(LOOKUP, 'MM');

    it('collects the classes of the model and of its packages and subpackages, in walk order, abstract ones included', () => {
        expect(sketch.classes).toEqual([
            { id: 'C_Root', name: 'Root', abstract: false, supers: [] },
            { id: 'C_Named', name: 'TNamed', abstract: true, supers: [] },
            { id: 'C_State', name: 'TState', abstract: false, supers: ['C_Named'] },
            { id: 'C_Trans', name: 'TTrans', abstract: false, supers: [] },
            { id: 'C_Event', name: 'TEvent', abstract: false, supers: ['C_Named'] },
            { id: 'C_Init', name: 'TInit', abstract: false, supers: ['C_State'] },
        ]);
    });

    it('collects every attribute with its owner and its type pointer', () => {
        expect(sketch.attributes).toEqual([
            { id: 'A_label', name: 'label', owner: 'C_Named', type: 'Pointer_ESTRING' },
            { id: 'A_guard', name: 'guard', owner: 'C_Trans', type: 'Pointer_EXPRESSION' },
        ]);
    });

    it('collects every reference with its owner, its type and whether it is a composition or an aggregation', () => {
        expect(sketch.references).toEqual([
            { id: 'R_out', name: 'out', owner: 'C_State', type: 'C_Trans', composition: true, aggregation: false },
            { id: 'R_next', name: 'next', owner: 'C_Trans', type: 'C_State', composition: false, aggregation: false },
            { id: 'R_trigger', name: 'trigger', owner: 'C_Trans', type: 'C_Event', composition: false, aggregation: false },
            { id: 'R_bag', name: 'bag', owner: 'C_Trans', type: 'C_Event', composition: false, aggregation: true },
        ]);
    });

    it('skips ids missing from the lookup and ids that are not strings, and never loops on a package cycle', () => {
        const ids = sketch.classes.map(c => c.id);
        expect(ids).not.toContain('C_Gone');
        expect(ids).toHaveLength(new Set(ids).size);
        expect(sketch.attributes.map(a => a.id)).not.toContain('A_gone');
    });

    it('an unknown model gives an empty sketch', () => {
        expect(sketchOfMetamodel(LOOKUP, 'nope')).toEqual({ classes: [], attributes: [], references: [] });
    });

    it('feeds the binder: State machine on the collected turnstile binds its six roles', () => {
        const b = bindProfile(systemProfile('stateMachine') as SimProfile, sketch);
        expect(b.node).toMatchObject({ status: 'bound', value: 'C_State' });
        expect(b.initial).toMatchObject({ status: 'bound', value: 'C_Init' });
        expect(b.transition).toMatchObject({ status: 'bound', value: 'C_Trans' });
        expect(b.ownedTransitions).toMatchObject({ status: 'bound', value: 'R_out' });
        expect(b.nextState).toMatchObject({ status: 'bound', value: 'R_next' });
        // the aggregation is not a plain reference: Trigger has one candidate, not two
        expect(b.trigger).toMatchObject({ status: 'bound', value: 'R_trigger' });
    });
});
