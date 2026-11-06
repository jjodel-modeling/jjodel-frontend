// The notifier: rules over what the collectors already store, never hooks in lane-run. A rule yields facts;
// an edge rule's fact is one occurrence (rule, unit, transition), a level rule's fact is a condition that opens
// an episode while true. Each occurrence is claimed once in notify_events (INSERT OR IGNORE: a message goes out
// only when the claim inserted the row), so a poll never repeats one and a restart replays none:
// - the first evaluation of a rule records what it sees as `baseline` (notify_baseline remembers it ran);
// - an occurrence seen while its row is off is `suppressed`, so turning a row on never floods;
// - an occurrence whose fact is older than 24 h at first sight is `stale`;
// - in quiet hours a non-urgent occurrence is `queued`, and one digest goes out when they end (`digested`).
// A message carries kind, unit, front, repository name, outcome and a board link only (buildMessage).
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

export const NOTIFY_COLUMN_SOURCES = {
  notify_events: {
    rule: 'catalogue event kind (enum)', unit: 'lanes.id, sessions.id, repos.key, repos.key:day or host', transition: 'turn count, merge state or episode start (an id)',
    seen_ms: 'evaluation time', closed_ms: 'evaluation time the condition turned false', status: 'notifier decision (enum)',
    delivered_ms: 'send time', channels: 'channel names that accepted (JSON array of enums)', urgent: 'catalogue flag (boolean)',
  },
  notify_baseline: { rule: 'catalogue event kind (enum)', at_ms: 'first evaluation time' },
  notify_lease: { id: 'constant 1', pid: 'process.pid of the holder', heartbeat_ms: 'last tick time' },
};

const STALE_MS = 24 * 3600e3;
const LEASE_TTL_MS = 60_000;

/** The event catalogue, in the order the settings page shows it. lane: the scope filter applies. */
export const CATALOGUE = [
  { kind: 'lane_question', label: 'Lane asks a question', urgent: true, lane: true, type: 'edge' },
  // The three stops behind Outcome: hard-stop (lanes.stop_kind, R-TACK-6), one event each (slice 9).
  { kind: 'lane_breakpoint', label: 'Lane at a breakpoint (waits for a GO)', urgent: false, lane: true, type: 'edge' },
  { kind: 'lane_ceiling', label: 'Lane at the context ceiling (handoff written)', urgent: false, lane: true, type: 'edge' },
  { kind: 'lane_hard_stop', label: 'Lane in hard-stop (unplanned)', urgent: false, lane: true, type: 'edge' },
  { kind: 'lane_blocked', label: 'Lane blocked', urgent: true, lane: true, type: 'edge' },
  { kind: 'gate_red', label: 'Gate red at merge', urgent: false, lane: true, type: 'edge' },
  { kind: 'context_hard', label: 'Context above the hard ceiling', urgent: false, lane: false, type: 'edge' },
  { kind: 'cz_ask', label: 'Critical-zone lane asks', urgent: false, lane: true, type: 'edge' },
  { kind: 'lane_silent', label: 'Lane silent', urgent: false, lane: true, type: 'level' },
  { kind: 'merge_conflict', label: 'Merge conflict', disabled: 'not derivable in v0: lane-run leaves no conflict record in a file Tack reads (result.json keeps ok, merge and gates only)' },
  { kind: 'lane_done', label: 'Lane done', urgent: false, lane: true, type: 'edge' },
  { kind: 'lane_started', label: 'Lane started', urgent: false, lane: true, type: 'edge' },
  { kind: 'merge_completed', label: 'Merge completed', urgent: false, lane: true, type: 'edge' },
  { kind: 'daily_spend', label: 'Daily spend over budget', urgent: false, lane: false, type: 'level' },
  { kind: 'host_load', label: 'Host load over threshold', urgent: false, lane: false, type: 'level' },
  { kind: 'unpushed', label: 'Unpushed commits over the limit', urgent: false, lane: false, type: 'level' },
  { kind: 'retention', label: 'Transcript retention shorter than the window', urgent: false, lane: false, type: 'level' },
];
const RULE = new Map(CATALOGUE.map((c) => [c.kind, c]));

export const MESSAGE_FIELDS = ['kind', 'unit', 'front', 'repo', 'outcome', 'link'];

