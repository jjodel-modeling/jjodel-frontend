import { describe, test, expect, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
    checkAddonly,
    checkCommit,
    checkRevision,
    checkRange,
    firstParent,
    LOG_MD,
    LOG_ARCHIVE_MD,
} from '../check-addonly.ts';
import type { AddonlyInput } from '../check-addonly.ts';

// check-addonly refuses a commit that rewrites an existing ENTRY of an
// add-only file (docs/claude-code-log.md, docs/claude-code-log-archive.md,
// docs/log-inbox/*.md), compared with the commit's first parent. Stage 2
// (P-2026-09-28-2001, GO stage 2): the unit of comparison is the whole entry
// (a `## ` heading through the next, log-tools.ts splitLog), byte-identical
// and contiguous, not the individual line stage 1 used — stage 1's per-line
// model could not tell a legitimate same-file relocation from the 447e4239b
// splice (an entry's tail reattached to a different heading is, line by
// line, indistinguishable from a repair moving lines back where they
// belong); at entry granularity the two are different shapes. checkAddonly
// is pure (text in, violations out): the synthetic tests exercise it
// directly. checkCommit/checkRevision/checkRange are the git-backed callers,
// exercised against the real history of this repository and, for the
// Log-Repair exemption, a throwaway synthetic repository (a real commit's
// message cannot be retrofitted with a trailer it never carried). A test
// name states the mutation of the script that turns it red (CLAUDE.md 5);
// the bench that established it is in the commit message.

const empty = (): AddonlyInput => ({ active: { old: null, new: null }, archive: { old: null, new: null }, inboxes: [] });

const entry = (date: string, title: string, body: string) => `## ${date} — ${title}\n${body}`;

const A = entry('2026-01-01', 'feat: entry A', '**Prompt**: the first thing.\n**Prompt document name**: 2026-01-01 00:00\n');
const A_CHANGED = entry('2026-01-01', 'feat: entry A', '**Prompt**: the first thing, edited.\n**Prompt document name**: 2026-01-01 00:00\n');
const B = entry('2026-01-02', 'feat: entry B', '**Prompt**: the second thing.\n**Prompt document name**: 2026-01-02 00:00\n');
const C = entry('2026-01-03', 'feat: entry C', '**Prompt**: the third thing.\n**Prompt document name**: 2026-01-03 00:00\n');

