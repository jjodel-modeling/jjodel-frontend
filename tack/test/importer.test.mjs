// The Jjodel log importer: markdown entries (CLAUDE.md 21.2) -> contract v1 lines. Field mapping, duplicate
// units, the rejection counts by rule, what never reaches the output, and the refusal to write in the repository.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { convert, entryType, importJjodelLog, parseFields, splitLog, toContract } from '../src/importers/jjodel-log.mjs';
import { validateText } from '../src/contract/validate.mjs';
import { T0, commit, g, initRepo } from './helpers/git-repo.mjs';

const FILES_MARK = 'FILESMARK-31ab.ts';
const NOTES_MARK = 'NOTESMARK-92cd';
const LIR_MARK = 'LIRMARK-47ef';
const SMOKE_MARK = 'SMOKEMARK-58aa';

/** One task entry in the log's format; fields override the defaults, a null field is left out. */
function task(heading, f = {}) {
  const v = {
    Prompt: 'summary of the prompt', 'Files touched': FILES_MARK, Outcome: '\u2705 completed', Corregge: '—', Causa: '—',
    Regressions: 'no', 'Out-of-scope changes': 'no', 'Layer Impact Report': `not-required ${LIR_MARK}`,
    'Smoke visivo': `passato ${SMOKE_MARK}`, Notes: `a note ${NOTES_MARK}`, ...f,
  };
  const body = Object.entries(v).filter(([, x]) => x !== null).map(([k, x]) => `**${k}**: ${x}`).join('\n');
  return `## ${heading}\n${body}\n`;
}

const ticket = (heading, f = {}) => {
  const v = { Ticket: 'the finding', Priority: 'high', 'Found in': 'P-2026-09-24-1200', ...f };
  return `## ${heading}\n${Object.entries(v).filter(([, x]) => x !== null).map(([k, x]) => `**${k}**: ${x}`).join('\n')}\n`;
};

const parse = (md) => convert(splitLog(md));
const lines = (res) => res.lines.map((l) => JSON.parse(l));
const byUnit = (res, unit) => lines(res).find((e) => e.unit === unit);

test('splitLog and parseFields: entries by heading, the first occurrence of a field wins', () => {
  const md = `# Log header, dropped\n\n${task('2026-01-06 — task: one (P-2026-01-06-0900)')}\n${task('2026-01-05 — task: two (P-2026-01-05-0900)', { Prompt: 'two' })}`;
  const raws = splitLog(md);
  assert.equal(raws.length, 2);
  assert.deepEqual(raws.map((r) => r.date), ['2026-01-06', '2026-01-05']);
  assert.equal(parseFields(`${raws[0].text}\n**Prompt**: again`).get('Prompt'), 'summary of the prompt');
});

test('entryType: the colon ticket heading counts from 2026-09-24, earlier it is a task', () => {
  const head = (h) => ({ heading: `## ${h}`, date: h.slice(0, 10) });
  assert.equal(entryType(head('2026-09-25 — ticket: stale cache')), 'ticket');
  assert.equal(entryType(head('2026-09-23 — ticket: stale cache')), 'task');
  assert.equal(entryType(head('2026-09-25 — task: stale cache')), 'task');
});

test('a task entry: Italian field names and the Outcome emoji map to the contract fields', () => {
  const [raw] = splitLog(task('2026-01-06 — feature: add the thing (P-2026-01-06-1000)', {
    Outcome: '\u26a0\ufe0f partial', Causa: '(c) wrong assumption', Corregge: 'P-2026-01-06-0900 (the first try)', Regressions: 'unknown', 'Out-of-scope changes': 'yes — one file',
  }));
  assert.deepEqual(toContract(raw), {
    contract: 1, type: 'task', date: '2026-01-06', title: 'add the thing (P-2026-01-06-1000)', kind: 'feature', unit: 'P-2026-01-06-1000',
    summary: 'summary of the prompt', outcome: 'partial', corrects: 'P-2026-01-06-0900', cause: 'c', regressions: 'unknown', out_of_scope: true,
  });
  const outcome = (o) => toContract(splitLog(task('2026-01-06 — task: x (P-2026-01-06-1000)', { Outcome: o }))[0]).outcome;
  assert.deepEqual([outcome('\u2705 completed'), outcome('\u26a0\ufe0f partial'), outcome('\u274c problems'), outcome('done')], ['completed', 'partial', 'problems', undefined]);
});

