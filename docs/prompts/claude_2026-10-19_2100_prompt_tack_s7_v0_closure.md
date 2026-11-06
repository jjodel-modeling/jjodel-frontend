# Tack slice 9: v0 closure on repositories that are not Jjodel

Prompt-ID: P-2026-10-19-2100
Chat: C-2026-10-19-1748 (written by C-2026-10-19-0001; the tack front moved to C-2026-10-19-1748, Alfonso 2026-10-19 22:20)
Front: tack
Lane: full (small: one display fix, a first-run check on two foreign repositories, README; no new feature)
Status: superato 2026-10-21 · sostituito da P-2026-10-21-1330 (riscritto sul trunk dopo la fetta 9 e S1; seeding di sessioni headless tolto, RC-26)
Depends: P-2026-10-19-1655, and the merge of slice 7 (P-2026-10-19-1800 and its continuations) on trunk
Corregge: none (the `tack repos` column width defect was found by the chat on 2026-10-19 20:55 and is fixed here as item 1)
Request: Alfonso, 2026-10-19 20:49, in the project chat: «decidi tu» on closing v0 now versus waiting for the Sprotty pilot

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply as a separate phase (the chat measured the inputs on 2026-10-19 20:55, see Context); no Phase 1 hard stop. P8 replaced as in slices 5-6: the chat checks the board after exit.

Worktree: `~/jjodel-w-tack-s9`, branch `tack-s9`, created by the chat from the local `alfonso-frontend-jjtl` after slice 8 (the Lanes page, R-TACK-3) is merged (slice 7 owns `~/jjodel-w-tack-s7`). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-2100 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. Node: `~/.local/bin/node`.

**Context budget.** Read `tack/README.md` and only the modules you change, by function. Do not read Jjodel's board, the discovery report or earlier prompts. Run tests with `--test-reporter=dot` and print only failures. Write a handoff at 120k.

## Context

Slices 1-6 are merged on trunk (last merge `1aa42cc25`, 160 tests, parity with Jjodel's board ok). The chat decided to close v0 now, labelled honestly as validated on the author's repositories with the external pilot pending, and to run the Sprotty pilot as v0.1. Measured by the chat:

- `~/harness-book`: git repository, 33 commits, one Claude Code session (2026-10-13).
- `~/harness-exp/sprotty`: clean clone of `eclipse-sprotty/sprotty`, 563 commits, **no** Claude Code session yet.
- The tracer-scaffold folder no longer exists (its single session is a path-gone case already covered by slice 3); it is not a test target.
- `tack repos` pads the toplevels column to tens of thousands of characters on the real store.
- `cleanupPeriodDays` is now 365 in the user's Claude Code settings (done by the chat; do not touch that file).

## COSA

1. **Fix `tack repos` output.** The toplevels column must be bounded: one line per repository, toplevels truncated with a count (`/Users/x/repo +3 more`), widths computed from visible content and capped at 60 characters per column. Unit test with a repository having 40 toplevels and one having a 300-character path.
2. **Seed the Sprotty clone with two real sessions.** From `~/harness-exp/sprotty`, run two short headless Claude Code sessions, read-only, each with a fixed question about the codebase (for example: «Which package defines the SModel root and how is it registered?» and «List the npm workspaces and what each one builds.»): `claude -p "<question>" --model sonnet --allowedTools "Read Grep Glob"`. No file written in the clone (`git status --porcelain` empty before and after). If `claude -p` cannot run from inside the lane, skip this item, say why in the entry, and close v0 on `harness-book` alone.
3. **First-run check, no flag, fresh store.** For each of `~/harness-book` and `~/harness-exp/sprotty`: with `TACK_STORE` (or the existing equivalent; check the README) pointing to `/tmp/tack-s7/<name>.db` so that `~/.tack/store.db` is untouched, run `tack board --no-open --port 4711` **from the repository root** with no other flag, then call `/api/repos`, `/api/sessions`, `/api/metrics` with `curl`, then stop the server. Record per repository: preselected repository, sessions found, cost known and unknown, which metrics are `not-adopted` (expected: every layer-2/3 metric, since neither repository has unit ids or a lane folder), and `git status --porcelain` identical before and after. If the board needs a flag or writes a file in the repository, stop with `Outcome: question`.
4. **README.** Add an «Install and first run» section (requirements: Node >= 24; run from a clone with `node tack/bin/tack.mjs board`; what the user sees on a repository with no conventions), a «Status» line stating exactly: `v0: validated on the author's repositories (Jjodel, harness-book, a Sprotty clone with headless sessions); external pilot pending.`, and the list of layers with what each requires. English, no em dash.
5. **Version.** Set `"version": "0.1.0"` in `tack/package.json` and make `tack --version` print it (test).

## DOVE

`tack/**`, `docs/log-inbox/tack.md` (one entry), this prompt's `Status:` line. Store files only under `/tmp/tack-s7/`. Two Claude Code sessions in `~/harness-exp/sprotty` (transcripts are written by Claude Code under `~/.claude/projects/`, which is expected). Nothing else.

## Gates

`cd tack && ~/.local/bin/node --test` green, privacy tests included; the first-run table of item 3 complete for both repositories; `check:docs` after the commits (from `frontend/`).

## Commits (P13, RC-17), explicit pathspecs, no push

1. `feat(tack): v0.1.0, bounded repos output, install section (P-2026-10-19-2100)` with `tack/**`. Trailer `Model:` (P6).
2. `docs: Status flip and log entry for Tack slice 7 (P-2026-10-19-2100)` with the entry (first-run table, sessions seeded, tests) and the Status line.

## NON FARE

No new metric, view or collector. No change outside `tack/` and the two docs. No file written in `~/harness-book` or `~/harness-exp/sprotty`. Do not touch the board on port 4710 or `~/.tack/store.db`. Do not create a git tag (the chat tags after the merge). No message text, subject, author or path in the entry beyond repository toplevels. No push.

## HARD STOP

None planned: close with `Outcome: done`, or `Outcome: question` as in item 3.

## RIFERIMENTI

- `tack/README.md`, `tack/bin/tack.mjs`, `tack/src/board/server.mjs`
- `docs/log-inbox/tack.md` (slice 6 entry)
