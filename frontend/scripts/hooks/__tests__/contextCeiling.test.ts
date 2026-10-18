import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runScript, bash, file } from './hookRunner.ts';

// context-ceiling.mjs run as a child process with the event on stdin (P11). Every test
// builds its own transcript, lane log and lanes root in a temp dir (JJODEL_LANES_DIR),
// and a temp dir for the marker (TMPDIR, read by os.tmpdir()). T-C1 and T-C2 are the
// tests of report §7.5 for B8b. A test name states the mutation that turns it red.

const SOFT = 200000;
const HARD = 250000;
const SESSION = 'sess-ctx-1';

let dir: string;
let lanes: string;
let lane: string;
let tmp: string;
let transcript: string;

beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'context-ceiling-test-'));
    lanes = join(dir, 'lanes');
    lane = join(lanes, 'P-2026-10-18-1530');
    mkdirSync(lane, { recursive: true });
    writeFileSync(join(lane, 'session.txt'), SESSION + '\n');
    mkdirSync(join(lanes, 'P-2026-10-18-1420'));
    writeFileSync(join(lanes, 'P-2026-10-18-1420', 'session.txt'), 'another-session\n');
    tmp = join(dir, 'tmp');
    mkdirSync(tmp);
    transcript = join(dir, 'transcript.jsonl');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

interface Ev {
    total: number;
    id?: string;
    sidechain?: boolean;
    parent?: string | null;
}
let seq = 0;
/** One assistant line in the transcript shape; `parent` switches to the stream-json lane-log shape. */
function ev(e: Ev | number): string {
    const x: Ev = typeof e === 'number' ? { total: e } : e;
    const usage = x.total === 0
        ? { input_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, output_tokens: 0 }
        : { input_tokens: 2, cache_read_input_tokens: x.total - 102, cache_creation_input_tokens: 100, output_tokens: 50 };
    const message = { id: x.id ?? 'msg_' + ++seq, role: 'assistant', usage, content: [{ type: 'text', text: 'x' }] };
    if (x.parent !== undefined) return JSON.stringify({ type: 'assistant', message, parent_tool_use_id: x.parent, session_id: SESSION });
    return JSON.stringify({ type: 'assistant', isSidechain: x.sidechain ?? false, message, sessionId: SESSION });
}
const user = () => JSON.stringify({ type: 'user', isSidechain: false, message: { role: 'user', content: 'tool_result' } });
function writeLog(path: string, lines: string[]) {
    writeFileSync(path, lines.join('\n') + '\n');
}

function run(opts: { lines?: string[]; payload?: unknown; tool?: unknown; session?: string; env?: Record<string, string>; transcriptPath?: string | null } = {}) {
    if (opts.lines) writeLog(transcript, opts.lines);
    const tool = opts.tool ?? bash('ls');
    const base = { ...(tool as Record<string, unknown>), session_id: opts.session ?? SESSION, permission_mode: 'bypassPermissions' } as Record<string, unknown>;
    if (opts.transcriptPath === null) delete base.transcript_path;
    else base.transcript_path = opts.transcriptPath ?? transcript;
    const payload = opts.payload ?? base;
    const env: Record<string, string> = { JJODEL_LANES_DIR: lanes, TMPDIR: tmp, JJODEL_LANE_LOG: '', JJODEL_CONTEXT_SOFT: '', JJODEL_CONTEXT_HARD: '', ...(opts.env ?? {}) };
    return runScript('context-ceiling.mjs', payload, env);
}
const markers = () => readdirSync(tmp).filter((n) => n.startsWith('jjodel-context-ceiling-'));
const allowed = (r: ReturnType<typeof run>) => r.status === 0 && r.decision === null && r.stdout === '';
const md = () => join(lane, 'handoff.md');
const diff = () => join(lane, 'handoff.diff');

