/**
 * Path Data Model
 * Parsing, serialization, and manipulation of SVG path data
 * for the interactive path editor.
 */

import svgpath from 'svgpath';

// ============================================
// TYPES
// ============================================

export type CommandType = 'M' | 'L' | 'Q' | 'C' | 'A' | 'Z';

export interface PathPoint {
    id: string;
    command: CommandType;
    /** Endpoint coordinates (Z copies M's coords) */
    x: number;
    y: number;
    /** Quadratic control point (Q command only) */
    cx?: number;
    cy?: number;
    /** Cubic control points (C command only) */
    cx1?: number;
    cy1?: number;
    cx2?: number;
    cy2?: number;
    /** Arc parameters (A command only) */
    rx?: number;
    ry?: number;
    rotation?: number;
    largeArc?: number;
    sweep?: number;
}

export type PathData = PathPoint[];

// ============================================
// UTILITIES
// ============================================

/** Generate a short unique ID */
export function uid(): string {
    return Math.random().toString(36).slice(2, 8);
}

/** Round to 1 decimal place */
function round1(n: number): number {
    return Math.round(n * 10) / 10;
}

/**
 * Snap coordinates to integer grid when enabled.
 * Grid is 1-unit in the 0-10 coordinate space.
 */
export function snapToGrid(value: number, snapEnabled: boolean): number {
    return snapEnabled ? Math.round(value) : round1(value);
}

/**
 * Calculate distance from point (px, py) to line segment (x1,y1)-(x2,y2)
 */
function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
        // Segment is a point
        return Math.hypot(px - x1, py - y1);
    }

    // Project point onto line, clamped to segment
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return Math.hypot(px - projX, py - projY);
}

/**
 * Calculate perpendicular offset direction from a line segment
 */
function perpendicularOffset(x1: number, y1: number, x2: number, y2: number, distance: number): { dx: number; dy: number } {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);

    if (len === 0) return { dx: 0, dy: -distance };

    // Perpendicular vector (rotated 90 degrees counter-clockwise)
    return {
        dx: (-dy / len) * distance,
        dy: (dx / len) * distance,
    };
}

// ============================================
// NORMALIZATION
// ============================================

/**
 * Normalize any SVG path string to absolute uppercase commands (M, L, C, Z).
 * Converts relative → absolute, expands shorthand (s→C, t→Q),
 * converts arcs to cubic Bézier curves (.unarc()),
 * and expands H/V to full L commands.
 * After normalization only M, L, C, Q, Z commands remain.
 */
export function normalizePath(raw: string): string {
    if (!raw || typeof raw !== 'string') return raw;
    try {
        return svgpath(raw)
            .abs()
            .unshort()
            .unarc()
            .iterate(function (segment: any[], _index: number, x: number, y: number) {
                if (segment[0] === 'H') {
                    segment[0] = 'L';
                    segment.push(y);
                }
                if (segment[0] === 'V') {
                    segment[0] = 'L';
                    segment.splice(1, 0, x);
                }
            })
            .round(4)
            .toString();
    } catch {
        return raw;
    }
}

// ============================================
// PARSING
// ============================================

/**
 * Parse an SVG path `d` string into PathData.
 * Automatically normalizes the input first (relative → absolute,
 * shorthand expansion, H/V→L) so that only
 * M, L, Q, C, A, Z commands reach the parser.
 */
