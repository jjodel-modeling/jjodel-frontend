import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReactFlow } from '@xyflow/react';
import type { NodeProblem } from './registry';
import './NodeProblemOverlay.scss';

interface Props {
    problems: readonly NodeProblem[];
    anchorEl: HTMLElement | null;
    onClose: () => void;
}

type Direction = 'left' | 'right' | 'top' | 'bottom';

interface Placement {
    left: number;
    top: number;
    direction: Direction;
}

const GAP = 14;
const VIEWPORT_MARGIN = 6;

function oppositeDir(d: Direction): Direction {
    return d === 'left' ? 'right' : d === 'right' ? 'left' : d === 'top' ? 'bottom' : 'top';
}

function computeDirection(
    sourceCenter: { x: number; y: number } | null,
    relatedCenter: { x: number; y: number } | null,
): Direction {
    if (!sourceCenter || !relatedCenter) return 'right';
    const dx = relatedCenter.x - sourceCenter.x;
    const dy = relatedCenter.y - sourceCenter.y;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'bottom' : 'top';
}

function placeAtDirection(
    anchor: DOMRect,
    overlayW: number,
    overlayH: number,
    direction: Direction,
): { left: number; top: number } {
    const cx = anchor.left + anchor.width / 2;
    const cy = anchor.top + anchor.height / 2;
    switch (direction) {
        case 'right':
            return { left: anchor.right + GAP, top: cy - overlayH / 2 };
        case 'left':
            return { left: anchor.left - GAP - overlayW, top: cy - overlayH / 2 };
        case 'bottom':
            return { left: cx - overlayW / 2, top: anchor.bottom + GAP };
        case 'top':
            return { left: cx - overlayW / 2, top: anchor.top - GAP - overlayH };
    }
}

function fitsInViewport(pos: { left: number; top: number }, w: number, h: number): boolean {
    return pos.left >= VIEWPORT_MARGIN
        && pos.top >= VIEWPORT_MARGIN
        && pos.left + w <= window.innerWidth - VIEWPORT_MARGIN
        && pos.top + h <= window.innerHeight - VIEWPORT_MARGIN;
}

function clampInViewport(pos: { left: number; top: number }, w: number, h: number): { left: number; top: number } {
    return {
        left: Math.max(VIEWPORT_MARGIN, Math.min(pos.left, window.innerWidth - w - VIEWPORT_MARGIN)),
        top:  Math.max(VIEWPORT_MARGIN, Math.min(pos.top,  window.innerHeight - h - VIEWPORT_MARGIN)),
    };
}

function pickSeverityClass(problems: readonly NodeProblem[]): 'warning' | 'error' | 'resolved' {
    const active = problems.filter(p => p.resolvedAt === undefined);
    if (active.length === 0) return 'resolved';
    if (active.some(p => p.severity === 'error')) return 'error';
    return 'warning';
}

function isNodeInViewport(nodeId: string): boolean {
    const el = document.querySelector(`.react-flow__node[data-id="${CSS.escape(nodeId)}"]`);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight;
}

