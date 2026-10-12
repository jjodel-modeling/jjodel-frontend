import { describe, test, expect, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lintEntry, parseFields, splitLog, TICKET_HEADING } from '../../gates/log-tools.ts';

// lane-tracking.mjs imported and run, the way check-docs.ts (Check E) runs it
// (P11). A test name states the mutation of the module that turns it red
// (CLAUDE.md 5); the bench that established it is in the commit message.
//
// LANE_TRACKING points the suite at another copy of the module (the mutation bench).

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..');
const SCRIPT = process.env.LANE_TRACKING ? resolve(process.env.LANE_TRACKING) : resolve(HERE, '..', '..', 'lane-tracking.mjs');
const { FRONT_FROM, FRONTS_FILE, loadFronts, parseFrontLine, frontProblem } = await import(pathToFileURL(SCRIPT).href);
const { projectLane, isGoMessage, isDiscoveryPrompt, inFrontScope, cardTitle, cardBody, promptWorktree, promptLink, loadBoard, syncCard, closeFrontMilestones, trackLane, TRACK_LABELS } =
    await import(pathToFileURL(SCRIPT).href);
const { parseTicketBlocks, ticketKey, frontOfInbox, ticketProblem, ticketBlock, ticketTitle, ticketBody, projectTicket, parseTicketPlan, syncTicket, trackTicket, TICKET_LABELS } =
    await import(pathToFileURL(SCRIPT).href);

const FRONTS = [
    { slug: 'maintenance', state: 'open' },
    { slug: 'harness', state: 'open' },
    { slug: 'old-front', state: 'closed', closedOn: '2026-10-20' },
    { slug: 'undated', state: 'closed' },
    { slug: 'paused', state: 'paused' },
];

/** A prompt whose header carries `lines` after Prompt-ID and Chat, then a body. */
const prompt = (id: string, lines: string[] = [], body = '## COSA\n\nDo the thing.\n'): string =>
    `# Prompt: a lane\n\nPrompt-ID: ${id}\nChat: C-2026-10-10-1256\n${lines.join('\n')}\nStatus: da eseguire\n\n${body}`;

const AT = FRONT_FROM;

const dirs: string[] = [];
afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

describe('parseFrontLine', () => {
    test('reads the slug of the header line, trimmed', () => {
        expect(parseFrontLine(prompt(AT, ['Lane: fast', 'Front:   harness  ']))).toBe('harness');
    });

    test('no line, or an empty one, is null', () => {
        expect(parseFrontLine(prompt(AT, ['Lane: fast']))).toBeNull();
        expect(parseFrontLine(prompt(AT, ['Lane: fast', 'Front:   ']))).toBeNull();
    });

    test('a `Front:` line below the first `## ` heading is not the header (header not cut at `## `)', () => {
        expect(parseFrontLine(prompt(AT, ['Lane: fast'], '## COSA\n\nFront: harness\n'))).toBeNull();
    });
});

describe('frontProblem', () => {
    test('a prompt at the cut-off naming an open front passes', () => {
        expect(frontProblem(prompt(AT, ['Lane: fast', 'Front: maintenance']), AT, FRONTS)).toBeNull();
    });

    test('a prompt at the cut-off with no `Front:` line fails, in one line (missing line not refused)', () => {
        const why = frontProblem(prompt(AT, ['Lane: fast']), AT, FRONTS);
        expect(why).toContain('no `Front:` line');
        expect(why).not.toContain('\n');
    });

    test('an unknown slug fails, naming it (slug not looked up)', () => {
        expect(frontProblem(prompt(AT, ['Lane: fast', 'Front: nope']), AT, FRONTS)).toContain('unknown front "nope"');
    });

    test('a prompt before FRONT_FROM is never checked (cut-off dropped)', () => {
        expect(FRONT_FROM).toBe('P-2026-10-11-0000');
        expect(frontProblem(prompt('P-2026-10-10-2359', ['Lane: fast']), 'P-2026-10-10-2359', FRONTS)).toBeNull();
        expect(frontProblem(prompt('P-2026-10-09-2359', ['Lane: fast', 'Front: nope']), 'P-2026-10-09-2359', FRONTS)).toBeNull();
    });

    test('the merge prompts of both lane-run templates are exempt (merge exemption dropped)', () => {
        expect(frontProblem(prompt(AT, ['Lane: full (merge; zero conflicts measured)']), AT, FRONTS)).toBeNull();
        expect(frontProblem(prompt(AT, ['Lane: full (merge of the trunk into the branch; 1 conflict)']), AT, FRONTS)).toBeNull();
    });

    test('the exemption reads the header Lane line only: a full lane that mentions a merge, or a merge Lane line in the body, is checked', () => {
        expect(frontProblem(prompt(AT, ['Lane: full (more than 3 files; merge-adjacent)']), AT, FRONTS)).toContain('no `Front:` line');
        expect(frontProblem(prompt(AT, ['Lane: fast'], '## COSA\n\nLane: full (merge; quoted)\n'), AT, FRONTS)).toContain('no `Front:` line');
    });

    test('a closed front passes a prompt dated before or on its closedOn and fails one dated after (closedOn comparison inverted)', () => {
        const at = (id: string) => frontProblem(prompt(id, ['Lane: fast', 'Front: old-front']), id, FRONTS);
        expect(at('P-2026-10-19-0900')).toBeNull();
        expect(at('P-2026-10-20-2359')).toBeNull();
        expect(at('P-2026-10-21-0000')).toBe('front "old-front" closed on 2026-10-20, and the prompt is dated 2026-10-21');
    });

    test('a closed front without closedOn fails every prompt in scope', () => {
        expect(frontProblem(prompt(AT, ['Lane: fast', 'Front: undated']), AT, FRONTS)).toContain('closed on (no closedOn)');
    });

    test('a state neither open nor closed fails', () => {
        expect(frontProblem(prompt(AT, ['Lane: fast', 'Front: paused']), AT, FRONTS)).toContain('has state "paused"');
    });

    test('a malformed Prompt-ID fails instead of passing unread', () => {
        expect(frontProblem(prompt(AT, ['Lane: fast', 'Front: harness']), 'P-2026-10-10', FRONTS)).toContain('not a Prompt-ID');
    });
});

