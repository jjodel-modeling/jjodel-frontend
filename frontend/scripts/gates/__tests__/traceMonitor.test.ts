import { describe, test, expect, afterAll } from 'vitest';
import { appendFileSync, closeSync, mkdtempSync, mkdirSync, openSync, writeFileSync, writeSync, realpathSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { request, type IncomingMessage } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startMonitor } from '../trace-monitor.ts';

// The trace monitor (P-2026-09-27-1030, stage 1): the live slice of the trace
// graph, over HTTP on 127.0.0.1 with Server-Sent Events. Run against a throwaway
// repo and lanes folder, the notifier recorded instead of osascript. A test name
// states the mutation that turns it red (CLAUDE.md 5).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(HERE, '..', 'trace-monitor.ts');
// The flags of the other TS gates: node before 23.6 strips no types without them.
const NODE_TS = ['--disable-warning=ExperimentalWarning', '--experimental-strip-types'];
const ID = 'P-2026-09-28-1200';

const dirs: string[] = [];
const closers: Array<() => Promise<void>> = [];
afterAll(async () => {
    for (const c of closers) await c();
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

const ev = (o: object) => JSON.stringify(o) + '\n';
const tool = (name: string, at: string) => ev({ type: 'assistant', timestamp: at, message: { content: [{ type: 'tool_use', name, input: { description: name + ' call' } }] } });

function git(cwd: string, args: string[]) {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid', GIT_AUTHOR_DATE: '2026-09-28T10:00:00+02:00', GIT_COMMITTER_DATE: '2026-09-28T10:00:00+02:00' } });
    if (r.status !== 0) throw new Error(r.stderr);
}

/** A repo with one prompt, and a lanes folder with one running lane (its pid is this process). */
function tree() {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'trace-monitor-')));
    dirs.push(root);
    const repo = join(root, 'repo');
    const lanes = join(root, 'lanes');
    mkdirSync(join(repo, 'docs', 'prompts'), { recursive: true });
    writeFileSync(join(repo, 'docs', 'prompts', 'claude_2026-09-28_1200_prompt_a.md'), `# A lane\n\nPrompt-ID: ${ID}\nChat: C-2026-09-28-1100\nLane: fast\nStatus: da eseguire\n\n## COSA\n`);
    git(repo, ['init', '-q', '-b', 'alfonso-frontend-jjtl']);
    git(repo, ['add', 'docs']);
    git(repo, ['commit', '-q', '-m', `docs: add prompt ${ID}`]);
    const dir = join(lanes, ID);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'log.jsonl'), ev({ type: 'system', subtype: 'init', model: 'claude-opus-5-5' }) + tool('Read', '2026-09-28T10:00:00.000Z'));
    writeFileSync(join(dir, 'worktree.txt'), repo + '\n');
    writeFileSync(join(dir, 'session.txt'), 's\n');
    writeFileSync(join(dir, 'pid.txt'), process.pid + '\n');
    writeFileSync(join(dir, 'started.txt'), Date.now() + '\n');
    return { root, repo, lanes, dir };
}

async function monitor(t: ReturnType<typeof tree>) {
    const notes: string[] = [];
    const m = await startMonitor({ repo: t.repo, lanes: t.lanes, port: 0, pollMs: 100, repoPollMs: 300, notify: (title, text) => notes.push(title + ' | ' + text) });
    closers.push(() => m.close());
    return { m, notes };
}

function get(port: number, path: string, host = `127.0.0.1:${port}`): Promise<{ status: number; type: string; body: string }> {
    return new Promise((res, rej) => {
        const req = request({ host: '127.0.0.1', port, path, headers: { host } }, (r) => {
            let body = '';
            r.setEncoding('utf8');
            r.on('data', (c) => (body += c));
            r.on('end', () => res({ status: r.statusCode ?? 0, type: String(r.headers['content-type'] ?? ''), body }));
        });
        req.on('error', rej);
        req.end();
    });
}

