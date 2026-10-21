# Library seal guard, report-only: continuation after the context ceiling (slice S6, step 1, session 2)

Prompt-ID: P-2026-10-18-2215
Chat: C-2026-10-18-0110
Front: notation-library
Lane: full (critical zone: D-layer write path `redux/reducer/reducer.ts`)
Status: da eseguire
Request: continuation of P-2026-10-18-2130, which stopped at the AM-8 context ceiling (RC-49) with a handoff
Depends: P-2026-10-18-2130 (LIR `07750a6ca`, handoff `~/.jjodel-lanes/P-2026-10-18-2130/handoff.md` and `handoff.diff`)
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Critical-zone go-ahead: Alfonso, 2026-10-18 21:28, «ok via libera», recorded as R-LIB-8, for `redux/reducer/reducer.ts` only and for the report-only mode only; LIR `docs/lir/lir_2026-10-18_library_seal_guard.md` reviewed and accepted by the chat (GO of 21:47, `~/.jjodel-lanes/P-2026-10-18-2130/msg-*.md`). This lane carries both unchanged.

Worktree: `~/jjodel-w-sealguard`, branch `library-seal-guard`, HEAD `07750a6ca` plus this prompt cherry-picked by the chat. Expected `git status`: `M frontend/src/redux/reducer/reducer.ts`, `?? frontend/src/redux/reducer/librarySealGuard.ts`, `?? frontend/src/redux/reducer/__tests__/librarySealGuard.test.ts` (the previous session's uncommitted work, identical to `handoff.diff`). Verify that match before anything else; otherwise `Outcome: blocked`.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `xhigh`.

## Lane discipline
Every reply opens with `[P-2026-10-18-2215 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. Read first, in this order, and nothing else of the previous session: `~/.jjodel-lanes/P-2026-10-18-2130/handoff.md`, the prompt `docs/prompts/claude_2026-10-18_2130_prompt_library_seal_guard_report_only.md` (§Step B, §Checks, §Commits, §NON FARE apply unchanged), the GO message of 21:47 and the LIR. Keep the context lean (CLAUDE.md §0.1): read long files with offset/limit only.

## Decision adopted by the chat (RC-21)
The probe's sealed project is `frontend/public/examples/codegen/turnstile.jjodel`, as the handoff recommends (the gallery's StateMachine is on another branch). Seal it in the probe by setting the S3 markers on its DProject and on its metamodel and viewpoint roots.

## What remains (from the handoff)
Fix the failing test (`stateOf(true, undefined)` default-parameter bug) and confirm the test-file count; the overhead measurement on `scene_4_DemoFlowB`; `npm run build`; commits 2 and 3 of the 2130 prompt; the probe `frontend/scripts/probe/seal-guard-report.ts` with its three runs (sealed M1 scenario: zero entries with a non-zero judged count; control M2 writes via JjScript and proxy: one entry each; unsealed run identical); the report section «Seal guard S6 step 1», listing the LIR §7.3 candidates actually seen; log entry and Status flip of both prompts left uncommitted for the chat's closure. Commit messages carry `P-2026-10-18-2130/2215`.

No push, no merge (RC-19; the branch reaches the trunk after the 3.2 release, R-LIB-8). `Outcome: hard-stop` at the end.
