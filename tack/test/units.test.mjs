// Layer 2, the session-unit link: a session gets the unit of a commit reachable from its own branch, never
// one of a sibling branch made in the same minutes; the first user message is read for its unit id and
// never stored.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store/open.mjs';
import { scan, promptUnit } from '../src/collectors/claude-code/collect.mjs';
import { identify } from '../src/collectors/git/identity.mjs';
import { collectGit } from '../src/collectors/git/collect.mjs';
import { branchTips, linkUnits } from '../src/collectors/units.mjs';
import { T0, commit, g, initRepo } from './helpers/git-repo.mjs';
import { writeSession } from './helpers/layers-fixture.mjs';

const UA = 'P-2026-01-05-1100';
const UB = 'P-2026-01-05-1101';
const UC = 'P-2026-01-05-1200';
const UM = 'P-2026-01-05-1201';
const UPROMPT = 'P-2026-01-05-0900';
const MARKER = 'TACKUNITSMARKER-7b3f9c21';
const ms = (sec) => sec * 1000;

function world(t) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-units-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const store = join(dir, 'store.db');
  const db = openStore(store);
  t.after(() => db.isOpen && db.close());
  return { dir, db, store, projects: join(dir, 'projects') };
}

/** main with a root commit; featA and featB each commit once, ten seconds apart (the same minute). */
function siblings(dir) {
  const repo = initRepo(join(dir, 'repo'));
  commit(repo, { sec: T0, message: 'root', file: 'root.txt' });
  g(repo, ['checkout', '-q', '-b', 'featA']);
  const a = commit(repo, { sec: T0 + 3600, message: `work A\n\nUnit: ${UA}`, file: 'a.txt' });
  g(repo, ['checkout', '-q', 'main']);
  g(repo, ['checkout', '-q', '-b', 'featB']);
  const b = commit(repo, { sec: T0 + 3610, message: `work B\n\nUnit: ${UB}`, file: 'b.txt' });
  g(repo, ['checkout', '-q', 'main']);
  return { repo, a, b };
}

const pipeline = (db, projects) => {
  scan(db, projects);
  identify(db);
  collectGit(db);
  return linkUnits(db);
};
const unitOf = (db, id) => ({ ...db.prepare('SELECT unit, unit_source FROM sessions WHERE id = ?').get(id) });

test('two branches committing in the same minute: each session gets only its own branch unit', (t) => {
  const { dir, db, projects } = world(t);
  const { repo } = siblings(dir);
  // sA ends 12 s after A's commit, 2 s after B's: the nearest commit is B's, but B is not reachable from featA.
  writeSession(projects, { id: 'sA', cwd: repo, branch: 'featA', firstMs: ms(T0 + 3500), lastMs: ms(T0 + 3612) });
  // sB ends together with A's commit: the nearest commit is A's, but A is not reachable from featB.
  writeSession(projects, { id: 'sB', cwd: repo, branch: 'featB', firstMs: ms(T0 + 3500), lastMs: ms(T0 + 3600) });
  const st = pipeline(db, projects);
  assert.deepEqual(unitOf(db, 'sA'), { unit: UA, unit_source: 'commit' });
  assert.deepEqual(unitOf(db, 'sB'), { unit: UB, unit_source: 'commit' });
  assert.equal(st.commit, 2);
  // Positive control on the same data: both commits sit in each window, so only reachability separates them.
  const inWindow = db.prepare('SELECT unit FROM commits WHERE unit IS NOT NULL AND commit_time BETWEEN ? AND ? ORDER BY unit')
    .all(T0 + 3500, T0 + 3600 + 3600).map((r) => r.unit);
  assert.deepEqual(inWindow, [UA, UB]);
  // A second pass changes nothing.
  linkUnits(db);
  assert.deepEqual(unitOf(db, 'sA'), { unit: UA, unit_source: 'commit' });
});

test('a branch merged and deleted is still linked through the second parent of its merge commit', (t) => {
  const { dir, db, projects } = world(t);
  const { repo } = siblings(dir);
  g(repo, ['checkout', '-q', '-b', 'featC']);
  const c = commit(repo, { sec: T0 + 7200, message: `work C\n\nUnit: ${UC}`, file: 'c.txt' });
  g(repo, ['checkout', '-q', 'main']);
  commit(repo, { sec: T0 + 7205, message: `main work\n\nUnit: ${UM}`, file: 'm.txt' });
  g(repo, ['merge', '--no-ff', '-q', '-m', "Merge branch 'featC'", 'featC'], { sec: T0 + 7300 });
  g(repo, ['branch', '-q', '-d', 'featC']);
  assert.equal(g(repo, ['branch', '--list', 'featC']), '', 'the branch is gone');
  assert.ok(branchTips(join(repo, '.git')).get('featC').has(c), 'its tip survives as the merge second parent');
  // The main-line commit (5 s from the end) is nearer than C's (10 s) but is not on featC.
  writeSession(projects, { id: 'sC', cwd: repo, branch: 'featC', firstMs: ms(T0 + 7100), lastMs: ms(T0 + 7210) });
  pipeline(db, projects);
  assert.deepEqual(unitOf(db, 'sC'), { unit: UC, unit_source: 'commit' });
});