/** An SSE client: every `event:`/`data:` pair received, the stream closed by close(). */
function sse(port: number) {
    const got: Array<{ event: string; data: any }> = [];
    let res: IncomingMessage | null = null;
    let buf = '';
    const req = request({ host: '127.0.0.1', port, path: '/events', headers: { host: `127.0.0.1:${port}` } }, (r) => {
        res = r;
        r.setEncoding('utf8');
        r.on('data', (c: string) => {
            buf += c;
            let at;
            while ((at = buf.indexOf('\n\n')) !== -1) {
                const block = buf.slice(0, at);
                buf = buf.slice(at + 2);
                const event = (/^event: (.*)$/m.exec(block) || [])[1] ?? 'message';
                const data = (/^data: (.*)$/m.exec(block) || [])[1];
                if (data !== undefined) got.push({ event, data: JSON.parse(data) });
            }
        });
    });
    req.on('error', () => {});
    req.end();
    return { got, close: () => { req.destroy(); res?.destroy(); } };
}

async function until(cond: () => boolean, ms = 4000): Promise<boolean> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        if (cond()) return true;
        await new Promise((r) => setTimeout(r, 25));
    }
    return cond();
}

const laneOf = (idx: any, id = ID) => idx.nodes.find((n: any) => n.type === 'lane' && n.id === id);

