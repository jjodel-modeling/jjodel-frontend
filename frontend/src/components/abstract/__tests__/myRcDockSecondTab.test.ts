/**
 * L6 of the multi-tab front (P-2026-11-08-0808): PinnableDock is the second emitter of
 * EDITOR_TYPE_CHANGE (discovery 2026-11-08 §2b). A second tab is the model's editor, not a summary.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const h = vi.hoisted(() => ({ state: { idlookup: {} } as any }));

vi.mock('../../../joiner', () => ({ store: { getState: () => h.state }, RuntimeAccessible: () => (c: any) => c, U: {}, Log: {}, Try: () => null, windoww: {}, LProject: {}, LUser: {}, DUser: {}, D: {}, L: {}, Point: class {}, Size: class {} }));
vi.mock('jquery', () => ({ default: () => ({}) }));
vi.mock('rc-dock', () => ({ DockLayout: class {} }));
vi.mock('../../dock/MyDock', () => ({ MyPortal: () => null }));
vi.mock('../../dock/DockManagerStyles.scss', () => ({}));

import { PinnableDock } from '../../dock/MyRcDock';
import { JjodelEvents } from '../../../events/registry';

function run(activeId: string) {
    const events: any[] = [];
    const target = new EventTarget();
    target.addEventListener(JjodelEvents.EDITOR_TYPE_CHANGE, (e) => events.push((e as CustomEvent).detail));
    vi.stubGlobal('window', target);
    const self = { getLayout: () => ({ dockbox: { children: [{ activeId }] } }), _lastActiveId: undefined };
    (PinnableDock.prototype as any)._detectActiveTabChange.call(self);
    return events;
}

describe('PinnableDock._detectActiveTabChange with a second tab', () => {
    beforeEach(() => {
        h.state = { idlookup: { M: { className: 'DModel', isMetamodel: false }, MM: { className: 'DModel', isMetamodel: true } } };
    });

    it('a second tab is the model editor, with the decoded id', () => {
        expect(run('M~tab2')).toEqual([{ editorType: 'model', modelId: 'M' }]);
    });

    it('one tab per model: as today', () => {
        expect(run('M')).toEqual([{ editorType: 'model', modelId: 'M' }]);
        expect(run('MM')).toEqual([{ editorType: 'metamodel', modelId: 'MM' }]);
    });

    it('a prefixed tab keeps its id and its type', () => {
        expect(run('doc_M')).toEqual([{ editorType: 'summary', modelId: 'doc_M' }]);
    });
});
