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
import { GARAGE, grammarOf } from './corpus';
import { metamodelOf, objectsOf } from './spec';
import type { Spec } from './spec';
import { PORT_MM, PORT_TEXT_CLIKE, portGrammar, portObjects } from './portCorpus';
import type { ObjectSpan } from '../printer';
import type { TextEditPlan } from '../textDiff';

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
        // Two books: reader1, a leaf too, is named by `borrowedBy`, and a text without it is refused before the guard.
        expect(planOf(without(books.slice(0, 2))).lines?.length).toBeGreaterThan(0);
        expect(guardOf(without(books.slice(0, 2)))).toBeNull();
    });

    it('one block deleted with its contents applies without asking (mutant: every deleted object counted)', () => {
        const spec: Spec = {
            ...GARAGE,
            objects: [
                { id: 'c1', cls: 'Car', slots: { name: 'alpha', wheels: ['w1', 'w2'] } },
                { id: 'w1', cls: 'Wheel', slots: { name: 'front', size: 16, bolts: ['b1', 'b2'] } },
                { id: 'w2', cls: 'Wheel', slots: { name: 'rear', size: 17 } },
                { id: 'b1', cls: 'Bolt', slots: { name: 'b' } },
                { id: 'b2', cls: 'Bolt', slots: { name: 'c' } },
            ],
        };
        const mm = metamodelOf(spec), g = grammarOf(spec), objects = objectsOf(spec);
        const p = printTextModel(g, objects);
        const span = p.spans.find(s => s.id === 'w1')!;
        const from = p.text.lastIndexOf('\n', span.start - 1) + 1, to = p.text.indexOf('\n', span.end) + 1;
        const plan = planTextEdit({ mm, grammar: g, model: objects, parsed: parseText(p.text.slice(0, from) + p.text.slice(to), g), unprinted: [], previous: [] });
        expect(plan.diff?.ops.filter(op => op.op === 'delete').map(op => op.model)).toEqual(['w1']);
        expect(deletionGuard({ mm, objects }, plan)).toBeNull();
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

/**
 * Step D lane D1 (P-2026-11-06-2301; R-TXT-37, R-TXT-53 D7): a deletion whose object's carried span lies inside a
 * comment asks first, whatever else the pause carries. On PORT: `Module cpu {`, `input instr : Word(32)` (p1),
 * `input : Bool` (p2), `output result : Word(8) = ...` (p3), `}`.
 */
describe('commenting an object out asks first (D1)', () => {
    const g = portGrammar();
    const model = portObjects();
    const port = printTextModel(g, model);
    const lineOf = (id: string): number => port.text.lastIndexOf('\n', port.spans.find(s => s.id === id)!.start - 1) + 1;
    const indentOf = (id: string): number => lineOf(id) + 2;
    /** The whole line of an object, its newline included. */
    const lineLength = (id: string): number => port.text.indexOf('\n', lineOf(id)) + 1 - lineOf(id);

    interface Typed { readonly text: string; readonly carried: readonly ObjectSpan[] }
    /**
     * Edits typed on a text, offsets of that text, and its spans as the editor carries them: they never grow at an edge,
     * and a span whose text is deleted collapses where the deletion was.
     */
    function typed(edits: readonly { readonly at: number; readonly remove?: number; readonly text?: string }[],
                   from: Typed = { text: port.text, carried: port.spans }): Typed {
        let { text, carried } = from;
        for (const { at, remove = 0, text: t = '' } of [...edits].sort((a, b) => b.at - a.at)) {
            text = text.slice(0, at) + t + text.slice(at + remove);
            const start = (o: number): number => o < at ? o : o >= at + remove ? o - remove + t.length : at;
            const end = (o: number): number => o <= at ? o : o >= at + remove ? o - remove + t.length : at;
            carried = carried.map(s => ({ id: s.id, start: start(s.start), end: end(s.end) }));
        }
        return { text, carried };
    }
    const read = ({ text, carried }: Typed) => {
        const parsed = parseText(text, g);
        const plan = planTextEdit({ mm: PORT_MM, grammar: g, model, parsed, unprinted: [], previous: carried, previousRefs: port.refs ?? [] });
        return { plan, guard: deletionGuard({ mm: PORT_MM, objects: model }, plan, { grammar: g, text, parsed, carried }) };
    };
    const deletes = (plan: TextEditPlan): string[] => (plan.diff?.ops ?? []).flatMap(op => op.op === 'delete' ? [op.model] : []);

    it('the corpus prints the three ports, one line each', () => {
        expect(port.text).toBe(PORT_TEXT_CLIKE);
    });

    it('one port commented out asks, naming it (mutant: only three subtrees ask)', () => {
        const { plan, guard } = read(typed([{ at: indentOf('p1'), text: '// ' }]));
        expect(deletes(plan)).toEqual(['p1']);
        expect(plan.lines?.length).toBeGreaterThan(0);
        expect(guard).toEqual({ deleted: 2, total: model.length, all: false, commented: ['Port instr'] });
    });

    it('a nameless port commented out asks, by its class', () => {
        expect(read(typed([{ at: lineOf('p2'), text: '//' }])).guard?.commented).toEqual(['Port (unnamed)']);
    });

    it('two ports commented out by a run of comment lines ask, in text order', () => {
        const { plan, guard } = read(typed([{ at: indentOf('p2'), text: '// ' }, { at: indentOf('p1'), text: '// ' }]));
        expect(deletes(plan).sort()).toEqual(['p1', 'p2']);
        expect(guard?.commented).toEqual(['Port instr', 'Port (unnamed)']);
    });

    it('a block commented out line by line asks, naming it (mutant: each comment covers alone)', () => {
        const starts = [0, ...[...port.text.matchAll(/\n/g)].map(m => (m.index ?? 0) + 1)];
        const { plan, guard } = read(typed(starts.map(at => ({ at, text: '// ' }))));
        expect(deletes(plan)).toEqual(['m']);
        expect(guard).toEqual({ deleted: model.length, total: model.length, all: true, commented: ['Module cpu'] });
    });

    it('a port commented out together with an edit elsewhere asks (D7, mutant: only a pause that just deletes asks)', () => {
        const width = port.text.indexOf('Word(8)') + 'Word(8'.length;
        const { plan, guard } = read(typed([{ at: indentOf('p1'), text: '// ' }, { at: width, text: '0' }]));
        expect(deletes(plan)).toEqual(['p1']);
        expect(plan.diff?.ops.some(op => op.op !== 'delete')).toBe(true);
        expect(guard?.commented).toEqual(['Port instr']);
    });

    it('a port deleted, not commented, applies as today', () => {
        const { plan, guard } = read(typed([{ at: lineOf('p1'), remove: lineLength('p1') }]));
        expect(deletes(plan)).toEqual(['p1']);
        expect(guard).toBeNull();
    });

    it('a port deleted between two comment lines is not commented out (mutant: a collapsed span counts)', () => {
        const notes = typed([{ at: lineOf('p3'), text: '  // b\n' }, { at: lineOf('p2'), text: '  // a\n' }]);
        const at = notes.text.indexOf('  input : Bool\n');
        const { plan, guard } = read(typed([{ at, remove: '  input : Bool\n'.length }], notes));
        expect(deletes(plan)).toEqual(['p2']);
        expect(guard).toBeNull();
    });

    it('uncommenting restores nothing to apply', () => {
        const commented = typed([{ at: indentOf('p1'), text: '// ' }]);
        const back = typed([{ at: indentOf('p1'), remove: 3 }], commented);
        expect(back.text).toBe(port.text);
        expect(back.carried).toEqual(port.spans.map(s => ({ ...s })));
        const { plan, guard } = read(back);
        expect(deletes(plan)).toEqual([]);
        expect(guard).toBeNull();
    });

    it('a comment that covers no object changes nothing (mutant: any comment asks)', () => {
        const note = typed([{ at: lineOf('p2'), text: '  // note\n' }]);
        expect(deletes(read(note).plan)).toEqual([]);
        expect(read(note).guard).toBeNull();
        // The comment above a port, and that port deleted: the deleted span is not inside the comment.
        const at = note.text.indexOf('  input : Bool\n');
        const { plan, guard } = read(typed([{ at, remove: '  input : Bool\n'.length }], note));
        expect(deletes(plan)).toEqual(['p2']);
        expect(guard).toBeNull();
    });

    it('a type replaced, with a comment elsewhere, applies as today (mutant: any comment asks)', () => {
        const bool = port.text.indexOf('Bool');
        const { plan, guard } = read(typed([{ at: bool, remove: 'Bool'.length, text: 'Word(1)' }, { at: lineOf('p3'), text: '  // note\n' }]));
        expect(deletes(plan)).toEqual(['b1']);
        expect(plan.lines?.length).toBeGreaterThan(0);
        expect(guard).toBeNull();
    });

    it('a trailing comment on a port deletes nothing', () => {
        expect(read(typed([{ at: port.text.indexOf('\n', lineOf('p1')), text: ' // wide' }])).guard).toBeNull();
    });

    it('the bar names the objects commented out', () => {
        expect(editStatusText({ kind: 'guard', deleted: 2, total: 12, all: false, commented: ['Port instr'] }).text).toBe('Not applied · comments out Port instr, confirm below');
        expect(editStatusText({ kind: 'guard', deleted: 4, total: 12, all: false, commented: ['Port instr', 'Port (unnamed)'] }).text)
            .toBe('Not applied · comments out Port instr, Port (unnamed), confirm below');
        expect(editStatusText({ kind: 'guard', deleted: 8, total: 12, all: false, commented: ['Port a', 'Port b', 'Port c', 'Port d'] }).text)
            .toBe('Not applied · comments out Port a, Port b, Port c (+1), confirm below');
    });
});
