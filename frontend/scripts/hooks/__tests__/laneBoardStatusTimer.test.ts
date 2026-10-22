import { describe, test, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// lane-board.mjs: the /api status timer (P-2026-10-22-1210). The board's own synchronous git reads blocked its
// event loop past STATUS_KILL_MS; when the loop freed, the timers phase ran before the I/O that reports the child's
// exit, so a `lane-run status --all` that finished in 0.4 s was killed and reported as timed out. runStatus now
// decides the kill on the child's own runtime, and the git reads run as child processes off the loop; the parse of
// the prompt commits moved into promptCommitMap, unchanged. A test name states the mutation of the script that
// turns it red (CLAUDE.md 5); the bench that established it is in the commit message.
//
// LANE_BOARD points the suite at another copy of the script (the mutation bench).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.LANE_BOARD ? resolve(process.env.LANE_BOARD) : resolve(HERE, '..', '..', 'lane-board', 'lane-board.mjs');

const ROOT = mkdtempSync(join(tmpdir(), 'lane-board-timer-'));
process.env.LANE_BOARD_PORT = '0';
process.env.JJODEL_LANES = ROOT;
process.env.LANE_BOARD_CACHE = join(ROOT, 'board', 'timeline-cache.json');
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

const load = () => import(pathToFileURL(SCRIPT).href);
const block = (ms: number) => { const end = Date.now() + ms; while (Date.now() < end) { /* the event loop is held */ } };

/** A child that writes `out` and exits 0 at `exitAt` ms (never, when null); kill() is recorded and, on a live child, closes it. */
function fakeChild(out: string, exitAt: number | null) {
    const c: any = new EventEmitter();
    c.stdout = new EventEmitter();
    c.stderr = new EventEmitter();
    c.exitCode = null;
    c.signalCode = null;
    c.kills = [] as string[];
    c.kill = (sig: string) => {
        c.kills.push(sig);
        if (c.exitCode === null && c.signalCode === null) { c.signalCode = sig; setImmediate(() => c.emit('close', null, sig)); }
        return true;
    };
    if (exitAt !== null) setTimeout(() => { c.stdout.emit('data', Buffer.from(out)); c.exitCode = 0; c.emit('exit', 0, null); c.emit('close', 0, null); }, exitAt);
    return c;
}

describe('runStatus: the kill is decided on the child\'s own runtime', () => {
    test('a child that exits at 100 ms while the loop is held 200 ms past the kill time is ok, never killed (red: kill as the timer fires)', async () => {
        const { runStatus } = await load();
        let child: any;
        const p = runStatus(() => (child = fakeChild('ID  STATE\n', 100)), 50);
        block(250);
        const r = await p;
        expect(r).toEqual({ ok: true, stdout: 'ID  STATE\n', error: '' });
        expect(child.kills).toEqual([]);
    });

    test('a real child that exits while the loop is held past the kill time is ok (red: exitCode checked in the timer only, no turn of the loop)', async () => {
        const { runStatus } = await load();
        const p = runStatus(() => spawn(process.execPath, ['-e', 'process.stdout.write("ID  STATE\\n")'], { stdio: ['ignore', 'pipe', 'pipe'] }), 1000);
        block(3000);
        const r = await p;
        expect(r).toEqual({ ok: true, stdout: 'ID  STATE\n', error: '' });
    });

    test('a child that hangs is still killed at killMs and reported as timed out (red: the kill dropped)', async () => {
        const { runStatus } = await load();
        let child: any;
        const r = await runStatus(() => (child = fakeChild('', null)), 50);
        expect(r).toEqual({ ok: false, stdout: '', error: 'lane-run status timed out after 0.05 s' });
        expect(child.kills).toEqual(['SIGKILL']);
    });

    test('a real child that hangs is killed (red: the kill dropped)', async () => {
        const { runStatus } = await load();
        let child: any;
        const r = await runStatus(() => (child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: ['ignore', 'pipe', 'pipe'] })), 300);
        expect(r.ok).toBe(false);
        expect(r.error).toBe('lane-run status timed out after 0.3 s');
        expect(child.signalCode).toBe('SIGKILL');
    });
});

