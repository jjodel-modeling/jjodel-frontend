import { describe, test, expect, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, chmodSync, realpathSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// B3a (P-2026-10-18-1205): lane-run's effort and model per launch (AM-1, AM-7),
// runs.jsonl, and the decisions and log entries start injects into the lane input
// (AM-5). lane-run.mjs runs as a child process against the fake `claude` of
// laneRun.test.ts (the same script, kept here because a test file is not imported);
// the two CLIs of the injection read a fixture register and log under the worktree,
// through their --root. A test name states the mutation that turns it red.

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.LANE_RUN ? resolve(process.env.LANE_RUN) : resolve(HERE, '..', '..', 'lane-run.mjs');

// Before FRONT_FROM: the front rule of start does not apply, a Front: line is only read by the injection.
const ID = 'P-2026-09-30-1000';
const SESSION = '0b7c2a10-5f43-4a7e-9b1e-3c2d1e0f9a88';
const LIGHT_CONSTANT = 'claude-sonnet-5-5';

const FAKE_CLAUDE = `#!/bin/sh
{
  echo "--- call"
  for a in "$@"; do echo "arg=$a"; done
  echo "stdin=$(cat | tr '\\n' ' ')"
} >> "$FAKE_STATE/calls.txt"
echo '{"type":"system","subtype":"init","session_id":"'"$FAKE_SESSION"'"}'
if [ -n "$FAKE_EVENTS" ]; then cat "$FAKE_EVENTS"; fi
exit \${FAKE_EXIT:-0}
`;

const REGISTER = [
    '# Decisions',
    '',
    '## Processo',
    '',
    '- **RC-16** (2026-08-05) — The pin. Original text of RC-16.',
    '- **RC-32** (2026-09-20) — Model by activity. Amends RC-16: light lanes run the light model.',
    '- **RC-45** (2026-10-10) — The draw, not cited by the prompt.',
    '',
    '## Serie R-SIM',
    '',
    '- **R-SIM-3** (2026-08-06) — A simulation rule.',
    '',
].join('\n');

const entry = (heading: string, body: string) => `## ${heading}\n**Prompt**: x\n**Notes**: ${body}\n\n`;
const LOG = '# Log\n\n' + entry('2026-10-01 — feat: the lane it depends on (P-2026-09-01-1000)', 'DEPENDS-BODY-MARKER') + entry('2026-09-29 — fix: unrelated (P-2026-09-29-0900)', 'UNRELATED-BODY');
const INBOX = '# log-inbox — lane «harness»\n\n---\n\n' + entry('2026-10-02 — docs: a harness entry (P-2026-10-02-0800)', 'INBOX-BODY');

const dirs: string[] = [];
afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

interface Lab {
    root: string;
    home: string;
    worktree: string;
    state: string;
    env: Record<string, string>;
}

function prompt(o: { lane?: string; dove?: string; extra?: string; body?: string } = {}): string {
    return `# Prompt: a lane\n\nPrompt-ID: ${ID}\nChat: C-2026-09-30-0900\nLane: ${o.lane ?? 'full'}\nStatus: da eseguire\n${o.extra ?? ''}\n## COSA\n\n${o.body ?? 'Do the thing.'}\n` +
        (o.dove ? `\n## DOVE\n\n${o.dove}\n` : '');
}

/** A HOME, a worktree holding prompt.md, the fake claude on the PATH; with `docs`, the fixture register and log. */
function lab(text: string, opts: { docs?: boolean; settings?: object; log?: string } = {}): Lab {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'lane-run-routing-')));
    dirs.push(root);
    const home = join(root, 'home');
    const worktree = join(root, 'worktree');
    const state = join(root, 'state');
    const bin = join(root, 'bin');
    for (const d of [home, worktree, state, bin]) mkdirSync(d, { recursive: true });
    writeFileSync(join(bin, 'claude'), FAKE_CLAUDE);
    chmodSync(join(bin, 'claude'), 0o755);
    writeFileSync(join(worktree, 'prompt.md'), text);
    if (opts.docs) {
        mkdirSync(join(worktree, 'docs', 'log-inbox'), { recursive: true });
        writeFileSync(join(worktree, 'docs', 'decisions.md'), REGISTER);
        writeFileSync(join(worktree, 'docs', 'claude-code-log.md'), opts.log ?? LOG);
        writeFileSync(join(worktree, 'docs', 'log-inbox', 'harness.md'), INBOX);
    }
    if (opts.settings) {
        mkdirSync(join(worktree, '.claude'), { recursive: true });
        writeFileSync(join(worktree, '.claude', 'settings.json'), JSON.stringify(opts.settings));
    }
    const env: Record<string, string> = { HOME: home, PATH: `${bin}:/usr/bin:/bin`, FAKE_STATE: state, FAKE_SESSION: SESSION };
    return { root, home, worktree, state, env };
}

