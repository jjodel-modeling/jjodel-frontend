# Library seal guard in the reducer, report-only mode (slice S6, step 1)

Prompt-ID: P-2026-10-18-2130
Chat: C-2026-10-18-0110
Front: notation-library
Lane: full (critical zone: D-layer write path `redux/reducer/reducer.ts`)
Status: da eseguire
Request: Alfonso, 2026-10-18 21:28, «ok via libera» on the S6 guard (R-LIB-8)
Depends: P-2026-10-18-1735 (discovery), P-2026-10-18-1801 (S3 predicate, branch `library-seal`)
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Critical-zone go-ahead: granted by Alfonso on 2026-10-18 21:28 («ok via libera»), recorded as R-LIB-8, for `redux/reducer/reducer.ts` only and for the report-only mode only. The enforcing mode is a later lane.

Worktree: `~/jjodel-w-sealguard`, branch `library-seal-guard`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with branch `library-seal` (S3) merged into it by the chat, and `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -3`, `git status` match and `frontend/src/model/librarySeal.ts` exists; otherwise `Outcome: blocked`.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `xhigh`.

## Lane discipline
Every reply opens with `[P-2026-10-18-2130 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`. Unattended (RC-21, RC-25): take the recommended answer outside the RC-26 list and record it. Time limit 90 minutes. The discovery report `docs/discovery/discovery_2026-10-18_notation_library.md` (§3, §9 row S6, «Decisions taken (unattended)» 4 and 5) and the S3 section are the discovery; append a section «Seal guard S6 step 1 (P-2026-10-18-2130)».

## Step A — Layer Impact Report, then HARD STOP
Before any diff, write the Layer Impact Report of CLAUDE.md §3.2 to `docs/lir/lir_2026-10-18_library_seal_guard.md`, filled for this change: which actions cross the `CompositeActionReducer` loop (`reducer.ts:541-549`), which do not (`LoadAction` at `:523-524`, undo/redo at `:1163-1164`), what the guard reads (the S3 predicate on plain D-objects of the state before the action), the cost per action and how it is kept negligible on unsealed projects (one `_state` read on the DProject, short-circuit), failure behaviour (the guard never throws: any exception inside it is caught, logged once, and the action passes), the kill switch (a single constant or setting that turns the guard off), and the smoke scenarios affected. Commit the LIR alone (`docs(library): LIR for the S6 seal guard (P-2026-10-18-2130)`) and stop with `Outcome: hard-stop`. No diff under `frontend/src` before the chat's GO.

## Step B — report-only guard (after the GO)
1. In the loop, before each sub-action is applied, call a new function in a new module `frontend/src/redux/reducer/librarySealGuard.ts` that takes the state and the action, resolves the target and field the way the reducer does, asks `sealDecision` from `model/librarySeal.ts`, and in this step only **records** a would-refuse: one entry per action in an in-memory ring buffer (last 500) exposed for probes as `window.__jjodelSealReport` (dev and probe builds only), plus a single `console.debug` line per distinct target/field pair. It returns «allow» always in this step. The reducer change is the call site and nothing else.
2. Unsealed projects: the guard returns immediately after reading the DProject's `_state.libraryNotation`; measure the overhead on the `scene_4_DemoFlowB` fixture with a 1000-action replay and report it.
3. If the S3 allowlist needs fields the discovery did not name, do not edit it silently: record them in the report section with the action that wrote them; the chat decides.

## Checks (step B)
Typecheck, the existing reducer tests, the S3 tests and `npm run build` pass. A probe `frontend/scripts/probe/seal-guard-report.ts` via `lane-run probe` on its own port: build a sealed project (clone the gallery's StateMachine and set the S3 markers on the DProject and on its metamodel and viewpoint roots), run the M1 scenario (create objects of three classes, link them, move and resize vertices, open the simulator and fire two steps, run code generation if the build flag allows it, save and reopen), and report `__jjodelSealReport`: the expected result is zero entries. Then a control run that performs three M2 writes through JjScript (create a class, set a name, delete an attribute) and through the proxy: the expected result is one entry for each, and the M2 is actually changed (report-only). Then the same scenario on an unsealed project: zero entries and identical final state to the trunk.

## Commits (P13), explicit pathspecs
1. The LIR (step A).
2. `feat(library): seal guard in the reducer, report-only (S6 step 1, P-2026-10-18-2130)`: `reducer.ts` call site, `librarySealGuard.ts`, its unit tests.
3. The probe and its results under `docs/discovery/assets/library-seal-guard/`.
4. Report section, log entry in `docs/log-inbox/notation-library.md` and Status flip: left uncommitted for the chat's closure commit.

No push, no merge (RC-19): the branch reaches the trunk after the 3.2 release (R-LIB-8). `Outcome: hard-stop` after step B.

## NON FARE
No refusal of any action in this lane. No change to `LoadAction`, undo/redo, `useJjomSync.ts`, `portDistribution.ts`, the proxy, JjScript or Jodie. No edit of `model/librarySeal.ts` beyond what a failing test of its own proves wrong (report it). No UI.

## RIFERIMENTI
`docs/decisions.md` R-LIB-2, R-LIB-8; `docs/discovery/discovery_2026-10-18_notation_library.md` §3; `CLAUDE.md` §3.1, §3.2; `frontend/src/redux/reducer/reducer.ts:523-549, 1163-1164`; `frontend/src/model/librarySeal.ts`; `frontend/src/joiner/classes.ts:616, 812, 1021` (bookkeeping writes on M2).
