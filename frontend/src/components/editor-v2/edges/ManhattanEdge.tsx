import React, { useState, useCallback } from 'react';
import { BaseEdge, EdgeLabelRenderer, useReactFlow, type EdgeProps } from '@xyflow/react';

/**
 * Manhattan-style edge routing with editable labels:
 * - If source and target are nearly horizontal (|dy| < 5), draw a straight line
 * - Otherwise, draw a Manhattan path with right angles
 * - Double-click label to edit inline
 */
function ManhattanEdge(props: EdgeProps) {
    const {
        id,
        sourceX,
        sourceY,
        targetX,
        targetY,
        label,
        selected,
        markerEnd,
        markerStart,
        style,
    } = props;

    const { setEdges } = useReactFlow();
    const [editing, setEditing] = useState(false);
    const [labelText, setLabelText] = useState(String(label || ''));

    const dy = Math.abs(targetY - sourceY);

    let path: string;

    if (dy < 5) {
        // Straight horizontal line
        path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    } else {
        // Manhattan routing: horizontal -> vertical -> horizontal
        const midX = (sourceX + targetX) / 2;
        path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
    }

    // Calculate label position (center of the edge)
    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

    const onLabelDoubleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setEditing(true);
    }, []);

    const commitLabel = useCallback(() => {
        setEditing(false);
        setEdges(edges => edges.map(e =>
            e.id === id ? { ...e, label: labelText } : e
        ));
    }, [id, labelText, setEdges]);

    const onKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            commitLabel();
        } else if (e.key === 'Escape') {
            setLabelText(String(label || ''));
            setEditing(false);
        }
    }, [commitLabel, label]);

    return (
        <>
            <BaseEdge
                id={id}
                path={path}
                markerEnd={markerEnd}
                markerStart={markerStart}
                style={style}
            />
            <EdgeLabelRenderer>
                <div
                    className={`edge-label ${selected ? 'selected' : ''}`}
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    onDoubleClick={onLabelDoubleClick}
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
            </EdgeLabelRenderer>
        </>
    );
}

export default ManhattanEdge;
