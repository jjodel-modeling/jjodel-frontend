/**
 * trace-monitor.ts — the live slice of the trace graph: a local page of the
 * lanes and their trace, updated by Server-Sent Events.
 *
 * Stage 1 of P-2026-09-27-1030 (discovery report
 * docs/discovery/discovery_2026-09-27_trace_monitor.md, sections 7 and 8.5).
 * It reads the sources directly, as trace-index.ts does, and never writes one.
 *
 * - Lanes: every pollMs (1 s) each lane folder is read; a log is read by offset,
 *   from where the last read stopped, and hashed incrementally. fs.watch
 *   (recursive) only hastens a read: it reports the appends of a lane's
 *   long-lived fd about once per run (report, 7.2), so the poll is the guarantee.
 * - Repo: every repoPollMs (5 s) a signature of the refs and of the source files
 *   (name, size, mtime) is compared; on a change the repo half is read again.
 * - Notification: when a lane stops running with an Outcome line (or without one,
 *   or goes past the limit), once, through osascript with the text as argv, never
 *   interpolated into the script. The lanes found at start notify nothing.
 * - HTTP on 127.0.0.1 only; a request whose Host is not 127.0.0.1 or localhost on
 *   the bound port is refused (403): the page shows tool inputs of every lane.
 *   Routes: / (the page), /index.json, /events (SSE: hello, lanes, index), /health.
 *
 * Run: node scripts/gates/trace-monitor.ts [--port <n>] [--repo <tree>] [--lanes <dir>] [--trunk <branch>]
 *   (lane-run monitor starts it detached and opens the page). Port 3008 by
 *   default; 3001 and a port in use are refused, exit 2. Plain node:*.
 */

import { createHash, type Hash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readdirSync, readSync, realpathSync, statSync, watch, type FSWatcher } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { homedir, platform } from 'node:os';
import { join, resolve } from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { fileURLToPath } from 'node:url';
import {
    buildIndex, commonDirOf, counts, DEFAULT_TRUNK, HOME_REPO, laneIds, laneMeta, LogAccumulator, readRepo,
    type LaneInput, type RepoInput, type SourceRecord, type TraceIndex, type TraceNode,
} from './trace-index.ts';

export const DEFAULT_PORT = 3008;
export const TITLE = 'Jjodel lanes';

/** A lane log read by offset: the decoder keeps a character cut between two reads, the hash is updated with each read. */
class LaneReader {
    offset = 0;
    acc = new LogAccumulator();
    hash: Hash = createHash('sha1');
    decoder = new StringDecoder('utf8');

    /** Reads what was appended since the last call; true when something was. */
    read(path: string): boolean {
        if (!existsSync(path)) return false;
        const size = statSync(path).size;
        if (size < this.offset) {
            // Replaced or truncated: start over.
            this.offset = 0;
            this.acc = new LogAccumulator();
            this.hash = createHash('sha1');
            this.decoder = new StringDecoder('utf8');
        }
        if (size === this.offset) return false;
        const buf = Buffer.alloc(size - this.offset);
        const fd = openSync(path, 'r');
        try {
            readSync(fd, buf, 0, buf.length, this.offset);
        } finally {
            closeSync(fd);
        }
        this.offset = size;
        this.hash.update(buf);
        this.acc.push(this.decoder.write(buf));
        return true;
    }

    digest(): string {
        return this.hash.copy().digest('hex');
    }
}

export interface MonitorOptions {
    repo: string;
    lanes: string;
    trunk?: string;
    /** 0 picks a free port (the tests). */
    port: number;
    pollMs?: number;
    repoPollMs?: number;
    notify?: (title: string, text: string) => void;
}

export interface Monitor {
    port: number;
    index(): TraceIndex;
    close(): Promise<void>;
}

/** osascript with the title and the text as argv: nothing the lane wrote reaches the script source. */
export function osascriptNotify(title: string, text: string): void {
    if (platform() !== 'darwin') return;
    const script = ['on run argv', 'display notification (item 2 of argv) with title (item 1 of argv)', 'end run'];
    const child = spawn('osascript', [...script.flatMap((l) => ['-e', l]), title, text], { stdio: 'ignore', detached: true });
    child.on('error', () => {});
    child.unref();
}

/** What a lane's notification is about: null while it runs, else its outcome, `exited` without one, or `blocked`. */
function notifyKey(n: TraceNode): string | null {
    if (n.state === 'blocked') return 'blocked';
    if (n.state === 'running') return null;
    return (n.outcome as string | null) ?? 'exited, no Outcome line';
}

