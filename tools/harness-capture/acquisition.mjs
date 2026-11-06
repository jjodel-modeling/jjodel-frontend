import * as fs from 'node:fs';
import { resolve, join, relative, dirname, sep } from 'node:path';
import { homedir } from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

export const VERSION = 1;
export const LIMITS = Object.freeze({ fileBytes: 1024 * 1024, totalBytes: 8 * 1024 * 1024, inputs: 64, retries: 2 });
const DIGEST = /^[a-f0-9]{64}$/;
const LANE = /^P-\d{4}-\d{2}-\d{2}-\d{4}$/;
const INPUT = /^input-[1-9]\d*\.md$/;
const META = ['runs.jsonl', 'session.txt', 'worktree.txt', 'prompt.txt', 'started.txt', 'exit.txt'];
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
export const encode = value => JSON.stringify(canonical(value));
const inside = (root, path) => path === root || (!relative(root, path).startsWith('..' + sep) && relative(root, path) !== '..' && !relative(root, path).startsWith(sep));
const fail = code => { throw new Error(code); };
function lexical(path) {
  if (typeof path !== 'string' || !path || path.split(/[\\/]/).includes('..') || path.includes('\0')) fail('invalid_path');
  return resolve(path);
}
function directory(path) {
  const abs = lexical(path);
  if (fs.realpathSync(abs) !== abs || !fs.lstatSync(abs).isDirectory() || fs.lstatSync(abs).isSymbolicLink()) fail('unsafe_directory');
  return abs;
}
const signature = stat => [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs].map(String).join(':');
function artifactPath(dir, name) {
  if (!(META.includes(name) || name === 'pid.txt' || INPUT.test(name))) fail('unauthorized_artifact');
  directory(dir);
  const path = join(dir, name);
  if (fs.realpathSync(path) !== path || fs.lstatSync(path).isSymbolicLink()) fail('symlink_source');
  return path;
}

// Hooks are callable test instrumentation supplied by the caller, never parsed input code.
function readSource(dir, name, budget, hooks, maxRetries) {
  const failures = [];
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    let fd;
    try {
      const path = artifactPath(dir, name);
      fd = fs.openSync(path, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
      const before = fs.fstatSync(fd, { bigint: true });
      if (!before.isFile()) fail('not_regular_file');
      if (before.size > BigInt(LIMITS.fileBytes)) fail('file_too_large');
      if (signature(before) !== signature(fs.lstatSync(path, { bigint: true }))) fail('source_changed');
      directory(dir);
      const chunks = []; let length = 0;
      while (true) {
        if (BigInt(length) === before.size) break;
        if (budget.bytes >= LIMITS.totalBytes) fail('read_budget_exceeded');
        const buffer = Buffer.alloc(Math.min(65536, LIMITS.fileBytes - length + 1, LIMITS.totalBytes - budget.bytes + 1));
        const count = fs.readSync(fd, buffer, 0, buffer.length, null);
        if (!count) break;
        length += count; budget.bytes += count;
        if (length > LIMITS.fileBytes || budget.bytes > LIMITS.totalBytes) fail('read_budget_exceeded');
        chunks.push(buffer.subarray(0, count));
        hooks.afterChunk?.({ name, attempt, length });
      }
      hooks.afterRead?.({ name, attempt });
      const after = fs.fstatSync(fd, { bigint: true });
      const current = fs.lstatSync(path, { bigint: true });
      directory(dir);
      if (signature(before) !== signature(after) || signature(after) !== signature(current) || BigInt(length) !== after.size) fail('source_changed');
      const bytes = Buffer.concat(chunks);
      return { bytes, failures, attempts: attempt + 1, retries: attempt, status: 'acquired', stable: true,
        signature: signature(after), mtimeMs: Number(after.mtimeNs) / 1e6 };
    } catch (error) {
      const code = error.code === 'ENOENT' ? 'missing' : error.code === 'ELOOP' ? 'symlink_source'
        : ['source_changed', 'not_regular_file', 'file_too_large', 'read_budget_exceeded', 'symlink_source', 'unsafe_directory'].includes(error.message) ? error.message : 'unreadable';
      failures.push(code);
      if (code !== 'source_changed' || attempt === maxRetries) return {
        bytes: null, failures, attempts: attempt + 1, retries: attempt, status: code,
        stable: code === 'source_changed' ? false : null
      };
    } finally { if (fd !== undefined) fs.closeSync(fd); }
  }
}

