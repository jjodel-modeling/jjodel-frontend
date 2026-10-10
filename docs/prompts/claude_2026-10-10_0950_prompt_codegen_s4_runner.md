# Code generation S4: JavaScript target profile and the sandboxed runner

Prompt-ID: P-2026-10-10-0950
Chat: C-2026-10-10-0046
Lane: full (new target profile and the first worker sandbox of the codebase; differential test against the JjEL
evaluator). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead (none needed,
discovery §I.3).
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-codegen-runner`, branch `codegen-runner`, cut from the trunk tip that carries the docs commit
adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and
a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-0950 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)

Contract: `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md` §6 and §8, R-GEN-6 and R-GEN-11 in
`docs/decisions.md`. Evidence: `docs/discovery/discovery_2026-10-10_code_generation_pilot.md`, read §F (all), §G.2,
§G.3, §G.4, §I.4 (row S4) and U6 in the table of unattended decisions.

In short:
- A target profile has three parts: an identifier policy whose mangling keeps an invertible table, an expression
  and action printer for the translatable JjEL subset, and a runner (R-GEN-6).
- The subset lives in code as a blacklist walker, `checkGuardSubset` (`frontend/src/model/simulation/subsetChecker.ts:387`),
  exhaustive over the 22 AST node kinds. The printer is a second exhaustive walker with the same skeleton: it
  refuses every node that `checkGuardSubset` marks `error` or `not-verifiable` and prints the rest, folding
  navigation on the frozen model to constants as `judgeActionTarget` does (`actionEvaluator.ts:165-177`).
- Semantics the printed code must reproduce: `and` and `or` evaluate both operands (`jjel/evaluator/evaluator.ts:347-351`,
  `:277-278`), so never print a short-circuit that skips a side effect or a throw; `/` and `%` by zero return
  null (`:315`, `:322`); `+` concatenates when either side is a string (`:287-288`); `==` is structural.
- Actions are `<target>.[attr] := <expr>` parsed by `parseAction`; their semantics is parallel assignment on σ,
  so the printer evaluates every right-hand side on the old state before writing `next`.
- There is no worker in `frontend/src` except Monaco's; there is no CSP and no COOP/COEP in the repo
  (`nginx-standalone.conf:13-15`). `frontend/vitest.config.ts:14` runs in `node`, with no `Worker`.
- The generated program for a state-based language exports `initial()`, `step(state, event, selector, inputs)`
  and `observe(state)` (R-GEN-11). The runner does not depend on that shape: it loads one module and runs a
  sequence of calls to its exports.

## WHAT

1. **Tests first**, run on the base commit to record that they fail.
   - Printer: one test per accepted node kind and one per refused construct, with the refusal code.
   - **Differential property test**: for random σ over bounded domains (booleans, integers in a small range,
     enumeration literals, null) and a corpus of guards and actions taken from the simulator's fixtures plus
     generated ones, the printed JavaScript evaluated on σ equals the JjEL evaluator on the same guard and
     context, including the cases of null, division by zero, mixed `+` and both sides of `and`/`or`. Seeded,
     so a failure reproduces.
   - Identifier policy: JavaScript reserved words, invalid characters, leading digits, collisions between two
     model names that mangle to the same identifier, and a table that is invertible on every generated name.
   - Runner protocol with a fake worker in vitest: a sequence of calls, a result per call, a runtime error carrying
     the generated line and column, the timeout path calling `terminate()`.
2. **Modules**, all new:
   - `frontend/src/codegen/target/js/identifiers.ts`: the identifier policy and its table.
   - `frontend/src/codegen/target/js/printer.ts`: `printGuard(expr, ctx)` and `printActions(actions, ctx)`, with
     typed refusals; state reads through `.[x]` become reads on the state object of R-GEN-11.
   - `frontend/src/codegen/runner/protocol.ts`: the message types, for example
     `{code, calls: [{fn, args}], timeoutMs}` in and `{ok, results} | {ok: false, error: {message, line, column}}` out.
   - `frontend/src/codegen/runner/runner.worker.ts`: captures `postMessage`, then deletes or shadows `fetch`,
     `XMLHttpRequest`, `WebSocket`, `EventSource`, `importScripts`, `WebTransport`, `BroadcastChannel` and
     `indexedDB` on `self` and its prototype chain, then loads the code and runs the calls.
   - `frontend/src/codegen/runner/runner.ts`: `new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' })`,
     one worker per run, `terminate()` at `timeoutMs` (default 2000), the generated line and column of a runtime
     error measured and returned.
3. **Probe** `frontend/scripts/probe/codegen-runner.ts`, run with `lane-run probe` on a free port between 3080 and
   3099 (never 3001): in a real browser a run returns its results, a `while (true) {}` is terminated at the
   timeout, `typeof fetch` inside the worker is `'undefined'`, and a thrown error reports the right generated line.
   The probe imports the runner through a tiny dev-only page or `page.evaluate` with a dynamic import; it adds no
   route to the app.
4. **Gates.** `npx tsc --noEmit` (same error set as base), the new tests, the `src/codegen`, `src/jjel` and
   `src/model/simulation` suites with base counts plus the new ones, `npm run build` (the worker must appear as its
   own asset and only under `src/codegen/`), the probe. Gates in the foreground; above a load average of 20, wait
   and rerun before calling a red real.
5. **Mutation bench** (P11), listed in the commit body: short-circuit `&&` printed for `and`; `/` printed without
   the null guard; `terminate` removed; network shadowing removed; identifier table not recorded for a collision.
   Survivors are reported, not repaired silently.
6. **Commits.** One `feat(codegen): …` commit with modules, tests and probe; then the log entry, written with the
   `log-entry` skill into `docs/log-inbox/codegen-runner.md`, in a docs commit. Stop with `Outcome: done`. No merge.

## DOVE

`frontend/src/codegen/target/js/{identifiers,printer}.ts`, `frontend/src/codegen/runner/{runner,runner.worker,protocol}.ts`,
tests under `frontend/src/codegen/target/js/__tests__/` and `frontend/src/codegen/runner/__tests__/`, the probe
`frontend/scripts/probe/codegen-runner.ts`, `docs/log-inbox/codegen-runner.md` (all new). Five source files reach
rule 19's threshold; this list is the confirmation.

## NON FARE

- No edit to any existing file: not `subsetChecker.ts`, not `vite.config.ts`, not `vitest.config.ts`, not
  `frontend/src/jjel/`, not `frontend/src/index.tsx`. Import what you need.
- Do not touch `frontend/src/codegen/engine/` (lane P-2026-10-10-0945 creates it in parallel) or
  `frontend/src/codegen/stcAccess.ts`.
- No UI, no setting, no oracle: S5 and S6.
- No CSP or header change (outside the pilot's files; the sandbox is declared best effort, U6).
- No dependency, no `git add .`, no `git stash`, no push.

## RIFERIMENTI

- Spec §6, §8; R-GEN-6, R-GEN-11; discovery §F, §G, §I.1 (row S4), §I.4.
- `docs/spec/claude_spec_2026-09-13_computational_model.md` (translatable subset, parallel assignment).
- `CLAUDE.md` §5, §21; `docs/PROTOCOL.md` P9, P11, P13, P14, P16.
