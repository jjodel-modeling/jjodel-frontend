// The selection a metric reads: the sessions of one repository (or all) from a day on, with their
// calls and model costs, read from the store in one pass. Nothing else is read.
import { realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { dayOf } from './days.mjs';

const ms = (ts) => (ts ? Date.parse(ts) : null);

/**
 * A repository key from a key, a key prefix of 4 or more hex characters, or a path inside one of
 * the repository's work trees (present or deleted). { key } or { error }.
 */
export function resolveRepo(db, arg) {
  const repos = db.prepare('SELECT key, toplevels FROM repos ORDER BY key').all().map((r) => ({ key: r.key, toplevels: JSON.parse(r.toplevels) }));
  if (/^[0-9a-f]{4,40}$/.test(arg)) {
    const hit = repos.filter((r) => r.key.startsWith(arg));
    if (hit.length === 1) return { key: hit[0].key };
    if (hit.length > 1) return { error: `key prefix ${arg} matches ${hit.length} repositories` };
  }
  let p = resolve(arg);
  try {
    p = realpathSync(p);
  } catch { /* a deleted work tree is matched by its recorded path */ }
  const inside = (top) => p === top || p.startsWith(top + sep);
  const hit = repos.filter((r) => r.toplevels.some(inside));
  if (hit.length === 1) return { key: hit[0].key };
  return { error: hit.length ? `${arg} is inside ${hit.length} repositories` : `no repository for ${arg}` };
}

/**
 * Sessions (main transcripts) of the selection: repo = a repository key or null for all; since =
 * 'YYYY-MM-DD', the first day kept (by the day of the session's first event); until, the last day
 * kept, inclusive. utc picks UTC days.
 */
export function loadSelection(db, { repo = null, since = null, until = null, utc = false } = {}) {
  const rows = db.prepare(`
    SELECT s.id, s.cwd, s.first_ts, s.last_ts, s.cost_usd, s.cost_known, s.cost_unknown_model,
           s.unit, s.unit_source, sr.repo_key, sr.link_method
    FROM sessions s LEFT JOIN session_repo sr ON sr.session_id = s.id
    WHERE (? IS NULL OR sr.repo_key = ?)
    ORDER BY s.first_ts, s.id`).all(repo, repo);
  const callsOf = db.prepare(`SELECT ts, sidechain, model, input, output, cache_read, cache_creation, context
    FROM calls WHERE session_id = ? ORDER BY ts, message_id`);
  const modelsOf = db.prepare('SELECT model, cost_usd FROM session_models WHERE session_id = ?');
  const sessions = [];
  for (const r of rows) {
    const first = ms(r.first_ts);
    const day = first === null ? null : dayOf(first, { utc });
    if (since && (day === null || day < since)) continue;
    if (until && (day === null || day > until)) continue;
    sessions.push({
      id: r.id,
      cwd: r.cwd,
      repo: r.repo_key ?? null,
      link: r.link_method ?? 'none',
      unit: r.unit ?? null,
      unitSource: r.unit_source ?? null,
      first,
      last: ms(r.last_ts),
      day,
      cost: r.cost_known ? r.cost_usd : null,
      costPartial: r.cost_unknown_model === 1,
      calls: callsOf.all(r.id).map((c) => ({ ...c, ts: ms(c.ts) })),
      models: new Map(modelsOf.all(r.id).map((m) => [m.model, m.cost_usd])),
    });
  }
  return { db, repo, since, until, utc, sessions };
}
