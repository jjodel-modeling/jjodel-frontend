import { describe, test, expect, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    buildIndex, LogAccumulator, parseCheck, parseCommits, parseDecisions, parseLogFile, parsePrompt,
    type LaneInput, type RepoInput, type TraceIndex,
} from '../trace-index.ts';

// The trace indexer (P-2026-09-27-1030, stage 1). Pure parsers per source, then
// the link phase; the CLI on a throwaway repo and lanes folder. The fixtures are
// the shapes measured by the discovery report (docs/discovery/
// discovery_2026-09-27_trace_monitor.md, section 4), misses included. A test name
// states the mutation that turns it red (CLAUDE.md 5).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(HERE, '..', 'trace-index.ts');
// The flags of npm run trace:index: node before 23.6 strips no types without them.
const NODE_TS = ['--disable-warning=ExperimentalWarning', '--experimental-strip-types'];

const dirs: string[] = [];
afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

const prompt = (id: string, extra = '', title = 'A lane') =>
    `# ${title}\n\nPrompt-ID: ${id}\nChat: C-2026-09-26-1702\nLane: fast\nStatus: da eseguire\n${extra}\n## COSA\n\nDo it.\n`;

function repo(over: Partial<RepoInput> = {}): RepoInput {
    return { prompts: [], decisions: null, logs: [], commits: [], trunk: new Set(), ...over };
}

const lane = (id: string, over: Partial<LaneInput> = {}): LaneInput => ({
    id, session: 'sess', worktree: '/w', branch: 'b', repo: 'this', state: 'exited', exit: 0, started: null,
    log: new LogAccumulator().summary(), checks: [], inputs: 1, tier: null, goahead: null, ...over,
});

const keyOf = (i: TraceIndex) => ({
    nodes: i.nodes.map((n) => n.type + ':' + n.id),
    edges: i.edges.map((e) => `${e.type} ${e.from} -> ${e.to}`),
});

// ── prompts ──────────────────────────────────────────────────────────────────

describe('parsePrompt', () => {
    test('kills "the header read past the first ##", "Chat not read", "the Status sha not read": the four fields, the title and the sha of the Status line', () => {
        const p = parsePrompt('docs/prompts/claude_2026-09-27_1030_prompt_x.md',
            '# Trace monitor\n\nPrompt-ID: P-2026-09-27-1030\nChat: C-2026-09-27-1030\nLane: full (more than three files)\nStatus: eseguito 2026-09-27 · lane harness-trace · 409eec764 (discovery only)\n\n## COSA\n\nChat: C-2000-01-01-0000\n');
        expect(p.id).toBe('P-2026-09-27-1030');
        expect(p.title).toBe('Trace monitor');
        expect(p.chat).toBe('C-2026-09-27-1030');
        expect(p.laneKind).toBe('full');
        expect(p.status).toBe('eseguito');
        expect(p.statusSha).toBe('409eec764');
        expect(p.misses).toEqual([]);
    });

    test('kills "the strict id pattern of lane-run": a Prompt-ID with a trailing annotation, or behind a #, still names the prompt', () => {
        expect(parsePrompt('docs/prompts/claude_2026-09-25_1905_fase2_x.md', prompt('P-2026-09-25-1905 (Phase 2 of `claude_2026-09-25_1905_prompt_x.md`)')).id).toBe('P-2026-09-25-1905');
        expect(parsePrompt('docs/prompts/claude_2026-09-18_2219_prompt_x.md', '# Prompt-ID: P-2026-09-18-2219\n\n## COSA\n').id).toBe('P-2026-09-18-2219');
    });

    test('kills "a backticked Status sha missed": the sha of `Status: eseguito (…, `fb876efaa`)`', () => {
        const p = parsePrompt('docs/prompts/claude_2026-09-22_2105_prompt_x.md', '# X\n\nPrompt-ID: P-2026-09-22-2105\nStatus: eseguito (2026-09-23, lane default-view-parity, `fb876efaa`)\n\n## COSA\n');
        expect(p.statusSha).toBe('fb876efaa');
    });

    test('kills "a missing field not reported", "misses reported before the rule": no Chat, Lane or Status is a miss from 2026-09-17, not before', () => {
        const p = parsePrompt('docs/prompts/claude_2026-09-19_1610_prompt_x.md', '# X\n\nPrompt-ID: P-2026-09-19-1610\n\n## COSA\n');
        expect(p.misses.map((m) => m.reason).sort()).toEqual(['no Chat: line', 'no Lane: line', 'no Status: line']);
        const old = parsePrompt('docs/prompts/claude_2026-09-10_1000_prompt_x.md', '# X\n\nnothing\n');
        expect(old.id).toBeNull();
        expect(old.misses).toEqual([]);
        const late = parsePrompt('docs/prompts/claude_2026-09-17_1024_prompt_x.md', '# X\n\nnothing\n');
        expect(late.misses.map((m) => m.reason)).toEqual(['no Prompt-ID in the header']);
    });
});

