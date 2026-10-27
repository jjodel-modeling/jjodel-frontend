import { describe, test, expect, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { REPO } from './hookRunner.ts';

// check-triggers.ts run as the CLI (P11), on the live repository and on fixture
// repositories under --root. A test name states the mutation that turns it red.

const SCRIPT = resolve(REPO, 'frontend/scripts/gates/check-triggers.ts');
const made: string[] = [];
afterAll(() => {
    for (const d of made) rmSync(d, { recursive: true, force: true });
});

function cli(args: string[]) {
    const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', '--experimental-strip-types', SCRIPT, ...args], {
        encoding: 'utf8',
        timeout: 30000,
    });
    return { status: r.status, out: r.stdout, err: r.stderr };
}

const DOC = '# Rules\n\n## 3.3 TRANSACTION rules\n\ntext\n\n```bash\n# Hidden heading in a fence\n```\n';
const BASE_FILES: Record<string, string> = {
    'CLAUDE.md': '# root\n',
    'src/a/CLAUDE.md': DOC,
    'src/a/x.ts': 'x',
    'src/b/y.ts': 'y',
};
const BASE_MAP = { schema: 1, entries: [{ glob: 'src/a/**', docs: ['src/a/CLAUDE.md'], why: 'a' }] };

/** A git repository with the files staged (ls-files reads the index) and the map written. */
function fixture(map: unknown, files: Record<string, string> = BASE_FILES, untracked: Record<string, string> = {}): string {
    const root = mkdtempSync(join(tmpdir(), 'check-triggers-'));
    made.push(root);
    const write = (rel: string, text: string) => {
        mkdirSync(dirname(join(root, rel)), { recursive: true });
        writeFileSync(join(root, rel), text);
    };
    for (const [rel, text] of Object.entries(files)) write(rel, text);
    spawnSync('git', ['init', '-q'], { cwd: root });
    spawnSync('git', ['add', '--', ...Object.keys(files)], { cwd: root });
    for (const [rel, text] of Object.entries(untracked)) write(rel, text);
    write('docs/harness/rule-triggers.json', typeof map === 'string' ? map : JSON.stringify(map));
    return root;
}
const entry = (glob: string, docs: string[]) => ({ glob, docs, why: 'w' });
const withEntries = (...extra: object[]) => ({ schema: 1, entries: [...BASE_MAP.entries, ...extra] });

describe('check:triggers on the live repository', () => {
    test('passes, one entry per nested CLAUDE.md', () => {
        const r = cli([]);
        expect(r.err).toBe('');
        expect(r.status).toBe(0);
        expect(r.out).toMatch(/^check:triggers PASS \(\d+ entries\)\n$/);
    });
});

describe('check:triggers on fixtures', () => {
    test('positive control: the base fixture passes', () => {
        const r = cli(['--root', fixture(BASE_MAP)]);
        expect(r.out).toBe('check:triggers PASS (1 entries)\n');
        expect(r.status).toBe(0);
    });

    test('kills "doc existence not checked" (a): a missing doc fails', () => {
        const r = cli(['--root', fixture(withEntries(entry('src/b/**', ['src/b/RULES.md'])))]);
        expect(r.status).toBe(1);
        expect(r.out).toContain('missing doc: src/b/RULES.md (entry src/b/**)');
    });

    test('kills "fragment not checked" (a): a fragment no heading contains fails, a matching one passes', () => {
        const bad = cli(['--root', fixture(withEntries(entry('src/b/**', ['src/a/CLAUDE.md#3.4'])))]);
        expect(bad.status).toBe(1);
        expect(bad.out).toContain('no heading matches #3.4 in src/a/CLAUDE.md');
        const good = cli(['--root', fixture(withEntries(entry('src/b/**', ['src/a/CLAUDE.md#transaction RULES'])))]);
        expect(good.out).toContain('PASS');
        expect(good.status).toBe(0);
    });

    test('kills "fenced lines read as headings" (a): a # line inside a code fence is no heading', () => {
        const r = cli(['--root', fixture(withEntries(entry('src/b/**', ['src/a/CLAUDE.md#Hidden heading'])))]);
        expect(r.status).toBe(1);
        expect(r.out).toContain('no heading matches #Hidden heading');
    });

    test('kills "glob coverage not checked" (b): a glob that matches no tracked file fails', () => {
        const r = cli(['--root', fixture(withEntries(entry('src/c/**', ['src/a/CLAUDE.md'])), BASE_FILES, { 'src/c/untracked.ts': 'u' })]);
        expect(r.status).toBe(1);
        expect(r.out).toContain('glob matches no tracked file: src/c/**');
    });

    test('kills "* crosses a slash" (b): src/* matches no tracked file when they all sit one level deeper', () => {
        const r = cli(['--root', fixture(withEntries(entry('src/*', ['src/a/CLAUDE.md'])))]);
        expect(r.status).toBe(1);
        expect(r.out).toContain('glob matches no tracked file: src/*');
    });

    test('kills "nested CLAUDE.md not checked" (c): an unmapped nested CLAUDE.md fails, the root one never does', () => {
        const r = cli(['--root', fixture(BASE_MAP, { ...BASE_FILES, 'src/b/CLAUDE.md': '# b\n' })]);
        expect(r.status).toBe(1);
        expect(r.out).toContain('nested CLAUDE.md without a trigger: src/b/CLAUDE.md');
        expect(r.out).not.toContain('trigger: CLAUDE.md');
    });

    test('kills "coverage of its own directory not checked" (c): mapped under a glob that misses it fails', () => {
        const r = cli(['--root', fixture({ schema: 1, entries: [entry('src/b/**', ['src/a/CLAUDE.md'])] })]);
        expect(r.status).toBe(1);
        expect(r.out).toContain('nested CLAUDE.md without a trigger: src/a/CLAUDE.md');
    });

    test('kills "duplicates not checked" (d): a duplicate glob fails', () => {
        const r = cli(['--root', fixture(withEntries(entry('src/a/**', ['src/a/CLAUDE.md'])))]);
        expect(r.status).toBe(1);
        expect(r.out).toContain('duplicate glob: src/a/**');
    });

    test('every failure on its own line, then the count', () => {
        const r = cli(['--root', fixture(withEntries(entry('src/a/**', ['src/zz.md']), entry('src/q/**', ['src/a/CLAUDE.md'])))]);
        expect(r.status).toBe(1);
        const lines = r.out.trim().split('\n');
        expect(lines).toEqual([
            'check:triggers: duplicate glob: src/a/**',
            'check:triggers: missing doc: src/zz.md (entry src/a/**)',
            'check:triggers: glob matches no tracked file: src/q/**',
            'check:triggers FAIL (3 failures)',
        ]);
    });
});

describe('check:triggers: exit 2 on a map it cannot read', () => {
    test('bad JSON', () => {
        const r = cli(['--root', fixture('{"schema": 1, "entries": [')]);
        expect(r.status).toBe(2);
        expect(r.err).toContain('as JSON');
    });
    test('schema 2', () => {
        expect(cli(['--root', fixture({ ...BASE_MAP, schema: 2 })]).status).toBe(2);
    });
    test('an entry without docs', () => {
        expect(cli(['--root', fixture({ schema: 1, entries: [{ glob: 'src/**', docs: [] }] })]).status).toBe(2);
    });
    test('no map at all', () => {
        const root = mkdtempSync(join(tmpdir(), 'check-triggers-empty-'));
        made.push(root);
        expect(cli(['--root', root]).status).toBe(2);
    });
    test('usage error exits 1', () => {
        expect(cli(['--bogus']).status).toBe(1);
    });
});