describe('T-C1: the soft denial fires once, the hard stop allows only the handoff', () => {
    test('kills "soft compared with >": at exactly soft the first call is denied, naming the handoff and the Outcome line', () => {
        const r = run({ lines: [ev(1000), user(), ev(SOFT)] });
        expect(r.status).toBe(0);
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain(String(SOFT) + ' tokens');
        expect(r.reason).toContain(md());
        expect(r.reason).toContain(diff());
        expect(r.reason).toContain('Outcome: hard-stop');
        expect(r.reason).toContain('Start no new work');
        for (const s of ['Task', 'Scope', 'Decisions taken', 'Evidence', 'Current diff', 'Remaining checks']) expect(r.reason).toContain(s);
        expect(r.reason).toContain('git diff --stat');
        expect(markers()).toEqual(['jjodel-context-ceiling-' + SESSION + '.json']);
    });

    test('kills "the marker is not read": the next call below hard is allowed', () => {
        expect(run({ lines: [ev(SOFT + 10)] }).decision).toBe('deny');
        expect(allowed(run({ lines: [ev(SOFT + 10), ev(HARD - 1)] }))).toBe(true);
        expect(allowed(run({ tool: file('Write', { file_path: join(dir, 'x.ts'), content: 'x' }) }))).toBe(true);
    });

    test('kills "the hard stop is off": at hard a Bash ls is denied, naming the handoff and the Outcome line', () => {
        expect(run({ lines: [ev(SOFT)] }).decision).toBe('deny');
        const r = run({ lines: [ev(SOFT), ev(HARD)], tool: bash('ls') });
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('hard ceiling of ' + HARD);
        expect(r.reason).toContain(md());
        expect(r.reason).toContain('Outcome: hard-stop');
    });

    test('kills "the hard stop needs the soft marker": at hard on the first call, ls is still denied', () => {
        expect(run({ lines: [ev(HARD + 5)], tool: bash('ls') }).decision).toBe('deny');
        expect(run({ tool: bash('ls') }).decision).toBe('deny');
    });

    test('kills "the handoff writes are denied": at hard, Write, Edit and Read of the two handoff files are allowed', () => {
        writeLog(transcript, [ev(HARD)]);
        expect(allowed(run({ tool: file('Write', { file_path: md(), content: '# Task' }) }))).toBe(true);
        expect(allowed(run({ tool: file('Edit', { file_path: md(), old_string: 'a', new_string: 'b' }) }))).toBe(true);
        expect(allowed(run({ tool: { ...bash('x'), tool_name: 'Read', tool_input: { file_path: diff() } } }))).toBe(true);
        expect(allowed(run({ tool: file('Write', { file_path: 'handoff.md', content: 'x' }, lane) }))).toBe(true);
    });

    test('kills "any file in the lane folder passes": at hard, other paths and other tools are denied', () => {
        writeLog(transcript, [ev(HARD)]);
        expect(run({ tool: file('Write', { file_path: join(lane, 'session.txt'), content: 'x' }) }).decision).toBe('deny');
        expect(run({ tool: file('Write', { file_path: join(dir, 'handoff.md'), content: 'x' }) }).decision).toBe('deny');
        expect(run({ tool: file('NotebookEdit', { notebook_path: md(), new_source: 'x' }) }).decision).toBe('deny');
        expect(run({ tool: { ...bash('x'), tool_name: 'Agent', tool_input: { prompt: 'x' } } }).decision).toBe('deny');
    });

    test('kills "git is not allowed at hard": git diff --stat, git status and git diff redirected to handoff.diff are allowed', () => {
        writeLog(transcript, [ev(HARD)]);
        expect(allowed(run({ tool: bash('git diff --stat') }))).toBe(true);
        expect(allowed(run({ tool: bash('git status') }))).toBe(true);
        expect(allowed(run({ tool: bash('git diff --stat 74109e58c') }))).toBe(true);
        expect(allowed(run({ tool: bash('git diff --stat > ' + diff()) }))).toBe(true);
        expect(allowed(run({ tool: bash('git diff 74109e58c > "' + diff() + '"') }))).toBe(true);
    });

    test('kills "chaining passes the hard allowlist": git diff; rm x and every other chain are denied', () => {
        writeLog(transcript, [ev(HARD)]);
        for (const c of [
            'git diff; rm x',
            'git diff && rm x',
            'git diff || rm x',
            'git diff | sh',
            'git diff & rm x',
            'git diff\nrm x',
            'git diff `rm x`',
            'git diff $(rm x)',
            'git diff $HOME',
            'git diff > ' + join(lane, 'other.txt'),
            'git diff > ' + join(dir, 'handoff.diff'),
            'git diff >> ' + diff(),
            'git diff --output=' + join(dir, 'x'),
            'git log',
            'git -c core.pager=sh diff',
        ]) {
            expect(run({ tool: bash(c) }).decision, c).toBe('deny');
        }
    });
});

