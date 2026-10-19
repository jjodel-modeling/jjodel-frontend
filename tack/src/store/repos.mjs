// One row per repository, plus the session cwds that have none, grouped by reason.
import { remoteHost } from '../collectors/git/identity.mjs';
import { listSessions } from './sessions.mjs';

const REPOS = `
SELECT r.key, r.roots, r.toplevels, r.remote, r.state,
       COUNT(c.sha) AS commits,
       COALESCE(SUM(c.unit_form = 'trailer'), 0) AS unit_trailer,
       COALESCE(SUM(c.unit_form = 'suffix'), 0) AS unit_suffix,
       COALESCE(SUM(c.claude_coauthor), 0) AS claude_coauthored
FROM repos r LEFT JOIN commits c ON c.repo_key = r.key
GROUP BY r.key
ORDER BY r.key`;

export function listRepos(db) {
  const sessions = listSessions(db);
  const repos = db.prepare(REPOS).all().map((r) => {
    const own = sessions.filter((s) => s.repo_key === r.key);
    return {
      key: r.key,
      roots: JSON.parse(r.roots),
      toplevels: JSON.parse(r.toplevels),
      remote_host: remoteHost(r.remote),
      state: r.state,
      commits: r.commits,
      unit_trailer: r.unit_trailer,
      unit_suffix: r.unit_suffix,
      claude_coauthored: r.claude_coauthored,
      sessions: own.length,
      sessions_commit_within_hour: own.filter((s) => s.commit_within_hour === 'yes').length,
    };
  });
  const missing = {};
  for (const s of sessions) {
    if (s.repo_key) continue;
    const byCwd = (missing[s.repo_missing] ??= {});
    const k = s.cwd ?? '(none)';
    byCwd[k] = (byCwd[k] ?? 0) + 1;
  }
  return {
    repos,
    missing: Object.entries(missing).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([reason, cwds]) => ({
      reason,
      cwds: Object.entries(cwds).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([cwd, n]) => ({ cwd, sessions: n })),
    })),
  };
}
