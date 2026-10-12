# log-inbox — lane «codegen-oracle»

Entries written by the code generation S6 lane on `codegen-oracle` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — feat(codegen): oracle against the simulator, JS target profile, two lecture examples (P-2026-10-10-2029)
**Prompt**: `claude_2026-10-10_2029_prompt_codegen_s6_oracle.md`, full lane on `~/jjodel-w-codegen-oracle`, branch `codegen-oracle`: slice S6 of the pilot (R-GEN-11, R-GEN-15; spec §8, discovery §G, §I.4). Projection, per-step comparison and the replay against the simulator, two lecture examples with role-based templates, a probe; tests first, mutation bench. Stopped once with `Outcome: question`: no template could reach the S4 printer. Resumed with DOVE extended by the chat (R-GEN-16 provisional): `target` in `generate.ts`, a new `access.ts`.
**Files touched**: code `a40c39948`: `frontend/src/codegen/target/js/access.ts`, `frontend/src/codegen/target/js/__tests__/access.test.ts`, `frontend/src/codegen/oracle/{observe,oracle}.ts`, `frontend/src/codegen/oracle/__tests__/{observe,compare,examples}.test.ts`, `frontend/src/codegen/oracle/__tests__/exampleFixture.ts`, `frontend/src/codegen/examples/turnstile/{turnstile.json,README.md}`, `frontend/src/codegen/examples/petri-producer-consumer/{petri-producer-consumer.json,README.md}`, `frontend/scripts/probe/codegen-oracle.ts` (all new); `frontend/src/codegen/engine/generate.ts` (one context value), `frontend/src/codegen/ui/TemplateEditor.tsx` (one line). This docs commit: `docs/log-inbox/codegen-oracle.md` (new).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. The four new test files were red at import on `6288ec111` (4 of 4, no test collected), then 36 of 36. Gates on `a40c39948`: `npx tsc --noEmit` 14 errors, the same set as the base worktree; vitest `src/codegen` + `src/model/simulation` 35 files and 932 tests on the base, 39 files and 968 tests on the slice, all green; build exit 0; `check:codegen-lazy` ALL GREEN, generator modules outside the eager closure 12 → 16, the oracle's driver only in `assets/CodePanel-*.js`; `typecheck:scripts` and `check:scripts` exit 0. Bench 14 of 14 killed (commit body).
**Out-of-scope changes**: yes. Fifteen files, above five (RC-11, rule 19); all in the DOVE as the chat extended it, but two of them stretch it. `exampleFixture.ts` is a shared test helper under the declared `__tests__/`, not a `*.test.ts`. `access.test.ts` imports `simBridge.ts` from `components/` so it can compare against the bridge; the modules themselves import nothing from `components/`. Beyond the five fields the chat named, `target` has two more: `name`, and `equation(d)` for the derived values that DemoESM's guard reads.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe 29/29 on 3089; 4 crops in `~/.jjodel-lanes/P-2026-10-10-2029/crops/`, light theme, 536x489; the visual GO of the chat is pending)
**Notes**: DemoPetri deadlocks after 4 steps, so the Petri example is a producer-consumer net on DemoPetri's metamodel, built in a new model by the fixture's JjScript. Turnstile = DemoESM (derived `paid`). The hook `window.__jjodelOracle` loads by a side-effect import in TemplateEditor.tsx, the setting checked in oracle.ts; no panel button in this slice. `rm` of the gate's kept build `/tmp/codegen-lazy-1HGAOi` was denied: left in place.
**Prompt document name**: 2026-10-10 20:29

**Ticket** (follow-up): no path in the app installs an example. The READMEs write `genTemplates` from the browser console, and the scenario is recorded by hand. An importable `.jjodel` per example, or an import of a template set in the panel, would serve the lecture. In dev the first «Run» needs a 10000 ms timeout (S4's ticket, lane P-2026-10-10-2027).

## 2026-10-11 — merge: codegen-oracle into alfonso-frontend-jjtl (P-2026-10-11-1056)
**Prompt**: `claude_2026-10-11_1056_prompt_merge_codegen-oracle.md`, a direct merge by `lane-run merge --direct`, no session: `codegen-oracle` at `d8233842b` into `alfonso-frontend-jjtl`, merge base `f4c91bd71`, 4 commits on the branch side.
**Files touched**: merge `28c9b0aad`: 17 files from the branch side (the oracle module, the two lecture examples, the probe, the S6 prompt and log entry); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: yes, fixed. On `28c9b0aad` vitest had 5 failures: the oracle example tests timed out at 15000 ms because S6's in-process test worker never posted the `ready` that S5b's runner protocol (merged just before, P-2026-10-11-1049) waits for. Fixed in the test fixture by P-2026-10-11-1105, merged by P-2026-10-11-1112 (`42337a06f`, every gate green); the lane was resolved with `lane-run resolve`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat: RC-23 on the S6 crops (turnstile and Petri producer-consumer in the Output tab), GO by Alfonso 10:48
**Notes**: Rollback tag `pre-codegen-oracle` on `bc6894a22` (RC-31). `lane-run go` refuses a closure over a blocked lane, so the chat wrote this closure by hand after the resolve. Worker and gates: `~/.jjodel-lanes/P-2026-10-11-1056/result.json`.
**Prompt document name**: 2026-10-11 10:56
