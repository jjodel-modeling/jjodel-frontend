/**
 * E1 «Invalid action path 0» (P-2026-10-05-1648; docs/discovery/discovery_2026-10-04_console_errors_demo.md §2).
 *
 * On an in-page open from the dashboard, `U.resetState` queues the empty LOAD in the batch and then runs
 * `DState.init_editor`. The live store still holds the opened project, so `Constructors.DViewPoint` links the
 * Default viewpoint to it (`idlookup.<project>.viewpoints +=`), on a state that does not hold it: the reducer
 * rolls the whole «init jodel state» batch back. The guard: no Default viewpoint for a project the state the
 * batch lands on does not hold.
 *
 * `redux/store.tsx` does not load under this bench through the real joiner (`window is not defined` via the
 * monaco import, CLAUDE.md §17), so the joiner is reduced to what `init_editor` touches, as in
 * `jjscript/executor/__tests__/m1Containment.test.ts`. `DViewPoint.newVP` stands for the write: the constructor
 * it calls is the one that dispatches the link.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
    const g: any = globalThis;
    const win: any = { location: { hash: '#/project?id=P1' } };
    g.window = win;
    // Any name the module reads at load: a constructible, callable stub; a decorator returns its class.
    const stub = (name: string): any => {
        const f: any = function (this: any, ...args: any[]) {
            if (new.target) return;
            if (typeof args[0] === 'function') return args[0];
            return stub(name + '()');
        };
        return new Proxy(f, {
            get(t, k) {
                if (k in t) return t[k];
                if (typeof k === 'symbol') return undefined;
                return (t[k] = stub(name + '.' + String(k)));
            },
        });
    };
    return { win, stub, project: null as any, live: { idlookup: {} } as any, vpCalls: [] as string[] };
});

vi.mock('../../joiner', () => {
    const own: Record<string, any> = {
        TRANSACTION: (_: string, fn: () => void) => fn(),
        DViewPoint: { newVP: (name: string) => { h.vpCalls.push(name); return { id: 'Pointer_ViewPointDefault' }; } },
        Defaults: { Pointer_ViewPointDefault: 'Pointer_ViewPointDefault', viewpoints: ['Pointer_ViewPointDefault'], Pointer_EOBJECT: 'Pointer_EOBJECT' },
        LProject: { getProject: () => h.project },
        LoadAction: { cname: 'LoadAction' },
        store: { getState: () => h.live },
        ShortAttribETypes: { EString: 'EString', EVoid: 'EVoid' },
        DClass: { new: (n: string) => ({ id: 'Pointer_' + n }) },
        SetRootFieldAction: { new: () => true },
        Log: { exDev: () => undefined, ee: () => undefined, ww: () => undefined },
    };
    // The names the module reads at load, or init_editor reads: everything else it imports is a type.
    for (const k of ['UserHistory', 'RuntimeAccessible', 'RuntimeAccessibleClass', 'DPointerTargetable', 'LPointerTargetable', 'U', 'transientProperties']) own[k] ??= h.stub(k);
    return own;
});
vi.mock('../../common/DV', () => ({ DV: h.stub('DV') }));
vi.mock('../../common/U', () => ({ DefaultEClasses: {}, ShortDefaultEClasses: { EObject: 'EObject' } }));
vi.mock('../defaults/views', () => ({ default: h.stub('DefaultViews') }));
vi.mock('../VersionFixer', () => ({ VersionFixer: h.stub('VersionFixer') }));

import { DState } from '../store';

const projectState = (...ids: string[]) => ({ idlookup: Object.fromEntries(ids.map((id) => [id, { id, className: 'DProject' }])) });

describe('DState.init_editor — the Default viewpoint only for a project the batch holds', () => {
    beforeEach(() => {
        h.vpCalls = [];
        h.project = null;
        h.live = projectState();
        h.win.transactionStatus = { pendingActions: [], hasBegun: false, transactionDepthLevel: 0 };
    });

    it('an in-page open (the reset LOAD pending, its state without the project): no Default viewpoint, so no write to idlookup.P1', () => {
        // The measured hash open: the live store holds P1, the batch's one pending action is the reset's LOAD.
        h.project = { id: 'P1' };
        h.live = projectState('P1');
        h.win.transactionStatus = { pendingActions: [{ className: 'LoadAction', value: projectState() }], hasBegun: true, transactionDepthLevel: 1 };
        DState.init_editor();
        expect(h.vpCalls).toEqual([]);
    });

    it('a fresh open (no project resolves from the URL): the Default viewpoint is created, as before', () => {
        DState.init_editor();
        expect(h.vpCalls).toEqual(['Default']);
    });

    it('the project in the state the batch lands on (no LOAD pending, the store holds it): the Default viewpoint is created', () => {
        h.project = { id: 'P1' };
        h.live = projectState('P1');
        DState.init_editor();
        expect(h.vpCalls).toEqual(['Default']);
    });

    it('the pending LOAD decides over the store: a LOAD that holds the project lets the viewpoint join it', () => {
        h.project = { id: 'P1' };
        h.live = projectState();
        // A later action of the batch that is not a LOAD does not replace its state.
        h.win.transactionStatus = { pendingActions: [{ className: 'LoadAction', value: projectState('P1') }, { className: 'SetFieldAction', value: 'x' }], hasBegun: true, transactionDepthLevel: 1 };
        DState.init_editor();
        expect(h.vpCalls).toEqual(['Default']);
    });

    it('two LOADs pending: the batch lands on the last one, so its state decides', () => {
        h.project = { id: 'P1' };
        h.live = projectState('P1');
        h.win.transactionStatus = { pendingActions: [{ className: 'LoadAction', value: projectState('P1') }, { className: 'SetFieldAction', value: 'x' }, { className: 'LoadAction', value: projectState() }], hasBegun: true, transactionDepthLevel: 1 };
        DState.init_editor();
        expect(h.vpCalls).toEqual([]);
    });

    it('no pending LOAD and a store without the project: no Default viewpoint', () => {
        h.project = { id: 'P1' };
        DState.init_editor();
        expect(h.vpCalls).toEqual([]);
    });
});
