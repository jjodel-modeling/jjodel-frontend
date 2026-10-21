// Settings: one schema, three levels. Merge and precedence, keys out of their level, credentials in a
// versioned file, tack check on each of the three files, tack settings, and the atomic write.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { KEYS, checkSettingsText, effectiveSettings, levelOfFile, looksSecret, validateSettings, writeSetting } from '../src/settings/settings.mjs';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const TACK = here('../bin/tack.mjs');
const FX = here('./fixtures/settings');
const tack = (args, opts = {}) => spawnSync(process.execPath, [TACK, ...args], { encoding: 'utf8', ...opts });

function tmp(t) {
  const dir = mkdtempSync(join(tmpdir(), 'tack-settings-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('the schema declares every key with its levels; the 16 event rows are user + local, credentials user only', () => {
  const by = Object.fromEntries(KEYS.map((k) => [k.key, k]));
  assert.deepEqual(by['appearance.theme'].levels, ['user']);
  assert.equal(by['appearance.theme'].default, 'system');
  assert.deepEqual(by['load.threshold'].levels, ['project']);
  assert.equal(by['load.threshold'].default, 20);
  assert.equal(by['channels.ntfy'].secret, true);
  const events = KEYS.filter((k) => k.key.startsWith('notifications.events.'));
  assert.equal(events.length, 16);
  assert.ok(events.every((k) => k.levels.join() === 'user,local'));
  assert.ok(!by['notifications.events.merge_conflict'], 'merge_conflict is a disabled catalogue row, not a key');
  assert.deepEqual(events.filter((k) => !k.default.enabled).map((k) => k.key.slice(21)).sort(),
    ['daily_spend', 'host_load', 'lane_done', 'lane_started', 'merge_completed', 'unpushed']);
});

test('merge and precedence: default < user < project < local, per key, a key replaced whole', () => {
  const s = effectiveSettings({ user: join(FX, 'user/settings.json'), project: join(FX, 'repo/tack.json'), local: join(FX, 'repo/tack.local.json') });
  const e = Object.fromEntries(s.entries.map((x) => [x.key, x]));
  assert.deepEqual([e['appearance.theme'].value, e['appearance.theme'].source], ['dark', 'user']);
  assert.deepEqual([e['appearance.reducedMotion'].value, e['appearance.reducedMotion'].source], ['system', 'default']);
  assert.deepEqual([e['load.threshold'].value, e['load.threshold'].source], [16, 'project']);
  assert.deepEqual([e['limits.laneMinutes'].value, e['limits.laneMinutes'].source], [120, 'project']);
  // lane_done: on in the user file, off in tack.local.json; the local row replaces the user row whole.
  assert.deepEqual(e['notifications.events.lane_done'], { ...e['notifications.events.lane_done'], value: { enabled: false }, source: 'local' });
  assert.deepEqual(e['notifications.events.lane_started'].value, { enabled: true, scope: { kind: 'fronts', values: ['tack'] }, channels: ['desktop'] });
  assert.equal(e['notifications.events.lane_question'].source, 'default');
  assert.deepEqual(s.violations, []);
});

test('a key at a level it does not allow is an error, and the merge ignores it', () => {
  const v = validateSettings({ appearance: { theme: 'dark' }, load: { threshold: 5 }, notifications: { events: { lane_done: { enabled: true } } } }, 'project');
  assert.deepEqual(v.map((x) => [x.key, x.rule]), [['appearance.theme', 'settings-level'], ['notifications.events.lane_done', 'settings-level']]);
  assert.deepEqual(validateSettings({ load: { threshold: 5 } }, 'user').map((x) => [x.key, x.rule]), [['load.threshold', 'settings-level']]);
  assert.deepEqual(validateSettings({ load: { threshold: 5 } }, 'local').map((x) => x.rule), ['settings-level']);
  const dir = tmp({ after: () => {} });
  writeFileSync(join(dir, 'tack.json'), JSON.stringify({ appearance: { theme: 'dark' } }));
  const s = effectiveSettings({ user: join(dir, 'none.json'), project: join(dir, 'tack.json') });
  assert.equal(s.value('appearance.theme'), 'system', 'a project file cannot set a user key');
  assert.equal(s.violations[0].rule, 'settings-level');
  rmSync(dir, { recursive: true, force: true });
});

test('a credential in tack.json or tack.local.json is rejected under any key; the same string is fine in the user file', () => {
  const doc = JSON.parse(readFileSync(join(FX, 'invalid/tack.json'), 'utf8'));
  const rules = validateSettings(doc, 'project').map((x) => `${x.key} ${x.rule}`);
  assert.deepEqual(rules, [
    'appearance.theme settings-level', 'channels.ntfy settings-level', 'limits.laneMinutes settings-range', 'limits.unknown settings-unknown-key',
    'load.threshold settings-type', 'harness.laneRun settings-enum', 'notes settings-unknown-key', 'notes settings-secret',
  ]);
  for (const s of ['https://ntfy.sh/abc', 'https://hooks.slack.com/services/T0/B0/x', 'https://discord.com/api/webhooks/1/x', 'tk_0123456789abcdef']) {
    assert.ok(looksSecret(s), s);
    assert.deepEqual(validateSettings({ x: s }, 'local').map((v) => v.rule), ['settings-unknown-key', 'settings-secret']);
  }
  assert.ok(!looksSecret('https://ntfy.sh'), 'a server without a topic is not a credential');
  assert.deepEqual(validateSettings(JSON.parse(readFileSync(join(FX, 'user/settings.json'), 'utf8')), 'user'), []);
});

test('syntax, not-object, type, enum, range and pattern rules', () => {
  assert.equal(checkSettingsText('{', 'user').violations[0].rule, 'settings-json-syntax');
  assert.equal(checkSettingsText('[]', 'user').violations[0].rule, 'settings-not-object');
  const r = (doc) => validateSettings(doc, 'user').map((x) => x.rule);
  assert.deepEqual(r({ appearance: 'dark' }), ['settings-type']);
  assert.deepEqual(r({ appearance: { fontScale: 2 } }), ['settings-range']);
  assert.deepEqual(r({ appearance: { fontScale: 0.8 } }), []);
  assert.deepEqual(r({ quietHours: { enabled: true, start: '25:00' } }), ['settings-pattern']);
  assert.deepEqual(r({ notifications: { events: { gate_red: { enabled: true, channels: ['email'] } } } }), ['settings-enum']);
  assert.deepEqual(r({ notifications: { events: { gate_red: { scope: { kind: 'all' } } } } }), ['settings-type']);
});

test('levelOfFile dispatches by name; tack check validates a sample of each of the three files and the fixtures', () => {
  assert.deepEqual(['a/settings.json', 'b/tack.json', 'tack.local.json', 'log.jsonl'].map(levelOfFile), ['user', 'project', 'local', null]);
  for (const f of ['user/settings.json', 'repo/tack.json', 'repo/tack.local.json']) {
    const r = tack(['check', join(FX, f)]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /settings, no violations/);
  }
  const bad = tack(['check', join(FX, 'invalid/tack.json')]);
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /invalid\/tack\.json: notes settings-secret: /);
  assert.match(bad.stdout, /appearance\.theme settings-level: allowed at user, not in a project file/);
  // --level overrides the name: the user sample read as a project file breaks the level rule.
  const asProject = tack(['check', join(FX, 'user/settings.json'), '--level', 'project']);
  assert.equal(asProject.status, 1);
  assert.match(asProject.stdout, /settings-level/);
  // The JSON Lines path is unchanged.
  const log = tack(['check', here('./fixtures/valid.jsonl')]);
  assert.equal(log.status, 0, log.stdout);
  assert.match(log.stdout, /entries, no violations/);
});