// ── decisions ────────────────────────────────────────────────────────────────

const REGISTER = [
    '# Decisions',
    '',
    '### Ratifiche 2026-09-26: orchestrated lanes (RC-20..24)',
    '',
    'Source: `docs/ratifiche/x.md`, ratified by Alfonso in chat C-2026-09-26-1702.',
    '',
    '- **RC-20** (2026-09-26): **The chat launches.** Text.',
    '- **RC-21** (2026-09-26): **Adopted.** From P-2026-09-26-1640 only.',
    '',
    '### Loose',
    '',
    '- **RC-14** (2026-09-21): **No source.** Text.',
    '- **R-X-1** (2026-09-27, provisional, evidence: nonsense): **Bad header.**',
    '- **R-A** (2026-09-27): a near miss.',
    '',
].join('\n');

describe('parseDecisions', () => {
    test('kills "the section preamble not read", "the body not preferred": a row cites its body ids, else those of its section preamble', () => {
        const d = parseDecisions('docs/decisions.md', REGISTER);
        const byId = new Map(d.rows.map((r) => [r.id, r]));
        expect(byId.get('RC-20')!.sources).toEqual(['C-2026-09-26-1702']);
        expect(byId.get('RC-21')!.sources).toEqual(['P-2026-09-26-1640']);
        expect(byId.get('RC-20')!.confidence).toBe('ratified');
    });

    test('kills "one bad header loses the register", "a near miss dropped silently", "a sourceless row not reported": the other rows parse, and each problem is a miss', () => {
        const d = parseDecisions('docs/decisions.md', REGISTER);
        expect(d.rows.map((r) => r.id).sort()).toEqual(['RC-14', 'RC-20', 'RC-21']);
        const reasons = d.misses.map((m) => m.source.replace(/^docs\/decisions\.md:/, '') + ' ' + m.reason.split(':')[0]);
        expect(reasons).toContain('13 row header');
        expect(reasons).toContain('14 near miss');
        expect(reasons).toContain('12 no prompt or chat cited');
    });
});

// ── log entries ──────────────────────────────────────────────────────────────

const ENTRY = (heading: string, fields: string) => `## ${heading}\n${fields}\n`;
const TASK = ENTRY('2026-09-26 — fix: a thing (P-2026-09-25-1905)',
    '**Prompt**: x\n**Outcome**: ✅ completed\n**Corregge**: 2026-09-25 14:40\n**Causa**: (c)\n**Smoke visivo**: passato — chat\n**Prompt document name**: 2026-09-25 19:05');
const TICKET = ENTRY('2026-09-26 — ticket: a finding', '**Ticket**: t\n**Priority**: high\n**Found in**: P-2026-09-25-1905, chat C-2026-09-25-1353');
const ORPHAN = ENTRY('2026-09-26 — fix: an observation', '**Prompt**: y\n**Corregge**: 2026-09-26 11:00 (observation of chat C-2026-09-26-1100)\n**Prompt document name**: 2026-09-26 16:15');

