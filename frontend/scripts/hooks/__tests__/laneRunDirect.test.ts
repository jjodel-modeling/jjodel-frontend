import { describe, test, expect, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, chmodSync, realpathSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintEntry, splitLog } from '../../gates/log-tools.ts';

// lane-run.mjs merge --direct, go on a direct merge, and chain, run as child
// processes the way the chat runs them (P11), against a fake `claude` and a
// fake `npm` in temporary repositories. Apart from laneRun.test.ts because
// these fixtures carry a second worktree and the gates. A test name states the
// mutation of the script that turns it red (CLAUDE.md 5); the bench that
// established it is in the commit message.
//
// LANE_RUN points the suite at another copy of the script (the mutation bench).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.LANE_RUN ? resolve(process.env.LANE_RUN) : resolve(HERE, '..', '..', 'lane-run.mjs');

const SESSION = '467dcf71-a51c-4c15-a72b-c459bd6fa05c';
const NOW = '2026-09-27T10:40';
const NEW_ID = 'P-2026-09-27-1040';
const MERGE_FILE = 'docs/prompts/claude_2026-09-27_1040_prompt_merge_feat.md';
const TAKE_FILE = 'docs/prompts/claude_2026-09-27_1040_prompt_feat_take_trunk.md';
const GIT_ENV = {
    GIT_AUTHOR_NAME: 'Lane Test',
    GIT_AUTHOR_EMAIL: 'lane@test.invalid',
    GIT_COMMITTER_NAME: 'Lane Test',
    GIT_COMMITTER_EMAIL: 'lane@test.invalid',
    GIT_CONFIG_NOSYSTEM: '1',
};

// The fake claude records each call; a prompt whose Prompt-ID has a script or
// an events file in FAKE_DIR runs that script in its cwd and prints those events.
const FAKE_CLAUDE = `#!/bin/sh
input=$(cat)
{
  echo "--- call"
  echo "cwd=$(pwd -P)"
  for a in "$@"; do echo "arg=$a"; done
  echo "stdin=$(printf '%s' "$input" | tr '\\n' ' ')"
} >> "$FAKE_STATE/calls.txt"
id=$(printf '%s\\n' "$input" | sed -n 's/^Prompt-ID: \\(P-[0-9-]*\\).*$/\\1/p' | head -n 1)
echo '{"type":"system","subtype":"init","session_id":"'"$FAKE_SESSION"'"}'
if [ -n "$FAKE_DIR" ] && [ -f "$FAKE_DIR/$id.sh" ]; then sh "$FAKE_DIR/$id.sh" >> "$FAKE_STATE/scripts.txt" 2>&1; fi
if [ -n "$FAKE_DIR" ] && [ -f "$FAKE_DIR/$id.jsonl" ]; then cat "$FAKE_DIR/$id.jsonl"; fi
if [ -n "$FAKE_DIR" ] && [ -f "$FAKE_DIR/$id.hold" ]; then
  n=0
  while [ ! -f "$FAKE_DIR/$id.release" ] && [ $n -lt 300 ]; do sleep 0.1; n=$((n+1)); done
fi
exit \${FAKE_EXIT:-0}
`;

// The fake npm: `run typecheck` prints frontend/tsc-errors.txt (exit 2 when it
// holds a line); `run test` writes a vitest JSON report, one test per line
// starting `test(` of each test file (the files named, else every *.test.ts
// under the cwd), a file holding FAKE_IMPORT_FAIL red at import, one holding
// FAKE_FAILED_TEST with a failed test; any other script exits 0 unless named in
// FAKE_RED. Every call is recorded in npm.txt with its cwd.
const fakeNpm = () => `#!${process.execPath}
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
fs.appendFileSync(path.join(process.env.FAKE_STATE, 'npm.txt'), fs.realpathSync(process.cwd()) + ' ' + args.join(' ') + '\\n');
const red = (process.env.FAKE_RED || '').split(',').filter(Boolean);
if (args[0] !== 'run') process.exit(99);
const script = args[1];
if (script === 'typecheck') {
  const t = fs.existsSync('tsc-errors.txt') ? fs.readFileSync('tsc-errors.txt', 'utf8') : '';
  process.stdout.write(t);
  process.exit(t.trim() ? 2 : 0);
}
if (script === 'test') {
  const rest = args.slice(2).filter((a) => a !== '--');
  let out = null;
  const files = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--outputFile=')) out = a.slice('--outputFile='.length);
    else if (a === '--outputFile') out = rest[++i];
    else if (!a.startsWith('--')) files.push(a);
  }
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.name === 'node_modules' ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : /\\.test\\.tsx?$/.test(e.name) ? [path.join(d, e.name)] : []);
  const list = files.length ? files.filter((f) => fs.existsSync(f)).map((f) => fs.realpathSync(f)) : walk(fs.realpathSync(process.cwd()));
  const results = list.map((f) => {
    const t = fs.readFileSync(f, 'utf8');
    if (t.includes('FAKE_IMPORT_FAIL')) return { name: f, status: 'failed', message: 'window is not defined', assertionResults: [] };
    const n = (t.match(/^\\s*test\\(/gm) || []).length;
    const bad = t.includes('FAKE_FAILED_TEST');
    return { name: f, status: bad ? 'failed' : 'passed', message: '', assertionResults: Array.from({ length: n }, (_, i) => ({ title: 't' + i, status: bad && i === 0 ? 'failed' : 'passed' })) };
  });
  const total = results.reduce((s, r) => s + r.assertionResults.length, 0);
  const failed = results.reduce((s, r) => s + r.assertionResults.filter((a) => a.status === 'failed').length, 0);
  fs.writeFileSync(out, JSON.stringify({ numTotalTests: total, numFailedTests: failed, numPassedTests: total - failed, testResults: results }));
  process.exit(results.some((r) => r.status === 'failed') ? 1 : 0);
}
process.exit(red.includes(script) ? 1 : 0);
`;

const dirs: string[] = [];
afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

interface Lab {
    root: string;
    home: string;
    bin: string;
    state: string;
    fake: string;
    lanes: string;
    env: Record<string, string>;
}

