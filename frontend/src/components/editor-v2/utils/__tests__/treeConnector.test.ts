import { describe, it, expect } from 'vitest';
import {
    computeTreeConnectorPath,
    roundManhattanPath,
    parsePathPoints,
    parsePathSubPaths,
    TREE_BUS_CORNER_RADIUS,
    treeBusCornerRadius,
    type TreeBranch,
} from '../edgeUtils';

// Parent above children (standard UML): parentY < barY < childY.
const PARENT_Y = 100;
const CHILD_Y = 300;
// With no obstacles findClearBarY returns the default midpoint.
const BAR_Y = PARENT_Y + (CHILD_Y - PARENT_Y) / 2; // 200

const child = (x: number, id: string, y: number = CHILD_Y): TreeBranch => ({ childX: x, childY: y, edgeId: id });

/** Sub-paths of the bus, keyed by the X of their first point (the child landing). */
const busByChildX = (d: string) => {
    const m = new Map<number, { x: number; y: number }[]>();
    for (const pts of parsePathSubPaths(d)) m.set(pts[0].x, pts);
    return m;
};

/** X span actually stroked by the horizontal segments of the bus. */
const busSpan = (d: string) => {
    const xs: number[] = [];
    for (const pts of parsePathSubPaths(d)) {
        for (let i = 0; i < pts.length - 1; i++) {
            if (Math.abs(pts[i].y - pts[i + 1].y) < 0.5) xs.push(pts[i].x, pts[i + 1].x);
        }
    }
    return xs.length === 0 ? null : { min: Math.min(...xs), max: Math.max(...xs) };
};

