// Layer 3 (self-assessment) metrics: they read log_entries (a repository's .tack/log.jsonl or an import)
// and, for first_shot and outcome, the lanes of the lane-run adapter. Each returns 'not-adopted' while its
// selection has neither.
import { repoKeys } from './layer2.mjs';

const base = (unit) => (/^P-\d{4}-\d{2}-\d{2}-\d{4}/.exec(unit ?? '') || [])[0] ?? null;
const inRange = (day, sel) => !(sel.since && day < sel.since) && !(sel.until && day > sel.until);
const share = (a, n) => (n ? a / n : null);

/** The selection's log entries: its repositories (every repository when none is selected), by entry date. */
export function logEntriesOf(sel) {
  const rows = sel.repo
    ? sel.db.prepare('SELECT * FROM log_entries WHERE repo_key = ? ORDER BY repo_key, source, line').all(sel.repo)
    : sel.db.prepare('SELECT * FROM log_entries ORDER BY repo_key, source, line').all();
  return rows.filter((e) => inRange(e.date, sel));
}

/** The selection's lanes: its repository (every lane when none is selected), by the day of the lane id. */
export function lanesOf(sel) {
  const rows = sel.repo
    ? sel.db.prepare('SELECT * FROM lanes WHERE repo_key = ? ORDER BY id').all(sel.repo)
    : sel.db.prepare('SELECT * FROM lanes ORDER BY id').all();
  return rows.filter((l) => inRange(l.id.slice(2, 12), sel));
}

/**
 * The lane board's first-shot rule (frontend/scripts/lane-board/lane-board.mjs:1363 and :1397-1399, insightLane):
 * a lane is first-shot when it ends `done` or `hard-stop`, carries no rework signal (a corrective resume
 * input, a log entry of another unit correcting it, its own entry correcting it, a commit of its unit
 * reverted), and had no failed run (a blocked run, a run above 90 minutes, a final blocked, none or
 * unparsed); null while it runs. Corrections are read from every log entry of the lane's repository (all
 * dates), reverts from every commit of it.
 */
export function laneFirstShot(db, lanes) {
  const entriesQ = db.prepare('SELECT unit, corrects FROM log_entries WHERE repo_key IS ? AND corrects IS NOT NULL');
  const allQ = db.prepare('SELECT unit, corrects FROM log_entries WHERE corrects IS NOT NULL');
  // The board reads `git log --no-merges`: neither a merge nor a revert that is a merge counts.
  const revertedQ = db.prepare(`SELECT c.sha FROM commits c WHERE c.repo_key = ? AND c.parents < 2 AND (c.unit = ? OR c.unit LIKE ? || '-%')
    AND EXISTS (SELECT 1 FROM commits r WHERE r.repo_key = c.repo_key AND r.parents < 2 AND r.reverts = c.sha)`);
  const corrOf = new Map();
  const corrections = (repo) => {
    if (!corrOf.has(repo)) {
      const m = new Map();
      for (const e of repo ? entriesQ.all(repo) : allQ.all()) {
        if (!m.has(e.corrects)) m.set(e.corrects, []);
        m.get(e.corrects).push(base(e.unit));
      }
      corrOf.set(repo, m);
    }
    return corrOf.get(repo);
  };
  return lanes.map((l) => {
    const by = corrections(l.repo_key).get(l.id) ?? [];
    const signals = {
      corrective: l.corrective === 1,
      correctedBy: [...new Set(by.filter((u) => u !== l.id))],
      selfCorrected: by.includes(l.id),
      reverted: l.repo_key ? revertedQ.all(l.repo_key, l.id, l.id).length : 0,
      blockedRun: l.blocked_run === 1,
      overTime: l.over_time === 1,
    };
    const final = l.live ? 'running' : l.outcome || 'none';
    const rework = signals.corrective || signals.correctedBy.length > 0 || signals.selfCorrected || signals.reverted > 0;
    const failedRun = signals.blockedRun || signals.overTime || ['blocked', 'none', 'unparsed'].includes(final);
    return { id: l.id, final, rework, failedRun, signals, firstShot: l.live ? null : ['done', 'hard-stop'].includes(final) && !rework && !failedRun };
  });
}

