/**
 * A* Manhattan pathfinder with directional cost penalties.
 *
 * Produces grid-aligned paths that avoid obstacles and respect
 * exit/entry side constraints. Includes inline MinHeap for O(log n)
 * open-list operations.
 */

import { ObstacleGrid, type Side } from './ObstacleGrid';

// ── Types ───────────────────────────────────────────────────────

type Direction = 'up' | 'right' | 'down' | 'left';

interface AStarNode {
    col: number;
    row: number;
    g: number;            // cost from start
    f: number;            // g + h
    direction: Direction | null;   // how we arrived at this cell
    parent: AStarNode | null;
}

export interface AStarResult {
    path: Array<{ x: number; y: number }>;   // world coordinates
    success: boolean;
}

// ── MinHeap (inline, ~40 lines) ────────────────────────────────

class MinHeap {
    private data: AStarNode[] = [];

    get size(): number { return this.data.length; }

    push(node: AStarNode): void {
        this.data.push(node);
        this.bubbleUp(this.data.length - 1);
    }

    pop(): AStarNode | undefined {
        const top = this.data[0];
        const last = this.data.pop();
        if (this.data.length > 0 && last) {
            this.data[0] = last;
            this.sinkDown(0);
        }
        return top;
    }

    private bubbleUp(i: number): void {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.data[i].f >= this.data[parent].f) break;
            [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
            i = parent;
        }
    }

    private sinkDown(i: number): void {
        const n = this.data.length;
        while (true) {
            let smallest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;
            if (left < n && this.data[left].f < this.data[smallest].f) smallest = left;
            if (right < n && this.data[right].f < this.data[smallest].f) smallest = right;
            if (smallest === i) break;
            [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
            i = smallest;
        }
    }
}

// ── Direction helpers ───────────────────────────────────────────

/** Offsets for 4 cardinal directions: [dc, dr] */
const MOVES: Array<[number, number, Direction]> = [
    [0, -1, 'up'],
    [1,  0, 'right'],
    [0,  1, 'down'],
    [-1, 0, 'left'],
];

/** Maps a Side to the direction an edge should initially travel. */
function sideToDirection(side: Side): Direction {
    switch (side) {
        case 'top':    return 'up';
        case 'right':  return 'right';
        case 'bottom': return 'down';
        case 'left':   return 'left';
    }
}

/** Returns the opposite direction. */
function oppositeDirection(dir: Direction): Direction {
    switch (dir) {
        case 'up':    return 'down';
        case 'down':  return 'up';
        case 'left':  return 'right';
        case 'right': return 'left';
    }
}

// ── A* implementation ───────────────────────────────────────────

const MAX_ITERATIONS = 10_000;
const TURN_COST = 3;
const WRONG_DIR_COST = 100;

/**
 * Runs A* on the given grid, producing a Manhattan-like path.
 *
 * @param grid - The obstacle grid
 * @param start - World-space start point (on the source node border)
 * @param end - World-space end point (on the target node border)
 * @param startSide - Side the edge exits from the source node
 * @param endSide - Side the edge enters the target node
 */
export function astarManhattan(
    grid: ObstacleGrid,
    start: { x: number; y: number },
    end: { x: number; y: number },
    startSide: Side,
    endSide: Side,
): AStarResult {
    const startCell = grid.toGrid(start.x, start.y);
    const endCell = grid.toGrid(end.x, end.y);

    const requiredStartDir = sideToDirection(startSide);
    const requiredEndApproach = oppositeDirection(sideToDirection(endSide));

    // Manhattan heuristic (in cells)
    const heuristic = (col: number, row: number): number =>
        Math.abs(col - endCell.col) + Math.abs(row - endCell.row);

    const startNode: AStarNode = {
        col: startCell.col,
        row: startCell.row,
        g: 0,
        f: heuristic(startCell.col, startCell.row),
        direction: null,
        parent: null,
    };

    const open = new MinHeap();
    open.push(startNode);

    // Best g-score per cell+direction (direction matters for turn costs)
    const best = new Map<string, number>();
    best.set(`${startCell.col},${startCell.row},`, 0);

    let iterations = 0;

    while (open.size > 0 && iterations < MAX_ITERATIONS) {
        iterations++;
        const current = open.pop()!;

        // Goal reached?
        if (current.col === endCell.col && current.row === endCell.row) {
            // Reconstruct path → world coordinates
            const cells: Array<{ col: number; row: number }> = [];
            let node: AStarNode | null = current;
            while (node) {
                cells.push({ col: node.col, row: node.row });
                node = node.parent;
            }
            cells.reverse();

            const worldPath = cells.map(c => grid.toWorld(c.col, c.row));

            // Snap first and last points to exact world positions
            if (worldPath.length > 0) {
                worldPath[0] = { x: start.x, y: start.y };
                worldPath[worldPath.length - 1] = { x: end.x, y: end.y };
            }

            return { path: simplifyPath(worldPath), success: true };
        }

        // Expand neighbours
        for (const [dc, dr, dir] of MOVES) {
            const nc = current.col + dc;
            const nr = current.row + dr;

            if (!grid.isWalkable(nc, nr)) continue;

            // Base movement cost
            let moveCost = 1;

            // Turn cost: penalise direction changes to reduce bends
            if (current.direction !== null && current.direction !== dir) {
                moveCost += TURN_COST;
            }

            // First step must match the exit side
            if (current.parent === null && dir !== requiredStartDir) {
                moveCost += WRONG_DIR_COST;
            }

            // Arriving at the goal from the wrong direction
            if (nc === endCell.col && nr === endCell.row && dir !== requiredEndApproach) {
                moveCost += WRONG_DIR_COST;
            }

            const newG = current.g + moveCost;
            const key = `${nc},${nr},${dir}`;
            const prev = best.get(key);

            if (prev !== undefined && prev <= newG) continue;
            best.set(key, newG);

            const newNode: AStarNode = {
                col: nc,
                row: nr,
                g: newG,
                f: newG + heuristic(nc, nr),
                direction: dir,
                parent: current,
            };

            open.push(newNode);
        }
    }

    // A* failed (timeout or no path)
    return { path: [], success: false };
}

// ── Path simplification ─────────────────────────────────────────

/**
 * Collapses sequences of collinear points into segments.
 * Keeps only points where direction changes, plus start and end.
 */
export function simplifyPath(
    rawPath: Array<{ x: number; y: number }>,
): Array<{ x: number; y: number }> {
    if (rawPath.length <= 2) return rawPath;

    const result: Array<{ x: number; y: number }> = [rawPath[0]];

    for (let i = 1; i < rawPath.length - 1; i++) {
        const prev = rawPath[i - 1];
        const curr = rawPath[i];
        const next = rawPath[i + 1];

        // Same X (vertical run) or same Y (horizontal run) → skip
        const collinearX = Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5;
        const collinearY = Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5;

        if (!collinearX && !collinearY) {
            result.push(curr);
        }
    }

    result.push(rawPath[rawPath.length - 1]);
    return result;
}
