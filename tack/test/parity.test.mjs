// `tack parity jjodel` on a synthetic lane root: the board's rules (the copy in test/helpers/board-parity.mjs)
// and Tack's store must agree on spend per day and on first-shot lane by lane, and a perturbation of Tack's
// side must come back as a mismatch with a cause. Days are local; the zone is pinned as in metrics.test.mjs.
process.env.TZ = 'Europe/Rome';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store/open.mjs';
import { identify } from '../src/collectors/git/identity.mjs';
import { collectGit } from '../src/collectors/git/collect.mjs';
import { parityJjodel, lastDays } from '../src/parity/jjodel.mjs';
import { repoKeyOf } from '../src/importers/jjodel-log.mjs';
import { dayOf } from '../src/metrics/days.mjs';
import { boardNumbers } from './helpers/board-parity.mjs';
import { addSession, commit, g, initRepo } from './helpers/git-repo.mjs';
import { NOW, fixtureLanes } from './helpers/layers-fixture.mjs';

const Z = (s) => Date.parse(s);

function entry(id, day, f = {}) {
  const v = { Prompt: 'p', Outcome: '\u2705 completed', Corregge: '—', Causa: '—', Regressions: 'no', 'Out-of-scope changes': 'no', ...f };
  return `## ${day} — task: work on ${id} (${id})\n${Object.entries(v).map(([k, x]) => `**${k}**: ${x}`).join('\n')}\n`;
}

/** A repository whose trunk holds the log (newest first), lanes for every unit, a unit commit of L7 and its revert. */
function world(t) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-parity-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const repo = initRepo(join(dir, 'repo'));
  const root = join(dir, 'lanes');
  mkdirSync(root);
  const lane = fixtureLanes(root, { worktree: repo });
  const base = Z('2026-01-05T08:00:00Z') / 1000;
  commit(repo, { sec: base, message: 'root', file: 'root.txt' });
  const sha = commit(repo, { sec: Z('2026-01-07T17:05:00Z') / 1000, message: `feature (${lane.L7})`, file: 'f.txt' });
  g(repo, ['revert', '--no-edit', sha], { sec: Z('2026-01-07T17:30:00Z') / 1000 });
  g(repo, ['checkout', '-q', '-b', 'trunk']);
  const log = [
    entry('P-2026-01-08-0800', '2026-01-08', { Corregge: lane.L5, Causa: '(c)' }),
    entry(lane.L3, '2026-01-07', { Outcome: '\u274c problems', Causa: '(a)' }),
    entry(lane.L5, '2026-01-07'),
    entry(lane.L1, '2026-01-06'),
  ].join('\n');
  commit(repo, { sec: base + 60, message: 'log', file: 'docs/claude-code-log.md', content: `# Log\n\n${log}` });
  g(repo, ['checkout', '-q', 'main']);
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.isOpen && db.close());
  addSession(db, 'sess-7', repo, base, base);
  identify(db);
  collectGit(db);
  const imports = join(dir, 'imports');
  const run = (days = 7) => parityJjodel(db, { root, repo, trunk: 'trunk', days, now: NOW, imports });
  return { dir, db, repo, root, lane, run, imports };
}

test('lastDays: n local days ending on the day of now, oldest first', () => {
  assert.deepEqual(lastDays(NOW, 3), ['2026-01-06', '2026-01-07', '2026-01-08']);
  assert.deepEqual(lastDays(NOW, 1), ['2026-01-08']);
});

test('the board copy and Tack spend the same per day, and the totals are the ones the fixture lanes declare', (t) => {
  const { repo, root, db, run } = world(t);
  const r = run();
  assert.equal(r.error, undefined);
  const board = boardNumbers({ root, repo, trunk: 'trunk', now: NOW });
  const expected = { '2026-01-06': 1.5 + 2.5, '2026-01-07': 0.5 + 3 + 2 + 0.4 + 1.2, '2026-01-08': 0.8 };
  for (const [day, usd] of Object.entries(expected)) assert.ok(Math.abs(board.spend[day] - usd) < 1e-9, `board ${day}: ${board.spend[day]}`);
  const tack = {};
  for (const x of db.prepare('SELECT at_ms, usd FROM lane_spend').all()) tack[dayOf(x.at_ms)] = (tack[dayOf(x.at_ms)] ?? 0) + x.usd;
  for (const [day, usd] of Object.entries(expected)) assert.ok(Math.abs(tack[day] - usd) < 1e-9, `tack ${day}: ${tack[day]}`);
});

