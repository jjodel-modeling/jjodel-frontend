/**
 * The unmount of `InstantiationProblemSync` with two editors on one model (P-2026-11-07-1620, multi-tab L4b's rule
 * carried to the instantiation producer; discovery_2026-11-06_multi_tab_viewpoints.md §4.2). Every `EditorV2` mounts
 * its own producers and two tabs on one model write the same ids: closing one tab must not erase the badges the other
 * still shows, and closing the last one clears them.
 *
 * The subject is the component's own effects, run as React runs them: the component is called as a function with
 * `useEffect` collecting its effects and `useRef` a plain box, every effect run at the mount and every cleanup at the
 * unmount. There is no renderer in the node env, and the barrel is not importable under vitest (monaco ->
 * `window is not defined`), so `joiner` and `react-redux` are stubbed as `UniquenessProblemSync.test.ts` does; the
 * registry runs for real. Fake timers keep the 300 ms run from firing: the debounce is not what is measured. Each test
 * name says which break of the rule kills it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NodeProblem } from '../registry';

const H = vi.hoisted(() => ({ effects: [] as Array<() => void | (() => void)> }));

vi.mock('../../../../joiner', () => ({ store: { getState: () => ({ idlookup: {} }) } }));
vi.mock('react-redux', () => ({ useSelector: () => '' }));
vi.mock('react', async importOriginal => ({
    ...(await importOriginal<typeof import('react')>()),
    useEffect: (fn: () => void | (() => void)) => { H.effects.push(fn); },
    useRef: <T>(current: T) => ({ current }),
}));

let REG: typeof import('../registry');
let SUBJECT: typeof import('../InstantiationProblemSync');

beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    REG = await import('../registry');
    SUBJECT = await import('../InstantiationProblemSync');
});

afterEach(() => {
    vi.useRealTimers();
});

function problem(id: string, ownerModelId: string): NodeProblem {
    return {
        id, nodeId: `n-${id}`, kind: 'instantiation', severity: 'error', title: 't', description: 'd',
        relatedNodeIds: [], ownerModelId, createdAt: 0,
    };
}

/** One editor's producer on `modelid`: its effects run at the mount; the unmount returned runs their cleanups. */
function mount(modelid: string): () => void {
    H.effects = [];
    SUBJECT.InstantiationProblemSync({ modelid, graphId: null });
    const cleanups = H.effects.map(fn => fn()).filter((c): c is () => void => typeof c === 'function');
    return () => { for (const c of cleanups) c(); };
}

describe('InstantiationProblemSync unmount with two editors on one model', () => {
    it('two mounts and one unmount leave the model\'s problems in place (killed by the plain unmount clear)', () => {
        const unmountA = mount('M');
        mount('M');
        REG.registerProblem(problem('instantiation:missing:k@o1', 'M'));

        unmountA();

        expect(REG.getProblemIdsOwnedBy('instantiation', 'M')).toEqual(['instantiation:missing:k@o1']);
    });

    it('the last unmount clears them (killed by never clearing)', () => {
        const unmountA = mount('M');
        const unmountB = mount('M');
        REG.registerProblem(problem('instantiation:missing:k@o1', 'M'));

        unmountA();
        unmountB();

        expect(REG.getProblemIdsOwnedBy('instantiation', 'M')).toEqual([]);
    });
});