/** The repo's change signature: the refs, and name, size and mtime of every source file. */
function repoSignature(repo: string): string {
    const parts: string[] = [];
    const refs = spawnSync('git', ['for-each-ref', '--format=%(refname) %(objectname)'], { cwd: repo, encoding: 'utf8' });
    parts.push(refs.status === 0 ? refs.stdout : '');
    const stat = (p: string) => {
        if (!existsSync(p)) return p + ' -';
        const s = statSync(p);
        return `${p} ${s.size} ${s.mtimeMs}`;
    };
    for (const d of ['docs/prompts', 'docs/log-inbox']) {
        const dir = join(repo, d);
        if (existsSync(dir)) for (const n of readdirSync(dir).sort()) parts.push(stat(join(dir, n)));
    }
    for (const f of ['docs/decisions.md', 'docs/claude-code-log.md', 'docs/claude-code-log-archive.md']) parts.push(stat(join(repo, f)));
    return createHash('sha1').update(parts.join('\n')).digest('hex');
}

export function startMonitor(o: MonitorOptions): Promise<Monitor> {
    const trunk = o.trunk ?? DEFAULT_TRUNK;
    const pollMs = o.pollMs ?? 1000;
    const repoPollMs = o.repoPollMs ?? 5000;
    const notify = o.notify ?? osascriptNotify;

    let repoInput: RepoInput;
    let head: string | null;
    let repoSources: SourceRecord[];
    let signature = '';
    let commonDir = commonDirOf(o.repo);
    let wtCache = new Map<string, { branch: string | null; repo: LaneInput['repo'] }>();
    const readers = new Map<string, LaneReader>();
    const laneJson = new Map<string, string>();
    const keys = new Map<string, string | null>();
    const clients = new Set<ServerResponse>();
    let index: TraceIndex;
    let version = 0;
    let started = false;

    const send = (event: string, data: unknown) => {
        const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const c of clients) c.write(msg);
    };

    const loadRepo = () => {
        signature = repoSignature(o.repo);
        const r = readRepo(o.repo, trunk);
        repoInput = r.input;
        head = r.head;
        repoSources = r.sources;
        commonDir = commonDirOf(o.repo);
        wtCache = new Map();
    };

    /** One pass over the lanes: read what grew, rebuild the index, push what changed. */
    const tick = (repoChanged = false) => {
        const ids = laneIds(o.lanes);
        const laneSources: SourceRecord[] = [];
        const inputs: LaneInput[] = [];
        for (const id of ids) {
            let reader = readers.get(id);
            if (!reader) readers.set(id, (reader = new LaneReader()));
            const log = join(o.lanes, id, 'log.jsonl');
            reader.read(log);
            let meta;
            try {
                meta = laneMeta(o.lanes, id, commonDir, wtCache, laneSources);
            } catch {
                continue; // a folder removed between the listing and the read
            }
            laneSources.push({ path: log.replace(homedir(), '~'), present: existsSync(log), hash: existsSync(log) ? reader.digest() : null });
            inputs.push({ ...meta, log: reader.acc.summary() });
        }
        for (const id of [...readers.keys()]) if (!ids.includes(id)) readers.delete(id);
        index = buildIndex(repoInput, inputs, { head, sources: [...repoSources, ...laneSources] });

        const changed: TraceNode[] = [];
        let setChanged = repoChanged;
        const seen = new Set<string>();
        for (const n of index.nodes) {
            if (n.type !== 'lane') continue;
            seen.add(n.id);
            const json = JSON.stringify(n);
            if (!laneJson.has(n.id)) setChanged = true;
            if (laneJson.get(n.id) !== json) changed.push(n);
            laneJson.set(n.id, json);
            const k = notifyKey(n);
            if (started && keys.has(n.id) && keys.get(n.id) !== k && k !== null) notify(TITLE, `${n.id}: ${k}`);
            keys.set(n.id, k);
        }
        for (const id of [...laneJson.keys()]) {
            if (!seen.has(id)) {
                laneJson.delete(id);
                keys.delete(id);
                setChanged = true;
            }
        }
        if (changed.length || setChanged) version++;
        if (changed.length) send('lanes', { version, lanes: changed });
        if (setChanged) send('index', { version, counts: counts(index) });
    };

    const repoTick = () => {
        if (repoSignature(o.repo) === signature) return;
        loadRepo();
        tick(true);
    };

    loadRepo();
    tick();
    started = true;

    const timers = [setInterval(() => tick(), pollMs), setInterval(repoTick, repoPollMs)];
    const ping = setInterval(() => {
        for (const c of clients) c.write(': ping\n\n');
    }, 15000);
    let watcher: FSWatcher | null = null;
    let soon: NodeJS.Timeout | null = null;
    try {
        watcher = watch(o.lanes, { recursive: true }, () => {
            if (soon) return;
            soon = setTimeout(() => {
                soon = null;
                tick();
            }, 50);
        });
        watcher.on('error', () => {});
    } catch {
        watcher = null; // no lanes folder yet: the poll covers it
    }

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
        const port = (server.address() as { port: number } | null)?.port;
        const host = req.headers.host ?? '';
        if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('foreign Host refused\n');
            return;
        }
        if (req.method !== 'GET') {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('GET only\n');
            return;
        }
        const path = (req.url ?? '/').split('?')[0];
        if (path === '/health') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('ok\n');
        } else if (path === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(PAGE);
        } else if (path === '/index.json') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(JSON.stringify(index));
        } else if (path === '/events') {
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
            res.write(`event: hello\ndata: ${JSON.stringify({ version })}\n\n`);
            clients.add(res);
            req.on('close', () => clients.delete(res));
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('not found\n');
        }
    });

    const close = () =>
        new Promise<void>((done) => {
            timers.forEach(clearInterval);
            clearInterval(ping);
            if (soon) clearTimeout(soon);
            watcher?.close();
            for (const c of clients) c.end();
            clients.clear();
            server.close(() => done());
            server.closeAllConnections();
        });

    return new Promise((ok, fail) => {
        server.once('error', (err) => {
            timers.forEach(clearInterval);
            clearInterval(ping);
            watcher?.close();
            fail(err);
        });
        server.listen(o.port, '127.0.0.1', () => {
            ok({ port: (server.address() as { port: number }).port, index: () => index, close });
        });
    });
}

