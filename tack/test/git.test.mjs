import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { openStore, SCHEMA_VERSION } from '../src/store/open.mjs';
import { identify, normalizeRemote } from '../src/collectors/git/identity.mjs';
import { collectGit, parseLog } from '../src/collectors/git/collect.mjs';
import { GIT_ENV } from '../src/collectors/git/run.mjs';
import { listSessions } from '../src/store/sessions.mjs';
import { listRepos } from '../src/store/repos.mjs';
import { T0, addSession, addTranscript, commit, countAll, g, initRepo, shasAll } from './helpers/git-repo.mjs';

const TACK = fileURLToPath(new URL('../bin/tack.mjs', import.meta.url));

function world(t) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-git-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.close());
  return { dir, db };
}

const link = (db, id) => ({ ...db.prepare('SELECT repo_key, missing FROM session_repo WHERE session_id = ?').get(id) });
const repoRows = (db) => db.prepare('SELECT * FROM repos ORDER BY key').all()
  .map((r) => ({ ...r, roots: JSON.parse(r.roots), common_dirs: JSON.parse(r.common_dirs), toplevels: JSON.parse(r.toplevels) }));
const stored = (db, key) => db.prepare('SELECT sha FROM commits WHERE repo_key = ? ORDER BY sha').all(key).map((r) => r.sha);
const commitRow = (db, sha) => db.prepare('SELECT * FROM commits WHERE sha = ?').get(sha);
const proximity = (db, id) => listSessions(db).find((s) => s.id === id).commit_within_hour;

test('every git call runs with GIT_OPTIONAL_LOCKS=0', () => {
  assert.equal(GIT_ENV.GIT_OPTIONAL_LOCKS, '0');
});

test('identity: a linked worktree shares the repository of its main work tree', (t) => {
  const { dir, db } = world(t);
  const a = initRepo(join(dir, 'a'));
  const root = commit(a, { sec: T0 });
  commit(a, { sec: T0 + 60 });
  g(a, ['worktree', 'add', '-q', '-b', 'feat', join(dir, 'a-wt')]);
  mkdirSync(join(dir, 'a-wt', 'sub'));
  commit(join(dir, 'a-wt'), { sec: T0 + 120, file: 'sub/b.txt' });
  addSession(db, 's1', a, T0, T0 + 10);
  addSession(db, 's2', join(dir, 'a-wt', 'sub'), T0, T0 + 10);
  const st = identify(db);
  assert.equal(st.repos, 1);
  assert.equal(st.clones, 1);
  const [r] = repoRows(db);
  assert.equal(r.key, root);
  assert.deepEqual(r.toplevels, [a, join(dir, 'a-wt')].sort());
  assert.deepEqual(r.common_dirs, [join(a, '.git')]);
  assert.equal(link(db, 's1').repo_key, root);
  assert.equal(link(db, 's2').repo_key, root);
  collectGit(db);
  assert.equal(stored(db, root).length, countAll(a));
  assert.equal(countAll(a), 3);
});

test('identity: two clones with the same root are one repository; disjoint roots are two', (t) => {
  const { dir, db } = world(t);
  const a = initRepo(join(dir, 'a'));
  const root = commit(a, { sec: T0 });
  g(dir, ['clone', '-q', a, join(dir, 'b')]);
  commit(join(dir, 'b'), { sec: T0 + 60, file: 'only-b.txt' });
  const c = initRepo(join(dir, 'c'));
  const rootC = commit(c, { sec: T0 + 1 });
  addSession(db, 'sa', a, T0, T0);
  addSession(db, 'sb', join(dir, 'b'), T0, T0);
  addSession(db, 'sc', c, T0, T0);
  const st = identify(db);
  assert.equal(st.repos, 2);
  assert.equal(st.clones, 3);
  assert.equal(link(db, 'sa').repo_key, root);
  assert.equal(link(db, 'sb').repo_key, root);
  assert.equal(link(db, 'sc').repo_key, rootC);
  const ab = repoRows(db).find((r) => r.key === root);
  assert.equal(ab.common_dirs.length, 2);
  assert.equal(ab.remote, `local:${a}`, 'the first clone with an origin gives the remote');
  collectGit(db);
  assert.equal(stored(db, root).length, 2, 'the union of both clones');
  assert.deepEqual(stored(db, root), [...new Set([...shasAll(a), ...shasAll(join(dir, 'b'))])].sort());
});

