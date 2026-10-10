/**
 * graphVertex authoring (P-2026-10-10-1156, slice S4): the panel's state functions, driven from the creation seed to
 * the IR of the BPMN views of the discovery report §G2 (and of the spec addendum 2026-10-10 §10, which is §G2 with the
 * leaf lane filtered to FlowNode).
 *
 * Executed, not read (CLAUDE.md §5, P11): every step below is a function the panel or one of its sections calls on a
 * user edit. The panel itself imports the joiner barrel (Monaco at import), so its writes live in
 * `graphVertexAuthoring.ts` and the label mappers in `LabelEntryEditor.tsx`, both import-safe here. The two writes of
 * the shared MatchingSection (priority, predicate) are its own inline spreads, repeated here as written there; the
 * PathBuilder's output is produced by its own emitter, `pathExprFromSelection`.
 */
import { describe, expect, it } from 'vitest';
import { computeCreationSeed, graphVertexSeedIR } from '../../ir/irCreationSeed';
import { convertIRKind } from '../../ir/irKindConvert';
import { validateIR } from '../../ir/irValidate';
import { pathExprFromSelection } from '../../../../ui/PathBuilder/pathExpr';
import { applyLabelOrientation, applyLabelPositionValue } from '../LabelEntryEditor';
import {
    admittedMembershipModes, channelExpr, channelFacts, channelHops, wholeListHop, withBorderAxis, withChannel,
    withChannelEdges, withChannelStep, withChildFilter, withCollapsedForm, withCollapsedKey, withCollapsible,
    withDefaultSizeAxis, withHeaderSide, withHeaderSize, withLayoutAxis, withLayoutMode, withLayoutPadding,
    withMembershipCreate, withMembershipMode, withShape, withVisible, withoutCornerRadius, withoutLastChannelStep,
    type ChannelClass,
} from '../graphVertexAuthoring';
import type { GraphVertexViewIR, LabelSpec, Predicate, VertexViewIR } from '../../ir/irTypes';

// ── The OMG BPMN metamodel fragment of the discovery report §G1, as the panel's checks read it ──────────────────

const ref = (name: string, target: string, containment: boolean, upperBound = -1) =>
    ({ name, targetClassId: `c_${target}`, targetClassName: target, containment, upperBound });
const CLASSES: ChannelClass[] = [
    { id: 'c_Participant', name: 'Participant', references: [ref('processRef', 'Process', false, 1)] },
    { id: 'c_Process', name: 'Process', references: [ref('flowElements', 'FlowElement', true), ref('laneSets', 'LaneSet', true)] },
    { id: 'c_LaneSet', name: 'LaneSet', references: [ref('lanes', 'Lane', true)] },
    { id: 'c_Lane', name: 'Lane', references: [ref('flowNodeRefs', 'FlowNode', false), ref('childLaneSet', 'LaneSet', true, 1)] },
    { id: 'c_FlowNode', name: 'FlowNode', references: [] },
    { id: 'c_FlowElement', name: 'FlowElement', references: [] },
];
const byId = (id: string) => CLASSES.find(c => c.id === id) ?? null;
const byName = (name: string) => CLASSES.find(c => c.name === name) ?? null;

// ── The oracles ──────────────────────────────────────────────────────────────────────────────────────────────────

const HEADER_LABEL: LabelSpec = { position: 'header', orientation: 'vertical', source: { from: 'intrinsic', prop: 'name' } };

