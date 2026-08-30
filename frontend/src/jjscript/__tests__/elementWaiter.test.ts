import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ElementDependency } from '../executor/dependencies';
import type { ExecutionContext } from '../types';

/**
 * Fase 2a — the dependency waiter must resolve M1 instance targets against
 * `model.objects` (the same lookup the M1 handlers use), so a `set` on an
 * already-existing instance exits the poll immediately instead of burning the
 * full MAX_WAIT_MS (~500ms). See docs/discovery/2026-07-06-jjscript-executor-timing.md.
 *
 * The waiter transitively imports the framework (joiner) and the UI-coupled utils
 * (DockManager). In the node test environment those are neither available nor
 * relevant, so we stub them and drive the resolution seams directly:
 *   - joiner → {} (instance.ts only uses its symbols inside unexecuted handlers)
 *   - utils  → getProject returns our fixture project; getTargetMetamodel → null
 *   - resolvers → the M2-only path, controllable per-test (default: resolves nothing)
 * findInstanceByName / resolveTargetModel (from instance.ts) run for real.
 */

// Hoisted mutable state the mocks read (reset in beforeEach).
const h = vi.hoisted(() => ({
    project: null as any,
    m2Resolvable: new Set<string>(),
}));

vi.mock('../../joiner', () => ({}));

vi.mock('../executor/utils', () => ({
    getProject: () => h.project,
    getTargetMetamodel: () => null,
}));

vi.mock('../executor/resolvers', () => ({
    resolveElementInMetamodel: () => null,
    resolveElement: (qn: any) => (qn && h.m2Resolvable.has(qn.raw) ? { id: `m2-${qn.raw}` } : null),
}));

// Imported AFTER the mocks are declared (vi.mock is hoisted above imports by vitest).
import { waitForDependencies } from '../executor/elementWaiter';
import { findInstanceByName, resolveTargetModel } from '../executor/commands/instance';

const MAX_WAIT_MS = 500; // mirrors elementWaiter.ts (not exported)

function makeProject(objects: Array<{ id: string; name: string }>): any {
    const model = { id: 'm1', isMetamodel: false, objects };
    return { models: [model], metamodels: [] };
}

function ctx(level?: 'M1' | 'M2'): ExecutionContext {
    return {
        projectId: 'p1',
        modelId: 'm1',
        targetMetamodelId: 'mm1',
        level,
        history: [],
        variables: new Map(),
    } as ExecutionContext;
}

function dep(name: string, required = true): ElementDependency {
    return { name: { segments: [name], raw: name } as any, role: 'target', required };
}

beforeEach(() => {
    h.project = null;
    h.m2Resolvable = new Set<string>();
});

describe('waitForDependencies — M1 instance resolution', () => {
    it('resolves an existing M1 instance immediately (no poll to cap)', async () => {
        h.project = makeProject([{ id: 'o1', name: 'Alice' }]);
        const res = await waitForDependencies([dep('Alice')], ctx('M1'));
        expect(res.allResolved).toBe(true);
        expect(res.unresolved).toHaveLength(0);
        // Was ~500ms before the fix (dead-poll). Now exits on the first check.
        expect(res.waitedMs).toBeLessThan(50);
    });

    it('still polls to the cap for a genuinely missing M1 instance', async () => {
        h.project = makeProject([{ id: 'o1', name: 'Alice' }]);
        const res = await waitForDependencies([dep('Bob')], ctx('M1'));
        expect(res.allResolved).toBe(false);
        expect(res.unresolved.map(d => d.name.raw)).toContain('Bob');
        // Safety net preserved: waits ~MAX_WAIT_MS before giving up.
        expect(res.waitedMs).toBeGreaterThan(MAX_WAIT_MS - 100);
    });

    it('does NOT resolve instances via model.objects outside M1 context (gating)', async () => {
        // Same instance exists, but level is M2 → the M1 objects lookup must not fire.
        h.project = makeProject([{ id: 'o1', name: 'Alice' }]);
        const res = await waitForDependencies([dep('Alice')], ctx('M2'));
        expect(res.allResolved).toBe(false);
        expect(res.waitedMs).toBeGreaterThan(MAX_WAIT_MS - 100);
    });
});

describe('waitForDependencies — M2 path unchanged', () => {
    it('resolves an M2 element via the existing resolvers immediately', async () => {
        h.project = makeProject([]);
        h.m2Resolvable = new Set(['SomeClass']);
        const res = await waitForDependencies([dep('SomeClass')], ctx('M2'));
        expect(res.allResolved).toBe(true);
        expect(res.waitedMs).toBeLessThan(50);
    });

    it('returns immediately when there are no required dependencies', async () => {
        h.project = makeProject([]);
        const res = await waitForDependencies([dep('Whatever', /* required */ false)], ctx('M1'));
        expect(res).toEqual({ allResolved: true, unresolved: [], waitedMs: 0 });
    });
});

describe('shared M1 lookups (exported from instance.ts)', () => {
    it('findInstanceByName returns the LIST of matches in model.objects', () => {
        const model: any = { objects: [{ id: 'o1', name: 'Alice' }] };
        expect(findInstanceByName(model, 'Alice')).toEqual([{ id: 'o1', name: 'Alice' }]);
        expect(findInstanceByName(model, 'Bob')).toEqual([]);
        expect(findInstanceByName({} as any, 'Alice')).toEqual([]);
    });

    it('returns every homonym, so no caller can silently get "the first"', () => {
        const model: any = { objects: [
            { id: 'o1', name: 'Alice' },
            { id: 'o2', name: 'Bob' },
            { id: 'o3', name: 'Alice' },
        ] };
        expect(findInstanceByName(model, 'Alice').map((o: any) => o.id)).toEqual(['o1', 'o3']);
    });

    it('the empty result is falsy ONLY via .length — the waiter\'s trap', () => {
        // Pinned deliberately. `findUnresolved` used to read this value for truthiness,
        // and [] is truthy: written that way every M1 dependency reads as resolved on the
        // first poll and the commands run before the instance exists, with no compile
        // error. The assertion below is the reason elementWaiter.ts:115 says `.length > 0`.
        const empty = findInstanceByName({ objects: [] } as any, 'Nobody');
        expect(empty).toEqual([]);
        expect(Boolean(empty)).toBe(true);        // the trap, stated
        expect(empty.length > 0).toBe(false);     // the correct test
    });

    it('resolveTargetModel finds the non-metamodel model by id', () => {
        const project: any = { models: [{ id: 'm1', isMetamodel: false, objects: [] }] };
        expect(resolveTargetModel({ modelId: 'm1' } as any, project)?.id).toBe('m1');
        expect(resolveTargetModel({ modelId: 'nope' } as any, project)).toBeNull();
        expect(resolveTargetModel({} as any, project)).toBeNull();
    });
});
