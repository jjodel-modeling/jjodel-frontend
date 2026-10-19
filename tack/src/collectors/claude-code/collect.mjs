// Claude Code collector: ~/.claude/projects/<dir>/<session>.jsonl and
// <dir>/<session>/subagents/*.jsonl -> sessions and calls. Reads metadata only: the record
// paths in COLUMN_SOURCES are the only ones ever read, message content never is.
// Adapted from frontend/scripts/lane-usage.mjs (apiCalls: one call per message.id, the last
// record of a message carries its final usage, <synthetic> messages are not API calls).
import { closeSync, existsSync, openSync, readSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const defaultRoot = () => join(homedir(), '.claude', 'projects');

/** Every store column and the transcript field it is fed from. */
export const COLUMN_SOURCES = {
  ingest: { id: 'rowid', path: 'file path', kind: 'file path', session_id: 'sessionId', size: 'file stat', mtime_ms: 'file stat', offset: 'file read' },
  sessions: {
    id: 'sessionId', file_id: 'ingest.id', cwd: 'cwd', first_ts: 'timestamp', last_ts: 'timestamp',
    models: 'message.model', cli_version: 'version', cost_usd: 'totalCostUSD', cost_known: 'totalCostUSD',
    cost_unknown_model: 'hasUnknownModelCost',
  },
  calls: {
    message_id: 'message.id', session_id: 'sessionId', file_id: 'ingest.id', ts: 'timestamp', model: 'message.model',
    sidechain: 'isSidechain', input: 'message.usage.input_tokens', output: 'message.usage.output_tokens',
    cache_read: 'message.usage.cache_read_input_tokens', cache_creation: 'message.usage.cache_creation_input_tokens',
    context: 'message.usage',
  },
};

/** Main transcripts and subagent transcripts under root, sorted. */
export function listTranscripts(root) {
  const out = [];
  if (!existsSync(root)) return out;
  for (const dir of readdirSync(root).sort()) {
    const dp = join(root, dir);
    if (!isDir(dp)) continue;
    for (const name of readdirSync(dp).sort()) {
      const p = join(dp, name);
      if (name.endsWith('.jsonl') && !isDir(p)) {
        out.push({ path: p, kind: 'main', sessionId: name.slice(0, -'.jsonl'.length) });
      } else if (isDir(p) && isDir(join(p, 'subagents'))) {
        for (const sub of readdirSync(join(p, 'subagents')).sort()) {
          if (sub.endsWith('.jsonl')) out.push({ path: join(p, 'subagents', sub), kind: 'subagent', sessionId: name });
        }
      }
    }
  }
  return out;
}

function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

const tok = (v) => (Number.isFinite(v) && v > 0 ? Math.trunc(v) : 0);
const tsOf = (r) => (typeof r.timestamp === 'string' && !Number.isNaN(Date.parse(r.timestamp)) ? r.timestamp : null);

/**
 * Ingest every transcript under root into db, from each file's stored byte offset. A file that
 * shrank or whose mtime moved backwards is re-read from 0 and its rows replaced. Returns counts.
 */
export function scan(db, root = defaultRoot()) {
  const st = {
    files: 0, read: 0, reread: 0, unchanged: 0, gone: 0, bytes: 0, records: 0, malformed: 0,
    used: {}, skipped: {}, sessionsAdded: 0, callsAdded: 0, callsUpdated: 0, callsRemoved: 0, duplicates: 0,
  };
  const q = prepare(db);
  const files = listTranscripts(root);
  const seen = new Set(files.map((f) => f.path));
  for (const row of q.allIngest.all()) if (!seen.has(row.path)) st.gone++;

  for (const f of files) {
    st.files++;
    const s = statSync(f.path);
    let cur = q.getIngest.get(f.path);
    const truncated = cur && (s.size < cur.size || s.mtimeMs < cur.mtime_ms);
    if (cur && !truncated && s.size === cur.size && s.mtimeMs === cur.mtime_ms) {
      st.unchanged++;
      continue;
    }
    db.exec('BEGIN');
    try {
      if (!cur) {
        const r = q.insIngest.run(f.path, f.kind, f.sessionId, 0, 0, 0);
        cur = { id: Number(r.lastInsertRowid), offset: 0 };
      } else if (truncated) {
        st.reread++;
        st.callsRemoved += Number(q.delCallsOfFile.run(cur.id).changes);
        q.delSessionsOfFile.run(cur.id);
        cur = { ...cur, offset: 0 };
      }
      const { buf, end } = readFrom(f.path, cur.offset, s.size);
      st.read++;
      st.bytes += end;
      ingestChunk(q, f, cur.id, buf, end, st);
      q.updIngest.run(s.size, s.mtimeMs, cur.offset + end, cur.id);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
  return st;
}

/** The bytes from offset to the end of the last complete line: buf, and end = bytes consumed. */
function readFrom(path, offset, size) {
  const len = Math.max(0, size - offset);
  const buf = Buffer.alloc(len);
  const fd = openSync(path, 'r');
  try {
    let got = 0;
    while (got < len) {
      const n = readSync(fd, buf, got, len - got, offset + got);
      if (n === 0) break;
      got += n;
    }
    const end = got === 0 ? 0 : buf.lastIndexOf(0x0a, got - 1) + 1;
    return { buf, end };
  } finally {
    closeSync(fd);
  }
}

function ingestChunk(q, f, fileId, buf, end, st) {
  const calls = new Map();
  const sess = { cwd: null, first: null, last: null, version: null, cost: null, unknownCost: false };
  let start = 0;
  while (start < end) {
    const nl = buf.indexOf(0x0a, start);
    const line = buf.toString('utf8', start, nl).trim();
    start = nl + 1;
    if (!line) continue;
    st.records++;
    let r;
    try {
      r = JSON.parse(line);
    } catch {
      st.malformed++;
      continue;
    }
    if (r === null || typeof r !== 'object' || Array.isArray(r)) {
      st.malformed++;
      continue;
    }
    const type = typeof r.type === 'string' ? r.type : '(none)';
    const ts = tsOf(r);
    if (ts) {
      if (!sess.first || Date.parse(ts) < Date.parse(sess.first)) sess.first = ts;
      if (!sess.last || Date.parse(ts) > Date.parse(sess.last)) sess.last = ts;
    }
    if (typeof r.cwd === 'string' && !sess.cwd) sess.cwd = r.cwd;
    if (typeof r.version === 'string') sess.version = r.version;

    let used = false;
    const m = r.message;
    if (type === 'assistant' && m && typeof m === 'object' && m.usage && typeof m.usage === 'object' && m.model !== '<synthetic>') {
      const id = typeof m.id === 'string' ? m.id : typeof r.requestId === 'string' ? r.requestId : `uuid:${r.uuid}`;
      const u = m.usage;
      const prev = calls.get(id);
      calls.set(id, {
        ts: prev?.ts ?? ts,
        model: typeof m.model === 'string' ? m.model : null,
        sidechain: f.kind === 'subagent' || r.isSidechain === true ? 1 : 0,
        input: tok(u.input_tokens),
        output: tok(u.output_tokens),
        cacheRead: tok(u.cache_read_input_tokens),
        cacheCreation: tok(u.cache_creation_input_tokens),
      });
      used = true;
    } else if (type === 'cost-state' && Number.isFinite(r.totalCostUSD)) {
      sess.cost = Math.max(sess.cost ?? 0, r.totalCostUSD);
      if (r.hasUnknownModelCost === true) sess.unknownCost = true;
      used = true;
    }
    const tally = used ? st.used : st.skipped;
    tally[type] = (tally[type] ?? 0) + 1;
  }

  const sessionId = f.sessionId;
  for (const [id, c] of calls) {
    const ex = q.getCall.get(id);
    const args = [c.model, c.input, c.output, c.cacheRead, c.cacheCreation, c.input + c.cacheRead + c.cacheCreation];
    if (!ex) {
      q.insCall.run(id, sessionId, fileId, c.ts, c.sidechain, ...args);
      st.callsAdded++;
    } else if (ex.file_id === fileId) {
      if (q.updCall.run(...args, id, ...args).changes > 0) st.callsUpdated++;
    } else {
      st.duplicates++;
    }
  }

  if (f.kind !== 'main') return;
  const models = new Set(calls.size ? [...calls.values()].map((c) => c.model).filter(Boolean) : []);
  const ex = q.getSession.get(sessionId);
  if (!ex) {
    q.insSession.run(sessionId, fileId, sess.cwd, sess.first, sess.last, JSON.stringify([...models].sort()), sess.version,
      sess.cost, sess.cost === null ? 0 : 1, sess.unknownCost ? 1 : 0);
    st.sessionsAdded++;
    return;
  }
  for (const mo of JSON.parse(ex.models)) models.add(mo);
  const earlier = (a, b) => (!a ? b : !b ? a : Date.parse(a) <= Date.parse(b) ? a : b);
  const later = (a, b) => (!a ? b : !b ? a : Date.parse(a) >= Date.parse(b) ? a : b);
  q.updSession.run(
    ex.cwd ?? sess.cwd,
    earlier(ex.first_ts, sess.first),
    later(ex.last_ts, sess.last),
    JSON.stringify([...models].sort()),
    sess.version ?? ex.cli_version,
    sess.cost === null ? ex.cost_usd : Math.max(ex.cost_usd ?? 0, sess.cost),
    ex.cost_known || sess.cost !== null ? 1 : 0,
    ex.cost_unknown_model || sess.unknownCost ? 1 : 0,
    sessionId,
  );
}

function prepare(db) {
  return {
    allIngest: db.prepare('SELECT path FROM ingest'),
    getIngest: db.prepare('SELECT id, size, mtime_ms, offset FROM ingest WHERE path = ?'),
    insIngest: db.prepare('INSERT INTO ingest (path, kind, session_id, size, mtime_ms, offset) VALUES (?, ?, ?, ?, ?, ?)'),
    updIngest: db.prepare('UPDATE ingest SET size = ?, mtime_ms = ?, offset = ? WHERE id = ?'),
    delCallsOfFile: db.prepare('DELETE FROM calls WHERE file_id = ?'),
    delSessionsOfFile: db.prepare('DELETE FROM sessions WHERE file_id = ?'),
    getCall: db.prepare('SELECT file_id FROM calls WHERE message_id = ?'),
    insCall: db.prepare(`INSERT INTO calls (message_id, session_id, file_id, ts, sidechain, model, input, output, cache_read,
      cache_creation, context) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    updCall: db.prepare(`UPDATE calls SET model = ?, input = ?, output = ?, cache_read = ?, cache_creation = ?, context = ?
      WHERE message_id = ? AND NOT (model IS ? AND input = ? AND output = ? AND cache_read = ? AND cache_creation = ? AND context = ?)`),
    getSession: db.prepare('SELECT * FROM sessions WHERE id = ?'),
    insSession: db.prepare(`INSERT INTO sessions (id, file_id, cwd, first_ts, last_ts, models, cli_version, cost_usd, cost_known,
      cost_unknown_model) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    updSession: db.prepare(`UPDATE sessions SET cwd = ?, first_ts = ?, last_ts = ?, models = ?, cli_version = ?, cost_usd = ?,
      cost_known = ?, cost_unknown_model = ? WHERE id = ?`),
  };
}

