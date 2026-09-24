/**
 * rotate-log.ts — fold lane inboxes into the active prompt log, and rotate
 * old entries from the active log into the archive.
 *
 * --fold           fold docs/log-inbox/*.md into docs/claude-code-log.md. Refuses
 *                  (exit 1, nothing written, dry run included) when an inbox entry
 *                  would fail Check B or C of check:docs: every entry is linted
 *                  first, wherever the fold would place it, so that none reaches
 *                  the log or the archive unlinted.
 * --rotate         move entries past --keep from the active log into the archive
 * --keep=N         entries kept in the active log by --rotate (default 40)
 * --write          apply changes to disk (default: dry run, print only)
 *
 * --fold and --rotate may be combined: fold runs first, in memory, then
 * rotate operates on the folded active content. A folded entry dated older than
 * the fortieth is moved to the archive in the same run: it is listed, because
 * Check B reads the active log only. A ticket is marked in the MOVE line.
 *
 * --write refuses unless `git status --porcelain` is clean for the four log
 * files (RC-13: shared tree, exclusive lane only). After writing it re-reads
 * every file from disk and re-checks the verbatim invariants; on failure it
 * restores the originals it read at the start and exits non-zero. It never
 * runs `git` for anything but that one read-only status check, and it never
 * touches the preambles.
 *
 * Run: npm run log:rotate -- --fold --rotate
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fold, foldedIntoArchive, entryStartLines, entryType, lintEntry, promptNameKeys, rotate, splitLog, LOG_MAX_ENTRIES } from './log-tools.ts';
import type { InboxInput } from './log-tools.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');

const LOG_MD = resolve(REPO, 'docs/claude-code-log.md');
const LOG_ARCHIVE_MD = resolve(REPO, 'docs/claude-code-log-archive.md');
const LOG_INBOX_DIR = resolve(REPO, 'docs/log-inbox');

function rel(path: string): string {
    return path.startsWith(REPO) ? path.slice(REPO.length + 1) : path;
}

function listInboxPaths(): { lane: string; path: string }[] {
    let names: string[] = [];
    try {
        names = readdirSync(LOG_INBOX_DIR).filter((f) => f.endsWith('.md'));
    } catch {
        return [];
    }
    return names.map((f) => ({ lane: f.replace(/\.md$/, ''), path: resolve(LOG_INBOX_DIR, f) }));
}

interface Args {
    fold: boolean;
    rotate: boolean;
    keep: number;
    write: boolean;
}

function parseArgs(argv: string[]): Args {
    const args: Args = { fold: false, rotate: false, keep: LOG_MAX_ENTRIES, write: false };
    for (const a of argv) {
        if (a === '--fold') args.fold = true;
        else if (a === '--rotate') args.rotate = true;
        else if (a === '--write') args.write = true;
        else if (a.startsWith('--keep=')) args.keep = Number(a.slice('--keep='.length));
        else {
            console.error(`unknown argument: ${a}`);
            process.exit(1);
        }
    }
    if (!Number.isFinite(args.keep) || args.keep < 0) {
        console.error(`--keep must be a non-negative number, got: ${args.keep}`);
        process.exit(1);
    }
    return args;
}

function assertCleanForWrite(paths: string[]): void {
    let status: string;
    try {
        status = execFileSync('git', ['status', '--porcelain', ...paths], { cwd: REPO, encoding: 'utf8' });
    } catch (err) {
        console.error(`could not check git status: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
        return;
    }
    if (status.trim().length > 0) {
        console.error('refusing to write: the log files are not clean in `git status --porcelain`:');
        console.error(status);
        console.error('this CLI writes only in an exclusive lane (RC-13) — commit or discard first.');
        process.exit(1);
    }
}

function main(): void {
    const args = parseArgs(process.argv.slice(2));
    if (!args.fold && !args.rotate) {
        console.error('nothing to do: pass --fold and/or --rotate');
        process.exit(1);
    }

    const inboxPaths = listInboxPaths();
    const originals = new Map<string, string>();
    originals.set(LOG_MD, readFileSync(LOG_MD, 'utf8'));
    originals.set(LOG_ARCHIVE_MD, readFileSync(LOG_ARCHIVE_MD, 'utf8'));
    for (const inbox of inboxPaths) originals.set(inbox.path, readFileSync(inbox.path, 'utf8'));

    let active = originals.get(LOG_MD) as string;
    let archive = originals.get(LOG_ARCHIVE_MD) as string;
    const newInboxText = new Map<string, string>();

    console.log('rotate-log — fold and rotate the prompt log');
    console.log(`repo: ${REPO}`);
    console.log(`mode: ${args.write ? 'WRITE' : 'dry run'}`);
    console.log('');

    console.log(`before: ${rel(LOG_MD)} ${splitLog(active).entries.length} entries, ${rel(LOG_ARCHIVE_MD)} ${splitLog(archive).entries.length} entries`);
    for (const inbox of inboxPaths) {
        const n = splitLog(originals.get(inbox.path) as string).entries.length;
        console.log(`before: lane "${inbox.lane}" (${rel(inbox.path)}) ${n} entries`);
    }
    console.log('');

    let duplicates: string[] = [];
    let inboxes: InboxInput[] = [];
    if (args.fold) {
        inboxes = inboxPaths.map((i) => ({ lane: i.lane, text: originals.get(i.path) as string }));

        // Lint every inbox entry before anything is placed, whatever position the
        // fold would give it. The rules are the gate's (log-tools.ts lintEntry).
        const known = new Set(promptNameKeys([
            ...splitLog(active).entries,
            ...splitLog(archive).entries,
            ...inboxes.flatMap((i) => splitLog(i.text).entries),
        ]));
        let failures = 0;
        for (const i of inboxPaths) {
            const log = splitLog(originals.get(i.path) as string);
            const starts = entryStartLines(log);
            log.entries.forEach((entry, k) => {
                const lint = lintEntry(entry, known);
                for (const f of lint.findings) {
                    failures++;
                    console.log(`  LINT  ${rel(i.path)}:${starts[k] + f.lineOffset}  ${entry.heading}`);
                    console.log(`        Check ${f.check}: ${f.message} — ${f.field}, found ${f.found}; allowed ${f.allowed}`);
                }
                for (const v of lint.unresolved) {
                    console.log(`  WARNING  ${rel(i.path)}:${starts[k]}  Corregge ${v} matches no known prompt-document name (non-blocking)`);
                }
            });
        }
        if (failures > 0) {
            console.error('');
            console.error(`refusing to fold: ${failures} problem(s) in the lane inboxes would fail Check B or C of check:docs (LINT lines above).`);
            console.error('fix them in the inbox files; nothing was written.');
            process.exit(1);
        }

        const result = fold(active, inboxes);
        active = result.active;
        duplicates = result.duplicates;

        console.log(`fold: ${result.folded} entr${result.folded === 1 ? 'y' : 'ies'} folded into ${rel(LOG_MD)}`);
        if (duplicates.length > 0) {
            console.log(`fold: ${duplicates.length} duplicate(s) found — NOT folded, stop required:`);
            for (const d of duplicates) console.log(`  DUPLICATE  ${d}`);
        }
        for (const emptied of result.emptied) {
            const inbox = inboxPaths.find((i) => i.lane === emptied.lane);
            if (inbox) newInboxText.set(inbox.path, emptied.text);
        }
        console.log('');
    }

    if (args.rotate) {
        const result = rotate(active, archive, args.keep);
        const movedCount = result.movedEntries.length;
        console.log(`rotate: keep=${args.keep} — ${movedCount} entr${movedCount === 1 ? 'y' : 'ies'} moved to ${rel(LOG_ARCHIVE_MD)}`);
        for (const e of result.movedEntries) console.log(`  MOVE  ${entryType(e) === 'ticket' ? '[ticket] ' : ''}${e.heading}`);
        for (const w of result.warnings) console.log(`  WARNING  ${w}`);
        const straight = args.fold ? foldedIntoArchive(inboxes, result.movedEntries) : [];
        if (straight.length > 0) {
            console.log(`rotate: ${straight.length} entr${straight.length === 1 ? 'y' : 'ies'} folded in this run went straight to the archive, never in the active log:`);
            for (const e of straight) console.log(`  STRAIGHT-TO-ARCHIVE  lane "${e.lane}"  ${e.heading}`);
        }
        active = result.active;
        archive = result.archive;
        console.log('');
    }

    console.log(`after: ${rel(LOG_MD)} ${splitLog(active).entries.length} entries, ${rel(LOG_ARCHIVE_MD)} ${splitLog(archive).entries.length} entries`);
    for (const inbox of inboxPaths) {
        const text = newInboxText.get(inbox.path) ?? (originals.get(inbox.path) as string);
        console.log(`after: lane "${inbox.lane}" (${rel(inbox.path)}) ${splitLog(text).entries.length} entries`);
    }

    if (duplicates.length > 0) {
        console.error('');
        console.error('stopping: duplicate inbox entries found (see DUPLICATE lines above). Not writing.');
        process.exit(1);
    }

    if (!args.write) {
        console.log('');
        console.log('dry run — nothing written. Pass --write to apply.');
        process.exit(0);
    }

    const toWrite = new Map<string, string>();
    toWrite.set(LOG_MD, active);
    toWrite.set(LOG_ARCHIVE_MD, archive);
    for (const [path, text] of newInboxText) toWrite.set(path, text);

    assertCleanForWrite([...toWrite.keys()]);

    for (const [path, text] of toWrite) writeFileSync(path, text, 'utf8');

    let ok = true;
    for (const [path, text] of toWrite) {
        const onDisk = readFileSync(path, 'utf8');
        if (onDisk !== text) {
            ok = false;
            console.error(`verification failed: ${rel(path)} on disk does not match what was written`);
        }
        const { header, entries } = splitLog(onDisk);
        if (header + entries.map((e) => e.text).join('') !== onDisk) {
            ok = false;
            console.error(`verification failed: ${rel(path)} does not round-trip through splitLog`);
        }
    }

    if (!ok) {
        console.error('');
        console.error('post-write verification FAILED — restoring originals from memory.');
        for (const [path, text] of originals) writeFileSync(path, text, 'utf8');
        process.exit(1);
    }

    console.log('');
    console.log('written and verified — the verbatim invariants hold on disk.');
    process.exit(0);
}

main();