describe('checkAddonly — entry-level synthetic fixtures', () => {
    test('kills "an addition flagged as a rewrite": a new entry appended to the active log is clean', () => {
        const out = checkAddonly({ ...empty(), active: { old: A, new: A + B } });
        expect(out).toEqual([]);
    });

    test('kills "a changed entry waved through": one field edited in an old, un-rotated entry is refused', () => {
        const out = checkAddonly({ ...empty(), active: { old: A, new: A_CHANGED } });
        expect(out).toEqual([{ file: LOG_MD, line: 1, heading: '## 2026-01-01 — feat: entry A' }]);
    });

    test('kills "a same-file reorder refused": two entries swapping position, byte-identical, is clean (R-RAIL-45 newest-first)', () => {
        const out = checkAddonly({ ...empty(), active: { old: A + B, new: B + A } });
        expect(out).toEqual([]);
    });

    test('kills "rotation not recognized": an entry moved verbatim from the active log to the archive, in the same commit, is clean', () => {
        const out = checkAddonly({
            ...empty(),
            active: { old: A + B, new: B },
            archive: { old: C, new: C + A },
        });
        expect(out).toEqual([]);
    });

    test('kills "a partial rotation waved through": a rotation whose archive is missing one of the moved entries is refused for that entry only', () => {
        const out = checkAddonly({
            ...empty(),
            active: { old: A + B + C, new: '' },
            archive: { old: '', new: A + B },
        });
        expect(out).toEqual([{ file: LOG_MD, line: 7, heading: '## 2026-01-03 — feat: entry C' }]);
    });

    test('kills "an archive edit waved through": the archive is never a legitimate source, so a lost entry is refused even if identical text sits in the active log', () => {
        const out = checkAddonly({
            active: { old: B, new: B },
            archive: { old: C + A, new: C },
            inboxes: [],
        });
        expect(out).toEqual([{ file: LOG_ARCHIVE_MD, line: 4, heading: '## 2026-01-01 — feat: entry A' }]);
    });

    test('kills "batch closure not recognized": an inbox emptied with its entry landed in the active log, in the same commit, is clean', () => {
        const out = checkAddonly({
            ...empty(),
            active: { old: B, new: B + A },
            inboxes: [{ path: 'docs/log-inbox/lane.md', old: A, new: null }],
        });
        expect(out).toEqual([]);
    });

    test('kills "an inbox deleted without its entry in the log waved through": an inbox emptied with its entry absent from the active log is refused', () => {
        const out = checkAddonly({
            ...empty(),
            active: { old: B, new: B },
            inboxes: [{ path: 'docs/log-inbox/lane.md', old: A, new: null }],
        });
        expect(out).toEqual([{ file: 'docs/log-inbox/lane.md', line: 1, heading: '## 2026-01-01 — feat: entry A' }]);
    });

    test('kills "two inboxes sharing one destination entry": the batch-closure pool is consumed, not reused, across inboxes changed in the same commit', () => {
        const out = checkAddonly({
            ...empty(),
            active: { old: B, new: B + A },
            inboxes: [
                { path: 'docs/log-inbox/a.md', old: A, new: null },
                { path: 'docs/log-inbox/b.md', old: A, new: null },
            ],
        });
        // One copy of A landed in the active log; only one inbox's deficit can
        // be explained by it. Which one is unexplained is an implementation
        // detail (Map iteration order); what matters is exactly one violation.
        expect(out).toHaveLength(1);
        expect(out[0].heading).toBe('## 2026-01-01 — feat: entry A');
    });

    test('kills "the separator blank line read as a rewrite": an entry that is the last one in its inbox (no trailing blank line) landing before another entry in the active log (gaining one) is clean', () => {
        // The real bug this test pins: log-tools.ts splitLog gives an entry
        // everything up to the NEXT heading, so the SAME entry text carries a
        // trailing blank line when something follows it and does not when it
        // is the last thing in the file. Measured on the real batch closure
        // 5eadc9541 before this normalization existed.
        const out = checkAddonly({
            ...empty(),
            active: { old: B, new: A + '\n' + B },
            inboxes: [{ path: 'docs/log-inbox/lane.md', old: A, new: null }],
        });
        expect(out).toEqual([]);
    });
});

