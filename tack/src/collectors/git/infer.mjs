// Link inference for sessions whose cwd is gone (`path-gone`): a deleted linked worktree, most
// often. Runs after repository identity and never touches a direct link. Two methods, in order:
//
//   branch   the session's gitBranch names a branch of exactly one present repository: a ref
//            (refs/heads/<b>, refs/remotes/<remote>/<b>) or a branch merged by a merge commit
//            reachable from a ref, read from the merge subject in memory and dropped;
//   sibling  the deleted directory's parent holds present work trees of exactly one repository,
//            and the session's branch, when it names any repository, names that one.
//
// Otherwise none, with the reason. Two candidate repositories are never resolved by a guess.
import { existsSync, realpathSync } from 'node:fs';
import { dirname } from 'node:path';
import { git } from './run.mjs';

export const LINK_METHODS = ['direct', 'branch', 'sibling', 'none'];
export const NONE_REASONS = ['branch-conflicts-sibling', 'branch-ambiguous', 'sibling-ambiguous', 'no-candidate'];

// The branch a merge subject names, for the forms git, GitHub and a `merge: <branch> ...` convention write.
const MERGE_FORMS = [
  /^Merge branch '([^']+)'/,
  /^Merge remote-tracking branch '[^'/]+\/([^']+)'/,
  /^Merge pull request #\d+ from [^/\s]+\/(\S+)/,
  /^merge: ([^\s,()]+)(?: into |, | \(|$)/i,
];

/** The branch name a merge subject names, or null. */
export function mergedBranch(subject) {
  for (const re of MERGE_FORMS) {
    const m = re.exec(subject);
    if (m) return m[1];
  }
  return null;
}

/** Branch names of one clone: its refs (remote prefix dropped) and the branches its merges name. */
export function branchesOf(commonDir) {
  const out = new Set();
  const refs = git(['--git-dir', commonDir, 'for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes']);
  if (refs.ok) {
    for (const r of refs.out.split('\n').filter(Boolean)) {
      if (r.startsWith('refs/heads/')) out.add(r.slice('refs/heads/'.length));
      else out.add(r.split('/').slice(3).join('/'));
    }
  }
  const merges = git(['--git-dir', commonDir, 'log', '--all', '--merges', '--no-color', '--format=%s']);
  if (merges.ok) {
    for (const s of merges.out.split('\n')) {
      const b = mergedBranch(s);
      if (b) out.add(b);
    }
  }
  out.delete('HEAD');
  return out;
}

/** Present work-tree paths (realpath) of one clone. */
export function worktreesOf(commonDir) {
  const r = git(['--git-dir', commonDir, 'worktree', 'list', '--porcelain']);
  if (!r.ok) return [];
  return r.out.split('\n').filter((l) => l.startsWith('worktree ')).map((l) => l.slice('worktree '.length))
    .filter((p) => existsSync(p)).map((p) => realpathSync(p));
}

/**
 * The directory that holds the deleted one: the nearest existing ancestor of cwd, as a realpath,
 * or null when none exists.
 */
export function holderOf(cwd) {
  let p = cwd;
  while (p && !existsSync(p)) {
    const up = dirname(p);
    if (up === p) return null;
    p = up;
  }
  return p ? realpathSync(p) : null;
}

/**
 * Pure decision for one path-gone session. ctx.branches: Map repo key -> Set of branch names;
 * ctx.worktrees: [{ path, key }] of present repositories. Returns { method, key, reason }.
 */
export function inferLink({ cwd, branch }, ctx) {
  const byBranch = new Set();
  if (branch) for (const [key, names] of ctx.branches) if (names.has(branch)) byBranch.add(key);
  if (byBranch.size === 1) return { method: 'branch', key: [...byBranch][0], reason: null };
  const holder = holderOf(cwd);
  const bySibling = new Set(holder === null ? [] : ctx.worktrees.filter((w) => dirname(w.path) === holder).map((w) => w.key));
  if (bySibling.size === 1) {
    const key = [...bySibling][0];
    if (byBranch.size === 0 || byBranch.has(key)) return { method: 'sibling', key, reason: null };
    return { method: 'none', key: null, reason: 'branch-conflicts-sibling' };
  }
  if (byBranch.size > 1) return { method: 'none', key: null, reason: 'branch-ambiguous' };
  if (bySibling.size > 1) return { method: 'none', key: null, reason: 'sibling-ambiguous' };
  return { method: 'none', key: null, reason: 'no-candidate' };
}

/** The context of inferLink for the present repositories of db; branches are read only when asked. */
export function inferenceContext(db, { withBranches = true } = {}) {
  const ctx = { branches: new Map(), worktrees: [] };
  for (const r of db.prepare("SELECT key, common_dirs FROM repos WHERE state = 'present' ORDER BY key").all()) {
    const names = new Set();
    for (const d of JSON.parse(r.common_dirs)) {
      if (withBranches) branchesOf(d).forEach((b) => names.add(b));
      for (const p of worktreesOf(d)) ctx.worktrees.push({ path: p, key: r.key });
    }
    ctx.branches.set(r.key, names);
  }
  return ctx;
}
