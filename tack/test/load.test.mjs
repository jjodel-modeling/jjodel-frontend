// Host load meter, schema 5, the board's slice-7 endpoints and the theme tokens. The ring keeps 60 samples and
// drops the oldest; one sample is stored per minute; zone colours at the threshold boundaries; lane ticks on the
// right bar; the light tokens are byte-identical to slice 6; /api/settings writes the right file and refuses
// project keys; the lane collector fills the schema-5 columns; a schema-4 store migrates in place.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SCHEMA_VERSION, openStore } from '../src/store/open.mjs';
import { RING, createSampler, laneTicks, storeMinute } from '../src/host/load.mjs';
import { collectLanes } from '../src/collectors/lane-run/collect.mjs';
import { collectUnpushed } from '../src/collectors/git/collect.mjs';
import { startBoard } from '../src/board/server.mjs';
import { loadViews } from './helpers/views.mjs';
import { resultEvent, assistantText, writeLane } from './helpers/layers-fixture.mjs';
import { commit, g, initRepo } from './helpers/git-repo.mjs';

const NOW = Date.parse('2026-01-08T12:00:00Z');
const MIN = 60e3;

function tmp(t) {
  const dir = mkdtempSync(join(tmpdir(), 'tack-load-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('the ring keeps the last 60 samples and drops the oldest', () => {
  let t = NOW, n = 0;
  const s = createSampler({ loadavg: () => [++n, n / 2, n / 4], cores: () => 8, running: () => 2, now: () => (t += 5000) });
  for (let i = 0; i < 75; i++) s.sample();
  const xs = s.samples();
  assert.equal(RING, 60);
  assert.equal(xs.length, 60);
  assert.deepEqual([xs[0].load1, xs.at(-1).load1], [16, 75]);
  assert.deepEqual(s.latest(), { t: NOW + 75 * 5000, load1: 75, load5: 37.5, load15: 18.75, cores: 8, running: 2 });
});

test('one stored sample per minute: the first sample of a minute is kept, the rest of it ignored', (t) => {
  const dir = tmp(t);
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.close());
  const m0 = Math.floor(NOW / MIN) * MIN;
  const at = (ms, v) => storeMinute(db, { t: ms, load1: v, load5: 1, load15: 1, cores: 8, running: 1 });
  assert.deepEqual([at(m0, 3), at(m0 + 5000, 4), at(m0 + 59_999, 5), at(m0 + MIN, 6), at(m0 + MIN + 1, 7)], [1, 0, 0, 1, 0]);
  assert.deepEqual(db.prepare('SELECT minute_ms, load1 FROM host_load ORDER BY minute_ms').all().map((r) => [r.minute_ms - m0, r.load1]), [[0, 3], [MIN, 6]]);
});

test('zone colours at the threshold boundaries: neutral below 85 %, amber from 85 % to the threshold inclusive, red above', () => {
  const { TackLoad: L } = loadViews(['loadmeter.js']);
  assert.deepEqual([16.99, 17, 19.99, 20, 20.01].map((v) => L.zone(v, 20)), ['neutral', 'amber', 'amber', 'amber', 'red']);
});