describe('parseLogFile', () => {
    test('kills "the heading id not stable": the same entry in an inbox and in the archive has the same id', () => {
        const a = parseLogFile('docs/log-inbox/views.md', '# Inbox\n\n' + TASK);
        const b = parseLogFile('docs/claude-code-log-archive.md', '# Archive\n\npreamble\n\n' + TICKET + '\n' + TASK);
        expect(a.entries[0].id).toBe(b.entries[1].id);
        expect(a.entries[0].id).toMatch(/^log:[0-9a-f]{10}$/);
        expect(b.entries[1].line).toBe(10);
    });

    test('kills "Prompt document name not linked", "Corregge not linked", "Found in not linked": the three references, as Prompt-IDs and chat ids', () => {
        const [task, ticket] = parseLogFile('docs/claude-code-log.md', TASK + '\n' + TICKET).entries;
        expect(task.kind).toBe('task');
        expect(task.reports).toBe('P-2026-09-25-1905');
        expect(task.corrects).toBe('P-2026-09-25-1440');
        expect(task.smoke).toBe('passato');
        expect(ticket.kind).toBe('ticket');
        expect(ticket.priority).toBe('high');
        expect(ticket.foundIn).toEqual(['P-2026-09-25-1905', 'C-2026-09-25-1353']);
    });
});

// ── commits ──────────────────────────────────────────────────────────────────

const commit = (sha: string, parents: string, date: string, subject: string, body: string) =>
    [sha, parents, date, subject, `${subject}\n\n${body}`].join('\x1f') + '\x1e';

describe('parseCommits', () => {
    test('kills "Model read as a git trailer only", "Claude-Session not read": a Model line before a blank line counts', () => {
        const [c] = parseCommits(commit('a'.repeat(40), 'b'.repeat(40), '2026-09-27T01:00:00+02:00', 'fix: x (P-2026-09-27-0120)',
            'Body.\n\nModel: Anthropic Claude Opus 5.5\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_1'));
        expect(c.models).toEqual(['Anthropic Claude Opus 5.5']);
        expect(c.sessions).toEqual(['https://claude.ai/code/session_1']);
        expect(c.prompts).toEqual(['P-2026-09-27-0120']);
        expect(c.merge).toBe(false);
    });

    test('kills "body ids counted beside the subject", "the body ignored": the subject ids win, the body only when the subject has none', () => {
        const [s, b] = parseCommits(
            commit('1'.repeat(40), '2'.repeat(40), '2026-09-27T01:00:00+02:00', 'docs: close (P-2026-09-27-0120)', 'As the report of P-2026-09-26-1640 says.') +
            commit('3'.repeat(40), '4'.repeat(40), '2026-09-27T01:00:00+02:00', 'docs: close', 'For P-2026-09-27-0035.'),
        );
        expect(s.prompts).toEqual(['P-2026-09-27-0120']);
        expect(b.prompts).toEqual(['P-2026-09-27-0035']);
        expect(b.promptsFrom).toBe('body');
    });

    test('kills "decision ranges not expanded": R-SIM-73..76 names four rows, RC-30 one', () => {
        const [c] = parseCommits(commit('5'.repeat(40), '6'.repeat(40), '2026-09-27T01:00:00+02:00', 'docs: decide R-SIM-73..76 and RC-30', ''));
        expect(c.decisions).toEqual(['R-SIM-73', 'R-SIM-74', 'R-SIM-75', 'R-SIM-76', 'RC-30']);
    });
});

// ── lane logs ────────────────────────────────────────────────────────────────

const ev = (o: object) => JSON.stringify(o) + '\n';
const LOG = [
    ev({ type: 'system', subtype: 'init', session_id: 's', model: 'claude-opus-5-5' }),
    ev({ type: 'assistant', timestamp: '2026-09-27T08:00:00.000Z', message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'git status', description: 'Show status' } }] } }),
    ev({ type: 'system', subtype: 'thinking_tokens', estimated_tokens: 5 }),
    ev({ type: 'assistant', timestamp: '2026-09-27T08:05:00.000Z', message: { content: [{ type: 'text', text: 'Report.\n\nOutcome: hard-stop' }] } }),
    ev({ type: 'result', subtype: 'success', total_cost_usd: 1.5, num_turns: 3 }),
    ev({ type: 'system', subtype: 'init', session_id: 's', model: 'claude-opus-5-5' }),
    ev({ type: 'user', timestamp: '2026-09-27T09:00:00.000Z', message: { content: [{ type: 'tool_result', content: 'ok' }] } }),
    ev({ type: 'assistant', timestamp: '2026-09-27T09:10:00.000Z', message: { content: [{ type: 'tool_use', name: 'Edit', input: { file_path: '/w/frontend/a.ts' } }, { type: 'text', text: 'Done.\nOutcome: done · 1a2b3c4d5' }] } }),
    ev({ type: 'result', subtype: 'success', total_cost_usd: 2.25, num_turns: 4 }),
].join('');

