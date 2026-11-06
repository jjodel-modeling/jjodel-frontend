// The waiting cards (slice 9): the reason and the Recommended: line of each wait kind, the chat linked or plain, the
// banner with zero, one and several waiting lanes, the order of the cards, the chat URL of a lane, and /api/attention
// in the shape of Jjodel's lane board answer (frontend/scripts/lane-board/README.md, «The menu bar app's routes»).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store/open.mjs';
import { ATTENTION_MAX_BYTES, attentionApi, lanesApi } from '../src/board/api.mjs';
import { startBoard } from '../src/board/server.mjs';
import { REASON_MAX, WAIT_PILL, chatUrlOf, waitReasonOf } from '../src/board/waiting.mjs';
import { T0, commit, g, initRepo } from './helpers/git-repo.mjs';
import { loadViews } from './helpers/views.mjs';

const MIN = 60_000;
const NOW = Date.parse('2026-01-08T12:00:00Z');
const V = loadViews(['charts.js', 'board.js', 'lanes.js']);
const L = V.TackLanes;

function world(t) {
  const dir = mkdtempSync(join(tmpdir(), 'tack-waiting-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('waitReasonOf: a question by its «Question for you» line, else by its first sentence ending in ?', () => {
  const a = waitReasonOf('[P-2026-01-08-1100 · session x]\nDone the first half.\n**Question for you:** keep the old route?\nRecommended: keep it\nOutcome: question', 'question');
  assert.deepEqual({ ...a }, { reason: 'keep the old route?', recommended: 'keep it' });
  const b = waitReasonOf('The table has two shapes. Which one goes in the API? The other one stays.\nOutcome: question', 'question');
  assert.deepEqual({ ...b }, { reason: 'Which one goes in the API?', recommended: '' }, 'no Recommended: line: empty');
});

test('waitReasonOf: a stop by the first sentence naming it, per kind; the last Recommended: line wins', () => {
  const bp = waitReasonOf('Measured 12 lanes. End of Phase 1: the report is committed.\nRecommended: write Phase 2\nOutcome: hard-stop', 'breakpoint');
  assert.deepEqual({ ...bp }, { reason: 'End of Phase 1: the report is committed.', recommended: 'write Phase 2' });
  const ce = waitReasonOf('Tests green. Context soft ceiling reached, handoff.md written.\nOutcome: hard-stop', 'ceiling');
  assert.equal(ce.reason, 'Context soft ceiling reached, handoff.md written.');
  const hs = waitReasonOf('Started the build. The worktree is missing the branch.\nRecommended: first\nRecommended: **recreate it**\nOutcome: hard-stop', 'hard-stop');
  assert.deepEqual({ ...hs }, { reason: 'The worktree is missing the branch.', recommended: 'recreate it' });
  const none = waitReasonOf('Nothing named here.\nOutcome: hard-stop', 'ceiling');
  assert.equal(none.reason, 'Nothing named here.', 'no naming sentence: the first sentence');
  assert.deepEqual({ ...waitReasonOf('', 'hard-stop') }, { reason: '', recommended: '' });
});

test('waitReasonOf: a long reason is cut to REASON_MAX characters with an ellipsis', () => {
  const long = 'Hard stop because ' + 'the branch was not where it should be '.repeat(20) + 'today.';
  const r = waitReasonOf(long, 'hard-stop');
  assert.ok(r.reason.length <= REASON_MAX + 1, `length ${r.reason.length}`);
  assert.ok(r.reason.endsWith('…'));
  assert.ok(r.reason.startsWith('Hard stop because'));
});

const card = (o = {}) => ({
  id: 'P-2026-01-08-1100', kind: 'phase2', title: 'Slice <9>', tier: 'heavy', front: 'tack', chat: 'C-2026-01-08-1000', direct: false,
  critical: false, live: false, started: NOW - 120 * MIN, end: NOW - 30 * MIN, workMs: 1000, spanMs: 1000, medianMs: null, overLimit: false,
  tokensIn: 1, contextPeak: 1, cost: 1, outcome: 'hard-stop', lastOutcome: 'hard-stop', stopKind: 'breakpoint', auto: false, resolved: false,
  adoptions: null, worktree: null, mergeState: null, closed: false,
  wait: { kind: 'breakpoint', pill: 'GO', reason: 'End of Phase 1.', recommended: 'write Phase 2', chatUrl: 'https://claude.ai/chat/abc', since: NOW - 30 * MIN },
  ...o,
});
const w = (kind, o = {}) => ({ wait: { ...card().wait, kind, pill: WAIT_PILL[kind], ...o } });

test('waitingCard: one pill per wait kind, with its class and tooltip', () => {
  const expect = { breakpoint: ['GO', 'ln-bp'], question: ['answer', 'ln-wait'], ceiling: ['ACK', 'ln-ceil'], 'hard-stop': ['hard-stop', 'ln-hs'] };
  for (const [kind, [pill, cls]] of Object.entries(expect)) {
    const h = L.waitingCard(card(w(kind)), NOW);
    assert.match(h, new RegExp(`<span class="tag ${cls}" title="[^"]+">${pill}</span>`), kind);
    assert.ok(h.includes('data-id="P-2026-01-08-1100"'));
    assert.ok(h.includes('Slice &lt;9&gt;'), 'title escaped');
    assert.ok(h.includes('<p class="ln-why">End of Phase 1.</p>'));
    assert.match(h, /waiting 30 ?min/);
  }
});

test('waitingCard: the Recommended: line set apart when present, absent otherwise; no reason says so', () => {
  assert.ok(L.waitingCard(card(), NOW).includes('<p class="ln-rec"><span class="kl">Recommended</span>write Phase 2</p>'));
  const bare = L.waitingCard(card(w('breakpoint', { recommended: '', reason: '' })), NOW);
  assert.ok(!bare.includes('ln-rec'));
  assert.ok(bare.includes('No closing message to quote.'));
});

test('waitingCard: the chat linked to its URL, or plain text when no URL resolves', () => {
  const linked = L.waitingCard(card(), NOW);
  assert.match(linked, /<a class="mono ln-chat" href="https:\/\/claude\.ai\/chat\/abc" target="_blank" rel="noopener noreferrer"[^>]*>C-2026-01-08-1000<\/a>/);
  const plain = L.waitingCard(card(w('breakpoint', { chatUrl: '' })), NOW);
  assert.ok(!plain.includes('<a '));
  assert.match(plain, /<span class="mono ln-chat" title="[^"]*no URL resolves">C-2026-01-08-1000<\/span>/);
  assert.match(L.waitingCard(card({ chat: null, ...w('breakpoint', { chatUrl: '' }) }), NOW), /<span class="mono ln-chat"[^>]*>—<\/span>/);
});

test('banner: nothing for none, the card itself for one, a scrolling button for two', () => {
  assert.equal(L.banner([], {}, NOW), '');
  const one = L.banner([card()], { breakpoint: 1 }, NOW);
  assert.ok(one.startsWith('<div class="ln-banner ln-one"'));
  assert.ok(one.includes('1 lane waiting') && one.includes('ln-wcard') && one.includes('write Phase 2'));
  const two = L.banner([card(), card({ id: 'P-2026-01-08-1101', ...w('question') })], { breakpoint: 1, question: 1 }, NOW);
  assert.match(two, /^<button type="button" class="ln-banner" data-scroll="ln-waiting"[^>]*>2 lanes waiting/);
  assert.ok(!two.includes('ln-wcard'), 'the cards are in their section, not the banner');
});

test('the page: one waiting lane has no «Waiting» section; two have it, cards in order', () => {
  const base = (cards) => ({
    repo: null, state: 'ok', reason: null, updatedMs: NOW, closure: 'c', running: [],
    tiles: { running: 0, waiting: cards.length, waitingBy: { question: 0, breakpoint: cards.length, ceiling: 0, 'hard-stop': 0 }, blocked: 0, done24: 0, resolved24: 0, spendToday: 0 },
    attention: { waiting: cards, blocked: [], staleCount: 0 }, waitingCards: cards, last24: cards,
    byState: { running: [], waiting: cards.map((c) => c.id), blocked: [], done: [], resolved: [], other: [] }, adoptions: [], medianByKind: {},
  });
  const one = L.html(base([card()]), NOW);
  assert.ok(!one.includes('id="ln-waiting"'));
  assert.equal(one.split('ln-wcard').length - 1, 1, 'the one card is drawn once, in the banner');
  const two = L.html(base([card({ id: 'P-A' }), card({ id: 'P-B' })]), NOW);
  assert.ok(two.includes('id="ln-waiting"'));
  assert.ok(two.indexOf('data-id="P-A"') < two.indexOf('data-id="P-B"'));
});

function lanesDb(t, dir) {
  const db = openStore(join(dir, 'store.db'));
  t.after(() => db.isOpen && db.close());
  db.prepare("INSERT INTO repos (key, roots, common_dirs, toplevels, remote, state) VALUES ('R', '[]', '[]', ?, NULL, 'present')").run(JSON.stringify(['/r']));
  return db;
}
function row(db, id, o = {}) {
  db.prepare(`INSERT INTO lanes (id, repo_key, session_id, started_ms, end_ms, live, tier, runs, outcome, blocked_run, over_time, corrective, cost_usd,
    cache_key, last_outcome, kind, title, work_ms, worktree, resolved, stop_kind, chat)
    VALUES (?, 'R', 's', ?, ?, ?, 'heavy', 1, ?, 0, 0, 0, 1, 'k', ?, 'phase2', ?, 1000, '/r', 0, ?, ?)`)
    .run(id, o.started ?? NOW - 300 * MIN, o.live ? null : o.end ?? NOW - 60 * MIN, o.live ? 1 : 0, o.last ?? 'hard-stop', o.last ?? 'hard-stop',
      o.title ?? `Lane ${id}`, o.stop ?? null, o.chat ?? 'C-2026-01-08-1000');
}
const settingsFor = () => ({ value: (k) => ({ 'harness.laneRun': 'auto', 'limits.laneMinutes': 90 })[k] });

test('lanesApi: waitingCards longest waiting first, with the wait read through waitFor', (t) => {
  const dir = world(t);
  const laneRoot = join(dir, 'lanes');
  mkdirSync(laneRoot);
  const db = lanesDb(t, dir);
  row(db, 'P-2026-01-08-1101', { stop: 'ceiling', end: NOW - 20 * MIN });
  row(db, 'P-2026-01-08-1102', { last: 'question', end: NOW - 90 * MIN });
  row(db, 'P-2026-01-08-1103', { stop: 'breakpoint', end: NOW - 50 * MIN });
  row(db, 'P-2026-01-08-1104', { last: 'done' });
  const asked = [];
  const waitFor = (id, kind) => { asked.push(`${id}:${kind}`); return { reason: `why ${id}`, recommended: kind === 'question' ? 'yes' : '', chatUrl: '' }; };
  const d = lanesApi(db, { repo: 'R', now: NOW, laneRoot, settingsFor, updatedMs: NOW, waitFor });
  assert.deepEqual(d.waitingCards.map((c) => c.id), ['P-2026-01-08-1102', 'P-2026-01-08-1103', 'P-2026-01-08-1101']);
  assert.deepEqual(d.waitingCards.map((c) => [c.wait.kind, c.wait.pill]), [['question', 'answer'], ['breakpoint', 'GO'], ['ceiling', 'ACK']]);
  assert.deepEqual({ ...d.waitingCards[0].wait }, { kind: 'question', pill: 'answer', reason: 'why P-2026-01-08-1102', recommended: 'yes', chatUrl: '', since: NOW - 90 * MIN });
  assert.equal(asked.length, 3, 'only waiting lanes are read');
  const bare = lanesApi(db, { repo: 'R', now: NOW, laneRoot, settingsFor, updatedMs: NOW });
  assert.equal(bare.waitingCards[0].wait.reason, '', 'no waitFor: no text');
});

// Shaped like the README example of Jjodel's lane board (4700): the keys and their types.
const FIXTURE_4700 = {
  v: 1, now: 1792300000000, stale: false, board: 'ok',
  waiting: 1, blocked: 0, running: 2, staleCount: 12, staleOldest: 1790960000000,
  items: [{ id: 'P-…', kind: 'hard-stop', laneKind: 'discovery', title: '…', chat: 'C-…', chatUrl: 'https://claude.ai/…', firstLine: '…', recommended: '…', since: 1792298000000 }],
  runningItems: [{ id: 'P-…', laneKind: 'phase2', title: '…', phase: '…', left: 'about 20 min', since: 1792299000000 }],
};
const shape = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v]));

