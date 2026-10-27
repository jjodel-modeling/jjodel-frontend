// The board's SVG chart helpers and formatters (src/board/charts.js), run in a vm as the page runs
// them: empty series, one point, unknown values, and the short forms the Sessions table shows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadViews } from './helpers/views.mjs';
import { modelFamily } from '../src/metrics/layer1.mjs';

const { TackCharts: C } = loadViews(['charts.js']);
const cats = (n) => Array.from({ length: n }, (_, i) => ({ key: 'c' + i, label: 'C' + i }));
const count = (svg, re) => (svg.match(re) || []).length;

test('bars: no category, or no value at all, gives the empty note and no svg', () => {
  for (const o of [{ cats: [], stacks: [] }, { cats: cats(3), stacks: [{ name: 'a', color: 'red', values: [null, undefined, 'x'] }] }]) {
    const s = C.bars(o);
    assert.match(s, /class="ch-empty"/);
    assert.doesNotMatch(s, /<svg/);
  }
  assert.match(C.bars({ cats: [], stacks: [], empty: 'Nothing here.' }), /Nothing here\./);
});

test('bars: one point draws one bar, one hit column and a text alternative', () => {
  const s = C.bars({ cats: cats(1), stacks: [{ name: 'Cost', color: 'var(--f-opus)', values: [3] }], fmt: (v) => '$' + v, label: 'Cost per day' });
  assert.match(s, /^<svg class="ch"[^>]* role="img" aria-label="Cost per day"><title>Cost per day<\/title>/);
  assert.equal(count(s, /fill="var\(--f-opus\)"/g), 1);
  assert.equal(count(s, /class="ch-hit"/g), 1);
  assert.match(s, /<title>C0\nCost: \$3<\/title>/);
  assert.match(s, /fill="var\(--t-muted\)">\$5</, 'the axis tops at the next 1-2-5 step');
});

test('bars: an unknown value is drawn as nothing and read as –, never as 0; marks draw the «?» marker', () => {
  const s = C.bars({ cats: cats(3), stacks: [{ name: 'Cost', color: 'red', values: [2, null, 0] }], marks: [0, 2, 0], markLabel: 'unknown cost', fmt: String });
  assert.equal(count(s, /fill="red"/g), 1, 'only the known positive value has a mark');
  assert.match(s, /<title>C1\nCost: –\n2 unknown cost<\/title>/);
  assert.match(s, /<title>C2\nCost: 0<\/title>/, 'a real 0 is read as 0');
  assert.equal(count(s, /class="ch-unk"/g), 1);
  const t = C.bars({ cats: cats(2), stacks: [{ name: 'n', color: 'red', values: [3, 'n/a'] }], fmt: String });
  assert.match(t, />2\.5</, 'a non-numeric value adds nothing to the axis maximum (5, not NaN)');
});

test('bars: stacked segments in series order, a surface gap between them, the top one rounded', () => {
  const s = C.bars({ cats: cats(1), stacks: [{ name: 'a', color: 'A', values: [5] }, { name: 'b', color: 'B', values: [5] }] });
  assert.ok(s.indexOf('fill="A"') < s.indexOf('fill="B"'));
  assert.match(s, /<rect [^>]*fill="A"\/>/);
  assert.match(s, /<path d="M[^"]*Q[^"]*" fill="B"\/>/);
});

test('line: empty gives the note; one point a lone marker and no path; a missing value breaks the line', () => {
  assert.match(C.line({ cats: [], values: [] }), /ch-empty/);
  assert.match(C.line({ cats: cats(2), values: [null, null] }), /ch-empty/);
  const one = C.line({ cats: cats(1), values: [4], label: 'Overlap' });
  assert.equal(count(one, /<circle/g), 1);
  assert.doesNotMatch(one, /<path/);
  const gap = C.line({ cats: cats(5), values: [1, 2, null, 3, 4] });
  const d = /<path d="([^"]+)"/.exec(gap)[1];
  assert.equal(count(d, /M/g), 2, 'two runs, the gap is not bridged');
  assert.match(gap, /<title>C2\n–<\/title>/);
});

