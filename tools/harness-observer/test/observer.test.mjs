import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import { syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';
import { normalizeEvent } from '../providers/claude-stream.mjs';
import { reconstructUsage, reconcileUsage } from '../accounting.mjs';
import { readLaneSources, readSample, readBytes } from '../reader.mjs';
import { buildReport, canonicalStringify, main } from '../cli.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = name => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', name), 'utf8'));
const expected = fixture('expected.json');
const sample = fixture('sample-100.json');
const schema = JSON.parse(fs.readFileSync(path.join(here, '../report.schema.json'), 'utf8'));
const ref = i => ({ path: 'P-2026-01-01-0000/log.jsonl', sha256: 'a'.repeat(64), line: i + 1, byteStart: i * 100, byteEnd: i * 100 + 99 });
const normalize = events => events.map((e, i) => normalizeEvent(e, ref(i))).filter(Boolean);
const usage = (input = 2) => ({ input_tokens: input, cache_read_input_tokens: 10, cache_creation_input_tokens: 3, output_tokens: 1 });
const message = (id = 'a', session = 's', u = usage()) => ({ type: 'assistant', session_id: session, message: { id, model: 'm', usage: u } });
const result = (input = 2, session = 's') => ({ type: 'result', session_id: session, modelUsage: { m: { inputTokens: input, cacheReadInputTokens: 10, cacheCreationInputTokens: 3, outputTokens: 8 } } });
const analyze = raw => { const events = normalize(raw); const stream = reconstructUsage(events); return { stream, accounting: reconcileUsage(events, stream) }; };

// Local evaluator for precisely the standard schema keywords used by report.schema.json.
// No downloads, schema hooks or executable schemas are accepted.
function validate(v, s, at = '$') {
    if (s.$ref) return validate(v, s.$ref.split('/').slice(1).reduce((x, k) => x[k], schema), at);
    if (s.const !== undefined) assert.deepEqual(v, s.const, at);
    if (s.enum) assert.ok(s.enum.includes(v), at);
    if (s.type) {
        const types = [].concat(s.type);
        assert.ok(types.some(t => t === 'null' ? v === null : t === 'array' ? Array.isArray(v) : t === 'object' ? v !== null && typeof v === 'object' && !Array.isArray(v) : t === 'integer' ? Number.isSafeInteger(v) : typeof v === t), at);
    }
    if (typeof v === 'number' && s.minimum !== undefined) assert.ok(v >= s.minimum, at);
    if (typeof v === 'string' && s.pattern) assert.match(v, new RegExp(s.pattern), at);
    if (Array.isArray(v) && s.items) v.forEach((x, i) => validate(x, s.items, `${at}[${i}]`));
    if (v && typeof v === 'object' && !Array.isArray(v)) {
        for (const k of s.required || []) assert.ok(Object.hasOwn(v, k), at + '.' + k);
        for (const [k, value] of Object.entries(v)) {
            if (s.properties?.[k]) validate(value, s.properties[k], at + '.' + k);
            else if (s.additionalProperties === false) assert.fail(at + ': unexpected ' + k);
            else if (s.additionalProperties && typeof s.additionalProperties === 'object') validate(value, s.additionalProperties, at + '.' + k);
        }
    }
}
function tempLane(t, text) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-observer-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const id = 'P-2026-01-01-0000'; const dir = path.join(root, id); fs.mkdirSync(dir);
    if (text !== undefined) fs.writeFileSync(path.join(dir, 'log.jsonl'), text);
    return { root, id, dir };
}
const historical = () => fixture('historical-minimal.json').cases.map(c => ({ ...c, events: c.records.map(r => normalizeEvent(r.event, r.source)).filter(Boolean) }));