/** Discovery report §G2, leaf Lane, verbatim. */
const G2_LEAF_LANE: GraphVertexViewIR = {
    irVersion: 'ir-1.2', kind: 'graphVertex', metaclasses: ['Lane'], exclusive: true, label: 'Lane',
    shape: { form: 'rect', fill: '#ffffff', border: { width: 1 }, labels: [HEADER_LABEL] },
    containment: {
        children: '$flowNodeRefs.values',
        layout: { mode: 'free', header: { side: 'w', size: 30 } },
        membership: { mode: 'reference', create: { ownerKind: 'Process', feature: 'flowElements' } },
        edges: 'hide',
        collapsible: false,
    },
};
/** Spec addendum §10 / `BPMN_VIEWS.V_lane` of ir.test.ts / the S2 fixture: §G2 with the channel filtered to FlowNode. */
const ADDENDUM_LEAF_LANE: GraphVertexViewIR = {
    ...G2_LEAF_LANE,
    containment: { ...G2_LEAF_LANE.containment, childFilter: { op: 'isKind', class: 'FlowNode' } },
};
/** Discovery report §G2, Pool with lanes, verbatim (identical in the addendum §10). */
const G2_POOL_WITH_LANES: GraphVertexViewIR = {
    irVersion: 'ir-1.2', kind: 'graphVertex', metaclasses: ['Participant'], exclusive: true, label: 'Pool with lanes',
    priority: 1,
    predicate: { op: 'not', arg: { op: 'empty', path: '$processRef.value.$laneSets.values' } },
    shape: { form: 'rect', fill: '#ffffff', border: { width: 1.5 }, labels: [HEADER_LABEL] },
    containment: {
        children: '$processRef.value.$laneSets.values[0].$lanes.values',
        childFilter: { op: 'isKind', class: 'Lane' },
        layout: { mode: 'partitions', axis: 'vertical', header: { side: 'w', size: 30 } },
        membership: { mode: 'forbid' },
        edges: 'hide',
        collapsible: false,
    },
};

/** The IR as persisted: JSON, so a key holding `undefined` is no key (the commit writes the whole object). */
const persisted = <T,>(ir: T): T => JSON.parse(JSON.stringify(ir));

// ── The gestures, as the panel performs them ─────────────────────────────────────────────────────────────────────

/** Create a view on `metaclass` (the DClass branch of createViewInWorkbench / newDefault), then pick graphVertex in
 *  the Kind selector (irTabs IRIdentityFields.changeKind). */
function createThenPickGraphVertex(metaclass: string): GraphVertexViewIR {
    const created = computeCreationSeed({ kind: 'vertex', metaclassName: metaclass, label: `View for ${metaclass}` });
    expect(created?.kind).toBe('vertex');
    const { ir } = convertIRKind(created!, 'graphVertex', undefined);
    expect(ir.kind).toBe('graphVertex');
    return ir as GraphVertexViewIR;
}

/** PathBuilder on step i: pick the feature (take resets to value), then the take. */
function pickStep(ir: GraphVertexViewIR, i: number, feature: string, take: 'value' | 'values' | number): GraphVertexViewIR {
    const root = byName((ir.metaclasses as string[])[0]);
    let d = withChannelStep(ir, i, pathExprFromSelection({ feature, take: 'value' }), root, byId);
    if (take === 'values') d = withChannelStep(d, i, pathExprFromSelection({ feature, take: 'values' }), root, byId);
    if (typeof take === 'number') d = withChannelStep(d, i, pathExprFromSelection({ feature, take: 'valuesAt', index: take }), root, byId);
    return d;
}

/** Text tab: label 0 moved into the header band, read bottom to top (LabelListEditor → LabelEntryEditor). */
function headerLabel(ir: GraphVertexViewIR): GraphVertexViewIR {
    const [first, ...rest] = ir.shape.labels ?? [];
    const moved = applyLabelOrientation(applyLabelPositionValue(first, 'header'), 'vertical');
    return withShape(ir, { labels: [moved, ...rest] });
}

