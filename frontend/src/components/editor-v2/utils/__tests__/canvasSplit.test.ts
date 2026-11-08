import { describe, expect, it } from 'vitest';
import { activateCanvasPane, NO_CANVAS_SPLIT, paneAcceptsPaletteDrop, reconcileCanvasSplit, type CanvasSplit } from '../canvasSplit';

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
