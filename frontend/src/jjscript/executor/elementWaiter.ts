/**
 * JjScript Element Waiter
 * Proactive waiting for element dependencies before command execution
 */

import { ExecutionContext } from '../types';
import { resolveElementInMetamodel, resolveElement } from './resolvers';
import { getProject, getTargetMetamodel } from './utils';
import { ElementDependency } from './dependencies';
import { findInstanceByName, resolveTargetModel } from './commands/instance';
import { LModel, LProject } from '../../joiner';

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
    // Filter to only required dependencies
    const requiredDeps = dependencies.filter(d => d.required);

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

    // In an M1 model editor, dependency targets are DObject instances living in
    // `model.objects` — invisible to the M2-only resolvers below. Resolve them with the
    // SAME lookup the M1 command handlers use (findInstanceByName), so the poll exits at
    // once when the instance already exists instead of burning the full MAX_WAIT_MS.
    const m1Model = context.level === 'M1' ? resolveTargetModel(context, project) : null;

    const startTime = Date.now();
    let elapsed = 0;

    while (elapsed < MAX_WAIT_MS) {
        const unresolved = findUnresolved(requiredDeps, project, targetMetamodel, m1Model);

        if (unresolved.length === 0) {
            return { allResolved: true, unresolved: [], waitedMs: elapsed };
        }

        // Wait before next poll
        await sleep(POLL_INTERVAL_MS);
        elapsed = Date.now() - startTime;
    }

    // Final check after timeout
    const finalUnresolved = findUnresolved(requiredDeps, project, targetMetamodel, m1Model);
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
    m1Model: LModel | null
): ElementDependency[] {
    return deps.filter(dep => {
        // M1: resolve instance targets against `model.objects` with the same lookup the
        // handler uses. Mirrors executeSetInstance's `args.target.segments.join('::') ||
        // args.target.raw` derivation of the instance name.
        if (m1Model) {
            const instanceName = dep.name.segments.join('::') || dep.name.raw;
            // `.length > 0`, never the bare value: `findInstanceByName` returns the LIST of
            // matches (R-S1-3), and an EMPTY ARRAY IS TRUTHY. Written as a truthiness test
            // this would report every M1 dependency as resolved on the first poll — the
            // waiter would exit at once and the commands would run before the instance
            // exists, with no compile error to show for it.
            //
            // Ambiguity is deliberately NOT a refusal here: this is a wait, not a write.
            // Two instances carrying the name means the thing being waited for has arrived;
            // WHICH of them was meant is the question the command handler refuses on.
            if (findInstanceByName(m1Model, instanceName).length > 0) return false; // resolved
        }
        // Try scoped resolution first (matching what the command handlers do)
        if (targetMetamodel) {
            const found = resolveElementInMetamodel(dep.name, targetMetamodel);
            if (found) return false; // resolved
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
