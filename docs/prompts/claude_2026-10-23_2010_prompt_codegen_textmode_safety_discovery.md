# Code generation for 3.2: template bodies in text mode, and the safety of generation (discovery)

Prompt-ID: P-2026-10-23-2010
Chat: C-2026-10-22-1050
Front: release-3-2
Lane: full (discovery, Phase 1 read-only, then hard stop; feeds the slices after S2 of P-2026-10-23-1840)
Depends: P-2026-10-23-1945
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-23 20:06, in the project chat: two requests for the code generation front, from trying an SQL generator on an ERD metamodel: (1) template bodies in text mode by default (no outer quotes, `${…}` holes), with an additive `mode` field in the record, absence meaning expression, so saved templates stay valid; to be decided now that the Template Editor exists, freeze on the 27th; (2) safety: recursion, time and output limits in generation (it runs on the main thread), prototype reads in JjEL (`getProperty` uses `property in obj`, so `x.constructor` and `x["__proto__"]` are readable although no native function can be called), CSP for the runner's worker. A read-only discovery draft by another chat (P-...-1900, not available to this chat) was asked to be adapted to the front release-3-2 and to slices S1/S2; this prompt replaces it.

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-cgsafety`, branch `cg-safety`, created by the chat from `alfonso-frontend-jjtl` after the merge of S2 (`3ec827587`). Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show).

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-23-2010 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. No subagents, no background tasks. Read-only: no code change. The report goes to `docs/discovery/discovery_2026-10-23_codegen_textmode_safety.md` (P16: «## 0. Answer in brief» first, at most 40 lines), committed with this prompt's `Status:` line and a log entry in `docs/log-inbox/codegen.md`.

## Context
On the trunk: S1 (Code panel on M2, `a7f34edc4`) and S2 (Template Editor dock tab, `3ec827587`: `codegen/ui/TemplateEditorTab.tsx`, `templateLanguage.ts` Monarch grammar for `jjel-template`, `templateMarkers.ts`, `templateDrafts.ts`, `openTemplateEditor.ts`). Plan of `docs/discovery/discovery_2026-10-23_codegen_authoring.md` §4: S3 live preview, S4 completion, freeze Tuesday 2026-10-27, tag Thursday 2026-10-29. Templates persist in the metamodel `_state` key `genTemplates` (R-GEN-12); a template is a JjEL function with interpolation, its body today an expression, usually one `"…${…}…"` string (R-GEN-4, R-GEN-10: lexer option `interpolation`, `parseTemplate`). R-GEN-3: persistence is additive, no `irVersion` bump, no VersionFixer migration.

## COSA (read and plan, no code)
1. **Text mode.** Specify a body mode `text` where the body is literal text with `${…}` holes and no outer quotes (escaping of a literal `${`, newlines, indentation per R-GEN-4's block indentation), and `expression` as today. Record field `mode?: 'text' | 'expression'`, absence read as `expression`, so every saved template keeps its meaning; new templates created in the panel and in the Template Editor default to `text`. Name the parse path (wrap the text as an interpolated string, or a `parseTemplateText` entry point), how error positions map back to the body's line and column for `templateMarkers`, what the Monarch grammar and the in-panel editor need, the toggle in the editor, the conversion of an existing expression template to text when it is one string literal, and the two gallery examples (keep them as they are or convert). Confirm with a test plan that every template saved today still generates byte-identical output.
2. **Limits.** Measure where generation runs (main thread for Generate, worker for Run?) and propose limits: maximum recursion depth of template calls, a time budget, a maximum output size, each with the error the panel shows and where the check sits (`codegen/engine/generate.ts` and its callers). Say whether a time budget is enforceable on the main thread without a worker, and what moving Generate to the worker would cost before the freeze.
3. **JjEL prototype reads.** Reproduce the reads: `getProperty` with `property in obj` makes `x.constructor`, `x.__proto__`, `x["__proto__"]`, `x.constructor.name` readable. List every evaluator path that resolves a member (dot, `?.`, index, interpolation holes) and propose the guard: own-or-declared properties only, a deny list (`__proto__`, `constructor`, `prototype`, `__defineGetter__` family), or both; state its impact on validation rules, viewpoints and the simulator that use the same evaluator, and the tests that would pin it.
4. **CSP for the runner's worker.** How the worker is created today (`runner.worker`, blob or module URL), what it can reach (fetch, importScripts, WebSocket, the parent's globals), and what a CSP or an equivalent in-worker lockdown can enforce under the current Vite build and hosting; what needs the backend or the hosting headers and is therefore outside 3.2.
5. **Slices and cuts.** Two or three slices that fit Saturday to Monday alongside S3 and S4, with DOVE, gates, probes and visual check; a joint order with S3 and S4; the cut order if time runs short. Recommended floor for 3.2: text mode and the JjEL guard; say if you disagree.
6. **Decisions.** Recommended choices as provisional rows (R-GEN-25 onwards) in the report only; list what needs Alfonso (RC-26).

## DOVE
Read anything under `frontend/src/codegen/`, `frontend/src/jjel/`, the runner worker and its build config; write only the report, `docs/log-inbox/codegen.md` and this prompt file.

## HARD STOP
After the report is committed: `Outcome: hard-stop`.