test('lane ticks land on the bar whose interval (previous sample, this sample] holds the event', (t) => {
  const { TackLoad: L } = loadViews(['loadmeter.js']);
  const times = [10_000, 15_000, 20_000];
  assert.deepEqual([5_001, 10_000, 10_001, 15_000, 19_999, 20_000, 20_001, 5_000].map((x) => L.tickBar(times, x)), [0, 0, 1, 1, 2, 2, -1, -1]);
  const samples = times.map((x, i) => ({ t: x, load1: [5, 18, 30][i], load5: 1, load15: 1, cores: 4, running: i }));
  const svg = L.stripSvg({ samples, threshold: 20, ticks: [{ t: 12_000, kind: 'start' }, { t: 99_000, kind: 'end' }] });
  assert.deepEqual([...svg.matchAll(/class="lm-b lm-(\w+)" x="(\d+)"/g)].map((m) => `${m[1]}@${m[2]}`), ['neutral@171', 'amber@174', 'red@177'], 'right-aligned to 60 slots');
  assert.deepEqual([...svg.matchAll(/class="lm-t lm-(\w+)" x="(\d+)"/g)].map((m) => `${m[1]}@${m[2]}`), ['start@174'], 'the tick sits above the second bar; an event outside the strip has none');
  assert.match(svg, /<line class="lm-th"/);
  assert.match(svg, /<title>load 18\.00 \/ 1\.00 \/ 1\.00 · lanes running 1<\/title>/);
  const per = L.stripSvg({ samples, threshold: 20, normalised: true, cores: 4 });
  assert.match(per, /load 7\.50 \/ 0\.25 \/ 0\.25 per core/);
  assert.deepEqual([...per.matchAll(/lm-b lm-(\w+)/g)].map((m) => m[1]), ['red', 'neutral', 'red'].map((_, i) => L.zone([5, 18, 30][i] / 4, 5)));
  // laneTicks from the store, in (from, to].
  const dir = tmp(t);
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.close());
  const ins = db.prepare("INSERT INTO lanes (id, live, runs, outcome, blocked_run, over_time, corrective, cache_key, started_ms, end_ms) VALUES (?, 0, 1, 'none', 0, 0, 0, '', ?, ?)");
  ins.run('P-2026-01-08-0001', 12_000, 18_000);
  ins.run('P-2026-01-08-0002', 1_000, null);
  assert.deepEqual(laneTicks(db, 5_000, 20_000), [{ t: 12_000, kind: 'start' }, { t: 18_000, kind: 'end' }]);
});

const LIGHT = `:root{color-scheme:light;--t-side:#F7F7F8;--t-content:#FFFFFF;--t-panel:#FBFBFC;--t-panel2:#FFFFFF;--t-head:#F7F7F8;--t-line:#ECEDF0;--t-line2:#E5E6EA;--t-line3:#D9DAE0;
--t-text:#16171B;--t-text2:#5D616B;--t-muted:#80848E;--t-accent:#5B63D6;--t-link:#4B53C6;--t-accent-dim:#C9CCF2;--t-done:#2E9E66;--t-wait:#B7791F;--t-block:#D64541;
--t-sel:#ECECEF;--t-hover:#F2F2F4;--t-tag:#EFEFF2;
--f-opus:#2a78d6;--f-sonnet:#eb6834;--f-haiku:#1baf7a;--f-other:#6250d6;--f-unattributed:#A3A6AE}`;

