import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import {
    splitLog,
    rotate,
    fold,
    ENTRY_HEADING,
    entryStartLines,
    entryType,
    foldedIntoArchive,
    lintEntry,
    parseFields,
    promptNameKeys,
} from '../log-tools.ts';
import type { RawEntry } from '../log-tools.ts';

const PREAMBLE = '# Test Log\n\nPreamble text, never an entry.\n\n';

function entryText(date: string, title: string, body = 'Body text.\n\n', time?: string): string {
    const heading = time ? `## ${date} ${time} — ${title}` : `## ${date} — ${title}`;
    return `${heading}\n${body}`;
}

// Descending by date; 2026-09-04 has two existing entries — a group to fold into.
const ACTIVE =
    PREAMBLE +
    entryText('2026-09-05', 'E: fifth') +
    entryText('2026-09-04', 'D: fourth-b (top of the 09-04 group)') +
    entryText('2026-09-04', 'D: fourth-a (bottom of the 09-04 group)') +
    entryText('2026-09-03', 'C: third', 'Body.\n', '10:00') +
    entryText('2026-09-01', 'A: first');

const ARCHIVE_PREAMBLE = '# Test Archive\n\nOldest last-ish. Never entries.\n\n';
const ARCHIVE = ARCHIVE_PREAMBLE + entryText('2026-08-30', 'Z: archived one');

describe('splitLog', () => {
    test('reconstructs the source text byte for byte, preamble + entries', () => {
        const { header, entries } = splitLog(ACTIVE);
        expect(header + entries.map((e) => e.text).join('')).toBe(ACTIVE);
        expect(entries).toHaveLength(5);
    });

    test('reconstructs a file with no trailing newline', () => {
        const noTrailingNewline = ACTIVE.replace(/\n$/, '');
        const { header, entries } = splitLog(noTrailingNewline);
        expect(header + entries.map((e) => e.text).join('')).toBe(noTrailingNewline);
    });

    test('a file with no entries is entirely header', () => {
        const { header, entries } = splitLog(PREAMBLE);
        expect(header).toBe(PREAMBLE);
        expect(entries).toHaveLength(0);
    });

    test('tolerates the historical HH:mm heading variant, comparing dates without the time', () => {
        const { entries } = splitLog(ACTIVE);
        const third = entries.find((e) => e.heading.includes('C: third'));
        expect(third?.heading).toBe('## 2026-09-03 10:00 — C: third');
        expect(third?.date).toBe('2026-09-03');
    });

    test('ENTRY_HEADING matches both the plain and HH:mm heading forms', () => {
        expect(ENTRY_HEADING.test('## 2026-09-03 — X')).toBe(true);
        expect(ENTRY_HEADING.test('## 2026-09-03 10:00 — X')).toBe(true);
        expect(ENTRY_HEADING.test('not a heading')).toBe(false);
    });
});

describe('rotate', () => {
    test('keep < count: both verbatim invariants hold', () => {
        const keep = 2;
        const result = rotate(ACTIVE, ARCHIVE, keep);
        const { entries: activeEntries } = splitLog(ACTIVE);
        const { header: archiveHeader, entries: archiveEntries } = splitLog(ARCHIVE);

        expect(ACTIVE).toBe(result.active + result.moved);
        expect(result.archive).toBe(archiveHeader + result.moved + archiveEntries.map((e) => e.text).join(''));
        expect(result.movedEntries).toHaveLength(activeEntries.length - keep);
        expect(splitLog(result.active).entries).toHaveLength(keep);
    });

    test('keep === count: nothing moves', () => {
        const { entries } = splitLog(ACTIVE);
        const result = rotate(ACTIVE, ARCHIVE, entries.length);
        expect(result.moved).toBe('');
        expect(result.movedEntries).toHaveLength(0);
        expect(result.active).toBe(ACTIVE);
        expect(result.archive).toBe(ARCHIVE);
    });

    test('keep > count: nothing moves', () => {
        const { entries } = splitLog(ACTIVE);
        const result = rotate(ACTIVE, ARCHIVE, entries.length + 10);
        expect(result.moved).toBe('');
        expect(result.active).toBe(ACTIVE);
        expect(result.archive).toBe(ARCHIVE);
    });

    test('a moved entry dated later than a kept entry produces one warning', () => {
        // keep=1 keeps only the 09-05 entry. Of the two moved entries, only the
        // 09-09 one is dated later than the kept 09-05 entry — an ordering
        // anomaly already present in the source file (see the discovery report).
        const activeWithAnomaly =
            PREAMBLE +
            entryText('2026-09-05', 'kept: newest') +
            entryText('2026-09-01', 'moved: older, no anomaly') +
            entryText('2026-09-09', 'moved: anomaly, dated after the kept entry');
        const result = rotate(activeWithAnomaly, ARCHIVE, 1);
        expect(result.movedEntries).toHaveLength(2);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('2026-09-09');
        expect(result.warnings[0]).toContain('moved: anomaly');
    });

    test('no warnings when every moved entry is dated on or before every kept entry', () => {
        const result = rotate(ACTIVE, ARCHIVE, 2);
        expect(result.warnings).toHaveLength(0);
    });
});

