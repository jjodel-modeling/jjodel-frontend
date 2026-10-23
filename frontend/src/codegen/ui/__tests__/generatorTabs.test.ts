/**
 * generatorTabs and codeOrigins — the generator tab's id, the pill's choice, a Save of one generator, the Check gate
 * and «go to template» (slice G3, P-2026-10-24-0003). Mutations each test kills are in its name; the bench is in the
 * commit body.
 */

import { beforeEach, describe, it, expect } from 'vitest';
import {
    checkOffered, forgetGenerators, generatorTabId, launchGenerator, rememberGenerator, saveGeneratorTemplates, templateToSelect,
} from '../generatorTabs';
import { elementAt, pickOnCanvas, templateTarget } from '../codeOrigins';
import { addGenerator, decodeGenerators, encodeGenerators, GEN_GENERATORS_KEY } from '../../engine/generatorCodec';
import { encodeTemplates, GEN_TEMPLATES_KEY } from '../../engine/templateCodec';
import type { TemplateRecord } from '../../engine/templates';
import type { Origin, TextMapEntry, TextFragment } from '../../engine/text';

const main: TemplateRecord = { name: 'main', params: [], body: '"m"' };
const row: TemplateRecord = { name: 'row', params: ['r'], body: '"r"' };

beforeEach(() => forgetGenerators());

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
