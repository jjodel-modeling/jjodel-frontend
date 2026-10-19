// tack board: the JSON API over a store built from the synthetic fixtures of slices 2-3, the
// repository preselection, the layer-2/3 states, an idempotent rescan, the Sessions rules (unit or
// branch, the name of a hash-named repository), the Timeline geometry, the privacy of every response
// and of the HTML each tab renders, and a start that writes nothing in the work tree it is started from.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startBoard } from '../src/board/server.mjs';
import { displayName, listBoardRepos, sessionsApi, timelineApi, unitNear } from '../src/board/api.mjs';
import { openStore } from '../src/store/open.mjs';
import { loadViews } from './helpers/views.mjs';
import { T0, addTranscript, commit, g, initRepo } from './helpers/git-repo.mjs';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const TACK = here('../bin/tack.mjs');
const FIXTURE = here('./fixtures/claude-code/projects');
const MARKER = 'TACKPRIVACYMARKER-5d1e0a7c';
const GIT_MARKER = 'TACKGITMARKER-9b3f6e21';

let dir, repo, wt, sub, projects, key, board;

before(async () => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-board-')));
  repo = initRepo(join(dir, 'repo'));
  commit(repo, {
    sec: T0, file: `dir-${GIT_MARKER}/f.txt`, author: { name: `Name ${GIT_MARKER}`, email: `${GIT_MARKER}@example.org` },
    message: `subject ${GIT_MARKER}\n\nbody ${GIT_MARKER}\n`,
  });
  commit(repo, { sec: T0 + 600, file: 'sub/x.txt' });
  sub = join(repo, 'sub');
  wt = join(dir, 'repo-wt');
  g(repo, ['worktree', 'add', '-q', '-b', 'feat', wt]);
  key = g(repo, ['rev-list', '--max-parents=0', '--all']);
  projects = join(dir, 'projects');
  cpSync(FIXTURE, projects, { recursive: true });
  addTranscript(projects, 'sess-board-1', sub, T0 - 300, T0 + 60); // commit at T0 + 600: within the hour
  addTranscript(projects, 'sess-board-2', wt, T0 + 86400, T0 + 86400 + 120); // a day later, no commit after
  const plain = join(dir, 'plain');
  mkdirSync(plain);
  addTranscript(projects, 'sess-board-3', plain, T0, T0 + 60); // not in a git work tree
  board = await startBoard({ store: join(dir, 'store.db'), root: projects, cwd: wt, port: 0 });
});

after(async () => {
  await board?.close();
  rmSync(dir, { recursive: true, force: true });
});

