// tack board: a local page over the store, node:http only, bound to 127.0.0.1. On start it runs an
// incremental scan (the collectors of slices 2-3), then serves the page and the JSON API of api.mjs;
// POST /api/rescan repeats the scan. Slice 9: GET /api/attention (the 4700 board's shape). Nothing is written outside the store: the selection lives in
// the URL, the last scan time in memory. Slice 7: /settings and the settings API (writes go to the user
// file or tack.local.json only), the host load sampler and GET /api/load, and the notifier (notify: true, set
// by the CLI, off under TACK_NOTIFY=off).
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { openStore, storePath } from '../store/open.mjs';
import { scan, defaultRoot } from '../collectors/claude-code/collect.mjs';
import { identify } from '../collectors/git/identity.mjs';
import { collectGit } from '../collectors/git/collect.mjs';
import { collectLayers, laneLimit } from '../collectors/layers.mjs';
import { traceSource } from '../collectors/active.mjs';
import { attentionApi, dayParam, healthApi, lanesApi, listBoardRepos, metricsApi, preselect, repoParam, sessionsApi, timelineApi, unrecordedRepo } from './api.mjs';
import { waitReader } from './waiting.mjs';
import { htmlAttributes, loadApi, settingsApi, settingsWrite } from './settings-api.mjs';
import { createSampler, runningLanes } from '../host/load.mjs';
import { effectiveSettings, settingsResolver, userSettingsPath } from '../settings/settings.mjs';
import { testMessage } from '../notify/notifier.mjs';
import { defaultTransports } from '../notify/transports.mjs';
import { TICK_MS, notifyDisabled, startWatcher } from '../notify/watch.mjs';

export const DEFAULT_PORT = 4710;

const asset = (name) => readFileSync(new URL(`./${name}`, import.meta.url), 'utf8');
const PAGE = asset('page.html');
const ASSETS = {
  '/board.css': ['text/css; charset=utf-8', asset('board.css')],
  '/charts.js': ['text/javascript; charset=utf-8', asset('charts.js')],
  '/board.js': ['text/javascript; charset=utf-8', asset('board.js')],
  '/timeline.js': ['text/javascript; charset=utf-8', asset('timeline.js')],
  '/insights.js': ['text/javascript; charset=utf-8', asset('insights.js')],
  '/lanes.js': ['text/javascript; charset=utf-8', asset('lanes.js')],
  '/settings.js': ['text/javascript; charset=utf-8', asset('settings.js')],
  '/loadmeter.js': ['text/javascript; charset=utf-8', asset('loadmeter.js')],
};

// A notifier lease whose heartbeat is younger than this has a watcher collecting the lanes (it ticks every TICK_MS).
const LEASE_FRESH_MS = 3 * TICK_MS;

/**
 * Collect-on-read for /api/lanes: refresh() reads the lane folders when no notifier holds a fresh lease and the last
 * collection of this board is at least TICK_MS old; it answers whether it collected. updatedMs(): the latest
 * collection, this board's or the lease holder's heartbeat. collect is injected by tests.
 */
export function laneRefresher({ db, laneRoot, now = Date.now, user, collect = null }) {
  let last = null;
  const lease = db.prepare('SELECT heartbeat_ms FROM notify_lease WHERE id = 1');
  const heartbeat = () => lease.get()?.heartbeat_ms ?? null;
  const run = collect ?? ((t) => traceSource.collect(db, laneRoot, t, { limitMs: laneLimit(db, { user }) }));
  return {
    refresh() {
      const t = now();
      const hb = heartbeat();
      if (hb !== null && t - hb < LEASE_FRESH_MS) return false;
      if (last !== null && t - last < TICK_MS) return false;
      run(t);
      last = t;
      return true;
    },
    updatedMs() {
      const hb = heartbeat();
      const watched = hb !== null && now() - hb < LEASE_FRESH_MS ? hb : null;
      return last === null ? watched : watched === null ? last : Math.max(last, watched);
    },
  };
}

/** One incremental scan: transcripts, repository identity, git history. Counts only, never a path. */
export function runScan(db, root) {
  const t0 = Date.now();
  try {
    const st = scan(db, root);
    const id = identify(db);
    const g = collectGit(db);
    const ly = collectLayers(db);
    return {
      at: new Date().toISOString(), durationMs: Date.now() - t0, ok: true,
      added: { sessions: st.sessionsAdded, calls: st.callsAdded, modelCosts: st.modelCostsAdded, repos: id.reposAdded, links: id.linksAdded, commits: g.commitsAdded },
      changed: { calls: st.callsUpdated, links: id.linksChanged, commitsRemoved: g.commitsRemoved },
      files: st.files, gitErrors: g.errors,
      layers: { unitsByPrompt: ly.units.prompt, unitsByCommit: ly.units.commit, lanes: ly.lanes.enabled ? ly.lanes.lanes : null, logEntries: ly.logs.entries },
    };
  } catch (err) {
    process.stderr.write(`tack board: scan failed: ${err.stack ?? err}\n`);
    return { at: new Date().toISOString(), durationMs: Date.now() - t0, ok: false, error: String(err.code ?? err.name ?? 'error') };
  }
}

