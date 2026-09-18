# Prompt log: fold the inboxes and rotate the log with a script, and make the gate fail above 40

Prompt-ID: P-2026-09-18-2015
Chat: C-2026-09-18-2015
Status: da eseguire
Date: 2026-09-18 20:15 (Europe/Rome)
Type: chore (harness tooling) + docs (the first fold and rotation)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: high
Lane: harness maintenance, EXCLUSIVE for the fold and rotation commits (RC-12): no other Claude
Code session on this tree while steps 4 and 5 run. Alfonso confirms that at the hard stop.

## Contesto

`docs/claude-code-log.md` holds **101 entries** (measured 2026-09-18, `grep -c '^## '`) against
the P9 threshold of 40. `check:docs` counts them and prints the number, and does not fail: that is
how the log got to 101 without anyone stopping. Two lanes wrote their entries in
`docs/log-inbox/symbol-editor.md` (7) and `docs/log-inbox/views.md` (5), waiting for the §6.1 fold;
the JjScript lane wrote straight into the active log. The fold and the rotation are specified
(P9, RC-12: verbatim, in the order of the active file) and mechanical, and today they are done by
hand, which is why they are not done.

This prompt turns both into one command, makes the gate red above the threshold so the rotation
is owed and not remembered, and runs the first fold and rotation as the script's own acceptance
test. No application code is touched.

Facts re-read on 2026-09-18 at `bd56aeace`:

- `frontend/scripts/gates/check-docs.ts` (552 lines): three checks A/B/C, read-only by design
  (header: "This script only reads. It never rewrites, reorders or normalizes the log."). It owns
  `ENTRY_HEADING = /^## (\d{4}-\d{2}-\d{2})(?: \d{2}:\d{2})? — /` (`:236`) and `parseEntries`
  (`:238`), neither exported. Check A compares the §21.2 block of `CLAUDE.md` with P9 of
  `docs/PROTOCOL.md` byte for byte: any edit to P9 must stay OUTSIDE that block.
- The active log has a 30-line preamble before its first entry (title, the newest-first rule, the
  "Incidenti — sanatoria batch L1–L4" note). The archive has a 308-line preamble. Both preambles
  are header text, never entries, and are never moved or edited.
- Order: newest-first per day, "NOT in chronological order" (check-docs `:290`); the archive's
  first entry is dated 2026-08-30, the active log's last is 2026-09-02. Rotation is therefore a
  positional cut, not a date sort: the entries to move are the LAST ones of the active file, and
  they go ABOVE the archive's first entry, in the order they had.
- Each inbox has a header (title, three lines of instructions, `---`) then entries newest-first.
- `frontend/vitest.config.ts:16` includes only `src/**/__tests__/**/*.test.ts`: a test under
  `scripts/gates/__tests__/` is not collected today.
- `frontend/package.json:100-101,108` has `check:docs`, `check:agents`, `gen:agents`; no `log:*`
  script exists (grep measured).

## COSA

1. **A pure module** `frontend/scripts/gates/log-tools.ts`, with no imports at all
   if possible (pure text in, text out):
   - `export const ENTRY_HEADING` (the regex above, moved here; `check-docs.ts` imports it and
     drops its local copy, one line).
   - `splitLog(text): { header: string; entries: RawEntry[] }` where `RawEntry = { heading, date,
     text }` and `text` is the entry's raw lines from its heading to the line before the next
     heading (or EOF), joined verbatim. Invariant, tested: `header + entries.map(e => e.text).join('')
     === text` byte for byte.
   - `rotate(active, archive, keep): { active, archive, moved }`: keeps the first `keep` entries
     of the active file, moves the rest as one block to the top of the archive's entry list, right
     after the archive header. Verbatim invariants, tested: `activeBefore === activeAfter + moved`
     and `archiveAfter === archiveHeader + moved + archiveEntriesBefore`. If the block to move
     contains an entry dated later than any kept entry, the result carries a `warnings[]` line
     naming it (ordering anomaly, RC-12 still moves by position).
   - `fold(active, inboxes: {lane, text}[]): { active, emptied: {lane, text}[], folded: number }`:
     for each inbox (lanes in alphabetical order), for each entry in inbox order, insert the entry
     at the TOP of the group of entries with the same date in the active log; if that date has no
     group, insert it right before the first entry with an earlier date (or at the end of the
     entries if none). Inbox entries keep their raw text. The emptied inbox is its header only.
     An inbox whose entry text is already present verbatim in the active log is a stop, not a
     silent skip: return it in `duplicates[]` and the CLI exits non-zero.
2. **A CLI** `frontend/scripts/gates/rotate-log.ts`, same toolchain as the other gates (`node
   --experimental-strip-types`): `--fold`, `--rotate`, `--keep=40` (default 40), `--write`
   (default dry-run). Dry-run prints: entries in active/archive/each inbox before and after, the
   headings of the entries that would move, the warnings. `--write` refuses unless: `git status
   --porcelain` is empty for the four log files (active, archive, both inboxes), and after writing
   it re-reads the files and re-checks the verbatim invariants; if any fails it restores the
   originals from memory and exits non-zero. It never runs `git`. It never touches the preambles.
3. **The gate**: `check-docs.ts` gains **Check D**: active entries `> 40` is a failure (message:
   count, threshold, and "run `npm run log:rotate -- --rotate --write` in an exclusive lane, RC-12");
   a non-empty inbox is a **warning** (mid-batch is a normal state), naming lane and count. The
   threshold constant lives in `log-tools.ts` (`LOG_MAX_ENTRIES = 40`) and Check D imports it.
4. **Wiring**: `frontend/package.json` gains `"log:rotate": "node --disable-warning=ExperimentalWarning
   --experimental-strip-types scripts/gates/rotate-log.ts"`; `frontend/vitest.config.ts` include
   gains `'scripts/gates/__tests__/**/*.test.ts'`.