function laneRun(l: Lab, args: string[], env: Record<string, string> = {}) {
    const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: l.home, env: { ...l.env, ...env }, encoding: 'utf8', timeout: 30000 });
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

function calls(l: Lab): string[][] {
    const file = join(l.state, 'calls.txt');
    if (!existsSync(file)) return [];
    return readFileSync(file, 'utf8').split('--- call\n').filter((c) => c.trim() !== '')
        .map((c) => c.split('\n').filter((x) => x.startsWith('arg=')).map((x) => x.slice(4)));
}

function waitFor(file: string, ms = 10000): boolean {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        if (existsSync(file)) return true;
        spawnSync('/bin/sleep', ['0.05']);
    }
    return existsSync(file);
}

const laneDir = (l: Lab) => join(l.home, '.jjodel-lanes', ID);
const runs = (l: Lab) => readFileSync(join(laneDir(l), 'runs.jsonl'), 'utf8').trim().split('\n').map((x) => JSON.parse(x));
const valueAfter = (args: string[], flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : null);

/** start, then the exit of its run. */
function started(l: Lab, extra: string[] = [], env: Record<string, string> = {}) {
    const r = laneRun(l, ['start', l.worktree, 'prompt.md', ...extra], env);
    expect(r.status, r.stderr).toBe(0);
    expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
    return r;
}

// ── effort (AM-7) ────────────────────────────────────────────────────────────

describe('lane-run: the effort of a launch (AM-7)', () => {
    const cases: Array<{ name: string; text: string; extra?: string[]; effort: string; why: string }> = [
        { name: 'plain heavy', text: prompt({ dove: '`frontend/scripts/lane-run.mjs`' }), effort: 'high', why: 'heavy' },
        { name: 'critical go-ahead', text: prompt({ dove: '`frontend/scripts/lane-run.mjs`' }), extra: ['--critical-zone-goahead', ID], effort: 'xhigh', why: '--critical-zone-goahead' },
        { name: 'a 3.2 file in DOVE', text: prompt({ dove: '`frontend/src/components/editor-v2/sync/syncState.ts`' }), effort: 'xhigh', why: 'DOVE names syncState.ts' },
        { name: 'visual bug', text: prompt({ lane: 'full (visual bug)', dove: '`frontend/src/x.tsx`' }), effort: 'xhigh', why: 'Lane: visual bug' },
        { name: 'light', text: prompt({ lane: 'fast', dove: '`docs/notes.md`' }), effort: 'high', why: 'light' },
        { name: '--effort override', text: prompt({ dove: '`frontend/src/components/editor-v2/sync/syncState.ts`' }), extra: ['--effort', 'medium'], effort: 'medium', why: '--effort' },
    ];

    test('kills "--effort not passed", "the go-ahead not xhigh", "a 3.2 file in DOVE not xhigh", "visual bug not read", "light at xhigh", "--effort ignored", "effort not printed", "effort not recorded": each case passes, prints and records its effort', () => {
        for (const c of cases) {
            const l = lab(c.text);
            const r = started(l, c.extra);
            const [args] = calls(l);
            expect(valueAfter(args, '--effort'), c.name).toBe(c.effort);
            expect(r.stdout, c.name).toContain(`effort: ${c.effort} (${c.why})`);
            expect(runs(l)[0].effort, c.name).toBe(c.effort);
        }
    });

    test('kills "any effort accepted": --effort outside low|medium|high|xhigh|max is refused before anything runs', () => {
        const l = lab(prompt());
        const r = laneRun(l, ['start', l.worktree, 'prompt.md', '--effort', 'huge']);
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('--effort takes low, medium, high, xhigh, max');
        expect(calls(l)).toEqual([]);
        expect(existsSync(laneDir(l))).toBe(false);
    });

    test('kills "resume drops the effort", "resume ignores --effort", "the earlier line left open": a resume passes the last run\'s effort or its own --effort, and completes the line before it', () => {
        const l = lab(prompt());
        started(l, ['--effort', 'max']);
        expect(laneRun(l, ['resume', ID, '--text', 'next']).status).toBe(0);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        expect(laneRun(l, ['resume', ID, '--text', 'again', '--effort', 'low']).status).toBe(0);
        expect(waitFor(join(laneDir(l), 'exit.txt'))).toBe(true);
        const c = calls(l);
        expect(c.map((a) => valueAfter(a, '--effort'))).toEqual(['max', 'max', 'low']);
        expect(c[1]).not.toContain('--model');
        const rows = runs(l);
        expect(rows.map((x) => x.kind)).toEqual(['start', 'resume', 'resume']);
        expect(rows.map((x) => x.effort)).toEqual(['max', 'max', 'low']);
        expect(rows[0].exit).toBe('0');
        expect(rows[1].exit).toBe('0');
        expect(rows[1].session).toBe(SESSION);
        expect(rows[2].requestedModel).toBe(null);
    });
});