// The stdout of `git log --all --diff-filter=A --name-only --format=%x1e%h%x1f%an%x1f%aI%x1f%B%x1f -- docs/prompts/`,
// newest first: a chat commit with its session trailer, a Claude Code commit adding two prompts and a file that is not
// a prompt, a hand commit, and the oldest commit adding a prompt that a newer one re-adds.
const R = '\x1e', U = '\x1f';
const LOG = [
    '',
    ['aaa1111', 'Alfonso', '2026-10-22T12:10:00+02:00', 'docs: add prompt P-2026-10-22-1210\n\nClaude-Session: https://claude.ai/code/session_01X\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n', '\n\ndocs/prompts/claude_2026-10-22_1210_prompt_board_status_timer.md\n'].join(U),
    ['bbb2222', 'Alfonso', '2026-10-21T10:00:00+02:00', 'docs: add prompts\n\nModel: Opus 5.5 (chat C-2026-10-21-0900)\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n', '\n\ndocs/prompts/claude_2026-10-21_1000_prompt_a.md\ndocs/prompts/claude_2026-10-21_1008_prompt_merge_x.md\ndocs/prompts/README.md\n'].join(U),
    ['ccc3333', 'Hand Author', '2026-10-20T09:00:00+02:00', 'add prompt by hand\n', '\n\ndocs/prompts/claude_2026-10-20_0900_prompt_hand.md\n'].join(U),
    ['ddd4444', 'Alfonso', '2026-10-19T09:00:00+02:00', 'first add\n', '\n\ndocs/prompts/old/claude_2026-10-21_1000_prompt_a.md\n'].join(U),
].join(R);

describe('promptCommitMap: the parse of loadPromptCommits, unchanged', () => {
    test('maps every prompt file to the commit that added it, the oldest per Prompt-ID', async () => {
        const { promptCommitMap } = await load();
        const m = promptCommitMap({ status: 0, stdout: LOG });
        expect([...m.keys()].sort()).toEqual(['P-2026-10-20-0900', 'P-2026-10-21-1000', 'P-2026-10-21-1008', 'P-2026-10-22-1210']);
        expect(m.get('P-2026-10-22-1210')).toEqual({
            sha: 'aaa1111', author: 'Alfonso', date: '2026-10-22T12:10:00+02:00', session: 'https://claude.ai/code/session_01X',
            models: ['Claude Opus 5.5'], model: '', file: 'claude_2026-10-22_1210_prompt_board_status_timer.md',
        });
        expect(m.get('P-2026-10-21-1000')).toEqual({ sha: 'ddd4444', author: 'Alfonso', date: '2026-10-19T09:00:00+02:00', session: '', models: [], model: '', file: 'claude_2026-10-21_1000_prompt_a.md' });
        expect(m.get('P-2026-10-21-1008')).toEqual({
            sha: 'bbb2222', author: 'Alfonso', date: '2026-10-21T10:00:00+02:00', session: '',
            models: ['Claude Sonnet 5.5', 'Claude Opus 5.5'], model: 'Opus 5.5 (chat C-2026-10-21-0900)', file: 'claude_2026-10-21_1008_prompt_merge_x.md',
        });
        expect(m.get('P-2026-10-20-0900')).toEqual({ sha: 'ccc3333', author: 'Hand Author', date: '2026-10-20T09:00:00+02:00', session: '', models: [], model: '', file: 'claude_2026-10-20_0900_prompt_hand.md' });
    });

    test('a failed git log is an empty map', async () => {
        const { promptCommitMap } = await load();
        expect(promptCommitMap({ status: null, stdout: LOG }).size).toBe(0);
        expect(promptCommitMap({ status: 128, stdout: '' }).size).toBe(0);
    });
});