test('attentionApi: the keys and types of the 4700 answer, items and runningItems included', (t) => {
  const dir = world(t);
  const laneRoot = join(dir, 'lanes');
  mkdirSync(laneRoot);
  const db = lanesDb(t, dir);
  row(db, 'P-2026-01-08-1101', { stop: 'breakpoint', end: NOW - 20 * MIN });
  row(db, 'P-2026-01-08-1102', { last: 'question', end: NOW - 90 * MIN });
  row(db, 'P-2026-01-08-1103', { live: true, started: NOW - 30 * MIN });
  row(db, 'P-2026-01-05-1000', { stop: 'hard-stop', end: NOW - 5 * 24 * 60 * MIN });
  const waitFor = () => ({ reason: 'x'.repeat(200), recommended: 'go', chatUrl: 'https://claude.ai/chat/1' });
  const a = attentionApi(lanesApi(db, { now: NOW, laneRoot, settingsFor, updatedMs: NOW - 10_000, waitFor }), { now: NOW, staleMs: 60_000 });
  assert.deepEqual(Object.keys(a), Object.keys(FIXTURE_4700));
  assert.deepEqual(shape(a), shape(FIXTURE_4700));
  assert.deepEqual(shape(a.items[0]), shape(FIXTURE_4700.items[0]));
  assert.deepEqual(shape(a.runningItems[0]), shape(FIXTURE_4700.runningItems[0]));
  assert.deepEqual([a.waiting, a.blocked, a.running, a.staleCount, a.stale, a.board], [2, 0, 1, 1, false, 'ok']);
  assert.deepEqual(a.items.map((i) => [i.id, i.kind]), [['P-2026-01-08-1102', 'question'], ['P-2026-01-08-1101', 'hard-stop']], 'oldest first; no stop kind');
  assert.ok(a.items.every((i) => i.firstLine.length <= 61 && i.chatUrl === 'https://claude.ai/chat/1'));
  assert.deepEqual([a.runningItems[0].phase, a.runningItems[0].left], ['', '']);
  const late = attentionApi(lanesApi(db, { now: NOW, laneRoot, settingsFor, updatedMs: NOW - 120_000, waitFor }), { now: NOW, staleMs: 60_000 });
  assert.equal(late.stale, true, 'no collection within staleMs');
});

