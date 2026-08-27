/**
 * NodeProblem registry — session-local, module-level store of "problems"
 * surfaced on a node in the Editor V2 canvas. Producers (uniqueness validator
 * today; future conformance / orphan / validation checks tomorrow) call
 * registerProblem / clearProblem / markResolved; consumers subscribe through
 * useNodeProblems / useActiveOverlayId / useIsHighlighted.
 *
 * Mirrors the OrphanStore pattern (module-level Map + subscribers), matching
 * the codebase convention for session-local UI-only diagnostic state that is
 * immune to undo/redo and not persisted.
 *
 * ID convention: producers assemble `problem.id` as they please. The registry
 * does not enforce a format; it only requires uniqueness of id. The uniqueness
 * producer uses `${kind}:${nodeId}` because a node can carry at most one
 * duplicate-name problem at a time — deterministic dedup without tracking IDs
 * across scans. Future producers with more than one problem of the same kind
 * per node (e.g. conformance violations per constraint) will use longer IDs
 * like `${kind}:${nodeId}:${constraintId}`.
 *
 * Resolved lifecycle: markResolved sets `resolvedAt` and schedules a 5s timer
 * to remove the entry. While an overlay is open on the same node, the timer
 * is paused (not started, or cleared if already running); on overlay close,
 * a fresh 5s timer starts. A re-register of the same id cancels the timer
 * and unsets resolvedAt, preserving createdAt (sticky).
 */

export type NodeProblemSeverity = 'warning' | 'error';
export type NodeProblemKind = 'duplicate-name' | 'conformance';

export interface NodeProblemAction {
    label: string;
    type: 'focus-node' | 'scroll-to-node' | 'custom';
    targetNodeId?: string;
}

// Per-violation detail carried by 'conformance' problems, so the overlay can
// render one row per violation and the indicator can show an aggregate count.
export interface ConformanceProblemDetail {
    violationType: string;
    severity: NodeProblemSeverity;
    message: string;
    /**
     * Name of the METAMODEL element the violation is about, copied verbatim from
     * `ConformanceViolation.metamodelElementName` (model/conformance/ConformanceTypes.ts).
     * Absent when the producing check does not name one.
     *
     * NOT called `featureName`, though that is what it holds for the per-feature checks
     * and what the form matches fields on. Two checks put a CLASS name in it instead —
     * `orphan_object` and `abstract_instantiation` (ConformanceValidator.ts, both in the
     * per-object preamble) — so a name promising a feature would be a lie in exactly the
     * cases a reader would trust it most. The consumer draws the distinction: the form
     * matches it against its field names and treats whatever does not match as a
     * problem of the object rather than of a field.
     *
     * Additive optional property: existing consumers read `p.conformance?.length`
     * (NodeProblemIndicator) and `d.message` (NodeProblemOverlay), so neither sees it.
     */
    metamodelElementName?: string;
}

export interface NodeProblem {
    id: string;
    nodeId: string;
    kind: NodeProblemKind;
    severity: NodeProblemSeverity;
    title: string;
    description: string;
    relatedNodeIds: string[];
    action?: NodeProblemAction;
    // Present only for kind === 'conformance': the aggregated violation list for
    // this object. Drives the popover rows and the per-node count badge.
    conformance?: ConformanceProblemDetail[];
    createdAt: number;
    resolvedAt?: number;
}

const RESOLVED_TTL_MS = 5000;

const problems = new Map<string, NodeProblem>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

type Listener = () => void;
const listeners = new Set<Listener>();

// Per-node snapshot cache — preserves array identity across renders when
// content is unchanged, so useSyncExternalStore can bail out via Object.is.
const EMPTY_PROBLEMS: readonly NodeProblem[] = Object.freeze([]);
const nodeSnapshots = new Map<string, readonly NodeProblem[]>();

let activeOverlayProblemId: string | null = null;

// Expose to window for debugging (mirror of _jjOrphanStore convention).
if (typeof window !== 'undefined') {
    (window as unknown as { _jjNodeProblems: Map<string, NodeProblem> })._jjNodeProblems = problems;
}

