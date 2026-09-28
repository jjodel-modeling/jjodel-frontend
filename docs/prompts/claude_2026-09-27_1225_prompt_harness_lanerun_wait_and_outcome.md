# Prompt: lane-run v2, two tickets from first use: the Outcome of a running lane, the exit code of `wait` at the deadline

Prompt-ID: P-2026-09-27-1225
Chat: C-2026-09-27-1140
Lane: fast (one script and its test, P16 paragraph; no frontend code, no critical zone; no visual check)
Status: eseguito 2026-09-27 · lane harness-lanerun-wait · e3c95ce23

Worktree: `~/jjodel-icons`, branch `harness-lanerun-wait` (cut by the chat from `alfonso-frontend-jjtl` at `097696d88`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-icons`, branch `harness-lanerun-wait`, `git log -1` is the commit that adds this file (its parent `097696d88`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1225 · session <id>]` and ends with a bare `Outcome:` line, the shas on the line above. Run gates in the foreground.

## COSA

Two defects of `lane-run` v2 (P-2026-09-27-1035), both measured by the chat on 2026-09-27 (session checkpoint, «Harness (lane-run v2, found on first use)»):

1. **The Outcome of a running lane.** `lastOutcome` reads the whole log, so a lane resumed after a `blocked` or a `question` shows that old outcome in `status` and `status --all` while its new turn is still running (measured on R2, P-2026-09-27-1110: `blocked` printed for twenty minutes of a running resume). Rule: an `Outcome:` line is the result of a turn, so it is reported only when the lane is not running. `laneState` returns `outcome: null` whenever `running` is true (state `running` or `blocked` by the limit); `status` then prints `outcome: none` and `status --all` prints `none`, as for a lane that never wrote one. An exited lane keeps today's behaviour: the last `Outcome:` line of the log, parsed or `unparsed: <line>`. No change to the log format, to `resume`, or to the `OUTCOME` regex.

2. **`wait` at the deadline.** `waitLanes` returns 3 on timeout, and an osascript `do shell script` turns any non-zero exit into an error, so the chat loses the output of the call that matters most (measured on every `wait --max 55` of the morning; the workaround `|| true` hides real failures too). Rule: a deadline is a normal end of a poll, not a failure. `wait` exits 0 at the deadline with the line `timeout: <ids> still running after <max> s` unchanged, so the chat reads the line; the other exits are unchanged (0 with the status when a lane ends, 2 on a refusal, the usage refusal included). Document it in the usage header of the script and in `docs/PROTOCOL.md` P16 (the `wait` bullet reads «exit 0 with the status when a lane ends, 3 at the deadline»: it becomes «exit 0 both when a lane ends, with its status, and at the deadline, with a `timeout:` line»).

## DOVE

- `frontend/scripts/lane-run.mjs`: `laneState` (outcome gated on `running`), `waitLanes` (return 0 on timeout), the usage comment at the top for `wait`. No other function.
- `frontend/scripts/hooks/__tests__/laneRun.test.ts`: in `lane-run status` and `lane-run status --all`, a running lane whose log holds an earlier `Outcome: blocked` line reads `none` (today's fixture at lines 836-852 lists a running lane with `none` and an exited one with `unparsed`: add the resumed case, keep those); in `lane-run wait`, the deadline case asserts exit 0 and the `timeout:` line (today it asserts 3, if it does: flip it).
- `docs/PROTOCOL.md`: the `wait` bullet of P16 (around line 396). One sentence, no other line.
- `docs/log-inbox/harness.md`: one entry. This prompt's Status flip.

Out of scope: `docs-digest.ts` (the digest names the last commit that changed the register on purpose, README line 17: not a defect), `merge`, `probe`, `go`, the hooks, anything under `frontend/src/`, `docs/decisions.md`.

## COME

1. Baseline from `frontend/`: `npx vitest run scripts/hooks/__tests__/laneRun.test.ts` count, 0 failed; `check:scripts` PASS.
2. Tests first, red, then the two edits, minimal diffs, no rename.
3. Mutation bench, table in the commit body, a survivor is a stop: (1) the outcome gated on `exited` instead of `running` (a lane whose process died without `exit.txt` must still show its outcome); (2) `wait` returning 0 at the deadline without printing the `timeout:` line; (3) the outcome of an exited lane dropped.
4. Gates: the lane-run test file green with the new count; `check:scripts` PASS; `check:docs` 4/4; `typecheck:scripts` green (the `_tmp_*` exclusion of 0405 holds).
5. Two commits, pathspec after `--`: code, subject `fix(harness): lane-run hides the Outcome of a running lane, wait exits 0 at the deadline (P-2026-09-27-1225)` or, if over 72 once the Prompt-ID is dropped, `fix(harness): lane-run Outcome while running, wait exit code (P-2026-09-27-1225)`, body with the two measurements, the mutant table, `Model:` trailer; docs, the P16 sentence, the inbox entry and the Status flip `eseguito 2026-09-27 · lane harness-lanerun-wait · <code sha>`, subject `docs: close the lane-run wait and Outcome tickets (P-2026-09-27-1225)`.
6. `Outcome: done`, shas on the line above.

Stop with `Outcome: question` and a `Recommended:` line only if the test lab cannot fake a running lane with an older `Outcome:` line in its log without a new fixture helper of more than twenty lines.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, any other tree. Do not run `lane-run` against `~/.jjodel-lanes` (the real lanes): the tests use their own state root.

## RIFERIMENTI

- `frontend/scripts/lane-run.mjs` lines 352-456 (`lastOutcome`, `laneState`, `status`, `statusAll`, `waitLanes`), header lines 30-90.
- `frontend/scripts/hooks/__tests__/laneRun.test.ts` `describe('lane-run status --all')` and `describe('lane-run wait')`.
- `docs/PROTOCOL.md` P16, the lane-run v2 paragraph (P-2026-09-27-1035); `docs/digest/README.md` line 17 for the digest header, left as it is.
- RC-17, RC-20, RC-25..29.
