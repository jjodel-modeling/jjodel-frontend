/**
 * Lane E2a (P-2026-11-07-0746; R-TXT-54 E4, E5, E6): the pure half of text to canvas selection. The object at the caret
 * is the innermost carried span; the same id is not sent twice; only a click or an arrow key selects, not typing, not a
 * programmatic move; an element the canvas draws as an edge selects nothing.
 */

import { describe, expect, it } from 'vitest';
import { CARET_EXPLICIT, canvasNodeOf, canvasVertexIds, heldOnOpen, selectedOnOpen, innermostSpanAt, isUserCaretMove, lastSelectedOf, nextSelected, revealedRange, selectedSpans } from '../selectionSync';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import type { ObjectSpan } from '../printer';
import { portGrammar, portObjects, PORT_TEXT_CLIKE } from './portCorpus';

// `Family f { members: [ Member a { name = "x" } Member b ] }` as spans: a root, two children, a reference inside a.
//            0         1         2         3         4         5
//            0123456789012345678901234567890123456789012345678901234567
const TEXT = 'Family f { members: [ Member a { name = "x" } Member b ] }';
const ROOT: ObjectSpan = { id: 'f', start: 0, end: TEXT.length };
const A: ObjectSpan = { id: 'a', start: TEXT.indexOf('Member a'), end: TEXT.indexOf('}') + 1 };
const B: ObjectSpan = { id: 'b', start: TEXT.indexOf('Member b'), end: TEXT.indexOf('Member b') + 'Member b'.length };
const SPANS = [ROOT, A, B];

describe('innermostSpanAt', () => {
    it('gives the innermost span holding the offset, the parent first in the list', () => {
        expect(innermostSpanAt(SPANS, TEXT.indexOf('name'))?.id).toBe('a');
        expect(innermostSpanAt(SPANS, TEXT.indexOf('b ]') )?.id).toBe('b');
    });

    it('does not depend on the order of the spans', () => {
        expect(innermostSpanAt([B, A, ROOT], TEXT.indexOf('name'))?.id).toBe('a');
        expect(innermostSpanAt([A, ROOT, B], TEXT.indexOf('members'))?.id).toBe('f');
    });

    it('gives the container when the caret is between its children (E4, a new object not yet applied)', () => {
        expect(innermostSpanAt(SPANS, TEXT.indexOf('members'))?.id).toBe('f');
        expect(innermostSpanAt(SPANS, TEXT.indexOf('] }'))?.id).toBe('f');
    });

    it('gives the owner of a reference token, never its target (E5)', () => {
        const ref = TEXT.indexOf('"x"');
        expect(innermostSpanAt(SPANS, ref)?.id).toBe('a');
    });

    it('counts a caret right after an object as in it, the span that starts there first', () => {
        expect(innermostSpanAt(SPANS, A.end)?.id).toBe('a');
        const left: ObjectSpan = { id: 'l', start: 0, end: 4 };
        const right: ObjectSpan = { id: 'r', start: 4, end: 8 };
        expect(innermostSpanAt([left, right], 4)?.id).toBe('r');
        expect(innermostSpanAt([right, left], 4)?.id).toBe('r');
    });

    it('gives the shorter of two spans that start at the same offset', () => {
        const outer: ObjectSpan = { id: 'o', start: 0, end: 10 };
        const inner: ObjectSpan = { id: 'i', start: 0, end: 4 };
        expect(innermostSpanAt([outer, inner], 2)?.id).toBe('i');
        expect(innermostSpanAt([inner, outer], 2)?.id).toBe('i');
    });

    it('gives null outside every span, and with no spans (E4, objects without a span)', () => {
        expect(innermostSpanAt([A, B], 2)).toBeNull();
        expect(innermostSpanAt([], 0)).toBeNull();
        expect(innermostSpanAt([A], TEXT.length)).toBeNull();
    });

    it('skips a collapsed span, a decoration the edit deleted', () => {
        const gone: ObjectSpan = { id: 'gone', start: 30, end: 30 };
        expect(innermostSpanAt([ROOT, gone], 30)?.id).toBe('f');
    });
});

describe('nextSelected', () => {
    it('sends a new id', () => {
        expect(nextSelected(null, 'a')).toBe('a');
        expect(nextSelected('a', 'b')).toBe('b');
    });

    it('does not send the same id twice', () => {
        expect(nextSelected('a', 'a')).toBeNull();
    });

    it('sends nothing for no object', () => {
        expect(nextSelected('a', null)).toBeNull();
        expect(nextSelected(null, null)).toBeNull();
    });
});

