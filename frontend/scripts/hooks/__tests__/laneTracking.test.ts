import { describe, test, expect, afterAll } from 'vitest';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
        expect(FRONT_FROM).toBe('P-2026-10-10-1500');
        expect(frontProblem(prompt('P-2026-10-10-1459', ['Lane: fast']), 'P-2026-10-10-1459', FRONTS)).toBeNull();
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

const LANE = 'P-2026-10-10-1600';
const TRACK_FRONTS = [
    { slug: 'maintenance', state: 'open', milestone: 1 },
    { slug: 'harness', state: 'open', milestone: 2 },
];
const FILE = '/t/docs/prompts/claude_2026-10-10_1600_prompt_feature.md';

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

    test('`hard-stop` of a discovery before any GO is In review + waiting:phase-2, never Done (hard-stop mapped to Done)', () => {
        const disc = lanePrompt('# Lane tracking on GitHub Projects: discovery');
        expect(seen({ outcome: 'Outcome: hard-stop', promptText: disc })).toEqual(card('In review', ['waiting:phase-2']));
    });

    test('`hard-stop` of a discovery named so only by its file is In review + waiting:phase-2 (file name not read)', () => {
        expect(seen({ outcome: 'Outcome: hard-stop', promptFile: '/t/docs/prompts/claude_2026-10-10_1600_prompt_feature_discovery.md' })).toEqual(card('In review', ['waiting:phase-2']));
    });

    test('`hard-stop` of a discovery after its GO is In review + waiting:visual (GO not read)', () => {
        const disc = lanePrompt('# Lane tracking on GitHub Projects: discovery');
        expect(seen({ outcome: 'Outcome: hard-stop', promptText: disc, goSeen: true })).toEqual(card('In review', ['waiting:visual']));
    });

    test('`hard-stop` of any other prompt is In review + waiting:visual, never Done (hard-stop mapped to Done)', () => {
        expect(seen({ outcome: 'Outcome: hard-stop' })).toEqual(card('In review', ['waiting:visual']));
        expect(seen({ outcome: 'Outcome: hard-stop (abc1234)' })).toEqual(card('In review', ['waiting:visual']));
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
        expect(projectLane('P-2026-10-10-1459', { promptText: lanePrompt(), fronts: TRACK_FRONTS }).skip).toContain('before ' + FRONT_FROM);
        expect(seen({ merge: true }).skip).toBe('a merge lane gets no card');
        expect(seen({ promptText: lanePrompt('# Merge', ['Lane: full (merge; zero conflicts measured)']) }).skip).toBe('a merge lane gets no card');
        expect(seen({ promptText: lanePrompt('# No front', ['Lane: fast']) }).skip).toContain('no `Front:` line');
        expect(seen({ promptText: null }).skip).toContain('no prompt file');
    });

    test('inFrontScope: at or after FRONT_FROM and not a merge prompt', () => {
        expect(inFrontScope(lanePrompt(), LANE)).toBe(true);
        expect(inFrontScope(lanePrompt(), 'P-2026-10-10-1459')).toBe(false);
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
