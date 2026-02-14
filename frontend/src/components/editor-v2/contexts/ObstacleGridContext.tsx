/**
 * ObstacleGridContext — Shared obstacle grid for A* edge routing.
 *
 * The provider calls useNodes() ONCE and rebuilds the grid on a 100ms debounce.
 * Individual edge components consume the context and only recompute their path
 * when `version` changes or their own source/target coordinates change.
 */

import { createContext, useContext, useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { useNodes } from '@xyflow/react';
import { ObstacleGrid, type Rect } from '../utils/ObstacleGrid';

// ── Context type ────────────────────────────────────────────────

interface ObstacleGridContextType {
    grid: ObstacleGrid | null;
    version: number;   // incremented every time the grid is rebuilt
}

const ObstacleGridCtx = createContext<ObstacleGridContextType>({
    grid: null,
    version: 0,
});

// ── Hook ────────────────────────────────────────────────────────

export function useObstacleGrid(): ObstacleGridContextType {
    return useContext(ObstacleGridCtx);
}

// ── Config ──────────────────────────────────────────────────────

const CELL_SIZE = 10;
const OBSTACLE_PADDING = 20;
const BOUNDS_MARGIN = 200;   // extra world-space margin around the node bounding box
const DEBOUNCE_MS = 100;

// ── Helpers ─────────────────────────────────────────────────────

/** Get absolute bounding rect for a React Flow node. */
function nodeToRect(node: any): Rect {
    const pos = node.internals?.positionAbsolute ?? node.positionAbsolute ?? node.position;
    return {
        x: pos.x,
        y: pos.y,
        width: node.measured?.width ?? node.width ?? 180,
        height: node.measured?.height ?? node.height ?? 80,
    };
}

/**
 * Compute bounding box that contains all given rects, with extra margin.
 */
function computeBounds(rects: Rect[], margin: number): Rect {
    if (rects.length === 0) {
        return { x: -500, y: -500, width: 1000, height: 1000 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const r of rects) {
        if (r.x < minX) minX = r.x;
        if (r.y < minY) minY = r.y;
        if (r.x + r.width > maxX) maxX = r.x + r.width;
        if (r.y + r.height > maxY) maxY = r.y + r.height;
    }

    return {
        x: minX - margin,
        y: minY - margin,
        width: maxX - minX + 2 * margin,
        height: maxY - minY + 2 * margin,
    };
}

// ── Provider ────────────────────────────────────────────────────

interface ObstacleGridProviderProps {
    children: ReactNode;
}

export function ObstacleGridProvider({ children }: ObstacleGridProviderProps) {
    const nodes = useNodes();
    const [grid, setGrid] = useState<ObstacleGrid | null>(null);
    const [version, setVersion] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Rebuild grid on debounce whenever nodes change
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            // Collect rects for ALL nodes (we'll use them for bounds)
            const allRects: Array<{ id: string; type: string | undefined; parentId: string | undefined; rect: Rect }> = [];
            for (const node of nodes) {
                allRects.push({
                    id: node.id,
                    type: node.type,
                    parentId: (node as any).parentId ?? (node as any).parentNode,
                    rect: nodeToRect(node),
                });
            }

            // Compute bounds from all node rects
            const bounds = computeBounds(allRects.map(n => n.rect), BOUNDS_MARGIN);

            // Build grid
            const newGrid = new ObstacleGrid({
                cellSize: CELL_SIZE,
                padding: OBSTACLE_PADDING,
                bounds,
            });

            // Mark obstacles: skip packageNode types (they are containers, not obstacles)
            for (const entry of allRects) {
                if (entry.type === 'packageNode') continue;
                newGrid.markObstacle(entry.rect);
            }

            setGrid(newGrid);
            setVersion(v => v + 1);
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [nodes]);

    const value = useMemo(() => ({ grid, version }), [grid, version]);

    return (
        <ObstacleGridCtx.Provider value={value}>
            {children}
        </ObstacleGridCtx.Provider>
    );
}
