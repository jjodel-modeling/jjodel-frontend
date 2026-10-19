// The Lanes page (slice 8), drawn by src/board/lanes.js in a vm without a DOM: running cards with the median
// label or none, the disabled phase and arch cells with their reasons, the absence sentence, the adoption panel,
// and the 20 s poll paused while the tab is hidden.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadViews } from './helpers/views.mjs';

const V = loadViews(['charts.js', 'board.js', 'lanes.js']);
const L = V.TackLanes;
const NOW = Date.parse('2026-01-08T12:00:00Z');
const MIN = 60_000;

const card = (o = {}) => ({
  id: 'P-2026-01-08-1100', kind: 'phase2', title: 'Slice 8 <Lanes>', tier: 'heavy', front: 'tack', chat: 'C-2026-01-08-1000', direct: false,
  critical: false, live: true, started: NOW - 40 * MIN, end: null, workMs: 35 * MIN, spanMs: null, medianMs: 38 * MIN, overLimit: false,
  tokensIn: 1_234_567, contextPeak: 150_000, cost: 2.5, outcome: 'none', lastOutcome: 'none', resolved: false, adoptions: null,
  worktree: '/w/jjodel-w-tack-s8', mergeState: null, closed: false, ...o,
});

const ok = (o = {}) => ({
  repo: null, state: 'ok', reason: null, updatedMs: NOW, closure: 'A waiting lane closes when a commit names its Prompt-ID after the lane ended.',
  tiles: { running: 1, waiting: 0, blocked: 0, done24: 1, resolved24: 0, spendToday: 4.5 },
  attention: { waiting: [], blocked: [], staleCount: 0 },
  running: [card()],
  last24: [card({ id: 'P-2026-01-08-0900', live: false, end: NOW - 2 * 3600e3, spanMs: 3600e3, lastOutcome: 'done', outcome: 'done', adoptions: 2 })],
  byState: { running: ['P-2026-01-08-1100'], waiting: [], blocked: [], done: ['P-2026-01-08-0900'], resolved: [], other: [] },
  adoptions: [{ id: 'P-2026-01-08-0900', front: 'tack', chat: null, end: NOW - 2 * 3600e3, count: 2, lastOutcome: 'done' }],
  medianByKind: { phase2: { ms: 38 * MIN, n: 7 } },
  ...o,
});

test('running card: elapsed against the median of its kind, or no median label without one; the title escaped', () => {
  const h = L.runningCard(card(), NOW);
  assert.match(h, /data-id="P-2026-01-08-1100"/);
  assert.match(h, /35 min/);
  assert.match(h, /median 38 min/);
  assert.ok(h.includes('Slice 8 &lt;Lanes&gt;') && !h.includes('<Lanes>'));
  const none = L.runningCard(card({ medianMs: null }), NOW);
  assert.doesNotMatch(none, /median/);
  assert.match(L.runningCard(card({ overLimit: true }), NOW), /over the time limit/);
});

test('the phase and arch cells are disabled with their reasons, never a number', () => {
  const h = L.html(ok(), NOW);
  assert.ok(h.includes(V.TackCharts.esc(L.PHASE_REASON)) && /Phase progress is not tracked in v0/.test(L.PHASE_REASON));
  assert.ok(h.includes(L.ARCH_REASON) && /Architect-chat tokens are not collected in v0/.test(L.ARCH_REASON));
  assert.equal((h.match(/class="ln-dis"/g) || []).length, 3, 'one phase cell per running card, one arch header and one arch cell per row');
});

test('launched by: the chat of the Chat: header, else a dash with the reason', () => {
  assert.match(L.runningCard(card(), NOW), /C-2026-01-08-1000/);
  const h = L.runningCard(card({ chat: null }), NOW);
  assert.ok(h.includes('title="' + L.LAUNCH_NOTE + '">—</span>'));
});

test('absent states show only the sentence: no tile, no zero, no table', () => {
  for (const [state, reason] of [['off', 'Lanes are turned off for this repository (harness.laneRun)'], ['no-root', 'No lane-run folder on this machine (/x)'], ['empty', 'No lane-run lanes for this repository']]) {
    const h = L.html({ repo: null, state, reason, updatedMs: null }, NOW);
    assert.ok(h.includes(reason), state);
    assert.doesNotMatch(h, /class="kpi"|<table|>0</, state);
  }
});

test('the page: tiles, the attention list with the closure rule, the adoption panel and its empty state', () => {
  const h = L.html(ok({ attention: { waiting: [card({ id: 'P-2026-01-08-0800', live: false, lastOutcome: 'question', end: NOW - 3600e3 })], blocked: [], staleCount: 2 } }), NOW);
  assert.match(h, /class="kpi"/);
  assert.match(h, /\$4\.50/);
  assert.ok(h.includes('A waiting lane closes when a commit names its Prompt-ID'), 'the closure rule in the tooltip');
  assert.match(h, /2 older than 72 h/);
  assert.match(h, /as reported in each lane's closing message/);
  assert.match(h, /Updated/);
  const none = L.html(ok({ adoptions: [] }), NOW);
  assert.match(none, /No lane reported an unattended decision/);
});

test('the poll runs every 20 s and loads only while the page is visible and the Lanes tab is shown', () => {
  let fn = null; let every = 0; let loads = 0;
  let visible = false; let tab = 'lanes';
  const p = L.poller({ load: () => { loads++; }, visible: () => visible, active: () => tab === 'lanes', timers: { setInterval: (f, ms) => { fn = f; every = ms; } } });
  p.start();
  assert.equal(every, 20_000);
  fn();
  assert.equal(loads, 0, 'hidden: no load');
  visible = true;
  fn();
  assert.equal(loads, 1);
  tab = 'sessions';
  fn();
  assert.equal(loads, 1, 'another tab: no load');
});
