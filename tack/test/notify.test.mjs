// The notifier: one message per transition, none on restart; dedup; a row turned on does not flood; quiet hours
// queue and digest, urgent passes; level episodes and re-arm; scope filters; the lease; privacy to the transport;
// the transports receive arguments, never a shell string. No test sends a real notification: every transport
// is a fake that records what it is given.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store/open.mjs';
import { settingsResolver } from '../src/settings/settings.mjs';
import { CATALOGUE, MESSAGE_FIELDS, buildMessage, inQuietHours, notifyTick, releaseLease, takeLease } from '../src/notify/notifier.mjs';
import { desktopArgs, desktopTransport, ntfyRequest, ntfyTransport } from '../src/notify/transports.mjs';

const MARKER = 'TACKPRIVACYMARKER-5d1e0a7c';
const NOW = Date.parse('2026-01-08T12:00:00Z');
const MIN = 60e3;

function world(t, { user = {}, local = null } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'tack-notify-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.isOpen && db.close());
  const top = join(dir, 'repo');
  mkdirSync(top);
  writeFileSync(join(top, 'tack.json'), '{}');
  if (local) writeFileSync(join(top, 'tack.local.json'), JSON.stringify(local));
  const userPath = join(dir, 'settings.json');
  // Every channel on, and the retention rule quiet unless a test turns it on.
  writeFileSync(userPath, JSON.stringify({ channels: { desktop: { enabled: true }, ntfy: { enabled: true, topic: 't' } }, ...user }));
  db.prepare("INSERT INTO repos (key, roots, common_dirs, toplevels, remote, state) VALUES ('R1', '[\"R1\"]', '[]', ?, NULL, 'present')").run(JSON.stringify([top]));
  const sent = [];
  const transports = { desktop: { send: async (m) => { sent.push(['desktop', m]); } }, ntfy: { send: async (m) => { sent.push(['ntfy', m]); } } };
  const tick = (now = NOW, extra = {}) => notifyTick(db, { now, settingsFor: settingsResolver(db, { user: userPath }), transports, retentionDays: () => 365, ...extra });
  const lane = (id, cols) => {
    const row = { id, repo_key: 'R1', live: 0, runs: 1, outcome: 'none', blocked_run: 0, over_time: 0, corrective: 0, cache_key: '', turns: 1, last_outcome: 'none', log_mtime_ms: NOW - MIN, critical: 0, front: 'tack', chat: 'C-2026-01-08-1000', ...cols };
    const k = Object.keys(row);
    db.prepare(`INSERT OR REPLACE INTO lanes (${k.join(', ')}) VALUES (${k.map(() => '?').join(', ')})`).run(...Object.values(row));
  };
  const status = (rule) => db.prepare('SELECT unit, transition, status FROM notify_events WHERE rule = ? ORDER BY unit, transition').all(rule).map((r) => `${r.unit} ${r.transition} ${r.status}`);
  return { db, dir, top, userPath, sent, transports, tick, lane, status };
}

