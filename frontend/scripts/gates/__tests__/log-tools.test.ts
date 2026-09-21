import { describe, test, expect } from 'vitest';
import { splitLog, rotate, fold, ENTRY_HEADING } from '../log-tools.ts';
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
