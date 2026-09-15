import { useCallback, useRef } from 'react';
import { useNodeProblems, useActiveOverlayId } from './useNodeProblems';
import { setActiveOverlayProblemId, type NodeProblem } from './registry';
import { NodeProblemOverlay } from './NodeProblemOverlay';
import './NodeProblemIndicator.scss';

interface Props {
    nodeId: string;
}

function pickSeverityClass(problems: readonly NodeProblem[]): 'warning' | 'error' | 'resolved' {
    const active = problems.filter(p => p.resolvedAt === undefined);
    if (active.length === 0) return 'resolved';
    if (active.some(p => p.severity === 'error')) return 'error';
    return 'warning';
}

export function NodeProblemIndicator({ nodeId }: Props) {
    const problems = useNodeProblems(nodeId);
    const activeOverlayId = useActiveOverlayId();
    const dotRef = useRef<HTMLButtonElement>(null);

    // Derived values the click handler closes over. Computed BEFORE any early
    // return; problems[0] is undefined when the node has no problems.
    const primaryProblem = problems[0];
    const primaryId = primaryProblem?.id;
    const isOverlayOpen = primaryId !== undefined && activeOverlayId === primaryId;

    // Rules of hooks: every hook must run on every render, in the same order.
    // Registering a problem for this node flips `problems` empty -> non-empty; if
    // this useCallback sat after the early return below, the hook count would
    // change and React would throw "Rendered more hooks than during the previous
    // render", unmounting the canvas via the error boundary.
    const onDotClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (primaryId === undefined) return;
        if (isOverlayOpen) setActiveOverlayProblemId(null);
        else setActiveOverlayProblemId(primaryId);
    }, [isOverlayOpen, primaryId]);

    if (problems.length === 0) return null;

    const severityClass = pickSeverityClass(problems);

    // Aggregate violation count across this node's active problems. Conformance
    // problems carry a violation list; other kinds count as a single issue.
    // A count > 1 turns the dot into a numbered badge; 1 stays a plain dot.
    const count = problems
        .filter(p => p.resolvedAt === undefined)
        .reduce((n, p) => n + (p.conformance?.length ?? 1), 0);
    const counted = count > 1;

    const title = primaryProblem.resolvedAt !== undefined ? 'Resolved' : primaryProblem.title;

    return (
        <>
            <button
                ref={dotRef}
                type="button"
                className={`node-problem-dot node-problem-dot--${severityClass}${counted ? ' node-problem-dot--counted' : ''}${isOverlayOpen ? ' node-problem-dot--paused' : ''}`}
                onClick={onDotClick}
                onMouseDown={e => e.stopPropagation()}
                title={title}
                aria-label={title}
            >
                {counted ? count : null}
            </button>
            {isOverlayOpen && (
                <NodeProblemOverlay
                    problems={problems}
                    anchorEl={dotRef.current}
                    onClose={() => setActiveOverlayProblemId(null)}
                />
            )}
        </>
    );
}
