import { describe, test, expect, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { displayId, findRows, loadRegister, markerStats, relatedOf, resultOf, rowText, seriesOf, statusOf } from '../decisions-query.ts';
import type { Register } from '../decisions-query.ts';

// A miniature register with the shapes of the live one: list rows and paragraph rows,
// three series, a provisional row, a header with a parenthesis inside the parenthesis,
// two rows of one dated sigla, an item of Superate that points at a row, a row that
// sits under Superate, and every relation form the recogniser lists.
const REGISTER = [
    '# Decisions',
    '',
    '## Processo',
    '',
    '- **RC-1** (2026-08-05) — First rule. Original text.',
    '- **RC-2** (2026-08-06) — Second. Amends RC-1 (3) and RC-9: tightens it. Not related to RC-5.',
    '  Continuation line of RC-2.',
    '- **RC-3** (2026-08-07, provisional, unattended, evidence: measured, verified: none, reversible: branch): **Third.** Supersedes RC-1.',
    '- **RC-4** (2026-08-08) — **Fourth.** Emendata il 2026-08-09 da RC-2: widened.',
    '- **RC-5** (2026-08-09) — Fifth, who does not amend RC-1 and non emenda RC-2.',
    '',
    '## Serie R-X — second series',
    '',
    '**R-X-1** (2026-09-01) — A paragraph row, no dash. Superata da R-X-2 il 2026-09-02.',
    '',
    'Trailing paragraph of R-X-1 that amends RC-1.',
    '',
    '**R-X-2** (2026-09-02, provisional, unattended (RC-25), evidence: measured, verified: none, reversible: branch) — Nested parenthesis in the header.',
    '',
    '- **R-B-3 (2026-08-05)** — Dated sigla, the newer series.',
    '- **R-B-3 (2026-08-03)** — Dated sigla, the older series.',
    '',
    '## Serie D-UI',
    '',
    '- **D-UI-1** (2026-08-20) — Thing. Amended by RC-2. Renumbered by P-2026-08-21-1000.',
    '',
    '## Superate',
    '',
    '- RC-5 (2026-08-09, old) — superata da RC-4 il 2026-08-10: pointer, the text stays in Processo.',
    '',
    '- **RC-6** (2026-08-01) — Old rule, sits under Superate.',
    '',
].join('\n');

let reg: Register;
const get = (id: string): Register['rows'][number] => findRows(reg, id)[0];
const relations = (id: string): string[] =>
    relatedOf(reg, get(id))
        .map((r) => `${r.relation}:${displayId(r.row)}`)
        .sort();

describe('loadRegister: rows', () => {
    test('list rows, paragraph rows and the header with a nested parenthesis are all rows', () => {
        reg = loadRegister(REGISTER);
        expect(reg.rows.map((r) => displayId(r))).toEqual([
            'RC-1', 'RC-2', 'RC-3', 'RC-4', 'RC-5', 'R-X-1', 'R-X-2', 'R-B-3 (2026-08-05)', 'R-B-3 (2026-08-03)', 'D-UI-1', 'RC-6',
        ]);
    });

    test('the nested-parenthesis row keeps what its header line states plainly', () => {
        reg = loadRegister(REGISTER);
        const r = get('R-X-2');
        expect(r.provisional).toBe(true);
        expect(r.date).toBe('2026-09-02');
        expect(r.section).toBe('Serie R-X — second series');
    });

    test('rowText is the lines of the register unchanged, continuation included, and stops at the blank line', () => {
        reg = loadRegister(REGISTER);
        expect(rowText(reg, get('RC-2'))).toBe(
            '- **RC-2** (2026-08-06) — Second. Amends RC-1 (3) and RC-9: tightens it. Not related to RC-5.\n  Continuation line of RC-2.',
        );
        expect(rowText(reg, get('R-X-1'))).toBe('**R-X-1** (2026-09-01) — A paragraph row, no dash. Superata da R-X-2 il 2026-09-02.');
    });

    test('series is the ID without its number', () => {
        expect(seriesOf('RC-49')).toBe('RC');
        expect(seriesOf('R-SIM-3')).toBe('R-SIM');
        expect(seriesOf('D-UI-15')).toBe('D-UI');
        expect(seriesOf('D-4-1')).toBe('D-4');
        expect(seriesOf('R-B9-bis')).toBe('R-B9');
    });
});

describe('findRows: the ID argument', () => {
    test('a bare ID finds every row of it; the dated form narrows a shared sigla', () => {
        reg = loadRegister(REGISTER);
        expect(findRows(reg, 'R-B-3')).toHaveLength(2);
        const dated = findRows(reg, 'R-B-3 (2026-08-03)');
        expect(dated).toHaveLength(1);
        expect(rowText(reg, dated[0])).toContain('the older series');
    });

    test('an unknown ID finds nothing', () => {
        reg = loadRegister(REGISTER);
        expect(findRows(reg, 'RC-99')).toEqual([]);
    });
});

describe('statusOf', () => {
    test('active, provisional, and superseded by three routes', () => {
        reg = loadRegister(REGISTER);
        expect(statusOf(reg, get('RC-1'))).toBe('active');
        expect(statusOf(reg, get('RC-3'))).toBe('provisional');
        expect(statusOf(reg, get('RC-6'))).toBe('superseded'); // sits under ## Superate
        expect(statusOf(reg, get('RC-5'))).toBe('superseded'); // an item of Superate points at it
        expect(statusOf(reg, get('R-X-1'))).toBe('superseded'); // its own text says «Superata da R-X-2»
    });

    test('a row another row only names with «Supersedes» stays active', () => {
        reg = loadRegister(REGISTER);
        expect(statusOf(reg, get('RC-1'))).toBe('active'); // RC-3 supersedes RC-1
    });
});

describe('relatedOf: depth one, both directions', () => {
    test('forward and backward forms, named by direction', () => {
        reg = loadRegister(REGISTER);
        expect(relations('RC-2')).toEqual(['amends:D-UI-1', 'amends:RC-1', 'amends:RC-4']);
        expect(relations('RC-1')).toEqual(['amended-by:R-X-1', 'amended-by:RC-2', 'superseded-by:RC-3']);
    });

    test('«Amended by X» and «Emendata il DATE da X» point from X to the row that holds the text', () => {
        reg = loadRegister(REGISTER);
        expect(relations('D-UI-1')).toEqual(['amended-by:RC-2']);
        expect(relations('RC-4')).toEqual(['amended-by:RC-2', 'supersedes:RC-5']);
    });

    test('«superata da X» in the row, and in a Superate pointer', () => {
        reg = loadRegister(REGISTER);
        expect(relations('R-X-1')).toEqual(['amends:RC-1', 'superseded-by:R-X-2']); // the trailing paragraph is the row's
        expect(relations('RC-5')).toEqual(['superseded-by:RC-4']);
    });

    test('a negated marker and an ID outside the clause make no edge', () => {
        reg = loadRegister(REGISTER);
        expect(relations('RC-5').some((r) => r.includes('RC-1') || r.includes('amend'))).toBe(false); // «does not amend RC-1», «non emenda RC-2»
        expect(relations('RC-2').some((r) => r.endsWith(':RC-5'))).toBe(false); // «Not related to RC-5» is past the colon
    });

    test('a name that is not a row of the register is a marker without an edge', () => {
        reg = loadRegister(REGISTER);
        expect(reg.edges.every((e) => e.from.id !== 'RC-9' && e.to.id !== 'RC-9')).toBe(true); // «and RC-9» is not a row
        expect(relations('D-UI-1')).toEqual(['amended-by:RC-2']); // «Renumbered by P-...» adds nothing
    });

    test('a row never relates to itself, and a clause closed by the bold stops the IDs', () => {
        const text = [
            '## S',
            '',
            '- **RC-1** (2026-08-05) — A. Amends RC-1 (3).',
            '- **RC-2** (2026-08-05) — **Amends the labels of RC-1(3).** It collides with RC-3.',
            '- **RC-3** (2026-08-05) — C. RC-1 as amended by RC-2 stays.',
        ].join('\n');
        const r = loadRegister(text);
        expect(r.edges.map((e) => `${e.from.id} ${e.kind} ${e.to.id}`)).toEqual(['RC-2 amends RC-1']);
    });

    test('a row is related once, with its relations joined', () => {
        const text = ['## S', '', '- **RC-1** (2026-08-05) — A. Amends RC-2.', '- **RC-2** (2026-08-05) — B. Amends RC-1.'].join('\n');
        const r = loadRegister(text);
        const rel = relatedOf(r, r.rows[0]);
        expect(rel).toHaveLength(1);
        expect(rel[0].relation).toBe('amends, amended-by');
    });
});

describe('resultOf', () => {
    test('--no-related gives an empty related; the JSON shape is {id, status, series, section, row, related}', () => {
        reg = loadRegister(REGISTER);
        const withRel = resultOf(reg, get('RC-2'), true);
        expect(Object.keys(withRel).sort()).toEqual(['id', 'related', 'row', 'section', 'series', 'status']);
        expect(withRel.related.length).toBeGreaterThan(0);
        expect(Object.keys(withRel.related[0]).sort()).toEqual(['id', 'relation', 'row']);
        expect(resultOf(reg, get('RC-2'), false).related).toEqual([]);
    });
});

describe('markerStats', () => {
    test('every marker line of the grep is matched by form; those that name a row also have an edge', () => {
        reg = loadRegister(REGISTER);
        const s = markerStats(reg);
        expect(s.total).toBeGreaterThan(5);
        expect(s.matched).toBe(s.total);
        expect(s.unmatched).toEqual([]);
        expect(s.withEdge).toBeLessThan(s.total); // «Not related», «Renumbered by P-...», the negated line
        expect(s.withEdge).toBeGreaterThan(4);
    });
});

// ── The script on a throwaway tree ──────────────────────────────────────────

const GATES = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dirs: string[] = [];
afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

function tree(register: string): string {
    const dir = mkdtempSync(join(tmpdir(), 'decisions-query-'));
    dirs.push(dir);
    mkdirSync(join(dir, 'docs'), { recursive: true });
    writeFileSync(join(dir, 'docs', 'decisions.md'), register);
    return dir;
}

function run(dir: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
    const r = spawnSync(
        process.execPath,
        ['--disable-warning=ExperimentalWarning', '--experimental-strip-types', join(GATES, 'decisions-query.ts'), '--root', dir, ...args],
        { encoding: 'utf8' },
    );
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe('decisions-query.ts', () => {
    test('found IDs print their row, status, series and section; exit 0', () => {
        const r = run(tree(REGISTER), ['RC-3']);
        expect(r.status).toBe(0);
        expect(r.stdout).toContain('== RC-3  [provisional]  series RC  section: Processo');
        expect(r.stdout).toContain('- **RC-3** (2026-08-07, provisional');
        expect(r.stdout).toContain('-- supersedes: RC-1');
    });

    test('a missing ID: «not found» on stderr, exit 1, the found ones still printed', () => {
        const r = run(tree(REGISTER), ['RC-1', 'RC-99', 'RC-2']);
        expect(r.status).toBe(1);
        expect(r.stderr).toBe('not found: RC-99\n');
        expect(r.stdout).toContain('== RC-1  [active]');
        expect(r.stdout).toContain('== RC-2  [active]');
    });

    test('--no-related prints the row and nothing related', () => {
        const dir = tree(REGISTER);
        expect(run(dir, ['RC-1']).stdout).toContain('-- amended-by:');
        expect(run(dir, ['RC-1', '--no-related']).stdout).not.toContain('-- ');
    });

    test('--json prints an array of {id, status, series, section, row, related}', () => {
        const r = run(tree(REGISTER), ['RC-4', 'D-UI-1', '--json']);
        const parsed = JSON.parse(r.stdout);
        expect(parsed.map((p: { id: string }) => p.id)).toEqual(['RC-4', 'D-UI-1']);
        expect(parsed[0].related).toEqual([
            { id: 'RC-2', relation: 'amended-by', row: expect.stringContaining('**RC-2**') },
            { id: 'RC-5', relation: 'supersedes', row: expect.stringContaining('**RC-5**') },
        ]);
    });

    test('the dated form is one argument or two', () => {
        const dir = tree(REGISTER);
        const one = run(dir, ['R-B-3 (2026-08-03)', '--no-related']);
        const two = run(dir, ['R-B-3', '(2026-08-03)', '--no-related']);
        expect(one.status).toBe(0);
        expect(one.stdout).toContain('the older series');
        expect(one.stdout).not.toContain('the newer series');
        expect(two.stdout).toBe(one.stdout);
    });

    test('no ID, an unknown option and an unreadable register are usage errors', () => {
        const dir = tree(REGISTER);
        expect(run(dir, []).status).toBe(1);
        expect(run(dir, ['RC-1', '--bogus']).status).toBe(1);
        expect(run(join(dir, 'nowhere'), ['RC-1']).status).toBe(1);
    });

    test('a list item whose header cannot be read is exit 2, the line printed', () => {
        const r = run(tree('## S\n\n- **RC-1** (not a date) — x\n'), ['RC-1']);
        expect(r.status).toBe(2);
        expect(r.stderr).toContain('decisions.md:3:');
    });
});

// ── The live register ───────────────────────────────────────────────────────

const LIVE = resolve(GATES, '..', '..', '..', 'docs', 'decisions.md');

describe('the live register', () => {
    test('the recogniser matches at least 90% of the marker lines, and RC-45 amends RC-32', () => {
        const live = loadRegister(readFileSync(LIVE, 'utf8'));
        const s = markerStats(live);
        expect(s.matched / s.total).toBeGreaterThanOrEqual(0.9);
        expect(live.edges.some((e) => e.from.id === 'RC-45' && e.to.id === 'RC-32' && e.kind === 'amends')).toBe(true);
        expect(findRows(live, 'D-UI-15')).toHaveLength(1); // outside the R-... grammar of the first parseRows
        expect(findRows(live, 'R-VP-1')).toHaveLength(1); // a paragraph row
    });
});
