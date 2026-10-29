// One row per session, main thread only: sidechain calls are stored but not counted here.
const SQL = `
SELECT s.id, s.cwd, s.first_ts, s.last_ts, s.cost_usd, s.cost_known, s.cli_version,
       sr.repo_key, sr.missing, sr.link_method,
       COUNT(c.message_id) AS calls, COALESCE(MAX(c.context), 0) AS context_peak,
       GROUP_CONCAT(DISTINCT c.model) AS models
FROM sessions s
LEFT JOIN calls c ON c.session_id = s.id AND c.sidechain = 0
LEFT JOIN session_repo sr ON sr.session_id = s.id
WHERE (? IS NULL OR substr(s.cwd, 1, length(?)) = ?)
GROUP BY s.id
ORDER BY s.first_ts, s.id`;

const HOUR = 3600;

/**
 * Commit proximity, computed at query time: 'yes' when the session's repository has a commit
 * whose commit time lies between the session's first event and one hour after its last event,
 * 'no' otherwise, 'unknown' when the repository is missing or the session has no timestamps.
 * Proximity, not authorship: any author's commit counts. windowSec replaces the hour.
 */
export function commitWithinHour(db, { repo_key, first_ts, last_ts }, windowSec = HOUR) {
  if (!repo_key || !first_ts || !last_ts) return 'unknown';
  const from = Math.floor(Date.parse(first_ts) / 1000);
  const to = Math.ceil(Date.parse(last_ts) / 1000) + windowSec;
  const hit = db.prepare('SELECT 1 FROM commits WHERE repo_key = ? AND commit_time BETWEEN ? AND ? LIMIT 1').get(repo_key, from, to);
  return hit ? 'yes' : 'no';
}

export function listSessions(db, { cwd = null } = {}) {
  return db.prepare(SQL).all(cwd, cwd, cwd).map((r) => ({
    id: r.id,
    cwd: r.cwd,
    day: r.first_ts ? new Date(Date.parse(r.first_ts)).toISOString().slice(0, 10) : null, // UTC day of the first record
    calls: r.calls,
    cost_usd: r.cost_known ? r.cost_usd : null,
    context_peak: r.context_peak,
    span_min: r.first_ts && r.last_ts ? Math.round((Date.parse(r.last_ts) - Date.parse(r.first_ts)) / 60000) : null,
    models: r.models ? r.models.split(',').sort() : [],
    cli_version: r.cli_version,
    repo_key: r.repo_key ?? null,
    repo_missing: r.repo_key ? null : (r.missing ?? 'not-identified'),
    link: r.link_method ?? 'none',
    commit_within_hour: commitWithinHour(db, r),
  }));
}
