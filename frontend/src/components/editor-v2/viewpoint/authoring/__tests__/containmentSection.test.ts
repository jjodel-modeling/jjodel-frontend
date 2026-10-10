/**
 * ContainmentSection and the header label option, rendered (P-2026-10-10-1156, slice S4).
 *
 * `ContainmentSection.tsx` and `LabelEntryEditor.tsx` load in the node bench (React, the `ui` barrel and pure modules
 * only), so they are rendered to markup through `react-dom/server` and read by their `data-testid`s. What is asserted:
 * the progressive disclosure the prompt asks for (Basic shows the channel, the layout mode and the channel edges;
 * Advanced the rest), the channel's steps on the PathBuilder, the metamodel check as inline help, and the header
 * position with its text direction offered only where `allowHeader` is set.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContainmentSection, type ContainmentSectionProps } from '../ContainmentSection';
import { LabelEntryEditor, applyLabelOrientation, applyLabelPositionValue } from '../LabelEntryEditor';
import { graphVertexSeedIR } from '../../ir/irCreationSeed';
import type { ChannelClass } from '../graphVertexAuthoring';
import type { GraphVertexViewIR, LabelSpec } from '../../ir/irTypes';

const ref = (name: string, target: string, containment: boolean, upperBound = -1) =>
    ({ name, targetClassId: `c_${target}`, targetClassName: target, containment, upperBound });
const CLASSES: ChannelClass[] = [
    { id: 'c_Participant', name: 'Participant', references: [ref('processRef', 'Process', false, 1)] },
    { id: 'c_Process', name: 'Process', references: [ref('flowElements', 'FlowElement', true), ref('laneSets', 'LaneSet', true)] },
    { id: 'c_LaneSet', name: 'LaneSet', references: [ref('lanes', 'Lane', true)] },
    { id: 'c_Lane', name: 'Lane', references: [ref('flowNodeRefs', 'FlowNode', false), ref('childLaneSet', 'LaneSet', true, 1)] },
];
const byId = (id: string) => CLASSES.find(c => c.id === id) ?? null;
const byName = (name: string) => CLASSES.find(c => c.name === name) ?? null;

const LEAF_LANE: GraphVertexViewIR = {
    ...graphVertexSeedIR(), metaclasses: ['Lane'], label: 'Lane',
    containment: {
        children: '$flowNodeRefs.values',
        layout: { mode: 'free', header: { side: 'w', size: 30 } },
        membership: { mode: 'reference', create: { ownerKind: 'Process', feature: 'flowElements' } },
        edges: 'hide', collapsible: false,
    },
};

const render = (over: Partial<ContainmentSectionProps>) => renderToStaticMarkup(createElement(ContainmentSection, {
    draft: LEAF_LANE, patch: () => {}, advanced: false, rootClass: byName('Lane'), classById: byId, classByName: byName,
    classNames: CLASSES.map(c => c.name), featuresHint: 'set a metaclass', ...over,
}));

const testIds = (html: string) => [...html.matchAll(/data-testid="([^"]+)"/g)].map(m => m[1]);
/** The inner markup of the element carrying `id`, up to its closing tag at the same depth (div-only bench). */
function block(html: string, id: string): string {
    const start = html.indexOf(`data-testid="${id}"`);
    if (start < 0) return '';
    const open = html.lastIndexOf('<div', start);
    let depth = 0;
    const re = /<div\b|<\/div>/g;
    re.lastIndex = open;
    for (let m = re.exec(html); m; m = re.exec(html)) {
        depth += m[0] === '</div>' ? -1 : 1;
        if (depth === 0) return html.slice(open, m.index + 6);
    }
    return html.slice(open);
}
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();

const BASIC = ['gv-channel', 'gv-layout-mode', 'gv-edges'];
const ADVANCED = ['gv-child-filter', 'gv-header', 'gv-padding', 'gv-membership', 'gv-collapsible'];

describe('ContainmentSection — progressive disclosure', () => {
    it('Basic shows the channel, the layout mode and the channel edges, and nothing else', () => {
        const ids = testIds(render({ advanced: false }));
        for (const id of BASIC) expect(ids).toContain(id);
        for (const id of [...ADVANCED, 'gv-membership-create', 'gv-header-size', 'gv-layout-axis', 'gv-collapsed']) {
            expect(ids).not.toContain(id);
        }
    });

    it('Advanced adds the filter, the band, the padding, the membership with its creation owner, the collapse', () => {
        const ids = testIds(render({ advanced: true }));
        for (const id of [...BASIC, ...ADVANCED, 'gv-membership-create', 'gv-header-size']) expect(ids).toContain(id);
        // Not collapsible: no collapsed representation. Free: no stacking axis.
        expect(ids).not.toContain('gv-collapsed');
        expect(ids).not.toContain('gv-layout-axis');
    });

    it('partitions show the stacking axis; a collapsible container shows its collapsed representation', () => {
        const draft: GraphVertexViewIR = { ...LEAF_LANE, containment: { layout: { mode: 'partitions', axis: 'vertical' } } };
        const ids = testIds(render({ advanced: true, draft }));
        expect(ids).toContain('gv-layout-axis');
        expect(ids).toContain('gv-collapsed');
        expect(ids).not.toContain('gv-membership-create');
        expect(ids).not.toContain('gv-header-size');
    });
});

