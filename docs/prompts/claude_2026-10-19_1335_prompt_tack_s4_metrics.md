# Tack slice 4: layer-1 metrics, worktree resolution, rename fix

Prompt-ID: P-2026-10-19-1335
Chat: C-2026-10-19-0001
Front: tack
Lane: full (metrics module over the store plus an identity fix in the collectors; discovery done in P-2026-10-19-1100)
Status: da eseguire
Depends: P-2026-10-19-1305
Corregge: P-2026-10-19-1305 (196 of 592 sessions left `path-gone`, mostly deleted Jjodel lane worktrees; `--no-renames` mutation survived)
Request: Alfonso, 2026-10-19 13:32, in the project chat: «procedi con la slice 4 ?»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply as a separate phase (the discovery is `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §2.2, §4.1, §6.3, §11); no Phase 1 hard stop. P8 does not apply (no UI).

Worktree: `~/jjodel-w-tack-s4`, branch `tack-s4`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-1335 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole.

## Context

Tack lives in `tack/`, self-contained, no dependency, Node >= 24 through `~/.local/bin/node` for every command and test. Slices 1-3 shipped contract v1 and `tack check`; the `node:sqlite` store with the metadata-only Claude Code collector; repository identity (key = lowest root commit, linked worktrees share the common dir, deleted paths `missing: path-gone`) and the git collector (sha, times, numstat, unit id by form, Claude co-author flag; no subject, body, author, email or path). Real store on this Mac: 592 sessions, 385 linked to 5 repositories, **196 `path-gone`**, 11 `not-a-git-work-tree`; Jjodel 6,467 commits.

## COSA

1. **Resolve deleted worktrees** (correction of slice 3). Most `path-gone` sessions ran in removed Jjodel lane worktrees (`~/jjodel-w-*`). Add an inference step after repository identity, in this order, recording `link_method` = `direct | branch | sibling | none` and never overwriting a direct link: (a) **branch**: the transcript's `gitBranch` (store it in `sessions`, it is a ref name, not content) names a branch, or a merge parent reachable from a ref, in exactly one present repository; (b) **sibling**: the missing path's parent directory contains present worktrees of exactly one repository and the session has no conflicting branch; otherwise `none`. Ambiguity (two candidate repositories) stays `none`, with the reason counted. Report on this Mac how many of the 196 are resolved by each method and how many remain, by reason. Sprotty clones under `/private/tmp` must stay missing (no present sibling repository).
2. **Rename fix**: the git collector passes `--no-renames` (or proves with a test that the stored numstat is identical with and without renames); add the test that kills the surviving mutation.
3. **Metrics module** `tack/src/metrics/`, pure functions over the store (no I/O besides the store handle), each exporting its name, the **layer it needs** (1 traces, 2 identity, 3 self-assessment) and a one-line definition. Layer 1, all computable on any repository with zero adoption: sessions per day; cost per day (sessions with unknown cost counted apart, never as 0); tokens per day by kind; context peak per session and the count of sessions at or above 200k; main-thread calls per session; waits (gaps between consecutive calls of one session above 5 minutes, summed per session and per day); overlap (maximum number of sessions active at the same time per day, by repository); commit proximity (share of sessions with a commit within the hour, by repository, `unknown` kept apart); subagent share of calls and cost. Thresholds (200k, 5 min, 1 h) are parameters with these defaults. Layer 2 and 3 metrics are declared as stubs that return `not-adopted` when their data is absent; do not implement them.
4. **CLI** `tack metrics [--repo <key|path>] [--since <date>] [--json]`: prints every layer-1 metric for the selection and lists the layer-2/3 metrics as `not adopted` with the field that would enable them. `tack sessions` gains `link` (method) next to `commit within hour`.
5. **Tests** on synthetic fixtures for every metric (including empty selection, a single session, unknown cost, overlapping sessions across midnight in local time vs UTC: choose one, document it in the README, test it), and for each worktree-resolution method including the ambiguous case.
6. **Acceptance on this Mac**: with a store under `/tmp`, run `tack scan` and `tack metrics --repo` for Jjodel, tracer-scaffold and harness-book. Cross-check two numbers against independent sources and put both in the entry: Jjodel cost per day for the last 7 days against `frontend/scripts/lane-usage.mjs` or the lane board's `spendByDay` for the lanes of those days (differences explained: Tack also counts non-lane sessions, the board only lanes), and tracer-scaffold's context peak against slice 2. Run `tack scan` twice: the second adds 0 rows.

## DOVE

`tack/**`, `docs/log-inbox/tack.md` (one entry), this prompt's `Status:` line. Nothing else. Stores for acceptance live under `/tmp`.

## Gates

`cd tack && ~/.local/bin/node --test` green, privacy tests included; `check:docs` after the commits (from `frontend/`).

## Commits (P13, RC-17), explicit pathspecs, no push

1. `feat(tack): layer-1 metrics, worktree resolution, rename fix (P-2026-10-19-1335)` with `tack/**`. Trailer `Model:` (P6).
2. `docs: Status flip and log entry for Tack slice 4 (P-2026-10-19-1335)` with the entry (resolution counts and the two cross-checks in it) and the Status line.

## NON FARE

No dependency. No board or HTTP server (slice 5). No layer-2/3 metric implementation (slice 6). No change to `frontend/scripts/lane-board/`, `lane-usage.mjs` or any file outside `tack/` and the two docs: the board and `lane-usage.mjs` are read for the cross-check, never edited. No git command that writes, no network. No message text, commit subject, author or path in the store, the entry or the commit message (branch names are allowed in the store, not in the entry). No push.

## HARD STOP

None planned: close with `Outcome: done`. `Outcome: question` if the cross-check against the lane board differs by more than 5% for a reason you cannot name.

## RIFERIMENTI

- `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §2.2 (metrics of today's board), §4.1 (layers), §6.3 (slice 4 criterion), §11
- `frontend/scripts/lane-usage.mjs`, `frontend/scripts/lane-board/insights.js` (definitions to copy and adapt, not import)
- `docs/log-inbox/tack.md` (slices 2 and 3 entries)