// ── the model (AM-1) ─────────────────────────────────────────────────────────

describe('lane-run: the model of a launch (AM-1)', () => {
    test('kills "settings env not read", "constant not named": a light lane runs env.JJODEL_LIGHT_MODEL of the worktree settings when present, else the constant with one line', () => {
        const light = prompt({ lane: 'fast', dove: '`docs/notes.md`' });
        const a = lab(light, { settings: { model: 'claude-pin-test', env: { JJODEL_LIGHT_MODEL: 'claude-light-settings' } } });
        const ra = started(a);
        expect(calls(a)[0].slice(-2)).toEqual(['--model', 'claude-light-settings']);
        expect(ra.stdout).not.toContain('light model: constant');
        expect(runs(a)[0].requestedModel).toBe('claude-light-settings');

        const b = lab(light);
        const rb = started(b);
        expect(calls(b)[0].slice(-2)).toEqual(['--model', LIGHT_CONSTANT]);
        expect(rb.stdout.split('\n').filter((x) => x === 'light model: constant (settings env not set, B7)')).toHaveLength(1);
        expect(runs(b)[0].requestedModel).toBe(LIGHT_CONSTANT);
    });

    test('kills "the pin not recorded", "--model passed for heavy": a heavy lane passes no --model and records the settings pin as requested', () => {
        const l = lab(prompt(), { settings: { model: 'claude-pin-test', env: { JJODEL_LIGHT_MODEL: 'claude-light-settings' } } });
        const r = started(l);
        expect(calls(l)[0]).not.toContain('--model');
        expect(r.stdout).not.toContain('light model:');
        expect(runs(l)[0]).toMatchObject({ kind: 'start', tier: 'heavy', requestedModel: 'claude-pin-test', effort: 'high', session: null });
    });
});

// ── runs.jsonl and status ────────────────────────────────────────────────────

