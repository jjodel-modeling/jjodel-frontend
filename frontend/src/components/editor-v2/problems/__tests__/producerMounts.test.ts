/**
 * The mount count of a producer per model (multi-tab L4b, P-2026-11-07-0833; discovery
 * discovery_2026-11-06_multi_tab_viewpoints.md §4.2). Every `EditorV2` mounts its own producers,
 * and two tabs on one model write the same ids; the unmount of one tab must not erase what the
 * other still shows. The subject is `acquireProducerMount`: the release runs the clear only when
 * the count of that producer on that model returns to zero.
 *
 * The registry is module state: `vi.resetModules()` before every test. The clear handed in is the
 * shape the producers use, every entry of one kind owned by one model, so the assertions read the
 * registry and not a flag. Each test name says which break of the rule kills it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NodeProblem, NodeProblemKind } from '../registry';

let REG: typeof import('../registry');

beforeEach(async () => {
    vi.resetModules();
    REG = await import('../registry');
});

function problem(id: string, kind: NodeProblemKind, ownerModelId: string): NodeProblem {
    return {
        id, nodeId: `n-${id}`, kind, severity: 'error', title: 't', description: 'd',
        relatedNodeIds: [], ownerModelId, createdAt: 0,
    };
}

/** The clear a producer hands in: every entry of its kind owned by the model, removed. */
function clearOf(kind: NodeProblemKind, modelId: string): () => void {
    return () => { for (const id of REG.getProblemIdsOwnedBy(kind, modelId)) REG.clearProblem(id); };
}

/** One producer mounted on one model, as the producers' effect does it. */
function mount(kind: NodeProblemKind, modelId: string): () => void {
    return REG.acquireProducerMount(kind, modelId, clearOf(kind, modelId));
}

describe('acquireProducerMount', () => {
    it('two mounts and one unmount of one model leave its problems in place (killed by clearing on every release)', () => {
        const releaseA = mount('conformance', 'M');
        mount('conformance', 'M');
        REG.registerProblem(problem('conformance:o1', 'conformance', 'M'));

        releaseA();

        expect(REG.getProblemIdsOwnedBy('conformance', 'M')).toEqual(['conformance:o1']);
    });

    it('the last unmount clears them (killed by never clearing)', () => {
        const releaseA = mount('conformance', 'M');
        const releaseB = mount('conformance', 'M');
        REG.registerProblem(problem('conformance:o1', 'conformance', 'M'));

        releaseA();
        releaseB();

        expect(REG.getProblemIdsOwnedBy('conformance', 'M')).toEqual([]);
    });

    it('a single mount clears on its unmount, as before (killed by an off-by-one on the count)', () => {
        const release = mount('simulation', 'M');
        REG.registerProblem(problem('simulation:o1', 'simulation', 'M'));

        release();

        expect(REG.getProblemIdsOwnedBy('simulation', 'M')).toEqual([]);
    });

    it('different models never affect each other (killed by one count for every model)', () => {
        const releaseX = mount('conformance', 'X');
        const releaseY = mount('conformance', 'Y');
        REG.registerProblem(problem('conformance:x1', 'conformance', 'X'));
        REG.registerProblem(problem('conformance:y1', 'conformance', 'Y'));

        releaseY();
        expect(REG.getProblemIdsOwnedBy('conformance', 'X')).toEqual(['conformance:x1']);
        expect(REG.getProblemIdsOwnedBy('conformance', 'Y')).toEqual([]);

        // Y's count went to zero alone: X is still held by its own mount.
        mount('conformance', 'Y');
        releaseX();
        expect(REG.getProblemIdsOwnedBy('conformance', 'X')).toEqual([]);
    });

    it('the producers of one editor count apart (killed by one count for every producer)', () => {
        // One tab unmounting releases its producers one after another: a shared count would not
        // reach zero on the first release, and that producer would never clear.
        const releaseConf = mount('conformance', 'M');
        mount('simulation', 'M');
        REG.registerProblem(problem('conformance:o1', 'conformance', 'M'));

        releaseConf();

        expect(REG.getProblemIdsOwnedBy('conformance', 'M')).toEqual([]);
    });

    it('a release run twice counts once (killed by a release that is not idempotent)', () => {
        const releaseA = mount('conformance', 'M');
        mount('conformance', 'M');
        REG.registerProblem(problem('conformance:o1', 'conformance', 'M'));

        releaseA();
        releaseA();

        expect(REG.getProblemIdsOwnedBy('conformance', 'M')).toEqual(['conformance:o1']);
    });

    it('the clear of the last instance to unmount is the one that runs (killed by keeping the first clear)', () => {
        const ran: string[] = [];
        const releaseA = REG.acquireProducerMount('conformance', 'M', () => ran.push('A'));
        const releaseB = REG.acquireProducerMount('conformance', 'M', () => ran.push('B'));

        releaseA();
        releaseB();

        expect(ran).toEqual(['B']);
    });
});
