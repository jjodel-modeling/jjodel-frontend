/**
 * generatorTabs and codeOrigins — the generator tab's id, the pill's choice, a Save of one generator, the Check gate
 * and «go to template» (slice G3, P-2026-10-24-0003). Mutations each test kills are in its name; the bench is in the
 * commit body.
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';
import {
    armRailCollapse, checkOffered, forgetGenerators, forgetRail, generatorBeside, generatorTabId, launchGenerator, noTemplates, paneGeneration,
    railShown, railStep, rememberGenerator, runOffered, saveGeneratorTemplates, templateToSelect,
    besideTarget, fragmentExtents, hoverScope,
} from '../generatorTabs';
import { generateGenerator } from '../../engine/generateFiles';
import type { GeneratorRecord } from '../../engine/generatorCodec';
import { loadExample, recordOf } from '../../oracle/__tests__/exampleFixture';
import { elementAt, pickOnCanvas, templateTarget } from '../codeOrigins';
import { addGenerator, decodeGenerators, encodeGenerators, GEN_GENERATORS_KEY } from '../../engine/generatorCodec';
import { encodeTemplates, GEN_TEMPLATES_KEY } from '../../engine/templateCodec';
import type { TemplateRecord } from '../../engine/templates';
import type { Origin, TextMapEntry, TextFragment } from '../../engine/text';

const main: TemplateRecord = { name: 'main', params: [], body: '"m"' };
const row: TemplateRecord = { name: 'row', params: ['r'], body: '"r"' };

beforeEach(() => { forgetGenerators(); forgetRail(); });

describe('generatorTabId', () => {
    it('the default keeps the Template Editor id, another generator has its own (kills: one id for all generators)', () => {
        expect(generatorTabId('MM')).toBe('codegen_tpl_MM');
        expect(generatorTabId('MM', 'default')).toBe('codegen_tpl_MM');
        expect(generatorTabId('MM', 'g1')).toBe('codegen_tpl_MM_g1');
        expect(generatorTabId('MM', 'g2')).not.toBe(generatorTabId('MM', 'g1'));
    });
});

describe('launchGenerator', () => {
    const list = [{ id: 'default' }, { id: 'g1' }, { id: 'g2' }];

    it('the pill opens the generator last used on the metamodel (kills: always default)', () => {
        rememberGenerator('MM', 'g2');
        expect(launchGenerator('MM', list)).toBe('g2');
    });

    it('the memory is per metamodel, and a gone generator falls back to the default (kills: a stale id opened)', () => {
        rememberGenerator('MM', 'g2');
        expect(launchGenerator('OTHER', list)).toBe('default');
        expect(launchGenerator('MM', [{ id: 'default' }, { id: 'g1' }])).toBe('default');
    });
});

describe('saveGeneratorTemplates', () => {
    const rawT = encodeTemplates([main]);
    const decodedB = () => {
        const withB = addGenerator(decodeGenerators(rawT, undefined).generators, 'B');
        const rawG = encodeGenerators(withB);
        return { rawG, generators: decodeGenerators(rawT, rawG).generators };
    };

    it('Save in generator B leaves genTemplates bytes (kills: default rewritten)', () => {
        const { rawG, generators } = decodedB();
        const patch = saveGeneratorTemplates(rawT, rawG, generators, 'g1', [row]);
        expect(patch).not.toBeNull();
        expect(Object.keys(patch!)).toEqual([GEN_GENERATORS_KEY]);
        const after = decodeGenerators(rawT, patch![GEN_GENERATORS_KEY]).generators;
        expect(after.find(g => g.id === 'g1')!.templates.map(t => t.name)).toEqual(['row']);
        expect(after.find(g => g.id === 'default')!.templates.map(t => t.name)).toEqual(['main']);
    });

    it('Save in the default writes genTemplates only (kills: the generator id ignored)', () => {
        const { rawG, generators } = decodedB();
        const patch = saveGeneratorTemplates(rawT, rawG, generators, 'default', [main, row]);
        expect(Object.keys(patch!)).toEqual([GEN_TEMPLATES_KEY]);
    });

    it('nothing is written for a gone generator or an unchanged list (kills: a patch always returned)', () => {
        const { rawG, generators } = decodedB();
        expect(saveGeneratorTemplates(rawT, rawG, generators, 'g9', [row])).toBeNull();
        expect(saveGeneratorTemplates(rawT, rawG, generators, 'g1', [])).toBeNull();
    });
});

describe('checkOffered', () => {
    it('Check is disabled on target none (kills: condition dropped)', () => {
        expect(checkOffered('none')).toBe(false);
        expect(checkOffered('js')).toBe(true);
    });
});

describe('runOffered', () => {
    it('Run is disabled on target none (kills: Run enabled on target none)', () => {
        expect(runOffered('none')).toBe(false);
        expect(runOffered('js')).toBe(true);
    });
});

describe('paneGeneration (P-2026-10-24-0318)', () => {
    const gen = (templates: TemplateRecord[]): GeneratorRecord =>
        ({ id: 'g1', name: 'New', root: 'main', files: [{ path: 'main.js', entry: 'main' }], target: 'js', templates });

    it('an empty list shows the empty state and calls no generation (kills: generate called on an empty list)', () => {
        const generate = vi.fn(() => 'generated');
        expect(noTemplates(gen([]))).toBe(true);
        expect(paneGeneration(gen([]), generate)).toBeNull();
        expect(generate).not.toHaveBeenCalled();
    });

    it('a non-empty list with a missing root still reports the error (kills: the error hidden for every missing root)', () => {
        const ex = loadExample('turnstile');
        const g = gen([row]);
        expect(noTemplates(g)).toBe(false);
        const out = paneGeneration(g, () => generateGenerator(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, g));
        expect(out).not.toBeNull();
        expect(out!.files[0].result.errors.map(e => e.message)).toEqual(["No template named 'main'"]);
    });
});

describe('templateTarget and templateToSelect', () => {
    const names = ['main', 'row', 'state'];

    it('«go to template» selects the right template (kills: first template selected)', () => {
        const model: Origin = { kind: 'model', elementId: 'o1', feature: null, featureName: 'name', transformation: { name: 'name' }, template: 'state' };
        expect(templateToSelect(names, templateTarget(model))).toBe('state');
        const literal: Origin = { kind: 'literal', template: 'row', offset: 4, line: 2, column: 3 };
        expect(templateTarget(literal)).toEqual({ template: 'row', line: 2, column: 3 });
        expect(templateToSelect(names, templateTarget(literal))).toBe('row');
    });

    it('an origin with no template, or one not listed, selects nothing (kills: a fallback to the first)', () => {
        const opaque: Origin = { kind: 'opaque', reads: [] };
        expect(templateToSelect(names, templateTarget(opaque))).toBeNull();
        expect(templateToSelect(names, { template: 'gone', line: null, column: null })).toBeNull();
    });
});

describe('elementAt (moved from CodePanel.tsx)', () => {
    const origin = (id: string): Origin => ({ kind: 'model', elementId: id, feature: null, featureName: 'name', transformation: { name: 'name' } });
    const entry = (line: number, start: number, end: number, o: Origin): TextMapEntry =>
        ({ line, start, end, origin: o, fragment: { kind: o.kind, text: '', origin: o, indent: [] } as TextFragment });

    it('the fragment under the column, else the nearest on the line, else none', () => {
        const map = [entry(1, 0, 3, origin('a')), entry(1, 10, 12, origin('b')), entry(2, 0, 2, { kind: 'opaque', reads: [] })];
        expect(elementAt(map, 1, 11)?.elementId).toBe('b');
        expect(elementAt(map, 1, 5)?.elementId).toBe('a');
        expect(elementAt(map, 2, 1)).toBeNull();
    });
});

describe('pickOnCanvas', () => {
    const lookup: Record<string, any> = {
        v1: { className: 'DVertex', model: 'o1' },
        v2: { className: 'DVertex', model: 'o2' },
        e1: { className: 'DVoidEdge', model: 'R', start: 'v1' },
        R: { className: 'DReference' },
        o1: { className: 'DObject', features: ['s1'] },
        s1: { className: 'DValue', instanceof: 'R' },
    };

    it('the element\'s vertex, not the first node (kills: first node selected)', () => {
        expect(pickOnCanvas(lookup, ['v1', 'v2'], [], 'o2')).toEqual({ kind: 'node', nodeId: 'v2' });
    });

    it('an element drawn as an edge: the edge and its source vertex; none when drawn by neither', () => {
        expect(pickOnCanvas(lookup, ['v1', 'v2'], ['e1'], 's1')).toEqual({ kind: 'edge', edgeId: 'e1', nodeId: 'v1' });
        expect(pickOnCanvas(lookup, ['v1'], ['e1'], 'nothing')).toBeNull();
    });
});

describe('the rail beside a generator tab (P-2026-10-25-0925)', () => {
    const canvas = { tabs: [{ id: 'mm1' }, { id: 'm1' }], activeId: 'm1' };
    const gen = { tabs: [{ id: generatorTabId('mm1') }], activeId: generatorTabId('mm1') };
    const beside = { dockbox: { children: [canvas, gen] } };
    const open = { tree: true, inspector: true };
    const shut = { tree: false, inspector: false };

    it('beside: shown in its own panel next to the canvas panel, its canvas in front or not; not in the canvas panel, not alone (kills: any open generator counts)', () => {
        expect(generatorBeside(beside)).toBe(true);
        expect(generatorBeside({ dockbox: { children: [{ tabs: [{ id: 'm1' }, { id: generatorTabId('mm1') }], activeId: generatorTabId('mm1') }] } })).toBe(false);
        expect(generatorBeside({ dockbox: { children: [{ tabs: [{ id: 'm1' }, { id: generatorTabId('mm1') }], activeId: 'm1' }] } })).toBe(false);
        expect(generatorBeside({ dockbox: { children: [canvas, { tabs: [{ id: 'x' }, ...gen.tabs], activeId: 'x' }] } })).toBe(false);
        expect(generatorBeside({ dockbox: { children: [gen] } })).toBe(false);
        const g1 = generatorTabId('mm1', 'g1');
        expect(generatorBeside({ dockbox: { children: [{ tabs: [{ id: 'm1' }, { id: g1 }], activeId: g1 }, gen] } })).toBe(true);
        expect(generatorBeside(null)).toBe(false);
    });

    it('opening a generator tab beside the canvas collapses the rail (kills: no collapse)', () => {
        armRailCollapse();
        expect(railStep(false, open)).toBeNull();
        expect(railStep(true, open)).toEqual({ kind: 'collapse' });
    });

    it('closing it restores the previous state, open or closed (kills: always reopened)', () => {
        armRailCollapse();
        expect(railStep(true, { tree: false, inspector: true })).toEqual({ kind: 'collapse' });
        expect(railStep(true, shut)).toBeNull();
        expect(railStep(false, shut)).toEqual({ kind: 'restore', zones: { tree: false, inspector: true } });
        expect(railStep(false, { tree: false, inspector: true })).toBeNull();
        armRailCollapse();
        expect(railStep(true, shut)).toBeNull();
        expect(railStep(false, shut)).toBeNull();
    });

    it('a manual reopen is kept (kills: re-collapse on every render)', () => {
        armRailCollapse();
        expect(railStep(true, open)).toEqual({ kind: 'collapse' });
        railShown();
        expect(railStep(true, open)).toBeNull();
        expect(railStep(false, open)).toBeNull();
        armRailCollapse();
        expect(railStep(true, open)).toEqual({ kind: 'collapse' });
    });
});

describe('hoverScope (P-2026-10-25-1045)', () => {
    // One entry per line: fragment A on lines 10..39 (30 lines), fragment B on lines 3..4, a zero-width C on line 50.
    const map = [
        ...Array.from({ length: 30 }, (_, i) => ({ fragment: 'A', line: 10 + i, start: 0, end: 5 })),
        { fragment: 'B', line: 3, start: 2, end: 8 },
        { fragment: 'B', line: 4, start: 0, end: 1 },
        { fragment: 'C', line: 50, start: 4, end: 4 },
    ];
    const extents = fragmentExtents(map);

    it('a 30-line fragment highlights the hovered line only, plus a gutter bar over its extent (kills: whole block highlighted)', () => {
        expect(extents.get('A')).toEqual({ first: 10, last: 39 });
        expect(hoverScope(extents.get('A'), 23)).toEqual({ lines: { first: 23, last: 23 }, bar: { first: 10, last: 39 } });
    });

    it('a 2-line fragment highlights both lines, no bar (kills: threshold applied to every fragment)', () => {
        expect(hoverScope(extents.get('B'), 4)).toEqual({ lines: { first: 3, last: 4 }, bar: null });
    });

    it('a 3-line fragment is still whole, a 4-line one is not (kills: off by one at the threshold)', () => {
        expect(hoverScope({ first: 5, last: 7 }, 6).bar).toBeNull();
        expect(hoverScope({ first: 5, last: 8 }, 6).bar).toEqual({ first: 5, last: 8 });
    });

    it('a zero-width entry writes no line (kills: error fragments counted)', () => {
        expect(extents.has('C')).toBe(false);
    });
});

describe('besideTarget (P-2026-10-25-1045)', () => {
    const lookup = { M2: { className: 'DModel', instanceof: 'MM' }, X: { className: 'DModel', instanceof: 'OTHER' } };

    it('the model asked for, then the metamodel, then a conforming model, then the project page (kills: order swapped)', () => {
        expect(besideTarget('MM', 'M1', ['project_summary', 'MM', 'M1'], 'project_summary', lookup)).toBe('M1');
        expect(besideTarget('MM', 'M1', ['project_summary', 'MM'], 'project_summary', lookup)).toBe('MM');
        expect(besideTarget('MM', undefined, ['project_summary', 'X', 'M2'], 'project_summary', lookup)).toBe('M2');
        expect(besideTarget('MM', undefined, ['project_summary', 'X'], 'project_summary', lookup)).toBe('project_summary');
        expect(besideTarget('MM', undefined, [], undefined, lookup)).toBeNull();
    });
});