export function parsePath(d: string): PathData {
    if (!d || typeof d !== 'string') return [];

    // Normalize before parsing so any valid SVG path works
    const normalized = normalizePath(d);

    const result: PathData = [];
    let firstPoint: { x: number; y: number } | null = null;

    // Tokenize: split by commands, keeping the command letter
    const tokens = normalized.trim().split(/(?=[MLQCAZ])/i).filter(Boolean);

    for (const token of tokens) {
        const trimmed = token.trim();
        if (!trimmed) continue;

        const command = trimmed[0].toUpperCase() as CommandType;
        const rest = trimmed.slice(1).trim();

        // Parse numbers from the rest of the token
        const nums = rest
            .split(/[\s,]+/)
            .map(s => parseFloat(s))
            .filter(n => !isNaN(n));

        switch (command) {
            case 'M':
                if (nums.length >= 2) {
                    const point: PathPoint = {
                        id: uid(),
                        command: 'M',
                        x: nums[0],
                        y: nums[1],
                    };
                    result.push(point);
                    firstPoint = { x: nums[0], y: nums[1] };
                }
                break;

            case 'L':
                if (nums.length >= 2) {
                    result.push({
                        id: uid(),
                        command: 'L',
                        x: nums[0],
                        y: nums[1],
                    });
                }
                break;

            case 'Q':
                if (nums.length >= 4) {
                    result.push({
                        id: uid(),
                        command: 'Q',
                        x: nums[2],
                        y: nums[3],
                        cx: nums[0],
                        cy: nums[1],
                    });
                }
                break;

            case 'C':
                if (nums.length >= 6) {
                    result.push({
                        id: uid(),
                        command: 'C',
                        x: nums[4],
                        y: nums[5],
                        cx1: nums[0],
                        cy1: nums[1],
                        cx2: nums[2],
                        cy2: nums[3],
                    });
                }
                break;

            case 'A': {
                // Arc has special syntax: params 4 & 5 are single-digit flags (0|1)
                // that can be written without separators, e.g. A7 7 0 118 1
                // means rx=7 ry=7 rotation=0 largeArc=1 sweep=1 x=8 y=1
                const num = `([+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?)`;
                const sep = `\\s*[,\\s]?\\s*`;
                const flag = `([01])`;
                const arcRegex = new RegExp(
                    `${num}${sep}${num}${sep}${num}${sep}${flag}${sep}${flag}${sep}${num}${sep}${num}`,
                    'g'
                );
                let arcMatch;
                while ((arcMatch = arcRegex.exec(rest)) !== null) {
                    result.push({
                        id: uid(),
                        command: 'A',
                        rx: parseFloat(arcMatch[1]),
                        ry: parseFloat(arcMatch[2]),
                        rotation: parseFloat(arcMatch[3]),
                        largeArc: parseInt(arcMatch[4]),
                        sweep: parseInt(arcMatch[5]),
                        x: parseFloat(arcMatch[6]),
                        y: parseFloat(arcMatch[7]),
                    });
                }
                break;
            }

            case 'Z':
                // Z copies M's coordinates for reference
                result.push({
                    id: uid(),
                    command: 'Z',
                    x: firstPoint?.x ?? 0,
                    y: firstPoint?.y ?? 0,
                });
                break;
        }
    }

    return result;
}

// ============================================
// SERIALIZATION
// ============================================

/**
 * Serialize PathData back to SVG path `d` string.
 * Output is clean with single spaces, rounded to 1 decimal.
 * Z has no coordinates in output.
 */
export function serializePath(data: PathData): string {
    if (!data || data.length === 0) return '';

    const parts: string[] = [];

    for (const point of data) {
        switch (point.command) {
            case 'M':
            case 'L':
                parts.push(`${point.command} ${round1(point.x)} ${round1(point.y)}`);
                break;

            case 'Q':
                if (point.cx != null && point.cy != null) {
                    parts.push(`Q ${round1(point.cx)} ${round1(point.cy)} ${round1(point.x)} ${round1(point.y)}`);
                }
                break;

            case 'C':
                if (point.cx1 != null && point.cy1 != null && point.cx2 != null && point.cy2 != null) {
                    parts.push(`C ${round1(point.cx1)} ${round1(point.cy1)} ${round1(point.cx2)} ${round1(point.cy2)} ${round1(point.x)} ${round1(point.y)}`);
                }
                break;

            case 'A':
                if (point.rx != null && point.ry != null && point.rotation != null && point.largeArc != null && point.sweep != null) {
                    parts.push(`A ${round1(point.rx)} ${round1(point.ry)} ${round1(point.rotation)} ${point.largeArc} ${point.sweep} ${round1(point.x)} ${round1(point.y)}`);
                }
                break;

            case 'Z':
                parts.push('Z');
                break;
        }
    }

    return parts.join(' ');
}

// ============================================
// MANIPULATION FUNCTIONS
// ============================================