describe('isUserCaretMove', () => {
    it('lets a click and an arrow key through', () => {
        expect(isUserCaretMove({ source: 'mouse', reason: CARET_EXPLICIT })).toBe(true);
        expect(isUserCaretMove({ source: 'keyboard', reason: CARET_EXPLICIT })).toBe(true);
    });

    it('drops typing: a keyboard move with no explicit reason', () => {
        expect(isUserCaretMove({ source: 'keyboard', reason: 0 })).toBe(false);
    });

    it('drops a paste, an undo and a redo', () => {
        expect(isUserCaretMove({ source: 'keyboard', reason: 4 })).toBe(false);
        expect(isUserCaretMove({ source: 'keyboard', reason: 5 })).toBe(false);
        expect(isUserCaretMove({ source: 'keyboard', reason: 6 })).toBe(false);
    });

    it('drops a programmatic setPosition, a setValue and a reprint', () => {
        expect(isUserCaretMove({ source: 'api', reason: 0 })).toBe(false);
        expect(isUserCaretMove({ source: 'api', reason: CARET_EXPLICIT })).toBe(false);
        expect(isUserCaretMove({ source: 'model', reason: 1 })).toBe(false);
        expect(isUserCaretMove({ source: 'restoreState', reason: 0 })).toBe(false);
        expect(isUserCaretMove({ source: 'textual-paths', reason: 0 })).toBe(false);
    });
});

describe('canvasNodeOf', () => {
    it('gives the node of a node pick', () => {
        expect(canvasNodeOf({ kind: 'node', nodeId: 'v1' })).toBe('v1');
    });

    it('gives nothing for an element drawn as an edge, nor its source vertex (E6)', () => {
        expect(canvasNodeOf({ kind: 'edge', edgeId: 'e1', nodeId: 'v1' })).toBeNull();
        expect(canvasNodeOf({ kind: 'edge', edgeId: 'e1', nodeId: null })).toBeNull();
    });

    it('gives nothing when the canvas draws the element not at all', () => {
        expect(canvasNodeOf(null)).toBeNull();
    });
});

describe('canvasVertexIds', () => {
    // A model's graph g with three vertices, one an edge's neighbour; v3 holds a nested vertex v4. Another graph h, of
    // another viewpoint, draws the same element e1 with its own vertex w1. Only v1 is mounted (on screen).
    const lookup: Record<string, any> = {
        g: { className: 'DGraph', subElements: ['v1', 'v2', 'x1', 'v3'] },
        v1: { className: 'DVertex', graph: 'g', model: 'e1' },
        v2: { className: 'DVertex', graph: 'g', model: 'e2' },
        x1: { className: 'DEdge', graph: 'g', model: 'e9' },
        v3: { className: 'DGraphVertex', graph: 'g', model: 'e3', subElements: ['v4'] },
        v4: { className: 'DVoidVertex', graph: 'v3', model: 'e4' },
        h: { className: 'DGraph', subElements: ['w1'] },
        w1: { className: 'DVertex', graph: 'h', model: 'e1' },
    };

    it('gives the vertices of the graphs the mounted nodes belong to, unmounted ones too, the mounted first', () => {
        expect(canvasVertexIds(lookup, ['v1'])).toEqual(['v1', 'v2', 'v3', 'v4']);
    });

    it('never gives a vertex of another graph, which would select nothing on this canvas', () => {
        expect(canvasVertexIds(lookup, ['v1'])).not.toContain('w1');
        expect(canvasVertexIds(lookup, ['w1'])).toEqual(['w1']);
    });

    it('walks into a mounted vertex too: its nested vertices are listed', () => {
        expect(canvasVertexIds(lookup, ['v3'])).toEqual(['v3', 'v1', 'v2', 'v4']);
    });

    it('gives the mounted ids alone when their graph is unknown, and nothing with nothing mounted', () => {
        expect(canvasVertexIds(lookup, ['unknown'])).toEqual(['unknown']);
        expect(canvasVertexIds(lookup, [])).toEqual([]);
    });

    it('ends on a cycle of subElements, listing each vertex once', () => {
        const cyclic: Record<string, any> = {
            g: { className: 'DGraph', subElements: ['a'] },
            a: { className: 'DGraphVertex', graph: 'g', subElements: ['b'] },
            b: { className: 'DVertex', graph: 'a', subElements: ['a'] },
        };
        expect(canvasVertexIds(cyclic, ['a'])).toEqual(['a', 'b']);
    });

    it('lets pickOnCanvas-like lookups find an element whose node is off screen', () => {
        const ids = canvasVertexIds(lookup, ['v1']);
        expect(ids.find(id => lookup[id]?.model === 'e2')).toBe('v2');
    });
});

