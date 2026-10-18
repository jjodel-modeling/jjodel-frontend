# B2: selective reads of the decisions register and the log (`npm run decisions`, `npm run log:find`)

Prompt-ID: P-2026-10-18-0945
Chat: C-2026-10-17-1757
Front: harness
Lane: fast (two new read-only CLIs under `frontend/scripts/gates/` with tests, two script entries; outside the critical zone; tier drawn (RC-45): light)
Status: eseguito 2026-10-18 · lane selective-reads · code 7d0be0298 · tests 363 green in scripts/gates/__tests__ (decisionsQuery 25, logFind 24), typecheck:scripts 0, check:scripts PASS, mutation bench 12/12 killed · hard stop on parseRows (paragraph rows) cleared by P-2026-10-18-1030, 169 paragraph rows still read through a dash prefix in decisions-query.ts (ticket) · no visual check
Depends: P-2026-10-18-0100
Request: none (chat decision under RC-25 on the approved plan of RC-49 (2), AM-5; Alfonso's 09:33 «c'è qualcosa da fare qui?» answered with this launch)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 (visual check) does not apply, no UI is touched. P4 (discovery report) does not apply: Phase 1 is §5.1 (the two CLIs), §5.2 and AM-5 of `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md`, already committed; one-session implementation lane (RC-17 fast lane).

Worktree: `~/jjodel-w-selread`, branch `selective-reads`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: light, `claude-sonnet-5-5` (RC-32), effort `high`. Launched with `--tier light` from the RC-45 draw. A drawn lane keeps its tier on resume (RC-45).

## Lane discipline
Every reply of this session opens with `[P-2026-10-18-0945 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`. Unattended (RC-21, RC-25): take the recommended answer on every question outside the RC-26 list and record it in the log entry under «Decisions taken (unattended)».
Time limit: 90 minutes (RC-20). Priority if time runs short: item 1 with its tests first, then item 2. An item not reached is written in the log entry as a ticket, not silently dropped.
Output discipline (CLAUDE.md §0.1): read code with Read and `offset`/`limit`; `docs/decisions.md` is 651 KB and the archive 4.9 MB, never `cat` them, never print more than the lines a test or a check needs; run tests and type checks through `node frontend/scripts/run-quiet.mjs`; the output-budget hook is active.

## Context (do not redo the analysis)
RC-49 (2) approved AM-5: a session reads the decisions its prompt cites, with their amendments, and the log entries for its DOVE files, its front and the cited Prompt-IDs, instead of the last N entries and the whole register. B2 builds the two read-only CLIs; the injection by `lane-run start` is B3a (not this lane) and the normative text is B2b (not this lane). Today reading the register costs about 17k tokens per call when a session opens it, and the archive cannot be opened at all. The row grammar of the register already exists in `frontend/scripts/gates/docs-digest.ts` (`parseRows`, `Row`); the log entry grammar in `frontend/scripts/gates/log-tools.ts` (`ENTRY_HEADING`, entry split, inbox fold). Both are the single sources: reuse them, do not re-implement a parser.

## COSA

### 1. `frontend/scripts/gates/decisions-query.ts` (new; same runtime form as the other gates: `node --experimental-strip-types`)
Usage: `npm run decisions -- <ID> [<ID> ...] [--json] [--no-related]`. An ID is `RC-\d+`, `R-[A-Z0-9]+-\d+`, `D-UI-\d+` or any other `<SERIES>-<n>` the register uses; read the real set of series from the `## Serie` headings before fixing the regex, and accept the dated form `R-B-3 (2026-08-05)` when two series share a sigla (register header, line 4 to 7).
For each ID it prints: the canonical row text (the full `- **ID** (...)` line, unchanged), its status (`active`, `provisional` when the row says `provisional, unattended` or equivalent, `superseded` when the row sits under `## Superate`), its series and section, and, unless `--no-related`, the rows it amends or supersedes and the rows that amend or supersede it. Relations are read from the markers the register actually uses: start from `Amends`, `amends`, `Emenda`, `emendamento a`, `Amended by`, `Supersedes`, `supersedes`, `Sostituisce`, `superata da`, `renumbered`, and measure with grep which other forms exist (the report counted 105 marker lines); list the forms you recognise in a comment, and count in the entry how many marker lines the recogniser matched against the grep total (a claim of coverage carries its number, R-RAIL-28). Related rows are printed once each, with the relation named; depth one, no transitive closure.
A missing ID prints one line `not found: <ID>` on stderr and the exit code is 1 after all IDs are processed (the found ones are still printed). `--json` prints an array of `{id, status, series, section, row, related: [{id, relation, row}]}`. The CLI never writes.
Performance: parse the register once per invocation; fifty IDs must stay under one second on the 651 KB file (measure and put the number in the entry).

