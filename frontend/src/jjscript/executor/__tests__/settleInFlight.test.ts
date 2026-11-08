/**
 * The settle waits for a dispatch already in flight (T8f option A, P-2026-11-08-1759).
 *
 * The race: a write the 300 ms interval flushed has left the transaction buffer but has not reached
 * the store (`Action.fire` schedules the dispatch with a `setTimeout(0)`), so the next script line
 * settled, found nothing buffered and read the old list. The real `action.ts` runs here with its
 * `joiner` mocked; the dispatch of the flush is held by catching its `setTimeout`, so the ordering
 * of the browser's race is forced and no clock decides it. `executeDeleteInstance` is the entry
 * point because its read (`preflightFor`) is one mocked call: the settle is the same for the
 * link and unlink lines.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => {
    (globalThis as any).window = { addEventListener: () => undefined };
    return { events: [] as string[] };
});

vi.mock('../../../joiner', () => ({
    // Stubs that let instance.ts load, as in instanceDelete.test.ts.
    LPointerTargetable: { fromPointer: () => undefined },
    DObject: {},
    DModel: class {},
    SetFieldAction: {},
    TRANSACTION: (_: string, fn: () => void) => fn(),
    LModel: class {},
    LProject: class {},
    LClass: class {},
    // What the real action.ts reads.
    RuntimeAccessible: () => (c: any) => c,
    RuntimeAccessibleClass: class { static set_extend() {} },
    DUser: { current: 'Pointer_user' },
    U: { liveStateChanges: false },
    windoww: { updateDebuggerComponent: () => undefined },
    store: { dispatch: () => { h.events.push('dispatch'); } },
    transientProperties: {},
    Log: { eDevv: () => undefined, ee: () => undefined },
    reducer: () => undefined,
}));
vi.mock('../../../utils/BatchedUpdates', () => ({ batchedUpdates: (fn: () => void) => fn() }));
vi.mock('../../../utils/PerformanceMetrics', () => ({ PerformanceMetrics: {} }));
vi.mock('../../../components/editor-v2/hooks/shapeAdapter', () => ({
    makeShapeCtx: (modelId: string) => ({ shape: () => ({ enums: {}, classes: {}, modelId }) }),
}));
vi.mock('../../../components/editor-v2/hooks/deleteAdapter', () => ({
    deletePlan: () => ({ blocked: null, deletes: ['sA'], clear: [], reassign: [], verdict: 'dirty' }),
    preflightFor: vi.fn(),
    applyDelete: () => 1,
}));

import { BEGIN, COMMIT, END, LoadAction } from '../../../redux/action/action';
import { preflightFor } from '../../../components/editor-v2/hooks/deleteAdapter';
import { executeDeleteInstance } from '../commands/instance';
import { clearHandles } from '../handleRegistry';

const container = { id: 'sA', name: 'Scenario_A', instanceof: { name: 'Scenario', isSingleton: false }, delete: vi.fn() };
const project: any = { models: [{ id: 'm1', name: 'scen_a', isMetamodel: false, objects: [container] }] };
const context: any = { level: 'M1', modelId: 'm1' };
const args: any = { command: 'delete', elementType: 'instance', target: { segments: ['Scenario_A'], raw: 'Scenario_A' } };

/** The interval's flush of one buffered write, with its dispatch caught: the caller lands it. */
function flushWithDispatchHeld(): () => void {
    let held: (() => void) | undefined;
    const spy = vi.spyOn(globalThis, 'setTimeout').mockImplementationOnce(((fn: () => void) => { held = fn; return 0 as any; }) as any);
    new LoadAction({}, false).fire();
    COMMIT(undefined, false);
    spy.mockRestore();
    expect(held).toBeTypeOf('function');
    return held as () => void;
}

beforeEach(() => {
    h.events.length = 0;
    clearHandles();
    vi.mocked(preflightFor).mockReset();
    vi.mocked(preflightFor).mockImplementation((() => { h.events.push('read'); return {} as any; }) as any);
    BEGIN(); // The app keeps a transaction block open.
});

afterEach(() => {
    END();
    vi.restoreAllMocks();
});

describe('settlePendingWrites and a dispatch in flight', () => {
    it('reads after the flushed write has reached the store (dies without the in-flight wait)', async () => {
        const release = flushWithDispatchHeld();
        setTimeout(release, 30);

        await executeDeleteInstance(args, context, project);

        expect(h.events).toEqual(['dispatch', 'read']);
    });

    it('does not wait when nothing is in flight (dies with an unconditional wait, or a count never taken back)', async () => {
        const start = Date.now();

        await executeDeleteInstance(args, context, project);

        expect(h.events).toEqual(['read']);
        expect(Date.now() - start).toBeLessThan(500);
    });

    it('gives up at the bound, reads anyway and warns once (dies without the bound, or with a warning per expiry)', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const release = flushWithDispatchHeld();

        await executeDeleteInstance(args, context, project);
        await executeDeleteInstance(args, context, project);

        expect(h.events).toEqual(['read', 'read']);
        expect(warn).toHaveBeenCalledTimes(1);
        release();
    }, 5000);
});
