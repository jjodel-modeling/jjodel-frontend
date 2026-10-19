// Layer-1 metrics on synthetic stores. Days are local: this file pins TZ to Europe/Rome (UTC+1 in
// January), so a local day and a UTC day differ by one hour and the midnight cases can tell them apart.
process.env.TZ = 'Europe/Rome';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openStore } from '../src/store/open.mjs';
import { METRICS, computeAll, loadSelection, resolveRepo } from '../src/metrics/index.mjs';
import { dayBounds, dayOf } from '../src/metrics/days.mjs';
import * as L from '../src/metrics/layer1.mjs';

const TACK = fileURLToPath(new URL('../bin/tack.mjs', import.meta.url));
const Z = (s) => Date.parse(s); // a UTC instant
const iso = (ms) => new Date(ms).toISOString();
const MIN = 60_000;

function store(t) {
  const dir = mkdtempSync(join(tmpdir(), 'tack-metrics-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.isOpen && db.close());
  return { db, dir };
}

function repo(db, key, toplevel = `/r/${key}`) {
  db.prepare("INSERT INTO repos (key, roots, common_dirs, toplevels, remote, state) VALUES (?, ?, '[]', ?, NULL, 'present')")
    .run(key, JSON.stringify([key]), JSON.stringify([toplevel]));
}

function session(db, id, { first, last, repo: key = null, cost = null, partial = 0, link = key ? 'direct' : 'none' } = {}) {
  db.prepare(`INSERT INTO sessions (id, file_id, cwd, first_ts, last_ts, cost_usd, cost_known, cost_unknown_model)
    VALUES (?, 0, ?, ?, ?, ?, ?, ?)`).run(id, `/cwd/${id}`, first == null ? null : iso(first), last == null ? null : iso(last), cost, cost === null ? 0 : 1, partial);
  db.prepare('INSERT INTO session_repo (session_id, repo_key, missing, link_method) VALUES (?, ?, ?, ?)').run(id, key, key ? null : 'path-gone', link);
}

let seq = 0;
function call(db, sid, ts, { side = 0, model = 'm', input = 0, output = 0, cr = 0, cc = 0 } = {}) {
  db.prepare(`INSERT INTO calls (message_id, session_id, file_id, ts, model, sidechain, input, output, cache_read, cache_creation, context)
    VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`).run(`msg_${++seq}`, sid, ts == null ? null : iso(ts), model, side, input, output, cr, cc, input + cr + cc);
}

const commitAt = (db, key, ms) => db.prepare(`INSERT INTO commits (repo_key, sha, parents, author_time, commit_time, files, insertions, deletions, claude_coauthor)
  VALUES (?, ?, 1, ?, ?, 0, 0, 0, 0)`).run(key, `sha${++seq}`, ms / 1000, ms / 1000);

const all = (db, opts) => computeAll(loadSelection(db, opts));

test('days: the zone is pinned, local and UTC days differ around midnight', () => {
  assert.equal(dayOf(Z('2026-01-05T23:30:00Z')), '2026-01-06');
  assert.equal(dayOf(Z('2026-01-05T23:30:00Z'), { utc: true }), '2026-01-05');
  assert.deepEqual(dayBounds('2026-01-06'), [Z('2026-01-05T23:00:00Z'), Z('2026-01-06T23:00:00Z')]);
  assert.equal(dayBounds('2026-03-29')[1] - dayBounds('2026-03-29')[0], 23 * 3600_000, 'the DST day lasts 23 hours');
});

test('every metric declares its name, layer and a one-line definition', () => {
  assert.equal(new Set(METRICS.map((m) => m.name)).size, METRICS.length);
  for (const m of METRICS) {
    assert.ok([1, 2, 3].includes(m.layer), m.name);
    assert.ok(m.definition && !m.definition.includes('\n'), m.name);
    assert.equal(typeof m.compute, 'function');
  }
  assert.deepEqual(METRICS.filter((m) => m.layer === 1).map((m) => m.name), ['sessions_per_day', 'cost_per_day', 'tokens_per_day',
    'context_peak', 'calls_per_session', 'waits', 'overlap', 'commit_proximity', 'subagent_share']);
  assert.ok(METRICS.filter((m) => m.layer > 1).every((m) => m.enabledBy));
});

test('empty selection: every metric answers, with zeros and nulls, none throws', (t) => {
  const { db } = store(t);
  const m = all(db);
  assert.deepEqual(m.sessions_per_day, { days: {}, undated: 0, total: 0 });
  assert.deepEqual(m.cost_per_day.total, { usd: 0, known: 0, unknown: 0, partial: 0 });
  assert.deepEqual([m.context_peak.n, m.context_peak.median, m.context_peak.max, m.context_peak.atOrAbove], [0, null, null, 0]);
  assert.deepEqual([m.calls_per_session.n, m.calls_per_session.median], [0, null]);
  assert.deepEqual(m.waits.total, { count: 0, ms: 0 });
  assert.deepEqual(m.overlap, { repos: {}, days: {}, unlinked: 0 });
  assert.equal(m.commit_proximity.total.share, null);
  assert.deepEqual([m.subagent_share.calls.share, m.subagent_share.cost.share], [null, null]);
  for (const s of METRICS.filter((x) => x.layer > 1)) assert.equal(m[s.name], 'not-adopted', s.name);
});

test('a single session: one day, its cost, its tokens, its peak and its calls', (t) => {
  const { db } = store(t);
  const t0 = Z('2026-01-05T09:00:00Z');
  session(db, 's', { first: t0, last: t0 + 2 * MIN, cost: 1.5 });
  call(db, 's', t0, { input: 10, output: 20, cr: 30, cc: 40 });
  call(db, 's', t0 + MIN, { input: 1, output: 2, cr: 3, cc: 4 });
  const m = all(db);
  assert.deepEqual(m.sessions_per_day.days, { '2026-01-05': 1 });
  assert.deepEqual(m.cost_per_day.days, { '2026-01-05': { usd: 1.5, known: 1, unknown: 0, partial: 0 } });
  assert.deepEqual(m.tokens_per_day.days, { '2026-01-05': { input: 11, output: 22, cache_read: 33, cache_creation: 44 } });
  assert.deepEqual([m.context_peak.n, m.context_peak.max, m.context_peak.median], [1, 80, 80]);
  assert.deepEqual([m.calls_per_session.total, m.calls_per_session.max], [2, 2]);
  assert.deepEqual(m.overlap.unlinked, 1, 'a session without a repository is left out of overlap');
});

test('cost: unknown cost is counted apart, never as 0; a partial cost is flagged', (t) => {
  const { db } = store(t);
  const t0 = Z('2026-01-05T09:00:00Z');
  session(db, 'a', { first: t0, last: t0, cost: 2 });
  session(db, 'b', { first: t0, last: t0, cost: null });
  session(db, 'c', { first: t0, last: t0, cost: 0.5, partial: 1 });
  session(db, 'd', { first: null, last: null, cost: 4 });
  const m = all(db).cost_per_day;
  assert.deepEqual(m.days['2026-01-05'], { usd: 2.5, known: 2, unknown: 1, partial: 1 });
  assert.deepEqual(m.total, { usd: 6.5, known: 3, unknown: 1, partial: 1 });
  assert.equal(m.undated, 1);
});

test('tokens per day: subagent calls are counted, each call on its own day', (t) => {
  const { db } = store(t);
  const t0 = Z('2026-01-05T22:50:00Z'); // local 23:50
  session(db, 's', { first: t0, last: t0 + 20 * MIN });
  call(db, 's', t0, { input: 5 });
  call(db, 's', t0 + 20 * MIN, { input: 7, side: 1 }); // local 00:10 the next day
  call(db, 's', null, { output: 3 }); // no timestamp: the session's day
  assert.deepEqual(all(db).tokens_per_day.days, {
    '2026-01-05': { input: 5, output: 3, cache_read: 0, cache_creation: 0 },
    '2026-01-06': { input: 7, output: 0, cache_read: 0, cache_creation: 0 },
  });
  assert.deepEqual(Object.keys(all(db, { utc: true }).tokens_per_day.days), ['2026-01-05']);
});

test('context peak: main thread only; the threshold is inclusive and a parameter', (t) => {
  const { db } = store(t);
  const t0 = Z('2026-01-05T09:00:00Z');
  session(db, 'at', { first: t0, last: t0 });
  call(db, 'at', t0, { input: 1, cr: 199_999 }); // 200,000 exactly
  session(db, 'below', { first: t0, last: t0 });
  call(db, 'below', t0, { input: 199_999 });
  call(db, 'below', t0, { input: 900_000, side: 1 }); // a subagent's context is not the session's
  session(db, 'side-only', { first: t0, last: t0 });
  call(db, 'side-only', t0, { input: 5, side: 1 });
  const sel = loadSelection(db);
  const m = L.contextPeak.compute(sel);
  assert.deepEqual([m.n, m.noCalls, m.atOrAbove, m.max], [2, 1, 1, 200_000]);
  assert.deepEqual(m.sessions.map((s) => [s.id, s.peak]), [['at', 200_000], ['below', 199_999]]);
  assert.equal(L.contextPeak.compute(sel, { threshold: 199_999 }).atOrAbove, 2);
  assert.equal(computeAll(sel, { context_peak: { threshold: 300_000 } }).context_peak.atOrAbove, 0);
});

test('calls per session: main-thread calls only', (t) => {
  const { db } = store(t);
  const t0 = Z('2026-01-05T09:00:00Z');
  session(db, 'a', { first: t0, last: t0 });
  for (let i = 0; i < 3; i++) call(db, 'a', t0 + i);
  call(db, 'a', t0, { side: 1 });
  session(db, 'b', { first: t0, last: t0 });
  call(db, 'b', t0);
  const m = all(db).calls_per_session;
  assert.deepEqual([m.total, m.median, m.max, m.n], [4, 2, 3, 2]);
  assert.deepEqual(m.sessions, [{ id: 'a', calls: 3 }, { id: 'b', calls: 1 }]);
});

test('waits: gaps strictly above 5 minutes, summed per session and per day of the gap start', (t) => {
  const { db } = store(t);
  const t0 = Z('2026-01-05T22:40:00Z'); // local 23:40
  session(db, 's', { first: t0, last: t0 + 40 * MIN });
  call(db, 's', t0);
  call(db, 's', t0 + 4 * MIN); // 4 min: no
  call(db, 's', t0 + 10 * MIN, { side: 1 }); // 6 min: yes, starts local 23:44 on the 5th
  call(db, 's', t0 + 15 * MIN); // exactly 5 min: no
  call(db, 's', t0 + 40 * MIN); // 25 min: yes, starts local 23:55 on the 5th
  const m = all(db).waits;
  assert.deepEqual(m.total, { count: 2, ms: 31 * MIN });
  assert.deepEqual(m.sessions, [{ id: 's', count: 2, ms: 31 * MIN }]);
  assert.deepEqual(m.days, { '2026-01-05': { count: 2, ms: 31 * MIN } });
  assert.deepEqual(L.waits.compute(loadSelection(db), { gapMs: 3 * MIN }).total, { count: 4, ms: 40 * MIN });
});

test('overlap across midnight: local days by default (Europe/Rome), UTC days on request', (t) => {
  const { db } = store(t);
  repo(db, 'r1');
  repo(db, 'r2');
  // A: 22:40Z-23:20Z = local 23:40-00:20, across local midnight but inside one UTC day.
  session(db, 'A', { first: Z('2026-01-05T22:40:00Z'), last: Z('2026-01-05T23:20:00Z'), repo: 'r1' });
  // B: 23:05Z-23:30Z = local 00:05-00:30 on the 6th.
  session(db, 'B', { first: Z('2026-01-05T23:05:00Z'), last: Z('2026-01-05T23:30:00Z'), repo: 'r1' });
  // C, other repository, at the same time: never counted with r1.
  session(db, 'C', { first: Z('2026-01-05T23:10:00Z'), last: Z('2026-01-05T23:15:00Z'), repo: 'r2' });
  const local = all(db).overlap;
  assert.deepEqual(local.repos.r1, { '2026-01-05': 1, '2026-01-06': 2 });
  assert.deepEqual(local.repos.r2, { '2026-01-06': 1 });
  assert.deepEqual(local.days, { '2026-01-05': 1, '2026-01-06': 2 });
  const utc = all(db, { utc: true }).overlap;
  assert.deepEqual(utc.repos.r1, { '2026-01-05': 2 });
  assert.deepEqual(all(db).sessions_per_day.days, { '2026-01-05': 1, '2026-01-06': 2 });
  assert.deepEqual(all(db, { utc: true }).sessions_per_day.days, { '2026-01-05': 3 });
});

test('overlap: touching sessions count together, disjoint ones do not', (t) => {
  const { db } = store(t);
  repo(db, 'r');
  const t0 = Z('2026-01-05T09:00:00Z');
  session(db, 'a', { first: t0, last: t0 + 10 * MIN, repo: 'r' });
  session(db, 'b', { first: t0 + 10 * MIN, last: t0 + 20 * MIN, repo: 'r' });
  session(db, 'c', { first: t0 + 21 * MIN, last: t0 + 30 * MIN, repo: 'r' });
  assert.deepEqual(all(db).overlap.repos.r, { '2026-01-05': 2 });
});

test('commit proximity: yes, no and unknown per repository; the window is a parameter', (t) => {
  const { db } = store(t);
  repo(db, 'r');
  const t0 = Z('2026-01-05T09:00:00Z');
  commitAt(db, 'r', t0 + 90 * MIN);
  session(db, 'yes', { first: t0, last: t0 + 31 * MIN, repo: 'r' }); // commit 59 min after the last event
  session(db, 'no', { first: t0, last: t0 + 10 * MIN, repo: 'r' }); // 80 min after
  session(db, 'unlinked', { first: t0, last: t0 });
  const m = all(db).commit_proximity;
  assert.deepEqual(m.repos.r, { yes: 1, no: 1, unknown: 0, share: 0.5 });
  assert.deepEqual(m.total, { yes: 1, no: 1, unknown: 1, share: 0.5 });
  assert.deepEqual(L.commitProximity.compute(loadSelection(db), { windowSec: 7200 }).repos.r, { yes: 2, no: 0, unknown: 0, share: 1 });
});

test('subagent share: calls by count; cost per model by price-weighted tokens; unbilled models apart', (t) => {
  const { db } = store(t);
  const t0 = Z('2026-01-05T09:00:00Z');
  session(db, 's', { first: t0, last: t0, cost: 13 });
  call(db, 's', t0, { model: 'big', input: 100 });
  call(db, 's', t0, { model: 'small', input: 500 }); // weight 500
  call(db, 's', t0, { model: 'small', output: 100, side: 1 }); // weight 5 x 100 = 500
  const ins = db.prepare('INSERT INTO session_models (session_id, model, cost_usd) VALUES (?, ?, ?)');
  ins.run('s', 'big', 10);
  ins.run('s', 'small', 2);
  ins.run('s', 'title', 1); // billed, no call in the transcripts
  session(db, 'old', { first: t0, last: t0, cost: 5 }); // a known cost without model costs
  session(db, 'nocost', { first: t0, last: t0 });
  call(db, 'nocost', t0, { side: 1 });
  const m = all(db).subagent_share;
  assert.deepEqual(m.calls, { subagent: 2, total: 4, share: 0.5 });
  assert.deepEqual(m.cost, { subagentUsd: 1, totalUsd: 13, unattributedUsd: 1, sessionsWithoutModelCost: 1, share: 1 / 13 });
});

test('selection: --since by the first-event day, --repo by key prefix or by a path inside a recorded work tree', (t) => {
  const { db } = store(t);
  repo(db, 'aaaa1111', '/w/one');
  repo(db, 'aaaa2222', '/w/two');
  session(db, 'old', { first: Z('2026-01-04T12:00:00Z'), last: Z('2026-01-04T12:00:00Z'), repo: 'aaaa1111' });
  session(db, 'new', { first: Z('2026-01-04T23:30:00Z'), last: Z('2026-01-04T23:40:00Z'), repo: 'aaaa1111' }); // local 5th
  session(db, 'other', { first: Z('2026-01-05T12:00:00Z'), last: Z('2026-01-05T12:00:00Z'), repo: 'aaaa2222' });
  assert.deepEqual(loadSelection(db, { since: '2026-01-05' }).sessions.map((s) => s.id), ['new', 'other']);
  assert.deepEqual(resolveRepo(db, 'aaaa1'), { key: 'aaaa1111' });
  assert.match(resolveRepo(db, 'aaaa').error, /matches 2 repositories/);
  assert.deepEqual(resolveRepo(db, '/w/two/sub/dir'), { key: 'aaaa2222' });
  assert.match(resolveRepo(db, '/w/three').error, /no repository/);
  assert.deepEqual(loadSelection(db, { repo: 'aaaa1111' }).sessions.map((s) => s.id), ['old', 'new']);
});

test('layers 2 and 3: not-adopted without their data, computed with it', (t) => {
  const { db } = store(t);
  repo(db, 'r');
  session(db, 's', { first: Z('2026-01-05T09:00:00Z'), last: Z('2026-01-05T09:00:00Z'), repo: 'r' });
  assert.equal(all(db).commits_per_unit, 'not-adopted');
  db.prepare(`INSERT INTO commits (repo_key, sha, parents, author_time, commit_time, files, insertions, deletions, unit, unit_form, claude_coauthor)
    VALUES ('r', 'u1', 1, 0, 0, 0, 0, 0, 'P-2026-01-05-1000', 'trailer', 0)`).run();
  const m = all(db);
  assert.deepEqual(m.commits_per_unit, { units: 1, commits: 1, median: 1, max: 1 });
  assert.equal(m.first_shot, 'not-adopted');
  assert.equal(m.cost_per_unit, 'not-adopted');
});

test('CLI: metrics prints every layer-1 metric and lists layers 2 and 3 as not adopted; --json carries the same', (t) => {
  const { db, dir } = store(t);
  repo(db, 'abcdef123456', '/w/one');
  const t0 = Z('2026-01-05T09:00:00Z');
  session(db, 's', { first: t0, last: t0 + 10 * MIN, repo: 'abcdef123456', cost: 3 });
  call(db, 's', t0, { input: 10 });
  call(db, 's', t0 + 10 * MIN, { input: 10 });
  db.close();
  const run = (...a) => spawnSync(process.execPath, [TACK, 'metrics', '--store', join(dir, 'store.db'), ...a], { encoding: 'utf8', env: { ...process.env, TZ: 'Europe/Rome' } });
  const txt = run('--repo', '/w/one');
  assert.equal(txt.status, 0, txt.stderr);
  assert.match(txt.stdout, /selection: repository abcdef123456, since the first session, 1 sessions; days are local \(Europe\/Rome\)/);
  assert.match(txt.stdout, /2026-01-05\s+1\s+\$3\.00\s+0\s+20\s+0\s+0\s+0\s+1\s+10\s+1\n/);
  for (const name of ['context_peak', 'calls_per_session', 'waits', 'commit_proximity', 'subagent_share', 'overlap']) assert.match(txt.stdout, new RegExp(`^  ${name} `, 'm'));
  assert.match(txt.stdout, /^ {2}first_shot\s+layer 3\s+not adopted\s+enabled by log entry corrects/m);
  const j = JSON.parse(run('--json').stdout);
  assert.deepEqual(Object.keys(j.metrics), METRICS.map((m) => m.name));
  assert.equal(j.metrics.cost_per_day.total.usd, 3);
  assert.equal(run('--since', '5 Jan').status, 2);
  assert.equal(run('--repo', '/nowhere').status, 2);
});
