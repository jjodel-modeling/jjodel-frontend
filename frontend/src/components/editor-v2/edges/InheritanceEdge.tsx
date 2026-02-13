import { useMemo } from 'react';
import { useNodes, type EdgeProps } from '@xyflow/react';
import { computeManhattanPath, roundManhattanPath, computeSelfLoopPath } from '../utils/edgeUtils';

function InheritanceEdge(props: EdgeProps) {
    const { id, sourceX, sourceY, targetX, targetY, source, target, selected } = props;
    const nodes = useNodes();

    const isSelfLoop = source === target;

    const rawPath = useMemo(
        () => computeManhattanPath(sourceX, sourceY, targetX, targetY, source, target, nodes),
        [sourceX, sourceY, targetX, targetY, source, target, nodes]
    );

    const path = useMemo(() => {
        if (isSelfLoop) {
            return computeSelfLoopPath(sourceX, sourceY, targetX, targetY);
        }
        return roundManhattanPath(rawPath, 8);
    }, [rawPath, isSelfLoop, sourceX, sourceY, targetX, targetY]);

    // Marker ID unique per edge
    const markerTriangleId = `inheritance-triangle-${id}`;

    return (
        <>
            <defs>
                {/* Hollow triangle (UML generalization marker) */}
                <marker
                    id={markerTriangleId}
                    viewBox="0 0 14 14"
                    refX="14"
                    refY="7"
                    markerWidth="12"
                    markerHeight="12"
                    orient="auto"
                >
                    <path
                        d="M 0 0 L 14 7 L 0 14 Z"
                        className={`inheritance-marker ${selected ? 'selected' : ''}`}
                    />
                </marker>
            </defs>

            <path
                d={path}
                fill="none"
                className={`inheritance-edge ${selected ? 'selected' : ''}`}
                markerEnd={`url(#${markerTriangleId})`}
            />
        </>
    );
}

export default InheritanceEdge;
