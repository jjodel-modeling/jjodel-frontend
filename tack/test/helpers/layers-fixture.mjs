// Synthetic Claude Code transcripts and lane-run folders for the layer 2/3 tests. Everything is written
// by the test in its own temporary directory, never under ~/.jjodel-lanes or a real repository.
import { mkdirSync, readdirSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const iso = (ms) => new Date(ms).toISOString();

/**
 * A main transcript under root for session id in cwd: a first user record carrying userText (and gitBranch
 * when given), then two assistant calls, the last at lastMs.
 */
export function writeSession(root, { id, cwd, branch = null, firstMs, lastMs, userText = 'hello' }) {
  const dir = join(root, cwd.replace(/[^A-Za-z0-9]/g, '-'));
  mkdirSync(dir, { recursive: true });
  const base = { sessionId: id, cwd, version: '9.9.9', ...(branch ? { gitBranch: branch } : {}) };
  const call = (ms, n) => ({
    type: 'assistant', ...base, timestamp: iso(ms),
    message: { id: `msg_${id}_${n}`, model: 'claude-fixture-3', usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } },
  });
  const recs = [
    { type: 'user', ...base, timestamp: iso(firstMs), message: { role: 'user', content: userText } },
    call(firstMs + 1000, 1),
    call(lastMs, 2),
  ];
  const file = join(dir, `${id}.jsonl`);
  writeFileSync(file, recs.map((r) => JSON.stringify(r)).join('\n') + '\n');
  return file;
}

// Events of a lane's log.jsonl (Claude stream-json).
export const initEvent = () => ({ type: 'system', subtype: 'init', session_id: 's' });
export const assistantText = (text) => ({ type: 'assistant', message: { content: [{ type: 'text', text }] } });
/** A result event closing a turn: duration, running total cost and result text (its last Outcome: word counts). */
export const resultEvent = ({ ms, usd, text = '', ...more }) => ({
  type: 'result', duration_ms: ms, total_cost_usd: usd, result: text, num_turns: 3, ...more,
});

const setTime = (p, ms) => utimesSync(p, ms / 1000, ms / 1000);

/**
 * Writes <root>/<id>/ as lane-run does: started.txt, tier.txt, runs.jsonl, optional worktree.txt, session.txt,
 * pid.txt, the numbered inputs (input-k.md, mtime = when the turn started), log.jsonl, and exit.txt whose
 * mtime is exitAt (omitted for a lane that has not exited).
 */
