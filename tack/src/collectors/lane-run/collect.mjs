// lane-run adapter (behind the trace-source boundary in source.mjs): the lane folders `lane-run` writes (default ~/.jjodel-lanes/<Prompt-ID>/, or TACK_LANES)
// -> lanes and lane_spend. Optional: enabled only when the folder exists. Read-only: nothing is written
// in a lane folder. Files read (discovery 2026-10-19 §2.4): started.txt, exit.txt (its mtime is the end),
// pid.txt, tier.txt, session.txt, worktree.txt (resolved to a repository in memory, the path is not kept),
// runs.jsonl (counted), input-<k>.md and msg-<k>.md (classed in memory, the text is not kept) and the
// `result` and assistant `Outcome:` lines of log.jsonl. Only ids, enums, counts, times and costs are stored.
// Schema 5 adds: the outcome of the last turn, the log's mtime, the critical-zone flag (tier.txt reason or
// goahead.txt), the Front: and Chat: header lines of the prompt file prompt.txt names (read in memory, the path
// and the text are not kept), and the state of a direct merge from result.json (ok, merge sha, gates).
// Schema 7 adds: the first word of the Status: header line of the prompt file as the repository's HEAD holds it
// (refreshPromptStatus; the path is re-read from prompt.txt and not kept).
// Schema 6 adds: the kind and the title line of the same header, the work time (the sum of the turns), the
// worktree path, resolved.txt, and the item count of the closing message's «Decisions taken (unattended)».
//
// The turn and cost rules restate those of Jjodel's lane board (frontend/scripts/lane-board/lane-board.mjs:
// laneTimeline :926, results :815, costEvents :761, spendByDay :785, logFacts :855, inputClass :895), so that
// `tack parity jjodel` can hold Tack to them.
import { git } from '../git/run.mjs';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, relative, sep } from 'node:path';

export const LANE_ID = /^P-\d{4}-\d{2}-\d{2}-\d{4}$/;

