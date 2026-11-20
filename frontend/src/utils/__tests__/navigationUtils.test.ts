/**
 * navigationUtils counts the tabs of every editor group (R-MT-30, P-2026-11-19-2336), not of the dock box's first
 * panel only: with one group the count is unchanged; with two the second group's tabs count, and a panel of another
 * rc-dock group (a generator's) does not. DockManager is a fake holding a layout. Mutations each test kills are in its name.
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';

const fake = vi.hoisted(() => ({ dock: null as any }));
vi.mock('../../components/abstract/DockManager', () => ({ default: fake }));

import { getOpenTabsCount, isProjectOverviewPage } from '../navigationUtils';

/** A dock box whose panels hold the tabs named; `group` sets the rc-dock group of every panel. */
function layoutOf(panels: { tabs: string[]; group?: string }[]) {
    const dockbox = { mode: 'horizontal', children: panels.map((p, i) => ({ id: `p${i}`, group: p.group, tabs: p.tabs.map(id => ({ id })) })) };
    return { getLayout: () => ({ dockbox }) };
}

beforeEach(() => { fake.dock = null; });

describe('navigationUtils with editor groups', () => {
    it('one group with the project page only is the overview (kills: overview never true)', () => {
        fake.dock = layoutOf([{ tabs: ['project_summary'], group: 'models' }]);
        expect(isProjectOverviewPage()).toBe(true);
        expect(getOpenTabsCount()).toBe(1);
    });

    it('one group with a model open is not the overview (kills: overview always true)', () => {
        fake.dock = layoutOf([{ tabs: ['project_summary', 'M1'], group: 'models' }]);
        expect(isProjectOverviewPage()).toBe(false);
        expect(getOpenTabsCount()).toBe(2);
    });

    it('a model open in the second group counts (kills: dockbox.children[0] only)', () => {
        fake.dock = layoutOf([{ tabs: ['project_summary'], group: 'models' }, { tabs: ['M1'], group: 'models' }]);
        expect(isProjectOverviewPage()).toBe(false);
        expect(getOpenTabsCount()).toBe(2);
    });

    it('a generator panel is not an editor group (kills: every panel counted)', () => {
        fake.dock = layoutOf([{ tabs: ['project_summary'], group: 'models' }, { tabs: ['codegen_tpl_MM'], group: 'generator' }]);
        expect(isProjectOverviewPage()).toBe(true);
        expect(getOpenTabsCount()).toBe(1);
    });
});
