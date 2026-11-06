import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CELL_MAX, fit, tableLines, toplevelsCell } from '../src/cli/table.mjs';

const TACK = fileURLToPath(new URL('../bin/tack.mjs', import.meta.url));
const HEAD = ['repo', 'state', 'toplevels', 'remote', 'commits'];

test('a repository with 40 toplevels is one line: the first toplevel and a count of the others', () => {
  const tops = Array.from({ length: 40 }, (_, i) => `/Users/x/repo-${i}`);
  const lines = tableLines([HEAD, ['abcdef012345', 'present', toplevelsCell(tops), '-', '12']]);
  assert.equal(lines.length, 2);
  assert.match(lines[1], /\/Users\/x\/repo-0 \+39 more\s+-\s+12$/);
  assert.ok(!lines[1].includes('repo-1'));
});

test('a 300-character path is cut to 60 visible characters, its tail and the count kept', () => {
  const long = '/Users/x/' + 'd'.repeat(280) + '/the-repo';
  assert.equal(long.length > 290, true);
  const one = toplevelsCell([long]);
  assert.equal([...one].length, CELL_MAX);
  assert.ok(one.startsWith('…') && one.endsWith('/the-repo'));
  const two = toplevelsCell([long, '/tmp/b']);
  assert.equal([...two].length, CELL_MAX);
  assert.ok(two.endsWith('/the-repo +1 more'));
  const lines = tableLines([HEAD, ['abcdef012345', 'present', two, '-', '3']]);
  for (const line of lines) assert.ok([...line].length <= 12 + 2 + 7 + 2 + CELL_MAX + 2 + 6 + 2 + 7, line);
});

test('every column is capped at 60 characters and padded from visible content', () => {
  const lines = tableLines([['a', 'b'], ['x'.repeat(200), 'éé'], ['y', 'z']]);
  assert.equal(lines[0], 'a' + ' '.repeat(CELL_MAX - 1) + '  b');
  assert.equal([...lines[1]].length, CELL_MAX + 2 + 2);
  assert.equal(lines[2], 'y' + ' '.repeat(CELL_MAX - 1) + '  z');
  assert.equal(fit('a\nb'), 'a?b');
  assert.equal(toplevelsCell([]), '-');
});

test('tack --version prints the version of package.json', () => {
  const r = spawnSync(process.execPath, [TACK, '--version'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(version, '0.1.0');
  assert.equal(r.stdout, '0.1.0\n');
});
