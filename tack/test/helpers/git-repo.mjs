// Synthetic git repositories and sessions for the git collector tests. Every repository is created
// by the test in its own temporary directory, with fixed dates and no user or system git config.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

export const T0 = Date.parse('2026-01-05T10:00:00Z') / 1000;

function env(sec, author) {
  const e = {
    ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: author?.name ?? 'Fixture Author', GIT_AUTHOR_EMAIL: author?.email ?? 'fixture@example.org',
    GIT_COMMITTER_NAME: author?.name ?? 'Fixture Author', GIT_COMMITTER_EMAIL: author?.email ?? 'fixture@example.org',
  };
  for (const k of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR']) delete e[k];
  if (sec !== undefined) e.GIT_AUTHOR_DATE = e.GIT_COMMITTER_DATE = `${sec} +0000`;
  return e;
}

/** Runs git in cwd for the test (writes allowed: these are the test's own repositories). */
export function g(cwd, args, { sec, input, author } = {}) {
  const r = spawnSync('git', args, { cwd, input, encoding: 'utf8', env: env(sec, author) });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

export function initRepo(dir) {
  mkdirSync(dir, { recursive: true });
  g(dir, ['init', '-q', '-b', 'main']);
  return dir;
}

/** Writes file (relative to dir) and commits with message at unix second sec; returns the sha. */
export function commit(dir, { sec, message = 'change', file = 'a.txt', content, author } = {}) {
  const p = join(dir, file);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content ?? `${message}\n${sec}\n`);
  g(dir, ['add', '--', file]);
  g(dir, ['commit', '-q', '-F', '-'], { sec, input: message, author });
  return g(dir, ['rev-parse', 'HEAD']);
}

export const countAll = (dir) => Number(g(dir, ['rev-list', '--all', '--count']));
export const shasAll = (dir) => g(dir, ['rev-list', '--all']).split('\n').filter(Boolean).sort();

const iso = (sec) => new Date(sec * 1000).toISOString();

/** A session row as the Claude Code collector would write it. */
export function addSession(db, id, cwd, firstSec, lastSec) {
  db.prepare('INSERT INTO sessions (id, file_id, cwd, first_ts, last_ts) VALUES (?, 0, ?, ?, ?)')
    .run(id, cwd, iso(firstSec), iso(lastSec));
}

/** A minimal main transcript under root for a session in cwd, from firstSec to lastSec. */
export function addTranscript(root, id, cwd, firstSec, lastSec) {
  const dir = join(root, cwd.replace(/[^A-Za-z0-9]/g, '-'));
  mkdirSync(dir, { recursive: true });
  const rec = (sec, mid) => JSON.stringify({
    type: 'assistant', sessionId: id, cwd, version: '9.9.9', timestamp: iso(sec),
    message: { id: mid, model: 'claude-fixture-3', usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } },
  });
  writeFileSync(join(dir, `${id}.jsonl`), `${rec(firstSec, `msg_${id}_1`)}\n${rec(lastSec, `msg_${id}_2`)}\n`);
}
