// Link inference for path-gone sessions (deleted worktrees): branch, sibling, none with a reason.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SCHEMA_VERSION, openStore } from '../src/store/open.mjs';
import { identify } from '../src/collectors/git/identity.mjs';
import { inferLink, mergedBranch } from '../src/collectors/git/infer.mjs';
import { scan } from '../src/collectors/claude-code/collect.mjs';
import { listSessions } from '../src/store/sessions.mjs';
import { T0, commit, g, initRepo } from './helpers/git-repo.mjs';

function world(t) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-infer-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.close());
  return { dir, db };
}

const iso = (sec) => new Date(sec * 1000).toISOString();
const addSession = (db, id, cwd, branch = null) => db.prepare('INSERT INTO sessions (id, file_id, cwd, first_ts, last_ts, git_branch) VALUES (?, 0, ?, ?, ?, ?)')
  .run(id, cwd, iso(T0), iso(T0 + 60), branch);
const link = (db, id) => ({ ...db.prepare('SELECT repo_key, missing, link_method, link_reason FROM session_repo WHERE session_id = ?').get(id) });

test('mergedBranch: the forms git, GitHub and the merge: convention write; anything else is null', () => {
  assert.equal(mergedBranch("Merge branch 'lane-a'"), 'lane-a');
  assert.equal(mergedBranch("Merge branch 'lane-a' into main"), 'lane-a');
  assert.equal(mergedBranch("Merge branch 'feat/x' of https://example.org/o/r"), 'feat/x');
  assert.equal(mergedBranch("Merge remote-tracking branch 'origin/lane-b'"), 'lane-b');
  assert.equal(mergedBranch('Merge pull request #12 from someone/lane-c'), 'lane-c');
  assert.equal(mergedBranch('merge: lane-d into trunk (P-2026-01-05-1000)'), 'lane-d');
  assert.equal(mergedBranch('merge: lane-e, slice 3 of the thing (P-2026-01-05-1000)'), 'lane-e');
  assert.equal(mergedBranch('merge: lane-f (P-2026-01-05-1000)'), 'lane-f');
  assert.equal(mergedBranch('fix: merge two lists'), null);
});

test('inferLink: unique branch, then unique sibling consistent with the branch; two candidates are never guessed', (t) => {
  const { dir } = world(t);
  mkdirSync(join(dir, 'h1'));
  mkdirSync(join(dir, 'h2'));
  const ctx = {
    branches: new Map([['A', new Set(['a-only', 'shared', 'main'])], ['B', new Set(['b-only', 'shared', 'main'])], ['C', new Set(['main'])]]),
    worktrees: [{ path: join(dir, 'h1', 'a'), key: 'A' }, { path: join(dir, 'h2', 'b'), key: 'B' }, { path: join(dir, 'h2', 'c'), key: 'C' }],
  };
  const gone = (h, b) => inferLink({ cwd: join(dir, h, 'deleted', 'sub'), branch: b }, ctx);
  assert.deepEqual(gone('h2', 'a-only'), { method: 'branch', key: 'A', reason: null }, 'a unique branch wins over the siblings');
  assert.deepEqual(gone('h1', null), { method: 'sibling', key: 'A', reason: null });
  assert.deepEqual(gone('h1', 'shared'), { method: 'sibling', key: 'A', reason: null }, 'the sibling is among the branch candidates');
  assert.deepEqual(gone('h1', 'unknown-branch'), { method: 'sibling', key: 'A', reason: null });
  assert.deepEqual(gone('void', 'shared'), { method: 'none', key: null, reason: 'branch-ambiguous' });
  assert.deepEqual(gone('h2', null), { method: 'none', key: null, reason: 'sibling-ambiguous' });
  assert.deepEqual(gone('void', null), { method: 'none', key: null, reason: 'no-candidate' });
  const ctx2 = { ...ctx, branches: new Map([...ctx.branches, ['C', new Set(['main', 'b-only'])]]) };
  assert.deepEqual(inferLink({ cwd: join(dir, 'h1', 'deleted'), branch: 'b-only' }, ctx2), { method: 'none', key: null, reason: 'branch-conflicts-sibling' });
});

