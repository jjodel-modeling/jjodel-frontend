# B2-pre: `parseRows` reads the whole live register (wrapped headers, `verified: probe`, every ID series)

Prompt-ID: P-2026-10-18-1030
Chat: C-2026-10-17-1757
Front: harness
Lane: fast (one gate module and its test, outside the critical zone; tier drawn (RC-45): heavy)
Status: da eseguire
Depends: P-2026-10-18-0945
Request: none (chat decision under RC-25 after the hard stop of P-2026-10-18-0945, 2026-10-18 10:23; the register is not edited, the parser is)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 (visual check) does not apply, no UI is touched. P4 (discovery report) does not apply: Phase 1 is the hard-stop report of P-2026-10-18-0945 (its last message in `~/.jjodel-lanes/P-2026-10-18-0945/log.jsonl`, quoted below); one-session implementation lane (RC-17 fast lane).

Worktree: `~/jjodel-w-digestfix`, branch `digest-tolerant`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high`. Launched with `--tier heavy` from the RC-45 draw.

## Lane discipline
Every reply of this session opens with `[P-2026-10-18-1030 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`. Unattended (RC-21, RC-25): take the recommended answer on every question outside the RC-26 list and record it in the log entry under «Decisions taken (unattended)».
Time limit: 60 minutes (RC-20).
Output discipline (CLAUDE.md §0.1): `docs/decisions.md` is 651 KB, never `cat` it, read only the lines a probe or a test needs; run tests through `node frontend/scripts/run-quiet.mjs`.

## Context (measured by P-2026-10-18-0945, do not redo)
`parseRows` in `frontend/scripts/gates/docs-digest.ts` throws `HeaderParseError` on `docs/decisions.md:6104` (`R-GV-17`): the header wraps over two lines, so the parenthesis does not close on the first, and joined it carries `verified: probe`, outside the `agent|none` set at `docs-digest.ts:93`. `npm run docs:digest -- --all` fails the same way today. With that line neutralised, `parseRows` parses 407 rows and skips 67 other list lines: `ROW_ID` (`:83`, `R[A-Z]*-?[A-Z]*-?\d+`) never matches `D-UI-n` (7 rows), `D-4-n` (9), `D-5-n` (2), `U-n` (3), the sigla-only rows `R-A`..`R-H`, `R-B9-bis` and `H-B`, nor the dated form `R-B-3 (2026-08-05)` the register header names. `parseRows` is also consumed by `trace-index.ts`. The register itself is not edited: a row's text is Alfonso's ratified content (RC-26), and this lane changes the reader, not the rows.

## COSA
1. In `docs-digest.ts`, make the row grammar read the whole live register without changing what it returns for the rows it already parsed:
   a. Header continuation: when a `- **ID** (` line does not close its parenthesis, join the following lines (indented continuation lines, as `R-GV-17` has) until it closes, then parse the joined header. Keep the original line number of the row start.
   b. `verified:` accepts `agent`, `none` and `probe` (the value the register actually uses); extend the `Verified` type and let `confidence()` treat `probe` like `agent` unless the existing logic clearly says otherwise (state your choice in the entry). Any other value is still a `HeaderParseError`.
   c. `ROW_ID` covers every series the register uses: read the `## Serie` headings and the 67 skipped lines (reproduce the probe of P-2026-10-18-0945 first, with its count), then widen the pattern to `D-UI-n`, `D-4-n`, `D-5-n`, `U-n`, sigla-only `R-A`..`R-H`, `R-B9-bis`, `H-B`, and the dated form `ID (YYYY-MM-DD)` as the row's `id` plus a `date` disambiguator field. A list line under a `## Serie` heading that starts with `- **` and still matches nothing is counted in `nearMisses` so the number stays visible.
   d. Nothing else changes: `render`, `manualSection`, the digest output for the already parsed rows are byte-identical (assert with the existing tests and one golden comparison on a fixture).
2. Tests in `frontend/scripts/gates/__tests__/docsDigest.test.ts`: the wrapped header case taken verbatim from `R-GV-17` (shortened), `verified: probe`, an unknown `verified` value still throwing, one row per newly covered ID form, the dated form, the `nearMisses` count, and a negative case that must fail (a line that looks like a row but is prose). Then run `parseRows` on the live register in a test marked as integration (skipped when the file is absent): it must return the row count the probe predicts (407 + the recovered rows, give the exact number) with zero `HeaderParseError`.
3. `trace-index.ts`: run its tests unchanged; if the wider `ROW_ID` changes its output on the live register, report the diff count in the entry and do not alter it (out of DOVE).
4. Real run, numbers in the entry: `npm run docs:digest -- --all` exits 0; the parsed row total; the remaining `nearMisses` with their line numbers (expected: none, or listed).

## Gates
`node frontend/scripts/run-quiet.mjs digest -- npx vitest run frontend/scripts/gates/__tests__/docsDigest.test.ts`, then the whole `frontend/scripts/gates/__tests__/`; `npm run typecheck:scripts` exit 0; `npm run check:scripts` PASS; `npm run check:docs` after the docs commit (5/5).

## Commits (P13, RC-17), explicit pathspecs
Commit 1, `fix(harness): parseRows reads wrapped headers, verified: probe and every ID series (P-2026-10-18-1030)` (shorten under 72 without the suffix, §6.2): `docs-digest.ts`, `docsDigest.test.ts`, any fixture file. Trailer `Model:` (P6).
Commit 2, docs: the log entry in `docs/log-inbox/harness.md` (§21.2, `Causa` honest: a pre-existing gate defect surfaced by B2, so `Corregge` stays the sentinel; «Decisions taken (unattended)» and «Decisions awaiting Alfonso» at the end) and the Status flip of this prompt.
No push, no merge (RC-19).

## HARD STOP
None planned. Stop with `Outcome: question` only if making the grammar tolerant changes the output for an already parsed row (item 1d fails) and the cause is in the register text itself; give the row and the recommended fix.

## NON FARE
Do not edit `docs/decisions.md`, `trace-index.ts`, `log-tools.ts`, `check-docs.ts`, `lane-run.mjs`, any hook, `.claude/`, `CLAUDE.md`, `docs/PROTOCOL.md`. No `git add .`, no `git stash`, no `git reset --hard`.

## RIFERIMENTI
`~/.jjodel-lanes/P-2026-10-18-0945/log.jsonl` (last assistant text: the measurements above); `docs/prompts/claude_2026-10-18_0945_prompt_b2_selective_reads.md` (the consumer this lane unblocks); `frontend/scripts/gates/docs-digest.ts` lines 11, 52, 69, 83, 85, 93, 144, 151; `frontend/scripts/gates/trace-index.ts`; `docs/decisions.md` lines 1 to 7 (header) and 6100 to 6108 (`R-GV-17`); `docs/decisions.md` RC-16, RC-17, RC-20, RC-21, RC-25, RC-26, RC-27, RC-45; `docs/PROTOCOL.md` P6, P13, P14.