test('identity: a clone sharing one of several roots joins the repository, keyed by the lowest root', (t) => {
  const { dir, db } = world(t);
  const a = initRepo(join(dir, 'a'));
  const r1 = commit(a, { sec: T0 });
  g(a, ['checkout', '-q', '--orphan', 'pages']);
  const r2 = commit(a, { sec: T0 + 5, file: 'p.txt' });
  g(a, ['checkout', '-q', 'main']);
  g(dir, ['clone', '-q', '--single-branch', '--branch', 'main', a, join(dir, 'b')]);
  addSession(db, 'sb', join(dir, 'b'), T0, T0);
  identify(db);
  assert.equal(repoRows(db)[0].key, r1);
  addSession(db, 'sa', a, T0, T0);
  identify(db);
  const rows = repoRows(db);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].roots, [r1, r2].sort());
  assert.equal(rows[0].key, [r1, r2].sort()[0]);
  assert.equal(link(db, 'sa').repo_key, rows[0].key);
  assert.equal(link(db, 'sb').repo_key, rows[0].key);
});

test('identity: deleted clone, plain directory, empty repository and no cwd are missing, never "no commit"', (t) => {
  const { dir, db } = world(t);
  const a = initRepo(join(dir, 'a'));
  commit(a, { sec: T0 });
  g(dir, ['clone', '-q', a, join(dir, 'gone')]);
  mkdirSync(join(dir, 'plain'));
  initRepo(join(dir, 'empty'));
  addSession(db, 'gone', join(dir, 'gone'), T0, T0);
  addSession(db, 'plain', join(dir, 'plain'), T0, T0);
  addSession(db, 'empty', join(dir, 'empty'), T0, T0);
  addSession(db, 'nocwd', null, T0, T0);
  addSession(db, 'dotgit', join(a, '.git'), T0, T0);
  identify(db);
  collectGit(db);
  assert.ok(link(db, 'gone').repo_key, 'present before deletion');
  rmSync(join(dir, 'gone'), { recursive: true, force: true });
  const st = identify(db);
  assert.deepEqual(link(db, 'gone'), { repo_key: null, missing: 'path-gone' });
  assert.deepEqual(link(db, 'plain'), { repo_key: null, missing: 'not-a-git-work-tree' });
  assert.deepEqual(link(db, 'dotgit'), { repo_key: null, missing: 'not-a-git-work-tree' });
  assert.deepEqual(link(db, 'empty'), { repo_key: null, missing: 'no-commits' });
  assert.deepEqual(link(db, 'nocwd'), { repo_key: null, missing: 'no-cwd' });
  assert.deepEqual(st.missing, { 'path-gone': 1, 'not-a-git-work-tree': 2, 'no-commits': 1, 'no-cwd': 1 });
  assert.equal(st.reposGone, 1, 'the repository of the deleted clone is gone, its commits kept');
  assert.equal(repoRows(db)[0].state, 'gone');
  for (const id of ['gone', 'plain', 'empty', 'nocwd']) assert.equal(proximity(db, id), 'unknown', id);
  const out = listRepos(db);
  assert.deepEqual(out.missing.map((m) => m.reason), ['no-commits', 'no-cwd', 'not-a-git-work-tree', 'path-gone']);
});

