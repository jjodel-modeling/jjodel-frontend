# req-trace.mjs on the trunk, verbatim from harness-req-tab

Prompt-ID: P-2026-10-10-2022
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: fast (two new files copied verbatim, outside the critical zone, no caller yet)
Depends: P-2026-10-10-1806
Status: eseguito 2026-10-10, lane P-2026-10-10-2022 (req-trace-port, 14461b2bd); no visual check (script without UI)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-reqtrace`, branch `req-trace-port`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-2022 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: a question with one recommendation inside this lane's perimeter is answered as recommended (RC-21).
Two lanes run beside this one (P-2026-10-10-2020 on lane-run, P-2026-10-10-2021 on the board); their files are
disjoint from yours (RC-22).

## Context (measured, do not redo the analysis)
Discovery `docs/discovery/discovery_2026-10-10_board_req_tab_port.md` (lane P-2026-10-10-1806) inventoried what the
unmerged branch `harness-req-tab` still adds to the trunk. Alfonso approved its port plan in chat. This lane is slice
**S3** (§7): `req-trace.mjs`, the script the future Requirements tab (S5) will spawn. Read §6 and the
`reqTrace.test.ts` row of §5. The script is standalone: pure `node:*`, no import from the board, inputs read from the
working tree of `--repo`, git index cached under `<tmpdir>/jjodel-req-trace/`. The branch tip is preserved by the tag
`archive/harness-req-tab-2026-10-10` (`35240a582`).

## WHAT
1. Copy verbatim: `git show 35240a582:frontend/scripts/req-trace.mjs > frontend/scripts/req-trace.mjs` and
   `git show 35240a582:frontend/scripts/hooks/__tests__/reqTrace.test.ts > frontend/scripts/hooks/__tests__/reqTrace.test.ts`.
   Keep the executable bit as it is on the branch. Change a line only when a test fails on the trunk; report each such
   change with its reason.
2. **Probe** against today's trunk: `node frontend/scripts/req-trace.mjs --repo ~/jjodel-w-reqtrace --trunk alfonso-frontend-jjtl --no-cache`.
   Report exit code, wall time, output size, and the counts beside the §6 figures (rows 501, realized 294, ratified
   422, provisional 73, superseded 6, clusters 17, modularity 0.726, unclustered 14.4 %, 612 opposing pairs, 9 rows
   realized after the last milestone). Explain any difference by a count you measure (for example new `R-` rows in
   `docs/decisions.md` since `834152b68`), not by conjecture.
3. **Mutation check.** The branch recorded 23 of 23 killed. Re-run at least 8 of those mutation points (or 8 of your
   own over the parser, the realized join, Louvain and the pipe drain), one at a time and reverted; report each.
4. **Gates.** `node --check frontend/scripts/req-trace.mjs`; the `reqTrace` suite; `npm run check:scripts` from
   `frontend/`. If `check:scripts` names its files explicitly and omits `req-trace.mjs`, say so and do not edit
   `package.json`.
5. **Commits.** One code commit with an explicit pathspec of the two files,
   `feat(harness): req-trace builds the requirements index from decisions, prompts and trunk history`. Then the log
   entry in `docs/log-inbox/harness.md`, uncommitted (RC-17), and stop with `Outcome: done`. No merge.

## DO NOT
- Touch the lane board, `lane-run.mjs`, `lane-tracking.mjs`, `package.json`, `docs/decisions.md` or `docs/goals/`.
- Write anything inside the repo from the probe: its cache lives under the system temp dir, and `--no-cache` skips it.
- Delete or move the branches `harness-req-tab`, `harness-board-progress` or their worktrees (RC-26).
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- Discovery `docs/discovery/discovery_2026-10-10_board_req_tab_port.md` §5, §6, §7 S3.
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-21, RC-22.