describe('checkCommit / checkRevision — real history', () => {
    test('kills "the rotation commit refused", "the maxBuffer truncation read as an empty archive": rotating the log at 40 entries (559eb82c5) is clean against the ~4MB archive', () => {
        const { violations, exempt } = checkRevision('559eb82c5');
        expect(violations).toEqual([]);
        expect(exempt).toBe(null);
    });

    test('kills "a real batch closure refused": folding two lane inboxes into the log and emptying them (5eadc9541) is clean', () => {
        const { violations, exempt } = checkRevision('5eadc9541');
        expect(violations).toEqual([]);
        expect(exempt).toBe(null);
    });

    test('kills "447e4239b waved through": the staging merge that spliced two entries is refused, naming the entry it truncated', () => {
        // Relative to its first parent 888ea9a9d (confirmed below), the trunk
        // already had the complete P-2026-09-26-2350 entry; the merge kept
        // its heading but dropped its 10-line tail (reattached, byte for
        // byte, under the newly-introduced 2026-09-18 entry the second
        // parent brought in — a stage-1 gap, since a per-line comparison
        // sees that relocation as content merely moving within the file).
        // At entry granularity the OLD, complete 2350 entry does not
        // reappear anywhere: refused.
        const parent = firstParent('447e4239b');
        expect(parent).toBe('888ea9a9d87a25399df7943c1b7cfedf31d12267');
        const { violations, exempt } = checkRevision('447e4239b');
        expect(exempt).toBe(null);
        expect(violations).toEqual([{
            file: LOG_MD,
            line: 31,
            heading: '## 2026-09-26 — chore: fold the inboxes and rotate the log at 40, close two harness tickets (P-2026-09-26-2350)',
        }]);
    });

    test('kills "e2448cf61 waved through without its exemption": the real repair commit is refused, because it carries no Log-Repair trailer', () => {
        // e2448cf61 restores BOTH entries: the 2350 entry regains its tail,
        // and the 2026-09-18 entry gets its own (different) correct tail
        // back. Neither of the two OLD (broken) entries reappears anywhere,
        // so both are named. This is the documented, accepted cost of the
        // stricter comparison (COME stage 2): the trailer mechanism exists
        // for exactly this shape of commit, but it cannot be retrofitted
        // onto a real commit's message after the fact — see the synthetic
        // exemption tests below for the mechanism itself.
        const { violations, exempt } = checkRevision('e2448cf61');
        expect(exempt).toBe(null);
        expect(violations.map((v) => v.line).sort((a, b) => a - b)).toEqual([31, 216]);
        expect(violations.map((v) => v.heading)).toContain(
            '## 2026-09-26 — chore: fold the inboxes and rotate the log at 40, close two harness tickets (P-2026-09-26-2350)',
        );
        expect(violations.map((v) => v.heading)).toContain('## 2026-09-18 — docs: trasporto normativo, passo 2 di P-2026-09-18-2110');
    });

    test('kills "a non-touching commit diffs the whole tree": a commit that does not change any in-scope file returns clean without reading the log or archive content', () => {
        const start = Date.now();
        const { violations, exempt } = checkRevision('247a93549');
        const elapsed = Date.now() - start;
        expect(violations).toEqual([]);
        expect(exempt).toBe(null);
        // A generous ceiling: the fast path is one `git diff --name-only` plus
        // one `git log --format=%B` call; reading the full log/archive
        // content would still be well under this, so this is a smoke check.
        expect(elapsed).toBeLessThan(2000);
    });
});

describe('checkRange', () => {
    test('kills "e2448cf61 silently waved through a range scan", "a merge in the range skipped", "the first-parent walk dropped", "the range order reversed": every first-parent commit of a fixed real range is checked, oldest first, e2448cf61 the only one refused', { timeout: 30000 }, () => {
        // Pinned to fixed commits of the trunk, not to HEAD (P-2026-09-28-2332):
        // 65eb5475b..HEAD walked the first-parent history of whichever branch
        // was checked out, and read the ~4MB archive for 40-odd commits, 6 s
        // alone and over the 5000 ms default under full-suite load. The range
        // below holds the rotation 559eb82c5, e2448cf61 and two merges
        // (63a80f62b, 3e141466d); every worktree of the repository shares
        // their objects.
        const results = checkRange('65eb5475b', '3e141466d');
        expect(results.map((r) => r.commit.slice(0, 9))).toEqual([
            '55c24d570', 'a51973abf', '63a80f62b', '559eb82c5', 'e2448cf61', '8609ec3e0', '3e141466d',
        ]);
        const dirty = results.filter((r) => r.violations.length > 0 || r.exempt !== null);
        expect(dirty.map((r) => r.commit)).toEqual(['e2448cf617f3b93a5b5c3bc5d10139d932d163c3']);
        expect(dirty[0].exempt).toBe(null);
    });

    test('kills "the range direction reversed": a..b walks only commits reachable from b and not from a', () => {
        // 559eb82c5 is e2448cf61's own first parent on this history: the
        // only commit reachable from e2448cf61 and not from 559eb82c5 is
        // e2448cf61 itself.
        const results = checkRange('559eb82c5', 'e2448cf61');
        expect(results.map((r) => r.commit)).toEqual(['e2448cf617f3b93a5b5c3bc5d10139d932d163c3']);
    });
});