test('tack settings prints every key with its source level; TACK_SETTINGS names the user file', (t) => {
  const dir = tmp(t);
  const r = tack(['settings', '--json', '--repo', dir], { env: { ...process.env, TACK_SETTINGS: join(FX, 'user/settings.json') } });
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.entries.length, KEYS.length);
  assert.deepEqual(out.entries.find((e) => e.key === 'appearance.theme'), { key: 'appearance.theme', value: 'dark', source: 'user', levels: ['user'] });
  assert.equal(out.files.project.path, null, 'outside a git work tree there is no project level');
  const text = tack(['settings', '--repo', dir], { env: { ...process.env, TACK_SETTINGS: join(FX, 'user/settings.json') } });
  assert.match(text.stdout, /appearance\.theme\s+"dark"\s+user\s+user/);
  assert.ok(!text.stdout.includes('tk_fixture'), 'the ntfy token is masked in the table');
});

test('writeSetting: atomic, only at an allowed level, reset removes the key and its empty groups, a broken file is not overwritten', (t) => {
  const dir = tmp(t);
  const local = join(dir, 'tack.local.json');
  writeSetting(local, 'local', 'notifications.events.gate_red', { enabled: false });
  assert.deepEqual(JSON.parse(readFileSync(local, 'utf8')), { notifications: { events: { gate_red: { enabled: false } } } });
  assert.throws(() => writeSetting(local, 'local', 'appearance.theme', 'dark'), { code: 'level' });
  assert.throws(() => writeSetting(local, 'local', 'load.threshold', 3), { code: 'level' });
  assert.throws(() => writeSetting(local, 'local', 'notifications.events.gate_red', { enabled: 'yes' }), { code: 'invalid' });
  writeSetting(local, 'local', 'notifications.events.gate_red', undefined, { reset: true });
  assert.deepEqual(JSON.parse(readFileSync(local, 'utf8')), {});
  assert.deepEqual(readdirSync(dir), ['tack.local.json'], 'no temporary file left');
  const user = join(dir, 'nested', 'settings.json');
  writeSetting(user, 'user', 'appearance.theme', 'dark');
  assert.equal(JSON.parse(readFileSync(user, 'utf8')).appearance.theme, 'dark');
  writeFileSync(local, '{ broken');
  assert.throws(() => writeSetting(local, 'local', 'notifications.events.gate_red', { enabled: true }), { code: 'unreadable' });
  assert.equal(readFileSync(local, 'utf8'), '{ broken');
  copyFileSync(join(FX, 'repo/tack.json'), join(dir, 'tack.json'));
  assert.ok(existsSync(join(dir, 'tack.json')));
});
