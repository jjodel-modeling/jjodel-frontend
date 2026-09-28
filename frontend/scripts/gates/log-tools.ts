// Pure text transforms for the prompt log: split into entries, fold inbox
// entries in, rotate old entries into the archive, lint one entry. No imports,
// no I/O — the CLI (rotate-log.ts) and the gate (check-docs.ts) both build on
// this, so the fold and the gate cannot disagree on what a valid entry is.

export const ENTRY_HEADING = /^## (\d{4}-\d{2}-\d{2})(?: \d{2}:\d{2})? — /;
export const LOG_MAX_ENTRIES = 40;

/** Entries dated before this are ignored without warning: no back-filling. */
export const LINT_FROM_DATE = '2026-08-02';

/** Notes cap applies from here forward: the log is append-only, no back-filling. */
export const NOTES_LINT_FROM_DATE = '2026-08-19';

/**
 * The ticket entry type is judged by its own rules from here forward. Before it,
 * a heading `ticket:` is a task entry: the two legacy ones in the active log
 * carry sentinel Corregge/Causa and no Priority, and the log is not back-filled.
 */
export const TICKET_LINT_FROM_DATE = '2026-09-24';

/** CLAUDE.md §21.2: Notes is capped, longer reasoning goes in the cited document. */
export const NOTES_MAX_CHARS = 500;

/** The sentinel is an em dash U+2014, not '-' and not an en dash. */
export const SENTINEL = '—';

/**
 * CLAUDE.md §21.3 taxonomy. The canonical form is parenthesized, and it is the
 * only one accepted: measured on the archive, 118 entries carry `(x)` against 8
 * with the bare letter, so the bare form is a slip the gate used to wave through
 * rather than a second convention. The archive is never linted (see checkLog),
 * so narrowing this touches no past entry.
 */
export const CAUSA_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
export const CAUSA_FORM = /^\(([a-g])\)$/;

/**
 * Corregge holds the name of a prompt document, whose format is fixed by the
 * template's own last field: YYYY-MM-DD HH:mm. The timestamp must be the
 * prefix; a trailing annotation is allowed, as in
 *   2026-08-01 13:31 (prompt `jjodie_window_default_bottom_left`)
 */
export const TIMESTAMP_PREFIX = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})(\s|$)/;

/** A field line: `**Name**: value`. `**Ticket** (` (no colon) is prose, not a field. */
export const FIELD_LINE = /^\*\*([^*]+)\*\*:\s?(.*)$/;

/** The colon form only: the legacy heading `ticket extension:` stays a task entry. */
export const TICKET_HEADING = /^## \d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})? — ticket: /;
export const TICKET_PRIORITIES = ['high', 'medium', 'low'];
/** A prompt ID or a chat ID, optionally followed by an annotation, as Corregge. */
export const TICKET_FOUND_IN = /^[PC]-\d{4}-\d{2}-\d{2}-\d{4}(\s|$)/;

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

export interface FoldedToArchive {
    lane: string;
    heading: string;
}

/**
 * The entries a fold placed that rotation then sent straight to the archive. An
 * inbox entry dated older than the fortieth of the active log is inserted by date
 * at the bottom and moved by position in the same run: Check B, which reads the
 * active log only, never sees it. Matched by verbatim text, as `fold` matches
 * duplicates.
 */
export function foldedIntoArchive(inboxes: InboxInput[], movedEntries: RawEntry[]): FoldedToArchive[] {
    const byText = new Map<string, string>();
    for (const inbox of [...inboxes].sort((a, b) => a.lane.localeCompare(b.lane))) {
        for (const e of splitLog(inbox.text).entries) if (!byText.has(e.text)) byText.set(e.text, inbox.lane);
    }
    const out: FoldedToArchive[] = [];
    for (const e of movedEntries) {
        const lane = byText.get(e.text);
        if (lane !== undefined) out.push({ lane, heading: e.heading });
    }
    return out;
}

// ── Entry lint ──────────────────────────────────────────────────────────────

export type EntryType = 'task' | 'ticket';

export function entryType(entry: { heading: string; date: string }): EntryType {
    return TICKET_HEADING.test(entry.heading) && entry.date >= TICKET_LINT_FROM_DATE ? 'ticket' : 'task';
}

