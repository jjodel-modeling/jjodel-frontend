/**
 * MegamodelNode — Single node card in the Megamodel diagram.
 *
 * 188×58 px card with a colored badge, name, and type label.
 * Draggable via mousedown on the card.
 */

import React from 'react';
import type { MmNodeKind } from './MegamodelEdge';

export interface MegamodelNodeProps {
    id: string;
    kind: MmNodeKind;
    badgeLabel: string;
    name: string;
    typeLabel: string;
    x: number;
    y: number;
    onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
}

const MegamodelNode: React.FC<MegamodelNodeProps> = ({
    id, kind, badgeLabel, name, typeLabel, x, y, onMouseDown,
}) => {
    return (
        <div
            className="megamodel-node"
            style={{ left: x, top: y }}
            onMouseDown={(e) => onMouseDown(e, id)}
        >
            <div className={`mm-badge mm-badge--${kind}`}>{badgeLabel}</div>
            <div className="mm-node-info">
                <div className="mm-node-name" title={name}>{name}</div>
                <div className="mm-node-type">{typeLabel}</div>
            </div>
        </div>
    );
};

export default React.memo(MegamodelNode);