describe('fold', () => {
    test('inserts at the top of an existing date group', () => {
        const inbox = {
            lane: 'symbol-editor',
            text: PREAMBLE + entryText('2026-09-04', 'new: folded into the 09-04 group'),
        };
        const result = fold(ACTIVE, [inbox]);
        const { entries } = splitLog(result.active);
        const idxNew = entries.findIndex((e) => e.heading.includes('new: folded'));
        const idxTopExisting = entries.findIndex((e) => e.heading.includes('fourth-b (top'));
        expect(idxNew).toBeGreaterThanOrEqual(0);
        expect(idxNew).toBeLessThan(idxTopExisting);
        expect(result.folded).toBe(1);
        expect(result.duplicates).toHaveLength(0);
    });

    test('inserts before the first entry with an earlier date, when the date has no group', () => {
        // 2026-09-02 does not exist in ACTIVE; the first entry with an earlier
        // date is "A: first" (2026-09-01).
        const inbox = { lane: 'views', text: PREAMBLE + entryText('2026-09-02', 'new: no existing group') };
        const result = fold(ACTIVE, [inbox]);
        const { entries } = splitLog(result.active);
        const idxNew = entries.findIndex((e) => e.heading.includes('new: no existing group'));
        const idxFirst = entries.findIndex((e) => e.heading.includes('A: first'));
        expect(idxNew).toBe(idxFirst - 1);
    });

    test('inserts at the end when no entry has an earlier date', () => {
        const inbox = { lane: 'views', text: PREAMBLE + entryText('2026-08-01', 'new: older than everything') };
        const result = fold(ACTIVE, [inbox]);
        const { entries } = splitLog(result.active);
        expect(entries[entries.length - 1].heading).toContain('new: older than everything');
    });

    test('a verbatim duplicate is reported, not folded, and the active text is otherwise unchanged', () => {
        const { entries } = splitLog(ACTIVE);
        const dup = entries[1]; // the 09-04 "top" entry, verbatim
        const inbox = { lane: 'views', text: PREAMBLE + dup.text };
        const result = fold(ACTIVE, [inbox]);
        expect(result.duplicates).toEqual([dup.heading]);
        expect(result.folded).toBe(0);
        expect(result.active).toBe(ACTIVE);
    });

    test('lanes fold in alphabetical order; within a shared date group each insert lands above the previous one', () => {
        const inboxA = { lane: 'aaa', text: PREAMBLE + entryText('2026-09-04', 'from aaa') };
        const inboxZ = { lane: 'zzz', text: PREAMBLE + entryText('2026-09-04', 'from zzz') };
        // Passed as [z, a] on purpose — fold() must sort lanes itself, so aaa's
        // entry is inserted first and zzz's insert then lands above it.
        const result = fold(ACTIVE, [inboxZ, inboxA]);
        const { entries } = splitLog(result.active);
        const idxZ = entries.findIndex((e) => e.heading.includes('from zzz'));
        const idxA = entries.findIndex((e) => e.heading.includes('from aaa'));
        expect(idxZ).toBeGreaterThanOrEqual(0);
        expect(idxA).toBeGreaterThanOrEqual(0);
        expect(idxZ).toBeLessThan(idxA);
        expect(result.folded).toBe(2);
    });

    test('empties the inbox to its header only', () => {
        const inboxText = PREAMBLE + entryText('2026-09-04', 'new: emptied');
        const result = fold(ACTIVE, [{ lane: 'views', text: inboxText }]);
        expect(result.emptied).toEqual([{ lane: 'views', text: PREAMBLE }]);
    });
});

// ── Ticket type, entry lint, fold into the archive ──────────────────────

const KNOWN = new Set(['2026-09-20 10:00']);

function entryOf(text: string): RawEntry {
    return splitLog(text).entries[0];
}

const TASK_OK =
    '## 2026-09-25 — fix: a task\n**Prompt**: p\n**Corregge**: —\n**Causa**: —\n**Notes**: short\n**Prompt document name**: 2026-09-25 10:00\n';
