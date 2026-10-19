# Tack slice 3: git collector and repository identity

Prompt-ID: P-2026-10-19-1305
Chat: C-2026-10-19-0001
Front: tack
Lane: full (new collector that runs git on every repository the user worked in; discovery done in P-2026-10-19-1100)
Status: eseguito 2026-10-19 · lane tack-s3 · code commit 68ac2ccdd, docs commit carrying this line
Depends: P-2026-10-19-1225
Corregge: none
Request: https://claude.ai/chat/1b373b77-3e1f-4c66-b75e-9eec8a5ba215 (Alfonso, 2026-10-19 13:01, in the project chat: «via la fetta 3»)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply as a separate phase (the discovery is `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §4.2, §6.3, §7 risk 5, §11); no Phase 1 hard stop. P8 does not apply (no UI).

Worktree: `~/jjodel-w-tack-s3`, branch `tack-s3`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-1305 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole.

## Context

Tack lives in `tack/`, self-contained, no dependency, Node >= 24 through `~/.local/bin/node` (v26.8.1) for every command and test. Slice 2 shipped the `node:sqlite` store at `~/.tack/store.db` (tables `sessions`, `calls`, `ingest`), the incremental metadata-only Claude Code collector, `tack scan` and `tack sessions`, with a privacy test on the store bytes. On this Mac the real scan read 754 files, 591 sessions, 42,007 calls.

Decisions not to reopen (report §11): commit linkage accepts the trailer `Unit: <id>` as canonical and the subject suffix `(P-YYYY-MM-DD-HHmm)` as an alias; «commit within the hour» is kept and labelled as proximity, not authorship; the store keeps metadata only.

## COSA

1. **Repository identity** in `tack/src/collectors/git/identity.mjs`. For every distinct `cwd` in `sessions`: if the path no longer exists, or is not inside a git work tree, record it as **missing** (with the reason) and never as "no commit". Otherwise resolve `git rev-parse --show-toplevel`, `--git-common-dir` (so linked worktrees of one repository share one identity), the root commit(s) (`git rev-list --max-parents=0 --all`, sorted, the lowest sha is the key) and the normalised `origin` URL if any. Repository key = root commit; two clones of the same project with different roots are two repositories, and the entry says so. Store a `repos` table (key, root, common dir, toplevels seen, remote, state) and a `session_repo` link (session id, repo key or missing).
2. **Git collector** in `tack/src/collectors/git/`: for each present repository, read `git log --all` with an explicit `--format` and `--numstat`, storing per commit only: sha, parents count, author time, commit time, files changed, insertions, deletions, the unit id parsed from a `Unit:` trailer or from a `(P-YYYY-MM-DD-HHmm)` subject suffix (which form matched), and a boolean for a `Co-Authored-By:` trailer naming Claude. **No subject, body, author name, email or path is stored.** Incremental: remember the set of refs and their tips per repository; a repository whose tips did not move is skipped; history rewrites are handled by re-reading that repository.
3. **Proximity metric**: for each session with a present repository, `commit_within_hour` = yes when any commit of that repository has commit time between the session's first event and one hour after its last event; no otherwise; `unknown` when the repository is missing. Computed at query time or stored, your choice, documented in `tack/README.md`.
4. **CLI**: `tack scan` now runs the Claude Code collector, then repository identity, then the git collector, and prints counts per stage. New `tack repos [--json]`: one row per repository (key short, toplevel(s), remote host only, commits, commits with a unit id by form, Claude co-authored commits, sessions, sessions with a commit within the hour) plus the missing cwds grouped by reason. `tack sessions` gains the `commit within hour` column (yes / no / unknown).
5. **Tests** with synthetic git repositories created in a temporary directory by the test itself (`git init`, commits with fixed dates through `GIT_AUTHOR_DATE` / `GIT_COMMITTER_DATE`, a linked worktree, a second clone, a deleted clone): identity shared by a worktree, two clones with the same root grouped, a deleted path reported missing, both linkage forms parsed, co-author detection, incremental skip when tips did not move, re-read after a rewrite, proximity yes/no/unknown. Extend the privacy test: a commit subject and body with a unique marker must not occur in the store bytes.
6. **Acceptance on this Mac** (report §6.3, slice 3): with a store under `/tmp`, for tracer-scaffold, harness-book and this repository, the number of commits Tack stores equals `git rev-list --all --count` in that repository; the eight `/private/tmp/sprotty-*` cwds are reported as missing, not as "no commit"; tracer-scaffold shows 1 session with a commit within the hour and harness-book 1 (report §4.2: 0 of 1 without); the Layer-2 counts of §4.2 are reproduced (tracer-scaffold 0 unit ids, 9 Claude co-authored commits out of 13; harness-book 0 and 27 out of 33), or every difference gets a cause (new commits since 2026-10-19 11:00 are a valid cause, shown by date). Put the table, numbers only, in the entry. Run `tack scan` twice: the second adds 0 rows.

## DOVE

`tack/**`, `docs/log-inbox/tack.md` (one entry), this prompt's `Status:` line. Nothing else. Stores used for the acceptance run live under `/tmp`.

## Gates

`cd tack && ~/.local/bin/node --test` green, privacy test included; `check:docs` after the commits (from `frontend/`).

## Commits (P13, RC-17), explicit pathspecs, no push

1. `feat(tack): git collector and repository identity (P-2026-10-19-1305)` with `tack/**`. Trailer `Model:` (P6).
2. `docs: Status flip and log entry for Tack slice 3 (P-2026-10-19-1305)` with the entry (acceptance table in it) and the Status line.

## NON FARE

No dependency. No git command that writes in a scanned repository (no `fetch`, `gc`, `checkout`, `config`, no lock taken: set `GIT_OPTIONAL_LOCKS=0` for every call). No network. No commit subject, body, author, email or file path in the store, the entry or the commit message. No change outside `tack/` and the two docs. No metrics module (slice 4), no board (slice 5). No push.

## HARD STOP

None planned: close with `Outcome: done`. `Outcome: question` if repository identity cannot be decided for a case the tests do not cover.

## RIFERIMENTI

- `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §4.2 (numbers), §6.3 (slice 3 criterion), §7 risk 5, §11
- `tack/README.md`, `tack/src/store/schema.sql`, `tack/src/collectors/claude-code/` (slice 2)
- `docs/log-inbox/tack.md` (slice 2 entry, the comparison table format)
