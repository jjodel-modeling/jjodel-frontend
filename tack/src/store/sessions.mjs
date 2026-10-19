// One row per session, main thread only: sidechain calls are stored but not counted here.
const SQL = `
SELECT s.id, s.cwd, s.first_ts, s.last_ts, s.cost_usd, s.cost_known, s.cli_version,
       COUNT(c.message_id) AS calls, COALESCE(MAX(c.context), 0) AS context_peak,
       GROUP_CONCAT(DISTINCT c.model) AS models
FROM sessions s
LEFT JOIN calls c ON c.session_id = s.id AND c.sidechain = 0
WHERE (? IS NULL OR substr(s.cwd, 1, length(?)) = ?)
GROUP BY s.id
ORDER BY s.first_ts, s.id`;

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
  }));
}
