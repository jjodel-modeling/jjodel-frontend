import { describe, test, expect, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, chmodSync, realpathSync, rmSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createServer, type Server } from 'node:net';
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
  echo "goahead=\${JJODEL_CRITICAL_ZONE_GOAHEAD-unset}"
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

function laneRun(l: Lab, args: string[], opts: { env?: Record<string, string>; cwd?: string; input?: string } = {}) {
    const r = spawnSync(process.execPath, [SCRIPT, ...args], {
        cwd: opts.cwd ?? l.home,
        env: { ...l.env, ...opts.env },
        encoding: 'utf8',
        timeout: 20000,
        input: opts.input,
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
                goahead: one('goahead'),
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

    test('kills "go-ahead not passed", "go-ahead passed by default": without the flag the child has no JJODEL_CRITICAL_ZONE_GOAHEAD, with it the variable is the Prompt-ID and goahead.txt records it', () => {
        const l = lab();
        const r0 = laneRun(l, ['start', l.worktree, 'prompt.md']);
        expect(r0.status, r0.stderr).toBe(0);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        expect(calls(l)[0].goahead).toBe('unset');
        const l2 = lab();
        const r = laneRun(l2, ['start', l2.worktree, 'prompt.md', '--critical-zone-goahead', ID]);
        expect(r.status, r.stderr).toBe(0);
        expect(waitFor(join(laneDir(l2), 'exit.txt'))).toBe(true);
        expect(calls(l2)[0].goahead).toBe(ID);
        expect(readFileSync(join(laneDir(l2), 'goahead.txt'), 'utf8').trim()).toBe(ID);
    });

    test('kills "any Prompt-ID accepted as go-ahead": the flag with another lane\'s Prompt-ID is refused before anything runs', () => {
        const l = lab();
        const r = laneRun(l, ['start', l.worktree, 'prompt.md', '--critical-zone-goahead', 'P-2026-09-27-0035']);
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('not the Prompt-ID of this lane');
        expect(calls(l)).toEqual([]);
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

// ── resume with an inline message ────────────────────────────────────────────

describe('lane-run resume --text and -', () => {
    test('kills "--text not kept", "--text not on stdin", "message files overwritten": each inline message is written to msg-<n>.md before the run and reaches claude on stdin', () => {
        const l = lab();
        expect(laneRun(l, ['start', l.worktree, 'prompt.md']).status).toBe(0);
        const dir = laneDir(l);
        expect(waitFor(join(dir, 'exit.txt'))).toBe(true);
        const r1 = laneRun(l, ['resume', ID, '--text', `[${ID}] GO inline one`]);
        expect(r1.status, r1.stderr).toBe(0);
        expect(waitFor(join(dir, 'exit.txt'))).toBe(true);
        const r2 = laneRun(l, ['resume', ID, '--text', `[${ID}] GO inline two`]);
        expect(r2.status, r2.stderr).toBe(0);
        expect(waitFor(join(dir, 'exit.txt'))).toBe(true);
        expect(readFileSync(join(dir, 'msg-1.md'), 'utf8')).toBe(`[${ID}] GO inline one\n`);
        expect(readFileSync(join(dir, 'msg-2.md'), 'utf8')).toBe(`[${ID}] GO inline two\n`);
        const c = calls(l);
        expect(c[1].args).toEqual(['-p', '--resume', SESSION, '--output-format', 'stream-json', '--verbose', '--permission-mode', 'bypassPermissions']);
        expect(c[1].stdin).toContain('GO inline one');
        expect(c[2].stdin).toContain('GO inline two');
        expect(c[1].cwd).toBe(l.worktree);
    });

    test('kills "the stdin form ignored": resume <Prompt-ID> - takes the message from stdin', () => {
        const l = lab();
        expect(laneRun(l, ['start', l.worktree, 'prompt.md']).status).toBe(0);
        const dir = laneDir(l);
        expect(waitFor(join(dir, 'exit.txt'))).toBe(true);
        const r = laneRun(l, ['resume', ID, '-'], { input: `[${ID}] GO from stdin\n` });
        expect(r.status, r.stderr).toBe(0);
        expect(waitFor(join(dir, 'exit.txt'))).toBe(true);
        expect(readFileSync(join(dir, 'msg-1.md'), 'utf8')).toBe(`[${ID}] GO from stdin\n`);
        expect(calls(l)[1].stdin).toContain('GO from stdin');
    });

    test('kills "a refused resume leaves a message behind", "an empty message accepted": an inline resume over a running session, or with no text, writes nothing and calls nothing', () => {
        const l = lab();
        const hold = join(l.state, 'release');
        expect(laneRun(l, ['start', l.worktree, 'prompt.md'], { env: { FAKE_HOLD: hold } }).status).toBe(0);
        const r = laneRun(l, ['resume', ID, '--text', `[${ID}] GO`]);
        writeFileSync(hold, '');
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('running');
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        expect(existsSync(join(laneDir(l), 'msg-1.md'))).toBe(false);
        const e = laneRun(l, ['resume', ID, '--text', '  ']);
        expect(e.status).toBe(2);
        expect(existsSync(join(laneDir(l), 'msg-1.md'))).toBe(false);
        expect(calls(l)).toHaveLength(1);
    });
});

// ── go ───────────────────────────────────────────────────────────────────────

const GO_REL = 'docs/prompts/claude_2026-09-26_1640_prompt_go.md';
const GO_PROMPT = `# Prompt: a lane

Prompt-ID: ${ID}
Chat: C-2026-09-25-1353
Lane: fast
Status: da eseguire

## COSA

Do the thing.

## COME

### The pieces

1. **Piece one.** Not a step.
2. **Piece two.** Not a step either.

### Steps

1. Read the file.
2. Commit the code, subject \`feat: x (${ID})\`.
   - with a nested line
3. The closure commit, then \`Outcome: done\`.

Never: push.

## RIFERIMENTI

1. Not a step at all.
`;

/** A lane started on GO_PROMPT under docs/prompts, run to its exit. */
function goLab(): Lab {
    const l = lab();
    mkdirSync(join(l.worktree, 'docs', 'prompts'), { recursive: true });
    writeFileSync(join(l.worktree, GO_REL), GO_PROMPT);
    expect(laneRun(l, ['start', l.worktree, GO_REL]).status).toBe(0);
    expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
    return l;
}

describe('lane-run go', () => {
    test('kills "GO without the id", "the smoke dropped", "the step not taken from COME", "the step taken from the wrong list": go renders the GO and resumes with it', () => {
        const l = goLab();
        const r = laneRun(l, ['go', ID, '--smoke', 'Smoke on 3001 from the chat: x.ts served 200.', '--step', '2']);
        expect(r.status, r.stderr).toBe(0);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        const text = readFileSync(join(laneDir(l), 'msg-1.md'), 'utf8');
        expect(text).toBe(`[${ID}] GO.\n\nSmoke on 3001 from the chat: x.ts served 200.\n\nNow step 2: Commit the code, subject \`feat: x (${ID})\`.\n   - with a nested line\n`);
        const c = calls(l)[1];
        expect(c.args).toContain('--resume');
        expect(c.stdin).toContain(`[${ID}] GO.`);
    });

    test('kills "no generic closure line": go without --step asks for the closure commit', () => {
        const l = goLab();
        const r = laneRun(l, ['go', ID, '--smoke', 'Smoke passed.']);
        expect(r.status, r.stderr).toBe(0);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        expect(readFileSync(join(laneDir(l), 'msg-1.md'), 'utf8')).toBe(`[${ID}] GO.\n\nSmoke passed.\n\nNow the closure commit as the prompt says.\n`);
    });

    test('kills "a missing step resumes anyway", "go without --smoke": both are refused and claude is not called again', () => {
        const l = goLab();
        const r = laneRun(l, ['go', ID, '--smoke', 'Smoke passed.', '--step', '9']);
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('step 9');
        const s = laneRun(l, ['go', ID, '--step', '1']);
        expect(s.status).toBe(2);
        expect(s.stderr).toContain('--smoke');
        expect(existsSync(join(laneDir(l), 'msg-1.md'))).toBe(false);
        expect(calls(l)).toHaveLength(1);
    });

    test('kills "no fallback without prompt.txt": a lane started before prompt.txt existed finds its prompt by Prompt-ID under docs/prompts', () => {
        const l = goLab();
        rmSync(join(laneDir(l), 'prompt.txt'), { force: true });
        writeFileSync(join(l.worktree, 'docs', 'prompts', 'claude_2026-09-26_1600_prompt_other.md'), PROMPT.replace(ID, 'P-2026-09-26-1600'));
        const r = laneRun(l, ['go', ID, '--smoke', 'Smoke passed.', '--step', '1']);
        expect(r.status, r.stderr).toBe(0);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        expect(readFileSync(join(laneDir(l), 'msg-1.md'), 'utf8')).toContain('Now step 1: Read the file.\n');
    });
});

// ── merge ────────────────────────────────────────────────────────────────────

const NOW = '2026-09-27T10:40';
const NEW_ID = 'P-2026-09-27-1040';
const GIT_ENV = {
    GIT_AUTHOR_NAME: 'Lane Test',
    GIT_AUTHOR_EMAIL: 'lane@test.invalid',
    GIT_COMMITTER_NAME: 'Lane Test',
    GIT_COMMITTER_EMAIL: 'lane@test.invalid',
    GIT_CONFIG_NOSYSTEM: '1',
};
const MERGE_ENV = { LANE_RUN_NOW: NOW, ...GIT_ENV };
const MERGE_FILE = 'docs/prompts/claude_2026-09-27_1040_prompt_merge_feat.md';
const TAKE_FILE = 'docs/prompts/claude_2026-09-27_1040_prompt_feat_take_trunk.md';

const DECISIONS = '# Decisions\n\n### Series X\n\n- **R-X-1** (2026-09-26): the base row.\n';
const INBOX = '# log-inbox\n\n---\n';
const TEN = 'l1\nl2\nl3\nl4\nl5\nl6\nl7\nl8\nl9\nl10\n';
const lanePrompt = (id: string, status: string) =>
    `# Prompt: a lane\n\nPrompt-ID: ${id}\nChat: C-2026-09-26-1702\nLane: fast\nStatus: ${status}\n\n## COSA\n\nThe feature.\n`;

function gitIn(l: Lab, cwd: string, args: string[]): string {
    const r = spawnSync('git', args, { cwd, env: { ...l.env, ...GIT_ENV }, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
    return r.stdout.trim();
}

function commitFiles(l: Lab, repo: string, message: string, files: Record<string, string>): string {
    for (const [p, text] of Object.entries(files)) {
        mkdirSync(dirname(join(repo, p)), { recursive: true });
        writeFileSync(join(repo, p), text);
    }
    gitIn(l, repo, ['add', '--', ...Object.keys(files)]);
    gitIn(l, repo, ['commit', '-q', '-m', message, '--', ...Object.keys(files)]);
    return gitIn(l, repo, ['rev-parse', 'HEAD']);
}

interface RepoLab {
    l: Lab;
    repo: string;
    base: string;
    branchTip: string;
    trunkTip: string;
}

/**
 * A repository with the trunk `trunk` checked out and a branch `feat` from the base.
 * The branch adds a prompt, a code file and a decision row with an inbox entry; the
 * trunk changes another code file and adds a prompt of its own. The options add, on
 * top: a line conflict in src/a.ts (conflict), an auto-merged change to src/a.ts on
 * both sides (bothCode), a row appended to decisions.md on the trunk (docsConflict),
 * CLAUDE.md edited on the branch (governance), the branch prompt not flipped (pending).
 */
function repoLab(o: { conflict?: boolean; bothCode?: boolean; docsConflict?: boolean; governance?: boolean; pending?: boolean } = {}): RepoLab {
    const l = lab();
    const repo = join(dirname(l.home), 'repo');
    mkdirSync(repo);
    gitIn(l, repo, ['init', '-q', '-b', 'trunk']);
    const base = commitFiles(l, repo, 'base', {
        'CLAUDE.md': '# rules\n',
        'docs/decisions.md': DECISIONS,
        'docs/log-inbox/lane.md': INBOX,
        'src/a.ts': TEN,
        'src/c.ts': 'c\n',
    });
    gitIn(l, repo, ['checkout', '-q', '-b', 'feat']);
    commitFiles(l, repo, 'docs: add prompt P-2026-09-27-0100', {
        'docs/prompts/claude_2026-09-27_0100_prompt_feat.md': lanePrompt('P-2026-09-27-0100', o.pending ? 'da eseguire' : 'eseguito 2026-09-27 · lane feat · 1234567'),
    });
    const code: Record<string, string> = { 'src/b.ts': 'b\n' };
    if (o.conflict) code['src/a.ts'] = TEN.replace('l5', 'FEAT');
    if (o.bothCode) code['src/a.ts'] = TEN.replace('l1\n', 'FEAT1\n');
    commitFiles(l, repo, 'feat: the code', code);
    if (o.governance) commitFiles(l, repo, 'docs: a rule on the branch', { 'CLAUDE.md': '# rules\n\nA branch rule.\n' });
    const branchTip = commitFiles(l, repo, 'docs: the feat rows', {
        'docs/decisions.md': DECISIONS + '- **R-X-2** (2026-09-27): the feat row.\n',
        'docs/log-inbox/lane.md': INBOX + '\n## 2026-09-27 — feat: the thing (P-2026-09-27-0100)\n**Prompt**: the feat.\n',
    });
    gitIn(l, repo, ['checkout', '-q', 'trunk']);
    const trunkCode: Record<string, string> = { 'src/c.ts': 'c2\n' };
    if (o.conflict) trunkCode['src/a.ts'] = TEN.replace('l5', 'TRUNK');
    if (o.bothCode) trunkCode['src/a.ts'] = TEN.replace('l10', 'TRUNK10');
    commitFiles(l, repo, 'fix: the trunk code', trunkCode);
    if (o.docsConflict) commitFiles(l, repo, 'docs: a trunk row', { 'docs/decisions.md': DECISIONS + '- **R-X-3** (2026-09-27): the trunk row.\n' });
    const trunkTip = commitFiles(l, repo, 'docs: add prompt P-2026-09-27-0200', {
        'docs/prompts/claude_2026-09-27_0200_prompt_other.md': lanePrompt('P-2026-09-27-0200', 'da eseguire'),
    });
    return { l, repo, base, branchTip, trunkTip };
}

const short = (sha: string) => sha.slice(0, 9);

describe('lane-run merge', () => {
    test('kills "a measurement dropped or wrong", "the prompt not rendered", "a placeholder left": merge measures both sides and writes the rendered prompt, uncommitted', () => {
        const { l, repo, base, branchTip, trunkTip } = repoLab();
        const r = laneRun(l, ['merge', 'feat', '--into', 'trunk'], { cwd: repo, env: MERGE_ENV });
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain(`trunk: trunk at ${short(trunkTip)}`);
        expect(r.stdout).toContain(`branch: feat at ${short(branchTip)}`);
        expect(r.stdout).toContain(`base: ${short(base)}`);
        expect(r.stdout).toContain('conflicts: none');
        expect(r.stdout).toContain('files: 4 on the branch side, 2 on the trunk side; both sides: none');
        expect(r.stdout).toContain('governance: unchanged on the branch');
        expect(r.stdout).toContain('branch commits: 3');
        expect(r.stdout).toContain('trunk commits: 2');
        expect(r.stdout).toContain('branch prompts: claude_2026-09-27_0100_prompt_feat.md eseguito');
        expect(r.stdout).toContain(`trunk in ${repo}`);
        expect(r.stdout).toContain(`Prompt-ID: ${NEW_ID}`);
        expect(r.stdout).toContain(`prompt: ${join(repo, MERGE_FILE)}`);
        expect(r.stdout).toContain('launch: not requested');
        const text = readFileSync(join(repo, MERGE_FILE), 'utf8');
        expect(text).toContain(`\nPrompt-ID: ${NEW_ID}\n`);
        expect(text).toContain('\nStatus: da eseguire\n');
        expect(text).toContain(`Worktree: \`${repo}\`, branch \`trunk\``);
        expect(text).toContain(`the explicit sha \`${short(branchTip)}\``);
        expect(text).toContain(`Merge base \`${short(base)}\``);
        expect(text).toContain(`its parent \`${short(trunkTip)}\``);
        expect(text).toContain('R-X-2');
        expect(text).toContain('## 2026-09-27 — feat: the thing (P-2026-09-27-0100)');
        expect(text).not.toContain('{{');
        expect(text).not.toContain('Findings');
        expect(gitIn(l, repo, ['status', '--porcelain'])).toBe(`?? ${MERGE_FILE}`);
        expect(calls(l)).toEqual([]);
    });

    test('kills "launch commits more than the prompt", "no Model trailer", "launch does not start the lane": --launch commits the prompt alone and starts it', () => {
        const { l, repo } = repoLab();
        writeFileSync(join(repo, 'src', 'staged.ts'), 'x\n');
        gitIn(l, repo, ['add', '--', 'src/staged.ts']);
        const r = laneRun(l, ['merge', 'feat', '--into', 'trunk', '--chat', 'C-2026-09-26-1702', '--launch'], { cwd: repo, env: MERGE_ENV });
        expect(r.status, r.stderr).toBe(0);
        expect(gitIn(l, repo, ['log', '-1', '--format=%s'])).toBe(`docs: add prompt ${NEW_ID}, merge feat into trunk`);
        expect(gitIn(l, repo, ['log', '-1', '--format=%b'])).toContain('Model: chat via lane-run');
        expect(gitIn(l, repo, ['show', '--name-only', '--format=', 'HEAD'])).toBe(MERGE_FILE);
        expect(gitIn(l, repo, ['diff', '--cached', '--name-only'])).toBe('src/staged.ts');
        expect(r.stdout).toContain(`session: ${SESSION}`);
        expect(waitFor(join(l.lanes, NEW_ID, 'exit.txt'))).toBe(true);
        const [c] = calls(l);
        expect(c.cwd).toBe(repo);
        expect(c.stdin).toContain(`Prompt-ID: ${NEW_ID}`);
        expect(c.stdin).toContain('Chat: C-2026-09-26-1702');
    });

    test('kills "JJODEL_MODEL_TRAILER ignored": the launch commit carries the trailer the variable names', () => {
        const { l, repo } = repoLab();
        const r = laneRun(l, ['merge', 'feat', '--into', 'trunk', '--launch'], {
            cwd: repo,
            env: { ...MERGE_ENV, JJODEL_MODEL_TRAILER: 'Model: claude-opus-5-5 (chat C-2026-09-26-1702)' },
        });
        expect(r.status, r.stderr).toBe(0);
        const body = gitIn(l, repo, ['log', '-1', '--format=%b']);
        expect(body).toContain('Model: claude-opus-5-5 (chat C-2026-09-26-1702)');
        expect(body).not.toContain('chat via lane-run');
        expect(waitFor(join(l.lanes, NEW_ID, 'exit.txt'))).toBe(true);
    });

    test('kills "launch over a code file changed on both sides": RC-14, the branch takes the trunk first; the prompt carries the finding, nothing is committed or started', () => {
        const { l, repo, trunkTip } = repoLab({ bothCode: true });
        const r = laneRun(l, ['merge', 'feat', '--into', 'trunk', '--launch'], { cwd: repo, env: MERGE_ENV });
        expect(r.status).toBe(2);
        expect(r.stdout).toContain('conflicts: none');
        expect(r.stdout).toContain('both sides: src/a.ts');
        expect(r.stderr).toContain('--trunk-into feat');
        const text = readFileSync(join(repo, MERGE_FILE), 'utf8');
        expect(text).toMatch(/\*\*Findings\.\*\*[\s\S]*src\/a\.ts[\s\S]*## COME/);
        expect(gitIn(l, repo, ['rev-parse', 'HEAD'])).toBe(trunkTip);
        expect(existsSync(join(l.lanes, NEW_ID))).toBe(false);
        expect(calls(l)).toEqual([]);
    });

    test('kills "launch over a changed governance file": CLAUDE.md edited on the branch refuses the launch', () => {
        const { l, repo, trunkTip } = repoLab({ governance: true });
        const r = laneRun(l, ['merge', 'feat', '--into', 'trunk', '--launch'], { cwd: repo, env: MERGE_ENV });
        expect(r.status).toBe(2);
        expect(r.stdout).toContain('governance: changed on the branch: CLAUDE.md');
        expect(r.stderr).toContain('CLAUDE.md');
        expect(gitIn(l, repo, ['rev-parse', 'HEAD'])).toBe(trunkTip);
        expect(calls(l)).toEqual([]);
    });

    test('kills "launch over a prompt not flipped": a branch prompt without Status: eseguito refuses the launch', () => {
        const { l, repo } = repoLab({ pending: true });
        const r = laneRun(l, ['merge', 'feat', '--into', 'trunk', '--launch'], { cwd: repo, env: MERGE_ENV });
        expect(r.status).toBe(2);
        expect(r.stdout).toContain('claude_2026-09-27_0100_prompt_feat.md da eseguire');
        expect(r.stderr).toContain('Status');
        expect(calls(l)).toEqual([]);
    });

    test('kills "a union conflict refuses the launch", "trunk-side rows not probed", "no control": a decisions.md conflict is left to the union rule, both rows probed, the next id a control', () => {
        const { l, repo } = repoLab({ docsConflict: true });
        const r = laneRun(l, ['merge', 'feat', '--into', 'trunk', '--launch'], { cwd: repo, env: MERGE_ENV });
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain('conflicts: 1: docs/decisions.md');
        const text = readFileSync(join(repo, MERGE_FILE), 'utf8');
        expect(text).toContain('R-X-2');
        expect(text).toContain('R-X-3');
        expect(text).toContain('R-X-4');
        expect(text).toContain('by union');
        expect(waitFor(join(l.lanes, NEW_ID, 'exit.txt'))).toBe(true);
    });

    test('kills "Prompt-ID collision accepted": a prompt already holding this minute is refused and nothing is written', () => {
        const { l, repo } = repoLab();
        writeFileSync(join(repo, 'docs', 'prompts', 'claude_2026-09-27_1040_prompt_other_lane.md'), lanePrompt(NEW_ID, 'da eseguire'));
        const r = laneRun(l, ['merge', 'feat', '--into', 'trunk'], { cwd: repo, env: MERGE_ENV });
        expect(r.status).toBe(2);
        expect(r.stderr).toContain(NEW_ID);
        expect(existsSync(join(repo, MERGE_FILE))).toBe(false);
    });

    test('kills "merge from any worktree": merge --into runs only from the worktree of the trunk', () => {
        const { l, repo } = repoLab();
        const wt = join(dirname(repo), 'wt-feat');
        gitIn(l, repo, ['worktree', 'add', '-q', wt, 'feat']);
        const r = laneRun(l, ['merge', 'feat', '--into', 'trunk'], { cwd: wt, env: MERGE_ENV });
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('trunk');
        expect(existsSync(join(wt, MERGE_FILE))).toBe(false);
    });

    test('kills "--at ignored", "launch from a past trunk": --at measures the trunk at that commit and refuses --launch', () => {
        const { l, repo } = repoLab();
        const past = gitIn(l, repo, ['rev-parse', 'trunk~1']);
        const r = laneRun(l, ['merge', 'feat', '--into', 'trunk', '--at', 'trunk~1'], { cwd: repo, env: MERGE_ENV });
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain(`trunk: trunk at ${short(past)}`);
        expect(r.stdout).toContain('trunk commits: 1');
        rmSync(join(repo, MERGE_FILE));
        const x = laneRun(l, ['merge', 'feat', '--into', 'trunk', '--at', 'trunk~1', '--launch'], { cwd: repo, env: MERGE_ENV });
        expect(x.status).toBe(2);
        expect(x.stderr).toContain('--at');
        expect(calls(l)).toEqual([]);
    });

    test('kills "trunk-into renders the wrong side", "both-sides code refused in the mirror": run from the branch worktree, the mirror prompt merges the trunk tip into the branch', () => {
        const { l, repo, trunkTip, branchTip } = repoLab({ bothCode: true });
        const wt = join(dirname(repo), 'wt-feat');
        gitIn(l, repo, ['worktree', 'add', '-q', wt, 'feat']);
        const r = laneRun(l, ['merge', '--trunk-into', 'feat', '--from', 'trunk', '--launch'], { cwd: wt, env: MERGE_ENV });
        expect(r.status, r.stderr).toBe(0);
        const text = readFileSync(join(wt, TAKE_FILE), 'utf8');
        expect(text).toContain(`Worktree: \`${wt}\`, branch \`feat\``);
        expect(text).toContain(`the explicit sha \`${short(trunkTip)}\` into \`feat\``);
        expect(text).toContain(`its parent \`${short(branchTip)}\``);
        expect(text).toMatch(/read every file changed on both sides[^\n]*src\/a\.ts/);
        expect(text).not.toContain('{{');
        expect(gitIn(l, wt, ['log', '-1', '--format=%s'])).toBe(`docs: add prompt ${NEW_ID}, merge trunk into feat`);
        expect(existsSync(join(repo, TAKE_FILE))).toBe(false);
        expect(waitFor(join(l.lanes, NEW_ID, 'exit.txt'))).toBe(true);
        expect(calls(l)[0].cwd).toBe(wt);
    });

    test('kills "launch over a code conflict": in the mirror a conflict in a code file refuses the launch, with the finding in the prompt', () => {
        const { l, repo } = repoLab({ conflict: true });
        const wt = join(dirname(repo), 'wt-feat');
        gitIn(l, repo, ['worktree', 'add', '-q', wt, 'feat']);
        const before = gitIn(l, wt, ['rev-parse', 'HEAD']);
        const r = laneRun(l, ['merge', '--trunk-into', 'feat', '--from', 'trunk', '--launch'], { cwd: wt, env: MERGE_ENV });
        expect(r.status).toBe(2);
        expect(r.stdout).toContain('conflicts: 1: src/a.ts');
        expect(r.stderr).toContain('src/a.ts');
        expect(readFileSync(join(wt, TAKE_FILE), 'utf8')).toMatch(/\*\*Findings\.\*\*[\s\S]*src\/a\.ts[\s\S]*## COME/);
        expect(gitIn(l, wt, ['rev-parse', 'HEAD'])).toBe(before);
        expect(calls(l)).toEqual([]);
    });
});

// ── the prompt path ──────────────────────────────────────────────────────────

describe('lane-run start, the prompt path', () => {
    test('kills "the caller\'s cwd not tried first": a relative path that exists from the caller\'s directory is read there, the worktree copy notwithstanding', () => {
        const l = lab();
        writeFileSync(join(l.home, 'prompt.md'), PROMPT.replace('Do the thing.', 'The copy in the caller\'s directory.'));
        const r = laneRun(l, ['start', l.worktree, 'prompt.md'], { cwd: l.home });
        expect(r.status, r.stderr).toBe(0);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        expect(calls(l)[0].stdin).toContain('The copy in the caller\'s directory.');
        expect(readFileSync(join(laneDir(l), 'prompt.txt'), 'utf8').trim()).toBe(join(l.home, 'prompt.md'));
    });

    test('kills "the worktree fallback dropped": a relative path absent from the caller\'s directory is read from the worktree', () => {
        const l = lab();
        const r = laneRun(l, ['start', l.worktree, 'prompt.md'], { cwd: l.state });
        expect(r.status, r.stderr).toBe(0);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        expect(calls(l)[0].stdin).toContain('Do the thing.');
        expect(readFileSync(join(laneDir(l), 'prompt.txt'), 'utf8').trim()).toBe(join(l.worktree, 'prompt.md'));
    });

    test('kills "a refusal naming one path": a path found in neither place is refused, naming both', () => {
        const l = lab();
        const r = laneRun(l, ['start', l.worktree, 'docs/prompts/none.md'], { cwd: l.state });
        expect(r.status).toBe(2);
        expect(r.stderr).toContain(join(l.state, 'docs/prompts/none.md'));
        expect(r.stderr).toContain(join(l.worktree, 'docs/prompts/none.md'));
        expect(calls(l)).toEqual([]);
    });
});

// ── the Outcome line and status --all ────────────────────────────────────────

/** A lane folder written by hand: exited with an exit code, or running on a live pid; its log holds the given assistant texts. */
function fakeLane(l: Lab, id: string, o: { texts?: string[]; running?: boolean; startedMsAgo?: number }) {
    const dir = laneDir(l, id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'log.jsonl'), (o.texts ?? []).map(assistant).join('\n') + '\n');
    writeFileSync(join(dir, 'started.txt'), String(Date.now() - (o.startedMsAgo ?? 60000)) + '\n');
    writeFileSync(join(dir, 'pid.txt'), String(o.running ? process.pid : 999999) + '\n');
    if (!o.running) writeFileSync(join(dir, 'exit.txt'), '0\n');
}

describe('lane-run status, the Outcome line', () => {
    test('kills "a suffix after the word not parsed": `Outcome: done · <shas>` is the outcome', () => {
        const l = lab();
        fakeLane(l, ID, { texts: ['Closing report.\nOutcome: done · fbd9064c9, d78f1981b'] });
        const r = laneRun(l, ['status', ID]);
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain('outcome: Outcome: done · fbd9064c9, d78f1981b');
    });

    test('kills "an unmatched line reported as none", "an earlier line wins", "a word prefix accepted": the last Outcome line, unmatched, is printed as unparsed', () => {
        const l = lab();
        fakeLane(l, ID, { texts: ['Phase 1.\nOutcome: done', 'Phase 2.\nOutcome: doneish'] });
        const r = laneRun(l, ['status', ID]);
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain('outcome: unparsed: Outcome: doneish');
    });
});

describe('lane-run status --all', () => {
    test('kills "a lane missing", "not newest first", "non-lane folders listed", "the outcome word not parsed": one table of every lane', () => {
        const l = lab();
        fakeLane(l, 'P-2026-09-26-1640', { texts: ['Outcome: done · abc123'], startedMsAgo: 5 * 60000 });
        fakeLane(l, 'P-2026-09-27-0405', { texts: ['Outcome: finished'] });
        fakeLane(l, 'P-2026-09-27-1015', { running: true, startedMsAgo: 12 * 60000 });
        mkdirSync(join(l.lanes, '_msgs'));
        mkdirSync(join(l.lanes, 'probe-2026-09-27'));
        writeFileSync(join(l.lanes, 'start_0345.sh'), '');
        const r = laneRun(l, ['status', '--all']);
        expect(r.status, r.stderr).toBe(0);
        const rows = r.stdout.trimEnd().split('\n');
        expect(rows).toHaveLength(4);
        expect(rows[0].split(/\s+/)).toEqual(['id', 'state', 'outcome', 'elapsed']);
        expect(rows[1].split(/\s+/)).toEqual(['P-2026-09-27-1015', 'running', 'none', '12', 'min']);
        expect(rows[2].split(/\s+/)).toEqual(['P-2026-09-27-0405', 'exited', 'unparsed', '1', 'min']);
        expect(rows[3].split(/\s+/)).toEqual(['P-2026-09-26-1640', 'exited', 'done', '5', 'min']);
    });
});

// ── wait ─────────────────────────────────────────────────────────────────────

const ID2 = 'P-2026-09-26-1641';

/** Writes the file after ms, from a detached shell: the release of a FAKE_HOLD while spawnSync blocks. */
function releaseLater(file: string, ms: number) {
    spawn('/bin/sh', ['-c', `sleep ${ms / 1000}; : > "${file}"`], { detached: true, stdio: 'ignore' }).unref();
}

describe('lane-run wait', () => {
    test('kills "wait returns while the lane runs", "the status not printed": wait exits 0 once the session ends, with its status', () => {
        const l = lab();
        const hold = join(l.state, 'release');
        expect(laneRun(l, ['start', l.worktree, 'prompt.md'], { env: { FAKE_HOLD: hold } }).status).toBe(0);
        releaseLater(hold, 1000);
        const r = laneRun(l, ['wait', ID, '--max', '15']);
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain(`lane: ${ID}`);
        expect(r.stdout).toContain('state: exited');
        expect(r.stdout).toContain('exit: 0');
    });

    test('kills "no timeout", "timeout reported as done": a lane still running at the deadline exits 3', () => {
        const l = lab();
        const hold = join(l.state, 'release');
        expect(laneRun(l, ['start', l.worktree, 'prompt.md'], { env: { FAKE_HOLD: hold } }).status).toBe(0);
        const t0 = Date.now();
        const r = laneRun(l, ['wait', ID, '--max', '1']);
        writeFileSync(hold, '');
        expect(r.status).toBe(3);
        expect(r.stdout).toContain('timeout');
        expect(Date.now() - t0).toBeGreaterThanOrEqual(900);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
    });

    test('kills "the 170 s cap ignored": --max 500 is refused with the reason', () => {
        const l = lab();
        fakeLane(l, ID, {});
        const r = laneRun(l, ['wait', ID, '--max', '500']);
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('170');
    });

    test('kills "--any watches the first id only": wait --any exits 0 when the second lane ends, the first still running', () => {
        const l = lab();
        const holdA = join(l.state, 'releaseA');
        const holdB = join(l.state, 'releaseB');
        writeFileSync(join(l.worktree, 'prompt2.md'), PROMPT.replace(ID, ID2));
        expect(laneRun(l, ['start', l.worktree, 'prompt.md'], { env: { FAKE_HOLD: holdA } }).status).toBe(0);
        expect(laneRun(l, ['start', l.worktree, 'prompt2.md'], { env: { FAKE_HOLD: holdB } }).status).toBe(0);
        releaseLater(holdB, 1000);
        const r = laneRun(l, ['wait', '--any', `${ID},${ID2}`, '--max', '15']);
        writeFileSync(holdA, '');
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain(`lane: ${ID2}`);
        expect(r.stdout).not.toContain(`lane: ${ID}\n`);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
    });

    test('kills "an unknown lane waited on": a Prompt-ID with no lane folder exits 2', () => {
        const l = lab();
        const r = laneRun(l, ['wait', ID, '--max', '1']);
        expect(r.status).toBe(2);
    });
});

// ── probe ────────────────────────────────────────────────────────────────────

// A fake npx: `npx vite ... --port <n>` serves 200 on that port with the node
// that runs the suite (the child PATH starts with its directory), or exits at
// once with FAKE_VITE=dead; `npx tsx <file>` prints to both streams and exits
// with FAKE_PROBE_EXIT. Every call is recorded in npx.txt.
const FAKE_NPX = `#!/bin/sh
echo "npx $*" >> "$FAKE_STATE/npx.txt"
if [ "$1" = "vite" ]; then
  [ "$FAKE_VITE" = "dead" ] && exit 1
  port=""; prev=""
  for a in "$@"; do [ "$prev" = "--port" ] && port="$a"; prev="$a"; done
  exec node -e "require('http').createServer((q, s) => { s.writeHead(200); s.end('ok'); }).listen(Number(process.argv[1]), 'localhost')" "$port"
fi
if [ "$1" = "tsx" ]; then
  echo "probe ran: $2 url=$PROBE_URL"
  echo "a line on stderr" >&2
  exit \${FAKE_PROBE_EXIT:-0}
fi
exit 99
`;

function probeLab(): Lab & { probe: string } {
    const l = lab();
    writeFileSync(join(l.bin, 'npx'), FAKE_NPX);
    chmodSync(join(l.bin, 'npx'), 0o755);
    const probe = 'scripts/smoke/_tmp_probe_x.ts';
    mkdirSync(join(l.worktree, 'frontend', 'scripts', 'smoke'), { recursive: true });
    writeFileSync(join(l.worktree, 'frontend', probe), '// a probe\n');
    return { ...l, probe };
}

function freePort(): Promise<number> {
    return new Promise((res, rej) => {
        const s = createServer();
        s.once('error', rej);
        s.listen(0, 'localhost', () => {
            const a = s.address();
            s.close(() => res(typeof a === 'object' && a ? a.port : 0));
        });
    });
}

function listening(port: number): boolean {
    return spawnSync('/usr/sbin/lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN']).status === 0;
}

const npxCalls = (l: Lab) => (existsSync(join(l.state, 'npx.txt')) ? readFileSync(join(l.state, 'npx.txt'), 'utf8').trim().split('\n') : []);

describe('lane-run probe', () => {
    test('kills "the probe log not written", "the exit code lost", "no EXIT line", "no PROBE_URL", "vite left running": the probe runs against the served port and its code is lane-run\'s', async () => {
        const l = probeLab();
        const port = await freePort();
        const cfg = join(l.worktree, 'frontend', 'vite.probe.config.ts');
        writeFileSync(cfg, '// config\n');
        const r = laneRun(l, ['probe', l.worktree, l.probe, '--port', String(port), '--config', cfg, '--id', ID], { env: { FAKE_PROBE_EXIT: '5' } });
        expect(r.status, r.stderr).toBe(5);
        const log = readFileSync(join(laneDir(l), 'probe-_tmp_probe_x.log'), 'utf8');
        expect(log).toContain('server=200');
        expect(log).toContain(`probe ran: ${join(l.worktree, 'frontend', l.probe)} url=http://localhost:${port}/`);
        expect(log).toContain('a line on stderr');
        expect(log).toMatch(/\nEXIT=5\nend=\d{4}-\d{2}-\d{2}T/);
        expect(npxCalls(l)[0]).toBe(`npx vite --config ${cfg} --port ${port} --strictPort`);
        expect(listening(port)).toBe(false);
    });

    test('kills "the default config not generated", "no dated folder without --id": the config is written from the chat\'s shape and the log goes to probe-<date>', async () => {
        const l = probeLab();
        const port = await freePort();
        const r = laneRun(l, ['probe', l.worktree, l.probe, '--port', String(port)], { env: { LANE_RUN_NOW: NOW } });
        expect(r.status, r.stderr).toBe(0);
        const cfg = join(l.worktree, 'frontend', 'scripts', 'smoke', `_tmp_lane_vite_${port}.config.ts`);
        const text = readFileSync(cfg, 'utf8');
        expect(text).toContain("import base from '../../vite.config';");
        expect(text).toContain(`cacheDir: '/tmp/lane-vite-cache-${port}'`);
        expect(text).toContain(`server: { ...b.server, port: ${port}, strictPort: true }`);
        expect(npxCalls(l)[0]).toBe(`npx vite --config ${cfg} --port ${port} --strictPort`);
        expect(readFileSync(join(l.lanes, 'probe-2026-09-27', 'probe-_tmp_probe_x.log'), 'utf8')).toContain('EXIT=0');
        expect(listening(port)).toBe(false);
    });

    test('kills "3001 accepted": the port of the trunk\'s server is refused before anything runs', () => {
        const l = probeLab();
        const r = laneRun(l, ['probe', l.worktree, l.probe, '--port', '3001']);
        expect(r.status).toBe(2);
        // Not the busy-port refusal: 3001 may well be listening on this machine.
        expect(r.stderr).toContain('3001 is the trunk\'s dev server');
        expect(npxCalls(l)).toEqual([]);
    });

    test('kills "a busy port accepted": a port someone listens on is refused before anything runs', async () => {
        const l = probeLab();
        const port = await freePort();
        const busy: Server = createServer();
        await new Promise<void>((res) => busy.listen(port, 'localhost', () => res()));
        try {
            const r = laneRun(l, ['probe', l.worktree, l.probe, '--port', String(port)]);
            expect(r.status).toBe(2);
            expect(r.stderr).toContain('in use');
            expect(npxCalls(l)).toEqual([]);
        } finally {
            await new Promise<void>((res) => busy.close(() => res()));
        }
    });

    test('kills "a dead server waited on", "the probe run without a server": vite exiting before any 200 fails the probe at once', () => {
        const l = probeLab();
        const t0 = Date.now();
        const r = laneRun(l, ['probe', l.worktree, l.probe, '--port', '45999', '--id', ID], { env: { FAKE_VITE: 'dead' } });
        expect(r.status).toBe(1);
        expect(r.stderr).toContain('vite');
        expect(Date.now() - t0).toBeLessThan(10000);
        expect(npxCalls(l).some((c) => c.startsWith('npx tsx'))).toBe(false);
    });
});
