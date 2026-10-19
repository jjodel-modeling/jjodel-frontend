// Layer 2, the session-unit link. A session's unit comes from the leading id of its first user message
// (unit_source 'prompt', set by the Claude Code collector) or, failing that, from a commit (unit_source
// 'commit'): a commit carrying a unit id, whose commit time lies between the session's first event and one
// hour after its last, and which is REACHABLE FROM THE SESSION'S BRANCH: its gitBranch ref (refs/heads,
// refs/remotes) or, for a branch deleted after merging, the second parent of each merge commit naming it.
// A commit of another branch made in the same minutes never counts. No such commit: no unit, and the
// Sessions view shows the branch. Read-only git; merge subjects are parsed in memory and dropped.
import { mergedBranch } from './git/infer.mjs';
import { git } from './git/run.mjs';

const HOUR = 3600;
const DAY = 86400;

/** { branch name: [tip sha] } of one clone: refs (remote prefix dropped) and the second parent of every merge naming a branch. */
export function branchTips(commonDir) {
  const tips = new Map();
  const add = (b, sha) => {
    if (!b || b === 'HEAD') return;
    if (!tips.has(b)) tips.set(b, new Set());
    tips.get(b).add(sha);
  };
  const refs = git(['--git-dir', commonDir, 'for-each-ref', '--format=%(objectname) %(refname)', 'refs/heads', 'refs/remotes']);
  if (refs.ok) {
    for (const l of refs.out.split('\n').filter(Boolean)) {
      const [sha, ref] = l.split(' ');
      add(ref.startsWith('refs/heads/') ? ref.slice('refs/heads/'.length) : ref.split('/').slice(3).join('/'), sha);
    }
  }
  const merges = git(['--git-dir', commonDir, 'log', '--all', '--merges', '--no-color', '--format=%P%x00%s']);
  if (merges.ok) {
    for (const l of merges.out.split('\n')) {
      const [parents, subject] = l.split('\0');
      const second = (parents ?? '').split(' ')[1];
      if (second) add(mergedBranch(subject ?? ''), second);
    }
  }
  return tips;
}

/** Shas reachable from tips with a commit time at or after sinceSec (a day of margin for the date walk). */
function reachable(commonDir, tips, sinceSec) {
  const r = git(['--git-dir', commonDir, 'rev-list', `--since=${sinceSec - DAY}`, '--stdin'], { input: tips.join('\n') + '\n' });
  return r.ok ? new Set(r.out.split('\n').filter(Boolean)) : null;
}

/**
 * Sets sessions.unit for every session not set by its prompt: the unit of the reachable commit nearest the
 * last event (ties: the earlier commit), or null. Returns counts.
 */
export function linkUnits(db) {
  const st = { prompt: 0, commit: 0, none: 0, noBranch: 0, gitErrors: 0 };
  const sessions = db.prepare(`SELECT s.id, s.first_ts, s.last_ts, s.git_branch, s.unit, s.unit_source, sr.repo_key
    FROM sessions s LEFT JOIN session_repo sr ON sr.session_id = s.id ORDER BY s.id`).all();
  const candidates = db.prepare(`SELECT sha, unit, commit_time FROM commits WHERE repo_key = ? AND unit IS NOT NULL
    AND commit_time BETWEEN ? AND ? ORDER BY commit_time`);
  const dirsOf = db.prepare('SELECT common_dirs, state FROM repos WHERE key = ?');
  const set = db.prepare('UPDATE sessions SET unit = ?, unit_source = ? WHERE id = ? AND (unit IS NOT ? OR unit_source IS NOT ?)');
  const tipCache = new Map();
  const reachCache = new Map();
  const tipsOf = (dir) => {
    if (!tipCache.has(dir)) tipCache.set(dir, branchTips(dir));
    return tipCache.get(dir);
  };
  // Per (clone, branch) the shas reachable since the earliest window of its sessions: one rev-list each.
  const work = [];
  const earliest = new Map();
  for (const s of sessions) {
    if (s.unit_source === 'prompt') {
      st.prompt++;
      continue;
    }
    let found = [];
    if (s.repo_key && s.first_ts && s.last_ts) {
      const from = Math.floor(Date.parse(s.first_ts) / 1000);
      const last = Math.ceil(Date.parse(s.last_ts) / 1000);
      found = candidates.all(s.repo_key, from, last + HOUR);
      if (found.length && s.git_branch) {
        const k = `${s.repo_key}\0${s.git_branch}`;
        earliest.set(k, Math.min(earliest.get(k) ?? Infinity, from));
      }
      work.push({ s, found, last });
    } else work.push({ s, found, last: 0 });
  }
  db.exec('BEGIN');
  try {
    for (const { s, found, last } of work) {
      let unit = null;
      if (found.length && !s.git_branch) st.noBranch++;
      if (found.length && s.git_branch) {
        const k = `${s.repo_key}\0${s.git_branch}`;
        if (!reachCache.has(k)) {
          const repo = dirsOf.get(s.repo_key);
          const union = new Set();
          let ok = false;
          for (const dir of repo && repo.state === 'present' ? JSON.parse(repo.common_dirs) : []) {
            const tips = tipsOf(dir).get(s.git_branch);
            if (!tips) continue;
            const r = reachable(dir, [...tips], earliest.get(k));
            if (!r) {
              st.gitErrors++;
              continue;
            }
            ok = true;
            for (const sha of r) union.add(sha);
          }
          reachCache.set(k, ok ? union : new Set());
        }
        const reach = reachCache.get(k);
        const hit = found.filter((c) => reach.has(c.sha))
          .sort((a, b) => Math.abs(a.commit_time - last) - Math.abs(b.commit_time - last) || a.commit_time - b.commit_time)[0];
        unit = hit ? hit.unit : null;
      }
      if (unit) st.commit++;
      else st.none++;
      set.run(unit, unit ? 'commit' : null, s.id, unit, unit ? 'commit' : null);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return st;
}