/**
 * Update a point's coordinates. Returns new PathData (immutable).
 * If the point is M and there's a Z at the end, Z's coords update too.
 */
export function updatePoint(data: PathData, pointId: string, updates: Partial<PathPoint>): PathData {
    const newData = data.map(point => {
        if (point.id === pointId) {
            return { ...point, ...updates };
        }
        return point;
    });

    // If updating M, also update Z (if present at end)
    const updatedPoint = newData.find(p => p.id === pointId);
    if (updatedPoint?.command === 'M') {
        const lastPoint = newData[newData.length - 1];
        if (lastPoint?.command === 'Z') {
            newData[newData.length - 1] = {
                ...lastPoint,
                x: updatedPoint.x,
                y: updatedPoint.y,
            };
        }
    }

    return newData;
}

/**
 * Insert a new L point on the segment between points[segmentIndex] and points[segmentIndex+1].
 * Position: midpoint of the segment.
 * Returns new PathData with the inserted point.
 */
export function insertPointOnSegment(data: PathData, segmentIndex: number): PathData {
    if (segmentIndex < 0 || segmentIndex >= data.length) return data;

    const startPoint = data[segmentIndex];
    let endPoint = data[segmentIndex + 1];

    // Handle Z — segment goes back to M
    if (!endPoint || endPoint.command === 'Z') {
        const mPoint = data.find(p => p.command === 'M');
        if (!mPoint) return data;
        endPoint = mPoint;
    }

    // Calculate midpoint
    const midX = round1((startPoint.x + endPoint.x) / 2);
    const midY = round1((startPoint.y + endPoint.y) / 2);

    const newPoint: PathPoint = {
        id: uid(),
        command: 'L',
        x: midX,
        y: midY,
    };

    // Insert after segmentIndex
    const newData = [...data];
    newData.splice(segmentIndex + 1, 0, newPoint);

    return newData;
}

/**
 * Remove a point by ID. Cannot remove M (first point) or if only 2 points remain.
 * Returns new PathData, or null if removal is not allowed.
 */
export function removePoint(data: PathData, pointId: string): PathData | null {
    const pointIndex = data.findIndex(p => p.id === pointId);
    if (pointIndex < 0) return null;

    const point = data[pointIndex];

    // Cannot remove the first M (path start)
    if (point.command === 'M' && pointIndex === 0) return null;

    // Cannot remove Z (it's implicit)
    if (point.command === 'Z') return null;

    // Count non-Z points
    const nonZPoints = data.filter(p => p.command !== 'Z');
    if (nonZPoints.length <= 2) return null;

    // Remove the point
    const newData = data.filter(p => p.id !== pointId);

    return newData;
}

/**
 * Convert a segment's command type.
 * Returns new PathData.
 */
