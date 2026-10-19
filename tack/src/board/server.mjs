// tack board: a local page over the store, node:http only, bound to 127.0.0.1. On start it runs an
// incremental scan (the collectors of slices 2-3), then serves the page and the JSON API of api.mjs;
// POST /api/rescan repeats the scan. Nothing is written outside the store: the selection lives in
// the URL, the last scan time in memory.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { openStore, storePath } from '../store/open.mjs';
import { scan, defaultRoot } from '../collectors/claude-code/collect.mjs';
import { identify } from '../collectors/git/identity.mjs';
import { collectGit } from '../collectors/git/collect.mjs';
import { dayParam, healthApi, listBoardRepos, metricsApi, preselect, repoParam, sessionsApi } from './api.mjs';

export const DEFAULT_PORT = 4710;

const asset = (name) => readFileSync(new URL(`./${name}`, import.meta.url), 'utf8');
const ASSETS = {
  '/': ['text/html; charset=utf-8', asset('page.html')],
  '/board.css': ['text/css; charset=utf-8', asset('board.css')],
  '/board.js': ['text/javascript; charset=utf-8', asset('board.js')],
};

/** One incremental scan: transcripts, repository identity, git history. Counts only, never a path. */
export function runScan(db, root) {
  const t0 = Date.now();
  try {
    const st = scan(db, root);
    const id = identify(db);
    const g = collectGit(db);
    return {
      at: new Date().toISOString(), durationMs: Date.now() - t0, ok: true,
      added: { sessions: st.sessionsAdded, calls: st.callsAdded, modelCosts: st.modelCostsAdded, repos: id.reposAdded, links: id.linksAdded, commits: g.commitsAdded },
      changed: { calls: st.callsUpdated, links: id.linksChanged, commitsRemoved: g.commitsRemoved },
      files: st.files, gitErrors: g.errors,
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

/**
 * Starts the board. store: the store file; root: the transcripts root; cwd: the start directory
 * that picks the preselected repository; port 0 picks a free one. Resolves to { url, port,
 * preselected, server, close } once listening.
 */
export async function startBoard({ store, root = defaultRoot(), cwd = process.cwd(), port = DEFAULT_PORT, scanOnStart = true } = {}) {
  const db = openStore(store);
  let lastScan = scanOnStart ? runScan(db, root) : null;
  const preselected = preselect(db, cwd);
  let allowed = new Set();

  const server = createServer((req, res) => {
    // Bound to 127.0.0.1; the Host check also turns away a DNS-rebound page, the Origin check a cross-site POST.
    if (!allowed.has(req.headers.host)) return send(res, 421, 'text/plain; charset=utf-8', 'unknown host\n');
    const origin = req.headers.origin;
    if (origin && !allowed.has(origin.replace(/^http:\/\//, ''))) return send(res, 403, 'text/plain; charset=utf-8', 'cross-origin request\n');
    const url = new URL(req.url, 'http://127.0.0.1');
    const p = url.pathname;
    try {
      if (p === '/api/rescan') {
        if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
        lastScan = runScan(db, root);
        return json(res, lastScan.ok ? 200 : 500, { lastScan });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'GET only' });
      if (ASSETS[p]) return send(res, 200, ...ASSETS[p]);
      if (p === '/api/health') return json(res, 200, healthApi(db, { store, lastScan }));
      if (p === '/api/repos') return json(res, 200, { preselected, repos: listBoardRepos(db) });
      if (p === '/api/sessions' || p === '/api/metrics') {
        const q = (k) => url.searchParams.get(k);
        const repo = repoParam(db, q('repo'));
        const since = dayParam('since', q('since'));
        const until = dayParam('until', q('until'));
        const bad = repo.error ?? since.error ?? until.error;
        if (bad) return json(res, 400, { error: bad });
        return json(res, 200, p === '/api/sessions'
          ? sessionsApi(db, { repo: repo.key, since: since.day, until: until.day })
          : metricsApi(db, { repo: repo.key, since: since.day }));
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
  return {
    url: `http://127.0.0.1:${bound}/`, port: bound, preselected, server, lastScan: () => lastScan,
    close: () => new Promise((resolve) => server.close(() => { db.close(); resolve(); })),
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
    b = await startBoard({ store: storePath(flags.store), root: flags.root ?? defaultRoot(), port });
  } catch (err) {
    process.stderr.write(`tack board: ${err.code === 'EADDRINUSE' ? `port ${port} is in use (--port <n>)` : err.message}\n`);
    return 1;
  }
  const s = b.lastScan();
  process.stdout.write(`tack board on ${b.url}\n`);
  process.stdout.write(`scan: ${s.ok ? `${s.durationMs} ms, rows added: sessions ${s.added.sessions}, calls ${s.added.calls}, commits ${s.added.commits}` : `failed (${s.error})`}\n`);
  process.stdout.write(`repository: ${b.preselected ? b.preselected.slice(0, 12) : 'none here, all repositories'}\n`);
  if (!flags['no-open']) openBrowser(b.preselected ? `${b.url}?repo=${b.preselected}` : b.url);
  const stop = () => b.close().then(() => process.exit(0));
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  return undefined;
}