function fillLeafLane(filtered: boolean): GraphVertexViewIR {
    let d = createThenPickGraphVertex('Lane');
    d = { ...d, label: 'Lane' };                                          // Text · General · Label
    d = withShape(d, { fill: '#ffffff' });                               // Appearance · Fill
    d = withBorderAxis(d, 'width', 1);                                   // Appearance · Border · Width
    d = withHeaderSide(d, 'w');                                          // Structure · Header band (Advanced)
    d = headerLabel(d);                                                  // Text · Labels
    d = pickStep(d, 0, 'flowNodeRefs', 'values');                        // Structure · Children (Basic)
    if (filtered) d = withChildFilter(d, { op: 'isKind', class: 'FlowNode' }); // Structure · Filter (Advanced)
    d = withMembershipMode(d, 'reference');                              // Structure · Membership (Advanced)
    d = withMembershipCreate(d, { ownerKind: 'Process' });
    d = withMembershipCreate(d, { feature: 'flowElements' });
    d = withCollapsible(d, false);                                       // Structure · Collapsible (Advanced)
    return d;
}

describe('leaf Lane: create a view on Lane, pick graphVertex, fill the panel', () => {
    it('writes the discovery report §G2 JSON, deep-equal', () => {
        const d = fillLeafLane(false);
        expect(persisted(d)).toStrictEqual(G2_LEAF_LANE);
        expect(validateIR('t-gv-leaf', d)).toEqual({ ok: true });
    });

    it('writes the spec addendum §10 JSON (the S2 fixture) when the FlowNode filter is set', () => {
        const d = fillLeafLane(true);
        expect(persisted(d)).toStrictEqual(ADDENDUM_LEAF_LANE);
        expect(validateIR('t-gv-leaf-f', d)).toEqual({ ok: true });
    });

    it('with a pinned metaclass the only extra key is the pin the creation gesture writes', () => {
        const created = computeCreationSeed({ kind: 'vertex', metaclassName: 'Lane', metaclassId: 'c_Lane', label: 'View for Lane' })!;
        const { ir } = convertIRKind(created, 'graphVertex', undefined);
        expect((ir as GraphVertexViewIR).authoringMetaclassPins).toEqual({ Lane: 'c_Lane' });
    });

    it('the channel pick alone writes edges: hide, because flowNodeRefs is not containment (decision 8, R-GV-4)', () => {
        const d = pickStep(createThenPickGraphVertex('Lane'), 0, 'flowNodeRefs', 'values');
        expect(d.containment).toEqual({ children: '$flowNodeRefs.values', edges: 'hide' });
        // ... and the author can still change it.
        expect(withChannelEdges(d, 'show').containment).toEqual({ children: '$flowNodeRefs.values' });
    });
});

describe('Pool with lanes: create a view on Participant, pick graphVertex, fill the panel', () => {
    it('writes the discovery report §G2 JSON, deep-equal', () => {
        let d = createThenPickGraphVertex('Participant');
        d = { ...d, label: 'Pool with lanes' };
        // Applies to · Matching: MatchingSection's own writes (`{ ...draft, priority: n }`, `{ ...draft, predicate }`).
        d = { ...d, priority: 1 };
        const predicate: Predicate = { op: 'not', arg: { op: 'empty', path: '$processRef.value.$laneSets.values' } };
        d = { ...d, predicate };
        d = withShape(d, { fill: '#ffffff' });
        d = withBorderAxis(d, 'width', 1.5);
        d = withLayoutMode(d, 'partitions');
        d = withHeaderSide(d, 'w');
        d = headerLabel(d);
        d = pickStep(d, 0, 'processRef', 'value');
        d = pickStep(d, 1, 'laneSets', 0);
        d = pickStep(d, 2, 'lanes', 'values');
        d = withChildFilter(d, { op: 'isKind', class: 'Lane' });
        d = withMembershipMode(d, 'forbid');
        d = withCollapsible(d, false);
        expect(persisted(d)).toStrictEqual(G2_POOL_WITH_LANES);
        expect(validateIR('t-gv-pool', d)).toEqual({ ok: true });
    });
});

