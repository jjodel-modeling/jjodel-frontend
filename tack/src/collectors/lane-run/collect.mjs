// lane-run adapter: the lane folders `lane-run` writes (default ~/.jjodel-lanes/<Prompt-ID>/, or TACK_LANES)
// -> lanes and lane_spend. Optional: enabled only when the folder exists. Read-only: nothing is written
// in a lane folder. Files read (discovery 2026-10-19 §2.4): started.txt, exit.txt (its mtime is the end),
// pid.txt, tier.txt, session.txt, worktree.txt (resolved to a repository in memory, the path is not kept),
// runs.jsonl (counted), input-<k>.md and msg-<k>.md (classed in memory, the text is not kept) and the
// `result` and assistant `Outcome:` lines of log.jsonl. Only ids, enums, counts, times and costs are stored.
//
// The turn and cost rules restate those of Jjodel's lane board (frontend/scripts/lane-board/lane-board.mjs:
// laneTimeline :926, results :815, costEvents :761, spendByDay :785, logFacts :855, inputClass :895), so that
// `tack parity jjodel` can hold Tack to them.
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, sep } from 'node:path';

export const LANE_ID = /^P-\d{4}-\d{2}-\d{2}-\d{4}$/;

export const LANE_COLUMN_SOURCES = {
  lanes: {
    id: 'folder name', repo_key: 'worktree.txt resolved against repos.toplevels, else session_repo of session.txt',
    session_id: 'session.txt', started_ms: 'started.txt', end_ms: 'exit.txt mtime', live: 'exit.txt absent and pid.txt alive',
    tier: 'tier.txt first word', runs: 'runs.jsonl line count', outcome: 'last assistant Outcome: line of log.jsonl (enum)',
    blocked_run: 'result event Outcome blocked (boolean)', over_time: 'result event duration_ms above 90 min (boolean)',
    corrective: 'resume input class (boolean)', cost_usd: 'max result total_cost_usd', cache_key: 'file sizes and mtimes',
  },
  lane_spend: {
    lane_id: 'folder name', seq: 'cost event order', at_ms: 'end of the turn the event closes', usd: 'result total_cost_usd delta',
  },
};

export const defaultLaneRoot = () => process.env.TACK_LANES || join(homedir(), '.jjodel-lanes');

const readTrim = (p) => {
  try { return readFileSync(p, 'utf8').trim(); } catch { return ''; }
};
const mtime = (p) => { try { return statSync(p).mtimeMs; } catch { return 0; } };
const size = (p) => { try { return statSync(p).size; } catch { return -1; } };
const alive = (pid) => { if (!pid) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };

/** Calls fn with every line of buf that contains key, once per line. */
function eachLine(buf, key, fn) {
  const k = Buffer.from(key);
  let at = buf.indexOf(k);
  while (at !== -1) {
    const s0 = buf.lastIndexOf(10, at) + 1;
    let s1 = buf.indexOf(10, at);
    if (s1 === -1) s1 = buf.length;
    fn(buf.subarray(s0, s1));
    at = buf.indexOf(k, s1);
  }
}

const ASSISTANT = Buffer.from('{"type":"assistant"');
// A result event that closes no turn: a task notification, or an empty result of zero turns.
const notTurn = (e) => (e.origin && e.origin.kind === 'task-notification') || (e.num_turns === 0 && !e.result);