test('rising edge: the first evaluation is a baseline, a new transition sends once, a poll or a restart sends nothing more', async (t) => {
  const w = world(t);
  w.lane('P-2026-01-08-0900', { last_outcome: 'question', turns: 1 });
  let st = await w.tick();
  assert.equal(st.baseline >= 1, true);
  assert.equal(w.sent.length, 0, 'what the store holds at the first run is never sent');
  w.lane('P-2026-01-08-0900', { last_outcome: 'done', turns: 2, log_mtime_ms: NOW });
  w.lane('P-2026-01-08-0901', { last_outcome: 'question', turns: 1, log_mtime_ms: NOW });
  st = await w.tick(NOW + MIN);
  assert.deepEqual(w.sent.map(([ch, m]) => `${ch} ${m.title}`), ['desktop Tack - Lane asks a question', 'ntfy Tack - Lane asks a question']);
  assert.equal(st.delivered, 1);
  for (let i = 2; i < 5; i++) await w.tick(NOW + i * MIN);
  assert.equal(w.sent.length, 2, 'one message per transition, never one per poll');
  // A restart: a new process on the same store finds every occurrence already claimed.
  w.db.close();
  const db2 = openStore(join(w.dir, 'store.db'));
  t.after(() => db2.close());
  const again = await notifyTick(db2, { now: NOW + 10 * MIN, settingsFor: settingsResolver(db2, { user: w.userPath }), transports: w.transports, retentionDays: () => 365 });
  assert.equal(again.delivered, 0);
  assert.equal(w.sent.length, 2);
  // The same lane asking again on a later turn is a new transition.
  w.db = db2;
  db2.prepare("UPDATE lanes SET last_outcome = 'question', turns = 3, log_mtime_ms = ? WHERE id = 'P-2026-01-08-0900'").run(NOW + 11 * MIN);
  await notifyTick(db2, { now: NOW + 12 * MIN, settingsFor: settingsResolver(db2, { user: w.userPath }), transports: w.transports, retentionDays: () => 365 });
  assert.equal(w.sent.length, 4);
  assert.deepEqual(db2.prepare("SELECT transition, status FROM notify_events WHERE rule = 'lane_question' ORDER BY seen_ms").all().map((r) => `${r.transition} ${r.status}`),
    ['question#1 baseline', 'question#1 delivered', 'question#3 delivered']);
});

test('dedup: the claim is the primary key, so two notifiers evaluating the same occurrence send it once', async (t) => {
  const w = world(t);
  await w.tick();
  w.lane('P-2026-01-08-0902', { last_outcome: 'blocked', turns: 1, log_mtime_ms: NOW });
  const [a, b] = await Promise.all([w.tick(NOW + MIN), w.tick(NOW + MIN)]);
  assert.equal(a.delivered + b.delivered, 1);
  assert.equal(w.sent.filter(([ch]) => ch === 'desktop').length, 1);
});

test('a row that is off suppresses its transitions, so turning it on later sends nothing old; a transition older than 24 h is stale', async (t) => {
  const w = world(t);
  await w.tick();
  w.lane('P-2026-01-08-0903', { last_outcome: 'done', turns: 1, log_mtime_ms: NOW });
  await w.tick(NOW + MIN);
  assert.deepEqual(w.status('lane_done'), ['P-2026-01-08-0903 done#1 suppressed']);
  writeFileSync(w.userPath, JSON.stringify({ channels: { desktop: { enabled: true } }, notifications: { events: { lane_done: { enabled: true, channels: ['desktop'] } } } }));
  await w.tick(NOW + 2 * MIN);
  assert.equal(w.sent.length, 0, 'enabling the row does not flood');
  w.lane('P-2026-01-07-0904', { last_outcome: 'done', turns: 1, log_mtime_ms: NOW - 30 * 3600e3 });
  await w.tick(NOW + 3 * MIN);
  assert.deepEqual(w.status('lane_done').at(0), 'P-2026-01-07-0904 done#1 stale');
  w.lane('P-2026-01-08-0905', { last_outcome: 'done', turns: 1, log_mtime_ms: NOW + 3 * MIN });
  await w.tick(NOW + 4 * MIN);
  assert.deepEqual(w.sent.map(([ch, m]) => `${ch} ${m.body}`), ['desktop P-2026-01-08-0905 · tack · repo · done']);
});

