// The lane-run adapter and the layer 2/3 metrics over a synthetic lane root: turns and spend deltas, the
// Outcome line, the resume input classes, blocked and over-90-minute runs, a read-only adapter, and the
// first-shot rule with its rework signals. Days are local; the zone is pinned as in metrics.test.mjs.
process.env.TZ = 'Europe/Rome';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store/open.mjs';
import { collectLanes, costEvents, inputClass, laneOutcome, readLane, results } from '../src/collectors/lane-run/collect.mjs';
import { collectLogs } from '../src/collectors/log/collect.mjs';
import { computeAll, loadSelection } from '../src/metrics/index.mjs';
import { laneFirstShot } from '../src/metrics/layer3.mjs';
import { NOW, assistantText, fixtureLanes, resultEvent, snapshot } from './helpers/layers-fixture.mjs';

const Z = (s) => Date.parse(s);
const MIN = 60_000;
const REPO = 'R1';

function world(t) {
  const dir = mkdtempSync(join(tmpdir(), 'tack-lanes-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.isOpen && db.close());
  const root = join(dir, 'lanes');
  mkdirSync(root);
  const lane = fixtureLanes(root, { worktree: `/r/${REPO}` });
  db.prepare("INSERT INTO repos (key, roots, common_dirs, toplevels, remote, state) VALUES (?, ?, '[]', ?, NULL, 'present')")
    .run(REPO, JSON.stringify([REPO]), JSON.stringify([`/r/${REPO}`]));
  // The session of lane L7, which has no worktree.txt, sits in the repository.
  db.prepare('INSERT INTO sessions (id, file_id, cwd) VALUES (?, 0, ?)').run('sess-7', `/r/${REPO}`);
  db.prepare('INSERT INTO session_repo (session_id, repo_key, missing, link_method) VALUES (?, ?, NULL, ?)').run('sess-7', REPO, 'direct');
  return { dir, db, root, lane };
}

const laneRow = (db, id) => ({ ...db.prepare('SELECT * FROM lanes WHERE id = ?').get(id) });
const spendRows = (db, id) => db.prepare('SELECT seq, at_ms, usd FROM lane_spend WHERE lane_id = ? ORDER BY seq').all(id).map((r) => ({ ...r }));
const line = (e) => Buffer.from(JSON.stringify(e) + '\n');

test('laneOutcome: the last assistant Outcome line, as one of four words, unparsed, or none', () => {
  const asst = (text) => line(assistantText(text));
  assert.equal(laneOutcome(null), 'none');
  assert.equal(laneOutcome(asst('no outcome line here')), 'none');
  assert.equal(laneOutcome(asst('x\nOutcome: question')), 'question');
  assert.equal(laneOutcome(asst('x\nOutcome: hard-stop')), 'hard-stop');
  assert.equal(laneOutcome(asst('x\nOutcome: finished')), 'unparsed');
  assert.equal(laneOutcome(Buffer.concat([asst('Outcome: blocked'), asst('later\nOutcome: done')])), 'done', 'the last line wins');
  const userLine = line({ type: 'user', message: { content: [{ type: 'text', text: 'Outcome: blocked' }] } });
  assert.equal(laneOutcome(Buffer.concat([asst('Outcome: done'), userLine])), 'done', 'a line that is not assistant text is ignored');
});

test('results and costEvents: a result closes a turn; a task notification and an empty zero-turn result close none', () => {
  const buf = Buffer.concat([
    line(resultEvent({ ms: 1000, usd: 1, text: 'Outcome: `blocked`' })),
    line({ type: 'result', origin: { kind: 'task-notification' }, total_cost_usd: 1.5, result: 'bg done', duration_ms: 5 }),
    line({ type: 'result', num_turns: 0, result: '', total_cost_usd: 1.5, duration_ms: 5 }),
    line(resultEvent({ ms: 2000, usd: 2, text: 'ok' })),
  ]);
  assert.deepEqual(results(buf), [{ ms: 1000, outcome: 'blocked' }, { ms: 2000, outcome: '' }]);
  const co = costEvents(buf);
  assert.deepEqual(co.events, [{ usd: 1, turn: 0 }, { usd: 1.5, turn: 0 }, { usd: 1.5, turn: 0 }, { usd: 2, turn: 1 }], 'a non-turn event takes the preceding turn');
  assert.equal(co.max, 2);
});

test('inputClass: the class of a resume input from its first line', () => {
  const cls = (s) => inputClass(s);
  assert.equal(cls('Rework: the table is wrong'), 'corrective');
  assert.equal(cls('[P-2026-01-06-1000] Fix the header'), 'corrective', 'a leading unit tag is ignored');
  assert.equal(cls('ACK, go on'), 'ack');
  assert.equal(cls('Answers to the questions:'), 'answer');
  assert.equal(cls('GO.'), 'go');
  assert.equal(cls('The Mac went to sleep, resume.'), 'recovery');
  assert.equal(cls('/status-flip P-2026-01-06-1000'), 'closure');
  assert.equal(cls('Please look at the cache'), 'other');
  assert.equal(cls('Phase 2 starts now\n\nwith two fixes'), 'other', 'the fix-count rule is off for a Phase 2 line');
  assert.equal(cls('Continue\n\ntwo fixes before the GO'), 'corrective', 'a body rule');
});

test('readLane: turns, spend deltas and facts of a clean lane, a resumed lane, a restart of the cost and a running lane', (t) => {
  const { root, lane } = world(t);
  const l1 = readLane(join(root, lane.L1), NOW);
  assert.equal(l1.outcome, 'done');
  assert.deepEqual([l1.runs, l1.tier, l1.corrective, l1.blockedRun, l1.overTime, l1.live, l1.cost], [1, 'heavy', false, false, false, false, 1.5]);
  assert.deepEqual(l1.spend, [{ seq: 0, at: Z('2026-01-06T09:10:00Z'), usd: 1.5 }], 'one turn, started.txt to exit.txt');
  // L2: two inputs, so two turns: the first ends at its result's duration, the second at its own start plus duration.
  const l2 = readLane(join(root, lane.L2), NOW);
  assert.equal(l2.corrective, true);
  assert.equal(l2.runs, 2);
  assert.deepEqual(l2.spend, [
    { seq: 0, at: Z('2026-01-06T10:05:00Z'), usd: 1.0 },
    { seq: 1, at: Z('2026-01-06T10:30:00Z') + 400_000, usd: 1.5 },
  ]);
  assert.equal(l2.cost, 2.5, 'the cost is the largest total, not the sum of the events');
  // L5: the total falls from 2.0 to 0.4: a restart, the new total is its own spend.
  assert.deepEqual(readLane(join(root, lane.L5), NOW).spend.map((s) => s.usd), [2.0, 0.4]);
  // L6: no exit.txt and a live pid: running, its turn ends at now.
  const l6 = readLane(join(root, lane.L6), NOW);
  assert.deepEqual([l6.live, l6.end], [true, null]);
  assert.deepEqual(l6.spend, [{ seq: 0, at: NOW, usd: 0.8 }]);
});

test('collectLanes: one row per lane with its outcome, flags and repository, and the spend rows', (t) => {
  const { db, root, lane } = world(t);
  const st = collectLanes(db, root, NOW);
  assert.deepEqual([st.enabled, st.lanes, st.read, st.errors, st.spendRows], [true, 7, 7, 0, 9]);
  const flags = (id) => { const r = laneRow(db, id); return [r.outcome, r.blocked_run, r.over_time, r.corrective, r.live, r.runs, r.repo_key, r.cost_usd]; };
  assert.deepEqual(flags(lane.L1), ['done', 0, 0, 0, 0, 1, REPO, 1.5]);
  assert.deepEqual(flags(lane.L2), ['done', 0, 0, 1, 0, 2, REPO, 2.5], 'a corrective resume input');
  assert.deepEqual(flags(lane.L3), ['blocked', 1, 0, 0, 0, 1, REPO, 0.5], 'a blocked run and a blocked final outcome');
  assert.deepEqual(flags(lane.L4), ['done', 0, 1, 0, 0, 1, REPO, 3], 'a result above 90 minutes');
  assert.deepEqual(flags(lane.L5), ['done', 0, 0, 0, 0, 1, REPO, 2], 'a clean lane with a cost restart');
  assert.deepEqual(flags(lane.L6), ['none', 0, 0, 0, 1, 1, REPO, 0.8]);
  assert.deepEqual(flags(lane.L7), ['done', 0, 0, 0, 0, 1, REPO, 1.2], 'no worktree.txt: the repository of its session');
  assert.equal(laneRow(db, lane.L6).end_ms, null);
  assert.equal(laneRow(db, lane.L1).end_ms, Z('2026-01-06T09:10:00Z'));
  assert.deepEqual(spendRows(db, lane.L2), [
    { seq: 0, at_ms: Z('2026-01-06T10:05:00Z'), usd: 1 }, { seq: 1, at_ms: Z('2026-01-06T10:30:00Z') + 400_000, usd: 1.5 },
  ]);
  assert.deepEqual(spendRows(db, lane.L5).map((r) => r.usd), [2, 0.4]);
  // A second pass skips the lanes that exited and did not change; the running one is read again.
  const again = collectLanes(db, root, NOW);
  assert.deepEqual([again.read, again.unchanged], [1, 6]);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM lane_spend').get().n, 9, 'a re-read replaces the spend rows, it does not add');
});

test('collectLanes writes nothing in the lane root: names, sizes and mtimes are the same after', (t) => {
  const { db, root } = world(t);
  const before = snapshot(root);
  assert.ok(before.length > 40, 'control: the listing sees the files');
  collectLanes(db, root, NOW);
  collectLanes(db, root, NOW);
  assert.deepEqual(snapshot(root), before);
  // Control on the same listing: a write is seen.
  writeFileSync(join(root, 'P-2026-01-06-0900', 'extra.txt'), 'x');
  assert.notDeepEqual(snapshot(root), before);
});

test('collectLanes: no lane folder leaves the adapter off; a folder that is not a unit id is ignored', (t) => {
  const { db, dir, root } = world(t);
  assert.deepEqual(collectLanes(db, join(dir, 'absent'), NOW), { enabled: false, lanes: 0, read: 0, unchanged: 0, errors: 0, spendRows: 0 });
  mkdirSync(join(root, 'scratch'));
  assert.equal(collectLanes(db, root, NOW).lanes, 7);
});

/** Log entries of the repository, written where the log collector reads imports. */
function writeLog(dir, entries) {
  const imports = join(dir, 'imports');
  mkdirSync(join(imports, REPO), { recursive: true });
  writeFileSync(join(imports, REPO, 'log.jsonl'), entries.map((e) => JSON.stringify(e)).join('\n') + '\n');
  return imports;
}
const taskEntry = (unit, f = {}) => ({
  contract: 1, type: 'task', date: unit.slice(2, 12), title: `t ${unit}`, unit, summary: 's', outcome: 'completed', corrects: null, cause: null,
  regressions: 'no', out_of_scope: false, ...f,
});

function layered(t) {
  const w = world(t);
  const { db, dir, lane } = w;
  const imports = writeLog(dir, [
    taskEntry(lane.L1),
    taskEntry(lane.L5),
    taskEntry(lane.L3, { outcome: 'problems', cause: 'a', regressions: 'unknown' }),
    // Another unit corrects L5: L5 itself ended clean.
    taskEntry('P-2026-01-08-0800', { corrects: lane.L5, cause: 'c', regressions: 'yes', out_of_scope: true }),
    { contract: 1, type: 'ticket', date: '2026-01-07', title: 'tk', finding: 'f', priority: 'high', found_in: lane.L3 },
  ]);
  collectLanes(db, w.root, NOW);
  const logs = collectLogs(db, { imports });
  // Commits: two of L1's unit, one of L7's and the revert of that one.
  const ins = db.prepare(`INSERT INTO commits (repo_key, sha, parents, author_time, commit_time, files, insertions, deletions, unit, claude_coauthor, reverts)
    VALUES (?, ?, 1, ?, ?, 0, 0, 0, ?, 0, ?)`);
  const at = Z('2026-01-07T18:00:00Z') / 1000;
  ins.run(REPO, 'c1', at, at, lane.L1, null);
  ins.run(REPO, 'c2', at + 60, at + 60, lane.L1, null);
  ins.run(REPO, 'c7', at + 120, at + 120, lane.L7, null);
  ins.run(REPO, 'r7', at + 180, at + 180, null, 'c7');
  // Sessions: U1 has a prompt session and a resume linked by commit, U2 one prompt session without a known cost.
  const ses = db.prepare('INSERT INTO sessions (id, file_id, cwd, first_ts, last_ts, cost_usd, cost_known, cost_unknown_model, unit, unit_source) VALUES (?, 0, ?, ?, ?, ?, ?, 0, ?, ?)');
  const link = db.prepare('INSERT INTO session_repo (session_id, repo_key, missing, link_method) VALUES (?, ?, NULL, ?)');
  for (const [id, first, cost, unit, source] of [['u1a', '2026-01-06T09:00:00Z', 1.25, lane.L1, 'prompt'], ['u1b', '2026-01-06T11:00:00Z', 0.75, lane.L1, 'commit'],
    ['u2', '2026-01-07T09:00:00Z', null, lane.L2, 'prompt'], ['nou', '2026-01-07T10:00:00Z', 4, null, null]]) {
    ses.run(id, `/r/${REPO}`, first, first, cost, cost === null ? 0 : 1, unit, source);
    link.run(id, REPO, 'direct');
  }
  return { ...w, logs };
}

test('layer 3 over lanes and a log: outcome, cause_tally, regression_rate, out_of_scope_rate', (t) => {
  const { db, logs } = layered(t);
  assert.equal(logs.entries, 5);
  const m = computeAll(loadSelection(db, {}));
  assert.deepEqual(m.outcome.log, { entries: 4, completed: 3, partial: 0, problems: 1 });
  assert.deepEqual(m.outcome.lanes, { lanes: 7, done: 5, 'hard-stop': 0, question: 0, blocked: 1, unparsed: 0, none: 0, running: 1 });
  assert.equal(m.cause_tally.total, 2);
  assert.deepEqual([m.cause_tally.causes.a, m.cause_tally.causes.c], [1, 1]);
  assert.deepEqual(m.regression_rate, { yes: 1, no: 2, unknown: 1, share: 1 / 3 });
  assert.deepEqual(m.out_of_scope_rate, { yes: 1, no: 3, unknown: 0, share: 0.25 });
});

test('first_shot over lanes: only the clean lane counts; corrective, blocked, long, corrected and reverted do not; the running one is left out', (t) => {
  const { db, lane } = layered(t);
  const fs = computeAll(loadSelection(db, {})).first_shot;
  assert.deepEqual(fs, { rule: 'lanes', n: 6, firstShot: 1, share: 1 / 6, running: 1, rework: 3, failedRun: 2 });
  const by = Object.fromEntries(laneFirstShot(db, db.prepare('SELECT * FROM lanes ORDER BY id').all()).map((x) => [x.id, x]));
  assert.equal(by[lane.L1].firstShot, true);
  assert.equal(by[lane.L2].signals.corrective, true, 'a corrective resume input');
  assert.equal(by[lane.L3].failedRun, true);
  assert.equal(by[lane.L3].signals.blockedRun, true);
  assert.equal(by[lane.L4].signals.overTime, true);
  assert.equal(by[lane.L6].firstShot, null);
  assert.equal(by[lane.L6].final, 'running');
  // L5 ended done and clean; the log entry of another unit corrects it.
  assert.deepEqual(by[lane.L5].signals.correctedBy, ['P-2026-01-08-0800']);
  assert.equal(by[lane.L5].signals.selfCorrected, false);
  assert.equal(by[lane.L5].firstShot, false);
  // L7: a commit of its unit was reverted.
  assert.equal(by[lane.L7].signals.reverted, 1);
  assert.equal(by[lane.L7].firstShot, false);
});

test('first_shot: an entry that corrects its own unit is self-corrected, not corrected by another', (t) => {
  const { db, dir, lane, root } = world(t);
  const imports = writeLog(dir, [taskEntry(lane.L1), taskEntry(`${lane.L1}-2`, { corrects: lane.L1, cause: 'a', outcome: 'partial' })]);
  collectLanes(db, root, NOW);
  collectLogs(db, { imports });
  const x = laneFirstShot(db, db.prepare('SELECT * FROM lanes WHERE id = ?').all(lane.L1))[0];
  assert.equal(x.signals.selfCorrected, true, 'unit P-...-2 is the same base unit');
  assert.deepEqual(x.signals.correctedBy, []);
  assert.equal(x.firstShot, false);
});

test('layer 2 over the same store: commits_per_unit, cost_per_unit and resumes_per_unit', (t) => {
  const { db, lane } = layered(t);
  const m = computeAll(loadSelection(db, {}));
  assert.deepEqual(m.commits_per_unit, { units: 2, commits: 3, median: 1.5, max: 2 });
  const c = m.cost_per_unit;
  assert.deepEqual([c.units, c.sessions, c.sessionsWithoutUnit, c.source, c.usd, c.unknown], [2, 3, 2, { prompt: 2, commit: 1 }, 2, 1]); // sessionsWithoutUnit: nou and sess-7
  assert.deepEqual(c.top.map((r) => [r.unit, r.usd, r.sessions]), [[lane.L1, 2, 2], [lane.L2, 0, 1]]);
  assert.deepEqual(m.resumes_per_unit, { units: 2, resumes: 1, median: 0.5, max: 1, histogram: { 0: 1, 1: 1, '2+': 0 } });
});

test('without lanes and without a log, the layer 3 metrics answer not-adopted', (t) => {
  const { db } = world(t);
  const m = computeAll(loadSelection(db, {}));
  for (const k of ['outcome', 'first_shot', 'cause_tally', 'regression_rate', 'out_of_scope_rate']) assert.equal(m[k], 'not-adopted', k);
});
