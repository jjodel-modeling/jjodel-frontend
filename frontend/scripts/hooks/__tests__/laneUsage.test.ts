import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// lane-usage.mjs run as a child process, the way the chat runs it (P11), against a
// copy of the fixture lanes in a temporary JJODEL_LANES. started.txt and the
// mtime of exit.txt are written here, not committed. A test name states the
// mutation of the script that turns it red (CLAUDE.md 5); the bench that
// established it is in the commit message.
//
// LANE_USAGE points the suite at another copy of the script (the mutation bench).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.LANE_USAGE ? resolve(process.env.LANE_USAGE) : resolve(HERE, '..', '..', 'lane-usage.mjs');
const FIXTURES = join(HERE, 'fixtures', 'lane-usage');

const A = 'P-2026-01-01-1000'; // a resume on two models, subagents, three readings
const B = 'P-2026-01-01-1100'; // overlaps A, one reading
const C = 'P-2026-01-02-0900'; // alone, still running, no reading, no tier
const HOUR = 3600000;

let root: string;

beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'lane-usage-'));
    cpSync(FIXTURES, root, { recursive: true });
    const day = Date.now() - 24 * HOUR;
    const lane = (id: string, start: number, end: number | null) => {
        writeFileSync(join(root, id, 'started.txt'), String(start));
        if (end === null) return;
        writeFileSync(join(root, id, 'exit.txt'), '0');
        utimesSync(join(root, id, 'exit.txt'), end / 1000, end / 1000);
    };
    lane(A, day, day + HOUR);
    lane(B, day + HOUR / 2, day + 2 * HOUR);
    lane(C, Date.now() - 60000, null);
});

afterAll(() => {
    rmSync(root, { recursive: true, force: true });
});

