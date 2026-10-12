# Code generation: the oracle tests' in-process worker posts `ready` (S5b × S6 on the trunk)

Prompt-ID: P-2026-10-11-1105
Chat: C-2026-10-10-0046
Lane: light (one test helper; no product code, no UI). Model: the default of `.claude/settings.json`, no deviation.
No critical-zone go-ahead.
Depends: P-2026-10-11-1049, P-2026-10-11-1056
Front: codegen-pilot
Status: eseguito 2026-10-11 · lane codegen-ready · code 47a0d95a3 · log 764758224 · src/codegen 284/284, src/model/simulation 692/692, tsc 14 = base, mutation 1/1 killed · no visual check (test helper only)
Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-codegen-ready`, branch `codegen-ready`, cut from the trunk tip `28c9b0aad` (the merge of
`codegen-oracle`, P-2026-10-11-1056) or a later trunk tip; the branch carries the docs commit adding this prompt.
`frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1`, a clean `git status`, and
`frontend/src/codegen/oracle/__tests__/exampleFixture.ts` present. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-11-1105 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)

The two lanes were cut from the same base and merged one after the other with no textual conflict:

- S5b (P-2026-10-10-2027, merged by P-2026-10-11-1049) changed the runner protocol: the worker posts
  `WORKER_READY` once its script has run, and `runInWorker` holds requests and starts the run timeout only at
  `ready` (`runner/protocol.ts`, `runner/runner.ts`; its fake worker in `runner/__tests__/` shows the new contract:
  `readyAfter`, `becomeReady()`, requests queued until ready).
- S6 (P-2026-10-10-2029, merged by P-2026-10-11-1056) added `InProcessWorker` and
  `inProcess = (request) => runInWorker(request, () => new InProcessWorker())` in
  `frontend/src/codegen/oracle/__tests__/exampleFixture.ts`, written against the old protocol: it never posts
  `ready`.

On the merged trunk the five tests of `oracle/__tests__/examples.test.ts` that run the oracle time out at 15000 ms
(`runInWorker` waits up to `STARTUP_TIMEOUT_MS` = 30000 for `ready`). The merge lane P-2026-10-11-1056 stopped
`blocked` on `vitest: RED … 5 failed`; everything else is green. The app is not affected: the real worker posts
`ready` since S5b.

## WHAT

1. Run `npx vitest run src/codegen/oracle` on the branch and record the five timeouts.
2. Make `InProcessWorker` follow the S5b contract the way the runner tests' fake worker does: post `WORKER_READY`
   after construction (microtask), and handle a request that arrives before `ready` the same way. Reuse
   `WORKER_READY` from `runner/protocol.ts`; copy nothing else from the runner tests.
3. Gates: `src/codegen` and `src/model/simulation` suites all green (state the counts), `npx tsc --noEmit` (same set
   as base). Mutation (P11), in the commit body: the fixture never posts `ready` (the five tests fail again).
4. Commit `fix(codegen): the oracle tests' in-process worker posts ready`; log entry with the `log-entry` skill into
   `docs/log-inbox/codegen-ready.md` in a docs commit. Stop with `Outcome: done`. No merge.

## DOVE

`frontend/src/codegen/oracle/__tests__/exampleFixture.ts`, `docs/log-inbox/codegen-ready.md`.

## NON FARE

- No edit to `runner/`, to any product file, or to the tests' assertions and timeouts; no longer test timeout as a
  fix.
- No dependency, no `git add .`, no `git stash`, no push.

## RIFERIMENTI

- S5b and S6 log entries in `docs/log-inbox/`; R-GEN-11; `docs/PROTOCOL.md` P8, P11, P13, P14.
