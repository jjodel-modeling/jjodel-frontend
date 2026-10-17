import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runScript, bash } from './hookRunner.ts';

// Every case runs output-budget.mjs as a child process with the event on stdin (P11).
// A test name states the mutation of the script that turns it red (CLAUDE.md 5);
// the bench that established it is in the commit message.

let projectDir: string;

beforeAll(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'output-budget-'));
});

afterAll(() => {
    rmSync(projectDir, { recursive: true, force: true });
});

function budget(command: string) {
    return runScript('output-budget.mjs', bash(command), { CLAUDE_PROJECT_DIR: projectDir });
}

const denied = (command: string) => budget(command).decision === 'deny';

describe('output-budget: what it lets through', () => {
    test.each([
        'ls -la && git status',
        'cat src/a.ts | head -n 20',
        'sed -n 10,60p f.ts',
        'grep -rln foo src',
        'grep -rn foo src | head -n 30',
        'git show --stat HEAD',
        'git diff -- src/a.ts',
        'git log -n 10 --oneline',
        'node frontend/scripts/run-quiet.mjs build -- npm --prefix frontend run build',
    ])('the bounded form passes untouched: %s', (command) => {
        const r = budget(command);
        expect(r.status).toBe(0);
        expect(r.stdout).toBe('');
    });

    test('kills "a heredoc counts as a file": cat of a heredoc passes, as in a commit message', () => {
        expect(denied("cat <<'XEOF'\n| a | b |\n| c | d |\nXEOF")).toBe(false);
        expect(denied('git commit -m "$(cat <<\'XEOF\'\ndocs: x\n\nModel: y\nXEOF\n)" -- docs/a.md')).toBe(false);
        expect(denied("cat > notes.md <<'XEOF'\n| a | b |\nXEOF")).toBe(false);
    });

    test('kills "a pipe at the end of a line ends the pipeline": the bound on the next line counts', () => {
        expect(denied('cat src/a.ts |\n  head -n 5')).toBe(false);
    });

    test('a pipe inside quotes is data', () => {
        expect(denied('echo "cat src/a.ts | head -n 5"')).toBe(false);
        expect(denied("grep -n 'a|b' src/a.ts")).toBe(false);
    });
});

describe('output-budget: it fails open', () => {
    test.each([
        ['not json', 'not json'],
        ['empty stdin', ''],
        ['json without tool_input', '{"tool_name":"Bash"}'],
        ['a command that is not a string', JSON.stringify({ tool_input: { command: 42 } })],
    ])('a malformed payload is allowed: %s exits 0 with nothing on stdout', (_name, stdin) => {
        const r = runScript('output-budget.mjs', stdin, { CLAUDE_PROJECT_DIR: projectDir });
        expect(r.status).toBe(0);
        expect(r.stdout).toBe('');
    });

    test('kills "runHook bypassed": a parser error past the nesting limit ends quietly', () => {
        const r = budget('$(cat a.ts '.repeat(20) + ')'.repeat(20));
        expect(r.status).toBe(0);
        expect(r.stdout).toBe('');
        expect(r.stderr).toContain('failing open');
    });
});

describe('output-budget: a. cat, less, more on a file', () => {
    test('kills "pager rule removed": cat on a file is denied and the reason names Read', () => {
        const r = budget('cat src/a.ts');
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('output-budget');
        expect(r.reason).toContain('Read tool with offset and limit');
    });

    test.each(['less src/a.ts', 'more src/a.ts'])('kills "less and more not guarded": %s is denied', (command) => {
        expect(denied(command)).toBe(true);
    });

    test.each(['cat -n src/a.ts', 'cat -- src/a.ts'])('%s is denied', (command) => {
        expect(denied(command)).toBe(true);
    });

    test('kills "keywords not skipped": cat inside an if body is denied', () => {
        expect(denied('if true; then cat src/a.ts; fi')).toBe(true);
    });

    test('kills "shell payload not read": bash -c "cat src/a.ts" is denied', () => {
        expect(denied('bash -c "cat src/a.ts"')).toBe(true);
    });

    test('kills "ledger exemption removed": cat of the two values .claude/commands/lane.md reads passes', () => {
        expect(denied('cat ~/.jjodel-lanes/P-2026-10-17-1945/worktree.txt')).toBe(false);
        expect(denied('cat "$HOME/.jjodel-lanes/P-2026-10-17-1945/session.txt"')).toBe(false);
    });

    test('kills "ledger exemption too wide": the transcript, the merge message and a session.txt elsewhere are denied', () => {
        expect(denied('cat ~/.jjodel-lanes/P-2026-10-17-1945/log.jsonl')).toBe(true);
        expect(denied('cat ~/.jjodel-lanes/P-2026-10-17-1945/merge-message.txt')).toBe(true);
        expect(denied('cat notes/session.txt')).toBe(true);
    });
});