test('commits: both linkage forms, co-author detection and numstat totals; no message text kept', (t) => {
  const { dir, db } = world(t);
  const a = initRepo(join(dir, 'a'));
  const trailer = commit(a, { sec: T0, content: 'x\ny\nz\n', message: 'feat: x\n\nbody\n\nUnit: P-2026-01-05-1000\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>\n' });
  const suffix = commit(a, { sec: T0 + 60, message: 'fix: y (P-2026-01-05-1100)' });
  const human = commit(a, { sec: T0 + 120, message: 'chore: z\n\nCo-Authored-By: Jane Doe <jane@example.org>\n' });
  const both = commit(a, { sec: T0 + 180, message: 'w (P-2026-01-05-1200)\n\nUnit: P-2026-01-05-1300\n' });
  const lower = commit(a, { sec: T0 + 240, content: 'q\nr\n', message: 'v\n\nco-authored-by: claude <noreply@anthropic.com>\n' });
  g(a, ['rm', '-q', 'a.txt']);
  g(a, ['commit', '-q', '-m', 'rm'], { sec: T0 + 300 });
  addSession(db, 's', a, T0, T0);
  identify(db);
  collectGit(db);
  assert.deepEqual([commitRow(db, trailer).unit, commitRow(db, trailer).unit_form, commitRow(db, trailer).claude_coauthor], ['P-2026-01-05-1000', 'trailer', 1]);
  assert.deepEqual([commitRow(db, suffix).unit, commitRow(db, suffix).unit_form, commitRow(db, suffix).claude_coauthor], ['P-2026-01-05-1100', 'suffix', 0]);
  assert.deepEqual([commitRow(db, human).unit, commitRow(db, human).unit_form, commitRow(db, human).claude_coauthor], [null, null, 0]);
  assert.deepEqual([commitRow(db, both).unit, commitRow(db, both).unit_form], ['P-2026-01-05-1300', 'trailer']);
  assert.equal(commitRow(db, lower).claude_coauthor, 1);
  const c = commitRow(db, trailer);
  assert.deepEqual([c.parents, c.files, c.insertions, c.deletions, c.author_time, c.commit_time], [0, 1, 3, 0, T0, T0]);
  const rm = db.prepare('SELECT * FROM commits ORDER BY commit_time DESC LIMIT 1').get();
  assert.deepEqual([rm.parents, rm.files, rm.insertions, rm.deletions], [1, 1, 0, 2]);
  const repo = listRepos(db).repos[0];
  assert.deepEqual([repo.commits, repo.unit_trailer, repo.unit_suffix, repo.claude_coauthored], [6, 2, 1, 2]);
});

test('commits: a rename is stored as a deletion and an addition, even when the git config turns renames on', (t) => {
  const { dir, db } = world(t);
  const a = initRepo(join(dir, 'a'));
  commit(a, { sec: T0, file: 'old.txt', content: 'l1\nl2\nl3\n' });
  g(a, ['mv', 'old.txt', 'new.txt']);
  g(a, ['commit', '-q', '-m', 'rename'], { sec: T0 + 60 });
  const mv = g(a, ['rev-parse', 'HEAD']);
  // Positive control: with rename detection on, git itself reports one row with no line changed.
  assert.match(g(a, ['-c', 'diff.renames=true', 'log', '-1', '--numstat', '--format=', mv]), /^0\t0\t/);
  // The collector inherits the environment: turn rename detection on there too.
  const saved = { ...process.env };
  Object.assign(process.env, { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'diff.renames', GIT_CONFIG_VALUE_0: 'copies' });
  t.after(() => {
    for (const k of ['GIT_CONFIG_COUNT', 'GIT_CONFIG_KEY_0', 'GIT_CONFIG_VALUE_0']) if (!(k in saved)) delete process.env[k];
  });
  addSession(db, 's', a, T0, T0);
  identify(db);
  collectGit(db);
  const c = commitRow(db, mv);
  assert.deepEqual([c.files, c.insertions, c.deletions], [2, 3, 3]);
});