async function get(path, init) {
  const r = await fetch(board.url + path.replace(/^\//, ''), init);
  return { status: r.status, text: await r.text() };
}
const getJson = async (path, init) => {
  const r = await get(path, init);
  return { status: r.status, body: JSON.parse(r.text) };
};

test('started inside a linked worktree, the board preselects its main repository', async () => {
  assert.equal(board.preselected, key);
  const { status, body } = await getJson('/api/repos');
  assert.equal(status, 200);
  assert.equal(body.preselected, key);
  const r = body.repos.find((x) => x.key === key);
  assert.deepEqual(Object.keys(r).sort(), ['commits', 'key', 'name', 'remote_host', 'sessions', 'state', 'toplevel', 'worktrees']);
  assert.deepEqual([r.name, r.toplevel, r.worktrees, r.state, r.sessions, r.commits, r.remote_host], ['repo', repo, 2, 'present', 4, 2, '-']);
});

test('a linked worktree with no session of its own still preselects its repository (by root commit, not by toplevel)', async (t) => {
  const wt2 = join(dir, 'repo-wt2');
  g(repo, ['worktree', 'add', '-q', '-b', 'feat2', wt2]);
  t.after(() => g(repo, ['worktree', 'remove', '--force', wt2]));
  const b = await startBoard({ store: join(dir, 'store.db'), root: projects, cwd: join(wt2, 'sub'), port: 0, scanOnStart: false });
  t.after(() => b.close());
  assert.equal(b.preselected, key);
});

test('started outside a git work tree, nothing is preselected', async (t) => {
  const b = await startBoard({ store: join(dir, 'store.db'), root: projects, cwd: dir, port: 0, scanOnStart: false });
  t.after(() => b.close());
  assert.equal(b.preselected, null);
  const r = await fetch(b.url + 'api/repos').then((x) => x.json());
  assert.equal(r.preselected, null);
  assert.equal(r.repos.length, 1);
});

test('/api/sessions: one row per session, newest first, with the declared fields', async () => {
  const { status, body } = await getJson('/api/sessions');
  assert.equal(status, 200);
  assert.deepEqual(Object.keys(body).sort(), ['days', 'layer2', 'repo', 'sessions', 'since', 'threshold', 'until']);
  assert.equal(body.layer2, false);
  assert.equal(body.threshold, 200000);
  assert.equal(body.sessions.length, 5); // two fixture transcripts of slice 2, two in the repository, one outside git
  const starts = body.sessions.map((s) => s.start);
  assert.deepEqual(starts, [...starts].sort().reverse());
  const s1 = body.sessions.find((s) => s.id === 'sess-board-1');
  assert.deepEqual(Object.keys(s1).sort(), ['branch', 'calls', 'commit_within_hour', 'context_peak', 'cost_partial', 'cost_usd', 'day',
    'duration_min', 'id', 'link', 'missing', 'models', 'repo', 'repo_name', 'start', 'unit']);
  assert.deepEqual([s1.repo, s1.repo_name, s1.link, s1.calls, s1.context_peak, s1.duration_min, s1.cost_usd, s1.commit_within_hour, s1.unit],
    [key, 'repo', 'direct', 2, 1, 6, null, 'yes', null]);
  assert.deepEqual(s1.models, ['claude-fixture-3']);
  assert.equal(body.sessions.find((s) => s.id === 'sess-board-2').commit_within_hour, 'no');
  // The slice-2 fixtures have a cwd that is gone and the branch main: linked by inference (slice 4).
  const fx = body.sessions.filter((s) => s.id.length === 36);
  assert.deepEqual(fx.map((s) => [s.repo, s.link, s.branch, s.missing]), [[key, 'branch', 'main', null], [key, 'branch', 'main', null]]);
  assert.deepEqual(fx.map((s) => s.cost_usd).sort(), [0.25, null]); // unknown cost stays null, never 0
  const none = body.sessions.find((s) => s.id === 'sess-board-3');
  assert.deepEqual([none.repo, none.repo_name, none.link, none.missing, none.commit_within_hour], [null, null, 'none', 'not-a-git-work-tree', 'unknown']);
});

test('/api/sessions filters by repository and by day, and refuses a malformed parameter', async () => {
  const only = await getJson(`/api/sessions?repo=${key.slice(0, 8)}`);
  assert.deepEqual(only.body.sessions.map((s) => s.id).sort(), ['aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'sess-board-1', 'sess-board-2']);
  assert.equal(only.body.repo, key);
  const day2 = only.body.sessions.find((s) => s.id === 'sess-board-2').day;
  const since = await getJson(`/api/sessions?repo=${key}&since=${day2}`);
  assert.ok(since.body.sessions.some((s) => s.id === 'sess-board-2'));
  assert.ok(since.body.sessions.every((s) => s.day >= day2 && s.id !== 'sess-board-1'));
  const until = await getJson(`/api/sessions?repo=all&until=${only.body.sessions.find((s) => s.id === 'sess-board-1').day}`);
  assert.ok(until.body.sessions.every((s) => s.id !== 'sess-board-2'));
  assert.equal((await getJson('/api/sessions?repo=../etc')).status, 400);
  assert.equal((await getJson('/api/sessions?since=yesterday')).status, 400);
  assert.equal((await getJson('/api/sessions?repo=ffff')).status, 400);
  assert.equal((await getJson('/api/nothing')).status, 404);
});

test('/api/metrics: layer 1 computed with a value, layers 2 and 3 not-adopted without one', async () => {
  const { status, body } = await getJson(`/api/metrics?repo=${key}`);
  assert.equal(status, 200);
  assert.equal(body.sessions, 4);
  const by = Object.fromEntries(body.metrics.map((m) => [m.name, m]));
  for (const m of body.metrics) {
    assert.ok([1, 2, 3].includes(m.layer), m.name);
    if (m.layer === 1) {
      assert.equal(m.state, 'computed', m.name);
      assert.ok('value' in m, m.name);
    } else {
      assert.equal(m.state, 'not-adopted', m.name);
      assert.ok(!('value' in m), m.name);
      assert.ok(m.enabledBy, m.name);
    }
  }
  assert.equal(body.metrics.filter((m) => m.layer > 1).length, 8);
  assert.equal(by.sessions_per_day.value.total, 4);
  const rows = (await getJson(`/api/sessions?repo=${key}`)).body.sessions;
  assert.equal(by.commit_proximity.value.total.yes, rows.filter((s) => s.commit_within_hour === 'yes').length);
  assert.equal(by.commit_proximity.value.total.no, rows.filter((s) => s.commit_within_hour === 'no').length);
});

test('/api/health: store, schema, last scan and counts', async () => {
  const { status, body } = await getJson('/api/health');
  assert.equal(status, 200);
  assert.equal(body.store, join(dir, 'store.db'));
  assert.equal(body.schema, 3);
  assert.equal(body.lastScan.ok, true);
  assert.ok(!Number.isNaN(Date.parse(body.lastScan.at)));
  assert.deepEqual(body.counts, { transcripts: 6, sessions: 5, calls: 12, repos: 1, commits: 2 });
});

test('POST /api/rescan is idempotent: no row added, the same sessions; GET is refused', async () => {
  const before = (await get('/api/sessions')).text;
  const r1 = await getJson('/api/rescan', { method: 'POST' });
  const r2 = await getJson('/api/rescan', { method: 'POST' });
  for (const r of [r1, r2]) {
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.lastScan.added, { sessions: 0, calls: 0, modelCosts: 0, repos: 0, links: 0, commits: 0 });
  }
  assert.equal((await get('/api/sessions')).text, before);
  assert.equal((await getJson('/api/rescan')).status, 405);
  assert.equal((await getJson('/api/health')).body.lastScan.at, r2.body.lastScan.at);
});

test('a foreign Host or a cross-site Origin is refused', async () => {
  const raw = (headers, method = 'GET') => new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port: board.port, path: '/api/rescan', method, headers }, (res) => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject);
    req.end();
  });
  assert.equal(await raw({ host: `evil.example:${board.port}` }), 421);
  assert.equal(await raw({ host: `127.0.0.1:${board.port}`, origin: 'http://evil.example' }, 'POST'), 403);
  assert.equal(await raw({ host: `localhost:${board.port}` }), 405); // the Host is fine, the method is not
});

