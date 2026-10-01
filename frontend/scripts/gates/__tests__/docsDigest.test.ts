import { describe, test, expect, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    HeaderParseError,
    MANUAL_MARKER,
    MANUAL_STUB,
    confidence,
    manualSection,
    parseRows,
    render,
} from '../docs-digest.ts';
import type { Row } from '../docs-digest.ts';

// Header lines copied verbatim from docs/decisions.md at d78f1981b, one per shape
// the register holds: the ratified `(date)` with `:` and with `.`, the legacy
// `(date) —`, the two provisional shapes of 2026-09-26/27 before RC-25's grammar,
// the six-field form with `.` and with `:` at the end of the line, and a
// ratified row with a free-text annotation in the parenthesis.
const REGISTER = [
    '# Decisions — vincoli operativi attivi',
    '',
    '## Processo',
    '',
    '- **RC-3** (2026-08-05) — Due corsie. Corsia completa (two-phase, report in `docs/discovery/`,',
    '  ratifiche, verbale, gate pieni, effort xhigh) solo per: critical zone.',
    '- **RC-25** (2026-09-26): **Decisions proceed; ratification is asynchronous and revocable.** The project chat',
    '  answers its own design questions as RC-21 answers Claude Code\'s.',
    '- **RC-29** (2026-09-27, provisional, unattended): **The commit gate of a lane is the hook layer, not an',
    '  `ask`.** Measured on the real tree at `651f10543`.',
    '',
    '### Decisione 2026-09-27: the go-ahead of a critical-zone lane under bypass (RC-30)',
    '',
    '- **RC-30** (2026-09-27, provisional, unattended, evidence: measured, verified: none, reversible: trunk):',
    '  **A critical-zone lane runs orchestrated with an explicit go-ahead.** Alfonso, in chat.',
    '',
    '## Serie R-SIM — Pannello di simulazione',
    '',
    '- **R-SIM-57** (2026-09-26). **Profili di sistema.** Otto, secondo la tabella del catalogo.',
    '- **R-SIM-67** (2026-09-26, provisional, unattended). **Le dichiarazioni vivono nel metamodello.** Una per classe.',
    '- **R-SIM-73** (2026-09-27, provisional, unattended, evidence: measured, verified: agent, reversible: branch). Un',
    '  attributo derivato non si memorizza. Si ricalcola a ogni passo.',
    '- **R-SIM-76** (2026-09-27, provisional, unattended, evidence: read, verified: none, reversible: trunk). **Il',
    '  profilo demo resta chiuso.** Nessuna chiave nuova.',
    '- **R-RAIL-34** (2026-08-12, «D9» nel prompt) — **Il segmento del metamodel cade sempre nel',
    '  rail.** Anche a sinistra.',
    '- **Rinviato** — la casa degli scenari: nel quinto passo sono documenti JSON.',
    '- **R-B9-bis** (2026-08-03) — outside the ID grammar, never a row.',
    '',
].join('\n');

const row = (over: Partial<Row>): Row => ({
    id: 'R-X-1',
    line: 1,
    date: '2026-09-27',
    provisional: true,
    unattended: true,
    evidence: null,
    verified: null,
    reversible: null,
    annotations: [],
    section: 'S',
    sectionLine: 1,
    title: 'a title',
    ...over,
});