const TICKET_OK =
    '## 2026-09-25 — ticket: a finding\n**Ticket**: the text\n**Priority**: high\n**Found in**: P-2026-09-24-1005\n**Detail**: docs/discovery/x.md\n';

/** `check|field|found` of every finding: what the gate would print, in one string each. */
function findingsOf(text: string, known: ReadonlySet<string> = KNOWN): string[] {
    return lintEntry(entryOf(text), known).findings.map((f) => `${f.check}|${f.field}|${f.found}`);
}

describe('entryType', () => {
    test('a `ticket:` heading from 2026-09-24 on is a ticket, with or without the time', () => {
        expect(entryType({ heading: '## 2026-09-25 — ticket: x', date: '2026-09-25' })).toBe('ticket');
        expect(entryType({ heading: '## 2026-09-25 10:00 — ticket: x', date: '2026-09-25' })).toBe('ticket');
        expect(entryType({ heading: '## 2026-09-24 — ticket: x', date: '2026-09-24' })).toBe('ticket');
    });

    test('the same heading before the from-date is a task: the log is not back-filled', () => {
        expect(entryType({ heading: '## 2026-09-20 — ticket: legacy', date: '2026-09-20' })).toBe('task');
    });

    test('the legacy `ticket extension:` heading and every other type are tasks', () => {
        expect(entryType({ heading: '## 2026-09-25 — ticket extension: x', date: '2026-09-25' })).toBe('task');
        expect(entryType({ heading: '## 2026-09-25 — fix: x', date: '2026-09-25' })).toBe('task');
    });
});

describe('lintEntry — a task entry (the rules moved out of check-docs unchanged)', () => {
    test('a well-formed task has no findings and no unresolved Corregge', () => {
        expect(lintEntry(entryOf(TASK_OK), KNOWN)).toEqual({ findings: [], unresolved: [] });
    });

    test('Corregge absent, and Causa with an annotation, both fail (control 1 of the discovery)', () => {
        const text = TASK_OK.replace('**Corregge**: —\n', '').replace('**Causa**: —', '**Causa**: (c) with an annotation');
        expect(findingsOf(text)).toEqual(['B|**Corregge**|(field absent)', 'B|**Causa**|(c) with an annotation']);
    });

    test('Causa: a bare letter and an empty value fail, the parenthesized letter and the sentinel pass', () => {
        expect(findingsOf(TASK_OK.replace('**Causa**: —', '**Causa**: c'))).toEqual(['B|**Causa**|c']);
        expect(findingsOf(TASK_OK.replace('**Causa**: —', '**Causa**:'))).toEqual(['B|**Causa**|(empty)']);
        expect(findingsOf(TASK_OK.replace('**Causa**: —', '**Causa**: (c)'))).toEqual([]);
        expect(findingsOf(TASK_OK.replace('**Causa**: —', '**Causa**: (h)'))).toEqual(['B|**Causa**|(h)']);
    });

    test('Corregge: a value that is not a timestamp fails; a timestamp with an annotation passes', () => {
        expect(findingsOf(TASK_OK.replace('**Corregge**: —', '**Corregge**: the earlier prompt'))).toEqual([
            'B|**Corregge**|the earlier prompt',
        ]);
        expect(findingsOf(TASK_OK.replace('**Corregge**: —', '**Corregge**: 2026-09-20 10:00 (the 1005 prompt)'))).toEqual([]);
    });

    test('Corregge well-formed but unknown is an unresolved warning, never a finding', () => {
        const lint = lintEntry(entryOf(TASK_OK.replace('**Corregge**: —', '**Corregge**: 2026-09-19 08:00')), KNOWN);
        expect(lint.findings).toEqual([]);
        expect(lint.unresolved).toEqual(['2026-09-19 08:00']);
    });

    test('an entry dated before 2026-08-02 is not linted, whatever it lacks', () => {
        expect(findingsOf('## 2026-08-01 — fix: old\n**Prompt**: p\n')).toEqual([]);
        expect(findingsOf('## 2026-08-02 — fix: on the threshold\n**Prompt**: p\n')).toEqual([
            'B|**Corregge**|(field absent)',
            'B|**Causa**|(field absent)',
        ]);
    });

    test('a `**Ticket** (` paragraph inside a task entry is prose: no ticket field, no ticket rules', () => {
        const text = TASK_OK + '**Ticket** (opened, not implemented here). A finding written as a paragraph.\n';
        expect(findingsOf(text)).toEqual([]);
        expect([...parseFields(text).keys()]).not.toContain('Ticket');
    });
});

