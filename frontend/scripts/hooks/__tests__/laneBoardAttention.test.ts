import { describe, test, expect, afterAll } from 'vitest';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

// lane-board.mjs: /api/attention, /l/<Prompt-ID> and the #lane=<id> mark of the Lanes tab, the board side of the
// menu bar app (P-2026-10-18-2320, slice S1 of discovery P-2026-10-18-2255 §Q1-§Q3). The rule is imported and
// executed on fixtures (CLAUDE.md 5); the routes run on the board as a child process against a fake lanes folder,
// a fake lane-run and a fixture trunk repo, as in laneBoardStrip.test.ts. A test name states the mutation that
// turns it red; the bench that established it is in the commit message.
//
// LANE_BOARD points the suite at another copy of the script (the mutation bench).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.LANE_BOARD ? resolve(process.env.LANE_BOARD) : resolve(HERE, '..', '..', 'lane-board', 'lane-board.mjs');
process.env.LANE_BOARD_PORT = '0';
const lb = await import(pathToFileURL(SCRIPT).href);

const dirs: string[] = [];
const children: ChildProcess[] = [];
afterAll(() => {
    for (const c of children) c.kill('SIGKILL');
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});
const tmp = () => { const d = realpathSync(mkdtempSync(join(tmpdir(), 'lane-board-attn-'))); dirs.push(d); return d; };

