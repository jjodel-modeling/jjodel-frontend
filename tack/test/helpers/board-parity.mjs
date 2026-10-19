// The lane board's own rules, copied (not imported) from Jjodel's frontend/scripts/lane-board/lane-board.mjs
// as of 2026-10-19, for `tack parity jjodel`: localDay :756, costEvents :761, spendByDay :785, results :815,
// logFacts :855 (the fields first-shot reads), inputClass :895, laneTimeline :926 (turns and facts), refreshGit
// :1241 with addCommits :1281 (byPid, reverted), logEntries :1307 and insightLane :1363 (rework, failedRun,
// firstShot). Caches, tokens, areas and the Requirements parts are left out; the rules are verbatim.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const readTrim = (p) => {
  try { return readFileSync(p, 'utf8').trim(); } catch { return ''; }
};
const mtime = (p) => { try { return statSync(p).mtimeMs; } catch { return 0; } };
const alive = (pid) => { if (!pid) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const parseLine = (raw) => { try { return JSON.parse(raw.toString('utf8')); } catch { return null; } };
const ASSISTANT = Buffer.from('{"type":"assistant"');

export function localDay(ms) { return new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 10); }

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

export function costEvents(buf) {
  const out = { events: [], max: null, sessions: 0 };
  if (!buf) return out;
  eachLine(buf, '"subtype":"init"', (raw) => {
    const e = parseLine(raw);
    if (e && e.type === 'system' && e.subtype === 'init') out.sessions++;
  });
  let seen = 0;
  eachLine(buf, '"type":"result"', (raw) => {
    const e = parseLine(raw);
    if (!e || e.type !== 'result') return;
    const notTurn = (e.origin && e.origin.kind === 'task-notification') || (e.num_turns === 0 && !e.result);
    const turn = notTurn ? Math.max(0, seen - 1) : seen;
    if (!notTurn) seen++;
    if (typeof e.total_cost_usd !== 'number') return;
    out.events.push({ usd: e.total_cost_usd, turn });
    out.max = out.max === null ? e.total_cost_usd : Math.max(out.max, e.total_cost_usd);
  });
  return out;
}

export function spendByDay(events, turns) {
  const out = {};
  if (!turns || !turns.length) return out;
  let prev = 0;
  for (const ev of events) {
    const delta = ev.usd >= prev ? ev.usd - prev : ev.usd;
    prev = ev.usd;
    if (!delta) continue;
    const day = localDay(turns[Math.min(ev.turn, turns.length - 1)].e);
    out[day] = (out[day] || 0) + delta;
  }
  return out;
}