function lab(): Lab {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'lane-direct-')));
    dirs.push(root);
    const home = join(root, 'home');
    const bin = join(root, 'bin');
    const state = join(root, 'state');
    const fake = join(root, 'fake');
    for (const d of [home, bin, state, fake]) mkdirSync(d, { recursive: true });
    writeFileSync(join(bin, 'claude'), FAKE_CLAUDE);
    writeFileSync(join(bin, 'npm'), fakeNpm());
    chmodSync(join(bin, 'claude'), 0o755);
    chmodSync(join(bin, 'npm'), 0o755);
    const env: Record<string, string> = {
        HOME: home,
        PATH: `${bin}:/usr/bin:/bin:/usr/sbin`,
        FAKE_STATE: state,
        FAKE_SESSION: SESSION,
        FAKE_DIR: fake,
        LANE_RUN_NPM: join(bin, 'npm'),
        LANE_RUN_NOW: NOW,
        ...GIT_ENV,
    };
    return { root, home, bin, state, fake, lanes: join(home, '.jjodel-lanes'), env };
}

function laneRun(l: Lab, args: string[], opts: { env?: Record<string, string>; cwd?: string } = {}) {
    const r = spawnSync(process.execPath, [SCRIPT, ...args], {
        cwd: opts.cwd ?? l.home,
        env: { ...l.env, ...opts.env },
        encoding: 'utf8',
        timeout: 30000,
    });
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

function gitIn(l: Lab, cwd: string, args: string[]): string {
    const r = spawnSync('git', args, { cwd, env: { ...l.env, ...GIT_ENV }, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
    return r.stdout.trim();
}

function gitOk(l: Lab, cwd: string, args: string[]): boolean {
    return spawnSync('git', args, { cwd, env: { ...l.env, ...GIT_ENV }, encoding: 'utf8' }).status === 0;
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

function waitFor(file: string, ms = 30000): boolean {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        if (existsSync(file)) return true;
        spawnSync('/bin/sleep', ['0.05']);
    }
    return existsSync(file);
}

function calls(l: Lab) {
    const file = join(l.state, 'calls.txt');
    if (!existsSync(file)) return [];
    return readFileSync(file, 'utf8').split('--- call\n').filter((c) => c.trim() !== '').map((c) => {
        const lines = c.trimEnd().split('\n');
        return {
            cwd: (lines.find((x) => x.startsWith('cwd=')) ?? '').slice(4),
            args: lines.filter((x) => x.startsWith('arg=')).map((x) => x.slice(4)),
            stdin: (lines.find((x) => x.startsWith('stdin=')) ?? '').slice(6),
        };
    });
}

const npmCalls = (l: Lab) => (existsSync(join(l.state, 'npm.txt')) ? readFileSync(join(l.state, 'npm.txt'), 'utf8').trim().split('\n') : []);
const laneDir = (l: Lab, id = NEW_ID) => join(l.lanes, id);
const result = (l: Lab, id = NEW_ID) => JSON.parse(readFileSync(join(laneDir(l, id), 'result.json'), 'utf8'));
const short = (sha: string) => sha.slice(0, 9);

// ── the repository ───────────────────────────────────────────────────────────

const DECISIONS = '# Decisions\n\n### Series X\n\n- **R-X-1** (2026-09-26): the base row.\n';
// The shape of the real inboxes: a blank line after the rule, each entry appended from its heading on.
const INBOX = '# log-inbox\n\n---\n\n';
const ENTRY = (heading: string, what: string) => `## 2026-09-27 — ${heading}\n**Prompt**: ${what}.\n`;
const OLD_ENTRY = ENTRY('fix: the old thing (P-2026-09-26-0900)', 'the old thing');
const FEAT_ENTRY = ENTRY('feat: the thing (P-2026-09-27-0100)', 'the feat');
const TRUNK_ENTRY = ENTRY('fix: the trunk thing (P-2026-09-27-0200)', 'the trunk fix');
const TEN = 'l1\nl2\nl3\nl4\nl5\nl6\nl7\nl8\nl9\nl10\n';
const BASE_TEST = "test('one', () => {});\ntest('two', () => {});\n";
const FEAT_TEST = "test('a', () => {});\ntest('b', () => {});\ntest('c', () => {});\n";
const TSC = 'src/api/data.ts(1,1): error TS2304: Cannot find name x.\n';
const lanePrompt = (id: string, status: string, title = 'a lane') =>
    `# Prompt: ${title}\n\nPrompt-ID: ${id}\nChat: C-2026-09-26-1702\nLane: fast\nStatus: ${status}\n\n## COSA\n\nThe feature.\n`;

interface RepoOpts {
    conflict?: boolean;
    bothCode?: boolean;
    docsConflict?: boolean;
    governance?: boolean;
    pending?: boolean;
    unionEdit?: boolean;
    probeClash?: boolean;
    tscError?: boolean;
    failedTest?: boolean;
    dirtyWorktree?: boolean;
    twoInboxes?: boolean;
}

interface RepoLab {
    l: Lab;
    repo: string;
    wt: string;
    base: string;
    branchTip: string;
    trunkTip: string;
}

/**
 * The trunk `trunk` checked out in repo/, the branch `feat` in wt-feat/. The
 * branch adds a prompt (flipped), code, a test file of three tests, a decision
 * row and an inbox entry; the trunk changes other code and adds a prompt. The
 * options add, on top: a line conflict in frontend/src/a.ts (conflict), an
 * auto-merged change to it on both sides (bothCode), a trunk row and a trunk
 * inbox entry (docsConflict), CLAUDE.md on the branch (governance), the branch
 * prompt not flipped (pending), an inbox the trunk folded while the branch
 * appended (unionEdit), R-X-2 added on both sides (probeClash), a type error on
 * the branch (tscError), a failing test on the branch (failedTest), a tracked
 * change in the branch worktree (dirtyWorktree), an entry in a second inbox on
 * the branch (twoInboxes).
 */
function repoLab(o: RepoOpts = {}): RepoLab {
    const l = lab();
    const repo = join(l.root, 'repo');
    mkdirSync(repo);
    gitIn(l, repo, ['init', '-q', '-b', 'trunk']);
    const baseInbox = o.unionEdit ? INBOX + OLD_ENTRY : INBOX;
    const base = commitFiles(l, repo, 'base', {
        'CLAUDE.md': '# rules\n',
        'docs/decisions.md': DECISIONS,
        'docs/log-inbox/lane.md': baseInbox,
        'frontend/src/a.ts': TEN,
        'frontend/src/c.ts': 'c\n',
        'frontend/src/__tests__/base.test.ts': BASE_TEST,
        'frontend/tsc-errors.txt': TSC,
    });
    gitIn(l, repo, ['checkout', '-q', '-b', 'feat']);
    commitFiles(l, repo, 'docs: add prompt P-2026-09-27-0100', {
        'docs/prompts/claude_2026-09-27_0100_prompt_feat.md': lanePrompt('P-2026-09-27-0100', o.pending ? 'da eseguire' : 'eseguito 2026-09-27 · lane feat · 1234567', 'the feat lane'),
    });
    const code: Record<string, string> = {
        'frontend/src/b.ts': 'b\n',
        'frontend/src/__tests__/feat.test.ts': o.failedTest ? FEAT_TEST + '// FAKE_FAILED_TEST\n' : FEAT_TEST,
    };
    if (o.conflict) code['frontend/src/a.ts'] = TEN.replace('l5', 'FEAT');
    if (o.bothCode) code['frontend/src/a.ts'] = TEN.replace('l1\n', 'FEAT1\n');
    if (o.tscError) code['frontend/tsc-errors.txt'] = TSC + 'src/b.ts(1,1): error TS2322: Type y.\n';
    commitFiles(l, repo, 'feat: the code', code);
    if (o.governance) commitFiles(l, repo, 'docs: a rule on the branch', { 'CLAUDE.md': '# rules\n\nA branch rule.\n' });
    const branchTip = commitFiles(l, repo, 'docs: the feat rows', {
        'docs/decisions.md': DECISIONS + '- **R-X-2** (2026-09-27): the feat row.\n',
        'docs/log-inbox/lane.md': baseInbox + FEAT_ENTRY,
        ...(o.twoInboxes ? { 'docs/log-inbox/other.md': INBOX + ENTRY('docs: the other front (P-2026-09-27-0100)', 'the other front') } : {}),
    });
    gitIn(l, repo, ['checkout', '-q', 'trunk']);
    const trunkCode: Record<string, string> = { 'frontend/src/c.ts': 'c2\n' };
    if (o.conflict) trunkCode['frontend/src/a.ts'] = TEN.replace('l5', 'TRUNK');
    if (o.bothCode) trunkCode['frontend/src/a.ts'] = TEN.replace('l10', 'TRUNK10');
    commitFiles(l, repo, 'fix: the trunk code', trunkCode);
    if (o.docsConflict) {
        commitFiles(l, repo, 'docs: a trunk row and entry', {
            'docs/decisions.md': DECISIONS + '- **R-X-3** (2026-09-27): the trunk row.\n',
            'docs/log-inbox/lane.md': baseInbox + TRUNK_ENTRY,
        });
    }
    if (o.probeClash) commitFiles(l, repo, 'docs: a trunk R-X-2', { 'docs/decisions.md': DECISIONS + '- **R-X-2** (2026-09-27): the trunk\'s own R-X-2.\n' });
    if (o.unionEdit) commitFiles(l, repo, 'docs: fold the inbox', { 'docs/log-inbox/lane.md': INBOX });
    const trunkTip = commitFiles(l, repo, 'docs: add prompt P-2026-09-27-0200', {
        'docs/prompts/claude_2026-09-27_0200_prompt_other.md': lanePrompt('P-2026-09-27-0200', 'da eseguire'),
    });
    const wt = join(l.root, 'wt-feat');
    gitIn(l, repo, ['worktree', 'add', '-q', wt, 'feat']);
    if (o.dirtyWorktree) writeFileSync(join(wt, 'frontend', 'src', 'b.ts'), 'b, edited in the worktree\n');
    return { l, repo, wt, base, branchTip, trunkTip };
}

/** A direct merge of feat into trunk from repo/, run to the end of its worker. */
function directMerge(r: RepoLab, env: Record<string, string> = {}, extra: string[] = []) {
    const out = laneRun(r.l, ['merge', 'feat', '--into', 'trunk', '--direct', ...extra], { cwd: r.repo, env });
    return out;
}

// ── merge --direct ───────────────────────────────────────────────────────────

describe('lane-run merge --direct', { timeout: 60000 }, () => {
    test('kills "no direct merge", "the prompt not committed first", "no rollback tag", "the worker in the foreground", "no synthetic Outcome": the worker merges, tags pre-<branch> and the lane folder reads hard-stop', () => {
        const r = repoLab();
        const out = directMerge(r);
        expect(out.status, out.stderr).toBe(0);
        expect(out.stdout).toContain('direct: preconditions hold');
        expect(out.stdout).toContain(`direct: worker started, lane folder ${laneDir(r.l)}`);
        expect(waitFor(join(laneDir(r.l), 'exit.txt'))).toBe(true);
        expect(readFileSync(join(laneDir(r.l), 'exit.txt'), 'utf8').trim()).toBe('0');
        const { l, repo } = r;
        expect(gitIn(l, repo, ['log', '-1', '--format=%s'])).toBe(`merge: feat into trunk (${NEW_ID})`);
        expect(gitIn(l, repo, ['rev-parse', 'HEAD^2'])).toBe(r.branchTip);
        expect(gitIn(l, repo, ['log', '-1', '--format=%s', 'HEAD^1'])).toBe(`docs: add prompt ${NEW_ID}, merge feat into trunk`);
        expect(gitIn(l, repo, ['show', '--name-only', '--format=', 'HEAD^1'])).toBe(MERGE_FILE);
        expect(gitIn(l, repo, ['rev-parse', 'HEAD^1^'])).toBe(r.trunkTip);
        expect(gitIn(l, repo, ['rev-parse', 'pre-feat'])).toBe(r.trunkTip);
        const body = gitIn(l, repo, ['log', '-1', '--format=%b']);
        expect(body).toContain('Model: none (lane-run merge --direct');
        expect(body).toContain('Rollback tag: pre-feat');
        expect(body).toContain('the feat lane');
        expect(body).not.toContain('Co-Authored-By');
        expect(readFileSync(join(repo, MERGE_FILE), 'utf8')).toContain('**Direct.**');
        const res = result(l);
        expect(res.outcome).toBe('hard-stop');
        expect(res.ok).toBe(true);
        expect(res.merge).toBe(gitIn(l, repo, ['rev-parse', 'HEAD']));
        expect(res.tag).toBe('pre-feat');
        expect(res.gates.map((g: { name: string }) => g.name)).toEqual(['typecheck', 'typecheck:scripts', 'vitest', 'build', 'check:docs', 'check:agents', 'check:scripts', 'check:addonly']);
        expect(res.gates.every((g: { ok: boolean }) => g.ok)).toBe(true);
        expect(gitIn(l, repo, ['status', '--porcelain'])).toBe('');
        const s = laneRun(l, ['status', NEW_ID]);
        expect(s.stdout).toContain('outcome: Outcome: hard-stop');
        expect(s.stdout).toContain('exit: 0');
        const w = laneRun(l, ['wait', NEW_ID, '--max', '5']);
        expect(w.stdout).toContain('outcome: Outcome: hard-stop');
        expect(calls(l)).toEqual([]);
    });

    test('kills "the incoming tests left out of the expectation", "the incoming tests run in the receiving tree": vitest expects the trunk tip\'s files plus the branch\'s, measured in the branch\'s worktree', () => {
        const r = repoLab();
        expect(directMerge(r).status).toBe(0);
        expect(waitFor(join(laneDir(r.l), 'exit.txt'))).toBe(true);
        const n = npmCalls(r.l);
        expect(n).toContain(`${join(r.wt, 'frontend')} run test -- src/__tests__/feat.test.ts --reporter=json --outputFile=${join(laneDir(r.l), 'vitest-incoming.json')} --passWithNoTests`);
        const v = result(r.l).gates.find((g: { name: string }) => g.name === 'vitest');
        expect(v.ok).toBe(true);
        expect(v.detail).toContain('5 tests in 2 files');
    });

    test('kills "union order branch first", "no blank line before a branch heading", "a blank line between rows", "the union not written": decisions.md and the inbox resolved by union, the trunk block first', () => {
        const r = repoLab({ docsConflict: true });
        const out = directMerge(r);
        expect(out.status, out.stderr).toBe(0);
        expect(out.stdout).toContain('conflicts: 2: docs/decisions.md, docs/log-inbox/lane.md');
        expect(waitFor(join(laneDir(r.l), 'exit.txt'))).toBe(true);
        expect(result(r.l).outcome).toBe('hard-stop');
        const { l, repo } = r;
        expect(gitIn(l, repo, ['show', 'HEAD:docs/decisions.md']) + '\n').toBe(
            DECISIONS + '- **R-X-3** (2026-09-27): the trunk row.\n' + '- **R-X-2** (2026-09-27): the feat row.\n');
        expect(gitIn(l, repo, ['show', 'HEAD:docs/log-inbox/lane.md']) + '\n').toBe(INBOX + TRUNK_ENTRY + '\n' + FEAT_ENTRY);
        expect(result(l).union).toEqual(['docs/decisions.md', 'docs/log-inbox/lane.md']);
        expect(gitIn(l, repo, ['log', '-1', '--format=%b'])).toContain('Union resolutions');
    });

    test('kills "a precondition dropped" (dirty tree, MERGE_HEAD, running lane, governance, both sides, open prompt, hard conflict, edit hunk, probe, branch worktree): each alone falls back, says why, and merges nothing', () => {
        const cases: Array<[string, RepoOpts, (r: RepoLab) => void, string]> = [
            ['dirty tree', {}, (r) => writeFileSync(join(r.repo, 'stray.txt'), 'x\n'), 'the tree is not clean'],
            ['MERGE_HEAD', {}, (r) => writeFileSync(join(r.repo, '.git', 'MERGE_HEAD'), r.branchTip + '\n'), 'a merge is in progress'],
            ['running lane', {}, (r) => {
                const d = join(r.l.lanes, 'P-2026-09-27-0900');
                mkdirSync(d, { recursive: true });
                writeFileSync(join(d, 'worktree.txt'), r.repo + '\n');
                writeFileSync(join(d, 'pid.txt'), String(process.pid) + '\n');
            }, 'P-2026-09-27-0900 is running in'],
            ['governance', { governance: true }, () => {}, 'governance files changed on the branch'],
            ['both sides', { bothCode: true }, () => {}, 'code files changed on both sides'],
            ['open prompt', { pending: true }, () => {}, 'Status is not eseguito'],
            ['hard conflict', { conflict: true }, () => {}, 'a conflict the union rule does not cover'],
            ['edit hunk', { unionEdit: true }, () => {}, 'a union hunk edits docs/log-inbox/lane.md'],
            ['probe', { probeClash: true }, () => {}, 'a probe does not hold'],
            ['branch worktree', { dirtyWorktree: true }, () => {}, 'the worktree of feat'],
        ];
        for (const [name, o, setup, reason] of cases) {
            const r = repoLab(o);
            setup(r);
            const out = directMerge(r);
            expect(out.status, name + ': ' + out.stderr).toBe(0);
            expect(out.stdout, name).toMatch(/direct: falls back: /);
            expect(out.stdout, name).toContain(reason);
            expect(gitIn(r.l, r.repo, ['rev-parse', 'HEAD']), name).toBe(r.trunkTip);
            expect(gitOk(r.l, r.repo, ['rev-parse', '--verify', '--quiet', 'refs/tags/pre-feat']), name).toBe(false);
            expect(existsSync(laneDir(r.l)), name).toBe(false);
            expect(readFileSync(join(r.l.lanes, 'pending', basename(MERGE_FILE)), 'utf8'), name).toContain('`lane-run merge --direct` fell back');
        }
    }, 60000);

    test('kills "--launch ignored on a fallback": a direct merge that falls back with --launch starts the session as before', () => {
        const r = repoLab({ unionEdit: true });
        const out = directMerge(r, {}, ['--launch']);
        expect(out.status, out.stderr).toBe(0);
        expect(out.stdout).toContain('direct: falls back');
        expect(out.stdout).toContain(`session: ${SESSION}`);
        expect(waitFor(join(laneDir(r.l), 'exit.txt'))).toBe(true);
        expect(existsSync(join(laneDir(r.l), 'result.json'))).toBe(false);
        expect(calls(r.l)).toHaveLength(1);
        expect(gitIn(r.l, r.repo, ['log', '-1', '--format=%s'])).toBe(`docs: add prompt ${NEW_ID}, merge feat into trunk`);
    });

    test('kills "a red gate reported green", "a red gate undoes the merge": the build red stops with blocked, the merge commit stays', () => {
        const r = repoLab();
        expect(directMerge(r, { FAKE_RED: 'build' }).status).toBe(0);
        expect(waitFor(join(laneDir(r.l), 'exit.txt'))).toBe(true);
        expect(readFileSync(join(laneDir(r.l), 'exit.txt'), 'utf8').trim()).toBe('1');
        const res = result(r.l);
        expect(res.outcome).toBe('blocked');
        expect(res.gates.find((g: { name: string }) => g.name === 'build').ok).toBe(false);
        expect(res.gates.find((g: { name: string }) => g.name === 'check:scripts').ok).toBe(true);
        expect(gitIn(r.l, r.repo, ['log', '-1', '--format=%s'])).toBe(`merge: feat into trunk (${NEW_ID})`);
        expect(laneRun(r.l, ['status', NEW_ID]).stdout).toContain('outcome: Outcome: blocked');
    });

    test('kills "check:addonly ignored", "the merge commit kept on an addonly violation", "a second rollback path invented": check:addonly red resets the trunk to its pre-merge tip, unlike every other gate', () => {
        const r = repoLab();
        expect(directMerge(r, { FAKE_RED: 'check:addonly' }).status).toBe(0);
        expect(waitFor(join(laneDir(r.l), 'exit.txt'))).toBe(true);
        expect(readFileSync(join(laneDir(r.l), 'exit.txt'), 'utf8').trim()).toBe('1');
        const res = result(r.l);
        expect(res.outcome).toBe('blocked');
        expect(res.merge).toBe(null);
        expect(res.gates.find((g: { name: string }) => g.name === 'check:addonly').ok).toBe(false);
        expect(res.gates.find((g: { name: string }) => g.name === 'build').ok).toBe(true);
        expect(res.reason).toContain('reset');
        expect(res.reason).toContain(r.trunkTip);
        const { l, repo } = r;
        // The reset lands on the SAME tip the rollback tag already recorded (RC-31): no
        // second rollback mechanism, and the prompt-file commit is undone with it.
        expect(gitIn(l, repo, ['rev-parse', 'HEAD'])).toBe(r.trunkTip);
        expect(gitIn(l, repo, ['rev-parse', 'pre-feat'])).toBe(r.trunkTip);
        expect(existsSync(join(repo, MERGE_FILE))).toBe(false);
        expect(gitIn(l, repo, ['status', '--porcelain'])).toBe('');
        expect(laneRun(l, ['status', NEW_ID]).stdout).toContain('outcome: Outcome: blocked');
    });

    test('kills "typecheck judged by its exit code": a new type error on the branch is red although tsc exits 2 on both sides', () => {
        const r = repoLab({ tscError: true });
        expect(directMerge(r).status).toBe(0);
        expect(waitFor(join(laneDir(r.l), 'exit.txt'))).toBe(true);
        const res = result(r.l);
        expect(res.outcome).toBe('blocked');
        const t = res.gates.find((g: { name: string }) => g.name === 'typecheck');
        expect(t.ok).toBe(false);
        expect(t.detail).toContain('src/b.ts TS2322');
    });

    test('kills "failed tests not counted": a failing test on the branch turns vitest red', () => {
        const r = repoLab({ failedTest: true });
        expect(directMerge(r).status).toBe(0);
        expect(waitFor(join(laneDir(r.l), 'exit.txt'))).toBe(true);
        const v = result(r.l).gates.find((g: { name: string }) => g.name === 'vitest');
        expect(v.ok).toBe(false);
        expect(v.detail).toContain('1 failed');
    });

    test('kills "trunk-into refuses --direct", "trunk-into tags the trunk", "trunk-into merges the wrong side": from the branch worktree the trunk tip is merged into the branch, no tag', () => {
        const r = repoLab();
        const out = laneRun(r.l, ['merge', '--trunk-into', 'feat', '--from', 'trunk', '--direct'], { cwd: r.wt });
        expect(out.status, out.stderr).toBe(0);
        expect(out.stdout).toContain('direct: preconditions hold');
        expect(waitFor(join(laneDir(r.l), 'exit.txt'))).toBe(true);
        expect(result(r.l).outcome).toBe('hard-stop');
        expect(gitIn(r.l, r.wt, ['log', '-1', '--format=%s'])).toBe(`merge: feat takes trunk (${NEW_ID})`);
        expect(gitIn(r.l, r.wt, ['rev-parse', 'HEAD^2'])).toBe(r.trunkTip);
        expect(gitIn(r.l, r.wt, ['log', '-1', '--format=%s', 'HEAD^1'])).toBe(`docs: add prompt ${NEW_ID}, merge trunk into feat`);
        expect(existsSync(join(r.wt, TAKE_FILE))).toBe(true);
        expect(gitOk(r.l, r.repo, ['rev-parse', '--verify', '--quiet', 'refs/tags/pre-feat'])).toBe(false);
        expect(gitIn(r.l, r.repo, ['rev-parse', 'HEAD'])).toBe(r.trunkTip);
    });

    test('kills "code on both sides allowed in trunk-into": the step no script can read falls back', () => {
        const r = repoLab({ bothCode: true });
        const out = laneRun(r.l, ['merge', '--trunk-into', 'feat', '--from', 'trunk', '--direct'], { cwd: r.wt });
        expect(out.status, out.stderr).toBe(0);
        expect(out.stdout).toContain('direct: falls back');
        expect(out.stdout).toContain('code files changed on both sides');
        expect(gitIn(r.l, r.wt, ['rev-parse', 'HEAD'])).toBe(r.branchTip);
    });
});

// ── go on a direct merge, and the templates' closure ─────────────────────────

const SMOKE = 'Smoke on 3001 by the chat: the feat panel renders, 4/4.';
const FLIP = (sha: string) => `Status: eseguito 2026-09-27 · lane merge · ${short(sha)} · verifica visiva passata 2026-09-27 (${SMOKE})`;

/** A direct merge of feat into trunk run to the end of its worker, green. */
function merged(o: RepoOpts = {}): RepoLab {
    const r = repoLab(o);
    const out = directMerge(r);
    if (out.status !== 0 || !waitFor(join(laneDir(r.l), 'exit.txt'))) throw new Error('direct merge did not end: ' + out.stdout + out.stderr);
    return r;
}

/** The last entry of an inbox file, as the gate splits it. */
function lastEntry(text: string) {
    const { entries } = splitLog(text);
    return entries[entries.length - 1];
}

describe('lane-run go on a direct merge', { timeout: 60000 }, () => {
    test('kills "two closure commits", "the Status not flipped", "the entry not written", "the entry in the wrong inbox", "the entry outside the P9 lint", "no synthetic done", "go resumes a session": one docs commit flips the Status and appends the P9 entry', () => {
        const r = merged();
        const { l, repo } = r;
        const mergeSha = gitIn(l, repo, ['rev-parse', 'HEAD']);
        const g = laneRun(l, ['go', NEW_ID, '--smoke', SMOKE]);
        expect(g.status, g.stderr).toBe(0);
        expect(gitIn(l, repo, ['rev-parse', 'HEAD^'])).toBe(mergeSha);
        expect(gitIn(l, repo, ['log', '-1', '--format=%s'])).toBe(`docs: Status flip and log entry for the feat merge (${NEW_ID})`);
        expect(gitIn(l, repo, ['log', '-1', '--format=%b'])).toContain('Model: none (lane-run go, direct merge');
        expect(gitIn(l, repo, ['show', '--name-only', '--format=', 'HEAD']).split('\n').sort()).toEqual(['docs/log-inbox/lane.md', MERGE_FILE]);
        const prompt = readFileSync(join(repo, MERGE_FILE), 'utf8');
        expect(prompt.split('\n').filter((x) => x.startsWith('Status:'))).toEqual([FLIP(mergeSha)]);
        const inbox = readFileSync(join(repo, 'docs/log-inbox/lane.md'), 'utf8');
        const e = lastEntry(inbox);
        expect(e.heading).toBe(`## 2026-09-27 — merge: feat into trunk (${NEW_ID})`);
        expect(lintEntry(e, new Set()).findings).toEqual([]);
        expect(e.text).toContain(`**Smoke visivo**: passato — chat, unattended: ${SMOKE}`);
        expect(e.text).toContain('**Prompt document name**: 2026-09-27 10:40');
        expect(e.text).toContain(`merge \`${short(mergeSha)}\``);
        expect(inbox.startsWith(INBOX + FEAT_ENTRY + '\n## 2026-09-27 — merge:')).toBe(true);
        expect(gitIn(l, repo, ['status', '--porcelain'])).toBe('');
        expect(result(l).closure).toBe(gitIn(l, repo, ['rev-parse', 'HEAD']));
        expect(laneRun(l, ['status', NEW_ID]).stdout).toContain('outcome: Outcome: done');
        expect(calls(l)).toEqual([]);
    });

    test('kills "go over a blocked merge", "go twice", "--step taken on a direct lane": each is refused and commits nothing', () => {
        const r = repoLab();
        expect(directMerge(r, { FAKE_RED: 'build' }).status).toBe(0);
        expect(waitFor(join(laneDir(r.l), 'exit.txt'))).toBe(true);
        const head = gitIn(r.l, r.repo, ['rev-parse', 'HEAD']);
        const b = laneRun(r.l, ['go', NEW_ID, '--smoke', SMOKE]);
        expect(b.status).toBe(2);
        expect(b.stderr).toContain('blocked');
        expect(gitIn(r.l, r.repo, ['rev-parse', 'HEAD'])).toBe(head);
        const m = merged();
        expect(laneRun(m.l, ['go', NEW_ID, '--smoke', SMOKE, '--step', '2']).status).toBe(2);
        expect(laneRun(m.l, ['go', NEW_ID, '--smoke', SMOKE]).status).toBe(0);
        const closed = gitIn(m.l, m.repo, ['rev-parse', 'HEAD']);
        const again = laneRun(m.l, ['go', NEW_ID, '--smoke', SMOKE]);
        expect(again.status).toBe(2);
        expect(again.stderr).toContain('already closed');
        expect(gitIn(m.l, m.repo, ['rev-parse', 'HEAD'])).toBe(closed);
        expect(calls(m.l)).toEqual([]);
    });

    test('kills "an inbox guessed among two", "--front ignored": a branch that writes two inboxes needs --front, which names the file', () => {
        const r = merged({ twoInboxes: true });
        const g = laneRun(r.l, ['go', NEW_ID, '--smoke', SMOKE]);
        expect(g.status).toBe(2);
        expect(g.stderr).toContain('--front');
        const f = laneRun(r.l, ['go', NEW_ID, '--smoke', SMOKE, '--front', 'other']);
        expect(f.status, f.stderr).toBe(0);
        expect(lastEntry(readFileSync(join(r.repo, 'docs/log-inbox/other.md'), 'utf8')).heading).toBe(`## 2026-09-27 — merge: feat into trunk (${NEW_ID})`);
        expect(readFileSync(join(r.repo, 'docs/log-inbox/lane.md'), 'utf8')).not.toContain('merge: feat into trunk');
    });

    test('kills "the template still says no log entry", "the template names no inbox", "two closure commits in the template", "the take-trunk template still says no log entry": a rendered merge prompt asks for one docs commit with the Status flip and the entry in the branch\'s inbox', () => {
        const r = repoLab();
        const out = laneRun(r.l, ['merge', 'feat', '--into', 'trunk'], { cwd: r.repo });
        expect(out.status, out.stderr).toBe(0);
        const text = readFileSync(join(r.l.lanes, 'pending', basename(MERGE_FILE)), 'utf8');
        expect(text).not.toContain('No log entry');
        expect(text).toMatch(/one docs commit: this prompt's Status flipped to [^\n]* and the P9 entry of this merge appended at the end of `docs\/log-inbox\/lane\.md`, both in that commit/);
        const take = laneRun(r.l, ['merge', '--trunk-into', 'feat', '--from', 'trunk'], { cwd: r.wt, env: { LANE_RUN_NOW: '2026-09-27T10:41' } });
        expect(take.status, take.stderr).toBe(0);
        const t2 = readFileSync(join(r.l.lanes, 'pending', 'claude_2026-09-27_1041_prompt_feat_take_trunk.md'), 'utf8');
        expect(t2).not.toContain('No log entry');
        expect(t2).toMatch(/one docs commit: this prompt's Status flipped to [^\n]* and the P9 entry of this merge appended at the end of `docs\/log-inbox\/lane\.md`, both in that commit/);
    });
});

// ── chain ────────────────────────────────────────────────────────────────────

const A = 'P-2026-09-27-0301';
const B = 'P-2026-09-27-0302';
const CHAIN = 'chain-' + A;
const chainDir = (l: Lab) => join(l.lanes, CHAIN);
const chainJson = (l: Lab) => JSON.parse(readFileSync(join(chainDir(l), 'chain.json'), 'utf8'));
const outcomeEvents = (word: string) => JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Closing report.\nOutcome: ' + word }] } }) + '\n';

/** Two prompts parked in pending/, for the branch feat; each lane flips its own Status and commits it, then reports `done` unless told otherwise. */
function chainLab(o: RepoOpts = {}, outcomes: Record<string, string> = {}) {
    const r = repoLab(o);
    const pending = join(r.l.lanes, 'pending');
    mkdirSync(pending, { recursive: true });
    const files: Record<string, string> = {};
    for (const id of [A, B]) {
        const name = `claude_2026-09-27_${id.slice(-4)}_prompt_chain_${id.slice(-1)}.md`;
        writeFileSync(join(pending, name), lanePrompt(id, 'da eseguire', 'chained lane ' + id.slice(-1)));
        files[id] = join(pending, name);
        writeFileSync(join(r.l.fake, id + '.sh'),
            `sed -i '' 's/^Status: da eseguire$/Status: eseguito 2026-09-27 · lane feat · 1234567/' docs/prompts/${name} && ` +
            `git add -- docs/prompts/${name} && git commit -q -m 'docs: close ${id}' -m 'Model: fake' -- docs/prompts/${name}\n`);
        writeFileSync(join(r.l.fake, id + '.jsonl'), outcomeEvents(outcomes[id] ?? 'done'));
    }
    return { ...r, files };
}

function chainEnd(l: Lab, ms = 30000): boolean {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        if (existsSync(join(chainDir(l), 'chain.json')) && chainJson(l).state !== 'running') return true;
        spawnSync('/bin/sleep', ['0.1']);
    }
    return false;
}

describe('lane-run chain', { timeout: 60000 }, () => {
    test('kills "the second prompt started before the first is done", "the parked prompt not committed", "prompts run out of order", "the parked copy left in pending/": two prompts run in order, each committed at its launch', () => {
        const c = chainLab();
        writeFileSync(join(c.l.fake, A + '.hold'), '');
        const out = laneRun(c.l, ['chain', c.wt, c.files[A], c.files[B]]);
        expect(out.status, out.stderr).toBe(0);
        expect(out.stdout).toContain(`chain: ${CHAIN}`);
        expect(waitFor(join(c.l.lanes, A, 'session.txt'))).toBe(true);
        spawnSync('/bin/sleep', ['1']);
        expect(existsSync(join(c.l.lanes, B))).toBe(false);
        expect(chainJson(c.l).position).toBe(1);
        writeFileSync(join(c.l.fake, A + '.release'), '');
        expect(chainEnd(c.l)).toBe(true);
        const ch = chainJson(c.l);
        expect(ch.state).toBe('done');
        expect(ch.lanes.map((x: { id: string; state: string }) => x.id + ' ' + x.state)).toEqual([A + ' done', B + ' done']);
        const k = calls(c.l);
        expect(k).toHaveLength(2);
        expect(k[0].stdin).toContain(`Prompt-ID: ${A}`);
        expect(k[1].stdin).toContain(`Prompt-ID: ${B}`);
        expect(k[0].cwd).toBe(c.wt);
        const subjects = gitIn(c.l, c.wt, ['log', '--format=%s', `${c.branchTip}..HEAD`]).split('\n').reverse();
        expect(subjects).toEqual([`docs: add prompt ${A}, lane 1/2 of ${CHAIN}`, `docs: close ${A}`, `docs: add prompt ${B}, lane 2/2 of ${CHAIN}`, `docs: close ${B}`]);
        expect(existsSync(c.files[A])).toBe(false);
        expect(existsSync(c.files[B])).toBe(false);
    });

    test('kills "a hard-stop continues the chain", "a non-zero exit continues the chain", "no stoppedAt": the first lane\'s hard-stop, or its exit 1, stops the chain and leaves the rest queued and parked', () => {
        for (const [outcome, env, reason] of [['hard-stop', {}, 'Outcome: hard-stop'], ['done', { FAKE_EXIT: '1' }, 'exit 1']] as const) {
            const c = chainLab({}, { [A]: outcome });
            const out = laneRun(c.l, ['chain', c.wt, c.files[A], c.files[B]], { env });
            expect(out.status, out.stderr).toBe(0);
            expect(chainEnd(c.l)).toBe(true);
            const ch = chainJson(c.l);
            expect(ch.state).toBe('stopped');
            expect(ch.stoppedAt).toEqual({ id: A, reason });
            expect(ch.lanes[1].state).toBe('queued');
            expect(existsSync(join(c.l.lanes, B))).toBe(false);
            expect(existsSync(c.files[B])).toBe(true);
            expect(calls(c.l)).toHaveLength(1);
        }
    });

    test('kills "--stop ignored", "--stop kills the running lane": the chain stops after the running lane and starts nothing else', () => {
        const c = chainLab();
        writeFileSync(join(c.l.fake, A + '.hold'), '');
        expect(laneRun(c.l, ['chain', c.wt, c.files[A], c.files[B]]).status).toBe(0);
        expect(waitFor(join(c.l.lanes, A, 'session.txt'))).toBe(true);
        const s = laneRun(c.l, ['chain', '--stop', CHAIN]);
        expect(s.status, s.stderr).toBe(0);
        spawnSync('/bin/sleep', ['1']);
        expect(existsSync(join(c.l.lanes, A, 'exit.txt'))).toBe(false);
        writeFileSync(join(c.l.fake, A + '.release'), '');
        expect(chainEnd(c.l)).toBe(true);
        const ch = chainJson(c.l);
        expect(ch.state).toBe('stopped');
        expect(ch.stoppedAt).toEqual({ id: B, reason: '--stop' });
        expect(ch.lanes[0].state).toBe('done');
        expect(existsSync(join(c.l.lanes, B))).toBe(false);
    });

    test('kills "the limit ignored": a lane past --limit stops the chain as blocked, the lane left running', () => {
        const c = chainLab();
        writeFileSync(join(c.l.fake, A + '.hold'), '');
        expect(laneRun(c.l, ['chain', c.wt, c.files[A], c.files[B], '--limit', '0']).status).toBe(0);
        expect(chainEnd(c.l)).toBe(true);
        const ch = chainJson(c.l);
        expect(ch.state).toBe('stopped');
        expect(ch.stoppedAt).toEqual({ id: A, reason: 'limit 0 min' });
        expect(existsSync(join(c.l.lanes, A, 'exit.txt'))).toBe(false);
        writeFileSync(join(c.l.fake, A + '.release'), '');
        expect(waitFor(join(c.l.lanes, A, 'exit.txt'))).toBe(true);
    });

    test('kills "a chain shown as its lanes", "no position", "wait blind to a chain": status --all folds a running chain into one row with its position, wait returns when it ends', () => {
        const c = chainLab();
        writeFileSync(join(c.l.fake, A + '.hold'), '');
        expect(laneRun(c.l, ['chain', c.wt, c.files[A], c.files[B]]).status).toBe(0);
        expect(waitFor(join(c.l.lanes, A, 'session.txt'))).toBe(true);
        const all = laneRun(c.l, ['status', '--all']).stdout.trimEnd().split('\n');
        expect(all.map((x) => x.split(/\s+/)[0])).toEqual(['id', CHAIN]);
        expect(all[1].split(/\s+/).slice(0, 4)).toEqual([CHAIN, 'running', '1/2', A]);
        const one = laneRun(c.l, ['status', CHAIN]);
        expect(one.stdout).toContain('position: 1/2 ' + A);
        const t = laneRun(c.l, ['wait', CHAIN, '--max', '1']);
        expect(t.stdout).toBe(`timeout: ${CHAIN} still running after 1 s\n`);
        writeFileSync(join(c.l.fake, A + '.release'), '');
        const w = laneRun(c.l, ['wait', CHAIN, '--max', '30']);
        expect(w.status, w.stderr).toBe(0);
        expect(w.stdout).toContain('state: done');
    });

    test('kills "--merge-after ignored": a finished chain ends with a direct merge into the trunk from its worktree', () => {
        const c = chainLab();
        const out = laneRun(c.l, ['chain', c.wt, c.files[A], c.files[B], '--merge-after', '--into', 'trunk']);
        expect(out.status, out.stderr).toBe(0);
        expect(chainEnd(c.l)).toBe(true);
        const ch = chainJson(c.l);
        expect(ch.state).toBe('done');
        expect(ch.mergeAfter.state).toBe('direct');
        expect(ch.mergeAfter.promptId).toBe(NEW_ID);
        expect(waitFor(join(laneDir(c.l), 'exit.txt'))).toBe(true);
        expect(result(c.l).outcome).toBe('hard-stop');
        expect(gitIn(c.l, c.repo, ['log', '-1', '--format=%s'])).toBe(`merge: feat into trunk (${NEW_ID})`);
        expect(gitIn(c.l, c.repo, ['rev-parse', 'HEAD^2'])).toBe(gitIn(c.l, c.wt, ['rev-parse', 'HEAD']));
        expect(calls(c.l)).toHaveLength(2);
    });

    test('kills "a fallback launched at the end of a chain": --merge-after on a merge that cannot go direct parks it and says why', () => {
        // A fallback that --launch would start: an edit hunk in the inbox, no launch refusal.
        const c = chainLab({ unionEdit: true });
        expect(laneRun(c.l, ['chain', c.wt, c.files[A], c.files[B], '--merge-after', '--into', 'trunk']).status).toBe(0);
        expect(chainEnd(c.l)).toBe(true);
        const ch = chainJson(c.l);
        expect(ch.state).toBe('stopped');
        expect(ch.mergeAfter.state).toBe('fallback');
        expect(ch.mergeAfter.reason).toContain('a union hunk edits docs/log-inbox/lane.md');
        expect(existsSync(join(c.l.lanes, 'pending', basename(MERGE_FILE)))).toBe(true);
        expect(existsSync(laneDir(c.l))).toBe(false);
        expect(calls(c.l)).toHaveLength(2);
    });

    test('kills "a prompt without Prompt-ID chained", "the same Prompt-ID twice", "a started lane chained again": each is refused before anything runs', () => {
        const c = chainLab();
        writeFileSync(join(c.l.lanes, 'pending', 'bare.md'), '# Prompt: no id\n');
        const a = laneRun(c.l, ['chain', c.wt, c.files[A], join(c.l.lanes, 'pending', 'bare.md')]);
        expect(a.status).toBe(2);
        expect(a.stderr).toContain('Prompt-ID');
        const b = laneRun(c.l, ['chain', c.wt, c.files[A], c.files[A]]);
        expect(b.status).toBe(2);
        expect(b.stderr).toContain('chained twice');
        mkdirSync(join(c.l.lanes, B), { recursive: true });
        const d = laneRun(c.l, ['chain', c.wt, c.files[A], c.files[B]]);
        expect(d.status).toBe(2);
        expect(d.stderr).toContain(B);
        expect(existsSync(chainDir(c.l))).toBe(false);
        expect(calls(c.l)).toEqual([]);
    });
});

describe('lane-run chain, the model tier', { timeout: 60000 }, () => {
    test('kills "a chain lane without its tier", "the tier not in the chain\'s trailer", "--tier light on a chain not checked before it runs": each lane runs its own tier; --tier light is refused when a lane forces heavy', () => {
        const c = chainLab();
        // A: fast, the docs only (light); B: full (heavy).
        writeFileSync(c.files[A], lanePrompt(A, 'da eseguire', 'chained lane 1') + '\n## DOVE\n\n`docs/log-inbox/lane.md`\n');
        writeFileSync(c.files[B], lanePrompt(B, 'da eseguire', 'chained lane 2').replace('Lane: fast', 'Lane: full (more than 3 files)'));
        const env = { LANE_RUN_LIGHT_MODEL: 'claude-light-test' };
        const refused = laneRun(c.l, ['chain', c.wt, c.files[A], c.files[B], '--tier', 'light'], { env });
        expect(refused.status).toBe(2);
        expect(refused.stderr).toContain('forces heavy');
        expect(existsSync(chainDir(c.l))).toBe(false);
        const out = laneRun(c.l, ['chain', c.wt, c.files[A], c.files[B]], { env });
        expect(out.status, out.stderr).toBe(0);
        expect(chainEnd(c.l)).toBe(true);
        const ch = chainJson(c.l);
        expect(ch.state).toBe('done');
        expect(ch.lanes.map((x: { tier: string }) => x.tier)).toEqual(['light', 'heavy']);
        const k = calls(c.l);
        expect(k[0].args.slice(-2)).toEqual(['--model', 'claude-light-test']);
        expect(k[1].args).not.toContain('--model');
        expect(gitIn(c.l, c.wt, ['log', '-1', '--format=%b', `--grep=add prompt ${A}`])).toContain('lane tier light (Lane: fast, DOVE writes docs only)');
        expect(readFileSync(join(c.l.lanes, A, 'tier.txt'), 'utf8')).toContain('light (claude-light-test)');
    });
});
