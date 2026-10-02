/**
 * Notation glyphs out of «Color by metaclass» (P-2026-10-02-2045, R-VP-50,
 * docs/discovery/discovery_2026-10-02_vp_glyph_nocolor.md).
 *
 * `isNotationGlyph` decides which derived vertex views draw a notation glyph (a bar, an ink-filled
 * circle, a bull's-eye); `notationGlyphClasses` lists the classes a viewpoint draws only as glyphs,
 * for the panel. Both live in `metaclassPalette.ts`, which imports nothing, so this bench EXECUTES
 * them (CLAUDE.md §5), here on the real derivation of the four demos under the nine notations.
 *
 * The four demos are activityUml.test.ts's (the builder and the bags), with the `father` links the
 * colour resolver climbs. The colour tables pinned below were printed on the code of `1ff8ab314`
 * (gitignored `_tmp_vpglyph_tables.ts`), before this lane touched the module.
 */

import { describe, expect, it } from 'vitest';
import {
    isNotationGlyph,
    metaclassColorTable,
    notationGlyphClasses,
    readMetaclassColoring,
    resolveMetaclassColoring,
} from '../metaclassPalette';
import { DERIVED_NOTATIONS, derivedDocuments, dialogPrefill } from '../../../components/editor-v2/viewpoint/derive/notations';
import type { DerivedNotationId } from '../../../components/editor-v2/viewpoint/derive/notations';
import type { AnyDerivedView } from '../../../components/editor-v2/viewpoint/derive/viewpointDerivation';
import { sketchOfMetamodel } from '../../../components/editor-v2/sim/metamodelSketch';
import { bindProfile } from '../../../model/simulation/profileBinder';
import { systemProfile } from '../../../model/simulation/simProfiles';
import { ROLE_CATALOG } from '../../../model/simulation/roleCatalog';

// ---------------------------------------------------------------------------
// Fixtures (activityUml.test.ts's builder and demos, with the father links)
// ---------------------------------------------------------------------------

type Lookup = Record<string, any>;

const EINT = 'Pointer_EINT';
const ESTRING = 'Pointer_ESTRING';
const EXPRESSION = 'Pointer_EXPRESSION';
const ACTION = 'Pointer_ACTION';

interface AttrDef { name: string; type: string; upper: number }
interface RefDef { name: string; type: string; composition: boolean; upper: number }
interface ClsDef { name: string; abstract?: boolean; supers?: string[]; attrs?: AttrDef[]; refs?: RefDef[] }
interface Fixture { id: string; lookup: Lookup; classId(name: string): string }

const attr = (name: string, type: string, upper = 1): AttrDef => ({ name, type, upper });
const ref = (name: string, type: string, opts: { composition?: boolean; upper?: number } = {}): RefDef =>
    ({ name, type, composition: !!opts.composition, upper: opts.upper ?? 1 });
const cls = (name: string, def: Omit<ClsDef, 'name'> = {}): ClsDef => ({ name, ...def });

function metamodel(tag: string, name: string, classes: ClsDef[]): Fixture {
    const lookup: Lookup = {};
    const classId = (n: string) => `${tag}.${n}`;
    lookup[tag] = { id: tag, className: 'DModel', name, isMetamodel: true, packages: [`${tag}.pkg`], classes: [] };
    lookup[`${tag}.pkg`] = { id: `${tag}.pkg`, className: 'DPackage', name: 'default', father: tag, classes: classes.map(c => classId(c.name)), subpackages: [] };
    for (const c of classes) {
        const id = classId(c.name);
        lookup[id] = {
            id, className: 'DClass', name: c.name, father: `${tag}.pkg`, abstract: !!c.abstract, extends: (c.supers ?? []).map(classId),
            attributes: (c.attrs ?? []).map(a => `${id}.${a.name}`), references: (c.refs ?? []).map(r => `${id}.${r.name}`),
        };
        for (const a of c.attrs ?? []) lookup[`${id}.${a.name}`] = { className: 'DAttribute', name: a.name, type: a.type, upperBound: a.upper };
        for (const r of c.refs ?? []) {
            lookup[`${id}.${r.name}`] = {
                className: 'DReference', name: r.name, type: classId(r.type), composition: r.composition, aggregation: false, upperBound: r.upper,
            };
        }
    }
    return { id: tag, lookup, classId };
}

