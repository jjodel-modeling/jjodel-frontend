import { describe, test, expect, afterAll } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
