import { describe, test, expect, afterAll, vi } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

// lane-board.mjs and requirements.js: the Requirements tab (P-2026-10-11-0008, slice S5 of discovery
// P-2026-10-10-1806, ported from branch harness-req-tab 35240a582). The run of req-trace.mjs and its cache are
// imported and driven with a fake spawn, fake timers and a moved clock. The board runs as a child process against
// a fixture repo (REQ_TRACE_REPO) as in laneBoardStrip.test.ts, a preload counting the req-trace processes it
// starts; the page's own script and requirements.js, fetched from the board, run in node:vm on a stub DOM whose
// fetch reaches the same board.
// A test name states the mutation that turns it red (CLAUDE.md 5); the bench that established it is in the
// commit message.
//
// LANE_BOARD points the suite at another copy of the script (the mutation bench).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.LANE_BOARD ? resolve(process.env.LANE_BOARD) : resolve(HERE, '..', '..', 'lane-board', 'lane-board.mjs');
const BOARD_DIR = dirname(SCRIPT);
process.env.LANE_BOARD_PORT = '0';
const lb = await import(pathToFileURL(SCRIPT).href);

const dirs: string[] = [];
const children: ChildProcess[] = [];
afterAll(() => {
    for (const c of children) c.kill('SIGKILL');
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});
const tmp = () => { const d = realpathSync(mkdtempSync(join(tmpdir(), 'lane-board-req-'))); dirs.push(d); return d; };

// ── the run and its cache, in process ────────────────────────────────────────

type Run = { ok: boolean; body: string };
type FakeChild = EventEmitter & { stdout: EventEmitter; stderr: EventEmitter; kill: (s: string) => void; killed: string[] };

function fakeSpawn() {
    const calls: { cmd: string; args: string[]; child: FakeChild }[] = [];
    const fn = (cmd: string, args: string[]) => {
        const child = Object.assign(new EventEmitter(), { stdout: new EventEmitter(), stderr: new EventEmitter(), killed: [] as string[] }) as FakeChild;
        child.kill = (s: string) => { child.killed.push(s); };
        calls.push({ cmd, args, child });
        return child;
    };
    return { fn, calls };
}

describe('the run of req-trace', () => {
    test('kills "another script", "another checkout", "the trunk not passed": node runs ../req-trace.mjs on the board\'s own checkout and alfonso-frontend-jjtl', async () => {
        const s = fakeSpawn();
        const p = lb.runReqTrace(s.fn);
        expect(s.calls).toHaveLength(1);
        const { cmd, args, child } = s.calls[0];
        expect(cmd).toBe(process.execPath);
        expect(args).toHaveLength(5);
        expect(realpathSync(args[0])).toBe(realpathSync(join(BOARD_DIR, '..', 'req-trace.mjs')));
        expect([args[1], realpathSync(args[2]), args[3], args[4]]).toEqual(['--repo', realpathSync(join(BOARD_DIR, '..', '..', '..')), '--trunk', 'alfonso-frontend-jjtl']);
        child.stdout.emit('data', Buffer.from('{"rows":'));
        child.stdout.emit('data', Buffer.from('[]}'));
        child.emit('close', 0, null);
        expect(await p).toEqual({ ok: true, body: '{"rows":[]}' });
    });

    test('kills "a failed run read as data": a non-zero exit gives an error document carrying its stderr', async () => {
        const s = fakeSpawn();
        const p = lb.runReqTrace(s.fn);
        const { child } = s.calls[0];
        child.stdout.emit('data', Buffer.from('{"partial'));
        child.stderr.emit('data', Buffer.from('req-trace: no register: /x/docs/decisions.md\n'));
        child.emit('close', 2, null);
        const r: Run = await p;
        expect(r.ok).toBe(false);
        expect(JSON.parse(r.body)).toEqual({ error: 'req-trace exit 2: req-trace: no register: /x/docs/decisions.md', rows: [] });
    });

    test('kills "the run never killed", "killed before 120 s", "the timer left armed": SIGKILL at 120 s with an error document; a run that ends first is never killed', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        try {
            const s = fakeSpawn();
            const p = lb.runReqTrace(s.fn);
            const { child } = s.calls[0];
            vi.advanceTimersByTime(119_999);
            expect(child.killed).toEqual([]);
            vi.advanceTimersByTime(1);
            expect(child.killed).toEqual(['SIGKILL']);
            child.emit('close', null, 'SIGKILL');
            const r: Run = await p;
            expect(r.ok).toBe(false);
            expect(JSON.parse(r.body)).toEqual({ error: 'req-trace killed after 120 s', rows: [] });

            const s2 = fakeSpawn();
            const p2 = lb.runReqTrace(s2.fn);
            s2.calls[0].child.emit('close', 0, null);
            expect((await p2).ok).toBe(true);
            vi.advanceTimersByTime(300_000);
            expect(s2.calls[0].child.killed).toEqual([]);
        } finally {
            vi.useRealTimers();
        }
    });
});