test('/api/timeline: per session the last event, the family, the threshold crossing and the commit ticks within the hour', async () => {
  const { status, body } = await getJson(`/api/timeline?repo=${key}`);
  assert.equal(status, 200);
  assert.deepEqual(Object.keys(body).sort(), ['repo', 'sessions', 'since', 'threshold', 'until']);
  const s1 = body.sessions.find((s) => s.id === 'sess-board-1');
  assert.deepEqual(Object.keys(s1).sort(), ['commits', 'crossed', 'end', 'family', 'id', 'start']);
  assert.deepEqual([s1.start, s1.end, s1.family, s1.crossed], [(T0 - 300) * 1000, (T0 + 60) * 1000, 'other', null]);
  assert.deepEqual(s1.commits, [T0 * 1000, (T0 + 600) * 1000]);
  assert.deepEqual(body.sessions.find((s) => s.id === 'sess-board-2').commits, [], 'no commit within the hour of the later session');
  const all = await getJson('/api/timeline');
  assert.deepEqual(all.body.sessions.find((s) => s.id === 'sess-board-3').commits, [], 'no repository, no tick');
  const day2 = (await getJson(`/api/sessions?repo=${key}`)).body.sessions.find((s) => s.id === 'sess-board-2').day;
  assert.deepEqual((await getJson(`/api/timeline?repo=${key}&since=${day2}&until=${day2}`)).body.sessions.map((s) => s.id), ['sess-board-2']);
  assert.equal((await getJson('/api/timeline?until=19-10-2026')).status, 400);
});

test('/api/metrics honours until like /api/sessions, and splits the known cost by model family', async () => {
  const rows = (await getJson(`/api/sessions?repo=${key}`)).body.sessions;
  const day1 = rows.find((s) => s.id === 'sess-board-1').day;
  const m = (await getJson(`/api/metrics?repo=${key}&until=${day1}`)).body;
  assert.equal(m.until, day1);
  assert.equal(m.sessions, rows.filter((s) => s.day <= day1).length);
  const cost = m.metrics.find((x) => x.name === 'cost_per_day').value;
  const fam = Object.values(cost.total.families ?? {}).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(fam - cost.total.usd) < 1e-9, 'the families add up to the known cost');
});