describe('loadFronts', () => {
    test('a missing registry, or one without a fronts list, throws naming the file', () => {
        const dir = mkdtempSync(join(tmpdir(), 'lane-tracking-'));
        dirs.push(dir);
        expect(() => loadFronts(dir)).toThrow(`cannot read ${FRONTS_FILE}`);
        mkdirSync(join(dir, 'docs', 'harness'), { recursive: true });
        writeFileSync(join(dir, FRONTS_FILE), '{ "v": 1 }\n');
        expect(() => loadFronts(dir)).toThrow(`${FRONTS_FILE} has no "fronts" list`);
    });

    test('the committed registry: unique slugs, the fields of P13, closedOn only on a closed front, maintenance and harness open', () => {
        const fronts = loadFronts(REPO);
        const raw = JSON.parse(readFileSync(join(REPO, FRONTS_FILE), 'utf8'));
        expect(raw.v).toBe(1);
        expect(raw.board).toEqual({ owner: 'jjodel-modeling', project: 2, repo: 'jjodel-modeling/jjodel-lanes' });
        expect(new Set(fronts.map((f: { slug: string }) => f.slug)).size).toBe(fronts.length);
        for (const f of fronts) {
            expect(f.slug, JSON.stringify(f)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
            expect(f.title.length, f.slug).toBeGreaterThan(0);
            expect(f.exit.length, f.slug).toBeGreaterThan(0);
            expect(['open', 'closed'], f.slug).toContain(f.state);
            expect(f.openedOn, f.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(Number.isInteger(f.milestone), f.slug).toBe(true);
            if (f.state === 'closed') expect(f.closedOn, f.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            else expect(f.closedOn, f.slug).toBeUndefined();
        }
        for (const slug of ['maintenance', 'harness']) expect(fronts.find((f: { slug: string }) => f.slug === slug)?.state).toBe('open');
    });
});

// ── the card of a lane (lane B) ──────────────────────────────────────────────

const LANE = 'P-2026-10-11-1600';
const TRACK_FRONTS = [
    { slug: 'maintenance', state: 'open', milestone: 1 },
    { slug: 'harness', state: 'open', milestone: 2 },
];
const FILE = '/t/docs/prompts/claude_2026-10-11_1600_prompt_feature.md';

/** A lane's prompt: its title, header lines after Prompt-ID and Chat, then a body the card must never carry. */
const lanePrompt = (title = '# A feature of the harness', lines = ['Request: https://claude.ai/code/session_01ABC', 'Lane: full (more than 3 files)', 'Front: harness']): string =>
    `${title}\n\nPrompt-ID: ${LANE}\nChat: C-2026-10-10-1256\n${lines.join('\n')}\nStatus: da eseguire\n\nWorktree: \`~/jjodel-w-feature\`, branch \`feature-x\`, cut from the trunk.\n\n## COSA\n\nThe body only the session reads.\n`;

/** projectLane on an exited lane of `lanePrompt()`, with `o` laid over it. */
const seen = (o: Record<string, unknown> = {}) =>
    projectLane(LANE, { folder: true, merge: false, state: 'exited', outcome: null, headerStatus: 'da eseguire', goSeen: false, promptText: lanePrompt(), promptFile: FILE, fronts: TRACK_FRONTS, ...o });

const card = (column: string, labels: string[] = [], closed = false) => ({ column, labels, milestone: 2, closed });

describe('projectLane: the mapping, one row each (report answers 1, 3, 6)', () => {
    test('a prompt committed and not started is Ready, open, on its front\'s milestone (Ready row dropped)', () => {
        expect(seen({ folder: false, state: null })).toEqual(card('Ready'));
    });

    test('a prompt flipped with no lane folder (run outside lane-run) is Done and closed', () => {
        expect(seen({ folder: false, state: null, headerStatus: 'eseguito 2026-10-10 · lane x · abc' })).toEqual(card('Done', [], true));
    });

    test('a running lane is In progress with no label (running row dropped)', () => {
        expect(seen({ state: 'running' })).toEqual(card('In progress'));
    });

    test('a lane running past its limit is In progress + blocked', () => {
        expect(seen({ state: 'blocked' })).toEqual(card('In progress', ['blocked']));
    });

    test('`question` is In progress + waiting:question', () => {
        expect(seen({ outcome: 'Outcome: question' })).toEqual(card('In progress', ['waiting:question']));
    });

    test('`blocked` is In progress + blocked', () => {
        expect(seen({ outcome: 'Outcome: blocked' })).toEqual(card('In progress', ['blocked']));
    });

    test('`blocked` resolved afterwards (resolved.txt) with the Status flipped is Done and closed, like done (resolved not read)', () => {
        expect(seen({ outcome: 'Outcome: blocked', resolved: '2026-10-11 17:30 · alfonso · fixed by hand', headerStatus: 'eseguito 2026-10-11 · lane x · abc' })).toEqual(card('Done', [], true));
    });

    test('`blocked` resolved afterwards with the Status still `da eseguire` is In review + closure-owed, open, like done (resolved not read)', () => {
        expect(seen({ outcome: 'Outcome: blocked', resolved: '2026-10-11 17:30 · alfonso · fixed by hand' })).toEqual(card('In review', ['closure-owed']));
    });

    test('`hard-stop` of a discovery before any GO is In review + waiting:phase-2, never Done (hard-stop mapped to Done)', () => {
        const disc = lanePrompt('# Lane tracking on GitHub Projects: discovery');
        expect(seen({ outcome: 'Outcome: hard-stop', promptText: disc })).toEqual(card('In review', ['waiting:phase-2']));
    });

    test('`hard-stop` of a discovery named so only by its file is In review + waiting:phase-2 (file name not read)', () => {
        expect(seen({ outcome: 'Outcome: hard-stop', promptFile: '/t/docs/prompts/claude_2026-10-11_1600_prompt_feature_discovery.md' })).toEqual(card('In review', ['waiting:phase-2']));
    });

    test('`hard-stop` of a discovery after its GO is In review + waiting:visual (GO not read)', () => {
        const disc = lanePrompt('# Lane tracking on GitHub Projects: discovery');
        expect(seen({ outcome: 'Outcome: hard-stop', promptText: disc, goSeen: true })).toEqual(card('In review', ['waiting:visual']));
    });

    test('`hard-stop` of any other prompt is In review + waiting:visual, never Done (hard-stop mapped to Done)', () => {
        expect(seen({ outcome: 'Outcome: hard-stop' })).toEqual(card('In review', ['waiting:visual']));
        expect(seen({ outcome: 'Outcome: hard-stop (abc1234)' })).toEqual(card('In review', ['waiting:visual']));
    });

    test('`hard-stop` with the Status flipped is Done and closed, a discovery before its GO and any other prompt alike (flip read after hard-stop)', () => {
        const flipped = 'eseguito 2026-10-11 · lane gv-right-margin · 9d9e0be57';
        const disc = lanePrompt('# Lane tracking on GitHub Projects: discovery');
        expect(seen({ outcome: 'Outcome: hard-stop', headerStatus: flipped })).toEqual(card('Done', [], true));
        expect(seen({ outcome: 'Outcome: hard-stop', headerStatus: flipped, promptText: disc })).toEqual(card('Done', [], true));
    });

    test('a flipped Status does not override `question` or an unresolved `blocked` (flip read before them)', () => {
        const flipped = 'eseguito 2026-10-11 · lane x · abc';
        expect(seen({ outcome: 'Outcome: question', headerStatus: flipped })).toEqual(card('In progress', ['waiting:question']));
        expect(seen({ outcome: 'Outcome: blocked', headerStatus: flipped })).toEqual(card('In progress', ['blocked']));
    });

    test('`done` with the Status flipped is Done and the issue closed; a suffix after the word parses', () => {
        expect(seen({ outcome: 'Outcome: done', headerStatus: 'eseguito 2026-10-10 · lane x · abc' })).toEqual(card('Done', [], true));
        expect(seen({ outcome: 'Outcome: done (abc1234)', headerStatus: 'eseguito 2026-10-10' })).toEqual(card('Done', [], true));
    });

    test('`done` with the Status still `da eseguire` is In review + closure-owed, open (flip not read)', () => {
        expect(seen({ outcome: 'Outcome: done' })).toEqual(card('In review', ['closure-owed']));
    });

    test('no Outcome line, or one naming no outcome, is In progress + outcome:unparsed', () => {
        expect(seen({ outcome: null })).toEqual(card('In progress', ['outcome:unparsed']));
        expect(seen({ outcome: 'Outcome: completed' })).toEqual(card('In progress', ['outcome:unparsed']));
    });

    test('no card: before FRONT_FROM, a merge lane, a prompt failing the front rule, no prompt text', () => {
        expect(projectLane('P-2026-10-10-2359', { promptText: lanePrompt(), fronts: TRACK_FRONTS }).skip).toContain('before ' + FRONT_FROM);
        expect(seen({ merge: true }).skip).toBe('a merge lane gets no card');
        expect(seen({ promptText: lanePrompt('# Merge', ['Lane: full (merge; zero conflicts measured)']) }).skip).toBe('a merge lane gets no card');
        expect(seen({ promptText: lanePrompt('# No front', ['Lane: fast']) }).skip).toContain('no `Front:` line');
        expect(seen({ promptText: null }).skip).toContain('no prompt file');
    });

    test('inFrontScope: at or after FRONT_FROM and not a merge prompt', () => {
        expect(inFrontScope(lanePrompt(), LANE)).toBe(true);
        expect(inFrontScope(lanePrompt(), 'P-2026-10-10-2359')).toBe(false);
        expect(inFrontScope(lanePrompt('# M', ['Lane: full (merge; 1 conflict)']), LANE)).toBe(false);
    });
});

describe('what tells a discovery hard stop from a visual one', () => {
    test('a GO is a lane input whose first line opens with the Prompt-ID and says GO (GO recognised anywhere)', () => {
        expect(isGoMessage('[P-2026-10-10-0105] GO.\n\nThe chat verified.\n')).toBe(true);
        expect(isGoMessage('[P-2026-10-10-0105] Phase 2 GO: slice S2 (render).\n')).toBe(true);
        expect(isGoMessage('[P-2026-10-10-0105] Answer to your question 3: yes.\n')).toBe(false);
        expect(isGoMessage('Notes first.\n[P-2026-10-10-0105] GO.\n')).toBe(false);
    });

    test('a discovery by its title or file name; a Lane line naming the discovery it follows is not one (file name not read)', () => {
        expect(isDiscoveryPrompt(lanePrompt('# Something: Phase 1 discovery'), FILE)).toBe(true);
        expect(isDiscoveryPrompt(lanePrompt(), '/x/claude_2026-10-05_1655_prompt_discovery_sim.md')).toBe(true);
        expect(isDiscoveryPrompt(lanePrompt('# Sim watches', ['Lane: full (Phase 2, visual; the design is fixed by the discovery)']), FILE)).toBe(false);
        expect(isDiscoveryPrompt(lanePrompt('# Body', ['Lane: fast']).replace('only the session reads', 'see the discovery report'), FILE)).toBe(false);
    });
});

describe('the card text (report answer 16)', () => {
    const observed = { promptText: lanePrompt(), promptFile: FILE, branch: 'feature-x', worktree: 'jjodel-w-feature', promptLink: 'https://github.com/o/r/blob/feature-x/docs/prompts/x.md' };

    test('the title opens with the Prompt-ID, the idempotency key', () => {
        expect(cardTitle(LANE, observed)).toBe(LANE + ' · A feature of the harness');
    });

    test('the body: Prompt-ID, title, Lane, front, branch, worktree, Request URL, prompt link; never the prompt body', () => {
        const body = cardBody(LANE, observed);
        for (const row of ['- Prompt-ID: ' + LANE, '- Title: A feature of the harness', '- Lane: full (more than 3 files)', '- Front: harness', '- Branch: feature-x',
            '- Worktree: jjodel-w-feature', '- Request: https://claude.ai/code/session_01ABC', '- Prompt file: https://github.com/o/r/blob/feature-x/docs/prompts/x.md']) {
            expect(body).toContain(row);
        }
        expect(body).not.toContain('only the session reads');
    });

    test('the Worktree line of the header names the worktree and the branch', () => {
        expect(promptWorktree(lanePrompt())).toEqual({ worktree: 'jjodel-w-feature', branch: 'feature-x' });
        expect(promptWorktree('# T\n\nPrompt-ID: ' + LANE + '\n')).toEqual({ worktree: null, branch: null });
    });

    test('the prompt link from an https or ssh GitHub remote; none from another remote', () => {
        const at = 'docs/prompts/x.md';
        expect(promptLink('https://github.com/jjodel-modeling/jjodel-frontend.git', 'b', at)).toBe('https://github.com/jjodel-modeling/jjodel-frontend/blob/b/docs/prompts/x.md');
        expect(promptLink('git@github.com:jjodel-modeling/jjodel-frontend.git', 'b', at)).toBe('https://github.com/jjodel-modeling/jjodel-frontend/blob/b/docs/prompts/x.md');
        expect(promptLink('https://gitlab.com/a/b.git', 'b', at)).toBeNull();
    });

    test('loadBoard: the committed board block', () => {
        expect(loadBoard(REPO)).toEqual({ owner: 'jjodel-modeling', project: 2, repo: 'jjodel-modeling/jjodel-lanes' });
    });
});

// ── syncCard against a fake gh ───────────────────────────────────────────────

const FAKE_GH = resolve(HERE, 'fixtures', 'fake-gh.cjs');
const BOARD = { owner: 'jjodel-modeling', project: 2, repo: 'jjodel-modeling/jjodel-lanes' };
const META = { title: LANE + ' · A feature of the harness', body: '- Prompt-ID: ' + LANE + '\n' };
const WRITES = /^(issue (create|edit|close|reopen)|project item-(add|edit)|api -X PATCH)/;

/** A tracking folder and a fake gh whose calls and state live in `state`; `mode` is its FAKE_GH_MODE. */
function ghLab(mode = '') {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'lane-track-')));
    dirs.push(root);
    const state = join(root, 'state');
    const dir = join(root, 'tracking');
    for (const d of [state, dir]) mkdirSync(d, { recursive: true });
    const gh = join(root, 'gh');
    writeFileSync(gh, `#!/bin/sh\nFAKE_GH_STATE='${state}' FAKE_GH_MODE='${mode}' exec '${process.execPath}' '${FAKE_GH}' "$@"\n`);
    chmodSync(gh, 0o755);
    const calls = (): string[][] => (existsSync(join(state, 'gh-calls.jsonl')) ? readFileSync(join(state, 'gh-calls.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map((x) => JSON.parse(x)) : []);
    const writes = () => calls().filter((a) => WRITES.test(a.join(' ')));
    const gstate = () => JSON.parse(readFileSync(join(state, 'gh.json'), 'utf8'));
    const columnOf = (n: number) => {
        const s = gstate();
        return String(s.status[s.items[s.issues.find((i: { number: number }) => i.number === n).url]] || '').replace(/^opt-/, '');
    };
    const sync = (wanted: object) => syncCard(LANE, wanted, { dir, config: { gh }, board: BOARD, meta: META });
    return { dir, gh, calls, writes, gstate, columnOf, sync, cardFile: join(dir, LANE + '.json') };
}

describe('syncCard', () => {
    test('creates the card once (issue, item, Status); the same card again makes no gh call (difference not computed)', () => {
        const g = ghLab();
        const r = g.sync(card('In progress'));
        expect(r.ok, r.line).toBe(true);
        expect(r.line).toBe('https://github.com/jjodel-modeling/jjodel-lanes/issues/1 · In progress');
        expect(g.writes().map((a) => a.slice(0, 2).join(' '))).toEqual(['issue create', 'project item-add', 'project item-edit']);
        const issue = g.gstate().issues[0];
        expect(issue).toMatchObject({ title: META.title, milestone: { number: 2, title: 'harness' }, state: 'OPEN' });
        expect(g.columnOf(1)).toBe('In progress');
        const n = g.calls().length;
        expect(g.sync(card('In progress')).line).toBe(r.line);
        expect(g.calls().length).toBe(n);
        expect(JSON.parse(readFileSync(g.cardFile, 'utf8'))).toMatchObject({ issue: 1, item: 'PVTI_1', error: null, applied: { column: 'In progress', milestone: 2 } });
    });

    test('a lost card file is healed by the search on the title, never by a second create (title search dropped)', () => {
        const g = ghLab();
        g.sync(card('In progress'));
        unlinkSync(g.cardFile);
        const r = g.sync(card('In review', ['waiting:visual']));
        expect(r.ok, r.line).toBe(true);
        expect(g.writes().filter((a) => a[1] === 'create')).toHaveLength(1);
        expect(g.calls().some((a) => a[0] === 'issue' && a[1] === 'list' && a.includes('"' + LANE + '" in:title'))).toBe(true);
        expect(g.gstate().issues).toHaveLength(1);
        expect(g.columnOf(1)).toBe('In review');
        expect(JSON.parse(readFileSync(g.cardFile, 'utf8')).healed).toBeTruthy();
    });

    test('labels follow the card: the old waiting label goes, only the owned labels are touched (stale label kept)', () => {
        const g = ghLab();
        g.sync(card('In review', ['waiting:phase-2']));
        g.sync(card('In review', ['waiting:visual']));
        const issue = g.gstate().issues[0];
        expect(issue.labels.map((l: { name: string }) => l.name)).toEqual(['waiting:visual']);
        expect(TRACK_LABELS).toContain('waiting:phase-2');
        const edit = g.writes().find((a) => a[1] === 'edit')!;
        expect(edit).toEqual(['issue', 'edit', '1', '--repo', BOARD.repo, '--add-label', 'waiting:visual', '--remove-label', 'waiting:phase-2']);
    });

    test('Done closes the issue and sets the column; In progress again reopens it (close not applied)', () => {
        const g = ghLab();
        g.sync(card('In review', ['closure-owed']));
        g.sync(card('Done', [], true));
        expect(g.gstate().issues[0].state).toBe('CLOSED');
        expect(g.columnOf(1)).toBe('Done');
        expect(g.gstate().issues[0].labels).toEqual([]);
        g.sync(card('In progress'));
        expect(g.gstate().issues[0].state).toBe('OPEN');
        expect(g.columnOf(1)).toBe('In progress');
    });

    test('a gh failure is one line and the card file\'s error, and it never throws (fail open dropped)', () => {
        const g = ghLab('fail');
        const r = g.sync(card('In progress'));
        expect(r.ok).toBe(false);
        expect(r.line).toBe('tracking skipped: gh project view: error connecting to api.github.com');
        expect(r.line).not.toContain('\n');
        expect(JSON.parse(readFileSync(g.cardFile, 'utf8')).error).toBe('gh project view: error connecting to api.github.com');
    });

    test('a token without the project scope says so, and nothing is created', () => {
        const g = ghLab('noscope');
        expect(g.sync(card('In progress')).line).toBe('tracking skipped: missing project scope');
        expect(g.writes()).toEqual([]);
    });

    test('a dry run reads, writes nothing, and lists the writes it would make', () => {
        const g = ghLab();
        const r = syncCard(LANE, card('Ready'), { dir: g.dir, config: { gh: g.gh }, board: BOARD, meta: META, dryRun: true });
        expect(r.ok, r.line).toBe(true);
        expect(r.line).toMatch(/^dry run: gh issue create --repo jjodel-modeling\/jjodel-lanes --title .* --body <body> --milestone harness; gh project item-add /);
        expect(g.writes()).toEqual([]);
        expect(existsSync(g.cardFile)).toBe(false);
    });
});

describe('closeFrontMilestones', () => {
    test('closes the open milestone of a front the registry marks closed, once (closed front ignored)', () => {
        const g = ghLab();
        const fronts = [{ slug: 'harness', state: 'closed', closedOn: '2026-10-20', milestone: 2 }, { slug: 'maintenance', state: 'open', milestone: 1 }];
        expect(closeFrontMilestones(fronts, { config: { gh: g.gh }, board: BOARD })).toEqual(['milestone 2 (harness) closed']);
        expect(g.writes()).toEqual([['api', '-X', 'PATCH', 'repos/jjodel-modeling/jjodel-lanes/milestones/2', '-f', 'state=closed']]);
        expect(closeFrontMilestones(fronts, { config: { gh: g.gh }, board: BOARD })).toEqual([]);
        expect(g.writes()).toHaveLength(1);
    });

    test('no closed front: no gh call at all', () => {
        const g = ghLab();
        expect(closeFrontMilestones(TRACK_FRONTS, { config: { gh: g.gh }, board: BOARD })).toEqual([]);
        expect(g.calls()).toEqual([]);
    });
});

describe('trackLane', () => {
    test('without config.json tracking is off and the lane is not even observed (enable switch dropped)', () => {
        const g = ghLab();
        let observed = 0;
        const r = trackLane(LANE, () => (observed++, {}), { dir: g.dir, board: BOARD });
        expect(r.line).toBe('tracking off (no ' + join(g.dir, 'config.json') + ')');
        expect(observed).toBe(0);
        expect(g.calls()).toEqual([]);
    });

    test('an observation that throws is one skipped line, never a throw', () => {
        const g = ghLab();
        writeFileSync(join(g.dir, 'config.json'), JSON.stringify({ gh: g.gh }));
        const r = trackLane(LANE, () => {
            throw new Error('cannot read docs/harness/fronts.json: ENOENT\nsecond line');
        }, { dir: g.dir, board: BOARD });
        expect(r.line).toBe('tracking skipped: cannot read docs/harness/fronts.json: ENOENT');
    });
});

// ── lane-run resolve re-projects the card (P-2026-10-10-2020) ────────────────

// LANE_RUN points these cases at another copy of lane-run.mjs, as in laneRun.test.ts.
const LANE_RUN = process.env.LANE_RUN ? resolve(process.env.LANE_RUN) : resolve(HERE, '..', '..', 'lane-run.mjs');
const ISSUE_1 = 'https://github.com/jjodel-modeling/jjodel-lanes/issues/1';

/** A throwaway HOME: one exited lane at LANE whose last Outcome line is `Outcome: blocked`, its prompt on disk, tracking on, the fake gh as LANE_TRACK_GH. */
function resolveLab(mode = '') {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'lane-resolve-')));
    dirs.push(root);
    const home = join(root, 'home');
    const state = join(root, 'state');
    const lane = join(home, '.jjodel-lanes', LANE);
    for (const d of [state, lane, join(home, '.jjodel-lanes', '_tracking')]) mkdirSync(d, { recursive: true });
    writeFileSync(join(home, '.jjodel-lanes', '_tracking', 'config.json'), '{}\n');
    writeFileSync(join(root, 'prompt.md'), lanePrompt());
    const text = { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Gate red.\nOutcome: blocked' }] } };
    writeFileSync(join(lane, 'log.jsonl'), JSON.stringify(text) + '\n');
    writeFileSync(join(lane, 'started.txt'), String(Date.now() - 60000) + '\n');
    writeFileSync(join(lane, 'pid.txt'), '999999\n');
    writeFileSync(join(lane, 'exit.txt'), '0\n');
    writeFileSync(join(lane, 'prompt.txt'), join(root, 'prompt.md') + '\n');
    const gh = join(state, 'gh');
    writeFileSync(gh, `#!/bin/sh\nexec '${process.execPath}' '${FAKE_GH}' "$@"\n`);
    chmodSync(gh, 0o755);
    const env = { HOME: home, PATH: '/usr/bin:/bin', LANE_TRACK_GH: gh, FAKE_GH_STATE: state, ...(mode ? { FAKE_GH_MODE: mode } : {}) };
    const run = (args: string[]) => spawnSync(process.execPath, [LANE_RUN, ...args], { cwd: home, env, encoding: 'utf8', timeout: 20000 });
    const gstate = () => JSON.parse(readFileSync(join(state, 'gh.json'), 'utf8'));
    const column = () => {
        const s = gstate();
        return String(s.status[s.items[s.issues[0].url]] || '').replace(/^opt-/, '');
    };
    return { lane, run, gstate, column };
}

const cardOf = (out: string) => out.split('\n').find((x) => x.startsWith('card: ')) ?? '';

describe('lane-run resolve and the card', () => {
    test('resolve re-projects the card of the lane it resolves: In progress + blocked before, In review + closure-owed after, one issue (resolve not tracked)', () => {
        const r = resolveLab();
        const before = r.run(['status', LANE]);
        expect(before.status, before.stderr).toBe(0);
        expect(cardOf(before.stdout)).toBe('card: ' + ISSUE_1 + ' · In progress (blocked)');
        const after = r.run(['resolve', LANE, '--why', 'fixed by hand', '--by', 'alfonso']);
        expect(after.status, after.stderr).toBe(0);
        expect(existsSync(join(r.lane, 'resolved.txt'))).toBe(true);
        expect(cardOf(after.stdout)).toBe('card: ' + ISSUE_1 + ' · In review (closure-owed)');
        expect(r.column()).toBe('In review');
        expect(r.gstate().issues.map((i: { labels: { name: string }[] }) => i.labels.map((x) => x.name))).toEqual([['closure-owed']]);
    });

    test('gh exits 1: resolve still writes resolved.txt and exits 0, and its card line says why (fail open dropped)', () => {
        const r = resolveLab('fail');
        const out = r.run(['resolve', LANE, '--why', 'fixed by hand', '--by', 'alfonso']);
        expect(out.status, out.stderr).toBe(0);
        expect(readFileSync(join(r.lane, 'resolved.txt'), 'utf8')).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2} · alfonso · fixed by hand\n$/);
        expect(cardOf(out.stdout)).toBe('card: tracking skipped: gh project view: error connecting to api.github.com');
    });
});