/** Field lines of one entry. First occurrence wins: a field name repeated inside prose must not overwrite the real one. */
export function parseFields(entryText: string): Map<string, string> {
    const fields = new Map<string, string>();
    for (const line of entryText.split('\n')) {
        const f = FIELD_LINE.exec(line);
        if (f && !fields.has(f[1])) fields.set(f[1], f[2].trim());
    }
    return fields;
}

/**
 * The resolution key of every prompt-document name: the timestamp prefix, which
 * is the only part §21.2 fixes as a format. BOTH sides of a Corregge carry an
 * optional trailing annotation — sometimes the reference, sometimes the target —
 * so comparing whole names misses the match in either direction. A name without
 * a well-formed prefix is kept verbatim rather than dropped from the set.
 */
export function promptNameKeys(entries: RawEntry[]): string[] {
    const keys: string[] = [];
    for (const e of entries) {
        const n = parseFields(e.text).get('Prompt document name');
        if (!n) continue;
        const m = TIMESTAMP_PREFIX.exec(n.trim());
        keys.push(m ? m[1] : n.trim());
    }
    return keys;
}

/** 1-based line of every entry heading in the file the split came from. */
export function entryStartLines(log: SplitLog): number[] {
    const newlines = (s: string): number => s.split('\n').length - 1;
    let line = 1 + newlines(log.header);
    return log.entries.map((e) => {
        const at = line;
        line += newlines(e.text);
        return at;
    });
}

export interface NotesSpan {
    heading: string;
    date: string;
    entryLine: number;
    notesLine: number;
    text: string;
}

/**
 * Notes spans, read straight off the lines rather than off the field map: the
 * field map keeps only the first line of a field, so a note written across
 * several lines would be measured at a fraction of its real length. The span
 * runs from the `**Notes**:` line to the last line before the next field line,
 * the next entry heading, or the end of the text.
 */
export function collectNotesSpans(text: string): NotesSpan[] {
    const lines = text.split('\n');
    const spans: NotesSpan[] = [];
    let heading = '';
    let date = '';
    let entryLine = 0;
    let seenInEntry = false;

    for (let i = 0; i < lines.length; i++) {
        const h = ENTRY_HEADING.exec(lines[i]);
        if (h) {
            heading = lines[i];
            date = h[1];
            entryLine = i + 1;
            seenInEntry = false;
            continue;
        }
        if (!heading || seenInEntry) continue;

        const f = FIELD_LINE.exec(lines[i]);
        if (!f || f[1] !== 'Notes') continue;

        // First Notes of the entry wins, mirroring parseFields.
        seenInEntry = true;
        const body: string[] = [f[2]];
        for (let j = i + 1; j < lines.length; j++) {
            if (ENTRY_HEADING.test(lines[j]) || FIELD_LINE.test(lines[j])) break;
            body.push(lines[j]);
        }
        while (body.length > 0 && body[body.length - 1].trim() === '') body.pop();

        spans.push({ heading, date, entryLine, notesLine: i + 1, text: body.join('\n').trim() });
    }
    return spans;
}

export interface EntryFinding {
    /** B: the required fields of the entry type. C: the Notes cap. */
    check: 'B' | 'C';
    field: string;
    found: string;
    allowed: string;
    message: string;
    /** 0 is the heading line, n is n lines below it. */
    lineOffset: number;
}

export interface EntryLint {
    findings: EntryFinding[];
    /** Corregge values that are well-formed but match no known prompt-document name. */
    unresolved: string[];
}

const CORREGGE_ALLOWED = `${SENTINEL}  |  a prompt-document name in the form YYYY-MM-DD HH:mm, optionally followed by an annotation`;
const CAUSA_ALLOWED = `${SENTINEL}  |  one of ${CAUSA_LETTERS.map((l) => `(${l})`).join(' ')}`;