describe('trace-monitor', { timeout: 30000 }, () => {
    test('kills "no page", "no health", "the index not served": /, /health and /index.json answer on 127.0.0.1', async () => {
        const t = tree();
        const { m } = await monitor(t);
        const page = await get(m.port, '/');
        expect(page.status).toBe(200);
        expect(page.type).toContain('text/html');
        expect(page.body).toContain('<title>Jjodel lanes</title>');
        expect((await get(m.port, '/health')).status).toBe(200);
        const idx = JSON.parse((await get(m.port, '/index.json')).body);
        expect(laneOf(idx).state).toBe('running');
        expect(idx.edges.some((e: any) => e.type === 'runs' && e.from === 'lane:' + ID)).toBe(true);
    });

    test('kills "no Host check": a request whose Host is not 127.0.0.1 or localhost on the port is refused', async () => {
        const t = tree();
        const { m } = await monitor(t);
        expect((await get(m.port, '/index.json', `evil.example:${m.port}`)).status).toBe(403);
        expect((await get(m.port, '/index.json', `localhost:${m.port}`)).status).toBe(200);
        expect((await get(m.port, '/', `127.0.0.1:${m.port + 1}`)).status).toBe(403);
    });

    test('kills "the log reread from zero", "a cut line counted twice", "appends not pushed": a line appended in two halves is one tool call, pushed as a lanes event', async () => {
        const t = tree();
        const { m } = await monitor(t);
        const s = sse(m.port);
        expect(await until(() => s.got.some((g) => g.event === 'hello'))).toBe(true);
        const line = tool('Edit', '2026-09-28T10:05:00.000Z');
        appendFileSync(join(t.dir, 'log.jsonl'), line.slice(0, 20));
        await new Promise((r) => setTimeout(r, 300));
        appendFileSync(join(t.dir, 'log.jsonl'), line.slice(20));
        const seen = () => s.got.filter((g) => g.event === 'lanes').flatMap((g) => g.data.lanes).find((l: any) => l.id === ID && l.lastTool?.name === 'Edit');
        expect(await until(() => Boolean(seen()))).toBe(true);
        expect(seen().toolCalls).toBe(2);
        await new Promise((r) => setTimeout(r, 400));
        expect(laneOf(JSON.parse((await get(m.port, '/index.json')).body)).toolCalls).toBe(2);
        s.close();
    });

    test('kills "appends read on fs.watch only": lines written through one long-lived fd, as lane-run\'s wrapper writes, all reach the index', async () => {
        const t = tree();
        const { m } = await monitor(t);
        await new Promise((r) => setTimeout(r, 300));
        const fd = openSync(join(t.dir, 'log.jsonl'), 'a');
        try {
            for (let k = 0; k < 4; k++) {
                writeSync(fd, tool('Grep', `2026-09-28T10:1${k}:00.000Z`));
                await new Promise((r) => setTimeout(r, 250));
            }
            const count = async () => laneOf(JSON.parse((await get(m.port, '/index.json')).body)).toolCalls;
            let n = 0;
            const end = Date.now() + 3000;
            while (Date.now() < end && (n = await count()) < 5) await new Promise((r) => setTimeout(r, 100));
            expect(n).toBe(5);
        } finally {
            closeSync(fd);
        }
    });

    test('kills "no notification", "a notification per poll", "notified at start": an Outcome at exit notifies once; the lanes present at start do not', async () => {
        const t = tree();
        const done = join(t.lanes, 'P-2026-09-28-0900');
        mkdirSync(done, { recursive: true });
        writeFileSync(join(done, 'log.jsonl'), ev({ type: 'assistant', timestamp: 't', message: { content: [{ type: 'text', text: 'Outcome: done' }] } }));
        writeFileSync(join(done, 'exit.txt'), '0\n');
        const { notes } = await monitor(t);
        await new Promise((r) => setTimeout(r, 300));
        expect(notes).toEqual([]);
        appendFileSync(join(t.dir, 'log.jsonl'), ev({ type: 'assistant', timestamp: 't2', message: { content: [{ type: 'text', text: 'Report.\nOutcome: hard-stop' }] } }));
        writeFileSync(join(t.dir, 'exit.txt'), '0\n');
        expect(await until(() => notes.length > 0)).toBe(true);
        await new Promise((r) => setTimeout(r, 500));
        expect(notes).toEqual([`Jjodel lanes | ${ID}: hard-stop`]);
    });

    test('kills "a new lane folder unseen": a lane started after the monitor appears in a lanes event and in the index', async () => {
        const t = tree();
        const { m } = await monitor(t);
        const s = sse(m.port);
        expect(await until(() => s.got.some((g) => g.event === 'hello'))).toBe(true);
        const nd = join(t.lanes, 'P-2026-09-28-1300');
        mkdirSync(nd, { recursive: true });
        writeFileSync(join(nd, 'log.jsonl'), tool('Bash', '2026-09-28T11:00:00.000Z'));
        writeFileSync(join(nd, 'exit.txt'), '0\n');
        expect(await until(() => s.got.some((g) => g.event === 'lanes' && g.data.lanes.some((l: any) => l.id === 'P-2026-09-28-1300')))).toBe(true);
        expect(laneOf(JSON.parse((await get(m.port, '/index.json')).body), 'P-2026-09-28-1300').lastTool.name).toBe('Bash');
        s.close();
    });

    test('kills "a new prompt unseen until restart": a prompt committed after the start is in the index, announced by an index event', async () => {
        const t = tree();
        const { m } = await monitor(t);
        const s = sse(m.port);
        expect(await until(() => s.got.some((g) => g.event === 'hello'))).toBe(true);
        writeFileSync(join(t.repo, 'docs', 'prompts', 'claude_2026-09-28_1330_prompt_b.md'), '# B\n\nPrompt-ID: P-2026-09-28-1330\nChat: C-2026-09-28-1100\nLane: fast\nStatus: da eseguire\n\n## COSA\n');
        expect(await until(() => s.got.some((g) => g.event === 'index'), 5000)).toBe(true);
        const idx = JSON.parse((await get(m.port, '/index.json')).body);
        expect(idx.nodes.some((n: any) => n.type === 'prompt' && n.id === 'P-2026-09-28-1330')).toBe(true);
        s.close();
    });
});

describe('trace-monitor.ts CLI', () => {
    const cli = (args: string[]) => spawnSync(process.execPath, [...NODE_TS, SCRIPT, ...args], { encoding: 'utf8', timeout: 10000 });

    test('kills "3001 accepted": the trunk\'s dev server port is refused before anything listens', () => {
        const r = cli(['--port', '3001']);
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('3001');
    });

    test('kills "a port in use taken": a port with a listener is refused', async () => {
        const srv = createServer();
        await new Promise<void>((r) => srv.listen(0, '127.0.0.1', () => r()));
        const port = (srv.address() as { port: number }).port;
        const r = cli(['--port', String(port)]);
        await new Promise<void>((r2) => srv.close(() => r2()));
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('in use');
    });
});