function run(...args: string[]) {
    const r = spawnSync(process.execPath, [SCRIPT, ...args], { env: { ...process.env, JJODEL_LANES: root }, encoding: 'utf8' });
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

const usage = (id: string) => JSON.parse(run(id, '--json').stdout);

describe('lane-usage: one lane', () => {
    test('kills "the first init only": model first and last, runs and tier', () => {
        const u = usage(A);
        expect(u.model).toEqual({ first: 'claude-opus-5-5', last: 'claude-sonnet-5-5' });
        expect(u.runs).toBe(2);
        expect(u.tier).toBe('heavy');
        expect(u.session).toBe('s-a');
        expect(usage(B).model).toEqual({ first: 'claude-sonnet-5-5', last: null });
    });

    test('kills "every assistant event is a call" and "synthetic counts": per-class sums per model of the main session', () => {
        expect(usage(A).main).toEqual({
            'claude-opus-5-5': { calls: 2, input: 2, cacheRead: 290000, cacheCreation: 15000, output: 30 },
            'claude-sonnet-5-5': { calls: 1, input: 3, cacheRead: 240000, cacheCreation: 15000, output: 30 },
        });
    });

    test('kills "parent_tool_use_id ignored": subagent calls in their own block, keyed by model', () => {
        expect(usage(A).subagents).toEqual({
            'claude-sonnet-5-5': { calls: 1, input: 5, cacheRead: 1000, cacheCreation: 500, output: 7 },
            'claude-haiku-5-5': { calls: 1, input: 1, cacheRead: 2000, cacheCreation: 0, output: 3 },
        });
        expect(usage(C).subagents).toEqual({});
    });

    test('kills "the first result wins": output totals read from the last modelUsage', () => {
        expect(usage(A).resultOutput).toEqual({ 'claude-opus-5-5': 900, 'claude-sonnet-5-5': 400, 'claude-haiku-5-5': 50 });
        expect(usage(C).resultOutput).toBeNull();
    });

    test('kills "subagents in the series" and "> instead of >=": the per-call main context and its thresholds', () => {
        expect(usage(A).context).toEqual({
            calls: 3,
            max: 255003,
            last: 255003,
            median: 200000,
            atOrAbove200k: 2,
            atOrAbove250k: 1,
            series: [105002, 200000, 255003],
        });
    });

    test('kills "first and second reading": first and last rate-limit reading, and their delta', () => {
        const r = usage(A).rateLimit;
        expect(r.readings).toBe(3);
        expect(r.first).toEqual({ fiveHourUtilization: 0.1, sevenDayUtilization: 0.3, sevenDayResetsAt: 1767700000, status: 'allowed', isUsingOverage: false, overageStatus: 'rejected' });
        expect(r.last).toMatchObject({ fiveHourUtilization: 0.25, sevenDayUtilization: 0.35, status: 'allowed_warning', isUsingOverage: true, overageStatus: 'allowed' });
        expect(r.delta).toEqual({ fiveHour: 0.15, sevenDay: 0.05 });
    });

    test('kills "a delta from one reading": fewer than two readings say so, n/a in the text', () => {
        for (const id of [B, C]) {
            const r = usage(id).rateLimit;
            expect(r.delta).toBeNull();
            expect(r.note).toBe('fewer than two readings: no delta');
        }
        expect(run(C).stdout).toContain('rate limit  0 readings: fewer than two readings: no delta');
        expect(run(C).stdout).toContain('tier n/a');
    });

    test('kills "overlap on the start only": overlapping lanes and alone', () => {
        expect(usage(A).overlap.lanes).toEqual([B]);
        expect(usage(B).overlap).toMatchObject({ lanes: [A], alone: false });
        expect(usage(C).overlap).toMatchObject({ lanes: [], alone: true });
        expect(usage(C).running).toBe(true);
        expect(run(A).stdout).toContain('interactive sessions are not visible to lane-run: overlap is a lower bound');
    });

    test('kills "a bad line is fatal": a malformed line is skipped and counted', () => {
        const r = run(A, '--json');
        expect(r.status).toBe(0);
        expect(JSON.parse(r.stdout).skippedLines).toBe(1);
        expect(usage(B).skippedLines).toBe(0);
    });

    test('kills "the table carries the series": the text form is the summary only', () => {
        const out = run(A).stdout;
        expect(out.split('\n')[0]).toBe(`${A}  tier heavy  model claude-opus-5-5 then claude-sonnet-5-5  runs 2  session s-a`);
        expect(out).toContain('context per call  calls 3  max 255003  last 255003  median 200000  >=200k 2  >=250k 1');
        expect(out).not.toContain('105002');
    });

    test('kills "always writes" and "never writes": usage.json only with --write, the JSON form', () => {
        const file = join(root, B, 'usage.json');
        run(B);
        run(B, '--json');
        expect(existsSync(file)).toBe(false);
        const r = run(B, '--write');
        expect(r.status).toBe(0);
        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(usage(B));
        rmSync(file);
    });

    test('kills "an unknown lane prints nothing and exits 0": unknown id and missing log exit 1 with one line', () => {
        const unknown = run('P-2026-01-03-0000');
        expect(unknown.status).toBe(1);
        expect(unknown.stderr.trim().split('\n')).toHaveLength(1);
        cpSync(join(root, C), join(root, 'P-2026-01-03-0100'), { recursive: true });
        rmSync(join(root, 'P-2026-01-03-0100', 'log.jsonl'));
        const missing = run('P-2026-01-03-0100');
        expect(missing.status).toBe(1);
        expect(missing.stderr).toMatch(/^lane-usage: no log\.jsonl in .*\n$/);
        rmSync(join(root, 'P-2026-01-03-0100'), { recursive: true });
    });
});

describe('lane-usage: the architect (architect.json)', () => {
    test('kills "close ignored" and "delta not read": a closed file gives the delta, the chat and the text line', () => {
        const u = usage(A);
        expect(u.architect).toEqual({ chat: 'C-2026-01-01-0900', model: 'claude-fable-5-1', delta: { calls: 4, input: 6, cacheRead: 2000, cacheCreation: 1000, output: 200, totalIn: 3006 } });
        expect(u.architectOpen).toBe(false);
        expect(u.architectUnreadable).toBe(false);
        expect(run(A).stdout).toContain('architect  calls 4  in 3006  out 200  (chat C-2026-01-01-0900)');
    });

    test('kills "open read as closed": no close means open, no delta, the text says open', () => {
        const u = usage(B);
        expect(u.architect).toEqual({ chat: 'C-2026-01-01-0900', model: 'claude-fable-5-1', delta: null });
        expect(u.architectOpen).toBe(true);
        expect(run(B).stdout).toContain('architect  open');
    });

    test('kills "absent is an error": no file is null, not open, text none', () => {
        const u = usage(C);
        expect(u.architect).toBeNull();
        expect(u.architectOpen).toBe(false);
        expect(u.architectUnreadable).toBe(false);
        expect(run(C).stdout).toContain('architect  none');
    });

    test('kills "any JSON is accepted": a file that is not JSON, or not schema 1, is unreadable and ignored', () => {
        const file = join(root, C, 'architect.json');
        for (const body of ['{not json', JSON.stringify({ schema: 2, launch: {}, close: {} }), JSON.stringify({ schema: 1, launch: {}, close: { at: 1 } })]) {
            writeFileSync(file, body);
            const u = usage(C);
            expect(u.architect).toBeNull();
            expect(u.architectOpen).toBe(false);
            expect(u.architectUnreadable).toBe(true);
            expect(run(C).stdout).toContain('architect  unreadable');
            expect(run(C).status).toBe(0);
        }
        rmSync(file);
    });

    test('kills "delta required": a closed file without delta gets close minus launch', () => {
        const file = join(root, C, 'architect.json');
        const side = (n: number) => ({ calls: n, input: n, cacheRead: n * 10, cacheCreation: n * 2, output: n * 3, totalIn: n * 13 });
        writeFileSync(file, JSON.stringify({ schema: 1, chat: 'C-x', model: 'm', launch: side(1), close: side(3) }));
        expect(usage(C).architect.delta).toEqual({ calls: 2, input: 2, cacheRead: 20, cacheCreation: 4, output: 6, totalIn: 26 });
        rmSync(file);
    });

    test('kills "the board file is written": the script never creates or changes architect.json', () => {
        const file = join(root, C, 'architect.json');
        run(C);
        run(C, '--write');
        expect(existsSync(file)).toBe(false);
        rmSync(join(root, C, 'usage.json'), { force: true });
    });
});

describe('lane-usage: --all', () => {
    test('kills "oldest first": one row per lane, newest first, delta n/a without two readings', () => {
        const lines = run('--all').stdout.split('\n');
        expect(lines[0]).toMatch(/^id\s+tier\s+model\s+runs\s+calls\s+ctx max/);
        expect(lines.slice(1, 4).map((l) => l.split(/\s+/)[0])).toEqual([C, B, A]);
        expect(lines[0].split(/\s+/).slice(-3)).toEqual(['delta', 'alone', 'arch']);
        expect(lines[1].split(/\s+/).slice(-3)).toEqual(['n/a', 'true', 'n/a']);
        expect(lines[2].split(/\s+/).slice(-1)).toEqual(['open']);
        expect(lines[3]).toContain('claude-opus-5-5>claude-sonnet-5-5');
        expect(lines[3].split(/\s+/).slice(-3)).toEqual(['0.05', 'false', '3206']);
    });

    test('kills "the series in the array": --json is the per-lane summaries without the series', () => {
        const list = JSON.parse(run('--all', '--json').stdout);
        expect(list.map((u: { id: string }) => u.id)).toEqual([C, B, A]);
        expect(list[2].context).toEqual({ calls: 3, max: 255003, last: 255003, median: 200000, atOrAbove200k: 2, atOrAbove250k: 1 });
        expect(list[2].main).toEqual(usage(A).main);
        expect(list.map((u: { architectOpen: boolean }) => u.architectOpen)).toEqual([false, true, false]);
        expect(list[2].architect.delta.totalIn).toBe(3006);
        expect(list[0].architect).toBeNull();
    });
});
