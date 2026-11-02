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

const h = vi.hoisted(() => ({ calls: [] as any[] }));

vi.mock('../executor', () => ({
    getExecutor: () => ({
        executeAST: async (ast: any, context: any) => {
            if (ast.command === 'forall') {
                const { executeForAll } = await import('../commands/forall');
                return executeForAll(ast.args, context);
            }
            h.calls.push(ast);
            return { success: true, command: ast.command, message: 'ok' };
        },
    }),
}));
vi.mock('../commands/eval', () => ({
    buildEvalContext: () => ({
        classes: [
            { name: 'A', attributes: [{ name: 'id' }, { name: 'x' }] },
            { name: 'B', attributes: [{ name: 'id' }] },
            { name: 'A', attributes: [] },
        ],
    }),
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

describe('forall over several variables, executed', () => {
    beforeEach(() => { h.calls.length = 0; });

    it('filter over both variables: ordered pairs of distinct same-name classes, body resolved per pair', async () => {
        const res = await run('forall a, b in classes such that a != b and a.name == b.name do rename b to dup');
        expect(res.success).toBe(true);
        expect(h.calls).toHaveLength(2); // (class0, class2) and (class2, class0)
        expect(h.calls.every(c => c.command === 'rename')).toBe(true);
        expect((res.data as any).total).toBe(3); // the outer level: one inner forall per class
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