test('parseLog: a merge has no numstat rows and counts its parents', () => {
  const out = '\x00aaa\x00p1 p2\x00100\x00200\x00Merge x (P-2026-01-05-1000)\n\x00\n\x00bbb\x00p1\x00100\x00200\x00m\n\x00\n\n3\t1\tf\n-\t-\tbin\n';
  assert.deepEqual(parseLog(out).map((c) => [c.sha, c.parents, c.files, c.ins, c.del, c.unit, c.form]),
    [['aaa', 2, 0, 0, 0, 'P-2026-01-05-1000', 'suffix'], ['bbb', 1, 2, 3, 1, null, null]]);
});

test('incremental: tips that did not move are skipped; new commits are read alone', (t) => {
  const { dir, db } = world(t);
  const a = initRepo(join(dir, 'a'));
  commit(a, { sec: T0 });
  commit(a, { sec: T0 + 60 });
  addSession(db, 's', a, T0, T0);
  identify(db);
  const s1 = collectGit(db);
  assert.deepEqual([s1.full, s1.commitsAdded], [1, 2]);
  const s2 = collectGit(db);
  assert.deepEqual([s2.skipped, s2.full, s2.incremental, s2.commitsAdded, s2.commitsRemoved], [1, 0, 0, 0, 0]);
  commit(a, { sec: T0 + 120 });
  g(a, ['checkout', '-q', '-b', 'side', 'HEAD~2']);
  commit(a, { sec: T0 + 180, file: 's.txt' });
  const s3 = collectGit(db);
  assert.deepEqual([s3.incremental, s3.full, s3.commitsAdded, s3.commitsRemoved], [1, 0, 2, 0]);
  assert.deepEqual(stored(db, repoRows(db)[0].key), shasAll(a));
});

test('rewrite: an amended tip or a deleted branch triggers a full re-read that matches rev-list --all', (t) => {
  const { dir, db } = world(t);
  const a = initRepo(join(dir, 'a'));
  commit(a, { sec: T0 });
  const tip = commit(a, { sec: T0 + 60 });
  addSession(db, 's', a, T0, T0);
  identify(db);
  collectGit(db);
  const key = repoRows(db)[0].key;
  g(a, ['commit', '-q', '--amend', '-m', 'amended'], { sec: T0 + 90 });
  const s1 = collectGit(db);
  assert.deepEqual([s1.full, s1.incremental, s1.commitsAdded, s1.commitsRemoved], [1, 0, 1, 1]);
  assert.ok(!stored(db, key).includes(tip));
  assert.deepEqual(stored(db, key), shasAll(a));
  g(a, ['checkout', '-q', '-b', 'tmp']);
  commit(a, { sec: T0 + 200 });
  g(a, ['checkout', '-q', 'main']);
  collectGit(db);
  assert.equal(stored(db, key).length, 3);
  g(a, ['branch', '-q', '-D', 'tmp']);
  const s2 = collectGit(db);
  assert.deepEqual([s2.full, s2.commitsRemoved], [1, 1]);
  assert.deepEqual(stored(db, key), shasAll(a));
});

test('proximity: yes inside [first event, last event + 1h], no outside, unknown when the repository is missing', (t) => {
  const { dir, db } = world(t);
  const a = initRepo(join(dir, 'a'));
  commit(a, { sec: T0 + 2 * 3600 });
  addSession(db, 'edge', a, T0, T0 + 3600); // commit exactly at last + 1h
  addSession(db, 'inside', a, T0 + 2 * 3600 - 60, T0 + 2 * 3600 - 30);
  addSession(db, 'before', a, T0 + 2 * 3600 + 1, T0 + 3 * 3600); // commit 1 s before the first event
  addSession(db, 'late', a, T0 - 3600, T0 + 3600 - 1); // commit 1 s after last + 1h
  mkdirSync(join(dir, 'void')); // no present work tree beside the missing path: no sibling inference
  addSession(db, 'gone', join(dir, 'void', 'nope'), T0, T0 + 7200);
  identify(db);
  collectGit(db);
  assert.equal(proximity(db, 'edge'), 'yes');
  assert.equal(proximity(db, 'inside'), 'yes');
  assert.equal(proximity(db, 'before'), 'no');
  assert.equal(proximity(db, 'late'), 'no');
  assert.equal(proximity(db, 'gone'), 'unknown');
  const r = listRepos(db).repos[0];
  assert.deepEqual([r.sessions, r.sessions_commit_within_hour], [4, 2]);
});

