import { describe, test, expect, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entriesOfText, findEntries, promptForms, promptIdOf, promptsOfFront, renderHits, streamEntries } from '../log-find.ts';
import type { Criteria } from '../log-find.ts';

const GATES = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function entry(date: string, title: string, fields: Record<string, string>, time?: string): string {
    const heading = time ? `## ${date} ${time} — ${title}` : `## ${date} — ${title}`;
    const body = Object.entries(fields)
        .map(([k, v]) => `**${k}**: ${v}`)
        .join('\n');
    return `${heading}\n${body}\n\n`;
}

// The active log: three entries, newest first, as the real one is kept.
const ACTIVE =
    '# Log\n\nPreamble.\n\n' +
    entry('2026-10-17', 'feat: alpha (P-2026-10-17-0900)', {
        Prompt: '`claude_2026-10-17_0900_prompt_alpha.md`, the alpha lane',
        'Files touched': '`frontend/scripts/gates/alpha.ts`, `docs/alpha.md`',
        Corregge: '—',
        'Prompt document name': '2026-10-17 09:00',
    }) +
    entry('2026-10-16', 'fix: beta (P-2026-10-16-1000)', {
        Prompt: '`claude_2026-10-16_1000_prompt_beta.md`, fixes alpha',
        'Files touched': '`src/beta.ts`',
        Corregge: '2026-10-17 09:00 (the alpha prompt)',
        'Prompt document name': '2026-10-16 10:00',
    }) +
    entry('2026-10-15', 'chore: gamma (P-2026-10-15-0800)', {
        Prompt: '`claude_2026-10-15_0800_prompt_gamma.md`, in the harness front',
        'Files touched': '`frontend/src/gamma.ts`',
        Corregge: '—',
        'Prompt document name': '2026-10-15 08:00',
    });

// The harness inbox, appended to: its later entry is the newer one.
const INBOX_HARNESS =
    '# log-inbox — lane «harness»\n\n---\n\n' +
    entry('2026-10-18', 'docs: first inbox entry (P-2026-10-18-0100)', { Prompt: 'none', 'Files touched': '`docs/a.md`' }) +
    entry('2026-10-18', 'docs: second inbox entry (P-2026-10-18-0200)', { Prompt: 'none', 'Files touched': '`docs/b.md`' });
const INBOX_OTHER = '# log-inbox — lane «other»\n\n' + entry('2026-10-14', 'feat: other lane (P-2026-10-14-1200)', { Prompt: 'none', 'Files touched': '`docs/c.md`' });

// The archive: not chronological, one entry per criterion that only it can answer.
const ARCHIVE =
    '# Archive\n\n' +
    entry('2026-07-01', 'fix: old file hit', { Prompt: 'old', 'Files touched': '`src/gamma.ts`' }) +
    entry('2026-09-01', 'feat: old prompt hit (P-2026-09-01-1000)', { Prompt: '`claude_2026-09-01_1000_prompt_old.md`' }) +
    entry('2026-08-01', 'feat: old harness front', { Prompt: '`claude_2026-08-01_0900_prompt_harness_old.md`' });

const PROMPTS: Record<string, string> = {
    'claude_2026-10-15_0800_prompt_gamma.md': 'Prompt-ID: P-2026-10-15-0800\nFront: harness\nLane: fast\n\n## COSA\nFront: not-this-one\n',
    'claude_2026-10-17_0900_prompt_alpha.md': 'Prompt-ID: P-2026-10-17-0900\nFront: codegen\n',
    'claude_2026-08-01_0900_prompt_harness_old.md': 'Chat: x\nFront: harness\n',
    '2026-07-30_1100_plan_old_format.md': 'Front: harness\n',
};

const dirs: string[] = [];
afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

