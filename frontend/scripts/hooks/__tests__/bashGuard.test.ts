import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runScript, bash, REPO } from './hookRunner.ts';

// Every case runs bash-guard.mjs as a child process with the event on stdin (P11).
// A test name states the mutation of the script that turns it red (CLAUDE.md 5);
// the bench that established it is in the commit message.

const TRAILER = 'Model: Anthropic Claude Sonnet 5';
const SUFFIX = ' (P-2026-09-21-1620)';
const NASTY_BODY = 'Body with `ticks`, $5, (parens), \'single\' and "double" quotes.';

function guard(command: string, cwd?: string) {
    return runScript('bash-guard.mjs', bash(command, cwd));
}

/** A commit the way the lanes write it: message from a heredoc, pathspec after `--`. */
function commit(subject: string, opts: { trailer?: boolean; paths?: string; body?: string } = {}) {
    const { trailer = true, paths = 'docs/a.md', body = NASTY_BODY } = opts;
    return [
        'git commit -q -m "$(cat <<\'XEOF\'',
        subject,
        '',
        body,
        ...(trailer ? ['', TRAILER] : []),
        'XEOF',
        `)" -- ${paths}`,
    ].join('\n');
}

const subjectOf = (n: number) => 'docs: ' + 'a'.repeat(n - 6);

describe('bash-guard: what it lets through', () => {
    test('a plain compound command is untouched', () => {
        const r = guard('echo A && echo B; echo C | cat');
        expect(r.status).toBe(0);
        expect(r.stdout).toBe('');
    });

    test('kills "heredoc body scanned as commands": a heredoc whose lines start with git stash and git commit', () => {
        const r = guard("cat <<'XEOF'\ngit stash pop\ngit commit -m x\nXEOF");
        expect(r.decision).toBeNull();
    });

    test.each([
        'echo "done; git stash pop"',
        "echo 'done; git stash pop'",
        "echo 'git commit -m x'",
        'git log --format="git commit -m x" -1',
        'grep -r "git stash" docs',
        'git log --grep=stash -1',
        'git status',
        'git commit-tree HEAD^{tree} -m x',
    ])('kills "quoted text scanned as a command": %s', (command) => {
        expect(guard(command).decision).toBeNull();
    });

    test('the lane-shaped commit with an awkward message passes', () => {
        const r = guard(`git add docs/a.md && ${commit(subjectOf(60) + SUFFIX)}`);
        expect(r.decision).toBeNull();
        expect(r.status).toBe(0);
    });
});

describe('bash-guard: it fails open', () => {
    test.each([
        ['not json', 'not json'],
        ['empty stdin', ''],
        ['json without tool_input', '{"tool_name":"Bash"}'],
        ['a command that is not a string', JSON.stringify({ tool_input: { command: 42 } })],
    ])('kills "an internal problem blocks": %s exits 0 with nothing on stdout', (_name, stdin) => {
        const r = runScript('bash-guard.mjs', stdin);
        expect(r.status).toBe(0);
        expect(r.stdout).toBe('');
    });

    test('kills "a parser error blocks": nesting past the limit ends quietly', () => {
        const command = '$(echo '.repeat(20) + 'x' + ')'.repeat(20);
        const r = guard(command);
        expect(r.status).toBe(0);
        expect(r.stdout).toBe('');
        expect(r.stderr).toContain('failing open');
    });
});

describe('bash-guard: git commit, the pathspec (CLAUDE.md 6.1, P13)', () => {
    test('kills "pathspec check removed": a commit with no pathspec is denied and the clause is cited', () => {
        const r = guard(`git commit -m "${subjectOf(40)}\n\n${TRAILER}"`);
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('P13');
        expect(r.reason).toContain('-- <paths>');
    });

    test('kills "a bare path counts as a pathspec": paths without the double dash are denied', () => {
        expect(guard(`git commit -m "${subjectOf(40)}\n\n${TRAILER}" docs/a.md`).decision).toBe('deny');
    });

    test('kills "an empty pathspec counts": a double dash with nothing after it is denied', () => {
        expect(guard(`git commit -m "${subjectOf(40)}\n\n${TRAILER}" --`).decision).toBe('deny');
    });

    test('kills "amend is exempt": an amend without a pathspec is denied', () => {
        expect(guard('git commit --amend --no-edit').decision).toBe('deny');
    });

    test('a pathspec after the double dash is enough when the message is not in the string', () => {
        expect(guard('git commit --amend --no-edit -- docs/a.md').decision).toBeNull();
        expect(guard('git commit -C HEAD -- docs/a.md').decision).toBeNull();
    });
});

