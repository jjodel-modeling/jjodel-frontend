import { describe, test, expect, afterAll } from 'vitest';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// lane-board.mjs, the parts P-2026-10-05-1720 adds to the board of P-2026-10-05-1705:
// the status strip of the tab bar (its counting, from the rows /api serves), the
// `resolved` outcome read from resolved.txt, and the routes of the board/ assets and
// of the Requirements tab. The counting is imported; the board runs as a child
// process against a fake lanes folder and a fake lane-run, the way launchd runs it.
// A test name states the mutation that turns it red (CLAUDE.md 5).
//
// LANE_BOARD points the suite at another copy of the script (the mutation bench).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.LANE_BOARD ? resolve(process.env.LANE_BOARD) : resolve(HERE, '..', '..', 'lane-board.mjs');
process.env.LANE_BOARD_PORT = '0';
const lb = await import(pathToFileURL(SCRIPT).href);

const dirs: string[] = [];
const children: ChildProcess[] = [];
afterAll(() => {
    for (const c of children) c.kill('SIGKILL');
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});
const tmp = () => { const d = realpathSync(mkdtempSync(join(tmpdir(), 'lane-board-strip-'))); dirs.push(d); return d; };

type Row = Record<string, any>;
const row = (o: Partial<Row>): Row => ({ id: 'P-2026-10-05-0900', state: 'exited', outcome: 'done', chain: false, live: false, recent: true, ...o });
const ZERO = { running: 0, question: 0, 'hard-stop': 0, blocked: 0, resolved: 0, done: 0 };

describe('the status strip: counting', () => {
    test('kills "a key missing", "the order changed": six keys, in the order of the strip', () => {
        expect(lb.STRIP.map((s: string[]) => s[0])).toEqual(['running', 'question', 'hard-stop', 'blocked', 'resolved', 'done']);
        expect(lb.stripCounts([])).toEqual(ZERO);
    });

    test('kills "outcomes misread": running by state, the four outcomes by their word, a suffix tolerated, no outcome uncounted', () => {
        const rows = [
            row({ state: 'running', outcome: 'none', live: true }),
            row({ state: 'blocked', outcome: 'none', live: true }),
            row({ outcome: 'question' }),
            row({ outcome: 'hard-stop' }),
            row({ outcome: 'hard-stop' }),
            row({ outcome: 'blocked' }),
            row({ outcome: 'resolved' }),
            row({ outcome: 'none' }),
            row({ outcome: 'unparsed' }),
        ];
        expect(lb.stripCounts(rows)).toEqual({ running: 1, question: 1, 'hard-stop': 2, blocked: 2, resolved: 1, done: 0 });
    });

    test('kills "done counted without the 24 h window": done counts only the lanes of the last 24 hours, the other outcomes count all', () => {
        const rows = [row({ outcome: 'done', recent: true }), row({ outcome: 'done', recent: false }), row({ outcome: 'question', recent: false })];
        expect(lb.stripCounts(rows)).toMatchObject({ done: 1, question: 1 });
        expect(lb.stripKey(row({ outcome: 'done', recent: false }))).toBe(null);
    });

    test('kills "a chain read by its outcome column": a chain row counts by its state', () => {
        const chain = (state: string, recent = true) => row({ id: 'chain-P-2026-10-05-0800', chain: true, state, outcome: '2/3 P-2026-10-05-0801', recent });
        expect(lb.stripCounts([chain('running'), chain('done'), chain('done', false), chain('stopped'), chain('lost')])).toEqual({ ...ZERO, running: 1, done: 1 });
        expect(lb.stripKey(row({ id: 'chain-P-2026-10-05-0800', chain: true, state: 'running', outcome: 'blocked' }))).toBe('running');
    });
});

// ── the board as a process ───────────────────────────────────────────────────

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

function git(cwd: string, args: string[]) {
    const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', GIT_AUTHOR_DATE: '2026-10-01T10:00:00', GIT_COMMITTER_DATE: '2026-10-01T10:00:00' };
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', env });
    if (r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + r.stderr);
}