// ── tickets as Backlog cards (P-2026-10-11-1017) ─────────────────────────────

// Real blocks of docs/log-inbox at 96d38b2bf (merge-gate.md:7, views.md:50), and
// around them what the rule must leave out: a task entry with a `**Ticket** (`
// paragraph, a legacy `ticket extension:` heading. The views block carries a
// second Priority line, added here, for the first-occurrence rule.
const MERGE_GATE_TICKET = [
    '## 2026-10-02 — ticket: a lane removes the node_modules symlink the direct merge needs later',
    '',
    '**Ticket**: Lane P-2026-10-02-2045 linked `frontend/node_modules` in `~/jjodel-w-vpglyph` to run its gates and removed the link at the end. The direct merge P-2026-10-02-2315 then ran the incoming vitest gate in that worktree, found no vitest (`sh: vitest: command not found`), wrote no report and stopped at `Outcome: blocked` before any merge commit. The chat restored the link and reran the merge as P-2026-10-02-2330 (green, merged `e2e4fbc35`). Fix options: `lane-run merge --direct` checks or creates the worktree link before the incoming gate, or lanes keep the link (it is gitignored).',
    '**Priority**: low',
    '**Found in**: P-2026-10-02-2315 (chat C-2026-10-01-2220)',
];
const VIEWS_TICKET = [
    '## 2026-09-30 — ticket: colour the edges of a coloured viewpoint by source or target',
    '**Ticket**: Edges are not coloured by «Color by metaclass» (out of scope of P-2026-09-30-2022, decision 4). Cheap to add: the resolver answers per class id, and `UnifiedEdge.tsx:709-712` already applies an inline `stroke` for IR edges. One selector on the source (or target) node\'s metaclass plus the same inline stroke would do it. Use the border shade (L 55 %), not the pastel fill: L 82-88 on a white canvas reads 1.2-1.9:1.',
    '**Priority**: low',
    '**Priority**: high',
    '**Found in**: P-2026-09-30-2022',
    '**Detail**: docs/discovery/discovery_2026-09-30_viewpoint_colors_pastel.md',
];
const INBOX_LINES = [
    '# log-inbox — lane «fixture»',
    '',
    '---',
    '',
    '## 2026-10-10 — feat(harness): a task entry (P-2026-10-10-1612)',
    '**Prompt**: a task.',
    '**Outcome**: ✅ completed',
    '**Prompt document name**: 2026-10-10 16:12',
    '',
    '**Ticket** (closed here): a paragraph after a task entry, prose and not a ticket.',
    '',
    ...MERGE_GATE_TICKET,
    '',
    '## 2026-09-20 — ticket extension: a legacy heading, a task entry',
    '**Priority**: high',
    '',
    '## 2026-10-04 — ticket: a block with no priority',
    '**Ticket**: synthetic: the backfill cards it priority:unset.',
    '**Found in**: P-2026-10-04-0946',
    '',
    ...VIEWS_TICKET,
    '',
];
const INBOX = INBOX_LINES.join('\n');
const lineOf = (heading: string) => INBOX_LINES.indexOf(heading) + 1;

