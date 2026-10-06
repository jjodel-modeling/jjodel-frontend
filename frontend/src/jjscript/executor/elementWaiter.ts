/**
 * JjScript Element Waiter
 * Proactive waiting for element dependencies before command execution
 */

import { ExecutionContext } from '../types';
import { resolveElementInMetamodel, resolveElement } from './resolvers';
import { getProject, getTargetMetamodel } from './utils';
import { ElementDependency } from './dependencies';
import { hasReadyInstance, resolveTargetModel } from './commands/instance';
import { LModel, LProject } from '../../joiner';
import { isRetryPass } from './runPasses';

// ============================================
// CONFIGURATION
// ============================================

const POLL_INTERVAL_MS = 30;   // Polling interval (faster than old 150ms retry)
const MAX_WAIT_MS = 500;       // Maximum time to wait for dependencies

// ============================================
// TYPES
// ============================================

export interface WaitResult {
    /** Whether all required dependencies were found */
    allResolved: boolean;
    /** Dependencies that could not be resolved */
    unresolved: ElementDependency[];
    /** Total time spent waiting in ms */
    waitedMs: number;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Wait for all required element dependencies to become resolvable
 * in the Redux store. Returns immediately if there are no dependencies
 * or all dependencies are already resolvable.
 *
 * @param dependencies - Dependencies extracted from command AST
 * @param context - Execution context with project/metamodel info
 * @returns WaitResult indicating whether all required deps were found
 */
export async function waitForDependencies(
    dependencies: ElementDependency[],
    context: ExecutionContext
): Promise<WaitResult> {
    // Filter to only required dependencies (R-JS-1). In a retry pass every dependency is
    // awaited (R-JS-7): the command was deferred because a name did not resolve, and the line
    // that creates it has run, so its target is on its way to the resolvers; not waiting made a
    // forward reference fail again at the first poll and ended the run with nothing retried.
    const requiredDeps = isRetryPass() ? dependencies : dependencies.filter(d => d.required);

    // If no required dependencies, return immediately
    if (requiredDeps.length === 0) {
        return { allResolved: true, unresolved: [], waitedMs: 0 };
    }

    const project = getProject(context);
    if (!project) {
        // No project = can't resolve anything, let the command handler produce the error
        return { allResolved: false, unresolved: requiredDeps, waitedMs: 0 };
    }

    const targetMetamodel = getTargetMetamodel(context, project);

    // In an M1 model editor, dependency targets are DObject instances of the model —
    // invisible to the M2-only resolvers below. Resolve them with the SAME lookup the M1
    // command handlers use (model-wide name, then the run's handle), so the poll exits at
    // once when the instance already exists instead of burning the full MAX_WAIT_MS.
    const m1Model = context.level === 'M1' ? resolveTargetModel(context, project) : null;

    // The executor's own condition for the bound-scope guard (`executor.ts:123`): the wait must
    // not accept a bare name the guard will refuse right after it (R-JS-2).
    const boundM2 = !!context.scopeBound && context.level !== 'M1';

    const startTime = Date.now();
    let elapsed = 0;

    while (elapsed < MAX_WAIT_MS) {
        const unresolved = findUnresolved(requiredDeps, project, targetMetamodel, m1Model, boundM2);

        if (unresolved.length === 0) {
            return { allResolved: true, unresolved: [], waitedMs: elapsed };
        }

        // Wait before next poll
        await sleep(POLL_INTERVAL_MS);
        elapsed = Date.now() - startTime;
    }

    // Final check after timeout
    const finalUnresolved = findUnresolved(requiredDeps, project, targetMetamodel, m1Model, boundM2);
    return {
        allResolved: finalUnresolved.length === 0,
        unresolved: finalUnresolved,
        waitedMs: elapsed
    };
}

// ============================================
// HELPERS
// ============================================

/**
 * Check which dependencies are still unresolvable.
 */
function findUnresolved(
    deps: ElementDependency[],
    project: LProject,
    targetMetamodel: LModel | null,
    m1Model: LModel | null,
    boundM2: boolean
): ElementDependency[] {
    return deps.filter(dep => {
        // M1: resolve instance targets with the same lookup the handler uses. Mirrors
        // executeSetInstance's `args.target.segments.join('::') || args.target.raw`
        // derivation of the instance name.
        if (m1Model) {
            const instanceName = dep.name.segments.join('::') || dep.name.raw;
            // `hasReadyInstance` (R-JS-11): an instance of the model, roots or contained, or the
            // handle this run created once its metaclass is in the store. A bare handle hit is
            // not enough: before its metaclass lands the handler answers NO_METACLASS. Inside,
            // the name list is tested with `.length > 0`, never for truthiness: an EMPTY ARRAY
            // IS TRUTHY, and that test would report every M1 dependency resolved on the first poll.
            //
            // Ambiguity is deliberately NOT a refusal here: this is a wait, not a write.
            // Two instances carrying the name means the thing being waited for has arrived;
            // WHICH of them was meant is the question the command handler refuses on.
            if (hasReadyInstance(m1Model, instanceName)) return false; // resolved
        }
        // Try scoped resolution first (matching what the command handlers do)
        if (targetMetamodel) {
            const found = resolveElementInMetamodel(dep.name, targetMetamodel);
            if (found) return false; // resolved
            // R-JS-2. In a bound M2 run a bare name resolves in the bound metamodel or not at
            // all: `checkBoundScope` refuses one held only by another metamodel. Falling back
            // project-wide here let a homonym elsewhere end the wait before the bound
            // metamodel's own element had reached the resolvers, and the guard then refused
            // the line (`discovery_2026-10-01_jjscript_requeue.md` §3.1). A qualified name
            // still crosses, as it does in the guard; a bound metamodel that is gone leaves
            // `targetMetamodel` null and keeps the fallback, so the guard refuses at once.
            if (boundM2 && dep.name.segments.length === 1) return true; // still unresolved
        }
        // Fallback to project-wide
        const found = resolveElement(dep.name, project);
        return !found; // true = still unresolved
    });
}

/**
 * Simple sleep utility
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