/** A run that ends when the test says so, counting how often it started. */
function heldRun() {
    const held: ((r: Run) => void)[] = [];
    const run = () => new Promise<Run>((r) => { held.push(r); });
    return { run, held };
}

describe('the cache of req-trace: one run at a time, kept 60 s', () => {
    test('kills "no single flight": calls made while a run is pending share it', async () => {
        const h = heldRun();
        const get = lb.reqTraceCache(h.run, () => 0);
        const a = get(), b = get();
        expect(h.held).toHaveLength(1);
        h.held[0]({ ok: true, body: 'one' });
        expect(await Promise.all([a, b])).toEqual(['one', 'one']);
    });

    test('kills "no cache", "kept other than 60 s", "kept from the start of the run": a body is kept 60 s from the end of its run, then run again', async () => {
        let t = 1_000_000;
        const h = heldRun();
        const get = lb.reqTraceCache(h.run, () => t);
        const first = get();
        t += 5_000;
        h.held[0]({ ok: true, body: 'run 1' });
        expect(await first).toBe('run 1');
        t += 59_999;
        expect(await get()).toBe('run 1');
        expect(h.held).toHaveLength(1);
        t += 1;
        const second = get();
        expect(h.held).toHaveLength(2);
        h.held[1]({ ok: true, body: 'run 2' });
        expect(await second).toBe('run 2');
    });

    test('kills "a failed run kept": an error document is served once, the next call runs again', async () => {
        const h = heldRun();
        const get = lb.reqTraceCache(h.run, () => 0);
        const a = get();
        h.held[0]({ ok: false, body: '{"error":"x","rows":[]}' });
        expect(await a).toBe('{"error":"x","rows":[]}');
        const b = get();
        expect(h.held).toHaveLength(2);
        h.held[1]({ ok: true, body: 'good' });
        expect(await b).toBe('good');
        expect(await get()).toBe('good');
        expect(h.held).toHaveLength(2);
    });
});

// ── the board as a process, on a fixture repo ────────────────────────────────

function freePort(): Promise<number> {
    return new Promise((res, rej) => {
        const s = createServer();
        s.once('error', rej);
        s.listen(0, '127.0.0.1', () => {
            const a = s.address();
            s.close(() => res(typeof a === 'object' && a ? a.port : 0));
        });
    });
}

function git(cwd: string, args: string[], date = '2026-09-30T10:00:00') {
    const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date };
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', env });
    if (r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + r.stderr);
}

const json = (o: unknown) => JSON.stringify(o, null, 2) + '\n';
const contrib = (req: string, softgoal: string, kind: string) => ({ req, softgoal, kind, evidence: 'read', verified: 'none', why: req + ' ' + kind + ' ' + softgoal });

/** Four rows, one prompt co-citing the three R-A rows, three realized: R-A-1 before the built-in milestone
 *  (2026-10-07), R-A-2 and R-B-1 after it. The goal model makes three opposing pairs: (R-A-1, R-A-2) and
 *  (R-A-1, R-B-1) on SG-1, (R-B-1, R-A-1) on SG-2. Of the three declared conflicts, the first names a pair as
 *  it is, the second names the SG-2 pair the other way round (its rows also form the SG-1 pair, which it does
 *  not name), the third names no pair (R-A-3 is not realized). So one pair is left unassigned. */