describe('ContainmentSection — the channel and the metamodel check', () => {
    it('one PathBuilder per step, the channel printed, the last step named as a plain reference', () => {
        const html = render({});
        expect(testIds(html).filter(id => id.startsWith('gv-channel-step-'))).toEqual(['gv-channel-step-0']);
        // One step: the PathBuilder's own preview is the channel, no second line.
        expect(testIds(html)).not.toContain('gv-channel-expr');
        expect(text(block(html, 'gv-channel'))).toContain('The channel ends on Lane.flowNodeRefs, a plain reference');
    });

    it('a three-step channel has three pickers and ends on a containment', () => {
        const draft: GraphVertexViewIR = { ...LEAF_LANE, metaclasses: ['Participant'],
            containment: { children: '$processRef.value.$laneSets.values[0].$lanes.values' } };
        const html = render({ draft, rootClass: byName('Participant') });
        expect(testIds(html).filter(id => id.startsWith('gv-channel-step-'))).toEqual(['gv-channel-step-0', 'gv-channel-step-1', 'gv-channel-step-2']);
        expect(text(block(html, 'gv-channel-expr'))).toBe('$processRef.value.$laneSets.values[0].$lanes.values');
        expect(text(block(html, 'gv-channel'))).toContain('The channel ends on LaneSet.lanes, a containment reference.');
    });

    it('the absent channel: no picker, the composition children named', () => {
        const html = render({ draft: graphVertexSeedIR() });
        expect(testIds(html).some(id => id.startsWith('gv-channel-step-'))).toBe(false);
        expect(text(block(html, 'gv-channel'))).toContain('The container draws its composition children');
    });

    it('the membership help lists what the channel admits, inline; a mode it does not admit is flagged, not refused', () => {
        const ok = text(block(render({ advanced: true }), 'gv-membership'));
        expect(ok).toContain('This channel admits: none, forbid, reference.');
        expect(ok).not.toContain('use reparent');
        const draft: GraphVertexViewIR = { ...LEAF_LANE, containment: { ...LEAF_LANE.containment, membership: { mode: 'reparent' } } };
        const bad = text(block(render({ advanced: true, draft }), 'gv-membership'));
        expect(bad).toContain('Reparent appends to a containment slot, and this channel ends on a plain reference: use reference.');
    });

    it('the creation owner offers only the containment references of the owner class', () => {
        const draft: GraphVertexViewIR = { ...LEAF_LANE, containment: { ...LEAF_LANE.containment, membership: { mode: 'reference', create: { ownerKind: 'Lane', feature: 'childLaneSet' } } } };
        const create = block(render({ advanced: true, draft }), 'gv-membership-create');
        expect(create).toMatch(/<option value="childLaneSet"[^>]*selected=""/);
        expect(create).not.toMatch(/<option value="flowNodeRefs"/);
    });

    it('the creation owner offers the containment references of the owner class', () => {
        const create = block(render({ advanced: true }), 'gv-membership-create');
        expect(create).toMatch(/<option value="flowElements"[^>]*selected=""/);
        expect(create).toMatch(/<option value="laneSets"/);
        expect(create).toMatch(/<option value="Process"[^>]*selected=""/);
    });
});

describe('LabelEntryEditor — the header band position (R-GV-5)', () => {
    const header: LabelSpec = { position: 'header', orientation: 'vertical', source: { from: 'intrinsic', prop: 'name' } };
    const renderLabel = (label: LabelSpec, allowHeader?: boolean) => renderToStaticMarkup(createElement(LabelEntryEditor, {
        label, features: null, classNames: [], allowHeader, onChange: () => {},
    }));

    it('offered with allowHeader, with its text direction selected', () => {
        const html = renderLabel(header, true);
        expect(html).toMatch(/<option value="header" selected="">In the header band<\/option>/);
        expect(html).toMatch(/<option value="vertical" selected="">Vertical \(bottom to top\)<\/option>/);
    });

    it('not offered without it: the vertex and edge panels keep the list they had', () => {
        const html = renderLabel({ position: 'top', source: { from: 'intrinsic', prop: 'name' } });
        expect(html).not.toContain('value="header"');
        expect(html).not.toContain('Text direction');
    });

    it('the text direction stays on a header label and leaves with it; horizontal is never written', () => {
        const top: LabelSpec = { position: 'top', source: { from: 'intrinsic', prop: 'name' } };
        expect(applyLabelPositionValue(header, 'header')).toEqual(header);
        expect(applyLabelPositionValue(header, 'top')).toEqual(top);
        expect(applyLabelPositionValue(header, 'outside:w')).toEqual({ ...top, position: 'outside', anchor: 'w' });
        expect(applyLabelOrientation(header, 'horizontal')).toEqual({ position: 'header', source: header.source });
        expect(applyLabelOrientation({ position: 'header', source: header.source }, 'vertical')).toEqual(header);
    });

    it('no text direction on a label outside the band', () => {
        expect(renderLabel({ position: 'top', source: { from: 'intrinsic', prop: 'name' } }, true)).not.toContain('Text direction');
    });
});
