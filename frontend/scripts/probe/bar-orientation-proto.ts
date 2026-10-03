/**
 * bar-orientation-proto (P-2026-10-03-1304, Q3 design, no app code): the rule proposed for the automatic orientation
 * of a bar, run offline on the geometry the derived-notations-edges probe measured (DNE_JSON, its raw panes).
 *
 * Rule: s = the sum, over the bar's connected neighbours, of the unit vector from the bar's centre to the neighbour's
 * centre, by absolute component (sx across, sy along). Neighbours across (sx > sy) want the bar upright, so its long
 * sides face them; along (sy > sx), lying. Hysteresis H: an upright bar turns lying only when sy > H * sx, a lying one
 * upright only when sx > H * sy; a bar with no previous orientation keeps the declared one unless the other axis wins
 * by H too.
 *
 * Measures: (1) per pane, each bar's declared and decided orientation, the ratio, and the edge ends a turn would move
 * to the other pair of sides; (2) a neighbour dragged round the bar on a circle (720 steps), turns with H = 1 and
 * H = 1.2; (3) a neighbour shaken by +-3 px near the diagonal for 1000 frames, turns with H = 1 and H = 1.2; (4) the
 * cost of one evaluation of every bar of a pane.
 *
 * Run:  npx tsx frontend/scripts/probe/bar-orientation-proto.ts   (DNE_JSON defaults to /tmp/dnotC/d_after.json)
 */
import { readFileSync } from 'node:fs';

type Pt = { x: number; y: number };
type Orientation = 'upright' | 'lying';

export function barOrientation(centre: Pt, neighbours: readonly Pt[], previous: Orientation, h: number): Orientation {
    let sx = 0, sy = 0;
    for (const n of neighbours) {
        const dx = n.x - centre.x, dy = n.y - centre.y;
        const len = Math.hypot(dx, dy) || 1;
        sx += Math.abs(dx) / len;
        sy += Math.abs(dy) / len;
    }
    if (previous === 'upright') return sy > h * sx ? 'lying' : 'upright';
    return sx > h * sy ? 'upright' : 'lying';
}

const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v)}`);
const file = process.env.DNE_JSON || '/tmp/dnotC/d_after.json';
const r = JSON.parse(readFileSync(file, 'utf8'));

const panes: Array<[string, any]> = [];
for (const [scene, sc] of Object.entries<any>(r.scenes ?? {})) {
    for (const [notation, n] of Object.entries<any>(sc.notations ?? {})) {
        for (const phase of ['rest', 'elk']) panes.push([`${scene}/${notation} ${phase}`, n.raw[phase]]);
    }
}

for (const [label, m] of panes) {
    const bars = m.nodes.filter((n: any) => n.form === 'bar');
    if (!bars.length) continue;
    const byId = new Map<string, any>(m.nodes.map((n: any) => [n.id, n]));
    const centre = (n: any): Pt => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });
    const neighboursOf = (b: any) => m.edges
        .filter((e: any) => e.source !== e.target && (e.source === b.id || e.target === b.id))
        .map((e: any) => byId.get(e.source === b.id ? e.target : e.source)).filter(Boolean);
    // (1) the decision on the pane as measured
    const rows = bars.map((b: any) => {
        const declared: Orientation = b.h >= b.w ? 'upright' : 'lying';
        const ns = neighboursOf(b);
        const c = centre(b);
        let sx = 0, sy = 0;
        for (const n of ns) { const p = centre(n); const len = Math.hypot(p.x - c.x, p.y - c.y) || 1; sx += Math.abs(p.x - c.x) / len; sy += Math.abs(p.y - c.y) / len; }
        const decided = barOrientation(c, ns.map(centre), declared, 1.2);
        return { bar: b.name, declared, decided, turns: decided !== declared, ratio: Math.round((Math.max(sx, sy) / Math.max(1e-6, Math.min(sx, sy))) * 100) / 100, endsMoved: decided !== declared ? ns.length : 0 };
    });
    meas(`${label} decisions`, rows);
    // (2) one neighbour dragged round each bar on a circle, (3) shaken near the diagonal
    const drags = bars.map((b: any) => {
        const ns = neighboursOf(b);
        if (!ns.length) return { bar: b.name, skipped: 'no neighbour' };
        const c = centre(b);
        const moving = ns[0];
        const others = ns.slice(1).map(centre);
        const rad = Math.max(120, Math.hypot(centre(moving).x - c.x, centre(moving).y - c.y));
        const count = (h: number, path: Pt[]) => {
            let o: Orientation = b.h >= b.w ? 'upright' : 'lying';
            let turns = 0;
            for (const p of path) { const next = barOrientation(c, [p, ...others], o, h); if (next !== o) { turns++; o = next; } }
            return turns;
        };
        const circle = Array.from({ length: 720 }, (_, i) => ({ x: c.x + rad * Math.cos((i * Math.PI) / 360), y: c.y + rad * Math.sin((i * Math.PI) / 360) }));
        // Near the diagonal of the moving neighbour alone (others still count): a seeded walk of +-3 px.
        let seed = 7;
        const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
        const diag = { x: c.x + rad / Math.SQRT2, y: c.y + rad / Math.SQRT2 };
        const shake = Array.from({ length: 1000 }, () => ({ x: diag.x + (rnd() - 0.5) * 6, y: diag.y + (rnd() - 0.5) * 6 }));
        return { bar: b.name, neighbours: ns.length, circleTurnsH1: count(1, circle), circleTurnsH12: count(1.2, circle), shakeTurnsH1: count(1, shake), shakeTurnsH12: count(1.2, shake) };
    });
    meas(`${label} drags`, drags);
    // (4) cost: every bar of the pane, 100000 times
    const inputs = bars.map((b: any) => ({ c: centre(b), ns: neighboursOf(b).map(centre) }));
    const t0 = performance.now();
    let sink = 0;
    for (let i = 0; i < 100000; i++) for (const x of inputs) sink += barOrientation(x.c, x.ns, 'upright', 1.2) === 'lying' ? 1 : 0;
    const us = ((performance.now() - t0) * 1000) / 100000;
    meas(`${label} cost`, { bars: bars.length, microsecondsPerPaneEvaluation: Math.round(us * 1000) / 1000, sink: sink > -1 });
}