function lintTaskFields(fields: Map<string, string>, known: ReadonlySet<string>, out: EntryLint): void {
    const b = (field: string, found: string, allowed: string, message: string): void => {
        out.findings.push({ check: 'B', field, found, allowed, message, lineOffset: 0 });
    };

    if (!fields.has('Corregge')) {
        b('**Corregge**', '(field absent)', CORREGGE_ALLOWED, 'required field missing');
    } else {
        const v = fields.get('Corregge')!;
        if (v !== SENTINEL) {
            const m = TIMESTAMP_PREFIX.exec(v);
            if (!m) {
                b('**Corregge**', v === '' ? '(empty)' : v, CORREGGE_ALLOWED, 'value is neither the sentinel nor a prompt-document name in the prescribed form');
            } else if (!known.has(m[1])) {
                // Well-formed but unresolved: the target entry may legitimately
                // never have been logged. Warning, not an error.
                out.unresolved.push(m[1]);
            }
        }
    }

    if (!fields.has('Causa')) {
        b('**Causa**', '(field absent)', CAUSA_ALLOWED, 'required field missing');
    } else {
        const v = fields.get('Causa')!;
        if (v !== SENTINEL && !CAUSA_FORM.test(v)) {
            b('**Causa**', v === '' ? '(empty)' : v, `${CAUSA_ALLOWED}  (parentheses required)`, 'value outside the CLAUDE.md §21.3 taxonomy');
        }
    }
}

/**
 * A ticket is not a task: it carries a finding, a priority and where it was
 * found, and none of the fields that measure a task (Corregge, Causa,
 * Regressions, ...). No status field: the log is add-only, so closure is read
 * from the entry of the lane that closes it.
 */
function lintTicketFields(fields: Map<string, string>, out: EntryLint): void {
    const b = (field: string, found: string, allowed: string, message: string): void => {
        out.findings.push({ check: 'B', field, found, allowed, message, lineOffset: 0 });
    };

    const ticket = fields.get('Ticket');
    if (ticket === undefined) b('**Ticket**', '(field absent)', 'the finding, one line or more', 'required field missing');
    else if (ticket === '') b('**Ticket**', '(empty)', 'the finding, one line or more', 'ticket text is empty');

    const priority = fields.get('Priority');
    const priorityAllowed = TICKET_PRIORITIES.join(' | ');
    if (priority === undefined) b('**Priority**', '(field absent)', priorityAllowed, 'required field missing');
    else if (!TICKET_PRIORITIES.includes(priority)) {
        b('**Priority**', priority === '' ? '(empty)' : priority, priorityAllowed, 'value outside the ticket priorities');
    }

    const foundIn = fields.get('Found in');
    const foundInAllowed = 'P-YYYY-MM-DD-HHmm (a prompt ID) or C-YYYY-MM-DD-HHmm (a chat ID), optionally followed by an annotation';
    if (foundIn === undefined) b('**Found in**', '(field absent)', foundInAllowed, 'required field missing');
    else if (!TICKET_FOUND_IN.test(foundIn)) {
        b('**Found in**', foundIn === '' ? '(empty)' : foundIn, foundInAllowed, 'value is not a prompt ID or a chat ID');
    }

    // Detail is optional; when present it names a document.
    if (fields.get('Detail') === '') b('**Detail**', '(empty)', 'a path, or omit the field', 'optional field present but empty');
}

/**
 * The rules of Check B (required fields of the entry type) and Check C (Notes
 * cap) on one entry. `known` resolves Corregge; an unresolved value comes back
 * in `unresolved`, never as a finding. Scope by date is decided here, so every
 * caller gets the same scope: the gate on the active log and on the lane
 * inboxes, and the fold before it moves anything.
 */
export function lintEntry(entry: RawEntry, known: ReadonlySet<string>): EntryLint {
    const out: EntryLint = { findings: [], unresolved: [] };

    if (entry.date >= LINT_FROM_DATE) {
        const fields = parseFields(entry.text);
        if (entryType(entry) === 'ticket') lintTicketFields(fields, out);
        else lintTaskFields(fields, known, out);
    }

    if (entry.date >= NOTES_LINT_FROM_DATE) {
        for (const s of collectNotesSpans(entry.text)) {
            if (s.text.length <= NOTES_MAX_CHARS) continue;
            out.findings.push({
                check: 'C',
                field: '**Notes**',
                found: `${s.text.length} characters`,
                allowed: `at most ${NOTES_MAX_CHARS} characters — longer reasoning goes in the discovery report, the ratification memo or the session file, cited here by name`,
                message: 'Notes exceeds the cap set by CLAUDE.md §21.2',
                lineOffset: s.notesLine - 1,
            });
        }
    }

    return out;
}