test('parityJjodel on the fixture: spend and first-shot agree, lane by lane', (t) => {
  const { run, repo } = world(t);
  const r = run();
  assert.equal(r.ok, true, JSON.stringify([r.spend.filter((x) => !x.ok), r.firstShot.mismatches]));
  assert.equal(r.repo, repoKeyOf(repo));
  assert.deepEqual(r.days, lastDays(NOW, 7));
  assert.deepEqual(r.firstShot.mismatches, []);
  assert.deepEqual(r.firstShot.board, { lanes: 7, firstShot: 1, running: 1 });
  assert.deepEqual(r.firstShot.tack, r.firstShot.board);
  assert.deepEqual(r.import, { read: 4, converted: 4, rejected: {} });
  assert.ok(r.total.board > 11 && r.total.ok);
  // A second run is the same (the lanes that exited are not read again).
  assert.equal(run().ok, true);
});

test('a perturbed spend row is reported on its day, with no cause when nothing explains it', (t) => {
  const { db, lane, run } = world(t);
  assert.equal(run().ok, true);
  db.prepare('UPDATE lane_spend SET usd = usd * 1.5 WHERE lane_id = ?').run(lane.L1);
  const r = run();
  assert.equal(r.ok, false);
  const bad = r.spend.filter((x) => !x.ok);
  assert.deepEqual(bad.map((x) => x.day), ['2026-01-06']);
  assert.equal(bad[0].cause, 'unexplained');
  assert.ok(Math.abs(bad[0].board - 4) < 1e-9 && Math.abs(bad[0].tack - 4.75) < 1e-9);
  assert.equal(r.total.ok, false);
  assert.deepEqual(r.firstShot.mismatches, [], 'the spend perturbation leaves first-shot alone');
});

test('a lane unlinked from the repository is reported with that cause', (t) => {
  const { db, lane, run } = world(t);
  assert.equal(run().ok, true);
  db.prepare('UPDATE lanes SET repo_key = NULL WHERE id = ?').run(lane.L4);
  const r = run();
  assert.equal(r.ok, false);
  const bad = r.spend.filter((x) => !x.ok);
  assert.deepEqual(bad.map((x) => x.day), ['2026-01-07']);
  assert.equal(bad[0].cause, `lanes not linked to the repository: ${lane.L4}`);
  assert.ok(Math.abs(bad[0].board - bad[0].tack - 3) < 1e-9, 'the lane takes its 3.0 out of Tack');
});

test('a perturbed first-shot signal is reported lane by lane with the signal that differs', (t) => {
  const { db, lane, run } = world(t);
  assert.equal(run().ok, true);
  db.prepare('UPDATE lanes SET corrective = 1 WHERE id = ?').run(lane.L1);
  const r = run();
  assert.equal(r.ok, false);
  assert.deepEqual(r.firstShot.mismatches, [{ id: lane.L1, board: true, tack: false, cause: 'corrective false vs true' }]);
  assert.ok(r.spend.every((x) => x.ok), 'spend is untouched');
  assert.deepEqual([r.firstShot.board.firstShot, r.firstShot.tack.firstShot], [1, 0]);
});

test('a lane row that is gone is read again by the adapter, and a missing lane root is an error that says why', (t) => {
  const { db, lane, run, repo, dir } = world(t);
  assert.equal(run().ok, true);
  db.prepare('DELETE FROM lanes WHERE id = ?').run(lane.L1);
  assert.equal(run().ok, true, 'the folder is read again, so the lane is back');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM lanes WHERE id = ?').get(lane.L1).n, 1);
  const none = parityJjodel(db, { root: join(dir, 'absent'), repo, trunk: 'trunk', days: 7, now: NOW, imports: join(dir, 'imports') });
  assert.match(none.error, /^no lane folder at /);
});

// Bug (src/collectors/git/run.mjs git(), reached from repoKeyOf): a repo path that does not exist makes
// spawnSync fail with ENOENT, git() rethrows, and parityJjodel throws instead of returning its
// `no repository at` error. `tack parity jjodel --repo /nowhere` ends in an uncaught exception.
test('a repository path that does not exist is an error value, not an exception', (t) => {
  const { db, dir } = world(t);
  const r = parityJjodel(db, { root: join(dir, 'lanes'), repo: join(dir, 'nowhere'), trunk: 'trunk', now: NOW });
  assert.match(r.error, /^no repository at /);
});