describe('parseTicketBlocks: the rule of check:docs', () => {
    test('three blocks, in file order, with their fields; the task entry, its `**Ticket** (` paragraph and `ticket extension:` left out (heading test dropped)', () => {
        const blocks = parseTicketBlocks(INBOX);
        expect(blocks.map((b: { title: string }) => b.title)).toEqual([
            'a lane removes the node_modules symlink the direct merge needs later', 'a block with no priority', 'colour the edges of a coloured viewpoint by source or target',
        ]);
        expect(blocks[0]).toEqual({
            line: lineOf(MERGE_GATE_TICKET[0]), date: '2026-10-02', title: 'a lane removes the node_modules symlink the direct merge needs later',
            ticket: MERGE_GATE_TICKET[2].slice('**Ticket**: '.length), priority: 'low', foundIn: 'P-2026-10-02-2315 (chat C-2026-10-01-2220)', detail: null,
            text: MERGE_GATE_TICKET.join('\n'),
        });
        expect(blocks[2]).toMatchObject({ line: lineOf(VIEWS_TICKET[0]), date: '2026-09-30', detail: 'docs/discovery/discovery_2026-09-30_viewpoint_colors_pastel.md', text: VIEWS_TICKET.join('\n') });
    });

    test('a block ends at the next entry heading: the block without Priority does not take the next one\'s (block runs to the end)', () => {
        expect(parseTicketBlocks(INBOX)[1]).toMatchObject({ priority: null, foundIn: 'P-2026-10-04-0946', detail: null });
    });

    test('the first occurrence of a field wins (last occurrence kept)', () => {
        expect(parseTicketBlocks(INBOX)[2].priority).toBe('low');
    });

    test('agrees with check:docs (log-tools splitLog, TICKET_HEADING, parseFields) on the fixture and on every inbox of the repo (rule copied wrong)', () => {
        const dir = join(REPO, 'docs', 'log-inbox');
        const texts = [INBOX, ...readdirSync(dir).filter((n) => n.endsWith('.md')).map((n) => readFileSync(join(dir, n), 'utf8'))];
        let total = 0;
        for (const text of texts) {
            const theirs = splitLog(text).entries.filter((e) => TICKET_HEADING.test(e.heading)).map((e) => {
                const f = parseFields(e.text);
                return { date: e.date, title: e.heading.replace(TICKET_HEADING, '').trim(), ticket: f.get('Ticket') ?? null, priority: f.get('Priority') ?? null, foundIn: f.get('Found in') ?? null, detail: f.get('Detail') ?? null };
            });
            const ours = parseTicketBlocks(text).map((b: Record<string, unknown>) => ({ date: b.date, title: b.title, ticket: b.ticket, priority: b.priority, foundIn: b.foundIn, detail: b.detail }));
            expect(ours).toEqual(theirs);
            total += ours.length;
        }
        expect(total).toBeGreaterThanOrEqual(3);
    });
});