describe('the metamodel checks of the panel (spec addendum §2.4)', () => {
    it('the leaf lane channel ends on a plain reference: none, forbid, reference', () => {
        const f = channelFacts('$flowNodeRefs.values', byName('Lane'), byId);
        expect(f).toMatchObject({ resolved: true, terminalContainment: false, composition: false });
        expect(f.hops.map(h => `${h.owner}.${h.reference.name}`)).toEqual(['Lane.flowNodeRefs']);
        expect(admittedMembershipModes(f)).toEqual(['none', 'forbid', 'reference']);
    });

    it('the pool channel crosses processRef and ends on a containment: none, forbid, reparent; not a composition channel', () => {
        const f = channelFacts('$processRef.value.$laneSets.values[0].$lanes.values', byName('Participant'), byId);
        expect(f.hops.map(h => `${h.owner}.${h.reference.name}`)).toEqual(['Participant.processRef', 'Process.laneSets', 'LaneSet.lanes']);
        expect(f).toMatchObject({ resolved: true, terminalContainment: true, composition: false });
        expect(admittedMembershipModes(f)).toEqual(['none', 'forbid', 'reparent']);
    });

    it('a channel made of containment only is a composition channel, and leaves edges alone', () => {
        const f = channelFacts('$childLaneSet.value.$lanes.values', byName('Lane'), byId);
        expect(f).toMatchObject({ terminalContainment: true, composition: true });
        const d = withChannel(graphVertexSeedIR(), '$childLaneSet.value.$lanes.values', f);
        expect(d.containment).toEqual({ children: '$childLaneSet.value.$lanes.values' });
    });

    it('the absent channel is the composition channel', () => {
        expect(channelFacts(undefined, byName('Lane'), byId)).toEqual({ resolved: true, hops: [], terminalContainment: true, composition: true });
    });

    it('a step that does not resolve stops the check and offers every mode', () => {
        const f = channelFacts('$nope.values', byName('Lane'), byId);
        expect(f).toMatchObject({ resolved: false, terminalContainment: null, composition: null });
        expect(admittedMembershipModes(f)).toEqual(['none', 'forbid', 'reference', 'reparent']);
        // An unchecked channel writes no edges: the metamodel did not say it is not a composition.
        expect(withChannel(graphVertexSeedIR(), '$nope.values', f).containment).toEqual({ children: '$nope.values' });
    });

    it('the metaclass wildcard has no root class: nothing resolves', () => {
        expect(channelFacts('$flowNodeRefs.values', null, byId).resolved).toBe(false);
    });
});

describe('the channel steps', () => {
    it('hops parse and print back; an unparsable channel reads as none', () => {
        const e = '$processRef.value.$laneSets.values[0].$lanes.values';
        expect(channelExpr(channelHops(e))).toBe(e);
        expect(channelHops('not a path')).toEqual([]);
        expect(channelHops(undefined)).toEqual([]);
        expect(channelExpr([])).toBeUndefined();
    });

    it('another take on the same reference keeps the steps after it; another reference drops them', () => {
        let d = pickStep(createThenPickGraphVertex('Participant'), 0, 'processRef', 'value');
        d = pickStep(d, 1, 'laneSets', 0);
        d = pickStep(d, 2, 'lanes', 'values');
        const root = byName('Participant');
        const sameRef = withChannelStep(d, 1, '$laneSets.values[1]', root, byId);
        expect(sameRef.containment.children).toBe('$processRef.value.$laneSets.values[1].$lanes.values');
        const otherRef = withChannelStep(d, 1, '$flowElements.values', root, byId);
        expect(otherRef.containment.children).toBe('$processRef.value.$flowElements.values');
    });

    it('clearing a step clears it and every step after; the last step gone, the key goes', () => {
        let d = pickStep(createThenPickGraphVertex('Participant'), 0, 'processRef', 'value');
        d = pickStep(d, 1, 'laneSets', 0);
        const root = byName('Participant');
        expect(withChannelStep(d, 1, '', root, byId).containment.children).toBe('$processRef.value');
        expect('children' in withChannelStep(d, 0, '', root, byId).containment).toBe(false);
        expect(withoutLastChannelStep(d, root, byId).containment.children).toBe('$processRef.value');
        expect('children' in withoutLastChannelStep(withoutLastChannelStep(d, root, byId), root, byId).containment).toBe(false);
    });

    it('a step before the last that reads the whole list is flagged, and refused by validateIR', () => {
        const hops = channelHops('$laneSets.values.$lanes.values');
        expect(wholeListHop(hops)).toBe(0);
        expect(wholeListHop(channelHops('$laneSets.values[0].$lanes.values'))).toBe(-1);
        const d = withChannel(graphVertexSeedIR(), '$laneSets.values.$lanes.values');
        expect(validateIR('t-gv-whole', d).ok).toBe(false);
    });
});

