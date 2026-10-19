// Repository identity: every distinct session cwd -> the repository it belongs to, or the reason
// it has none. A repository is keyed by its lowest root commit, so the linked worktrees of one
// clone (one git common dir) and every clone sharing a root commit are one repository; clones
// with disjoint roots are two. A cwd that is gone or not in a work tree is "missing", never
// "no commit".
import { realpathSync, statSync } from 'node:fs';
import { git } from './run.mjs';

export const MISSING_REASONS = ['no-cwd', 'path-gone', 'not-a-git-work-tree', 'no-commits', 'git-error'];

/** cwd -> { toplevel, commonDir } (realpaths), or { reason }. */
export function resolveCwd(cwd) {
  if (typeof cwd !== 'string' || cwd === '') return { reason: 'no-cwd' };
  try {
    if (!statSync(cwd).isDirectory()) return { reason: 'path-gone' };
  } catch {
    return { reason: 'path-gone' };
  }
  const r = git(['rev-parse', '--path-format=absolute', '--is-inside-work-tree', '--show-toplevel', '--git-common-dir'], { cwd });
  if (!r.ok) {
    return { reason: /not a git repository|must be run in a work tree/.test(r.err) ? 'not-a-git-work-tree' : 'git-error' };
  }
  const [inside, toplevel, commonDir] = r.out.split('\n');
  if (inside !== 'true' || !toplevel || !commonDir) return { reason: 'not-a-git-work-tree' };
  return { toplevel: realpathSync(toplevel), commonDir: realpathSync(commonDir) };
}

/** Root commits (sorted) and normalised origin of one clone, or { reason }. */
export function cloneIdentity(toplevel) {
  const r = git(['rev-list', '--max-parents=0', '--all'], { cwd: toplevel });
  if (!r.ok) return { reason: 'git-error' };
  const roots = r.out.split('\n').filter(Boolean).sort();
  if (roots.length === 0) return { reason: 'no-commits' };
  const o = git(['remote', 'get-url', 'origin'], { cwd: toplevel });
  return { roots, remote: o.ok ? normalizeRemote(o.out.trim()) : null };
}

/**
 * host/path for network remotes (scheme, user, password, port and a trailing .git dropped),
 * local:<path> for a remote on the file system, null for none.
 */
export function normalizeRemote(url) {
  if (!url) return null;
  const strip = (p) => p.replace(/\/+$/, '').replace(/\.git$/, '').replace(/^\/+/, '');
  if (/^file:\/\//i.test(url)) return `local:${url.slice('file://'.length).replace(/\/+$/, '')}`;
  let m = /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/]*@)?([^/:]+)(?::\d*)?(\/.*)?$/i.exec(url);
  if (m) return `${m[1].toLowerCase()}/${strip(m[2] ?? '')}`;
  m = /^(?:[^@/:]+@)?([^/:]+):(?!\/\/)(.+)$/.exec(url);
  if (m && !/^[a-z]$/i.test(m[1])) return `${m[1].toLowerCase()}/${strip(m[2])}`;
  return `local:${url.replace(/\/+$/, '')}`;
}

/** The host of a normalised remote, 'local' for a file-system remote, '-' for none. */
export const remoteHost = (remote) => (!remote ? '-' : remote.startsWith('local:') ? 'local' : remote.split('/')[0]);

const json = (v) => JSON.stringify(v);
const union = (...lists) => [...new Set(lists.flat())].sort();

/**
 * Resolves every distinct session cwd and rewrites repos and session_repo. Old repository rows
 * that share a root with a present repository are merged into it (a lower root moves the key);
 * the others are marked gone and keep their commits. Returns counts.
 */
