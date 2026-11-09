/**
 * L6 of the multi-tab front (P-2026-11-08-0808): activating a second tab fires EDITOR_TYPE_CHANGE
 * with the decoded model id. The real handleLayoutChange of Dock runs, captured from the props of
 * a mocked PinnableDock through renderToString (node environment, no DOM).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

const h = vi.hoisted(() => ({ state: { idlookup: {} } as any, onLayoutChange: null as any }));

vi.mock('../style.scss', () => ({}));
vi.mock('react-redux', () => ({ connect: () => (c: any) => c }));
vi.mock('../../../joiner', () => ({ store: { getState: () => h.state }, DProject: { getProject: () => null }, DState: {}, DUser: {}, LProject: {}, LUser: {} }));
vi.mock('../../../joiner/types', () => ({ windoww: {} }));
vi.mock('../../editors', () => ({ Collaborative: { Editor: () => null }, Console: () => null, Logger: () => null, MetaData: () => null }));
vi.mock('../../editors/NodeEditor', () => ({ NodeEditor: () => null }));
vi.mock('../DockManager', () => ({ default: { dock: null } }));
vi.mock('../../dock/MyRcDock', async () => {
    const React = await import('react');
    class PinnableDock extends React.Component<any> {
        render() { h.onLayoutChange = this.props.onLayoutChange; return null; }
    }
    return { PinnableDock, TabContent: () => null, TabHeader: () => null };
});
vi.mock('../../environment/consumerMode', () => ({ isConsumerMode: () => false }));
vi.mock('../../dock/TabsOverflowMenu', () => ({ TabsOverflowMenu: () => null }));
vi.mock('../tabs/ModelsSummaryTab', () => ({ default: () => null }));
vi.mock('../../editors/Broker', () => ({ default: () => null }));
vi.mock('../../editors/PermissionModelTab', () => ({ PermissionModelTab: () => null }));
vi.mock('../../editors/MTM', () => ({ MTM: () => null }));
vi.mock('../../../common/libraries/projectModified', () => ({ isProjectModified: () => false }));
vi.mock('../../../components/logo', () => ({ Logo: () => null }));
vi.mock('../../SimpleResizeHandle', () => ({ SimpleResizeHandle: () => null }));

import { DockConnected } from '../Dock';
import { JjodelEvents } from '../../../events/registry';

function capture(): any[] {
    const events: any[] = [];
    const target = new EventTarget();
    target.addEventListener(JjodelEvents.EDITOR_TYPE_CHANGE, (e) => events.push((e as CustomEvent).detail));
    vi.stubGlobal('window', Object.assign(target, { innerWidth: 1600, innerHeight: 900 }));
    return events;
}
const layoutOn = (activeId: string, title?: any) => ({ dockbox: { children: [{ activeId, tabs: [{ id: activeId, title }] }] } });

describe('Dock.handleLayoutChange with a second tab', () => {
    let events: any[];

    beforeEach(() => {
        vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
        vi.stubGlobal('document', { body: { setAttribute: () => {}, removeAttribute: () => {} } });
        events = capture();
        h.state = { idlookup: { M: { id: 'M', className: 'DModel', isMetamodel: false } } };
        h.onLayoutChange = null;
        renderToString(createElement(DockConnected as any, { user: { id: 'u', project: null } }));
        expect(h.onLayoutChange).toBeTypeOf('function');
    });

    it('no title: the decoded id resolves the model and travels in the event', () => {
        h.onLayoutChange(layoutOn('M~tab2'));
        expect(events).toEqual([{ editorType: 'model', modelId: 'M' }]);
    });

    it('a title that carries the type: the model id is still the decoded one', () => {
        h.onLayoutChange(layoutOn('M~tab2', { props: { 'data-type': 'model' } }));
        expect(events).toEqual([{ editorType: 'model', modelId: 'M' }]);
    });

    it('one tab per model: as today', () => {
        h.onLayoutChange(layoutOn('M'));
        expect(events).toEqual([{ editorType: 'model', modelId: 'M' }]);
    });

    it('a tab that is no model fires nothing', () => {
        h.onLayoutChange(layoutOn('project_summary'));
        expect(events).toEqual([]);
    });
});