function storageRoot(destination, sourceRoot, create) {
  const dest = lexical(destination);
  if (sourceRoot && (inside(sourceRoot, dest) || inside(dest, sourceRoot))) fail('overlapping_storage');
  const operative = join(homedir(), '.jjodel-lanes');
  if (inside(operative, dest) || inside(dest, operative)) fail('operational_storage');
  // Neither destination nor an ancestor may be a Git worktree/repository.
  for (let parent = dest; ; parent = dirname(parent)) {
    if (fs.existsSync(join(parent, '.git'))) fail('repository_storage');
    if (parent === dirname(parent)) break;
  }
  if (!fs.existsSync(dest)) {
    directory(dirname(dest));
    if (!create) fail('storage_missing');
    fs.mkdirSync(dest, { mode: 0o700 });
  }
  directory(dest);
  if (create) for (const name of ['blobs', 'manifests', 'observations']) {
    const path = join(dest, name);
    try { fs.mkdirSync(path, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    directory(path);
  }
  return dest;
}
function readStored(root, category, digest, maxBytes = LIMITS.totalBytes * 2) {
  if (!DIGEST.test(digest) || !['blobs', 'manifests', 'observations'].includes(category)) fail('invalid_storage_reference');
  directory(root); const dir = directory(join(root, category)); const path = join(dir, digest);
  if (fs.realpathSync(path) !== path || fs.lstatSync(path).isSymbolicLink()) fail('unsafe_storage_file');
  const fd = fs.openSync(path, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const before = fs.fstatSync(fd, { bigint: true });
    if (!before.isFile() || before.size > BigInt(maxBytes)) fail('invalid_storage_file');
    const bytes = Buffer.alloc(Number(before.size)); let offset = 0;
    while (offset < bytes.length) { const count = fs.readSync(fd, bytes, offset, bytes.length - offset, offset); if (!count) fail('partial_storage_file'); offset += count; }
    if (signature(before) !== signature(fs.fstatSync(fd, { bigint: true })) || signature(before) !== signature(fs.lstatSync(path, { bigint: true }))) fail('storage_changed');
    if (sha256(bytes) !== digest) fail('storage_hash_mismatch');
    return bytes;
  } finally { fs.closeSync(fd); }
}
function publish(root, category, bytes) {
  const digest = sha256(bytes); const dir = directory(join(root, category)); const target = join(dir, digest);
  if (fs.existsSync(target)) {
    if (!readStored(root, category, digest).equals(bytes)) fail('storage_collision');
    return { sha256: digest, created: false, bytes: 0 };
  }
  const temp = join(dir, '.' + randomUUID() + '.tmp'); let fd;
  try {
    fd = fs.openSync(temp, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
    let offset = 0;
    while (offset < bytes.length) offset += fs.writeSync(fd, bytes, offset, bytes.length - offset);
    fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
    // Verify what was written before publishing, then publish without replacement.
    if (sha256(fs.readFileSync(temp)) !== digest) fail('written_hash_mismatch');
    let created = true;
    try { fs.linkSync(temp, target); } catch (error) { if (error.code !== 'EEXIST') throw error; created = false; }
    if (!readStored(root, category, digest).equals(bytes)) fail('storage_collision');
    return { sha256: digest, created, bytes: bytes.length };
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    try { fs.unlinkSync(temp); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

function interpret(sources, contents, lane) {
  const anomalies = []; const runs = []; const taskRefs = [];
  const sourceRef = (name, line = null) => ({ artifact: lane + '/' + name, sha256: sources.find(item => item.name === name)?.sha256 ?? null, line });
  const ledger = contents.get('runs.jsonl');
  if (ledger !== undefined) {
    const lines = ledger.toString('utf8').split('\n');
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      if (index === lines.length - 1 && !ledger.toString('utf8').endsWith('\n')) { anomalies.push({ code: 'partial_ledger_line', source: sourceRef('runs.jsonl', index + 1) }); return; }
      try {
        const row = JSON.parse(line);
        if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('record');
        runs.push({ reference: sourceRef('runs.jsonl', index + 1), kind: typeof row.kind === 'string' ? row.kind : null,
          session: typeof row.session === 'string' ? row.session : null, at: typeof row.at === 'string' ? row.at : null,
          logFrom: Number.isSafeInteger(row.logFrom) && row.logFrom >= 0 ? row.logFrom : null,
          invocation_id: null });
      } catch { anomalies.push({ code: 'malformed_ledger_line', source: sourceRef('runs.jsonl', index + 1) }); }
    });
  } else anomalies.push({ code: 'ledger_unavailable' });
  for (const [name, bytes] of contents) if (INPUT.test(name)) {
    const text = bytes.toString('utf8'); const header = text.split(/\n## /)[0];
    const match = /^Prompt-ID:\s*(P-\d{4}-\d{2}-\d{2}-\d{4})\s*$/m.exec(header);
    if (match) taskRefs.push({ task: match[1], source: sourceRef(name) });
  }
  const tasks = [...new Set(taskRefs.map(item => item.task))].sort();
  if (tasks.length > 1 || tasks.some(task => task !== lane)) anomalies.push({ code: 'task_identity_ambiguous' });
  const sessionFile = contents.get('session.txt')?.toString('utf8').trim() || null;
  const sessionCandidates = [...new Set([sessionFile, ...runs.map(row => row.session)].filter(Boolean))].sort();
  if (sessionCandidates.length > 1) anomalies.push({ code: 'session_identity_ambiguous' });
  return { task_refs: taskRefs, task: tasks.length === 1 && tasks[0] === lane ? tasks[0] : null,
    invocation: null, session: null, session_candidates: sessionCandidates,
    session_file: sessionFile ? { value: sessionFile, source: sourceRef('session.txt'), scope: 'file_observation_not_input_binding' } : null,
    worktree: contents.get('worktree.txt')?.toString('utf8').trim() || null,
    prompt_path: contents.get('prompt.txt')?.toString('utf8').trim() || null,
    runs, anomalies };
}

// A dead PID alone is insufficient: require stable, chronologically consistent
// wrapper completion markers. A live/reused PID is conservatively not acquired.
function historicalConclusion(dir, budget) {
  const evidence = {};
  for (const name of ['pid.txt', 'started.txt', 'exit.txt']) {
    const read = readSource(dir, name, budget, {}, 0);
    if (!read.bytes || !read.stable) fail('historical_state_unknown');
    evidence[name] = { sha256: sha256(read.bytes), signature: read.signature, mtimeMs: read.mtimeMs,
      value: read.bytes.toString('utf8').trim() };
  }
  const pidText = evidence['pid.txt'].value;
  const startedText = evidence['started.txt'].value;
  const exitText = evidence['exit.txt'].value;
  if (!/^[1-9]\d*$/.test(pidText) || !/^[1-9]\d*$/.test(startedText) || !/^\d{1,3}$/.test(exitText)) fail('historical_state_unknown');
  const pid = Number(pidText); const began = Number(startedText); const exit = Number(exitText);
  if (!Number.isSafeInteger(pid) || pid > 2147483647 || !Number.isSafeInteger(began) || exit > 255) fail('historical_state_unknown');
  try { process.kill(pid, 0); fail('historical_potentially_active'); }
  catch (error) {
    if (error.message === 'historical_potentially_active') throw error;
    if (error.code !== 'ESRCH') fail('historical_state_unknown');
  }
  const ended = evidence['exit.txt'].mtimeMs;
  if (ended < began || evidence['pid.txt'].mtimeMs > ended || evidence['started.txt'].mtimeMs > ended) fail('historical_state_unknown');
  return { state: 'concluded_observed_wrapper', pid, process_probe: 'ESRCH', exit,
    evidence, scope: 'observed_launcher_invocation; no_claim_about_untracked_processes' };
}

export function acquire({ sourceRoot, lane, destination, maxRetries = LIMITS.retries, hooks = {}, allowHistoricalLane = null }) {
  const startedAt = new Date().toISOString(); const started = performance.now(); const cpu = process.cpuUsage();
  if (!LANE.test(lane ?? '')) fail('invalid_lane');
  if (!Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > LIMITS.retries) fail('invalid_retries');
  const requestedRoot = lexical(sourceRoot);
  const operative = join(homedir(), '.jjodel-lanes');
  if (inside(operative, requestedRoot) && !allowHistoricalLane) fail('operational_source');
  if (allowHistoricalLane && lexical(allowHistoricalLane) !== join(requestedRoot, lane)) fail('historical_lane_not_authorized');
  const root = directory(requestedRoot);
  const dir = directory(join(root, lane));
  const budget = { bytes: 0 };
  const historical = allowHistoricalLane ? historicalConclusion(dir, budget) : null;
  const entries = fs.readdirSync(dir);
  const names = entries.filter(name => INPUT.test(name)).sort((a, b) => BigInt(a.slice(6, -3)) < BigInt(b.slice(6, -3)) ? -1 : 1);
  if (names.length > LIMITS.inputs) fail('too_many_inputs');
  // Validate destination before reading any source contents.
  const dest = storageRoot(destination, root, true);
  const sources = []; const contents = new Map(); let retries = 0;
  let newContentBytes = 0; let storageWrittenBytes = 0; const uniqueContent = new Map();
  for (const name of [...names, ...META]) {
    const read = readSource(dir, name, budget, hooks, maxRetries); retries += read.retries;
    const source = { name, path: lane + '/' + name, type: INPUT.test(name) ? 'launcher_input' : 'metadata',
      status: read.status, stable: read.stable, attempts: read.attempts, anomalies: read.failures,
      sha256: null, bytes_acquired: 0, preservation: 'unavailable', git_revision: null,
      completeness: 'unknown', invocation: null, session: null };
    if (read.bytes) {
      const blob = publish(dest, 'blobs', read.bytes); storageWrittenBytes += blob.bytes;
      if (blob.created) newContentBytes += read.bytes.length;
      uniqueContent.set(blob.sha256, read.bytes.length);
      source.sha256 = blob.sha256; source.bytes_acquired = read.bytes.length; source.preservation = 'full';
      contents.set(name, read.bytes);
    }
    sources.push(source);
  }
  if (historical && encode(historicalConclusion(dir, budget)) !== encode(historical)) fail('historical_state_changed');
  const identity = interpret(sources, contents, lane);
  const manifest = { schema_version: VERSION, kind: 'passive_evidence_snapshot', lane: { observed_id: lane, ...identity }, sources,
    anomalies: names.length ? [] : [{ code: 'no_launcher_inputs' }],
    temporal: { status: 'unverified', observed_order: 'point_acquisition_not_cross_file_atomic',
      launcher_order: 'keepInput_before_spawn_in_reviewed_launcher; archive_provenance_not_authenticated',
      acquisition_vs_spawn: 'unverified', acquisition_vs_coding: 'unverified', acc_judgment: 'not_produced' } };
  if (historical) manifest.historical_acquisition = historical;
  const encodedManifest = Buffer.from(encode(manifest));
  const storedManifest = publish(dest, 'manifests', encodedManifest); storageWrittenBytes += storedManifest.bytes;
  const overhead = { duration_ms: performance.now() - started, cpu_microseconds: process.cpuUsage(cpu),
    bytes_read: budget.bytes, bytes_preserved: [...uniqueContent.values()].reduce((a, b) => a + b, 0),
    new_content_bytes: newContentBytes, storage_bytes_written_before_observation: storageWrittenBytes,
    artifacts_discovered: names.length + META.filter(name => entries.includes(name)).length,
    artifacts_examined: names.length + META.length, artifacts_acquired: contents.size, retries, llm_calls: 0 };
  const observation = { schema_version: VERSION, manifest_sha256: storedManifest.sha256,
    source_root: root, observed_at: startedAt, completed_at: new Date().toISOString(), overhead };
  const storedObservation = publish(dest, 'observations', Buffer.from(encode(observation)));
  return { manifest_sha256: storedManifest.sha256, observation_sha256: storedObservation.sha256, manifest, observation,
    completion: { duration_ms: performance.now() - started, cpu_microseconds: process.cpuUsage(cpu),
      storage_bytes_written: storageWrittenBytes + storedObservation.bytes } };
}

export function verifySnapshot({ destination, manifestSha256, observationSha256 = null }) {
  const root = storageRoot(destination, null, false);
  const bytes = readStored(root, 'manifests', manifestSha256);
  let manifest;
  try { manifest = JSON.parse(bytes.toString('utf8')); } catch { fail('invalid_manifest'); }
  if (manifest?.schema_version !== VERSION || manifest.kind !== 'passive_evidence_snapshot' ||
      !LANE.test(manifest.lane?.observed_id ?? '') || !Array.isArray(manifest.sources) ||
      manifest.sources.length > LIMITS.inputs + META.length || manifest.temporal?.status !== 'unverified' ||
      manifest.temporal?.acc_judgment !== 'not_produced' || !Buffer.from(encode(manifest)).equals(bytes)) fail('invalid_manifest');
  let verifiedBytes = 0; const seen = new Set();
  for (const source of manifest.sources) {
    if (!source || typeof source.name !== 'string' || !(INPUT.test(source.name) || META.includes(source.name)) || seen.has(source.name) ||
        source.path !== manifest.lane.observed_id + '/' + source.name || !['launcher_input', 'metadata'].includes(source.type) ||
        source.git_revision !== null || source.invocation !== null || source.session !== null) fail('invalid_manifest');
    seen.add(source.name);
    if (source.preservation === 'full') {
      if (source.status !== 'acquired' || source.stable !== true || !DIGEST.test(source.sha256 ?? '') || !Number.isSafeInteger(source.bytes_acquired) || source.bytes_acquired < 0 || source.bytes_acquired > LIMITS.fileBytes) fail('invalid_manifest');
      const blob = readStored(root, 'blobs', source.sha256, LIMITS.fileBytes);
      if (blob.length !== source.bytes_acquired) fail('snapshot_length_mismatch');
      verifiedBytes += blob.length;
    } else if (source.preservation !== 'unavailable' || source.sha256 !== null || source.bytes_acquired !== 0) fail('invalid_manifest');
  }
  if (META.some(name => !seen.has(name))) fail('invalid_manifest');
  if (observationSha256 !== null) {
    const observedBytes = readStored(root, 'observations', observationSha256);
    let observation;
    try { observation = JSON.parse(observedBytes.toString('utf8')); } catch { fail('invalid_observation'); }
    if (observation?.schema_version !== VERSION || observation.manifest_sha256 !== manifestSha256 ||
        typeof observation.observed_at !== 'string' || typeof observation.completed_at !== 'string' ||
        observation.overhead?.llm_calls !== 0 || !Buffer.from(encode(observation)).equals(observedBytes)) fail('invalid_observation');
  }
  return { schema_version: VERSION, verified: true, manifest_sha256: manifestSha256,
    observation_sha256: observationSha256, verified_source_bytes: verifiedBytes };
}
