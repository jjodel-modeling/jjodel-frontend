# log-inbox — lane «harness»

Entries written by the harness lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---


## 2026-09-21 — docs: Check B green after the fold, register language of three decisions, HARNESS-DOCS 1.3 (P-2026-09-21-1420)
**Prompt**: `P-2026-09-21-1420`, docs repair after the reintegration merge; Phase 1 report (`245a171a4`) then GO with six answers: line break after the letter, sentinel on the two tickets, `Corregge` of the 1930 split entry as `2026-09-18 19:30` with the file name in parentheses, accent `è`, HARNESS-DOCS line 374 out of scope, the inbox ticket as a block in this entry. Node `~/.local/bin/node` v26.8.1.
**Files touched**: commits `aa9bcfaad` (`docs/claude-code-log.md`, seven entries, fields only), `2e291a46a` (`docs/decisions.md`, RC-14, R-IRN-35, R-IRN-36), `877d6febc` (`docs/HARNESS-DOCS.md`, four lines); this entry (`docs/log-inbox/harness.md`). No gate change: all seven entries are post-rule, `check-docs.ts` already cuts off at 2026-08-02.
**Outcome**: ✅ completed — `check:docs` 4/4 (A, B, C, D), two non-blocking inbox warnings; `check:agents` green.
**Corregge**: 2026-09-19 17:40 (`P-2026-09-19-1740`, the merge lane whose fold left the residue)
**Causa**: (c)
**Regressions**: no.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: the cause is a wrong assumption: the fold copies inbox entries verbatim and nothing lints an inbox, so ten field errors surfaced only in the active log. HARNESS-DOCS line 374 (three checks, no D) and §4.5 (no `log:rotate`) stay stale, for a refresh of their own. The Project Knowledge copy of HARNESS-DOCS is 1.2 until Alfonso replaces it.
**Prompt document name**: 2026-09-21 14:20
**Ticket** (opened, not implemented here). Inboxes (`docs/log-inbox/*.md`) are outside Check B: an entry that fails the gate is invisible until the fold moves it into the active log, and the fold then turns the whole gate red (measured 2026-09-21: seven entries, ten errors, all written 2026-09-19). Either `check-docs.ts` lints the inbox files with the same rules as the active log, or `rotate-log.ts` refuses to fold an entry that would fail Check B. A ticket of the same family, not to be blocked by this one: the log has no ticket type, and two ticket blocks written as `## date — ticket` headings were read by the gate as task entries.