describe('a new ticket: checked, written, keyed, fronted', () => {
    const FIELDS = { title: 'a finding', ticket: 'First line of the finding.\nA second line.', priority: 'medium', found: 'P-2026-10-11-1017', detail: 'docs/discovery/x.md' };

    test('ticketBlock writes the P9 ticket format, which check:docs lints clean and the parser reads back (field dropped or renamed)', () => {
        const block = ticketBlock({ ...FIELDS, date: '2026-10-11' });
        expect(block).toBe('## 2026-10-11 — ticket: a finding\n**Ticket**: First line of the finding.\nA second line.\n**Priority**: medium\n**Found in**: P-2026-10-11-1017\n**Detail**: docs/discovery/x.md\n');
        const entry = splitLog(block).entries[0];
        expect(lintEntry(entry, new Set()).findings).toEqual([]);
        expect(parseTicketBlocks(block)[0]).toMatchObject({ title: 'a finding', ticket: 'First line of the finding.', priority: 'medium', foundIn: 'P-2026-10-11-1017', detail: 'docs/discovery/x.md' });
        expect(ticketBlock({ ...FIELDS, detail: null, date: '2026-10-11' })).not.toContain('**Detail**');
    });

    test('ticketProblem refuses what would not read back, and passes a good ticket (check dropped)', () => {
        expect(ticketProblem(FIELDS)).toBeNull();
        expect(ticketProblem({ ...FIELDS, title: ' ' })).toContain('title');
        expect(ticketProblem({ ...FIELDS, title: 'two\nlines' })).toContain('title');
        expect(ticketProblem({ ...FIELDS, priority: 'unset' })).toContain('priority');
        expect(ticketProblem({ ...FIELDS, found: 'yesterday' })).toContain('Found in');
        expect(ticketProblem({ ...FIELDS, found: 'C-2026-10-10-0057 (chat)' })).toBeNull();
        expect(ticketProblem({ ...FIELDS, detail: '' })).toContain('detail');
        expect(ticketProblem({ ...FIELDS, ticket: '  \n' })).toContain('empty');
        expect(ticketProblem({ ...FIELDS, ticket: 'text\n## 2026-10-11 — ticket: smuggled' })).toContain('opens an entry');
        expect(ticketProblem({ ...FIELDS, ticket: 'text\n**Priority**: high' })).toContain('reads as a field');
    });

    test('ticketKey: 8 hex of sha1(inbox + "\\n" + title), the keys of report section 4 (hash input changed)', () => {
        expect(ticketKey('codegen-panel', 'EditorV2\'s onKeyDown deletes the selection on Backspace typed in a TEXTAREA')).toBe('576ee13a');
        expect(ticketKey('views', 'colour the edges of a coloured viewpoint by source or target')).toMatch(/^[0-9a-f]{8}$/);
        expect(ticketKey('harness', 'a finding')).not.toBe(ticketKey('views', 'a finding'));
    });

    test('frontOfInbox: the file-name rule of the prompt (a mapping row dropped)', () => {
        const rows: [string, string][] = [['ir-graphvertex', 'graphvertex'], ['ir-graphvertex-s4', 'graphvertex'], ['gv-right-margin', 'graphvertex'], ['harness', 'harness'],
            ['merge-gate', 'harness'], ['smoke-baseurl', 'harness'], ['codegen-panel', 'codegen-pilot'], ['codegen', 'codegen-pilot'], ['simulation', 'simulator'],
            ['standalone-environment', 'standalone-editor'], ['views', 'maintenance'], ['jjscript', 'maintenance'], ['harness-x', 'maintenance']];
        for (const [inbox, front] of rows) expect(frontOfInbox(inbox), inbox).toBe(front);
    });

    test('projectTicket: Backlog and open, or Done and closed; `ticket` and the priority, unset when absent; the front\'s milestone', () => {
        expect(projectTicket({ priority: 'high', front: 'harness', fronts: TRACK_FRONTS })).toEqual({ column: 'Backlog', labels: ['priority:high', 'ticket'], milestone: 2, closed: false });
        expect(projectTicket({ priority: null, front: 'maintenance', close: true, fronts: TRACK_FRONTS })).toEqual({ column: 'Done', labels: ['priority:unset', 'ticket'], milestone: 1, closed: true });
    });

    test('the card text: title `ticket: <title>`, body the block then the inbox, the front and the key line', () => {
        expect(ticketTitle('a finding')).toBe('ticket: a finding');
        const body = ticketBody('## 2026-10-11 — ticket: a finding\n**Ticket**: x\n\n', { inbox: 'harness', front: 'harness', key: 'abcd1234' });
        expect(body.startsWith('## 2026-10-11 — ticket: a finding\n**Ticket**: x\n\n---\n')).toBe(true);
        for (const row of ['- Inbox: docs/log-inbox/harness.md', '- Front: harness', '- ticket-key: abcd1234']) expect(body.split('\n')).toContain(row);
    });

    test('parseTicketPlan: skip, close, backlog, an optional front, comments; a bad line or a key twice throws naming the line', () => {
        const plan = parseTicketPlan('# the plan\n576ee13a backlog front maintenance\n\n24e831fe close   # fixed\nd8f3007c skip\n');
        expect([...plan.entries()]).toEqual([['576ee13a', { action: 'backlog', front: 'maintenance' }], ['24e831fe', { action: 'close', front: null }], ['d8f3007c', { action: 'skip', front: null }]]);
        expect(() => parseTicketPlan('576ee13a drop\n')).toThrow('plan line 1');
        expect(() => parseTicketPlan('576ee13a close\n576ee13a skip\n')).toThrow('plan line 2: key 576ee13a given twice');
    });
});