// ── the page ─────────────────────────────────────────────────────────────────

/** One self-contained page: no external resource, every value inserted as text, never as HTML. */
export const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${TITLE}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { margin: 0; font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1d1d1f; background: #ffffff; }
header { position: sticky; top: 0; background: #ffffff; border-bottom: 1px solid #e5e5ea; padding: 8px 12px; display: flex; gap: 16px; align-items: baseline; }
header h1 { font-size: 15px; margin: 0; }
.muted { color: #6e6e73; }
#conn::before { content: ""; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #c4151c; margin-right: 6px; }
#conn.on::before { background: #0a7a33; }
main { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); }
section { padding: 8px 12px; overflow: auto; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 3px 6px; border-bottom: 1px solid #e5e5ea; vertical-align: top; white-space: nowrap; }
td.wrap { white-space: normal; }
tr.lane { cursor: pointer; }
tr.lane.picked { background: #eef4ff; }
.running, .blocked { font-weight: 600; }
.running, .o-done { color: #0a7a33; }
.o-hard-stop, .o-question { color: #b25000; }
.blocked, .o-blocked, .o-unparsed { color: #c4151c; }
h2 { font-size: 13px; margin: 14px 0 4px; }
ul { margin: 0; padding-left: 16px; }
details { margin-top: 12px; }
@media (prefers-color-scheme: dark) {
  body, header { color: #f5f5f7; background: #1c1c1e; }
  header, th, td { border-color: #38383a; }
  .muted { color: #a1a1a6; }
  tr.lane.picked { background: #1f2a3d; }
  .running, .o-done, #conn.on::before { color: #4cd774; }
  #conn.on::before { background: #4cd774; }
  .o-hard-stop, .o-question { color: #ffb340; }
  .blocked, .o-blocked, .o-unparsed { color: #ff6961; }
}
</style>
</head>
<body>
<header><h1>${TITLE}</h1><span id="conn">offline</span><span id="counts" class="muted"></span><span id="head" class="muted"></span></header>
<main>
<section><table><thead><tr><th>Lane</th><th>State</th><th>Outcome</th><th>Last event</th><th>Last tool</th><th>Runs</th><th>Cost</th><th>Tree</th><th>Prompt</th></tr></thead><tbody id="lanes"></tbody></table></section>
<section id="detail"><p class="muted">Pick a lane.</p></section>
</main>
<script>
"use strict";
let idx = null, picked = null, loading = false, again = false;
const $ = (id) => document.getElementById(id);
const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined && text !== null) e.textContent = String(text); if (cls) e.className = cls; return e; };
const node = (type, id) => idx && idx.nodes.find((n) => n.type === type && n.id === id);
const into = (type, to) => idx.edges.filter((e) => e.type === type && e.to === to);
const outOf = (type, from) => idx.edges.filter((e) => e.type === type && e.from === from);
const ago = (iso) => { if (!iso) return ""; const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000); return s < 60 ? Math.floor(s) + " s" : s < 3600 ? Math.floor(s / 60) + " min" : Math.floor(s / 3600) + " h " + Math.floor((s % 3600) / 60) + " min"; };
const base = (p) => (p || "").split("/").pop();
async function load() {
  if (loading) { again = true; return; }
  loading = true;
  try { idx = await (await fetch("/index.json")).json(); render(); } finally { loading = false; if (again) { again = false; load(); } }
}
function render() {
  $("counts").textContent = idx.nodes.length + " nodes, " + idx.edges.length + " edges, " + idx.misses.length + " misses";
  $("head").textContent = idx.head ? "HEAD " + idx.head.slice(0, 9) : "";
  renderLanes(); renderDetail();
}
function renderLanes() {
  if (!idx) return;
  const rank = (l) => (l.state === "exited" ? 1 : 0);
  const lanes = idx.nodes.filter((n) => n.type === "lane").sort((a, b) => rank(a) - rank(b) || (a.id < b.id ? 1 : -1));
  const body = $("lanes"); body.textContent = "";
  for (const l of lanes) {
    const tr = el("tr", null, "lane" + (l.id === picked ? " picked" : ""));
    tr.onclick = () => { picked = l.id; renderLanes(); renderDetail(); };
    const p = node("prompt", l.id);
    tr.append(el("td", l.id), el("td", l.state, l.state), el("td", l.outcome || "", "o-" + (l.outcome || "")),
      el("td", ago(l.lastEventAt)), el("td", l.lastTool ? l.lastTool.name + " " + l.lastTool.detail : "", "wrap"),
      el("td", l.runs), el("td", l.costUsd == null ? "" : "$" + l.costUsd.toFixed(2)),
      el("td", (base(l.worktree) || "") + (l.branch ? " (" + l.branch + ")" : "")), el("td", p ? p.title : "", "wrap"));
    body.append(tr);
  }
}
function list(title, items) {
  const box = document.createDocumentFragment();
  box.append(el("h2", title + " (" + items.length + ")"));
  const ul = el("ul");
  for (const i of items) ul.append(el("li", i));
  if (items.length) box.append(ul);
  return box;
}
function renderDetail() {
  const d = $("detail");
  if (!idx || !picked) return;
  const l = node("lane", picked); if (!l) return;
  d.textContent = "";
  const p = node("prompt", l.id), pk = "prompt:" + l.id;
  d.append(el("h2", l.id + (p ? ": " + p.title : "")));
  d.append(list("Lane", [
    "state " + l.state + (l.exit != null ? ", exit " + l.exit : "") + (l.outcomeLine ? ", " + l.outcomeLine : ""),
    "session " + (l.session || "-") + ", model " + (l.model || "-") + (l.tier ? ", tier " + l.tier : ""),
    "worktree " + (l.worktree || "-") + " (" + l.repo + (l.branch ? ", " + l.branch : "") + ")",
    "runs " + l.runs + ", tool calls " + l.toolCalls + ", inputs kept " + l.inputs + (l.goahead ? ", critical-zone go-ahead" : ""),
  ]));
  if (p) d.append(list("Prompt", [...p.files, "status " + (p.status || "-") + (p.statusSha ? " at " + p.statusSha : "") + ", lane " + (p.laneKind || "-") + ", chat " + (p.chat || "-")]));
  const commit = (e) => { const c = node("commit", e.from.startsWith("commit:") ? e.from.slice(7) : e.to.slice(7)); return c ? c.short + " " + c.subject + (c.onTrunk ? "" : " (not on the trunk)") : e.from; };
  d.append(list("Commits citing it", into("cites", pk).map(commit)));
  d.append(list("Closed by", outOf("closedBy", pk).map(commit)));
  const entry = (e) => { const n = node("logEntry", e.from.slice(9)); return n ? n.heading + "  [" + n.file + ":" + n.line + "]" : e.from; };
  d.append(list("Log entries", [...into("reports", pk), ...into("corrects", pk), ...into("foundIn", pk)].map(entry)));
  d.append(list("Decisions", into("decidedIn", pk).map((e) => { const n = node("decision", e.from.slice(9)); return n ? n.id + " (" + n.confidence + "): " + n.title : e.from; })));
  d.append(list("Checks", into("measures", "lane:" + l.id).map((e) => { const c = node("check", e.from.slice(6)); return c ? base(c.id) + ": " + (c.exit == null ? "no EXIT line" : "exit " + c.exit) : e.from; })));
  const own = idx.misses.filter((m) => m.source.includes(l.id) || (p && p.files.some((f) => m.source.startsWith(f))));
  if (own.length) d.append(list("Misses", own.map((m) => m.source + ": " + m.reason)));
  const all = el("details"); all.append(el("summary", "All misses (" + idx.misses.length + ")"));
  const ul = el("ul"); for (const m of idx.misses.slice(0, 500)) ul.append(el("li", m.type + " " + m.source + ": " + m.reason)); all.append(ul);
  d.append(all);
}
const es = new EventSource("/events");
es.addEventListener("hello", () => { $("conn").textContent = "live"; $("conn").className = "on"; load(); });
es.addEventListener("index", () => load());
es.addEventListener("lanes", (ev) => {
  if (!idx) return;
  for (const l of JSON.parse(ev.data).lanes) { const i = idx.nodes.findIndex((n) => n.type === "lane" && n.id === l.id); if (i === -1) idx.nodes.push(l); else idx.nodes[i] = l; }
  renderLanes(); if (picked) renderDetail();
});
es.onerror = () => { $("conn").textContent = "offline"; $("conn").className = ""; };
setInterval(renderLanes, 30000);
</script>
</body>
</html>
`;

// ── CLI ──────────────────────────────────────────────────────────────────────

function portInUse(port: number): boolean {
    const lsof = ['/usr/sbin/lsof', '/usr/bin/lsof'].find((p) => existsSync(p)) ?? 'lsof';
    const r = spawnSync(lsof, ['-nP', '-iTCP:' + port, '-sTCP:LISTEN'], { encoding: 'utf8' });
    return r.status === 0 && r.stdout.trim() !== '';
}

async function main(argv: string[]): Promise<number> {
    const opt = (name: string): string | null => {
        const at = argv.indexOf(name);
        return at === -1 ? null : argv[at + 1] ?? '';
    };
    const usage = 'usage: trace-monitor.ts [--port <n>] [--repo <tree>] [--lanes <dir>] [--trunk <branch>]';
    for (const a of argv) {
        if (a.startsWith('--') && !['--port', '--repo', '--lanes', '--trunk'].includes(a)) {
            console.error(usage);
            return 1;
        }
    }
    const portArg = opt('--port');
    const port = portArg === null ? DEFAULT_PORT : Number(portArg);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        console.error(usage);
        return 1;
    }
    if (port === 3001) {
        console.error('trace-monitor: port 3001 is the trunk\'s dev server: pick another');
        return 2;
    }
    if (portInUse(port)) {
        console.error(`trace-monitor: port ${port} is in use: a monitor may already run, open http://127.0.0.1:${port}/`);
        return 2;
    }
    const repo = resolve(opt('--repo') || HOME_REPO);
    const lanes = resolve(opt('--lanes') || join(homedir(), '.jjodel-lanes'));
    let m: Monitor;
    try {
        m = await startMonitor({ repo, lanes, port, trunk: opt('--trunk') || DEFAULT_TRUNK });
    } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        console.error(`trace-monitor: ${code === 'EADDRINUSE' ? `port ${port} is in use` : String(err)}`);
        return 2;
    }
    console.log(`monitor: http://127.0.0.1:${m.port}/`);
    for (const l of counts(m.index())) console.log(l);
    const stop = () => {
        m.close().then(() => process.exit(0));
    };
    process.on('SIGTERM', stop);
    process.on('SIGINT', stop);
    return -1;
}

// Run only as a script: the tests import startMonitor.
const invoked = process.argv[1] !== undefined && existsSync(process.argv[1]);
if (invoked && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
    main(process.argv.slice(2)).then((code) => {
        if (code >= 0) process.exit(code);
    });
}
