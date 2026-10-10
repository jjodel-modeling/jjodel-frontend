# Code generation S5b: run timeout starts when the worker is ready; long output lines scroll visibly

Prompt-ID: P-2026-10-10-2027
Chat: C-2026-10-10-0046
Lane: fast (two follow-ups of S5, five files at most, one visual check). Model: the default of
`.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: P-2026-10-10-1825
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-codegen-fix`, branch `codegen-fix`, cut from the trunk tip that carries the S5 merge; the
branch carries the docs commit adding this prompt. `frontend/node_modules` symlinked (P14). Before anything else:
`pwd`, branch, `git log -1`, a clean `git status`, and `frontend/src/codegen/ui/CodePanel.tsx` present. Otherwise
stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-2027 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)

S5 (`P-2026-10-10-1825`, log `docs/log-inbox/codegen-panel.md`) passed its visual check with two follow-ups, and S4
(`P-2026-10-10-0950`, log `docs/log-inbox/codegen-runner.md`) left a ticket on the first one.

1. **Worker start counts against the run timeout.** The S5 probe had to give the first «Run» of each module 60000 ms,
   because the timeout starts when the worker is created, and in dev Vite compiles the worker on first use. With the
   panel's default of 2000 ms a student's first run can time out on a correct program.
2. **Long output lines are clipped.** In the run-error crop, lines 4-6 of the generated code are cut at the right
   edge with no visible horizontal scroll affordance.

## WHAT

1. **Tests first** (vitest, fake worker as in S4's runner tests): a worker that becomes ready after a delay longer
   than `timeoutMs` and then runs a fast program succeeds; a worker that is ready at once and then loops is
   terminated at `timeoutMs` measured from readiness; a worker that never becomes ready is terminated by a separate
   start-up bound (say 30000 ms, a constant documented in `protocol.ts`) with an error that says the runner did not
   start, not that the program timed out. Record that the first case fails on the base commit.
2. **Runner** (`frontend/src/codegen/runner/{protocol,runner,runner.worker}.ts`): the worker posts a `ready` message
   after the network shadowing and before evaluating anything; the main thread starts the program timeout on
   `ready`, and the start-up bound before it.
3. **Panel** (`frontend/src/codegen/ui/CodePanel.tsx` and/or `CodePanel.scss`): the output keeps one line per
   generated line (no wrapping, because line numbers and runtime errors refer to generated lines), the code area
   scrolls horizontally with a visible scrollbar, the gutter stays fixed while scrolling, and the error line
   highlight spans the full scrolled width. Existing tokens only.
4. **Probe**: rerun `frontend/scripts/probe/codegen-panel.ts` with the first Run back at the panel default (no
   60000 ms override), on a free port between 3080 and 3099; all its checks green. Add one check: the run-error
   module's widest line is reachable by scrolling (`scrollWidth > clientWidth` and the last character visible
   after `scrollLeft = scrollWidth`).
5. **Crops** for the chat's RC-23 check, light theme: the run-error state scrolled to the left edge and to the right
   edge. Save them in the lane folder's `crops/`.
6. **Gates**: `npx tsc --noEmit` (same set as base), `src/codegen` suite, `npm run build`, `npm run
   check:codegen-lazy`, the probe. Mutation bench (P11), in the commit body: timeout started at creation instead of
   at `ready`; start-up bound removed; `overflow-x` reverted. Survivors are reported.
7. **Commits**: one `fix(codegen): …` commit, then the log entry with the `log-entry` skill into
   `docs/log-inbox/codegen-fix.md` in a docs commit. Stop with `Outcome: hard-stop` after the crops. No merge.

## DOVE

`frontend/src/codegen/runner/{protocol,runner,runner.worker}.ts`, their tests under
`frontend/src/codegen/runner/__tests__/`, `frontend/src/codegen/ui/CodePanel.tsx`, `frontend/src/codegen/ui/CodePanel.scss`,
`frontend/scripts/probe/codegen-panel.ts`, `docs/log-inbox/codegen-fix.md`.

## NON FARE

- No change to `EditorV2.tsx` (the Backspace-in-textarea ticket from S5 is a separate lane).
- No change to the engine, the printer or `stcAccess.ts`.
- No dependency, no `git add .`, no `git stash`, no push.

## RIFERIMENTI

- S4 and S5 log entries; spec §6; R-GEN-6.
- `CLAUDE.md` §5, §21; `docs/PROTOCOL.md` P8, P9, P11, P13, P14, P16.