test('attentionApi: under 2 KB with many items, the counts kept; off and no-root answer board: error', (t) => {
  const dir = world(t);
  const laneRoot = join(dir, 'lanes');
  mkdirSync(laneRoot);
  const db = lanesDb(t, dir);
  for (let i = 10; i < 50; i++) row(db, `P-2026-01-08-11${i}`, { stop: 'breakpoint', end: NOW - i * MIN, title: 'T'.repeat(200) });
  const waitFor = () => ({ reason: 'r'.repeat(300), recommended: 'q'.repeat(300), chatUrl: 'https://claude.ai/chat/' + 'u'.repeat(40) });
  const a = attentionApi(lanesApi(db, { now: NOW, laneRoot, settingsFor, updatedMs: NOW, waitFor }), { now: NOW });
  assert.ok(Buffer.byteLength(JSON.stringify(a)) <= ATTENTION_MAX_BYTES);
  assert.equal(a.waiting, 40, 'the count keeps the items left out');
  assert.ok(a.items.length > 0 && a.items.length < 40);
  assert.equal(a.items[0].id, 'P-2026-01-08-1149', 'the oldest stays');
  const off = attentionApi(lanesApi(db, { repo: 'R', now: NOW, laneRoot, settingsFor: () => ({ value: (k) => (k === 'harness.laneRun' ? 'off' : 90) }), updatedMs: NOW }), { now: NOW });
  assert.match(off.board, /^error: Lanes are turned off/);
  assert.deepEqual(shape(off), shape({ ...FIXTURE_4700, staleOldest: null }));
  const none = attentionApi(lanesApi(db, { now: NOW, laneRoot: join(dir, 'gone'), settingsFor, updatedMs: NOW }), { now: NOW });
  assert.match(none.board, /^error: No lane-run folder/);
  assert.deepEqual([none.items.length, none.runningItems.length, none.waiting], [0, 0, 0]);
});