test('a session without a branch gets no unit, even with a unit commit in its window', (t) => {
  const { dir, db, projects } = world(t);
  const { repo } = siblings(dir);
  writeSession(projects, { id: 'sN', cwd: repo, branch: null, firstMs: ms(T0 + 3500), lastMs: ms(T0 + 3605) });
  const st = pipeline(db, projects);
  assert.deepEqual(unitOf(db, 'sN'), { unit: null, unit_source: null });
  assert.equal(st.noBranch, 1);
  assert.equal(st.commit, 0);
});

test('a unit set by the prompt is kept and is not replaced by a commit', (t) => {
  const { dir, db, projects } = world(t);
  const { repo } = siblings(dir);
  writeSession(projects, { id: 'sP', cwd: repo, branch: 'featB', firstMs: ms(T0 + 3500), lastMs: ms(T0 + 3600), userText: `[${UPROMPT}] do the thing` });
  const st = pipeline(db, projects);
  assert.deepEqual(unitOf(db, 'sP'), { unit: UPROMPT, unit_source: 'prompt' });
  assert.equal(st.prompt, 1);
});

test('promptUnit: a leading tag, a Prompt-ID header line before the first section, or none', () => {
  assert.equal(promptUnit(`[${UPROMPT}] do the thing`), UPROMPT);
  assert.equal(promptUnit(`  \n${UPROMPT} do the thing`), UPROMPT, 'a bare leading id, after blank space');
  assert.equal(promptUnit('[P-2026-01-05-0900-ab] suffixed'), 'P-2026-01-05-0900-ab');
  assert.equal(promptUnit(`Prompt-ID: ${UPROMPT}\n\n## Task\nbody`), UPROMPT);
  assert.equal(promptUnit(`# Title\nPrompt-ID: ${UPROMPT}\n\n## Task\nbody`), UPROMPT, 'a header line below a title, above the first section');
  assert.equal(promptUnit(`# Title\n\n## Task\nPrompt-ID: ${UPROMPT}`), null, 'a header line after the first section does not count');
  assert.equal(promptUnit('plain request, no id'), null);
  assert.equal(promptUnit(`${UPROMPT}x is not an id`), null);
  assert.equal(promptUnit(`see ${UPROMPT} later in the text`), null, 'an id that does not lead');
  assert.equal(promptUnit(undefined), null);
  assert.equal(promptUnit(42), null);
});

test('the first user message is never in the bytes of the store, -wal and -shm included; its unit id is', (t) => {
  const { dir, db, store, projects } = world(t);
  const { repo } = siblings(dir);
  const tagged = writeSession(projects, { id: 'sP', cwd: repo, branch: 'featB', firstMs: ms(T0 + 3500), lastMs: ms(T0 + 3600), userText: `[${UPROMPT}] please ${MARKER}` });
  const plain = writeSession(projects, { id: 'sA', cwd: repo, branch: 'featA', firstMs: ms(T0 + 3500), lastMs: ms(T0 + 3612), userText: `no tag here ${MARKER}` });
  pipeline(db, projects);
  const marker = Buffer.from(MARKER, 'utf8');
  const markerUtf16 = Buffer.from(MARKER, 'utf16le');
  const bytesOf = () => [store, store + '-wal', store + '-shm', store + '-journal'].filter(existsSync).map((f) => [f, readFileSync(f)]);
  // Positive control: the same search finds the marker in the transcripts and the unit id in the store.
  for (const f of [tagged, plain]) assert.notEqual(readFileSync(f).indexOf(marker), -1, `control: ${f}`);
  const check = () => {
    const files = bytesOf();
    assert.ok(files.length >= 1);
    for (const [f, b] of files) {
      assert.equal(b.indexOf(marker), -1, `marker found in ${f}`);
      assert.equal(b.indexOf(markerUtf16), -1, `marker (UTF-16) found in ${f}`);
    }
    assert.ok(files.some(([, b]) => b.indexOf(Buffer.from(UPROMPT, 'utf8')) !== -1), 'the unit id the store keeps is found by the same search');
  };
  check(); // the database open: the data may still sit in the -wal
  db.close();
  check();
});