describe('output-budget: what bounds a command', () => {
    test('kills "head bound unchecked": head -n 200 is not a bound', () => {
        expect(denied('cat src/a.ts | head -n 200')).toBe(true);
        expect(denied('cat src/a.ts | head -n 80')).toBe(false);
    });

    test('kills "tail -f bounds": a followed tail is not a bound', () => {
        expect(denied('cat src/a.ts | tail -f')).toBe(true);
    });

    test.each(['cat src/a.ts | wc -l', 'cat src/a.ts | grep -c foo', 'cat src/a.ts | grep foo | head -n 5'])(
        'kills "bounding segment not recognized": %s passes',
        (command) => {
            expect(denied(command)).toBe(false);
        },
    );

    test('kills "any grep bounds": a plain grep after the pipe is not a bound', () => {
        expect(denied('cat src/a.ts | grep foo')).toBe(true);
    });

    test('kills "stdout redirect not read": output written to a file passes, stderr to a file does not', () => {
        expect(denied('cat a.ts b.ts > both.ts')).toBe(false);
        expect(denied('git show HEAD:frontend/package.json > /tmp/package.json')).toBe(false);
        expect(denied('cat src/a.ts 2> err.log')).toBe(true);
        expect(denied('cat src/a.ts 2>&1')).toBe(true);
    });

    test('kills "a bound on another command counts": a head in a later pipeline does not bound cat', () => {
        expect(denied('cat src/a.ts; echo x | head -n 1')).toBe(true);
    });
});

describe('output-budget: b. sed -n', () => {
    test('kills "sed width unchecked": 400 lines are denied and the count is in the reason', () => {
        const r = budget('sed -n 1,400p f.ts');
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('400 lines');
        expect(r.reason).toContain('Read tool');
    });

    test('kills "off by one at the threshold": 120 lines pass, 121 do not', () => {
        expect(denied('sed -n 1,120p f.ts')).toBe(false);
        expect(denied('sed -n 1,121p f.ts')).toBe(true);
    });

    test('kills "ranges not summed": two ranges of 70 lines are 140', () => {
        expect(denied("sed -n -e '1,70p' -e '100,169p' f.ts")).toBe(true);
    });

    test.each([
        ["sed -n '/^## /p' f.ts", 'without a line range'],
        ["sed -n '10,$p' f.ts", 'open range'],
    ])('kills "no range passes": %s is denied', (command, words) => {
        const r = budget(command);
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain(words);
    });

    test('kills "sed without -n guarded" and "in-place guarded": neither is in the rule', () => {
        expect(denied("sed 's/a/b/' f.ts")).toBe(false);
        expect(denied("sed -i '' -n '1,400p' f.ts")).toBe(false);
    });

    test('kills "q counted as unknown": a quit after the range is not counted, the range is', () => {
        expect(denied("sed -n '1,50p;50q' f.ts")).toBe(false);
        expect(denied("sed -n '1,400p;400q' f.ts")).toBe(true);
    });
});

describe('output-budget: c. recursive grep and rg', () => {
    test('kills "grep rule removed": grep -rn is denied and the reason names -l, -c and -m', () => {
        const r = budget('grep -rn foo src');
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('-l, -c or -m N');
    });

    test.each(['grep -R foo src', 'grep --recursive foo src', 'egrep -r foo src', 'rg foo src'])('%s is denied', (command) => {
        expect(denied(command)).toBe(true);
    });

    test.each(['grep -rc foo src', 'grep -rq foo src', 'grep -rnm 5 foo src', 'grep -rn --max-count=50 foo src', 'rg -l foo src'])(
        'kills "bounding flag not read": %s passes',
        (command) => {
            expect(denied(command)).toBe(false);
        },
    );

    test('kills "max count unchecked": -m 51 is not a bound', () => {
        expect(denied('grep -rn -m 51 foo src')).toBe(true);
    });

    test('kills "non-recursive grep guarded": grep on one file passes', () => {
        expect(denied('grep -n foo src/a.ts')).toBe(false);
    });

    test('kills "value letters not skipped": the value of -e is not read as flags', () => {
        expect(denied('grep -rn -e -l src')).toBe(true);
        expect(denied('grep -n -e -rl src/a.ts')).toBe(false);
    });
});