describe('lintEntry — a ticket entry', () => {
    test('a well-formed ticket passes and needs no Corregge or Causa (control 2 of the discovery)', () => {
        expect(lintEntry(entryOf(TICKET_OK), KNOWN)).toEqual({ findings: [], unresolved: [] });
        expect(findingsOf(TICKET_OK.replace('**Detail**: docs/discovery/x.md\n', ''))).toEqual([]);
        expect(findingsOf(TICKET_OK.replace('P-2026-09-24-1005', 'C-2026-09-24-1005 (chat)'))).toEqual([]);
    });

    test('Ticket, Priority and Found in are required; the value of each is checked', () => {
        expect(findingsOf(TICKET_OK.replace('**Ticket**: the text\n', ''))).toEqual(['B|**Ticket**|(field absent)']);
        expect(findingsOf(TICKET_OK.replace('**Ticket**: the text', '**Ticket**:'))).toEqual(['B|**Ticket**|(empty)']);
        expect(findingsOf(TICKET_OK.replace('**Priority**: high\n', ''))).toEqual(['B|**Priority**|(field absent)']);
        expect(findingsOf(TICKET_OK.replace('high', 'urgent'))).toEqual(['B|**Priority**|urgent']);
        expect(findingsOf(TICKET_OK.replace('**Found in**: P-2026-09-24-1005\n', ''))).toEqual(['B|**Found in**|(field absent)']);
        expect(findingsOf(TICKET_OK.replace('P-2026-09-24-1005', 'somewhere'))).toEqual(['B|**Found in**|somewhere']);
        expect(findingsOf(TICKET_OK.replace('**Detail**: docs/discovery/x.md', '**Detail**:'))).toEqual(['B|**Detail**|(empty)']);
    });

    test('the legacy `ticket:` heading before the from-date is judged as a task', () => {
        const legacy = '## 2026-09-20 — ticket: legacy\n**Corregge**: —\n**Causa**: —\n';
        expect(findingsOf(legacy)).toEqual([]);
        expect(findingsOf('## 2026-09-20 — ticket: legacy\n**Ticket**: t\n')).toEqual([
            'B|**Corregge**|(field absent)',
            'B|**Causa**|(field absent)',
        ]);
    });
});

describe('lintEntry — the Notes cap (Check C)', () => {
    const withNotes = (n: number, date = '2026-09-25'): string =>
        `## ${date} — fix: notes\n**Corregge**: —\n**Causa**: —\n**Notes**: ${'x'.repeat(n)}\n`;

    test('500 characters pass, 501 fail, and the finding points at the Notes line', () => {
        expect(findingsOf(withNotes(500))).toEqual([]);
        expect(findingsOf(withNotes(501))).toEqual(['C|**Notes**|501 characters']);
        expect(lintEntry(entryOf(withNotes(501)), KNOWN).findings[0].lineOffset).toBe(3);
    });

    test('a note across several lines is measured whole, not by its first line', () => {
        const text = `## 2026-09-25 — fix: notes\n**Corregge**: —\n**Causa**: —\n**Notes**: ${'x'.repeat(300)}\n${'y'.repeat(201)}\n`;
        expect(findingsOf(text)).toEqual(['C|**Notes**|502 characters']);
    });

    test('an entry dated before 2026-08-19 is exempt from the cap', () => {
        expect(findingsOf(withNotes(900, '2026-08-18'))).toEqual([]);
    });

    test('a ticket entry is capped like any other entry that carries a Notes field', () => {
        expect(findingsOf(TICKET_OK + `**Notes**: ${'x'.repeat(501)}\n`)).toEqual(['C|**Notes**|501 characters']);
    });
});

describe('parseFields, promptNameKeys, entryStartLines', () => {
    test('parseFields: the first occurrence of a field wins', () => {
        const f = parseFields('## 2026-09-25 — fix: x\n**Corregge**: —\nprose\n**Corregge**: 2026-09-20 10:00\n');
        expect(f.get('Corregge')).toBe('—');
    });

    test('promptNameKeys keys on the timestamp prefix and keeps a malformed name verbatim', () => {
        const entries = splitLog(
            '## 2026-09-25 — a\n**Prompt document name**: 2026-09-20 10:00 (annotated)\n' +
                '## 2026-09-25 — b\n**Prompt document name**: not a timestamp\n' +
                '## 2026-09-25 — c\n**Prompt**: no name\n',
        ).entries;
        expect(promptNameKeys(entries)).toEqual(['2026-09-20 10:00', 'not a timestamp']);
    });

    test('entryStartLines gives the 1-based line of each heading, preamble included', () => {
        const log = splitLog(ACTIVE);
        // PREAMBLE is 4 lines; every entryText() here is a heading plus 2 lines (a body line and a blank), the HH:mm one plus 1.
        expect(entryStartLines(log)).toEqual([5, 8, 11, 14, 16]);
        const lines = ACTIVE.split('\n');
        for (const [i, start] of entryStartLines(log).entries()) expect(lines[start - 1]).toBe(log.entries[i].heading);
    });
});

