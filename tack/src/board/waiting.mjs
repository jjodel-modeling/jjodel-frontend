// What a waiting lane needs to be answered without opening it (slice 9): the reason it waits, its Recommended:
// line, and the URL of the chat that must answer. The text is read from the lane folder when the board asks for
// it, kept in this process's memory by the size of the log, and never written to the store (test/privacy.test.mjs).
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { git } from '../collectors/git/run.mjs';
import { lastResultText, promptTextOf } from '../collectors/lane-run/collect.mjs';

export const REASON_MAX = 300;
export const FIRST_LINE_MAX = 60;

/** The pill of a wait: what the answer is. */
export const WAIT_PILL = { question: 'answer', breakpoint: 'GO', ceiling: 'ACK', 'hard-stop': 'hard-stop', blocked: 'blocked' };

/** s with its whitespace collapsed, cut to n characters at its last space past n/2, trailing punctuation trimmed, with an ellipsis. */
export function cut(s, n = REASON_MAX) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (s.length <= n) return s;
  const sp = s.lastIndexOf(' ', n);
  return s.slice(0, sp > n / 2 ? sp : n).replace(/[\s.,;:!?…—–-]+$/, '') + '…';
}

const plain = (s) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*|__|`/g, '').replace(/^#+\s+/, '').replace(/^(?:[-*>]|\d+[.)])\s+/, '').trim();
const SKIP = /^(\*\*)?(Outcome|Recommended):/;
const ASK = /^\*\*(Decisions?|Questions?) for (you|Alfonso)[^*]*\*\*:?\s*/i;
// The words that name a stop, by kind; the first sentence carrying them is the reason.
const NAMES = {
  breakpoint: /hard[- ]?stop|breakpoint|planned stop|phase 1|end of phase|visual (check|GO)|report (is |was )?committed|stop(s|ping|ped)? (here|at|for)/i,
  ceiling: /context[\w\s-]{0,20}ceiling|soft ceiling|\bAM-8\b|hand-?off/i,
  'hard-stop': /hard[- ]?stop|\bstop(s|ping|ped)?\b|block|cannot|can't|could not|fail|missing|not found|refus|conflict/i,
};

/** The lines of a closing message that carry prose: no code fence, no Outcome: or Recommended: line, the [P-...] tag dropped. */
function proseLines(text) {
  const out = [];
  let fence = false;
  for (const raw of String(text || '').replace(/^\s*\[P-[^\]\n]*\]\s*/, '').split('\n')) {
    const l = raw.trim();
    if (/^(```|~~~)/.test(l)) { fence = !fence; continue; }
    if (fence || !l || SKIP.test(l) || /^\|/.test(l) || /^-{3,}$/.test(l)) continue;
    out.push(l);
  }
  return out;
}

const sentences = (line) => plain(line).split(/(?<=[.?!])\s+(?=\S)/).filter(Boolean);

/**
 * The reason and the Recommended: line of a closing message, for a wait of kind question, breakpoint, ceiling or
 * hard-stop. A question: the text after a «**Question for you:**» (or Decision) line, else the first sentence ending
 * in «?», else the first sentence. A stop: the first sentence naming it (NAMES), else the first sentence. Each at most
 * REASON_MAX characters with an ellipsis; recommended is the last Recommended: line, '' without one.
 */
export function waitReasonOf(text, kind) {
  const all = String(text || '').replace(/^\s*\[P-[^\]\n]*\]\s*/, '').split('\n').map((l) => l.trim());
  const recs = all.filter((l) => /^(\*\*)?Recommended:/.test(l));
  const recommended = recs.length ? cut(plain(recs[recs.length - 1]).replace(/^Recommended:\s*/, '')) : '';
  const lines = proseLines(text);
  const first = lines.length ? sentences(lines[0])[0] || '' : '';
  let reason = '';
  if (kind === 'question') {
    const at = lines.findIndex((l) => ASK.test(l));
    if (at !== -1) reason = plain(lines[at].replace(ASK, '')) || plain(lines[at + 1] || '');
    if (!reason) for (const l of lines) { const q = sentences(l).find((x) => x.endsWith('?')); if (q) { reason = q; break; } }
  } else if (NAMES[kind]) {
    for (const l of lines) { const hit = sentences(l).find((x) => NAMES[kind].test(x)); if (hit) { reason = hit; break; } }
  }
  return { reason: cut(reason || first), recommended };
}

const CLAUDE_URL = /^https:\/\/claude\.ai\//;
const REQUEST = /^Request:[ \t]*(\S*)/m;
const SESSION = /Claude-Session:[ \t]*(\S+)/;
const header = (text) => String(text || '').split(/\n## /)[0];

/**
 * The URL of a lane's own chat, as Jjodel's lane board resolves it (lane-board.mjs, ownChatUrl): the Request: header of
 * its prompt when it is a claude.ai URL, else the Claude-Session: trailer of the commit that added the prompt file
 * (git log in the checkout that holds it); '' when neither resolves. from: request, commit or ''.
 */
export function chatUrlOf(dir, promptText = promptTextOf(dir)) {
  const req = (REQUEST.exec(header(promptText)) || [])[1] || '';
  if (CLAUDE_URL.test(req)) return { url: req, from: 'request' };
  let path = '';
  try { path = readFileSync(join(dir, 'prompt.txt'), 'utf8').trim(); } catch { /* no prompt.txt */ }
  if (path && existsSync(dirname(path))) {
    try {
      const r = git(['log', '--all', '--diff-filter=A', '--format=%x1e%B', '--', basename(path)], { cwd: dirname(path) });
      const recs = r.ok ? r.out.split('\x1e').filter((x) => x.trim()) : [];
      const oldest = recs.length ? (SESSION.exec(recs[recs.length - 1]) || [])[1] || '' : '';
      if (CLAUDE_URL.test(oldest)) return { url: oldest, from: 'commit' };
    } catch { /* git missing or the checkout gone */ }
  }
  return { url: '', from: '' };
}

const size = (p) => { try { return statSync(p).size; } catch { return -1; } };

/**
 * A reader of the waiting facts of a lane folder, memoised in memory: the reason and the Recommended: line by the size of
 * log.jsonl, the chat URL for 5 minutes. read(id, kind) → { reason, recommended, chatUrl }. Nothing is written anywhere.
 */
export function waitReader(laneRoot, { now = Date.now } = {}) {
  const text = new Map();
  const chat = new Map();
  return (id, kind) => {
    const dir = join(laneRoot, id);
    const log = join(dir, 'log.jsonl');
    const sz = size(log);
    let t = text.get(id);
    if (!t || t.size !== sz || t.kind !== kind) {
      let buf = null;
      try { buf = readFileSync(log); } catch { /* no log */ }
      t = { size: sz, kind, v: waitReasonOf(lastResultText(buf), kind) };
      text.set(id, t);
    }
    let c = chat.get(id);
    if (!c || now() - c.at > 5 * 60e3) { c = { at: now(), url: existsSync(dir) ? chatUrlOf(dir).url : '' }; chat.set(id, c); }
    return { ...t.v, chatUrl: c.url };
  };
}