test('quiet hours queue non-urgent events and deliver one digest when they end; urgent events pass at once', async (t) => {
  const w = world(t, { user: { locale: { timeZone: 'UTC' }, quietHours: { enabled: true, start: '22:00', end: '08:00' } } });
  const night = Date.parse('2026-01-08T23:00:00Z');
  await w.tick(night);
  w.lane('P-2026-01-08-2301', { last_outcome: 'hard-stop', turns: 1, log_mtime_ms: night });
  w.lane('P-2026-01-08-2302', { last_outcome: 'hard-stop', turns: 1, log_mtime_ms: night });
  w.lane('P-2026-01-08-2303', { last_outcome: 'question', turns: 1, log_mtime_ms: night });
  const st = await w.tick(night + MIN);
  assert.deepEqual([st.queued, st.delivered], [2, 1]);
  assert.deepEqual(w.sent.map(([ch, m]) => `${ch} ${m.title}`), ['desktop Tack - Lane asks a question', 'ntfy Tack - Lane asks a question'], 'urgent bypasses quiet hours');
  await w.tick(Date.parse('2026-01-09T07:59:00Z'));
  assert.equal(w.sent.length, 2, 'still quiet');
  const morning = await w.tick(Date.parse('2026-01-09T08:00:00Z'));
  assert.equal(morning.digested, 2);
  assert.deepEqual(w.sent.slice(2).map(([ch, m]) => `${ch} ${m.title} | ${m.body}`), ['desktop Tack - 2 during quiet hours | Lane in hard-stop (unplanned) 2', 'ntfy Tack - 2 during quiet hours | Lane in hard-stop (unplanned) 2']);
  await w.tick(Date.parse('2026-01-09T08:01:00Z'));
  assert.equal(w.sent.length, 4, 'one digest');
  assert.deepEqual(w.status('lane_hard_stop').map((s) => s.split(' ')[2]), ['digested', 'digested']);
});

test('inQuietHours: a window across midnight and one inside a day; start inclusive, end exclusive', () => {
  const at = (hm) => Date.parse(`2026-01-08T${hm}:00Z`);
  const q = { enabled: true, start: '22:00', end: '08:00' };
  assert.deepEqual(['21:59', '22:00', '03:00', '07:59', '08:00'].map((h) => inQuietHours(at(h), q, 'UTC')), [false, true, true, true, false]);
  assert.deepEqual(['12:59', '13:00', '13:59', '14:00'].map((h) => inQuietHours(at(h), { enabled: true, start: '13:00', end: '14:00' }, 'UTC')), [false, true, true, false]);
  assert.equal(inQuietHours(at('03:00'), { ...q, enabled: false }, 'UTC'), false);
});

test('level rules open one episode while true and close it when false: lane_silent, and host_load re-arms below 85 % of the threshold', async (t) => {
  const w = world(t, { user: { notifications: { events: { host_load: { enabled: true, channels: ['desktop'] } } } } });
  w.lane('P-2026-01-08-1100', { live: 1, log_mtime_ms: NOW - 5 * MIN });
  await w.tick(NOW, { load: { load1: 4 } });
  await w.tick(NOW + 11 * MIN, { load: { load1: 4 } });
  assert.equal(w.sent.filter(([ch, m]) => ch === 'desktop' && m.title.includes('silent')).length, 1, 'silent past 15 minutes');
  await w.tick(NOW + 12 * MIN, { load: { load1: 4 } });
  assert.equal(w.sent.filter(([, m]) => m.title.includes('silent')).length, 2, 'desktop and ntfy, once');
  w.lane('P-2026-01-08-1100', { live: 1, log_mtime_ms: NOW + 12 * MIN });
  await w.tick(NOW + 13 * MIN, { load: { load1: 4 } });
  assert.match(w.status('lane_silent').join(), /episode@/);
  assert.equal(w.db.prepare("SELECT COUNT(*) AS n FROM notify_events WHERE rule = 'lane_silent' AND closed_ms IS NOT NULL").get().n, 1);
  const load = (v, i) => w.tick(NOW + (20 + i) * MIN, { load: { load1: v } });
  const before = w.sent.length;
  // Threshold 20: 21 opens, 18 (>= 17) keeps it open, 25 is the same episode, 16.9 closes, 21 opens again.
  for (const [i, v] of [21, 18, 25, 16.9, 21].entries()) await load(v, i);
  assert.deepEqual(w.sent.slice(before).map(([, m]) => m.body), ['host · load 21.0', 'host · load 21.0']);
});