describe('bash-guard: git commit, the Model trailer (P6)', () => {
    test('kills "trailer check removed": a heredoc message without the trailer is denied and P6 is cited', () => {
        const r = guard(commit(subjectOf(40), { trailer: false }));
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('P6');
    });

    test('kills "only the first -m is read": the trailer in a second -m counts', () => {
        expect(guard(`git commit -m "${subjectOf(40)}" -m "${TRAILER}" -- docs/a.md`).decision).toBeNull();
    });

    test('kills "the trailer needs no value": a Model line with nothing after it is denied', () => {
        expect(guard(`git commit -m "${subjectOf(40)}\n\nModel:" -- docs/a.md`).decision).toBe('deny');
    });

    test('kills "clustered -am not read": the message of -am is checked', () => {
        expect(guard(`git commit -am "${subjectOf(40)}" -- docs/a.md`).decision).toBe('deny');
    });

    test('kills "--message= not read": the long form is checked', () => {
        expect(guard(`git commit --message="${subjectOf(40)}" -- docs/a.md`).decision).toBe('deny');
        expect(guard(`git commit --message="${subjectOf(40)}\n\n${TRAILER}" -- docs/a.md`).decision).toBeNull();
    });

    test.each([
        ['a command substitution', 'git commit -m "$(date)" -- docs/a.md'],
        ['a variable', 'git commit -m "$SUBJECT" -- docs/a.md'],
        ['a backtick substitution', 'git commit -m "`date`" -- docs/a.md'],
    ])('kills "an unknown message is judged": %s is not in the string, so it is not checked', (_name, command) => {
        expect(guard(command).decision).toBeNull();
    });
});

describe('bash-guard: git commit, the subject (CLAUDE.md 6.2)', () => {
    test.each([
        ['72 characters', subjectOf(72), null],
        ['73 characters', subjectOf(73), 'deny'],
        ['72 characters and the prompt-ID suffix', subjectOf(72) + SUFFIX, null],
        ['73 characters and the prompt-ID suffix', subjectOf(73) + SUFFIX, 'deny'],
        ['a suffix on a short subject', subjectOf(30) + SUFFIX, null],
    ])('kills the off-by-one and the missing strip: %s', (_name, subject, expected) => {
        const r = guard(commit(subject));
        expect(r.decision).toBe(expected);
        if (expected) expect(r.reason).toContain('6.2');
    });

    test('kills "the suffix is stripped anywhere": a P-id in the middle of a long subject still counts', () => {
        expect(guard(commit(subjectOf(60) + ' (P-2026-09-21-1620) and more words to be over')).decision).toBe('deny');
    });

    test('the first line of the message is the subject, the body may be long', () => {
        const long = 'x'.repeat(200);
        expect(guard(commit(subjectOf(40), { body: long })).decision).toBeNull();
    });

    test('every violation is reported in one reason', () => {
        const r = guard(`git commit -m "${subjectOf(90)}"`);
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('P13');
        expect(r.reason).toContain('6.2');
        expect(r.reason).toContain('P6');
    });
});

describe('bash-guard: git commit, the message in a file (-F)', () => {
    let dir: string;
    beforeAll(() => {
        dir = realpathSync(mkdtempSync(join(tmpdir(), 'bash-guard-F-')));
        writeFileSync(join(dir, 'with.txt'), `${subjectOf(40)}\n\n${TRAILER}\n`);
        writeFileSync(join(dir, 'without.txt'), `${subjectOf(40)}\n\nno trailer here\n`);
    });
    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    test('kills "-F not read": a readable file with the trailer passes, one without is denied', () => {
        expect(guard('git commit -F with.txt -- docs/a.md', dir).decision).toBeNull();
        const r = guard('git commit -F without.txt -- docs/a.md', dir);
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('P6');
    });

    test('kills "an unreadable -F is judged": a missing file is not in the string, so it is not checked', () => {
        expect(guard('git commit -F nowhere.txt -- docs/a.md', dir).decision).toBeNull();
    });

    test('kills "-F - ignores the heredoc": the message read from stdin is checked', () => {
        const body = (t: string) => `git commit -F - -- docs/a.md <<'XEOF'\n${subjectOf(40)}\n\n${t}\nXEOF`;
        expect(guard(body(TRAILER)).decision).toBeNull();
        expect(guard(body('no trailer')).decision).toBe('deny');
    });
});