describe('parseRows on the header shapes of the register', () => {
    const rows = parseRows(REGISTER);
    const byId = new Map(rows.map((r) => [r.id, r]));

    test('only lines with an ID of the grammar and a parenthesis are rows, in file order', () => {
        expect(rows.map((r) => r.id)).toEqual([
            'RC-3', 'RC-25', 'RC-29', 'RC-30', 'R-SIM-57', 'R-SIM-67', 'R-SIM-73', 'R-SIM-76', 'R-RAIL-34',
        ]);
    });

    test('a row keeps its line number', () => {
        expect(byId.get('RC-3')?.line).toBe(5);
        expect(byId.get('RC-30')?.line).toBe(14);
        expect(byId.get('R-RAIL-34')?.line).toBe(25);
    });

    test('the date is the first field, the markers the others', () => {
        expect(byId.get('RC-25')).toMatchObject({ date: '2026-09-26', provisional: false, unattended: false, evidence: null });
        expect(byId.get('R-SIM-67')).toMatchObject({ date: '2026-09-26', provisional: true, unattended: true, evidence: null, verified: null, reversible: null });
        expect(byId.get('RC-30')).toMatchObject({ provisional: true, evidence: 'measured', verified: 'none', reversible: 'trunk' });
        expect(byId.get('R-SIM-76')).toMatchObject({ evidence: 'read', verified: 'none', reversible: 'trunk' });
    });

    test('a free-text field of a ratified row is kept as an annotation', () => {
        expect(byId.get('R-RAIL-34')).toMatchObject({ provisional: false, annotations: ['«D9» nel prompt'] });
    });

    test('the title is the opening bold, across a line break and after `:` at the end of the line', () => {
        expect(byId.get('RC-25')?.title).toBe('Decisions proceed; ratification is asynchronous and revocable.');
        expect(byId.get('RC-29')?.title).toBe('The commit gate of a lane is the hook layer, not an `ask`.');
        expect(byId.get('RC-30')?.title).toBe('A critical-zone lane runs orchestrated with an explicit go-ahead.');
        expect(byId.get('R-SIM-76')?.title).toBe('Il profilo demo resta chiuso.');
        expect(byId.get('R-SIM-57')?.title).toBe('Profili di sistema.');
    });

    test('without an opening bold the title is the first sentence', () => {
        expect(byId.get('RC-3')?.title).toBe('Due corsie.');
        expect(byId.get('R-SIM-73')?.title).toBe('Un attributo derivato non si memorizza.');
    });

    test('the title is clamped to 120 characters', () => {
        const long = 'x'.repeat(200);
        const [r] = parseRows(`## S\n\n- **RC-1** (2026-09-27): **${long}** text\n`);
        expect(r.title.length).toBe(120);
        expect(r.title.endsWith('...')).toBe(true);
    });

    test('a cut inside a code span closes the span', () => {
        const [r] = parseRows(`## S\n\n- **RC-1** (2026-09-27): **${'x'.repeat(100)} \`${'y'.repeat(40)}\`**\n`);
        expect(r.title.length).toBe(120);
        expect(r.title.endsWith('`...')).toBe(true);
        expect((r.title.match(/`/g) ?? []).length % 2).toBe(0);
    });

    test('the section is the nearest preceding ## or ### heading', () => {
        expect(byId.get('RC-29')?.section).toBe('Processo');
        expect(byId.get('RC-30')?.section).toBe('Decisione 2026-09-27: the go-ahead of a critical-zone lane under bypass (RC-30)');
        expect(byId.get('R-SIM-57')?.section).toBe('Serie R-SIM — Pannello di simulazione');
        expect(byId.get('RC-30')?.sectionLine).toBe(12);
    });
});

describe('parseRows refuses a header it cannot parse', () => {
    const failures = (text: string): Array<{ line: number; reason: string }> => {
        try {
            parseRows(text);
        } catch (err) {
            expect(err).toBeInstanceOf(HeaderParseError);
            return (err as HeaderParseError).failures.map((f) => ({ line: f.line, reason: f.reason }));
        }
        return [];
    };

    test.each([
        ['a value outside the vocabulary', '- **RC-1** (2026-09-27, provisional, unattended, evidence: guessed, verified: agent, reversible: branch). **T.**', /evidence/],
        ['a partial triple', '- **RC-1** (2026-09-27, provisional, unattended, evidence: measured, verified: agent). **T.**', /all three/],
        ['an unknown field in a provisional row', '- **RC-1** (2026-09-27, provisional, unattended, evidnce: measured). **T.**', /unknown field/],
        ['no date first', '- **RC-1** (provisional, 2026-09-27). **T.**', /date/],
        ['a separator that is not `:`, `.` or ` —`', '- **RC-1** (2026-09-27) **T.**', /separator/],
        ['an ID of the grammar without a parenthesis', '- **RC-1**: **T.**', /parenthesis/],
    ])('%s', (_name, line, reason) => {
        const f = failures(`## S\n\n${line}\n`);
        expect(f).toHaveLength(1);
        expect(f[0].line).toBe(3);
        expect(f[0].reason).toMatch(reason);
    });

    test('every bad header is reported in one run, not the first only', () => {
        const f = failures('## S\n\n- **RC-1** (2026-09-27) **T.**\n- **RC-2** (2026-09-27): fine.\n- **RC-3** (x): **T.**\n');
        expect(f.map((x) => x.line)).toEqual([3, 5]);
    });
});

describe('confidence', () => {
    test.each([
        [{ provisional: false }, 'ratified'],
        [{ provisional: false, evidence: 'inferred', verified: 'none', reversible: 'persisted' }, 'ratified'],
        [{}, 'unmarked'],
        [{ evidence: 'measured', verified: 'agent', reversible: 'branch' }, 'high'],
        [{ evidence: 'measured', verified: 'none', reversible: 'branch' }, 'medium'],
        [{ evidence: 'read', verified: 'agent', reversible: 'branch' }, 'medium'],
        [{ evidence: 'read', verified: 'none', reversible: 'branch' }, 'low'],
        [{ evidence: 'inferred', verified: 'agent', reversible: 'branch' }, 'low'],
        [{ evidence: 'inferred', verified: 'none', reversible: 'branch' }, 'low'],
    ] as Array<[Partial<Row>, string]>)('%o -> %s', (over, expected) => {
        expect(confidence(row(over))).toBe(expected);
    });

    test('reversible never changes the label', () => {
        for (const reversible of ['branch', 'trunk', 'persisted'] as const) {
            expect(confidence(row({ evidence: 'measured', verified: 'agent', reversible }))).toBe('high');
        }
    });
});

describe('render', () => {
    const rows = parseRows(REGISTER);
    const out = render(rows, '2026-09-27', null, 'abc1234');

    test('H1, then the RC-28 counts over the rows of the date only', () => {
        const lines = out.split('\n');
        expect(lines[0]).toBe('# Decisions digest 2026-09-27');
        expect(lines[2]).toBe(
            'Generated by npm run docs:digest from docs/decisions.md at abc1234; rows dated 2026-09-27: 4 ' +
            '(ratified 0, provisional 4: high 1, medium 1, low 1, unmarked 1); reversible: branch 1, trunk 2, persisted 0.',
        );
    });

    test('one H2 per section in file order, one line per row', () => {
        expect(out.match(/^## .*$/gm)).toEqual([
            '## Processo',
            '## Decisione 2026-09-27: the go-ahead of a critical-zone lane under bypass (RC-30)',
            '## Serie R-SIM - Pannello di simulazione',
            '## For Alfonso',
        ]);
        expect(out).toContain('- **RC-30** · medium · measured/none/trunk · A critical-zone lane runs orchestrated with an explicit go-ahead. (decisions.md:14)\n');
        expect(out).toContain('- **RC-29** · unmarked · -/-/- · The commit gate of a lane is the hook layer, not an `ask`. (decisions.md:9)\n');
        expect(out).not.toContain('RC-25');
    });

    test('provisional before ratified, low first, then unmarked, medium, high', () => {
        const mixed: Row[] = [
            row({ id: 'R-A-1', provisional: false }),
            row({ id: 'R-A-2', evidence: 'measured', verified: 'agent', reversible: 'branch' }),
            row({ id: 'R-A-3' }),
            row({ id: 'R-A-4', evidence: 'read', verified: 'agent', reversible: 'branch' }),
            row({ id: 'R-A-5', evidence: 'inferred', verified: 'agent', reversible: 'persisted' }),
        ];
        const ids = [...render(mixed, '2026-09-27', null, 'x').matchAll(/^- \*\*(R-A-\d)\*\*/gm)].map((m) => m[1]);
        expect(ids).toEqual(['R-A-5', 'R-A-3', 'R-A-4', 'R-A-2', 'R-A-1']);
    });

    test('no em dash in what the generator writes', () => {
        expect(out.split(MANUAL_MARKER)[0]).not.toContain('—');
    });

    test('without a manual section: the marker, then the stub', () => {
        expect(out.endsWith(`\n${MANUAL_MARKER}\n${MANUAL_STUB}`)).toBe(true);
    });

    test('with a manual section: the marker, then the section verbatim', () => {
        const manual = '\n## For Alfonso\n\n- R-SIM-76 is `low` and on the trunk: read it first — today.\n\n\n';
        const withManual = render(rows, '2026-09-27', manual, 'abc1234');
        expect(withManual.endsWith(`\n${MANUAL_MARKER}\n${manual}`)).toBe(true);
        expect(withManual.split(MANUAL_MARKER)[0]).toBe(out.split(MANUAL_MARKER)[0]);
    });

    test('a date without rows still renders, with zero counts', () => {
        const empty = render(rows, '2026-01-01', null, 'x');
        expect(empty).toContain('rows dated 2026-01-01: 0 (ratified 0, provisional 0:');
        expect(empty).toContain('No rows dated 2026-01-01.');
    });
});

describe('manualSection', () => {
    test('no file: null; a file with the marker: the text after its line', () => {
        expect(manualSection(null)).toBeNull();
        expect(manualSection(`# D\n\n${MANUAL_MARKER}\n\n## For Alfonso\n\nx\n`)).toBe('\n## For Alfonso\n\nx\n');
    });

    test('a file without the marker is refused, never overwritten', () => {
        expect(() => manualSection('# D\n\nhand-written\n')).toThrow(/marker/);
    });
});

// ── The script on a throwaway tree: --write, idempotence, preservation ─────

const GATES = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dirs: string[] = [];
afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

function tree(register: string): string {
    const dir = mkdtempSync(join(tmpdir(), 'docs-digest-'));
    dirs.push(dir);
    const gates = join(dir, 'frontend', 'scripts', 'gates');
    mkdirSync(gates, { recursive: true });
    mkdirSync(join(dir, 'docs'), { recursive: true });
    writeFileSync(join(gates, 'docs-digest.ts'), readFileSync(join(GATES, 'docs-digest.ts'), 'utf8'));
    writeFileSync(join(dir, 'docs', 'decisions.md'), register);
    return dir;
}

function digest(dir: string, args: string[]): { status: number | null; out: string } {
    const r = spawnSync(
        process.execPath,
        ['--disable-warning=ExperimentalWarning', '--experimental-strip-types', join(dir, 'frontend', 'scripts', 'gates', 'docs-digest.ts'), ...args],
        { encoding: 'utf8', cwd: dir },
    );
    return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

describe('docs-digest.ts', () => {
    test('without --write it prints and writes nothing', () => {
        const dir = tree(REGISTER);
        const r = digest(dir, ['--date', '2026-09-27']);
        expect(r.status).toBe(0);
        expect(r.out).toContain('# Decisions digest 2026-09-27');
        expect(existsSync(join(dir, 'docs', 'digest'))).toBe(false);
    });

    test('--write twice: the second run changes nothing', () => {
        const dir = tree(REGISTER);
        const file = join(dir, 'docs', 'digest', '2026-09-27.md');
        expect(digest(dir, ['--date', '2026-09-27', '--write']).status).toBe(0);
        const first = readFileSync(file, 'utf8');
        const r = digest(dir, ['--date', '2026-09-27', '--write']);
        expect(r.status).toBe(0);
        expect(r.out).toMatch(/unchanged/);
        expect(readFileSync(file, 'utf8')).toBe(first);
    });

    test('a hand-written section survives a regeneration over a changed register', () => {
        const dir = tree(REGISTER);
        const file = join(dir, 'docs', 'digest', '2026-09-27.md');
        digest(dir, ['--date', '2026-09-27', '--write']);
        const manual = '\n## For Alfonso\n\nR-SIM-76 first; RC-29 has no grammar yet.\n';
        const generated = readFileSync(file, 'utf8').split(MANUAL_MARKER)[0];
        writeFileSync(file, `${generated}${MANUAL_MARKER}\n${manual}`);

        writeFileSync(
            join(dir, 'docs', 'decisions.md'),
            `${REGISTER}- **RC-31** (2026-09-27, provisional, unattended, evidence: inferred, verified: none, reversible: persisted). **New.**\n`,
        );
        expect(digest(dir, ['--date', '2026-09-27', '--write']).status).toBe(0);
        const after = readFileSync(file, 'utf8');
        expect(after).toContain('- **RC-31** · low · inferred/none/persisted · New.');
        expect(after.endsWith(`${MANUAL_MARKER}\n${manual}`)).toBe(true);
    });

    test('a digest file without the marker is not overwritten', () => {
        const dir = tree(REGISTER);
        mkdirSync(join(dir, 'docs', 'digest'));
        const file = join(dir, 'docs', 'digest', '2026-09-27.md');
        writeFileSync(file, '# hand-written\n');
        expect(digest(dir, ['--date', '2026-09-27', '--write']).status).toBe(1);
        expect(readFileSync(file, 'utf8')).toBe('# hand-written\n');
    });

    test('exit 2 on a header it cannot parse, printing the line', () => {
        const dir = tree(`${REGISTER}- **RC-31** (2026-09-27, provisional, evidence: measured). **Bad.**\n`);
        const r = digest(dir, ['--date', '2026-09-27']);
        expect(r.status).toBe(2);
        expect(r.out).toContain('- **RC-31** (2026-09-27, provisional, evidence: measured). **Bad.**');
    });

    test('--all: one digest per date that has rows', () => {
        const dir = tree(REGISTER);
        expect(digest(dir, ['--all', '--write']).status).toBe(0);
        for (const d of ['2026-08-05', '2026-08-12', '2026-09-26', '2026-09-27']) {
            expect(existsSync(join(dir, 'docs', 'digest', `${d}.md`)), d).toBe(true);
        }
    });
});
