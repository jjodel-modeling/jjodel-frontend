// Layer 2 (identity) metrics: they need a unit id on commits (trailer `Unit: <id>` or subject suffix
// `(P-...)`) or on sessions (sessions.unit, from the first user message or a reachable commit). Each returns
// 'not-adopted' while its selection has no such id.
import { dayOf } from './days.mjs';

export const repoKeys = (sel) => (sel.repo ? [sel.repo] : [...new Set(sel.sessions.map((s) => s.repo).filter(Boolean))]);

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round2 = (x) => Math.round(x * 100) / 100;
const inRange = (day, sel) => !(sel.since && day < sel.since) && !(sel.until && day > sel.until);

/** Commits carrying a unit id in the selection's repositories, by the day of their commit time. */
function unitCommitRows(sel) {
  const q = sel.db.prepare('SELECT unit, commit_time FROM commits WHERE repo_key = ? AND unit IS NOT NULL');
  return repoKeys(sel).flatMap((k) => q.all(k)).filter((c) => inRange(dayOf(c.commit_time * 1000, { utc: sel.utc }), sel));
}

const anyUnitCommit = (sel) => {
  const q = sel.db.prepare('SELECT 1 FROM commits WHERE repo_key = ? AND unit IS NOT NULL LIMIT 1');
  return repoKeys(sel).some((k) => q.get(k) !== undefined);
};
const unitSessions = (sel) => sel.sessions.filter((s) => s.unit);

function commitsPerUnit(sel) {
  if (!anyUnitCommit(sel)) return 'not-adopted';
  const by = new Map();
  for (const c of unitCommitRows(sel)) by.set(c.unit, (by.get(c.unit) ?? 0) + 1);
  const n = [...by.values()];
  return { units: by.size, commits: n.reduce((a, b) => a + b, 0), median: median(n), max: n.length ? Math.max(...n) : null };
}

function groupSessions(sel) {
  const by = new Map();
  for (const s of unitSessions(sel)) {
    if (!by.has(s.unit)) by.set(s.unit, []);
    by.get(s.unit).push(s);
  }
  return by;
}

function costPerUnit(sel) {
  const ss = unitSessions(sel);
  if (!ss.length) return 'not-adopted';
  const rows = [...groupSessions(sel)].map(([unit, list]) => {
    const known = list.filter((s) => s.cost !== null);
    const tokens = list.reduce((a, s) => a + s.calls.reduce((b, c) => b + c.input + c.output + c.cache_read + c.cache_creation, 0), 0);
    return { unit, sessions: list.length, usd: round2(known.reduce((a, s) => a + s.cost, 0)), unknown: list.length - known.length, tokens };
  });
  const usd = rows.map((r) => r.usd);
  const source = { prompt: 0, commit: 0 };
  for (const s of ss) source[s.unitSource === 'prompt' ? 'prompt' : 'commit']++;
  return {
    units: rows.length, sessions: ss.length, sessionsWithoutUnit: sel.sessions.length - ss.length, source,
    usd: round2(usd.reduce((a, b) => a + b, 0)), median: median(usd), max: usd.length ? Math.max(...usd) : null,
    unknown: rows.reduce((a, r) => a + r.unknown, 0),
    top: rows.sort((a, b) => b.usd - a.usd || (a.unit < b.unit ? -1 : 1)).slice(0, 10),
  };
}

function resumesPerUnit(sel) {
  if (!unitSessions(sel).length) return 'not-adopted';
  const r = [...groupSessions(sel).values()].map((l) => l.length - 1);
  const histogram = { 0: 0, 1: 0, '2+': 0 };
  for (const x of r) histogram[x >= 2 ? '2+' : x]++;
  return { units: r.length, resumes: r.reduce((a, b) => a + b, 0), median: median(r), max: r.length ? Math.max(...r) : null, histogram };
}

export const LAYER2 = [
  { name: 'commits_per_unit', layer: 2, definition: 'commits per unit of work, by the day of the commit', enabledBy: 'commits.unit (trailer Unit: <id> or subject suffix (P-...))', params: {}, compute: commitsPerUnit },
  { name: 'cost_per_unit', layer: 2, definition: 'known cost and tokens per unit of work, its sessions and resumes together', enabledBy: 'sessions.unit (a session-unit link)', params: {}, compute: costPerUnit },
  { name: 'resumes_per_unit', layer: 2, definition: 'sessions per unit of work minus one', enabledBy: 'sessions.unit (a session-unit link)', params: {}, compute: resumesPerUnit },
];