// Lane E2b (P-2026-11-07-1635; R-TXT-54 E1, E8): canvas to text. The canvas's selected elements to the spans the tab
// highlights, in selection order; an element without a span gives nothing.
describe('selectedSpans', () => {
    it('gives the span of one selected element', () => {
        expect(selectedSpans(SPANS, ['a'])).toEqual([A]);
    });

    it('gives the spans of several, in selection order, not in the order of the spans', () => {
        expect(selectedSpans(SPANS, ['b', 'f'])).toEqual([B, ROOT]);
        expect(selectedSpans(SPANS, ['f', 'b'])).toEqual([ROOT, B]);
    });

    it('gives nothing for an element with no span: stale tab, unprinted object (E8)', () => {
        expect(selectedSpans(SPANS, ['zz'])).toEqual([]);
        expect(selectedSpans(SPANS, ['zz', 'a'])).toEqual([A]);
        expect(selectedSpans(SPANS, [])).toEqual([]);
        expect(selectedSpans([], ['a'])).toEqual([]);
    });

    it('gives nothing for a collapsed span, an object the pending edit deleted', () => {
        const gone: ObjectSpan = { id: 'a', start: 30, end: 30 };
        expect(selectedSpans([ROOT, gone, B], ['a', 'b'])).toEqual([B]);
    });

    it('gives an element once, even listed twice', () => {
        expect(selectedSpans(SPANS, ['a', 'a'])).toEqual([A]);
    });

    it('follows a span that moved after a reprint: the new spans, the same id', () => {
        const moved: ObjectSpan = { id: 'a', start: A.start + 12, end: A.end + 12 };
        expect(selectedSpans([ROOT, moved, B], ['a'])).toEqual([moved]);
    });
});

// Lane F2 (P-2026-11-08-0027; R-TXT-55 F6, F12): a generated line to the model line. The origin's element and feature to
// the range the tab reveals: the feature's item inside the element's carried span, else the object's first line. The port
// corpus through the printer and the parser: the spans and the tree the tab holds, not hand-made ones.
describe('revealedRange', () => {
    const g = portGrammar();
    const printed = printTextModel(g, portObjects());
    const text = printed.text;
    const tree = parseText(text, g).tree;
    const shown = (t: string, r: { start: number; end: number } | null): string | null => (r ? t.slice(r.start, r.end) : null);

    it('gives the item of the feature inside the element\'s span', () => {
        expect(text).toBe(PORT_TEXT_CLIKE);
        expect(shown(text, revealedRange(printed.spans, 'p3', 'driver', text, tree))).toBe('= instr & {} & and(ready)');
        expect(shown(text, revealedRange(printed.spans, 'p1', 'type', text, tree))).toBe('Word(32)');
        expect(shown(text, revealedRange(printed.spans, 'm', 'name', text, tree))).toBe('cpu');
    });

    it('never gives the item of a contained object: the owner\'s own items only', () => {
        expect(shown(text, revealedRange(printed.spans, 'p1', 'width', text, tree))).toBe('instr : Word(32)');
    });

    it('gives the object\'s first line for a feature the text does not write, for no feature, and without the tree', () => {
        expect(shown(text, revealedRange(printed.spans, 'p1', 'driver', text, tree))).toBe('instr : Word(32)');
        expect(shown(text, revealedRange(printed.spans, 'p1', undefined, text, tree))).toBe('instr : Word(32)');
        expect(shown(text, revealedRange(printed.spans, 'p1', 'type', text))).toBe('instr : Word(32)');
    });

    it('gives nothing for an element with no carried span, or a collapsed one (E8)', () => {
        expect(revealedRange(printed.spans, 'zz', 'name', text, tree)).toBeNull();
        expect(revealedRange([], 'p1', 'type', text, tree)).toBeNull();
        expect(revealedRange([{ id: 'p1', start: 30, end: 30 }], 'p1', 'type', text, tree)).toBeNull();
        // A collapsed span before the live one of the same id does not hide it.
        expect(shown(text, revealedRange([{ id: 'p1', start: 30, end: 30 }, ...printed.spans], 'p1', 'type', text, tree))).toBe('Word(32)');
    });

    it('follows the spans and the tree of a reprint: the item where the new text writes it', () => {
        const objects = portObjects().map(o => (o.id === 'm' ? { ...o, slots: { ...o.slots, inputs: ['p1'] } } : o)).filter(o => o.id !== 'p2' && o.id !== 'b1');
        const again = printTextModel(g, objects);
        const r = revealedRange(again.spans, 'p3', 'driver', again.text, parseText(again.text, g).tree);
        expect(again.text).not.toBe(text);
        expect(shown(again.text, r)).toBe('= instr & {} & and(ready)');
        expect(r!.start).toBe(again.text.indexOf('= instr'));
        expect(r!.start).not.toBe(text.indexOf('= instr'));
    });
});

