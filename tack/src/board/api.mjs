// The board's JSON API over the store: repositories, sessions, metrics, health. Every response is
// metadata: ids, counts, times, model ids, ref names and repository toplevels. No session cwd (it may
// lie below a toplevel), no transcript path, no commit subject, author or changed-file path.
import { basename, dirname } from 'node:path';
import { remoteHost, resolveCwd, cloneIdentity } from '../collectors/git/identity.mjs';
import { SCHEMA_VERSION } from '../store/open.mjs';
import { commitWithinHour } from '../store/sessions.mjs';
import { dayOf } from '../metrics/days.mjs';
import { METRICS, computeAll, loadSelection } from '../metrics/index.mjs';

export const CONTEXT_THRESHOLD = 200_000;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const KEY = /^[0-9a-f]{4,40}$/;

export const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** The repository's main toplevel: the parent of a `.git` common dir when present, else the first recorded. */
function mainToplevel(commonDirs, toplevels) {
  const fromDir = commonDirs.filter((d) => basename(d) === '.git').map((d) => dirname(d)).find((d) => toplevels.includes(d));
  return fromDir ?? toplevels[0] ?? null;
}

export function listBoardRepos(db) {
  const counts = new Map(db.prepare('SELECT repo_key, COUNT(*) AS n FROM session_repo WHERE repo_key IS NOT NULL GROUP BY repo_key').all().map((r) => [r.repo_key, r.n]));
  const commits = new Map(db.prepare('SELECT repo_key, COUNT(*) AS n FROM commits GROUP BY repo_key').all().map((r) => [r.repo_key, r.n]));
  return db.prepare('SELECT key, common_dirs, toplevels, remote, state FROM repos ORDER BY key').all().map((r) => {
    const toplevels = JSON.parse(r.toplevels);
    const toplevel = mainToplevel(JSON.parse(r.common_dirs), toplevels);
    return {
      key: r.key, name: toplevel ? basename(toplevel) : r.key.slice(0, 12), toplevel, worktrees: toplevels.length,
      remote_host: remoteHost(r.remote), state: r.state, sessions: counts.get(r.key) ?? 0, commits: commits.get(r.key) ?? 0,
    };
  });
}

/**
 * The repository the board preselects for a start directory: the store's repository sharing a root
 * commit with the work tree that contains dir (so a linked worktree selects its main repository),
 * or null outside a git work tree or for a repository the store does not hold.
 */
export function preselect(db, dir) {
  const r = resolveCwd(dir);
  if (r.reason) return null;
  const id = cloneIdentity(r.toplevel);
  if (id.reason) return null;
  const rows = db.prepare('SELECT key, roots FROM repos ORDER BY key').all();
  const hit = rows.find((x) => JSON.parse(x.roots).some((root) => id.roots.includes(root)));
  return hit ? hit.key : null;
}

/** A query's repository: null for all, a full key for a key or unique prefix; { error } otherwise. */
export function repoParam(db, value) {
  if (value === null || value === '' || value === 'all') return { key: null };
  if (!KEY.test(value)) return { error: 'repo takes a repository key or "all"' };
  const hit = db.prepare("SELECT key FROM repos WHERE substr(key, 1, length(?)) = ?").all(value, value);
  if (hit.length === 1) return { key: hit[0].key };
  return { error: hit.length ? `key prefix ${value} matches ${hit.length} repositories` : `no repository ${value}` };
}

export function dayParam(name, value) {
  if (value === null || value === '') return { day: null };
  return DAY.test(value) ? { day: value } : { error: `${name} takes YYYY-MM-DD` };
}

const hasColumn = (db, table, column) => db.prepare(`SELECT 1 FROM pragma_table_info('${table}') WHERE name = ?`).get(column) !== undefined;

const SESSIONS = `
SELECT s.id, s.first_ts, s.last_ts, s.cost_usd, s.cost_known, s.cost_unknown_model, s.git_branch,
       sr.repo_key, sr.missing, sr.link_method,
       COUNT(c.message_id) AS calls, COALESCE(MAX(c.context), 0) AS context_peak,
       GROUP_CONCAT(DISTINCT c.model) AS models
FROM sessions s
LEFT JOIN calls c ON c.session_id = s.id AND c.sidechain = 0
LEFT JOIN session_repo sr ON sr.session_id = s.id
WHERE (? IS NULL OR sr.repo_key = ?)
GROUP BY s.id`;

/**
 * Sessions of the selection, newest first, by the local day of their first event (since and until
 * inclusive; a session without a timestamp is kept only when no day bound is set). Main-thread calls
 * only; cost null when unknown, never 0. Layer 2 (a session-unit link) replaces the branch by the unit.
 */
export function sessionsApi(db, { repo = null, since = null, until = null } = {}) {
  const names = new Map(listBoardRepos(db).map((r) => [r.key, r.name]));
  const layer2 = hasColumn(db, 'sessions', 'unit');
  const rows = [];
  for (const r of db.prepare(SESSIONS).all(repo, repo)) {
    const first = r.first_ts ? Date.parse(r.first_ts) : null;
    const last = r.last_ts ? Date.parse(r.last_ts) : null;
    const day = first === null ? null : dayOf(first);
    if ((since || until) && day === null) continue;
    if (since && day < since) continue;
    if (until && day > until) continue;
    rows.push({
      id: r.id,
      day,
      start: first === null ? null : new Date(first).toISOString(),
      duration_min: first !== null && last !== null ? Math.round((last - first) / 60000) : null,
      repo: r.repo_key ?? null,
      repo_name: r.repo_key ? names.get(r.repo_key) ?? r.repo_key.slice(0, 12) : null,
      missing: r.repo_key ? null : (r.missing ?? 'not-identified'),
      branch: layer2 ? null : r.git_branch ?? null,
      unit: null,
      link: r.link_method ?? 'none',
      calls: r.calls,
      context_peak: r.context_peak,
      cost_usd: r.cost_known ? r.cost_usd : null,
      cost_partial: r.cost_known === 1 && r.cost_unknown_model === 1,
      models: r.models ? r.models.split(',').sort() : [],
      commit_within_hour: commitWithinHour(db, r),
    });
  }
  rows.sort((a, b) => (b.start ?? '').localeCompare(a.start ?? '') || a.id.localeCompare(b.id));
  return { repo, since, until, days: `local (${timeZone()})`, layer2, threshold: CONTEXT_THRESHOLD, sessions: rows };
}

/** Every declared metric with its layer and state: computed (layer 1, with its value), not-adopted, not-implemented. */
export function metricsApi(db, { repo = null, since = null } = {}) {
  const sel = loadSelection(db, { repo, since });
  const values = computeAll(sel);
  const metrics = METRICS.map((m) => {
    const v = values[m.name];
    const state = m.layer === 1 ? 'computed' : v;
    return {
      name: m.name, layer: m.layer, definition: m.definition, state,
      ...(m.enabledBy ? { enabledBy: m.enabledBy } : {}), ...(state === 'computed' ? { value: v } : {}),
    };
  });
  return { repo, since, days: `local (${timeZone()})`, sessions: sel.sessions.length, metrics };
}

export function healthApi(db, { store, lastScan }) {
  const n = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
  return {
    store, schema: db.prepare('PRAGMA user_version').get().user_version, schemaExpected: SCHEMA_VERSION,
    days: `local (${timeZone()})`, lastScan,
    counts: { transcripts: n('ingest'), sessions: n('sessions'), calls: n('calls'), repos: n('repos'), commits: n('commits') },
  };
}