test('meters: a null share reads unknown, with no fill; a share draws its fill', () => {
  assert.match(C.meters({ parts: [] }), /ch-empty/);
  const s = C.meters({ parts: [{ label: 'Calls', value: 0.25, color: 'F' }, { label: 'Cost', value: null, color: 'G' }] });
  assert.match(s, />25%</);
  assert.match(s, />unknown</);
  assert.equal(count(s, /fill="F"/g), 1);
  assert.equal(count(s, /fill="G"/g), 0);
});

test('multiples: one panel per entry, each with its own axis and title', () => {
  const s = C.multiples([{ title: 'Count', cats: cats(2), stacks: [{ name: 'n', color: 'X', values: [1, 2] }] }, { title: 'Hours', kind: 'line', cats: cats(2), values: [1, null] }]);
  assert.equal(count(s, /class="ch-panel"/g), 2);
  assert.equal(count(s, /<svg/g), 2);
  assert.match(C.multiples([]), /ch-empty/);
});

test('niceMax and dayRange: 1-2-5 steps; local days without a gap, across a month end', () => {
  assert.deepEqual([0, 0.3, 1, 3, 7, 12, 4100].map(C.niceMax), [1, 0.5, 1, 5, 10, 20, 5000]);
  assert.deepEqual([...C.dayRange(['2026-11-01', '2026-10-30'])], ['2026-10-30', '2026-10-31', '2026-11-01']);
  assert.deepEqual([...C.dayRange([])], []); // arrays from the vm realm, copied for deepEqual
});

test('dayLabel: Oct 19 in the current year, the year added otherwise, never truncated', () => {
  const now = new Date(2026, 9, 19);
  assert.equal(C.dayLabel('2026-10-19', now), 'Oct 19');
  assert.equal(C.dayLabel('2025-12-31', now), 'Dec 31, 2025');
  assert.equal(C.dayLabel(null, now), '–');
  assert.equal(C.dayShort('2025-01-02'), 'Jan 2');
});

test('modelShort and family: short names; the page and the metrics agree on every family', () => {
  const ids = ['claude-opus-5-5', 'claude-opus-5-5[1m]', 'anthropic/claude-opus-4.8', 'claude-haiku-4-5-20251001', 'claude-sonnet-5', 'z-ai/glm-5.3', 'claude-fixture-3'];
  assert.deepEqual(ids.map(C.modelShort), ['opus 5.5', 'opus 5.5 1M', 'opus 4.8', 'haiku 4.5', 'sonnet 5', 'glm-5.3', 'fixture-3']);
  assert.deepEqual(ids.map(C.family), ids.map(modelFamily));
  assert.deepEqual(ids.map(C.family), ['opus', 'opus', 'opus', 'haiku', 'sonnet', 'other', 'other']);
});

// The viewBox is the container width in px (src/board/charts.js chartWidth), so the 10 px axis text keeps its size.
const axisTexts = (svg) => [...svg.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]), text: m[3] }));
const categoryLabels = (svg) => axisTexts(svg).filter((t) => t.y === 171); // the row under the baseline (180 - 24 + 15)
const oneSeries = (n) => [{ name: 'Cost', color: 'var(--f-opus)', values: Array.from({ length: n }, (_, i) => i + 1) }];

test('chartWidth: the pixel width rounded, never below 240; 520 when unknown', () => {
  assert.equal(C.chartWidth(1126), 1126);
  assert.equal(C.chartWidth(1126.4), 1126);
  assert.equal(C.chartWidth(1126.6), 1127);
  assert.equal(C.chartWidth(240), 240);
  assert.equal(C.chartWidth(100), 240);
  for (const unknown of [undefined, null, NaN, 0, -5, '700']) assert.equal(C.chartWidth(unknown), 520, String(unknown));
});

test('bars at width 1126: the viewBox is 0 0 1126 180, no axis text goes past W - 18, the last label is there', () => {
  const s = C.bars({ cats: cats(30), stacks: oneSeries(30), width: 1126 });
  assert.match(s, / viewBox="0 0 1126 180" /);
  const texts = axisTexts(s);
  assert.ok(texts.length > 4, 'control: the regex sees the axis texts');
  for (const t of texts) assert.ok(t.x <= 1126 - 18, `text "${t.text}" at x ${t.x}`);
  assert.ok(categoryLabels(s).some((t) => t.text === 'C29'), 'the last category label is drawn');
  // The default width is the old one.
  assert.match(C.bars({ cats: cats(3), stacks: oneSeries(3) }), / viewBox="0 0 520 180" /);
});

