/**
 * ObstacleGrid — Virtual grid overlay for A* obstacle-avoidance routing.
 *
 * Represents the canvas as a grid of cells. Nodes (with padding) are marked
 * as blocked so the A* pathfinder can route around them.
 */

export type Side = 'top' | 'right' | 'bottom' | 'left';

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface GridConfig {
    cellSize: number;   // pixels per cell (default 10)
    padding: number;    // margin around obstacles (default 20)
    bounds: Rect;       // world-space bounds the grid covers
}

export class ObstacleGrid {
    private blocked: Set<string>;
    private config: GridConfig;
    /** Number of columns in the grid */
    readonly cols: number;
    /** Number of rows in the grid */
    readonly rows: number;

    constructor(config: GridConfig) {
        this.config = config;
        this.blocked = new Set();
        this.cols = Math.ceil(config.bounds.width / config.cellSize);
        this.rows = Math.ceil(config.bounds.height / config.cellSize);
    }

    // ── Coordinate conversion ───────────────────────────────────

    /** Convert world coordinates to grid cell (col, row). */
    toGrid(worldX: number, worldY: number): { col: number; row: number } {
        const col = Math.floor((worldX - this.config.bounds.x) / this.config.cellSize);
        const row = Math.floor((worldY - this.config.bounds.y) / this.config.cellSize);
        return {
            col: Math.max(0, Math.min(col, this.cols - 1)),
            row: Math.max(0, Math.min(row, this.rows - 1)),
        };
    }

    /** Convert grid cell to world coordinates (center of cell). */
    toWorld(col: number, row: number): { x: number; y: number } {
        return {
            x: this.config.bounds.x + (col + 0.5) * this.config.cellSize,
            y: this.config.bounds.y + (row + 0.5) * this.config.cellSize,
        };
    }

    // ── Obstacle management ─────────────────────────────────────

    /**
     * Mark cells covered by a rectangle (node + padding) as blocked.
     */
    markObstacle(rect: Rect): void {
        const pad = this.config.padding;
        const topLeft = this.toGrid(rect.x - pad, rect.y - pad);
        const bottomRight = this.toGrid(
            rect.x + rect.width + pad,
            rect.y + rect.height + pad,
        );

        for (let r = topLeft.row; r <= bottomRight.row; r++) {
            for (let c = topLeft.col; c <= bottomRight.col; c++) {
                this.blocked.add(`${c},${r}`);
            }
        }
    }

    /** Check if a cell is walkable (not blocked and within bounds). */
    isWalkable(col: number, row: number): boolean {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        return !this.blocked.has(`${col},${row}`);
    }

    /**
     * Clear (unblock) the cells of a node and a corridor extending outward
     * from the given side so the path can start/arrive.
     *
     * @param nodeRect - The node rectangle (without padding)
     * @param side - Which side the edge exits/enters
     * @param depth - How many cells deep the corridor extends beyond the node
     */
    clearCorridor(nodeRect: Rect, side: Side, depth: number = 3): void {
        // First clear the node itself
        const tl = this.toGrid(nodeRect.x, nodeRect.y);
        const br = this.toGrid(
            nodeRect.x + nodeRect.width,
            nodeRect.y + nodeRect.height,
        );

        for (let r = tl.row; r <= br.row; r++) {
            for (let c = tl.col; c <= br.col; c++) {
                this.blocked.delete(`${c},${r}`);
            }
        }

        // Extend a corridor from the side so A* can reach the start/end point
        switch (side) {
            case 'top':
                for (let d = 1; d <= depth; d++) {
                    for (let c = tl.col; c <= br.col; c++) {
                        this.blocked.delete(`${c},${tl.row - d}`);
                    }
                }
                break;
            case 'bottom':
                for (let d = 1; d <= depth; d++) {
                    for (let c = tl.col; c <= br.col; c++) {
                        this.blocked.delete(`${c},${br.row + d}`);
                    }
                }
                break;
            case 'left':
                for (let d = 1; d <= depth; d++) {
                    for (let r = tl.row; r <= br.row; r++) {
                        this.blocked.delete(`${tl.col - d},${r}`);
                    }
                }
                break;
            case 'right':
                for (let d = 1; d <= depth; d++) {
                    for (let r = tl.row; r <= br.row; r++) {
                        this.blocked.delete(`${br.col + d},${r}`);
                    }
                }
                break;
        }
    }
}