export const LANE_COLUMN_SOURCES = {
  lanes: {
    id: 'folder name', repo_key: 'worktree.txt resolved against repos.toplevels, else session_repo of session.txt',
    session_id: 'session.txt', started_ms: 'started.txt', end_ms: 'exit.txt mtime', live: 'exit.txt absent and pid.txt alive',
    tier: 'tier.txt first word', runs: 'runs.jsonl line count', outcome: 'last assistant Outcome: line of log.jsonl (enum)',
    blocked_run: 'result event Outcome blocked (boolean)', over_time: 'result event duration_ms above the lane time limit, tack.json limits.laneMinutes, default 90 (boolean)',
    corrective: 'resume input class (boolean)', cost_usd: 'max result total_cost_usd', cache_key: 'file sizes and mtimes',
    turns: 'turn-closing result events (count)', last_outcome: 'Outcome word of the last turn-closing result event (enum)',
    log_mtime_ms: 'log.jsonl mtime', critical: 'tier.txt reason or goahead.txt (boolean)',
    front: 'Front: header line of the file prompt.txt names (a front name)', chat: 'Chat: header line of the same file (a C- id)',
    merge_state: 'result.json ok, merge and gates (enum)', gates_red: 'result.json gates not ok (count)',
    kind: 'Lane: header line of the same file, or its file name (enum)', title: 'first # line of the same header (capped)',
    work_ms: 'sum of the turns (input mtime to result duration)', worktree: 'worktree.txt', resolved: 'resolved.txt exists (boolean)',
    adoptions: 'Decisions taken (unattended) items of the last result event (count)',
    stop_kind: 'breakpoint | ceiling | hard-stop for a last turn that ended Outcome: hard-stop (stopKindOf), else null',
    resumes: 'resume messages (count)', auto_resumes: 'resume messages starting with [auto] after an optional [P-...] bracket (count; no text kept)',
    stop_scanned: 'the version of the stop rules the three columns above were computed under (STOP_RULES; 0 never); set by UPDATE alone',
    prompt_status: 'first word of the Status: header line of the prompt file at the repository HEAD (git show), lowercased',
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

const ADOPTED = /decisions taken \(unattended\)/i;
const ITEM = /^ ?(?:[-*]|\d+[.)])\s+\S/;
const SECTION_END = /^(#{1,6}\s|\*\*[^*]+\*\*:?\s*$|Outcome:)/;

/**
 * The item count of the «Decisions taken (unattended)» section of a closing message (the last one when repeated):
 * its top-level list items up to the next heading, bold line, Outcome: line, or paragraph after the list; 0 for a
 * section without items (none); null without the section. The text is read here and dropped.
 */
export function adoptionsOf(text) {
  if (!text) return null;
  const lines = String(text).split('\n');
  let at = -1;
  lines.forEach((l, i) => { if (ADOPTED.test(l)) at = i; });
  if (at === -1) return null;
  let n = 0;
  for (const l of lines.slice(at + 1)) {
    if (SECTION_END.test(l.trim())) break;
    if (ITEM.test(l)) n++;
    else if (n && l.trim() && !/^\s/.test(l)) break;
  }
  return n;
}

/** The adoptions of the last turn-closing result event of a log (adoptionsOf of its text); null without one. */
export function lastAdoptions(buf) {
  let last = null;
  if (buf) {
    eachLine(buf, '"type":"result"', (raw) => {
      const e = parse(raw.toString('utf8'));
      if (e && e.type === 'result' && !notTurn(e)) last = e;
    });
  }
  return last ? adoptionsOf(last.result) : null;
}

/** The text of the last turn-closing result event of a log; '' without one. Read in memory, never stored. */
export function lastResultText(buf) {
  let last = '';
  if (buf) {
    eachLine(buf, '"type":"result"', (raw) => {
      const e = parse(raw.toString('utf8'));
      if (e && e.type === 'result' && !notTurn(e)) last = String(e.result || '');
    });
  }
  return last;
}

const STOP_LINE = /^[ \t>*_`-]*Stop:[ \t*_`]*(planned|ceiling|unplanned)\b/im;
const CEILING_WORDS = /context[\w\s-]{0,20}ceiling|soft ceiling|\bAM-8\b|hand-?off/i;
const PLANNED_WORDS = /phase 1|visual check|report (is |was )?committed|end of phase|planned (hard[- ]?)?stop|breakpoint/i;
const NO_STOP = /^[\s*_`>-]*none\b/i;
const STOP_HEAD = /^##[ \t]+hard[- ]?stops?\b/im;
// The version of the stop rules: a lane scanned under an older one is scanned again (lanes.stop_scanned holds it).
// 2: a prompt without a HARD STOP section counts as planned when the result names a planned stop (P-2026-10-21-1025).
export const STOP_RULES = 2;

/**
 * The «## HARD STOP» section of a prompt file's text: its body, or null without the section or when it says
 * «None» / «None planned».
 */
export function plannedStopSection(text) {
  const m = /^##[ \t]+hard[- ]?stops?\b[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/im.exec(String(text || ''));
  if (!m) return null;
  const body = m[1].trim();
  return !body || NO_STOP.test(body) ? null : body;
}

/**
 * The kind of a hard-stop turn: breakpoint (the prompt planned it), ceiling (the session hit the context ceiling and
 * left a handoff), hard-stop (anything else). Rules in order: a declared «Stop: planned|ceiling|unplanned» line of the
 * result wins; handoff.md present and the result naming a ceiling or a handoff; the prompt's HARD STOP section names a
 * stop and the lane is a discovery or the result says that stop was reached; a prompt with no HARD STOP section at all
 * (not one that says None) and a result naming a planned stop (phase 1, visual check, report committed); else hard-stop.
 * facts: { result, handoff (boolean), promptText, kind }.
 */
export function stopKindOf({ result = '', handoff = false, promptText = '', kind = null }) {
  const declared = STOP_LINE.exec(result)?.[1].toLowerCase();
  if (declared) return declared === 'planned' ? 'breakpoint' : declared === 'ceiling' ? 'ceiling' : 'hard-stop';
  if (handoff && CEILING_WORDS.test(result)) return 'ceiling';
  const section = plannedStopSection(promptText);
  if (section) {
    const first = section.split('\n').find((l) => l.trim()) || '';
    const own = first.replace(/[*_`#>-]/g, '').trim().toLowerCase().slice(0, 24);
    if (kind === 'discovery' || PLANNED_WORDS.test(result) || (own.length >= 12 && result.toLowerCase().includes(own))) return 'breakpoint';
  } else if (!STOP_HEAD.test(String(promptText || '')) && PLANNED_WORDS.test(result)) return 'breakpoint';
  return 'hard-stop';
}

/** True when a resume message starts, after an optional [P-...] bracket, with [auto]. */
export const isAutoResume = (text) => /^\s*(\[P-[^\]]*\]\s*)?\[auto\]/i.test(String(text || '').slice(0, 300));

const OUTCOMES = ['done', 'hard-stop', 'question', 'blocked'];
/** The outcome of a turn from the Outcome word of its result event: one of four words, unparsed, or none. */
const turnOutcome = (w) => (!w ? 'none' : OUTCOMES.includes(w) ? w : 'unparsed');

