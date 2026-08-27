import { describe, it, expect } from 'vitest';
import {
    computeTreeConnectorPath,
    roundManhattanPath,
    parsePathPoints,
    parsePathSubPaths,
    TREE_BUS_CORNER_RADIUS,
    treeBusCornerRadius,
    treeBranchAnchor,
    treeChildBox,
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

// Where each branch leaves its child. The hook feeds these coordinates to
// computeTreeConnectorPath, so a branch that lands off-centre is decided here and
// nowhere else.
describe('branch anchoring — centre of the child side, from the measured box', () => {
    const box = (x: number, y: number, width: number, height = 60) => ({ x, y, width, height });

    it('the branch leaves from the centre of the top side', () => {
        expect(treeBranchAnchor(box(100, 460, 140), 'top')).toEqual({ x: 170, y: 460 });
    });

    it('and from the centre of the bottom side when the children sit above the parent', () => {
        expect(treeBranchAnchor(box(100, 460, 140), 'bottom')).toEqual({ x: 170, y: 520 });
    });

    it('the centre follows the real width — a default would put it elsewhere', () => {
        expect(treeBranchAnchor(box(0, 0, 140), 'top').x).toBe(70);
        expect(treeBranchAnchor(box(0, 0, 260), 'top').x).toBe(130);
        // 90 is where the 180px placeholder used to put it, whatever the node measured.
        expect(treeBranchAnchor(box(0, 0, 260), 'top').x).not.toBe(90);
    });

    it('children of different widths: the bus runs from the first centre to the last', () => {
        const boxes = [box(100, 460, 140), box(400, 460, 200), box(700, 460, 140)];
        const branches: TreeBranch[] = boxes.map((b, i) => {
            const a = treeBranchAnchor(b, 'top');
            return { childX: a.x, childY: a.y, edgeId: `e${i}` };
        });
        // Parent handle at 500 — the centre of the middle child, so that one is the
        // collinear case and must stay a bare T.
        const g = computeTreeConnectorPath(500, 100, branches);
        const bus = busByChildX(g.barAndBranchesPath);

        expect([...bus.keys()].sort((a, b) => a - b)).toEqual([170, 500, 770]);
        expect(busSpan(g.barAndBranchesPath)).toEqual({ min: 170, max: 770 });
        expect(bus.get(500)).toHaveLength(2);
        expect(g.junction).toEqual({ x: 500, y: 280 });
    });
});

// A child that moves must keep its branch, and the bus must follow it. The
// invariant is one line — every child has a path to the bus, wherever it sits —
// and these are the three moves that broke it: the branch vanished AND the bus
// shrank to the children that were left.
describe('after a drag — every child keeps its branch', () => {
    const PARENT_X = 470;
    const PARENT_BOTTOM = 180;
    const kid = (x: number, y: number, width = 140, height = 60) => ({ x, y, width, height });

    const treeOf = (boxes: ReturnType<typeof kid>[]) => {
        const anchors = boxes.map(b => treeBranchAnchor(b, 'top'));
        const branches: TreeBranch[] = anchors.map((a, i) => ({ childX: a.x, childY: a.y, edgeId: `e${i}` }));
        return { g: computeTreeConnectorPath(PARENT_X, PARENT_BOTTOM, branches), anchors };
    };

    /** Every child owns a sub-path that starts on it and ends on the bus. */
    const eachChildReachesTheBus = (g: ReturnType<typeof computeTreeConnectorPath>, anchors: { x: number; y: number }[]) => {
        const subs = parsePathSubPaths(g.barAndBranchesPath);
        const busY = g.junction!.y;
        for (const a of anchors) {
            const own = subs.filter(pts => pts[0].x === a.x && pts[0].y === a.y);
            expect(own, `no branch starting at (${a.x}, ${a.y})`).toHaveLength(1);
            expect(own[0].some(p => p.y === busY), `branch at ${a.x} never reaches the bus`).toBe(true);
        }
        expect(subs).toHaveLength(anchors.length);
    };

    it('an interior child dragged below the others keeps its vertical, from the bus down to its top', () => {
        // Red, the middle one, dragged straight down.
        const boxes = [kid(120, 460), kid(400, 700), kid(680, 460)];
        const { g, anchors } = treeOf(boxes);
        const bus = busByChildX(g.barAndBranchesPath);

        // barY still sits between the parent and the CLOSEST child, which is unchanged.
        expect(g.junction).toEqual({ x: PARENT_X, y: 320 });
        expect(bus.get(470)).toEqual([{ x: 470, y: 700 }, { x: 470, y: 320 }]);
        eachChildReachesTheBus(g, anchors);
    });

    it('an outer child dragged past the old end: the bus follows it, with the elbow on the new end', () => {
        // Green dragged down and to the right, well beyond where the bus used to stop.
        const boxes = [kid(120, 460), kid(400, 460), kid(900, 700)];
        const { g, anchors } = treeOf(boxes);

        expect(busSpan(g.barAndBranchesPath)).toEqual({ min: 190, max: 970 });
        eachChildReachesTheBus(g, anchors);

        // The new end is an elbow, and it rounds at the nominal radius.
        const moved = busByChildX(g.barAndBranchesPath).get(970)!;
        expect(moved).toHaveLength(3);
        const raw = 'M ' + moved.map(p => `${p.x} ${p.y}`).join(' L ');
        expect(roundManhattanPath(raw, treeBusCornerRadius(moved))).toContain('A 4 4');
    });

    it('a child dragged above the bus still has its branch — it just enters from the other side', () => {
        // Red dragged above the parent: it becomes the closest child, so the bus
        // moves up with it, above the parent's own edge.
        const boxes = [kid(120, 460), kid(400, 40), kid(680, 460)];
        const { g, anchors } = treeOf(boxes);
        const busY = g.junction!.y;

        expect(busY).toBe(110);            // 180 + (40 - 180) / 2
        expect(busY).toBeLessThan(PARENT_BOTTOM);
        // The moved child hangs above the bus, the others below: both are branches.
        expect(busByChildX(g.barAndBranchesPath).get(470)).toEqual([{ x: 470, y: 40 }, { x: 470, y: 110 }]);
        eachChildReachesTheBus(g, anchors);
    });

    it('a child the canvas has not measured yet still gets a box, so it still gets a branch', () => {
        // The regression: resolving to nothing dropped the child from the connector.
        const unmeasured = treeChildBox({ x: 400, y: 460 });
        expect(unmeasured.width).toBeGreaterThan(0);
        expect(unmeasured.height).toBeGreaterThan(0);

        // Measured wins over declared, declared over the fallback.
        expect(treeChildBox({ x: 0, y: 0, measuredWidth: 200, declaredWidth: 140 }).width).toBe(200);
        expect(treeChildBox({ x: 0, y: 0, declaredWidth: 140 }).width).toBe(140);

        // `unmeasured` above is the middle child as the canvas hands it over before
        // measuring it: a position and nothing else. It still anchors — on the
        // fallback width, so its centre is 400 + 180/2 — and the bus still reaches it.
        const { g, anchors } = treeOf([kid(120, 460), unmeasured, kid(680, 460)]);
        expect(anchors[1]).toEqual({ x: 490, y: 460 });
        eachChildReachesTheBus(g, anchors);
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

    it('the nominal radius is the settled one', () => {
        expect(TREE_BUS_CORNER_RADIUS).toBe(4);
    });

    it('outer children get the arc, interior children get none', () => {
        const g = computeTreeConnectorPath(520, PARENT_Y, [child(400, 'e1'), child(600, 'e2'), child(800, 'e3')]);
        const paths = rounded(g.barAndBranchesPath);

        const withArc = paths.filter(d => d.includes('A 4 4'));
        const straight = paths.filter(d => !d.includes('A'));
        expect(withArc).toHaveLength(2);
        expect(straight).toHaveLength(1);
        // The interior branch stays a plain vertical from child to bar.
        expect(straight[0]).toBe(`M 600 ${CHILD_Y} L 600 ${BAR_Y}`);
    });

    it('the arc curves toward the trunk and leaves the bar collinear with it', () => {
        const g = computeTreeConnectorPath(500, PARENT_Y, [child(400, 'e1'), child(600, 'e2')]);
        const [left, right] = rounded(g.barAndBranchesPath);

        // Left child: up to 4px short of the bar, quarter arc, then right to the trunk.
        expect(left).toBe(`M 400 ${CHILD_Y} L 400 ${BAR_Y + TREE_BUS_CORNER_RADIUS} A 4 4 0 0 1 404 ${BAR_Y} L 500 ${BAR_Y}`);
        // Right child: mirrored, curving left.
        expect(right).toBe(`M 600 ${CHILD_Y} L 600 ${BAR_Y + TREE_BUS_CORNER_RADIUS} A 4 4 0 0 0 596 ${BAR_Y} L 500 ${BAR_Y}`);
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
        expect(treeBusCornerRadius([{ x: 0, y: 100 }, { x: 0, y: 0 }, { x: 100, y: 0 }])).toBe(4);
    });

    it('with a short segment it is half of it, never more', () => {
        expect(treeBusCornerRadius([{ x: 0, y: 100 }, { x: 0, y: 0 }, { x: 5, y: 0 }])).toBe(2.5);
        expect(treeBusCornerRadius([{ x: 0, y: 3 }, { x: 0, y: 0 }, { x: 100, y: 0 }])).toBe(1.5);
    });

    it('children packed against the trunk keep a straight piece on both sides', () => {
        // Bar 5px long on the left of the trunk: without the clamp the elbow would
        // swallow it whole and the branch would land as one arc.
        const g = computeTreeConnectorPath(405, PARENT_Y, [child(400, 'e1'), child(410, 'e2')]);
        const pts = parsePathSubPaths(g.barAndBranchesPath)[0];
        const r = treeBusCornerRadius(pts);
        expect(r).toBe(2.5);
        expect(roundManhattanPath('M ' + pts.map(p => `${p.x} ${p.y}`).join(' L '), r))
            .toBe(`M 400 ${CHILD_Y} L 400 ${BAR_Y + 2.5} A 2.5 2.5 0 0 1 402.5 ${BAR_Y} L 405 ${BAR_Y}`);
    });
});