// ── syncTicket against the fake gh ──────────────────────────────────────────

const tmeta = (key: string) => ({ title: 'ticket: a finding', body: '## 2026-10-11 — ticket: a finding\n\n---\n- ticket-key: ' + key + '\n' });
const tcard = (column = 'Backlog', closed = false) => ({ column, labels: ['priority:medium', 'ticket'], milestone: 1, closed });
const LABEL_CREATE = (a: string[]) => a[0] === 'label' && a[1] === 'create';

describe('syncTicket', () => {
    const tsync = (g: ReturnType<typeof ghLab>, key: string, wanted: object, extra: object = {}) =>
        syncTicket(key, wanted, { dir: g.dir, config: { gh: g.gh }, board: BOARD, meta: tmeta(key), ...extra });
    const recOf = (g: ReturnType<typeof ghLab>, key: string) => join(g.dir, 'tickets', key + '.json');

    test('the first card makes the five labels, then the issue with its labels in Backlog; the same card again makes no gh call (labels not made first, difference not computed)', () => {
        const g = ghLab();
        const r = tsync(g, 'abcd1234', tcard());
        expect(r.ok, r.line).toBe(true);
        expect(r.line).toBe('https://github.com/jjodel-modeling/jjodel-lanes/issues/1 · Backlog (priority:medium, ticket)');
        const calls = g.calls();
        expect(calls.filter(LABEL_CREATE).map((a) => a[2])).toEqual(TICKET_LABELS);
        expect(calls.findIndex((a) => a[0] === 'issue' && a[1] === 'create')).toBeGreaterThan(calls.findLastIndex(LABEL_CREATE));
        expect(g.gstate().issues[0]).toMatchObject({ title: 'ticket: a finding', labels: [{ name: 'priority:medium' }, { name: 'ticket' }], milestone: { number: 1, title: 'maintenance' }, state: 'OPEN' });
        expect(g.columnOf(1)).toBe('Backlog');
        const n = g.calls().length;
        expect(tsync(g, 'abcd1234', tcard()).line).toBe(r.line);
        expect(g.calls().length).toBe(n);
        expect(JSON.parse(readFileSync(recOf(g, 'abcd1234'), 'utf8'))).toMatchObject({ key: 'abcd1234', issue: 1, error: null, applied: { column: 'Backlog', milestone: 1 } });
    });

    test('labels the repo has are not made again, and once cached no label call is made (existing labels recreated)', () => {
        const g = ghLab();
        tsync(g, 'abcd1234', tcard());
        rmSync(join(g.dir, 'tickets', 'labels.json'));
        tsync(g, 'beef0001', tcard());
        expect(g.calls().filter(LABEL_CREATE)).toHaveLength(5);
        expect(g.calls().filter((a) => a[0] === 'label' && a[1] === 'list')).toHaveLength(2);
        tsync(g, 'beef0002', tcard());
        expect(g.calls().filter((a) => a[0] === 'label' && a[1] === 'list')).toHaveLength(2);
    });

    test('a lost record is healed by its key line, never by a second create, and not by another ticket of the same title (key line not read)', () => {
        const g = ghLab();
        tsync(g, 'abcd1234', tcard());
        tsync(g, 'beef0001', tcard());
        unlinkSync(recOf(g, 'beef0001'));
        const r = tsync(g, 'beef0001', tcard('Done', true));
        expect(r.ok, r.line).toBe(true);
        expect(r.line).toBe('https://github.com/jjodel-modeling/jjodel-lanes/issues/2 · Done (priority:medium, ticket), closed');
        expect(g.writes().filter((a) => a[1] === 'create')).toHaveLength(2);
        expect(g.calls().some((a) => a[0] === 'issue' && a[1] === 'list' && a.includes('--label') && a.includes('ticket'))).toBe(true);
        expect(g.gstate().issues.map((i: { state: string }) => i.state)).toEqual(['OPEN', 'CLOSED']);
        expect(g.columnOf(2)).toBe('Done');
        expect(JSON.parse(readFileSync(recOf(g, 'beef0001'), 'utf8')).healed).toBeTruthy();
    });

    test('a gh failure is one line and the record\'s error, and it never throws (fail open dropped)', () => {
        const g = ghLab('fail');
        const r = tsync(g, 'abcd1234', tcard());
        expect(r).toMatchObject({ ok: false, line: 'tracking skipped: gh project view: error connecting to api.github.com' });
        expect(JSON.parse(readFileSync(recOf(g, 'abcd1234'), 'utf8')).error).toBe('gh project view: error connecting to api.github.com');
    });

    test('a dry run reads, writes nothing, and lists the label and issue writes it would make', () => {
        const g = ghLab();
        const r = tsync(g, 'abcd1234', tcard(), { dryRun: true });
        expect(r.ok, r.line).toBe(true);
        expect(r.line).toMatch(/^dry run: gh label create ticket --repo jjodel-modeling\/jjodel-lanes .*; gh issue create --repo jjodel-modeling\/jjodel-lanes --title "ticket: a finding" --body <body> --milestone maintenance --label priority:medium --label ticket; /);
        expect(g.calls().filter((a) => WRITES.test(a.join(' ')) || LABEL_CREATE(a))).toEqual([]);
        expect(existsSync(recOf(g, 'abcd1234'))).toBe(false);
        expect(existsSync(join(g.dir, 'tickets', 'labels.json'))).toBe(false);
    });

    test('trackTicket: without config.json tracking is off and no gh call is made (enable switch dropped)', () => {
        const g = ghLab();
        const t = { block: '## 2026-10-11 — ticket: a finding\n', title: 'a finding', inbox: 'harness', front: 'harness', priority: 'low', fronts: TRACK_FRONTS };
        expect(trackTicket('abcd1234', t, { dir: g.dir, board: BOARD }).line).toBe('tracking off (no ' + join(g.dir, 'config.json') + ')');
        expect(g.calls()).toEqual([]);
    });
});