for (const c of fixture('synthetic.json').cases) test('synthetic: ' + c.name, () => {
    const r = analyze(c.events); assert.equal(r.stream.calls.length, c.calls);
    assert.deepEqual(r.accounting.difference, c.difference); assert.equal(r.accounting.baselineTechnicalTotal, c.total);
});
test('cumulative resumes are not summed', () => {
    const r = analyze([message(), result(), { type: 'system', subtype: 'init', session_id: 's' }, message('b'), result(4)]);
    assert.equal(r.accounting.accounted.input, 4); assert.equal(r.accounting.snapshots.length, 2);
});
test('different sessions may reuse a message id', () => {
    const r = analyze([message('a', 's'), result(2, 's'), message('a', 't'), result(2, 't')]);
    assert.equal(r.stream.calls.length, 2); assert.equal(r.accounting.accounted.output, 16);
});
test('missing message id retains observations without asserting identity', () => {
    const r = analyze([message(null), message(null)]); assert.equal(r.stream.calls.length, 2);
    assert.equal(r.stream.diagnostics[0].code, 'MESSAGE_ID_MISSING');
});
test('changed usage and conflicting identity are explicit', () => {
    const a = message(); const b = message('a', 's', usage(4)); b.parent_tool_use_id = 'sub';
    const r = analyze([a, b]); assert.ok(r.stream.diagnostics.some(d => d.code === 'MESSAGE_USAGE_CHANGED'));
    assert.ok(r.stream.diagnostics.some(d => d.code === 'MESSAGE_ID_CONFLICT'));
});
test('counter resets suppress complete totals', () => {
    const r = analyze([message(), result(4), result(2)]);
    assert.equal(r.accounting.availability, 'partial'); assert.equal(r.accounting.baselineTechnicalTotal, null);
    assert.ok(r.accounting.diagnostics.some(d => d.code === 'COUNTER_DISCONTINUITY'));
});
test('per-model resets cannot be masked by growth of another model', () => {
    const a = result(4); const b = result(2); b.modelUsage.other = { inputTokens: 100, cacheReadInputTokens: 100, cacheCreationInputTokens: 100, outputTokens: 100 };
    const r = analyze([message(), a, b]); assert.equal(r.accounting.availability, 'partial');
    assert.equal(r.accounting.baselineTechnicalTotal, null);
});
test('missing, negative and unsafe counters never become invented zeros', () => {
    for (const input of [null, -1, Number.MAX_SAFE_INTEGER + 1]) {
        const r = analyze([message('a', 's', usage(input)), result()]);
        assert.equal(r.stream.all.input, null); assert.equal(r.accounting.baselineTechnicalTotal, null);
    }
});
test('safe individual counters cannot silently overflow an aggregate', () => {
    const r = analyze([message('a', 's', usage(Number.MAX_SAFE_INTEGER)), message('b', 's', usage(2))]);
    assert.equal(r.stream.all.input, null); assert.ok(r.stream.diagnostics.some(d => d.code === 'COUNTER_OVERFLOW'));
});
test('same-model subagent output is not added twice or attributed arbitrarily', () => {
    const sub = message('b'); sub.parent_tool_use_id = 'sub';
    const r = analyze([message(), sub, result(4)]);
    assert.equal(r.stream.subagents.input, 2); assert.equal(r.accounting.accounted.output, 8);
    assert.equal(r.accounting.outputStreamAvailability, 'partial');
});
test('normalization does not export message, command or tool-result contents', () => {
    const e = message(); e.message.content = [{ type: 'text', text: 'PRIVATE_PAYLOAD' }, { type: 'tool_use', input: { command: 'PRIVATE_COMMAND' } }];
    assert.ok(!JSON.stringify(normalize([e])).includes('PRIVATE_'));
});
test('CLI rejects missing, duplicate and unknown arguments without reads', () => {
    for (const args of [[], ['inspect'], ['inspect', '--write', 'x'], ['audit', '--sample', 'x', '--sample', 'y']]) {
        assert.equal(main(args, { out: () => assert.fail(), err: () => {} }), 2);
    }
});
test('sample membership is fixed and includes required historical cases', () => {
    const ids = readSample(path.join(here, 'fixtures/sample-100.json')); assert.equal(ids.length, 100);
    assert.equal(new Set(ids).size, 100); assert.ok(ids.includes('P-2026-10-21-1035'));
    for (const id of ['P-2026-10-10-0105', 'P-2026-10-16-1000']) assert.ok(ids.includes(id));
    for (const id of sample.intentionalOutsideSample) assert.ok(!ids.includes(id));
});
test('source hashes and outcomes are deterministic; no following prompt.txt', t => {
    const { root, id, dir } = tempLane(t, JSON.stringify(message()) + '\n' + JSON.stringify(result()) + '\n');
    fs.writeFileSync(path.join(dir, 'prompt.txt'), '/should/never/be/read');
    const a = canonicalStringify(buildReport([readLaneSources(root, id)]));
    assert.equal(a, canonicalStringify(buildReport([readLaneSources(root, id)])));
    validate(JSON.parse(a), schema);
});
test('malformed and incomplete lines produce partial records', t => {
    const { root, id } = tempLane(t, '{bad}\n{"type":'); const a = readLaneSources(root, id);
    assert.deepEqual(a.diagnostics.map(d => d.code), ['MALFORMED_JSON', 'INCOMPLETE_LAST_LINE']);
    assert.equal(buildReport([a]).records[0].reconciliation.availability, 'partial');
});
test('source mutation is detected; no total is certified', t => {
    const { root, id } = tempLane(t, JSON.stringify(message()) + '\n');
    const a = readLaneSources(root, id, { onRead: p => fs.appendFileSync(p, '\n') });
    assert.ok(a.diagnostics.some(d => d.code === 'SOURCE_CHANGED'));
    assert.equal(buildReport([a]).records[0].reconciliation.eligibleForBaseline, false);
});
test('path traversal and symlink escapes are refused', t => {
    const { root, id, dir } = tempLane(t, '');
    assert.throws(() => readLaneSources(root, '../escape'));
    fs.unlinkSync(path.join(dir, 'log.jsonl')); fs.symlinkSync('/etc/passwd', path.join(dir, 'log.jsonl'));
    assert.ok(readLaneSources(root, id).diagnostics.some(d => d.code === 'SOURCE_UNREADABLE'));
    assert.throws(() => readBytes('/etc/passwd', root));
});
test('missing logs are missing, direct observations are not applicable', t => {
    const { root, id, dir } = tempLane(t);
    assert.equal(buildReport([readLaneSources(root, id)]).records[0].reconciliation.availability, 'missing');
    fs.writeFileSync(path.join(dir, 'direct.json'), '{"kind":"direct"}'); fs.writeFileSync(path.join(dir, 'log.jsonl'), '');
    assert.equal(buildReport([readLaneSources(root, id)]).records[0].reconciliation.availability, 'not_applicable');
});
test('resumed failure cannot inherit an older Outcome', t => {
    const raw = [message(), { type: 'assistant', message: { content: [{ type: 'text', text: 'Outcome: done' }] } }, { type: 'system', subtype: 'init', session_id: 's' }];
    const { root, id } = tempLane(t, raw.map(JSON.stringify).join('\n'));
    assert.equal(buildReport([readLaneSources(root, id)]).records[0].operationalOutcomes.agent, null);
});
test('historical projections: exact discrepancies, original counters and mixed identities', () => {
    const r = buildReport(historical()); validate(r, schema);
    for (const [id, diff] of Object.entries(expected.differences)) {
        const lane = r.records.find(x => x.laneId === id); assert.deepEqual(lane.reconciliation.difference, diff);
        assert.equal(lane.reconciliation.eligibleForBaseline, false);
    }
    const mixed = r.records.find(x => x.laneId.endsWith('1035'));
    assert.deepEqual(mixed.entities.filter(e => e.type === 'execution').map(e => e.kind).sort(), ['direct', 'llm']);
    assert.ok(mixed.diagnostics.some(d => d.code === 'MIXED_CONTAINER'));
    assert.ok(mixed.entities.every(e => e.type !== 'lane' || e.taskId === null));
    const a = r.records.find(x => x.laneId.endsWith('0105'));
    for (const [segment, diff] of Object.entries(expected.segments0105)) assert.deepEqual(a.reconciliation.segments.find(s => s.segment === Number(segment)).difference, diff);
    assert.equal(a.reconciliation.segments.find(s => s.segment === 3).compactionObserved, true);
    const b = r.records.find(x => x.laneId.endsWith('1000'));
    const interrupted = b.originalCounters.messages.find(m => m.source.line === 1390);
    assert.equal(interrupted.original.cache_read_input_tokens, 397421);
});
test('schema rejects malformed contracts', () => {
    assert.throws(() => validate({ schemaVersion: 'bad' }, schema));
    const r = buildReport(historical()); r.records[0].reconciliation.availability = 'invented';
    assert.throws(() => validate(r, schema));
});
function safeSource(text) {
    assert.ok(!/from ['"](?:node:)?(?:child_process|http|https|net|dns|tls|worker_threads)['"]/.test(text));
    assert.ok(!/lane-run|lane-tracking|lane-usage|lane-board|\.claude\//.test(text));
    assert.ok(!/\b(?:writeFile|appendFile|createWriteStream|unlinkSync|mkdirSync|renameSync)\b/.test(text));
}
test('production modules have no operational, write, process or network imports', () => {
    for (const file of ['cli.mjs', 'reader.mjs', 'identity.mjs', 'accounting.mjs', 'providers/claude-stream.mjs']) {
        const text = fs.readFileSync(path.join(here, '..', file), 'utf8');
        safeSource(text);
    }
});
test('in-memory mutation bench for the source boundary check: three forbidden additions rejected', () => {
    const text = fs.readFileSync(path.join(here, '../accounting.mjs'), 'utf8');
    for (const mutant of [text + "\nimport cp from 'node:child_process';", text + "\nimport x from './lane-run.mjs';", text + "\nconst forbidden = writeFile;"]) assert.throws(() => safeSource(mutant));
});
test('runtime traps: imports, inspection and reporting perform no writes, child launches or network accesses', async t => {
    const { root, id, dir } = tempLane(t, JSON.stringify(message()) + '\n' + JSON.stringify(result()) + '\n');
    const before = fs.readFileSync(path.join(dir, 'log.jsonl'));
    const restore = []; let attempts = 0;
    const forbid = (obj, name) => { const old = obj[name]; obj[name] = () => { attempts++; throw new Error('FORBIDDEN_EFFECT'); }; restore.push(() => { obj[name] = old; }); };
    for (const k of ['writeFileSync','appendFileSync','writeSync','mkdirSync','renameSync','unlinkSync','rmSync','truncateSync','createWriteStream','writeFile','appendFile','mkdir','rename','unlink','rm','truncate']) forbid(fs, k);
    for (const k of ['writeFile','appendFile','mkdir','rename','unlink','rm','truncate','open']) forbid(fs.promises, k);
    for (const k of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork']) forbid(cp, k);
    for (const obj of [http, https]) for (const k of ['request','get']) forbid(obj, k);
    forbid(net.Socket.prototype, 'connect'); forbid(globalThis, 'fetch');
    const oldOpen = fs.openSync;
    fs.openSync = (p, flags, ...args) => {
        const writes = fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_APPEND;
        if (typeof flags === 'string' ? flags !== 'r' : (flags & writes) !== 0) { attempts++; throw new Error('WRITE_OPEN'); }
        return oldOpen(p, flags, ...args);
    };
    restore.push(() => { fs.openSync = oldOpen; }); syncBuiltinESMExports();
    try {
        assert.throws(() => fs.writeFileSync('/never-created-by-observer-test', 'x'), /FORBIDDEN_EFFECT/);
        assert.throws(() => cp.spawn('never-launched'), /FORBIDDEN_EFFECT/);
        assert.throws(() => globalThis.fetch('https://never-accessed.invalid'), /FORBIDDEN_EFFECT/);
        assert.equal(attempts, 3); attempts = 0;
        for (const file of ['cli.mjs', 'reader.mjs', 'identity.mjs', 'accounting.mjs', 'providers/claude-stream.mjs']) await import(new URL('../' + file + '?effect-guard', import.meta.url));
        let output = ''; assert.equal(main(['inspect', '--lanes-root', root, '--lane', id], { out: s => { output += s; }, err: () => assert.fail() }), 0);
        validate(JSON.parse(output), schema); assert.equal(attempts, 0);
    } finally { restore.reverse().forEach(f => f()); syncBuiltinESMExports(); }
    assert.deepEqual(fs.readFileSync(path.join(dir, 'log.jsonl')), before);
});

test('integral archive validation: sample 100, three originals and deterministic no-write replay', { skip: !process.env.HARNESS_OBSERVER_ARCHIVE_ROOT }, () => {
    const root = process.env.HARNESS_OBSERVER_ARCHIVE_ROOT;
    const ids = readSample(path.join(here, 'fixtures/sample-100.json'));
    const metadata = () => ids.flatMap(id => fs.readdirSync(path.join(root, id)).sort().map(name => {
        const s = fs.lstatSync(path.join(root, id, name), { bigint: true });
        return [id, name, String(s.ino), String(s.size), String(s.mtimeNs), String(s.ctimeNs)];
    }));
    const beforeMetadata = metadata();
    const run = () => buildReport(ids.map(id => readLaneSources(root, id)));
    const first = run(); validate(first, schema);
    for (const [k, v] of Object.entries(expected.baseline)) assert.equal(first.coverage[k], v, k);
    for (const [id, diff] of Object.entries(expected.differences)) assert.deepEqual(first.records.find(r => r.laneId === id).reconciliation.difference, diff);
    for (const c of fixture('historical-minimal.json').cases) {
        const record = first.records.find(r => r.laneId === c.laneId);
        assert.equal(record.sources.find(s => s.path.endsWith('/log.jsonl')).sha256, c.sources[0].sha256, c.laneId + ': original log hash');
    }
    const mixed = first.records.find(r => r.laneId.endsWith('1035'));
    const mixedDiagnostic = mixed.diagnostics.find(d => d.code === 'MIXED_CONTAINER');
    assert.equal(mixedDiagnostic.directBranch, 'tack-stops');
    assert.equal(mixedDiagnostic.llmWorktree, '/Users/alfonso/jjodel-w-hwprinter');
    assert.equal(mixedDiagnostic.sameTask, null);
    for (const [segment, diff] of Object.entries(expected.segments0105)) assert.deepEqual(first.records.find(r => r.laneId.endsWith('0105')).reconciliation.segments.find(s => s.segment === Number(segment)).difference, diff);
    assert.equal(first.records.find(r => r.laneId.endsWith('1000')).originalCounters.messages.find(m => m.source.line === 1390).original.cache_read_input_tokens, 397421);
    if (expected.validationSourceFingerprint) assert.equal(first.dataset.sourceFingerprint, expected.validationSourceFingerprint);
    for (const k of ['input','cacheRead','cacheCreation']) assert.equal(first.records.filter(r => r.reconciliation.eligibleForBaseline).reduce((sum, r) => sum + r.reconstructedUsage.stream.all[k], 0), sample.baseline[k]);
    assert.equal(first.records.filter(r => r.reconciliation.eligibleForBaseline).reduce((sum, r) => sum + r.reconciliation.accounted.output, 0), sample.baseline.output);
    const second = run(); assert.equal(canonicalStringify(first), canonicalStringify(second));
    assert.ok(first.records.every(r => r.sources.every(s => s.stable)));
    assert.deepEqual(metadata(), beforeMetadata, 'archive metadata unchanged, including files not parsed by the observer');
    console.log('Historical validation: 100 lanes; 75 LLM; 73 reconciled; 1034170964 technical tokens; identical repeated JSON.');
});