export function convertSegment(data: PathData, pointId: string, newCommand: CommandType): PathData {
    const pointIndex = data.findIndex(p => p.id === pointId);
    if (pointIndex < 0) return data;

    const point = data[pointIndex];
    const prevPoint = data[pointIndex - 1];

    // Cannot convert Z or the first M (path start)
    if (point.command === 'Z') return data;
    if (point.command === 'M' && pointIndex === 0) return data;
    if (!prevPoint) return data;

    // Already the requested command
    if (point.command === newCommand) return data;

    const newData = [...data];

    // Calculate segment midpoint for control point placement
    const midX = (prevPoint.x + point.x) / 2;
    const midY = (prevPoint.y + point.y) / 2;

    // Get perpendicular offset for curves
    const offset = perpendicularOffset(prevPoint.x, prevPoint.y, point.x, point.y, 2);

    switch (newCommand) {
        case 'L':
            // Drop all control points and arc params
            newData[pointIndex] = {
                ...point,
                command: 'L',
                cx: undefined,
                cy: undefined,
                cx1: undefined,
                cy1: undefined,
                cx2: undefined,
                cy2: undefined,
                rx: undefined,
                ry: undefined,
                rotation: undefined,
                largeArc: undefined,
                sweep: undefined,
            };
            break;

        case 'Q':
            if (point.command === 'L' || point.command === 'A') {
                // L/A → Q: place control point at midpoint offset perpendicular
                newData[pointIndex] = {
                    ...point,
                    command: 'Q',
                    cx: round1(midX + offset.dx),
                    cy: round1(midY + offset.dy),
                    cx1: undefined,
                    cy1: undefined,
                    cx2: undefined,
                    cy2: undefined,
                    rx: undefined,
                    ry: undefined,
                    rotation: undefined,
                    largeArc: undefined,
                    sweep: undefined,
                };
            } else if (point.command === 'C') {
                // C → Q: average the two control points
                const cx = round1(((point.cx1 ?? midX) + (point.cx2 ?? midX)) / 2);
                const cy = round1(((point.cy1 ?? midY) + (point.cy2 ?? midY)) / 2);
                newData[pointIndex] = {
                    ...point,
                    command: 'Q',
                    cx,
                    cy,
                    cx1: undefined,
                    cy1: undefined,
                    cx2: undefined,
                    cy2: undefined,
                };
            }
            break;

        case 'C':
            if (point.command === 'L' || point.command === 'A') {
                // L/A → C: two control points at 1/3 and 2/3, offset perpendicular
                const x1 = prevPoint.x + (point.x - prevPoint.x) / 3;
                const y1 = prevPoint.y + (point.y - prevPoint.y) / 3;
                const x2 = prevPoint.x + (point.x - prevPoint.x) * 2 / 3;
                const y2 = prevPoint.y + (point.y - prevPoint.y) * 2 / 3;

                newData[pointIndex] = {
                    ...point,
                    command: 'C',
                    cx: undefined,
                    cy: undefined,
                    cx1: round1(x1 + offset.dx),
                    cy1: round1(y1 + offset.dy),
                    cx2: round1(x2 + offset.dx),
                    cy2: round1(y2 + offset.dy),
                    rx: undefined,
                    ry: undefined,
                    rotation: undefined,
                    largeArc: undefined,
                    sweep: undefined,
                };
            } else if (point.command === 'Q') {
                // Q → C: split single control into two
                const cx = point.cx ?? midX;
                const cy = point.cy ?? midY;

                // Position cp1 closer to start, cp2 closer to end
                newData[pointIndex] = {
                    ...point,
                    command: 'C',
                    cx: undefined,
                    cy: undefined,
                    cx1: round1(prevPoint.x + (cx - prevPoint.x) * 0.66),
                    cy1: round1(prevPoint.y + (cy - prevPoint.y) * 0.66),
                    cx2: round1(point.x + (cx - point.x) * 0.66),
                    cy2: round1(point.y + (cy - point.y) * 0.66),
                };
            }
            break;

        case 'M':
            // Convert to M: start a new sub-path at this position
            newData[pointIndex] = {
                ...point,
                command: 'M',
                cx: undefined,
                cy: undefined,
                cx1: undefined,
                cy1: undefined,
                cx2: undefined,
                cy2: undefined,
            };
            break;
    }

    return newData;
}

/**
 * Find which segment (index) is closest to a given (x, y) coordinate.
 * Returns the index of the starting point of the closest segment, or -1.
 */
export function findClosestSegment(data: PathData, x: number, y: number, threshold: number = 2): number {
    if (data.length < 2) return -1;

    let closestIndex = -1;
    let closestDistance = Infinity;

    for (let i = 0; i < data.length - 1; i++) {
        const startPoint = data[i];
        let endPoint = data[i + 1];

        // Skip if end is Z (handled separately)
        if (endPoint.command === 'Z') {
            // Segment from current to M
            const mPoint = data.find(p => p.command === 'M');
            if (mPoint) {
                const dist = pointToSegmentDistance(x, y, startPoint.x, startPoint.y, mPoint.x, mPoint.y);
                if (dist < closestDistance && dist < threshold) {
                    closestDistance = dist;
                    closestIndex = i;
                }
            }
            continue;
        }

        const dist = pointToSegmentDistance(x, y, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
        if (dist < closestDistance && dist < threshold) {
            closestDistance = dist;
            closestIndex = i;
        }
    }

    return closestIndex;
}