describe('T-C2: never fires below soft (negative)', () => {
    test('kills "fires below soft": calls at soft - 1 and below are allowed, with no marker', () => {
        for (const n of [1, 48232, SOFT - 1]) expect(allowed(run({ lines: [ev(n)] })), String(n)).toBe(true);
        expect(markers()).toEqual([]);
    });

    test('kills "the sidechain filter is dropped": the latest line above soft is a sidechain event', () => {
        expect(allowed(run({ lines: [ev(1000), ev({ total: HARD + 1, sidechain: true }), user()] }))).toBe(true);
        expect(markers()).toEqual([]);
    });

    test('kills "the lane-log subagent filter is dropped": the latest line above soft carries a parent_tool_use_id', () => {
        expect(allowed(run({ lines: [ev({ total: 1000, parent: null }), ev({ total: HARD + 1, parent: 'toolu_01' })] }))).toBe(true);
        expect(run({ lines: [ev({ total: 1000, parent: null }), ev({ total: SOFT, parent: null })] }).decision).toBe('deny');
    });

    test('kills "the maximum is taken, not the latest": an older main event above soft, the latest below', () => {
        expect(allowed(run({ lines: [ev(HARD + 100), user(), ev(SOFT - 1)] }))).toBe(true);
        expect(markers()).toEqual([]);
    });
});

describe('measure', () => {
    test('kills "the first line of a message counts": several lines of one message.id, the latest one counts', () => {
        expect(allowed(run({ lines: [ev({ total: HARD, id: 'msg_A' }), ev({ total: HARD, id: 'msg_B' }), ev({ total: 1000, id: 'msg_B' })] }))).toBe(true);
        expect(run({ lines: [ev({ total: 1000, id: 'msg_A' }), ev({ total: SOFT, id: 'msg_B' }), ev({ total: SOFT, id: 'msg_B' }), user()] }).decision).toBe('deny');
    });

    test('kills "a synthetic zero usage counts": an event summing to 0 is skipped', () => {
        expect(run({ lines: [ev(SOFT), ev(0)] }).decision).toBe('deny');
    });

    test('kills "the tail is never widened": a qualifying event followed by more than 512 KB of other lines is found', () => {
        const filler = JSON.stringify({ type: 'attachment', data: 'y'.repeat(60000) });
        const lines = [ev(SOFT), ...Array.from({ length: 12 }, () => filler)];
        expect(run({ lines }).decision).toBe('deny');
    });
});

describe('source precedence', () => {
    test('kills "transcript_path wins over JJODEL_LANE_LOG": the lane log above soft fires over a transcript below', () => {
        const laneLog = join(lane, 'log.jsonl');
        writeLog(laneLog, [ev({ total: SOFT, parent: null })]);
        const r = run({ lines: [ev(1000)], env: { JJODEL_LANE_LOG: laneLog } });
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain(md());
    });

    test('kills "the transcript is read even when the lane log is set": the lane log below soft wins over a transcript above', () => {
        const laneLog = join(lane, 'log.jsonl');
        writeLog(laneLog, [ev({ total: 1000, parent: null })]);
        expect(allowed(run({ lines: [ev(HARD)], env: { JJODEL_LANE_LOG: laneLog } }))).toBe(true);
    });

    test('kills "an unreadable lane log is trusted": a JJODEL_LANE_LOG that does not exist falls back to transcript_path', () => {
        expect(run({ lines: [ev(SOFT)], env: { JJODEL_LANE_LOG: join(dir, 'missing.jsonl') } }).decision).toBe('deny');
    });
});

describe('lane folder and interactive sessions', () => {
    test('kills "the lanes root is fixed": the lane folder is found under JJODEL_LANES_DIR by its session.txt', () => {
        const r = run({ lines: [ev(SOFT)] });
        expect(r.reason).toContain(md());
        expect(r.reason).not.toContain('P-2026-10-18-1420');
    });

    test('kills "any lane folder is taken": a session held by no session.txt is interactive', () => {
        const r = run({ lines: [ev(SOFT)], session: 'interactive-1' });
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain(String(SOFT) + ' tokens');
        expect(r.reason).toContain('tell the user');
        expect(r.reason).toContain('fresh session');
        expect(r.reason).not.toContain('handoff');
        expect(r.reason).not.toContain('Outcome');
    });

    test('kills "the interactive variant hard-stops": once fired, later calls are allowed even above hard', () => {
        expect(run({ lines: [ev(SOFT)], session: 'interactive-2' }).decision).toBe('deny');
        expect(allowed(run({ lines: [ev(HARD + 1000)], session: 'interactive-2' }))).toBe(true);
    });

    test('kills "the marker is not per session": another session fires again', () => {
        writeLog(transcript, [ev(SOFT)]);
        expect(run({ session: 'interactive-3' }).decision).toBe('deny');
        expect(run({ session: 'interactive-4' }).decision).toBe('deny');
        expect(allowed(run({ session: 'interactive-3' }))).toBe(true);
    });
});