describe('fold then rotate: an inbox entry older than the fortieth', () => {
    const invalid = entryText('2026-08-20', 'fix: an inbox entry older than the rest, Corregge absent', 'Body.\n\n');

    test('it is placed last, moved to the archive in the same run, and listed as such', () => {
        const inbox = { lane: 'probe', text: PREAMBLE + invalid };
        const folded = fold(ACTIVE, [inbox]);
        expect(splitLog(folded.active).entries.at(-1)?.date).toBe('2026-08-20');

        const rotated = rotate(folded.active, ARCHIVE, 5);
        expect(splitLog(rotated.active).entries.map((e) => e.date)).not.toContain('2026-08-20');
        expect(splitLog(rotated.archive).entries[0].heading).toContain('an inbox entry older than the rest');

        expect(foldedIntoArchive([inbox], rotated.movedEntries)).toEqual([
            { lane: 'probe', heading: '## 2026-08-20 — fix: an inbox entry older than the rest, Corregge absent' },
        ]);
    });

    test('the lint that runs before the fold sees the entry the gate would never see', () => {
        expect(findingsOf(invalid)).toEqual([
            'B|**Corregge**|(field absent)',
            'B|**Causa**|(field absent)',
        ]);
    });

    test('an entry that was in the active log all along is not reported as folded', () => {
        const inbox = { lane: 'probe', text: PREAMBLE + invalid };
        const rotated = rotate(fold(ACTIVE, [inbox]).active, ARCHIVE, 3);
        const straight = foldedIntoArchive([inbox], rotated.movedEntries);
        expect(rotated.movedEntries.length).toBeGreaterThan(1);
        expect(straight.map((e) => e.lane)).toEqual(['probe']);
    });
});

// ── Mutation bench ──────────────────────────────────────────────────────
//
// Each mutant below is a deliberately-broken local copy of a single function
// from log-tools.ts, one line changed. Each test proves that the change
// makes at least one assertion above go red, by running the same check
// against the mutant's output instead of the real function's. Per CLAUDE.md
// §5, this is what makes the tests above worth having, not just plausible.

describe('mutation bench', () => {
    test('mutant: rotate leaves the moved entries in the active text too — kills the active verbatim invariant', () => {
        function rotateMutant_activeKeepsMoved(active: string, archive: string, keep: number) {
            const { header: activeHeader, entries: activeEntries } = splitLog(active);
            const kept = activeEntries.slice(0, Math.max(0, keep));
            const movedEntries = activeEntries.slice(Math.max(0, keep));
            const moved = movedEntries.map((e) => e.text).join('');
            // MUTATION: forgets to drop the moved entries from the new active text.
            const newActive = activeHeader + kept.map((e) => e.text).join('') + moved;
            return { active: newActive, moved };
        }

        const mutant = rotateMutant_activeKeepsMoved(ACTIVE, ARCHIVE, 2);
        // The real test asserts `ACTIVE === result.active + result.moved`.
        expect(mutant.active + mutant.moved).not.toBe(ACTIVE);
    });

    test('mutant: rotate keeps one entry too many — kills the kept-count assertion', () => {
        function rotateMutant_offByOneKeep(active: string, keep: number) {
            const { entries: activeEntries } = splitLog(active);
            // MUTATION: off-by-one, keeps one entry more than requested.
            const kept = activeEntries.slice(0, Math.max(0, keep) + 1);
            return { keptCount: kept.length };
        }

        const keep = 2;
        const mutant = rotateMutant_offByOneKeep(ACTIVE, keep);
        // The real test asserts `splitLog(result.active).entries` has length `keep`.
        expect(mutant.keptCount).not.toBe(keep);
    });

    test('mutant: fold inserts at the bottom of the date group instead of the top — kills the top-of-group test', () => {
        function insertByDateMutant_bottomOfGroup(entries: RawEntry[], entry: RawEntry): RawEntry[] {
            let lastSameDateIdx = -1;
            for (let i = 0; i < entries.length; i++) {
                if (entries[i].date === entry.date) lastSameDateIdx = i;
            }
            if (lastSameDateIdx !== -1) {
                // MUTATION: inserts after the LAST same-date entry, not before the first.
                return [...entries.slice(0, lastSameDateIdx + 1), entry, ...entries.slice(lastSameDateIdx + 1)];
            }
            const earlierIdx = entries.findIndex((e) => e.date < entry.date);
            if (earlierIdx !== -1) {
                return [...entries.slice(0, earlierIdx), entry, ...entries.slice(earlierIdx)];
            }
            return [...entries, entry];
        }

        function foldMutant_bottomOfGroup(active: string, inboxes: { lane: string; text: string }[]): string {
            const { header: activeHeader, entries: activeEntriesInit } = splitLog(active);
            let entries = activeEntriesInit;
            const sorted = [...inboxes].sort((a, b) => a.lane.localeCompare(b.lane));
            for (const inbox of sorted) {
                const { entries: inboxEntries } = splitLog(inbox.text);
                for (const entry of inboxEntries) {
                    entries = insertByDateMutant_bottomOfGroup(entries, entry);
                }
            }
            return activeHeader + entries.map((e) => e.text).join('');
        }

        const mutantActive = foldMutant_bottomOfGroup(ACTIVE, [
            { lane: 'symbol-editor', text: PREAMBLE + entryText('2026-09-04', 'new: folded into the 09-04 group') },
        ]);
        const { entries } = splitLog(mutantActive);
        const idxNew = entries.findIndex((e) => e.heading.includes('new: folded'));
        const idxTopExisting = entries.findIndex((e) => e.heading.includes('fourth-b (top'));
        // The real test asserts `idxNew < idxTopExisting`.
        expect(idxNew).toBeGreaterThan(idxTopExisting);
    });
});

