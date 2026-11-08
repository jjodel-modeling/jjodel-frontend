import { describe, expect, it } from 'vitest';
import { activateCanvasPane, NO_CANVAS_SPLIT, paneAcceptsPaletteDrop, paneEventVerdict, reconcileCanvasSplit, type CanvasSplit, type PaneActivation } from '../canvasSplit';

const split = (active: string): CanvasSplit<string> => ({ panes: ['left', 'right'], active });

describe('reconcileCanvasSplit', () => {
    it('starts on the first pane', () => {
        expect(reconcileCanvasSplit(NO_CANVAS_SPLIT, ['left', 'right'])).toEqual({ panes: ['left', 'right'], active: 'left' });
    });
    it('is no split below two panes', () => {
        expect(reconcileCanvasSplit(split('left'), ['left'])).toBe(NO_CANVAS_SPLIT);
        expect(reconcileCanvasSplit(split('left'), [])).toBe(NO_CANVAS_SPLIT);
    });
    it('keeps the active pane while it is still shown', () => {
        expect(reconcileCanvasSplit(split('right'), ['other', 'right'])).toEqual({ panes: ['other', 'right'], active: 'right' });
    });
    it('falls back to the first pane when the active one is gone', () => {
        expect(reconcileCanvasSplit(split('right'), ['left', 'other'])).toEqual({ panes: ['left', 'other'], active: 'left' });
    });
    it('returns the same object when nothing changed', () => {
        const s = split('right');
        expect(reconcileCanvasSplit(s, ['left', 'right'])).toBe(s);
    });
});

describe('activateCanvasPane', () => {
    it('a pointerdown in the other pane switches', () => {
        expect(activateCanvasPane(split('left'), 'right').active).toBe('right');
    });
    it('the active pane changes nothing', () => {
        const s = split('left');
        expect(activateCanvasPane(s, 'left')).toBe(s);
    });
    it('a pane outside the split changes nothing', () => {
        const s = split('left');
        expect(activateCanvasPane(s, 'third')).toBe(s);
    });
    it('no split stays no split', () => {
        expect(activateCanvasPane(NO_CANVAS_SPLIT, 'left')).toBe(NO_CANVAS_SPLIT);
    });
});

describe('paneAcceptsPaletteDrop', () => {
    it('refuses a drop on the inactive pane', () => {
        expect(paneAcceptsPaletteDrop(split('left'), 'right')).toBe(false);
    });
    it('accepts a drop on the active pane', () => {
        expect(paneAcceptsPaletteDrop(split('right'), 'right')).toBe(true);
    });
    it('accepts a drop with no split', () => {
        expect(paneAcceptsPaletteDrop(NO_CANVAS_SPLIT, 'left')).toBe(true);
    });
});

describe('paneEventVerdict', () => {
    const run = (s: CanvasSplit<string>, pane: string, events: Array<{ type: string; detail?: number }>, start: PaneActivation = 'none') => {
        let activation = start;
        return events.map(event => {
            const v = paneEventVerdict(s, pane, activation, event);
            activation = v.activation;
            return v;
        });
    };
    const click = (detail: number) => [{ type: 'pointerdown' }, { type: 'mousedown', detail }, { type: 'pointerup' }, { type: 'mouseup' }, { type: 'click', detail }];

    it('the first pointerdown on the inactive pane activates it and is consumed', () => {
        expect(paneEventVerdict(split('left'), 'right', 'none', { type: 'pointerdown' })).toEqual({ consume: true, activate: true, activation: 'press' });
    });
    it('the whole activating click is consumed, though the pane is active by its mousedown', () => {
        const verdicts = [paneEventVerdict(split('left'), 'right', 'none', click(1)[0])];
        for (const event of click(1).slice(1)) verdicts.push(paneEventVerdict(split('right'), 'right', verdicts[verdicts.length - 1].activation, event));
        expect(verdicts.map(v => v.consume)).toEqual([true, true, true, true, true]);
    });
    it('the next click on the now active pane runs', () => {
        expect(run(split('right'), 'right', click(1), 'click').map(v => v.consume)).toEqual([false, false, false, false, false]);
    });
    it('a double-click that activates the pane stays consumed to its dblclick', () => {
        const verdicts = run(split('right'), 'right', [...click(2).slice(1), { type: 'dblclick', detail: 2 }], 'click');
        expect(verdicts.map(v => v.consume)).toEqual([true, true, true, true, true]);
    });
    it('the context menu of the activating press is consumed', () => {
        expect(run(split('right'), 'right', [{ type: 'mousedown', detail: 1 }, { type: 'contextmenu' }], 'press').map(v => v.consume)).toEqual([true, true]);
    });
    it('a press whose mousedown never came does not swallow the next click', () => {
        expect(run(split('right'), 'right', click(1), 'press').map(v => v.consume)).toEqual([false, false, false, false, false]);
    });
    it('every command of the inactive pane is refused', () => {
        for (const type of ['mousedown', 'click', 'dblclick', 'contextmenu', 'dragstart', 'keydown']) {
            expect(paneEventVerdict(split('left'), 'right', 'none', { type, detail: 1 }).consume).toBe(true);
        }
    });
    it('a key on the active pane runs, whatever the click before it', () => {
        expect(paneEventVerdict(split('right'), 'right', 'click', { type: 'keydown' }).consume).toBe(false);
    });
    it('the active pane runs everything', () => {
        for (const type of ['pointerdown', 'mousedown', 'click', 'dblclick', 'contextmenu', 'dragstart', 'keydown']) {
            expect(paneEventVerdict(split('left'), 'left', 'none', { type, detail: 1 })).toEqual({ consume: false, activate: false, activation: 'none' });
        }
    });
    it('a canvas outside a split runs everything', () => {
        for (const type of ['pointerdown', 'mousedown', 'dblclick', 'keydown']) {
            expect(paneEventVerdict(NO_CANVAS_SPLIT, 'left', 'none', { type, detail: 1 }).consume).toBe(false);
        }
    });
});
