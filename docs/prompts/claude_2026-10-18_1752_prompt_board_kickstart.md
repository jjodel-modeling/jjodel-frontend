# Merge into trunk: restart the lane board when the merge touches it

Prompt-ID: P-2026-10-18-1752
Chat: C-2026-10-18-1750
Front: harness
Lane: fast (a closure step in `lane-run merge`, its template and its test; governance code, launched heavy)
Status: eseguito 2026-10-18 · lane harness · e4eaba0f1
Request: the lane status chat, 2026-10-18 17:40: the Kind badge of P-2026-10-18-1428 did not show on 4700 because the board had been running since 13:05; restarted by hand at 17:38
Depends: —
Corregge: —

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (fast lane, check inline in the entry). P8 does not apply, no UI.

Worktree: `~/jjodel-w-boardkick`, branch `board-kickstart`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1`, `git status` match; otherwise `Outcome: blocked`.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), launched with `--tier heavy` (`lane-run.mjs`, governance; not an RC-45 draw).

## Lane discipline

Every reply opens with `[P-2026-10-18-1752 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) outside the RC-26 list. Time limit 60 minutes. Tests through `run-quiet.mjs`; read `lane-run.mjs` with Read and `offset`/`limit`.

## Context (do not redo the analysis)

The shared board is the launchd agent `io.jjodel.lane-board` (`~/Library/LaunchAgents/io.jjodel.lane-board.plist`), which runs `/Users/alfonso/jjodel-release/frontend/scripts/lane-board/lane-board.mjs`, the trunk's worktree, and keeps the module it loaded until restarted (`README.md` of the board: `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`). Merges into the trunk run two ways: a session following `lane-templates/merge-into-trunk.md`, or `lane-run merge --direct`, which runs mechanically in `directRun` (`lane-run.mjs:2465` on) and never reads the template. Today's merges were direct (P-2026-10-18-1457, 1502, 1516).

## COSA

1. **Direct merges.** In `directRun`, after the merge commit has passed every gate and before the closure, when `git diff --name-only <pre-merge tip> HEAD -- frontend/scripts/lane-board/` lists a file: read the plist's `ProgramArguments`; if its script path lies inside this merge's worktree, run the kickstart and wait up to 30 s for `http://localhost:4700/api` to answer 200. Record in `result.json` a `board` field: `restarted` (with the seconds), `not-running-here` (the plist runs another checkout; name it), `no-agent` (no plist, e.g. another machine) or `failed` (the stderr line). Never fail the merge for it; print one line. The launchctl call and the probe go through injectable functions, so the tests never touch the real agent.
2. **Session merges.** In `merge-into-trunk.md`, at the start of step 7, one sentence with the same rule: if `git diff --name-only {{trunkTip}} HEAD -- frontend/scripts/lane-board/` lists a file, run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that 4700 answers, and report the line. Use only variables the template already has.

## DOVE

`frontend/scripts/lane-run.mjs`, `frontend/scripts/lane-templates/merge-into-trunk.md`, `frontend/scripts/hooks/__tests__/laneRunDirect.test.ts`. Anything else: stop and ask with a recommendation.

## Checks

Tests first in `laneRunDirect.test.ts`: the four `board` values, and no call at all when the diff does not touch the board. `scripts/hooks` suite green at its count plus the new tests; `typecheck:scripts` 0; `check:scripts` PASS; `check:triggers` PASS; `check:docs` PASS on the docs commit. One docs commit with the Status flip and the P9 entry in `docs/log-inbox/harness.md`, then `Outcome: done`.

## NON FARE

No restart of the real agent from this lane; no change to the plist, to the board, or to `trunk-into-branch.md`.