const tasks = (sel) => logEntriesOf(sel).filter((e) => e.type === 'task');
const hasLog = (sel) => logEntriesOf(sel).length > 0;

function outcome(sel) {
  const lanes = lanesOf(sel);
  if (!hasLog(sel) && !lanes.length) return 'not-adopted';
  const t = tasks(sel);
  const log = { entries: t.length, completed: 0, partial: 0, problems: 0 };
  for (const e of t) if (e.outcome in log) log[e.outcome]++;
  const out = { log };
  if (lanes.length) {
    out.lanes = { lanes: lanes.length, done: 0, 'hard-stop': 0, question: 0, blocked: 0, unparsed: 0, none: 0, running: 0 };
    for (const l of lanes) out.lanes[l.live ? 'running' : l.outcome in out.lanes ? l.outcome : 'none']++;
  }
  return out;
}

function firstShot(sel) {
  const lanes = lanesOf(sel);
  if (lanes.length) {
    const r = laneFirstShot(sel.db, lanes).filter((x) => x.firstShot !== null);
    const yes = r.filter((x) => x.firstShot).length;
    return { rule: 'lanes', n: r.length, firstShot: yes, share: share(yes, r.length), running: lanes.length - r.length,
      rework: r.filter((x) => x.rework).length, failedRun: r.filter((x) => x.failedRun).length };
  }
  if (!hasLog(sel)) return 'not-adopted';
  // Without lanes: a task entry is first-shot when no other entry of its repository corrects its unit.
  const all = sel.repo ? sel.db.prepare('SELECT unit, corrects FROM log_entries WHERE repo_key = ?').all(sel.repo) : sel.db.prepare('SELECT unit, corrects FROM log_entries').all();
  const corrected = new Set(all.filter((e) => e.corrects && base(e.unit) !== e.corrects).map((e) => e.corrects));
  const t = tasks(sel).filter((e) => e.unit && base(e.unit) === e.unit);
  const yes = t.filter((e) => !corrected.has(e.unit)).length;
  return { rule: 'log', n: t.length, firstShot: yes, share: share(yes, t.length) };
}

function causeTally(sel) {
  if (!hasLog(sel)) return 'not-adopted';
  const causes = Object.fromEntries('abcdefg'.split('').map((c) => [c, 0]));
  let total = 0;
  for (const e of tasks(sel)) if (e.cause) { causes[e.cause]++; total++; }
  return { total, causes };
}

function rate(field, yesOf, noOf) {
  return (sel) => {
    if (!hasLog(sel)) return 'not-adopted';
    const r = { yes: 0, no: 0, unknown: 0 };
    for (const e of tasks(sel)) {
      if (yesOf(e[field])) r.yes++;
      else if (noOf(e[field])) r.no++;
      else r.unknown++;
    }
    return { ...r, share: share(r.yes, r.yes + r.no) };
  };
}

export const LAYER3 = [
  { name: 'outcome', layer: 3, definition: 'units by self-assessed outcome; lanes by their final Outcome line', enabledBy: 'log entry outcome (.tack/log.jsonl), lane-run folders', params: {}, compute: outcome },
  { name: 'first_shot', layer: 3, definition: 'lanes ending done or hard-stop with no rework signal and no failed run (without lanes: units no later unit corrects)', enabledBy: 'log entry corrects (.tack/log.jsonl), lane-run folders', params: {}, compute: firstShot },
  { name: 'cause_tally', layer: 3, definition: 'entries by cause letter', enabledBy: 'log entry cause (.tack/log.jsonl)', params: {}, compute: causeTally },
  { name: 'regression_rate', layer: 3, definition: 'task entries reporting a regression, over those answering yes or no', enabledBy: 'log entry regressions (.tack/log.jsonl)', params: {}, compute: rate('regressions', (v) => v === 'yes', (v) => v === 'no') },
  { name: 'out_of_scope_rate', layer: 3, definition: 'task entries reporting out-of-scope changes', enabledBy: 'log entry out_of_scope (.tack/log.jsonl)', params: {}, compute: rate('out_of_scope', (v) => v === 1, (v) => v === 0) },
];
