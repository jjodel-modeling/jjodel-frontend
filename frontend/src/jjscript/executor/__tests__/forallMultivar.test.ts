/**
 * `forall a, b in S do ...` at run time (R-FA-7, P-2026-11-02-1332): the parser desugars to nested
 * ForAllArgs, so `executeForAll` runs them with no change. The executor does not import under
 * `environment: 'node'` (monaco, through `joiner`), so `getExecutor` and `buildEvalContext` are
 * replaced by a recorder: what is pinned here is the iteration (product, dependent collection,
 * filter over both variables), the variable substitution into the body, and that the whole
 * statement is one top-level call. The undo step itself is the Run's (`applyAsOneStep`,
 * `redux/reducer/__tests__/undoGroup.test.ts`): `forall` keeps no history of its own.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parse } from '../../parser/parser';
import { planEffects, type PlanWorld } from '../effectsPlanner';
import type { ExecutionContext, ForAllArgs } from '../../types';

const DEFAULT_CLASSES = [
    { name: 'A', attributes: [{ name: 'id' }, { name: 'x' }] },
    { name: 'B', attributes: [{ name: 'id' }] },
    { name: 'A', attributes: [] },
];
const h = vi.hoisted(() => ({ calls: [] as any[], classes: [] as any[], failCall: 0 }));

vi.mock('../executor', () => ({
    getExecutor: () => ({
        executeAST: async (ast: any, context: any) => {
            if (ast.command === 'forall') {
                const { executeForAll } = await import('../commands/forall');
                return executeForAll(ast.args, context);
            }
            h.calls.push(ast);
            if (h.calls.length === h.failCall) {
                return { success: false, command: ast.command, message: 'no', errors: [{ code: 'LEAF_FAILED', message: 'no' }] };
            }
            return { success: true, command: ast.command, message: 'ok' };
        },
    }),
}));
vi.mock('../commands/eval', () => ({
    buildEvalContext: () => ({ classes: h.classes }),
}));

function ctx(): ExecutionContext {
    return { variables: new Map<string, unknown>() } as unknown as ExecutionContext;
}

async function run(src: string) {
    const r = parse(src);
    expect(r.success).toBe(true);
    const { executeForAll } = await import('../commands/forall');
    return executeForAll(r.ast!.args as ForAllArgs, ctx());
}

beforeEach(() => {
    h.calls.length = 0;
    h.classes = DEFAULT_CLASSES;
    h.failCall = 0;
});

describe('forall over several variables, executed', () => {

    it('filter over both variables: ordered pairs of distinct same-name classes, body resolved per pair', async () => {
        const res = await run('forall a, b in classes such that a != b and a.name == b.name do rename b to dup');
        expect(res.success).toBe(true);
        expect(h.calls).toHaveLength(2); // (class0, class2) and (class2, class0)
        expect(h.calls.every(c => c.command === 'rename')).toBe(true);
        expect((res.data as any).total).toBe(2); // the leaf renames, not the three outer iterations
        expect((res.data as any).results).toHaveLength(3); // one inner forall result per class
    });

    it('dependent collection: each x ranges over the attributes of its own c', async () => {
        const res = await run('forall c in classes, x in c.attributes such that x.name == "id" do delete x');
        expect(res.success).toBe(true);
        expect(h.calls.map(c => c.command)).toEqual(['delete', 'delete']); // A.id and B.id
    });

    it('x in A, y in B without a filter is the product', async () => {
        await run('forall c in classes, x in c.attributes do delete x');
        expect(h.calls).toHaveLength(3); // A.id, A.x, B.id
    });

    it('an empty inner collection runs nothing and succeeds', async () => {
        const res = await run('forall c in classes, x in c.attributes such that x.name == nope do delete x');
        expect(res.success).toBe(true);
        expect(h.calls).toHaveLength(0);
        expect(res.message).toBe('forall: 0 elements matched — nothing to do');
    });
});

describe('forall summary counts the leaf commands (P-2026-11-03-1015)', () => {
    it('one rename out of two outer iterations reads 1/1, not 2/2', async () => {
        h.classes = [{ id: 'c1', name: 'A', attributes: [] }, { id: 'c2', name: 'B', attributes: [] }];
        const res = await run('forall a, b in classes such that a.name != b.name and a.id < b.id do rename b to dup');
        expect(h.calls).toHaveLength(1);
        expect(res.success).toBe(true);
        expect(res.message).toBe('forall: 1/1 executed successfully');
        expect(res.data).toMatchObject({ total: 1, successCount: 1, errorCount: 0 });
        expect((res.data as any).results).toHaveLength(2); // per outer iteration, shape unchanged
    });

    it('a failing leaf inside a nested forall is counted as one failed command', async () => {
        // Four leaves over two outer iterations, so leaf and iteration counts cannot agree by chance.
        h.classes = [
            { name: 'A', attributes: [{ name: 'id' }, { name: 'x' }, { name: 'y' }] },
            { name: 'B', attributes: [{ name: 'id' }] },
        ];
        h.failCall = 2; // A.x
        const res = await run('forall c in classes, x in c.attributes do delete x');
        expect(h.calls).toHaveLength(4);
        expect(res.success).toBe(false);
        expect(res.message).toBe('forall: 3 succeeded, 1 failed (4 total)');
        expect(res.data).toMatchObject({ total: 4, successCount: 3, errorCount: 1 });
        expect(res.errors).toEqual([{ code: 'LEAF_FAILED', message: 'no' }]);
    });

    it('one-variable messages are unchanged', async () => {
        expect((await run('forall c in classes do delete c')).message).toBe('forall: 3/3 executed successfully');
        h.calls.length = 0;
        h.failCall = 2;
        expect((await run('forall c in classes do delete c')).message).toBe('forall: 2 succeeded, 1 failed (3 total)');
        expect((await run('forall c in classes such that c.name == nope do delete c')).message)
            .toBe('forall: 0 elements matched — nothing to do');
    });
});

describe('forall over several variables, effects preview', () => {
    const world: PlanWorld = { classes: {}, elements: [] };

    it('plans the two-variable delete as the one-variable form is planned: `unsupported: forall`, no effect', async () => {
        for (const src of [
            'forall c in classes do delete c',
            'forall c in classes, x in c.attributes such that x.name == id do delete x',
            'forall a, b in classes such that a != b do delete b',
        ]) {
            const plan = await planEffects(src, world);
            expect(plan.warnings).toEqual([{ line: 1, code: 'UNSUPPORTED', message: 'unsupported: forall' }]);
            expect(plan.created).toEqual([]);
            expect(plan.error).toBeNull();
        }
    });
});
