# Code generation for 3.2, slice S7: generation limits and runner worker lockdown

Prompt-ID: P-2026-10-23-2145
Chat: C-2026-10-22-1050
Front: release-3-2
Lane: full (implementation; codegen engine and runner worker; no critical-zone file)
Depends: P-2026-10-23-2105
Status: eseguito 2026-10-23 · lane codegen · b588a2e28 · bench 8/8 killed, no expectation changed · lazy gate on green, off not run · visual check owed by the chat (RC-23)
Corregge: none
Request: Alfonso, 2026-10-23 20:06, in the project chat: limits on recursion, time and output in generation (it runs on the main thread), CSP for the runner worker

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-23_codegen_textmode_safety.md`). P8 replaced: the chat runs the visual check after the merge (RC-23).

Worktree: `~/jjodel-w-cgsafety`, branch `cg-safety`, at `a8a7fe18d` (S6, merged into the trunk at `8b0d4f76b`) plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show).

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-23-2145 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. No subagents, no background tasks. Commit as soon as the gates are green. One probe run per tool call. If the context gets heavy, write a handoff in the lane folder and stop with `Outcome: hard-stop`.

## Read first, and only this
The discovery report: §0, §4.1 to §4.3 (where generation runs, the limits, the worker today), the S7 row of §5, and rows R-GEN-28 and R-GEN-30 of §6. They are the specification of this slice.

## COSA
1. **Sticky budget (R-GEN-28).** A `GenerationBudget` created per `generate` call and passed to `registerTemplates` and the `OriginHost`: 2000 ms of `performance.now()` (clock injectable for tests) and 1,000,000 output characters. Checkpoints at each template call and each hole; the output length is carried by each Text (summed in `makeText`) and checked in `interpolate`, `concat`, `join` and after each call. Once tripped, every later checkpoint throws at once, so a hole's `catch` cannot let evaluation go on; `generate` reports exactly one error, at the call or hole that tripped it, and returns empty `code`. Messages: «Generation stopped after 2000 ms: template 'x' was still running» and «Generation stopped: the output passed 1,000,000 characters». Depth 64 stays as it is.
2. **Worker lockdown (R-GEN-30).** In `runner.worker.ts` only: add `Worker`, `SharedWorker`, `caches` to the removed names, and shadow `storage` on the navigator's prototype, under the existing «cannot remove, nothing runs» rule. No CSP change (hosting matter, out of this tree): write one ticket line in the log entry.
3. **Tests.** A fan-out template (two self-calls per level) stops with one error under an injected clock; the output cap trips at the bound and not one character before; a budget that tripped stays tripped across a hole's `catch`; a normal generation (the gallery Turnstile and Petri examples) gives byte-identical code and source map before and after; the worker test (or a unit test on its removal list) shows the four new names gone.
4. **Gates:** typecheck, build, `npx vitest run src/jjel src/codegen src/model/simulation src/components/editor-v2`, `npm run check:codegen-lazy` in the «on» mode, `check:docs`. No existing expectation may change; if one has to, list it and stop with `Outcome: question`.
5. **One docs commit:** the log entry in `docs/log-inbox/codegen.md`, with the CSP ticket line, and this prompt's `Status:` line.

## DOVE
`frontend/src/codegen/engine/generate.ts`, `templates.ts`, `origin.ts`, `text.ts`, `frontend/src/codegen/runner/runner.worker.ts`, their tests under `frontend/src/codegen/`; `docs/log-inbox/codegen.md`; this prompt file.

## NON FARE
No move of generation into a worker; no evaluator hook; no UI change; no change to `protocol.ts` timeouts; nothing in the critical zone; no new dependency. No push, no merge.