### 2. `frontend/scripts/gates/log-find.ts` (new)
Usage: `npm run log:find -- (--file <path> | --front <slug> | --prompt <P-ID> | --id <P-ID>)... [--full] [--limit <n>] [--since <YYYY-MM-DD>]`. Sources, in this order: `docs/claude-code-log.md`, every `docs/log-inbox/*.md`, `docs/claude-code-log-archive.md`. The archive is read in a streaming way (line by line, never whole), and it is only read when the active log and the inboxes gave fewer than `--limit` hits, or when `--since` reaches before the active log's oldest entry.
Matching: `--file` matches an entry whose `**Files touched**` line contains the path (substring, also with a leading `frontend/` added or removed); `--front` matches the inbox named after the slug plus entries whose heading or `**Prompt**` line cites a prompt file of that front (read how `check:docs` Check E resolves a prompt's front and reuse it); `--prompt` and `--id` match an entry whose heading or `**Prompt**` line carries that Prompt-ID, including `Corregge` chains when the entry cites it. Several criteria are OR-ed; `--limit` defaults to 20, newest first.
Output: one line per hit, `<source>:<line> <heading>`, and with `--full` the whole entry body after each line. Nothing is rewritten or rotated (that stays with `rotate-log.ts`). Exit 0 with hits, 1 with none.

### 3. Tests: `frontend/scripts/gates/__tests__/decisionsQuery.test.ts` and `logFind.test.ts`
Fixtures as inline strings or small files under `frontend/scripts/gates/__tests__/fixtures/`: a miniature register with three series, one `## Superate` section, rows with each relation form you recognise, one dated-sigla case; a miniature active log, one inbox, one archive with the entry grammar of `log-tools.ts`. Cover: status detection, related rows in both directions, `--no-related`, missing ID exit code with partial output, `--json` shape; for log-find each criterion alone, two criteria OR-ed, `--limit`, `--since`, `--full`, the archive read only when needed (assert by stubbing or by a fixture where the active log already satisfies the limit), exit codes. Follow `docsDigest.test.ts` and `log-tools.test.ts` for how these gates are tested (import the module, or run it as a child process, as they do).
Then a real run on the live files, numbers into the entry body: `npm run decisions -- RC-49 RC-45 RC-16` and `npm run log:find -- --front harness --limit 5`, the first two lines of each output.

### 4. `frontend/package.json`
Two script entries, `decisions` and `log:find`, in the same runtime form as `check:docs`. Nothing else.

## Gates (all green before the commits)
`node frontend/scripts/run-quiet.mjs decisions -- npx vitest run frontend/scripts/gates/__tests__/decisionsQuery.test.ts`, the same for `logFind.test.ts`, then the whole `frontend/scripts/gates/__tests__/` (nothing existing turns red); `npm run typecheck:scripts` exit 0; `npm run check:scripts` PASS; `npm run check:docs` after the docs commit (5/5).

## Commits (P13, RC-17: docs and code never together), explicit pathspecs
Commit 1, `feat(harness): decisions and log:find read the register and the log by ID (P-2026-10-18-0945)`: the two gates, the two tests, the fixtures, `frontend/package.json`. Subject under 72 characters without the `(P-...)` suffix (§6.2); trailer `Model:` (P6).
Commit 2, docs: the log entry in `docs/log-inbox/harness.md` (§21.2, `Causa` honest, «Decisions taken (unattended)» and «Decisions awaiting Alfonso» at the end, the latter expected empty) and the Status flip of this prompt (eseguito, date, lane, sha of commit 1).
No push, no merge (RC-19; the chat runs `lane-run merge` after this lane closes).

## HARD STOP
None planned: the lane closes with `Outcome: done`. Stop with `Outcome: question` only if `parseRows` of `docs-digest.ts` cannot be reused without changing it (changing `docs-digest.ts` is out of DOVE), or if the relation markers in the live register are too irregular to reach at least 90% of the marker lines; in both cases give the measured number and the recommended way out.

## NON FARE
Do not modify `docs-digest.ts`, `log-tools.ts`, `rotate-log.ts`, `check-docs.ts`, `lane-run.mjs`, any hook, `.claude/`, `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/decisions.md` (not even its header) or the log files other than the inbox entry. No `git add .`, no `git stash`, no `git reset --hard`.

## RIFERIMENTI
`docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §5.1 (the two CLIs), §5.2 rule 16 row, §5.4 AM-5, §5.6 (B2), §7.5; `docs/decisions.md` RC-16, RC-17, RC-20, RC-21, RC-25, RC-26, RC-32, RC-45, RC-49, header lines 1 to 7, `## Superate`; `frontend/scripts/gates/docs-digest.ts` (`parseRows`, `Row`, `nearMisses`); `frontend/scripts/gates/log-tools.ts`; `frontend/scripts/gates/check-docs.ts` (Check E, front of a prompt); `frontend/scripts/gates/__tests__/docsDigest.test.ts`, `log-tools.test.ts`; `docs/PROTOCOL.md` P6, P9, P13, P14.
