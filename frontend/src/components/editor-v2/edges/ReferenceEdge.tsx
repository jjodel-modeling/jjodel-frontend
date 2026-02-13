import { useState, useCallback, useMemo } from 'react';
import {
    EdgeLabelRenderer,
    useReactFlow,
    useNodes,
    type EdgeProps,
} from '@xyflow/react';
import type { ReferenceEdgeData, ReferenceKind } from '../types';
import { formatCardinality } from '../types';
import { computeManhattanPath, roundManhattanPath, computeSelfLoopPath } from '../utils/edgeUtils';

function ReferenceEdge(props: EdgeProps) {
    const {
        id,
        sourceX,
        sourceY,
        targetX,
        targetY,
        source,
        target,
        data,
        selected,
        label,
    } = props;

    const edgeData = data as ReferenceEdgeData | undefined;
    const { setEdges } = useReactFlow();
    const nodes = useNodes();
    const [editing, setEditing] = useState(false);
    const [labelText, setLabelText] = useState(String(label || edgeData?.reference?.name || ''));

    const ref = edgeData?.reference;
    const kind: ReferenceKind = ref?.kind || 'association';

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

    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

    const commitLabel = useCallback(() => {
        setEditing(false);
        setEdges((edges) =>
            edges.map((e) => (e.id === id ? { ...e, label: labelText } : e))
        );
    }, [id, labelText, setEdges]);

    const onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                commitLabel();
            } else if (e.key === 'Escape') {
                setLabelText(String(label || ''));
                setEditing(false);
            }
        },
        [commitLabel, label]
    );

    const cardinality = ref ? formatCardinality(ref.lowerBound, ref.upperBound) : '';

    // Marker IDs unique per edge
    const markerFilledId = `diamond-filled-${id}`;
    const markerEmptyId = `diamond-empty-${id}`;
    const markerArrowId = `arrow-${id}`;

    return (
        <>
            <defs>
                {/* Diamante pieno - Composition */}
                <marker
                    id={markerFilledId}
                    viewBox="0 0 12 8"
                    refX="0"
                    refY="4"
                    markerWidth="8"
                    markerHeight="6"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 4 L 6 0 L 12 4 L 6 8 Z" className="reference-marker filled" />
                </marker>

                {/* Diamante vuoto - Aggregation */}
                <marker
                    id={markerEmptyId}
                    viewBox="0 0 12 8"
                    refX="0"
                    refY="4"
                    markerWidth="8"
                    markerHeight="6"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 4 L 6 0 L 12 4 L 6 8 Z" className="reference-marker hollow" />
                </marker>

                {/* Freccia - target */}
                <marker
                    id={markerArrowId}
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                >
                    <path d="M 0 0 L 10 5 L 0 10" className="reference-marker arrow" />
                </marker>
            </defs>

            <path
                d={path}
                fill="none"
                className={`reference-edge ${kind} ${selected ? 'selected' : ''}`}
                markerStart={
                    kind === 'composition' ? `url(#${markerFilledId})` :
                    kind === 'aggregation' ? `url(#${markerEmptyId})` :
                    undefined
                }
                markerEnd={`url(#${markerArrowId})`}
            />

            <EdgeLabelRenderer>
                {/* Label */}
                <div
                    className={`edge-label ${selected ? 'selected' : ''}`}
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 12}px)`,
                        pointerEvents: 'all',
                    }}
                    onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
                >
                    {editing ? (
                        <input
                            autoFocus
                            className="edge-label__input"
                            value={labelText}
                            onChange={(e) => setLabelText(e.target.value)}
                            onBlur={commitLabel}
                            onKeyDown={onKeyDown}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        labelText && <span className="edge-label__text">{labelText}</span>
                    )}
                </div>

                {/* Cardinality badge */}
                {cardinality && (
                    <div
                        className="edge-cardinality"
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${targetX - 30}px, ${targetY - 14}px)`,
                            pointerEvents: 'none',
                        }}
                    >
                        {cardinality}
                    </div>
                )}
            </EdgeLabelRenderer>
        </>
    );
}

export default ReferenceEdge;