describe('lane-run: runs.jsonl and status (AM-7)', () => {
    test('kills "no line at launch", "status does not complete", "the effective model not read", "status rewrites a completed line": one line at launch, completed once by status', () => {
        const l = lab(prompt(), { settings: { model: 'claude-pin-test' } });
        const events = join(l.root, 'events.jsonl');
        writeFileSync(events, [
            JSON.stringify({ type: 'system', subtype: 'init', session_id: SESSION, model: 'claude-effective-test' }),
            JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Closed.\n\nOutcome: done' }] }, session_id: SESSION }),
        ].join('\n') + '\n');
        started(l, [], { FAKE_EVENTS: events });
        const atLaunch = runs(l);
        expect(atLaunch).toHaveLength(1);
        expect(atLaunch[0]).not.toHaveProperty('exit');
        expect(atLaunch[0].injectedBytes).toBeGreaterThan(0);
        expect(Object.keys(atLaunch[0])).toEqual(expect.arrayContaining(['at', 'kind', 'session', 'tier', 'requestedModel', 'effort', 'reason', 'injectedBytes']));

        const s = laneRun(l, ['status', ID]);
        expect(s.status, s.stderr).toBe(0);
        expect(s.stdout).toContain('runs: 1, last start at ');
        expect(s.stdout).toContain('effort: high');
        expect(s.stdout).toContain('model: requested claude-pin-test, effective claude-effective-test');
        expect(runs(l)[0]).toMatchObject({ session: SESSION, effectiveModel: 'claude-effective-test', outcome: 'done', exit: '0' });

        // Written back once: a completed line is never written again.
        const file = join(laneDir(l), 'runs.jsonl');
        writeFileSync(file, readFileSync(file, 'utf8').replace('claude-effective-test', 'claude-hand-edited'));
        const again = readFileSync(file, 'utf8');
        expect(laneRun(l, ['status', ID]).status).toBe(0);
        expect(laneRun(l, ['status', '--all']).status).toBe(0);
        expect(readFileSync(file, 'utf8')).toBe(again);
    });

    test('kills "status --all does not complete": the table run completes the last line of each lane', () => {
        const l = lab(prompt());
        started(l);
        expect(runs(l)[0]).not.toHaveProperty('exit');
        expect(laneRun(l, ['status', '--all']).status).toBe(0);
        expect(runs(l)[0]).toMatchObject({ exit: '0', outcome: 'none', effectiveModel: null });
    });

    test('kills "status needs runs.jsonl": a lane folder without the file prints runs: none', () => {
        const l = lab(prompt());
        mkdirSync(laneDir(l), { recursive: true });
        writeFileSync(join(laneDir(l), 'exit.txt'), '0\n');
        const s = laneRun(l, ['status', ID]);
        expect(s.status, s.stderr).toBe(0);
        expect(s.stdout).toContain('runs: none');
        expect(existsSync(join(laneDir(l), 'runs.jsonl'))).toBe(false);
    });
});

// ── injection (AM-5) ─────────────────────────────────────────────────────────

