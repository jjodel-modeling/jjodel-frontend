import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncBuiltinESMExports } from 'node:module';
import childProcess from 'node:child_process';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import { evaluate, project } from '../rules.mjs';
import { sha256, readAuthorized, MAX_BYTES } from '../sources.mjs';
import { VERDICTS, serialize } from '../contract.mjs';
import { runCli } from '../cli.mjs';

const fixturePath = fs.realpathSync(new URL('./fixtures.json', import.meta.url));
const fixtureBytes = fs.readFileSync(fixturePath);
const fixtures = JSON.parse(fixtureBytes);
const fresh = (id = 'synthetic-collision') => structuredClone(fixtures.cases.find(item => item.id === id).record);
const verdict = record => evaluate(record).result.verdict;
function replaceText(record, id, text) {
  const source = record.sources.find(item => item.id === id);
  const old = source.text;
  source.text = text;
  source.sha256 = sha256(text);
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (value.source === id && value.quote === old) value.quote = text;
    for (const child of Object.values(value)) visit(child);
  }
  visit(record);
}

test('collision with different attested outcomes is incompatible', () => {
  const result = evaluate(fresh()).result;
  assert.equal(result.verdict, 'incompatible');
  assert.deepEqual(result.capabilities_applied, ['L0', 'L1']);
  assert.equal(result.finding.evidence.projection_sha256.valid, result.finding.evidence.projection_sha256.invalid);
});
test('negative: retained information distinguishes inputs', () => {
  const record = fresh(); record.rule.projection = 'identity_text';
  assert.equal(verdict(record), 'consistent');
});
test('negative: a missing line yields different coverage', () => {
  const record = fresh(); replaceText(record, 'invalid', 'A');
  assert.equal(verdict(record), 'consistent');
});
test('coverage preserves multiplicity and strips trailing spaces', () => {
  assert.notDeepEqual(project('A', 'line_occurrence_coverage', 'A\nA'), project('A\nA', 'line_occurrence_coverage', 'A\nA'));
  assert.deepEqual(project('A \nB\t', 'line_occurrence_coverage', 'A\nB'), project('B\nA', 'line_occurrence_coverage', 'A\nB'));
});
for (const field of ['requirement', 'strategy', 'counterexample', 'expected_result', 'sources', 'rule']) {
  test(`missing ${field} is incomplete`, () => { const record = fresh(); delete record[field]; assert.equal(verdict(record), 'incomplete'); });
}
for (const value of [null, undefined, [], 'text', 42]) {
  test(`invalid top-level ${String(value)} is incomplete`, () => assert.equal(verdict(value), 'incomplete'));
}
for (const claim of ['faithful_projection', 'different_expected_results', 'no_other_information']) {
  test(`uncertain ${claim} abstains`, () => {
    const record = fresh(); record.rule.support[claim].status = 'unknown';
    const output = evaluate(record).result;
    assert.equal(output.verdict, 'indeterminate'); assert.equal(output.recommendation, 'L2_recommended');
    assert.deepEqual(output.capabilities_applied, ['L0']);
  });
}
test('unresolvable support quote cannot justify incompatibility', () => {
  const record = fresh(); record.rule.support.faithful_projection.ref.quote = 'not present';
  assert.equal(verdict(record), 'indeterminate');
});
test('equal expected outcomes abstain', () => {
  const record = fresh(); record.expected_result.invalid = record.expected_result.valid;
  assert.equal(verdict(record), 'indeterminate');
});
test('missing expected labels is incomplete', () => {
  const record = fresh(); delete record.expected_result.valid; assert.equal(verdict(record), 'incomplete');
});
test('unsupported rule recommends L2 without executing it', () => {
  const record = fresh(); record.rule.name = 'eval';
  assert.equal(verdict(record), 'indeterminate'); assert.equal(evaluate(record).overhead.llm_usage, 0);
});
test('unsupported projection abstains', () => {
  const record = fresh(); record.rule.projection = '(()=>process.exit())()'; assert.equal(verdict(record), 'indeterminate');
});
test('unknown parameters rejected', () => {
  const record = fresh(); record.rule.command = 'ignored command'; assert.equal(verdict(record), 'incomplete');
});
test('projection requires reference', () => {
  const record = fresh(); delete record.rule.reference; assert.equal(verdict(record), 'incomplete');
});
test('different counterexample binding abstains', () => {
  const record = fresh(); record.rule.invalid = record.rule.valid; assert.equal(verdict(record), 'indeterminate');
});
test('bad source hash is incomplete', () => {
  const record = fresh(); record.sources[0].sha256 = '0'.repeat(64); assert.equal(verdict(record), 'incomplete');
});
test('duplicate source identity is incomplete', () => {
  const record = fresh(); record.sources[1].id = record.sources[0].id; assert.equal(verdict(record), 'incomplete');
});
test('missing reference and invalid offsets are incomplete', () => {
  const record = fresh(); record.requirement.ref.source = 'unknown'; assert.equal(verdict(record), 'incomplete');
  record.requirement.ref = { ...record.strategy.ref, start: -1 }; assert.equal(verdict(record), 'incomplete');
});
test('non-applicable is distinct and requires a reason', () => {
  assert.equal(verdict({ schema_version: '1', activation: 'not_applicable', reason: 'no explicit counterexample' }), 'not_applicable');
  assert.equal(verdict({ schema_version: '1', activation: 'not_applicable' }), 'incomplete');
});
test('temporal absence does not prevent explicitly offline calibration', () => {
  const result = evaluate(fresh()).result;
  assert.equal(result.temporal_status, 'unverified'); assert.equal(result.prospective_eligible, false);
});
test('timestamps are at most attested and late cases remain excluded', () => {
  const record = fresh();
  record.temporal_evidence = { captured_at: '2026-01-01T00:00:00Z', coding_started_at: '2026-01-02T00:00:00Z', ref: record.strategy.ref };
  assert.equal(evaluate(record).result.temporal_status, 'attested_pre_coding');
  record.temporal_evidence.captured_at = '2026-01-03T00:00:00Z';
  assert.equal(evaluate(record).result.temporal_status, 'late');
  record.temporal_evidence.captured_at = 'unknown';
  assert.equal(evaluate(record).result.temporal_status, 'unverified');
});
test('identities preserved separately, controls and value not inferred', () => {
  const record = fresh(); record.identity_refs = { task: 'T', lane: 'L' }; record.contamination = 'contaminated';
  const result = evaluate(record).result;
  assert.deepEqual(result.identity_refs, record.identity_refs); assert.equal(result.contamination, 'contaminated');
  assert.equal(result.existing_control, 'unknown'); assert.equal(result.incremental_value, 'unproven');
});
test('same semantic result on 20 repetitions and reversed source order; input immutable', () => {
  const record = fresh(); const original = serialize(record); const expected = serialize(evaluate(record).result);
  for (let index = 0; index < 20; index += 1) assert.equal(serialize(evaluate(record).result), expected);
  assert.equal(serialize(record), original);
  // The input digest encodes array order; everything else is order-independent.
  record.sources.reverse();
  const { input_sha256: a, ...left } = evaluate(record).result;
  const { input_sha256: b, ...right } = JSON.parse(expected);
  assert.deepEqual(left, right); assert.notEqual(a, b);
});
test('historical 2001 calibration collides without later solution input', () => {
  const record = fresh('historical-2001'); const result = evaluate(record).result;
  assert.equal(result.verdict, 'incompatible');
  assert.equal(result.finding.evidence.projection_sha256.valid, result.finding.evidence.projection_sha256.invalid);
  assert.equal(fixtures.cases[1].provenance.entry_contiguous_in_bad, false);
  assert.equal(result.temporal_status, 'unverified');
});
test('historical negative with order retained and uncertain variant', () => {
  const record = fresh('historical-2001'); record.rule.projection = 'identity_text';
  assert.equal(verdict(record), 'consistent');
  record.rule.support.no_other_information.status = 'unknown'; assert.equal(verdict(record), 'indeterminate');
});
test('overhead separates observed metrics from unknown human work', () => {
  const output = evaluate(fresh());
  assert.ok(output.overhead.runtime_ms >= 0); assert.ok(output.overhead.bytes_read > 0);
  assert.equal(output.overhead.documents_read, 3); assert.equal(output.overhead.human_preparation_seconds, null);
  assert.equal(output.overhead.human_adjudication_seconds, null); assert.equal(output.overhead.llm_usage, 0);
  assert.equal('runtime_ms' in output.result, false);
});
test('CLI emits structured output and deterministic semantic-only JSON', () => {
  let first = ''; let second = '';
  const args = ['--input', fixturePath, '--case', 'historical-2001', '--semantic-only'];
  assert.equal(runCli(args, text => { first += text; }), 0);
  assert.equal(runCli(args, text => { second += text; }), 0);
  assert.equal(first, second); assert.equal(JSON.parse(first).verdict, 'incompatible');
});
test('CLI errors remain machine-readable', () => {
  for (const args of [[], ['--unknown'], ['--input', fixturePath, '--case', 'missing']]) {
    let text = ''; assert.equal(runCli(args, value => { text += value; }), 2); assert.equal(JSON.parse(text).error, 'invalid_input_or_access');
  }
});
test('file capabilities, hashes, symlinks and limits', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), 'acc-test-')));
  try {
    const file = join(dir, 'source'); fs.writeFileSync(file, 'A\nB');
    const record = fresh(); const source = record.sources[0]; delete source.text; source.path = file;
    assert.equal(verdict(record), 'incomplete');
    assert.equal(evaluate(record, { allowedFiles: [file] }).result.verdict, 'incompatible');
    source.path = join(dir, 'missing'); assert.equal(evaluate(record, { allowedFiles: [source.path] }).result.verdict, 'incomplete');
    const link = join(dir, 'link'); fs.symlinkSync(file, link); source.path = link;
    assert.equal(evaluate(record, { allowedFiles: [link] }).result.verdict, 'incomplete');
    assert.throws(() => readAuthorized(dir, [dir]), /not_regular_file/);
    assert.throws(() => readAuthorized(file, []), /unauthorized_path/);
    assert.throws(() => readAuthorized(file, [file], { bytes: MAX_BYTES, documents: 0 }), /byte_limit/);
    source.path = file; const before = fs.readFileSync(file);
    evaluate(record, { allowedFiles: [file] }); assert.deepEqual(fs.readFileSync(file), before);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('inline byte limit bounds analysis', () => {
  const record = fresh(); replaceText(record, 'valid', 'X'.repeat(MAX_BYTES + 1));
  assert.equal(verdict(record), 'incomplete');
});
test('behavioral isolation: writes, child processes, network, fetch and clock denied', () => {
  const undo = []; const deny = () => { throw new Error('forbidden_effect'); };
  const patch = (object, keys) => { for (const key of keys) { const previous = object[key]; object[key] = deny; undo.push(() => { object[key] = previous; }); } };
  patch(fs, ['writeFileSync', 'appendFileSync', 'mkdirSync', 'renameSync', 'unlinkSync', 'rmSync', 'truncateSync', 'createWriteStream']);
  patch(fs.promises, ['writeFile', 'appendFile', 'mkdir', 'rename', 'unlink', 'rm', 'truncate']);
  patch(childProcess, ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']);
  patch(net, ['connect', 'createConnection', 'createServer']); patch(net.Socket.prototype, ['connect']);
  patch(http, ['request', 'get', 'createServer']); patch(https, ['request', 'get', 'createServer']);
  patch(dns, ['lookup', 'resolve']); patch(globalThis, ['fetch']); patch(Date, ['now']);
  const oldOpen = fs.openSync;
  fs.openSync = (path, flags, ...rest) => {
    assert.equal(flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_APPEND), 0);
    return oldOpen(path, flags, ...rest);
  };
  undo.push(() => { fs.openSync = oldOpen; });
  syncBuiltinESMExports();
  try {
    assert.equal(verdict(fresh('historical-2001')), 'incompatible');
    let text = ''; assert.equal(runCli(['--input', fixturePath, '--case', 'historical-2001'], value => { text += value; }), 0);
    assert.equal(JSON.parse(text).result.verdict, 'incompatible');
  } finally { for (const restore of undo.reverse()) restore(); syncBuiltinESMExports(); }
  assert.deepEqual(fs.readFileSync(fixturePath), fixtureBytes);
});
test('all exercised verdicts belong to versioned contract', () => {
  assert.deepEqual(new Set(['consistent','incompatible','incomplete','indeterminate','not_applicable']), new Set(VERDICTS));
});

test('timestamps without timezone never depend on the host locale', () => {
  const record = fresh();
  record.temporal_evidence = { captured_at: '2026-01-01T00:00:00', coding_started_at: '2026-01-02T00:00:00', ref: record.strategy.ref };
  assert.equal(evaluate(record).result.temporal_status, 'unverified');
});