describe('LogAccumulator', () => {
    test('kills "a line split across two reads lost", "runs not counted", "the cost summed", "the suffix refused": the summary of a log fed in pieces equals the one fed whole', () => {
        const whole = new LogAccumulator();
        whole.push(LOG);
        const pieces = new LogAccumulator();
        for (let i = 0; i < LOG.length; i += 37) pieces.push(LOG.slice(i, i + 37));
        expect(pieces.summary()).toEqual(whole.summary());
        const s = whole.summary();
        expect(s.runs).toBe(2);
        expect(s.model).toBe('claude-opus-5-5');
        expect(s.costUsd).toBe(2.25);
        expect(s.toolCalls).toBe(2);
        expect(s.lastTool).toEqual({ name: 'Edit', at: '2026-09-27T09:10:00.000Z', detail: 'a.ts' });
        expect(s.firstEventAt).toBe('2026-09-27T08:00:00.000Z');
        expect(s.lastEventAt).toBe('2026-09-27T09:10:00.000Z');
        expect(s.outcome).toBe('done');
        expect(s.outcomeLine).toBe('Outcome: done · 1a2b3c4d5');
    });

    test('kills "any Outcome word accepted": a line that names no outcome reads unparsed', () => {
        const a = new LogAccumulator();
        a.push(ev({ type: 'assistant', timestamp: 't', message: { content: [{ type: 'text', text: 'Outcome: completed' }] } }));
        expect(a.summary().outcome).toBe('unparsed');
    });
});

describe('parseCheck', () => {
    test('kills "the first EXIT= taken", "a check without EXIT= passes": the last EXIT= and end=, null when absent', () => {
        expect(parseCheck('P-1/probe-a.log', 'PASS x\nEXIT=1\nEXIT=0\nend=2026-09-27T10:00\n')).toEqual({ id: 'P-1/probe-a.log', exit: 0, end: '2026-09-27T10:00' });
        expect(parseCheck('P-1/probe-b.log', 'PASS x\n')).toEqual({ id: 'P-1/probe-b.log', exit: null, end: null });
    });
});

// ── the link phase ───────────────────────────────────────────────────────────

const FULL = 'c'.repeat(40);

function fixture(): { repo: RepoInput; lanes: LaneInput[] } {
    const p1 = parsePrompt('docs/prompts/claude_2026-09-25_1905_prompt_a.md', prompt('P-2026-09-25-1905', '', 'Phase 1'));
    const p2 = parsePrompt('docs/prompts/claude_2026-09-25_1905_fase2_a.md', prompt('P-2026-09-25-1905 (Phase 2)', '', 'Phase 2'));
    const merge = parsePrompt('docs/prompts/claude_2026-09-27_0345_prompt_merge.md', prompt('P-2026-09-27-0345').replace('Status: da eseguire', 'Status: eseguito 2026-09-27 · lane merge · ccccccccc'));
    const ghost = parsePrompt('docs/prompts/claude_2026-09-27_0400_prompt_g.md', prompt('P-2026-09-27-0400').replace('Status: da eseguire', 'Status: eseguito 2026-09-27 · lane fast · 0badc0ffe'));
    return {
        repo: repo({
            prompts: [merge, p2, ghost, p1],
            decisions: parseDecisions('docs/decisions.md', REGISTER),
            logs: [parseLogFile('docs/claude-code-log.md', TASK + '\n' + TICKET + '\n' + ORPHAN)],
            commits: parseCommits(
                commit(FULL, 'a'.repeat(40) + ' ' + 'b'.repeat(40), '2026-09-27T04:00:00+02:00', 'merge: profiles (P-2026-09-25-1905)', '') +
                commit('d'.repeat(40), 'e'.repeat(40), '2026-09-27T05:00:00+02:00', 'docs: checkpoint, RC-20', 'Model: x'),
            ),
            trunk: new Set([FULL]),
        }),
        lanes: [lane('P-2026-09-25-1905', { checks: [{ id: 'P-2026-09-25-1905/probe-a.log', exit: 0, end: null }] }), lane('P-2026-09-27-0030', { repo: 'foreign' })],
    };
}