// ── lane-run ticket ──────────────────────────────────────────────────────────

/** A throwaway HOME with tracking on and the fake gh, and a git repo on branch trunkx as the caller's worktree. */
function ticketLab(mode = '') {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'lane-ticket-')));
    dirs.push(root);
    const home = join(root, 'home');
    const state = join(root, 'state');
    const repo = join(root, 'repo');
    const tracking = join(home, '.jjodel-lanes', '_tracking');
    for (const d of [state, repo, tracking]) mkdirSync(d, { recursive: true });
    writeFileSync(join(tracking, 'config.json'), '{}\n');
    const gh = join(state, 'gh');
    writeFileSync(gh, `#!/bin/sh\nexec '${process.execPath}' '${FAKE_GH}' "$@"\n`);
    chmodSync(gh, 0o755);
    const env = { HOME: home, PATH: '/usr/bin:/bin', LANE_TRACK_GH: gh, FAKE_GH_STATE: state, LANE_RUN_NOW: '2026-10-11T12:00', ...(mode ? { FAKE_GH_MODE: mode } : {}) };
    const git = (...args: string[]) => {
        const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: repo, env, encoding: 'utf8' });
        if (r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + r.stderr);
        return r.stdout;
    };
    git('init', '-q', '-b', 'trunkx');
    const put = (rel: string, text: string) => {
        mkdirSync(dirname(join(repo, rel)), { recursive: true });
        writeFileSync(join(repo, rel), text);
    };
    const run = (args: string[]) => spawnSync(process.execPath, [LANE_RUN, 'ticket', ...args], { cwd: repo, env, encoding: 'utf8', timeout: 60000 });
    const calls = (): string[][] => (existsSync(join(state, 'gh-calls.jsonl')) ? readFileSync(join(state, 'gh-calls.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map((x) => JSON.parse(x)) : []);
    const writes = () => calls().filter((a) => WRITES.test(a.join(' ')) || LABEL_CREATE(a));
    const gstate = () => JSON.parse(readFileSync(join(state, 'gh.json'), 'utf8'));
    const columnOf = (n: number) => {
        const s = gstate();
        return String(s.status[s.items[s.issues.find((i: { number: number }) => i.number === n).url]] || '').replace(/^opt-/, '');
    };
    return { root, repo, tracking, git, put, run, calls, writes, gstate, columnOf };
}

const cardLines = (out: string) => out.split('\n').filter((x) => x.startsWith('card: '));

describe('lane-run ticket: one ticket', () => {
    const args = (lab: ReturnType<typeof ticketLab>, extra: string[] = []) => {
        const body = join(lab.root, 'body.md');
        writeFileSync(body, 'The finding, measured on a fixture.\nIts second line.\n');
        return ['--front', 'maintenance', '--priority', 'medium', '--found', 'P-2026-10-11-1017', '--title', 'a ticket filed by the CLI', '--body-file', body, ...extra];
    };

    test('appends the block to a new inbox of the front, uncommitted, and files its card in Backlog; a rerun writes neither again (inbox not written, card duplicated)', () => {
        const lab = ticketLab();
        const r = lab.run(args(lab));
        expect(r.status, r.stderr).toBe(0);
        const inbox = readFileSync(join(lab.repo, 'docs/log-inbox/maintenance.md'), 'utf8');
        expect(inbox.startsWith('# log-inbox — lane «maintenance»\n')).toBe(true);
        const block = '## 2026-10-11 — ticket: a ticket filed by the CLI\n**Ticket**: The finding, measured on a fixture.\nIts second line.\n**Priority**: medium\n**Found in**: P-2026-10-11-1017\n';
        expect(inbox.endsWith('---\n\n' + block)).toBe(true);
        for (const e of splitLog(inbox).entries) expect(lintEntry(e, new Set()).findings).toEqual([]);
        expect(lab.git('status', '--porcelain')).toBe('?? docs/\n');
        expect(cardLines(r.stdout)).toEqual(['card: https://github.com/jjodel-modeling/jjodel-lanes/issues/1 · Backlog (priority:medium, ticket)']);
        const issue = lab.gstate().issues[0];
        expect(issue).toMatchObject({ title: 'ticket: a ticket filed by the CLI', milestone: { number: 1, title: 'maintenance' } });
        expect(issue.body).toContain(block.trimEnd());
        expect(issue.body).toContain('- Inbox: docs/log-inbox/maintenance.md');
        expect(issue.body).toContain('- ticket-key: ' + ticketKey('maintenance', 'a ticket filed by the CLI'));
        expect(lab.columnOf(1)).toBe('Backlog');
        const n = lab.calls().length;
        const again = lab.run(args(lab));
        expect(again.status, again.stderr).toBe(0);
        expect(again.stdout).toContain('already holds this ticket');
        expect(readFileSync(join(lab.repo, 'docs/log-inbox/maintenance.md'), 'utf8')).toBe(inbox);
        expect(lab.gstate().issues).toHaveLength(1);
        expect(lab.calls().length).toBe(n);
    });

    test('--inbox names another inbox, appended after its last entry', () => {
        const lab = ticketLab();
        lab.put('docs/log-inbox/harness.md', '# log-inbox — lane «harness»\n\n---\n\n## 2026-10-10 — ticket: an older one\n**Ticket**: x\n**Priority**: low\n**Found in**: P-2026-10-10-1612\n');
        const r = lab.run(args(lab, ['--inbox', 'harness']));
        expect(r.status, r.stderr).toBe(0);
        const blocks = parseTicketBlocks(readFileSync(join(lab.repo, 'docs/log-inbox/harness.md'), 'utf8'));
        expect(blocks.map((b: { title: string }) => b.title)).toEqual(['an older one', 'a ticket filed by the CLI']);
        expect(lab.gstate().issues[0].body).toContain('- Inbox: docs/log-inbox/harness.md');
    });

    test('gh exits 1: the block is written all the same, exit 0, and the card line says why (fail open dropped)', () => {
        const lab = ticketLab('fail');
        const r = lab.run(args(lab));
        expect(r.status, r.stderr).toBe(0);
        expect(parseTicketBlocks(readFileSync(join(lab.repo, 'docs/log-inbox/maintenance.md'), 'utf8'))).toHaveLength(1);
        expect(cardLines(r.stdout)).toEqual(['card: tracking skipped: gh project view: error connecting to api.github.com']);
    });

    test('refused before anything is written: an unknown front, a priority outside the three, a missing --title', () => {
        const lab = ticketLab();
        for (const bad of [['--front', 'nope'], ['--priority', 'unset']]) {
            const a = args(lab);
            a[a.indexOf(bad[0]) + 1] = bad[1];
            const r = lab.run(a);
            expect(r.status, bad.join(' ')).toBe(2);
        }
        const a = args(lab);
        a.splice(a.indexOf('--title'), 2);
        expect(lab.run(a).status).toBe(2);
        expect(existsSync(join(lab.repo, 'docs'))).toBe(false);
        expect(lab.calls()).toEqual([]);
    });
});

describe('lane-run ticket --backfill', () => {
    const A = ['## 2026-10-11 — ticket: a pool keeps its old position', '**Ticket**: a.', '**Priority**: high', '**Found in**: P-2026-10-11-0040'];
    const B = ['## 2026-10-02 — ticket: a lane removes the link', '**Ticket**: b.', '**Priority**: low', '**Found in**: P-2026-10-02-2315 (chat C-2026-10-01-2220)'];
    const C = ['## 2026-10-04 — ticket: no priority here', '**Ticket**: c.', '**Found in**: P-2026-10-04-0946'];
    const D = ['## 2026-10-03 — ticket: skipped by the plan', '**Ticket**: d.', '**Priority**: medium', '**Found in**: P-2026-10-03-1300'];
    const key = (inbox: string, b: string[]) => ticketKey(inbox, b[0].replace(/^## \S+ — ticket: /, ''));

    /** The trunk (trunkx) carries four blocks and the prompt of A, Front: graphvertex; the worktree adds a fifth, uncommitted. */
    function backfillLab(mode = '') {
        const lab = ticketLab(mode);
        lab.put('docs/log-inbox/harness.md', '# head\n\n---\n\n' + A.join('\n') + '\n\n' + B.join('\n') + '\n');
        lab.put('docs/log-inbox/views.md', '# head\n\n---\n\n' + C.join('\n') + '\n\n' + D.join('\n') + '\n');
        lab.put('docs/prompts/claude_2026-10-11_0040_prompt_gv_right_margin.md', '# A graphVertex lane\n\nPrompt-ID: P-2026-10-11-0040\nChat: C-2026-10-10-0057\nLane: full\nFront: graphvertex\nStatus: da eseguire\n\n## COSA\n');
        lab.git('add', '-A');
        lab.git('commit', '-q', '-m', 'fixture');
        lab.git('checkout', '-q', '-b', 'lane');
        lab.put('docs/log-inbox/views.md', readFileSync(join(lab.repo, 'docs/log-inbox/views.md'), 'utf8') + '\n## 2026-10-11 — ticket: only in the worktree\n**Ticket**: e.\n**Priority**: low\n**Found in**: P-2026-10-11-1017\n');
        lab.put('plan.txt', '# GO of the fixture\n' + key('views', D) + ' skip\n' + key('harness', B) + ' close front maintenance   # fixed on the trunk\n');
        return lab;
    }

    test('a dry run reads the trunk\'s inboxes, prints one line per block and the count, and writes nothing', () => {
        const lab = backfillLab();
        const r = lab.run(['--backfill', '--from', 'trunkx', '--plan', 'plan.txt', '--dry-run']);
        expect(r.status, r.stderr).toBe(0);
        const lines = r.stdout.split('\n').filter((x) => x.startsWith('ticket '));
        expect(lines.map((x) => x.split(':')[0] + ':' + x.split(':')[1].split(' ')[0])).toEqual([
            'ticket ' + key('harness', A) + ' harness:5', 'ticket ' + key('harness', B) + ' harness:10', 'ticket ' + key('views', C) + ' views:5', 'ticket ' + key('views', D) + ' views:9',
        ]);
        expect(r.stdout).toContain('backfill (dry run): 4 ticket blocks at trunkx; 2 Backlog, 1 closed, 1 skipped; 0 without a card');
        expect(lab.writes()).toEqual([]);
        expect(existsSync(join(lab.tracking, 'tickets', key('harness', A) + '.json'))).toBe(false);
    });

    test('the real run: the Front: of the Found-in prompt, else the inbox name, the plan\'s skip, close and front; priority:unset; a rerun writes nothing (Front: line not read, plan not applied, card duplicated)', () => {
        const lab = backfillLab();
        const r = lab.run(['--backfill', '--from', 'trunkx', '--plan', 'plan.txt']);
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain('backfill: 4 ticket blocks at trunkx; 2 Backlog, 1 closed, 1 skipped; 0 without a card');
        const issues = lab.gstate().issues;
        expect(issues.map((i: { title: string }) => i.title)).toEqual(['ticket: a pool keeps its old position', 'ticket: a lane removes the link', 'ticket: no priority here']);
        expect(issues.map((i: { milestone: { title: string } }) => i.milestone.title)).toEqual(['graphvertex', 'maintenance', 'maintenance']);
        expect(issues.map((i: { labels: { name: string }[] }) => i.labels.map((l) => l.name).join(','))).toEqual(['priority:high,ticket', 'priority:low,ticket', 'priority:unset,ticket']);
        expect(issues.map((i: { state: string }) => i.state)).toEqual(['OPEN', 'CLOSED', 'OPEN']);
        expect([1, 2, 3].map(lab.columnOf)).toEqual(['Backlog', 'Done', 'Backlog']);
        expect(issues[0].body).toContain(A.join('\n') + '\n\n---\n- Inbox: docs/log-inbox/harness.md\n- Front: graphvertex\n- ticket-key: ' + key('harness', A));
        const n = lab.writes().length;
        const again = lab.run(['--backfill', '--from', 'trunkx', '--plan', 'plan.txt']);
        expect(again.status, again.stderr).toBe(0);
        expect(lab.writes().length).toBe(n);
        expect(lab.gstate().issues).toHaveLength(3);
    });

    test('a plan naming a key no block has, or an unknown front, is refused before any gh call (plan not checked whole)', () => {
        const lab = backfillLab();
        lab.put('plan.txt', key('harness', A) + ' close\n0000beef skip\n');
        expect(lab.run(['--backfill', '--from', 'trunkx', '--plan', 'plan.txt']).status).toBe(2);
        lab.put('plan.txt', key('harness', A) + ' backlog front nowhere\n');
        expect(lab.run(['--backfill', '--from', 'trunkx', '--plan', 'plan.txt']).status).toBe(2);
        expect(lab.calls()).toEqual([]);
    });

    test('gh exits 1: every block is one skipped line, the count says so, exit 0 (fail open dropped)', () => {
        const lab = backfillLab('fail');
        const r = lab.run(['--backfill', '--from', 'trunkx']);
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout).toContain('backfill: 4 ticket blocks at trunkx; 4 Backlog, 0 closed, 0 skipped; 4 without a card');
    });
});
