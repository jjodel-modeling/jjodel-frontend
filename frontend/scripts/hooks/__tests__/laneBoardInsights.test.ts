import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// insights.js, the "First-shot over time" card (P-2026-10-11-1138): each square at the time its lane
// started, squares of one column stacked from the baseline up, the columns widened above 30 rows. The
// board's insights.js runs in node:vm on a stub DOM, as in laneBoardStrip.test.ts, with a fetch that
// answers /api/timeline and /api/insights from the fixtures below instead of a board process.
// A test name states the mutation that turns it red (CLAUDE.md 5); the bench that established it is
// in the commit message.
//
// LANE_BOARD_INSIGHTS points the suite at another copy of the script (the mutation bench).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.LANE_BOARD_INSIGHTS ? resolve(process.env.LANE_BOARD_INSIGHTS) : resolve(HERE, '..', '..', 'lane-board', 'insights.js');
const CODE = readFileSync(SCRIPT, 'utf8');

// The chart's geometry, as timeCard declares it.
const L = 8, R = 8, W = 1000, CELL = 10, STEP = 12, DAY = 864e5;

type Stub = Record<string, any>;
function stubEl(extra: Stub = {}): Stub {
    const kids = new Map<string, Stub>();
    return {
        innerHTML: '', textContent: '', hidden: false, dataset: {}, style: {},
        addEventListener() {},
        querySelector: (s: string) => { if (!kids.has(s)) kids.set(s, stubEl()); return kids.get(s); },
        querySelectorAll: () => [],
        appendChild: () => {},
        // insights.js measures SVG text: six pixels a character is enough for a layout nobody looks at.
        getBBox() { return { width: 6 * String(this.textContent).length, height: 12 }; },
        ...extra,
    };
}

/** insights.js on a stub DOM, its fetch answered from `api`; resolves to the HTML of the Insights tab. */
async function insights(api: Record<string, unknown>, range: string): Promise<string> {
    const byId = new Map<string, Stub>();
    const window: Stub = { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }), innerWidth: 1400, innerHeight: 900 };
    const ls = new Map([['laneINS.range', range]]);
    const ctx = vm.createContext({
        window, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {},
        matchMedia: window.matchMedia, innerWidth: 1400, innerHeight: 900,
        document: {
            head: stubEl(), body: stubEl(), createElement: () => stubEl(),
            getElementById: (id: string) => { if (!byId.has(id)) byId.set(id, stubEl()); return byId.get(id); },
            querySelector: () => stubEl(), querySelectorAll: () => [],
        },
        localStorage: { getItem: (k: string) => (ls.has(k) ? ls.get(k)! : null), setItem: (k: string, v: string) => { ls.set(k, String(v)); } },
        fetch: async (u: string) => ({ json: async () => api[u] }),
    });
    vm.runInContext(CODE, ctx);
    await window.INS.refresh();
    return byId.get('ins')!.innerHTML;
}

// Thursday 8 October 2026 at noon, local time. Range 7: from Thursday 1 October at noon, so the chart runs
// from Monday 28 September (t0) to Monday 12 October (t1), two weeks over W - L - R pixels.
const NOW = new Date(2026, 9, 8, 12).getTime();
const at = (d: number, h = 0, m = 0, s = 0) => new Date(2026, 9, d, h, m, s).getTime();
const T0 = new Date(2026, 8, 28).getTime(), T1 = at(12);
const xOf = (t: number) => L + (W - L - R) * (t - T0) / (T1 - T0);

type Lane = Record<string, any>;
let seq = 0;
const lane = (start: number, o: Lane = {}): Lane => ({
    id: 'P-TEST-' + String(++seq).padStart(3, '0'), start, end: start + 600_000, model: 'claude-opus-5-5', firstShot: true, ageDays: 10,
    kind: 'fast', primaryArea: '', files: [], lines: {}, causa: [], criticalZone: false, final: 'done',
    signals: { corrective: false, correctedBy: [], selfCorrected: false, reverted: [], blockedRun: false, overTime: false }, ...o,
});

type Square = { id: string; x: number; y: number };
type Card = { squares: Map<string, Square>; marks: { x: number; col: string }[]; ticks: number[]; H: number; base: number; rows: number; colW: number; text: string };