describe('buildIndex', () => {
    test('kills "Phase 2 file makes a second prompt", "the merge prompt linked by its subject only", "a short Status sha not resolved", "an unknown sha linked": prompts by id, closedBy by sha prefix', () => {
        const { repo: r, lanes } = fixture();
        const i = buildIndex(r, lanes);
        const p = i.nodes.find((n) => n.type === 'prompt' && n.id === 'P-2026-09-25-1905')!;
        expect(p.files).toEqual(['docs/prompts/claude_2026-09-25_1905_fase2_a.md', 'docs/prompts/claude_2026-09-25_1905_prompt_a.md']);
        const k = keyOf(i);
        expect(k.edges).toContain(`closedBy prompt:P-2026-09-27-0345 -> commit:${FULL}`);
        expect(k.edges).toContain(`cites commit:${FULL} -> prompt:P-2026-09-25-1905`);
        expect(k.edges.filter((e) => e.startsWith('closedBy prompt:P-2026-09-27-0400'))).toEqual([]);
        expect(i.misses.map((m) => m.reason)).toContain('Status sha 0badc0ffe is not a known commit');
    });

    test('kills "runs not linked", "measures not linked", "a foreign lane not reported", "chats only from prompts": the lane edges, and chat nodes from every reference', () => {
        const { repo: r, lanes } = fixture();
        const i = buildIndex(r, lanes);
        const k = keyOf(i);
        expect(k.edges).toContain('runs lane:P-2026-09-25-1905 -> prompt:P-2026-09-25-1905');
        expect(k.edges).toContain('measures check:P-2026-09-25-1905/probe-a.log -> lane:P-2026-09-25-1905');
        expect(i.misses.find((m) => m.type === 'lane')!.reason).toMatch(/no prompt P-2026-09-27-0030 in this repo \(the lane ran in another repository\)/);
        expect(k.nodes).toContain('chat:C-2026-09-25-1353');
        expect(k.edges).toContain('foundIn logEntry:' + parseLogFile('x', TICKET).entries[0].id + ' -> chat:C-2026-09-25-1353');
    });

    test('kills "a dangling Corregge kept as an edge", "a decision cited by a commit subject not linked": the observation of a chat is a miss, RC-20 is linked', () => {
        const { repo: r, lanes } = fixture();
        const i = buildIndex(r, lanes);
        expect(i.misses.map((m) => m.reason)).toContain('Corregge names P-2026-09-26-1100, no such prompt');
        expect(keyOf(i).edges).toContain(`citesDecision commit:${'d'.repeat(40)} -> decision:RC-20`);
        expect(keyOf(i).edges.some((e) => e.includes('P-2026-09-26-1100'))).toBe(false);
    });

    test('kills "the order of the sources leaks into the index": shuffled inputs give the same JSON, nodes and edges sorted by id', () => {
        const a = fixture();
        const b = fixture();
        b.repo.prompts.reverse();
        b.repo.commits.reverse();
        b.lanes.reverse();
        const x = JSON.stringify(buildIndex(a.repo, a.lanes));
        expect(JSON.stringify(buildIndex(b.repo, b.lanes))).toBe(x);
        const i = buildIndex(a.repo, a.lanes);
        const ids = i.nodes.map((n) => n.type + ':' + n.id);
        expect(ids).toEqual([...ids].sort());
    });
});

// ── the CLI ──────────────────────────────────────────────────────────────────

function git(cwd: string, args: string[]) {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid', GIT_AUTHOR_DATE: '2026-09-27T10:00:00+02:00', GIT_COMMITTER_DATE: '2026-09-27T10:00:00+02:00' } });
    if (r.status !== 0) throw new Error(r.stderr);
    return r.stdout.trim();
}

