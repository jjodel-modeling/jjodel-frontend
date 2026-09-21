// Pure text transforms for the prompt log: split into entries, fold inbox
// entries in, rotate old entries into the archive. No imports, no I/O — the
// CLI (rotate-log.ts) and the gate (check-docs.ts) both build on this.

export const ENTRY_HEADING = /^## (\d{4}-\d{2}-\d{2})(?: \d{2}:\d{2})? — /;
export const LOG_MAX_ENTRIES = 40;

export interface RawEntry {
    heading: string;
    date: string;
    text: string;
}

export interface SplitLog {
    header: string;
    entries: RawEntry[];
}

export function splitLog(text: string): SplitLog {
    const rawLines = text.split('\n');
    const withTerm = rawLines.map((line, i) => (i < rawLines.length - 1 ? line + '\n' : line));

    const headingIdxs: number[] = [];
    for (let i = 0; i < rawLines.length; i++) {
        if (ENTRY_HEADING.test(rawLines[i])) headingIdxs.push(i);
    }

    const firstIdx = headingIdxs.length > 0 ? headingIdxs[0] : rawLines.length;
    const header = withTerm.slice(0, firstIdx).join('');

    const entries: RawEntry[] = [];
    for (let k = 0; k < headingIdxs.length; k++) {
        const start = headingIdxs[k];
        const end = k + 1 < headingIdxs.length ? headingIdxs[k + 1] : rawLines.length;
        const m = ENTRY_HEADING.exec(rawLines[start]) as RegExpExecArray;
        entries.push({
            heading: rawLines[start],
            date: m[1],
            text: withTerm.slice(start, end).join(''),
        });
    }

    return { header, entries };
}

export interface RotateResult {
    active: string;
    archive: string;
    moved: string;
    movedEntries: RawEntry[];
    warnings: string[];
}

export function rotate(active: string, archive: string, keep: number): RotateResult {
    const { header: activeHeader, entries: activeEntries } = splitLog(active);
    const kept = activeEntries.slice(0, Math.max(0, keep));
    const movedEntries = activeEntries.slice(Math.max(0, keep));
    const moved = movedEntries.map((e) => e.text).join('');

    const { header: archiveHeader, entries: archiveEntries } = splitLog(archive);
    const archiveEntriesText = archiveEntries.map((e) => e.text).join('');

    const newActive = activeHeader + kept.map((e) => e.text).join('');
    const newArchive = archiveHeader + moved + archiveEntriesText;

    const keptDates = kept.map((e) => e.date);
    const warnings: string[] = [];
    for (const e of movedEntries) {
        if (keptDates.some((d) => e.date > d)) {
            warnings.push(
                `${e.heading} is dated ${e.date}, later than a kept entry — ordering anomaly, moved by position (RC-12)`,
            );
        }
    }

    return { active: newActive, archive: newArchive, moved, movedEntries, warnings };
}

export interface InboxInput {
    lane: string;
    text: string;
}

export interface EmptiedInbox {
    lane: string;
    text: string;
}

export interface FoldResult {
    active: string;
    emptied: EmptiedInbox[];
    folded: number;
    duplicates: string[];
}

function insertByDate(entries: RawEntry[], entry: RawEntry): RawEntry[] {
    const sameDateIdx = entries.findIndex((e) => e.date === entry.date);
    if (sameDateIdx !== -1) {
        return [...entries.slice(0, sameDateIdx), entry, ...entries.slice(sameDateIdx)];
    }
    const earlierIdx = entries.findIndex((e) => e.date < entry.date);
    if (earlierIdx !== -1) {
        return [...entries.slice(0, earlierIdx), entry, ...entries.slice(earlierIdx)];
    }
    return [...entries, entry];
}

export function fold(active: string, inboxes: InboxInput[]): FoldResult {
    const { header: activeHeader, entries: activeEntriesInit } = splitLog(active);
    let entries = activeEntriesInit;
    const seen = new Set(entries.map((e) => e.text));

    const emptied: EmptiedInbox[] = [];
    const duplicates: string[] = [];
    let folded = 0;

    const sortedInboxes = [...inboxes].sort((a, b) => a.lane.localeCompare(b.lane));

    for (const inbox of sortedInboxes) {
        const { header: inboxHeader, entries: inboxEntries } = splitLog(inbox.text);
        for (const entry of inboxEntries) {
            if (seen.has(entry.text)) {
                duplicates.push(entry.heading);
                continue;
            }
            entries = insertByDate(entries, entry);
            seen.add(entry.text);
            folded++;
        }
        emptied.push({ lane: inbox.lane, text: inboxHeader });
    }

    const newActive = activeHeader + entries.map((e) => e.text).join('');
    return { active: newActive, emptied, folded, duplicates };
}