export function writeLane(root, id, { started, exitAt = null, pid = null, tier = 'heavy', worktree = null, session = null, runs = 1, inputs = [], events = [] }) {
  const dir = join(root, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'started.txt'), String(started));
  writeFileSync(join(dir, 'tier.txt'), `${tier}\n`);
  writeFileSync(join(dir, 'runs.jsonl'), Array.from({ length: runs }, (_, i) => JSON.stringify({ run: i + 1 })).join('\n') + '\n');
  if (worktree) writeFileSync(join(dir, 'worktree.txt'), `${worktree}\n`);
  if (session) writeFileSync(join(dir, 'session.txt'), `${session}\n`);
  if (pid) writeFileSync(join(dir, 'pid.txt'), `${pid}\n`);
  inputs.forEach(({ at, text }, i) => {
    const p = join(dir, `input-${i + 1}.md`);
    writeFileSync(p, text);
    setTime(p, at);
  });
  writeFileSync(join(dir, 'log.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + (events.length ? '\n' : ''));
  if (exitAt !== null) {
    const p = join(dir, 'exit.txt');
    writeFileSync(p, 'exit 0\n');
    setTime(p, exitAt);
  }
  return dir;
}

/** Every entry under dir as `relative path|kind|size|mtimeMs`, sorted: a listing to compare before and after. */
export function snapshot(dir) {
  const out = [];
  const walk = (d) => {
    for (const n of readdirSync(d).sort()) {
      const p = join(d, n);
      const s = statSync(p);
      out.push(`${relative(dir, p)}|${s.isDirectory() ? 'dir' : 'file'}|${s.isDirectory() ? 0 : s.size}|${s.mtimeMs}`);
      if (s.isDirectory()) walk(p);
    }
  };
  walk(dir);
  return out;
}

const Z = (s) => Date.parse(s);
const MIN = 60_000;
export const NOW = Z('2026-01-08T12:00:00Z');

/**
 * Seven lanes under root, all of them the board's kinds of ending (times UTC, days Europe/Rome):
 * L1 clean, L2 resumed with a corrective input, L3 blocked, L4 a 100-minute run, L5 clean but with a cost that
 * restarts (2.0 then 0.4), L6 still running (pid.txt names this process), L7 clean, linked by session.txt.
 * worktree is written to the worktree.txt of every lane but L7.
 */
export function fixtureLanes(root, { worktree }) {
  const done = (text = 'Outcome: done') => assistantText(`Finished.\n${text}`);
  const wt = { worktree };
  const lane = {
    L1: 'P-2026-01-06-0900', L2: 'P-2026-01-06-1000', L3: 'P-2026-01-07-0900', L4: 'P-2026-01-07-1400',
    L5: 'P-2026-01-07-1600', L6: 'P-2026-01-08-1100', L7: 'P-2026-01-07-1700',
  };
  const s1 = Z('2026-01-06T09:00:00Z');
  writeLane(root, lane.L1, { ...wt, started: s1, exitAt: s1 + 10 * MIN,
    events: [initEvent(), done(), resultEvent({ ms: 10 * MIN, usd: 1.5, text: 'Outcome: done' })] });
  const s2 = Z('2026-01-06T10:00:00Z');
  writeLane(root, lane.L2, { ...wt, started: s2, exitAt: s2 + 40 * MIN, runs: 2,
    inputs: [{ at: s2, text: 'Do the task.\n' }, { at: s2 + 30 * MIN, text: 'Rework: the table is wrong.\n' }],
    events: [initEvent(), resultEvent({ ms: 5 * MIN, usd: 1.0, text: 'Outcome: done' }), done(), resultEvent({ ms: 400_000, usd: 2.5, text: 'Outcome: done' })] });
  const s3 = Z('2026-01-07T09:00:00Z');
  writeLane(root, lane.L3, { ...wt, started: s3, exitAt: s3 + 20 * MIN,
    events: [initEvent(), assistantText('Stuck.\nOutcome: blocked'), resultEvent({ ms: 2 * MIN, usd: 0.5, text: 'Outcome: blocked' })] });
  const s4 = Z('2026-01-07T14:00:00Z');
  writeLane(root, lane.L4, { ...wt, started: s4, exitAt: s4 + 2 * 60 * MIN,
    events: [initEvent(), done(), resultEvent({ ms: 100 * MIN, usd: 3.0, text: 'Outcome: done' })] });
  const s5 = Z('2026-01-07T16:00:00Z');
  writeLane(root, lane.L5, { ...wt, started: s5, exitAt: s5 + 15 * MIN,
    events: [initEvent(), resultEvent({ ms: 5 * MIN, usd: 2.0, text: 'Outcome: done' }), resultEvent({ ms: MIN, usd: 0.4, text: 'Outcome: done' }), done()] });
  writeLane(root, lane.L6, { ...wt, started: Z('2026-01-08T11:00:00Z'), pid: process.pid,
    events: [initEvent(), resultEvent({ ms: 10 * MIN, usd: 0.8, text: '' })] });
  const s7 = Z('2026-01-07T17:00:00Z');
  writeLane(root, lane.L7, { started: s7, exitAt: s7 + 10 * MIN, session: 'sess-7',
    events: [initEvent(), resultEvent({ ms: 5 * MIN, usd: 1.2, text: 'Outcome: done' }), done()] });
  return lane;
}