function tree() {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'trace-index-')));
    dirs.push(root);
    const r = join(root, 'repo');
    const lanes = join(root, 'lanes');
    mkdirSync(join(r, 'docs', 'prompts'), { recursive: true });
    mkdirSync(join(r, 'docs', 'log-inbox'), { recursive: true });
    writeFileSync(join(r, 'docs', 'prompts', 'claude_2026-09-25_1905_prompt_a.md'), prompt('P-2026-09-25-1905'));
    writeFileSync(join(r, 'docs', 'decisions.md'), REGISTER);
    writeFileSync(join(r, 'docs', 'claude-code-log.md'), '# Log\n\n' + TASK);
    git(r, ['init', '-q', '-b', 'alfonso-frontend-jjtl']);
    git(r, ['add', 'docs']);
    git(r, ['commit', '-q', '-m', 'docs: add prompt (P-2026-09-25-1905)', '-m', 'Model: t']);
    const l = join(lanes, 'P-2026-09-25-1905');
    mkdirSync(l, { recursive: true });
    writeFileSync(join(l, 'log.jsonl'), LOG);
    writeFileSync(join(l, 'exit.txt'), '0\n');
    writeFileSync(join(l, 'worktree.txt'), r + '\n');
    writeFileSync(join(l, 'session.txt'), 's\n');
    writeFileSync(join(l, 'input-1.md'), 'x');
    writeFileSync(join(l, 'probe-a.log'), 'EXIT=0\n');
    mkdirSync(join(lanes, '_msgs'), { recursive: true });
    return { root, repo: r, lanes };
}

describe('trace-index.ts', () => {
    test('kills "sources without hash or presence", "no HEAD", "two runs differ", "--out ignored": the CLI on a throwaway repo writes the same snapshot twice', () => {
        const t = tree();
        const out1 = join(t.root, 'one.json');
        const out2 = join(t.root, 'two.json');
        const run = (out: string) => spawnSync(process.execPath, [...NODE_TS, SCRIPT, '--repo', t.repo, '--lanes', t.lanes, '--out', out], { encoding: 'utf8' });
        const a = run(out1);
        expect(a.status, a.stderr).toBe(0);
        expect(run(out2).status).toBe(0);
        expect(readFileSync(out2, 'utf8')).toBe(readFileSync(out1, 'utf8'));
        const i: TraceIndex = JSON.parse(readFileSync(out1, 'utf8'));
        expect(i.schema).toBe('jjodel-trace/1');
        expect(i.head).toBe(git(t.repo, ['rev-parse', 'HEAD']));
        const dec = i.sources.find((s) => s.path === 'docs/decisions.md')!;
        expect(dec.present).toBe(true);
        expect(dec.hash).toMatch(/^[0-9a-f]{40}$/);
        const inbox = i.sources.find((s) => s.path === 'docs/claude-code-log-archive.md')!;
        expect(inbox).toEqual({ path: 'docs/claude-code-log-archive.md', present: false, hash: null });
        expect(i.sources.some((s) => s.path.endsWith('P-2026-09-25-1905/log.jsonl') && s.present)).toBe(true);
        const k = keyOf(i);
        expect(k.nodes).toContain('lane:P-2026-09-25-1905');
        expect(k.nodes.some((n) => n.startsWith('lane:_'))).toBe(false);
        expect(k.edges).toContain('runs lane:P-2026-09-25-1905 -> prompt:P-2026-09-25-1905');
        const ln = i.nodes.find((n) => n.type === 'lane')!;
        expect(ln.repo).toBe('this');
        expect(ln.branch).toBe('alfonso-frontend-jjtl');
        expect(ln.outcome).toBe('done');
        expect(ln.inputs).toBe(1);
    });

    test('kills "stdout silent without --out": without --out the index goes to stdout, with the counts on stderr', () => {
        const t = tree();
        const r = spawnSync(process.execPath, [...NODE_TS, SCRIPT, '--repo', t.repo, '--lanes', t.lanes], { encoding: 'utf8' });
        expect(r.status, r.stderr).toBe(0);
        expect(JSON.parse(r.stdout).schema).toBe('jjodel-trace/1');
        expect(r.stderr).toMatch(/^nodes \d+: /m);
    });
});
