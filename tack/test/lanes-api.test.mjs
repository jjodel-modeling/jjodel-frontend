// /api/lanes (slice 8): the four absence states, the tiles, the waiting predicate with closure by a commit and
// staleness at 72 h, the token and context join, the per-kind median, and the collect-on-read throttle.
process.env.TZ = 'Europe/Rome';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store/open.mjs';
import { lanesApi } from '../src/board/api.mjs';
import { laneRefresher, startBoard } from '../src/board/server.mjs';

const MIN = 60_000;
const H = 60 * MIN;
const NOW = Date.parse('2026-01-08T12:00:00Z');
const REPO = 'aaaa1111';
const OTHER = 'bbbb2222';

const settings = (over = {}) => () => ({ value: (k) => ({ 'harness.laneRun': 'auto', 'limits.laneMinutes': 90, ...over })[k] });

function world(t) {
  const dir = mkdtempSync(join(tmpdir(), 'tack-lanes-api-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.isOpen && db.close());
  const laneRoot = join(dir, 'lanes');
  mkdirSync(laneRoot);
  for (const k of [REPO, OTHER]) {
    db.prepare("INSERT INTO repos (key, roots, common_dirs, toplevels, remote, state) VALUES (?, '[]', '[]', ?, NULL, 'present')").run(k, JSON.stringify([`/r/${k}`]));
  }
  return { dir, db, laneRoot };
}

/** One lanes row; the defaults are an exited, done, phase2 lane of REPO. */
function lane(db, id, o = {}) {
  const r = {
    repo_key: REPO, session_id: 's', started_ms: NOW - 2 * H, end_ms: NOW - H, live: 0, tier: 'heavy', runs: 1, outcome: 'done',
    last_outcome: 'done', kind: 'phase2', title: `Lane ${id}`, work_ms: 30 * MIN, worktree: `/r/${REPO}`, resolved: 0, adoptions: null,
    cost_usd: 1, chat: null, front: null, ...o,
  };
  db.prepare(`INSERT INTO lanes (id, repo_key, session_id, started_ms, end_ms, live, tier, runs, outcome, blocked_run, over_time, corrective,
    cost_usd, cache_key, last_outcome, kind, title, work_ms, worktree, resolved, adoptions, chat, front)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 'k', ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, r.repo_key, r.session_id, r.started_ms, r.end_ms, r.live, r.tier, r.runs, r.outcome, r.cost_usd, r.last_outcome, r.kind, r.title,
      r.work_ms, r.worktree, r.resolved, r.adoptions, r.chat, r.front);
}

const commit = (db, sha, unit, ms) => db.prepare(`INSERT INTO commits (repo_key, sha, parents, author_time, commit_time, files, insertions, deletions, claude_coauthor, unit)
  VALUES (?, ?, 1, ?, ?, 1, 1, 0, 0, ?)`).run(REPO, sha, Math.floor(ms / 1000), Math.floor(ms / 1000), unit);

const api = (db, laneRoot, o = {}) => lanesApi(db, { repo: REPO, now: NOW, laneRoot, settingsFor: settings(), updatedMs: NOW, ...o });
const ids = (cards) => cards.map((c) => c.id).sort();

test('lanesApi: the four states in order (off, no lane root, no lane of the selection, the page)', (t) => {
  const { db, laneRoot, dir } = world(t);
  lane(db, 'P-2026-01-08-0900');
  const off = api(db, laneRoot, { settingsFor: settings({ 'harness.laneRun': 'off' }) });
  assert.deepEqual([off.state, off.reason], ['off', 'Lanes are turned off for this repository (harness.laneRun)']);
  assert.equal(off.tiles, undefined, 'no tiles, no zeros');
  const missing = join(dir, 'nowhere');
  const nr = api(db, missing);
  assert.deepEqual([nr.state, nr.reason], ['no-root', `No lane-run folder on this machine (${missing})`]);
  const empty = api(db, laneRoot, { repo: OTHER });
  assert.deepEqual([empty.state, empty.reason, empty.running], ['empty', 'No lane-run lanes for this repository', undefined]);
  const ok = api(db, laneRoot);
  assert.deepEqual([ok.state, ok.reason], ['ok', null]);
  assert.equal(api(db, laneRoot, { repo: null, settingsFor: settings({ 'harness.laneRun': 'off' }) }).state, 'ok', 'all repositories: the switch is per repository');
});

test('lanesApi: tiles, attention and the state lists on a mixed fixture', (t) => {
  const { db, laneRoot } = world(t);
  lane(db, 'P-2026-01-08-1100', { live: 1, end_ms: null, started_ms: NOW - 30 * MIN, last_outcome: 'none' });           // running
  lane(db, 'P-2026-01-08-0900', { live: 1, end_ms: null, started_ms: NOW - 3 * H, last_outcome: 'none' });              // running past 90 min
  lane(db, 'P-2026-01-08-0800', { last_outcome: 'question', end_ms: NOW - 2 * H });                                      // waiting
  lane(db, 'P-2026-01-08-0700', { last_outcome: 'hard-stop', end_ms: NOW - 3 * H });                                     // closed by a later commit
  lane(db, 'P-2026-01-04-0700', { last_outcome: 'question', started_ms: NOW - 101 * H, end_ms: NOW - 100 * H });         // stale
  lane(db, 'P-2026-01-08-0600', { last_outcome: 'blocked', outcome: 'blocked', end_ms: NOW - 4 * H });                  // blocked
  lane(db, 'P-2026-01-08-0500', { last_outcome: 'blocked', outcome: 'blocked', end_ms: NOW - 5 * H, resolved: 1 });     // resolved
  lane(db, 'P-2026-01-08-0400', { started_ms: NOW - 8 * H, end_ms: NOW - 7 * H });                                       // done 24 h
  lane(db, 'P-2026-01-08-0300', { started_ms: NOW - 9 * H, end_ms: NOW - 8 * H });                                       // done 24 h
  lane(db, 'P-2026-01-05-0300', { started_ms: NOW - 72 * H, end_ms: NOW - 71 * H });                                     // done, 3 days ago
  lane(db, 'P-2026-01-08-0200', { repo_key: OTHER, last_outcome: 'question' });                                          // another repository
  commit(db, 'c1', 'P-2026-01-08-0700', NOW - 2 * H);
  const day = new Date(NOW); day.setHours(0, 0, 0, 0);
  db.prepare('INSERT INTO lane_spend (lane_id, seq, at_ms, usd) VALUES (?, 0, ?, 2), (?, 0, ?, 3), (?, 0, ?, 7), (?, 0, ?, 11)')
    .run('P-2026-01-08-0400', NOW - 7 * H, 'P-2026-01-08-0300', NOW - 8 * H, 'P-2026-01-05-0300', NOW - 71 * H, 'P-2026-01-08-0200', NOW - H);
  const a = api(db, laneRoot);
  assert.equal(a.state, 'ok');
  const spendToday = (NOW - 7 * H >= day.getTime() ? 2 : 0) + (NOW - 8 * H >= day.getTime() ? 3 : 0);
  assert.deepEqual(a.tiles, { running: 2, waiting: 1, waitingBy: { question: 1, breakpoint: 0, ceiling: 0, 'hard-stop': 0 }, blocked: 2, done24: 2, resolved24: 1, spendToday });
  assert.deepEqual(ids(a.attention.waiting), ['P-2026-01-08-0800']);
  assert.deepEqual(ids(a.attention.blocked), ['P-2026-01-08-0600', 'P-2026-01-08-0900']);
  assert.equal(a.attention.staleCount, 1);
  assert.deepEqual(ids(a.running), ['P-2026-01-08-0900', 'P-2026-01-08-1100']);
  assert.equal(a.running.find((c) => c.id === 'P-2026-01-08-0900').overLimit, true);
  assert.deepEqual(a.byState.done, ['P-2026-01-08-0400', 'P-2026-01-08-0300']);
  assert.deepEqual(a.byState.resolved, ['P-2026-01-08-0500']);
  assert.ok(a.last24.every((c) => !c.live && c.started >= NOW - 24 * H));
  assert.ok(!a.last24.some((c) => c.id === 'P-2026-01-05-0300'));
  assert.match(a.closure, /commit/);
});

test('lanesApi: a waiting lane closes only on a commit naming it after it ended; past 72 h it is counted stale, not listed', (t) => {
  const { db, laneRoot } = world(t);
  lane(db, 'P-2026-01-08-0800', { last_outcome: 'question', end_ms: NOW - 2 * H });
  commit(db, 'c0', 'P-2026-01-08-0800', NOW - 3 * H);
  commit(db, 'c1', 'P-2026-01-07-0000', NOW - H);
  assert.deepEqual(ids(api(db, laneRoot).attention.waiting), ['P-2026-01-08-0800'], 'an earlier commit, or one naming another id, does not close it');
  commit(db, 'c2', 'P-2026-01-08-0800', NOW - H);
  assert.deepEqual(api(db, laneRoot).attention.waiting, []);
  lane(db, 'P-2026-01-05-0800', { last_outcome: 'hard-stop', started_ms: NOW - 73 * H, end_ms: NOW - 72 * H - MIN });
  const a = api(db, laneRoot);
  assert.deepEqual([a.attention.waiting.length, a.attention.staleCount, a.tiles.waiting], [0, 1, 0]);
});

test('lanesApi: tokens in and context peak join the main-thread calls of the sessions whose unit is the lane', (t) => {
  const { db, laneRoot } = world(t);
  lane(db, 'P-2026-01-08-1100', { live: 1, end_ms: null, started_ms: NOW - 10 * MIN });
  db.prepare("INSERT INTO sessions (id, file_id, cwd, unit) VALUES ('s1', 0, '/r', 'P-2026-01-08-1100'), ('s2', 0, '/r', 'P-2026-01-08-1100'), ('s3', 0, '/r', 'other')").run();
  const call = db.prepare('INSERT INTO calls (message_id, session_id, file_id, sidechain, input, output, cache_read, cache_creation, context) VALUES (?, ?, 0, ?, ?, 9, ?, ?, ?)');
  call.run('m1', 's1', 0, 10, 100, 1000, 1110);
  call.run('m2', 's2', 0, 20, 200, 2000, 2220);
  call.run('m3', 's1', 1, 5, 50, 500, 99999);
  call.run('m4', 's3', 0, 7, 7, 7, 50000);
  const c = api(db, laneRoot).running[0];
  assert.deepEqual([c.tokensIn, c.contextPeak], [3330, 2220], 'sidechain and other units left out');
});

test('lanesApi: the median of work per kind over the done lanes of 30 days, absent below five', (t) => {
  const { db, laneRoot } = world(t);
  [10, 20, 30, 40, 50].forEach((m, i) => lane(db, `P-2026-01-0${i + 1}-0100`, { kind: 'fast', work_ms: m * MIN, started_ms: NOW - (i + 1) * 24 * H }));
  lane(db, 'P-2025-11-01-0100', { kind: 'fast', work_ms: 999 * MIN, started_ms: NOW - 40 * 24 * H });
  lane(db, 'P-2026-01-07-0200', { kind: 'fast', work_ms: 999 * MIN, last_outcome: 'blocked' });
  [10, 20, 30, 40].forEach((m, i) => lane(db, `P-2026-01-0${i + 1}-0300`, { kind: 'phase2', work_ms: m * MIN, started_ms: NOW - (i + 1) * 24 * H }));
  lane(db, 'P-2026-01-08-1100', { kind: 'fast', live: 1, end_ms: null, started_ms: NOW - 10 * MIN });
  const a = api(db, laneRoot);
  assert.deepEqual(a.medianByKind, { fast: { ms: 30 * MIN, n: 5 } });
  assert.equal(a.running[0].medianMs, 30 * MIN);
});

test('laneRefresher: collects on the first read, not again within 20 s, never while a notifier lease is fresh', (t) => {
  const { db, laneRoot } = world(t);
  let clock = NOW;
  let runs = 0;
  const r = laneRefresher({ db, laneRoot, now: () => clock, collect: () => { runs++; } });
  assert.equal(r.refresh(), true);
  assert.equal(r.updatedMs(), NOW);
  clock += 19_999;
  assert.equal(r.refresh(), false, 'a second read within 20 s collects nothing');
  assert.equal(runs, 1);
  clock += 1;
  assert.equal(r.refresh(), true);
  assert.equal(runs, 2);
  db.prepare('INSERT INTO notify_lease (id, pid, heartbeat_ms) VALUES (1, 4242, ?)').run(clock + 25_000);
  clock += 30_000;
  assert.equal(r.refresh(), false, 'the watcher collects');
  assert.equal(runs, 2);
  assert.equal(r.updatedMs(), clock - 5_000, 'updated: the heartbeat of the lease');
  clock += 70_000;
  assert.equal(r.refresh(), true, 'a stale lease no longer holds the collection');
});

test('GET /api/lanes on a board: the payload of the state, and a malformed repository refused', async (t) => {
  const { dir, laneRoot } = world(t);
  const b = await startBoard({ store: join(dir, 'store2.db'), root: join(dir, 'none'), cwd: dir, port: 0, scanOnStart: false, sample: false,
    user: join(dir, 'settings.json'), laneRoot });
  t.after(() => b.close());
  const r = await fetch(`${b.url}api/lanes`);
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.deepEqual([body.state, typeof body.updatedMs], ['empty', 'number']);
  assert.equal((await fetch(`${b.url}api/lanes?repo=zz`)).status, 400);
});

const commitId = (db, sha, id, ms) => {
  commit(db, sha, 'P-2026-01-08-9999', ms);
  db.prepare('INSERT INTO commit_ids (repo_key, sha, prompt_id) VALUES (?, ?, ?)').run(REPO, sha, id);
};

test('closure: a commit naming the Prompt-ID outside the unit slot closes the lane, but only after it ended', (t) => {
  const { db, laneRoot } = world(t);
  lane(db, 'P-2026-01-08-0800', { last_outcome: 'question', end_ms: NOW - 3 * H });
  lane(db, 'P-2026-01-08-0810', { last_outcome: 'question', end_ms: NOW - 3 * H });
  commitId(db, 'c1', 'P-2026-01-08-0800', NOW - H);   // named by a commit whose unit is another id
  commitId(db, 'c2', 'P-2026-01-08-0810', NOW - 4 * H); // named before the lane ended
  assert.deepEqual(ids(api(db, laneRoot).attention.waiting), ['P-2026-01-08-0810']);
});

test('closure: a prompt Status starting eseguito or done closes the lane; da eseguire and no status do not', (t) => {
  const { db, laneRoot } = world(t);
  const set = (id, st) => db.prepare('UPDATE lanes SET prompt_status = ? WHERE id = ?').run(st, id);
  for (const id of ['P-2026-01-08-0801', 'P-2026-01-08-0802', 'P-2026-01-08-0803', 'P-2026-01-08-0804']) lane(db, id, { last_outcome: 'question' });
  set('P-2026-01-08-0801', 'eseguito');
  set('P-2026-01-08-0802', 'done');
  set('P-2026-01-08-0803', 'da');
  assert.deepEqual(ids(api(db, laneRoot).attention.waiting), ['P-2026-01-08-0803', 'P-2026-01-08-0804']);
  assert.match(api(db, laneRoot).closure, /Status:.*eseguito or done/);
});
