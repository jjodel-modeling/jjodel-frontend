import { describe, test, expect, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// check-docs.ts and rotate-log.ts derive the repo root from their own location, so
// they run here on a throwaway tree: the three gate files copied under
// <tmp>/frontend/scripts/gates, and the documents they read written under <tmp>.
// The scripts run are the committed ones, or one line of them mutated.

const GATES = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GATE_FILES = ['check-docs.ts', 'log-tools.ts', 'rotate-log.ts'];

const BLOCK = '## YYYY-MM-DD — type: short description\n**Prompt**: summary\n**Prompt document name**: YYYY-MM-DD HH:mm\n';
const LOG_HEADER = '# Log\n\nNewest first.\n\n';
const INBOX_HEADER = '# inbox\n\n---\n\n'; // 4 lines: the first entry heading is on line 5

const entry = (date: string, title: string, fields: Array<[string, string]>): string =>
    `## ${date} — ${title}\n${fields.map(([k, v]) => `**${k}**: ${v}\n`).join('')}\n`;

/** A valid task entry; a field set to null is left out. */
function task(date: string, over: Record<string, string | null> = {}, title = 'fix: a task'): string {
    const base: Record<string, string> = {
        Corregge: '—',
        Causa: '—',
        Notes: 'short',
        'Prompt document name': `${date} 10:00`,
    };
    const fields = Object.entries({ ...base, ...over }).filter((kv): kv is [string, string] => kv[1] !== null);
    return entry(date, title, fields);
}

const TICKET = (date = '2026-09-25', over: Record<string, string | null> = {}): string => {
    const base: Record<string, string> = { Ticket: 'a finding', Priority: 'high', 'Found in': 'P-2026-09-24-1005' };
    return entry(date, 'ticket: a finding', Object.entries({ ...base, ...over }).filter((kv): kv is [string, string] => kv[1] !== null));
};

interface Tree {
    active: string;
    archive?: string;
    inboxes?: Record<string, string>;
}

interface Mutation {
    file: string;
    from: string;
    to: string;
}

interface Run {
    status: number | null;
    out: string;
    dir: string;
}

const dirs: string[] = [];
/** Output of the last run, so the bench can tell a mutant that misbehaves from one that crashes. */
let lastOut = '';
afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

function run(tree: Tree, script: 'check-docs.ts' | 'rotate-log.ts', args: string[] = [], mutation?: Mutation): Run {
    const dir = mkdtempSync(join(tmpdir(), 'check-docs-'));
    dirs.push(dir);
    const gates = join(dir, 'frontend', 'scripts', 'gates');
    mkdirSync(gates, { recursive: true });
    mkdirSync(join(dir, 'docs', 'log-inbox'), { recursive: true });

    for (const f of GATE_FILES) {
        let text = readFileSync(join(GATES, f), 'utf8');
        if (mutation && mutation.file === f) {
            // Exactly one occurrence: a refactor that moves the line must break the bench loudly.
            expect(text.split(mutation.from), `mutation anchor not unique: ${mutation.from}`).toHaveLength(2);
            text = text.replace(mutation.from, () => mutation.to);
        }
        writeFileSync(join(gates, f), text);
    }
    writeFileSync(join(dir, 'CLAUDE.md'), `# claude\n\n\`\`\`\n${BLOCK}\`\`\`\n`);
    writeFileSync(join(dir, 'docs', 'PROTOCOL.md'), `# protocol\n\n\`\`\`\n${BLOCK}\`\`\`\n`);
    writeFileSync(join(dir, 'docs', 'claude-code-log.md'), tree.active);
    writeFileSync(join(dir, 'docs', 'claude-code-log-archive.md'), tree.archive ?? '# Archive\n\n');
    for (const [lane, text] of Object.entries(tree.inboxes ?? {})) writeFileSync(join(dir, 'docs', 'log-inbox', `${lane}.md`), text);

    const r = spawnSync(
        process.execPath,
        ['--disable-warning=ExperimentalWarning', '--experimental-strip-types', join(gates, script), ...args],
        { encoding: 'utf8' },
    );
    lastOut = `${r.stdout}${r.stderr}`;
    return { status: r.status, out: lastOut, dir };
}

const snapshot = (dir: string): string[] =>
    ['docs/claude-code-log.md', 'docs/claude-code-log-archive.md', 'docs/log-inbox/probe.md'].map((f) => readFileSync(join(dir, f), 'utf8'));

// ── Scenarios: each returns whether the gate behaves as it must ─────────

const GREEN_LOG = LOG_HEADER + task('2026-09-25') + task('2026-09-24');

const scenarios = {
    /** Control 1: an inbox entry with Corregge absent and Causa with an annotation must turn Check B red. */
    inboxLintedByB: (m?: Mutation) => {
        const r = run(
            { active: GREEN_LOG, inboxes: { probe: INBOX_HEADER + task('2026-09-25', { Corregge: null, Causa: '(c) with an annotation' }, 'fix: probe') } },
            'check-docs.ts',
            [],
            m,
        );
        return r.status === 1 && r.out.includes('(docs/log-inbox/probe.md:5)') && r.out.includes('(c) with an annotation') && r.out.includes('FAIL  Check B');
    },
    /** A 501-character Notes in an inbox entry must turn Check C red, on the Notes line. */
    inboxLintedByC: (m?: Mutation) => {
        const r = run(
            { active: GREEN_LOG, inboxes: { probe: INBOX_HEADER + task('2026-09-25', { Notes: 'x'.repeat(501) }, 'fix: probe') } },
            'check-docs.ts',
            [],
            m,
        );
        return r.status === 1 && r.out.includes('file    : docs/log-inbox/probe.md:8') && r.out.includes('FAIL  Check C');
    },
    /** Control 2: a valid ticket needs no Corregge and no Causa. */
    validTicketPasses: (m?: Mutation) => {
        const r = run({ active: LOG_HEADER + TICKET() + task('2026-09-24'), inboxes: { probe: INBOX_HEADER + TICKET('2026-09-26') } }, 'check-docs.ts', [], m);
        return r.status === 0 && r.out.includes('4/4 check(s) passed');
    },
    /** An invalid ticket is judged by the ticket rules and named. */
    invalidTicketFails: (m?: Mutation) => {
        const r = run({ active: GREEN_LOG, inboxes: { probe: INBOX_HEADER + TICKET('2026-09-25', { Priority: 'urgent' }) } }, 'check-docs.ts', [], m);
        return r.status === 1 && r.out.includes('field   : **Priority**') && !r.out.includes('**Corregge**');
    },
    /** A Corregge that names an entry waiting in a sibling inbox resolves. */
    siblingInboxResolves: (m?: Mutation) => {
        const r = run(
            {
                active: GREEN_LOG,
                inboxes: {
                    a: INBOX_HEADER + task('2026-09-26', { Corregge: '2026-09-26 08:00' }, 'fix: corrects the sibling'),
                    b: INBOX_HEADER + task('2026-09-26', { 'Prompt document name': '2026-09-26 08:00' }, 'fix: the sibling'),
                },
            },
            'check-docs.ts',
            [],
            m,
        );
        return r.status === 0 && !r.out.includes('matches no');
    },
    /** The fold refuses, exit 1, when an inbox entry would fail the gate. */
    foldRefuses: (m?: Mutation) => {
        const r = run(
            { active: GREEN_LOG, inboxes: { probe: INBOX_HEADER + task('2026-09-25', { Corregge: null }, 'fix: probe') } },
            'rotate-log.ts',
            ['--fold'],
            m,
        );
        return r.status === 1 && r.out.includes('LINT  docs/log-inbox/probe.md:5') && r.out.includes('refusing to fold');
    },
    /** An inbox entry older than the fortieth goes to the archive in the same run and is listed. */
    straightToArchiveListed: (m?: Mutation) => {
        const r = run(
            { active: GREEN_LOG, inboxes: { probe: INBOX_HEADER + task('2026-09-01', {}, 'fix: older than everything') } },
            'rotate-log.ts',
            ['--fold', '--rotate', '--keep=2'],
            m,
        );
        return r.status === 0 && r.out.includes('STRAIGHT-TO-ARCHIVE  lane "probe"  ## 2026-09-01 — fix: older than everything');
    },
    /** A ticket that leaves the active log is marked in the MOVE line. */
    ticketMarkedOnMove: (m?: Mutation) => {
        const r = run({ active: LOG_HEADER + task('2026-09-26') + TICKET('2026-09-25') }, 'rotate-log.ts', ['--rotate', '--keep=1'], m);
        return r.status === 0 && r.out.includes('MOVE  [ticket] ## 2026-09-25 — ticket: a finding');
    },
};

describe('check-docs on a throwaway tree', { timeout: 60_000 }, () => {
    test('a valid tree with no inbox is 4/4, exit 0', () => {
        const r = run({ active: GREEN_LOG }, 'check-docs.ts');
        expect(r.status).toBe(0);
        expect(r.out).toContain('4/4 check(s) passed');
    });

    test('control 1: an invalid inbox entry turns Check B red, naming the inbox file and the entry line', () => {
        expect(scenarios.inboxLintedByB()).toBe(true);
        const r = run(
            { active: GREEN_LOG, inboxes: { probe: INBOX_HEADER + task('2026-09-25', { Corregge: null, Causa: '(c) with an annotation' }, 'fix: probe') } },
            'check-docs.ts',
        );
        expect(r.out).toContain('ERROR  required field missing');
        expect(r.out).toContain('file    : docs/log-inbox/probe.md');
    });

    test('an inbox entry with a 501-character Notes turns Check C red on the Notes line', () => {
        expect(scenarios.inboxLintedByC()).toBe(true);
    });

    test('the inbox is not read as a task list when empty: a lane waiting with a valid entry is green with a warning', () => {
        const r = run({ active: GREEN_LOG, inboxes: { probe: INBOX_HEADER + task('2026-09-25', {}, 'fix: probe') } }, 'check-docs.ts');
        expect(r.status).toBe(0);
        expect(r.out).toContain('lane "probe"');
        expect(r.out).toContain('1 entry in 1 lane inbox file(s)');
    });

    test('control 2: a valid ticket passes in the active log and in an inbox, with no Corregge and no Causa', () => {
        expect(scenarios.validTicketPasses()).toBe(true);
    });

    test('an invalid ticket is judged by the ticket rules: Priority named, Corregge not asked for', () => {
        expect(scenarios.invalidTicketFails()).toBe(true);
    });

    test('the legacy `ticket:` heading dated before the from-date is judged as a task and stays green', () => {
        const legacy = entry('2026-09-20', 'ticket: legacy', [['Corregge', '—'], ['Causa', '—']]);
        const r = run({ active: LOG_HEADER + legacy + task('2026-09-19') }, 'check-docs.ts');
        expect(r.status).toBe(0);
    });

    test('a `**Ticket** (` paragraph inside a task entry stays inert', () => {
        const text = task('2026-09-25').replace(/\n$/, '') + '**Ticket** (opened, not implemented here). A paragraph.\n\n';
        expect(run({ active: LOG_HEADER + text }, 'check-docs.ts').status).toBe(0);
    });

    test('a Corregge that names an entry waiting in a sibling inbox resolves; an unknown one is a warning, not an error', () => {
        expect(scenarios.siblingInboxResolves()).toBe(true);
        const r = run({ active: GREEN_LOG, inboxes: { probe: INBOX_HEADER + task('2026-09-26', { Corregge: '2026-09-19 08:00' }, 'fix: p') } }, 'check-docs.ts');
        expect(r.status).toBe(0);
        expect(r.out).toContain('2026-09-19 08:00 is well-formed but matches no');
    });
});

describe('rotate-log on a throwaway tree', { timeout: 60_000 }, () => {
    test('control 3: --fold refuses on an invalid inbox entry, exit 1, in a dry run', () => {
        expect(scenarios.foldRefuses()).toBe(true);
    });

    test('control 3, --write: the refusal comes before any write, every file is left as it was', () => {
        const tree: Tree = { active: GREEN_LOG, inboxes: { probe: INBOX_HEADER + task('2026-09-25', { Corregge: null }, 'fix: probe') } };
        const before = run(tree, 'check-docs.ts');
        const r = run(tree, 'rotate-log.ts', ['--fold', '--rotate', '--write']);
        expect(r.status).toBe(1);
        expect(r.out).toContain('LINT  docs/log-inbox/probe.md:5');
        expect(r.out).not.toContain('written and verified');
        expect(snapshot(r.dir)).toEqual(snapshot(before.dir));
    });

    test('a valid inbox entry folds: exit 0, nothing refused', () => {
        const r = run({ active: GREEN_LOG, inboxes: { probe: INBOX_HEADER + task('2026-09-26', {}, 'fix: probe') } }, 'rotate-log.ts', ['--fold']);
        expect(r.status).toBe(0);
        expect(r.out).toContain('fold: 1 entry folded');
    });

    test('an inbox entry older than the fortieth goes to the archive in the same run, and the run says so', () => {
        expect(scenarios.straightToArchiveListed()).toBe(true);
    });

    test('a ticket leaving the active log is marked in the MOVE line; a task is not', () => {
        expect(scenarios.ticketMarkedOnMove()).toBe(true);
        const r = run({ active: LOG_HEADER + task('2026-09-26') + task('2026-09-25') }, 'rotate-log.ts', ['--rotate', '--keep=1']);
        expect(r.out).toContain('MOVE  ## 2026-09-25 — fix: a task');
        expect(r.out).not.toContain('[ticket]');
    });
});

// ── Mutation bench ──────────────────────────────────────────────────────
//
// Each mutant is a copy of the committed gate with ONE line changed, run on the same
// throwaway tree as the scenario that must catch it. The scenario has to hold on the
// real gate above and fail here (CLAUDE.md §5): the mutant that survives names a
// scenario that proves nothing.

const MUTANTS: Array<{ name: string; mutation: Mutation; scenario: keyof typeof scenarios }> = [
    {
        name: 'check-docs reads no inbox — killed by control 1',
        mutation: { file: 'check-docs.ts', from: '    return listInboxes().map((i) => ({ ...i, text: read(i.path) }));', to: '    return [];' },
        scenario: 'inboxLintedByB',
    },
    {
        name: 'check-docs reads no inbox — killed by the Notes control too',
        mutation: { file: 'check-docs.ts', from: '    return listInboxes().map((i) => ({ ...i, text: read(i.path) }));', to: '    return [];' },
        scenario: 'inboxLintedByC',
    },
    {
        name: 'Check B ignores the findings of an inbox entry — killed by control 1',
        mutation: { file: 'check-docs.ts', from: "            if (f.check !== 'B') continue;", to: "            if (f.check !== 'B' || e.path !== LOG_MD) continue;" },
        scenario: 'inboxLintedByB',
    },
    {
        name: 'Check C ignores the findings of an inbox entry — killed by the Notes control',
        mutation: { file: 'check-docs.ts', from: "            if (f.check !== 'C') continue;", to: "            if (f.check !== 'C' || e.path !== LOG_MD) continue;" },
        scenario: 'inboxLintedByC',
    },
    {
        name: 'a Corregge is not resolved against the sibling inboxes — killed by the sibling case',
        mutation: {
            file: 'check-docs.ts',
            from: '    for (const i of inboxes) for (const k of promptNameKeys(splitLog(i.text).entries)) resolvable.add(k);',
            to: '',
        },
        scenario: 'siblingInboxResolves',
    },
    {
        name: 'the entry type is never a ticket — killed by control 2',
        mutation: {
            file: 'log-tools.ts',
            from: "    return TICKET_HEADING.test(entry.heading) && entry.date >= TICKET_LINT_FROM_DATE ? 'ticket' : 'task';",
            to: "    return 'task';",
        },
        scenario: 'validTicketPasses',
    },
    {
        name: 'the ticket Priority is not checked — killed by the invalid-ticket case',
        mutation: { file: 'log-tools.ts', from: '    else if (!TICKET_PRIORITIES.includes(priority)) {', to: '    else if (false) {' },
        scenario: 'invalidTicketFails',
    },
    {
        name: 'the fold does not refuse — killed by control 3',
        mutation: { file: 'rotate-log.ts', from: '        if (failures > 0) {', to: '        if (false) {' },
        scenario: 'foldRefuses',
    },
    {
        name: 'the fold lints nothing — killed by control 3',
        mutation: { file: 'rotate-log.ts', from: '                const lint = lintEntry(entry, known);', to: '                const lint = { findings: [], unresolved: [] as string[] };' },
        scenario: 'foldRefuses',
    },
    {
        name: 'the straight-to-archive listing is dropped — killed by the listing case',
        mutation: { file: 'rotate-log.ts', from: '        if (straight.length > 0) {', to: '        if (false) {' },
        scenario: 'straightToArchiveListed',
    },
    {
        name: 'the ticket mark is dropped from MOVE — killed by the mark case',
        mutation: { file: 'rotate-log.ts', from: "${entryType(e) === 'ticket' ? '[ticket] ' : ''}", to: '' },
        scenario: 'ticketMarkedOnMove',
    },
];

describe('mutation bench — check-docs and rotate-log', { timeout: 120_000 }, () => {
    test.each(MUTANTS)('mutant: $name', ({ mutation, scenario }) => {
        expect(scenarios[scenario]()).toBe(true); // the real gate holds the scenario
        expect(scenarios[scenario](mutation)).toBe(false); // the mutant does not
        // ... and it runs: a mutant that dies of a syntax or reference error proves nothing.
        expect(lastOut).not.toMatch(/SyntaxError|ReferenceError|TypeError|ERR_/);
    });
});
