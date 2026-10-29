# Code generation for 3.2, slice S5: template bodies in text mode

Prompt-ID: P-2026-10-23-2030
Chat: C-2026-10-22-1050
Front: release-3-2
Lane: full (implementation; JjEL lexer and parser entry point, codegen engine and UI; no critical-zone file)
Depends: P-2026-10-23-2010
Status: eseguito 2026-10-23 · lane codegen · c90c22d0f, 3b89efd49, 6024127a4 · lazy gate on green, off not run · converter counts 4/13 and 5/12, not 3
Corregge: none
Request: Alfonso, 2026-10-23 20:06, in the project chat: template bodies in text mode by default (no outer quotes, `${…}` holes), an additive `mode` field in the record, absence meaning expression, so saved templates stay valid

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-23_codegen_textmode_safety.md`). P8 replaced: the chat runs the visual check after the merge (RC-23).

Worktree: `~/jjodel-w-cgsafety`, branch `cg-safety`, at the discovery commit `84b057765` plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show).

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-23-2030 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. No subagents, no background tasks. Commit as soon as the gates are green, in more than one commit (JjEL entry point, engine and codec, UI). One probe run per tool call. Dev server for your own checks: `npm start -- --port 3122 --strictPort`, stopped before you exit. If the context gets heavy, write a handoff in the lane folder and stop with `Outcome: hard-stop`.

## Read first, and only this
The discovery report: §0, §2 (text mode: what exists, the specification, the test plan T1 to T5), the S5 row of §5 and the rows of §6 that concern text mode. They are the specification of this slice.

## COSA
1. `parseTemplateText` beside `parseTemplate` (lexer option `textBody`: inside the string from offset 0, `"` literal, end of input closes, the only escape `\${`), returning positions already in body coordinates.
2. Record field `mode?: 'text' | 'expression'`, written only when present; absence reads as expression. New templates created in the Code panel and in the Template Editor default to `text`. The codec, generation and origins dispatch on the mode.
3. Template Editor and in-panel editor: a mode toggle; the Monarch grammar highlights text mode (literal text, `${…}` holes as JjEL); Monaco's auto-closing of `"` off in text mode; markers from `parseTemplateText` at the body's own line and column. The converter `templateMode.ts`: expression to text when the body is one string literal, text to expression always; refuse otherwise with a message.
4. Also check, and fix if real, two findings of the chat's visual check of S2: Revert did not restore the body of a draft in the Template Editor (the chat read the body right after the click, so it may be a render delay); in expression mode a new template starts as `""` and Monaco auto-closes the quote, leaving a stray `"` when the user types the opening quote.
5. Tests T1 to T5 of §2.3, the byte-identical check of every saved template (both gallery examples untouched), the converter rows. Gates: typecheck, build, `npx vitest run src/jjel src/codegen`, `npm run check:codegen-lazy` in the «on» mode.
6. One docs commit: the log entry in `docs/log-inbox/codegen.md`, this prompt's `Status:` line.

## DOVE
The files of the S5 row of §5 of the report (`jjel/lexer/lexer.ts`, `jjel/parser/parser.ts`, `jjel/index.ts`, new `jjel/__tests__/templateText.test.ts`; `codegen/engine/templates.ts`, `templateCodec.ts`, `origin.ts`; `codegen/ui/templateMarkers.ts`, `templateLanguage.ts`, `templateDrafts.ts`, `TemplateEditorTab.tsx`, `TemplateEditor.tsx`, `CodePanel.tsx`, new `templateMode.ts`, their tests), `docs/log-inbox/codegen.md`, this prompt file.

## NON FARE
No JjEL member guard (slice S6), no limits or worker changes (S7), no preview (S3), no completion (S4); no change to the evaluator's semantics for expression bodies; nothing in the critical zone; no new dependency. No push, no merge.