describe('computeTreeConnectorPath — shared inheritance bus', () => {
    // ── Case: one child ─────────────────────────────────────────────
    it('1 child: no bus, one direct line, no junction dot', () => {
        const g = computeTreeConnectorPath(500, PARENT_Y, [child(500, 'e1')]);

        expect(g.barAndBranchesPath).toBe('');
        expect(g.junction ?? null).toBeNull();
        expect(parsePathPoints(g.trunkPath)).toEqual([
            { x: 500, y: CHILD_Y },
            { x: 500, y: PARENT_Y },
        ]);
    });

    // ── Case: two children ──────────────────────────────────────────
    it('2 children: both are outer, both elbows, the two halves meet at the trunk', () => {
        const g = computeTreeConnectorPath(500, PARENT_Y, [child(400, 'e1'), child(600, 'e2')]);
        const bus = busByChildX(g.barAndBranchesPath);

        // Each child: vertical up to the bar, then the bar toward the trunk.
        expect(bus.get(400)).toEqual([{ x: 400, y: CHILD_Y }, { x: 400, y: BAR_Y }, { x: 500, y: BAR_Y }]);
        expect(bus.get(600)).toEqual([{ x: 600, y: CHILD_Y }, { x: 600, y: BAR_Y }, { x: 500, y: BAR_Y }]);
        // The halves meet at the junction: the horizontal is stroked exactly once.
        expect(busSpan(g.barAndBranchesPath)).toEqual({ min: 400, max: 600 });
    });

    // ── Case: three or more children ────────────────────────────────
    it('3 children: only the outer two are elbows, the middle one is a bare T', () => {
        const g = computeTreeConnectorPath(520, PARENT_Y, [child(400, 'e1'), child(600, 'e2'), child(800, 'e3')]);
        const bus = busByChildX(g.barAndBranchesPath);

        expect(bus.get(400)).toHaveLength(3); // outer, elbow
        expect(bus.get(800)).toHaveLength(3); // outer, elbow
        expect(bus.get(600)).toEqual([{ x: 600, y: CHILD_Y }, { x: 600, y: BAR_Y }]); // interior, sharp T
    });

    it('the bus stops at the children — not one pixel wider', () => {
        const g = computeTreeConnectorPath(520, PARENT_Y, [child(400, 'e1'), child(600, 'e2'), child(800, 'e3')]);
        expect(busSpan(g.barAndBranchesPath)).toEqual({ min: 400, max: 800 });
    });

    // ── Case: trunk collinear with a child ──────────────────────────
    it('a child on the trunk gets a sharp T, and its branch is collinear with the trunk', () => {
        const g = computeTreeConnectorPath(600, PARENT_Y, [child(400, 'e1'), child(600, 'e2'), child(800, 'e3')]);
        const bus = busByChildX(g.barAndBranchesPath);
        const trunk = parsePathPoints(g.trunkPath);

        // No elbow on the collinear child.
        expect(bus.get(600)).toEqual([{ x: 600, y: CHILD_Y }, { x: 600, y: BAR_Y }]);
        // Same X on both sides of the bar, and the trunk touches the bar: one line.
        expect(trunk[0]).toEqual({ x: 600, y: BAR_Y });
        expect(trunk[1]).toEqual({ x: 600, y: PARENT_Y });
        expect(bus.get(600)![1].x).toBe(trunk[0].x);
    });

    it('the trunk reaches the bar: no gap left for a corner arc', () => {
        const g = computeTreeConnectorPath(500, PARENT_Y, [child(400, 'e1'), child(600, 'e2')]);
        const trunk = parsePathPoints(g.trunkPath);

        expect(trunk).toHaveLength(2);              // straight, no jog
        expect(trunk[0].x).toBe(trunk[1].x);
        expect(trunk[0].y).toBe(BAR_Y);             // touches the bus exactly
        expect(g.junction).toEqual({ x: 500, y: BAR_Y });
    });

    // ── Case: parent off-centre ─────────────────────────────────────
    it('parent right of every child: the bus reaches the trunk, the far child becomes a T', () => {
        const g = computeTreeConnectorPath(900, PARENT_Y, [child(400, 'e1'), child(600, 'e2')]);
        const bus = busByChildX(g.barAndBranchesPath);

        expect(bus.get(400)).toEqual([{ x: 400, y: CHILD_Y }, { x: 400, y: BAR_Y }, { x: 900, y: BAR_Y }]);
        expect(bus.get(600)).toEqual([{ x: 600, y: CHILD_Y }, { x: 600, y: BAR_Y }]);
        expect(busSpan(g.barAndBranchesPath)).toEqual({ min: 400, max: 900 });
        expect(g.junction).toEqual({ x: 900, y: BAR_Y });
    });

    it('parent left of every child: mirror case, one elbow on the right', () => {
        const g = computeTreeConnectorPath(200, PARENT_Y, [child(400, 'e1'), child(600, 'e2')]);
        const bus = busByChildX(g.barAndBranchesPath);

        expect(bus.get(600)).toEqual([{ x: 600, y: CHILD_Y }, { x: 600, y: BAR_Y }, { x: 200, y: BAR_Y }]);
        expect(bus.get(400)).toEqual([{ x: 400, y: CHILD_Y }, { x: 400, y: BAR_Y }]);
        expect(busSpan(g.barAndBranchesPath)).toEqual({ min: 200, max: 600 });
    });

    // ── Hit-test paths ──────────────────────────────────────────────
    it('every child keeps a full hit-test route from the parent handle', () => {
        const branches = [child(400, 'e1'), child(600, 'e2'), child(800, 'e3')];
        const g = computeTreeConnectorPath(520, PARENT_Y, branches);

        for (const b of branches) {
            expect(parsePathPoints(g.branchPaths.get(b.edgeId)!)).toEqual([
                { x: 520, y: PARENT_Y },
                { x: 520, y: BAR_Y },
                { x: b.childX, y: BAR_Y },
                { x: b.childX, y: CHILD_Y },
            ]);
        }
    });
});