test('theme tokens: the light block is byte-identical to slice 6 (25 tokens); dark, system and high-contrast are keyed on data-theme', () => {
  const css = readFileSync(new URL('../src/board/board.css', import.meta.url), 'utf8');
  assert.ok(css.includes('\n' + LIGHT + '\n'), 'the light block');
  assert.equal(LIGHT.match(/--[a-z0-9-]+:/g).length, 25);
  assert.equal(css.indexOf(':root{color-scheme:light;'), css.lastIndexOf(':root{color-scheme:light;'), 'one plain :root token block');
  assert.match(css, /@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme\]\),:root\[data-theme=system\]\{color-scheme:dark;/);
  assert.match(css, /:root\[data-theme=dark\]\{color-scheme:dark;--t-side:#0C0D0F;/);
  assert.match(css, /:root\[data-theme=high-contrast\]\{/);
  assert.match(css, /:root\[data-density=compact\]/);
  assert.match(css, /:root\[data-motion=reduce\] \.spin/);
  assert.match(css, /\.app\{zoom:var\(--font-scale,1\)\}/);
});

test('schema 4 to 5: additive, the lanes rows kept and marked for one re-read, the new tables empty', (t) => {
  const dir = tmp(t);
  const path = join(dir, 'store.db');
  const v4 = new DatabaseSync(path);
  for (const f of ['schema.sql', 'schema-2.sql', 'schema-3.sql', 'schema-4.sql']) v4.exec(readFileSync(new URL(`../src/store/${f}`, import.meta.url), 'utf8'));
  v4.exec('PRAGMA user_version = 4');
  v4.prepare("INSERT INTO lanes (id, live, runs, outcome, blocked_run, over_time, corrective, cache_key) VALUES ('P-2026-01-01-0000', 0, 1, 'done', 0, 0, 0, 'k')").run();
  v4.prepare("INSERT INTO repos (key, roots, common_dirs, toplevels, remote, state) VALUES ('R', '[]', '[]', '[]', NULL, 'present')").run();
  v4.close();
  const db = openStore(path);
  t.after(() => db.close());
  assert.ok(SCHEMA_VERSION >= 5);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
  const lane = db.prepare('SELECT * FROM lanes').get();
  assert.deepEqual([lane.id, lane.outcome, lane.cache_key, lane.turns, lane.front], ['P-2026-01-01-0000', 'done', '', null, null]);
  assert.equal(db.prepare('SELECT unpushed FROM repos').get().unpushed, null);
  for (const tb of ['notify_events', 'notify_baseline', 'notify_lease', 'host_load']) assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${tb}`).get().n, 0);
});

test('the lane collector fills the schema-5 columns; over_time follows limits.laneMinutes of the repository', (t) => {
  const dir = tmp(t);
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.close());
  const root = join(dir, 'lanes');
  const prompt = join(dir, 'prompt.md');
  writeFileSync(prompt, '# T\n\nPrompt-ID: P-2026-01-08-1000\nChat: C-2026-01-08-0900\nFront: tack\n\n## COSA\nFront: other\n');
  const d = writeLane(root, 'P-2026-01-08-1000', { started: NOW - 3 * 3600e3, exitAt: NOW, tier: 'heavy',
    events: [assistantText('x\nOutcome: question'), resultEvent({ ms: 100 * MIN, usd: 1, text: 'x\nOutcome: question' }), assistantText('Outcome: done'), resultEvent({ ms: 5 * MIN, usd: 2, text: 'Outcome: done' })] });
  writeFileSync(join(d, 'prompt.txt'), prompt + '\n');
  writeFileSync(join(d, 'goahead.txt'), 'go\n');
  writeFileSync(join(d, 'result.json'), JSON.stringify({ ok: false, gates: [{ name: 'test', ok: false }, { name: 'build', ok: true }] }));
  collectLanes(db, root, NOW, { limitMs: () => 120 * MIN });
  const r = db.prepare('SELECT * FROM lanes').get();
  assert.deepEqual([r.turns, r.last_outcome, r.critical, r.front, r.chat, r.merge_state, r.gates_red, r.over_time], [2, 'done', 1, 'tack', 'C-2026-01-08-0900', 'red', 1, 0]);
  assert.ok(r.log_mtime_ms > 0);
  db.exec("UPDATE lanes SET cache_key = ''");
  collectLanes(db, root, NOW, { limitMs: () => 90 * MIN });
  assert.equal(db.prepare('SELECT over_time FROM lanes').get().over_time, 1, 'a 100-minute turn is over a 90-minute limit');
});

test('collectUnpushed: commits on local branches no remote-tracking ref has; null without a remote', (t) => {
  const dir = tmp(t);
  const up = join(dir, 'up');
  initRepo(up);
  commit(up, { message: 'one' });
  g(dir, ['clone', '-q', up, 'down']);
  const down = join(dir, 'down');
  commit(down, { message: 'two', file: 'b.txt' });
  commit(down, { message: 'three', file: 'c.txt' });
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.close());
  const ins = db.prepare("INSERT INTO repos (key, roots, common_dirs, toplevels, remote, state) VALUES (?, '[]', ?, '[]', NULL, 'present')");
  ins.run('DOWN', JSON.stringify([join(down, '.git')]));
  ins.run('UP', JSON.stringify([join(up, '.git')]));
  const st = collectUnpushed(db);
  assert.deepEqual([st.repos, st.counted, st.errors], [2, 1, 0]);
  assert.deepEqual(db.prepare('SELECT key, unpushed FROM repos ORDER BY key').all().map((r) => [r.key, r.unpushed]), [['DOWN', 2], ['UP', null]]);
});

test('board: /settings carries the theme attributes, /api/settings writes the user file or tack.local.json, project keys are 403, /api/load serves the ring', async (t) => {
  const dir = tmp(t);
  const user = join(dir, 'home', 'settings.json');
  const top = join(dir, 'repo');
  initRepo(top);
  commit(top, { message: 'one' });
  writeFileSync(join(top, '.gitignore'), 'tack.local.json\n');
  writeFileSync(join(top, 'tack.json'), JSON.stringify({ load: { threshold: 12 } }));
  const store = join(dir, 'store.db');
  const db = openStore(store);
  db.prepare("INSERT INTO repos (key, roots, common_dirs, toplevels, remote, state) VALUES ('abcdef0123456789', '[]', '[]', ?, NULL, 'present')").run(JSON.stringify([top]));
  db.close();
  let n = 0;
  const sampler = createSampler({ loadavg: () => [++n, 1, 1], cores: () => 8, now: () => NOW + n * 5000 });
  for (let i = 0; i < 3; i++) sampler.sample();
  const sent = [];
  const b = await startBoard({ store, root: join(dir, 'none'), cwd: dir, port: 0, scanOnStart: false, user, sampler,
    transports: { desktop: { send: async (m) => sent.push(m) }, ntfy: { send: async () => { throw new Error('no topic'); } } } });
  t.after(() => b.close());
  const post = (path, body) => fetch(b.url + path.slice(1), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  let page = await (await fetch(b.url + 'settings')).text();
  assert.match(page, /<html lang="en" data-theme="system" data-density="comfortable" data-motion="system" style="--font-scale:1">/);
  assert.match(page, /data-tab="settings"/);
  let r = await post('/api/settings', { target: 'user', key: 'appearance.theme', value: 'dark' });
  assert.equal(r.status, 200);
  assert.equal(JSON.parse(readFileSync(user, 'utf8')).appearance.theme, 'dark');
  page = await (await fetch(b.url)).text();
  assert.match(page, /data-theme="dark"/);
  r = await post('/api/settings', { repo: 'abcdef01', target: 'local', key: 'notifications.events.gate_red', value: { enabled: false, channels: ['desktop'] } });
  const body = await r.json();
  assert.equal(r.status, 200, JSON.stringify(body));
  assert.equal(body.written, join(top, 'tack.local.json'));
  assert.deepEqual(JSON.parse(readFileSync(join(top, 'tack.local.json'), 'utf8')), { notifications: { events: { gate_red: { enabled: false, channels: ['desktop'] } } } });
  assert.equal(body.keys.find((k) => k.key === 'notifications.events.gate_red').source, 'local');
  assert.equal(body.files.local.ignored, true);
  assert.equal(body.warning, null);
  const before = readFileSync(join(top, 'tack.json'), 'utf8');
  r = await post('/api/settings', { repo: 'abcdef01', target: 'project', key: 'load.threshold', value: 30 });
  assert.equal(r.status, 403);
  r = await post('/api/settings', { repo: 'abcdef01', target: 'local', key: 'load.threshold', value: 30 });
  assert.equal(r.status, 403, 'a project key is read-only in the board at any target');
  r = await post('/api/settings', { target: 'user', key: 'channels.ntfy', value: { enabled: true, topic: 'x y' } });
  assert.equal(r.status, 400);
  assert.equal(readFileSync(join(top, 'tack.json'), 'utf8'), before, 'tack.json is never written');
  r = await post('/api/settings', { repo: 'abcdef01', target: 'local', key: 'notifications.events.gate_red', op: 'reset' });
  assert.equal((await r.json()).keys.find((k) => k.key === 'notifications.events.gate_red').source, 'default');
  const s = await (await fetch(b.url + 'api/settings?repo=abcdef01')).json();
  assert.equal(s.keys.find((k) => k.key === 'load.threshold').value, 12);
  assert.equal(s.catalogue.length, 15);
  const load = await (await fetch(b.url + 'api/load?repo=abcdef01')).json();
  assert.deepEqual([load.samples.length, load.threshold, load.cores, load.normalised], [3, 12, 8, false]);
  r = await post('/api/notify-test', { channel: 'desktop' });
  assert.equal(r.status, 200);
  assert.deepEqual(sent.map((m) => m.title), ['Tack - test']);
  r = await post('/api/notify-test', { channel: 'ntfy' });
  assert.equal(r.status, 502);
  assert.equal(b.watcher, null, 'startBoard leaves the notifier off unless asked');
  assert.ok(!existsSync(join(top, 'tack.json.tmp-' + process.pid)));
});