/** The result events of a log that close a turn: duration and the last Outcome word of the result. */
export function results(buf) {
  const out = [];
  if (!buf) return out;
  eachLine(buf, '"type":"result"', (raw) => {
    const e = parse(raw.toString('utf8'));
    if (!e || e.type !== 'result' || notTurn(e)) return;
    const m = [...String(e.result || '').matchAll(/Outcome:\s*`?([a-z][a-z-]*)/gi)];
    out.push({ ms: Number(e.duration_ms) || 0, outcome: m.length ? m[m.length - 1][1].toLowerCase() : '' });
  });
  return out;
}

/** The cost events of a log: { usd, turn } per result event carrying total_cost_usd; a non-turn event takes the preceding turn. */
export function costEvents(buf) {
  const out = { events: [], max: null };
  if (!buf) return out;
  let seen = 0;
  eachLine(buf, '"type":"result"', (raw) => {
    const e = parse(raw.toString('utf8'));
    if (!e || e.type !== 'result') return;
    const nt = notTurn(e);
    const turn = nt ? Math.max(0, seen - 1) : seen;
    if (!nt) seen++;
    if (typeof e.total_cost_usd !== 'number') return;
    out.events.push({ usd: e.total_cost_usd, turn });
    out.max = out.max === null ? e.total_cost_usd : Math.max(out.max, e.total_cost_usd);
  });
  return out;
}

/** The lane's outcome: the last assistant text line starting with Outcome:, as one of four words, unparsed, or none. */
export function laneOutcome(buf) {
  let last = null;
  if (buf) {
    eachLine(buf, 'Outcome:', (raw) => {
      if (!raw.subarray(0, ASSISTANT.length).equals(ASSISTANT)) return;
      const e = parse(raw.toString('utf8'));
      const content = e && e.message && Array.isArray(e.message.content) ? e.message.content : [];
      for (const b of content) {
        if (!b || b.type !== 'text' || typeof b.text !== 'string') continue;
        for (const line of b.text.split('\n')) if (line.trim().startsWith('Outcome:')) last = line.trim();
      }
    });
  }
  return last === null ? 'none' : (/^Outcome:\s*(done|hard-stop|question|blocked)\b/.exec(last) || [])[1] || 'unparsed';
}

/** The class of a resume input from its first line (and a body rule for a fix request); the board's inputClass, verbatim. */
export function inputClass(text) {
  const t = text.replace(/^\[P-[^\]]*\]\s*/, '');
  const l = t.split('\n').map((x) => x.trim()).find(Boolean) || '';
  const body = t.split(/\n---\s*\n/)[0].slice(0, 1200);
  if (/^(The Mac (went to sleep|lost)|Your (last turn|session) ended|The (previous resume|session) ended|The chat stopped this session)/i.test(l)) return 'recovery';
  if (/^(Rework|Chat check: one fix|Corrections?\b|Two corrections|Fix\b|Redo|Not yet|Failed|The visual check failed)|with one fix before the GO|fails?\b.*before the merge/i.test(l)) return 'corrective';
  if (!/Phase 2/i.test(l) && /\b(one|two|three|\d) (precise )?fix(es)?\b|\bfix(es)? before the GO\b/i.test(body)) return 'corrective';
  if (/^ACK\b/.test(l)) return 'ack';
  if (/^(Answers?\b|Q\d|Recommended answer|Recommendation adopted|Chat decision|.*adopted as recommended|.*ratified as recommended)/i.test(l)) return 'answer';
  if (/^(Visual )?GO\b|^GO[.,:]|Visual GO|Phase 2 GO|^Visual check by the chat/i.test(l)) return 'go';
  if (/^\/status-flip/.test(l)) return 'closure';
  return 'other';
}

const numbered = (names, re) => names.map((n) => re.exec(n)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);

/** The cache key of a lane folder: every file read, by size and mtime. */
export function laneKey(dir, names) {
  const files = ['log.jsonl', 'exit.txt', 'started.txt', 'pid.txt', 'tier.txt', 'session.txt', 'worktree.txt', 'runs.jsonl',
    ...names.filter((n) => /^(input|msg)-\d+\.md$/.test(n)).sort()];
  return files.map((f) => `${f}:${size(join(dir, f))}:${mtime(join(dir, f))}`).join('|');
}

/**
 * What one lane folder says, in memory: times, facts and the spend events ({ seq, at, usd }). now is the end
 * of a lane that has not exited. Text read here (inputs, messages, assistant lines) is classed and dropped.
 */
export function readLane(dir, now = Date.now()) {
  const names = readdirSync(dir);
  const exitP = join(dir, 'exit.txt');
  const exited = existsSync(exitP);
  const inputs = numbered(names, /^input-(\d+)\.md$/);
  let buf = null;
  try { buf = readFileSync(join(dir, 'log.jsonl')); } catch { /* no log yet */ }
  const res = results(buf);
  const end = exited ? mtime(exitP) : now;
  const started = Number(readTrim(join(dir, 'started.txt'))) || null;
  // Turns: one per input-k.md (its mtime the start, its result's duration or the next input the end), else one
  // turn from started.txt to exit.txt.
  const turns = [];
  if (!inputs.length) {
    turns.push({ s: started || end, e: end, c: '' });
  } else {
    const starts = inputs.map((k) => mtime(join(dir, `input-${k}.md`)));
    starts.forEach((st, i) => {
      const last = i === starts.length - 1;
      let e;
      if (res[i] && res[i].ms) e = st + res[i].ms;
      else e = last ? end : starts[i + 1];
      if (!last) e = Math.min(e, starts[i + 1]);
      if (last && !exited) e = now;
      turns.push({ s: st, e: Math.max(e, st), c: i ? inputClass(readTrim(join(dir, `input-${inputs[i]}.md`)).slice(0, 1500)) : '' });
    });
  }
  const msgs = numbered(names, /^msg-(\d+)\.md$/);
  const classes = inputs.length > 1 ? turns.slice(1).map((t) => t.c) : msgs.map((k) => inputClass(readTrim(join(dir, `msg-${k}.md`)).slice(0, 1500)));
  const co = costEvents(buf);
  const spend = [];
  let prev = 0;
  co.events.forEach((ev, seq) => {
    const usd = ev.usd >= prev ? ev.usd - prev : ev.usd;
    prev = ev.usd;
    if (!usd) return;
    spend.push({ seq, at: Math.round(turns[Math.min(ev.turn, turns.length - 1)].e), usd });
  });
  const pid = Number(readTrim(join(dir, 'pid.txt')));
  return {
    names,
    started,
    end: exited ? Math.round(end) : null,
    live: !exited && alive(pid),
    tier: (/^(heavy|light)\b/.exec(readTrim(join(dir, 'tier.txt'))) || [])[1] || null,
    session: readTrim(join(dir, 'session.txt')) || null,
    worktree: readTrim(join(dir, 'worktree.txt')) || null,
    runs: readTrim(join(dir, 'runs.jsonl')).split('\n').filter((l) => l.trim()).length,
    outcome: laneOutcome(buf),
    blockedRun: res.some((r) => r.outcome === 'blocked'),
    overTime: res.some((r) => r.ms > 90 * 60e3),
    corrective: classes.includes('corrective'),
    cost: co.max,
    spend,
  };
}

/** The repository of a worktree path: the one whose recorded toplevels hold it, when exactly one does. */
function repoOfPath(repos, p) {
  if (!p) return null;
  let rp = p;
  try { rp = realpathSync(p); } catch { /* a deleted worktree: matched by its recorded path */ }
  const hit = repos.filter((r) => r.toplevels.some((t) => rp === t || rp.startsWith(t + sep) || p === t || p.startsWith(t + sep)));
  return hit.length === 1 ? hit[0].key : null;
}

/** Reads every lane folder under root into db; a folder whose files did not change and that has exited is skipped. */
export function collectLanes(db, root = defaultLaneRoot(), now = Date.now()) {
  const st = { enabled: false, lanes: 0, read: 0, unchanged: 0, errors: 0, spendRows: 0 };
  if (!existsSync(root)) return st;
  st.enabled = true;
  const repos = db.prepare('SELECT key, toplevels FROM repos').all().map((r) => ({ key: r.key, toplevels: JSON.parse(r.toplevels) }));
  const sessionRepo = db.prepare('SELECT repo_key FROM session_repo WHERE session_id = ?');
  const getKey = db.prepare('SELECT cache_key, live, end_ms FROM lanes WHERE id = ?');
  const put = db.prepare(`INSERT OR REPLACE INTO lanes (id, repo_key, session_id, started_ms, end_ms, live, tier, runs, outcome,
    blocked_run, over_time, corrective, cost_usd, cache_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const delSpend = db.prepare('DELETE FROM lane_spend WHERE lane_id = ?');
  const addSpend = db.prepare('INSERT INTO lane_spend (lane_id, seq, at_ms, usd) VALUES (?, ?, ?, ?)');
  db.exec('BEGIN');
  try {
    for (const id of readdirSync(root).filter((n) => LANE_ID.test(n)).sort()) {
      const dir = join(root, id);
      try { if (!statSync(dir).isDirectory()) continue; } catch { continue; }
      st.lanes++;
      let names;
      try { names = readdirSync(dir); } catch { st.errors++; continue; }
      const key = laneKey(dir, names);
      const ex = getKey.get(id);
      if (ex && ex.cache_key === key && ex.end_ms !== null && !ex.live) {
        st.unchanged++;
        continue;
      }
      let l;
      try { l = readLane(dir, now); } catch { st.errors++; continue; }
      const repo = repoOfPath(repos, l.worktree) ?? (l.session ? sessionRepo.get(l.session)?.repo_key ?? null : null);
      put.run(id, repo, l.session, l.started, l.end, l.live ? 1 : 0, l.tier, l.runs, l.outcome, l.blockedRun ? 1 : 0,
        l.overTime ? 1 : 0, l.corrective ? 1 : 0, l.cost, key);
      delSpend.run(id);
      for (const s of l.spend) addSpend.run(id, s.seq, s.at, s.usd);
      st.spendRows += l.spend.length;
      st.read++;
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return st;
}