/** The message of a fact: only the whitelisted fields are read; privacy settings drop the repository and the link. */
export function buildMessage(fact, { privacy = { repoName: true, boardLink: true } } = {}) {
  const f = Object.fromEntries(MESSAGE_FIELDS.map((k) => [k, fact[k] ?? null]));
  const rule = RULE.get(f.kind);
  const parts = [f.unit, f.front, privacy.repoName ? f.repo : null, f.outcome].filter((x) => x !== null && x !== '');
  return { title: `Tack - ${rule ? rule.label : f.kind}`, body: parts.join(' · ') || f.kind, click: privacy.boardLink ? f.link : null, urgent: !!rule?.urgent };
}

/** HH:MM of now in a time zone ('system' is the process zone), and whether it is inside quiet hours. */
export function inQuietHours(now, qh, timeZone = 'system') {
  if (!qh || !qh.enabled) return false;
  const tz = timeZone && timeZone !== 'system' ? timeZone : undefined;
  const hm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz }).format(new Date(now));
  const { start = '22:00', end = '08:00' } = qh;
  return start <= end ? hm >= start && hm < end : hm >= start || hm < end;
}

/** Claude Code's transcript retention: cleanupPeriodDays of ~/.claude/settings.json (read only), 30 when unset. */
export function claudeRetentionDays(path = join(homedir(), '.claude', 'settings.json')) {
  try {
    const v = JSON.parse(readFileSync(path, 'utf8')).cleanupPeriodDays;
    return Number.isFinite(v) ? v : 30;
  } catch { return 30; }
}

const repoName = (db) => {
  const q = db.prepare('SELECT toplevels FROM repos WHERE key = ?');
  const cache = new Map();
  return (key) => {
    if (!key) return null;
    if (!cache.has(key)) { const t = JSON.parse(q.get(key)?.toplevels ?? '[]'); cache.set(key, t.length ? basename(t[0]) : key.slice(0, 12)); }
    return cache.get(key);
  };
};

const localDay = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** The facts of every rule now: { kind: [fact] }. Edge facts carry transition and at; level facts carry active. */
export function facts(db, ctx) {
  const { now, settingsFor } = ctx;
  const name = repoName(db);
  const link = (repo) => `${ctx.boardUrl ?? 'http://127.0.0.1:4710/'}${repo ? `?repo=${repo}` : ''}`;
  const out = Object.fromEntries(CATALOGUE.filter((c) => !c.disabled).map((c) => [c.kind, []]));
  const lanes = db.prepare(`SELECT id, repo_key, started_ms, end_ms, live, turns, last_outcome, log_mtime_ms, critical, front, chat, merge_state, stop_kind
    FROM lanes`).all();
  const STOP_RULE = { breakpoint: 'lane_breakpoint', ceiling: 'lane_ceiling' };
  for (const l of lanes) {
    if (settingsFor(l.repo_key).value('harness.laneRun') === 'off') continue;
    const base = { unit: l.id, front: l.front, chat: l.chat, repoKey: l.repo_key, repo: name(l.repo_key), link: link(l.repo_key) };
    const at = l.log_mtime_ms ?? l.end_ms ?? l.started_ms ?? now;
    const n = l.turns ?? 0;
    const outcomeRule = l.last_outcome === 'hard-stop' ? STOP_RULE[l.stop_kind] ?? 'lane_hard_stop'
      : { question: 'lane_question', blocked: 'lane_blocked', done: 'lane_done' }[l.last_outcome];
    const shown = l.last_outcome === 'hard-stop' ? l.stop_kind ?? 'hard-stop' : l.last_outcome;
    if (outcomeRule) out[outcomeRule].push({ ...base, transition: `${l.last_outcome}#${n}`, at, outcome: shown });
    if (l.critical && l.last_outcome === 'question') out.cz_ask.push({ ...base, transition: `ask#${n}`, at, outcome: 'question' });
    if (l.started_ms) out.lane_started.push({ ...base, transition: 'started', at: l.started_ms, outcome: 'started' });
    if (l.merge_state === 'red') out.gate_red.push({ ...base, transition: 'red', at, outcome: 'red' });
    if (l.merge_state === 'merged') out.merge_completed.push({ ...base, transition: 'merged', at, outcome: 'merged' });
    if (l.live && l.log_mtime_ms) {
      const min = settingsFor(l.repo_key).value('idle.silentMinutes');
      out.lane_silent.push({ ...base, active: now - l.log_mtime_ms > min * 60e3, outcome: `silent ${min} min` });
    }
  }
  const since = new Date(now - STALE_MS).toISOString();
  const peaks = db.prepare(`SELECT c.session_id AS id, MAX(c.context) AS peak, MAX(c.ts) AS ts, sr.repo_key AS repo
    FROM calls c LEFT JOIN session_repo sr ON sr.session_id = c.session_id WHERE c.sidechain = 0 AND c.ts >= ? GROUP BY c.session_id`).all(since);
  for (const p of peaks) {
    if (p.peak >= settingsFor(p.repo).value('context.hardTokens')) {
      out.context_hard.push({ unit: p.id, transition: 'hard', at: Date.parse(p.ts) || now, repoKey: p.repo, repo: name(p.repo), link: link(p.repo), outcome: 'context hard' });
    }
  }
  const repos = db.prepare("SELECT key, unpushed FROM repos WHERE state = 'present'").all();
  const today = localDay(now);
  const spend = db.prepare(`SELECT s.first_ts, s.cost_usd FROM sessions s JOIN session_repo sr ON sr.session_id = s.id
    WHERE sr.repo_key = ? AND s.cost_known = 1 AND s.first_ts >= ?`);
  for (const r of repos) {
    const s = settingsFor(r.key);
    const budget = s.value('budget.dailyUsd');
    if (budget !== null && budget !== undefined) {
      const usd = spend.all(r.key, new Date(now - 2 * STALE_MS).toISOString()).filter((x) => localDay(Date.parse(x.first_ts)) === today).reduce((a, x) => a + x.cost_usd, 0);
      out.daily_spend.push({ unit: `${r.key}:${today}`, active: usd > budget, repoKey: r.key, repo: name(r.key), link: link(r.key), outcome: 'over budget' });
    }
    if (r.unpushed !== null && r.unpushed !== undefined) {
      out.unpushed.push({ unit: r.key, active: r.unpushed > s.value('git.unpushedMax'), repoKey: r.key, repo: name(r.key), link: link(r.key), outcome: `${r.unpushed} unpushed` });
    }
  }
  const host = settingsFor(ctx.baseRepo ?? null);
  if (ctx.load) {
    const T = host.value('load.threshold');
    // Re-arm below 85 % of the threshold: an open episode stays open until the load drops under it.
    out.host_load.push({ unit: 'host', activeIfOpen: ctx.load.load1 >= 0.85 * T, active: ctx.load.load1 > T, link: link(null), outcome: `load ${ctx.load.load1.toFixed(1)}` });
  }
  const keep = (ctx.retentionDays ?? claudeRetentionDays)();
  out.retention.push({ unit: 'host', active: keep < host.value('history.windowDays'), link: link(null), outcome: `retention ${keep} days` });
  return out;
}

