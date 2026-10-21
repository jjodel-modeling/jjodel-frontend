// Breakpoint, ceiling and hard-stop (stops slice): the classification of a lane whose last turn ended Outcome:
// hard-stop, the [auto] resume count, the store (schema 8, a one-time scan of old lanes), the Lanes API and the
// pills. One fixture per class; a declared Stop: line wins over the inference.
process.env.TZ = 'Europe/Rome';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store/open.mjs';
import { collectLanes, isAutoResume, plannedStopSection, readLane, stopKindOf } from '../src/collectors/lane-run/collect.mjs';
import { lanesApi } from '../src/board/api.mjs';
import { loadViews } from './helpers/views.mjs';
import { resultEvent, writeLane } from './helpers/layers-fixture.mjs';

const MIN = 60_000;
const NOW = Date.parse('2026-01-08T12:00:00Z');
const V = loadViews(['charts.js', 'board.js', 'lanes.js']);
const L = V.TackLanes;

const PLANNED = '# Slice\n\nLane: full\n\n## COSA\nx\n\n## HARD STOP\nEnd of Phase 1: the report committed.\n\n## DOVE\ny\n';
const NONE = '# Slice\n\nLane: fast\n\n## HARD STOP\nNone planned.\n\n## DOVE\ny\n';

function world(t) {
  const dir = mkdtempSync(join(tmpdir(), 'tack-stops-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.isOpen && db.close());
  const root = join(dir, 'lanes');
  mkdirSync(root);
  return { dir, db, root };
}

/** A lane that exited on a turn whose result text is `text`; extra files and resume messages as given. */
function stopLane(root, id, { text, prompt = null, files = {}, msgs = [], inputs = null }) {
  const dir = writeLane(root, id, {
    started: NOW - 3 * 60 * MIN, exitAt: NOW - 60 * MIN,
    inputs: inputs ?? [{ at: NOW - 3 * 60 * MIN, text: prompt ?? '' }],
    events: [resultEvent({ ms: 50 * MIN, usd: 1, text: `${text}\nOutcome: hard-stop` })],
  });
  msgs.forEach((m, i) => writeFileSync(join(dir, `msg-${i + 1}.md`), m));
  for (const [n, c] of Object.entries(files)) writeFileSync(join(dir, n), c);
  return dir;
}

test('stopKindOf: a declared Stop: line wins over the handoff and the planned section', () => {
  const facts = { handoff: true, promptText: PLANNED, kind: 'discovery', result: 'Phase 1 done, context ceiling reached, handoff written.' };
  assert.equal(stopKindOf({ ...facts, result: facts.result + '\nStop: unplanned' }), 'hard-stop');
  assert.equal(stopKindOf({ ...facts, result: facts.result + '\nStop: planned' }), 'breakpoint');
  assert.equal(stopKindOf({ ...facts, handoff: false, result: 'Phase 1 done.\nStop: ceiling' }), 'ceiling');
});

test('stopKindOf: handoff.md and a result naming the ceiling is a ceiling; a handoff file alone is not', () => {
  const r = 'I hit the context ceiling (AM-8); the handoff is in the lane folder.';
  assert.equal(stopKindOf({ result: r, handoff: true, promptText: NONE }), 'ceiling');
  assert.equal(stopKindOf({ result: r, handoff: false, promptText: NONE }), 'hard-stop', 'no handoff.md: the words alone do not make a ceiling');
  assert.equal(stopKindOf({ result: 'Gates are red.', handoff: true, promptText: NONE }), 'hard-stop', 'a handoff.md the result does not mention');
});

test('stopKindOf: a planned HARD STOP section that the result reached is a breakpoint; none planned is a hard-stop', () => {
  assert.equal(stopKindOf({ result: 'Phase 1 is committed.', promptText: PLANNED, kind: 'phase2' }), 'breakpoint');
  assert.equal(stopKindOf({ result: 'The visual check is due.', promptText: PLANNED, kind: 'phase2' }), 'breakpoint');
  assert.equal(stopKindOf({ result: 'Anything at all.', promptText: PLANNED, kind: 'discovery' }), 'breakpoint', 'a discovery ends at its planned stop');
  assert.equal(stopKindOf({ result: 'Anything at all.', promptText: PLANNED, kind: 'phase2' }), 'hard-stop', 'the planned stop was not reached');
  assert.equal(stopKindOf({ result: 'Phase 1 is committed.', promptText: NONE, kind: 'discovery' }), 'hard-stop', '«None planned» plans no stop');
  assert.equal(stopKindOf({ result: 'Phase 1 is committed.', promptText: '# no section here', kind: 'discovery' }), 'hard-stop');
  assert.equal(stopKindOf({ result: 'Gates are red.', promptText: '' }), 'hard-stop');
});

test('plannedStopSection: the body, null for None, None planned and a missing section', () => {
  assert.equal(plannedStopSection(PLANNED), 'End of Phase 1: the report committed.');
  assert.equal(plannedStopSection(NONE), null);
  assert.equal(plannedStopSection('## Hard stop\n- None\n'), null);
  assert.equal(plannedStopSection('# x\n\n## COSA\ny'), null);
  assert.equal(plannedStopSection('## HARD STOP\nAt the end of the file.'), 'At the end of the file.');
});

test('isAutoResume: [auto] at the start, with or without the Prompt-ID bracket', () => {
  assert.equal(isAutoResume('[P-2026-10-21-1015] [auto] GO Phase 2'), true);
  assert.equal(isAutoResume('[auto] GO Phase 2'), true);
  assert.equal(isAutoResume('  [P-2026-10-21-1015]   [AUTO] GO'), true);
  assert.equal(isAutoResume('[P-2026-10-21-1015] GO Phase 2'), false);
  assert.equal(isAutoResume('GO [auto]'), false, 'the marker is read at the start only');
  assert.equal(isAutoResume(''), false);
});

test('readLane: one fixture per class, the prompt from prompt.txt or, when it is gone, from input-1.md', (t) => {
  const { root } = world(t);
  const pf = join(root, '..', 'prompt-file.md');
  writeFileSync(pf, PLANNED);
  const kinds = {
    'P-2026-01-08-0100': stopLane(root, 'P-2026-01-08-0100', { text: 'I hit the context ceiling; the handoff is written.', files: { 'handoff.md': '# h' }, prompt: PLANNED }),
    'P-2026-01-08-0200': stopLane(root, 'P-2026-01-08-0200', { text: 'Phase 1 is committed, stopping.', files: { 'prompt.txt': pf }, prompt: NONE }),
    'P-2026-01-08-0300': stopLane(root, 'P-2026-01-08-0300', { text: 'Gates are red, stopping.', prompt: NONE }),
    'P-2026-01-08-0400': stopLane(root, 'P-2026-01-08-0400', { text: 'Phase 1 is committed.', prompt: PLANNED, files: { 'prompt.txt': join(root, 'gone.md') } }),
    'P-2026-01-08-0500': stopLane(root, 'P-2026-01-08-0500', { text: 'Done.\nStop: unplanned', prompt: PLANNED, files: { 'prompt.txt': pf } }),
  };
  const got = Object.fromEntries(Object.keys(kinds).map((id) => [id, readLane(kinds[id]).stopKind]));
  assert.deepEqual(got, {
    'P-2026-01-08-0100': 'ceiling', 'P-2026-01-08-0200': 'breakpoint', 'P-2026-01-08-0300': 'hard-stop',
    'P-2026-01-08-0400': 'breakpoint', 'P-2026-01-08-0500': 'hard-stop',
  });
});

test('readLane: stopKind is null unless the last turn ended hard-stop', (t) => {
  const { root } = world(t);
  const dir = writeLane(root, 'P-2026-01-08-0600', { started: NOW - 120 * MIN, exitAt: NOW - 60 * MIN, inputs: [{ at: NOW - 120 * MIN, text: PLANNED }],
    events: [resultEvent({ ms: 50 * MIN, usd: 1, text: 'Phase 1 committed.\nOutcome: done' })] });
  assert.equal(readLane(dir).stopKind, null);
});

test('readLane: auto_resumes counts the resumes that start with [auto]; the msg files and the input files alike', (t) => {
  const { root } = world(t);
  const a = stopLane(root, 'P-2026-01-08-0700', { text: 'x', msgs: ['[P-2026-01-08-0700] [auto] GO', '[auto] GO again', 'GO by hand'] });
  assert.deepEqual([readLane(a).resumes, readLane(a).autoResumes], [3, 2]);
  const b = stopLane(root, 'P-2026-01-08-0800', { text: 'x', inputs: [
    { at: NOW - 180 * MIN, text: '# the prompt' }, { at: NOW - 120 * MIN, text: '[P-2026-01-08-0800] [auto] GO Phase 2' }, { at: NOW - 100 * MIN, text: '[P-2026-01-08-0800] GO' }] });
  assert.deepEqual([readLane(b).resumes, readLane(b).autoResumes], [2, 1], 'input-1 is the prompt, not a resume');
  const c = stopLane(root, 'P-2026-01-08-0900', { text: 'x' });
  assert.deepEqual([readLane(c).resumes, readLane(c).autoResumes], [0, 0]);
});

test('collectLanes stores stop_kind, resumes and auto_resumes, and no message text', (t) => {
  const { db, root, dir } = world(t);
  stopLane(root, 'P-2026-01-08-1000', { text: 'Phase 1 is committed.', prompt: PLANNED, msgs: ['[auto] GO secret-text-xyz'] });
  collectLanes(db, root, NOW);
  const r = { ...db.prepare('SELECT * FROM lanes WHERE id = ?').get('P-2026-01-08-1000') };
  assert.deepEqual([r.stop_kind, r.resumes, r.auto_resumes, r.stop_scanned], ['breakpoint', 1, 1, 1]);
  assert.ok(!readFileSync(join(dir, 'store.db')).includes('secret-text-xyz'));
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 8);
});

test('collectLanes: a lane read before schema 8 is scanned once, and keeps its prompt_status', (t) => {
  const { db, root } = world(t);
  stopLane(root, 'P-2026-01-08-1100', { text: 'Phase 1 is committed.', prompt: PLANNED });
  collectLanes(db, root, NOW);
  db.exec("UPDATE lanes SET stop_scanned = 0, stop_kind = NULL, prompt_status = 'eseguito' WHERE id = 'P-2026-01-08-1100'");
  const st = collectLanes(db, root, NOW);
  const r = { ...db.prepare('SELECT * FROM lanes WHERE id = ?').get('P-2026-01-08-1100') };
  assert.equal(st.stopScanned, 1);
  assert.deepEqual([r.stop_kind, r.prompt_status, r.stop_scanned], ['breakpoint', 'eseguito', 1]);
  assert.equal(collectLanes(db, root, NOW).stopScanned, 0, 'not scanned again');
});

function row(db, id, o = {}) {
  db.prepare(`INSERT INTO lanes (id, repo_key, session_id, started_ms, end_ms, live, tier, runs, outcome, blocked_run, over_time, corrective, cost_usd,
    cache_key, last_outcome, kind, title, work_ms, worktree, resolved, stop_kind, resumes, auto_resumes)
    VALUES (?, 'R', 's', ?, ?, 0, 'heavy', 1, 'hard-stop', 0, 0, 0, 1, 'k', ?, 'phase2', 'T', 1000, '/r', 0, ?, ?, ?)`)
    .run(id, NOW - 120 * MIN, NOW - 60 * MIN, o.last ?? 'hard-stop', o.stop ?? null, o.resumes ?? 0, o.auto ?? 0);
}

test('lanesApi: the card carries stopKind and auto; waiting is counted by kind', (t) => {
  const { db, root } = world(t);
  db.prepare("INSERT INTO repos (key, roots, common_dirs, toplevels, remote, state) VALUES ('R', '[]', '[]', ?, NULL, 'present')").run(JSON.stringify(['/r']));
  row(db, 'P-2026-01-08-1101', { stop: 'breakpoint', resumes: 2, auto: 2 });
  row(db, 'P-2026-01-08-1102', { stop: 'breakpoint', resumes: 1, auto: 0 });
  row(db, 'P-2026-01-08-1103', { stop: 'hard-stop' });
  row(db, 'P-2026-01-08-1104', { stop: 'ceiling' });
  row(db, 'P-2026-01-08-1105', { last: 'question' });
  row(db, 'P-2026-01-08-1106', { last: 'done' });
  const d = lanesApi(db, { repo: 'R', now: NOW, laneRoot: root, settingsFor: () => ({ value: (k) => ({ 'harness.laneRun': 'auto', 'limits.laneMinutes': 90 })[k] }), updatedMs: NOW });
  assert.deepEqual(d.tiles.waitingBy, { question: 1, breakpoint: 2, ceiling: 1, 'hard-stop': 1 });
  assert.equal(d.tiles.waiting, 5);
  const by = Object.fromEntries(d.last24.map((c) => [c.id, c]));
  assert.deepEqual([by['P-2026-01-08-1101'].stopKind, by['P-2026-01-08-1101'].auto], ['breakpoint', true]);
  assert.deepEqual([by['P-2026-01-08-1102'].stopKind, by['P-2026-01-08-1102'].auto], ['breakpoint', false], 'a manual GO: no auto');
  assert.deepEqual([by['P-2026-01-08-1103'].auto, by['P-2026-01-08-1104'].auto], [false, false], 'no resume: no auto');
  assert.equal(by['P-2026-01-08-1105'].stopKind, null);
  assert.equal(by['P-2026-01-08-1106'].stopKind, null);
});

const card = (o = {}) => ({
  id: 'P-2026-01-08-1101', kind: 'phase2', title: 'T', tier: 'heavy', front: null, chat: null, direct: false, critical: false, live: false,
  started: NOW - 120 * MIN, end: NOW - 60 * MIN, workMs: 1000, spanMs: 1000, medianMs: null, overLimit: false, tokensIn: 1, contextPeak: 1, cost: 1,
  outcome: 'hard-stop', lastOutcome: 'hard-stop', stopKind: 'hard-stop', auto: false, resolved: false, adoptions: null, worktree: null, mergeState: null, closed: false, ...o,
});

test('the page shows breakpoint, ceiling and hard-stop as three pills with a tooltip each, and auto beside the outcome', () => {
  const cards = [card({ id: 'P-A', stopKind: 'breakpoint', auto: true }), card({ id: 'P-B', stopKind: 'ceiling' }), card({ id: 'P-C', stopKind: 'hard-stop' }), card({ id: 'P-D', lastOutcome: 'question', stopKind: null })];
  const d = {
    repo: null, state: 'ok', reason: null, updatedMs: NOW, closure: 'c', running: [],
    tiles: { running: 0, waiting: 4, waitingBy: { question: 1, breakpoint: 1, ceiling: 1, 'hard-stop': 1 }, blocked: 0, done24: 0, resolved24: 0, spendToday: 0 },
    attention: { waiting: cards, blocked: [], staleCount: 0 }, last24: cards,
    byState: { running: [], waiting: [], blocked: [], done: [], resolved: [], other: [] }, adoptions: [], medianByKind: {},
  };
  const h = L.html(d, NOW);
  for (const [cls, label] of [['ln-bp', 'breakpoint'], ['ln-ceil', 'ceiling'], ['ln-wait', 'hard-stop']]) {
    assert.ok(h.includes(`<span class="tag ${cls}" title="${V.TackCharts.esc(L.STOP_TIPS[label])}">${label}</span>`), `${label} pill with its tooltip`);
  }
  assert.ok(/<span class="tag ln-wait">question<\/span>/.test(h), 'a question keeps its own pill');
  assert.equal((h.match(/class="tag ln-auto"/g) || []).length, 2, 'auto once in the attention list and once in the table, for the one auto lane');
  assert.ok(/ln-bp"[^>]*>breakpoint<\/span> <span class="tag ln-auto"/.test(h), 'auto follows the outcome pill');
  assert.ok(h.includes('1 breakpoint · 1 ceiling · 1 hard-stop · 1 question'), 'the tile and the banner count the kinds separately');
});

test('waitText: plural by count, zero kinds left out, null without any', () => {
  assert.equal(L.waitText({ breakpoint: 2, 'hard-stop': 1, ceiling: 0, question: 0 }), '2 breakpoints · 1 hard-stop');
  assert.equal(L.waitText({ question: 3 }), '3 questions');
  assert.equal(L.waitText({ breakpoint: 0 }), null);
  assert.equal(L.waitText(undefined), null);
});
