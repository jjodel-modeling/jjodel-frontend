// `tack parity jjodel`: holds Tack to Jjodel's lane board on the same machine. The board's rules run from a
// copy kept with the tests (test/helpers/board-parity.mjs, copied, not imported from Jjodel) over the lane
// folders and the trunk's log; Tack's numbers come from its store after the lane-run adapter, the log import
// and the log collector have run. Compared: spend per local day over the last N days (lanes of the
// repository only, within 1%) and first-shot lane by lane (no difference allowed).
import { collectLanes } from '../collectors/lane-run/collect.mjs';
import { collectLogs } from '../collectors/log/collect.mjs';
import { importJjodelLog, repoKeyOf } from '../importers/jjodel-log.mjs';
import { laneFirstShot } from '../metrics/layer3.mjs';
import { dayBounds, dayOf } from '../metrics/days.mjs';
import { boardNumbers } from '../../test/helpers/board-parity.mjs';

export const TOLERANCE = 0.01;

/** The last n local days ending on the day of now, oldest first. */
export function lastDays(now, n) {
  const out = [dayOf(now)];
  while (out.length < n) out.unshift(dayOf(dayBounds(out[0])[0] - 1));
  return out;
}

const SIGNALS = ['corrective', 'correctedBy', 'selfCorrected', 'reverted', 'blockedRun', 'overTime'];
const truthy = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === 'number' ? v > 0 : !!v);

/** Why a lane's first-shot differs: the final outcome or the signals on which the two sides disagree. */
function causeOf(b, t) {
  const out = [];
  if (b.final !== t.final) out.push(`final ${b.final} vs ${t.final}`);
  for (const s of SIGNALS) if (truthy(b.signals[s]) !== truthy(t.signals[s])) out.push(`${s} ${JSON.stringify(b.signals[s])} vs ${JSON.stringify(t.signals[s])}`);
  return out.join('; ') || 'unexplained';
}

export function parityJjodel(db, { root, repo, trunk, days = 14, now = Date.now(), imports } = {}) {
  const key = repoKeyOf(repo);
  if (!key) return { error: `no repository at ${repo}` };
  const imp = importJjodelLog({ repo, trunk, ...(imports ? { out: `${imports}/${key}/log.jsonl` } : {}) });
  if (imp.error) return { error: imp.error };
  const lanes = collectLanes(db, root, now);
  if (!lanes.enabled) return { error: `no lane folder at ${root}` };
  collectLogs(db, imports ? { imports } : {});
  const window = lastDays(now, days);
  const board = boardNumbers({ root, repo, trunk, now });

  const tack = {};
  const outside = {};
  for (const r of db.prepare('SELECT l.repo_key, s.lane_id, s.at_ms, s.usd FROM lane_spend s JOIN lanes l ON l.id = s.lane_id').all()) {
    const d = dayOf(r.at_ms);
    if (r.repo_key === key) tack[d] = (tack[d] ?? 0) + r.usd;
    else outside[d] = [...new Set([...(outside[d] ?? []), r.lane_id])];
  }
  const spend = window.map((day) => {
    const b = board.spend[day] ?? 0;
    const t = tack[day] ?? 0;
    const diff = t - b;
    const rel = b ? diff / b : t ? Infinity : 0;
    const ok = Math.abs(rel) <= TOLERANCE;
    return { day, board: b, tack: t, diff, rel, ok, ...(ok ? {} : { cause: outside[day] ? `lanes not linked to the repository: ${outside[day].join(', ')}` : 'unexplained' }) };
  });
  const tb = spend.reduce((a, r) => a + r.board, 0);
  const tt = spend.reduce((a, r) => a + r.tack, 0);
  const total = { board: tb, tack: tt, diff: tt - tb, rel: tb ? (tt - tb) / tb : 0, ok: Math.abs(tb ? (tt - tb) / tb : tt) <= TOLERANCE };

  const inWin = (id) => window.includes(id.slice(2, 12));
  const tackLanes = new Map(laneFirstShot(db, db.prepare('SELECT * FROM lanes ORDER BY id').all().filter((l) => inWin(l.id))).map((x) => [x.id, x]));
  const firstShot = [];
  for (const b of board.lanes.filter((l) => inWin(l.id))) {
    const t = tackLanes.get(b.id);
    if (!t) { firstShot.push({ id: b.id, board: b.firstShot, tack: undefined, cause: 'lane missing from the store' }); continue; }
    if (t.firstShot !== b.firstShot) firstShot.push({ id: b.id, board: b.firstShot, tack: t.firstShot, cause: causeOf(b, t) });
  }
  const count = (xs) => ({ lanes: xs.length, firstShot: xs.filter((x) => x.firstShot === true).length, running: xs.filter((x) => x.firstShot === null).length });
  const boardWin = board.lanes.filter((l) => inWin(l.id));
  const ok = spend.every((r) => r.ok) && total.ok && firstShot.length === 0;
  return {
    ok, repo: key, days: window, tolerance: TOLERANCE, spend, total,
    firstShot: { board: count(boardWin), tack: count([...tackLanes.values()]), mismatches: firstShot },
    import: { read: imp.read, converted: imp.converted, rejected: imp.rejected },
  };
}