// ── Log-Repair exemption: synthetic repository ──────────────────────────────
//
// A real commit's message cannot carry a trailer it was never written with,
// so the exemption is demonstrated on a throwaway repository shaped like the
// real incident: entry A created complete, then corrupted (no trailer —
// refused, the fate of the real e2448cf61), then repaired with the trailer
// (exempt).

const GIT_ENV = {
    GIT_AUTHOR_NAME: 'Addonly Test',
    GIT_AUTHOR_EMAIL: 'addonly@test.invalid',
    GIT_COMMITTER_NAME: 'Addonly Test',
    GIT_COMMITTER_EMAIL: 'addonly@test.invalid',
    GIT_CONFIG_NOSYSTEM: '1',
};

const dirs: string[] = [];
afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

function tmpRepo(): string {
    const dir = mkdtempSync(join(tmpdir(), 'addonly-repo-'));
    dirs.push(dir);
    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, env: GIT_ENV });
    return dir;
}

function commitFile(repo: string, path: string, content: string, messages: string[]): string {
    const full = join(repo, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
    execFileSync('git', ['add', '--', path], { cwd: repo, env: GIT_ENV });
    execFileSync('git', ['commit', '-q', ...messages.flatMap((m) => ['-m', m])], { cwd: repo, env: GIT_ENV });
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, env: GIT_ENV, encoding: 'utf8' }).trim();
}

describe('checkCommit — Log-Repair exemption (synthetic repository)', () => {
    test('kills "the corruption waved through without its exemption": entry A edited with no Log-Repair trailer is refused, the shape e2448cf61 is in for real', () => {
        const repo = tmpRepo();
        commitFile(repo, LOG_MD, A, ['base: entry A']);
        const corrupt = commitFile(repo, LOG_MD, A_CHANGED, ['fix: an accidental edit of entry A']);
        const { violations, exempt } = checkCommit(corrupt, repo);
        expect(exempt).toBe(null);
        expect(violations).toEqual([{ file: LOG_MD, line: 1, heading: '## 2026-01-01 — feat: entry A' }]);
    });

    test('kills "Log-Repair ignored", "the exemption value not read", "the wrong trailer key exempts too": a repair carrying Log-Repair: <sha> is exempt, and the report names what it repairs', () => {
        const repo = tmpRepo();
        commitFile(repo, LOG_MD, A, ['base: entry A']);
        const corrupt = commitFile(repo, LOG_MD, A_CHANGED, ['fix: an accidental edit of entry A']);
        const repaired = commitFile(repo, LOG_MD, A, ['docs: repair entry A', `Log-Repair: ${corrupt}`]);
        const { violations, exempt } = checkCommit(repaired, repo);
        expect(exempt).toBe(corrupt);
        expect(violations).toEqual([]);

        // A trailer with a different key does not exempt: the corruption commit itself, re-checked
        // with an unrelated trailer added to a throwaway sibling, still refuses.
        const notExempt = commitFile(repo, 'other.txt', 'x\n', ['chore: unrelated', 'Some-Other-Trailer: value']);
        const { exempt: notExemptValue } = checkCommit(notExempt, repo);
        expect(notExemptValue).toBe(null);
    });

    test('kills "an exempt commit still diffed": the exemption is checked before the comparison runs, so an exempt commit with a real violation reports none', () => {
        const repo = tmpRepo();
        commitFile(repo, LOG_MD, A + B, ['base: entries A and B']);
        // A genuinely destructive edit (B disappears with nowhere to explain it), but declared.
        const repaired = commitFile(repo, LOG_MD, A, ['docs: deliberately drop entry B', 'Log-Repair: 0000000']);
        const { violations, exempt } = checkCommit(repaired, repo);
        expect(exempt).toBe('0000000');
        expect(violations).toEqual([]);
    });
});