test('the unit comes from the heading id, else from the Prompt document name; Corregge from an id, a time stamp or a dash', () => {
  const t = (heading, f) => toContract(splitLog(task(heading, f))[0]);
  assert.equal(t('2026-01-06 — task: x', { 'Prompt document name': '2026-01-06 10:00' }).unit, 'P-2026-01-06-1000');
  assert.equal(t('2026-01-06 — task: x (P-2026-01-06-0800)', { 'Prompt document name': '2026-01-06 10:00' }).unit, 'P-2026-01-06-0800', 'the heading id wins');
  assert.equal(t('2026-01-06 — task: x', {}).unit, undefined);
  assert.equal(t('2026-01-06 — task: x (P-2026-01-06-1000)', { Corregge: '2026-01-06 09:00' }).corrects, 'P-2026-01-06-0900');
  assert.equal(t('2026-01-06 — task: x (P-2026-01-06-1000)', { Corregge: 'claude_2026-01-06_0930_fix.md' }).corrects, 'P-2026-01-06-0930');
  assert.equal(t('2026-01-06 — task: x (P-2026-01-06-1000)', { Corregge: '— nothing' }).corrects, null);
  const cause = (c) => t('2026-01-06 — task: x (P-2026-01-06-1000)', { Causa: c }).cause;
  assert.deepEqual([cause('(a)'), cause('b'), cause('— '), cause('(z)')], ['a', 'b', null, null]);
});

test('a ticket entry: finding, priority, found_in and detail', () => {
  const [raw] = splitLog(ticket('2026-09-25 — ticket: stale cache', { Priority: 'Medium (soon)', Detail: 'docs/discovery/x.md' }));
  assert.deepEqual(toContract(raw), {
    contract: 1, type: 'ticket', date: '2026-09-25', title: 'stale cache', finding: 'the finding', priority: 'medium',
    found_in: 'P-2026-09-24-1200', detail: 'docs/discovery/x.md',
  });
});

test('convert: a unit with several task entries keeps its id on the oldest, the later ones get -2, -3', () => {
  // The file is newest first: the entry above is the later one.
  const md = [
    task('2026-01-06 — task: third (P-2026-01-06-1000)', { Outcome: '\u26a0\ufe0f partial', Causa: '(b)', Corregge: 'P-2026-01-06-1000' }),
    task('2026-01-06 — task: second (P-2026-01-06-1000)', { Outcome: '\u26a0\ufe0f partial', Causa: '(a)', Corregge: 'P-2026-01-06-1000' }),
    task('2026-01-06 — task: first (P-2026-01-06-1000)'),
  ].join('\n');
  const res = parse(md);
  assert.equal(res.converted, 3);
  assert.deepEqual(lines(res).map((e) => [e.title.split(' ')[0], e.unit]), [['first', 'P-2026-01-06-1000'], ['second', 'P-2026-01-06-1000-2'], ['third', 'P-2026-01-06-1000-3']]);
  assert.deepEqual(lines(res).map((e) => e.corrects), [null, 'P-2026-01-06-1000', 'P-2026-01-06-1000'], 'every corrects resolves to the oldest');
  assert.deepEqual(res.rejected, {});
});

test('convert: rejection counts by rule, and the entries around them survive', () => {
  const md = [
    task('2026-01-06 — task: unit-less'), // no id, no Prompt document name
    task('2026-01-06 — task: empty summary (P-2026-01-06-1100)', { Prompt: '' }),
    task('2026-01-06 — task: partial without a cause (P-2026-01-06-1200)', { Outcome: '\u26a0\ufe0f partial' }),
    task('2026-01-06 — task: cause on a clean task (P-2026-01-06-1300)', { Causa: '(b)' }),
    task('2026-01-06 — task: corrects a ghost (P-2026-01-06-1400)', { Causa: '(d)', Corregge: 'P-2026-01-01-0800' }),
    task('2026-01-06 — task: good one (P-2026-01-06-0900)'),
    task('2026-01-06 — task: good two (P-2026-01-06-1500)', { Outcome: '\u274c problems', Causa: '(c)', Corregge: 'P-2026-01-06-0900' }),
  ].join('\n');
  const res = parse(md);
  assert.equal(res.read, 7);
  assert.equal(res.converted, 2);
  assert.deepEqual(res.rejected, { 'unit-required': 1, 'field-required': 1, 'cause-required': 1, 'cause-forbidden': 1, 'corrects-unresolved': 1 });
  assert.deepEqual(lines(res).map((e) => e.unit), ['P-2026-01-06-0900', 'P-2026-01-06-1500']);
});

test('convert: a log entry that fails the contract does not take a later correct one down with it', () => {
  // The ghost task is dropped; the task correcting the good one still resolves.
  const md = [
    task('2026-01-06 — task: corrects good (P-2026-01-06-1600)', { Outcome: '\u26a0\ufe0f partial', Causa: '(a)', Corregge: 'P-2026-01-06-0900' }),
    task('2026-01-06 — task: ghost (P-2026-01-06-1000)', { Prompt: '' }),
    task('2026-01-06 — task: good (P-2026-01-06-0900)'),
  ].join('\n');
  const res = parse(md);
  assert.deepEqual(res.rejected, { 'field-required': 1 });
  assert.equal(byUnit(res, 'P-2026-01-06-1600').corrects, 'P-2026-01-06-0900');
});

