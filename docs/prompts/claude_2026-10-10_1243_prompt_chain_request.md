# lane-run chain forwards --request to every lane it starts

Prompt-ID: P-2026-10-10-1243
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: fast (one source file, `frontend/scripts/lane-run.mjs`, plus its existing test file; design fixed by RC-43)
Depends: P-2026-10-10-1150
Status: eseguito 2026-10-10, lane P-2026-10-10-1243 (chain-request, f552d0e00), merged 829073426; no visual check (harness script)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-chainreq`, branch `chain-request`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1243 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)
RC-43 (lane P-2026-10-10-1150, merged `49b31da4a`) gave `lane-run start` the option `--request <file>`: it
copies the file into the lane folder as `request.md` before the session starts, and refuses a missing or empty
file. `chain` (`lane-run.mjs:1913`, run by `chainRun` at `:1998`) was left unchanged on purpose. Every lane of a
chain answers the one request that made the chat open the chain, so the chain must carry it. The 1150 session
recommended the shape below, and the chat adopts it.

## WHAT
1. `chain` accepts `--request <file>`. It validates the file once, with the same refusals as `start` (missing,
   empty, no value), before any lane starts, and keeps a copy as `request.md` in the chain folder.
2. `chainRun` passes `--request <chain folder>/request.md` to every `start` it makes, the first lane included, so
   each lane folder gets its own `request.md`. The merge lane launched by `--merge-after` gets none: merge prompts
   are exempt under RC-43.
3. A chain started without `--request` behaves exactly as today; each `start` keeps its own warning when a prompt
   has no `Request:` line.
4. Update the usage comment at the top of the file (`:153`) and the `usage` string (`:1915`).
5. Tests, in the existing lane-run test file (the 1150 lane ran the `laneRun` suite with a fake `claude` in a
   throwaway HOME; reuse that harness): a chain of two prompts with `--request` leaves the same `request.md` in
   the chain folder and in both lane folders; a missing file refuses before any lane starts; a chain without
   `--request` leaves no `request.md`. Run the new cases on the base commit first and record that they fail.
6. Gates: `node --check frontend/scripts/lane-run.mjs`, the lane-run test suites, `npm run check:scripts` from
   `frontend/`. Do not start a real session.
7. One code commit with an explicit pathspec, `feat(harness): chain forwards --request to its lanes (RC-43)`, then
   the log entry in `docs/log-inbox/harness.md`, uncommitted (RC-17), then stop with `Outcome: done`. No merge.

## DO NOT
- Touch `start`, `resume`, `merge`, `go`, the lane board or `docs/PROTOCOL.md`.
- Commit any `request.md` or write Alfonso's words into a committed file.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13 (the `Request:` bullet), P14, P16; RC-17, RC-43.