describe('lane-run start: the decisions and log entries injected (AM-5)', () => {
    const cited = prompt({
        extra: 'Front: harness\nDepends: P-2026-09-01-1000\n',
        body: 'Cites RC-32 and R-SIM-3, a missing RC-99, and AM-5, which is no row of the register, nor is P-2026-10-18-1205.',
    });

    test('kills "no decisions block", "no log block", "related rows dropped", "a token of no series taken for an ID", "the reminder not last", "not in stdin.md": both blocks in stdin.md, between the prompt and the reminder', () => {
        const l = lab(cited, { docs: true });
        const r = started(l);
        const stdin = readFileSync(join(laneDir(l), 'stdin.md'), 'utf8');
        const dec = stdin.indexOf('## Decisions in scope (injected by lane-run, AM-5)');
        const log = stdin.indexOf('## Log entries in scope (injected by lane-run, AM-5)');
        expect(stdin.startsWith(cited.trimEnd())).toBe(true);
        expect(dec).toBeGreaterThan(cited.trimEnd().length - 1);
        expect(log).toBeGreaterThan(dec);
        const decisions = stdin.slice(dec, log);
        expect(decisions).toContain('Query: `npm run decisions -- RC-32 R-SIM-3 RC-99 --no-related`');
        expect(decisions).toContain('== RC-32  [active]  series RC');
        expect(decisions).toContain('== R-SIM-3  [active]  series R-SIM');
        expect(decisions).toContain('-- amends of RC-32: RC-16\n- **RC-16** (2026-08-05) — The pin.');
        expect(decisions).not.toContain('RC-45');
        expect(decisions).not.toMatch(/not found: .*(AM-5|P-2026)/);
        expect(decisions).toContain('not found: RC-99');
        const logs = stdin.slice(log);
        expect(logs).toContain('Query: `npm run log:find -- --prompt P-2026-09-01-1000 --front harness --limit 10`');
        expect(logs).toContain('docs/claude-code-log.md:3 ## 2026-10-01 — feat: the lane it depends on (P-2026-09-01-1000)');
        expect(logs).toContain('docs/log-inbox/harness.md:5 ## 2026-10-02 — docs: a harness entry (P-2026-10-02-0800)');
        expect(logs).toContain('DEPENDS-BODY-MARKER');
        expect(logs).not.toContain('INBOX-BODY');
        expect(logs).not.toContain('UNRELATED');
        // The reminder stays the last thing the session reads, once.
        expect(stdin.trimEnd().endsWith('The `**Outcome**` field of a log entry is not this line.')).toBe(true);
        expect(stdin.split('Close your final message').length - 1).toBe(1);
        expect(r.stdout).toMatch(/^injected: \d+ bytes \(2 decision rows, not found: RC-99; 2 log entries\)$/m);
        expect(runs(l)[0].injectedBytes).toBe(Number(/^injected: (\d+) bytes/m.exec(r.stdout)![1]));
        expect(readFileSync(join(laneDir(l), 'input-1.md'), 'utf8')).toBe(stdin);
    });

    test('kills "the reminder not moved": a prompt that ends with the reminder (every committed one) gets the blocks above it, the reminder once and last', () => {
        const reminder = '---\nClose your final message (hard stop, question, closing report) with one line `Outcome: done | hard-stop | question | blocked`: exactly one of those four words, nothing else on that line (RC-20). A question with a recommendation also carries one line `Recommended: <one line>` (RC-21). The `**Outcome**` field of a log entry is not this line.\n';
        const l = lab(cited + '\n' + reminder, { docs: true });
        started(l);
        const stdin = readFileSync(join(laneDir(l), 'stdin.md'), 'utf8');
        expect(stdin.split('Close your final message').length - 1).toBe(1);
        expect(stdin.endsWith('\n' + reminder)).toBe(true);
        expect(stdin.indexOf('## Log entries in scope')).toBeLessThan(stdin.indexOf('Close your final message'));
    });

    test('kills "the launch stops on a missing ID": an ID the register does not have is listed and the lane starts', () => {
        const l = lab(prompt({ body: 'Only RC-404 is cited.' }), { docs: true });
        const r = started(l);
        const stdin = readFileSync(join(laneDir(l), 'stdin.md'), 'utf8');
        expect(stdin).toContain('not found: RC-404');
        expect(stdin).not.toContain('### Related rows');
        expect(calls(l)).toHaveLength(1);
        expect(r.stdout).toContain('session: ' + SESSION);
    });

    test('kills "fail open on a broken CLI": a CLI that fails for any other reason refuses the start, nothing written, no session', () => {
        const l = lab(cited, { docs: true });
        const broken = join(l.root, 'gates-broken');
        mkdirSync(broken);
        for (const n of ['decisions-query.ts', 'log-find.ts']) writeFileSync(join(broken, n), "process.stderr.write('boom\\n');\nprocess.exit(3);\n");
        const r = laneRun(l, ['start', l.worktree, 'prompt.md'], { LANE_RUN_GATES: broken });
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('the injection (AM-5) failed, the lane is not started: npm run decisions exited 3: boom');
        expect(calls(l)).toEqual([]);
        expect(existsSync(laneDir(l))).toBe(false);
        // The log CLI alone broken: refused the same way.
        const real = resolve(HERE, '..', '..', 'gates', 'decisions-query.ts');
        writeFileSync(join(broken, 'decisions-query.ts'), `import { spawnSync } from 'node:child_process';\nconst r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', '--experimental-strip-types', ${JSON.stringify(real)}, ...process.argv.slice(2)], { stdio: 'inherit' });\nprocess.exit(r.status ?? 1);\n`);
        const r2 = laneRun(l, ['start', l.worktree, 'prompt.md'], { LANE_RUN_GATES: broken });
        expect(r2.status).toBe(2);
        expect(r2.stderr).toContain('npm run log:find exited 3: boom');
        expect(calls(l)).toEqual([]);
    });

    test('kills "no cap", "the cap drops the decisions": above 40,000 characters the --full bodies go, the headers and the decisions stay', () => {
        const big = '# Log\n\n' + entry('2026-10-01 — feat: the lane it depends on (P-2026-09-01-1000)', 'DEPENDS-BODY-MARKER ' + 'x'.repeat(45000));
        const l = lab(cited, { docs: true, log: big });
        const r = started(l);
        expect(r.stdout).toContain('injected: trimmed to headers');
        const stdin = readFileSync(join(laneDir(l), 'stdin.md'), 'utf8');
        expect(stdin).not.toContain('DEPENDS-BODY-MARKER');
        expect(stdin).toContain('docs/claude-code-log.md:3 ## 2026-10-01 — feat: the lane it depends on (P-2026-09-01-1000)');
        expect(stdin).toContain('== RC-32  [active]');
        expect(stdin).toContain('(the full text of the `Depends:` entries is dropped: the injection was above 40000 characters)');
        expect(Buffer.byteLength(stdin)).toBeLessThan(40000);
    });
});
