/**
 * The drag state behind the dashboard drop overlay (P-2026-11-08-2115). The cases are those of the discovery report,
 * Q8. Each test name says which break kills it.
 */
import { describe, expect, it } from 'vitest';
import { DashboardDragInput, DashboardDragState, nextDashboardDragState } from '../dashboardFileDrag';

const idle: DashboardDragState = { active: false };
const raised: DashboardDragState = { active: true };
const files = { hasFiles: true, route: 'All', modalOpen: false };

const run = (state: DashboardDragState, input: DashboardDragInput) => nextDashboardDragState(state, input).active;

describe.each(['dragenter', 'dragover'] as const)('%s', (type) => {
    it('raises for files on All Projects with the modal closed (dies if the event no longer raises)', () => {
        expect(run(idle, { type, ...files })).toBe(true);
    });

    it('does not raise without Files, as for a text drag (dies if hasFiles is not read)', () => {
        expect(run(idle, { type, ...files, hasFiles: false })).toBe(false);
    });

    it.each(['Archive', 'Recent', 'Templates'])('does not raise on %s (dies if the route is not read)', (route) => {
        expect(run(idle, { type, ...files, route })).toBe(false);
    });

    it('does not raise with the modal open (dies if modalOpen is not read)', () => {
        expect(run(idle, { type, ...files, modalOpen: true })).toBe(false);
    });

    it('stays raised when nothing disqualifies the drag (dies if a repeated event clears)', () => {
        expect(run(raised, { type, ...files })).toBe(true);
    });

    it('does not clear a raised overlay on a disqualified event (dies if the raised guard clears)', () => {
        expect(run(raised, { type, ...files, hasFiles: false })).toBe(true);
    });

    it('keeps the same object on a disqualified event when idle (dies if a text drag forces a render)', () => {
        expect(nextDashboardDragState(idle, { type, ...files, hasFiles: false })).toBe(idle);
    });

    it('keeps the same object when already raised (dies if every dragover forces a render)', () => {
        expect(nextDashboardDragState(raised, { type, ...files })).toBe(raised);
    });
});

describe('dragleave', () => {
    it('clears with a null related target, the pointer left the window (dies if null reads as inside)', () => {
        expect(run(raised, { type: 'dragleave', relatedTargetInside: null })).toBe(false);
    });

    it('keeps towards a descendant (dies if every dragleave clears)', () => {
        expect(run(raised, { type: 'dragleave', relatedTargetInside: true })).toBe(true);
    });

    it('clears towards an element outside the dashboard (dies if only null clears)', () => {
        expect(run(raised, { type: 'dragleave', relatedTargetInside: false })).toBe(false);
    });

    it('keeps the same object towards a descendant (dies if moving between cards forces a render)', () => {
        expect(nextDashboardDragState(raised, { type: 'dragleave', relatedTargetInside: true })).toBe(raised);
    });
});

describe.each(['drop', 'dragend', 'escape'] as const)('%s', (type) => {
    it('clears (dies if the event is dropped from the clearing branch)', () => {
        expect(run(raised, { type })).toBe(false);
    });

    it('keeps the same object when already idle (dies if a reset on idle forces a render)', () => {
        expect(nextDashboardDragState(idle, { type })).toBe(idle);
    });
});
