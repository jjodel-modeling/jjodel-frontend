/**
 * Prerequisite PR for the `self` keyword feature: verify that the executor
 * entry points propagate `targetMetamodelId` into the ExecutionContext.
 *
 * No behavioral change for callers that don't bind — those tests live elsewhere.
 * This file asserts only the plumbing: value in → value on context.
 *
 * Minimal window stub: the executor's transitive imports (monaco-editor via the
 * Jjodel joiner layer) reference `window` at module load; running in node with no
 * DOM crashes the import. Aliasing globalThis as window is enough for those
 * read-only references — no jsdom dependency added (see "no new dependencies"
 * constraint). MUST run BEFORE the executor import below.
 */

if (typeof (globalThis as any).window === 'undefined') {
    (globalThis as any).window = globalThis;
}

import { describe, it, expect } from 'vitest';
import { JjScriptExecutor, getExecutor } from '../executor/executor';

describe('ExecutionContext.targetMetamodelId plumbing', () => {
    it('propagates targetMetamodelId through the JjScriptExecutor constructor', () => {
        const executor = new JjScriptExecutor('proj-1', 'model-a', 'metamodel-host-1');
        const ctx = executor.getContext();
        expect(ctx.projectId).toBe('proj-1');
        expect(ctx.modelId).toBe('model-a');
        expect(ctx.targetMetamodelId).toBe('metamodel-host-1');
    });

    it('omitted targetMetamodelId leaves the field undefined', () => {
        const executor = new JjScriptExecutor('proj-1', 'model-a');
        expect(executor.getContext().targetMetamodelId).toBeUndefined();
    });

    it('getExecutor rebuilds the singleton when targetMetamodelId changes', () => {
        // First call binds host A.
        const exec1 = getExecutor('proj-1', 'model-a', 'metamodel-host-A');
        expect(exec1.getContext().targetMetamodelId).toBe('metamodel-host-A');

        // Same project, different host → new instance (cache invalidated).
        const exec2 = getExecutor('proj-1', 'model-a', 'metamodel-host-B');
        expect(exec2.getContext().targetMetamodelId).toBe('metamodel-host-B');
        expect(exec2).not.toBe(exec1);
    });

    it('getExecutor reuses the instance when nothing changes', () => {
        const exec1 = getExecutor('proj-2', 'model-x', 'metamodel-host-stable');
        const exec2 = getExecutor('proj-2', 'model-x', 'metamodel-host-stable');
        expect(exec2).toBe(exec1);
    });
});
