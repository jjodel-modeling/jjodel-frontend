import { describe, test, expect, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, chmodSync, realpathSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// lane-run.mjs run as a child process, the way the chat runs it (P11), against a
// fake `claude`: a shell script that records how it was called and prints a
// stream-json session. A test name states the mutation of the script that turns
// it red (CLAUDE.md 5); the bench that established it is in the commit message.
//
// LANE_RUN points the suite at another copy of the script (the mutation bench).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.LANE_RUN ? resolve(process.env.LANE_RUN) : resolve(HERE, '..', '..', 'lane-run.mjs');

const ID = 'P-2026-09-26-1640';
const SESSION = '467dcf71-a51c-4c15-a72b-c459bd6fa05c';
const PROMPT = `# Prompt: a lane\n\nPrompt-ID: ${ID}\nChat: C-2026-09-25-1353\nLane: fast\nStatus: da eseguire\n\n## COSA\n\nDo the thing.\n`;

const FAKE_CLAUDE = `#!/bin/sh
{
  echo "--- call"
  echo "cwd=$(pwd -P)"
  echo "path=$PATH"
  for a in "$@"; do echo "arg=$a"; done
  echo "stdin=$(cat | tr '\\n' ' ')"
} >> "$FAKE_STATE/calls.txt"
if [ "$FAKE_MODE" = "noid" ]; then
  echo "Error: When using --print, --output-format=stream-json requires --verbose" >&2
  exit 1
fi
echo '{"type":"system","subtype":"commands_changed","session_id":"'"$FAKE_SESSION"'"}'
echo '{"type":"system","subtype":"init","session_id":"'"$FAKE_SESSION"'"}'
if [ -n "$FAKE_EVENTS" ]; then cat "$FAKE_EVENTS"; fi
if [ -n "$FAKE_HOLD" ]; then
  n=0
  while [ ! -f "$FAKE_HOLD" ] && [ $n -lt 300 ]; do sleep 0.1; n=$((n+1)); done
fi
exit \${FAKE_EXIT:-0}
`;

const dirs: string[] = [];
afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

interface Lab {
    home: string;
    worktree: string;
    state: string;
    bin: string;
    lanes: string;
    env: Record<string, string>;
}

/** A HOME, a worktree, a fake claude on the PATH (or in ~/.local/bin), and the fake's state folder. */
function lab(opts: { claudeIn?: 'path' | 'home' } = {}): Lab {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'lane-run-')));
    dirs.push(root);
    const home = join(root, 'home');
    const worktree = join(root, 'worktree');
    const state = join(root, 'state');
    const bin = join(root, 'bin');
    for (const d of [home, worktree, state, bin]) mkdirSync(d, { recursive: true });
    const where = opts.claudeIn === 'home' ? join(home, '.local', 'bin') : bin;
    mkdirSync(where, { recursive: true });
    writeFileSync(join(where, 'claude'), FAKE_CLAUDE);
    chmodSync(join(where, 'claude'), 0o755);
    writeFileSync(join(worktree, 'prompt.md'), PROMPT);
    const env: Record<string, string> = {
        HOME: home,
        PATH: `${bin}:/usr/bin:/bin`,
        FAKE_STATE: state,
        FAKE_SESSION: SESSION,
    };
    return { home, worktree, state, bin, lanes: join(home, '.jjodel-lanes'), env };
}

function laneRun(l: Lab, args: string[], opts: { env?: Record<string, string>; cwd?: string } = {}) {
    const r = spawnSync(process.execPath, [SCRIPT, ...args], {
        cwd: opts.cwd ?? l.home,
        env: { ...l.env, ...opts.env },
        encoding: 'utf8',
        timeout: 20000,
    });
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

/** The calls the fake claude recorded, one object per invocation. */
function calls(l: Lab) {
    const file = join(l.state, 'calls.txt');
    if (!existsSync(file)) return [];
    return readFileSync(file, 'utf8')
        .split('--- call\n')
        .filter((c) => c.trim() !== '')
        .map((c) => {
            const lines = c.trimEnd().split('\n');
            const one = (k: string) => (lines.find((x) => x.startsWith(k + '=')) ?? '').slice(k.length + 1);
            return {
                cwd: one('cwd'),
                path: one('path'),
                args: lines.filter((x) => x.startsWith('arg=')).map((x) => x.slice(4)),
                stdin: one('stdin'),
            };
        });
}

function waitFor(file: string, ms = 10000): boolean {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        if (existsSync(file)) return true;
        spawnSync('/bin/sleep', ['0.05']);
    }
    return existsSync(file);
}

const laneDir = (l: Lab, id = ID) => join(l.lanes, id);

function assistant(text: string) {
    return JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] }, session_id: SESSION });
}

// ── start ────────────────────────────────────────────────────────────────────