// ── Mutation bench, the ticket type and the lint ────────────────────────
//
// Each mutant is the real source of log-tools.ts with ONE line changed, transpiled
// and run against a probe. The real module must answer the probe with `expected`;
// the mutant must not. A fixture that both answer alike proves nothing (CLAUDE.md §5).

const LOG_TOOLS_SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'log-tools.ts');
type LogTools = typeof import('../log-tools.ts');

function loadLogTools(mutation?: { from: string; to: string }): LogTools {
    let source = readFileSync(LOG_TOOLS_SRC, 'utf8');
    if (mutation) {
        // Exactly one occurrence: a refactor that moves the line must break the bench loudly.
        expect(source.split(mutation.from), `mutation anchor not unique: ${mutation.from}`).toHaveLength(2);
        source = source.replace(mutation.from, () => mutation.to);
    }
    const js = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const mod: { exports: Record<string, unknown> } = { exports: {} };
    new Function('module', 'exports', js)(mod, mod.exports);
    return mod.exports as unknown as LogTools;
}

/** `check|field|found` of every finding, computed by the module under test. */
const summary = (m: LogTools, text: string): string[] =>
    m.lintEntry(m.splitLog(text).entries[0], KNOWN).findings.map((f) => `${f.check}|${f.field}|${f.found}`);

const notesOf = (n: number, date = '2026-09-25'): string =>
    `## ${date} — fix: notes\n**Corregge**: —\n**Causa**: —\n**Notes**: ${'x'.repeat(n)}\n`;

interface Mutant {
    name: string;
    from: string;
    to: string;
    probe: (m: LogTools) => unknown;
    expected: unknown;
}

