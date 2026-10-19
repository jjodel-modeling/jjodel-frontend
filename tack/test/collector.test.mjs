import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, cpSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openStore, SCHEMA_VERSION } from '../src/store/open.mjs';
import { scan } from '../src/collectors/claude-code/collect.mjs';
import { listSessions } from '../src/store/sessions.mjs';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const TACK = here('../bin/tack.mjs');
const FIXTURE = here('./fixtures/claude-code/projects');
const A = 'aaaaaaaa-0000-4000-8000-000000000001';
const B = 'bbbbbbbb-0000-4000-8000-000000000002';
const A_FILE = `-fx-alpha/${A}.jsonl`;
const B_FILE = `-fx-beta-sub-dir/${B}.jsonl`;

/** A writable copy of the fixture tree and an empty store, removed after the test. */
function sandbox(t) {
  const dir = mkdtempSync(join(tmpdir(), 'tack-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const root = join(dir, 'projects');
  cpSync(FIXTURE, root, { recursive: true });
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.close());
  return { dir, root, db };
}

const calls = (db, where = '1') => db.prepare(`SELECT * FROM calls WHERE ${where} ORDER BY message_id`).all();
const session = (db, id) => listSessions(db).find((s) => s.id === id);
const assistant = (id, ts, input, output = 1) => JSON.stringify({
  type: 'assistant', sessionId: B, cwd: '/fx/beta/sub_dir', version: '9.9.3', timestamp: ts,
  message: { id, model: 'claude-fixture-2', usage: { input_tokens: input, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, output_tokens: output } },
});

test('store: schema version is set and a newer store is refused', (t) => {
  const { dir, db } = sandbox(t);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
  const other = join(dir, 'future.db');
  const f = openStore(other);
  f.exec(`PRAGMA user_version = ${SCHEMA_VERSION + 1}`);
  f.close();
  assert.throws(() => openStore(other), /schema version/);
});

test('dedupe by message.id: two records of msg_A1 make one call with the last usage', (t) => {
  const { root, db } = sandbox(t);
  scan(db, root);
  const [c] = calls(db, "message_id = 'msg_A1'");
  assert.equal(c.output, 20);
  assert.equal(c.context, 10 + 100 + 5);
  assert.equal(c.ts, '2026-01-05T10:00:10.000Z');
  assert.equal(calls(db).length, 6);
});

test('sidechain calls are stored, flagged, and excluded from main-thread counts', (t) => {
  const { root, db } = sandbox(t);
  scan(db, root);
  const side = calls(db, 'sidechain = 1').map((c) => c.message_id);
  assert.deepEqual(side, ['msg_SIDE1', 'msg_SUB1']);
  const a = session(db, A);
  assert.equal(a.calls, 2);
  assert.equal(a.context_peak, 203);
  assert.deepEqual(a.models, ['claude-fixture-1']);
});

test('<synthetic> messages are not calls', (t) => {
  const { root, db } = sandbox(t);
  scan(db, root);
  assert.equal(calls(db, "message_id = 'msg_SYN'").length, 0);
});

test('cost is the max cost-state.totalCostUSD of the session; no cost-state means unknown', (t) => {
  const { root, db } = sandbox(t);
  scan(db, root);
  assert.equal(session(db, A).cost_usd, 0.25);
  assert.equal(session(db, B).cost_usd, null);
});

test('session fields: exact cwd, UTC day, span, last cli version', (t) => {
  const { root, db } = sandbox(t);
  scan(db, root);
  const a = session(db, A);
  const b = session(db, B);
  assert.equal(a.cwd, '/fx/alpha');
  assert.equal(b.cwd, '/fx/beta/sub_dir');
  assert.equal(a.day, '2026-01-05');
  assert.equal(b.day, '2026-01-06');
  assert.equal(a.span_min, 30);
  assert.equal(a.cli_version, '9.9.2');
});

test('malformed line skipped and counted; unknown record type ignored', (t) => {
  const { root, db } = sandbox(t);
  const st = scan(db, root);
  assert.equal(st.malformed, 1);
  assert.equal(st.skipped['frobnicate-xyz'], 1);
  assert.equal(st.records, 21);
});

test('incremental: a second scan adds 0 rows; appended lines add only themselves', (t) => {
  const { root, db } = sandbox(t);
  const first = scan(db, root);
  assert.equal(first.sessionsAdded, 2);
  assert.equal(first.callsAdded, 6);
  const second = scan(db, root);
  assert.equal(second.sessionsAdded + second.callsAdded + second.callsUpdated, 0);
  assert.equal(second.unchanged, 3);
  assert.equal(second.records, 0);
  appendFileSync(join(root, B_FILE), assistant('msg_B3', '2026-01-07T00:10:00.000Z', 7) + '\n'
    + JSON.stringify({ type: 'cost-state', sessionId: B, totalCostUSD: 0.05 }) + '\n');
  const third = scan(db, root);
  assert.equal(third.read, 1);
  assert.equal(third.records, 2);
  assert.equal(third.callsAdded, 1);
  assert.equal(third.sessionsAdded, 0);
  const b = session(db, B);
  assert.equal(b.calls, 3);
  assert.equal(b.cost_usd, 0.05);
  assert.equal(b.span_min, 20);
  assert.equal(b.cli_version, '9.9.3');
});

test('incremental: a partial last line waits until it is complete', (t) => {
  const { root, db } = sandbox(t);
  scan(db, root);
  const line = assistant('msg_B4', '2026-01-07T00:00:00.000Z', 3);
  appendFileSync(join(root, B_FILE), line.slice(0, 40));
  const partial = scan(db, root);
  assert.equal(partial.records, 0);
  assert.equal(partial.malformed, 0);
  appendFileSync(join(root, B_FILE), line.slice(40) + '\n');
  const done = scan(db, root);
  assert.equal(done.records, 1);
  assert.equal(done.callsAdded, 1);
  assert.equal(calls(db, "message_id = 'msg_B4'")[0].input, 3);
});

test('a later record of a known message updates its usage', (t) => {
  const { root, db } = sandbox(t);
  scan(db, root);
  appendFileSync(join(root, B_FILE), assistant('msg_B2', '2026-01-06T23:52:01.000Z', 2, 99) + '\n');
  const st = scan(db, root);
  assert.equal(st.callsAdded, 0);
  assert.equal(st.callsUpdated, 1);
  assert.equal(calls(db, "message_id = 'msg_B2'")[0].output, 99);
});

test('truncated file is re-read from 0 and its rows replaced', (t) => {
  const { root, db } = sandbox(t);
  scan(db, root);
  const p = join(root, A_FILE);
  const lines = readFileSync(p, 'utf8').split('\n');
  writeFileSync(p, lines.slice(0, 6).join('\n') + '\n'); // through msg_A1 and cost-state 0.10
  const st = scan(db, root);
  assert.equal(st.reread, 1);
  assert.equal(st.callsRemoved, 3);
  assert.equal(st.callsAdded, 1);
  const a = session(db, A);
  assert.equal(a.calls, 1);
  assert.equal(a.cost_usd, 0.1);
  assert.equal(a.span_min, 0);
  // The subagent transcript is another file: its call stays.
  assert.deepEqual(calls(db, `session_id = '${A}'`).map((c) => c.message_id), ['msg_A1', 'msg_SUB1']);
});

test('a file whose mtime moved backwards is re-read from 0, same totals', (t) => {
  const { root, db } = sandbox(t);
  scan(db, root);
  const before = listSessions(db);
  const past = new Date('2025-01-01T00:00:00Z');
  utimesSync(join(root, A_FILE), past, past);
  const st = scan(db, root);
  assert.equal(st.reread, 1);
  assert.equal(st.unchanged, 2);
  assert.deepEqual(listSessions(db), before);
  assert.equal(scan(db, root).unchanged, 3);
});

test('a transcript deleted from disk keeps its rows and is reported as gone', (t) => {
  const { root, db } = sandbox(t);
  scan(db, root);
  rmSync(join(root, B_FILE));
  const st = scan(db, root);
  assert.equal(st.gone, 1);
  assert.equal(session(db, B).calls, 2);
});

test('CLI: scan twice, then sessions with --cwd and --json', (t) => {
  const { dir, root } = sandbox(t);
  const store = join(dir, 'cli.db');
  const run = (...args) => spawnSync(process.execPath, [TACK, ...args], { encoding: 'utf8', env: { ...process.env, TACK_STORE: '' } });
  const s1 = run('scan', '--root', root, '--store', store);
  assert.equal(s1.status, 0, s1.stderr);
  assert.match(s1.stdout, /rows added: sessions 2, calls 6/);
  assert.match(s1.stdout, /records seen 21, malformed 1/);
  assert.match(s1.stdout, /records skipped by type: .*frobnicate-xyz 1/);
  const s2 = run('scan', '--root', root, '--store', store);
  assert.match(s2.stdout, /rows added: sessions 0, calls 0/);
  const j = run('sessions', '--store', store, '--cwd', '/fx/beta', '--json');
  assert.equal(j.status, 0, j.stderr);
  const rows = JSON.parse(j.stdout);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].cwd, '/fx/beta/sub_dir');
  assert.equal(rows[0].context_peak, 1062);
  const txt = run('sessions', '--store', store);
  assert.match(txt.stdout, /\/fx\/alpha\s+2026-01-05\s+2\s+0\.25\s+203\s+30\s+claude-fixture-1/);
  assert.match(txt.stdout, /2 sessions/);
});

test('CLI: TACK_STORE is honoured and unknown flags exit 2', (t) => {
  const { dir, root } = sandbox(t);
  const store = join(dir, 'env.db');
  const r = spawnSync(process.execPath, [TACK, 'scan', '--root', root], { encoding: 'utf8', env: { ...process.env, TACK_STORE: store } });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`store ${store.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  const bad = spawnSync(process.execPath, [TACK, 'sessions', '--frob'], { encoding: 'utf8' });
  assert.equal(bad.status, 2);
});
