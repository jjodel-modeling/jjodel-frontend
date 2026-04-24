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

    if (problems.length === 0) return null;

    const severityClass = pickSeverityClass(problems);
    const primaryProblem = problems[0];
    const isOverlayOpen = activeOverlayId === primaryProblem.id;

    const onDotClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOverlayOpen) setActiveOverlayProblemId(null);
        else setActiveOverlayProblemId(primaryProblem.id);
    }, [isOverlayOpen, primaryProblem.id]);

    const title = primaryProblem.resolvedAt !== undefined ? 'Resolved' : primaryProblem.title;

    return (
        <>
            <button
                ref={dotRef}
                type="button"
                className={`node-problem-dot node-problem-dot--${severityClass}${isOverlayOpen ? ' node-problem-dot--paused' : ''}`}
                onClick={onDotClick}
                onMouseDown={e => e.stopPropagation()}
                title={title}
                aria-label={title}
            />
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