describe('bash-guard: git commit, docs and code apart (P13)', () => {
    test('kills "mix check removed": one pathspec over docs and code is denied and lists both sides', () => {
        const r = guard(commit(subjectOf(40), { paths: 'docs/a.md frontend/src/x.ts' }));
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('docs/a.md');
        expect(r.reason).toContain('frontend/src/x.ts');
    });

    test('kills "docs means docs/ only": CLAUDE.md and AGENTS.md are docs, at the root and in a subfolder', () => {
        const paths = 'docs/PROTOCOL.md CLAUDE.md AGENTS.md frontend/src/jjtl/AGENTS.md';
        expect(guard(commit(subjectOf(40), { paths })).decision).toBeNull();
    });

    test('kills "any Markdown is docs": a skill file is code, and sits with code', () => {
        const paths = '.claude/skills/log-entry/SKILL.md frontend/scripts/hooks/lib.mjs';
        expect(guard(commit(subjectOf(40), { paths })).decision).toBeNull();
        const mixed = 'docs/a.md .claude/skills/log-entry/SKILL.md';
        expect(guard(commit(subjectOf(40), { paths: mixed })).decision).toBe('deny');
    });

    test('kills "the directory itself is not docs": a pathspec of docs plus code is denied', () => {
        expect(guard(commit(subjectOf(40), { paths: 'docs frontend/src/x.ts' })).decision).toBe('deny');
    });

    test('kills "paths are read from the cwd": from frontend/ the pathspec is relative to the repository root', () => {
        const cwd = join(REPO, 'frontend');
        const mixed = commit(subjectOf(40), { paths: '../docs/PROTOCOL.md scripts/hooks/lib.mjs' });
        expect(guard(mixed, cwd).decision).toBe('deny');
        const docs = commit(subjectOf(40), { paths: '../docs/PROTOCOL.md ../CLAUDE.md' });
        expect(guard(docs, cwd).decision).toBeNull();
    });

    test('kills "an unknown path is judged": a pathspec with a variable is not classified', () => {
        expect(guard(commit(subjectOf(40), { paths: 'docs/a.md $EXTRA' })).decision).toBeNull();
    });

    test('two commits in one command: the second one is checked too', () => {
        const ok = commit(subjectOf(40));
        const bad = commit(subjectOf(40), { trailer: false });
        expect(guard(`${ok} && ${bad}`).decision).toBe('deny');
    });
});

describe('bash-guard: the commit is found behind a wrapper', () => {
    const bare = `git commit -m "${subjectOf(40)}" -- docs/a.md`;
    test.each([
        ['git with global options', `git -C . commit -m "${subjectOf(40)}" -- docs/a.md`],
        ['git with -c', `git -c user.name=x commit -m "${subjectOf(40)}" -- docs/a.md`],
        ['an absolute git path', `/usr/bin/git commit -m "${subjectOf(40)}" -- docs/a.md`],
        ['sh -c', `sh -c 'git commit -m "${subjectOf(40)}" -- docs/a.md'`],
        ['bash -lc', `bash -lc "git commit -m x -- docs/a.md"`],
        ['env with an assignment', `env GIT_AUTHOR_NAME=x ${bare}`],
        ['a leading assignment', `GIT_AUTHOR_NAME=x ${bare}`],
        ['eval', `eval '${bare}'`],
        ['a subshell', `(${bare})`],
        ['a command substitution', `echo $(${bare})`],
        ['time', `time ${bare}`],
    ])('kills "wrapper not resolved": %s, message without the trailer, is denied', (_name, command) => {
        expect(guard(command).decision).toBe('deny');
    });
});

describe('bash-guard: a merge, cherry-pick or revert in progress (RC-14, P14)', () => {
    let dir: string;
    beforeAll(() => {
        dir = realpathSync(mkdtempSync(join(tmpdir(), 'bash-guard-repo-')));
        execFileSync('git', ['init', '-q', dir]);
    });
    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    test('kills "in-progress exemption removed / always on": the same command is denied at rest and allowed mid-merge', () => {
        const command = 'git commit --no-edit';
        expect(guard(command, dir).decision).toBe('deny');
        for (const ref of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD']) {
            const marker = join(dir, '.git', ref);
            writeFileSync(marker, '0000000000000000000000000000000000000000\n');
            expect(guard(command, dir).decision, ref).toBeNull();
            rmSync(marker);
        }
        expect(guard(command, dir).decision).toBe('deny');
    });

    test('a directory that is not a repository is not exempt', () => {
        const plain = realpathSync(mkdtempSync(join(tmpdir(), 'bash-guard-plain-')));
        try {
            mkdirSync(join(plain, '.git'));
            writeFileSync(join(plain, '.git', 'MERGE_HEAD'), 'x\n');
            expect(guard('git commit --no-edit', plain).decision).toBe('deny');
        } finally {
            rmSync(plain, { recursive: true, force: true });
        }
    });
});

describe('bash-guard: git stash (RC-13-bis, P13)', () => {
    test.each([
        ['sh -c', "sh -c 'git stash list'"],
        ['git -C', 'git -C . stash list'],
        ['git -c', 'git -c core.pager=cat stash list'],
        ['an absolute git path', '/usr/bin/git stash list'],
        ['env', 'env git stash pop'],
        ['eval', 'eval "git stash"'],
        ['bash -c after a cd', 'bash -c "cd x && git stash"'],
        ['a subshell', '(git stash)'],
        ['a command substitution', 'echo $(git stash list)'],
        ['a leading assignment', 'GIT_DIR=x git stash list'],
        ['time', 'time git stash'],
        ['the plain form (the deny rule answers first)', 'git stash'],
        ['after &&', 'npm test && git stash pop'],
    ])('kills "stash form not found": %s is an ask that cites RC-13-bis', (_name, command) => {
        const r = guard(command);
        expect(r.decision).toBe('ask');
        expect(r.reason).toContain('RC-13-bis');
    });

    test('a deny wins over an ask in the same command', () => {
        const r = guard('git stash && git commit -m "x"');
        expect(r.decision).toBe('deny');
    });
});