function fixtureRepo(): string {
    const repo = tmp();
    mkdirSync(join(repo, 'docs', 'prompts'), { recursive: true });
    mkdirSync(join(repo, 'docs', 'goals'));
    git(repo, ['init', '-q', '-b', 'trunk']);
    writeFileSync(join(repo, 'docs', 'decisions.md'), [
        '# Decisions', '',
        '- **R-A-1** (2026-09-01) — **First.**',
        '- **R-A-2** (2026-09-02) — **Second.**',
        '- **R-A-3** (2026-09-03, provisional) — **Third.**',
        '- **R-B-1** (2026-09-04) — **Fourth.**', '',
    ].join('\n'));
    writeFileSync(join(repo, 'docs', 'prompts', 'claude_2026-09-05_1000_prompt_a.md'), '# Prompt\n\nPrompt-ID: P-2026-09-05-1000\n\nRows R-A-1, R-A-2 and R-A-3.\n');
    writeFileSync(join(repo, 'docs', 'goals', 'softgoals.json'), json([
        { id: 'SG-1', name: 'Low cognitive load', description: '' },
        { id: 'SG-2', name: 'Reversibility', description: '' },
    ]));
    writeFileSync(join(repo, 'docs', 'goals', 'contributions.json'), json([
        contrib('R-A-1', 'SG-1', 'help'), contrib('R-A-2', 'SG-1', 'hurt'), contrib('R-B-1', 'SG-1', 'some-'),
        contrib('R-B-1', 'SG-2', 'some+'), contrib('R-A-1', 'SG-2', 'hurt'), contrib('R-A-3', 'SG-1', 'hurt'),
    ]));
    writeFileSync(join(repo, 'docs', 'goals', 'conflicts.json'), json([
        { a: 'R-A-1', b: 'R-A-2', softgoal: 'SG-1', evidence: 'read', why: 'First against second.' },
        { a: 'R-A-1', b: 'R-B-1', softgoal: 'SG-2', evidence: 'inferred', why: 'Declared the other way round.' },
        { a: 'R-A-2', b: 'R-A-3', softgoal: 'SG-1', evidence: 'read', why: 'The third is not realized.' },
    ]));
    git(repo, ['add', '.']);
    git(repo, ['commit', '-q', '-m', 'docs: the register']);
    git(repo, ['commit', '-q', '--allow-empty', '-m', 'feat: the first one, R-A-1'], '2026-10-01T10:00:00');
    git(repo, ['commit', '-q', '--allow-empty', '-m', 'feat: the second and the fourth, R-A-2 R-B-1'], '2026-10-09T10:00:00');
    return repo;
}

/** The board as launchd runs it, on a free port, with no lanes, its req-trace on `repo` and trunk `trunk`.
 *  A preload (NODE_OPTIONS) records the script of every node process the board starts. */