describe('lastSelectedOf', () => {
    it('is the one selected element: the text does not send it again', () => {
        expect(lastSelectedOf(['a'])).toBe('a');
    });

    it('is nothing for no selection or several: a caret in any of them selects it alone', () => {
        expect(lastSelectedOf([])).toBeNull();
        expect(lastSelectedOf(['a', 'b'])).toBeNull();
    });
});

describe('heldOnOpen: the canvas selection read once when the tab opens over it (lane TABFIX, P-2026-11-08-0859)', () => {
    const lookup = { v1: { model: 'e1' }, v2: { model: 'e2' }, plain: {} };

    it('the selected nodes give their model elements, in the order given (dies on the node ids kept, on the order lost)', () => {
        expect(heldOnOpen([], ['v2', 'v1'], lookup)).toEqual(['e2', 'e1']);
    });

    it('a node that is its own element stays, one with no D-object is left out (dies on the resolver replaced by a map)', () => {
        expect(heldOnOpen([], ['plain', 'ghost'], lookup)).toEqual(['plain']);
    });

    it('nothing selected, or nothing resolved, reads nothing (dies on an empty list applied)', () => {
        expect(heldOnOpen([], [], lookup)).toBeNull();
        expect(heldOnOpen([], ['ghost'], lookup)).toBeNull();
    });

    it('a selection the listener already holds is not read over (dies on the held guard dropped)', () => {
        expect(heldOnOpen(['e9'], ['v1'], lookup)).toBeNull();
    });
});

describe('selectedOnOpen: a selected node out of view, read from the store (lane T8e, P-2026-11-08-1625)', () => {
    const lookup = { v1: { className: 'DVertex', model: 'e1' }, g1: { className: 'DGraphVertex', model: 'e2' }, edge: { className: 'DVoidEdge', model: 'e3' }, far: { className: 'DVertex', model: 'other' } };
    const spans = [{ id: 'e1', start: 0, end: 5 }, { id: 'e2', start: 6, end: 9 }, { id: 'e3', start: 10, end: 12 }, { id: 'cut', start: 13, end: 13 }];

    it('no mounted selected node: the last selected vertex, when the text prints its element (dies on the store unread)', () => {
        expect(selectedOnOpen([], 'v1', lookup, spans)).toEqual(['v1']);
        expect(selectedOnOpen([], 'g1', lookup, spans)).toEqual(['g1']);
    });

    it('mounted selected nodes are the selection: the store does not add to them (dies on a union, a stale last node)', () => {
        expect(selectedOnOpen(['g1'], 'v1', lookup, spans)).toEqual(['g1']);
    });

    it('a last selected edge is not a node (dies on the vertex guard dropped)', () => {
        expect(selectedOnOpen([], 'edge', lookup, spans)).toEqual([]);
    });

    it('a vertex of another model, not printed here, reads nothing (dies on the span guard dropped)', () => {
        expect(selectedOnOpen([], 'far', lookup, spans)).toEqual([]);
    });

    it('nothing last selected reads nothing: the empty node of a deselect, a missing field, a vertex gone', () => {
        expect(selectedOnOpen([], '', lookup, spans)).toEqual([]);
        expect(selectedOnOpen([], undefined, lookup, spans)).toEqual([]);
        expect(selectedOnOpen([], 'ghost', lookup, spans)).toEqual([]);
    });

    it('through heldOnOpen, the element is what the tab holds (dies on the vertex id highlighted)', () => {
        expect(heldOnOpen([], selectedOnOpen([], 'v1', lookup, spans), lookup)).toEqual(['e1']);
    });
});
