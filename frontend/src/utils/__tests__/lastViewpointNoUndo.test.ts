/**
 * R-MT-20 (P-2026-11-07-0935): `activateViewpoint(id, { undoable: false })` marks BOTH actions it fires
 * (project.activeViewpoint, then the root viewpoint) with `noUndo`, which the reducer reads to skip the
 * history bookkeeping. Without the option the actions carry no flag, as before.
 *
 * The `joiner` barrel does not load in the bench: it is mocked with action stand-ins that record what fires.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
    const fired: any[] = [];
    const make = (className: string) => (...args: any[]) => ({ className, args, fire() { fired.push(this); return true; } });
    return { fired, make };
});

vi.mock('../../joiner', () => ({
    DPointerTargetable: {}, DViewElement: {}, LPointerTargetable: {}, LViewElement: {}, LViewPoint: {},
    LProject: { getProject: () => ({ __raw: { id: 'P1' } }) },
    SetFieldAction: {
        create: h.make('SetFieldAction'),
        new: (...a: any[]) => h.make('SetFieldAction')(...a).fire(),
    },
    SetRootFieldAction: {
        create: h.make('SetRootFieldAction'),
        new: (...a: any[]) => h.make('SetRootFieldAction')(...a).fire(),
    },
    Defaults: { check: () => false },
    store: { getState: () => ({ idlookup: {} }) },
}));
vi.mock('../../components/Toast/toastDispatch', () => ({ toast: { warning: () => {}, error: () => {}, success: () => {} } }));
vi.mock('../../events/registry', () => ({ JjodelEvents: {} }));
vi.mock('../defaultViewTemplate', () => ({ DEFAULT_VIEW_JSX_STRING: '' }));
vi.mock('../globalCssAudit', () => ({ auditGlobalCss: () => ({ culprits: [], key: '' }), markWarned: () => false }));
vi.mock('../../components/editor-v2/viewpoint/ir/irCreationSeed', () => ({ computeCreationSeed: () => null }));

import { activateViewpoint } from '../lastViewpoint';

beforeEach(() => { h.fired.length = 0; });

describe('activateViewpoint undoable option (R-MT-20)', () => {
    it('with { undoable: false } fires both writes flagged noUndo', () => {
        activateViewpoint('vpB', { undoable: false });
        expect(h.fired.map((a) => a.className)).toEqual(['SetFieldAction', 'SetRootFieldAction']);
        expect(h.fired.map((a) => a.noUndo)).toEqual([true, true]);
        expect(h.fired[0].args.slice(0, 3)).toEqual(['P1', 'activeViewpoint', 'vpB']);
        expect(h.fired[1].args.slice(0, 2)).toEqual(['viewpoint', 'vpB']);
    });

    it('with { undoable: false } writes abstract syntax as null on both fields', () => {
        activateViewpoint(null, { undoable: false });
        expect(h.fired[0].args[2]).toBeNull();
        expect(h.fired[1].args[1]).toBeNull();
        expect(h.fired.every((a) => a.noUndo === true)).toBe(true);
    });

    it('without the option the writes carry no flag (the picker keeps its undo entry)', () => {
        activateViewpoint('vpB');
        expect(h.fired.length).toBe(2);
        expect(h.fired.some((a) => 'noUndo' in a)).toBe(false);
    });
});