test('bars at width 300: the category labels are at least 56 apart and the last one is kept', () => {
  const s = C.bars({ cats: cats(30), stacks: oneSeries(30), width: 300 });
  assert.match(s, / viewBox="0 0 300 180" /);
  const xs = categoryLabels(s).map((t) => t.x).sort((a, b) => a - b);
  assert.ok(xs.length >= 3, 'control: several labels are drawn');
  for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 56, `labels at ${xs[i - 1]} and ${xs[i]}`);
  assert.ok(xs.at(-1) <= 300 - 18);
  assert.ok(categoryLabels(s).some((t) => t.text === 'C29'));
});

test('bars: no axis text goes past W - 18 and the last label is drawn, for every width and category count tried', () => {
  for (const w of [240, 300, 360, 520, 800, 1126]) {
    for (const n of [1, 2, 3, 7, 14, 30, 31, 90]) {
      const s = C.bars({ cats: cats(n), stacks: oneSeries(n), width: w });
      for (const t of axisTexts(s)) assert.ok(t.x <= w - 18, `width ${w}, ${n} categories: "${t.text}" at ${t.x}`);
      assert.ok(categoryLabels(s).some((t) => t.text === 'C' + (n - 1)), `width ${w}, ${n} categories: the last label`);
    }
  }
});

const spacingFailures = (widths, counts) => {
  const out = [];
  for (const w of widths) {
    for (const n of counts) {
      const xs = categoryLabels(C.bars({ cats: cats(n), stacks: oneSeries(n), width: w })).map((t) => t.x).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) if (xs[i] - xs[i - 1] < 56) { out.push(`width ${w}, ${n} categories: labels at ${xs[i - 1]} and ${xs[i]}`); break; }
    }
  }
  return out;
};

test('bars: labels are at least 56 apart for up to 14 categories at every width', () => {
  assert.deepEqual(spacingFailures([240, 300, 360, 520, 800, 1126], [1, 2, 3, 7, 14]), []);
});

// Bug (src/board/charts.js xLabels + labelX): xLabels keeps labels 56 px apart by their bar centres, but labelX then
// moves the LAST label left to W - 18, so the one before it can end up closer. Measured on the current code:
// width 300 with 44, 48, 52, ... categories gives 49.2 px; width 240 with 30 categories gives 49.5 px;
// also 520/49 (52.1), 800/40 (55.4), 1126/91 (54.9).
test('bars: labels are at least 56 apart for 30 to 90 categories at the narrow widths', () => {
  assert.deepEqual(spacingFailures([240, 300], [30, 31, 44, 90]), []);
});

test('line and meters take the same width option', () => {
  assert.match(C.line({ cats: cats(30), values: Array.from({ length: 30 }, (_, i) => i), width: 700 }), / viewBox="0 0 700 /);
  assert.match(C.meters({ parts: [{ label: 'Calls', value: 0.5, color: 'F' }], width: 700 }), / viewBox="0 0 700 /);
  const s = C.line({ cats: cats(30), values: Array.from({ length: 30 }, (_, i) => i), width: 1126 });
  for (const t of axisTexts(s)) assert.ok(t.x <= 1126 - 18, `"${t.text}" at ${t.x}`);
});

test('xLabels: the last label is always shown, the others are at least 56 apart in px', () => {
  for (const [n, W] of [[30, 300], [7, 1126], [90, 520], [2, 240], [1, 240]]) {
    const show = C.xLabels(n, W);
    const idx = Array.from({ length: n }, (_, i) => i).filter(show);
    assert.equal(idx.at(-1), n - 1, `${n} categories, width ${W}`);
    const bw = (W - 44 - 8) / n;
    for (let i = 1; i < idx.length; i++) assert.ok((idx[i] - idx[i - 1]) * bw >= 56 - 1e-9, `${n} categories, width ${W}: ${idx[i - 1]} and ${idx[i]}`);
  }
});