5. **P9**: one sentence appended to the P9 paragraph of `docs/PROTOCOL.md` (OUTSIDE the format
   block Check A compares): "Il ripiegamento delle inbox e la rotazione si eseguono con `npm run
   log:rotate -- --fold --rotate --write` da `frontend/`, in corsia esclusiva (RC-12); sopra le 40
   entry `check:docs` è rosso." `check:docs` Check A must stay green. This commit touches a
   normative file and is owed to the trunk (§6.6 applies to `CLAUDE.md`; treat `PROTOCOL.md` the
   same way and say so in the entry).

## DOVE

Code commit (5 files, rule 19: list them at the hard stop, even though they are listed here):
`frontend/scripts/gates/log-tools.ts` (new), `frontend/scripts/gates/rotate-log.ts` (new),
`frontend/scripts/gates/__tests__/log-tools.test.ts` (new), `frontend/scripts/gates/check-docs.ts`
(Check D + the `ENTRY_HEADING` import), `frontend/package.json`, `frontend/vitest.config.ts`.
That is six with the test: rule 19 threshold crossed, declared.

Docs commits: `docs/PROTOCOL.md` (one sentence); then the fold (`docs/claude-code-log.md`,
`docs/log-inbox/symbol-editor.md`, `docs/log-inbox/views.md`); then the rotation
(`docs/claude-code-log.md`, `docs/claude-code-log-archive.md`).

## COME, in order, with hard stops

1. **Discovery, short, report required**: `docs/discovery/discovery_2026-09-18_log_rotate_fold.md`.
   Measure: the exact entry counts (active, archive, each inbox); whether every inbox entry is
   absent from the active log (the JjScript lane wrote there directly, so a duplicate is
   possible); the two preamble lengths; how `parseEntries` treats the historical `## date HH:mm —`
   heading (the regex tolerates it, `splitLog` must too); whether any active entry has a date
   later than the entry above it (the ordering anomaly the warning is for), and how many. HARD
   STOP with the report and the rule 19 listing.
2. **Code**: the module, the CLI, the test, the gate, the wiring. Tests: the three verbatim
   invariants on synthetic fixtures with preambles and the `HH:mm` variant; fold into an existing
   date group, into a missing date, at the end; duplicate detection; rotation with `keep` equal to,
   greater than, and smaller than the count. Mutation bench: drop the `+ moved` from the active
   invariant, invert the fold insertion (bottom of group instead of top), off-by-one on `keep`;
   each must go red, counts in the commit message. Gates: `npm run typecheck` at 33 with 0 in
   touched files, `npx vitest run` with the new tests counted separately, `npm run build` exit 0,
   `npm run check:docs` which is now EXPECTED RED on Check D (101 > 40): report it as the
   intended state, not as a failure of the commit. Commit `chore(gates): fold and rotate the
   prompt log by script, gate red above 40 entries`. HARD STOP: show the dry-run output of
   `npm run log:rotate -- --fold --rotate` on the real files (counts, the headings that would
   move, warnings).
3. **P9 sentence**, docs commit `docs(protocol): P9 names the log rotation command`. `check:docs`
   Check A green.
4. **Fold**, only after Alfonso confirms no other session is on the tree: `npm run log:rotate --
   --fold --write`; `git diff --stat` must show only the three files; the two inboxes reduced to
   their headers; `check:docs` Check B and C green on the folded entries. Docs commit
   `docs: fold the symbol-editor and views inboxes into the active log`. HARD STOP with the count
   (expected 101 + 12 = 113 if no duplicate).
5. **Rotation**: `npm run log:rotate -- --rotate --write`; `git diff --stat` shows only the two log
   files; the CLI prints the verbatim proof (both invariants re-checked on disk) and the number of
   entries moved (expected 73); `check:docs` fully green, Check D included. Docs commit
   `docs: rotate the prompt log, 40 entries kept, the rest archived verbatim (RC-12)`. HARD STOP.
6. **Log entry** for this prompt, in the active log directly (this lane is the closer, the inboxes
   are empty), `Corregge: —`, and the `Status` line of this prompt set to `Status: eseguito
   2026-09-18 · lane harness · <code sha>`. Docs commit `docs: log entry for the log rotation
   tooling`. Note in the entry: the PROTOCOL change is owed to the trunk.

## Fuori scope

Editing any entry's text; re-ordering entries beyond the fold rule; the archive preamble (it says
"over 20 entries", which is stale, and stays as is: history); the custom instructions of the
project chat (they say 20, only Alfonso can change them); a scheduled reminder (separate).

## Disciplina

Assert the branch before writing. Stage only your files, commit with the pathspec, check
`git diff --cached --name-only` against each step's list. The paper files
(`docs/mde-intelligence-2026/`), `.lsp.json` and `.tracer/` are not yours. Code and docs never in
the same commit. No screenshots. Every reply opens with `[P-2026-09-18-2015 · session <id>]`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9 (threshold 40, verbatim move), RC-12 (verbatim, file order), RC-13
  (shared tree), RC-13-bis (no backups on disk, no stash: the CLI keeps originals in memory only).
- `frontend/scripts/gates/check-docs.ts` `:236-256` (`ENTRY_HEADING`, `parseEntries`), `:290`.
- `docs/claude-code-log-archive.md:1-8` (archive preamble, order statement).
- `CLAUDE.md` rules 1, 4, 15, 17, 19; §5 sub-rules on mutation benches and positive controls;
  §6.1 (log staging pattern this script replaces), §6.4, §6.6; §21.2.
- `docs/HARNESS-DOCS.md` invariant 7 (above forty the cycle is broken, a triage is due).
