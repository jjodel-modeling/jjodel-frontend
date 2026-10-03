/**
 * View default size (P-2026-09-29-1230): the pure half of the rule, in nodeSizing.ts.
 * The hook (useContentSize.ts) only measures and writes; who owns the box, which axes
 * are usable and what box the default gives are decided here, so they run in the node
 * vitest env (nodeSizing -> shapeRegistry, no joiner, no window).
 */
import { describe, expect, it } from 'vitest';
import {
    SHAPE_MIN_SIZE, authoredDefaultSize, defaultBoxFor, sizeSourceOf, usableSizeAxis,
} from '../nodeSizing';
import { getShapeDescriptor, hasSizeSupplement, resolveCornerRadius } from '../../viewpoint/ir/shapeRegistry';
import { getMarkerDef } from '../../viewpoint/ir/markerRegistry';
import { DERIVED_NOTATIONS, defaultChoice, derivedDocuments, dialogPrefill } from '../../viewpoint/derive/notations';
import type { AnyDerivedView } from '../../viewpoint/derive/viewpointDerivation';
import { sketchOfMetamodel } from '../../sim/metamodelSketch';
import { bindProfile } from '../../../../model/simulation/profileBinder';
import { systemProfile } from '../../../../model/simulation/simProfiles';
import { ROLE_CATALOG } from '../../../../model/simulation/roleCatalog';

describe('usableSizeAxis', () => {
    it('keeps a finite positive number', () => {
        for (const v of [1, 24, 120, 120.5]) expect(usableSizeAxis(v)).toBe(v);
    });

    it('reads zero, a negative, a non-finite and a non-number as absent', () => {
        for (const v of [0, -5, NaN, Infinity, '120', null, undefined, {}]) expect(usableSizeAxis(v)).toBeUndefined();
    });
});

describe('authoredDefaultSize', () => {
    it('is undefined when the view has no default (absent key, empty object, not an object)', () => {
        for (const v of [undefined, null, {}, 120, '120x60', [120, 60]]) expect(authoredDefaultSize(v)).toBeUndefined();
    });

    it('is undefined when no axis is usable (a persisted bad value reads as absent)', () => {
        expect(authoredDefaultSize({ width: 0, height: -1 })).toBeUndefined();
    });

    it('keeps the usable axes only, without materializing the missing one', () => {
        expect(authoredDefaultSize({ width: 120, height: 60 })).toEqual({ width: 120, height: 60 });
        const one = authoredDefaultSize({ width: 120, height: -1 });
        expect(one).toEqual({ width: 120 });
        expect('height' in (one as object)).toBe(false);
    });
});

describe('defaultBoxFor', () => {
    const derived = { w: 150, h: 48 };

    it('both axes set: the default box, whatever the content says', () => {
        expect(defaultBoxFor({ width: 120, height: 60 }, derived, false)).toEqual({ w: 120, h: 60 });
    });

    it('one axis set: the other stays derived from content', () => {
        expect(defaultBoxFor({ width: 120 }, derived, false)).toEqual({ w: 120, h: 48 });
        expect(defaultBoxFor({ height: 60 }, derived, false)).toEqual({ w: 150, h: 60 });
    });

    it('below the resize floor: drawn as authored, no floor on a declared axis (P-2026-09-30-1720)', () => {
        expect(defaultBoxFor({ width: 3, height: 10 }, derived, false)).toEqual({ w: 3, h: 10 });
        expect(defaultBoxFor({ width: 5, height: 120 }, derived, false)).toEqual({ w: 5, h: 120 });
        expect(defaultBoxFor({ width: 23 }, derived, false)).toEqual({ w: 23, h: 48 });
        // Below the rect's derivation floor (140x40) is legal: an explicit size is not held to it.
        expect(defaultBoxFor({ width: 100, height: 30 }, derived, false)).toEqual({ w: 100, h: 30 });
    });

    it('the hand-resize floor stays 24: native nodes and views without a size never reach defaultBoxFor', () => {
        // ObjectNode's NodeResizer (minWidth / minHeight) is the only reader left.
        expect(SHAPE_MIN_SIZE).toBe(24);
    });

    it('a fixed-aspect form (circle) is squared on the larger authored axis', () => {
        const circle = getShapeDescriptor('circle');
        expect(circle.keepAspectRatio).toBe(true);
        expect(defaultBoxFor({ width: 100, height: 60 }, derived, circle.keepAspectRatio)).toEqual({ w: 100, h: 100 });
        // One axis on a circle: the authored side wins over the derived one.
        expect(defaultBoxFor({ width: 100 }, { w: 150, h: 150 }, true)).toEqual({ w: 100, h: 100 });
        expect(defaultBoxFor({ height: 10 }, { w: 150, h: 150 }, true)).toEqual({ w: 10, h: 10 });
        expect(defaultBoxFor({ width: 20, height: 20 }, { w: 150, h: 150 }, true)).toEqual({ w: 20, h: 20 });
    });
});