function sessionsStore(t) {
  const d = mkdtempSync(join(tmpdir(), 'tack-units-'));
  const db = openStore(join(d, 'store.db'));
  t.after(() => { db.close(); rmSync(d, { recursive: true, force: true }); });
  const repoRow = (k, toplevel) => db.prepare("INSERT INTO repos (key, roots, common_dirs, toplevels, remote, state) VALUES (?, ?, '[]', ?, NULL, 'present')").run(k, JSON.stringify([k]), JSON.stringify(toplevel ? [toplevel] : []));
  const session = (id, k, first, last, branch) => {
    db.prepare("INSERT INTO sessions (id, file_id, cwd, first_ts, last_ts, git_branch) VALUES (?, 0, '/cwd', ?, ?, ?)").run(id, new Date(first * 1000).toISOString(), new Date(last * 1000).toISOString(), branch);
    db.prepare("INSERT INTO session_repo (session_id, repo_key, missing, link_method) VALUES (?, ?, NULL, 'direct')").run(id, k);
  };
  let n = 0;
  const commitRow = (k, sec, unit = null) => db.prepare(`INSERT INTO commits (repo_key, sha, parents, author_time, commit_time, files, insertions, deletions, unit, unit_form, claude_coauthor)
    VALUES (?, ?, 1, ?, ?, 0, 0, 0, ?, ?, 0)`).run(k, 'sha' + ++n, sec, sec, unit, unit ? 'suffix' : null);
  return { db, repoRow, session, commitRow };
}

test('Sessions rules: with unit ids in the repository, the unit of the nearest commit within the hour; otherwise the branch', (t) => {
  const { db, repoRow, session, commitRow } = sessionsStore(t);
  const U = 'aaaa1111aaaa1111', P = 'bbbb2222bbbb2222', T = 1_767_000_000;
  repoRow(U, '/w/withunits');
  repoRow(P, '/w/plain');
  session('u1', U, T, T + 600, 'lane-x');
  commitRow(U, T + 300, 'P-2026-01-01-0900'); // 5 min before the last event
  commitRow(U, T + 3000, 'P-2026-01-01-1000'); // 40 min after it: farther
  commitRow(U, T + 600 + 7200, 'P-2026-01-01-1100'); // outside the hour
  session('u2', U, T + 10_800, T + 11_100, 'lane-y');
  commitRow(U, T + 10_900); // a commit, no unit
  session('p1', P, T, T + 600, 'main');
  commitRow(P, T + 300);
  const rows = Object.fromEntries(sessionsApi(db).sessions.map((s) => [s.id, s]));
  assert.deepEqual([rows.u1.unit, rows.u1.branch], ['P-2026-01-01-0900', 'lane-x']);
  assert.deepEqual([rows.u2.unit, rows.u2.branch], [null, 'lane-y'], 'a repository with unit ids, a session without one nearby: the branch');
  assert.deepEqual([rows.p1.unit, rows.p1.branch], [null, 'main']);
  assert.equal(unitNear(db, { repo_key: U, first_ts: null, last_ts: null }), null);
  // The page's rule, run as the page runs it.
  const { TackBoard: B } = loadViews(['charts.js', 'board.js']);
  assert.deepEqual({ ...B.unitOrBranch(rows.u1) }, { kind: 'unit', text: 'P-2026-01-01-0900' });
  assert.deepEqual({ ...B.unitOrBranch(rows.u2) }, { kind: 'branch', text: 'lane-y' });
  assert.deepEqual({ ...B.unitOrBranch({ unit: null, branch: null }) }, { kind: null, text: null });
  const cell = (s) => /<td class="c">(.*?)<\/td>/.exec(B.sessionRow(s, 200000))[1];
  assert.match(cell(rows.u1), /<span class="unit"[^>]*>P-2026-01-01-0900<\/span>/);
  assert.match(cell(rows.p1), />main<\/span>/);
});

test('a repository named by a bare hash takes the folder that holds it, else (unnamed) and the short key', (t) => {
  assert.equal(displayName('/Users/x/Projects/Jjodel Book/678e1c12660f5f6b2e85fe7b', 'b315626200de6d12'), 'Jjodel Book');
  assert.equal(displayName('/r/jjodel', '5bc8862e428b2651'), 'jjodel');
  assert.equal(displayName('/678e1c12660f5f6b2e85fe7b', 'b315626200de6d12'), '(unnamed) b3156262');
  assert.equal(displayName('/a/0123456789abcdef/678e1c12660f5f6b2e85fe7b', 'b315626200de6d12'), '(unnamed) b3156262');
  assert.equal(displayName(null, 'b315626200de6d12'), '(unnamed) b3156262');
  const { db, repoRow } = sessionsStore(t);
  repoRow('cccc3333cccc3333', '/w/Book/678e1c12660f5f6b2e85fe7b');
  repoRow('dddd4444dddd4444', null);
  assert.deepEqual(listBoardRepos(db).map((r) => r.name), ['Book', '(unnamed) dddd4444']);
});