async function board(repo: string): Promise<{ base: string; reqRuns: () => number }> {
    const root = tmp();
    // launcherOf reads `git log --all` of JJODEL_REPO: an empty repo here, never a real checkout.
    const empty = tmp();
    spawnSync('git', ['init', '-q', empty]);
    const fake = join(root, 'fake-lane-run.mjs');
    writeFileSync(fake, "console.log('id  state  outcome  elapsed');\n");
    const started = join(root, 'started.txt');
    const preload = join(root, 'count.cjs');
    writeFileSync(preload, 'require("node:fs").appendFileSync(' + JSON.stringify(started) + ', String(process.argv[1]) + "\\n");\n');
    const port = await freePort();
    const child = spawn(process.execPath, [SCRIPT, '--port', String(port), '--refresh', '30'], {
        env: {
            ...process.env, JJODEL_LANES: root, LANE_RUN: fake, LANE_BOARD_PORT: '', JJODEL_REPO: empty, LANE_BOARD_CACHE: join(root, 'timeline-cache.json'),
            REQ_TRACE_REPO: repo, REQ_TRACE_TRUNK: 'trunk', TMPDIR: root,
            NODE_OPTIONS: [process.env.NODE_OPTIONS, '--require ' + preload].filter(Boolean).join(' '),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(child);
    await new Promise<void>((res, rej) => {
        const t = setTimeout(() => rej(new Error('board did not start')), 10000);
        child.stdout!.on('data', (b) => { if (String(b).includes('lane-board on')) { clearTimeout(t); res(); } });
        child.on('exit', (code) => { clearTimeout(t); rej(new Error('board exited ' + code)); });
    });
    const reqRuns = () => { try { return readFileSync(started, 'utf8').split('\n').filter((l) => l.endsWith('req-trace.mjs')).length; } catch { return 0; } };
    return { base: 'http://127.0.0.1:' + port, reqRuns };
}
const text = async (base: string, path: string) => (await fetch(base + path)).text();

let fixture: string | null = null;
let shared: Promise<{ base: string; reqRuns: () => number }> | null = null;
const reqBoard = () => (shared ||= board(fixture ||= fixtureRepo()));

// ── a stub DOM for the page's script and requirements.js ────────────────────

type Stub = Record<string, any>;
function stubEl(extra: Stub = {}): Stub {
    const on: Record<string, ((e: any) => void)[]> = {};
    return {
        innerHTML: '', textContent: '', hidden: false, title: '', id: '', dataset: {}, style: {}, on,
        addEventListener: (t: string, f: (e: any) => void) => { (on[t] ||= []).push(f); },
        classList: { toggle: () => false, add: () => {}, remove: () => {}, contains: () => false },
        querySelector: () => stubEl(), querySelectorAll: () => [], appendChild: () => {},
        ...extra,
    };
}

/** A browser-like context whose global is its window: elements by id are created on first use; fetch goes to the board. */
function dom(base: string) {
    const byId = new Map<string, Stub>();
    const el = (id: string) => { if (!byId.has(id)) byId.set(id, stubEl()); return byId.get(id)!; };
    const tabs = ['table', 'timeline', 'insights', 'requirements'].map((t) => stubEl({ dataset: { tab: t } }));
    const ls = new Map<string, string>();
    const intervals: (() => void)[] = [];
    const ctx: Stub = vm.createContext({
        document: {
            title: '', head: stubEl(), body: stubEl(), createElement: () => stubEl(), getElementById: el, querySelector: () => stubEl(),
            querySelectorAll: (s: string) => (s === '.tabs button' ? tabs : []),
        },
        console, setTimeout, clearTimeout, setInterval: (f: () => void) => { intervals.push(f); return 0; }, clearInterval: () => {},
        addEventListener: () => {},
        localStorage: { getItem: (k: string) => (ls.has(k) ? ls.get(k)! : null), setItem: (k: string, v: string) => { ls.set(k, String(v)); } },
        fetch: (u: string, o?: RequestInit) => fetch(base + u, o),
    });
    ctx.window = ctx;
    return { ctx, el, ls, intervals, run: (code: string) => vm.runInContext(code, ctx) };
}

/** The Requirements tab rendered by requirements.js, as served by the board, from /api/requirements. */
async function reqTab(base: string): Promise<string> {
    const d = dom(base);
    d.run(await text(base, '/requirements.js'));
    await d.ctx.REQ.refresh();
    return d.el('req').innerHTML;
}

describe('the board: the Requirements route, its asset and its tab', () => {
    test('kills "no single flight over HTTP", "no cache over HTTP": two requests at once start one req-trace, a third within 60 s starts none', async () => {
        const b = await board(fixtureRepo());
        const [x, y] = await Promise.all([text(b.base, '/api/requirements'), text(b.base, '/api/requirements')]);
        expect(JSON.parse(x).error).toBeUndefined();
        expect(b.reqRuns()).toBe(1);
        expect(y).toBe(x);
        expect(await text(b.base, '/api/requirements')).toBe(x);
        expect(b.reqRuns()).toBe(1);
    });

    test('kills "the route not wired", "REQ_TRACE_REPO ignored", "REQ_TRACE_TRUNK ignored": /api/requirements is req-trace on the fixture repo and its trunk', async () => {
        const { base } = await reqBoard();
        const d = JSON.parse(await text(base, '/api/requirements'));
        expect(d.error).toBeUndefined();
        expect(d.repo).toBe(fixture);
        expect(d.trunk.ref).toBe('trunk');
        expect(d.counts).toMatchObject({ rows: 4, realized: 3, ratified: 3, provisional: 1 });
        expect(d.clusters.list.map((c: Stub) => [c.key, c.members])).toEqual([['R-A-1', ['R-A-1', 'R-A-2', 'R-A-3']]]);
        expect(d.milestones.map((m: Stub) => [m.id, m.date, m.source])).toEqual([['MODELS', '2026-10-07', 'built-in']]);
        expect(d.goalModel.opposing).toEqual([
            { a: 'R-A-1', b: 'R-A-2', softgoal: 'SG-1' }, { a: 'R-A-1', b: 'R-B-1', softgoal: 'SG-1' }, { a: 'R-B-1', b: 'R-A-1', softgoal: 'SG-2' },
        ]);
    });

    test('kills "requirements.js not served", "served from elsewhere": /requirements.js is the file beside the board, as JavaScript', async () => {
        const { base } = await reqBoard();
        const res = await fetch(base + '/requirements.js');
        expect(res.headers.get('content-type')).toBe('text/javascript; charset=utf-8');
        const body = await res.text();
        expect(body).toBe(readFileSync(join(BOARD_DIR, 'requirements.js'), 'utf8').trim());
        expect(body).toContain('window.REQ = { refresh }');
    });

    test('kills "no Requirements tab", "the tab after the strip", "no section", "no script": a Requirements button follows Insights and ends the buttons, its section and script are on the page', async () => {
        const { base } = await reqBoard();
        const html = await text(base, '/');
        const nav = /<nav class="tabs">([\s\S]*?)<\/nav>/.exec(html)![1];
        expect(nav).toContain('<button data-tab="insights">Insights</button><button data-tab="requirements">Requirements</button><div class="strip" id="strip"');
        expect(html).toContain('<section id="tab-requirements" hidden><div id="req"></div></section>');
        expect(html).toContain('<script src="/insights.js"></script><script src="/requirements.js"></script>');
    });

    test('kills "showTab ignores the tab", "no refresh on open", "no refresh hook", "refreshed while hidden": opening the tab shows its section alone and refreshes it; the timer refreshes it only while it is open', async () => {
        const { base } = await reqBoard();
        const html = await text(base, '/');
        const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).pop()!;
        const d = dom(base);
        let n = 0;
        d.ctx.REQ = { refresh: () => { n++; } };
        d.run(script);
        expect(d.intervals).toHaveLength(1);
        d.el('tab-requirements').hidden = true;
        d.run("showTab('requirements')");
        expect(d.el('tab-requirements').hidden).toBe(false);
        for (const k of ['table', 'timeline', 'insights']) expect(d.el('tab-' + k).hidden, k).toBe(true);
        expect(n).toBe(1);
        expect(d.ls.get('laneBoardTab')).toBe('requirements');
        d.intervals[0]();
        expect(n).toBe(2);
        d.run("showTab('table')");
        expect(d.el('tab-requirements').hidden).toBe(true);
        d.intervals[0]();
        expect(n).toBe(2);
    });

    test('kills "pairs in one flat table", "a group open by default", "pairs matched without the softgoal", "a reversed declaration unmatched", "unassigned missing or not last": one closed group per declared conflict, in declared order, then unassigned', async () => {
        const { base } = await reqBoard();
        const html = await reqTab(base);
        const at = html.indexOf('<h2>Opposing contributions</h2>');
        expect(at).toBeGreaterThan(-1);
        const tail = html.slice(at);
        expect(tail.slice(0, tail.indexOf('<details'))).not.toContain('<table');
        expect(tail).toContain('3 pairs of realized rows pull a softgoal both ways: 2 match one of the 3 declared conflicts (same softgoal, same two rows, either order), 1 unassigned.');
        const groups = [...tail.matchAll(/<details data-key="([^"]+)"( open)?><summary[^>]*><b>([^<]*)<\/b><span class="meta">([^<]*)<\/span><\/summary>([\s\S]*?)<\/details>/g)];
        expect(groups.map((g) => [g[1], !!g[2], g[3], g[4]])).toEqual([
            ['cf:SG-1:R-A-1:R-A-2', false, 'R-A-1 vs R-A-2', 'SG-1 Low cognitive load · 1 pair'],
            ['cf:SG-2:R-A-1:R-B-1', false, 'R-A-1 vs R-B-1', 'SG-2 Reversibility · 1 pair'],
            ['cf:SG-1:R-A-2:R-A-3', false, 'R-A-2 vs R-A-3', 'SG-1 Low cognitive load · 0 pairs'],
            ['cf:unassigned', false, 'unassigned', '1 pair no declared conflict names'],
        ]);
        const pairs = (body: string) => [...body.matchAll(/<tr><td class="id">([^<]+)<[\s\S]*?<\/td><td class="id">([^<]+)<[\s\S]*?<\/td><td>([^<]+)<\/td><\/tr>/g)].map((m) => [m[1], m[2], m[3]]);
        expect(groups.map((g) => pairs(g[5]))).toEqual([
            [['R-A-1', 'R-A-2', 'SG-1 Low cognitive load']],
            [['R-B-1', 'R-A-1', 'SG-2 Reversibility']],
            [],
            [['R-A-1', 'R-B-1', 'SG-1 Low cognitive load']],
        ]);
        expect(groups[0][5]).toContain('First against second.');
        expect(groups[2][5]).toContain('No opposing pair');
    });

    test('kills "no group after the last milestone", "milestone groups out of order", "rows in the wrong group": a cluster lists its rows by milestone, then realized after the last one, then not realized', async () => {
        const { base } = await reqBoard();
        const html = await reqTab(base);
        const group = (key: string) => new RegExp('<details data-key="' + key.replace(/[()]/g, '\\$&') + '"( open)?>([\\s\\S]*?)</details>').exec(html)!;
        const parts = (body: string) => body.split('<div class="rq-ms">').slice(1).map((p) => [p.slice(0, p.indexOf('</div>')), [...p.matchAll(/<td class="id"[^>]*>([^<]+)</g)].map((m) => m[1])]);
        const cl = group('R-A-1');
        expect(cl[1]).toBeUndefined();
        expect(parts(cl[2])).toEqual([
            ['MODELS freeze · 2026-10-07 · 1', ['R-A-1']],
            ['Realized after the last milestone · 1', ['R-A-2']],
            ['Not realized · 1', ['R-A-3']],
        ]);
        expect(parts(group('(unclustered)')[2])).toEqual([['Realized after the last milestone · 1', ['R-B-1']]]);
    });

    test('kills "a table without fixed widths": every table of the tab has the fixed layout and a colgroup, the same one for every table of requirements', async () => {
        const { base } = await reqBoard();
        const html = await reqTab(base);
        const tables = [...html.matchAll(/<table([^>]*)>(<colgroup>[\s\S]*?<\/colgroup>)?<thead><tr><th>([^<]*)/g)];
        expect(tables.length).toBe(4 + 3);
        for (const t of tables) {
            expect(t[1]).toBe(' class="rq-t"');
            expect(t[2]).toMatch(/^<colgroup>(<col( style="width:\d+px")?>)+<\/colgroup>$/);
        }
        const req = tables.filter((t) => t[3] === 'Requirement');
        expect(req).toHaveLength(4);
        expect(new Set(req.map((t) => t[2])).size).toBe(1);
    });
});