const LINT_MUTANTS: Mutant[] = [
    {
        name: 'entryType always answers task — killed by the ticket recognition and every ticket lint case',
        from: "    return TICKET_HEADING.test(entry.heading) && entry.date >= TICKET_LINT_FROM_DATE ? 'ticket' : 'task';",
        to: "    return 'task';",
        probe: (m) => m.entryType({ heading: '## 2026-09-25 — ticket: x', date: '2026-09-25' }),
        expected: 'ticket',
    },
    {
        name: 'the ticket from-date dropped — killed by the legacy `ticket:` heading test',
        from: "    return TICKET_HEADING.test(entry.heading) && entry.date >= TICKET_LINT_FROM_DATE ? 'ticket' : 'task';",
        to: "    return TICKET_HEADING.test(entry.heading) ? 'ticket' : 'task';",
        probe: (m) => m.entryType({ heading: '## 2026-09-20 — ticket: legacy', date: '2026-09-20' }),
        expected: 'task',
    },
    {
        name: 'the heading ignored, the date alone decides — killed by the task-heading case',
        from: "    return TICKET_HEADING.test(entry.heading) && entry.date >= TICKET_LINT_FROM_DATE ? 'ticket' : 'task';",
        to: "    return entry.date >= TICKET_LINT_FROM_DATE ? 'ticket' : 'task';",
        probe: (m) => m.entryType({ heading: '## 2026-09-25 — fix: x', date: '2026-09-25' }),
        expected: 'task',
    },
    {
        name: 'the colon of the ticket heading dropped — killed by the `ticket extension:` case',
        from: '— ticket: /;',
        to: '— ticket/;',
        probe: (m) => m.entryType({ heading: '## 2026-09-25 — ticket extension: x', date: '2026-09-25' }),
        expected: 'task',
    },
    {
        name: 'Priority not checked — killed by the invalid Priority case',
        from: '    else if (!TICKET_PRIORITIES.includes(priority)) {',
        to: '    else if (false) {',
        probe: (m) => summary(m, TICKET_OK.replace('high', 'urgent')),
        expected: ['B|**Priority**|urgent'],
    },
    {
        name: 'Found in not checked — killed by the invalid Found in case',
        from: '    else if (!TICKET_FOUND_IN.test(foundIn)) {',
        to: '    else if (false) {',
        probe: (m) => summary(m, TICKET_OK.replace('P-2026-09-24-1005', 'somewhere')),
        expected: ['B|**Found in**|somewhere'],
    },
    {
        name: 'an empty Ticket accepted — killed by the empty Ticket case',
        from: "    else if (ticket === '') b(",
        to: '    else if (false) b(',
        probe: (m) => summary(m, TICKET_OK.replace('**Ticket**: the text', '**Ticket**:')),
        expected: ['B|**Ticket**|(empty)'],
    },
    {
        name: 'an empty Detail accepted — killed by the empty Detail case',
        from: "    if (fields.get('Detail') === '') b(",
        to: '    if (false) b(',
        probe: (m) => summary(m, TICKET_OK.replace('**Detail**: docs/discovery/x.md', '**Detail**:')),
        expected: ['B|**Detail**|(empty)'],
    },
    {
        name: 'Corregge not required — killed by the Corregge-absent case',
        from: "        b('**Corregge**', '(field absent)', CORREGGE_ALLOWED, 'required field missing');",
        to: '        void 0;',
        probe: (m) => summary(m, TASK_OK.replace('**Corregge**: —\n', '')),
        expected: ['B|**Corregge**|(field absent)'],
    },
    {
        name: 'a malformed Corregge accepted — killed by the malformed-Corregge case',
        from: "                b('**Corregge**', v === '' ? '(empty)' : v, CORREGGE_ALLOWED, 'value is neither the sentinel nor a prompt-document name in the prescribed form');",
        to: '                void 0;',
        probe: (m) => summary(m, TASK_OK.replace('**Corregge**: —', '**Corregge**: the earlier prompt')),
        expected: ['B|**Corregge**|the earlier prompt'],
    },
    {
        name: 'an unresolved Corregge not reported — killed by the unresolved-warning case',
        from: '            } else if (!known.has(m[1])) {',
        to: '            } else if (false) {',
        probe: (m) => m.lintEntry(m.splitLog(TASK_OK.replace('**Corregge**: —', '**Corregge**: 2026-09-19 08:00')).entries[0], KNOWN).unresolved,
        expected: ['2026-09-19 08:00'],
    },
    {
        name: 'Causa not required — killed by the Causa-absent case',
        from: "        b('**Causa**', '(field absent)', CAUSA_ALLOWED, 'required field missing');",
        to: '        void 0;',
        probe: (m) => summary(m, TASK_OK.replace('**Causa**: —\n', '')),
        expected: ['B|**Causa**|(field absent)'],
    },
    {
        name: 'a bare Causa letter accepted — killed by the bare-letter case',
        from: 'export const CAUSA_FORM = /^\\(([a-g])\\)$/;',
        to: 'export const CAUSA_FORM = /^\\(?([a-g])\\)?$/;',
        probe: (m) => summary(m, TASK_OK.replace('**Causa**: —', '**Causa**: c')),
        expected: ['B|**Causa**|c'],
    },
    {
        name: 'a Causa with an annotation accepted — killed by the annotation case (control 1)',
        from: 'export const CAUSA_FORM = /^\\(([a-g])\\)$/;',
        to: 'export const CAUSA_FORM = /^\\(([a-g])\\)/;',
        probe: (m) => summary(m, TASK_OK.replace('**Causa**: —', '**Causa**: (c) with an annotation')),
        expected: ['B|**Causa**|(c) with an annotation'],
    },
    {
        name: 'Check B scope by date dropped — killed by the pre-2026-08-02 case',
        from: '    if (entry.date >= LINT_FROM_DATE) {',
        to: '    if (true) {',
        probe: (m) => summary(m, '## 2026-08-01 — fix: old\n**Prompt**: p\n'),
        expected: [],
    },
    {
        name: 'the Notes cap exclusive — killed by the 500-character case',
        from: '            if (s.text.length <= NOTES_MAX_CHARS) continue;',
        to: '            if (s.text.length < NOTES_MAX_CHARS) continue;',
        probe: (m) => summary(m, notesOf(500)),
        expected: [],
    },
    {
        name: 'the Notes cap one too generous — killed by the 501-character case',
        from: '            if (s.text.length <= NOTES_MAX_CHARS) continue;',
        to: '            if (s.text.length <= NOTES_MAX_CHARS + 1) continue;',
        probe: (m) => summary(m, notesOf(501)),
        expected: ['C|**Notes**|501 characters'],
    },
    {
        name: 'Check C scope by date dropped — killed by the pre-2026-08-19 case',
        from: '    if (entry.date >= NOTES_LINT_FROM_DATE) {',
        to: '    if (true) {',
        probe: (m) => summary(m, notesOf(900, '2026-08-18')),
        expected: [],
    },
    {
        name: 'a multi-line Notes measured by its first line — killed by the multi-line case',
        from: '            body.push(lines[j]);\n',
        to: '',
        probe: (m) => summary(m, `## 2026-09-25 — fix: notes\n**Corregge**: —\n**Causa**: —\n**Notes**: ${'x'.repeat(300)}\n${'y'.repeat(201)}\n`),
        expected: ['C|**Notes**|502 characters'],
    },
    {
        name: 'the Notes finding not positioned — killed by the line-offset assertion',
        from: '                lineOffset: s.notesLine - 1,',
        to: '                lineOffset: 0,',
        probe: (m) => m.lintEntry(m.splitLog(notesOf(501)).entries[0], KNOWN).findings.map((f) => f.lineOffset),
        expected: [3],
    },
    {
        name: 'parseFields: the last occurrence wins — killed by the first-occurrence case',
        from: '        if (f && !fields.has(f[1])) fields.set(f[1], f[2].trim());',
        to: '        if (f) fields.set(f[1], f[2].trim());',
        probe: (m) => m.parseFields('## 2026-09-25 — fix: x\n**Corregge**: —\nprose\n**Corregge**: 2026-09-20 10:00\n').get('Corregge'),
        expected: '—',
    },
    {
        name: 'a `**Ticket** (` paragraph read as a field — killed by the inert-paragraph case',
        from: 'export const FIELD_LINE = /^\\*\\*([^*]+)\\*\\*:\\s?(.*)$/;',
        to: 'export const FIELD_LINE = /^\\*\\*([^*]+)\\*\\*:?\\s?(.*)$/;',
        probe: (m) => [...m.parseFields(TASK_OK + '**Ticket** (opened, not implemented here). A paragraph.\n').keys()].includes('Ticket'),
        expected: false,
    },
    {
        name: 'promptNameKeys keeps the annotation — killed by the annotated-name case',
        from: '        keys.push(m ? m[1] : n.trim());',
        to: '        keys.push(n.trim());',
        probe: (m) => m.promptNameKeys(m.splitLog('## 2026-09-25 — a\n**Prompt document name**: 2026-09-20 10:00 (annotated)\n').entries),
        expected: ['2026-09-20 10:00'],
    },
    {
        name: 'entryStartLines forgets the preamble — killed by the line-number case',
        from: '    let line = 1 + newlines(log.header);',
        to: '    let line = newlines(log.header);',
        probe: (m) => m.entryStartLines(m.splitLog(ACTIVE)),
        expected: [5, 8, 11, 14, 16],
    },
    {
        name: 'entryStartLines advances one line per entry — killed by the line-number case',
        from: '        line += newlines(e.text);',
        to: '        line += 1;',
        probe: (m) => m.entryStartLines(m.splitLog(ACTIVE)),
        expected: [5, 8, 11, 14, 16],
    },
    {
        name: 'foldedIntoArchive reports every moved entry — killed by the not-folded case',
        from: '        if (lane !== undefined) out.push({ lane, heading: e.heading });',
        to: "        out.push({ lane: lane ?? '', heading: e.heading });",
        probe: (m) => {
            const rotated = m.rotate(ACTIVE, ARCHIVE, 3);
            return m.foldedIntoArchive([{ lane: 'probe', text: PREAMBLE + entryText('2026-08-20', 'not in the active log') }], rotated.movedEntries);
        },
        expected: [],
    },
];

describe('mutation bench — the ticket type and the lint', () => {
    test('the loader is faithful: the unmutated transpile answers every probe like the real module', () => {
        const real = loadLogTools();
        for (const m of LINT_MUTANTS) expect(m.probe(real), m.name).toEqual(m.expected);
    });

    test.each(LINT_MUTANTS)('mutant: $name', (m) => {
        const mutant = loadLogTools({ from: m.from, to: m.to });
        expect(m.probe(mutant)).not.toEqual(m.expected);
    });
});