function tree(opts: { archive?: string; prompts?: boolean } = {}): string {
    const dir = mkdtempSync(join(tmpdir(), 'log-find-'));
    dirs.push(dir);
    mkdirSync(join(dir, 'docs', 'log-inbox'), { recursive: true });
    mkdirSync(join(dir, 'docs', 'prompts'), { recursive: true });
    writeFileSync(join(dir, 'docs', 'claude-code-log.md'), ACTIVE);
    writeFileSync(join(dir, 'docs', 'log-inbox', 'harness.md'), INBOX_HARNESS);
    writeFileSync(join(dir, 'docs', 'log-inbox', 'other.md'), INBOX_OTHER);
    writeFileSync(join(dir, 'docs', 'claude-code-log-archive.md'), opts.archive ?? ARCHIVE);
    if (opts.prompts !== false) for (const [n, t] of Object.entries(PROMPTS)) writeFileSync(join(dir, 'docs', 'prompts', n), t);
    return dir;
}

const crit = (c: Partial<Criteria>): Criteria => ({ files: [], fronts: [], prompts: [], ...c });
const titles = (hits: Array<{ heading: string }>): string[] => hits.map((h) => h.heading.replace(/^## \S+ — /, '').replace(/ \(P-.*$/, ''));

describe('entriesOfText, streamEntries', () => {
    test('the line of each heading is the line in the file', () => {
        const es = entriesOfText(ACTIVE, 'docs/claude-code-log.md');
        expect(es.map((e) => e.line)).toEqual([5, 11, 17]);
        expect(ACTIVE.split('\n')[es[1].line - 1]).toBe(es[1].heading);
    });

    test('the stream yields the same entries as the whole-text split, with the same lines', async () => {
        const dir = tree();
        const streamed = [];
        for await (const e of streamEntries(join(dir, 'docs', 'claude-code-log-archive.md'), 'a')) streamed.push(e);
        const whole = entriesOfText(ARCHIVE, 'a');
        expect(streamed.map((e) => [e.line, e.heading, e.date])).toEqual(whole.map((e) => [e.line, e.heading, e.date]));
        expect(streamed[0].text).toContain('**Files touched**: `src/gamma.ts`');
    });
});

describe('promptForms, promptIdOf', () => {
    test('a Prompt-ID has a file stamp and a document name', () => {
        expect(promptForms('P-2026-10-18-0945')).toEqual({ id: 'P-2026-10-18-0945', stamp: '2026-10-18_0945', docName: '2026-10-18 09:45' });
    });

    test('the Prompt-ID of a prompt: the header line, else the file name, never a line after the first heading', () => {
        expect(promptIdOf('claude_2026-10-15_0800_x.md', 'Prompt-ID: P-2026-10-15-0801\nFront: a\n')).toBe('P-2026-10-15-0801');
        expect(promptIdOf('claude_2026-10-15_0800_x.md', 'Front: a\n## COSA\nPrompt-ID: P-2026-01-01-0000\n')).toBe('P-2026-10-15-0800');
        expect(promptIdOf('2026-07-30_1100_plan.md', 'Front: a\n')).toBe('P-2026-07-30-1100');
        expect(promptIdOf('notes.md', 'x')).toBeNull();
    });
});

describe('findEntries: each criterion alone', () => {
    test('--file matches the Files touched field, with frontend/ added or removed', async () => {
        const dir = tree();
        expect(titles((await findEntries(dir, crit({ files: ['scripts/gates/alpha.ts'] }), { limit: 20 })).hits)).toEqual(['feat: alpha']);
        expect(titles((await findEntries(dir, crit({ files: ['frontend/src/beta.ts'] }), { limit: 20 })).hits)).toEqual(['fix: beta']);
        expect(titles((await findEntries(dir, crit({ files: ['frontend/scripts/gates/alpha.ts'] }), { limit: 20 })).hits)).toEqual(['feat: alpha']);
    });

    test('--file does not read the prose: a path in the Prompt line is not a file touched', async () => {
        const dir = tree();
        expect((await findEntries(dir, crit({ files: ['alpha.md'] }), { limit: 20 })).hits.map((h) => h.line)).toEqual([5]); // docs/alpha.md in Files touched
        expect((await findEntries(dir, crit({ files: ['the alpha lane'] }), { limit: 20 })).hits).toEqual([]);
    });

    test('--prompt matches the heading, the Prompt line, the document name, and the entries that correct it', async () => {
        const dir = tree();
        const alpha = await findEntries(dir, crit({ prompts: ['P-2026-10-17-0900'] }), { limit: 20 });
        // alpha itself (heading, Prompt line, document name) and beta, whose Corregge names alpha's document
        expect(titles(alpha.hits)).toEqual(['feat: alpha', 'fix: beta']);
        const beta = await findEntries(dir, crit({ prompts: ['P-2026-10-16-1000'] }), { limit: 20 });
        expect(titles(beta.hits)).toEqual(['fix: beta']);
    });

    test('--id is --prompt', async () => {
        const dir = tree();
        const viaId = await findEntries(dir, crit({ prompts: ['P-2026-10-15-0800'] }), { limit: 20 });
        expect(titles(viaId.hits)).toEqual(['chore: gamma']);
    });

    test('--front takes the inbox of the slug and the entries that cite a prompt of the front, by ID or by file name', async () => {
        const dir = tree();
        const r = await findEntries(dir, crit({ fronts: ['harness'] }), { limit: 20 });
        expect(titles(r.hits)).toEqual([
            'docs: second inbox entry',
            'docs: first inbox entry',
            'chore: gamma', // heading and Prompt line cite a prompt of the front
            'feat: old harness front', // archive: cites a prompt file of the front (a header without Prompt-ID)
        ]);
        expect(titles((await findEntries(dir, crit({ fronts: ['codegen'] }), { limit: 20 })).hits)).toEqual(['feat: alpha']);
    });

    test('a prompt whose Front: is only in its body is not of the front', () => {
        const front = promptsOfFront(tree(), 'not-this-one');
        expect(front.ids.size + front.names.size).toBe(0);
    });

    test('a front reads the older file names too', () => {
        const front = promptsOfFront(tree(), 'harness');
        expect([...front.ids].sort()).toEqual(['P-2026-07-30-1100', 'P-2026-08-01-0900', 'P-2026-10-15-0800']);
    });
});

describe('findEntries: combinations and bounds', () => {
    test('criteria are OR-ed', async () => {
        const dir = tree();
        const r = await findEntries(dir, crit({ files: ['src/beta.ts'], prompts: ['P-2026-10-15-0800'] }), { limit: 20 });
        expect(titles(r.hits)).toEqual(['fix: beta', 'chore: gamma']);
    });

    test('newest first; in an inbox the later entry is the newer one', async () => {
        const dir = tree();
        const r = await findEntries(dir, crit({ fronts: ['harness'], files: ['src/beta.ts'] }), { limit: 20 });
        expect(r.hits.map((h) => h.date)).toEqual([...r.hits.map((h) => h.date)].sort().reverse());
        expect(titles(r.hits).slice(0, 2)).toEqual(['docs: second inbox entry', 'docs: first inbox entry']);
    });

    test('--limit cuts after the sort', async () => {
        const dir = tree();
        const r = await findEntries(dir, crit({ fronts: ['harness'] }), { limit: 2 });
        expect(titles(r.hits)).toEqual(['docs: second inbox entry', 'docs: first inbox entry']);
    });

    test('--since drops older entries, in every source', async () => {
        const dir = tree();
        const r = await findEntries(dir, crit({ files: ['gamma.ts'] }), { limit: 20, since: '2026-10-01' });
        expect(titles(r.hits)).toEqual(['chore: gamma']); // the 2026-07-01 archive entry also touches src/gamma.ts
        const all = await findEntries(dir, crit({ files: ['gamma.ts'] }), { limit: 20 });
        expect(titles(all.hits)).toEqual(['chore: gamma', 'fix: old file hit']);
    });
});

describe('findEntries: the archive is read only when needed', () => {
    test('enough hits in the active log and the inboxes: the archive is not opened', async () => {
        // The archive in this tree is not a log at all; a read would surface its «entry».
        const dir = tree({ archive: '## 2026-01-01 — fix: must stay unread\n**Files touched**: `src/gamma.ts`\n' });
        const r = await findEntries(dir, crit({ files: ['gamma.ts'] }), { limit: 1 });
        expect(r.archiveRead).toBe(false);
        expect(titles(r.hits)).toEqual(['chore: gamma']);
    });

    test('fewer hits than the limit: the archive is read', async () => {
        const r = await findEntries(tree(), crit({ files: ['gamma.ts'] }), { limit: 2 });
        expect(r.archiveRead).toBe(true);
        expect(titles(r.hits)).toEqual(['chore: gamma', 'fix: old file hit']);
    });

    test('--since before the oldest active entry reads the archive even when the limit is met', async () => {
        const dir = tree();
        const early = await findEntries(dir, crit({ files: ['gamma.ts'] }), { limit: 1, since: '2026-07-01' });
        expect(early.archiveRead).toBe(true);
        const late = await findEntries(dir, crit({ files: ['gamma.ts'] }), { limit: 1, since: '2026-10-15' });
        expect(late.archiveRead).toBe(false);
    });

    test('a missing archive is not an error', async () => {
        const dir = tree();
        rmSync(join(dir, 'docs', 'claude-code-log-archive.md'));
        const r = await findEntries(dir, crit({ files: ['nothing-touches-this'] }), { limit: 5 });
        expect(r).toEqual({ hits: [], archiveRead: false });
    });
});

describe('renderHits', () => {
    test('one line per hit, `<source>:<line> <heading>`; --full adds the body after the heading', async () => {
        const dir = tree();
        const { hits } = await findEntries(dir, crit({ files: ['src/beta.ts'] }), { limit: 20 });
        const short = renderHits(hits, false);
        expect(short).toBe('docs/claude-code-log.md:11 ## 2026-10-16 — fix: beta (P-2026-10-16-1000)');
        const full = renderHits(hits, true);
        expect(full.split('\n')[0]).toBe(short);
        expect(full).toContain('**Files touched**: `src/beta.ts`');
        expect(full).toContain('**Corregge**: 2026-10-17 09:00 (the alpha prompt)');
    });
});

// ── The script, as a child process ──────────────────────────────────────────

function run(dir: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
    const r = spawnSync(
        process.execPath,
        ['--disable-warning=ExperimentalWarning', '--experimental-strip-types', join(GATES, 'log-find.ts'), '--root', dir, ...args],
        { encoding: 'utf8' },
    );
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe('log-find.ts', () => {
    test('exit 0 with hits and the lines on stdout', () => {
        const r = run(tree(), ['--file', 'src/beta.ts']);
        expect(r.status).toBe(0);
        expect(r.stdout).toBe('docs/claude-code-log.md:11 ## 2026-10-16 — fix: beta (P-2026-10-16-1000)\n');
    });

    test('exit 1 with no hit, nothing on stdout', () => {
        const r = run(tree(), ['--prompt', 'P-2020-01-01-0000']);
        expect(r.status).toBe(1);
        expect(r.stdout).toBe('');
    });

    test('--full and --limit, repeated criteria', () => {
        const r = run(tree(), ['--front', 'harness', '--limit', '1', '--full']);
        expect(r.status).toBe(0);
        expect(r.stdout).toContain('docs/log-inbox/harness.md:');
        expect(r.stdout).toContain('**Files touched**: `docs/b.md`');
        expect(r.stdout).not.toContain('docs/a.md');
        const two = run(tree(), ['--file', 'src/beta.ts', '--prompt', 'P-2026-10-15-0800']);
        expect(two.stdout.trim().split('\n')).toHaveLength(2);
    });

    test('a usage error is exit 2 with the usage on stderr', () => {
        const dir = tree();
        for (const args of [[], ['--limit', '0', '--file', 'x'], ['--since', 'yesterday', '--file', 'x'], ['--bogus'], ['--file']]) {
            const r = run(dir, args);
            expect(r.status).toBe(2);
            expect(r.stderr).toContain('usage: npm run log:find');
        }
    });
});