describe('thresholds', () => {
    test('kills "the overrides are ignored": valid JJODEL_CONTEXT_SOFT and _HARD move both ceilings', () => {
        const env = { JJODEL_CONTEXT_SOFT: '1000', JJODEL_CONTEXT_HARD: '2000' };
        expect(allowed(run({ lines: [ev(999)], env }))).toBe(true);
        const r = run({ lines: [ev(1500)], env });
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('soft ceiling of 1000');
        expect(allowed(run({ lines: [ev(1999)], env }))).toBe(true);
        expect(run({ lines: [ev(2000)], env }).decision).toBe('deny');
    });

    test('kills "invalid overrides are accepted": each invalid pair falls back to the defaults', () => {
        const bad: Array<[string, string]> = [['3000', '2000'], ['2000', '2000'], ['0', '2000'], ['-1', '2000'], ['1000.5', '2000'], ['abc', '2000'], ['1000', ''], ['', '2000']];
        writeLog(transcript, [ev(2500)]);
        for (const [s, h] of bad) {
            expect(allowed(run({ env: { JJODEL_CONTEXT_SOFT: s, JJODEL_CONTEXT_HARD: h } })), s + '/' + h).toBe(true);
        }
        expect(run({ lines: [ev(SOFT)], env: { JJODEL_CONTEXT_SOFT: '3000', JJODEL_CONTEXT_HARD: '2000' } }).decision).toBe('deny');
    });
});

describe('fails open', () => {
    test('kills "a broken stdin blocks": empty and unparsable stdin are allowed', () => {
        writeLog(transcript, [ev(HARD)]);
        expect(allowed(run({ payload: '' }))).toBe(true);
        expect(allowed(run({ payload: '{not json' }))).toBe(true);
    });

    test('kills "no session_id blocks": a missing or unusable session_id is allowed', () => {
        writeLog(transcript, [ev(HARD)]);
        const p = { ...bash('ls'), transcript_path: transcript } as Record<string, unknown>;
        delete p.session_id;
        expect(allowed(run({ payload: p }))).toBe(true);
        expect(allowed(run({ payload: { ...p, session_id: '../x' } }))).toBe(true);
    });

    test('kills "no source blocks": no transcript_path, or one that does not exist, is allowed', () => {
        expect(allowed(run({ transcriptPath: null }))).toBe(true);
        expect(allowed(run({ transcriptPath: join(dir, 'nope.jsonl') }))).toBe(true);
    });

    test('kills "no qualifying event blocks": a transcript of user lines, garbage and sidechains only is allowed', () => {
        expect(allowed(run({ lines: [user(), '{garbage', ev({ total: HARD, sidechain: true }), JSON.stringify({ type: 'assistant', message: { id: 'x' } })] }))).toBe(true);
    });

    test('kills "an unwritable marker still denies": with an unwritable temp dir the soft call is allowed', () => {
        writeLog(transcript, [ev(SOFT)]);
        chmodSync(tmp, 0o500);
        try {
            expect(allowed(run({}))).toBe(true);
            expect(allowed(run({ session: 'interactive-5' }))).toBe(true);
        } finally {
            chmodSync(tmp, 0o700);
        }
        expect(existsSync(join(tmp, 'jjodel-context-ceiling-' + SESSION + '.json'))).toBe(false);
    });

    test('kills "deny becomes ask": the decision is deny, never ask, and the marker records the measure', () => {
        const r = run({ lines: [ev(SOFT + 7)] });
        expect(r.decision).toBe('deny');
        const m = JSON.parse(readFileSync(join(tmp, markers()[0]), 'utf8'));
        expect(m).toMatchObject({ soft: true, context: SOFT + 7 });
    });
});