describe('sizeSourceOf: who owns the box of an IR vertex', () => {
    const rect = hasSizeSupplement(getShapeDescriptor('rect'));
    const ellipse = hasSizeSupplement(getShapeDescriptor('ellipse'));
    const defaults = { width: 120, height: 60 };

    it('an instance with no manual size takes the default, on any form', () => {
        expect(rect).toBe(false);
        expect(ellipse).toBe(true);
        expect(sizeSourceOf(false, rect, defaults)).toBe('default');
        expect(sizeSourceOf(false, ellipse, defaults)).toBe('default');
    });

    it('a manually resized instance keeps its size: the manual size beats the default', () => {
        expect(sizeSourceOf(true, rect, defaults)).toBe('manual');
        expect(sizeSourceOf(true, ellipse, defaults)).toBe('manual');
    });

    it('with no default nothing changes: derived on a supplement form, CSS content-hug otherwise', () => {
        expect(sizeSourceOf(false, ellipse, undefined)).toBe('derived');
        expect(sizeSourceOf(false, rect, undefined)).toBeNull();
        expect(sizeSourceOf(true, rect, undefined)).toBe('manual');
    });
});

// ---------------------------------------------------------------------------
// The declared sizes of the derived notations (P-2026-09-30-1720,
// docs/discovery/discovery_2026-09-30_activity_sizes.md): Activity (UML) on DemoFlowB and
// Petri net (classic) on DemoPetri, their binding applied as the demos configure it
// (the builder of derive/__tests__/activityUml.test.ts, cut to what these documents read).
// ---------------------------------------------------------------------------

type Lookup = Record<string, any>;
interface Cls { name: string; supers?: string[]; attrs?: [string, string][]; refs?: [string, string, boolean?, number?][] }

function demo(tag: string, name: string, profileId: string, classes: Cls[]): { id: string; lookup: Lookup } {
    const lookup: Lookup = {};
    const id = (n: string) => `${tag}.${n}`;
    lookup[tag] = { className: 'DModel', name, isMetamodel: true, packages: [`${tag}.pkg`], classes: [] };
    lookup[`${tag}.pkg`] = { className: 'DPackage', name: 'default', classes: classes.map(c => id(c.name)), subpackages: [] };
    for (const c of classes) {
        const cid = id(c.name);
        lookup[cid] = {
            className: 'DClass', name: c.name, abstract: false, extends: (c.supers ?? []).map(id),
            attributes: (c.attrs ?? []).map(([a]) => `${cid}.${a}`), references: (c.refs ?? []).map(([r]) => `${cid}.${r}`),
        };
        for (const [a, type] of c.attrs ?? []) lookup[`${cid}.${a}`] = { className: 'DAttribute', name: a, type, upperBound: 1 };
        for (const [r, type, composition, upper] of c.refs ?? []) {
            lookup[`${cid}.${r}`] = { className: 'DReference', name: r, type: id(type), composition: !!composition, aggregation: false, upperBound: upper ?? 1 };
        }
    }
    const bindings = bindProfile(systemProfile(profileId)!, sketchOfMetamodel(lookup, tag));
    const bag: Record<string, unknown> = { simProfile: profileId };
    for (const d of ROLE_CATALOG) {
        const b = bindings[d.id];
        if (d.key && b?.status === 'bound') bag[d.key] = b.value;
    }
    lookup[tag]._state = bag;
    return { id: tag, lookup };
}

const FLOWB = () => demo('FLOWB', 'DemoFlowB', 'flowchart', [
    { name: 'ActivityNode' },
    ...['InitialNode', 'Activity', 'Decision', 'Fork', 'Join', 'FinalNode'].map(name => ({ name, supers: ['ActivityNode'] })),
    { name: 'ControlFlow', attrs: [['guard', 'Pointer_EXPRESSION']], refs: [['source', 'ActivityNode'], ['target', 'ActivityNode']] },
]);
const PETRI = () => demo('PETRI', 'DemoPetri', 'petri', [
    { name: 'PNode' },
    { name: 'Place', supers: ['PNode'], attrs: [['tokens', 'Pointer_EINT']] },
    { name: 'Transition', supers: ['PNode'], attrs: [['guard', 'Pointer_EXPRESSION']] },
    { name: 'Arc', attrs: [['weight', 'Pointer_EINT']], refs: [['src', 'PNode'], ['tgt', 'PNode']] },
    { name: 'InhibitorArc', supers: ['Arc'] },
]);
const PEST = () => demo('PEST', 'DemoPEST', 'stateMachine', [
    { name: 'State', refs: [['transitions', 'Transition', true, -1]] },
    { name: 'Initial', supers: ['State'] }, { name: 'Terminal', supers: ['State'] },
    { name: 'Transition', refs: [['nextState', 'State'], ['event', 'Event']] },
    { name: 'Event' },
]);