test('scope filters apply to lane events: fronts and chats; a local override replaces the user row for its repository', async (t) => {
  const w = world(t, {
    user: { notifications: { events: { lane_started: { enabled: true, scope: { kind: 'fronts', values: ['jjodel'] }, channels: ['desktop'] } } } },
    local: { notifications: { events: { lane_done: { enabled: true, scope: { kind: 'chats', values: ['C-2026-01-08-1000'] }, channels: ['desktop'] } } } },
  });
  await w.tick();
  w.lane('P-2026-01-08-1200', { started_ms: NOW, last_outcome: 'done', log_mtime_ms: NOW, front: 'tack' });
  w.lane('P-2026-01-08-1201', { started_ms: NOW, last_outcome: 'done', log_mtime_ms: NOW, front: 'jjodel', chat: 'C-2026-01-08-0900' });
  await w.tick(NOW + MIN);
  assert.deepEqual(w.sent.map(([, m]) => `${m.title} ${m.body.split(' ')[0]}`).sort(), ['Tack - Lane done P-2026-01-08-1200', 'Tack - Lane started P-2026-01-08-1201']);
});

test('the lease: one holder per store, renewed by it, taken over when its heartbeat lapses', (t) => {
  const w = world(t);
  assert.equal(takeLease(w.db, 100, NOW), true);
  assert.equal(takeLease(w.db, 200, NOW + 30e3), false);
  assert.equal(takeLease(w.db, 100, NOW + 40e3), true);
  assert.equal(takeLease(w.db, 200, NOW + 90e3), false, 'renewed at +40 s, alive until +100 s');
  assert.equal(takeLease(w.db, 200, NOW + 101e3), true);
  releaseLease(w.db, 200);
  assert.equal(takeLease(w.db, 300, NOW + 102e3), true);
});

test('privacy: whatever a fact carries, only kind, unit, front, repository, outcome and link reach a transport', async (t) => {
  assert.deepEqual(MESSAGE_FIELDS, ['kind', 'unit', 'front', 'repo', 'outcome', 'link']);
  const m = buildMessage({ kind: 'lane_question', unit: 'P-1', front: 'tack', repo: 'jjodel', outcome: 'question', link: 'http://127.0.0.1:4710/', message: MARKER, prompt: MARKER, text: MARKER, chat: MARKER, notes: MARKER });
  assert.ok(!JSON.stringify(m).includes(MARKER));
  assert.deepEqual(m, { title: 'Tack - Lane asks a question', body: 'P-1 · tack · jjodel · question', click: 'http://127.0.0.1:4710/', urgent: true });
  assert.deepEqual(buildMessage({ kind: 'gate_red', unit: 'P-1', repo: 'jjodel', link: 'x' }, { privacy: { repoName: false, boardLink: false } }), { title: 'Tack - Gate red at merge', body: 'P-1', click: null, urgent: false });
  // End to end through the store: a marker in the lane's chat id (not a message field) never reaches the fake.
  const w = world(t);
  await w.tick();
  w.lane('P-2026-01-08-1300', { last_outcome: 'question', log_mtime_ms: NOW, chat: MARKER });
  await w.tick(NOW + MIN);
  assert.equal(w.sent.length, 2);
  assert.ok(!JSON.stringify(w.sent).includes(MARKER));
});

test('the desktop transport hands osascript a fixed script and the message as arguments, never a shell string', async () => {
  const calls = [];
  const execFile = (file, args, opts, cb) => { calls.push({ file, args, opts }); cb(null); };
  const hostile = { title: 'Tack - "; do shell script "rm -rf ~" --', body: '$(touch /tmp/pwned) `id` \' " \\', click: null, urgent: false };
  await desktopTransport({ execFile, platform: 'darwin' }).send(hostile);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].file, 'osascript');
  assert.ok(Array.isArray(calls[0].args));
  assert.deepEqual(calls[0].args.slice(0, 6), ['-e', 'on run argv', '-e', 'display notification (item 2 of argv) with title (item 1 of argv)', '-e', 'end run']);
  assert.deepEqual(calls[0].args.slice(6), [hostile.title, hostile.body], 'the text is an argument, not part of the script');
  assert.ok(!calls[0].opts.shell);
  assert.deepEqual(desktopArgs(hostile), calls[0].args);
  await assert.rejects(desktopTransport({ execFile, platform: 'linux' }).send(hostile), /macOS/);
  assert.equal(calls.length, 1);
});

