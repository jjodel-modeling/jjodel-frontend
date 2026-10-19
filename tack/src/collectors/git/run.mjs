// The one place Tack runs git. Read-only commands only (rev-parse, rev-list, log, for-each-ref,
// worktree list, remote get-url), never one that writes in a scanned repository, and every call
// with GIT_OPTIONAL_LOCKS=0 so no optional lock or index refresh is taken.
import { spawnSync } from 'node:child_process';

export const GIT_ENV = { GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0', GIT_PAGER: 'cat', LC_ALL: 'C' };

// Inherited variables that would point git at another repository than the one asked for.
const DROPPED = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_NAMESPACE'];

function env() {
  const e = { ...process.env, ...GIT_ENV };
  for (const k of DROPPED) delete e[k];
  return e;
}

/** Runs git with args; { ok, out, err }. input, when given, is written to stdin. */
export function git(args, { cwd, input } = {}) {
  const r = spawnSync('git', args, { cwd, input, encoding: 'utf8', maxBuffer: 1 << 30, env: env() });
  if (r.error) throw r.error;
  return { ok: r.status === 0, out: r.stdout, err: r.stderr };
}
