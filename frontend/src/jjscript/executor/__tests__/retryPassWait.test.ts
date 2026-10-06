/**
 * R-JS-7 — in a retry pass the dependency wait awaits every dependency of the retried command.
 *
 * R-JS-1 waits only for `required` dependencies, so a `type-reference` (and a `value-reference`)
 * is never awaited. On pass 1 that is right: the forward reference fails at once and is deferred
 * (R-JS-3). On pass 2 it was wrong: the retry ran with no wait, the target created by a later
 * line had not reached the resolvers yet, the retry failed again, and since that pass made no
 * command succeed there was no pass 3 (`discovery_2026-10-01_jjscript_run_slowdown.md` §4.8:
 * line 14 failed on run 1 of every probe variant).
 *
 * Real parser, dependency extraction, waiter and resolvers, and the real `runPasses`, on
 * plain-object metamodels. `execOne` stands in for the executor: it waits as `executor.ts`
 * does, then resolves the reference type the way the `create reference` handler does, in the
 * bound metamodel, and fails with the handler's code when it is missing. Only `utils`
 * (DockManager, store) and `joiner` (monaco) are stubbed, as `elementWaiterScope.test.ts` does.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ project: null as any }));

vi.mock('../../../joiner', () => ({}));
vi.mock('../utils', () => ({
    getProject: () => h.project,
    getTargetMetamodel: (ctx: any, project: any) =>
        (project?.metamodels ?? []).find((mm: any) => mm.id === ctx.targetMetamodelId) ?? null,
}));

import { parse } from '../../parser/parser';
import { extractDependencies } from '../dependencies';
import { waitForDependencies } from '../elementWaiter';
import { resolveElementInMetamodel } from '../resolvers';
import { runPasses, isDeferrable, isRetryPass } from '../runPasses';

function metamodel(name: string) {
    return {
        name, id: `mm-${name}`, className: 'DModel', isMetamodel: true,
        packages: [], classes: [] as any[], attributes: [], references: [], operations: [],
        parameters: [], literals: [], enumerators: [],
    } as any;
}
function addClass(mm: any, name: string): void {
    mm.classes.push({ name, className: 'DClass', id: `cls-${mm.name}-${name}`, model: mm, attributes: [], references: [], operations: [] });
}
const ctx = (mm: any): any => ({
    projectId: 'p', targetMetamodelId: mm.id, level: 'M2', scopeBound: true, history: [], variables: new Map(),
});

/** The class created by a line reaches the resolvers this late, as Redux propagation under load. */
const LATE_MS = 200;

interface Res { success: boolean; errors?: Array<{ code: string }>; waitedMs: number }

/**
 * Lines 14 and 15 of the probe's script, after Book exists: a reference to a class that the
 * next line creates.
 */
const COMMANDS = [
    'create reference reviews in Book type Review',
    'create class Review',
];

function host(mm: any) {
    const log: Array<{ index: number; retry: boolean; waitedMs: number; success: boolean }> = [];
    async function execOne(i: number): Promise<Res> {
        const parsed = parse(COMMANDS[i]);
        const deps = extractDependencies(parsed.ast!);
        const retry = isRetryPass();
        const wait = await waitForDependencies(deps, ctx(mm));
        let res: Res;
        if (i === 1) {
            setTimeout(() => addClass(mm, 'Review'), LATE_MS);
            res = { success: true, waitedMs: wait.waitedMs };
        } else {
            const type = deps.find(d => d.role === 'type-reference')!;
            const found = resolveElementInMetamodel(type.name, mm);
            res = found
                ? { success: true, waitedMs: wait.waitedMs }
                : { success: false, errors: [{ code: 'UNKNOWN_REFERENCE_TYPE' }], waitedMs: wait.waitedMs };
        }
        log.push({ index: i, retry, waitedMs: wait.waitedMs, success: res.success });
        return res;
    }
    return { execOne, log };
}

beforeEach(() => {
    h.project = null;
});

describe('R-JS-7 — a retry pass waits for every dependency', () => {
    it('the forward reference of §4.8 resolves on pass 2 when its target becomes visible 200 ms late', async () => {
        const mm = metamodel('metamodel_1');
        addClass(mm, 'Book');
        h.project = { name: 'p', metamodels: [mm], models: [] };
        const { execOne, log } = host(mm);

        const run = await runPasses(COMMANDS, execOne, isDeferrable);

        expect(run.outcomes.map(o => o.status)).toEqual(['success', 'success']);
        expect(run.outcomes[0].pass).toBe(2);
        const retry = log.find(e => e.index === 0 && e.retry)!;
        expect(retry.success).toBe(true);
        // It waited for the late class instead of failing at the first poll.
        expect(retry.waitedMs).toBeGreaterThanOrEqual(LATE_MS - 60);
    });

    it('CONTROL: on pass 1 a type-reference is still not awaited (R-JS-1): the line fails at once and is deferred', async () => {
        const mm = metamodel('metamodel_1');
        addClass(mm, 'Book');
        h.project = { name: 'p', metamodels: [mm], models: [] };
        const { execOne, log } = host(mm);

        await runPasses(COMMANDS, execOne, isDeferrable);

        const first = log.find(e => e.index === 0 && !e.retry)!;
        expect(first.success).toBe(false);
        expect(first.waitedMs).toBeLessThan(30);
    });

    it('CONTROL: outside a run the waiter keeps R-JS-1, and the flag is down after a run', async () => {
        const mm = metamodel('metamodel_1');
        addClass(mm, 'Book');
        h.project = { name: 'p', metamodels: [mm], models: [] };
        const deps = extractDependencies(parse(COMMANDS[0]).ast!);

        expect(isRetryPass()).toBe(false);
        const wait = await waitForDependencies(deps, ctx(mm));
        expect(wait.allResolved).toBe(true);
        expect(wait.waitedMs).toBeLessThan(30);

        const { execOne } = host(mm);
        await runPasses(COMMANDS, execOne, isDeferrable);
        expect(isRetryPass()).toBe(false);
    });

    it('the flag is lowered even when a retried command throws', async () => {
        let calls = 0;
        const execOne = async (i: number): Promise<Res> => {
            calls++;
            if (calls === 1) return { success: false, errors: [{ code: 'PARENT_NOT_FOUND' }], waitedMs: 0 };
            if (i === 1) return { success: true, waitedMs: 0 };
            throw new Error('boom');
        };

        await expect(runPasses(COMMANDS, execOne, isDeferrable)).rejects.toThrow('boom');
        expect(isRetryPass()).toBe(false);
    });
});