test('normalizeRemote: one form per host and path, credentials and .git dropped', () => {
  assert.equal(normalizeRemote('https://user:tok@GitHub.com/o/r.git'), 'github.com/o/r');
  assert.equal(normalizeRemote('git@github.com:o/r.git'), 'github.com/o/r');
  assert.equal(normalizeRemote('ssh://git@github.com:22/o/r/'), 'github.com/o/r');
  assert.equal(normalizeRemote('/Users/x/r'), 'local:/Users/x/r');
  assert.equal(normalizeRemote('file:///Users/x/r/'), 'local:/Users/x/r');
  assert.equal(normalizeRemote(''), null);
});

test('store: a schema 1 store is migrated to 2 and keeps its rows', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tack-mig-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const p = join(dir, 'v1.db');
  const v1 = new DatabaseSync(p);
  v1.exec(readFileSync(fileURLToPath(new URL('../src/store/schema.sql', import.meta.url)), 'utf8'));
  v1.exec("INSERT INTO sessions (id, file_id, cwd) VALUES ('old', 0, '/x'); PRAGMA user_version = 1");
  v1.close();
  const db = openStore(p);
  t.after(() => db.close());
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM commits').get().n, 0);
});

test('CLI: scan runs the three stages, a second scan adds 0 rows; repos and sessions show the repository', (t) => {
  const { dir } = world(t);
  const a = initRepo(join(dir, 'a'));
  commit(a, { sec: T0 + 600, message: 'feat (P-2026-01-05-1000)\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n' });
  const root = join(dir, 'projects');
  addTranscript(root, 's-in', a, T0, T0 + 60);
  mkdirSync(join(dir, 'void'));
  addTranscript(root, 's-gone', join(dir, 'void', 'deleted-clone'), T0, T0 + 60);
  const store = join(dir, 'cli.db');
  const run = (...args) => spawnSync(process.execPath, [TACK, ...args], { encoding: 'utf8', env: { ...process.env, TACK_STORE: '' } });
  const s1 = run('scan', '--root', root, '--store', store);
  assert.equal(s1.status, 0, s1.stderr);
  assert.match(s1.stdout, /identity: cwds 2; sessions in a repository 1, missing: path-gone 1/);
  assert.match(s1.stdout, /rows added: repos 1, links 2/);
  assert.match(s1.stdout, /git: rows added: commits 1;/);
  const s2 = run('scan', '--root', root, '--store', store);
  assert.match(s2.stdout, /rows added: sessions 0, calls 0/);
  assert.match(s2.stdout, /rows added: repos 0, links 0; links changed 0/);
  assert.match(s2.stdout, /git: repositories 1 \(unchanged 1, incremental 0, full 0, errors 0\)/);
  assert.match(s2.stdout, /git: rows added: commits 0; commits removed by re-read 0/);
  const j = JSON.parse(run('repos', '--store', store, '--json').stdout);
  assert.deepEqual(j.repos.map((r) => [r.commits, r.unit_suffix, r.claude_coauthored, r.sessions, r.sessions_commit_within_hour, r.remote_host]),
    [[1, 1, 1, 1, 1, '-']]);
  assert.deepEqual(j.missing, [{ reason: 'path-gone', cwds: [{ cwd: join(dir, 'void', 'deleted-clone'), sessions: 1 }] }]);
  const txt = run('repos', '--store', store);
  assert.match(txt.stdout, /missing, path-gone: 1 cwds, 1 sessions/);
  const ses = run('sessions', '--store', store);
  assert.match(ses.stdout, /commit within hour/);
  assert.match(ses.stdout, /\blink\s+commit within hour\n/);
  assert.match(ses.stdout, /claude-fixture-3\s+direct\s+yes\n/);
  assert.match(ses.stdout, /claude-fixture-3\s+none\s+unknown\n/);
});