describe('lane-run start', () => {
    test('kills "no lane directory, no session.txt, no printed log path": start creates ~/.jjodel-lanes/<ID>/ and records the session of the first event', () => {
        const l = lab();
        const r = laneRun(l, ['start', l.worktree, 'prompt.md']);
        expect(r.status, r.stderr).toBe(0);
        const dir = laneDir(l);
        expect(existsSync(dir)).toBe(true);
        expect(r.stdout).toContain(`log: ${join(dir, 'log.jsonl')}`);
        expect(r.stdout).toContain(`session: ${SESSION}`);
        expect(readFileSync(join(dir, 'session.txt'), 'utf8').trim()).toBe(SESSION);
        expect(readFileSync(join(dir, 'worktree.txt'), 'utf8').trim()).toBe(l.worktree);
        expect(waitFor(join(dir, 'exit.txt'))).toBe(true);
    });

    test('kills "a flag dropped, the wrong cwd, the prompt not on stdin, the own node not first on PATH": the call claude receives', () => {
        const l = lab();
        const r = laneRun(l, ['start', l.worktree, 'prompt.md']);
        expect(r.status, r.stderr).toBe(0);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        const [c] = calls(l);
        expect(c.args).toEqual(['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', 'bypassPermissions']);
        expect(c.cwd).toBe(l.worktree);
        expect(c.stdin).toContain(`Prompt-ID: ${ID}`);
        expect(c.path.split(':')[0]).toBe(dirname(process.execPath));
    });

    test('kills "the Prompt-ID guard", "a Prompt-ID in the body counts": a header with no Prompt-ID is refused before anything runs, the exact line in the body notwithstanding', () => {
        const l = lab();
        // The body holds the exact header line: only the header counts.
        writeFileSync(join(l.worktree, 'bare.md'), `# Prompt: no id\n\n## COSA\n\nPrompt-ID: ${ID}\n`);
        const r = laneRun(l, ['start', l.worktree, 'bare.md']);
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('Prompt-ID');
        expect(existsSync(l.lanes)).toBe(false);
        expect(calls(l)).toEqual([]);
    });

    test('kills "the Prompt-ID guard": a Prompt-ID line with trailing text in the body is not a header either', () => {
        const l = lab();
        // The round-1 fixture of the bench: M12 alone survives it, since the trailing text already fails the line.
        writeFileSync(join(l.worktree, 'bare.md'), `# Prompt: no id\n\n## COSA\n\nPrompt-ID: ${ID} quoted in the body does not count.\n`);
        const r = laneRun(l, ['start', l.worktree, 'bare.md']);
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('Prompt-ID');
        expect(existsSync(l.lanes)).toBe(false);
        expect(calls(l)).toEqual([]);
    });

    test('kills "start over a started lane": a second start of the same Prompt-ID is refused and claude is not called again', () => {
        const l = lab();
        expect(laneRun(l, ['start', l.worktree, 'prompt.md']).status).toBe(0);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        const r = laneRun(l, ['start', l.worktree, 'prompt.md']);
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('resume');
        expect(calls(l)).toHaveLength(1);
    });

    test('kills "no fallback to ~/.local/bin/claude": with no claude on the PATH, the one in ~/.local/bin runs', () => {
        const l = lab({ claudeIn: 'home' });
        const r = laneRun(l, ['start', l.worktree, 'prompt.md']);
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain(`session: ${SESSION}`);
        expect(calls(l)).toHaveLength(1);
    });

    test('kills "wait forever on a dead session": a claude that exits with no session event fails the start and shows its stderr', () => {
        const l = lab();
        const r = laneRun(l, ['start', l.worktree, 'prompt.md'], { env: { FAKE_MODE: 'noid' } });
        expect(r.status).toBe(1);
        expect(r.stderr).toContain('requires --verbose');
        expect(existsSync(join(laneDir(l), 'session.txt'))).toBe(false);
    });
});

// ── resume ───────────────────────────────────────────────────────────────────