type Row = Record<string, any>;
const H = 3600e3;
const NOW = Date.now();
const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (ms: number) => { const d = new Date(ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };

// ── the rule, on rows ────────────────────────────────────────────────────────

const row = (o: Partial<Row>): Row => ({ id: 'P-2026-10-05-0900', state: 'exited', outcome: 'hard-stop', chain: false, live: false, recent: true, kind: 'phase2', title: 'T', chat: '', chatUrl: '', start: NOW - 4 * H, end: NOW - 3 * H, t: NOW - 4 * H, ...o });
type Facts = { status?: Record<string, string>; named?: Record<string, string[]>; commits?: { at: number; subject: string; body: string }[]; closed?: Set<string> };
const facts = (f: Facts = {}) => ({
    status: (id: string) => (f.status || {})[id] || '',
    namedBy: (id: string) => (f.named || {})[id] || [],
    commits: f.commits || [],
    text: (id: string) => ({ firstLine: 'first ' + id, recommended: 'rec ' + id }),
    ...(f.closed ? { closed: f.closed } : {}),
});
const ids = (a: Row) => a.items.map((i: Row) => i.id);

describe('attentionOf: the rule executed on rows', () => {
    test('kills "closure (a) ignored", "da eseguire read as closed", "a missing trunk prompt read as closed": only a Status other than da eseguire closes', () => {
        const rows = [row({ id: 'P-1-a' }), row({ id: 'P-1-b' }), row({ id: 'P-1-c' }), row({ id: 'P-1-d' })];
        const a = lb.attentionOf(rows, facts({ status: { 'P-1-a': 'da eseguire', 'P-1-b': 'eseguito 2026-10-05 · lane x · abc1234', 'P-1-c': 'abbandonato 2026-10-05' } }), NOW);
        expect(ids(a).sort()).toEqual(['P-1-a', 'P-1-d']);
    });

    test('kills "closure (b) ignored": a lane a later one names is closed', () => {
        const a = lb.attentionOf([row({ id: 'P-2-a' }), row({ id: 'P-2-b' })], facts({ named: { 'P-2-a': ['P-2-z'] } }), NOW);
        expect(ids(a)).toEqual(['P-2-b']);
    });

    test('kills "closure (c) ignored", "a commit before the end closes", "docs: add prompt closes": only a later commit, not adding a prompt, closes', () => {
        const end = NOW - 3 * H;
        const rows = [row({ id: 'P-3-a', end }), row({ id: 'P-3-b', end }), row({ id: 'P-3-c', end })];
        const commits = [
            { at: end + 60e3, subject: 'feat(x): something', body: 'Closes the hard stop of P-3-a.\n' },
            { at: end - 60e3, subject: 'fix: y (P-3-b)', body: '' },
            { at: end + 60e3, subject: 'docs: add prompt P-3-c (z)', body: '' },
        ];
        expect(ids(lb.attentionOf(rows, facts({ commits }), NOW)).sort()).toEqual(['P-3-b', 'P-3-c']);
    });

    test('kills "no stale cut", "the cut at another age", "staleOldest wrong": past 72 h an open lane leaves items for staleCount', () => {
        expect(lb.ATTENTION_STALE_H).toBe(72);
        const rows = [row({ id: 'P-4-a', end: NOW - 71 * H }), row({ id: 'P-4-b', end: NOW - 73 * H }), row({ id: 'P-4-c', end: NOW - 200 * H })];
        const a = lb.attentionOf(rows, facts(), NOW);
        expect(ids(a)).toEqual(['P-4-a']);
        expect([a.staleCount, a.staleOldest]).toEqual([2, NOW - 200 * H]);
    });

    test('kills "resolved or done counted", "a chain counted", "a live blocked lane read by its outcome": the three pills only; live blocked is kind blocked, over its limit', () => {
        const start = NOW - 100 * 60e3;
        const rows = [
            row({ id: 'P-5-a', outcome: 'resolved' }), row({ id: 'P-5-b', outcome: 'done' }), row({ id: 'P-5-c', outcome: 'none' }), row({ id: 'P-5-d', outcome: 'unparsed' }),
            row({ id: 'chain-P-5-e', chain: true, state: 'stopped', outcome: '1/2 P-5-e' }),
            row({ id: 'P-5-f', state: 'blocked', outcome: 'none', live: true, start, end: 0 }),
            row({ id: 'P-5-g', outcome: 'question' }), row({ id: 'P-5-h', outcome: 'hard-stop (visual check due)' }), row({ id: 'P-5-i', outcome: 'blocked' }),
        ];
        const a = lb.attentionOf(rows, facts(), NOW);
        const by = (id: string) => a.items.find((i: Row) => i.id === id);
        expect(ids(a).sort()).toEqual(['P-5-f', 'P-5-g', 'P-5-h', 'P-5-i']);
        expect([by('P-5-f').kind, by('P-5-g').kind, by('P-5-h').kind, by('P-5-i').kind]).toEqual(['blocked', 'question', 'hard-stop', 'blocked']);
        expect(by('P-5-f').since).toBe(start + 90 * 60e3);
        expect(by('P-5-f').firstLine).toBe('over its limit since ' + hhmm(start + 90 * 60e3));
        expect([by('P-5-g').firstLine, by('P-5-g').recommended]).toEqual(['first P-5-g', 'rec P-5-g']);
    });

    test('kills "items newest first", "counts off the lists", "a chain among the running": oldest first, waiting/blocked/running the lengths', () => {
        const rows = [
            row({ id: 'P-6-a', end: NOW - 1 * H }), row({ id: 'P-6-b', outcome: 'blocked', end: NOW - 5 * H }), row({ id: 'P-6-c', outcome: 'question', end: NOW - 3 * H }),
            row({ id: 'P-6-r', state: 'running', outcome: 'none', live: true, start: NOW - 10 * 60e3, phase: 'step 2', left: 'about 20 min' }),
            row({ id: 'chain-P-6-r', chain: true, state: 'running', outcome: '1/2 P-6-r' }),
        ];
        const a = lb.attentionOf(rows, facts(), NOW);
        expect(ids(a)).toEqual(['P-6-b', 'P-6-c', 'P-6-a']);
        expect([a.waiting, a.blocked, a.running]).toEqual([3, 1, 1]);
        expect(a.runningItems).toEqual([{ id: 'P-6-r', laneKind: 'phase2', title: 'T', phase: 'step 2', left: 'about 20 min', since: NOW - 10 * 60e3 }]);
    });

    test('kills "a closed verdict forgotten": the closed set remembers a lane once closed', () => {
        const closed = new Set<string>();
        lb.attentionOf([row({ id: 'P-7-a' })], facts({ status: { 'P-7-a': 'eseguito' }, closed }), NOW);
        expect([...closed]).toEqual(['P-7-a']);
        expect(ids(lb.attentionOf([row({ id: 'P-7-a' })], facts({ closed }), NOW))).toEqual([]);
    });
});

describe('firstLineOf: the first line of a final message (§Q3)', () => {
    test('kills "the session tag kept", "more than the first sentence": the tag dropped, the first sentence', () => {
        expect(lb.firstLineOf("[P-2026-10-18-2220 · session 1f2e]\n\nThe slice works, but I can't commit it yet. The gate is red.\n\nOutcome: hard-stop").firstLine)
            .toBe("The slice works, but I can't commit it yet.");
    });

    test('kills "the Decision line ignored": a **Decision for you:** or **Question for Alfonso:** line wins', () => {
        expect(lb.firstLineOf('Phase 1 is done.\n\n**Decision for you:** ratify the AM-8 thresholds and the AM-8/AM-9 texts.\n\nOutcome: question').firstLine)
            .toBe('ratify the AM-8 thresholds and the AM-8/AM-9 texts.');
        expect(lb.firstLineOf('Intro.\n**Question for Alfonso:** keep the cache?').firstLine).toBe('keep the cache?');
    });

    test('kills "a sentence ending on a colon kept": the clause after the colon instead', () => {
        expect(lb.firstLineOf('I stopped before editing anything: the plan needs a choice between two caches. Then more.').firstLine)
            .toBe('the plan needs a choice between two caches.');
        expect(lb.firstLineOf('The lane stops here:\n- one\n- two').firstLine).toBe('The lane stops here:');
    });

    test('kills "no cut", "the cut mid-word", "markdown kept": 60 characters at a space, an ellipsis; bold, code and links stripped', () => {
        const long = lb.firstLineOf('The merge of the context rules into the trunk is ready but the check of the docs fails on two entries.').firstLine;
        expect(long).toBe('The merge of the context rules into the trunk is ready but…');
        expect(long.length).toBeLessThanOrEqual(61);
        expect(lb.firstLineOf('**Phase 1** done, see [the report](docs/x.md) and `foo`.').firstLine).toBe('Phase 1 done, see the report and foo.');
    });

    test('kills "Recommended read as the first line", "the first Recommended taken": the last Recommended line is the second field', () => {
        const r = lb.firstLineOf('Outcome: question\n\nRecommended: not this one\n\nWhich cache do we keep? Two options.\n\nRecommended: keep the old cache, it is measured.\nOutcome: question');
        expect(r).toEqual({ firstLine: 'Which cache do we keep?', recommended: 'keep the old cache, it is measured.' });
        expect(lb.firstLineOf('').firstLine).toBe('');
    });
});

describe('laneLinkId: the /l/ matcher', () => {
    test('kills "a loose matcher": the Prompt-ID alone, exact', () => {
        expect(lb.laneLinkId('/l/P-2026-10-18-2215')).toBe('P-2026-10-18-2215');
        for (const p of ['/l/P-2026-10-18-221', '/l/x', '/l/P-2026-10-18-2215/extra', '/l/%3Cscript%3E', '/l/', '/x/P-2026-10-18-2215', '/l/P-2026-10-18-22150'])
            expect(lb.laneLinkId(p), p).toBe(null);
    });
});

// ── the board as a process ───────────────────────────────────────────────────

function freePort(): Promise<number> {
    return new Promise((res, rej) => {
        const s = createServer();
        s.once('error', rej);
        s.listen(0, '127.0.0.1', () => {
            const a = s.address();
            s.close(() => res(typeof a === 'object' && a ? a.port : 0));
        });
    });
}

/** A lane of the fake status table; a folder unless a chain. An exited lane ends ageH hours ago on `text` (its Outcome line
 *  added); a live one started startMin minutes ago. `head` adds header lines (Depends:, Corregge:) to input-1.md. */
type Spec = { id: string; state: string; outcome: string; ageH?: number; startMin?: number; text?: string; head?: string; resolved?: boolean };

function laneFolder(root: string, s: Spec) {
    const dir = join(root, s.id);
    mkdirSync(dir);
    const input = join(dir, 'input-1.md');
    writeFileSync(input, '# Lane ' + s.id + '\n\nPrompt-ID: ' + s.id + '\nLane: phase2\n' + (s.head || '') + '\n## COSA\nx\n');
    const at = s.state === 'exited' ? new Date(NOW - (s.ageH ?? 1) * H - 60e3) : new Date(NOW - (s.startMin ?? 10) * 60e3);
    utimesSync(input, at, at);
    if (s.state === 'exited') {
        const text = (s.text || 'Stopped.') + '\nOutcome: ' + s.outcome.split(' ')[0];
        const events = [
            { type: 'system', subtype: 'init', model: 'claude-opus-5-5', claude_code_version: '2.1.0' },
            { type: 'assistant', message: { content: [{ type: 'text', text }] } },
            { type: 'result', duration_ms: 60000, num_turns: 3, result: text },
        ];
        writeFileSync(join(dir, 'log.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + '\n');
        writeFileSync(join(dir, 'exit.txt'), '0\n');
    }
    if (s.resolved) writeFileSync(join(dir, 'resolved.txt'), '2026-10-05 10:00 · Alfonso · fixed by hand\n');
}

/** A trunk with one prompt per `status` entry, then the given commits, each at its time. */
function trunkRepo(status: Record<string, string>, commits: { at: number; msg: string }[]) {
    const repo = tmp();
    const g = (args: string[], at = NOW - 100 * H) => {
        const d = new Date(at).toISOString();
        const r = spawnSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { env: { ...process.env, GIT_AUTHOR_DATE: d, GIT_COMMITTER_DATE: d }, encoding: 'utf8' });
        if (r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + r.stderr);
    };
    spawnSync('git', ['init', '-q', '-b', 'alfonso-frontend-jjtl', repo]);
    mkdirSync(join(repo, 'docs', 'prompts'), { recursive: true });
    for (const [id, st] of Object.entries(status)) {
        const m = /^P-(\d{4}-\d{2}-\d{2})-(\d{4})$/.exec(id)!;
        writeFileSync(join(repo, 'docs', 'prompts', 'claude_' + m[1] + '_' + m[2] + '_prompt_x.md'), '# x\n\nPrompt-ID: ' + id + '\nStatus: ' + st + '\n');
    }
    g(['add', '.']);
    g(['commit', '-q', '-m', 'init']);
    for (const c of commits) g(['commit', '-q', '--allow-empty', '-m', c.msg], c.at);
    return repo;
}

async function board(specs: Spec[], repo: string): Promise<{ base: string }> {
    const root = tmp();
    for (const s of specs) if (!s.id.startsWith('chain-')) laneFolder(root, s);
    const fake = join(root, 'fake-lane-run.mjs');
    const lines = ['id  state  outcome  elapsed', ...specs.map((s) => [s.id, s.state, s.outcome, '5 min'].join('   '))];
    writeFileSync(fake, lines.map((l) => 'console.log(' + JSON.stringify(l) + ');').join('\n') + '\n');
    const port = await freePort();
    const child = spawn(process.execPath, [SCRIPT, '--port', String(port), '--refresh', '30'], {
        env: { ...process.env, JJODEL_LANES: root, LANE_RUN: fake, LANE_BOARD_PORT: '', JJODEL_REPO: repo, JJODEL_TRUNK: 'alfonso-frontend-jjtl', LANE_BOARD_CACHE: join(root, 'timeline-cache.json') },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(child);
    await new Promise<void>((res, rej) => {
        const t = setTimeout(() => rej(new Error('board did not start')), 10000);
        child.stdout!.on('data', (b) => { if (String(b).includes('lane-board on')) { clearTimeout(t); res(); } });
        child.on('exit', (code) => { clearTimeout(t); rej(new Error('board exited ' + code)); });
    });
    return { base: 'http://127.0.0.1:' + port };
}

const Q_OPEN = 'P-2026-10-05-0901', Q_DONE = 'P-2026-10-05-0902', HS_DEP = 'P-2026-10-05-0903', HS_COR = 'P-2026-10-05-0904',
    HS_COMMIT = 'P-2026-10-05-0905', HS_ADD = 'P-2026-10-05-0906', HS_OLD = 'P-2026-10-05-0907', EXB = 'P-2026-10-05-0908',
    RES = 'P-2026-10-05-0909', DONE = 'P-2026-10-05-0910', LIVE_BLK = 'P-2026-10-05-0911', RUN = 'P-2026-10-05-0912', HS_COR2 = 'P-2026-10-05-0913';

const LANES: Spec[] = [
    { id: Q_OPEN, state: 'exited', outcome: 'question', ageH: 3, text: '[' + Q_OPEN + ' · session ab12]\n\nI read the cache.\n\n**Question for you:** keep the old cache or drop it?\n\nRecommended: keep it.' },
    { id: Q_DONE, state: 'exited', outcome: 'question', ageH: 3 },
    { id: HS_DEP, state: 'exited', outcome: 'hard-stop', ageH: 3 },
    { id: HS_COR, state: 'exited', outcome: 'hard-stop', ageH: 3 },
    { id: HS_COR2, state: 'exited', outcome: 'hard-stop', ageH: 3 },
    { id: HS_COMMIT, state: 'exited', outcome: 'hard-stop', ageH: 4 },
    { id: HS_ADD, state: 'exited', outcome: 'hard-stop', ageH: 2 },
    { id: HS_OLD, state: 'exited', outcome: 'hard-stop', ageH: 80 },
    { id: EXB, state: 'exited', outcome: 'blocked', ageH: 5 },
    { id: RES, state: 'exited', outcome: 'blocked', ageH: 1, resolved: true },
    { id: DONE, state: 'exited', outcome: 'done', ageH: 1 },
    { id: LIVE_BLK, state: 'blocked', outcome: 'none', startMin: 100 },
    { id: RUN, state: 'running', outcome: 'none', startMin: 10 },
    { id: 'P-2026-10-05-0920', state: 'exited', outcome: 'done', ageH: 1, head: 'Depends: ' + HS_DEP + '\n' },
    { id: 'P-2026-10-05-0921', state: 'exited', outcome: 'done', ageH: 1, head: 'Depends: none\nCorregge: ' + HS_COR + ' (its step 2 was wrong)\n' },
    { id: 'P-2026-10-05-0922', state: 'exited', outcome: 'done', ageH: 1, head: 'Corregge: 2026-10-05 09:13\n' },
    // An earlier lane naming a later one closes nothing.
    { id: 'P-2026-10-05-0800', state: 'exited', outcome: 'done', ageH: 1, head: 'Depends: ' + Q_OPEN + '\n' },
];

let attnBoard: Promise<{ base: string }> | null = null;
const attn = () => (attnBoard ||= board(LANES, trunkRepo(
    { [Q_OPEN]: 'da eseguire', [Q_DONE]: 'eseguito 2026-10-05 · lane x · abc1234', [HS_ADD]: 'da eseguire' },
    [{ at: NOW - 1 * H, msg: 'feat(x): the fix (' + HS_COMMIT + ')' }, { at: NOW - 1 * H, msg: 'docs: add prompt ' + HS_ADD + ' (its Phase 2)' }],
)));
const get = async (base: string, path: string) => { const r = await fetch(base + path); return { status: r.status, type: r.headers.get('content-type') || '', body: await r.text() }; };

describe('/api/attention on the board', () => {
    test('kills "a closure not wired", "Corregge not parsed", "the stamp form of Corregge not read", "an earlier lane closes a later one": the waiting lanes, oldest first', async () => {
        const { base } = await attn();
        const a = JSON.parse((await get(base, '/api/attention')).body);
        expect(ids(a)).toEqual([EXB, Q_OPEN, HS_ADD, LIVE_BLK]);
        expect([a.v, a.waiting, a.blocked, a.running, a.staleCount]).toEqual([1, 4, 2, 1, 1]);
        expect(a.runningItems.map((i: Row) => i.id)).toEqual([RUN]);
        expect(typeof a.staleOldest).toBe('number');
        expect(NOW - a.staleOldest).toBeGreaterThan(79 * H);
        expect(a.board).toMatch(/^(ok|refreshing)$/);
    });

    test('kills "the final message not read", "the live blocked lane given a message": firstLine and recommended from the log, the limit for a live blocked lane', async () => {
        const { base } = await attn();
        const a = JSON.parse((await get(base, '/api/attention')).body);
        const by = (id: string) => a.items.find((i: Row) => i.id === id);
        expect(by(Q_OPEN)).toMatchObject({ kind: 'question', laneKind: 'phase2', title: 'Lane ' + Q_OPEN, firstLine: 'keep the old cache or drop it?', recommended: 'keep it.' });
        expect(by(LIVE_BLK).firstLine).toMatch(/^over its limit since \d\d:\d\d$/);
        expect(by(EXB)).toMatchObject({ kind: 'blocked', firstLine: 'Stopped.' });
    });

    test('kills "routed on req.url", "a req.url route broken": a query string changes nothing; /api, /api/timeline, /api/insights still answer JSON', async () => {
        const { base } = await attn();
        const a = JSON.parse((await get(base, '/api/attention')).body), q = JSON.parse((await get(base, '/api/attention?x=1')).body);
        expect([q.waiting, q.staleCount, ids(q)]).toEqual([a.waiting, a.staleCount, ids(a)]);
        for (const p of ['/api', '/api/timeline', '/api/insights']) {
            const r = await get(base, p);
            expect([r.status, r.type], p).toEqual([200, 'application/json']);
            expect(() => JSON.parse(r.body), p).not.toThrow();
        }
    });

    test('kills "no /l/ route", "a loose /l/ matcher", "no fallback": /l/<id> hands off to jjodel-lanes:// and falls back to /#lane=<id>; anything else under /l/ is 404', async () => {
        const { base } = await attn();
        const ok = await get(base, '/l/P-2026-10-18-2215');
        expect([ok.status, ok.type]).toEqual([200, 'text/html; charset=utf-8']);
        expect(ok.body).toContain("location.href='jjodel-lanes://P-2026-10-18-2215'");
        expect(ok.body).toContain("location.replace('/#lane=P-2026-10-18-2215')");
        expect(ok.body).toContain('},1500)');
        expect(ok.body).toContain('P-2026-10-18-2215 is not on the board yet');
        expect((await get(base, '/l/' + Q_OPEN)).body).not.toContain('is not on the board yet');
        for (const p of ['/l/P-2026-10-18-221', '/l/x', '/l/P-2026-10-18-2215/extra', '/l/%3Cscript%3E']) {
            const r = await get(base, p);
            expect([r.status, r.type], p).toEqual([404, 'text/plain; charset=utf-8']);
        }
        expect((await get(base, '/elsewhere')).status).toBe(200);
    });
});

// ── #lane=<id> in the page ───────────────────────────────────────────────────

type Stub = Record<string, any>;
function el(extra: Stub = {}): Stub {
    const cls = new Set<string>();
    const on: Record<string, ((e: any) => void)[]> = {};
    return {
        innerHTML: '', textContent: '', hidden: false, title: '', dataset: {}, style: {}, cls, on, open: false,
        addEventListener: (t: string, f: (e: any) => void) => { (on[t] ||= []).push(f); },
        classList: {
            toggle: (c: string, f?: boolean) => { const v = f === undefined ? !cls.has(c) : !!f; if (v) cls.add(c); else cls.delete(c); return v; },
            add: (c: string) => cls.add(c), remove: (c: string) => cls.delete(c), contains: (c: string) => cls.has(c),
        },
        querySelector: () => null, querySelectorAll: () => [],
        ...extra,
    };
}

/** The page's script on a stub DOM whose Kind badges (button.kb[data-id]) exist when the rendered tables contain them, each in its row. */
async function page(base: string, hash: string) {
    const html = (await get(base, '/')).body;
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).pop()!;
    const byId = new Map<string, Stub>();
    const byIdGet = (id: string) => { if (!byId.has(id)) byId.set(id, el()); return byId.get(id)!; };
    const rows = new Map<string, Stub>();
    const scrolled: string[] = [];
    const replaced: string[] = [];
    const main = el();
    const tabs = ['table', 'timeline', 'insights', 'requirements'].map((t) => el({ dataset: { tab: t } }));
    const document = {
        title: '', body: el(), head: el(), createElement: () => el(),
        getElementById: byIdGet,
        querySelector: (s: string) => {
            if (s === 'main') return main;
            const m = /^button\.kb\[data-id="([^"]+)"\]$/.exec(s);
            if (!m || ![...byId.values()].some((e) => e.innerHTML.includes('" data-id="' + m[1] + '" data-kd="'))) return null;
            if (!rows.has(m[1])) rows.set(m[1], el({ closest: () => null, scrollIntoView: () => scrolled.push(m[1]) }));
            return el({ closest: (sel: string) => (sel === 'tr' ? rows.get(m[1]) : null) });
        },
        querySelectorAll: (s: string) => (s === '.tabs button' ? tabs : s === 'tr.mark' ? [...rows.values()].filter((r) => r.cls.has('mark')) : []),
    };
    const window: Stub = { addEventListener() {}, location: { hash, pathname: '/', search: '' } };
    const ctx = vm.createContext({
        window, document, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {}, innerWidth: 1400, innerHeight: 900,
        location: window.location, history: { replaceState: (_s: unknown, _t: string, u: string) => replaced.push(u) },
        localStorage: { getItem: (k: string) => (k === 'laneBoardTab' ? 'timeline' : null), setItem: () => {} },
        fetch: (u: string, o?: RequestInit) => fetch(base + u, o),
    });
    vm.runInContext(script, ctx);
    await vm.runInContext('tick()', ctx);
    return { byId, rows, scrolled, replaced, tabs, body: document.body };
}

describe('#lane=<id> in the Lanes tab', () => {
    test('kills "the row not found by its badge", "the hash ignored", "the tab left as it was", "no scroll", "the mark kept after a click": the row marked and scrolled to, the Lanes tab shown', async () => {
        const { base } = await attn();
        const p = await page(base, '#lane=' + DONE);
        // A lane of 2026-10-05 sits in Earlier lanes.
        expect(p.byId.get('older')!.innerHTML).toContain('class="pill kb k-phase2" data-id="' + DONE + '"');
        expect(p.byId.get('tab-table')!.hidden).toBe(false);
        expect(p.byId.get('tab-timeline')!.hidden).toBe(true);
        expect(p.rows.get(DONE)!.cls.has('mark')).toBe(true);
        expect(p.scrolled).toEqual([DONE]);
        expect(p.byId.get('lanenote')!.hidden).toBe(true);
        p.body.on.click.forEach((f: (e: any) => void) => f({ target: el({ closest: () => null }) }));
        expect(p.rows.get(DONE)!.cls.has('mark')).toBe(false);
        expect(p.replaced).toEqual(['/']);
    });

    test('kills "a missing lane says nothing": a lane not in the table reads one line', async () => {
        const { base } = await attn();
        const p = await page(base, '#lane=P-2026-10-05-0999');
        const note = p.byId.get('lanenote')!;
        expect([note.hidden, note.textContent]).toEqual([false, 'P-2026-10-05-0999 is not in the lanes table.']);
        expect(p.scrolled).toEqual([]);
    });
});
