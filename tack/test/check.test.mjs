import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateText, STRUCTURAL_RULES, REFERENTIAL_RULES } from '../src/contract/validate.mjs';
import { unitFromCommit } from '../src/contract/linkage.mjs';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const TACK = here('../bin/tack.mjs');
const VALID = here('./fixtures/valid.jsonl');
const INVALID_DIR = here('./fixtures/invalid/');

test('every entry of valid.jsonl passes', () => {
  const { entries, violations } = validateText(readFileSync(VALID, 'utf8'));
  assert.equal(entries, 10);
  assert.deepEqual(violations, []);
});

test('valid.jsonl covers every outcome, both entry types and a suffixed unit', () => {
  const es = readFileSync(VALID, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual([...new Set(es.filter((e) => e.type === 'task').map((e) => e.outcome))].sort(), ['completed', 'partial', 'problems']);
  assert.ok(es.some((e) => e.type === 'ticket'));
  assert.ok(es.some((e) => e.corrects));
  assert.ok(es.some((e) => /-[a-z0-9]+-[a-z0-9]+$/.test(e.unit ?? '') && e.unit.split('-').length === 6));
});

const invalidFiles = readdirSync(INVALID_DIR).filter((f) => f.endsWith('.jsonl')).sort();

test('there are at least ten invalid fixtures', () => {
  assert.ok(invalidFiles.length >= 10, `found ${invalidFiles.length}`);
});

for (const file of invalidFiles) {
  const expected = file.replace(/\.jsonl$/, '');
  test(`invalid/${file} fails with exactly the rule ${expected}`, () => {
    const { violations } = validateText(readFileSync(INVALID_DIR + file, 'utf8'));
    assert.deepEqual(violations.map((v) => v.rule), [expected], JSON.stringify(violations));
    const [v] = violations;
    assert.equal(typeof v.line, 'number');
    assert.equal(typeof v.field, 'string');
    assert.equal(typeof v.message, 'string');
  });
}

test('every rule has exactly one invalid fixture named after it', () => {
  // 17 structural + 4 referential functions, plus json-syntax raised by the line parser.
  assert.equal(STRUCTURAL_RULES.length + REFERENTIAL_RULES.length + 1, invalidFiles.length);
});

test('CLI: exit 0 on the valid fixture', () => {
  const r = spawnSync(process.execPath, [TACK, 'check', VALID], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /10 entries, no violations/);
});

test('CLI: exit 1 and one "file:line field rule: message" line per violation', () => {
  const file = INVALID_DIR + 'outcome-enum.jsonl';
  const r = spawnSync(process.execPath, [TACK, 'check', file], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  const out = r.stdout.trim().split('\n');
  assert.equal(out.length, 1);
  assert.match(out[0], /outcome-enum\.jsonl:1 outcome outcome-enum: /);
});

test('CLI: unknown subcommand prints usage and exits 2', () => {
  const r = spawnSync(process.execPath, [TACK, 'frobnicate'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage: tack/);
});

test('CLI: missing file exits 2', () => {
  const r = spawnSync(process.execPath, [TACK, 'check', here('./fixtures/nope.jsonl')], { encoding: 'utf8' });
  assert.equal(r.status, 2);
});

test('linkage: trailer, subject suffix, trailer wins, none', () => {
  assert.equal(unitFromCommit('feat: x\n\nbody\n\nUnit: P-2026-03-02-0900\nModel: m'), 'P-2026-03-02-0900');
  assert.equal(unitFromCommit('feat(x): y (P-2026-03-02-1000)'), 'P-2026-03-02-1000');
  assert.equal(unitFromCommit('feat: y (P-2026-03-02-1000)\n\nUnit: P-2026-03-02-0900'), 'P-2026-03-02-0900');
  assert.equal(unitFromCommit('feat: y (P-2026-03-02-1000-ab12)'), 'P-2026-03-02-1000-ab12');
  assert.equal(unitFromCommit('feat: no link'), null);
  assert.equal(unitFromCommit('feat: mid (P-2026-03-02-1000) text'), null);
});