function send(res, status, type, body) {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(body);
}
const json = (res, status, value) => send(res, status, 'application/json; charset=utf-8', JSON.stringify(value));

/** The JSON body of a POST, at most 64 KiB; null when it is not JSON. */
function readBody(req) {
  return new Promise((resolve) => {
    let n = 0;
    const chunks = [];
    req.on('data', (c) => { n += c.length; if (n <= 65536) chunks.push(c); });
    req.on('end', () => { if (n > 65536) return resolve(null); try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}

/**
 * Starts the board. store: the store file; root: the transcripts root; cwd: the start directory
 * that picks the preselected repository (a git work tree the store does not hold is preselected as unrecorded:
 * empty answers, never all repositories); port 0 picks a free one; user: the user settings file;
 * notify: run the notifier (the CLI sets it; tests leave it off); transports: the channels, injected
 * by tests; sample: run the load sampler. Resolves to { url, port, preselected, unrecorded, server, close } once listening.
 */
export async function startBoard({ store, root = defaultRoot(), cwd = process.cwd(), port = DEFAULT_PORT, scanOnStart = true,
  user = userSettingsPath(), notify = false, transports = null, sample = true, sampler = null, laneRoot = traceSource.root() } = {}) {
  const db = openStore(store);
  const userSettings = () => effectiveSettings({ user });
  const channels = transports ?? defaultTransports(userSettings);
  const meter = sampler ?? (sample ? createSampler({ running: () => runningLanes(db) }).start() : null);
  let lastScan = scanOnStart ? runScan(db, root) : null;
  const stored = preselect(db, cwd);
  let unrecorded = stored ? null : unrecordedRepo(db, cwd);
  let preselected = stored ?? unrecorded?.key ?? null;
  let allowed = new Set();
  const lanes = laneRefresher({ db, laneRoot, user });
  const waitFor = waitReader(laneRoot);
  const lanesOf = (repo) => lanesApi(db, { repo, laneRoot, settingsFor: settingsResolver(db, { user }), updatedMs: lanes.updatedMs(), waitFor, unrecorded });

  const server = createServer((req, res) => {
    // Bound to 127.0.0.1; the Host check also turns away a DNS-rebound page, the Origin check a cross-site POST.
    if (!allowed.has(req.headers.host)) return send(res, 421, 'text/plain; charset=utf-8', 'unknown host\n');
    const origin = req.headers.origin;
    if (origin && !allowed.has(origin.replace(/^http:\/\//, ''))) return send(res, 403, 'text/plain; charset=utf-8', 'cross-origin request\n');
    const url = new URL(req.url, 'http://127.0.0.1');
    const p = url.pathname;
    try {
      if (p === '/api/settings' && req.method === 'POST') {
        return readBody(req).then((body) => {
          if (!body) return json(res, 400, { error: 'a JSON body' });
          const repo = repoParam(db, body.repo ?? 'all', unrecorded);
          if (repo.error) return json(res, 400, { error: repo.error });
          const r = settingsWrite(db, { ...body, repo: repo.key }, { user });
          return json(res, r.status, r.body);
        }).catch((err) => json(res, 500, { error: String(err.code ?? err.name ?? 'error') }));
      }
      if (p === '/api/notify-test') {
        if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
        return readBody(req).then(async (body) => {
          const ch = body && body.channel;
          if (!channels[ch]) return json(res, 400, { error: 'channel is desktop or ntfy' });
          try { await channels[ch].send(testMessage(`http://${req.headers.host}/`)); } catch (err) { return json(res, 502, { error: err.message }); }
          return json(res, 200, { sent: ch });
        });
      }
      if (p === '/api/rescan') {
        if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
        lastScan = runScan(db, root);
        // A session recorded since the start turns the unrecorded work tree into a stored repository.
        if (unrecorded) { const hit = preselect(db, cwd); if (hit) { unrecorded = null; preselected = hit; } }
        return json(res, lastScan.ok ? 200 : 500, { lastScan });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'GET only' });
      if (p === '/' || p === '/settings') return send(res, 200, 'text/html; charset=utf-8', PAGE.replace('<html lang="en">', `<html lang="en" ${htmlAttributes(user)}>`));
      if (ASSETS[p]) return send(res, 200, ...ASSETS[p]);
      if (p === '/api/settings' || p === '/api/load') {
        const repo = repoParam(db, url.searchParams.get('repo'), unrecorded);
        if (repo.error) return json(res, 400, { error: repo.error });
        return json(res, 200, p === '/api/settings' ? settingsApi(db, { repo: repo.key, user }) : loadApi(db, meter, { repo: repo.key, user }));
      }
      if (p === '/api/lanes') {
        const repo = repoParam(db, url.searchParams.get('repo'), unrecorded);
        if (repo.error) return json(res, 400, { error: repo.error });
        lanes.refresh();
        return json(res, 200, lanesOf(repo.key));
      }
      // The menu bar app's route, in the shape of Jjodel's lane board (4700): all repositories, no CORS header.
      if (p === '/api/attention') {
        lanes.refresh();
        return json(res, 200, attentionApi(lanesOf(null), { staleMs: LEASE_FRESH_MS }));
      }
      if (p === '/api/health') return json(res, 200, healthApi(db, { store, lastScan }));
      if (p === '/api/repos') return json(res, 200, { preselected, unrecorded, repos: listBoardRepos(db) });
      if (p === '/api/sessions' || p === '/api/metrics' || p === '/api/timeline') {
        const q = (k) => url.searchParams.get(k);
        const repo = repoParam(db, q('repo'), unrecorded);
        const since = dayParam('since', q('since'));
        const until = dayParam('until', q('until'));
        const bad = repo.error ?? since.error ?? until.error;
        if (bad) return json(res, 400, { error: bad });
        const api = { '/api/sessions': sessionsApi, '/api/metrics': metricsApi, '/api/timeline': timelineApi }[p];
        return json(res, 200, api(db, { repo: repo.key, since: since.day, until: until.day }));
      }
      return json(res, 404, { error: 'not found' });
    } catch (err) {
      process.stderr.write(`tack board: ${req.method} ${p}: ${err.stack ?? err}\n`);
      return json(res, 500, { error: String(err.code ?? err.name ?? 'error') });
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  const bound = server.address().port;
  allowed = new Set([`127.0.0.1:${bound}`, `localhost:${bound}`]);
  const watcher = notify && !notifyDisabled()
    ? startWatcher({ db, root, sampler: meter, transports: channels, boardUrl: `http://127.0.0.1:${bound}/`, baseRepo: stored, user,
      log: (x) => process.stderr.write(`tack board: ${x}\n`) })
    : null;
  if (watcher) watcher.tick();
  return {
    url: `http://127.0.0.1:${bound}/`, port: bound, preselected, unrecorded, server, lastScan: () => lastScan, watcher, sampler: meter,
    close: () => new Promise((resolve) => { watcher?.stop(); if (!sampler) meter?.stop(); server.close(() => { db.close(); resolve(); }); }),
  };
}

/** Opens url with the platform command; a failure is reported, never fatal. */
function openBrowser(url) {
  const [cmd, args] = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
    child.on('error', () => process.stderr.write(`tack board: could not run ${cmd}; open ${url}\n`));
    child.unref();
  } catch {
    process.stderr.write(`tack board: could not run ${cmd}; open ${url}\n`);
  }
}

/** The CLI: tack board [--port <n>] [--no-open] [--store <file>] [--root <dir>]. */
export async function boardCmd(flags) {
  const port = flags.port === undefined ? DEFAULT_PORT : Number(flags.port);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    process.stderr.write(`tack board: --port takes 0..65535, got ${flags.port}\n`);
    return 2;
  }
  let b;
  try {
    b = await startBoard({ store: storePath(flags.store), root: flags.root ?? defaultRoot(), port, notify: true });
  } catch (err) {
    process.stderr.write(`tack board: ${err.code === 'EADDRINUSE' ? `port ${port} is in use (--port <n>)` : err.message}\n`);
    return 1;
  }
  const s = b.lastScan();
  process.stdout.write(`tack board on ${b.url}\n`);
  process.stdout.write(`scan: ${s.ok ? `${s.durationMs} ms, rows added: sessions ${s.added.sessions}, calls ${s.added.calls}, commits ${s.added.commits}` : `failed (${s.error})`}\n`);
  process.stdout.write(`repository: ${b.unrecorded ? `${b.unrecorded.name}, no recorded session` : b.preselected ? b.preselected.slice(0, 12) : 'none here, all repositories'}\n`);
  process.stdout.write(`notifier: ${b.watcher ? 'on (one per store: the lease decides)' : 'off (TACK_NOTIFY=off)'}\n`);
  if (!flags['no-open']) openBrowser(b.preselected ? `${b.url}?repo=${b.preselected}` : b.url);
  const stop = () => b.close().then(() => process.exit(0));
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  return undefined;
}