test('the output keeps no Files touched, Notes, Layer Impact Report or Smoke visivo text and passes validateText', () => {
  const md = [
    ticket('2026-09-25 — ticket: stale cache TITLEKEPT', { Detail: 'docs/d.md' }),
    task('2026-01-06 — task: add TITLEKEPT (P-2026-01-06-0900)'),
    task('2026-01-06 — task: second (P-2026-01-06-1000)', { Outcome: '\u274c problems', Causa: '(e)', Corregge: 'P-2026-01-06-0900' }),
  ].join('\n');
  const input = splitLog(md).map((r) => r.text).join('\n');
  const out = convert(splitLog(md)).lines.join('\n');
  for (const m of [FILES_MARK, NOTES_MARK, LIR_MARK, SMOKE_MARK]) {
    assert.ok(input.includes(m), `control: ${m} is in the input`);
    assert.ok(!out.includes(m), `${m} leaked into the output`);
  }
  assert.ok(out.includes('TITLEKEPT'), 'control: the same search finds what the output does keep');
  assert.deepEqual(validateText(out).violations, []);
  assert.equal(validateText(out).entries, 3);
});

/** A repository whose branch `trunk` holds docs/claude-code-log.md; the work tree is on another branch. */
function trunkRepo(dir) {
  const repo = initRepo(join(dir, 'repo'));
  commit(repo, { sec: T0, message: 'root', file: 'root.txt' });
  g(repo, ['checkout', '-q', '-b', 'trunk']);
  const log = [
    task('2026-01-06 — task: second (P-2026-01-06-1000)', { Outcome: '\u26a0\ufe0f partial', Causa: '(a)', Corregge: 'P-2026-01-06-0900' }),
    task('2026-01-06 — task: first (P-2026-01-06-0900)'),
  ].join('\n');
  commit(repo, { sec: T0 + 60, message: 'log', file: 'docs/claude-code-log.md', content: `# Log\n\n${log}` });
  g(repo, ['checkout', '-q', 'main']);
  return repo;
}

test('importJjodelLog refuses an --out inside the repository and writes nothing there', (t) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-import-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const repo = trunkRepo(dir);
  const refused = (out) => {
    const r = importJjodelLog({ repo, out, trunk: 'trunk' });
    assert.match(r.error ?? '', /^refusing to write inside the repository: /, out);
    return r;
  };
  refused(join(repo, 'log.jsonl'));
  refused(join(repo, 'sub', 'deeper', 'log.jsonl')); // a directory that does not exist yet
  assert.ok(!existsSync(join(repo, 'sub')), 'the refusal creates no directory');
  assert.ok(!existsSync(join(repo, 'log.jsonl')));
  symlinkSync(repo, join(dir, 'alias'));
  refused(join(dir, 'alias', 'log.jsonl')); // reached through a link
  assert.ok(!existsSync(join(repo, 'log.jsonl')));
  // Positive control: the same import into a directory beside the repository goes through.
  const out = join(dir, 'imports', 'k', 'log.jsonl');
  const ok = importJjodelLog({ repo, out, trunk: 'trunk' });
  assert.equal(ok.error, undefined);
  assert.equal(ok.out, out);
  assert.equal(ok.read, 2);
  assert.equal(ok.converted, 2);
  assert.deepEqual(validateText(readFileSync(out, 'utf8')).violations, []);
});

test('importJjodelLog: an unknown trunk or a directory outside any repository is an error, not a file', (t) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-import-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const repo = trunkRepo(dir);
  const out = join(dir, 'imports', 'log.jsonl');
  assert.match(importJjodelLog({ repo, out, trunk: 'nope' }).error, /^no ref nope/);
  mkdirSync(join(dir, 'plain'));
  assert.match(importJjodelLog({ repo: join(dir, 'plain'), out, trunk: 'trunk' }).error, /is not inside a git work tree/);
  assert.ok(!existsSync(out));
});

// Bug (src/collectors/git/run.mjs git()): a --repo path that does not exist makes spawnSync fail with ENOENT,
// git() rethrows, and importJjodelLog throws instead of returning `is not inside a git work tree`.
// `tack import jjodel-log --repo /nowhere` ends in an uncaught exception with a stack trace.
test('importJjodelLog: a repository path that does not exist is an error value, not an exception', (t) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'tack-import-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = importJjodelLog({ repo: join(dir, 'nowhere'), out: join(dir, 'out.jsonl'), trunk: 'trunk' });
  assert.match(r.error, /is not inside a git work tree/);
});
