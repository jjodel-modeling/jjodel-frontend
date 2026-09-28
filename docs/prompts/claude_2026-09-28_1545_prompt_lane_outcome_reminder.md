# Prompt: lane-run appends the RC-20 closing line to every input it sends to a lane

Prompt-ID: P-2026-09-28-1545
Chat: C-2026-09-28-1120
Lane: fast (scripts only, one module and its tests; no discovery). Tier: light.
Status: da eseguire

Worktree: `~/jjodel-w-outcome`, branch `lane-outcome-reminder` (cut by the chat from `alfonso-frontend-jjtl` after the merge of `harness-trace`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-outcome`, branch `lane-outcome-reminder`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

On 2026-09-28 three lane sessions closed without a valid RC-20 line: P-2026-09-28-1015 wrote `Outcome: completed`, P-2026-09-28-0100 and P-2026-09-28-0034 wrote none. `status` then reads `unparsed` or `none`, and `chain` stops. The sentence added to `CLAUDE.md` §21.2 the same morning (`65eb5475b`) did not prevent the two later cases. The rule has to travel with every input, not wait to be read.

Goal: every text that `lane-run` sends to a lane session on stdin (the prompt at `start`, a `resume` message, the GO of `go`, the prompts of `chain` and of `merge --launch`) ends with the same closing reminder, so the last thing the session reads is the closing contract.

## DOVE

- `frontend/scripts/lane-run.mjs`: the input path before `launch()` (see the `WRAPPER`, `launch()`, `start`, `resume`, `go`, `chainRun`, `merge`), and the copy of each input into the lane folder that `ee84361f3` added.
- `frontend/scripts/hooks/__tests__/laneRun.test.ts`.
- Closure: `docs/log-inbox/harness.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (§6, §21.2, rule 19), `docs/PROTOCOL.md` P16 and the RC-20/RC-21 paragraph, and `lane-run.mjs` from the usage block to `main`.
2. Tests first (red before, green after), in `laneRun.test.ts`: for `start`, `resume` (a message file and `--text`), `go` and `chain`, the text on the fake claude's stdin ends with the reminder exactly once; the committed prompt file in the worktree is byte-identical after `start`; the copy kept in the lane folder is the text actually sent (with the reminder); a resume message that already ends with the reminder does not get it twice.
3. The change: one exported-nowhere constant, e.g. `CLOSE_REMINDER`, whose text is exactly:

   ```
   ---
   Close your final message (hard stop, question, closing report) with one line `Outcome: done | hard-stop | question | blocked`: exactly one of those four words, nothing else on that line (RC-20). A question with a recommendation also carries one line `Recommended: <one line>` (RC-21). The `**Outcome**` field of a log entry is not this line.
   ```

   and one function that returns the input text plus the reminder, used at the single point where the stdin file is written. Never write into the prompt file of the worktree. Grep the name before introducing it. No other behaviour changes; do not touch the `OUTCOME` regex or `lastOutcome()`.
4. Gates: `typecheck:scripts` exit 0; the vitest of `scripts/hooks` and `scripts/gates` green (state the counts before and after); `check:docs`; `check:scripts`. A mutation bench on the new code, as the harness lanes do.
5. Commits: `feat(harness): lane-run ends every lane input with the RC-20 closing line (P-2026-09-28-1545)`, then one docs commit with the log entry in `docs/log-inbox/harness.md` and this prompt's Status. Do not edit `docs/PROTOCOL.md` or `CLAUDE.md` (governance: the chat adds the P16 line on the trunk).
6. Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the test counts.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-28_lane_outcome_parser.md` (the parser is right; the cause is the missing contract at the input).
- `docs/PROTOCOL.md` P16, RC-20, RC-21; `CLAUDE.md` §21.2 (the sentence of `65eb5475b`).
- The three lanes: `~/.jjodel-lanes/P-2026-09-28-1015/`, `P-2026-09-28-0100/`, `P-2026-09-28-0034/`.