test('identify: deleted worktrees are linked by a live branch, by a merged branch, or by a sibling; ambiguity stays missing', (t) => {
  const { dir, db } = world(t);
  mkdirSync(join(dir, 'h1'));
  mkdirSync(join(dir, 'h2'));
  mkdirSync(join(dir, 'void'));
  const a = initRepo(join(dir, 'h1', 'a'));
  const rootA = commit(a, { sec: T0 });
  g(a, ['branch', 'live-lane']);
  for (const [b, msg] of [['merged-lane', 'merge: merged-lane into main (P-2026-01-05-1000)'], ['git-lane', "Merge branch 'git-lane'"]]) {
    g(a, ['checkout', '-q', '-b', b]);
    commit(a, { sec: T0 + 10, file: `${b}.txt` });
    g(a, ['checkout', '-q', 'main']);
    g(a, ['merge', '-q', '--no-ff', '-m', msg, b], { sec: T0 + 20 });
    g(a, ['branch', '-q', '-D', b]);
  }
  g(a, ['branch', 'shared']);
  const b = initRepo(join(dir, 'h2', 'b'));
  const rootB = commit(b, { sec: T0 + 1 });
  g(b, ['branch', 'shared']);
  // A lane worktree of A, used and then removed.
  g(a, ['worktree', 'add', '-q', '-b', 'wt-lane', join(dir, 'h1', 'a-wt')]);
  addSession(db, 'wt-before', join(dir, 'h1', 'a-wt'), 'wt-lane');
  addSession(db, 'a', a);
  addSession(db, 'b', b, 'live-lane'); // a direct link is never overwritten by a branch
  identify(db);
  assert.equal(link(db, 'wt-before').link_method, 'direct');
  g(a, ['worktree', 'remove', '--force', join(dir, 'h1', 'a-wt')]);
  g(a, ['branch', '-q', '-D', 'wt-lane']);

  addSession(db, 'by-ref', join(dir, 'void', 'gone-1'), 'live-lane');
  addSession(db, 'by-merge', join(dir, 'void', 'gone-2', 'frontend'), 'merged-lane');
  addSession(db, 'by-git-merge', join(dir, 'void', 'gone-3'), 'git-lane');
  addSession(db, 'by-sibling', join(dir, 'h1', 'gone-4', 'deep', 'er'), null);
  addSession(db, 'ambiguous', join(dir, 'void', 'gone-5'), 'shared');
  addSession(db, 'clone-in-tmp', join(dir, 'void', 'sprotty'), 'main'); // main in both: no guess, no sibling
  addSession(db, 'nothing', join(dir, 'void', 'gone-6'), null);
  mkdirSync(join(dir, 'h1', 'plain'));
  addSession(db, 'plain', join(dir, 'h1', 'plain'), 'live-lane'); // present, not a work tree: no inference
  addSession(db, 'nocwd', null, 'live-lane');
  const st = identify(db);
  assert.deepEqual(link(db, 'a'), { repo_key: rootA, missing: null, link_method: 'direct', link_reason: null });
  assert.deepEqual(link(db, 'b'), { repo_key: rootB, missing: null, link_method: 'direct', link_reason: null });
  assert.deepEqual(link(db, 'by-ref'), { repo_key: rootA, missing: 'path-gone', link_method: 'branch', link_reason: null });
  assert.deepEqual(link(db, 'by-merge'), { repo_key: rootA, missing: 'path-gone', link_method: 'branch', link_reason: null });
  assert.deepEqual(link(db, 'by-git-merge'), { repo_key: rootA, missing: 'path-gone', link_method: 'branch', link_reason: null });
  assert.deepEqual(link(db, 'by-sibling'), { repo_key: rootA, missing: 'path-gone', link_method: 'sibling', link_reason: null });
  assert.deepEqual(link(db, 'wt-before'), { repo_key: rootA, missing: 'path-gone', link_method: 'sibling', link_reason: null },
    'the removed worktree: its branch is gone unmerged, its parent holds only A');
  assert.deepEqual(link(db, 'ambiguous'), { repo_key: null, missing: 'path-gone', link_method: 'none', link_reason: 'branch-ambiguous' });
  assert.deepEqual(link(db, 'clone-in-tmp'), { repo_key: null, missing: 'path-gone', link_method: 'none', link_reason: 'branch-ambiguous' });
  assert.deepEqual(link(db, 'nothing'), { repo_key: null, missing: 'path-gone', link_method: 'none', link_reason: 'no-candidate' });
  assert.deepEqual(st.inferred, { branch: 3, sibling: 2 });
  assert.deepEqual(st.unresolved, { 'branch-ambiguous': 2, 'no-candidate': 1 });
  assert.deepEqual(link(db, 'plain'), { repo_key: null, missing: 'not-a-git-work-tree', link_method: 'none', link_reason: null });
  assert.deepEqual(link(db, 'nocwd'), { repo_key: null, missing: 'no-cwd', link_method: 'none', link_reason: null });
  assert.deepEqual(st.missing, { 'path-gone': 8, 'not-a-git-work-tree': 1, 'no-cwd': 1 }, 'missing keeps the direct reason');
  const rows = Object.fromEntries(listSessions(db).map((s) => [s.id, s]));
  assert.deepEqual([rows['by-ref'].link, rows['by-ref'].repo_key, rows['by-ref'].repo_missing], ['branch', rootA, null]);
  assert.equal(rows.nothing.link, 'none');
  const again = identify(db);
  assert.deepEqual([again.linksAdded, again.linksChanged], [0, 0], 'a second pass changes nothing');
});