test('GET /api/attention on a board: 200, JSON, no CORS header', async (t) => {
  const dir = world(t);
  const laneRoot = join(dir, 'lanes');
  mkdirSync(laneRoot);
  const b = await startBoard({ store: join(dir, 'store.db'), root: join(dir, 'none'), cwd: dir, port: 0, scanOnStart: false, sample: false,
    user: join(dir, 'settings.json'), laneRoot });
  t.after(() => b.close());
  const r = await fetch(`${b.url}api/attention`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('access-control-allow-origin'), null);
  const body = await r.json();
  assert.deepEqual(Object.keys(body), Object.keys(FIXTURE_4700));
  assert.equal(body.board, 'ok', 'an empty lane folder is not an error');
});

test('chatUrlOf: the Request: header wins; else the Claude-Session: trailer of the commit adding the prompt; else none', (t) => {
  const dir = world(t);
  const lane = join(dir, 'lane');
  mkdirSync(lane);
  writeFileSync(join(lane, 'input-1.md'), '# P\n\nRequest: https://claude.ai/chat/from-request\n\n## COSA\nRequest: https://claude.ai/chat/body\n');
  assert.deepEqual({ ...chatUrlOf(lane) }, { url: 'https://claude.ai/chat/from-request', from: 'request' });
  assert.deepEqual({ ...chatUrlOf(lane, '# P\n\nRequest: Alfonso, in the chat\n') }, { url: '', from: '' }, 'not a claude.ai URL');

  const repo = initRepo(join(dir, 'repo'));
  commit(repo, { sec: T0, file: 'docs/prompts/p.md', content: '# P\n\nRequest: Alfonso, 10:12\n',
    message: 'docs: add prompt\n\nClaude-Session: https://claude.ai/code/x\n' });
  // Removed and added again by a later commit: the oldest adding commit still names the chat.
  g(repo, ['rm', '-q', 'docs/prompts/p.md']);
  g(repo, ['commit', '-q', '-m', 'docs: drop prompt'], { sec: T0 + 30 });
  commit(repo, { sec: T0 + 60, file: 'docs/prompts/p.md', content: '# P\n\nRequest: Alfonso, 10:12\nStatus: done\n',
    message: 'docs: add prompt again\n\nClaude-Session: https://claude.ai/code/later\n' });
  writeFileSync(join(lane, 'prompt.txt'), join(repo, 'docs/prompts/p.md') + '\n');
  assert.deepEqual({ ...chatUrlOf(lane) }, { url: 'https://claude.ai/code/x', from: 'commit' }, 'the oldest commit that added the file');

  writeFileSync(join(lane, 'prompt.txt'), join(dir, 'nowhere', 'p.md') + '\n');
  assert.deepEqual({ ...chatUrlOf(lane, '# P\n') }, { url: '', from: '' });
});
