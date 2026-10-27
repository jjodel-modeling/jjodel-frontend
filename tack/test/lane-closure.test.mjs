// Lane closure (slice 8 fix), on real git repositories: every Prompt-ID a commit message names is stored, in the
// subject or the body and in or out of parentheses; the Status: line of the prompt file at the HEAD of the
// repository closes a lane, from a worktree whose own copy still says «da eseguire».
process.env.TZ = 'Europe/Rome';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store/open.mjs';
import { identify } from '../src/collectors/git/identity.mjs';
import { collectGit } from '../src/collectors/git/collect.mjs';
import { collectLanes, promptStatusOf, refreshPromptStatus } from '../src/collectors/lane-run/collect.mjs';
import { promptIdsOf } from '../src/contract/linkage.mjs';
import { lanesApi } from '../src/board/api.mjs';
import { T0, addSession, commit, g, initRepo } from './helpers/git-repo.mjs';
import { writeLane } from './helpers/layers-fixture.mjs';

const prompt = (status) => `# A prompt\n\nPrompt-ID: P-2026-01-05-1000\nStatus: ${status}\nFront: tack\n\n## COSA\nStatus: da eseguire\n`;
const settingsFor = () => ({ value: (k) => ({ 'harness.laneRun': 'auto', 'limits.laneMinutes': 90 })[k] });

test('promptIdsOf: every distinct id of the message, in parentheses or not, in the subject or the body; no partial id', () => {
  const m = 'feat: s7 P-2026-10-19-1800 P-2026-10-19-2140 (P-2026-10-19-2225)\n\nbody names P-2026-10-19-1800 again and xP-2026-01-01-0000 and P-2026-01-01-00001.\n';
  assert.deepEqual(promptIdsOf(m), ['P-2026-10-19-1800', 'P-2026-10-19-2140', 'P-2026-10-19-2225']);
  assert.deepEqual(promptIdsOf('no id here'), []);
});

test('promptStatusOf: the first word of the header Status:, lowercased; nothing below the first ## counts', () => {
  assert.equal(promptStatusOf(prompt('Eseguito 2026-01-05')), 'eseguito');
  assert.equal(promptStatusOf(prompt('da eseguire')), 'da');
  assert.equal(promptStatusOf('# t\n\n## COSA\nStatus: done\n'), null);
});

test('git collector stores every Prompt-ID of a message; the lane closes by a commit that names it outside the unit slot', (t) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-closure-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.close());
  const a = initRepo(join(dir, 'a'));
  commit(a, { sec: T0, message: 'init' });
  const sha = commit(a, { sec: T0 + 7200, message: 'feat(tack): s7 P-2026-01-05-1000 P-2026-01-05-1100 (P-2026-01-05-1200)\n\nbody' });
  addSession(db, 's1', a, T0, T0 + 10);
  identify(db);
  collectGit(db);
  const key = db.prepare('SELECT key FROM repos').get().key;
  assert.deepEqual(db.prepare('SELECT prompt_id FROM commit_ids WHERE sha = ? ORDER BY prompt_id').all(sha).map((r) => r.prompt_id),
    ['P-2026-01-05-1000', 'P-2026-01-05-1100', 'P-2026-01-05-1200']);
  assert.equal(db.prepare('SELECT unit FROM commits WHERE sha = ?').get(sha).unit, 'P-2026-01-05-1200', 'the unit slot is unchanged');

  const root = join(dir, 'lanes');
  mkdirSync(root);
  const endSec = T0 + 3600;
  writeLane(root, 'P-2026-01-05-1000', { started: (endSec - 600) * 1000, exitAt: endSec * 1000, worktree: a, events: [] });
  collectLanes(db, root, (T0 + 8000) * 1000);
  db.prepare("UPDATE lanes SET last_outcome = 'question' WHERE id = 'P-2026-01-05-1000'").run();
  const waiting = () => lanesApi(db, { repo: key, now: (T0 + 8000) * 1000, laneRoot: root, settingsFor }).attention.waiting.map((c) => c.id);
  assert.deepEqual(waiting(), [], 'closed by the commit after it ended');
  db.prepare('DELETE FROM commit_ids').run();
  db.prepare('UPDATE commits SET unit = NULL').run();
  assert.deepEqual(waiting(), ['P-2026-01-05-1000'], 'with the commit ids gone the lane is waiting again');
});

test('refreshPromptStatus: the Status of the prompt at the HEAD of the repository, from a worktree that still says da eseguire', (t) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-status-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.close());
  const a = initRepo(join(dir, 'a'));
  const rel = 'docs/prompts/p_prompt.md';
  commit(a, { sec: T0, message: 'init', file: rel, content: prompt('da eseguire') });
  const wt = join(dir, 'wt');
  g(a, ['worktree', 'add', '-q', '-b', 'side', wt]);
  addSession(db, 's1', a, T0, T0 + 10);
  addSession(db, 's2', wt, T0, T0 + 10);
  identify(db);
  const root = join(dir, 'lanes');
  mkdirSync(root);
  const id = 'P-2026-01-05-1000';
  writeLane(root, id, { started: (T0 + 100) * 1000, exitAt: (T0 + 700) * 1000, worktree: wt, events: [] });
  writeFileSync(join(root, id, 'prompt.txt'), join(wt, rel) + '\n'); // a path in the worktree, not the trunk
  const NOW = (T0 + 9000) * 1000;
  const status = () => db.prepare('SELECT prompt_status FROM lanes WHERE id = ?').get(id).prompt_status;
  collectLanes(db, root, NOW);
  assert.equal(status(), 'da');
  commit(a, { sec: T0 + 50, message: 'flip', file: rel, content: prompt('eseguito 2026-01-05') });
  assert.equal(refreshPromptStatus(db, root, NOW + 1000), 0, 'throttled: once a minute per store');
  assert.equal(refreshPromptStatus(db, root, NOW + 61_000), 1);
  assert.equal(status(), 'eseguito');
  const key = db.prepare('SELECT key FROM repos').get().key;
  db.prepare("UPDATE lanes SET last_outcome = 'question' WHERE id = ?").run(id);
  assert.deepEqual(lanesApi(db, { repo: key, now: NOW, laneRoot: root, settingsFor }).attention.waiting, [], 'closed by the Status line');
});

test('refreshPromptStatus: a deleted checkout does not throw; the common dir still answers', (t) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-status-del-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.close());
  const a = initRepo(join(dir, 'a'));
  const rel = 'docs/prompts/p_prompt.md';
  commit(a, { sec: T0, message: 'init', file: rel, content: prompt('done') });
  const wt = join(dir, 'wt');
  g(a, ['worktree', 'add', '-q', '-b', 'side', wt]);
  addSession(db, 's1', a, T0, T0 + 10);
  addSession(db, 's2', wt, T0, T0 + 10);
  identify(db);
  const root = join(dir, 'lanes');
  mkdirSync(root);
  const id = 'P-2026-01-05-1000';
  writeLane(root, id, { started: (T0 + 100) * 1000, exitAt: (T0 + 700) * 1000, worktree: wt, events: [] });
  writeFileSync(join(root, id, 'prompt.txt'), join(wt, rel) + '\n');
  rmSync(wt, { recursive: true, force: true });
  collectLanes(db, root, (T0 + 9000) * 1000);
  assert.equal(db.prepare('SELECT prompt_status FROM lanes WHERE id = ?').get(id).prompt_status, 'done');
});