describe('output-budget: d. git show, git diff, git log', () => {
    test('kills "show rule removed": git show HEAD is denied and the reason names --stat', () => {
        const r = budget('git show HEAD');
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('--stat, --name-only or a path');
    });

    test('kills "blob not named": git show REV:PATH is denied with its own reason', () => {
        const r = budget('git show HEAD:frontend/package.json');
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('REV:PATH');
    });

    test.each(['git show --name-only HEAD', 'git show HEAD -- frontend/package.json', 'git -C . show -s HEAD', 'git show HEAD | head -n 40'])(
        'kills "show narrowing not read": %s passes',
        (command) => {
            expect(denied(command)).toBe(false);
        },
    );

    test('kills "diff rule removed": git diff and git diff --cached are denied', () => {
        expect(denied('git diff')).toBe(true);
        expect(denied('git diff --cached')).toBe(true);
    });

    test('kills "the whole tree counts as a path": git diff -- . is denied', () => {
        expect(denied('git diff -- .')).toBe(true);
    });

    test('kills "path without -- not read": git diff CLAUDE.md passes (the file is on disk)', () => {
        expect(denied('git diff CLAUDE.md')).toBe(false);
        expect(denied('git diff main..HEAD')).toBe(true);
    });

    test.each(['git diff --stat', 'git diff --name-only HEAD~3', 'git diff | grep -c x'])('git diff narrowed passes: %s', (command) => {
        expect(denied(command)).toBe(false);
    });

    test('kills "log rule removed": git log --oneline is denied and the reason names -n N', () => {
        const r = budget('git log --oneline');
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('-n N');
    });

    test('kills "log count unchecked": 30 commits pass, 31 and -50 do not', () => {
        expect(denied('git log -n 30')).toBe(false);
        expect(denied('git log -30 --oneline')).toBe(false);
        expect(denied('git log --max-count=31')).toBe(true);
        expect(denied('git log -50')).toBe(true);
    });
});

describe('output-budget: e. builds, tests and type-checks', () => {
    test('kills "runner rule removed": npm run build is denied and the reason names the runner', () => {
        const r = budget('npm run build');
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('run-quiet.mjs');
    });

    test.each([
        'npm test',
        'npm run test -- scripts/hooks',
        'npm run test:watch',
        'npm run typecheck',
        'npm --prefix frontend run build',
        'cd frontend && npx vitest run scripts/hooks',
        'npx tsc --noEmit',
        'npx playwright test',
        'npm exec vitest run',
    ])('kills "npm options not skipped" (the --prefix case): %s is denied', (command) => {
        expect(denied(command)).toBe(true);
    });

    test('kills "a bound lifts rule e": a build piped into tail is still denied', () => {
        expect(denied('npm run build 2>&1 | tail -n 5')).toBe(true);
    });

    test.each(['npm run check:docs', 'npm run gen:agents', 'npm install', 'node scripts/run-quiet.mjs tsc -- npx tsc --noEmit'])(
        'kills "every npm call denied": %s passes',
        (command) => {
            expect(denied(command)).toBe(false);
        },
    );
});

describe('output-budget: the escape hatch', () => {
    test('kills "override removed" and "override not logged": the marker passes and leaves one line', () => {
        const r = budget('cat big.log # allow-large-output');
        expect(r.status).toBe(0);
        expect(r.decision).toBeNull();
        const log = join(projectDir, '.agent-logs', 'guard-overrides.log');
        expect(existsSync(log)).toBe(true);
        const lines = readFileSync(log, 'utf8').trim().split('\n');
        expect(lines[lines.length - 1]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z cat big\.log # allow-large-output$/);
    });

    test('kills "command not truncated": the logged command stops at 300 characters, one line', () => {
        const long = 'cat ' + 'x'.repeat(400) + '\n# allow-large-output';
        expect(budget(long).decision).toBeNull();
        const lines = readFileSync(join(projectDir, '.agent-logs', 'guard-overrides.log'), 'utf8').trim().split('\n');
        const last = lines[lines.length - 1];
        expect(last.slice(last.indexOf(' ') + 1)).toHaveLength(300);
    });
});
