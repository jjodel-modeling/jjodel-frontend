/**
 * Step C lane C3b, item 1 (P-2026-11-05-0748; R-TXT-41 D2, R-TXT-43, R-TXT-37): the deletion guard. An edit whose plan
 * deletes three objects or more at once, counted at the top of each deleted subtree, or every object of the model, asks
 * before it applies; deleting one block, with what it contains, or two, applies on the pause.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@monaco-editor/react', () => ({ default: () => null }));
vi.mock('../../../jjscript', () => ({ buildEvalContext: () => ({}) }));
vi.mock('../../../components/editor-v2/sim/simBridge', () => ({ evalContextFor: () => ({}) }));
vi.mock('../../../components/abstract/DockManager', () => ({ default: { closeTab: () => true } }));

import { deletionGuard, editStatusText, GUARD_ROOTS } from '../ui/TextualTab';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import { planTextEdit } from '../textDiff';
import { tolerantCases } from './tolerantCorpus';

const lib = tolerantCases()[0];
const print = printTextModel(lib.g, lib.objects);

/** The print with the lines of the given objects' blocks taken out. */
function without(ids: readonly string[]): string {
    let text = print.text;
    const spans = print.spans.filter(s => ids.includes(s.id)).sort((a, b) => b.start - a.start);
    for (const s of spans) {
        const from = text.lastIndexOf('\n', s.start - 1) + 1;
        const to = text.indexOf('\n', s.end);
        text = text.slice(0, from) + (to < 0 ? '' : text.slice(to + 1));
    }
    return text;
}

const planOf = (text: string) => {
    const parsed = parseText(text, lib.g);
    return planTextEdit({ mm: lib.mm, grammar: lib.g, model: lib.objects, parsed, unprinted: [], previous: [] });
};
const guardOf = (text: string) => deletionGuard({ mm: lib.mm, objects: lib.objects }, planOf(text));

const root = lib.objects[0].id;
const leaves = lib.objects.filter(o => o.cls !== lib.objects[0].cls).map(o => o.id);
/** Six books, then three members in the print; an emptied containment block does not parse, so three of the books. */
const books = lib.objects.filter(o => o.cls === 'Book').map(o => o.id);

describe('deletion guard (C3b item 1)', () => {
    it('the corpus has a root and nine contained objects', () => {
        expect(lib.objects.length).toBe(10);
        expect(leaves.length).toBe(9);
    });

    it('one object deleted applies without asking', () => {
        expect(planOf(without([leaves[0]])).lines?.length).toBeGreaterThan(0);
        expect(guardOf(without([leaves[0]]))).toBeNull();
    });

    it('two objects deleted apply without asking', () => {
        expect(guardOf(without(leaves.slice(0, 2)))).toBeNull();
    });

    it(`${GUARD_ROOTS} objects deleted at once ask, with the count`, () => {
        expect(GUARD_ROOTS).toBe(3);
        expect(guardOf(without(books.slice(0, 3)))).toEqual({ deleted: 3, total: 10, all: false });
    });

    it('the last objects deleted by a truncation ask', () => {
        const g = guardOf(without(leaves.slice(-5)));
        expect(g).toEqual({ deleted: 5, total: 10, all: false });
    });

    it('every object deleted asks, the root block alone included (R-TXT-43)', () => {
        expect(guardOf(without([root]))).toEqual({ deleted: 10, total: 10, all: true });
    });

    it('the empty text asks (R-TXT-43, #204)', () => {
        expect(guardOf('')).toEqual({ deleted: 10, total: 10, all: true });
    });

    it('an edit that deletes nothing never asks', () => {
        expect(guardOf(print.text.replace(/\n$/, '') + '\n')).toBeNull();
    });

    it('a refused plan has no guard', () => {
        expect(guardOf(print.text.slice(0, 40))).toBeNull();
    });

    it('the bar names the count', () => {
        expect(editStatusText({ kind: 'guard', deleted: 5, total: 10, all: false }).text).toBe('Not applied · deletes 5 objects of 10, confirm below');
        expect(editStatusText({ kind: 'guard', deleted: 10, total: 10, all: true }).text).toBe('Not applied · deletes every object (10), confirm below');
    });
});