describe('lane-run resume', () => {
    test('kills "resume without session.txt": a lane that was never started is refused and claude is not called', () => {
        const l = lab();
        writeFileSync(join(l.home, 'go.md'), `[${ID}] GO`);
        const r = laneRun(l, ['resume', ID, join(l.home, 'go.md')]);
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('session.txt');
        expect(calls(l)).toEqual([]);
    });

    test('kills "resume without worktree.txt": a lane directory with a session but no recorded worktree is refused', () => {
        const l = lab();
        mkdirSync(laneDir(l), { recursive: true });
        writeFileSync(join(laneDir(l), 'session.txt'), SESSION + '\n');
        writeFileSync(join(l.home, 'go.md'), `[${ID}] GO`);
        const r = laneRun(l, ['resume', ID, join(l.home, 'go.md')]);
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('worktree.txt');
        expect(calls(l)).toEqual([]);
    });

    test('kills "a Prompt-ID used as a path": an argument that is not P-YYYY-MM-DD-HHmm is refused, even where it names a lane-shaped folder', () => {
        const l = lab();
        // ../x from ~/.jjodel-lanes is ~/x: a folder that would pass every other check.
        mkdirSync(join(l.home, 'x'), { recursive: true });
        writeFileSync(join(l.home, 'x', 'session.txt'), SESSION + '\n');
        writeFileSync(join(l.home, 'x', 'worktree.txt'), l.worktree + '\n');
        writeFileSync(join(l.home, 'go.md'), `[${ID}] GO`);
        const r = laneRun(l, ['resume', '../x', join(l.home, 'go.md')]);
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('Prompt-ID');
        expect(calls(l)).toEqual([]);
    });

    test('kills "resume in the caller\'s cwd", "no --resume", "log truncated": resume runs in the recorded worktree, called from elsewhere, and appends', () => {
        const l = lab();
        expect(laneRun(l, ['start', l.worktree, 'prompt.md']).status).toBe(0);
        const dir = laneDir(l);
        expect(waitFor(join(dir, 'exit.txt'))).toBe(true);
        const before = readFileSync(join(dir, 'log.jsonl'), 'utf8');
        writeFileSync(join(l.home, 'go.md'), `[${ID}] GO Phase 2`);
        const r = laneRun(l, ['resume', ID, 'go.md'], { cwd: l.home });
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain(`session: ${SESSION}`);
        expect(waitFor(join(dir, 'exit.txt'))).toBe(true);
        const c = calls(l)[1];
        expect(c.args).toEqual(['-p', '--resume', SESSION, '--output-format', 'stream-json', '--verbose', '--permission-mode', 'bypassPermissions']);
        expect(c.cwd).toBe(l.worktree);
        expect(c.stdin).toContain('GO Phase 2');
        const after = readFileSync(join(dir, 'log.jsonl'), 'utf8');
        expect(after.startsWith(before)).toBe(true);
        expect(after.length).toBeGreaterThan(before.length);
    });

    test('kills "resume over a running session": a resume while the session still runs is refused', () => {
        const l = lab();
        const hold = join(l.state, 'release');
        expect(laneRun(l, ['start', l.worktree, 'prompt.md'], { env: { FAKE_HOLD: hold } }).status).toBe(0);
        writeFileSync(join(l.home, 'go.md'), `[${ID}] GO`);
        const r = laneRun(l, ['resume', ID, join(l.home, 'go.md')]);
        writeFileSync(hold, '');
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('running');
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        expect(calls(l)).toHaveLength(1);
    });
});

// ── status ───────────────────────────────────────────────────────────────────

describe('lane-run status', () => {
    test('kills "running reported as exited": a session still in flight is running, with no exit code', () => {
        const l = lab();
        const hold = join(l.state, 'release');
        expect(laneRun(l, ['start', l.worktree, 'prompt.md'], { env: { FAKE_HOLD: hold } }).status).toBe(0);
        const r = laneRun(l, ['status', ID]);
        writeFileSync(hold, '');
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain('state: running');
        expect(r.stdout).toContain('exit: -');
        expect(r.stdout).toContain('limit 90 min');
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
    });

    test('kills "exit code lost", "first Outcome instead of last", "Outcome read outside assistant text": exited with its code and the last Outcome line', () => {
        const l = lab();
        const events = join(l.state, 'events.jsonl');
        writeFileSync(
            events,
            [
                assistant('Phase 1 report.\nOutcome: question'),
                JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: 'Outcome: done' }] }, session_id: SESSION }),
                assistant('Closing report.\nOutcome: hard-stop\n'),
                JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'Outcome: done' }] }, session_id: SESSION }),
                JSON.stringify({ type: 'result', subtype: 'success', result: 'Outcome: blocked', session_id: SESSION }),
            ].join('\n') + '\n',
        );
        expect(laneRun(l, ['start', l.worktree, 'prompt.md'], { env: { FAKE_EVENTS: events, FAKE_EXIT: '3' } }).status).toBe(0);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        const r = laneRun(l, ['status', ID]);
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain('state: exited');
        expect(r.stdout).toContain('exit: 3');
        expect(r.stdout).toContain('outcome: Outcome: hard-stop');
    });

    test('kills "no Outcome reported as one": a log with no Outcome line says none', () => {
        const l = lab();
        expect(laneRun(l, ['start', l.worktree, 'prompt.md']).status).toBe(0);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        const r = laneRun(l, ['status', ID]);
        expect(r.stdout).toContain('outcome: none');
        expect(r.stdout).toContain('exit: 0');
    });

    test('kills "the time limit ignored", "--limit ignored": a running session past the limit is blocked', () => {
        const l = lab();
        const hold = join(l.state, 'release');
        expect(laneRun(l, ['start', l.worktree, 'prompt.md'], { env: { FAKE_HOLD: hold } }).status).toBe(0);
        spawnSync('/bin/sleep', ['0.05']);
        const r = laneRun(l, ['status', ID, '--limit', '0']);
        writeFileSync(hold, '');
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain('state: blocked');
        expect(r.stdout).toContain('limit 0 min');
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
    });

    test('kills "status of an unknown lane": a Prompt-ID never started exits 2', () => {
        const l = lab();
        const r = laneRun(l, ['status', ID]);
        expect(r.status).toBe(2);
    });
});
