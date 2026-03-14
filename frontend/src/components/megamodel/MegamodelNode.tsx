/**
 * MegamodelNode — Rich card node for the Megamodel diagram.
 *
 * Three-zone layout: header (badge + name), body (stat pills + mini-preview),
 * footer (status dot + label). Draggable via mousedown on the card.
 */

import React, { useCallback, useRef } from 'react';
import type { MmNodeKind, MmNodeStats, MmNodeStatus } from './MegamodelEdge';

export interface MegamodelNodeProps {
    id: string;
    kind: MmNodeKind;
    badgeLabel: string;
    name: string;
    typeLabel: string;
    x: number;
    y: number;
    stats: MmNodeStats;
    status: MmNodeStatus;
    previewBars: number[];
    onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    onDoubleClick?: (nodeId: string) => void;
}

// ─── Stat pills per node kind ───────────────────────────────────────────────

function getStatPills(kind: MmNodeKind, stats: MmNodeStats): Array<{ value: number; label: string }> {
    const pills: Array<{ value: number; label: string }> = [];
    if (kind === 'metamodel') {
        if (stats.classCount != null) pills.push({ value: stats.classCount, label: 'classes' });
        if (stats.referenceCount != null) pills.push({ value: stats.referenceCount, label: 'refs' });
        if (stats.attributeCount != null) pills.push({ value: stats.attributeCount, label: 'attrs' });
    } else if (kind === 'model') {
        if (stats.objectCount != null) pills.push({ value: stats.objectCount, label: 'objects' });
        if (stats.linkCount != null) pills.push({ value: stats.linkCount, label: 'links' });
    } else if (kind === 'transformation') {
        if (stats.ruleCount != null) pills.push({ value: stats.ruleCount, label: 'rules' });
        if (stats.mappingCount != null) pills.push({ value: stats.mappingCount, label: 'mappings' });
    }
    return pills;
}

const BAR_COLORS: Record<MmNodeKind, string> = {
    metamodel: '#AFA9EC',
    model: '#FAC775',
    transformation: '#5DCAA5',
    viewpoint: '#FAC775',
};

// ─── Transform icon SVG ─────────────────────────────────────────────────────

const TransformIcon: React.FC = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 5h4l2-3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 9h4l2 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ─── Component ──────────────────────────────────────────────────────────────

const MegamodelNode: React.FC<MegamodelNodeProps> = ({
    id, kind, badgeLabel, name, typeLabel, x, y, stats, status, previewBars, onMouseDown, onDoubleClick,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const pills = getStatPills(kind, stats);
    const hasBars = previewBars.length > 0 && kind !== 'transformation';
    const hasProgress = kind === 'transformation' && stats.completionPercent != null;

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onDoubleClick) return;
        // Flash highlight before opening
        const el = cardRef.current;
        if (el) {
            el.classList.add('mm-card--opening');
            setTimeout(() => onDoubleClick(id), 150);
        } else {
            onDoubleClick(id);
        }
    }, [onDoubleClick, id]);

    return (
        <div
            ref={cardRef}
            className={`mm-card mm-card--${kind}`}
            style={{ left: x, top: y }}
            onMouseDown={(e) => onMouseDown(e, id)}
            onDoubleClick={handleDoubleClick}
            title={onDoubleClick ? `Double-click to open ${name}` : undefined}
        >
            {/* Header */}
            <div className="mm-card__header">
                <div className={`mm-card__badge mm-card__badge--${kind}`}>
                    {kind === 'transformation' ? <TransformIcon /> : badgeLabel}
                </div>
                <div className="mm-card__info">
                    <div className="mm-card__name" title={name}>{name}</div>
                    <div className="mm-card__type">{typeLabel}</div>
                </div>
            </div>

            {/* Body */}
            <div className="mm-card__body">
                {pills.length > 0 && (
                    <div className="mm-card__stats">
                        {pills.map((p, i) => (
                            <div key={i} className="mm-card__pill">
                                <span className="mm-card__pill-value">{p.value}</span>
                                {' '}{p.label}
                            </div>
                        ))}
                    </div>
                )}
                {hasBars && (
                    <div className="mm-card__preview">
                        {previewBars.map((h, i) => (
                            <div
                                key={i}
                                className="mm-card__bar"
                                style={{
                                    height: `${Math.max(4, h * 22)}px`,
                                    background: BAR_COLORS[kind],
                                }}
                            />
                        ))}
                    </div>
                )}
                {hasProgress && (
                    <div className="mm-card__progress">
                        <div className="mm-card__progress-track">
                            <div
                                className="mm-card__progress-fill"
                                style={{ width: `${stats.completionPercent}%` }}
                            />
                        </div>
                        <span className="mm-card__progress-label">
                            {stats.completionPercent}%
                        </span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mm-card__footer">
                <div className={`mm-card__dot mm-card__dot--${status.type}`} />
                <span className="mm-card__status">{status.label}</span>
            </div>
        </div>
    );
};

export default React.memo(MegamodelNode);
