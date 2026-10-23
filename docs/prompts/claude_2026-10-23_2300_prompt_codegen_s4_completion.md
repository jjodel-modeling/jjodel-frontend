# Code generation for 3.2, slice S4: completion in the Template Editor

Prompt-ID: P-2026-10-23-2300
Chat: C-2026-10-22-1050
Front: release-3-2
Lane: full (implementation; codegen UI only; no critical-zone file)
Depends: P-2026-10-23-2225
Status: eseguito 2026-10-23 · lane codegen · 666740aa0 · bench 12/12 killed, no expectation changed · param class from call sites only, `self.` offers nothing (unbound in templates) · lazy gate on green, off not run · merged 3b5901f05 by C-2026-10-23-2009 (front codegen), gates green on the trunk (typecheck, vitest src/codegen 2159, lazy on, build) · visual check by the chat 2026-10-23 on DemoPetri copy: text outside a hole offers nothing, a hole offers p, the five classes, stc, target and the template, stc. lists its 11 members with calls; parameter-class features not exercised (no typed call site), test template deleted and saved
Corregge: none
Request: Alfonso, 2026-10-23, in the project chat: «scrivere le template in quella finestra è un po' scomodo» and «mettiamo il template editor in 3.2»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-23_codegen_authoring.md`). P8 replaced: the chat runs the visual check after the merge (RC-23).

Worktree: `~/jjodel-w-cgsafety`, branch `cg-safety`, at `2c755f60d` (S3, merged into the trunk at `d5b995bea`) plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show).

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-23-2300 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. No subagents, no background tasks. Commit as soon as the gates are green. One probe run per tool call. If the context gets heavy, write a handoff in the lane folder and stop with `Outcome: hard-stop`.

## Read first, and only this
`discovery_2026-10-23_codegen_authoring.md`: §3.2 (the dead JjTL completion provider as precedent: a module-level context set by the open editor, `setCompletionContext`, a `CompletionItemProvider` with trigger characters), the S4 row of §4, the paragraph on completion's metamodel side after §4, R-GEN-24. Then `discovery_2026-10-23_codegen_textmode_safety.md`, R-GEN-26 (the `jjel-template-text` language). Then the current `templateLanguage.ts` and `TemplateEditorTab.tsx`.

## COSA
1. **`codegen/ui/templateCompletion.ts` (new):** a pure context builder over the metamodel (classes; features of a class, inherited ones included; templates with their parameters; `stc.` and `target.` members as the discovery lists them) and a `CompletionItemProvider` registered once for both `jjel-template` and `jjel-template-text`, reading a module-level context the open Template Editor sets and clears.
2. **Where it offers:** in text mode only inside a `${…}` hole (outside a hole it returns nothing); in expression mode anywhere outside a string literal's text part. After `.` it offers the features of the receiver's class when the receiver is `self` or a template parameter whose class is known, else nothing (no guessing). A template name inserts its call with parameter placeholders (snippet).
3. **Tests:** the builder over a fixture lookup (classes; features after `.`, inherited ones included; templates with params; `stc.`/`target.`); the hole detection in text mode (inside, outside, after a closed hole, escaped `\${`); a mutation bench on the builder (kills: inherited features missing, offer outside a hole in text mode).
4. **Gates:** typecheck, build, `npx vitest run src/codegen src/components/editor-v2`, `npm run check:codegen-lazy` in the «on» mode, `check:docs`. No existing expectation may change; if one has to, list it and stop with `Outcome: question`.
5. **One docs commit:** log entry in `docs/log-inbox/codegen.md` and this prompt's `Status:` line.

## DOVE
New `frontend/src/codegen/ui/templateCompletion.ts` + test, `templateLanguage.ts`, `TemplateEditorTab.tsx` (set and clear the context only); `docs/log-inbox/codegen.md`; this prompt file.

## NON FARE
No completion in the Code panel's inline editor; no revival or change of the JjTL completion files; no change to the engine, parser or lexer; nothing in the critical zone; no new dependency. No push, no merge.