export function identify(db) {
  const st = { cwds: 0, inRepo: 0, missing: {}, repos: 0, clones: 0, reposAdded: 0, reposGone: 0, linksAdded: 0, linksChanged: 0 };
  const cwds = db.prepare('SELECT DISTINCT cwd FROM sessions').all().map((r) => r.cwd);
  const byCwd = new Map();
  const clones = new Map(); // commonDir -> { toplevels, roots, remote } | { reason }
  for (const cwd of cwds) {
    st.cwds++;
    const r = resolveCwd(cwd);
    if (r.reason) {
      byCwd.set(cwd, { reason: r.reason });
      continue;
    }
    let c = clones.get(r.commonDir);
    if (!c) {
      c = { toplevels: new Set(), ...cloneIdentity(r.toplevel) };
      clones.set(r.commonDir, c);
    }
    if (c.reason) {
      byCwd.set(cwd, { reason: c.reason });
      continue;
    }
    c.toplevels.add(r.toplevel);
    byCwd.set(cwd, { commonDir: r.commonDir });
  }

  // Clones sharing any root commit are one repository.
  const groups = [];
  for (const [dir, c] of clones) {
    if (c.reason) continue;
    const hit = groups.filter((g) => c.roots.some((x) => g.roots.has(x)));
    const g = { roots: new Set(c.roots), dirs: [dir] };
    for (const h of hit) {
      h.roots.forEach((x) => g.roots.add(x));
      g.dirs.push(...h.dirs);
      groups.splice(groups.indexOf(h), 1);
    }
    groups.push(g);
  }

  const q = {
    all: db.prepare('SELECT * FROM repos'),
    ins: db.prepare('INSERT INTO repos (key, roots, common_dirs, toplevels, remote, state, tips) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    upd: db.prepare(`UPDATE repos SET roots = ?, common_dirs = ?, toplevels = ?, remote = ?, state = 'present' WHERE key = ?
      AND NOT (roots = ? AND common_dirs = ? AND toplevels = ? AND remote IS ? AND state = 'present')`),
    gone: db.prepare("UPDATE repos SET state = 'gone', common_dirs = '[]' WHERE key = ? AND state <> 'gone'"),
    del: db.prepare('DELETE FROM repos WHERE key = ?'),
    delCommits: db.prepare('DELETE FROM commits WHERE repo_key = ?'),
    getLink: db.prepare('SELECT repo_key, missing FROM session_repo WHERE session_id = ?'),
    insLink: db.prepare('INSERT INTO session_repo (session_id, repo_key, missing) VALUES (?, ?, ?)'),
    updLink: db.prepare('UPDATE session_repo SET repo_key = ?, missing = ? WHERE session_id = ?'),
    sessions: db.prepare('SELECT id, cwd FROM sessions'),
  };

  db.exec('BEGIN');
  try {
    const old = q.all.all().map((r) => ({ ...r, roots: JSON.parse(r.roots), toplevels: JSON.parse(r.toplevels) }));
    const matched = new Set();
    const keyOfDir = new Map();
    for (const g of groups) {
      const roots = [...g.roots].sort();
      const key = roots[0];
      const dirs = g.dirs.sort();
      const prev = old.filter((o) => o.roots.some((x) => g.roots.has(x)));
      prev.forEach((o) => matched.add(o.key));
      const toplevels = union(...dirs.map((d) => [...clones.get(d).toplevels]), ...prev.map((o) => o.toplevels));
      const remote = dirs.map((d) => clones.get(d).remote).find(Boolean) ?? null;
      for (const o of prev) {
        if (o.key !== key) {
          q.delCommits.run(o.key);
          q.del.run(o.key);
        }
      }
      if (prev.some((o) => o.key === key)) {
        q.upd.run(json(roots), json(dirs), json(toplevels), remote, key, json(roots), json(dirs), json(toplevels), remote);
      } else {
        q.ins.run(key, json(roots), json(dirs), json(toplevels), remote, 'present', '{}');
        st.reposAdded++;
      }
      for (const d of dirs) keyOfDir.set(d, key);
      st.repos++;
      st.clones += dirs.length;
    }
    for (const o of old) if (!matched.has(o.key)) st.reposGone += Number(q.gone.run(o.key).changes);

    for (const s of q.sessions.all()) {
      const r = byCwd.get(s.cwd) ?? { reason: 'no-cwd' };
      const key = r.commonDir ? keyOfDir.get(r.commonDir) : null;
      const missing = key ? null : r.reason;
      if (key) st.inRepo++;
      else st.missing[missing] = (st.missing[missing] ?? 0) + 1;
      const ex = q.getLink.get(s.id);
      if (!ex) {
        q.insLink.run(s.id, key, missing);
        st.linksAdded++;
      } else if (ex.repo_key !== key || ex.missing !== missing) {
        q.updLink.run(key, missing, s.id);
        st.linksChanged++;
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return st;
}
