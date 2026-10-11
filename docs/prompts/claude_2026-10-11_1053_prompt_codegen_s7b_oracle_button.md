# Code generation S7b: the oracle in the Code panel

Prompt-ID: P-2026-10-11-1053
Chat: C-2026-10-10-0046
Lane: full (one control and one result view in the Code panel over the S6 oracle; a visual check). Model: the default
of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: P-2026-10-10-2029, P-2026-10-10-2027, P-2026-10-11-1105
Front: codegen-pilot
Request: https://claude.ai/code/session_01QYGEHstF7K66SVXwe8L7ep
Status: eseguito 2026-10-11 · lane codegen-check · code f32d5d94b · log db3981425 · tsc 14 = base, vitest src/codegen 301 (284 + 17), build exit 0, check:codegen-lazy green, probes codegen-check 43/43, S5/S5b 46/46, S6 29/29, mutation bench 4/4 · visual check passata 2026-10-11 (RC-23 by the chat on 3 crops, GO by Alfonso 12:35)
Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-codegen-check`, branch `codegen-check`, cut from the trunk tip that carries S1..S6, the S5b
fixes and the fix of P-2026-10-11-1105; the branch carries the docs commit adding this prompt. `frontend/node_modules` symlinked (P14). Before
anything else: `pwd`, branch, `git log -1`, a clean `git status`, and `frontend/src/codegen/oracle/oracle.ts`,
`frontend/src/codegen/ui/CodePanel.tsx`, `frontend/src/codegen/runner/protocol.ts` present. Otherwise stop with
`Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-11-1053 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)

Contract: spec `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md` §8; **R-GEN-11**, **R-GEN-17** in
`docs/decisions.md`. Read the log entries of S5, S5b and S6 in `docs/log-inbox/codegen-*.md` first.

- S6 built `runOracle(input: OracleInput): Promise<OracleResult>` in `frontend/src/codegen/oracle/oracle.ts`. It needs
  `lookup`, `modelId`, `globals` (the `buildEvalContext` record), a `ScenarioRecord`, the generated `code` and its
  `map`; it never rejects. Its result is a verdict (`ok: true`, or the first divergence: `step`, `kind`
  (`'kind' | 'observe' | 'error' | 'length'`), expected and actual, transition id, origin from the map) or a failure
  (`model`, `scenario`, `run`, with message and, for `run`, the line).
- The only caller today is the probe hook `window.__jjodelOracle` (`hookRun`, same file), which rebuilds `globals`
  with a copy of `simBridge.ts`'s `evalContextFor` and reads the model's stored scenarios from
  `_state[RUN_SCENARIOS_KEY]` with `decodeScenarios`.
- The Code panel (`ui/CodePanel.tsx`) already builds `globals` with `buildEvalContext` for «Generate», keeps the last
  generation's `code` and `map`, and has the «Run» button, the Timeout field and one result area under them, where a
  runtime error shows its message, `line N, column M` and an origin link that selects the element on the canvas
  (S5, S5b).

## WHAT

1. **Tests first**, run on the base commit to record that they fail. A pure helper (no React) that turns an
   `OracleResult` into the panel's view model: pass (`N steps agree`, scenario name), divergence (step, transition
   name, what differed: the two `kind`s, or the attributes or places whose values differ, each with expected and
   actual), failure (message, line when present), and the origin to link when the result carries one. Cover each
   `Divergence` kind and each failure kind.
2. **Control**, in the Output tab, on the row of «Run»: a scenario select listing the model's stored scenarios
   (decoded as `hookRun` does; extract a shared helper inside `oracle/` rather than copying the decoding a second
   time) and a button «Check» (Bootstrap Icons only; `bi-check2-circle` or the closest existing icon in the panel's
   style). «Check» runs `runOracle` with the panel's `globals`, the last generation's `code` and `map`, the selected
   scenario and the Timeout field's value. With no stored scenario the select and the button are disabled and the
   button's tooltip reads `Record a scenario in the simulator first.` With no generation yet, «Check» behaves as
   «Run» does today in that state.
3. **Result**, in the same result area «Run» uses (one area, the last action wins): pass in the panel's success
   colour, one line, `Agrees with the simulator on N steps · <scenario>`; divergence and failure in the error style of
   S5b, with the step, the transition name, the differing values (at most five lines, then `+K more`), and the origin
   link with the same behaviour as the runtime error's link. No layout shift: the row of «Run» keeps its height and
   the result area keeps the S5b sizing and scrolling.
4. **Probe hook**: keep `window.__jjodelOracle` as it is; if the shared helper of point 2 changes `hookRun`, the S6
   probe stays green unchanged.
5. **Probe** `frontend/scripts/probe/codegen-check.ts` on a free port between 3080 and 3099 (never 3001): with the
   setting on, load each lecture example as the S6 probe does, Generate, select the recorded scenario, click «Check»,
   assert the pass line and its step count; then the S6 mutation (swap the target of one transition, through the
   probe hook's `mutate` or by editing a template in the Templates tab, say which), Generate, «Check», assert the
   divergence line names the expected step and transition and that clicking the origin link selects the element.
   Also assert the disabled state on a model without scenarios. Crops, light theme, into the lane folder's `crops/`:
   `check_pass.png`, `check_divergence.png`, `check_disabled.png`.
6. **Gates**: `npx tsc --noEmit` (same set as base), `src/codegen` suites (base counts plus new), `npm run build`,
   `npm run check:codegen-lazy` (nothing of this slice outside the lazy chunk), `typecheck:scripts`,
   `check:scripts`, the S5/S5b and S6 probes unchanged and green, the new probe. Mutation bench (P11), in the commit
   body: the view model reports the step one late; the select ignores the chosen scenario; «Check» passes the default
   timeout instead of the field's; the origin link of a divergence points at the transition's source instead of the
   transition. Survivors are reported.
7. **Commits**: one `feat(codegen): …` commit with code, tests and probe; then the log entry with the `log-entry`
   skill into `docs/log-inbox/codegen-check.md` in a docs commit. Stop with `Outcome: hard-stop` after the crops. No
   merge.

## DOVE

`frontend/src/codegen/ui/{CodePanel.tsx,CodePanel.scss}`, a new view-model module and its test under
`frontend/src/codegen/ui/` or `frontend/src/codegen/oracle/`, the shared scenario helper in
`frontend/src/codegen/oracle/`, `oracle/oracle.ts` only to use that helper,
`frontend/scripts/probe/codegen-check.ts`, `docs/log-inbox/codegen-check.md`. Before adding a CSS class or an
exported name, grep the codebase for it (CLAUDE.md, name collisions).

## NON FARE

- No edit to `frontend/src/codegen/target/`, `frontend/src/codegen/examples/`,
  `oracle/__tests__/exampleFixture.ts` or `frontend/scripts/probe/codegen-oracle.ts` (lane P-2026-10-11-1052 works
  there in parallel), `runner/`, `engine/`, `stcAccess.ts`, `frontend/src/jjel/`, `frontend/src/model/simulation/` or
  `components/editor-v2/sim/`. A gap there stops the lane with `Outcome: question` and a `Recommended:` line.
- No change to `runOracle`'s semantics, to `observe`, or to scenario files; no recording of scenarios from the panel.
- No dependency, no `git add .`, no `git stash`, no push.

## RIFERIMENTI

- Spec §8; R-GEN-11, R-GEN-17; S5, S5b, S6 log entries; S5b crops for the error style.
- `CLAUDE.md` §5, §21 (design tokens, Bootstrap Icons only, no layout shift); `docs/PROTOCOL.md` P8, P9, P11, P13,
  P14, P16.
