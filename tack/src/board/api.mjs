// The board's JSON API over the store: repositories, sessions, metrics, health. Every response is
// metadata: ids, counts, times, model ids, ref names and repository toplevels. No session cwd (it may
// lie below a toplevel), no transcript path, no commit subject, author or changed-file path.
import { existsSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { remoteHost, resolveCwd, cloneIdentity } from '../collectors/git/identity.mjs';
import { SCHEMA_VERSION } from '../store/open.mjs';
import { commitWithinHour } from '../store/sessions.mjs';
import { dayOf } from '../metrics/days.mjs';
import { METRICS, computeAll, loadSelection } from '../metrics/index.mjs';
import { modelFamily } from '../metrics/layer1.mjs';

export const CONTEXT_THRESHOLD = 200_000;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const KEY = /^[0-9a-f]{4,40}$/;
const HASH = /^[0-9a-f]{12,}$/i;
const HOUR = 3600;

export const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** The repository's main toplevel: the parent of a `.git` common dir when present, else the first recorded. */
function mainToplevel(commonDirs, toplevels) {
  const fromDir = commonDirs.filter((d) => basename(d) === '.git').map((d) => dirname(d)).find((d) => toplevels.includes(d));
  return fromDir ?? toplevels[0] ?? null;
}

/**
 * The name a repository is shown by: its toplevel folder; when that folder is a bare hash (an Overleaf
 * clone, say), the folder that holds it; when both are hashes or there is no toplevel, (unnamed) and
 * the short key.
 */
export function displayName(toplevel, key) {
  const parts = toplevel ? toplevel.split(/[\\/]/).filter(Boolean) : [];
  const named = parts.slice(-2).reverse().find((p) => !HASH.test(p));
  return named ?? `(unnamed) ${key.slice(0, 8)}`;
}

export function listBoardRepos(db) {
  const counts = new Map(db.prepare('SELECT repo_key, COUNT(*) AS n FROM session_repo WHERE repo_key IS NOT NULL GROUP BY repo_key').all().map((r) => [r.repo_key, r.n]));
  const commits = new Map(db.prepare('SELECT repo_key, COUNT(*) AS n FROM commits GROUP BY repo_key').all().map((r) => [r.repo_key, r.n]));
  return db.prepare('SELECT key, common_dirs, toplevels, remote, state FROM repos ORDER BY key').all().map((r) => {
    const toplevels = JSON.parse(r.toplevels);
    const toplevel = mainToplevel(JSON.parse(r.common_dirs), toplevels);
    return {
      key: r.key, name: displayName(toplevel, r.key), toplevel, worktrees: toplevels.length,
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
SELECT s.id, s.first_ts, s.last_ts, s.cost_usd, s.cost_known, s.cost_unknown_model, s.git_branch, s.unit, s.unit_source,
       sr.repo_key, sr.missing, sr.link_method,
       COUNT(c.message_id) AS calls, COALESCE(MAX(c.context), 0) AS context_peak,
       GROUP_CONCAT(DISTINCT c.model) AS models
FROM sessions s
LEFT JOIN calls c ON c.session_id = s.id AND c.sidechain = 0
LEFT JOIN session_repo sr ON sr.session_id = s.id
WHERE (? IS NULL OR sr.repo_key = ?)
GROUP BY s.id`;

const inDays = (day, since, until) => !((since || until) && day === null) && !(since && day < since) && !(until && day > until);

/**
 * The unit a session is shown with when its repository has unit ids (layer 2 in the commits): the
 * unit of the commit carrying one, between the first event and an hour after the last, nearest to
 * the last event (proximity, not authorship). Null without a repository, a time or such a commit.
 */
export function unitNear(db, { repo_key, first_ts, last_ts }) {
  if (!repo_key || !first_ts || !last_ts) return null;
  const from = Math.floor(Date.parse(first_ts) / 1000);
  const last = Math.ceil(Date.parse(last_ts) / 1000);
  const hit = db.prepare(`SELECT unit FROM commits WHERE repo_key = ? AND unit IS NOT NULL AND commit_time BETWEEN ? AND ?
    ORDER BY ABS(commit_time - ?), commit_time LIMIT 1`).get(repo_key, from, last + HOUR, last);
  return hit ? hit.unit : null;
}

// TODO: cleanup (unitNear and unitRepos are no longer read by sessionsApi since schema 4: sessions.unit)
/** Repository keys with at least one commit carrying a unit id. */
const unitRepos = (db) => new Set(db.prepare('SELECT DISTINCT repo_key FROM commits WHERE unit IS NOT NULL').all().map((r) => r.repo_key));

/**
 * Sessions of the selection, newest first, by the local day of their first event (since and until
 * inclusive; a session without a timestamp is kept only when no day bound is set). Main-thread calls
 * only; cost null when unknown, never 0. unit: sessions.unit (layer 2: the first user message's id, else a
 * commit reachable from the session's branch), unit_source says which; the page shows the unit, and the
 * branch (always returned) only when there is none.
 */
export function sessionsApi(db, { repo = null, since = null, until = null } = {}) {
  const names = new Map(listBoardRepos(db).map((r) => [r.key, r.name]));
  const layer2 = hasColumn(db, 'sessions', 'unit');
  const rows = [];
  for (const r of db.prepare(SESSIONS).all(repo, repo)) {
    const first = r.first_ts ? Date.parse(r.first_ts) : null;
    const last = r.last_ts ? Date.parse(r.last_ts) : null;
    const day = first === null ? null : dayOf(first);
    if (!inDays(day, since, until)) continue;
    rows.push({
      id: r.id,
      day,
      start: first === null ? null : new Date(first).toISOString(),
      duration_min: first !== null && last !== null ? Math.round((last - first) / 60000) : null,
      repo: r.repo_key ?? null,
      repo_name: r.repo_key ? names.get(r.repo_key) ?? r.repo_key.slice(0, 12) : null,
      missing: r.repo_key ? null : (r.missing ?? 'not-identified'),
      branch: r.git_branch ?? null,
      unit: r.unit ?? null,
      unit_source: r.unit_source ?? null,
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

/**
 * What the Timeline draws beyond the Sessions rows, for the same selection: per session the last event,
 * the model family with most main-thread calls, the first main-thread call at or above the context
 * threshold, and the commit times of its repository within the hour. Epoch ms; times and ids only.
 */
export function timelineApi(db, { repo = null, since = null, until = null } = {}) {
  const calls = db.prepare('SELECT ts, model, context FROM calls WHERE session_id = ? AND sidechain = 0 ORDER BY ts, message_id');
  const commits = db.prepare('SELECT commit_time FROM commits WHERE repo_key = ? AND commit_time BETWEEN ? AND ? ORDER BY commit_time');
  const rows = [];
  for (const r of db.prepare(`SELECT s.id, s.first_ts, s.last_ts, sr.repo_key FROM sessions s LEFT JOIN session_repo sr ON sr.session_id = s.id
    WHERE (? IS NULL OR sr.repo_key = ?) ORDER BY s.first_ts, s.id`).all(repo, repo)) {
    if (!r.first_ts || !r.last_ts) continue; // nothing to place on a time axis
    const start = Date.parse(r.first_ts);
    const end = Date.parse(r.last_ts);
    if (!inDays(dayOf(start), since, until)) continue;
    const count = {};
    let crossed = null;
    for (const c of calls.all(r.id)) {
      if (c.model) count[modelFamily(c.model)] = (count[modelFamily(c.model)] ?? 0) + 1;
      if (crossed === null && c.context >= CONTEXT_THRESHOLD && c.ts) crossed = Date.parse(c.ts);
    }
    const family = Object.entries(count).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? 'unattributed';
    const ticks = r.repo_key ? commits.all(r.repo_key, Math.floor(start / 1000), Math.ceil(end / 1000) + HOUR).map((c) => c.commit_time * 1000) : [];
    rows.push({ id: r.id, start, end, family, crossed, commits: ticks });
  }
  return { repo, since, until, threshold: CONTEXT_THRESHOLD, sessions: rows };
}

/** Every declared metric with its layer and state: computed (with its value) or not-adopted. */
export function metricsApi(db, { repo = null, since = null, until = null } = {}) {
  const sel = loadSelection(db, { repo, since, until });
  const values = computeAll(sel, { cost_per_day: { byFamily: true } });
  const metrics = METRICS.map((m) => {
    const v = values[m.name];
    const state = typeof v === 'string' ? v : 'computed';
    return {
      name: m.name, layer: m.layer, definition: m.definition, state,
      ...(m.enabledBy ? { enabledBy: m.enabledBy } : {}), ...(state === 'computed' ? { value: v } : {}),
    };
  });
  return { repo, since, until, days: `local (${timeZone()})`, sessions: sel.sessions.length, metrics };
}

const LANE_H = 3600e3;
export const ATTENTION_STALE_MS = 72 * LANE_H;
export const MEDIAN_DAYS = 30;
export const MEDIAN_MIN_N = 5;
export const LANE_CLOSURE = 'A waiting lane closes when a commit names its Prompt-ID after the lane ended. '
  + 'The prompt\'s Status: line and later lanes naming it in Depends: or Corregge: are not read.';

const LANES = `
SELECT l.*,
  EXISTS (SELECT 1 FROM commits c WHERE c.unit = l.id AND l.end_ms IS NOT NULL AND c.commit_time * 1000 > l.end_ms) AS closed,
  (SELECT SUM(c.input + c.cache_read + c.cache_creation) FROM calls c JOIN sessions s ON s.id = c.session_id
    WHERE s.unit = l.id AND c.sidechain = 0) AS tokens_in,
  (SELECT MAX(c.context) FROM calls c JOIN sessions s ON s.id = c.session_id WHERE s.unit = l.id AND c.sidechain = 0) AS context_peak
FROM lanes l
WHERE (? IS NULL OR l.repo_key = ?)
ORDER BY l.started_ms DESC, l.id DESC`;

const median = (xs) => {
  const v = [...xs].sort((a, b) => a - b);
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

/**
 * The Lanes page for a selection: one of four states, in order: off (harness.laneRun of the selected repository),
 * no-root (no lane folder on this machine), empty (no lane of the selection), ok. Only ok carries the tiles, the
 * attention lists, the running cards, the last 24 hours, the lists by state, the lanes that reported unattended
 * decisions, and the median work per kind (done lanes of the last 30 days, at least five, else absent).
 * settingsFor(repo).value(key) reads the settings; updatedMs is the time of the latest lane collection.
 */
export function lanesApi(db, { repo = null, now = Date.now(), laneRoot, settingsFor, updatedMs = null } = {}) {
  const head = { repo, updatedMs, closure: LANE_CLOSURE };
  if (repo && settingsFor(repo).value('harness.laneRun') === 'off') return { ...head, state: 'off', reason: 'Lanes are turned off for this repository (harness.laneRun)' };
  if (!laneRoot || !existsSync(laneRoot)) return { ...head, state: 'no-root', reason: `No lane-run folder on this machine (${laneRoot})` };
  const rows = db.prepare(LANES).all(repo, repo);
  if (!rows.length) return { ...head, state: 'empty', reason: repo ? 'No lane-run lanes for this repository' : 'No lane-run lanes on this machine' };

  const limit = (r) => settingsFor(r.repo_key).value('limits.laneMinutes') * 60e3;
  const medians = {};
  const byKind = {};
  for (const r of rows) {
    if (r.kind && r.last_outcome === 'done' && !r.live && r.work_ms !== null && r.started_ms >= now - MEDIAN_DAYS * 24 * LANE_H) (byKind[r.kind] ??= []).push(r.work_ms);
  }
  for (const [k, xs] of Object.entries(byKind)) if (xs.length >= MEDIAN_MIN_N) medians[k] = { ms: median(xs), n: xs.length };

  const card = (r) => ({
    id: r.id, kind: r.kind ?? null, title: r.title ?? null, tier: r.tier ?? null, front: r.front ?? null, chat: r.chat ?? null,
    direct: r.kind === 'merge' && r.session_id === null, critical: r.critical === 1, live: r.live === 1,
    started: r.started_ms, end: r.end_ms, workMs: r.work_ms ?? null, spanMs: r.end_ms !== null && r.started_ms !== null ? r.end_ms - r.started_ms : null,
    medianMs: r.kind ? medians[r.kind]?.ms ?? null : null, overLimit: r.live === 1 && r.started_ms !== null && now - r.started_ms > limit(r),
    tokensIn: r.tokens_in ?? null, contextPeak: r.context_peak ?? null, cost: r.cost_usd ?? null,
    outcome: r.outcome, lastOutcome: r.last_outcome ?? null, resolved: r.resolved === 1, adoptions: r.adoptions ?? null,
    worktree: r.worktree ?? null, mergeState: r.merge_state ?? null, closed: r.closed === 1,
  });
  const cards = rows.map(card);
  const recent = (c) => c.started !== null && c.started >= now - 24 * LANE_H;
  // Open: exited on a question, hard-stop or blocked turn, not resolved, not closed by a later commit.
  const open = (c, outcomes) => !c.live && outcomes.includes(c.lastOutcome) && !c.resolved && !c.closed;
  const fresh = (c) => c.end !== null && now - c.end <= ATTENTION_STALE_MS;
  const waitingAll = cards.filter((c) => open(c, ['question', 'hard-stop']));
  const blockedAll = cards.filter((c) => open(c, ['blocked']));
  const waiting = waitingAll.filter(fresh);
  const blocked = [...cards.filter((c) => c.overLimit), ...blockedAll.filter(fresh)];
  const running = cards.filter((c) => c.live);
  const done = cards.filter((c) => !c.live && c.lastOutcome === 'done' && recent(c));
  const resolved = cards.filter((c) => !c.live && c.lastOutcome === 'blocked' && c.resolved && recent(c));
  const listed = new Set([...running, ...waiting, ...blocked, ...done, ...resolved].map((c) => c.id));
  const last24 = cards.filter((c) => !c.live && recent(c));

  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  const spendToday = db.prepare(`SELECT COALESCE(SUM(s.usd), 0) AS usd FROM lane_spend s JOIN lanes l ON l.id = s.lane_id
    WHERE s.at_ms >= ? AND s.at_ms <= ? AND (? IS NULL OR l.repo_key = ?)`).get(day.getTime(), now, repo, repo).usd;

  const idsOf = (xs) => xs.map((c) => c.id);
  return {
    ...head, state: 'ok', reason: null,
    tiles: { running: running.length, waiting: waiting.length, blocked: blocked.length, done24: done.length, resolved24: resolved.length, spendToday },
    attention: { waiting, blocked, staleCount: waitingAll.length + blockedAll.length - waiting.length - blockedAll.filter(fresh).length },
    running,
    last24,
    byState: {
      running: idsOf(running), waiting: idsOf(waiting), blocked: idsOf(blocked), done: idsOf(done), resolved: idsOf(resolved),
      other: idsOf(last24.filter((c) => !listed.has(c.id))),
    },
    adoptions: cards.filter((c) => c.adoptions > 0).sort((a, b) => (b.end ?? 0) - (a.end ?? 0))
      .map((c) => ({ id: c.id, front: c.front, chat: c.chat, end: c.end, count: c.adoptions, lastOutcome: c.lastOutcome })),
    medianByKind: medians,
  };
}

export function healthApi(db, { store, lastScan }) {
  const n = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
  return {
    store, schema: db.prepare('PRAGMA user_version').get().user_version, schemaExpected: SCHEMA_VERSION,
    days: `local (${timeZone()})`, lastScan,
    counts: { transcripts: n('ingest'), sessions: n('sessions'), calls: n('calls'), repos: n('repos'), commits: n('commits') },
  };
}