/** The card "First-shot over time" for these lanes and RC rows, in range 7. */
async function card(lanes: Lane[], harness: Lane[] = []): Promise<Card> {
    const html = await insights({
        '/api/timeline': { now: NOW, lanes: [], chainDeps: [] },
        '/api/insights': { now: NOW, areas: [], bands: [], harness, lanes },
    }, '7');
    const from = html.indexOf('<h3>First-shot over time</h3>');
    expect(from).toBeGreaterThan(-1);
    const text = html.slice(from, html.indexOf('</svg>', from));
    const svg = /<svg viewBox="0 0 1000 ([\d.]+)"[^>]*>/.exec(text)!;
    const H = Number(svg[1]), base = H - 18;
    const attr = (n: string) => { const m = new RegExp(' ' + n + '="([\\d.]+)"').exec(svg[0]); return m ? Number(m[1]) : NaN; };
    const squares = new Map<string, Square>();
    for (const m of text.matchAll(/<rect x="([-\d.]+)" y="([-\d.]+)" width="10" height="10" rx="2" fill="[^"]+"[^>]*? data-tip="([^"|]+)\|/g)) squares.set(m[3], { id: m[3], x: Number(m[1]), y: Number(m[2]) });
    const marks = [...text.matchAll(/<line x1="([-\d.]+)" y1="[-\d.]+" x2="[-\d.]+" y2="[-\d.]+" stroke="(var\(--accent\)|var\(--muted\))" stroke-dasharray="3 3"\/>/g)].map((m) => ({ x: Number(m[1]), col: m[2] }));
    const ticks = [...text.matchAll(/<line x1="([-\d.]+)" y1="([-\d.]+)" x2="[-\d.]+" y2="([-\d.]+)" stroke="var\(--line\)"\/>/g)]
        .filter((m) => Number(m[2]) === base && Number(m[3]) === base + 4).map((m) => Number(m[1]));
    return { squares, marks, ticks, H, base, rows: attr('data-rows'), colW: attr('data-col-width'), text };
}

/** The column of a square: its left edge and width, from the square's x and the card's column width. */
const column = (c: Card, sq: Square) => { const left = L + Math.floor((sq.x - L) / c.colW) * c.colW; return [left, left + c.colW]; };
const inColumn = (c: Card, sq: Square, x: number) => { const [a, b] = column(c, sq); return x >= a && x < b; };

describe('first-shot over time: squares on the time axis', () => {
    test('kills "squares laid out from the week\'s left edge", "the clamp to t0 dropped", "the square off the centre of its column": each square in the column of its start, centred, a later lane to the right', async () => {
        const early = lane(at(5, 9)), later = lane(at(7, 16)), before = lane(new Date(2026, 8, 27, 23).getTime(), { end: at(2) });
        const c = await card([before, early, later], [{ id: 'RC-60', date: '2026-10-06', title: 'a Tuesday decision' }]);
        const e = c.squares.get(early.id)!, l = c.squares.get(later.id)!, b = c.squares.get(before.id)!;
        expect([e, l, b].every(Boolean)).toBe(true);
        expect(c.colW).toBe(STEP);
        expect(inColumn(c, e, xOf(early.start))).toBe(true);
        expect(inColumn(c, l, xOf(later.start))).toBe(true);
        // A lane started before the chart's first Monday sits in its first column.
        expect(column(c, b)).toEqual([L, L + STEP]);
        for (const sq of [e, l, b]) expect(sq.x + CELL / 2).toBe(column(c, sq)[0] + c.colW / 2);
        expect(l.x).toBeGreaterThan(e.x);
        // The Wednesday lane is right of the Tuesday RC line, in the same week.
        const rc = c.marks.find((m) => m.col === 'var(--muted)')!;
        expect(rc.x).toBeCloseTo(xOf(at(6)), 6);
        expect(l.x).toBeGreaterThan(rc.x);
    });

    test('kills "same-column lanes side by side", "the stack in reverse order": lanes of one column share x and stack upward in start order', async () => {
        const ls = [lane(at(7, 10)), lane(at(7, 10, 5)), lane(at(7, 10, 10))];
        const c = await card(ls);
        // The fixture holds: the three starts fall in one column of STEP px.
        expect(new Set(ls.map((l) => Math.floor((xOf(l.start) - L) / STEP))).size).toBe(1);
        const sq = ls.map((l) => c.squares.get(l.id)!);
        expect(new Set(sq.map((s) => s.x)).size).toBe(1);
        expect(sq.map((s) => s.y)).toEqual([c.base - STEP, c.base - 2 * STEP, c.base - 3 * STEP]);
    });

    test('kills "the column index rounded", "the square shifted off its column": a lane exactly at a marker\'s time has the marker\'s x inside its column', async () => {
        const first = lane(at(2, 14), { model: 'claude-sonnet-5-5' }), atRc = lane(at(6));
        const c = await card([first, atRc, lane(at(7, 10))], [{ id: 'RC-61', date: '2026-10-06', title: 'a Tuesday decision' }]);
        const model = c.marks.find((m) => m.col === 'var(--accent)' && Math.abs(m.x - xOf(first.start)) < 1e-6)!;
        const rc = c.marks.find((m) => m.col === 'var(--muted)')!;
        expect(model).toBeDefined();
        expect(rc).toBeDefined();
        expect(inColumn(c, c.squares.get(first.id)!, model.x)).toBe(true);
        expect(inColumn(c, c.squares.get(atRc.id)!, rc.x)).toBe(true);
        for (const id of [first.id, atRc.id]) { const sq = c.squares.get(id)!; expect(sq.x + CELL / 2).toBe(column(c, sq)[0] + STEP / 2); }
    });

    test('kills "the height from the first or the last column", "fewer than 3 rows", "the bottom square on the baseline": the chart is as tall as its tallest stack, 3 rows at least', async () => {
        const one = lane(at(5, 9));
        const c1 = await card([one]);
        expect(c1.rows).toBe(3);
        expect(c1.squares.get(one.id)!.y).toBe(c1.base - STEP);

        const mid = [0, 1, 2, 3, 4].map((i) => lane(at(7, 10, i)));
        const ls = [one, lane(at(5, 9, 5)), ...mid, lane(at(8, 8))];
        const c5 = await card(ls);
        expect(c5.rows).toBe(5);
        expect(c5.H - c1.H).toBe(2 * STEP);
        expect(mid.map((l) => c5.squares.get(l.id)!.y)).toEqual([1, 2, 3, 4, 5].map((r) => c5.base - r * STEP));
        expect(Math.min(...[...c5.squares.values()].map((s) => s.y))).toBe(c5.base - 5 * STEP);
    });

    test('kills "widening at 30 rows", "widening only once", "the rows counted without the width", "a partial row not centred": above 30 rows the columns widen by STEP until the stack fits', async () => {
        const burst = (n: number) => Array.from({ length: n }, (_, i) => lane(at(7, 10, 0, 10 * i)));

        const c30 = await card(burst(30));
        expect([c30.colW, c30.rows]).toEqual([STEP, 30]);

        const b31 = burst(31), c31 = await card(b31);
        expect([c31.colW, c31.rows]).toEqual([2 * STEP, 16]);
        const sq = b31.map((l) => c31.squares.get(l.id)!);
        // Two across, in start order, inside the column of their start; the lone 31st centred on the column.
        const [left] = column(c31, sq[0]);
        expect(inColumn(c31, sq[0], xOf(b31[0].start))).toBe(true);
        expect([sq[0].x, sq[1].x, sq[0].y, sq[1].y]).toEqual([left + 1, left + 1 + STEP, c31.base - STEP, c31.base - STEP]);
        expect([sq[30].x + CELL / 2, sq[30].y]).toEqual([left + c31.colW / 2, c31.base - 16 * STEP]);
        expect(Math.min(...sq.map((s) => s.y))).toBe(c31.base - 16 * STEP);

        const c61 = await card(burst(61));
        expect([c61.colW, c61.rows]).toEqual([3 * STEP, 21]);
        expect(c61.H - c30.H).toBe(-9 * STEP);
    });

    test('kills "no day ticks", "a tick per week": one light tick per day on the baseline, the week labels kept', async () => {
        const c = await card([lane(at(5, 9)), lane(at(7, 10))]);
        expect(c.ticks.length).toBe(14);
        c.ticks.forEach((x, i) => expect(x).toBeCloseTo(xOf(T0 + i * DAY), 6));
        // en-GB as this node's ICU writes it ("28 Sept" here), not a spelling fixed in the test.
        for (const w of [T0, at(5)]) expect(c.text).toContain('>week of ' + new Date(w).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + '</text>');
        expect(c.text).toContain('>n=2</text>');
    });
});