test('collector: the first gitBranch other than HEAD and the max cost per model are stored; never message text', (t) => {
  const { dir, db } = world(t);
  const proj = join(dir, 'projects', '-x');
  mkdirSync(proj, { recursive: true });
  const rec = (o) => JSON.stringify({ sessionId: 's1', cwd: '/x', timestamp: iso(T0), ...o });
  const cost = (total, opus, sonnet) => rec({ type: 'cost-state', totalCostUSD: total, modelUsage: { opus: { costUSD: opus, outputTokens: 1 }, sonnet: { costUSD: sonnet } } });
  const lines = [rec({ type: 'user', gitBranch: 'HEAD' }), rec({ type: 'user', gitBranch: 'lane-1' }), cost(3, 2, 1), rec({ type: 'user', gitBranch: 'lane-2' })];
  const file = join(proj, 's1.jsonl');
  writeFileSync(file, lines.join('\n') + '\n');
  const s1 = scan(db, join(dir, 'projects'));
  assert.equal(s1.modelCostsAdded, 2);
  writeFileSync(file, [...lines, cost(5, 4, 1)].join('\n') + '\n');
  const s2 = scan(db, join(dir, 'projects'));
  assert.deepEqual([s2.modelCostsAdded, s2.modelCostsUpdated], [0, 1]);
  assert.equal(db.prepare('SELECT git_branch FROM sessions WHERE id = ?').get('s1').git_branch, 'lane-1');
  assert.deepEqual(db.prepare('SELECT model, cost_usd FROM session_models ORDER BY model').all().map((r) => [r.model, r.cost_usd]), [['opus', 4], ['sonnet', 1]]);
  const s3 = scan(db, join(dir, 'projects'));
  assert.deepEqual([s3.modelCostsAdded, s3.modelCostsUpdated, s3.sessionsAdded], [0, 0, 0]);
});

test('store: a schema 2 store is migrated to the current schema and its main transcripts are read again once, adding no row', (t) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-mig3-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const proj = join(dir, 'projects', '-x');
  mkdirSync(proj, { recursive: true });
  const file = join(proj, 's1.jsonl');
  const line = JSON.stringify({ type: 'user', sessionId: 's1', cwd: '/x', timestamp: iso(T0), gitBranch: 'lane-1' }) + '\n';
  writeFileSync(file, line);
  const p = join(dir, 'v2.db');
  const v2 = new DatabaseSync(p);
  for (const f of ['schema.sql', 'schema-2.sql']) v2.exec(readFileSync(fileURLToPath(new URL(`../src/store/${f}`, import.meta.url)), 'utf8'));
  const st = statSync(file);
  v2.prepare("INSERT INTO ingest (path, kind, session_id, size, mtime_ms, offset) VALUES (?, 'main', 's1', ?, ?, ?)").run(file, st.size, st.mtimeMs, st.size);
  v2.prepare("INSERT INTO sessions (id, file_id, cwd, first_ts, last_ts) VALUES ('s1', 1, '/x', ?, ?)").run(iso(T0), iso(T0));
  v2.exec('PRAGMA user_version = 2');
  v2.close();
  const db = openStore(p);
  t.after(() => db.close());
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
  const r = scan(db, join(dir, 'projects'));
  assert.deepEqual([r.read, r.sessionsAdded], [1, 0]);
  assert.equal(db.prepare('SELECT git_branch FROM sessions').get().git_branch, 'lane-1');
  assert.equal(scan(db, join(dir, 'projects')).read, 0, 'once');
});