describe('every default is the absence of its key', () => {
    const seed = (): GraphVertexViewIR => graphVertexSeedIR();

    it('layout: free with nothing else goes; partitions writes its axis; free drops it', () => {
        expect('layout' in withLayoutMode(seed(), 'free').containment).toBe(false);
        const p = withLayoutMode(seed(), 'partitions');
        expect(p.containment.layout).toEqual({ mode: 'partitions', axis: 'vertical' });
        expect(withLayoutAxis(p, 'horizontal').containment.layout).toEqual({ mode: 'partitions', axis: 'horizontal' });
        expect('layout' in withLayoutMode(p, 'free').containment).toBe(false);
        const banded = withHeaderSide(p, 'n');
        expect(withLayoutMode(banded, 'free').containment.layout).toEqual({ mode: 'free', header: { side: 'n', size: 30 } });
    });

    it('header: a new band starts at 30 px, keeps its size across sides, and none removes it', () => {
        const w = withHeaderSide(seed(), 'w');
        expect(w.containment.layout).toEqual({ mode: 'free', header: { side: 'w', size: 30 } });
        const sized = withHeaderSize(w, 40);
        expect(withHeaderSide(sized, 'n').containment.layout?.header).toEqual({ side: 'n', size: 40 });
        expect('layout' in withHeaderSide(sized, 'none').containment).toBe(false);
        expect(withHeaderSize(seed(), 40)).toEqual(seed());
    });

    it('padding: 0 is no padding', () => {
        const p = withLayoutPadding(seed(), 8);
        expect(p.containment.layout).toEqual({ mode: 'free', padding: 8 });
        expect('layout' in withLayoutPadding(p, 0).containment).toBe(false);
    });

    it('membership: none drops it; create lives on reference only and goes with it', () => {
        const r = withMembershipCreate(withMembershipMode(seed(), 'reference'), { ownerKind: 'Process', feature: 'flowElements' });
        expect(r.containment.membership).toEqual({ mode: 'reference', create: { ownerKind: 'Process', feature: 'flowElements' } });
        expect(withMembershipMode(r, 'forbid').containment.membership).toEqual({ mode: 'forbid' });
        expect('membership' in withMembershipMode(r, 'none').containment).toBe(false);
        expect(withMembershipCreate(withMembershipMode(seed(), 'forbid'), { ownerKind: 'X' }).containment.membership).toEqual({ mode: 'forbid' });
        const cleared = withMembershipCreate(withMembershipCreate(r, { ownerKind: '' }), { feature: '' });
        expect(cleared.containment.membership).toEqual({ mode: 'reference' });
    });

    it('edges, collapsible, child filter, collapsed', () => {
        expect('edges' in withChannelEdges(withChannelEdges(seed(), 'hide'), 'show').containment).toBe(false);
        expect(withCollapsible(seed(), false).containment).toEqual({ collapsible: false });
        expect('collapsible' in withCollapsible(withCollapsible(seed(), false), true).containment).toBe(false);
        expect('childFilter' in withChildFilter(withChildFilter(seed(), { op: 'isKind', class: 'Lane' }), undefined).containment).toBe(false);
        const c = withCollapsedForm(withCollapsedKey(seed(), 'fill', '#eeeeee'), 'ellipse');
        expect(c.containment.collapsed).toEqual({ fill: '#eeeeee', form: 'ellipse' });
        expect('collapsed' in withCollapsedForm(withCollapsedKey(c, 'fill', undefined), '').containment).toBe(false);
    });

    it('visible, border, corner radius, default size', () => {
        expect('visible' in withVisible(withVisible(seed(), false), true)).toBe(false);
        expect(withVisible(seed(), false).visible).toBe(false);
        const b = withBorderAxis(withBorderAxis(seed(), 'width', 2), 'color', '#000000');
        expect(b.shape.border).toEqual({ width: 2, color: '#000000' });
        expect('border' in withBorderAxis(withBorderAxis(b, 'width', undefined), 'color', undefined).shape).toBe(false);
        expect('cornerRadius' in withoutCornerRadius(withShape(seed(), { cornerRadius: 6 })).shape).toBe(false);
        const s = withDefaultSizeAxis(seed(), 'width', '900');
        expect(s.defaultSize).toEqual({ width: 900 });
        expect('defaultSize' in withDefaultSizeAxis(s, 'width', '')).toBe(false);
    });
});

