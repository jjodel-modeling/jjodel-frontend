/**
 * R-JS-2 — in a scope-bound M2 run the wait accepts what the guard accepts.
 *
 * The executor runs, per command, `waitForDependencies` and then, for a bound M2 scope,
 * `checkBoundScope` (`executor.ts:106-137`). Before R-JS-2 the waiter fell back project-wide
 * for every name, so a homonym in another metamodel satisfied a bare dependency at the first
 * poll, before the bound metamodel's own element had reached the resolvers, and the guard then
 * refused the line (`discovery_2026-10-01_jjscript_requeue.md` §3.1, the Petri net of
 * 2026-10-01: `'Node' is not in 'metamodel_1'; qualify as FlowChart::Node ...`).
 *
 * Real resolvers, parser, dependency extraction and guard, on plain-object metamodels. Only
 * `utils` (DockManager, store) and `joiner` (monaco) are stubbed, as `elementWaiter.test.ts`
 * does; that file mocks the resolvers for all its tests, which is why these live here.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ project: null as any }));

vi.mock('../../../joiner', () => ({}));
vi.mock('../utils', () => ({
    getProject: () => h.project,
    // utils.ts:295-306 for a context carrying an id: that metamodel or, when bound, nothing.
    getTargetMetamodel: (ctx: any, project: any) =>
        (project?.metamodels ?? []).find((mm: any) => mm.id === ctx.targetMetamodelId) ?? null,
}));

import { parse } from '../../parser/parser';
import { extractDependencies } from '../dependencies';
import { waitForDependencies } from '../elementWaiter';
import { checkBoundScope } from '../scopeGuard';

function metamodel(name: string, classes: any[] = []) {
    const mm: any = {
        name, id: `mm-${name}`, className: 'DModel', isMetamodel: true,
        packages: [], classes: [], attributes: [], references: [], operations: [],
        parameters: [], literals: [], enumerators: [],
    };
    for (const c of classes) { c.model = mm; mm.classes.push(c); }
    return mm;
}
const cls = (name: string, mmName: string): any =>
    ({ name, className: 'DClass', id: `cls-${mmName}-${name}`, attributes: [], references: [], operations: [] });

function ctx(mm: any, over: Partial<{ scopeBound: boolean; level: 'M1' | 'M2'; targetMetamodelId: string }> = {}): any {
    return {
        projectId: 'p', modelId: 'm1', targetMetamodelId: mm.id, level: 'M2', scopeBound: true,
        history: [], variables: new Map(), ...over,
    };
}

function depsOf(line: string) {
    const parsed = parse(line);
    expect(parsed.success).toBe(true);
    return extractDependencies(parsed.ast!);
}

/** `metamodel_1`'s Node reaches the resolvers only after this delay, as Redux propagation. */
const PROPAGATION_MS = 90;
function nodeArrivesLater(mm: any): void {
    setTimeout(() => { const n = cls('Node', mm.name); n.model = mm; mm.classes.push(n); }, PROPAGATION_MS);
}

const LINE_9 = 'create attribute name in Node type String';

beforeEach(() => { h.project = null; });

describe('waitForDependencies — R-JS-2, a bound M2 run waits in its own metamodel', () => {
    it('a homonym in another metamodel no longer satisfies a bare dependency: the run waits and the guard accepts', async () => {
        const flowChart = metamodel('FlowChart', [cls('Node', 'FlowChart')]);
        const mm1 = metamodel('metamodel_1');
        h.project = { name: 'Notation Demo', metamodels: [flowChart, mm1], models: [] };
        nodeArrivesLater(mm1);

        const deps = depsOf(LINE_9);
        const wait = await waitForDependencies(deps, ctx(mm1));

        expect(wait.allResolved).toBe(true);
        expect(wait.waitedMs).toBeGreaterThanOrEqual(PROPAGATION_MS - 30);
        expect(mm1.classes).toHaveLength(1);
        expect(checkBoundScope(deps, mm1, h.project)).toBeNull();
    });

    it('CONTROL: without the homonym the same run waits and the guard accepts (unchanged)', async () => {
        const mm1 = metamodel('metamodel_1');
        h.project = { name: 'Notation Demo', metamodels: [metamodel('FlowChart'), mm1], models: [] };
        nodeArrivesLater(mm1);

        const deps = depsOf(LINE_9);
        const wait = await waitForDependencies(deps, ctx(mm1));

        expect(wait.allResolved).toBe(true);
        expect(wait.waitedMs).toBeGreaterThanOrEqual(PROPAGATION_MS - 30);
        expect(checkBoundScope(deps, mm1, h.project)).toBeNull();
    });

    it('a qualified name still resolves project-wide at the first poll', async () => {
        const flowChart = metamodel('FlowChart', [cls('Node', 'FlowChart')]);
        const mm1 = metamodel('metamodel_1');
        h.project = { name: 'Notation Demo', metamodels: [flowChart, mm1], models: [] };

        const wait = await waitForDependencies(depsOf('create attribute name in FlowChart::Node type String'), ctx(mm1));

        expect(wait.allResolved).toBe(true);
        expect(wait.waitedMs).toBeLessThan(30);
    });

    it('a run that is not scope-bound keeps the project-wide fallback', async () => {
        const flowChart = metamodel('FlowChart', [cls('Node', 'FlowChart')]);
        const mm1 = metamodel('metamodel_1');
        h.project = { name: 'Notation Demo', metamodels: [flowChart, mm1], models: [] };

        const wait = await waitForDependencies(depsOf(LINE_9), ctx(mm1, { scopeBound: false }));

        expect(wait.allResolved).toBe(true);
        expect(wait.waitedMs).toBeLessThan(30);
    });

    it('an M1 run keeps the project-wide fallback even when bound', async () => {
        const flowChart = metamodel('FlowChart', [cls('Node', 'FlowChart')]);
        const mm1 = metamodel('metamodel_1');
        h.project = {
            name: 'Notation Demo', metamodels: [flowChart, mm1],
            models: [{ id: 'm1', isMetamodel: false, objects: [] }],
        };

        const wait = await waitForDependencies(depsOf(LINE_9), ctx(mm1, { level: 'M1' }));

        expect(wait.allResolved).toBe(true);
        expect(wait.waitedMs).toBeLessThan(30);
    });

    it('a bound run whose metamodel is gone does not wait: the guard refuses at once', async () => {
        const flowChart = metamodel('FlowChart', [cls('Node', 'FlowChart')]);
        h.project = { name: 'Notation Demo', metamodels: [flowChart], models: [] };

        const deps = depsOf(LINE_9);
        const wait = await waitForDependencies(deps, ctx(flowChart, { targetMetamodelId: 'mm-gone' }));

        expect(wait.waitedMs).toBeLessThan(30);
        expect(checkBoundScope(deps, null, h.project)?.code).toBe('SCOPE_NOT_FOUND');
    });
});