/** A board on a free port: a lanes folder with a blocked lane that holds resolved.txt and one that does not, a fake lane-run, a fixture repo for req-trace. */
async function board(): Promise<{ port: number }> {
    const root = tmp();
    for (const id of ['P-2026-10-05-0900', 'P-2026-10-05-0910', 'P-2026-10-05-0920']) {
        mkdirSync(join(root, id));
        writeFileSync(join(root, id, 'input-1.md'), '# Prompt: ' + id + '\n\nPrompt-ID: ' + id + '\nLane: fast\n');
    }
    writeFileSync(join(root, 'P-2026-10-05-0900', 'resolved.txt'), '2026-10-05 09:30 · alfonso · fixed by hand\n');
    writeFileSync(join(root, 'P-2026-10-05-0920', 'resolved.txt'), '2026-10-05 09:30 · alfonso · ignored: the lane is done\n');
    const fake = join(root, 'fake-lane-run.mjs');
    writeFileSync(fake, [
        "console.log('id                 state   outcome  elapsed');",
        "console.log('P-2026-10-05-0920  exited  done     3 min');",
        "console.log('P-2026-10-05-0910  exited  blocked  4 min');",
        "console.log('P-2026-10-05-0900  exited  blocked  5 min');",
    ].join('\n') + '\n');
    const repo = join(root, 'repo');
    mkdirSync(join(repo, 'docs'), { recursive: true });
    git(repo, ['init', '-q', '-b', 'trunk']);
    writeFileSync(join(repo, 'docs', 'decisions.md'), '# D\n\n- **R-A-1** (2026-09-01) — **First.**\n- **R-A-2** (2026-09-02) — **Second.**\n');
    writeFileSync(join(repo, 'a.txt'), 'a\n');
    git(repo, ['add', '.']);
    git(repo, ['commit', '-q', '-m', 'feat: the first one, R-A-1']);
    const port = await freePort();
    const child = spawn(process.execPath, [SCRIPT, '--port', String(port), '--refresh', '30'], {
        env: { ...process.env, JJODEL_LANES: root, LANE_RUN: fake, LANE_BOARD_PORT: '', REQ_TRACE_REPO: repo, REQ_TRACE_TRUNK: 'trunk' },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(child);
    await new Promise<void>((res, rej) => {
        const t = setTimeout(() => rej(new Error('board did not start')), 10000);
        child.stdout!.on('data', (b) => { if (String(b).includes('lane-board on')) { clearTimeout(t); res(); } });
        child.on('exit', (code) => { clearTimeout(t); rej(new Error('board exited ' + code)); });
    });
    return { port };
}

describe('the board: resolved, the strip, the board/ assets and the Requirements route', () => {
    test('kills "resolved.txt ignored by the board", "resolved.txt read on any outcome": blocked plus resolved.txt counts as resolved, not blocked', async () => {
        const { port } = await board();
        const d = await (await fetch('http://127.0.0.1:' + port + '/api')).json();
        const by = (id: string) => d.rows.find((r: Row) => r.id === id);
        expect(by('P-2026-10-05-0900').outcome).toBe('resolved');
        expect(by('P-2026-10-05-0910').outcome).toBe('blocked');
        expect(by('P-2026-10-05-0920').outcome).toBe('done');
        expect(lb.stripCounts(d.rows)).toMatchObject({ blocked: 1, resolved: 1 });
    });

    test('kills "the strip outside the tab bar", "the page counting with other code": the strip ends the tab bar, six pills, the counting the tests import', async () => {
        const { port } = await board();
        const page = await (await fetch('http://127.0.0.1:' + port + '/')).text();
        const nav = /<nav class="tabs">([\s\S]*?)<\/nav>/.exec(page)![1];
        expect(nav).toMatch(/<button data-tab="requirements">Requirements<\/button><div class="strip" id="strip"/);
        expect((nav.match(/data-k="/g) || []).length).toBe(6);
        expect(page).toContain('const stripKey=' + lb.stripKey.toString() + ';');
    });

    test('kills "board/ assets not found": timeline.js, insights.js and requirements.js are served from board/', async () => {
        const { port } = await board();
        for (const [path, mark] of [['/timeline.js', 'window.TL'], ['/insights.js', 'window.INS'], ['/requirements.js', 'window.REQ']]) {
            const body = await (await fetch('http://127.0.0.1:' + port + path)).text();
            expect(body, path).toContain(mark);
        }
    });

    test('kills "the Requirements route not wired": /api/requirements runs req-trace on the checkout and its trunk', async () => {
        const { port } = await board();
        const d = await (await fetch('http://127.0.0.1:' + port + '/api/requirements')).json();
        expect(d.error).toBeUndefined();
        expect(d.counts).toMatchObject({ rows: 2, realized: 1 });
        expect(d.trunk.ref).toBe('trunk');
    });
});