describe('seed and kind conversion (R-GV-11, D-a)', () => {
    it('the creation seed offers graphVertex with the D-a seed, valid, rendering as the hull of today', () => {
        const s = computeCreationSeed({ kind: 'graphVertex', metaclassName: 'Lane', metaclassId: 'c_Lane', label: 'View for Lane' });
        expect(s).toStrictEqual({
            irVersion: 'ir-1.2', kind: 'graphVertex', metaclasses: ['Lane'], exclusive: true,
            shape: { form: 'rect', labels: [{ position: 'top', source: { from: 'intrinsic', prop: 'name' } }] },
            containment: {},
            authoringMetaclassPins: { Lane: 'c_Lane' },
            label: 'View for Lane',
        });
        expect(computeCreationSeed({ kind: 'graphVertex' })).toMatchObject({ metaclasses: '*' });
        expect(validateIR('t-gv-seed', graphVertexSeedIR())).toEqual({ ok: true });
    });

    it('vertex -> graphVertex keeps the shared keys and stashes the vertex; back again drops containment', () => {
        const v = computeCreationSeed({ kind: 'vertex', metaclassName: 'Lane', metaclassId: 'c_Lane', label: 'View for Lane' }) as VertexViewIR;
        const there = convertIRKind(v, 'graphVertex', undefined);
        const gv = there.ir as GraphVertexViewIR;
        expect(gv.metaclasses).toEqual(['Lane']);
        expect(gv.authoringMetaclassPins).toEqual({ Lane: 'c_Lane' });
        expect(gv.label).toBe('View for Lane');
        expect(gv.containment).toEqual({});
        expect(gv.shape).toEqual(graphVertexSeedIR().shape);
        expect(Object.keys(there.stash)).toEqual(['vertex']);

        const authored = withHeaderSide(pickStep(gv, 0, 'flowNodeRefs', 'values'), 'w');
        const back = convertIRKind(authored, 'vertex', there.stash);
        expect(back.ir.kind).toBe('vertex');
        expect('containment' in back.ir).toBe(false);
        expect(persisted(back.ir)).toStrictEqual(persisted(v));
        // The graphVertex left behind waits in its own slot and comes back whole.
        expect(Object.keys(back.stash)).toEqual(['graphVertex']);
        const again = convertIRKind(back.ir, 'graphVertex', back.stash);
        expect(persisted(again.ir)).toStrictEqual(persisted(authored));
    });

    it('row -> graphVertex enters on the D-a seed', () => {
        const row = computeCreationSeed({ kind: 'row' })!;
        const { ir } = convertIRKind(row, 'graphVertex', undefined);
        expect(ir).toMatchObject({ kind: 'graphVertex', containment: {}, shape: graphVertexSeedIR().shape });
        expect(validateIR('t-gv-row', ir).ok).toBe(true);
    });
});