function results(buf) {
  if (!buf) return [];
  const out = [];
  const key = Buffer.from('"type":"result"');
  let at = buf.indexOf(key);
  while (at !== -1) {
    const s0 = buf.lastIndexOf(10, at) + 1;
    let s1 = buf.indexOf(10, at);
    if (s1 === -1) s1 = buf.length;
    try {
      const e = JSON.parse(buf.subarray(s0, s1).toString('utf8'));
      const notTurn = (e.origin && e.origin.kind === 'task-notification') || (e.num_turns === 0 && !e.result);
      if (e.type === 'result' && !notTurn) {
        const m = [...String(e.result || '').matchAll(/Outcome:\s*`?([a-z][a-z-]*)/gi)];
        out.push({ ms: Number(e.duration_ms) || 0, outcome: m.length ? m[m.length - 1][1].toLowerCase() : '' });
      }
    } catch { /* a line that is not JSON */ }
    at = buf.indexOf(key, s1);
  }
  return out;
}

function logFacts(buf, res) {
  const f = { outcome: 'none', blockedRun: res.some((r) => r.outcome === 'blocked'), overTime: res.some((r) => r.ms > 90 * 60e3) };
  if (!buf) return f;
  let last = null;
  eachLine(buf, 'Outcome:', (raw) => {
    if (!raw.subarray(0, ASSISTANT.length).equals(ASSISTANT)) return;
    const e = parseLine(raw);
    const content = e && e.message && Array.isArray(e.message.content) ? e.message.content : [];
    for (const b of content) {
      if (!b || b.type !== 'text' || typeof b.text !== 'string') continue;
      for (const line of b.text.split('\n')) if (line.trim().startsWith('Outcome:')) last = line.trim();
    }
  });
  if (last !== null) f.outcome = (/^Outcome:\s*(done|hard-stop|question|blocked)\b/.exec(last) || [])[1] || 'unparsed';
  return f;
}

function inputClass(text) {
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

/** laneTimeline without its cache, the decision texts, citations, dependencies and request. */
export function laneTimeline(dir, now) {
  const exitP = join(dir, 'exit.txt');
  const exited = existsSync(exitP);
  const names = readdirSync(dir);
  const inputs = names.map((n) => /^input-(\d+)\.md$/.exec(n)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);
  let buf = null;
  try { buf = readFileSync(join(dir, 'log.jsonl')); } catch { /* no log yet */ }
  const res = results(buf);
  const end = exited ? mtime(exitP) : now;
  const turns = [];
  if (!inputs.length) {
    const st = Number(readTrim(join(dir, 'started.txt'))) || end;
    turns.push({ s: st, e: end, o: res.length ? res[res.length - 1].outcome : '' });
  } else {
    const starts = inputs.map((k) => mtime(join(dir, 'input-' + k + '.md')));
    starts.forEach((st, i) => {
      const last = i === starts.length - 1;
      let e;
      if (res[i] && res[i].ms) e = st + res[i].ms;
      else e = last ? end : starts[i + 1];
      if (!last) e = Math.min(e, starts[i + 1]);
      if (last && !exited) e = now;
      const input = join(dir, 'input-' + inputs[i] + '.md');
      turns.push({ s: st, e: Math.max(e, st), o: res[i] ? res[i].outcome : '', c: i ? inputClass(readTrim(input).slice(0, 1500)) : '' });
    });
  }
  const facts = logFacts(buf, res);
  const msgs = names.map((n) => /^msg-(\d+)\.md$/.exec(n)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);
  facts.resumeCls = inputs.length > 1 ? turns.slice(1).map((t) => t.c) : msgs.map((k) => inputClass(readTrim(join(dir, 'msg-' + k + '.md')).slice(0, 1500)));
  return { turns, exited, facts, buf };
}

const stampPid = (s) => { const m = /(\d{4})-(\d{2})-(\d{2})[ T_](\d{2}):?(\d{2})/.exec(s || ''); return m ? 'P-' + m[1] + '-' + m[2] + '-' + m[3] + '-' + m[4] + m[5] : ''; };
const filePid = (s) => { const m = /claude_(\d{4}-\d{2}-\d{2})_(\d{4})_/.exec(s || ''); return m ? 'P-' + m[1] + '-' + m[2] : ''; };

const gitRun = (repo, args) => spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 1 << 30, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } });

export function logEntries(repo, trunk) {
  const ls = gitRun(repo, ['ls-tree', '--name-only', trunk, 'docs/log-inbox/']);
  const files = [...(ls.status === 0 ? ls.stdout.split('\n').filter((p) => p.endsWith('.md')) : []), 'docs/claude-code-log.md', 'docs/claude-code-log-archive.md'];
  const raw = [];
  for (const file of files) {
    const r = gitRun(repo, ['show', trunk + ':' + file]);
    if (r.status !== 0) continue;
    let cur = null;
    for (const ln of r.stdout.split('\n')) {
      if (/^## \d{4}-\d{2}-\d{2}/.test(ln)) { cur = { head: ln, fields: {} }; raw.push(cur); continue; }
      const m = cur && /^\*\*([^*]+)\*\*:\s*(.*)$/.exec(ln);
      if (m && !(m[1].trim() in cur.fields)) cur.fields[m[1].trim()] = m[2];
    }
  }
  return raw.map(({ head, fields }) => {
    const c = (fields.Corregge || '').trim();
    const filled = c !== '' && !/^[—-]/.test(c);
    return {
      pid: (/\((P-\d{4}-\d{2}-\d{2}-\d{4})\)/.exec(head) || [])[1] || stampPid(fields['Prompt document name']),
      type: (/^## \S+ — ([a-z]+)/.exec(head) || [])[1] || '',
      cPid: filled ? (/P-\d{4}-\d{2}-\d{2}-\d{4}/.exec(c) || [])[0] || filePid(c) || stampPid(c) : '',
    };
  });
}

/** refreshGit's first scan and addCommits: byPid (non-merge commits by Prompt-ID, cherry-picks once) and reverted. */
export function gitFacts(repo, since) {
  const r = gitRun(repo, ['log', '--all', '--no-merges', '--since=' + since, '--format=%x1e%H%x1f%aI%x1f%s%x1f%b']);
  const byPid = new Map();
  const reverted = new Map();
  const seen = new Set();
  for (const rec of (r.status === 0 ? r.stdout : '').split('\x1e')) {
    const f = rec.split('\x1f');
    if (f.length < 4 || seen.has(f[0])) continue;
    const [sha, adate, subject, body] = f;
    seen.add(sha);
    const rv = /This reverts commit ([0-9a-f]{40})/.exec(body);
    if (rv) reverted.set(rv[1], sha.slice(0, 9));
    const pid = (/\((P-\d{4}-\d{2}-\d{2}-\d{4})\)\s*$/.exec(subject) || /^Prompt-ID:\s*(P-\d{4}-\d{2}-\d{2}-\d{4})/m.exec(body) || [])[1];
    if (!pid) continue;
    const list = byPid.get(pid) || [];
    if (list.some((c) => c.subject === subject && c.adate === adate)) continue;
    list.push({ sha, adate, subject });
    byPid.set(pid, list);
  }
  return { byPid, reverted };
}

function idTime(id) {
  const m = id.match(/P-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : 0;
}

/**
 * The board's numbers over a lane root, for the lanes whose id is a Prompt-ID: spend by local day (the Lanes
 * tab's day totals) and firstShot per lane (/api/insights), with its signals.
 */
export function boardNumbers({ root, repo, trunk, now = Date.now() }) {
  const ids = readdirSync(root).filter((n) => /^P-\d{4}-\d{2}-\d{2}-\d{4}$/.test(n)).sort();
  const spend = {};
  const rows = [];
  for (const id of ids) {
    const dir = join(root, id);
    try { if (!statSync(dir).isDirectory()) continue; } catch { continue; }
    const t = laneTimeline(dir, now);
    rows.push({ id, dir, t });
    const co = costEvents(t.buf);
    if (co.events.length) for (const [d, usd] of Object.entries(spendByDay(co.events, t.turns))) spend[d] = (spend[d] || 0) + usd;
  }
  const g = gitFacts(repo, new Date((ids.length ? idTime(ids[0]) : now) - 2 * 864e5).toISOString());
  const corr = new Map();
  for (const e of logEntries(repo, trunk)) if (e.cPid) { if (!corr.has(e.cPid)) corr.set(e.cPid, []); corr.get(e.cPid).push(e); }
  const lanes = rows.map(({ id, dir, t }) => {
    const f = t.facts;
    const live = !t.exited && alive(Number(readTrim(join(dir, 'pid.txt'))));
    const cls = f.resumeCls || [];
    const c = corr.get(id) || [];
    const commits = g.byPid.get(id) || [];
    const signals = {
      corrective: cls.includes('corrective'),
      correctedBy: [...new Set(c.filter((e) => e.pid !== id).map((e) => e.pid))],
      selfCorrected: c.some((e) => e.pid === id),
      reverted: commits.map((x) => g.reverted.get(x.sha)).filter(Boolean),
      blockedRun: !!f.blockedRun, overTime: !!f.overTime,
    };
    const final = live ? 'running' : f.outcome || 'none';
    const rework = signals.corrective || signals.correctedBy.length > 0 || signals.selfCorrected || signals.reverted.length > 0;
    const failedRun = signals.blockedRun || signals.overTime || ['blocked', 'none', 'unparsed'].includes(final);
    return { id, final, rework, failedRun, signals, firstShot: live ? null : ['done', 'hard-stop'].includes(final) && !rework && !failedRun };
  });
  return { spend, lanes };
}