/** The notation each demo opens on (R-VP-24, R-VP-26): Activity (UML), Petri net (classic). */
const opened = (mm: { id: string; lookup: Lookup }) => derivedDocuments(mm.lookup, mm.id, defaultChoice(mm.lookup, mm.id, []));
const irOf = (views: AnyDerivedView[], name: string) => views.find(v => v.className === name && v.ir.kind === 'vertex')!.ir as any;
/** What the content hook writes for a view with a default: the RF node box (useContentSize.ts). */
const CONTENT = { w: 142, h: 48 };
const nodeBox = (ir: any) => defaultBoxFor(authoredDefaultSize(ir.defaultSize)!, CONTENT, getShapeDescriptor(ir.shape.form).keepAspectRatio);
/** The painted box: the wrapper keeps a transparent 1 px border (irStyle.ts), as A2 measured on the place (44, 42). */
const painted = (b: { w: number; h: number }) => ({ w: b.w - 2, h: b.h - 2 });

describe('Activity (UML) on DemoFlowB: the declared sizes draw as declared', () => {
    const views = opened(FLOWB());

    it('fork and join: the bar node 120x7 across the flow that runs down (Q7, P-2026-10-01-2215), painted 118x5, no 24 px floor', () => {
        for (const name of ['Fork', 'Join']) {
            expect(nodeBox(irOf(views, name)), name).toEqual({ w: 120, h: 7 });
            expect(painted(nodeBox(irOf(views, name))), name).toEqual({ w: 118, h: 5 });
        }
    });

    it('the initial dot: 20x20', () => {
        expect(nodeBox(irOf(views, 'InitialNode'))).toEqual({ w: 20, h: 20 });
    });

    it('the bull\'s-eye: 24x24, its own marker a 14 px disc', () => {
        const ir = irOf(views, 'FinalNode');
        const box = nodeBox(ir);
        expect(box).toEqual({ w: 24, h: 24 });
        // The marker layer spans the padding box: painted less the circle's own border.
        const markerBox = painted(box).w - 2 * ir.shape.border.width;
        const r = Number(/A([\d.]+),/.exec(getMarkerDef(ir.shape.marker)!.paths[0].d)![1]);
        expect(2 * r / 100 * markerBox).toBeCloseTo(14, 6);
    });

    it('an action: 44 high, radius 14 on its painted box (the clamp at half the side)', () => {
        for (const name of ['Activity', 'ActivityNode']) {
            const ir = irOf(views, name);
            const box = nodeBox(ir);
            expect(box, name).toEqual({ w: CONTENT.w, h: 44 });
            expect(resolveCornerRadius(ir.shape.form, ir.shape.cornerRadius, painted(box)), name).toEqual({ kind: 'css', px: 14 });
        }
    });

    it('the decision: 36x36, unchanged', () => {
        expect(nodeBox(irOf(views, 'Decision'))).toEqual({ w: 36, h: 36 });
    });
});

describe('Petri net (classic) on DemoPetri: the declared sizes draw as declared', () => {
    const views = opened(PETRI());

    it('the transition bar: 10x44, no 24 px floor', () => {
        expect(nodeBox(irOf(views, 'Transition'))).toEqual({ w: 10, h: 44 });
    });

    it('the place: 44x44, unchanged', () => {
        expect(nodeBox(irOf(views, 'Place'))).toEqual({ w: 44, h: 44 });
    });
});

describe('what the three limits reach among the derived documents', () => {
    it('only Activity (UML) and Petri net (classic) declare a size or a radius: every other view keeps its box', () => {
        const got = new Set<string>();
        for (const make of [PEST, PETRI, FLOWB]) {
            const mm = make();
            for (const n of DERIVED_NOTATIONS) {
                const roles = dialogPrefill(mm.lookup, mm.id, n.id, []).roles;
                for (const v of derivedDocuments(mm.lookup, mm.id, { notation: n.id, classRoles: roles })) {
                    const ir = v.ir as any;
                    if (ir.kind !== 'vertex') continue;
                    if (authoredDefaultSize(ir.defaultSize) === undefined && ir.shape.cornerRadius === undefined) continue;
                    got.add(n.id);
                }
            }
        }
        expect([...got].sort()).toEqual(['activityUml', 'petriClassic']);
    });
});
