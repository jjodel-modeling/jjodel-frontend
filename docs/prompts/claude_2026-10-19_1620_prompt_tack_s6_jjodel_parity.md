# Tack slice 6: layers 2 and 3, Jjodel adapters and parity with the lane board

Prompt-ID: P-2026-10-19-1620
Chat: C-2026-10-19-0001
Front: tack
Lane: full (identity and self-assessment layers, two adapters, parity check against the lane board; discovery done in P-2026-10-19-1100)
Status: da eseguire
Depends: P-2026-10-19-1555
Corregge: P-2026-10-19-1520 (unit id taken from any commit of the repository within the hour, not from the session's branch; SVG labels scaled up on wide charts), both found by the chat's visual check of 2026-10-19 16:15
Request: Alfonso, 2026-10-19 16:15, in the project chat: «si» to slice 6

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply as a separate phase (discovery `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §4.1, §5, §6.2, §6.3, §11); no Phase 1 hard stop. P8 is replaced as in 5a/5b: the chat checks the board in the built-in browser after exit; leave it running on port 4710 (stop the running one first: PID in `/tmp/tack-s5b/board.pid`, check with `ps` that it is a `tack` node process).

Worktree: `~/jjodel-w-tack-s6`, branch `tack-s6`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-1620 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`.

**Reading budget (two earlier Tack lanes hit the 200k ceiling by reading Jjodel's board whole).** From Jjodel read only these, by line range or `rg -n -A`: `frontend/scripts/lane-board/lane-board.mjs` functions `spendByDay` (around line 785), `logEntries` (around 1307) and the `/api/insights` lane builder with its `firstShot` rule (around 1363-1420), plus `kindOf` (around 92); `frontend/scripts/gates/log-tools.ts` functions `splitLog`, `parseFields`, `entryType`; `CLAUDE.md` §21.2-21.3 only. From Tack read the README and only the modules you change. Never `cat` a file above 300 lines. Write the handoff (`~/.jjodel-lanes/P-2026-10-19-1620/handoff.md` + `handoff.diff`) as soon as context passes 150k, not at 200k.

## Context

Tack (`tack/`, Node >= 24, no dependency) has contract v1 and `tack check`; the metadata-only store with Claude Code and git collectors, repository identity and worktree inference; layer-1 metrics; `tack board` on 4710 with Sessions, Timeline and Insights, where layer-2/3 panels show «Not adopted» or «Adopted, not implemented yet (slice 6)». On Jjodel: 529 sessions, 6,767 commits, 1,882 with a `(P-…)` subject suffix.

Slice-6 criterion of report §6.3: **with the `lane-run` adapter and a Markdown → JSONL importer of the Jjodel log, Tack on Jjodel matches the lane board's `spendByDay` for the last 14 days within 1% and its first-shot count within 0 lanes.**

## COSA

1. **Fix the unit-id link (correction).** A session's unit id must come only from commits **reachable from the session's branch** (its `gitBranch` ref, or the merge commit that brought that branch into another ref) whose time falls in the session's window plus one hour; never from another branch's commits in the same minutes. Today the `tack-s4` session at 13:34 shows `P-2026-10-19-1331` (another lane's merge). If no such commit exists, the unit id is empty and the Sessions view falls back to the branch. Add a test with two branches committing in the same minute.
2. **Layer 2, identity.** `sessions.unit` filled from (a) the transcript's first user message matching `^\[?P-\d{4}-\d{2}-\d{2}-\d{4}` (read the id only, never store the message), (b) the corrected commit link of item 1. Record which source set it. Implement the layer-2 metrics declared in slice 4: `commits_per_unit`, `cost_per_unit`, `resumes_per_unit` (sessions per unit minus one).
3. **Jjodel log importer** `tack import jjodel-log [--repo <path>] [--out <file>]`: reads the trunk's `docs/log-inbox/*.md`, `docs/claude-code-log.md` and `docs/claude-code-log-archive.md` (via `git show <trunk>:<file>`, as `logEntries` does), parses entries with the logic of `splitLog`/`parseFields` (copied and adapted, not imported), maps fields to contract v1 by report §5.1 (Italian names renamed, `Smoke visivo` and `Layer Impact Report` dropped, `Prompt document name` → unit id), and writes JSONL that passes `tack check`. Default output **outside the repository** (`~/.tack/imports/<repo-key>/log.jsonl`), never into the scanned repo. Report counts: entries read, converted, rejected by rule.
4. **Lane-run adapter** `src/collectors/lane-run/`: reads `~/.jjodel-lanes/<Prompt-ID>/` (`started.txt`, `exit.txt`, `runs.jsonl`, `tier.txt`, `worktree.txt`, the `result` events of `log.jsonl` for cost and outcome) as described in report §2.4; read-only; links lanes to units and sessions. Optional: enabled only when the folder exists.
5. **Layer 3 metrics**: `outcome`, `first_shot` (the board's rule: ends `done` or `hard-stop`, no rework signal, no blocked or over-limit run; reproduce it exactly and cite the line), `cause_tally`, `regression_rate`, `out_of_scope_rate`. Insights shows them for repositories that have the data; others keep their «Not adopted» card.
6. **Chart label fix (correction).** Wide charts stretch a 520-unit viewBox to ~1,126 px and double the axis text, cutting the last label («Oct 19»): size the viewBox from the container width (or set `preserveAspectRatio` and font sizes in px through CSS) so axis text stays 10-11 px at any width and no label is cut. Unit test on the helper.
7. **Parity check** `tack parity jjodel --days 14`: runs the board's `spendByDay` logic (copied into a test helper, not imported) on the lane folders and compares it day by day with Tack's lane-only cost; compares first-shot counts lane by lane. Exit non-zero beyond 1% or any first-shot mismatch, listing each difference with its cause. Put the table in the entry.
8. **Tests** on synthetic fixtures for every new path; privacy tests extended (no message text from item 2, no log entry text beyond the contract fields from item 3).

## DOVE

`tack/**`, `docs/log-inbox/tack.md` (one entry), this prompt's `Status:` line. Imports and stores under `~/.tack/` and `/tmp/tack-s6/`. Nothing else.

## Gates

`cd tack && ~/.local/bin/node --test` green, privacy tests included; `tack parity jjodel --days 14` exits 0, or the lane stops with `Outcome: question` and the table; `check:docs` after the commits (from `frontend/`).

## Commits (P13, RC-17), explicit pathspecs, no push

1. `feat(tack): layers 2 and 3, Jjodel log importer, lane-run adapter, parity (P-2026-10-19-1620)` with `tack/**`. Trailer `Model:` (P6).
2. `docs: Status flip and log entry for Tack slice 6 (P-2026-10-19-1620)` with the entry and the Status line.

## NON FARE

No dependency. No change to Jjodel's board, `lane-run.mjs`, `log-tools.ts`, the logs or any file outside `tack/` and the two docs. Nothing written into a scanned repository or into `~/.jjodel-lanes/`. No message text, subject, author or path in the store, the API, the entry or the commit. No push.

## HARD STOP

None planned: close with `Outcome: done`. `Outcome: question` if parity fails for a cause you cannot name, with the per-day table.

## RIFERIMENTI

- `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §2.4 (lane folder), §4.1, §5.1 (field mapping), §6.3, §11
- the Jjodel functions named under «Reading budget», by line range only
- `tack/README.md`, `docs/log-inbox/tack.md` (slices 4-5 entries)
