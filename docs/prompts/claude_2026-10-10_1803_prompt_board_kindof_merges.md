# Lane board: kindOf classifies "full (two merges in sequence…)" as merge

Prompt-ID: P-2026-10-10-1803
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: fast (one function in `frontend/scripts/lane-board/lane-board.mjs`; cause measured)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-kindof`, branch `board-kindof-merges`, cut from the trunk tip `45ad56bd6`; the docs commit
adding this prompt is the first commit on the branch, `frontend/node_modules` symlinked (P14). Before anything
else: `pwd`, branch, `git log -2` and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1803 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)
`kindOf()` (`lane-board.mjs:77-85`) returns `merge` when the Lane line matches `^merge|^full \((merge|take[- ]trunk)\b`
or the file name is a merge prompt. One prompt in `docs/prompts/` reads `Lane: full (two merges in sequence, trunk
code moved)` and is classified `phase2`. Every other `full (... merge ...)` variant on disk starts with `merge`
(`full (merge; ...)`, `full (merge of the trunk into the branch; ...)`) and is already right.

## WHAT
1. Extend the merge test so that a Lane line whose parenthesis opens with a count word or number followed by
   `merge` or `merges` (`full (two merges ...`, `full (2 merges ...`) is `merge`. Nothing else changes class.
2. Prove it on the real corpus: before and after the change, classify every `Lane:` line of `docs/prompts/*.md`
   and report the lines whose class changed. Exactly the one prompt above should move, from `phase2` to `merge`.
3. If a test file already covers `kindOf`, add the case there; otherwise do not create one for a single regex.
4. Checks: `node --check frontend/scripts/lane-board/lane-board.mjs`; `npm run check:scripts` from `frontend/`.
5. One code commit with an explicit pathspec, `fix(harness): lane board counts a two-merge lane as a merge`, then
   the log entry in `docs/log-inbox/harness.md`, uncommitted (RC-17), then stop with `Outcome: done`. No merge,
   no board on any port.

## DO NOT
- Touch any other function, `timeline.js`, `insights.js` or `lane-run.mjs`.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17.
