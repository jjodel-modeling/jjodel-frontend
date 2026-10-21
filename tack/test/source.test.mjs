// The trace-source boundary (src/collectors/source.mjs) and the lane-run adapter behind it; the two-run guard of S1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store/open.mjs';
import { TRACE_SOURCE_MEMBERS, defineTraceSource } from '../src/collectors/source.mjs';
import { traceSource } from '../src/collectors/active.mjs';
import { laneRunSource } from '../src/collectors/lane-run/source.mjs';
import { LANE_RUN_IDS } from '../src/collectors/lane-run/config.mjs';
import { UNIT_PATTERN } from '../src/contract/validate.mjs';
import { lanesApi } from '../src/board/api.mjs';
import { laneFirstShot } from '../src/metrics/layer3.mjs';
import { NOW, assistantText, initEvent, resultEvent, writeLane } from './helpers/layers-fixture.mjs';

const MIN = 60_000;

test('the lane-run adapter carries every member of the boundary and is the active source', () => {
  for (const [k, type] of Object.entries(TRACE_SOURCE_MEMBERS)) assert.equal(typeof laneRunSource[k], type, k);
  assert.equal(traceSource, laneRunSource);
  assert.ok(Object.isFrozen(laneRunSource) && Object.isFrozen(laneRunSource.ids));
});

test('defineTraceSource rejects an adapter without a member or with an id syntax that is not a RegExp', () => {
  const ok = { ...laneRunSource };
  assert.throws(() => defineTraceSource({ ...ok, live: undefined }), /live must be a function/);
  assert.throws(() => defineTraceSource({ ...ok, ids: null }), /ids must be a object/);
  assert.throws(() => defineTraceSource({ ...ok, ids: { ...LANE_RUN_IDS, unit: 'P-' } }), /ids\.unit must be a RegExp/);
  assert.equal(defineTraceSource(ok).name, 'lane-run');
});

test('the contract takes its unit pattern from the adapter configuration', () => {
  assert.equal(UNIT_PATTERN, LANE_RUN_IDS.unit);
  assert.ok(UNIT_PATTERN.test('P-2026-10-21-1210') && UNIT_PATTERN.test('P-2026-10-21-1210-s1a'));
  assert.ok(!UNIT_PATTERN.test('C-2026-10-19-1748'));
});

test('units lists the lane folders, sorted, and skips files and other names', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tack-source-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const id of ['P-2026-01-07-1000', 'P-2026-01-07-0900', 'notes', 'P-2026-01-07-0900-x']) mkdirSync(join(dir, id));
  writeFileSync(join(dir, 'P-2026-01-07-1100'), 'a file, not a lane');
  assert.deepEqual(traceSource.units(dir), ['P-2026-01-07-0900', 'P-2026-01-07-1000']);
});

// A lane resumed once: run 1 closed with Outcome: done (its exit recorded in its runs.jsonl line, as lane-run's
// completeRun writes it), run 2 still going (lane-run's launch removed exit.txt; pid.txt names a live process).
test('two runs: run 1 closed done and run 2 still going is a running lane, never done', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tack-two-runs-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const root = join(dir, 'lanes');
  mkdirSync(root);
  const id = 'P-2026-01-08-1000';
  const s = NOW - 60 * MIN;
  const lane = writeLane(root, id, {
    started: s, pid: process.pid, runs: 2,
    inputs: [{ at: s, text: 'Do the task.\n' }, { at: s + 30 * MIN, text: 'Rework: one fix.\n' }],
    events: [initEvent(), resultEvent({ ms: 10 * MIN, usd: 1, text: 'Closed.\nOutcome: done' }), initEvent(), assistantText('Working on the fix.')],
  });
  writeFileSync(join(lane, 'runs.jsonl'), [{ run: 1, logFrom: 0, outcome: 'done', exit: '0' }, { run: 2, logFrom: 2 }].map((r) => JSON.stringify(r)).join('\n') + '\n');

  const unit = traceSource.read(root, id, NOW);
  assert.equal(traceSource.live(unit), true, 'run 2 is going');
  assert.equal(traceSource.lastOutcome(unit), 'done', 'the last closed turn is run 1');
  assert.equal(unit.end, null);

  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.isOpen && db.close());
  traceSource.collect(db, root, NOW);
  const settingsFor = () => ({ value: (k) => ({ 'harness.laneRun': 'auto', 'limits.laneMinutes': 90 })[k] });
  const d = lanesApi(db, { now: NOW, laneRoot: root, settingsFor, updatedMs: NOW });
  assert.deepEqual(d.byState.running, [id]);
  assert.deepEqual(d.byState.done, []);
  const lanes = db.prepare('SELECT * FROM lanes').all();
  assert.equal(laneFirstShot(db, lanes)[0].final, 'running');
});
