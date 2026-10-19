// The gate that matters most: the store keeps metadata only, never message text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openStore } from '../src/store/open.mjs';
import { COLUMN_SOURCES } from '../src/collectors/claude-code/collect.mjs';
import { GIT_COLUMN_SOURCES } from '../src/collectors/git/collect.mjs';
import { LANE_COLUMN_SOURCES } from '../src/collectors/lane-run/collect.mjs';
import { LOG_COLUMN_SOURCES } from '../src/collectors/log/collect.mjs';
import { T0, addTranscript, commit, g, initRepo } from './helpers/git-repo.mjs';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const TACK = here('../bin/tack.mjs');
const FIXTURE = here('./fixtures/claude-code/projects');
const MARKER = 'TACKPRIVACYMARKER-5d1e0a7c';

function filesUnder(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? filesUnder(p) : [p];
  });
}

test('positive control: the marker is in user text, assistant text, tool input and tool result of the fixture', () => {
  const records = filesUnder(FIXTURE).filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) => readFileSync(f, 'utf8').split('\n')).filter(Boolean)
    .flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const blocks = records.flatMap((r) => (Array.isArray(r.message?.content) ? r.message.content : []));
  assert.ok(records.some((r) => r.type === 'user' && typeof r.message.content === 'string' && r.message.content.includes(MARKER)), 'user text');
  assert.ok(blocks.some((b) => b.type === 'text' && b.text.includes(MARKER)), 'assistant text');
  assert.ok(blocks.some((b) => b.type === 'tool_use' && JSON.stringify(b.input).includes(MARKER)), 'tool input');
  assert.ok(blocks.some((b) => b.type === 'tool_result' && b.content.includes(MARKER)), 'tool result');
  assert.ok(records.some((r) => JSON.stringify(r.toolUseResult ?? '').includes(MARKER)), 'toolUseResult');
});

test('after tack scan the marker occurs nowhere in the bytes of the store, -wal and -shm included', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tack-privacy-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const store = join(dir, 'store.db');
  const r = spawnSync(process.execPath, [TACK, 'scan', '--root', FIXTURE, '--store', store], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /calls 6/);
  const files = [store, store + '-wal', store + '-shm', store + '-journal'].filter(existsSync);
  assert.ok(files.length >= 1);
  const marker = Buffer.from(MARKER, 'utf8');
  const markerUtf16 = Buffer.from(MARKER, 'utf16le');
  for (const f of files) {
    const bytes = readFileSync(f);
    assert.equal(bytes.indexOf(marker), -1, `marker found in ${f}`);
    assert.equal(bytes.indexOf(markerUtf16), -1, `marker (UTF-16) found in ${f}`);
  }
  // Positive control on the same bytes: a value the store does keep is found by the same search.
  assert.notEqual(readFileSync(store).indexOf(Buffer.from('/fx/beta/sub_dir', 'utf8')), -1);
  assert.ok(!r.stdout.includes(MARKER) && !r.stderr.includes(MARKER), 'marker printed by scan');
});

const FORBIDDEN = /(^|\.)(content|text|thinking|input|toolUseResult|lastPrompt|aiTitle|customTitle|summary|prompt|payload)(\.|$)/;

test('every column of every table has a declared source, and no source is message content', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tack-cols-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.close());
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all().map((r) => r.name);
  const sources = { ...COLUMN_SOURCES, ...GIT_COLUMN_SOURCES, ...LANE_COLUMN_SOURCES, ...LOG_COLUMN_SOURCES };
  assert.deepEqual(tables, Object.keys(sources).sort());
  for (const table of tables) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name).sort();
    assert.deepEqual(cols, Object.keys(sources[table]).sort(), `columns of ${table}`);
    for (const [col, src] of Object.entries(sources[table])) {
      assert.doesNotMatch(src, FORBIDDEN, `${table}.${col} is fed from ${src}`);
      if (table in GIT_COLUMN_SOURCES) assert.doesNotMatch(src, GIT_FORBIDDEN, `${table}.${col} is fed from ${src}`);
      if (table in LOG_COLUMN_SOURCES) assert.doesNotMatch(src, LOG_FORBIDDEN, `${table}.${col} is fed from ${src}`);
    }
  }
  // Signal check on the pattern itself.
  assert.match('message.content', FORBIDDEN);
  assert.match('toolUseResult', FORBIDDEN);
  assert.doesNotMatch('message.usage.input_tokens', FORBIDDEN);
  assert.match('%s', GIT_FORBIDDEN);
  assert.match('%an', GIT_FORBIDDEN);
  assert.match('numstat path', GIT_FORBIDDEN);
  assert.doesNotMatch('%at', GIT_FORBIDDEN);
});

// git format placeholders and fields that carry text or identity: subject, body, raw message,
// author and committer name and email, changed-file paths.
// Log entries: only the contract's enums, ids and dates; never the title, summary, finding, notes, files or detail.
const LOG_FORBIDDEN = /\b(title|summary|finding|notes|files|detail)\b/;
const GIT_FORBIDDEN = /%[sbBfN]|%[ac][nNeElL]|\b(subject|body|author name|email|numstat path|changed-file path)\b/;

const GIT_MARKER = 'TACKGITMARKER-9b3f6e21';

test('after tack scan of a repository, no commit subject, body, author, email or path occurs in the store bytes', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tack-privacy-git-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const repo = initRepo(join(dir, 'repo'));
  const root = commit(repo, {
    sec: T0, file: `dir-${GIT_MARKER}/f.txt`, author: { name: `Name ${GIT_MARKER}`, email: `${GIT_MARKER}@example.org` },
    message: `subject ${GIT_MARKER} (P-2026-01-05-1000)\n\nbody ${GIT_MARKER}\n\nUnit: P-2026-01-05-1000\nCo-Authored-By: Claude <noreply@anthropic.com>\n`,
  });
  // Positive control: the marker is in the subject, body, author, email and path of the repository.
  const shown = g(repo, ['log', '--all', '--name-only', '--format=%s%n%b%n%an%n%ae']);
  assert.equal(shown.split(GIT_MARKER).length - 1, 5);
  const projects = join(dir, 'projects');
  addTranscript(projects, 'sess-git', repo, T0, T0 + 60);
  const store = join(dir, 'store.db');
  const r = spawnSync(process.execPath, [TACK, 'scan', '--root', projects, '--store', store], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /git: rows added: commits 1;/);
  const shown2 = spawnSync(process.execPath, [TACK, 'repos', '--store', store, '--json'], { encoding: 'utf8' });
  const files = [store, store + '-wal', store + '-shm', store + '-journal'].filter(existsSync);
  for (const f of files) {
    const bytes = readFileSync(f);
    assert.equal(bytes.indexOf(Buffer.from(GIT_MARKER, 'utf8')), -1, `marker found in ${f}`);
    assert.equal(bytes.indexOf(Buffer.from(GIT_MARKER, 'utf16le')), -1, `marker (UTF-16) found in ${f}`);
  }
  // Positive control on the same bytes: the root commit sha and the unit id are kept.
  const bytes = readFileSync(store);
  assert.notEqual(bytes.indexOf(Buffer.from(root, 'utf8')), -1);
  assert.notEqual(bytes.indexOf(Buffer.from('P-2026-01-05-1000', 'utf8')), -1);
  for (const out of [r.stdout, r.stderr, shown2.stdout, shown2.stderr]) assert.ok(!out.includes(GIT_MARKER), 'marker printed');
});
