// tack board, first run from a repository with no recorded session (P-2026-10-21-1500): the start work tree
// is preselected as unrecorded, every tab's route answers empty for it and carries no row of another
// repository; started outside a git work tree the board keeps its earlier behaviour (all repositories).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startBoard } from '../src/board/server.mjs';
import { noSessionLine } from '../src/board/api.mjs';
import { loadViews } from './helpers/views.mjs';
import { T0, addTranscript, commit, g, initRepo } from './helpers/git-repo.mjs';

let dir, first, second, projects, firstKey, secondKey, board;
const opts = () => ({ store: join(dir, 'store.db'), root: projects, port: 0, sample: false, laneRoot: join(dir, 'lanes') });

before(async () => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-first-run-')));
  first = initRepo(join(dir, 'first'));
  commit(first, { sec: T0, file: 'f.txt' });
  firstKey = g(first, ['rev-list', '--max-parents=0', '--all']);
  second = initRepo(join(dir, 'second'));
  commit(second, { sec: T0 + 60, file: 's.txt' });
  secondKey = g(second, ['rev-list', '--max-parents=0', '--all']);
  projects = join(dir, 'projects');
  addTranscript(projects, 'sess-first-1', first, T0 - 300, T0 + 60);
  addTranscript(projects, 'sess-first-2', first, T0 + 86400, T0 + 86400 + 120);
  mkdirSync(join(second, 'sub'));
  board = await startBoard({ ...opts(), cwd: join(second, 'sub') });
});

after(async () => {
  await board?.close();
  rmSync(dir, { recursive: true, force: true });
});

const getJson = async (b, path) => {
  const r = await fetch(b.url + path.replace(/^\//, ''));
  return { status: r.status, body: await r.json() };
};
const noFirst = (body) => {
  const text = JSON.stringify(body);
  for (const x of [firstKey, firstKey.slice(0, 12), 'sess-first-1', 'sess-first-2', first]) assert.ok(!text.includes(x), `${x} in ${text.slice(0, 200)}`);
};

test('started from a work tree with no session, the board preselects it, marked unrecorded', async () => {
  assert.equal(board.preselected, secondKey);
  assert.deepEqual(board.unrecorded, { key: secondKey, name: 'second', toplevel: second, unrecorded: true });
  const { status, body } = await getJson(board, '/api/repos');
  assert.equal(status, 200);
  assert.equal(body.preselected, secondKey);
  assert.deepEqual(body.unrecorded, board.unrecorded);
  // «All repositories» stays selectable: the stored repository is still listed for the picker.
  assert.deepEqual(body.repos.map((r) => r.key), [firstKey]);
});

test('the routes behind Lanes, Sessions, Timeline and Insights answer empty for it, with no row of the other repository', async () => {
  const q = `repo=${secondKey}`;
  const s = await getJson(board, `/api/sessions?${q}`);
  assert.equal(s.status, 200);
  assert.equal(s.body.repo, secondKey);
  assert.deepEqual(s.body.sessions, []);
  const tl = await getJson(board, `/api/timeline?${q}`);
  assert.deepEqual(tl.body.sessions, []);
  const m = await getJson(board, `/api/metrics?${q}`);
  assert.equal(m.body.sessions, 0);
  const l = await getJson(board, `/api/lanes?${q}`);
  assert.equal(l.status, 200);
  assert.equal(l.body.state, 'empty');
  assert.equal(l.body.reason, 'No Claude Code sessions recorded for second yet.');
  // A key prefix selects it too, as for a stored repository.
  assert.deepEqual((await getJson(board, `/api/sessions?repo=${secondKey.slice(0, 8)}`)).body.sessions, []);
  for (const b of [s.body, tl.body, m.body, l.body]) noFirst(b);
});

test('«All repositories» still answers every repository, and an unknown key is still refused', async () => {
  const all = await getJson(board, '/api/sessions?repo=all');
  assert.deepEqual(all.body.sessions.map((x) => x.id).sort(), ['sess-first-1', 'sess-first-2']);
  const bad = await getJson(board, '/api/sessions?repo=abcdef12');
  assert.equal(bad.status, 400);
});

test('the page and the API say the same line', () => {
  const v = loadViews();
  assert.equal(v.TackBoard.noSessionLine('second'), noSessionLine('second'));
});

test('a work tree with no commit yet is preselected too, by a key of its toplevel', async (t) => {
  const empty = initRepo(join(dir, 'empty'));
  const b = await startBoard({ ...opts(), cwd: empty, scanOnStart: false });
  t.after(() => b.close());
  assert.match(b.preselected, /^[0-9a-f]{40}$/);
  assert.equal(b.unrecorded.name, 'empty');
  assert.deepEqual((await getJson(b, `/api/sessions?repo=${b.preselected}`)).body.sessions, []);
});

test('started from a work tree the store holds, nothing is marked unrecorded', async (t) => {
  const b = await startBoard({ ...opts(), cwd: first, scanOnStart: false });
  t.after(() => b.close());
  assert.equal(b.preselected, firstKey);
  assert.equal(b.unrecorded, null);
  assert.equal((await getJson(b, '/api/repos')).body.unrecorded, null);
});

test('started outside a git work tree, the current behaviour stays: nothing preselected, all repositories', async (t) => {
  const plain = join(dir, 'plain');
  mkdirSync(plain);
  const b = await startBoard({ ...opts(), cwd: plain, scanOnStart: false });
  t.after(() => b.close());
  assert.equal(b.preselected, null);
  assert.equal(b.unrecorded, null);
  const r = (await getJson(b, '/api/repos')).body;
  assert.equal(r.preselected, null);
  assert.equal(r.unrecorded, null);
  assert.equal((await getJson(b, `/api/sessions?repo=${secondKey}`)).status, 400);
});