test('the ntfy transport POSTs to server/topic with title, priority, click and token in headers', async () => {
  const req = ntfyRequest({ title: 'Tack - Lane blocked · x', body: 'P-1 · tack', click: 'http://127.0.0.1:4710/', urgent: true }, { server: 'https://ntfy.example/', topic: 'my topic', token: 'tk_abc' });
  assert.equal(req.url, 'https://ntfy.example/my%20topic');
  assert.deepEqual(req.init.headers, { Title: 'Tack - Lane blocked - x', Priority: '5', 'Content-Type': 'text/plain; charset=utf-8', Click: 'http://127.0.0.1:4710/', Authorization: 'Bearer tk_abc' });
  assert.equal(req.init.body, 'P-1 · tack');
  const seen = [];
  await ntfyTransport({ fetch: async (url, init) => { seen.push([url, init.method]); return { ok: true }; }, config: { server: 'https://ntfy.sh', topic: 't' } }).send({ title: 'a', body: 'b', urgent: false });
  assert.deepEqual(seen, [['https://ntfy.sh/t', 'POST']]);
  await assert.rejects(ntfyTransport({ fetch: async () => ({ ok: true }), config: { topic: null } }).send({ title: 'a', body: 'b' }), /no topic/);
});

test('the catalogue: 17 events, merge_conflict a disabled row with its reason, urgent on question and blocked', () => {
  assert.equal(CATALOGUE.length, 17);
  assert.deepEqual(CATALOGUE.filter((c) => c.disabled).map((c) => c.kind), ['merge_conflict']);
  assert.deepEqual(CATALOGUE.filter((c) => c.urgent).map((c) => c.kind), ['lane_question', 'lane_blocked']);
});

test('a hard-stop fires one of three events by its stop kind: breakpoint, ceiling, unplanned hard-stop', async (t) => {
  const w = world(t);
  await w.tick();
  w.lane('P-2026-01-08-3001', { last_outcome: 'hard-stop', stop_kind: 'breakpoint', log_mtime_ms: NOW });
  w.lane('P-2026-01-08-3002', { last_outcome: 'hard-stop', stop_kind: 'ceiling', log_mtime_ms: NOW });
  w.lane('P-2026-01-08-3003', { last_outcome: 'hard-stop', stop_kind: 'hard-stop', log_mtime_ms: NOW });
  w.lane('P-2026-01-08-3004', { last_outcome: 'hard-stop', stop_kind: null, log_mtime_ms: NOW });
  await w.tick(NOW + MIN);
  const titles = w.sent.filter(([ch]) => ch === 'desktop').map(([, m]) => `${m.title} | ${m.body.split(' · ')[0]}`).sort();
  assert.deepEqual(titles, [
    'Tack - Lane at a breakpoint (waits for a GO) | P-2026-01-08-3001',
    'Tack - Lane at the context ceiling (handoff written) | P-2026-01-08-3002',
    'Tack - Lane in hard-stop (unplanned) | P-2026-01-08-3003',
    'Tack - Lane in hard-stop (unplanned) | P-2026-01-08-3004',
  ], 'a lane not yet classed (stop_kind null) counts as unplanned');
  assert.deepEqual([w.status('lane_breakpoint').length, w.status('lane_ceiling').length, w.status('lane_hard_stop').length], [1, 1, 2]);
  assert.ok(w.sent.some(([, m]) => m.body.includes('breakpoint')), 'the message names the kind as its outcome');
});