const DEMOS: Record<string, { make: () => Fixture; profile: string }> = {
    DemoPEST: {
        profile: 'stateMachine',
        make: () => metamodel('PEST', 'DemoPEST', [
            cls('State', { refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
            cls('Initial', { supers: ['State'] }),
            cls('Terminal', { supers: ['State'] }),
            cls('Transition', { refs: [ref('nextState', 'State'), ref('event', 'Event')] }),
            cls('Event'),
        ]),
    },
    DemoPetri: {
        profile: 'petri',
        make: () => metamodel('PETRI', 'DemoPetri', [
            cls('PNode', { abstract: true }),
            cls('Place', { supers: ['PNode'], attrs: [attr('tokens', EINT)] }),
            cls('Transition', { supers: ['PNode'], attrs: [attr('guard', EXPRESSION)] }),
            cls('Arc', { attrs: [attr('weight', EINT)], refs: [ref('src', 'PNode'), ref('tgt', 'PNode')] }),
            cls('InhibitorArc', { supers: ['Arc'] }),
        ]),
    },
    DemoESM: {
        profile: 'extendedStateMachine',
        make: () => metamodel('ESM', 'DemoESM', [
            cls('State', { attrs: [attr('entry', ACTION, -1)], refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
            cls('Initial', { supers: ['State'] }),
            cls('Terminal', { supers: ['State'] }),
            cls('Transition', { attrs: [attr('guard', EXPRESSION), attr('effect', ACTION, -1)], refs: [ref('nextState', 'State'), ref('event', 'Event')] }),
            cls('Event', { attrs: [attr('name', ESTRING)] }),
        ]),
    },
    DemoFlowB: {
        profile: 'flowchart',
        make: () => metamodel('FLOWB', 'DemoFlowB', [
            cls('ActivityNode'),
            cls('InitialNode', { supers: ['ActivityNode'] }),
            cls('Activity', { supers: ['ActivityNode'] }),
            cls('Decision', { supers: ['ActivityNode'] }),
            cls('Fork', { supers: ['ActivityNode'] }),
            cls('Join', { supers: ['ActivityNode'] }),
            cls('FinalNode', { supers: ['ActivityNode'] }),
            cls('ControlFlow', { attrs: [attr('guard', EXPRESSION), attr('effect', ACTION, -1)], refs: [ref('source', 'ActivityNode'), ref('target', 'ActivityNode')] }),
        ]),
    },
};

/** The demo with the bag the Simulation roles dialog's Apply writes. */
function configured(demo: string): Fixture {
    const { make, profile } = DEMOS[demo];
    const mm = make();
    const bindings = bindProfile(systemProfile(profile)!, sketchOfMetamodel(mm.lookup, mm.id));
    const bag: Record<string, unknown> = { simProfile: profile };
    for (const d of ROLE_CATALOG) {
        const b = bindings[d.id];
        if (d.key && b?.status === 'bound') bag[d.key] = b.value;
    }
    mm.lookup[mm.id]._state = bag;
    return mm;
}

/** The documents of `notation` with its own prefill, each with its provenance, as «Derive viewpoint» creates them. */
const derivedWith = (mm: Fixture, notation: DerivedNotationId): AnyDerivedView[] =>
    derivedDocuments(mm.lookup, mm.id, { notation, classRoles: dialogPrefill(mm.lookup, mm.id, notation, []).roles });

/**
 * A store holding the derived documents as the views of viewpoint `vpId` (as `createDerivedViewpoint`
 * writes them: `viewpoint`, `ir`), listed in `viewelements` as the resolver's index reads them.
 */
function storeWith(mm: Fixture, notation: DerivedNotationId, vpId: string, coloring?: object) {
    const idlookup: Lookup = { ...mm.lookup, [vpId]: { id: vpId, className: 'DViewPoint', ...(coloring ? { metaclassColoring: coloring } : {}) } };
    const viewelements: string[] = [];
    derivedWith(mm, notation).forEach((v, i) => {
        const id = `${vpId}.view${i}`;
        idlookup[id] = { id, className: 'DViewElement', viewpoint: vpId, ir: v.ir };
        viewelements.push(id);
    });
    return { viewpoint: vpId, idlookup, viewelements };
}

// ---------------------------------------------------------------------------
// isNotationGlyph
// ---------------------------------------------------------------------------

/**
 * Every derived bar and circle of the four demos, measured by the Phase 1 enumeration (report §3), less
 * the two Petri places: the white circle with no marker and the one with the conditional token marker.
 */
const EXPECTED_GLYPHS = [
    'DemoPEST/stateMachine/Initial', 'DemoPEST/petri/Terminal', 'DemoPEST/petriClassic/Terminal',
    'DemoPEST/flowchart/Initial', 'DemoPEST/flowchart/Terminal', 'DemoPEST/activityUml/Initial', 'DemoPEST/activityUml/Terminal',
    'DemoPetri/petri/Transition', 'DemoPetri/petriClassic/Transition',
    'DemoESM/stateMachine/Initial', 'DemoESM/petri/Terminal', 'DemoESM/petriClassic/Terminal',
    'DemoESM/flowchart/Initial', 'DemoESM/flowchart/Terminal', 'DemoESM/activityUml/Initial', 'DemoESM/activityUml/Terminal',
    'DemoFlowB/stateMachine/InitialNode', 'DemoFlowB/stateMachine/FinalNode', 'DemoFlowB/petri/FinalNode', 'DemoFlowB/petriClassic/FinalNode',
    'DemoFlowB/flowchart/InitialNode', 'DemoFlowB/flowchart/Fork', 'DemoFlowB/flowchart/Join', 'DemoFlowB/flowchart/FinalNode',
    'DemoFlowB/activityUml/InitialNode', 'DemoFlowB/activityUml/Fork', 'DemoFlowB/activityUml/Join', 'DemoFlowB/activityUml/FinalNode',
];

describe('isNotationGlyph on the derived documents of the four demos under the nine notations', () => {
    const all: { key: string; ir: any }[] = [];
    for (const demo of Object.keys(DEMOS)) {
        for (const n of DERIVED_NOTATIONS) {
            for (const v of derivedWith(configured(demo), n.id)) all.push({ key: `${demo}/${n.id}/${v.className}`, ir: v.ir });
        }
    }

    it('positive control: the documents are there, every one with its provenance', () => {
        expect(all.length).toBeGreaterThan(150);
        expect(all.every(d => !!d.ir.generated)).toBe(true);
        expect(all.filter(d => d.ir.kind === 'vertex').length).toBeGreaterThan(100);
    });

    it('picks exactly the bars, the ink discs and the bull\'s-eyes, and nothing else', () => {
        const got = all.filter(d => isNotationGlyph(d.ir)).map(d => d.key).sort();
        expect(got).toEqual([...EXPECTED_GLYPHS].sort());
    });

    it('the Activity (UML) glyphs of DemoFlowB: the initial disc, the fork and join bars, the final bull\'s-eye', () => {
        const docs = derivedWith(configured('DemoFlowB'), 'activityUml').filter(v => v.ir.kind === 'vertex');
        const by = Object.fromEntries(docs.map(v => [v.className, isNotationGlyph(v.ir)]));
        expect(by).toEqual({ InitialNode: true, Activity: false, Decision: false, Fork: true, Join: true, FinalNode: true, ActivityNode: false });
    });

    it('the Petri transitions are glyphs, the places are not (R-VP-16 and R-VP-24)', () => {
        for (const notation of ['petri', 'petriClassic'] as const) {
            const by = Object.fromEntries(derivedWith(configured('DemoPetri'), notation)
                .filter(v => v.ir.kind === 'vertex').map(v => [v.className, isNotationGlyph(v.ir)]));
            expect(by, notation).toEqual({ Place: false, Transition: true });
        }
    });

    it('Statechart (UML) on DemoPEST draws no glyph node: the Initial is a box with the entry mark', () => {
        const docs = derivedWith(configured('DemoPEST'), 'statechart').filter(v => v.ir.kind === 'vertex');
        expect(docs.map(v => v.className).sort()).toEqual(['Event', 'Initial', 'State', 'Terminal']);
        expect(docs.some(v => isNotationGlyph(v.ir))).toBe(false);
        expect((docs.find(v => v.className === 'Initial')!.ir as any).shape.entry).toBe('dot');
    });
});

describe('isNotationGlyph, the boundary of the rule', () => {
    const generated = { by: 'derive-2', notation: 'activityUml', hash: 'h' };
    const vertex = (shape: object, withProvenance = true) => ({ kind: 'vertex', ...(withProvenance ? { generated } : {}), shape });

    it('a view written by hand (no provenance) is never a glyph, even drawn as one', () => {
        expect(isNotationGlyph(vertex({ form: 'bar', fill: 'var(--color-inode-name)' }, false))).toBe(false);
        expect(isNotationGlyph(vertex({ form: 'circle', fill: '#334155' }, false))).toBe(false);
        expect(isNotationGlyph(vertex({ form: 'circle', marker: 'dot-large' }, false))).toBe(false);
        // and the same shapes derived are
        expect(isNotationGlyph(vertex({ form: 'bar', fill: 'var(--color-inode-name)' }))).toBe(true);
    });

    it('a bar is a glyph whatever its fill (a derived bar the user recoloured keeps the user\'s fill)', () => {
        expect(isNotationGlyph(vertex({ form: 'bar', fill: '#ff0000' }))).toBe(true);
    });

    it('a circle is a glyph only filled in an ink or carrying the dot / dot-large marker', () => {
        expect(isNotationGlyph(vertex({ form: 'circle', fill: 'var(--color-inode-name)' }))).toBe(true);
        expect(isNotationGlyph(vertex({ form: 'circle', fill: '#334155' }))).toBe(true);
        expect(isNotationGlyph(vertex({ form: 'circle', fill: 'var(--color-inode-surface)', marker: 'dot' }))).toBe(true);
        expect(isNotationGlyph(vertex({ form: 'circle', fill: 'var(--color-inode-surface)', marker: 'dot-large' }))).toBe(true);
        expect(isNotationGlyph(vertex({ form: 'circle', fill: 'var(--color-inode-surface)' }))).toBe(false);
        expect(isNotationGlyph(vertex({ form: 'circle', fill: 'var(--color-inode-surface)', marker: 'dots-2' }))).toBe(false);
        expect(isNotationGlyph(vertex({ form: 'circle', marker: { rules: [], default: 'dot' } }))).toBe(false);
    });

    it('only the bar and the circle: a box or a diamond in the ink, or with a dot, stays coloured', () => {
        expect(isNotationGlyph(vertex({ form: 'rect', fill: '#334155' }))).toBe(false);
        expect(isNotationGlyph(vertex({ form: 'rounded', fill: 'var(--color-inode-name)' }))).toBe(false);
        expect(isNotationGlyph(vertex({ form: 'diamond', marker: 'dot' }))).toBe(false);
    });

    it('nothing, or a view with no shape, is not a glyph', () => {
        expect(isNotationGlyph(null)).toBe(false);
        expect(isNotationGlyph(undefined)).toBe(false);
        expect(isNotationGlyph({ kind: 'edge', generated })).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// notationGlyphClasses (the panel's rows)
// ---------------------------------------------------------------------------

describe('notationGlyphClasses: the classes a viewpoint draws only as glyphs', () => {
    it('DemoFlowB derived as Activity (UML): InitialNode, Fork, Join, FinalNode', () => {
        const mm = configured('DemoFlowB');
        const state = storeWith(mm, 'activityUml', 'vp_act');
        expect([...notationGlyphClasses(state, 'vp_act')].sort())
            .toEqual(['FinalNode', 'Fork', 'InitialNode', 'Join'].map(mm.classId).sort());
    });

    it('another viewpoint\'s views do not count, and an unknown or absent viewpoint has none', () => {
        const mm = configured('DemoFlowB');
        const state = storeWith(mm, 'activityUml', 'vp_act');
        expect(notationGlyphClasses(state, 'vp_other')).toEqual([]);
        expect(notationGlyphClasses(state, null)).toEqual([]);
        expect(notationGlyphClasses(null, 'vp_act')).toEqual([]);
    });

    it('DemoPEST derived as Statechart (UML) has none; as Flowchart its Initial and Terminal', () => {
        const mm = configured('DemoPEST');
        expect(notationGlyphClasses(storeWith(mm, 'statechart', 'vp_sc'), 'vp_sc')).toEqual([]);
        expect([...notationGlyphClasses(storeWith(mm, 'flowchart', 'vp_fc'), 'vp_fc')].sort())
            .toEqual(['Initial', 'Terminal'].map(mm.classId).sort());
    });

    it('a class with a glyph view and another node view in the same viewpoint is not a glyph class', () => {
        const mm = configured('DemoFlowB');
        const state = storeWith(mm, 'activityUml', 'vp_act');
        const fork = mm.classId('Fork');
        state.idlookup['vp_act.extra'] = {
            id: 'vp_act.extra', className: 'DViewElement', viewpoint: 'vp_act',
            ir: { irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Fork'], authoringMetaclassPins: { Fork: fork }, shape: { form: 'rounded' } },
        };
        state.viewelements.push('vp_act.extra');
        expect(notationGlyphClasses(state, 'vp_act')).not.toContain(fork);
        expect(notationGlyphClasses(state, 'vp_act')).toContain(mm.classId('Join'));
    });

    it('an edge view of the same class does not disqualify it: edges are never coloured (R-VP-31)', () => {
        const mm = configured('DemoFlowB');
        const state = storeWith(mm, 'activityUml', 'vp_act');
        const join = mm.classId('Join');
        state.idlookup['vp_act.edge'] = {
            id: 'vp_act.edge', className: 'DViewElement', viewpoint: 'vp_act',
            ir: { irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Join'], authoringMetaclassPins: { Join: join }, edge: {} },
        };
        state.viewelements.push('vp_act.edge');
        expect(notationGlyphClasses(state, 'vp_act')).toContain(join);
    });
});

// ---------------------------------------------------------------------------
// The palette does not move (report §4, Q3 and Q4)
// ---------------------------------------------------------------------------

/** Printed on the code of 1ff8ab314: the default base, Border on, no override. */
const TABLES_AT_1FF8AB314: Record<string, Record<string, string>> = {
    DemoPEST: { State: '#cbdef0', Initial: '#f3dfcb', Terminal: '#f3cbcb', Transition: '#ededc0', Event: '#b2b2f1' },
    DemoPetri: { PNode: '#cbdef0', Place: '#f3dfcb', Transition: '#f3cbcb', Arc: '#ededc0', InhibitorArc: '#b2b2f1' },
    DemoESM: { State: '#cbdef0', Initial: '#f3dfcb', Terminal: '#f3cbcb', Transition: '#ededc0', Event: '#b2b2f1' },
    DemoFlowB: {
        ActivityNode: '#cbdef0', InitialNode: '#f3dfcb', Activity: '#f3cbcb', Decision: '#ededc0', Fork: '#ebbad2', Join: '#d5f2b8',
        FinalNode: '#eeb5ee', ControlFlow: '#b2f1b2',
    },
};

describe('glyph classes keep their palette slot: no other class changes colour', () => {
    const SETTING = readMetaclassColoring({ metaclassColoring: { enabled: true } });

    for (const [demo, expected] of Object.entries(TABLES_AT_1FF8AB314)) {
        it(`${demo}: the table and the resolver equal the colours of 1ff8ab314, glyph classes included`, () => {
            const mm = configured(demo);
            const notation: DerivedNotationId = demo === 'DemoPetri' ? 'petriClassic' : demo === 'DemoFlowB' ? 'activityUml' : 'flowchart';
            const state = storeWith(mm, notation, 'vp', { enabled: true });
            const table = metaclassColorTable(state.idlookup, [mm.id], SETTING);
            expect(Object.fromEntries(table[0].classes.map(c => [c.name, c.color]))).toEqual(expected);
            for (const c of table[0].classes) expect(resolveMetaclassColoring(state, c.id)?.fill, c.name).toBe(expected[c.name]);
            // the glyph classes of that viewpoint are among them, and keep theirs
            expect(notationGlyphClasses(state, 'vp').length).toBeGreaterThan(0);
        });
    }
});