// lane-run's tier reasons that put a lane in the critical zone (lane-run.mjs, tierOf: `--critical-zone-goahead`,
// `names <critical file>`).
const CRITICAL_REASON = /(^|: )(names \S|--critical-zone-goahead\b)/;
const FRONT = /^Front:[ \t]*([A-Za-z0-9][A-Za-z0-9_-]{0,40})[ \t]*$/m;
const CHAT = /^Chat:[ \t]*(C-\d{4}-\d{2}-\d{2}-\d{4})\b/m;
const LANE = /^Lane:[ \t]*(.*)$/m;
const TITLE = /^#[ \t]+(.*\S)[ \t]*$/m;

/**
 * The kind of a lane from its prompt's Lane: line and file name: merge, fast, discovery, phase2, else null. The rules
 * of Jjodel's lane board, verbatim (frontend/scripts/lane-board/lane-board.mjs, kindOf :92).
 */
export function kindOf(laneLine, file = '') {
  const l = String(laneLine || '').toLowerCase();
  if (/^merge|^full \((merge|take[- ]trunk|(one|two|three|four|five|six|seven|eight|nine|ten|\d+) merges?)\b/.test(l) || /_prompt_merge_|_take_trunk/.test(file)) return 'merge';
  if (/^fast/.test(l)) return 'fast';
  if (/^discovery|^phase 1 only|^full \(discovery\b/.test(l) || (/^full \(phase 1\b/.test(l) && /read-only/.test(l) && !/two-phase|same session|in cascade|after the chat'?s go/.test(l))) return 'discovery';
  if (/^full|^phase|implementation/.test(l)) return 'phase2';
  return null;
}

/**
 * The prompt text of a lane, in memory: the file prompt.txt names, else input-1.md (the prompt as the session received
 * it; lanes of a deleted worktree, and the oldest lanes without prompt.txt, keep only that); '' when neither reads.
 */
export function promptTextOf(dir) {
  const path = readTrim(join(dir, 'prompt.txt'));
  if (path) { try { return readFileSync(path, 'utf8'); } catch { /* the file is gone: the lane keeps its input */ } }
  return readTrim(join(dir, 'input-1.md'));
}

const NO_HEADER = { front: null, chat: null, kind: null, title: null };

/** Front, chat, kind and title of a prompt file: header lines before the first `## `, read in memory; nulls when unreadable. */
export function promptHeader(path) {
  if (!path) return { ...NO_HEADER };
  let head = '';
  try { head = readFileSync(path, 'utf8').slice(0, 8192); } catch { return { ...NO_HEADER }; }
  const cut = head.search(/^## /m);
  if (cut !== -1) head = head.slice(0, cut);
  return {
    front: FRONT.exec(head)?.[1] ?? null,
    chat: CHAT.exec(head)?.[1] ?? null,
    kind: kindOf(LANE.exec(head)?.[1] ?? '', basename(path)),
    title: TITLE.exec(head)?.[1].slice(0, 200) ?? null,
  };
}

const STATUS = /^Status:[ \t]*([\p{L}\p{N}_]+)/imu;

/** The first word, lowercased, of the Status: header line of a prompt file's text (before its first `## `), or null. */
export function promptStatusOf(text) {
  let head = String(text).slice(0, 8192);
  const cut = head.search(/^## /m);
  if (cut !== -1) head = head.slice(0, cut);
  return STATUS.exec(head)?.[1].toLowerCase().slice(0, 40) ?? null;
}

const REFRESH_EVERY_MS = 60e3;
const REFRESH_DAYS = 7;
const lastRefresh = new WeakMap();
const unreadable = new WeakMap(); // lanes whose prompt could not be read: tried once per process

/**
 * Sets lanes.prompt_status for every exited lane whose status is not yet a closing word, from the prompt file as
 * the repository's HEAD holds it (`git show HEAD:<path>` in the checkout the path of prompt.txt lies in, then in
 * the first common dir; a closing word read from either wins). Runs at most once a minute per store;
 * a lane that ended more than 7 days ago is read once, and one whose prompt cannot be read is not retried.
 */
export function refreshPromptStatus(db, root, now = Date.now(), force = false) {
  if (!force && now - (lastRefresh.get(db) ?? -Infinity) < REFRESH_EVERY_MS) return 0;
  lastRefresh.set(db, now);
  const repos = new Map(db.prepare('SELECT key, common_dirs, toplevels FROM repos').all().map((r) => [r.key, r]));
  const set = db.prepare('UPDATE lanes SET prompt_status = ? WHERE id = ? AND prompt_status IS NOT ?');
  let n = 0;
  const gone = unreadable.get(db) ?? unreadable.set(db, new Set()).get(db);
  const rows = db.prepare(`SELECT id, repo_key FROM lanes WHERE end_ms IS NOT NULL
    AND (prompt_status IS NULL OR prompt_status NOT IN ('eseguito', 'done')) AND (prompt_status IS NULL OR end_ms > ?) ORDER BY id`)
    .all(now - REFRESH_DAYS * 24 * 3600e3);
  for (const l of rows) {
    if (gone.has(l.id)) continue;
    const repo = repos.get(l.repo_key);
    const file = readTrim(join(root, l.id, 'prompt.txt'));
    if (!repo || !file) { gone.add(l.id); continue; }
    const dirs = JSON.parse(repo.common_dirs);
    const tops = JSON.parse(repo.toplevels).filter((t) => file.startsWith(t + sep));
    // The checkout the prompt path lies in (the trunk, for a prompt the chat wrote), then the first common dir.
    const reads = [
      ...tops.map((t) => ({ cwd: t, rel: relative(t, file) })),
      ...dirs.slice(0, 1).map((d) => ({ dir: d, rel: tops.length ? relative(tops[0], file) : join('docs', 'prompts', basename(file)) })),
    ];
    let status = null;
    for (const { cwd, dir, rel } of reads) {
      let r;
      try { r = git(cwd ? ['show', `HEAD:${rel}`] : ['--git-dir', dir, 'show', `HEAD:${rel}`], { cwd }); } catch { continue; } // a deleted checkout
      const w = r.ok ? promptStatusOf(r.out) : null;
      if (w !== null && status === null) status = w;
      if (w === 'eseguito' || w === 'done') { status = w; break; }
    }
    if (status === null) gone.add(l.id);
    n += Number(set.run(status, l.id, status).changes);
  }
  return n;
}

/** The state of a direct merge from result.json: merged (ok with a merge commit), red (a gate not ok), blocked; null without one. */
export function mergeState(path) {
  let r;
  try { r = JSON.parse(readFileSync(path, 'utf8')); } catch { return { state: null, gatesRed: null }; }
  if (!r || typeof r !== 'object') return { state: null, gatesRed: null };
  const gatesRed = Array.isArray(r.gates) ? r.gates.filter((g) => g && g.ok === false).length : 0;
  const state = r.ok === true && r.merge ? 'merged' : gatesRed ? 'red' : 'blocked';
  return { state, gatesRed };
}

const numbered = (names, re) => names.map((n) => re.exec(n)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);

/** The cache key of a lane folder: every file read, by size and mtime. */
export function laneKey(dir, names) {
  const files = ['log.jsonl', 'exit.txt', 'started.txt', 'pid.txt', 'tier.txt', 'session.txt', 'worktree.txt', 'runs.jsonl',
    'result.json', 'prompt.txt', 'goahead.txt', 'resolved.txt', 'direct.json', 'handoff.md',
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
  const resumeTexts = inputs.length > 1 ? inputs.slice(1).map((k) => readTrim(join(dir, `input-${k}.md`))) : msgs.map((k) => readTrim(join(dir, `msg-${k}.md`)));
  const header = promptHeader(readTrim(join(dir, 'prompt.txt')) || null);
  const lastOutcome = res.length ? turnOutcome(res[res.length - 1].outcome) : 'none';
  let stopKind = null;
  if (lastOutcome === 'hard-stop') {
    const promptText = promptTextOf(dir);
    const head = promptText.slice(0, 8192);
    const cut = head.search(/^## /m);
    const kind = header.kind ?? kindOf(LANE.exec(cut === -1 ? head : head.slice(0, cut))?.[1] ?? '');
    stopKind = stopKindOf({ result: lastResultText(buf), handoff: names.includes('handoff.md'), promptText, kind });
  }
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
  const tierLine = readTrim(join(dir, 'tier.txt')).split('\n')[0];
  const merge = mergeState(join(dir, 'result.json'));
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
    maxRunMs: res.reduce((a, r) => Math.max(a, r.ms), 0),
    turns: res.length,
    lastOutcome,
    stopKind,
    resumes: resumeTexts.length,
    autoResumes: resumeTexts.filter(isAutoResume).length,
    logMtime: buf ? Math.round(mtime(join(dir, 'log.jsonl'))) || null : null,
    critical: CRITICAL_REASON.test(tierLine) || existsSync(join(dir, 'goahead.txt')),
    workMs: Math.round(turns.reduce((a, t) => a + (t.e - t.s), 0)),
    resolved: existsSync(join(dir, 'resolved.txt')),
    adoptions: lastAdoptions(buf),
    ...header,
    mergeState: merge.state,
    gatesRed: merge.gatesRed,
    corrective: classes.includes('corrective'),
    cost: co.max,
    spend,
  };
}

/** The lane ids under root: the folders named like a lane, sorted. Throws when root does not read. */
export function laneIds(root) {
  return readdirSync(root).filter((n) => LANE_ID.test(n)).sort().filter((id) => {
    try { return statSync(join(root, id)).isDirectory(); } catch { return false; }
  });
}

/** The repository of a worktree path: the one whose recorded toplevels hold it, when exactly one does. */
function repoOfPath(repos, p) {
  if (!p) return null;
  let rp = p;
  try { rp = realpathSync(p); } catch { /* a deleted worktree: matched by its recorded path */ }
  const hit = repos.filter((r) => r.toplevels.some((t) => rp === t || rp.startsWith(t + sep) || p === t || p.startsWith(t + sep)));
  return hit.length === 1 ? hit[0].key : null;
}

/**
 * Reads every lane folder under root into db; a folder whose files did not change and that has exited is skipped.
 * opts.limitMs(repoKey) gives the lane time limit of a repository (its tack.json), 90 minutes by default.
 */
export function collectLanes(db, root = defaultLaneRoot(), now = Date.now(), opts = {}) {
  const limitMs = opts.limitMs ?? (() => 90 * 60e3);
  const st = { enabled: false, lanes: 0, read: 0, unchanged: 0, errors: 0, spendRows: 0, stopScanned: 0 };
  if (!existsSync(root)) return st;
  st.enabled = true;
  const repos = db.prepare('SELECT key, toplevels FROM repos').all().map((r) => ({ key: r.key, toplevels: JSON.parse(r.toplevels) }));
  const sessionRepo = db.prepare('SELECT repo_key FROM session_repo WHERE session_id = ?');
  const getKey = db.prepare('SELECT cache_key, live, end_ms, stop_scanned FROM lanes WHERE id = ?');
  // Schema 8 columns are set by UPDATE alone, so that a lane read before schema 8 keeps its other columns (prompt_status).
  const putStop = db.prepare(`UPDATE lanes SET stop_kind = ?, resumes = ?, auto_resumes = ?, stop_scanned = ${STOP_RULES} WHERE id = ?`);
  const put = db.prepare(`INSERT OR REPLACE INTO lanes (id, repo_key, session_id, started_ms, end_ms, live, tier, runs, outcome,
    blocked_run, over_time, corrective, cost_usd, cache_key, turns, last_outcome, log_mtime_ms, critical, front, chat, merge_state,
    gates_red, kind, title, work_ms, worktree, resolved, adoptions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const delSpend = db.prepare('DELETE FROM lane_spend WHERE lane_id = ?');
  const addSpend = db.prepare('INSERT INTO lane_spend (lane_id, seq, at_ms, usd) VALUES (?, ?, ?, ?)');
  db.exec('BEGIN');
  try {
    for (const id of laneIds(root)) {
      const dir = join(root, id);
      st.lanes++;
      let names;
      try { names = readdirSync(dir); } catch { st.errors++; continue; }
      const key = laneKey(dir, names);
      const ex = getKey.get(id);
      const stale = !ex || ex.stop_scanned !== STOP_RULES;
      if (ex && ex.cache_key === key && ex.end_ms !== null && !ex.live && !stale) {
        st.unchanged++;
        continue;
      }
      let l;
      try { l = readLane(dir, now); } catch { st.errors++; continue; }
      if (ex && ex.cache_key === key && ex.end_ms !== null && !ex.live) {
        putStop.run(l.stopKind, l.resumes, l.autoResumes, id);
        st.stopScanned++;
        continue;
      }
      const repo = repoOfPath(repos, l.worktree) ?? (l.session ? sessionRepo.get(l.session)?.repo_key ?? null : null);
      put.run(id, repo, l.session, l.started, l.end, l.live ? 1 : 0, l.tier, l.runs, l.outcome, l.blockedRun ? 1 : 0,
        l.maxRunMs > limitMs(repo) ? 1 : 0, l.corrective ? 1 : 0, l.cost, key, l.turns, l.lastOutcome, l.logMtime,
        l.critical ? 1 : 0, l.front, l.chat, l.mergeState, l.gatesRed, l.kind, l.title, l.workMs, l.worktree, l.resolved ? 1 : 0,
        l.adoptions);
      putStop.run(l.stopKind, l.resumes, l.autoResumes, id);
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
  st.statusSet = refreshPromptStatus(db, root, now);
  return st;
}