/** The row of a fact's event in the settings of its repository, and whether its scope admits the fact. */
function rowFor(rule, fact, ctx) {
  const row = ctx.settingsFor(fact.repoKey ?? ctx.baseRepo ?? null).value(`notifications.events.${rule.kind}`);
  if (!row || !row.enabled) return { on: false, row };
  if (!rule.lane || !row.scope || row.scope.kind === 'all') return { on: true, row };
  const v = row.scope.values ?? [];
  return { on: row.scope.kind === 'fronts' ? v.includes(fact.front) : v.includes(fact.chat), row };
}

/** Takes or renews the single lease of a store: true when this pid holds it. */
export function takeLease(db, pid, now, ttl = LEASE_TTL_MS) {
  db.prepare(`INSERT INTO notify_lease (id, pid, heartbeat_ms) VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET pid = excluded.pid, heartbeat_ms = excluded.heartbeat_ms
    WHERE notify_lease.pid = excluded.pid OR notify_lease.heartbeat_ms < ?`).run(pid, now, now - ttl);
  return db.prepare('SELECT pid FROM notify_lease WHERE id = 1').get().pid === pid;
}
export const releaseLease = (db, pid) => db.prepare('DELETE FROM notify_lease WHERE id = 1 AND pid = ?').run(pid);

async function deliver(message, channels, ctx) {
  const user = ctx.settingsFor(null);
  const accepted = [];
  for (const ch of channels) {
    const cfg = user.value(`channels.${ch}`);
    const t = ctx.transports?.[ch];
    if (!t || !cfg || !cfg.enabled) continue;
    try { await t.send(message); accepted.push(ch); } catch (err) { ctx.log?.(`notify: ${ch} failed: ${err.message}`); }
  }
  return accepted;
}