test('privacy: no fixture marker, session cwd below a toplevel or transcript path in any response or in the HTML of any tab', async () => {
  const paths = ['/', `/?repo=${key}`, '/board.css', '/charts.js', '/board.js', '/timeline.js', '/insights.js', '/api/repos', '/api/sessions', `/api/sessions?repo=${key}`, '/api/metrics',
    `/api/metrics?repo=${key}`, '/api/timeline', `/api/timeline?repo=${key}`, '/api/health', '/api/nothing', '/api/sessions?repo=zz'];
  const bodies = await Promise.all(paths.map((p) => get(p).then((r) => r.text)));
  bodies.push((await get('/api/rescan', { method: 'POST' })).text);
  // The HTML each tab draws from those responses, rendered by the page's own scripts.
  const V = loadViews();
  for (const q of ['', `?repo=${key}`]) {
    const [sess, tl, met] = await Promise.all(['/api/sessions', '/api/timeline', '/api/metrics'].map((p) => getJson(p + q).then((r) => r.body)));
    const t0 = Math.min(...tl.sessions.map((g) => g.start)) - 86400e3, t1 = Math.max(...tl.sessions.map((g) => g.end)) + 86400e3;
    bodies.push(sess.sessions.map((s) => V.TackBoard.sessionRow(s, sess.threshold)).join(''));
    bodies.push(V.TackTimeline.html({ rows: sess.sessions, geo: tl.sessions, zoom: 'week', t0, t1, byBranch: q !== '', threshold: tl.threshold }));
    bodies.push(tl.sessions.map((g) => V.TackTimeline.popHtml(sess.sessions.find((s) => s.id === g.id), g, tl.threshold)).join(''));
    bodies.push(V.TackInsights.html(met));
  }
  const all = bodies.join('\n');
  for (const needle of [MARKER, GIT_MARKER, sub, '/fx/beta/sub_dir', '/fx/alpha', projects, 'Fixture Author', 'fixture@example.org']) {
    assert.ok(!all.includes(needle), `${needle} found in a response`);
  }
  // Positive control on the same text: values the API does return are found by the same search.
  for (const needle of ['sess-board-1', 'aaaaaaaa-0000-4000-8000-000000000001', key, repo, 'claude-fixture-3']) assert.ok(all.includes(needle), needle);
  const views = bodies.slice(paths.length + 1).join('\n');
  for (const needle of ['data-id="sess-board-1"', 'class="tl-s', 'Layer 1 · cost_per_day', 'Not adopted: needs', 'fixture-3']) assert.ok(views.includes(needle), needle);
});

const status = (cwd) => g(cwd, ['status', '--porcelain=v1', '--ignored', '--untracked-files=all']);

test('tack board --no-open writes nothing inside the work tree it is started from', async (t) => {
  const store = join(dir, 'cli-store.db');
  const beforeRepo = status(repo);
  const beforeWt = status(wt);
  const child = spawn(process.execPath, [TACK, 'board', '--no-open', '--port', '0', '--store', store, '--root', projects], { cwd: wt, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => child.kill('SIGKILL'));
  let out = '';
  const url = await new Promise((resolve, reject) => {
    child.stdout.on('data', (d) => {
      out += d;
      const m = /tack board on (http:\/\/127\.0\.0\.1:\d+\/)[^]*\nrepository: /.exec(out);
      if (m) resolve(m[1]);
    });
    child.on('exit', (code) => reject(new Error(`exited ${code}: ${out}`)));
  });
  assert.match(out, new RegExp(`repository: ${key.slice(0, 12)}`));
  const h = await fetch(url + 'api/health').then((r) => r.json());
  assert.equal(h.counts.sessions, 5);
  await fetch(url + 'api/rescan', { method: 'POST' });
  const code = await new Promise((resolve) => { child.removeAllListeners('exit'); child.on('exit', resolve); child.kill('SIGTERM'); });
  assert.equal(code, 0);
  assert.equal(status(repo), beforeRepo);
  assert.equal(status(wt), beforeWt);
  // Signal check: the same status command sees a file written in the work tree.
  const probe = join(wt, 'probe.txt');
  writeFileSync(probe, 'x');
  assert.notEqual(status(wt), beforeWt);
  unlinkSync(probe);
});
