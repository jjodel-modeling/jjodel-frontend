/**
 * JjScript `delete instance` of a container — the handler goes through the delete plan (#171).
 *
 * `executeDeleteInstance` (`commands/instance.ts`) runs here with `joiner` mocked, as in
 * `handleRegistry.test.ts`. The adapters it loads are mocked too (they reach the store), but the
 * plan is the real one: `deletePreflight` builds the preflight and `deletePlan` orders it, both
 * from `jjform`, which imports nothing. So what is asserted is the handler's half: the plan it asks
 * for, what it hands to `applyDelete`, and what it reports.
 *
 * What the store then does with the plan (the contained elements gone, no `father` left dangling,
 * the outside pointer removed by value) is not reachable here: the browser probe of #171
 * (`scripts/smoke/_tmp_171_verify.ts`, 2026-10-06) is what fails when the handler goes back to the
 * bare `.delete()`, 4 FAIL out of 13, and when the drain is removed, V3.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls = vi.hoisted(() => [] as string[]);

vi.mock('../../../joiner', () => ({
    // Only referenced inside handler bodies not called here; stubs let instance.ts load.
    LPointerTargetable: { fromPointer: () => undefined },
    DObject: {},
    DModel: class {},
    SetFieldAction: {},
    TRANSACTION: (_: string, fn: () => void) => fn(),
    LModel: class {},
    LProject: class {},
    LClass: class {},
}));
vi.mock('../../../redux/action/action', () => ({
    COMMIT: vi.fn(() => { calls.push('commit'); }),
}));
vi.mock('../../../components/editor-v2/hooks/shapeAdapter', () => ({
    makeShapeCtx: (modelId: string) => ({ shape: () => ({ enums: {}, classes: {}, modelId }) }),
}));
vi.mock('../../../components/editor-v2/hooks/deleteAdapter', async () => {
    const jjform = await vi.importActual<typeof import('../../../jjform')>('../../../jjform');
    return {
        deletePlan: vi.fn(jjform.deletePlan),
        preflightFor: vi.fn(),
        // The real adapter's own guard: a blocked plan deletes nothing.
        applyDelete: vi.fn((plan: any) => { calls.push('apply'); return plan.blocked ? 0 : plan.deletes.length; }),
    };
});

import { deletePreflight, type DescendantInput } from '../../../jjform';
import { applyDelete, deletePlan, preflightFor } from '../../../components/editor-v2/hooks/deleteAdapter';
import { executeDeleteInstance } from '../commands/instance';
import { clearHandles } from '../handleRegistry';

// --- fixtures ---------------------------------------------------------------

const container = { id: 'sA', name: 'Scenario_A', instanceof: { name: 'Scenario', isSingleton: false }, delete: vi.fn() };
const project: any = { models: [{ id: 'm1', name: 'scen_a', isMetamodel: false, objects: [container] }] };
const context: any = { level: 'M1', modelId: 'm1' };
const args: any = { command: 'delete', elementType: 'instance', target: { segments: ['Scenario_A'], raw: 'Scenario_A' } };

const child = (id: string, depth: number): DescendantInput => ({ id, name: id, cls: 'Phase', childKey: 'pathway', depth });

function preflight(descendants: DescendantInput[], blocked: string | null = null) {
    return deletePreflight({ enums: {}, classes: {} }, {
        id: 'sA', name: 'Scenario_A', cls: 'Scenario', referrers: [], descendants, candidates: [], blocked,
    });
}

beforeEach(() => {
    calls.length = 0;
    clearHandles();
    vi.mocked(applyDelete).mockClear();
    vi.mocked(deletePlan).mockClear();
    container.delete.mockClear();
    vi.mocked(preflightFor).mockReset();
});

// --- the cascade ------------------------------------------------------------

describe('delete instance of a container — the plan, not the bare .delete()', () => {
    it('hands applyDelete the contained elements deepest first, the container last (dies with the bare .delete())', async () => {
        vi.mocked(preflightFor).mockReturnValue(preflight([child('p1', 1), child('s1', 2), child('p2', 1)]));

        const r = await executeDeleteInstance(args, context, project);

        expect(container.delete).not.toHaveBeenCalled();
        expect(preflightFor).toHaveBeenCalledWith('m1', expect.objectContaining({ modelId: 'm1' }), 'sA');
        expect(applyDelete).toHaveBeenCalledTimes(1);
        expect(vi.mocked(applyDelete).mock.calls[0][0].deletes).toEqual(['s1', 'p1', 'p2', 'sA']);
        expect(r.success).toBe(true);
    });

    it('asks for the dirty verdict: nothing written before the deletes (dies with clearRefs or a reassign)', async () => {
        vi.mocked(preflightFor).mockReturnValue(preflight([child('p1', 1)]));

        await executeDeleteInstance(args, context, project);

        const plan = vi.mocked(applyDelete).mock.calls[0][0];
        expect(plan.verdict).toBe('dirty');
        expect(plan.clear).toEqual([]);
        expect(plan.reassign).toEqual([]);
    });

    it('drains the queued writes before it reads the store (dies without settlePendingWrites)', async () => {
        vi.mocked(preflightFor).mockImplementation(() => { calls.push('preflight'); return preflight([]); });

        await executeDeleteInstance(args, context, project);

        expect(calls).toEqual(['commit', 'preflight', 'apply']);
    });
});

// --- what the result says -----------------------------------------------------

describe('delete instance — the result counts what was deleted', () => {
    it('names the contained elements and lists every deleted id (dies if affectedElements is the container alone)', async () => {
        vi.mocked(preflightFor).mockReturnValue(preflight([child('p1', 1), child('s1', 2), child('p2', 1)]));

        const r = await executeDeleteInstance(args, context, project);

        expect(r.message).toBe("Deleted instance 'Scenario_A' and 3 contained elements");
        expect(r.affectedElements).toEqual(['s1', 'p1', 'p2', 'sA']);
    });

    it('one contained element is singular (dies if the plural is unconditional)', async () => {
        vi.mocked(preflightFor).mockReturnValue(preflight([child('p1', 1)]));

        const r = await executeDeleteInstance(args, context, project);

        expect(r.message).toBe("Deleted instance 'Scenario_A' and 1 contained element");
    });

    it('a container that holds nothing keeps the old message (dies if «and 0 contained» is printed)', async () => {
        vi.mocked(preflightFor).mockReturnValue(preflight([]));

        const r = await executeDeleteInstance(args, context, project);

        expect(r.message).toBe("Deleted instance 'Scenario_A'");
        expect(r.affectedElements).toEqual(['sA']);
    });

    it('nothing deleted is a failure, not a success (dies without the zero check)', async () => {
        vi.mocked(preflightFor).mockReturnValue(preflight([child('p1', 1)]));
        vi.mocked(applyDelete).mockReturnValueOnce(0);

        const r = await executeDeleteInstance(args, context, project);

        expect(r.success).toBe(false);
        expect(r.errors?.[0]?.code).toBe('DELETE_INSTANCE_ERROR');
    });

    it('a blocked plan reports its own reason (dies if the reason is dropped)', async () => {
        vi.mocked(preflightFor).mockReturnValue(preflight([], 'Scenario is a singleton'));

        const r = await executeDeleteInstance(args, context, project);

        expect(r.success).toBe(false);
        expect(r.errors?.[0]?.message).toBe('Scenario is a singleton');
    });
});
