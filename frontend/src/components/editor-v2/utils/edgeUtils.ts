/**
 * Edge utility functions for Manhattan routing with rounded corners
 */

export const EDGE_PADDING = 20;

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function getNodeRect(node: any): Rect {
    return {
        x: node.position.x,
        y: node.position.y,
        width: node.measured?.width ?? node.width ?? 180,
        height: node.measured?.height ?? node.height ?? 80,
    };
}

function rectsOverlap(
    rect: Rect,
    x1: number,
    y1: number,
    x2: number,
    y2: number
): boolean {
    const padded = {
        x: rect.x - EDGE_PADDING,
        y: rect.y - EDGE_PADDING,
        width: rect.width + EDGE_PADDING * 2,
        height: rect.height + EDGE_PADDING * 2,
    };

    if (Math.abs(y1 - y2) < 1) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        return (
            y1 > padded.y &&
            y1 < padded.y + padded.height &&
            maxX > padded.x &&
            minX < padded.x + padded.width
        );
    }

    if (Math.abs(x1 - x2) < 1) {
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return (
            x1 > padded.x &&
            x1 < padded.x + padded.width &&
            maxY > padded.y &&
            minY < padded.y + padded.height
        );
    }

    return false;
}

/**
 * Computes a Manhattan (orthogonal) path between two points,
 * avoiding obstacles when possible.
 */
export function computeManhattanPath(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    sourceNodeId: string,
    targetNodeId: string,
    allNodes: any[]
): string {
    const dy = Math.abs(targetY - sourceY);

    if (dy < 5) {
        return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    }

    const obstacles = allNodes
        .filter((n) => n.id !== sourceNodeId && n.id !== targetNodeId)
        .map(getNodeRect);

    const midX = (sourceX + targetX) / 2;
    const standardPath = [
        { x: sourceX, y: sourceY },
        { x: midX, y: sourceY },
        { x: midX, y: targetY },
        { x: targetX, y: targetY },
    ];

    let hasCollision = false;
    for (let i = 0; i < standardPath.length - 1; i++) {
        const p1 = standardPath[i];
        const p2 = standardPath[i + 1];
        for (const obs of obstacles) {
            if (rectsOverlap(obs, p1.x, p1.y, p2.x, p2.y)) {
                hasCollision = true;
                break;
            }
        }
        if (hasCollision) break;
    }

    if (!hasCollision) {
        return `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
    }

    let topY = Infinity;
    let bottomY = -Infinity;
    for (const obs of obstacles) {
        topY = Math.min(topY, obs.y - EDGE_PADDING);
        bottomY = Math.max(bottomY, obs.y + obs.height + EDGE_PADDING);
    }

    const sourceRect = allNodes.find((n) => n.id === sourceNodeId);
    const targetRect = allNodes.find((n) => n.id === targetNodeId);
    if (sourceRect) {
        const sr = getNodeRect(sourceRect);
        topY = Math.min(topY, sr.y - EDGE_PADDING);
        bottomY = Math.max(bottomY, sr.y + sr.height + EDGE_PADDING);
    }
    if (targetRect) {
        const tr = getNodeRect(targetRect);
        topY = Math.min(topY, tr.y - EDGE_PADDING);
        bottomY = Math.max(bottomY, tr.y + tr.height + EDGE_PADDING);
    }

    const useTop =
        Math.abs(sourceY - topY) + Math.abs(targetY - topY) <
        Math.abs(sourceY - bottomY) + Math.abs(targetY - bottomY);
    const detourY = useTop ? topY : bottomY;

    const offsetX1 = sourceX + EDGE_PADDING;
    const offsetX2 = targetX - EDGE_PADDING;

    return `M ${sourceX} ${sourceY} L ${offsetX1} ${sourceY} L ${offsetX1} ${detourY} L ${offsetX2} ${detourY} L ${offsetX2} ${targetY} L ${targetX} ${targetY}`;
}

/**
 * Takes a Manhattan path with straight L segments and adds rounded
 * arcs at every 90-degree corner.
 *
 * @param path - SVG path like "M x y L x y L x y ..."
 * @param radius - Arc radius (default 8px)
 * @returns SVG path with rounded arcs
 */
export function roundManhattanPath(path: string, radius: number = 4): string {
    // Parse points from path
    const points: { x: number; y: number }[] = [];
    const commands = path.match(/[ML]\s*[-\d.]+\s+[-\d.]+/g);
    if (!commands) return path;

    for (const cmd of commands) {
        const nums = cmd.match(/[-\d.]+/g);
        if (nums && nums.length >= 2) {
            points.push({ x: parseFloat(nums[0]), y: parseFloat(nums[1]) });
        }
    }

    if (points.length < 3) return path;

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];

        // Segment directions
        const dx1 = curr.x - prev.x;
        const dy1 = curr.y - prev.y;
        const dx2 = next.x - curr.x;
        const dy2 = next.y - curr.y;

        // Segment lengths
        const len1 = Math.abs(dx1) + Math.abs(dy1);
        const len2 = Math.abs(dx2) + Math.abs(dy2);

        // Radius cannot exceed half of shortest segment
        const r = Math.min(radius, len1 / 2, len2 / 2);

        if (r < 1) {
            // Segment too short, no arc
            d += ` L ${curr.x} ${curr.y}`;
            continue;
        }

        // Point before corner (on incoming line)
        const beforeX = curr.x - Math.sign(dx1) * (dx1 !== 0 ? r : 0);
        const beforeY = curr.y - Math.sign(dy1) * (dy1 !== 0 ? r : 0);

        // Point after corner (on outgoing line)
        const afterX = curr.x + Math.sign(dx2) * (dx2 !== 0 ? r : 0);
        const afterY = curr.y + Math.sign(dy2) * (dy2 !== 0 ? r : 0);

        // Determine sweep direction
        const cross = dx1 * dy2 - dy1 * dx2;
        const sweep = cross > 0 ? 1 : 0;

        d += ` L ${beforeX} ${beforeY}`;
        d += ` A ${r} ${r} 0 0 ${sweep} ${afterX} ${afterY}`;
    }

    // Last point
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;

    return d;
}