// The rounding is applied downstream (useTreeLayout) on each sub-path, with the
// radius that treeBusCornerRadius returns for it. Reading the geometry alone would
// not show which corners survive it, so run the same two calls the hook makes and
// look at the output (CLAUDE.md §5).
describe('bus rendering — corner rounding as useTreeLayout applies it', () => {
    const rounded = (d: string) =>
        parsePathSubPaths(d).map(pts => {
            const raw = 'M ' + pts.map(p => `${p.x} ${p.y}`).join(' L ');
            return roundManhattanPath(raw, treeBusCornerRadius(pts));
        });

    it('the nominal radius is the wide one, not the first 8px try', () => {
        expect(TREE_BUS_CORNER_RADIUS).toBe(16);
    });

    it('outer children get the wide arc, interior children get none', () => {
        const g = computeTreeConnectorPath(520, PARENT_Y, [child(400, 'e1'), child(600, 'e2'), child(800, 'e3')]);
        const paths = rounded(g.barAndBranchesPath);

        const withArc = paths.filter(d => d.includes('A 16 16'));
        const straight = paths.filter(d => !d.includes('A'));
        expect(withArc).toHaveLength(2);
        expect(straight).toHaveLength(1);
        // The interior branch stays a plain vertical from child to bar.
        expect(straight[0]).toBe(`M 600 ${CHILD_Y} L 600 ${BAR_Y}`);
    });

    it('the arc curves toward the trunk and leaves the bar collinear with it', () => {
        const g = computeTreeConnectorPath(500, PARENT_Y, [child(400, 'e1'), child(600, 'e2')]);
        const [left, right] = rounded(g.barAndBranchesPath);

        // Left child: up to 16px short of the bar, quarter arc, then right to the trunk.
        expect(left).toBe(`M 400 ${CHILD_Y} L 400 ${BAR_Y + TREE_BUS_CORNER_RADIUS} A 16 16 0 0 1 416 ${BAR_Y} L 500 ${BAR_Y}`);
        // Right child: mirrored, curving left.
        expect(right).toBe(`M 600 ${CHILD_Y} L 600 ${BAR_Y + TREE_BUS_CORNER_RADIUS} A 16 16 0 0 0 584 ${BAR_Y} L 500 ${BAR_Y}`);
    });

    it('the trunk survives rounding untouched — two points, nothing to round', () => {
        const g = computeTreeConnectorPath(500, PARENT_Y, [child(400, 'e1'), child(600, 'e2')]);
        expect(roundManhattanPath(g.trunkPath, treeBusCornerRadius(parsePathPoints(g.trunkPath)))).toBe(g.trunkPath);
    });
});

describe('treeBusCornerRadius — the clamp on short segments', () => {
    it('an interior branch has no corner, so no radius', () => {
        expect(treeBusCornerRadius([{ x: 0, y: 0 }, { x: 0, y: 100 }])).toBe(0);
    });

    it('with room, the radius is the nominal one', () => {
        expect(treeBusCornerRadius([{ x: 0, y: 100 }, { x: 0, y: 0 }, { x: 100, y: 0 }])).toBe(16);
    });

    it('with a short segment it is half of it, never more', () => {
        expect(treeBusCornerRadius([{ x: 0, y: 100 }, { x: 0, y: 0 }, { x: 5, y: 0 }])).toBe(2.5);
        expect(treeBusCornerRadius([{ x: 0, y: 9 }, { x: 0, y: 0 }, { x: 100, y: 0 }])).toBe(4.5);
    });

    it('children packed against the trunk keep a straight piece on both sides', () => {
        // Bar 5px long on the left of the trunk: at the nominal radius the elbow
        // would swallow it whole and the branch would land as one arc.
        const g = computeTreeConnectorPath(405, PARENT_Y, [child(400, 'e1'), child(410, 'e2')]);
        const pts = parsePathSubPaths(g.barAndBranchesPath)[0];
        const r = treeBusCornerRadius(pts);
        expect(r).toBe(2.5);
        expect(roundManhattanPath('M ' + pts.map(p => `${p.x} ${p.y}`).join(' L '), r))
            .toBe(`M 400 ${CHILD_Y} L 400 ${BAR_Y + 2.5} A 2.5 2.5 0 0 1 402.5 ${BAR_Y} L 405 ${BAR_Y}`);
    });
});
