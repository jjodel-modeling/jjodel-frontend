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

const MAX_ITERATIONS = 50_000;
/** Turn penalty — equivalent to 15 cells of straight travel (150 px at 10 px/cell).
 *  Discourages unnecessary bends while keeping A* practical: a path with 2 extra
 *  turns costs +30 cells, so A* only turns when the detour saves 300+ px.
 *  The line-of-sight smoother further reduces unnecessary turns after A* finishes. */
const TURN_COST = 15;
const WRONG_DIR_COST = 50;
/** Softer penalty for breaking the stem near endpoints — high enough to prefer
 *  straight exits/entries but low enough that the path can still turn when an
 *  obstacle is right next to the node.  */
const STEM_COST = 8;
/** Minimum straight stem near endpoints: cells within this Manhattan distance
 *  from start/end are penalised for non-exit/non-approach directions.
 *  3 cells × 10 px/cell ≈ 30 px stem (satisfies the 20-25 px requirement). */
const STEM_CELLS = 3;

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

    const startWalkable = grid.isWalkable(startCell.col, startCell.row);
    const goalWalkable = grid.isWalkable(endCell.col, endCell.row);

    console.log('[A*] Grid:', grid.cols, '×', grid.rows, '=', grid.cols * grid.rows, 'cells,',
        'blocked:', grid.blockedCount);
    console.log('[A*] Start cell:', startCell, 'world:', start, 'walkable:', startWalkable);
    console.log('[A*] Goal cell:', endCell, 'world:', end, 'walkable:', goalWalkable);

    // If start or goal is blocked, A* cannot succeed — bail early
    if (!startWalkable || !goalWalkable) {
        console.log('[A*] FAILED: start or goal cell is BLOCKED!',
            !startWalkable ? 'START BLOCKED' : '', !goalWalkable ? 'GOAL BLOCKED' : '');
        // Check immediate neighbors
        for (const [dc, dr, dir] of MOVES) {
            const nc = startCell.col + dc;
            const nr = startCell.row + dr;
            console.log(`[A*]   start neighbor ${dir}: (${nc},${nr}) walkable=${grid.isWalkable(nc, nr)}`);
        }
        for (const [dc, dr, dir] of MOVES) {
            const nc = endCell.col + dc;
            const nr = endCell.row + dr;
            console.log(`[A*]   goal neighbor ${dir}: (${nc},${nr}) walkable=${grid.isWalkable(nc, nr)}`);
        }
        return { path: [], success: false };
    }

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
            console.log('[A*] SUCCESS after', iterations, 'iterations,', best.size, 'states');

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

            // Stem enforcement: penalise non-exit direction near the start
            // so the path keeps a straight segment exiting the source node.
            // Uses STEM_COST (softer than WRONG_DIR_COST) so paths can still
            // turn early when an obstacle is adjacent to the node.
            const distFromStart = Math.abs(current.col - startCell.col) + Math.abs(current.row - startCell.row);
            if (distFromStart > 0 && distFromStart < STEM_CELLS && dir !== requiredStartDir) {
                moveCost += STEM_COST;
            }

            // Stem enforcement: penalise non-approach direction near the end
            // so the path keeps a straight segment entering the target node.
            const distToEnd = Math.abs(nc - endCell.col) + Math.abs(nr - endCell.row);
            if (distToEnd > 0 && distToEnd < STEM_CELLS && dir !== requiredEndApproach) {
                moveCost += STEM_COST;
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

    // A* failed
    const failReason = open.size === 0
        ? 'OPEN SET EMPTY — goal unreachable (continuous wall of obstacles?)'
        : `ITERATION LIMIT reached (${iterations}/${MAX_ITERATIONS})`;
    console.log('[A*] FAILED:', failReason);
    console.log('[A*] States explored:', best.size, ', open set remaining:', open.size);
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

// ── Line-of-sight smoothing ─────────────────────────────────────

type Pt = { x: number; y: number };

/**
 * Check if an axis-aligned segment from (x1,y1) to (x2,y2) is obstacle-free
 * by walking along the grid. The segment must be horizontal or vertical.
 */
function isSegmentClear(grid: ObstacleGrid, x1: number, y1: number, x2: number, y2: number): boolean {
    const c1 = grid.toGrid(x1, y1);
    const c2 = grid.toGrid(x2, y2);

    if (Math.abs(y1 - y2) < 1) {
        // Horizontal segment — walk columns
        const row = c1.row;
        const minC = Math.min(c1.col, c2.col);
        const maxC = Math.max(c1.col, c2.col);
        for (let c = minC; c <= maxC; c++) {
            if (!grid.isWalkable(c, row)) return false;
        }
        return true;
    }

    if (Math.abs(x1 - x2) < 1) {
        // Vertical segment — walk rows
        const col = c1.col;
        const minR = Math.min(c1.row, c2.row);
        const maxR = Math.max(c1.row, c2.row);
        for (let r = minR; r <= maxR; r++) {
            if (!grid.isWalkable(col, r)) return false;
        }
        return true;
    }

    // Non-axis-aligned → not clear
    return false;
}

/**
 * Check if two points can be connected via a single L-shaped connector
 * (2 orthogonal segments through 1 corner point) without hitting obstacles.
 * Returns the corner point if feasible, or null if both options are blocked.
 */
function findLConnector(grid: ObstacleGrid, a: Pt, b: Pt): Pt | null {
    // Option 1: horizontal first, then vertical — corner at (b.x, a.y)
    const c1: Pt = { x: b.x, y: a.y };
    if (isSegmentClear(grid, a.x, a.y, c1.x, c1.y) &&
        isSegmentClear(grid, c1.x, c1.y, b.x, b.y)) {
        return c1;
    }

    // Option 2: vertical first, then horizontal — corner at (a.x, b.y)
    const c2: Pt = { x: a.x, y: b.y };
    if (isSegmentClear(grid, a.x, a.y, c2.x, c2.y) &&
        isSegmentClear(grid, c2.x, c2.y, b.x, b.y)) {
        return c2;
    }

    return null;
}

/**
 * Single forward greedy smoothing pass.
 * From the start, try to reach the farthest possible point with a direct
 * straight line or L-shaped shortcut. Repeat from the new anchor.
 */
function smoothForward(path: Pt[], grid: ObstacleGrid): Pt[] {
    const result: Pt[] = [path[0]];
    let i = 0;

    while (i < path.length - 1) {
        let bestJ = i + 1;
        let bestCorner: Pt | null = null;

        for (let j = path.length - 1; j > i + 1; j--) {
            const a = path[i];
            const b = path[j];

            // Try straight (same axis)?
            if ((Math.abs(a.x - b.x) < 1 || Math.abs(a.y - b.y) < 1) &&
                isSegmentClear(grid, a.x, a.y, b.x, b.y)) {
                bestJ = j;
                bestCorner = null;
                break;
            }

            // Try L-connector?
            const corner = findLConnector(grid, a, b);
            if (corner) {
                bestJ = j;
                bestCorner = corner;
                break;
            }
        }

        if (bestCorner) {
            result.push(bestCorner);
        }
        result.push(path[bestJ]);
        i = bestJ;
    }

    return result;
}

/**
 * Single backward greedy smoothing pass.
 * From the end, try to reach the farthest possible point backward.
 * This can find shortcuts the forward pass misses.
 */
function smoothBackward(path: Pt[], grid: ObstacleGrid): Pt[] {
    const result: Pt[] = [path[path.length - 1]];
    let i = path.length - 1;

    while (i > 0) {
        let bestJ = i - 1;
        let bestCorner: Pt | null = null;

        for (let j = 0; j < i - 1; j++) {
            const a = path[i];
            const b = path[j];

            // Try straight (same axis)?
            if ((Math.abs(a.x - b.x) < 1 || Math.abs(a.y - b.y) < 1) &&
                isSegmentClear(grid, a.x, a.y, b.x, b.y)) {
                bestJ = j;
                bestCorner = null;
                break;
            }

            // Try L-connector?
            const corner = findLConnector(grid, a, b);
            if (corner) {
                bestJ = j;
                bestCorner = corner;
                break;
            }
        }

        if (bestCorner) {
            result.push(bestCorner);
        }
        result.push(path[bestJ]);
        i = bestJ;
    }

    result.reverse();
    return result;
}

/**
 * Line-of-sight smoothing for A* paths.
 *
 * Runs both forward and backward greedy passes, keeping the shorter result.
 * Iterates up to 3 times until no further improvement is possible.
 * This aggressively reduces the number of segments: an edge going around
 * a single obstacle should have at most 5-7 points.
 */
export function smoothPath(
    path: Pt[],
    grid: ObstacleGrid,
): Pt[] {
    if (path.length <= 3) return path;

    let current = path;

    for (let iter = 0; iter < 3; iter++) {
        const fwd = smoothForward(current, grid);
        const bwd = smoothBackward(current, grid);

        // Keep the shorter of the two passes
        const best = fwd.length <= bwd.length ? fwd : bwd;

        if (best.length >= current.length) break; // no improvement
        current = best;
        if (current.length <= 3) break; // already minimal
    }

    return current;
}