/**
 * One evaluation of every rule. ctx: { now, settingsFor(repoKey), transports: { desktop, ntfy }, load, retentionDays,
 * baseRepo, boardUrl, log }. Resolves to { delivered, baseline, suppressed, stale, queued, digested, closed }.
 */
export async function notifyTick(db, ctx) {
  const { now } = ctx;
  const st = { delivered: 0, failed: 0, baseline: 0, suppressed: 0, stale: 0, queued: 0, digested: 0, closed: 0, messages: [] };
  const user = ctx.settingsFor(null);
  const quiet = inQuietHours(now, user.value('quietHours'), user.value('locale.timeZone'));
  const privacy = { repoName: user.value('privacy.repoName'), boardLink: user.value('privacy.boardLink') };
  const claim = db.prepare(`INSERT OR IGNORE INTO notify_events (rule, unit, transition, seen_ms, status, channels, urgent)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const settle = db.prepare('UPDATE notify_events SET status = ?, delivered_ms = ?, channels = ? WHERE rule = ? AND unit = ? AND transition = ?');
  const openEp = db.prepare('SELECT transition FROM notify_events WHERE rule = ? AND unit = ? AND closed_ms IS NULL');
  const close = db.prepare('UPDATE notify_events SET closed_ms = ? WHERE rule = ? AND unit = ? AND transition = ?');
  const baselined = new Set(db.prepare('SELECT rule FROM notify_baseline').all().map((r) => r.rule));
  const all = facts(db, ctx);
  const sends = [];
  for (const rule of CATALOGUE) {
    if (rule.disabled) continue;
    const first = !baselined.has(rule.kind);
    for (const f of all[rule.kind]) {
      let transition = f.transition;
      if (rule.type === 'level') {
        const open = openEp.get(rule.kind, f.unit);
        const active = open && f.activeIfOpen !== undefined ? f.activeIfOpen : f.active;
        if (open && !active) { close.run(now, rule.kind, f.unit, open.transition); st.closed++; continue; }
        if (open || !active) continue;
        transition = `episode@${now}`;
      }
      const { on, row } = rowFor(rule, f, ctx);
      const status = first ? 'baseline' : !on ? 'suppressed' : rule.type === 'edge' && now - f.at > STALE_MS ? 'stale' : quiet && !rule.urgent ? 'queued' : 'sending';
      const channels = JSON.stringify(row?.channels ?? []);
      if (claim.run(rule.kind, f.unit, transition, now, status === 'sending' ? 'failed' : status, status === 'queued' ? channels : null, rule.urgent ? 1 : 0).changes !== 1) continue;
      if (status !== 'sending') { st[status]++; continue; }
      sends.push({ rule, f: { ...f, kind: rule.kind }, transition, channels: row?.channels ?? [] });
    }
    if (first) db.prepare('INSERT OR IGNORE INTO notify_baseline (rule, at_ms) VALUES (?, ?)').run(rule.kind, now);
  }
  for (const s of sends) {
    const message = buildMessage(s.f, { privacy });
    const accepted = await deliver(message, s.channels, ctx);
    settle.run(accepted.length ? 'delivered' : 'failed', accepted.length ? now : null, JSON.stringify(accepted), s.rule.kind, s.f.unit, s.transition);
    st[accepted.length ? 'delivered' : 'failed']++;
    st.messages.push(message);
  }
  if (!quiet) {
    const queued = db.prepare("SELECT rule, unit, transition, channels FROM notify_events WHERE status = 'queued'").all();
    if (queued.length) {
      const counts = {};
      for (const q of queued) counts[q.rule] = (counts[q.rule] ?? 0) + 1;
      const channels = [...new Set(queued.flatMap((q) => JSON.parse(q.channels ?? '[]')))];
      const body = Object.entries(counts).map(([k, n]) => `${RULE.get(k)?.label ?? k} ${n}`).join(' · ');
      const message = { title: `Tack - ${queued.length} during quiet hours`, body, click: privacy.boardLink ? (ctx.boardUrl ?? 'http://127.0.0.1:4710/') : null, urgent: false };
      const accepted = await deliver(message, channels, ctx);
      for (const q of queued) settle.run('digested', now, JSON.stringify(accepted), q.rule, q.unit, q.transition);
      st.digested += queued.length;
      st.messages.push(message);
    }
  }
  return st;
}

/** The test message of a channel: fixed text, nothing from the store. */
export const testMessage = (boardUrl = 'http://127.0.0.1:4710/') => ({ title: 'Tack - test', body: 'Notifications reach this channel.', click: boardUrl, urgent: false });