function rebuildSnapshots(): void {
    const byNode = new Map<string, NodeProblem[]>();
    for (const p of problems.values()) {
        let arr = byNode.get(p.nodeId);
        if (!arr) { arr = []; byNode.set(p.nodeId, arr); }
        arr.push(p);
    }
    const nextKeys = new Set<string>();
    for (const [nodeId, arr] of byNode) {
        nextKeys.add(nodeId);
        const prev = nodeSnapshots.get(nodeId);
        if (prev && prev.length === arr.length && prev.every((p, i) => p === arr[i])) {
            // content identical — keep the old reference
            continue;
        }
        nodeSnapshots.set(nodeId, arr);
    }
    for (const nodeId of Array.from(nodeSnapshots.keys())) {
        if (!nextKeys.has(nodeId)) nodeSnapshots.delete(nodeId);
    }
}

function notify(): void {
    for (const l of listeners) l();
}

function scheduleResolvedRemoval(problemId: string): void {
    const t = setTimeout(() => {
        timers.delete(problemId);
        problems.delete(problemId);
        rebuildSnapshots();
        notify();
    }, RESOLVED_TTL_MS);
    timers.set(problemId, t);
}

function pauseTimersForNode(nodeId: string): void {
    for (const [id, p] of problems) {
        if (p.nodeId !== nodeId) continue;
        const t = timers.get(id);
        if (t !== undefined) {
            clearTimeout(t);
            timers.delete(id);
        }
    }
}

function resumeTimersForNode(nodeId: string): void {
    for (const [id, p] of problems) {
        if (p.nodeId !== nodeId) continue;
        if (p.resolvedAt === undefined) continue;
        if (timers.has(id)) continue;
        scheduleResolvedRemoval(id);
    }
}

// --- Producer API -----------------------------------------------------------

export function registerProblem(p: NodeProblem): void {
    const existing = problems.get(p.id);
    const timer = timers.get(p.id);
    if (timer !== undefined) {
        clearTimeout(timer);
        timers.delete(p.id);
    }
    const next: NodeProblem = {
        ...p,
        createdAt: existing?.createdAt ?? p.createdAt,
        resolvedAt: undefined,
    };
    problems.set(p.id, next);
    rebuildSnapshots();
    notify();
}

export function clearProblem(problemId: string): void {
    const timer = timers.get(problemId);
    if (timer !== undefined) {
        clearTimeout(timer);
        timers.delete(problemId);
    }
    if (problems.delete(problemId)) {
        rebuildSnapshots();
        notify();
    }
}

export function clearProblemsByNode(nodeId: string): void {
    let changed = false;
    for (const [id, p] of Array.from(problems)) {
        if (p.nodeId !== nodeId) continue;
        const t = timers.get(id);
        if (t !== undefined) { clearTimeout(t); timers.delete(id); }
        problems.delete(id);
        changed = true;
    }
    if (changed) { rebuildSnapshots(); notify(); }
}

export function markResolved(problemId: string): void {
    const existing = problems.get(problemId);
    if (!existing) return;
    if (existing.resolvedAt !== undefined) return;
    problems.set(problemId, { ...existing, resolvedAt: Date.now() });
    rebuildSnapshots();
    // If the overlay is open on this node, defer the timer until close.
    const active = activeOverlayProblemId !== null ? problems.get(activeOverlayProblemId) : null;
    const onActiveNode = active?.nodeId === existing.nodeId;
    if (!onActiveNode) scheduleResolvedRemoval(problemId);
    notify();
}

// --- Subscription / read API -----------------------------------------------

export function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

export function getNodeProblemsSnapshot(nodeId: string): readonly NodeProblem[] {
    return nodeSnapshots.get(nodeId) ?? EMPTY_PROBLEMS;
}

export function getActiveOverlayProblemId(): string | null {
    return activeOverlayProblemId;
}

export function getIsHighlighted(nodeId: string): boolean {
    if (activeOverlayProblemId === null) return false;
    const active = problems.get(activeOverlayProblemId);
    if (!active) return false;
    return active.relatedNodeIds.includes(nodeId);
}

export function setActiveOverlayProblemId(id: string | null): void {
    if (activeOverlayProblemId === id) return;
    const prev = activeOverlayProblemId;
    activeOverlayProblemId = id;
    if (id !== null) {
        const active = problems.get(id);
        if (active) pauseTimersForNode(active.nodeId);
    } else if (prev !== null) {
        const prevProblem = problems.get(prev);
        if (prevProblem) resumeTimersForNode(prevProblem.nodeId);
    }
    notify();
}