export function NodeProblemOverlay({ problems, anchorEl, onClose }: Props) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [placement, setPlacement] = useState<Placement | null>(null);
    const rf = useReactFlow();

    // Outside click + Escape. Any mousedown outside the overlay and outside
    // the anchor dot closes — this covers node-drag-start by default since
    // drag begins with mousedown on a node body.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (overlayRef.current?.contains(target)) return;
            if (anchorEl?.contains(target)) return;
            onClose();
        };
        window.addEventListener('keydown', onKey, true);
        window.addEventListener('mousedown', onMouseDown, true);
        return () => {
            window.removeEventListener('keydown', onKey, true);
            window.removeEventListener('mousedown', onMouseDown, true);
        };
    }, [anchorEl, onClose]);

    // Measure & place. Runs on mount and when the problems or anchor change.
    useLayoutEffect(() => {
        if (!anchorEl || !overlayRef.current) return;
        const anchorRect = anchorEl.getBoundingClientRect();
        const overlayRect = overlayRef.current.getBoundingClientRect();

        const sourceNodeEl = anchorEl.closest('.react-flow__node') as HTMLElement | null;
        const sourceRect = sourceNodeEl?.getBoundingClientRect() ?? null;
        const sourceCenter = sourceRect
            ? { x: sourceRect.left + sourceRect.width / 2, y: sourceRect.top + sourceRect.height / 2 }
            : null;

        const relatedId = problems[0]?.relatedNodeIds?.[0];
        const relatedEl = relatedId
            ? document.querySelector(`.react-flow__node[data-id="${CSS.escape(relatedId)}"]`) as HTMLElement | null
            : null;
        const relatedRect = relatedEl?.getBoundingClientRect() ?? null;
        const relatedCenter = relatedRect
            ? { x: relatedRect.left + relatedRect.width / 2, y: relatedRect.top + relatedRect.height / 2 }
            : null;

        let dir = computeDirection(sourceCenter, relatedCenter);
        let pos = placeAtDirection(anchorRect, overlayRect.width, overlayRect.height, dir);

        if (!fitsInViewport(pos, overlayRect.width, overlayRect.height)) {
            const flippedDir = oppositeDir(dir);
            const flippedPos = placeAtDirection(anchorRect, overlayRect.width, overlayRect.height, flippedDir);
            if (fitsInViewport(flippedPos, overlayRect.width, overlayRect.height)) {
                dir = flippedDir;
                pos = flippedPos;
            } else {
                const candidates: Direction[] = ['right', 'left', 'bottom', 'top'];
                let best: { dir: Direction; pos: { left: number; top: number }; score: number } | null = null;
                for (const d of candidates) {
                    const raw = placeAtDirection(anchorRect, overlayRect.width, overlayRect.height, d);
                    const clamped = clampInViewport(raw, overlayRect.width, overlayRect.height);
                    const score = -(Math.abs(raw.left - clamped.left) + Math.abs(raw.top - clamped.top));
                    if (!best || score > best.score) best = { dir: d, pos: clamped, score };
                }
                if (best) { dir = best.dir; pos = best.pos; }
            }
        }

        setPlacement({ left: pos.left, top: pos.top, direction: dir });
    }, [anchorEl, problems]);

    const onAction = (p: NodeProblem) => {
        if (!p.action?.targetNodeId) return;
        const target = p.action.targetNodeId;
        const inViewport = isNodeInViewport(target);
        if (!inViewport || p.action.type === 'scroll-to-node' || p.action.type === 'focus-node') {
            rf.fitView({ nodes: [{ id: target }], duration: 300, padding: 0.3 });
            rf.setNodes(nodes => nodes.map(n => ({ ...n, selected: n.id === target })));
        }
        onClose();
    };

    const severityClass = pickSeverityClass(problems);
    const style: React.CSSProperties = placement
        ? { left: placement.left, top: placement.top, visibility: 'visible' }
        : { left: -9999, top: -9999, visibility: 'hidden' };

    return createPortal(
        <div
            ref={overlayRef}
            className={`node-problem-overlay node-problem-overlay--${severityClass}`}
            data-direction={placement?.direction ?? 'right'}
            style={style}
            role="dialog"
            onMouseDown={e => e.stopPropagation()}
        >
            <button
                className="node-problem-overlay__close"
                onClick={onClose}
                type="button"
                aria-label="Close"
            >×</button>
            <div className="node-problem-overlay__accent-bar" />
            <div className="node-problem-overlay__problems">
                {problems.map(p => {
                    const isResolved = p.resolvedAt !== undefined;
                    const actionLabel = p.action
                        ? (p.action.targetNodeId && !isNodeInViewport(p.action.targetNodeId)
                            ? 'Scroll to duplicate'
                            : p.action.label)
                        : null;
                    return (
                        <div key={p.id} className="node-problem-overlay__problem">
                            <div className="node-problem-overlay__title">
                                {isResolved ? 'Resolved' : p.title}
                            </div>
                            <div className="node-problem-overlay__description">{p.description}</div>
                            {p.action && !isResolved && actionLabel && (
                                <button
                                    className="node-problem-overlay__action"
                                    onClick={() => onAction(p)}
                                    type="button"
                                >
                                    {actionLabel} →
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="node-problem-overlay__arrow" />
        </div>,
        document.body,
    );
}
